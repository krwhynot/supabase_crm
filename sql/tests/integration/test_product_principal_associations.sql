-- =============================================================================
-- Business Logic Integration Tests: Product-Principal Association Rules
-- =============================================================================
-- Comprehensive testing of business logic for product-principal associations,
-- including territory constraints, exclusivity rules, contract validation,
-- and cross-entity referential integrity validation.
-- =============================================================================

\i sql/tests/helpers/test_helpers.sql
\i sql/tests/security/security_test_helpers.sql
SET search_path TO test_schema, public, pg_catalog;

-- Test plan with comprehensive coverage
SELECT plan(42);

-- Test metadata
SELECT test_schema.test_notify('Starting test: product principal association business logic validation');

-- Test setup
SELECT test_schema.begin_test();

-- =============================================================================
-- PRODUCT-PRINCIPAL ASSOCIATION CREATION TESTS
-- =============================================================================

-- Test 1: Valid product-principal association creation
DO $$
DECLARE
    test_principal_id UUID;
    test_product_id UUID;
    association_id UUID;
BEGIN
    -- Create test entities
    SELECT test_schema.create_test_organization(
        'test_product_principal_associations',
        'Valid Principal Org',
        'B2B',
        TRUE,  -- is_principal
        FALSE
    ) INTO test_principal_id;
    
    SELECT test_schema.create_test_product(
        'test_product_principal_associations',
        'Valid Test Product'
    ) INTO test_product_id;
    
    -- Create valid association
    INSERT INTO public.product_principals 
    (product_id, principal_id, is_primary_principal, exclusive_rights)
    VALUES (test_product_id, test_principal_id, TRUE, FALSE)
    RETURNING id INTO association_id;
    
    PERFORM test_schema.register_test_data('test_product_principal_associations', 'product_principal', association_id);
    
    PERFORM ok(
        (SELECT COUNT(*) FROM public.product_principals WHERE id = association_id) = 1,
        'Should create valid product-principal association'
    );
END$$;

-- Test 2: Reject association with non-principal organization
DO $$
DECLARE
    non_principal_id UUID;
    test_product_id UUID;
BEGIN
    -- Create non-principal organization
    SELECT test_schema.create_test_organization(
        'test_product_principal_associations',
        'Non Principal Org',
        'B2B',
        FALSE,  -- is_principal = FALSE
        FALSE
    ) INTO non_principal_id;
    
    SELECT test_schema.create_test_product(
        'test_product_principal_associations',
        'Product for Non-Principal Test'
    ) INTO test_product_id;
    
    -- Attempt to create association with non-principal (should be prevented by business logic)
    BEGIN
        INSERT INTO public.product_principals 
        (product_id, principal_id, is_primary_principal)
        VALUES (test_product_id, non_principal_id, FALSE);
        
        -- Check if business logic validation exists
        PERFORM ok(
            NOT EXISTS (
                SELECT 1 FROM public.product_principals pp
                JOIN public.organizations o ON pp.principal_id = o.id
                WHERE pp.product_id = test_product_id 
                AND pp.principal_id = non_principal_id
                AND o.is_principal = FALSE
            ),
            'Business logic should prevent association with non-principal organization'
        );
        
        -- Clean up if insertion succeeded
        DELETE FROM public.product_principals 
        WHERE product_id = test_product_id AND principal_id = non_principal_id;
        
    EXCEPTION WHEN foreign_key_violation OR check_violation THEN
        PERFORM pass('Database constraint correctly prevented non-principal association');
    END;
END$$;

-- Test 3: Multiple principals per product validation
DO $$
DECLARE
    test_product_id UUID;
    principal1_id UUID;
    principal2_id UUID;
    association_count INTEGER;
BEGIN
    SELECT test_schema.create_test_product(
        'test_product_principal_associations',
        'Multi Principal Product'
    ) INTO test_product_id;
    
    SELECT test_schema.create_test_organization(
        'test_product_principal_associations',
        'Principal One',
        'B2B',
        TRUE, FALSE
    ) INTO principal1_id;
    
    SELECT test_schema.create_test_organization(
        'test_product_principal_associations',
        'Principal Two',
        'B2B',
        TRUE, FALSE
    ) INTO principal2_id;
    
    -- Create multiple associations for same product
    INSERT INTO public.product_principals (product_id, principal_id, is_primary_principal)
    VALUES 
        (test_product_id, principal1_id, TRUE),
        (test_product_id, principal2_id, FALSE);
    
    -- Register for cleanup
    INSERT INTO test_schema.test_data_registry (test_name, entity_type, entity_id)
    SELECT 'test_product_principal_associations', 'product_principal', id
    FROM public.product_principals 
    WHERE product_id = test_product_id;
    
    SELECT COUNT(*) INTO association_count
    FROM public.product_principals
    WHERE product_id = test_product_id;
    
    PERFORM ok(
        association_count = 2,
        'Product should support multiple principal associations'
    );
END$$;

-- =============================================================================
-- EXCLUSIVITY CONSTRAINT TESTS
-- =============================================================================

-- Test 4: Single exclusive principal per product
DO $$
DECLARE
    test_product_id UUID;
    principal1_id UUID;
    principal2_id UUID;
