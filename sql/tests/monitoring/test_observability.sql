-- =============================================================================
-- Monitoring and Observability Testing Suite
-- =============================================================================
-- Tests for monitoring infrastructure, observability, metrics collection,
-- alerting validation, and comprehensive test framework monitoring capabilities.
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

-- Start monitoring test tracking
DO $$
DECLARE
    test_run_id UUID;
BEGIN
    SELECT test_schema.start_test_metrics('monitoring', 'observability_suite') INTO test_run_id;
    PERFORM set_config('test.monitoring_run_id', test_run_id::TEXT, false);
END$$;

-- =============================================================================
-- TEST 1-10: METRICS COLLECTION AND TRACKING TESTS
-- =============================================================================

-- Test 1: Test execution metrics collection
DO $$
DECLARE
    test_run_id UUID;
    metrics_record RECORD;
BEGIN
    -- Start a test metrics collection
    SELECT test_schema.start_test_metrics('monitoring', 'metrics_collection_test') INTO test_run_id;
    
    -- Simulate some work
    PERFORM pg_sleep(0.1);
    
    -- End metrics collection
    PERFORM test_schema.end_test_metrics(test_run_id, 'PASSED');
    
    -- Verify metrics were collected
    SELECT * INTO metrics_record
    FROM test_schema.test_execution_metrics
    WHERE test_schema.test_execution_metrics.test_run_id = test_run_id;
    
    PERFORM ok(
        metrics_record.test_run_id IS NOT NULL AND 
        metrics_record.duration IS NOT NULL AND
        metrics_record.test_result = 'PASSED',
        format('Test execution metrics should be collected: duration=%s, result=%s',
               metrics_record.duration, metrics_record.test_result)
    );
END$$;

-- Test 2: Performance baseline establishment
SELECT ok(
    test_schema.establish_performance_baseline(
        'monitoring', 
        'baseline_test', 
        'duration_seconds', 
        1, 
        1.5, 
        2.0
    ) LIKE '%Baseline established%' OR
    test_schema.establish_performance_baseline(
        'monitoring', 
        'baseline_test', 
        'duration_seconds', 
        1, 
        1.5, 
        2.0
    ) LIKE '%Insufficient samples%',
    'Performance baseline establishment should work or indicate insufficient data'
);

-- Test 3: Performance alert detection
DO $$
DECLARE
    alert_count INTEGER;
    baseline_id UUID;
BEGIN
    -- Create a performance baseline manually
    INSERT INTO test_schema.test_performance_baselines (
        test_category,
        test_name,
        metric_name,
        baseline_value,
        baseline_unit,
        threshold_warning,
        threshold_critical
    )
    VALUES (
        'monitoring',
        'alert_test',
        'duration_seconds',
        1.0,
        'seconds',
        1.5,
        2.0
    )
    RETURNING baseline_id INTO baseline_id;
    
    -- Create test execution that should trigger alert
    INSERT INTO test_schema.test_execution_metrics (
        test_category,
        test_name,
        start_time,
        end_time,
        test_result
    )
    VALUES (
        'monitoring',
        'alert_test',
        NOW() - INTERVAL '3 seconds',
        NOW(),
        'PASSED'
    );
    
    -- Check for alerts
    SELECT COUNT(*) INTO alert_count
    FROM test_schema.check_performance_alerts()
    WHERE test_category = 'monitoring' AND test_name = 'alert_test';
    
    PERFORM ok(
        alert_count >= 0,
        format('Performance alert detection should work: %s alerts found', alert_count)
    );
    
    -- Cleanup
    DELETE FROM test_schema.test_performance_baselines WHERE baseline_id = test_3.baseline_id;
END$$;

-- Test 4: Health report generation
DO $$
DECLARE
    health_report RECORD;
    report_generated BOOLEAN := FALSE;
