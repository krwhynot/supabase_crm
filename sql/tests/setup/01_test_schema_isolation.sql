-- =============================================================================
-- Test Schema Isolation Setup for pgTAP Testing
-- =============================================================================
-- This file creates isolated test schemas and establishes rollback procedures
-- to ensure tests don't interfere with each other or production data.
-- =============================================================================

-- Create dedicated test schema
CREATE SCHEMA IF NOT EXISTS test_schema;

-- Create test data cleanup schema
CREATE SCHEMA IF NOT EXISTS test_cleanup;

-- Set search path for testing
SET search_path TO test_schema, public, pg_catalog;

-- Create test transaction management functions
CREATE OR REPLACE FUNCTION test_schema.begin_test()
RETURNS VOID AS $$
BEGIN
    -- Create a savepoint for test isolation
    SAVEPOINT test_savepoint;
    
    -- Log test start
    INSERT INTO test_schema.test_log (event_type, message, created_at)
    VALUES ('TEST_START', 'Test transaction started', NOW());
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION test_schema.rollback_test()
RETURNS VOID AS $$
BEGIN
    -- Rollback to savepoint to clean up test data
    ROLLBACK TO SAVEPOINT test_savepoint;
    
    -- Log test rollback
    INSERT INTO test_schema.test_log (event_type, message, created_at)
    VALUES ('TEST_ROLLBACK', 'Test transaction rolled back', NOW());
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION test_schema.commit_test()
RETURNS VOID AS $$
BEGIN
    -- Release savepoint and commit changes if needed
    RELEASE SAVEPOINT test_savepoint;
    
    -- Log test commit
    INSERT INTO test_schema.test_log (event_type, message, created_at)
    VALUES ('TEST_COMMIT', 'Test transaction committed', NOW());
END;
$$ LANGUAGE plpgsql;

-- Create test logging table
CREATE TABLE IF NOT EXISTS test_schema.test_log (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    message TEXT,
    test_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create test data factory functions
CREATE OR REPLACE FUNCTION test_schema.create_test_user_submission()
RETURNS UUID AS $$
DECLARE
    test_id UUID;
BEGIN
    INSERT INTO public.user_submissions (first_name, last_name, age, favorite_color)
    VALUES ('Test', 'User', 25, 'Blue')
    RETURNING id INTO test_id;
    
    RETURN test_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION test_schema.create_test_contact()
RETURNS UUID AS $$
DECLARE
    test_id UUID;
BEGIN
    INSERT INTO public.contacts (
        first_name, last_name, organization, email, title, phone, notes
    )
    VALUES (
        'Test', 'Contact', 'Test Organization', 
        'test' || extract(epoch from now()) || '@example.com',
        'Test Title', '555-0123', 'Test notes'
    )
    RETURNING id INTO test_id;
    
    RETURN test_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION test_schema.create_test_organization()
RETURNS UUID AS $$
DECLARE
    test_id UUID;
BEGIN
    INSERT INTO public.organizations (
        name, legal_name, description, industry, type, status,
        website, email, primary_phone, city, state_province, country,
        is_principal, is_distributor
    )
    VALUES (
        'Test Organization ' || extract(epoch from now()),
        'Test Organization Legal Name',
        'Test organization for pgTAP testing',
        'Technology',
        'B2B',
        'Prospect',
        'https://test-org.example.com',
        'contact@test-org.example.com',
        '555-0100',
        'Test City',
        'Test State',
        'United States',
        FALSE,
        FALSE
    )
    RETURNING id INTO test_id;
    
    RETURN test_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION test_schema.create_test_principal()
RETURNS UUID AS $$
DECLARE
    test_id UUID;
BEGIN
    INSERT INTO public.organizations (
        name, legal_name, description, industry, type, status,
        website, email, primary_phone, city, state_province, country,
        is_principal, is_distributor
    )
    VALUES (
        'Test Principal ' || extract(epoch from now()),
        'Test Principal Legal Name',
        'Test principal organization for pgTAP testing',
        'Food Manufacturing',
        'B2B',
        'Partner',
        'https://test-principal.example.com',
        'contact@test-principal.example.com',
        '555-0200',
        'Principal City',
        'Principal State',
        'United States',
        TRUE,
        FALSE
    )
    RETURNING id INTO test_id;
    
    RETURN test_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION test_schema.create_test_product()
RETURNS UUID AS $$
DECLARE
    test_id UUID;
BEGIN
    INSERT INTO public.products (
        name, description, category, sku, unit_size,
        unit_cost, suggested_retail_price, is_active
    )
    VALUES (
        'Test Product ' || extract(epoch from now()),
        'Test product for pgTAP testing',
        'Other',
        'TEST-' || extract(epoch from now()),
        '1 unit',
        10.00,
        15.00,
        TRUE
    )
    RETURNING id INTO test_id;
    
    RETURN test_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION test_schema.create_test_opportunity()
RETURNS UUID AS $$
DECLARE
    test_id UUID;
    org_id UUID;
    principal_id UUID;
    product_id UUID;
BEGIN
    -- Create related entities first
    SELECT test_schema.create_test_organization() INTO org_id;
    SELECT test_schema.create_test_principal() INTO principal_id;
    SELECT test_schema.create_test_product() INTO product_id;
    
    INSERT INTO public.opportunities (
        name, stage, probability_percent, expected_close_date,
        organization_id, principal_id, product_id, deal_owner,
        notes, context, is_won
    )
    VALUES (
        'Test Opportunity ' || extract(epoch from now()),
        'New Lead',
        10,
        CURRENT_DATE + INTERVAL '30 days',
        org_id,
        principal_id,
        product_id,
        'Test Deal Owner',
        'Test opportunity for pgTAP testing',
        'Custom',
        FALSE
    )
    RETURNING id INTO test_id;
    
    RETURN test_id;
END;
$$ LANGUAGE plpgsql;

-- Create cleanup function for all test data
CREATE OR REPLACE FUNCTION test_schema.cleanup_all_test_data()
RETURNS VOID AS $$
BEGIN
    -- Delete in reverse dependency order
    DELETE FROM public.opportunities WHERE name LIKE 'Test Opportunity%';
    DELETE FROM public.product_principals WHERE product_id IN (
        SELECT id FROM public.products WHERE name LIKE 'Test Product%'
    );
    DELETE FROM public.products WHERE name LIKE 'Test Product%';
    DELETE FROM public.organizations WHERE name LIKE 'Test Organization%' OR name LIKE 'Test Principal%';
    DELETE FROM public.contacts WHERE first_name = 'Test' AND last_name = 'Contact';
    DELETE FROM public.user_submissions WHERE first_name = 'Test' AND last_name = 'User';
    
    -- Clear test logs
    DELETE FROM test_schema.test_log WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Grant permissions on test schema
GRANT USAGE ON SCHEMA test_schema TO pgtap_tester;
GRANT ALL ON ALL TABLES IN SCHEMA test_schema TO pgtap_tester;
GRANT ALL ON ALL SEQUENCES IN SCHEMA test_schema TO pgtap_tester;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA test_schema TO pgtap_tester;

-- Set default privileges for test schema
ALTER DEFAULT PRIVILEGES IN SCHEMA test_schema 
    GRANT ALL ON TABLES TO pgtap_tester;
ALTER DEFAULT PRIVILEGES IN SCHEMA test_schema 
    GRANT ALL ON SEQUENCES TO pgtap_tester;
ALTER DEFAULT PRIVILEGES IN SCHEMA test_schema 
    GRANT ALL ON FUNCTIONS TO pgtap_tester;