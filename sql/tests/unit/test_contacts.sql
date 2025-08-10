-- =============================================================================
-- Unit Tests for contacts Table
-- =============================================================================
-- This file tests the contacts table structure, constraints, validation,
-- and business logic including email format validation and triggers.
-- =============================================================================

\i sql/tests/helpers/test_helpers.sql
SET search_path TO test_schema, public, pg_catalog;

-- Test plan
SELECT plan(25);

-- Test metadata
SELECT test_schema.test_notify('Starting test: contacts table validation');

-- Test setup
SELECT test_schema.begin_test();

-- =============================================================================
-- TABLE STRUCTURE TESTS
-- =============================================================================

-- Test 1: Table exists
SELECT ok(
    has_table('public', 'contacts'),
    'contacts table should exist'
);

-- Test 2: Table has correct comment
SELECT like(
    test_schema.table_exists_with_comment('public', 'contacts', 
        'Stores professional contacts for CRM functionality'),
    '%exists with correct comment%',
    'contacts table should have correct comment'
);

-- =============================================================================
-- COLUMN STRUCTURE TESTS
-- =============================================================================

-- Test 3-11: Required columns exist
SELECT ok(has_column('public', 'contacts', 'id'), 'Should have id column');
SELECT ok(has_column('public', 'contacts', 'first_name'), 'Should have first_name column');
SELECT ok(has_column('public', 'contacts', 'last_name'), 'Should have last_name column');
SELECT ok(has_column('public', 'contacts', 'organization'), 'Should have organization column');
SELECT ok(has_column('public', 'contacts', 'email'), 'Should have email column');
SELECT ok(has_column('public', 'contacts', 'title'), 'Should have title column');
SELECT ok(has_column('public', 'contacts', 'phone'), 'Should have phone column');
SELECT ok(has_column('public', 'contacts', 'notes'), 'Should have notes column');
SELECT ok(has_column('public', 'contacts', 'created_at'), 'Should have created_at column');

-- Test 12: Primary key constraint
SELECT ok(
    col_is_pk('public', 'contacts', 'id'),
    'id should be primary key'
);

-- Test 13: UUID type for primary key
SELECT col_type_is(
    'public', 'contacts', 'id', 'uuid',
    'id column should be UUID type'
);

-- =============================================================================
-- CONSTRAINT TESTS
-- =============================================================================

-- Test 14: Email uniqueness constraint
DO $$
DECLARE
    test_id1 UUID;
    test_id2 UUID;
BEGIN
    -- Insert first contact
    INSERT INTO public.contacts (first_name, last_name, organization, email)
    VALUES ('John', 'Doe', 'Test Corp', 'unique.test@example.com')
    RETURNING id INTO test_id1;
    
    PERFORM test_schema.register_test_data('test_contacts', 'contact', test_id1);
END$$;

SELECT throws_ok(
    $$INSERT INTO public.contacts (first_name, last_name, organization, email)
      VALUES ('Jane', 'Smith', 'Another Corp', 'unique.test@example.com')$$,
    '23505',
    'Should reject duplicate email addresses'
);

-- Test 15: Email format validation
SELECT throws_ok(
    $$INSERT INTO public.contacts (first_name, last_name, organization, email)
      VALUES ('Invalid', 'Email', 'Test Corp', 'not-an-email')$$,
    '23514',
    'Should reject invalid email format'
);

SELECT throws_ok(
    $$INSERT INTO public.contacts (first_name, last_name, organization, email)
      VALUES ('Invalid', 'Email', 'Test Corp', 'missing-domain@')$$,
    '23514',
    'Should reject email missing domain'
);

-- Test 16: Name validation (no empty strings)
SELECT throws_ok(
    $$INSERT INTO public.contacts (first_name, last_name, organization, email)
      VALUES ('', 'Smith', 'Test Corp', 'empty.first@example.com')$$,
    '23514',
    'Should reject empty first_name'
);

SELECT throws_ok(
    $$INSERT INTO public.contacts (first_name, last_name, organization, email)
      VALUES ('John', '', 'Test Corp', 'empty.last@example.com')$$,
    '23514',
    'Should reject empty last_name'
);

