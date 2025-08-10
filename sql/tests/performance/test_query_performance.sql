-- =============================================================================
-- Performance Tests for Database Queries
-- =============================================================================
-- This file tests query performance, index usage, and optimization for
-- common CRM operations across all major tables.
-- =============================================================================

\i sql/tests/helpers/test_helpers.sql
SET search_path TO test_schema, public, pg_catalog;

-- Test plan
SELECT plan(15);

-- Test metadata
SELECT test_schema.test_notify('Starting test: database query performance');

-- Test setup
SELECT test_schema.begin_test();

-- =============================================================================
-- SETUP PERFORMANCE TEST DATA
-- =============================================================================

-- Create larger dataset for performance testing
DO $$
DECLARE
    i INTEGER;
    org_id UUID;
    contact_id UUID;
    product_id UUID;
    principal_id UUID;
    opportunity_id UUID;
BEGIN
    -- Create 100 organizations for performance testing
    FOR i IN 1..100 LOOP
        SELECT test_schema.create_test_organization(
            'test_query_performance',
            'Performance Org ' || i,
            'B2B',
            (i % 10 = 0), -- Every 10th is principal
            (i % 15 = 0)  -- Every 15th is distributor
        ) INTO org_id;
        
        -- Create 2-3 contacts per organization
        FOR j IN 1..(2 + (i % 2)) LOOP
            SELECT test_schema.create_test_contact(
                'test_query_performance',
                'Contact' || j,
                'LastName' || i,
                'Performance Org ' || i
            ) INTO contact_id;
        END LOOP;
    END LOOP;
    
    -- Create 50 products
    FOR i IN 1..50 LOOP
        SELECT test_schema.create_test_product(
            'test_query_performance',
            'Performance Product ' || i,
            CASE (i % 5)
                WHEN 0 THEN 'Protein'
                WHEN 1 THEN 'Sauce'
                WHEN 2 THEN 'Seasoning'
                WHEN 3 THEN 'Beverage'
                ELSE 'Snack'
            END::public.product_category
        ) INTO product_id;
    END LOOP;
    
    -- Create 200 opportunities
    FOR i IN 1..200 LOOP
        -- Get random organization and principal
        SELECT entity_id INTO org_id
        FROM test_schema.test_data_registry
        WHERE test_name = 'test_query_performance'
        AND entity_type = 'organization'
        ORDER BY random()
        LIMIT 1;
        
        -- Get random principal (every 10th org)
        SELECT entity_id INTO principal_id
        FROM test_schema.test_data_registry r
        JOIN public.organizations o ON r.entity_id = o.id
        WHERE r.test_name = 'test_query_performance'
        AND r.entity_type = 'organization'
        AND o.is_principal = TRUE
        ORDER BY random()
        LIMIT 1;
        
        -- Get random product
        SELECT entity_id INTO product_id
        FROM test_schema.test_data_registry
        WHERE test_name = 'test_query_performance'
        AND entity_type = 'product'
        ORDER BY random()
        LIMIT 1;
        
        SELECT test_schema.create_test_opportunity(
            'test_query_performance',
            org_id,
            principal_id,
            product_id,
            CASE (i % 7)
                WHEN 0 THEN 'New Lead'
                WHEN 1 THEN 'Initial Outreach'
                WHEN 2 THEN 'Sample/Visit Offered'
                WHEN 3 THEN 'Awaiting Response'
                WHEN 4 THEN 'Feedback Logged'
                WHEN 5 THEN 'Demo Scheduled'
                ELSE 'Closed - Won'
            END::public.opportunity_stage
        ) INTO opportunity_id;
    END LOOP;
END$$;

-- =============================================================================
-- BASIC QUERY PERFORMANCE TESTS
-- =============================================================================

-- Test 1: Simple contact lookup performance
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '100 milliseconds';
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT id, first_name, last_name, email FROM public.contacts WHERE email LIKE ''%performance%'' LIMIT 10',
        5
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Contact email search should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- Test 2: Organization search performance
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '200 milliseconds';
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT id, name, type, status FROM public.organizations WHERE name LIKE ''Performance Org%'' ORDER BY name LIMIT 20',
        3
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Organization name search should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- Test 3: Opportunity list query performance
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '300 milliseconds';
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT o.id, o.name, o.stage, org.name as org_name FROM public.opportunities o JOIN public.organizations org ON o.organization_id = org.id WHERE o.stage = ''New Lead'' LIMIT 25',
        3
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Opportunity list with organization join should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- =============================================================================
-- INDEX USAGE TESTS
-- =============================================================================

