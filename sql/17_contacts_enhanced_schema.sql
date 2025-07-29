-- =============================================================================
-- Enhanced Contacts Schema - Kitchen Pantry CRM
-- =============================================================================
-- This migration updates the contacts table to match the Contact Form requirements
-- Based on the Contact Form documentation specifications
-- =============================================================================

-- Drop existing contacts table if it exists (for clean migration)
DROP TABLE IF EXISTS contact_principals CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;

-- Create enhanced contacts table
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Required fields
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    position VARCHAR(100) NOT NULL,
    
    -- Important fields for purchase decision tracking
    purchase_influence VARCHAR(20) NOT NULL CHECK (purchase_influence IN ('High', 'Medium', 'Low', 'Unknown')),
    decision_authority VARCHAR(20) NOT NULL CHECK (decision_authority IN ('Decision Maker', 'Influencer', 'End User', 'Gatekeeper')),
    
    -- Optional contact information
    phone VARCHAR(20),
    email VARCHAR(255),
    
    -- Optional address fields
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    
    -- Optional additional fields
    website VARCHAR(255),
    account_manager VARCHAR(100),
    notes TEXT,
    
    -- Contact status
    is_primary BOOLEAN DEFAULT FALSE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id)
);

-- Create contact_principals junction table for Principal advocacy tracking
CREATE TABLE contact_principals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    principal_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    advocacy_level VARCHAR(20) DEFAULT 'Medium' CHECK (advocacy_level IN ('High', 'Medium', 'Low')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(contact_id, principal_id)
);

-- Create indexes for performance
CREATE INDEX idx_contacts_organization_id ON contacts(organization_id);
CREATE INDEX idx_contacts_name ON contacts(last_name, first_name);
CREATE INDEX idx_contacts_purchase_influence ON contacts(purchase_influence);
CREATE INDEX idx_contacts_decision_authority ON contacts(decision_authority);
CREATE INDEX idx_contacts_email ON contacts(email) WHERE email IS NOT NULL;
CREATE INDEX idx_contacts_phone ON contacts(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_contacts_is_primary ON contacts(is_primary) WHERE is_primary = TRUE;
CREATE INDEX idx_contacts_created_at ON contacts(created_at);

CREATE INDEX idx_contact_principals_contact_id ON contact_principals(contact_id);
CREATE INDEX idx_contact_principals_principal_id ON contact_principals(principal_id);
CREATE INDEX idx_contact_principals_advocacy_level ON contact_principals(advocacy_level);

-- Create updated_at trigger for contacts
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contacts_updated_at_trigger
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_contacts_updated_at();

-- Create updated_at trigger for contact_principals
CREATE OR REPLACE FUNCTION update_contact_principals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contact_principals_updated_at_trigger
    BEFORE UPDATE ON contact_principals
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_principals_updated_at();

-- Add validation constraints
ALTER TABLE contacts ADD CONSTRAINT contacts_first_name_length CHECK (length(first_name) >= 1);
ALTER TABLE contacts ADD CONSTRAINT contacts_last_name_length CHECK (length(last_name) >= 1);
ALTER TABLE contacts ADD CONSTRAINT contacts_position_length CHECK (length(position) >= 1);
ALTER TABLE contacts ADD CONSTRAINT contacts_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL);
ALTER TABLE contacts ADD CONSTRAINT contacts_website_format CHECK (website ~* '^https?://[^\s]+$' OR website IS NULL);

-- Create unique constraint for contact name within organization
CREATE UNIQUE INDEX idx_contacts_unique_name_per_org ON contacts(organization_id, LOWER(first_name), LOWER(last_name));

-- Create view for contact list with organization details
CREATE OR REPLACE VIEW contact_list_view AS
SELECT 
    c.id,
    c.first_name,
    c.last_name,
    c.first_name || ' ' || c.last_name as full_name,
    c.organization_id,
    o.name as organization_name,
    o.industry as organization_industry,
    c.position,
    c.purchase_influence,
    c.decision_authority,
    c.phone,
    c.email,
    c.is_primary,
    c.created_at,
    c.updated_at,
    
    -- Count of principal advocacies
    COALESCE(cp_count.principal_count, 0) as principal_advocacy_count,
    
    -- Organization contact count
    org_contacts.contact_count as organization_contact_count
