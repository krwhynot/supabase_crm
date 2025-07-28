-- =============================================================================
-- Contacts-Organizations Relationship Migration
-- =============================================================================
-- This file migrates the contacts table to establish proper relationships
-- with the organizations table. Converts string organization field to FK.
--
-- Applied: Stage 1 - Database Implementation
-- Confidence: 88%
-- =============================================================================

-- Step 1: Add new organization_id column to contacts table
ALTER TABLE public.contacts 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- Step 2: Add index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_contacts_organization_id 
ON public.contacts(organization_id);

-- Step 3: Add comments for new column
COMMENT ON COLUMN public.contacts.organization_id IS 'Foreign key reference to organizations table (replaces organization string field)';

-- Step 4: Create function to migrate existing organization data
CREATE OR REPLACE FUNCTION migrate_contact_organizations()
RETURNS TABLE(
    contact_id UUID,
    contact_name TEXT,
    org_string TEXT,
    org_id UUID,
    action TEXT
) AS $$
BEGIN
    -- This function will be used to migrate existing organization strings
    -- to proper organization records and foreign key relationships
    
    RETURN QUERY
    WITH org_migration AS (
        -- Find all unique organization names from contacts
        SELECT DISTINCT 
            c.organization as org_name,
            o.id as existing_org_id
        FROM public.contacts c
        LEFT JOIN public.organizations o ON LOWER(TRIM(c.organization)) = LOWER(TRIM(o.name))
        WHERE c.organization IS NOT NULL 
        AND LENGTH(TRIM(c.organization)) > 0
    )
    SELECT 
        c.id as contact_id,
        (c.first_name || ' ' || c.last_name) as contact_name,
        c.organization as org_string,
        om.existing_org_id as org_id,
        CASE 
            WHEN om.existing_org_id IS NOT NULL THEN 'LINK_EXISTING'
            ELSE 'CREATE_NEW'
        END as action
    FROM public.contacts c
    LEFT JOIN org_migration om ON LOWER(TRIM(c.organization)) = LOWER(TRIM(om.org_name))
    WHERE c.organization IS NOT NULL 
    AND LENGTH(TRIM(c.organization)) > 0
    ORDER BY c.organization, c.last_name, c.first_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION migrate_contact_organizations() IS 'Helper function to analyze and migrate contact organization strings to FK relationships';

-- Step 5: Create function to auto-create organizations from contact data
CREATE OR REPLACE FUNCTION auto_create_organizations_from_contacts()
RETURNS TABLE(
    organization_name TEXT,
    organization_id UUID,
    contact_count INTEGER
) AS $$
BEGIN
    -- Create organizations for any contact organization strings that don't exist
    INSERT INTO public.organizations (name, status, created_at)
    SELECT DISTINCT 
        TRIM(c.organization) as name,
        'Prospect' as status,
        NOW() as created_at
    FROM public.contacts c
    LEFT JOIN public.organizations o ON LOWER(TRIM(c.organization)) = LOWER(TRIM(o.name))
    WHERE c.organization IS NOT NULL 
    AND LENGTH(TRIM(c.organization)) > 0
    AND o.id IS NULL;
    
    -- Return created organizations with contact counts
    RETURN QUERY
    SELECT 
        o.name as organization_name,
        o.id as organization_id,
        COUNT(c.id)::INTEGER as contact_count
    FROM public.organizations o
    INNER JOIN public.contacts c ON LOWER(TRIM(c.organization)) = LOWER(TRIM(o.name))
    WHERE o.created_at >= NOW() - INTERVAL '1 minute'  -- Recently created
    GROUP BY o.name, o.id
    ORDER BY contact_count DESC, o.name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_create_organizations_from_contacts() IS 'Auto-creates organization records from existing contact organization strings';

-- Step 6: Create function to link contacts to organizations
CREATE OR REPLACE FUNCTION link_contacts_to_organizations()
RETURNS TABLE(
    contact_id UUID,
    contact_name TEXT,
    organization_name TEXT,
    organization_id UUID,
    linked BOOLEAN
) AS $$
BEGIN
    -- Update contacts to link them to organizations
    UPDATE public.contacts 
    SET organization_id = o.id
    FROM public.organizations o
    WHERE LOWER(TRIM(public.contacts.organization)) = LOWER(TRIM(o.name))
    AND public.contacts.organization_id IS NULL;
    
    -- Return results of linking
    RETURN QUERY
    SELECT 
        c.id as contact_id,
        (c.first_name || ' ' || c.last_name) as contact_name,
        o.name as organization_name,
        o.id as organization_id,
        (c.organization_id IS NOT NULL) as linked
    FROM public.contacts c
    LEFT JOIN public.organizations o ON c.organization_id = o.id
    WHERE c.organization IS NOT NULL 
    AND LENGTH(TRIM(c.organization)) > 0
    ORDER BY o.name, c.last_name, c.first_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION link_contacts_to_organizations() IS 'Links existing contacts to their corresponding organization records';

-- Step 7: Add constraint to ensure data integrity during migration
-- (This will be enabled after migration is complete)
-- ALTER TABLE public.contacts 
-- ADD CONSTRAINT contacts_org_consistency CHECK (
--     (organization IS NULL AND organization_id IS NULL) OR
--     (organization IS NOT NULL AND organization_id IS NOT NULL)
-- );

-- Future Step: After migration is verified, the string organization column can be made optional
-- and eventually removed in favor of the organization_id FK relationship

-- Migration Usage Instructions:
-- 1. Run: SELECT * FROM migrate_contact_organizations(); -- To analyze current data
-- 2. Run: SELECT * FROM auto_create_organizations_from_contacts(); -- To create missing orgs
-- 3. Run: SELECT * FROM link_contacts_to_organizations(); -- To establish FK relationships
-- 4. Verify data integrity
-- 5. Eventually deprecate string organization column in favor of organization_id FK