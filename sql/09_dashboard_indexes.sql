-- =============================================================================
-- Dashboard Performance Indexes
-- =============================================================================
-- Optimizes query performance for dashboard analytics and preferences
-- Includes composite indexes for complex analytics queries
-- =============================================================================

-- =============================================================================
-- Dashboard Preferences Indexes
-- =============================================================================

-- Primary user lookup index (already created in schema, but ensuring it exists)
CREATE INDEX IF NOT EXISTS idx_dashboard_preferences_user_id 
    ON public.dashboard_preferences(user_id);

-- Updated at index for recent changes queries
CREATE INDEX IF NOT EXISTS idx_dashboard_preferences_updated_at 
    ON public.dashboard_preferences(updated_at DESC);

-- Theme and refresh interval index for settings queries
CREATE INDEX IF NOT EXISTS idx_dashboard_preferences_theme_refresh 
    ON public.dashboard_preferences(dashboard_theme, refresh_interval);

-- =============================================================================
-- Contact Analytics Indexes
-- =============================================================================
-- These indexes optimize the views that aggregate contact data

-- Date range queries for contact analytics
CREATE INDEX IF NOT EXISTS idx_contacts_created_at_date_trunc_week 
    ON public.contacts(date_trunc('week', created_at));

CREATE INDEX IF NOT EXISTS idx_contacts_created_at_date_trunc_month 
    ON public.contacts(date_trunc('month', created_at));

CREATE INDEX IF NOT EXISTS idx_contacts_created_at_date_trunc_day 
    ON public.contacts(date_trunc('day', created_at));

-- Organization analytics index
CREATE INDEX IF NOT EXISTS idx_contacts_organization_created_at 
    ON public.contacts(organization, created_at DESC) 
    WHERE organization IS NOT NULL AND organization != '' AND organization != 'Unknown';

-- Email analytics index for unique email counts
CREATE INDEX IF NOT EXISTS idx_contacts_email_created_at 
    ON public.contacts(email, created_at DESC) 
    WHERE email IS NOT NULL AND email != '';

-- Composite index for weekly interactions
CREATE INDEX IF NOT EXISTS idx_contacts_week_org_email 
    ON public.contacts(date_trunc('week', created_at), organization, email)
    WHERE created_at >= CURRENT_DATE - INTERVAL '12 weeks';

-- =============================================================================
-- Analytics Performance Indexes
-- =============================================================================

-- Fast lookup for recent contacts (last 30 days)
CREATE INDEX IF NOT EXISTS idx_contacts_recent_30_days 
    ON public.contacts(created_at DESC)
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

-- Fast lookup for this week's contacts
CREATE INDEX IF NOT EXISTS idx_contacts_this_week 
    ON public.contacts(created_at DESC)
    WHERE created_at >= date_trunc('week', CURRENT_DATE);

-- Fast lookup for this month's contacts
CREATE INDEX IF NOT EXISTS idx_contacts_this_month 
    ON public.contacts(created_at DESC)
    WHERE created_at >= date_trunc('month', CURRENT_DATE);

-- Organization contact count optimization
CREATE INDEX IF NOT EXISTS idx_contacts_org_count_optimization 
    ON public.contacts(organization, id)
    WHERE organization IS NOT NULL AND organization != '' AND organization != 'Unknown';

-- =============================================================================
-- Audit Table Indexes
-- =============================================================================

-- Audit lookup by user and date
CREATE INDEX IF NOT EXISTS idx_dashboard_preferences_audit_user_date 
    ON public.dashboard_preferences_audit(user_id, changed_at DESC);

-- Audit lookup by preference ID
CREATE INDEX IF NOT EXISTS idx_dashboard_preferences_audit_preference_id 
    ON public.dashboard_preferences_audit(preference_id, changed_at DESC);

-- Audit action type index for filtering
CREATE INDEX IF NOT EXISTS idx_dashboard_preferences_audit_action 
    ON public.dashboard_preferences_audit(action, changed_at DESC);

-- =============================================================================
-- Partial Indexes for Performance
-- =============================================================================

