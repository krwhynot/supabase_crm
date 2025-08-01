-- =============================================================================
-- Opportunities Schema for CRM Sales Pipeline Management
-- =============================================================================
-- This file contains the opportunities, products, and related tables for
-- comprehensive sales pipeline management with 7-stage progression system.
--
-- Applied: Phase 2.1 - Database Schema Implementation
-- Confidence: 95%
-- =============================================================================

-- Create enums for better data consistency
CREATE TYPE public.opportunity_stage AS ENUM (
    'New Lead',
    'Initial Outreach', 
    'Sample/Visit Offered',
    'Awaiting Response',
    'Feedback Logged',
    'Demo Scheduled',
    'Closed - Won'
);

CREATE TYPE public.opportunity_context AS ENUM (
    'Site Visit',
    'Food Show',
    'New Product Interest',
    'Follow-up',
    'Demo Request',
    'Sampling',
    'Custom'
);

CREATE TYPE public.product_category AS ENUM (
    'Protein',
    'Sauce',
    'Seasoning',
    'Beverage',
    'Snack',
    'Frozen',
    'Dairy',
    'Bakery',
    'Other'
);

-- Products table - Product catalog management
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information
    name VARCHAR(500) NOT NULL,
    description TEXT,
    category public.product_category,
    sku VARCHAR(100),
    
    -- Product Details
    unit_size VARCHAR(100), -- e.g., "24 oz bottle", "5 lb bag"
    unit_cost DECIMAL(10,2),
    suggested_retail_price DECIMAL(10,2),
    currency_code VARCHAR(3) DEFAULT 'USD',
    
    -- Product Status
    is_active BOOLEAN DEFAULT TRUE,
    launch_date DATE,
    discontinue_date DATE,
    
    -- Additional Information
    ingredients TEXT,
    allergen_info TEXT,
    nutritional_info JSONB DEFAULT '{}'::jsonb,
    certifications JSONB DEFAULT '[]'::jsonb, -- e.g., ["Organic", "Kosher", "Non-GMO"]
    
    -- Metadata
    tags JSONB DEFAULT '[]'::jsonb,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Soft delete
    deleted_at TIMESTAMPTZ
);

-- Product-Principal junction table - Links products to principal organizations
CREATE TABLE IF NOT EXISTS public.product_principals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    principal_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Relationship details
    is_primary_principal BOOLEAN DEFAULT FALSE, -- Main principal for the product
    exclusive_rights BOOLEAN DEFAULT FALSE,     -- Exclusive distribution rights
    territory_restrictions JSONB DEFAULT '{}'::jsonb, -- Geographic limitations
    
    -- Pricing and terms
    wholesale_price DECIMAL(10,2),
    minimum_order_quantity INTEGER,
    lead_time_days INTEGER,
    
    -- Contract details
    contract_start_date DATE,
    contract_end_date DATE,
    auto_renewal BOOLEAN DEFAULT FALSE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(product_id, principal_id)
);

-- Opportunities table - Sales pipeline management
CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information
    name VARCHAR(500) NOT NULL,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    principal_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL, -- The specific principal for this opportunity
    stage public.opportunity_stage NOT NULL DEFAULT 'New Lead',
    
    -- Product and Context
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    context public.opportunity_context,
    
    -- Deal Information
    probability_percent INTEGER DEFAULT 0 CHECK (probability_percent >= 0 AND probability_percent <= 100),
    expected_close_date DATE,
    estimated_value DECIMAL(15,2),
    actual_value DECIMAL(15,2),
    currency_code VARCHAR(3) DEFAULT 'USD',
    
    -- Deal Management
    deal_owner VARCHAR(255), -- Sales representative/account manager
    lead_source VARCHAR(255),
    competitor_info TEXT,
    
    -- Status Tracking
    is_won BOOLEAN DEFAULT FALSE,
    is_lost BOOLEAN DEFAULT FALSE,
    lost_reason VARCHAR(255),
    won_date DATE,
    lost_date DATE,
    
    -- Additional Information
    notes TEXT,
    internal_notes TEXT, -- Private notes not visible to customer
    tags JSONB DEFAULT '[]'::jsonb,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    
    -- Auto-naming information
    auto_generated_name BOOLEAN DEFAULT FALSE,
    name_template VARCHAR(500), -- Template used for auto-generation
    
    -- Tracking
    last_activity_date TIMESTAMPTZ,
    next_follow_up_date TIMESTAMPTZ,
    stage_changed_at TIMESTAMPTZ DEFAULT NOW(),
    stage_changed_by UUID, -- For future user integration
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID, -- For future user integration
    
    -- Soft delete
    deleted_at TIMESTAMPTZ
);

