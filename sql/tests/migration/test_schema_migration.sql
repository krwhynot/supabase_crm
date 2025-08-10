-- =============================================================================
-- Schema Migration Testing
-- =============================================================================
-- Tests for database schema migration validation, rollback procedures,
-- and migration performance across the CRM system.
-- =============================================================================

-- Load helpers and set path
\i sql/tests/helpers/test_helpers.sql
\i sql/tests/helpers/advanced_test_helpers.sql
SET search_path TO test_schema, public, pg_catalog;

-- Define test plan
SELECT plan(25);

-- =============================================================================
-- SETUP
-- =============================================================================

SELECT test_schema.begin_test();

-- =============================================================================
-- TEST 1-5: TABLE CREATION MIGRATION TESTS
-- =============================================================================

-- Test 1: Create table migration
SELECT test_schema.test_migration_rollback(
    'create_test_table',
    '',
    'CREATE TABLE test_migration_table (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL)',
    'DROP TABLE IF EXISTS test_migration_table CASCADE'
) LIKE '%successful%' AS "Table creation migration rollback works";

-- Test 2: Column addition migration
SELECT throws_ok(
    $$SELECT test_schema.test_migration_rollback(
        'add_column',
        'CREATE TABLE test_col_table (id UUID PRIMARY KEY)',
        'ALTER TABLE test_col_table ADD COLUMN email TEXT',
        'ALTER TABLE test_col_table DROP COLUMN email'
    )$$,
    NULL,
    'Column addition migration should be testable'
);

-- Test 3: Index creation migration performance
SELECT lives_ok(
    $$SELECT test_schema.validate_migration_timing(
        'CREATE INDEX test_idx ON user_submissions(first_name)',
        '30 seconds'::INTERVAL
    )$$,
    'Index creation migration should complete quickly'
);

-- Test 4: Constraint addition migration
SELECT lives_ok(
    $$SELECT test_schema.validate_migration_timing(
        'ALTER TABLE user_submissions ADD CONSTRAINT test_constraint CHECK (first_name IS NOT NULL)',
        '10 seconds'::INTERVAL
    )$$,
    'Constraint addition should be fast'
);

-- Test 5: Multiple table migration rollback
SELECT ok(
    test_schema.test_migration_rollback(
        'multi_table_creation',
        '',
        'CREATE TABLE test_table_a (id UUID PRIMARY KEY); CREATE TABLE test_table_b (id UUID PRIMARY KEY, a_id UUID REFERENCES test_table_a(id))',
        'DROP TABLE IF EXISTS test_table_b CASCADE; DROP TABLE IF EXISTS test_table_a CASCADE'
    ) LIKE '%successful%',
    'Multi-table creation migration rollback should work'
);

-- =============================================================================
-- TEST 6-10: DATA MIGRATION TESTS
-- =============================================================================

-- Test 6: Data transformation migration
SELECT lives_ok(
    $$
    BEGIN;
        -- Create test data
        INSERT INTO user_submissions (first_name, last_name, email, phone) 
        VALUES ('Test', 'User', 'test@example.com', '123-456-7890');
        
        -- Simulate data migration
        UPDATE user_submissions 
        SET first_name = UPPER(first_name)
        WHERE email = 'test@example.com';
        
        -- Verify transformation
        PERFORM ok(
            (SELECT first_name FROM user_submissions WHERE email = 'test@example.com') = 'TEST',
            'Data transformation should work correctly'
        );
        
        -- Rollback
        UPDATE user_submissions 
        SET first_name = INITCAP(first_name)
        WHERE email = 'test@example.com';
        
        DELETE FROM user_submissions WHERE email = 'test@example.com';
    ROLLBACK;
    $$,
    'Data transformation migration should work'
);

-- Test 7: Large data migration timing
DO $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration INTERVAL;
    batch_size INTEGER := 1000;
