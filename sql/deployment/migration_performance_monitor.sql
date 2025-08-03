-- =============================================================================
-- Migration Performance Monitoring Script
-- =============================================================================
-- This script provides real-time monitoring during migration deployment
-- to ensure performance thresholds are maintained and detect issues early.
--
-- USAGE:
-- 1. Run this script in a separate connection during migration
-- 2. Monitor output for performance metrics
-- 3. Trigger rollback if thresholds are exceeded
-- =============================================================================

-- Create monitoring function for real-time metrics
CREATE OR REPLACE FUNCTION monitor_migration_performance(
  monitoring_duration_seconds INTEGER DEFAULT 300, -- 5 minutes default
  sample_interval_seconds INTEGER DEFAULT 5        -- Sample every 5 seconds
)
RETURNS TABLE (
  timestamp TIMESTAMPTZ,
  active_connections INTEGER,
  blocked_queries INTEGER,
  lock_wait_time_ms NUMERIC,
  table_size_mb NUMERIC,
  index_creation_progress TEXT,
  query_performance_delta NUMERIC,
  alert_level TEXT
) AS $$
DECLARE
  start_time TIMESTAMPTZ;
  end_time TIMESTAMPTZ;
  baseline_query_time NUMERIC;
  current_query_time NUMERIC;
  rec RECORD;
BEGIN
  start_time := NOW();
  end_time := start_time + (monitoring_duration_seconds || ' seconds')::INTERVAL;
  
  -- Establish baseline query performance
  SELECT AVG(
    EXTRACT(MILLISECONDS FROM (clock_timestamp() - query_start))
  ) INTO baseline_query_time
  FROM pg_stat_activity 
  WHERE state = 'active' AND query NOT LIKE '%monitor_migration%';
  
  RAISE NOTICE 'Migration monitoring started at %. Baseline query time: %ms', 
               start_time, COALESCE(baseline_query_time, 0);
  
  -- Monitoring loop
  WHILE NOW() < end_time LOOP
    
    -- Collect current metrics
    SELECT 
      NOW(),
      (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active'),
      (SELECT COUNT(*) FROM pg_stat_activity WHERE wait_event_type = 'Lock'),
      COALESCE((
        SELECT MAX(EXTRACT(MILLISECONDS FROM (NOW() - query_start)))
        FROM pg_stat_activity 
        WHERE wait_event_type = 'Lock'
      ), 0),
      (SELECT pg_size_pretty(pg_total_relation_size('public.contacts'))),
      monitor_index_creation_progress(),
      COALESCE((
        SELECT AVG(EXTRACT(MILLISECONDS FROM (clock_timestamp() - query_start)))
        FROM pg_stat_activity 
        WHERE state = 'active' AND query NOT LIKE '%monitor_migration%'
      ), 0)
    INTO 
      timestamp,
      active_connections,
      blocked_queries,
      lock_wait_time_ms,
      table_size_mb,
      index_creation_progress,
      current_query_time;
    
    -- Calculate performance delta
    query_performance_delta := CASE 
      WHEN baseline_query_time > 0 THEN 
        (current_query_time - baseline_query_time) / baseline_query_time
      ELSE 0
    END;
    
    -- Determine alert level
    alert_level := CASE
      WHEN lock_wait_time_ms > 1000 OR blocked_queries > 5 THEN 'CRITICAL'
      WHEN lock_wait_time_ms > 500 OR blocked_queries > 3 OR query_performance_delta > 0.05 THEN 'WARNING'
      WHEN lock_wait_time_ms > 100 OR blocked_queries > 1 OR query_performance_delta > 0.02 THEN 'CAUTION'
      ELSE 'OK'
    END;
    
    RETURN NEXT;
    
    -- Log critical alerts
    IF alert_level = 'CRITICAL' THEN
      RAISE WARNING 'CRITICAL ALERT at %: Lock wait: %ms, Blocked queries: %, Performance delta: %',
                    timestamp, lock_wait_time_ms, blocked_queries, query_performance_delta;
    END IF;
    
    -- Sleep for next sample
    PERFORM pg_sleep(sample_interval_seconds);
    
  END LOOP;
  
  RAISE NOTICE 'Migration monitoring completed at %', NOW();
  
END;
$$ LANGUAGE plpgsql;

-- Helper function to monitor index creation progress
CREATE OR REPLACE FUNCTION monitor_index_creation_progress()
RETURNS TEXT AS $$
DECLARE
  progress_text TEXT := '';
  rec RECORD;
BEGIN
  -- Check for CONCURRENT index creation activities
  FOR rec IN
    SELECT 
      query,
      state,
      EXTRACT(SECONDS FROM (NOW() - query_start)) as duration_seconds
    FROM pg_stat_activity 
    WHERE query LIKE '%CREATE INDEX CONCURRENTLY%'
    AND state = 'active'
  LOOP
    progress_text := progress_text || 
      format('Index creation active: %ss | ', ROUND(rec.duration_seconds));
  END LOOP;
  
  -- Check if indexes exist
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'contacts' AND indexname LIKE '%analytics%') THEN
    progress_text := progress_text || 'Analytics indexes created | ';
  END IF;
  
  RETURN COALESCE(NULLIF(progress_text, ''), 'No active index creation');
