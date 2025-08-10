-- =============================================================================
-- Advanced pgTAP Test Helper Functions - Phase 5 Extensions
-- =============================================================================
-- This file contains advanced helper functions for comprehensive database testing
-- including migration, stress, edge case, and monitoring capabilities.
-- =============================================================================

-- Set search path for helpers
SET search_path TO test_schema, public, pg_catalog;

-- =============================================================================
-- MIGRATION TESTING HELPERS
-- =============================================================================

-- Test migration rollback capability
CREATE OR REPLACE FUNCTION test_schema.test_migration_rollback(
    migration_name TEXT,
    setup_sql TEXT,
    migration_sql TEXT,
    rollback_sql TEXT
)
RETURNS TEXT AS $$
DECLARE
    initial_state JSONB;
    migrated_state JSONB;
    rolled_back_state JSONB;
    result TEXT;
BEGIN
    -- Setup initial state
    EXECUTE setup_sql;
    
    -- Capture initial state
    SELECT test_schema.capture_schema_state() INTO initial_state;
    
    -- Apply migration
    EXECUTE migration_sql;
    
    -- Capture migrated state
    SELECT test_schema.capture_schema_state() INTO migrated_state;
    
    -- Apply rollback
    EXECUTE rollback_sql;
    
    -- Capture rolled back state
    SELECT test_schema.capture_schema_state() INTO rolled_back_state;
    
    -- Compare states
    IF initial_state = rolled_back_state THEN
        result := format('Migration %s rollback successful - state restored', migration_name);
    ELSE
        result := format('Migration %s rollback failed - state mismatch', migration_name);
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Capture current schema state as JSONB
CREATE OR REPLACE FUNCTION test_schema.capture_schema_state()
RETURNS JSONB AS $$
DECLARE
    schema_state JSONB := '{}';
    table_info JSONB;
BEGIN
    -- Capture table structures
    SELECT jsonb_object_agg(
        table_name,
        jsonb_build_object(
            'columns', (
                SELECT jsonb_object_agg(
                    column_name,
                    jsonb_build_object(
                        'data_type', data_type,
                        'is_nullable', is_nullable,
                        'column_default', column_default
                    )
                )
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = t.table_name
            ),
            'row_count', (
                SELECT count_estimate(format('SELECT COUNT(*) FROM %I', t.table_name))
            )
        )
    )
    INTO table_info
    FROM information_schema.tables t
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    
    schema_state := jsonb_build_object('tables', table_info);
    
    RETURN schema_state;
END;
$$ LANGUAGE plpgsql;

-- Validate migration timing performance
CREATE OR REPLACE FUNCTION test_schema.validate_migration_timing(
    migration_sql TEXT,
    max_duration INTERVAL DEFAULT '5 minutes'
)
RETURNS TEXT AS $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    actual_duration INTERVAL;
BEGIN
    start_time := clock_timestamp();
    
    EXECUTE migration_sql;
    
    end_time := clock_timestamp();
    actual_duration := end_time - start_time;
    
    IF actual_duration <= max_duration THEN
        RETURN format('Migration completed in %s (within limit of %s)', 
                     actual_duration, max_duration);
    ELSE
        RETURN format('Migration took %s (exceeds limit of %s)', 
                     actual_duration, max_duration);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STRESS TESTING HELPERS
-- =============================================================================

-- Generate large datasets for stress testing
CREATE OR REPLACE FUNCTION test_schema.generate_stress_data(
    table_name TEXT,
    record_count INTEGER,
    data_template JSONB
)
RETURNS TEXT AS $$
DECLARE
    insert_sql TEXT;
    column_list TEXT;
    value_list TEXT;
    key TEXT;
    value TEXT;
    i INTEGER;
BEGIN
    -- Build column and value lists from template
    SELECT 
        string_agg(quote_ident(k), ', '),
        string_agg(
            CASE 
                WHEN v::text = '"{{sequence}}"' THEN 'generate_series(1, ' || record_count || ')'
                WHEN v::text = '"{{random_text}}"' THEN 'substr(md5(generate_series(1, ' || record_count || ')::text), 1, 20)'
                WHEN v::text = '"{{random_email}}"' THEN 'concat(substr(md5(generate_series(1, ' || record_count || ')::text), 1, 10), ''@test.com'')'
                WHEN v::text = '"{{uuid}}"' THEN 'gen_random_uuid()'
                WHEN v::text = '"{{now}}"' THEN 'NOW()'
                ELSE quote_literal(v::text)
            END,
            ', '
        )
    INTO column_list, value_list
    FROM jsonb_each_text(data_template) AS t(k, v);
    
    -- Build and execute insert statement
    insert_sql := format(
        'INSERT INTO %I (%s) SELECT %s',
        table_name, column_list, value_list
    );
    
    EXECUTE insert_sql;
    
    RETURN format('Generated %s records in table %s', record_count, table_name);