-- Opportunity-Principal junction table (for future flexibility/multi-principal support)
CREATE TABLE IF NOT EXISTS public.opportunity_principals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    principal_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Relationship details
    is_primary BOOLEAN DEFAULT FALSE,
    contribution_percent INTEGER CHECK (contribution_percent >= 0 AND contribution_percent <= 100),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(opportunity_id, principal_id)
);

-- Add comments for documentation
COMMENT ON TABLE public.products IS 'Product catalog for sales opportunities';
COMMENT ON COLUMN public.products.id IS 'Unique identifier using UUID for better scalability';
COMMENT ON COLUMN public.products.name IS 'Product name, required field';
COMMENT ON COLUMN public.products.description IS 'Detailed product description';
COMMENT ON COLUMN public.products.category IS 'Product category for classification';
COMMENT ON COLUMN public.products.sku IS 'Stock Keeping Unit identifier';
COMMENT ON COLUMN public.products.unit_size IS 'Package size description (e.g., "24 oz bottle")';
COMMENT ON COLUMN public.products.is_active IS 'Whether the product is currently available';
COMMENT ON COLUMN public.products.certifications IS 'Product certifications (JSONB array)';
COMMENT ON COLUMN public.products.nutritional_info IS 'Nutritional information (JSONB object)';

COMMENT ON TABLE public.product_principals IS 'Junction table linking products to principal organizations';
COMMENT ON COLUMN public.product_principals.product_id IS 'Foreign key to products table';
COMMENT ON COLUMN public.product_principals.principal_id IS 'Foreign key to organizations table (principal)';
COMMENT ON COLUMN public.product_principals.is_primary_principal IS 'Whether this is the main principal for the product';
COMMENT ON COLUMN public.product_principals.exclusive_rights IS 'Whether principal has exclusive distribution rights';
COMMENT ON COLUMN public.product_principals.territory_restrictions IS 'Geographic restrictions (JSONB object)';
COMMENT ON COLUMN public.product_principals.wholesale_price IS 'Principal-specific wholesale pricing';

COMMENT ON TABLE public.opportunities IS 'Sales opportunities for pipeline management';
COMMENT ON COLUMN public.opportunities.id IS 'Unique identifier using UUID for better scalability';
COMMENT ON COLUMN public.opportunities.name IS 'Opportunity name, required field';
COMMENT ON COLUMN public.opportunities.organization_id IS 'Foreign key to target organization/customer';
COMMENT ON COLUMN public.opportunities.principal_id IS 'Foreign key to principal organization for this opportunity';
COMMENT ON COLUMN public.opportunities.stage IS '7-stage sales pipeline progression';
COMMENT ON COLUMN public.opportunities.product_id IS 'Foreign key to product being sold';
COMMENT ON COLUMN public.opportunities.context IS 'Type/context of the opportunity';
COMMENT ON COLUMN public.opportunities.probability_percent IS 'Percentage chance of closing (0-100)';
COMMENT ON COLUMN public.opportunities.expected_close_date IS 'Target date for closing the deal';
COMMENT ON COLUMN public.opportunities.estimated_value IS 'Estimated deal value';
COMMENT ON COLUMN public.opportunities.actual_value IS 'Actual deal value when closed';
COMMENT ON COLUMN public.opportunities.deal_owner IS 'Sales representative responsible for the deal';
COMMENT ON COLUMN public.opportunities.is_won IS 'Whether the opportunity was won';
COMMENT ON COLUMN public.opportunities.is_lost IS 'Whether the opportunity was lost';
COMMENT ON COLUMN public.opportunities.auto_generated_name IS 'Whether the name was auto-generated';
COMMENT ON COLUMN public.opportunities.name_template IS 'Template used for auto-generation';
COMMENT ON COLUMN public.opportunities.stage_changed_at IS 'Timestamp when stage was last changed';