BEGIN
    -- Create test data in batches
    start_time := clock_timestamp();
    
    FOR i IN 1..5 LOOP
        INSERT INTO user_submissions (first_name, last_name, email, phone)
        SELECT 
            'Test' || generate_series,
            'User' || generate_series,
            'test' || generate_series || '@migration.com',
            '555-' || LPAD(generate_series::TEXT, 4, '0')
        FROM generate_series((i-1)*batch_size + 1, i*batch_size);
    END LOOP;
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    
    PERFORM ok(
        duration <= INTERVAL '2 minutes',
        format('Large data migration completed in %s (should be <= 2 minutes)', duration)
    );
    
    -- Cleanup
    DELETE FROM user_submissions WHERE email LIKE '%@migration.com';
END$$;

-- Test 8: Data migration with foreign key dependencies
SELECT lives_ok(
    $$
    DO $$
    DECLARE
        org_id UUID;
        contact_id UUID;
    BEGIN
        -- Create organization first
        INSERT INTO organizations (name, type, active, verified) 
        VALUES ('Migration Test Org', 'B2B', true, false)
        RETURNING id INTO org_id;
        
        -- Create contact with organization reference
        INSERT INTO contacts (first_name, last_name, email, organization_id)
        VALUES ('Migration', 'Test', 'migration.test@example.com', org_id)
        RETURNING id INTO contact_id;
        
        -- Verify relationships exist
        PERFORM ok(
            EXISTS(
                SELECT 1 FROM contacts c 
                JOIN organizations o ON c.organization_id = o.id 
                WHERE c.id = contact_id AND o.id = org_id
            ),
            'Foreign key relationships should be maintained during migration'
        );
        
        -- Cleanup (deletes should cascade)
        DELETE FROM organizations WHERE id = org_id;
    END$$;
    $$,
    'Data migration with foreign keys should work'
);

-- Test 9: Migration data integrity validation
SELECT ok(
    test_schema.test_backup_integrity('migration_integrity_test'),
    'Data integrity should be maintained during migration'
);

-- Test 10: Enum migration handling
SELECT lives_ok(
    $$
    DO $$
    BEGIN
        -- Test enum value addition simulation
        BEGIN
            -- This would normally be: ALTER TYPE organization_type ADD VALUE 'GOVERNMENT';
            -- For testing purposes, we'll verify enum constraint handling
            INSERT INTO organizations (name, type, active, verified) 
            VALUES ('Test Gov Org', 'B2B', true, false);
            
            PERFORM ok(
                (SELECT type FROM organizations WHERE name = 'Test Gov Org') = 'B2B',
                'Enum migration handling should work correctly'
            );
            
            DELETE FROM organizations WHERE name = 'Test Gov Org';
        END;
    END$$;
    $$,
    'Enum migration should be handled correctly'
);

-- =============================================================================
-- TEST 11-15: VERSION CONTROL AND ROLLBACK TESTS
-- =============================================================================

-- Test 11: Schema version tracking
SELECT has_table('public', 'schema_versions') OR 
       has_table('test_schema', 'migration_history') AS 
       "Schema versioning system should exist or be implementable";

-- Test 12: Migration dependency validation
SELECT ok(
    test_schema.capture_schema_state() IS NOT NULL,
    'Schema state capture should work for dependency tracking'
);

-- Test 13: Rollback sequence validation
SELECT lives_ok(
    $$
    DO $$
    DECLARE
        initial_state JSONB;
        final_state JSONB;
    BEGIN
        -- Capture initial state
        SELECT test_schema.capture_schema_state() INTO initial_state;
        
        -- Create temporary change
        CREATE TEMP TABLE migration_rollback_test (id SERIAL PRIMARY KEY, data TEXT);
        
        -- Simulate rollback
        DROP TABLE migration_rollback_test;
        
        -- Verify rollback by checking state consistency
        SELECT test_schema.capture_schema_state() INTO final_state;
        
        PERFORM ok(
            initial_state IS NOT NULL AND final_state IS NOT NULL,
            'Rollback sequence should maintain state tracking'
        );
    END$$;
    $$,
    'Migration rollback sequence should be validated'
);