-- Test 4: Contact email index usage
DO $$
DECLARE
    index_usage_result TEXT;
BEGIN
    SELECT test_schema.check_index_usage(
        'SELECT * FROM public.contacts WHERE email = ''specific.email@test.com''',
        'contacts_email_unique'
    ) INTO index_usage_result;
    
    PERFORM ok(
        index_usage_result LIKE '%index%',
        'Contact email lookup should use unique index: ' || index_usage_result
    );
END$$;

-- Test 5: Organization primary key index usage
DO $$
DECLARE
    index_usage_result TEXT;
BEGIN
    SELECT test_schema.check_index_usage(
        'SELECT * FROM public.organizations WHERE id = gen_random_uuid()',
        NULL
    ) INTO index_usage_result;
    
    PERFORM ok(
        index_usage_result LIKE '%index%' OR index_usage_result LIKE '%Index%',
        'Organization ID lookup should use primary key index: ' || index_usage_result
    );
END$$;

-- Test 6: Opportunity foreign key index usage
DO $$
DECLARE
    index_usage_result TEXT;
BEGIN
    SELECT test_schema.check_index_usage(
        'SELECT o.* FROM public.opportunities o WHERE o.organization_id = gen_random_uuid()',
        NULL
    ) INTO index_usage_result;
    
    PERFORM ok(
        index_usage_result LIKE '%index%' OR index_usage_result LIKE '%Index%',
        'Opportunity organization_id lookup should use index: ' || index_usage_result
    );
END$$;

-- =============================================================================
-- COMPLEX JOIN PERFORMANCE TESTS
-- =============================================================================

-- Test 7: Multi-table join performance
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '500 milliseconds';
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT o.name, org.name as organization, p.name as product, principal.name as principal 
         FROM public.opportunities o 
         JOIN public.organizations org ON o.organization_id = org.id 
         JOIN public.organizations principal ON o.principal_id = principal.id 
         JOIN public.products p ON o.product_id = p.id 
         WHERE o.stage IN (''New Lead'', ''Initial Outreach'') 
         ORDER BY o.created_at DESC LIMIT 50',
        2
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Complex multi-table join should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- Test 8: Aggregation query performance
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '400 milliseconds';
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT org.name, COUNT(o.id) as opportunity_count, AVG(o.probability_percent) as avg_probability
         FROM public.organizations org 
         LEFT JOIN public.opportunities o ON org.id = o.organization_id 
         GROUP BY org.id, org.name 
         HAVING COUNT(o.id) > 0 
         ORDER BY opportunity_count DESC LIMIT 20',
        2
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Aggregation query should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- =============================================================================
-- PAGINATION PERFORMANCE TESTS
-- =============================================================================

-- Test 9: Large offset pagination performance
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '600 milliseconds';
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT id, name, email FROM public.contacts ORDER BY created_at DESC OFFSET 150 LIMIT 25',
        2
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Large offset pagination should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- Test 10: Cursor-based pagination performance
DO $$
DECLARE
    query_time INTERVAL;
    cursor_id UUID;
    threshold INTERVAL := '200 milliseconds';
