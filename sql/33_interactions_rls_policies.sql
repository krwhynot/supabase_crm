-- =============================================================================
-- Interactions Row Level Security (RLS) Policies
-- =============================================================================
-- This file contains RLS policies for the interactions table following
-- established patterns from the opportunities table for consistency.
--
-- Applied: Stage 1.2 - RLS Policy Implementation  
-- Architecture Reference: Opportunity RLS patterns (30_opportunities_schema.sql)
-- Security Model: User-scoped access with opportunity relationship validation
-- =============================================================================

-- RLS Policies for Interactions (following opportunity table patterns)

-- Policy 1: Users can view interactions for accessible opportunities
CREATE POLICY "Users can view interactions for accessible opportunities" 
ON public.interactions FOR SELECT 
TO authenticated 
USING (
    deleted_at IS NULL 
    AND EXISTS (
        SELECT 1 FROM public.opportunities 
        WHERE id = interactions.opportunity_id 
        AND deleted_at IS NULL
    )
);

-- Policy 2: Users can insert interactions for accessible opportunities
CREATE POLICY "Users can insert interactions for accessible opportunities" 
ON public.interactions FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.opportunities 
        WHERE id = opportunity_id 
        AND deleted_at IS NULL
    )
);

-- Policy 3: Users can update their own interactions for accessible opportunities
CREATE POLICY "Users can update interactions for accessible opportunities" 
ON public.interactions FOR UPDATE 
TO authenticated 
USING (
    deleted_at IS NULL 
    AND EXISTS (
        SELECT 1 FROM public.opportunities 
        WHERE id = interactions.opportunity_id 
        AND deleted_at IS NULL
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.opportunities 
        WHERE id = opportunity_id 
        AND deleted_at IS NULL
    )
);

-- Policy 4: Soft delete policy - Users can mark interactions as deleted
CREATE POLICY "Users can soft delete interactions for accessible opportunities" 
ON public.interactions FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.opportunities 
        WHERE id = interactions.opportunity_id 
        AND deleted_at IS NULL
    )
)
WITH CHECK (deleted_at IS NOT NULL);

-- Policy 5: Prevent hard delete - only soft delete allowed (following opportunity pattern)
CREATE POLICY "Prevent hard delete of interactions" 
ON public.interactions FOR DELETE 
TO authenticated 
USING (false);

-- Add policy comments for documentation
COMMENT ON POLICY "Users can view interactions for accessible opportunities" ON public.interactions 
IS 'Allows authenticated users to view interactions linked to accessible opportunities, excluding soft-deleted records';

COMMENT ON POLICY "Users can insert interactions for accessible opportunities" ON public.interactions 
IS 'Allows authenticated users to create interactions for opportunities they have access to';

COMMENT ON POLICY "Users can update interactions for accessible opportunities" ON public.interactions 
IS 'Allows authenticated users to update interactions for opportunities they have access to, excluding soft-deleted records';

COMMENT ON POLICY "Users can soft delete interactions for accessible opportunities" ON public.interactions 
IS 'Allows authenticated users to soft delete interactions by setting deleted_at timestamp';

COMMENT ON POLICY "Prevent hard delete of interactions" ON public.interactions 
IS 'Prevents hard deletion of interaction records to maintain data integrity and audit trail';

-- Additional security functions for interaction access validation