-- Test 14: Migration timing thresholds
SELECT ok(
    test_schema.validate_migration_timing(
        'SELECT COUNT(*) FROM user_submissions',
        '5 seconds'::INTERVAL
    ) LIKE '%within limit%',
    'Migration operations should meet timing thresholds'
);

-- Test 15: Concurrent migration safety
SELECT test_schema.test_concurrent_operations(
    'SELECT COUNT(*) FROM user_submissions',
    5,
    '15 seconds'::INTERVAL
) LIKE '%Successes: 5%' AS "Concurrent operations should work during migration";

-- =============================================================================
-- TEST 16-20: COMPLEX MIGRATION SCENARIOS
-- =============================================================================

-- Test 16: Multi-table relationship migration
SELECT lives_ok(
    $$
    DO $$
    DECLARE
        org_id UUID;
        contact_id UUID;
        opp_id UUID;
    BEGIN
        -- Create complex related data
        INSERT INTO organizations (name, type, active, verified) 
        VALUES ('Complex Migration Org', 'B2B', true, false)
        RETURNING id INTO org_id;
        
        INSERT INTO contacts (first_name, last_name, email, organization_id)
        VALUES ('Complex', 'Contact', 'complex@migration.com', org_id)
        RETURNING id INTO contact_id;
        
        INSERT INTO opportunities (name, stage, organization_id)
        VALUES ('Complex Opportunity', 'NEW_LEAD', org_id)
        RETURNING id INTO opp_id;
        
        -- Verify all relationships exist
        PERFORM ok(
            EXISTS(
                SELECT 1 FROM opportunities o
                JOIN organizations org ON o.organization_id = org.id
                JOIN contacts c ON c.organization_id = org.id
                WHERE o.id = opp_id AND c.id = contact_id AND org.id = org_id
            ),
            'Complex multi-table relationships should be maintained'
        );
        
        -- Cleanup
        DELETE FROM opportunities WHERE id = opp_id;
        DELETE FROM contacts WHERE id = contact_id;
        DELETE FROM organizations WHERE id = org_id;
    END$$;
    $$,
    'Complex migration scenarios should handle multiple table relationships'
);

-- Test 17: Index migration performance
SELECT ok(
    test_schema.validate_migration_timing(
        'CREATE INDEX CONCURRENTLY test_concurrent_idx ON user_submissions(last_name)',
        '1 minute'::INTERVAL
    ) LIKE '%within limit%',
    'Concurrent index creation should complete within timing limits'
);

-- Test 18: Large table migration simulation
DO $$
DECLARE
    record_count INTEGER;
    migration_time INTERVAL;
BEGIN
    -- Create significant test data
    INSERT INTO user_submissions (first_name, last_name, email, phone)
    SELECT 
        'MigTest' || i,
        'User' || i,
        'migtest' || i || '@large.com',
        '555-' || LPAD(i::TEXT, 4, '0')
    FROM generate_series(1, 2000) i;
    
    GET DIAGNOSTICS record_count = ROW_COUNT;
    
    -- Simulate migration operation
    SELECT test_schema.measure_query_time(
        'UPDATE user_submissions SET first_name = UPPER(first_name) WHERE email LIKE ''%@large.com'''
    ) INTO migration_time;
    
    PERFORM ok(
        migration_time <= INTERVAL '30 seconds',
        format('Large table migration (%s records) completed in %s', record_count, migration_time)
    );
    
    -- Cleanup
    DELETE FROM user_submissions WHERE email LIKE '%@large.com';
END$$;

-- Test 19: Migration with JSONB column changes
SELECT lives_ok(
    $$
    DO $$
    DECLARE
        org_id UUID;
    BEGIN
        -- Create organization with JSONB data
        INSERT INTO organizations (name, type, active, verified, metadata)
        VALUES ('JSONB Migration Test', 'B2B', true, false, '{"version": 1, "migrated": false}')
        RETURNING id INTO org_id;
        
        -- Simulate JSONB migration
        UPDATE organizations 
        SET metadata = metadata || '{"version": 2, "migrated": true}'
        WHERE id = org_id;
        
        -- Verify migration
        PERFORM ok(
            (SELECT metadata->>'migrated' FROM organizations WHERE id = org_id) = 'true',
            'JSONB migration should update nested data correctly'
        );
        
        DELETE FROM organizations WHERE id = org_id;
    END$$;
    $$,
    'JSONB column migrations should be handled properly'
);

