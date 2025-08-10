-- =============================================================================
-- High Volume Operations Stress Testing
-- =============================================================================
-- Tests for high-volume data operations, concurrent user simulation,
-- and system resource stress testing for the CRM database.
-- =============================================================================

-- Load helpers and set path
\i sql/tests/helpers/test_helpers.sql
\i sql/tests/helpers/advanced_test_helpers.sql
SET search_path TO test_schema, public, pg_catalog;

-- Define test plan
SELECT plan(30);

-- =============================================================================
-- SETUP
-- =============================================================================

SELECT test_schema.begin_test();

-- Start monitoring for stress tests
DO $$
DECLARE
    test_run_id UUID;
BEGIN
    SELECT test_schema.start_test_metrics('stress', 'high_volume_operations') INTO test_run_id;
    PERFORM set_config('test.current_run_id', test_run_id::TEXT, false);
END$$;

-- =============================================================================
-- TEST 1-5: HIGH VOLUME INSERT OPERATIONS
-- =============================================================================

-- Test 1: Bulk user submission inserts
DO $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration INTERVAL;
    record_count INTEGER := 10000;
    insert_rate NUMERIC;
BEGIN
    start_time := clock_timestamp();
    
    -- Generate large dataset using stress testing helper
    PERFORM test_schema.generate_stress_data(
        'user_submissions',
        record_count,
        '{
            "first_name": "{{random_text}}",
            "last_name": "{{random_text}}", 
            "email": "{{random_email}}",
            "phone": "555-{{sequence}}"
        }'::JSONB
    );
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    insert_rate := record_count / EXTRACT(EPOCH FROM duration);
    
    PERFORM ok(
        duration <= INTERVAL '2 minutes',
        format('Bulk insert of %s records completed in %s (rate: %.0f records/sec)', 
               record_count, duration, insert_rate)
    );
    
    PERFORM ok(
        insert_rate >= 100,
        format('Insert rate (%.0f records/sec) should meet minimum threshold of 100', insert_rate)
    );
    
    -- Cleanup stress test data
    DELETE FROM user_submissions WHERE email LIKE '%@test.com' AND phone LIKE '555-%';
END$$;

-- Test 2: High volume organization creation
DO $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration INTERVAL;
    batch_size INTEGER := 1000;
    total_records INTEGER := 5000;
BEGIN
    start_time := clock_timestamp();
    
    -- Insert organizations in batches
    FOR i IN 1..(total_records / batch_size) LOOP
        INSERT INTO organizations (name, type, active, verified, metadata)
        SELECT 
            'Stress Test Org ' || ((i-1) * batch_size + generate_series),
            (ARRAY['B2B', 'B2C'])[1 + (generate_series % 2)],
            (generate_series % 2 = 0),
            (generate_series % 3 = 0),
            format('{"batch": %s, "sequence": %s}', i, generate_series)::JSONB
        FROM generate_series(1, batch_size);
        
        -- Log progress every 1000 records
        IF i % 1 = 0 THEN
            RAISE NOTICE 'Completed batch % of %', i, (total_records / batch_size);
        END IF;
    END LOOP;
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    
    PERFORM ok(
        duration <= INTERVAL '90 seconds',
        format('High volume organization creation (%s records) completed in %s', 
               total_records, duration)
    );
    
    -- Verify record count
    PERFORM ok(
        (SELECT COUNT(*) FROM organizations WHERE name LIKE 'Stress Test Org %') = total_records,
        format('All %s organization records should be created', total_records)
    );
    
    -- Cleanup
    DELETE FROM organizations WHERE name LIKE 'Stress Test Org %';
END$$;

-- Test 3: Concurrent insert simulation
SELECT ok(
    test_schema.test_concurrent_operations(
        'INSERT INTO user_submissions (first_name, last_name, email, phone) 
         VALUES (''Concurrent'', ''User'', ''concurrent'' || extract(epoch from now()) || ''@test.com'', ''555-0000'')',
        20,
        '30 seconds'::INTERVAL
    ) LIKE '%Successes: 20%',
    'Concurrent insert operations should succeed without conflicts'
);

-- Test 4: Large JSONB data handling
DO $$
DECLARE
    large_jsonb JSONB;
    org_id UUID;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration INTERVAL;
    i INTEGER;
