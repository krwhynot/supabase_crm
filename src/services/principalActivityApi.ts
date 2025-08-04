/**
 * Principal Activity API Service
 * Provides type-safe access to principal activity analytics views
 * Integrates with the comprehensive database views created in 36_principal_activity_schema.sql
 */

import { supabase } from '@/config/supabaseClient'
import type { Database } from '@/types/database.types'

// Type aliases for the new views
type PrincipalActivitySummary = Database['public']['Views']['principal_activity_summary']['Row']
type PrincipalDistributorRelationships = Database['public']['Views']['principal_distributor_relationships']['Row']
type PrincipalProductPerformance = Database['public']['Views']['principal_product_performance']['Row']
type PrincipalTimelineSummary = Database['public']['Views']['principal_timeline_summary']['Row']

// API Response wrapper
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Principal Activity Analytics API
 * High-performance queries leveraging materialized views and optimized indexes
 */
export class PrincipalActivityApi {
  
  /**
   * Get comprehensive activity summary for all or specific principals
   * Uses the principal_activity_summary materialized view for <500ms performance
   */
  static async getPrincipalActivitySummary(
    filters?: {
      principalIds?: string[]
      activityStatus?: string[]
      engagementScoreMin?: number
      lastActivityDays?: number
    }
  ): Promise<ApiResponse<PrincipalActivitySummary[]>> {
    try {
      let query = supabase
        .from('principal_activity_summary')
        .select('*')
        .order('engagement_score', { ascending: false })

      // Apply filters
      if (filters?.principalIds?.length) {
        query = query.in('principal_id', filters.principalIds)
      }

      if (filters?.activityStatus?.length) {
        query = query.in('activity_status', filters.activityStatus)
      }

      if (filters?.engagementScoreMin !== undefined) {
        query = query.gte('engagement_score', filters.engagementScoreMin)
      }

      if (filters?.lastActivityDays) {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - filters.lastActivityDays)
        query = query.gte('last_activity_date', cutoffDate.toISOString())
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching principal activity summary:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  }

  /**
   * Get distributor relationships for principals
   * Uses the principal_distributor_relationships view
   */
  static async getPrincipalDistributorRelationships(
    principalIds?: string[]
  ): Promise<ApiResponse<PrincipalDistributorRelationships[]>> {
    try {
      let query = supabase
        .from('principal_distributor_relationships')
        .select('*')
        .order('principal_name')

      if (principalIds?.length) {
        query = query.in('principal_id', principalIds)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching principal distributor relationships:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  }

  /**
   * Get product performance analytics for principals
   * Uses the principal_product_performance view with performance scoring
   */
  static async getPrincipalProductPerformance(
    principalId?: string,
    productIds?: string[]
  ): Promise<ApiResponse<PrincipalProductPerformance[]>> {
    try {
      let query = supabase
        .from('principal_product_performance')
        .select('*')
        .order('product_performance_score', { ascending: false })

      if (principalId) {
        query = query.eq('principal_id', principalId)
      }

      if (productIds?.length) {
        query = query.in('product_id', productIds)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching principal product performance:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  }

  /**
   * Get chronological activity timeline for a principal
   * Uses the principal_timeline_summary view with ranking
   */
  static async getPrincipalTimeline(
    principalId: string,
    limit = 50
  ): Promise<ApiResponse<PrincipalTimelineSummary[]>> {
    try {
      const { data, error } = await supabase
        .from('principal_timeline_summary')
        .select('*')
        .eq('principal_id', principalId)
        .order('activity_date', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching principal timeline:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  }

  /**
   * Get aggregated principal statistics for dashboard KPIs
   * Uses the get_principal_activity_stats() database function
   */
  static async getPrincipalStats(): Promise<ApiResponse<{
    total_principals: number
    active_principals: number
    principals_with_products: number
    principals_with_opportunities: number
    average_products_per_principal: number
    average_engagement_score: number
    top_performers: any[]
  }>> {
    try {
      const { data, error } = await supabase.rpc('get_principal_activity_stats')

      if (error) {
        console.error('Error fetching principal stats:', error)
        return { success: false, error: error.message }
      }

      // The function returns an array with one result
      const stats = data && data.length > 0 ? data[0] : null

      if (!stats) {
        return { success: false, error: 'No statistics available' }
      }

      return { success: true, data: stats }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  }

  /**
   * Manually refresh the principal activity summary materialized view
   * Should be called when underlying data changes significantly
   */
  static async refreshActivitySummary(): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.rpc('refresh_principal_activity_summary')

      if (error) {
        console.error('Error refreshing principal activity summary:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  }

  /**
   * Get engagement score breakdown for dashboard visualization
   */
  static async getEngagementScoreBreakdown(): Promise<ApiResponse<{
    high_engagement: number // 80-100
    medium_engagement: number // 40-79  
    low_engagement: number // 0-39
    inactive: number // No activity
  }>> {
    try {
      const { data, error } = await supabase
        .from('principal_activity_summary')
        .select('engagement_score, activity_status')

      if (error) {
        console.error('Error fetching engagement breakdown:', error)
        return { success: false, error: error.message }
      }

      // Calculate breakdown
      const breakdown = data.reduce(
        (acc, principal) => {
          if (principal.activity_status === 'NO_ACTIVITY') {
            acc.inactive++
          } else if (principal.engagement_score >= 80) {
            acc.high_engagement++
          } else if (principal.engagement_score >= 40) {
            acc.medium_engagement++
          } else {
            acc.low_engagement++
          }
          return acc
        },
        { high_engagement: 0, medium_engagement: 0, low_engagement: 0, inactive: 0 }
      )

      return { success: true, data: breakdown }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  }

  /**
   * Get principals requiring follow-up actions
   * Filters for principals with scheduled follow-ups or high engagement scores
   */
  static async getPrincipalsRequiringFollowUp(): Promise<ApiResponse<PrincipalActivitySummary[]>> {
    try {
      const { data, error } = await supabase
        .from('principal_activity_summary')
        .select('*')
        .or('follow_ups_required.gt.0,engagement_score.gte.75')
        .order('next_follow_up_date', { ascending: true, nullsLast: true })

      if (error) {
        console.error('Error fetching principals requiring follow-up:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  }

  /**
   * Search principals by name with activity context
   * Includes fuzzy matching and activity status filtering
   */
  static async searchPrincipalsWithActivity(
    searchTerm: string,
    activeOnly = true
  ): Promise<ApiResponse<PrincipalActivitySummary[]>> {
    try {
      let query = supabase
        .from('principal_activity_summary')
        .select('*')
        .ilike('principal_name', `%${searchTerm}%`)
        .order('engagement_score', { ascending: false })

      if (activeOnly) {
        query = query.in('activity_status', ['ACTIVE', 'MODERATE'])
      }

      const { data, error } = await query

      if (error) {
        console.error('Error searching principals with activity:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  }
}

// Export the API class and types for use in stores and components
export default PrincipalActivityApi
export type {
  PrincipalActivitySummary,
  PrincipalDistributorRelationships,
  PrincipalProductPerformance,
  PrincipalTimelineSummary
}