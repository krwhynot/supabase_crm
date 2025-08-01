-- =============================================================================
-- Opportunities Views for CRM Sales Pipeline Management
-- =============================================================================
-- This file contains views for opportunities list and detail display,
-- providing optimized queries with proper joins for the Vue 3 frontend.
--
-- Applied: Phase 2.1 - Database Schema Implementation
-- Confidence: 95%
-- =============================================================================

-- Drop existing views if they exist (for reapplication)
DROP VIEW IF EXISTS public.opportunity_detail_view CASCADE;
DROP VIEW IF EXISTS public.opportunity_list_view CASCADE;

-- Opportunity List View - Optimized for list/table display
CREATE VIEW public.opportunity_list_view AS
SELECT 
    -- Opportunity basic information
    o.id,
    o.name,
    o.stage,
    o.context,
    o.probability_percent,
    o.expected_close_date,
    o.estimated_value,
    o.actual_value,
    o.currency_code,
    o.is_won,
    o.is_lost,
    o.deal_owner,
    o.auto_generated_name,
    o.created_at,
    o.updated_at,
    o.stage_changed_at,
    o.last_activity_date,
    o.next_follow_up_date,
    
    -- Organization information
    org.id AS organization_id,
    org.name AS organization_name,
    org.type AS organization_type,
    org.status AS organization_status,
    org.city AS organization_city,
    org.state_province AS organization_state,
    org.country AS organization_country,
    org.lead_score AS organization_lead_score,
    
    -- Principal information
    prin.id AS principal_id,
    prin.name AS principal_name,
    prin.type AS principal_type,
    
    -- Product information
    prod.id AS product_id,
    prod.name AS product_name,
    prod.category AS product_category,
    prod.sku AS product_sku,
    
    -- Calculated fields
    CASE 
        WHEN o.expected_close_date IS NOT NULL THEN
            o.expected_close_date - CURRENT_DATE
        ELSE NULL
    END AS days_to_close,
    
    CASE 
        WHEN o.next_follow_up_date IS NOT NULL THEN
            o.next_follow_up_date - CURRENT_DATE
        ELSE NULL
    END AS days_to_followup,
    
    -- Summary notes (first 100 characters)
    CASE 
        WHEN LENGTH(o.notes) > 100 THEN
            SUBSTRING(o.notes FROM 1 FOR 97) || '...'
        ELSE o.notes
    END AS notes_summary,
    
    -- Stage progression (ordinal for sorting)
    CASE o.stage
        WHEN 'New Lead' THEN 1
        WHEN 'Initial Outreach' THEN 2
        WHEN 'Sample/Visit Offered' THEN 3
        WHEN 'Awaiting Response' THEN 4
        WHEN 'Feedback Logged' THEN 5
        WHEN 'Demo Scheduled' THEN 6
        WHEN 'Closed - Won' THEN 7
        ELSE 0
    END AS stage_order,
    
    -- Activity indicators
    o.last_activity_date IS NOT NULL AS has_activity,
    o.next_follow_up_date < CURRENT_DATE AS overdue_followup,
    o.expected_close_date < CURRENT_DATE AND NOT o.is_won AND NOT o.is_lost AS overdue_close

FROM public.opportunities o
-- Join with organization (customer)
LEFT JOIN public.organizations org ON o.organization_id = org.id
-- Join with principal organization
LEFT JOIN public.organizations prin ON o.principal_id = prin.id
-- Join with product
LEFT JOIN public.products prod ON o.product_id = prod.id
-- Only include active (non-deleted) opportunities
WHERE o.deleted_at IS NULL
  AND (org.deleted_at IS NULL OR org.deleted_at IS NULL)
  AND (prod.deleted_at IS NULL OR prod.deleted_at IS NULL);

