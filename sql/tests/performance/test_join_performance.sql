-- =============================================================================
-- Join Performance and Multi-Table Query Optimization Tests
-- =============================================================================
-- This file validates join performance, query plan optimization, and complex
-- multi-table query execution patterns for all CRM entities with realistic
-- dataset sizes and business query patterns.
-- =============================================================================

\i sql/tests/helpers/test_helpers.sql
SET search_path TO test_schema, public, pg_catalog;

-- Test plan - 20 tests for comprehensive join performance validation
SELECT plan(20);

-- Test metadata
SELECT test_schema.test_notify('Starting test: join performance and multi-table optimization');

-- Test setup
SELECT test_schema.begin_test();

-- =============================================================================
-- JOIN PERFORMANCE ANALYSIS HELPER FUNCTIONS
-- =============================================================================

-- Advanced join analysis with cost estimation
CREATE OR REPLACE FUNCTION test_schema.analyze_join_performance(
    sql_query TEXT,
    performance_threshold INTERVAL DEFAULT '500 milliseconds',
    expected_join_type TEXT DEFAULT NULL
)
RETURNS TABLE(
    execution_time INTERVAL,
    within_threshold BOOLEAN,
    join_method TEXT,
    cost_estimate NUMERIC,
    rows_estimate INTEGER,
    execution_plan TEXT,
    performance_score INTEGER
) AS $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    explain_output TEXT;
    plan_lines TEXT[];
    line TEXT;
    performance_score_calc INTEGER := 100;
BEGIN
    -- Measure actual execution time
    start_time := clock_timestamp();
    EXECUTE sql_query;
    end_time := clock_timestamp();
    
    execution_time := end_time - start_time;
    within_threshold := execution_time <= performance_threshold;
    
    -- Get detailed execution plan
    EXECUTE 'EXPLAIN (ANALYZE false, COSTS true, FORMAT TEXT) ' || sql_query 
    INTO explain_output;
    
    execution_plan := explain_output;
    plan_lines := string_to_array(explain_output, E'\n');
    
    -- Initialize defaults
    join_method := 'Unknown';
    cost_estimate := 0.0;
    rows_estimate := 0;
    
    -- Parse execution plan for join analysis
    FOREACH line IN ARRAY plan_lines LOOP
        -- Identify join methods
        IF line ~* 'Hash Join' THEN
            join_method := 'Hash Join';
        ELSIF line ~* 'Nested Loop' THEN
            join_method := 'Nested Loop';
        ELSIF line ~* 'Merge Join' THEN
            join_method := 'Merge Join';
        END IF;
        
        -- Extract cost and rows estimates
        IF line ~ 'cost=[\d.]+\.\.[\d.]+' THEN
            cost_estimate := GREATEST(cost_estimate, 
                substring(line from 'cost=[\d.]+\.\.([\d.]+)')::NUMERIC);
        END IF;
        
        IF line ~ 'rows=[\d]+' THEN
            rows_estimate := GREATEST(rows_estimate,
                substring(line from 'rows=([\d]+)')::INTEGER);
        END IF;
    END LOOP;
    
    -- Calculate performance score
    IF NOT within_threshold THEN
        performance_score_calc := performance_score_calc - 30;
    END IF;
    
    IF cost_estimate > 100.0 THEN
        performance_score_calc := performance_score_calc - 20;
    END IF;
    
    IF join_method = 'Nested Loop' AND rows_estimate > 100 THEN
        performance_score_calc := performance_score_calc - 15; -- Nested loops expensive for large datasets
    ELSIF join_method = 'Hash Join' THEN
        performance_score_calc := performance_score_calc + 10; -- Generally efficient
    END IF;
    
    performance_score := GREATEST(0, performance_score_calc);
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Join selectivity analysis
CREATE OR REPLACE FUNCTION test_schema.analyze_join_selectivity(
    left_table TEXT,
    right_table TEXT,
    join_column TEXT
)
RETURNS TABLE(
    left_table_size INTEGER,
    right_table_size INTEGER,
    join_cardinality INTEGER,
    selectivity_ratio NUMERIC,
    efficiency_rating TEXT
) AS $$
DECLARE
    left_count INTEGER;
    right_count INTEGER;
    join_count INTEGER;
    selectivity NUMERIC;
