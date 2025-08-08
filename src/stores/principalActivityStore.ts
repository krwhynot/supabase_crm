/**
 * =============================================================================
 * PRINCIPAL ACTIVITY STORE - COMPREHENSIVE STATE MANAGEMENT
 * =============================================================================
 * 
 * Complete Pinia store for Principal Activity Management with database view
 * integration, real-time analytics, relationship tracking, and comprehensive
 * state management optimized for Vue 3 Composition API.
 */

import { defineStore } from 'pinia'
import { ref, computed, reactive, watch } from 'vue'
import type {
  PrincipalActivitySummary,
  PrincipalDistributorRelationship,
  PrincipalProductPerformance,
  PrincipalTimelineEntry,
  PrincipalAnalytics,
  PrincipalDashboardData,
  PrincipalFilters,
  PrincipalSortConfig,
  PrincipalPagination,
  PrincipalListResponse,
  PrincipalSelectionItem,
  PrincipalMetricsSummary,
  PrincipalActivityStatus
} from '@/types/principal'
import {
  DEFAULT_PRINCIPAL_FILTERS,
  DEFAULT_PRINCIPAL_SORT
} from '@/types/principal'
// Removed unused Enums import
import { principalActivityApi } from '@/services/principalActivityApi'

/**
 * Store state interface for comprehensive type safety
 */
interface PrincipalActivityStoreState {
  // ============================
  // DATA COLLECTIONS
  // ============================
  
  /** All principal activity summaries */
  principals: PrincipalActivitySummary[]
  
  /** Selected principal for detailed view */
  selectedPrincipal: PrincipalActivitySummary | null
  
  /** Principal distributor relationships */
  distributorRelationships: PrincipalDistributorRelationship[]
  
  /** Principal product performance data */
  productPerformance: PrincipalProductPerformance[]
  
  /** Timeline entries for principals */
  timelineEntries: PrincipalTimelineEntry[]
  
  /** Complete dashboard data for selected principal */
  dashboardData: PrincipalDashboardData | null
  
  /** Principal selection options for forms */
  principalOptions: PrincipalSelectionItem[]
  
  // ============================
  // UI STATE MANAGEMENT
  // ============================
  
  /** General loading state */
  loading: boolean
  
  /** Dashboard data loading */
  loadingDashboard: boolean
  
  /** Timeline loading state */
  loadingTimeline: boolean
  
  /** Analytics calculation state */
  calculatingAnalytics: boolean
  
  /** Data refresh state */
  refreshing: boolean
  
  /** Batch operations state */
  processingBatch: boolean
  
  // ============================
  // ERROR HANDLING
  // ============================
  
  /** General error state */
  error: string | null
  
  /** Dashboard-specific errors */
  dashboardError: string | null
  
  /** Timeline-specific errors */
  timelineError: string | null
  
  /** Analytics calculation errors */
  analyticsError: string | null
  
  // ============================
  // SEARCH AND FILTERING
  // ============================
  
  /** Current search query */
  searchQuery: string
  
  /** Active filter criteria */
  activeFilters: PrincipalFilters
  
  /** Sort configuration */
  sortConfig: PrincipalSortConfig
  
  /** Pagination state */
  pagination: PrincipalPagination
  
  // ============================
  // ANALYTICS AND METRICS
  // ============================
  
  /** Complete analytics data */
  analytics: PrincipalAnalytics | null
  
  /** Quick metrics summary */
  metricsSummary: PrincipalMetricsSummary | null
  
  /** Real-time metric updates */
  realTimeMetrics: {
    last_updated: Date | null
    update_frequency: number
    auto_refresh: boolean
  }
  
  // ============================
  // MULTI-SELECTION STATE
  // ============================
  
  /** Selected principal IDs - now handled by separate ref */
  // selectedPrincipalIds: string[] // Moved to separate ref for test compatibility
  
  /** Batch operation mode */
  batchMode: boolean
  
  /** Maximum selections allowed */
  maxSelections: number | null
  
  // ============================
  // CACHE MANAGEMENT
  // ============================
  
  /** Last data fetch timestamp */
  lastFetched: Date | null
  
  /** Cache duration in milliseconds */
  cacheDuration: number
  
  /** Data freshness status */
  dataStale: boolean
}

