-- =============================================================================
-- Contacts Schema for Contact Management MVP
-- =============================================================================
-- This file contains the contacts table definition for the Contact Management
-- MVP feature. Essential fields only for initial implementation.
--
-- Applied: Stage 1 - Database Implementation
-- Confidence: 95%
-- =============================================================================

-- Contacts table for contact management
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    organization VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    phone VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE public.contacts IS 'Stores professional contacts for CRM functionality';
COMMENT ON COLUMN public.contacts.id IS 'Unique identifier using UUID for better scalability';
COMMENT ON COLUMN public.contacts.first_name IS 'Contact first name, required field';
COMMENT ON COLUMN public.contacts.last_name IS 'Contact last name, required field';
COMMENT ON COLUMN public.contacts.organization IS 'Contact organization/company, required field';
COMMENT ON COLUMN public.contacts.email IS 'Contact email address, required field';
COMMENT ON COLUMN public.contacts.title IS 'Contact job title, optional field';
COMMENT ON COLUMN public.contacts.phone IS 'Contact phone number, optional field';
COMMENT ON COLUMN public.contacts.notes IS 'Additional notes about the contact, optional field';

-- Create email uniqueness constraint
ALTER TABLE public.contacts 
ADD CONSTRAINT contacts_email_unique UNIQUE (email);

-- Add email format validation
ALTER TABLE public.contacts 
ADD CONSTRAINT contacts_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add name validation (no empty strings)
ALTER TABLE public.contacts 
ADD CONSTRAINT contacts_first_name_not_empty CHECK (LENGTH(TRIM(first_name)) > 0);

ALTER TABLE public.contacts 
ADD CONSTRAINT contacts_last_name_not_empty CHECK (LENGTH(TRIM(last_name)) > 0);

ALTER TABLE public.contacts 
ADD CONSTRAINT contacts_organization_not_empty CHECK (LENGTH(TRIM(organization)) > 0);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contacts_updated_at 
    BEFORE UPDATE ON public.contacts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();