SELECT throws_ok(
    $$INSERT INTO public.contacts (first_name, last_name, organization, email)
      VALUES ('John', 'Smith', '', 'empty.org@example.com')$$,
    '23514',
    'Should reject empty organization'
);

-- =============================================================================
-- NOT NULL CONSTRAINT TESTS
-- =============================================================================

-- Test 19: Required field validation
SELECT throws_ok(
    $$INSERT INTO public.contacts (last_name, organization, email)
      VALUES ('Smith', 'Test Corp', 'missing.first@example.com')$$,
    '23502',
    'Should reject NULL first_name'
);

SELECT throws_ok(
    $$INSERT INTO public.contacts (first_name, organization, email)
      VALUES ('John', 'Test Corp', 'missing.last@example.com')$$,
    '23502',
    'Should reject NULL last_name'
);

SELECT throws_ok(
    $$INSERT INTO public.contacts (first_name, last_name, email)
      VALUES ('John', 'Smith', 'missing.org@example.com')$$,
    '23502',
    'Should reject NULL organization'
);

SELECT throws_ok(
    $$INSERT INTO public.contacts (first_name, last_name, organization)
      VALUES ('John', 'Smith', 'Test Corp')$$,
    '23502',
    'Should reject NULL email'
);

-- =============================================================================
-- VALID DATA INSERTION TESTS
-- =============================================================================

-- Test 23: Valid contact insertion
DO $$
DECLARE
    test_id UUID;
    inserted_email TEXT;
BEGIN
    INSERT INTO public.contacts (
        first_name, last_name, organization, email, 
        title, phone, notes
    )
    VALUES (
        'Jane', 'Smith', 'Valid Corp', 'jane.smith@valid.com',
        'Manager', '555-1234', 'Test contact notes'
    )
    RETURNING id, email INTO test_id, inserted_email;
    
    PERFORM test_schema.register_test_data('test_contacts', 'contact', test_id);
    
    PERFORM ok(
        inserted_email = 'jane.smith@valid.com',
        'Should successfully insert valid contact data'
    );
END$$;

-- =============================================================================
-- TRIGGER TESTS (updated_at)
-- =============================================================================

-- Test 24: Updated_at trigger functionality
DO $$
DECLARE
    test_id UUID;
    original_updated_at TIMESTAMPTZ;
    new_updated_at TIMESTAMPTZ;
BEGIN
    -- Insert contact
    INSERT INTO public.contacts (first_name, last_name, organization, email)
    VALUES ('Update', 'Test', 'Trigger Corp', 'update.test@example.com')
    RETURNING id, updated_at INTO test_id, original_updated_at;
    
    PERFORM test_schema.register_test_data('test_contacts', 'contact', test_id);
    
    -- Wait a moment and update
    PERFORM pg_sleep(0.1);
    
    UPDATE public.contacts 
    SET title = 'Updated Title'
    WHERE id = test_id
    RETURNING updated_at INTO new_updated_at;
    
    PERFORM ok(
        new_updated_at > original_updated_at,
        'updated_at trigger should update timestamp on record modification'
    );
END$$;

-- =============================================================================
-- BUSINESS LOGIC TESTS
-- =============================================================================

-- Test 25: Test factory function
DO $$
DECLARE
    test_contact_id UUID;
    contact_email TEXT;
BEGIN
    SELECT test_schema.create_test_contact('test_contacts', 'Factory', 'User', 'Factory Corp') 
    INTO test_contact_id;
    
    SELECT email INTO contact_email 
    FROM public.contacts 
    WHERE id = test_contact_id;
    
    PERFORM ok(
        contact_email LIKE 'Factory.User.%@test.example.com',
        'Test factory should create contact with generated email'
    );
END$$;

-- =============================================================================
-- CLEANUP AND COMPLETION
-- =============================================================================

-- Clean up test data
PERFORM test_schema.cleanup_test_data('test_contacts');

-- Rollback test transaction
SELECT test_schema.rollback_test();

-- Finish test plan
SELECT finish();

-- Log completion
SELECT test_schema.test_notify('Completed test: contacts table validation');