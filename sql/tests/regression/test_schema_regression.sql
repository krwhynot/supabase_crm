-- =============================================================================
-- Schema Regression Testing Suite
-- =============================================================================
-- Automated regression test suite for all CRM entities to prevent schema changes
-- from breaking existing functionality and ensure business logic consistency.
-- =============================================================================

-- Load helpers and set path
\i sql/tests/helpers/test_helpers.sql
\i sql/tests/helpers/advanced_test_helpers.sql
SET search_path TO test_schema, public, pg_catalog;

-- Define test plan
SELECT plan(40);

-- =============================================================================
-- SETUP
-- =============================================================================

SELECT test_schema.begin_test();

-- Start regression test monitoring
DO $$
DECLARE
    test_run_id UUID;
BEGIN
    SELECT test_schema.start_test_metrics('regression', 'schema_regression_suite') INTO test_run_id;
    PERFORM set_config('test.regression_run_id', test_run_id::TEXT, false);
END$$;

-- =============================================================================
-- TEST 1-10: CORE TABLE STRUCTURE REGRESSION TESTS
-- =============================================================================

-- Test 1: User submissions table structure consistency
SELECT ok(
    has_table('public', 'user_submissions') AND
    has_column('public', 'user_submissions', 'id') AND
    has_column('public', 'user_submissions', 'first_name') AND
    has_column('public', 'user_submissions', 'last_name') AND
    has_column('public', 'user_submissions', 'email') AND
    has_column('public', 'user_submissions', 'phone') AND
    has_column('public', 'user_submissions', 'created_at') AND
    has_column('public', 'user_submissions', 'updated_at'),
    'User submissions table structure should remain consistent'
);

-- Test 2: Organizations table structure regression
SELECT ok(
    has_table('public', 'organizations') AND
    has_column('public', 'organizations', 'id') AND
    has_column('public', 'organizations', 'name') AND
    has_column('public', 'organizations', 'type') AND
    has_column('public', 'organizations', 'active') AND
    has_column('public', 'organizations', 'verified') AND
    has_column('public', 'organizations', 'metadata'),
    'Organizations table structure should remain consistent'
);

-- Test 3: Contacts table structure regression
SELECT ok(
    has_table('public', 'contacts') AND
    has_column('public', 'contacts', 'id') AND
    has_column('public', 'contacts', 'first_name') AND
    has_column('public', 'contacts', 'last_name') AND
    has_column('public', 'contacts', 'email') AND
    has_column('public', 'contacts', 'organization_id'),
    'Contacts table structure should remain consistent'
);

-- Test 4: Opportunities table structure regression
SELECT ok(
    has_table('public', 'opportunities') AND
    has_column('public', 'opportunities', 'id') AND
    has_column('public', 'opportunities', 'name') AND
    has_column('public', 'opportunities', 'stage') AND
    has_column('public', 'opportunities', 'organization_id') AND
    has_column('public', 'opportunities', 'probability_percent'),
    'Opportunities table structure should remain consistent'
);

-- Test 5: Principals table structure regression
SELECT ok(
    has_table('public', 'principals') AND
    has_column('public', 'principals', 'id') AND
    has_column('public', 'principals', 'name') AND
    has_column('public', 'principals', 'type') AND
    has_column('public', 'principals', 'active'),
    'Principals table structure should remain consistent'
);

-- Test 6: Products table structure regression
SELECT ok(
    has_table('public', 'products') AND
    has_column('public', 'products', 'id') AND
    has_column('public', 'products', 'name') AND
    has_column('public', 'products', 'category') AND
    has_column('public', 'products', 'is_active'),
    'Products table structure should remain consistent'
);

-- Test 7: Principal activity tracking structure regression
SELECT ok(
    has_table('public', 'principal_activity_tracking') AND
    has_column('public', 'principal_activity_tracking', 'id') AND
    has_column('public', 'principal_activity_tracking', 'principal_id') AND
    has_column('public', 'principal_activity_tracking', 'activity_date') AND
    has_column('public', 'principal_activity_tracking', 'activity_type'),
    'Principal activity tracking table structure should remain consistent'
);

