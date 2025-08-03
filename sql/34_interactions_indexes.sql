-- =============================================================================
-- Comprehensive Performance Indexes for Interactions Table
-- =============================================================================
-- Task 1.3: Database Indexes Implementation for Interaction Vertical Scaling MVP
-- 
-- This file implements comprehensive database indexes optimized for expected
-- query patterns and performance requirements for the interactions system.
--
-- Performance Targets:
-- - List queries: <100ms for 1000 interactions
-- - Search queries: <200ms with text matching  
-- - Filter queries: <50ms for status/type filtering
-- - Pagination: <50ms for offset/limit operations
--
-- Applied: Task 1.3 - Database Indexes Implementation
-- Confidence: 95%
-- =============================================================================

-- =============================================================================
-- PRIMARY ACCESS PATTERN INDEXES
-- =============================================================================
-- These indexes optimize the most common access patterns for interactions

-- Foreign Key Relationship Indexes (High Priority)
-- Optimizes opportunity-based interaction queries
DROP INDEX IF EXISTS idx_interactions_opportunity_id;
CREATE INDEX idx_interactions_opportunity_id 
ON public.interactions(opportunity_id) 
WHERE deleted_at IS NULL AND opportunity_id IS NOT NULL;

-- Optimizes contact-based interaction queries  
DROP INDEX IF EXISTS idx_interactions_contact_id;
CREATE INDEX idx_interactions_contact_id 
ON public.interactions(contact_id) 
WHERE deleted_at IS NULL AND contact_id IS NOT NULL;

-- Optimizes user/principal-based filtering for RLS policies
DROP INDEX IF EXISTS idx_interactions_created_by;
CREATE INDEX idx_interactions_created_by 
ON public.interactions(created_by) 
WHERE deleted_at IS NULL AND created_by IS NOT NULL;

-- =============================================================================
-- DATE RANGE QUERY OPTIMIZATION
-- =============================================================================
-- Optimizes timeline and reporting queries with date ranges

-- Primary date index for timeline queries (most recent first)
DROP INDEX IF EXISTS idx_interactions_date;
CREATE INDEX idx_interactions_date 
ON public.interactions(date DESC) 
WHERE deleted_at IS NULL;

-- Date range queries with BRIN index for large datasets
CREATE INDEX IF NOT EXISTS idx_interactions_date_brin 
ON public.interactions USING brin(date) 
WHERE deleted_at IS NULL;

-- Created timestamp index for audit and analytics
DROP INDEX IF EXISTS idx_interactions_created_at;
CREATE INDEX idx_interactions_created_at 
ON public.interactions(created_at DESC);

-- Updated timestamp for recent changes tracking
DROP INDEX IF EXISTS idx_interactions_updated_at;
CREATE INDEX idx_interactions_updated_at 
ON public.interactions(updated_at DESC) 
WHERE deleted_at IS NULL;

-- =============================================================================
-- TEXT SEARCH OPTIMIZATION
-- =============================================================================
-- Optimizes subject field search with full-text and fuzzy matching

-- Enhanced full-text search index for subject field
DROP INDEX IF EXISTS idx_interactions_subject;
CREATE INDEX idx_interactions_subject 
ON public.interactions USING gin(to_tsvector('english', subject)) 
WHERE deleted_at IS NULL;

-- Trigram index for fuzzy subject matching and autocomplete
DROP INDEX IF EXISTS idx_interactions_subject_trgm;
CREATE INDEX idx_interactions_subject_trgm 
ON public.interactions USING gin(subject gin_trgm_ops) 
WHERE deleted_at IS NULL;

-- Case-insensitive subject prefix search
CREATE INDEX IF NOT EXISTS idx_interactions_subject_prefix 
ON public.interactions(lower(subject) text_pattern_ops) 
WHERE deleted_at IS NULL;

-- Combined full-text search across subject and notes
CREATE INDEX IF NOT EXISTS idx_interactions_full_text_search 
ON public.interactions USING gin(
    to_tsvector('english', 
        COALESCE(subject, '') || ' ' || 
        COALESCE(notes, '')
    )
) WHERE deleted_at IS NULL;

-- =============================================================================
-- STATUS AND TYPE FILTERING OPTIMIZATION
-- =============================================================================
-- Optimizes filtering by interaction_type and follow_up_needed

-- Interaction type filtering index
DROP INDEX IF EXISTS idx_interactions_interaction_type;
CREATE INDEX idx_interactions_interaction_type 
ON public.interactions(interaction_type) 
WHERE deleted_at IS NULL;

