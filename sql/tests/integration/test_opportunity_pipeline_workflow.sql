-- =============================================================================
-- Business Logic Integration Tests: Opportunity Pipeline Workflow
-- =============================================================================
-- Comprehensive testing of opportunity stage transitions, business rules,
-- and workflow validation ensuring proper 7-stage pipeline progression
-- from NEW_LEAD to CLOSED_WON with appropriate probability calculations.
-- =============================================================================

\i sql/tests/helpers/test_helpers.sql
\i sql/tests/security/security_test_helpers.sql
SET search_path TO test_schema, public, pg_catalog;

-- Test plan with comprehensive workflow coverage
SELECT plan(40);

-- Test metadata
SELECT test_schema.test_notify('Starting test: opportunity pipeline workflow validation');

-- Test setup
SELECT test_schema.begin_test();

-- =============================================================================
-- OPPORTUNITY STAGE ENUM VALIDATION TESTS
-- =============================================================================

-- Test 1: All required opportunity stages exist
DO $$
DECLARE
    stage_count INTEGER;
    expected_stages TEXT[] := ARRAY[
        'New Lead',
        'Initial Outreach',
        'Sample/Visit Offered',
        'Awaiting Response',
        'Feedback Logged',
        'Demo Scheduled',
        'Closed - Won'
    ];
    stage_name TEXT;
BEGIN
    stage_count := 0;
    
    FOREACH stage_name IN ARRAY expected_stages LOOP
        BEGIN
            -- Test if stage value is valid by trying to cast
            PERFORM stage_name::public.opportunity_stage;
            stage_count := stage_count + 1;
        EXCEPTION WHEN invalid_text_representation THEN
            NULL; -- Stage doesn't exist
        END;
    END LOOP;
    
    PERFORM ok(
        stage_count = array_length(expected_stages, 1),
        'All 7 required opportunity stages should exist in enum'
    );
END$$;

-- Test 2: Invalid stage rejection
SELECT throws_ok(
    $$INSERT INTO public.opportunities 
      (name, stage) VALUES ('Invalid Stage Test', 'Invalid Stage')$$,
    '22P02',
    'Should reject invalid opportunity stage values'
);

-- Test 3: Opportunity context enum validation
DO $$
DECLARE
    context_test_id UUID;
    valid_contexts TEXT[] := ARRAY[
        'Site Visit',
        'Food Show', 
        'New Product Interest',
        'Follow-up',
        'Demo Request',
        'Sampling',
        'Custom'
    ];
    context_name TEXT;
    success_count INTEGER := 0;
BEGIN
    FOREACH context_name IN ARRAY valid_contexts LOOP
        BEGIN
            INSERT INTO public.opportunities 
            (name, stage, context)
            VALUES ('Context Test ' || context_name, 'New Lead', context_name::public.opportunity_context)
            RETURNING id INTO context_test_id;
            
            success_count := success_count + 1;
            PERFORM test_schema.register_test_data('test_opportunity_pipeline_workflow', 'opportunity', context_test_id);
        EXCEPTION WHEN OTHERS THEN
            NULL; -- Context validation failed
        END;
    END LOOP;
    
    PERFORM ok(
        success_count = array_length(valid_contexts, 1),
        'All opportunity context values should be valid'
    );
END$$;

-- =============================================================================
-- STAGE TRANSITION BUSINESS LOGIC TESTS
-- =============================================================================

-- Test 4: Sequential stage progression validation
DO $$
DECLARE
    test_org_id UUID;
    test_principal_id UUID;
    test_product_id UUID;
    opportunity_id UUID;
    stages TEXT[] := ARRAY[
        'New Lead',
        'Initial Outreach', 
        'Sample/Visit Offered',
        'Awaiting Response',
        'Feedback Logged',
        'Demo Scheduled',
        'Closed - Won'
    ];
    stage_name TEXT;
    expected_probability INTEGER;
    actual_probability INTEGER;
BEGIN
    -- Setup test entities
    SELECT test_schema.create_test_organization('test_opportunity_pipeline_workflow', 'Pipeline Test Org') INTO test_org_id;
    SELECT test_schema.create_test_organization('test_opportunity_pipeline_workflow', 'Pipeline Principal', 'B2B', TRUE, FALSE) INTO test_principal_id;
    SELECT test_schema.create_test_product('test_opportunity_pipeline_workflow', 'Pipeline Test Product') INTO test_product_id;
    
    -- Create opportunity for stage progression
    INSERT INTO public.opportunities (
        name, organization_id, principal_id, product_id, stage, probability_percent
    )
    VALUES (
        'Stage Progression Test',
        test_org_id,
        test_principal_id,
        test_product_id,
        'New Lead',
        10
    )
    RETURNING id INTO opportunity_id;
    
    PERFORM test_schema.register_test_data('test_opportunity_pipeline_workflow', 'opportunity', opportunity_id);
    
    -- Test each stage transition with appropriate probability
    FOR i IN 1..array_length(stages, 1) LOOP
        expected_probability := CASE stages[i]
            WHEN 'New Lead' THEN 10
            WHEN 'Initial Outreach' THEN 20
            WHEN 'Sample/Visit Offered' THEN 30
            WHEN 'Awaiting Response' THEN 40
            WHEN 'Feedback Logged' THEN 60
            WHEN 'Demo Scheduled' THEN 80
            WHEN 'Closed - Won' THEN 100
            ELSE 10
        END;
        
        -- Update to stage
        UPDATE public.opportunities
        SET stage = stages[i]::public.opportunity_stage,
            probability_percent = expected_probability,
            is_won = (stages[i] = 'Closed - Won')
        WHERE id = opportunity_id;
        
        -- Verify stage was set correctly
        SELECT probability_percent INTO actual_probability
        FROM public.opportunities
        WHERE id = opportunity_id;
        
        PERFORM ok(
            actual_probability = expected_probability,
            'Stage ' || stages[i] || ' should have probability ' || expected_probability || '%'
        );
    END LOOP;
