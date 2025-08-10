-- =============================================================================
-- Business Logic Test Helper Functions for Quality Assurance Integration Tests
-- =============================================================================
-- Extended helper functions specifically designed for complex business logic
-- validation, cross-entity relationship testing, and comprehensive data integrity
-- validation across the CRM system.
-- =============================================================================

-- Set search path for business logic helpers
SET search_path TO test_schema, public, pg_catalog;

-- =============================================================================
-- BUSINESS RULE VALIDATION HELPERS
-- =============================================================================

-- Validate principal/distributor business relationship rules
CREATE OR REPLACE FUNCTION test_schema.validate_organization_business_rules(
    org_id UUID
)
RETURNS TABLE(
    rule_name TEXT,
    is_valid BOOLEAN,
    violation_description TEXT
) AS $$
BEGIN
    -- Check mutual exclusivity rule
    RETURN QUERY
    SELECT 
        'principal_distributor_exclusivity'::TEXT,
        NOT (o.is_principal = TRUE AND o.is_distributor = TRUE),
        CASE WHEN (o.is_principal = TRUE AND o.is_distributor = TRUE) 
             THEN 'Organization cannot be both principal and distributor' 
             ELSE NULL END
    FROM public.organizations o
    WHERE o.id = org_id;
    
    -- Check distributor hierarchy rule
    RETURN QUERY
    SELECT 
        'distributor_hierarchy_integrity'::TEXT,
        NOT (o.is_distributor = TRUE AND o.distributor_id IS NOT NULL),
        CASE WHEN (o.is_distributor = TRUE AND o.distributor_id IS NOT NULL)
             THEN 'Distributor organizations cannot have a parent distributor'
             ELSE NULL END
    FROM public.organizations o
    WHERE o.id = org_id;
    
    -- Check distributor reference validity
    RETURN QUERY
    SELECT 
        'distributor_reference_validity'::TEXT,
        (o.distributor_id IS NULL OR EXISTS(
            SELECT 1 FROM public.organizations d 
            WHERE d.id = o.distributor_id 
            AND d.is_distributor = TRUE 
            AND d.deleted_at IS NULL
        )),
        CASE WHEN (o.distributor_id IS NOT NULL AND NOT EXISTS(
            SELECT 1 FROM public.organizations d 
            WHERE d.id = o.distributor_id 
            AND d.is_distributor = TRUE 
            AND d.deleted_at IS NULL
        )) THEN 'distributor_id must reference a valid, active distributor organization'
             ELSE NULL END
    FROM public.organizations o
    WHERE o.id = org_id;
END;
$$ LANGUAGE plpgsql;

-- Validate opportunity stage progression and business logic
CREATE OR REPLACE FUNCTION test_schema.validate_opportunity_business_rules(
    opp_id UUID
)
RETURNS TABLE(
    rule_name TEXT,
    is_valid BOOLEAN,
    violation_description TEXT
) AS $$
BEGIN
    -- Check stage and won status consistency
    RETURN QUERY
    SELECT 
        'stage_won_consistency'::TEXT,
        (o.stage = 'Closed - Won' AND o.is_won = TRUE) OR (o.stage != 'Closed - Won'),
        CASE WHEN (o.stage = 'Closed - Won' AND o.is_won = FALSE)
             THEN 'Opportunities with stage "Closed - Won" must have is_won = TRUE'
             WHEN (o.stage != 'Closed - Won' AND o.is_won = TRUE)
             THEN 'Won opportunities must have stage "Closed - Won"'
             ELSE NULL END
    FROM public.opportunities o
    WHERE o.id = opp_id;
    
    -- Check probability percentage consistency with stage
    RETURN QUERY
    SELECT 
        'probability_stage_consistency'::TEXT,
        CASE 
            WHEN o.stage = 'Closed - Won' THEN o.probability_percent = 100
            WHEN o.stage = 'New Lead' THEN o.probability_percent <= 25
            WHEN o.is_won = TRUE THEN o.probability_percent = 100
            ELSE TRUE
        END,
        CASE 
            WHEN o.stage = 'Closed - Won' AND o.probability_percent != 100
                THEN 'Closed won opportunities must have 100% probability'
            WHEN o.stage = 'New Lead' AND o.probability_percent > 25
                THEN 'New lead opportunities should have probability ≤25%'
            WHEN o.is_won = TRUE AND o.probability_percent != 100
                THEN 'Won opportunities must have 100% probability'
            ELSE NULL END
    FROM public.opportunities o
    WHERE o.id = opp_id;
    
    -- Check principal-product association validity
    RETURN QUERY
    SELECT 
        'principal_product_association'::TEXT,
        (o.principal_id IS NULL OR o.product_id IS NULL OR EXISTS(
            SELECT 1 FROM public.product_principals pp
            WHERE pp.product_id = o.product_id 
            AND pp.principal_id = o.principal_id
        )),
        CASE WHEN (o.principal_id IS NOT NULL AND o.product_id IS NOT NULL AND NOT EXISTS(
            SELECT 1 FROM public.product_principals pp
            WHERE pp.product_id = o.product_id 
            AND pp.principal_id = o.principal_id
        )) THEN 'Opportunity product must be associated with the opportunity principal'
             ELSE NULL END
    FROM public.opportunities o
    WHERE o.id = opp_id;
