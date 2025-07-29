-- =============================================================================
-- Row Level Security (RLS) Policies for Contacts Table
-- =============================================================================
-- This file contains RLS policies for the contacts table following
-- Supabase security best practices.
--
-- Applied: Stage 1 - Database Implementation  
-- Confidence: 90%
-- =============================================================================

-- Enable RLS on contacts table
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to view all contacts
-- This is appropriate for a team CRM where all team members can see all contacts
CREATE POLICY "Users can view all contacts" 
ON public.contacts FOR SELECT 
TO authenticated 
USING (true);

-- Policy 2: Allow authenticated users to insert contacts
CREATE POLICY "Users can insert contacts" 
ON public.contacts FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Policy 3: Allow authenticated users to update contacts
CREATE POLICY "Users can update contacts" 
ON public.contacts FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Policy 4: Allow authenticated users to delete contacts
CREATE POLICY "Users can delete contacts" 
ON public.contacts FOR DELETE 
TO authenticated 
USING (true);

-- Policy 5: Allow anonymous users to view contacts (for demo mode)
-- This enables the demo mode to work without authentication
CREATE POLICY "Anonymous users can view contacts in demo mode" 
ON public.contacts FOR SELECT 
TO anon 
USING (true);

-- Policy 6: Allow anonymous users to insert contacts (for demo mode)
CREATE POLICY "Anonymous users can insert contacts in demo mode" 
ON public.contacts FOR INSERT 
TO anon 
WITH CHECK (true);

-- Policy 7: Allow anonymous users to update contacts (for demo mode)
CREATE POLICY "Anonymous users can update contacts in demo mode" 
ON public.contacts FOR UPDATE 
TO anon 
USING (true)
WITH CHECK (true);

-- Policy 8: Allow anonymous users to delete contacts (for demo mode)
CREATE POLICY "Anonymous users can delete contacts in demo mode" 
ON public.contacts FOR DELETE 
TO anon 
USING (true);

-- Add comments for documentation
COMMENT ON POLICY "Users can view all contacts" ON public.contacts IS 'Allows authenticated users to view all contacts in the system';
COMMENT ON POLICY "Users can insert contacts" ON public.contacts IS 'Allows authenticated users to create new contacts';
COMMENT ON POLICY "Users can update contacts" ON public.contacts IS 'Allows authenticated users to modify existing contacts';
COMMENT ON POLICY "Users can delete contacts" ON public.contacts IS 'Allows authenticated users to delete contacts';
COMMENT ON POLICY "Anonymous users can view contacts in demo mode" ON public.contacts IS 'Enables demo mode functionality without authentication';
COMMENT ON POLICY "Anonymous users can insert contacts in demo mode" ON public.contacts IS 'Enables demo mode contact creation';
COMMENT ON POLICY "Anonymous users can update contacts in demo mode" ON public.contacts IS 'Enables demo mode contact editing';
COMMENT ON POLICY "Anonymous users can delete contacts in demo mode" ON public.contacts IS 'Enables demo mode contact deletion';