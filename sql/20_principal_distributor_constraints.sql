-- =============================================================================
-- Principal/Distributor Custom Fields Constraints and Indexes
-- =============================================================================
-- Adds check constraint for mutual exclusivity (cannot be both principal AND distributor)
-- Creates performance indexes for is_principal and is_distributor custom field queries
-- Optimizes performance for these boolean field lookups.
--
-- Migration: 20_principal_distributor_constraints.sql
-- Applied: Stage 2.1 - Principal/Distributor Custom Fields Enhancement
-- Confidence: 95%
-- =============================================================================

-- ROLLBACK INSTRUCTIONS:
-- To rollback this migration:
-- 1. DROP INDEX idx_organizations_principal_only;
-- 2. DROP INDEX idx_organizations_distributor_only;
-- 3. DROP INDEX idx_organizations_business_type_composite;
-- 4. The mutual exclusivity constraint already exists from base schema
-- 5. Remove any added comments

-- =============================================================================
-- Verify Existing Constraint
-- =============================================================================

-- The mutual exclusivity constraint should already exist from the base schema
-- Let's verify it exists and add it if it doesn't

DO $$
BEGIN
    -- Check if the constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'organizations_principal_distributor_exclusive'
        AND table_name = 'organizations'
        AND constraint_type = 'CHECK'
    ) THEN
        -- Add the constraint if it doesn't exist
        ALTER TABLE public.organizations 
        ADD CONSTRAINT organizations_principal_distributor_exclusive 
        CHECK (NOT (is_principal = TRUE AND is_distributor = TRUE));
        
        RAISE NOTICE 'Added mutual exclusivity constraint for principal/distributor fields';
    ELSE
        RAISE NOTICE 'Mutual exclusivity constraint already exists';  
    END IF;
END $$;

-- =============================================================================
-- Enhanced Constraint Validation
-- =============================================================================

-- Add additional constraints to ensure data integrity

-- Ensure that if an organization is a distributor, it cannot reference itself as distributor
ALTER TABLE public.organizations 
DROP CONSTRAINT IF EXISTS organizations_no_self_distributor_enhanced;

ALTER TABLE public.organizations 
ADD CONSTRAINT organizations_no_self_distributor_enhanced 
CHECK (
    distributor_id IS NULL OR 
    (distributor_id != id AND is_distributor = FALSE)
);

-- Ensure that only non-distributors can have a distributor_id
ALTER TABLE public.organizations 
ADD CONSTRAINT organizations_distributor_logic 
CHECK (
    (is_distributor = TRUE AND distributor_id IS NULL) OR
    (is_distributor = FALSE) OR
    (is_distributor IS NULL)
);

-- =============================================================================
-- Performance Indexes for Boolean Columns
-- =============================================================================

-- Partial indexes are ideal for boolean columns where we mainly query for TRUE values
-- These indexes will only include rows where the boolean is TRUE, making them very efficient

-- Index for organizations that are principals (only TRUE values)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_principal_only 
ON public.organizations (id, name, status, lead_score) 
WHERE is_principal = TRUE AND deleted_at IS NULL;

-- Index for organizations that are distributors (only TRUE values)  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_distributor_only 
ON public.organizations (id, name, status, lead_score) 
WHERE is_distributor = TRUE AND deleted_at IS NULL;

-- Composite index for business relationship queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_business_type_composite 
ON public.organizations (is_principal, is_distributor, status) 
WHERE deleted_at IS NULL AND (is_principal = TRUE OR is_distributor = TRUE);

-- Index for distributor relationships (non-distributors with distributor_id)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_distributor_relationships 
ON public.organizations (distributor_id, status) 
WHERE distributor_id IS NOT NULL AND deleted_at IS NULL;

-- Index for finding all organizations under a specific distributor
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_by_distributor 
ON public.organizations (distributor_id, name) 
WHERE distributor_id IS NOT NULL AND deleted_at IS NULL;

-- =============================================================================
-- Business Logic Helper Functions
-- =============================================================================