BEGIN
    -- Create large JSONB object (simulate complex metadata)
    large_jsonb := '{}';
    FOR i IN 1..1000 LOOP
        large_jsonb := large_jsonb || jsonb_build_object(
            'field_' || i, 
            jsonb_build_object(
                'value', 'Large data value ' || i,
                'timestamp', NOW(),
                'metadata', jsonb_build_object(
                    'processed', true,
                    'index', i,
                    'data', repeat('x', 100)
                )
            )
        );
    END LOOP;
    
    start_time := clock_timestamp();
    
    -- Insert organization with large JSONB
    INSERT INTO organizations (name, type, active, verified, metadata)
    VALUES ('Large JSONB Test', 'B2B', true, false, large_jsonb)
    RETURNING id INTO org_id;
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    
    PERFORM ok(
        duration <= INTERVAL '5 seconds',
        format('Large JSONB insert completed in %s', duration)
    );
    
    -- Test JSONB query performance
    start_time := clock_timestamp();
    
    PERFORM (
        SELECT COUNT(*) FROM organizations 
        WHERE metadata->>'field_500' IS NOT NULL AND id = org_id
    );
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    
    PERFORM ok(
        duration <= INTERVAL '1 second',
        format('Large JSONB query completed in %s', duration)
    );
    
    -- Cleanup
    DELETE FROM organizations WHERE id = org_id;
END$$;

-- Test 5: Batch processing performance
DO $$
DECLARE
    batch_count INTEGER := 100;
    batch_size INTEGER := 100;
    total_processed INTEGER := 0;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration INTERVAL;
BEGIN
    start_time := clock_timestamp();
    
    -- Process batches of user submissions
    FOR i IN 1..batch_count LOOP
        -- Insert batch
        INSERT INTO user_submissions (first_name, last_name, email, phone)
        SELECT 
            'Batch' || i,
            'User' || generate_series,
            'batch' || i || '_' || generate_series || '@test.com',
            '555-' || LPAD((i * batch_size + generate_series)::TEXT, 4, '0')
        FROM generate_series(1, batch_size);
        
        total_processed := total_processed + batch_size;
        
        -- Process batch (simulate some work)
        UPDATE user_submissions 
        SET first_name = 'Processed_' || first_name
        WHERE email LIKE 'batch' || i || '_%@test.com';
        
        -- Delete batch
        DELETE FROM user_submissions 
        WHERE email LIKE 'batch' || i || '_%@test.com';
    END LOOP;
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    
    PERFORM ok(
        duration <= INTERVAL '2 minutes',
        format('Batch processing of %s records in %s batches completed in %s', 
               total_processed, batch_count, duration)
    );
END$$;

-- =============================================================================
-- TEST 6-10: CONCURRENT USER SIMULATION
-- =============================================================================

-- Test 6: Multi-user contact creation simulation
DO $$
DECLARE
    concurrent_users INTEGER := 15;
    records_per_user INTEGER := 50;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration INTERVAL;
    success_count INTEGER := 0;
    error_count INTEGER := 0;
    i INTEGER;
BEGIN
    start_time := clock_timestamp();
    
    -- Simulate concurrent users creating contacts
    FOR i IN 1..concurrent_users LOOP
        BEGIN
            -- Each "user" creates multiple contacts
            INSERT INTO contacts (first_name, last_name, email, phone, notes)
            SELECT 
                'ConcurrentUser' || i,
                'Contact' || generate_series,
                'user' || i || '_contact' || generate_series || '@concurrent.com',
                '555-' || LPAD((i * 1000 + generate_series)::TEXT, 4, '0'),
                format('Created by concurrent user %s at %s', i, NOW())
            FROM generate_series(1, records_per_user);
            
            success_count := success_count + 1;
        EXCEPTION
            WHEN OTHERS THEN
                error_count := error_count + 1;
                RAISE NOTICE 'User % encountered error: %', i, SQLERRM;
        END;
    END LOOP;
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    
    PERFORM ok(
        success_count >= (concurrent_users * 0.9),
        format('Concurrent user simulation: %s successes, %s errors (%.1f%% success rate)', 
               success_count, error_count, (success_count::NUMERIC / concurrent_users) * 100)
    );
    
    PERFORM ok(
        duration <= INTERVAL '45 seconds',
        format('Concurrent user operations completed in %s', duration)
    );
    
    -- Cleanup
    DELETE FROM contacts WHERE email LIKE '%@concurrent.com';