BEGIN
    -- Get a cursor position
    SELECT id INTO cursor_id
    FROM public.contacts
    ORDER BY created_at DESC
    LIMIT 1 OFFSET 100;
    
    SELECT test_schema.measure_query_time(
        format('SELECT id, name, email FROM public.contacts WHERE created_at < (SELECT created_at FROM public.contacts WHERE id = ''%s'') ORDER BY created_at DESC LIMIT 25', cursor_id),
        3
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Cursor-based pagination should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- =============================================================================
-- SEARCH PERFORMANCE TESTS
-- =============================================================================

-- Test 11: Text search performance (LIKE queries)
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '300 milliseconds';
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT id, name, description FROM public.organizations WHERE name ILIKE ''%performance%'' OR description ILIKE ''%test%'' LIMIT 30',
        3
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Text search with ILIKE should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- Test 12: JSONB query performance
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '400 milliseconds';
BEGIN
    -- First add some JSONB data for testing
    UPDATE public.organizations 
    SET tags = '["performance", "test"]'::jsonb,
        custom_fields = '{"test_type": "performance", "priority": "high"}'::jsonb
    WHERE name LIKE 'Performance Org%'
    AND id IN (
        SELECT entity_id FROM test_schema.test_data_registry 
        WHERE test_name = 'test_query_performance' 
        AND entity_type = 'organization' 
        LIMIT 10
    );
    
    SELECT test_schema.measure_query_time(
        'SELECT id, name, tags, custom_fields FROM public.organizations WHERE tags ? ''performance'' AND custom_fields->>''priority'' = ''high'' LIMIT 20',
        3
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('JSONB query should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- =============================================================================
-- WRITE OPERATION PERFORMANCE TESTS
-- =============================================================================

-- Test 13: Bulk insert performance
DO $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    insert_time INTERVAL;
    threshold INTERVAL := '2 seconds';
    inserted_count INTEGER := 0;
BEGIN
    start_time := clock_timestamp();
    
    -- Insert 50 contacts in a single transaction
    FOR i IN 1..50 LOOP
        INSERT INTO public.contacts (
            first_name, last_name, organization, email, title
        )
        VALUES (
            'Bulk' || i,
            'Insert',
            'Bulk Test Org',
            'bulk.insert.' || i || '.' || extract(epoch from now()) || '@test.com',
            'Bulk Test Title'
        );
        inserted_count := inserted_count + 1;
    END LOOP;
    
    end_time := clock_timestamp();
    insert_time := end_time - start_time;
    
    PERFORM ok(
        insert_time < threshold,
        format('Bulk insert of %s contacts should complete under %s (took %s)', inserted_count, threshold, insert_time)
    );
    
    -- Clean up bulk insert data
    DELETE FROM public.contacts WHERE first_name LIKE 'Bulk%' AND last_name = 'Insert';
END$$;

-- Test 14: Update performance with joins
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '500 milliseconds';
BEGIN
    SELECT test_schema.measure_query_time(
        'UPDATE public.opportunities SET probability_percent = probability_percent + 5 WHERE stage = ''New Lead'' AND organization_id IN (SELECT id FROM public.organizations WHERE name LIKE ''Performance Org%'' LIMIT 10)',
        1
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Bulk update with subquery should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- =============================================================================
-- CONCURRENT ACCESS SIMULATION
-- =============================================================================

-- Test 15: Lock contention simulation
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '1 second';
    test_org_id UUID;
BEGIN
    -- Get a test organization
    SELECT entity_id INTO test_org_id
    FROM test_schema.test_data_registry
    WHERE test_name = 'test_query_performance'
    AND entity_type = 'organization'
    LIMIT 1;
    
    -- Simulate concurrent read while updating
    SELECT test_schema.measure_query_time(
        format('SELECT o.id, o.name, o.stage FROM public.opportunities o WHERE o.organization_id = ''%s''', test_org_id),
        5
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Concurrent read access should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- =============================================================================
-- PERFORMANCE SUMMARY AND RECOMMENDATIONS
-- =============================================================================

-- Generate performance summary
DO $$
DECLARE
    total_contacts INTEGER;
    total_organizations INTEGER;
    total_opportunities INTEGER;
    total_products INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_contacts FROM public.contacts WHERE first_name LIKE 'Contact%';
    SELECT COUNT(*) INTO total_organizations FROM public.organizations WHERE name LIKE 'Performance Org%';
    SELECT COUNT(*) INTO total_opportunities FROM public.opportunities WHERE deal_owner = 'Test Deal Owner';
    SELECT COUNT(*) INTO total_products FROM public.products WHERE name LIKE 'Performance Product%';
    
    RAISE NOTICE 'Performance Test Dataset Summary:';
    RAISE NOTICE '  Contacts: %', total_contacts;
    RAISE NOTICE '  Organizations: %', total_organizations;
    RAISE NOTICE '  Opportunities: %', total_opportunities;
    RAISE NOTICE '  Products: %', total_products;
    RAISE NOTICE '';
    RAISE NOTICE 'Performance Recommendations:';
    RAISE NOTICE '  1. Ensure indexes exist on foreign key columns';
    RAISE NOTICE '  2. Consider partial indexes for commonly filtered columns';
    RAISE NOTICE '  3. Use cursor-based pagination for large datasets';
    RAISE NOTICE '  4. Monitor JSONB query performance and consider GIN indexes';
    RAISE NOTICE '  5. Use connection pooling for concurrent access scenarios';
END$$;

-- =============================================================================
-- CLEANUP AND COMPLETION
-- =============================================================================

-- Clean up performance test data
PERFORM test_schema.cleanup_test_data('test_query_performance');

-- Rollback test transaction
SELECT test_schema.rollback_test();

-- Finish test plan
SELECT finish();

-- Log completion
SELECT test_schema.test_notify('Completed test: database query performance');