FROM contacts c
JOIN organizations o ON c.organization_id = o.id
LEFT JOIN (
    SELECT contact_id, COUNT(*) as principal_count
    FROM contact_principals
    GROUP BY contact_id
) cp_count ON c.id = cp_count.contact_id
LEFT JOIN (
    SELECT organization_id, COUNT(*) as contact_count
    FROM contacts
    GROUP BY organization_id
) org_contacts ON c.organization_id = org_contacts.organization_id;

-- Create view for contact details with full relationships
CREATE OR REPLACE VIEW contact_detail_view AS
SELECT 
    c.*,
    c.first_name || ' ' || c.last_name as full_name,
    o.name as organization_name,
    o.industry as organization_industry,
    o.type as organization_type,
    o.website as organization_website,
    
    -- Principal advocacies
    ARRAY_AGG(
        CASE WHEN cp.principal_id IS NOT NULL THEN
            JSON_BUILD_OBJECT(
                'id', cp.id,
                'principal_id', cp.principal_id,
                'principal_name', p.name,
                'advocacy_level', cp.advocacy_level,
                'notes', cp.notes
            )
        END
    ) FILTER (WHERE cp.principal_id IS NOT NULL) as principal_advocacies
    
FROM contacts c
JOIN organizations o ON c.organization_id = o.id
LEFT JOIN contact_principals cp ON c.id = cp.contact_id
LEFT JOIN organizations p ON cp.principal_id = p.id
GROUP BY c.id, o.id;

-- Insert sample data for testing (optional)
INSERT INTO contacts (
    first_name, 
    last_name, 
    organization_id, 
    position, 
    purchase_influence, 
    decision_authority,
    email,
    phone,
    notes,
    is_primary
) VALUES 
(
    'John',
    'Smith', 
    (SELECT id FROM organizations LIMIT 1),
    'Executive Chef',
    'High',
    'Decision Maker',
    'john.smith@restaurant.com',
    '(555) 123-4567',
    'Primary decision maker for kitchen equipment and ingredients',
    true
),
(
    'Sarah',
    'Johnson',
    (SELECT id FROM organizations LIMIT 1),
    'F&B Director',
    'Medium',
    'Influencer',
    'sarah.johnson@restaurant.com',
    '(555) 234-5678',
    'Influences purchase decisions for beverage programs',
    false
) 
ON CONFLICT DO NOTHING;

-- Add helpful comments
COMMENT ON TABLE contacts IS 'Kitchen Pantry CRM contacts - key individuals who influence Principal product purchases';
COMMENT ON TABLE contact_principals IS 'Junction table tracking which Principal brands each contact advocates for';
COMMENT ON COLUMN contacts.purchase_influence IS 'Level of influence the contact has on purchase decisions within their organization';
COMMENT ON COLUMN contacts.decision_authority IS 'Role of the contact in the purchase decision process';
COMMENT ON COLUMN contacts.is_primary IS 'Whether this is the primary contact for the organization';
COMMENT ON VIEW contact_list_view IS 'Optimized view for contact listings with organization and advocacy details';
COMMENT ON VIEW contact_detail_view IS 'Comprehensive view for contact detail pages with full relationship data';

-- Grant permissions (adjust as needed for your RLS setup)
-- These will need to be customized based on your authentication setup
-- ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE contact_principals ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (uncomment and adjust as needed):
-- CREATE POLICY "Users can view contacts" ON contacts FOR SELECT USING (true);
-- CREATE POLICY "Users can insert contacts" ON contacts FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Users can update contacts" ON contacts FOR UPDATE USING (true);
-- CREATE POLICY "Users can delete contacts" ON contacts FOR DELETE USING (true);

-- CREATE POLICY "Users can view contact_principals" ON contact_principals FOR SELECT USING (true);
-- CREATE POLICY "Users can insert contact_principals" ON contact_principals FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Users can update contact_principals" ON contact_principals FOR UPDATE USING (true);
-- CREATE POLICY "Users can delete contact_principals" ON contact_principals FOR DELETE USING (true);