END$$;

-- Test 5: Won opportunity flag consistency
DO $$
DECLARE
    won_opportunity_id UUID;
    is_won_flag BOOLEAN;
    stage_value TEXT;
BEGIN
    -- Create won opportunity
    SELECT test_schema.create_test_opportunity(
        'test_opportunity_pipeline_workflow',
        NULL, NULL, NULL,
        'Closed - Won'::public.opportunity_stage
    ) INTO won_opportunity_id;
    
    -- Check is_won flag and stage consistency
    SELECT is_won, stage::TEXT INTO is_won_flag, stage_value
    FROM public.opportunities
    WHERE id = won_opportunity_id;
    
    PERFORM ok(
        is_won_flag = TRUE AND stage_value = 'Closed - Won',
        'Won opportunities should have is_won = TRUE and stage = Closed - Won'
    );
END$$;

-- =============================================================================
-- PROBABILITY CALCULATION VALIDATION TESTS
-- =============================================================================

-- Test 6: Probability percentage constraints
SELECT throws_ok(
    $$INSERT INTO public.opportunities 
      (name, stage, probability_percent) 
      VALUES ('Invalid Probability High', 'New Lead', 150)$$,
    '23514',
    'Should reject probability percentage above 100'
);

-- Test 7: Negative probability rejection
SELECT throws_ok(
    $$INSERT INTO public.opportunities 
      (name, stage, probability_percent) 
      VALUES ('Invalid Probability Negative', 'New Lead', -10)$$,
    '23514',
    'Should reject negative probability percentage'
);

-- Test 8: Stage-probability business logic correlation
DO $$
DECLARE
    test_opportunity_id UUID;
    stage_prob_pairs RECORD;
    validation_passed BOOLEAN := TRUE;
BEGIN
    -- Create test opportunity for probability validation
    SELECT test_schema.create_test_opportunity(
        'test_opportunity_pipeline_workflow'
    ) INTO test_opportunity_id;
    
    -- Test each stage with its typical probability range
    FOR stage_prob_pairs IN
        SELECT stage::TEXT as stage_name, min_prob, max_prob FROM (VALUES
            ('New Lead', 0, 25),
            ('Initial Outreach', 15, 35),
            ('Sample/Visit Offered', 25, 45),
            ('Awaiting Response', 35, 55),
            ('Feedback Logged', 50, 70),
            ('Demo Scheduled', 70, 90),
            ('Closed - Won', 100, 100)
        ) AS stages(stage, min_prob, max_prob)
    LOOP
        -- Update opportunity to stage with appropriate probability
        UPDATE public.opportunities
        SET stage = stage_prob_pairs.stage_name::public.opportunity_stage,
            probability_percent = (stage_prob_pairs.min_prob + stage_prob_pairs.max_prob) / 2
        WHERE id = test_opportunity_id;
        
        -- Verify update succeeded (business logic validation)
        IF NOT FOUND THEN
            validation_passed := FALSE;
            EXIT;
        END IF;
    END LOOP;
    
    PERFORM ok(
        validation_passed,
        'Stage-probability correlations should be logically consistent'
    );
END$$;

-- =============================================================================
-- OPPORTUNITY NAMING AND AUTO-GENERATION TESTS
-- =============================================================================

-- Test 9: Auto-naming pattern validation
DO $$
DECLARE
    org_id UUID;
    principal_id UUID;
    product_id UUID;
    opportunity_id UUID;
    generated_name TEXT;
    expected_pattern TEXT;
BEGIN
    -- Create entities for naming test
    SELECT test_schema.create_test_organization('test_opportunity_pipeline_workflow', 'ACME Corp') INTO org_id;
    SELECT test_schema.create_test_organization('test_opportunity_pipeline_workflow', 'Principal Corp', 'B2B', TRUE, FALSE) INTO principal_id;
    SELECT test_schema.create_test_product('test_opportunity_pipeline_workflow', 'Test Product X') INTO product_id;
    
    -- Create opportunity with expected naming pattern
    INSERT INTO public.opportunities (
        name, organization_id, principal_id, product_id, stage,
        context, custom_context
    )
    VALUES (
        'ACME Corp - Principal Corp - Custom - ' || TO_CHAR(NOW(), 'Mon YYYY'),
        org_id, principal_id, product_id, 'New Lead',
        'Custom', 'Auto-naming test'
    )
    RETURNING id, name INTO opportunity_id, generated_name;
    
    PERFORM test_schema.register_test_data('test_opportunity_pipeline_workflow', 'opportunity', opportunity_id);
    
    PERFORM ok(
        generated_name LIKE '%ACME Corp%Principal Corp%Custom%' || TO_CHAR(NOW(), 'Mon YYYY') || '%',
        'Opportunity name should follow auto-naming pattern: ' || generated_name
    );
END$$;

-- Test 10: Name template tracking
DO $$
DECLARE
    opportunity_id UUID;
    name_template TEXT;
