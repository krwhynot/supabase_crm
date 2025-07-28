-- =============================================================================
-- Organizations Schema Validation Tests
-- =============================================================================
-- This file contains validation tests for the organizations schema to ensure
-- all tables, constraints, and relationships work correctly.
--
-- Applied: Stage 1 - Database Implementation
-- Confidence: 88%
-- =============================================================================

-- Test 1: Verify organizations table creation and basic constraints
DO $$
BEGIN
    -- Test that we can insert a basic organization
    INSERT INTO public.organizations (name, status) 
    VALUES ('Test Organization', 'Prospect');
    
    -- Test that name constraint prevents empty strings
    BEGIN
        INSERT INTO public.organizations (name, status) 
        VALUES ('', 'Prospect');
        RAISE EXCEPTION 'Should not allow empty organization name';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'PASS: Empty name constraint working correctly';
    END;
    
    -- Test email format validation
    BEGIN
        INSERT INTO public.organizations (name, email, status) 
        VALUES ('Test Org 2', 'invalid-email', 'Prospect');
        RAISE EXCEPTION 'Should not allow invalid email format';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'PASS: Email format validation working correctly';
    END;
    
    -- Test website URL validation
    BEGIN
        INSERT INTO public.organizations (name, website, status) 
        VALUES ('Test Org 3', 'not-a-url', 'Prospect');
        RAISE EXCEPTION 'Should not allow invalid website URL';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'PASS: Website URL validation working correctly';
    END;
    
    -- Test lead score range validation
    BEGIN
        INSERT INTO public.organizations (name, lead_score, status) 
        VALUES ('Test Org 4', 150, 'Prospect');
        RAISE EXCEPTION 'Should not allow lead score > 100';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'PASS: Lead score range validation working correctly';
    END;
    
    RAISE NOTICE 'Test 1: Organizations table constraints - PASSED';
END $$;

-- Test 2: Verify organization interactions table and relationships
DO $$
DECLARE
    test_org_id UUID;
BEGIN
    -- Create a test organization
    INSERT INTO public.organizations (name, status) 
    VALUES ('Interaction Test Org', 'Active') 
    RETURNING id INTO test_org_id;
    
    -- Test basic interaction creation
    INSERT INTO public.organization_interactions (
        organization_id, 
        type, 
        subject, 
        description
    ) VALUES (
        test_org_id, 
        'Email', 
        'Test Interaction', 
        'This is a test interaction'
    );
    
    -- Test foreign key constraint
    BEGIN
        INSERT INTO public.organization_interactions (
            organization_id, 
            type, 
            subject
        ) VALUES (
            gen_random_uuid(), -- Random UUID that doesn't exist
            'Email', 
            'Should Fail'
        );
        RAISE EXCEPTION 'Should not allow invalid organization_id';
    EXCEPTION
        WHEN foreign_key_violation THEN
            RAISE NOTICE 'PASS: Organization FK constraint working correctly';
    END;
    
    -- Test duration validation
    BEGIN
        INSERT INTO public.organization_interactions (
            organization_id, 
            type, 
            duration_minutes
        ) VALUES (
            test_org_id, 
            'Phone', 
            -10 -- Negative duration
        );
        RAISE EXCEPTION 'Should not allow negative duration';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'PASS: Duration validation working correctly';
    END;
    
    RAISE NOTICE 'Test 2: Organization interactions constraints - PASSED';
END $$;

-- Test 3: Verify organization documents table
DO $$
DECLARE
    test_org_id UUID;
