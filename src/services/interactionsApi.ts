/**
 * Interactions API Service
 * Centralized Supabase operations for interaction management
 * Includes KPI calculations, follow-up tracking, and template management
 */

import { supabase } from '@/config/supabaseClient'
import type { 
  Interaction,
  InteractionInsert,
  InteractionUpdate,
  InteractionListView,
  InteractionDetailView,
  InteractionFormData,
  InteractionKPIs,
  InteractionFilters,
  InteractionPagination,
  InteractionListResponse,
  InteractionType,
  InteractionStatus,
  InteractionOutcome,
  InteractionTemplate
} from '@/types/interactions'

/**
 * API Response wrapper for consistent error handling
 */
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

/**
 * Search and pagination options
 */
export interface InteractionSearchOptions {
  search?: string
  limit?: number
  offset?: number
  sortBy?: 'title' | 'type' | 'status' | 'interaction_date' | 'created_at'
  sortOrder?: 'asc' | 'desc'
  type?: InteractionType
  status?: InteractionStatus
  outcome?: InteractionOutcome
  organization_id?: string
  opportunity_id?: string
  principal_id?: string
  conducted_by?: string
  follow_up_required?: boolean
  follow_up_overdue?: boolean
}

/**
 * Follow-up tracking result interface
 */
export interface FollowUpTrackingResult {
  pending: InteractionListView[]
  overdue: InteractionListView[]
  upcoming: InteractionListView[]
}

class InteractionsApiService {

