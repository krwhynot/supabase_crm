-- =============================================================================
-- Interactions Performance Indexes
-- =============================================================================
-- This file contains performance indexes for the interactions table following
-- indexing strategy patterns from the opportunities table for consistency.
--
-- Applied: Stage 1.3 - Performance Index Implementation
-- Architecture Reference: Opportunity indexing patterns (30_opportunities_schema.sql)
-- Performance Target: Sub-200ms query response for typical interaction operations
-- =============================================================================

-- Primary Foreign Key Index (Critical for RLS performance)
-- Index on opportunity_id for foreign key performance and RLS policy optimization
CREATE INDEX IF NOT EXISTS idx_interactions_opportunity_id 
ON public.interactions(opportunity_id) 
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_interactions_opportunity_id 
IS 'Critical index for opportunity_id foreign key performance and RLS policy optimization';

-- Temporal Indexes for Timeline Queries
-- Index on interaction_date for timeline and chronological queries
CREATE INDEX IF NOT EXISTS idx_interactions_date 
ON public.interactions(interaction_date DESC) 
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_interactions_date 
IS 'Optimizes timeline queries and date-based filtering for active interactions';

-- Index on follow_up_date for upcoming follow-up queries
CREATE INDEX IF NOT EXISTS idx_interactions_follow_up_date 
ON public.interactions(follow_up_date) 
WHERE deleted_at IS NULL AND follow_up_required = TRUE AND follow_up_date IS NOT NULL;

COMMENT ON INDEX idx_interactions_follow_up_date 
IS 'Optimizes queries for pending follow-ups and deadline management';

-- Filtering and Search Indexes
-- Index on interaction type for filtering performance
CREATE INDEX IF NOT EXISTS idx_interactions_type 
ON public.interactions(type) 
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_interactions_type 
IS 'Optimizes filtering by interaction type (EMAIL, CALL, IN_PERSON, etc.)';

-- Index on interaction status for status-based queries
CREATE INDEX IF NOT EXISTS idx_interactions_status 
ON public.interactions(status) 
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_interactions_status 
IS 'Optimizes filtering by interaction status (SCHEDULED, COMPLETED, etc.)';

-- Index on outcome for analytics and reporting
CREATE INDEX IF NOT EXISTS idx_interactions_outcome 
ON public.interactions(outcome) 
WHERE deleted_at IS NULL AND outcome IS NOT NULL;

COMMENT ON INDEX idx_interactions_outcome 
IS 'Optimizes outcome-based analytics and success rate calculations';

-- User and Audit Indexes
-- Composite index on created_by, interaction_date for user-specific queries
CREATE INDEX IF NOT EXISTS idx_interactions_created_by_date 
ON public.interactions(created_by, interaction_date DESC) 
WHERE deleted_at IS NULL AND created_by IS NOT NULL;

COMMENT ON INDEX idx_interactions_created_by_date 
IS 'Optimizes user-specific interaction history queries with date ordering';

-- Index on created_at for audit and general date ordering
CREATE INDEX IF NOT EXISTS idx_interactions_created_at 
ON public.interactions(created_at DESC);

COMMENT ON INDEX idx_interactions_created_at 
IS 'General purpose index for audit queries and record creation ordering';

-- Composite Indexes for Common Query Patterns
-- Composite index on opportunity_id, interaction_date for opportunity timeline views
CREATE INDEX IF NOT EXISTS idx_interactions_opportunity_date 
ON public.interactions(opportunity_id, interaction_date DESC) 
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_interactions_opportunity_date 
IS 'Optimizes opportunity-specific interaction timelines and history views';

-- Composite index on opportunity_id, type for opportunity-specific type filtering
CREATE INDEX IF NOT EXISTS idx_interactions_opportunity_type 
ON public.interactions(opportunity_id, type) 
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_interactions_opportunity_type 
IS 'Optimizes opportunity-specific interaction type filtering';

-- Composite index on type, interaction_date for type-specific timelines
CREATE INDEX IF NOT EXISTS idx_interactions_type_date 
ON public.interactions(type, interaction_date DESC) 
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_interactions_type_date 
IS 'Optimizes type-specific interaction timelines (e.g., all calls chronologically)';

