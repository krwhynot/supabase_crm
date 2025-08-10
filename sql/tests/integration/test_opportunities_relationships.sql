-- =============================================================================
-- Integration Tests for Opportunities and Related Tables
-- =============================================================================
-- This file tests the complex relationships between opportunities, organizations,
-- products, and principals, including cascade behaviors and data integrity.
-- =============================================================================

\i sql/tests/helpers/test_helpers.sql
SET search_path TO test_schema, public, pg_catalog;

-- Test plan
SELECT plan(20);

-- Test metadata
SELECT test_schema.test_notify('Starting test: opportunities relationship integration');

-- Test setup
SELECT test_schema.begin_test();

-- =============================================================================
-- SETUP TEST DATA
-- =============================================================================

-- Create test entities for relationship testing
DO $$
DECLARE
    test_org_id UUID;
    test_principal_id UUID;
    test_product_id UUID;
    test_opportunity_id UUID;
BEGIN
    -- Create test organization
    SELECT test_schema.create_test_organization('test_opportunity_relationships', 'Customer Org') 
    INTO test_org_id;
    
    -- Create test principal
    SELECT test_schema.create_test_organization('test_opportunity_relationships', 'Principal Org', 'B2B', TRUE, FALSE) 
    INTO test_principal_id;
    
    -- Create test product
    SELECT test_schema.create_test_product('test_opportunity_relationships', 'Integration Test Product')
    INTO test_product_id;
    
    -- Store for later tests
    INSERT INTO test_schema.test_data_registry (test_name, entity_type, entity_id)
    VALUES 
        ('test_opportunity_relationships_setup', 'organization', test_org_id),
        ('test_opportunity_relationships_setup', 'principal', test_principal_id),
        ('test_opportunity_relationships_setup', 'product', test_product_id);
END$$;

-- =============================================================================
-- FOREIGN KEY RELATIONSHIP TESTS
-- =============================================================================

-- Test 1: Valid opportunity creation with all relationships
DO $$
DECLARE
    test_org_id UUID;
    test_principal_id UUID;
    test_product_id UUID;
    test_opportunity_id UUID;
BEGIN
    -- Get test entities
    SELECT entity_id INTO test_org_id 
    FROM test_schema.test_data_registry 
    WHERE test_name = 'test_opportunity_relationships_setup' AND entity_type = 'organization';
    
    SELECT entity_id INTO test_principal_id 
    FROM test_schema.test_data_registry 
    WHERE test_name = 'test_opportunity_relationships_setup' AND entity_type = 'principal';
    
    SELECT entity_id INTO test_product_id 
    FROM test_schema.test_data_registry 
    WHERE test_name = 'test_opportunity_relationships_setup' AND entity_type = 'product';
    
    -- Create opportunity with all relationships
    INSERT INTO public.opportunities (
        name, stage, probability_percent, expected_close_date,
        organization_id, principal_id, product_id, deal_owner, notes
    )
    VALUES (
        'Integration Test Opportunity',
        'New Lead',
        10,
        CURRENT_DATE + INTERVAL '30 days',
        test_org_id,
        test_principal_id,
        test_product_id,
        'Test Owner',
        'Created by integration test'
    )
    RETURNING id INTO test_opportunity_id;
    
    PERFORM test_schema.register_test_data('test_opportunity_relationships', 'opportunity', test_opportunity_id);
    
    PERFORM ok(
        (SELECT COUNT(*) FROM public.opportunities WHERE id = test_opportunity_id) = 1,
        'Should create opportunity with valid foreign key relationships'
    );
END$$;

-- Test 2: Foreign key constraint validation - invalid organization
SELECT throws_ok(
    $$INSERT INTO public.opportunities (name, organization_id, stage)
      VALUES ('Invalid Org Test', '00000000-0000-0000-0000-000000000000', 'New Lead')$$,
    '23503',
    'Should reject opportunity with non-existent organization_id'
);

-- Test 3: Foreign key constraint validation - invalid principal
SELECT throws_ok(
    $$INSERT INTO public.opportunities (name, principal_id, stage)
      VALUES ('Invalid Principal Test', '00000000-0000-0000-0000-000000000000', 'New Lead')$$,
    '23503',
    'Should reject opportunity with non-existent principal_id'
);