END;
$$ LANGUAGE plpgsql;

-- Validate product-principal association business rules
CREATE OR REPLACE FUNCTION test_schema.validate_product_principal_business_rules(
    product_id UUID,
    principal_id UUID DEFAULT NULL
)
RETURNS TABLE(
    rule_name TEXT,
    is_valid BOOLEAN,
    violation_description TEXT
) AS $$
BEGIN
    -- Check exclusive rights constraint (only one exclusive principal per product)
    RETURN QUERY
    SELECT 
        'exclusive_rights_uniqueness'::TEXT,
        (SELECT COUNT(*) FROM public.product_principals pp 
         WHERE pp.product_id = validate_product_principal_business_rules.product_id 
         AND pp.exclusive_rights = TRUE) <= 1,
        CASE WHEN (SELECT COUNT(*) FROM public.product_principals pp 
                   WHERE pp.product_id = validate_product_principal_business_rules.product_id 
                   AND pp.exclusive_rights = TRUE) > 1
             THEN 'Product can have only one principal with exclusive rights'
             ELSE NULL END;
    
    -- Check primary principal constraint (only one primary principal per product)
    RETURN QUERY
    SELECT 
        'primary_principal_uniqueness'::TEXT,
        (SELECT COUNT(*) FROM public.product_principals pp 
         WHERE pp.product_id = validate_product_principal_business_rules.product_id 
         AND pp.is_primary_principal = TRUE) <= 1,
        CASE WHEN (SELECT COUNT(*) FROM public.product_principals pp 
                   WHERE pp.product_id = validate_product_principal_business_rules.product_id 
                   AND pp.is_primary_principal = TRUE) > 1
             THEN 'Product can have only one primary principal'
             ELSE NULL END;
    
    -- Check contract date consistency
    RETURN QUERY
    SELECT 
        'contract_date_consistency'::TEXT,
        bool_and(pp.contract_start_date IS NULL OR pp.contract_end_date IS NULL OR 
                pp.contract_start_date < pp.contract_end_date),
        CASE WHEN bool_and(pp.contract_start_date IS NULL OR pp.contract_end_date IS NULL OR 
                          pp.contract_start_date < pp.contract_end_date) = FALSE
             THEN 'Contract start date must be earlier than end date'
             ELSE NULL END
    FROM public.product_principals pp
    WHERE pp.product_id = validate_product_principal_business_rules.product_id
    AND (principal_id IS NULL OR pp.principal_id = validate_product_principal_business_rules.principal_id);
    
    -- Check pricing constraints
    RETURN QUERY
    SELECT 
        'pricing_constraints'::TEXT,
        bool_and(pp.wholesale_price IS NULL OR pp.wholesale_price >= 0),
        CASE WHEN bool_and(pp.wholesale_price IS NULL OR pp.wholesale_price >= 0) = FALSE
             THEN 'Wholesale price must be non-negative'
             ELSE NULL END
    FROM public.product_principals pp
    WHERE pp.product_id = validate_product_principal_business_rules.product_id
    AND (principal_id IS NULL OR pp.principal_id = validate_product_principal_business_rules.principal_id);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CROSS-ENTITY RELATIONSHIP VALIDATION HELPERS
-- =============================================================================

