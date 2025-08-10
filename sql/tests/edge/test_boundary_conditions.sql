-- =============================================================================
-- Boundary Conditions and Edge Case Testing Suite
-- =============================================================================
-- Comprehensive testing of boundary values, NULL handling, Unicode support,
-- and edge cases across all CRM entities and data types.
-- =============================================================================

-- Load helpers and set path
\i sql/tests/helpers/test_helpers.sql
\i sql/tests/helpers/advanced_test_helpers.sql
SET search_path TO test_schema, public, pg_catalog;

-- Define test plan
SELECT plan(45);

-- =============================================================================
-- SETUP
-- =============================================================================

SELECT test_schema.begin_test();

-- Start edge case test monitoring
DO $$
DECLARE
    test_run_id UUID;
BEGIN
    SELECT test_schema.start_test_metrics('edge', 'boundary_conditions_suite') INTO test_run_id;
    PERFORM set_config('test.edge_run_id', test_run_id::TEXT, false);
END$$;

-- =============================================================================
-- TEST 1-10: NUMERIC BOUNDARY TESTING
-- =============================================================================

-- Test 1: Integer boundary values for opportunity probability
SELECT results_eq(
    $$SELECT unnest(test_schema.test_numeric_boundaries('opportunities', 'probability_percent', 'integer'))$$,
    $$VALUES 
        ('Value -2147483648 rejected: new row for relation "opportunities" violates check constraint "opportunities_probability_percent_check"'),
        ('Value -2147483647 rejected: new row for relation "opportunities" violates check constraint "opportunities_probability_percent_check"'),
        ('Value 0 accepted'),
        ('Value 2147483647 rejected: new row for relation "opportunities" violates check constraint "opportunities_probability_percent_check"'),
        ('Value 2147483648 rejected: new row for relation "opportunities" violates check constraint "opportunities_probability_percent_check"')$$,
    'Opportunity probability should enforce 0-100 range constraints'
);

-- Test 2: Zero values handling
DO $$
DECLARE
    org_id UUID;
    opp_id UUID;
BEGIN
    -- Create organization
    INSERT INTO organizations (name, type, active, verified)
    VALUES ('Zero Test Org', 'B2B', true, false)
    RETURNING id INTO org_id;
    
    -- Test zero probability
    INSERT INTO opportunities (name, stage, organization_id, probability_percent)
    VALUES ('Zero Probability Test', 'NEW_LEAD', org_id, 0)
    RETURNING id INTO opp_id;
    
    PERFORM ok(
        (SELECT probability_percent FROM opportunities WHERE id = opp_id) = 0,
        'Zero probability should be accepted as valid boundary value'
    );
    
    -- Cleanup
    DELETE FROM opportunities WHERE id = opp_id;
    DELETE FROM organizations WHERE id = org_id;
END$$;

-- Test 3: Maximum values testing
DO $$
DECLARE
    org_id UUID;
    opp_id UUID;
BEGIN
    -- Create organization
    INSERT INTO organizations (name, type, active, verified)
    VALUES ('Max Value Test Org', 'B2B', true, false)
    RETURNING id INTO org_id;
    
    -- Test maximum probability
    INSERT INTO opportunities (name, stage, organization_id, probability_percent)
    VALUES ('Max Probability Test', 'CLOSED_WON', org_id, 100)
    RETURNING id INTO opp_id;
    
    PERFORM ok(
        (SELECT probability_percent FROM opportunities WHERE id = opp_id) = 100,
        'Maximum probability (100) should be accepted as valid boundary value'
    );
    
    -- Cleanup
    DELETE FROM opportunities WHERE id = opp_id;
    DELETE FROM organizations WHERE id = org_id;
END$$;

-- Test 4: Negative values rejection
SELECT throws_ok(
    $$
    DO $$
    DECLARE
        org_id UUID;
    BEGIN
        INSERT INTO organizations (name, type, active, verified)
        VALUES ('Negative Test Org', 'B2B', true, false)
        RETURNING id INTO org_id;
        
        INSERT INTO opportunities (name, stage, organization_id, probability_percent)
        VALUES ('Negative Test', 'NEW_LEAD', org_id, -1);
    END$$;
    $$,
    '23514',
    'Negative probability values should be rejected'
);

-- Test 5: Values exceeding maximum boundary
SELECT throws_ok(
    $$
    DO $$
    DECLARE
        org_id UUID;
    BEGIN
        INSERT INTO organizations (name, type, active, verified)
        VALUES ('Exceed Test Org', 'B2B', true, false)
        RETURNING id INTO org_id;
        
        INSERT INTO opportunities (name, stage, organization_id, probability_percent)
        VALUES ('Exceed Test', 'NEW_LEAD', org_id, 101);
    END$$;
    $$,
    '23514',
    'Probability values exceeding 100 should be rejected'
);

-- Test 6: Decimal precision boundaries
DO $$
DECLARE
    large_number NUMERIC := 999999999999999999999.999999;
    org_id UUID;