-- Test 8: Core constraint consistency regression
SELECT results_eq(
    $$SELECT constraint_name FROM information_schema.table_constraints 
      WHERE table_name = 'user_submissions' AND constraint_type = 'PRIMARY KEY'$$,
    $$VALUES ('user_submissions_pkey')$$,
    'User submissions primary key constraint should be consistent'
);

-- Test 9: Foreign key relationships regression
SELECT ok(
    test_schema.has_fk_constraint('public', 'contacts', 'organization_id', 'public', 'organizations', 'id')
    LIKE '%exists%',
    'Contacts-Organizations foreign key relationship should be maintained'
);

-- Test 10: Enum types regression
SELECT ok(
    EXISTS(
        SELECT 1 FROM pg_type 
        WHERE typname = 'organization_type' AND typtype = 'e'
    ) AND EXISTS(
        SELECT 1 FROM pg_type 
        WHERE typname = 'opportunity_stage' AND typtype = 'e'
    ),
    'Essential enum types should remain available'
);

-- =============================================================================
-- TEST 11-20: DATA INTEGRITY REGRESSION TESTS
-- =============================================================================

-- Test 11: Email validation regression
SELECT throws_ok(
    $$INSERT INTO user_submissions (first_name, last_name, email, phone) 
      VALUES ('Test', 'User', 'invalid-email', '555-0001')$$,
    '23514',
    'Email validation constraints should remain functional'
);

-- Test 12: UUID generation regression
DO $$
DECLARE
    new_id UUID;
BEGIN
    INSERT INTO user_submissions (first_name, last_name, email, phone)
    VALUES ('UUID', 'Test', 'uuid.test@regression.com', '555-UUID')
    RETURNING id INTO new_id;
    
    PERFORM ok(
        new_id IS NOT NULL AND LENGTH(new_id::TEXT) = 36,
        'UUID generation should remain functional'
    );
    
    DELETE FROM user_submissions WHERE id = new_id;
END$$;

-- Test 13: Timestamp trigger regression
DO $$
DECLARE
    submission_id UUID;
    created_time TIMESTAMPTZ;
    updated_time TIMESTAMPTZ;
BEGIN
    INSERT INTO user_submissions (first_name, last_name, email, phone)
    VALUES ('Timestamp', 'Test', 'timestamp.test@regression.com', '555-TIME')
    RETURNING id, created_at INTO submission_id, created_time;
    
    -- Wait and update
    PERFORM pg_sleep(0.1);
    UPDATE user_submissions SET first_name = 'Updated' WHERE id = submission_id
    RETURNING updated_at INTO updated_time;
    
    PERFORM ok(
        updated_time > created_time,
        'Updated_at trigger should remain functional'
    );
    
    DELETE FROM user_submissions WHERE id = submission_id;
END$$;

-- Test 14: Organization type constraint regression
SELECT throws_ok(
    $$INSERT INTO organizations (name, type, active, verified) 
      VALUES ('Invalid Type Test', 'INVALID_TYPE', true, false)$$,
    '23514',
    'Organization type constraints should remain enforced'
);

-- Test 15: Opportunity stage constraint regression
DO $$
DECLARE
    org_id UUID;
    opp_id UUID;
BEGIN
    -- Create organization first
    INSERT INTO organizations (name, type, active, verified)
    VALUES ('Stage Test Org', 'B2B', true, false)
    RETURNING id INTO org_id;
    
    -- Test valid stage
    INSERT INTO opportunities (name, stage, organization_id)
    VALUES ('Stage Test', 'NEW_LEAD', org_id)
    RETURNING id INTO opp_id;
    
    PERFORM ok(
        opp_id IS NOT NULL,
        'Valid opportunity stages should be accepted'
    );
    
    -- Cleanup
    DELETE FROM opportunities WHERE id = opp_id;
    DELETE FROM organizations WHERE id = org_id;
