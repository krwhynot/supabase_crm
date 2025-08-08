import { ref, computed, type Ref } from 'vue'
import type { 
  PrincipalActivitySummary,
  PrincipalAnalytics,
  PrincipalMetricsSummary,
  PrincipalActivityStatus,
  PrincipalFilters
} from '@/types/principal'
import { ACTIVITY_STATUS_CONFIG } from '@/types/principal'
import type { Enums } from '@/types/database.types'

/**
 * =============================================================================
 * PRINCIPAL ANALYTICS COMPOSABLE - KPI CALCULATION & METRICS AGGREGATION
 * =============================================================================
 * 
 * Provides comprehensive analytics and KPI calculations for Principal Activity
 * management with real-time metrics aggregation, trend analysis, and
 * performance tracking optimized for dashboard display.
 */

export interface UsePrincipalAnalyticsOptions {
  /**
   * Auto-refresh interval in milliseconds - defaults to 30000 (30 seconds)
   */
  refreshInterval?: number
  
  /**
   * Enable real-time metric calculations - defaults to true
   */
  realTimeCalculations?: boolean
  
  /**
   * Cache duration for expensive calculations in milliseconds - defaults to 300000 (5 minutes)
   */
  cacheDuration?: number
  
  /**
   * Enable performance monitoring - defaults to false
   */
  enablePerformanceMonitoring?: boolean
  
  /**
   * Time zones for date calculations - defaults to 'UTC'
   */
  timeZone?: string
  
  /**
   * Fiscal year start month (1-12) - defaults to 1 (January)
   */
  fiscalYearStart?: number
}

export interface UsePrincipalAnalyticsReturn {
  // ============================
  // REACTIVE STATE
  // ============================
  
  /** Current analytics data */
  analytics: Ref<PrincipalAnalytics | null>
  
  /** Quick metrics summary for widgets */
  metricsSummary: Ref<PrincipalMetricsSummary | null>
  
  /** Loading state for analytics operations */
  isLoading: Ref<boolean>
  
  /** Error state for analytics calculations */
  error: Ref<string | null>
  
  /** Last calculation timestamp */
  lastCalculated: Ref<Date | null>
  
  /** Performance metrics */
  performanceMetrics: Ref<{
    calculationTime: number
    dataSize: number
    cacheHitRate: number
  }>
  
  // ============================
  // COMPUTED PROPERTIES
  // ============================
  
  /** Activity status distribution percentages */
  activityDistribution: Ref<{
    [K in PrincipalActivityStatus]: {
      count: number
      percentage: number
      color: string
      label: string
    }
  }>
  
  /** Engagement score distribution */
  engagementDistribution: Ref<{
    low: { count: number; percentage: number }
    medium: { count: number; percentage: number }
    high: { count: number; percentage: number }
  }>
  
  /** Top performing principals */
  topPerformers: Ref<Array<{
    principal_id: string
    principal_name: string
    engagement_score: number
    rank: number
    total_opportunities: number
    won_opportunities: number
    total_revenue: number
  }>>
  
  /** Geographic performance breakdown */
  geographicPerformance: Ref<Array<{
    country: string
    principal_count: number
    avg_engagement_score: number
    total_opportunities: number
    conversion_rate: number
  }>>
  
  /** Product category performance */
  productCategoryPerformance: Ref<Array<{
    category: Enums<'product_category'>
    principal_count: number
    avg_engagement_score: number
    total_opportunities: number
    won_opportunities: number
  }>>
  
  /** Monthly trend analysis */
  monthlyTrends: Ref<Array<{
    month: string
    new_principals: number
    active_principals: number
    opportunities_created: number
    interactions_count: number
    engagement_trend: 'increasing' | 'stable' | 'decreasing'
  }>>
  
  /** Key performance indicators */
  kpiMetrics: Ref<{
    total_revenue_potential: number
    active_opportunity_count: number
    pending_follow_ups: number
    overdue_activities: number
    engagement_trend: 'increasing' | 'stable' | 'decreasing'
    conversion_rate: number
    avg_opportunity_value: number
    top_activity_status: PrincipalActivityStatus
  }>
  