-- Test 4: Foreign key constraint validation - invalid product
SELECT throws_ok(
    $$INSERT INTO public.opportunities (name, product_id, stage)
      VALUES ('Invalid Product Test', '00000000-0000-0000-0000-000000000000', 'New Lead')$$,
    '23503',
    'Should reject opportunity with non-existent product_id'
);

-- =============================================================================
-- PRODUCT-PRINCIPAL RELATIONSHIP TESTS
-- =============================================================================

-- Test 5: Product-Principal junction table
DO $$
DECLARE
    test_product_id UUID;
    test_principal_id UUID;
    relationship_id UUID;
BEGIN
    -- Get test entities
    SELECT entity_id INTO test_product_id 
    FROM test_schema.test_data_registry 
    WHERE test_name = 'test_opportunity_relationships_setup' AND entity_type = 'product';
    
    SELECT entity_id INTO test_principal_id 
    FROM test_schema.test_data_registry 
    WHERE test_name = 'test_opportunity_relationships_setup' AND entity_type = 'principal';
    
    -- Create product-principal relationship
    INSERT INTO public.product_principals (
        product_id, principal_id, is_primary_principal, 
        wholesale_price, minimum_order_quantity
    )
    VALUES (
        test_product_id, test_principal_id, TRUE,
        8.50, 100
    )
    RETURNING id INTO relationship_id;
    
    PERFORM test_schema.register_test_data('test_opportunity_relationships', 'product_principal', relationship_id);
    
    PERFORM ok(
        (SELECT COUNT(*) FROM public.product_principals WHERE id = relationship_id) = 1,
        'Should create product-principal relationship successfully'
    );
END$$;

-- Test 6: Cascade delete behavior - product deletion
DO $$
DECLARE
    temp_product_id UUID;
    temp_principal_id UUID;
    relationship_count INTEGER;
BEGIN
    -- Create temporary product and principal for deletion test
    SELECT test_schema.create_test_product('test_opportunity_relationships', 'Delete Test Product')
    INTO temp_product_id;
    
    SELECT test_schema.create_test_organization('test_opportunity_relationships', 'Delete Test Principal', 'B2B', TRUE, FALSE)
    INTO temp_principal_id;
    
    -- Create relationship
    INSERT INTO public.product_principals (product_id, principal_id)
    VALUES (temp_product_id, temp_principal_id);
    
    -- Delete product (should cascade to product_principals)
    DELETE FROM public.products WHERE id = temp_product_id;
    
    -- Check that relationship was deleted
    SELECT COUNT(*) INTO relationship_count
    FROM public.product_principals
    WHERE product_id = temp_product_id;
    
    PERFORM ok(
        relationship_count = 0,
        'Product deletion should cascade to product_principals table'
    );
    
    -- Clean up principal
    DELETE FROM public.organizations WHERE id = temp_principal_id;
END$$;

-- =============================================================================
-- COMPLEX QUERY TESTS
-- =============================================================================

-- Test 7: Opportunity with organization details query
DO $$
DECLARE
    result_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO result_count
    FROM public.opportunities o
    JOIN public.organizations org ON o.organization_id = org.id
    WHERE org.name LIKE 'Customer Org%'
    AND o.stage = 'New Lead';
    
    PERFORM ok(
        result_count > 0,
        'Should be able to join opportunities with organizations'
    );
END$$;

-- Test 8: Opportunity with principal details query
DO $$
DECLARE
    result_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO result_count
    FROM public.opportunities o
    JOIN public.organizations principal ON o.principal_id = principal.id
    WHERE principal.is_principal = TRUE
    AND o.stage = 'New Lead';
    
    PERFORM ok(
        result_count > 0,
        'Should be able to join opportunities with principal organizations'
    );
END$$;

-- Test 9: Opportunity with product details query
DO $$
DECLARE
    result_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO result_count
    FROM public.opportunities o
    JOIN public.products p ON o.product_id = p.id
    WHERE p.name LIKE 'Integration Test Product%'
    AND o.stage = 'New Lead';
    
    PERFORM ok(
        result_count > 0,
        'Should be able to join opportunities with products'
    );
END$$;

