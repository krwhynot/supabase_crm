-- =============================================================================
-- Organizations Schema for CRM System
-- =============================================================================
-- This file contains the organizations table definition for comprehensive
-- organization management. Designed for enterprise CRM capabilities.
--
-- Applied: Stage 1 - Database Implementation
-- Confidence: 90%
-- =============================================================================

-- Create enums for better data consistency
CREATE TYPE public.organization_type AS ENUM ('B2B', 'B2C', 'B2B2C', 'Non-Profit', 'Government', 'Other');
CREATE TYPE public.organization_size AS ENUM ('Startup', 'Small', 'Medium', 'Large', 'Enterprise');
CREATE TYPE public.organization_status AS ENUM ('Active', 'Inactive', 'Prospect', 'Customer', 'Partner', 'Vendor');

-- Organizations table for comprehensive organization management
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information
    name VARCHAR(500) NOT NULL,
    legal_name VARCHAR(500),
    description TEXT,
    industry VARCHAR(255),
    type public.organization_type DEFAULT 'B2B',
    size public.organization_size,
    status public.organization_status DEFAULT 'Prospect',
    
    -- Contact Information
    website VARCHAR(500),
    email VARCHAR(255),
    primary_phone VARCHAR(50),
    secondary_phone VARCHAR(50),
    
    -- Address Information
    address_line_1 VARCHAR(500),
    address_line_2 VARCHAR(500),
    city VARCHAR(255),
    state_province VARCHAR(255),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'United States',
    
    -- Business Information
    founded_year INTEGER,
    employees_count INTEGER,
    annual_revenue DECIMAL(15,2),
    currency_code VARCHAR(3) DEFAULT 'USD',
    
    -- CRM Fields
    lead_source VARCHAR(255),
    lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
    tags JSONB DEFAULT '[]'::jsonb,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    
    -- Relationship Fields
    parent_org_id UUID REFERENCES public.organizations(id),
    assigned_user_id UUID, -- For future auth integration
    
    -- Principal/Distributor Business Logic
    is_principal BOOLEAN DEFAULT FALSE,
    is_distributor BOOLEAN DEFAULT FALSE,
    distributor_id UUID REFERENCES public.organizations(id),
    account_manager_id UUID, -- For future user/employee integration
    
    -- Tracking
    last_contact_date TIMESTAMPTZ,
    next_follow_up_date TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Soft delete
    deleted_at TIMESTAMPTZ
);

-- Add comments for documentation
COMMENT ON TABLE public.organizations IS 'Comprehensive organizations/companies table for CRM functionality';
COMMENT ON COLUMN public.organizations.id IS 'Unique identifier using UUID for better scalability';
COMMENT ON COLUMN public.organizations.name IS 'Organization display name, required field';
COMMENT ON COLUMN public.organizations.legal_name IS 'Official legal business name';
COMMENT ON COLUMN public.organizations.description IS 'Business description or notes about the organization';
COMMENT ON COLUMN public.organizations.industry IS 'Industry/sector classification';
COMMENT ON COLUMN public.organizations.type IS 'Business model type (B2B, B2C, etc.)';
COMMENT ON COLUMN public.organizations.size IS 'Organization size classification';
COMMENT ON COLUMN public.organizations.status IS 'Current relationship status with the organization';
COMMENT ON COLUMN public.organizations.website IS 'Primary website URL';
COMMENT ON COLUMN public.organizations.email IS 'Primary contact email';
COMMENT ON COLUMN public.organizations.primary_phone IS 'Main contact phone number';
COMMENT ON COLUMN public.organizations.secondary_phone IS 'Alternative contact phone number';
COMMENT ON COLUMN public.organizations.lead_score IS 'Lead scoring from 0-100 for sales prioritization';
COMMENT ON COLUMN public.organizations.tags IS 'Flexible tags for categorization (JSONB array)';
COMMENT ON COLUMN public.organizations.custom_fields IS 'Extensible custom fields (JSONB object)';
COMMENT ON COLUMN public.organizations.parent_org_id IS 'Reference to parent organization for hierarchies';
COMMENT ON COLUMN public.organizations.assigned_user_id IS 'User responsible for this organization';
COMMENT ON COLUMN public.organizations.last_contact_date IS 'Date of last contact/interaction';
COMMENT ON COLUMN public.organizations.next_follow_up_date IS 'Scheduled next follow-up date';
COMMENT ON COLUMN public.organizations.is_principal IS 'Whether this organization is a principal (mutually exclusive with is_distributor)';
COMMENT ON COLUMN public.organizations.is_distributor IS 'Whether this organization is a distributor (mutually exclusive with is_principal)';
COMMENT ON COLUMN public.organizations.distributor_id IS 'Reference to distributor organization (only if not a distributor itself)';
COMMENT ON COLUMN public.organizations.account_manager_id IS 'User responsible for managing this account';
COMMENT ON COLUMN public.organizations.deleted_at IS 'Soft delete timestamp (NULL = active)';

-- Add constraints
ALTER TABLE public.organizations 
ADD CONSTRAINT organizations_name_not_empty CHECK (LENGTH(TRIM(name)) > 0);

-- Email format validation (optional field)
ALTER TABLE public.organizations 
ADD CONSTRAINT organizations_email_format CHECK (
    email IS NULL OR 
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

-- Website URL validation (optional field)
ALTER TABLE public.organizations 
ADD CONSTRAINT organizations_website_format CHECK (
    website IS NULL OR 
    website ~* '^https?://[^\s]+$'
);

-- Founded year validation
ALTER TABLE public.organizations 
ADD CONSTRAINT organizations_founded_year_valid CHECK (
    founded_year IS NULL OR 
    (founded_year >= 1800 AND founded_year <= EXTRACT(YEAR FROM NOW()) + 1)
);

-- Employees count validation
ALTER TABLE public.organizations 
ADD CONSTRAINT organizations_employees_valid CHECK (
    employees_count IS NULL OR employees_count >= 0
);

-- Annual revenue validation
ALTER TABLE public.organizations 
ADD CONSTRAINT organizations_revenue_valid CHECK (
    annual_revenue IS NULL OR annual_revenue >= 0
);

-- Currency code format validation
ALTER TABLE public.organizations 
ADD CONSTRAINT organizations_currency_format CHECK (
    currency_code ~* '^[A-Z]{3}$'
);

-- Prevent self-referencing parent organization
ALTER TABLE public.organizations 
ADD CONSTRAINT organizations_no_self_parent CHECK (id != parent_org_id);

-- Ensure Principal/Distributor mutual exclusivity
ALTER TABLE public.organizations 
ADD CONSTRAINT organizations_principal_distributor_exclusive CHECK (
    NOT (is_principal = TRUE AND is_distributor = TRUE)
);

-- Prevent self-referencing distributor
ALTER TABLE public.organizations 
ADD CONSTRAINT organizations_no_self_distributor CHECK (id != distributor_id);

-- Add updated_at trigger (reuse existing function)
CREATE TRIGGER update_organizations_updated_at 
    BEFORE UPDATE ON public.organizations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for common queries (defined in separate index file)
-- Note: Actual indexes will be created in 13_organizations_indexes.sql