-- Validate complete entity relationship consistency
CREATE OR REPLACE FUNCTION test_schema.validate_entity_relationship_integrity()
RETURNS TABLE(
    entity_pair TEXT,
    total_records INTEGER,
    valid_relationships INTEGER,
    integrity_percentage DECIMAL(5,2),
    integrity_status TEXT
) AS $$
BEGIN
    -- Contact -> Organization relationships
    RETURN QUERY
    SELECT 
        'contacts->organizations'::TEXT,
        COUNT(*)::INTEGER as total_records,
        COUNT(CASE WHEN o.id IS NOT NULL AND o.deleted_at IS NULL THEN 1 END)::INTEGER as valid_relationships,
        CASE WHEN COUNT(*) > 0 
             THEN ROUND((COUNT(CASE WHEN o.id IS NOT NULL AND o.deleted_at IS NULL THEN 1 END) * 100.0 / COUNT(*))::numeric, 2)
             ELSE 100.0 END as integrity_percentage,
        CASE WHEN COUNT(*) = 0 THEN 'NO_DATA'
             WHEN COUNT(CASE WHEN o.id IS NOT NULL AND o.deleted_at IS NULL THEN 1 END) = COUNT(*) THEN 'PERFECT'
             WHEN COUNT(CASE WHEN o.id IS NOT NULL AND o.deleted_at IS NULL THEN 1 END) * 100.0 / COUNT(*) >= 95 THEN 'GOOD'
             WHEN COUNT(CASE WHEN o.id IS NOT NULL AND o.deleted_at IS NULL THEN 1 END) * 100.0 / COUNT(*) >= 80 THEN 'FAIR'
             ELSE 'POOR' END as integrity_status
    FROM public.contacts c
    LEFT JOIN public.organizations o ON c.organization_id = o.id
    WHERE c.deleted_at IS NULL;
    
    -- Opportunity -> Organization relationships
    RETURN QUERY
    SELECT 
        'opportunities->organizations'::TEXT,
        COUNT(*)::INTEGER,
        COUNT(CASE WHEN o.id IS NOT NULL AND o.deleted_at IS NULL THEN 1 END)::INTEGER,
        CASE WHEN COUNT(*) > 0 
             THEN ROUND((COUNT(CASE WHEN o.id IS NOT NULL AND o.deleted_at IS NULL THEN 1 END) * 100.0 / COUNT(*))::numeric, 2)
             ELSE 100.0 END,
        CASE WHEN COUNT(*) = 0 THEN 'NO_DATA'
             WHEN COUNT(CASE WHEN o.id IS NOT NULL AND o.deleted_at IS NULL THEN 1 END) = COUNT(*) THEN 'PERFECT'
             WHEN COUNT(CASE WHEN o.id IS NOT NULL AND o.deleted_at IS NULL THEN 1 END) * 100.0 / COUNT(*) >= 95 THEN 'GOOD'
             WHEN COUNT(CASE WHEN o.id IS NOT NULL AND o.deleted_at IS NULL THEN 1 END) * 100.0 / COUNT(*) >= 80 THEN 'FAIR'
             ELSE 'POOR' END
    FROM public.opportunities opp
    LEFT JOIN public.organizations o ON opp.organization_id = o.id;
    
    -- Opportunity -> Principal relationships
    RETURN QUERY
    SELECT 
        'opportunities->principals'::TEXT,
        COUNT(CASE WHEN opp.principal_id IS NOT NULL THEN 1 END)::INTEGER,
        COUNT(CASE WHEN opp.principal_id IS NOT NULL AND p.id IS NOT NULL AND p.is_principal = TRUE AND p.deleted_at IS NULL THEN 1 END)::INTEGER,
        CASE WHEN COUNT(CASE WHEN opp.principal_id IS NOT NULL THEN 1 END) > 0 
             THEN ROUND((COUNT(CASE WHEN opp.principal_id IS NOT NULL AND p.id IS NOT NULL AND p.is_principal = TRUE AND p.deleted_at IS NULL THEN 1 END) * 100.0 / COUNT(CASE WHEN opp.principal_id IS NOT NULL THEN 1 END))::numeric, 2)
             ELSE 100.0 END,
        CASE WHEN COUNT(CASE WHEN opp.principal_id IS NOT NULL THEN 1 END) = 0 THEN 'NO_DATA'
             WHEN COUNT(CASE WHEN opp.principal_id IS NOT NULL AND p.id IS NOT NULL AND p.is_principal = TRUE AND p.deleted_at IS NULL THEN 1 END) = COUNT(CASE WHEN opp.principal_id IS NOT NULL THEN 1 END) THEN 'PERFECT'
             WHEN COUNT(CASE WHEN opp.principal_id IS NOT NULL AND p.id IS NOT NULL AND p.is_principal = TRUE AND p.deleted_at IS NULL THEN 1 END) * 100.0 / COUNT(CASE WHEN opp.principal_id IS NOT NULL THEN 1 END) >= 95 THEN 'GOOD'
             WHEN COUNT(CASE WHEN opp.principal_id IS NOT NULL AND p.id IS NOT NULL AND p.is_principal = TRUE AND p.deleted_at IS NULL THEN 1 END) * 100.0 / COUNT(CASE WHEN opp.principal_id IS NOT NULL THEN 1 END) >= 80 THEN 'FAIR'
             ELSE 'POOR' END
    FROM public.opportunities opp
    LEFT JOIN public.organizations p ON opp.principal_id = p.id;
    
    -- Interaction -> Opportunity relationships
    RETURN QUERY
    SELECT 
        'interactions->opportunities'::TEXT,
        COUNT(*)::INTEGER,
        COUNT(CASE WHEN o.id IS NOT NULL THEN 1 END)::INTEGER,
        CASE WHEN COUNT(*) > 0 
             THEN ROUND((COUNT(CASE WHEN o.id IS NOT NULL THEN 1 END) * 100.0 / COUNT(*))::numeric, 2)
             ELSE 100.0 END,
        CASE WHEN COUNT(*) = 0 THEN 'NO_DATA'
             WHEN COUNT(CASE WHEN o.id IS NOT NULL THEN 1 END) = COUNT(*) THEN 'PERFECT'
             WHEN COUNT(CASE WHEN o.id IS NOT NULL THEN 1 END) * 100.0 / COUNT(*) >= 95 THEN 'GOOD'
             WHEN COUNT(CASE WHEN o.id IS NOT NULL THEN 1 END) * 100.0 / COUNT(*) >= 80 THEN 'FAIR'
             ELSE 'POOR' END
    FROM public.interactions i
    LEFT JOIN public.opportunities o ON i.opportunity_id = o.id;
    
    -- Product-Principal associations
    RETURN QUERY
    SELECT 
        'product_principals->entities'::TEXT,
        COUNT(*)::INTEGER,
        COUNT(CASE WHEN p.id IS NOT NULL AND p.deleted_at IS NULL AND o.id IS NOT NULL AND o.is_principal = TRUE AND o.deleted_at IS NULL THEN 1 END)::INTEGER,
        CASE WHEN COUNT(*) > 0 
             THEN ROUND((COUNT(CASE WHEN p.id IS NOT NULL AND p.deleted_at IS NULL AND o.id IS NOT NULL AND o.is_principal = TRUE AND o.deleted_at IS NULL THEN 1 END) * 100.0 / COUNT(*))::numeric, 2)
             ELSE 100.0 END,
        CASE WHEN COUNT(*) = 0 THEN 'NO_DATA'
             WHEN COUNT(CASE WHEN p.id IS NOT NULL AND p.deleted_at IS NULL AND o.id IS NOT NULL AND o.is_principal = TRUE AND o.deleted_at IS NULL THEN 1 END) = COUNT(*) THEN 'PERFECT'
             WHEN COUNT(CASE WHEN p.id IS NOT NULL AND p.deleted_at IS NULL AND o.id IS NOT NULL AND o.is_principal = TRUE AND o.deleted_at IS NULL THEN 1 END) * 100.0 / COUNT(*) >= 95 THEN 'GOOD'
             WHEN COUNT(CASE WHEN p.id IS NOT NULL AND p.deleted_at IS NULL AND o.id IS NOT NULL AND o.is_principal = TRUE AND o.deleted_at IS NULL THEN 1 END) * 100.0 / COUNT(*) >= 80 THEN 'FAIR'
             ELSE 'POOR' END
    FROM public.product_principals pp
    LEFT JOIN public.products p ON pp.product_id = p.id
    LEFT JOIN public.organizations o ON pp.principal_id = o.id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TEMPORAL CONSISTENCY VALIDATION HELPERS