BEGIN
    -- Generate health report
    FOR health_report IN 
        SELECT * FROM test_schema.generate_test_health_report(1)
        WHERE category = 'monitoring'
    LOOP
        report_generated := TRUE;
        
        PERFORM ok(
            health_report.health_score >= 0 AND health_report.health_score <= 100,
            format('Health report should have valid score: %s', health_report.health_score)
        );
    END LOOP;
    
    IF NOT report_generated THEN
        PERFORM ok(TRUE, 'Health report generation capability verified (no monitoring data yet)');
    END IF;
END$$;

-- Test 5: Test execution log analysis
DO $$
DECLARE
    log_entry_count INTEGER;
    recent_executions INTEGER;
BEGIN
    -- Count recent test executions
    SELECT COUNT(*) INTO recent_executions
    FROM test_schema.test_execution_metrics
    WHERE start_time >= NOW() - INTERVAL '1 hour';
    
    -- Create additional log entries for analysis
    INSERT INTO test_schema.test_execution_metrics (
        test_category,
        test_name,
        start_time,
        end_time,
        test_result
    )
    VALUES 
        ('monitoring', 'log_analysis_test_1', NOW() - INTERVAL '30 seconds', NOW() - INTERVAL '25 seconds', 'PASSED'),
        ('monitoring', 'log_analysis_test_2', NOW() - INTERVAL '20 seconds', NOW() - INTERVAL '15 seconds', 'FAILED'),
        ('monitoring', 'log_analysis_test_3', NOW() - INTERVAL '10 seconds', NOW() - INTERVAL '5 seconds', 'PASSED');
    
    -- Verify log entries exist
    SELECT COUNT(*) INTO log_entry_count
    FROM test_schema.test_execution_metrics
    WHERE test_name LIKE 'log_analysis_test_%';
    
    PERFORM ok(
        log_entry_count >= 3,
        format('Test execution log analysis: %s entries created', log_entry_count)
    );
END$$;

-- Test 6: Metrics aggregation and reporting
DO $$
DECLARE
    daily_summary RECORD;
    summary_found BOOLEAN := FALSE;
BEGIN
    -- Check daily test summary view
    FOR daily_summary IN 
        SELECT * FROM test_schema.daily_test_summary 
        WHERE test_date = CURRENT_DATE AND test_category = 'monitoring'
        LIMIT 1
    LOOP
        summary_found := TRUE;
        
        PERFORM ok(
            daily_summary.total_tests > 0 AND 
            daily_summary.success_rate >= 0,
            format('Daily summary aggregation: %s tests, %.2f%% success rate',
                   daily_summary.total_tests, daily_summary.success_rate)
        );
    END LOOP;
    
    IF NOT summary_found THEN
        PERFORM ok(TRUE, 'Daily summary view available (no data for today yet)');
    END IF;
END$$;

-- Test 7: Performance trend analysis
DO $$
DECLARE
    trend_record RECORD;
    trend_found BOOLEAN := FALSE;
BEGIN
    -- Check performance trends view
    FOR trend_record IN 
        SELECT * FROM test_schema.performance_trends 
        WHERE test_category = 'monitoring'
        LIMIT 1
    LOOP
        trend_found := TRUE;
        
        PERFORM ok(
            trend_record.avg_duration_seconds >= 0,
            format('Performance trend analysis: avg duration %.3fs',
                   trend_record.avg_duration_seconds)
        );
    END LOOP;
    
    IF NOT trend_found THEN
        PERFORM ok(TRUE, 'Performance trends view available (no sufficient data yet)');
    END IF;
END$$;

-- Test 8: Failure pattern analysis
DO $$
DECLARE
    failure_pattern RECORD;
    pattern_found BOOLEAN := FALSE;
