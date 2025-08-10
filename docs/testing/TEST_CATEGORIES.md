# Test Categories Reference Guide

## Table of Contents

1. [Overview](#overview)
2. [Test Category Specifications](#test-category-specifications)
3. [File Organization](#file-organization)
4. [Helper Functions Reference](#helper-functions-reference)
5. [Test Data Management](#test-data-management)
6. [Category Implementation Examples](#category-implementation-examples)
7. [Testing Patterns and Best Practices](#testing-patterns-and-best-practices)

## Overview

The Supabase CRM Database Testing Framework organizes 834+ tests across 10 distinct categories, each focusing on specific aspects of database functionality, security, performance, and reliability. This reference guide provides detailed documentation for each category, including specifications, implementation patterns, and usage examples.

### Test Category Summary

| Category | Test Count | Execution Time | Purpose |
|----------|------------|----------------|---------|
| [Unit Tests](#unit-tests) | 25+ | ~15 seconds | Individual component validation |
| [Integration Tests](#integration-tests) | 229+ | ~90 seconds | Cross-component interaction testing |
| [Security Tests](#security-tests) | 217+ | ~75 seconds | RLS policies and data protection |
| [Performance Tests](#performance-tests) | 188+ | ~80 seconds | Query optimization and scalability |
| [Migration Tests](#migration-tests) | 45+ | ~30 seconds | Schema change validation |
| [Stress Tests](#stress-tests) | 35+ | ~45 seconds | High-load behavior testing |
| [Regression Tests](#regression-tests) | 28+ | ~25 seconds | Backward compatibility validation |
| [Edge Case Tests](#edge-case-tests) | 22+ | ~20 seconds | Boundary condition testing |
| [Recovery Tests](#recovery-tests) | 18+ | ~35 seconds | Backup and disaster recovery |
| [Monitoring Tests](#monitoring-tests) | 15+ | ~15 seconds | Observability validation |

## Test Category Specifications

### Unit Tests

**Directory**: `sql/tests/unit/`  
**Purpose**: Validate individual database components including tables, constraints, triggers, and basic functionality.  
**Execution Pattern**: Individual test files for each major entity or component.

#### Key Focus Areas
- **Table Structure Validation**: Column definitions, data types, constraints
- **Primary Key Constraints**: UUID generation and uniqueness
- **Foreign Key Relationships**: Reference integrity and cascade behavior
- **Check Constraints**: Data validation rules and business logic
- **Unique Constraints**: Email uniqueness, business key validation
- **Default Values**: Automatic timestamp generation, enum defaults
- **Trigger Functionality**: updated_at trigger behavior
- **Enum Type Validation**: Valid values and constraint enforcement

#### File Naming Convention
```
test_[entity]_[feature].sql
Examples:
- test_contacts_basic_structure.sql
- test_organizations_enum_validation.sql
- test_opportunities_stage_constraints.sql
```

#### Test Implementation Pattern
```sql
-- File: sql/tests/unit/test_contacts_basic_structure.sql
\i sql/tests/helpers/test_helpers.sql
SET search_path TO test_schema, public, pg_catalog;

SELECT plan(12);
SELECT test_schema.begin_test();

-- Table existence
SELECT ok(has_table('public', 'contacts'), 'Contacts table should exist');

-- Primary key validation
SELECT ok(has_pk('public', 'contacts'), 'Contacts table should have primary key');

-- Column type validation
SELECT col_type_is('public', 'contacts', 'id', 'uuid', 'ID column should be UUID');
SELECT col_type_is('public', 'contacts', 'email', 'text', 'Email column should be text');

-- Constraint validation
SELECT col_not_null('public', 'contacts', 'name', 'Name should not be null');
SELECT col_is_unique('public', 'contacts', 'email', 'Email should be unique');

-- Default value validation
SELECT col_default_is('public', 'contacts', 'created_at', 'now()', 'Created_at should default to now()');

SELECT test_schema.rollback_test();
SELECT finish();
```

### Integration Tests

**Directory**: `sql/tests/integration/`  
**Purpose**: Validate cross-table relationships, complex business logic, and multi-component interactions.  
**Execution Pattern**: Comprehensive workflow testing across multiple entities.

#### Key Focus Areas
- **Foreign Key Relationships**: Multi-table data consistency
- **Cascade Operations**: Delete and update propagation
- **Complex Queries**: Multi-table joins and aggregations
- **Business Logic Workflows**: Complete CRM process validation
- **JSONB Operations**: Complex JSON field queries and updates
- **Soft Delete Functionality**: Logical deletion with relationship preservation
- **Principal Activity Calculations**: Analytics and scoring algorithms
- **Opportunity Pipeline Workflows**: Complete sales process validation

#### Test Implementation Pattern
```sql
-- File: sql/tests/integration/test_opportunity_workflow_complete.sql
\i sql/tests/helpers/test_helpers.sql
SET search_path TO test_schema, public, pg_catalog;

SELECT plan(15);
SELECT test_schema.begin_test();

DO $$
DECLARE
    test_name TEXT := 'opportunity_workflow_integration';
    org_id UUID;
    contact_id UUID;
    product_id UUID;
    opportunity_id UUID;
    interaction_id UUID;
BEGIN
    -- Create interconnected test data
    SELECT test_schema.create_test_organization(test_name) INTO org_id;
    SELECT test_schema.create_test_contact(test_name, org_id) INTO contact_id;
    SELECT test_schema.create_test_product(test_name) INTO product_id;
    
    -- Test opportunity creation with relationships
    SELECT test_schema.create_test_opportunity(
        test_name, 'Test Opportunity', 'NEW_LEAD', org_id, contact_id, product_id
    ) INTO opportunity_id;
    
    -- Validate relationship integrity
    PERFORM is(
        (SELECT organization_id FROM opportunities WHERE id = opportunity_id),
        org_id,
        'Opportunity should maintain organization relationship'
    );
    
    -- Test stage progression workflow
    UPDATE opportunities 
    SET stage = 'INITIAL_OUTREACH', probability_percent = 25
    WHERE id = opportunity_id;
    
    PERFORM is(
        (SELECT stage FROM opportunities WHERE id = opportunity_id),
        'INITIAL_OUTREACH'::opportunity_stage,
        'Opportunity stage should progress correctly'
    );
    
    -- Test interaction logging integration
    SELECT test_schema.create_test_interaction(
        test_name, 'EMAIL', org_id, contact_id, opportunity_id
    ) INTO interaction_id;
    
    -- Validate cross-entity integration
    PERFORM ok(
        (SELECT opportunity_id FROM interactions WHERE id = interaction_id) = opportunity_id,
        'Interaction should be properly linked to opportunity'
    );
    
    -- Test cascade deletion behavior
    DELETE FROM opportunities WHERE id = opportunity_id;
    
    PERFORM is(
        (SELECT COUNT(*) FROM interactions WHERE opportunity_id = opportunity_id),
        0::bigint,
        'Related interactions should be cleaned up with opportunity deletion'
    );
    
    -- Cleanup handled automatically by test framework
    PERFORM test_schema.cleanup_test_data(test_name);
END$$;

SELECT test_schema.rollback_test();
SELECT finish();
```

### Security Tests

**Directory**: `sql/tests/security/`  
**Purpose**: Validate Row Level Security (RLS) policies, data access controls, and privacy compliance.  
**Execution Pattern**: Multi-user scenarios with policy enforcement validation.

#### Key Focus Areas
- **RLS Policy Enforcement**: Access control validation across all entities
- **User Authentication Integration**: Auth.users table integration
- **Cross-Tenant Data Isolation**: Organization-based access control
- **GDPR Compliance**: Data privacy and deletion requirements
- **Security Policy Performance**: <15% overhead requirement
- **Data Anonymization**: PII protection mechanisms
- **Audit Trail Functionality**: Security event logging
- **Role-Based Access Control**: Granular permission validation

#### Test Implementation Pattern
```sql
-- File: sql/tests/security/test_rls_contact_access_control.sql
\i sql/tests/helpers/test_helpers.sql
\i sql/tests/helpers/security_test_helpers.sql
SET search_path TO test_schema, public, pg_catalog;

SELECT plan(10);
SELECT test_schema.begin_test();

DO $$
DECLARE
    test_name TEXT := 'rls_contact_security_test';
    org1_id UUID;
    org2_id UUID;
    contact1_id UUID;
    contact2_id UUID;
    user1_id UUID;
    user2_id UUID;
BEGIN
    -- Create isolated test organizations
    SELECT test_schema.create_test_organization(test_name || '_org1') INTO org1_id;
    SELECT test_schema.create_test_organization(test_name || '_org2') INTO org2_id;
    
    -- Create test contacts in separate organizations
    SELECT test_schema.create_test_contact(test_name || '_contact1', org1_id) INTO contact1_id;
    SELECT test_schema.create_test_contact(test_name || '_contact2', org2_id) INTO contact2_id;
    
    -- Create test users and assign to organizations
    SELECT test_schema.create_test_user('user1@test.com', org1_id, 'ADMIN') INTO user1_id;
    SELECT test_schema.create_test_user('user2@test.com', org2_id, 'ADMIN') INTO user2_id;
    
    -- Test RLS policy enforcement for user1
    PERFORM test_schema.set_current_user(user1_id);
    
    -- User1 should see contacts from org1
    PERFORM ok(
        (SELECT COUNT(*) FROM contacts WHERE id = contact1_id) = 1,
        'User should see contacts from their organization'
    );
    
    -- User1 should NOT see contacts from org2
    PERFORM is(
        (SELECT COUNT(*) FROM contacts WHERE id = contact2_id),
        0::bigint,
        'User should not see contacts from other organizations'
    );
    
    -- Test insert policy enforcement
    PERFORM lives_ok(
        format('INSERT INTO contacts (name, email, organization_id) VALUES (%L, %L, %L)',
               'New Contact', 'new1@test.com', org1_id),
        'User should be able to insert contacts in their organization'
    );
    
    -- Test blocked cross-organization insert
    PERFORM throws_ok(
        format('INSERT INTO contacts (name, email, organization_id) VALUES (%L, %L, %L)',
               'Blocked Contact', 'blocked@test.com', org2_id),
        'Policy violation',
        'User should not be able to insert contacts in other organizations'
    );
    
    -- Switch to user2 and test isolation
    PERFORM test_schema.set_current_user(user2_id);
    
    -- User2 should see their contacts but not user1's
    PERFORM ok(
        (SELECT COUNT(*) FROM contacts WHERE id = contact2_id) = 1,
        'Second user should see contacts from their organization'
    );
    
    PERFORM is(
        (SELECT COUNT(*) FROM contacts WHERE id = contact1_id),
        0::bigint,
        'Second user should not see contacts from other organizations'
    );
    
    -- Test update policy enforcement
    PERFORM throws_ok(
        format('UPDATE contacts SET name = %L WHERE id = %L', 'Hacked Name', contact1_id),
        'Policy violation',
        'User should not be able to update contacts in other organizations'
    );
    
    -- Reset to admin user for cleanup
    PERFORM test_schema.reset_current_user();
    PERFORM test_schema.cleanup_test_data(test_name);
END$$;

SELECT test_schema.rollback_test();
SELECT finish();
```

### Performance Tests

**Directory**: `sql/tests/performance/`  
**Purpose**: Validate query performance, index utilization, and system scalability under load.  
**Execution Pattern**: Timing-based validation with performance benchmarks.

#### Key Focus Areas
- **Query Response Time Validation**: SLA compliance testing
- **Index Utilization Verification**: Proper index usage confirmation
- **Join Performance Optimization**: Multi-table query efficiency
- **Pagination Performance**: Large dataset handling
- **Bulk Operation Efficiency**: High-volume data operations
- **Concurrent Access Testing**: Multi-user performance impact
- **Memory Usage Validation**: Resource consumption monitoring
- **Cache Performance**: Query result caching effectiveness

#### Test Implementation Pattern
```sql
-- File: sql/tests/performance/test_contact_query_performance.sql
\i sql/tests/helpers/test_helpers.sql
SET search_path TO test_schema, public, pg_catalog;

SELECT plan(8);
SELECT test_schema.begin_test();

DO $$
DECLARE
    test_name TEXT := 'contact_performance_test';
    bulk_count INTEGER := 10000;
    timing_result INTERVAL;
    org_id UUID;
BEGIN
    -- Create test organization and bulk contact data
    SELECT test_schema.create_test_organization(test_name) INTO org_id;
    PERFORM test_schema.create_bulk_test_data(test_name, 'contacts', bulk_count);
    
    -- Performance Test 1: Single email lookup (should use index)
    SELECT test_schema.measure_query_time($query$
        SELECT * FROM contacts WHERE email = 'test1@example.com'
    $query$) INTO timing_result;
    
    PERFORM ok(
        timing_result < interval '50 milliseconds',
        'Single contact email lookup should complete within 50ms'
    );
    
    -- Performance Test 2: Paginated results
    SELECT test_schema.measure_query_time($query$
        SELECT * FROM contacts 
        ORDER BY created_at DESC 
        LIMIT 50 OFFSET 1000
    $query$) INTO timing_result;
    
    PERFORM ok(
        timing_result < interval '100 milliseconds',
        'Paginated contact results should complete within 100ms'
    );
    
    -- Performance Test 3: Complex join query
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
    
    -- Performance Test 4: Aggregation query
    SELECT test_schema.measure_query_time($query$
        SELECT 
            o.name,
            COUNT(c.*) as contact_count,
            MAX(c.created_at) as latest_contact
        FROM organizations o
        LEFT JOIN contacts c ON o.id = c.organization_id
        GROUP BY o.name
        ORDER BY contact_count DESC
        LIMIT 50
    $query$) INTO timing_result;
    
    PERFORM ok(
        timing_result < interval '500 milliseconds',
        'Aggregation query should complete within 500ms'
    );
    
    -- Index Usage Validation Tests
    
    -- Test 5: Email index usage
    PERFORM ok(
        test_schema.check_index_usage(
            'SELECT * FROM contacts WHERE email = $1',
            'contacts_email_idx'
        ),
        'Email lookup should utilize email index'
    );
    
    -- Test 6: Organization index usage
    PERFORM ok(
        test_schema.check_index_usage(
            'SELECT * FROM contacts WHERE organization_id = $1',
            'contacts_organization_id_idx'
        ),
        'Organization lookup should utilize organization index'
    );
    
    -- Bulk Operation Performance Tests
    
    -- Test 7: Bulk insert performance
    DECLARE
        start_time TIMESTAMP WITH TIME ZONE;
        bulk_insert_count INTEGER := 1000;
    BEGIN
        start_time := clock_timestamp();
        
        INSERT INTO contacts (name, email, organization_id)
        SELECT 
            'Bulk Contact ' || i,
            'bulk' || i || '@test.com',
            org_id
        FROM generate_series(1, bulk_insert_count) i;
        
        timing_result := clock_timestamp() - start_time;
        
        PERFORM ok(
            timing_result < interval '2 seconds',
            'Bulk insert of ' || bulk_insert_count || ' contacts should complete within 2 seconds'
        );
        
        -- Clean up bulk test data
        DELETE FROM contacts WHERE email LIKE 'bulk%@test.com';
    END;
    
    -- Test 8: Memory usage validation
    PERFORM ok(
        test_schema.check_memory_usage(test_name, 100), -- 100MB limit
        'Performance tests should not exceed memory limits'
    );
    
    -- Cleanup test data
    PERFORM test_schema.cleanup_test_data(test_name);
END$$;

SELECT test_schema.rollback_test();
SELECT finish();
```

### Migration Tests

**Directory**: `sql/tests/migration/`  
**Purpose**: Validate database schema changes, data migrations, and upgrade/downgrade procedures.  
**Execution Pattern**: Before/after state validation with rollback testing.

#### Key Focus Areas
- **Schema Change Validation**: Forward and backward migration testing
- **Data Migration Integrity**: Data transformation validation
- **Index Recreation**: Performance optimization maintenance
- **Constraint Migration**: Business rule preservation
- **Rollback Procedure Testing**: Safe downgrade capability
- **Migration Performance**: Large dataset migration efficiency
- **Dependency Resolution**: Migration order validation
- **Production Migration Simulation**: Safe production deployment testing

### Stress Tests

**Directory**: `sql/tests/stress/`  
**Purpose**: Validate system behavior under high load conditions and resource constraints.  
**Execution Pattern**: High-volume operations with resource monitoring.

#### Key Focus Areas
- **High Concurrent User Load**: Multi-user simultaneous access
- **Large Dataset Operations**: Big data handling capabilities
- **Memory Pressure Testing**: Resource constraint behavior
- **Connection Pool Exhaustion**: Connection limit testing
- **Lock Contention Resolution**: Concurrent access conflict handling
- **Query Queue Management**: High query volume handling
- **System Resource Utilization**: CPU, memory, and I/O monitoring
- **Graceful Degradation**: Performance under stress validation

### Regression Tests

**Directory**: `sql/tests/regression/`  
**Purpose**: Ensure existing functionality remains intact after changes.  
**Execution Pattern**: Baseline comparison testing with historical validation.

#### Key Focus Areas
- **API Contract Preservation**: Existing function signature validation
- **Query Result Consistency**: Output format stability
- **Performance Baseline Maintenance**: No performance degradation
- **Business Logic Preservation**: Existing workflow integrity
- **Data Format Compatibility**: Backward compatible data structures
- **Feature Flag Testing**: Progressive enhancement validation
- **Version Compatibility**: Multi-version support testing
- **Configuration Change Impact**: Settings modification effects

### Edge Case Tests

**Directory**: `sql/tests/edge/`  
**Purpose**: Validate system behavior at boundary conditions and unusual scenarios.  
**Execution Pattern**: Boundary value testing with exception handling validation.

#### Key Focus Areas
- **Null Value Handling**: NULL data processing validation
- **Empty Dataset Operations**: Zero-record scenario handling
- **Maximum Data Size Limits**: Large value boundary testing
- **Invalid Input Handling**: Malformed data rejection
- **Unicode and Special Characters**: International character support
- **Timezone Edge Cases**: Date/time boundary conditions
- **Numeric Boundary Values**: MIN/MAX value handling
- **Concurrent Modification Conflicts**: Race condition testing

### Recovery Tests

**Directory**: `sql/tests/recovery/`  
**Purpose**: Validate backup procedures, disaster recovery, and data restoration capabilities.  
**Execution Pattern**: Backup creation, restoration, and validation testing.

#### Key Focus Areas
- **Backup Integrity Validation**: Backup file completeness verification
- **Restoration Procedure Testing**: Complete data recovery validation
- **Point-in-Time Recovery**: Specific timestamp restoration
- **Partial Recovery Testing**: Selective data restoration
- **Recovery Time Objective (RTO)**: Restoration speed validation
- **Recovery Point Objective (RPO)**: Data loss minimization
- **Cross-Environment Restoration**: Production to staging recovery
- **Automated Recovery Procedures**: Scripted disaster recovery

### Monitoring Tests

**Directory**: `sql/tests/monitoring/`  
**Purpose**: Validate observability, alerting, and system monitoring capabilities.  
**Execution Pattern**: Metrics collection and alerting validation testing.

#### Key Focus Areas
- **Metrics Collection Accuracy**: Performance data validation
- **Alert Threshold Testing**: Notification trigger validation
- **Dashboard Data Integrity**: Monitoring display accuracy
- **Log Aggregation**: Event logging completeness
- **Health Check Validation**: System status monitoring
- **Performance Trend Analysis**: Historical data accuracy
- **Error Rate Monitoring**: Failure detection capabilities
- **Resource Usage Tracking**: System utilization monitoring

## File Organization

### Directory Structure Standards

```
sql/tests/
├── [category]/
│   ├── test_[entity]_[feature].sql          # Individual test files
│   ├── test_[category]_comprehensive.sql    # Category overview tests
│   └── README.md                            # Category-specific documentation
├── helpers/
│   ├── test_helpers.sql                     # Common test utilities
│   ├── [category]_test_helpers.sql          # Category-specific helpers
│   └── base_test_template.sql               # Standard test template
└── setup/
    ├── 00_install_pgtap.sql                # pgTAP installation
    ├── 01_test_schema_isolation.sql        # Test environment setup
    └── 02_test_data_registry.sql           # Data cleanup management
```

### File Naming Conventions

#### Test Files
```
Format: test_[entity]_[feature]_[variant].sql

Examples:
- test_contacts_email_validation.sql
- test_organizations_hierarchy_traversal.sql
- test_opportunities_stage_progression.sql
- test_security_rls_contact_access.sql
- test_performance_query_optimization.sql
```

#### Helper Files
```
Format: [category]_test_helpers.sql

Examples:
- security_test_helpers.sql
- performance_test_helpers.sql
- integration_test_helpers.sql
```

#### Documentation Files
```
Format: [CATEGORY]_[DOCUMENT_TYPE].md

Examples:
- PERFORMANCE_TESTING_GUIDE.md
- SECURITY_TEST_PATTERNS.md
- INTEGRATION_TEST_WORKFLOWS.md
```

## Helper Functions Reference

### Core Test Framework Functions

#### Test Lifecycle Management
```sql
-- Initialize test session
SELECT test_schema.begin_test();

-- Finalize test session with cleanup
SELECT test_schema.rollback_test();

-- Register test data for automatic cleanup
PERFORM test_schema.register_test_data(test_name, entity_type, entity_id);

-- Manual cleanup execution
PERFORM test_schema.cleanup_test_data(test_name);
```

#### Data Factory Functions
```sql
-- Create test contact
SELECT test_schema.create_test_contact(
    test_name TEXT,
    contact_name TEXT DEFAULT 'Test Contact',
    email TEXT DEFAULT 'test@example.com',
    organization_id UUID DEFAULT NULL
) RETURNS UUID;

-- Create test organization
SELECT test_schema.create_test_organization(
    test_name TEXT,
    org_name TEXT DEFAULT 'Test Organization',
    org_type organization_type DEFAULT 'B2B',
    is_active BOOLEAN DEFAULT true,
    is_distributor BOOLEAN DEFAULT false
) RETURNS UUID;

-- Create test opportunity
SELECT test_schema.create_test_opportunity(
    test_name TEXT,
    opp_name TEXT DEFAULT 'Test Opportunity',
    stage opportunity_stage DEFAULT 'NEW_LEAD',
    organization_id UUID DEFAULT NULL,
    contact_id UUID DEFAULT NULL,
    product_id UUID DEFAULT NULL
) RETURNS UUID;

-- Create bulk test data
SELECT test_schema.create_bulk_test_data(
    test_name TEXT,
    entity_type TEXT,
    count INTEGER
) RETURNS INTEGER;
```

### Performance Testing Helpers

```sql
-- Measure query execution time
SELECT test_schema.measure_query_time(query_text TEXT) RETURNS INTERVAL;

-- Check index usage for query
SELECT test_schema.check_index_usage(
    query_text TEXT,
    expected_index_name TEXT
) RETURNS BOOLEAN;

-- Validate memory usage
SELECT test_schema.check_memory_usage(
    test_name TEXT,
    max_memory_mb INTEGER
) RETURNS BOOLEAN;

-- Monitor concurrent performance
SELECT test_schema.test_concurrent_performance(
    query_text TEXT,
    concurrent_users INTEGER DEFAULT 10,
    max_response_time INTERVAL DEFAULT '1 second'
) RETURNS TABLE(user_id INTEGER, execution_time INTERVAL, success BOOLEAN);
```

### Security Testing Helpers

```sql
-- Create test user with organization assignment
SELECT test_schema.create_test_user(
    email TEXT,
    organization_id UUID,
    role TEXT DEFAULT 'VIEWER'
) RETURNS UUID;

-- Set current user context for RLS testing
PERFORM test_schema.set_current_user(user_id UUID);

-- Reset to admin context
PERFORM test_schema.reset_current_user();

-- Validate RLS policy enforcement
SELECT test_schema.validate_rls_policy(
    table_name TEXT,
    operation_type TEXT, -- 'SELECT', 'INSERT', 'UPDATE', 'DELETE'
    test_record_id UUID
) RETURNS BOOLEAN;

-- Test GDPR compliance
SELECT test_schema.test_gdpr_data_deletion(
    user_id UUID,
    expected_cleanup_tables TEXT[]
) RETURNS TABLE(table_name TEXT, records_deleted INTEGER);
```

### Integration Testing Helpers

```sql
-- Create complete test scenario with relationships
SELECT test_schema.create_test_scenario(
    test_name TEXT,
    scenario_type TEXT DEFAULT 'FULL_CRM'
) RETURNS JSONB; -- Returns created entity IDs

-- Validate entity relationship integrity
SELECT test_schema.validate_relationship_integrity(
    parent_table TEXT,
    parent_id UUID,
    child_table TEXT,
    relationship_field TEXT
) RETURNS BOOLEAN;

-- Test cascade operations
SELECT test_schema.test_cascade_behavior(
    parent_table TEXT,
    parent_id UUID,
    expected_cascades TEXT[]
) RETURNS TABLE(table_name TEXT, operation TEXT, record_count INTEGER);
```

## Test Data Management

### Data Registry System

The framework maintains a comprehensive registry of all test data to ensure proper cleanup and prevent test pollution.

```sql
-- Test data registry structure
CREATE TABLE test_schema.test_data_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_name VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    parent_test_name VARCHAR(100), -- For hierarchical cleanup
    created_at TIMESTAMPTZ DEFAULT NOW(),
    cleaned_up_at TIMESTAMPTZ,
    cleanup_method VARCHAR(20) DEFAULT 'CASCADE'
);

-- Test execution tracking
CREATE TABLE test_schema.test_execution_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_file VARCHAR(200) NOT NULL,
    test_category VARCHAR(50) NOT NULL,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    tests_planned INTEGER,
    tests_passed INTEGER,
    tests_failed INTEGER,
    performance_metrics JSONB,
    cleanup_successful BOOLEAN DEFAULT true
);
```

### Cleanup Strategies

#### Automatic Cleanup
```sql
-- Dependency-aware cleanup function
CREATE OR REPLACE FUNCTION test_schema.cleanup_test_data(p_test_name TEXT)
RETURNS TABLE(
    entity_type TEXT,
    records_deleted INTEGER,
    cleanup_status TEXT
) AS $$
DECLARE
    cleanup_order TEXT[] := ARRAY[
        'interactions', 'opportunities', 'contacts', 
        'organizations', 'products', 'users'
    ];
    current_entity TEXT;
    deleted_count INTEGER;
BEGIN
    -- Clean up in dependency order
    FOREACH current_entity IN ARRAY cleanup_order LOOP
        CASE current_entity
            WHEN 'contacts' THEN
                DELETE FROM contacts 
                WHERE id IN (
                    SELECT entity_id FROM test_schema.test_data_registry 
                    WHERE test_name = p_test_name AND entity_type = 'contacts'
                );
                GET DIAGNOSTICS deleted_count = ROW_COUNT;
                
            WHEN 'organizations' THEN
                DELETE FROM organizations 
                WHERE id IN (
                    SELECT entity_id FROM test_schema.test_data_registry 
                    WHERE test_name = p_test_name AND entity_type = 'organizations'
                );
                GET DIAGNOSTICS deleted_count = ROW_COUNT;
                
            -- Additional entities...
        END CASE;
        
        IF deleted_count > 0 THEN
            RETURN QUERY SELECT current_entity, deleted_count, 'SUCCESS'::TEXT;
        END IF;
    END LOOP;
    
    -- Mark registry entries as cleaned up
    UPDATE test_schema.test_data_registry 
    SET cleaned_up_at = NOW()
    WHERE test_name = p_test_name;
    
END$$
LANGUAGE plpgsql;
```

#### Manual Cleanup Procedures
```sql
-- Emergency cleanup for stuck tests
SELECT test_schema.emergency_cleanup_all_test_data();

-- Cleanup orphaned test data
SELECT test_schema.cleanup_orphaned_test_data();

-- Cleanup by time range
SELECT test_schema.cleanup_test_data_by_age(INTERVAL '1 hour');
```

## Category Implementation Examples

### Complete Unit Test Example

```sql
-- File: sql/tests/unit/test_products_comprehensive.sql
/*
Comprehensive unit test for products table covering:
- Table structure validation
- Constraint enforcement
- Business logic validation
- Trigger functionality
*/

\i sql/tests/helpers/test_helpers.sql
SET search_path TO test_schema, public, pg_catalog;

SELECT plan(18);
SELECT test_schema.begin_test();

-- Test Setup
DO $$
DECLARE
    test_name TEXT := 'products_unit_test_comprehensive';
BEGIN
    -- === STRUCTURE VALIDATION ===
    
    -- Test 1-3: Basic table structure
    PERFORM ok(has_table('public', 'products'), 'Products table exists');
    PERFORM ok(has_pk('public', 'products'), 'Products table has primary key');
    PERFORM col_type_is('public', 'products', 'id', 'uuid', 'ID is UUID type');
    
    -- Test 4-6: Required columns
    PERFORM col_not_null('public', 'products', 'name', 'Name is required');
    PERFORM col_not_null('public', 'products', 'category', 'Category is required');
    PERFORM col_type_is('public', 'products', 'price', 'numeric', 'Price is numeric');
    
    -- Test 7-8: Default values
    PERFORM col_default_is('public', 'products', 'is_active', 'true', 'Defaults to active');
    PERFORM col_default_is('public', 'products', 'created_at', 'now()', 'Auto timestamp');
    
    -- === CONSTRAINT VALIDATION ===
    
    -- Test 9: Positive price constraint
    PERFORM throws_ok(
        $$INSERT INTO products (name, category, price) VALUES ('Test', 'Software', -10.00)$$,
        '23514',
        'Should reject negative prices'
    );
    
    -- Test 10: Valid category constraint
    PERFORM throws_ok(
        $$INSERT INTO products (name, category, price) VALUES ('Test', 'InvalidCategory', 10.00)$$,
        '23514', 
        'Should reject invalid categories'
    );
    
    -- Test 11-12: Successful product creation
    DECLARE
        product_id UUID;
    BEGIN
        SELECT test_schema.create_test_product(
            test_name, 'Test Product', 'Software', 99.99
        ) INTO product_id;
        
        PERFORM ok(
            (SELECT COUNT(*) FROM products WHERE id = product_id) = 1,
            'Valid product should be created'
        );
        
        PERFORM is(
            (SELECT name FROM products WHERE id = product_id),
            'Test Product',
            'Product name should be stored correctly'
        );
    END;
    
    -- === BUSINESS LOGIC VALIDATION ===
    
    -- Test 13: SKU generation
    DECLARE
        product_with_sku UUID;
        generated_sku TEXT;
    BEGIN
        SELECT test_schema.create_test_product(
            test_name, 'SKU Test Product', 'Hardware', 199.99
        ) INTO product_with_sku;
        
        SELECT sku INTO generated_sku 
        FROM products WHERE id = product_with_sku;
        
        PERFORM ok(
            generated_sku IS NOT NULL AND length(generated_sku) >= 6,
            'Product should have auto-generated SKU'
        );
    END;
    
    -- Test 14: Price validation
    PERFORM lives_ok(
        $$INSERT INTO products (name, category, price) VALUES ('Valid Price', 'Software', 0.01)$$,
        'Should accept minimum valid price'
    );
    
    -- Test 15: Name uniqueness within category
    PERFORM throws_ok(
        format('INSERT INTO products (name, category, price) VALUES (%L, %L, %L)',
               'Test Product', 'Software', 49.99),
        '23505',
        'Should prevent duplicate product names within same category'
    );
    
    -- === TRIGGER VALIDATION ===
    
    -- Test 16: Updated_at trigger
    DECLARE
        test_product_id UUID;
        original_updated_at TIMESTAMPTZ;
        new_updated_at TIMESTAMPTZ;
    BEGIN
        SELECT test_schema.create_test_product(test_name) INTO test_product_id;
        SELECT updated_at INTO original_updated_at FROM products WHERE id = test_product_id;
        
        -- Wait and update
        PERFORM pg_sleep(0.1);
        UPDATE products SET price = 149.99 WHERE id = test_product_id;
        SELECT updated_at INTO new_updated_at FROM products WHERE id = test_product_id;
        
        PERFORM ok(
            new_updated_at > original_updated_at,
            'Updated_at should be automatically updated on changes'
        );
    END;
    
    -- === RELATIONSHIP VALIDATION ===
    
    -- Test 17: Principal-product relationships
    DECLARE
        product_id UUID;
        principal_id UUID;
    BEGIN
        SELECT test_schema.create_test_product(test_name) INTO product_id;
        SELECT test_schema.create_test_contact(test_name) INTO principal_id;
        
        -- Create product-principal association
        INSERT INTO product_principals (product_id, principal_id)
        VALUES (product_id, principal_id);
        
        PERFORM ok(
            (SELECT COUNT(*) FROM product_principals 
             WHERE product_id = product_id AND principal_id = principal_id) = 1,
            'Product-principal relationships should be createable'
        );
    END;
    
    -- === PERFORMANCE VALIDATION ===
    
    -- Test 18: Product lookup performance
    DECLARE
        timing_result INTERVAL;
    BEGIN
        -- Create some test data for performance testing
        PERFORM test_schema.create_bulk_test_data(test_name, 'products', 1000);
        
        SELECT test_schema.measure_query_time($query$
            SELECT * FROM products WHERE category = 'Software' AND is_active = true
            ORDER BY name LIMIT 10
        $query$) INTO timing_result;
        
        PERFORM ok(
            timing_result < interval '100 milliseconds',
            'Product category lookup should be performant'
        );
    END;
    
    -- Cleanup
    PERFORM test_schema.cleanup_test_data(test_name);
    
EXCEPTION WHEN OTHERS THEN
    -- Ensure cleanup on any failure
    PERFORM test_schema.cleanup_test_data(test_name);
    RAISE;
END$$;

SELECT test_schema.rollback_test();
SELECT finish();
```

## Testing Patterns and Best Practices

### Test Organization Patterns

#### 1. Hierarchical Test Structure
```sql
-- Parent test creates shared resources
SELECT test_schema.create_test_scenario('parent_test', 'BASIC_CRM');

-- Child tests inherit and extend
SELECT test_schema.extend_test_scenario('child_test_1', 'parent_test', 'OPPORTUNITY_WORKFLOW');
SELECT test_schema.extend_test_scenario('child_test_2', 'parent_test', 'INTERACTION_LOGGING');
```

#### 2. Test Data Inheritance
```sql
-- Create base test data
DO $$
DECLARE
    base_test TEXT := 'base_crm_scenario';
    derived_test TEXT := 'extended_opportunity_test';
BEGIN
    -- Create foundation data
    PERFORM test_schema.create_test_organization(base_test);
    PERFORM test_schema.create_test_contact(base_test, org_id);
    
    -- Inherit base data for extended test
    PERFORM test_schema.inherit_test_data(derived_test, base_test);
    
    -- Add additional test-specific data
    PERFORM test_schema.create_test_opportunity(derived_test, org_id, contact_id);
END$$;
```

#### 3. Parameterized Test Functions
```sql
-- Reusable test function with parameters
CREATE OR REPLACE FUNCTION test_contact_validation(
    p_test_scenario TEXT,
    p_validation_rules JSONB
) RETURNS VOID AS $$
DECLARE
    contact_id UUID;
    rule_key TEXT;
    rule_value TEXT;
BEGIN
    -- Create test contact
    SELECT test_schema.create_test_contact(p_test_scenario) INTO contact_id;
    
    -- Apply validation rules
    FOR rule_key, rule_value IN SELECT * FROM jsonb_each_text(p_validation_rules)
    LOOP
        CASE rule_key
            WHEN 'email_required' THEN
                PERFORM col_not_null('public', 'contacts', 'email', rule_value);
            WHEN 'email_unique' THEN
                PERFORM col_is_unique('public', 'contacts', 'email', rule_value);
            -- Additional rules...
        END CASE;
    END LOOP;
    
    PERFORM test_schema.cleanup_test_data(p_test_scenario);
END$$
LANGUAGE plpgsql;

-- Usage
SELECT test_contact_validation('email_validation_test', '{
    "email_required": "Email should be required field",
    "email_unique": "Email should be unique across contacts"
}'::JSONB);
```

### Error Handling Patterns

#### 1. Graceful Test Failure
```sql
DO $$
DECLARE
    test_name TEXT := 'error_handling_test';
BEGIN
    -- Test logic with potential failure points
    BEGIN
        -- Risky operation
        PERFORM some_test_operation();
        
        PERFORM ok(true, 'Operation completed successfully');
        
    EXCEPTION 
        WHEN OTHERS THEN
            -- Log failure details
            PERFORM test_schema.log_test_failure(test_name, SQLERRM, SQLSTATE);
            
            -- Still validate expected behavior
            PERFORM ok(false, 'Operation failed as expected: ' || SQLERRM);
    END;
    
    -- Always cleanup
    PERFORM test_schema.cleanup_test_data(test_name);
END$$;
```

#### 2. Transaction Isolation
```sql
DO $$
DECLARE
    test_savepoint TEXT := 'test_' || extract(epoch from now())::TEXT;
BEGIN
    -- Create savepoint for isolation
    EXECUTE 'SAVEPOINT ' || test_savepoint;
    
    BEGIN
        -- Test operations that might fail
        PERFORM risky_test_operations();
        
        -- Rollback to savepoint on any issue
        EXCEPTION WHEN OTHERS THEN
            EXECUTE 'ROLLBACK TO SAVEPOINT ' || test_savepoint;
            RAISE;
    END;
    
    -- Release savepoint if successful
    EXECUTE 'RELEASE SAVEPOINT ' || test_savepoint;
END$$;
```

### Performance Testing Patterns

#### 1. Benchmark Comparison
```sql
-- Establish baseline
PERFORM test_schema.create_performance_baseline('contact_queries', '{
    "single_lookup": 45,
    "paginated_results": 85,
    "complex_join": 180
}'::JSONB);

-- Test against baseline
DO $$
DECLARE
    current_time INTERVAL;
    baseline_time INTERVAL;
    regression_threshold DECIMAL := 1.2; -- 20% degradation threshold
BEGIN
    -- Measure current performance
    SELECT test_schema.measure_query_time($query$
        SELECT * FROM contacts WHERE email = 'test@example.com'
    $query$) INTO current_time;
    
    -- Get baseline
    SELECT (baseline_metrics->>'single_lookup')::INTERVAL 
    INTO baseline_time
    FROM test_schema.performance_baselines 
    WHERE test_category = 'contact_queries';
    
    -- Compare with threshold
    PERFORM ok(
        current_time <= baseline_time * regression_threshold,
        format('Query time %s should not exceed baseline %s by more than 20%%', 
               current_time, baseline_time)
    );
END$$;
```

This comprehensive test categories reference provides detailed guidance for implementing, organizing, and maintaining the 834+ test database testing framework across all 10 categories, ensuring consistent quality and comprehensive coverage of the Supabase CRM database system.