-- Opportunity Detail View - Comprehensive data for detail pages and editing
CREATE VIEW public.opportunity_detail_view AS
SELECT 
    -- All opportunity information
    o.id,
    o.name,
    o.organization_id,
    o.principal_id,
    o.stage,
    o.product_id,
    o.context,
    o.probability_percent,
    o.expected_close_date,
    o.estimated_value,
    o.actual_value,
    o.currency_code,
    o.deal_owner,
    o.lead_source,
    o.competitor_info,
    o.is_won,
    o.is_lost,
    o.lost_reason,
    o.won_date,
    o.lost_date,
    o.notes,
    o.internal_notes,
    o.tags,
    o.custom_fields,
    o.auto_generated_name,
    o.name_template,
    o.last_activity_date,
    o.next_follow_up_date,
    o.stage_changed_at,
    o.stage_changed_by,
    o.created_at,
    o.updated_at,
    o.created_by,
    
    -- Organization (customer) details
    org.id AS organization_id_check, -- For validation
    org.name AS organization_name,
    org.legal_name AS organization_legal_name,
    org.type AS organization_type,
    org.size AS organization_size,
    org.status AS organization_status,
    org.industry AS organization_industry,
    org.website AS organization_website,
    org.email AS organization_email,
    org.primary_phone AS organization_phone,
    org.address_line_1 AS organization_address1,
    org.address_line_2 AS organization_address2,
    org.city AS organization_city,
    org.state_province AS organization_state,
    org.postal_code AS organization_postal_code,
    org.country AS organization_country,
    org.employees_count AS organization_employees,
    org.annual_revenue AS organization_revenue,
    org.lead_score AS organization_lead_score,
    org.tags AS organization_tags,
    
    -- Principal organization details
    prin.id AS principal_id_check, -- For validation
    prin.name AS principal_name,
    prin.legal_name AS principal_legal_name,
    prin.type AS principal_type,
    prin.size AS principal_size,
    prin.industry AS principal_industry,
    prin.website AS principal_website,
    prin.email AS principal_email,
    prin.primary_phone AS principal_phone,
    prin.is_principal AS principal_is_principal_flag,
    
    -- Product details
    prod.id AS product_id_check, -- For validation
    prod.name AS product_name,
    prod.description AS product_description,
    prod.category AS product_category,
    prod.sku AS product_sku,
    prod.unit_size AS product_unit_size,
    prod.unit_cost AS product_unit_cost,
    prod.suggested_retail_price AS product_suggested_price,
    prod.is_active AS product_is_active,
    prod.launch_date AS product_launch_date,
    prod.ingredients AS product_ingredients,
    prod.allergen_info AS product_allergen_info,
    prod.nutritional_info AS product_nutritional_info,
    prod.certifications AS product_certifications,
    prod.tags AS product_tags,
    
    -- Product-Principal relationship (if exists)
    pp.wholesale_price AS principal_wholesale_price,
    pp.minimum_order_quantity AS principal_min_order_qty,
    pp.lead_time_days AS principal_lead_time,
    pp.is_primary_principal AS is_primary_principal,
    pp.exclusive_rights AS principal_exclusive_rights,
    pp.territory_restrictions AS territory_restrictions,
    pp.contract_start_date AS principal_contract_start,
    pp.contract_end_date AS principal_contract_end,
    
    -- Calculated fields
    CASE 
        WHEN o.expected_close_date IS NOT NULL THEN
            o.expected_close_date - CURRENT_DATE
        ELSE NULL
    END AS days_to_close,
    
    CASE 
        WHEN o.next_follow_up_date IS NOT NULL THEN
            o.next_follow_up_date - CURRENT_DATE
        ELSE NULL
    END AS days_to_followup,
    
    -- Stage progression information
    CASE o.stage
        WHEN 'New Lead' THEN 1
        WHEN 'Initial Outreach' THEN 2
        WHEN 'Sample/Visit Offered' THEN 3
        WHEN 'Awaiting Response' THEN 4
        WHEN 'Feedback Logged' THEN 5
        WHEN 'Demo Scheduled' THEN 6
        WHEN 'Closed - Won' THEN 7
        ELSE 0
    END AS stage_order,
    
    -- Activity and status indicators
    o.last_activity_date IS NOT NULL AS has_activity,
    o.next_follow_up_date < CURRENT_DATE AS overdue_followup,
    o.expected_close_date < CURRENT_DATE AND NOT o.is_won AND NOT o.is_lost AS overdue_close,
    
    -- Duration calculations
    CASE 
        WHEN o.won_date IS NOT NULL THEN
            o.won_date - o.created_at::date
        WHEN o.lost_date IS NOT NULL THEN
            o.lost_date - o.created_at::date
        ELSE
            CURRENT_DATE - o.created_at::date
    END AS opportunity_age_days,
    
    -- Stage duration (days since last stage change)
    CURRENT_DATE - o.stage_changed_at::date AS days_in_current_stage,
    
    -- Expected vs actual value variance (for closed-won opportunities)
    CASE 
        WHEN o.is_won AND o.estimated_value IS NOT NULL AND o.actual_value IS NOT NULL THEN
            o.actual_value - o.estimated_value
        ELSE NULL
    END AS value_variance