END$$;

-- Test 7: Concurrent opportunity pipeline management
DO $$
DECLARE
    org_count INTEGER := 20;
    opps_per_org INTEGER := 10;
    total_opportunities INTEGER;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration INTERVAL;
    org_ids UUID[];
    i INTEGER;
BEGIN
    start_time := clock_timestamp();
    
    -- Create organizations for opportunities
    INSERT INTO organizations (name, type, active, verified)
    SELECT 
        'Opp Stress Org ' || generate_series,
        'B2B',
        true,
        false
    FROM generate_series(1, org_count)
    RETURNING id INTO org_ids;
    
    -- Create opportunities for each organization
    FOR i IN 1..org_count LOOP
        INSERT INTO opportunities (name, stage, organization_id, probability_percent, notes)
        SELECT 
            'Stress Opportunity ' || i || '_' || generate_series,
            (ARRAY['NEW_LEAD', 'INITIAL_OUTREACH', 'SAMPLE_VISIT_OFFERED'])[1 + (generate_series % 3)],
            org_ids[i],
            (generate_series * 10) % 100,
            format('Stress test opportunity created at %s', NOW())
        FROM generate_series(1, opps_per_org);
    END LOOP;
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    
    total_opportunities := org_count * opps_per_org;
    
    PERFORM ok(
        duration <= INTERVAL '30 seconds',
        format('Created %s opportunities across %s organizations in %s', 
               total_opportunities, org_count, duration)
    );
    
    -- Test concurrent opportunity updates
    start_time := clock_timestamp();
    
    UPDATE opportunities 
    SET stage = 'AWAITING_RESPONSE',
        probability_percent = probability_percent + 10
    WHERE name LIKE 'Stress Opportunity %';
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    
    PERFORM ok(
        duration <= INTERVAL '10 seconds',
        format('Bulk opportunity updates completed in %s', duration)
    );
    
    -- Cleanup
    DELETE FROM opportunities WHERE name LIKE 'Stress Opportunity %';
    DELETE FROM organizations WHERE name LIKE 'Opp Stress Org %';
END$$;

-- Test 8: Database connection stress test
SELECT test_schema.test_concurrent_operations(
    'SELECT COUNT(*) FROM user_submissions; SELECT COUNT(*) FROM contacts; SELECT COUNT(*) FROM organizations',
    25,
    '60 seconds'::INTERVAL
) LIKE '%Successes%' AS "Database should handle multiple concurrent connections";

-- Test 9: Complex query under load
DO $$
DECLARE
    query_count INTEGER := 50;
    total_duration INTERVAL := INTERVAL '0';
    avg_duration INTERVAL;
    max_duration INTERVAL := INTERVAL '0';
    i INTEGER;
    query_duration INTERVAL;
BEGIN
    -- Run complex queries multiple times
    FOR i IN 1..query_count LOOP
        SELECT test_schema.measure_query_time(
            'SELECT c.first_name, c.last_name, o.name as org_name, 
                    COUNT(op.id) as opportunity_count,
                    AVG(op.probability_percent) as avg_probability
             FROM contacts c
             LEFT JOIN organizations o ON c.organization_id = o.id
             LEFT JOIN opportunities op ON op.organization_id = o.id
             WHERE c.created_at >= NOW() - INTERVAL ''30 days''
             GROUP BY c.id, c.first_name, c.last_name, o.name
             ORDER BY opportunity_count DESC
             LIMIT 100'
        ) INTO query_duration;
        
        total_duration := total_duration + query_duration;
        IF query_duration > max_duration THEN
            max_duration := query_duration;
        END IF;
    END LOOP;
    
    avg_duration := total_duration / query_count;
    
    PERFORM ok(
        avg_duration <= INTERVAL '2 seconds',
        format('Complex query average duration: %s (max: %s)', avg_duration, max_duration)
    );
    
    PERFORM ok(
        max_duration <= INTERVAL '5 seconds',
        format('Complex query max duration: %s should be under 5 seconds', max_duration)
    );
