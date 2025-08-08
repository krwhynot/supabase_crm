/**
 * Interaction Store - Comprehensive State Management
 * Manages interaction data, KPIs, follow-up tracking, and analytics
 * Follows Pinia Composition API patterns with reactive state management
 * Integrates seamlessly with opportunity system for MVP compliance
 */

import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { interactionsApi } from '@/services/interactionsApi'
import type {
  InteractionListView,
  InteractionDetailView,
  InteractionFormData,
  InteractionKPIs,
  InteractionFilters,
  InteractionPagination,
  InteractionType,
  InteractionStatus,
  InteractionOutcome,
  InteractionUpdate
} from '@/types/interactions'

/**
 * Store state interface for better type safety
 */
interface InteractionStoreState {
  // Data collections
  interactions: InteractionListView[]
  selectedInteraction: InteractionDetailView | null
  opportunityInteractions: { [opportunityId: string]: InteractionListView[] }
  
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
  typeDistribution: { [K in InteractionType]: InteractionListView[] } | null
  statusDistribution: { [K in InteractionStatus]: InteractionListView[] } | null
  
  // Follow-up management
  upcomingFollowUps: InteractionListView[]
  overdueFollowUps: InteractionListView[]
  
  // Timeline and activity tracking
  recentActivity: InteractionListView[]
  monthlyInteractionCounts: { [month: string]: number }
}

