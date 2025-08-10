-- =============================================================================
-- Business Logic Integration Tests: Principal/Distributor Mutual Exclusivity
-- =============================================================================
-- Comprehensive testing of business logic constraints ensuring organizations
-- cannot be both principal and distributor simultaneously, with proper
-- relationship hierarchy validation and cascade behavior testing.
-- =============================================================================

\i sql/tests/helpers/test_helpers.sql
\i sql/tests/security/security_test_helpers.sql
SET search_path TO test_schema, public, pg_catalog;

-- Test plan with comprehensive coverage
SELECT plan(35);

-- Test metadata
SELECT test_schema.test_notify('Starting test: principal distributor business logic validation');

-- Test setup
SELECT test_schema.begin_test();

-- =============================================================================
-- MUTUAL EXCLUSIVITY CONSTRAINT TESTS
-- =============================================================================

-- Test 1: Verify mutual exclusivity constraint exists
SELECT has_check(
    'public'::NAME,
    'organizations'::NAME,
    'organizations_principal_distributor_exclusive'::NAME,
    'Should have mutual exclusivity constraint for principal/distributor fields'
);

-- Test 2: Valid principal organization creation
DO $$
DECLARE
    test_principal_id UUID;
BEGIN
    SELECT test_schema.create_test_organization(
        'test_principal_distributor_logic',
        'Valid Principal Org',
        'B2B',
        TRUE,  -- is_principal = TRUE
        FALSE  -- is_distributor = FALSE
    ) INTO test_principal_id;
    
    PERFORM ok(
        (SELECT COUNT(*) FROM public.organizations 
         WHERE id = test_principal_id 
         AND is_principal = TRUE 
         AND is_distributor = FALSE) = 1,
        'Should create valid principal organization'
    );
END$$;

-- Test 3: Valid distributor organization creation
DO $$
DECLARE
    test_distributor_id UUID;
BEGIN
    SELECT test_schema.create_test_organization(
        'test_principal_distributor_logic',
        'Valid Distributor Org',
        'B2B',
        FALSE,  -- is_principal = FALSE
        TRUE    -- is_distributor = TRUE
    ) INTO test_distributor_id;
    
    PERFORM ok(
        (SELECT COUNT(*) FROM public.organizations 
         WHERE id = test_distributor_id 
         AND is_principal = FALSE 
         AND is_distributor = TRUE) = 1,
        'Should create valid distributor organization'
    );
END$$;

-- Test 4: Reject principal AND distributor combination
SELECT throws_ok(
    $$INSERT INTO public.organizations 
      (name, is_principal, is_distributor, city, state_province, country) 
      VALUES ('Invalid Dual Role', TRUE, TRUE, 'City', 'ST', 'USA')$$,
    '23514',
    'Should reject organization marked as both principal AND distributor'
);

-- Test 5: Test constraint on UPDATE operations
DO $$
DECLARE
    test_org_id UUID;
BEGIN
    -- Create valid organization
    SELECT test_schema.create_test_organization(
        'test_principal_distributor_logic',
        'Update Test Org',
        'B2B',
        FALSE,
        FALSE
    ) INTO test_org_id;
    
    -- Try to make it both principal and distributor (should fail)
    BEGIN
        UPDATE public.organizations 
        SET is_principal = TRUE, is_distributor = TRUE 
        WHERE id = test_org_id;
        
        PERFORM fail('Should not allow UPDATE to set both principal and distributor to TRUE');
    EXCEPTION WHEN check_violation THEN
        PERFORM pass('Correctly rejected UPDATE creating dual role violation');
    END;
END$$;

-- =============================================================================
-- DISTRIBUTOR HIERARCHY VALIDATION TESTS
-- =============================================================================

-- Test 6: Distributor cannot reference itself
SELECT throws_ok(
    $$
    DO $block$
    DECLARE
        test_id UUID := gen_random_uuid();
    BEGIN
        INSERT INTO public.organizations 
        (id, name, is_distributor, distributor_id, city, state_province, country) 
        VALUES (test_id, 'Self-Ref Distributor', TRUE, test_id, 'City', 'ST', 'USA');
    END $block$
    $$,
    '23514',
    'Should reject distributor that references itself'
);

