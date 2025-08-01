/**
 * Opportunity Store - Comprehensive State Management
 * Manages opportunity data, batch creation, pipeline visualization, and KPIs
 * Follows Pinia Composition API patterns with reactive state management
 */

import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { opportunitiesApi } from '@/services/opportunitiesApi'
import type {
  Opportunity,
  OpportunityListView,
  OpportunityDetailView,
  OpportunityFormData,
  OpportunityNamePreview,
  BatchCreationResult,
  OpportunityKPIs,
  OpportunityFilters,
  OpportunityPagination,
  OpportunityListResponse,
  OpportunityStage
} from '@/types/opportunities'
import type { ApiResponse } from '@/services/opportunitiesApi'

/**
 * Store state interface for better type safety
 */
interface OpportunityStoreState {
  // Data collections
  opportunities: OpportunityListView[]
  selectedOpportunity: OpportunityDetailView | null
  
  // UI state
  loading: boolean
  creating: boolean
  updating: boolean
  deleting: boolean
  
  // Error handling
  error: string | null
  
  // Pagination and filtering
  currentPage: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  
  // KPIs and analytics
  kpis: OpportunityKPIs | null
  stageDistribution: { [K in OpportunityStage]: OpportunityListView[] } | null
  
  // Batch operations
  batchCreationResult: BatchCreationResult | null
  namePreviewsCache: OpportunityNamePreview[]
}

