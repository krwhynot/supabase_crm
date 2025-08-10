-- =============================================================================
-- Unit Tests for organizations Table
-- =============================================================================
-- This file tests the organizations table structure, constraints, enums,
-- business logic, and principal/distributor relationship validation.
-- =============================================================================

\i sql/tests/helpers/test_helpers.sql
SET search_path TO test_schema, public, pg_catalog;

-- Test plan
SELECT plan(35);

-- Test metadata
SELECT test_schema.test_notify('Starting test: organizations table validation');

-- Test setup
SELECT test_schema.begin_test();

-- =============================================================================
-- TABLE STRUCTURE TESTS
-- =============================================================================

-- Test 1: Table exists
SELECT ok(
    has_table('public', 'organizations'),
    'organizations table should exist'
);

-- Test 2: Table has correct comment
SELECT like(
    test_schema.table_exists_with_comment('public', 'organizations', 
        'Comprehensive organizations/companies table for CRM functionality'),
    '%exists with correct comment%',
    'organizations table should have correct comment'
);

-- =============================================================================
-- ENUM TESTS
-- =============================================================================

-- Test 3-5: Enum types exist
SELECT ok(
    has_type('public', 'organization_type'),
    'organization_type enum should exist'
);

SELECT ok(
    has_type('public', 'organization_size'),
    'organization_size enum should exist'
);

SELECT ok(
    has_type('public', 'organization_status'),
    'organization_status enum should exist'
);

-- =============================================================================
-- COLUMN STRUCTURE TESTS
-- =============================================================================

-- Test 6-15: Key columns exist
SELECT ok(has_column('public', 'organizations', 'id'), 'Should have id column');
SELECT ok(has_column('public', 'organizations', 'name'), 'Should have name column');
SELECT ok(has_column('public', 'organizations', 'type'), 'Should have type column');
SELECT ok(has_column('public', 'organizations', 'status'), 'Should have status column');
SELECT ok(has_column('public', 'organizations', 'is_principal'), 'Should have is_principal column');
SELECT ok(has_column('public', 'organizations', 'is_distributor'), 'Should have is_distributor column');
SELECT ok(has_column('public', 'organizations', 'distributor_id'), 'Should have distributor_id column');
SELECT ok(has_column('public', 'organizations', 'parent_org_id'), 'Should have parent_org_id column');
SELECT ok(has_column('public', 'organizations', 'lead_score'), 'Should have lead_score column');
SELECT ok(has_column('public', 'organizations', 'created_at'), 'Should have created_at column');

-- Test 16: Primary key
SELECT ok(
    col_is_pk('public', 'organizations', 'id'),
    'id should be primary key'
);

-- Test 17: UUID type for primary key
SELECT col_type_is(
    'public', 'organizations', 'id', 'uuid',
    'id column should be UUID type'
);

-- =============================================================================
-- CONSTRAINT TESTS
-- =============================================================================

-- Test 18: Lead score check constraint (0-100)
SELECT throws_ok(
    $$INSERT INTO public.organizations (name, lead_score)
      VALUES ('Invalid Score Org', -10)$$,
    '23514',
    'Should reject negative lead_score'
);

SELECT throws_ok(
    $$INSERT INTO public.organizations (name, lead_score)
      VALUES ('Invalid Score Org', 150)$$,
    '23514',
    'Should reject lead_score over 100'
);

-- Test 20: Valid lead score values
DO $$
DECLARE
    test_id UUID;
BEGIN
    INSERT INTO public.organizations (name, lead_score)
    VALUES ('Valid Score Org', 75)
    RETURNING id INTO test_id;
    
    PERFORM test_schema.register_test_data('test_organizations', 'organization', test_id);
    
    PERFORM ok(
        (SELECT lead_score FROM public.organizations WHERE id = test_id) = 75,
        'Should accept valid lead_score values'
    );
END$$;

-- =============================================================================
-- ENUM VALUE TESTS
-- =============================================================================

-- Test 21: Valid organization_type values
DO $$
DECLARE
    test_id UUID;
BEGIN
    INSERT INTO public.organizations (name, type)
    VALUES ('B2B Test Org', 'B2B')
    RETURNING id INTO test_id;
    
    PERFORM test_schema.register_test_data('test_organizations', 'organization', test_id);
    
    PERFORM ok(
        (SELECT type FROM public.organizations WHERE id = test_id) = 'B2B',
        'Should accept valid organization_type enum values'
    );
END$$;

-- Test 22: Invalid enum value rejection
SELECT throws_ok(
    $$INSERT INTO public.organizations (name, type)
      VALUES ('Invalid Type Org', 'INVALID_TYPE')$$,
    '22P02',
    'Should reject invalid organization_type enum values'
);

