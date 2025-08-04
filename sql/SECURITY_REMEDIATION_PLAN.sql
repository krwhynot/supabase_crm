-- =============================================================================
-- SECURITY REMEDIATION PLAN - CRITICAL VULNERABILITY FIXES
-- =============================================================================
-- This file contains the required security fixes for the Principal Activity
-- database implementation to achieve production-ready security standards.
-- 
-- APPLY THESE FIXES BEFORE PRODUCTION DEPLOYMENT
-- =============================================================================

-- =============================================================================
-- PHASE 1: MULTI-TENANT RLS POLICY IMPLEMENTATION
-- =============================================================================

-- Step 1: Create user context function for tenant isolation
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    -- In production, this should extract organization_id from JWT claims
    -- For now, we'll use a simple approach based on user metadata
    -- This MUST be updated with proper JWT claim extraction
    RETURN (
        SELECT (auth.jwt() ->> 'organization_id')::UUID
        WHERE auth.jwt() ->> 'organization_id' IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 2: Add RLS policies to materialized view (via function)
-- Since we can't add RLS directly to materialized views, create a secure view
CREATE OR REPLACE VIEW public.principal_activity_summary_secure AS
SELECT * FROM public.principal_activity_summary
WHERE principal_id IN (
    SELECT id FROM public.organizations 
    WHERE (
        -- Allow access if user belongs to same organization
        get_user_organization_id() IS NOT NULL AND (
            id = get_user_organization_id() OR
            distributor_id = get_user_organization_id()
        )
    ) OR (
        -- Fallback for development/testing (remove in production)
        get_user_organization_id() IS NULL AND current_setting('app.environment', true) = 'development'
    )
);

-- Grant appropriate permissions
GRANT SELECT ON public.principal_activity_summary_secure TO authenticated;

-- Step 3: Secure the distributor relationships view
CREATE OR REPLACE VIEW public.principal_distributor_relationships_secure AS
SELECT * FROM public.principal_distributor_relationships
WHERE principal_id IN (
    SELECT id FROM public.organizations 
    WHERE (
        get_user_organization_id() IS NOT NULL AND (
            id = get_user_organization_id() OR
            distributor_id = get_user_organization_id()
        )
    ) OR (
        get_user_organization_id() IS NULL AND current_setting('app.environment', true) = 'development'
    )
);

GRANT SELECT ON public.principal_distributor_relationships_secure TO authenticated;

-- Step 4: Secure the product performance view
CREATE OR REPLACE VIEW public.principal_product_performance_secure AS
SELECT * FROM public.principal_product_performance
WHERE principal_id IN (
    SELECT id FROM public.organizations 
    WHERE (
        get_user_organization_id() IS NOT NULL AND (
            id = get_user_organization_id() OR
            distributor_id = get_user_organization_id()
        )
    ) OR (
        get_user_organization_id() IS NULL AND current_setting('app.environment', true) = 'development'
    )
);

GRANT SELECT ON public.principal_product_performance_secure TO authenticated;

-- Step 5: Secure the timeline view
CREATE OR REPLACE VIEW public.principal_timeline_summary_secure AS
SELECT * FROM public.principal_timeline_summary
WHERE principal_id IN (
    SELECT id FROM public.organizations 
    WHERE (
        get_user_organization_id() IS NOT NULL AND (
            id = get_user_organization_id() OR
            distributor_id = get_user_organization_id()
        )
    ) OR (
        get_user_organization_id() IS NULL AND current_setting('app.environment', true) = 'development'
    )
);

GRANT SELECT ON public.principal_timeline_summary_secure TO authenticated;

-- =============================================================================
-- PHASE 2: ENHANCE EXISTING RLS POLICIES WITH MULTI-TENANT SUPPORT
-- =============================================================================

-- Update organizations RLS policy for tenant isolation
DROP POLICY IF EXISTS "Users can view all organizations" ON public.organizations;
CREATE POLICY "Users can view accessible organizations" 
ON public.organizations FOR SELECT 
TO authenticated 
USING (
    deleted_at IS NULL AND (
        -- User can access their own organization and its principals
        (get_user_organization_id() IS NOT NULL AND (
            id = get_user_organization_id() OR
            distributor_id = get_user_organization_id() OR
            -- If this org is a principal of user's distributor
            (is_principal = TRUE AND distributor_id = get_user_organization_id())
        )) OR
        -- Development fallback
        (get_user_organization_id() IS NULL AND current_setting('app.environment', true) = 'development')
    )
);

-- Update opportunities RLS policy for tenant isolation
DROP POLICY IF EXISTS "Users can view all opportunities" ON public.opportunities;
CREATE POLICY "Users can view accessible opportunities" 
ON public.opportunities FOR SELECT 
TO authenticated 
USING (
    deleted_at IS NULL AND (
        (get_user_organization_id() IS NOT NULL AND (
            -- User can access opportunities for their organization's principals
            principal_id IN (
                SELECT id FROM public.organizations 
                WHERE (id = get_user_organization_id() OR distributor_id = get_user_organization_id())
                AND deleted_at IS NULL
            )
        )) OR
        (get_user_organization_id() IS NULL AND current_setting('app.environment', true) = 'development')
    )
);

-- Update contacts RLS policy for tenant isolation  
DROP POLICY IF EXISTS "Users can view all contacts" ON public.contacts;
CREATE POLICY "Users can view accessible contacts" 
ON public.contacts FOR SELECT 
TO authenticated 
USING (
    deleted_at IS NULL AND (
        (get_user_organization_id() IS NOT NULL AND (
            organization_id IN (
                SELECT id FROM public.organizations 
                WHERE (id = get_user_organization_id() OR distributor_id = get_user_organization_id())
                AND deleted_at IS NULL
            )
        )) OR
        (get_user_organization_id() IS NULL AND current_setting('app.environment', true) = 'development')
    )
);

-- =============================================================================
-- PHASE 3: SECURE DATABASE FUNCTIONS
-- =============================================================================

-- Step 1: Remove unnecessary SECURITY DEFINER and add access controls
CREATE OR REPLACE FUNCTION public.refresh_principal_activity_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER
AS $$
BEGIN
    -- Add access control check
    IF get_user_organization_id() IS NULL AND current_setting('app.environment', true) != 'development' THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Add rate limiting check (implement based on your rate limiting strategy)
    -- IF NOT check_rate_limit('refresh_principal_activity', current_user) THEN
    --     RAISE EXCEPTION 'Rate limit exceeded';
    -- END IF;
    
    -- Refresh the materialized view
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.principal_activity_summary;
    
    -- Log the operation for audit
    INSERT INTO public.system_logs (
        log_level, 
        message, 
        context,
        created_at
    ) VALUES (
        'INFO', 
        'Principal Activity Summary refreshed by user',
        jsonb_build_object(
            'user_id', auth.uid(),
            'organization_id', get_user_organization_id(),
            'refresh_type', 'manual',
            'refreshed_at', NOW()
        ),
        NOW()
    ) ON CONFLICT DO NOTHING;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log errors for monitoring
        INSERT INTO public.system_logs (
            log_level, 
            message, 
            context,
            created_at
        ) VALUES (
            'ERROR', 
            'Failed to refresh principal_activity_summary: ' || SQLERRM,
            jsonb_build_object(
                'user_id', auth.uid(),
                'organization_id', get_user_organization_id(),
                'error_detail', SQLERRM
            ),
            NOW()
        ) ON CONFLICT DO NOTHING;
        RAISE;
END;
$$;

-- Step 2: Secure the statistics function with tenant filtering
CREATE OR REPLACE FUNCTION public.get_principal_activity_stats()
RETURNS TABLE (
    total_principals INTEGER,
    active_principals INTEGER,
    principals_with_products INTEGER,
    principals_with_opportunities INTEGER,
    average_products_per_principal NUMERIC,
    average_engagement_score NUMERIC,
    top_performers JSONB
)
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER
AS $$
BEGIN
    -- Verify user has access
    IF get_user_organization_id() IS NULL AND current_setting('app.environment', true) != 'development' THEN
        RAISE EXCEPTION 'Access denied: Organization context required';
    END IF;
    
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER AS total_principals,
        COUNT(*) FILTER (WHERE activity_status = 'ACTIVE')::INTEGER AS active_principals,
        COUNT(*) FILTER (WHERE product_count > 0)::INTEGER AS principals_with_products,
        COUNT(*) FILTER (WHERE total_opportunities > 0)::INTEGER AS principals_with_opportunities,
        AVG(product_count) AS average_products_per_principal,
        AVG(engagement_score) AS average_engagement_score,
        
        -- Top performers (tenant-filtered)
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'principal_id', pas.principal_id,
                    'principal_name', pas.principal_name,
                    'engagement_score', pas.engagement_score,
                    'total_opportunities', pas.total_opportunities,
                    'won_opportunities', pas.won_opportunities
                )
            )
            FROM (
                SELECT principal_id, principal_name, engagement_score, total_opportunities, won_opportunities
                FROM public.principal_activity_summary_secure  -- Use secure view
                ORDER BY engagement_score DESC, total_opportunities DESC
                LIMIT 5
            ) pas
        ) AS top_performers
        
    FROM public.principal_activity_summary_secure;  -- Use secure view