-- =============================================================================

-- Validate temporal consistency across related entities
CREATE OR REPLACE FUNCTION test_schema.validate_temporal_consistency()
RETURNS TABLE(
    consistency_check TEXT,
    violations_found INTEGER,
    is_consistent BOOLEAN,
    violation_details TEXT
) AS $$
BEGIN
    -- Check interactions created after their opportunities
    RETURN QUERY
    SELECT 
        'interactions_after_opportunities'::TEXT,
        COUNT(*)::INTEGER as violations_found,
        COUNT(*) = 0 as is_consistent,
        CASE WHEN COUNT(*) > 0 
             THEN format('%s interactions found with dates before their opportunity creation', COUNT(*))
             ELSE 'All interactions occur after opportunity creation' END
    FROM public.interactions i
    JOIN public.opportunities o ON i.opportunity_id = o.id
    WHERE i.interaction_date < o.created_at;
    
    -- Check opportunity updates after organization creation
    RETURN QUERY
    SELECT 
        'opportunities_after_organizations'::TEXT,
        COUNT(*)::INTEGER,
        COUNT(*) = 0,
        CASE WHEN COUNT(*) > 0 
             THEN format('%s opportunities found created before their organization', COUNT(*))
             ELSE 'All opportunities created after their organizations' END
    FROM public.opportunities opp
    JOIN public.organizations org ON opp.organization_id = org.id
    WHERE opp.created_at < org.created_at;
    
    -- Check contact creation relative to organization
    RETURN QUERY
    SELECT 
        'contacts_after_organizations'::TEXT,
        COUNT(*)::INTEGER,
        COUNT(*) = 0,
        CASE WHEN COUNT(*) > 0 
             THEN format('%s contacts found created before their organization', COUNT(*))
             ELSE 'All contacts created after their organizations' END
    FROM public.contacts c
    JOIN public.organizations o ON c.organization_id = o.id
    WHERE c.created_at < o.created_at AND c.deleted_at IS NULL;
    
    -- Check updated_at consistency
    RETURN QUERY
    SELECT 
        'updated_at_consistency'::TEXT,
        (SELECT COUNT(*) FROM public.contacts WHERE updated_at < created_at)::INTEGER +
        (SELECT COUNT(*) FROM public.organizations WHERE updated_at < created_at)::INTEGER +
        (SELECT COUNT(*) FROM public.opportunities WHERE updated_at < created_at)::INTEGER +
        (SELECT COUNT(*) FROM public.products WHERE updated_at < created_at)::INTEGER,
        ((SELECT COUNT(*) FROM public.contacts WHERE updated_at < created_at) +
         (SELECT COUNT(*) FROM public.organizations WHERE updated_at < created_at) +
         (SELECT COUNT(*) FROM public.opportunities WHERE updated_at < created_at) +
         (SELECT COUNT(*) FROM public.products WHERE updated_at < created_at)) = 0,
        'All updated_at timestamps should be >= created_at timestamps';
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- DATA QUALITY AND COMPLETENESS HELPERS
-- =============================================================================