  // ============================
  // CALCULATION FUNCTIONS
  // ============================
  
  /** Calculate analytics from principal data */
  calculateAnalytics: (principals: PrincipalActivitySummary[]) => Promise<void>
  
  /** Calculate filtered analytics based on criteria */
  calculateFilteredAnalytics: (
    principals: PrincipalActivitySummary[],
    filters: PrincipalFilters
  ) => Promise<void>
  
  /** Recalculate all metrics */
  refreshAnalytics: () => Promise<void>
  
  /** Calculate engagement score trends */
  calculateEngagementTrends: (
    principals: PrincipalActivitySummary[],
    timeframe: 'week' | 'month' | 'quarter' | 'year'
  ) => Array<{
    period: string
    avg_score: number
    principal_count: number
    trend: 'up' | 'down' | 'stable'
  }>
  
  /** Calculate opportunity conversion funnel */
  calculateConversionFunnel: (principals: PrincipalActivitySummary[]) => Array<{
    stage: string
    count: number
    conversion_rate: number
    drop_off_rate: number
  }>
  
  /** Calculate ROI metrics */
  calculateROIMetrics: (principals: PrincipalActivitySummary[]) => {
    total_investment: number
    total_revenue: number
    roi_percentage: number
    payback_period_months: number
  }
  
  // ============================
  // COMPARISON FUNCTIONS
  // ============================
  
  /** Compare current period vs previous period */
  comparePerformance: (
    current: PrincipalActivitySummary[],
    previous: PrincipalActivitySummary[]
  ) => {
    engagement_change: number
    opportunity_change: number
    principal_growth: number
    activity_change: number
  }
  
  /** Benchmark against industry standards */
  benchmarkPerformance: (analytics: PrincipalAnalytics) => {
    engagement_benchmark: 'above' | 'at' | 'below'
    opportunity_benchmark: 'above' | 'at' | 'below'
    activity_benchmark: 'above' | 'at' | 'below'
    overall_score: number
  }
  
  // ============================
  // EXPORT FUNCTIONS
  // ============================
  
  /** Export analytics data as CSV */
  exportToCsv: () => string
  
  /** Export analytics data as JSON */
  exportToJson: () => string
  
  /** Generate executive summary report */
  generateExecutiveSummary: () => {
    overview: string
    key_metrics: string[]
    recommendations: string[]
    action_items: string[]
  }
  
  // ============================
  // UTILITY FUNCTIONS
  // ============================
  
  /** Format number for display */
  formatNumber: (value: number, type: 'currency' | 'percentage' | 'integer' | 'decimal') => string
  
  /** Get color for metric value */
  getMetricColor: (value: number, thresholds: { low: number; high: number }) => string
  
  /** Calculate growth rate */
  calculateGrowthRate: (current: number, previous: number) => number
  
  /** Clear all cached calculations */
  clearCache: () => void
  
  /** Get calculation performance stats */
  getPerformanceStats: () => {
    total_calculations: number
    avg_calculation_time: number
    cache_efficiency: number
    last_calculation: Date | null
  }
}

/**
 * Principal Analytics Composable Implementation
 */