FROM public.opportunities o
-- Join with organization (customer)
LEFT JOIN public.organizations org ON o.organization_id = org.id
-- Join with principal organization
LEFT JOIN public.organizations prin ON o.principal_id = prin.id
-- Join with product
LEFT JOIN public.products prod ON o.product_id = prod.id
-- Join with product-principal relationship
LEFT JOIN public.product_principals pp ON prod.id = pp.product_id AND prin.id = pp.principal_id
-- Only include active (non-deleted) opportunities
WHERE o.deleted_at IS NULL;

-- Grant permissions to authenticated users
GRANT SELECT ON public.opportunity_list_view TO authenticated;
GRANT SELECT ON public.opportunity_detail_view TO authenticated;

-- Add comments for documentation
COMMENT ON VIEW public.opportunity_list_view IS 'Optimized view for opportunity list display with essential joined data';
COMMENT ON VIEW public.opportunity_detail_view IS 'Comprehensive view for opportunity detail pages with full relationship data';

-- Create indexes on the underlying tables to optimize view performance
-- (These are already created in the main schema file, but documenting here for reference)

-- Additional indexes specifically for view performance
CREATE INDEX IF NOT EXISTS idx_opportunities_list_view_performance 
ON public.opportunities(deleted_at, stage, expected_close_date, probability_percent DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_detail_view_performance 
ON public.opportunities(id, organization_id, principal_id, product_id) 
WHERE deleted_at IS NULL;

-- Create a helper view for KPI calculations (used by the dashboard)
CREATE VIEW public.opportunity_kpi_view AS
SELECT 
    -- Total counts
    COUNT(*) FILTER (WHERE deleted_at IS NULL) AS total_opportunities,
    COUNT(*) FILTER (WHERE deleted_at IS NULL AND NOT is_won AND NOT is_lost) AS active_opportunities,
    COUNT(*) FILTER (WHERE deleted_at IS NULL AND is_won) AS won_opportunities,
    COUNT(*) FILTER (WHERE deleted_at IS NULL AND is_lost) AS lost_opportunities,
    
    -- This month's activity
    COUNT(*) FILTER (WHERE deleted_at IS NULL AND is_won AND won_date >= DATE_TRUNC('month', CURRENT_DATE)) AS won_this_month,
    COUNT(*) FILTER (WHERE deleted_at IS NULL AND created_at >= DATE_TRUNC('month', CURRENT_DATE)) AS created_this_month,
    
    -- Value calculations
    COALESCE(SUM(estimated_value) FILTER (WHERE deleted_at IS NULL AND NOT is_won AND NOT is_lost), 0) AS total_pipeline_value,
    COALESCE(AVG(estimated_value) FILTER (WHERE deleted_at IS NULL AND NOT is_won AND NOT is_lost), 0) AS avg_opportunity_value,
    COALESCE(SUM(actual_value) FILTER (WHERE deleted_at IS NULL AND is_won), 0) AS total_won_value,
    COALESCE(SUM(actual_value) FILTER (WHERE deleted_at IS NULL AND is_won AND won_date >= DATE_TRUNC('month', CURRENT_DATE)), 0) AS won_value_this_month,
    
    -- Probability calculations
    COALESCE(AVG(probability_percent) FILTER (WHERE deleted_at IS NULL AND NOT is_won AND NOT is_lost), 0) AS avg_probability,
    COALESCE(SUM(estimated_value * probability_percent / 100.0) FILTER (WHERE deleted_at IS NULL AND NOT is_won AND NOT is_lost), 0) AS weighted_pipeline_value,
    
    -- Stage distribution
    COUNT(*) FILTER (WHERE deleted_at IS NULL AND stage = 'New Lead') AS new_lead_count,
    COUNT(*) FILTER (WHERE deleted_at IS NULL AND stage = 'Initial Outreach') AS initial_outreach_count,
    COUNT(*) FILTER (WHERE deleted_at IS NULL AND stage = 'Sample/Visit Offered') AS sample_visit_count,
    COUNT(*) FILTER (WHERE deleted_at IS NULL AND stage = 'Awaiting Response') AS awaiting_response_count,
    COUNT(*) FILTER (WHERE deleted_at IS NULL AND stage = 'Feedback Logged') AS feedback_logged_count,
    COUNT(*) FILTER (WHERE deleted_at IS NULL AND stage = 'Demo Scheduled') AS demo_scheduled_count,
    COUNT(*) FILTER (WHERE deleted_at IS NULL AND stage = 'Closed - Won') AS closed_won_count,
    
    -- Time-based metrics
    COUNT(*) FILTER (WHERE deleted_at IS NULL AND expected_close_date < CURRENT_DATE AND NOT is_won AND NOT is_lost) AS overdue_opportunities,
    COUNT(*) FILTER (WHERE deleted_at IS NULL AND next_follow_up_date < CURRENT_DATE AND NOT is_won AND NOT is_lost) AS overdue_followups,
    
    -- Conversion rates (as percentages)
    CASE 
        WHEN COUNT(*) FILTER (WHERE deleted_at IS NULL AND (is_won OR is_lost)) > 0 THEN
            (COUNT(*) FILTER (WHERE deleted_at IS NULL AND is_won) * 100.0) / 
            COUNT(*) FILTER (WHERE deleted_at IS NULL AND (is_won OR is_lost))
        ELSE 0
    END AS win_rate_percent,
    
    -- Average days to close for won opportunities
    COALESCE(AVG(won_date - created_at::date) FILTER (WHERE deleted_at IS NULL AND is_won), 0) AS avg_days_to_close

FROM public.opportunities;

-- Grant permissions for KPI view
GRANT SELECT ON public.opportunity_kpi_view TO authenticated;

COMMENT ON VIEW public.opportunity_kpi_view IS 'Aggregated KPI metrics for opportunity dashboard and reporting';

-- Create a view for product availability by principal (for filtering)
CREATE VIEW public.product_principal_availability_view AS
SELECT 
    p.id AS product_id,
    p.name AS product_name,
    p.category AS product_category,
    p.sku AS product_sku,
    p.is_active AS product_is_active,
    
    prin.id AS principal_id,
    prin.name AS principal_name,
    
    pp.wholesale_price,
    pp.minimum_order_quantity,
    pp.lead_time_days,
    pp.is_primary_principal,
    pp.exclusive_rights,
    pp.is_active AS relationship_is_active,
    
    -- Availability status
    (p.is_active AND pp.is_active AND prin.is_principal) AS is_available,
    
    -- Territory info
    pp.territory_restrictions,
    
    -- Contract status
    pp.contract_start_date,
    pp.contract_end_date,
    pp.auto_renewal,
    CASE 
        WHEN pp.contract_start_date IS NULL OR pp.contract_end_date IS NULL THEN TRUE
        WHEN CURRENT_DATE BETWEEN pp.contract_start_date AND pp.contract_end_date THEN TRUE
        WHEN pp.auto_renewal AND pp.contract_end_date < CURRENT_DATE THEN TRUE
        ELSE FALSE
    END AS contract_is_active

FROM public.products p
JOIN public.product_principals pp ON p.id = pp.product_id
JOIN public.organizations prin ON pp.principal_id = prin.id
WHERE p.deleted_at IS NULL
  AND prin.deleted_at IS NULL
  AND prin.is_principal = TRUE;

-- Grant permissions for product-principal availability view
GRANT SELECT ON public.product_principal_availability_view TO authenticated;

COMMENT ON VIEW public.product_principal_availability_view IS 'Product availability filtered by principal relationships for opportunity forms';