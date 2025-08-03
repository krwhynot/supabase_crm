/**
 * Interaction Store - Comprehensive State Management
 * Manages interaction data, follow-up tracking, KPI calculations, and batch operations
 * Follows Pinia Composition API patterns with reactive state management
 */

import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { supabase } from '@/config/supabaseClient'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type {
  Interaction,
  InteractionListView,
  InteractionDetailView,
  InteractionFormData,
  InteractionKPIs,
  InteractionFilters,
  InteractionPagination,
  InteractionListResponse,
  InteractionType,
  BatchInteractionCreate,
  BatchInteractionResult,
  FollowUpAction
} from '@/types/interactions'
import type { InteractionFormWrapperData, BatchInteractionFormData } from '@/types/interactionForm'
import type { 
  ExtendedInteractionKPIs, 
  ActivityTrends, 
  PrincipalMetrics,
  FollowUpMetrics
} from '@/services/interactionKPIs'

/**
 * Store state interface for better type safety
 */
interface InteractionStoreState {
  // Data collections
  interactions: InteractionListView[]
  selectedInteraction: InteractionDetailView | null
  
  // UI state
  loading: boolean
  creating: boolean
  updating: boolean
  deleting: boolean
  
  // Error handling
  error: string | null
  
  // Pagination and filtering
  currentPage: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  
  // KPIs and analytics
  kpis: InteractionKPIs | null
  extendedKPIs: ExtendedInteractionKPIs | null
  typeDistribution: { [K in InteractionType]: InteractionListView[] } | null
  activityTrends: ActivityTrends | null
  principalMetrics: PrincipalMetrics | null
  followUpMetrics: FollowUpMetrics | null
  
  // Follow-up management
  followUpTracking: {
    overdue: InteractionListView[]
    upcoming: InteractionListView[]
    pending: InteractionListView[]
  } | null
  
  // Batch operations
  batchCreationResult: BatchInteractionResult | null
  
  // Real-time subscriptions
  realtimeChannel: RealtimeChannel | null
  isConnected: boolean
}