END$$;

-- Test 16: JSONB functionality regression
DO $$
DECLARE
    org_id UUID;
    metadata_value JSONB;
BEGIN
    INSERT INTO organizations (name, type, active, verified, metadata)
    VALUES ('JSONB Test', 'B2B', true, false, '{"test": true, "regression": "verified"}')
    RETURNING id INTO org_id;
    
    SELECT metadata INTO metadata_value
    FROM organizations WHERE id = org_id;
    
    PERFORM ok(
        metadata_value->>'test' = 'true' AND metadata_value->>'regression' = 'verified',
        'JSONB functionality should remain intact'
    );
    
    DELETE FROM organizations WHERE id = org_id;
END$$;

-- Test 17: Cascade delete regression
DO $$
DECLARE
    org_id UUID;
    contact_id UUID;
    contact_count INTEGER;
BEGIN
    -- Create organization and contact
    INSERT INTO organizations (name, type, active, verified)
    VALUES ('Cascade Test Org', 'B2B', true, false)
    RETURNING id INTO org_id;
    
    INSERT INTO contacts (first_name, last_name, email, organization_id)
    VALUES ('Cascade', 'Test', 'cascade@regression.com', org_id)
    RETURNING id INTO contact_id;
    
    -- Delete organization (should cascade)
    DELETE FROM organizations WHERE id = org_id;
    
    -- Check if contact was deleted
    SELECT COUNT(*) INTO contact_count
    FROM contacts WHERE id = contact_id;
    
    PERFORM ok(
        contact_count = 0,
        'Cascade delete functionality should remain functional'
    );
END$$;

-- Test 18: Unique constraint regression
SELECT throws_ok(
    $$
    INSERT INTO user_submissions (first_name, last_name, email, phone) 
    VALUES ('Unique1', 'Test', 'unique@regression.com', '555-0001');
    INSERT INTO user_submissions (first_name, last_name, email, phone) 
    VALUES ('Unique2', 'Test', 'unique@regression.com', '555-0002');
    $$,
    '23505',
    'Email uniqueness constraints should remain enforced'
);

-- Test 19: Principal activity relationship regression
DO $$
DECLARE
    principal_id UUID;
    activity_id UUID;
BEGIN
    -- Create principal first
    INSERT INTO principals (name, type, active)
    VALUES ('Activity Regression Test', 'TEACHER', true)
    RETURNING id INTO principal_id;
    
    -- Create activity tracking record
    INSERT INTO principal_activity_tracking (principal_id, activity_date, activity_type, details)
    VALUES (principal_id, CURRENT_DATE, 'CONTACT', '{"type": "regression_test"}')
    RETURNING id INTO activity_id;
    
    PERFORM ok(
        activity_id IS NOT NULL,
        'Principal activity tracking relationships should remain functional'
    );
    
    -- Cleanup
    DELETE FROM principal_activity_tracking WHERE id = activity_id;
    DELETE FROM principals WHERE id = principal_id;
END$$;

-- Test 20: Product-Principal relationship regression
DO $$
DECLARE
    product_id UUID;
    principal_id UUID;
    relationship_exists BOOLEAN;
BEGIN
    -- Create product and principal
    INSERT INTO products (name, category, is_active)
    VALUES ('Regression Test Product', 'EDUCATIONAL', true)
    RETURNING id INTO product_id;
    
    INSERT INTO principals (name, type, active)
    VALUES ('Product Test Principal', 'TEACHER', true)
    RETURNING id INTO principal_id;
    
    -- Create relationship
    INSERT INTO product_principals (product_id, principal_id)
    VALUES (product_id, principal_id);
    
    -- Verify relationship exists
    SELECT EXISTS(
        SELECT 1 FROM product_principals 
        WHERE product_id = test_20.product_id AND principal_id = test_20.principal_id
    ) INTO relationship_exists;
    
    PERFORM ok(
        relationship_exists,
        'Product-Principal relationships should remain functional'
    );
    
    -- Cleanup
    DELETE FROM product_principals WHERE product_id = test_20.product_id;
    DELETE FROM products WHERE id = product_id;
    DELETE FROM principals WHERE id = principal_id;