export function usePrincipalAnalytics(
  options: UsePrincipalAnalyticsOptions = {}
): UsePrincipalAnalyticsReturn {
  
  // ============================
  // OPTIONS PROCESSING
  // ============================
  
  const {
    refreshInterval = 30000,
    realTimeCalculations = true,
    cacheDuration = 300000,
    enablePerformanceMonitoring = false,
    // timeZone = 'UTC', // TODO: Implement timezone support
    // fiscalYearStart = 1 // TODO: Implement fiscal year calculations
  } = options
  
  // ============================
  // REACTIVE STATE INITIALIZATION
  // ============================
  
  const analytics = ref<PrincipalAnalytics | null>(null)
  const metricsSummary = ref<PrincipalMetricsSummary | null>(null)
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const lastCalculated = ref<Date | null>(null)
  const performanceMetrics = ref({
    calculationTime: 0,
    dataSize: 0,
    cacheHitRate: 0
  })
  
  // Cache for expensive calculations
  const calculationCache = new Map<string, {
    data: any
    timestamp: Date
    hits: number
  }>()
  
  let performanceStats = {
    totalCalculations: 0,
    totalCalculationTime: 0,
    cacheHits: 0,
    cacheMisses: 0
  }
  
  // ============================
  // COMPUTED PROPERTIES
  // ============================
  
  const activityDistribution = computed(() => {
    if (!analytics.value) {
      return {
        NO_ACTIVITY: { count: 0, percentage: 0, color: 'gray', label: 'No Activity' },
        STALE: { count: 0, percentage: 0, color: 'red', label: 'Stale' },
        MODERATE: { count: 0, percentage: 0, color: 'yellow', label: 'Moderate' },
        ACTIVE: { count: 0, percentage: 0, color: 'green', label: 'Active' }
      }
    }
    
    const distribution = analytics.value.activity_status_distribution
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0)
    
    return {
      NO_ACTIVITY: {
        count: distribution.NO_ACTIVITY,
        percentage: total > 0 ? (distribution.NO_ACTIVITY / total) * 100 : 0,
        color: ACTIVITY_STATUS_CONFIG.NO_ACTIVITY.color,
        label: ACTIVITY_STATUS_CONFIG.NO_ACTIVITY.label
      },
      STALE: {
        count: distribution.STALE,
        percentage: total > 0 ? (distribution.STALE / total) * 100 : 0,
        color: ACTIVITY_STATUS_CONFIG.STALE.color,
        label: ACTIVITY_STATUS_CONFIG.STALE.label
      },
      MODERATE: {
        count: distribution.MODERATE,
        percentage: total > 0 ? (distribution.MODERATE / total) * 100 : 0,
        color: ACTIVITY_STATUS_CONFIG.MODERATE.color,
        label: ACTIVITY_STATUS_CONFIG.MODERATE.label
      },
      ACTIVE: {
        count: distribution.ACTIVE,
        percentage: total > 0 ? (distribution.ACTIVE / total) * 100 : 0,
        color: ACTIVITY_STATUS_CONFIG.ACTIVE.color,
        label: ACTIVITY_STATUS_CONFIG.ACTIVE.label
      }
    }
  })
  
  const engagementDistribution = computed(() => {
    if (!analytics.value) {
      return {
        low: { count: 0, percentage: 0 },
        medium: { count: 0, percentage: 0 },
        high: { count: 0, percentage: 0 }
      }
    }
    
    // This would be calculated from the raw data during analytics calculation
    // For now, we'll return a placeholder structure
    // const total = analytics.value.total_principals // TODO: Use for actual calculations
    
    return {
      low: { count: 0, percentage: 0 },
      medium: { count: 0, percentage: 0 },
      high: { count: 0, percentage: 0 }
    }
  })
  
  const topPerformers = computed(() => {
    if (!analytics.value?.top_performers) return []
    
    return analytics.value.top_performers.map((performer, index) => ({
      ...performer,
      rank: index + 1
    }))
  })
  
  const geographicPerformance = computed(() => {
    if (!analytics.value?.geographic_distribution) return []
    
    return analytics.value.geographic_distribution.map(geo => ({
      ...geo,
      conversion_rate: geo.total_opportunities > 0 
        ? (geo.total_opportunities * 0.25) // Placeholder calculation
        : 0
    }))
  })
  
  const productCategoryPerformance = computed(() => {
    if (!analytics.value?.product_category_distribution) return []
    
    return Object.entries(analytics.value.product_category_distribution).map(([category, count]) => ({
      category: category as Enums<'product_category'>,
      principal_count: count,
      avg_engagement_score: 0, // Would be calculated from raw data
      total_opportunities: 0, // Would be calculated from raw data
      won_opportunities: 0 // Would be calculated from raw data
    }))
  })
  
  const monthlyTrends = computed(() => {
    if (!analytics.value?.monthly_activity_trend) return []
    
    return analytics.value.monthly_activity_trend.map((trend, index, array) => {
      const previous = array[index - 1]
      let engagement_trend: 'increasing' | 'stable' | 'decreasing' = 'stable'
      
      if (previous) {
        const currentTotal = trend.active_principals + trend.opportunities_created
        const previousTotal = previous.active_principals + previous.opportunities_created
        
        if (currentTotal > previousTotal * 1.05) {
          engagement_trend = 'increasing'
        } else if (currentTotal < previousTotal * 0.95) {
          engagement_trend = 'decreasing'
        }
      }
      
      return {
        ...trend,
        engagement_trend
      }
    })
  })
  
  const kpiMetrics = computed(() => {
    if (!analytics.value || !metricsSummary.value) {
      return {
        total_revenue_potential: 0,
        active_opportunity_count: 0,
        pending_follow_ups: 0,
        overdue_activities: 0,
        engagement_trend: 'stable' as const,
        conversion_rate: 0,
        avg_opportunity_value: 0,
        top_activity_status: 'NO_ACTIVITY' as PrincipalActivityStatus
      }
    }
    
    const distribution = analytics.value.activity_status_distribution
    const topStatus = Object.entries(distribution).reduce((max, [status, count]) => 
      count > max.count ? { status: status as PrincipalActivityStatus, count } : max,
      { status: 'NO_ACTIVITY' as PrincipalActivityStatus, count: 0 }
    )
    
    return {
      total_revenue_potential: 0, // Would be calculated from opportunities
      active_opportunity_count: analytics.value.principals_with_opportunities,
      pending_follow_ups: metricsSummary.value.pending_follow_ups,
      overdue_activities: 0, // Would be calculated from interactions
      engagement_trend: 'stable' as const, // Would be calculated from trends
      conversion_rate: analytics.value.principals_with_opportunities > 0 
        ? (analytics.value.principals_with_opportunities / analytics.value.total_principals) * 100
        : 0,
      avg_opportunity_value: 0, // Would be calculated from opportunity values
      top_activity_status: topStatus.status
    }
  })
  
  // ============================
  // UTILITY FUNCTIONS
  // ============================
  
  const getCacheKey = (operation: string, params: any): string => {
    return `${operation}_${JSON.stringify(params)}`
  }
  
  const getCachedResult = <T>(key: string): T | null => {
    const cached = calculationCache.get(key)
    if (!cached) {
      performanceStats.cacheMisses++
      return null
    }
    
    const isExpired = Date.now() - cached.timestamp.getTime() > cacheDuration
    if (isExpired) {
      calculationCache.delete(key)
      performanceStats.cacheMisses++
      return null
    }
    
    cached.hits++
    performanceStats.cacheHits++
    return cached.data as T
  }
  
  const setCachedResult = (key: string, data: any): void => {
    calculationCache.set(key, {
      data,
      timestamp: new Date(),
      hits: 0
    })
  }
  
  const measurePerformance = async <T>(
    _operation: string, // Parameter available for future performance logging
    fn: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now()
    
    try {
      const result = await fn()
      const endTime = performance.now()
      const duration = endTime - startTime
      
      if (enablePerformanceMonitoring) {
        performanceStats.totalCalculations++
        performanceStats.totalCalculationTime += duration
        performanceMetrics.value.calculationTime = duration
      }
      
      return result
    } catch (err) {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      if (enablePerformanceMonitoring) {
        performanceStats.totalCalculations++
        performanceStats.totalCalculationTime += duration
      }
      
      throw err
    }
  }
  
  // ============================
  // CALCULATION FUNCTIONS
  // ============================
  
  const calculateAnalytics = async (principals: PrincipalActivitySummary[]): Promise<void> => {
    const cacheKey = getCacheKey('analytics', principals.length)
    const cached = getCachedResult<PrincipalAnalytics>(cacheKey)
    
    if (cached && realTimeCalculations) {
      analytics.value = cached
      return
    }
    
    isLoading.value = true
    error.value = null
    
    try {
      const result = await measurePerformance('calculateAnalytics', async () => {
        // Basic analytics calculations
        const totalPrincipals = principals.length
        const activePrincipals = principals.filter(p => p.activity_status === 'ACTIVE').length
        const principalsWithProducts = principals.filter(p => p.product_count > 0).length
        const principalsWithOpportunities = principals.filter(p => p.total_opportunities > 0).length
        
        const avgProductsPerPrincipal = totalPrincipals > 0 
          ? principals.reduce((sum, p) => sum + p.product_count, 0) / totalPrincipals
          : 0
        
        const avgEngagementScore = totalPrincipals > 0
          ? principals.reduce((sum, p) => sum + p.engagement_score, 0) / totalPrincipals
          : 0
        
        // Activity status distribution
        const activityStatusDistribution = {
          NO_ACTIVITY: principals.filter(p => p.activity_status === 'NO_ACTIVITY').length,
          STALE: principals.filter(p => p.activity_status === 'STALE').length,
          MODERATE: principals.filter(p => p.activity_status === 'MODERATE').length,
          ACTIVE: principals.filter(p => p.activity_status === 'ACTIVE').length
        }
        
        // Top performers
        const topPerformersList = principals
          .sort((a, b) => b.engagement_score - a.engagement_score)
          .slice(0, 10)
          .map(p => ({
            principal_id: p.principal_id,
            principal_name: p.principal_name,
            engagement_score: p.engagement_score,
            total_opportunities: p.total_opportunities,
            won_opportunities: p.won_opportunities,
            total_revenue: 0 // Would need revenue data
          }))
        
        // Product category distribution
        const productCategoryDistribution: { [K in Enums<'product_category'>]: number } = {
          'Protein': 0,
          'Sauce': 0,
          'Seasoning': 0,
          'Beverage': 0,
          'Snack': 0,
          'Frozen': 0,
          'Dairy': 0,
          'Bakery': 0,
          'Other': 0
        }
        
        // Count principals by primary product category
        principals.forEach(p => {
          if (p.primary_product_category) {
            productCategoryDistribution[p.primary_product_category]++
          }
        })
        
        // Geographic distribution
        const geographicDistribution = principals.reduce((acc, p) => {
          const country = 'Unknown' // Would extract from principal data
          const existing = acc.find(g => g.country === country)
          
          if (existing) {
            existing.principal_count++
            existing.total_opportunities += p.total_opportunities
            existing.avg_engagement_score = (existing.avg_engagement_score + p.engagement_score) / 2
          } else {
            acc.push({
              country,
              principal_count: 1,
              total_opportunities: p.total_opportunities,
              avg_engagement_score: p.engagement_score
            })
          }
          
          return acc
        }, [] as Array<{
          country: string
          principal_count: number
          total_opportunities: number
          avg_engagement_score: number
        }>)
        
        // Monthly activity trend (placeholder - would need historical data)
        const monthlyActivityTrend = Array.from({ length: 12 }, (_, i) => ({
          month: new Date(2024, i).toLocaleString('default', { month: 'long' }),
          new_principals: Math.floor(Math.random() * 10),
          active_principals: Math.floor(activePrincipals * Math.random()),
          opportunities_created: Math.floor(Math.random() * 50),
          interactions_count: Math.floor(Math.random() * 100)
        }))
        
        const analyticsResult: PrincipalAnalytics = {
          total_principals: totalPrincipals,
          active_principals: activePrincipals,
          principals_with_products: principalsWithProducts,
          principals_with_opportunities: principalsWithOpportunities,
          average_products_per_principal: avgProductsPerPrincipal,
          average_engagement_score: avgEngagementScore,
          top_performers: topPerformersList,
          activity_status_distribution: activityStatusDistribution,
          product_category_distribution: productCategoryDistribution,
          monthly_activity_trend: monthlyActivityTrend,
          geographic_distribution: geographicDistribution
        }
        
        return analyticsResult
      })
      
      analytics.value = result
      
      // Calculate metrics summary
      metricsSummary.value = {
        total_principals: result.total_principals,
        active_this_month: result.active_principals,
        top_engagement_score: Math.max(...principals.map(p => p.engagement_score)),
        opportunities_created_this_month: principals.reduce((sum, p) => sum + p.opportunities_last_30_days, 0),
        interactions_this_week: principals.reduce((sum, p) => sum + p.interactions_last_30_days, 0) / 4, // Rough weekly estimate
        pending_follow_ups: principals.reduce((sum, p) => sum + p.follow_ups_required, 0)
      }
      
      setCachedResult(cacheKey, result)
      lastCalculated.value = new Date()
      performanceMetrics.value.dataSize = principals.length
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Analytics calculation failed'
      console.error('Principal analytics calculation error:', err)
    } finally {
      isLoading.value = false
    }
  }
  
  const calculateFilteredAnalytics = async (
    principals: PrincipalActivitySummary[],
    filters: PrincipalFilters
  ): Promise<void> => {
    // Apply filters to principals first
    let filteredPrincipals = [...principals]
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filteredPrincipals = filteredPrincipals.filter(p => 
        p.principal_name.toLowerCase().includes(searchLower) ||
        p.industry?.toLowerCase().includes(searchLower) ||
        p.primary_contact_name?.toLowerCase().includes(searchLower)
      )
    }
    
    if (filters.activity_status?.length) {
      filteredPrincipals = filteredPrincipals.filter(p => 
        filters.activity_status!.includes(p.activity_status)
      )
    }
    
    if (filters.organization_status?.length) {
      filteredPrincipals = filteredPrincipals.filter(p => 
        p.principal_status && filters.organization_status!.includes(p.principal_status)
      )
    }
    
    if (filters.has_opportunities !== null) {
      filteredPrincipals = filteredPrincipals.filter(p => 
        filters.has_opportunities ? p.total_opportunities > 0 : p.total_opportunities === 0
      )
    }
    
    if (filters.has_products !== null) {
      filteredPrincipals = filteredPrincipals.filter(p => 
        filters.has_products ? p.product_count > 0 : p.product_count === 0
      )
    }
    
    if (filters.engagement_score_range) {
      const { min, max } = filters.engagement_score_range
      filteredPrincipals = filteredPrincipals.filter(p => 
        p.engagement_score >= min && p.engagement_score <= max
      )
    }
    
    // Calculate analytics for filtered data
    await calculateAnalytics(filteredPrincipals)
  }
  
  const refreshAnalytics = async (): Promise<void> => {
    // This would typically refetch data from the API
    // For now, we'll just clear the cache and recalculate
    calculationCache.clear()
    
    if (analytics.value) {
      // Re-trigger calculation with current data
      // In a real implementation, this would fetch fresh data
      isLoading.value = true
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      isLoading.value = false
      lastCalculated.value = new Date()
    }
  }
  
  const calculateEngagementTrends = (
    principals: PrincipalActivitySummary[],
    timeframe: 'week' | 'month' | 'quarter' | 'year'
  ) => {
    // This would require historical data - returning placeholder for now
    const periods = timeframe === 'week' ? 4 : timeframe === 'month' ? 12 : timeframe === 'quarter' ? 4 : 5
    
    return Array.from({ length: periods }, (_, i) => ({
      period: `Period ${i + 1}`,
      avg_score: 50 + Math.random() * 40,
      principal_count: principals.length + Math.floor(Math.random() * 20 - 10),
      trend: Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down' as 'up' | 'down' | 'stable'
    }))
  }
  
  const calculateConversionFunnel = (principals: PrincipalActivitySummary[]) => {
    const stages = [
      'Initial Contact',
      'Qualified Lead',
      'Opportunity Created',
      'Demo/Sample',
      'Proposal',
      'Closed Won'  
    ]
    
    let previousCount = principals.length
    
    return stages.map((stage, _index) => {
      const dropOffRate = 0.2 + Math.random() * 0.3 // Simulated drop-off
      const currentCount = Math.floor(previousCount * (1 - dropOffRate))
      const conversionRate = previousCount > 0 ? (currentCount / previousCount) * 100 : 0
      
      const result = {
        stage,
        count: currentCount,
        conversion_rate: conversionRate,
        drop_off_rate: dropOffRate * 100
      }
      
      previousCount = currentCount
      return result
    })
  }
  
  const calculateROIMetrics = (principals: PrincipalActivitySummary[]) => {
    // Placeholder calculations - would need actual cost and revenue data
    const totalInvestment = principals.length * 1000 // $1000 per principal investment
    const totalRevenue = principals.reduce((sum, p) => sum + (p.won_opportunities * 5000), 0) // $5000 per won opportunity
    const roi = totalInvestment > 0 ? ((totalRevenue - totalInvestment) / totalInvestment) * 100 : 0
    const paybackPeriod = totalRevenue > 0 ? (totalInvestment / (totalRevenue / 12)) : 0 // Months
    
    return {
      total_investment: totalInvestment,
      total_revenue: totalRevenue,
      roi_percentage: roi,
      payback_period_months: paybackPeriod
    }
  }
  
  // ============================
  // COMPARISON FUNCTIONS
  // ============================
  
  const comparePerformance = (
    current: PrincipalActivitySummary[],
    previous: PrincipalActivitySummary[]
  ) => {
    const currentAvgEngagement = current.reduce((sum, p) => sum + p.engagement_score, 0) / current.length
    const previousAvgEngagement = previous.reduce((sum, p) => sum + p.engagement_score, 0) / previous.length
    
    const currentOpportunities = current.reduce((sum, p) => sum + p.total_opportunities, 0)
    const previousOpportunities = previous.reduce((sum, p) => sum + p.total_opportunities, 0)
    
    return {
      engagement_change: calculateGrowthRate(currentAvgEngagement, previousAvgEngagement),
      opportunity_change: calculateGrowthRate(currentOpportunities, previousOpportunities),
      principal_growth: calculateGrowthRate(current.length, previous.length),
      activity_change: 0 // Would calculate from activity metrics
    }
  }
  
  const benchmarkPerformance = (analytics: PrincipalAnalytics) => {
    // Industry benchmark thresholds (placeholder values)
    const benchmarks = {
      engagement_score: { low: 40, high: 70 },
      opportunity_rate: { low: 0.2, high: 0.5 },
      activity_rate: { low: 0.3, high: 0.6 }
    }
    
    const engagementBenchmark = analytics.average_engagement_score > benchmarks.engagement_score.high 
      ? 'above' : analytics.average_engagement_score < benchmarks.engagement_score.low ? 'below' : 'at'
    
    const opportunityRate = analytics.principals_with_opportunities / analytics.total_principals
    const opportunityBenchmark = opportunityRate > benchmarks.opportunity_rate.high
      ? 'above' : opportunityRate < benchmarks.opportunity_rate.low ? 'below' : 'at'
      
    const activityRate = analytics.active_principals / analytics.total_principals
    const activityBenchmark = activityRate > benchmarks.activity_rate.high
      ? 'above' : activityRate < benchmarks.activity_rate.low ? 'below' : 'at'
    
    const overallScore = [engagementBenchmark, opportunityBenchmark, activityBenchmark]
      .reduce((score, benchmark) => {
        return score + (benchmark === 'above' ? 2 : benchmark === 'at' ? 1 : 0)
      }, 0) / 3 * 50 // Convert to 0-100 scale
    
    return {
      engagement_benchmark: engagementBenchmark as 'above' | 'at' | 'below',
      opportunity_benchmark: opportunityBenchmark as 'above' | 'at' | 'below',
      activity_benchmark: activityBenchmark as 'above' | 'at' | 'below',
      overall_score: overallScore
    }
  }
  
  // ============================
  // EXPORT FUNCTIONS
  // ============================
  
  const exportToCsv = (): string => {
    if (!analytics.value) return ''
    
    const csvRows = [
      'Metric,Value',
      `Total Principals,${analytics.value.total_principals}`,
      `Active Principals,${analytics.value.active_principals}`,
      `Average Engagement Score,${analytics.value.average_engagement_score}`,
      `Principals with Products,${analytics.value.principals_with_products}`,
      `Principals with Opportunities,${analytics.value.principals_with_opportunities}`
    ]
    
    return csvRows.join('\n')
  }
  
  const exportToJson = (): string => {
    return JSON.stringify({
      analytics: analytics.value,
      metrics_summary: metricsSummary.value,
      last_calculated: lastCalculated.value
    }, null, 2)
  }
  
  const generateExecutiveSummary = () => {
    if (!analytics.value || !metricsSummary.value) {
      return {
        overview: 'No data available for executive summary',
        key_metrics: [],
        recommendations: [],
        action_items: []
      }
    }
    
    const overview = `Currently tracking ${analytics.value.total_principals} principals with an average engagement score of ${analytics.value.average_engagement_score.toFixed(1)}. ${analytics.value.active_principals} principals are actively engaged.`
    
    const keyMetrics = [
      `${analytics.value.total_principals} total principals`,
      `${analytics.value.active_principals} active principals`,
      `${analytics.value.average_engagement_score.toFixed(1)} average engagement score`,
      `${analytics.value.principals_with_opportunities} principals have opportunities`
    ]
    
    const recommendations = [
      analytics.value.activity_status_distribution.STALE > analytics.value.active_principals 
        ? 'Focus on re-engaging stale principals' 
        : 'Maintain current engagement levels',
      analytics.value.average_engagement_score < 50 
        ? 'Implement engagement improvement strategies' 
        : 'Continue current engagement strategies'
    ]
    
    const actionItems = [
      'Review stale principal list for re-engagement opportunities',
      'Analyze top performers for best practice replication',
      'Schedule quarterly engagement review meetings'
    ]
    
    return {
      overview,
      key_metrics: keyMetrics,
      recommendations,
      action_items: actionItems
    }
  }
  
  // ============================
  // UTILITY FUNCTIONS
  // ============================
  
  const formatNumber = (value: number, type: 'currency' | 'percentage' | 'integer' | 'decimal'): string => {
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
      case 'percentage':
        return `${value.toFixed(1)}%`
      case 'integer':
        return Math.round(value).toLocaleString()
      case 'decimal':
        return value.toFixed(2)
      default:
        return String(value)
    }
  }
  
  const getMetricColor = (value: number, thresholds: { low: number; high: number }): string => {
    if (value >= thresholds.high) return 'green'
    if (value <= thresholds.low) return 'red'
    return 'yellow'
  }
  
  const calculateGrowthRate = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }
  
  const clearCache = () => {
    calculationCache.clear()
    performanceStats = {
      totalCalculations: 0,
      totalCalculationTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    }
  }
  
  const getPerformanceStats = () => {
    const avgCalculationTime = performanceStats.totalCalculations > 0 
      ? performanceStats.totalCalculationTime / performanceStats.totalCalculations 
      : 0
    
    const cacheEfficiency = (performanceStats.cacheHits + performanceStats.cacheMisses) > 0
      ? (performanceStats.cacheHits / (performanceStats.cacheHits + performanceStats.cacheMisses)) * 100
      : 0
    
    performanceMetrics.value.cacheHitRate = cacheEfficiency
    
    return {
      total_calculations: performanceStats.totalCalculations,
      avg_calculation_time: avgCalculationTime,
      cache_efficiency: cacheEfficiency,
      last_calculation: lastCalculated.value
    }
  }
  
  // ============================
  // AUTO-REFRESH SETUP
  // ============================
  
  let refreshTimer: NodeJS.Timeout | null = null
  
  if (realTimeCalculations && refreshInterval > 0) {
    refreshTimer = setInterval(() => {
      if (analytics.value) {
        refreshAnalytics()
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
    analytics,
    metricsSummary,
    isLoading,
    error,
    lastCalculated,
    performanceMetrics,
    
    // Computed properties
    activityDistribution,
    engagementDistribution,
    topPerformers,
    geographicPerformance,
    productCategoryPerformance,
    monthlyTrends,
    kpiMetrics,
    
    // Calculation functions
    calculateAnalytics,
    calculateFilteredAnalytics,
    refreshAnalytics,
    calculateEngagementTrends,
    calculateConversionFunnel,
    calculateROIMetrics,
    
    // Comparison functions
    comparePerformance,
    benchmarkPerformance,
    
    // Export functions
    exportToCsv,
    exportToJson,
    generateExecutiveSummary,
    
    // Utility functions
    formatNumber,
    getMetricColor,
    calculateGrowthRate,
    clearCache,
    getPerformanceStats
  }
}

/**
 * Default export for convenience
 */
export default usePrincipalAnalytics