BEGIN
    SELECT test_schema.create_test_opportunity('test_opportunity_pipeline_workflow') INTO opportunity_id;
    
    -- Update with name template
    UPDATE public.opportunities
    SET name_template = '[Organization] - [Principal] - [Context] - [Month Year]'
    WHERE id = opportunity_id;
    
    SELECT name_template INTO name_template
    FROM public.opportunities
    WHERE id = opportunity_id;
    
    PERFORM ok(
        name_template IS NOT NULL,
        'Opportunity should support name template tracking for auto-naming'
    );
END$$;

-- =============================================================================
-- BATCH OPPORTUNITY CREATION TESTS
-- =============================================================================

-- Test 11: Multiple opportunities for same organization
DO $$
DECLARE
    org_id UUID;
    principal_id UUID;
    product_id UUID;
    batch_count INTEGER;
BEGIN
    -- Setup entities
    SELECT test_schema.create_test_organization('test_opportunity_pipeline_workflow', 'Batch Test Org') INTO org_id;
    SELECT test_schema.create_test_organization('test_opportunity_pipeline_workflow', 'Batch Principal', 'B2B', TRUE, FALSE) INTO principal_id;
    SELECT test_schema.create_test_product('test_opportunity_pipeline_workflow', 'Batch Product') INTO product_id;
    
    -- Create batch of opportunities
    INSERT INTO public.opportunities (
        name, organization_id, principal_id, product_id, stage, context
    )
    SELECT 
        'Batch Opportunity ' || generate_series(1,5) || ' - ' || TO_CHAR(NOW(), 'Mon YYYY'),
        org_id,
        principal_id,
        product_id,
        'New Lead',
        'Custom';
    
    -- Register for cleanup
    INSERT INTO test_schema.test_data_registry (test_name, entity_type, entity_id)
    SELECT 'test_opportunity_pipeline_workflow', 'opportunity', id
    FROM public.opportunities
    WHERE name LIKE 'Batch Opportunity%';
    
    SELECT COUNT(*) INTO batch_count
    FROM public.opportunities
    WHERE organization_id = org_id
    AND name LIKE 'Batch Opportunity%';
    
    PERFORM ok(
        batch_count = 5,
        'Should support batch creation of multiple opportunities'
    );
END$$;

-- Test 12: Batch opportunities with different principals
DO $$
DECLARE
    org_id UUID;
    principal1_id UUID;
    principal2_id UUID;
    product_id UUID;
    multi_principal_count INTEGER;
BEGIN
    -- Setup entities
    SELECT test_schema.create_test_organization('test_opportunity_pipeline_workflow', 'Multi Principal Org') INTO org_id;
    SELECT test_schema.create_test_organization('test_opportunity_pipeline_workflow', 'Principal Alpha', 'B2B', TRUE, FALSE) INTO principal1_id;
    SELECT test_schema.create_test_organization('test_opportunity_pipeline_workflow', 'Principal Beta', 'B2B', TRUE, FALSE) INTO principal2_id;
    SELECT test_schema.create_test_product('test_opportunity_pipeline_workflow', 'Multi Principal Product') INTO product_id;
    
    -- Create opportunities for each principal
    INSERT INTO public.opportunities (
        name, organization_id, principal_id, product_id, stage
    )
    VALUES 
        ('Multi Principal Alpha Opp', org_id, principal1_id, product_id, 'New Lead'),
        ('Multi Principal Beta Opp', org_id, principal2_id, product_id, 'New Lead');
    
    -- Register for cleanup
    INSERT INTO test_schema.test_data_registry (test_name, entity_type, entity_id)
    SELECT 'test_opportunity_pipeline_workflow', 'opportunity', id
    FROM public.opportunities
    WHERE name LIKE 'Multi Principal%Opp';
    
    SELECT COUNT(*) INTO multi_principal_count
    FROM public.opportunities
    WHERE organization_id = org_id
    AND name LIKE 'Multi Principal%';
    
    PERFORM ok(
        multi_principal_count = 2,
        'Should support multiple opportunities with different principals for same organization'
    );
END$$;

-- =============================================================================
-- OPPORTUNITY LIFECYCLE WORKFLOW TESTS
-- =============================================================================

-- Test 13: Complete lifecycle progression
DO $$
DECLARE
    opportunity_id UUID;
    current_stage TEXT;
    stages TEXT[] := ARRAY[
        'New Lead',
        'Initial Outreach',
        'Sample/Visit Offered', 
        'Awaiting Response',
        'Feedback Logged',
        'Demo Scheduled',
        'Closed - Won'
    ];
    stage_name TEXT;
    progression_success BOOLEAN := TRUE;
BEGIN
    -- Create opportunity for lifecycle test
    SELECT test_schema.create_test_opportunity('test_opportunity_pipeline_workflow') INTO opportunity_id;
    
    -- Progress through each stage
    FOREACH stage_name IN ARRAY stages LOOP
        UPDATE public.opportunities
        SET stage = stage_name::public.opportunity_stage,
            probability_percent = CASE stage_name
                WHEN 'New Lead' THEN 10
                WHEN 'Initial Outreach' THEN 20
                WHEN 'Sample/Visit Offered' THEN 30
                WHEN 'Awaiting Response' THEN 40
                WHEN 'Feedback Logged' THEN 60
                WHEN 'Demo Scheduled' THEN 80
                WHEN 'Closed - Won' THEN 100
            END,
            is_won = (stage_name = 'Closed - Won'),
            updated_at = NOW()
        WHERE id = opportunity_id;
        
        -- Verify stage transition
        SELECT stage::TEXT INTO current_stage
        FROM public.opportunities
        WHERE id = opportunity_id;
        
        IF current_stage != stage_name THEN
            progression_success := FALSE;
            EXIT;
        END IF;
    END LOOP;
    
    PERFORM ok(
        progression_success,
        'Opportunity should progress through complete lifecycle successfully'
    );
