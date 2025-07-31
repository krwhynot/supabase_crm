-- Optimized queries for the new organization form functionality
-- These queries support the enhanced organization form with Principal/Distributor flags

-- 1. ORGANIZATION LIST WITH CONTACT COUNTS AND FILTERING
-- Supports all form filtering requirements including zero-contact warnings
SELECT 
  o.id,
  o.name,
  o.legal_name,
  o.industry,
  o.type,
  o.status,
  o.is_principal,
  o.is_distributor,
  o.lead_score,
  CASE 
    WHEN o.lead_score >= 80 THEN 'High'
    WHEN o.lead_score >= 50 THEN 'Medium'
    ELSE 'Low'
  END as priority_level,
  o.assigned_user_id,
  o.website,
  o.email,
  o.primary_phone,
  o.employees_count,
  o.annual_revenue,
  o.currency_code,
  COALESCE(contact_stats.contact_count, 0) as contact_count,
  CASE 
    WHEN COALESCE(contact_stats.contact_count, 0) = 0 THEN true 
    ELSE false 
  END as has_zero_contacts,
  o.last_contact_date,
  o.next_follow_up_date,
  o.created_at,
  o.updated_at
FROM organizations o
LEFT JOIN (
  SELECT 
    organization_id,
    COUNT(*)::integer as contact_count
  FROM contacts
  GROUP BY organization_id
) contact_stats ON o.id = contact_stats.organization_id
WHERE o.deleted_at IS NULL
  -- Example filters (remove conditions as needed)
  AND ($1::text IS NULL OR o.status = $1::text)  -- Status filter
  AND ($2::boolean IS NULL OR o.is_principal = $2::boolean)  -- Principal filter
  AND ($3::boolean IS NULL OR o.is_distributor = $3::boolean)  -- Distributor filter
  AND ($4::text IS NULL OR o.industry ILIKE '%' || $4 || '%')  -- Industry filter
  AND ($5::text IS NULL OR o.type = $5::text)  -- Type filter
  AND ($6::integer IS NULL OR o.lead_score >= $6::integer)  -- Min lead score filter
  AND ($7::uuid IS NULL OR o.assigned_user_id = $7::uuid)  -- Account manager filter
  AND ($8::boolean IS NULL OR 
       ($8 = true AND COALESCE(contact_stats.contact_count, 0) = 0) OR
       ($8 = false AND COALESCE(contact_stats.contact_count, 0) > 0))  -- Zero contact filter
ORDER BY 
  CASE WHEN $9::text = 'name' THEN o.name END ASC,
  CASE WHEN $9::text = 'lead_score' THEN o.lead_score END DESC,
  CASE WHEN $9::text = 'contact_count' THEN contact_stats.contact_count END DESC,
  CASE WHEN $9::text = 'created_at' THEN o.created_at END DESC,
  o.name ASC  -- Default sort
LIMIT COALESCE($10::integer, 50)
OFFSET COALESCE($11::integer, 0);

-- 2. ORGANIZATION DETAIL WITH FULL CONTACT INFORMATION
-- Used for organization detail views and editing
SELECT 
  o.*,
  CASE 
    WHEN o.lead_score >= 80 THEN 'High'
    WHEN o.lead_score >= 50 THEN 'Medium'
    ELSE 'Low'
  END as priority_level,
  COALESCE(contact_stats.contact_count, 0) as contact_count,
  contact_stats.primary_contact_name,
  contact_stats.primary_contact_email,
  contact_stats.primary_contact_phone
FROM organizations o
LEFT JOIN (
  SELECT 
    c.organization_id,
    COUNT(*)::integer as contact_count,
    STRING_AGG(
      CASE WHEN c.is_primary THEN c.first_name || ' ' || c.last_name END, 
      ', '
    ) as primary_contact_name,
    STRING_AGG(
      CASE WHEN c.is_primary THEN c.email END, 
      ', '
    ) as primary_contact_email,
    STRING_AGG(
      CASE WHEN c.is_primary THEN c.phone END, 
      ', '
    ) as primary_contact_phone
  FROM contacts c
  GROUP BY c.organization_id
) contact_stats ON o.id = contact_stats.organization_id
WHERE o.id = $1::uuid
  AND o.deleted_at IS NULL;

-- 3. ORGANIZATIONS FOR DROPDOWN/SELECT COMPONENTS
-- Lightweight query for form selects, autocomplete, etc.
SELECT 
  id,
  name,
  legal_name,
  is_principal,
  is_distributor,
  status,
  industry
FROM organizations
WHERE deleted_at IS NULL
  AND status IN ('Active', 'Customer', 'Partner', 'Prospect')
  AND ($1::text IS NULL OR name ILIKE '%' || $1 || '%')  -- Search filter
ORDER BY 
  CASE 
    WHEN name ILIKE $1 || '%' THEN 1  -- Exact prefix match first
    WHEN name ILIKE '%' || $1 || '%' THEN 2  -- Contains match second
    ELSE 3
  END,
  name ASC
LIMIT 50;

-- 4. PRINCIPAL ORGANIZATIONS ONLY
-- For Principal-specific dropdowns and filtering
SELECT 
  id,
  name,
  legal_name,
  industry,
  website,
  status