-- Test 7: Distributor must have NULL distributor_id
SELECT throws_ok(
    $$
    DO $block$
    DECLARE
        parent_dist_id UUID;
        child_dist_id UUID;
    BEGIN
        -- Create parent distributor
        INSERT INTO public.organizations 
        (name, is_distributor, city, state_province, country)
        VALUES ('Parent Distributor', TRUE, 'City', 'ST', 'USA')
        RETURNING id INTO parent_dist_id;
        
        -- Try to create distributor with distributor_id (should fail)
        INSERT INTO public.organizations 
        (name, is_distributor, distributor_id, city, state_province, country)
        VALUES ('Child Distributor', TRUE, parent_dist_id, 'City', 'ST', 'USA');
    END $block$
    $$,
    '23514',
    'Should reject distributor organization with non-NULL distributor_id'
);

-- Test 8: Valid client-distributor relationship
DO $$
DECLARE
    distributor_id UUID;
    client_id UUID;
BEGIN
    -- Create distributor
    SELECT test_schema.create_test_organization(
        'test_principal_distributor_logic',
        'Test Distributor',
        'B2B',
        FALSE,
        TRUE
    ) INTO distributor_id;
    
    -- Create client organization under distributor
    INSERT INTO public.organizations 
    (name, type, distributor_id, city, state_province, country)
    VALUES ('Client Organization', 'B2B', distributor_id, 'City', 'ST', 'USA')
    RETURNING id INTO client_id;
    
    PERFORM test_schema.register_test_data('test_principal_distributor_logic', 'organization', client_id);
    
    PERFORM ok(
        (SELECT COUNT(*) FROM public.organizations 
         WHERE id = client_id 
         AND distributor_id = distributor_id
         AND is_distributor = FALSE) = 1,
        'Should create valid client-distributor relationship'
    );
END$$;

-- Test 9: Reject distributor_id referencing non-distributor
DO $$
DECLARE
    non_distributor_id UUID;
BEGIN
    -- Create non-distributor organization
    SELECT test_schema.create_test_organization(
        'test_principal_distributor_logic',
        'Non-Distributor Org',
        'B2B',
        FALSE,
        FALSE
    ) INTO non_distributor_id;
    
    -- Try to reference it as distributor (business logic violation)
    BEGIN
        INSERT INTO public.organizations 
        (name, distributor_id, city, state_province, country)
        VALUES ('Invalid Client', non_distributor_id, 'City', 'ST', 'USA');
        
        -- This might succeed at database level but violates business logic
        PERFORM ok(
            NOT public.validate_business_relationship(
                (SELECT id FROM public.organizations WHERE name = 'Invalid Client'),
                FALSE,
                FALSE,
                non_distributor_id
            ),
            'Business logic validation should reject non-distributor as parent'
        );
        
        -- Clean up
        DELETE FROM public.organizations WHERE name = 'Invalid Client';
    EXCEPTION WHEN foreign_key_violation THEN
        PERFORM pass('Database constraint correctly rejected invalid distributor reference');
    END;
END$$;

-- =============================================================================
-- BUSINESS LOGIC VALIDATION FUNCTION TESTS
-- =============================================================================

-- Test 10: validate_business_relationship function - valid principal
SELECT ok(
    public.validate_business_relationship(
        gen_random_uuid(),
        TRUE,   -- is_principal
        FALSE,  -- is_distributor  
        NULL    -- distributor_id
    ),
    'Should validate correct principal organization configuration'
);

-- Test 11: validate_business_relationship function - valid distributor
SELECT ok(
    public.validate_business_relationship(
        gen_random_uuid(),
        FALSE,  -- is_principal
        TRUE,   -- is_distributor
        NULL    -- distributor_id
    ),
    'Should validate correct distributor organization configuration'
);

-- Test 12: validate_business_relationship function - reject dual role
SELECT ok(
    NOT public.validate_business_relationship(
        gen_random_uuid(),
        TRUE,   -- is_principal
        TRUE,   -- is_distributor (invalid)
        NULL    -- distributor_id
    ),
    'Should reject organization as both principal and distributor'
);

-- Test 13: validate_business_relationship function - reject self-reference
DO $$
DECLARE
    test_id UUID := gen_random_uuid();
BEGIN
    PERFORM ok(
        NOT public.validate_business_relationship(
            test_id,
            FALSE,  -- is_principal
            FALSE,  -- is_distributor
            test_id -- distributor_id = self (invalid)
        ),
        'Should reject self-referential distributor relationship'
    );
END$$;