export const useInteractionStore = defineStore('interaction', () => {
  // ===============================
  // STATE MANAGEMENT
  // ===============================
  
  const state = reactive<InteractionStoreState>({
    // Data collections
    interactions: [],
    selectedInteraction: null,
    opportunityInteractions: {},
    
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
    typeDistribution: null,
    statusDistribution: null,
    
    // Follow-up management
    upcomingFollowUps: [],
    overdueFollowUps: [],
    
    // Timeline and activity tracking
    recentActivity: [],
    monthlyInteractionCounts: {}
  })

  // Active filters for list view
  const activeFilters = ref<InteractionFilters>({})
  const activePagination = ref<InteractionPagination>({
    page: 1,
    limit: 20,
    sort_by: 'interaction_date',
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
  
  const getInteractionsByType = computed(() => {
    return (type: InteractionType) => 
      state.interactions.filter(interaction => interaction.type === type)
  })
  
  const getInteractionsByStatus = computed(() => {
    return (status: InteractionStatus) => 
      state.interactions.filter(interaction => interaction.status === status)
  })
  
  const getInteractionsByOpportunity = computed(() => {
    return (opportunityId: string) => 
      state.opportunityInteractions[opportunityId] || []
  })
  
  // KPI Calculations
  const totalInteractions = computed(() => {
    return state.kpis?.total_interactions || state.interactions.length
  })
  
  const completedInteractions = computed(() => {
    return state.interactions.filter(i => i.status === 'COMPLETED').length
  })
  
  const positiveOutcomes = computed(() => {
    return state.interactions.filter(i => i.outcome === 'POSITIVE').length
  })
  
  const averageRating = computed(() => {
    const ratedInteractions = state.interactions.filter(i => i.rating !== null)
    if (ratedInteractions.length === 0) return 0
    const total = ratedInteractions.reduce((sum, i) => sum + (i.rating || 0), 0)
    return Math.round((total / ratedInteractions.length) * 10) / 10
  })
  
  const successRate = computed(() => {
    if (completedInteractions.value === 0) return 0
    return Math.round((positiveOutcomes.value / completedInteractions.value) * 100)
  })
  
  const pendingFollowUps = computed(() => {
    return state.upcomingFollowUps.length + state.overdueFollowUps.length
  })

  // ===============================
  // ACTIONS - CRUD OPERATIONS
  // ===============================
  
  /**
   * Fetch interactions with optional filtering and pagination
   */
  const fetchInteractions = async (
    filters: InteractionFilters = {},
    pagination: InteractionPagination = activePagination.value
  ): Promise<void> => {
    state.loading = true
    state.error = null
    
    try {
      const response = await interactionsApi.getInteractionsWithFilters(filters, pagination)
      
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
        console.warn('Interactions API failed, using demo data:', response.error)
        state.interactions = getDemoInteractions()
        state.totalCount = state.interactions.length
        state.currentPage = 1
        state.hasNextPage = false
        state.hasPreviousPage = false
        
        activeFilters.value = filters
        activePagination.value = pagination
      }
    } catch (error) {
      console.warn('Interactions API error, using demo data:', error)
      // Fallback to demo data on any error
      state.interactions = getDemoInteractions()
      state.totalCount = state.interactions.length
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
   * Fetch interactions for a specific opportunity
   */
  const fetchInteractionsByOpportunity = async (opportunityId: string): Promise<void> => {
    state.loading = true
    state.error = null
    
    try {
      const response = await interactionsApi.getInteractionsByOpportunity(opportunityId)
      
      if (response.success && response.data) {
        state.opportunityInteractions[opportunityId] = response.data
      } else {
        state.error = response.error || 'Failed to fetch opportunity interactions'
        state.opportunityInteractions[opportunityId] = []
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
      state.opportunityInteractions[opportunityId] = []
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
      const response = await interactionsApi.getInteractionById(id)
      
      if (response.success && response.data) {
        state.selectedInteraction = response.data as any
      } else {
        state.error = response.error || 'Failed to fetch interaction'
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
    } finally {
      state.loading = false
    }
  }
  
  /**
   * Create a new interaction
   */
  const createInteraction = async (interactionData: InteractionFormData): Promise<boolean> => {
    state.creating = true
    state.error = null
    
    try {
      const response = await interactionsApi.createInteraction(interactionData)
      
      if (response.success && response.data) {
        // Add to local state if we're on the first page
        if (state.currentPage === 1) {
          const newInteraction: InteractionListView = {
            id: response.data.id,
            type: response.data.type,
            subject: response.data.subject,
            interaction_date: response.data.interaction_date,
            opportunity_id: response.data.opportunity_id,
            status: response.data.status || 'SCHEDULED',
            outcome: response.data.outcome,
            duration_minutes: response.data.duration_minutes,
            rating: response.data.rating,
            follow_up_required: response.data.follow_up_required || false,
            notes: response.data.notes || null,
            follow_up_date: response.data.follow_up_date,
            created_at: response.data.created_at,
            updated_at: response.data.updated_at,
            opportunity_name: '',
            organization_name: '',
            days_since_interaction: 0,
            days_until_followup: null
          }
          state.interactions.unshift(newInteraction)
        }
        
        // Update opportunity interactions cache if relevant
        if (interactionData.opportunity_id && state.opportunityInteractions[interactionData.opportunity_id]) {
          await fetchInteractionsByOpportunity(interactionData.opportunity_id)
        }
        
        return true
      } else {
        state.error = response.error || 'Failed to create interaction'
        return false
      }
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
  const updateInteraction = async (id: string, updates: Partial<InteractionUpdate>): Promise<boolean> => {
    state.updating = true
    state.error = null
    
    try {
      const response = await interactionsApi.updateInteraction(id, updates)
      
      if (response.success && response.data) {
        // Update in local state
        const index = state.interactions.findIndex(interaction => interaction.id === id)
        if (index !== -1) {
          state.interactions[index] = {
            ...state.interactions[index],
            type: response.data.type,
            subject: response.data.subject,
            interaction_date: response.data.interaction_date,
            status: response.data.status || 'SCHEDULED',
            outcome: response.data.outcome,
            duration_minutes: response.data.duration_minutes,
            rating: response.data.rating,
            follow_up_required: response.data.follow_up_required || false,
            follow_up_date: response.data.follow_up_date,
            updated_at: response.data.updated_at
          }
        }
        
        // Update selected interaction if it's the same one
        if (state.selectedInteraction?.id === id) {
          await fetchInteractionById(id)
        }
        
        // Update opportunity interactions cache
        const opportunityId = response.data.opportunity_id
        if (opportunityId && state.opportunityInteractions[opportunityId]) {
          await fetchInteractionsByOpportunity(opportunityId)
        }
        
        return true
      } else {
        state.error = response.error || 'Failed to update interaction'
        return false
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
      return false
    } finally {
      state.updating = false
    }
  }
  
  /**
   * Complete an interaction with outcome and rating
   */
  const completeInteraction = async (
    id: string, 
    outcome: InteractionOutcome, 
    rating?: number,
    notes?: string
  ): Promise<boolean> => {
    const updates: Partial<InteractionUpdate> = {
      status: 'COMPLETED',
      outcome,
      rating,
      notes
    }
    
    return await updateInteraction(id, updates)
  }
  
  /**
   * Schedule a follow-up for an interaction
   */
  const scheduleFollowUp = async (
    id: string,
    followUpDate: string,
    followUpNotes?: string
  ): Promise<boolean> => {
    const updates: Partial<InteractionUpdate> = {
      follow_up_required: true,
      follow_up_date: followUpDate,
      follow_up_notes: followUpNotes
    }
    
    return await updateInteraction(id, updates)
  }
  
  /**
   * Delete an interaction (soft delete)
   */
  const deleteInteraction = async (id: string): Promise<boolean> => {
    state.deleting = true
    state.error = null
    
    try {
      const response = await interactionsApi.deleteInteraction(id)
      
      if (response.success) {
        // Remove from local state
        const index = state.interactions.findIndex(interaction => interaction.id === id)
        if (index !== -1) {
          const interaction = state.interactions[index]
          state.interactions.splice(index, 1)
          
          // Update opportunity interactions cache
          if (state.opportunityInteractions[interaction.opportunity_id]) {
            await fetchInteractionsByOpportunity(interaction.opportunity_id)
          }
        }
        
        // Clear selected interaction if it was deleted
        if (state.selectedInteraction?.id === id) {
          state.selectedInteraction = null
        }
        
        return true
      } else {
        state.error = response.error || 'Failed to delete interaction'
        return false
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
      return false
    } finally {
      state.deleting = false
    }
  }

  // ===============================
  // ACTIONS - ANALYTICS & KPIs
  // ===============================
  
  /**
   * Fetch interaction KPIs for dashboard
   */
  const fetchKPIs = async (): Promise<void> => {
    state.loading = true
    state.error = null
    
    try {
      const response = await interactionsApi.getInteractionKPIs()
      
      if (response.success && response.data) {
        state.kpis = response.data
      } else {
        // Fallback to demo KPIs
        console.warn('Interaction KPI API failed, using demo data:', response.error)
        state.kpis = getDemoKPIs()
      }
    } catch (error) {
      console.warn('Interaction KPI API error, using demo data:', error)
      // Fallback to demo KPIs
      state.kpis = getDemoKPIs()
    } finally {
      state.loading = false
    }
  }
  
  /**
   * Fetch upcoming follow-ups for task management
   */
  const fetchUpcomingFollowUps = async (): Promise<void> => {
    state.loading = true
    state.error = null
    
    try {
      const response = await interactionsApi.getUpcomingFollowUps()
      
      if (response.success && response.data) {
        const now = new Date()
        
        // Separate upcoming and overdue follow-ups
        state.upcomingFollowUps = response.data.filter(interaction => 
          interaction.follow_up_date && new Date(interaction.follow_up_date) >= now
        )
        state.overdueFollowUps = response.data.filter(interaction => 
          interaction.follow_up_date && new Date(interaction.follow_up_date) < now
        )
      } else {
        state.error = response.error || 'Failed to fetch follow-ups'
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
    } finally {
      state.loading = false
    }
  }
  
  /**
   * Fetch recent interaction activity
   */
  const fetchRecentActivity = async (limit: number = 10): Promise<void> => {
    state.loading = true
    state.error = null
    
    try {
      const response = await interactionsApi.getRecentInteractions(limit)
      
      if (response.success && response.data) {
        state.recentActivity = response.data
      } else {
        state.error = response.error || 'Failed to fetch recent activity'
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected error occurred'
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
   * Clear opportunity interactions cache
   */
  const clearOpportunityCache = (opportunityId?: string): void => {
    if (opportunityId) {
      delete state.opportunityInteractions[opportunityId]
    } else {
      state.opportunityInteractions = {}
    }
  }
  
  /**
   * Reset filters and pagination to defaults
   */
  const resetFilters = (): void => {
    activeFilters.value = {}
    activePagination.value = {
      page: 1,
      limit: 20,
      sort_by: 'interaction_date',
      sort_order: 'desc'
    }
  }
  
  /**
   * Refresh current data (re-fetch with current filters)
   */
  const refresh = async (): Promise<void> => {
    await fetchInteractions(activeFilters.value, activePagination.value)
  }
  
  /**
   * Refresh all dashboard data
   */
  const refreshDashboard = async (): Promise<void> => {
    await Promise.all([
      fetchKPIs(),
      fetchUpcomingFollowUps(),
      fetchRecentActivity()
    ])
  }

  /**
   * Generate demo KPI data for testing/fallback
   */
  const getDemoKPIs = (): InteractionKPIs => {
    return {
      total_interactions: 42,
      completed_interactions: 38,
      scheduled_interactions: 4,
      positive_outcomes: 28,
      success_rate: 74,
      average_rating: 4.2,
      pending_follow_ups: 6,
      overdue_follow_ups: 2,
      interactions_this_month: 15,
      interactions_last_month: 23,
      average_duration_minutes: 35,
      most_common_type: 'Phone'
    }
  }

  /**
   * Generate demo interactions data for testing/fallback
   */
  const getDemoInteractions = (): InteractionListView[] => {
    return [
      {
        id: 'demo-int-1',
        type: 'Phone',
        subject: 'Product Demo Discussion',
        interaction_date: '2024-08-03T14:00:00Z',
        opportunity_id: 'demo-1',
        status: 'COMPLETED',
        outcome: 'POSITIVE',
        duration_minutes: 45,
        rating: 5,
        follow_up_required: true,
        follow_up_date: '2024-08-10T10:00:00Z',
        notes: 'Very productive call. Client is interested in our enterprise features and wants to schedule a technical demo.',
        created_at: '2024-08-03T14:00:00Z',
        updated_at: '2024-08-03T15:00:00Z',
        opportunity_name: 'Enterprise Integration - TechCorp',
        organization_name: 'TechCorp Solutions',
        days_since_interaction: 0,
        days_until_followup: 7
      },
      {
        id: 'demo-int-2',
        type: 'Email',
        subject: 'Follow-up on Pricing Discussion',
        interaction_date: '2024-08-02T09:30:00Z',
        opportunity_id: 'demo-2',
        status: 'COMPLETED',
        outcome: 'NEUTRAL',
        duration_minutes: null,
        rating: 3,
        follow_up_required: false,
        follow_up_date: null,
        notes: 'Sent detailed pricing breakdown. Client is evaluating budget and will respond by end of week.',
        created_at: '2024-08-02T09:30:00Z',
        updated_at: '2024-08-02T09:35:00Z',
        opportunity_name: 'Cloud Migration - StartupCo',
        organization_name: 'StartupCo Inc',
        days_since_interaction: 1,
        days_until_followup: null
      },
      {
        id: 'demo-int-3',
        type: 'Meeting',
        subject: 'Site Visit and Requirements Review',
        interaction_date: '2024-08-01T13:00:00Z',
        opportunity_id: 'demo-3',
        status: 'COMPLETED',
        outcome: 'POSITIVE',
        duration_minutes: 120,
        rating: 4,
        follow_up_required: true,
        follow_up_date: '2024-08-05T14:00:00Z',
        notes: 'Comprehensive on-site meeting. Toured their facilities and documented all technical requirements. Strong interest in our analytics platform.',
        created_at: '2024-08-01T13:00:00Z',
        updated_at: '2024-08-01T15:30:00Z',
        opportunity_name: 'Data Analytics - RetailGiant',
        organization_name: 'RetailGiant Corp',
        days_since_interaction: 2,
        days_until_followup: 2
      },
      {
        id: 'demo-int-4',
        type: 'Demo',
        subject: 'Technical Demo Scheduled',
        interaction_date: '2024-08-05T11:00:00Z',
        opportunity_id: 'demo-1',
        status: 'SCHEDULED',
        outcome: null,
        duration_minutes: null,
        rating: null,
        follow_up_required: false,
        follow_up_date: null,
        notes: 'Scheduled follow-up technical demo to showcase integration capabilities. Meeting confirmed with their IT team.',
        created_at: '2024-08-03T16:00:00Z',
        updated_at: '2024-08-03T16:00:00Z',
        opportunity_name: 'Enterprise Integration - TechCorp',
        organization_name: 'TechCorp Solutions',
        days_since_interaction: -2,
        days_until_followup: null
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
    getInteractionsByType,
    getInteractionsByStatus,
    getInteractionsByOpportunity,
    totalInteractions,
    completedInteractions,
    positiveOutcomes,
    averageRating,
    successRate,
    pendingFollowUps,
    
    // Actions - CRUD
    fetchInteractions,
    fetchInteractionsByOpportunity,
    fetchInteractionById,
    createInteraction,
    updateInteraction,
    completeInteraction,
    scheduleFollowUp,
    deleteInteraction,
    
    // Actions - Analytics
    fetchKPIs,
    fetchUpcomingFollowUps,
    fetchRecentActivity,
    
    // Actions - Utilities
    clearError,
    clearSelectedInteraction,
    clearOpportunityCache,
    resetFilters,
    refresh,
    refreshDashboard
  }
})