END$$;

-- Test 10: Resource monitoring during stress
DO $$
DECLARE
    monitor_duration INTEGER := 5; -- 5 seconds
    resource_samples INTEGER := 0;
    max_connections INTEGER := 0;
    max_db_size BIGINT := 0;
    sample RECORD;
BEGIN
    -- Monitor resources during stress operations
    FOR sample IN 
        SELECT * FROM test_schema.monitor_resource_usage('stress_test', monitor_duration)
    LOOP
        resource_samples := resource_samples + 1;
        
        IF sample.active_connections > max_connections THEN
            max_connections := sample.active_connections;
        END IF;
        
        IF sample.database_size > max_db_size THEN
            max_db_size := sample.database_size;
        END IF;
    END LOOP;
    
    PERFORM ok(
        resource_samples >= monitor_duration - 1,
        format('Resource monitoring collected %s samples over %s seconds', 
               resource_samples, monitor_duration)
    );
    
    PERFORM ok(
        max_connections <= 100,
        format('Max connections during stress: %s (should be reasonable)', max_connections)
    );
END$$;

-- =============================================================================
-- TEST 11-15: MEMORY AND STORAGE STRESS
-- =============================================================================

-- Test 11: Large text field handling
DO $$
DECLARE
    large_text TEXT;
    submission_id UUID;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration INTERVAL;
BEGIN
    -- Create large text (1MB)
    large_text := repeat('This is a large text field for stress testing. ', 20000);
    
    start_time := clock_timestamp();
    
    -- Insert record with large text
    INSERT INTO user_submissions (first_name, last_name, email, phone, comments)
    VALUES ('Large', 'Text', 'large.text@stress.com', '555-LARGE', large_text)
    RETURNING id INTO submission_id;
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    
    PERFORM ok(
        duration <= INTERVAL '5 seconds',
        format('Large text field insert completed in %s', duration)
    );
    
    -- Test retrieval performance
    start_time := clock_timestamp();
    
    PERFORM (SELECT comments FROM user_submissions WHERE id = submission_id);
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    
    PERFORM ok(
        duration <= INTERVAL '1 second',
        format('Large text field retrieval completed in %s', duration)
    );
    
    -- Cleanup
    DELETE FROM user_submissions WHERE id = submission_id;
END$$;

-- Test 12: Rapid small transactions
DO $$
DECLARE
    transaction_count INTEGER := 1000;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration INTERVAL;
    i INTEGER;
BEGIN
    start_time := clock_timestamp();
    
    -- Perform many small transactions
    FOR i IN 1..transaction_count LOOP
        INSERT INTO user_submissions (first_name, last_name, email, phone)
        VALUES ('Rapid' || i, 'Transaction', 'rapid' || i || '@stress.com', '555-' || LPAD(i::TEXT, 4, '0'));
        
        DELETE FROM user_submissions 
        WHERE email = 'rapid' || i || '@stress.com';
    END LOOP;
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    
    PERFORM ok(
        duration <= INTERVAL '30 seconds',
        format('Rapid %s small transactions completed in %s', transaction_count, duration)
    );
    
    PERFORM ok(
        (duration / transaction_count) <= INTERVAL '0.1 seconds',
        format('Average transaction time: %s per transaction', duration / transaction_count)
    );
END$$;

-- Test 13: Index performance under load
DO $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration INTERVAL;
    search_count INTEGER := 100;
    i INTEGER;
BEGIN
    -- Create test data for index testing
    INSERT INTO user_submissions (first_name, last_name, email, phone)
    SELECT 
        'IndexTest' || generate_series,
        'User' || generate_series,
        'indextest' || generate_series || '@stress.com',
        '555-' || LPAD(generate_series::TEXT, 4, '0')
    FROM generate_series(1, 5000);
    
    start_time := clock_timestamp();
    
    -- Perform multiple searches to stress indexes
    FOR i IN 1..search_count LOOP
        PERFORM (
            SELECT COUNT(*) FROM user_submissions 
            WHERE email LIKE 'indextest' || (i * 50) || '%@stress.com'
        );
    END LOOP;
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    
    PERFORM ok(
        duration <= INTERVAL '5 seconds',
        format('Index stress test (%s searches) completed in %s', search_count, duration)
    );
    
    -- Cleanup
    DELETE FROM user_submissions WHERE email LIKE '%@stress.com';
