/**
 * Dashboard Store - Centralized KPI Aggregation and Dashboard Management
 * Aggregates metrics from all other stores to provide comprehensive dashboard view
 * Follows Pinia Composition API patterns with reactive state management
 */

import { defineStore } from 'pinia'
import { ref, computed, reactive, watch } from 'vue'
import { useOpportunityStore } from './opportunityStore'
import { useProductStore } from './productStore'
import { useOrganizationStore } from './organizationStore'
import { usePrincipalStore } from './principalStore'
import type { OpportunityKPIs, OpportunityStage } from '@/types/opportunities'
import type { ProductCategory } from '@/types/products'
import type { OrganizationMetrics } from '@/types/organizations'
import type { PrincipalStats } from './principalStore'

/**
 * Dashboard time period filters
 */
export interface DashboardTimeFilter {
  period: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
  startDate?: Date
  endDate?: Date
}

/**
 * Consolidated dashboard KPIs interface
 */
export interface DashboardKPIs {
  // Overview metrics
  totalOpportunities: number
  totalProducts: number
  totalOrganizations: number
  totalPrincipals: number
  
  // Pipeline metrics
  activePipeline: number
  pipelineValue: number
  wonThisMonth: number
  conversionRate: number
  averageDealSize: number
  
  // Growth metrics
  monthlyGrowthRate: number
  newOpportunitiesThisWeek: number
  newOrganizationsThisMonth: number
  recentActivityCount: number
  
  // Performance indicators
  averageLeadScore: number
  averageDaysToClose: number
  topPerformingCategory: ProductCategory | null
  mostActiveOrganizationType: string | null
  
  // Distribution metrics
  opportunityStageDistribution: { [K in OpportunityStage]: number }
  productCategoryDistribution: { [K in ProductCategory]: number }
  organizationStatusDistribution: { [key: string]: number }
  principalProductDistribution: Array<{
    principalName: string
    productCount: number
    opportunityCount: number
  }>
}

/**
 * Recent activity aggregation
 */
export interface DashboardActivity {
  id: string
  type: 'opportunity' | 'product' | 'organization' | 'principal'
  action: 'created' | 'updated' | 'completed' | 'assigned'
  title: string
  description: string
  timestamp: Date
  entityId: string
  entityName: string
  userId?: string
  userName?: string
}

/**
 * Dashboard performance metrics
 */
export interface DashboardPerformance {
  // Velocity metrics
  averageTimeToClose: number
  averageResponseTime: number
  dealsClosedThisMonth: number
  
  // Efficiency metrics
  opportunityConversionRate: number
  principalEngagementRate: number
  productAdoptionRate: number
  
  // Growth indicators
  monthOverMonthGrowth: number
  quarterOverQuarterGrowth: number
  yearOverYearGrowth: number
  
  // Predictive metrics
  forecastedRevenue: number
  probabilityWeightedPipeline: number
  expectedCloseThisQuarter: number
}

/**
 * Dashboard filters and preferences
 */
export interface DashboardFilters {
  timeFilter: DashboardTimeFilter
  organizationTypes: string[]
  opportunityStages: OpportunityStage[]
  productCategories: ProductCategory[]
  showInactiveItems: boolean
  refreshInterval: number // minutes
}

/**
 * User interface preferences
 */
export interface DashboardPreferences {
  sidebarCollapsed: boolean
  weekFilterEnabled: boolean
  autoRefresh: boolean
  theme: 'light' | 'dark' | 'system'
}

/**
 * Store state interface for type safety
 */
interface DashboardStoreState {
  // Core KPI data
  kpis: DashboardKPIs | null
  performance: DashboardPerformance | null
  recentActivity: DashboardActivity[]
  
  // UI state
  loading: boolean
  refreshing: boolean
  error: string | null
  
  // Data freshness
  lastUpdated: Date | null
  lastRefresh: Date | null
  
  // User preferences
  filters: DashboardFilters
  preferences: DashboardPreferences
  autoRefresh: boolean
  
  // Cache management
  cacheExpiryMinutes: number
  isDataStale: boolean
}

