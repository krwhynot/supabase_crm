-- =============================================================================
-- Performance Indexes for Organizations Tables
-- =============================================================================
-- This file contains indexes for optimal query performance on organizations
-- and related tables. Designed for common search and filtering patterns.
--
-- Applied: Stage 1 - Database Implementation
-- Confidence: 88%
-- =============================================================================

-- Organizations Table Indexes

-- Primary search indexes
CREATE INDEX IF NOT EXISTS idx_organizations_name 
ON public.organizations USING gin(to_tsvector('english', name));

CREATE INDEX IF NOT EXISTS idx_organizations_name_trgm 
ON public.organizations USING gin(name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_organizations_legal_name 
ON public.organizations USING gin(to_tsvector('english', legal_name));

-- Status and type indexes for filtering
CREATE INDEX IF NOT EXISTS idx_organizations_status 
ON public.organizations(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_type 
ON public.organizations(type) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_size 
ON public.organizations(size) WHERE deleted_at IS NULL;

-- Industry and classification indexes
CREATE INDEX IF NOT EXISTS idx_organizations_industry 
ON public.organizations(industry) WHERE deleted_at IS NULL AND industry IS NOT NULL;

-- Lead scoring and CRM indexes
CREATE INDEX IF NOT EXISTS idx_organizations_lead_score 
ON public.organizations(lead_score DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_assigned_user 
ON public.organizations(assigned_user_id) WHERE deleted_at IS NULL AND assigned_user_id IS NOT NULL;

-- Location indexes for geographic search
CREATE INDEX IF NOT EXISTS idx_organizations_location 
ON public.organizations(country, state_province, city) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_country 
ON public.organizations(country) WHERE deleted_at IS NULL;

-- Date-based indexes for CRM workflows
CREATE INDEX IF NOT EXISTS idx_organizations_last_contact 
ON public.organizations(last_contact_date DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_next_followup 
ON public.organizations(next_follow_up_date) WHERE deleted_at IS NULL AND next_follow_up_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_created_at 
ON public.organizations(created_at DESC);

-- Soft delete index
CREATE INDEX IF NOT EXISTS idx_organizations_active 
ON public.organizations(id) WHERE deleted_at IS NULL;

-- Hierarchical relationship index
CREATE INDEX IF NOT EXISTS idx_organizations_parent 
ON public.organizations(parent_org_id) WHERE parent_org_id IS NOT NULL;

-- JSONB indexes for tags and custom fields
CREATE INDEX IF NOT EXISTS idx_organizations_tags 
ON public.organizations USING gin(tags);

CREATE INDEX IF NOT EXISTS idx_organizations_custom_fields 
ON public.organizations USING gin(custom_fields);

-- Composite indexes for common query patterns

-- Status + Lead Score for sales pipeline
CREATE INDEX IF NOT EXISTS idx_organizations_status_score 
ON public.organizations(status, lead_score DESC) WHERE deleted_at IS NULL;

-- Industry + Size for market analysis
CREATE INDEX IF NOT EXISTS idx_organizations_industry_size 
ON public.organizations(industry, size) WHERE deleted_at IS NULL;

-- Location + Status for territory management
CREATE INDEX IF NOT EXISTS idx_organizations_location_status 
ON public.organizations(country, state_province, status) WHERE deleted_at IS NULL;

-- Organization Interactions Table Indexes

-- Primary relationship indexes
CREATE INDEX IF NOT EXISTS idx_org_interactions_org_id 
ON public.organization_interactions(organization_id);

CREATE INDEX IF NOT EXISTS idx_org_interactions_contact_id 
ON public.organization_interactions(contact_id) WHERE contact_id IS NOT NULL;

-- Type and direction indexes
CREATE INDEX IF NOT EXISTS idx_org_interactions_type 
ON public.organization_interactions(type);

CREATE INDEX IF NOT EXISTS idx_org_interactions_direction 
ON public.organization_interactions(direction) WHERE direction IS NOT NULL;

-- Date-based indexes for timeline and reporting
CREATE INDEX IF NOT EXISTS idx_org_interactions_date 
ON public.organization_interactions(interaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_org_interactions_created 
ON public.organization_interactions(created_at DESC);

-- User tracking index
CREATE INDEX IF NOT EXISTS idx_org_interactions_user 
ON public.organization_interactions(created_by_user_id) WHERE created_by_user_id IS NOT NULL;

-- Text search indexes
CREATE INDEX IF NOT EXISTS idx_org_interactions_subject 
ON public.organization_interactions USING gin(to_tsvector('english', subject)) WHERE subject IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_org_interactions_description 
ON public.organization_interactions USING gin(to_tsvector('english', description)) WHERE description IS NOT NULL;

-- JSONB indexes
CREATE INDEX IF NOT EXISTS idx_org_interactions_tags 
ON public.organization_interactions USING gin(tags);

CREATE INDEX IF NOT EXISTS idx_org_interactions_metadata 
ON public.organization_interactions USING gin(metadata);

-- Composite indexes for common queries

-- Organization + Date for activity timeline
CREATE INDEX IF NOT EXISTS idx_org_interactions_org_date 
ON public.organization_interactions(organization_id, interaction_date DESC);

-- Organization + Type for interaction analysis
CREATE INDEX IF NOT EXISTS idx_org_interactions_org_type 
ON public.organization_interactions(organization_id, type);

-- Contact + Date for contact activity
CREATE INDEX IF NOT EXISTS idx_org_interactions_contact_date 
ON public.organization_interactions(contact_id, interaction_date DESC) WHERE contact_id IS NOT NULL;

-- Organization Documents Table Indexes

-- Primary relationship index
CREATE INDEX IF NOT EXISTS idx_org_documents_org_id 
ON public.organization_documents(organization_id);

-- Document search indexes
CREATE INDEX IF NOT EXISTS idx_org_documents_name 
ON public.organization_documents USING gin(to_tsvector('english', name));

CREATE INDEX IF NOT EXISTS idx_org_documents_description 
ON public.organization_documents USING gin(to_tsvector('english', description)) WHERE description IS NOT NULL;

-- Category and access indexes
CREATE INDEX IF NOT EXISTS idx_org_documents_category 
ON public.organization_documents(category) WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_org_documents_public 
ON public.organization_documents(is_public);

CREATE INDEX IF NOT EXISTS idx_org_documents_access_level 
ON public.organization_documents(access_level);

-- File type and size indexes
CREATE INDEX IF NOT EXISTS idx_org_documents_file_type 
ON public.organization_documents(file_type) WHERE file_type IS NOT NULL;

-- User tracking index
CREATE INDEX IF NOT EXISTS idx_org_documents_uploaded_by 
ON public.organization_documents(uploaded_by_user_id) WHERE uploaded_by_user_id IS NOT NULL;

-- Version control indexes
CREATE INDEX IF NOT EXISTS idx_org_documents_version 
ON public.organization_documents(version);

CREATE INDEX IF NOT EXISTS idx_org_documents_parent 
ON public.organization_documents(parent_document_id) WHERE parent_document_id IS NOT NULL;

-- Date indexes
CREATE INDEX IF NOT EXISTS idx_org_documents_created 
ON public.organization_documents(created_at DESC);

-- JSONB indexes
CREATE INDEX IF NOT EXISTS idx_org_documents_tags 
ON public.organization_documents USING gin(tags);

-- Composite indexes

-- Organization + Category for document browsing
CREATE INDEX IF NOT EXISTS idx_org_documents_org_category 
ON public.organization_documents(organization_id, category);

-- Organization + Public for access control
CREATE INDEX IF NOT EXISTS idx_org_documents_org_public 
ON public.organization_documents(organization_id, is_public);

-- Organization Analytics Table Indexes

-- Primary relationship index
CREATE INDEX IF NOT EXISTS idx_org_analytics_org_id 
ON public.organization_analytics(organization_id);

-- Time period indexes
CREATE INDEX IF NOT EXISTS idx_org_analytics_period_start 
ON public.organization_analytics(period_start DESC);

CREATE INDEX IF NOT EXISTS idx_org_analytics_period_end 
ON public.organization_analytics(period_end DESC);

CREATE INDEX IF NOT EXISTS idx_org_analytics_period_type 
ON public.organization_analytics(period_type);

-- Metrics indexes for reporting
CREATE INDEX IF NOT EXISTS idx_org_analytics_total_interactions 
ON public.organization_analytics(total_interactions DESC) WHERE total_interactions > 0;

CREATE INDEX IF NOT EXISTS idx_org_analytics_revenue 
ON public.organization_analytics(revenue_generated DESC) WHERE revenue_generated > 0;

CREATE INDEX IF NOT EXISTS idx_org_analytics_deals_closed 
ON public.organization_analytics(deals_closed DESC) WHERE deals_closed > 0;

-- JSONB index for custom metrics
CREATE INDEX IF NOT EXISTS idx_org_analytics_custom_metrics 
ON public.organization_analytics USING gin(custom_metrics);

-- Composite indexes for common reporting queries

-- Organization + Period Type for time series analysis
CREATE INDEX IF NOT EXISTS idx_org_analytics_org_period_type 
ON public.organization_analytics(organization_id, period_type, period_start DESC);

-- Period Type + Date Range for aggregated reporting
CREATE INDEX IF NOT EXISTS idx_org_analytics_type_period 
ON public.organization_analytics(period_type, period_start DESC, period_end DESC);

-- Performance monitoring indexes

-- Created/Updated timestamps for all tables
CREATE INDEX IF NOT EXISTS idx_organizations_updated_at 
ON public.organizations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_org_interactions_updated_at 
ON public.organization_interactions(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_org_documents_updated_at 
ON public.organization_documents(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_org_analytics_updated_at 
ON public.organization_analytics(updated_at DESC);

-- Add comments for index documentation
COMMENT ON INDEX idx_organizations_name IS 'Full-text search index for organization names';
COMMENT ON INDEX idx_organizations_name_trgm IS 'Trigram index for fuzzy name matching';
COMMENT ON INDEX idx_organizations_status IS 'Index for filtering by organization status';
COMMENT ON INDEX idx_organizations_lead_score IS 'Index for lead scoring queries (descending order)';
COMMENT ON INDEX idx_organizations_active IS 'Partial index for active (non-deleted) organizations';
COMMENT ON INDEX idx_org_interactions_org_date IS 'Composite index for organization interaction timeline';
COMMENT ON INDEX idx_org_documents_org_category IS 'Composite index for organization document browsing';
COMMENT ON INDEX idx_org_analytics_org_period_type IS 'Composite index for analytics time series queries';