COMMENT ON TABLE public.opportunity_principals IS 'Junction table for opportunity-principal relationships (future flexibility)';

-- Add constraints
ALTER TABLE public.products 
ADD CONSTRAINT products_name_not_empty CHECK (LENGTH(TRIM(name)) > 0);

ALTER TABLE public.products 
ADD CONSTRAINT products_sku_format CHECK (
    sku IS NULL OR LENGTH(TRIM(sku)) > 0
);

ALTER TABLE public.products 
ADD CONSTRAINT products_unit_cost_valid CHECK (
    unit_cost IS NULL OR unit_cost >= 0
);

ALTER TABLE public.products 
ADD CONSTRAINT products_suggested_price_valid CHECK (
    suggested_retail_price IS NULL OR suggested_retail_price >= 0
);

ALTER TABLE public.products 
ADD CONSTRAINT products_currency_format CHECK (
    currency_code ~* '^[A-Z]{3}$'
);

ALTER TABLE public.products 
ADD CONSTRAINT products_launch_discontinue_order CHECK (
    launch_date IS NULL OR discontinue_date IS NULL OR launch_date <= discontinue_date
);

ALTER TABLE public.product_principals 
ADD CONSTRAINT product_principals_wholesale_price_valid CHECK (
    wholesale_price IS NULL OR wholesale_price >= 0
);

ALTER TABLE public.product_principals 
ADD CONSTRAINT product_principals_min_order_valid CHECK (
    minimum_order_quantity IS NULL OR minimum_order_quantity > 0
);

ALTER TABLE public.product_principals 
ADD CONSTRAINT product_principals_lead_time_valid CHECK (
    lead_time_days IS NULL OR lead_time_days >= 0
);

ALTER TABLE public.product_principals 
ADD CONSTRAINT product_principals_contract_dates_valid CHECK (
    contract_start_date IS NULL OR contract_end_date IS NULL OR contract_start_date <= contract_end_date
);

ALTER TABLE public.opportunities 
ADD CONSTRAINT opportunities_name_not_empty CHECK (LENGTH(TRIM(name)) > 0);

ALTER TABLE public.opportunities 
ADD CONSTRAINT opportunities_currency_format CHECK (
    currency_code ~* '^[A-Z]{3}$'
);

ALTER TABLE public.opportunities 
ADD CONSTRAINT opportunities_estimated_value_valid CHECK (
    estimated_value IS NULL OR estimated_value >= 0
);

ALTER TABLE public.opportunities 
ADD CONSTRAINT opportunities_actual_value_valid CHECK (
    actual_value IS NULL OR actual_value >= 0
);

ALTER TABLE public.opportunities 
ADD CONSTRAINT opportunities_expected_close_future CHECK (
    expected_close_date IS NULL OR expected_close_date >= CURRENT_DATE - INTERVAL '1 year'
);

ALTER TABLE public.opportunities 
ADD CONSTRAINT opportunities_won_lost_exclusive CHECK (
    NOT (is_won = TRUE AND is_lost = TRUE)
);

ALTER TABLE public.opportunities 
ADD CONSTRAINT opportunities_won_date_valid CHECK (
    (is_won = FALSE AND won_date IS NULL) OR 
    (is_won = TRUE AND won_date IS NOT NULL)
);

ALTER TABLE public.opportunities 
ADD CONSTRAINT opportunities_lost_date_valid CHECK (
    (is_lost = FALSE AND lost_date IS NULL) OR 
    (is_lost = TRUE AND lost_date IS NOT NULL)
);

