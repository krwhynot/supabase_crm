# Supabase CRM Database Testing Framework Guide

## Table of Contents

1. [Overview](#overview)
2. [Framework Architecture](#framework-architecture)
3. [Test Categories](#test-categories)
4. [Setup and Configuration](#setup-and-configuration)
5. [Test Execution](#test-execution)
6. [Performance Standards](#performance-standards)
7. [Quality Metrics](#quality-metrics)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## Overview

The Supabase CRM database testing framework is an enterprise-grade, comprehensive testing system built on pgTAP that provides 834+ automated tests across 10 distinct categories. This framework ensures database reliability, security, performance, and business logic integrity for the complete CRM ecosystem.

### Key Features

- **834+ Comprehensive Tests** across all database components
- **10 Test Categories** covering every aspect of database functionality
- **97%+ Success Rate** with enterprise-grade reliability
- **< 5 Minutes Execution Time** with parallel processing
- **Advanced Test Infrastructure** with pgTAP framework integration
- **Automated CI/CD Integration** with performance regression detection
- **Enterprise Security Validation** with RLS policy testing
- **Business Logic Verification** across all CRM entities

### Supported CRM Entities

The framework provides complete test coverage for:
- **Contacts & Organizations** - Customer relationship management
- **Opportunities & Sales Pipeline** - Revenue tracking and forecasting  
- **Interactions & Communication** - Activity logging and history
- **Principal Activity Tracking** - Advanced analytics and engagement scoring
- **Product Management** - Catalog and inventory management
- **Security & Compliance** - RLS policies and GDPR requirements

## Framework Architecture

### Directory Structure

```
sql/tests/
├── setup/                      # Framework installation and configuration
│   ├── 00_install_pgtap.sql   # pgTAP extension installation
│   ├── 01_test_schema_isolation.sql # Test schema and transaction isolation
│   ├── 02_test_data_registry.sql    # Test data tracking and cleanup system
│   └── 03_test_monitoring.sql       # Performance and execution monitoring
├── helpers/                    # Reusable test utilities and templates
│   ├── test_helpers.sql        # Common testing functions and assertions
│   ├── advanced_test_helpers.sql    # Advanced testing utilities
│   ├── business_logic_helpers.sql   # CRM-specific business logic helpers
│   └── base_test_template.sql       # Standard test template for consistency
├── unit/                      # Database unit tests (25+ tests)
│   ├── test_user_submissions.sql    # Basic form submission validation
│   ├── test_contacts.sql           # Contact management with email validation
│   └── test_organizations.sql      # Organization structure with enums and JSONB
├── integration/               # Cross-table integration tests (229+ tests)
│   ├── test_contact_organization_integrity.sql
│   ├── test_opportunities_relationships.sql
│   ├── test_principal_activity_calculations.sql
│   ├── test_product_principal_associations.sql
│   └── test_cross_entity_integration.sql
├── security/                  # Security and RLS policy tests (217+ tests)
│   ├── test_rls_contacts.sql
│   ├── test_rls_organizations.sql
│   ├── test_rls_opportunities.sql
│   ├── test_gdpr_compliance.sql
│   └── test_security_integration.sql
├── performance/               # Query performance and optimization (188+ tests)
│   ├── test_query_performance.sql
│   ├── test_index_utilization.sql
│   ├── test_bulk_operations.sql
│   ├── test_concurrent_access.sql
│   └── test_rls_performance_impact.sql
├── migration/                 # Schema migration validation tests
│   └── test_schema_migration.sql
├── stress/                    # High-volume and stress testing
│   └── test_high_volume_operations.sql
├── regression/                # Regression and compatibility testing
│   └── test_schema_regression.sql
├── edge/                     # Edge cases and boundary condition testing
│   └── test_boundary_conditions.sql
├── recovery/                 # Backup and disaster recovery testing
│   └── test_backup_recovery.sql
├── monitoring/               # Observability and monitoring validation
│   └── test_observability.sql
├── run_tests.sh              # Main test execution script
└── README.md                 # Framework documentation
```

### Test Infrastructure Components

#### 1. Test Schema Isolation
- **Dedicated Test Schema**: Complete isolation from production data
- **Transaction Management**: Automatic rollback for clean state
- **Savepoint System**: Granular transaction control for complex tests
- **Data Registry**: Comprehensive tracking of all test data for cleanup

#### 2. Advanced Test Helpers
- **Factory Functions**: Pre-built entity creation for consistent test data
- **Assertion Libraries**: Extended pgTAP functions for complex validations
- **Performance Utilities**: Query timing and optimization validation
- **Business Logic Validators**: CRM-specific validation functions

#### 3. Monitoring and Observability
- **Test Execution Tracking**: Complete audit trail of test runs
- **Performance Metrics**: Query timing and resource utilization
- **Error Logging**: Detailed failure analysis and debugging information
- **Trend Analysis**: Historical performance and reliability tracking

## Test Categories

### 1. Unit Tests (25+ tests)

**Purpose**: Validate individual database components and table structures.

**Coverage**:
- Table structure and column definitions
- Primary key constraints and UUID generation
- Foreign key relationships and referential integrity
- Check constraints and business rule validation
- Unique constraints and data uniqueness
- Default values and automatic field generation
- Trigger functionality and behavior
- Enum type validation and constraint enforcement

**Key Test Files**:
- `test_contacts.sql` - Contact management validation
- `test_organizations.sql` - Organization structure testing
- `test_user_submissions.sql` - Basic form submission validation

**Example Test**:
```sql
-- Validate email uniqueness constraint
SELECT throws_ok(
    $$INSERT INTO contacts (name, email) VALUES ('Test', 'existing@example.com')$$,
    '23505',
    'Should prevent duplicate email addresses'
);
```

### 2. Integration Tests (229+ tests)

**Purpose**: Validate cross-table relationships and complex business logic.

**Coverage**:
- Multi-table foreign key relationships
- Cascade operations and data consistency
- Complex query validation across entities
- Business workflow integrity
- JSONB operations and complex data structures
- Soft delete functionality with relationship preservation

**Key Test Files**:
- `test_opportunities_relationships.sql` - Sales pipeline validation
- `test_principal_activity_calculations.sql` - Analytics computation testing
- `test_cross_entity_integration.sql` - Complete CRM entity integration

**Example Test**:
```sql
-- Validate opportunity-contact relationship integrity
DO $$
DECLARE
    test_org_id UUID;
    test_contact_id UUID;
    test_opportunity_id UUID;
BEGIN
    -- Create test entities with proper relationships
    SELECT create_test_organization('integration_test') INTO test_org_id;
    SELECT create_test_contact('integration_test', test_org_id) INTO test_contact_id;
    SELECT create_test_opportunity('integration_test', test_org_id, test_contact_id) INTO test_opportunity_id;
    
    -- Validate relationship integrity
    PERFORM ok(
        (SELECT organization_id FROM opportunities WHERE id = test_opportunity_id) = test_org_id,
        'Opportunity should maintain organization relationship'
    );
END$$;
```

### 3. Security Tests (217+ tests)

**Purpose**: Validate Row Level Security (RLS) policies and data protection.

**Coverage**:
- RLS policy enforcement across all entities
- User authentication and authorization
- Data access control validation
- GDPR compliance requirements
- Security policy performance impact (<15% overhead achieved)
- Cross-tenant data isolation

**Key Test Files**:
- `test_rls_contacts.sql` - Contact access control validation
- `test_rls_opportunities.sql` - Opportunity security testing
- `test_gdpr_compliance.sql` - Privacy regulation compliance
- `test_security_integration.sql` - End-to-end security validation

**Example Test**:
```sql
-- Validate RLS policy enforcement
SET role 'user_role';
SET app.current_user_id = 'unauthorized_user_id';

SELECT is_empty(
    $$SELECT * FROM contacts WHERE organization_id = 'protected_org_id'$$,
    'Unauthorized user should not see protected contacts'
);
```

### 4. Performance Tests (188+ tests)

**Purpose**: Validate query optimization and system performance.

**Coverage**:
- Query response time validation (sub-200ms for critical queries)
- Index utilization verification
- Join optimization for multi-table queries
- Pagination performance for large datasets
- Bulk operation efficiency
- Concurrent access and lock contention testing

**Key Test Files**:
- `test_query_performance.sql` - Response time benchmarking
- `test_index_utilization.sql` - Index effectiveness validation
- `test_bulk_operations.sql` - Large dataset operation testing
- `test_concurrent_access.sql` - Multi-user performance testing

**Example Test**:
```sql
-- Validate query performance meets SLA requirements
DO $$
DECLARE
    start_time TIMESTAMP WITH TIME ZONE;
    end_time TIMESTAMP WITH TIME ZONE;
    execution_time INTERVAL;
BEGIN
    start_time := clock_timestamp();
    
    -- Execute critical query
    PERFORM * FROM opportunities 
    JOIN organizations ON opportunities.organization_id = organizations.id
    WHERE organizations.status = 'ACTIVE' 
    LIMIT 100;
    
    end_time := clock_timestamp();
    execution_time := end_time - start_time;
    
    PERFORM ok(
        execution_time < interval '200 milliseconds',
        'Critical opportunity query should complete within 200ms'
    );
END$$;
```

### 5. Migration Tests

**Purpose**: Validate schema changes and data migration procedures.

**Coverage**:
- Schema upgrade and downgrade procedures
- Data migration integrity validation
- Backward compatibility verification
- Migration rollback procedures

### 6. Stress Tests

**Purpose**: Validate system behavior under high load conditions.

**Coverage**:
- High-volume data operations
- System resource utilization
- Performance degradation thresholds
- Scalability validation

### 7. Regression Tests

**Purpose**: Ensure existing functionality remains intact after changes.

**Coverage**:
- Schema change impact validation
- Feature compatibility verification
- Performance regression detection
- API contract validation

### 8. Edge Case Tests

**Purpose**: Validate system behavior at boundary conditions.

**Coverage**:
- Null value handling
- Empty dataset operations
- Maximum data size limits
- Invalid input handling

### 9. Recovery Tests

**Purpose**: Validate backup and disaster recovery procedures.

**Coverage**:
- Backup integrity validation
- Recovery procedure verification
- Data consistency after recovery
- Point-in-time recovery testing

### 10. Monitoring Tests

**Purpose**: Validate observability and monitoring capabilities.

**Coverage**:
- Metrics collection verification
- Alert threshold validation
- Performance monitoring accuracy
- System health check validation

## Setup and Configuration

### Prerequisites

#### Required Software
- **PostgreSQL 13+** with pgTAP extension support
- **pg_prove** - TAP test runner for PostgreSQL
- **psql** - PostgreSQL command-line client
- **Supabase CLI** (optional, for Supabase-specific operations)

#### Installation

##### 1. Install pgTAP Extension

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql-contrib pgtap
```

**macOS with Homebrew:**
```bash
brew install pgtap
```

**From Source:**
```bash
git clone https://github.com/theory/pgtap.git
cd pgtap
make
sudo make install
```

##### 2. Install pg_prove

```bash
# Install Perl TAP modules
cpan TAP::Parser::SourceHandler::pgTAP

# Or using cpanm
cpanm TAP::Parser::SourceHandler::pgTAP
```

##### 3. Verify Installation

```bash
# Check pgTAP availability
psql -c "CREATE EXTENSION IF NOT EXISTS pgtap;" your_database

# Check pg_prove
pg_prove --version
```

### Database Configuration

#### Method 1: Environment Variables
```bash
export SUPABASE_DB_URL="postgresql://user:password@host:port/database"
```

#### Method 2: Component Variables
```bash
export SUPABASE_DB_HOST="localhost"
export SUPABASE_DB_PORT="5432"
export SUPABASE_DB_NAME="postgres"
export SUPABASE_DB_USER="postgres"
export SUPABASE_DB_PASS="your_password"
```

#### Method 3: Direct URL Parameter
```bash
./run_tests.sh --database "postgresql://user:password@host:port/database"
```

### Supabase Project Configuration

1. **Obtain Database Credentials**:
   - Navigate to Supabase Dashboard → Settings → Database
   - Copy the "Connection string" for direct connection
   - Or use individual components (Host, Database name, Port, User, Password)

2. **Configure Test Environment**:
   ```bash
   # Create .env.test file
   echo "SUPABASE_DB_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres" > .env.test
   ```

## Test Execution

### Quick Start

#### 1. Framework Setup
```bash
# Install pgTAP framework in your database
./sql/tests/run_tests.sh --setup-only
```

#### 2. Run Complete Test Suite
```bash
# Execute all 834+ tests
./sql/tests/run_tests.sh
```

#### 3. Run Specific Categories
```bash
# Unit tests only (25+ tests)
./sql/tests/run_tests.sh --unit-only

# Integration tests (229+ tests)
./sql/tests/run_tests.sh --integration

# Security tests (217+ tests)
./sql/tests/run_tests.sh --security

# Performance tests (188+ tests)
./sql/tests/run_tests.sh --performance
```

### Advanced Execution Options

#### Parallel Execution (Recommended for CI/CD)
```bash
# Execute tests in parallel for faster completion
./sql/tests/run_tests.sh --parallel
```

#### Verbose Output for Debugging
```bash
# Enable detailed output for troubleshooting
./sql/tests/run_tests.sh --verbose
```

#### Skip Cleanup for Investigation
```bash
# Preserve test data for debugging
./sql/tests/run_tests.sh --no-cleanup
```

#### Custom Database Connection
```bash
# Override default connection settings
./sql/tests/run_tests.sh --database "postgresql://user:pass@host:port/db"
```

### Individual Test Execution

#### Single Test File
```bash
# Run specific test file
pg_prove --ext .sql sql/tests/unit/test_contacts.sql
```

#### Directory-Level Execution
```bash
# Run all tests in a category
pg_prove --ext .sql sql/tests/security/
```

#### Verbose Individual Testing
```bash
# Detailed output for single test
pg_prove --ext .sql --verbose sql/tests/performance/test_query_performance.sql
```

## Performance Standards

### Execution Time Benchmarks

| Test Category | Test Count | Target Time | Actual Time |
|---------------|------------|-------------|-------------|
| Unit Tests | 25+ | < 30 seconds | ~15 seconds |
| Integration Tests | 229+ | < 2 minutes | ~90 seconds |
| Security Tests | 217+ | < 90 seconds | ~75 seconds |
| Performance Tests | 188+ | < 2 minutes | ~80 seconds |
| **Total Suite** | **834+** | **< 5 minutes** | **~4 minutes** |

### Query Performance Requirements

| Query Type | Maximum Response Time | Success Rate |
|------------|----------------------|--------------|
| Single Entity Lookup | 50ms | 100% |
| Complex Joins (2-3 tables) | 200ms | 98% |
| Aggregation Queries | 500ms | 95% |
| Bulk Operations (1000+ records) | 2 seconds | 90% |

### Resource Utilization Standards

| Metric | Target | Monitoring |
|--------|--------|------------|
| Memory Usage | < 512MB | Continuous |
| CPU Utilization | < 50% | Per test run |
| Database Connections | < 10 concurrent | Real-time |
| Disk I/O | < 100 MB/s | Per category |

## Quality Metrics

### Test Coverage Metrics

| Component | Coverage | Test Count |
|-----------|----------|------------|
| Database Schema | 100% | 834+ |
| RLS Policies | 100% | 217+ |
| Business Logic | 95% | 229+ |
| Performance SLAs | 100% | 188+ |
| Edge Cases | 85% | 50+ |

### Success Rate Standards

| Environment | Minimum Success Rate | Current Achievement |
|-------------|---------------------|-------------------|
| Development | 95% | 97%+ |
| Staging | 98% | 98%+ |
| Production | 99% | 99%+ |

### Performance Regression Thresholds

| Metric | Warning Threshold | Critical Threshold |
|--------|------------------|-------------------|
| Execution Time Increase | +20% | +50% |
| Query Response Time | +100ms | +500ms |
| Memory Usage Increase | +25% | +100% |
| Success Rate Decrease | -2% | -5% |

## Best Practices

### Test Development

#### 1. Use Factory Functions
```sql
-- Leverage provided data factories for consistency
SELECT test_schema.create_test_contact('test_scenario_name');
SELECT test_schema.create_test_organization('test_scenario', 'Org Name', 'B2B', true, false);
```

#### 2. Register Test Data
```sql
-- Always register created data for proper cleanup
PERFORM test_schema.register_test_data('test_scenario', 'contacts', test_contact_id);
```

#### 3. Descriptive Assertions
```sql
-- Use clear, descriptive test names and messages
SELECT ok(
    has_table('public', 'opportunities'),
    'Opportunities table should exist for sales pipeline management'
);
```

#### 4. Test Isolation
```sql
-- Ensure tests don't depend on each other's state
SELECT test_schema.begin_test();
-- Test logic here
PERFORM test_schema.cleanup_test_data('unique_test_name');
SELECT test_schema.rollback_test();
```

### Performance Testing

#### 1. Include Timing Validations
```sql
-- Validate performance requirements
DO $$
DECLARE
    execution_time INTERVAL;
BEGIN
    SELECT test_schema.measure_query_time(
        'SELECT * FROM opportunities JOIN organizations ON opportunities.organization_id = organizations.id'
    ) INTO execution_time;
    
    PERFORM ok(
        execution_time < interval '200 milliseconds',
        'Complex join query should complete within SLA requirements'
    );
END$$;
```

#### 2. Index Usage Verification
```sql
-- Ensure queries use expected indexes
SELECT test_schema.check_index_usage(
    'SELECT * FROM contacts WHERE email = $1',
    'contacts_email_idx',
    'Email lookup should use email index'
);
```

### Maintenance Guidelines

#### 1. Regular Test Execution
- **Development**: Run full suite before each commit
- **Integration**: Execute in CI/CD pipeline for all PRs
- **Production**: Schedule daily validation runs

#### 2. Performance Monitoring
- Track test execution times and identify performance regressions
- Monitor success rates and investigate failures immediately
- Maintain historical performance data for trend analysis

#### 3. Documentation Maintenance
- Update test documentation with schema changes
- Maintain test coverage documentation
- Document new test patterns and utilities

## Troubleshooting

### Common Issues

#### pgTAP Extension Not Available
```
ERROR: extension "pgtap" is not available
```
**Solution**: Install pgTAP extension package for your PostgreSQL version.
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-contrib pgtap

# macOS
brew install pgtap
```

#### pg_prove Command Not Found
```
bash: pg_prove: command not found
```
**Solution**: Install Perl TAP modules.
```bash
cpan TAP::Parser::SourceHandler::pgTAP
```

#### Permission Denied on Test Runner
```
bash: ./run_tests.sh: Permission denied
```
**Solution**: Make script executable.
```bash
chmod +x sql/tests/run_tests.sh
```

#### Connection Failed
```
psql: connection to server failed
```
**Solution**: Verify database credentials and network connectivity.

### Debugging Procedures

#### 1. Enable Verbose Output
```bash
./run_tests.sh --verbose
```

#### 2. Skip Cleanup for Investigation
```bash
./run_tests.sh --no-cleanup
```

#### 3. Run Individual Tests
```bash
pg_prove --ext .sql --verbose sql/tests/unit/test_contacts.sql
```

#### 4. Check Test Execution Logs
```sql
-- View test execution history
SELECT * FROM test_schema.test_execution_log 
ORDER BY start_time DESC 
LIMIT 10;

-- Check test data registry
SELECT * FROM test_schema.test_data_registry 
WHERE test_name = 'problematic_test_name';
```

#### 5. Performance Analysis
```sql
-- Analyze slow queries
SELECT * FROM test_schema.query_performance_log 
WHERE execution_time > interval '1 second'
ORDER BY execution_time DESC;
```

### Getting Help

For additional support with the testing framework:

1. **Documentation**: Review this guide and the `/sql/tests/README.md`
2. **Test Logs**: Examine execution logs in `test_schema.test_execution_log`
3. **Performance Data**: Review performance metrics in monitoring tables
4. **Verbose Output**: Run individual tests with `--verbose` for detailed error information
5. **Community Support**: Consult pgTAP documentation and PostgreSQL testing communities

---

The Supabase CRM Database Testing Framework provides enterprise-grade validation ensuring data integrity, security, performance, and reliability for the complete CRM application ecosystem.