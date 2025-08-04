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
  PrincipalActivityStatus,
  DEFAULT_PRINCIPAL_FILTERS,
  DEFAULT_PRINCIPAL_SORT
} from '@/types/principal'
import type { Enums } from '@/types/database.types'
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
  
  /** Selected principal IDs */
  selectedPrincipalIds: string[]
  
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
    
    // Search and filtering
    searchQuery: '',
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
    
    // Multi-selection
    selectedPrincipalIds: [],
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
    !!(state.error || state.dashboardError || state.timelineError || state.analyticsError)
  )
  
  const allErrors = computed(() => 
    [state.error, state.dashboardError, state.timelineError, state.analyticsError]
      .filter(Boolean)
      .join('; ')
  )
  
  const principalCount = computed(() => state.principals.length)
  
  const activePrincipalCount = computed(() => 
    state.principals.filter(p => p.activity_status === 'ACTIVE').length
  )
  
  const hasActiveFilters = computed(() => {
    const filters = state.activeFilters
    return !!(
      filters.search ||
      filters.activity_status?.length ||
      filters.organization_status?.length ||
      filters.organization_type?.length ||
      filters.product_categories?.length ||
      filters.has_opportunities !== null ||
      filters.has_products !== null ||
      filters.engagement_score_range ||
      filters.lead_score_range ||
      filters.country?.length ||
      filters.is_principal !== null ||
      filters.is_distributor !== null ||
      filters.created_after ||
      filters.created_before
    )
  })
  
  const selectionCount = computed(() => state.selectedPrincipalIds.length)
  
  const isMaxSelectionsReached = computed(() => 
    state.maxSelections ? state.selectedPrincipalIds.length >= state.maxSelections : false
  )
  
  const getPrincipalById = computed(() => (id: string) => 
    state.principals.find(p => p.principal_id === id)
  )
  
  const getSelectedPrincipals = computed(() => 
    state.principals.filter(p => state.selectedPrincipalIds.includes(p.principal_id))
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
    return Date.now() - state.lastFetched.getTime() > state.cacheDuration
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
    state.error = null
    
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
        
        state.principals = listResponse.data
        state.pagination = listResponse.pagination
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
        
        state.lastFetched = new Date()
        state.dataStale = false
      } else {
        state.error = response.error || 'Failed to fetch principals'
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
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
    state.dashboardError = null
    
    try {
      const response = await principalActivityApi.getPrincipalDashboard(principalId)
      
      if (response.success && response.data) {
        state.dashboardData = response.data as PrincipalDashboardData
        state.selectedPrincipal = state.dashboardData.summary
      } else {
        state.dashboardError = response.error || 'Failed to fetch principal dashboard'
      }
    } catch (error) {
      state.dashboardError = error instanceof Error ? error.message : 'Dashboard fetch failed'
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
    state.timelineError = null
    
    try {
      const response = await principalActivityApi.getPrincipalTimeline(principalIds, limit)
      
      if (response.success && response.data) {
        state.timelineEntries = response.data as PrincipalTimelineEntry[]
      } else {
        state.timelineError = response.error || 'Failed to fetch timeline'
      }
    } catch (error) {
      state.timelineError = error instanceof Error ? error.message : 'Timeline fetch failed'
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
    state.error = null
    
    try {
      const response = await principalActivityApi.getDistributorRelationships()
      
      if (response.success && response.data) {
        state.distributorRelationships = response.data as PrincipalDistributorRelationship[]
      } else {
        state.error = response.error || 'Failed to fetch distributor relationships'
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to fetch relationships'
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
    state.error = null
    
    try {
      const response = await principalActivityApi.getProductPerformance(principalIds)
      
      if (response.success && response.data) {
        state.productPerformance = response.data as PrincipalProductPerformance[]
      } else {
        state.error = response.error || 'Failed to fetch product performance'
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Product performance fetch failed'
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
    state.analyticsError = null
    
    try {
      const response = await principalActivityApi.calculateAnalytics(state.principals)
      
      if (response.success && response.data) {
        state.analytics = response.data as PrincipalAnalytics
        state.realTimeMetrics.last_updated = new Date()
      } else {
        state.analyticsError = response.error || 'Analytics calculation failed'
      }
    } catch (error) {
      state.analyticsError = error instanceof Error ? error.message : 'Analytics calculation error'
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
    if (page < 1 || page > state.pagination.total_pages) return
    await fetchPrincipals({}, {}, { page })
  }
  
  /**
   * Go to next page
   */
  const nextPage = async (): Promise<void> => {
    if (state.pagination.has_next) {
      await goToPage(state.pagination.page + 1)
    }
  }
  
  /**
   * Go to previous page
   */
  const previousPage = async (): Promise<void> => {
    if (state.pagination.has_previous) {
      await goToPage(state.pagination.page - 1)
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
    const index = state.selectedPrincipalIds.indexOf(principalId)
    
    if (index > -1) {
      state.selectedPrincipalIds.splice(index, 1)
    } else {
      if (!state.maxSelections || state.selectedPrincipalIds.length < state.maxSelections) {
        state.selectedPrincipalIds.push(principalId)
      }
    }
  }
  
  /**
   * Select specific principals
   */
  const selectPrincipals = (principalIds: string[]): void => {
    const limitedIds = state.maxSelections 
      ? principalIds.slice(0, state.maxSelections)
      : principalIds
    
    state.selectedPrincipalIds = [...limitedIds]
  }
  
  /**
   * Clear all selections
   */
  const clearSelections = (): void => {
    state.selectedPrincipalIds = []
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
    return state.selectedPrincipalIds.includes(principalId)
  }
  
  /**
   * Enable/disable batch mode
   */
  const setBatchMode = (enabled: boolean, maxSelections?: number): void => {
    state.batchMode = enabled
    state.maxSelections = maxSelections || null
    
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
    if (state.selectedPrincipalIds.length === 0) return false
    
    state.processingBatch = true
    state.error = null
    
    try {
      const response = await principalActivityApi.batchUpdatePrincipals(
        state.selectedPrincipalIds,
        updates
      )
      
      if (response.success) {
        // Refresh data to reflect changes
        await fetchPrincipals()
        clearSelections()
        return true
      } else {
        state.error = response.error || 'Batch update failed'
        return false
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Batch update failed'
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
      state.error = error instanceof Error ? error.message : 'Refresh failed'
    } finally {
      state.refreshing = false
    }
  }
  
  /**
   * Clear all errors
   */
  const clearErrors = (): void => {
    state.error = null
    state.dashboardError = null
    state.timelineError = null
    state.analyticsError = null
  }
  
  /**
   * Set selected principal
   */
  const selectPrincipal = (principal: PrincipalActivitySummary): void => {
    state.selectedPrincipal = principal
  }
  
  /**
   * Clear selected principal
   */
  const clearSelectedPrincipal = (): void => {
    state.selectedPrincipal = null
    state.dashboardData = null
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
        state.error = response.error || 'Failed to fetch principal options'
        return []
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to fetch options'
      return []
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
    
    realTimeTimer = setInterval(async () => {
      if (state.realTimeMetrics.auto_refresh && !isLoading.value) {
        await calculateAnalytics()
      }
    }, state.realTimeMetrics.update_frequency)
  }
  
  /**
   * Stop real-time updates
   */
  const stopRealTimeUpdates = (): void => {
    if (realTimeTimer) {
      clearInterval(realTimeTimer)
      realTimeTimer = null
    }
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
  })
  
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
    // Reactive state (read-only access)
    ...state,
    
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
    getPrincipalOptions,
    
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