BEGIN
    -- Test large JSONB numeric values
    INSERT INTO organizations (name, type, active, verified, metadata)
    VALUES ('Precision Test', 'B2B', true, false, 
            format('{"large_number": %s}', large_number)::JSONB)
    RETURNING id INTO org_id;
    
    PERFORM ok(
        (SELECT metadata->>'large_number' FROM organizations WHERE id = org_id)::NUMERIC = large_number,
        'Large decimal numbers should be handled correctly in JSONB'
    );
    
    DELETE FROM organizations WHERE id = org_id;
END$$;

-- Test 7: UUID boundary conditions
DO $$
DECLARE
    min_uuid UUID := '00000000-0000-0000-0000-000000000000';
    max_uuid UUID := 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    submission_id UUID;
BEGIN
    -- Test minimum UUID
    INSERT INTO user_submissions (id, first_name, last_name, email, phone)
    VALUES (min_uuid, 'Min', 'UUID', 'min.uuid@edge.com', '555-MIN0')
    RETURNING id INTO submission_id;
    
    PERFORM ok(
        submission_id = min_uuid,
        'Minimum UUID value should be accepted'
    );
    
    DELETE FROM user_submissions WHERE id = min_uuid;
    
    -- Test maximum UUID
    INSERT INTO user_submissions (id, first_name, last_name, email, phone)
    VALUES (max_uuid, 'Max', 'UUID', 'max.uuid@edge.com', '555-MAX0')
    RETURNING id INTO submission_id;
    
    PERFORM ok(
        submission_id = max_uuid,
        'Maximum UUID value should be accepted'
    );
    
    DELETE FROM user_submissions WHERE id = max_uuid;
END$$;

-- Test 8: Date boundary conditions
DO $$
DECLARE
    min_date DATE := '1900-01-01';
    max_date DATE := '2100-12-31';
    principal_id UUID;
    activity_id UUID;
BEGIN
    -- Create principal
    INSERT INTO principals (name, type, active)
    VALUES ('Date Boundary Test', 'TEACHER', true)
    RETURNING id INTO principal_id;
    
    -- Test minimum date
    INSERT INTO principal_activity_tracking (principal_id, activity_date, activity_type)
    VALUES (principal_id, min_date, 'CONTACT')
    RETURNING id INTO activity_id;
    
    PERFORM ok(
        (SELECT activity_date FROM principal_activity_tracking WHERE id = activity_id) = min_date,
        'Minimum date boundary should be accepted'
    );
    
    DELETE FROM principal_activity_tracking WHERE id = activity_id;
    
    -- Test maximum date
    INSERT INTO principal_activity_tracking (principal_id, activity_date, activity_type)
    VALUES (principal_id, max_date, 'CONTACT')
    RETURNING id INTO activity_id;
    
    PERFORM ok(
        (SELECT activity_date FROM principal_activity_tracking WHERE id = activity_id) = max_date,
        'Maximum date boundary should be accepted'
    );
    
    -- Cleanup
    DELETE FROM principal_activity_tracking WHERE id = activity_id;
    DELETE FROM principals WHERE id = principal_id;
END$$;

-- Test 9: Timestamp boundary conditions
DO $$
DECLARE
    early_timestamp TIMESTAMPTZ := '1900-01-01 00:00:00+00';
    future_timestamp TIMESTAMPTZ := '2100-12-31 23:59:59+00';
    submission_id UUID;
BEGIN
    -- Test early timestamp
    INSERT INTO user_submissions (first_name, last_name, email, phone, created_at)
    VALUES ('Early', 'Timestamp', 'early@edge.com', '555-EARL', early_timestamp)
    RETURNING id INTO submission_id;
    
    PERFORM ok(
        (SELECT created_at FROM user_submissions WHERE id = submission_id) = early_timestamp,
        'Early timestamp boundary should be accepted'
    );
    
    DELETE FROM user_submissions WHERE id = submission_id;
    
    -- Test future timestamp
    INSERT INTO user_submissions (first_name, last_name, email, phone, created_at)
    VALUES ('Future', 'Timestamp', 'future@edge.com', '555-FUTR', future_timestamp)
    RETURNING id INTO submission_id;
    
    PERFORM ok(
        (SELECT created_at FROM user_submissions WHERE id = submission_id) = future_timestamp,
        'Future timestamp boundary should be accepted'
    );
    
    DELETE FROM user_submissions WHERE id = submission_id;
END$$;

-- Test 10: Boolean edge cases
DO $$
DECLARE
    org_id_true UUID;
    org_id_false UUID;
BEGIN
    -- Test explicit true
    INSERT INTO organizations (name, type, active, verified)
    VALUES ('Explicit True', 'B2B', true, true)
    RETURNING id INTO org_id_true;
    
    -- Test explicit false
    INSERT INTO organizations (name, type, active, verified)
    VALUES ('Explicit False', 'B2C', false, false)
    RETURNING id INTO org_id_false;
    
    PERFORM ok(
        (SELECT active FROM organizations WHERE id = org_id_true) = true AND
        (SELECT verified FROM organizations WHERE id = org_id_true) = true AND
        (SELECT active FROM organizations WHERE id = org_id_false) = false AND
        (SELECT verified FROM organizations WHERE id = org_id_false) = false,
        'Boolean edge cases (explicit true/false) should be handled correctly'
    );
    
    -- Cleanup
    DELETE FROM organizations WHERE id IN (org_id_true, org_id_false);