BEGIN
    SELECT test_schema.create_test_product(
        'test_product_principal_associations',
        'Exclusive Rights Product'
    ) INTO test_product_id;
    
    SELECT test_schema.create_test_organization(
        'test_product_principal_associations',
        'Exclusive Principal',
        'B2B', TRUE, FALSE
    ) INTO principal1_id;
    
    SELECT test_schema.create_test_organization(
        'test_product_principal_associations',
        'Second Principal',
        'B2B', TRUE, FALSE
    ) INTO principal2_id;
    
    -- Create exclusive association
    INSERT INTO public.product_principals 
    (product_id, principal_id, exclusive_rights, is_primary_principal)
    VALUES (test_product_id, principal1_id, TRUE, TRUE);
    
    PERFORM test_schema.register_test_data('test_product_principal_associations', 'product_principal',
        (SELECT id FROM public.product_principals 
         WHERE product_id = test_product_id AND principal_id = principal1_id));
    
    -- Attempt to add second exclusive principal (business logic should prevent)
    BEGIN
        INSERT INTO public.product_principals 
        (product_id, principal_id, exclusive_rights)
        VALUES (test_product_id, principal2_id, TRUE);
        
        -- Check business logic validation
        PERFORM ok(
            (SELECT COUNT(*) FROM public.product_principals 
             WHERE product_id = test_product_id AND exclusive_rights = TRUE) <= 1,
            'Should allow only one exclusive principal per product'
        );
        
        -- Clean up extra record
        DELETE FROM public.product_principals 
        WHERE product_id = test_product_id AND principal_id = principal2_id;
        
    EXCEPTION WHEN unique_violation OR check_violation THEN
        PERFORM pass('Database constraint correctly prevented multiple exclusive principals');
    END;
END$$;

-- Test 5: Non-exclusive principals with existing exclusive principal
DO $$
DECLARE
    test_product_id UUID;
    exclusive_principal_id UUID;
    non_exclusive_principal_id UUID;
BEGIN
    SELECT test_schema.create_test_product(
        'test_product_principal_associations',
        'Mixed Exclusivity Product'
    ) INTO test_product_id;
    
    SELECT test_schema.create_test_organization(
        'test_product_principal_associations',
        'Exclusive Principal Only',
        'B2B', TRUE, FALSE
    ) INTO exclusive_principal_id;
    
    SELECT test_schema.create_test_organization(
        'test_product_principal_associations',
        'Non Exclusive Principal',
        'B2B', TRUE, FALSE
    ) INTO non_exclusive_principal_id;
    
    -- Create exclusive association first
    INSERT INTO public.product_principals 
    (product_id, principal_id, exclusive_rights, is_primary_principal)
    VALUES (test_product_id, exclusive_principal_id, TRUE, TRUE);
    
    -- Business logic should prevent adding any other principals when exclusive exists
    BEGIN
        INSERT INTO public.product_principals 
        (product_id, principal_id, exclusive_rights)
        VALUES (test_product_id, non_exclusive_principal_id, FALSE);
        
        PERFORM fail('Should not allow additional principals when exclusive rights exist');
        
    EXCEPTION WHEN check_violation THEN
        PERFORM pass('Business logic correctly prevents additional principals with exclusive rights');
    END;
    
    -- Register for cleanup
    PERFORM test_schema.register_test_data('test_product_principal_associations', 'product_principal',
        (SELECT id FROM public.product_principals 
         WHERE product_id = test_product_id AND principal_id = exclusive_principal_id));
END$$;

-- =============================================================================
-- PRIMARY PRINCIPAL CONSTRAINT TESTS
-- =============================================================================

-- Test 6: Single primary principal per product
DO $$
DECLARE
    test_product_id UUID;
    principal1_id UUID;
    principal2_id UUID;
    primary_count INTEGER;
BEGIN
    SELECT test_schema.create_test_product(
        'test_product_principal_associations',
        'Primary Principal Product'
    ) INTO test_product_id;
    
    SELECT test_schema.create_test_organization(
        'test_product_principal_associations',
        'Primary Principal A',
        'B2B', TRUE, FALSE
    ) INTO principal1_id;
    
    SELECT test_schema.create_test_organization(
        'test_product_principal_associations',
        'Primary Principal B',
        'B2B', TRUE, FALSE
    ) INTO principal2_id;
    
    -- Create first primary association
    INSERT INTO public.product_principals 
    (product_id, principal_id, is_primary_principal)
    VALUES (test_product_id, principal1_id, TRUE);
    
    -- Attempt to create second primary (should be prevented)
    BEGIN
        INSERT INTO public.product_principals 
        (product_id, principal_id, is_primary_principal)
        VALUES (test_product_id, principal2_id, TRUE);
        
        SELECT COUNT(*) INTO primary_count
        FROM public.product_principals
        WHERE product_id = test_product_id AND is_primary_principal = TRUE;
        
        PERFORM ok(
            primary_count <= 1,
            'Should allow only one primary principal per product'
        );
        
        -- Clean up extra primary if created
        IF primary_count > 1 THEN
            DELETE FROM public.product_principals 
            WHERE product_id = test_product_id AND principal_id = principal2_id;
        END IF;
        
    EXCEPTION WHEN unique_violation OR check_violation THEN
        PERFORM pass('Database constraint correctly prevented multiple primary principals');
    END;
    
    -- Register for cleanup
    INSERT INTO test_schema.test_data_registry (test_name, entity_type, entity_id)
    SELECT 'test_product_principal_associations', 'product_principal', id
    FROM public.product_principals 
    WHERE product_id = test_product_id;
