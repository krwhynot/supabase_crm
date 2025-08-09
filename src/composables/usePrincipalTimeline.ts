import { ref, computed, type Ref } from 'vue'
// Native debounce implementation to replace lodash-es dependency
function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>): void => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}
import type { 
  PrincipalTimelineEntry,
  TimelineActivityType
} from '@/types/principal'
import { TIMELINE_ACTIVITY_ICONS } from '@/types/principal'

/**
 * =============================================================================
 * PRINCIPAL TIMELINE COMPOSABLE - ACTIVITY CHRONOLOGY MANAGEMENT
 * =============================================================================
 * 
 * Provides comprehensive timeline management for Principal Activity tracking
 * with chronological activity display, filtering, grouping, and real-time
 * updates optimized for Vue 3 Composition API.
 */

export interface UsePrincipalTimelineOptions {
  /**
   * Default items per page for timeline pagination - defaults to 20
   */
  defaultPageSize?: number
  
  /**
   * Auto-refresh interval in milliseconds - defaults to 60000 (1 minute)
   */
  refreshInterval?: number
  
  /**
   * Enable real-time timeline updates - defaults to true
   */
  realTimeUpdates?: boolean
  
  /**
   * Maximum timeline entries to keep in memory - defaults to 1000
   */
  maxTimelineEntries?: number
  
  /**
   * Time zone for date formatting - defaults to browser timezone
   */
  timeZone?: string
  
  /**
   * Date format pattern - defaults to 'MMM dd, yyyy'
   */
  dateFormat?: string
  
  /**
   * Group timeline entries by date - defaults to true
   */
  groupByDate?: boolean
  
  /**
   * Enable timeline entry caching - defaults to true
   */
  enableCaching?: boolean
  
  /**
   * Cache duration in milliseconds - defaults to 300000 (5 minutes)
   */
  cacheDuration?: number
}

export interface TimelineFilter {
  /**
   * Filter by activity types
   */
  activity_types?: TimelineActivityType[]
  
  /**
   * Filter by date range
   */
  date_range?: {
    start: Date | null
    end: Date | null
  }
  
  /**
   * Search within activity details
   */
  search?: string
  
  /**
   * Filter by specific principals
   */
  principal_ids?: string[]
  
  /**
   * Filter by source table
   */
  source_tables?: string[]
  
  /**
   * Filter by activity status
   */
  activity_status?: string[]
  
  /**
   * Show only entries requiring follow-up
   */
  follow_up_required?: boolean
  
  /**
   * Show only overdue follow-ups
   */
  overdue_only?: boolean
}

export interface TimelineGroup {
  /**
   * Group identifier (usually date string)
   */
  group_id: string
  
  /**
   * Group display label
   */
  label: string
  
  /**
   * Group date for sorting
   */
  date: Date
  
  /**
   * Timeline entries in this group
   */
  entries: PrincipalTimelineEntry[]
  
  /**
   * Entry count in group
   */
  count: number
  
  /**
   * Summary statistics for the group
   */
  summary: {
    interactions: number
    opportunities: number
    contacts: number
    products: number
  }
}

export interface TimelinePagination {
  /**
   * Current page number (1-based)
   */
  page: number
  
  /**
   * Items per page
   */
  limit: number
  
  /**
   * Total number of entries
   */
  total: number
  
  /**
   * Total number of pages
   */
  total_pages: number
  
  /**
   * Whether there are more entries
   */
  has_next: boolean
  
  /**
   * Whether there are previous entries
   */
  has_previous: boolean
}

export interface UsePrincipalTimelineReturn {
  // ============================
  // REACTIVE STATE
  // ============================
  
  /** Timeline entries for current view */
  timelineEntries: Ref<PrincipalTimelineEntry[]>
  
  /** Grouped timeline entries */
  groupedTimeline: Ref<TimelineGroup[]>
  
  /** Current timeline filters */
  filters: Ref<TimelineFilter>
  
  /** Pagination state */
  pagination: Ref<TimelinePagination>
  
  /** Loading state */
  isLoading: Ref<boolean>
  
  /** Error state */
  error: Ref<string | null>
  
  /** Selected timeline entry for details */
  selectedEntry: Ref<PrincipalTimelineEntry | null>
  
  /** Timeline view mode */
  viewMode: Ref<'list' | 'grouped' | 'compact'>
  
  /** Sort configuration */
  sortConfig: Ref<{
    field: 'activity_date' | 'timeline_rank' | 'activity_type'
    order: 'asc' | 'desc'
  }>
  
  // ============================
  // COMPUTED PROPERTIES
  // ============================
  
  /** Whether any filters are active */
  hasActiveFilters: Ref<boolean>
  
  /** Total number of filtered entries */
  filteredEntryCount: Ref<number>
  
  /** Activity type distribution */
  activityTypeDistribution: Ref<{
    [K in TimelineActivityType]: {
      count: number
      percentage: number
      color: string
      icon: string
    }
  }>
  
