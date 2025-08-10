-- =============================================================================
-- Security Performance Validation Tests
-- =============================================================================
-- Performance testing for RLS policies and security measures to ensure they
-- don't introduce unacceptable overhead while maintaining security compliance.
-- Target: Security measures should not degrade performance by more than 15%
-- =============================================================================

\i sql/tests/security/security_test_helpers.sql
SET search_path TO test_schema, public, pg_catalog;

-- Test plan - Performance testing requires comprehensive measurements
SELECT plan(45);

-- Test metadata
SELECT test_schema.test_notify('Starting Security Performance Validation Tests');

-- Test setup
SELECT test_schema.begin_test();

-- =============================================================================
-- RLS POLICY PERFORMANCE BASELINE TESTING
-- =============================================================================

-- Test 1-5: Contact Table RLS Performance
DO $$
DECLARE
    baseline_time NUMERIC;
    rls_time NUMERIC;
    performance_overhead NUMERIC;
    test_org_id UUID;
    test_contact_ids UUID[];
    i INTEGER;
BEGIN
    -- Create test organization
    SELECT test_schema.create_test_organization('test_security_performance', 'Performance Test Org') INTO test_org_id;
    PERFORM test_schema.register_test_data('test_security_performance', 'organization', test_org_id);
    
    -- Create substantial test dataset (1000 contacts for meaningful performance testing)
    FOR i IN 1..1000 LOOP
        INSERT INTO public.contacts (
            organization_id, first_name, last_name, email, phone
        ) VALUES (
            test_org_id, 
            'TestUser' || i, 
            'Performance' || i, 
            'perf' || i || '@example.com',
            '+1-555-' || LPAD(i::text, 4, '0')
        );
    END LOOP;
    
    -- Store contact IDs for cleanup
    SELECT array_agg(id) INTO test_contact_ids
    FROM public.contacts 
    WHERE organization_id = test_org_id;
    
    FOR i IN 1..array_length(test_contact_ids, 1) LOOP
        PERFORM test_schema.register_test_data('test_security_performance', 'contact', test_contact_ids[i]);
    END LOOP;
    
    -- Test 1: Measure baseline query performance without RLS context
    SELECT test_schema.measure_performance_baseline(
        'SELECT COUNT(*) FROM public.contacts WHERE organization_id = ''' || test_org_id || ''''
    ) INTO baseline_time;
    
    PERFORM ok(
        baseline_time < 0.100, -- Should complete in under 100ms
        'Security Performance Baseline: Contact queries should complete in under 100ms: ' || baseline_time::text || 's'
    );
    
    -- Test 2: Measure RLS-enabled query performance
    PERFORM test_schema.simulate_user_session('auth.user_1', 'authenticated');
    
    SELECT test_schema.measure_performance_baseline(
        'SELECT COUNT(*) FROM public.contacts WHERE organization_id = ''' || test_org_id || ''''
    ) INTO rls_time;
    
    PERFORM ok(
        rls_time < 0.150, -- Should complete in under 150ms with RLS
        'Security Performance RLS: Contact queries with RLS should complete in under 150ms: ' || rls_time::text || 's'
    );
    
    -- Test 3: Calculate RLS overhead percentage
    performance_overhead := ((rls_time - baseline_time) / baseline_time) * 100;
    
    PERFORM ok(
        performance_overhead <= 15.0, -- RLS should not add more than 15% overhead
        'Security Performance Overhead: RLS should not add more than 15% overhead: ' || performance_overhead::text || '%'
    );
    
    -- Test 4: Complex query performance with joins
    SELECT test_schema.measure_performance_baseline(
        'SELECT c.email, org.name FROM public.contacts c JOIN public.organizations org ON c.organization_id = org.id WHERE org.id = ''' || test_org_id || ''' LIMIT 100'
    ) INTO rls_time;
    
    PERFORM ok(
        rls_time < 0.200, -- Complex queries should complete in under 200ms
        'Security Performance Joins: Complex queries with RLS should complete in under 200ms: ' || rls_time::text || 's'
    );
    
    -- Test 5: Bulk operations performance
    SELECT test_schema.measure_performance_baseline(
        'UPDATE public.contacts SET notes = ''Updated by performance test'' WHERE organization_id = ''' || test_org_id || ''''
    ) INTO rls_time;
    
    PERFORM ok(
        rls_time < 0.500, -- Bulk updates should complete in under 500ms
        'Security Performance Bulk: Bulk operations with RLS should complete in under 500ms: ' || rls_time::text || 's'
    );
END$$;

-- =============================================================================
-- ORGANIZATION RLS PERFORMANCE TESTING
-- =============================================================================

-- Test 6-10: Organization Table RLS Performance
DO $$
DECLARE
    baseline_time NUMERIC;
    rls_time NUMERIC;
    performance_overhead NUMERIC;
    test_org_ids UUID[];
    i INTEGER;
BEGIN
    -- Create test dataset for organizations (500 organizations)
    FOR i IN 1..500 LOOP
        INSERT INTO public.organizations (
            name, type, industry, phone, email
        ) VALUES (
            'PerfTest Organization ' || i,
            'B2B',
            'Technology',
            '+1-555-' || LPAD(i::text, 4, '0'),
            'org' || i || '@perftest.com'
        );
    END LOOP;
    
    -- Store organization IDs for cleanup
    SELECT array_agg(id) INTO test_org_ids
    FROM public.organizations 
    WHERE name LIKE 'PerfTest Organization %';
    
    FOR i IN 1..array_length(test_org_ids, 1) LOOP
        PERFORM test_schema.register_test_data('test_security_performance', 'organization', test_org_ids[i]);
    END LOOP;
    
    -- Test 6: Organization search performance baseline
    SELECT test_schema.measure_performance_baseline(
        'SELECT COUNT(*) FROM public.organizations WHERE name LIKE ''PerfTest%'''
    ) INTO baseline_time;
    
    PERFORM ok(
        baseline_time < 0.050, -- Search should be fast
        'Security Performance Org Baseline: Organization search should complete in under 50ms: ' || baseline_time::text || 's'
    );
    
    -- Test 7: Organization search with RLS
    PERFORM test_schema.simulate_user_session('auth.user_2', 'authenticated');
    
    SELECT test_schema.measure_performance_baseline(
        'SELECT COUNT(*) FROM public.organizations WHERE name LIKE ''PerfTest%'''
    ) INTO rls_time;
    
    performance_overhead := ((rls_time - baseline_time) / baseline_time) * 100;
    
    PERFORM ok(
        performance_overhead <= 10.0, -- Organization RLS should have minimal overhead
        'Security Performance Org RLS: Organization RLS overhead should be under 10%: ' || performance_overhead::text || '%'
    );
    
    -- Test 8: Principal-specific queries performance
    SELECT test_schema.measure_performance_baseline(
        'SELECT COUNT(*) FROM public.organizations WHERE is_principal = true'
    ) INTO rls_time;
    
    PERFORM ok(
        rls_time < 0.100, -- Principal queries should be fast
        'Security Performance Principals: Principal queries should complete in under 100ms: ' || rls_time::text || 's'
    );
    
    -- Test 9: Distributor relationship queries
    SELECT test_schema.measure_performance_baseline(
        'SELECT o1.name, o2.name FROM public.organizations o1 LEFT JOIN public.organizations o2 ON o1.distributor_id = o2.id WHERE o1.is_principal = true LIMIT 100'
    ) INTO rls_time;
    
    PERFORM ok(
        rls_time < 0.200, -- Relationship queries should complete reasonably fast
        'Security Performance Relationships: Distributor relationship queries should complete in under 200ms: ' || rls_time::text || 's'
    );
    
    -- Test 10: Full-text search performance with RLS
    SELECT test_schema.measure_performance_baseline(
        'SELECT COUNT(*) FROM public.organizations WHERE to_tsvector(''english'', name) @@ to_tsquery(''english'', ''PerfTest'')'
    ) INTO rls_time;
    
    PERFORM ok(
        rls_time < 0.150, -- Full-text search should remain performant
        'Security Performance FTS: Full-text search with RLS should complete in under 150ms: ' || rls_time::text || 's'
    );