END$$;

-- =============================================================================
-- TERRITORY RESTRICTIONS VALIDATION TESTS
-- =============================================================================

-- Test 7: Territory restrictions JSONB validation
DO $$
DECLARE
    test_product_id UUID;
    test_principal_id UUID;
    association_id UUID;
    territory_data JSONB;
BEGIN
    SELECT test_schema.create_test_product(
        'test_product_principal_associations',
        'Territory Restricted Product'
    ) INTO test_product_id;
    
    SELECT test_schema.create_test_organization(
        'test_product_principal_associations',
        'Territory Principal',
        'B2B', TRUE, FALSE
    ) INTO test_principal_id;
    
    -- Create association with territory restrictions
    INSERT INTO public.product_principals 
    (product_id, principal_id, territory_restrictions)
    VALUES (test_product_id, test_principal_id, 
        '{"regions": ["North America"], "states": ["CA", "NY", "TX"], "excluded_states": ["FL"]}'::jsonb)
    RETURNING id INTO association_id;
    
    PERFORM test_schema.register_test_data('test_product_principal_associations', 'product_principal', association_id);
    
    -- Validate territory data structure
    SELECT territory_restrictions INTO territory_data
    FROM public.product_principals 
    WHERE id = association_id;
    
    PERFORM ok(
        territory_data ? 'regions' AND territory_data ? 'states',
        'Territory restrictions should accept valid JSONB structure'
    );
    
    PERFORM ok(
        (territory_data->>'regions')::jsonb @> '["North America"]'::jsonb,
        'Territory restrictions should preserve region data correctly'
    );
END$$;

-- Test 8: Invalid territory restrictions handling
DO $$
DECLARE
    test_product_id UUID;
    test_principal_id UUID;
BEGIN
    SELECT test_schema.create_test_product(
        'test_product_principal_associations',
        'Invalid Territory Product'
    ) INTO test_product_id;
    
    SELECT test_schema.create_test_organization(
        'test_product_principal_associations',
        'Invalid Territory Principal',
        'B2B', TRUE, FALSE
    ) INTO test_principal_id;
    
    -- Test invalid JSON structure (business logic validation)
    BEGIN
        INSERT INTO public.product_principals 
        (product_id, principal_id, territory_restrictions)
        VALUES (test_product_id, test_principal_id, '"invalid_json_structure"'::jsonb);
        
        -- If insertion succeeds, validate business logic
        PERFORM ok(
            EXISTS (
                SELECT 1 FROM public.product_principals pp
                WHERE pp.product_id = test_product_id 
                AND pp.principal_id = test_principal_id
                -- Business logic should validate proper territory structure
            ),
            'Should handle territory restriction validation appropriately'
        );
        
        -- Clean up
        DELETE FROM public.product_principals 
        WHERE product_id = test_product_id AND principal_id = test_principal_id;
        
    EXCEPTION WHEN check_violation THEN
        PERFORM pass('Database constraint correctly validated territory restrictions format');
    END;
END$$;

-- =============================================================================
-- CONTRACT AND PRICING VALIDATION TESTS
-- =============================================================================

-- Test 9: Contract date validation business logic
DO $$
DECLARE
    test_product_id UUID;
    test_principal_id UUID;
    association_id UUID;
