-- =============================================================================
-- Test Monitoring Infrastructure
-- =============================================================================
-- Creates monitoring tables and functions for comprehensive test observability
-- and performance tracking across all test categories.
-- =============================================================================

-- Set search path
SET search_path TO test_schema, public, pg_catalog;

-- =============================================================================
-- TEST EXECUTION METRICS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS test_schema.test_execution_metrics (
    test_run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_category TEXT NOT NULL CHECK (test_category IN (
        'unit', 'integration', 'performance', 'security', 
        'migration', 'stress', 'regression', 'edge', 'recovery', 'monitoring'
    )),
    test_name TEXT NOT NULL,
    test_file TEXT,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    duration INTERVAL GENERATED ALWAYS AS (end_time - start_time) STORED,
    test_result TEXT CHECK (test_result IN ('PASSED', 'FAILED', 'SKIPPED', 'ERROR')),
    error_message TEXT,
    error_code TEXT,
    
    -- Resource metrics
    database_size_before BIGINT,
    database_size_after BIGINT,
    database_growth BIGINT GENERATED ALWAYS AS (database_size_after - database_size_before) STORED,
    active_connections_before INTEGER,
    active_connections_after INTEGER,
    
    -- Performance metrics
    cpu_time_ms NUMERIC,
    memory_usage_kb NUMERIC,
    disk_io_reads BIGINT,
    disk_io_writes BIGINT,
    
    -- Test-specific metadata
    test_metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_test_execution_metrics_category_time 
    ON test_schema.test_execution_metrics(test_category, start_time);
CREATE INDEX IF NOT EXISTS idx_test_execution_metrics_result_time 
    ON test_schema.test_execution_metrics(test_result, start_time);
CREATE INDEX IF NOT EXISTS idx_test_execution_metrics_duration 
    ON test_schema.test_execution_metrics(duration) WHERE duration IS NOT NULL;

-- =============================================================================
-- TEST PERFORMANCE BASELINES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS test_schema.test_performance_baselines (
    baseline_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_category TEXT NOT NULL,
    test_name TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    baseline_value NUMERIC NOT NULL,
    baseline_unit TEXT NOT NULL,
    threshold_warning NUMERIC, -- Warning threshold (e.g., 1.5x baseline)
    threshold_critical NUMERIC, -- Critical threshold (e.g., 2x baseline)
    established_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    established_by TEXT DEFAULT current_user,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Metadata
    baseline_metadata JSONB DEFAULT '{}',
    
    UNIQUE(test_category, test_name, metric_name, is_active) 
        DEFERRABLE INITIALLY DEFERRED
);

-- =============================================================================
-- TEST FAILURE ANALYSIS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS test_schema.test_failure_analysis (
    failure_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_run_id UUID NOT NULL REFERENCES test_schema.test_execution_metrics(test_run_id),
    failure_type TEXT NOT NULL CHECK (failure_type IN (
        'assertion_failure', 'performance_degradation', 'timeout', 
        'resource_exhaustion', 'data_corruption', 'constraint_violation',
        'schema_mismatch', 'connection_error', 'unknown'
    )),
    failure_category TEXT NOT NULL,
    failure_description TEXT NOT NULL,
    failure_stack_trace TEXT,
    
    -- Failure context
    database_state_snapshot JSONB,
    system_metrics_snapshot JSONB,
    related_failures UUID[], -- Array of related failure IDs
    
    -- Investigation status
    investigation_status TEXT DEFAULT 'new' CHECK (investigation_status IN (
        'new', 'investigating', 'root_cause_found', 'resolved', 'false_positive'
    )),
    assigned_to TEXT,
    resolution_notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TEST TRENDS AND ANALYTICS VIEWS
-- =============================================================================

-- Daily test execution summary
CREATE OR REPLACE VIEW test_schema.daily_test_summary AS
SELECT 
    DATE(start_time) as test_date,
    test_category,
    COUNT(*) as total_tests,
    COUNT(*) FILTER (WHERE test_result = 'PASSED') as passed_tests,
    COUNT(*) FILTER (WHERE test_result = 'FAILED') as failed_tests,
    COUNT(*) FILTER (WHERE test_result = 'ERROR') as error_tests,
    ROUND(
        (COUNT(*) FILTER (WHERE test_result = 'PASSED')::NUMERIC / COUNT(*)) * 100, 2
    ) as success_rate,
    AVG(EXTRACT(EPOCH FROM duration)) as avg_duration_seconds,
    MAX(EXTRACT(EPOCH FROM duration)) as max_duration_seconds,
    MIN(EXTRACT(EPOCH FROM duration)) as min_duration_seconds,
    SUM(database_growth) as total_db_growth
FROM test_schema.test_execution_metrics
WHERE start_time >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(start_time), test_category
ORDER BY test_date DESC, test_category;

-- Performance trend analysis view
CREATE OR REPLACE VIEW test_schema.performance_trends AS
SELECT 
    test_category,
    test_name,
    DATE_TRUNC('day', start_time) as trend_date,
    COUNT(*) as execution_count,
    AVG(EXTRACT(EPOCH FROM duration)) as avg_duration_seconds,
    STDDEV(EXTRACT(EPOCH FROM duration)) as duration_stddev,
    MIN(EXTRACT(EPOCH FROM duration)) as min_duration_seconds,
    MAX(EXTRACT(EPOCH FROM duration)) as max_duration_seconds,
    
    -- Performance degradation indicators
    AVG(EXTRACT(EPOCH FROM duration)) - 
        LAG(AVG(EXTRACT(EPOCH FROM duration))) OVER (
            PARTITION BY test_category, test_name 
            ORDER BY DATE_TRUNC('day', start_time)
        ) as duration_change_from_prev_day,
        
    -- Resource usage trends
    AVG(database_growth) as avg_db_growth,
    AVG(active_connections_after - active_connections_before) as avg_connection_change
    
FROM test_schema.test_execution_metrics
WHERE start_time >= CURRENT_DATE - INTERVAL '30 days'
  AND duration IS NOT NULL
GROUP BY test_category, test_name, DATE_TRUNC('day', start_time)
ORDER BY test_category, test_name, trend_date DESC;

-- Failure pattern analysis view
CREATE OR REPLACE VIEW test_schema.failure_patterns AS
SELECT 
    test_category,
    failure_type,
    DATE_TRUNC('week', m.start_time) as failure_week,
    COUNT(*) as failure_count,
    COUNT(DISTINCT m.test_name) as affected_tests,
    array_agg(DISTINCT m.test_name ORDER BY m.test_name) as failing_tests,
    
    -- Common error patterns
    COUNT(*) FILTER (WHERE m.error_message LIKE '%timeout%') as timeout_failures,
    COUNT(*) FILTER (WHERE m.error_message LIKE '%connection%') as connection_failures,
    COUNT(*) FILTER (WHERE m.error_message LIKE '%constraint%') as constraint_failures,
    COUNT(*) FILTER (WHERE m.error_message LIKE '%permission%') as permission_failures,
    
    -- Investigation status
    COUNT(*) FILTER (WHERE f.investigation_status = 'resolved') as resolved_count,
    COUNT(*) FILTER (WHERE f.investigation_status = 'new') as unresolved_count
    
FROM test_schema.test_execution_metrics m
JOIN test_schema.test_failure_analysis f ON m.test_run_id = f.test_run_id
WHERE m.start_time >= CURRENT_DATE - INTERVAL '8 weeks'
  AND m.test_result IN ('FAILED', 'ERROR')
GROUP BY test_category, failure_type, DATE_TRUNC('week', m.start_time)
ORDER BY failure_week DESC, failure_count DESC;

-- =============================================================================
-- MONITORING FUNCTIONS
-- =============================================================================

-- Alert function for performance degradation
CREATE OR REPLACE FUNCTION test_schema.check_performance_alerts()
RETURNS TABLE(
    alert_type TEXT,
    test_category TEXT,
    test_name TEXT,
    current_value NUMERIC,
    baseline_value NUMERIC,
    threshold_exceeded TEXT,
    severity TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_metrics AS (
        SELECT 
            m.test_category,
            m.test_name,
            AVG(EXTRACT(EPOCH FROM m.duration)) as avg_duration,
            MAX(EXTRACT(EPOCH FROM m.duration)) as max_duration,
            COUNT(*) as recent_runs
        FROM test_schema.test_execution_metrics m
        WHERE m.start_time >= NOW() - INTERVAL '24 hours'
          AND m.test_result = 'PASSED'
          AND m.duration IS NOT NULL
        GROUP BY m.test_category, m.test_name
        HAVING COUNT(*) >= 3 -- Only alert if we have enough samples
    ),
    baseline_comparison AS (
        SELECT 
            rm.test_category,
            rm.test_name,
            rm.avg_duration,
            rm.max_duration,
            b.baseline_value,
            b.threshold_warning,
            b.threshold_critical,
            CASE 
                WHEN rm.avg_duration > b.threshold_critical * b.baseline_value THEN 'CRITICAL'
                WHEN rm.avg_duration > b.threshold_warning * b.baseline_value THEN 'WARNING'
                ELSE 'OK'
            END as alert_severity
        FROM recent_metrics rm
        JOIN test_schema.test_performance_baselines b ON (
            rm.test_category = b.test_category 
            AND rm.test_name = b.test_name 
            AND b.metric_name = 'duration_seconds'
            AND b.is_active = TRUE
        )
    )
    SELECT 
        'PERFORMANCE_DEGRADATION'::TEXT,
        bc.test_category,
        bc.test_name,
        bc.avg_duration,
        bc.baseline_value,
        CASE 
            WHEN bc.avg_duration > bc.threshold_critical * bc.baseline_value THEN 'CRITICAL'
            WHEN bc.avg_duration > bc.threshold_warning * bc.baseline_value THEN 'WARNING'
        END,
        bc.alert_severity
    FROM baseline_comparison bc
    WHERE bc.alert_severity IN ('WARNING', 'CRITICAL');
END;
$$ LANGUAGE plpgsql;

-- Function to establish performance baselines
CREATE OR REPLACE FUNCTION test_schema.establish_performance_baseline(
    p_test_category TEXT,
    p_test_name TEXT,
    p_metric_name TEXT DEFAULT 'duration_seconds',
    p_days_lookback INTEGER DEFAULT 7,
    p_warning_multiplier NUMERIC DEFAULT 1.5,
    p_critical_multiplier NUMERIC DEFAULT 2.0
)
RETURNS TEXT AS $$
DECLARE
    baseline_value NUMERIC;
    samples_count INTEGER;
BEGIN
    -- Calculate baseline from recent successful runs
    SELECT 
        AVG(EXTRACT(EPOCH FROM duration)),
        COUNT(*)
    INTO baseline_value, samples_count
    FROM test_schema.test_execution_metrics
    WHERE test_category = p_test_category
      AND test_name = p_test_name
      AND test_result = 'PASSED'
      AND start_time >= NOW() - (p_days_lookback || ' days')::INTERVAL
      AND duration IS NOT NULL;
    
    -- Require minimum samples
    IF samples_count < 5 THEN
        RETURN format('Insufficient samples (%s) for baseline establishment. Need at least 5.', 
                     samples_count);
    END IF;
    
    -- Deactivate existing baseline
    UPDATE test_schema.test_performance_baselines
    SET is_active = FALSE
    WHERE test_category = p_test_category
      AND test_name = p_test_name
      AND metric_name = p_metric_name
      AND is_active = TRUE;
    
    -- Insert new baseline
    INSERT INTO test_schema.test_performance_baselines (
        test_category,
        test_name,
        metric_name,
        baseline_value,
        baseline_unit,
        threshold_warning,
        threshold_critical,
        baseline_metadata
    )
    VALUES (
        p_test_category,
        p_test_name,
        p_metric_name,
        baseline_value,
        'seconds',
        p_warning_multiplier,
        p_critical_multiplier,
        jsonb_build_object(
            'samples_count', samples_count,
            'lookback_days', p_days_lookback,
            'established_timestamp', NOW()
        )
    );
    
    RETURN format('Baseline established for %s.%s: %.2f seconds (based on %s samples)', 
                 p_test_category, p_test_name, baseline_value, samples_count);
END;
$$ LANGUAGE plpgsql;

-- Function to generate comprehensive test health report
CREATE OR REPLACE FUNCTION test_schema.generate_test_health_report(
    p_days_lookback INTEGER DEFAULT 7
)
RETURNS TABLE(
    category TEXT,
    total_tests BIGINT,
    unique_test_names BIGINT,
    success_rate NUMERIC,
    avg_duration_seconds NUMERIC,
    failed_tests BIGINT,
    error_tests BIGINT,
    performance_alerts INTEGER,
    health_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH test_stats AS (
        SELECT 
            m.test_category,
            COUNT(*) as total_runs,
            COUNT(DISTINCT m.test_name) as unique_tests,
            COUNT(*) FILTER (WHERE m.test_result = 'PASSED') as passed_runs,
            COUNT(*) FILTER (WHERE m.test_result = 'FAILED') as failed_runs,
            COUNT(*) FILTER (WHERE m.test_result = 'ERROR') as error_runs,
            AVG(EXTRACT(EPOCH FROM m.duration)) as avg_duration
        FROM test_schema.test_execution_metrics m
        WHERE m.start_time >= NOW() - (p_days_lookback || ' days')::INTERVAL
        GROUP BY m.test_category
    ),
    alert_stats AS (
        SELECT 
            a.test_category,
            COUNT(*) as alert_count
        FROM test_schema.check_performance_alerts() a
        GROUP BY a.test_category
    )
    SELECT 
        ts.test_category,
        ts.total_runs,
        ts.unique_tests,
        ROUND((ts.passed_runs::NUMERIC / ts.total_runs) * 100, 2) as success_rate,
        ROUND(ts.avg_duration, 3) as avg_duration_seconds,
        ts.failed_runs,
        ts.error_runs,
        COALESCE(als.alert_count, 0)::INTEGER as performance_alerts,
        
        -- Health score calculation (0-100)
        ROUND(
            LEAST(100, 
                (ts.passed_runs::NUMERIC / ts.total_runs) * 100 * 0.6 + -- 60% weight on success rate
                GREATEST(0, 100 - (COALESCE(als.alert_count, 0) * 10)) * 0.2 + -- 20% weight on performance
                CASE WHEN ts.avg_duration <= 5 THEN 100 
                     WHEN ts.avg_duration <= 30 THEN 80
                     WHEN ts.avg_duration <= 60 THEN 60
                     ELSE 40 END * 0.2 -- 20% weight on speed
            ), 
        2) as health_score
        
    FROM test_stats ts
    LEFT JOIN alert_stats als ON ts.test_category = als.test_category
    ORDER BY health_score DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CLEANUP AND MAINTENANCE FUNCTIONS
-- =============================================================================

-- Cleanup old metrics (keep last 30 days by default)
CREATE OR REPLACE FUNCTION test_schema.cleanup_old_metrics(
    retention_days INTEGER DEFAULT 30
)
RETURNS TEXT AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM test_schema.test_execution_metrics
    WHERE start_time < NOW() - (retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Also cleanup related failure analysis records
    DELETE FROM test_schema.test_failure_analysis
    WHERE test_run_id NOT IN (
        SELECT test_run_id FROM test_schema.test_execution_metrics
    );
    
    RETURN format('Cleaned up %s old metric records older than %s days', 
                 deleted_count, retention_days);
END;
$$ LANGUAGE plpgsql;

-- Function to archive metrics to external storage (placeholder)
CREATE OR REPLACE FUNCTION test_schema.archive_metrics(
    archive_before_date TIMESTAMPTZ
)
RETURNS TEXT AS $$
BEGIN
    -- In a real implementation, this would export data to external storage
    -- For now, it's a placeholder that could integrate with file export or external APIs
    
    RETURN format('Archive function placeholder - would archive metrics before %s', 
                 archive_before_date);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- INITIAL SETUP COMPLETION
-- =============================================================================

-- Create some default performance baselines for common operations
-- These would typically be established after running tests for a few days

COMMENT ON TABLE test_schema.test_execution_metrics IS 
    'Comprehensive metrics tracking for all test executions across categories';
COMMENT ON TABLE test_schema.test_performance_baselines IS 
    'Performance baselines for alert thresholds and regression detection';
COMMENT ON TABLE test_schema.test_failure_analysis IS 
    'Detailed failure analysis and investigation tracking';

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON test_schema.test_execution_metrics TO current_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON test_schema.test_performance_baselines TO current_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON test_schema.test_failure_analysis TO current_user;

-- Log setup completion
INSERT INTO test_schema.test_data_registry (
    test_name,
    entity_type,
    entity_id,
    created_at
) VALUES (
    'monitoring_infrastructure_setup',
    'system_table',
    gen_random_uuid(),
    NOW()
);

SELECT 'Test monitoring infrastructure setup completed' AS setup_status;