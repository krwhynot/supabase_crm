import { ref, computed, watch, type Ref } from 'vue'
// Native debounce implementation to replace lodash-es dependency
function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>): void => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}
import type { 
  PrincipalFilters, 
  PrincipalSortConfig, 
  PrincipalActivityStatus,
  PrincipalActivitySummary,
  PrincipalFilterFormData,
  PrincipalSelectionItem
} from '@/types/principal'
import { DEFAULT_PRINCIPAL_FILTERS, DEFAULT_PRINCIPAL_SORT } from '@/types/principal'
import type { Enums } from '@/types/database.types'

/**
 * =============================================================================
 * PRINCIPAL FILTER COMPOSABLE - ORGANIZATION FILTERING & STATE MANAGEMENT
 * =============================================================================
 * 
 * Provides comprehensive filtering, search, and selection capabilities for
 * Principal Activity management with type-safe state management and reactive
 * updates optimized for Vue 3 Composition API.
 */

export interface UsePrincipalFilterOptions {
  /**
   * Initial filter state - defaults to DEFAULT_PRINCIPAL_FILTERS
   */
  initialFilters?: Partial<PrincipalFilters>
  
  /**
   * Initial sort configuration - defaults to DEFAULT_PRINCIPAL_SORT
   */
  initialSort?: PrincipalSortConfig
  
  /**
   * Debounce delay for search input (ms) - defaults to 300ms
   */
  searchDebounceMs?: number
  
  /**
   * Auto-apply filters on change - defaults to true
   */
  autoApply?: boolean
  
  /**
   * Enable multi-selection mode - defaults to false
   */
  multiSelect?: boolean
  
  /**
   * Maximum number of selected principals - defaults to unlimited
   */
  maxSelections?: number
  
  /**
   * Enable filter persistence to localStorage - defaults to false
   */
  persistFilters?: boolean
  
  /**
   * localStorage key for filter persistence
   */
  persistenceKey?: string
}

export interface UsePrincipalFilterReturn {
  // ============================
  // REACTIVE STATE
  // ============================
  
  /** Current active filters */
  filters: Ref<PrincipalFilters>
  
  /** Current sort configuration */
  sort: Ref<PrincipalSortConfig>
  
  /** Search query string */
  searchQuery: Ref<string>
  
  /** Loading state for filter operations */
  isLoading: Ref<boolean>
  
  /** Selected principal IDs for multi-select operations */
  selectedPrincipals: Ref<string[]>
  
  /** Form data for advanced filtering */
  filterFormData: Ref<PrincipalFilterFormData>
  
  /** Filter validation errors */
  filterErrors: Ref<Record<string, string>>
  
  // ============================
  // COMPUTED PROPERTIES  
  // ============================
  
  /** Whether any filters are currently active */
  hasActiveFilters: Ref<boolean>
  
  /** Whether search query is active */
  hasSearchQuery: Ref<boolean>
  
  /** Count of active filter criteria */
  activeFilterCount: Ref<number>
  
  /** Formatted filter summary for display */
  filterSummary: Ref<string>
  
  /** Whether maximum selections reached */
  isMaxSelectionsReached: Ref<boolean>
  
  /** Current selection count */
  selectionCount: Ref<number>
  
  /** Combined filter and sort state for API calls */
  queryParams: Ref<{
    filters: PrincipalFilters
    sort: PrincipalSortConfig
    search: string
  }>
  
  // ============================
  // FILTER MANAGEMENT
  // ============================
  
  /** Set search query with debouncing */
  setSearchQuery: (query: string) => void
  
  /** Update specific filter criteria */
  updateFilter: <K extends keyof PrincipalFilters>(
    key: K, 
    value: PrincipalFilters[K]
  ) => void
  
  /** Update multiple filters at once */
  updateFilters: (newFilters: Partial<PrincipalFilters>) => void
  
  /** Clear all active filters */
  clearFilters: () => void
  
