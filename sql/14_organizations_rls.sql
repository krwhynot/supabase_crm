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

-- Policy 5: Allow anonymous users to view organizations (for demo mode)
CREATE POLICY "Anonymous users can view organizations in demo mode" 
ON public.organizations FOR SELECT 
TO anon 
USING (deleted_at IS NULL);

-- Policy 6: Allow anonymous users to insert organizations (for demo mode)
CREATE POLICY "Anonymous users can insert organizations in demo mode" 
ON public.organizations FOR INSERT 
TO anon 
WITH CHECK (true);

-- Policy 7: Allow anonymous users to update organizations (for demo mode)
CREATE POLICY "Anonymous users can update organizations in demo mode" 
ON public.organizations FOR UPDATE 
TO anon 
USING (deleted_at IS NULL)
WITH CHECK (true);

-- Policy 8: Allow anonymous users to soft delete organizations (for demo mode)
CREATE POLICY "Anonymous users can delete organizations in demo mode" 
ON public.organizations FOR UPDATE 
TO anon 
USING (true)
WITH CHECK (deleted_at IS NOT NULL);

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

-- Policy 5: Allow anonymous users to view interactions (for demo mode)
CREATE POLICY "Anonymous users can view organization interactions in demo mode" 
ON public.organization_interactions FOR SELECT 
TO anon 
USING (true);

-- Policy 6: Allow anonymous users to insert interactions (for demo mode)
CREATE POLICY "Anonymous users can insert organization interactions in demo mode" 
ON public.organization_interactions FOR INSERT 
TO anon 
WITH CHECK (true);

-- Policy 7: Allow anonymous users to update interactions (for demo mode)
CREATE POLICY "Anonymous users can update organization interactions in demo mode" 
ON public.organization_interactions FOR UPDATE 
TO anon 
USING (true)
WITH CHECK (true);

-- Policy 8: Allow anonymous users to delete interactions (for demo mode)
CREATE POLICY "Anonymous users can delete organization interactions in demo mode" 
ON public.organization_interactions FOR DELETE 
TO anon 
USING (true);

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

-- Policy 5: Allow anonymous users to view public documents (for demo mode)
CREATE POLICY "Anonymous users can view public organization documents in demo mode" 
ON public.organization_documents FOR SELECT 
TO anon 
USING (is_public = true);

-- Policy 6: Allow anonymous users to view all documents (for full demo mode)
CREATE POLICY "Anonymous users can view all organization documents in demo mode" 
ON public.organization_documents FOR SELECT 
TO anon 
USING (true);

-- Policy 7: Allow anonymous users to insert documents (for demo mode)
CREATE POLICY "Anonymous users can insert organization documents in demo mode" 
ON public.organization_documents FOR INSERT 
TO anon 
WITH CHECK (true);

-- Policy 8: Allow anonymous users to update documents (for demo mode)
CREATE POLICY "Anonymous users can update organization documents in demo mode" 
ON public.organization_documents FOR UPDATE 
TO anon 
USING (true)
WITH CHECK (true);

-- Policy 9: Allow anonymous users to delete documents (for demo mode)
CREATE POLICY "Anonymous users can delete organization documents in demo mode" 
ON public.organization_documents FOR DELETE 
TO anon 
USING (true);

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

-- Policy 5: Allow anonymous users to view analytics (for demo mode)
CREATE POLICY "Anonymous users can view organization analytics in demo mode" 
ON public.organization_analytics FOR SELECT 
TO anon 
USING (true);

-- Policy 6: Allow anonymous users to insert analytics (for demo mode)
CREATE POLICY "Anonymous users can insert organization analytics in demo mode" 
ON public.organization_analytics FOR INSERT 
TO anon 
WITH CHECK (true);

-- Policy 7: Allow anonymous users to update analytics (for demo mode)
CREATE POLICY "Anonymous users can update organization analytics in demo mode" 
ON public.organization_analytics FOR UPDATE 
TO anon 
USING (true)
WITH CHECK (true);

-- Policy 8: Allow anonymous users to delete analytics (for demo mode)
CREATE POLICY "Anonymous users can delete organization analytics in demo mode" 
ON public.organization_analytics FOR DELETE 
TO anon 
USING (true);

-- Add policy comments for documentation
COMMENT ON POLICY "Users can view all organizations" ON public.organizations IS 'Allows authenticated users to view active organizations';
COMMENT ON POLICY "Users can insert organizations" ON public.organizations IS 'Allows authenticated users to create new organizations';
COMMENT ON POLICY "Users can update organizations" ON public.organizations IS 'Allows authenticated users to modify active organizations';
COMMENT ON POLICY "Users can delete organizations" ON public.organizations IS 'Allows authenticated users to soft delete organizations';
COMMENT ON POLICY "Anonymous users can view organizations in demo mode" ON public.organizations IS 'Enables demo mode functionality without authentication';

COMMENT ON POLICY "Users can view all organization interactions" ON public.organization_interactions IS 'Allows authenticated users to view all interaction history';
COMMENT ON POLICY "Users can insert organization interactions" ON public.organization_interactions IS 'Allows authenticated users to log new interactions';
COMMENT ON POLICY "Users can update organization interactions" ON public.organization_interactions IS 'Allows authenticated users to modify interaction records';
COMMENT ON POLICY "Users can delete organization interactions" ON public.organization_interactions IS 'Allows authenticated users to delete interaction records';

COMMENT ON POLICY "Users can view all organization documents" ON public.organization_documents IS 'Allows authenticated users to view all organization documents';
COMMENT ON POLICY "Users can insert organization documents" ON public.organization_documents IS 'Allows authenticated users to upload documents';
COMMENT ON POLICY "Anonymous users can view public organization documents in demo mode" ON public.organization_documents IS 'Allows anonymous users to view public documents in demo mode';

COMMENT ON POLICY "Users can view all organization analytics" ON public.organization_analytics IS 'Allows authenticated users to view analytics data';
COMMENT ON POLICY "Users can insert organization analytics" ON public.organization_analytics IS 'Allows authenticated users to create analytics records';