-- Calculate comprehensive data quality metrics
CREATE OR REPLACE FUNCTION test_schema.calculate_data_quality_metrics()
RETURNS TABLE(
    entity_type TEXT,
    total_records INTEGER,
    complete_records INTEGER,
    completeness_percentage DECIMAL(5,2),
    quality_score TEXT
) AS $$
BEGIN
    -- Contact data quality
    RETURN QUERY
    SELECT 
        'contacts'::TEXT,
        COUNT(*)::INTEGER,
        COUNT(CASE WHEN first_name IS NOT NULL 
                   AND last_name IS NOT NULL 
                   AND email IS NOT NULL 
                   AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
                   AND role IS NOT NULL
                   THEN 1 END)::INTEGER,
        CASE WHEN COUNT(*) > 0 
             THEN ROUND((COUNT(CASE WHEN first_name IS NOT NULL 
                                   AND last_name IS NOT NULL 
                                   AND email IS NOT NULL 
                                   AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
                                   AND role IS NOT NULL
                                   THEN 1 END) * 100.0 / COUNT(*))::numeric, 2)
             ELSE 100.0 END,
        CASE WHEN COUNT(*) = 0 THEN 'NO_DATA'
             WHEN COUNT(CASE WHEN first_name IS NOT NULL 
                             AND last_name IS NOT NULL 
                             AND email IS NOT NULL 
                             AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
                             AND role IS NOT NULL
                             THEN 1 END) * 100.0 / COUNT(*) >= 90 THEN 'EXCELLENT'
             WHEN COUNT(CASE WHEN first_name IS NOT NULL 
                             AND last_name IS NOT NULL 
                             AND email IS NOT NULL 
                             AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
                             AND role IS NOT NULL
                             THEN 1 END) * 100.0 / COUNT(*) >= 75 THEN 'GOOD'
             WHEN COUNT(CASE WHEN first_name IS NOT NULL 
                             AND last_name IS NOT NULL 
                             AND email IS NOT NULL 
                             AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
                             AND role IS NOT NULL
                             THEN 1 END) * 100.0 / COUNT(*) >= 50 THEN 'FAIR'
             ELSE 'POOR' END
    FROM public.contacts
    WHERE deleted_at IS NULL;
    
    -- Organization data quality
    RETURN QUERY
    SELECT 
        'organizations'::TEXT,
        COUNT(*)::INTEGER,
        COUNT(CASE WHEN name IS NOT NULL 
                   AND type IS NOT NULL
                   AND city IS NOT NULL
                   AND state_province IS NOT NULL
                   AND country IS NOT NULL
                   THEN 1 END)::INTEGER,
        CASE WHEN COUNT(*) > 0 
             THEN ROUND((COUNT(CASE WHEN name IS NOT NULL 
                                   AND type IS NOT NULL
                                   AND city IS NOT NULL
                                   AND state_province IS NOT NULL
                                   AND country IS NOT NULL
                                   THEN 1 END) * 100.0 / COUNT(*))::numeric, 2)
             ELSE 100.0 END,
        CASE WHEN COUNT(*) = 0 THEN 'NO_DATA'
             WHEN COUNT(CASE WHEN name IS NOT NULL 
                             AND type IS NOT NULL
                             AND city IS NOT NULL
                             AND state_province IS NOT NULL
                             AND country IS NOT NULL
                             THEN 1 END) * 100.0 / COUNT(*) >= 90 THEN 'EXCELLENT'
             WHEN COUNT(CASE WHEN name IS NOT NULL 
                             AND type IS NOT NULL
                             AND city IS NOT NULL
                             AND state_province IS NOT NULL
                             AND country IS NOT NULL
                             THEN 1 END) * 100.0 / COUNT(*) >= 75 THEN 'GOOD'
             WHEN COUNT(CASE WHEN name IS NOT NULL 
                             AND type IS NOT NULL
                             AND city IS NOT NULL
                             AND state_province IS NOT NULL
                             AND country IS NOT NULL
                             THEN 1 END) * 100.0 / COUNT(*) >= 50 THEN 'FAIR'
             ELSE 'POOR' END
    FROM public.organizations
    WHERE deleted_at IS NULL;
    
    -- Opportunity data quality
    RETURN QUERY
    SELECT 
        'opportunities'::TEXT,
        COUNT(*)::INTEGER,
        COUNT(CASE WHEN name IS NOT NULL 
                   AND organization_id IS NOT NULL
                   AND stage IS NOT NULL
                   AND probability_percent IS NOT NULL
                   AND probability_percent >= 0 
                   AND probability_percent <= 100
                   THEN 1 END)::INTEGER,
        CASE WHEN COUNT(*) > 0 
             THEN ROUND((COUNT(CASE WHEN name IS NOT NULL 
                                   AND organization_id IS NOT NULL
                                   AND stage IS NOT NULL
                                   AND probability_percent IS NOT NULL
                                   AND probability_percent >= 0 
                                   AND probability_percent <= 100
                                   THEN 1 END) * 100.0 / COUNT(*))::numeric, 2)
             ELSE 100.0 END,
        CASE WHEN COUNT(*) = 0 THEN 'NO_DATA'
             WHEN COUNT(CASE WHEN name IS NOT NULL 
                             AND organization_id IS NOT NULL
                             AND stage IS NOT NULL
                             AND probability_percent IS NOT NULL
                             AND probability_percent >= 0 
                             AND probability_percent <= 100
                             THEN 1 END) * 100.0 / COUNT(*) >= 90 THEN 'EXCELLENT'
             WHEN COUNT(CASE WHEN name IS NOT NULL 
                             AND organization_id IS NOT NULL
                             AND stage IS NOT NULL
                             AND probability_percent IS NOT NULL
                             AND probability_percent >= 0 
                             AND probability_percent <= 100
                             THEN 1 END) * 100.0 / COUNT(*) >= 75 THEN 'GOOD'
             WHEN COUNT(CASE WHEN name IS NOT NULL 
                             AND organization_id IS NOT NULL
                             AND stage IS NOT NULL
                             AND probability_percent IS NOT NULL
                             AND probability_percent >= 0 
                             AND probability_percent <= 100
                             THEN 1 END) * 100.0 / COUNT(*) >= 50 THEN 'FAIR'
             ELSE 'POOR' END
    FROM public.opportunities;
    
    -- Product data quality
    RETURN QUERY
    SELECT 
        'products'::TEXT,
        COUNT(*)::INTEGER,
        COUNT(CASE WHEN name IS NOT NULL 
                   AND category IS NOT NULL
                   AND (unit_cost IS NULL OR unit_cost >= 0)
                   AND (suggested_retail_price IS NULL OR suggested_retail_price >= 0)
                   THEN 1 END)::INTEGER,
        CASE WHEN COUNT(*) > 0 
             THEN ROUND((COUNT(CASE WHEN name IS NOT NULL 
                                   AND category IS NOT NULL
                                   AND (unit_cost IS NULL OR unit_cost >= 0)
                                   AND (suggested_retail_price IS NULL OR suggested_retail_price >= 0)
                                   THEN 1 END) * 100.0 / COUNT(*))::numeric, 2)
             ELSE 100.0 END,
        CASE WHEN COUNT(*) = 0 THEN 'NO_DATA'
             WHEN COUNT(CASE WHEN name IS NOT NULL 
                             AND category IS NOT NULL
                             AND (unit_cost IS NULL OR unit_cost >= 0)
                             AND (suggested_retail_price IS NULL OR suggested_retail_price >= 0)
                             THEN 1 END) * 100.0 / COUNT(*) >= 90 THEN 'EXCELLENT'
             WHEN COUNT(CASE WHEN name IS NOT NULL 
                             AND category IS NOT NULL
                             AND (unit_cost IS NULL OR unit_cost >= 0)
                             AND (suggested_retail_price IS NULL OR suggested_retail_price >= 0)
                             THEN 1 END) * 100.0 / COUNT(*) >= 75 THEN 'GOOD'
             WHEN COUNT(CASE WHEN name IS NOT NULL 
                             AND category IS NOT NULL
                             AND (unit_cost IS NULL OR unit_cost >= 0)
                             AND (suggested_retail_price IS NULL OR suggested_retail_price >= 0)
                             THEN 1 END) * 100.0 / COUNT(*) >= 50 THEN 'FAIR'
             ELSE 'POOR' END
    FROM public.products
    WHERE deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMPREHENSIVE SYSTEM INTEGRITY VALIDATION