export const useDashboardStore = defineStore('dashboard', () => {
  // ===============================
  // STORE DEPENDENCIES
  // ===============================
  
  const opportunityStore = useOpportunityStore()
  const productStore = useProductStore()
  const organizationStore = useOrganizationStore()
  const principalStore = usePrincipalStore()
  
  // ===============================
  // STATE MANAGEMENT
  // ===============================
  
  const state = reactive<DashboardStoreState>({
    // Core KPI data
    kpis: null,
    performance: null,
    recentActivity: [],
    
    // UI state
    loading: false,
    refreshing: false,
    error: null,
    
    // Data freshness
    lastUpdated: null,
    lastRefresh: null,
    
    // User preferences
    filters: {
      timeFilter: {
        period: 'month'
      },
      organizationTypes: [],
      opportunityStages: [],
      productCategories: [],
      showInactiveItems: false,
      refreshInterval: 5 // 5 minutes default
    },
    preferences: {
      sidebarCollapsed: false,
      weekFilterEnabled: false,
      autoRefresh: true,
      theme: 'light'
    },
    autoRefresh: true,
    
    // Cache management
    cacheExpiryMinutes: 10,
    isDataStale: false
  })
  
  // Auto-refresh timer
  const autoRefreshTimer = ref<NodeJS.Timeout | null>(null)
  
  // ===============================
  // COMPUTED PROPERTIES
  // ===============================
  
  /**
   * Aggregated KPIs from all stores
   */
  const aggregatedKPIs = computed((): DashboardKPIs | null => {
    const oppKPIs = opportunityStore.kpis
    const prodStats = productStore.stats
    const orgMetrics = organizationStore.dashboardMetrics
    const princStats = principalStore.stats
    
    if (!oppKPIs || !prodStats || !orgMetrics || !princStats) {
      return null
    }
    
    return {
      // Overview metrics
      totalOpportunities: oppKPIs.total_opportunities,
      totalProducts: prodStats.total_products,
      totalOrganizations: orgMetrics.totalOrganizations,
      totalPrincipals: princStats.total_principals,
      
      // Pipeline metrics
      activePipeline: oppKPIs.active_opportunities,
      pipelineValue: oppKPIs.total_pipeline_value,
      wonThisMonth: oppKPIs.won_this_month,
      conversionRate: oppKPIs.conversion_rate,
      averageDealSize: oppKPIs.total_pipeline_value / Math.max(oppKPIs.total_opportunities, 1),
      
      // Growth metrics
      monthlyGrowthRate: orgMetrics.monthlyGrowth,
      newOpportunitiesThisWeek: oppKPIs.created_this_week,
      newOrganizationsThisMonth: calculateNewOrganizationsThisMonth(orgMetrics),
      recentActivityCount: oppKPIs.created_this_week + oppKPIs.updated_this_week,
      
      // Performance indicators
      averageLeadScore: orgMetrics.averageLeadScore,
      averageDaysToClose: oppKPIs.average_days_to_close,
      topPerformingCategory: prodStats.most_common_category,
      mostActiveOrganizationType: getMostActiveOrganizationType(orgMetrics),
      
      // Distribution metrics
      opportunityStageDistribution: oppKPIs.stage_distribution,
      productCategoryDistribution: prodStats.products_by_category,
      organizationStatusDistribution: getOrganizationStatusDistribution(orgMetrics),
      principalProductDistribution: getPrincipalProductDistribution(princStats)
    }
  })
  
  /**
   * Performance metrics calculation
   */
  const performanceMetrics = computed((): DashboardPerformance | null => {
    const oppKPIs = opportunityStore.kpis
    const orgMetrics = organizationStore.dashboardMetrics
    const princStats = principalStore.stats
    
    if (!oppKPIs || !orgMetrics || !princStats) {
      return null
    }
    
    return {
      // Velocity metrics
      averageTimeToClose: oppKPIs.average_days_to_close,
      averageResponseTime: calculateAverageResponseTime(),
      dealsClosedThisMonth: oppKPIs.won_this_month,
      
      // Efficiency metrics
      opportunityConversionRate: oppKPIs.conversion_rate,
      principalEngagementRate: calculatePrincipalEngagementRate(princStats),
      productAdoptionRate: calculateProductAdoptionRate(),
      
      // Growth indicators
      monthOverMonthGrowth: orgMetrics.monthlyGrowth,
      quarterOverQuarterGrowth: calculateQuarterOverQuarterGrowth(),
      yearOverYearGrowth: calculateYearOverYearGrowth(),
      
      // Predictive metrics
      forecastedRevenue: calculateForecastedRevenue(oppKPIs),
      probabilityWeightedPipeline: calculateProbabilityWeightedPipeline(oppKPIs),
      expectedCloseThisQuarter: calculateExpectedCloseThisQuarter(oppKPIs)
    }
  })
  
  /**
   * Recent activity aggregation from all stores
   */
  const recentActivityFeed = computed((): DashboardActivity[] => {
    const activities: DashboardActivity[] = []
    
    // Aggregate opportunity activities
    const opportunities = opportunityStore.opportunities.slice(0, 5)
    opportunities.forEach(opp => {
      activities.push({
        id: `opp-${opp.id}`,
        type: 'opportunity',
        action: 'created',
        title: `New Opportunity: ${opp.name}`,
        description: `${opp.stage} - ${opp.organization_name}`,
        timestamp: new Date(opp.created_at),
        entityId: opp.id,
        entityName: opp.name,
        userName: opp.deal_owner || undefined
      })
    })
    
    // Aggregate organization activities
    const organizations = organizationStore.organizations.slice(0, 3)
    organizations.forEach(org => {
      activities.push({
        id: `org-${org.id}`,
        type: 'organization',
        action: 'created',
        title: `New Organization: ${org.name}`,
        description: `${org.type || 'Unknown'} - ${org.industry || 'Unknown Industry'}`,
        timestamp: new Date(org.created_at || new Date()),
        entityId: org.id,
        entityName: org.name
      })
    })
    
    // Sort by most recent first and limit to 20 items
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20)
  })
  
  /**
   * Data freshness indicator
   */
  const isDataFresh = computed((): boolean => {
    if (!state.lastUpdated) return false
    
    const now = new Date()
    const diffMinutes = (now.getTime() - state.lastUpdated.getTime()) / (1000 * 60)
    return diffMinutes < state.cacheExpiryMinutes
  })
  
  /**
   * Loading state aggregation
   */
  const isAnyStoreLoading = computed((): boolean => {
    return opportunityStore.loading || 
           productStore.loading || 
           (typeof organizationStore.loading === 'boolean' 
             ? organizationStore.loading 
             : Object.values(organizationStore.loading).some(Boolean)) || 
           principalStore.loading
  })
  
  // ===============================
  // HELPER FUNCTIONS
  // ===============================
  
  function calculateNewOrganizationsThisMonth(metrics: OrganizationMetrics): number {
    // Extract from recent activity data
    const currentMonth = new Date().getMonth()
    return metrics.recentActivity
      .filter(activity => new Date(activity.date).getMonth() === currentMonth)
      .reduce((sum, activity) => sum + activity.organizationsAdded, 0)
  }
  
  function getMostActiveOrganizationType(metrics: OrganizationMetrics): string | null {
    if (!metrics.statusDistribution.length) return null
    
    const mostActive = metrics.statusDistribution.reduce((prev, current) => 
      current.count > prev.count ? current : prev
    )
    return mostActive.status
  }
  
  function getOrganizationStatusDistribution(metrics: OrganizationMetrics): { [key: string]: number } {
    const distribution: { [key: string]: number } = {}
    metrics.statusDistribution.forEach(item => {
      distribution[item.status] = item.count
    })
    return distribution
  }
  
  function getPrincipalProductDistribution(stats: PrincipalStats): Array<{
    principalName: string
    productCount: number
    opportunityCount: number
  }> {
    return stats.top_organizations_by_principals.map(org => ({
      principalName: org.organization_name,
      productCount: Math.floor(Math.random() * 10) + 1, // Would come from actual data
      opportunityCount: Math.floor(Math.random() * 5) + 1 // Would come from actual data
    }))
  }
  
  function calculateAverageResponseTime(): number {
    // Would calculate from interaction data - placeholder for now
    return 2.5 // days
  }
  
  function calculatePrincipalEngagementRate(stats: PrincipalStats): number {
    return (stats.principals_with_opportunities / Math.max(stats.total_principals, 1)) * 100
  }
  
  function calculateProductAdoptionRate(): number {
    // Would calculate from product-opportunity relationships - placeholder
    return 65.5 // percentage
  }
  
  function calculateQuarterOverQuarterGrowth(): number {
    // Would calculate from historical data - placeholder
    return 12.3 // percentage
  }
  
  function calculateYearOverYearGrowth(): number {
    // Would calculate from historical data - placeholder
    return 28.7 // percentage
  }
  
  function calculateForecastedRevenue(kpis: OpportunityKPIs): number {
    // Calculate based on probability-weighted pipeline
    return kpis.total_pipeline_value * (kpis.conversion_rate / 100)
  }
  
  function calculateProbabilityWeightedPipeline(kpis: OpportunityKPIs): number {
    // Calculate weighted pipeline based on stage probabilities
    return kpis.total_pipeline_value * (kpis.average_probability / 100)
  }
  
  function calculateExpectedCloseThisQuarter(kpis: OpportunityKPIs): number {
    // Estimate based on current pipeline and historical patterns
    return kpis.total_pipeline_value * 0.25 // 25% of pipeline expected to close
  }
  
  // ===============================
  // ACTIONS
  // ===============================
  
  /**
   * Refresh all dashboard data
   */
  const refreshDashboard = async (): Promise<void> => {
    if (state.refreshing) return
    
    state.refreshing = true
    state.error = null
    
    try {
      // Refresh all dependent stores in parallel
      await Promise.all([
        opportunityStore.fetchKPIs(),
        productStore.fetchStats(),
        organizationStore.fetchDashboardMetrics(),
        principalStore.fetchStats()
      ])
      
      // Update aggregated data
      state.kpis = aggregatedKPIs.value
      state.performance = performanceMetrics.value
      state.recentActivity = recentActivityFeed.value
      
      state.lastRefresh = new Date()
      state.lastUpdated = new Date()
      state.isDataStale = false
      
    } catch (error) {
      console.error('Failed to refresh dashboard:', error)
      state.error = error instanceof Error ? error.message : 'Failed to refresh dashboard data'
    } finally {
      state.refreshing = false
    }
  }
  
  /**
   * Initialize dashboard data
   */
  const initializeDashboard = async (): Promise<void> => {
    if (state.loading) return
    
    state.loading = true
    state.error = null
    
    try {
      // Initialize all stores if needed
      await Promise.all([
        opportunityStore.fetchOpportunities(),
        productStore.fetchProducts(),
        organizationStore.fetchOrganizations(),
        principalStore.fetchPrincipals()
      ])
      
      // Initial KPI calculation
      await refreshDashboard()
      
    } catch (error) {
      console.error('Failed to initialize dashboard:', error)
      state.error = error instanceof Error ? error.message : 'Failed to initialize dashboard'
    } finally {
      state.loading = false
    }
  }
  
  /**
   * Update dashboard filters
   */
  const updateFilters = (newFilters: Partial<DashboardFilters>): void => {
    state.filters = { ...state.filters, ...newFilters }
    
    // Mark data as stale when filters change
    state.isDataStale = true
    
    // Refresh data with new filters
    refreshDashboard()
  }
  
  /**
   * Update time filter
   */
  const updateTimeFilter = (timeFilter: DashboardTimeFilter): void => {
    updateFilters({ timeFilter })
  }

  /**
   * Update user interface preferences
   */
  const updatePreferences = (newPreferences: Partial<DashboardPreferences>): void => {
    state.preferences = { ...state.preferences, ...newPreferences }
    
    // Sync autoRefresh state with preferences
    if (newPreferences.autoRefresh !== undefined) {
      state.autoRefresh = newPreferences.autoRefresh
      toggleAutoRefresh(newPreferences.autoRefresh)
    }
  }
  
  /**
   * Toggle auto-refresh
   */
  const toggleAutoRefresh = (enabled: boolean): void => {
    state.autoRefresh = enabled
    
    if (enabled) {
      startAutoRefresh()
    } else {
      stopAutoRefresh()
    }
  }
  
  /**
   * Start auto-refresh timer
   */
  const startAutoRefresh = (): void => {
    stopAutoRefresh() // Clear any existing timer
    
    if (state.autoRefresh && state.filters.refreshInterval > 0) {
      autoRefreshTimer.value = setInterval(() => {
        if (!state.refreshing && !state.loading) {
          refreshDashboard()
        }
      }, state.filters.refreshInterval * 60 * 1000) // Convert minutes to milliseconds
    }
  }
  
  /**
   * Stop auto-refresh timer
   */
  const stopAutoRefresh = (): void => {
    if (autoRefreshTimer.value) {
      clearInterval(autoRefreshTimer.value)
      autoRefreshTimer.value = null
    }
  }
  
  /**
   * Export dashboard data
   */
  const exportDashboard = async (format: 'json' | 'csv' = 'json'): Promise<string> => {
    const exportData = {
      timestamp: new Date().toISOString(),
      kpis: state.kpis,
      performance: state.performance,
      recentActivity: state.recentActivity,
      filters: state.filters
    }
    
    if (format === 'json') {
      return JSON.stringify(exportData, null, 2)
    } else {
      // Convert to CSV format - simplified implementation
      const csvRows = [
        'Metric,Value',
        `Total Opportunities,${state.kpis?.totalOpportunities || 0}`,
        `Total Products,${state.kpis?.totalProducts || 0}`,
        `Total Organizations,${state.kpis?.totalOrganizations || 0}`,
        `Pipeline Value,${state.kpis?.pipelineValue || 0}`,
        `Conversion Rate,${state.kpis?.conversionRate || 0}`,
        `Monthly Growth,${state.kpis?.monthlyGrowthRate || 0}`
      ]
      return csvRows.join('\n')
    }
  }
  
  /**
   * Reset dashboard to default state
   */
  const resetDashboard = (): void => {
    state.kpis = null
    state.performance = null
    state.recentActivity = []
    state.error = null
    state.lastUpdated = null
    state.lastRefresh = null
    state.isDataStale = false
    
    // Reset filters to defaults
    state.filters = {
      timeFilter: { period: 'month' },
      organizationTypes: [],
      opportunityStages: [],
      productCategories: [],
      showInactiveItems: false,
      refreshInterval: 5
    }
    
    // Reset preferences to defaults
    state.preferences = {
      sidebarCollapsed: false,
      weekFilterEnabled: false,
      autoRefresh: true,
      theme: 'light'
    }
    
    stopAutoRefresh()
  }
  
  // ===============================
  // WATCHERS
  // ===============================
  
  // Watch for changes in dependent stores and update KPIs
  watch(
    [
      () => opportunityStore.kpis,
      () => productStore.stats,
      () => organizationStore.dashboardMetrics,
      () => principalStore.stats
    ],
    () => {
      if (aggregatedKPIs.value) {
        state.kpis = aggregatedKPIs.value
        state.performance = performanceMetrics.value
        state.recentActivity = recentActivityFeed.value
        state.lastUpdated = new Date()
      }
    },
    { deep: true }
  )
  
  // Watch for data freshness
  watch(isDataFresh, (fresh) => {
    state.isDataStale = !fresh
  })
  
  // ===============================
  // LIFECYCLE
  // ===============================
  
  // Start auto-refresh when store is created
  if (state.autoRefresh) {
    startAutoRefresh()
  }
  
  // ===============================
  // RETURN PUBLIC API
  // ===============================
  
  return {
    // State
    kpis: computed(() => state.kpis),
    performance: computed(() => state.performance),
    recentActivity: computed(() => state.recentActivity),
    loading: computed(() => state.loading),
    refreshing: computed(() => state.refreshing),
    error: computed(() => state.error),
    lastUpdated: computed(() => state.lastUpdated),
    lastRefresh: computed(() => state.lastRefresh),
    filters: computed(() => state.filters),
    preferences: computed(() => state.preferences),
    autoRefresh: computed(() => state.autoRefresh),
    isDataStale: computed(() => state.isDataStale),
    isDataFresh,
    isAnyStoreLoading,
    
    // Computed aggregations
    aggregatedKPIs,
    performanceMetrics,
    recentActivityFeed,
    
    // Actions
    initializeDashboard,
    refreshDashboard,
    updateFilters,
    updateTimeFilter,
    updatePreferences,
    toggleAutoRefresh,
    exportDashboard,
    resetDashboard,
    
    // Internal methods for testing
    startAutoRefresh,
    stopAutoRefresh
  }
})

// Export types are already declared in the interface definitions above
// No need for duplicate export declarations