  /** Timeline summary statistics */
  timelineSummary: Ref<{
    total_entries: number
    unique_principals: number
    date_range: {
      start: Date | null
      end: Date | null
    }
    most_active_day: {
      date: string
      count: number
    }
    activity_trend: 'increasing' | 'stable' | 'decreasing'
  }>
  
  /** Entries requiring follow-up */
  followUpEntries: Ref<PrincipalTimelineEntry[]>
  
  /** Overdue follow-up entries */
  overdueEntries: Ref<PrincipalTimelineEntry[]>
  
  /** Recent activity entries (last 7 days) */
  recentActivity: Ref<PrincipalTimelineEntry[]>
  
  // ============================
  // TIMELINE MANAGEMENT
  // ============================
  
  /** Load timeline entries for a principal */
  loadTimelineForPrincipal: (principalId: string) => Promise<void>
  
  /** Load timeline entries for multiple principals */
  loadTimelineForPrincipals: (principalIds: string[]) => Promise<void>
  
  /** Load all timeline entries */
  loadAllTimeline: () => Promise<void>
  
  /** Refresh current timeline data */
  refreshTimeline: () => Promise<void>
  
  /** Add new timeline entry */
  addTimelineEntry: (entry: Omit<PrincipalTimelineEntry, 'timeline_rank'>) => Promise<void>
  
  /** Update existing timeline entry */
  updateTimelineEntry: (entryId: string, updates: Partial<PrincipalTimelineEntry>) => Promise<void>
  
  /** Delete timeline entry */
  deleteTimelineEntry: (entryId: string) => Promise<void>
  
  // ============================
  // FILTERING AND SEARCH
  // ============================
  
  /** Update timeline filters */
  updateFilters: (newFilters: Partial<TimelineFilter>) => void
  
  /** Clear all filters */
  clearFilters: () => void
  
  /** Apply text search to timeline */
  searchTimeline: (query: string) => void
  
  /** Filter by activity type */
  filterByActivityType: (types: TimelineActivityType[]) => void
  
  /** Filter by date range */
  filterByDateRange: (start: Date | null, end: Date | null) => void
  
  /** Filter by follow-up status */
  filterByFollowUp: (required: boolean | null, overdueOnly?: boolean) => void
  
  /** Get entries for specific date */
  getEntriesForDate: (date: Date) => PrincipalTimelineEntry[]
  
  // ============================
  // GROUPING AND SORTING
  // ============================
  
  /** Toggle timeline grouping */
  toggleGrouping: () => void
  
  /** Group entries by specified criteria */
  groupBy: (criteria: 'date' | 'activity_type' | 'principal' | 'source') => void
  
  /** Update sort configuration */
  updateSort: (field: 'activity_date' | 'timeline_rank' | 'activity_type', order?: 'asc' | 'desc') => void
  
  /** Sort timeline entries */
  sortTimeline: () => void
  
  // ============================
  // PAGINATION
  // ============================
  
  /** Navigate to specific page */
  goToPage: (page: number) => Promise<void>
  
  /** Go to next page */
  nextPage: () => Promise<void>
  
  /** Go to previous page */
  previousPage: () => Promise<void>
  
  /** Update page size */
  updatePageSize: (size: number) => Promise<void>
  
  // ============================
  // SELECTION AND INTERACTION
  // ============================
  
  /** Select timeline entry for detailed view */
  selectEntry: (entry: PrincipalTimelineEntry) => void
  
  /** Clear selected entry */
  clearSelection: () => void
  
  /** Mark entry as requiring follow-up */
  markForFollowUp: (entryId: string, followUpDate: Date, notes?: string) => Promise<void>
  
  /** Complete follow-up for entry */
  completeFollowUp: (entryId: string, notes?: string) => Promise<void>
  
  // ============================
  // EXPORT AND SHARING
  // ============================
  
  /** Export timeline to CSV */
  exportToCsv: (includeFilters?: boolean) => string
  
  /** Export timeline to JSON */
  exportToJson: (includeFilters?: boolean) => string
  
  /** Generate timeline report */
  generateReport: (format: 'summary' | 'detailed') => {
    title: string
    content: string
    metadata: Record<string, any>
  }
  
  /** Share timeline view via URL */
  getShareableUrl: () => string
  
  // ============================
  // UTILITY FUNCTIONS
  // ============================
  
  /** Format activity date for display */
  formatActivityDate: (date: string, format?: 'short' | 'long' | 'relative') => string
  
  /** Get activity type icon */
  getActivityIcon: (activityType: TimelineActivityType) => string
  
  /** Get activity type color */
  getActivityColor: (activityType: TimelineActivityType) => string
  
  /** Calculate time difference */
  getTimeDifference: (date: string) => {
    value: number
    unit: 'minutes' | 'hours' | 'days' | 'months'
    label: string
  }
  
  /** Check if entry is overdue */
  isOverdue: (entry: PrincipalTimelineEntry) => boolean
  
  /** Clear timeline cache */
  clearCache: () => void
}

/**
 * Principal Timeline Composable Implementation
 */