export const useInteractionStore = defineStore('interaction', () => {
  // ===============================
  // STATE MANAGEMENT
  // ===============================
  
  const state = reactive<InteractionStoreState>({
    // Data collections
    interactions: [],
    selectedInteraction: null,
    
    // UI state
    loading: false,
    creating: false,
    updating: false,
    deleting: false,
    
    // Error handling
    error: null,
    
    // Pagination and filtering
    currentPage: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false,
    
    // KPIs and analytics
    kpis: null,
    extendedKPIs: null,
    typeDistribution: null,
    activityTrends: null,
    principalMetrics: null,
    followUpMetrics: null,
    
    // Follow-up management
    followUpTracking: null,
    
    // Batch operations
    batchCreationResult: null,
    
    // Real-time subscriptions
    realtimeChannel: null,
    isConnected: false
  })

  // Active filters for list view
  const activeFilters = ref<InteractionFilters>({})
  const activePagination = ref<InteractionPagination>({
    page: 1,
    limit: 20,
    sort_by: 'date',
    sort_order: 'desc'
  })

  // ===============================
  // COMPUTED PROPERTIES
  // ===============================
  
  const isLoading = computed(() => 
    state.loading || state.creating || state.updating || state.deleting
  )
  
  const hasError = computed(() => !!state.error)
  
  const interactionCount = computed(() => state.interactions.length)
  
  const getInteractionById = computed(() => {
    return (id: string) => state.interactions.find(interaction => interaction.id === id)
  })
  
  const getInteractionsByOpportunity = computed(() => {
    return (opportunityId: string) => 
      state.interactions.filter(interaction => interaction.opportunity_id === opportunityId)
  })
  
  const getInteractionsByContact = computed(() => {
    return (contactId: string) => 
      state.interactions.filter(interaction => interaction.contact_id === contactId)
  })
  
  const getInteractionsByType = computed(() => {
    return (type: InteractionType) => 
      state.interactions.filter(interaction => interaction.interaction_type === type)
  })
  
  const getUpcomingFollowUps = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return state.interactions.filter(interaction => {
      if (!interaction.follow_up_needed || !interaction.follow_up_date) return false
      const followUpDate = new Date(interaction.follow_up_date)
      followUpDate.setHours(0, 0, 0, 0)
      return followUpDate >= today
    }).sort((a, b) => {
      if (!a.follow_up_date || !b.follow_up_date) return 0
      return new Date(a.follow_up_date).getTime() - new Date(b.follow_up_date).getTime()
    })
  })
  
  const getOverdueFollowUps = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return state.interactions.filter(interaction => {
      if (!interaction.follow_up_needed || !interaction.follow_up_date) return false
      const followUpDate = new Date(interaction.follow_up_date)
      followUpDate.setHours(0, 0, 0, 0)
      return followUpDate < today
    }).sort((a, b) => {
      if (!a.follow_up_date || !b.follow_up_date) return 0
      return new Date(a.follow_up_date).getTime() - new Date(b.follow_up_date).getTime()
    })
  })
  
  const totalInteractionsThisWeek = computed(() => {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)
    
    return state.interactions.filter(interaction => {
      const interactionDate = new Date(interaction.date)
      return interactionDate >= weekStart
    }).length
  })
  
  const totalInteractionsThisMonth = computed(() => {
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    
    return state.interactions.filter(interaction => {
      const interactionDate = new Date(interaction.date)
      return interactionDate >= monthStart
    }).length
  })

  // ===============================
  // ACTIONS - CRUD OPERATIONS
  // ===============================
  
  /**
   * Fetch interactions with optional filtering and pagination
   * Integrates with real Supabase database with fallback to demo data
   */
  const fetchInteractions = async (
    filters: InteractionFilters = {},
    pagination: InteractionPagination = activePagination.value
  ): Promise<void> => {
    state.loading = true
    state.error = null
    
    try {
      // Try real API first, fallback to demo data
      const response = await fetchInteractionsFromDatabase(filters, pagination)
      
      if (response.success && response.data) {
        state.interactions = response.data.interactions
        state.totalCount = response.data.total_count
        state.currentPage = response.data.page
        state.hasNextPage = response.data.has_next
        state.hasPreviousPage = response.data.has_previous
        
        // Update active filters and pagination
        activeFilters.value = filters
        activePagination.value = pagination
      } else {
        // Fallback to demo data if API fails
        console.warn('API failed, using demo data:', response.error)
        const demoInteractions = getDemoInteractions()
      
      // Apply filters to demo data
      let filteredInteractions = demoInteractions
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredInteractions = filteredInteractions.filter(interaction =>
          interaction.subject.toLowerCase().includes(searchLower) ||
          (interaction.notes && interaction.notes.toLowerCase().includes(searchLower)) ||
          (interaction.contact_name && interaction.contact_name.toLowerCase().includes(searchLower)) ||
          (interaction.opportunity_name && interaction.opportunity_name.toLowerCase().includes(searchLower))
        )
      }
      
      if (filters.interaction_type && filters.interaction_type.length > 0) {
        filteredInteractions = filteredInteractions.filter(interaction =>
          filters.interaction_type!.includes(interaction.interaction_type)
        )
      }
      
      if (filters.opportunity_id) {
        filteredInteractions = filteredInteractions.filter(interaction =>
          interaction.opportunity_id === filters.opportunity_id
        )
      }
      
      if (filters.contact_id) {
        filteredInteractions = filteredInteractions.filter(interaction =>
          interaction.contact_id === filters.contact_id
        )
      }
      
      if (filters.follow_up_needed !== undefined) {
        filteredInteractions = filteredInteractions.filter(interaction =>
          interaction.follow_up_needed === filters.follow_up_needed
        )
      }
      
      if (filters.follow_up_overdue) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        filteredInteractions = filteredInteractions.filter(interaction =>
          interaction.follow_up_needed && 
          interaction.follow_up_date &&
          new Date(interaction.follow_up_date) < today
        )
      }
      
      // Apply pagination
      const startIndex = (pagination.page - 1) * pagination.limit
      const endIndex = startIndex + pagination.limit
      const paginatedInteractions = filteredInteractions.slice(startIndex, endIndex)
      
      // Update state
      state.interactions = paginatedInteractions
      state.totalCount = filteredInteractions.length
      state.currentPage = pagination.page
      state.hasNextPage = endIndex < filteredInteractions.length
      state.hasPreviousPage = pagination.page > 1
      
      // Update active filters and pagination
        activeFilters.value = filters
        activePagination.value = pagination
      }
      
    } catch (error) {
      console.warn('API error, using demo data:', error)
      // Fallback to demo data on any error
      const demoInteractions = getDemoInteractions()
      state.interactions = demoInteractions
      state.totalCount = demoInteractions.length
      state.currentPage = 1
      state.hasNextPage = false
      state.hasPreviousPage = false
      
      activeFilters.value = filters
      activePagination.value = pagination
    } finally {
      state.loading = false
    }
  }
  
  /**
   * Fetch a single interaction by ID
   */
  const fetchInteractionById = async (id: string): Promise<void> => {
    state.loading = true
    state.error = null
    
    try {
      // Try to fetch from database first
      const { data, error } = await supabase
        .from('interactions')
        .select(`
          *,
          opportunities:opportunity_id(name, stage, probability_percent, expected_close_date, deal_owner, context),
          contacts:contact_id(
            name, 
            position, 
            email, 
            phone,
            is_primary,
            organization:organization_id(id, name, type, industry, website, email, phone)
          )
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .single()
      
      if (data && !error) {
        // Convert to detailed view
        state.selectedInteraction = {
          ...convertDatabaseRecordToListView(data),
          // Additional detail fields
          opportunity_probability: data.opportunities?.probability_percent || null,
          opportunity_expected_close: data.opportunities?.expected_close_date || null,
          opportunity_deal_owner: data.opportunities?.deal_owner || null,
          opportunity_context: data.opportunities?.context || null,
          contact_email: data.contacts?.email || null,
          contact_phone: data.contacts?.phone || null,
          contact_is_primary: data.contacts?.is_primary || null,
          organization_id: data.contacts?.organization?.id || null,
          organization_name: data.contacts?.organization?.name || null,
          organization_type: data.contacts?.organization?.type || null,
          organization_industry: data.contacts?.organization?.industry || null,
          organization_website: data.contacts?.organization?.website || null,
          organization_email: data.contacts?.organization?.email || null,
          organization_phone: data.contacts?.organization?.phone || null,
          related_interactions_count: 0, // Would need separate query
          next_scheduled_interaction: null, // Would need separate query
          last_interaction_before_this: null, // Would need separate query
          interaction_sequence_number: 1 // Would need separate query
        }
      } else {
        // Fallback to demo data
        console.warn('Database fetch failed, using demo data:', error?.message)
        const demoInteractions = getDemoInteractions()
        const interaction = demoInteractions.find(i => i.id === id)
        
        if (interaction) {
          // Convert to detailed view (in real implementation, API would return detailed view)
          state.selectedInteraction = {
            ...interaction,
            // Additional detail fields would be populated by API
            opportunity_probability: 75,
            opportunity_expected_close: '2024-09-15',
            opportunity_deal_owner: 'Sarah Johnson',
            opportunity_context: 'Enterprise Integration',
            contact_email: 'mike.chen@techcorp.com',
            contact_phone: '+1-555-0123',
            contact_is_primary: true,
            organization_id: 'org-1',
            organization_name: 'TechCorp Solutions',
            organization_type: 'Technology',
            organization_industry: 'Software',
            organization_website: 'https://techcorp.com',
            organization_email: 'info@techcorp.com',
            organization_phone: '+1-555-0100',
            related_interactions_count: 3,
            next_scheduled_interaction: '2024-08-20',
            last_interaction_before_this: '2024-07-25',
            interaction_sequence_number: 2
          }
        } else {
          state.error = 'Interaction not found'
        }
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
    } finally {
      state.loading = false
    }
  }
  
  /**
   * Create a single interaction
   */
  const createInteraction = async (interactionData: InteractionFormWrapperData): Promise<boolean> => {
    state.creating = true
    state.error = null
    
    try {
      // Convert form data to database format
      const dbData = {
        interaction_type: interactionData.interactionType as InteractionType,
        date: interactionData.date,
        subject: interactionData.subject,
        notes: interactionData.notes || null,
        opportunity_id: interactionData.selectedOpportunity || null,
        contact_id: interactionData.selectedContact || null,
        follow_up_needed: interactionData.followUpNeeded,
        follow_up_date: interactionData.followUpDate || null,
        created_by: 'current-user' // TODO: Get from auth context
      }
      
      // Try real database insert first
      const { data, error } = await supabase
        .from('interactions')
        .insert(dbData)
        .select()
        .single()
      
      if (data && !error) {
        // Real-time subscription will handle adding to state
        console.log('Successfully created interaction:', data.id)
        return true
      } else {
        // Fallback to demo mode
        console.warn('Database insert failed, using demo mode:', error?.message)
        console.log('Creating interaction (demo mode):', dbData)
      
      // Add to local state if we're on the first page
      if (state.currentPage === 1) {
        const newInteraction: InteractionListView = {
          id: `demo-${Date.now()}`,
          interaction_type: dbData.interaction_type,
          date: dbData.date,
          subject: dbData.subject,
          notes: dbData.notes,
          follow_up_needed: dbData.follow_up_needed,
          follow_up_date: dbData.follow_up_date,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'current-user',
          opportunity_id: dbData.opportunity_id,
          opportunity_name: dbData.opportunity_id ? 'Demo Opportunity' : null,
          opportunity_stage: dbData.opportunity_id ? 'DEMO_SCHEDULED' : null,
          opportunity_organization: dbData.opportunity_id ? 'Demo Organization' : null,
          contact_id: dbData.contact_id,
          contact_name: dbData.contact_id ? 'Demo Contact' : null,
          contact_position: dbData.contact_id ? 'Manager' : null,
          contact_organization: dbData.contact_id ? 'Demo Organization' : null,
          days_since_interaction: 0,
          days_to_follow_up: dbData.follow_up_date ? 
            Math.ceil((new Date(dbData.follow_up_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null,
          is_overdue_follow_up: false,
          interaction_priority: 'Medium'
        }
        state.interactions.unshift(newInteraction)
      }
      
      return true
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
      return false
    } finally {
      state.creating = false
    }
  }
  
  /**
   * Create multiple interactions (batch creation)
   */
  const createBatchInteractions = async (formData: BatchInteractionFormData): Promise<boolean> => {
    state.creating = true
    state.error = null
    state.batchCreationResult = null
    
    try {
      // Convert to API format
      const batchData: BatchInteractionCreate = {
        template: {
          interaction_type: formData.interactionType as InteractionType,
          date: formData.date,
          subject: formData.subject,
          notes: formData.notes,
          follow_up_needed: formData.followUpNeeded,
          follow_up_date: formData.followUpDate
        },
        targets: []
      }
      
      // Add targets based on selection
      if (formData.createPerOpportunity) {
        formData.selectedOpportunities.forEach(opportunityId => {
          batchData.targets.push({ opportunity_id: opportunityId })
        })
      }
      
      if (formData.createPerContact) {
        formData.selectedContacts.forEach(contactId => {
          batchData.targets.push({ contact_id: contactId })
        })
      }
      
      console.log('Creating batch interactions (demo mode):', batchData)
      
      // Simulate batch creation result
      const createdInteractions: Interaction[] = batchData.targets.map((target, index) => ({
        id: `demo-batch-${Date.now()}-${index}`,
        interaction_type: batchData.template.interaction_type,
        date: batchData.template.date,
        subject: batchData.template.subject,
        notes: batchData.template.notes,
        opportunity_id: target.opportunity_id || null,
        contact_id: target.contact_id || null,
        created_by: 'current-user',
        follow_up_needed: batchData.template.follow_up_needed,
        follow_up_date: batchData.template.follow_up_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null
      }))
      
      state.batchCreationResult = {
        success: true,
        created_interactions: createdInteractions,
        failed_creations: [],
        total_created: createdInteractions.length,
        total_failed: 0
      }
      
      // Refresh interactions list
      await fetchInteractions(activeFilters.value, activePagination.value)
      
      return true
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
      return false
    } finally {
      state.creating = false
    }
  }
  
  /**
   * Update an existing interaction
   */
  const updateInteraction = async (id: string, updates: Partial<InteractionFormWrapperData>): Promise<boolean> => {
    state.updating = true
    state.error = null
    
    try {
      // Convert form updates to database format
      const dbUpdates: any = {}
      if (updates.interactionType) dbUpdates.interaction_type = updates.interactionType
      if (updates.date) dbUpdates.date = updates.date
      if (updates.subject) dbUpdates.subject = updates.subject
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null
      if (updates.selectedOpportunity !== undefined) dbUpdates.opportunity_id = updates.selectedOpportunity || null
      if (updates.selectedContact !== undefined) dbUpdates.contact_id = updates.selectedContact || null
      if (updates.followUpNeeded !== undefined) dbUpdates.follow_up_needed = updates.followUpNeeded
      if (updates.followUpDate !== undefined) dbUpdates.follow_up_date = updates.followUpDate || null
      
      // Try real database update first
      const { data, error } = await supabase
        .from('interactions')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single()
      
      if (data && !error) {
        // Real-time subscription will handle updating state
        console.log('Successfully updated interaction:', data.id)
        return true
      } else {
        // Fallback to demo mode
        console.warn('Database update failed, using demo mode:', error?.message)
        console.log('Updating interaction (demo mode):', id, updates)
      
      // Update in local state
      const index = state.interactions.findIndex(interaction => interaction.id === id)
      if (index !== -1) {
        const currentInteraction = state.interactions[index]
        state.interactions[index] = {
          ...currentInteraction,
          ...(updates.interactionType && { interaction_type: updates.interactionType as InteractionType }),
          ...(updates.date && { date: updates.date }),
          ...(updates.subject && { subject: updates.subject }),
          ...(updates.notes !== undefined && { notes: updates.notes }),
          ...(updates.selectedOpportunity !== undefined && { opportunity_id: updates.selectedOpportunity }),
          ...(updates.selectedContact !== undefined && { contact_id: updates.selectedContact }),
          ...(updates.followUpNeeded !== undefined && { follow_up_needed: updates.followUpNeeded }),
          ...(updates.followUpDate !== undefined && { follow_up_date: updates.followUpDate }),
          updated_at: new Date().toISOString()
        }
      }
      
      // Update selected interaction if it's the same one
      if (state.selectedInteraction?.id === id) {
        await fetchInteractionById(id)
      }
      
      return true
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
      return false
    } finally {
      state.updating = false
    }
  }
  
  /**
   * Delete an interaction (soft delete)
   */
  const deleteInteraction = async (id: string): Promise<boolean> => {
    state.deleting = true
    state.error = null
    
    try {
      // Try real database soft delete first
      const { error } = await supabase
        .from('interactions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      
      if (!error) {
        // Real-time subscription will handle removing from state
        console.log('Successfully deleted interaction:', id)
        return true
      } else {
        // Fallback to demo mode
        console.warn('Database delete failed, using demo mode:', error.message)
        console.log('Deleting interaction (demo mode):', id)
      
      // Remove from local state
      const index = state.interactions.findIndex(interaction => interaction.id === id)
      if (index !== -1) {
        state.interactions.splice(index, 1)
      }
      
      // Clear selected interaction if it was deleted
      if (state.selectedInteraction?.id === id) {
        state.selectedInteraction = null
      }
      
      return true
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
      return false
    } finally {
      state.deleting = false
    }
  }
  
  /**
   * Process follow-up action (complete, reschedule, cancel)
   */
  const processFollowUpAction = async (action: FollowUpAction): Promise<boolean> => {
    state.updating = true
    state.error = null
    
    try {
      console.log('Processing follow-up action (demo mode):', action)
      
      const index = state.interactions.findIndex(interaction => interaction.id === action.interaction_id)
      if (index !== -1) {
        const interaction = state.interactions[index]
        
        switch (action.action) {
          case 'complete':
            state.interactions[index] = {
              ...interaction,
              follow_up_needed: false,
              follow_up_date: null,
              updated_at: new Date().toISOString()
            }
            
            // Create new interaction if specified
            if (action.new_interaction) {
              await createInteraction({
                interactionType: action.new_interaction.interaction_type,
                date: action.new_interaction.date,
                subject: action.new_interaction.subject,
                notes: action.new_interaction.notes,
                selectedOpportunity: interaction.opportunity_id,
                selectedContact: interaction.contact_id,
                followUpNeeded: action.new_interaction.follow_up_needed,
                followUpDate: action.new_interaction.follow_up_date
              })
            }
            break
            
          case 'reschedule':
            state.interactions[index] = {
              ...interaction,
              follow_up_date: action.new_date || null,
              updated_at: new Date().toISOString()
            }
            break
            
          case 'cancel':
            state.interactions[index] = {
              ...interaction,
              follow_up_needed: false,
              follow_up_date: null,
              updated_at: new Date().toISOString()
            }
            break
        }
      }
      
      return true
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
      return false
    } finally {
      state.updating = false
    }
  }

  // ===============================
  // ACTIONS - ANALYTICS & KPIs
  // ===============================
  
  /**
   * Fetch interaction KPIs for dashboard using comprehensive KPI service
   */
  const fetchKPIs = async (filters: InteractionFilters = {}): Promise<void> => {
    state.loading = true
    state.error = null
    
    try {
      // Use the comprehensive KPI calculation service
      const { calculateInteractionKPIs } = await import('@/services/interactionKPIs')
      const kpis = await calculateInteractionKPIs(filters)
      
      // Convert extended KPIs to basic KPIs interface for store compatibility
      state.kpis = {
        total_interactions: kpis.total_interactions,
        interactions_this_week: kpis.interactions_this_week,
        interactions_this_month: kpis.interactions_this_month,
        overdue_follow_ups: kpis.overdue_follow_ups,
        scheduled_follow_ups: kpis.scheduled_follow_ups,
        avg_interactions_per_week: kpis.avg_interactions_per_week,
        type_distribution: kpis.type_distribution,
        follow_up_completion_rate: kpis.follow_up_completion_rate,
        avg_days_to_follow_up: kpis.avg_days_to_follow_up,
        interactions_with_opportunities: kpis.interactions_with_opportunities,
        interactions_with_contacts: kpis.interactions_with_contacts,
        unique_contacts_contacted: kpis.unique_contacts_contacted,
        unique_opportunities_touched: kpis.unique_opportunities_touched,
        created_this_week: kpis.created_this_week,
        follow_ups_completed_this_week: kpis.follow_ups_completed_this_week,
        follow_ups_scheduled_this_week: kpis.follow_ups_scheduled_this_week
      }
    } catch (error) {
      console.warn('KPI calculation error, using demo data:', error)
      state.kpis = calculateDemoKPIs()
      state.error = error instanceof Error ? error.message : 'KPI calculation failed'
    } finally {
      state.loading = false
    }
  }
  
  /**
   * Fetch interactions grouped by type for analytics
   */
  const fetchTypeDistribution = async (): Promise<void> => {
    state.loading = true
    state.error = null
    
    try {
      const interactions = getDemoInteractions()
      const distribution: { [K in InteractionType]: InteractionListView[] } = {
        EMAIL: interactions.filter(i => i.interaction_type === 'EMAIL'),
        CALL: interactions.filter(i => i.interaction_type === 'CALL'),
        IN_PERSON: interactions.filter(i => i.interaction_type === 'IN_PERSON'),
        DEMO: interactions.filter(i => i.interaction_type === 'DEMO'),
        FOLLOW_UP: interactions.filter(i => i.interaction_type === 'FOLLOW_UP')
      }
      
      state.typeDistribution = distribution
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
    } finally {
      state.loading = false
    }
  }
  
  /**
   * Fetch follow-up tracking data using comprehensive KPI service
   */
  const fetchFollowUpTracking = async (filters: InteractionFilters = {}): Promise<void> => {
    state.loading = true
    state.error = null
    
    try {
      const { calculateFollowUpMetrics } = await import('@/services/interactionKPIs')
      const followUpMetrics = await calculateFollowUpMetrics(filters)
      
      // Store the follow-up metrics
      state.followUpMetrics = followUpMetrics
      
      // Convert to store format and get actual interaction data
      const interactions = await fetchInteractionData(filters)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const nextWeek = new Date(today)
      nextWeek.setDate(today.getDate() + 7)
      
      state.followUpTracking = {
        overdue: interactions.filter(i => i.is_overdue_follow_up),
        pending: interactions.filter(i => {
          if (!i.follow_up_needed || !i.follow_up_date) return false
          const followUpDate = new Date(i.follow_up_date)
          followUpDate.setHours(0, 0, 0, 0)
          return followUpDate >= today
        }),
        upcoming: interactions.filter(i => {
          if (!i.follow_up_needed || !i.follow_up_date) return false
          const followUpDate = new Date(i.follow_up_date)
          followUpDate.setHours(0, 0, 0, 0)
          return followUpDate >= today && followUpDate <= nextWeek
        })
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
      
      // Fallback to demo data
      const interactions = getDemoInteractions()
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const nextWeek = new Date(today)
      nextWeek.setDate(today.getDate() + 7)
      
      state.followUpTracking = {
        overdue: interactions.filter(i => {
          if (!i.follow_up_needed || !i.follow_up_date) return false
          const followUpDate = new Date(i.follow_up_date)
          followUpDate.setHours(0, 0, 0, 0)
          return followUpDate < today
        }),
        pending: interactions.filter(i => {
          if (!i.follow_up_needed || !i.follow_up_date) return false
          const followUpDate = new Date(i.follow_up_date)
          followUpDate.setHours(0, 0, 0, 0)
          return followUpDate >= today
        }),
        upcoming: interactions.filter(i => {
          if (!i.follow_up_needed || !i.follow_up_date) return false
          const followUpDate = new Date(i.follow_up_date)
          followUpDate.setHours(0, 0, 0, 0)
          return followUpDate >= today && followUpDate <= nextWeek
        })
      }
    } finally {
      state.loading = false
    }
  }

  /**
   * Fetch enhanced KPIs with advanced metrics
   */
  const fetchExtendedKPIs = async (filters: InteractionFilters = {}): Promise<void> => {
    state.loading = true
    state.error = null
    
    try {
      const { calculateInteractionKPIs } = await import('@/services/interactionKPIs')
      const extendedKPIs = await calculateInteractionKPIs(filters)
      
      // Store extended KPIs in a separate state property for advanced dashboard components
      // This allows components to access both basic and extended metrics
      state.extendedKPIs = extendedKPIs
      
      // Also update basic KPIs for backward compatibility
      state.kpis = {
        total_interactions: extendedKPIs.total_interactions,
        interactions_this_week: extendedKPIs.interactions_this_week,
        interactions_this_month: extendedKPIs.interactions_this_month,
        overdue_follow_ups: extendedKPIs.overdue_follow_ups,
        scheduled_follow_ups: extendedKPIs.scheduled_follow_ups,
        avg_interactions_per_week: extendedKPIs.avg_interactions_per_week,
        type_distribution: extendedKPIs.type_distribution,
        follow_up_completion_rate: extendedKPIs.follow_up_completion_rate,
        avg_days_to_follow_up: extendedKPIs.avg_days_to_follow_up,
        interactions_with_opportunities: extendedKPIs.interactions_with_opportunities,
        interactions_with_contacts: extendedKPIs.interactions_with_contacts,
        unique_contacts_contacted: extendedKPIs.unique_contacts_contacted,
        unique_opportunities_touched: extendedKPIs.unique_opportunities_touched,
        created_this_week: extendedKPIs.created_this_week,
        follow_ups_completed_this_week: extendedKPIs.follow_ups_completed_this_week,
        follow_ups_scheduled_this_week: extendedKPIs.follow_ups_scheduled_this_week
      }
    } catch (error) {
      console.warn('Extended KPI calculation error, using demo data:', error)
      state.error = error instanceof Error ? error.message : 'Extended KPI calculation failed'
      // Fallback to basic KPIs
      await fetchKPIs(filters)
    } finally {
      state.loading = false
    }
  }

  /**
   * Fetch activity trends for period analysis
   */
  const fetchActivityTrends = async (period: 'week' | 'month' | 'quarter' = 'month'): Promise<void> => {
    state.loading = true
    state.error = null
    
    try {
      const { calculateActivityTrends } = await import('@/services/interactionKPIs')
      const trends = await calculateActivityTrends(period)
      
      // Store activity trends for dashboard components
      state.activityTrends = trends
    } catch (error) {
      console.warn('Activity trends calculation error:', error)
      state.error = error instanceof Error ? error.message : 'Activity trends calculation failed'
    } finally {
      state.loading = false
    }
  }

  /**
   * Fetch principal performance metrics
   */
  const fetchPrincipalMetrics = async (principalId?: string): Promise<void> => {
    state.loading = true
    state.error = null
    
    try {
      const { calculatePrincipalPerformance } = await import('@/services/interactionKPIs')
      const metrics = await calculatePrincipalPerformance(principalId)
      
      // Store principal metrics
      state.principalMetrics = metrics
    } catch (error) {
      console.warn('Principal metrics calculation error:', error)
      state.error = error instanceof Error ? error.message : 'Principal metrics calculation failed'
    } finally {
      state.loading = false
    }
  }

  // ===============================
  // ACTIONS - UTILITY FUNCTIONS
  // ===============================
  
  /**
   * Clear all error states
   */
  const clearError = (): void => {
    state.error = null
  }
  
  /**
   * Clear selected interaction
   */
  const clearSelectedInteraction = (): void => {
    state.selectedInteraction = null
  }
  
  /**
   * Clear batch creation results
   */
  const clearBatchResults = (): void => {
    state.batchCreationResult = null
  }
  
  /**
   * Reset filters and pagination to defaults
   */
  const resetFilters = (): void => {
    activeFilters.value = {}
    activePagination.value = {
      page: 1,
      limit: 20,
      sort_by: 'date',
      sort_order: 'desc'
    }
  }
  
  /**
   * Refresh current data (re-fetch with current filters)
   */
  const refresh = async (): Promise<void> => {
    await fetchInteractions(activeFilters.value, activePagination.value)
  }
  
  // ===============================
  // REAL-TIME SUBSCRIPTION ACTIONS
  // ===============================
  
  /**
   * Subscribe to real-time updates for interactions
   */
  const subscribeToChanges = async (): Promise<void> => {
    try {
      // Unsubscribe from existing channel if any
      if (state.realtimeChannel) {
        await supabase.removeChannel(state.realtimeChannel)
      }
      
      // Create new channel for interactions table
      const channel = supabase
        .channel('interactions-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'interactions'
          },
          (payload) => {
            console.log('Real-time interaction change:', payload)
            handleRealtimeChange(payload)
          }
        )
        .subscribe((status) => {
          console.log('Interaction subscription status:', status)
          state.isConnected = status === 'SUBSCRIBED'
        })
      
      state.realtimeChannel = channel
    } catch (error) {
      console.error('Failed to subscribe to interaction changes:', error)
      state.isConnected = false
    }
  }
  
  /**
   * Unsubscribe from real-time updates
   */
  const unsubscribeFromChanges = async (): Promise<void> => {
    try {
      if (state.realtimeChannel) {
        await supabase.removeChannel(state.realtimeChannel)
        state.realtimeChannel = null
        state.isConnected = false
      }
    } catch (error) {
      console.error('Failed to unsubscribe from interaction changes:', error)
    }
  }
  
  /**
   * Handle real-time database changes
   */
  const handleRealtimeChange = (payload: any): void => {
    const { eventType, new: newRecord, old: oldRecord } = payload
    
    switch (eventType) {
      case 'INSERT':
        if (newRecord && state.currentPage === 1) {
          // Convert database record to InteractionListView format
          const newInteraction = convertDatabaseRecordToListView(newRecord)
          state.interactions.unshift(newInteraction)
        }
        break
        
      case 'UPDATE':
        if (newRecord) {
          const index = state.interactions.findIndex(interaction => interaction.id === newRecord.id)
          if (index !== -1) {
            const updatedInteraction = convertDatabaseRecordToListView(newRecord)
            state.interactions[index] = updatedInteraction
          }
          
          // Update selected interaction if it's the same one
          if (state.selectedInteraction?.id === newRecord.id) {
            fetchInteractionById(newRecord.id)
          }
        }
        break
        
      case 'DELETE':
        if (oldRecord) {
          const index = state.interactions.findIndex(interaction => interaction.id === oldRecord.id)
          if (index !== -1) {
            state.interactions.splice(index, 1)
          }
          
          // Clear selected interaction if it was deleted
          if (state.selectedInteraction?.id === oldRecord.id) {
            state.selectedInteraction = null
          }
        }
        break
    }
  }

  // ===============================
  // DATABASE INTEGRATION FUNCTIONS
  // ===============================
  
  /**
   * Fetch interactions from Supabase database with filtering and pagination
   */
  const fetchInteractionsFromDatabase = async (
    filters: InteractionFilters,
    pagination: InteractionPagination
  ): Promise<{ success: boolean, data: InteractionListResponse | null, error: string | null }> => {
    try {
      let query = supabase
        .from('interactions')
        .select(`
          *,
          opportunities:opportunity_id(name, stage, organization_id),
          contacts:contact_id(
            name, 
            position, 
            email, 
            phone,
            is_primary,
            organization:organization_id(name, type)
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

      if (filters.follow_up_needed !== undefined) {
        query = query.eq('follow_up_needed', filters.follow_up_needed)
      }

      if (filters.follow_up_overdue) {
        const today = new Date().toISOString().split('T')[0]
        query = query
          .eq('follow_up_needed', true)
          .lt('follow_up_date', today)
      }

      if (filters.date_from) {
        query = query.gte('date', filters.date_from)
      }

      if (filters.date_to) {
        query = query.lte('date', filters.date_to)
      }

      // Apply sorting
      query = query.order(pagination.sort_by, { ascending: pagination.sort_order === 'asc' })

      // Apply pagination
      const from = (pagination.page - 1) * pagination.limit
      const to = from + pagination.limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        console.error('Database error:', error)
        return { success: false, data: null, error: error.message }
      }

      // Transform data to InteractionListView format
      const transformedData: InteractionListView[] = data?.map(interaction => 
        convertDatabaseRecordToListView(interaction)
      ) || []

      // Get total count for pagination
      const totalCount = count || 0

      const response: InteractionListResponse = {
        interactions: transformedData,
        total_count: totalCount,
        page: pagination.page,
        limit: pagination.limit,
        has_next: (pagination.page * pagination.limit) < totalCount,
        has_previous: pagination.page > 1
      }

      return { success: true, data: response, error: null }

    } catch (error) {
      console.error('Database integration error:', error)
      return { 
        success: false, 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown database error' 
      }
    }
  }

  /**
   * Convert database record to InteractionListView format
   */
  const convertDatabaseRecordToListView = (record: any): InteractionListView => {
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
      interaction_priority: calculateInteractionPriority(record)
    }
  }

  /**
   * Calculate interaction priority based on type and context
   */
  const calculateInteractionPriority = (interaction: any): 'High' | 'Medium' | 'Low' => {
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

  // ===============================
  // DEMO DATA FUNCTIONS
  // ===============================
  
  /**
   * Generate demo KPI data for testing/fallback
   */
  const calculateDemoKPIs = (): InteractionKPIs => {
    const interactions = getDemoInteractions()
    
    const thisWeek = interactions.filter(i => {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      weekStart.setHours(0, 0, 0, 0)
      return new Date(i.date) >= weekStart
    })
    
    const thisMonth = interactions.filter(i => {
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)
      return new Date(i.date) >= monthStart
    })
    
    const followUpsNeeded = interactions.filter(i => i.follow_up_needed)
    const overdue = getOverdueFollowUps.value
    
    return {
      total_interactions: interactions.length,
      interactions_this_week: thisWeek.length,
      interactions_this_month: thisMonth.length,
      overdue_follow_ups: overdue.length,
      scheduled_follow_ups: followUpsNeeded.length - overdue.length,
      avg_interactions_per_week: Math.round(interactions.length / 4), // Assuming 4 weeks of data
      
      type_distribution: {
        EMAIL: interactions.filter(i => i.interaction_type === 'EMAIL').length,
        CALL: interactions.filter(i => i.interaction_type === 'CALL').length,
        IN_PERSON: interactions.filter(i => i.interaction_type === 'IN_PERSON').length,
        DEMO: interactions.filter(i => i.interaction_type === 'DEMO').length,
        FOLLOW_UP: interactions.filter(i => i.interaction_type === 'FOLLOW_UP').length
      },
      
      follow_up_completion_rate: 85,
      avg_days_to_follow_up: 5,
      
      interactions_with_opportunities: interactions.filter(i => i.opportunity_id).length,
      interactions_with_contacts: interactions.filter(i => i.contact_id).length,
      unique_contacts_contacted: new Set(interactions.filter(i => i.contact_id).map(i => i.contact_id)).size,
      unique_opportunities_touched: new Set(interactions.filter(i => i.opportunity_id).map(i => i.opportunity_id)).size,
      
      created_this_week: thisWeek.length,
      follow_ups_completed_this_week: 3,
      follow_ups_scheduled_this_week: 5
    }
  }

  /**
   * Generate demo interactions data for testing/fallback
   */
  const getDemoInteractions = (): InteractionListView[] => {
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
      },
      {
        id: 'demo-int-4',
        interaction_type: 'IN_PERSON',
        date: '2024-08-05',
        subject: 'Site visit and security assessment',
        notes: 'Conducted on-site security assessment. Identified key integration points for our platform.',
        follow_up_needed: true,
        follow_up_date: '2024-08-12',
        created_at: '2024-08-05T09:15:00Z',
        updated_at: '2024-08-05T09:15:00Z',
        created_by: 'james.wilson@company.com',
        opportunity_id: 'demo-opp-4',
        opportunity_name: 'Security Upgrade - FinanceSecure',
        opportunity_stage: 'SAMPLE_VISIT_OFFERED',
        opportunity_organization: 'Finance Secure Ltd',
        contact_id: 'demo-contact-4',
        contact_name: 'Rachel Green',
        contact_position: 'CISO',
        contact_organization: 'Finance Secure Ltd',
        days_since_interaction: 11,
        days_to_follow_up: -4,
        is_overdue_follow_up: true,
        interaction_priority: 'High'
      },
      {
        id: 'demo-int-5',
        interaction_type: 'FOLLOW_UP',
        date: '2024-08-10',
        subject: 'Check-in: Implementation timeline',
        notes: 'Discussed project timeline and resource allocation. All systems go for Q4 implementation.',
        follow_up_needed: false,
        follow_up_date: null,
        created_at: '2024-08-10T13:20:00Z',
        updated_at: '2024-08-10T13:20:00Z',
        created_by: 'sarah.johnson@company.com',
        opportunity_id: null,
        opportunity_name: null,
        opportunity_stage: null,
        opportunity_organization: null,
        contact_id: 'demo-contact-5',
        contact_name: 'Tom Brown',
        contact_position: 'Project Manager',
        contact_organization: 'Implementation Partners',
        days_since_interaction: 6,
        days_to_follow_up: null,
        is_overdue_follow_up: false,
        interaction_priority: 'Low'
      },
      {
        id: 'demo-int-6',
        interaction_type: 'EMAIL',
        date: '2024-08-14',
        subject: 'Product inquiry: Integration capabilities',
        notes: 'Responded to inquiry about API integration capabilities. Sent technical documentation.',
        follow_up_needed: true,
        follow_up_date: '2024-08-21',
        created_at: '2024-08-14T11:10:00Z',
        updated_at: '2024-08-14T11:10:00Z',
        created_by: 'alex.rodriguez@company.com',
        opportunity_id: null,
        opportunity_name: null,
        opportunity_stage: null,
        opportunity_organization: null,
        contact_id: 'demo-contact-6',
        contact_name: 'Jennifer Lopez',
        contact_position: 'Technical Lead',
        contact_organization: 'Innovation Labs',
        days_since_interaction: 2,
        days_to_follow_up: 5,
        is_overdue_follow_up: false,
        interaction_priority: 'Medium'
      }
    ]
  }

  // ===============================
  // RETURN STORE INTERFACE
  // ===============================
  
  return {
    // State
    ...state,
    activeFilters,
    activePagination,
    
    // Computed
    isLoading,
    hasError,
    interactionCount,
    getInteractionById,
    getInteractionsByOpportunity,
    getInteractionsByContact,
    getInteractionsByType,
    getUpcomingFollowUps,
    getOverdueFollowUps,
    overdueFollowUps: getOverdueFollowUps,
    totalInteractionsThisWeek,
    totalInteractionsThisMonth,
    
    // Actions - CRUD
    fetchInteractions,
    fetchInteractionById,
    createInteraction,
    createBatchInteractions,
    updateInteraction,
    deleteInteraction,
    processFollowUpAction,
    
    // Actions - Analytics
    fetchKPIs,
    fetchExtendedKPIs,
    fetchTypeDistribution,
    fetchFollowUpTracking,
    fetchActivityTrends,
    fetchPrincipalMetrics,
    
    // Actions - Utilities
    clearError,
    clearSelectedInteraction,
    clearBatchResults,
    resetFilters,
    refresh,
    
    // Actions - Real-time
    subscribeToChanges,
    unsubscribeFromChanges
  }
})