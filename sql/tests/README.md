# pgTAP Testing Framework for Supabase CRM Database

This directory contains a comprehensive pgTAP testing framework for the Supabase CRM database, providing database-level unit tests, integration tests, and performance validation.

## Overview

The pgTAP testing framework provides:

- **Database Unit Testing**: Comprehensive validation of table structures, constraints, triggers, and data integrity
- **Integration Testing**: Cross-table relationship validation and complex business logic testing  
- **Performance Testing**: Query optimization validation and performance benchmarking
- **Test Data Management**: Isolated test schemas with automatic cleanup and data factories
- **Automated Test Execution**: Shell-based test runner with multiple execution modes

## Directory Structure

```
sql/tests/
├── setup/                          # Framework installation and configuration
│   ├── 00_install_pgtap.sql       # pgTAP extension installation
│   ├── 01_test_schema_isolation.sql # Test schema and transaction isolation
│   └── 02_test_data_registry.sql   # Test data tracking and cleanup system
├── helpers/                        # Reusable test utilities
│   ├── test_helpers.sql            # Common testing functions and assertions
│   └── base_test_template.sql      # Standard test template for consistency
├── unit/                           # Database unit tests
│   ├── test_user_submissions.sql   # user_submissions table validation
│   ├── test_contacts.sql           # contacts table validation
│   └── test_organizations.sql      # organizations table validation
├── integration/                    # Cross-table integration tests
│   └── test_opportunities_relationships.sql # Complex relationship validation
├── performance/                    # Query performance and optimization tests
│   └── test_query_performance.sql  # Performance benchmarking and validation
├── run_tests.sh                   # Main test execution script
└── README.md                      # This documentation file
```

## Prerequisites

### Required Software

1. **PostgreSQL** with pgTAP extension support
2. **pg_prove** - TAP test runner for PostgreSQL
3. **psql** - PostgreSQL command-line client

### Installation

#### Installing pgTAP

**On Ubuntu/Debian:**
```bash
sudo apt-get install postgresql-contrib
sudo apt-get install pgtap
```

**On macOS with Homebrew:**
```bash
brew install pgtap
```

**From source:**
```bash
git clone https://github.com/theory/pgtap.git
cd pgtap
make
sudo make install
```

#### Installing pg_prove

```bash
# Install Perl TAP modules
cpan TAP::Parser::SourceHandler::pgTAP

# Or using cpanm
cpanm TAP::Parser::SourceHandler::pgTAP
```

#### Verifying Installation

```bash
# Check pgTAP availability
psql -c "CREATE EXTENSION IF NOT EXISTS pgtap;" your_database

# Check pg_prove
pg_prove --version
```

## Configuration

### Database Connection

Set up your database connection using one of these methods:

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

### Supabase Configuration

For Supabase projects, obtain your database credentials from:
1. Supabase Dashboard → Settings → Database
2. Use the "Connection string" for direct connection
3. Or individual components (Host, Database name, Port, User, Password)

## Usage

### Quick Start

1. **Install pgTAP framework in your database:**
```bash
./sql/tests/run_tests.sh --setup-only
```

2. **Run all tests:**
```bash
./sql/tests/run_tests.sh
```

3. **Run specific test categories:**
```bash
# Unit tests only
./sql/tests/run_tests.sh --unit-only

# Integration tests only  
./sql/tests/run_tests.sh --integration

# Performance tests only
./sql/tests/run_tests.sh --performance
```

### Advanced Usage

#### Verbose Output
```bash
./sql/tests/run_tests.sh --verbose
```

#### Parallel Execution (Experimental)
```bash
./sql/tests/run_tests.sh --parallel
```

#### Skip Cleanup (for debugging)
```bash
./sql/tests/run_tests.sh --no-cleanup
```

#### Custom Database Connection
```bash
./sql/tests/run_tests.sh --database "postgresql://user:pass@host:port/db"
```

### Running Individual Tests

You can also run individual test files using pg_prove directly:

```bash
# Single test file
pg_prove --ext .sql sql/tests/unit/test_contacts.sql

# All tests in a directory
pg_prove --ext .sql sql/tests/unit/

# With verbose output
pg_prove --ext .sql --verbose sql/tests/unit/test_contacts.sql
```

## Test Categories

### Unit Tests

Unit tests validate individual database components:

- **Table Structure**: Column definitions, data types, constraints
- **Primary Keys**: UUID generation and uniqueness
- **Foreign Keys**: Reference integrity and cascade behavior  
- **Check Constraints**: Data validation rules and business logic
- **Unique Constraints**: Email uniqueness, business key validation
- **Default Values**: Automatic timestamp generation, enum defaults
- **Triggers**: updated_at trigger functionality
- **Enum Types**: Valid values and constraint enforcement

**Example Unit Tests:**
- `test_user_submissions.sql`: Basic form submission table validation
- `test_contacts.sql`: Contact management with email validation
- `test_organizations.sql`: Complex organization structure with enums and JSONB

### Integration Tests

Integration tests validate cross-table relationships and complex business logic:

- **Foreign Key Relationships**: Multi-table data consistency
- **Cascade Operations**: Delete and update propagation
- **Complex Queries**: Multi-table joins and aggregations
- **Business Logic**: Principal/distributor relationships, opportunity workflows
- **JSONB Operations**: Complex JSON field queries and updates
- **Soft Deletes**: Logical deletion with relationship preservation

**Example Integration Tests:**
- `test_opportunities_relationships.sql`: Complete sales pipeline validation

### Performance Tests

Performance tests validate query optimization and system scalability:

- **Query Timing**: Response time validation for common operations
- **Index Usage**: Verification of proper index utilization
- **Join Performance**: Multi-table query optimization
- **Pagination**: Large dataset handling strategies
- **Bulk Operations**: Insert/update performance with large datasets
- **Concurrent Access**: Lock contention and isolation testing

**Example Performance Tests:**
- `test_query_performance.sql`: Comprehensive performance benchmarking

## Test Data Management

### Test Isolation

The framework uses a dedicated `test_schema` for complete isolation:

- **Transaction Isolation**: Each test runs in its own transaction
- **Savepoints**: Automatic rollback capabilities for clean state
- **Data Registry**: Tracking of all test data for proper cleanup
- **Schema Separation**: Test infrastructure separate from application data

### Data Factories

Pre-built factory functions for creating test data:

```sql
-- Create test entities
SELECT test_schema.create_test_contact('test_name');
SELECT test_schema.create_test_organization('test_name', 'Org Name', 'B2B', true, false);
SELECT test_schema.create_test_product('test_name', 'Product Name');
SELECT test_schema.create_test_opportunity('test_name');

-- Automatic cleanup registration
PERFORM test_schema.register_test_data('test_name', 'entity_type', entity_id);
```

### Cleanup Procedures

Automatic cleanup ensures no test data pollution:

- **Automatic Registration**: All factory-created data is tracked
- **Dependency-Aware Cleanup**: Deletion in proper order to respect foreign keys
- **Transaction Rollback**: Complete state restoration after each test
- **Manual Cleanup**: Available for custom test scenarios

## Writing New Tests

### Basic Test Structure

Use the provided template (`helpers/base_test_template.sql`):

```sql
-- Load helpers and set path
\i sql/tests/helpers/test_helpers.sql
SET search_path TO test_schema, public, pg_catalog;

-- Define test plan (update count)
SELECT plan(5);

-- Test setup
SELECT test_schema.begin_test();

-- Your tests here
SELECT ok(has_table('public', 'your_table'), 'Table should exist');

-- Cleanup
PERFORM test_schema.cleanup_test_data('your_test_name');
SELECT test_schema.rollback_test();

-- Finish
SELECT finish();
```

### Common Test Patterns

#### Table Structure Validation
```sql
SELECT ok(has_table('public', 'table_name'), 'Table exists');
SELECT ok(has_column('public', 'table_name', 'column_name'), 'Column exists');
SELECT col_type_is('public', 'table_name', 'column_name', 'expected_type', 'Type validation');
```

#### Constraint Testing
```sql
SELECT throws_ok(
    $$INSERT INTO table_name (column) VALUES ('invalid_value')$$,
    '23514',  -- Check constraint violation
    'Should reject invalid data'
);
```

#### Data Validation
```sql
DO $$
DECLARE
    test_id UUID;
BEGIN
    SELECT test_schema.create_test_entity('test_name') INTO test_id;
    
    PERFORM ok(
        (SELECT COUNT(*) FROM table_name WHERE id = test_id) = 1,
        'Entity should be created successfully'
    );
END$$;
```