  /**
   * Get all interactions with optional search, filtering, and pagination
   */
  async getInteractions(options: InteractionSearchOptions = {}): Promise<ApiResponse<InteractionListView[]>> {
    try {
      // Get interactions from the main table with related data
      let query = supabase
        .from('interactions')
        .select(`
          *,
          organizations:organization_id(name, type),
          opportunities:opportunity_id(name, stage),
          principals:principal_id(name)
        `)

      // Apply search filter
      if (options.search) {
        query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`)
      }

      // Apply filters
      if (options.type) {
        query = query.eq('type', options.type)
      }
      if (options.status) {
        query = query.eq('status', options.status)
      }
      if (options.outcome) {
        query = query.eq('outcome', options.outcome)
      }
      if (options.organization_id) {
        query = query.eq('organization_id', options.organization_id)  
      }
      if (options.opportunity_id) {
        query = query.eq('opportunity_id', options.opportunity_id)
      }
      if (options.principal_id) {
        query = query.eq('principal_id', options.principal_id)
      }
      if (options.conducted_by) {
        query = query.eq('conducted_by', options.conducted_by)
      }
      if (options.follow_up_required !== undefined) {
        query = query.eq('follow_up_required', options.follow_up_required)
      }

      // Handle overdue follow-up filter
      if (options.follow_up_overdue) {
        const today = new Date().toISOString().split('T')[0]
        query = query
          .eq('follow_up_required', true)
          .lt('follow_up_date', today)
      }

      // Apply sorting
      const sortBy = options.sortBy || 'interaction_date'
      const sortOrder = options.sortOrder || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit)
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error('Database error:', error)
        return { data: null, error: error.message, success: false }
      }

      // Transform data to match InteractionListView interface
      const transformedData: InteractionListView[] = data?.map(interaction => ({
        id: interaction.id,
        type: interaction.type,
        status: interaction.status,
        title: interaction.title,
        interaction_date: interaction.interaction_date,
        duration_minutes: interaction.duration_minutes,
        outcome: interaction.outcome,
        follow_up_required: interaction.follow_up_required,
        follow_up_date: interaction.follow_up_date,
        conducted_by: interaction.conducted_by,
        created_at: interaction.created_at,
        updated_at: interaction.updated_at,
        organization_name: interaction.organizations?.name || '',
        organization_type: interaction.organizations?.type || '',
        opportunity_name: interaction.opportunities?.name || null,
        opportunity_stage: interaction.opportunities?.stage || null,
        principal_name: interaction.principals?.name || null,
        principal_id: interaction.principal_id,
        days_since_interaction: this.calculateDaysSinceInteraction(interaction.interaction_date),
        days_until_follow_up: this.calculateDaysUntilFollowUp(interaction.follow_up_date),
        is_overdue_follow_up: this.isFollowUpOverdue(interaction.follow_up_date, interaction.follow_up_required)
      })) || []

      return { data: transformedData, error: null, success: true }

    } catch (error) {
      console.error('API error:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred', 
        success: false 
      }
    }
  }

  /**
   * Get interactions with advanced filtering and pagination
   */
  async getInteractionsWithFilters(
    filters: InteractionFilters, 
    pagination: InteractionPagination
  ): Promise<ApiResponse<InteractionListResponse>> {
    try {
      const options: InteractionSearchOptions = {
        search: filters.search,
        type: filters.type?.[0], // Take first type if array provided
        status: filters.status?.[0], // Take first status if array provided
        outcome: filters.outcome?.[0], // Take first outcome if array provided
        organization_id: filters.organization_id,
        opportunity_id: filters.opportunity_id,
        principal_id: filters.principal_id,
        conducted_by: filters.conducted_by,
        follow_up_required: filters.follow_up_required,
        follow_up_overdue: filters.follow_up_overdue,
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit,
        sortBy: pagination.sort_by as any,
        sortOrder: pagination.sort_order
      }

      const response = await this.getInteractions(options)
      
      if (!response.success || !response.data) {
        return response as ApiResponse<InteractionListResponse>
      }

      // Get total count for pagination
      const countResponse = await this.getInteractionCount(filters)
      const totalCount = countResponse.data || 0

      const listResponse: InteractionListResponse = {
        interactions: response.data,
        total_count: totalCount,
        page: pagination.page,
        limit: pagination.limit,
        has_next: (pagination.page * pagination.limit) < totalCount,
        has_previous: pagination.page > 1
      }

      return { data: listResponse, error: null, success: true }

    } catch (error) {
      console.error('API error:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred', 
        success: false 
      }
    }
  }

  /**
   * Get total count of interactions matching filters
   */
  async getInteractionCount(filters: InteractionFilters): Promise<ApiResponse<number>> {
    try {
      let query = supabase
        .from('interactions')
        .select('id', { count: 'exact', head: true })

      // Apply same filters as main query
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }
      if (filters.type?.[0]) {
        query = query.eq('type', filters.type[0])
      }
      if (filters.status?.[0]) {
        query = query.eq('status', filters.status[0])
      }
      if (filters.organization_id) {
        query = query.eq('organization_id', filters.organization_id)
      }

      const { count, error } = await query

      if (error) {
        return { data: null, error: error.message, success: false }
      }

      return { data: count || 0, error: null, success: true }

    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred', 
        success: false 
      }
    }
  }

  /**
   * Get a single interaction by ID with full details
   */
  async getInteractionById(id: string): Promise<ApiResponse<InteractionDetailView>> {
    try {
      const { data, error } = await supabase
        .from('interactions')
        .select(`
          *,
          organizations:organization_id(name, type, address, phone, email),
          opportunities:opportunity_id(name, stage, probability_percent, expected_close_date),
          principals:principal_id(name, address, phone, email)
        `)
        .eq('id', id)
        .single()

      if (error) {
        return { data: null, error: error.message, success: false }
      }

      if (!data) {
        return { data: null, error: 'Interaction not found', success: false }
      }

      // Transform to InteractionDetailView
      const detailView: InteractionDetailView = {
        // Base fields
        id: data.id,
        type: data.type,
        status: data.status,
        title: data.title,
        description: data.description,
        interaction_date: data.interaction_date,
        duration_minutes: data.duration_minutes,
        outcome: data.outcome,
        follow_up_required: data.follow_up_required,
        follow_up_date: data.follow_up_date,
        follow_up_notes: data.follow_up_notes,
        conducted_by: data.conducted_by,
        location: data.location,
        meeting_url: data.meeting_url,
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: data.created_by,
        deleted_at: data.deleted_at,
        
        // Organization data
        organization_name: data.organizations?.name || '',
        organization_type: data.organizations?.type || '',
        organization_id: data.organization_id,
        organization_address: data.organizations?.address || null,
        organization_phone: data.organizations?.phone || null,
        organization_email: data.organizations?.email || null,
        
        // Opportunity data
        opportunity_name: data.opportunities?.name || null,
        opportunity_stage: data.opportunities?.stage || null,
        opportunity_id: data.opportunity_id,
        opportunity_probability: data.opportunities?.probability_percent || null,
        opportunity_expected_close: data.opportunities?.expected_close_date || null,
        
        // Principal data
        principal_name: data.principals?.name || null,
        principal_id: data.principal_id,
        principal_address: data.principals?.address || null,
        principal_phone: data.principals?.phone || null,
        principal_email: data.principals?.email || null,
        
        // Calculated fields
        days_since_interaction: this.calculateDaysSinceInteraction(data.interaction_date),
        days_until_follow_up: this.calculateDaysUntilFollowUp(data.follow_up_date),
        is_overdue_follow_up: this.isFollowUpOverdue(data.follow_up_date, data.follow_up_required),
        related_interactions_count: 0, // Would need separate query
        recent_opportunity_interactions: 0 // Would need separate query
      }

      return { data: detailView, error: null, success: true }

    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred', 
        success: false 
      }
    }
  }

  /**
   * Create a new interaction
   */
  async createInteraction(interactionData: InteractionFormData): Promise<ApiResponse<Interaction>> {
    try {
      const insertData: InteractionInsert = {
        type: interactionData.type,
        status: interactionData.status,
        title: interactionData.title,
        description: interactionData.description,
        interaction_date: interactionData.interaction_date,
        duration_minutes: interactionData.duration_minutes,
        outcome: interactionData.outcome,
        follow_up_required: interactionData.follow_up_required,
        follow_up_date: interactionData.follow_up_date,
        follow_up_notes: interactionData.follow_up_notes,
        organization_id: interactionData.organization_id,
        opportunity_id: interactionData.opportunity_id,
        principal_id: interactionData.principal_id,
        conducted_by: interactionData.conducted_by,
        location: interactionData.location,
        meeting_url: interactionData.meeting_url
      }

      const { data, error } = await supabase
        .from('interactions')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        return { data: null, error: error.message, success: false }
      }

      return { data, error: null, success: true }

    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred', 
        success: false 
      }
    }
  }

  /**
   * Update an existing interaction
   */
  async updateInteraction(id: string, updates: Partial<InteractionFormData>): Promise<ApiResponse<Interaction>> {
    try {
      const updateData: InteractionUpdate = {
        ...(updates.type && { type: updates.type }),
        ...(updates.status && { status: updates.status }),
        ...(updates.title && { title: updates.title }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.interaction_date && { interaction_date: updates.interaction_date }),
        ...(updates.duration_minutes !== undefined && { duration_minutes: updates.duration_minutes }),
        ...(updates.outcome !== undefined && { outcome: updates.outcome }),
        ...(updates.follow_up_required !== undefined && { follow_up_required: updates.follow_up_required }),
        ...(updates.follow_up_date !== undefined && { follow_up_date: updates.follow_up_date }),
        ...(updates.follow_up_notes !== undefined && { follow_up_notes: updates.follow_up_notes }),
        ...(updates.organization_id && { organization_id: updates.organization_id }),
        ...(updates.opportunity_id !== undefined && { opportunity_id: updates.opportunity_id }),
        ...(updates.principal_id !== undefined && { principal_id: updates.principal_id }),
        ...(updates.conducted_by !== undefined && { conducted_by: updates.conducted_by }),
        ...(updates.location !== undefined && { location: updates.location }),
        ...(updates.meeting_url !== undefined && { meeting_url: updates.meeting_url })
      }

      const { data, error } = await supabase
        .from('interactions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { data: null, error: error.message, success: false }
      }

      return { data, error: null, success: true }

    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred', 
        success: false 
      }
    }
  }

  /**
   * Delete an interaction (soft delete)
   */
  async deleteInteraction(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('interactions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        return { data: null, error: error.message, success: false }
      }

      return { data: true, error: null, success: true }

    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred', 
        success: false 
      }
    }
  }

  /**
   * Get interaction KPIs for dashboard
   */
  async getInteractionKPIs(): Promise<ApiResponse<InteractionKPIs>> {
    try {
      // This would involve multiple queries to calculate KPIs
      // For now, return mock data structure
      
      const mockKPIs: InteractionKPIs = {
        total_interactions: 0,
        this_week_interactions: 0,
        this_month_interactions: 0,
        pending_follow_ups: 0,
        overdue_follow_ups: 0,
        average_duration_minutes: 0,
        positive_outcomes_percentage: 0,
        follow_up_completion_rate: 0,
        type_distribution: {} as any,
        outcome_distribution: {} as any,
        interactions_this_week: 0,
        interactions_last_week: 0,
        week_over_week_change: 0
      }

      return { data: mockKPIs, error: null, success: true }

    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred', 
        success: false 
      }
    }
  }

  /**
   * Get follow-up tracking data
   */
  async getFollowUpTracking(): Promise<ApiResponse<FollowUpTrackingResult>> {
    try {
      const today = new Date().toISOString().split('T')[0]
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Get overdue follow-ups
      const overdueResponse = await this.getInteractions({
        follow_up_required: true,
        follow_up_overdue: true,
        limit: 50
      })

      // Get upcoming follow-ups
      const upcomingResponse = await this.getInteractions({
        follow_up_required: true,
        limit: 50
      })

      const result: FollowUpTrackingResult = {
        pending: upcomingResponse.data?.filter(i => 
          i.follow_up_date && i.follow_up_date >= today
        ) || [],
        overdue: overdueResponse.data || [],
        upcoming: upcomingResponse.data?.filter(i => 
          i.follow_up_date && i.follow_up_date >= today && i.follow_up_date <= nextWeek
        ) || []
      }

      return { data: result, error: null, success: true }

    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred', 
        success: false 
      }
    }
  }

  /**
   * Get interaction templates
   */
  async getInteractionTemplates(): Promise<ApiResponse<InteractionTemplate[]>> {
    try {
      // This would query a templates table
      // For now, return empty array to trigger fallback to defaults
      return { data: [], error: 'Templates not implemented', success: false }

    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred', 
        success: false 
      }
    }
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  /**
   * Calculate days since interaction date
   */
  private calculateDaysSinceInteraction(interactionDate: string): number {
    const interaction = new Date(interactionDate)
    const today = new Date()
    const diffTime = today.getTime() - interaction.getTime()
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Calculate days until follow-up date
   */
  private calculateDaysUntilFollowUp(followUpDate: string | null): number | null {
    if (!followUpDate) return null
    
    const followUp = new Date(followUpDate)
    const today = new Date()
    const diffTime = followUp.getTime() - today.getTime()
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Check if follow-up is overdue
   */
  private isFollowUpOverdue(followUpDate: string | null, followUpRequired: boolean): boolean {
    if (!followUpRequired || !followUpDate) return false
    
    const followUp = new Date(followUpDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return followUp < today
  }
}

// Export singleton instance
export const interactionsApi = new InteractionsApiService()