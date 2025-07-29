## 🧩 UI Elements Summary
• A text field to enter the organization name (restaurant, principal, or distributor)
• A dropdown to select priority level (A, B, C, or D)
• A dropdown to select business segment (Fine Dining, Fast Food, Healthcare, etc.)
• A checkbox to mark if this organization owns products (Principal)
• A checkbox to mark if this organization distributes products (Distributor)
• Optional text fields for address, phone, email, and website
• A text area for notes about the organization
• A prominent warning banner when organization has no contacts
• An "Add First Contact" button when no contacts exist
• A submit button to save the organization information

# Organization Form - Business Entity Creation

## Overview
The Organization Form creates the business entity that makes purchases when an organization doesn't exist for a contact. Organizations are the foundation of the CRM system, as all other entities relate back to organizations.

## Purpose
Create the business entity that makes purchases (when organization doesn't exist for contact).

## Form Structure

### Required Fields
- **Name*** - Restaurant/business name OR Principal OR Distributor company name
- **Priority*** - A, B, C, or D level (dropdown)
- **Segment*** - Fine Dining, Fast Food, Healthcare, Catering, Institutional (dynamic dropdown with "Add New" option)

### Important Fields
- **Is Principal?** - Checkbox to designate this organization as a Principal (product owner)
- **Is Distributor?** - Checkbox to designate this organization as a Distributor (product supplier)

### Optional Fields
- Address, City, State, ZIP
- Phone number
- Website
- Account Manager
- Notes

## Organization Contact Status

### Contact Status Tracking
- **No Contacts Warning** - UI prominently displays when organization has no associated contacts
- **Contact Count Display** - Shows number of contacts associated with organization
- **Primary Contact Display** - Shows primary contact name when available

### Contact Warning Requirements
**Visual Display:**
- **Prominent warning banner** at top of organization view
- **Red/orange color scheme** to indicate attention needed
- **Large text**: "⚠️ No contacts associated with this organization"
- **Call-to-action button**: "Add First Contact" prominently displayed
- **Context message**: "Organizations need contacts to influence Principal product purchases"

**UI Behavior:**
- **Warning visible on all organization views** - list, detail, dashboard
- **Priority sorting** - Organizations without contacts appear first in warning lists
- **Dashboard indicators** - Show count of organizations lacking contacts
- **Workflow prompts** - Suggest adding contacts when creating opportunities for contactless organizations

## Business Rules
- Organizations may exist without contacts, but this is flagged for attention
- Organizations make the actual purchases, contacts influence the decisions
- Multiple contacts per organization are encouraged for better advocacy coverage
- Organization names must be unique
- Priority levels must be A, B, C, or D

## Dynamic Dropdown Features
- **Auto-suggest**: Type to search existing positions
- **Usage-based sorting**: Most frequently used positions appear first
- **Add new positions**: Click "Add New Position" to create custom options (e.g., "F&B Director", "Kitchen Manager")
- **Smart formatting**: New positions are automatically formatted with proper capitalization

## Migration Mapping

### Excel to Database Mapping
- Excel "Organizations" → `organizations` table
- Excel "SEGMENT" → `market_segment` (mapped to dropdown values)
- Excel "PRIORITY" → `priority_level` (A, B, C, D)
- Excel "Distributor" → `primary_distributor` (mapped to dropdown values)

### Data Quality Rules
- Organization names must be unique
- Priority levels must be A, B, C, or D
- Market segments mapped to: fine_dining, fast_food, healthcare, catering, institutional
- Distributors mapped to: sysco, usf, pfg, direct, other

## Organization Types

### Principal Organizations
- Companies that own products (Kaufholds, Better Balance, etc.)
- Marked with `is_principal = TRUE`
- Focus on product development and brand management

### Distributor Organizations
- Companies that distribute products (Sysco, USF, PFG, etc.)
- Marked with `is_distributor = TRUE`
- Focus on product distribution and supply chain

### Customer Organizations
- Restaurants and food service businesses
- The primary targets for sales activities
- Focus on purchasing decisions and relationship building

## Integration Points
- Created from [Contact Form](01_Contact_Form.md) when new organization is needed
- Links to [Opportunity Form](03_Opportunity_Form.md) for sales pipeline tracking
- Connects to [Principal Activity Tracking](05_Principal_Activity_Tracking.md) for Principal organizations
- Feeds into [Product Management](06_Product_Management.md) for Principal-Distributor relationships

## 💾 PostgreSQL Schema
```sql
-- Organizations table - Core business entities
CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    priority_level VARCHAR(1) NOT NULL CHECK (priority_level IN ('A', 'B', 'C', 'D')),
    market_segment VARCHAR(50) NOT NULL,
    is_principal BOOLEAN DEFAULT FALSE,
    is_distributor BOOLEAN DEFAULT FALSE,
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    phone VARCHAR(20),
    website VARCHAR(255),
    account_manager VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- Organization contact summary view
CREATE VIEW organization_contact_summary AS
SELECT 
    o.id,
    o.name,
    COUNT(c.id) as contact_count,
    COUNT(c.id) > 0 as has_contacts,
    MAX(CASE WHEN c.is_primary THEN c.first_name || ' ' || c.last_name END) as primary_contact
FROM organizations o
LEFT JOIN contacts c ON o.id = c.organization_id
GROUP BY o.id, o.name;

-- Indexes for performance
CREATE INDEX idx_organizations_name ON organizations(name);
CREATE INDEX idx_organizations_priority ON organizations(priority_level);
CREATE INDEX idx_organizations_segment ON organizations(market_segment);
CREATE INDEX idx_organizations_principal ON organizations(is_principal);
CREATE INDEX idx_organizations_distributor ON organizations(is_distributor);
```