-- Test 10: Full opportunity details query (all joins)
DO $$
DECLARE
    result_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO result_count
    FROM public.opportunities o
    JOIN public.organizations org ON o.organization_id = org.id
    JOIN public.organizations principal ON o.principal_id = principal.id
    JOIN public.products p ON o.product_id = p.id
    WHERE o.name = 'Integration Test Opportunity';
    
    PERFORM ok(
        result_count = 1,
        'Should be able to perform complex joins across all related tables'
    );
END$$;

-- =============================================================================
-- BUSINESS LOGIC VALIDATION TESTS
-- =============================================================================

-- Test 11: Principal organization validation
DO $$
DECLARE
    non_principal_id UUID;
    test_product_id UUID;
BEGIN
    -- Create non-principal organization
    SELECT test_schema.create_test_organization('test_opportunity_relationships', 'Non-Principal Org', 'B2B', FALSE, FALSE)
    INTO non_principal_id;
    
    SELECT entity_id INTO test_product_id 
    FROM test_schema.test_data_registry 
    WHERE test_name = 'test_opportunity_relationships_setup' AND entity_type = 'product';
    
    -- This should technically be allowed by the database, but might be flagged by business logic
    INSERT INTO public.opportunities (
        name, principal_id, product_id, stage
    )
    VALUES (
        'Non-Principal Test',
        non_principal_id,
        test_product_id,
        'New Lead'
    );
    
    PERFORM ok(
        (SELECT COUNT(*) FROM public.opportunities WHERE name = 'Non-Principal Test') = 1,
        'Database allows non-principal organization as principal_id (business logic validation needed)'
    );
    
    -- Clean up
    DELETE FROM public.opportunities WHERE name = 'Non-Principal Test';
    DELETE FROM public.organizations WHERE id = non_principal_id;
END$$;

-- Test 12: Opportunity stage progression validation
DO $$
DECLARE
    test_opportunity_id UUID;
    stage_count INTEGER;
BEGIN
    -- Get existing opportunity
    SELECT id INTO test_opportunity_id
    FROM public.opportunities
    WHERE name = 'Integration Test Opportunity';
    
    -- Update to next stage
    UPDATE public.opportunities
    SET stage = 'Initial Outreach',
        probability_percent = 20
    WHERE id = test_opportunity_id;
    
    SELECT COUNT(*) INTO stage_count
    FROM public.opportunities
    WHERE id = test_opportunity_id 
    AND stage = 'Initial Outreach'
    AND probability_percent = 20;
    
    PERFORM ok(
        stage_count = 1,
        'Should allow opportunity stage progression with updated probability'
    );
END$$;

-- =============================================================================
-- DATA INTEGRITY TESTS
-- =============================================================================

-- Test 13: JSONB fields in complex queries
DO $$
DECLARE
    test_org_id UUID;
    test_principal_id UUID;
    test_product_id UUID;
    opportunity_id UUID;
BEGIN
    -- Get test entities
    SELECT entity_id INTO test_org_id 
    FROM test_schema.test_data_registry 
    WHERE test_name = 'test_opportunity_relationships_setup' AND entity_type = 'organization';
    
    SELECT entity_id INTO test_principal_id 
    FROM test_schema.test_data_registry 
    WHERE test_name = 'test_opportunity_relationships_setup' AND entity_type = 'principal';
    
    SELECT entity_id INTO test_product_id 
    FROM test_schema.test_data_registry 
    WHERE test_name = 'test_opportunity_relationships_setup' AND entity_type = 'product';
    
    -- Update organization with JSONB tags
    UPDATE public.organizations
    SET tags = '["high-priority", "integration-test"]'::jsonb,
        custom_fields = '{"test_type": "integration", "priority": "high"}'::jsonb
    WHERE id = test_org_id;
    
    -- Create opportunity and query with JSONB conditions
    INSERT INTO public.opportunities (
        name, organization_id, principal_id, product_id, stage
    )
    VALUES (
        'JSONB Test Opportunity',
        test_org_id,
        test_principal_id,
        test_product_id,
        'New Lead'
    )
    RETURNING id INTO opportunity_id;
    
    PERFORM test_schema.register_test_data('test_opportunity_relationships', 'opportunity', opportunity_id);
    
    PERFORM ok(
        (SELECT COUNT(*) 
         FROM public.opportunities o
         JOIN public.organizations org ON o.organization_id = org.id
         WHERE o.id = opportunity_id
         AND org.tags ? 'high-priority'
         AND org.custom_fields->>'priority' = 'high') = 1,
        'Should support JSONB queries in complex relationships'
    );