-- =============================================================================
-- FOREIGN KEY CONSTRAINT TESTS
-- =============================================================================

-- Test 23: Self-referential foreign key for parent_org_id
DO $$
DECLARE
    parent_id UUID;
    child_id UUID;
BEGIN
    -- Create parent organization
    INSERT INTO public.organizations (name)
    VALUES ('Parent Organization')
    RETURNING id INTO parent_id;
    
    PERFORM test_schema.register_test_data('test_organizations', 'organization', parent_id);
    
    -- Create child organization
    INSERT INTO public.organizations (name, parent_org_id)
    VALUES ('Child Organization', parent_id)
    RETURNING id INTO child_id;
    
    PERFORM test_schema.register_test_data('test_organizations', 'organization', child_id);
    
    PERFORM ok(
        (SELECT parent_org_id FROM public.organizations WHERE id = child_id) = parent_id,
        'Should support parent-child organization relationships'
    );
END$$;

-- Test 24: Foreign key constraint for distributor_id
DO $$
DECLARE
    distributor_id UUID;
    principal_id UUID;
BEGIN
    -- Create distributor organization
    INSERT INTO public.organizations (name, is_distributor)
    VALUES ('Distributor Org', TRUE)
    RETURNING id INTO distributor_id;
    
    PERFORM test_schema.register_test_data('test_organizations', 'organization', distributor_id);
    
    -- Create principal organization with distributor reference
    INSERT INTO public.organizations (name, is_principal, distributor_id)
    VALUES ('Principal Org', TRUE, distributor_id)
    RETURNING id INTO principal_id;
    
    PERFORM test_schema.register_test_data('test_organizations', 'organization', principal_id);
    
    PERFORM ok(
        (SELECT distributor_id FROM public.organizations WHERE id = principal_id) = distributor_id,
        'Should support distributor relationships'
    );
END$$;

-- =============================================================================
-- BUSINESS LOGIC TESTS
-- =============================================================================

-- Test 25: Principal/Distributor mutual exclusivity
DO $$
DECLARE
    test_id UUID;
BEGIN
    -- This should be allowed (both FALSE)
    INSERT INTO public.organizations (name, is_principal, is_distributor)
    VALUES ('Regular Org', FALSE, FALSE)
    RETURNING id INTO test_id;
    
    PERFORM test_schema.register_test_data('test_organizations', 'organization', test_id);
    
    PERFORM ok(
        (SELECT COUNT(*) FROM public.organizations WHERE id = test_id) = 1,
        'Should allow organization that is neither principal nor distributor'
    );
END$$;

-- Test 26: Principal organization
DO $$
DECLARE
    test_id UUID;
BEGIN
    INSERT INTO public.organizations (name, is_principal, is_distributor)
    VALUES ('Principal Only Org', TRUE, FALSE)
    RETURNING id INTO test_id;
    
    PERFORM test_schema.register_test_data('test_organizations', 'organization', test_id);
    
    PERFORM ok(
        (SELECT is_principal FROM public.organizations WHERE id = test_id) = TRUE AND
        (SELECT is_distributor FROM public.organizations WHERE id = test_id) = FALSE,
        'Should allow principal-only organization'
    );
END$$;

-- Test 27: Distributor organization
DO $$
DECLARE
    test_id UUID;
BEGIN
    INSERT INTO public.organizations (name, is_principal, is_distributor)
    VALUES ('Distributor Only Org', FALSE, TRUE)
    RETURNING id INTO test_id;
    
    PERFORM test_schema.register_test_data('test_organizations', 'organization', test_id);
    
    PERFORM ok(
        (SELECT is_principal FROM public.organizations WHERE id = test_id) = FALSE AND
        (SELECT is_distributor FROM public.organizations WHERE id = test_id) = TRUE,
        'Should allow distributor-only organization'
    );
END$$;

-- =============================================================================
-- DEFAULT VALUE TESTS
-- =============================================================================

-- Test 28: Default values
DO $$
DECLARE
    test_id UUID;
    org_type public.organization_type;
    org_status public.organization_status;
    default_score INTEGER;
BEGIN
    INSERT INTO public.organizations (name)
    VALUES ('Default Values Test')
    RETURNING id, type, status, lead_score INTO test_id, org_type, org_status, default_score;
    
    PERFORM test_schema.register_test_data('test_organizations', 'organization', test_id);
    
    PERFORM ok(
        org_type = 'B2B' AND org_status = 'Prospect' AND default_score = 0,
        'Should set correct default values for type, status, and lead_score'
    );
END$$;

-- =============================================================================
-- NOT NULL CONSTRAINT TESTS
-- =============================================================================