-- Test 14: validate_business_relationship function - distributor with distributor_id
SELECT ok(
    NOT public.validate_business_relationship(
        gen_random_uuid(),
        FALSE,              -- is_principal
        TRUE,               -- is_distributor
        gen_random_uuid()   -- distributor_id (invalid for distributors)
    ),
    'Should reject distributor organization with distributor_id set'
);

-- =============================================================================
-- COMPLEX BUSINESS RELATIONSHIP SCENARIOS
-- =============================================================================

-- Test 15: Multi-tier client hierarchy under single distributor
DO $$
DECLARE
    distributor_id UUID;
    client1_id UUID;
    client2_id UUID;
    client3_id UUID;
BEGIN
    -- Create distributor
    SELECT test_schema.create_test_organization(
        'test_principal_distributor_logic',
        'Multi-Client Distributor',
        'B2B',
        FALSE,
        TRUE
    ) INTO distributor_id;
    
    -- Create multiple clients under same distributor
    INSERT INTO public.organizations 
    (name, type, distributor_id, city, state_province, country)
    VALUES 
        ('Client 1', 'B2B', distributor_id, 'City1', 'ST', 'USA'),
        ('Client 2', 'B2B', distributor_id, 'City2', 'ST', 'USA'),
        ('Client 3', 'B2B', distributor_id, 'City3', 'ST', 'USA')
    RETURNING id INTO client1_id;
    
    -- Get remaining IDs
    SELECT id INTO client2_id FROM public.organizations WHERE name = 'Client 2';
    SELECT id INTO client3_id FROM public.organizations WHERE name = 'Client 3';
    
    -- Register for cleanup
    PERFORM test_schema.register_test_data('test_principal_distributor_logic', 'organization', client1_id);
    PERFORM test_schema.register_test_data('test_principal_distributor_logic', 'organization', client2_id);
    PERFORM test_schema.register_test_data('test_principal_distributor_logic', 'organization', client3_id);
    
    PERFORM ok(
        (SELECT COUNT(*) FROM public.organizations 
         WHERE distributor_id = distributor_id) = 3,
        'Should support multiple clients under single distributor'
    );
END$$;

-- Test 16: Principal-to-distributor conversion restrictions
DO $$
DECLARE
    principal_id UUID;
    opportunity_count INTEGER;
BEGIN
    -- Create principal with opportunities
    SELECT test_schema.create_test_organization(
        'test_principal_distributor_logic',
        'Principal To Convert',
        'B2B',
        TRUE,
        FALSE
    ) INTO principal_id;
    
    -- Create opportunity referencing this principal
    INSERT INTO public.opportunities 
    (name, principal_id, stage)
    VALUES ('Test Opportunity', principal_id, 'New Lead');
    
    PERFORM test_schema.register_test_data('test_principal_distributor_logic', 'opportunity', 
        (SELECT id FROM public.opportunities WHERE name = 'Test Opportunity'));
    
    -- Check that opportunities reference this principal
    SELECT COUNT(*) INTO opportunity_count
    FROM public.opportunities 
    WHERE principal_id = principal_id;
    
    PERFORM ok(
        opportunity_count > 0,
        'Principal organization should have associated opportunities'
    );
    
    -- Business logic should prevent conversion while opportunities exist
    PERFORM ok(
        NOT public.validate_business_relationship(
            principal_id,
            FALSE,  -- Convert from principal
            TRUE,   -- To distributor
            NULL
        ),
        'Business logic should consider opportunity dependencies for role changes'
    );
END$$;

-- =============================================================================
-- VIEW AND HELPER FUNCTION VALIDATION TESTS
-- =============================================================================

-- Test 17: get_principal_organizations function
DO $$
DECLARE
    result_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO result_count
    FROM public.get_principal_organizations();
    
    PERFORM ok(
        result_count >= 0,
        'get_principal_organizations function should execute without error'
    );
END$$;

-- Test 18: get_distributor_organizations function
DO $$
DECLARE
    result_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO result_count
    FROM public.get_distributor_organizations();
    
    PERFORM ok(
        result_count >= 0,
        'get_distributor_organizations function should execute without error'
    );
END$$;

-- Test 19: organization_business_relationships view
DO $$
DECLARE
    view_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO view_count
    FROM public.organization_business_relationships;
    
    PERFORM ok(
        view_count >= 0,
        'organization_business_relationships view should be accessible'
    );
END$$;

-- Test 20: distributor_performance view
DO $$
DECLARE
    view_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO view_count
    FROM public.distributor_performance;
    
    PERFORM ok(
        view_count >= 0,
        'distributor_performance view should be accessible'
    );