END$$;

-- =============================================================================
-- PERFORMANCE AND INDEX TESTS
-- =============================================================================

-- Test 14: Index usage on foreign key joins
DO $$
DECLARE
    explain_result TEXT;
BEGIN
    -- Test if indexes are being used for opportunity-organization joins
    SELECT test_schema.check_index_usage(
        'SELECT o.id FROM public.opportunities o JOIN public.organizations org ON o.organization_id = org.id WHERE org.name LIKE ''Customer Org%'''
    ) INTO explain_result;
    
    PERFORM ok(
        explain_result LIKE '%index%' OR explain_result LIKE '%Index%',
        'Should use indexes for foreign key joins (or explain why not): ' || explain_result
    );
END$$;

-- =============================================================================
-- SOFT DELETE RELATIONSHIP TESTS
-- =============================================================================

-- Test 15: Soft delete behavior with relationships
DO $$
DECLARE
    test_org_id UUID;
    opportunity_count INTEGER;
BEGIN
    -- Get test organization
    SELECT entity_id INTO test_org_id 
    FROM test_schema.test_data_registry 
    WHERE test_name = 'test_opportunity_relationships_setup' AND entity_type = 'organization';
    
    -- Soft delete organization
    UPDATE public.organizations
    SET deleted_at = NOW()
    WHERE id = test_org_id;
    
    -- Count opportunities still referencing the soft-deleted organization
    SELECT COUNT(*) INTO opportunity_count
    FROM public.opportunities o
    JOIN public.organizations org ON o.organization_id = org.id
    WHERE org.id = test_org_id
    AND org.deleted_at IS NOT NULL;
    
    PERFORM ok(
        opportunity_count > 0,
        'Opportunities should maintain references to soft-deleted organizations'
    );
    
    -- Restore organization for cleanup
    UPDATE public.organizations
    SET deleted_at = NULL
    WHERE id = test_org_id;
END$$;

-- =============================================================================
-- OPPORTUNITY ENUMERATION TESTS
-- =============================================================================

-- Test 16: All opportunity stages are valid
DO $$
DECLARE
    stage_name public.opportunity_stage;
    test_count INTEGER := 0;
BEGIN
    FOR stage_name IN 
        VALUES ('New Lead'::public.opportunity_stage),
               ('Initial Outreach'::public.opportunity_stage),
               ('Sample/Visit Offered'::public.opportunity_stage),
               ('Awaiting Response'::public.opportunity_stage),
               ('Feedback Logged'::public.opportunity_stage),
               ('Demo Scheduled'::public.opportunity_stage),
               ('Closed - Won'::public.opportunity_stage)
    LOOP
        test_count := test_count + 1;
    END LOOP;
    
    PERFORM ok(
        test_count = 7,
        'Should have all 7 defined opportunity stages available'
    );
END$$;

-- Test 17: Opportunity context enum validation
DO $$
DECLARE
    temp_opportunity_id UUID;
    test_org_id UUID;
BEGIN
    SELECT entity_id INTO test_org_id 
    FROM test_schema.test_data_registry 
    WHERE test_name = 'test_opportunity_relationships_setup' AND entity_type = 'organization';
    
    INSERT INTO public.opportunities (
        name, organization_id, stage, context, custom_context
    )
    VALUES (
        'Context Test Opportunity',
        test_org_id,
        'New Lead',
        'Custom',
        'Trade show follow-up'
    )
    RETURNING id INTO temp_opportunity_id;
    
    PERFORM test_schema.register_test_data('test_opportunity_relationships', 'opportunity', temp_opportunity_id);
    
    PERFORM ok(
        (SELECT context FROM public.opportunities WHERE id = temp_opportunity_id) = 'Custom',
        'Should support opportunity context enum with custom text'
    );
END$$;

-- =============================================================================
-- BATCH OPERATION TESTS
-- =============================================================================

-- Test 18: Multiple opportunities for same organization
DO $$
DECLARE
    test_org_id UUID;
    test_principal_id UUID;
    test_product_id UUID;
    opportunity_count INTEGER;