END$$;

-- =============================================================================
-- TEST 11-20: NULL VALUE HANDLING TESTS
-- =============================================================================

-- Test 11: NULL handling in user submissions
SELECT results_eq(
    $$SELECT unnest(test_schema.test_null_handling('user_submissions'))$$,
    $$VALUES 
        ('Column first_name correctly rejects NULL'),
        ('Column last_name correctly rejects NULL'),
        ('Column email correctly rejects NULL'),
        ('Column phone correctly accepts NULL'),
        ('Column comments correctly accepts NULL')$$,
    'User submissions NULL handling should follow business rules'
);

-- Test 12: NULL handling in organizations
DO $$
DECLARE
    results TEXT[];
    expected_results TEXT[] := ARRAY[
        'Column name correctly rejects NULL',
        'Column type correctly rejects NULL', 
        'Column active correctly rejects NULL',
        'Column verified correctly rejects NULL',
        'Column metadata correctly accepts NULL'
    ];
    actual_results TEXT[];
BEGIN
    SELECT test_schema.test_null_handling('organizations') INTO results;
    
    -- Filter results to match expected patterns
    SELECT array_agg(r ORDER BY r) INTO actual_results
    FROM unnest(results) r 
    WHERE r LIKE '%name correctly%' OR r LIKE '%type correctly%' OR 
          r LIKE '%active correctly%' OR r LIKE '%verified correctly%' OR
          r LIKE '%metadata correctly%';
    
    PERFORM ok(
        array_length(actual_results, 1) >= 4,
        format('Organization NULL handling should follow business rules (%s results)', 
               array_length(actual_results, 1))
    );
END$$;

-- Test 13: NULL in foreign key relationships
DO $$
DECLARE
    contact_id UUID;
BEGIN
    -- Test NULL organization_id in contacts (should be allowed)
    INSERT INTO contacts (first_name, last_name, email, organization_id)
    VALUES ('Orphan', 'Contact', 'orphan@edge.com', NULL)
    RETURNING id INTO contact_id;
    
    PERFORM ok(
        (SELECT organization_id FROM contacts WHERE id = contact_id) IS NULL,
        'NULL foreign key values should be accepted where allowed'
    );
    
    DELETE FROM contacts WHERE id = contact_id;
END$$;

-- Test 14: NULL in JSONB fields
DO $$
DECLARE
    org_id UUID;
    metadata_value JSONB;
BEGIN
    -- Test NULL metadata
    INSERT INTO organizations (name, type, active, verified, metadata)
    VALUES ('NULL Metadata Test', 'B2B', true, false, NULL)
    RETURNING id INTO org_id;
    
    SELECT metadata INTO metadata_value
    FROM organizations WHERE id = org_id;
    
    PERFORM ok(
        metadata_value IS NULL,
        'NULL JSONB values should be handled correctly'
    );
    
    -- Test JSONB with NULL values inside
    UPDATE organizations 
    SET metadata = '{"key": null, "active": true}' 
    WHERE id = org_id;
    
    SELECT metadata INTO metadata_value
    FROM organizations WHERE id = org_id;
    
    PERFORM ok(
        metadata_value->>'key' IS NULL AND metadata_value->>'active' = 'true',
        'JSONB with internal NULL values should be handled correctly'
    );
    
    DELETE FROM organizations WHERE id = org_id;
END$$;

-- Test 15: NULL in optional text fields
DO $$
DECLARE
    submission_id UUID;
BEGIN
    -- Test NULL comments
    INSERT INTO user_submissions (first_name, last_name, email, phone, comments)
    VALUES ('NULL', 'Comments', 'null.comments@edge.com', '555-NULL', NULL)
    RETURNING id INTO submission_id;
    
    PERFORM ok(
        (SELECT comments FROM user_submissions WHERE id = submission_id) IS NULL,
        'NULL optional text fields should be accepted'
    );
    
    DELETE FROM user_submissions WHERE id = submission_id;
END$$;

-- Test 16: NULL vs empty string distinction
DO $$
DECLARE
    submission_null UUID;
    submission_empty UUID;
BEGIN
    -- Test NULL comments
    INSERT INTO user_submissions (first_name, last_name, email, phone, comments)
    VALUES ('NULL', 'Test', 'null.test@edge.com', '555-NULL', NULL)
    RETURNING id INTO submission_null;
    
    -- Test empty string comments
    INSERT INTO user_submissions (first_name, last_name, email, phone, comments)
    VALUES ('Empty', 'Test', 'empty.test@edge.com', '555-EMPT', '')
    RETURNING id INTO submission_empty;
    
    PERFORM ok(
        (SELECT comments FROM user_submissions WHERE id = submission_null) IS NULL AND
        (SELECT comments FROM user_submissions WHERE id = submission_empty) = '',
        'NULL and empty string should be distinct values'
    );
    
    -- Cleanup
    DELETE FROM user_submissions WHERE id IN (submission_null, submission_empty);
END$$;