-- Test 29: Required field validation
SELECT throws_ok(
    $$INSERT INTO public.organizations (type, status)
      VALUES ('B2B', 'Prospect')$$,
    '23502',
    'Should reject NULL name'
);

-- =============================================================================
-- JSONB FIELD TESTS
-- =============================================================================

-- Test 30: JSONB fields accept valid JSON
DO $$
DECLARE
    test_id UUID;
    retrieved_tags JSONB;
    retrieved_fields JSONB;
BEGIN
    INSERT INTO public.organizations (
        name, tags, custom_fields
    )
    VALUES (
        'JSONB Test Org',
        '["technology", "startup", "b2b"]'::jsonb,
        '{"industry_focus": "fintech", "employee_range": "50-100"}'::jsonb
    )
    RETURNING id, tags, custom_fields INTO test_id, retrieved_tags, retrieved_fields;
    
    PERFORM test_schema.register_test_data('test_organizations', 'organization', test_id);
    
    PERFORM ok(
        jsonb_array_length(retrieved_tags) = 3 AND
        retrieved_fields->>'industry_focus' = 'fintech',
        'Should correctly store and retrieve JSONB data'
    );
END$$;

-- =============================================================================
-- SOFT DELETE TESTS
-- =============================================================================

-- Test 31: Soft delete functionality
DO $$
DECLARE
    test_id UUID;
    delete_timestamp TIMESTAMPTZ;
BEGIN
    INSERT INTO public.organizations (name)
    VALUES ('Soft Delete Test')
    RETURNING id INTO test_id;
    
    PERFORM test_schema.register_test_data('test_organizations', 'organization', test_id);
    
    -- Simulate soft delete
    UPDATE public.organizations 
    SET deleted_at = NOW()
    WHERE id = test_id
    RETURNING deleted_at INTO delete_timestamp;
    
    PERFORM ok(
        delete_timestamp IS NOT NULL,
        'Should support soft delete with deleted_at timestamp'
    );
END$$;

-- =============================================================================
-- TEST FACTORY FUNCTION TESTS
-- =============================================================================

-- Test 32: Test factory for regular organization
DO $$
DECLARE
    test_org_id UUID;
    org_name TEXT;
BEGIN
    SELECT test_schema.create_test_organization('test_organizations') INTO test_org_id;
    
    SELECT name INTO org_name FROM public.organizations WHERE id = test_org_id;
    
    PERFORM ok(
        org_name LIKE 'Test Organization %',
        'Test factory should create organization with generated name'
    );
END$$;

-- Test 33: Test factory for principal organization
DO $$
DECLARE
    test_principal_id UUID;
    is_principal_flag BOOLEAN;
BEGIN
    SELECT test_schema.create_test_organization(
        'test_organizations', 'Test Principal Factory', 'B2B', TRUE, FALSE
    ) INTO test_principal_id;
    
    SELECT is_principal INTO is_principal_flag 
    FROM public.organizations 
    WHERE id = test_principal_id;
    
    PERFORM ok(
        is_principal_flag = TRUE,
        'Test factory should create principal organization when specified'
    );
END$$;

-- Test 34: Test factory for distributor organization
DO $$
DECLARE
    test_distributor_id UUID;
    is_distributor_flag BOOLEAN;
BEGIN
    SELECT test_schema.create_test_organization(
        'test_organizations', 'Test Distributor Factory', 'B2B', FALSE, TRUE
    ) INTO test_distributor_id;
    
    SELECT is_distributor INTO is_distributor_flag 
    FROM public.organizations 
    WHERE id = test_distributor_id;
    
    PERFORM ok(
        is_distributor_flag = TRUE,
        'Test factory should create distributor organization when specified'
    );
END$$;

-- =============================================================================
-- EMAIL VALIDATION TESTS
-- =============================================================================

-- Test 35: Email format validation (if constraint exists)
DO $$
DECLARE
    test_id UUID;
BEGIN
    INSERT INTO public.organizations (name, email)
    VALUES ('Valid Email Org', 'contact@valid-org.com')
    RETURNING id INTO test_id;
    
    PERFORM test_schema.register_test_data('test_organizations', 'organization', test_id);
    
    PERFORM ok(
        (SELECT email FROM public.organizations WHERE id = test_id) = 'contact@valid-org.com',
        'Should accept valid email format for organizations'
    );
END$$;

-- =============================================================================
-- CLEANUP AND COMPLETION
-- =============================================================================

-- Clean up test data
PERFORM test_schema.cleanup_test_data('test_organizations');

-- Rollback test transaction
SELECT test_schema.rollback_test();

-- Finish test plan
SELECT finish();

-- Log completion
SELECT test_schema.test_notify('Completed test: organizations table validation');