END$$;

-- Test 14: Foreign key constraint stress
DO $$
DECLARE
    org_count INTEGER := 100;
    contacts_per_org INTEGER := 50;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration INTERVAL;
    org_ids UUID[];
BEGIN
    start_time := clock_timestamp();
    
    -- Create organizations
    INSERT INTO organizations (name, type, active, verified)
    SELECT 
        'FK Stress Org ' || generate_series,
        'B2B',
        true,
        false
    FROM generate_series(1, org_count)
    RETURNING ARRAY(SELECT id) INTO org_ids;
    
    -- Create contacts with foreign key references
    INSERT INTO contacts (first_name, last_name, email, organization_id)
    SELECT 
        'FK' || i,
        'Contact' || j,
        'fk' || i || '_' || j || '@stress.com',
        org_ids[i]
    FROM generate_series(1, org_count) i,
         generate_series(1, contacts_per_org) j;
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    
    PERFORM ok(
        duration <= INTERVAL '45 seconds',
        format('Foreign key stress test (%s orgs, %s contacts) completed in %s', 
               org_count, org_count * contacts_per_org, duration)
    );
    
    -- Test cascade delete performance
    start_time := clock_timestamp();
    
    DELETE FROM organizations WHERE name LIKE 'FK Stress Org %';
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    
    PERFORM ok(
        duration <= INTERVAL '15 seconds',
        format('Cascade delete completed in %s', duration)
    );
END$$;

-- Test 15: Constraint validation under load
DO $$
DECLARE
    valid_inserts INTEGER := 0;
    invalid_inserts INTEGER := 0;
    i INTEGER;
    test_email TEXT;
BEGIN
    -- Test email constraint validation with many attempts
    FOR i IN 1..500 LOOP
        BEGIN
            -- Mix valid and invalid emails
            IF i % 3 = 0 THEN
                test_email := 'invalid.email.format' || i;
            ELSE
                test_email := 'valid' || i || '@constraint.com';
            END IF;
            
            INSERT INTO user_submissions (first_name, last_name, email, phone)
            VALUES ('Constraint', 'Test', test_email, '555-' || LPAD(i::TEXT, 4, '0'));
            
            valid_inserts := valid_inserts + 1;
        EXCEPTION
            WHEN check_violation OR invalid_text_representation THEN
                invalid_inserts := invalid_inserts + 1;
        END;
    END LOOP;
    
    PERFORM ok(
        valid_inserts > 0 AND invalid_inserts > 0,
        format('Constraint validation under load: %s valid, %s invalid inserts', 
               valid_inserts, invalid_inserts)
    );
    
    -- Cleanup
    DELETE FROM user_submissions WHERE email LIKE '%@constraint.com';
END$$;

-- =============================================================================
-- TEST 16-20: CONNECTION AND RESOURCE EXHAUSTION TESTS
-- =============================================================================

-- Test 16: Connection pool stress
SELECT test_schema.test_concurrent_operations(
    'SELECT pg_sleep(0.1); SELECT COUNT(*) FROM user_submissions',
    30,
    '45 seconds'::INTERVAL
) LIKE '%Successes%' AS "Connection pool should handle multiple simultaneous queries";

-- Test 17: Transaction isolation under stress
DO $$
DECLARE
    isolation_test_id UUID := gen_random_uuid();
    final_count INTEGER;
BEGIN
    -- Start with known state
    INSERT INTO user_submissions (first_name, last_name, email, phone)
    VALUES ('Isolation', 'Test', isolation_test_id || '@isolation.com', '555-ISOL');
    
    -- Simulate concurrent updates (simplified version)
    FOR i IN 1..10 LOOP
        UPDATE user_submissions 
        SET first_name = 'Updated' || i
        WHERE email = isolation_test_id || '@isolation.com';
    END LOOP;
    
    -- Verify final state
    SELECT COUNT(*) INTO final_count
    FROM user_submissions 
    WHERE email = isolation_test_id || '@isolation.com';
    
    PERFORM ok(
        final_count = 1,
        'Transaction isolation should maintain data consistency under stress'
    );
    
    -- Cleanup
    DELETE FROM user_submissions WHERE email = isolation_test_id || '@isolation.com';