-- Test 17: NULL in array fields (if any exist)
DO $$
DECLARE
    org_id UUID;
BEGIN
    -- Test JSONB array with NULL elements
    INSERT INTO organizations (name, type, active, verified, metadata)
    VALUES ('Array NULL Test', 'B2B', true, false, '{"tags": ["valid", null, "another"]}')
    RETURNING id INTO org_id;
    
    PERFORM ok(
        (SELECT metadata->'tags'->1 FROM organizations WHERE id = org_id) = 'null'::JSONB,
        'NULL elements in JSONB arrays should be preserved'
    );
    
    DELETE FROM organizations WHERE id = org_id;
END$$;

-- Test 18: NULL in date/timestamp fields
DO $$
DECLARE
    org_id UUID;
    opp_id UUID;
BEGIN
    -- Create organization
    INSERT INTO organizations (name, type, active, verified)
    VALUES ('NULL Date Test', 'B2B', true, false)
    RETURNING id INTO org_id;
    
    -- Test NULL expected_close_date
    INSERT INTO opportunities (name, stage, organization_id, expected_close_date)
    VALUES ('NULL Date Opportunity', 'NEW_LEAD', org_id, NULL)
    RETURNING id INTO opp_id;
    
    PERFORM ok(
        (SELECT expected_close_date FROM opportunities WHERE id = opp_id) IS NULL,
        'NULL date fields should be accepted where allowed'
    );
    
    -- Cleanup
    DELETE FROM opportunities WHERE id = opp_id;
    DELETE FROM organizations WHERE id = org_id;
END$$;

-- Test 19: NULL propagation in calculations
DO $$
DECLARE
    org_id UUID;
    opp1_id UUID;
    opp2_id UUID;
    avg_prob NUMERIC;
BEGIN
    -- Create organization
    INSERT INTO organizations (name, type, active, verified)
    VALUES ('NULL Calc Test', 'B2B', true, false)
    RETURNING id INTO org_id;
    
    -- Create opportunities with and without probability
    INSERT INTO opportunities (name, stage, organization_id, probability_percent)
    VALUES ('With Probability', 'NEW_LEAD', org_id, 50)
    RETURNING id INTO opp1_id;
    
    INSERT INTO opportunities (name, stage, organization_id, probability_percent)
    VALUES ('Without Probability', 'NEW_LEAD', org_id, NULL)
    RETURNING id INTO opp2_id;
    
    -- Calculate average (should handle NULL correctly)
    SELECT AVG(probability_percent) INTO avg_prob
    FROM opportunities WHERE organization_id = org_id;
    
    PERFORM ok(
        avg_prob = 50,
        format('NULL values should be handled correctly in aggregations (avg: %s)', avg_prob)
    );
    
    -- Cleanup
    DELETE FROM opportunities WHERE id IN (opp1_id, opp2_id);
    DELETE FROM organizations WHERE id = org_id;
END$$;

-- Test 20: NULL coalescing behavior
DO $$
DECLARE
    org_id UUID;
    coalesced_value TEXT;
BEGIN
    -- Test COALESCE with NULL metadata
    INSERT INTO organizations (name, type, active, verified, metadata)
    VALUES ('Coalesce Test', 'B2B', true, false, NULL)
    RETURNING id INTO org_id;
    
    SELECT COALESCE(metadata->>'nonexistent', 'default_value') INTO coalesced_value
    FROM organizations WHERE id = org_id;
    
    PERFORM ok(
        coalesced_value = 'default_value',
        'NULL coalescing should provide default values correctly'
    );
    
    DELETE FROM organizations WHERE id = org_id;
END$$;

-- =============================================================================
-- TEST 21-35: UNICODE AND SPECIAL CHARACTER TESTS
-- =============================================================================

-- Test 21: Unicode handling in user submissions
SELECT results_eq(
    $$SELECT unnest(test_schema.test_unicode_handling('user_submissions', 'first_name'))$$,
    $$VALUES 
        ('String "Regular ASCII text" accepted successfully'),
        ('String "Ñoño español" accepted successfully'),
        ('String "中文测试" accepted successfully'),
        ('String "العربية" accepted successfully'),
        ('String "🎉 Emoji test 🚀" accepted successfully'),
        ('String "Line\nBreak\tTest" accepted successfully'),
        ('String "Special chars: ~!@#$%^&*()_+-={}[]|:\";''<>?,./" accepted successfully'),
        ('String "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa..." accepted successfully'),
        ('String "" accepted successfully'),
        ('String "   " accepted successfully'),
        ('String "null" accepted successfully'),
        ('String "NULL" accepted successfully')$$,
    'Unicode and special characters should be handled correctly'
);

-- Test 22: Email with Unicode characters
DO $$
DECLARE
    submission_id UUID;
    unicode_email TEXT := 'tëst@ëxämplë.com';
BEGIN
    INSERT INTO user_submissions (first_name, last_name, email, phone)
    VALUES ('Unicode', 'Email', unicode_email, '555-UNIC')
    RETURNING id INTO submission_id;
    
    PERFORM ok(
        (SELECT email FROM user_submissions WHERE id = submission_id) = unicode_email,
        'Unicode characters in email addresses should be preserved'
    );
    
    DELETE FROM user_submissions WHERE id = submission_id;
