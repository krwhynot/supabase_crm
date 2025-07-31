-- Migration: Add Principal/Distributor flags to organizations table
-- Date: 2025-01-31
-- Description: Adds is_principal and is_distributor boolean fields to support new organization form requirements

-- Start transaction for safety
BEGIN;

-- Add new boolean columns for Principal/Distributor flags
-- Using DEFAULT false and NOT NULL for data integrity
ALTER TABLE organizations 
ADD COLUMN is_principal boolean DEFAULT false NOT NULL,
ADD COLUMN is_distributor boolean DEFAULT false NOT NULL;

-- Add helpful comments
COMMENT ON COLUMN organizations.is_principal IS 'Whether organization is a Principal brand manufacturer';
COMMENT ON COLUMN organizations.is_distributor IS 'Whether organization is a Distributor/reseller';

-- Performance indexes for new filtering requirements
-- Primary filtering index for Principal/Distributor flags with status
CREATE INDEX idx_organizations_flags_status ON organizations (is_principal, is_distributor, status)
WHERE deleted_at IS NULL;

-- Industry and type filtering for dynamic segments
CREATE INDEX idx_organizations_segments ON organizations (industry, type, status)
WHERE deleted_at IS NULL;

-- Lead score (priority) filtering - optimized for High/Medium/Low ranges
CREATE INDEX idx_organizations_priority ON organizations (lead_score, status)
WHERE deleted_at IS NULL;

-- Account manager assignment filtering
CREATE INDEX idx_organizations_assigned_user ON organizations (assigned_user_id, status)
WHERE deleted_at IS NULL AND assigned_user_id IS NOT NULL;

-- Combined index for common query patterns (status + multiple filters)
CREATE INDEX idx_organizations_active_filters ON organizations (status, is_principal, is_distributor, industry)
WHERE deleted_at IS NULL AND status IN ('Active', 'Prospect', 'Customer');

-- Contact counting optimization - ensure contacts table has proper index
-- This creates index if it doesn't exist, safely handles if it already exists
CREATE INDEX IF NOT EXISTS idx_contacts_organization_active ON contacts (organization_id)
WHERE created_by IS NOT NULL; -- Assuming created_by IS NOT NULL indicates active contacts

-- Partial index for organizations without contacts (for zero-contact warnings)
CREATE INDEX idx_organizations_without_contacts ON organizations (id, name, status)
WHERE deleted_at IS NULL 
  AND status IN ('Active', 'Prospect', 'Customer')
  AND NOT EXISTS (
    SELECT 1 FROM contacts c 
    WHERE c.organization_id = organizations.id
  );

-- Add constraint to ensure valid lead_score ranges (supports priority mapping)
-- High Priority = 90, Medium Priority = 60, Low Priority = 30
ALTER TABLE organizations 
ADD CONSTRAINT check_lead_score_range 
CHECK (lead_score IS NULL OR (lead_score >= 0 AND lead_score <= 100));

-- Create function to efficiently count contacts per organization
CREATE OR REPLACE FUNCTION get_organization_contact_count(org_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(COUNT(*)::integer, 0)
  FROM contacts
  WHERE organization_id = org_id;
$$;

-- Create view for organizations with contact counts (performance optimized)
CREATE OR REPLACE VIEW organizations_with_contact_counts AS
SELECT 
  o.*,
  COALESCE(contact_stats.contact_count, 0) as contact_count,
  CASE 
    WHEN COALESCE(contact_stats.contact_count, 0) = 0 THEN true 
    ELSE false 
  END as has_zero_contacts
FROM organizations o
LEFT JOIN (
  SELECT 
    organization_id,
    COUNT(*)::integer as contact_count
  FROM contacts
  GROUP BY organization_id
) contact_stats ON o.id = contact_stats.organization_id
WHERE o.deleted_at IS NULL;

-- Add helpful indexes on the view's underlying query
CREATE INDEX idx_contacts_org_count ON contacts (organization_id);

COMMIT;

-- Validation queries to run after migration
-- These should be run manually to verify migration success

/*
-- 1. Verify new columns were added correctly
SELECT 
  COUNT(*) as total_organizations,
  COUNT(*) FILTER (WHERE is_principal = true) as principal_count,
  COUNT(*) FILTER (WHERE is_distributor = true) as distributor_count,
  COUNT(*) FILTER (WHERE is_principal = true AND is_distributor = true) as both_count
FROM organizations;

-- 2. Test contact counting performance
SELECT 
  o.name,
  o.status,
  o.is_principal,
  o.is_distributor,
  contact_count,
  has_zero_contacts
FROM organizations_with_contact_counts o
WHERE o.status IN ('Active', 'Prospect', 'Customer')
ORDER BY contact_count ASC, o.name
LIMIT 10;

-- 3. Test priority filtering (lead_score ranges)
SELECT 
  'High Priority' as priority_level,
  COUNT(*) as count
FROM organizations 
WHERE lead_score >= 80 AND deleted_at IS NULL
UNION ALL
SELECT 
  'Medium Priority',
  COUNT(*)
FROM organizations 
WHERE lead_score >= 50 AND lead_score < 80 AND deleted_at IS NULL
UNION ALL
SELECT 
  'Low Priority',
  COUNT(*)
FROM organizations 
WHERE lead_score < 50 AND deleted_at IS NULL;

-- 4. Test index usage with EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT * FROM organizations 
WHERE is_principal = true 
  AND status = 'Active' 
  AND deleted_at IS NULL;
*/