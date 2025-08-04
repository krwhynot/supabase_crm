/**
 * Interactions API Service
 * Handles all API interactions for the interaction management system
 * Follows established patterns from opportunitiesApi for consistency
 * Provides full CRUD operations with proper error handling and fallbacks
 */

import { supabase } from '@/config/supabaseClient'
import type {
  Interaction,
  InteractionListView,
  InteractionDetailView,
  InteractionFormData,
  InteractionKPIs,
  InteractionFilters,
  InteractionPagination,
  InteractionListResponse
} from '@/types/interactions'
import type {
  InteractionInsert,
  InteractionUpdate,
  InteractionType,
  InteractionStatus,
  InteractionOutcome
} from '@/types/database.types'

/**
 * API Response wrapper for consistent error handling
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  metadata?: {
    total_count?: number
    page?: number
    limit?: number
    has_next?: boolean
    has_previous?: boolean
  }
}

/**
 * Interactions API class with comprehensive CRUD operations
 */
class InteractionsApiService {
  
  /**
   * Check if Supabase is available
   */
  private async isSupabaseAvailable(): Promise<boolean> {
    try {
      if (!supabase) return false
      
      // Test connection with a simple query
      const { error } = await supabase
        .from('interactions')
        .select('count')
        .limit(1)
      
      return !error
    } catch {
      return false
    }
  }

  /**
   * Get interactions with filtering and pagination
   */
  async getInteractionsWithFilters(
    filters: InteractionFilters = {},
    pagination: InteractionPagination = { page: 1, limit: 20, sort_by: 'interaction_date', sort_order: 'desc' }
  ): Promise<ApiResponse<InteractionListResponse>> {
    console.log('API Call: getInteractionsWithFilters', { filters, pagination })
    
    if (!await this.isSupabaseAvailable()) {
      return {
        success: false,
        error: 'Database connection not available'
      }
    }

    try {
      let query = supabase
        .from('interactions')
        .select(`
          id,
          type,
          subject,
          interaction_date,
          opportunity_id,
          status,
          outcome,
          duration_minutes,
          rating,
          follow_up_required,
          follow_up_date,
          created_at,
          updated_at,
          opportunities (
            id,
            name,
            organization_id,
            organizations (
              name
            )
          )
        `)
        .is('deleted_at', null)

      // Apply filters
      if (filters.opportunity_id) {
        query = query.eq('opportunity_id', filters.opportunity_id)
      }
      
      if (filters.type) {
        query = query.eq('type', filters.type)
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      
      if (filters.outcome) {
        query = query.eq('outcome', filters.outcome)
      }
      
      if (filters.date_from) {
        query = query.gte('interaction_date', filters.date_from)
      }
      
      if (filters.date_to) {
        query = query.lte('interaction_date', filters.date_to)
      }
      
      if (filters.search) {
        query = query.or(`subject.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`)
      }
      
      if (filters.follow_up_required !== undefined) {
        query = query.eq('follow_up_required', filters.follow_up_required)
      }

      // Apply sorting
      const sortColumn = pagination.sort_by || 'interaction_date'
      const sortOrder = pagination.sort_order === 'asc' ? { ascending: true } : { ascending: false }
      query = query.order(sortColumn, sortOrder)

      // Apply pagination
      const from = ((pagination.page || 1) - 1) * (pagination.limit || 20)
      const to = from + (pagination.limit || 20) - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        console.error('Error in getInteractionsWithFilters:', error)
        return {
          success: false,
          error: error.message
        }
      }

      // Transform data to InteractionListView format
      const interactions: InteractionListView[] = data?.map(interaction => ({
        id: interaction.id,
        type: interaction.type as InteractionType,
        subject: interaction.subject,
        interaction_date: interaction.interaction_date,
        opportunity_id: interaction.opportunity_id,
        status: interaction.status as InteractionStatus,
        outcome: interaction.outcome as InteractionOutcome | null,
        duration_minutes: interaction.duration_minutes,
        rating: interaction.rating,
        follow_up_required: interaction.follow_up_required || false,
        follow_up_date: interaction.follow_up_date,
        created_at: interaction.created_at,
        updated_at: interaction.updated_at,
        opportunity_name: interaction.opportunities?.name || '',
        organization_name: interaction.opportunities?.organizations?.name || '',
        days_since_interaction: this.calculateDaysSince(interaction.interaction_date),
        days_until_followup: interaction.follow_up_date ? 
          this.calculateDaysUntil(interaction.follow_up_date) : null
      })) || []

      const totalCount = count || 0
      const currentPage = pagination.page || 1
      const limit = pagination.limit || 20
      
      return {
        success: true,
        data: {
          interactions,
          total_count: totalCount,
          page: currentPage,
          limit,
          has_next: (currentPage * limit) < totalCount,
          has_previous: currentPage > 1
        }
      }

    } catch (error) {
      console.error('Error in getInteractionsWithFilters:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected error occurred'
      }
    }
  }

