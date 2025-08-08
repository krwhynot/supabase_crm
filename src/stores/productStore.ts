/**
 * Product Store - Comprehensive State Management
 * Manages product catalog, principal-product relationships, and product analytics
 * Optimized for opportunity form integration and product filtering
 */

import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { productsApi } from '@/services/productsApi'
import type {
  Product,
  ProductWithPrincipals,
  ProductOption,
  ProductFilters,
  ProductStats,
  ProductSearchResult,
  BulkProductOperation,
  BulkProductResult,
  ProductCategory
} from '@/types/products'
// ApiResponse type from productsApi - used for consistent API responses

/**
 * Store state interface for better type safety
 */
interface ProductStoreState {
  // Data collections
  products: ProductWithPrincipals[]
  selectedProduct: Product | null
  productOptions: ProductOption[] // For opportunity forms
  
  // UI state
  loading: boolean
  creating: boolean
  updating: boolean
  deleting: boolean
  
  // Error handling
  error: string | null
  
  // Search and filtering
  searchResults: ProductSearchResult[]
  searchTerm: string
  
  // Analytics
  stats: ProductStats | null
  
  // Bulk operations
  bulkOperationResult: BulkProductResult | null
}

export const useProductStore = defineStore('product', () => {
  // ===============================
  // STATE MANAGEMENT
  // ===============================
  
  const state = reactive<ProductStoreState>({
    // Data collections
    products: [],
    selectedProduct: null,
    productOptions: [],
    
    // UI state
    loading: false,
    creating: false,
    updating: false,
    deleting: false,
    
    // Error handling
    error: null,
    
    // Search and filtering
    searchResults: [],
    searchTerm: '',
    
    // Analytics
    stats: null,
    
    // Bulk operations
    bulkOperationResult: null
  })

  // Active filters for product list
  const activeFilters = ref<ProductFilters>({})

  // ===============================
  // COMPUTED PROPERTIES
  // ===============================
  
  const isLoading = computed(() => 
    state.loading || state.creating || state.updating || state.deleting
  )
  
  const hasError = computed(() => !!state.error)
  
  const productCount = computed(() => state.products.length)
  
  const activeProductCount = computed(() => 
    state.products.filter(p => p.is_active).length
  )
  
  const getProductById = computed(() => {
    return (id: string) => state.products.find(p => p.id === id)
  })
  
  const getProductsByCategory = computed(() => {
    return (category: ProductCategory) => 
      state.products.filter(p => p.category === category)
  })
  
  const getProductsForPrincipals = computed(() => {
    return (principalIds: string[]) => 
      state.productOptions.filter(p => 
        p.available_principals.some(pid => principalIds.includes(pid))
      )
  })
  
  const categoriesInUse = computed(() => {
    const categories = new Set<ProductCategory>()
    state.products.forEach(product => {
      if (product.category) {
        categories.add(product.category)
      }
    })
    return Array.from(categories)
  })

  // ===============================
  // ACTIONS - CRUD OPERATIONS
  // ===============================
  
  /**
   * Fetch products with optional search and filtering
   */
  const fetchProducts = async (options: any = {}): Promise<void> => {
    state.loading = true
    state.error = null
    
    try {
      const response = await productsApi.getProducts(options)
      
      if (response.success && response.data) {
        state.products = response.data
      } else {
        state.error = response.error || 'Failed to fetch products'
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
    } finally {
      state.loading = false
    }
  }
  
  /**
   * Fetch products available to specific principals (for opportunity forms)
   */
  const fetchProductsForPrincipals = async (principalIds: string[]): Promise<void> => {
    state.loading = true
    state.error = null
    
    try {
      const response = await productsApi.getProductsForPrincipals(principalIds)
      
      if (response.success && response.data) {
        state.productOptions = response.data
      } else {
        state.error = response.error || 'Failed to fetch products for principals'
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
    } finally {
      state.loading = false
    }
  }
  
  /**
   * Fetch a single product by ID
   */
  const fetchProductById = async (id: string): Promise<void> => {
    state.loading = true
    state.error = null
    
    try {
      const response = await productsApi.getProduct(id)
      
      if (response.success && response.data) {
        state.selectedProduct = response.data
      } else {
        state.error = response.error || 'Failed to fetch product'
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
    } finally {
      state.loading = false
    }
  }
  
  /**
   * Create a new product
   */
  const createProduct = async (productData: any): Promise<boolean> => {
    state.creating = true
    state.error = null
    
    try {
      const response = await productsApi.createProduct(productData)
      
      if (response.success && response.data) {
        // Add to local state
        const newProductWithPrincipals: ProductWithPrincipals = {
          ...response.data,
          principal_ids: [],
          principal_names: [],
          principal_count: 0
        }
        state.products.unshift(newProductWithPrincipals)
        
        return true
      } else {
        state.error = response.error || 'Failed to create product'
        return false
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
      return false
    } finally {
      state.creating = false
    }
  }
  
  /**
   * Update an existing product
   */
  const updateProduct = async (id: string, updates: any): Promise<boolean> => {
    state.updating = true
    state.error = null
    
    try {
      const response = await productsApi.updateProduct(id, updates)
      
      if (response.success && response.data) {
        // Update in local state
        const index = state.products.findIndex(p => p.id === id)
        if (index !== -1) {
          state.products[index] = {
            ...state.products[index],
            ...response.data
          }
        }
        
        // Update selected product if it's the same one
        if (state.selectedProduct?.id === id) {
          state.selectedProduct = response.data
        }
        
        return true
      } else {
        state.error = response.error || 'Failed to update product'
        return false
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
      return false
    } finally {
      state.updating = false
    }
  }
  
  /**
   * Delete a product (soft delete)
   */
  const deleteProduct = async (id: string): Promise<boolean> => {
    state.deleting = true
    state.error = null
    
    try {
      const response = await productsApi.deleteProduct(id)
      
      if (response.success) {
        // Update in local state (soft delete - mark as inactive)
        const index = state.products.findIndex(p => p.id === id)
        if (index !== -1) {
          state.products[index].is_active = false
        }
        
        // Clear selected product if it was deleted
        if (state.selectedProduct?.id === id) {
          state.selectedProduct = null
        }
        
        return true
      } else {
        state.error = response.error || 'Failed to delete product'
        return false
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
      return false
    } finally {
      state.deleting = false
    }
  }
  
  /**
   * Assign product to principals
   */
  const assignProductToPrincipals = async (productId: string, principalIds: string[]): Promise<boolean> => {
    state.updating = true
    state.error = null
    
    try {
      const response = await productsApi.assignProductToPrincipals(productId, principalIds)
      
      if (response.success && response.data) {
        // Update local state with new principal assignments
        const index = state.products.findIndex(p => p.id === productId)
        if (index !== -1) {
          state.products[index].principal_ids = principalIds
          state.products[index].principal_count = principalIds.length
          // Principal names would need to be fetched separately
        }
        
        return true
      } else {
        state.error = response.error || 'Failed to assign product to principals'
        return false
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
      return false
    } finally {
      state.updating = false
    }
  }

  // ===============================
  // ACTIONS - SEARCH & ANALYTICS
  // ===============================
  
  /**
   * Search products with advanced matching
   */
  const searchProducts = async (searchTerm: string, filters: ProductFilters = {}): Promise<void> => {
    state.loading = true
    state.error = null
    state.searchTerm = searchTerm
    
    try {
      const response = await productsApi.searchProducts(searchTerm, filters)
      
      if (response.success && response.data) {
        state.searchResults = response.data
      } else {
        state.error = response.error || 'Failed to search products'
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
    } finally {
      state.loading = false
    }
  }
  
  /**
   * Fetch product statistics for dashboard
   */
  const fetchStats = async (): Promise<void> => {
    state.loading = true
    state.error = null
    
    try {
      const response = await productsApi.getProductStats()
      
      if (response.success && response.data) {
        state.stats = response.data
      } else {
        state.error = response.error || 'Failed to fetch product statistics'
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
    } finally {
      state.loading = false
    }
  }
  
  /**
   * Perform bulk operations on products
   */
  const performBulkOperation = async (operation: BulkProductOperation): Promise<boolean> => {
    state.updating = true
    state.error = null
    state.bulkOperationResult = null
    
    try {
      const response = await productsApi.performBulkOperation(operation)
      
      if (response.success && response.data) {
        state.bulkOperationResult = response.data
        
        // Update local state based on operation
        if (response.data.success) {
          operation.product_ids.forEach(productId => {
            const index = state.products.findIndex(p => p.id === productId)
            if (index !== -1) {
              switch (operation.operation) {
                case 'activate':
                  state.products[index].is_active = true
                  break
                case 'deactivate':
                case 'delete':
                  state.products[index].is_active = false
                  break
                case 'update_category':
                  if (operation.parameters?.category) {
                    state.products[index].category = operation.parameters.category
                  }
                  break
              }
            }
          })
        }
        
        return response.data.success
      } else {
        state.error = response.error || 'Failed to perform bulk operation'
        return false
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
      return false
    } finally {
      state.updating = false
    }
  }

  // ===============================
  // ACTIONS - UTILITY FUNCTIONS
  // ===============================
  
  /**
   * Clear all error states
   */
  const clearError = (): void => {
    state.error = null
  }
  
  /**
   * Clear selected product
   */
  const clearSelectedProduct = (): void => {
    state.selectedProduct = null
  }
  
  /**
   * Clear search results
   */
  const clearSearchResults = (): void => {
    state.searchResults = []
    state.searchTerm = ''
  }
  
  /**
   * Clear bulk operation results
   */
  const clearBulkResults = (): void => {
    state.bulkOperationResult = null
  }
  
  /**
   * Reset filters to defaults
   */
  const resetFilters = (): void => {
    activeFilters.value = {}
  }
  
  /**
   * Refresh current data
   */
  const refresh = async (): Promise<void> => {
    await fetchProducts()
  }

  // ===============================
  // RETURN STORE INTERFACE
  // ===============================
  
  return {
    // State
    ...state,
    activeFilters,
    
    // Computed
    isLoading,
    hasError,
    productCount,
    activeProductCount,
    getProductById,
    getProductsByCategory,
    getProductsForPrincipals,
    categoriesInUse,
    
    // Actions - CRUD
    fetchProducts,
    fetchProductsForPrincipals,
    fetchProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    assignProductToPrincipals,
    
    // Actions - Search & Analytics
    searchProducts,
    fetchStats,
    performBulkOperation,
    
    // Actions - Utilities
    clearError,
    clearSelectedProduct,
    clearSearchResults,
    clearBulkResults,
    resetFilters,
    refresh
  }
})