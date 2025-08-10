-- =============================================================================
-- Test Data Registry for pgTAP Testing
-- =============================================================================
-- This file creates a registry system to track test data across test runs
-- and provides advanced cleanup and state management capabilities.
-- =============================================================================

SET search_path TO test_schema, public, pg_catalog;

-- =============================================================================
-- TEST DATA REGISTRY TABLES
-- =============================================================================

-- Registry to track test data entities
CREATE TABLE IF NOT EXISTS test_schema.test_data_registry (
    id BIGSERIAL PRIMARY KEY,
    test_name VARCHAR(255) NOT NULL,
    test_suite VARCHAR(255),
    entity_type VARCHAR(100) NOT NULL, -- 'contact', 'organization', 'opportunity', etc.
    entity_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    cleaned_up_at TIMESTAMPTZ
);

-- Test execution tracking
CREATE TABLE IF NOT EXISTS test_schema.test_execution_log (
    id BIGSERIAL PRIMARY KEY,
    test_name VARCHAR(255) NOT NULL,
    test_suite VARCHAR(255),
    status VARCHAR(50) NOT NULL, -- 'STARTED', 'PASSED', 'FAILED', 'SKIPPED'
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    duration_ms INTEGER,
    error_message TEXT,
    test_count INTEGER,
    passed_count INTEGER,
    failed_count INTEGER
);