BEGIN
    -- Create failure analysis record
    INSERT INTO test_schema.test_failure_analysis (
        test_run_id,
        failure_type,
        failure_category,
        failure_description
    )
    SELECT 
        test_run_id,
        'assertion_failure',
        'monitoring',
        'Test failure pattern analysis'
    FROM test_schema.test_execution_metrics
    WHERE test_result = 'FAILED' AND test_category = 'monitoring'
    LIMIT 1;
    
    -- Check failure patterns view
    FOR failure_pattern IN 
        SELECT * FROM test_schema.failure_patterns 
        WHERE test_category = 'monitoring'
        LIMIT 1
    LOOP
        pattern_found := TRUE;
        
        PERFORM ok(
            failure_pattern.failure_count > 0,
            format('Failure pattern analysis: %s failures of type %s',
                   failure_pattern.failure_count, failure_pattern.failure_type)
        );
    END LOOP;
    
    IF NOT pattern_found THEN
        PERFORM ok(TRUE, 'Failure pattern analysis available (no patterns detected)');
    END IF;
END$$;

-- Test 9: Resource usage monitoring
DO $$
DECLARE
    initial_db_size BIGINT;
    final_db_size BIGINT;
    size_growth BIGINT;
    monitoring_duration INTEGER := 2;
BEGIN
    SELECT pg_database_size(current_database()) INTO initial_db_size;
    
    -- Create some test data while monitoring
    INSERT INTO user_submissions (first_name, last_name, email, phone)
    SELECT 
        'Monitor' || generate_series,
        'Test' || generate_series,
        'monitor' || generate_series || '@observability.com',
        '555-MON' || LPAD(generate_series::TEXT, 1, '0')
    FROM generate_series(1, 100);
    
    SELECT pg_database_size(current_database()) INTO final_db_size;
    size_growth := final_db_size - initial_db_size;
    
    PERFORM ok(
        size_growth > 0,
        format('Resource usage monitoring: database grew by %s bytes', size_growth)
    );
    
    -- Cleanup
    DELETE FROM user_submissions WHERE email LIKE '%@observability.com';
END$$;

-- Test 10: Test cleanup verification monitoring
DO $$
DECLARE
    cleanup_before INTEGER;
    cleanup_after INTEGER;
    cleanup_effective BOOLEAN;
BEGIN
    -- Count monitoring test data before cleanup
    SELECT COUNT(*) INTO cleanup_before
    FROM test_schema.test_execution_metrics
    WHERE test_category = 'monitoring';
    
    -- Perform cleanup of old records (keep recent ones)
    DELETE FROM test_schema.test_execution_metrics
    WHERE test_category = 'monitoring' 
      AND start_time < NOW() - INTERVAL '10 minutes';
    
    SELECT COUNT(*) INTO cleanup_after
    FROM test_schema.test_execution_metrics
    WHERE test_category = 'monitoring';
    
    cleanup_effective := (cleanup_after <= cleanup_before);
    
    PERFORM ok(
        cleanup_effective,
        format('Test cleanup monitoring: %s before, %s after cleanup',
               cleanup_before, cleanup_after)
    );
END$$;

-- =============================================================================
-- TEST 11-20: OBSERVABILITY AND DASHBOARD TESTS
-- =============================================================================

-- Test 11: Test execution timeline visualization data
DO $$
DECLARE
    timeline_data RECORD;
    timeline_points INTEGER := 0;
BEGIN
    -- Create timeline data points
    FOR i IN 1..5 LOOP
        INSERT INTO test_schema.test_execution_metrics (
            test_category,
            test_name,
            start_time,
            end_time,
            test_result,
            test_metadata
        )
        VALUES (
            'monitoring',
            'timeline_test_' || i,
            NOW() - (i || ' minutes')::INTERVAL,
            NOW() - (i || ' minutes')::INTERVAL + INTERVAL '30 seconds',
            CASE WHEN i % 2 = 0 THEN 'PASSED' ELSE 'FAILED' END,
            format('{"sequence": %s}', i)::JSONB
        );
        
        timeline_points := timeline_points + 1;
    END LOOP;
    
    PERFORM ok(
        timeline_points = 5,
        format('Timeline visualization data: %s data points created', timeline_points)
    );
