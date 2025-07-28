-- =============================================================================
-- Dashboard Analytics Schema
-- =============================================================================
-- Creates tables and views for CRM dashboard analytics functionality
-- Includes: preferences, contact metrics, organization analytics, and interactions
-- =============================================================================

-- Dashboard Preferences Table
-- Stores user-specific dashboard settings and widget configurations
CREATE TABLE IF NOT EXISTS public.dashboard_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    widget_layout JSONB NOT NULL DEFAULT '[]'::jsonb,
    dashboard_theme VARCHAR(20) NOT NULL DEFAULT 'default',
    refresh_interval INTEGER NOT NULL DEFAULT 300000, -- 5 minutes in milliseconds
    compact_mode BOOLEAN NOT NULL DEFAULT false,
    auto_refresh BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add unique constraint to ensure one preference record per user
ALTER TABLE public.dashboard_preferences 
ADD CONSTRAINT dashboard_preferences_user_id_unique UNIQUE (user_id);

-- Comments for documentation
COMMENT ON TABLE public.dashboard_preferences IS 'User-specific dashboard preferences and widget configurations';
COMMENT ON COLUMN public.dashboard_preferences.widget_layout IS 'JSON array of widget configurations with positions and settings';
COMMENT ON COLUMN public.dashboard_preferences.dashboard_theme IS 'Dashboard theme preference: default, dark, light, blue, green';
COMMENT ON COLUMN public.dashboard_preferences.refresh_interval IS 'Auto-refresh interval in milliseconds';

-- Create updated_at trigger for dashboard_preferences
CREATE OR REPLACE FUNCTION update_dashboard_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dashboard_preferences_updated_at
    BEFORE UPDATE ON public.dashboard_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_dashboard_preferences_updated_at();

-- =============================================================================
-- Analytics Views for Dashboard Metrics
-- =============================================================================

-- Contact Analytics View
-- Provides aggregated contact metrics for dashboard widgets
CREATE OR REPLACE VIEW public.dashboard_contact_analytics AS
WITH contact_stats AS (
    SELECT 
        COUNT(*) as total_contacts,
        COUNT(CASE WHEN created_at >= date_trunc('week', CURRENT_DATE) THEN 1 END) as contacts_this_week,
        COUNT(CASE WHEN created_at >= date_trunc('month', CURRENT_DATE) THEN 1 END) as contacts_this_month,
        COUNT(DISTINCT organization) FILTER (WHERE organization IS NOT NULL AND organization != '') as unique_organizations
    FROM public.contacts
),
daily_contacts AS (
    SELECT 
        date_trunc('day', created_at) as contact_date,
        COUNT(*) as daily_contact_count
    FROM public.contacts
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY date_trunc('day', created_at)
    ORDER BY contact_date
)
SELECT 
    cs.total_contacts,
    cs.contacts_this_week,
    cs.contacts_this_month,
    cs.unique_organizations,
    dc.daily_contact_count,
    dc.contact_date,
    -- Calculate growth rate
    CASE 
        WHEN cs.total_contacts - cs.contacts_this_month > 0 THEN
            ROUND(
                ((cs.contacts_this_month::DECIMAL / NULLIF(cs.total_contacts - cs.contacts_this_month, 0)) * 100)::NUMERIC, 
                2
            )
        ELSE 0
    END as growth_rate_percentage
FROM contact_stats cs
CROSS JOIN daily_contacts dc;

-- Organization Analytics View  
-- Provides top organizations with contact counts and engagement metrics
CREATE OR REPLACE VIEW public.dashboard_organization_analytics AS
SELECT 
    c.organization,
    COUNT(*) as contact_count,
    MIN(c.created_at)::DATE as first_contact_date,
    MAX(c.created_at)::DATE as latest_contact_date,
    -- Calculate average days since last contact
    ROUND(
        EXTRACT(DAYS FROM (CURRENT_DATE - MAX(c.created_at)::DATE))::NUMERIC, 
        1
    ) as avg_days_since_contact,
    -- Additional engagement metrics
    COUNT(CASE WHEN c.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as contacts_last_week,
    COUNT(CASE WHEN c.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as contacts_last_month
FROM public.contacts c
WHERE c.organization IS NOT NULL 
    AND c.organization != '' 
    AND c.organization != 'Unknown'
GROUP BY c.organization
HAVING COUNT(*) > 0
ORDER BY contact_count DESC, latest_contact_date DESC;

-- Weekly Interactions View
-- Provides weekly interaction data for charts and trend analysis
CREATE OR REPLACE VIEW public.dashboard_weekly_interactions AS
WITH weekly_data AS (
    SELECT 
        date_trunc('week', created_at)::DATE as week_start,
        COUNT(*) as interaction_count,
        COUNT(DISTINCT organization) FILTER (WHERE organization IS NOT NULL AND organization != '') as organizations_contacted,
        COUNT(DISTINCT email) FILTER (WHERE email IS NOT NULL AND email != '') as unique_emails,
        -- Aggregate organization names for the week
        array_agg(
            DISTINCT organization 
            ORDER BY organization
        ) FILTER (
            WHERE organization IS NOT NULL 
            AND organization != '' 
            AND organization != 'Unknown'
        ) as organizations_list
    FROM public.contacts
    WHERE created_at >= CURRENT_DATE - INTERVAL '12 weeks'
    GROUP BY date_trunc('week', created_at)
),
week_series AS (
    SELECT 
        generate_series(
            date_trunc('week', CURRENT_DATE - INTERVAL '12 weeks'),
            date_trunc('week', CURRENT_DATE),
            '1 week'::INTERVAL
        )::DATE as week_start
)
SELECT 
    ws.week_start,
    COALESCE(wd.interaction_count, 0) as interaction_count,
    COALESCE(wd.organizations_contacted, 0) as organizations_contacted,
    COALESCE(wd.unique_emails, 0) as unique_emails,
    COALESCE(wd.organizations_list, ARRAY[]::TEXT[]) as organizations_list,
    -- Add week metadata for better labeling
    TO_CHAR(ws.week_start, 'Mon DD') as week_label,
    CASE 
        WHEN ws.week_start = date_trunc('week', CURRENT_DATE) THEN true 
        ELSE false 
    END as is_current_week
FROM week_series ws
LEFT JOIN weekly_data wd ON ws.week_start = wd.week_start
ORDER BY ws.week_start DESC;

-- =============================================================================
-- Performance and Security
-- =============================================================================

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_dashboard_preferences_user_id 
    ON public.dashboard_preferences(user_id);

-- Refresh materialized views if they exist (for future optimization)
-- These views are currently regular views for simplicity, but can be materialized for better performance

-- Security: RLS policies will be created in separate file (08_dashboard_rls.sql)

-- Grant necessary permissions
GRANT SELECT ON public.dashboard_contact_analytics TO authenticated;
GRANT SELECT ON public.dashboard_organization_analytics TO authenticated;  
GRANT SELECT ON public.dashboard_weekly_interactions TO authenticated;
GRANT ALL ON public.dashboard_preferences TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE dashboard_preferences_id_seq TO authenticated;

-- Add helpful comments for views
COMMENT ON VIEW public.dashboard_contact_analytics IS 'Aggregated contact metrics for dashboard widgets including growth rates';
COMMENT ON VIEW public.dashboard_organization_analytics IS 'Top organizations with contact counts and engagement metrics';
COMMENT ON VIEW public.dashboard_weekly_interactions IS 'Weekly interaction data for charts and trend analysis with 12-week history';