  /**
   * Get interactions for a specific opportunity
   */
  async getInteractionsByOpportunity(opportunityId: string): Promise<ApiResponse<InteractionListView[]>> {
    console.log('API Call: getInteractionsByOpportunity', { opportunityId })
    
    if (!await this.isSupabaseAvailable()) {
      return {
        success: false,
        error: 'Database connection not available'
      }
    }

    try {
      const { data, error } = await supabase
        .from('interactions')
        .select(`
          id,
          type,
          subject,
          interaction_date,
          opportunity_id,
          status,
          outcome,
          duration_minutes,
          rating,
          follow_up_required,
          follow_up_date,
          created_at,
          updated_at,
          opportunities (
            name,
            organizations (
              name
            )
          )
        `)
        .eq('opportunity_id', opportunityId)
        .is('deleted_at', null)
        .order('interaction_date', { ascending: false })

      if (error) {
        console.error('Error in getInteractionsByOpportunity:', error)
        return {
          success: false,
          error: error.message
        }
      }

      const interactions: InteractionListView[] = data?.map(interaction => ({
        id: interaction.id,
        type: interaction.type as InteractionType,
        subject: interaction.subject,
        interaction_date: interaction.interaction_date,
        opportunity_id: interaction.opportunity_id,
        status: interaction.status as InteractionStatus,
        outcome: interaction.outcome as InteractionOutcome | null,
        duration_minutes: interaction.duration_minutes,
        rating: interaction.rating,
        follow_up_required: interaction.follow_up_required || false,
        follow_up_date: interaction.follow_up_date,
        created_at: interaction.created_at,
        updated_at: interaction.updated_at,
        opportunity_name: interaction.opportunities?.name || '',
        organization_name: interaction.opportunities?.organizations?.name || '',
        days_since_interaction: this.calculateDaysSince(interaction.interaction_date),
        days_until_followup: interaction.follow_up_date ? 
          this.calculateDaysUntil(interaction.follow_up_date) : null
      })) || []

      return {
        success: true,
        data: interactions
      }

    } catch (error) {
      console.error('Error in getInteractionsByOpportunity:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected error occurred'
      }
    }
  }

