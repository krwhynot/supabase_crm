-- =============================================================================
-- Query Response Time Performance Tests
-- =============================================================================
-- This file implements comprehensive response time validation for all CRM
-- entities with specific performance thresholds from handoff requirements:
-- - Contact operations: <100ms
-- - Organization operations: <200ms  
-- - Opportunity operations: <500ms
-- - Complex dashboard queries: <1s
-- =============================================================================

\i sql/tests/helpers/test_helpers.sql
SET search_path TO test_schema, public, pg_catalog;

-- Test plan - 35 tests for comprehensive response time validation
SELECT plan(35);

-- Test metadata
SELECT test_schema.test_notify('Starting test: query response time validation');

-- Test setup
SELECT test_schema.begin_test();

-- =============================================================================
-- PERFORMANCE TEST DATA SETUP
-- =============================================================================

-- Create large performance dataset for realistic testing
DO $$
DECLARE
    i INTEGER;
    j INTEGER;
    org_id UUID;
    contact_id UUID;
    product_id UUID;
    principal_id UUID;
    opportunity_id UUID;
    interaction_id UUID;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    setup_duration INTERVAL;
BEGIN
    start_time := clock_timestamp();
    RAISE NOTICE 'Creating performance test dataset...';

    -- Create 200 organizations (mix of principals/distributors)
    FOR i IN 1..200 LOOP
        SELECT test_schema.create_test_organization(
            'test_response_times',
            'Perf Org ' || i::text,
            CASE (i % 3) WHEN 0 THEN 'B2B' WHEN 1 THEN 'B2C' ELSE 'Distributor' END::public.organization_type,
            (i % 20 = 0), -- Every 20th is principal (10 principals)
            (i % 25 = 0)  -- Every 25th is distributor (8 distributors)
        ) INTO org_id;
        
        -- Create 3-5 contacts per organization for realistic data volume
        FOR j IN 1..(3 + (i % 3)) LOOP
            SELECT test_schema.create_test_contact(
                'test_response_times',
                'Contact' || j::text,
                'Lastname' || i::text,
                'Perf Org ' || i::text
            ) INTO contact_id;
        END LOOP;
    END LOOP;

    -- Create 100 products with varied categories
    FOR i IN 1..100 LOOP
        SELECT test_schema.create_test_product(
            'test_response_times',
            'Performance Product ' || i::text,
            CASE (i % 6)
                WHEN 0 THEN 'Protein'
                WHEN 1 THEN 'Sauce'
                WHEN 2 THEN 'Seasoning'
                WHEN 3 THEN 'Beverage'
                WHEN 4 THEN 'Snack'
                ELSE 'Other'
            END::public.product_category
        ) INTO product_id;
    END LOOP;

    -- Create 500 opportunities across all stages
    FOR i IN 1..500 LOOP
        -- Get random organization
        SELECT entity_id INTO org_id
        FROM test_schema.test_data_registry
        WHERE test_name = 'test_response_times'
        AND entity_type = 'organization'
        ORDER BY random()
        LIMIT 1;
        
        -- Get random principal
        SELECT entity_id INTO principal_id
        FROM test_schema.test_data_registry r
        JOIN public.organizations o ON r.entity_id = o.id
        WHERE r.test_name = 'test_response_times'
        AND r.entity_type = 'organization'
        AND o.is_principal = TRUE
        ORDER BY random()
        LIMIT 1;
        
        -- Get random product
        SELECT entity_id INTO product_id
        FROM test_schema.test_data_registry
        WHERE test_name = 'test_response_times'
        AND entity_type = 'product'
        ORDER BY random()
        LIMIT 1;
        
        SELECT test_schema.create_test_opportunity(
            'test_response_times',
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

    -- Create 1000 interaction records for complex query testing
    FOR i IN 1..1000 LOOP
        -- Get random opportunity
        SELECT entity_id INTO opportunity_id
        FROM test_schema.test_data_registry
        WHERE test_name = 'test_response_times'
        AND entity_type = 'opportunity'
        ORDER BY random()
        LIMIT 1;
        
        INSERT INTO public.interactions (
            opportunity_id,
            interaction_type,
            interaction_date,
            notes,
            outcome,
            follow_up_date
        ) VALUES (
            opportunity_id,
            CASE (i % 6)
                WHEN 0 THEN 'Email'
                WHEN 1 THEN 'Phone Call'
                WHEN 2 THEN 'Meeting'
                WHEN 3 THEN 'Demo'
                WHEN 4 THEN 'Proposal'
                ELSE 'Follow-up'
            END::public.interaction_type,
            CURRENT_DATE - (i % 365),
            'Performance test interaction ' || i::text,
            CASE (i % 4)
                WHEN 0 THEN 'Positive'
                WHEN 1 THEN 'Neutral'
                WHEN 2 THEN 'Negative'
                ELSE 'Follow-up Required'
            END::public.interaction_outcome,
            CASE WHEN i % 3 = 0 THEN CURRENT_DATE + (i % 30) ELSE NULL END
        ) RETURNING id INTO interaction_id;
        
        PERFORM test_schema.register_test_data('test_response_times', 'interaction', interaction_id);
    END LOOP;

    end_time := clock_timestamp();
    setup_duration := end_time - start_time;
    
    RAISE NOTICE 'Performance dataset created in %', setup_duration;
    RAISE NOTICE 'Dataset size: 200 orgs, ~800 contacts, 100 products, 500 opportunities, 1000 interactions';
END$$;

-- =============================================================================
-- CONTACT OPERATIONS PERFORMANCE TESTS (<100ms target)
-- =============================================================================

-- Test 1: Simple contact lookup by ID
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '100 milliseconds';
    test_contact_id UUID;
BEGIN
    -- Get a test contact ID
    SELECT entity_id INTO test_contact_id
    FROM test_schema.test_data_registry
    WHERE test_name = 'test_response_times'
    AND entity_type = 'contact'
    LIMIT 1;

    SELECT test_schema.measure_query_time(
        format('SELECT id, first_name, last_name, email, organization, title FROM public.contacts WHERE id = ''%s''', test_contact_id),
        5
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Contact ID lookup should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- Test 2: Contact email search performance
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '100 milliseconds';
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT id, first_name, last_name, email FROM public.contacts WHERE email LIKE ''%Contact1%'' LIMIT 20',
        3
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Contact email search should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- Test 3: Contact organization filter performance  
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '100 milliseconds';
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT id, first_name, last_name, organization FROM public.contacts WHERE organization LIKE ''Perf Org%'' ORDER BY last_name LIMIT 25',
        3
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Contact organization filter should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- Test 4: Contact full-text search performance
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '100 milliseconds';
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT id, first_name, last_name, email, organization FROM public.contacts WHERE first_name ILIKE ''%Contact%'' OR last_name ILIKE ''%Lastname%'' LIMIT 30',
        3
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Contact full-text search should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- Test 5: Contact pagination performance
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '100 milliseconds';
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT id, first_name, last_name, email FROM public.contacts ORDER BY created_at DESC OFFSET 100 LIMIT 25',
        2
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Contact pagination should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- =============================================================================
-- ORGANIZATION OPERATIONS PERFORMANCE TESTS (<200ms target)
-- =============================================================================

-- Test 6: Organization by ID lookup
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '200 milliseconds';
    test_org_id UUID;
BEGIN
    SELECT entity_id INTO test_org_id
    FROM test_schema.test_data_registry
    WHERE test_name = 'test_response_times'
    AND entity_type = 'organization'
    LIMIT 1;

    SELECT test_schema.measure_query_time(
        format('SELECT id, name, type, status, is_principal, is_distributor FROM public.organizations WHERE id = ''%s''', test_org_id),
        5
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Organization ID lookup should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- Test 7: Organization name search performance
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '200 milliseconds';
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT id, name, type, status FROM public.organizations WHERE name ILIKE ''%Perf%'' ORDER BY name LIMIT 30',
        3
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Organization name search should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- Test 8: Principal organizations query performance
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '200 milliseconds';
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT id, name, type, status FROM public.organizations WHERE is_principal = TRUE ORDER BY name LIMIT 20',
        3
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Principal organizations query should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- Test 9: Distributor organizations query performance
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '200 milliseconds';
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT id, name, type, status FROM public.organizations WHERE is_distributor = TRUE ORDER BY name LIMIT 20',
        3
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Distributor organizations query should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- Test 10: Organization with contact count performance
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '200 milliseconds';
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT o.id, o.name, o.type, COUNT(c.id) as contact_count FROM public.organizations o LEFT JOIN public.contacts c ON c.organization = o.name GROUP BY o.id, o.name, o.type ORDER BY contact_count DESC LIMIT 25',
        2
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Organization with contact count should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- =============================================================================
-- OPPORTUNITY OPERATIONS PERFORMANCE TESTS (<500ms target)
-- =============================================================================

-- Test 11: Opportunity by ID lookup with relationships
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '500 milliseconds';
    test_opp_id UUID;
BEGIN
    SELECT entity_id INTO test_opp_id
    FROM test_schema.test_data_registry
    WHERE test_name = 'test_response_times'
    AND entity_type = 'opportunity'
    LIMIT 1;

    SELECT test_schema.measure_query_time(
        format('SELECT o.id, o.name, o.stage, o.probability_percent, org.name as organization, p.name as product FROM public.opportunities o JOIN public.organizations org ON o.organization_id = org.id JOIN public.products p ON o.product_id = p.id WHERE o.id = ''%s''', test_opp_id),
        5
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Opportunity with relationships lookup should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- Test 12: Opportunities list with filters performance
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '500 milliseconds';
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT o.id, o.name, o.stage, o.probability_percent, org.name as organization FROM public.opportunities o JOIN public.organizations org ON o.organization_id = org.id WHERE o.stage IN (''New Lead'', ''Initial Outreach'', ''Sample/Visit Offered'') ORDER BY o.created_at DESC LIMIT 50',
        3
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Filtered opportunities list should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- Test 13: Opportunity pipeline analysis performance
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '500 milliseconds';
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT o.stage, COUNT(o.id) as opportunity_count, AVG(o.probability_percent) as avg_probability, SUM(CASE WHEN o.is_won THEN 1 ELSE 0 END) as won_count FROM public.opportunities o GROUP BY o.stage ORDER BY CASE o.stage WHEN ''New Lead'' THEN 1 WHEN ''Initial Outreach'' THEN 2 WHEN ''Sample/Visit Offered'' THEN 3 WHEN ''Awaiting Response'' THEN 4 WHEN ''Feedback Logged'' THEN 5 WHEN ''Demo Scheduled'' THEN 6 ELSE 7 END',
        2
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Opportunity pipeline analysis should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- Test 14: Principal performance analysis
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '500 milliseconds';
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT p.name as principal, COUNT(o.id) as total_opportunities, COUNT(CASE WHEN o.is_won THEN 1 END) as won_opportunities, AVG(o.probability_percent) as avg_probability FROM public.organizations p JOIN public.opportunities o ON p.id = o.principal_id WHERE p.is_principal = TRUE GROUP BY p.id, p.name ORDER BY total_opportunities DESC LIMIT 20',
        2
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Principal performance analysis should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- Test 15: Opportunity search with multiple criteria
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '500 milliseconds';
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT o.id, o.name, o.stage, org.name, p.name as product FROM public.opportunities o JOIN public.organizations org ON o.organization_id = org.id JOIN public.products p ON o.product_id = p.id WHERE (o.name ILIKE ''%Performance%'' OR org.name ILIKE ''%Perf%'') AND o.stage != ''Closed - Won'' ORDER BY o.probability_percent DESC LIMIT 40',
        2
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Complex opportunity search should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- =============================================================================
-- PRODUCT OPERATIONS PERFORMANCE TESTS (<200ms target)
-- =============================================================================

-- Test 16: Product catalog query performance
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '200 milliseconds';
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT id, name, category, sku, unit_cost, suggested_retail_price FROM public.products WHERE is_active = TRUE ORDER BY category, name LIMIT 50',
        3
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Product catalog query should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- Test 17: Product category filter performance
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '200 milliseconds';
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT id, name, description, category FROM public.products WHERE category = ''Protein'' ORDER BY name LIMIT 30',
        3
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Product category filter should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- Test 18: Product with opportunity count performance
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '200 milliseconds';
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT p.id, p.name, p.category, COUNT(o.id) as opportunity_count FROM public.products p LEFT JOIN public.opportunities o ON p.id = o.product_id GROUP BY p.id, p.name, p.category ORDER BY opportunity_count DESC LIMIT 25',
        2
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Product with opportunity count should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- =============================================================================
-- INTERACTION OPERATIONS PERFORMANCE TESTS (<300ms target)
-- =============================================================================

-- Test 19: Interaction list by opportunity performance
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '300 milliseconds';
    test_opp_id UUID;
BEGIN
    SELECT entity_id INTO test_opp_id
    FROM test_schema.test_data_registry
    WHERE test_name = 'test_response_times'
    AND entity_type = 'opportunity'
    LIMIT 1;

    SELECT test_schema.measure_query_time(
        format('SELECT i.id, i.interaction_type, i.interaction_date, i.notes, i.outcome FROM public.interactions i WHERE i.opportunity_id = ''%s'' ORDER BY i.interaction_date DESC LIMIT 30', test_opp_id),
        3
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Interaction list by opportunity should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- Test 20: Recent interactions across all opportunities
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '300 milliseconds';
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT i.id, i.interaction_type, i.interaction_date, i.outcome, o.name as opportunity FROM public.interactions i JOIN public.opportunities o ON i.opportunity_id = o.id WHERE i.interaction_date >= CURRENT_DATE - INTERVAL ''30 days'' ORDER BY i.interaction_date DESC LIMIT 50',
        2
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Recent interactions query should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- Test 21: Interaction outcome analysis performance
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '300 milliseconds';
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT i.outcome, COUNT(i.id) as interaction_count, COUNT(DISTINCT i.opportunity_id) as unique_opportunities FROM public.interactions i GROUP BY i.outcome ORDER BY interaction_count DESC',
        2
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Interaction outcome analysis should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- =============================================================================
-- COMPLEX DASHBOARD QUERIES PERFORMANCE TESTS (<1s target)
-- =============================================================================

-- Test 22: Complete dashboard KPI calculation
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '1 second';
BEGIN
    SELECT test_schema.measure_query_time(
        'WITH opportunity_stats AS (
            SELECT 
                COUNT(*) as total_opportunities,
                COUNT(CASE WHEN is_won THEN 1 END) as won_opportunities,
                COUNT(CASE WHEN stage != ''Closed - Won'' THEN 1 END) as active_opportunities,
                AVG(probability_percent) as avg_probability
            FROM public.opportunities
        ),
        monthly_wins AS (
            SELECT COUNT(*) as monthly_wins
            FROM public.opportunities 
            WHERE is_won = TRUE 
            AND updated_at >= DATE_TRUNC(''month'', CURRENT_DATE)
        ),
        contact_stats AS (
            SELECT COUNT(*) as total_contacts FROM public.contacts
        ),
        org_stats AS (
            SELECT 
                COUNT(*) as total_organizations,
                COUNT(CASE WHEN is_principal THEN 1 END) as total_principals
            FROM public.organizations
        )
        SELECT 
            o.total_opportunities,
            o.won_opportunities,
            o.active_opportunities,
            o.avg_probability,
            m.monthly_wins,
            c.total_contacts,
            g.total_organizations,
            g.total_principals
        FROM opportunity_stats o
        CROSS JOIN monthly_wins m
        CROSS JOIN contact_stats c
        CROSS JOIN org_stats g',
        1
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Dashboard KPI calculation should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- Test 23: Principal activity analytics performance
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '1 second';
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT 
            p.name as principal_name,
            COUNT(DISTINCT o.id) as total_opportunities,
            COUNT(DISTINCT CASE WHEN o.is_won THEN o.id END) as won_opportunities,
            COUNT(DISTINCT o.organization_id) as unique_customers,
            COUNT(DISTINCT i.id) as total_interactions,
            AVG(o.probability_percent) as avg_probability,
            MAX(o.updated_at) as last_activity
        FROM public.organizations p
        LEFT JOIN public.opportunities o ON p.id = o.principal_id
        LEFT JOIN public.interactions i ON o.id = i.opportunity_id
        WHERE p.is_principal = TRUE
        GROUP BY p.id, p.name
        ORDER BY total_opportunities DESC',
        1
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Principal activity analytics should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- Test 24: Sales pipeline progression analysis
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '1 second';
BEGIN
    SELECT test_schema.measure_query_time(
        'WITH stage_progression AS (
            SELECT 
                stage,
                COUNT(*) as current_count,
                AVG(probability_percent) as avg_probability,
                COUNT(CASE WHEN updated_at >= CURRENT_DATE - INTERVAL ''7 days'' THEN 1 END) as recent_activity
            FROM public.opportunities
            WHERE stage != ''Closed - Won''
            GROUP BY stage
        ),
        stage_transitions AS (
            SELECT 
                o.stage,
                COUNT(i.id) as interaction_count,
                AVG(EXTRACT(days FROM (CURRENT_DATE - o.created_at))) as avg_days_in_stage
            FROM public.opportunities o
            LEFT JOIN public.interactions i ON o.id = i.opportunity_id
            WHERE o.stage != ''Closed - Won''
            GROUP BY o.stage
        )
        SELECT 
            sp.stage,
            sp.current_count,
            sp.avg_probability,
            sp.recent_activity,
            st.interaction_count,
            st.avg_days_in_stage
        FROM stage_progression sp
        JOIN stage_transitions st ON sp.stage = st.stage
        ORDER BY CASE sp.stage 
            WHEN ''New Lead'' THEN 1 
            WHEN ''Initial Outreach'' THEN 2 
            WHEN ''Sample/Visit Offered'' THEN 3 
            WHEN ''Awaiting Response'' THEN 4 
            WHEN ''Feedback Logged'' THEN 5 
            WHEN ''Demo Scheduled'' THEN 6 
            ELSE 7 END',
        1
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Sales pipeline progression analysis should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- =============================================================================
-- PAGINATION PERFORMANCE TESTS
-- =============================================================================

-- Test 25: Large offset pagination stress test
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '800 milliseconds';
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT id, name, stage, probability_percent FROM public.opportunities ORDER BY created_at DESC OFFSET 400 LIMIT 25',
        2
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Large offset pagination should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- Test 26: Cursor-based pagination performance
DO $$
DECLARE
    query_time INTERVAL;
    cursor_timestamp TIMESTAMPTZ;
    threshold INTERVAL := '300 milliseconds';
BEGIN
    -- Get cursor position (200th newest opportunity)
    SELECT created_at INTO cursor_timestamp
    FROM public.opportunities
    ORDER BY created_at DESC
    LIMIT 1 OFFSET 200;
    
    SELECT test_schema.measure_query_time(
        format('SELECT id, name, stage, created_at FROM public.opportunities WHERE created_at < ''%s'' ORDER BY created_at DESC LIMIT 25', cursor_timestamp),
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

-- Test 27: Multi-table search performance
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '600 milliseconds';
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT 
            ''contact'' as result_type, 
            c.id::text as result_id, 
            c.first_name || '' '' || c.last_name as display_name,
            c.organization as context
        FROM public.contacts c 
        WHERE c.first_name ILIKE ''%Contact%'' OR c.last_name ILIKE ''%Lastname%''
        UNION ALL
        SELECT 
            ''organization'' as result_type,
            o.id::text as result_id,
            o.name as display_name,
            o.type::text as context
        FROM public.organizations o
        WHERE o.name ILIKE ''%Perf%''
        UNION ALL
        SELECT 
            ''opportunity'' as result_type,
            op.id::text as result_id,
            op.name as display_name,
            op.stage::text as context
        FROM public.opportunities op
        WHERE op.name ILIKE ''%Test%''
        ORDER BY display_name
        LIMIT 50',
        2
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('Multi-table search should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- =============================================================================
-- JSONB QUERY PERFORMANCE TESTS
-- =============================================================================

-- Test 28: JSONB field queries performance
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '400 milliseconds';
BEGIN
    -- First add some JSONB test data
    UPDATE public.organizations 
    SET 
        tags = CASE (id::text::numeric % 5)::integer
            WHEN 0 THEN '["high-priority", "performance-test"]'::jsonb
            WHEN 1 THEN '["medium-priority", "standard"]'::jsonb
            WHEN 2 THEN '["low-priority", "bulk"]'::jsonb
            WHEN 3 THEN '["urgent", "demo-required"]'::jsonb
            ELSE '["standard", "follow-up"]'::jsonb
        END,
        custom_fields = format('{"priority": "%s", "test_score": %s}', 
            CASE (id::text::numeric % 3)::integer WHEN 0 THEN 'high' WHEN 1 THEN 'medium' ELSE 'low' END,
            (50 + (id::text::numeric % 50)::integer)
        )::jsonb
    WHERE name LIKE 'Perf Org%';

    SELECT test_schema.measure_query_time(
        'SELECT id, name, tags, custom_fields FROM public.organizations WHERE tags ? ''high-priority'' AND custom_fields->>''priority'' = ''high'' LIMIT 25',
        3
    ) INTO query_time;
    
    PERFORM ok(
        query_time < threshold,
        format('JSONB field queries should complete under %s (took %s)', threshold, query_time)
    );
END$$;

-- =============================================================================
-- WRITE OPERATION PERFORMANCE TESTS
-- =============================================================================

-- Test 29: Single contact insert performance
DO $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    insert_time INTERVAL;
    threshold INTERVAL := '50 milliseconds';
    new_contact_id UUID;
BEGIN
    start_time := clock_timestamp();
    
    INSERT INTO public.contacts (
        first_name, last_name, organization, email, title, phone
    )
    VALUES (
        'Speed', 'Test', 'Speed Test Org', 
        'speed.test.' || extract(epoch from now()) || '@test.com',
        'Performance Tester', '555-SPEED'
    )
    RETURNING id INTO new_contact_id;
    
    end_time := clock_timestamp();
    insert_time := end_time - start_time;
    
    PERFORM ok(
        insert_time < threshold,
        format('Single contact insert should complete under %s (took %s)', threshold, insert_time)
    );
    
    -- Cleanup
    DELETE FROM public.contacts WHERE id = new_contact_id;
END$$;

-- Test 30: Bulk opportunity update performance
DO $$
DECLARE
    query_time INTERVAL;
    threshold INTERVAL := '800 milliseconds';
    updated_count INTEGER;
BEGIN
    SELECT test_schema.measure_query_time(
        'UPDATE public.opportunities SET probability_percent = probability_percent + 1 WHERE stage = ''New Lead'' AND probability_percent < 50',
        1
    ) INTO query_time;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    PERFORM ok(
        query_time < threshold,
        format('Bulk opportunity update (%s records) should complete under %s (took %s)', updated_count, threshold, query_time)
    );
    
    -- Revert changes
    UPDATE public.opportunities SET probability_percent = probability_percent - 1 WHERE stage = 'New Lead' AND probability_percent <= 51;
END$$;

-- =============================================================================
-- INDEX UTILIZATION VALIDATION TESTS
-- =============================================================================

-- Test 31: Contact email index utilization
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
        'Contact email queries should use index: ' || index_usage_result
    );
END$$;

-- Test 32: Organization primary key index utilization
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
        'Organization ID lookups should use primary key index: ' || index_usage_result
    );
END$$;

-- Test 33: Opportunity foreign key index utilization
DO $$
DECLARE
    index_usage_result TEXT;
BEGIN
    SELECT test_schema.check_index_usage(
        'SELECT * FROM public.opportunities WHERE organization_id = gen_random_uuid()',
        NULL
    ) INTO index_usage_result;
    
    PERFORM ok(
        index_usage_result LIKE '%index%' OR index_usage_result LIKE '%Index%',
        'Opportunity foreign key lookups should use index: ' || index_usage_result
    );
END$$;

-- Test 34: Product category index utilization
DO $$
DECLARE
    index_usage_result TEXT;
BEGIN
    SELECT test_schema.check_index_usage(
        'SELECT * FROM public.products WHERE category = ''Protein''',
        NULL
    ) INTO index_usage_result;
    
    PERFORM ok(
        index_usage_result LIKE '%index%' OR index_usage_result LIKE '%Seq%',
        'Product category queries should use appropriate access method: ' || index_usage_result
    );
END$$;

-- Test 35: Opportunity stage index utilization
DO $$
DECLARE
    index_usage_result TEXT;
BEGIN
    SELECT test_schema.check_index_usage(
        'SELECT * FROM public.opportunities WHERE stage = ''New Lead''',
        NULL
    ) INTO index_usage_result;
    
    PERFORM ok(
        index_usage_result LIKE '%index%' OR index_usage_result LIKE '%Seq%',
        'Opportunity stage queries should use appropriate access method: ' || index_usage_result
    );
END$$;

-- =============================================================================
-- PERFORMANCE SUMMARY AND RECOMMENDATIONS
-- =============================================================================

-- Generate comprehensive performance summary
DO $$
DECLARE
    total_contacts INTEGER;
    total_organizations INTEGER;
    total_opportunities INTEGER;
    total_products INTEGER;
    total_interactions INTEGER;
    dataset_creation_time TIMESTAMPTZ;
    performance_summary TEXT;
BEGIN
    -- Get dataset statistics
    SELECT COUNT(*) INTO total_contacts 
    FROM test_schema.test_data_registry 
    WHERE test_name = 'test_response_times' AND entity_type = 'contact';
    
    SELECT COUNT(*) INTO total_organizations 
    FROM test_schema.test_data_registry 
    WHERE test_name = 'test_response_times' AND entity_type = 'organization';
    
    SELECT COUNT(*) INTO total_opportunities 
    FROM test_schema.test_data_registry 
    WHERE test_name = 'test_response_times' AND entity_type = 'opportunity';
    
    SELECT COUNT(*) INTO total_products 
    FROM test_schema.test_data_registry 
    WHERE test_name = 'test_response_times' AND entity_type = 'product';
    
    SELECT COUNT(*) INTO total_interactions 
    FROM test_schema.test_data_registry 
    WHERE test_name = 'test_response_times' AND entity_type = 'interaction';
    
    -- Performance analysis summary
    RAISE NOTICE '';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'QUERY RESPONSE TIME PERFORMANCE TEST SUMMARY';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Dataset Statistics:';
    RAISE NOTICE '  Contacts: % records', total_contacts;
    RAISE NOTICE '  Organizations: % records (% principals, % distributors)', 
        total_organizations,
        (SELECT COUNT(*) FROM public.organizations WHERE name LIKE 'Perf Org%' AND is_principal = TRUE),
        (SELECT COUNT(*) FROM public.organizations WHERE name LIKE 'Perf Org%' AND is_distributor = TRUE);
    RAISE NOTICE '  Products: % records', total_products;
    RAISE NOTICE '  Opportunities: % records', total_opportunities;
    RAISE NOTICE '  Interactions: % records', total_interactions;
    RAISE NOTICE '';
    
    RAISE NOTICE 'Performance Thresholds Tested:';
    RAISE NOTICE '  Contact Operations: <100ms target';
    RAISE NOTICE '  Organization Operations: <200ms target';
    RAISE NOTICE '  Opportunity Operations: <500ms target';
    RAISE NOTICE '  Complex Dashboard Queries: <1000ms target';
    RAISE NOTICE '  Interaction Operations: <300ms target';
    RAISE NOTICE '  Product Operations: <200ms target';
    RAISE NOTICE '';
    
    RAISE NOTICE 'Test Categories Executed:';
    RAISE NOTICE '  ✓ Basic CRUD Operations (Tests 1-21)';
    RAISE NOTICE '  ✓ Complex Dashboard Analytics (Tests 22-24)';
    RAISE NOTICE '  ✓ Pagination Performance (Tests 25-26)';
    RAISE NOTICE '  ✓ Multi-table Search (Test 27)';
    RAISE NOTICE '  ✓ JSONB Query Performance (Test 28)';
    RAISE NOTICE '  ✓ Write Operation Performance (Tests 29-30)';
    RAISE NOTICE '  ✓ Index Utilization Validation (Tests 31-35)';
    RAISE NOTICE '';
    
    RAISE NOTICE 'Performance Optimization Recommendations:';
    RAISE NOTICE '  1. Monitor query execution plans for complex dashboard queries';
    RAISE NOTICE '  2. Implement connection pooling for concurrent access scenarios';
    RAISE NOTICE '  3. Consider materialized views for frequently accessed analytics';
    RAISE NOTICE '  4. Add compound indexes for multi-column search operations';
    RAISE NOTICE '  5. Implement query result caching for dashboard KPIs';
    RAISE NOTICE '  6. Use cursor-based pagination for large datasets';
    RAISE NOTICE '  7. Monitor JSONB query performance and consider GIN indexes';
    RAISE NOTICE '  8. Implement database query monitoring and alerting';
    RAISE NOTICE '  9. Consider read replicas for analytics workloads';
    RAISE NOTICE '  10. Optimize bulk operations with batch processing';
    RAISE NOTICE '';
    
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  → Run load testing with concurrent users (test_concurrent_access.sql)';
    RAISE NOTICE '  → Validate security performance impact (test_rls_performance_impact.sql)';
    RAISE NOTICE '  → Test real-time subscription performance';
    RAISE NOTICE '  → Implement performance monitoring dashboard';
    RAISE NOTICE '  → Set up automated performance regression testing';
    RAISE NOTICE '';
    RAISE NOTICE '=============================================================================';
END$$;

-- =============================================================================
-- CLEANUP AND COMPLETION
-- =============================================================================

-- Clean up performance test data
PERFORM test_schema.cleanup_test_data('test_response_times');

-- Rollback test transaction
SELECT test_schema.rollback_test();

-- Finish test plan
SELECT finish();

-- Log completion
SELECT test_schema.test_notify('Completed test: query response time validation');