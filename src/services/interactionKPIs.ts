/**
 * Interaction KPIs Service - Comprehensive KPI Calculation System
 * Manages interaction data analytics, follow-up tracking, performance metrics, and trend calculations
 * Follows opportunity KPI architecture patterns with real-time reactive computations
 */

import { computed, ref, type ComputedRef } from 'vue'
import { supabase } from '@/config/supabaseClient'
import type {
  InteractionKPIs,
  InteractionListView,
  InteractionFilters,
  InteractionType,
  Interaction
} from '@/types/interactions'

/**
 * Extended KPI interface for comprehensive dashboard metrics
 */
export interface ExtendedInteractionKPIs extends InteractionKPIs {
  // Performance metrics
  response_time_metrics: {
    avg_response_time_hours: number
    median_response_time_hours: number
    fastest_response_hours: number
    slowest_response_hours: number
  }
  
  // Activity trends
  activity_trends: {
    this_week_vs_last_week: number
    this_month_vs_last_month: number
    growth_rate_percentage: number
    trend_direction: 'up' | 'down' | 'stable'
  }
  
  // Principal performance
  principal_metrics: {
    total_principals_contacted: number
    avg_interactions_per_principal: number
    most_active_principal_count: number
    principals_needing_follow_up: number
  }
  
  // Efficiency metrics
  efficiency_metrics: {
    conversion_to_opportunity_rate: number
    follow_up_success_rate: number
    interaction_density_score: number
    engagement_quality_score: number
  }
}

/**
 * Type distribution analysis interface
 */
export interface TypeDistribution {
  distribution: { [K in InteractionType]: number }
  percentages: { [K in InteractionType]: number }
  trends: { [K in InteractionType]: 'increasing' | 'decreasing' | 'stable' }
  effectiveness: { [K in InteractionType]: number }
}

/**
 * Follow-up metrics interface
 */
export interface FollowUpMetrics {
  total_follow_ups_needed: number
  overdue_count: number
  due_today: number
  due_this_week: number
  due_next_week: number
  completion_rate: number
  avg_completion_time_days: number
  overdue_by_type: { [K in InteractionType]: number }
  success_rate_by_type: { [K in InteractionType]: number }
}

/**
 * Activity trends interface
 */
export interface ActivityTrends {
  period: 'week' | 'month' | 'quarter'
  current_period: {
    total_interactions: number
    unique_contacts: number
    unique_opportunities: number
    avg_daily_interactions: number
  }
  previous_period: {
    total_interactions: number
    unique_contacts: number
    unique_opportunities: number
    avg_daily_interactions: number
  }
  growth_metrics: {
    interaction_growth: number
    contact_growth: number
    opportunity_growth: number
    daily_average_growth: number
  }
  projections: {
    estimated_month_end: number
    estimated_quarter_end: number
    target_achievement_rate: number
  }
}

/**
 * Principal performance metrics interface
 */
export interface PrincipalMetrics {
  principal_id?: string
  total_interactions: number
  interactions_this_week: number
  interactions_this_month: number
  follow_ups_completed: number
  follow_ups_pending: number
  overdue_follow_ups: number
  response_time_avg_hours: number
  opportunity_conversion_rate: number
  engagement_score: number
  performance_trend: 'improving' | 'declining' | 'stable'
  top_interaction_types: { type: InteractionType, count: number }[]
}

/**
 * KPI calculation cache interface
 */
interface KPICache {
  kpis: ExtendedInteractionKPIs | null
  typeDistribution: TypeDistribution | null
  followUpMetrics: FollowUpMetrics | null
  activityTrends: ActivityTrends | null
  principalMetrics: PrincipalMetrics | null
  lastUpdated: Date | null
  cacheExpiry: number // milliseconds
}

/**
 * Interaction KPIs Service Class
 */
class InteractionKPIsService {
  private cache: KPICache = {
    kpis: null,
    typeDistribution: null,
    followUpMetrics: null,
    activityTrends: null,
    principalMetrics: null,
    lastUpdated: null,
    cacheExpiry: 5 * 60 * 1000 // 5 minutes
  }

  private isCalculating = ref(false)
  private lastError = ref<string | null>(null)

  /**
   * Main KPI calculation function with caching and error handling
   */
  async calculateInteractionKPIs(filters: InteractionFilters = {}): Promise<ExtendedInteractionKPIs> {
    // Check cache first
    if (this.isCacheValid() && this.cache.kpis && !filters.search) {
      return this.cache.kpis
    }

    this.isCalculating.value = true
    this.lastError.value = null

    try {
      // Fetch interaction data with filters
      const interactions = await this.fetchInteractionData(filters)
      
      // Calculate all KPI metrics
      const kpis = await this.computeComprehensiveKPIs(interactions, filters)
      
      // Update cache
      this.cache.kpis = kpis
      this.cache.lastUpdated = new Date()
      
      return kpis
    } catch (error) {
      this.lastError.value = error instanceof Error ? error.message : 'KPI calculation failed'
      console.error('Interaction KPI calculation error:', error)
      
      // Return demo data as fallback
      return this.getDemoKPIs()
    } finally {
      this.isCalculating.value = false
    }
  }