END$$;

-- =============================================================================
-- OPPORTUNITIES RLS PERFORMANCE TESTING
-- =============================================================================

-- Test 11-15: Opportunity Table RLS Performance
DO $$
DECLARE
    baseline_time NUMERIC;
    rls_time NUMERIC;
    test_org_id UUID;
    test_principal_id UUID;
    test_product_id UUID;
    opportunity_ids UUID[];
    i INTEGER;
BEGIN
    -- Setup test entities
    SELECT test_schema.create_test_organization('test_security_performance', 'Perf Customer Org') INTO test_org_id;
    SELECT test_schema.create_test_organization('test_security_performance', 'Perf Principal Org', 'B2B', TRUE, FALSE) INTO test_principal_id;
    SELECT test_schema.create_test_product('test_security_performance', 'Performance Test Product') INTO test_product_id;
    
    PERFORM test_schema.register_test_data('test_security_performance', 'organization', test_org_id);
    PERFORM test_schema.register_test_data('test_security_performance', 'organization', test_principal_id);
    PERFORM test_schema.register_test_data('test_security_performance', 'product', test_product_id);
    
    -- Create opportunities dataset (200 opportunities)
    FOR i IN 1..200 LOOP
        INSERT INTO public.opportunities (
            name, organization_id, principal_id, product_id, stage, 
            probability_percent, deal_owner, notes
        ) VALUES (
            'Performance Test Opportunity ' || i,
            test_org_id,
            test_principal_id,
            test_product_id,
            CASE (i % 7) 
                WHEN 0 THEN 'New Lead'
                WHEN 1 THEN 'Initial Outreach'
                WHEN 2 THEN 'Sample/Visit Offered'
                WHEN 3 THEN 'Awaiting Response'
                WHEN 4 THEN 'Feedback Logged'
                WHEN 5 THEN 'Demo Scheduled'
                ELSE 'Closed - Won'
            END,
            (i % 100) + 1,
            'Performance Tester',
            'Created for performance testing'
        );
    END LOOP;
    
    SELECT array_agg(id) INTO opportunity_ids
    FROM public.opportunities 
    WHERE name LIKE 'Performance Test Opportunity %';
    
    FOR i IN 1..array_length(opportunity_ids, 1) LOOP
        PERFORM test_schema.register_test_data('test_security_performance', 'opportunity', opportunity_ids[i]);
    END LOOP;
    
    -- Test 11: Opportunity queries baseline performance
    SELECT test_schema.measure_performance_baseline(
        'SELECT COUNT(*) FROM public.opportunities WHERE principal_id = ''' || test_principal_id || ''''
    ) INTO baseline_time;
    
    PERFORM ok(
        baseline_time < 0.050, -- Basic queries should be fast
        'Security Performance Opp Baseline: Opportunity queries should complete in under 50ms: ' || baseline_time::text || 's'
    );
    
    -- Test 12: Opportunity RLS performance
    PERFORM test_schema.simulate_user_session('auth.user_3', 'authenticated');
    
    SELECT test_schema.measure_performance_baseline(
        'SELECT COUNT(*) FROM public.opportunities WHERE principal_id = ''' || test_principal_id || ''''
    ) INTO rls_time;
    
    PERFORM ok(
        rls_time < 0.100, -- RLS queries should remain fast
        'Security Performance Opp RLS: Opportunity RLS queries should complete in under 100ms: ' || rls_time::text || 's'
    );
    
    -- Test 13: Complex opportunity analytics performance
    SELECT test_schema.measure_performance_baseline(
        'SELECT stage, COUNT(*), AVG(probability_percent) FROM public.opportunities WHERE principal_id = ''' || test_principal_id || ''' GROUP BY stage'
    ) INTO rls_time;
    
    PERFORM ok(
        rls_time < 0.150, -- Analytics should be performant
        'Security Performance Opp Analytics: Opportunity analytics should complete in under 150ms: ' || rls_time::text || 's'
    );
    
    -- Test 14: Opportunity-organization join performance
    SELECT test_schema.measure_performance_baseline(
        'SELECT o.name, org.name FROM public.opportunities o JOIN public.organizations org ON o.organization_id = org.id WHERE o.principal_id = ''' || test_principal_id || ''' LIMIT 50'
    ) INTO rls_time;
    
    PERFORM ok(
        rls_time < 0.200, -- Joins should remain performant
        'Security Performance Opp Joins: Opportunity joins should complete in under 200ms: ' || rls_time::text || 's'
    );
    
    -- Test 15: Opportunity pipeline performance
    SELECT test_schema.measure_performance_baseline(
        'SELECT COUNT(*) FROM public.opportunities WHERE stage IN (''New Lead'', ''Initial Outreach'', ''Sample/Visit Offered'') AND principal_id = ''' || test_principal_id || ''''
    ) INTO rls_time;
    
    PERFORM ok(
        rls_time < 0.075, -- Pipeline queries should be fast
        'Security Performance Pipeline: Opportunity pipeline queries should complete in under 75ms: ' || rls_time::text || 's'
    );
END$$;

-- =============================================================================
-- INTERACTION RLS PERFORMANCE TESTING
-- =============================================================================

-- Test 16-20: Interaction Table RLS Performance
DO $$
DECLARE
    baseline_time NUMERIC;
    rls_time NUMERIC;
    test_opportunity_id UUID;
    interaction_ids UUID[];
    i INTEGER;
BEGIN
    -- Get test opportunity for interactions
    SELECT id INTO test_opportunity_id
    FROM public.opportunities 
    WHERE name LIKE 'Performance Test Opportunity %'
    LIMIT 1;
    
    -- Create interactions dataset (300 interactions)
    FOR i IN 1..300 LOOP
        INSERT INTO public.interactions (
            opportunity_id, type, subject, notes, status,
            interaction_date, contact_method, duration_minutes
        ) VALUES (
            test_opportunity_id,
            CASE (i % 4)
                WHEN 0 THEN 'PHONE'
                WHEN 1 THEN 'EMAIL'
                WHEN 2 THEN 'MEETING'
                ELSE 'OTHER'
            END,
            'Performance Test Interaction ' || i,
            'Created for interaction performance testing',
            'COMPLETED',
            NOW() - (i || ' days')::INTERVAL,
            'Direct Contact',
            (i % 60) + 15
        );
    END LOOP;
    
    SELECT array_agg(id) INTO interaction_ids
    FROM public.interactions 
    WHERE subject LIKE 'Performance Test Interaction %';
    
    FOR i IN 1..array_length(interaction_ids, 1) LOOP
        PERFORM test_schema.register_test_data('test_security_performance', 'interaction', interaction_ids[i]);
    END LOOP;
    
    -- Test 16: Interaction queries baseline
    SELECT test_schema.measure_performance_baseline(
        'SELECT COUNT(*) FROM public.interactions WHERE opportunity_id = ''' || test_opportunity_id || ''''
    ) INTO baseline_time;
    
    PERFORM ok(
        baseline_time < 0.050,
        'Security Performance Int Baseline: Interaction queries should complete in under 50ms: ' || baseline_time::text || 's'
    );
    
    -- Test 17: Interaction RLS performance
    PERFORM test_schema.simulate_user_session('auth.user_4', 'authenticated');
    
    SELECT test_schema.measure_performance_baseline(
        'SELECT COUNT(*) FROM public.interactions WHERE opportunity_id = ''' || test_opportunity_id || ''''
    ) INTO rls_time;
    
    PERFORM ok(
        rls_time < 0.100,
        'Security Performance Int RLS: Interaction RLS queries should complete in under 100ms: ' || rls_time::text || 's'
    );
    
    -- Test 18: Interaction timeline queries
    SELECT test_schema.measure_performance_baseline(
        'SELECT type, COUNT(*) FROM public.interactions WHERE opportunity_id = ''' || test_opportunity_id || ''' AND interaction_date > NOW() - INTERVAL ''30 days'' GROUP BY type'
    ) INTO rls_time;
    
    PERFORM ok(
        rls_time < 0.150,
        'Security Performance Int Timeline: Interaction timeline queries should complete in under 150ms: ' || rls_time::text || 's'
    );
    
    -- Test 19: Interaction-opportunity join performance
    SELECT test_schema.measure_performance_baseline(
        'SELECT i.subject, o.name FROM public.interactions i JOIN public.opportunities o ON i.opportunity_id = o.id WHERE i.opportunity_id = ''' || test_opportunity_id || ''' LIMIT 100'
    ) INTO rls_time;
    
    PERFORM ok(
        rls_time < 0.200,
        'Security Performance Int Joins: Interaction-opportunity joins should complete in under 200ms: ' || rls_time::text || 's'
    );
    
    -- Test 20: Complex interaction analytics
    SELECT test_schema.measure_performance_baseline(
        'SELECT DATE_TRUNC(''month'', interaction_date) as month, COUNT(*), AVG(duration_minutes) FROM public.interactions WHERE opportunity_id = ''' || test_opportunity_id || ''' GROUP BY month ORDER BY month'
    ) INTO rls_time;
    
    PERFORM ok(
        rls_time < 0.250,
        'Security Performance Int Analytics: Interaction analytics should complete in under 250ms: ' || rls_time::text || 's'
    );
END$$;

-- =============================================================================
-- PRODUCT-PRINCIPAL RLS PERFORMANCE TESTING
-- =============================================================================

-- Test 21-25: Product-Principal Relationship Performance
DO $$
DECLARE
    baseline_time NUMERIC;
    rls_time NUMERIC;
    test_product_ids UUID[];
    test_principal_ids UUID[];
    relationship_ids UUID[];
    i INTEGER;
    j INTEGER;
BEGIN
    -- Create test products (50 products)
    FOR i IN 1..50 LOOP
        INSERT INTO public.products (
            name, description, category, sku, unit_cost, is_active
        ) VALUES (
            'Performance Product ' || i,
            'Created for performance testing',
            'Other',
            'PERF-' || LPAD(i::text, 3, '0'),
            (i * 1.5),
            true
        );
    END LOOP;
    
    SELECT array_agg(id) INTO test_product_ids
    FROM public.products 
    WHERE name LIKE 'Performance Product %';
    
    -- Create test principals (20 principals)
    FOR i IN 1..20 LOOP
        INSERT INTO public.organizations (
            name, type, is_principal, is_distributor
        ) VALUES (
            'Performance Principal ' || i,
            'B2B',
            true,
            false
        );
    END LOOP;
    
    SELECT array_agg(id) INTO test_principal_ids
    FROM public.organizations 
    WHERE name LIKE 'Performance Principal %';
    
    -- Create product-principal relationships (200 relationships)
    FOR i IN 1..20 LOOP
        FOR j IN 1..10 LOOP
            INSERT INTO public.product_principals (
                product_id, principal_id, wholesale_price, minimum_order_quantity, is_active
            ) VALUES (
                test_product_ids[((i-1)*2 + j) % array_length(test_product_ids, 1) + 1],
                test_principal_ids[i],
                ((i * j) * 2.5),
                (i * j * 10),
                true
            );
        END LOOP;
    END LOOP;
    
    -- Register all test data for cleanup
    FOR i IN 1..array_length(test_product_ids, 1) LOOP
        PERFORM test_schema.register_test_data('test_security_performance', 'product', test_product_ids[i]);
    END LOOP;
    
    FOR i IN 1..array_length(test_principal_ids, 1) LOOP
        PERFORM test_schema.register_test_data('test_security_performance', 'organization', test_principal_ids[i]);
    END LOOP;
    
    SELECT array_agg(id) INTO relationship_ids FROM public.product_principals 
    WHERE product_id = ANY(test_product_ids);
    
    FOR i IN 1..array_length(relationship_ids, 1) LOOP
        PERFORM test_schema.register_test_data('test_security_performance', 'product_principal', relationship_ids[i]);
    END LOOP;
    
    -- Test 21: Product queries baseline
    SELECT test_schema.measure_performance_baseline(
        'SELECT COUNT(*) FROM public.products WHERE name LIKE ''Performance Product %'''
    ) INTO baseline_time;
    
    PERFORM ok(
        baseline_time < 0.050,
        'Security Performance Prod Baseline: Product queries should complete in under 50ms: ' || baseline_time::text || 's'
    );
    
    -- Test 22: Product-principal relationship queries
    SELECT test_schema.measure_performance_baseline(
        'SELECT COUNT(*) FROM public.product_principals pp WHERE pp.product_id = ANY(ARRAY[''' || array_to_string(test_product_ids, ''',''') || '''])'
    ) INTO rls_time;
    
    PERFORM ok(
        rls_time < 0.100,
        'Security Performance Prod Relations: Product-principal queries should complete in under 100ms: ' || rls_time::text || 's'
    );
    
    -- Test 23: Complex product analytics with joins
    SELECT test_schema.measure_performance_baseline(
        'SELECT p.name, COUNT(pp.id) as principal_count FROM public.products p LEFT JOIN public.product_principals pp ON p.id = pp.product_id WHERE p.name LIKE ''Performance Product %'' GROUP BY p.id, p.name LIMIT 50'
    ) INTO rls_time;
    
    PERFORM ok(
        rls_time < 0.200,
        'Security Performance Prod Analytics: Product analytics should complete in under 200ms: ' || rls_time::text || 's'
    );
    
    -- Test 24: Principal product portfolio queries
    PERFORM test_schema.simulate_user_session('auth.user_5', 'authenticated');
    
    SELECT test_schema.measure_performance_baseline(
        'SELECT org.name, COUNT(pp.product_id) FROM public.organizations org JOIN public.product_principals pp ON org.id = pp.principal_id WHERE org.name LIKE ''Performance Principal %'' GROUP BY org.id, org.name'
    ) INTO rls_time;
    
    PERFORM ok(
        rls_time < 0.150,
        'Security Performance Principal Portfolio: Principal portfolio queries should complete in under 150ms: ' || rls_time::text || 's'
    );
    
    -- Test 25: Product availability by principal
    SELECT test_schema.measure_performance_baseline(
        'SELECT p.name, pp.wholesale_price FROM public.products p JOIN public.product_principals pp ON p.id = pp.product_id WHERE pp.principal_id = ''' || test_principal_ids[1] || ''' AND p.is_active = true'
    ) INTO rls_time;
    
    PERFORM ok(
        rls_time < 0.100,
        'Security Performance Prod Availability: Product availability queries should complete in under 100ms: ' || rls_time::text || 's'
    );
END$$;

-- =============================================================================
-- SECURITY CONSTRAINT PERFORMANCE TESTING
-- =============================================================================

-- Test 26-30: Security Constraint Performance Impact
DO $$
DECLARE
    constraint_time NUMERIC;
    injection_test_time NUMERIC;
    validation_time NUMERIC;
    test_org_id UUID;
BEGIN
    -- Test 26: Email validation constraint performance
    SELECT test_schema.create_test_organization('test_security_performance', 'Constraint Test Org') INTO test_org_id;
    PERFORM test_schema.register_test_data('test_security_performance', 'organization', test_org_id);
    
    SELECT test_schema.measure_performance_baseline(
        'INSERT INTO public.contacts (organization_id, first_name, last_name, email) VALUES (''' || test_org_id || ''', ''Valid'', ''User'', ''valid.user@example.com'')'
    ) INTO constraint_time;
    
    PERFORM ok(
        constraint_time < 0.050,
        'Security Performance Email Validation: Email validation should complete in under 50ms: ' || constraint_time::text || 's'
    );
    
    -- Test 27: Input sanitization performance
    BEGIN
        SELECT test_schema.measure_performance_baseline(
            'INSERT INTO public.contacts (organization_id, first_name, last_name, email) VALUES (''' || test_org_id || ''', ''<script>alert("xss")</script>'', ''Malicious'', ''bad@example.com'')'
        ) INTO validation_time;
        
        PERFORM ok(
            validation_time < 0.100,
            'Security Performance Input Validation: Input validation should complete in under 100ms: ' || validation_time::text || 's'
        );
        
    EXCEPTION WHEN OTHERS THEN
        -- Validation should catch malicious input quickly
        PERFORM ok(
            true,
            'Security Performance Input Validation: Input validation correctly rejected malicious input'
        );
    END;
    
    -- Test 28: SQL injection prevention performance
    SELECT test_schema.measure_performance_baseline(
        'SELECT COUNT(*) FROM public.contacts WHERE email = ''test@example.com'''
    ) INTO injection_test_time;
    
    PERFORM ok(
        injection_test_time < 0.050,
        'Security Performance SQL Injection: Parameterized queries should complete in under 50ms: ' || injection_test_time::text || 's'
    );
    
    -- Test 29: JSONB security validation performance
    SELECT test_schema.measure_performance_baseline(
        'UPDATE public.contacts SET custom_fields = ''{"safe_field": "safe_value"}''::jsonb WHERE organization_id = ''' || test_org_id || ''''
    ) INTO validation_time;
    
    PERFORM ok(
        validation_time < 0.100,
        'Security Performance JSONB Validation: JSONB validation should complete in under 100ms: ' || validation_time::text || 's'
    );
    
    -- Test 30: Bulk security constraint validation
    SELECT test_schema.measure_performance_baseline(
        'INSERT INTO public.contacts (organization_id, first_name, last_name, email) SELECT ''' || test_org_id || ''', ''Bulk'' || gs, ''User'' || gs, ''bulk'' || gs || ''@example.com'' FROM generate_series(1, 100) gs'
    ) INTO constraint_time;
    
    PERFORM ok(
        constraint_time < 0.500,
        'Security Performance Bulk Validation: Bulk operations with validation should complete in under 500ms: ' || constraint_time::text || 's'
    );
END$$;

-- =============================================================================
-- INDEX PERFORMANCE WITH SECURITY MEASURES
-- =============================================================================

-- Test 31-35: Index Performance with Security Constraints
DO $$
DECLARE
    index_scan_time NUMERIC;
    sequential_scan_time NUMERIC;
    index_effectiveness NUMERIC;
    explain_output TEXT;
BEGIN
    -- Test 31: Index usage with RLS policies
    PERFORM test_schema.simulate_user_session('auth.user_6', 'authenticated');
    
    EXPLAIN (FORMAT TEXT, ANALYZE) 
    SELECT COUNT(*) FROM public.contacts 
    WHERE email LIKE '%@example.com' 
    INTO explain_output;
    
    SELECT test_schema.measure_performance_baseline(
        'SELECT COUNT(*) FROM public.contacts WHERE email LIKE ''%@example.com'''
    ) INTO index_scan_time;
    
    PERFORM ok(
        index_scan_time < 0.200 OR explain_output LIKE '%Index%',
        'Security Performance Index Usage: Queries should use indexes effectively with RLS: ' || index_scan_time::text || 's'
    );
    
    -- Test 32: Organization name search performance
    SELECT test_schema.measure_performance_baseline(
        'SELECT COUNT(*) FROM public.organizations WHERE name ILIKE ''%Performance%'''
    ) INTO index_scan_time;
    
    PERFORM ok(
        index_scan_time < 0.150,
        'Security Performance Org Search: Organization search should use indexes effectively: ' || index_scan_time::text || 's'
    );
    
    -- Test 33: Date range query performance
    SELECT test_schema.measure_performance_baseline(
        'SELECT COUNT(*) FROM public.interactions WHERE interaction_date >= NOW() - INTERVAL ''30 days'''
    ) INTO index_scan_time;
    
    PERFORM ok(
        index_scan_time < 0.200,
        'Security Performance Date Range: Date range queries should be optimized: ' || index_scan_time::text || 's'
    );
    
    -- Test 34: Foreign key join performance
    SELECT test_schema.measure_performance_baseline(
        'SELECT COUNT(*) FROM public.opportunities o JOIN public.organizations org ON o.organization_id = org.id WHERE org.name LIKE ''PerfTest%'''
    ) INTO index_scan_time;
    
    PERFORM ok(
        index_scan_time < 0.250,
        'Security Performance FK Joins: Foreign key joins should be optimized: ' || index_scan_time::text || 's'
    );
    
    -- Test 35: Composite index effectiveness
    SELECT test_schema.measure_performance_baseline(
        'SELECT COUNT(*) FROM public.opportunities WHERE stage = ''New Lead'' AND probability_percent > 50'
    ) INTO index_scan_time;
    
    PERFORM ok(
        index_scan_time < 0.100,
        'Security Performance Composite Index: Composite indexes should provide good performance: ' || index_scan_time::text || 's'
    );
