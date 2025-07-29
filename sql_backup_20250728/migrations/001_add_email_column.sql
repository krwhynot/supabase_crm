-- =============================================================================
-- Migration 001: Add Email Column
-- =============================================================================
-- Date: 2024-07-26
-- Description: Add email field to user_submissions for better user identification
-- 
-- Development: Apply via MCP commands
-- Production: Apply via Supabase Dashboard SQL Editor
-- =============================================================================

-- Add email column to user_submissions table
ALTER TABLE public.user_submissions 
    ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add constraint for email format (basic validation)
ALTER TABLE public.user_submissions 
    ADD CONSTRAINT email_format_check 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_user_submissions_email 
    ON public.user_submissions(email);

-- Add comment
COMMENT ON COLUMN public.user_submissions.email IS 'User email address with format validation';

-- Update RLS policy to include email access
CREATE POLICY "Enable email read" ON public.user_submissions
    FOR SELECT 
    USING (email IS NOT NULL);