-- Function to get all principals
CREATE OR REPLACE FUNCTION public.get_principal_organizations()
RETURNS TABLE (
    id UUID,
    name VARCHAR(500),
    status public.organization_status,
    lead_score INTEGER,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT o.id, o.name, o.status, o.lead_score, o.created_at
    FROM public.organizations o
    WHERE o.is_principal = TRUE 
      AND o.deleted_at IS NULL
    ORDER BY o.name;
END;
$$ LANGUAGE plpgsql;

-- Function to get all distributors
CREATE OR REPLACE FUNCTION public.get_distributor_organizations()
RETURNS TABLE (
    id UUID,
    name VARCHAR(500),
    status public.organization_status,
    lead_score INTEGER,
    client_count BIGINT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id, 
        o.name, 
        o.status, 
        o.lead_score,
        COUNT(clients.id) AS client_count,
        o.created_at
    FROM public.organizations o
    LEFT JOIN public.organizations clients ON clients.distributor_id = o.id 
        AND clients.deleted_at IS NULL
    WHERE o.is_distributor = TRUE 
      AND o.deleted_at IS NULL
    GROUP BY o.id, o.name, o.status, o.lead_score, o.created_at
    ORDER BY o.name;
END;
$$ LANGUAGE plpgsql;

-- Function to get organizations under a specific distributor
CREATE OR REPLACE FUNCTION public.get_organizations_by_distributor(distributor_uuid UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(500),
    status public.organization_status,
    lead_score INTEGER,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT o.id, o.name, o.status, o.lead_score, o.created_at
    FROM public.organizations o
    WHERE o.distributor_id = distributor_uuid 
      AND o.deleted_at IS NULL
    ORDER BY o.name;
END;
$$ LANGUAGE plpgsql;

-- Function to validate business relationship logic
CREATE OR REPLACE FUNCTION public.validate_business_relationship(
    org_id UUID,
    is_principal_val BOOLEAN,
    is_distributor_val BOOLEAN,
    distributor_id_val UUID
) RETURNS BOOLEAN AS $$
BEGIN
    -- Cannot be both principal and distributor
    IF is_principal_val = TRUE AND is_distributor_val = TRUE THEN
        RETURN FALSE;
    END IF;
    
    -- If is_distributor is TRUE, distributor_id must be NULL
    IF is_distributor_val = TRUE AND distributor_id_val IS NOT NULL THEN
        RETURN FALSE;
    END IF;
    
    -- distributor_id cannot reference self
    IF distributor_id_val = org_id THEN
        RETURN FALSE;
    END IF;
    
    -- If distributor_id is set, the referenced org must be a distributor
    IF distributor_id_val IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.organizations 
            WHERE id = distributor_id_val 
              AND is_distributor = TRUE 
              AND deleted_at IS NULL
        ) THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Enhanced Views for Business Relationships
-- =============================================================================

-- View showing business relationship hierarchy
CREATE OR REPLACE VIEW public.organization_business_relationships AS
SELECT 
    o.id,
    o.name,
    o.status,
    o.is_principal,
    o.is_distributor,
    o.distributor_id,
    d.name AS distributor_name,
    d.status AS distributor_status,
    CASE 
        WHEN o.is_principal = TRUE THEN 'Principal'
        WHEN o.is_distributor = TRUE THEN 'Distributor'
        WHEN o.distributor_id IS NOT NULL THEN 'Client of Distributor'
        ELSE 'Standard Organization'
    END AS business_relationship_type,
    -- Count of organizations under this distributor (if applicable)
    CASE 
        WHEN o.is_distributor = TRUE THEN (
            SELECT COUNT(*) 
            FROM public.organizations clients 
            WHERE clients.distributor_id = o.id 
              AND clients.deleted_at IS NULL
        )
        ELSE NULL
    END AS client_count
FROM public.organizations o
LEFT JOIN public.organizations d ON d.id = o.distributor_id 
    AND d.deleted_at IS NULL
WHERE o.deleted_at IS NULL;

-- View for distributor performance metrics
CREATE OR REPLACE VIEW public.distributor_performance AS
SELECT 
    d.id AS distributor_id,
    d.name AS distributor_name,
    d.status AS distributor_status,
    d.created_at AS distributor_created_at,
    COUNT(c.id) AS total_clients,
    COUNT(c.id) FILTER (WHERE c.status = 'Active Customer') AS active_customers,
    COUNT(c.id) FILTER (WHERE c.status = 'Prospect') AS prospects,
    AVG(c.lead_score) AS avg_client_lead_score,
    MAX(c.last_contact_date) AS last_client_contact,
    MIN(c.created_at) AS first_client_acquired
FROM public.organizations d
LEFT JOIN public.organizations c ON c.distributor_id = d.id 
    AND c.deleted_at IS NULL
WHERE d.is_distributor = TRUE 
  AND d.deleted_at IS NULL
GROUP BY d.id, d.name, d.status, d.created_at;

-- Add comments for documentation
COMMENT ON FUNCTION public.get_principal_organizations() IS 'Returns all organizations marked as principals';
COMMENT ON FUNCTION public.get_distributor_organizations() IS 'Returns all organizations marked as distributors with client counts';
COMMENT ON FUNCTION public.get_organizations_by_distributor(UUID) IS 'Returns all organizations under a specific distributor';
COMMENT ON FUNCTION public.validate_business_relationship(UUID, BOOLEAN, BOOLEAN, UUID) IS 'Validates business relationship logic for principals and distributors';

COMMENT ON VIEW public.organization_business_relationships IS 'Shows the business relationship hierarchy between organizations';
COMMENT ON VIEW public.distributor_performance IS 'Performance metrics for distributor organizations';

-- =============================================================================
-- Index Performance Comments
-- =============================================================================

COMMENT ON INDEX idx_organizations_principal_only IS 'Partial index for principal organizations - high performance for principal queries';
COMMENT ON INDEX idx_organizations_distributor_only IS 'Partial index for distributor organizations - high performance for distributor queries';
COMMENT ON INDEX idx_organizations_business_type_composite IS 'Composite index for business relationship type queries';
COMMENT ON INDEX idx_organizations_distributor_relationships IS 'Index for finding organizations with distributor relationships';
COMMENT ON INDEX idx_organizations_by_distributor IS 'Index for finding all clients of a specific distributor';

-- =============================================================================
-- Validation and Testing
-- =============================================================================

-- Test constraint violations
DO $$
DECLARE
    violation_count INTEGER;
BEGIN
    -- Check for any existing constraint violations
    SELECT COUNT(*) INTO violation_count
    FROM public.organizations 
    WHERE is_principal = TRUE AND is_distributor = TRUE;
    
    IF violation_count > 0 THEN
        RAISE EXCEPTION 'Constraint violation: % organizations are marked as both principal AND distributor', violation_count;
    END IF;
    
    -- Check for invalid distributor relationships
    SELECT COUNT(*) INTO violation_count
    FROM public.organizations o
    WHERE o.distributor_id IS NOT NULL 
      AND NOT EXISTS (
          SELECT 1 FROM public.organizations d
          WHERE d.id = o.distributor_id 
            AND d.is_distributor = TRUE 
            AND d.deleted_at IS NULL
      );
    
    IF violation_count > 0 THEN
        RAISE WARNING 'Data integrity issue: % organizations reference invalid distributors', violation_count;
    END IF;
    
    RAISE NOTICE 'Principal/Distributor constraints validation completed successfully.';
END $$;

-- Test helper functions
DO $$
DECLARE
    test_result BOOLEAN;
BEGIN
    -- Test valid relationship
    SELECT public.validate_business_relationship(
        gen_random_uuid(), 
        TRUE,  -- is_principal
        FALSE, -- is_distributor
        NULL   -- distributor_id
    ) INTO test_result;
    
    IF NOT test_result THEN
        RAISE EXCEPTION 'validate_business_relationship function test failed for valid principal';
    END IF;
    
    -- Test invalid relationship (both principal and distributor)
    SELECT public.validate_business_relationship(
        gen_random_uuid(), 
        TRUE,  -- is_principal
        TRUE,  -- is_distributor (invalid combination)
        NULL   -- distributor_id
    ) INTO test_result;
    
    IF test_result THEN
        RAISE EXCEPTION 'validate_business_relationship function test failed - should reject principal+distributor combination';
    END IF;
    
    RAISE NOTICE 'Business relationship validation functions are working correctly.';
END $$;

-- Display business relationship summary
SELECT 
    'Business Relationship Summary' AS report,
    COUNT(*) AS total_organizations,
    COUNT(*) FILTER (WHERE is_principal = TRUE) AS principals_count,
    COUNT(*) FILTER (WHERE is_distributor = TRUE) AS distributors_count,
    COUNT(*) FILTER (WHERE distributor_id IS NOT NULL) AS organizations_with_distributor,
    COUNT(*) FILTER (WHERE is_principal = FALSE AND is_distributor = FALSE AND distributor_id IS NULL) AS standard_organizations
FROM public.organizations
WHERE deleted_at IS NULL;