  /** Clear search query only */
  clearSearch: () => void
  
  /** Reset to initial state */
  resetFilters: () => void
  
  /** Apply current filter form data to active filters */
  applyFormFilters: () => void
  
  /** Validate current filter state */
  validateFilters: () => boolean
  
  // ============================
  // SORT MANAGEMENT
  // ============================
  
  /** Update sort configuration */
  updateSort: (newSort: Partial<PrincipalSortConfig>) => void
  
  /** Toggle sort order for current field */
  toggleSortOrder: () => void
  
  /** Set sort field and reset order to desc */
  setSortField: (field: PrincipalSortConfig['field']) => void
  
  /** Reset sort to default configuration */
  resetSort: () => void
  
  // ============================
  // SELECTION MANAGEMENT
  // ============================
  
  /** Toggle selection of a principal */
  toggleSelection: (principalId: string) => void
  
  /** Select specific principals */
  selectPrincipals: (principalIds: string[]) => void
  
  /** Clear all selections */
  clearSelections: () => void
  
  /** Select all filtered principals */
  selectAll: (principalList: PrincipalActivitySummary[]) => void
  
  /** Check if principal is selected */
  isSelected: (principalId: string) => boolean
  
  /** Get selection items for display */
  getSelectionItems: (principalList: PrincipalActivitySummary[]) => PrincipalSelectionItem[]
  
  // ============================
  // UTILITY FUNCTIONS
  // ============================
  
  /** Export current filter state for sharing */
  exportFilterState: () => string
  
  /** Import filter state from exported string */
  importFilterState: (stateString: string) => boolean
  
  /** Get filter state for URL parameters */
  getUrlParams: () => URLSearchParams
  
  /** Set filters from URL parameters */
  setFromUrlParams: (params: URLSearchParams) => void
  
  /** Persist current state to localStorage */
  persistState: () => void
  
  /** Restore state from localStorage */
  restoreState: () => boolean
}

/**
 * Principal Filter Composable Implementation
 */