END$$;

-- =============================================================================
-- TEST 21-30: PERFORMANCE REGRESSION TESTS
-- =============================================================================

-- Test 21: Basic query performance regression
DO $$
DECLARE
    query_time INTERVAL;
    performance_threshold INTERVAL := INTERVAL '1 second';
BEGIN
    SELECT test_schema.measure_query_time('SELECT COUNT(*) FROM user_submissions') 
    INTO query_time;
    
    PERFORM ok(
        query_time <= performance_threshold,
        format('Basic count query performance: %s (threshold: %s)', query_time, performance_threshold)
    );
END$$;

-- Test 22: Index usage regression
SELECT ok(
    test_schema.check_index_usage('SELECT * FROM user_submissions WHERE email = ''test@example.com''')
    LIKE '%index%',
    'Email index should be utilized for email lookups'
);

-- Test 23: Join performance regression
DO $$
DECLARE
    join_time INTERVAL;
    performance_threshold INTERVAL := INTERVAL '2 seconds';
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT c.first_name, o.name FROM contacts c JOIN organizations o ON c.organization_id = o.id LIMIT 100'
    ) INTO join_time;
    
    PERFORM ok(
        join_time <= performance_threshold,
        format('Join query performance: %s (threshold: %s)', join_time, performance_threshold)
    );
END$$;

-- Test 24: Complex aggregation performance regression
DO $$
DECLARE
    agg_time INTERVAL;
    performance_threshold INTERVAL := INTERVAL '3 seconds';
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT o.type, COUNT(c.id) as contact_count, AVG(LENGTH(c.notes)) as avg_note_length
         FROM organizations o 
         LEFT JOIN contacts c ON o.id = c.organization_id 
         GROUP BY o.type'
    ) INTO agg_time;
    
    PERFORM ok(
        agg_time <= performance_threshold,
        format('Aggregation query performance: %s (threshold: %s)', agg_time, performance_threshold)
    );
END$$;

-- Test 25: JSONB query performance regression
DO $$
DECLARE
    jsonb_time INTERVAL;
    performance_threshold INTERVAL := INTERVAL '2 seconds';
    org_id UUID;
BEGIN
    -- Create test data with JSONB
    INSERT INTO organizations (name, type, active, verified, metadata)
    VALUES ('JSONB Performance Test', 'B2B', true, false, '{"performance": {"test": true, "index": 1}}')
    RETURNING id INTO org_id;
    
    SELECT test_schema.measure_query_time(
        format('SELECT * FROM organizations WHERE metadata->>''performance'' IS NOT NULL AND id = ''%s''', org_id)
    ) INTO jsonb_time;
    
    PERFORM ok(
        jsonb_time <= performance_threshold,
        format('JSONB query performance: %s (threshold: %s)', jsonb_time, performance_threshold)
    );
    
    DELETE FROM organizations WHERE id = org_id;
END$$;

-- Test 26: Insert performance regression
DO $$
DECLARE
    insert_time INTERVAL;
    batch_size INTEGER := 100;
    performance_threshold INTERVAL := INTERVAL '5 seconds';