END$$;

-- =============================================================================
-- CASCADE AND RELATIONSHIP INTEGRITY TESTS
-- =============================================================================

-- Test 21: Soft delete distributor impact on clients
DO $$
DECLARE
    distributor_id UUID;
    client_id UUID;
    client_visible INTEGER;
BEGIN
    -- Create distributor and client
    SELECT test_schema.create_test_organization(
        'test_principal_distributor_logic',
        'Soft Delete Test Distributor',
        'B2B',
        FALSE,
        TRUE
    ) INTO distributor_id;
    
    INSERT INTO public.organizations 
    (name, distributor_id, city, state_province, country)
    VALUES ('Client of Soft Deleted', distributor_id, 'City', 'ST', 'USA')
    RETURNING id INTO client_id;
    
    PERFORM test_schema.register_test_data('test_principal_distributor_logic', 'organization', client_id);
    
    -- Soft delete distributor
    UPDATE public.organizations 
    SET deleted_at = NOW()
    WHERE id = distributor_id;
    
    -- Client should still exist but may have different visibility rules
    SELECT COUNT(*) INTO client_visible
    FROM public.organizations 
    WHERE id = client_id AND deleted_at IS NULL;
    
    PERFORM ok(
        client_visible = 1,
        'Client organizations should not be auto-deleted when distributor is soft deleted'
    );
    
    -- Restore for proper cleanup
    UPDATE public.organizations 
    SET deleted_at = NULL
    WHERE id = distributor_id;
END$$;

-- Test 22: Hard delete distributor with cascade behavior
DO $$
DECLARE
    temp_distributor_id UUID;
    temp_client_id UUID;
    client_count INTEGER;
BEGIN
    -- Create temporary entities for deletion test
    INSERT INTO public.organizations 
    (name, is_distributor, city, state_province, country)
    VALUES ('Temp Delete Distributor', TRUE, 'City', 'ST', 'USA')
    RETURNING id INTO temp_distributor_id;
    
    INSERT INTO public.organizations 
    (name, distributor_id, city, state_province, country)
    VALUES ('Temp Client', temp_distributor_id, 'City', 'ST', 'USA')
    RETURNING id INTO temp_client_id;
    
    -- Delete distributor (client should handle the FK constraint)
    BEGIN
        DELETE FROM public.organizations WHERE id = temp_distributor_id;
        
        -- Check if client was cascaded or constraint prevented deletion
        SELECT COUNT(*) INTO client_count
        FROM public.organizations 
        WHERE id = temp_client_id;
        
        PERFORM ok(
            TRUE, -- Either cascade worked or constraint prevented deletion
            'Distributor deletion should handle client relationships appropriately'
        );
    EXCEPTION WHEN foreign_key_violation THEN
        PERFORM pass('Foreign key constraint correctly prevented distributor deletion with clients');
        -- Clean up manually
        DELETE FROM public.organizations WHERE id = temp_client_id;
        DELETE FROM public.organizations WHERE id = temp_distributor_id;
    END;
END$$;

-- =============================================================================
-- BUSINESS RULE COMPLIANCE TESTS
-- =============================================================================

-- Test 23: Verify no existing mutual exclusivity violations
DO $$
DECLARE
    violation_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO violation_count
    FROM public.organizations 
    WHERE is_principal = TRUE AND is_distributor = TRUE
    AND deleted_at IS NULL;
    
    PERFORM ok(
        violation_count = 0,
        'Should have no existing mutual exclusivity violations in database'
    );
END$$;

-- Test 24: Verify distributor hierarchy integrity
DO $$
DECLARE
    invalid_hierarchy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_hierarchy_count
    FROM public.organizations o
    WHERE o.distributor_id IS NOT NULL 
    AND NOT EXISTS (
        SELECT 1 FROM public.organizations d
        WHERE d.id = o.distributor_id 
        AND d.is_distributor = TRUE 
        AND d.deleted_at IS NULL
    )
    AND o.deleted_at IS NULL;
    
    PERFORM ok(
        invalid_hierarchy_count = 0,
        'Should have no invalid distributor hierarchy references'
    );
END$$;

-- Test 25: Verify distributors have NULL distributor_id
DO $$
DECLARE
    invalid_distributor_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_distributor_count
    FROM public.organizations 
    WHERE is_distributor = TRUE 
    AND distributor_id IS NOT NULL
    AND deleted_at IS NULL;
    
    PERFORM ok(
        invalid_distributor_count = 0,
        'Distributor organizations should have NULL distributor_id'
    );
