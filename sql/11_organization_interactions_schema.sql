-- =============================================================================
-- Organization Interactions Schema for CRM System
-- =============================================================================
-- This file contains tables for tracking communications and interactions
-- with organizations. Supports comprehensive activity logging.
--
-- Applied: Stage 1 - Database Implementation  
-- Confidence: 85%
-- =============================================================================

-- Create enum for interaction types
CREATE TYPE public.interaction_type AS ENUM (
    'Email', 'Phone', 'Meeting', 'Demo', 'Proposal', 'Contract', 
    'Note', 'Task', 'Event', 'Social', 'Website', 'Other'
);

-- Create enum for interaction directions
CREATE TYPE public.interaction_direction AS ENUM ('Inbound', 'Outbound');

-- Organization interactions table
CREATE TABLE IF NOT EXISTS public.organization_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Related entities
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    
    -- Interaction details
    type public.interaction_type NOT NULL DEFAULT 'Note',
    direction public.interaction_direction,
    subject VARCHAR(500),
    description TEXT,
    
    -- Timing
    interaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_minutes INTEGER CHECK (duration_minutes >= 0),
    
    -- Metadata
    tags JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- User tracking
    created_by_user_id UUID, -- For future auth integration
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE public.organization_interactions IS 'Tracks all interactions and communications with organizations';
COMMENT ON COLUMN public.organization_interactions.id IS 'Unique identifier for the interaction';
COMMENT ON COLUMN public.organization_interactions.organization_id IS 'Reference to the organization involved';
COMMENT ON COLUMN public.organization_interactions.contact_id IS 'Optional reference to specific contact involved';
COMMENT ON COLUMN public.organization_interactions.type IS 'Type of interaction (email, phone, meeting, etc.)';
COMMENT ON COLUMN public.organization_interactions.direction IS 'Whether interaction was inbound or outbound';
COMMENT ON COLUMN public.organization_interactions.subject IS 'Brief subject/title of the interaction';
COMMENT ON COLUMN public.organization_interactions.description IS 'Detailed description or notes about the interaction';
COMMENT ON COLUMN public.organization_interactions.interaction_date IS 'When the interaction occurred';
COMMENT ON COLUMN public.organization_interactions.duration_minutes IS 'Duration of interaction in minutes (for calls, meetings)';
COMMENT ON COLUMN public.organization_interactions.tags IS 'Flexible tags for categorization';
COMMENT ON COLUMN public.organization_interactions.metadata IS 'Additional structured data about the interaction';
COMMENT ON COLUMN public.organization_interactions.created_by_user_id IS 'User who logged this interaction';

-- Add constraints
ALTER TABLE public.organization_interactions 
ADD CONSTRAINT interaction_subject_not_empty CHECK (
    subject IS NULL OR LENGTH(TRIM(subject)) > 0
);

-- Add updated_at trigger
CREATE TRIGGER update_organization_interactions_updated_at 
    BEFORE UPDATE ON public.organization_interactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Organization documents table for file management
CREATE TABLE IF NOT EXISTS public.organization_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Related entities
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Document details
    name VARCHAR(500) NOT NULL,
    description TEXT,
    file_type VARCHAR(50),
    file_size_bytes BIGINT CHECK (file_size_bytes >= 0),
    
    -- Storage
    storage_path VARCHAR(1000), -- For future file storage integration
    external_url VARCHAR(1000),
    
    -- Categorization
    category VARCHAR(255),
    tags JSONB DEFAULT '[]'::jsonb,
    
    -- Access control
    is_public BOOLEAN DEFAULT FALSE,
    access_level VARCHAR(50) DEFAULT 'internal',
    
    -- Version control
    version VARCHAR(50) DEFAULT '1.0',
    parent_document_id UUID REFERENCES public.organization_documents(id),
    
    -- User tracking
    uploaded_by_user_id UUID, -- For future auth integration
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE public.organization_documents IS 'Manages documents and files associated with organizations';
COMMENT ON COLUMN public.organization_documents.id IS 'Unique identifier for the document';
COMMENT ON COLUMN public.organization_documents.organization_id IS 'Reference to the organization this document belongs to';
COMMENT ON COLUMN public.organization_documents.name IS 'Display name of the document';
COMMENT ON COLUMN public.organization_documents.description IS 'Description of the document content';
COMMENT ON COLUMN public.organization_documents.file_type IS 'MIME type or file extension';
COMMENT ON COLUMN public.organization_documents.file_size_bytes IS 'File size in bytes';
COMMENT ON COLUMN public.organization_documents.storage_path IS 'Path to file in storage system';
COMMENT ON COLUMN public.organization_documents.external_url IS 'URL to external document location';
COMMENT ON COLUMN public.organization_documents.category IS 'Document category for organization';
COMMENT ON COLUMN public.organization_documents.tags IS 'Flexible tags for document categorization';
COMMENT ON COLUMN public.organization_documents.is_public IS 'Whether document is publicly accessible';
COMMENT ON COLUMN public.organization_documents.access_level IS 'Access control level';
COMMENT ON COLUMN public.organization_documents.version IS 'Document version number';
COMMENT ON COLUMN public.organization_documents.parent_document_id IS 'Reference to parent document for versioning';
COMMENT ON COLUMN public.organization_documents.uploaded_by_user_id IS 'User who uploaded the document';

-- Add constraints for documents
ALTER TABLE public.organization_documents 
ADD CONSTRAINT document_name_not_empty CHECK (LENGTH(TRIM(name)) > 0);

-- URL format validation
ALTER TABLE public.organization_documents 
ADD CONSTRAINT document_external_url_format CHECK (
    external_url IS NULL OR 
    external_url ~* '^https?://[^\s]+$'
);

-- Ensure either storage_path or external_url is provided
ALTER TABLE public.organization_documents 
ADD CONSTRAINT document_has_location CHECK (
    storage_path IS NOT NULL OR external_url IS NOT NULL
);

-- Add updated_at trigger for documents
CREATE TRIGGER update_organization_documents_updated_at 
    BEFORE UPDATE ON public.organization_documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();