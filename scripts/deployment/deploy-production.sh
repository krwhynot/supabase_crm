#!/bin/bash

# =============================================================================
# Production Deployment Script - Interaction Management System
# =============================================================================
# Orchestrates the complete production deployment of the interaction system
# including database migration, application deployment, and verification.
#
# Usage: ./deploy-production.sh [--dry-run] [--skip-tests] [--force]
#
# Options:
#   --dry-run     : Show what would be done without executing
#   --skip-tests  : Skip pre-deployment testing (not recommended)
#   --force       : Force deployment even if pre-checks fail
#
# Prerequisites:
#   - Vercel CLI installed and authenticated
#   - Database access configured
#   - Environment variables set
#   - Team notification completed
# =============================================================================

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# =============================================================================
# CONFIGURATION AND VARIABLES
# =============================================================================

# Script metadata
SCRIPT_VERSION="1.0.0"
DEPLOYMENT_START_TIME=$(date +%s)
LOG_FILE="deployment-$(date +%Y%m%d_%H%M%S).log"
DEPLOYMENT_ID="interaction-system-$(date +%Y%m%d_%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Deployment configuration
PROJECT_NAME="Interaction Management System"
PRODUCTION_URL="https://crm.kjrcloud.com"
DATABASE_MIGRATION_PATH="sql"
BACKUP_PATH="backups"
MONITORING_URL="$PRODUCTION_URL/health"

# Performance thresholds
MAX_DEPLOY_TIME=1800  # 30 minutes maximum deployment time
MAX_VERIFICATION_TIME=300  # 5 minutes maximum verification time
HEALTH_CHECK_RETRIES=10
HEALTH_CHECK_INTERVAL=30

# Parse command line arguments
DRY_RUN=false
SKIP_TESTS=false
FORCE_DEPLOY=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    --force)
      FORCE_DEPLOY=true
      shift
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} ${timestamp}: $message" | tee -a "$LOG_FILE"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} ${timestamp}: $message" | tee -a "$LOG_FILE"
            ;;
        "WARNING")
            echo -e "${YELLOW}[WARNING]${NC} ${timestamp}: $message" | tee -a "$LOG_FILE"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} ${timestamp}: $message" | tee -a "$LOG_FILE"
            ;;
        "STEP")
            echo -e "${PURPLE}[STEP]${NC} ${timestamp}: $message" | tee -a "$LOG_FILE"
            ;;
    esac
}

# Error handler
handle_error() {
    local line_number=$1
    local error_code=$2
    local command="$3"
    
    log "ERROR" "Deployment failed at line $line_number with exit code $error_code"
    log "ERROR" "Failed command: $command"
    log "ERROR" "Check the log file for details: $LOG_FILE"
    
    # Attempt to trigger rollback
    if ! $DRY_RUN; then
        log "WARNING" "Attempting automatic rollback..."
        rollback_deployment || log "ERROR" "Automatic rollback failed - manual intervention required"
    fi
    
    exit $error_code
}

# Set error trap
trap 'handle_error ${LINENO} $? "$BASH_COMMAND"' ERR