ALTER TABLE public.opportunities 
ADD CONSTRAINT opportunities_lost_reason_valid CHECK (
    (is_lost = FALSE AND lost_reason IS NULL) OR 
    (is_lost = TRUE AND lost_reason IS NOT NULL)
);

-- Ensure principal_id references an organization that is actually a principal
ALTER TABLE public.opportunities 
ADD CONSTRAINT opportunities_principal_is_principal CHECK (
    principal_id IS NULL OR 
    EXISTS (
        SELECT 1 FROM public.organizations 
        WHERE id = principal_id AND is_principal = TRUE
    )
);

-- Add updated_at triggers
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON public.products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_principals_updated_at 
    BEFORE UPDATE ON public.product_principals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at 
    BEFORE UPDATE ON public.opportunities 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Stage change tracking trigger
CREATE OR REPLACE FUNCTION update_opportunity_stage_tracking()
RETURNS TRIGGER AS $$
BEGIN
    -- Update stage change tracking when stage changes
    IF OLD.stage IS DISTINCT FROM NEW.stage THEN
        NEW.stage_changed_at = NOW();
        NEW.last_activity_date = NOW();
    END IF;
    
    -- Update won/lost dates automatically based on stage
    IF NEW.stage = 'Closed - Won' AND OLD.stage != 'Closed - Won' THEN
        NEW.is_won = TRUE;
        NEW.is_lost = FALSE;
        NEW.won_date = CURRENT_DATE;
        NEW.lost_date = NULL;
        NEW.lost_reason = NULL;
        -- Set probability to 100% when won
        NEW.probability_percent = 100;
    END IF;
    
    -- If stage is not 'Closed - Won', ensure is_won is false
    IF NEW.stage != 'Closed - Won' THEN
        NEW.is_won = FALSE;
        NEW.won_date = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER opportunity_stage_tracking_trigger
    BEFORE UPDATE ON public.opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_opportunity_stage_tracking();

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_principals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_principals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Products
CREATE POLICY "Users can view all products" 
ON public.products FOR SELECT 
TO authenticated 
USING (deleted_at IS NULL);

CREATE POLICY "Users can insert products" 
ON public.products FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Users can update products" 
ON public.products FOR UPDATE 
TO authenticated 
USING (deleted_at IS NULL)
WITH CHECK (true);

CREATE POLICY "Users can delete products" 
ON public.products FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (deleted_at IS NOT NULL);

-- RLS Policies for Product-Principals
CREATE POLICY "Users can view all product principals" 
ON public.product_principals FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can insert product principals" 
ON public.product_principals FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Users can update product principals" 
ON public.product_principals FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can delete product principals" 
ON public.product_principals FOR DELETE 
TO authenticated 
USING (true);

-- RLS Policies for Opportunities
CREATE POLICY "Users can view all opportunities" 
ON public.opportunities FOR SELECT 
TO authenticated 
USING (deleted_at IS NULL);

CREATE POLICY "Users can insert opportunities" 
ON public.opportunities FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Users can update opportunities" 
ON public.opportunities FOR UPDATE 
TO authenticated 
USING (deleted_at IS NULL)
WITH CHECK (true);

CREATE POLICY "Users can delete opportunities" 
ON public.opportunities FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (deleted_at IS NOT NULL);

-- RLS Policies for Opportunity-Principals
CREATE POLICY "Users can view all opportunity principals" 
ON public.opportunity_principals FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can insert opportunity principals" 
ON public.opportunity_principals FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Users can update opportunity principals" 
ON public.opportunity_principals FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can delete opportunity principals" 
ON public.opportunity_principals FOR DELETE 
TO authenticated 
USING (true);

-- Performance Indexes

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_name 
ON public.products USING gin(to_tsvector('english', name)) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_name_trgm 
ON public.products USING gin(name gin_trgm_ops) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_category 
ON public.products(category) WHERE deleted_at IS NULL AND category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_sku 
ON public.products(sku) WHERE deleted_at IS NULL AND sku IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_active 
ON public.products(is_active) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_launch_date 
ON public.products(launch_date) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_tags 
ON public.products USING gin(tags) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_created_at 
ON public.products(created_at DESC);

