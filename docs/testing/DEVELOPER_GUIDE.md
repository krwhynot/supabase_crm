# Developer Testing Guide for Database Testing Framework

## Table of Contents

1. [Quick Start](#quick-start)
2. [Local Development Setup](#local-development-setup)
3. [Writing Tests](#writing-tests)
4. [Test Categories and Patterns](#test-categories-and-patterns)
5. [Debugging and Troubleshooting](#debugging-and-troubleshooting)
6. [Performance Testing](#performance-testing)
7. [Contributing Guidelines](#contributing-guidelines)
8. [Code Examples](#code-examples)

## Quick Start

### Prerequisites Checklist

- [ ] PostgreSQL 13+ installed and running
- [ ] pgTAP extension available
- [ ] pg_prove installed (Perl TAP runner)
- [ ] Database connection configured
- [ ] Supabase CLI (optional but recommended)

### 5-Minute Setup

```bash
# 1. Clone and navigate to project
git clone <repository-url>
cd <project-directory>

# 2. Install pgTAP dependencies
# Ubuntu/Debian
sudo apt-get install postgresql-contrib pgtap
sudo cpan -T TAP::Parser::SourceHandler::pgTAP

# macOS
brew install pgtap
cpan TAP::Parser::SourceHandler::pgTAP

# 3. Configure database connection
export SUPABASE_DB_URL="postgresql://user:password@host:port/database"

# 4. Setup testing framework
./sql/tests/run_tests.sh --setup-only

# 5. Run your first test
./sql/tests/run_tests.sh --unit-only
```

### Verify Installation

```bash
# Check pgTAP installation
psql -d your_database -c "CREATE EXTENSION IF NOT EXISTS pgtap;"

# Verify pg_prove
pg_prove --version

# Test framework health check
./sql/tests/run_tests.sh --health-check
```

## Local Development Setup

### Environment Configuration

#### Method 1: Environment Variables (Recommended)
```bash
# Create .env.local file
cat > .env.local << EOF
SUPABASE_DB_URL="postgresql://postgres:password@localhost:5432/test_db"
SUPABASE_PROJECT_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
TEST_USER_EMAIL="test@example.com"
TEST_ENVIRONMENT="local"
EOF

# Load environment
source .env.local
```

#### Method 2: Supabase Local Development
```bash
# Initialize Supabase locally
npx supabase init
npx supabase start

# Get local connection details
npx supabase status

# Export connection string
export SUPABASE_DB_URL=$(npx supabase status --format json | jq -r '.DB_URL')
```

### IDE Configuration

#### VS Code Setup
Create `.vscode/settings.json`:
```json
{
  "sqltools.connections": [
    {
      "name": "Supabase Local",
      "driver": "PostgreSQL",
      "previewLimit": 50,
      "server": "localhost",
      "port": 5432,
      "database": "postgres",
      "username": "postgres",
      "password": "postgres"
    }
  ],
  "files.associations": {
    "*.sql": "sql"
  },
  "sql.format.keywordCase": "upper"
}
```

#### Database GUI Tools
Recommended tools for database development:
- **pgAdmin** - Web-based PostgreSQL administration
- **DBeaver** - Universal database tool
- **TablePlus** - Native database client
- **VS Code SQLTools** - SQL extension for VS Code

### Test Database Setup

```sql
-- Create dedicated test database
CREATE DATABASE test_supabase_crm;

-- Connect to test database
\c test_supabase_crm;

-- Install pgTAP extension
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Apply database schema
\i sql/01_initial_schema.sql
\i sql/02_rls_policies.sql
-- ... (continue with all schema files)

-- Initialize test framework
\i sql/tests/setup/00_install_pgtap.sql
\i sql/tests/setup/01_test_schema_isolation.sql
\i sql/tests/setup/02_test_data_registry.sql
\i sql/tests/setup/03_test_monitoring.sql
```

## Writing Tests

### Basic Test Structure

Every test should follow this pattern:

```sql
-- Load testing framework
\i sql/tests/helpers/test_helpers.sql
SET search_path TO test_schema, public, pg_catalog;

-- Define test plan (number of assertions)
SELECT plan(10);

-- Test setup
SELECT test_schema.begin_test();

-- Test name for cleanup tracking
DO $$ 
DECLARE 
    test_name TEXT := 'my_feature_test';
BEGIN
    -- Your test logic here
    
    -- Test 1: Table existence
    PERFORM ok(
        has_table('public', 'my_table'),
        'My table should exist'
    );
    
    -- Test 2: Column properties
    PERFORM col_type_is(
        'public', 'my_table', 'id', 'uuid',
        'ID column should be UUID type'
    );
    
    -- Test 3: Data validation
    DECLARE
        test_id UUID;
    BEGIN
        SELECT test_schema.create_test_contact(test_name) INTO test_id;
        
        PERFORM ok(
            (SELECT COUNT(*) FROM contacts WHERE id = test_id) = 1,
            'Contact should be created successfully'
        );
    END;
    
    -- Cleanup test data
    PERFORM test_schema.cleanup_test_data(test_name);
END$$;

-- Test teardown
SELECT test_schema.rollback_test();

-- Finish test plan
SELECT finish();
```

### Test Naming Conventions

```sql
-- File naming: test_[entity]_[feature].sql
-- test_contacts_email_validation.sql
-- test_opportunities_stage_transitions.sql
-- test_organizations_hierarchy.sql

-- Test function naming: test_[entity]_[action]_[condition]
SELECT test_contact_creation_with_valid_email();
SELECT test_opportunity_stage_transition_from_new_to_qualified();
SELECT test_organization_soft_delete_preserves_relationships();

-- Assertion descriptions: Should be clear and actionable
PERFORM ok(condition, 'User should be able to create contact with valid email');
PERFORM is(actual, expected, 'Contact status should change to ACTIVE after verification');
```

### Data Factory Usage

The framework provides factory functions for consistent test data:

```sql
-- Create test entities with automatic cleanup registration
DO $$
DECLARE
    test_name TEXT := 'relationship_test';
    org_id UUID;
    contact_id UUID;
    opportunity_id UUID;
    product_id UUID;
BEGIN
    -- Create test organization
    SELECT test_schema.create_test_organization(
        test_name,
        'Test Organization',
        'B2B',
        true,  -- is_active
        false  -- is_distributor
    ) INTO org_id;
    
    -- Create test contact linked to organization
    SELECT test_schema.create_test_contact(
        test_name,
        'Test Contact',
        'test@example.com',
        org_id
    ) INTO contact_id;
    
    -- Create test product
    SELECT test_schema.create_test_product(
        test_name,
        'Test Product',
        'Software',
        29.99
    ) INTO product_id;
    
    -- Create test opportunity
    SELECT test_schema.create_test_opportunity(
        test_name,
        'Test Opportunity',
        'NEW_LEAD',
        org_id,
        contact_id,
        product_id
    ) INTO opportunity_id;
    
    -- Your test assertions here
    PERFORM is(
        (SELECT organization_id FROM contacts WHERE id = contact_id),
        org_id,
        'Contact should be linked to organization'
    );
    
    -- Automatic cleanup will be handled by test framework
END$$;
```

### Available Factory Functions

```sql
-- Contacts
SELECT test_schema.create_test_contact(test_name, name, email, organization_id);

-- Organizations  
SELECT test_schema.create_test_organization(test_name, name, type, is_active, is_distributor);

-- Opportunities
SELECT test_schema.create_test_opportunity(test_name, name, stage, org_id, contact_id, product_id);

-- Products
SELECT test_schema.create_test_product(test_name, name, category, price);

-- Interactions
SELECT test_schema.create_test_interaction(test_name, type, org_id, contact_id);

-- Principal Activity
SELECT test_schema.create_test_principal_activity(test_name, principal_id, activity_type);

-- Bulk data creation for performance testing
SELECT test_schema.create_bulk_test_data(test_name, entity_type, count);
```

## Test Categories and Patterns

### Unit Tests - Table Structure Validation

```sql
-- Test table structure and constraints
SELECT plan(8);

-- Table existence
SELECT ok(has_table('public', 'contacts'), 'Contacts table exists');

-- Primary key
SELECT ok(has_pk('public', 'contacts'), 'Contacts table has primary key');

-- Column existence and types
SELECT col_type_is('public', 'contacts', 'id', 'uuid', 'ID is UUID');
SELECT col_type_is('public', 'contacts', 'email', 'text', 'Email is text');
SELECT col_type_is('public', 'contacts', 'created_at', 'timestamp with time zone', 'Created_at is timestamptz');

-- Constraints
SELECT col_not_null('public', 'contacts', 'email', 'Email cannot be null');
SELECT col_is_unique('public', 'contacts', 'email', 'Email must be unique');

-- Default values
SELECT col_default_is('public', 'contacts', 'created_at', 'now()', 'Created_at defaults to now()');

SELECT finish();
```

### Integration Tests - Cross-Table Relationships

```sql
-- Test complex business logic across multiple tables
SELECT plan(5);

DO $$
DECLARE
    test_name TEXT := 'opportunity_workflow_test';
    org_id UUID;
    contact_id UUID;  
    product_id UUID;
    opportunity_id UUID;
    interaction_id UUID;
BEGIN
    -- Setup test data
    SELECT test_schema.create_test_organization(test_name) INTO org_id;
    SELECT test_schema.create_test_contact(test_name, org_id) INTO contact_id;
    SELECT test_schema.create_test_product(test_name) INTO product_id;
    
    -- Test opportunity creation
    SELECT test_schema.create_test_opportunity(
        test_name, 'Test Deal', 'NEW_LEAD', org_id, contact_id, product_id
    ) INTO opportunity_id;
    
    PERFORM ok(
        (SELECT COUNT(*) FROM opportunities WHERE id = opportunity_id) = 1,
        'Opportunity should be created successfully'
    );
    
    -- Test stage progression
    UPDATE opportunities 
    SET stage = 'INITIAL_OUTREACH', probability_percent = 25
    WHERE id = opportunity_id;
    
    PERFORM is(
        (SELECT stage FROM opportunities WHERE id = opportunity_id),
        'INITIAL_OUTREACH'::opportunity_stage,
        'Opportunity stage should progress to INITIAL_OUTREACH'
    );
    
    -- Test interaction logging
    SELECT test_schema.create_test_interaction(
        test_name, 'EMAIL', org_id, contact_id, opportunity_id
    ) INTO interaction_id;
    
    PERFORM ok(
        (SELECT opportunity_id FROM interactions WHERE id = interaction_id) = opportunity_id,
        'Interaction should be linked to opportunity'
    );
    
    -- Test cascade behavior
    DELETE FROM opportunities WHERE id = opportunity_id;
    
    PERFORM is(
        (SELECT COUNT(*) FROM interactions WHERE opportunity_id = opportunity_id),
        0::bigint,
        'Related interactions should be cleaned up when opportunity is deleted'
    );
    
    -- Test principal activity calculation
    PERFORM ok(
        (SELECT test_schema.calculate_principal_activity_score(contact_id) > 0),
        'Principal activity score should be calculated based on interactions'
    );
END$$;

SELECT finish();
```

### Security Tests - RLS Policy Validation

```sql
-- Test Row Level Security policies
SELECT plan(6);

DO $$
DECLARE
    test_name TEXT := 'rls_contact_test';
    org1_id UUID;
    org2_id UUID; 
    contact1_id UUID;
    contact2_id UUID;
    user1_id UUID;
    user2_id UUID;
BEGIN
    -- Create test data for different organizations
    SELECT test_schema.create_test_organization(test_name || '_org1') INTO org1_id;
    SELECT test_schema.create_test_organization(test_name || '_org2') INTO org2_id;
    
    SELECT test_schema.create_test_contact(test_name || '_contact1', org1_id) INTO contact1_id;
    SELECT test_schema.create_test_contact(test_name || '_contact2', org2_id) INTO contact2_id;
    
    -- Create test users
    INSERT INTO auth.users (id, email) VALUES 
    (gen_random_uuid(), 'user1@example.com') RETURNING id INTO user1_id;
    INSERT INTO auth.users (id, email) VALUES
    (gen_random_uuid(), 'user2@example.com') RETURNING id INTO user2_id;
    
    -- Assign users to organizations
    INSERT INTO user_organizations (user_id, organization_id, role) VALUES
    (user1_id, org1_id, 'ADMIN'),
    (user2_id, org2_id, 'ADMIN');
    
    -- Test RLS policy enforcement
    
    -- Set current user context
    PERFORM set_config('app.current_user_id', user1_id::TEXT, true);
    
    -- User 1 should see contacts from org 1
    PERFORM ok(
        (SELECT COUNT(*) FROM contacts WHERE id = contact1_id) = 1,
        'User should see contacts from their organization'
    );
    
    -- User 1 should NOT see contacts from org 2  
    PERFORM is(
        (SELECT COUNT(*) FROM contacts WHERE id = contact2_id),
        0::bigint,
        'User should not see contacts from other organizations'
    );
    
    -- Switch to user 2
    PERFORM set_config('app.current_user_id', user2_id::TEXT, true);
    
    -- User 2 should see contacts from org 2
    PERFORM ok(
        (SELECT COUNT(*) FROM contacts WHERE id = contact2_id) = 1,
        'Second user should see contacts from their organization'
    );
    
    -- User 2 should NOT see contacts from org 1
    PERFORM is(
        (SELECT COUNT(*) FROM contacts WHERE id = contact1_id),
        0::bigint, 
        'Second user should not see contacts from other organizations'
    );
    
    -- Test insert policy
    PERFORM lives_ok(
        $$INSERT INTO contacts (name, email, organization_id) 
          VALUES ('New Contact', 'new@example.com', $$ || quote_literal(org2_id) || $$)$$,
        'User should be able to insert contacts in their organization'
    );
    
    -- Test blocked insert
    PERFORM throws_ok(
        $$INSERT INTO contacts (name, email, organization_id) 
          VALUES ('Blocked Contact', 'blocked@example.com', $$ || quote_literal(org1_id) || $$)$$,
        'Policy violation detected',
        'User should not be able to insert contacts in other organizations'
    );
END$$;

SELECT finish();
```

### Performance Tests - Query Optimization

```sql
-- Test query performance and optimization
SELECT plan(4);

DO $$
DECLARE
    test_name TEXT := 'performance_test';
    start_time TIMESTAMP WITH TIME ZONE;
    end_time TIMESTAMP WITH TIME ZONE;
    execution_time INTERVAL;
    bulk_count INTEGER := 10000;
BEGIN
    -- Create bulk test data
    PERFORM test_schema.create_bulk_test_data(test_name, 'contacts', bulk_count);
    PERFORM test_schema.create_bulk_test_data(test_name, 'organizations', bulk_count / 10);
    PERFORM test_schema.create_bulk_test_data(test_name, 'opportunities', bulk_count * 2);
    
    -- Test 1: Single contact lookup by email (should use index)
    start_time := clock_timestamp();
    PERFORM * FROM contacts WHERE email = 'test1@example.com';
    end_time := clock_timestamp();
    execution_time := end_time - start_time;
    
    PERFORM ok(
        execution_time < interval '50 milliseconds',
        'Single contact lookup should complete within 50ms'
    );
    
    -- Test 2: Complex join query
    start_time := clock_timestamp();
    PERFORM COUNT(*)
    FROM opportunities o
    JOIN contacts c ON o.principal_id = c.id
    JOIN organizations org ON c.organization_id = org.id
    WHERE org.type = 'B2B' AND o.stage = 'QUALIFIED';
    end_time := clock_timestamp();
    execution_time := end_time - start_time;
    
    PERFORM ok(
        execution_time < interval '200 milliseconds',
        'Complex join query should complete within 200ms'
    );
    
    -- Test 3: Aggregation query
    start_time := clock_timestamp();
    PERFORM stage, COUNT(*), AVG(probability_percent)
    FROM opportunities
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY stage;
    end_time := clock_timestamp();
    execution_time := end_time - start_time;
    
    PERFORM ok(
        execution_time < interval '500 milliseconds',
        'Aggregation query should complete within 500ms'
    );
    
    -- Test 4: Bulk operation
    start_time := clock_timestamp();
    UPDATE opportunities SET updated_at = NOW() WHERE stage = 'NEW_LEAD';
    end_time := clock_timestamp();
    execution_time := end_time - start_time;
    
    PERFORM ok(
        execution_time < interval '2 seconds',
        'Bulk update should complete within 2 seconds'
    );
    
    -- Verify index usage
    PERFORM test_schema.check_index_usage(
        'SELECT * FROM contacts WHERE email = $1',
        'contacts_email_idx',
        'Email lookup should use email index'
    );
END$$;

SELECT finish();
```

## Debugging and Troubleshooting

### Common Development Issues

#### 1. pgTAP Extension Issues
```sql
-- Check if pgTAP is installed
SELECT * FROM pg_extension WHERE extname = 'pgtap';

-- Install pgTAP if missing
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Verify pgTAP functions are available
SELECT prokind FROM pg_proc WHERE proname = 'plan';
```

#### 2. Test Data Cleanup Issues
```sql
-- Check test data registry
SELECT * FROM test_schema.test_data_registry 
WHERE test_name = 'your_test_name'
ORDER BY created_at DESC;

-- Manual cleanup if needed
SELECT test_schema.cleanup_test_data('your_test_name');

-- Check for orphaned test data
SELECT * FROM test_schema.find_orphaned_test_data();
```

#### 3. Performance Issues
```sql
-- Check test execution times
SELECT * FROM test_schema.test_execution_log 
WHERE execution_time > interval '1 minute'
ORDER BY execution_time DESC;

-- Analyze slow queries
SELECT * FROM test_schema.query_performance_log
WHERE execution_time > interval '5 seconds'
ORDER BY execution_time DESC;
```

### Debug Mode Testing

```bash
# Run tests with debug output
./sql/tests/run_tests.sh --verbose --no-cleanup

# Run single test with maximum verbosity
pg_prove --ext .sql --verbose --timer sql/tests/unit/test_contacts.sql

# Enable SQL query logging
export PGOPTIONS='-c log_statement=all'
./sql/tests/run_tests.sh --unit-only
```

### Test Development Workflow

#### 1. Test-Driven Development (TDD)
```bash
# 1. Write failing test first
cat > sql/tests/unit/test_new_feature.sql << EOF
SELECT plan(1);
SELECT ok(false, 'Feature not implemented yet');
SELECT finish();
EOF

# 2. Run test to confirm it fails
pg_prove --ext .sql sql/tests/unit/test_new_feature.sql

# 3. Implement feature in schema
# ... implement database changes ...

# 4. Update test to validate implementation
# 5. Run test to confirm it passes
```

#### 2. Interactive Testing
```bash
# Start interactive psql session with test framework loaded
psql $SUPABASE_DB_URL

-- Load test helpers
\i sql/tests/helpers/test_helpers.sql
SET search_path TO test_schema, public, pg_catalog;

-- Run individual test assertions interactively
SELECT test_schema.begin_test();
SELECT ok(has_table('public', 'contacts'), 'Test table existence');
SELECT test_schema.rollback_test();
```

## Performance Testing

### Setting Performance Expectations

```sql
-- Define performance benchmarks for your features
DO $$
DECLARE
    benchmark_config JSONB := '{
        "single_entity_lookup": "50ms",
        "complex_joins": "200ms", 
        "aggregations": "500ms",
        "bulk_operations": "2s"
    }';
BEGIN
    -- Store benchmarks for reference
    INSERT INTO test_schema.performance_benchmarks (test_category, benchmarks)
    VALUES ('contacts', benchmark_config)
    ON CONFLICT (test_category) DO UPDATE SET 
        benchmarks = EXCLUDED.benchmarks,
        updated_at = NOW();
END$$;
```

### Performance Test Patterns

```sql
-- Pattern 1: Query timing validation
DO $$
DECLARE
    execution_time INTERVAL;
BEGIN
    SELECT test_schema.measure_query_time($query$
        SELECT c.*, o.name as org_name 
        FROM contacts c 
        JOIN organizations o ON c.organization_id = o.id
        WHERE c.email = 'test@example.com'
    $query$) INTO execution_time;
    
    PERFORM ok(
        execution_time < interval '100 milliseconds',
        'Contact lookup with organization join should be fast'
    );
END$$;

-- Pattern 2: Index utilization verification  
SELECT test_schema.check_index_usage(
    'SELECT * FROM contacts WHERE email = $1',
    'contacts_email_idx',
    'Email lookup must use email index'
);

-- Pattern 3: Bulk operation performance
DO $$
DECLARE
    bulk_count INTEGER := 5000;
    start_time TIMESTAMP;
    execution_time INTERVAL;
BEGIN
    start_time := clock_timestamp();
    
    -- Bulk insert operation
    INSERT INTO contacts (name, email, organization_id)
    SELECT 
        'Bulk Contact ' || i,
        'bulk' || i || '@example.com',
        (SELECT id FROM organizations LIMIT 1)
    FROM generate_series(1, bulk_count) i;
    
    execution_time := clock_timestamp() - start_time;
    
    PERFORM ok(
        execution_time < interval '5 seconds',
        'Bulk insert of ' || bulk_count || ' contacts should complete quickly'
    );
    
    -- Cleanup
    DELETE FROM contacts WHERE email LIKE 'bulk%@example.com';
END$$;
```

## Contributing Guidelines

### Code Standards

#### 1. SQL Style Guide
```sql
-- Good: Clear, readable SQL with proper formatting
SELECT 
    c.id,
    c.name,
    c.email,
    o.name AS organization_name
FROM contacts c
JOIN organizations o ON c.organization_id = o.id
WHERE c.created_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY c.created_at DESC;

-- Avoid: Cramped, hard-to-read SQL
SELECT c.id,c.name,c.email,o.name FROM contacts c JOIN organizations o ON c.organization_id=o.id WHERE c.created_at>=CURRENT_DATE-INTERVAL '30 days';
```

#### 2. Test Documentation
```sql
-- Every test file should start with a comment describing its purpose
/*
Test File: test_contacts_email_validation.sql
Purpose: Validate email constraint enforcement and uniqueness requirements
Coverage: 
  - Email format validation
  - Unique email constraint
  - Case insensitive email handling
  - Email normalization
Author: Your Name
Created: 2024-01-15
Last Modified: 2024-01-20
*/
```

#### 3. Assertion Messages
```sql
-- Good: Clear, actionable assertion messages
PERFORM ok(
    has_table('public', 'contacts'),
    'Contacts table must exist for customer management functionality'
);

PERFORM is(
    (SELECT COUNT(*) FROM contacts WHERE email = 'duplicate@example.com'),
    1::bigint,
    'Database should prevent duplicate email addresses'
);

-- Avoid: Unclear or generic messages  
PERFORM ok(has_table('public', 'contacts'), 'table exists');
PERFORM is(result, expected, 'test passed');
```

### Pull Request Guidelines

#### 1. Before Submitting
```bash
# Run full test suite
./sql/tests/run_tests.sh

# Check test coverage
./sql/tests/scripts/coverage_report.sh

# Validate performance
./sql/tests/run_tests.sh --performance

# Format SQL files
./scripts/format_sql.sh sql/tests/
```

#### 2. PR Description Template
```markdown
## Description
Brief description of the changes and why they were made.

## Test Coverage
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated  
- [ ] Security tests added/updated (if applicable)
- [ ] Performance tests added/updated (if applicable)

## Performance Impact
- [ ] No performance degradation detected
- [ ] Performance improvements documented
- [ ] New performance baselines established (if applicable)

## Testing Checklist
- [ ] All existing tests pass
- [ ] New tests follow established patterns
- [ ] Test data cleanup implemented
- [ ] Documentation updated

## Database Changes
- [ ] Schema migrations included
- [ ] Rollback procedures documented
- [ ] RLS policies updated (if applicable)
- [ ] Indexes optimized
```

### Review Guidelines

#### 1. Code Review Checklist
- [ ] Test logic is correct and comprehensive
- [ ] Assertion messages are clear and actionable
- [ ] Test data cleanup is implemented
- [ ] Performance implications considered
- [ ] Security aspects validated
- [ ] Documentation is complete

#### 2. Performance Review
```sql
-- Reviewers should verify performance tests include:
-- 1. Appropriate timing assertions
SELECT ok(
    execution_time < interval '200 milliseconds',
    'Query should meet performance SLA'
);

-- 2. Index usage validation
SELECT test_schema.check_index_usage(query, expected_index, message);

-- 3. Resource utilization checks
SELECT test_schema.check_memory_usage('test_scenario', max_memory_mb);
```

## Code Examples

### Complete Test Example: Contact Management

```sql
/*
Test File: test_contacts_comprehensive.sql
Purpose: Comprehensive testing of contact management functionality
*/

\i sql/tests/helpers/test_helpers.sql
SET search_path TO test_schema, public, pg_catalog;

SELECT plan(15);

-- Start test session
SELECT test_schema.begin_test();

DO $$
DECLARE
    test_name TEXT := 'contacts_comprehensive_test';
    org_id UUID;
    contact_id UUID;
    duplicate_contact_id UUID;
BEGIN
    -- ========================================
    -- SETUP: Create test organization
    -- ========================================
    SELECT test_schema.create_test_organization(
        test_name,
        'Test Organization',
        'B2B',
        true,
        false
    ) INTO org_id;
    
    -- ========================================
    -- TEST CATEGORY: Table Structure
    -- ========================================
    
    -- Test 1: Table existence
    PERFORM ok(
        has_table('public', 'contacts'),
        'Contacts table should exist for customer management'
    );
    
    -- Test 2: Primary key constraint  
    PERFORM ok(
        has_pk('public', 'contacts'),
        'Contacts table should have primary key constraint'
    );
    
    -- Test 3: Required columns exist
    PERFORM ok(
        has_column('public', 'contacts', 'email') AND
        has_column('public', 'contacts', 'name') AND
        has_column('public', 'contacts', 'organization_id'),
        'Contacts table should have all required columns'
    );
    
    -- ========================================
    -- TEST CATEGORY: Data Validation
    -- ========================================
    
    -- Test 4: Successful contact creation
    SELECT test_schema.create_test_contact(
        test_name,
        'John Doe',
        'john.doe@example.com',
        org_id
    ) INTO contact_id;
    
    PERFORM ok(
        (SELECT COUNT(*) FROM contacts WHERE id = contact_id) = 1,
        'Valid contact should be created successfully'
    );
    
    -- Test 5: Email format validation  
    PERFORM throws_ok(
        $$INSERT INTO contacts (name, email, organization_id) 
          VALUES ('Invalid Email', 'not-an-email', '$$ || org_id || $$')$$,
        '23514',
        'Should reject invalid email format'
    );
    
    -- Test 6: Email uniqueness constraint
    PERFORM throws_ok(
        $$INSERT INTO contacts (name, email, organization_id)
          VALUES ('Duplicate Email', 'john.doe@example.com', '$$ || org_id || $$')$$,
        '23505',
        'Should prevent duplicate email addresses'
    );
    
    -- Test 7: Required field validation
    PERFORM throws_ok(
        $$INSERT INTO contacts (email, organization_id)
          VALUES ('no-name@example.com', '$$ || org_id || $$')$$,
        '23502',
        'Should require contact name'
    );
    
    -- ========================================
    -- TEST CATEGORY: Relationships  
    -- ========================================
    
    -- Test 8: Organization relationship
    PERFORM is(
        (SELECT organization_id FROM contacts WHERE id = contact_id),
        org_id,
        'Contact should be properly linked to organization'
    );
    
    -- Test 9: Foreign key constraint
    PERFORM throws_ok(
        $$INSERT INTO contacts (name, email, organization_id)
          VALUES ('Invalid Org', 'invalid@example.com', '$$ || gen_random_uuid() || $$')$$,
        '23503',
        'Should enforce organization foreign key constraint'
    );
    
    -- ========================================
    -- TEST CATEGORY: Business Logic
    -- ========================================
    
    -- Test 10: Automatic timestamp generation
    PERFORM ok(
        (SELECT created_at FROM contacts WHERE id = contact_id) IS NOT NULL,
        'Contact should have automatic created_at timestamp'
    );
    
    -- Test 11: Updated_at trigger functionality
    UPDATE contacts SET name = 'John Updated' WHERE id = contact_id;
    
    PERFORM ok(
        (SELECT updated_at FROM contacts WHERE id = contact_id) > 
        (SELECT created_at FROM contacts WHERE id = contact_id),
        'Updated_at should be automatically updated on record changes'
    );
    
    -- ========================================
    -- TEST CATEGORY: Performance
    -- ========================================
    
    -- Test 12: Email lookup performance (should use index)
    DECLARE
        start_time TIMESTAMP WITH TIME ZONE;
        end_time TIMESTAMP WITH TIME ZONE;
        execution_time INTERVAL;
    BEGIN
        start_time := clock_timestamp();
        PERFORM * FROM contacts WHERE email = 'john.doe@example.com';
        end_time := clock_timestamp();
        execution_time := end_time - start_time;
        
        PERFORM ok(
            execution_time < interval '50 milliseconds',
            'Email lookup should complete within 50ms (using index)'
        );
    END;
    
    -- Test 13: Index usage verification
    PERFORM test_schema.check_index_usage(
        'SELECT * FROM contacts WHERE email = $1',
        'contacts_email_idx',
        'Email lookup should utilize email index'
    );
    
    -- ========================================
    -- TEST CATEGORY: Security (RLS)
    -- ========================================
    
    -- Test 14: Row Level Security enforcement
    -- (This would require setting up test users and policies)
    PERFORM ok(
        test_schema.validate_rls_policy('contacts', 'SELECT', contact_id),
        'RLS policies should properly restrict contact access'
    );
    
    -- ========================================
    -- TEST CATEGORY: Data Integrity
    -- ========================================
    
    -- Test 15: Soft delete functionality (if implemented)
    UPDATE contacts SET deleted_at = NOW() WHERE id = contact_id;
    
    PERFORM is(
        (SELECT COUNT(*) FROM contacts WHERE id = contact_id AND deleted_at IS NULL),
        0::bigint,
        'Soft deleted contacts should be excluded from normal queries'
    );
    
    -- Cleanup will be handled automatically by test framework
    PERFORM test_schema.cleanup_test_data(test_name);
    
EXCEPTION WHEN OTHERS THEN
    -- Ensure cleanup happens even on test failure
    PERFORM test_schema.cleanup_test_data(test_name);
    RAISE;
END$$;

-- End test session
SELECT test_schema.rollback_test();

SELECT finish();
```

### Performance Test Example

```sql
/*
Performance Test: test_contacts_performance.sql
Purpose: Validate contact management performance requirements
*/

\i sql/tests/helpers/test_helpers.sql
SET search_path TO test_schema, public, pg_catalog;

SELECT plan(8);
SELECT test_schema.begin_test();

DO $$
DECLARE
    test_name TEXT := 'contacts_performance_test';
    bulk_count INTEGER := 10000;
    sample_org_id UUID;
    timing_result INTERVAL;
BEGIN
    -- Create test organization
    SELECT test_schema.create_test_organization(test_name) INTO sample_org_id;
    
    -- Create bulk test data for performance testing
    PERFORM test_schema.create_bulk_test_data(test_name, 'contacts', bulk_count);
    
    -- ========================================
    -- Performance Test 1: Single Record Lookup
    -- ========================================
    SELECT test_schema.measure_query_time($query$
        SELECT * FROM contacts WHERE email = 'test1@example.com'
    $query$) INTO timing_result;
    
    PERFORM ok(
        timing_result < interval '50 milliseconds',
        'Single contact lookup by email should complete within 50ms'
    );
    
    -- ========================================
    -- Performance Test 2: Paginated Results  
    -- ========================================
    SELECT test_schema.measure_query_time($query$
        SELECT * FROM contacts 
        ORDER BY created_at DESC 
        LIMIT 50 OFFSET 1000
    $query$) INTO timing_result;
    
    PERFORM ok(
        timing_result < interval '100 milliseconds',
        'Paginated contact results should complete within 100ms'
    );
    
    -- ========================================
    -- Performance Test 3: Complex Join Query
    -- ========================================
    SELECT test_schema.measure_query_time($query$
        SELECT c.*, o.name as organization_name
        FROM contacts c
        JOIN organizations o ON c.organization_id = o.id
        WHERE o.type = 'B2B'
        ORDER BY c.name
        LIMIT 100
    $query$) INTO timing_result;
    
    PERFORM ok(
        timing_result < interval '200 milliseconds', 
        'Complex join query should complete within 200ms'
    );
    
    -- ========================================
    -- Performance Test 4: Aggregation Query
    -- ========================================
    SELECT test_schema.measure_query_time($query$
        SELECT 
            o.name as organization,
            COUNT(c.*) as contact_count
        FROM organizations o
        LEFT JOIN contacts c ON o.id = c.organization_id
        GROUP BY o.name
        ORDER BY contact_count DESC
    $query$) INTO timing_result;
    
    PERFORM ok(
        timing_result < interval '500 milliseconds',
        'Aggregation query should complete within 500ms'
    );
    
    -- ========================================
    -- Performance Test 5: Bulk Insert
    -- ========================================
    DECLARE
        start_time TIMESTAMP WITH TIME ZONE;
        bulk_insert_count INTEGER := 1000;
    BEGIN
        start_time := clock_timestamp();
        
        INSERT INTO contacts (name, email, organization_id)
        SELECT 
            'Bulk Contact ' || i,
            'bulk' || i || '@example.com',
            sample_org_id
        FROM generate_series(1, bulk_insert_count) i;
        
        timing_result := clock_timestamp() - start_time;
        
        PERFORM ok(
            timing_result < interval '2 seconds',
            'Bulk insert of ' || bulk_insert_count || ' contacts should complete within 2 seconds'
        );
        
        -- Cleanup bulk data
        DELETE FROM contacts WHERE email LIKE 'bulk%@example.com';
    END;
    
    -- ========================================
    -- Index Usage Validation Tests
    -- ========================================
    
    -- Test 6: Email index usage
    PERFORM ok(
        test_schema.check_index_usage(
            'SELECT * FROM contacts WHERE email = $1',
            'contacts_email_idx'
        ),
        'Email lookup queries should use email index'
    );
    
    -- Test 7: Organization index usage  
    PERFORM ok(
        test_schema.check_index_usage(
            'SELECT * FROM contacts WHERE organization_id = $1',
            'contacts_organization_id_idx'
        ),
        'Organization lookup queries should use organization index'
    );
    
    -- Test 8: Composite index usage
    PERFORM ok(
        test_schema.check_index_usage(
            'SELECT * FROM contacts WHERE organization_id = $1 AND created_at >= $2',
            'contacts_org_created_idx'
        ),
        'Time-based organization queries should use composite index'
    );
    
    -- Cleanup test data
    PERFORM test_schema.cleanup_test_data(test_name);
    
END$$;

SELECT test_schema.rollback_test();
SELECT finish();
```

This developer guide provides comprehensive guidance for working with the database testing framework, from initial setup through advanced test development patterns. The examples demonstrate real-world testing scenarios and best practices for maintaining high-quality database tests.