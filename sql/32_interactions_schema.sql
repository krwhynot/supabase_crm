-- =============================================================================
-- Interactions Schema for CRM Customer Interaction Management
-- =============================================================================
-- This file contains the interactions table definition for comprehensive
-- customer interaction tracking with opportunities and contacts integration.
--
-- Applied: Task 1.1 - Database Schema Creation
-- Confidence: 95%
-- =============================================================================

-- Create enum for interaction types (simplified from requirements)
CREATE TYPE public.interaction_type AS ENUM (
    'EMAIL',
    'CALL', 
    'IN_PERSON',
    'DEMO',
    'FOLLOW_UP'
);

-- Interactions table - Customer interaction management
CREATE TABLE IF NOT EXISTS public.interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Required Basic Information
    interaction_type public.interaction_type NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    subject VARCHAR(255) NOT NULL,
    
    -- Optional Information
    notes TEXT,
    
    -- Foreign Key Relationships
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    created_by UUID, -- For future user/principal integration
    
    -- Follow-up Logic
    follow_up_needed BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    
    -- Timestamps (following opportunity pattern)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Soft delete (following opportunity pattern)
    deleted_at TIMESTAMPTZ
);

-- Add comments for documentation
COMMENT ON TABLE public.interactions IS 'Customer interactions tracking for CRM functionality';
COMMENT ON COLUMN public.interactions.id IS 'Unique identifier using UUID for better scalability';
COMMENT ON COLUMN public.interactions.interaction_type IS 'Type of interaction (EMAIL, CALL, IN_PERSON, DEMO, FOLLOW_UP)';
COMMENT ON COLUMN public.interactions.date IS 'Date and time when interaction occurred, required field';
COMMENT ON COLUMN public.interactions.subject IS 'Brief description/subject of the interaction, required field, max 255 chars';
COMMENT ON COLUMN public.interactions.notes IS 'Detailed notes about the interaction, optional field, max 2000 chars';
COMMENT ON COLUMN public.interactions.opportunity_id IS 'Foreign key to opportunities table, optional relationship';
COMMENT ON COLUMN public.interactions.contact_id IS 'Foreign key to contacts table, optional relationship';
COMMENT ON COLUMN public.interactions.created_by IS 'User who created this interaction, for future user integration';
COMMENT ON COLUMN public.interactions.follow_up_needed IS 'Whether a follow-up action is required';
COMMENT ON COLUMN public.interactions.follow_up_date IS 'Date when follow-up should occur, must be >= interaction date';
COMMENT ON COLUMN public.interactions.created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN public.interactions.updated_at IS 'Timestamp when record was last updated';
COMMENT ON COLUMN public.interactions.deleted_at IS 'Soft delete timestamp (NULL = active)';

-- Add constraints following opportunity patterns
ALTER TABLE public.interactions 
ADD CONSTRAINT interactions_subject_not_empty CHECK (LENGTH(TRIM(subject)) > 0);

ALTER TABLE public.interactions 
ADD CONSTRAINT interactions_subject_length CHECK (LENGTH(subject) <= 255);

ALTER TABLE public.interactions 
ADD CONSTRAINT interactions_notes_length CHECK (
    notes IS NULL OR LENGTH(notes) <= 2000
);

ALTER TABLE public.interactions 
ADD CONSTRAINT interactions_date_valid CHECK (
    date <= NOW() + INTERVAL '1 day' -- Allow slight future dates for timezone adjustments
);

ALTER TABLE public.interactions 
ADD CONSTRAINT interactions_follow_up_date_valid CHECK (
    follow_up_date IS NULL OR 
    follow_up_date >= DATE(date)
);

ALTER TABLE public.interactions 
ADD CONSTRAINT interactions_follow_up_logic CHECK (
    (follow_up_needed = FALSE AND follow_up_date IS NULL) OR
    (follow_up_needed = TRUE) -- follow_up_date can be null even when needed (to be scheduled later)
);

-- Add relationship validation constraints
-- Ensure opportunity_id references an actual opportunity
ALTER TABLE public.interactions 
ADD CONSTRAINT interactions_opportunity_exists CHECK (
    opportunity_id IS NULL OR 
    EXISTS (
        SELECT 1 FROM public.opportunities 
        WHERE id = opportunity_id AND deleted_at IS NULL
    )
);

-- Ensure contact_id references an actual contact
ALTER TABLE public.interactions 
ADD CONSTRAINT interactions_contact_exists CHECK (
    contact_id IS NULL OR 
    EXISTS (
        SELECT 1 FROM public.contacts 
        WHERE id = contact_id
    )
);

-- Add updated_at trigger (reuse existing function)
CREATE TRIGGER update_interactions_updated_at 
    BEFORE UPDATE ON public.interactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Follow-up date management trigger