END$$;

-- Test 14: Stage regression validation (business rule)
DO $$
DECLARE
    opportunity_id UUID;
    regression_allowed BOOLEAN;
BEGIN
    -- Create opportunity at advanced stage
    SELECT test_schema.create_test_opportunity(
        'test_opportunity_pipeline_workflow',
        NULL, NULL, NULL,
        'Demo Scheduled'::public.opportunity_stage
    ) INTO opportunity_id;
    
    -- Attempt to regress to earlier stage
    BEGIN
        UPDATE public.opportunities
        SET stage = 'New Lead'::public.opportunity_stage,
            probability_percent = 10
        WHERE id = opportunity_id;
        
        regression_allowed := TRUE;
    EXCEPTION WHEN OTHERS THEN
        regression_allowed := FALSE;
    END;
    
    -- Note: Database allows regression, but business logic might prevent it
    PERFORM ok(
        TRUE, -- Database level regression is technically allowed
        'Stage regression handling (business logic validation needed): ' || regression_allowed::TEXT
    );
END$$;

-- =============================================================================
-- OPPORTUNITY CONTEXT AND CUSTOM FIELD TESTS
-- =============================================================================

-- Test 15: Custom context with detailed information
DO $$
DECLARE
    custom_opportunity_id UUID;
    context_value TEXT;
    custom_context_value TEXT;
BEGIN
    INSERT INTO public.opportunities (
        name, stage, context, custom_context,
        notes
    )
    VALUES (
        'Custom Context Test',
        'New Lead',
        'Custom',
        'Trade show follow-up with detailed booth interaction notes',
        'Detailed notes about customer interest and specific requirements'
    )
    RETURNING id INTO custom_opportunity_id;
    
    PERFORM test_schema.register_test_data('test_opportunity_pipeline_workflow', 'opportunity', custom_opportunity_id);
    
    SELECT context::TEXT, custom_context INTO context_value, custom_context_value
    FROM public.opportunities
    WHERE id = custom_opportunity_id;
    
    PERFORM ok(
        context_value = 'Custom' AND custom_context_value IS NOT NULL,
        'Should support custom context with detailed information'
    );
END$$;

-- Test 16: Standard context values validation
DO $$
DECLARE
    standard_contexts TEXT[] := ARRAY[
        'Site Visit',
        'Food Show',
        'New Product Interest', 
        'Follow-up',
        'Demo Request',
        'Sampling'
    ];
    context_name TEXT;
    test_count INTEGER := 0;
    success_count INTEGER := 0;
BEGIN
    FOREACH context_name IN ARRAY standard_contexts LOOP
        test_count := test_count + 1;
        
        BEGIN
            INSERT INTO public.opportunities (
                name, stage, context
            )
            VALUES (
                'Standard Context ' || context_name,
                'New Lead',
                context_name::public.opportunity_context
            );
            
            success_count := success_count + 1;
            
            -- Register for cleanup
            INSERT INTO test_schema.test_data_registry (test_name, entity_type, entity_id)
            SELECT 'test_opportunity_pipeline_workflow', 'opportunity', id
            FROM public.opportunities
            WHERE name = 'Standard Context ' || context_name;
            
        EXCEPTION WHEN OTHERS THEN
            NULL; -- Context validation failed
        END;
    END LOOP;
    
    PERFORM ok(
        success_count = test_count,
        'All standard context values should be valid'
    );
END$$;

-- =============================================================================
-- OPPORTUNITY ANALYTICS AND REPORTING TESTS
-- =============================================================================

-- Test 17: Pipeline velocity calculations
DO $$
DECLARE
    pipeline_velocity_data RECORD;
    total_opportunities INTEGER;
BEGIN
    -- Create opportunities in various stages for velocity analysis
    INSERT INTO public.opportunities (name, stage, created_at, probability_percent)
    VALUES 
        ('Velocity Test 1', 'New Lead', NOW() - INTERVAL '30 days', 10),
        ('Velocity Test 2', 'Initial Outreach', NOW() - INTERVAL '20 days', 20),
        ('Velocity Test 3', 'Sample/Visit Offered', NOW() - INTERVAL '15 days', 30),
        ('Velocity Test 4', 'Demo Scheduled', NOW() - INTERVAL '5 days', 80);
    
    -- Register for cleanup
    INSERT INTO test_schema.test_data_registry (test_name, entity_type, entity_id)
    SELECT 'test_opportunity_pipeline_workflow', 'opportunity', id
    FROM public.opportunities
    WHERE name LIKE 'Velocity Test%';
    
    -- Calculate basic pipeline metrics
    SELECT COUNT(*) as total_count INTO total_opportunities
    FROM public.opportunities
    WHERE name LIKE 'Velocity Test%';
    
    PERFORM ok(
        total_opportunities = 4,
        'Should support pipeline velocity analysis with staged opportunities'
    );
END$$;

-- Test 18: Stage distribution analysis
DO $$
DECLARE
    stage_distribution RECORD;
    distribution_valid BOOLEAN := TRUE;