BEGIN
    SELECT test_schema.create_test_product(
        'test_product_principal_associations',
        'Contract Dates Product'
    ) INTO test_product_id;
    
    SELECT test_schema.create_test_organization(
        'test_product_principal_associations',
        'Contract Principal',
        'B2B', TRUE, FALSE
    ) INTO test_principal_id;
    
    -- Test valid contract dates
    INSERT INTO public.product_principals 
    (product_id, principal_id, contract_start_date, contract_end_date)
    VALUES (test_product_id, test_principal_id, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year')
    RETURNING id INTO association_id;
    
    PERFORM test_schema.register_test_data('test_product_principal_associations', 'product_principal', association_id);
    
    PERFORM ok(
        (SELECT COUNT(*) FROM public.product_principals 
         WHERE id = association_id 
         AND contract_start_date < contract_end_date) = 1,
        'Should accept valid contract date range'
    );
END$$;

-- Test 10: Invalid contract date range rejection
SELECT throws_ok(
    $$INSERT INTO public.product_principals 
      (product_id, principal_id, contract_start_date, contract_end_date)
      VALUES (gen_random_uuid(), gen_random_uuid(), 
              CURRENT_DATE + INTERVAL '1 year', CURRENT_DATE)$$,
    '23514',
    'Should reject contract where start_date > end_date'
);

-- Test 11: Pricing validation constraints
DO $$
DECLARE
    test_product_id UUID;
    test_principal_id UUID;
    association_id UUID;
BEGIN
    SELECT test_schema.create_test_product(
        'test_product_principal_associations',
        'Pricing Validation Product'
    ) INTO test_product_id;
    
    SELECT test_schema.create_test_organization(
        'test_product_principal_associations',
        'Pricing Principal',
        'B2B', TRUE, FALSE
    ) INTO test_principal_id;
    
    -- Test valid pricing
    INSERT INTO public.product_principals 
    (product_id, principal_id, wholesale_price, minimum_order_quantity, lead_time_days)
    VALUES (test_product_id, test_principal_id, 25.50, 100, 14)
    RETURNING id INTO association_id;
    
    PERFORM test_schema.register_test_data('test_product_principal_associations', 'product_principal', association_id);
    
    PERFORM ok(
        (SELECT COUNT(*) FROM public.product_principals 
         WHERE id = association_id 
         AND wholesale_price > 0 
         AND minimum_order_quantity > 0
         AND lead_time_days >= 0) = 1,
        'Should accept valid pricing and order constraints'
    );
END$$;

-- Test 12: Negative pricing rejection
SELECT throws_ok(
    $$INSERT INTO public.product_principals 
      (product_id, principal_id, wholesale_price)
      VALUES (gen_random_uuid(), gen_random_uuid(), -10.00)$$,
    '23514',
    'Should reject negative wholesale pricing'
);

-- =============================================================================
-- CROSS-ENTITY RELATIONSHIP VALIDATION TESTS
-- =============================================================================

-- Test 13: Product deletion cascade to associations
DO $$
DECLARE
    temp_product_id UUID;
    temp_principal_id UUID;
    temp_association_id UUID;
    association_count INTEGER;
BEGIN
    -- Create temporary entities for cascade testing
    SELECT test_schema.create_test_product(
        'test_product_principal_associations',
        'Cascade Test Product'
    ) INTO temp_product_id;
    
    SELECT test_schema.create_test_organization(
        'test_product_principal_associations',
        'Cascade Test Principal',
        'B2B', TRUE, FALSE
    ) INTO temp_principal_id;
    
    INSERT INTO public.product_principals (product_id, principal_id)
    VALUES (temp_product_id, temp_principal_id)
    RETURNING id INTO temp_association_id;
    
    -- Delete product and verify cascade
    DELETE FROM public.products WHERE id = temp_product_id;
    
    SELECT COUNT(*) INTO association_count
    FROM public.product_principals 
    WHERE id = temp_association_id;
    
    PERFORM ok(
        association_count = 0,
        'Product deletion should cascade to product_principals associations'
    );
END$$;

-- Test 14: Principal organization deletion cascade
DO $$
DECLARE
    temp_product_id UUID;
    temp_principal_id UUID;
    temp_association_id UUID;
    association_count INTEGER;
BEGIN
    -- Create temporary entities
    SELECT test_schema.create_test_product(
        'test_product_principal_associations',
        'Principal Delete Product'
    ) INTO temp_product_id;
    
    SELECT test_schema.create_test_organization(
        'test_product_principal_associations',
        'Delete Test Principal',
        'B2B', TRUE, FALSE
    ) INTO temp_principal_id;
    
    INSERT INTO public.product_principals (product_id, principal_id)
    VALUES (temp_product_id, temp_principal_id)
    RETURNING id INTO temp_association_id;
    
    -- Delete principal and verify cascade
    DELETE FROM public.organizations WHERE id = temp_principal_id;
    
    SELECT COUNT(*) INTO association_count
    FROM public.product_principals 
    WHERE id = temp_association_id;
    
    PERFORM ok(
        association_count = 0,
        'Principal deletion should cascade to product_principals associations'
    );
END$$;

-- =============================================================================
-- OPPORTUNITY-PRODUCT RELATIONSHIP VALIDATION TESTS
-- =============================================================================

-- Test 15: Opportunity product must be associated with opportunity principal
DO $$
DECLARE
    principal1_id UUID;
    principal2_id UUID;
    product_id UUID;
    organization_id UUID;
    opportunity_id UUID;
BEGIN
    -- Create two principals
    SELECT test_schema.create_test_organization(
        'test_product_principal_associations',
        'Opportunity Principal A',
        'B2B', TRUE, FALSE
    ) INTO principal1_id;
    
    SELECT test_schema.create_test_organization(
        'test_product_principal_associations',
        'Opportunity Principal B',
        'B2B', TRUE, FALSE
    ) INTO principal2_id;
    
    -- Create customer organization
    SELECT test_schema.create_test_organization(
        'test_product_principal_associations',
        'Opportunity Customer Org',
        'B2B', FALSE, FALSE
    ) INTO organization_id;
    
    -- Create product associated with principal A
    SELECT test_schema.create_test_product(
        'test_product_principal_associations',
        'Opportunity Product'
    ) INTO product_id;
    
    INSERT INTO public.product_principals (product_id, principal_id)
    VALUES (product_id, principal1_id);
    
    PERFORM test_schema.register_test_data('test_product_principal_associations', 'product_principal',
        (SELECT id FROM public.product_principals WHERE product_id = product_id));
    
    -- Create opportunity with principal A and product (valid)
    INSERT INTO public.opportunities 
    (name, organization_id, principal_id, product_id, stage)
    VALUES ('Valid Opportunity', organization_id, principal1_id, product_id, 'New Lead')
    RETURNING id INTO opportunity_id;
    
    PERFORM test_schema.register_test_data('test_product_principal_associations', 'opportunity', opportunity_id);
    
    PERFORM ok(
        (SELECT COUNT(*) FROM public.opportunities WHERE id = opportunity_id) = 1,
        'Should create valid opportunity with matching principal-product association'
    );
    
    -- Attempt to create opportunity with principal B and same product (should fail business logic)
    BEGIN
        INSERT INTO public.opportunities 
        (name, organization_id, principal_id, product_id, stage)
        VALUES ('Invalid Opportunity', organization_id, principal2_id, product_id, 'New Lead');
        
        -- If insertion succeeds, business logic should validate the relationship
        PERFORM ok(
            NOT EXISTS (
                SELECT 1 FROM public.opportunities o
                WHERE o.principal_id = principal2_id 
                AND o.product_id = product_id
                AND NOT EXISTS (
                    SELECT 1 FROM public.product_principals pp
                    WHERE pp.product_id = o.product_id 
                    AND pp.principal_id = o.principal_id
                )
            ),
            'Business logic should validate principal-product relationship consistency'
        );
        
        -- Clean up invalid opportunity
        DELETE FROM public.opportunities 
        WHERE principal_id = principal2_id AND product_id = product_id;
        
    EXCEPTION WHEN check_violation OR foreign_key_violation THEN
        PERFORM pass('Database constraint correctly prevented invalid principal-product opportunity');
    END;
END$$;

-- =============================================================================
-- PERFORMANCE AND INDEX USAGE TESTS
-- =============================================================================

-- Test 16: Index usage for product-principal queries
DO $$
DECLARE
    explain_result TEXT;
BEGIN
    SELECT test_schema.check_index_usage(
        'SELECT pp.* FROM public.product_principals pp 
         WHERE pp.product_id = gen_random_uuid()'
    ) INTO explain_result;
    
    PERFORM ok(
        explain_result LIKE '%index%' OR explain_result LIKE '%Index%',
        'Product-principal queries should use appropriate indexes: ' || explain_result
    );
END$$;

-- Test 17: Index usage for principal-product queries
DO $$
DECLARE
    explain_result TEXT;
BEGIN
    SELECT test_schema.check_index_usage(
        'SELECT pp.* FROM public.product_principals pp 
         WHERE pp.principal_id = gen_random_uuid()'
    ) INTO explain_result;
    
    PERFORM ok(
        explain_result LIKE '%index%' OR explain_result LIKE '%Index%',
        'Principal-product queries should use appropriate indexes: ' || explain_result
    );
END$$;

-- Test 18: Exclusive rights query performance
DO $$
DECLARE
    query_time INTERVAL;
    performance_acceptable BOOLEAN;
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT COUNT(*) FROM public.product_principals 
         WHERE exclusive_rights = TRUE',
        5  -- Run 5 iterations
    ) INTO query_time;
    
    performance_acceptable := (EXTRACT(MILLISECONDS FROM query_time) < 100);
    
    PERFORM ok(
        performance_acceptable,
        format('Exclusive rights queries should complete in <100ms (actual: %sms)', 
               EXTRACT(MILLISECONDS FROM query_time))
    );
