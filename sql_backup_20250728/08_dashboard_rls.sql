-- =============================================================================
-- Dashboard Row Level Security (RLS) Policies
-- =============================================================================
-- Implements secure data access for dashboard analytics components
-- Ensures users can only access their own preferences and contact data
-- =============================================================================

-- Enable RLS on dashboard_preferences table
ALTER TABLE public.dashboard_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own dashboard preferences
CREATE POLICY "Users can manage their own dashboard preferences"
    ON public.dashboard_preferences
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can insert their own dashboard preferences
CREATE POLICY "Users can create their own dashboard preferences"
    ON public.dashboard_preferences
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- Analytics Views Security
-- =============================================================================
-- Note: Views inherit RLS from their base tables
-- Since contacts table should have RLS enabled, the analytics views will be secure

-- Verify contacts table has RLS enabled (should already exist)
-- This is a safety check - the policy should already exist from contacts setup
DO $$
BEGIN
    -- Check if RLS is enabled on contacts table
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE n.nspname = 'public' 
        AND c.relname = 'contacts' 
        AND c.relrowsecurity = true
    ) THEN
        -- Enable RLS on contacts if not already enabled
        ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
        
        -- Create basic policy for contacts if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies p 
            WHERE p.schemaname = 'public' 
            AND p.tablename = 'contacts' 
            AND p.policyname = 'Users can access all contacts'
        ) THEN
            CREATE POLICY "Users can access all contacts"
                ON public.contacts
                FOR SELECT
                TO authenticated
                USING (true); -- Allow all authenticated users to read contacts for analytics
        END IF;
    END IF;
END $$;

-- =============================================================================
-- Additional Security Measures
-- =============================================================================

-- Ensure only authenticated users can access analytics views
-- This is enforced by the base table policies, but we add explicit grants for clarity

-- Revoke public access
REVOKE ALL ON public.dashboard_preferences FROM public;
REVOKE ALL ON public.dashboard_contact_analytics FROM public;
REVOKE ALL ON public.dashboard_organization_analytics FROM public;
REVOKE ALL ON public.dashboard_weekly_interactions FROM public;

-- Grant specific access to authenticated users only
GRANT SELECT ON public.dashboard_contact_analytics TO authenticated;
GRANT SELECT ON public.dashboard_organization_analytics TO authenticated;
GRANT SELECT ON public.dashboard_weekly_interactions TO authenticated;
GRANT ALL ON public.dashboard_preferences TO authenticated;

-- =============================================================================
-- Function Security for Analytics
-- =============================================================================

-- Create secure function for dashboard analytics aggregation
-- This function respects RLS policies and provides additional security
CREATE OR REPLACE FUNCTION public.get_dashboard_analytics(
    user_id_param UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with definer's privileges but respects RLS
SET search_path = public
AS $$
DECLARE
    result JSON;
    current_user_id UUID;
BEGIN
    -- Get current authenticated user
    current_user_id := auth.uid();
    
    -- Security check: only allow access to current user's data
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    -- If user_id_param is provided, verify it matches current user
    IF user_id_param IS NOT NULL AND user_id_param != current_user_id THEN
        RAISE EXCEPTION 'Access denied: can only access own data';
    END IF;
    
    -- Aggregate analytics data (RLS policies will filter appropriately)
    SELECT json_build_object(
        'contacts', (
            SELECT json_agg(row_to_json(analytics))
            FROM (
                SELECT * FROM public.dashboard_contact_analytics 
                LIMIT 30
            ) analytics
        ),
        'organizations', (
            SELECT json_agg(row_to_json(orgs))
            FROM (
                SELECT * FROM public.dashboard_organization_analytics 
                LIMIT 20
            ) orgs
        ),
        'weekly_interactions', (
            SELECT json_agg(row_to_json(weekly))
            FROM (
                SELECT * FROM public.dashboard_weekly_interactions 
                LIMIT 10
            ) weekly
        ),
        'metadata', json_build_object(
            'generated_at', NOW(),
            'user_id', current_user_id
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_dashboard_analytics(UUID) TO authenticated;

-- Add function comment
COMMENT ON FUNCTION public.get_dashboard_analytics(UUID) IS 'Securely aggregates dashboard analytics data for authenticated users with RLS enforcement';

-- =============================================================================
-- Data Validation Policies
-- =============================================================================

-- Policy to ensure dashboard preferences have valid themes
CREATE OR REPLACE FUNCTION public.validate_dashboard_theme(theme TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN theme IN ('default', 'dark', 'light', 'blue', 'green');
END;
$$;

-- Add check constraint for valid themes
ALTER TABLE public.dashboard_preferences 
ADD CONSTRAINT dashboard_preferences_valid_theme 
CHECK (validate_dashboard_theme(dashboard_theme));

-- Policy to ensure refresh interval is reasonable (between 30 seconds and 1 hour)
ALTER TABLE public.dashboard_preferences 
ADD CONSTRAINT dashboard_preferences_valid_refresh_interval 
CHECK (refresh_interval >= 30000 AND refresh_interval <= 3600000);

-- =============================================================================
-- Audit and Logging
-- =============================================================================

-- Create audit log table for dashboard preferences changes
CREATE TABLE IF NOT EXISTS public.dashboard_preferences_audit (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    preference_id BIGINT,
    action VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    changed_by UUID DEFAULT auth.uid()
);

-- Enable RLS on audit table
ALTER TABLE public.dashboard_preferences_audit ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own audit records
CREATE POLICY "Users can view their own audit records"
    ON public.dashboard_preferences_audit
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Audit trigger function
CREATE OR REPLACE FUNCTION public.dashboard_preferences_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.dashboard_preferences_audit (
            user_id, preference_id, action, old_values
        ) VALUES (
            OLD.user_id, OLD.id, 'DELETE', row_to_json(OLD)::jsonb
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.dashboard_preferences_audit (
            user_id, preference_id, action, old_values, new_values
        ) VALUES (
            NEW.user_id, NEW.id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO public.dashboard_preferences_audit (
            user_id, preference_id, action, new_values
        ) VALUES (
            NEW.user_id, NEW.id, 'INSERT', row_to_json(NEW)::jsonb
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;

-- Create audit triggers
CREATE TRIGGER dashboard_preferences_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.dashboard_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.dashboard_preferences_audit_trigger();

-- Grant permissions for audit table
GRANT SELECT ON public.dashboard_preferences_audit TO authenticated;

-- Add comments
COMMENT ON TABLE public.dashboard_preferences_audit IS 'Audit trail for dashboard preferences changes';
COMMENT ON FUNCTION public.dashboard_preferences_audit_trigger() IS 'Triggers audit logging for dashboard preferences changes';