BEGIN
    -- Create a test organization
    INSERT INTO public.organizations (name, status) 
    VALUES ('Document Test Org', 'Active') 
    RETURNING id INTO test_org_id;
    
    -- Test basic document creation with storage path
    INSERT INTO public.organization_documents (
        organization_id, 
        name,
        storage_path,
        category
    ) VALUES (
        test_org_id, 
        'Test Document', 
        '/storage/path/test.pdf',
        'Contract'
    );
    
    -- Test document creation with external URL
    INSERT INTO public.organization_documents (
        organization_id, 
        name,
        external_url,
        category
    ) VALUES (
        test_org_id, 
        'External Document', 
        'https://example.com/doc.pdf',
        'Reference'
    );
    
    -- Test that document requires either storage_path or external_url
    BEGIN
        INSERT INTO public.organization_documents (
            organization_id, 
            name,
            category
        ) VALUES (
            test_org_id, 
            'Invalid Document',
            'Contract'
        );
        RAISE EXCEPTION 'Should require either storage_path or external_url';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'PASS: Document location constraint working correctly';
    END;
    
    -- Test file size validation
    BEGIN
        INSERT INTO public.organization_documents (
            organization_id, 
            name,
            storage_path,
            file_size_bytes
        ) VALUES (
            test_org_id, 
            'Invalid Size Document', 
            '/storage/test.pdf',
            -100 -- Negative file size
        );
        RAISE EXCEPTION 'Should not allow negative file size';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'PASS: File size validation working correctly';
    END;
    
    RAISE NOTICE 'Test 3: Organization documents constraints - PASSED';
END $$;

-- Test 4: Verify organization analytics table
DO $$
DECLARE
    test_org_id UUID;
BEGIN
    -- Create a test organization
    INSERT INTO public.organizations (name, status) 
    VALUES ('Analytics Test Org', 'Active') 
    RETURNING id INTO test_org_id;
    
    -- Test basic analytics creation
    INSERT INTO public.organization_analytics (
        organization_id,
        period_start,
        period_end,
        period_type,
        total_interactions,
        revenue_generated
    ) VALUES (
        test_org_id,
        '2024-01-01'::timestamptz,
        '2024-01-31'::timestamptz,
        'monthly',
        15,
        5000.00
    );
    
    -- Test period validation (start must be before end)
    BEGIN
        INSERT INTO public.organization_analytics (
            organization_id,
            period_start,
            period_end,
            period_type
        ) VALUES (
            test_org_id,
            '2024-02-01'::timestamptz,
            '2024-01-31'::timestamptz, -- End before start
            'monthly'
        );
        RAISE EXCEPTION 'Should not allow period_end before period_start';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'PASS: Period validation working correctly';
    END;
    
    -- Test non-negative metrics validation
    BEGIN
        INSERT INTO public.organization_analytics (
            organization_id,
            period_start,
            period_end,
            period_type,
            total_interactions
        ) VALUES (
            test_org_id,
            '2024-03-01'::timestamptz,
            '2024-03-31'::timestamptz,
            'monthly',
            -5 -- Negative interactions
        );
        RAISE EXCEPTION 'Should not allow negative interaction count';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'PASS: Non-negative metrics validation working correctly';
    END;
    
    RAISE NOTICE 'Test 4: Organization analytics constraints - PASSED';
END $$;

-- Test 5: Verify updated_at triggers
DO $$
DECLARE
    test_org_id UUID;
    original_updated_at TIMESTAMPTZ;
    new_updated_at TIMESTAMPTZ;
BEGIN
    -- Create a test organization
    INSERT INTO public.organizations (name, status) 
    VALUES ('Trigger Test Org', 'Active') 
    RETURNING id, updated_at INTO test_org_id, original_updated_at;
    
    -- Wait a moment to ensure timestamp difference
    PERFORM pg_sleep(0.1);
    
    -- Update the organization
    UPDATE public.organizations 
    SET description = 'Updated description'
    WHERE id = test_org_id
    RETURNING updated_at INTO new_updated_at;
    
    -- Verify updated_at was changed
    IF new_updated_at > original_updated_at THEN
        RAISE NOTICE 'PASS: Updated_at trigger working correctly';
    ELSE
        RAISE EXCEPTION 'FAIL: Updated_at trigger not working';
    END IF;
    
    RAISE NOTICE 'Test 5: Updated_at triggers - PASSED';