END;
$$ LANGUAGE plpgsql;

-- Quick performance check function
CREATE OR REPLACE FUNCTION quick_performance_check()
RETURNS TABLE (
  metric TEXT,
  current_value NUMERIC,
  threshold NUMERIC,
  status TEXT,
  recommendation TEXT
) AS $$
BEGIN
  -- Active connections check
  SELECT 
    'Active Connections',
    (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active')::NUMERIC,
    100::NUMERIC,
    CASE WHEN (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active') < 100 
         THEN 'OK' ELSE 'WARNING' END,
    'Monitor for excessive connections during migration'
  RETURNING * INTO metric, current_value, threshold, status, recommendation;
  RETURN NEXT;
  
  -- Blocked queries check
  SELECT 
    'Blocked Queries',
    (SELECT COUNT(*) FROM pg_stat_activity WHERE wait_event_type = 'Lock')::NUMERIC,
    3::NUMERIC,
    CASE WHEN (SELECT COUNT(*) FROM pg_stat_activity WHERE wait_event_type = 'Lock') <= 3 
         THEN 'OK' ELSE 'CRITICAL' END,
    'Rollback if >5 blocked queries sustained'
  RETURNING * INTO metric, current_value, threshold, status, recommendation;
  RETURN NEXT;
  
  -- Table size check
  SELECT 
    'Contacts Table Size (MB)',
    (pg_total_relation_size('public.contacts') / 1024 / 1024)::NUMERIC,
    1000::NUMERIC,
    CASE WHEN pg_total_relation_size('public.contacts') / 1024 / 1024 < 1000 
         THEN 'OK' ELSE 'CAUTION' END,
    'Large tables require extended monitoring'
  RETURNING * INTO metric, current_value, threshold, status, recommendation;
  RETURN NEXT;
  
  -- Index count check
  SELECT 
    'Analytics Indexes',
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'contacts' AND indexname LIKE '%analytics%')::NUMERIC,
    3::NUMERIC,
    CASE WHEN (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'contacts' AND indexname LIKE '%analytics%') >= 3 
         THEN 'OK' ELSE 'PENDING' END,
    'Should have 3+ analytics indexes after migration'
  RETURNING * INTO metric, current_value, threshold, status, recommendation;
  RETURN NEXT;
  
  -- RLS policy check
  SELECT 
    'Analytics RLS Policies',
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'contacts' AND policyname LIKE '%nalytics%')::NUMERIC,
    1::NUMERIC,
    CASE WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'contacts' AND policyname LIKE '%nalytics%') >= 1 
         THEN 'OK' ELSE 'MISSING' END,
    'Analytics RLS policy should be active'
  RETURNING * INTO metric, current_value, threshold, status, recommendation;
  RETURN NEXT;
  
END;
$$ LANGUAGE plpgsql;

-- Query performance benchmark function
CREATE OR REPLACE FUNCTION benchmark_query_performance()
RETURNS TABLE (
  query_type TEXT,
  execution_time_ms NUMERIC,
  threshold_ms NUMERIC,
  performance_status TEXT
) AS $$
DECLARE
  start_time TIMESTAMPTZ;
  end_time TIMESTAMPTZ;
  exec_time_ms NUMERIC;
