-- =============================================================================
-- Interactions Schema for CRM Interaction Management
-- =============================================================================
-- This file contains the interactions table and related schema for
-- comprehensive interaction tracking linked to opportunities.
--
-- Applied: Stage 1.1 - Database Schema Implementation
-- Confidence: 95%
-- Architecture Reference: Opportunity Management System (30_opportunities_schema.sql)
-- =============================================================================

-- Create enums for better data consistency
CREATE TYPE public.interaction_type AS ENUM (
    'EMAIL',
    'CALL', 
    'IN_PERSON',
    'DEMO',
    'FOLLOW_UP',
    'SAMPLE_DELIVERY'
);

CREATE TYPE public.interaction_status AS ENUM (
    'SCHEDULED',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW'
);

CREATE TYPE public.interaction_outcome AS ENUM (
    'POSITIVE',
    'NEUTRAL',
    'NEGATIVE', 
    'NEEDS_FOLLOW_UP'
);

-- Interactions table - Customer interaction tracking
CREATE TABLE IF NOT EXISTS public.interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information
    type public.interaction_type NOT NULL,
    subject VARCHAR(500) NOT NULL,
    interaction_date TIMESTAMPTZ NOT NULL,
    
    -- Required relationship to opportunity
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    
    -- Status and outcome tracking
    status public.interaction_status DEFAULT 'SCHEDULED',
    outcome public.interaction_outcome,
    
    -- Interaction details
    notes TEXT,
    duration_minutes INTEGER,
    location VARCHAR(255),
    
    -- Follow-up tracking
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date TIMESTAMPTZ,
    follow_up_notes TEXT,
    
    -- Rating and metrics
    rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- 1-5 star rating
    next_action TEXT,
    
    -- Additional tracking
    contact_method VARCHAR(100), -- phone, email, in-person, video call, etc.
    participants JSONB DEFAULT '[]'::jsonb, -- List of participants
    attachments JSONB DEFAULT '[]'::jsonb, -- File attachments metadata
    
    -- Metadata
    tags JSONB DEFAULT '[]'::jsonb,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    
    -- Audit fields (matching opportunity table structure)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID, -- For future user integration
    
    -- Soft delete (following opportunity pattern)
    deleted_at TIMESTAMPTZ
);

-- Add comments for documentation
COMMENT ON TABLE public.interactions IS 'Customer interactions linked to opportunities for comprehensive CRM tracking';
COMMENT ON COLUMN public.interactions.id IS 'Unique identifier using UUID for better scalability';
COMMENT ON COLUMN public.interactions.type IS 'Type of interaction (EMAIL, CALL, IN_PERSON, DEMO, FOLLOW_UP, SAMPLE_DELIVERY)';
COMMENT ON COLUMN public.interactions.subject IS 'Brief subject/title of the interaction, required field';
COMMENT ON COLUMN public.interactions.interaction_date IS 'Date and time when the interaction occurred or is scheduled';
COMMENT ON COLUMN public.interactions.opportunity_id IS 'Foreign key to opportunities table, required relationship';
COMMENT ON COLUMN public.interactions.status IS 'Current status of the interaction (SCHEDULED, COMPLETED, CANCELLED, NO_SHOW)';
COMMENT ON COLUMN public.interactions.outcome IS 'Result outcome (POSITIVE, NEUTRAL, NEGATIVE, NEEDS_FOLLOW_UP)';
COMMENT ON COLUMN public.interactions.notes IS 'Detailed notes about the interaction content';
COMMENT ON COLUMN public.interactions.duration_minutes IS 'Duration of the interaction in minutes';
COMMENT ON COLUMN public.interactions.location IS 'Location where interaction took place or meeting details';
COMMENT ON COLUMN public.interactions.follow_up_required IS 'Whether a follow-up is needed';
COMMENT ON COLUMN public.interactions.follow_up_date IS 'Scheduled date for follow-up action';
COMMENT ON COLUMN public.interactions.follow_up_notes IS 'Notes specific to follow-up requirements';
COMMENT ON COLUMN public.interactions.rating IS 'Quality/success rating of interaction (1-5 stars)';
COMMENT ON COLUMN public.interactions.next_action IS 'Description of next steps or action items';
COMMENT ON COLUMN public.interactions.contact_method IS 'Method used for contact (phone, email, video call, etc.)';
COMMENT ON COLUMN public.interactions.participants IS 'JSONB array of interaction participants';
COMMENT ON COLUMN public.interactions.attachments IS 'JSONB array of file attachment metadata';
COMMENT ON COLUMN public.interactions.tags IS 'JSONB array of tags for categorization';
COMMENT ON COLUMN public.interactions.custom_fields IS 'JSONB object for additional custom data';
COMMENT ON COLUMN public.interactions.created_by IS 'User who created the interaction record';
COMMENT ON COLUMN public.interactions.deleted_at IS 'Soft delete timestamp, NULL for active records';

-- Add constraints following opportunity table patterns
ALTER TABLE public.interactions 
ADD CONSTRAINT interactions_subject_not_empty CHECK (LENGTH(TRIM(subject)) > 0);

ALTER TABLE public.interactions 
ADD CONSTRAINT interactions_interaction_date_valid CHECK (
    interaction_date IS NOT NULL
);

ALTER TABLE public.interactions 
ADD CONSTRAINT interactions_duration_valid CHECK (
    duration_minutes IS NULL OR duration_minutes >= 0
);

ALTER TABLE public.interactions 
ADD CONSTRAINT interactions_rating_valid CHECK (
    rating IS NULL OR (rating >= 1 AND rating <= 5)
);

ALTER TABLE public.interactions 
ADD CONSTRAINT interactions_follow_up_date_valid CHECK (
    (follow_up_required = FALSE AND follow_up_date IS NULL) OR 
    (follow_up_required = TRUE AND follow_up_date IS NOT NULL AND follow_up_date > created_at)
);

-- Ensure opportunity_id references an existing opportunity
ALTER TABLE public.interactions 
ADD CONSTRAINT interactions_opportunity_exists CHECK (
    EXISTS (
        SELECT 1 FROM public.opportunities 
        WHERE id = opportunity_id AND deleted_at IS NULL
    )
);

-- Add updated_at trigger (following opportunity pattern)
CREATE TRIGGER update_interactions_updated_at 
    BEFORE UPDATE ON public.interactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Interaction status and outcome tracking trigger
CREATE OR REPLACE FUNCTION update_interaction_tracking()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-set status to COMPLETED when outcome is set
    IF NEW.outcome IS NOT NULL AND OLD.outcome IS NULL THEN
        NEW.status = 'COMPLETED';
        
        -- Update opportunity last_activity_date when interaction is completed
        UPDATE public.opportunities 
        SET last_activity_date = NOW()
        WHERE id = NEW.opportunity_id;
    END IF;
    
    -- Validate follow-up requirements
    IF NEW.follow_up_required = TRUE AND NEW.follow_up_date IS NULL THEN
        RAISE EXCEPTION 'Follow-up date is required when follow_up_required is true';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER interaction_tracking_trigger
    BEFORE UPDATE ON public.interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_interaction_tracking();

-- Enable RLS on interactions table (following opportunity pattern)
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;