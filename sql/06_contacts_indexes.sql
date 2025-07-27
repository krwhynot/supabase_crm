-- =============================================================================
-- Performance Indexes for Contacts Table
-- =============================================================================
-- This file contains performance optimization indexes for the contacts table
-- to support efficient search and analytics operations.
--
-- Applied: Stage 1 - Database Implementation
-- Confidence: 90%
-- =============================================================================

-- Index 1: Email lookup (unique constraint already creates an index)
-- The unique constraint on email automatically creates an index, so no additional index needed

-- Index 2: Name-based search index
-- Composite index for efficient name searches (last_name, first_name)
CREATE INDEX IF NOT EXISTS idx_contacts_name 
ON public.contacts (last_name, first_name);

-- Index 3: Organization-based search index  
-- For filtering and grouping contacts by organization
CREATE INDEX IF NOT EXISTS idx_contacts_organization 
ON public.contacts (organization);

-- Index 4: Full-text search index for contact search
-- GIN index for efficient text search across multiple fields
CREATE INDEX IF NOT EXISTS idx_contacts_search 
ON public.contacts USING GIN (
    to_tsvector('english', 
        COALESCE(first_name, '') || ' ' || 
        COALESCE(last_name, '') || ' ' || 
        COALESCE(organization, '') || ' ' || 
        COALESCE(email, '') || ' ' ||
        COALESCE(title, '') || ' ' ||
        COALESCE(notes, '')
    )
);

-- Index 5: Created date index for analytics and recent contacts
CREATE INDEX IF NOT EXISTS idx_contacts_created_at 
ON public.contacts (created_at DESC);

-- Index 6: Updated date index for tracking recent changes
CREATE INDEX IF NOT EXISTS idx_contacts_updated_at 
ON public.contacts (updated_at DESC);

-- Index 7: Phone number index for phone-based lookups
CREATE INDEX IF NOT EXISTS idx_contacts_phone 
ON public.contacts (phone) 
WHERE phone IS NOT NULL;

-- Index 8: Composite index for pagination (organization + name)
-- Optimizes queries that filter by organization and sort by name
CREATE INDEX IF NOT EXISTS idx_contacts_org_name 
ON public.contacts (organization, last_name, first_name);

-- Add comments for documentation
COMMENT ON INDEX idx_contacts_name IS 'Optimizes name-based sorting and searching';
COMMENT ON INDEX idx_contacts_organization IS 'Optimizes organization filtering and grouping';
COMMENT ON INDEX idx_contacts_search IS 'Enables full-text search across all contact fields';
COMMENT ON INDEX idx_contacts_created_at IS 'Optimizes queries for recent contacts and analytics';
COMMENT ON INDEX idx_contacts_updated_at IS 'Optimizes queries for recently modified contacts';
COMMENT ON INDEX idx_contacts_phone IS 'Optimizes phone number lookups (sparse index)';
COMMENT ON INDEX idx_contacts_org_name IS 'Optimizes organization-filtered name sorting for pagination';