import * as yup from 'yup'

/**
 * Product Category Enum - Matching database schema
 */
export enum ProductCategory {
  PROTEIN = 'Protein',
  SAUCE = 'Sauce',
  SEASONING = 'Seasoning',
  BEVERAGE = 'Beverage',
  SNACK = 'Snack',
  FROZEN = 'Frozen',
  DAIRY = 'Dairy',
  BAKERY = 'Bakery',
  OTHER = 'Other'
}

/**
 * Base Product interface matching database schema
 */
export interface Product {
  id: string
  name: string
  description: string | null
  category: ProductCategory | null
  unit_price?: number | null  // Made optional to match database variations
  sku: string | null
  is_active: boolean
  created_at: string | null
  updated_at: string | null
  created_by?: string | null  // Made optional to match database
  deleted_at: string | null
}

/**
 * Product insert interface for creating new products
 */
export interface ProductInsert {
  name: string
  description?: string | null
  category: ProductCategory | null
  unit_price?: number | null
  sku?: string | null
  is_active?: boolean
  created_by?: string | null
}

/**
 * Product update interface for editing products
 */
export interface ProductUpdate {
  name?: string
  description?: string | null
  category?: ProductCategory | null
  unit_price?: number | null
  sku?: string | null
  is_active?: boolean
}

/**
 * Product with principal relationship data for filtering
 */
export interface ProductWithPrincipals {
  id: string
  name: string
  description: string | null
  category: ProductCategory | null
  unit_price?: number | null
  sku: string | null
  is_active: boolean
  created_at: string | null
  updated_at: string | null
  
  // Principal relationships
  principal_ids: string[]
  principal_names: string[]
  principal_count: number
}

/**
 * Principal-Product relationship interface
 */
export interface ProductPrincipal {
  id: string
  product_id: string
  principal_id: string
  created_at: string | null
  
  // Related data
  product_name: string
  product_category: ProductCategory | null
  principal_name: string
  principal_type: string
}

/**
 * Product selection interface for forms
 */
export interface ProductOption {
  id: string
  name: string
  category: ProductCategory | null
  description: string | null
  unit_price?: number | null
  available_principals: string[]  // Principal IDs that can access this product
}

/**
 * Product filtering parameters
 */
export interface ProductFilters {
  search?: string
  category?: ProductCategory[]
  principal_id?: string
  principal_ids?: string[]  // Filter products available to specific principals
  is_active?: boolean
  price_min?: number
  price_max?: number
  created_after?: string
  created_before?: string
}

/**
 * Product pagination parameters
 */
export interface ProductPagination {
  page: number
  limit: number
  sort_by: string
  sort_order: 'asc' | 'desc'
}

/**
 * Product API response interface
 */
export interface ProductListResponse {
  products: ProductWithPrincipals[]
  total_count: number
  page: number
  limit: number
  has_next: boolean
  has_previous: boolean
}

/**
 * Product-Principal availability view
 */
export interface ProductPrincipalAvailability {
  product_id: string
  product_name: string
  product_category: ProductCategory
  principal_id: string
  principal_name: string
  principal_type: string
  is_available: boolean
  created_at: string
}

/**
 * Product form data interface
 */
export interface ProductFormData {
  name: string
  description: string | null
  category: ProductCategory
  unit_price: number | null
  sku: string | null
  is_active: boolean
  principal_ids: string[]  // Principals that can access this product
}

/**
 * Product statistics interface
 */
export interface ProductStats {
  total_products: number
  active_products: number
  inactive_products: number
  products_by_category: {
    [K in ProductCategory]: number
  }
  average_price: number
  price_range: {
    min: number
    max: number
  }
  most_common_category: ProductCategory
  recently_added: number  // Added in last 30 days
}

/**
 * Yup validation schema for product forms
 */
export const productValidationSchema = yup.object({
  name: yup
    .string()
    .required('Product name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name must be less than 200 characters'),
    
  description: yup
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .nullable(),
    
  category: yup
    .string()
    .required('Category is required')
    .oneOf(Object.values(ProductCategory), 'Invalid category selected')
    .nullable(),
    
  unit_price: yup
    .number()
    .min(0, 'Price cannot be negative')
    .nullable(),
    
  sku: yup
    .string()
    .max(50, 'SKU must be less than 50 characters')
    .nullable(),
    
  is_active: yup
    .boolean()
    .default(true),
    
  principal_ids: yup
    .array(yup.string().uuid('Invalid principal ID'))
    .min(1, 'At least one principal must be assigned')
    .required('Principal assignment is required')
})

/**
 * Type inference from validation schema
 */
export type ProductFormValidation = yup.InferType<typeof productValidationSchema>

/**
 * Product-Principal relationship validation schema
 */
export const productPrincipalValidationSchema = yup.object({
  product_id: yup
    .string()
    .required('Product ID is required')
    .uuid('Invalid product ID'),
    
  principal_id: yup
    .string()
    .required('Principal ID is required')
    .uuid('Invalid principal ID')
})

/**
 * Category color coding for UI components
 */
export const CATEGORY_COLORS: { [K in ProductCategory]: string } = {
  [ProductCategory.PROTEIN]: 'red',
  [ProductCategory.SAUCE]: 'orange',
  [ProductCategory.SEASONING]: 'green',
  [ProductCategory.BEVERAGE]: 'blue',
  [ProductCategory.SNACK]: 'yellow',
  [ProductCategory.FROZEN]: 'cyan',
  [ProductCategory.DAIRY]: 'purple',
  [ProductCategory.BAKERY]: 'pink',
  [ProductCategory.OTHER]: 'gray'
}

/**
 * Category icons for UI components
 */
export const CATEGORY_ICONS: { [K in ProductCategory]: string } = {
  [ProductCategory.PROTEIN]: '🥩',
  [ProductCategory.SAUCE]: '🥫',
  [ProductCategory.SEASONING]: '🧂',
  [ProductCategory.BEVERAGE]: '🥤',
  [ProductCategory.SNACK]: '🍿',
  [ProductCategory.FROZEN]: '🧊',
  [ProductCategory.DAIRY]: '🥛',
  [ProductCategory.BAKERY]: '🍞',
  [ProductCategory.OTHER]: '📦'
}

/**
 * Product search result interface
 */
export interface ProductSearchResult {
  id: string
  name: string
  category: ProductCategory | null
  description: string | null
  unit_price?: number | null
  match_score: number  // Search relevance score
  available_for_principals: string[]  // Principal IDs
  highlight_fields: string[]  // Fields that matched the search
}

/**
 * Bulk product operations interface
 */
export interface BulkProductOperation {
  operation: 'activate' | 'deactivate' | 'delete' | 'update_category' | 'assign_principals'
  product_ids: string[]
  parameters?: {
    category?: ProductCategory
    principal_ids?: string[]
    is_active?: boolean
  }
}

/**
 * Bulk operation result interface
 */
export interface BulkProductResult {
  success: boolean
  processed_count: number
  failed_count: number
  errors: {
    product_id: string
    product_name: string
    error_message: string
  }[]
  updated_products: Product[]
}