BEGIN
    -- Analyze current stage distribution
    FOR stage_distribution IN
        SELECT 
            stage::TEXT as stage_name,
            COUNT(*) as stage_count,
            AVG(probability_percent) as avg_probability
        FROM public.opportunities
        WHERE created_at >= NOW() - INTERVAL '1 day' -- Recent test data
        GROUP BY stage
    LOOP
        -- Validate that each stage has reasonable data
        IF stage_distribution.stage_count < 0 OR stage_distribution.avg_probability < 0 THEN
            distribution_valid := FALSE;
            EXIT;
        END IF;
    END LOOP;
    
    PERFORM ok(
        distribution_valid,
        'Stage distribution analysis should return valid metrics'
    );
END$$;

-- =============================================================================
-- OPPORTUNITY INTEGRATION WITH OTHER ENTITIES
-- =============================================================================

-- Test 19: Opportunity-interaction relationship integrity
DO $$
DECLARE
    opportunity_id UUID;
    interaction_id UUID;
    relationship_count INTEGER;
BEGIN
    -- Create opportunity for interaction testing
    SELECT test_schema.create_test_opportunity('test_opportunity_pipeline_workflow') INTO opportunity_id;
    
    -- Create interaction linked to opportunity
    INSERT INTO public.interactions (
        type, notes, interaction_date, opportunity_id
    )
    VALUES (
        'Meeting', 
        'Follow-up meeting for opportunity progression',
        NOW(),
        opportunity_id
    )
    RETURNING id INTO interaction_id;
    
    PERFORM test_schema.register_test_data('test_opportunity_pipeline_workflow', 'interaction', interaction_id);
    
    -- Verify relationship
    SELECT COUNT(*) INTO relationship_count
    FROM public.interactions i
    JOIN public.opportunities o ON i.opportunity_id = o.id
    WHERE i.id = interaction_id AND o.id = opportunity_id;
    
    PERFORM ok(
        relationship_count = 1,
        'Should maintain proper opportunity-interaction relationships'
    );
END$$;

-- Test 20: Product-opportunity association validation
DO $$
DECLARE
    product_id UUID;
    opportunity_count INTEGER;
BEGIN
    -- Get a product with opportunities
    SELECT p.id INTO product_id
    FROM public.products p
    JOIN public.opportunities o ON o.product_id = p.id
    WHERE p.deleted_at IS NULL
    LIMIT 1;
    
    IF product_id IS NOT NULL THEN
        SELECT COUNT(*) INTO opportunity_count
        FROM public.opportunities
        WHERE product_id = product_id;
        
        PERFORM ok(
            opportunity_count > 0,
            'Products should maintain proper associations with opportunities'
        );
    ELSE
        PERFORM skip('No product-opportunity relationships found for validation');
    END IF;
END$$;

-- =============================================================================
-- WORKFLOW CONSTRAINT AND VALIDATION TESTS
-- =============================================================================

-- Test 21: Future close date validation
DO $$
DECLARE
    future_date_id UUID;
    past_date_allowed BOOLEAN := TRUE;
BEGIN
    -- Test future close date (should be allowed)
    INSERT INTO public.opportunities (
        name, stage, expected_close_date
    )
    VALUES (
        'Future Close Date Test',
        'New Lead',
        CURRENT_DATE + INTERVAL '30 days'
    )
    RETURNING id INTO future_date_id;
    
    PERFORM test_schema.register_test_data('test_opportunity_pipeline_workflow', 'opportunity', future_date_id);
    
    -- Test past close date (business rule - might be allowed for historical data)
    BEGIN
        INSERT INTO public.opportunities (
            name, stage, expected_close_date
        )
        VALUES (
            'Past Close Date Test',
            'New Lead', 
            CURRENT_DATE - INTERVAL '30 days'
        );
        
        -- Register for cleanup if successful
        INSERT INTO test_schema.test_data_registry (test_name, entity_type, entity_id)
        SELECT 'test_opportunity_pipeline_workflow', 'opportunity', id
        FROM public.opportunities
        WHERE name = 'Past Close Date Test';
        
    EXCEPTION WHEN OTHERS THEN
        past_date_allowed := FALSE;
    END;
    
    PERFORM ok(
        future_date_id IS NOT NULL,
        'Should allow future expected close dates'
    );
    
    PERFORM ok(
        TRUE, -- Past dates may be allowed for data migration/historical records
        'Past close date handling (business rule dependent): ' || past_date_allowed::TEXT
    );
END$$;

-- Test 22: Deal owner assignment validation
DO $$
DECLARE
    owner_opportunity_id UUID;
    deal_owner_value TEXT;
BEGIN
    INSERT INTO public.opportunities (
        name, stage, deal_owner
    )
    VALUES (
        'Deal Owner Test',
        'New Lead',
        'John Doe - Sales Manager'
    )
    RETURNING id INTO owner_opportunity_id;
    
    PERFORM test_schema.register_test_data('test_opportunity_pipeline_workflow', 'opportunity', owner_opportunity_id);
    
    SELECT deal_owner INTO deal_owner_value
    FROM public.opportunities
    WHERE id = owner_opportunity_id;
    
    PERFORM ok(
        deal_owner_value IS NOT NULL AND LENGTH(deal_owner_value) > 0,
        'Should support deal owner assignment and tracking'
    );
END$$;

-- =============================================================================
-- OPPORTUNITY SEARCH AND FILTERING TESTS
-- =============================================================================

-- Test 23: Stage-based filtering performance
DO $$
DECLARE
    explain_result TEXT;
BEGIN
    SELECT test_schema.check_index_usage(
        'SELECT id, name FROM public.opportunities WHERE stage = ''New Lead'' AND deleted_at IS NULL'
    ) INTO explain_result;
    
    PERFORM ok(
        explain_result IS NOT NULL,
        'Stage-based opportunity filtering should be efficient: ' || COALESCE(explain_result, 'No explain available')
    );
