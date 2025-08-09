/**
 * Opportunities API Service
 * Centralized Supabase operations for opportunity management
 * Includes batch creation, pipeline management, and KPI calculations
 */

import { supabase } from '@/config/supabaseClient'
import type { 
  Opportunity,
  OpportunityInsert,
  OpportunityUpdate,
  OpportunityListView,
  OpportunityDetailView,
  OpportunityFormData,
  OpportunityNamePreview,
  BatchCreationResult,
  OpportunityKPIs,
  OpportunityFilters,
  OpportunityPagination,
  OpportunityListResponse,
  OpportunityStage,
  OpportunityContext
} from '@/types/opportunities'
import { STAGE_DEFAULT_PROBABILITY } from '@/types/opportunities'
import { generateBatchNamePreviews } from './opportunityNaming'

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
export interface OpportunitySearchOptions {
  search?: string
  limit?: number
  offset?: number
  sortBy?: 'name' | 'stage' | 'probability_percent' | 'expected_close_date' | 'created_at'
  sortOrder?: 'asc' | 'desc'
  stage?: OpportunityStage
  organization_id?: string
  principal_id?: string
  deal_owner?: string
  is_won?: boolean
}

class OpportunitiesApiService {

  /**
   * Get all opportunities with optional search, filtering, and pagination
   */
  async getOpportunities(options: OpportunitySearchOptions = {}): Promise<ApiResponse<OpportunityListView[]>> {
    try {
      // Get opportunities from the main table with related data
      let query = supabase
        .from('opportunities')
        .select(`
          *,
          organizations:organization_id(name, type),
          products:product_id(name, category)
        `)

      // Apply search filter
      if (options.search) {
        query = query.ilike('name', `%${options.search}%`)
      }

      // Apply filters
      if (options.stage) {
        query = query.eq('stage', options.stage)
      }
      if (options.organization_id) {
        query = query.eq('organization_id', options.organization_id)  
      }
      if (options.deal_owner) {
        query = query.eq('deal_owner', options.deal_owner)
      }
      if (options.is_won !== undefined) {
        query = query.eq('is_won', options.is_won)
      }

      // Apply sorting
      const sortBy = options.sortBy || 'created_at'
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
        console.error('Error fetching opportunities:', error)
        return { data: null, error: error.message, success: false }
      }

      // Transform database result to match OpportunityListView interface
      const opportunities: OpportunityListView[] = (data || []).map((row: any) => {
        const createdDate = new Date(row.created_at || new Date())
        const now = new Date()
        const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
        
        let daysToClose = null
        if (row.expected_close_date) {
          const closeDate = new Date(row.expected_close_date)
          daysToClose = Math.floor((closeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        }

        return {
          id: row.id,
          name: row.name,
          stage: row.stage as OpportunityStage,
          probability_percent: row.probability_percent || 0,
          expected_close_date: row.expected_close_date,
          deal_owner: row.deal_owner,
          is_won: row.is_won || false,
          created_at: row.created_at || new Date().toISOString(),
          updated_at: row.updated_at || new Date().toISOString(),
          notes: row.notes || null,
          organization_name: (row.organizations as any)?.name || '',
          organization_type: (row.organizations as any)?.type || '',
          principal_name: null, // Will be populated when junction table is implemented
          principal_id: null,
          product_name: (row.products as any)?.name || null,
          product_category: (row.products as any)?.category || null,
          days_since_created: daysSinceCreated,
          days_to_close: daysToClose,
          stage_duration_days: daysSinceCreated // Simplified for now
        }
      })

      return { data: opportunities, error: null, success: true }

    } catch (error) {
      console.error('Unexpected error in getOpportunities:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred', 
        success: false 
      }
    }
  }

  /**
   * Get opportunities with advanced filtering and pagination
   */
  async getOpportunitiesWithFilters(
    filters: OpportunityFilters, 
    pagination: OpportunityPagination
  ): Promise<ApiResponse<OpportunityListResponse>> {
    try {
      let query = supabase
        .from('opportunities')
        .select(`
          *,
          organizations:organization_id(name, type),
          products:product_id(name, category)
        `, { count: 'exact' })

      // Apply filters
      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`)
      }
      if (filters.stage && filters.stage.length > 0) {
        query = query.in('stage', filters.stage)
      }
      if (filters.organization_id) {
        query = query.eq('organization_id', filters.organization_id)
      }
      if (filters.product_id) {
        query = query.eq('product_id', filters.product_id)
      }
      if (filters.deal_owner) {
        query = query.eq('deal_owner', filters.deal_owner)
      }
      if (filters.probability_min !== undefined) {
        query = query.gte('probability_percent', filters.probability_min)
      }
      if (filters.probability_max !== undefined) {
        query = query.lte('probability_percent', filters.probability_max)
      }
      if (filters.is_won !== undefined) {
        query = query.eq('is_won', filters.is_won)
      }

      // Apply sorting and pagination
      query = query
        .order(pagination.sort_by, { ascending: pagination.sort_order === 'asc' })
        .range(
          (pagination.page - 1) * pagination.limit,
          pagination.page * pagination.limit - 1
        )

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching filtered opportunities:', error)
        return { data: null, error: error.message, success: false }
      }

      // Transform data
      const opportunities: OpportunityListView[] = (data || []).map((row: any) => {
        const createdDate = new Date(row.created_at || new Date())
        const now = new Date()
        const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
        
        let daysToClose = null
        if (row.expected_close_date) {
          const closeDate = new Date(row.expected_close_date)
          daysToClose = Math.floor((closeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        }

        return {
          id: row.id,
          name: row.name,
          stage: row.stage as OpportunityStage,
          probability_percent: row.probability_percent || 0,
          expected_close_date: row.expected_close_date,
          deal_owner: row.deal_owner,
          is_won: row.is_won || false,
          created_at: row.created_at || new Date().toISOString(),
          updated_at: row.updated_at || new Date().toISOString(),
          notes: row.notes || null,
          organization_name: (row.organizations as any)?.name || '',
          organization_type: (row.organizations as any)?.type || '',
          principal_name: null,
          principal_id: null,
          product_name: (row.products as any)?.name || null,
          product_category: (row.products as any)?.category || null,
          days_since_created: daysSinceCreated,
          days_to_close: daysToClose,
          stage_duration_days: daysSinceCreated
        }
      })

      const totalCount = count || 0
      const response: OpportunityListResponse = {
        opportunities,
        total_count: totalCount,
        page: pagination.page,
        limit: pagination.limit,
        has_next: pagination.page * pagination.limit < totalCount,
        has_previous: pagination.page > 1
      }

      return { data: response, error: null, success: true }

    } catch (error) {
      console.error('Unexpected error in getOpportunitiesWithFilters:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred', 
        success: false 
      }
    }
  }

  /**
   * Get a single opportunity by ID with detailed information
   */
  async getOpportunityById(id: string): Promise<ApiResponse<OpportunityDetailView>> {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          *,
          organizations:organization_id(name, type, address, phone, email),
          products:product_id(name, description, category, suggested_retail_price)
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching opportunity:', error)
        return { data: null, error: error.message, success: false }
      }

      if (!data) {
        return { data: null, error: 'Opportunity not found', success: false }
      }

      // Transform to OpportunityDetailView
      const createdDate = new Date(data.created_at || new Date())
      const now = new Date()
      const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
      
      let daysToClose = null
      if (data.expected_close_date) {
        const closeDate = new Date(data.expected_close_date)
        daysToClose = Math.floor((closeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      }

      const opportunity: OpportunityDetailView = {
        id: data.id,
        name: data.name,
        organization_id: data.organization_id,
        stage: data.stage as OpportunityStage,
        product_id: data.product_id,
        context: data.context as OpportunityContext | null,
        probability_percent: data.probability_percent || 0,
        expected_close_date: data.expected_close_date,
        deal_owner: data.deal_owner,
        notes: data.notes,
        is_won: data.is_won || false,
        auto_generated_name: data.auto_generated_name || false,
        name_template: data.name_template,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
        created_by: data.created_by,
        deleted_at: data.deleted_at,
        
        // Organization data
        organization_name: (data.organizations as any)?.name || '',
        organization_type: (data.organizations as any)?.type || '',
        organization_address: (data.organizations as any)?.address || null,
        organization_phone: (data.organizations as any)?.phone || null,
        organization_email: (data.organizations as any)?.email || null,
        
        // Principal data (placeholder)
        principal_name: null,
        principal_id: null,
        principal_address: null,
        principal_phone: null,
        principal_email: null,
        
        // Product data
        product_name: (data.products as any)?.name || null,
        product_description: (data.products as any)?.description || null,
        product_category: (data.products as any)?.category || null,
        product_unit_price: (data.products as any)?.suggested_retail_price || null,
        
        // Calculated fields
        days_since_created: daysSinceCreated,
        days_to_close: daysToClose,
        stage_duration_days: daysSinceCreated,
        
        // Activity indicators (placeholder)
        has_recent_interactions: false,
        last_interaction_date: null,
        total_interactions: 0
      }

      return { data: opportunity, error: null, success: true }

    } catch (error) {
      console.error('Unexpected error in getOpportunityById:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred', 
        success: false 
      }
    }
  }

  /**
   * Create a single opportunity
   */
  async createOpportunity(opportunity: OpportunityInsert): Promise<ApiResponse<Opportunity>> {
    try {
      // Clean the opportunity data to match database schema
      const cleanedOpportunity = {
        ...opportunity,
        probability_percent: opportunity.probability_percent ?? undefined
      }

      const { data, error } = await supabase
        .from('opportunities')
        .insert(cleanedOpportunity)
        .select()
        .single()

      if (error) {
        console.error('Error creating opportunity:', error)
        return { data: null, error: error.message, success: false }
      }

      return { data: data as Opportunity, error: null, success: true }

    } catch (error) {
      console.error('Unexpected error in createOpportunity:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred', 
        success: false 
      }
    }
  }

  /**
   * Create multiple opportunities for different principals (batch creation)
   */
  async createBatchOpportunities(formData: OpportunityFormData): Promise<ApiResponse<BatchCreationResult>> {
    try {
      // Get organization name for name generation
      const { data: orgData } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', formData.organization_id)
        .single()

      const organizationName = orgData?.name || 'Unknown Organization'

      // Get principal names for name generation  
      const { data: principalData } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', formData.principal_ids)

      const principalDataFormatted = (principalData || []).map((p: any) => ({
        id: p.id,
        name: p.name
      }))

      // Generate name previews for all principals
      const namePreviews = await generateBatchNamePreviews({
        organization_name: organizationName,
        principal_data: principalDataFormatted,
        context: formData.context,
        custom_context: formData.name_template || undefined
      })

      const createdOpportunities: Opportunity[] = []
      const failedCreations: { principal_id: string; principal_name: string; error: string }[] = []

      // Create opportunities for each principal
      for (const preview of namePreviews) {
        try {
          const opportunityData: OpportunityInsert = {
            name: formData.auto_generate_name ? preview.generated_name : formData.name,
            organization_id: formData.organization_id,
            stage: formData.stage,
            product_id: formData.product_id || null,
            context: formData.context,
            probability_percent: formData.probability_percent || null,
            expected_close_date: formData.expected_close_date,
            deal_owner: formData.deal_owner,
            notes: formData.notes,
            auto_generated_name: formData.auto_generate_name,
            name_template: formData.auto_generate_name ? preview.name_template : null
          }

          const result = await this.createOpportunity(opportunityData)
          
          if (result.success && result.data) {
            createdOpportunities.push(result.data)
            
            // TODO: Create opportunity_principal relationship
            // This will be implemented when the junction table is set up
            
          } else {
            failedCreations.push({
              principal_id: preview.principal_id,
              principal_name: preview.principal_name,
              error: result.error || 'Unknown error'
            })
          }
        } catch (error) {
          failedCreations.push({
            principal_id: preview.principal_id,
            principal_name: preview.principal_name,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      const batchResult: BatchCreationResult = {
        success: createdOpportunities.length > 0,
        created_opportunities: createdOpportunities,
        failed_creations: failedCreations,
        total_created: createdOpportunities.length,
        total_failed: failedCreations.length
      }

      return { data: batchResult, error: null, success: true }

    } catch (error) {
      console.error('Unexpected error in createBatchOpportunities:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred', 
        success: false 
      }
    }
  }

  /**
   * Generate name previews for batch creation
   */
  async generateNamePreviews(formData: OpportunityFormData): Promise<ApiResponse<OpportunityNamePreview[]>> {
    try {
      // Get organization name for name generation
      const { data: orgData } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', formData.organization_id)
        .single()

      const organizationName = orgData?.name || 'Unknown Organization'

      // Get principal names for name generation  
      const { data: principalData } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', formData.principal_ids)

      const principalDataFormatted = (principalData || []).map((p: any) => ({
        id: p.id,
        name: p.name
      }))

      const previews = await generateBatchNamePreviews({
        organization_name: organizationName,
        principal_data: principalDataFormatted,
        context: formData.context,
        custom_context: formData.name_template || undefined
      })

      return { data: previews, error: null, success: true }

    } catch (error) {
      console.error('Unexpected error in generateNamePreviews:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred', 
        success: false 
      }
    }
  }

  /**
   * Update an existing opportunity
   */
  async updateOpportunity(id: string, updates: OpportunityUpdate): Promise<ApiResponse<Opportunity>> {
    try {
      // Clean the updates data to match database schema
      const cleanedUpdates = {
        ...updates,
        probability_percent: updates.probability_percent ?? undefined
      }

      const { data, error } = await supabase
        .from('opportunities')
        .update(cleanedUpdates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating opportunity:', error)
        return { data: null, error: error.message, success: false }
      }

      return { data: data as Opportunity, error: null, success: true }

    } catch (error) {
      console.error('Unexpected error in updateOpportunity:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred', 
        success: false 
      }
    }
  }

  /**
   * Update opportunity stage with automatic probability adjustment
   */
  async updateOpportunityStage(id: string, newStage: OpportunityStage): Promise<ApiResponse<Opportunity>> {
    try {
      const defaultProbability = STAGE_DEFAULT_PROBABILITY[newStage]
      
      const updates: OpportunityUpdate = {
        stage: newStage,
        probability_percent: defaultProbability
      }

      return await this.updateOpportunity(id, updates)

    } catch (error) {
      console.error('Unexpected error in updateOpportunityStage:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred', 
        success: false 
      }
    }
  }

  /**
   * Delete an opportunity (soft delete)
   */
  async deleteOpportunity(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('opportunities')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        console.error('Error deleting opportunity:', error)
        return { data: false, error: error.message, success: false }
      }

      return { data: true, error: null, success: true }

    } catch (error) {
      console.error('Unexpected error in deleteOpportunity:', error)
      return { 
        data: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred', 
        success: false 
      }
    }
  }

  /**
   * Calculate opportunity KPIs for dashboard
   */
  async getOpportunityKPIs(): Promise<ApiResponse<OpportunityKPIs>> {
    try {
      // Get all active opportunities for calculations
      const { data: opportunities, error } = await supabase
        .from('opportunities')
        .select('*')
        .is('deleted_at', null)

      if (error) {
        console.error('Error fetching opportunities for KPIs:', error)
        return { data: null, error: error.message, success: false }
      }

      const now = new Date()
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      // Calculate basic metrics
      const totalOpportunities = opportunities?.length || 0
      const activeOpportunities = opportunities?.filter((opp: any) => !opp.is_won && opp.stage !== 'Closed - Won').length || 0
      const wonOpportunities = opportunities?.filter((opp: any) => opp.is_won).length || 0
      
      // Calculate average probability
      const probabilitySum = opportunities?.reduce((sum: number, opp: any) => sum + (opp.probability_percent || 0), 0) || 0
      const averageProbability = totalOpportunities > 0 ? probabilitySum / totalOpportunities : 0

      // Calculate won this month
      const wonThisMonth = opportunities?.filter((opp: any) => 
        opp.is_won && opp.updated_at && new Date(opp.updated_at) >= thisMonth
      ).length || 0

      // Calculate conversion rate
      const conversionRate = totalOpportunities > 0 ? (wonOpportunities / totalOpportunities) * 100 : 0

      // Calculate stage distribution
      const stageDistribution = {
        'New Lead': 0,
        'Initial Outreach': 0,
        'Sample/Visit Offered': 0,
        'Awaiting Response': 0,
        'Feedback Logged': 0,
        'Demo Scheduled': 0,
        'Closed - Won': 0
      } as { [K in OpportunityStage]: number }

      opportunities?.forEach((opp: any) => {
        stageDistribution[opp.stage as OpportunityStage]++
      })

      // Calculate recent activity
      const createdThisWeek = opportunities?.filter((opp: any) => 
        opp.created_at && new Date(opp.created_at) >= thisWeek
      ).length || 0

      const updatedThisWeek = opportunities?.filter((opp: any) => 
        opp.updated_at && new Date(opp.updated_at) >= thisWeek
      ).length || 0

      const closedThisWeek = opportunities?.filter((opp: any) => 
        opp.is_won && opp.updated_at && new Date(opp.updated_at) >= thisWeek
      ).length || 0

      const kpis: OpportunityKPIs = {
        total_opportunities: totalOpportunities,
        active_opportunities: activeOpportunities,
        won_opportunities: wonOpportunities,
        average_probability: Math.round(averageProbability),
        total_pipeline_value: 0, // TODO: Calculate when product pricing is available
        won_this_month: wonThisMonth,
        conversion_rate: Math.round(conversionRate),
        average_days_to_close: 0, // TODO: Calculate based on historical data
        win_rate: Math.round(conversionRate), // Same as conversion_rate for now
        stage_distribution: stageDistribution,
        created_this_week: createdThisWeek,
        updated_this_week: updatedThisWeek,
        closed_this_week: closedThisWeek
      }

      return { data: kpis, error: null, success: true }

    } catch (error) {
      console.error('Unexpected error in getOpportunityKPIs:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred', 
        success: false 
      }
    }
  }

  /**
   * Get opportunities grouped by stage for pipeline visualization
   */
  async getOpportunitiesByStage(): Promise<ApiResponse<{ [K in OpportunityStage]: OpportunityListView[] }>> {
    try {
      const result = await this.getOpportunities({ limit: 1000 })
      
      if (!result.success || !result.data) {
        return { data: null, error: result.error, success: false }
      }

      // Group opportunities by stage
      const groupedOpportunities = {
        'New Lead': [],
        'Initial Outreach': [],
        'Sample/Visit Offered': [],
        'Awaiting Response': [],
        'Feedback Logged': [],
        'Demo Scheduled': [],
        'Closed - Won': []
      } as { [K in OpportunityStage]: OpportunityListView[] }

      result.data.forEach(opportunity => {
        groupedOpportunities[opportunity.stage].push(opportunity)
      })

      return { data: groupedOpportunities, error: null, success: true }

    } catch (error) {
      console.error('Unexpected error in getOpportunitiesByStage:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred', 
        success: false 
      }
    }
  }
}

// Export singleton instance
export const opportunitiesApi = new OpportunitiesApiService()
export default opportunitiesApi