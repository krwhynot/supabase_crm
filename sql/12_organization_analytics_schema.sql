-- =============================================================================
-- Organization Analytics Schema for CRM System
-- =============================================================================
-- This file contains tables and views for organization analytics and
-- business intelligence. Supports comprehensive reporting and metrics.
--
-- Applied: Stage 1 - Database Implementation
-- Confidence: 85%
-- =============================================================================

-- Organization analytics table for performance metrics
CREATE TABLE IF NOT EXISTS public.organization_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Related entity
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Time period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    
    -- Engagement metrics
    total_interactions INTEGER DEFAULT 0,
    email_interactions INTEGER DEFAULT 0,
    phone_interactions INTEGER DEFAULT 0,
    meeting_interactions INTEGER DEFAULT 0,
    
    -- Business metrics
    revenue_generated DECIMAL(15,2) DEFAULT 0,
    deals_closed INTEGER DEFAULT 0,
    deals_in_progress INTEGER DEFAULT 0,
    
    -- Lead metrics
    lead_score_change INTEGER DEFAULT 0,
    conversion_events INTEGER DEFAULT 0,
    
    -- Document metrics
    documents_added INTEGER DEFAULT 0,
    documents_accessed INTEGER DEFAULT 0,
    
    -- Contact metrics
    new_contacts_added INTEGER DEFAULT 0,
    active_contacts INTEGER DEFAULT 0,
    
    -- Custom metrics (extensible)
    custom_metrics JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure no overlapping periods for same organization and type
    UNIQUE(organization_id, period_start, period_end, period_type)
);

-- Add comments for documentation
COMMENT ON TABLE public.organization_analytics IS 'Stores aggregated analytics data for organizations by time period';
COMMENT ON COLUMN public.organization_analytics.id IS 'Unique identifier for the analytics record';
COMMENT ON COLUMN public.organization_analytics.organization_id IS 'Reference to the organization';
COMMENT ON COLUMN public.organization_analytics.period_start IS 'Start of the analytics period';
COMMENT ON COLUMN public.organization_analytics.period_end IS 'End of the analytics period';
COMMENT ON COLUMN public.organization_analytics.period_type IS 'Type of time period (daily, weekly, monthly, etc.)';
COMMENT ON COLUMN public.organization_analytics.total_interactions IS 'Total number of interactions in the period';
COMMENT ON COLUMN public.organization_analytics.revenue_generated IS 'Revenue attributed to this organization in the period';
COMMENT ON COLUMN public.organization_analytics.deals_closed IS 'Number of deals closed in the period';
COMMENT ON COLUMN public.organization_analytics.lead_score_change IS 'Net change in lead score during the period';
COMMENT ON COLUMN public.organization_analytics.custom_metrics IS 'Extensible custom metrics (JSONB object)';

-- Add constraints for analytics
ALTER TABLE public.organization_analytics 
ADD CONSTRAINT analytics_period_valid CHECK (period_start < period_end);

ALTER TABLE public.organization_analytics 
ADD CONSTRAINT analytics_metrics_non_negative CHECK (
    total_interactions >= 0 AND
    email_interactions >= 0 AND
    phone_interactions >= 0 AND
    meeting_interactions >= 0 AND
    deals_closed >= 0 AND
    deals_in_progress >= 0 AND
    conversion_events >= 0 AND
    documents_added >= 0 AND
    documents_accessed >= 0 AND
    new_contacts_added >= 0 AND
    active_contacts >= 0
);

-- Add updated_at trigger
CREATE TRIGGER update_organization_analytics_updated_at 
    BEFORE UPDATE ON public.organization_analytics 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create analytics views for common reporting needs

-- View: Organization summary analytics
CREATE VIEW public.organization_summary_analytics AS
SELECT 
    o.id,
    o.name,
    o.status,
    o.industry,
    o.lead_score,
    COUNT(DISTINCT oi.id) as total_interactions,
    COUNT(DISTINCT c.id) as contact_count,
    COUNT(DISTINCT od.id) as document_count,
    MAX(oi.interaction_date) as last_interaction_date,
    o.next_follow_up_date,
    CASE 
        WHEN MAX(oi.interaction_date) < NOW() - INTERVAL '30 days' THEN 'Stale'
        WHEN MAX(oi.interaction_date) < NOW() - INTERVAL '7 days' THEN 'Needs Attention'
        ELSE 'Active'
    END as engagement_status
FROM public.organizations o
LEFT JOIN public.organization_interactions oi ON o.id = oi.organization_id
LEFT JOIN public.contacts c ON o.name = c.organization  -- Note: Will be FK after contact migration
LEFT JOIN public.organization_documents od ON o.id = od.organization_id
WHERE o.deleted_at IS NULL
GROUP BY o.id, o.name, o.status, o.industry, o.lead_score, o.next_follow_up_date;

COMMENT ON VIEW public.organization_summary_analytics IS 'Summary analytics view for organizations with key metrics';

-- View: Monthly organization performance
CREATE VIEW public.monthly_organization_performance AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    DATE_TRUNC('month', oi.interaction_date) as month,
    COUNT(*) as interaction_count,
    COUNT(DISTINCT oi.type) as interaction_types,
    COUNT(CASE WHEN oi.type = 'Meeting' THEN 1 END) as meetings,
    COUNT(CASE WHEN oi.type = 'Email' THEN 1 END) as emails,
    COUNT(CASE WHEN oi.type = 'Phone' THEN 1 END) as calls,
    AVG(CASE WHEN oi.duration_minutes IS NOT NULL THEN oi.duration_minutes END) as avg_duration_minutes
FROM public.organizations o
LEFT JOIN public.organization_interactions oi ON o.id = oi.organization_id
WHERE o.deleted_at IS NULL
AND oi.interaction_date >= DATE_TRUNC('month', NOW() - INTERVAL '12 months')
GROUP BY o.id, o.name, DATE_TRUNC('month', oi.interaction_date)
ORDER BY month DESC, interaction_count DESC;

COMMENT ON VIEW public.monthly_organization_performance IS 'Monthly performance metrics for organizations';

-- View: Lead scoring analytics
CREATE VIEW public.organization_lead_scoring AS
SELECT 
    o.id,
    o.name,
    o.lead_score,
    o.status,
    o.industry,
    o.size,
    COUNT(DISTINCT oi.id) as total_interactions,
    COUNT(DISTINCT CASE WHEN oi.interaction_date >= NOW() - INTERVAL '30 days' THEN oi.id END) as recent_interactions,
    CASE 
        WHEN o.lead_score >= 80 THEN 'Hot'
        WHEN o.lead_score >= 60 THEN 'Warm'
        WHEN o.lead_score >= 40 THEN 'Cool'
        ELSE 'Cold'
    END as lead_temperature,
    MAX(oi.interaction_date) as last_interaction,
    COUNT(DISTINCT od.id) as document_count
FROM public.organizations o
LEFT JOIN public.organization_interactions oi ON o.id = oi.organization_id
LEFT JOIN public.organization_documents od ON o.id = od.organization_id
WHERE o.deleted_at IS NULL
GROUP BY o.id, o.name, o.lead_score, o.status, o.industry, o.size
ORDER BY o.lead_score DESC, recent_interactions DESC;

COMMENT ON VIEW public.organization_lead_scoring IS 'Lead scoring analytics with temperature classification';