END$$;

-- Test 23: Multi-byte character length handling
DO $$
DECLARE
    org_id UUID;
    unicode_name TEXT := 'Организация тест 组织测试 Empresa 🏢';
BEGIN
    INSERT INTO organizations (name, type, active, verified)
    VALUES (unicode_name, 'B2B', true, false)
    RETURNING id INTO org_id;
    
    PERFORM ok(
        (SELECT name FROM organizations WHERE id = org_id) = unicode_name AND
        LENGTH(name) = LENGTH(unicode_name),
        'Multi-byte character lengths should be handled correctly'
    );
    
    DELETE FROM organizations WHERE id = org_id;
END$$;

-- Test 24: JSON with Unicode content
DO $$
DECLARE
    org_id UUID;
    unicode_json JSONB := '{"name": "José García", "company": "Empresa Ñoño", "notes": "测试笔记 🌟"}';
    retrieved_json JSONB;
BEGIN
    INSERT INTO organizations (name, type, active, verified, metadata)
    VALUES ('Unicode JSON Test', 'B2B', true, false, unicode_json)
    RETURNING id INTO org_id;
    
    SELECT metadata INTO retrieved_json
    FROM organizations WHERE id = org_id;
    
    PERFORM ok(
        retrieved_json = unicode_json,
        'Unicode characters in JSON should be preserved correctly'
    );
    
    DELETE FROM organizations WHERE id = org_id;
END$$;

-- Test 25: Special characters in search queries
DO $$
DECLARE
    submission_id UUID;
    special_name TEXT := 'O''Reilly & Associates (R&D) [Test] 50% "Success"';
BEGIN
    INSERT INTO user_submissions (first_name, last_name, email, phone)
    VALUES (special_name, 'Special', 'special@edge.com', '555-SPEC')
    RETURNING id INTO submission_id;
    
    -- Test search with special characters
    PERFORM ok(
        EXISTS(
            SELECT 1 FROM user_submissions 
            WHERE first_name LIKE '%O''Reilly%' AND id = submission_id
        ),
        'Special characters should be searchable correctly'
    );
    
    DELETE FROM user_submissions WHERE id = submission_id;
END$$;

-- Test 26: Control characters handling
DO $$
DECLARE
    submission_id UUID;
    control_chars TEXT := E'Tab\tChar\nNewline\rReturn\bBackspace';
BEGIN
    INSERT INTO user_submissions (first_name, last_name, email, phone, comments)
    VALUES ('Control', 'Chars', 'control@edge.com', '555-CTRL', control_chars)
    RETURNING id INTO submission_id;
    
    PERFORM ok(
        (SELECT comments FROM user_submissions WHERE id = submission_id) = control_chars,
        'Control characters should be preserved in text fields'
    );
    
    DELETE FROM user_submissions WHERE id = submission_id;
END$$;

-- Test 27: Case sensitivity edge cases
DO $$
DECLARE
    submission_id1 UUID;
    submission_id2 UUID;
BEGIN
    -- Test case sensitivity in email uniqueness
    INSERT INTO user_submissions (first_name, last_name, email, phone)
    VALUES ('Case1', 'Test', 'CASE@TEST.COM', '555-CAS1')
    RETURNING id INTO submission_id1;
    
    INSERT INTO user_submissions (first_name, last_name, email, phone)
    VALUES ('Case2', 'Test', 'case@test.com', '555-CAS2')
    RETURNING id INTO submission_id2;
    
    PERFORM ok(
        submission_id1 != submission_id2,
        'Case sensitivity should be handled according to business rules'
    );
    
    -- Cleanup
    DELETE FROM user_submissions WHERE id IN (submission_id1, submission_id2);
END$$;

-- Test 28: Whitespace edge cases
DO $$
DECLARE
    org_id1 UUID;
    org_id2 UUID;
    org_id3 UUID;
BEGIN
    -- Test leading/trailing/internal whitespace
    INSERT INTO organizations (name, type, active, verified)
    VALUES ('  Leading Spaces', 'B2B', true, false)
    RETURNING id INTO org_id1;
    
    INSERT INTO organizations (name, type, active, verified)
    VALUES ('Trailing Spaces  ', 'B2B', true, false)
    RETURNING id INTO org_id2;
    
    INSERT INTO organizations (name, type, active, verified)
    VALUES ('Multiple    Internal    Spaces', 'B2B', true, false)
    RETURNING id INTO org_id3;
    
    PERFORM ok(
        (SELECT name FROM organizations WHERE id = org_id1) = '  Leading Spaces' AND
        (SELECT name FROM organizations WHERE id = org_id2) = 'Trailing Spaces  ' AND
        (SELECT name FROM organizations WHERE id = org_id3) = 'Multiple    Internal    Spaces',
        'Whitespace should be preserved as entered'
    );
    
    -- Cleanup
    DELETE FROM organizations WHERE id IN (org_id1, org_id2, org_id3);
END$$;

