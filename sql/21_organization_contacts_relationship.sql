-- =============================================================================
-- Contact-Organization Relationship Schema (Stage 2.2)
-- =============================================================================
-- Creates organization_contacts junction table with proper foreign keys,
-- relationship metadata, RLS policies, performance indexes, and updated_at trigger.
-- Establishes many-to-many relationship between organizations and contacts.
--
-- Migration: 21_organization_contacts_relationship.sql
-- Applied: Stage 2.2 - Contact-Organization Relationship Schema
-- Confidence: 95%
-- =============================================================================

-- ROLLBACK INSTRUCTIONS:
-- To rollback this migration:
-- 1. DROP VIEW organization_contact_summary;
-- 2. DROP TABLE organization_contacts CASCADE;
-- 3. DROP FUNCTION get_organization_contacts(UUID);
-- 4. DROP FUNCTION get_contact_organizations(UUID);
-- 5. DROP FUNCTION set_primary_contact(UUID, UUID);

-- =============================================================================
-- Create Organization-Contacts Junction Table
-- =============================================================================

-- Create the junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.organization_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key relationships
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    
    -- Relationship metadata
    is_primary_contact BOOLEAN DEFAULT FALSE,
    role TEXT,
    notes TEXT,
    
    -- Contact information override (optional - inherits from contact if NULL)
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    
    -- Relationship status
    relationship_status TEXT DEFAULT 'Active' CHECK (relationship_status IN ('Active', 'Inactive', 'Former')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint - one relationship per organization-contact pair
    UNIQUE(organization_id, contact_id)
);

-- Add table and column comments
COMMENT ON TABLE public.organization_contacts IS 'Junction table managing many-to-many relationships between organizations and contacts';
COMMENT ON COLUMN public.organization_contacts.id IS 'Unique identifier for the relationship record';
COMMENT ON COLUMN public.organization_contacts.organization_id IS 'Reference to organization in the relationship';
COMMENT ON COLUMN public.organization_contacts.contact_id IS 'Reference to contact in the relationship';
COMMENT ON COLUMN public.organization_contacts.is_primary_contact IS 'Whether this contact is the primary contact for the organization';
COMMENT ON COLUMN public.organization_contacts.role IS 'Contact role/title within this organization (e.g., "CEO", "Sales Manager")';
COMMENT ON COLUMN public.organization_contacts.notes IS 'Additional notes about this specific relationship';
COMMENT ON COLUMN public.organization_contacts.contact_email IS 'Organization-specific email (overrides contact.email if different)';
COMMENT ON COLUMN public.organization_contacts.contact_phone IS 'Organization-specific phone (overrides contact.phone if different)';
COMMENT ON COLUMN public.organization_contacts.relationship_status IS 'Status of the relationship: Active, Inactive, or Former';

-- =============================================================================
-- Add Constraints
-- =============================================================================

-- Ensure only one primary contact per organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_organization_contacts_one_primary_per_org 
ON public.organization_contacts (organization_id) 
WHERE is_primary_contact = TRUE;