END;
$$ LANGUAGE plpgsql;

-- Test concurrent operations
CREATE OR REPLACE FUNCTION test_schema.test_concurrent_operations(
    operation_sql TEXT,
    concurrent_count INTEGER DEFAULT 10,
    max_duration INTERVAL DEFAULT '30 seconds'
)
RETURNS TEXT AS $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    actual_duration INTERVAL;
    error_count INTEGER := 0;
    success_count INTEGER := 0;
BEGIN
    start_time := clock_timestamp();
    
    -- Simulate concurrent operations using dblink (if available)
    -- Or use simple looped execution for basic concurrency simulation
    FOR i IN 1..concurrent_count LOOP
        BEGIN
            EXECUTE operation_sql;
            success_count := success_count + 1;
        EXCEPTION
            WHEN OTHERS THEN
                error_count := error_count + 1;
        END;
    END LOOP;
    
    end_time := clock_timestamp();
    actual_duration := end_time - start_time;
    
    RETURN format('Concurrent test completed in %s. Successes: %s, Errors: %s',
                 actual_duration, success_count, error_count);
END;
$$ LANGUAGE plpgsql;

-- Monitor database resource usage during stress
CREATE OR REPLACE FUNCTION test_schema.monitor_resource_usage(
    test_name TEXT,
    duration_seconds INTEGER DEFAULT 60
)
RETURNS TABLE(
    timestamp TIMESTAMPTZ,
    active_connections INTEGER,
    database_size BIGINT,
    temp_files INTEGER,
    temp_bytes BIGINT
) AS $$
DECLARE
    start_time TIMESTAMPTZ := clock_timestamp();
    end_time TIMESTAMPTZ := start_time + (duration_seconds || ' seconds')::INTERVAL;
BEGIN
    -- Create monitoring loop
    WHILE clock_timestamp() < end_time LOOP
        timestamp := clock_timestamp();
        
        -- Get active connections
        SELECT count(*) INTO active_connections
        FROM pg_stat_activity
        WHERE state = 'active';
        
        -- Get database size
        SELECT pg_database_size(current_database()) INTO database_size;
        
        -- Get temp file usage
        SELECT 
            COALESCE(temp_files, 0),
            COALESCE(temp_bytes, 0)
        INTO temp_files, temp_bytes
        FROM pg_stat_database
        WHERE datname = current_database();
        
        RETURN NEXT;
        
        -- Sleep for 1 second
        PERFORM pg_sleep(1);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- EDGE CASE TESTING HELPERS
-- =============================================================================

-- Test boundary values for numeric fields
CREATE OR REPLACE FUNCTION test_schema.test_numeric_boundaries(
    table_name TEXT,
    column_name TEXT,
    data_type TEXT
)
RETURNS TEXT[] AS $$
DECLARE
    results TEXT[] := ARRAY[]::TEXT[];
    min_val NUMERIC;
    max_val NUMERIC;
    test_values NUMERIC[];
BEGIN
    -- Define boundary values based on data type
    CASE data_type
        WHEN 'smallint' THEN
            test_values := ARRAY[-32768, -32767, 0, 32767, 32768];
        WHEN 'integer' THEN
            test_values := ARRAY[-2147483648, -2147483647, 0, 2147483647, 2147483648];
        WHEN 'bigint' THEN
            test_values := ARRAY[-9223372036854775808, 0, 9223372036854775807];
        ELSE
            results := array_append(results, format('Unsupported data type: %s', data_type));
            RETURN results;
    END CASE;
    
    -- Test each boundary value
    FOR i IN 1..array_length(test_values, 1) LOOP
        BEGIN
            EXECUTE format('INSERT INTO %I (%I) VALUES (%s)', 
                         table_name, column_name, test_values[i]);
            results := array_append(results, 
                format('Value %s accepted', test_values[i]));
            
            -- Cleanup
            EXECUTE format('DELETE FROM %I WHERE %I = %s', 
                         table_name, column_name, test_values[i]);
        EXCEPTION
            WHEN OTHERS THEN
                results := array_append(results, 
                    format('Value %s rejected: %s', test_values[i], SQLERRM));
        END;
    END LOOP;
    
    RETURN results;
END;
$$ LANGUAGE plpgsql;

-- Test NULL handling across all columns
CREATE OR REPLACE FUNCTION test_schema.test_null_handling(
    table_name TEXT
)
RETURNS TEXT[] AS $$
DECLARE
    results TEXT[] := ARRAY[]::TEXT[];
    col RECORD;
    test_result TEXT;
