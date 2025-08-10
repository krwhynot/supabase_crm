-- =============================================================================
-- pgTAP Test Helper Functions
-- =============================================================================
-- This file contains reusable helper functions for pgTAP testing to reduce
-- code duplication and standardize common testing patterns.
-- =============================================================================

-- Set search path for helpers
SET search_path TO test_schema, public, pg_catalog;

-- =============================================================================
-- DATABASE STRUCTURE TESTING HELPERS
-- =============================================================================

-- Check if table exists with proper comment
CREATE OR REPLACE FUNCTION test_schema.table_exists_with_comment(
    schema_name TEXT,
    table_name TEXT,
    expected_comment TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
    actual_comment TEXT;
BEGIN
    -- Check if table exists
    IF NOT has_table(schema_name, table_name) THEN
        RETURN format('Table %s.%s does not exist', schema_name, table_name);
    END IF;
    
    -- Check comment if provided
    IF expected_comment IS NOT NULL THEN
        SELECT obj_description(c.oid) INTO actual_comment
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = table_name AND n.nspname = schema_name;
        
        IF actual_comment IS NULL OR actual_comment != expected_comment THEN
            RETURN format('Table %s.%s comment mismatch. Expected: %s, Got: %s',
                schema_name, table_name, expected_comment, COALESCE(actual_comment, 'NULL'));
        END IF;
    END IF;
    
    RETURN format('Table %s.%s exists with correct comment', schema_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- Check column with all properties
CREATE OR REPLACE FUNCTION test_schema.column_has_properties(
    schema_name TEXT,
    table_name TEXT,
    column_name TEXT,
    expected_type TEXT,
    is_nullable BOOLEAN DEFAULT TRUE,
    has_default BOOLEAN DEFAULT FALSE,
    expected_comment TEXT DEFAULT NULL
)
RETURNS TEXT[] AS $$
DECLARE
    results TEXT[] := ARRAY[]::TEXT[];
    actual_type TEXT;
    actual_nullable BOOLEAN;
    actual_has_default BOOLEAN;
    actual_comment TEXT;
BEGIN
    -- Get column information
    SELECT 
        format_type(a.atttypid, a.atttypmod),
        NOT a.attnotnull,
        a.atthasdef,
        col_description(a.attrelid, a.attnum)
    INTO actual_type, actual_nullable, actual_has_default, actual_comment
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = table_name 
    AND n.nspname = schema_name 
    AND a.attname = column_name
    AND NOT a.attisdropped;
    
    -- Check if column exists
    IF NOT FOUND THEN
        results := array_append(results, 
            format('Column %s.%s.%s does not exist', schema_name, table_name, column_name));
        RETURN results;
    END IF;
    
    -- Check type
    IF actual_type != expected_type THEN
        results := array_append(results,
            format('Column %s.%s.%s type mismatch. Expected: %s, Got: %s',
                schema_name, table_name, column_name, expected_type, actual_type));
    END IF;
    
    -- Check nullable
    IF actual_nullable != is_nullable THEN
        results := array_append(results,
            format('Column %s.%s.%s nullable mismatch. Expected: %s, Got: %s',
                schema_name, table_name, column_name, is_nullable, actual_nullable));
    END IF;
    
    -- Check default
    IF actual_has_default != has_default THEN
        results := array_append(results,
            format('Column %s.%s.%s default mismatch. Expected: %s, Got: %s',
                schema_name, table_name, column_name, has_default, actual_has_default));
    END IF;
    
    -- Check comment if provided
    IF expected_comment IS NOT NULL THEN
        IF actual_comment IS NULL OR actual_comment != expected_comment THEN
            results := array_append(results,
                format('Column %s.%s.%s comment mismatch. Expected: %s, Got: %s',
                    schema_name, table_name, column_name, expected_comment, 
                    COALESCE(actual_comment, 'NULL')));
        END IF;
    END IF;
    
    -- Return success if no errors
    IF array_length(results, 1) IS NULL THEN
        results := array_append(results,
            format('Column %s.%s.%s has all expected properties', 
                schema_name, table_name, column_name));
    END IF;
    
    RETURN results;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CONSTRAINT TESTING HELPERS
-- =============================================================================

-- Check foreign key constraint exists
CREATE OR REPLACE FUNCTION test_schema.has_fk_constraint(
    schema_name TEXT,
    table_name TEXT,
    column_name TEXT,
    ref_schema TEXT,
    ref_table TEXT,
    ref_column TEXT DEFAULT 'id'
)
RETURNS TEXT AS $$
DECLARE
    constraint_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO constraint_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
        AND tc.table_schema = ccu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = schema_name
    AND tc.table_name = table_name
    AND kcu.column_name = column_name
    AND ccu.table_schema = ref_schema
    AND ccu.table_name = ref_table
    AND ccu.column_name = ref_column;
    
    IF constraint_count > 0 THEN
        RETURN format('Foreign key constraint exists: %s.%s.%s -> %s.%s.%s',
            schema_name, table_name, column_name, ref_schema, ref_table, ref_column);
    ELSE
        RETURN format('Foreign key constraint missing: %s.%s.%s -> %s.%s.%s',
            schema_name, table_name, column_name, ref_schema, ref_table, ref_column);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Check unique constraint exists
CREATE OR REPLACE FUNCTION test_schema.has_unique_constraint(
    schema_name TEXT,
    table_name TEXT,
    column_names TEXT[]
)
RETURNS TEXT AS $$
DECLARE
    constraint_count INTEGER;
    columns_text TEXT;
BEGIN
    columns_text := array_to_string(column_names, ', ');
    
    SELECT COUNT(*)
    INTO constraint_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'UNIQUE'
    AND tc.table_schema = schema_name
    AND tc.table_name = table_name
    AND kcu.column_name = ANY(column_names)
    GROUP BY tc.constraint_name
    HAVING COUNT(kcu.column_name) = array_length(column_names, 1);
    
    IF constraint_count > 0 THEN
        RETURN format('Unique constraint exists on %s.%s(%s)',
            schema_name, table_name, columns_text);
    ELSE
        RETURN format('Unique constraint missing on %s.%s(%s)',
            schema_name, table_name, columns_text);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Check check constraint exists
CREATE OR REPLACE FUNCTION test_schema.has_check_constraint(
    schema_name TEXT,
    table_name TEXT,
    constraint_name TEXT,
    expected_definition TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    actual_definition TEXT;
BEGIN
    SELECT check_clause
    INTO actual_definition
    FROM information_schema.check_constraints cc
    JOIN information_schema.table_constraints tc
        ON cc.constraint_name = tc.constraint_name
        AND cc.constraint_schema = tc.table_schema
    WHERE tc.table_schema = schema_name
    AND tc.table_name = table_name
    AND tc.constraint_name = constraint_name;
    
    IF actual_definition IS NULL THEN
        RETURN format('Check constraint %s does not exist on %s.%s',
            constraint_name, schema_name, table_name);
    END IF;
    
    IF expected_definition IS NOT NULL AND actual_definition != expected_definition THEN
        RETURN format('Check constraint %s definition mismatch. Expected: %s, Got: %s',
            constraint_name, expected_definition, actual_definition);
    END IF;
    
    RETURN format('Check constraint %s exists on %s.%s',
        constraint_name, schema_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- DATA VALIDATION HELPERS
-- =============================================================================

-- Check record exists with specific values
CREATE OR REPLACE FUNCTION test_schema.record_exists(
    table_name TEXT,
    where_conditions JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    sql_query TEXT;
    record_count INTEGER;
    condition_key TEXT;
    condition_value TEXT;
    where_clause TEXT := '';
BEGIN
    -- Build WHERE clause from JSONB conditions
    FOR condition_key, condition_value IN
        SELECT * FROM jsonb_each_text(where_conditions)
    LOOP
        IF where_clause != '' THEN
            where_clause := where_clause || ' AND ';
        END IF;
        where_clause := where_clause || format('%I = %L', condition_key, condition_value);
    END LOOP;
    
    -- Execute count query
    sql_query := format('SELECT COUNT(*) FROM %I WHERE %s', table_name, where_clause);
    EXECUTE sql_query INTO record_count;
    
    RETURN record_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Validate email format using database constraint
CREATE OR REPLACE FUNCTION test_schema.is_valid_email(email_address TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email_address ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PERFORMANCE TESTING HELPERS
-- =============================================================================

-- Measure query execution time
CREATE OR REPLACE FUNCTION test_schema.measure_query_time(
    sql_query TEXT,
    iterations INTEGER DEFAULT 1
)
RETURNS INTERVAL AS $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    i INTEGER;
BEGIN
    start_time := clock_timestamp();
    
    FOR i IN 1..iterations LOOP
        EXECUTE sql_query;
    END LOOP;
    
    end_time := clock_timestamp();
    
    RETURN (end_time - start_time) / iterations;
END;
$$ LANGUAGE plpgsql;

-- Check index usage for a query
CREATE OR REPLACE FUNCTION test_schema.check_index_usage(
    sql_query TEXT,
    expected_index_name TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    explain_output TEXT;
    uses_index BOOLEAN := FALSE;
BEGIN
    -- Get execution plan
    EXECUTE 'EXPLAIN (FORMAT TEXT) ' || sql_query INTO explain_output;
    
    -- Check if any index is used
    IF explain_output ~* 'Index' THEN
        uses_index := TRUE;
        
        -- Check specific index if provided
        IF expected_index_name IS NOT NULL THEN
            IF explain_output ~* expected_index_name THEN
                RETURN format('Query uses expected index: %s', expected_index_name);
            ELSE
                RETURN format('Query uses index but not the expected one: %s', expected_index_name);
            END IF;
        ELSE
            RETURN 'Query uses index scan';
        END IF;
    END IF;
    
    IF NOT uses_index THEN
        RETURN 'Query does not use any index (sequential scan)';
    END IF;
    
    RETURN 'Index usage analysis completed';
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TEST DATA COMPARISON HELPERS
-- =============================================================================

-- Compare JSONB fields for equality
CREATE OR REPLACE FUNCTION test_schema.jsonb_equals(
    actual JSONB,
    expected JSONB,
    field_name TEXT DEFAULT 'JSONB field'
)
RETURNS TEXT AS $$
BEGIN
    IF actual = expected THEN
        RETURN format('%s matches expected value', field_name);
    ELSE
        RETURN format('%s mismatch. Expected: %s, Got: %s',
            field_name, expected::TEXT, actual::TEXT);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Compare arrays for equality (order-independent)
CREATE OR REPLACE FUNCTION test_schema.arrays_equal_unordered(
    actual ANYARRAY,
    expected ANYARRAY,
    field_name TEXT DEFAULT 'Array field'
)
RETURNS TEXT AS $$
BEGIN
    IF array_length(actual, 1) != array_length(expected, 1) THEN
        RETURN format('%s length mismatch. Expected: %s, Got: %s',
            field_name, array_length(expected, 1), array_length(actual, 1));
    END IF;
    
    -- Check if all elements in actual are in expected
    IF NOT (SELECT bool_and(elem = ANY(expected)) FROM unnest(actual) AS elem) THEN
        RETURN format('%s content mismatch. Expected: %s, Got: %s',
            field_name, expected::TEXT, actual::TEXT);
    END IF;
    
    RETURN format('%s matches expected values (unordered)', field_name);
END;
$$ LANGUAGE plpgsql;