export const usePrincipalActivityStore = defineStore('principalActivity', () => {
  
  // ============================
  // STATE INITIALIZATION
  // ============================
  
  // Create separate refs for test compatibility - selectedPrincipalIds, batchMode, maxSelections
  const selectedPrincipalIdsRef = ref<string[]>([])
  const batchModeRef = ref<boolean>(false)
  const maxSelectionsRef = ref<number | null>(null)
  
  // Create separate refs for error states to handle test compatibility
  const errorRef = ref<string | null>(null)
  const dashboardErrorRef = ref<string | null>(null)
  const timelineErrorRef = ref<string | null>(null)
  const analyticsErrorRef = ref<string | null>(null)
  
  // Create separate refs for other state properties that need test compatibility
  const searchQueryRef = ref<string>('')
  const lastFetchedRef = ref<Date | null>(null)
  
  // Create computed for selectedPrincipalIds that handles both getter and setter
  const selectedPrincipalIdsComputed = computed({
    get: () => {
      return selectedPrincipalIdsRef.value
    },
    set: (value: string[]) => {
      selectedPrincipalIdsRef.value = [...value]
    }
  })

  // Create computed for batchMode that handles both getter and setter
  const batchModeComputed = computed({
    get: () => {
      return batchModeRef.value
    },
    set: (value: boolean) => {
      batchModeRef.value = value
    }
  })

  // Create computed for maxSelections that handles both getter and setter
  const maxSelectionsComputed = computed({
    get: () => {
      return maxSelectionsRef.value
    },
    set: (value: number | null) => {
      maxSelectionsRef.value = value
    }
  })

  // Create computed for error that handles both getter and setter
  const errorComputed = computed({
    get: () => {
      return errorRef.value
    },
    set: (value: string | null) => {
      errorRef.value = value
    }
  })

  // Create computed for dashboardError that handles both getter and setter
  const dashboardErrorComputed = computed({
    get: () => {
      return dashboardErrorRef.value
    },
    set: (value: string | null) => {
      dashboardErrorRef.value = value
    }
  })

  // Create computed for timelineError that handles both getter and setter
  const timelineErrorComputed = computed({
    get: () => {
      return timelineErrorRef.value
    },
    set: (value: string | null) => {
      timelineErrorRef.value = value
    }
  })

  // Create computed for analyticsError that handles both getter and setter
  const analyticsErrorComputed = computed({
    get: () => {
      return analyticsErrorRef.value
    },
    set: (value: string | null) => {
      analyticsErrorRef.value = value
    }
  })

  // Create computed for searchQuery that handles both getter and setter
  const searchQueryComputed = computed({
    get: () => {
      return searchQueryRef.value
    },
    set: (value: string) => {
      searchQueryRef.value = value
      state.searchQuery = value // Keep state in sync
    }
  })

  // Create computed for lastFetched that handles both getter and setter
  const lastFetchedComputed = computed({
    get: () => {
      return lastFetchedRef.value || state.lastFetched
    },
    set: (value: Date | null) => {
      lastFetchedRef.value = value
      state.lastFetched = value // Keep state in sync
    }
  })

  // Create computed for principals to ensure test compatibility
  const principalsComputed = computed(() => {
    return state.principals
  })

  // Create computed for metricsSummary to ensure test compatibility
  const metricsSummaryComputed = computed(() => {
    return state.metricsSummary
  })

  // Create computed for other core state properties to ensure test compatibility
  const selectedPrincipalComputed = computed(() => {
    return state.selectedPrincipal
  })

  const dashboardDataComputed = computed(() => {
    return state.dashboardData
  })

  const analyticsComputed = computed({
    get: () => {
      return state.analytics
    },
    set: (value: PrincipalAnalytics | null) => {
      state.analytics = value
    }
  })

  // Create computed for activeFilters to ensure test compatibility
  const activeFiltersComputed = computed({
    get: () => {
      return state.activeFilters
    },
    set: (value: PrincipalFilters) => {
      state.activeFilters = value
    }
  })

  // Create computed for principalOptions to ensure test compatibility
  const principalOptionsComputed = computed(() => {
    return state.principalOptions
  })

  // Create computed for loading state to ensure test compatibility
  const loadingComputed = computed({
    get: () => {
      return state.loading
    },
    set: (value: boolean) => {
      state.loading = value
    }
  })

  // Create computed for dataStale to ensure test compatibility
  const dataStaleComputed = computed(() => {
    return state.dataStale
  })

  // Create ref for pagination to ensure test compatibility
  const paginationRef = ref<PrincipalPagination>({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0,
    has_next: false,
    has_previous: false
  })

  // Create computed for pagination that handles both getter and setter
  const paginationComputed = computed({
    get: () => {
      return paginationRef.value || state.pagination
    },
    set: (value: PrincipalPagination) => {
      paginationRef.value = { ...value }
      state.pagination = { ...value } // Keep state in sync
    }
  })

  const state = reactive<PrincipalActivityStoreState>({
    // Data collections
    principals: [],
    selectedPrincipal: null,
    distributorRelationships: [],
    productPerformance: [],
    timelineEntries: [],
    dashboardData: null,
    principalOptions: [],
    
    // UI state
    loading: false,
    loadingDashboard: false,
    loadingTimeline: false,
    calculatingAnalytics: false,
    refreshing: false,
    processingBatch: false,
    
    // Error handling
    error: null,
    dashboardError: null,
    timelineError: null,
    analyticsError: null,
    
    // Search and filtering - searchQuery handled by separate ref for test compatibility
    searchQuery: '', // This will be kept in sync with searchQueryRef
    activeFilters: { ...DEFAULT_PRINCIPAL_FILTERS },
    sortConfig: { ...DEFAULT_PRINCIPAL_SORT },
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      total_pages: 0,
      has_next: false,
      has_previous: false
    },
    
    // Analytics
    analytics: null,
    metricsSummary: null,
    realTimeMetrics: {
      last_updated: null,
      update_frequency: 30000, // 30 seconds
      auto_refresh: true
    },
    
    // Multi-selection state
    batchMode: false,
    maxSelections: null,
    
    // Cache management
    lastFetched: null,
    cacheDuration: 300000, // 5 minutes
    dataStale: false
  })

  // Real-time update timer
  let realTimeTimer: NodeJS.Timeout | null = null

  // ============================
  // COMPUTED PROPERTIES
  // ============================
  
  const isLoading = computed(() => 
    state.loading || 
    state.loadingDashboard || 
    state.loadingTimeline || 
    state.calculatingAnalytics ||
    state.refreshing ||
    state.processingBatch
  )
  
  const hasError = computed(() => 
    !!(errorRef.value || dashboardErrorRef.value || timelineErrorRef.value || analyticsErrorRef.value)
  )
  
  const allErrors = computed(() => 
    [errorRef.value, dashboardErrorRef.value, timelineErrorRef.value, analyticsErrorRef.value]
      .filter(Boolean)
      .join('; ')
  )
  
  const principalCount = computed(() => state.principals.length)
  
  const activePrincipalCount = computed(() => 
    state.principals.filter(p => p.activity_status === 'ACTIVE').length
  )
  
  const hasActiveFilters = computed(() => {
    const filters = activeFiltersComputed.value
    return !!(
      filters.search ||
      filters.activity_status?.length ||
      filters.organization_status?.length ||
      filters.organization_type?.length ||
      filters.product_categories?.length ||
      (filters.has_opportunities !== undefined && filters.has_opportunities !== null) ||
      (filters.has_products !== undefined && filters.has_products !== null) ||
      filters.engagement_score_range ||
      filters.lead_score_range ||
      filters.country?.length ||
      (filters.is_principal !== undefined && filters.is_principal !== null) ||
      (filters.is_distributor !== undefined && filters.is_distributor !== null) ||
      filters.created_after ||
      filters.created_before
    )
  })
  
  const selectionCount = computed(() => selectedPrincipalIdsRef.value.length)
  
  const isMaxSelectionsReached = computed(() => 
    maxSelectionsRef.value ? selectedPrincipalIdsRef.value.length >= maxSelectionsRef.value : false
  )
  
  const getPrincipalById = computed(() => (id: string) => 
    state.principals.find(p => p.principal_id === id)
  )
  
  const getSelectedPrincipals = computed(() => 
    state.principals.filter(p => selectedPrincipalIdsRef.value.includes(p.principal_id))
  )
  
  const principalsByActivityStatus = computed(() => {
    const statusMap = new Map<PrincipalActivityStatus, PrincipalActivitySummary[]>()
    
    state.principals.forEach(principal => {
      const status = principal.activity_status
      if (!statusMap.has(status)) {
        statusMap.set(status, [])
      }
      statusMap.get(status)!.push(principal)
    })
    
    return statusMap
  })
  
  const principalsByOrganizationType = computed(() => {
    const typeMap = new Map<string, PrincipalActivitySummary[]>()
    
    state.principals.forEach(principal => {
      const type = principal.organization_type || 'Unknown'
      if (!typeMap.has(type)) {
        typeMap.set(type, [])
      }
      typeMap.get(type)!.push(principal)
    })
    
    return typeMap
  })
  
  const topPerformingPrincipals = computed(() => 
    [...state.principals]
      .sort((a, b) => b.engagement_score - a.engagement_score)
      .slice(0, 10)
  )
  
  const principalsRequiringFollowUp = computed(() => 
    state.principals.filter(p => p.follow_ups_required > 0)
  )
  
  const isDataStale = computed(() => {
    if (!state.lastFetched) return true
    const timeDiff = Date.now() - state.lastFetched.getTime()
    return timeDiff > state.cacheDuration
  })

  // ============================
  // ACTIONS - DATA FETCHING
  // ============================
  
  /**
   * Fetch all principal activity summaries
   */
  const fetchPrincipals = async (
    filters: Partial<PrincipalFilters> = {},
    sort: Partial<PrincipalSortConfig> = {},
    pagination: { page?: number; limit?: number } = {}
  ): Promise<void> => {
    state.loading = true
    errorRef.value = null
    
    try {
      // Merge with current state
      const mergedFilters = { ...state.activeFilters, ...filters }
      const mergedSort = { ...state.sortConfig, ...sort }
      const currentPagination = {
        page: pagination.page || state.pagination.page,
        limit: pagination.limit || state.pagination.limit
      }
      
      const response = await principalActivityApi.getPrincipalSummaries(
        mergedFilters,
        mergedSort,
        currentPagination
      )
      
      if (response.success && response.data) {
        const listResponse = response.data as PrincipalListResponse
        
        console.log('DEBUG: fetchPrincipals response =', response)
        console.log('DEBUG: listResponse =', listResponse)
        console.log('DEBUG: listResponse.data =', listResponse.data)
        
        state.principals = listResponse.data
        state.pagination = listResponse.pagination
        paginationRef.value = { ...listResponse.pagination } // Update pagination ref for test compatibility
        state.activeFilters = listResponse.filters
        state.sortConfig = listResponse.sort
        
        // Update analytics summary
        if (listResponse.analytics_summary) {
          state.metricsSummary = {
            total_principals: listResponse.analytics_summary.total_count,
            active_this_month: listResponse.analytics_summary.active_count,
            top_engagement_score: Math.max(...listResponse.data.map(p => p.engagement_score)),
            opportunities_created_this_month: listResponse.data.reduce((sum, p) => sum + p.opportunities_last_30_days, 0),
            interactions_this_week: Math.floor(listResponse.data.reduce((sum, p) => sum + p.interactions_last_30_days, 0) / 4),
            pending_follow_ups: listResponse.data.reduce((sum, p) => sum + p.follow_ups_required, 0)
          }
        }
        
        // Update both refs to ensure test compatibility
        const now = new Date()
        lastFetchedRef.value = now
        state.lastFetched = now
        state.dataStale = false
      } else {
        errorRef.value = response.error || 'Failed to fetch principals'
      }
    } catch (error) {
      errorRef.value = error instanceof Error ? error.message : 'Unexpected error occurred'
      console.error('Principal fetch error:', error)
    } finally {
      state.loading = false
    }
  }
  
  /**
   * Fetch comprehensive dashboard data for a specific principal
   */
  const fetchPrincipalDashboard = async (principalId: string): Promise<void> => {
    state.loadingDashboard = true
    dashboardErrorRef.value = null
    
    try {
      const response = await principalActivityApi.getPrincipalDashboard(principalId)
      
      if (response.success && response.data) {
        state.dashboardData = response.data as PrincipalDashboardData
        state.selectedPrincipal = state.dashboardData.summary
      } else {
        dashboardErrorRef.value = response.error || 'Failed to fetch principal dashboard'
      }
    } catch (error) {
      dashboardErrorRef.value = error instanceof Error ? error.message : 'Dashboard fetch failed'
      console.error('Dashboard fetch error:', error)
    } finally {
      state.loadingDashboard = false
    }
  }
  
  /**
   * Fetch timeline entries for specific principals
   */
  const fetchPrincipalTimeline = async (
    principalIds: string[],
    limit = 50
  ): Promise<void> => {
    state.loadingTimeline = true
    timelineErrorRef.value = null
    
    try {
      const response = await principalActivityApi.getPrincipalTimeline(principalIds, limit)
      
      if (response.success && response.data) {
        state.timelineEntries = response.data as PrincipalTimelineEntry[]
      } else {
        timelineErrorRef.value = response.error || 'Failed to fetch timeline'
      }
    } catch (error) {
      timelineErrorRef.value = error instanceof Error ? error.message : 'Timeline fetch failed'
      console.error('Timeline fetch error:', error)
    } finally {
      state.loadingTimeline = false
    }
  }
  
  /**
   * Fetch distributor relationships
   */
  const fetchDistributorRelationships = async (): Promise<void> => {
    state.loading = true
    errorRef.value = null
    
    try {
      const response = await principalActivityApi.getDistributorRelationships()
      
      if (response.success && response.data) {
        state.distributorRelationships = response.data as PrincipalDistributorRelationship[]
      } else {
        errorRef.value = response.error || 'Failed to fetch distributor relationships'
      }
    } catch (error) {
      errorRef.value = error instanceof Error ? error.message : 'Failed to fetch relationships'
      console.error('Distributor relationships fetch error:', error)
    } finally {
      state.loading = false
    }
  }
  
  /**
   * Fetch product performance data
   */
  const fetchProductPerformance = async (principalIds?: string[]): Promise<void> => {
    state.loading = true
    errorRef.value = null
    
    try {
      const response = await principalActivityApi.getProductPerformance(principalIds)
      
      if (response.success && response.data) {
        state.productPerformance = response.data as PrincipalProductPerformance[]
      } else {
        errorRef.value = response.error || 'Failed to fetch product performance'
      }
    } catch (error) {
      errorRef.value = error instanceof Error ? error.message : 'Product performance fetch failed'
      console.error('Product performance fetch error:', error)
    } finally {
      state.loading = false
    }
  }

  // ============================
  // ACTIONS - ANALYTICS
  // ============================
  
  /**
   * Calculate comprehensive analytics
   */
  const calculateAnalytics = async (forceRefresh = false): Promise<void> => {
    // Skip if analytics are fresh and not forcing refresh
    if (state.analytics && !forceRefresh && state.realTimeMetrics.last_updated) {
      const timeSinceUpdate = Date.now() - state.realTimeMetrics.last_updated.getTime()
      if (timeSinceUpdate < state.realTimeMetrics.update_frequency) {
        return
      }
    }
    
    state.calculatingAnalytics = true
    analyticsErrorRef.value = null
    
    try {
      const response = await principalActivityApi.calculateAnalytics(state.principals)
      
      if (response.success && response.data) {
        state.analytics = response.data as PrincipalAnalytics
        state.realTimeMetrics.last_updated = new Date()
      } else {
        analyticsErrorRef.value = response.error || 'Analytics calculation failed'
      }
    } catch (error) {
      analyticsErrorRef.value = error instanceof Error ? error.message : 'Analytics calculation error'
      console.error('Analytics calculation error:', error)
    } finally {
      state.calculatingAnalytics = false
    }
  }
  
  /**
   * Refresh metrics summary
   */
  const refreshMetrics = async (): Promise<void> => {
    if (state.principals.length === 0) {
      await fetchPrincipals()
    } else {
      await calculateAnalytics(true)
    }
  }

  // ============================
  // ACTIONS - SEARCH AND FILTERING
  // ============================
  
  /**
   * Search principals with query and filters
   */
  const searchPrincipals = async (
    query: string,
    filters: Partial<PrincipalFilters> = {}
  ): Promise<void> => {
    // Update both refs to ensure test compatibility
    searchQueryRef.value = query
    state.searchQuery = query
    const searchFilters = { ...filters, search: query }
    await fetchPrincipals(searchFilters, {}, { page: 1 })
  }
  
  /**
   * Update active filters
   */
  const updateFilters = async (newFilters: Partial<PrincipalFilters>): Promise<void> => {
    const mergedFilters = { ...state.activeFilters, ...newFilters }
    await fetchPrincipals(mergedFilters, {}, { page: 1 })
  }
  
  /**
   * Clear all filters
   */
  const clearFilters = async (): Promise<void> => {
    // Clear both refs to ensure test compatibility
    searchQueryRef.value = ''
    state.searchQuery = ''
    await fetchPrincipals(DEFAULT_PRINCIPAL_FILTERS, {}, { page: 1 })
  }
  
  /**
   * Update sort configuration
   */
  const updateSort = async (newSort: Partial<PrincipalSortConfig>): Promise<void> => {
    const mergedSort = { ...state.sortConfig, ...newSort }
    await fetchPrincipals({}, mergedSort, { page: 1 })
  }

  // ============================
  // ACTIONS - PAGINATION
  // ============================
  
  /**
   * Navigate to specific page
   */
  const goToPage = async (page: number): Promise<void> => {
    const currentPagination = paginationRef.value || state.pagination
    if (page < 1 || page > currentPagination.total_pages) return
    await fetchPrincipals({}, {}, { page })
  }
  
  /**
   * Go to next page
   */
  const nextPage = async (): Promise<void> => {
    const currentPagination = paginationRef.value || state.pagination
    if (currentPagination.has_next) {
      await goToPage(currentPagination.page + 1)
    }
  }
  
  /**
   * Go to previous page
   */
  const previousPage = async (): Promise<void> => {
    const currentPagination = paginationRef.value || state.pagination
    if (currentPagination.has_previous) {
      await goToPage(currentPagination.page - 1)
    }
  }
  
  /**
   * Update page size
   */
  const updatePageSize = async (size: number): Promise<void> => {
    await fetchPrincipals({}, {}, { page: 1, limit: size })
  }

  // ============================
  // ACTIONS - SELECTION MANAGEMENT
  // ============================
  
  /**
   * Toggle selection of a principal
   */
  const toggleSelection = (principalId: string): void => {
    const currentIds = selectedPrincipalIdsRef.value
    const index = currentIds.indexOf(principalId)
    
    if (index > -1) {
      selectedPrincipalIdsRef.value = currentIds.filter((_, i) => i !== index)
    } else {
      if (!maxSelectionsRef.value || currentIds.length < maxSelectionsRef.value) {
        selectedPrincipalIdsRef.value = [...currentIds, principalId]
      }
    }
  }
  
  /**
   * Select specific principals
   */
  const selectPrincipals = (principalIds: string[]): void => {
    const limitedIds = maxSelectionsRef.value 
      ? principalIds.slice(0, maxSelectionsRef.value)
      : principalIds
    
    // Set the array directly for consistency
    selectedPrincipalIdsRef.value = [...limitedIds]
  }
  
  /**
   * Clear all selections
   */
  const clearSelections = (): void => {
    // Reset to empty array to ensure clearing works regardless of how array was set
    selectedPrincipalIdsRef.value = []
  }
  
  /**
   * Select all visible principals
   */
  const selectAll = (): void => {
    const allIds = state.principals.map(p => p.principal_id)
    selectPrincipals(allIds)
  }
  
  /**
   * Check if principal is selected
   */
  const isSelected = (principalId: string): boolean => {
    return selectedPrincipalIdsRef.value.includes(principalId)
  }
  
  /**
   * Enable/disable batch mode
   */
  const setBatchMode = (enabled: boolean, maxSelections?: number): void => {
    batchModeRef.value = enabled
    maxSelectionsRef.value = maxSelections || null
    
    if (!enabled) {
      clearSelections()
    }
  }

  // ============================
  // ACTIONS - BATCH OPERATIONS
  // ============================
  
  /**
   * Batch update selected principals
   */
  const batchUpdatePrincipals = async (
    updates: Partial<PrincipalActivitySummary>
  ): Promise<boolean> => {
    console.log('DEBUG: batchUpdatePrincipals called, selectedIds =', selectedPrincipalIdsRef.value)
    if (selectedPrincipalIdsRef.value.length === 0) return false
    
    state.processingBatch = true
    errorRef.value = null
    
    try {
      const response = await principalActivityApi.batchUpdatePrincipals(
        selectedPrincipalIdsRef.value,
        updates
      )
      
      console.log('DEBUG: API response =', response)
      
      if (response.success) {
        // Refresh data to reflect changes
        await fetchPrincipals()
        clearSelections()
        return true
      } else {
        console.log('DEBUG: Setting error =', response.error)
        errorRef.value = response.error || 'Batch update failed'
        console.log('DEBUG: state.error after setting =', state.error)
        return false
      }
    } catch (error) {
      errorRef.value = error instanceof Error ? error.message : 'Batch update failed'
      return false
    } finally {
      state.processingBatch = false
    }
  }
  
  /**
   * Export selected principals
   */
  const exportSelectedPrincipals = (format: 'csv' | 'json' = 'csv'): string => {
    const selectedPrincipals = getSelectedPrincipals.value
    
    if (format === 'json') {
      return JSON.stringify(selectedPrincipals, null, 2)
    }
    
    // CSV export
    const headers = [
      'Principal Name',
      'Organization Type',
      'Activity Status',
      'Engagement Score',
      'Total Interactions',
      'Total Opportunities',
      'Last Activity Date'
    ]
    
    const rows = selectedPrincipals.map(p => [
      p.principal_name,
      p.organization_type || '',
      p.activity_status,
      p.engagement_score.toString(),
      p.total_interactions.toString(),
      p.total_opportunities.toString(),
      p.last_activity_date || ''
    ])
    
    let csv = headers.join(',') + '\n'
    csv += rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    
    return csv
  }

  // ============================
  // ACTIONS - UTILITIES
  // ============================
  
  /**
   * Refresh all data
   */
  const refreshAll = async (): Promise<void> => {
    state.refreshing = true
    
    try {
      await Promise.all([
        fetchPrincipals(),
        fetchDistributorRelationships(),
        fetchProductPerformance()
      ])
      
      if (state.principals.length > 0) {
        await calculateAnalytics(true)
      }
    } catch (error) {
      errorRef.value = error instanceof Error ? error.message : 'Refresh failed'
    } finally {
      state.refreshing = false
    }
  }
  
  /**
   * Clear all errors
   */
  const clearErrors = (): void => {
    errorRef.value = null
    dashboardErrorRef.value = null
    timelineErrorRef.value = null
    analyticsErrorRef.value = null
  }
  
  /**
   * Set selected principal
   */
  const selectPrincipal = (principal: PrincipalActivitySummary): void => {
    state.selectedPrincipal = { ...principal }
  }
  
  /**
   * Clear selected principal
   */
  const clearSelectedPrincipal = (): void => {
    state.selectedPrincipal = null
    state.dashboardData = null
  }
  
  /**
   * Load activity summaries - Main method for component compatibility
   */
  const loadActivitySummaries = async (
    filters: Partial<PrincipalFilters> = {},
    forceRefresh = false
  ): Promise<void> => {
    // Clear cache if force refresh requested
    if (forceRefresh) {
      state.lastFetched = null
    }
    
    // Use existing fetchPrincipals method with proper error handling
    await fetchPrincipals(filters)
    
    // Calculate analytics after loading principals
    if (state.principals.length > 0) {
      await calculateAnalytics()
    }
  }
  
  /**
   * Get principal options for forms
   */
  const getPrincipalOptions = async (organizationId?: string): Promise<PrincipalSelectionItem[]> => {
    try {
      const response = await principalActivityApi.getPrincipalOptions(organizationId)
      
      if (response.success && response.data) {
        state.principalOptions = response.data as PrincipalSelectionItem[]
        return state.principalOptions
      } else {
        errorRef.value = response.error || 'Failed to fetch principal options'
        return []
      }
    } catch (error) {
      errorRef.value = error instanceof Error ? error.message : 'Failed to fetch options'
      return []
    }
  }

  /**
   * Load engagement breakdown data for dashboard charts
   */
  const loadEngagementBreakdown = async (principalId?: string): Promise<void> => {
    state.calculatingAnalytics = true
    analyticsErrorRef.value = null
    
    try {
      // If no specific principal ID, calculate for all principals
      const targetPrincipals = principalId 
        ? state.principals.filter(p => p.principal_id === principalId)
        : state.principals
        
      if (targetPrincipals.length === 0) {
        analyticsErrorRef.value = 'No principal data available for engagement breakdown'
        return
      }

      // Calculate engagement breakdown from existing principal data
      const engagementBreakdown = {
        high_engagement: targetPrincipals.filter(p => p.engagement_score >= 80).length,
        medium_engagement: targetPrincipals.filter(p => p.engagement_score >= 50 && p.engagement_score < 80).length,
        low_engagement: targetPrincipals.filter(p => p.engagement_score < 50).length,
        total_interactions: targetPrincipals.reduce((sum, p) => sum + p.total_interactions, 0),
        avg_engagement_score: targetPrincipals.reduce((sum, p) => sum + p.engagement_score, 0) / targetPrincipals.length,
        active_principals: targetPrincipals.filter(p => p.activity_status === 'ACTIVE').length,
        principals_with_recent_activity: targetPrincipals.filter(p => {
          if (!p.last_activity_date) return false
          const lastActivity = new Date(p.last_activity_date)
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          return lastActivity > thirtyDaysAgo
        }).length
      }

      // Update analytics with engagement breakdown
      state.analytics = {
        ...state.analytics,
        engagement_breakdown: engagementBreakdown,
        total_principals: targetPrincipals.length,
        last_updated: new Date().toISOString()
      } as PrincipalAnalytics
      
      state.realTimeMetrics.last_updated = new Date()
    } catch (error) {
      analyticsErrorRef.value = error instanceof Error ? error.message : 'Failed to load engagement breakdown'
      console.error('Engagement breakdown calculation error:', error)
    } finally {
      state.calculatingAnalytics = false
    }
  }

  /**
   * Load principal statistics for dashboard KPIs
   */
  const loadPrincipalStats = async (principalId?: string): Promise<void> => {
    state.calculatingAnalytics = true
    analyticsErrorRef.value = null
    
    try {
      // If no specific principal ID, calculate for all principals
      const targetPrincipals = principalId 
        ? state.principals.filter(p => p.principal_id === principalId)
        : state.principals
        
      if (targetPrincipals.length === 0) {
        analyticsErrorRef.value = 'No principal data available for statistics'
        return
      }

      // Calculate comprehensive principal statistics
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      
      const stats = {
        total_principals: targetPrincipals.length,
        active_principals: targetPrincipals.filter(p => p.activity_status === 'ACTIVE').length,
        inactive_principals: targetPrincipals.filter(p => p.activity_status === ('INACTIVE' as any)).length,
        high_value_principals: targetPrincipals.filter(p => p.engagement_score >= 80).length,
        avg_engagement_score: Math.round(
          targetPrincipals.reduce((sum, p) => sum + p.engagement_score, 0) / targetPrincipals.length * 100
        ) / 100,
        total_interactions: targetPrincipals.reduce((sum, p) => sum + p.total_interactions, 0),
        interactions_last_30_days: targetPrincipals.reduce((sum, p) => sum + p.interactions_last_30_days, 0),
        interactions_last_90_days: targetPrincipals.reduce((sum, p) => sum + p.interactions_last_90_days, 0),
        total_opportunities: targetPrincipals.reduce((sum, p) => sum + p.total_opportunities, 0),
        active_opportunities: targetPrincipals.reduce((sum, p) => sum + p.active_opportunities, 0),
        won_opportunities: targetPrincipals.reduce((sum, p) => sum + p.won_opportunities, 0),
        opportunities_last_30_days: targetPrincipals.reduce((sum, p) => sum + p.opportunities_last_30_days, 0),
        avg_probability_percent: Math.round(
          targetPrincipals.reduce((sum, p) => sum + (p.avg_probability_percent || 0), 0) / targetPrincipals.length * 100
        ) / 100,
        total_contacts: targetPrincipals.reduce((sum, p) => sum + p.contact_count, 0),
        active_contacts: targetPrincipals.reduce((sum, p) => sum + p.active_contacts, 0),
        follow_ups_required: targetPrincipals.reduce((sum, p) => sum + p.follow_ups_required, 0),
        principals_by_type: targetPrincipals.reduce((acc, p) => {
          const type = p.organization_type || 'Unknown'
          acc[type] = (acc[type] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        principals_by_industry: targetPrincipals.reduce((acc, p) => {
          const industry = p.industry || 'Unknown'
          acc[industry] = (acc[industry] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        top_performing_principals: targetPrincipals
          .sort((a, b) => b.engagement_score - a.engagement_score)
          .slice(0, 5)
          .map(p => ({
            principal_id: p.principal_id,
            principal_name: p.principal_name,
            engagement_score: p.engagement_score,
            total_opportunities: p.total_opportunities,
            total_interactions: p.total_interactions
          })),
        recent_activity_trend: {
          last_30_days: targetPrincipals.filter(p => {
            if (!p.last_activity_date) return false
            return new Date(p.last_activity_date) > thirtyDaysAgo
          }).length,
          last_90_days: targetPrincipals.filter(p => {
            if (!p.last_activity_date) return false
            return new Date(p.last_activity_date) > ninetyDaysAgo
          }).length
        }
      }

      // Update metrics summary with calculated stats
      state.metricsSummary = {
        total_principals: stats.total_principals,
        active_this_month: stats.recent_activity_trend.last_30_days,
        top_engagement_score: Math.max(...targetPrincipals.map(p => p.engagement_score)),
        opportunities_created_this_month: stats.opportunities_last_30_days,
        interactions_this_week: Math.floor(stats.interactions_last_30_days / 4),
        pending_follow_ups: stats.follow_ups_required
      }

      // Update analytics with comprehensive stats
      state.analytics = {
        ...state.analytics,
        principal_stats: stats,
        total_principals: stats.total_principals,
        active_principals: stats.active_principals,
        avg_engagement_score: stats.avg_engagement_score,
        total_interactions: stats.total_interactions,
        total_opportunities: stats.total_opportunities,
        last_updated: new Date().toISOString()
      } as PrincipalAnalytics
      
      state.realTimeMetrics.last_updated = new Date()
    } catch (error) {
      analyticsErrorRef.value = error instanceof Error ? error.message : 'Failed to load principal statistics'
      console.error('Principal statistics calculation error:', error)
    } finally {
      state.calculatingAnalytics = false
    }
  }

  // ============================
  // REAL-TIME UPDATES
  // ============================
  
  /**
   * Start real-time metric updates
   */
  const startRealTimeUpdates = (): void => {
    if (realTimeTimer) return
    
    // Enable auto-refresh when starting updates
    state.realTimeMetrics.auto_refresh = true
    
    console.log('DEBUG: Starting real-time timer with frequency:', state.realTimeMetrics.update_frequency)
    realTimeTimer = setInterval(() => {
      console.log('DEBUG: Timer callback executed, checking conditions:', {
        auto_refresh: state.realTimeMetrics.auto_refresh,
        isLoading: isLoading.value
      })
      
      if (state.realTimeMetrics.auto_refresh && !isLoading.value) {
        console.log('DEBUG: Calling calculateAnalytics from timer')
        // Use non-async call to avoid timer issues in tests
        calculateAnalytics(true).catch(err => {
          console.error('Real-time analytics update failed:', err)
        })
      } else {
        console.log('Real-time update skipped:', {
          auto_refresh: state.realTimeMetrics.auto_refresh,
          isLoading: isLoading.value
        })
      }
    }, state.realTimeMetrics.update_frequency)
    
    console.log('DEBUG: Timer created with ID:', realTimeTimer)
  }
  
  /**
   * Stop real-time updates
   */
  const stopRealTimeUpdates = (): void => {
    if (realTimeTimer) {
      clearInterval(realTimeTimer)
      realTimeTimer = null
    }
    // Disable auto-refresh when stopping updates
    state.realTimeMetrics.auto_refresh = false
  }
  
  /**
   * Configure real-time updates
   */
  const configureRealTimeUpdates = (
    enabled: boolean,
    frequency?: number
  ): void => {
    state.realTimeMetrics.auto_refresh = enabled
    
    if (frequency) {
      state.realTimeMetrics.update_frequency = frequency
    }
    
    if (enabled) {
      startRealTimeUpdates()
    } else {
      stopRealTimeUpdates()
    }
  }

  // ============================
  // WATCHERS
  // ============================
  
  // Watch for data staleness
  watch(isDataStale, (stale) => {
    state.dataStale = stale
  }, { immediate: true })
  
  // Auto-start real-time updates if enabled
  if (state.realTimeMetrics.auto_refresh) {
    startRealTimeUpdates()
  }
  
  // Cleanup on unmount
  const cleanup = () => {
    stopRealTimeUpdates()
  }
  
  // Register cleanup
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', cleanup)
  }

  // ============================
  // RETURN STORE INTERFACE
  // ============================
  
  return {
    // Core data collections
    principals: principalsComputed,
    selectedPrincipal: selectedPrincipalComputed,
    distributorRelationships: state.distributorRelationships,
    productPerformance: state.productPerformance,
    timelineEntries: state.timelineEntries,
    dashboardData: dashboardDataComputed,
    principalOptions: principalOptionsComputed,
    
    // UI states
    loading: loadingComputed,
    loadingDashboard: state.loadingDashboard,
    loadingTimeline: state.loadingTimeline,
    calculatingAnalytics: state.calculatingAnalytics,
    refreshing: state.refreshing,
    processingBatch: state.processingBatch,
    
    // Error states - Use computed properties for test compatibility
    error: errorComputed,
    dashboardError: dashboardErrorComputed,
    timelineError: timelineErrorComputed,
    analyticsError: analyticsErrorComputed,
    
    // Search and filtering state - Use computed for test compatibility
    searchQuery: searchQueryComputed,
    activeFilters: activeFiltersComputed,
    sortConfig: state.sortConfig,
    pagination: paginationComputed,
    
    // Analytics state
    analytics: analyticsComputed,
    metricsSummary: metricsSummaryComputed,
    realTimeMetrics: state.realTimeMetrics,
    
    // Multi-selection state - Use computed properties for test compatibility
    selectedPrincipalIds: selectedPrincipalIdsComputed,
    batchMode: batchModeComputed,
    maxSelections: maxSelectionsComputed,
    
    // Cache state - Use computed for test compatibility
    lastFetched: lastFetchedComputed,
    cacheDuration: state.cacheDuration,
    dataStale: dataStaleComputed,
    
    // Computed properties
    isLoading,
    hasError,
    allErrors,
    principalCount,
    activePrincipalCount,
    hasActiveFilters,
    selectionCount,
    isMaxSelectionsReached,
    getPrincipalById,
    getSelectedPrincipals,
    principalsByActivityStatus,
    principalsByOrganizationType,
    topPerformingPrincipals,
    principalsRequiringFollowUp,
    isDataStale,
    
    // Data fetching actions
    fetchPrincipals,
    fetchPrincipalDashboard,
    fetchPrincipalTimeline,
    fetchDistributorRelationships,
    fetchProductPerformance,
    
    // Analytics actions
    calculateAnalytics,
    refreshMetrics,
    
    // Search and filtering actions
    searchPrincipals,
    updateFilters,
    clearFilters,
    updateSort,
    
    // Pagination actions
    goToPage,
    nextPage,
    previousPage,
    updatePageSize,
    
    // Selection management actions
    toggleSelection,
    selectPrincipals,
    clearSelections,
    selectAll,
    isSelected,
    setBatchMode,
    
    // Batch operations
    batchUpdatePrincipals,
    exportSelectedPrincipals,
    
    // Utility actions
    refreshAll,
    clearErrors,
    selectPrincipal,
    clearSelectedPrincipal,
    loadActivitySummaries,
    getPrincipalOptions,
    loadEngagementBreakdown,
    loadPrincipalStats,
    
    // Real-time updates
    startRealTimeUpdates,
    stopRealTimeUpdates,
    configureRealTimeUpdates,
    
    // Cleanup
    cleanup
  }
})

/**
 * Type-safe store access helper
 */
export type PrincipalActivityStore = ReturnType<typeof usePrincipalActivityStore>

/**
 * Store export for external integration
 */
export default usePrincipalActivityStore