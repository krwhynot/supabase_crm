-- =============================================================================
-- RLS Policy Verification Tests for Interactions Table
-- =============================================================================
-- This file contains test queries to verify that the interactions RLS policies
-- work correctly and provide proper security isolation.
--
-- USAGE: Run these queries in Supabase SQL Editor or via MCP commands
-- =============================================================================

-- =============================================================================
-- TEST DATA SETUP (Run only if test data doesn't exist)
-- =============================================================================

-- Insert test organizations (principals and customers)
INSERT INTO public.organizations (id, name, is_principal, type, status) VALUES
('11111111-1111-1111-1111-111111111111', 'Principal A Foods', TRUE, 'Principal', 'Active'),
('22222222-2222-2222-2222-222222222222', 'Principal B Brands', TRUE, 'Principal', 'Active'),
('33333333-3333-3333-3333-333333333333', 'Customer Restaurant Chain', FALSE, 'Customer', 'Active'),
('44444444-4444-4444-4444-444444444444', 'Customer Grocery Store', FALSE, 'Customer', 'Active')
ON CONFLICT (id) DO NOTHING;

-- Insert test contacts
INSERT INTO public.contacts (id, first_name, last_name, email, organization_id) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'John', 'Smith', 'john@restaurant.com', '33333333-3333-3333-3333-333333333333'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Jane', 'Doe', 'jane@grocery.com', '44444444-4444-4444-4444-444444444444'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Bob', 'Wilson', 'bob@principala.com', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- Insert test products
INSERT INTO public.products (id, name, description, category) VALUES
('pppppppp-1111-1111-1111-111111111111', 'Premium Sauce A', 'High-quality sauce for restaurants', 'Sauce'),
('pppppppp-2222-2222-2222-222222222222', 'Specialty Seasoning B', 'Unique seasoning blend', 'Seasoning')
ON CONFLICT (id) DO NOTHING;

-- Insert test opportunities
INSERT INTO public.opportunities (id, name, organization_id, principal_id, stage, product_id) VALUES
('oooooooo-1111-1111-1111-111111111111', 'Restaurant Chain - Premium Sauce', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'New Lead', 'pppppppp-1111-1111-1111-111111111111'),
('oooooooo-2222-2222-2222-222222222222', 'Grocery Store - Seasoning', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Initial Outreach', 'pppppppp-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- Insert test interactions
INSERT INTO public.interactions (id, interaction_type, date, subject, opportunity_id, contact_id, notes) VALUES
-- Opportunity-linked interactions
('iiiiiiii-1111-1111-1111-111111111111', 'EMAIL', NOW() - INTERVAL '1 day', 'Initial outreach email', 'oooooooo-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sent product information'),
('iiiiiiii-2222-2222-2222-222222222222', 'CALL', NOW() - INTERVAL '2 days', 'Follow-up call', 'oooooooo-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Discussed pricing options'),

-- Contact-only interactions (no opportunity)
('iiiiiiii-3333-3333-3333-333333333333', 'IN_PERSON', NOW() - INTERVAL '3 days', 'Trade show meeting', NULL, 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Met at food industry expo'),

-- Deleted interaction (soft delete test)
('iiiiiiii-4444-4444-4444-444444444444', 'EMAIL', NOW() - INTERVAL '4 days', 'Deleted interaction', 'oooooooo-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'This should not be visible')
ON CONFLICT (id) DO NOTHING;

-- Soft delete one interaction for testing
UPDATE public.interactions SET deleted_at = NOW() WHERE id = 'iiiiiiii-4444-4444-4444-444444444444';

-- =============================================================================
-- RLS POLICY VERIFICATION TESTS
-- =============================================================================

-- Test 1: Verify SELECT policy filters deleted interactions
SELECT 
    'Test 1: SELECT policy filters deleted interactions' as test_name,
    COUNT(*) as visible_interactions,
    CASE 
        WHEN COUNT(*) = 3 THEN 'PASS' 
        ELSE 'FAIL' 
    END as result
FROM public.interactions;

-- Test 2: Verify interactions show proper opportunity relationships
SELECT 
    'Test 2: Opportunity relationships visible' as test_name,
    i.subject,
    o.name as opportunity_name,
    org.name as customer_name,
    prin.name as principal_name
FROM public.interactions i
LEFT JOIN public.opportunities o ON i.opportunity_id = o.id
LEFT JOIN public.organizations org ON o.organization_id = org.id
LEFT JOIN public.organizations prin ON o.principal_id = prin.id
WHERE i.opportunity_id IS NOT NULL
ORDER BY i.date DESC;

-- Test 3: Verify interactions show proper contact relationships
SELECT 
    'Test 3: Contact relationships visible' as test_name,
    i.subject,
    c.first_name || ' ' || c.last_name as contact_name,
    org.name as organization_name,
    org.is_principal
FROM public.interactions i
LEFT JOIN public.contacts c ON i.contact_id = c.id
LEFT JOIN public.organizations org ON c.organization_id = org.id
WHERE i.contact_id IS NOT NULL
ORDER BY i.date DESC;

-- Test 4: Test helper function - user_has_opportunity_access
SELECT 
    'Test 4: user_has_opportunity_access function' as test_name,
    opportunity_id,
    user_has_opportunity_access(opportunity_id) as has_access
FROM (
    SELECT DISTINCT opportunity_id 
    FROM public.interactions 
    WHERE opportunity_id IS NOT NULL
) t;

-- Test 5: Test helper function - user_has_contact_access
SELECT 
    'Test 5: user_has_contact_access function' as test_name,
    contact_id,
    user_has_contact_access(contact_id) as has_access
FROM (
    SELECT DISTINCT contact_id 
    FROM public.interactions 
    WHERE contact_id IS NOT NULL
) t;

-- Test 6: Test helper function - get_interaction_principal_context
SELECT 
    'Test 6: get_interaction_principal_context function' as test_name,
    i.id,
    i.subject,
    get_interaction_principal_context(i.id) as principal_context,
    CASE 
        WHEN i.opportunity_id IS NOT NULL THEN o.principal_id
        WHEN i.contact_id IS NOT NULL THEN c_org.id
        ELSE NULL
    END as expected_principal
FROM public.interactions i
LEFT JOIN public.opportunities o ON i.opportunity_id = o.id
LEFT JOIN public.contacts c ON i.contact_id = c.id
LEFT JOIN public.organizations c_org ON c.organization_id = c_org.id AND c_org.is_principal = TRUE
ORDER BY i.date DESC;

-- Test 7: Verify RLS policies exist
SELECT 
    'Test 7: RLS policies exist' as test_name,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual IS NOT NULL as has_using_clause,
    with_check IS NOT NULL as has_with_check_clause
FROM pg_policies 
WHERE tablename = 'interactions' 
ORDER BY policyname;

-- Test 8: Verify RLS is enabled on interactions table
SELECT 
    'Test 8: RLS enabled on interactions table' as test_name,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN 'PASS' 
        ELSE 'FAIL' 
    END as result
FROM pg_tables 
WHERE tablename = 'interactions';

-- Test 9: Test interaction security validation
SELECT 
    'Test 9: Security validation functions exist' as test_name,
    proname as function_name,
    prosrc IS NOT NULL as has_implementation
FROM pg_proc 
WHERE proname IN (
    'user_has_opportunity_access',
    'user_has_contact_access', 
    'user_has_supervisor_access',
    'get_interaction_principal_context',
    'validate_interaction_security',
    'log_interaction_access'
)
ORDER BY proname;

-- Test 10: Verify indexes for RLS optimization exist
SELECT 
    'Test 10: RLS optimization indexes exist' as test_name,
    indexname,
    tablename,
    CASE 
        WHEN indexname LIKE '%rls%' THEN 'RLS Optimized'
        ELSE 'General Purpose'
    END as index_type
FROM pg_indexes 
WHERE tablename = 'interactions'
AND indexname LIKE '%rls%'
ORDER BY indexname;

-- =============================================================================
-- EDGE CASE TESTS
-- =============================================================================

-- Test 11: Orphaned interactions (no opportunity or contact)
-- This should not exist based on our constraints, but test anyway
SELECT 
    'Test 11: Orphaned interactions handling' as test_name,
    COUNT(*) as orphaned_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS - No orphaned interactions' 
        ELSE 'ATTENTION - Found orphaned interactions' 
    END as result
FROM public.interactions
WHERE opportunity_id IS NULL AND contact_id IS NULL AND deleted_at IS NULL;

-- Test 12: Interactions with deleted opportunities
-- First create a test opportunity and interaction, then soft delete the opportunity
DO $$
DECLARE
    test_org_id UUID := '55555555-5555-5555-5555-555555555555';
    test_opp_id UUID := 'oooooooo-9999-9999-9999-999999999999';
    test_int_id UUID := 'iiiiiiii-9999-9999-9999-999999999999';
BEGIN
    -- Insert test data
    INSERT INTO public.organizations (id, name, is_principal, type, status) 
    VALUES (test_org_id, 'Test Org for Deletion', FALSE, 'Customer', 'Active')
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO public.opportunities (id, name, organization_id, stage) 
    VALUES (test_opp_id, 'Test Opportunity for Deletion', test_org_id, 'New Lead')
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO public.interactions (id, interaction_type, date, subject, opportunity_id) 
    VALUES (test_int_id, 'EMAIL', NOW(), 'Test interaction with deleted opportunity', test_opp_id)
    ON CONFLICT (id) DO NOTHING;
    
    -- Now soft delete the opportunity
    UPDATE public.opportunities SET deleted_at = NOW() WHERE id = test_opp_id;
END $$;

-- Test the orphaned interaction
SELECT 
    'Test 12: Interactions with deleted opportunities' as test_name,
    i.subject,
    i.opportunity_id,
    o.deleted_at as opportunity_deleted,
    user_has_opportunity_access(i.opportunity_id) as still_has_access
FROM public.interactions i
LEFT JOIN public.opportunities o ON i.opportunity_id = o.id
WHERE i.subject = 'Test interaction with deleted opportunity';

-- =============================================================================
-- PERFORMANCE TESTS
-- =============================================================================

-- Test 13: Query performance with RLS policies
EXPLAIN (ANALYZE, BUFFERS) 
SELECT i.*, o.name as opportunity_name, c.first_name || ' ' || c.last_name as contact_name
FROM public.interactions i
LEFT JOIN public.opportunities o ON i.opportunity_id = o.id
LEFT JOIN public.contacts c ON i.contact_id = c.id
WHERE i.deleted_at IS NULL
ORDER BY i.date DESC;

-- =============================================================================
-- SUMMARY REPORT
-- =============================================================================

-- Generate comprehensive test summary
SELECT 
    'INTERACTIONS RLS POLICY VERIFICATION SUMMARY' as report_title,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'interactions') as total_policies,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'interactions' AND indexname LIKE '%rls%') as rls_indexes,
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'interactions') as rls_enabled,
    (SELECT COUNT(*) FROM public.interactions WHERE deleted_at IS NULL) as visible_interactions,
    (SELECT COUNT(*) FROM public.interactions) as total_interactions;

-- Final verification message
SELECT 
    '=============================================================================',
    'RLS POLICY VERIFICATION COMPLETE',
    '=============================================================================',
    'Review the test results above to ensure all policies work correctly.',
    'All tests should show PASS status for proper security implementation.',
    '=============================================================================';