-- Follow-up needed filtering index (partial index for efficiency)
DROP INDEX IF EXISTS idx_interactions_follow_up_needed;
CREATE INDEX idx_interactions_follow_up_needed 
ON public.interactions(follow_up_needed) 
WHERE deleted_at IS NULL AND follow_up_needed = TRUE;

-- Follow-up date management index
DROP INDEX IF EXISTS idx_interactions_follow_up_date;
CREATE INDEX idx_interactions_follow_up_date 
ON public.interactions(follow_up_date) 
WHERE deleted_at IS NULL AND follow_up_date IS NOT NULL;

-- Overdue follow-ups detection (critical for CRM workflows)
DROP INDEX IF EXISTS idx_interactions_overdue_follow_up;
CREATE INDEX idx_interactions_overdue_follow_up 
ON public.interactions(follow_up_date) 
WHERE deleted_at IS NULL 
  AND follow_up_needed = TRUE 
  AND follow_up_date < CURRENT_DATE;

-- Pending follow-ups (follow_up_needed = TRUE, no date set)
CREATE INDEX IF NOT EXISTS idx_interactions_pending_follow_up 
ON public.interactions(created_at DESC) 
WHERE deleted_at IS NULL 
  AND follow_up_needed = TRUE 
  AND follow_up_date IS NULL;

-- =============================================================================
-- SOFT DELETE PATTERN OPTIMIZATION
-- =============================================================================
-- Optimizes queries that filter out deleted records

-- Primary active records index (covers most queries)
CREATE INDEX IF NOT EXISTS idx_interactions_active 
ON public.interactions(id) 
WHERE deleted_at IS NULL;

-- Active records with timestamp ordering
CREATE INDEX IF NOT EXISTS idx_interactions_active_by_date 
ON public.interactions(date DESC, id) 
WHERE deleted_at IS NULL;

-- Soft delete audit index (for recovery and admin operations)
CREATE INDEX IF NOT EXISTS idx_interactions_deleted_at 
ON public.interactions(deleted_at) 
WHERE deleted_at IS NOT NULL;

-- =============================================================================
-- COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- =============================================================================
-- Optimizes complex queries that filter by multiple criteria

-- Opportunity + Date (Timeline View Performance Target: <100ms)
DROP INDEX IF EXISTS idx_interactions_opportunity_date;
CREATE INDEX idx_interactions_opportunity_date 
ON public.interactions(opportunity_id, date DESC) 
WHERE deleted_at IS NULL AND opportunity_id IS NOT NULL;

-- Contact + Date (Contact Activity Timeline Performance Target: <100ms)
DROP INDEX IF EXISTS idx_interactions_contact_date;
CREATE INDEX idx_interactions_contact_date 
ON public.interactions(contact_id, date DESC) 
WHERE deleted_at IS NULL AND contact_id IS NOT NULL;

-- Type + Date (Type-filtered Lists Performance Target: <50ms)
DROP INDEX IF EXISTS idx_interactions_type_date;
CREATE INDEX idx_interactions_type_date 
ON public.interactions(interaction_type, date DESC) 
WHERE deleted_at IS NULL;

-- Created By + Date (User Activity Performance Target: <100ms)
DROP INDEX IF EXISTS idx_interactions_created_by_date;
CREATE INDEX idx_interactions_created_by_date 
ON public.interactions(created_by, date DESC) 
WHERE deleted_at IS NULL AND created_by IS NOT NULL;

-- Opportunity + Type (Opportunity Interaction Analysis)
CREATE INDEX IF NOT EXISTS idx_interactions_opportunity_type 
ON public.interactions(opportunity_id, interaction_type) 
WHERE deleted_at IS NULL AND opportunity_id IS NOT NULL;

-- Contact + Type (Contact Interaction Patterns)
CREATE INDEX IF NOT EXISTS idx_interactions_contact_type 
ON public.interactions(contact_id, interaction_type) 
WHERE deleted_at IS NULL AND contact_id IS NOT NULL;

-- =============================================================================
-- PRINCIPAL-BASED ACCESS OPTIMIZATION (RLS SUPPORT)
-- =============================================================================
-- Supports Row Level Security policies and principal-based filtering

-- Created By + Opportunity (Principal Access Control)
CREATE INDEX IF NOT EXISTS idx_interactions_created_by_opportunity 
ON public.interactions(created_by, opportunity_id) 
WHERE deleted_at IS NULL 
  AND created_by IS NOT NULL 
  AND opportunity_id IS NOT NULL;

-- Created By + Contact (Principal Contact Access)
CREATE INDEX IF NOT EXISTS idx_interactions_created_by_contact 
ON public.interactions(created_by, contact_id) 
WHERE deleted_at IS NULL 
  AND created_by IS NOT NULL 
  AND contact_id IS NOT NULL;