BEGIN
    -- Get test entities
    SELECT entity_id INTO test_org_id 
    FROM test_schema.test_data_registry 
    WHERE test_name = 'test_opportunity_relationships_setup' AND entity_type = 'organization';
    
    SELECT entity_id INTO test_principal_id 
    FROM test_schema.test_data_registry 
    WHERE test_name = 'test_opportunity_relationships_setup' AND entity_type = 'principal';
    
    SELECT entity_id INTO test_product_id 
    FROM test_schema.test_data_registry 
    WHERE test_name = 'test_opportunity_relationships_setup' AND entity_type = 'product';
    
    -- Create multiple opportunities for same organization
    INSERT INTO public.opportunities (name, organization_id, principal_id, product_id, stage)
    VALUES 
        ('Batch Opportunity 1', test_org_id, test_principal_id, test_product_id, 'New Lead'),
        ('Batch Opportunity 2', test_org_id, test_principal_id, test_product_id, 'Initial Outreach'),
        ('Batch Opportunity 3', test_org_id, test_principal_id, test_product_id, 'Sample/Visit Offered');
    
    SELECT COUNT(*) INTO opportunity_count
    FROM public.opportunities
    WHERE organization_id = test_org_id
    AND name LIKE 'Batch Opportunity%';
    
    PERFORM ok(
        opportunity_count = 3,
        'Should support multiple opportunities for same organization'
    );
    
    -- Register for cleanup
    INSERT INTO test_schema.test_data_registry (test_name, entity_type, entity_id)
    SELECT 'test_opportunity_relationships', 'opportunity', id
    FROM public.opportunities
    WHERE name LIKE 'Batch Opportunity%';
END$$;

-- =============================================================================
-- REFERENTIAL INTEGRITY STRESS TESTS
-- =============================================================================

-- Test 19: Complex update cascade scenarios
DO $$
DECLARE
    test_product_id UUID;
    update_count INTEGER;
BEGIN
    SELECT entity_id INTO test_product_id 
    FROM test_schema.test_data_registry 
    WHERE test_name = 'test_opportunity_relationships_setup' AND entity_type = 'product';
    
    -- Update product and verify opportunities maintain reference
    UPDATE public.products
    SET name = name || ' (Updated)',
        unit_cost = 12.00
    WHERE id = test_product_id;
    
    SELECT COUNT(*) INTO update_count
    FROM public.opportunities o
    JOIN public.products p ON o.product_id = p.id
    WHERE p.id = test_product_id
    AND p.name LIKE '%(Updated)';
    
    PERFORM ok(
        update_count > 0,
        'Opportunities should maintain references after product updates'
    );
END$$;

-- Test 20: Transaction rollback behavior
DO $$
DECLARE
    test_org_id UUID;
    initial_count INTEGER;
    final_count INTEGER;
BEGIN
    SELECT entity_id INTO test_org_id 
    FROM test_schema.test_data_registry 
    WHERE test_name = 'test_opportunity_relationships_setup' AND entity_type = 'organization';
    
    SELECT COUNT(*) INTO initial_count
    FROM public.opportunities
    WHERE organization_id = test_org_id;
    
    BEGIN
        -- Start nested transaction
        INSERT INTO public.opportunities (name, organization_id, stage)
        VALUES ('Rollback Test Opportunity', test_org_id, 'New Lead');
        
        -- Force rollback with invalid operation
        INSERT INTO public.opportunities (name, organization_id, stage)
        VALUES ('Invalid Opportunity', '00000000-0000-0000-0000-000000000000', 'New Lead');
        
    EXCEPTION WHEN foreign_key_violation THEN
        -- Expected exception - transaction should rollback
        NULL;
    END;
    
    SELECT COUNT(*) INTO final_count
    FROM public.opportunities
    WHERE organization_id = test_org_id;
    
    PERFORM ok(
        final_count = initial_count,
        'Transaction rollback should revert all changes in the transaction'
    );
END$$;

-- =============================================================================
-- CLEANUP AND COMPLETION
-- =============================================================================

-- Clean up test data
PERFORM test_schema.cleanup_test_data('test_opportunity_relationships');
PERFORM test_schema.cleanup_test_data('test_opportunity_relationships_setup');

-- Rollback test transaction
SELECT test_schema.rollback_test();

-- Finish test plan
SELECT finish();

-- Log completion
SELECT test_schema.test_notify('Completed test: opportunities relationship integration');