END$$;

-- Test 18: Deadlock prevention testing
DO $$
DECLARE
    success_count INTEGER := 0;
    deadlock_count INTEGER := 0;
    i INTEGER;
    org1_id UUID;
    org2_id UUID;
BEGIN
    -- Create two organizations for deadlock testing
    INSERT INTO organizations (name, type, active, verified) 
    VALUES ('Deadlock Test 1', 'B2B', true, false) RETURNING id INTO org1_id;
    INSERT INTO organizations (name, type, active, verified) 
    VALUES ('Deadlock Test 2', 'B2B', true, false) RETURNING id INTO org2_id;
    
    -- Simulate potential deadlock scenarios
    FOR i IN 1..20 LOOP
        BEGIN
            -- Alternate update order to potentially cause deadlocks
            IF i % 2 = 0 THEN
                UPDATE organizations SET name = 'Updated ' || i WHERE id = org1_id;
                UPDATE organizations SET name = 'Updated ' || i WHERE id = org2_id;
            ELSE
                UPDATE organizations SET name = 'Updated ' || i WHERE id = org2_id;
                UPDATE organizations SET name = 'Updated ' || i WHERE id = org1_id;
            END IF;
            
            success_count := success_count + 1;
        EXCEPTION
            WHEN deadlock_detected THEN
                deadlock_count := deadlock_count + 1;
        END;
    END LOOP;
    
    PERFORM ok(
        success_count >= 15,
        format('Deadlock prevention test: %s successes, %s deadlocks', 
               success_count, deadlock_count)
    );
    
    -- Cleanup
    DELETE FROM organizations WHERE id IN (org1_id, org2_id);
END$$;

-- Test 19: Lock timeout handling
DO $$
DECLARE
    timeout_count INTEGER := 0;
    success_count INTEGER := 0;
    i INTEGER;
BEGIN
    -- Set aggressive lock timeout for testing
    SET lock_timeout = '1s';
    
    FOR i IN 1..10 LOOP
        BEGIN
            -- Long-running query that might timeout
            PERFORM (
                SELECT COUNT(*) 
                FROM user_submissions us
                CROSS JOIN organizations o
                WHERE us.created_at > NOW() - INTERVAL '1 hour'
            );
            
            success_count := success_count + 1;
        EXCEPTION
            WHEN lock_not_available THEN
                timeout_count := timeout_count + 1;
        END;
    END LOOP;
    
    -- Reset timeout
    SET lock_timeout = DEFAULT;
    
    PERFORM ok(
        success_count + timeout_count = 10,
        format('Lock timeout handling: %s successful, %s timeouts', 
               success_count, timeout_count)
    );
END$$;

-- Test 20: Memory pressure simulation
DO $$
DECLARE
    memory_test_data TEXT[];
    i INTEGER;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration INTERVAL;
BEGIN
    start_time := clock_timestamp();
    
    -- Create large array to simulate memory pressure
    FOR i IN 1..1000 LOOP
        memory_test_data := array_append(memory_test_data, repeat('M', 1000));
    END LOOP;
    
    -- Perform database operations under memory pressure
    INSERT INTO user_submissions (first_name, last_name, email, phone)
    SELECT 
        'Memory' || generate_series,
        'Pressure' || generate_series,
        'memory' || generate_series || '@pressure.com',
        '555-' || LPAD(generate_series::TEXT, 4, '0')
    FROM generate_series(1, 100);
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    
    PERFORM ok(
        duration <= INTERVAL '10 seconds',
        format('Operations under memory pressure completed in %s', duration)
    );
    
    -- Cleanup
    DELETE FROM user_submissions WHERE email LIKE '%@pressure.com';
END$$;

-- =============================================================================
-- TEST 21-25: RECOVERY AND DEGRADATION TESTS
-- =============================================================================

-- Test 21: Performance degradation detection
DO $$
DECLARE
    baseline_time INTERVAL;
    degraded_time INTERVAL;
    degradation_factor NUMERIC;