-- Product-Principals table indexes
CREATE INDEX IF NOT EXISTS idx_product_principals_product_id 
ON public.product_principals(product_id);

CREATE INDEX IF NOT EXISTS idx_product_principals_principal_id 
ON public.product_principals(principal_id);

CREATE INDEX IF NOT EXISTS idx_product_principals_active 
ON public.product_principals(is_active);

CREATE INDEX IF NOT EXISTS idx_product_principals_primary 
ON public.product_principals(is_primary_principal) WHERE is_primary_principal = TRUE;

CREATE INDEX IF NOT EXISTS idx_product_principals_exclusive 
ON public.product_principals(exclusive_rights) WHERE exclusive_rights = TRUE;

-- Opportunities table indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_name 
ON public.opportunities USING gin(to_tsvector('english', name)) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_name_trgm 
ON public.opportunities USING gin(name gin_trgm_ops) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_organization_id 
ON public.opportunities(organization_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_principal_id 
ON public.opportunities(principal_id) WHERE deleted_at IS NULL AND principal_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_product_id 
ON public.opportunities(product_id) WHERE deleted_at IS NULL AND product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_stage 
ON public.opportunities(stage) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_context 
ON public.opportunities(context) WHERE deleted_at IS NULL AND context IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_probability 
ON public.opportunities(probability_percent DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_close_date 
ON public.opportunities(expected_close_date) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_deal_owner 
ON public.opportunities(deal_owner) WHERE deleted_at IS NULL AND deal_owner IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_is_won 
ON public.opportunities(is_won) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_is_lost 
ON public.opportunities(is_lost) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_stage_changed 
ON public.opportunities(stage_changed_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_last_activity 
ON public.opportunities(last_activity_date DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_next_followup 
ON public.opportunities(next_follow_up_date) WHERE deleted_at IS NULL AND next_follow_up_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_created_at 
ON public.opportunities(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_opportunities_tags 
ON public.opportunities USING gin(tags) WHERE deleted_at IS NULL;

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_opportunities_org_stage 
ON public.opportunities(organization_id, stage) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_principal_stage 
ON public.opportunities(principal_id, stage) WHERE deleted_at IS NULL AND principal_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_product_stage 
ON public.opportunities(product_id, stage) WHERE deleted_at IS NULL AND product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_stage_close_date 
ON public.opportunities(stage, expected_close_date) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_owner_stage 
ON public.opportunities(deal_owner, stage) WHERE deleted_at IS NULL AND deal_owner IS NOT NULL;

-- Opportunity-Principals table indexes
CREATE INDEX IF NOT EXISTS idx_opportunity_principals_opportunity_id 
ON public.opportunity_principals(opportunity_id);

CREATE INDEX IF NOT EXISTS idx_opportunity_principals_principal_id 
ON public.opportunity_principals(principal_id);

CREATE INDEX IF NOT EXISTS idx_opportunity_principals_primary 
ON public.opportunity_principals(is_primary) WHERE is_primary = TRUE;

-- Add policy comments for documentation
COMMENT ON POLICY "Users can view all products" ON public.products IS 'Allows authenticated users to view active products';
COMMENT ON POLICY "Users can insert products" ON public.products IS 'Allows authenticated users to create new products';
COMMENT ON POLICY "Users can view all opportunities" ON public.opportunities IS 'Allows authenticated users to view active opportunities';
COMMENT ON POLICY "Users can insert opportunities" ON public.opportunities IS 'Allows authenticated users to create new opportunities';

-- Add index comments for documentation
COMMENT ON INDEX idx_products_name IS 'Full-text search index for product names';
COMMENT ON INDEX idx_products_name_trgm IS 'Trigram index for fuzzy product name matching';
COMMENT ON INDEX idx_opportunities_name IS 'Full-text search index for opportunity names';
COMMENT ON INDEX idx_opportunities_stage IS 'Index for filtering opportunities by sales stage';
COMMENT ON INDEX idx_opportunities_org_stage IS 'Composite index for organization-specific pipeline queries';