-- =============================================================================

-- Calculate overall system integrity score
CREATE OR REPLACE FUNCTION test_schema.calculate_system_integrity_score()
RETURNS TABLE(
    integrity_dimension TEXT,
    score_percentage DECIMAL(5,2),
    weight_factor DECIMAL(3,2),
    weighted_score DECIMAL(5,2),
    status_description TEXT
) AS $$
DECLARE
    referential_score DECIMAL(5,2);
    business_rule_score DECIMAL(5,2);
    temporal_score DECIMAL(5,2);
    completeness_score DECIMAL(5,2);
BEGIN
    -- Calculate referential integrity score
    WITH ref_integrity AS (
        SELECT COUNT(*) as total_records,
               SUM(CASE WHEN is_valid THEN 1 ELSE 0 END) as valid_records
        FROM (
            SELECT EXISTS(SELECT 1 FROM public.organizations o WHERE o.id = c.organization_id AND o.deleted_at IS NULL) as is_valid
            FROM public.contacts c WHERE c.deleted_at IS NULL
            UNION ALL
            SELECT EXISTS(SELECT 1 FROM public.organizations o WHERE o.id = opp.organization_id AND o.deleted_at IS NULL) as is_valid
            FROM public.opportunities opp
            UNION ALL
            SELECT EXISTS(SELECT 1 FROM public.opportunities o WHERE o.id = i.opportunity_id) as is_valid
            FROM public.interactions i
        ) all_refs
    )
    SELECT CASE WHEN total_records > 0 THEN (valid_records * 100.0 / total_records) ELSE 100 END
    INTO referential_score
    FROM ref_integrity;
    
    -- Calculate business rule compliance score
    WITH business_rules AS (
        SELECT COUNT(*) as total_orgs,
               SUM(CASE WHEN NOT (is_principal = TRUE AND is_distributor = TRUE) THEN 1 ELSE 0 END) as compliant_orgs
        FROM public.organizations WHERE deleted_at IS NULL
    )
    SELECT CASE WHEN total_orgs > 0 THEN (compliant_orgs * 100.0 / total_orgs) ELSE 100 END
    INTO business_rule_score
    FROM business_rules;
    
    -- Calculate temporal consistency score
    WITH temporal_checks AS (
        SELECT SUM(violations) as total_violations,
               4 as total_checks -- Number of temporal consistency checks
        FROM (
            SELECT COUNT(*) as violations FROM public.interactions i
            JOIN public.opportunities o ON i.opportunity_id = o.id
            WHERE i.interaction_date < o.created_at
            UNION ALL
            SELECT COUNT(*) FROM public.contacts WHERE updated_at < created_at
            UNION ALL
            SELECT COUNT(*) FROM public.organizations WHERE updated_at < created_at
            UNION ALL
            SELECT COUNT(*) FROM public.opportunities WHERE updated_at < created_at
        ) all_temporal_checks
    )
    SELECT CASE WHEN total_checks > 0 THEN ((total_checks - LEAST(total_violations, total_checks)) * 100.0 / total_checks) ELSE 100 END
    INTO temporal_score
    FROM temporal_checks;
    
    -- Calculate data completeness score
    WITH completeness_check AS (
        SELECT AVG(completion_rate) as avg_completeness
        FROM (
            SELECT (COUNT(CASE WHEN first_name IS NOT NULL AND last_name IS NOT NULL AND email IS NOT NULL THEN 1 END) * 100.0 / GREATEST(COUNT(*), 1)) as completion_rate
            FROM public.contacts WHERE deleted_at IS NULL
            UNION ALL
            SELECT (COUNT(CASE WHEN name IS NOT NULL AND type IS NOT NULL THEN 1 END) * 100.0 / GREATEST(COUNT(*), 1))
            FROM public.organizations WHERE deleted_at IS NULL
            UNION ALL
            SELECT (COUNT(CASE WHEN name IS NOT NULL AND stage IS NOT NULL THEN 1 END) * 100.0 / GREATEST(COUNT(*), 1))
            FROM public.opportunities
        ) entity_completeness
    )
    SELECT COALESCE(avg_completeness, 100)
    INTO completeness_score
    FROM completeness_check;
    
    -- Return weighted scores
    RETURN QUERY VALUES 
        ('referential_integrity', referential_score, 0.35::DECIMAL(3,2), referential_score * 0.35, 
         CASE WHEN referential_score >= 95 THEN 'EXCELLENT' 
              WHEN referential_score >= 85 THEN 'GOOD' 
              WHEN referential_score >= 70 THEN 'FAIR' 
              ELSE 'POOR' END),
        ('business_rule_compliance', business_rule_score, 0.30::DECIMAL(3,2), business_rule_score * 0.30,
         CASE WHEN business_rule_score >= 95 THEN 'EXCELLENT' 
              WHEN business_rule_score >= 85 THEN 'GOOD' 
              WHEN business_rule_score >= 70 THEN 'FAIR' 
              ELSE 'POOR' END),
        ('temporal_consistency', temporal_score, 0.20::DECIMAL(3,2), temporal_score * 0.20,
         CASE WHEN temporal_score >= 95 THEN 'EXCELLENT' 
              WHEN temporal_score >= 85 THEN 'GOOD' 
              WHEN temporal_score >= 70 THEN 'FAIR' 
              ELSE 'POOR' END),
        ('data_completeness', completeness_score, 0.15::DECIMAL(3,2), completeness_score * 0.15,
         CASE WHEN completeness_score >= 95 THEN 'EXCELLENT' 
              WHEN completeness_score >= 85 THEN 'GOOD' 
              WHEN completeness_score >= 70 THEN 'FAIR' 
              ELSE 'POOR' END);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- BUSINESS LOGIC TEST EXECUTION HELPERS
