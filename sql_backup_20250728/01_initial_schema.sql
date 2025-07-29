-- =============================================================================
-- Initial Schema for Supabase Form Application
-- =============================================================================
-- This file contains the core table definitions for the application.
-- 
-- Development: Apply via MCP commands
-- Production: Apply via Supabase Dashboard SQL Editor
-- =============================================================================

-- User submissions table for form data
CREATE TABLE IF NOT EXISTS public.user_submissions (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    age INTEGER NOT NULL CHECK (age > 0),
    favorite_color VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE public.user_submissions IS 'Stores user form submissions from the frontend application';
COMMENT ON COLUMN public.user_submissions.age IS 'User age, must be positive';
COMMENT ON COLUMN public.user_submissions.favorite_color IS 'Selected from predefined options in frontend';