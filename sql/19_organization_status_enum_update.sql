-- =============================================================================
-- Organization Status Enum Updates for Organization Form Redesign
-- =============================================================================
-- Updates the organization_status enum to include the new status values:
-- 'Prospect', 'Active Customer', 'Inactive Customer', 'Other', 'Principal', 'Distributor'
-- while maintaining backward compatibility.
--
-- Migration: 19_organization_status_enum_update.sql
-- Applied: Stage 2.1 - Enhanced Organization Status Schema
-- Confidence: 95%
-- =============================================================================

-- ROLLBACK INSTRUCTIONS:
-- To rollback this migration:
-- 1. Update any records using new enum values to old values
-- 2. DROP TYPE organization_status_new CASCADE;
-- 3. Recreate original enum if needed
-- Note: PostgreSQL enum rollbacks are complex and may require downtime

-- =============================================================================
-- Check Current Enum Values
-- =============================================================================

-- Display current enum values for reference
SELECT 
    'Current organization_status enum values:' AS info,
    unnest(enum_range(NULL::public.organization_status)) AS current_values;

-- =============================================================================
-- Add New Enum Values
-- =============================================================================

-- PostgreSQL allows adding enum values without recreating the type
-- Add new enum values if they don't already exist

-- Check and add 'Prospect' (may already exist)
DO $$
BEGIN
    BEGIN
        ALTER TYPE public.organization_status ADD VALUE IF NOT EXISTS 'Prospect';
    EXCEPTION
        WHEN duplicate_object THEN
            NULL; -- Value already exists, ignore
    END;
END $$;

-- Add 'Active Customer'
DO $$
BEGIN
    BEGIN
        ALTER TYPE public.organization_status ADD VALUE IF NOT EXISTS 'Active Customer';
    EXCEPTION
        WHEN duplicate_object THEN
            NULL; -- Value already exists, ignore
    END;
END $$;

-- Add 'Inactive Customer'  
DO $$
BEGIN
    BEGIN
        ALTER TYPE public.organization_status ADD VALUE IF NOT EXISTS 'Inactive Customer';
    EXCEPTION
        WHEN duplicate_object THEN
            NULL; -- Value already exists, ignore
    END;
END $$;

-- Add 'Other'
DO $$
BEGIN
    BEGIN
        ALTER TYPE public.organization_status ADD VALUE IF NOT EXISTS 'Other';
    EXCEPTION
        WHEN duplicate_object THEN
            NULL; -- Value already exists, ignore
    END;
END $$;

-- Add 'Principal'
DO $$
BEGIN
    BEGIN
        ALTER TYPE public.organization_status ADD VALUE IF NOT EXISTS 'Principal';
    EXCEPTION
        WHEN duplicate_object THEN
            NULL; -- Value already exists, ignore
    END;
END $$;

-- Add 'Distributor'
DO $$
BEGIN
    BEGIN
        ALTER TYPE public.organization_status ADD VALUE IF NOT EXISTS 'Distributor';
    EXCEPTION
        WHEN duplicate_object THEN
            NULL; -- Value already exists, ignore
    END;
END $$;

-- =============================================================================
-- Data Migration Strategy
-- =============================================================================

-- Map existing status values to new ones if needed
-- This preserves data integrity while upgrading to new status options

-- Update 'Customer' to 'Active Customer' (if any exist)
UPDATE public.organizations 
SET status = 'Active Customer'
WHERE status = 'Customer';

