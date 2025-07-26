-- =============================================================================
-- Row Level Security (RLS) Policies
-- =============================================================================
-- This file contains security policies for data access control.
-- 
-- Development: Apply via MCP commands
-- Production: Apply via Supabase Dashboard SQL Editor
-- =============================================================================

-- Enable RLS on user_submissions table
ALTER TABLE public.user_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public insert for form submissions
-- This allows anyone to submit the form
CREATE POLICY "Enable insert for all users" ON public.user_submissions
    FOR INSERT 
    WITH CHECK (true);

-- Policy: Allow public read for testing and analytics
-- Note: In production, you might want to restrict this
CREATE POLICY "Enable read access for all users" ON public.user_submissions
    FOR SELECT 
    USING (true);

-- Policy: Prevent public updates (optional security measure)
-- Only allow updates if you implement user authentication later
CREATE POLICY "Restrict updates" ON public.user_submissions
    FOR UPDATE 
    USING (false);

-- Policy: Prevent public deletes (optional security measure)
-- Only allow deletes if you implement admin authentication later
CREATE POLICY "Restrict deletes" ON public.user_submissions
    FOR DELETE 
    USING (false);