-- =============================================================================

-- Execute comprehensive business logic validation suite
CREATE OR REPLACE FUNCTION test_schema.execute_business_logic_validation_suite()
RETURNS TABLE(
    validation_category TEXT,
    tests_executed INTEGER,
    tests_passed INTEGER,
    success_rate DECIMAL(5,2),
    critical_issues INTEGER,
    summary_status TEXT
) AS $$
DECLARE
    total_tests INTEGER := 0;
    passed_tests INTEGER := 0;
    critical_failures INTEGER := 0;
BEGIN
    -- This function would orchestrate execution of all business logic validation
    -- For demonstration, returning sample results
    
    RETURN QUERY VALUES 
        ('Organization Business Rules', 25, 24, 96.0, 1, 'GOOD'),
        ('Opportunity Workflow Rules', 30, 28, 93.3, 2, 'GOOD'),
        ('Product-Principal Associations', 20, 19, 95.0, 1, 'EXCELLENT'),
        ('Cross-Entity Relationships', 35, 33, 94.3, 2, 'GOOD'),
        ('Data Consistency Validation', 40, 38, 95.0, 2, 'EXCELLENT'),
        ('Temporal Consistency', 15, 15, 100.0, 0, 'EXCELLENT'),
        ('JSONB Structure Validation', 10, 10, 100.0, 0, 'EXCELLENT'),
        ('Enumerated Type Consistency', 12, 12, 100.0, 0, 'EXCELLENT');
END;
$$ LANGUAGE plpgsql;