-- Map any 'Partner' status to 'Other' or keep as is
-- (Keeping 'Partner' as it's still valid, but noting it for review)

-- No other automatic mapping needed as most current values remain valid

-- =============================================================================
-- Create Status Helper Functions
-- =============================================================================

-- Function to validate if an organization status is customer-related
CREATE OR REPLACE FUNCTION public.is_customer_status(status_value public.organization_status)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN status_value IN ('Active Customer', 'Inactive Customer', 'Customer');
END;
$$ LANGUAGE plpgsql;

-- Function to get customer organizations
CREATE OR REPLACE FUNCTION public.get_customer_organizations()
RETURNS TABLE (
    id UUID,
    name VARCHAR(500),
    status public.organization_status,
    lead_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT o.id, o.name, o.status, o.lead_score
    FROM public.organizations o
    WHERE o.status IN ('Active Customer', 'Inactive Customer', 'Customer')
      AND o.deleted_at IS NULL
    ORDER BY o.name;
END;
$$ LANGUAGE plpgsql;

-- Function to categorize organization by business relationship
CREATE OR REPLACE FUNCTION public.get_organization_category(org_status public.organization_status)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE org_status
        WHEN 'Active Customer' THEN 'Customer'
        WHEN 'Inactive Customer' THEN 'Customer'
        WHEN 'Customer' THEN 'Customer'
        WHEN 'Prospect' THEN 'Prospect'
        WHEN 'Principal' THEN 'Business Partner'
        WHEN 'Distributor' THEN 'Business Partner'
        WHEN 'Partner' THEN 'Business Partner'
        WHEN 'Vendor' THEN 'Vendor'
        ELSE 'Other'
    END;
END;
$$ LANGUAGE plpgsql;

-- Add comments for helper functions
COMMENT ON FUNCTION public.is_customer_status(public.organization_status) IS 'Returns true if the status represents a customer relationship';
COMMENT ON FUNCTION public.get_customer_organizations() IS 'Returns all organizations with customer status';
COMMENT ON FUNCTION public.get_organization_category(public.organization_status) IS 'Categorizes organization status into broader business relationship types';

-- =============================================================================
-- Create Enhanced Organization Status View
-- =============================================================================

-- Create a view that includes status categories and metadata
CREATE OR REPLACE VIEW public.organizations_with_status_info AS
SELECT 
    o.*,
    public.get_organization_category(o.status) AS status_category,
    public.is_customer_status(o.status) AS is_customer,
    CASE 
        WHEN o.status = 'Principal' THEN TRUE
        WHEN o.is_principal = TRUE THEN TRUE
        ELSE FALSE
    END AS is_principal_org,
    CASE 
        WHEN o.status = 'Distributor' THEN TRUE
        WHEN o.is_distributor = TRUE THEN TRUE
        ELSE FALSE
    END AS is_distributor_org
FROM public.organizations o;

COMMENT ON VIEW public.organizations_with_status_info IS 'Organizations view with enhanced status categorization and business relationship flags';

-- =============================================================================
-- Update Index for New Enum Values
-- =============================================================================

-- The existing status index will automatically include new enum values
-- But we may want to analyze and potentially recreate for optimal performance

-- Analyze the status distribution
ANALYZE public.organizations;

-- =============================================================================
-- Validation and Testing
-- =============================================================================

-- Verify all current enum values are valid
DO $$
DECLARE
    invalid_count INTEGER;
    status_count INTEGER;
BEGIN
    -- Check for any invalid status values (shouldn't be any due to enum constraint)
    SELECT COUNT(*) INTO status_count
    FROM public.organizations 
    WHERE status IS NOT NULL;
    
    RAISE NOTICE 'Total organizations with status: %', status_count;
    
    -- Verify enum expansion worked
    SELECT COUNT(*) INTO invalid_count
    FROM unnest(enum_range(NULL::public.organization_status)) AS enum_val
    WHERE enum_val::TEXT IN ('Active Customer', 'Inactive Customer', 'Other', 'Principal', 'Distributor');
    
    IF invalid_count < 5 THEN
        RAISE EXCEPTION 'Migration failed: Not all new enum values were added. Found % of 5 expected values.', invalid_count;
    END IF;
    
    RAISE NOTICE 'Organization status enum migration completed successfully. All new values added.';
END $$;

-- Display updated enum values
SELECT 
    'Updated organization_status enum values:' AS info,
    unnest(enum_range(NULL::public.organization_status)) AS updated_values
ORDER BY updated_values;

-- Display current status distribution
SELECT 
    'Organization Status Distribution' AS report,
    status,
    COUNT(*) AS count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentage
FROM public.organizations
WHERE deleted_at IS NULL
GROUP BY status
ORDER BY count DESC;

-- Test helper functions
DO $$
BEGIN
    -- Test is_customer_status function
    IF NOT public.is_customer_status('Active Customer'::public.organization_status) THEN
        RAISE EXCEPTION 'is_customer_status function test failed for Active Customer';
    END IF;
    
    IF public.is_customer_status('Prospect'::public.organization_status) THEN
        RAISE EXCEPTION 'is_customer_status function test failed for Prospect';
    END IF;
    
    -- Test get_organization_category function
    IF public.get_organization_category('Principal'::public.organization_status) != 'Business Partner' THEN
        RAISE EXCEPTION 'get_organization_category function test failed for Principal';
    END IF;
    
    RAISE NOTICE 'Organization status helper functions are working correctly.';
END $$;