FROM organizations
WHERE deleted_at IS NULL
  AND is_principal = true
  AND status IN ('Active', 'Customer', 'Partner')
ORDER BY name ASC;

-- 5. DISTRIBUTOR ORGANIZATIONS ONLY
-- For Distributor-specific dropdowns and filtering
SELECT 
  id,
  name,
  legal_name,
  industry,
  website,
  status,
  employees_count
FROM organizations
WHERE deleted_at IS NULL
  AND is_distributor = true
  AND status IN ('Active', 'Customer', 'Partner')
ORDER BY name ASC;

-- 6. ORGANIZATIONS WITH ZERO CONTACTS (WARNING LIST)
-- For dashboard warnings and follow-up lists
SELECT 
  o.id,
  o.name,
  o.status,
  o.assigned_user_id,
  o.created_at,
  o.last_contact_date,
  EXTRACT(DAYS FROM NOW() - o.created_at) as days_since_created
FROM organizations o
LEFT JOIN contacts c ON o.id = c.organization_id
WHERE o.deleted_at IS NULL
  AND o.status IN ('Active', 'Prospect', 'Customer')
  AND c.id IS NULL  -- No contacts
GROUP BY o.id, o.name, o.status, o.assigned_user_id, o.created_at, o.last_contact_date
ORDER BY o.created_at DESC;

-- 7. PRIORITY-BASED ORGANIZATION LISTS
-- High Priority Organizations (Lead Score >= 80)
SELECT 
  o.id,
  o.name,
  o.status,
  o.lead_score,
  o.is_principal,
  o.is_distributor,
  o.assigned_user_id,
  o.last_contact_date,
  o.next_follow_up_date,
  COALESCE(contact_count.count, 0) as contact_count
FROM organizations o
LEFT JOIN (
  SELECT organization_id, COUNT(*) as count
  FROM contacts GROUP BY organization_id
) contact_count ON o.id = contact_count.organization_id
WHERE o.deleted_at IS NULL
  AND o.lead_score >= 80
  AND o.status IN ('Active', 'Prospect', 'Customer')
ORDER BY o.lead_score DESC, o.next_follow_up_date ASC NULLS LAST;

-- 8. INDUSTRY SEGMENT ANALYSIS
-- For dynamic industry-based filtering and reporting
SELECT 
  o.industry,
  o.type,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE o.is_principal = true) as principal_count,
  COUNT(*) FILTER (WHERE o.is_distributor = true) as distributor_count,
  COUNT(*) FILTER (WHERE o.status = 'Active') as active_count,
  COUNT(*) FILTER (WHERE o.status = 'Customer') as customer_count,
  AVG(o.lead_score)::integer as avg_lead_score,
  SUM(o.annual_revenue) as total_revenue
FROM organizations o
WHERE o.deleted_at IS NULL
  AND o.industry IS NOT NULL
GROUP BY o.industry, o.type
HAVING COUNT(*) >= 1  -- Only show industries with at least 1 organization
ORDER BY total_count DESC, o.industry ASC;

-- 9. ACCOUNT MANAGER ASSIGNMENT SUMMARY
-- For managing account manager workloads
SELECT 
  o.assigned_user_id,
  COUNT(*) as total_organizations,
  COUNT(*) FILTER (WHERE o.status = 'Active') as active_organizations,
  COUNT(*) FILTER (WHERE o.is_principal = true) as principal_count,
  COUNT(*) FILTER (WHERE o.is_distributor = true) as distributor_count,
  AVG(o.lead_score)::integer as avg_lead_score,
  COUNT(*) FILTER (WHERE contact_count.count = 0) as zero_contact_orgs
FROM organizations o
LEFT JOIN (
  SELECT organization_id, COUNT(*) as count
  FROM contacts GROUP BY organization_id
) contact_count ON o.id = contact_count.organization_id
WHERE o.deleted_at IS NULL
  AND o.assigned_user_id IS NOT NULL
GROUP BY o.assigned_user_id
ORDER BY total_organizations DESC;

-- 10. BULK UPDATE QUERY FOR PRINCIPAL/DISTRIBUTOR FLAGS
-- For data migration or bulk updates
UPDATE organizations 
SET 
  is_principal = CASE 
    WHEN custom_fields::text ILIKE '%principal%' OR 
         custom_fields::text ILIKE '%manufacturer%' OR
         custom_fields::text ILIKE '%brand%' THEN true 
    ELSE is_principal 
  END,
  is_distributor = CASE 
    WHEN custom_fields::text ILIKE '%distributor%' OR 
         custom_fields::text ILIKE '%reseller%' OR
         custom_fields::text ILIKE '%dealer%' THEN true 
    ELSE is_distributor 
  END,
  updated_at = NOW()
WHERE deleted_at IS NULL
  AND (custom_fields::text ILIKE '%principal%' OR 
       custom_fields::text ILIKE '%manufacturer%' OR
       custom_fields::text ILIKE '%brand%' OR
       custom_fields::text ILIKE '%distributor%' OR 
       custom_fields::text ILIKE '%reseller%' OR
       custom_fields::text ILIKE '%dealer%')
RETURNING id, name, is_principal, is_distributor;