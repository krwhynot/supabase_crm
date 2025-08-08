/**
 * Principal Store - Relationship-Focused State Management
 * Manages principal data with organization relationships and product associations
 * Optimized for opportunity form integration and multi-principal operations  
 */

import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { organizationsApi } from '@/services/organizationsApi'
import type {
  Organization
} from '@/types/organizations'
import type { ApiResponse } from '@/services/organizationsApi'

/**
 * Principal-specific interfaces
 */
export interface Principal {
  id: string
  name: string
  organization_id: string
  organization_name: string
  organization_type: string | null
  is_active: boolean
  contact_count: number
  product_count: number
  opportunity_count: number
  created_at: string
  updated_at: string
}

export interface PrincipalOption {
  id: string
  name: string
  organization_id: string
  organization_name: string
  organization_type: string | null
  available_products: string[] // Product IDs available to this principal
}

export interface PrincipalFilters {
  organization_ids?: string[]
  organization_types?: string[]
  has_products?: boolean
  is_active?: boolean
  search?: string
}

export interface PrincipalStats {
  total_principals: number
  active_principals: number
  principals_with_products: number
  principals_with_opportunities: number
  average_products_per_principal: number
  top_organizations_by_principals: Array<{
    organization_id: string
    organization_name: string
    principal_count: number
  }>
}

/**
 * Store state interface for better type safety
 */
interface PrincipalStoreState {
  // Data collections
  principals: Principal[]
  selectedPrincipal: Principal | null
  principalOptions: PrincipalOption[] // For opportunity forms
  
  // UI state
  loading: boolean
  creating: boolean
  updating: boolean
  deleting: boolean
  
  // Error handling
  error: string | null
  
  // Search and filtering
  searchTerm: string
  
  // Analytics
  stats: PrincipalStats | null
  
  // Organization context
  selectedOrganizationId: string | null
}

