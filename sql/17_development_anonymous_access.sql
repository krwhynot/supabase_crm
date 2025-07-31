-- =============================================================================
-- Development Anonymous Access Policies
-- =============================================================================
-- This file adds anonymous access policies for development and testing.
-- WARNING: These policies allow anonymous users to perform CRUD operations.
-- Only use in development environments!
--
-- Applied: Development Environment Only
-- =============================================================================

-- Add anonymous access policies for organizations (development only)

-- Policy: Allow anonymous users to view all organizations
CREATE POLICY "Anonymous can view organizations (DEV ONLY)" 
ON public.organizations FOR SELECT 
TO anon 
USING (deleted_at IS NULL);

-- Policy: Allow anonymous users to insert organizations
CREATE POLICY "Anonymous can insert organizations (DEV ONLY)" 
ON public.organizations FOR INSERT 
TO anon 
WITH CHECK (true);

-- Policy: Allow anonymous users to update organizations
CREATE POLICY "Anonymous can update organizations (DEV ONLY)" 
ON public.organizations FOR UPDATE 
TO anon 
USING (deleted_at IS NULL)
WITH CHECK (true);

-- Add anonymous access policies for contacts (for organization-contact relationships)

-- Enable RLS on contacts table if not already enabled
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous users to view all contacts
CREATE POLICY "Anonymous can view contacts (DEV ONLY)" 
ON public.contacts FOR SELECT 
TO anon 
USING (true);

-- Policy: Allow anonymous users to insert contacts
CREATE POLICY "Anonymous can insert contacts (DEV ONLY)" 
ON public.contacts FOR INSERT 
TO anon 
WITH CHECK (true);

-- Policy: Allow anonymous users to update contacts
CREATE POLICY "Anonymous can update contacts (DEV ONLY)" 
ON public.contacts FOR UPDATE 
TO anon 
USING (true)
WITH CHECK (true);

-- Add policy comments for documentation
COMMENT ON POLICY "Anonymous can view organizations (DEV ONLY)" ON public.organizations IS 'DEVELOPMENT ONLY: Allows anonymous users to view organizations for testing';
COMMENT ON POLICY "Anonymous can insert organizations (DEV ONLY)" ON public.organizations IS 'DEVELOPMENT ONLY: Allows anonymous users to create organizations for testing';
COMMENT ON POLICY "Anonymous can update organizations (DEV ONLY)" ON public.organizations IS 'DEVELOPMENT ONLY: Allows anonymous users to modify organizations for testing';

COMMENT ON POLICY "Anonymous can view contacts (DEV ONLY)" ON public.contacts IS 'DEVELOPMENT ONLY: Allows anonymous users to view contacts for testing';
COMMENT ON POLICY "Anonymous can insert contacts (DEV ONLY)" ON public.contacts IS 'DEVELOPMENT ONLY: Allows anonymous users to create contacts for testing';
COMMENT ON POLICY "Anonymous can update contacts (DEV ONLY)" ON public.contacts IS 'DEVELOPMENT ONLY: Allows anonymous users to modify contacts for testing';

-- Add a note about these policies being for development only
COMMENT ON TABLE public.organizations IS 'Organizations table with development anonymous access policies - REMOVE IN PRODUCTION';