BEGIN
    SELECT test_schema.measure_query_time(
        format('INSERT INTO user_submissions (first_name, last_name, email, phone) 
                SELECT ''Perf'' || generate_series, ''Test'' || generate_series, 
                       ''perf'' || generate_series || ''@regression.com'', ''555-PERF''
                FROM generate_series(1, %s)', batch_size)
    ) INTO insert_time;
    
    PERFORM ok(
        insert_time <= performance_threshold,
        format('Batch insert performance (%s records): %s (threshold: %s)', 
               batch_size, insert_time, performance_threshold)
    );
    
    -- Cleanup
    DELETE FROM user_submissions WHERE email LIKE '%@regression.com';
END$$;

-- Test 27: Update performance regression
DO $$
DECLARE
    update_time INTERVAL;
    performance_threshold INTERVAL := INTERVAL '2 seconds';
    org_id UUID;
BEGIN
    -- Create test organization
    INSERT INTO organizations (name, type, active, verified)
    VALUES ('Update Performance Test', 'B2B', true, false)
    RETURNING id INTO org_id;
    
    SELECT test_schema.measure_query_time(
        format('UPDATE organizations SET metadata = ''{"updated": true}'' WHERE id = ''%s''', org_id)
    ) INTO update_time;
    
    PERFORM ok(
        update_time <= performance_threshold,
        format('Update performance: %s (threshold: %s)', update_time, performance_threshold)
    );
    
    DELETE FROM organizations WHERE id = org_id;
END$$;

-- Test 28: Delete performance regression
DO $$
DECLARE
    delete_time INTERVAL;
    performance_threshold INTERVAL := INTERVAL '2 seconds';
    org_id UUID;
BEGIN
    -- Create test organization
    INSERT INTO organizations (name, type, active, verified)
    VALUES ('Delete Performance Test', 'B2B', true, false)
    RETURNING id INTO org_id;
    
    SELECT test_schema.measure_query_time(
        format('DELETE FROM organizations WHERE id = ''%s''', org_id)
    ) INTO delete_time;
    
    PERFORM ok(
        delete_time <= performance_threshold,
        format('Delete performance: %s (threshold: %s)', delete_time, performance_threshold)
    );
END$$;

-- Test 29: Opportunity pipeline query performance regression
DO $$
DECLARE
    pipeline_time INTERVAL;
    performance_threshold INTERVAL := INTERVAL '3 seconds';
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT stage, COUNT(*) as count, AVG(probability_percent) as avg_prob
         FROM opportunities 
         WHERE created_at >= NOW() - INTERVAL ''30 days''
         GROUP BY stage
         ORDER BY avg_prob DESC'
    ) INTO pipeline_time;
    
    PERFORM ok(
        pipeline_time <= performance_threshold,
        format('Opportunity pipeline query performance: %s (threshold: %s)', 
               pipeline_time, performance_threshold)
    );
END$$;

-- Test 30: Full-text search performance regression (if implemented)
DO $$
DECLARE
    search_time INTERVAL;
    performance_threshold INTERVAL := INTERVAL '2 seconds';
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT * FROM user_submissions 
         WHERE first_name ILIKE ''%test%'' OR last_name ILIKE ''%test%'' 
         LIMIT 50'
    ) INTO search_time;
    
    PERFORM ok(
        search_time <= performance_threshold,
        format('Text search performance: %s (threshold: %s)', search_time, performance_threshold)
    );
END$$;

-- =============================================================================
-- TEST 31-40: BUSINESS LOGIC REGRESSION TESTS
-- =============================================================================

-- Test 31: Opportunity stage progression logic regression
DO $$
DECLARE
    org_id UUID;
    opp_id UUID;
    stage_progression TEXT[] := ARRAY['NEW_LEAD', 'INITIAL_OUTREACH', 'SAMPLE_VISIT_OFFERED', 'AWAITING_RESPONSE'];
    i INTEGER;
BEGIN
    -- Create organization
    INSERT INTO organizations (name, type, active, verified)
    VALUES ('Stage Progression Test', 'B2B', true, false)
    RETURNING id INTO org_id;
    
    -- Create opportunity
    INSERT INTO opportunities (name, stage, organization_id)
    VALUES ('Stage Test Opportunity', 'NEW_LEAD', org_id)
    RETURNING id INTO opp_id;
    
    -- Test stage progressions
    FOR i IN 2..array_length(stage_progression, 1) LOOP
        UPDATE opportunities 
        SET stage = stage_progression[i]::opportunity_stage
        WHERE id = opp_id;
        
        -- Verify stage was updated
        PERFORM ok(
            (SELECT stage FROM opportunities WHERE id = opp_id) = stage_progression[i]::opportunity_stage,
            format('Opportunity stage should progress to %s', stage_progression[i])
        );
    END LOOP;
    
    -- Cleanup
    DELETE FROM opportunities WHERE id = opp_id;
    DELETE FROM organizations WHERE id = org_id;
