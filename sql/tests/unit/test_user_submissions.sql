-- =============================================================================
-- Unit Tests for user_submissions Table
-- =============================================================================
-- This file tests the user_submissions table structure, constraints,
-- and data integrity validation.
-- =============================================================================

\i sql/tests/helpers/test_helpers.sql
SET search_path TO test_schema, public, pg_catalog;

-- Test plan
SELECT plan(20);

-- Test metadata
SELECT test_schema.test_notify('Starting test: user_submissions table validation');

-- Test setup
SELECT test_schema.begin_test();

-- =============================================================================
-- TABLE STRUCTURE TESTS
-- =============================================================================

-- Test 1: Table exists
SELECT ok(
    has_table('public', 'user_submissions'),
    'user_submissions table should exist'
);

-- Test 2: Table has correct comment
SELECT like(
    test_schema.table_exists_with_comment('public', 'user_submissions', 
        'Stores user form submissions from the frontend application'),
    '%exists with correct comment%',
    'user_submissions table should have correct comment'
);

-- =============================================================================
-- COLUMN STRUCTURE TESTS
-- =============================================================================

-- Test 3-7: Required columns exist with correct types
SELECT ok(
    has_column('public', 'user_submissions', 'id'),
    'Should have id column'
);

SELECT ok(
    has_column('public', 'user_submissions', 'first_name'),
    'Should have first_name column'
);

SELECT ok(
    has_column('public', 'user_submissions', 'last_name'),
    'Should have last_name column'
);

SELECT ok(
    has_column('public', 'user_submissions', 'age'),
    'Should have age column'
);

SELECT ok(
    has_column('public', 'user_submissions', 'favorite_color'),
    'Should have favorite_color column'
);

-- Test 8-9: Timestamp columns
SELECT ok(
    has_column('public', 'user_submissions', 'created_at'),
    'Should have created_at column'
);

SELECT ok(
    has_column('public', 'user_submissions', 'updated_at'),
    'Should have updated_at column'
);

-- Test 10: Primary key constraint
SELECT ok(
    col_is_pk('public', 'user_submissions', 'id'),
    'id should be primary key'
);

-- =============================================================================
-- CONSTRAINT TESTS
-- =============================================================================

-- Test 11: Age check constraint (positive values only)
SELECT throws_ok(
    $$INSERT INTO public.user_submissions (first_name, last_name, age, favorite_color) 
      VALUES ('Test', 'User', -5, 'Blue')$$,
    '23514',
    'Should reject negative age values'
);

SELECT throws_ok(
    $$INSERT INTO public.user_submissions (first_name, last_name, age, favorite_color) 
      VALUES ('Test', 'User', 0, 'Blue')$$,
    '23514',
    'Should reject zero age values'
);

-- =============================================================================
-- DATA INSERTION TESTS
-- =============================================================================

-- Test 13: Valid data insertion
DO $$
DECLARE
    test_id BIGINT;
BEGIN
    INSERT INTO public.user_submissions (first_name, last_name, age, favorite_color)
    VALUES ('John', 'Doe', 30, 'Green')
    RETURNING id INTO test_id;
    
    -- Register for cleanup
    PERFORM test_schema.register_test_data('test_user_submissions', 'user_submission', test_id::text::uuid);
END$$;

SELECT ok(
    (SELECT COUNT(*) FROM public.user_submissions WHERE first_name = 'John' AND last_name = 'Doe') = 1,
    'Should successfully insert valid user submission'
);

-- Test 14: NOT NULL constraints
SELECT throws_ok(
    $$INSERT INTO public.user_submissions (last_name, age, favorite_color) 
      VALUES ('Smith', 25, 'Red')$$,
    '23502',
    'Should reject NULL first_name'
);

SELECT throws_ok(
    $$INSERT INTO public.user_submissions (first_name, age, favorite_color) 
      VALUES ('Jane', 25, 'Red')$$,
    '23502',
    'Should reject NULL last_name'
);

SELECT throws_ok(
    $$INSERT INTO public.user_submissions (first_name, last_name, favorite_color) 
      VALUES ('Jane', 'Smith', 'Red')$$,
    '23502',
    'Should reject NULL age'
);

SELECT throws_ok(
    $$INSERT INTO public.user_submissions (first_name, last_name, age) 
      VALUES ('Jane', 'Smith', 25)$$,
    '23502',
    'Should reject NULL favorite_color'
);

-- =============================================================================
-- DEFAULT VALUE TESTS
-- =============================================================================

-- Test 18: Default timestamps
DO $$
DECLARE
    test_id BIGINT;
    created_time TIMESTAMPTZ;
    updated_time TIMESTAMPTZ;
BEGIN
    INSERT INTO public.user_submissions (first_name, last_name, age, favorite_color)
    VALUES ('Time', 'Test', 28, 'Purple')
    RETURNING id, created_at, updated_at INTO test_id, created_time, updated_time;
    
    -- Register for cleanup
    PERFORM test_schema.register_test_data('test_user_submissions', 'user_submission', test_id::text::uuid);
    
    -- Check that timestamps were set
    PERFORM ok(
        created_time IS NOT NULL AND updated_time IS NOT NULL,
        'Default timestamps should be set automatically'
    );
END$$;

-- =============================================================================
-- BUSINESS LOGIC TESTS
-- =============================================================================

-- Test 19: Test factory function
DO $$
DECLARE
    test_submission_id UUID;
BEGIN
    SELECT test_schema.create_test_user_submission('test_user_submissions') INTO test_submission_id;
    
    PERFORM ok(
        (SELECT COUNT(*) FROM public.user_submissions WHERE id = test_submission_id::text::bigint) = 1,
        'Test factory should create valid user submission'
    );
END$$;

-- Test 20: Data integrity with edge cases
DO $$
DECLARE
    test_id BIGINT;
BEGIN
    -- Test with very long names (within limits)
    INSERT INTO public.user_submissions (
        first_name, 
        last_name, 
        age, 
        favorite_color
    )
    VALUES (
        repeat('A', 100), -- Long but within VARCHAR(255) limit
        repeat('B', 100),
        120, -- High but reasonable age
        repeat('C', 30) -- Long but within VARCHAR(50) limit
    )
    RETURNING id INTO test_id;
    
    -- Register for cleanup
    PERFORM test_schema.register_test_data('test_user_submissions', 'user_submission', test_id::text::uuid);
    
    PERFORM ok(
        (SELECT COUNT(*) FROM public.user_submissions WHERE id = test_id) = 1,
        'Should handle edge case values within constraints'
    );
END$$;

-- =============================================================================
-- CLEANUP AND COMPLETION
-- =============================================================================

-- Clean up test data
PERFORM test_schema.cleanup_test_data('test_user_submissions');

-- Rollback test transaction
SELECT test_schema.rollback_test();

-- Finish test plan
SELECT finish();

-- Log completion
SELECT test_schema.test_notify('Completed test: user_submissions table validation');