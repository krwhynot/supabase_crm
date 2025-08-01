-- Migration: Remove Authority & Influence Fields from Contacts
-- Date: 2025-08-01
-- Purpose: Simplify contact form by removing purchase_influence and decision_authority fields
-- This converts the 3-step form to a 2-step form focusing on essential contact information

-- Remove the authority/influence columns from contacts table
ALTER TABLE contacts 
DROP COLUMN IF EXISTS purchase_influence,
DROP COLUMN IF EXISTS decision_authority;

-- Add comment to document the change
COMMENT ON TABLE contacts IS 'Contact information for CRM system - simplified 2-step form (removed authority/influence fields 2025-08-01)';