export function usePrincipalTimeline(
  options: UsePrincipalTimelineOptions = {}
): UsePrincipalTimelineReturn {
  
  // ============================
  // OPTIONS PROCESSING
  // ============================
  
  const {
    defaultPageSize = 20,
    refreshInterval = 60000,
    realTimeUpdates = true,
    maxTimelineEntries = 1000,
    groupByDate = true,
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat = 'MMM dd, yyyy',
    enableCaching = true,
    cacheDuration = 300000
  } = options
  
  // Variables available for future timeline functionality
  console.log('Timeline config:', { maxTimelineEntries, timeZone, dateFormat })
  
  // ============================
  // REACTIVE STATE INITIALIZATION
  // ============================
  
  const timelineEntries = ref<PrincipalTimelineEntry[]>([])
  const groupedTimeline = ref<TimelineGroup[]>([])
  
  const filters = ref<TimelineFilter>({
    activity_types: [],
    date_range: { start: null, end: null },
    search: '',
    principal_ids: [],
    source_tables: [],
    activity_status: [],
    follow_up_required: undefined,
    overdue_only: false
  })
  
  const pagination = ref<TimelinePagination>({
    page: 1,
    limit: defaultPageSize,
    total: 0,
    total_pages: 0,
    has_next: false,
    has_previous: false
  })
  
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const selectedEntry = ref<PrincipalTimelineEntry | null>(null)
  const viewMode = ref<'list' | 'grouped' | 'compact'>('grouped')
  
  const sortConfig = ref<{
    field: 'activity_date' | 'timeline_rank' | 'activity_type'
    order: 'asc' | 'desc'
  }>({
    field: 'activity_date',
    order: 'desc'
  })
  
  // Cache for timeline entries
  const timelineCache = new Map<string, {
    entries: PrincipalTimelineEntry[]
    timestamp: Date
  }>()
  
  // ============================
  // COMPUTED PROPERTIES
  // ============================
  
  const hasActiveFilters = computed(() => {
    const currentFilters = filters.value
    return !!(
      currentFilters.activity_types?.length ||
      currentFilters.search ||
      currentFilters.principal_ids?.length ||
      currentFilters.source_tables?.length ||
      currentFilters.activity_status?.length ||
      currentFilters.follow_up_required !== null ||
      currentFilters.overdue_only ||
      (currentFilters.date_range?.start && currentFilters.date_range?.end)
    )
  })
  
  const filteredEntryCount = computed(() => {
    return timelineEntries.value.length
  })
  
  const activityTypeDistribution = computed(() => {
    const distribution: { [K in TimelineActivityType]: { count: number; percentage: number; color: string; icon: string } } = {
      CONTACT_UPDATE: { count: 0, percentage: 0, color: 'blue', icon: 'user-edit' },
      INTERACTION: { count: 0, percentage: 0, color: 'green', icon: 'chat' },
      OPPORTUNITY_CREATED: { count: 0, percentage: 0, color: 'purple', icon: 'trending-up' },
      PRODUCT_ASSOCIATION: { count: 0, percentage: 0, color: 'orange', icon: 'package' }
    }
    
    const total = timelineEntries.value.length
    
    timelineEntries.value.forEach(entry => {
      distribution[entry.activity_type].count++
    })
    
    Object.keys(distribution).forEach(type => {
      const key = type as TimelineActivityType
      distribution[key].percentage = total > 0 ? (distribution[key].count / total) * 100 : 0
      distribution[key].icon = TIMELINE_ACTIVITY_ICONS[key]
    })
    
    return distribution
  })
  
  const timelineSummary = computed(() => {
    const entries = timelineEntries.value
    const totalEntries = entries.length
    const uniquePrincipals = new Set(entries.map(e => e.principal_id)).size
    
    let startDate: Date | null = null
    let endDate: Date | null = null
    
    if (entries.length > 0) {
      const dates = entries.map(e => new Date(e.activity_date)).sort()
      startDate = dates[0]
      endDate = dates[dates.length - 1]
    }
    
    // Find most active day
    const dayActivity = entries.reduce((acc, entry) => {
      const day = new Date(entry.activity_date).toDateString()
      acc[day] = (acc[day] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const mostActiveDay = Object.entries(dayActivity).reduce(
      (max, [date, count]) => count > max.count ? { date, count } : max,
      { date: '', count: 0 }
    )
    
    // Calculate activity trend (simplified)
    const recent = entries.filter(e => {
      const entryDate = new Date(e.activity_date)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return entryDate >= weekAgo
    }).length
    
    const previous = entries.filter(e => {
      const entryDate = new Date(e.activity_date)
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return entryDate >= twoWeeksAgo && entryDate < weekAgo
    }).length
    
    let activityTrend: 'increasing' | 'stable' | 'decreasing' = 'stable'
    if (recent > previous * 1.1) activityTrend = 'increasing'
    else if (recent < previous * 0.9) activityTrend = 'decreasing'
    
    return {
      total_entries: totalEntries,
      unique_principals: uniquePrincipals,
      date_range: { start: startDate, end: endDate },
      most_active_day: mostActiveDay,
      activity_trend: activityTrend
    }
  })
  
  const followUpEntries = computed(() => {
    return timelineEntries.value.filter(entry => entry.follow_up_required === true)
  })
  
  const overdueEntries = computed(() => {
    const now = new Date()
    return timelineEntries.value.filter(entry => {
      if (!entry.follow_up_required || !entry.follow_up_date) return false
      return new Date(entry.follow_up_date) < now
    })
  })
  
  const recentActivity = computed(() => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return timelineEntries.value
      .filter(entry => new Date(entry.activity_date) >= weekAgo)
      .sort((a, b) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime())
      .slice(0, 10)
  })
  
  // ============================
  // UTILITY FUNCTIONS
  // ============================
  
  const getCacheKey = (principalIds: string[]): string => {
    return `timeline_${principalIds.sort().join('_')}`
  }
  
  const getCachedTimeline = (key: string): PrincipalTimelineEntry[] | null => {
    if (!enableCaching) return null
    
    const cached = timelineCache.get(key)
    if (!cached) return null
    
    const isExpired = Date.now() - cached.timestamp.getTime() > cacheDuration
    if (isExpired) {
      timelineCache.delete(key)
      return null
    }
    
    return cached.entries
  }
  
  const setCachedTimeline = (key: string, entries: PrincipalTimelineEntry[]): void => {
    if (!enableCaching) return
    
    timelineCache.set(key, {
      entries: [...entries],
      timestamp: new Date()
    })
  }
  
  const applyFilters = (entries: PrincipalTimelineEntry[]): PrincipalTimelineEntry[] => {
    let filtered = [...entries]
    const currentFilters = filters.value
    
    // Filter by activity types
    if (currentFilters.activity_types?.length) {
      filtered = filtered.filter(entry => 
        currentFilters.activity_types!.includes(entry.activity_type)
      )
    }
    
    // Filter by search query
    if (currentFilters.search) {
      const searchLower = currentFilters.search.toLowerCase()
      filtered = filtered.filter(entry => 
        entry.activity_subject.toLowerCase().includes(searchLower) ||
        entry.activity_details.toLowerCase().includes(searchLower) ||
        entry.principal_name.toLowerCase().includes(searchLower)
      )
    }
    
    // Filter by principal IDs
    if (currentFilters.principal_ids?.length) {
      filtered = filtered.filter(entry => 
        currentFilters.principal_ids!.includes(entry.principal_id)
      )
    }
    
    // Filter by source tables
    if (currentFilters.source_tables?.length) {
      filtered = filtered.filter(entry => 
        currentFilters.source_tables!.includes(entry.source_table)
      )
    }
    
    // Filter by activity status
    if (currentFilters.activity_status?.length) {
      filtered = filtered.filter(entry => 
        currentFilters.activity_status!.includes(entry.activity_status)
      )
    }
    
    // Filter by follow-up requirement
    if (currentFilters.follow_up_required !== null) {
      filtered = filtered.filter(entry => 
        entry.follow_up_required === currentFilters.follow_up_required
      )
    }
    
    // Filter for overdue entries only
    if (currentFilters.overdue_only) {
      const now = new Date()
      filtered = filtered.filter(entry => {
        if (!entry.follow_up_required || !entry.follow_up_date) return false
        return new Date(entry.follow_up_date) < now
      })
    }
    
    // Filter by date range
    if (currentFilters.date_range?.start && currentFilters.date_range?.end) {
      const startDate = new Date(currentFilters.date_range.start)
      const endDate = new Date(currentFilters.date_range.end)
      endDate.setHours(23, 59, 59, 999) // Include full end date
      
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.activity_date)
        return entryDate >= startDate && entryDate <= endDate
      })
    }
    
    return filtered
  }
  
  const createTimelineGroups = (entries: PrincipalTimelineEntry[]): TimelineGroup[] => {
    if (!groupByDate || viewMode.value !== 'grouped') return []
    
    const groups = new Map<string, TimelineGroup>()
    
    entries.forEach(entry => {
      const entryDate = new Date(entry.activity_date)
      const groupId = entryDate.toDateString()
      const label = formatActivityDate(entry.activity_date, 'long')
      
      if (!groups.has(groupId)) {
        groups.set(groupId, {
          group_id: groupId,
          label,
          date: entryDate,
          entries: [],
          count: 0,
          summary: {
            interactions: 0,
            opportunities: 0,
            contacts: 0,
            products: 0
          }
        })
      }
      
      const group = groups.get(groupId)!
      group.entries.push(entry)
      group.count++
      
      // Update summary
      switch (entry.activity_type) {
        case 'INTERACTION':
          group.summary.interactions++
          break
        case 'OPPORTUNITY_CREATED':
          group.summary.opportunities++
          break
        case 'CONTACT_UPDATE':
          group.summary.contacts++
          break
        case 'PRODUCT_ASSOCIATION':
          group.summary.products++
          break
      }
    })
    
    return Array.from(groups.values()).sort((a, b) => b.date.getTime() - a.date.getTime())
  }
  
  const sortTimelineEntries = (entries: PrincipalTimelineEntry[]): PrincipalTimelineEntry[] => {
    const { field, order } = sortConfig.value
    
    return [...entries].sort((a, b) => {
      let comparison = 0
      
      switch (field) {
        case 'activity_date':
          comparison = new Date(a.activity_date).getTime() - new Date(b.activity_date).getTime()
          break
        case 'timeline_rank':
          comparison = a.timeline_rank - b.timeline_rank
          break
        case 'activity_type':
          comparison = a.activity_type.localeCompare(b.activity_type)
          break
      }
      
      return order === 'desc' ? -comparison : comparison
    })
  }
  
  const updatePagination = (total: number): void => {
    const current = pagination.value
    current.total = total
    current.total_pages = Math.ceil(total / current.limit)
    current.has_next = current.page < current.total_pages
    current.has_previous = current.page > 1
  }
  
  const paginateEntries = (entries: PrincipalTimelineEntry[]): PrincipalTimelineEntry[] => {
    const { page, limit } = pagination.value
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    
    updatePagination(entries.length)
    return entries.slice(startIndex, endIndex)
  }
  
  // ============================
  // TIMELINE MANAGEMENT FUNCTIONS
  // ============================
  
  const loadTimelineForPrincipal = async (principalId: string): Promise<void> => {
    return loadTimelineForPrincipals([principalId])
  }
  
  const loadTimelineForPrincipals = async (principalIds: string[]): Promise<void> => {
    const cacheKey = getCacheKey(principalIds)
    const cached = getCachedTimeline(cacheKey)
    
    if (cached) {
      processTimelineEntries(cached)
      return
    }
    
    isLoading.value = true
    error.value = null
    
    try {
      // Simulate API call - in real implementation, this would call the API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mock timeline data
      const mockEntries: PrincipalTimelineEntry[] = principalIds.flatMap(principalId => 
        Array.from({ length: Math.floor(Math.random() * 20) + 5 }, (_, i) => ({
          principal_id: principalId,
          principal_name: `Principal ${principalId.slice(-4)}`,
          activity_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          activity_type: ['CONTACT_UPDATE', 'INTERACTION', 'OPPORTUNITY_CREATED', 'PRODUCT_ASSOCIATION'][Math.floor(Math.random() * 4)] as TimelineActivityType,
          activity_subject: `Activity ${i + 1}`,
          activity_details: `Details for activity ${i + 1}`,
          source_id: `source_${i}`,
          source_table: ['contacts', 'interactions', 'opportunities', 'products'][Math.floor(Math.random() * 4)],
          opportunity_name: Math.random() > 0.5 ? `Opportunity ${i}` : null,
          contact_name: Math.random() > 0.5 ? `Contact ${i}` : null,
          product_name: Math.random() > 0.5 ? `Product ${i}` : null,
          created_by: 'user_1',
          activity_status: 'completed',
          follow_up_required: Math.random() > 0.7,
          follow_up_date: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : null,
          timeline_rank: i + 1
        }))
      )
      
      setCachedTimeline(cacheKey, mockEntries)
      processTimelineEntries(mockEntries)
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load timeline'
      console.error('Timeline loading error:', err)
    } finally {
      isLoading.value = false
    }
  }
  
  const loadAllTimeline = async (): Promise<void> => {
    isLoading.value = true
    error.value = null
    
    try {
      // Simulate API call for all timeline entries
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock all timeline data
      const mockEntries: PrincipalTimelineEntry[] = Array.from({ length: 100 }, (_, i) => ({
        principal_id: `principal_${Math.floor(i / 10) + 1}`,
        principal_name: `Principal ${Math.floor(i / 10) + 1}`,
        activity_date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
        activity_type: ['CONTACT_UPDATE', 'INTERACTION', 'OPPORTUNITY_CREATED', 'PRODUCT_ASSOCIATION'][Math.floor(Math.random() * 4)] as TimelineActivityType,
        activity_subject: `Activity ${i + 1}`,
        activity_details: `Details for activity ${i + 1}`,
        source_id: `source_${i}`,
        source_table: ['contacts', 'interactions', 'opportunities', 'products'][Math.floor(Math.random() * 4)],
        opportunity_name: Math.random() > 0.5 ? `Opportunity ${i}` : null,
        contact_name: Math.random() > 0.5 ? `Contact ${i}` : null,
        product_name: Math.random() > 0.5 ? `Product ${i}` : null,
        created_by: 'user_1',
        activity_status: 'completed',
        follow_up_required: Math.random() > 0.7,
        follow_up_date: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : null,
        timeline_rank: i + 1
      }))
      
      processTimelineEntries(mockEntries)
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load timeline'
      console.error('Timeline loading error:', err)
    } finally {
      isLoading.value = false
    }
  }
  
  const refreshTimeline = async (): Promise<void> => {
    timelineCache.clear()
    await loadAllTimeline()
  }
  
  const addTimelineEntry = async (entry: Omit<PrincipalTimelineEntry, 'timeline_rank'>): Promise<void> => {
    isLoading.value = true
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const newEntry: PrincipalTimelineEntry = {
        ...entry,
        timeline_rank: timelineEntries.value.length + 1
      }
      
      timelineEntries.value.unshift(newEntry)
      processTimelineEntries(timelineEntries.value)
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add timeline entry'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const updateTimelineEntry = async (entryId: string, updates: Partial<PrincipalTimelineEntry>): Promise<void> => {
    isLoading.value = true
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const index = timelineEntries.value.findIndex(entry => entry.source_id === entryId)
      if (index !== -1) {
        timelineEntries.value[index] = { ...timelineEntries.value[index], ...updates }
        processTimelineEntries(timelineEntries.value)
      }
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update timeline entry'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const deleteTimelineEntry = async (entryId: string): Promise<void> => {
    isLoading.value = true
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const filtered = timelineEntries.value.filter(entry => entry.source_id !== entryId)
      processTimelineEntries(filtered)
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete timeline entry'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const processTimelineEntries = (entries: PrincipalTimelineEntry[]): void => {
    // Apply filters
    const filtered = applyFilters(entries)
    
    // Sort entries
    const sorted = sortTimelineEntries(filtered)
    
    // Apply pagination
    const paginated = paginateEntries(sorted)
    
    // Update reactive state
    timelineEntries.value = paginated
    
    // Create groups if needed
    if (viewMode.value === 'grouped') {
      groupedTimeline.value = createTimelineGroups(paginated)
    } else {
      groupedTimeline.value = []
    }
  }
  
  // ============================
  // FILTERING AND SEARCH FUNCTIONS
  // ============================
  
  const updateFilters = (newFilters: Partial<TimelineFilter>): void => {
    Object.assign(filters.value, newFilters)
    pagination.value.page = 1 // Reset to first page
    
    // Reprocess current entries with new filters
    const allEntries = Array.from(timelineCache.values()).flatMap(cached => cached.entries)
    if (allEntries.length > 0) {
      processTimelineEntries(allEntries)
    }
  }
  
  const clearFilters = (): void => {
    filters.value = {
      activity_types: [],
      date_range: { start: null, end: null },
      search: '',
      principal_ids: [],
      source_tables: [],
      activity_status: [],
      follow_up_required: undefined,
      overdue_only: false
    }
    
    pagination.value.page = 1
    
    // Reprocess entries without filters
    const allEntries = Array.from(timelineCache.values()).flatMap(cached => cached.entries)
    if (allEntries.length > 0) {
      processTimelineEntries(allEntries)
    }
  }
  
  const searchTimeline = debounce((query: string): void => {
    updateFilters({ search: query })
  }, 300)
  
  const filterByActivityType = (types: TimelineActivityType[]): void => {
    updateFilters({ activity_types: types })
  }
  
  const filterByDateRange = (start: Date | null, end: Date | null): void => {
    updateFilters({ date_range: { start, end } })
  }
  
  const filterByFollowUp = (required: boolean | null, overdueOnly = false): void => {
    updateFilters({ 
      follow_up_required: required || undefined,
      overdue_only: overdueOnly
    })
  }
  
  const getEntriesForDate = (date: Date): PrincipalTimelineEntry[] => {
    const targetDate = date.toDateString()
    return timelineEntries.value.filter(entry => 
      new Date(entry.activity_date).toDateString() === targetDate
    )
  }
  
  // ============================
  // GROUPING AND SORTING FUNCTIONS
  // ============================
  
  const toggleGrouping = (): void => {
    viewMode.value = viewMode.value === 'grouped' ? 'list' : 'grouped'
    
    // Reprocess entries with new view mode
    const allEntries = Array.from(timelineCache.values()).flatMap(cached => cached.entries)
    if (allEntries.length > 0) {
      processTimelineEntries(allEntries)
    }
  }
  
  const groupBy = (criteria: 'date' | 'activity_type' | 'principal' | 'source'): void => {
    // This would implement different grouping strategies
    // For now, we only support date grouping
    if (criteria === 'date') {
      viewMode.value = 'grouped'
      
      const allEntries = Array.from(timelineCache.values()).flatMap(cached => cached.entries)
      if (allEntries.length > 0) {
        processTimelineEntries(allEntries)
      }
    }
  }
  
  const updateSort = (
    field: 'activity_date' | 'timeline_rank' | 'activity_type', 
    order?: 'asc' | 'desc'
  ): void => {
    sortConfig.value.field = field
    
    if (order) {
      sortConfig.value.order = order
    } else {
      // Toggle order if same field
      if (sortConfig.value.field === field) {
        sortConfig.value.order = sortConfig.value.order === 'asc' ? 'desc' : 'asc'
      } else {
        sortConfig.value.order = 'desc'
      }
    }
    
    // Reprocess entries with new sort
    const allEntries = Array.from(timelineCache.values()).flatMap(cached => cached.entries)
    if (allEntries.length > 0) {
      processTimelineEntries(allEntries)
    }
  }
  
  const sortTimeline = (): void => {
    const allEntries = Array.from(timelineCache.values()).flatMap(cached => cached.entries)
    if (allEntries.length > 0) {
      processTimelineEntries(allEntries)
    }
  }
  
  // ============================
  // PAGINATION FUNCTIONS
  // ============================
  
  const goToPage = async (page: number): Promise<void> => {
    if (page < 1 || page > pagination.value.total_pages) return
    
    pagination.value.page = page
    
    const allEntries = Array.from(timelineCache.values()).flatMap(cached => cached.entries)
    if (allEntries.length > 0) {
      processTimelineEntries(allEntries)
    }
  }
  
  const nextPage = async (): Promise<void> => {
    if (pagination.value.has_next) {
      await goToPage(pagination.value.page + 1)
    }
  }
  
  const previousPage = async (): Promise<void> => {
    if (pagination.value.has_previous) {
      await goToPage(pagination.value.page - 1)
    }
  }
  
  const updatePageSize = async (size: number): Promise<void> => {
    pagination.value.limit = size
    pagination.value.page = 1
    
    const allEntries = Array.from(timelineCache.values()).flatMap(cached => cached.entries)
    if (allEntries.length > 0) {
      processTimelineEntries(allEntries)
    }
  }
  
  // ============================
  // SELECTION AND INTERACTION FUNCTIONS
  // ============================
  
  const selectEntry = (entry: PrincipalTimelineEntry): void => {
    selectedEntry.value = entry
  }
  
  const clearSelection = (): void => {
    selectedEntry.value = null
  }
  
  const markForFollowUp = async (entryId: string, followUpDate: Date, notes?: string): Promise<void> => {
    await updateTimelineEntry(entryId, {
      follow_up_required: true,
      follow_up_date: followUpDate.toISOString(),
      activity_details: notes ? `${notes}\n\nFollow-up scheduled for ${followUpDate.toDateString()}` : undefined
    })
  }
  
  const completeFollowUp = async (entryId: string, notes?: string): Promise<void> => {
    await updateTimelineEntry(entryId, {
      follow_up_required: false,
      follow_up_date: null,
      activity_status: 'completed',
      activity_details: notes ? `${notes}\n\nFollow-up completed on ${new Date().toDateString()}` : undefined
    })
  }
  
  // ============================
  // EXPORT AND SHARING FUNCTIONS
  // ============================
  
  const exportToCsv = (includeFilters = false): string => {
    const headers = [
      'Principal Name',
      'Activity Date',
      'Activity Type',
      'Subject',
      'Details',
      'Follow-up Required',
      'Follow-up Date'
    ]
    
    const rows = timelineEntries.value.map(entry => [
      entry.principal_name,
      formatActivityDate(entry.activity_date, 'short'),
      entry.activity_type,
      entry.activity_subject,
      entry.activity_details,
      entry.follow_up_required ? 'Yes' : 'No',
      entry.follow_up_date ? formatActivityDate(entry.follow_up_date, 'short') : ''
    ])
    
    let csv = headers.join(',') + '\n'
    csv += rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    
    if (includeFilters && hasActiveFilters.value) {
      csv += '\n\nFilters Applied:\n'
      const filterInfo = Object.entries(filters.value)
        .filter(([_, value]) => value && (Array.isArray(value) ? value.length > 0 : true))
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`)
      csv += filterInfo.join('\n')
    }
    
    return csv
  }
  
  const exportToJson = (includeFilters = false): string => {
    const data = {
      timeline_entries: timelineEntries.value,
      summary: timelineSummary.value,
      export_date: new Date().toISOString()
    }
    
    if (includeFilters && hasActiveFilters.value) {
      Object.assign(data, { applied_filters: filters.value })
    }
    
    return JSON.stringify(data, null, 2)
  }
  
  const generateReport = (format: 'summary' | 'detailed') => {
    const summary = timelineSummary.value
    
    if (format === 'summary') {
      return {
        title: 'Principal Timeline Summary Report',
        content: `
          Total Entries: ${summary.total_entries}
          Unique Principals: ${summary.unique_principals}
          Date Range: ${summary.date_range.start?.toDateString()} - ${summary.date_range.end?.toDateString()}
          Most Active Day: ${summary.most_active_day.date} (${summary.most_active_day.count} activities)
          Activity Trend: ${summary.activity_trend}
          
          Follow-ups Required: ${followUpEntries.value.length}
          Overdue Follow-ups: ${overdueEntries.value.length}
        `,
        metadata: {
          generated_at: new Date().toISOString(),
          entry_count: summary.total_entries,
          principal_count: summary.unique_principals
        }
      }
    } else {
      return {
        title: 'Principal Timeline Detailed Report',
        content: timelineEntries.value
          .map(entry => `
            ${formatActivityDate(entry.activity_date, 'long')} - ${entry.principal_name}
            Type: ${entry.activity_type}
            Subject: ${entry.activity_subject}
            Details: ${entry.activity_details}
            Follow-up: ${entry.follow_up_required ? 'Required' : 'Not required'}
            ${entry.follow_up_date ? `Due: ${formatActivityDate(entry.follow_up_date, 'short')}` : ''}
          `)
          .join('\n---\n'),
        metadata: {
          generated_at: new Date().toISOString(),
          entry_count: timelineEntries.value.length,
          filters_applied: hasActiveFilters.value ? filters.value : null
        }
      }
    }
  }
  
  const getShareableUrl = (): string => {
    const params = new URLSearchParams()
    
    if (filters.value.activity_types?.length) {
      params.set('types', filters.value.activity_types.join(','))
    }
    
    if (filters.value.search) {
      params.set('search', filters.value.search)
    }
    
    if (filters.value.date_range?.start && filters.value.date_range?.end) {
      params.set('start', filters.value.date_range.start.toISOString().split('T')[0])
      params.set('end', filters.value.date_range.end.toISOString().split('T')[0])
    }
    
    params.set('sort', sortConfig.value.field)
    params.set('order', sortConfig.value.order)
    params.set('view', viewMode.value)
    
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`
  }
  
  // ============================
  // UTILITY FUNCTIONS
  // ============================
  
  const formatActivityDate = (date: string, format: 'short' | 'long' | 'relative' = 'short'): string => {
    const activityDate = new Date(date)
    
    switch (format) {
      case 'short':
        return activityDate.toLocaleDateString()
      case 'long':
        return activityDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      case 'relative':
        const now = new Date()
        const diffMs = now.getTime() - activityDate.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        
        if (diffDays === 0) return 'Today'
        if (diffDays === 1) return 'Yesterday'
        if (diffDays < 7) return `${diffDays} days ago`
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
        return `${Math.floor(diffDays / 365)} years ago`
      default:
        return activityDate.toLocaleDateString()
    }
  }
  
  const getActivityIcon = (activityType: TimelineActivityType): string => {
    return TIMELINE_ACTIVITY_ICONS[activityType]
  }
  
  const getActivityColor = (activityType: TimelineActivityType): string => {
    const colors = {
      CONTACT_UPDATE: 'blue',
      INTERACTION: 'green',
      OPPORTUNITY_CREATED: 'purple',
      PRODUCT_ASSOCIATION: 'orange'
    }
    return colors[activityType]
  }
  
  const getTimeDifference = (date: string) => {
    const activityDate = new Date(date)
    const now = new Date()
    const diffMs = Math.abs(now.getTime() - activityDate.getTime())
    
    const minutes = Math.floor(diffMs / (1000 * 60))
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const months = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30))
    
    if (months > 0) return { value: months, unit: 'months' as const, label: `${months} month${months > 1 ? 's' : ''} ago` }
    if (days > 0) return { value: days, unit: 'days' as const, label: `${days} day${days > 1 ? 's' : ''} ago` }
    if (hours > 0) return { value: hours, unit: 'hours' as const, label: `${hours} hour${hours > 1 ? 's' : ''} ago` }
    return { value: minutes, unit: 'minutes' as const, label: `${minutes} minute${minutes > 1 ? 's' : ''} ago` }
  }
  
  const isOverdue = (entry: PrincipalTimelineEntry): boolean => {
    if (!entry.follow_up_required || !entry.follow_up_date) return false
    return new Date(entry.follow_up_date) < new Date()
  }
  
  const clearCache = (): void => {
    timelineCache.clear()
  }
  
  // ============================
  // AUTO-REFRESH SETUP
  // ============================
  
  let refreshTimer: NodeJS.Timeout | null = null
  
  if (realTimeUpdates && refreshInterval > 0) {
    refreshTimer = setInterval(() => {
      if (timelineEntries.value.length > 0) {
        refreshTimeline()
      }
    }, refreshInterval)
  }
  
  // ============================
  // CLEANUP
  // ============================
  
  const cleanup = () => {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
    clearCache()
  }
  
  // Cleanup on unmount
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', cleanup)
  }
  
  // ============================
  // RETURN INTERFACE
  // ============================
  
  return {
    // Reactive state
    timelineEntries,
    groupedTimeline,
    filters,
    pagination,
    isLoading,
    error,
    selectedEntry,
    viewMode,
    sortConfig,
    
    // Computed properties
    hasActiveFilters,
    filteredEntryCount,
    activityTypeDistribution,
    timelineSummary,
    followUpEntries,
    overdueEntries,
    recentActivity,
    
    // Timeline management
    loadTimelineForPrincipal,
    loadTimelineForPrincipals,
    loadAllTimeline,
    refreshTimeline,
    addTimelineEntry,
    updateTimelineEntry,
    deleteTimelineEntry,
    
    // Filtering and search
    updateFilters,
    clearFilters,
    searchTimeline,
    filterByActivityType,
    filterByDateRange,
    filterByFollowUp,
    getEntriesForDate,
    
    // Grouping and sorting
    toggleGrouping,
    groupBy,
    updateSort,
    sortTimeline,
    
    // Pagination
    goToPage,
    nextPage,
    previousPage,
    updatePageSize,
    
    // Selection and interaction
    selectEntry,
    clearSelection,
    markForFollowUp,
    completeFollowUp,
    
    // Export and sharing
    exportToCsv,
    exportToJson,
    generateReport,
    getShareableUrl,
    
    // Utility functions
    formatActivityDate,
    getActivityIcon,
    getActivityColor,
    getTimeDifference,
    isOverdue,
    clearCache
  }
}

/**
 * Default export for convenience
 */
export default usePrincipalTimeline