  /**
   * Get a single interaction by ID
   */
  async getInteractionById(id: string): Promise<ApiResponse<InteractionDetailView>> {
    console.log('API Call: getInteractionById', { id })
    
    if (!await this.isSupabaseAvailable()) {
      return {
        success: false,
        error: 'Database connection not available'
      }
    }

    try {
      const { data, error } = await supabase
        .from('interactions')
        .select(`
          *,
          opportunities (
            id,
            name,
            stage,
            organization_id,
            organizations (
              id,
              name,
              type
            )
          )
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .single()

      if (error) {
        console.error('Error in getInteractionById:', error)
        return {
          success: false,
          error: error.message
        }
      }

      const interaction: InteractionDetailView = {
        id: data.id,
        type: data.type as InteractionType,
        subject: data.subject,
        interaction_date: data.interaction_date,
        opportunity_id: data.opportunity_id,
        status: data.status as InteractionStatus,
        outcome: data.outcome as InteractionOutcome | null,
        notes: data.notes,
        duration_minutes: data.duration_minutes,
        location: data.location,
        follow_up_required: data.follow_up_required || false,
        follow_up_date: data.follow_up_date,
        follow_up_notes: data.follow_up_notes,
        rating: data.rating,
        next_action: data.next_action,
        contact_method: data.contact_method,
        participants: data.participants || [],
        attachments: data.attachments || [],
        tags: data.tags || [],
        custom_fields: data.custom_fields || {},
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: data.created_by,
        opportunity: data.opportunities ? {
          id: data.opportunities.id,
          name: data.opportunities.name,
          stage: data.opportunities.stage,
          organization: data.opportunities.organizations ? {
            id: data.opportunities.organizations.id,
            name: data.opportunities.organizations.name,
            type: data.opportunities.organizations.type
          } : null
        } : null
      }

      return {
        success: true,
        data: interaction
      }

    } catch (error) {
      console.error('Error in getInteractionById:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected error occurred'
      }
    }
  }

  /**
   * Create a new interaction
   */
  async createInteraction(interactionData: InteractionFormData): Promise<ApiResponse<Interaction>> {
    console.log('API Call: createInteraction', { interactionData })
    
    if (!await this.isSupabaseAvailable()) {
      return {
        success: false,
        error: 'Database connection not available'
      }
    }

    try {
      const insertData: InteractionInsert = {
        type: interactionData.type,
        subject: interactionData.subject,
        interaction_date: interactionData.interaction_date,
        opportunity_id: interactionData.opportunity_id,
        status: interactionData.status || 'SCHEDULED',
        outcome: interactionData.outcome || null,
        notes: interactionData.notes || null,
        duration_minutes: interactionData.duration_minutes || null,
        location: interactionData.location || null,
        follow_up_required: interactionData.follow_up_required || false,
        follow_up_date: interactionData.follow_up_date || null,
        follow_up_notes: interactionData.follow_up_notes || null,
        rating: interactionData.rating || null,
        next_action: interactionData.next_action || null,
        contact_method: interactionData.contact_method || null,
        participants: interactionData.participants || [],
        attachments: interactionData.attachments || [],
        tags: interactionData.tags || [],
        custom_fields: interactionData.custom_fields || {},
        created_by: interactionData.created_by || null
      }

      const { data, error } = await supabase
        .from('interactions')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Error in createInteraction:', error)
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        data: data as Interaction
      }

    } catch (error) {
      console.error('Error in createInteraction:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected error occurred'
      }
    }
  }

  /**
   * Update an existing interaction
   */
  async updateInteraction(id: string, updates: Partial<InteractionUpdate>): Promise<ApiResponse<Interaction>> {
    console.log('API Call: updateInteraction', { id, updates })
    
    if (!await this.isSupabaseAvailable()) {
      return {
        success: false,
        error: 'Database connection not available'
      }
    }

    try {
      const { data, error } = await supabase
        .from('interactions')
        .update(updates)
        .eq('id', id)
        .is('deleted_at', null)
        .select()
        .single()

      if (error) {
        console.error('Error in updateInteraction:', error)
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        data: data as Interaction
      }

    } catch (error) {
      console.error('Error in updateInteraction:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected error occurred'
      }
    }
  }

  /**
   * Delete an interaction (soft delete)
   */
  async deleteInteraction(id: string): Promise<ApiResponse<void>> {
    console.log('API Call: deleteInteraction', { id })
    
    if (!await this.isSupabaseAvailable()) {
      return {
        success: false,
        error: 'Database connection not available'
      }
    }

    try {
      const { error } = await supabase
        .from('interactions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        console.error('Error in deleteInteraction:', error)
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true
      }

    } catch (error) {
      console.error('Error in deleteInteraction:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected error occurred'
      }
    }
  }

  /**
   * Get interaction KPIs for dashboard
   */
  async getInteractionKPIs(): Promise<ApiResponse<InteractionKPIs>> {
    console.log('API Call: getInteractionKPIs')
    
    if (!await this.isSupabaseAvailable()) {
      return {
        success: false,
        error: 'Database connection not available'
      }
    }

    try {
      // Get basic counts
      const { data: totalData } = await supabase
        .from('interactions')
        .select('id', { count: 'exact' })
        .is('deleted_at', null)

      const { data: completedData } = await supabase
        .from('interactions')
        .select('id', { count: 'exact' })
        .eq('status', 'COMPLETED')
        .is('deleted_at', null)

      const { data: scheduledData } = await supabase
        .from('interactions')
        .select('id', { count: 'exact' })
        .eq('status', 'SCHEDULED')
        .is('deleted_at', null)

      const { data: positiveData } = await supabase
        .from('interactions')
        .select('id', { count: 'exact' })
        .eq('outcome', 'POSITIVE')
        .is('deleted_at', null)

      // Get follow-up counts
      const { data: pendingFollowUps } = await supabase
        .from('interactions')
        .select('id', { count: 'exact' })
        .eq('follow_up_required', true)
        .gte('follow_up_date', new Date().toISOString())
        .is('deleted_at', null)

      const { data: overdueFollowUps } = await supabase
        .from('interactions')
        .select('id', { count: 'exact' })
        .eq('follow_up_required', true)
        .lt('follow_up_date', new Date().toISOString())
        .is('deleted_at', null)

      // Get this month's interactions
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { data: thisMonthData } = await supabase
        .from('interactions')
        .select('id', { count: 'exact' })
        .gte('created_at', startOfMonth.toISOString())
        .is('deleted_at', null)

      // Get last month's interactions
      const startOfLastMonth = new Date(startOfMonth)
      startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1)
      const endOfLastMonth = new Date(startOfMonth)
      endOfLastMonth.setTime(endOfLastMonth.getTime() - 1)

      const { data: lastMonthData } = await supabase
        .from('interactions')
        .select('id', { count: 'exact' })
        .gte('created_at', startOfLastMonth.toISOString())
        .lte('created_at', endOfLastMonth.toISOString())
        .is('deleted_at', null)

      // Get average rating and duration
      const { data: ratingData } = await supabase
        .from('interactions')
        .select('rating, duration_minutes')
        .not('rating', 'is', null)
        .is('deleted_at', null)

      const ratings = ratingData?.map(r => r.rating).filter(r => r !== null) || []
      const durations = ratingData?.map(r => r.duration_minutes).filter(d => d !== null) || []

      const averageRating = ratings.length > 0 ? 
        ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0

      const averageDuration = durations.length > 0 ? 
        durations.reduce((sum, duration) => sum + duration, 0) / durations.length : 0

      // Get most common type
      const { data: typeData } = await supabase
        .from('interactions')
        .select('type')
        .is('deleted_at', null)

      const typeCounts: { [key: string]: number } = {}
      typeData?.forEach(item => {
        typeCounts[item.type] = (typeCounts[item.type] || 0) + 1
      })

      const mostCommonType = Object.keys(typeCounts).reduce((a, b) => 
        typeCounts[a] > typeCounts[b] ? a : b, 'CALL'
      ) as InteractionType

      const totalInteractions = totalData?.length || 0
      const completedInteractions = completedData?.length || 0
      const positiveOutcomes = positiveData?.length || 0

      const kpis: InteractionKPIs = {
        total_interactions: totalInteractions,
        completed_interactions: completedInteractions,
        scheduled_interactions: scheduledData?.length || 0,
        positive_outcomes: positiveOutcomes,
        success_rate: completedInteractions > 0 ? 
          Math.round((positiveOutcomes / completedInteractions) * 100) : 0,
        average_rating: Math.round(averageRating * 10) / 10,
        pending_follow_ups: pendingFollowUps?.length || 0,
        overdue_follow_ups: overdueFollowUps?.length || 0,
        interactions_this_month: thisMonthData?.length || 0,
        interactions_last_month: lastMonthData?.length || 0,
        average_duration_minutes: Math.round(averageDuration),
        most_common_type: mostCommonType
      }

      return {
        success: true,
        data: kpis
      }

    } catch (error) {
      console.error('Error in getInteractionKPIs:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected error occurred'
      }
    }
  }

  /**
   * Get upcoming follow-ups
   */
  async getUpcomingFollowUps(): Promise<ApiResponse<InteractionListView[]>> {
    console.log('API Call: getUpcomingFollowUps')
    
    if (!await this.isSupabaseAvailable()) {
      return {
        success: false,
        error: 'Database connection not available'
      }
    }

    try {
      const { data, error } = await supabase
        .from('interactions')
        .select(`
          id,
          type,
          subject,
          interaction_date,
          opportunity_id,
          status,
          outcome,
          duration_minutes,
          rating,
          follow_up_required,
          follow_up_date,
          created_at,
          updated_at,
          opportunities (
            name,
            organizations (
              name
            )
          )
        `)
        .eq('follow_up_required', true)
        .not('follow_up_date', 'is', null)
        .is('deleted_at', null)
        .order('follow_up_date', { ascending: true })

      if (error) {
        console.error('Error in getUpcomingFollowUps:', error)
        return {
          success: false,
          error: error.message
        }
      }

      const interactions: InteractionListView[] = data?.map(interaction => ({
        id: interaction.id,
        type: interaction.type as InteractionType,
        subject: interaction.subject,
        interaction_date: interaction.interaction_date,
        opportunity_id: interaction.opportunity_id,
        status: interaction.status as InteractionStatus,
        outcome: interaction.outcome as InteractionOutcome | null,
        duration_minutes: interaction.duration_minutes,
        rating: interaction.rating,
        follow_up_required: interaction.follow_up_required || false,
        follow_up_date: interaction.follow_up_date,
        created_at: interaction.created_at,
        updated_at: interaction.updated_at,
        opportunity_name: interaction.opportunities?.name || '',
        organization_name: interaction.opportunities?.organizations?.name || '',
        days_since_interaction: this.calculateDaysSince(interaction.interaction_date),
        days_until_followup: interaction.follow_up_date ? 
          this.calculateDaysUntil(interaction.follow_up_date) : null
      })) || []

      return {
        success: true,
        data: interactions
      }

    } catch (error) {
      console.error('Error in getUpcomingFollowUps:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected error occurred'
      }
    }
  }

  /**
   * Get recent interactions
   */
  async getRecentInteractions(limit: number = 10): Promise<ApiResponse<InteractionListView[]>> {
    console.log('API Call: getRecentInteractions', { limit })
    
    if (!await this.isSupabaseAvailable()) {
      return {
        success: false,
        error: 'Database connection not available'
      }
    }

    try {
      const { data, error } = await supabase
        .from('interactions')
        .select(`
          id,
          type,
          subject,
          interaction_date,
          opportunity_id,
          status,
          outcome,
          duration_minutes,
          rating,
          follow_up_required,
          follow_up_date,
          created_at,
          updated_at,
          opportunities (
            name,
            organizations (
              name
            )
          )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error in getRecentInteractions:', error)
        return {
          success: false,
          error: error.message
        }
      }

      const interactions: InteractionListView[] = data?.map(interaction => ({
        id: interaction.id,
        type: interaction.type as InteractionType,
        subject: interaction.subject,
        interaction_date: interaction.interaction_date,
        opportunity_id: interaction.opportunity_id,
        status: interaction.status as InteractionStatus,
        outcome: interaction.outcome as InteractionOutcome | null,
        duration_minutes: interaction.duration_minutes,
        rating: interaction.rating,
        follow_up_required: interaction.follow_up_required || false,
        follow_up_date: interaction.follow_up_date,
        created_at: interaction.created_at,
        updated_at: interaction.updated_at,
        opportunity_name: interaction.opportunities?.name || '',
        organization_name: interaction.opportunities?.organizations?.name || '',
        days_since_interaction: this.calculateDaysSince(interaction.interaction_date),
        days_until_followup: interaction.follow_up_date ? 
          this.calculateDaysUntil(interaction.follow_up_date) : null
      })) || []

      return {
        success: true,
        data: interactions
      }

    } catch (error) {
      console.error('Error in getRecentInteractions:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected error occurred'
      }
    }
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  /**
   * Calculate days since a given date
   */
  private calculateDaysSince(dateString: string): number {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Calculate days until a given date
   */
  private calculateDaysUntil(dateString: string): number {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
}

// Export singleton instance
export const interactionsApi = new InteractionsApiService()