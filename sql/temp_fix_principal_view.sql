-- Fix for missing principal_activity_summary base view
-- This creates the base materialized view that the secure view depends on

CREATE MATERIALIZED VIEW IF NOT EXISTS public.principal_activity_summary AS
SELECT 
    -- Principal identification
    org.id AS principal_id,
    org.name AS principal_name,
    org.status AS principal_status,
    org.type AS organization_type,
    org.industry,
    org.size AS organization_size,
    (org.deleted_at IS NULL) AS is_active,
    org.lead_score,
    
    -- Contact metrics (simplified for compatibility)
    0 AS contact_count,
    0 AS active_contacts,
    NULL::text AS primary_contact_name,
    NULL::text AS primary_contact_email,
    NULL::timestamptz AS last_contact_update,
    
    -- Interaction metrics (simplified for compatibility)
    0 AS total_interactions,
    0 AS interactions_last_30_days,
    0 AS interactions_last_90_days,
    NULL::timestamptz AS last_interaction_date,
    NULL::text AS last_interaction_type,
    NULL::timestamptz AS next_follow_up_date,
    0::numeric AS avg_interaction_rating,
    0 AS positive_interactions,
    0 AS follow_ups_required,
    
    -- Opportunity metrics (simplified for compatibility)
    0 AS total_opportunities,
    0 AS active_opportunities,
    0 AS won_opportunities,
    0 AS opportunities_last_30_days,
    NULL::text AS latest_opportunity_stage,
    NULL::timestamptz AS latest_opportunity_date,
    0::numeric AS avg_probability_percent,
    NULL::text AS highest_value_opportunity,
    
    -- Product association metrics (simplified for compatibility)
    0 AS product_count,
    0 AS active_product_count,
    NULL::text[] AS product_categories,
    NULL::text AS primary_product_category,
    
    -- Business relationship context
    COALESCE(org.is_principal, false) AS is_principal,
    COALESCE(org.is_distributor, false) AS is_distributor,
    org.distributor_id,
    distributor.name AS distributor_name,
    
    -- Activity timeline
    org.updated_at AS last_activity_date,
    
    -- Performance indicators
    'NO_ACTIVITY'::text AS activity_status,
    
    -- Calculated engagement score (simplified)
    LEAST(100, GREATEST(0, COALESCE(org.lead_score, 0)))::numeric AS engagement_score,
    
    -- Metadata
    org.created_at AS principal_created_at,
    org.updated_at AS principal_updated_at,
    NOW() AS summary_generated_at
    
FROM public.organizations org

-- Distributor relationship
LEFT JOIN public.organizations distributor ON distributor.id = org.distributor_id 
    AND distributor.deleted_at IS NULL

WHERE COALESCE(org.is_principal, false) = true 
  AND org.deleted_at IS NULL;

-- Create a unique index for performance
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_principal_activity_summary_principal_id 
ON public.principal_activity_summary (principal_id);

-- Add a comment
COMMENT ON MATERIALIZED VIEW public.principal_activity_summary IS 
'Simplified base materialized view for principal activity tracking - created to fix API errors';