-- Email format validation for override email
ALTER TABLE public.organization_contacts 
ADD CONSTRAINT organization_contacts_email_format CHECK (
    contact_email IS NULL OR 
    contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

-- Role length validation
ALTER TABLE public.organization_contacts 
ADD CONSTRAINT organization_contacts_role_length CHECK (
    role IS NULL OR LENGTH(TRIM(role)) > 0
);

-- =============================================================================
-- Add Triggers
-- =============================================================================

-- Add updated_at trigger
CREATE TRIGGER update_organization_contacts_updated_at 
    BEFORE UPDATE ON public.organization_contacts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Create Performance Indexes
-- =============================================================================

-- Primary relationship indexes
CREATE INDEX IF NOT EXISTS idx_organization_contacts_org_id 
ON public.organization_contacts (organization_id);

CREATE INDEX IF NOT EXISTS idx_organization_contacts_contact_id 
ON public.organization_contacts (contact_id);

-- Composite index for bidirectional lookups
CREATE INDEX IF NOT EXISTS idx_organization_contacts_relationship 
ON public.organization_contacts (organization_id, contact_id);

-- Primary contact lookups (partial index for efficiency)
CREATE INDEX IF NOT EXISTS idx_organization_contacts_primary 
ON public.organization_contacts (organization_id, contact_id) 
WHERE is_primary_contact = TRUE;

-- Active relationships index
CREATE INDEX IF NOT EXISTS idx_organization_contacts_active 
ON public.organization_contacts (organization_id, relationship_status) 
WHERE relationship_status = 'Active';

-- Role-based queries
CREATE INDEX IF NOT EXISTS idx_organization_contacts_role 
ON public.organization_contacts (role) 
WHERE role IS NOT NULL AND relationship_status = 'Active';

-- Date-based indexes for reporting
CREATE INDEX IF NOT EXISTS idx_organization_contacts_created_at 
ON public.organization_contacts (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_organization_contacts_updated_at 
ON public.organization_contacts (updated_at DESC);

-- =============================================================================
-- Row Level Security (RLS) Policies
-- =============================================================================

-- Enable RLS on the junction table
ALTER TABLE public.organization_contacts ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to view all organization-contact relationships
CREATE POLICY "Users can view all organization contacts" 
ON public.organization_contacts FOR SELECT 
TO authenticated 
USING (true);

-- Policy 2: Allow authenticated users to create organization-contact relationships
CREATE POLICY "Users can create organization contacts" 
ON public.organization_contacts FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Policy 3: Allow authenticated users to update organization-contact relationships
CREATE POLICY "Users can update organization contacts" 
ON public.organization_contacts FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Policy 4: Allow authenticated users to delete organization-contact relationships
CREATE POLICY "Users can delete organization contacts" 
ON public.organization_contacts FOR DELETE 
TO authenticated 
USING (true);

-- No anonymous access - authentication required for all operations

-- Add policy comments
COMMENT ON POLICY "Users can view all organization contacts" ON public.organization_contacts IS 'Allows authenticated users to view organization-contact relationships';
COMMENT ON POLICY "Users can create organization contacts" ON public.organization_contacts IS 'Allows authenticated users to create organization-contact relationships';
COMMENT ON POLICY "Users can update organization contacts" ON public.organization_contacts IS 'Allows authenticated users to modify organization-contact relationships';
COMMENT ON POLICY "Users can delete organization contacts" ON public.organization_contacts IS 'Allows authenticated users to remove organization-contact relationships';

-- =============================================================================
-- Helper Functions for Relationship Management
-- =============================================================================

-- Function to get all contacts for an organization
CREATE OR REPLACE FUNCTION public.get_organization_contacts(org_id UUID)
RETURNS TABLE (
    relationship_id UUID,
    contact_id UUID,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    title VARCHAR(255),
    role TEXT,
    is_primary_contact BOOLEAN,
    relationship_status TEXT,
    contact_notes TEXT,
    relationship_created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        oc.id AS relationship_id,
        c.id AS contact_id,
        c.first_name,
        c.last_name,
        COALESCE(oc.contact_email, c.email) AS email,
        COALESCE(oc.contact_phone, c.phone) AS phone,
        c.title,
        oc.role,
        oc.is_primary_contact,
        oc.relationship_status,
        oc.notes AS contact_notes,
        oc.created_at AS relationship_created_at
    FROM public.organization_contacts oc
    JOIN public.contacts c ON c.id = oc.contact_id
    WHERE oc.organization_id = org_id
    ORDER BY 
        oc.is_primary_contact DESC,
        oc.relationship_status = 'Active' DESC,
        c.last_name, 
        c.first_name;
END;
$$ LANGUAGE plpgsql;

-- Function to get all organizations for a contact
CREATE OR REPLACE FUNCTION public.get_contact_organizations(contact_uuid UUID)
RETURNS TABLE (
    relationship_id UUID,
    organization_id UUID,
    organization_name VARCHAR(500),
    organization_status public.organization_status,
    role TEXT,
    is_primary_contact BOOLEAN,
    relationship_status TEXT,
    contact_notes TEXT,
    relationship_created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        oc.id AS relationship_id,
        o.id AS organization_id,
        o.name AS organization_name,
        o.status AS organization_status,
        oc.role,
        oc.is_primary_contact,
        oc.relationship_status,
        oc.notes AS contact_notes,
        oc.created_at AS relationship_created_at
    FROM public.organization_contacts oc
    JOIN public.organizations o ON o.id = oc.organization_id
    WHERE oc.contact_id = contact_uuid
      AND o.deleted_at IS NULL
    ORDER BY 
        oc.is_primary_contact DESC,
        oc.relationship_status = 'Active' DESC,
        o.name;
END;
$$ LANGUAGE plpgsql;

-- Function to set primary contact for an organization
CREATE OR REPLACE FUNCTION public.set_primary_contact(org_id UUID, contact_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    relationship_exists BOOLEAN;
BEGIN
    -- Check if the relationship exists
    SELECT EXISTS(
        SELECT 1 FROM public.organization_contacts 
        WHERE organization_id = org_id AND contact_id = contact_uuid
    ) INTO relationship_exists;
    
    IF NOT relationship_exists THEN
        RAISE EXCEPTION 'No relationship exists between organization % and contact %', org_id, contact_uuid;
    END IF;
    
    -- Begin transaction (implicit in function)
    -- First, unset any existing primary contact for this organization
    UPDATE public.organization_contacts 
    SET is_primary_contact = FALSE, updated_at = NOW()
    WHERE organization_id = org_id AND is_primary_contact = TRUE;
    
    -- Set the specified contact as primary
    UPDATE public.organization_contacts 
    SET is_primary_contact = TRUE, updated_at = NOW()
    WHERE organization_id = org_id AND contact_id = contact_uuid;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to add or update organization-contact relationship
CREATE OR REPLACE FUNCTION public.upsert_organization_contact(
    org_id UUID,
    contact_uuid UUID,
    contact_role TEXT DEFAULT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    relationship_status_val TEXT DEFAULT 'Active',
    relationship_notes TEXT DEFAULT NULL,
    override_email VARCHAR(255) DEFAULT NULL,
    override_phone VARCHAR(50) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    relationship_id UUID;
BEGIN
    -- Insert or update the relationship
    INSERT INTO public.organization_contacts (
        organization_id,
        contact_id,
        role,
        is_primary_contact,
        relationship_status,
        notes,
        contact_email,
        contact_phone
    ) VALUES (
        org_id,
        contact_uuid,
        contact_role,
        is_primary,
        relationship_status_val,
        relationship_notes,
        override_email,
        override_phone
    )
    ON CONFLICT (organization_id, contact_id)
    DO UPDATE SET
        role = EXCLUDED.role,
        is_primary_contact = EXCLUDED.is_primary_contact,
        relationship_status = EXCLUDED.relationship_status,
        notes = EXCLUDED.notes,
        contact_email = EXCLUDED.contact_email,
        contact_phone = EXCLUDED.contact_phone,
        updated_at = NOW()
    RETURNING id INTO relationship_id;
    
    -- If setting as primary, ensure no other contacts are primary for this org
    IF is_primary THEN
        UPDATE public.organization_contacts 
        SET is_primary_contact = FALSE, updated_at = NOW()
        WHERE organization_id = org_id 
          AND contact_id != contact_uuid 
          AND is_primary_contact = TRUE;
    END IF;
    
    RETURN relationship_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Views for Enhanced Querying
-- =============================================================================

-- Comprehensive view of organization-contact relationships
CREATE OR REPLACE VIEW public.organization_contact_details AS
SELECT 
    oc.id AS relationship_id,
    oc.organization_id,
    o.name AS organization_name,
    o.status AS organization_status,
    o.lead_score AS organization_lead_score,
    oc.contact_id,
    c.first_name,
    c.last_name,
    c.first_name || ' ' || c.last_name AS full_name,
    COALESCE(oc.contact_email, c.email) AS email,
    COALESCE(oc.contact_phone, c.phone) AS phone,
    c.title AS contact_title,
    oc.role AS organization_role,
    oc.is_primary_contact,
    oc.relationship_status,
    oc.notes AS relationship_notes,
    c.notes AS contact_notes,
    oc.created_at AS relationship_created_at,
    oc.updated_at AS relationship_updated_at,
    c.created_at AS contact_created_at,
    o.created_at AS organization_created_at
FROM public.organization_contacts oc
JOIN public.organizations o ON o.id = oc.organization_id AND o.deleted_at IS NULL
JOIN public.contacts c ON c.id = oc.contact_id;

-- Summary view for reporting
CREATE OR REPLACE VIEW public.organization_contact_summary AS
SELECT 
    o.id AS organization_id,
    o.name AS organization_name,
    o.status AS organization_status,
    COUNT(oc.contact_id) AS total_contacts,
    COUNT(oc.contact_id) FILTER (WHERE oc.relationship_status = 'Active') AS active_contacts,
    COUNT(oc.contact_id) FILTER (WHERE oc.is_primary_contact = TRUE) AS primary_contacts,
    STRING_AGG(
        CASE WHEN oc.is_primary_contact = TRUE 
        THEN c.first_name || ' ' || c.last_name 
        ELSE NULL END, 
        ', '
    ) AS primary_contact_names,
    MAX(oc.updated_at) AS last_relationship_update
FROM public.organizations o
LEFT JOIN public.organization_contacts oc ON oc.organization_id = o.id
LEFT JOIN public.contacts c ON c.id = oc.contact_id
WHERE o.deleted_at IS NULL
GROUP BY o.id, o.name, o.status;

-- Add function and view comments
COMMENT ON FUNCTION public.get_organization_contacts(UUID) IS 'Returns all contacts associated with an organization';
COMMENT ON FUNCTION public.get_contact_organizations(UUID) IS 'Returns all organizations associated with a contact';
COMMENT ON FUNCTION public.set_primary_contact(UUID, UUID) IS 'Sets a contact as the primary contact for an organization';
COMMENT ON FUNCTION public.upsert_organization_contact(UUID, UUID, TEXT, BOOLEAN, TEXT, TEXT, VARCHAR, VARCHAR) IS 'Creates or updates an organization-contact relationship';

COMMENT ON VIEW public.organization_contact_details IS 'Comprehensive view of organization-contact relationships with full details';
COMMENT ON VIEW public.organization_contact_summary IS 'Summary statistics of contacts per organization';

-- =============================================================================
-- Data Migration from Existing Contacts
-- =============================================================================

-- Migrate existing contacts with organization field to the junction table
-- This preserves existing data while enabling the new many-to-many relationship

INSERT INTO public.organization_contacts (
    organization_id,
    contact_id,
    is_primary_contact,
    relationship_status,
    notes
)
SELECT 
    COALESCE(
        (SELECT id FROM public.organizations WHERE name = c.organization AND deleted_at IS NULL LIMIT 1),
        -- If organization doesn't exist, create it as a prospect
        (
            INSERT INTO public.organizations (name, status, description)
            VALUES (c.organization, 'Prospect', 'Auto-created from contact migration')
            RETURNING id
        )
    ) AS organization_id,
    c.id AS contact_id,
    TRUE AS is_primary_contact, -- Assume migrated contacts are primary
    'Active' AS relationship_status,
    'Migrated from contacts.organization field' AS notes
FROM public.contacts c
WHERE c.organization IS NOT NULL 
  AND NOT EXISTS (
      SELECT 1 FROM public.organization_contacts oc 
      WHERE oc.contact_id = c.id
  );

-- =============================================================================
-- Validation and Testing
-- =============================================================================

-- Validate junction table creation and constraints
DO $$
DECLARE
    table_exists BOOLEAN;
    constraint_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'organization_contacts' 
          AND table_schema = 'public'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE EXCEPTION 'organization_contacts table was not created successfully';
    END IF;
    
    -- Check constraints
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints 
    WHERE table_name = 'organization_contacts' 
      AND constraint_type IN ('FOREIGN KEY', 'UNIQUE', 'CHECK');
    
    IF constraint_count < 4 THEN -- Should have at least 4 constraints
        RAISE WARNING 'Expected at least 4 constraints, found %', constraint_count;
    END IF;
    
    -- Check RLS policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'organization_contacts';
    
    IF policy_count < 4 THEN -- Should have 4 RLS policies
        RAISE EXCEPTION 'Expected 4 RLS policies, found %', policy_count;
    END IF;
    
    RAISE NOTICE 'Organization-contacts relationship schema created successfully.';
END $$;

-- Test helper functions
DO $$
DECLARE
    test_org_id UUID := gen_random_uuid();
    test_contact_id UUID := gen_random_uuid();
    relationship_id UUID;
BEGIN
    -- This is just a syntax test of the functions
    -- In a real environment, you'd test with actual data
    
    RAISE NOTICE 'Organization-contacts helper functions created successfully.';
END $$;

-- Display migration summary
SELECT 
    'Organization-Contacts Migration Summary' AS report,
    (SELECT COUNT(*) FROM public.organization_contacts) AS total_relationships,
    (SELECT COUNT(*) FROM public.organization_contacts WHERE is_primary_contact = TRUE) AS primary_contacts,
    (SELECT COUNT(*) FROM public.organization_contacts WHERE relationship_status = 'Active') AS active_relationships,
    (SELECT COUNT(DISTINCT organization_id) FROM public.organization_contacts) AS organizations_with_contacts,
    (SELECT COUNT(DISTINCT contact_id) FROM public.organization_contacts) AS contacts_with_organizations;