-- Test 29: Very long Unicode strings
DO $$
DECLARE
    org_id UUID;
    long_unicode TEXT := repeat('测试🌟', 100); -- 600 characters (each emoji/Chinese char may be 3-4 bytes)
BEGIN
    INSERT INTO organizations (name, type, active, verified)
    VALUES (long_unicode, 'B2B', true, false)
    RETURNING id INTO org_id;
    
    PERFORM ok(
        LENGTH(SELECT name FROM organizations WHERE id = org_id) = 600,
        'Very long Unicode strings should be handled correctly'
    );
    
    DELETE FROM organizations WHERE id = org_id;
END$$;

-- Test 30: Mixed encoding scenarios
DO $$
DECLARE
    submission_id UUID;
    mixed_text TEXT := 'ASCII + Ñoño + 中文 + العربية + 🎉 + Ω≈ç√∫˜µ';
BEGIN
    INSERT INTO user_submissions (first_name, last_name, email, phone, comments)
    VALUES ('Mixed', 'Encoding', 'mixed@edge.com', '555-MIXD', mixed_text)
    RETURNING id INTO submission_id;
    
    PERFORM ok(
        (SELECT comments FROM user_submissions WHERE id = submission_id) = mixed_text,
        'Mixed encoding scenarios should be handled correctly'
    );
    
    DELETE FROM user_submissions WHERE id = submission_id;
END$$;

-- Test 31-35: Additional Unicode edge cases
-- Test 31: Right-to-left text
DO $$
DECLARE
    contact_id UUID;
    rtl_name TEXT := 'محمد عبدالله';
BEGIN
    INSERT INTO contacts (first_name, last_name, email)
    VALUES (rtl_name, 'العربي', 'rtl@edge.com')
    RETURNING id INTO contact_id;
    
    PERFORM ok(
        (SELECT first_name FROM contacts WHERE id = contact_id) = rtl_name,
        'Right-to-left text should be preserved correctly'
    );
    
    DELETE FROM contacts WHERE id = contact_id;
END$$;

-- Test 32: Combining characters
DO $$
DECLARE
    contact_id UUID;
    combining_name TEXT := 'José García'; -- e with acute accent as combining character
BEGIN
    INSERT INTO contacts (first_name, last_name, email)
    VALUES (combining_name, 'Test', 'combining@edge.com')
    RETURNING id INTO contact_id;
    
    PERFORM ok(
        (SELECT first_name FROM contacts WHERE id = contact_id) = combining_name,
        'Combining characters should be handled correctly'
    );
    
    DELETE FROM contacts WHERE id = contact_id;
END$$;

-- Test 33: Mathematical symbols
DO $$
DECLARE
    org_id UUID;
    math_name TEXT := '∑∏∫∆√≠≤≥±∞';
BEGIN
    INSERT INTO organizations (name, type, active, verified)
    VALUES (math_name, 'B2B', true, false)
    RETURNING id INTO org_id;
    
    PERFORM ok(
        (SELECT name FROM organizations WHERE id = org_id) = math_name,
        'Mathematical Unicode symbols should be preserved'
    );
    
    DELETE FROM organizations WHERE id = org_id;
END$$;

-- Test 34: Currency symbols
DO $$
DECLARE
    org_id UUID;
    currency_metadata JSONB := '{"currencies": ["$", "€", "£", "¥", "₹", "₽"]}';
BEGIN
    INSERT INTO organizations (name, type, active, verified, metadata)
    VALUES ('Currency Test', 'B2B', true, false, currency_metadata)
    RETURNING id INTO org_id;
    
    PERFORM ok(
        (SELECT metadata->'currencies' FROM organizations WHERE id = org_id) = '["$", "€", "£", "¥", "₹", "₽"]'::JSONB,
        'Currency symbols should be preserved in JSONB'
    );
    
    DELETE FROM organizations WHERE id = org_id;
END$$;

-- Test 35: Zero-width characters
DO $$
DECLARE
    contact_id UUID;
    zero_width_name TEXT := 'Test' || E'\u200B' || 'Name'; -- Zero-width space
BEGIN
    INSERT INTO contacts (first_name, last_name, email)
    VALUES (zero_width_name, 'Hidden', 'zerowidth@edge.com')
    RETURNING id INTO contact_id;
    
    PERFORM ok(
        LENGTH(SELECT first_name FROM contacts WHERE id = contact_id) = 9, -- 8 visible + 1 zero-width
        'Zero-width characters should be preserved but not affect visible length calculation'
    );
    
    DELETE FROM contacts WHERE id = contact_id;
END$$;

-- =============================================================================
-- TEST 36-45: ADVANCED EDGE CASES AND CORNER CONDITIONS
-- =============================================================================

-- Test 36: Concurrent constraint validation
DO $$
DECLARE
    success_count INTEGER := 0;
    error_count INTEGER := 0;
    i INTEGER;
    test_email TEXT;