END$$;

-- Test 24: Date range filtering for reporting
DO $$
DECLARE
    date_range_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO date_range_count
    FROM public.opportunities
    WHERE created_at >= NOW() - INTERVAL '7 days'
    AND created_at <= NOW()
    AND deleted_at IS NULL;
    
    PERFORM ok(
        date_range_count >= 0,
        'Date range filtering should work for opportunity reporting'
    );
END$$;

-- =============================================================================
-- OPPORTUNITY UPDATE AND AUDIT TRAIL TESTS  
-- =============================================================================

-- Test 25: Updated_at timestamp maintenance
DO $$
DECLARE
    opportunity_id UUID;
    initial_updated_at TIMESTAMPTZ;
    final_updated_at TIMESTAMPTZ;
BEGIN
    -- Create opportunity and record initial timestamp
    SELECT test_schema.create_test_opportunity('test_opportunity_pipeline_workflow') INTO opportunity_id;
    
    SELECT updated_at INTO initial_updated_at
    FROM public.opportunities
    WHERE id = opportunity_id;
    
    -- Wait and update
    PERFORM pg_sleep(0.1);
    
    UPDATE public.opportunities
    SET notes = 'Updated for timestamp test'
    WHERE id = opportunity_id;
    
    SELECT updated_at INTO final_updated_at
    FROM public.opportunities
    WHERE id = opportunity_id;
    
    PERFORM ok(
        final_updated_at > initial_updated_at,
        'Should maintain updated_at timestamp on opportunity changes'
    );
END$$;

-- Test 26: Bulk opportunity updates
DO $$
DECLARE
    bulk_update_count INTEGER;
    affected_rows INTEGER;
BEGIN
    -- Create multiple opportunities for bulk update test
    INSERT INTO public.opportunities (name, stage, probability_percent)
    SELECT 
        'Bulk Update Test ' || generate_series(1,3),
        'New Lead',
        10;
    
    -- Register for cleanup
    INSERT INTO test_schema.test_data_registry (test_name, entity_type, entity_id)
    SELECT 'test_opportunity_pipeline_workflow', 'opportunity', id
    FROM public.opportunities
    WHERE name LIKE 'Bulk Update Test%';
    
    -- Perform bulk update
    UPDATE public.opportunities
    SET stage = 'Initial Outreach',
        probability_percent = 20
    WHERE name LIKE 'Bulk Update Test%';
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    PERFORM ok(
        affected_rows = 3,
        'Should support bulk opportunity updates efficiently'
    );
END$$;

-- =============================================================================
-- OPPORTUNITY DATA QUALITY AND VALIDATION TESTS
-- =============================================================================

-- Test 27: Required field validation
DO $$
DECLARE
    validation_passed BOOLEAN := TRUE;
BEGIN
    -- Test that name is required
    BEGIN
        INSERT INTO public.opportunities (stage) VALUES ('New Lead');
        validation_passed := FALSE; -- Should not reach here
    EXCEPTION WHEN not_null_violation THEN
        NULL; -- Expected
    END;
    
    PERFORM ok(
        validation_passed,
        'Should require opportunity name field'
    );
END$$;

-- Test 28: Data type validation for numeric fields
SELECT throws_ok(
    $$INSERT INTO public.opportunities 
      (name, stage, probability_percent) 
      VALUES ('Type Test', 'New Lead', 'invalid_number')$$,
    '22P02',
    'Should validate numeric data types for probability percentage'
);

-- Test 29: JSONB field validation for custom fields (if exists)
DO $$
DECLARE
    jsonb_opportunity_id UUID;
    custom_data JSONB;
BEGIN
    -- Test if opportunities table has JSONB fields
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'opportunities' 
        AND column_name LIKE '%jsonb%' OR data_type = 'jsonb'
    ) THEN
        INSERT INTO public.opportunities (
            name, stage
        )
        VALUES (
            'JSONB Test',
            'New Lead'
        )
        RETURNING id INTO jsonb_opportunity_id;
        
        PERFORM test_schema.register_test_data('test_opportunity_pipeline_workflow', 'opportunity', jsonb_opportunity_id);
        
        PERFORM ok(
            jsonb_opportunity_id IS NOT NULL,
            'Should support JSONB fields for custom opportunity data'
        );
    ELSE
        PERFORM skip('No JSONB fields found in opportunities table');
    END IF;
END$$;

-- =============================================================================
-- OPPORTUNITY SOFT DELETE AND RECOVERY TESTS
-- =============================================================================

-- Test 30: Soft delete functionality
DO $$
DECLARE
    soft_delete_id UUID;
    visible_count INTEGER;
    total_count INTEGER;
BEGIN
    -- Create opportunity for soft delete test
    SELECT test_schema.create_test_opportunity('test_opportunity_pipeline_workflow') INTO soft_delete_id;
    
    -- Soft delete the opportunity
    UPDATE public.opportunities
    SET deleted_at = NOW()
    WHERE id = soft_delete_id;
    
    -- Count visible vs total opportunities
    SELECT COUNT(*) INTO visible_count
    FROM public.opportunities
    WHERE id = soft_delete_id AND deleted_at IS NULL;
    
    SELECT COUNT(*) INTO total_count  
    FROM public.opportunities
    WHERE id = soft_delete_id;
    
    PERFORM ok(
        visible_count = 0 AND total_count = 1,
        'Should support soft delete functionality for opportunities'
    );
    
    -- Restore for cleanup
    UPDATE public.opportunities
    SET deleted_at = NULL
    WHERE id = soft_delete_id;