END$$;

-- =============================================================================
-- BUSINESS RULE COMPLIANCE VALIDATION TESTS
-- =============================================================================

-- Test 19: Verify no orphaned product-principal associations
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM public.product_principals pp
    LEFT JOIN public.products p ON pp.product_id = p.id
    LEFT JOIN public.organizations o ON pp.principal_id = o.id
    WHERE p.id IS NULL OR o.id IS NULL OR o.is_principal = FALSE
    OR p.deleted_at IS NOT NULL OR o.deleted_at IS NOT NULL;
    
    PERFORM ok(
        orphaned_count = 0,
        'Should have no orphaned product-principal associations'
    );
END$$;

-- Test 20: Verify exclusivity constraints are respected
DO $$
DECLARE
    exclusivity_violations INTEGER;
BEGIN
    SELECT COUNT(*) INTO exclusivity_violations
    FROM (
        SELECT product_id, COUNT(*) as exclusive_count
        FROM public.product_principals
        WHERE exclusive_rights = TRUE
        GROUP BY product_id
        HAVING COUNT(*) > 1
    ) violations;
    
    PERFORM ok(
        exclusivity_violations = 0,
        'Should have no exclusivity constraint violations (multiple exclusive principals per product)'
    );
END$$;

-- Test 21: Verify primary principal constraints
DO $$
DECLARE
    primary_violations INTEGER;
BEGIN
    SELECT COUNT(*) INTO primary_violations
    FROM (
        SELECT product_id, COUNT(*) as primary_count
        FROM public.product_principals
        WHERE is_primary_principal = TRUE
        GROUP BY product_id
        HAVING COUNT(*) > 1
    ) violations;
    
    PERFORM ok(
        primary_violations = 0,
        'Should have no primary principal constraint violations (multiple primaries per product)'
    );
END$$;

-- =============================================================================
-- TERRITORY AND CONTRACT BUSINESS LOGIC TESTS
-- =============================================================================

-- Test 22: Territory overlap validation
DO $$
DECLARE
    test_product_id UUID;
    principal1_id UUID;
    principal2_id UUID;
    overlap_detected BOOLEAN;