-- Composite index on status, follow_up_date for follow-up management
CREATE INDEX IF NOT EXISTS idx_interactions_status_followup 
ON public.interactions(status, follow_up_date) 
WHERE deleted_at IS NULL AND follow_up_required = TRUE;

COMMENT ON INDEX idx_interactions_status_followup 
IS 'Optimizes follow-up management queries by status and due date';

-- Full-Text Search Indexes
-- Full-text search index for subject field
CREATE INDEX IF NOT EXISTS idx_interactions_subject_fts 
ON public.interactions USING gin(to_tsvector('english', subject)) 
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_interactions_subject_fts 
IS 'Full-text search index for interaction subjects using English language configuration';

-- Trigram index for fuzzy subject matching
CREATE INDEX IF NOT EXISTS idx_interactions_subject_trgm 
ON public.interactions USING gin(subject gin_trgm_ops) 
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_interactions_subject_trgm 
IS 'Trigram index for fuzzy matching and autocomplete on interaction subjects';

-- Full-text search index for notes field
CREATE INDEX IF NOT EXISTS idx_interactions_notes_fts 
ON public.interactions USING gin(to_tsvector('english', notes)) 
WHERE deleted_at IS NULL AND notes IS NOT NULL;

COMMENT ON INDEX idx_interactions_notes_fts 
IS 'Full-text search index for interaction notes content';

-- JSONB Indexes for Metadata
-- GIN index on tags for tag-based filtering
CREATE INDEX IF NOT EXISTS idx_interactions_tags 
ON public.interactions USING gin(tags) 
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_interactions_tags 
IS 'GIN index for efficient tag-based filtering and search';

-- GIN index on participants for participant-based queries
CREATE INDEX IF NOT EXISTS idx_interactions_participants 
ON public.interactions USING gin(participants) 
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_interactions_participants 
IS 'GIN index for participant-based queries and filtering';

-- GIN index on custom_fields for flexible custom field queries
CREATE INDEX IF NOT EXISTS idx_interactions_custom_fields 
ON public.interactions USING gin(custom_fields) 
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_interactions_custom_fields 
IS 'GIN index for custom field queries and flexible metadata filtering';

-- Specialized Indexes for Analytics and Reporting
-- Index on rating for quality analytics
CREATE INDEX IF NOT EXISTS idx_interactions_rating 
ON public.interactions(rating DESC) 
WHERE deleted_at IS NULL AND rating IS NOT NULL;

COMMENT ON INDEX idx_interactions_rating 
IS 'Optimizes quality analytics and rating-based reporting queries';

-- Index on duration for time-based analytics
CREATE INDEX IF NOT EXISTS idx_interactions_duration 
ON public.interactions(duration_minutes) 
WHERE deleted_at IS NULL AND duration_minutes IS NOT NULL;

COMMENT ON INDEX idx_interactions_duration 
IS 'Optimizes duration-based analytics and time efficiency reporting';

-- Composite index for opportunity outcome analytics
CREATE INDEX IF NOT EXISTS idx_interactions_opportunity_outcome 
ON public.interactions(opportunity_id, outcome, interaction_date) 
WHERE deleted_at IS NULL AND outcome IS NOT NULL;

COMMENT ON INDEX idx_interactions_opportunity_outcome 
IS 'Optimizes opportunity-specific outcome analytics and trend analysis';

-- Partial Indexes for Specific Use Cases
-- Index for scheduled interactions (calendar views)
CREATE INDEX IF NOT EXISTS idx_interactions_scheduled 
ON public.interactions(interaction_date, type) 
WHERE deleted_at IS NULL AND status = 'SCHEDULED';

COMMENT ON INDEX idx_interactions_scheduled 
IS 'Optimizes calendar views and scheduled interaction management';

-- Index for completed interactions requiring follow-up
CREATE INDEX IF NOT EXISTS idx_interactions_completed_followup_needed 
ON public.interactions(follow_up_date, opportunity_id) 
WHERE deleted_at IS NULL 
AND status = 'COMPLETED' 
AND follow_up_required = TRUE 
AND follow_up_date IS NOT NULL;