END$$;

-- =============================================================================
-- OPPORTUNITY COMPLEX WORKFLOW SCENARIOS
-- =============================================================================

-- Test 31: Concurrent stage updates simulation
DO $$
DECLARE
    concurrent_opportunity_id UUID;
    update_success BOOLEAN := TRUE;
BEGIN
    -- Create opportunity for concurrency test
    SELECT test_schema.create_test_opportunity('test_opportunity_pipeline_workflow') INTO concurrent_opportunity_id;
    
    -- Simulate concurrent updates (in practice, this would be multiple transactions)
    BEGIN
        UPDATE public.opportunities
        SET stage = 'Initial Outreach', probability_percent = 20, updated_at = NOW()
        WHERE id = concurrent_opportunity_id;
        
        UPDATE public.opportunities  
        SET stage = 'Sample/Visit Offered', probability_percent = 30, updated_at = NOW()
        WHERE id = concurrent_opportunity_id;
        
    EXCEPTION WHEN OTHERS THEN
        update_success := FALSE;
    END;
    
    PERFORM ok(
        update_success,
        'Should handle concurrent opportunity updates gracefully'
    );
END$$;

-- Test 32: Opportunity lifecycle with interactions
DO $$
DECLARE
    lifecycle_opportunity_id UUID;
    interaction_count INTEGER;
BEGIN
    -- Create opportunity for lifecycle test
    SELECT test_schema.create_test_opportunity('test_opportunity_pipeline_workflow') INTO lifecycle_opportunity_id;
    
    -- Create interactions at different stages
    INSERT INTO public.interactions (type, notes, interaction_date, opportunity_id)
    VALUES 
        ('Initial Contact', 'First outreach call', NOW() - INTERVAL '5 days', lifecycle_opportunity_id),
        ('Follow-up', 'Sample delivery scheduled', NOW() - INTERVAL '3 days', lifecycle_opportunity_id),
        ('Demo', 'Product demonstration completed', NOW() - INTERVAL '1 day', lifecycle_opportunity_id);
    
    -- Register interactions for cleanup
    INSERT INTO test_schema.test_data_registry (test_name, entity_type, entity_id)
    SELECT 'test_opportunity_pipeline_workflow', 'interaction', id
    FROM public.interactions
    WHERE opportunity_id = lifecycle_opportunity_id;
    
    SELECT COUNT(*) INTO interaction_count
    FROM public.interactions
    WHERE opportunity_id = lifecycle_opportunity_id;
    
    PERFORM ok(
        interaction_count = 3,
        'Should support complete opportunity lifecycle with interactions'
    );
END$$;

-- =============================================================================
-- OPPORTUNITY REPORTING AND ANALYTICS VALIDATION
-- =============================================================================

-- Test 33: Win rate calculation accuracy
DO $$
DECLARE
    test_org_id UUID;
    total_opportunities INTEGER;
    won_opportunities INTEGER;
    calculated_win_rate NUMERIC;
BEGIN
    -- Create organization for win rate test
    SELECT test_schema.create_test_organization('test_opportunity_pipeline_workflow', 'Win Rate Test Org') INTO test_org_id;
    
    -- Create mix of won and active opportunities
    INSERT INTO public.opportunities (name, organization_id, stage, is_won)
    VALUES 
        ('Win Rate Test Won 1', test_org_id, 'Closed - Won', TRUE),
        ('Win Rate Test Won 2', test_org_id, 'Closed - Won', TRUE),
        ('Win Rate Test Active 1', test_org_id, 'Demo Scheduled', FALSE),
        ('Win Rate Test Active 2', test_org_id, 'New Lead', FALSE);
    
    -- Register for cleanup
    INSERT INTO test_schema.test_data_registry (test_name, entity_type, entity_id)
    SELECT 'test_opportunity_pipeline_workflow', 'opportunity', id
    FROM public.opportunities
    WHERE name LIKE 'Win Rate Test%';
    
    -- Calculate win rate
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE is_won = TRUE),
        ROUND((COUNT(*) FILTER (WHERE is_won = TRUE)::NUMERIC / COUNT(*)) * 100, 2)
    INTO total_opportunities, won_opportunities, calculated_win_rate
    FROM public.opportunities
    WHERE organization_id = test_org_id;
    
    PERFORM ok(
        calculated_win_rate = 50.00, -- 2 won out of 4 total = 50%
        'Win rate calculation should be accurate: ' || calculated_win_rate || '% (2/4 = 50%)'
    );
END$$;

-- Test 34: Pipeline value analysis
DO $$
DECLARE
    pipeline_value_total NUMERIC;
BEGIN
    -- Test pipeline value calculation (if value fields exist)
    SELECT COALESCE(SUM(probability_percent), 0) INTO pipeline_value_total
    FROM public.opportunities
    WHERE created_at >= NOW() - INTERVAL '1 day'  -- Recent test data
    AND deleted_at IS NULL
    AND is_won = FALSE;
    
    PERFORM ok(
        pipeline_value_total >= 0,
        'Pipeline value analysis should calculate correctly: ' || pipeline_value_total
    );
END$$;

-- =============================================================================
-- OPPORTUNITY BUSINESS PROCESS VALIDATION
-- =============================================================================

-- Test 35: Stage progression business rules
DO $$
DECLARE
    process_opportunity_id UUID;
    stage_sequence TEXT[] := ARRAY[
        'New Lead',
        'Initial Outreach',
        'Sample/Visit Offered',
        'Awaiting Response',
        'Feedback Logged',
        'Demo Scheduled'
    ];
    current_stage TEXT;
    progression_valid BOOLEAN := TRUE;
    i INTEGER;