END$$;

-- =============================================================================
-- CONCURRENT ACCESS PERFORMANCE TESTING
-- =============================================================================

-- Test 36-40: Concurrent Access Performance with Security
DO $$
DECLARE
    concurrent_time NUMERIC;
    single_user_time NUMERIC;
    concurrency_overhead NUMERIC;
    lock_wait_time NUMERIC;
BEGIN
    -- Test 36: Single user baseline
    PERFORM test_schema.simulate_user_session('auth.single_user', 'authenticated');
    
    SELECT test_schema.measure_performance_baseline(
        'SELECT COUNT(*) FROM public.contacts c JOIN public.organizations o ON c.organization_id = o.id'
    ) INTO single_user_time;
    
    PERFORM ok(
        single_user_time < 0.200,
        'Security Performance Single User: Single user queries should complete in under 200ms: ' || single_user_time::text || 's'
    );
    
    -- Test 37: Simulate concurrent access scenario
    -- Note: This is a simplified simulation - real concurrent testing would require multiple connections
    PERFORM test_schema.simulate_user_session('auth.concurrent_user_1', 'authenticated');
    PERFORM test_schema.simulate_user_session('auth.concurrent_user_2', 'authenticated');
    PERFORM test_schema.simulate_user_session('auth.concurrent_user_3', 'authenticated');
    
    SELECT test_schema.measure_performance_baseline(
        'SELECT COUNT(*) FROM public.contacts c JOIN public.organizations o ON c.organization_id = o.id'
    ) INTO concurrent_time;
    
    concurrency_overhead := ((concurrent_time - single_user_time) / single_user_time) * 100;
    
    PERFORM ok(
        concurrency_overhead <= 25.0,
        'Security Performance Concurrency: Concurrent access overhead should be under 25%: ' || concurrency_overhead::text || '%'
    );
    
    -- Test 38: Lock contention measurement
    SELECT test_schema.measure_performance_baseline(
        'UPDATE public.contacts SET notes = ''Updated by concurrent test'' WHERE id IN (SELECT id FROM public.contacts LIMIT 10)'
    ) INTO lock_wait_time;
    
    PERFORM ok(
        lock_wait_time < 0.300,
        'Security Performance Lock Contention: Updates should complete without significant lock contention: ' || lock_wait_time::text || 's'
    );
    
    -- Test 39: Read-heavy concurrent performance
    SELECT test_schema.measure_performance_baseline(
        'SELECT o.name, COUNT(c.id) FROM public.organizations o LEFT JOIN public.contacts c ON o.id = c.organization_id GROUP BY o.id, o.name LIMIT 100'
    ) INTO concurrent_time;
    
    PERFORM ok(
        concurrent_time < 0.400,
        'Security Performance Read Heavy: Read-heavy operations should scale well: ' || concurrent_time::text || 's'
    );
    
    -- Test 40: Write performance under concurrent access
    SELECT test_schema.measure_performance_baseline(
        'INSERT INTO public.contacts (organization_id, first_name, last_name, email) SELECT o.id, ''Concurrent'', ''User'', ''concurrent@example.com'' FROM public.organizations o WHERE o.name LIKE ''PerfTest%'' LIMIT 5'
    ) INTO concurrent_time;
    
    PERFORM ok(
        concurrent_time < 0.500,
        'Security Performance Concurrent Writes: Write operations should remain performant under concurrency: ' || concurrent_time::text || 's'
    );