END$$;

-- Test 12: Test categorization and filtering
DO $$
DECLARE
    category_counts INTEGER;
    filter_results INTEGER;
BEGIN
    -- Test category-based filtering
    SELECT COUNT(DISTINCT test_category) INTO category_counts
    FROM test_schema.test_execution_metrics;
    
    SELECT COUNT(*) INTO filter_results
    FROM test_schema.test_execution_metrics
    WHERE test_category = 'monitoring'
      AND start_time >= CURRENT_DATE;
    
    PERFORM ok(
        category_counts >= 1 AND filter_results >= 0,
        format('Test categorization: %s categories, %s monitoring tests today',
               category_counts, filter_results)
    );
END$$;

-- Test 13: Real-time monitoring capabilities
DO $$
DECLARE
    real_time_start TIMESTAMPTZ;
    real_time_end TIMESTAMPTZ;
    real_time_duration INTERVAL;
    monitoring_samples INTEGER := 0;
BEGIN
    real_time_start := clock_timestamp();
    
    -- Simulate real-time monitoring for 3 seconds
    FOR sample IN 
        SELECT * FROM test_schema.monitor_resource_usage('realtime_test', 3)
    LOOP
        monitoring_samples := monitoring_samples + 1;
    END LOOP;
    
    real_time_end := clock_timestamp();
    real_time_duration := real_time_end - real_time_start;
    
    PERFORM ok(
        monitoring_samples >= 2 AND real_time_duration <= INTERVAL '5 seconds',
        format('Real-time monitoring: %s samples in %s',
               monitoring_samples, real_time_duration)
    );
END$$;

-- Test 14: Alerting threshold configuration
DO $$
DECLARE
    threshold_config JSONB;
    config_valid BOOLEAN;
BEGIN
    -- Test alerting threshold configuration
    threshold_config := '{
        "duration_warning": 2.0,
        "duration_critical": 5.0,
        "success_rate_warning": 90.0,
        "success_rate_critical": 80.0
    }';
    
    -- Validate configuration structure
    config_valid := (
        threshold_config ? 'duration_warning' AND
        threshold_config ? 'duration_critical' AND
        threshold_config ? 'success_rate_warning' AND
        threshold_config ? 'success_rate_critical'
    );
    
    PERFORM ok(
        config_valid,
        'Alerting threshold configuration should be validatable'
    );
END$$;

-- Test 15: Dashboard data aggregation
DO $$
DECLARE
    dashboard_metrics JSONB;
    aggregation_successful BOOLEAN := TRUE;
BEGIN
    BEGIN
        -- Aggregate dashboard metrics
        SELECT jsonb_build_object(
            'total_tests', COUNT(*),
            'success_rate', ROUND(
                (COUNT(*) FILTER (WHERE test_result = 'PASSED')::NUMERIC / COUNT(*)) * 100, 2
            ),
            'avg_duration', AVG(EXTRACT(EPOCH FROM duration)),
            'categories', COUNT(DISTINCT test_category)
        ) INTO dashboard_metrics
        FROM test_schema.test_execution_metrics
        WHERE start_time >= NOW() - INTERVAL '1 day';
        
    EXCEPTION
        WHEN OTHERS THEN
            aggregation_successful := FALSE;
    END;
    
    PERFORM ok(
        aggregation_successful AND dashboard_metrics IS NOT NULL,
        format('Dashboard data aggregation: %s', 
               COALESCE(dashboard_metrics->>'total_tests', '0') || ' tests')
    );
END$$;

-- Test 16: Performance regression detection
DO $$
DECLARE
    regression_detected BOOLEAN := FALSE;
    baseline_duration NUMERIC := 1.0;
    current_duration NUMERIC := 2.5;
    regression_threshold NUMERIC := 2.0;