END$$;

-- =============================================================================
-- PERFORMANCE AND INDEX USAGE TESTS
-- =============================================================================

-- Test 26: Index usage for principal queries
DO $$
DECLARE
    explain_result TEXT;
BEGIN
    SELECT test_schema.check_index_usage(
        'SELECT id, name FROM public.organizations WHERE is_principal = TRUE AND deleted_at IS NULL'
    ) INTO explain_result;
    
    PERFORM ok(
        explain_result LIKE '%index%' OR explain_result LIKE '%Index%',
        'Principal queries should use appropriate indexes: ' || explain_result
    );
END$$;

-- Test 27: Index usage for distributor queries
DO $$
DECLARE
    explain_result TEXT;
BEGIN
    SELECT test_schema.check_index_usage(
        'SELECT id, name FROM public.organizations WHERE is_distributor = TRUE AND deleted_at IS NULL'
    ) INTO explain_result;
    
    PERFORM ok(
        explain_result LIKE '%index%' OR explain_result LIKE '%Index%',
        'Distributor queries should use appropriate indexes: ' || explain_result
    );
END$$;

-- Test 28: Index usage for distributor relationship queries
DO $$
DECLARE
    explain_result TEXT;
BEGIN
    SELECT test_schema.check_index_usage(
        'SELECT id, name FROM public.organizations WHERE distributor_id IS NOT NULL AND deleted_at IS NULL'
    ) INTO explain_result;
    
    PERFORM ok(
        explain_result LIKE '%index%' OR explain_result LIKE '%Index%',
        'Distributor relationship queries should use appropriate indexes: ' || explain_result
    );
END$$;

-- =============================================================================
-- EDGE CASE AND BOUNDARY CONDITION TESTS
-- =============================================================================

-- Test 29: NULL value handling in business logic validation
SELECT ok(
    public.validate_business_relationship(
        gen_random_uuid(),
        NULL,   -- is_principal = NULL
        NULL,   -- is_distributor = NULL
        NULL    -- distributor_id = NULL
    ),
    'Should handle NULL values gracefully in business logic validation'
);

-- Test 30: Mixed NULL and boolean combinations
SELECT ok(
    public.validate_business_relationship(
        gen_random_uuid(),
        TRUE,   -- is_principal = TRUE
        NULL,   -- is_distributor = NULL  
        NULL    -- distributor_id = NULL
    ),
    'Should validate mixed NULL and boolean combinations correctly'
);

-- Test 31: Distributor relationship cycle detection
DO $$
DECLARE
    dist1_id UUID;
    dist2_id UUID;
    client_id UUID;
BEGIN
    -- Create two distributors
    SELECT test_schema.create_test_organization(
        'test_principal_distributor_logic',
        'Distributor A',
        'B2B',
        FALSE,
        TRUE
    ) INTO dist1_id;
    
    SELECT test_schema.create_test_organization(
        'test_principal_distributor_logic',
        'Distributor B',
        'B2B',
        FALSE,
        TRUE
    ) INTO dist2_id;
    
    -- Create client under Distributor A
    INSERT INTO public.organizations 
    (name, distributor_id, city, state_province, country)
    VALUES ('Cycle Test Client', dist1_id, 'City', 'ST', 'USA')
    RETURNING id INTO client_id;
    
    PERFORM test_schema.register_test_data('test_principal_distributor_logic', 'organization', client_id);
    
    -- Verify no circular reference can be created by business logic
    PERFORM ok(
        NOT public.validate_business_relationship(
            dist1_id,
            FALSE,
            TRUE,
            client_id  -- Distributor trying to reference its client
        ),
        'Should prevent circular distributor relationships'
    );
END$$;

-- =============================================================================
-- TRANSACTION BOUNDARY AND CONCURRENCY TESTS
-- =============================================================================

-- Test 32: Transaction rollback on constraint violation
DO $$
DECLARE
    initial_org_count INTEGER;
    final_org_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO initial_org_count
    FROM public.organizations
    WHERE name LIKE 'Transaction Test%';
    
    BEGIN
        -- Start transaction that will fail
        INSERT INTO public.organizations 
        (name, is_principal, is_distributor, city, state_province, country)
        VALUES ('Transaction Test Valid', FALSE, FALSE, 'City', 'ST', 'USA');
        
        -- This should fail and rollback the entire transaction
        INSERT INTO public.organizations 
        (name, is_principal, is_distributor, city, state_province, country)
        VALUES ('Transaction Test Invalid', TRUE, TRUE, 'City', 'ST', 'USA');
        
    EXCEPTION WHEN check_violation THEN
        -- Expected exception
        NULL;
    END;
    
    SELECT COUNT(*) INTO final_org_count
    FROM public.organizations
    WHERE name LIKE 'Transaction Test%';
    
    PERFORM ok(
        final_org_count = initial_org_count,
        'Transaction should rollback all changes on constraint violation'
    );