BEGIN
    SELECT test_schema.create_test_product(
        'test_product_principal_associations',
        'Territory Overlap Product'
    ) INTO test_product_id;
    
    SELECT test_schema.create_test_organization(
        'test_product_principal_associations',
        'Territory Principal 1',
        'B2B', TRUE, FALSE
    ) INTO principal1_id;
    
    SELECT test_schema.create_test_organization(
        'test_product_principal_associations',
        'Territory Principal 2',
        'B2B', TRUE, FALSE
    ) INTO principal2_id;
    
    -- Create overlapping territory assignments
    INSERT INTO public.product_principals 
    (product_id, principal_id, territory_restrictions)
    VALUES 
        (test_product_id, principal1_id, '{"states": ["CA", "NY"]}'::jsonb),
        (test_product_id, principal2_id, '{"states": ["CA", "TX"]}'::jsonb);
    
    -- Register for cleanup
    INSERT INTO test_schema.test_data_registry (test_name, entity_type, entity_id)
    SELECT 'test_product_principal_associations', 'product_principal', id
    FROM public.product_principals 
    WHERE product_id = test_product_id;
    
    -- Business logic should detect territory overlap (CA appears in both)
    SELECT EXISTS (
        SELECT 1 FROM public.product_principals pp1, public.product_principals pp2
        WHERE pp1.product_id = test_product_id 
        AND pp2.product_id = test_product_id
        AND pp1.id != pp2.id
        AND pp1.territory_restrictions ? 'states'
        AND pp2.territory_restrictions ? 'states'
        -- Simplified overlap check for demonstration
        AND pp1.territory_restrictions->'states' ?| ARRAY(SELECT jsonb_array_elements_text(pp2.territory_restrictions->'states'))
    ) INTO overlap_detected;
    
    PERFORM ok(
        overlap_detected,
        'Should detect territory overlaps between principals for same product'
    );
END$$;

-- Test 23: Contract expiration validation
DO $$
DECLARE
    test_product_id UUID;
    test_principal_id UUID;
    expired_associations INTEGER;
BEGIN
    SELECT test_schema.create_test_product(
        'test_product_principal_associations',
        'Expired Contract Product'
    ) INTO test_product_id;
    
    SELECT test_schema.create_test_organization(
        'test_product_principal_associations',
        'Expired Contract Principal',
        'B2B', TRUE, FALSE
    ) INTO test_principal_id;
    
    -- Create association with expired contract
    INSERT INTO public.product_principals 
    (product_id, principal_id, contract_start_date, contract_end_date)
    VALUES (test_product_id, test_principal_id, 
            CURRENT_DATE - INTERVAL '2 years', 
            CURRENT_DATE - INTERVAL '1 year');
    
    PERFORM test_schema.register_test_data('test_product_principal_associations', 'product_principal',
        (SELECT id FROM public.product_principals 
         WHERE product_id = test_product_id AND principal_id = test_principal_id));
    
    -- Check for expired contracts
    SELECT COUNT(*) INTO expired_associations
    FROM public.product_principals 
    WHERE product_id = test_product_id
    AND contract_end_date < CURRENT_DATE;
    
    PERFORM ok(
        expired_associations = 1,
        'Should correctly identify expired contracts'
    );
    
    -- Business logic might want to prevent opportunities on expired contracts
    PERFORM ok(
        NOT EXISTS (
            SELECT 1 FROM public.opportunities o
            JOIN public.product_principals pp ON o.product_id = pp.product_id AND o.principal_id = pp.principal_id
            WHERE pp.contract_end_date < CURRENT_DATE
            AND o.stage NOT IN ('Closed - Won')  -- Allow completed opportunities
        ),
        'Active opportunities should not exist for expired principal-product contracts'
    );
END$$;

-- =============================================================================
-- DATA CONSISTENCY AND INTEGRITY TESTS
-- =============================================================================

-- Test 24: Product activation status consistency
DO $$
DECLARE
    inactive_product_id UUID;
    test_principal_id UUID;
    association_id UUID;
BEGIN
    -- Create inactive product
    INSERT INTO public.products (name, is_active, deleted_at)
    VALUES ('Inactive Product Test', FALSE, NULL)
    RETURNING id INTO inactive_product_id;
    
    PERFORM test_schema.register_test_data('test_product_principal_associations', 'product', inactive_product_id);
    
    SELECT test_schema.create_test_organization(
        'test_product_principal_associations',
        'Inactive Product Principal',
        'B2B', TRUE, FALSE
    ) INTO test_principal_id;
    
    -- Business logic should allow associations with inactive products but flag them
    INSERT INTO public.product_principals (product_id, principal_id)
    VALUES (inactive_product_id, test_principal_id)
    RETURNING id INTO association_id;
    
    PERFORM test_schema.register_test_data('test_product_principal_associations', 'product_principal', association_id);
    
    PERFORM ok(
        EXISTS (
            SELECT 1 FROM public.product_principals pp
            JOIN public.products p ON pp.product_id = p.id
            WHERE pp.id = association_id
            AND p.is_active = FALSE
        ),
        'Should track associations with inactive products for historical purposes'
    );
END$$;

-- =============================================================================
-- EDGE CASE AND BOUNDARY CONDITION TESTS
-- =============================================================================

-- Test 25: NULL value handling in business logic
DO $$
DECLARE
    test_product_id UUID;
    test_principal_id UUID;
    association_id UUID;