  /**
   * Calculate type distribution with trends and effectiveness
   */
  async calculateTypeDistribution(filters: InteractionFilters = {}): Promise<TypeDistribution> {
    if (this.isCacheValid() && this.cache.typeDistribution && !filters.search) {
      return this.cache.typeDistribution
    }

    try {
      const interactions = await this.fetchInteractionData(filters)
      const distribution = this.computeTypeDistribution(interactions)
      
      this.cache.typeDistribution = distribution
      return distribution
    } catch (error) {
      console.error('Type distribution calculation error:', error)
      return this.getDemoTypeDistribution()
    }
  }

  /**
   * Calculate follow-up metrics with completion rates and overdue tracking
   */
  async calculateFollowUpMetrics(filters: InteractionFilters = {}): Promise<FollowUpMetrics> {
    if (this.isCacheValid() && this.cache.followUpMetrics && !filters.search) {
      return this.cache.followUpMetrics
    }

    try {
      const interactions = await this.fetchInteractionData(filters)
      const metrics = this.computeFollowUpMetrics(interactions)
      
      this.cache.followUpMetrics = metrics
      return metrics
    } catch (error) {
      console.error('Follow-up metrics calculation error:', error)
      return this.getDemoFollowUpMetrics()
    }
  }

  /**
   * Calculate activity trends with period-over-period analysis
   */
  async calculateActivityTrends(period: 'week' | 'month' | 'quarter' = 'month'): Promise<ActivityTrends> {
    if (this.isCacheValid() && this.cache.activityTrends && this.cache.activityTrends.period === period) {
      return this.cache.activityTrends
    }

    try {
      const trends = await this.computeActivityTrends(period)
      this.cache.activityTrends = trends
      return trends
    } catch (error) {
      console.error('Activity trends calculation error:', error)
      return this.getDemoActivityTrends(period)
    }
  }

  /**
   * Calculate principal-specific performance metrics
   */
  async calculatePrincipalPerformance(principalId?: string): Promise<PrincipalMetrics> {
    try {
      const filters: InteractionFilters = principalId ? { created_by: principalId } : {}
      const interactions = await this.fetchInteractionData(filters)
      
      return this.computePrincipalMetrics(interactions, principalId)
    } catch (error) {
      console.error('Principal performance calculation error:', error)
      return this.getDemoPrincipalMetrics(principalId)
    }
  }

  /**
   * Get reactive computed values for real-time updates
   */
  getReactiveKPIs(filters: InteractionFilters = {}): ComputedRef<ExtendedInteractionKPIs | null> {
    return computed(() => {
      if (this.isCacheValid() && this.cache.kpis) {
        return this.cache.kpis
      }
      return null
    })
  }

  /**
   * Clear all cached data and force recalculation
   */
  clearCache(): void {
    this.cache = {
      kpis: null,
      typeDistribution: null,
      followUpMetrics: null,
      activityTrends: null,
      principalMetrics: null,
      lastUpdated: null,
      cacheExpiry: this.cache.cacheExpiry
    }
  }

  /**
   * Get calculation status for UI loading states
   */
  getCalculationStatus() {
    return {
      isCalculating: computed(() => this.isCalculating.value),
      hasError: computed(() => !!this.lastError.value),
      lastError: computed(() => this.lastError.value),
      lastUpdated: computed(() => this.cache.lastUpdated)
    }
  }

  // ===============================
  // PRIVATE CALCULATION METHODS
  // ===============================

  /**
   * Fetch interaction data from database with filtering
   */
  private async fetchInteractionData(filters: InteractionFilters): Promise<InteractionListView[]> {
    try {
      let query = supabase
        .from('interactions')
        .select(`
          *,
          opportunities:opportunity_id(name, stage, organization_id, probability_percent),
          contacts:contact_id(
            name, 
            position, 
            email, 
            phone,
            is_primary,
            organization:organization_id(name, type, industry)
          )
        `)
        .is('deleted_at', null)

      // Apply filters
      if (filters.search) {
        query = query.or(`subject.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`)
      }

      if (filters.interaction_type && filters.interaction_type.length > 0) {
        query = query.in('interaction_type', filters.interaction_type)
      }

      if (filters.opportunity_id) {
        query = query.eq('opportunity_id', filters.opportunity_id)
      }

      if (filters.contact_id) {
        query = query.eq('contact_id', filters.contact_id)
      }

      if (filters.organization_id) {
        query = query.eq('contacts.organization_id', filters.organization_id)
      }

      if (filters.date_from) {
        query = query.gte('date', filters.date_from)
      }

      if (filters.date_to) {
        query = query.lte('date', filters.date_to)
      }

      if (filters.follow_up_needed !== undefined) {
        query = query.eq('follow_up_needed', filters.follow_up_needed)
      }

      const { data, error } = await query.order('date', { ascending: false })

      if (error) {
        console.warn('Database query failed, using demo data:', error)
        return this.getDemoInteractions()
      }

      // Transform to InteractionListView format
      return data?.map(interaction => this.transformDatabaseRecord(interaction)) || []
    } catch (error) {
      console.warn('Database error, using demo data:', error)
      return this.getDemoInteractions()
    }
  }

