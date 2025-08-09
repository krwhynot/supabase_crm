-- Migration: Add Product Management Tables
-- Date: 2025-08-08
-- Description: Creates products and product_principals tables to support product catalog management and distributor relationships
-- Extracted from: /sql/30_opportunities_schema.sql for Stage 1 database requirements

-- Start transaction for safety
BEGIN;

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Create product category enum for data consistency
CREATE TYPE IF NOT EXISTS public.product_category AS ENUM (
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

-- =============================================================================
-- TABLES
-- =============================================================================

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

-- Product-Principal junction table - Links products to principal organizations (serves as distributor relationships)
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

-- =============================================================================
-- COMMENTS
-- =============================================================================

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

-- =============================================================================
-- CONSTRAINTS
-- =============================================================================

-- Products table constraints
ALTER TABLE public.products 
ADD CONSTRAINT IF NOT EXISTS products_name_not_empty CHECK (LENGTH(TRIM(name)) > 0);

ALTER TABLE public.products 
ADD CONSTRAINT IF NOT EXISTS products_sku_format CHECK (
    sku IS NULL OR LENGTH(TRIM(sku)) > 0
);

ALTER TABLE public.products 
ADD CONSTRAINT IF NOT EXISTS products_unit_cost_valid CHECK (
    unit_cost IS NULL OR unit_cost >= 0
);

ALTER TABLE public.products 
ADD CONSTRAINT IF NOT EXISTS products_suggested_price_valid CHECK (
    suggested_retail_price IS NULL OR suggested_retail_price >= 0
);

ALTER TABLE public.products 
ADD CONSTRAINT IF NOT EXISTS products_currency_format CHECK (
    currency_code ~* '^[A-Z]{3}$'
);

ALTER TABLE public.products 
ADD CONSTRAINT IF NOT EXISTS products_launch_discontinue_order CHECK (
    launch_date IS NULL OR discontinue_date IS NULL OR launch_date <= discontinue_date
);

-- Product-Principals table constraints
ALTER TABLE public.product_principals 
ADD CONSTRAINT IF NOT EXISTS product_principals_wholesale_price_valid CHECK (
    wholesale_price IS NULL OR wholesale_price >= 0
);

ALTER TABLE public.product_principals 
ADD CONSTRAINT IF NOT EXISTS product_principals_min_order_valid CHECK (
    minimum_order_quantity IS NULL OR minimum_order_quantity > 0
);

ALTER TABLE public.product_principals 
ADD CONSTRAINT IF NOT EXISTS product_principals_lead_time_valid CHECK (
    lead_time_days IS NULL OR lead_time_days >= 0
);

ALTER TABLE public.product_principals 
ADD CONSTRAINT IF NOT EXISTS product_principals_contract_dates_valid CHECK (
    contract_start_date IS NULL OR contract_end_date IS NULL OR contract_start_date <= contract_end_date
);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Add updated_at triggers (requires update_updated_at_column function to exist)
DO $$ 
BEGIN
    -- Check if the function exists before creating triggers
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        -- Drop trigger if exists, then recreate
        DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
        CREATE TRIGGER update_products_updated_at 
            BEFORE UPDATE ON public.products 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_product_principals_updated_at ON public.product_principals;
        CREATE TRIGGER update_product_principals_updated_at 
            BEFORE UPDATE ON public.product_principals 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    ELSE
        RAISE NOTICE 'update_updated_at_column function not found - triggers not created';
    END IF;
END $$;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_principals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Products
DROP POLICY IF EXISTS "Users can view all products" ON public.products;
CREATE POLICY "Users can view all products" 
ON public.products FOR SELECT 
TO authenticated 
USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can insert products" ON public.products;
CREATE POLICY "Users can insert products" 
ON public.products FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update products" ON public.products;
CREATE POLICY "Users can update products" 
ON public.products FOR UPDATE 
TO authenticated 
USING (deleted_at IS NULL)
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete products" ON public.products;
CREATE POLICY "Users can delete products" 
ON public.products FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (deleted_at IS NOT NULL);

-- RLS Policies for Product-Principals
DROP POLICY IF EXISTS "Users can view all product principals" ON public.product_principals;
CREATE POLICY "Users can view all product principals" 
ON public.product_principals FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Users can insert product principals" ON public.product_principals;
CREATE POLICY "Users can insert product principals" 
ON public.product_principals FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update product principals" ON public.product_principals;
CREATE POLICY "Users can update product principals" 
ON public.product_principals FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete product principals" ON public.product_principals;
CREATE POLICY "Users can delete product principals" 
ON public.product_principals FOR DELETE 
TO authenticated 
USING (true);

-- =============================================================================
-- INDEXES
-- =============================================================================

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

-- =============================================================================
-- INDEX COMMENTS
-- =============================================================================

COMMENT ON INDEX idx_products_name IS 'Full-text search index for product names';
COMMENT ON INDEX idx_products_name_trgm IS 'Trigram index for fuzzy product name matching';
COMMENT ON INDEX idx_products_category IS 'Index for filtering products by category';
COMMENT ON INDEX idx_products_sku IS 'Index for product SKU lookups';
COMMENT ON INDEX idx_products_active IS 'Index for filtering active/inactive products';

-- =============================================================================
-- POLICY COMMENTS
-- =============================================================================

COMMENT ON POLICY "Users can view all products" ON public.products IS 'Allows authenticated users to view active products';
COMMENT ON POLICY "Users can insert products" ON public.products IS 'Allows authenticated users to create new products';

COMMIT;

-- =============================================================================
-- VALIDATION QUERIES
-- =============================================================================
-- These should be run manually after migration to verify success

/*
-- 1. Verify tables were created correctly
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('products', 'product_principals');

-- 2. Verify enum was created
SELECT 
    typname,
    enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname = 'product_category'
ORDER BY enumsortorder;

-- 3. Verify constraints were added
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    consrc as constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname IN ('products', 'product_principals')
    AND contype = 'c'; -- Check constraints

-- 4. Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN ('products', 'product_principals')
ORDER BY tablename, indexname;

-- 5. Verify RLS policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('products', 'product_principals')
ORDER BY tablename, policyname;

-- 6. Test basic functionality
INSERT INTO products (name, category, description, is_active) 
VALUES ('Test Product', 'Other', 'Migration test product', true);

SELECT id, name, category, is_active, created_at 
FROM products 
WHERE name = 'Test Product';

-- Clean up test data
DELETE FROM products WHERE name = 'Test Product';
*/

-- =============================================================================
-- ROLLBACK PROCEDURES
-- =============================================================================
-- To rollback this migration, run the following commands:

/*
-- WARNING: This will permanently delete all product data
-- Make sure to backup your data before running rollback

BEGIN;

-- Drop indexes
DROP INDEX IF EXISTS idx_products_name;
DROP INDEX IF EXISTS idx_products_name_trgm;
DROP INDEX IF EXISTS idx_products_category;
DROP INDEX IF EXISTS idx_products_sku;
DROP INDEX IF EXISTS idx_products_active;
DROP INDEX IF EXISTS idx_products_launch_date;
DROP INDEX IF EXISTS idx_products_tags;
DROP INDEX IF EXISTS idx_products_created_at;
DROP INDEX IF EXISTS idx_product_principals_product_id;
DROP INDEX IF EXISTS idx_product_principals_principal_id;
DROP INDEX IF EXISTS idx_product_principals_active;
DROP INDEX IF EXISTS idx_product_principals_primary;
DROP INDEX IF EXISTS idx_product_principals_exclusive;

-- Drop tables (cascade will remove foreign key constraints)
DROP TABLE IF EXISTS public.product_principals CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;

-- Drop enum
DROP TYPE IF EXISTS public.product_category CASCADE;

COMMIT;
*/