export function usePrincipalFilter(
  options: UsePrincipalFilterOptions = {}
): UsePrincipalFilterReturn {
  
  // ============================
  // OPTIONS PROCESSING
  // ============================
  
  const {
    initialFilters = {},
    initialSort = DEFAULT_PRINCIPAL_SORT,
    searchDebounceMs = 300,
    autoApply = true,
    multiSelect = false,
    maxSelections,
    persistFilters = false,
    persistenceKey = 'principal-filters'
  } = options
  
  // ============================
  // REACTIVE STATE INITIALIZATION
  // ============================
  
  const filters = ref<PrincipalFilters>({
    ...DEFAULT_PRINCIPAL_FILTERS,
    ...initialFilters
  })
  
  const sort = ref<PrincipalSortConfig>({ ...initialSort })
  
  const searchQuery = ref<string>(initialFilters.search || '')
  
  const isLoading = ref<boolean>(false)
  
  const selectedPrincipals = ref<string[]>([])
  
  const filterFormData = ref<PrincipalFilterFormData>({
    search_query: searchQuery.value,
    activity_statuses: filters.value.activity_status || [],
    organization_statuses: filters.value.organization_status || [],
    engagement_min: null,
    engagement_max: null,
    product_categories: filters.value.product_categories || [],
    has_active_opportunities: null,
    geographic_regions: [],
    date_range: {
      start: null,
      end: null
    }
  })
  
  const filterErrors = ref<Record<string, string>>({})
  
  // ============================
  // COMPUTED PROPERTIES
  // ============================
  
  const hasActiveFilters = computed(() => {
    const currentFilters = filters.value
    const defaultFilters = DEFAULT_PRINCIPAL_FILTERS
    
    return Object.keys(currentFilters).some(key => {
      const filterKey = key as keyof PrincipalFilters
      const currentValue = currentFilters[filterKey]
      const defaultValue = defaultFilters[filterKey]
      
      if (Array.isArray(currentValue) && Array.isArray(defaultValue)) {
        return currentValue.length !== defaultValue.length
      }
      
      return currentValue !== defaultValue
    })
  })
  
  const hasSearchQuery = computed(() => {
    return searchQuery.value.trim().length > 0
  })
  
  const activeFilterCount = computed(() => {
    let count = 0
    const currentFilters = filters.value
    
    if (currentFilters.search) count++
    if (currentFilters.activity_status?.length) count++
    if (currentFilters.organization_status?.length) count++
    if (currentFilters.organization_type?.length) count++
    if (currentFilters.product_categories?.length) count++
    if (currentFilters.has_opportunities !== null) count++
    if (currentFilters.has_products !== null) count++
    if (currentFilters.engagement_score_range) count++
    if (currentFilters.lead_score_range) count++
    if (currentFilters.country?.length) count++
    if (currentFilters.is_principal !== null) count++
    if (currentFilters.is_distributor !== null) count++
    
    return count
  })
  
  const filterSummary = computed(() => {
    const parts: string[] = []
    const currentFilters = filters.value
    
    if (currentFilters.search) {
      parts.push(`Search: "${currentFilters.search}"`)
    }
    
    if (currentFilters.activity_status?.length) {
      parts.push(`Activity: ${currentFilters.activity_status.join(', ')}`)
    }
    
    if (currentFilters.organization_status?.length) {  
      parts.push(`Status: ${currentFilters.organization_status.join(', ')}`)
    }
    
    if (currentFilters.product_categories?.length) {
      parts.push(`Products: ${currentFilters.product_categories.join(', ')}`)
    }
    
    if (currentFilters.has_opportunities === true) {
      parts.push('Has Opportunities')
    }
    
    if (currentFilters.engagement_score_range) {
      const range = currentFilters.engagement_score_range
      parts.push(`Engagement: ${range.min}-${range.max}`)
    }
    
    return parts.length > 0 ? parts.join(' • ') : 'No active filters'
  })
  
  const isMaxSelectionsReached = computed(() => {
    return maxSelections ? selectedPrincipals.value.length >= maxSelections : false
  })
  
  const selectionCount = computed(() => selectedPrincipals.value.length)
  
  const queryParams = computed(() => ({
    filters: filters.value,
    sort: sort.value,
    search: searchQuery.value
  }))
  
  // ============================
  // DEBOUNCED SEARCH HANDLER
  // ============================
  
  const debouncedSearchUpdate = debounce((query: string) => {
    filters.value.search = query
    if (autoApply) {
      // Trigger filter application if needed
    }
  }, searchDebounceMs)
  
  // ============================
  // FILTER MANAGEMENT FUNCTIONS
  // ============================
  
  const setSearchQuery = (query: string) => {
    searchQuery.value = query
    filterFormData.value.search_query = query
    debouncedSearchUpdate(query)
  }
  
  const updateFilter = <K extends keyof PrincipalFilters>(
    key: K, 
    value: PrincipalFilters[K]
  ) => {
    filters.value[key] = value
    
    // Update form data to match
    switch (key) {
      case 'activity_status':
        filterFormData.value.activity_statuses = value as PrincipalActivityStatus[]
        break
      case 'organization_status':
        filterFormData.value.organization_statuses = value as Enums<'organization_status'>[]
        break
      case 'product_categories':
        filterFormData.value.product_categories = value as Enums<'product_category'>[]
        break
      case 'has_opportunities':
        filterFormData.value.has_active_opportunities = value as boolean | null
        break
    }
    
    if (persistFilters) {
      persistState()
    }
  }
  
  const updateFilters = (newFilters: Partial<PrincipalFilters>) => {
    Object.assign(filters.value, newFilters)
    
    // Update search query if included
    if (newFilters.search !== undefined) {
      searchQuery.value = newFilters.search || ''
    }
    
    if (persistFilters) {
      persistState()
    }
  }
  
  const clearFilters = () => {
    filters.value = { ...DEFAULT_PRINCIPAL_FILTERS }
    searchQuery.value = ''
    filterFormData.value = {
      search_query: '',
      activity_statuses: [],
      organization_statuses: [],
      engagement_min: null,
      engagement_max: null,
      product_categories: [],
      has_active_opportunities: null,
      geographic_regions: [],
      date_range: { start: null, end: null }
    }
    filterErrors.value = {}
    
    if (persistFilters) {
      persistState()
    }
  }
  
  const clearSearch = () => {
    searchQuery.value = ''
    filters.value.search = ''
    filterFormData.value.search_query = ''
  }
  
  const resetFilters = () => {
    filters.value = { ...DEFAULT_PRINCIPAL_FILTERS, ...initialFilters }
    searchQuery.value = initialFilters.search || ''
    sort.value = { ...initialSort }
    selectedPrincipals.value = []
    filterErrors.value = {}
    
    if (persistFilters) {
      persistState()
    }
  }
  
  const applyFormFilters = () => {
    const formData = filterFormData.value
    
    // Validate form data first
    if (!validateFilters()) {
      return
    }
    
    // Convert form data to filter format
    const newFilters: Partial<PrincipalFilters> = {
      search: formData.search_query || undefined,
      activity_status: formData.activity_statuses.length > 0 ? formData.activity_statuses : undefined,
      organization_status: formData.organization_statuses.length > 0 ? formData.organization_statuses : undefined,
      product_categories: formData.product_categories.length > 0 ? formData.product_categories : undefined,
      has_opportunities: formData.has_active_opportunities || undefined
    }
    
    // Add engagement score range
    if (formData.engagement_min !== null || formData.engagement_max !== null) {
      newFilters.engagement_score_range = {
        min: formData.engagement_min || 0,
        max: formData.engagement_max || 100
      }
    }
    
    // Add date range filters
    if (formData.date_range.start || formData.date_range.end) {
      if (formData.date_range.start) {
        newFilters.created_after = formData.date_range.start
      }
      if (formData.date_range.end) {
        newFilters.created_before = formData.date_range.end
      }
    }
    
    updateFilters(newFilters)
  }
  
  const validateFilters = (): boolean => {
    const errors: Record<string, string> = {}
    const formData = filterFormData.value
    
    // Validate engagement score range
    if (formData.engagement_min !== null && formData.engagement_max !== null) {
      if (formData.engagement_min > formData.engagement_max) {
        errors.engagement_range = 'Minimum score cannot be greater than maximum score'
      }
    }
    
    // Validate date range
    if (formData.date_range.start && formData.date_range.end) {
      if (formData.date_range.start > formData.date_range.end) {
        errors.date_range = 'Start date cannot be after end date'
      }
    }
    
    filterErrors.value = errors
    return Object.keys(errors).length === 0
  }
  
  // ============================
  // SORT MANAGEMENT FUNCTIONS
  // ============================
  
  const updateSort = (newSort: Partial<PrincipalSortConfig>) => {
    Object.assign(sort.value, newSort)
    
    if (persistFilters) {
      persistState()
    }
  }
  
  const toggleSortOrder = () => {
    sort.value.order = sort.value.order === 'asc' ? 'desc' : 'asc'
    
    if (persistFilters) {
      persistState()
    }
  }
  
  const setSortField = (field: PrincipalSortConfig['field']) => {
    sort.value.field = field
    sort.value.order = 'desc' // Reset to desc for new field
    
    if (persistFilters) {
      persistState()
    }
  }
  
  const resetSort = () => {
    sort.value = { ...DEFAULT_PRINCIPAL_SORT }
    
    if (persistFilters) {
      persistState()
    }
  }
  
  // ============================
  // SELECTION MANAGEMENT FUNCTIONS
  // ============================
  
  const toggleSelection = (principalId: string) => {
    if (!multiSelect) {
      selectedPrincipals.value = [principalId]
      return
    }
    
    const index = selectedPrincipals.value.indexOf(principalId)
    
    if (index > -1) {
      selectedPrincipals.value.splice(index, 1)
    } else {
      if (!maxSelections || selectedPrincipals.value.length < maxSelections) {
        selectedPrincipals.value.push(principalId)
      }
    }
  }
  
  const selectPrincipals = (principalIds: string[]) => {
    if (!multiSelect) {
      selectedPrincipals.value = principalIds.slice(0, 1)
      return
    }
    
    const limitedIds = maxSelections 
      ? principalIds.slice(0, maxSelections)
      : principalIds
    
    selectedPrincipals.value = [...limitedIds]
  }
  
  const clearSelections = () => {
    selectedPrincipals.value = []
  }
  
  const selectAll = (principalList: PrincipalActivitySummary[]) => {
    if (!multiSelect) return
    
    const allIds = principalList.map(p => p.principal_id)
    const limitedIds = maxSelections 
      ? allIds.slice(0, maxSelections)
      : allIds
    
    selectedPrincipals.value = [...limitedIds]
  }
  
  const isSelected = (principalId: string): boolean => {
    return selectedPrincipals.value.includes(principalId)
  }
  
  const getSelectionItems = (principalList: PrincipalActivitySummary[]): PrincipalSelectionItem[] => {
    return principalList
      .filter(principal => selectedPrincipals.value.includes(principal.principal_id))
      .map(principal => ({
        id: principal.principal_id,
        name: principal.principal_name,
        organization_type: principal.organization_type,
        engagement_score: principal.engagement_score,
        activity_status: principal.activity_status,
        contact_count: principal.contact_count,
        opportunity_count: principal.total_opportunities,
        last_activity_date: principal.last_activity_date,
        is_recommended: principal.engagement_score > 70 && principal.activity_status === 'ACTIVE'
      }))
  }
  
  // ============================
  // UTILITY FUNCTIONS
  // ============================
  
  const exportFilterState = (): string => {
    const state = {
      filters: filters.value,
      sort: sort.value,
      search: searchQuery.value,
      selections: selectedPrincipals.value
    }
    
    return JSON.stringify(state)
  }
  
  const importFilterState = (stateString: string): boolean => {
    try {
      const state = JSON.parse(stateString)
      
      if (state.filters) {
        updateFilters(state.filters)
      }
      
      if (state.sort) {
        updateSort(state.sort)
      }
      
      if (state.search) {
        setSearchQuery(state.search)
      }
      
      if (state.selections && Array.isArray(state.selections)) {
        selectPrincipals(state.selections)
      }
      
      return true
    } catch (error) {
      console.error('Failed to import filter state:', error)
      return false
    }
  }
  
  const getUrlParams = (): URLSearchParams => {
    const params = new URLSearchParams()
    
    // Add search query
    if (searchQuery.value) {
      params.set('search', searchQuery.value)
    }
    
    // Add filters
    const currentFilters = filters.value
    
    if (currentFilters.activity_status?.length) {
      params.set('activity_status', currentFilters.activity_status.join(','))
    }
    
    if (currentFilters.organization_status?.length) {
      params.set('org_status', currentFilters.organization_status.join(','))
    }
    
    if (currentFilters.product_categories?.length) {
      params.set('products', currentFilters.product_categories.join(','))
    }
    
    if (currentFilters.has_opportunities !== null) {
      params.set('has_opps', String(currentFilters.has_opportunities))
    }
    
    // Add sort
    params.set('sort', sort.value.field)
    params.set('order', sort.value.order)
    
    return params
  }
  
  const setFromUrlParams = (params: URLSearchParams) => {
    const newFilters: Partial<PrincipalFilters> = {}
    
    // Extract search
    const search = params.get('search')
    if (search) {
      setSearchQuery(search)
    }
    
    // Extract filters
    const activityStatus = params.get('activity_status')
    if (activityStatus) {
      newFilters.activity_status = activityStatus.split(',') as PrincipalActivityStatus[]
    }
    
    const orgStatus = params.get('org_status')
    if (orgStatus) {
      newFilters.organization_status = orgStatus.split(',') as Enums<'organization_status'>[]
    }
    
    const products = params.get('products')
    if (products) {
      newFilters.product_categories = products.split(',') as Enums<'product_category'>[]
    }
    
    const hasOpps = params.get('has_opps')
    if (hasOpps !== null) {
      newFilters.has_opportunities = hasOpps === 'true'
    }
    
    // Extract sort
    const sortField = params.get('sort')
    const sortOrder = params.get('order')
    
    if (sortField && sortOrder) {
      updateSort({
        field: sortField as PrincipalSortConfig['field'],
        order: sortOrder as 'asc' | 'desc'
      })
    }
    
    if (Object.keys(newFilters).length > 0) {
      updateFilters(newFilters)
    }
  }
  
  const persistState = () => {
    if (!persistFilters || typeof localStorage === 'undefined') return
    
    try {
      const state = {
        filters: filters.value,
        sort: sort.value,
        timestamp: Date.now()
      }
      
      localStorage.setItem(persistenceKey, JSON.stringify(state))
    } catch (error) {
      console.warn('Failed to persist filter state:', error)
    }
  }
  
  const restoreState = (): boolean => {
    if (!persistFilters || typeof localStorage === 'undefined') return false
    
    try {
      const stored = localStorage.getItem(persistenceKey)
      if (!stored) return false
      
      const state = JSON.parse(stored)
      
      // Check if state is not too old (7 days)
      const maxAge = 7 * 24 * 60 * 60 * 1000
      if (state.timestamp && (Date.now() - state.timestamp) > maxAge) {
        localStorage.removeItem(persistenceKey)
        return false
      }
      
      if (state.filters) {
        updateFilters(state.filters)
      }
      
      if (state.sort) {
        updateSort(state.sort)
      }
      
      return true
    } catch (error) {
      console.warn('Failed to restore filter state:', error)
      localStorage.removeItem(persistenceKey)
      return false  
    }
  }
  
  // ============================
  // WATCHERS
  // ============================
  
  // Watch for filter changes to update form data
  watch(filters, (newFilters) => {
    filterFormData.value.search_query = newFilters.search || ''
    filterFormData.value.activity_statuses = newFilters.activity_status || []
    filterFormData.value.organization_statuses = newFilters.organization_status || []
    filterFormData.value.product_categories = newFilters.product_categories || []
    filterFormData.value.has_active_opportunities = newFilters.has_opportunities || null
  }, { deep: true })
  
  // ============================
  // INITIALIZATION
  // ============================
  
  // Restore persisted state if enabled
  if (persistFilters) {
    restoreState()
  }
  
  // ============================
  // RETURN INTERFACE
  // ============================
  
  return {
    // Reactive state
    filters,
    sort,
    searchQuery,
    isLoading,
    selectedPrincipals,
    filterFormData,
    filterErrors,
    
    // Computed properties
    hasActiveFilters,
    hasSearchQuery,
    activeFilterCount,
    filterSummary,
    isMaxSelectionsReached,
    selectionCount,
    queryParams,
    
    // Filter management
    setSearchQuery,
    updateFilter,
    updateFilters,
    clearFilters,
    clearSearch,
    resetFilters,
    applyFormFilters,
    validateFilters,
    
    // Sort management
    updateSort,
    toggleSortOrder,
    setSortField,
    resetSort,
    
    // Selection management
    toggleSelection,
    selectPrincipals,
    clearSelections,
    selectAll,
    isSelected,
    getSelectionItems,
    
    // Utility functions
    exportFilterState,
    importFilterState,
    getUrlParams,
    setFromUrlParams,
    persistState,
    restoreState
  }
}

/**
 * Default export for convenience
 */
export default usePrincipalFilter