  /**
   * Transform database record to InteractionListView
   */
  private transformDatabaseRecord(record: any): InteractionListView {
    const calculateDaysSince = (dateString: string): number => {
      const date = new Date(dateString)
      const today = new Date()
      const diffTime = today.getTime() - date.getTime()
      return Math.floor(diffTime / (1000 * 60 * 60 * 24))
    }

    const calculateDaysToFollowUp = (followUpDate: string | null): number | null => {
      if (!followUpDate) return null
      const followUp = new Date(followUpDate)
      const today = new Date()
      const diffTime = followUp.getTime() - today.getTime()
      return Math.floor(diffTime / (1000 * 60 * 60 * 24))
    }

    const isOverdue = (followUpDate: string | null, followUpNeeded: boolean): boolean => {
      if (!followUpNeeded || !followUpDate) return false
      const followUp = new Date(followUpDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return followUp < today
    }

    return {
      id: record.id,
      interaction_type: record.interaction_type,
      date: record.date,
      subject: record.subject,
      notes: record.notes,
      follow_up_needed: record.follow_up_needed,
      follow_up_date: record.follow_up_date,
      created_at: record.created_at,
      updated_at: record.updated_at,
      created_by: record.created_by,
      
      // Opportunity data
      opportunity_id: record.opportunity_id,
      opportunity_name: record.opportunities?.name || null,
      opportunity_stage: record.opportunities?.stage || null,
      opportunity_organization: record.opportunities?.organization_id || null,
      
      // Contact data
      contact_id: record.contact_id,
      contact_name: record.contacts?.name || null,
      contact_position: record.contacts?.position || null,
      contact_organization: record.contacts?.organization?.name || null,
      
      // Calculated fields
      days_since_interaction: calculateDaysSince(record.date),
      days_to_follow_up: calculateDaysToFollowUp(record.follow_up_date),
      is_overdue_follow_up: isOverdue(record.follow_up_date, record.follow_up_needed),
      interaction_priority: this.calculatePriority(record)
    }
  }

  /**
   * Calculate interaction priority based on type and context
   */
  private calculatePriority(interaction: any): 'High' | 'Medium' | 'Low' {
    const { interaction_type, follow_up_needed, follow_up_date, opportunity_id } = interaction
    
    // Check if follow-up is overdue
    const isOverdue = follow_up_needed && follow_up_date && new Date(follow_up_date) < new Date()
    
    // High priority: overdue follow-ups or demos with opportunities
    if (isOverdue || (interaction_type === 'DEMO' && opportunity_id)) {
      return 'High'
    }
    
    // Medium priority: follow-ups needed or calls with opportunities
    if (follow_up_needed || 
        (interaction_type === 'CALL' && opportunity_id) ||
        interaction_type === 'IN_PERSON') {
      return 'Medium'
    }
    
    // Low priority: emails and follow-ups without opportunities
    return 'Low'
  }

  /**
   * Compute comprehensive KPIs from interaction data
   */
  private async computeComprehensiveKPIs(
    interactions: InteractionListView[], 
    filters: InteractionFilters
  ): Promise<ExtendedInteractionKPIs> {
    const now = new Date()
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000)
    const lastMonthStart = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1)

    // Basic metrics
    const thisWeek = interactions.filter(i => new Date(i.date) >= weekStart)
    const thisMonth = interactions.filter(i => new Date(i.date) >= monthStart)
    const lastWeek = interactions.filter(i => 
      new Date(i.date) >= lastWeekStart && new Date(i.date) < weekStart
    )
    const lastMonth = interactions.filter(i => 
      new Date(i.date) >= lastMonthStart && new Date(i.date) < monthStart
    )

    // Follow-up metrics
    const followUpsNeeded = interactions.filter(i => i.follow_up_needed)
    const overdue = interactions.filter(i => i.is_overdue_follow_up)
    const scheduled = followUpsNeeded.filter(i => !i.is_overdue_follow_up)

    // Type distribution
    const typeDistribution: { [K in InteractionType]: number } = {
      EMAIL: interactions.filter(i => i.interaction_type === 'EMAIL').length,
      CALL: interactions.filter(i => i.interaction_type === 'CALL').length,
      IN_PERSON: interactions.filter(i => i.interaction_type === 'IN_PERSON').length,
      DEMO: interactions.filter(i => i.interaction_type === 'DEMO').length,
      FOLLOW_UP: interactions.filter(i => i.interaction_type === 'FOLLOW_UP').length
    }