END $$;

-- Test 6: Verify soft delete functionality
DO $$
DECLARE
    test_org_id UUID;
    org_count INTEGER;
BEGIN
    -- Create a test organization
    INSERT INTO public.organizations (name, status) 
    VALUES ('Soft Delete Test Org', 'Active') 
    RETURNING id INTO test_org_id;
    
    -- Verify organization is visible
    SELECT COUNT(*) INTO org_count 
    FROM public.organizations 
    WHERE id = test_org_id AND deleted_at IS NULL;
    
    IF org_count = 1 THEN
        RAISE NOTICE 'PASS: Organization visible before soft delete';
    ELSE
        RAISE EXCEPTION 'FAIL: Organization not found before soft delete';
    END IF;
    
    -- Perform soft delete
    UPDATE public.organizations 
    SET deleted_at = NOW() 
    WHERE id = test_org_id;
    
    -- Verify organization is hidden in filtered queries
    SELECT COUNT(*) INTO org_count 
    FROM public.organizations 
    WHERE id = test_org_id AND deleted_at IS NULL;
    
    IF org_count = 0 THEN
        RAISE NOTICE 'PASS: Organization hidden after soft delete';
    ELSE
        RAISE EXCEPTION 'FAIL: Organization still visible after soft delete';
    END IF;
    
    RAISE NOTICE 'Test 6: Soft delete functionality - PASSED';
END $$;

-- Test 7: Verify analytics views work correctly
DO $$
DECLARE
    test_org_id UUID;
    view_count INTEGER;
BEGIN
    -- Create a test organization with some data
    INSERT INTO public.organizations (name, status, industry, lead_score) 
    VALUES ('View Test Org', 'Active', 'Technology', 75) 
    RETURNING id INTO test_org_id;
    
    -- Add some interactions
    INSERT INTO public.organization_interactions (organization_id, type, subject)
    VALUES 
        (test_org_id, 'Email', 'Test Email 1'),
        (test_org_id, 'Phone', 'Test Call 1'),
        (test_org_id, 'Meeting', 'Test Meeting 1');
    
    -- Test organization_summary_analytics view
    SELECT COUNT(*) INTO view_count
    FROM public.organization_summary_analytics
    WHERE id = test_org_id;
    
    IF view_count >= 1 THEN
        RAISE NOTICE 'PASS: Organization summary analytics view working';
    ELSE
        RAISE EXCEPTION 'FAIL: Organization summary analytics view not working';
    END IF;
    
    -- Test organization_lead_scoring view
    SELECT COUNT(*) INTO view_count
    FROM public.organization_lead_scoring
    WHERE id = test_org_id;
    
    IF view_count >= 1 THEN
        RAISE NOTICE 'PASS: Organization lead scoring view working';
    ELSE
        RAISE EXCEPTION 'FAIL: Organization lead scoring view not working';
    END IF;
    
    RAISE NOTICE 'Test 7: Analytics views - PASSED';
END $$;

-- Cleanup test data
DELETE FROM public.organization_interactions 
WHERE organization_id IN (
    SELECT id FROM public.organizations 
    WHERE name LIKE '%Test%'
);

DELETE FROM public.organization_documents 
WHERE organization_id IN (
    SELECT id FROM public.organizations 
    WHERE name LIKE '%Test%'
);

DELETE FROM public.organization_analytics 
WHERE organization_id IN (
    SELECT id FROM public.organizations 
    WHERE name LIKE '%Test%'
);

DELETE FROM public.organizations 
WHERE name LIKE '%Test%';

-- Final summary
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ORGANIZATIONS SCHEMA VALIDATION COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'All tests passed successfully!';
    RAISE NOTICE 'Schema is ready for Stage 2 implementation.';
    RAISE NOTICE '========================================';
END $$;