-- Index only active dashboard preferences (non-deleted)
CREATE INDEX IF NOT EXISTS idx_dashboard_preferences_active 
    ON public.dashboard_preferences(user_id, updated_at DESC)
    WHERE created_at IS NOT NULL;

-- Index only contacts with organizations for faster organization analytics
CREATE INDEX IF NOT EXISTS idx_contacts_with_organizations 
    ON public.contacts(organization, created_at DESC, id)
    WHERE organization IS NOT NULL 
    AND organization != '' 
    AND organization != 'Unknown'
    AND organization != 'N/A';

-- Index recent contacts for trend analysis
CREATE INDEX IF NOT EXISTS idx_contacts_trend_analysis 
    ON public.contacts(created_at DESC, organization, email)
    WHERE created_at >= CURRENT_DATE - INTERVAL '90 days';

-- =============================================================================
-- Covering Indexes for Query Optimization
-- =============================================================================

-- Covering index for contact metrics view
CREATE INDEX IF NOT EXISTS idx_contacts_metrics_covering 
    ON public.contacts(created_at, organization, email, id)
    WHERE created_at >= CURRENT_DATE - INTERVAL '1 year';

-- Covering index for organization analytics
CREATE INDEX IF NOT EXISTS idx_contacts_org_analytics_covering 
    ON public.contacts(organization, created_at, id, email)
    WHERE organization IS NOT NULL AND organization != '';

-- =============================================================================
-- Function-based Indexes
-- =============================================================================

-- Week-based aggregation index
CREATE INDEX IF NOT EXISTS idx_contacts_week_function 
    ON public.contacts((date_trunc('week', created_at)::DATE), created_at DESC);

-- Month-based aggregation index  
CREATE INDEX IF NOT EXISTS idx_contacts_month_function 
    ON public.contacts((date_trunc('month', created_at)::DATE), created_at DESC);

-- =============================================================================
-- Index Maintenance and Statistics
-- =============================================================================

-- Update table statistics for better query planning
ANALYZE public.dashboard_preferences;
ANALYZE public.contacts;
ANALYZE public.dashboard_preferences_audit;

-- =============================================================================
-- Index Usage Monitoring Queries (for development/debugging)
-- =============================================================================

-- These are helper queries to monitor index usage (commented for production)
/*
-- Query to check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as index_tuples_read,
    idx_tup_fetch as index_tuples_fetched
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
    AND (tablename = 'dashboard_preferences' OR tablename = 'contacts')
ORDER BY idx_scan DESC;

-- Query to check table scan ratios
SELECT 
    schemaname,
    tablename,
    seq_scan as table_scans,
    seq_tup_read as table_tuples_read,
    idx_scan as index_scans,
    idx_tup_fetch as index_tuples_fetched,
    CASE 
        WHEN seq_scan + idx_scan > 0 THEN 
            ROUND((idx_scan::FLOAT / (seq_scan + idx_scan)) * 100, 2)
        ELSE 0 
    END as index_usage_percentage
FROM pg_stat_user_tables 
WHERE schemaname = 'public' 
    AND (tablename = 'dashboard_preferences' OR tablename = 'contacts')
ORDER BY index_usage_percentage DESC;
*/

-- Add helpful comments
COMMENT ON INDEX idx_contacts_organization_created_at IS 'Optimizes organization analytics queries with date sorting';
COMMENT ON INDEX idx_contacts_week_org_email IS 'Optimizes weekly interaction aggregation queries';
COMMENT ON INDEX idx_dashboard_preferences_user_id IS 'Primary lookup index for user dashboard preferences';
COMMENT ON INDEX idx_contacts_metrics_covering IS 'Covering index for dashboard contact metrics calculations';

-- Performance recommendations
-- 1. Monitor index usage with pg_stat_user_indexes
-- 2. Consider partitioning contacts table by created_at if it grows large (>1M rows)
-- 3. Regularly run VACUUM ANALYZE on frequently updated tables
-- 4. Consider materialized views for complex analytics if performance becomes an issue