BEGIN
    -- Test NULL in each column
    FOR col IN 
        SELECT column_name, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = test_null_handling.table_name
        AND column_name NOT IN ('id', 'created_at', 'updated_at') -- Skip system columns
    LOOP
        BEGIN
            EXECUTE format('INSERT INTO %I (%I) VALUES (NULL)', table_name, col.column_name);
            
            IF col.is_nullable = 'YES' THEN
                test_result := format('Column %s correctly accepts NULL', col.column_name);
            ELSE
                test_result := format('Column %s should not accept NULL but did', col.column_name);
            END IF;
            
            -- Cleanup
            EXECUTE format('DELETE FROM %I WHERE %I IS NULL', table_name, col.column_name);
            
        EXCEPTION
            WHEN not_null_violation THEN
                IF col.is_nullable = 'NO' THEN
                    test_result := format('Column %s correctly rejects NULL', col.column_name);
                ELSE
                    test_result := format('Column %s should accept NULL but rejected it', col.column_name);
                END IF;
            WHEN OTHERS THEN
                test_result := format('Column %s NULL test error: %s', col.column_name, SQLERRM);
        END;
        
        results := array_append(results, test_result);
    END LOOP;
    
    RETURN results;
END;
$$ LANGUAGE plpgsql;

-- Test Unicode and special character handling
CREATE OR REPLACE FUNCTION test_schema.test_unicode_handling(
    table_name TEXT,
    text_column TEXT
)
RETURNS TEXT[] AS $$
DECLARE
    results TEXT[] := ARRAY[]::TEXT[];
    test_strings TEXT[] := ARRAY[
        'Regular ASCII text',
        'Ñoño español',
        '中文测试',
        'العربية',
        '🎉 Emoji test 🚀',
        E'Line\nBreak\tTest',
        'Special chars: ~!@#$%^&*()_+-={}[]|:";''<>?,./',
        repeat('a', 1000), -- Long string
        '', -- Empty string
        '   ', -- Whitespace only
        'null', -- String "null"
        'NULL' -- String "NULL"
    ];
    test_string TEXT;
    test_id UUID;
BEGIN
    -- Test each string
    FOREACH test_string IN ARRAY test_strings LOOP
        BEGIN
            -- Insert test data
            EXECUTE format('INSERT INTO %I (id, %I) VALUES (gen_random_uuid(), %L) RETURNING id', 
                         table_name, text_column, test_string) INTO test_id;
            
            results := array_append(results, 
                format('String "%s" accepted successfully', 
                       CASE WHEN length(test_string) > 50 THEN left(test_string, 50) || '...'
                            ELSE test_string END));
            
            -- Cleanup
            EXECUTE format('DELETE FROM %I WHERE id = %L', table_name, test_id);
            
        EXCEPTION
            WHEN OTHERS THEN
                results := array_append(results, 
                    format('String "%s" rejected: %s', 
                           CASE WHEN length(test_string) > 50 THEN left(test_string, 50) || '...'
                                ELSE test_string END, SQLERRM));
        END;
    END LOOP;
    
    RETURN results;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- RECOVERY TESTING HELPERS
-- =============================================================================

-- Simulate backup integrity check
CREATE OR REPLACE FUNCTION test_schema.test_backup_integrity(
    test_name TEXT
)
RETURNS TEXT AS $$
DECLARE
    checksum_before TEXT;
    checksum_after TEXT;
    temp_file TEXT;
BEGIN
    -- Create test data checksum
    SELECT md5(string_agg(row_data, ''))
    INTO checksum_before
    FROM (
        SELECT md5(t::text) as row_data
        FROM (
            SELECT * FROM user_submissions ORDER BY id
        ) t
    ) checksums;
    
    -- Simulate backup and restore process
    -- In a real scenario, this would involve actual backup/restore operations
    -- For testing purposes, we'll simulate by copying data
    EXECUTE format('CREATE TEMP TABLE backup_%s AS SELECT * FROM user_submissions', 
                   replace(test_name, '-', '_'));
    
    -- Simulate restore
    DELETE FROM user_submissions WHERE id IN (
        SELECT id FROM user_submissions LIMIT 5
    );
    
    EXECUTE format('INSERT INTO user_submissions SELECT * FROM backup_%s WHERE id NOT IN (SELECT id FROM user_submissions)', 
                   replace(test_name, '-', '_'));
    
    -- Create checksum after restore
    SELECT md5(string_agg(row_data, ''))
    INTO checksum_after
    FROM (
        SELECT md5(t::text) as row_data
        FROM (
            SELECT * FROM user_submissions ORDER BY id
        ) t
    ) checksums;
    
    -- Clean up temp table
    EXECUTE format('DROP TABLE backup_%s', replace(test_name, '-', '_'));
    
    IF checksum_before = checksum_after THEN
        RETURN format('Backup integrity test passed for %s', test_name);
    ELSE
        RETURN format('Backup integrity test failed for %s - checksums differ', test_name);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Test point-in-time recovery scenarios