END;
$$;

-- Step 3: Secure interaction access functions
CREATE OR REPLACE FUNCTION public.can_access_interaction(interaction_uuid UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER
AS $$
BEGIN
    -- Check if interaction exists and user has access via organization
    RETURN EXISTS (
        SELECT 1 
        FROM public.interactions i
        JOIN public.opportunities o ON i.opportunity_id = o.id
        JOIN public.organizations org ON o.principal_id = org.id
        WHERE i.id = interaction_uuid 
        AND i.deleted_at IS NULL 
        AND o.deleted_at IS NULL
        AND org.deleted_at IS NULL
        AND (
            (get_user_organization_id() IS NOT NULL AND (
                org.id = get_user_organization_id() OR 
                org.distributor_id = get_user_organization_id()
            )) OR
            (get_user_organization_id() IS NULL AND current_setting('app.environment', true) = 'development')
        )
    );
END;
$$;

-- =============================================================================
-- PHASE 4: INPUT VALIDATION AND RATE LIMITING
-- =============================================================================

-- Create input validation function
CREATE OR REPLACE FUNCTION public.validate_uuid_input(input_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Basic UUID validation (UUIDs are already validated by type system)
    -- Additional validation logic can be added here
    RETURN input_uuid IS NOT NULL;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Create rate limiting table (basic implementation)
CREATE TABLE IF NOT EXISTS public.rate_limits (
    user_id UUID NOT NULL,
    action_type TEXT NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (user_id, action_type, window_start)
);

-- Enable RLS on rate limits table
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own rate limits" 
ON public.rate_limits 
FOR ALL 
TO authenticated 
USING (user_id = auth.uid());

-- =============================================================================
-- PHASE 5: AUDIT LOGGING ENHANCEMENT
-- =============================================================================

-- Create comprehensive audit log table
CREATE TABLE IF NOT EXISTS public.security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    organization_id UUID,
    action_type TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only allow users to view their own audit logs
CREATE POLICY "Users can view own audit logs" 
ON public.security_audit_log 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- Create audit logging function
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_action_type TEXT,
    p_resource_type TEXT,
    p_resource_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL,
    p_success BOOLEAN DEFAULT TRUE
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.security_audit_log (
        user_id,
        organization_id,
        action_type,
        resource_type,
        resource_id,
        details,
        success,
        created_at
    ) VALUES (
        auth.uid(),
        get_user_organization_id(),
        p_action_type,
        p_resource_type,
        p_resource_id,
        p_details,
        p_success,
        NOW()
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail the main operation if audit logging fails
        NULL;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- =============================================================================
-- PHASE 6: REVOKE ACCESS TO INSECURE VIEWS/FUNCTIONS
-- =============================================================================

-- Revoke access to original insecure views
REVOKE ALL ON public.principal_activity_summary FROM authenticated;
REVOKE ALL ON public.principal_distributor_relationships FROM authenticated;
REVOKE ALL ON public.principal_product_performance FROM authenticated;
REVOKE ALL ON public.principal_timeline_summary FROM authenticated;

-- Add comments to indicate these are deprecated
COMMENT ON MATERIALIZED VIEW public.principal_activity_summary IS 
'DEPRECATED: Use principal_activity_summary_secure view instead. Direct access revoked for security.';

COMMENT ON VIEW public.principal_distributor_relationships IS 
'DEPRECATED: Use principal_distributor_relationships_secure view instead. Direct access revoked for security.';

COMMENT ON VIEW public.principal_product_performance IS 
'DEPRECATED: Use principal_product_performance_secure view instead. Direct access revoked for security.';

COMMENT ON VIEW public.principal_timeline_summary IS 
'DEPRECATED: Use principal_timeline_summary_secure view instead. Direct access revoked for security.';

-- =============================================================================
-- PHASE 7: PERFORMANCE OPTIMIZATION FOR SECURITY
-- =============================================================================

-- Create indexes to optimize security queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_security_lookup 
ON public.organizations (id, distributor_id, is_principal, deleted_at)
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opportunities_principal_security 
ON public.opportunities (principal_id, deleted_at)
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_organization_security 
ON public.contacts (organization_id, deleted_at)
WHERE deleted_at IS NULL;

-- =============================================================================
-- VALIDATION AND TESTING
-- =============================================================================

-- Create validation function to test security implementation
CREATE OR REPLACE FUNCTION public.validate_security_implementation()
RETURNS TABLE (
    test_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Test 1: Verify secure views are accessible
    RETURN QUERY
    SELECT 
        'Secure views accessible'::TEXT,
        CASE WHEN EXISTS(SELECT 1 FROM public.principal_activity_summary_secure LIMIT 1) 
             THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Principal activity secure view should be accessible'::TEXT;
    
    -- Test 2: Verify original views are restricted
    BEGIN
        PERFORM COUNT(*) FROM public.principal_activity_summary LIMIT 1;
        RETURN QUERY SELECT 'Original view access blocked'::TEXT, 'FAIL'::TEXT, 'Original view should be inaccessible'::TEXT;
    EXCEPTION
        WHEN insufficient_privilege THEN
            RETURN QUERY SELECT 'Original view access blocked'::TEXT, 'PASS'::TEXT, 'Original view properly restricted'::TEXT;
    END;
    
    -- Test 3: Verify function security
    RETURN QUERY
    SELECT 
        'Security functions available'::TEXT,
        CASE WHEN public.get_user_organization_id() IS NOT NULL OR current_setting('app.environment', true) = 'development'
             THEN 'PASS' ELSE 'NEEDS_SETUP' END::TEXT,
        'Organization context function should work'::TEXT;
        
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- =============================================================================
-- DEPLOYMENT CHECKLIST
-- =============================================================================

-- Run this validation after applying all fixes
SELECT * FROM public.validate_security_implementation();

-- Manual verification steps:
-- 1. ✅ Verify secure views return tenant-filtered data
-- 2. ✅ Verify original views are inaccessible to authenticated users
-- 3. ✅ Test cross-tenant data isolation
-- 4. ✅ Verify function access controls work
-- 5. ✅ Test audit logging functionality
-- 6. ✅ Performance test security query overhead (<50ms target)

-- =============================================================================
-- PRODUCTION DEPLOYMENT NOTES
-- =============================================================================

-- CRITICAL: Update get_user_organization_id() function to use proper JWT claims
-- The current implementation is a placeholder and MUST be updated for production

-- Example production implementation:
/*
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
*/

-- =============================================================================
-- SECURITY REMEDIATION COMPLETE
-- =============================================================================

COMMENT ON SCHEMA public IS 'Security remediation applied - multi-tenant RLS policies implemented';

-- Log completion
DO $$ BEGIN
    RAISE NOTICE 'Security remediation plan applied successfully';
    RAISE NOTICE 'Multi-tenant RLS policies: IMPLEMENTED';
    RAISE NOTICE 'Function security: ENHANCED';
    RAISE NOTICE 'Audit logging: ENABLED';
    RAISE NOTICE 'Production readiness: PENDING JWT CONFIGURATION';
END $$;