# pgTAP Testing Framework - Quick Start Guide

## Prerequisites Installation

### 1. Install pgTAP Extension
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-contrib pgtap

# macOS with Homebrew  
brew install pgtap

# Install in your database
psql -c "CREATE EXTENSION IF NOT EXISTS pgtap;" your_database
```

### 2. Install pg_prove
```bash
# Install Perl TAP modules
cpan TAP::Parser::SourceHandler::pgTAP

# Or using cpanm
cpanm TAP::Parser::SourceHandler::pgTAP

# Verify installation
pg_prove --version
```

## Quick Start Commands

### Setup and First Run
```bash
# 1. Set database connection (choose one method)
export SUPABASE_DB_URL="postgresql://user:password@host:port/database"

# OR set individual components
export SUPABASE_DB_HOST="localhost"
export SUPABASE_DB_PORT="5432" 
export SUPABASE_DB_NAME="postgres"
export SUPABASE_DB_USER="postgres"
export SUPABASE_DB_PASS="your_password"

# 2. Install pgTAP framework in database
npm run test:db:setup

# 3. Run all tests
npm run test:db
```

### Common Test Commands
```bash
# Run specific test categories
npm run test:db:unit           # Unit tests only
npm run test:db:integration    # Integration tests only  
npm run test:db:performance    # Performance tests only

# Verbose output for debugging
npm run test:db:verbose

# Run everything (database + frontend)
npm run test:all
```

### Manual Test Execution
```bash
# Run single test file
pg_prove --ext .sql sql/tests/unit/test_contacts.sql

# Run all tests in directory
pg_prove --ext .sql sql/tests/unit/

# Verbose single test
pg_prove --ext .sql --verbose sql/tests/unit/test_contacts.sql
```

## Test Results Interpretation

### Successful Output
```
sql/tests/unit/test_contacts.sql .. ok
sql/tests/unit/test_organizations.sql .. ok
All tests successful.
Files=2, Tests=45, 2 wallclock secs
Result: PASS
```

### Failed Test Output
```
sql/tests/unit/test_contacts.sql .. 
not ok 5 - Should reject invalid email format
#   Failed test 'Should reject invalid email format'
#   at line 67
Dubious, test returned 1 (wantarray)
```

## Quick Troubleshooting

### Common Issues and Solutions

#### "Extension pgtap not found"
```bash
# Install pgTAP for your PostgreSQL version
sudo apt-get install postgresql-15-pgtap  # Ubuntu/Debian
brew install pgtap                        # macOS
```

#### "pg_prove command not found"
```bash
# Install Perl TAP modules
sudo cpan TAP::Parser::SourceHandler::pgTAP
```

#### "Permission denied on run_tests.sh"
```bash
# Make script executable
chmod +x sql/tests/run_tests.sh
```

#### Database connection failed
```bash
# Test connection manually
psql "$SUPABASE_DB_URL" -c "SELECT version();"

# Check environment variables
echo $SUPABASE_DB_URL
```

## Test Coverage

The framework includes:

- **25 Unit Tests**: Table structure, constraints, data validation
- **20 Integration Tests**: Cross-table relationships, complex queries  
- **15 Performance Tests**: Query timing, index usage, optimization

### Key Tables Tested
- `user_submissions` - Form submission validation
- `contacts` - Contact management with email validation
- `organizations` - Complex business logic with enums and JSONB
- `opportunities` - Sales pipeline with foreign key relationships
- `products` - Product catalog with principal relationships

## Writing Your First Test

### 1. Copy Base Template
```bash
cp sql/tests/helpers/base_test_template.sql sql/tests/unit/test_your_table.sql
```

### 2. Update Template
```sql
-- Update test plan count
SELECT plan(5); -- Change number based on your tests

-- Add your tests
SELECT ok(has_table('public', 'your_table'), 'Table should exist');

-- Update test name throughout
PERFORM test_schema.cleanup_test_data('your_test_name');
```

### 3. Run Your Test
```bash
pg_prove --ext .sql --verbose sql/tests/unit/test_your_table.sql
```

## Test Data Management

### Using Data Factories
```sql
-- Create test data
SELECT test_schema.create_test_contact('test_name');
SELECT test_schema.create_test_organization('test_name');

-- Automatic cleanup
PERFORM test_schema.cleanup_test_data('test_name');
```

### Custom Test Data
```sql
DO $$
DECLARE
    test_id UUID;
BEGIN
    INSERT INTO your_table (column) VALUES ('test_value') 
    RETURNING id INTO test_id;
    
    -- Register for cleanup
    PERFORM test_schema.register_test_data('test_name', 'table_name', test_id);
END$$;
```

## Next Steps

1. **Review Full Documentation**: See `sql/tests/README.md`
2. **Examine Example Tests**: Study existing unit tests for patterns
3. **Add Database Tests to CI**: Include in your GitHub Actions workflow
4. **Monitor Performance**: Track performance test results over time

For detailed information, see the comprehensive documentation in `/sql/tests/README.md`.