# Progress indicator
show_progress() {
    local duration=$1
    local description=$2
    
    if $DRY_RUN; then
        log "INFO" "[DRY RUN] Would execute: $description"
        return 0
    fi
    
    local progress=0
    local increment=$((100 / duration))
    
    echo -n "$description: "
    
    for ((i=1; i<=duration; i++)); do
        echo -n "."
        sleep 1
        progress=$((progress + increment))
    done
    
    echo " ✓"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# =============================================================================
# VALIDATION FUNCTIONS
# =============================================================================

# Validate prerequisites
validate_prerequisites() {
    log "STEP" "Validating deployment prerequisites..."
    
    local errors=0
    
    # Check required commands
    local required_commands=("psql" "vercel" "curl" "jq" "npm")
    for cmd in "${required_commands[@]}"; do
        if ! command_exists "$cmd"; then
            log "ERROR" "Required command not found: $cmd"
            errors=$((errors + 1))
        else
            log "INFO" "Found required command: $cmd"
        fi
    done
    
    # Check environment variables
    local required_vars=("DATABASE_URL" "VERCEL_TOKEN")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log "ERROR" "Required environment variable not set: $var"
            errors=$((errors + 1))
        else
            log "INFO" "Environment variable set: $var"
        fi
    done
    
    # Check database connectivity
    if ! $DRY_RUN; then
        log "INFO" "Testing database connectivity..."
        if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
            log "SUCCESS" "Database connectivity confirmed"
        else
            log "ERROR" "Cannot connect to database"
            errors=$((errors + 1))
        fi
    fi
    
    # Check Vercel authentication
    if ! $DRY_RUN; then
        log "INFO" "Testing Vercel authentication..."
        if vercel whoami > /dev/null 2>&1; then
            log "SUCCESS" "Vercel authentication confirmed"
        else
            log "ERROR" "Vercel authentication failed"
            errors=$((errors + 1))
        fi
    fi
    
    # Check project directory
    if [[ ! -f "package.json" ]] || [[ ! -d "src" ]]; then
        log "ERROR" "Not in a valid project directory"
        errors=$((errors + 1))
    fi
    
    if [[ $errors -gt 0 ]] && ! $FORCE_DEPLOY; then
        log "ERROR" "Prerequisites validation failed with $errors errors"
        log "ERROR" "Use --force to bypass validation (not recommended)"
        exit 1
    elif [[ $errors -gt 0 ]] && $FORCE_DEPLOY; then
        log "WARNING" "Prerequisites validation failed but proceeding due to --force flag"
    else
        log "SUCCESS" "All prerequisites validated successfully"
    fi
}

# Run pre-deployment tests
run_pre_deployment_tests() {
    if $SKIP_TESTS; then
        log "WARNING" "Skipping pre-deployment tests due to --skip-tests flag"
        return 0
    fi
    
    log "STEP" "Running pre-deployment test suite..."
    
    if $DRY_RUN; then
        log "INFO" "[DRY RUN] Would run comprehensive test suite"
        return 0
    fi
    
    # Install dependencies
    log "INFO" "Installing dependencies..."
    npm ci
    
    # Run type checking
    log "INFO" "Running type checks..."
    npm run type-check
    
    # Run linting
    log "INFO" "Running code linting..."
    npm run lint
    
    # Run unit tests
    log "INFO" "Running unit tests..."
    npm run test:unit
    
    # Run accessibility tests
    log "INFO" "Running accessibility tests..."
    npm run test:accessibility
    
    # Run performance tests
    log "INFO" "Running performance tests..."
    npm run test:performance
    
    # Run smoke tests
    log "INFO" "Running smoke tests..."
    npm run test:e2e
    
    log "SUCCESS" "All pre-deployment tests passed"
}

# Validate current production state
validate_production_state() {
    log "STEP" "Validating current production state..."
    
    if $DRY_RUN; then
        log "INFO" "[DRY RUN] Would validate production state"
        return 0
    fi
    
    # Check production URL accessibility
    log "INFO" "Checking production URL accessibility..."
    if curl -f -s "$PRODUCTION_URL" > /dev/null; then
        log "SUCCESS" "Production URL is accessible"
    else
        log "WARNING" "Production URL is not accessible (may be expected for new deployment)"
    fi
    
    # Check database state
    log "INFO" "Checking database state..."
    local table_exists
    table_exists=$(psql "$DATABASE_URL" -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interactions');" | xargs)
    
    if [[ "$table_exists" == "t" ]]; then
        log "WARNING" "Interactions table already exists - this may be a redeploy"
        
        # Get current record count
        local record_count
        record_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM public.interactions WHERE deleted_at IS NULL;" | xargs)
        log "INFO" "Current interactions count: $record_count"
        
        if ! $FORCE_DEPLOY; then
            log "ERROR" "Interactions table exists - use --force to proceed with redeploy"
            exit 1
        fi
    else
        log "INFO" "Interactions table does not exist - proceeding with fresh deployment"
    fi
}

# =============================================================================
# BACKUP FUNCTIONS
# =============================================================================

# Create database backup
create_database_backup() {
    log "STEP" "Creating database backup..."
    
    if $DRY_RUN; then
        log "INFO" "[DRY RUN] Would create database backup"
        return 0
    fi
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_PATH"
    
    # Generate backup filename
    local backup_file="$BACKUP_PATH/backup_pre_interactions_$(date +%Y%m%d_%H%M%S).sql"
    
    log "INFO" "Creating backup: $backup_file"
    
    # Create database dump
    if pg_dump "$DATABASE_URL" > "$backup_file"; then
        log "SUCCESS" "Database backup created: $backup_file"
        
        # Verify backup integrity
        if pg_restore --list "$backup_file" > /dev/null 2>&1; then
            log "SUCCESS" "Backup integrity verified"
        else
            log "WARNING" "Backup integrity check failed"
        fi
        
        # Store backup path for potential rollback
        echo "$backup_file" > "$BACKUP_PATH/latest_backup.txt"
        
    else
        log "ERROR" "Database backup failed"
        exit 1
    fi
}

# =============================================================================
# DATABASE MIGRATION FUNCTIONS
# =============================================================================

# Execute database migration
execute_database_migration() {
    log "STEP" "Executing database migration..."
    
    if $DRY_RUN; then
        log "INFO" "[DRY RUN] Would execute database migration files"
        return 0
    fi
    
    # Migration files in order
    local migration_files=(
        "$DATABASE_MIGRATION_PATH/32_interactions_schema.sql"
        "$DATABASE_MIGRATION_PATH/33_interactions_rls_policies.sql"
        "$DATABASE_MIGRATION_PATH/34_interactions_indexes.sql"
    )
    
    # Execute each migration file
    for migration_file in "${migration_files[@]}"; do
        if [[ ! -f "$migration_file" ]]; then
            log "ERROR" "Migration file not found: $migration_file"
            exit 1
        fi
        
        log "INFO" "Executing migration: $migration_file"
        
        if psql "$DATABASE_URL" -f "$migration_file"; then
            log "SUCCESS" "Migration completed: $migration_file"
        else
            log "ERROR" "Migration failed: $migration_file"
            exit 1
        fi
    done
    
    log "SUCCESS" "All database migrations completed successfully"
}

# Verify database migration
verify_database_migration() {
    log "STEP" "Verifying database migration..."
    
    if $DRY_RUN; then
        log "INFO" "[DRY RUN] Would verify database migration"
        return 0
    fi
    
    # Run verification script
    local verification_script="sql/deployment/production_migration_verification.sql"
    
    if [[ -f "$verification_script" ]]; then
        log "INFO" "Running migration verification script..."
        
        if psql "$DATABASE_URL" -f "$verification_script"; then
            log "SUCCESS" "Database migration verification completed"
        else
            log "ERROR" "Database migration verification failed"
            exit 1
        fi
    else
        log "WARNING" "Migration verification script not found: $verification_script"
        
        # Basic manual verification
        log "INFO" "Performing basic migration verification..."
        
        # Check table exists
        local table_exists
        table_exists=$(psql "$DATABASE_URL" -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interactions');" | xargs)
        
        if [[ "$table_exists" == "t" ]]; then
            log "SUCCESS" "Interactions table created successfully"
        else
            log "ERROR" "Interactions table creation failed"
            exit 1
        fi
        
        # Check RLS enabled
        local rls_enabled
        rls_enabled=$(psql "$DATABASE_URL" -t -c "SELECT rowsecurity FROM pg_tables WHERE tablename = 'interactions';" | xargs)
        
        if [[ "$rls_enabled" == "t" ]]; then
            log "SUCCESS" "RLS enabled on interactions table"
        else
            log "WARNING" "RLS not enabled on interactions table"
        fi
        
        # Check indexes
        local index_count
        index_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'interactions';" | xargs)
        
        log "INFO" "Interactions table indexes created: $index_count"
        
        if [[ $index_count -gt 10 ]]; then
            log "SUCCESS" "Sufficient indexes created for performance"
        else
            log "WARNING" "Fewer indexes than expected: $index_count"
        fi
    fi
}

# =============================================================================
# APPLICATION DEPLOYMENT FUNCTIONS
# =============================================================================

# Build application
build_application() {
    log "STEP" "Building application for production..."
    
    if $DRY_RUN; then
        log "INFO" "[DRY RUN] Would build application"
        return 0
    fi
    
    # Clean previous builds
    log "INFO" "Cleaning previous builds..."
    rm -rf dist/
    rm -rf .vite/
    
    # Install production dependencies
    log "INFO" "Installing production dependencies..."
    npm ci --only=production
    
    # Run production build
    log "INFO" "Running production build..."
    NODE_ENV=production npm run build:prod
    
    # Verify build output
    if [[ -d "dist" ]] && [[ -f "dist/index.html" ]]; then
        log "SUCCESS" "Production build completed successfully"
        
        # Show build statistics
        local build_size
        build_size=$(du -sh dist/ | cut -f1)
        log "INFO" "Build size: $build_size"
        
    else
        log "ERROR" "Production build failed - output directory missing"
        exit 1
    fi
}

# Deploy to Vercel
deploy_to_vercel() {
    log "STEP" "Deploying application to Vercel..."
    
    if $DRY_RUN; then
        log "INFO" "[DRY RUN] Would deploy to Vercel production"
        return 0
    fi
    
    # Deploy to production
    log "INFO" "Triggering Vercel production deployment..."
    
    local deployment_output
    deployment_output=$(vercel --prod --yes 2>&1)
    local deployment_exit_code=$?
    
    if [[ $deployment_exit_code -eq 0 ]]; then
        log "SUCCESS" "Vercel deployment completed"
        log "INFO" "Deployment output: $deployment_output"
        
        # Extract deployment URL
        local deployment_url
        deployment_url=$(echo "$deployment_output" | grep -o 'https://[^[:space:]]*' | head -1)
        
        if [[ -n "$deployment_url" ]]; then
            log "INFO" "Deployment URL: $deployment_url"
        fi
        
    else
        log "ERROR" "Vercel deployment failed"
        log "ERROR" "Deployment output: $deployment_output"
        exit 1
    fi
}

# =============================================================================
# VERIFICATION FUNCTIONS
# =============================================================================

# Health check
perform_health_check() {
    log "STEP" "Performing application health check..."
    
    if $DRY_RUN; then
        log "INFO" "[DRY RUN] Would perform health check"
        return 0
    fi
    
    local retries=0
    local max_retries=$HEALTH_CHECK_RETRIES
    
    while [[ $retries -lt $max_retries ]]; do
        log "INFO" "Health check attempt $((retries + 1))/$max_retries..."
        
        if curl -f -s "$MONITORING_URL" > /dev/null; then
            log "SUCCESS" "Health check passed"
            return 0
        else
            log "WARNING" "Health check failed, retrying in $HEALTH_CHECK_INTERVAL seconds..."
            sleep $HEALTH_CHECK_INTERVAL
            retries=$((retries + 1))
        fi
    done
    
    log "ERROR" "Health check failed after $max_retries attempts"
    exit 1
}

# Run smoke tests
run_smoke_tests() {
    log "STEP" "Running post-deployment smoke tests..."
    
    if $DRY_RUN; then
        log "INFO" "[DRY RUN] Would run smoke tests"
        return 0
    fi
    
    # Test basic application functionality
    log "INFO" "Testing application accessibility..."
    if curl -f -s "$PRODUCTION_URL" | grep -q "Dashboard"; then
        log "SUCCESS" "Application loads successfully"
    else
        log "ERROR" "Application does not load properly"
        exit 1
    fi
    
    # Test interactions page
    log "INFO" "Testing interactions page..."
    if curl -f -s "$PRODUCTION_URL/interactions" > /dev/null; then
        log "SUCCESS" "Interactions page accessible"
    else
        log "ERROR" "Interactions page not accessible"
        exit 1
    fi
    
    # Run automated smoke tests if available
    if command_exists npx && [[ -f "playwright.config.ts" ]]; then
        log "INFO" "Running automated smoke tests..."
        if npm run test:smoke-production; then
            log "SUCCESS" "Automated smoke tests passed"
        else
            log "WARNING" "Automated smoke tests failed (check manually)"
        fi
    fi
    
    log "SUCCESS" "Smoke tests completed"
}

# Performance validation
validate_performance() {
    log "STEP" "Validating application performance..."
    
    if $DRY_RUN; then
        log "INFO" "[DRY RUN] Would validate performance"
        return 0
    fi
    
    # Basic performance test using curl
    log "INFO" "Testing page load performance..."
    
    local start_time
    local end_time
    local load_time
    
    start_time=$(date +%s%N)
    curl -f -s "$PRODUCTION_URL" > /dev/null
    end_time=$(date +%s%N)
    
    load_time=$(( (end_time - start_time) / 1000000 ))  # Convert to milliseconds
    
    log "INFO" "Page load time: ${load_time}ms"
    
    if [[ $load_time -lt 3000 ]]; then
        log "SUCCESS" "Page load performance within target (<3000ms)"
    else
        log "WARNING" "Page load performance exceeds target (${load_time}ms > 3000ms)"
    fi
    
    # Additional performance tests could be added here
    log "SUCCESS" "Performance validation completed"
}

# =============================================================================
# ROLLBACK FUNCTIONS
# =============================================================================

# Rollback deployment
rollback_deployment() {
    log "STEP" "Initiating deployment rollback..."
    
    if $DRY_RUN; then
        log "INFO" "[DRY RUN] Would rollback deployment"
        return 0
    fi
    
    # Application rollback
    log "INFO" "Rolling back application deployment..."
    
    # Get previous deployment
    local previous_deployment
    previous_deployment=$(vercel ls --meta.environment=production | grep success | head -2 | tail -1 | awk '{print $1}')
    
    if [[ -n "$previous_deployment" ]]; then
        log "INFO" "Rolling back to deployment: $previous_deployment"
        
        if vercel rollback "$previous_deployment" --prod; then
            log "SUCCESS" "Application rollback completed"
        else
            log "ERROR" "Application rollback failed"
        fi
    else
        log "WARNING" "No previous deployment found for rollback"
    fi
    
    # Database rollback
    log "INFO" "Database rollback requires manual intervention"
    log "INFO" "Use: psql \$DATABASE_URL -f sql/deployment/rollback_procedures.sql"
    
    # Restore from backup if available
    local latest_backup
    if [[ -f "$BACKUP_PATH/latest_backup.txt" ]]; then
        latest_backup=$(cat "$BACKUP_PATH/latest_backup.txt")
        log "INFO" "Latest backup available: $latest_backup"
        log "INFO" "To restore: psql \$DATABASE_URL < $latest_backup"
    fi
}

# =============================================================================
# MAIN DEPLOYMENT FUNCTION
# =============================================================================

# Main deployment orchestration
main_deployment() {
    log "INFO" "Starting $PROJECT_NAME deployment (ID: $DEPLOYMENT_ID)"
    log "INFO" "Deployment script version: $SCRIPT_VERSION"
    log "INFO" "Target environment: Production ($PRODUCTION_URL)"
    log "INFO" "Dry run mode: $DRY_RUN"
    
    # Phase 1: Pre-deployment validation
    log "INFO" "=== PHASE 1: PRE-DEPLOYMENT VALIDATION ==="
    validate_prerequisites
    run_pre_deployment_tests
    validate_production_state
    
    # Phase 2: Backup and preparation
    log "INFO" "=== PHASE 2: BACKUP AND PREPARATION ==="
    create_database_backup
    
    # Phase 3: Database migration
    log "INFO" "=== PHASE 3: DATABASE MIGRATION ==="
    execute_database_migration
    verify_database_migration
    
    # Phase 4: Application deployment
    log "INFO" "=== PHASE 4: APPLICATION DEPLOYMENT ==="
    build_application
    deploy_to_vercel
    
    # Phase 5: Post-deployment verification
    log "INFO" "=== PHASE 5: POST-DEPLOYMENT VERIFICATION ==="
    perform_health_check
    run_smoke_tests
    validate_performance
    
    # Calculate deployment time
    local deployment_end_time
    deployment_end_time=$(date +%s)
    local total_deployment_time=$((deployment_end_time - DEPLOYMENT_START_TIME))
    
    log "SUCCESS" "Deployment completed successfully!"
    log "INFO" "Total deployment time: ${total_deployment_time}s"
    log "INFO" "Deployment ID: $DEPLOYMENT_ID"
    log "INFO" "Production URL: $PRODUCTION_URL"
    log "INFO" "Log file: $LOG_FILE"
}

# =============================================================================
# SCRIPT EXECUTION
# =============================================================================

# Display banner
echo -e "${CYAN}"
echo "============================================================================="
echo "  $PROJECT_NAME - Production Deployment"
echo "  Version: $SCRIPT_VERSION"
echo "  Target: $PRODUCTION_URL"
echo "============================================================================="
echo -e "${NC}"

# Check if running in dry-run mode
if $DRY_RUN; then
    echo -e "${YELLOW}🔍 DRY RUN MODE - No changes will be made${NC}"
    echo ""
fi

# Confirm deployment
if ! $DRY_RUN && ! $FORCE_DEPLOY; then
    echo -n "Are you sure you want to deploy to production? (y/N): "
    read -r confirmation
    
    if [[ ! "$confirmation" =~ ^[Yy]$ ]]; then
        log "INFO" "Deployment cancelled by user"
        exit 0
    fi
fi

# Execute main deployment
main_deployment

# Final message
echo ""
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE! 🎉${NC}"
echo ""
echo "Next steps:"
echo "1. Monitor application performance and error rates"
echo "2. Verify feature functionality with stakeholders"
echo "3. Update documentation and notify team"
echo "4. Schedule post-deployment review"
echo ""
echo "Emergency contacts and rollback procedures are documented in:"
echo "  - docs/deployment/INTERACTION_DEPLOYMENT_PLAN.md"
echo "  - sql/deployment/rollback_procedures.sql"

exit 0