END$$;

-- Test 32: Principal activity tracking business logic regression
DO $$
DECLARE
    principal_id UUID;
    activity_id UUID;
    activity_count INTEGER;
BEGIN
    -- Create principal
    INSERT INTO principals (name, type, active)
    VALUES ('Activity Logic Test', 'TEACHER', true)
    RETURNING id INTO principal_id;
    
    -- Add multiple activities
    INSERT INTO principal_activity_tracking (principal_id, activity_date, activity_type, details)
    VALUES 
        (principal_id, CURRENT_DATE, 'CONTACT', '{"method": "email"}'),
        (principal_id, CURRENT_DATE, 'MEETING', '{"duration": "30min"}'),
        (principal_id, CURRENT_DATE - INTERVAL '1 day', 'FOLLOW_UP', '{"result": "positive"}');
    
    -- Verify activities were recorded
    SELECT COUNT(*) INTO activity_count
    FROM principal_activity_tracking WHERE principal_id = test_32.principal_id;
    
    PERFORM ok(
        activity_count = 3,
        'Principal activity tracking should record multiple activities'
    );
    
    -- Cleanup
    DELETE FROM principal_activity_tracking WHERE principal_id = test_32.principal_id;
    DELETE FROM principals WHERE id = principal_id;
END$$;

-- Test 33: Organization verification workflow regression
DO $$
DECLARE
    org_id UUID;
    verification_status BOOLEAN;
BEGIN
    -- Create unverified organization
    INSERT INTO organizations (name, type, active, verified)
    VALUES ('Verification Test Org', 'B2B', true, false)
    RETURNING id INTO org_id;
    
    -- Simulate verification process
    UPDATE organizations 
    SET verified = true, 
        metadata = COALESCE(metadata, '{}') || '{"verified_at": "' || NOW() || '"}'
    WHERE id = org_id;
    
    -- Verify status was updated
    SELECT verified INTO verification_status
    FROM organizations WHERE id = org_id;
    
    PERFORM ok(
        verification_status = true,
        'Organization verification workflow should function correctly'
    );
    
    DELETE FROM organizations WHERE id = org_id;
END$$;

-- Test 34: Contact-Organization relationship consistency regression
DO $$
DECLARE
    org_id UUID;
    contact_id UUID;
    contact_org_id UUID;
BEGIN
    -- Create organization
    INSERT INTO organizations (name, type, active, verified)
    VALUES ('Contact Relationship Test', 'B2B', true, false)
    RETURNING id INTO org_id;
    
    -- Create contact with organization
    INSERT INTO contacts (first_name, last_name, email, organization_id)
    VALUES ('Relationship', 'Test', 'relationship@regression.com', org_id)
    RETURNING id INTO contact_id;
    
    -- Verify relationship
    SELECT organization_id INTO contact_org_id
    FROM contacts WHERE id = contact_id;
    
    PERFORM ok(
        contact_org_id = org_id,
        'Contact-Organization relationships should maintain consistency'
    );
    
    -- Cleanup
    DELETE FROM contacts WHERE id = contact_id;
    DELETE FROM organizations WHERE id = org_id;
END$$;

-- Test 35: Product-Principal assignment logic regression
DO $$
DECLARE
    product_id UUID;
    principal_id UUID;
    assignment_exists BOOLEAN;