-- Test dependencies tracking
CREATE TABLE IF NOT EXISTS test_schema.test_dependencies (
    id BIGSERIAL PRIMARY KEY,
    test_name VARCHAR(255) NOT NULL,
    depends_on_test VARCHAR(255) NOT NULL,
    dependency_type VARCHAR(50) DEFAULT 'SEQUENTIAL', -- 'SEQUENTIAL', 'DATA', 'SETUP'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ENHANCED DATA FACTORY FUNCTIONS
-- =============================================================================

-- Register test data for cleanup
CREATE OR REPLACE FUNCTION test_schema.register_test_data(
    p_test_name TEXT,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_test_suite TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO test_schema.test_data_registry (
        test_name, test_suite, entity_type, entity_id
    )
    VALUES (p_test_name, p_test_suite, p_entity_type, p_entity_id);
END;
$$ LANGUAGE plpgsql;

-- Enhanced test user submission factory
CREATE OR REPLACE FUNCTION test_schema.create_test_user_submission(
    p_test_name TEXT DEFAULT 'unnamed_test',
    p_first_name TEXT DEFAULT 'Test',
    p_last_name TEXT DEFAULT 'User',
    p_age INTEGER DEFAULT 25,
    p_favorite_color TEXT DEFAULT 'Blue'
)
RETURNS UUID AS $$
DECLARE
    test_id UUID;
BEGIN
    INSERT INTO public.user_submissions (first_name, last_name, age, favorite_color)
    VALUES (p_first_name, p_last_name, p_age, p_favorite_color)
    RETURNING id INTO test_id;
    
    -- Register for cleanup
    PERFORM test_schema.register_test_data(p_test_name, 'user_submission', test_id);
    
    RETURN test_id;
END;
$$ LANGUAGE plpgsql;

-- Enhanced test contact factory
CREATE OR REPLACE FUNCTION test_schema.create_test_contact(
    p_test_name TEXT DEFAULT 'unnamed_test',
    p_first_name TEXT DEFAULT 'Test',
    p_last_name TEXT DEFAULT 'Contact',
    p_organization TEXT DEFAULT 'Test Organization',
    p_email TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    test_id UUID;
    unique_email TEXT;
BEGIN
    -- Generate unique email if not provided
    IF p_email IS NULL THEN
        unique_email := p_first_name || '.' || p_last_name || '.' || 
                       extract(epoch from now()) || '@test.example.com';
    ELSE
        unique_email := p_email;
    END IF;
    
    INSERT INTO public.contacts (
        first_name, last_name, organization, email, 
        title, phone, notes
    )
    VALUES (
        p_first_name, p_last_name, p_organization, unique_email,
        'Test Title', '555-0123', 'Created by test: ' || p_test_name
    )
    RETURNING id INTO test_id;
    
    -- Register for cleanup
    PERFORM test_schema.register_test_data(p_test_name, 'contact', test_id);
    
    RETURN test_id;
END;
$$ LANGUAGE plpgsql;

-- Enhanced test organization factory
CREATE OR REPLACE FUNCTION test_schema.create_test_organization(
    p_test_name TEXT DEFAULT 'unnamed_test',
    p_name TEXT DEFAULT NULL,
    p_type public.organization_type DEFAULT 'B2B',
    p_is_principal BOOLEAN DEFAULT FALSE,
    p_is_distributor BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
    test_id UUID;
    unique_name TEXT;
    unique_email TEXT;
BEGIN
    -- Generate unique name if not provided
    IF p_name IS NULL THEN
        unique_name := 'Test Organization ' || extract(epoch from now());
    ELSE
        unique_name := p_name;
    END IF;
    
    unique_email := 'contact@' || replace(lower(unique_name), ' ', '-') || '.test.com';
    
    INSERT INTO public.organizations (
        name, legal_name, description, industry, type, status,
        website, email, primary_phone, city, state_province, country,
        is_principal, is_distributor
    )
    VALUES (
        unique_name,
        unique_name || ' Legal',
        'Test organization created by: ' || p_test_name,
        'Technology',
        p_type,
        'Prospect',
        'https://' || replace(lower(unique_name), ' ', '-') || '.test.com',
        unique_email,
        '555-0100',
        'Test City',
        'Test State',
        'United States',
        p_is_principal,
        p_is_distributor
    )
    RETURNING id INTO test_id;
    
    -- Register for cleanup
    PERFORM test_schema.register_test_data(p_test_name, 'organization', test_id);
    
    RETURN test_id;
END;
$$ LANGUAGE plpgsql;

-- Enhanced test product factory
CREATE OR REPLACE FUNCTION test_schema.create_test_product(
    p_test_name TEXT DEFAULT 'unnamed_test',
    p_name TEXT DEFAULT NULL,
    p_category public.product_category DEFAULT 'Other'
)
RETURNS UUID AS $$
DECLARE
    test_id UUID;
    unique_name TEXT;
    unique_sku TEXT;
BEGIN
    -- Generate unique identifiers
    IF p_name IS NULL THEN
        unique_name := 'Test Product ' || extract(epoch from now());
    ELSE
        unique_name := p_name;
    END IF;
    
    unique_sku := 'TEST-' || extract(epoch from now());
    
    INSERT INTO public.products (
        name, description, category, sku, unit_size,
        unit_cost, suggested_retail_price, is_active
    )
    VALUES (
        unique_name,
        'Test product created by: ' || p_test_name,
        p_category,
        unique_sku,
        '1 unit',
        10.00,
        15.00,
        TRUE
    )
    RETURNING id INTO test_id;
    
    -- Register for cleanup
    PERFORM test_schema.register_test_data(p_test_name, 'product', test_id);
    
    RETURN test_id;
END;
$$ LANGUAGE plpgsql;

-- Enhanced test opportunity factory
CREATE OR REPLACE FUNCTION test_schema.create_test_opportunity(
    p_test_name TEXT DEFAULT 'unnamed_test',
    p_organization_id UUID DEFAULT NULL,
    p_principal_id UUID DEFAULT NULL,
    p_product_id UUID DEFAULT NULL,
    p_stage public.opportunity_stage DEFAULT 'New Lead'
)
RETURNS UUID AS $$
DECLARE
    test_id UUID;
    org_id UUID;
    principal_id UUID;
    product_id UUID;
    unique_name TEXT;
BEGIN
    -- Create or use provided organization
    IF p_organization_id IS NULL THEN
        SELECT test_schema.create_test_organization(p_test_name, 'Test Org for Opportunity') INTO org_id;
    ELSE
        org_id := p_organization_id;
    END IF;
    
    -- Create or use provided principal
    IF p_principal_id IS NULL THEN
        SELECT test_schema.create_test_organization(p_test_name, 'Test Principal for Opportunity', 'B2B', TRUE, FALSE) INTO principal_id;
    ELSE
        principal_id := p_principal_id;
    END IF;
    
    -- Create or use provided product
    IF p_product_id IS NULL THEN
        SELECT test_schema.create_test_product(p_test_name, 'Test Product for Opportunity') INTO product_id;
    ELSE
        product_id := p_product_id;
    END IF;
    
    unique_name := 'Test Opportunity ' || extract(epoch from now());
    
    INSERT INTO public.opportunities (
        name, stage, probability_percent, expected_close_date,
        organization_id, principal_id, product_id, deal_owner,
        notes, context, is_won
    )
    VALUES (
        unique_name,
        p_stage,
        CASE p_stage
            WHEN 'New Lead' THEN 10
            WHEN 'Initial Outreach' THEN 20
            WHEN 'Sample/Visit Offered' THEN 30
            WHEN 'Awaiting Response' THEN 40
            WHEN 'Feedback Logged' THEN 60
            WHEN 'Demo Scheduled' THEN 80
            WHEN 'Closed - Won' THEN 100
            ELSE 10
        END,
        CURRENT_DATE + INTERVAL '30 days',
        org_id,
        principal_id,
        product_id,
        'Test Deal Owner',
        'Test opportunity created by: ' || p_test_name,
        'Custom',
        p_stage = 'Closed - Won'
    )
    RETURNING id INTO test_id;
    
    -- Register for cleanup
    PERFORM test_schema.register_test_data(p_test_name, 'opportunity', test_id);
    
    RETURN test_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ENHANCED CLEANUP FUNCTIONS
-- =============================================================================

-- Clean up data for specific test
CREATE OR REPLACE FUNCTION test_schema.cleanup_test_data(p_test_name TEXT)
RETURNS INTEGER AS $$
DECLARE
    cleanup_count INTEGER := 0;
    rec RECORD;
BEGIN
    -- Clean up in reverse dependency order
    FOR rec IN 
        SELECT entity_type, entity_id 
        FROM test_schema.test_data_registry 
        WHERE test_name = p_test_name 
        AND cleaned_up_at IS NULL
        ORDER BY 
            CASE entity_type
                WHEN 'opportunity' THEN 1
                WHEN 'product_principal' THEN 2
                WHEN 'product' THEN 3
                WHEN 'contact' THEN 4
                WHEN 'organization' THEN 5
                WHEN 'user_submission' THEN 6
                ELSE 7
            END
    LOOP
        CASE rec.entity_type
            WHEN 'user_submission' THEN
                DELETE FROM public.user_submissions WHERE id = rec.entity_id;
            WHEN 'contact' THEN
                DELETE FROM public.contacts WHERE id = rec.entity_id;
            WHEN 'organization' THEN
                DELETE FROM public.organizations WHERE id = rec.entity_id;
            WHEN 'product' THEN
                DELETE FROM public.products WHERE id = rec.entity_id;
            WHEN 'opportunity' THEN
                DELETE FROM public.opportunities WHERE id = rec.entity_id;
            -- Add more entity types as needed
        END CASE;
        
        cleanup_count := cleanup_count + 1;
    END LOOP;
    
    -- Mark as cleaned up
    UPDATE test_schema.test_data_registry 
    SET cleaned_up_at = NOW()
    WHERE test_name = p_test_name;
    
    RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql;

-- Clean up data for specific test suite
CREATE OR REPLACE FUNCTION test_schema.cleanup_test_suite_data(p_test_suite TEXT)
RETURNS INTEGER AS $$
DECLARE
    cleanup_count INTEGER := 0;
    test_name_rec RECORD;
BEGIN
    FOR test_name_rec IN 
        SELECT DISTINCT test_name 
        FROM test_schema.test_data_registry 
        WHERE test_suite = p_test_suite
    LOOP
        cleanup_count := cleanup_count + test_schema.cleanup_test_data(test_name_rec.test_name);
    END LOOP;
    
    RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TEST EXECUTION TRACKING
-- =============================================================================

-- Start test execution tracking
CREATE OR REPLACE FUNCTION test_schema.start_test_execution(
    p_test_name TEXT,
    p_test_suite TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    execution_id BIGINT;
BEGIN
    INSERT INTO test_schema.test_execution_log (
        test_name, test_suite, status, start_time
    )
    VALUES (p_test_name, p_test_suite, 'STARTED', NOW())
    RETURNING id INTO execution_id;
    
    RETURN execution_id;
END;
$$ LANGUAGE plpgsql;

-- End test execution tracking
CREATE OR REPLACE FUNCTION test_schema.end_test_execution(
    p_execution_id BIGINT,
    p_status TEXT,
    p_test_count INTEGER DEFAULT NULL,
    p_passed_count INTEGER DEFAULT NULL,
    p_failed_count INTEGER DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    start_time TIMESTAMPTZ;
BEGIN
    -- Get start time
    SELECT test_execution_log.start_time INTO start_time
    FROM test_schema.test_execution_log
    WHERE id = p_execution_id;
    
    UPDATE test_schema.test_execution_log
    SET 
        status = p_status,
        end_time = NOW(),
        duration_ms = EXTRACT(EPOCH FROM (NOW() - start_time)) * 1000,
        test_count = p_test_count,
        passed_count = p_passed_count,
        failed_count = p_failed_count,
        error_message = p_error_message
    WHERE id = p_execution_id;
END;
$$ LANGUAGE plpgsql;