-- Date Range + Created By (Principal-filtered Reporting)
CREATE INDEX IF NOT EXISTS idx_interactions_date_created_by 
ON public.interactions(date DESC, created_by) 
WHERE deleted_at IS NULL AND created_by IS NOT NULL;

-- =============================================================================
-- PAGINATION AND SORTING OPTIMIZATION
-- =============================================================================
-- Optimizes offset/limit queries and sorting operations

-- Default list view pagination (Performance Target: <50ms)
CREATE INDEX IF NOT EXISTS idx_interactions_default_pagination 
ON public.interactions(date DESC, id) 
WHERE deleted_at IS NULL;

-- Subject-sorted pagination
CREATE INDEX IF NOT EXISTS idx_interactions_subject_pagination 
ON public.interactions(subject, id) 
WHERE deleted_at IS NULL;

-- Type-sorted pagination  
CREATE INDEX IF NOT EXISTS idx_interactions_type_pagination 
ON public.interactions(interaction_type, date DESC, id) 
WHERE deleted_at IS NULL;

-- =============================================================================
-- FOLLOW-UP WORKFLOW OPTIMIZATION
-- =============================================================================
-- Specialized indexes for follow-up management workflows

-- Today's follow-ups (Daily CRM Workflow)
CREATE INDEX IF NOT EXISTS idx_interactions_todays_follow_ups 
ON public.interactions(follow_up_date, interaction_type) 
WHERE deleted_at IS NULL 
  AND follow_up_needed = TRUE 
  AND follow_up_date = CURRENT_DATE;

-- This week's follow-ups (Weekly Planning)
CREATE INDEX IF NOT EXISTS idx_interactions_weekly_follow_ups 
ON public.interactions(follow_up_date) 
WHERE deleted_at IS NULL 
  AND follow_up_needed = TRUE 
  AND follow_up_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days';

-- Follow-up by opportunity (Opportunity Management)
CREATE INDEX IF NOT EXISTS idx_interactions_opportunity_follow_up 
ON public.interactions(opportunity_id, follow_up_date) 
WHERE deleted_at IS NULL 
  AND opportunity_id IS NOT NULL 
  AND follow_up_needed = TRUE;

-- Follow-up by contact (Contact Management)
CREATE INDEX IF NOT EXISTS idx_interactions_contact_follow_up 
ON public.interactions(contact_id, follow_up_date) 
WHERE deleted_at IS NULL 
  AND contact_id IS NOT NULL 
  AND follow_up_needed = TRUE;

-- =============================================================================
-- ANALYTICS AND REPORTING OPTIMIZATION
-- =============================================================================
-- Optimizes analytical queries and reporting operations

-- Monthly interaction counts (Performance Reporting)
CREATE INDEX IF NOT EXISTS idx_interactions_monthly_analytics 
ON public.interactions(
    date_trunc('month', date), 
    interaction_type
) WHERE deleted_at IS NULL;

-- Interaction frequency analysis (Contact Engagement)
CREATE INDEX IF NOT EXISTS idx_interactions_frequency_analysis 
ON public.interactions(contact_id, date_trunc('week', date)) 
WHERE deleted_at IS NULL AND contact_id IS NOT NULL;

-- Opportunity interaction metrics (Sales Analytics)
CREATE INDEX IF NOT EXISTS idx_interactions_opportunity_metrics 
ON public.interactions(
    opportunity_id, 
    interaction_type, 
    date_trunc('month', date)
) WHERE deleted_at IS NULL AND opportunity_id IS NOT NULL;

-- User productivity analytics (Team Performance)
CREATE INDEX IF NOT EXISTS idx_interactions_user_productivity 
ON public.interactions(
    created_by, 
    date_trunc('day', date)
) WHERE deleted_at IS NULL AND created_by IS NOT NULL;

-- =============================================================================
-- PERFORMANCE MONITORING INDEXES
-- =============================================================================
-- Indexes for monitoring query performance and system health

-- Query performance monitoring
CREATE INDEX IF NOT EXISTS idx_interactions_performance_monitoring 
ON public.interactions(created_at, updated_at, id) 
WHERE deleted_at IS NULL;

-- Data quality monitoring (detect orphaned records)
CREATE INDEX IF NOT EXISTS idx_interactions_data_quality 
ON public.interactions(opportunity_id, contact_id) 
WHERE deleted_at IS NULL 
  AND (opportunity_id IS NULL AND contact_id IS NULL);

-- =============================================================================
-- INDEX COMMENTS FOR DOCUMENTATION
-- =============================================================================