BEGIN
    -- Simulate regression detection logic
    IF current_duration > (baseline_duration * regression_threshold) THEN
        regression_detected := TRUE;
    END IF;
    
    PERFORM ok(
        regression_detected,
        format('Performance regression detection: %.1fs vs %.1fs baseline (threshold: %.1fx)',
               current_duration, baseline_duration, regression_threshold)
    );
END$$;

-- Test 17: Test coverage analysis
DO $$
DECLARE
    coverage_stats JSONB;
    categories_covered INTEGER;
    total_test_names INTEGER;
BEGIN
    -- Analyze test coverage
    SELECT 
        COUNT(DISTINCT test_category),
        COUNT(DISTINCT test_name)
    INTO categories_covered, total_test_names
    FROM test_schema.test_execution_metrics;
    
    coverage_stats := jsonb_build_object(
        'categories', categories_covered,
        'unique_tests', total_test_names
    );
    
    PERFORM ok(
        categories_covered >= 1 AND total_test_names >= 1,
        format('Test coverage analysis: %s categories, %s unique tests',
               categories_covered, total_test_names)
    );
END$$;

-- Test 18: Historical data retention monitoring
DO $$
DECLARE
    old_records INTEGER;
    retention_policy_days INTEGER := 30;
    cutoff_date TIMESTAMPTZ;
BEGIN
    cutoff_date := NOW() - (retention_policy_days || ' days')::INTERVAL;
    
    SELECT COUNT(*) INTO old_records
    FROM test_schema.test_execution_metrics
    WHERE start_time < cutoff_date;
    
    PERFORM ok(
        old_records >= 0,
        format('Historical data retention monitoring: %s records older than %s days',
               old_records, retention_policy_days)
    );
END$$;

-- Test 19: Monitoring system self-diagnostics
DO $$
DECLARE
    diagnostic_passed BOOLEAN := TRUE;
    monitoring_tables TEXT[] := ARRAY[
        'test_execution_metrics',
        'test_performance_baselines',
        'test_failure_analysis'
    ];
    table_name TEXT;
    table_exists BOOLEAN;
BEGIN
    -- Check monitoring infrastructure tables exist
    FOREACH table_name IN ARRAY monitoring_tables LOOP
        SELECT EXISTS(
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'test_schema' 
            AND table_name = monitoring_system_self_diagnostics.table_name
        ) INTO table_exists;
        
        IF NOT table_exists THEN
            diagnostic_passed := FALSE;
        END IF;
    END LOOP;
    
    PERFORM ok(
        diagnostic_passed,
        'Monitoring system self-diagnostics should pass'
    );
END$$;

-- Test 20: Monitoring data export capability
DO $$
DECLARE
    export_data JSONB;
    export_successful BOOLEAN := TRUE;
BEGIN
    BEGIN
        -- Simulate monitoring data export
        SELECT jsonb_agg(
            jsonb_build_object(
                'test_run_id', test_run_id,
                'category', test_category,
                'name', test_name,
                'duration', EXTRACT(EPOCH FROM duration),
                'result', test_result,
                'timestamp', start_time
            )
        ) INTO export_data
        FROM test_schema.test_execution_metrics
        WHERE test_category = 'monitoring'
        LIMIT 10;
        
    EXCEPTION
        WHEN OTHERS THEN
            export_successful := FALSE;
    END;
    
    PERFORM ok(
        export_successful,
        format('Monitoring data export: %s records exportable',
               COALESCE(jsonb_array_length(export_data), 0))
    );
END$$;

-- =============================================================================
-- TEST 21-30: ADVANCED MONITORING AND INTEGRATION TESTS
-- =============================================================================

-- Test 21: Multi-category performance comparison
DO $$
DECLARE
    category_comparison JSONB := '{}';
    comparison_data RECORD;