CREATE OR REPLACE FUNCTION update_interaction_follow_up_tracking()
RETURNS TRIGGER AS $$
BEGIN
    -- Clear follow_up_date if follow_up_needed is set to false
    IF NEW.follow_up_needed = FALSE THEN
        NEW.follow_up_date = NULL;
    END IF;
    
    -- Validate follow_up_date is not in the past relative to interaction date
    IF NEW.follow_up_date IS NOT NULL AND NEW.follow_up_date < DATE(NEW.date) THEN
        RAISE EXCEPTION 'Follow-up date cannot be before interaction date';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER interaction_follow_up_tracking_trigger
    BEFORE INSERT OR UPDATE ON public.interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_interaction_follow_up_tracking();

-- Enable RLS on interactions table (following opportunity pattern)
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Interactions (following opportunity patterns)
CREATE POLICY "Users can view all interactions" 
ON public.interactions FOR SELECT 
TO authenticated 
USING (deleted_at IS NULL);

CREATE POLICY "Users can insert interactions" 
ON public.interactions FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Users can update interactions" 
ON public.interactions FOR UPDATE 
TO authenticated 
USING (deleted_at IS NULL)
WITH CHECK (true);

CREATE POLICY "Users can delete interactions" 
ON public.interactions FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (deleted_at IS NOT NULL);

-- Performance Indexes following opportunity patterns

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_interactions_interaction_type 
ON public.interactions(interaction_type) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_interactions_date 
ON public.interactions(date DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_interactions_subject 
ON public.interactions USING gin(to_tsvector('english', subject)) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_interactions_subject_trgm 
ON public.interactions USING gin(subject gin_trgm_ops) WHERE deleted_at IS NULL;

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_interactions_opportunity_id 
ON public.interactions(opportunity_id) WHERE deleted_at IS NULL AND opportunity_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_interactions_contact_id 
ON public.interactions(contact_id) WHERE deleted_at IS NULL AND contact_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_interactions_created_by 
ON public.interactions(created_by) WHERE deleted_at IS NULL AND created_by IS NOT NULL;

-- Follow-up management indexes
CREATE INDEX IF NOT EXISTS idx_interactions_follow_up_needed 
ON public.interactions(follow_up_needed) WHERE deleted_at IS NULL AND follow_up_needed = TRUE;

CREATE INDEX IF NOT EXISTS idx_interactions_follow_up_date 
ON public.interactions(follow_up_date) WHERE deleted_at IS NULL AND follow_up_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_interactions_overdue_follow_up 
ON public.interactions(follow_up_date) WHERE deleted_at IS NULL AND follow_up_needed = TRUE AND follow_up_date < CURRENT_DATE;

-- Timestamp indexes
CREATE INDEX IF NOT EXISTS idx_interactions_created_at 
ON public.interactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_interactions_updated_at 
ON public.interactions(updated_at DESC) WHERE deleted_at IS NULL;

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_interactions_opportunity_date 
ON public.interactions(opportunity_id, date DESC) WHERE deleted_at IS NULL AND opportunity_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_interactions_contact_date 
ON public.interactions(contact_id, date DESC) WHERE deleted_at IS NULL AND contact_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_interactions_type_date 
ON public.interactions(interaction_type, date DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_interactions_created_by_date 
ON public.interactions(created_by, date DESC) WHERE deleted_at IS NULL AND created_by IS NOT NULL;

-- Add policy comments for documentation
COMMENT ON POLICY "Users can view all interactions" ON public.interactions IS 'Allows authenticated users to view active interactions';
COMMENT ON POLICY "Users can insert interactions" ON public.interactions IS 'Allows authenticated users to create new interactions';
COMMENT ON POLICY "Users can update interactions" ON public.interactions IS 'Allows authenticated users to update existing interactions';
COMMENT ON POLICY "Users can delete interactions" ON public.interactions IS 'Allows authenticated users to soft delete interactions';

-- Add index comments for documentation
COMMENT ON INDEX idx_interactions_interaction_type IS 'Index for filtering interactions by type';
COMMENT ON INDEX idx_interactions_date IS 'Index for sorting interactions by date (most recent first)';
COMMENT ON INDEX idx_interactions_subject IS 'Full-text search index for interaction subjects';
COMMENT ON INDEX idx_interactions_subject_trgm IS 'Trigram index for fuzzy subject matching';
COMMENT ON INDEX idx_interactions_opportunity_date IS 'Composite index for opportunity-specific interaction queries';
COMMENT ON INDEX idx_interactions_contact_date IS 'Composite index for contact-specific interaction queries';
COMMENT ON INDEX idx_interactions_follow_up_date IS 'Index for follow-up date queries and overdue follow-up detection';
COMMENT ON INDEX idx_interactions_overdue_follow_up IS 'Specialized index for finding overdue follow-ups';