-- Primary access pattern indexes
COMMENT ON INDEX idx_interactions_opportunity_id IS 'Optimizes opportunity-based interaction queries (<100ms target)';
COMMENT ON INDEX idx_interactions_contact_id IS 'Optimizes contact-based interaction queries (<100ms target)';
COMMENT ON INDEX idx_interactions_created_by IS 'Optimizes principal-based filtering for RLS policies';

-- Date range optimization indexes
COMMENT ON INDEX idx_interactions_date IS 'Primary date index for timeline queries (most recent first)';
COMMENT ON INDEX idx_interactions_date_brin IS 'BRIN index for efficient date range queries on large datasets';
COMMENT ON INDEX idx_interactions_created_at IS 'Audit trail and analytics timestamp index';

-- Text search optimization indexes
COMMENT ON INDEX idx_interactions_subject IS 'Full-text search index for subject field (<200ms target)';
COMMENT ON INDEX idx_interactions_subject_trgm IS 'Trigram index for fuzzy subject matching and autocomplete';
COMMENT ON INDEX idx_interactions_full_text_search IS 'Combined full-text search across subject and notes';

-- Status filtering indexes
COMMENT ON INDEX idx_interactions_interaction_type IS 'Type filtering index (<50ms target)';
COMMENT ON INDEX idx_interactions_follow_up_needed IS 'Follow-up filtering index (partial for efficiency)';
COMMENT ON INDEX idx_interactions_overdue_follow_up IS 'Critical index for overdue follow-up detection';

-- Composite query pattern indexes
COMMENT ON INDEX idx_interactions_opportunity_date IS 'Opportunity timeline view optimization (<100ms target)';
COMMENT ON INDEX idx_interactions_contact_date IS 'Contact activity timeline optimization (<100ms target)';
COMMENT ON INDEX idx_interactions_type_date IS 'Type-filtered list queries optimization (<50ms target)';

-- Principal access indexes
COMMENT ON INDEX idx_interactions_created_by_opportunity IS 'Principal-based opportunity access control for RLS';
COMMENT ON INDEX idx_interactions_date_created_by IS 'Principal-filtered reporting optimization';

-- Pagination indexes
COMMENT ON INDEX idx_interactions_default_pagination IS 'Default list view pagination (<50ms target)';
COMMENT ON INDEX idx_interactions_type_pagination IS 'Type-sorted pagination optimization';

-- Follow-up workflow indexes
COMMENT ON INDEX idx_interactions_todays_follow_ups IS 'Daily CRM workflow optimization';
COMMENT ON INDEX idx_interactions_opportunity_follow_up IS 'Opportunity-based follow-up management';

-- Analytics indexes
COMMENT ON INDEX idx_interactions_monthly_analytics IS 'Monthly reporting and analytics optimization';
COMMENT ON INDEX idx_interactions_opportunity_metrics IS 'Sales analytics and opportunity tracking';

-- Performance monitoring indexes
COMMENT ON INDEX idx_interactions_performance_monitoring IS 'Query performance and system health monitoring';
COMMENT ON INDEX idx_interactions_data_quality IS 'Data quality monitoring for orphaned records';

-- =============================================================================
-- PERFORMANCE VERIFICATION QUERIES
-- =============================================================================
-- Sample queries to verify index performance meets targets

/*
-- Verification Query 1: List queries (<100ms target)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, subject, interaction_type, date, opportunity_id, contact_id 
FROM public.interactions 
WHERE deleted_at IS NULL 
ORDER BY date DESC 
LIMIT 50;

-- Verification Query 2: Opportunity timeline (<100ms target)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, subject, interaction_type, date, notes 
FROM public.interactions 
WHERE deleted_at IS NULL 
  AND opportunity_id = 'sample-uuid'
ORDER BY date DESC;

-- Verification Query 3: Text search (<200ms target)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, subject, interaction_type, date 
FROM public.interactions 
WHERE deleted_at IS NULL 
  AND to_tsvector('english', subject) @@ to_tsquery('english', 'demo & client');

-- Verification Query 4: Status filtering (<50ms target)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) 
FROM public.interactions 
WHERE deleted_at IS NULL 
  AND interaction_type = 'FOLLOW_UP' 
  AND follow_up_needed = TRUE;

-- Verification Query 5: Date range reporting (<100ms target)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT interaction_type, COUNT(*) 
FROM public.interactions 
WHERE deleted_at IS NULL 
  AND date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY interaction_type;

-- Verification Query 6: Pagination performance (<50ms target)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, subject, interaction_type, date 
FROM public.interactions 
WHERE deleted_at IS NULL 
ORDER BY date DESC 
LIMIT 20 OFFSET 100;
*/