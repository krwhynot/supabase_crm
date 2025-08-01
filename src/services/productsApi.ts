/**
 * Products API Service
 * Centralized Supabase operations for product catalog management
 * Includes principal-product relationship management and filtering
 */

import { supabase } from '@/config/supabaseClient'
import type { 
  Product, 
  ProductInsert, 
  ProductUpdate,
  ProductWithPrincipals,
  ProductFilters,
  ProductStats,
  ProductPrincipal,
  ProductOption,
  BulkProductOperation,
  BulkProductResult,
  ProductSearchResult,
  ProductCategory
} from '@/types/products'
import type { ApiResponse } from './contactsApi'

/**
 * Search and pagination options
 */
export interface ProductSearchOptions {
  search?: string
  limit?: number
  offset?: number
  sortBy?: 'name' | 'category' | 'unit_price' | 'created_at' | 'principal_count'
  sortOrder?: 'asc' | 'desc'
  principal_id?: string  // Filter products available to specific principal
  category?: string
  is_active?: boolean
}

class ProductsApiService {

  /**
   * Get all products with optional search, filtering, and pagination
   */
  async getProducts(options: ProductSearchOptions = {}): Promise<ApiResponse<ProductWithPrincipals[]>> {
    try {
      let query = supabase
        .from('products')
        .select('*')

      // Apply search filter across multiple fields
      if (options.search) {
        query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%,sku.ilike.%${options.search}%`)
      }

      // Apply category filter
      if (options.category) {
        query = query.eq('category', options.category as ProductCategory)
      }

      // Apply active status filter
      if (options.is_active !== undefined) {
        query = query.eq('is_active', options.is_active)
      }

      // Apply sorting (skip principal_count for now since we don't have the view)
      const sortBy = options.sortBy === 'principal_count' ? 'name' : (options.sortBy || 'name')
      const sortOrder = options.sortOrder || 'asc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit)
      }
      if (options.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 50)) - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching products:', error)
        return {
          data: null,
          error: `Failed to fetch products: ${error.message}`,
          success: false
        }
      }

      // Transform to ProductWithPrincipals format (simplified for now)
      const productsWithPrincipals: ProductWithPrincipals[] = (data || []).map(product => ({
        ...product,
        category: product.category as ProductCategory | null,
        unit_price: product.suggested_retail_price,
        principal_ids: [], // TODO: Populate when junction table is implemented
        principal_names: [],
        principal_count: 0
      }))

      return {
        data: productsWithPrincipals,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error fetching products:', error)
      return {
        data: null,
        error: 'An unexpected error occurred while fetching products',
        success: false
      }
    }
  }

  /**
   * Get products available to specific principals (for opportunity forms)
   */
  async getProductsForPrincipals(principalIds: string[]): Promise<ApiResponse<ProductOption[]>> {
    try {
      // For now, return all active products since we don't have the junction table yet
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category, description, suggested_retail_price')
        .eq('is_active', true)

      if (error) {
        console.error('Error fetching products for principals:', error)
        return {
          data: null,
          error: `Failed to fetch products for principals: ${error.message}`,
          success: false
        }
      }

      // Transform to ProductOption format
      const productOptions: ProductOption[] = (data || []).map(product => ({
        id: product.id,
        name: product.name,
        category: product.category as ProductCategory | null,
        description: product.description,
        unit_price: product.suggested_retail_price,
        available_principals: principalIds // Use the input principal IDs for now
      }))

      return {
        data: productOptions,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error fetching products for principals:', error)
      return {
        data: null,
        error: 'An unexpected error occurred while fetching products for principals',
        success: false
      }
    }
  }

  /**
   * Get a single product by ID
   */
  async getProduct(id: string): Promise<ApiResponse<Product>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching product:', error)
        return {
          data: null,
          error: `Failed to fetch product: ${error.message}`,
          success: false
        }
      }

      return {
        data: {
          ...data,
          category: data.category as ProductCategory | null,
          unit_price: data.suggested_retail_price,
          created_by: null
        } as Product,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error fetching product:', error)
      return {
        data: null,
        error: 'An unexpected error occurred while fetching the product',
        success: false
      }
    }
  }

  /**
   * Create a new product
   */
  async createProduct(product: ProductInsert): Promise<ApiResponse<Product>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single()

      if (error) {
        console.error('Error creating product:', error)
        return {
          data: null,
          error: `Failed to create product: ${error.message}`,
          success: false
        }
      }

      return {
        data: {
          ...data,
          category: data.category as ProductCategory | null,
          unit_price: data.suggested_retail_price,
          created_by: null
        } as Product,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error creating product:', error)
      return {
        data: null,
        error: 'An unexpected error occurred while creating the product',
        success: false
      }
    }
  }

  /**
   * Update an existing product
   */
  async updateProduct(id: string, updates: ProductUpdate): Promise<ApiResponse<Product>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating product:', error)
        return {
          data: null,
          error: `Failed to update product: ${error.message}`,
          success: false
        }
      }

      return {
        data: {
          ...data,
          category: data.category as ProductCategory | null,
          unit_price: data.suggested_retail_price,
          created_by: null
        } as Product,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error updating product:', error)
      return {
        data: null,
        error: 'An unexpected error occurred while updating the product',
        success: false
      }
    }
  }

  /**
   * Delete a product (soft delete)
   */
  async deleteProduct(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          is_active: false,
          deleted_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        console.error('Error deleting product:', error)
        return {
          data: null,
          error: `Failed to delete product: ${error.message}`,
          success: false
        }
      }

      return {
        data: true,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error deleting product:', error)
      return {
        data: null,
        error: 'An unexpected error occurred while deleting the product',
        success: false
      }
    }
  }

  /**
   * Assign product to principals
   */
  async assignProductToPrincipals(productId: string, principalIds: string[]): Promise<ApiResponse<ProductPrincipal[]>> {
    try {
      // First, remove existing assignments
      await supabase
        .from('product_principals')
        .delete()
        .eq('product_id', productId)

      // Then, create new assignments
      const assignments = principalIds.map(principalId => ({
        product_id: productId,
        principal_id: principalId
      }))

      const { data, error } = await supabase
        .from('product_principals')
        .insert(assignments)
        .select(`
          *,
          products!inner(name, category),
          organizations!inner(name, type)
        `)

      if (error) {
        console.error('Error assigning product to principals:', error)
        return {
          data: null,
          error: `Failed to assign product to principals: ${error.message}`,
          success: false
        }
      }

      // Transform the response to match ProductPrincipal interface
      const productPrincipals: ProductPrincipal[] = (data || []).map(item => ({
        id: item.id,
        product_id: item.product_id,
        principal_id: item.principal_id,
        created_at: item.created_at || new Date().toISOString(),
        product_name: (item as any).products?.name || '',
        product_category: (item as any).products?.category as ProductCategory | null,
        principal_name: (item as any).organizations?.name || '',
        principal_type: (item as any).organizations?.type || ''
      }))

      return {
        data: productPrincipals,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error assigning product to principals:', error)
      return {
        data: null,
        error: 'An unexpected error occurred while assigning product to principals',
        success: false
      }
    }
  }

  /**
   * Get product statistics
   */
  async getProductStats(): Promise<ApiResponse<ProductStats>> {
    try {
      // Get total and active product counts
      const [totalResult, activeResult] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true)
      ])

      if (totalResult.error) throw totalResult.error
      if (activeResult.error) throw activeResult.error

      const total = totalResult.count || 0
      const active = activeResult.count || 0

      // Get products by category
      const { data: categoryData, error: categoryError } = await supabase
        .from('products')
        .select('category')
        .eq('is_active', true)

      if (categoryError) throw categoryError

      // Count by category
      const categoryCount = (categoryData || []).reduce((acc, item) => {
        const category = item.category as ProductCategory | null
        if (category) {
          acc[category] = (acc[category] || 0) + 1
        }
        return acc
      }, {} as { [K in ProductCategory]: number })

      // Get price statistics
      const { data: priceData, error: priceError } = await supabase
        .from('products')
        .select('suggested_retail_price')
        .eq('is_active', true)
        .not('suggested_retail_price', 'is', null)

      if (priceError) throw priceError

      const prices = (priceData || []).map(item => item.suggested_retail_price).filter(price => price !== null)
      const averagePrice = prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0

      // Get most common category
      const mostCommonCategory = Object.entries(categoryCount)
        .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] as ProductCategory

      // Get recently added count (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { count: recentlyAdded, error: recentError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString())

      if (recentError) throw recentError

      const stats: ProductStats = {
        total_products: total,
        active_products: active,
        inactive_products: total - active,
        products_by_category: categoryCount,
        average_price: averagePrice,
        price_range: {
          min: minPrice,
          max: maxPrice
        },
        most_common_category: mostCommonCategory,
        recently_added: recentlyAdded || 0
      }

      return {
        data: stats,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Error fetching product stats:', error)
      return {
        data: null,
        error: 'Failed to fetch product statistics',
        success: false
      }
    }
  }

  /**
   * Search products with advanced matching
   */
  async searchProducts(
    searchTerm: string, 
    filters: ProductFilters = {}
  ): Promise<ApiResponse<ProductSearchResult[]>> {
    try {
      let query = supabase
        .from('products')
        .select('*')

      // Apply basic filters
      if (filters.category && filters.category.length > 0) {
        query = query.in('category', filters.category as ProductCategory[])
      }

      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active)
      }

      // TODO: Implement principal filtering when junction table is available

      // Apply price range filters
      if (filters.price_min !== undefined) {
        query = query.gte('suggested_retail_price', filters.price_min)
      }

      if (filters.price_max !== undefined) {
        query = query.lte('suggested_retail_price', filters.price_max)
      }

      // Apply search term
      if (searchTerm.trim()) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error searching products:', error)
        return {
          data: null,
          error: `Failed to search products: ${error.message}`,
          success: false
        }
      }

      // Transform results and calculate match scores
      const results: ProductSearchResult[] = (data || []).map(product => {
        const matchScore = this.calculateMatchScore(product, searchTerm)
        const highlightFields = this.getHighlightFields(product, searchTerm)

        return {
          id: String(product.id),
          name: product.name,
          category: product.category as ProductCategory | null,
          description: product.description,
          unit_price: product.suggested_retail_price,
          match_score: matchScore,
          available_for_principals: [], // TODO: Populate when junction table is implemented
          highlight_fields: highlightFields
        }
      })

      // Sort by match score
      results.sort((a, b) => b.match_score - a.match_score)

      return {
        data: results,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error searching products:', error)
      return {
        data: null,
        error: 'An unexpected error occurred while searching products',
        success: false
      }
    }
  }

  /**
   * Perform bulk operations on products
   */
  async performBulkOperation(operation: BulkProductOperation): Promise<ApiResponse<BulkProductResult>> {
    try {
      const results: BulkProductResult = {
        success: true,
        processed_count: 0,
        failed_count: 0,
        errors: [],
        updated_products: []
      }

      for (const productId of operation.product_ids) {
        try {
          let updateData: any = {}

          switch (operation.operation) {
            case 'activate':
              updateData = { is_active: true }
              break
            case 'deactivate':
              updateData = { is_active: false }
              break
            case 'delete':
              updateData = { 
                is_active: false, 
                deleted_at: new Date().toISOString() 
              }
              break
            case 'update_category':
              if (operation.parameters?.category) {
                updateData = { category: operation.parameters.category }
              }
              break
            default:
              throw new Error(`Unsupported operation: ${operation.operation}`)
          }

          const { data, error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', productId)
            .select()
            .single()

          if (error) throw error

          results.updated_products.push({
            ...data,
            category: data.category as ProductCategory | null,
            unit_price: data.suggested_retail_price,
            created_by: null
          } as Product)
          results.processed_count++

        } catch (error: any) {
          // Get product name for error reporting
          const { data: product } = await supabase
            .from('products')
            .select('name')
            .eq('id', productId)
            .single()

          results.errors.push({
            product_id: productId,
            product_name: product?.name || 'Unknown Product',
            error_message: error.message || 'Unknown error'
          })
          results.failed_count++
        }
      }

      results.success = results.failed_count === 0

      return {
        data: results,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error performing bulk operation:', error)
      return {
        data: null,
        error: 'An unexpected error occurred during bulk operation',
        success: false
      }
    }
  }

  /**
   * Calculate search match score for ranking
   */
  private calculateMatchScore(product: any, searchTerm: string): number {
    if (!searchTerm.trim()) return 1

    const term = searchTerm.toLowerCase()
    let score = 0

    // Exact name match gets highest score
    if (product.name.toLowerCase() === term) {
      score += 100
    } else if (product.name.toLowerCase().includes(term)) {
      score += 50
    }

    // SKU match gets high score
    if (product.sku && product.sku.toLowerCase().includes(term)) {
      score += 30
    }

    // Description match gets lower score
    if (product.description && product.description.toLowerCase().includes(term)) {
      score += 10
    }

    // Category match gets minimal score
    if (product.category.toLowerCase().includes(term)) {
      score += 5
    }

    return score
  }

  /**
   * Get fields that matched the search term for highlighting
   */
  private getHighlightFields(product: any, searchTerm: string): string[] {
    if (!searchTerm.trim()) return []

    const term = searchTerm.toLowerCase()
    const fields: string[] = []

    if (product.name.toLowerCase().includes(term)) {
      fields.push('name')
    }

    if (product.sku && product.sku.toLowerCase().includes(term)) {
      fields.push('sku')
    }

    if (product.description && product.description.toLowerCase().includes(term)) {
      fields.push('description')
    }

    if (product.category.toLowerCase().includes(term)) {
      fields.push('category')
    }

    return fields
  }

}

// Export singleton instance
export const productsApi = new ProductsApiService()

// Export class for testing
export { ProductsApiService }