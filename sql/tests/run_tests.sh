#!/bin/bash
# =============================================================================
# pgTAP Test Runner for Supabase CRM Database
# =============================================================================
# This script runs the comprehensive pgTAP test suite with proper setup,
# execution, and cleanup procedures.
# 
# Usage:
#   ./sql/tests/run_tests.sh [options]
#
# Options:
#   --setup-only     Only run setup and installation
#   --unit-only      Run only unit tests
#   --integration    Run only integration tests
#   --performance    Run only performance tests
#   --security       Run only security tests
#   --migration      Run only migration tests
#   --stress         Run only stress tests  
#   --regression     Run only regression tests
#   --edge           Run only edge case tests
#   --recovery       Run only backup/recovery tests
#   --monitoring     Run only monitoring tests
#   --verbose        Enable verbose output
#   --no-cleanup     Skip cleanup after tests
#   --parallel       Run tests in parallel (experimental)
#   --database URI   Specify database connection string
# =============================================================================

set -e  # Exit on any error

# =============================================================================
# CONFIGURATION
# =============================================================================

# Default values
VERBOSE=false
SETUP_ONLY=false
UNIT_ONLY=false
INTEGRATION_ONLY=false
PERFORMANCE_ONLY=false
SECURITY_ONLY=false
MIGRATION_ONLY=false
STRESS_ONLY=false
REGRESSION_ONLY=false
EDGE_ONLY=false
RECOVERY_ONLY=false
MONITORING_ONLY=false
NO_CLEANUP=false
PARALLEL=false
DATABASE_URL=""
TEST_SCHEMA="test_schema"
LOG_LEVEL="INFO"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SETUP_DIR="${SCRIPT_DIR}/setup"
UNIT_DIR="${SCRIPT_DIR}/unit"
INTEGRATION_DIR="${SCRIPT_DIR}/integration"
PERFORMANCE_DIR="${SCRIPT_DIR}/performance"
SECURITY_DIR="${SCRIPT_DIR}/security"
MIGRATION_DIR="${SCRIPT_DIR}/migration"
STRESS_DIR="${SCRIPT_DIR}/stress"
REGRESSION_DIR="${SCRIPT_DIR}/regression"
EDGE_DIR="${SCRIPT_DIR}/edge"
RECOVERY_DIR="${SCRIPT_DIR}/recovery"
MONITORING_DIR="${SCRIPT_DIR}/monitoring"
HELPERS_DIR="${SCRIPT_DIR}/helpers"

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

