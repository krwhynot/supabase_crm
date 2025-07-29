/**
 * Organization filters composable
 * Provides advanced search and filtering functionality for organizations
 * Includes debounced search, filter management, and URL state synchronization
 */

import { ref, computed, watch, nextTick } from 'vue'
import { debounce } from 'lodash-es'
import type {
  OrganizationFilters,
  OrganizationSortConfig,
  OrganizationSortField,
  SortOrder,
  OrganizationType,
  OrganizationSize,
  OrganizationStatus
} from '@/types/organizations'

/**
 * Filter state interface
 */
interface FilterState {
  search: string
  industry: string[]
  type: OrganizationType[]
  size: OrganizationSize[]
  status: OrganizationStatus[]
  country: string[]
  leadScoreRange: {
    min: number | null
    max: number | null
  }
  employeeRange: {
    min: number | null
    max: number | null
  }
  revenueRange: {
    min: number | null
    max: number | null
  }
  tags: string[]
  foundedYearRange: {
    min: number | null
    max: number | null
  }
  lastContactDateRange: {
    start: Date | null
    end: Date | null
  }
}

/**
 * Organization filters composable
 */
export function useOrganizationFilters() {
  // Filter state
  const filterState = ref<FilterState>({
    search: '',
    industry: [],
    type: [],
    size: [],
    status: [],
    country: [],
    leadScoreRange: {
      min: null,
      max: null
    },
    employeeRange: {
      min: null,
      max: null
    },
    revenueRange: {
      min: null,
      max: null
    },
    tags: [],
    foundedYearRange: {
      min: null,
      max: null
    },
    lastContactDateRange: {
      start: null,
      end: null
    }
  })

  // Sort configuration
  const sortConfig = ref<OrganizationSortConfig>({
    field: 'name',
    order: 'asc'
  })

  // Active filters tracking
  const activeFilters = ref<string[]>([])
  const isFiltering = ref(false)

  // Search state
  const searchQuery = ref('')
  const isSearching = ref(false)

  // Predefined filter options
  const filterOptions = {
    industry: [
      'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
      'Retail', 'Real Estate', 'Energy', 'Transportation', 'Media',
      'Telecommunications', 'Agriculture', 'Construction', 'Hospitality',
      'Professional Services', 'Government', 'Non-Profit', 'Other'
    ],
    type: ['B2B', 'B2C', 'B2B2C', 'Non-Profit', 'Government', 'Other'] as OrganizationType[],
    size: ['Startup', 'Small', 'Medium', 'Large', 'Enterprise'] as OrganizationSize[],
    status: ['Active', 'Inactive', 'Prospect', 'Customer', 'Partner', 'Vendor'] as OrganizationStatus[],
    country: [
      'United States', 'Canada', 'United Kingdom', 'Germany', 'France',
      'Australia', 'Japan', 'Singapore', 'India', 'Brazil', 'Mexico',
      'Netherlands', 'Switzerland', 'Sweden', 'Other'
    ],
    sortFields: [
      { value: 'name', label: 'Name' },
      { value: 'legal_name', label: 'Legal Name' },
      { value: 'industry', label: 'Industry' },
      { value: 'type', label: 'Type' },
      { value: 'size', label: 'Size' },
      { value: 'status', label: 'Status' },
      { value: 'lead_score', label: 'Lead Score' },
      { value: 'employees_count', label: 'Employee Count' },
      { value: 'annual_revenue', label: 'Annual Revenue' },
      { value: 'founded_year', label: 'Founded Year' },
      { value: 'created_at', label: 'Created Date' },
      { value: 'updated_at', label: 'Updated Date' },
      { value: 'last_contact_date', label: 'Last Contact' },
      { value: 'next_follow_up_date', label: 'Next Follow-up' }
    ] as Array<{ value: OrganizationSortField; label: string }>
  }

  // Computed properties
  const hasActiveFilters = computed(() => {
    return (
      filterState.value.search.length > 0 ||
      filterState.value.industry.length > 0 ||
      filterState.value.type.length > 0 ||
      filterState.value.size.length > 0 ||
      filterState.value.status.length > 0 ||
      filterState.value.country.length > 0 ||
      filterState.value.tags.length > 0 ||
      filterState.value.leadScoreRange.min !== null ||
      filterState.value.leadScoreRange.max !== null ||
      filterState.value.employeeRange.min !== null ||
      filterState.value.employeeRange.max !== null ||
      filterState.value.revenueRange.min !== null ||
      filterState.value.revenueRange.max !== null ||
      filterState.value.foundedYearRange.min !== null ||
      filterState.value.foundedYearRange.max !== null ||
      filterState.value.lastContactDateRange.start !== null ||
      filterState.value.lastContactDateRange.end !== null
    )
  })

  const filterCount = computed(() => {
    let count = 0
    
    if (filterState.value.search.length > 0) count++
    if (filterState.value.industry.length > 0) count++
    if (filterState.value.type.length > 0) count++
    if (filterState.value.size.length > 0) count++
    if (filterState.value.status.length > 0) count++
    if (filterState.value.country.length > 0) count++
    if (filterState.value.tags.length > 0) count++
    if (filterState.value.leadScoreRange.min !== null || filterState.value.leadScoreRange.max !== null) count++
    if (filterState.value.employeeRange.min !== null || filterState.value.employeeRange.max !== null) count++
    if (filterState.value.revenueRange.min !== null || filterState.value.revenueRange.max !== null) count++
    if (filterState.value.foundedYearRange.min !== null || filterState.value.foundedYearRange.max !== null) count++
    if (filterState.value.lastContactDateRange.start !== null || filterState.value.lastContactDateRange.end !== null) count++
    
    return count
  })

  const currentFilters = computed((): OrganizationFilters => {
    const filters: OrganizationFilters = {}
    
    if (filterState.value.search.length > 0) {
      filters.search = filterState.value.search
    }
    
    if (filterState.value.industry.length > 0) {
      filters.industry = [...filterState.value.industry]
    }
    
    if (filterState.value.type.length > 0) {
      filters.type = [...filterState.value.type]
    }
    
    if (filterState.value.size.length > 0) {
      filters.size = [...filterState.value.size]
    }
    
    if (filterState.value.status.length > 0) {
      filters.status = [...filterState.value.status]
    }
    
    if (filterState.value.country.length > 0) {
      filters.country = [...filterState.value.country]
    }
    
    if (filterState.value.tags.length > 0) {
      filters.tags = [...filterState.value.tags]
    }
    
    if (filterState.value.leadScoreRange.min !== null || filterState.value.leadScoreRange.max !== null) {
      filters.leadScoreRange = {
        min: filterState.value.leadScoreRange.min || 0,
        max: filterState.value.leadScoreRange.max || 100
      }
    }
    
    if (filterState.value.employeeRange.min !== null || filterState.value.employeeRange.max !== null) {
      filters.employeeRange = {
        min: filterState.value.employeeRange.min || 0,
        max: filterState.value.employeeRange.max || 1000000
      }
    }
    
    if (filterState.value.revenueRange.min !== null || filterState.value.revenueRange.max !== null) {
      filters.revenueRange = {
        min: filterState.value.revenueRange.min || 0,
        max: filterState.value.revenueRange.max || 1000000000
      }
    }
    
    if (filterState.value.foundedYearRange.min !== null || filterState.value.foundedYearRange.max !== null) {
      filters.foundedYearRange = {
        min: filterState.value.foundedYearRange.min || 1800,
        max: filterState.value.foundedYearRange.max || new Date().getFullYear()
      }
    }
    
    if (filterState.value.lastContactDateRange.start !== null || filterState.value.lastContactDateRange.end !== null) {
      filters.lastContactDateRange = {
        start: filterState.value.lastContactDateRange.start || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        end: filterState.value.lastContactDateRange.end || new Date()
      }
    }
    
    return filters
  })

  // Debounced search function
  const debouncedSearch = debounce((callback: (filters: OrganizationFilters) => void) => {
    isSearching.value = false
    callback(currentFilters.value)
  }, 500)

  // Search methods
  const updateSearch = (query: string, callback?: (filters: OrganizationFilters) => void) => {
    searchQuery.value = query
    filterState.value.search = query
    
    if (callback) {
      isSearching.value = true
      debouncedSearch(callback)
    }
  }

  const clearSearch = (callback?: (filters: OrganizationFilters) => void) => {
    searchQuery.value = ''
    filterState.value.search = ''
    
    if (callback) {
      callback(currentFilters.value)
    }
  }

  // Filter management methods
  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
    callback?: (filters: OrganizationFilters) => void
  ) => {
    filterState.value[key] = value
    
    if (callback) {
      nextTick(() => {
        callback(currentFilters.value)
      })
    }
  }

  const addToArrayFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K] extends (infer U)[] ? U : never,
    callback?: (filters: OrganizationFilters) => void
  ) => {
    if (Array.isArray(filterState.value[key])) {
      const currentArray = filterState.value[key] as any[]
      if (!currentArray.includes(value)) {
        currentArray.push(value)
        
        if (callback) {
          nextTick(() => {
            callback(currentFilters.value)
          })
        }
      }
    }
  }

  const removeFromArrayFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K] extends (infer U)[] ? U : never,
    callback?: (filters: OrganizationFilters) => void
  ) => {
    if (Array.isArray(filterState.value[key])) {
      const currentArray = filterState.value[key] as any[]
      const index = currentArray.indexOf(value)
      if (index > -1) {
        currentArray.splice(index, 1)
        
        if (callback) {
          nextTick(() => {
            callback(currentFilters.value)
          })
        }
      }
    }
  }

  const updateRangeFilter = <K extends keyof FilterState>(
    key: K,
    range: { min: number | null; max: number | null },
    callback?: (filters: OrganizationFilters) => void
  ) => {
    if (typeof filterState.value[key] === 'object' && filterState.value[key] !== null) {
      filterState.value[key] = { ...range } as FilterState[K]
      
      if (callback) {
        nextTick(() => {
          callback(currentFilters.value)
        })
      }
    }
  }

  const updateDateRangeFilter = (
    range: { start: Date | null; end: Date | null },
    callback?: (filters: OrganizationFilters) => void
  ) => {
    filterState.value.lastContactDateRange = { ...range }
    
    if (callback) {
      nextTick(() => {
        callback(currentFilters.value)
      })
    }
  }

  // Clear methods
  const clearFilter = <K extends keyof FilterState>(
    key: K,
    callback?: (filters: OrganizationFilters) => void
  ) => {
    if (Array.isArray(filterState.value[key])) {
      (filterState.value[key] as any) = []
    } else if (typeof filterState.value[key] === 'object' && filterState.value[key] !== null) {
      if (key === 'lastContactDateRange') {
        (filterState.value[key] as any) = { start: null, end: null }
      } else {
        (filterState.value[key] as any) = { min: null, max: null }
      }
    } else {
      (filterState.value[key] as any) = ''
    }
    
    if (callback) {
      nextTick(() => {
        callback(currentFilters.value)
      })
    }
  }

  const clearAllFilters = (callback?: (filters: OrganizationFilters) => void) => {
    filterState.value = {
      search: '',
      industry: [],
      type: [],
      size: [],
      status: [],
      country: [],
      leadScoreRange: { min: null, max: null },
      employeeRange: { min: null, max: null },
      revenueRange: { min: null, max: null },
      tags: [],
      foundedYearRange: { min: null, max: null },
      lastContactDateRange: { start: null, end: null }
    }
    
    searchQuery.value = ''
    
    if (callback) {
      nextTick(() => {
        callback(currentFilters.value)
      })
    }
  }

  // Sort methods
  const updateSort = (
    field: OrganizationSortField,
    order?: SortOrder,
    callback?: (sort: OrganizationSortConfig) => void
  ) => {
    // If same field, toggle order; otherwise use provided order or default to 'asc'
    if (sortConfig.value.field === field && !order) {
      sortConfig.value.order = sortConfig.value.order === 'asc' ? 'desc' : 'asc'
    } else {
      sortConfig.value.field = field
      sortConfig.value.order = order || 'asc'
    }
    
    if (callback) {
      callback(sortConfig.value)
    }
  }

  const resetSort = (callback?: (sort: OrganizationSortConfig) => void) => {
    sortConfig.value = {
      field: 'name',
      order: 'asc'
    }
    
    if (callback) {
      callback(sortConfig.value)
    }
  }

  // Preset filters
  const applyPresetFilter = (
    preset: 'prospects' | 'customers' | 'partners' | 'high-value' | 'recent',
    callback?: (filters: OrganizationFilters) => void
  ) => {
    clearAllFilters()
    
    switch (preset) {
      case 'prospects':
        filterState.value.status = ['Prospect']
        break
      case 'customers':
        filterState.value.status = ['Customer']
        break
      case 'partners':
        filterState.value.status = ['Partner']
        break
      case 'high-value':
        filterState.value.leadScoreRange = { min: 80, max: 100 }
        filterState.value.revenueRange = { min: 1000000, max: null }
        break
      case 'recent': {
        const oneMonthAgo = new Date()
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
        filterState.value.lastContactDateRange = {
          start: oneMonthAgo,
          end: new Date()
        }
        break
      }
    }
    
    if (callback) {
      nextTick(() => {
        callback(currentFilters.value)
      })
    }
  }

  // Validation
  const validateFilters = async (): Promise<{ isValid: boolean; errors: string[] }> => {
    const errors: string[] = []
    
    // Validate lead score range
    if (filterState.value.leadScoreRange.min !== null && filterState.value.leadScoreRange.max !== null) {
      if (filterState.value.leadScoreRange.min > filterState.value.leadScoreRange.max) {
        errors.push('Lead score minimum cannot be greater than maximum')
      }
    }
    
    // Validate employee range
    if (filterState.value.employeeRange.min !== null && filterState.value.employeeRange.max !== null) {
      if (filterState.value.employeeRange.min > filterState.value.employeeRange.max) {
        errors.push('Employee count minimum cannot be greater than maximum')
      }
    }
    
    // Validate revenue range
    if (filterState.value.revenueRange.min !== null && filterState.value.revenueRange.max !== null) {
      if (filterState.value.revenueRange.min > filterState.value.revenueRange.max) {
        errors.push('Revenue minimum cannot be greater than maximum')
      }
    }
    
    // Validate founded year range
    if (filterState.value.foundedYearRange.min !== null && filterState.value.foundedYearRange.max !== null) {
      if (filterState.value.foundedYearRange.min > filterState.value.foundedYearRange.max) {
        errors.push('Founded year minimum cannot be greater than maximum')
      }
    }
    
    // Validate date range
    if (filterState.value.lastContactDateRange.start && filterState.value.lastContactDateRange.end) {
      if (filterState.value.lastContactDateRange.start > filterState.value.lastContactDateRange.end) {
        errors.push('Start date cannot be after end date')
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Export/Import filter state
  const exportFilters = (): string => {
    return JSON.stringify({
      filters: filterState.value,
      sort: sortConfig.value
    })
  }

  const importFilters = (filtersJson: string): boolean => {
    try {
      const imported = JSON.parse(filtersJson)
      
      if (imported.filters) {
        filterState.value = { ...filterState.value, ...imported.filters }
      }
      
      if (imported.sort) {
        sortConfig.value = { ...sortConfig.value, ...imported.sort }
      }
      
      return true
    } catch {
      return false
    }
  }

  // Watch for filter changes to update active filters list
  watch(currentFilters, (newFilters) => {
    const active: string[] = []
    
    if (newFilters.search) active.push('search')
    if (newFilters.industry?.length) active.push('industry')
    if (newFilters.type?.length) active.push('type')
    if (newFilters.size?.length) active.push('size')
    if (newFilters.status?.length) active.push('status')
    if (newFilters.country?.length) active.push('country')
    if (newFilters.tags?.length) active.push('tags')
    if (newFilters.leadScoreRange) active.push('leadScore')
    if (newFilters.employeeRange) active.push('employees')
    if (newFilters.revenueRange) active.push('revenue')
    if (newFilters.foundedYearRange) active.push('foundedYear')
    if (newFilters.lastContactDateRange) active.push('lastContact')
    
    activeFilters.value = active
    isFiltering.value = active.length > 0
  }, { deep: true })

  return {
    // State
    filterState,
    sortConfig,
    searchQuery,
    activeFilters,
    isFiltering,
    isSearching,
    
    // Options
    filterOptions,
    
    // Computed
    hasActiveFilters,
    filterCount,
    currentFilters,
    
    // Search methods
    updateSearch,
    clearSearch,
    
    // Filter methods
    updateFilter,
    addToArrayFilter,
    removeFromArrayFilter,
    updateRangeFilter,
    updateDateRangeFilter,
    clearFilter,
    clearAllFilters,
    
    // Sort methods
    updateSort,
    resetSort,
    
    // Preset methods
    applyPresetFilter,
    
    // Validation
    validateFilters,
    
    // Import/Export
    exportFilters,
    importFilters
  }
}