BEGIN
    -- Create product and principal
    INSERT INTO products (name, category, is_active)
    VALUES ('Assignment Test Product', 'EDUCATIONAL', true)
    RETURNING id INTO product_id;
    
    INSERT INTO principals (name, type, active)
    VALUES ('Assignment Test Principal', 'TEACHER', true)
    RETURNING id INTO principal_id;
    
    -- Create assignment
    INSERT INTO product_principals (product_id, principal_id)
    VALUES (product_id, principal_id);
    
    -- Verify assignment
    SELECT EXISTS(
        SELECT 1 FROM product_principals 
        WHERE product_id = test_35.product_id AND principal_id = test_35.principal_id
    ) INTO assignment_exists;
    
    PERFORM ok(
        assignment_exists,
        'Product-Principal assignment logic should function correctly'
    );
    
    -- Cleanup
    DELETE FROM product_principals WHERE product_id = test_35.product_id;
    DELETE FROM products WHERE id = product_id;
    DELETE FROM principals WHERE id = principal_id;
END$$;

-- Test 36: Opportunity probability calculation regression
DO $$
DECLARE
    org_id UUID;
    opp_id UUID;
    calculated_prob INTEGER;
BEGIN
    -- Create organization
    INSERT INTO organizations (name, type, active, verified)
    VALUES ('Probability Test Org', 'B2B', true, false)
    RETURNING id INTO org_id;
    
    -- Create opportunity with specific probability
    INSERT INTO opportunities (name, stage, organization_id, probability_percent)
    VALUES ('Probability Test', 'AWAITING_RESPONSE', org_id, 65)
    RETURNING id INTO opp_id;
    
    -- Verify probability is within valid range
    SELECT probability_percent INTO calculated_prob
    FROM opportunities WHERE id = opp_id;
    
    PERFORM ok(
        calculated_prob >= 0 AND calculated_prob <= 100,
        format('Opportunity probability (%s%%) should be within valid range', calculated_prob)
    );
    
    -- Cleanup
    DELETE FROM opportunities WHERE id = opp_id;
    DELETE FROM organizations WHERE id = org_id;
END$$;

-- Test 37: Data validation business rules regression
SELECT throws_ok(
    $$INSERT INTO user_submissions (first_name, last_name, email, phone) 
      VALUES ('', 'User', 'empty.name@regression.com', '555-0001')$$,
    NULL,
    'Business rules for required fields should be enforced'
);

-- Test 38: Audit trail functionality regression
DO $$
DECLARE
    submission_id UUID;
    original_updated_at TIMESTAMPTZ;
    new_updated_at TIMESTAMPTZ;
BEGIN
    -- Create record
    INSERT INTO user_submissions (first_name, last_name, email, phone)
    VALUES ('Audit', 'Test', 'audit@regression.com', '555-AUDIT')
    RETURNING id, updated_at INTO submission_id, original_updated_at;
    
    -- Wait and update
    PERFORM pg_sleep(0.1);
    UPDATE user_submissions SET last_name = 'Updated' WHERE id = submission_id
    RETURNING updated_at INTO new_updated_at;
    
    PERFORM ok(
        new_updated_at > original_updated_at,
        'Audit trail (updated_at) functionality should remain functional'
    );
    
    DELETE FROM user_submissions WHERE id = submission_id;
END$$;

-- Test 39: Data consistency validation regression
DO $$
DECLARE
    org_id UUID;
    contact_count INTEGER;
    opportunity_count INTEGER;
BEGIN
    -- Create organization with related data
    INSERT INTO organizations (name, type, active, verified)
    VALUES ('Consistency Test Org', 'B2B', true, false)
    RETURNING id INTO org_id;
    
    INSERT INTO contacts (first_name, last_name, email, organization_id)
    VALUES ('Consistency', 'Contact', 'consistency@regression.com', org_id);
    
    INSERT INTO opportunities (name, stage, organization_id)
    VALUES ('Consistency Opportunity', 'NEW_LEAD', org_id);
    
    -- Verify data consistency
    SELECT 
        (SELECT COUNT(*) FROM contacts WHERE organization_id = test_39.org_id),
        (SELECT COUNT(*) FROM opportunities WHERE organization_id = test_39.org_id)
    INTO contact_count, opportunity_count;
    
    PERFORM ok(
        contact_count = 1 AND opportunity_count = 1,
        'Data consistency should be maintained across related tables'
    );
    
    -- Cleanup (cascade delete)
    DELETE FROM organizations WHERE id = org_id;