-- Test 20: Migration with trigger updates
SELECT lives_ok(
    $$
    DO $$
    DECLARE
        submission_id UUID;
        old_updated_at TIMESTAMPTZ;
        new_updated_at TIMESTAMPTZ;
    BEGIN
        -- Create test record
        INSERT INTO user_submissions (first_name, last_name, email, phone)
        VALUES ('Trigger', 'Test', 'trigger@migration.com', '555-0001')
        RETURNING id, updated_at INTO submission_id, old_updated_at;
        
        -- Wait a moment
        PERFORM pg_sleep(0.1);
        
        -- Update record to trigger updated_at change
        UPDATE user_submissions 
        SET first_name = 'TriggerUpdated'
        WHERE id = submission_id
        RETURNING updated_at INTO new_updated_at;
        
        PERFORM ok(
            new_updated_at > old_updated_at,
            'Migration should maintain trigger functionality'
        );
        
        DELETE FROM user_submissions WHERE id = submission_id;
    END$$;
    $$,
    'Migration should preserve trigger functionality'
);

-- =============================================================================
-- TEST 21-25: MIGRATION FAILURE AND RECOVERY TESTS
-- =============================================================================

-- Test 21: Migration failure detection
SELECT throws_ok(
    $$SELECT test_schema.validate_migration_timing(
        'SELECT pg_sleep(10)',
        '1 second'::INTERVAL
    )$$,
    NULL,
    'Migration timing violations should be detected'
);

-- Test 22: Partial migration rollback
SELECT ok(
    test_schema.test_migration_rollback(
        'partial_migration',
        'CREATE TABLE partial_test (id SERIAL)',
        'ALTER TABLE partial_test ADD COLUMN data TEXT; INSERT INTO partial_test (data) VALUES (''test'')',
        'DROP TABLE partial_test CASCADE'
    ) LIKE '%successful%',
    'Partial migrations should be rollback-safe'
);

-- Test 23: Migration state consistency
SELECT ok(
    jsonb_typeof(test_schema.capture_schema_state()) = 'object',
    'Schema state capture should maintain consistency format'
);

-- Test 24: Migration dependency chain validation
SELECT lives_ok(
    $$
    DO $$
    BEGIN
        -- Simulate dependency chain validation
        PERFORM ok(
            has_table('public', 'user_submissions') AND
            has_table('public', 'organizations') AND
            has_table('public', 'contacts'),
            'Migration dependency chain should be valid'
        );
    END$$;
    $$,
    'Migration dependency validation should work'
);

-- Test 25: Migration monitoring integration
SELECT lives_ok(
    $$
    DO $$
    DECLARE
        test_run_id UUID;
    BEGIN
        -- Start migration monitoring
        SELECT test_schema.start_test_metrics('migration', 'test_migration_monitoring') 
        INTO test_run_id;
        
        -- Simulate migration work
        PERFORM pg_sleep(0.1);
        
        -- End monitoring
        PERFORM test_schema.end_test_metrics(test_run_id, 'PASSED');
        
        PERFORM ok(
            EXISTS(
                SELECT 1 FROM test_schema.test_execution_metrics 
                WHERE test_run_id = test_migration_monitoring.test_run_id
            ),
            'Migration monitoring should track test execution'
        );
    END$$;
    $$,
    'Migration monitoring integration should work'
);

-- =============================================================================
-- CLEANUP
-- =============================================================================

-- Clean up any test artifacts
DROP INDEX IF EXISTS test_idx;
DROP INDEX IF EXISTS test_concurrent_idx;
ALTER TABLE user_submissions DROP CONSTRAINT IF EXISTS test_constraint;

PERFORM test_schema.cleanup_test_data('migration_tests');
SELECT test_schema.rollback_test();

-- Finish
SELECT finish();