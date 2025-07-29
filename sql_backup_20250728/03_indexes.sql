-- =============================================================================
-- Performance Indexes
-- =============================================================================
-- This file contains indexes for performance optimization.
-- 
-- Development: Apply via MCP commands
-- Production: Apply via Supabase Dashboard SQL Editor
-- =============================================================================

-- Index for queries ordered by creation time (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_user_submissions_created_at 
    ON public.user_submissions(created_at DESC);

-- Index for searching by name (useful for analytics)
CREATE INDEX IF NOT EXISTS idx_user_submissions_name 
    ON public.user_submissions(first_name, last_name);

-- Index for analytics by favorite color
CREATE INDEX IF NOT EXISTS idx_user_submissions_color 
    ON public.user_submissions(favorite_color);

-- Index for age-based analytics
CREATE INDEX IF NOT EXISTS idx_user_submissions_age 
    ON public.user_submissions(age);

-- Composite index for time-based analytics
CREATE INDEX IF NOT EXISTS idx_user_submissions_time_analytics 
    ON public.user_submissions(favorite_color, created_at DESC);

-- Comments for documentation
COMMENT ON INDEX idx_user_submissions_created_at IS 'Optimizes queries ordered by creation time';
COMMENT ON INDEX idx_user_submissions_name IS 'Optimizes name-based searches and analytics';
COMMENT ON INDEX idx_user_submissions_color IS 'Optimizes favorite color analytics';
COMMENT ON INDEX idx_user_submissions_age IS 'Optimizes age-based analytics';
COMMENT ON INDEX idx_user_submissions_time_analytics IS 'Optimizes time-series analytics by color';