log_info() {
    if [[ "$LOG_LEVEL" == "DEBUG" ]] || [[ "$LOG_LEVEL" == "INFO" ]]; then
        echo -e "${BLUE}[INFO]${NC} $1"
    fi
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_debug() {
    if [[ "$LOG_LEVEL" == "DEBUG" ]]; then
        echo -e "${BLUE}[DEBUG]${NC} $1"
    fi
}

show_help() {
    cat << EOF
pgTAP Test Runner for Supabase CRM Database

Usage: $0 [options]

Options:
    --setup-only        Only run setup and installation
    --unit-only         Run only unit tests
    --integration       Run only integration tests  
    --performance       Run only performance tests
    --security          Run only security tests
    --migration         Run only migration tests
    --stress            Run only stress tests
    --regression        Run only regression tests
    --edge              Run only edge case tests
    --recovery          Run only backup/recovery tests
    --monitoring        Run only monitoring tests
    --verbose           Enable verbose output
    --no-cleanup        Skip cleanup after tests
    --parallel          Run tests in parallel (experimental)
    --database URI      Specify database connection string
    --help              Show this help message

Environment Variables:
    SUPABASE_DB_URL     Database connection string
    SUPABASE_DB_HOST    Database host (default: localhost)
    SUPABASE_DB_PORT    Database port (default: 5432)
    SUPABASE_DB_NAME    Database name (default: postgres)
    SUPABASE_DB_USER    Database user (default: postgres)
    SUPABASE_DB_PASS    Database password

Examples:
    # Run all tests
    $0

    # Run only unit tests with verbose output
    $0 --unit-only --verbose

    # Run setup and then integration tests
    $0 --setup-only && $0 --integration

    # Run migration and stress tests in parallel
    $0 --migration --parallel && $0 --stress --parallel

    # Run edge case tests with custom database
    $0 --edge --database "postgresql://user:pass@host:port/db"

    # Run complete Phase 5 test suite
    $0 --migration && $0 --stress && $0 --regression && $0 --edge && $0 --recovery && $0 --monitoring

EOF
}

# =============================================================================
# ARGUMENT PARSING
# =============================================================================

while [[ $# -gt 0 ]]; do
    case $1 in
        --setup-only)
            SETUP_ONLY=true
            shift
            ;;
        --unit-only)
            UNIT_ONLY=true
            shift
            ;;
        --integration)
            INTEGRATION_ONLY=true
            shift
            ;;
        --performance)
            PERFORMANCE_ONLY=true
            shift
            ;;
        --security)
            SECURITY_ONLY=true
            shift
            ;;
        --migration)
            MIGRATION_ONLY=true
            shift
            ;;
        --stress)
            STRESS_ONLY=true
            shift
            ;;
        --regression)
            REGRESSION_ONLY=true
            shift
            ;;
        --edge)
            EDGE_ONLY=true
            shift
            ;;
        --recovery)
            RECOVERY_ONLY=true
            shift
            ;;
        --monitoring)
            MONITORING_ONLY=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            LOG_LEVEL="DEBUG"
            shift
            ;;
        --no-cleanup)
            NO_CLEANUP=true
            shift
            ;;
        --parallel)
            PARALLEL=true
            shift
            ;;
        --database)
            DATABASE_URL="$2"
            shift 2
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# =============================================================================
# DATABASE CONNECTION SETUP
# =============================================================================

setup_database_connection() {
    log_info "Setting up database connection..."
    
    if [[ -n "$DATABASE_URL" ]]; then
        export PGCONNSTRING="$DATABASE_URL"
        log_debug "Using provided database URL"
    elif [[ -n "$SUPABASE_DB_URL" ]]; then
        export PGCONNSTRING="$SUPABASE_DB_URL"
        log_debug "Using SUPABASE_DB_URL environment variable"
    else
        # Build connection string from components
        local host="${SUPABASE_DB_HOST:-localhost}"
        local port="${SUPABASE_DB_PORT:-5432}"
        local dbname="${SUPABASE_DB_NAME:-postgres}"
        local user="${SUPABASE_DB_USER:-postgres}"
        local password="${SUPABASE_DB_PASS:-}"
        
        if [[ -n "$password" ]]; then
            export PGCONNSTRING="postgresql://${user}:${password}@${host}:${port}/${dbname}"
        else
            export PGCONNSTRING="postgresql://${user}@${host}:${port}/${dbname}"
        fi
        
        log_debug "Built connection string from components"
    fi
    
    # Test connection
    if ! psql "$PGCONNSTRING" -c "SELECT version();" > /dev/null 2>&1; then
        log_error "Failed to connect to database"
        log_error "Connection string: ${PGCONNSTRING%:*}:****@*"
        exit 1
    fi
    
    log_success "Database connection established"
}

# =============================================================================
# SETUP FUNCTIONS
# =============================================================================

run_setup() {
    log_info "Running pgTAP setup and installation..."
    
    local setup_files=(
        "${SETUP_DIR}/00_install_pgtap.sql"
        "${SETUP_DIR}/01_test_schema_isolation.sql"
        "${SETUP_DIR}/02_test_data_registry.sql"
        "${SETUP_DIR}/03_test_monitoring.sql"
        "${HELPERS_DIR}/test_helpers.sql"
        "${HELPERS_DIR}/advanced_test_helpers.sql"
        "${SECURITY_DIR}/security_test_helpers.sql"
    )
    
    for file in "${setup_files[@]}"; do
        if [[ -f "$file" ]]; then
            log_debug "Executing setup file: $(basename "$file")"
            if psql "$PGCONNSTRING" -f "$file" > /dev/null 2>&1; then
                log_success "Setup completed: $(basename "$file")"
            else
                log_error "Setup failed: $(basename "$file")"
                return 1
            fi
        else
            log_warning "Setup file not found: $file"
        fi
    done
    
    log_success "pgTAP setup completed"
}

