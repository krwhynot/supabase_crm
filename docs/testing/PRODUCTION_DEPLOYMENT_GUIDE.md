# Production Deployment Guide for Database Testing Framework

## Table of Contents

1. [Overview](#overview)
2. [Production Environment Validation](#production-environment-validation)
3. [Database Migration Testing](#database-migration-testing)
4. [Disaster Recovery Testing](#disaster-recovery-testing)
5. [Performance Monitoring Setup](#performance-monitoring-setup)
6. [Production Deployment Workflow](#production-deployment-workflow)
7. [Post-Deployment Validation](#post-deployment-validation)
8. [Troubleshooting and Rollback](#troubleshooting-and-rollback)

## Overview

This guide provides comprehensive procedures for deploying and maintaining the database testing framework in production environments. It covers validation procedures, monitoring setup, disaster recovery protocols, and operational maintenance.

### Production Readiness Criteria

✅ **All 834+ Tests Passing**: Complete test suite success rate ≥97%  
✅ **Performance Benchmarks Met**: All queries within SLA requirements  
✅ **Security Validation Complete**: RLS policies tested and verified  
✅ **Migration Procedures Tested**: Forward and rollback migrations validated  
✅ **Monitoring Infrastructure Ready**: Performance and health monitoring active  
✅ **Disaster Recovery Tested**: Backup and recovery procedures validated  

### Deployment Architecture

```
Production Environment
├── Primary Database (Supabase Production)
├── Testing Infrastructure
│   ├── pgTAP Extension
│   ├── Test Schema Isolation
│   ├── Performance Monitoring
│   └── Automated Test Execution
├── Monitoring & Alerting
│   ├── Performance Metrics Collection
│   ├── Test Results Dashboard
│   ├── Alert Management
│   └── Trend Analysis
└── Backup & Recovery
    ├── Database Backups
    ├── Test Framework Backups
    ├── Recovery Procedures
    └── Disaster Recovery Testing
```

## Production Environment Validation

### Pre-Deployment Checklist

#### 1. Infrastructure Validation
```bash
#!/bin/bash
# Production Infrastructure Validation Script

echo "🔍 Validating Production Infrastructure..."

# Check database connectivity
if ! psql "$PRODUCTION_DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Cannot connect to production database"
    exit 1
fi

# Verify pgTAP extension
if ! psql "$PRODUCTION_DB_URL" -c "CREATE EXTENSION IF NOT EXISTS pgtap;" > /dev/null 2>&1; then
    echo "❌ Cannot install pgTAP extension"
    exit 1
fi

# Check required permissions
if ! psql "$PRODUCTION_DB_URL" -c "SELECT has_database_privilege(current_user, current_database(), 'CREATE');" | grep -q "t"; then
    echo "❌ Insufficient database permissions"
    exit 1
fi

# Verify schema isolation capabilities
if ! psql "$PRODUCTION_DB_URL" -c "CREATE SCHEMA IF NOT EXISTS test_schema_validation; DROP SCHEMA test_schema_validation;" > /dev/null 2>&1; then
    echo "❌ Cannot create/drop test schemas"
    exit 1
fi

echo "✅ Infrastructure validation complete"
```

#### 2. Security Configuration Validation
```sql
-- Validate production security configuration
DO $$
DECLARE
    rls_enabled_count INTEGER;
    expected_policies_count INTEGER := 25; -- Adjust based on your schema
    actual_policies_count INTEGER;
BEGIN
    -- Check RLS is enabled on all required tables
    SELECT COUNT(*) INTO rls_enabled_count
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' 
    AND c.relkind = 'r'
    AND c.relname IN ('contacts', 'organizations', 'opportunities', 'interactions', 'products')
    AND c.relrowsecurity = true;
    
    IF rls_enabled_count < 5 THEN
        RAISE EXCEPTION 'RLS not enabled on all required tables';
    END IF;
    
    -- Check required policies exist
    SELECT COUNT(*) INTO actual_policies_count
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    IF actual_policies_count < expected_policies_count THEN
        RAISE EXCEPTION 'Missing required RLS policies: expected %, found %', 
                       expected_policies_count, actual_policies_count;
    END IF;
    
    RAISE NOTICE '✅ Security configuration validated: % policies active', actual_policies_count;
END$$;
```

#### 3. Performance Baseline Establishment
```sql
-- Establish production performance baselines
CREATE OR REPLACE FUNCTION establish_production_baselines()
RETURNS TABLE(
    test_category TEXT,
    baseline_metrics JSONB,
    established_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Create baselines table if not exists
    CREATE TABLE IF NOT EXISTS production_performance_baselines (
        test_category TEXT PRIMARY KEY,
        baseline_metrics JSONB NOT NULL,
        established_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Establish contact queries baseline
    INSERT INTO production_performance_baselines (test_category, baseline_metrics)
    VALUES (
        'contact_queries',
        jsonb_build_object(
            'single_lookup_ms', 45,
            'paginated_results_ms', 85,
            'complex_join_ms', 180,
            'aggregation_ms', 450
        )
    )
    ON CONFLICT (test_category) DO UPDATE SET
        baseline_metrics = EXCLUDED.baseline_metrics,
        updated_at = NOW();
        
    -- Establish organization queries baseline
    INSERT INTO production_performance_baselines (test_category, baseline_metrics)
    VALUES (
        'organization_queries', 
        jsonb_build_object(
            'hierarchy_query_ms', 120,
            'contact_count_ms', 200,
            'opportunity_summary_ms', 350
        )
    )
    ON CONFLICT (test_category) DO UPDATE SET
        baseline_metrics = EXCLUDED.baseline_metrics,
        updated_at = NOW();
        
    -- Return established baselines
    RETURN QUERY
    SELECT ppb.test_category, ppb.baseline_metrics, ppb.established_at
    FROM production_performance_baselines ppb
    ORDER BY ppb.test_category;
END$$
LANGUAGE plpgsql;

-- Execute baseline establishment
SELECT * FROM establish_production_baselines();
```

### Production Test Environment Setup

#### 1. Test Schema Isolation
```sql
-- Production-safe test schema setup
CREATE SCHEMA IF NOT EXISTS prod_test_schema;
SET search_path TO prod_test_schema, public;

-- Create production test registry with enhanced isolation
CREATE TABLE IF NOT EXISTS prod_test_execution_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_suite VARCHAR(100) NOT NULL,
    test_category VARCHAR(50) NOT NULL,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    duration INTERVAL,
    tests_planned INTEGER,
    tests_passed INTEGER,
    tests_failed INTEGER,
    success_rate DECIMAL(5,2),
    performance_metrics JSONB,
    environment_info JSONB,
    created_by TEXT DEFAULT current_user
);

-- Create production test data registry
CREATE TABLE IF NOT EXISTS prod_test_data_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_execution_id UUID REFERENCES prod_test_execution_log(id),
    test_name VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    cleaned_up_at TIMESTAMPTZ,
    cleanup_method VARCHAR(20) DEFAULT 'CASCADE'
);

-- Create indexes for production test monitoring
CREATE INDEX IF NOT EXISTS idx_prod_test_log_category_time 
ON prod_test_execution_log(test_category, start_time DESC);

CREATE INDEX IF NOT EXISTS idx_prod_test_data_cleanup 
ON prod_test_data_registry(cleaned_up_at) WHERE cleaned_up_at IS NULL;
```

#### 2. Production Test Runner
```bash
#!/bin/bash
# Production Test Runner with Enhanced Safety Measures

set -euo pipefail

# Production configuration
PROD_DB_URL="${PRODUCTION_DB_URL:-}"
TEST_TIMEOUT="${TEST_TIMEOUT:-600}"  # 10 minutes
PARALLEL_JOBS="${PARALLEL_JOBS:-3}"
LOG_LEVEL="${LOG_LEVEL:-INFO}"

# Safety checks
if [[ -z "$PROD_DB_URL" ]]; then
    echo "❌ PRODUCTION_DB_URL not set"
    exit 1
fi

if [[ "$PROD_DB_URL" == *"localhost"* ]]; then
    echo "⚠️  Warning: Connecting to localhost in production mode"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Production test execution with monitoring
execute_production_tests() {
    local test_category="$1"
    local execution_id=$(uuidgen)
    
    echo "🚀 Starting production tests: $test_category"
    echo "   Execution ID: $execution_id"
    echo "   Timeout: ${TEST_TIMEOUT}s"
    
    # Log test start
    psql "$PROD_DB_URL" -c "
        INSERT INTO prod_test_schema.prod_test_execution_log 
        (id, test_suite, test_category, environment_info)
        VALUES (
            '$execution_id',
            'production_validation',
            '$test_category',
            jsonb_build_object(
                'database_url', regexp_replace('$PROD_DB_URL', ':[^:@]*@', ':***@'),
                'hostname', '$(hostname)',
                'timestamp', '$(date -Iseconds)'
            )
        );
    "
    
    # Execute tests with timeout and monitoring
    timeout $TEST_TIMEOUT pg_prove \
        --ext .sql \
        --verbose \
        --timer \
        --archive production_test_results.tar.gz \
        sql/tests/$test_category/ || {
            echo "❌ Tests failed or timed out"
            psql "$PROD_DB_URL" -c "
                UPDATE prod_test_schema.prod_test_execution_log 
                SET end_time = NOW(), 
                    duration = NOW() - start_time,
                    tests_failed = -1
                WHERE id = '$execution_id';
            "
            return 1
        }
    
    # Update test completion
    psql "$PROD_DB_URL" -c "
        UPDATE prod_test_schema.prod_test_execution_log 
        SET end_time = NOW(), 
            duration = NOW() - start_time
        WHERE id = '$execution_id';
    "
    
    echo "✅ Production tests completed: $test_category"
    return 0
}

# Execute production test suite
main() {
    echo "🏭 Production Database Testing Framework"
    echo "======================================="
    
    # Validate environment
    validate_production_environment
    
    # Execute test categories in order of safety
    local test_categories=("unit" "security" "performance" "integration")
    
    for category in "${test_categories[@]}"; do
        if ! execute_production_tests "$category"; then
            echo "❌ Production tests failed at category: $category"
            exit 1
        fi
        
        # Brief pause between categories for system recovery
        sleep 5
    done
    
    # Generate production test report
    generate_production_test_report
    
    echo "✅ All production tests completed successfully"
}

# Validate production environment before testing
validate_production_environment() {
    echo "🔍 Validating production environment..."
    
    # Check database connectivity
    if ! psql "$PROD_DB_URL" -c "SELECT 1;" >/dev/null 2>&1; then
        echo "❌ Cannot connect to production database"
        exit 1
    fi
    
    # Check pgTAP availability
    if ! psql "$PROD_DB_URL" -c "SELECT * FROM pg_extension WHERE extname = 'pgtap';" | grep -q pgtap; then
        echo "❌ pgTAP extension not available"
        exit 1
    fi
    
    # Verify test schema isolation
    psql "$PROD_DB_URL" -c "
        CREATE SCHEMA IF NOT EXISTS prod_test_validation;
        DROP SCHEMA prod_test_validation;
    " >/dev/null 2>&1 || {
        echo "❌ Cannot create/drop test schemas"
        exit 1
    }
    
    echo "✅ Production environment validated"
}

# Generate comprehensive production test report
generate_production_test_report() {
    echo "📊 Generating production test report..."
    
    psql "$PROD_DB_URL" -c "
        WITH test_summary AS (
            SELECT 
                test_category,
                COUNT(*) as executions,
                AVG(success_rate) as avg_success_rate,
                AVG(EXTRACT(epoch FROM duration)) as avg_duration_seconds,
                MIN(start_time) as first_execution,
                MAX(end_time) as last_execution
            FROM prod_test_schema.prod_test_execution_log
            WHERE start_time >= NOW() - INTERVAL '24 hours'
            GROUP BY test_category
        )
        SELECT 
            '📋 Production Test Summary (Last 24 Hours)' as report_section,
            json_agg(
                json_build_object(
                    'category', test_category,
                    'executions', executions,
                    'avg_success_rate', round(avg_success_rate, 2),
                    'avg_duration_seconds', round(avg_duration_seconds, 2),
                    'first_execution', first_execution,
                    'last_execution', last_execution
                )
                ORDER BY test_category
            ) as summary
        FROM test_summary;
    "
}

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
```

## Database Migration Testing

### Migration Testing Framework

#### 1. Pre-Migration Validation
```sql
-- Pre-migration validation procedure
CREATE OR REPLACE FUNCTION validate_pre_migration_state()
RETURNS TABLE(
    validation_item TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check data integrity
    RETURN QUERY
    SELECT 
        'Data Integrity'::TEXT,
        CASE 
            WHEN (SELECT COUNT(*) FROM contacts WHERE email IS NULL OR email = '') > 0 
            THEN 'FAILED'::TEXT
            ELSE 'PASSED'::TEXT
        END,
        'Email field validation: ' || (SELECT COUNT(*) FROM contacts WHERE email IS NULL OR email = '')::TEXT || ' invalid records'::TEXT;
    
    -- Check foreign key consistency
    RETURN QUERY  
    SELECT
        'Foreign Key Consistency'::TEXT,
        CASE
            WHEN EXISTS (
                SELECT 1 FROM contacts c 
                LEFT JOIN organizations o ON c.organization_id = o.id 
                WHERE c.organization_id IS NOT NULL AND o.id IS NULL
            ) THEN 'FAILED'::TEXT
            ELSE 'PASSED'::TEXT
        END,
        'Orphaned contact records: ' || (
            SELECT COUNT(*) FROM contacts c 
            LEFT JOIN organizations o ON c.organization_id = o.id 
            WHERE c.organization_id IS NOT NULL AND o.id IS NULL
        )::TEXT;
    
    -- Check index health
    RETURN QUERY
    SELECT
        'Index Health'::TEXT,
        CASE 
            WHEN (SELECT COUNT(*) FROM pg_stat_user_indexes WHERE idx_scan = 0) > 5
            THEN 'WARNING'::TEXT
            ELSE 'PASSED'::TEXT
        END,
        'Unused indexes detected: ' || (SELECT COUNT(*) FROM pg_stat_user_indexes WHERE idx_scan = 0)::TEXT;
        
    -- Check table sizes for migration planning
    RETURN QUERY
    SELECT
        'Table Size Analysis'::TEXT,
        'INFO'::TEXT,
        'Largest table: ' || (
            SELECT schemaname||'.'||tablename FROM pg_tables t
            JOIN pg_class c ON c.relname = t.tablename
            ORDER BY c.relpages DESC LIMIT 1
        ) || ' (' || (
            SELECT pg_size_pretty(pg_total_relation_size(c.oid))
            FROM pg_class c
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE n.nspname = 'public'
            ORDER BY c.relpages DESC LIMIT 1
        ) || ')';
END$$
LANGUAGE plpgsql;
```

#### 2. Migration Execution with Testing
```bash
#!/bin/bash
# Production Migration with Comprehensive Testing

set -euo pipefail

MIGRATION_FILE="${1:-}"
ROLLBACK_FILE="${2:-}"
DB_URL="${PRODUCTION_DB_URL}"

if [[ -z "$MIGRATION_FILE" ]]; then
    echo "Usage: $0 <migration_file> [rollback_file]"
    exit 1
fi

# Migration execution with testing
execute_migration_with_testing() {
    local migration_id=$(uuidgen)
    
    echo "🚀 Starting migration: $migration_file"
    echo "   Migration ID: $migration_id"
    
    # Pre-migration validation
    echo "🔍 Pre-migration validation..."
    psql "$DB_URL" -c "SELECT * FROM validate_pre_migration_state();" > "pre_migration_${migration_id}.log"
    
    # Create migration backup point
    echo "💾 Creating backup point..."
    psql "$DB_URL" -c "SELECT pg_create_restore_point('pre_migration_${migration_id}');"
    
    # Execute migration within transaction for safety
    echo "⚡ Executing migration..."
    if ! psql "$DB_URL" -1 -f "$MIGRATION_FILE"; then
        echo "❌ Migration failed, initiating rollback..."
        if [[ -n "$ROLLBACK_FILE" ]] && [[ -f "$ROLLBACK_FILE" ]]; then
            psql "$DB_URL" -1 -f "$ROLLBACK_FILE"
        fi
        exit 1
    fi
    
    # Post-migration validation
    echo "✅ Migration completed, running validation tests..."
    ./sql/tests/run_tests.sh --migration --integration
    
    if [[ $? -ne 0 ]]; then
        echo "❌ Post-migration tests failed, consider rollback"
        exit 1
    fi
    
    echo "🎉 Migration completed successfully: $migration_file"
}

# Execute migration
execute_migration_with_testing
```

#### 3. Post-Migration Validation
```sql
-- Post-migration validation suite
CREATE OR REPLACE FUNCTION validate_post_migration_state()
RETURNS TABLE(
    validation_item TEXT,
    status TEXT,
    details TEXT,
    remediation_action TEXT
) AS $$
BEGIN
    -- Validate schema changes applied correctly
    RETURN QUERY
    SELECT 
        'Schema Changes'::TEXT,
        CASE 
            WHEN (
                SELECT COUNT(*) FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND column_name = 'expected_new_column'
            ) > 0 THEN 'PASSED'::TEXT
            ELSE 'FAILED'::TEXT
        END,
        'New columns added: ' || (
            SELECT COUNT(*) FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND column_name LIKE '%new_%'
        )::TEXT,
        'Verify migration script executed completely'::TEXT;
    
    -- Validate data migration integrity
    RETURN QUERY
    SELECT
        'Data Migration Integrity'::TEXT,
        CASE
            WHEN (SELECT COUNT(*) FROM contacts WHERE migrated_field IS NULL) = 0
            THEN 'PASSED'::TEXT
            ELSE 'FAILED'::TEXT
        END,
        'Records with null migrated fields: ' || (
            SELECT COUNT(*) FROM contacts WHERE migrated_field IS NULL
        )::TEXT,
        'Run data backfill script if needed'::TEXT;
    
    -- Check performance impact
    RETURN QUERY
    SELECT
        'Query Performance'::TEXT,
        CASE
            WHEN (
                SELECT AVG(mean_exec_time) 
                FROM pg_stat_statements 
                WHERE query LIKE '%contacts%'
            ) < 100 THEN 'PASSED'::TEXT
            ELSE 'WARNING'::TEXT
        END,
        'Average query time: ' || (
            SELECT ROUND(AVG(mean_exec_time)::numeric, 2)::TEXT || 'ms'
            FROM pg_stat_statements 
            WHERE query LIKE '%contacts%'
        ),
        'Monitor performance and optimize if needed'::TEXT;
    
    -- Validate RLS policies still function
    RETURN QUERY
    SELECT
        'RLS Policy Validation'::TEXT,
        CASE
            WHEN (
                SELECT COUNT(*) FROM pg_policies 
                WHERE schemaname = 'public' 
                AND tablename IN ('contacts', 'organizations', 'opportunities')
            ) >= 15 THEN 'PASSED'::TEXT
            ELSE 'FAILED'::TEXT
        END,
        'Active RLS policies: ' || (
            SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public'
        )::TEXT,
        'Restore missing RLS policies from backup'::TEXT;
        
END$$
LANGUAGE plpgsql;
```

## Disaster Recovery Testing

### Backup Validation Framework

#### 1. Automated Backup Testing
```bash
#!/bin/bash
# Automated Backup and Recovery Testing

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/supabase}"
TEST_RESTORE_DB="${TEST_RESTORE_DB:-test_restore_$(date +%Y%m%d_%H%M%S)}"
PROD_DB_URL="${PRODUCTION_DB_URL}"

# Create and validate database backup
test_backup_creation() {
    echo "💾 Testing backup creation..."
    
    local backup_file="$BACKUP_DIR/test_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    # Create backup
    if ! pg_dump "$PROD_DB_URL" --no-owner --no-acl -f "$backup_file"; then
        echo "❌ Backup creation failed"
        return 1
    fi
    
    # Validate backup file
    if [[ ! -f "$backup_file" ]]; then
        echo "❌ Backup file not created"
        return 1
    fi
    
    # Check backup file size (should be reasonable)
    local backup_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file")
    if [[ $backup_size -lt 1024 ]]; then
        echo "❌ Backup file too small: ${backup_size} bytes"
        return 1
    fi
    
    echo "✅ Backup created successfully: $backup_file (${backup_size} bytes)"
    echo "$backup_file"
}

# Test backup restoration
test_backup_restoration() {
    local backup_file="$1"
    
    echo "🔄 Testing backup restoration..."
    
    # Create test database for restoration
    createdb "$TEST_RESTORE_DB" || {
        echo "❌ Failed to create test database"
        return 1
    }
    
    # Restore backup to test database
    if ! psql "$TEST_RESTORE_DB" -f "$backup_file" >/dev/null 2>&1; then
        echo "❌ Backup restoration failed"
        dropdb --if-exists "$TEST_RESTORE_DB"
        return 1
    fi
    
    # Validate restored data
    local table_count=$(psql "$TEST_RESTORE_DB" -t -c "
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    " | xargs)
    
    if [[ $table_count -lt 5 ]]; then
        echo "❌ Restored database has insufficient tables: $table_count"
        dropdb --if-exists "$TEST_RESTORE_DB"
        return 1
    fi
    
    # Run basic data integrity tests on restored database
    psql "$TEST_RESTORE_DB" -c "
        SELECT 
            'contacts' as table_name, 
            COUNT(*) as record_count,
            COUNT(DISTINCT email) as unique_emails
        FROM contacts
        UNION ALL
        SELECT 
            'organizations',
            COUNT(*),
            COUNT(DISTINCT name)
        FROM organizations;
    "
    
    echo "✅ Backup restoration validated successfully"
    
    # Cleanup test database
    dropdb --if-exists "$TEST_RESTORE_DB"
}

# Point-in-time recovery testing
test_point_in_time_recovery() {
    echo "⏰ Testing point-in-time recovery capabilities..."
    
    # Create test data with timestamp
    local test_timestamp=$(date -Iseconds)
    psql "$PROD_DB_URL" -c "
        INSERT INTO test_pitr_validation (created_at, test_data) 
        VALUES ('$test_timestamp', 'PITR Test Data');
    "
    
    # Simulate restoration to point before test data
    local recovery_time=$(date -d "$test_timestamp - 1 hour" -Iseconds)
    
    echo "📍 Point-in-time recovery target: $recovery_time"
    echo "   (This would typically involve Supabase support for production)"
    
    # Validate PITR capabilities are available
    psql "$PROD_DB_URL" -c "
        SELECT 
            CASE 
                WHEN current_setting('archive_mode') = 'on' 
                THEN '✅ WAL archiving enabled' 
                ELSE '⚠️  WAL archiving not enabled'
            END as pitr_capability;
    "
    
    # Cleanup test data
    psql "$PROD_DB_URL" -c "
        DELETE FROM test_pitr_validation 
        WHERE created_at = '$test_timestamp' AND test_data = 'PITR Test Data';
    "
}

# Comprehensive disaster recovery test
main() {
    echo "🆘 Disaster Recovery Testing Framework"
    echo "====================================="
    
    # Create backup directory if needed
    mkdir -p "$BACKUP_DIR"
    
    # Test backup creation
    local backup_file
    backup_file=$(test_backup_creation)
    
    if [[ -n "$backup_file" ]]; then
        # Test backup restoration
        test_backup_restoration "$backup_file"
        
        # Test point-in-time recovery
        test_point_in_time_recovery
        
        # Archive backup for retention
        mv "$backup_file" "${backup_file}.tested"
        
        echo "✅ Disaster recovery testing completed successfully"
    else
        echo "❌ Disaster recovery testing failed"
        exit 1
    fi
}

# Execute if run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
```

### Recovery Time Objective (RTO) Testing

```sql
-- RTO validation framework
CREATE OR REPLACE FUNCTION measure_recovery_time()
RETURNS TABLE(
    recovery_scenario TEXT,
    estimated_rto_minutes INTEGER,
    validation_status TEXT
) AS $$
BEGIN
    -- Test schema recreation time
    DECLARE
        start_time TIMESTAMP WITH TIME ZONE;
        end_time TIMESTAMP WITH TIME ZONE;
        schema_rto INTEGER;
    BEGIN
        start_time := clock_timestamp();
        
        -- Simulate schema recreation (in test schema)
        DROP SCHEMA IF EXISTS rto_test_schema CASCADE;
        CREATE SCHEMA rto_test_schema;
        SET search_path TO rto_test_schema;
        
        -- Create representative table structure
        CREATE TABLE test_contacts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX test_contacts_email_idx ON test_contacts(email);
        
        end_time := clock_timestamp();
        schema_rto := EXTRACT(epoch FROM (end_time - start_time)) / 60;
        
        RETURN QUERY
        SELECT 
            'Schema Recreation'::TEXT,
            schema_rto,
            CASE 
                WHEN schema_rto <= 5 THEN 'PASSED'::TEXT
                ELSE 'FAILED'::TEXT
            END;
    END;
    
    -- Test data restoration time estimation
    RETURN QUERY
    SELECT
        'Data Restoration (Estimated)'::TEXT,
        CASE
            WHEN (SELECT pg_database_size(current_database()) / (1024*1024*1024)) <= 1 
            THEN 10  -- Small database: 10 minutes
            WHEN (SELECT pg_database_size(current_database()) / (1024*1024*1024)) <= 10
            THEN 30  -- Medium database: 30 minutes  
            ELSE 120 -- Large database: 2 hours
        END,
        'ESTIMATED'::TEXT;
        
    -- Clean up test schema
    DROP SCHEMA IF EXISTS rto_test_schema CASCADE;
END$$
LANGUAGE plpgsql;

-- Execute RTO measurement
SELECT * FROM measure_recovery_time();
```

## Performance Monitoring Setup

### Real-Time Performance Monitoring

#### 1. Performance Metrics Collection
```sql
-- Production performance monitoring setup
CREATE SCHEMA IF NOT EXISTS performance_monitoring;

-- Performance metrics table
CREATE TABLE performance_monitoring.test_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_category VARCHAR(50) NOT NULL,
    test_name VARCHAR(100) NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    memory_usage_mb INTEGER,
    cpu_usage_percent DECIMAL(5,2),
    query_count INTEGER DEFAULT 0,
    slow_query_count INTEGER DEFAULT 0,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    environment VARCHAR(20) DEFAULT 'production'
);

-- Performance baselines table
CREATE TABLE performance_monitoring.performance_baselines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_category VARCHAR(50) NOT NULL,
    baseline_metrics JSONB NOT NULL,
    established_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Performance alerts table
CREATE TABLE performance_monitoring.performance_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(50) NOT NULL, -- 'REGRESSION', 'THRESHOLD', 'ANOMALY'
    test_category VARCHAR(50),
    test_name VARCHAR(100),
    alert_message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'WARNING', -- 'INFO', 'WARNING', 'CRITICAL'
    threshold_value DECIMAL(10,2),
    actual_value DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ
);

-- Create indexes for monitoring queries
CREATE INDEX idx_perf_metrics_category_time 
ON performance_monitoring.test_performance_metrics(test_category, recorded_at DESC);

CREATE INDEX idx_perf_alerts_unresolved 
ON performance_monitoring.performance_alerts(created_at DESC) 
WHERE resolved_at IS NULL;
```

#### 2. Automated Performance Analysis
```sql
-- Automated performance regression detection
CREATE OR REPLACE FUNCTION performance_monitoring.detect_performance_regression()
RETURNS TABLE(
    test_category TEXT,
    test_name TEXT,
    baseline_ms INTEGER,
    current_ms INTEGER,
    regression_percent DECIMAL(5,2),
    alert_severity TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_metrics AS (
        SELECT 
            tpm.test_category,
            tpm.test_name,
            AVG(tpm.execution_time_ms) as avg_execution_time
        FROM performance_monitoring.test_performance_metrics tpm
        WHERE tpm.recorded_at >= NOW() - INTERVAL '24 hours'
        GROUP BY tpm.test_category, tpm.test_name
    ),
    baseline_metrics AS (
        SELECT 
            pb.test_category,
            (pb.baseline_metrics->>'avg_execution_time_ms')::INTEGER as baseline_time
        FROM performance_monitoring.performance_baselines pb
        WHERE pb.is_active = true
    )
    SELECT 
        rm.test_category::TEXT,
        rm.test_name::TEXT,
        bm.baseline_time,
        rm.avg_execution_time::INTEGER,
        ((rm.avg_execution_time - bm.baseline_time) / bm.baseline_time * 100)::DECIMAL(5,2),
        CASE 
            WHEN rm.avg_execution_time > bm.baseline_time * 1.5 THEN 'CRITICAL'::TEXT
            WHEN rm.avg_execution_time > bm.baseline_time * 1.2 THEN 'WARNING'::TEXT
            ELSE 'INFO'::TEXT
        END
    FROM recent_metrics rm
    JOIN baseline_metrics bm ON rm.test_category = bm.test_category
    WHERE rm.avg_execution_time > bm.baseline_time * 1.1 -- 10% threshold
    ORDER BY 
        ((rm.avg_execution_time - bm.baseline_time) / bm.baseline_time * 100) DESC;
END$$
LANGUAGE plpgsql;
```

#### 3. Performance Alerting System
```bash
#!/bin/bash
# Performance Monitoring and Alerting Script

set -euo pipefail

DB_URL="${PRODUCTION_DB_URL}"
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL:-}"
EMAIL_ALERTS="${EMAIL_ALERTS:-admin@example.com}"

# Check for performance regressions
check_performance_regressions() {
    echo "🔍 Checking for performance regressions..."
    
    local regression_results
    regression_results=$(psql "$DB_URL" -t -c "
        SELECT json_agg(
            json_build_object(
                'test_category', test_category,
                'test_name', test_name,
                'baseline_ms', baseline_ms,
                'current_ms', current_ms,
                'regression_percent', regression_percent,
                'alert_severity', alert_severity
            )
        )
        FROM performance_monitoring.detect_performance_regression();
    ")
    
    if [[ "$regression_results" != "null" ]]; then
        echo "⚠️  Performance regressions detected!"
        
        # Create performance alert
        psql "$DB_URL" -c "
            INSERT INTO performance_monitoring.performance_alerts 
            (alert_type, alert_message, severity, threshold_value, actual_value)
            SELECT 
                'REGRESSION',
                'Performance regression detected in ' || test_category || ': ' || test_name,
                alert_severity,
                baseline_ms,
                current_ms
            FROM performance_monitoring.detect_performance_regression()
            WHERE alert_severity IN ('WARNING', 'CRITICAL');
        "
        
        # Send notifications
        if [[ -n "$SLACK_WEBHOOK" ]]; then
            send_slack_alert "$regression_results"
        fi
        
        echo "$regression_results"
        return 1
    else
        echo "✅ No performance regressions detected"
        return 0
    fi
}

# Send Slack alert
send_slack_alert() {
    local regression_data="$1"
    
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"text\": \"🚨 Database Performance Regression Alert\",
                \"blocks\": [
                    {
                        \"type\": \"section\",
                        \"text\": {
                            \"type\": \"mrkdwn\",
                            \"text\": \"*Performance regression detected in production database tests*\\n\\nDetails: \\\`\\\`\\\`${regression_data}\\\`\\\`\\\`\"
                        }
                    }
                ]
            }" \
            "$SLACK_WEBHOOK"
    fi
}

# Generate performance dashboard data
generate_dashboard_data() {
    echo "📊 Generating performance dashboard data..."
    
    psql "$DB_URL" -c "
        -- Update performance dashboard with latest metrics
        CREATE TEMP VIEW dashboard_metrics AS
        SELECT 
            test_category,
            COUNT(*) as total_tests,
            AVG(execution_time_ms) as avg_execution_time,
            MAX(execution_time_ms) as max_execution_time,
            MIN(execution_time_ms) as min_execution_time,
            PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time_ms) as p95_execution_time
        FROM performance_monitoring.test_performance_metrics
        WHERE recorded_at >= NOW() - INTERVAL '24 hours'
        GROUP BY test_category;
        
        -- Export dashboard data
        COPY (
            SELECT json_agg(row_to_json(dashboard_metrics))
            FROM dashboard_metrics
        ) TO '/tmp/performance_dashboard.json';
    "
    
    echo "✅ Performance dashboard data generated"
}

# Main monitoring loop
main() {
    echo "📈 Production Performance Monitoring"
    echo "==================================="
    
    # Check performance regressions
    if ! check_performance_regressions; then
        echo "⚠️  Performance issues detected - check alerts"
    fi
    
    # Generate dashboard data
    generate_dashboard_data
    
    echo "✅ Performance monitoring completed"
}

# Execute if run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
```

## Production Deployment Workflow

### Automated Production Deployment

#### 1. Pre-Deployment Validation
```yaml
# .github/workflows/production-deployment.yml
name: Production Deployment with Database Testing

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      skip_tests:
        description: 'Skip database tests (emergency deployments only)'
        required: false
        default: false
        type: boolean

jobs:
  pre-deployment-validation:
    name: Pre-Deployment Database Validation
    runs-on: ubuntu-latest
    if: ${{ !inputs.skip_tests }}
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
        
      - name: Validate Production Database Schema
        env:
          PRODUCTION_DB_URL: ${{ secrets.PRODUCTION_DB_URL }}
        run: |
          # Validate schema compatibility
          ./sql/tests/scripts/validate_production_schema.sh
          
      - name: Run Critical Path Tests
        env:
          PRODUCTION_DB_URL: ${{ secrets.PRODUCTION_DB_URL }}
        run: |
          # Run subset of critical tests on production
          ./sql/tests/run_tests.sh --production-safe --critical-only
          
      - name: Performance Baseline Check
        env:
          PRODUCTION_DB_URL: ${{ secrets.PRODUCTION_DB_URL }}
        run: |
          # Verify current performance meets baselines
          ./sql/tests/scripts/check_performance_baselines.sh

  database-migration:
    name: Database Migration Execution
    runs-on: ubuntu-latest
    needs: pre-deployment-validation
    if: ${{ always() && (needs.pre-deployment-validation.result == 'success' || inputs.skip_tests) }}
    
    steps:
      - name: Execute Database Migrations
        env:
          PRODUCTION_DB_URL: ${{ secrets.PRODUCTION_DB_URL }}
        run: |
          # Execute pending migrations
          ./scripts/migrate_production.sh
          
      - name: Post-Migration Validation
        env:
          PRODUCTION_DB_URL: ${{ secrets.PRODUCTION_DB_URL }}
        run: |
          # Validate migrations completed successfully
          ./sql/tests/run_tests.sh --migration --post-deployment

  production-testing:
    name: Production Database Testing
    runs-on: ubuntu-latest
    needs: database-migration
    if: ${{ always() && needs.database-migration.result == 'success' }}
    
    steps:
      - name: Full Production Test Suite
        env:
          PRODUCTION_DB_URL: ${{ secrets.PRODUCTION_DB_URL }}
        run: |
          # Run complete production test suite
          ./sql/tests/run_tests.sh --production --all-categories
          
      - name: Performance Regression Detection
        env:
          PRODUCTION_DB_URL: ${{ secrets.PRODUCTION_DB_URL }}
        run: |
          # Check for performance regressions
          ./sql/tests/scripts/production_performance_check.sh
          
      - name: Update Performance Baselines
        if: success()
        env:
          PRODUCTION_DB_URL: ${{ secrets.PRODUCTION_DB_URL }}
        run: |
          # Update performance baselines if tests pass
          ./sql/tests/scripts/update_performance_baselines.sh
```

## Post-Deployment Validation

### Production Health Checks

```sql
-- Production health check procedure
CREATE OR REPLACE FUNCTION production_health_check()
RETURNS TABLE(
    check_category TEXT,
    check_name TEXT,
    status TEXT,
    message TEXT,
    checked_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Database connectivity check
    RETURN QUERY
    SELECT 
        'Connectivity'::TEXT,
        'Database Connection'::TEXT,
        'HEALTHY'::TEXT,
        'Database is accessible and responsive'::TEXT,
        NOW();
    
    -- Critical table availability
    RETURN QUERY
    SELECT
        'Schema Health'::TEXT,
        'Critical Tables'::TEXT,
        CASE 
            WHEN (
                SELECT COUNT(*) FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('contacts', 'organizations', 'opportunities', 'interactions')
            ) = 4 THEN 'HEALTHY'::TEXT
            ELSE 'UNHEALTHY'::TEXT
        END,
        'All critical tables present: ' || (
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('contacts', 'organizations', 'opportunities', 'interactions')
        )::TEXT || '/4',
        NOW();
    
    -- RLS policy health
    RETURN QUERY
    SELECT
        'Security Health'::TEXT,
        'RLS Policies'::TEXT,
        CASE
            WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') >= 20
            THEN 'HEALTHY'::TEXT
            ELSE 'DEGRADED'::TEXT
        END,
        'Active RLS policies: ' || (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public')::TEXT,
        NOW();
    
    -- Performance health  
    RETURN QUERY
    SELECT
        'Performance Health'::TEXT,
        'Query Response Time'::TEXT,
        CASE
            WHEN (
                SELECT COALESCE(AVG(mean_exec_time), 0) 
                FROM pg_stat_statements 
                WHERE calls > 10
            ) < 100 THEN 'HEALTHY'::TEXT
            WHEN (
                SELECT COALESCE(AVG(mean_exec_time), 0) 
                FROM pg_stat_statements 
                WHERE calls > 10  
            ) < 500 THEN 'DEGRADED'::TEXT
            ELSE 'UNHEALTHY'::TEXT
        END,
        'Average query time: ' || ROUND((
            SELECT COALESCE(AVG(mean_exec_time), 0) 
            FROM pg_stat_statements 
            WHERE calls > 10
        )::NUMERIC, 2)::TEXT || 'ms',
        NOW();
        
    -- Data integrity check
    RETURN QUERY
    SELECT
        'Data Integrity'::TEXT,
        'Referential Integrity'::TEXT,
        CASE
            WHEN NOT EXISTS (
                SELECT 1 FROM contacts c 
                LEFT JOIN organizations o ON c.organization_id = o.id 
                WHERE c.organization_id IS NOT NULL AND o.id IS NULL
            ) THEN 'HEALTHY'::TEXT
            ELSE 'UNHEALTHY'::TEXT
        END,
        'Orphaned records detected: ' || (
            SELECT COUNT(*) FROM contacts c 
            LEFT JOIN organizations o ON c.organization_id = o.id 
            WHERE c.organization_id IS NOT NULL AND o.id IS NULL
        )::TEXT,
        NOW();
END$$
LANGUAGE plpgsql;
```

## Troubleshooting and Rollback

### Emergency Rollback Procedures

#### 1. Automated Rollback Detection
```bash
#!/bin/bash
# Emergency Rollback Detection and Execution

set -euo pipefail

DB_URL="${PRODUCTION_DB_URL}"
ROLLBACK_TRIGGER_FILE="${ROLLBACK_TRIGGER_FILE:-/tmp/emergency_rollback.trigger}"

# Check for rollback triggers
check_rollback_triggers() {
    echo "🔍 Checking for rollback triggers..."
    
    # Check for manual trigger file
    if [[ -f "$ROLLBACK_TRIGGER_FILE" ]]; then
        echo "🚨 Manual rollback trigger detected"
        return 0
    fi
    
    # Check test failure rate
    local failure_rate
    failure_rate=$(psql "$DB_URL" -t -c "
        SELECT COALESCE(
            AVG(CASE WHEN tests_failed > 0 THEN 1.0 ELSE 0.0 END) * 100,
            0
        )
        FROM prod_test_schema.prod_test_execution_log
        WHERE start_time >= NOW() - INTERVAL '1 hour';
    " | xargs)
    
    if (( $(echo "$failure_rate > 20" | bc -l) )); then
        echo "🚨 High test failure rate detected: ${failure_rate}%"
        return 0
    fi
    
    # Check performance degradation
    local perf_regression
    perf_regression=$(psql "$DB_URL" -t -c "
        SELECT COUNT(*) 
        FROM performance_monitoring.performance_alerts 
        WHERE severity = 'CRITICAL' 
        AND created_at >= NOW() - INTERVAL '30 minutes'
        AND resolved_at IS NULL;
    " | xargs)
    
    if [[ $perf_regression -gt 0 ]]; then
        echo "🚨 Critical performance regression detected"
        return 0
    fi
    
    return 1
}

# Execute emergency rollback
execute_emergency_rollback() {
    echo "🔄 Executing emergency rollback..."
    
    # Get latest backup
    local latest_backup
    latest_backup=$(find /var/backups/supabase -name "*.sql" -type f -printf '%T@ %p\n' | sort -k1nr | head -1 | cut -d' ' -f2-)
    
    if [[ -z "$latest_backup" ]]; then
        echo "❌ No backup found for rollback"
        return 1
    fi
    
    echo "📋 Rolling back to backup: $latest_backup"
    
    # Create emergency backup of current state
    local emergency_backup="/tmp/emergency_backup_$(date +%Y%m%d_%H%M%S).sql"
    pg_dump "$DB_URL" --no-owner --no-acl > "$emergency_backup"
    
    # Restore from backup
    if psql "$DB_URL" -f "$latest_backup"; then
        echo "✅ Emergency rollback completed successfully"
        
        # Log rollback event
        psql "$DB_URL" -c "
            INSERT INTO prod_test_schema.rollback_events 
            (rollback_reason, backup_used, emergency_backup_location, executed_at)
            VALUES (
                'Automated emergency rollback due to system issues',
                '$latest_backup',
                '$emergency_backup',
                NOW()
            );
        "
        
        return 0
    else
        echo "❌ Emergency rollback failed"
        return 1
    fi
}

# Main rollback monitoring
main() {
    echo "🚨 Emergency Rollback Monitor"
    echo "============================"
    
    if check_rollback_triggers; then
        echo "⚠️  Rollback conditions detected - initiating emergency rollback"
        
        if execute_emergency_rollback; then
            echo "✅ Emergency rollback completed successfully"
            
            # Clear trigger file
            rm -f "$ROLLBACK_TRIGGER_FILE"
            
            # Send notifications
            echo "📧 Sending rollback notifications..."
            # Add notification logic here
            
        else
            echo "❌ Emergency rollback failed - manual intervention required"
            exit 1
        fi
    else
        echo "✅ No rollback conditions detected - system operating normally"
    fi
}

# Execute if run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
```

### Production Incident Response

```sql
-- Production incident tracking
CREATE TABLE IF NOT EXISTS prod_test_schema.production_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_type VARCHAR(50) NOT NULL, -- 'TEST_FAILURE', 'PERFORMANCE', 'SECURITY', 'DATA_INTEGRITY'
    severity VARCHAR(20) NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    title TEXT NOT NULL,
    description TEXT,
    detection_method VARCHAR(50), -- 'AUTOMATED_TEST', 'MONITORING', 'USER_REPORT'
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    rollback_performed BOOLEAN DEFAULT false,
    affected_tables TEXT[],
    performance_impact JSONB,
    assigned_to TEXT,
    status VARCHAR(20) DEFAULT 'OPEN' -- 'OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'
);

-- Incident response procedures
CREATE OR REPLACE FUNCTION create_production_incident(
    p_incident_type TEXT,
    p_severity TEXT,
    p_title TEXT,
    p_description TEXT DEFAULT NULL,
    p_detection_method TEXT DEFAULT 'AUTOMATED_TEST'
) RETURNS UUID AS $$
DECLARE
    incident_id UUID;
BEGIN
    INSERT INTO prod_test_schema.production_incidents 
    (incident_type, severity, title, description, detection_method)
    VALUES (p_incident_type, p_severity, p_title, p_description, p_detection_method)
    RETURNING id INTO incident_id;
    
    -- Auto-assign critical incidents
    IF p_severity = 'CRITICAL' THEN
        UPDATE prod_test_schema.production_incidents 
        SET assigned_to = 'on-call-engineer',
            status = 'INVESTIGATING'
        WHERE id = incident_id;
    END IF;
    
    RETURN incident_id;
END$$
LANGUAGE plpgsql;
```

This production deployment guide provides comprehensive procedures for safely deploying and maintaining the database testing framework in production environments, with robust validation, monitoring, and recovery capabilities.