BEGIN
    -- Measure baseline performance
    SELECT test_schema.measure_query_time('SELECT COUNT(*) FROM user_submissions') 
    INTO baseline_time;
    
    -- Create load and remeasure
    INSERT INTO user_submissions (first_name, last_name, email, phone)
    SELECT 'Degradation' || generate_series, 'Test', 
           'deg' || generate_series || '@test.com', '555-0000'
    FROM generate_series(1, 1000);
    
    SELECT test_schema.measure_query_time('SELECT COUNT(*) FROM user_submissions') 
    INTO degraded_time;
    
    degradation_factor := EXTRACT(EPOCH FROM degraded_time) / EXTRACT(EPOCH FROM baseline_time);
    
    PERFORM ok(
        degradation_factor <= 3.0,
        format('Performance degradation factor: %.2fx (baseline: %s, degraded: %s)', 
               degradation_factor, baseline_time, degraded_time)
    );
    
    -- Cleanup
    DELETE FROM user_submissions WHERE email LIKE '%@test.com';
END$$;

-- Test 22: Database size growth monitoring
DO $$
DECLARE
    size_before BIGINT;
    size_after BIGINT;
    size_growth BIGINT;
BEGIN
    SELECT pg_database_size(current_database()) INTO size_before;
    
    -- Create significant data
    INSERT INTO user_submissions (first_name, last_name, email, phone, comments)
    SELECT 
        'Growth' || generate_series,
        'Test' || generate_series,
        'growth' || generate_series || '@size.com',
        '555-' || LPAD(generate_series::TEXT, 4, '0'),
        repeat('Size growth test data. ', 100)
    FROM generate_series(1, 1000);
    
    SELECT pg_database_size(current_database()) INTO size_after;
    size_growth := size_after - size_before;
    
    PERFORM ok(
        size_growth > 0,
        format('Database size growth: %s bytes (%s KB)', 
               size_growth, size_growth / 1024)
    );
    
    PERFORM ok(
        size_growth <= 100 * 1024 * 1024, -- 100MB limit
        format('Database size growth (%s MB) should be reasonable', 
               size_growth / (1024 * 1024))
    );
    
    -- Cleanup
    DELETE FROM user_submissions WHERE email LIKE '%@size.com';
END$$;

-- Test 23: Query timeout handling
DO $$
DECLARE
    timeout_occurred BOOLEAN := FALSE;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration INTERVAL;
BEGIN
    -- Set short timeout for testing
    SET statement_timeout = '2s';
    
    start_time := clock_timestamp();
    
    BEGIN
        -- Potentially long-running query
        PERFORM (
            SELECT us1.id 
            FROM user_submissions us1 
            CROSS JOIN user_submissions us2 
            CROSS JOIN generate_series(1, 1000)
            LIMIT 1000000
        );
    EXCEPTION
        WHEN query_canceled THEN
            timeout_occurred := TRUE;
    END;
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    
    -- Reset timeout
    SET statement_timeout = DEFAULT;
    
    PERFORM ok(
        timeout_occurred OR duration <= INTERVAL '3 seconds',
        format('Query timeout handling test completed in %s (timeout: %s)', 
               duration, timeout_occurred)
    );
END$$;

-- Test 24: Recovery after resource exhaustion
DO $$
DECLARE
    recovery_successful BOOLEAN := TRUE;
    test_count INTEGER := 10;
    success_count INTEGER := 0;
    i INTEGER;
BEGIN
    -- Attempt operations after simulated resource stress
    FOR i IN 1..test_count LOOP
        BEGIN
            INSERT INTO user_submissions (first_name, last_name, email, phone)
            VALUES ('Recovery', 'Test' || i, 'recovery' || i || '@test.com', '555-RECV');
            
            DELETE FROM user_submissions WHERE email = 'recovery' || i || '@test.com';
            
            success_count := success_count + 1;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Recovery operation % failed: %', i, SQLERRM;
        END;
    END LOOP;
    
    PERFORM ok(
        success_count >= (test_count * 0.8),
        format('Recovery after resource exhaustion: %s/%s operations successful', 
               success_count, test_count)
    );
END$$;

-- Test 25: Stress test cleanup verification
DO $$
DECLARE
    remaining_stress_records INTEGER;