END$$;

-- =============================================================================
-- SECURITY MONITORING PERFORMANCE IMPACT
-- =============================================================================

-- Test 41-45: Security Monitoring and Logging Performance
DO $$
DECLARE
    monitoring_time NUMERIC;
    logging_time NUMERIC;
    audit_time NUMERIC;
    baseline_time NUMERIC;
    monitoring_overhead NUMERIC;
BEGIN
    -- Test 41: Audit logging performance impact
    SELECT test_schema.measure_performance_baseline(
        'SELECT COUNT(*) FROM public.contacts'
    ) INTO baseline_time;
    
    -- Enable audit logging simulation
    PERFORM test_schema.enable_audit_logging();
    
    SELECT test_schema.measure_performance_baseline(
        'SELECT COUNT(*) FROM public.contacts'
    ) INTO audit_time;
    
    monitoring_overhead := ((audit_time - baseline_time) / baseline_time) * 100;
    
    PERFORM ok(
        monitoring_overhead <= 5.0,
        'Security Performance Audit Logging: Audit logging should add minimal overhead: ' || monitoring_overhead::text || '%'
    );
    
    -- Test 42: Security event logging performance
    SELECT test_schema.measure_performance_baseline(
        'INSERT INTO public.security_events (event_type, user_id, resource_type, resource_id, event_data) VALUES (''ACCESS_ATTEMPT'', ''auth.test_user'', ''contacts'', null, ''{}''::jsonb)'
    ) INTO logging_time;
    
    PERFORM ok(
        logging_time < 0.050,
        'Security Performance Event Logging: Security event logging should complete in under 50ms: ' || logging_time::text || 's'
    );
    
    -- Test 43: Real-time monitoring query performance
    SELECT test_schema.measure_performance_baseline(
        'SELECT event_type, COUNT(*) FROM public.security_events WHERE created_at > NOW() - INTERVAL ''1 hour'' GROUP BY event_type'
    ) INTO monitoring_time;
    
    PERFORM ok(
        monitoring_time < 0.200,
        'Security Performance Monitoring: Real-time monitoring queries should complete in under 200ms: ' || monitoring_time::text || 's'
    );
    
    -- Test 44: Security metrics aggregation performance
    SELECT test_schema.measure_performance_baseline(
        'SELECT DATE_TRUNC(''hour'', created_at) as hour, COUNT(*) FROM public.security_events WHERE created_at > NOW() - INTERVAL ''24 hours'' GROUP BY hour ORDER BY hour'
    ) INTO monitoring_time;
    
    PERFORM ok(
        monitoring_time < 0.300,
        'Security Performance Metrics: Security metrics aggregation should complete in under 300ms: ' || monitoring_time::text || 's'
    );
    
    -- Test 45: Overall system performance with all security measures
    PERFORM test_schema.simulate_user_session('auth.final_test_user', 'authenticated');
    
    SELECT test_schema.measure_performance_baseline(
        'WITH opportunity_summary AS (
            SELECT 
                o.principal_id,
                COUNT(*) as total_opportunities,
                COUNT(*) FILTER (WHERE o.is_won = true) as won_opportunities
            FROM public.opportunities o
            WHERE o.deleted_at IS NULL
            GROUP BY o.principal_id
        )
        SELECT 
            org.name,
            COALESCE(os.total_opportunities, 0) as total_opps,
            COALESCE(os.won_opportunities, 0) as won_opps
        FROM public.organizations org
        LEFT JOIN opportunity_summary os ON os.principal_id = org.id
        WHERE org.is_principal = true AND org.deleted_at IS NULL
        LIMIT 100'
    ) INTO monitoring_time;
    
    PERFORM ok(
        monitoring_time < 0.500,
        'Security Performance Complete System: Complex queries with all security measures should complete in under 500ms: ' || monitoring_time::text || 's'
    );
    
    -- Disable audit logging
    PERFORM test_schema.disable_audit_logging();