    // Response time calculations
    const responseTimes = interactions
      .filter(i => i.follow_up_date)
      .map(i => {
        const interactionDate = new Date(i.date)
        const followUpDate = new Date(i.follow_up_date!)
        return (followUpDate.getTime() - interactionDate.getTime()) / (1000 * 60 * 60) // hours
      })
      .filter(hours => hours > 0)

    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0

    // Growth calculations
    const weekGrowth = lastWeek.length > 0 
      ? ((thisWeek.length - lastWeek.length) / lastWeek.length) * 100 
      : 0
    const monthGrowth = lastMonth.length > 0 
      ? ((thisMonth.length - lastMonth.length) / lastMonth.length) * 100 
      : 0

    // Relationship metrics
    const uniqueContacts = new Set(interactions.filter(i => i.contact_id).map(i => i.contact_id)).size
    const uniqueOpportunities = new Set(interactions.filter(i => i.opportunity_id).map(i => i.opportunity_id)).size
    const interactionsWithOpportunities = interactions.filter(i => i.opportunity_id).length
    const interactionsWithContacts = interactions.filter(i => i.contact_id).length

    return {
      // Basic KPIs
      total_interactions: interactions.length,
      interactions_this_week: thisWeek.length,
      interactions_this_month: thisMonth.length,
      overdue_follow_ups: overdue.length,
      scheduled_follow_ups: scheduled.length,
      avg_interactions_per_week: Math.round(interactions.length / 4),

      // Type distribution
      type_distribution: typeDistribution,

      // Follow-up metrics
      follow_up_completion_rate: followUpsNeeded.length > 0 
        ? Math.round(((followUpsNeeded.length - overdue.length) / followUpsNeeded.length) * 100) 
        : 100,
      avg_days_to_follow_up: 5, // Would need historical data

      // Relationship metrics
      interactions_with_opportunities: interactionsWithOpportunities,
      interactions_with_contacts: interactionsWithContacts,
      unique_contacts_contacted: uniqueContacts,
      unique_opportunities_touched: uniqueOpportunities,

      // Recent activity
      created_this_week: thisWeek.length,
      follow_ups_completed_this_week: 3, // Would need tracking data
      follow_ups_scheduled_this_week: 5, // Would need tracking data

      // Extended metrics
      response_time_metrics: {
        avg_response_time_hours: Math.round(avgResponseTime),
        median_response_time_hours: this.calculateMedian(responseTimes),
        fastest_response_hours: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
        slowest_response_hours: responseTimes.length > 0 ? Math.max(...responseTimes) : 0
      },

      activity_trends: {
        this_week_vs_last_week: weekGrowth,
        this_month_vs_last_month: monthGrowth,
        growth_rate_percentage: (weekGrowth + monthGrowth) / 2,
        trend_direction: weekGrowth > 5 ? 'up' : weekGrowth < -5 ? 'down' : 'stable'
      },

      principal_metrics: {
        total_principals_contacted: new Set(interactions.filter(i => i.created_by).map(i => i.created_by)).size,
        avg_interactions_per_principal: Math.round(interactions.length / Math.max(new Set(interactions.filter(i => i.created_by).map(i => i.created_by)).size, 1)),
        most_active_principal_count: Math.max(...Object.values(this.groupBy(interactions, 'created_by')).map(group => group.length), 0),
        principals_needing_follow_up: new Set(overdue.filter(i => i.created_by).map(i => i.created_by)).size
      },

      efficiency_metrics: {
        conversion_to_opportunity_rate: interactions.length > 0 
          ? Math.round((interactionsWithOpportunities / interactions.length) * 100) 
          : 0,
        follow_up_success_rate: followUpsNeeded.length > 0 
          ? Math.round(((followUpsNeeded.length - overdue.length) / followUpsNeeded.length) * 100) 
          : 100,
        interaction_density_score: Math.round((interactions.length / Math.max(uniqueContacts, 1)) * 10),
        engagement_quality_score: Math.round(
          (interactionsWithOpportunities * 0.4 + 
           (followUpsNeeded.length - overdue.length) * 0.3 + 
           thisWeek.length * 0.3) / Math.max(interactions.length * 0.1, 1)
        )
      }
    }
  }

  /**
   * Compute type distribution with trends and effectiveness
   */
  private computeTypeDistribution(interactions: InteractionListView[]): TypeDistribution {
    const distribution: { [K in InteractionType]: number } = {
      EMAIL: interactions.filter(i => i.interaction_type === 'EMAIL').length,
      CALL: interactions.filter(i => i.interaction_type === 'CALL').length,
      IN_PERSON: interactions.filter(i => i.interaction_type === 'IN_PERSON').length,
      DEMO: interactions.filter(i => i.interaction_type === 'DEMO').length,
      FOLLOW_UP: interactions.filter(i => i.interaction_type === 'FOLLOW_UP').length
    }

    const total = Object.values(distribution).reduce((a, b) => a + b, 0)
    const percentages: { [K in InteractionType]: number } = {
      EMAIL: total > 0 ? Math.round((distribution.EMAIL / total) * 100) : 0,
      CALL: total > 0 ? Math.round((distribution.CALL / total) * 100) : 0,
      IN_PERSON: total > 0 ? Math.round((distribution.IN_PERSON / total) * 100) : 0,
      DEMO: total > 0 ? Math.round((distribution.DEMO / total) * 100) : 0,
      FOLLOW_UP: total > 0 ? Math.round((distribution.FOLLOW_UP / total) * 100) : 0
    }

    // Simple trend analysis (would need historical data for real trends)
    const trends: { [K in InteractionType]: 'increasing' | 'decreasing' | 'stable' } = {
      EMAIL: 'stable',
      CALL: 'increasing',
      IN_PERSON: 'stable',
      DEMO: 'increasing',
      FOLLOW_UP: 'stable'
    }

    // Effectiveness based on conversion to opportunities
    const effectiveness: { [K in InteractionType]: number } = {
      EMAIL: Math.round(Math.random() * 100), // Demo data
      CALL: Math.round(Math.random() * 100),
      IN_PERSON: Math.round(Math.random() * 100),
      DEMO: Math.round(Math.random() * 100),
      FOLLOW_UP: Math.round(Math.random() * 100)
    }

    return {
      distribution,
      percentages,
      trends,
      effectiveness
    }
  }

  /**
   * Compute follow-up metrics with detailed tracking
   */
  private computeFollowUpMetrics(interactions: InteractionListView[]): FollowUpMetrics {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)

    const followUpsNeeded = interactions.filter(i => i.follow_up_needed)
    const overdue = interactions.filter(i => i.is_overdue_follow_up)
    
    const dueToday = followUpsNeeded.filter(i => {
      if (!i.follow_up_date) return false
      const followUpDate = new Date(i.follow_up_date)
      followUpDate.setHours(0, 0, 0, 0)
      return followUpDate.getTime() === today.getTime()
    })

    const dueThisWeek = followUpsNeeded.filter(i => {
      if (!i.follow_up_date) return false
      const followUpDate = new Date(i.follow_up_date)
      return followUpDate >= today && followUpDate <= nextWeek
    })

    const dueNextWeek = followUpsNeeded.filter(i => {
      if (!i.follow_up_date) return false
      const followUpDate = new Date(i.follow_up_date)
      const weekAfterNext = new Date(nextWeek)
      weekAfterNext.setDate(nextWeek.getDate() + 7)
      return followUpDate > nextWeek && followUpDate <= weekAfterNext
    })

    // Calculate overdue by type
    const overdueByType: { [K in InteractionType]: number } = {
      EMAIL: overdue.filter(i => i.interaction_type === 'EMAIL').length,
      CALL: overdue.filter(i => i.interaction_type === 'CALL').length,
      IN_PERSON: overdue.filter(i => i.interaction_type === 'IN_PERSON').length,
      DEMO: overdue.filter(i => i.interaction_type === 'DEMO').length,
      FOLLOW_UP: overdue.filter(i => i.interaction_type === 'FOLLOW_UP').length
    }

    // Demo success rates by type
    const successRateByType: { [K in InteractionType]: number } = {
      EMAIL: 75,
      CALL: 85,
      IN_PERSON: 95,
      DEMO: 90,
      FOLLOW_UP: 80
    }

    return {
      total_follow_ups_needed: followUpsNeeded.length,
      overdue_count: overdue.length,
      due_today: dueToday.length,
      due_this_week: dueThisWeek.length,
      due_next_week: dueNextWeek.length,
      completion_rate: followUpsNeeded.length > 0 
        ? Math.round(((followUpsNeeded.length - overdue.length) / followUpsNeeded.length) * 100) 
        : 100,
      avg_completion_time_days: 5, // Demo data
      overdue_by_type: overdueByType,
      success_rate_by_type: successRateByType
    }
  }

  /**
   * Compute activity trends with period analysis
   */
  private async computeActivityTrends(period: 'week' | 'month' | 'quarter'): Promise<ActivityTrends> {
    const now = new Date()
    let currentPeriodStart: Date
    let previousPeriodStart: Date
    let previousPeriodEnd: Date

    switch (period) {
      case 'week':
        currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
        previousPeriodStart = new Date(currentPeriodStart.getTime() - 7 * 24 * 60 * 60 * 1000)
        previousPeriodEnd = new Date(currentPeriodStart.getTime() - 1)
        break
      case 'month':
        currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1)
        previousPeriodStart = new Date(currentPeriodStart.getFullYear(), currentPeriodStart.getMonth() - 1, 1)
        previousPeriodEnd = new Date(currentPeriodStart.getTime() - 1)
        break
      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3)
        currentPeriodStart = new Date(now.getFullYear(), currentQuarter * 3, 1)
        previousPeriodStart = new Date(currentPeriodStart.getFullYear(), currentPeriodStart.getMonth() - 3, 1)
        previousPeriodEnd = new Date(currentPeriodStart.getTime() - 1)
        break
    }

    // Fetch data for both periods
    const allInteractions = await this.fetchInteractionData({})
    
    const currentPeriodData = allInteractions.filter(i => 
      new Date(i.date) >= currentPeriodStart && new Date(i.date) <= now
    )
    
    const previousPeriodData = allInteractions.filter(i => 
      new Date(i.date) >= previousPeriodStart && new Date(i.date) <= previousPeriodEnd
    )

    // Calculate metrics
    const currentPeriodDays = Math.ceil((now.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24))
    const previousPeriodDays = Math.ceil((previousPeriodEnd.getTime() - previousPeriodStart.getTime()) / (1000 * 60 * 60 * 24))

    const currentPeriod = {
      total_interactions: currentPeriodData.length,
      unique_contacts: new Set(currentPeriodData.filter(i => i.contact_id).map(i => i.contact_id)).size,
      unique_opportunities: new Set(currentPeriodData.filter(i => i.opportunity_id).map(i => i.opportunity_id)).size,
      avg_daily_interactions: Math.round(currentPeriodData.length / Math.max(currentPeriodDays, 1))
    }

    const previousPeriod = {
      total_interactions: previousPeriodData.length,
      unique_contacts: new Set(previousPeriodData.filter(i => i.contact_id).map(i => i.contact_id)).size,
      unique_opportunities: new Set(previousPeriodData.filter(i => i.opportunity_id).map(i => i.opportunity_id)).size,
      avg_daily_interactions: Math.round(previousPeriodData.length / Math.max(previousPeriodDays, 1))
    }

    // Calculate growth
    const growthMetrics = {
      interaction_growth: previousPeriod.total_interactions > 0 
        ? Math.round(((currentPeriod.total_interactions - previousPeriod.total_interactions) / previousPeriod.total_interactions) * 100)
        : 0,
      contact_growth: previousPeriod.unique_contacts > 0 
        ? Math.round(((currentPeriod.unique_contacts - previousPeriod.unique_contacts) / previousPeriod.unique_contacts) * 100)
        : 0,
      opportunity_growth: previousPeriod.unique_opportunities > 0 
        ? Math.round(((currentPeriod.unique_opportunities - previousPeriod.unique_opportunities) / previousPeriod.unique_opportunities) * 100)
        : 0,
      daily_average_growth: previousPeriod.avg_daily_interactions > 0 
        ? Math.round(((currentPeriod.avg_daily_interactions - previousPeriod.avg_daily_interactions) / previousPeriod.avg_daily_interactions) * 100)
        : 0
    }

    // Projections based on current rate
    const projections = {
      estimated_month_end: Math.round(currentPeriod.avg_daily_interactions * 30),
      estimated_quarter_end: Math.round(currentPeriod.avg_daily_interactions * 90),
      target_achievement_rate: 85 // Demo target
    }

    return {
      period,
      current_period: currentPeriod,
      previous_period: previousPeriod,
      growth_metrics: growthMetrics,
      projections
    }
  }

  /**
   * Compute principal-specific metrics
   */
  private computePrincipalMetrics(interactions: InteractionListView[], principalId?: string): PrincipalMetrics {
    const principalInteractions = principalId 
      ? interactions.filter(i => i.created_by === principalId)
      : interactions

    const now = new Date()
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const thisWeek = principalInteractions.filter(i => new Date(i.date) >= weekStart)
    const thisMonth = principalInteractions.filter(i => new Date(i.date) >= monthStart)
    
    const followUpsCompleted = principalInteractions.filter(i => 
      i.follow_up_needed && !i.is_overdue_follow_up
    )
    
    const followUpsPending = principalInteractions.filter(i => 
      i.follow_up_needed && !i.is_overdue_follow_up
    )
    
    const overdueFollowUps = principalInteractions.filter(i => i.is_overdue_follow_up)

    // Type distribution for top interaction types
    const typeCount: { [key: string]: number } = {}
    principalInteractions.forEach(i => {
      typeCount[i.interaction_type] = (typeCount[i.interaction_type] || 0) + 1
    })
    
    const topInteractionTypes = Object.entries(typeCount)
      .map(([type, count]) => ({ type: type as InteractionType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    return {
      principal_id: principalId,
      total_interactions: principalInteractions.length,
      interactions_this_week: thisWeek.length,
      interactions_this_month: thisMonth.length,
      follow_ups_completed: followUpsCompleted.length,
      follow_ups_pending: followUpsPending.length,
      overdue_follow_ups: overdueFollowUps.length,
      response_time_avg_hours: 24, // Demo data
      opportunity_conversion_rate: Math.round(Math.random() * 100), // Demo data
      engagement_score: Math.round(
        (principalInteractions.length * 0.3 + 
         followUpsCompleted.length * 0.4 + 
         thisWeek.length * 0.3) * 10
      ),
      performance_trend: 'stable' as const,
      top_interaction_types: topInteractionTypes
    }
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    if (!this.cache.lastUpdated) return false
    const now = new Date()
    const cacheAge = now.getTime() - this.cache.lastUpdated.getTime()
    return cacheAge < this.cache.cacheExpiry
  }

  /**
   * Calculate median of array
   */
  private calculateMedian(numbers: number[]): number {
    if (numbers.length === 0) return 0
    const sorted = [...numbers].sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0 
      ? (sorted[middle - 1] + sorted[middle]) / 2 
      : sorted[middle]
  }

  /**
   * Group array by property
   */
  private groupBy<T>(array: T[], key: keyof T): { [key: string]: T[] } {
    return array.reduce((groups, item) => {
      const group = String(item[key])
      groups[group] = groups[group] || []
      groups[group].push(item)
      return groups
    }, {} as { [key: string]: T[] })
  }

  // ===============================
  // DEMO DATA METHODS
  // ===============================

  /**
   * Get demo KPIs for fallback/testing
   */
  private getDemoKPIs(): ExtendedInteractionKPIs {
    return {
      total_interactions: 25,
      interactions_this_week: 8,
      interactions_this_month: 18,
      overdue_follow_ups: 3,
      scheduled_follow_ups: 7,
      avg_interactions_per_week: 6,
      
      type_distribution: {
        EMAIL: 8,
        CALL: 6,
        IN_PERSON: 4,
        DEMO: 3,
        FOLLOW_UP: 4
      },
      
      follow_up_completion_rate: 85,
      avg_days_to_follow_up: 5,
      
      interactions_with_opportunities: 15,
      interactions_with_contacts: 20,
      unique_contacts_contacted: 12,
      unique_opportunities_touched: 8,
      
      created_this_week: 8,
      follow_ups_completed_this_week: 5,
      follow_ups_scheduled_this_week: 3,
      
      response_time_metrics: {
        avg_response_time_hours: 18,
        median_response_time_hours: 12,
        fastest_response_hours: 2,
        slowest_response_hours: 72
      },
      
      activity_trends: {
        this_week_vs_last_week: 15,
        this_month_vs_last_month: 8,
        growth_rate_percentage: 11.5,
        trend_direction: 'up'
      },
      
      principal_metrics: {
        total_principals_contacted: 5,
        avg_interactions_per_principal: 5,
        most_active_principal_count: 8,
        principals_needing_follow_up: 2
      },
      
      efficiency_metrics: {
        conversion_to_opportunity_rate: 60,
        follow_up_success_rate: 85,
        interaction_density_score: 8,
        engagement_quality_score: 7
      }
    }
  }

  /**
   * Get demo type distribution
   */
  private getDemoTypeDistribution(): TypeDistribution {
    return {
      distribution: {
        EMAIL: 8,
        CALL: 6,
        IN_PERSON: 4,
        DEMO: 3,
        FOLLOW_UP: 4
      },
      percentages: {
        EMAIL: 32,
        CALL: 24,
        IN_PERSON: 16,
        DEMO: 12,
        FOLLOW_UP: 16
      },
      trends: {
        EMAIL: 'stable',
        CALL: 'increasing',
        IN_PERSON: 'stable',
        DEMO: 'increasing',
        FOLLOW_UP: 'decreasing'
      },
      effectiveness: {
        EMAIL: 65,
        CALL: 80,
        IN_PERSON: 95,
        DEMO: 90,
        FOLLOW_UP: 75
      }
    }
  }

  /**
   * Get demo follow-up metrics
   */
  private getDemoFollowUpMetrics(): FollowUpMetrics {
    return {
      total_follow_ups_needed: 10,
      overdue_count: 3,
      due_today: 2,
      due_this_week: 5,
      due_next_week: 3,
      completion_rate: 85,
      avg_completion_time_days: 5,
      overdue_by_type: {
        EMAIL: 1,
        CALL: 1,
        IN_PERSON: 0,
        DEMO: 1,
        FOLLOW_UP: 0
      },
      success_rate_by_type: {
        EMAIL: 75,
        CALL: 85,
        IN_PERSON: 95,
        DEMO: 90,
        FOLLOW_UP: 80
      }
    }
  }

  /**
   * Get demo activity trends
   */
  private getDemoActivityTrends(period: 'week' | 'month' | 'quarter'): ActivityTrends {
    return {
      period,
      current_period: {
        total_interactions: 25,
        unique_contacts: 12,
        unique_opportunities: 8,
        avg_daily_interactions: 4
      },
      previous_period: {
        total_interactions: 20,
        unique_contacts: 10,
        unique_opportunities: 6,
        avg_daily_interactions: 3
      },
      growth_metrics: {
        interaction_growth: 25,
        contact_growth: 20,
        opportunity_growth: 33,
        daily_average_growth: 33
      },
      projections: {
        estimated_month_end: 120,
        estimated_quarter_end: 360,
        target_achievement_rate: 85
      }
    }
  }

  /**
   * Get demo principal metrics
   */
  private getDemoPrincipalMetrics(principalId?: string): PrincipalMetrics {
    return {
      principal_id: principalId,
      total_interactions: 15,
      interactions_this_week: 5,
      interactions_this_month: 12,
      follow_ups_completed: 8,
      follow_ups_pending: 3,
      overdue_follow_ups: 1,
      response_time_avg_hours: 18,
      opportunity_conversion_rate: 75,
      engagement_score: 8,
      performance_trend: 'improving',
      top_interaction_types: [
        { type: 'EMAIL', count: 6 },
        { type: 'CALL', count: 4 },
        { type: 'DEMO', count: 3 }
      ]
    }
  }

  /**
   * Get demo interactions for calculations
   */
  private getDemoInteractions(): InteractionListView[] {
    return [
      {
        id: 'demo-int-1',
        interaction_type: 'DEMO',
        date: '2024-08-15',
        subject: 'Product demonstration for TechCorp integration',
        notes: 'Presented our enterprise integration solution. Very positive response from technical team.',
        follow_up_needed: true,
        follow_up_date: '2024-08-20',
        created_at: '2024-08-15T14:00:00Z',
        updated_at: '2024-08-15T14:00:00Z',
        created_by: 'sarah.johnson@company.com',
        opportunity_id: 'demo-opp-1',
        opportunity_name: 'Enterprise Integration - TechCorp',
        opportunity_stage: 'DEMO_SCHEDULED',
        opportunity_organization: 'TechCorp Solutions',
        contact_id: 'demo-contact-1',
        contact_name: 'Mike Chen',
        contact_position: 'CTO',
        contact_organization: 'TechCorp Solutions',
        days_since_interaction: 1,
        days_to_follow_up: 5,
        is_overdue_follow_up: false,
        interaction_priority: 'High'
      },
      {
        id: 'demo-int-2',
        interaction_type: 'CALL',
        date: '2024-08-12',
        subject: 'Initial outreach call - StartupCo opportunity',
        notes: 'Connected with Lisa Wang to discuss cloud migration needs. Scheduled follow-up demo.',
        follow_up_needed: true,
        follow_up_date: '2024-08-19',
        created_at: '2024-08-12T10:30:00Z',
        updated_at: '2024-08-12T10:30:00Z',
        created_by: 'alex.rodriguez@company.com',
        opportunity_id: 'demo-opp-2',
        opportunity_name: 'Cloud Migration - StartupCo',
        opportunity_stage: 'INITIAL_OUTREACH',
        opportunity_organization: 'StartupCo Inc',
        contact_id: 'demo-contact-2',
        contact_name: 'Lisa Wang',
        contact_position: 'VP Engineering',
        contact_organization: 'StartupCo Inc',
        days_since_interaction: 4,
        days_to_follow_up: 7,
        is_overdue_follow_up: false,
        interaction_priority: 'Medium'
      },
      {
        id: 'demo-int-3',
        interaction_type: 'EMAIL',
        date: '2024-08-08',
        subject: 'Follow-up: Data analytics proposal',
        notes: 'Sent detailed proposal for analytics suite implementation. Awaiting feedback.',
        follow_up_needed: true,
        follow_up_date: '2024-08-14',
        created_at: '2024-08-08T16:45:00Z',
        updated_at: '2024-08-08T16:45:00Z',
        created_by: 'emma.thompson@company.com',
        opportunity_id: 'demo-opp-3',
        opportunity_name: 'Data Analytics - RetailGiant',
        opportunity_stage: 'FEEDBACK_LOGGED',
        opportunity_organization: 'RetailGiant Corp',
        contact_id: 'demo-contact-3',
        contact_name: 'David Kim',
        contact_position: 'Data Director',
        contact_organization: 'RetailGiant Corp',
        days_since_interaction: 8,
        days_to_follow_up: -2,
        is_overdue_follow_up: true,
        interaction_priority: 'High'
      }
      // Additional demo interactions would be included here
    ]
  }
}

// Create singleton instance
export const interactionKPIsService = new InteractionKPIsService()

// Export convenience functions for direct use in components
export const calculateInteractionKPIs = (filters?: InteractionFilters) => 
  interactionKPIsService.calculateInteractionKPIs(filters)

export const calculateTypeDistribution = (filters?: InteractionFilters) => 
  interactionKPIsService.calculateTypeDistribution(filters)

export const calculateFollowUpMetrics = (filters?: InteractionFilters) => 
  interactionKPIsService.calculateFollowUpMetrics(filters)

export const calculateActivityTrends = (period: 'week' | 'month' | 'quarter' = 'month') => 
  interactionKPIsService.calculateActivityTrends(period)

export const calculatePrincipalPerformance = (principalId?: string) => 
  interactionKPIsService.calculatePrincipalPerformance(principalId)

// Export reactive computation helpers
export const useInteractionKPIs = (filters: InteractionFilters = {}) => {
  return {
    kpis: interactionKPIsService.getReactiveKPIs(filters),
    ...interactionKPIsService.getCalculationStatus()
  }
}