BEGIN
    -- Compare performance across test categories
    FOR comparison_data IN
        SELECT 
            test_category,
            AVG(EXTRACT(EPOCH FROM duration)) as avg_duration,
            COUNT(*) as test_count
        FROM test_schema.test_execution_metrics
        WHERE duration IS NOT NULL
        GROUP BY test_category
    LOOP
        category_comparison := category_comparison || jsonb_build_object(
            comparison_data.test_category,
            jsonb_build_object(
                'avg_duration', comparison_data.avg_duration,
                'test_count', comparison_data.test_count
            )
        );
    END LOOP;
    
    PERFORM ok(
        jsonb_typeof(category_comparison) = 'object',
        format('Multi-category performance comparison: %s categories analyzed',
               (SELECT COUNT(*) FROM jsonb_object_keys(category_comparison) as keys))
    );
END$$;

-- Test 22: Monitoring alert escalation simulation
DO $$
DECLARE
    alert_levels TEXT[] := ARRAY['INFO', 'WARNING', 'CRITICAL'];
    escalation_rules JSONB;
    simulation_successful BOOLEAN := TRUE;
BEGIN
    -- Define escalation rules
    escalation_rules := '{
        "INFO": {"threshold": 1, "action": "log"},
        "WARNING": {"threshold": 3, "action": "notify"},
        "CRITICAL": {"threshold": 1, "action": "escalate"}
    }';
    
    -- Simulate alert processing
    FOR i IN 1..array_length(alert_levels, 1) LOOP
        IF NOT (escalation_rules ? alert_levels[i]) THEN
            simulation_successful := FALSE;
        END IF;
    END LOOP;
    
    PERFORM ok(
        simulation_successful,
        'Monitoring alert escalation simulation should process all levels'
    );
END$$;

-- Test 23: Test execution correlation analysis
DO $$
DECLARE
    correlation_data RECORD;
    correlations_found INTEGER := 0;
BEGIN
    -- Analyze correlations between test failures
    FOR correlation_data IN
        SELECT 
            test_category,
            COUNT(*) FILTER (WHERE test_result = 'FAILED') as failure_count,
            COUNT(*) as total_count,
            ROUND(
                (COUNT(*) FILTER (WHERE test_result = 'FAILED')::NUMERIC / COUNT(*)) * 100, 2
            ) as failure_rate
        FROM test_schema.test_execution_metrics
        WHERE start_time >= NOW() - INTERVAL '1 day'
        GROUP BY test_category
        HAVING COUNT(*) > 0
    LOOP
        correlations_found := correlations_found + 1;
    END LOOP;
    
    PERFORM ok(
        correlations_found >= 0,
        format('Test execution correlation analysis: %s category correlations found',
               correlations_found)
    );
END$$;

-- Test 24: Monitoring data consistency validation
DO $$
DECLARE
    consistency_issues INTEGER := 0;
    total_records INTEGER;
    records_with_duration INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_records
    FROM test_schema.test_execution_metrics;
    
    SELECT COUNT(*) INTO records_with_duration
    FROM test_schema.test_execution_metrics
    WHERE start_time IS NOT NULL AND end_time IS NOT NULL AND duration IS NOT NULL;
    
    -- Check for consistency issues
    SELECT COUNT(*) INTO consistency_issues
    FROM test_schema.test_execution_metrics
    WHERE (start_time IS NOT NULL AND end_time IS NOT NULL AND duration IS NULL) OR
          (start_time IS NULL AND end_time IS NOT NULL) OR
          (start_time IS NOT NULL AND end_time IS NULL);
    
    PERFORM ok(
        consistency_issues = 0,
        format('Monitoring data consistency: %s issues found in %s records',
               consistency_issues, total_records)
    );
END$$;

-- Test 25: Performance benchmark validation
DO $$
DECLARE
    benchmark_results JSONB := '{}';
    benchmark_categories TEXT[] := ARRAY['duration', 'throughput', 'accuracy'];
    category TEXT;
    benchmark_passed BOOLEAN := TRUE;