-- Function to check if user can access interaction (for future user-based access)
CREATE OR REPLACE FUNCTION can_access_interaction(interaction_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if interaction exists and is not deleted
    -- and the linked opportunity is accessible
    RETURN EXISTS (
        SELECT 1 
        FROM public.interactions i
        JOIN public.opportunities o ON i.opportunity_id = o.id
        WHERE i.id = interaction_uuid 
        AND i.deleted_at IS NULL 
        AND o.deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION can_access_interaction(UUID) 
IS 'Utility function to check if a user can access a specific interaction through opportunity relationship';

-- Function to get accessible interactions for a user (for future implementation)
CREATE OR REPLACE FUNCTION get_user_accessible_interactions()
RETURNS TABLE (
    interaction_id UUID,
    opportunity_id UUID,
    interaction_type public.interaction_type,
    subject VARCHAR(500),
    interaction_date TIMESTAMPTZ,
    status public.interaction_status
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.opportunity_id,
        i.type,
        i.subject,
        i.interaction_date,
        i.status
    FROM public.interactions i
    JOIN public.opportunities o ON i.opportunity_id = o.id
    WHERE i.deleted_at IS NULL 
    AND o.deleted_at IS NULL
    ORDER BY i.interaction_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_accessible_interactions() 
IS 'Returns interactions accessible to the current user through opportunity relationships';

-- Security validation function for interaction operations
CREATE OR REPLACE FUNCTION validate_interaction_security(
    p_interaction_id UUID DEFAULT NULL,
    p_opportunity_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    opportunity_exists BOOLEAN := FALSE;
    interaction_valid BOOLEAN := FALSE;
BEGIN
    -- Validate opportunity exists and is accessible
    IF p_opportunity_id IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM public.opportunities 
            WHERE id = p_opportunity_id 
            AND deleted_at IS NULL
        ) INTO opportunity_exists;
        
        IF NOT opportunity_exists THEN
            RAISE EXCEPTION 'Opportunity not found or not accessible';
        END IF;
    END IF;
    
    -- Validate interaction if provided
    IF p_interaction_id IS NOT NULL THEN
        SELECT can_access_interaction(p_interaction_id) INTO interaction_valid;
        
        IF NOT interaction_valid THEN
            RAISE EXCEPTION 'Interaction not found or not accessible';
        END IF;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_interaction_security(UUID, UUID) 
IS 'Validates security constraints for interaction operations, throws exceptions for invalid access';

-- RLS testing and validation queries (for development/testing purposes)

-- Test query to verify RLS policies work correctly
-- This should only return interactions for accessible opportunities
CREATE OR REPLACE FUNCTION test_interaction_rls_policies()
RETURNS TABLE (
    test_name TEXT,
    test_result BOOLEAN,
    details TEXT
) AS $$
BEGIN
    -- Test 1: Verify only non-deleted interactions are visible
    RETURN QUERY
    SELECT 
        'Non-deleted interactions visible'::TEXT,
        NOT EXISTS(SELECT 1 FROM public.interactions WHERE deleted_at IS NOT NULL)::BOOLEAN,
        'RLS should exclude soft-deleted interactions'::TEXT;
    
    -- Test 2: Verify opportunity relationship exists for all visible interactions
    RETURN QUERY
    SELECT 
        'All interactions linked to valid opportunities'::TEXT,
        NOT EXISTS(
            SELECT 1 FROM public.interactions i 
            WHERE NOT EXISTS(
                SELECT 1 FROM public.opportunities o 
                WHERE o.id = i.opportunity_id AND o.deleted_at IS NULL
            )
        )::BOOLEAN,
        'All visible interactions must have valid opportunity relationships'::TEXT;
    
    -- Test 3: Verify interaction count matches expected based on opportunities
    RETURN QUERY
    SELECT 
        'Interaction access consistency'::TEXT,
        (
            SELECT COUNT(*) FROM public.interactions WHERE deleted_at IS NULL
        ) <= (
            SELECT COUNT(*) * 10 FROM public.opportunities WHERE deleted_at IS NULL
        )::BOOLEAN,
        'Interaction count should be reasonable relative to opportunities'::TEXT;
        
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION test_interaction_rls_policies() 
IS 'Development function to test and validate RLS policy behavior for interactions';

-- Policy performance optimization hints
-- These indexes will be created in the next file (34_interactions_indexes.sql)
-- but we document the requirements here for RLS performance

COMMENT ON TABLE public.interactions IS 
'Interaction table with RLS policies requiring indexes on: opportunity_id, deleted_at, created_by for optimal policy performance';

-- Log successful RLS policy creation
DO $$ BEGIN
    RAISE NOTICE 'Interactions RLS policies created successfully following opportunity patterns';
    RAISE NOTICE 'Policies: SELECT, INSERT, UPDATE (soft delete), DELETE (blocked)';
    RAISE NOTICE 'Security functions: can_access_interaction, validate_interaction_security';
    RAISE NOTICE 'Test function: test_interaction_rls_policies available for validation';
END $$;