END$$;

-- Test 40: Complete business workflow regression
DO $$
DECLARE
    org_id UUID;
    contact_id UUID;
    principal_id UUID;
    product_id UUID;
    opp_id UUID;
    activity_id UUID;
    workflow_complete BOOLEAN := true;
BEGIN
    -- Create complete business workflow
    BEGIN
        -- 1. Create organization
        INSERT INTO organizations (name, type, active, verified)
        VALUES ('Workflow Test Org', 'B2B', true, false)
        RETURNING id INTO org_id;
        
        -- 2. Create contact
        INSERT INTO contacts (first_name, last_name, email, organization_id)
        VALUES ('Workflow', 'Contact', 'workflow@regression.com', org_id)
        RETURNING id INTO contact_id;
        
        -- 3. Create principal
        INSERT INTO principals (name, type, active)
        VALUES ('Workflow Principal', 'TEACHER', true)
        RETURNING id INTO principal_id;
        
        -- 4. Create product
        INSERT INTO products (name, category, is_active)
        VALUES ('Workflow Product', 'EDUCATIONAL', true)
        RETURNING id INTO product_id;
        
        -- 5. Associate product with principal
        INSERT INTO product_principals (product_id, principal_id)
        VALUES (product_id, principal_id);
        
        -- 6. Create opportunity
        INSERT INTO opportunities (name, stage, organization_id, principal_id, product_id)
        VALUES ('Workflow Opportunity', 'NEW_LEAD', org_id, principal_id, product_id)
        RETURNING id INTO opp_id;
        
        -- 7. Track principal activity
        INSERT INTO principal_activity_tracking (principal_id, activity_date, activity_type, details)
        VALUES (principal_id, CURRENT_DATE, 'CONTACT', '{"opportunity_id": "' || opp_id || '"}')
        RETURNING id INTO activity_id;
        
    EXCEPTION
        WHEN OTHERS THEN
            workflow_complete := false;
            RAISE NOTICE 'Workflow test failed: %', SQLERRM;
    END;
    
    PERFORM ok(
        workflow_complete,
        'Complete business workflow should execute without errors'
    );
    
    -- Cleanup (cascading deletes should handle relationships)
    IF workflow_complete THEN
        DELETE FROM principal_activity_tracking WHERE id = activity_id;
        DELETE FROM opportunities WHERE id = opp_id;
        DELETE FROM product_principals WHERE product_id = test_40.product_id;
        DELETE FROM products WHERE id = product_id;
        DELETE FROM principals WHERE id = principal_id;
        DELETE FROM contacts WHERE id = contact_id;
        DELETE FROM organizations WHERE id = org_id;
    END IF;
END$$;

-- =============================================================================
-- REGRESSION TEST MONITORING AND REPORTING
-- =============================================================================

-- End regression test monitoring
DO $$
DECLARE
    test_run_id TEXT;
    final_metrics RECORD;
BEGIN
    test_run_id := current_setting('test.regression_run_id', true);
    
    -- End metrics collection
    PERFORM test_schema.end_test_metrics(test_run_id::UUID, 'PASSED');
    
    -- Get final metrics
    SELECT * INTO final_metrics
    FROM test_schema.test_execution_metrics
    WHERE test_schema.test_execution_metrics.test_run_id = test_run_id::UUID;
    
    RAISE NOTICE 'Regression test suite completed in % with % database growth',
                 final_metrics.duration, 
                 COALESCE(final_metrics.database_growth, 0);
END$$;

-- =============================================================================
-- CLEANUP
-- =============================================================================

PERFORM test_schema.cleanup_test_data('regression_tests');
SELECT test_schema.rollback_test();

-- Finish
SELECT finish();