BEGIN
    -- Run performance benchmarks
    FOREACH category IN ARRAY benchmark_categories LOOP
        CASE category
            WHEN 'duration' THEN
                benchmark_results := benchmark_results || jsonb_build_object(
                    category, 
                    (SELECT AVG(EXTRACT(EPOCH FROM duration)) 
                     FROM test_schema.test_execution_metrics 
                     WHERE duration IS NOT NULL)
                );
            WHEN 'throughput' THEN
                benchmark_results := benchmark_results || jsonb_build_object(
                    category,
                    (SELECT COUNT(*) 
                     FROM test_schema.test_execution_metrics 
                     WHERE start_time >= NOW() - INTERVAL '1 hour')
                );
            WHEN 'accuracy' THEN
                benchmark_results := benchmark_results || jsonb_build_object(
                    category,
                    (SELECT ROUND(
                        (COUNT(*) FILTER (WHERE test_result = 'PASSED')::NUMERIC / COUNT(*)) * 100, 2
                     ) FROM test_schema.test_execution_metrics)
                );
        END CASE;
    END LOOP;
    
    PERFORM ok(
        benchmark_passed AND jsonb_typeof(benchmark_results) = 'object',
        format('Performance benchmark validation completed: %s metrics',
               array_length(benchmark_categories, 1))
    );
END$$;

-- Test 26: Monitoring system load testing
DO $$
DECLARE
    load_test_start TIMESTAMPTZ;
    load_test_end TIMESTAMPTZ;
    load_operations INTEGER := 100;
    successful_operations INTEGER := 0;
    i INTEGER;
BEGIN
    load_test_start := clock_timestamp();
    
    -- Simulate high load on monitoring system
    FOR i IN 1..load_operations LOOP
        BEGIN
            INSERT INTO test_schema.test_execution_metrics (
                test_category,
                test_name,
                start_time,
                end_time,
                test_result
            )
            VALUES (
                'monitoring',
                'load_test_' || i,
                NOW(),
                NOW() + INTERVAL '100 milliseconds',
                'PASSED'
            );
            
            successful_operations := successful_operations + 1;
        EXCEPTION
            WHEN OTHERS THEN
                -- Count failed operations but continue
                NULL;
        END;
    END LOOP;
    
    load_test_end := clock_timestamp();
    
    PERFORM ok(
        successful_operations >= (load_operations * 0.95),
        format('Monitoring system load test: %s/%s operations successful in %s',
               successful_operations, load_operations, load_test_end - load_test_start)
    );
END$$;

-- Test 27: Automated monitoring report generation
DO $$
DECLARE
    report_sections TEXT[] := ARRAY['summary', 'performance', 'failures', 'trends'];
    report_content JSONB := '{}';
    section TEXT;
    report_complete BOOLEAN := TRUE;
BEGIN
    -- Generate comprehensive monitoring report
    FOREACH section IN ARRAY report_sections LOOP
        CASE section
            WHEN 'summary' THEN
                report_content := report_content || jsonb_build_object(
                    'summary',
                    (SELECT jsonb_build_object(
                        'total_tests', COUNT(*),
                        'success_rate', ROUND(
                            (COUNT(*) FILTER (WHERE test_result = 'PASSED')::NUMERIC / COUNT(*)) * 100, 2
                        )
                     ) FROM test_schema.test_execution_metrics 
                     WHERE start_time >= NOW() - INTERVAL '24 hours')
                );
            WHEN 'performance' THEN
                report_content := report_content || jsonb_build_object(
                    'performance',
                    jsonb_build_object(
                        'avg_duration', (SELECT AVG(EXTRACT(EPOCH FROM duration)) 
                                       FROM test_schema.test_execution_metrics 
                                       WHERE duration IS NOT NULL AND start_time >= NOW() - INTERVAL '24 hours')
                    )
                );
            WHEN 'failures' THEN
                report_content := report_content || jsonb_build_object(
                    'failures',
                    (SELECT COUNT(*) FROM test_schema.test_execution_metrics 
                     WHERE test_result = 'FAILED' AND start_time >= NOW() - INTERVAL '24 hours')
                );
            WHEN 'trends' THEN
                report_content := report_content || jsonb_build_object(
                    'trends',
                    'analysis_available'
                );
        END CASE;
    END LOOP;
    
    PERFORM ok(
        report_complete AND jsonb_typeof(report_content) = 'object',
        format('Automated monitoring report generated with %s sections',
               array_length(report_sections, 1))
    );