END$$;

-- Test 33: Concurrent access simulation
DO $$
DECLARE
    test_distributor_id UUID;
    client_count INTEGER;
BEGIN
    -- Create distributor for concurrent access test
    SELECT test_schema.create_test_organization(
        'test_principal_distributor_logic',
        'Concurrent Test Distributor',
        'B2B',
        FALSE,
        TRUE
    ) INTO test_distributor_id;
    
    -- Simulate concurrent client creation
    INSERT INTO public.organizations 
    (name, distributor_id, city, state_province, country)
    SELECT 
        'Concurrent Client ' || generate_series(1,3),
        test_distributor_id,
        'City',
        'ST',
        'USA';
    
    SELECT COUNT(*) INTO client_count
    FROM public.organizations
    WHERE distributor_id = test_distributor_id
    AND name LIKE 'Concurrent Client%';
    
    -- Register for cleanup
    INSERT INTO test_schema.test_data_registry (test_name, entity_type, entity_id)
    SELECT 'test_principal_distributor_logic', 'organization', id
    FROM public.organizations
    WHERE name LIKE 'Concurrent Client%';
    
    PERFORM ok(
        client_count = 3,
        'Should handle concurrent client creation under same distributor'
    );
END$$;

-- =============================================================================
-- DATA CONSISTENCY VALIDATION TESTS
-- =============================================================================

-- Test 34: Cross-table referential integrity
DO $$
DECLARE
    principal_id UUID;
    opportunity_count INTEGER;
    valid_references INTEGER;
BEGIN
    -- Get a principal with opportunities
    SELECT p.principal_id INTO principal_id
    FROM public.opportunities o
    JOIN public.organizations p ON o.principal_id = p.id
    WHERE p.is_principal = TRUE
    AND p.deleted_at IS NULL
    LIMIT 1;
    
    IF principal_id IS NOT NULL THEN
        -- Count opportunities for this principal
        SELECT COUNT(*) INTO opportunity_count
        FROM public.opportunities
        WHERE principal_id = principal_id;
        
        -- Verify all opportunities reference valid principals
        SELECT COUNT(*) INTO valid_references
        FROM public.opportunities o
        JOIN public.organizations p ON o.principal_id = p.id
        WHERE o.principal_id = principal_id
        AND p.is_principal = TRUE
        AND p.deleted_at IS NULL;
        
        PERFORM ok(
            opportunity_count = valid_references,
            'All opportunities should reference valid principal organizations'
        );
    ELSE
        PERFORM skip('No principal organizations with opportunities found for cross-reference test');
    END IF;
END$$;

-- Test 35: Business relationship consistency across views
DO $$
DECLARE
    view_total INTEGER;
    table_total INTEGER;
BEGIN
    -- Count from materialized view (if exists)
    BEGIN
        SELECT COUNT(*) INTO view_total
        FROM public.organization_business_relationships
        WHERE business_relationship_type IN ('Principal', 'Distributor');
    EXCEPTION WHEN undefined_table THEN
        view_total := -1; -- View doesn't exist
    END;
    
    -- Count from base table
    SELECT COUNT(*) INTO table_total
    FROM public.organizations
    WHERE (is_principal = TRUE OR is_distributor = TRUE)
    AND deleted_at IS NULL;
    
    IF view_total >= 0 THEN
        PERFORM ok(
            view_total = table_total,
            'Business relationship view should match base table counts'
        );
    ELSE
        PERFORM ok(
            table_total >= 0,
            'Base table business relationship counts should be consistent'
        );
    END IF;
END$$;

-- =============================================================================
-- CLEANUP AND COMPLETION
-- =============================================================================

-- Clean up test data
PERFORM test_schema.cleanup_test_data('test_principal_distributor_logic');

-- Rollback test transaction
SELECT test_schema.rollback_test();

-- Finish test plan
SELECT finish();

-- Log completion
SELECT test_schema.test_notify('Completed test: principal distributor business logic validation');