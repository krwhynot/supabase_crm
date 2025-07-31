-- =============================================================================
-- Priority System Database Updates for Organization Form Redesign
-- =============================================================================
-- Updates the priority system with A/B/C/D → 90/70/50/30 lead_score mapping
-- and adds constraints to ensure valid priority scores.
--
-- Migration: 18_priority_system_update.sql
-- Applied: Stage 2.1 - Priority System Enhancement
-- Confidence: 95%
-- =============================================================================

-- ROLLBACK INSTRUCTIONS:
-- To rollback this migration:
-- 1. DROP CONSTRAINT organizations_lead_score_priority_values;
-- 2. ALTER TABLE organizations ALTER COLUMN lead_score SET DEFAULT 0;
-- 3. UPDATE organizations SET lead_score = 0 WHERE lead_score IN (30, 50, 70, 90);

-- =============================================================================
-- Priority System Implementation
-- =============================================================================

-- Update the lead_score constraint to allow new priority values
-- First, drop the existing constraint
ALTER TABLE public.organizations 
DROP CONSTRAINT IF EXISTS organizations_lead_score_check;

-- Add new constraint for priority-based lead scores
-- Valid values: 30 (D), 50 (C), 70 (B), 90 (A), plus 0 for unscored
ALTER TABLE public.organizations 
ADD CONSTRAINT organizations_lead_score_priority_values 
CHECK (lead_score IN (0, 30, 50, 70, 90));

-- Update the default to 0 (unscored) instead of 0-100 range
ALTER TABLE public.organizations 
ALTER COLUMN lead_score SET DEFAULT 0;

-- =============================================================================
-- Data Migration (if needed)
-- =============================================================================

-- Migrate any existing lead_score values to the new priority system
-- This is a conservative approach that maps ranges to the new values
UPDATE public.organizations 
SET lead_score = CASE 
    WHEN lead_score >= 85 THEN 90  -- A Priority (90-100 → 90)
    WHEN lead_score >= 65 THEN 70  -- B Priority (70-84 → 70)
    WHEN lead_score >= 35 THEN 50  -- C Priority (50-69 → 50)
    WHEN lead_score >= 1 THEN 30   -- D Priority (1-49 → 30)
    ELSE 0                         -- Unscored (0 remains 0)
END
WHERE lead_score NOT IN (0, 30, 50, 70, 90);

-- =============================================================================
-- Update Comments for New Priority System
-- =============================================================================

COMMENT ON COLUMN public.organizations.lead_score IS 'Priority-based lead scoring: 90 (A-High), 70 (B-Medium), 50 (C-Low), 30 (D-Very Low), 0 (Unscored)';

-- =============================================================================
-- Create Priority Helper Functions
-- =============================================================================

-- Function to convert priority letter to lead_score
CREATE OR REPLACE FUNCTION public.priority_to_lead_score(priority_letter TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE UPPER(priority_letter)
        WHEN 'A' THEN 90
        WHEN 'B' THEN 70
        WHEN 'C' THEN 50
        WHEN 'D' THEN 30
        ELSE 0
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to convert lead_score to priority letter
CREATE OR REPLACE FUNCTION public.lead_score_to_priority(score INTEGER)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE score
        WHEN 90 THEN 'A'
        WHEN 70 THEN 'B'
        WHEN 50 THEN 'C'
        WHEN 30 THEN 'D'
        ELSE 'Unscored'
    END;
END;
$$ LANGUAGE plpgsql;

-- Add comments for the helper functions
COMMENT ON FUNCTION public.priority_to_lead_score(TEXT) IS 'Converts priority letter (A/B/C/D) to lead_score value (90/70/50/30)';
COMMENT ON FUNCTION public.lead_score_to_priority(INTEGER) IS 'Converts lead_score value to priority letter for display';

-- =============================================================================
-- Create View for Priority-Based Queries
-- =============================================================================

-- Create a view that includes priority letters for easier querying
CREATE OR REPLACE VIEW public.organizations_with_priority AS
SELECT 
    o.*,
    public.lead_score_to_priority(o.lead_score) AS priority_letter,
    CASE o.lead_score
        WHEN 90 THEN 'High Priority'
        WHEN 70 THEN 'Medium Priority'
        WHEN 50 THEN 'Low Priority'
        WHEN 30 THEN 'Very Low Priority'
        ELSE 'Unscored'
    END AS priority_description
FROM public.organizations o;

COMMENT ON VIEW public.organizations_with_priority IS 'Organizations view with priority letters and descriptions for easier querying';

-- =============================================================================
-- Validation Queries
-- =============================================================================

-- Verify all lead_score values are valid
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM public.organizations 
    WHERE lead_score NOT IN (0, 30, 50, 70, 90);
    
    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Migration failed: % organizations have invalid lead_score values', invalid_count;
    END IF;
    
    RAISE NOTICE 'Priority system migration completed successfully. All lead_score values are valid.';
END $$;

-- Test priority conversion functions
DO $$
BEGIN
    -- Test priority_to_lead_score function
    IF public.priority_to_lead_score('A') != 90 THEN
        RAISE EXCEPTION 'priority_to_lead_score function test failed for A';
    END IF;
    
    IF public.priority_to_lead_score('B') != 70 THEN
        RAISE EXCEPTION 'priority_to_lead_score function test failed for B';
    END IF;
    
    -- Test lead_score_to_priority function
    IF public.lead_score_to_priority(90) != 'A' THEN
        RAISE EXCEPTION 'lead_score_to_priority function test failed for 90';
    END IF;
    
    IF public.lead_score_to_priority(70) != 'B' THEN
        RAISE EXCEPTION 'lead_score_to_priority function test failed for 70';
    END IF;
    
    RAISE NOTICE 'Priority conversion functions are working correctly.';
END $$;

-- Display migration summary
SELECT 
    'Priority System Migration Summary' AS status,
    COUNT(*) AS total_organizations,
    COUNT(*) FILTER (WHERE lead_score = 90) AS priority_a_count,
    COUNT(*) FILTER (WHERE lead_score = 70) AS priority_b_count,
    COUNT(*) FILTER (WHERE lead_score = 50) AS priority_c_count,
    COUNT(*) FILTER (WHERE lead_score = 30) AS priority_d_count,
    COUNT(*) FILTER (WHERE lead_score = 0) AS unscored_count
FROM public.organizations
WHERE deleted_at IS NULL;