BEGIN
    -- Get table sizes
    EXECUTE format('SELECT COUNT(*) FROM %I', left_table) INTO left_count;
    EXECUTE format('SELECT COUNT(*) FROM %I', right_table) INTO right_count;
    
    -- Estimate join cardinality (simplified approach)
    EXECUTE format('SELECT COUNT(*) FROM %I l JOIN %I r ON l.%I = r.id', 
        left_table, right_table, join_column) INTO join_count;
    
    left_table_size := left_count;
    right_table_size := right_count;
    join_cardinality := join_count;
    selectivity_ratio := CASE 
        WHEN left_count > 0 THEN join_count::NUMERIC / left_count::NUMERIC 
        ELSE 0 
    END;
    
    -- Rate efficiency based on selectivity
    efficiency_rating := CASE
        WHEN selectivity_ratio > 0.9 THEN 'Excellent'
        WHEN selectivity_ratio > 0.7 THEN 'Good' 
        WHEN selectivity_ratio > 0.5 THEN 'Fair'
        WHEN selectivity_ratio > 0.3 THEN 'Poor'
        ELSE 'Very Poor'
    END;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PERFORMANCE TEST DATA SETUP
-- =============================================================================

-- Create comprehensive dataset for join performance testing
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
    RAISE NOTICE 'Creating join performance test dataset...';

    -- Create 150 organizations with realistic distribution
    FOR i IN 1..150 LOOP
        SELECT test_schema.create_test_organization(
            'test_join_performance',
            'JoinTest Org ' || i::text,
            CASE (i % 3) 
                WHEN 0 THEN 'B2B' 
                WHEN 1 THEN 'B2C' 
                ELSE 'Distributor' 
            END::public.organization_type,
            (i % 12 = 0), -- 12-13 principals
            (i % 15 = 0)  -- 10 distributors
        ) INTO org_id;
        
        -- Create 2-4 contacts per organization for realistic contact-org ratios
        FOR j IN 1..(2 + (i % 3)) LOOP
            SELECT test_schema.create_test_contact(
                'test_join_performance',
                'JoinContact' || j::text,
                'TestLast' || i::text,
                'JoinTest Org ' || i::text
            ) INTO contact_id;
        END LOOP;
    END LOOP;

    -- Create 75 products with varied categories
    FOR i IN 1..75 LOOP
        SELECT test_schema.create_test_product(
            'test_join_performance',
            'JoinTest Product ' || i::text,
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

    -- Create 300 opportunities across all stages
    FOR i IN 1..300 LOOP
        -- Get random organization
        SELECT entity_id INTO org_id
        FROM test_schema.test_data_registry
        WHERE test_name = 'test_join_performance'
        AND entity_type = 'organization'
        ORDER BY random()
        LIMIT 1;
        
        -- Get random principal
        SELECT entity_id INTO principal_id
        FROM test_schema.test_data_registry r
        JOIN public.organizations o ON r.entity_id = o.id
        WHERE r.test_name = 'test_join_performance'
        AND r.entity_type = 'organization'
        AND o.is_principal = TRUE
        ORDER BY random()
        LIMIT 1;
        
        -- Get random product
        SELECT entity_id INTO product_id
        FROM test_schema.test_data_registry
        WHERE test_name = 'test_join_performance'
        AND entity_type = 'product'
        ORDER BY random()
        LIMIT 1;
        
        SELECT test_schema.create_test_opportunity(
            'test_join_performance',
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

    -- Create 600 interaction records for complex join testing
    FOR i IN 1..600 LOOP
        -- Get random opportunity
        SELECT entity_id INTO opportunity_id
        FROM test_schema.test_data_registry
        WHERE test_name = 'test_join_performance'
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
            CURRENT_DATE - (i % 180), -- 6 months of data
            'Join performance test interaction ' || i::text,
            CASE (i % 4)
                WHEN 0 THEN 'Positive'
                WHEN 1 THEN 'Neutral'
                WHEN 2 THEN 'Negative'
                ELSE 'Follow-up Required'
            END::public.interaction_outcome,
            CASE WHEN i % 4 = 0 THEN CURRENT_DATE + (i % 30) ELSE NULL END
        ) RETURNING id INTO interaction_id;
        
        PERFORM test_schema.register_test_data('test_join_performance', 'interaction', interaction_id);
    END LOOP;

    end_time := clock_timestamp();
    setup_duration := end_time - start_time;
    
    RAISE NOTICE 'Join performance dataset created in %', setup_duration;
    RAISE NOTICE 'Dataset: 150 orgs, ~400 contacts, 75 products, 300 opportunities, 600 interactions';
END$$;

-- =============================================================================
-- TWO-TABLE JOIN PERFORMANCE TESTS
-- =============================================================================

-- Test 1: Contact-Organization join performance (1:1 relationship pattern)
DO $$
DECLARE
    analysis_result RECORD;
    selectivity_result RECORD;
    threshold INTERVAL := '200 milliseconds';
BEGIN
    SELECT * INTO analysis_result
    FROM test_schema.analyze_join_performance(
        'SELECT c.id, c.first_name, c.last_name, c.organization FROM public.contacts c WHERE c.first_name LIKE ''JoinContact%'' ORDER BY c.last_name LIMIT 50',
        threshold
    );
    
    PERFORM ok(
        analysis_result.within_threshold,
        format('Contact-Organization lookup should complete under %s (took %s, score: %s)', 
            threshold, analysis_result.execution_time, analysis_result.performance_score)
    );
END$$;

-- Test 2: Opportunity-Organization join performance (N:1 relationship)
DO $$
DECLARE
    analysis_result RECORD;
    threshold INTERVAL := '300 milliseconds';
BEGIN
    SELECT * INTO analysis_result
    FROM test_schema.analyze_join_performance(
        'SELECT o.id, o.name, o.stage, org.name as organization_name FROM public.opportunities o JOIN public.organizations org ON o.organization_id = org.id WHERE o.stage IN (''New Lead'', ''Initial Outreach'') ORDER BY o.created_at DESC LIMIT 75',
        threshold
    );
    
    PERFORM ok(
        analysis_result.within_threshold AND analysis_result.performance_score >= 70,
        format('Opportunity-Organization join should be efficient (time: %s, method: %s, score: %s)', 
            analysis_result.execution_time, analysis_result.join_method, analysis_result.performance_score)
    );
END$$;

-- Test 3: Opportunity-Product join performance
DO $$
DECLARE
    analysis_result RECORD;
    threshold INTERVAL := '250 milliseconds';
BEGIN
    SELECT * INTO analysis_result
    FROM test_schema.analyze_join_performance(
        'SELECT o.id, o.name, p.name as product_name, p.category FROM public.opportunities o JOIN public.products p ON o.product_id = p.id WHERE p.category IN (''Protein'', ''Sauce'') ORDER BY p.name LIMIT 60',
        threshold
    );
    
    PERFORM ok(
        analysis_result.within_threshold,
        format('Opportunity-Product join should complete under %s (time: %s, method: %s)', 
            threshold, analysis_result.execution_time, analysis_result.join_method)
    );
END$$;

-- Test 4: Interaction-Opportunity join performance
DO $$
DECLARE
    analysis_result RECORD;
    threshold INTERVAL := '300 milliseconds';
BEGIN
    SELECT * INTO analysis_result
    FROM test_schema.analyze_join_performance(
        'SELECT i.id, i.interaction_type, i.interaction_date, o.name as opportunity_name FROM public.interactions i JOIN public.opportunities o ON i.opportunity_id = o.id WHERE i.interaction_date >= CURRENT_DATE - INTERVAL ''30 days'' ORDER BY i.interaction_date DESC LIMIT 100',
        threshold
    );
    
    PERFORM ok(
        analysis_result.within_threshold AND analysis_result.cost_estimate < 100.0,
        format('Interaction-Opportunity join should be efficient (time: %s, cost: %s)', 
            analysis_result.execution_time, analysis_result.cost_estimate)
    );
END$$;

-- =============================================================================
-- THREE-TABLE JOIN PERFORMANCE TESTS
-- =============================================================================

-- Test 5: Opportunity-Organization-Principal three-way join
DO $$
DECLARE
    analysis_result RECORD;
    threshold INTERVAL := '400 milliseconds';
BEGIN
    SELECT * INTO analysis_result
    FROM test_schema.analyze_join_performance(
        'SELECT o.id, o.name, org.name as customer, principal.name as principal FROM public.opportunities o JOIN public.organizations org ON o.organization_id = org.id JOIN public.organizations principal ON o.principal_id = principal.id WHERE principal.is_principal = TRUE ORDER BY o.probability_percent DESC LIMIT 50',
        threshold
    );
    
    PERFORM ok(
        analysis_result.within_threshold,
        format('Three-table join (Opp-Org-Principal) should complete under %s (time: %s)', 
            threshold, analysis_result.execution_time)
    );
END$$;

-- Test 6: Opportunity-Organization-Product three-way join
DO $$
DECLARE
    analysis_result RECORD;
    threshold INTERVAL := '350 milliseconds';
BEGIN
    SELECT * INTO analysis_result
    FROM test_schema.analyze_join_performance(
        'SELECT o.id, o.name, o.stage, org.name as customer, p.name as product, p.category FROM public.opportunities o JOIN public.organizations org ON o.organization_id = org.id JOIN public.products p ON o.product_id = p.id WHERE o.stage != ''Closed - Won'' AND p.is_active = TRUE ORDER BY o.updated_at DESC LIMIT 60',
        threshold
    );
    
    PERFORM ok(
        analysis_result.within_threshold AND analysis_result.performance_score >= 65,
        format('Three-table join (Opp-Org-Product) should be efficient (time: %s, score: %s)', 
            analysis_result.execution_time, analysis_result.performance_score)
    );
END$$;

-- Test 7: Interaction-Opportunity-Organization chain join
DO $$
DECLARE
    analysis_result RECORD;
    threshold INTERVAL := '500 milliseconds';
BEGIN
    SELECT * INTO analysis_result
    FROM test_schema.analyze_join_performance(
        'SELECT i.id, i.interaction_type, i.outcome, o.name as opportunity, org.name as customer FROM public.interactions i JOIN public.opportunities o ON i.opportunity_id = o.id JOIN public.organizations org ON o.organization_id = org.id WHERE i.outcome = ''Positive'' AND org.type = ''B2B'' ORDER BY i.interaction_date DESC LIMIT 80',
        threshold
    );
    
    PERFORM ok(
        analysis_result.within_threshold,
        format('Interaction-Opportunity-Organization chain join should complete under %s (time: %s)', 
            threshold, analysis_result.execution_time)
    );
END$$;

-- =============================================================================
-- FOUR-TABLE JOIN PERFORMANCE TESTS
-- =============================================================================

-- Test 8: Complete CRM entity join (Interaction-Opportunity-Organization-Product)
DO $$
DECLARE
    analysis_result RECORD;
    threshold INTERVAL := '600 milliseconds';
BEGIN
    SELECT * INTO analysis_result
    FROM test_schema.analyze_join_performance(
        'SELECT i.interaction_type, i.outcome, o.name as opportunity, o.stage, org.name as customer, p.name as product, p.category FROM public.interactions i JOIN public.opportunities o ON i.opportunity_id = o.id JOIN public.organizations org ON o.organization_id = org.id JOIN public.products p ON o.product_id = p.id WHERE i.interaction_date >= CURRENT_DATE - INTERVAL ''60 days'' AND o.stage IN (''New Lead'', ''Demo Scheduled'') ORDER BY i.interaction_date DESC LIMIT 40',
        threshold
    );
    
    PERFORM ok(
        analysis_result.within_threshold,
        format('Four-table join across all CRM entities should complete under %s (time: %s, cost: %s)', 
            threshold, analysis_result.execution_time, analysis_result.cost_estimate)
    );
END$$;

-- Test 9: Principal performance analysis with four-table join
DO $$
DECLARE
    analysis_result RECORD;
    threshold INTERVAL := '700 milliseconds';
BEGIN
    SELECT * INTO analysis_result
    FROM test_schema.analyze_join_performance(
        'SELECT principal.name as principal_name, COUNT(DISTINCT o.id) as opportunities, COUNT(DISTINCT i.id) as interactions, COUNT(DISTINCT org.id) as unique_customers FROM public.organizations principal JOIN public.opportunities o ON principal.id = o.principal_id JOIN public.organizations org ON o.organization_id = org.id LEFT JOIN public.interactions i ON o.id = i.opportunity_id WHERE principal.is_principal = TRUE GROUP BY principal.id, principal.name ORDER BY opportunities DESC LIMIT 15',
        threshold
    );
    
    PERFORM ok(
        analysis_result.within_threshold,
        format('Principal performance analysis (4-table join with aggregation) should complete under %s (time: %s)', 
            threshold, analysis_result.execution_time)
    );
END$$;

-- =============================================================================
-- JOIN SELECTIVITY AND EFFICIENCY TESTS
-- =============================================================================

-- Test 10: Opportunity-Organization join selectivity analysis
DO $$
DECLARE
    selectivity_result RECORD;
BEGIN
    SELECT * INTO selectivity_result
    FROM test_schema.analyze_join_selectivity('opportunities', 'organizations', 'organization_id');
    
    PERFORM ok(
        selectivity_result.selectivity_ratio > 0.8, -- Most opportunities should have valid organizations
        format('Opportunity-Organization join selectivity should be high (ratio: %s, rating: %s)', 
            selectivity_result.selectivity_ratio, selectivity_result.efficiency_rating)
    );
END$$;

-- Test 11: Interaction-Opportunity join selectivity analysis
DO $$
DECLARE
    selectivity_result RECORD;
BEGIN
    SELECT * INTO selectivity_result
    FROM test_schema.analyze_join_selectivity('interactions', 'opportunities', 'opportunity_id');
    
    PERFORM ok(
        selectivity_result.selectivity_ratio > 0.9, -- All interactions should have valid opportunities
        format('Interaction-Opportunity join selectivity should be excellent (ratio: %s)', 
            selectivity_result.selectivity_ratio)
    );
END$$;

-- =============================================================================
-- LEFT JOIN PERFORMANCE TESTS
-- =============================================================================

-- Test 12: Organization with optional interaction count (LEFT JOIN)
DO $$
DECLARE
    analysis_result RECORD;
    threshold INTERVAL := '400 milliseconds';
BEGIN
    SELECT * INTO analysis_result
    FROM test_schema.analyze_join_performance(
        'SELECT org.id, org.name, org.type, COUNT(i.id) as interaction_count FROM public.organizations org LEFT JOIN public.opportunities o ON org.id = o.organization_id LEFT JOIN public.interactions i ON o.id = i.opportunity_id WHERE org.name LIKE ''JoinTest Org%'' GROUP BY org.id, org.name, org.type ORDER BY interaction_count DESC LIMIT 30',
        threshold
    );
    
    PERFORM ok(
        analysis_result.within_threshold,
        format('LEFT JOIN with aggregation should complete under %s (time: %s)', 
            threshold, analysis_result.execution_time)
    );
END$$;

-- Test 13: Product with optional opportunity count (LEFT JOIN)
DO $$
DECLARE
    analysis_result RECORD;
    threshold INTERVAL := '300 milliseconds';
BEGIN
    SELECT * INTO analysis_result
    FROM test_schema.analyze_join_performance(
        'SELECT p.id, p.name, p.category, COUNT(o.id) as opportunity_count, COUNT(CASE WHEN o.is_won THEN 1 END) as won_count FROM public.products p LEFT JOIN public.opportunities o ON p.id = o.product_id WHERE p.name LIKE ''JoinTest Product%'' GROUP BY p.id, p.name, p.category ORDER BY opportunity_count DESC LIMIT 25',
        threshold
    );
    
    PERFORM ok(
        analysis_result.within_threshold AND analysis_result.performance_score >= 70,
        format('Product LEFT JOIN with conditional aggregation should be efficient (time: %s, score: %s)', 
            analysis_result.execution_time, analysis_result.performance_score)
    );
END$$;

-- =============================================================================
-- SUBQUERY vs JOIN PERFORMANCE COMPARISON
-- =============================================================================

-- Test 14: EXISTS subquery vs JOIN performance comparison
DO $$
DECLARE
    join_time INTERVAL;
    subquery_time INTERVAL;
    threshold INTERVAL := '300 milliseconds';
    performance_difference NUMERIC;
BEGIN
    -- Measure JOIN approach
    SELECT test_schema.measure_query_time(
        'SELECT DISTINCT org.id, org.name FROM public.organizations org JOIN public.opportunities o ON org.id = o.organization_id WHERE o.stage = ''New Lead''',
        3
    ) INTO join_time;
    
    -- Measure EXISTS subquery approach
    SELECT test_schema.measure_query_time(
        'SELECT org.id, org.name FROM public.organizations org WHERE EXISTS (SELECT 1 FROM public.opportunities o WHERE o.organization_id = org.id AND o.stage = ''New Lead'')',
        3
    ) INTO subquery_time;
    
    performance_difference := EXTRACT(EPOCH FROM ABS(join_time - subquery_time)) * 1000; -- Convert to milliseconds
    
    PERFORM ok(
        join_time < threshold AND subquery_time < threshold,
        format('Both JOIN (%s) and EXISTS (%s) should complete under %s (difference: %s ms)', 
            join_time, subquery_time, threshold, performance_difference)
    );
END$$;

-- Test 15: IN subquery vs JOIN performance comparison
DO $$
DECLARE
    join_time INTERVAL;
    in_subquery_time INTERVAL;
    threshold INTERVAL := '350 milliseconds';
BEGIN
    -- Measure JOIN approach
    SELECT test_schema.measure_query_time(
        'SELECT o.id, o.name FROM public.opportunities o JOIN public.organizations org ON o.organization_id = org.id WHERE org.is_principal = TRUE',
        3
    ) INTO join_time;
    
    -- Measure IN subquery approach  
    SELECT test_schema.measure_query_time(
        'SELECT o.id, o.name FROM public.opportunities o WHERE o.organization_id IN (SELECT id FROM public.organizations WHERE is_principal = TRUE)',
        3
    ) INTO in_subquery_time;
    
    PERFORM ok(
        join_time < threshold AND in_subquery_time < threshold,
        format('Both JOIN (%s) and IN subquery (%s) should complete under %s', 
            join_time, in_subquery_time, threshold)
    );
END$$;

-- =============================================================================
-- WINDOW FUNCTION WITH JOIN PERFORMANCE TESTS
-- =============================================================================

-- Test 16: Window function with join performance
DO $$
DECLARE
    analysis_result RECORD;
    threshold INTERVAL := '500 milliseconds';
BEGIN
    SELECT * INTO analysis_result
    FROM test_schema.analyze_join_performance(
        'SELECT o.id, o.name, org.name as customer, o.probability_percent, ROW_NUMBER() OVER (PARTITION BY org.type ORDER BY o.probability_percent DESC) as rank_in_type FROM public.opportunities o JOIN public.organizations org ON o.organization_id = org.id WHERE o.stage != ''Closed - Won'' ORDER BY org.type, rank_in_type LIMIT 50',
        threshold
    );
    
    PERFORM ok(
        analysis_result.within_threshold,
        format('Window function with join should complete under %s (time: %s)', 
            threshold, analysis_result.execution_time)
    );
END$$;

-- =============================================================================
-- UNION JOIN PERFORMANCE TESTS
-- =============================================================================

-- Test 17: UNION of related entities performance
DO $$
DECLARE
    analysis_result RECORD;
    threshold INTERVAL := '400 milliseconds';
BEGIN
    SELECT * INTO analysis_result
    FROM test_schema.analyze_join_performance(
        'SELECT ''contact'' as entity_type, c.first_name || '' '' || c.last_name as name, c.organization as context FROM public.contacts c WHERE c.first_name LIKE ''JoinContact%'' UNION ALL SELECT ''organization'' as entity_type, o.name, o.type::text as context FROM public.organizations o WHERE o.name LIKE ''JoinTest Org%'' ORDER BY name LIMIT 80',
        threshold
    );
    
    PERFORM ok(
        analysis_result.within_threshold,
        format('UNION query should complete under %s (time: %s)', 
            threshold, analysis_result.execution_time)
    );
END$$;

-- =============================================================================
-- COMPLEX ANALYTICS JOIN PERFORMANCE TESTS
-- =============================================================================

-- Test 18: Sales funnel analysis with multiple joins
DO $$
DECLARE
    analysis_result RECORD;
    threshold INTERVAL := '800 milliseconds';
BEGIN
    SELECT * INTO analysis_result
    FROM test_schema.analyze_join_performance(
        'WITH stage_progression AS (SELECT o.stage, COUNT(*) as opportunity_count, COUNT(DISTINCT o.organization_id) as unique_customers, COUNT(DISTINCT i.id) as interaction_count, AVG(o.probability_percent) as avg_probability FROM public.opportunities o LEFT JOIN public.interactions i ON o.id = i.opportunity_id GROUP BY o.stage), customer_engagement AS (SELECT org.type, COUNT(DISTINCT o.id) as opportunities, COUNT(DISTINCT i.id) as interactions FROM public.organizations org JOIN public.opportunities o ON org.id = o.organization_id LEFT JOIN public.interactions i ON o.id = i.opportunity_id GROUP BY org.type) SELECT sp.stage, sp.opportunity_count, sp.unique_customers, sp.interaction_count, sp.avg_probability FROM stage_progression sp ORDER BY CASE sp.stage WHEN ''New Lead'' THEN 1 WHEN ''Initial Outreach'' THEN 2 WHEN ''Sample/Visit Offered'' THEN 3 WHEN ''Awaiting Response'' THEN 4 WHEN ''Feedback Logged'' THEN 5 WHEN ''Demo Scheduled'' THEN 6 ELSE 7 END',
        threshold
    );
    
    PERFORM ok(
        analysis_result.within_threshold,
        format('Complex analytics query (CTE + multiple joins) should complete under %s (time: %s)', 
            threshold, analysis_result.execution_time)
    );
END$$;

-- Test 19: Principal performance dashboard query
DO $$
DECLARE
    analysis_result RECORD;
    threshold INTERVAL := '600 milliseconds';
BEGIN
    SELECT * INTO analysis_result
    FROM test_schema.analyze_join_performance(
        'SELECT principal.name as principal_name, COUNT(DISTINCT o.id) as total_opportunities, COUNT(DISTINCT CASE WHEN o.is_won THEN o.id END) as won_opportunities, COUNT(DISTINCT o.organization_id) as unique_customers, COUNT(DISTINCT i.id) as total_interactions, AVG(o.probability_percent) as avg_probability, MAX(GREATEST(o.updated_at, COALESCE(i.interaction_date, ''1900-01-01''::date))) as last_activity FROM public.organizations principal LEFT JOIN public.opportunities o ON principal.id = o.principal_id LEFT JOIN public.interactions i ON o.id = i.opportunity_id WHERE principal.is_principal = TRUE GROUP BY principal.id, principal.name HAVING COUNT(o.id) > 0 ORDER BY total_opportunities DESC LIMIT 10',
        threshold
    );
    
    PERFORM ok(
        analysis_result.within_threshold,
        format('Principal performance dashboard should complete under %s (time: %s, cost: %s)', 
            threshold, analysis_result.execution_time, analysis_result.cost_estimate)
    );
END$$;

-- Test 20: Overall join performance assessment
DO $$
DECLARE
    join_performance_summary RECORD;
    avg_performance_score NUMERIC;
    performance_tests TEXT[] := ARRAY[
        'SELECT COUNT(*) FROM public.opportunities o JOIN public.organizations org ON o.organization_id = org.id',
        'SELECT COUNT(*) FROM public.interactions i JOIN public.opportunities o ON i.opportunity_id = o.id',
        'SELECT COUNT(*) FROM public.opportunities o JOIN public.products p ON o.product_id = p.id'
    ];
    test_query TEXT;
    individual_score INTEGER;
    total_score INTEGER := 0;
    test_count INTEGER := 0;
BEGIN
    -- Test multiple join patterns and calculate average performance score
    FOREACH test_query IN ARRAY performance_tests LOOP
        SELECT performance_score INTO individual_score
        FROM test_schema.analyze_join_performance(test_query, '200 milliseconds');
        
        total_score := total_score + individual_score;
        test_count := test_count + 1;
    END LOOP;
    
    avg_performance_score := total_score::NUMERIC / test_count::NUMERIC;
    
    PERFORM ok(
        avg_performance_score >= 75,
        format('Overall join performance should be good (average score: %s/100 across %s core join patterns)', 
            ROUND(avg_performance_score, 1), test_count)
    );
END$$;

-- =============================================================================
-- JOIN PERFORMANCE SUMMARY AND RECOMMENDATIONS
-- =============================================================================

-- Generate comprehensive join performance analysis summary
DO $$
DECLARE
    total_contacts INTEGER;
    total_organizations INTEGER;
    total_opportunities INTEGER;
    total_products INTEGER;
    total_interactions INTEGER;
    join_recommendations TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Get dataset statistics
    SELECT COUNT(*) INTO total_contacts 
    FROM test_schema.test_data_registry 
    WHERE test_name = 'test_join_performance' AND entity_type = 'contact';
    
    SELECT COUNT(*) INTO total_organizations 
    FROM test_schema.test_data_registry 
    WHERE test_name = 'test_join_performance' AND entity_type = 'organization';
    
    SELECT COUNT(*) INTO total_opportunities 
    FROM test_schema.test_data_registry 
    WHERE test_name = 'test_join_performance' AND entity_type = 'opportunity';
    
    SELECT COUNT(*) INTO total_products 
    FROM test_schema.test_data_registry 
    WHERE test_name = 'test_join_performance' AND entity_type = 'product';
    
    SELECT COUNT(*) INTO total_interactions 
    FROM test_schema.test_data_registry 
    WHERE test_name = 'test_join_performance' AND entity_type = 'interaction';
    
    -- Generate optimization recommendations
    join_recommendations := array_append(join_recommendations, 'Ensure foreign key indexes exist on all join columns for optimal performance');
    join_recommendations := array_append(join_recommendations, 'Monitor join selectivity ratios and optimize queries with poor selectivity');
    join_recommendations := array_append(join_recommendations, 'Use hash joins for large dataset operations and nested loops for small selective joins');
    join_recommendations := array_append(join_recommendations, 'Implement query result caching for frequently executed multi-table analytics');
    join_recommendations := array_append(join_recommendations, 'Consider materialized views for complex aggregation queries spanning multiple tables');
    join_recommendations := array_append(join_recommendations, 'Use EXISTS instead of DISTINCT when checking for relationship existence');
    join_recommendations := array_append(join_recommendations, 'Optimize WHERE clause placement to filter early in the execution plan');
    join_recommendations := array_append(join_recommendations, 'Monitor memory usage for hash joins with large datasets');
    
    RAISE NOTICE '';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'JOIN PERFORMANCE AND MULTI-TABLE OPTIMIZATION ANALYSIS SUMMARY';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Join Performance Test Dataset Statistics:';
    RAISE NOTICE '  Contacts: % records', total_contacts;
    RAISE NOTICE '  Organizations: % records (% principals)', 
        total_organizations,
        (SELECT COUNT(*) FROM public.organizations WHERE name LIKE 'JoinTest Org%' AND is_principal = TRUE);
    RAISE NOTICE '  Products: % records', total_products;
    RAISE NOTICE '  Opportunities: % records', total_opportunities;
    RAISE NOTICE '  Interactions: % records', total_interactions;
    RAISE NOTICE '';
    
    RAISE NOTICE 'Join Performance Thresholds Tested:';
    RAISE NOTICE '  Two-table joins: <200-300ms target';
    RAISE NOTICE '  Three-table joins: <350-500ms target';
    RAISE NOTICE '  Four-table joins: <600-700ms target';
    RAISE NOTICE '  Complex analytics: <800ms target';
    RAISE NOTICE '';
    
    RAISE NOTICE 'Join Test Categories Completed:';
    RAISE NOTICE '  ✓ Two-Table Join Performance (Tests 1-4)';
    RAISE NOTICE '  ✓ Three-Table Join Performance (Tests 5-7)';
    RAISE NOTICE '  ✓ Four-Table Complex Joins (Tests 8-9)';
    RAISE NOTICE '  ✓ Join Selectivity Analysis (Tests 10-11)';
    RAISE NOTICE '  ✓ LEFT JOIN Performance (Tests 12-13)';
    RAISE NOTICE '  ✓ Subquery vs JOIN Comparison (Tests 14-15)';
    RAISE NOTICE '  ✓ Window Functions with Joins (Test 16)';
    RAISE NOTICE '  ✓ UNION Query Performance (Test 17)';
    RAISE NOTICE '  ✓ Complex Analytics Joins (Tests 18-19)';
    RAISE NOTICE '  ✓ Overall Performance Assessment (Test 20)';
    RAISE NOTICE '';
    
    RAISE NOTICE 'Join Performance Optimization Recommendations:';
    FOR i IN 1..array_length(join_recommendations, 1) LOOP
        RAISE NOTICE '  %s. %', i, join_recommendations[i];
    END LOOP;
    RAISE NOTICE '';
    
    RAISE NOTICE 'Key Join Performance Insights:';
    RAISE NOTICE '  → Hash joins are generally preferred for large datasets';
    RAISE NOTICE '  → Nested loop joins work well for highly selective queries';
    RAISE NOTICE '  → Join selectivity >80%% indicates good query optimization';
    RAISE NOTICE '  → Four-table joins should be carefully monitored in production';
    RAISE NOTICE '  → LEFT JOINs with aggregation require special attention';
    RAISE NOTICE '  → Complex CTE queries benefit from result caching';
    RAISE NOTICE '';
    
    RAISE NOTICE 'Next Steps for Join Optimization:';
    RAISE NOTICE '  → Implement pg_stat_statements monitoring for join analysis';
    RAISE NOTICE '  → Set up automated join performance regression testing';
    RAISE NOTICE '  → Monitor production join selectivity and optimization opportunities';
    RAISE NOTICE '  → Consider read replicas for analytics-heavy join workloads';
    RAISE NOTICE '  → Implement connection pooling for concurrent join operations';
    RAISE NOTICE '';
    RAISE NOTICE '=============================================================================';
END$$;

-- =============================================================================
-- CLEANUP AND COMPLETION
-- =============================================================================

-- Clean up join performance test data
PERFORM test_schema.cleanup_test_data('test_join_performance');

-- Rollback test transaction
SELECT test_schema.rollback_test();

-- Finish test plan
SELECT finish();

-- Log completion
SELECT test_schema.test_notify('Completed test: join performance and multi-table optimization');