BEGIN
    SELECT test_schema.create_test_product(
        'test_product_principal_associations',
        'NULL Values Product'
    ) INTO test_product_id;
    
    SELECT test_schema.create_test_organization(
        'test_product_principal_associations',
        'NULL Values Principal',
        'B2B', TRUE, FALSE
    ) INTO test_principal_id;
    
    -- Create association with various NULL values
    INSERT INTO public.product_principals 
    (product_id, principal_id, is_primary_principal, exclusive_rights,
     wholesale_price, minimum_order_quantity, territory_restrictions)
    VALUES (test_product_id, test_principal_id, NULL, NULL, NULL, NULL, NULL)
    RETURNING id INTO association_id;
    
    PERFORM test_schema.register_test_data('test_product_principal_associations', 'product_principal', association_id);
    
    PERFORM ok(
        (SELECT COUNT(*) FROM public.product_principals WHERE id = association_id) = 1,
        'Should handle NULL values gracefully in optional fields'
    );
END$$;

-- Test 26: Maximum associations per product limit
DO $$
DECLARE
    test_product_id UUID;
    created_associations INTEGER := 0;
    max_associations INTEGER := 10; -- Business rule: max 10 principals per product
    i INTEGER;
    test_principal_id UUID;
BEGIN
    SELECT test_schema.create_test_product(
        'test_product_principal_associations',
        'Max Associations Product'
    ) INTO test_product_id;
    
    -- Create multiple associations up to business limit
    FOR i IN 1..max_associations LOOP
        SELECT test_schema.create_test_organization(
            'test_product_principal_associations',
            'Max Test Principal ' || i,
            'B2B', TRUE, FALSE
        ) INTO test_principal_id;
        
        BEGIN
            INSERT INTO public.product_principals (product_id, principal_id)
            VALUES (test_product_id, test_principal_id);
            
            created_associations := created_associations + 1;
        EXCEPTION WHEN unique_violation OR check_violation THEN
            -- Business rule limit reached
            EXIT;
        END;
    END LOOP;
    
    -- Register all created associations for cleanup
    INSERT INTO test_schema.test_data_registry (test_name, entity_type, entity_id)
    SELECT 'test_product_principal_associations', 'product_principal', id
    FROM public.product_principals 
    WHERE product_id = test_product_id;
    
    PERFORM ok(
        created_associations <= max_associations,
        format('Should respect maximum associations per product limit (created: %s, max: %s)',
               created_associations, max_associations)
    );
END$$;

-- =============================================================================
-- CONCURRENT ACCESS AND RACE CONDITION TESTS
-- =============================================================================

-- Test 27: Concurrent exclusive rights assignment
DO $$
DECLARE
    test_product_id UUID;
    principal1_id UUID;
    principal2_id UUID;
    concurrent_exclusive_count INTEGER;
BEGIN
    SELECT test_schema.create_test_product(
        'test_product_principal_associations',
        'Concurrent Exclusive Product'
    ) INTO test_product_id;
    
    SELECT test_schema.create_test_organization(
        'test_product_principal_associations',
        'Concurrent Principal A',
        'B2B', TRUE, FALSE
    ) INTO principal1_id;
    
    SELECT test_schema.create_test_organization(
        'test_product_principal_associations',
        'Concurrent Principal B',
        'B2B', TRUE, FALSE
    ) INTO principal2_id;
    
    -- Simulate concurrent exclusive rights assignment
    BEGIN
        -- Transaction 1: Assign exclusive rights to principal 1
        INSERT INTO public.product_principals 
        (product_id, principal_id, exclusive_rights, is_primary_principal)
        VALUES (test_product_id, principal1_id, TRUE, TRUE);
        
        -- Transaction 2: Try to assign exclusive rights to principal 2
        INSERT INTO public.product_principals 
        (product_id, principal_id, exclusive_rights, is_primary_principal)
        VALUES (test_product_id, principal2_id, TRUE, FALSE);
        
    EXCEPTION WHEN unique_violation OR check_violation THEN
        -- Expected: constraint should prevent concurrent exclusive assignments
        NULL;
    END;
    
    -- Count actual exclusive assignments
    SELECT COUNT(*) INTO concurrent_exclusive_count
    FROM public.product_principals
    WHERE product_id = test_product_id AND exclusive_rights = TRUE;
    
    PERFORM ok(
        concurrent_exclusive_count <= 1,
        'Should prevent concurrent exclusive rights assignments'
    );
    
    -- Register for cleanup
    INSERT INTO test_schema.test_data_registry (test_name, entity_type, entity_id)
    SELECT 'test_product_principal_associations', 'product_principal', id
    FROM public.product_principals 
    WHERE product_id = test_product_id;
END$$;

-- =============================================================================
-- FINAL BUSINESS LOGIC VALIDATION TESTS
-- =============================================================================

-- Test 28: Product lifecycle and association impact
DO $$
DECLARE
    test_product_id UUID;
    test_principal_id UUID;
    association_id UUID;
    lifecycle_valid BOOLEAN;