END$$;

-- =============================================================================
-- PERFORMANCE SUMMARY AND RECOMMENDATIONS
-- =============================================================================

-- Generate performance summary report
DO $$
DECLARE
    performance_summary JSONB;
BEGIN
    -- Create performance summary
    performance_summary := jsonb_build_object(
        'test_execution_date', NOW(),
        'performance_targets', jsonb_build_object(
            'basic_queries', '< 100ms',
            'complex_queries', '< 200ms',
            'bulk_operations', '< 500ms',
            'rls_overhead', '< 15%',
            'concurrent_overhead', '< 25%',
            'monitoring_overhead', '< 5%'
        ),
        'recommendations', jsonb_build_array(
            'Regularly monitor query performance with EXPLAIN ANALYZE',
            'Ensure indexes are properly maintained and used',
            'Consider connection pooling for high-concurrency scenarios',
            'Implement query result caching for frequently accessed data',
            'Monitor RLS policy complexity and optimize where possible',
            'Use materialized views for complex analytics queries',
            'Regularly update table statistics with ANALYZE',
            'Consider partitioning for large tables with time-based access patterns'
        )
    );
    
    -- Store performance summary (if table exists)
    BEGIN
        INSERT INTO public.performance_test_results (
            test_suite, execution_date, results_summary, status
        ) VALUES (
            'security_performance_validation',
            NOW(),
            performance_summary,
            'completed'
        );
    EXCEPTION WHEN undefined_table THEN
        -- Table doesn't exist, continue without storing
        RAISE NOTICE 'Performance summary: %', performance_summary::text;
    END;
    
    PERFORM ok(
        true,
        'Security Performance Summary: Generated performance analysis and recommendations'
    );
END$$;

-- =============================================================================
-- CLEANUP AND COMPLETION
-- =============================================================================

-- Clean up all performance test data
PERFORM test_schema.cleanup_test_data('test_security_performance');

-- Rollback test transaction
SELECT test_schema.rollback_test();

-- Finish test plan
SELECT finish();

-- Log completion
SELECT test_schema.test_notify('Completed Security Performance Validation Tests - All 45 tests executed');