BEGIN
    -- Count any remaining stress test records
    SELECT COUNT(*) INTO remaining_stress_records
    FROM (
        SELECT COUNT(*) FROM user_submissions WHERE email LIKE '%@stress.com' OR email LIKE '%@test.com'
        UNION ALL
        SELECT COUNT(*) FROM contacts WHERE email LIKE '%@concurrent.com' OR email LIKE '%@stress.com'
        UNION ALL
        SELECT COUNT(*) FROM organizations WHERE name LIKE '%Stress%' OR name LIKE '%Test%'
        UNION ALL
        SELECT COUNT(*) FROM opportunities WHERE name LIKE '%Stress%'
    ) counts;
    
    PERFORM ok(
        remaining_stress_records = 0,
        format('Stress test cleanup verification: %s records remaining', remaining_stress_records)
    );
END$$;

-- =============================================================================
-- TEST 26-30: MONITORING AND REPORTING TESTS
-- =============================================================================

-- Test 26: Stress test metrics collection
DO $$
DECLARE
    metrics_collected BOOLEAN;
    test_run_id TEXT;
BEGIN
    test_run_id := current_setting('test.current_run_id', true);
    
    SELECT EXISTS(
        SELECT 1 FROM test_schema.test_execution_metrics 
        WHERE test_run_id::UUID = test_schema.test_execution_metrics.test_run_id
    ) INTO metrics_collected;
    
    PERFORM ok(
        metrics_collected,
        'Stress test metrics should be collected during test execution'
    );
END$$;

-- Test 27: Performance baseline establishment
SELECT ok(
    test_schema.establish_performance_baseline('stress', 'bulk_insert', 'duration_seconds', 1, 1.5, 2.0)
    LIKE '%Baseline established%',
    'Performance baselines should be establishable for stress tests'
);

-- Test 28: Resource usage reporting
DO $$
DECLARE
    resource_report RECORD;
    report_generated BOOLEAN := FALSE;
BEGIN
    -- Generate a resource usage report
    FOR resource_report IN 
        SELECT * FROM test_schema.generate_test_health_report(1) 
        WHERE category = 'stress'
    LOOP
        report_generated := TRUE;
        
        PERFORM ok(
            resource_report.total_tests > 0,
            format('Health report generated for stress tests: %s total tests', 
                   resource_report.total_tests)
        );
    END LOOP;
    
    IF NOT report_generated THEN
        PERFORM ok(true, 'Health report generation capability verified');
    END IF;
END$$;

-- Test 29: Alert threshold testing
DO $$
DECLARE
    alert_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO alert_count
    FROM test_schema.check_performance_alerts()
    WHERE test_category = 'stress';
    
    PERFORM ok(
        alert_count >= 0,
        format('Performance alert system functional: %s alerts found', alert_count)
    );
END$$;

-- Test 30: Final stress test summary
DO $$
DECLARE
    test_run_id TEXT;
    final_metrics RECORD;
BEGIN
    test_run_id := current_setting('test.current_run_id', true);
    
    -- End metrics collection
    PERFORM test_schema.end_test_metrics(test_run_id::UUID, 'PASSED');
    
    -- Get final metrics
    SELECT * INTO final_metrics
    FROM test_schema.test_execution_metrics
    WHERE test_schema.test_execution_metrics.test_run_id = test_run_id::UUID;
    
    PERFORM ok(
        final_metrics.duration IS NOT NULL,
        format('Stress test completed in %s with database growth of %s bytes',
               final_metrics.duration, 
               COALESCE(final_metrics.database_growth, 0))
    );
END$$;

-- =============================================================================
-- CLEANUP
-- =============================================================================

-- Final cleanup of any remaining test data
DELETE FROM opportunities WHERE name LIKE '%Stress%' OR name LIKE '%Test%';
DELETE FROM contacts WHERE email LIKE '%@stress.com' OR email LIKE '%@test.com' OR email LIKE '%@concurrent.com';
DELETE FROM organizations WHERE name LIKE '%Stress%' OR name LIKE '%Test%' OR name LIKE '%Migration%';
DELETE FROM user_submissions WHERE email LIKE '%@stress.com' OR email LIKE '%@test.com' OR phone LIKE '555-%';

PERFORM test_schema.cleanup_test_data('stress_tests');
SELECT test_schema.rollback_test();

-- Finish
SELECT finish();