COMMENT ON INDEX idx_interactions_completed_followup_needed 
IS 'Optimizes queries for completed interactions that need follow-up action';

-- Index for high-priority interactions (high rating or positive outcome)
CREATE INDEX IF NOT EXISTS idx_interactions_high_priority 
ON public.interactions(interaction_date DESC, opportunity_id) 
WHERE deleted_at IS NULL 
AND (rating >= 4 OR outcome = 'POSITIVE');

COMMENT ON INDEX idx_interactions_high_priority 
IS 'Optimizes queries for high-value interactions (high rating or positive outcome)';

-- Performance monitoring and statistics
-- Function to analyze index usage and performance
CREATE OR REPLACE FUNCTION analyze_interactions_index_performance()
RETURNS TABLE (
    index_name TEXT,
    index_size TEXT,
    index_scans BIGINT,
    rows_read BIGINT,
    rows_fetched BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname||'.'||indexname as index_name,
        pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) as index_size,
        idx_scan as index_scans,
        idx_tup_read as rows_read,
        idx_tup_fetch as rows_fetched
    FROM pg_stat_user_indexes 
    WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_interactions_%'
    ORDER BY idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION analyze_interactions_index_performance() 
IS 'Analysis function to monitor interaction index usage and performance metrics';

-- Index maintenance and optimization function
CREATE OR REPLACE FUNCTION maintain_interactions_indexes()
RETURNS TEXT AS $$
DECLARE
    maintenance_result TEXT;
BEGIN
    -- Analyze table statistics for query planner optimization
    ANALYZE public.interactions;
    
    -- Reindex if fragmentation is high (can be expensive, use carefully)
    -- REINDEX TABLE public.interactions;
    
    maintenance_result := 'Interactions table analyzed successfully at ' || NOW();
    
    RETURN maintenance_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION maintain_interactions_indexes() 
IS 'Maintenance function to analyze table statistics and optimize query planning';

-- Index performance validation
CREATE OR REPLACE FUNCTION validate_interactions_index_coverage()
RETURNS TABLE (
    query_pattern TEXT,
    index_used TEXT,
    performance_note TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES 
        ('SELECT * FROM interactions WHERE opportunity_id = ?', 'idx_interactions_opportunity_id', 'Primary foreign key lookup'),
        ('SELECT * FROM interactions WHERE interaction_date BETWEEN ? AND ?', 'idx_interactions_date', 'Date range queries'),
        ('SELECT * FROM interactions WHERE type = ?', 'idx_interactions_type', 'Type filtering'),
        ('SELECT * FROM interactions WHERE status = ?', 'idx_interactions_status', 'Status filtering'),
        ('SELECT * FROM interactions WHERE created_by = ? ORDER BY interaction_date', 'idx_interactions_created_by_date', 'User timeline queries'),
        ('SELECT * FROM interactions WHERE opportunity_id = ? ORDER BY interaction_date', 'idx_interactions_opportunity_date', 'Opportunity timelines'),
        ('Search in subject field', 'idx_interactions_subject_fts or idx_interactions_subject_trgm', 'Full-text and fuzzy search'),
        ('JSON tag queries', 'idx_interactions_tags', 'Tag-based filtering'),
        ('Follow-up management', 'idx_interactions_follow_up_date', 'Scheduled follow-ups');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_interactions_index_coverage() 
IS 'Documents expected index usage patterns for common interaction queries';

-- Log successful index creation
DO $$ BEGIN
    RAISE NOTICE 'Interactions performance indexes created successfully';
    RAISE NOTICE 'Primary indexes: opportunity_id, interaction_date, type, status';
    RAISE NOTICE 'Composite indexes: opportunity_date, opportunity_type, type_date, status_followup';
    RAISE NOTICE 'Search indexes: subject_fts, subject_trgm, notes_fts';
    RAISE NOTICE 'JSONB indexes: tags, participants, custom_fields';
    RAISE NOTICE 'Analytics indexes: rating, duration, opportunity_outcome';
    RAISE NOTICE 'Specialized indexes: scheduled, completed_followup_needed, high_priority';
    RAISE NOTICE 'Performance functions: analyze_interactions_index_performance, maintain_interactions_indexes';
END $$;