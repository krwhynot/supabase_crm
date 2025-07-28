/**
 * Dashboard Analytics Composable - Analytics data fetching and processing
 * Follows Vue 3 Composition API patterns with reactive state management
 */

import { ref, computed, watch } from 'vue'
import { supabase } from '@/config/supabaseClient'
import type { 
  ContactAnalytics, 
  OrganizationAnalytics, 
  WeeklyInteractions,
  ContactMetrics,
  OrganizationMetrics,
  InteractionData,
  ChartData
} from '@/types/dashboard.types'

export function useDashboardAnalytics() {
  // State
  const contactAnalytics = ref<ContactAnalytics[]>([])
  const organizationAnalytics = ref<OrganizationAnalytics[]>([])
  const weeklyInteractions = ref<WeeklyInteractions[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)

  // Computed metrics
  const contactMetrics = computed((): ContactMetrics => {
    const analytics = contactAnalytics.value
    if (!analytics.length) {
      return {
        totalContacts: 0,
        contactsThisWeek: 0,
        contactsThisMonth: 0,
        uniqueOrganizations: 0,
        growthRate: 0,
        weeklyGrowth: []
      }
    }

    // Aggregate metrics from analytics data
    const totals = analytics.reduce((acc, item) => ({
      total: acc.total + (item.total_contacts || 0),
      thisWeek: acc.thisWeek + (item.contacts_this_week || 0),
      thisMonth: acc.thisMonth + (item.contacts_this_month || 0),
      orgs: acc.orgs + (item.unique_organizations || 0)
    }), { total: 0, thisWeek: 0, thisMonth: 0, orgs: 0 })

    // Calculate growth rate (this month vs previous month)
    const growthRate = totals.thisMonth > 0 ? 
      ((totals.thisMonth - (totals.total - totals.thisMonth)) / Math.max(1, totals.total - totals.thisMonth)) * 100 : 0

    // Generate weekly growth data from daily analytics
    const weeklyGrowth = analytics
      .filter(item => item.contact_date)
      .sort((a, b) => new Date(a.contact_date!).getTime() - new Date(b.contact_date!).getTime())
      .slice(-7)
      .map(item => item.daily_contact_count || 0)

    return {
      totalContacts: totals.total,
      contactsThisWeek: totals.thisWeek,
      contactsThisMonth: totals.thisMonth,
      uniqueOrganizations: Math.max(totals.orgs, organizationAnalytics.value.length),
      growthRate: Math.round(growthRate * 10) / 10,
      weeklyGrowth
    }
  })

  const organizationMetrics = computed((): OrganizationMetrics => {
    const orgs = organizationAnalytics.value
    if (!orgs.length) {
      return {
        topOrganizations: [],
        organizationCount: 0,
        averageContactsPerOrg: 0
      }
    }

    const topOrganizations = orgs
      .filter(org => org.organization && org.contact_count)
      .sort((a, b) => (b.contact_count || 0) - (a.contact_count || 0))
      .slice(0, 10)
      .map(org => ({
        name: org.organization || 'Unknown',
        contactCount: org.contact_count || 0,
        firstContactDate: org.first_contact_date || '',
        latestContactDate: org.latest_contact_date || '',
        avgDaysSinceContact: Math.round((org.avg_days_since_contact || 0) * 10) / 10
      }))

    const totalContacts = orgs.reduce((sum, org) => sum + (org.contact_count || 0), 0)
    const averageContactsPerOrg = orgs.length > 0 ? Math.round((totalContacts / orgs.length) * 10) / 10 : 0

    return {
      topOrganizations,
      organizationCount: orgs.length,
      averageContactsPerOrg
    }
  })

  const interactionData = computed((): InteractionData[] => {
    return weeklyInteractions.value
      .filter(week => week.week_start && week.interaction_count)
      .sort((a, b) => new Date(b.week_start!).getTime() - new Date(a.week_start!).getTime())
      .slice(0, 8)
      .map(week => ({
        weekStart: week.week_start!,
        interactionCount: week.interaction_count || 0,
        organizationsContacted: week.organizations_contacted || 0,
        uniqueEmails: week.unique_emails || 0,
        organizationsList: Array.isArray(week.organizations_list) ? week.organizations_list : []
      }))
      .reverse() // Show chronologically
  })

  // Chart data computed properties
  const weeklyInteractionChart = computed((): ChartData => {
    const data = interactionData.value
    
    return {
      labels: data.map(week => {
        const date = new Date(week.weekStart)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }),
      datasets: [
        {
          label: 'Interactions',
          data: data.map(week => week.interactionCount),
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2
        },
        {
          label: 'Organizations',
          data: data.map(week => week.organizationsContacted),
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 2
        }
      ]
    }
  })

  const organizationDistributionChart = computed((): ChartData => {
    const orgs = organizationMetrics.value.topOrganizations.slice(0, 6)
    
    return {
      labels: orgs.map(org => org.name),
      datasets: [
        {
          label: 'Contacts',
          data: orgs.map(org => org.contactCount),
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)'
          ]
        }
      ]
    }
  })

  // Data fetching methods
  const fetchContactAnalytics = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('dashboard_contact_analytics')
        .select('*')
        .order('contact_date', { ascending: false })
        .limit(30)

      if (fetchError) throw fetchError
      contactAnalytics.value = data || []
    } catch (err) {
      console.error('Error fetching contact analytics:', err)
      throw err
    }
  }

  const fetchOrganizationAnalytics = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('dashboard_organization_analytics')
        .select('*')
        .order('contact_count', { ascending: false })
        .limit(20)

      if (fetchError) throw fetchError
      organizationAnalytics.value = data || []
    } catch (err) {
      console.error('Error fetching organization analytics:', err)
      throw err
    }
  }

  const fetchWeeklyInteractions = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('dashboard_weekly_interactions')
        .select('*')
        .order('week_start', { ascending: false })
        .limit(10)

      if (fetchError) throw fetchError
      weeklyInteractions.value = data || []
    } catch (err) {
      console.error('Error fetching weekly interactions:', err)
      throw err
    }
  }

  // Refresh all analytics data
  const refreshAnalytics = async () => {
    isLoading.value = true
    error.value = null

    try {
      await Promise.all([
        fetchContactAnalytics(),
        fetchOrganizationAnalytics(),
        fetchWeeklyInteractions()
      ])
      
      lastUpdated.value = new Date()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch analytics data'
      console.error('Analytics refresh error:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Refresh materialized view
  const refreshMaterializedView = async () => {
    try {
      // Note: refresh_materialized_view function needs to be created in Supabase
      // For now, we'll just log a message and continue
      console.log('Materialized view refresh would be called here')
    } catch (err) {
      console.warn('Materialized view refresh failed:', err)
    }
  }

  // Filtered analytics for specific time periods
  const getAnalyticsForDateRange = (startDate: Date, endDate: Date) => {
    return contactAnalytics.value.filter(item => {
      if (!item.contact_date) return false
      const date = new Date(item.contact_date)
      return date >= startDate && date <= endDate
    })
  }

  const getWeeklyInteractionsForDateRange = (startDate: Date, endDate: Date) => {
    return weeklyInteractions.value.filter(week => {
      if (!week.week_start) return false
      const weekStart = new Date(week.week_start)
      return weekStart >= startDate && weekStart <= endDate
    })
  }

  // Analytics utilities
  const calculateGrowthRate = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100 * 10) / 10
  }

  const formatMetricValue = (value: number, type: 'count' | 'percentage' | 'days'): string => {
    switch (type) {
      case 'count':
        return value.toLocaleString()
      case 'percentage':
        return `${value > 0 ? '+' : ''}${value}%`
      case 'days':
        return `${value} day${value !== 1 ? 's' : ''}`
      default:
        return value.toString()
    }
  }

  // Watch for automatic refresh triggers
  watch(lastUpdated, () => {
    console.log('Analytics data refreshed at:', lastUpdated.value)
  })

  return {
    // State
    contactAnalytics,
    organizationAnalytics,
    weeklyInteractions,
    isLoading,
    error,
    lastUpdated,

    // Computed metrics
    contactMetrics,
    organizationMetrics,
    interactionData,

    // Chart data
    weeklyInteractionChart,
    organizationDistributionChart,

    // Methods
    refreshAnalytics,
    refreshMaterializedView,
    fetchContactAnalytics,
    fetchOrganizationAnalytics,
    fetchWeeklyInteractions,

    // Filtered data methods
    getAnalyticsForDateRange,
    getWeeklyInteractionsForDateRange,

    // Utilities
    calculateGrowthRate,
    formatMetricValue
  }
}