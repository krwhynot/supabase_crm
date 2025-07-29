-- =============================================================================
-- Row Level Security (RLS) Policies for Organizations Tables
-- =============================================================================
-- This file contains RLS policies for all organizations tables following
-- Supabase security best practices and existing patterns.
--
-- Applied: Stage 1 - Database Implementation  
-- Confidence: 87%
-- =============================================================================

-- Enable RLS on organizations table
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Organizations Policies

-- Policy 1: Allow authenticated users to view all organizations
CREATE POLICY "Users can view all organizations" 
ON public.organizations FOR SELECT 
TO authenticated 
USING (deleted_at IS NULL);

-- Policy 2: Allow authenticated users to insert organizations
CREATE POLICY "Users can insert organizations" 
ON public.organizations FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Policy 3: Allow authenticated users to update organizations
CREATE POLICY "Users can update organizations" 
ON public.organizations FOR UPDATE 
TO authenticated 
USING (deleted_at IS NULL)
WITH CHECK (true);

-- Policy 4: Allow authenticated users to soft delete organizations
CREATE POLICY "Users can delete organizations" 
ON public.organizations FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (deleted_at IS NOT NULL);

-- No anonymous access - authentication required

-- Enable RLS on organization_interactions table
ALTER TABLE public.organization_interactions ENABLE ROW LEVEL SECURITY;

-- Organization Interactions Policies

-- Policy 1: Allow authenticated users to view all interactions
CREATE POLICY "Users can view all organization interactions" 
ON public.organization_interactions FOR SELECT 
TO authenticated 
USING (true);

-- Policy 2: Allow authenticated users to insert interactions
CREATE POLICY "Users can insert organization interactions" 
ON public.organization_interactions FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Policy 3: Allow authenticated users to update interactions
CREATE POLICY "Users can update organization interactions" 
ON public.organization_interactions FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Policy 4: Allow authenticated users to delete interactions
CREATE POLICY "Users can delete organization interactions" 
ON public.organization_interactions FOR DELETE 
TO authenticated 
USING (true);

-- No anonymous access - authentication required

-- Enable RLS on organization_documents table
ALTER TABLE public.organization_documents ENABLE ROW LEVEL SECURITY;

-- Organization Documents Policies

-- Policy 1: Allow authenticated users to view all documents
CREATE POLICY "Users can view all organization documents" 
ON public.organization_documents FOR SELECT 
TO authenticated 
USING (true);

-- Policy 2: Allow authenticated users to insert documents
CREATE POLICY "Users can insert organization documents" 
ON public.organization_documents FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Policy 3: Allow authenticated users to update documents
CREATE POLICY "Users can update organization documents" 
ON public.organization_documents FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Policy 4: Allow authenticated users to delete documents
CREATE POLICY "Users can delete organization documents" 
ON public.organization_documents FOR DELETE 
TO authenticated 
USING (true);

-- No anonymous access - authentication required

-- Enable RLS on organization_analytics table
ALTER TABLE public.organization_analytics ENABLE ROW LEVEL SECURITY;

-- Organization Analytics Policies

-- Policy 1: Allow authenticated users to view all analytics
CREATE POLICY "Users can view all organization analytics" 
ON public.organization_analytics FOR SELECT 
TO authenticated 
USING (true);

-- Policy 2: Allow authenticated users to insert analytics (for data processing)
CREATE POLICY "Users can insert organization analytics" 
ON public.organization_analytics FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Policy 3: Allow authenticated users to update analytics
CREATE POLICY "Users can update organization analytics" 
ON public.organization_analytics FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Policy 4: Allow authenticated users to delete analytics
CREATE POLICY "Users can delete organization analytics" 
ON public.organization_analytics FOR DELETE 
TO authenticated 
USING (true);

-- No anonymous access - authentication required

-- Add policy comments for documentation
COMMENT ON POLICY "Users can view all organizations" ON public.organizations IS 'Allows authenticated users to view active organizations';
COMMENT ON POLICY "Users can insert organizations" ON public.organizations IS 'Allows authenticated users to create new organizations';
COMMENT ON POLICY "Users can update organizations" ON public.organizations IS 'Allows authenticated users to modify active organizations';
COMMENT ON POLICY "Users can delete organizations" ON public.organizations IS 'Allows authenticated users to soft delete organizations';

COMMENT ON POLICY "Users can view all organization interactions" ON public.organization_interactions IS 'Allows authenticated users to view all interaction history';
COMMENT ON POLICY "Users can insert organization interactions" ON public.organization_interactions IS 'Allows authenticated users to log new interactions';
COMMENT ON POLICY "Users can update organization interactions" ON public.organization_interactions IS 'Allows authenticated users to modify interaction records';
COMMENT ON POLICY "Users can delete organization interactions" ON public.organization_interactions IS 'Allows authenticated users to delete interaction records';

COMMENT ON POLICY "Users can view all organization documents" ON public.organization_documents IS 'Allows authenticated users to view all organization documents';
COMMENT ON POLICY "Users can insert organization documents" ON public.organization_documents IS 'Allows authenticated users to upload documents';

COMMENT ON POLICY "Users can view all organization analytics" ON public.organization_analytics IS 'Allows authenticated users to view analytics data';
COMMENT ON POLICY "Users can insert organization analytics" ON public.organization_analytics IS 'Allows authenticated users to create analytics records';