BEGIN
  -- Test 1: Basic contact list query
  start_time := clock_timestamp();
  PERFORM COUNT(*) FROM public.contacts LIMIT 50;
  end_time := clock_timestamp();
  exec_time_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time));
  
  SELECT 
    'Basic Contact List',
    exec_time_ms,
    200::NUMERIC,
    CASE WHEN exec_time_ms <= 200 THEN 'OK' 
         WHEN exec_time_ms <= 400 THEN 'WARNING'
         ELSE 'CRITICAL' END
  RETURNING * INTO query_type, execution_time_ms, threshold_ms, performance_status;
  RETURN NEXT;
  
  -- Test 2: Analytics-enabled query
  start_time := clock_timestamp();
  PERFORM COUNT(*) FROM public.contacts WHERE analytics_enabled = TRUE;
  end_time := clock_timestamp();
  exec_time_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time));
  
  SELECT 
    'Analytics Query',
    exec_time_ms,
    150::NUMERIC,
    CASE WHEN exec_time_ms <= 150 THEN 'OK' 
         WHEN exec_time_ms <= 300 THEN 'WARNING'
         ELSE 'CRITICAL' END
  RETURNING * INTO query_type, execution_time_ms, threshold_ms, performance_status;
  RETURN NEXT;
  
  -- Test 3: Organization-based query (previously degraded)
  start_time := clock_timestamp();
  PERFORM COUNT(*) FROM public.contacts WHERE organization LIKE '%Test%';
  end_time := clock_timestamp();
  exec_time_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time));
  
  SELECT 
    'Organization Query',
    exec_time_ms,
    150::NUMERIC,
    CASE WHEN exec_time_ms <= 150 THEN 'OK' 
         WHEN exec_time_ms <= 300 THEN 'WARNING'
         ELSE 'CRITICAL' END
  RETURNING * INTO query_type, execution_time_ms, threshold_ms, performance_status;
  RETURN NEXT;
  
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- USAGE EXAMPLES
-- =============================================================================

-- 1. Start real-time monitoring (run during migration)
-- SELECT * FROM monitor_migration_performance(300, 5); -- 5 minutes, 5-second intervals

-- 2. Quick performance snapshot
-- SELECT * FROM quick_performance_check();

-- 3. Benchmark query performance
-- SELECT * FROM benchmark_query_performance();

-- 4. Check specific metrics
-- SELECT 
--   'Current Status' as check_type,
--   NOW() as timestamp,
--   (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
--   (SELECT COUNT(*) FROM pg_stat_activity WHERE wait_event_type = 'Lock') as blocked_queries,
--   pg_size_pretty(pg_total_relation_size('public.contacts')) as table_size;

-- =============================================================================
-- ALERT THRESHOLDS SUMMARY
-- =============================================================================
-- CRITICAL:  Lock wait >1000ms OR Blocked queries >5
-- WARNING:   Lock wait >500ms OR Blocked queries >3 OR Performance delta >5%
-- CAUTION:   Lock wait >100ms OR Blocked queries >1 OR Performance delta >2%
-- OK:        All metrics within acceptable ranges
-- =============================================================================

-- Add comments for documentation
COMMENT ON FUNCTION monitor_migration_performance(INTEGER, INTEGER) IS 
'Real-time migration performance monitoring with configurable duration and sampling interval';

COMMENT ON FUNCTION quick_performance_check() IS 
'Quick snapshot of key migration performance metrics';

COMMENT ON FUNCTION benchmark_query_performance() IS 
'Benchmark specific query types to validate migration impact';

-- Log monitoring setup completion
DO $$
BEGIN
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'MIGRATION PERFORMANCE MONITORING SETUP COMPLETE';
  RAISE NOTICE 'Available functions:';
  RAISE NOTICE '  - monitor_migration_performance(duration, interval)';
  RAISE NOTICE '  - quick_performance_check()';
  RAISE NOTICE '  - benchmark_query_performance()';
  RAISE NOTICE 'Setup completed at: %', NOW();
  RAISE NOTICE '=================================================================';
END $$;