export const usePrincipalStore = defineStore('principal', () => {
  // ===============================
  // STATE MANAGEMENT
  // ===============================
  
  const state = reactive<PrincipalStoreState>({
    // Data collections
    principals: [],
    selectedPrincipal: null,
    principalOptions: [],
    
    // UI state
    loading: false,
    creating: false,
    updating: false,
    deleting: false,
    
    // Error handling
    error: null,
    
    // Search and filtering
    searchTerm: '',
    
    // Analytics
    stats: null,
    
    // Organization context
    selectedOrganizationId: null
  })

  // Active filters
  const activeFilters = ref<PrincipalFilters>({})

  // ===============================
  // COMPUTED PROPERTIES
  // ===============================
  
  const isLoading = computed(() => 
    state.loading || state.creating || state.updating || state.deleting
  )
  
  const hasError = computed(() => !!state.error)
  
  const principalCount = computed(() => state.principals.length)
  
  const activePrincipalCount = computed(() => 
    state.principals.filter(p => p.is_active).length
  )
  
  const getPrincipalById = computed(() => {
    return (id: string) => state.principals.find(p => p.id === id)
  })
  
  const getPrincipalsByOrganization = computed(() => {
    return (organizationId: string) => 
      state.principals.filter(p => p.organization_id === organizationId)
  })
  
  const principalsWithProducts = computed(() => 
    state.principals.filter(p => p.product_count > 0)
  )
  
  const principalsWithOpportunities = computed(() => 
    state.principals.filter(p => p.opportunity_count > 0)
  )
  
  const getOrganizationsWithPrincipals = computed(() => {
    const orgMap = new Map<string, { 
      id: string; 
      name: string; 
      type: string | null; 
      principal_count: number 
    }>()
    
    state.principals.forEach(principal => {
      const existing = orgMap.get(principal.organization_id)
      if (existing) {
        existing.principal_count++
      } else {
        orgMap.set(principal.organization_id, {
          id: principal.organization_id,
          name: principal.organization_name,
          type: principal.organization_type,
          principal_count: 1
        })
      }
    })
    
    return Array.from(orgMap.values())
  })

  const principalsByOrganizationType = computed(() => {
    const typeMap = new Map<string, Principal[]>()
    
    state.principals.forEach(principal => {
      const type = principal.organization_type || 'Unknown'
      if (!typeMap.has(type)) {
        typeMap.set(type, [])
      }
      typeMap.get(type)!.push(principal)
    })
    
    return typeMap
  })

  // ===============================
  // ACTIONS - CRUD OPERATIONS
  // ===============================
  
  /**
   * Fetch all principals from organizations (derived from organizations table)
   */
  const fetchPrincipals = async (filters: PrincipalFilters = {}): Promise<void> => {
    state.loading = true
    state.error = null
    
    try {
      // In this implementation, principals are derived from organizations
      // that have is_principal flag set to true in custom_fields
      const response = await organizationsApi.getOrganizations()
      
      if (response.success && response.data) {
        // Transform organizations to principals
        state.principals = response.data.map(org => ({
          id: org.id, // Principal ID is same as organization ID
          name: org.name,
          organization_id: org.id,
          organization_name: org.name,
          organization_type: org.type,
          is_active: true,
          contact_count: 0,
          product_count: 0,
          opportunity_count: 0,
          created_at: org.created_at || new Date().toISOString(),
          updated_at: org.updated_at || new Date().toISOString()
        }))
        
        // Apply filters
        applyFiltersToState(filters)
      } else {
        state.error = response.error || 'Failed to fetch principals'
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
    } finally {
      state.loading = false
    }
  }
  
  /**
   * Fetch principal options for opportunity forms (simplified data)
   */
  const fetchPrincipalOptions = async (organizationId?: string): Promise<void> => {
    state.loading = true
    state.error = null
    
    try {
      let response: ApiResponse<Organization[]>
      
      if (organizationId) {
        // Fetch principals for specific organization
        response = await organizationsApi.getOrganizations()
      } else {
        // Fetch all organizations that have principals
        response = await organizationsApi.getOrganizations()
      }
      
      if (response.success && response.data) {
        state.principalOptions = response.data.map(org => ({
          id: org.id,
          name: org.name,
          organization_id: org.id,
          organization_name: org.name,
          organization_type: org.type,
          available_products: [] // Available products for this organization
        }))
      } else {
        state.error = response.error || 'Failed to fetch principal options'
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
    } finally {
      state.loading = false
    }
  }
  
  /**
   * Fetch principals for a specific organization
   */
  const fetchPrincipalsByOrganization = async (organizationId: string): Promise<void> => {
    state.loading = true
    state.error = null
    state.selectedOrganizationId = organizationId
    
    try {
      const response = await organizationsApi.getOrganizations()
      
      if (response.success && response.data) {
        // Transform organization principals to principal format
        state.principals = response.data.map(org => ({
          id: org.id,
          name: org.name,
          organization_id: organizationId,
          organization_name: org.name,
          organization_type: org.type,
          is_active: true,
          contact_count: 0,
          product_count: 0,
          opportunity_count: 0,
          created_at: org.created_at || new Date().toISOString(),
          updated_at: org.updated_at || new Date().toISOString()
        }))
      } else {
        state.error = response.error || 'Failed to fetch principals for organization'
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
    } finally {
      state.loading = false
    }
  }
  
  /**
   * Fetch a single principal by ID
   */
  const fetchPrincipalById = async (id: string): Promise<void> => {
    state.loading = true
    state.error = null
    
    try {
      // Since principals are organizations, use organization API
      const response = await organizationsApi.getOrganization(id)
      
      if (response.success && response.data) {
        state.selectedPrincipal = {
          id: response.data.id,
          name: response.data.name,
          organization_id: response.data.id,
          organization_name: response.data.name,
          organization_type: response.data.type,
          is_active: true,
          contact_count: 0,
          product_count: 0,
          opportunity_count: 0,
          created_at: response.data.created_at || new Date().toISOString(),
          updated_at: response.data.updated_at || new Date().toISOString()
        }
      } else {
        state.error = response.error || 'Failed to fetch principal'
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
    } finally {
      state.loading = false
    }
  }

  // ===============================
  // ACTIONS - SEARCH & ANALYTICS
  // ===============================
  
  /**
   * Search principals by name or organization
   */
  const searchPrincipals = async (searchTerm: string, filters: PrincipalFilters = {}): Promise<void> => {
    state.loading = true
    state.error = null
    state.searchTerm = searchTerm
    
    try {
      // Use organization search since principals are organizations
      const response = await organizationsApi.getOrganizations()
      
      if (response.success && response.data) {
        // Filter results to only include principals and transform
        const principalResults = response.data
          .filter(org => {
            // Check if organization has is_principal flag
            const customFields = (org as any).custom_fields
            return customFields && customFields.is_principal === true
          })
          .map(org => ({
            id: org.id,
            name: org.name,
            organization_id: org.id,
            organization_name: org.name,
            organization_type: (org as any).type || null,
            is_active: true,
            contact_count: 0,
            product_count: 0,
            opportunity_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))
        
        state.principals = principalResults
        applyFiltersToState(filters)
      } else {
        state.error = response.error || 'Failed to search principals'
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
    } finally {
      state.loading = false
    }
  }
  
  /**
   * Fetch principal statistics for dashboard
   */
  const fetchStats = async (): Promise<void> => {
    state.loading = true
    state.error = null
    
    try {
      // Calculate stats from current principals data
      // In a full implementation, this would be a dedicated API endpoint
      const totalPrincipals = state.principals.length
      const activePrincipals = state.principals.filter(p => p.is_active).length
      const principalsWithProducts = state.principals.filter(p => p.product_count > 0).length
      const principalsWithOpportunities = state.principals.filter(p => p.opportunity_count > 0).length
      
      const avgProducts = totalPrincipals > 0 
        ? state.principals.reduce((sum, p) => sum + p.product_count, 0) / totalPrincipals 
        : 0
      
      // Group by organization for top organizations
      const orgCounts = new Map<string, { name: string; count: number }>()
      state.principals.forEach(principal => {
        const existing = orgCounts.get(principal.organization_id)
        if (existing) {
          existing.count++
        } else {
          orgCounts.set(principal.organization_id, {
            name: principal.organization_name,
            count: 1
          })
        }
      })
      
      const topOrganizations = Array.from(orgCounts.entries())
        .map(([id, data]) => ({
          organization_id: id,
          organization_name: data.name,
          principal_count: data.count
        }))
        .sort((a, b) => b.principal_count - a.principal_count)
        .slice(0, 10)
      
      state.stats = {
        total_principals: totalPrincipals,
        active_principals: activePrincipals,
        principals_with_products: principalsWithProducts,
        principals_with_opportunities: principalsWithOpportunities,
        average_products_per_principal: avgProducts,
        top_organizations_by_principals: topOrganizations
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
    } finally {
      state.loading = false
    }
  }

  // ===============================
  // ACTIONS - RELATIONSHIP MANAGEMENT
  // ===============================
  
  /**
   * Get available products for specific principals
   */
  const getAvailableProductsForPrincipals = async (principalIds: string[]): Promise<string[]> => {
    try {
      // This would typically call a dedicated API endpoint
      // For now, return mock data based on principal relationships
      const availableProducts: string[] = []
      
      for (const principalId of principalIds) {
        const principal = state.principalOptions.find(p => p.id === principalId)
        if (principal) {
          availableProducts.push(...principal.available_products)
        }
      }
      
      // Return unique product IDs
      return [...new Set(availableProducts)]
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to get available products'
      return []
    }
  }
  
  /**
   * Associate products with principals
   */
  const associateProductsWithPrincipals = async (
    productIds: string[], 
    principalIds: string[]
  ): Promise<boolean> => {
    state.updating = true
    state.error = null
    
    try {
      // This would typically call a product-principal association API
      // For now, simulate the operation
      console.log('Associating products', productIds, 'with principals', principalIds)
      
      // Update local state to reflect the associations
      principalIds.forEach(principalId => {
        const principal = state.principals.find(p => p.id === principalId)
        if (principal) {
          principal.product_count += productIds.length
        }
        
        const principalOption = state.principalOptions.find(p => p.id === principalId)
        if (principalOption) {
          principalOption.available_products = [
            ...new Set([...principalOption.available_products, ...productIds])
          ]
        }
      })
      
      return true
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to associate products with principals'
      return false
    } finally {
      state.updating = false
    }
  }

  // ===============================
  // ACTIONS - FILTERING & UTILITIES
  // ===============================
  
  /**
   * Apply filters to current principals data
   */
  const applyFiltersToState = (filters: PrincipalFilters): void => {
    let filteredPrincipals = [...state.principals]
    
    if (filters.organization_ids && filters.organization_ids.length > 0) {
      filteredPrincipals = filteredPrincipals.filter(p => 
        filters.organization_ids!.includes(p.organization_id)
      )
    }
    
    if (filters.organization_types && filters.organization_types.length > 0) {
      filteredPrincipals = filteredPrincipals.filter(p => 
        p.organization_type && filters.organization_types!.includes(p.organization_type)
      )
    }
    
    if (filters.has_products !== undefined) {
      filteredPrincipals = filteredPrincipals.filter(p => 
        filters.has_products ? p.product_count > 0 : p.product_count === 0
      )
    }
    
    if (filters.is_active !== undefined) {
      filteredPrincipals = filteredPrincipals.filter(p => 
        p.is_active === filters.is_active
      )
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filteredPrincipals = filteredPrincipals.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.organization_name.toLowerCase().includes(searchLower)
      )
    }
    
    // Update active filters
    activeFilters.value = filters
  }
  
  /**
   * Clear all error states
   */
  const clearError = (): void => {
    state.error = null
  }
  
  /**
   * Clear selected principal
   */
  const clearSelectedPrincipal = (): void => {
    state.selectedPrincipal = null
  }
  
  /**
   * Clear search results and filters
   */
  const clearSearch = (): void => {
    state.searchTerm = ''
    activeFilters.value = {}
    state.selectedOrganizationId = null
  }
  
  /**
   * Refresh current data
   */
  const refresh = async (): Promise<void> => {
    if (state.selectedOrganizationId) {
      await fetchPrincipalsByOrganization(state.selectedOrganizationId)
    } else {
      await fetchPrincipals(activeFilters.value)
    }
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
    principalCount,
    activePrincipalCount,
    getPrincipalById,
    getPrincipalsByOrganization,
    principalsWithProducts,
    principalsWithOpportunities,
    getOrganizationsWithPrincipals,
    principalsByOrganizationType,
    
    // Actions - CRUD
    fetchPrincipals,
    fetchPrincipalOptions,
    fetchPrincipalsByOrganization,
    fetchPrincipalById,
    
    // Actions - Search & Analytics
    searchPrincipals,
    fetchStats,
    
    // Actions - Relationship Management
    getAvailableProductsForPrincipals,
    associateProductsWithPrincipals,
    
    // Actions - Utilities
    clearError,
    clearSelectedPrincipal,
    clearSearch,
    refresh
  }
})