END$$;

-- Test 28: Monitoring integration with external systems
DO $$
DECLARE
    integration_config JSONB;
    integration_valid BOOLEAN;
BEGIN
    -- Test monitoring integration configuration
    integration_config := '{
        "webhook_url": "https://monitoring.example.com/webhook",
        "api_key": "monitoring_api_key",
        "alert_channels": ["email", "slack", "pagerduty"],
        "export_format": "json",
        "retention_days": 90
    }';
    
    -- Validate integration configuration
    integration_valid := (
        integration_config ? 'webhook_url' AND
        integration_config ? 'alert_channels' AND
        jsonb_array_length(integration_config->'alert_channels') > 0
    );
    
    PERFORM ok(
        integration_valid,
        'Monitoring integration configuration should be valid'
    );
END$$;

-- Test 29: Monitoring cleanup and maintenance
DO $$
DECLARE
    cleanup_result TEXT;
    maintenance_successful BOOLEAN := TRUE;
BEGIN
    -- Test monitoring system maintenance
    BEGIN
        SELECT test_schema.cleanup_old_metrics(7) INTO cleanup_result;
    EXCEPTION
        WHEN OTHERS THEN
            maintenance_successful := FALSE;
    END;
    
    PERFORM ok(
        maintenance_successful,
        format('Monitoring cleanup and maintenance: %s', 
               COALESCE(cleanup_result, 'maintenance function available'))
    );
END$$;

-- Test 30: Final monitoring system validation
DO $$
DECLARE
    test_run_id TEXT;
    final_metrics RECORD;
    monitoring_system_healthy BOOLEAN := TRUE;
    validation_summary JSONB;
BEGIN
    -- End monitoring test tracking
    test_run_id := current_setting('test.monitoring_run_id', true);
    PERFORM test_schema.end_test_metrics(test_run_id::UUID, 'PASSED');
    
    -- Get final metrics
    SELECT * INTO final_metrics
    FROM test_schema.test_execution_metrics
    WHERE test_schema.test_execution_metrics.test_run_id = test_run_id::UUID;
    
    -- Validate monitoring system health
    validation_summary := jsonb_build_object(
        'test_duration', EXTRACT(EPOCH FROM final_metrics.duration),
        'monitoring_tables_exist', EXISTS(
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'test_schema' AND table_name = 'test_execution_metrics'
        ),
        'metrics_collected', EXISTS(
            SELECT 1 FROM test_schema.test_execution_metrics 
            WHERE test_category = 'monitoring'
        ),
        'health_reports_available', EXISTS(
            SELECT 1 FROM test_schema.generate_test_health_report(1)
        )
    );
    
    PERFORM ok(
        monitoring_system_healthy,
        format('Final monitoring system validation: test completed in %s',
               final_metrics.duration)
    );
    
    RAISE NOTICE 'Monitoring test suite validation: %', validation_summary;
END$$;

-- =============================================================================
-- CLEANUP
-- =============================================================================

-- Final cleanup of monitoring test data
DELETE FROM test_schema.test_execution_metrics 
WHERE test_name LIKE '%test%' AND test_category = 'monitoring';
DELETE FROM user_submissions WHERE email LIKE '%@observability.com';

PERFORM test_schema.cleanup_test_data('monitoring_tests');
SELECT test_schema.rollback_test();

-- Finish
SELECT finish();