### Helper Functions

The framework provides numerous helper functions:

- `test_schema.table_exists_with_comment()`: Validate table structure
- `test_schema.column_has_properties()`: Comprehensive column validation
- `test_schema.has_fk_constraint()`: Foreign key verification
- `test_schema.measure_query_time()`: Performance timing
- `test_schema.check_index_usage()`: Index utilization analysis

## Continuous Integration

### GitHub Actions Integration

Add to your `.github/workflows/database-tests.yml`:

```yaml
name: Database Tests

on: [push, pull_request]

jobs:
  database-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Install pgTAP
        run: |
          sudo apt-get update
          sudo apt-get install postgresql-contrib pgtap
          
      - name: Install pg_prove
        run: |
          sudo cpan TAP::Parser::SourceHandler::pgTAP
          
      - name: Run Database Tests
        env:
          SUPABASE_DB_URL: postgresql://postgres:postgres@localhost:5432/postgres
        run: |
          chmod +x sql/tests/run_tests.sh
          ./sql/tests/run_tests.sh
```

### NPM Integration

Add to your `package.json`:

```json
{
  "scripts": {
    "test:db": "cd sql/tests && ./run_tests.sh",
    "test:db:unit": "cd sql/tests && ./run_tests.sh --unit-only",
    "test:db:integration": "cd sql/tests && ./run_tests.sh --integration",
    "test:db:performance": "cd sql/tests && ./run_tests.sh --performance",
    "test:db:setup": "cd sql/tests && ./run_tests.sh --setup-only"
  }
}
```

## Troubleshooting

### Common Issues

#### pgTAP Extension Not Found
```
ERROR: extension "pgtap" is not available
```
**Solution**: Install pgTAP extension package for your PostgreSQL version.

#### pg_prove Command Not Found
```
bash: pg_prove: command not found
```
**Solution**: Install Perl TAP modules: `cpan TAP::Parser::SourceHandler::pgTAP`

#### Permission Denied on Test Runner
```
bash: ./run_tests.sh: Permission denied
```
**Solution**: Make script executable: `chmod +x sql/tests/run_tests.sh`

#### Connection Failed
```
psql: connection to server failed
```
**Solution**: Verify database credentials and network connectivity.

### Debugging Tests

#### Enable Verbose Output
```bash
./run_tests.sh --verbose
```

#### Skip Cleanup for Investigation
```bash
./run_tests.sh --no-cleanup
```

#### Run Individual Tests
```bash
pg_prove --ext .sql --verbose sql/tests/unit/test_contacts.sql
```

#### Check Test Data
```sql
-- View test registry
SELECT * FROM test_schema.test_data_registry;

-- View test execution log
SELECT * FROM test_schema.test_execution_log ORDER BY start_time DESC;
```

## Best Practices

### Test Development

1. **Use Factory Functions**: Leverage provided data factories for consistent test data
2. **Register Test Data**: Always register created data for proper cleanup
3. **Descriptive Names**: Use clear, descriptive test names and assertions
4. **Isolation**: Ensure tests don't depend on each other's state
5. **Performance Awareness**: Include timing validations for critical queries

### Maintenance

1. **Regular Execution**: Run tests regularly during development
2. **CI Integration**: Include database tests in continuous integration
3. **Performance Monitoring**: Track performance test results over time
4. **Documentation Updates**: Keep test documentation current with schema changes

### Security

1. **Test Credentials**: Use dedicated test database credentials
2. **Data Sensitivity**: Avoid real sensitive data in test datasets
3. **Access Control**: Implement proper database access controls for test environments

## Contributing

When adding new database features:

1. **Create Unit Tests**: Validate table structure and constraints
2. **Add Integration Tests**: Test relationships with existing tables
3. **Include Performance Tests**: Validate query performance for new features
4. **Update Documentation**: Maintain test documentation and examples
5. **Run Full Suite**: Ensure all existing tests continue to pass

## Support

For issues with the testing framework:

1. Check the troubleshooting section above
2. Review test execution logs in `test_schema.test_execution_log`
3. Examine test data registry for cleanup issues
4. Run individual tests with verbose output for detailed error information

The pgTAP testing framework provides comprehensive database validation ensuring data integrity, performance, and reliability for the Supabase CRM application.