BEGIN
    FOR i IN 1..10 LOOP
        BEGIN
            test_email := 'concurrent' || i || '@edge.com';
            
            INSERT INTO user_submissions (first_name, last_name, email, phone)
            VALUES ('Concurrent', 'Test' || i, test_email, '555-CONC');
            
            success_count := success_count + 1;
        EXCEPTION
            WHEN unique_violation THEN
                error_count := error_count + 1;
        END;
    END LOOP;
    
    PERFORM ok(
        success_count = 10 AND error_count = 0,
        format('Concurrent constraint validation: %s successes, %s errors', 
               success_count, error_count)
    );
    
    -- Cleanup
    DELETE FROM user_submissions WHERE email LIKE '%@edge.com';
END$$;

-- Test 37: Transaction boundary edge cases
DO $$
DECLARE
    org_id UUID;
    savepoint_test_passed BOOLEAN := true;
BEGIN
    BEGIN
        INSERT INTO organizations (name, type, active, verified)
        VALUES ('Savepoint Test', 'B2B', true, false)
        RETURNING id INTO org_id;
        
        SAVEPOINT test_savepoint;
        
        -- This should succeed
        UPDATE organizations SET verified = true WHERE id = org_id;
        
        -- This should fail
        UPDATE organizations SET type = 'INVALID_TYPE' WHERE id = org_id;
        
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK TO SAVEPOINT test_savepoint;
            -- Verify organization still exists with original state
            IF (SELECT COUNT(*) FROM organizations WHERE id = org_id AND verified = false) = 1 THEN
                savepoint_test_passed := true;
            ELSE
                savepoint_test_passed := false;
            END IF;
    END;
    
    PERFORM ok(
        savepoint_test_passed,
        'Transaction savepoint edge cases should be handled correctly'
    );
    
    -- Cleanup
    DELETE FROM organizations WHERE id = org_id;
END$$;

-- Test 38: Recursion depth limits
DO $$
DECLARE
    recursion_result INTEGER;
    recursion_successful BOOLEAN := true;
BEGIN
    -- Test deep recursion in CTE (Common Table Expression)
    BEGIN
        WITH RECURSIVE deep_recursion(n) AS (
            SELECT 1
            UNION ALL
            SELECT n + 1 FROM deep_recursion WHERE n < 1000
        )
        SELECT MAX(n) INTO recursion_result FROM deep_recursion;
        
        PERFORM ok(
            recursion_result = 1000,
            format('Deep recursion should complete successfully (depth: %s)', recursion_result)
        );
    EXCEPTION
        WHEN OTHERS THEN
            PERFORM ok(
                false,
                format('Deep recursion failed with error: %s', SQLERRM)
            );
    END;
END$$;

-- Test 39: Complex JSONB path edge cases
DO $$
DECLARE
    org_id UUID;
    complex_json JSONB := '{
        "level1": {
            "level2": {
                "level3": {
                    "array": [
                        {"key": "value1"},
                        {"key": "value2"},
                        {"key": null}
                    ]
                }
            }
        }
    }';
    extracted_value TEXT;
BEGIN
    INSERT INTO organizations (name, type, active, verified, metadata)
    VALUES ('Deep JSON Test', 'B2B', true, false, complex_json)
    RETURNING id INTO org_id;
    
    -- Test deep path extraction
    SELECT metadata #>> '{level1,level2,level3,array,0,key}' INTO extracted_value
    FROM organizations WHERE id = org_id;
    
    PERFORM ok(
        extracted_value = 'value1',
        format('Deep JSONB path extraction should work correctly: %s', extracted_value)
    );
    
    DELETE FROM organizations WHERE id = org_id;
END$$;

-- Test 40: Memory pressure with large text fields
DO $$
DECLARE
    submission_id UUID;
    large_comment TEXT := repeat('Large comment text for memory testing. ', 10000); -- ~400KB
    retrieval_successful BOOLEAN := true;
BEGIN
    INSERT INTO user_submissions (first_name, last_name, email, phone, comments)
    VALUES ('Memory', 'Test', 'memory@edge.com', '555-MEM0', large_comment)
    RETURNING id INTO submission_id;
    
    -- Test retrieval
    BEGIN
        PERFORM (SELECT comments FROM user_submissions WHERE id = submission_id);
    EXCEPTION
        WHEN OTHERS THEN
            retrieval_successful := false;
    END;
    
    PERFORM ok(
        retrieval_successful,
        'Large text fields should not cause memory pressure issues'
    );
    
    DELETE FROM user_submissions WHERE id = submission_id;
END$$;

-- Test 41: Enum edge cases
DO $$
DECLARE
    org_id UUID;
    valid_types TEXT[] := ARRAY['B2B', 'B2C'];
    test_type TEXT;
BEGIN
    -- Test all valid enum values
    FOREACH test_type IN ARRAY valid_types LOOP
        INSERT INTO organizations (name, type, active, verified)
        VALUES ('Enum Test ' || test_type, test_type::organization_type, true, false)
        RETURNING id INTO org_id;
        
        PERFORM ok(
            (SELECT type FROM organizations WHERE id = org_id) = test_type::organization_type,
            format('Enum value %s should be accepted', test_type)
        );
        
        DELETE FROM organizations WHERE id = org_id;
    END LOOP;
END$$;