# =============================================================================
# TEST EXECUTION FUNCTIONS
# =============================================================================

run_test_file() {
    local test_file="$1"
    local test_name=$(basename "$test_file" .sql)
    
    log_debug "Running test: $test_name"
    
    if [[ "$VERBOSE" == "true" ]]; then
        pg_prove --ext .sql --verbose "$test_file"
    else
        pg_prove --ext .sql "$test_file"
    fi
    
    local exit_code=$?
    
    if [[ $exit_code -eq 0 ]]; then
        log_success "PASSED: $test_name"
    else
        log_error "FAILED: $test_name"
    fi
    
    return $exit_code
}

run_test_directory() {
    local test_dir="$1"
    local test_type="$2"
    local failed_tests=()
    local passed_tests=()
    
    if [[ ! -d "$test_dir" ]]; then
        log_warning "Test directory not found: $test_dir"
        return 0
    fi
    
    log_info "Running $test_type tests from: $test_dir"
    
    for test_file in "$test_dir"/*.sql; do
        if [[ -f "$test_file" ]]; then
            if run_test_file "$test_file"; then
                passed_tests+=("$(basename "$test_file")")
            else
                failed_tests+=("$(basename "$test_file")")
            fi
        fi
    done
    
    # Report results
    local total_tests=$((${#passed_tests[@]} + ${#failed_tests[@]}))
    log_info "$test_type Results: ${#passed_tests[@]}/$total_tests passed"
    
    if [[ ${#failed_tests[@]} -gt 0 ]]; then
        log_error "Failed $test_type tests:"
        for test in "${failed_tests[@]}"; do
            log_error "  - $test"
        done
        return 1
    fi
    
    return 0
}

run_parallel_tests() {
    local test_dir="$1"
    local test_type="$2"
    
    log_info "Running $test_type tests in parallel from: $test_dir"
    
    if [[ "$VERBOSE" == "true" ]]; then
        pg_prove --ext .sql --verbose --jobs 4 "$test_dir"
    else
        pg_prove --ext .sql --jobs 4 "$test_dir"
    fi
}

# =============================================================================
# CLEANUP FUNCTIONS
# =============================================================================

cleanup_test_data() {
    if [[ "$NO_CLEANUP" == "true" ]]; then
        log_info "Skipping cleanup as requested"
        return 0
    fi
    
    log_info "Cleaning up test data..."
    
    local cleanup_sql="
    DO \$\$
    BEGIN
        -- Clean up all test data
        PERFORM test_schema.cleanup_all_test_data();
        
        -- Clean up test execution logs older than 1 hour
        DELETE FROM test_schema.test_execution_log 
        WHERE start_time < NOW() - INTERVAL '1 hour';
        
        -- Clean up test data registry for completed tests
        DELETE FROM test_schema.test_data_registry 
        WHERE cleaned_up_at IS NOT NULL 
        AND cleaned_up_at < NOW() - INTERVAL '1 hour';
        
        -- Clean up test execution metrics older than 24 hours (keep recent performance data)
        DELETE FROM test_schema.test_execution_metrics 
        WHERE execution_time < NOW() - INTERVAL '24 hours'
        AND test_status = 'completed';
        
        -- Clean up test failure analysis data older than 48 hours
        DELETE FROM test_schema.test_failure_analysis 
        WHERE analysis_time < NOW() - INTERVAL '48 hours';
        
        -- Archive old performance baselines (keep only latest baseline per test)
        WITH latest_baselines AS (
            SELECT test_name, MAX(baseline_date) as latest_date
            FROM test_schema.test_performance_baselines
            GROUP BY test_name
        )
        DELETE FROM test_schema.test_performance_baselines tpb
        WHERE NOT EXISTS (
            SELECT 1 FROM latest_baselines lb
            WHERE lb.test_name = tpb.test_name 
            AND lb.latest_date = tpb.baseline_date
        )
        AND tpb.baseline_date < NOW() - INTERVAL '7 days';
        
        RAISE NOTICE 'Test cleanup completed successfully (including Phase 5 monitoring data)';
    END\$\$;
    "
    
    if psql "$PGCONNSTRING" -c "$cleanup_sql" > /dev/null 2>&1; then
        log_success "Test cleanup completed"
    else
        log_warning "Test cleanup encountered issues"
    fi
}

generate_test_report() {
    local exit_code="$1"
    local duration="$2"
    local start_time="$3"
    
    log_info "Generating comprehensive test execution report..."
    
    local report_sql="
    DO \$\$
    DECLARE
        total_tests INTEGER := 0;
        passed_tests INTEGER := 0;
        failed_tests INTEGER := 0;
        phase_5_tests INTEGER := 0;
        avg_execution_time NUMERIC := 0;
        report_json JSONB;
    BEGIN
        -- Get test execution metrics
        SELECT 
            COUNT(*),
            COUNT(*) FILTER (WHERE test_status = 'passed'),
            COUNT(*) FILTER (WHERE test_status = 'failed'),
            COUNT(*) FILTER (WHERE test_category IN ('migration', 'stress', 'regression', 'edge', 'recovery', 'monitoring')),
            AVG(EXTRACT(EPOCH FROM (end_time - start_time)))
        INTO total_tests, passed_tests, failed_tests, phase_5_tests, avg_execution_time
        FROM test_schema.test_execution_metrics
        WHERE execution_time >= TO_TIMESTAMP($start_time);
        
        -- Build comprehensive report
        report_json := jsonb_build_object(
            'execution_summary', jsonb_build_object(
                'total_duration_seconds', $duration,
                'total_tests', total_tests,
                'passed_tests', passed_tests,
                'failed_tests', failed_tests,
                'success_rate_percent', CASE WHEN total_tests > 0 THEN ROUND((passed_tests::numeric / total_tests * 100), 2) ELSE 0 END,
                'phase_5_tests', phase_5_tests,
                'average_test_time_seconds', COALESCE(ROUND(avg_execution_time, 3), 0)
            ),
            'phase_breakdown', jsonb_build_object(
                'phase_1_4_legacy', total_tests - phase_5_tests,
                'phase_5_new', phase_5_tests
            ),
            'performance_metrics', jsonb_build_object(
                'fastest_test', (
                    SELECT jsonb_build_object('name', test_name, 'duration', EXTRACT(EPOCH FROM (end_time - start_time)))
                    FROM test_schema.test_execution_metrics
                    WHERE execution_time >= TO_TIMESTAMP($start_time)
                    ORDER BY (end_time - start_time) ASC
                    LIMIT 1
                ),
                'slowest_test', (
                    SELECT jsonb_build_object('name', test_name, 'duration', EXTRACT(EPOCH FROM (end_time - start_time)))
                    FROM test_schema.test_execution_metrics
                    WHERE execution_time >= TO_TIMESTAMP($start_time)
                    ORDER BY (end_time - start_time) DESC
                    LIMIT 1
                )
            ),
            'timestamp', NOW(),
            'exit_code', $exit_code
        );
        
        -- Output formatted report
        RAISE NOTICE '=====================================';
        RAISE NOTICE 'COMPREHENSIVE TEST EXECUTION REPORT';
        RAISE NOTICE '=====================================';
        RAISE NOTICE 'Total Tests: % | Passed: % | Failed: %', total_tests, passed_tests, failed_tests;
        RAISE NOTICE 'Success Rate: %% | Phase 5 Tests: %', 
            CASE WHEN total_tests > 0 THEN ROUND((passed_tests::numeric / total_tests * 100), 2) ELSE 0 END,
            phase_5_tests;
        RAISE NOTICE 'Total Duration: %s | Avg Test Time: %s', $duration, COALESCE(ROUND(avg_execution_time, 3), 0);
        RAISE NOTICE '=====================================';
        
        -- Store report in monitoring system
        INSERT INTO test_schema.test_execution_metrics (
            test_name, test_category, test_status, start_time, end_time, 
            execution_time, metadata
        ) VALUES (
            'test_suite_summary', 'reporting', 
            CASE WHEN $exit_code = 0 THEN 'passed' ELSE 'failed' END,
            TO_TIMESTAMP($start_time), NOW(), NOW(), report_json
        ) ON CONFLICT DO NOTHING;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Report generation encountered issues (tests may not have monitoring enabled): %', SQLERRM;
    END\$\$;
    "
    
    if psql "$PGCONNSTRING" -c "$report_sql" > /dev/null 2>&1; then
        log_success "Test execution report generated successfully"
    else
        log_warning "Test report generation encountered issues (continuing...)"
    fi
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
    local start_time=$(date +%s)
    local exit_code=0
    
    log_info "Starting pgTAP test suite execution"
    log_info "Timestamp: $(date)"
    
    # Setup database connection
    setup_database_connection
    
    # Run setup if needed (check if any specific test category is selected)
    local any_specific_test=false
    if [[ "$UNIT_ONLY" == "true" || "$INTEGRATION_ONLY" == "true" || "$PERFORMANCE_ONLY" == "true" || "$SECURITY_ONLY" == "true" || "$MIGRATION_ONLY" == "true" || "$STRESS_ONLY" == "true" || "$REGRESSION_ONLY" == "true" || "$EDGE_ONLY" == "true" || "$RECOVERY_ONLY" == "true" || "$MONITORING_ONLY" == "true" ]]; then
        any_specific_test=true
    fi
    
    if [[ "$SETUP_ONLY" == "true" ]] || [[ "$any_specific_test" == "false" ]]; then
        if ! run_setup; then
            log_error "Setup failed - aborting test run"
            exit 1
        fi
        
        if [[ "$SETUP_ONLY" == "true" ]]; then
            log_success "Setup-only mode completed"
            exit 0
        fi
    fi
    
    # Run tests based on options
    if [[ "$UNIT_ONLY" == "true" ]]; then
        if [[ "$PARALLEL" == "true" ]]; then
            run_parallel_tests "$UNIT_DIR" "unit"
        else
            run_test_directory "$UNIT_DIR" "unit"
        fi
        exit_code=$?
    elif [[ "$INTEGRATION_ONLY" == "true" ]]; then
        if [[ "$PARALLEL" == "true" ]]; then
            run_parallel_tests "$INTEGRATION_DIR" "integration"
        else
            run_test_directory "$INTEGRATION_DIR" "integration"
        fi
        exit_code=$?
    elif [[ "$PERFORMANCE_ONLY" == "true" ]]; then
        if [[ "$PARALLEL" == "true" ]]; then
            run_parallel_tests "$PERFORMANCE_DIR" "performance"
        else
            run_test_directory "$PERFORMANCE_DIR" "performance"
        fi
        exit_code=$?
    elif [[ "$SECURITY_ONLY" == "true" ]]; then
        if [[ "$PARALLEL" == "true" ]]; then
            run_parallel_tests "$SECURITY_DIR" "security"
        else
            run_test_directory "$SECURITY_DIR" "security"
        fi
        exit_code=$?
    elif [[ "$MIGRATION_ONLY" == "true" ]]; then
        if [[ "$PARALLEL" == "true" ]]; then
            run_parallel_tests "$MIGRATION_DIR" "migration"
        else
            run_test_directory "$MIGRATION_DIR" "migration"
        fi
        exit_code=$?
    elif [[ "$STRESS_ONLY" == "true" ]]; then
        if [[ "$PARALLEL" == "true" ]]; then
            run_parallel_tests "$STRESS_DIR" "stress"
        else
            run_test_directory "$STRESS_DIR" "stress"
        fi
        exit_code=$?
    elif [[ "$REGRESSION_ONLY" == "true" ]]; then
        if [[ "$PARALLEL" == "true" ]]; then
            run_parallel_tests "$REGRESSION_DIR" "regression"
        else
            run_test_directory "$REGRESSION_DIR" "regression"
        fi
        exit_code=$?
    elif [[ "$EDGE_ONLY" == "true" ]]; then
        if [[ "$PARALLEL" == "true" ]]; then
            run_parallel_tests "$EDGE_DIR" "edge"
        else
            run_test_directory "$EDGE_DIR" "edge"
        fi
        exit_code=$?
    elif [[ "$RECOVERY_ONLY" == "true" ]]; then
        if [[ "$PARALLEL" == "true" ]]; then
            run_parallel_tests "$RECOVERY_DIR" "recovery"
        else
            run_test_directory "$RECOVERY_DIR" "recovery"
        fi
        exit_code=$?
    elif [[ "$MONITORING_ONLY" == "true" ]]; then
        if [[ "$PARALLEL" == "true" ]]; then
            run_parallel_tests "$MONITORING_DIR" "monitoring"
        else
            run_test_directory "$MONITORING_DIR" "monitoring"
        fi
        exit_code=$?
    else
        # Run all tests
        log_info "Running complete test suite (all categories)"
        
        if [[ "$PARALLEL" == "true" ]]; then
            log_info "Executing Phase 1-4 tests in parallel..."
            run_parallel_tests "$UNIT_DIR" "unit" && \
            run_parallel_tests "$INTEGRATION_DIR" "integration" && \
            run_parallel_tests "$SECURITY_DIR" "security" && \
            run_parallel_tests "$PERFORMANCE_DIR" "performance" && \
            log_info "Executing Phase 5 tests in parallel..." && \
            run_parallel_tests "$MIGRATION_DIR" "migration" && \
            run_parallel_tests "$STRESS_DIR" "stress" && \
            run_parallel_tests "$REGRESSION_DIR" "regression" && \
            run_parallel_tests "$EDGE_DIR" "edge" && \
            run_parallel_tests "$RECOVERY_DIR" "recovery" && \
            run_parallel_tests "$MONITORING_DIR" "monitoring"
        else
            log_info "Executing Phase 1-4 tests sequentially..."
            run_test_directory "$UNIT_DIR" "unit" && \
            run_test_directory "$INTEGRATION_DIR" "integration" && \
            run_test_directory "$SECURITY_DIR" "security" && \
            run_test_directory "$PERFORMANCE_DIR" "performance" && \
            log_info "Executing Phase 5 tests sequentially..." && \
            run_test_directory "$MIGRATION_DIR" "migration" && \
            run_test_directory "$STRESS_DIR" "stress" && \
            run_test_directory "$REGRESSION_DIR" "regression" && \
            run_test_directory "$EDGE_DIR" "edge" && \
            run_test_directory "$RECOVERY_DIR" "recovery" && \
            run_test_directory "$MONITORING_DIR" "monitoring"
        fi
        exit_code=$?
    fi
    
    # Cleanup
    cleanup_test_data
    
    # Report final results with Phase 5 metrics
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_info "Test execution completed in ${duration} seconds"
    
    # Generate comprehensive test report
    generate_test_report "$exit_code" "$duration" "$start_time"
    
    if [[ $exit_code -eq 0 ]]; then
        log_success "All tests passed successfully!"
        log_info "Phase 5 database testing implementation: COMPLETE"
    else
        log_error "Some tests failed. Exit code: $exit_code"
    fi
    
    exit $exit_code
}

# =============================================================================
# SCRIPT EXECUTION
# =============================================================================

# Check for required tools
if ! command -v psql >/dev/null 2>&1; then
    log_error "psql is required but not installed"
    exit 1
fi

if ! command -v pg_prove >/dev/null 2>&1; then
    log_error "pg_prove is required but not installed"
    log_error "Install with: cpan TAP::Parser::SourceHandler::pgTAP"
    exit 1
fi

# Execute main function
main "$@"