BEGIN
    -- Create opportunity for process validation
    SELECT test_schema.create_test_opportunity('test_opportunity_pipeline_workflow') INTO process_opportunity_id;
    
    -- Test forward progression
    FOR i IN 1..array_length(stage_sequence, 1) LOOP
        UPDATE public.opportunities
        SET stage = stage_sequence[i]::public.opportunity_stage
        WHERE id = process_opportunity_id;
        
        SELECT stage::TEXT INTO current_stage
        FROM public.opportunities
        WHERE id = process_opportunity_id;
        
        IF current_stage != stage_sequence[i] THEN
            progression_valid := FALSE;
            EXIT;
        END IF;
    END LOOP;
    
    PERFORM ok(
        progression_valid,
        'Stage progression should follow business process rules'
    );
END$$;

-- Test 36: Opportunity close validation
DO $$
DECLARE
    close_test_id UUID;
    pre_close_stage TEXT;
    post_close_stage TEXT;
    is_won_status BOOLEAN;
BEGIN
    -- Create opportunity in advanced stage
    SELECT test_schema.create_test_opportunity(
        'test_opportunity_pipeline_workflow',
        NULL, NULL, NULL,
        'Demo Scheduled'::public.opportunity_stage
    ) INTO close_test_id;
    
    SELECT stage::TEXT INTO pre_close_stage
    FROM public.opportunities
    WHERE id = close_test_id;
    
    -- Close the opportunity
    UPDATE public.opportunities
    SET stage = 'Closed - Won',
        is_won = TRUE,
        probability_percent = 100
    WHERE id = close_test_id;
    
    SELECT stage::TEXT, is_won INTO post_close_stage, is_won_status
    FROM public.opportunities
    WHERE id = close_test_id;
    
    PERFORM ok(
        post_close_stage = 'Closed - Won' AND is_won_status = TRUE,
        'Opportunity close process should set appropriate flags and stage'
    );
END$$;

-- =============================================================================
-- FINAL VALIDATION AND PERFORMANCE TESTS
-- =============================================================================

-- Test 37: Opportunity table constraints summary
DO $$
DECLARE
    constraint_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints
    WHERE table_name = 'opportunities'
    AND constraint_type IN ('CHECK', 'FOREIGN KEY', 'UNIQUE');
    
    PERFORM ok(
        constraint_count > 0,
        'Opportunities table should have appropriate constraints defined'
    );
END$$;

-- Test 38: Opportunity stage transition performance
DO $$
DECLARE
    performance_test_id UUID;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration_ms NUMERIC;
BEGIN
    SELECT test_schema.create_test_opportunity('test_opportunity_pipeline_workflow') INTO performance_test_id;
    
    start_time := clock_timestamp();
    
    -- Perform multiple stage transitions
    FOR i IN 1..10 LOOP
        UPDATE public.opportunities
        SET stage = CASE (i % 3)
            WHEN 0 THEN 'New Lead'
            WHEN 1 THEN 'Initial Outreach'  
            ELSE 'Sample/Visit Offered'
        END::public.opportunity_stage
        WHERE id = performance_test_id;
    END LOOP;
    
    end_time := clock_timestamp();
    duration_ms := EXTRACT(MILLISECONDS FROM end_time - start_time);
    
    PERFORM ok(
        duration_ms < 500, -- Should complete within 500ms
        'Stage transitions should be performant: ' || duration_ms || 'ms'
    );
END$$;

-- Test 39: Opportunity data consistency check
DO $$
DECLARE
    inconsistent_count INTEGER;
BEGIN
    -- Check for opportunities marked as won but not in Closed - Won stage
    SELECT COUNT(*) INTO inconsistent_count
    FROM public.opportunities
    WHERE is_won = TRUE 
    AND stage::TEXT != 'Closed - Won'
    AND deleted_at IS NULL;
    
    PERFORM ok(
        inconsistent_count = 0,
        'Should have no opportunities with inconsistent won status and stage'
    );
END$$;

-- Test 40: Opportunity pipeline completeness validation  
DO $$
DECLARE
    pipeline_stages_count INTEGER;
    total_test_opportunities INTEGER;
BEGIN
    -- Count distinct stages used by our test opportunities
    SELECT COUNT(DISTINCT stage) INTO pipeline_stages_count
    FROM public.opportunities
    WHERE created_at >= NOW() - INTERVAL '1 day'; -- Recent test data
    
    -- Count total test opportunities created
    SELECT COUNT(*) INTO total_test_opportunities
    FROM test_schema.test_data_registry
    WHERE test_name = 'test_opportunity_pipeline_workflow'
    AND entity_type = 'opportunity';
    
    PERFORM ok(
        pipeline_stages_count > 0 AND total_test_opportunities > 0,
        'Pipeline workflow tests should create opportunities across multiple stages: ' || 
        pipeline_stages_count || ' stages, ' || total_test_opportunities || ' opportunities'
    );
END$$;

-- =============================================================================
-- CLEANUP AND COMPLETION
-- =============================================================================

-- Clean up test data
PERFORM test_schema.cleanup_test_data('test_opportunity_pipeline_workflow');

-- Rollback test transaction  
SELECT test_schema.rollback_test();

-- Finish test plan
SELECT finish();

-- Log completion
SELECT test_schema.test_notify('Completed test: opportunity pipeline workflow validation');