export const useOpportunityStore = defineStore('opportunity', () => {
  // ===============================
  // STATE MANAGEMENT
  // ===============================
  
  const state = reactive<OpportunityStoreState>({
    // Data collections
    opportunities: [],
    selectedOpportunity: null,
    
    // UI state
    loading: false,
    creating: false,
    updating: false,
    deleting: false,
    
    // Error handling
    error: null,
    
    // Pagination and filtering
    currentPage: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false,
    
    // KPIs and analytics
    kpis: null,
    stageDistribution: null,
    
    // Batch operations
    batchCreationResult: null,
    namePreviewsCache: []
  })

  // Active filters for list view
  const activeFilters = ref<OpportunityFilters>({})
  const activePagination = ref<OpportunityPagination>({
    page: 1,
    limit: 20,
    sort_by: 'created_at',
    sort_order: 'desc'
  })

  // ===============================
  // COMPUTED PROPERTIES
  // ===============================
  
  const isLoading = computed(() => 
    state.loading || state.creating || state.updating || state.deleting
  )
  
  const hasError = computed(() => !!state.error)
  
  const opportunityCount = computed(() => state.opportunities.length)
  
  const getOpportunityById = computed(() => {
    return (id: string) => state.opportunities.find(opp => opp.id === id)
  })
  
  const getOpportunitiesByStage = computed(() => {
    return (stage: OpportunityStage) => 
      state.opportunities.filter(opp => opp.stage === stage)
  })
  
  const totalPipelineValue = computed(() => {
    return state.opportunities.reduce((total, opp) => {
      // TODO: Calculate based on product pricing when available
      return total + 0
    }, 0)
  })
  
  const averageProbability = computed(() => {
    if (state.opportunities.length === 0) return 0
    const total = state.opportunities.reduce((sum, opp) => sum + (opp.probability_percent || 0), 0)
    return Math.round(total / state.opportunities.length)
  })

  // ===============================
  // ACTIONS - CRUD OPERATIONS
  // ===============================
  
  /**
   * Fetch opportunities with optional filtering and pagination
   */
  const fetchOpportunities = async (
    filters: OpportunityFilters = {},
    pagination: OpportunityPagination = activePagination.value
  ): Promise<void> => {
    state.loading = true
    state.error = null
    
    try {
      const response = await opportunitiesApi.getOpportunitiesWithFilters(filters, pagination)
      
      if (response.success && response.data) {
        state.opportunities = response.data.opportunities
        state.totalCount = response.data.total_count
        state.currentPage = response.data.page
        state.hasNextPage = response.data.has_next
        state.hasPreviousPage = response.data.has_previous
        
        // Update active filters and pagination
        activeFilters.value = filters
        activePagination.value = pagination
      } else {
        state.error = response.error || 'Failed to fetch opportunities'
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
    } finally {
      state.loading = false
    }
  }
  
  /**
   * Fetch a single opportunity by ID
   */
  const fetchOpportunityById = async (id: string): Promise<void> => {
    state.loading = true
    state.error = null
    
    try {
      const response = await opportunitiesApi.getOpportunityById(id)
      
      if (response.success && response.data) {
        state.selectedOpportunity = response.data
      } else {
        state.error = response.error || 'Failed to fetch opportunity'
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
    } finally {
      state.loading = false
    }
  }
  
  /**
   * Create a single opportunity
   */
  const createOpportunity = async (opportunityData: any): Promise<boolean> => {
    state.creating = true
    state.error = null
    
    try {
      const response = await opportunitiesApi.createOpportunity(opportunityData)
      
      if (response.success && response.data) {
        // Add to local state if we're on the first page
        if (state.currentPage === 1) {
          const newOpportunity: OpportunityListView = {
            id: response.data.id,
            name: response.data.name,
            stage: response.data.stage,
            probability_percent: response.data.probability_percent,
            expected_close_date: response.data.expected_close_date,
            deal_owner: response.data.deal_owner,
            is_won: response.data.is_won,
            created_at: response.data.created_at,
            updated_at: response.data.updated_at,
            organization_name: '',
            organization_type: '',
            principal_name: null,
            principal_id: null,
            product_name: null,
            product_category: null,
            days_since_created: 0,
            days_to_close: null,
            stage_duration_days: 0
          }
          state.opportunities.unshift(newOpportunity)
        }
        
        return true
      } else {
        state.error = response.error || 'Failed to create opportunity'
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
   * Create multiple opportunities for different principals (batch creation)
   */
  const createBatchOpportunities = async (formData: OpportunityFormData): Promise<boolean> => {
    state.creating = true
    state.error = null
    state.batchCreationResult = null
    
    try {
      const response = await opportunitiesApi.createBatchOpportunities(formData)
      
      if (response.success && response.data) {
        state.batchCreationResult = response.data
        
        // Refresh opportunities list if batch creation was successful
        if (response.data.success && response.data.created_opportunities.length > 0) {
          await fetchOpportunities(activeFilters.value, activePagination.value)
        }
        
        return response.data.success
      } else {
        state.error = response.error || 'Failed to create batch opportunities'
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
   * Generate name previews for batch creation
   */
  const generateNamePreviews = async (formData: OpportunityFormData): Promise<void> => {
    state.loading = true
    state.error = null
    
    try {
      const response = await opportunitiesApi.generateNamePreviews(formData)
      
      if (response.success && response.data) {
        state.namePreviewsCache = response.data
      } else {
        state.error = response.error || 'Failed to generate name previews'
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
    } finally {
      state.loading = false
    }
  }
  
  /**
   * Update an existing opportunity
   */
  const updateOpportunity = async (id: string, updates: any): Promise<boolean> => {
    state.updating = true
    state.error = null
    
    try {
      const response = await opportunitiesApi.updateOpportunity(id, updates)
      
      if (response.success && response.data) {
        // Update in local state
        const index = state.opportunities.findIndex(opp => opp.id === id)
        if (index !== -1) {
          // Update the list item with available data
          state.opportunities[index] = {
            ...state.opportunities[index],
            name: response.data.name,
            stage: response.data.stage,
            probability_percent: response.data.probability_percent,
            expected_close_date: response.data.expected_close_date,
            deal_owner: response.data.deal_owner,
            is_won: response.data.is_won,
            updated_at: response.data.updated_at
          }
        }
        
        // Update selected opportunity if it's the same one
        if (state.selectedOpportunity?.id === id) {
          await fetchOpportunityById(id)
        }
        
        return true
      } else {
        state.error = response.error || 'Failed to update opportunity'
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
   * Update opportunity stage with automatic probability adjustment
   */
  const updateOpportunityStage = async (id: string, newStage: OpportunityStage): Promise<boolean> => {
    state.updating = true
    state.error = null
    
    try {
      const response = await opportunitiesApi.updateOpportunityStage(id, newStage)
      
      if (response.success && response.data) {
        // Update in local state
        const index = state.opportunities.findIndex(opp => opp.id === id)
        if (index !== -1) {
          state.opportunities[index] = {
            ...state.opportunities[index],
            stage: response.data.stage,
            probability_percent: response.data.probability_percent,
            updated_at: response.data.updated_at
          }
        }
        
        return true
      } else {
        state.error = response.error || 'Failed to update opportunity stage'
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
   * Delete an opportunity (soft delete)
   */
  const deleteOpportunity = async (id: string): Promise<boolean> => {
    state.deleting = true
    state.error = null
    
    try {
      const response = await opportunitiesApi.deleteOpportunity(id)
      
      if (response.success) {
        // Remove from local state
        const index = state.opportunities.findIndex(opp => opp.id === id)
        if (index !== -1) {
          state.opportunities.splice(index, 1)
        }
        
        // Clear selected opportunity if it was deleted
        if (state.selectedOpportunity?.id === id) {
          state.selectedOpportunity = null
        }
        
        return true
      } else {
        state.error = response.error || 'Failed to delete opportunity'
        return false
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
      return false
    } finally {
      state.deleting = false
    }
  }

  // ===============================
  // ACTIONS - ANALYTICS & KPIs
  // ===============================
  
  /**
   * Fetch opportunity KPIs for dashboard
   */
  const fetchKPIs = async (): Promise<void> => {
    state.loading = true
    state.error = null
    
    try {
      const response = await opportunitiesApi.getOpportunityKPIs()
      
      if (response.success && response.data) {
        state.kpis = response.data
      } else {
        state.error = response.error || 'Failed to fetch opportunity KPIs'
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
    } finally {
      state.loading = false
    }
  }
  
  /**
   * Fetch opportunities grouped by stage for pipeline visualization
   */
  const fetchStageDistribution = async (): Promise<void> => {
    state.loading = true
    state.error = null
    
    try {
      const response = await opportunitiesApi.getOpportunitiesByStage()
      
      if (response.success && response.data) {
        state.stageDistribution = response.data
      } else {
        state.error = response.error || 'Failed to fetch stage distribution'
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
    } finally {
      state.loading = false
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
   * Clear selected opportunity
   */
  const clearSelectedOpportunity = (): void => {
    state.selectedOpportunity = null
  }
  
  /**
   * Clear batch creation results
   */
  const clearBatchResults = (): void => {
    state.batchCreationResult = null
    state.namePreviewsCache = []
  }
  
  /**
   * Reset filters and pagination to defaults
   */
  const resetFilters = (): void => {
    activeFilters.value = {}
    activePagination.value = {
      page: 1,
      limit: 20,
      sort_by: 'created_at',
      sort_order: 'desc'
    }
  }
  
  /**
   * Refresh current data (re-fetch with current filters)
   */
  const refresh = async (): Promise<void> => {
    await fetchOpportunities(activeFilters.value, activePagination.value)
  }

  // ===============================
  // RETURN STORE INTERFACE
  // ===============================
  
  return {
    // State
    ...state,
    activeFilters,
    activePagination,
    
    // Computed
    isLoading,
    hasError,
    opportunityCount,
    getOpportunityById,
    getOpportunitiesByStage,
    totalPipelineValue,
    averageProbability,
    
    // Actions - CRUD
    fetchOpportunities,
    fetchOpportunityById,
    createOpportunity,
    createBatchOpportunities,
    generateNamePreviews,
    updateOpportunity,
    updateOpportunityStage,
    deleteOpportunity,
    
    // Actions - Analytics
    fetchKPIs,
    fetchStageDistribution,
    
    // Actions - Utilities
    clearError,
    clearSelectedOpportunity,
    clearBatchResults,
    resetFilters,
    refresh
  }
})