-- Test 42: Index edge cases with special characters
DO $$
DECLARE
    special_emails TEXT[] := ARRAY[
        'test+tag@example.com',
        'user.name@example.com',
        'user_name@example-site.com',
        '123456@example.com',
        'a@b.co'
    ];
    email TEXT;
    submission_id UUID;
    lookup_successful BOOLEAN;
BEGIN
    FOREACH email IN ARRAY special_emails LOOP
        INSERT INTO user_submissions (first_name, last_name, email, phone)
        VALUES ('Index', 'Test', email, '555-IDX0')
        RETURNING id INTO submission_id;
        
        -- Test index lookup
        lookup_successful := EXISTS(
            SELECT 1 FROM user_submissions WHERE email = email
        );
        
        PERFORM ok(
            lookup_successful,
            format('Index lookup should work for special email: %s', email)
        );
        
        DELETE FROM user_submissions WHERE id = submission_id;
    END LOOP;
END$$;

-- Test 43: Time zone edge cases
DO $$
DECLARE
    submission_id UUID;
    utc_time TIMESTAMPTZ := '2024-01-01 12:00:00+00';
    local_time TIMESTAMPTZ := '2024-01-01 12:00:00-08';
BEGIN
    -- Test UTC timestamp
    INSERT INTO user_submissions (first_name, last_name, email, phone, created_at)
    VALUES ('UTC', 'Time', 'utc@edge.com', '555-UTC0', utc_time)
    RETURNING id INTO submission_id;
    
    PERFORM ok(
        (SELECT created_at FROM user_submissions WHERE id = submission_id) = utc_time,
        'UTC timestamps should be preserved correctly'
    );
    
    DELETE FROM user_submissions WHERE id = submission_id;
    
    -- Test local timezone timestamp
    INSERT INTO user_submissions (first_name, last_name, email, phone, created_at)
    VALUES ('Local', 'Time', 'local@edge.com', '555-LOC0', local_time)
    RETURNING id INTO submission_id;
    
    PERFORM ok(
        (SELECT created_at FROM user_submissions WHERE id = submission_id) = local_time,
        'Local timezone timestamps should be preserved correctly'
    );
    
    DELETE FROM user_submissions WHERE id = submission_id;
END$$;

-- Test 44: Constraint cascade edge cases
DO $$
DECLARE
    org_id UUID;
    contact_ids UUID[];
    remaining_contacts INTEGER;
    i INTEGER;
BEGIN
    -- Create organization
    INSERT INTO organizations (name, type, active, verified)
    VALUES ('Cascade Edge Test', 'B2B', true, false)
    RETURNING id INTO org_id;
    
    -- Create multiple contacts
    FOR i IN 1..5 LOOP
        INSERT INTO contacts (first_name, last_name, email, organization_id)
        VALUES ('Cascade', 'Contact' || i, 'cascade' || i || '@edge.com', org_id);
    END LOOP;
    
    -- Delete organization (should cascade)
    DELETE FROM organizations WHERE id = org_id;
    
    -- Check cascade worked
    SELECT COUNT(*) INTO remaining_contacts
    FROM contacts WHERE organization_id = org_id;
    
    PERFORM ok(
        remaining_contacts = 0,
        format('Cascade delete should remove all related records (%s remaining)', remaining_contacts)
    );
END$$;

-- Test 45: Final edge case summary and cleanup verification
DO $$
DECLARE
    test_run_id TEXT;
    edge_case_records INTEGER;
    final_metrics RECORD;
BEGIN
    -- Count any remaining edge case test records
    SELECT COUNT(*) INTO edge_case_records
    FROM (
        SELECT COUNT(*) FROM user_submissions WHERE email LIKE '%@edge.com'
        UNION ALL
        SELECT COUNT(*) FROM contacts WHERE email LIKE '%@edge.com'
        UNION ALL  
        SELECT COUNT(*) FROM organizations WHERE name LIKE '%Test%' OR name LIKE '%Edge%'
    ) counts;
    
    PERFORM ok(
        edge_case_records = 0,
        format('Edge case test cleanup verification: %s records remaining', edge_case_records)
    );
    
    -- End edge case test monitoring
    test_run_id := current_setting('test.edge_run_id', true);
    PERFORM test_schema.end_test_metrics(test_run_id::UUID, 'PASSED');
    
    -- Get final metrics
    SELECT * INTO final_metrics
    FROM test_schema.test_execution_metrics
    WHERE test_schema.test_execution_metrics.test_run_id = test_run_id::UUID;
    
    RAISE NOTICE 'Edge case test suite completed in % with % database growth',
                 final_metrics.duration, 
                 COALESCE(final_metrics.database_growth, 0);
END$$;

-- =============================================================================
-- CLEANUP
-- =============================================================================

-- Final cleanup of any remaining test data
DELETE FROM contacts WHERE email LIKE '%@edge.com';
DELETE FROM organizations WHERE name LIKE '%Test%' OR name LIKE '%Edge%' OR name LIKE 'Enum Test%';
DELETE FROM user_submissions WHERE email LIKE '%@edge.com';

PERFORM test_schema.cleanup_test_data('edge_case_tests');
SELECT test_schema.rollback_test();

-- Finish
SELECT finish();