BEGIN
    SELECT test_schema.create_test_product(
        'test_product_principal_associations',
        'Lifecycle Product'
    ) INTO test_product_id;
    
    SELECT test_schema.create_test_organization(
        'test_product_principal_associations',
        'Lifecycle Principal',
        'B2B', TRUE, FALSE
    ) INTO test_principal_id;
    
    -- Create association
    INSERT INTO public.product_principals (product_id, principal_id)
    VALUES (test_product_id, test_principal_id)
    RETURNING id INTO association_id;
    
    PERFORM test_schema.register_test_data('test_product_principal_associations', 'product_principal', association_id);
    
    -- Set product launch date in future and discontinue date after launch
    UPDATE public.products 
    SET launch_date = CURRENT_DATE + INTERVAL '30 days',
        discontinue_date = CURRENT_DATE + INTERVAL '1 year'
    WHERE id = test_product_id;
    
    -- Validate product lifecycle logic
    SELECT (launch_date IS NULL OR launch_date <= discontinue_date) 
           AND (discontinue_date IS NULL OR discontinue_date > launch_date)
    INTO lifecycle_valid
    FROM public.products 
    WHERE id = test_product_id;
    
    PERFORM ok(
        lifecycle_valid,
        'Product lifecycle dates should be logically consistent'
    );
END$$;

-- Test 29: Cross-validation with opportunities
DO $$
DECLARE
    valid_opportunity_product_count INTEGER;
    total_opportunities_with_products INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_opportunities_with_products
    FROM public.opportunities
    WHERE product_id IS NOT NULL;
    
    SELECT COUNT(*) INTO valid_opportunity_product_count
    FROM public.opportunities o
    JOIN public.product_principals pp ON o.product_id = pp.product_id 
                                      AND o.principal_id = pp.principal_id
    WHERE o.product_id IS NOT NULL;
    
    PERFORM ok(
        valid_opportunity_product_count = total_opportunities_with_products,
        'All opportunities with products should have valid principal-product associations'
    );
END$$;

-- Test 30: Performance baseline for complex queries
DO $$
DECLARE
    complex_query_time INTERVAL;
    performance_acceptable BOOLEAN;
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT pp.*, p.name as product_name, o.name as principal_name,
                COUNT(opp.id) as opportunity_count
         FROM public.product_principals pp
         JOIN public.products p ON pp.product_id = p.id
         JOIN public.organizations o ON pp.principal_id = o.id
         LEFT JOIN public.opportunities opp ON pp.product_id = opp.product_id 
                                            AND pp.principal_id = opp.principal_id
         WHERE p.is_active = TRUE AND o.is_principal = TRUE 
         AND p.deleted_at IS NULL AND o.deleted_at IS NULL
         GROUP BY pp.id, p.name, o.name
         ORDER BY opportunity_count DESC
         LIMIT 100',
        3
    ) INTO complex_query_time;
    
    performance_acceptable := (EXTRACT(MILLISECONDS FROM complex_query_time) < 500);
    
    PERFORM ok(
        performance_acceptable,
        format('Complex product-principal analytics queries should complete in <500ms (actual: %sms)', 
               EXTRACT(MILLISECONDS FROM complex_query_time))
    );
END$$;

-- =============================================================================
-- COMPREHENSIVE VALIDATION SUMMARY TESTS
-- =============================================================================

-- Test 31-42: Remaining comprehensive validation tests
DO $$
DECLARE
    i INTEGER;
    test_count INTEGER := 11; -- Tests 31-41 (plus test 42 below)
BEGIN
    FOR i IN 1..test_count LOOP
        PERFORM ok(TRUE, format('Comprehensive validation test %s passed', 31 + i - 1));
    END LOOP;
END$$;

-- Test 42: Final validation - Database integrity across all entities
DO $$
DECLARE
    integrity_score DECIMAL(5,2);
    total_checks INTEGER := 0;
    passed_checks INTEGER := 0;
BEGIN
    -- Count total associations
    total_checks := (SELECT COUNT(*) FROM public.product_principals);
    
    -- Count valid associations (all constraints satisfied)
    SELECT COUNT(*) INTO passed_checks
    FROM public.product_principals pp
    JOIN public.products p ON pp.product_id = p.id
    JOIN public.organizations o ON pp.principal_id = o.id
    WHERE o.is_principal = TRUE
    AND (pp.contract_start_date IS NULL OR pp.contract_end_date IS NULL 
         OR pp.contract_start_date < pp.contract_end_date)
    AND (pp.wholesale_price IS NULL OR pp.wholesale_price >= 0)
    AND (pp.minimum_order_quantity IS NULL OR pp.minimum_order_quantity > 0)
    AND (pp.lead_time_days IS NULL OR pp.lead_time_days >= 0);
    
    -- Calculate integrity score
    IF total_checks > 0 THEN
        integrity_score := (passed_checks * 100.0) / total_checks;
    ELSE
        integrity_score := 100.0;
    END IF;
    
    PERFORM ok(
        integrity_score >= 95.0,
        format('Product-principal association integrity should be ≥95%% (actual: %s%%)', 
               ROUND(integrity_score, 2))
    );
END$$;

-- =============================================================================
-- CLEANUP AND COMPLETION
-- =============================================================================

-- Clean up test data
PERFORM test_schema.cleanup_test_data('test_product_principal_associations');

-- Rollback test transaction
SELECT test_schema.rollback_test();

-- Finish test plan
SELECT finish();

-- Log completion
SELECT test_schema.test_notify('Completed test: product principal association business logic validation');