CREATE OR REPLACE FUNCTION test_schema.test_pit_recovery(
    recovery_point TIMESTAMPTZ DEFAULT NOW() - INTERVAL '1 hour'
)
RETURNS TEXT AS $$
DECLARE
    records_before INTEGER;
    records_after INTEGER;
    recovery_target TEXT;
BEGIN
    -- Count records before simulated recovery point
    SELECT COUNT(*)
    INTO records_before
    FROM user_submissions
    WHERE created_at <= recovery_point;
    
    -- Simulate point-in-time recovery by removing records after recovery point
    DELETE FROM user_submissions WHERE created_at > recovery_point;
    
    -- Count records after simulated recovery
    SELECT COUNT(*) INTO records_after FROM user_submissions;
    
    recovery_target := to_char(recovery_point, 'YYYY-MM-DD HH24:MI:SS');
    
    RETURN format('PIT recovery simulation: %s records restored to point %s', 
                 records_after, recovery_target);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- MONITORING AND OBSERVABILITY HELPERS
-- =============================================================================

-- Create test execution metrics tracking
CREATE OR REPLACE FUNCTION test_schema.start_test_metrics(
    test_category TEXT,
    test_name TEXT
)
RETURNS UUID AS $$
DECLARE
    test_run_id UUID := gen_random_uuid();
BEGIN
    INSERT INTO test_schema.test_execution_metrics (
        test_run_id,
        test_category,
        test_name,
        start_time,
        database_size_before,
        active_connections_before
    )
    VALUES (
        test_run_id,
        test_category,
        test_name,
        clock_timestamp(),
        pg_database_size(current_database()),
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active')
    );
    
    RETURN test_run_id;
END;
$$ LANGUAGE plpgsql;

-- End test metrics collection
CREATE OR REPLACE FUNCTION test_schema.end_test_metrics(
    test_run_id UUID,
    test_result TEXT,
    error_message TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
BEGIN
    UPDATE test_schema.test_execution_metrics
    SET 
        end_time = clock_timestamp(),
        duration = clock_timestamp() - start_time,
        test_result = end_test_metrics.test_result,
        error_message = end_test_metrics.error_message,
        database_size_after = pg_database_size(current_database()),
        active_connections_after = (SELECT count(*) FROM pg_stat_activity WHERE state = 'active')
    WHERE test_execution_metrics.test_run_id = end_test_metrics.test_run_id;
    
    RETURN format('Test metrics recorded for run %s', test_run_id);
END;
$$ LANGUAGE plpgsql;

-- Generate test performance report
CREATE OR REPLACE FUNCTION test_schema.generate_performance_report(
    test_category TEXT DEFAULT NULL,
    since_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days'
)
RETURNS TABLE(
    category TEXT,
    test_name TEXT,
    total_runs BIGINT,
    success_rate NUMERIC,
    avg_duration INTERVAL,
    max_duration INTERVAL,
    avg_db_growth BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.test_category,
        m.test_name,
        COUNT(*) as total_runs,
        ROUND(
            (COUNT(*) FILTER (WHERE m.test_result = 'PASSED')::NUMERIC / COUNT(*)) * 100, 2
        ) as success_rate,
        AVG(m.duration) as avg_duration,
        MAX(m.duration) as max_duration,
        AVG(m.database_size_after - m.database_size_before) as avg_db_growth
    FROM test_schema.test_execution_metrics m
    WHERE (test_category IS NULL OR m.test_category = generate_performance_report.test_category)
    AND m.start_time >= since_date
    GROUP BY m.test_category, m.test_name
    ORDER BY m.test_category, avg_duration DESC;
END;
$$ LANGUAGE plpgsql;

-- Helper function to estimate row count efficiently
CREATE OR REPLACE FUNCTION test_schema.count_estimate(
    query TEXT
)
RETURNS BIGINT AS $$
DECLARE
    rec RECORD;
    rows BIGINT;
BEGIN
    FOR rec IN EXECUTE 'EXPLAIN ' || query LOOP
        rows := substring(rec."QUERY PLAN" FROM ' rows=([[:digit:]]+)')::BIGINT;
        EXIT WHEN rows IS NOT NULL;
    END LOOP;
    
    RETURN COALESCE(rows, 0);
END;
$$ LANGUAGE plpgsql;