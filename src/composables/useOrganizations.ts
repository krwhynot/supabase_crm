/**
 * Organizations composable for CRUD operations
 * Follows established patterns from existing composables
 * Provides comprehensive organization management functionality
 */

import { ref, computed, reactive } from 'vue'
import type { Ref } from 'vue'
import { supabase } from '@/config/supabaseClient'
import type {
  Organization,
  OrganizationSummaryAnalytics,
  MonthlyOrganizationPerformance,
  OrganizationLeadScoring
} from '@/types/database.types'
import type {
  OrganizationListItem,
  OrganizationDetailData,
  OrganizationListResponse,
  OrganizationFilters,
  OrganizationSortConfig,
  PaginationConfig,
  OrganizationCreateForm,
  OrganizationUpdateForm
} from '@/types/organizations'
import { OrganizationValidator, organizationUtils } from '@/types/organization-validation'

/**
 * Organization loading states
 */
interface OrganizationLoadingStates {
  list: boolean
  detail: boolean
  create: boolean
  update: boolean
  delete: boolean
  analytics: boolean
}

/**
 * Organization error states
 */
interface OrganizationErrors {
  list: string | null
  detail: string | null
  create: string | null
  update: string | null
  delete: string | null
  analytics: string | null
}

/**
 * Main organizations composable
 */
export function useOrganizations() {
  // State management
  const organizations = ref<OrganizationListItem[]>([])
  const currentOrganization = ref<OrganizationDetailData | null>(null)
  const analytics = ref<OrganizationSummaryAnalytics[]>([])
  const performance = ref<MonthlyOrganizationPerformance[]>([])
  const leadScoring = ref<OrganizationLeadScoring[]>([])

  // Loading states
  const loading = reactive<OrganizationLoadingStates>({
    list: false,
    detail: false,
    create: false,
    update: false,
    delete: false,
    analytics: false
  })

  // Error states
  const errors = reactive<OrganizationErrors>({
    list: null,
    detail: null,
    create: null,
    update: null,
    delete: null,
    analytics: null
  })

  // Pagination and filtering
  const pagination = ref<PaginationConfig>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false
  })

  const filters = ref<OrganizationFilters>({})
  const sortConfig = ref<OrganizationSortConfig>({
    field: 'name',
    order: 'asc'
  })

  // Computed properties
  const hasOrganizations = computed(() => organizations.value.length > 0)
  const isLoading = computed(() => Object.values(loading).some(state => state))
  const hasErrors = computed(() => Object.values(errors).some(error => error !== null))

  /**
   * Clear all errors
   */
  const clearErrors = () => {
    Object.keys(errors).forEach(key => {
      errors[key as keyof OrganizationErrors] = null
    })
  }

  /**
   * Clear specific error
   */
  const clearError = (type: keyof OrganizationErrors) => {
    errors[type] = null
  }

  /**
   * Fetch organizations list with pagination, filtering, and sorting
   */
  const fetchOrganizations = async (options: {
    page?: number
    limit?: number
    filters?: Partial<OrganizationFilters>
    sort?: Partial<OrganizationSortConfig>
    resetList?: boolean
  } = {}): Promise<OrganizationListResponse | null> => {
    loading.list = true
    clearError('list')

    try {
      // Update local state
      if (options.page) pagination.value.page = options.page
      if (options.limit) pagination.value.limit = options.limit
      if (options.filters) filters.value = { ...filters.value, ...options.filters }
      if (options.sort) sortConfig.value = { ...sortConfig.value, ...options.sort }

      // Build query
      let query = supabase
        .from('organization_summary_analytics')
        .select('*', { count: 'exact' })

      // Apply filters
      if (filters.value.search) {
        query = query.or(`name.ilike.%${filters.value.search}%,legal_name.ilike.%${filters.value.search}%,industry.ilike.%${filters.value.search}%`)
      }

      if (filters.value.industry && filters.value.industry.length > 0) {
        query = query.in('industry', filters.value.industry)
      }

      if (filters.value.status && filters.value.status.length > 0) {
        query = query.in('status', filters.value.status)
      }

      if (filters.value.leadScoreRange) {
        if (filters.value.leadScoreRange.min !== undefined) {
          query = query.gte('lead_score', filters.value.leadScoreRange.min)
        }
        if (filters.value.leadScoreRange.max !== undefined) {
          query = query.lte('lead_score', filters.value.leadScoreRange.max)
        }
      }

      // Apply sorting
      const sortOrder = sortConfig.value.order === 'desc' ? false : true
      query = query.order(sortConfig.value.field, { ascending: sortOrder })

      // Apply pagination
      const offset = (pagination.value.page - 1) * pagination.value.limit
      query = query.range(offset, offset + pagination.value.limit - 1)

      const { data, error, count } = await query

      if (error) {
        throw new Error(error.message)
      }

      // Update pagination
      pagination.value.total = count || 0
      pagination.value.totalPages = Math.ceil(pagination.value.total / pagination.value.limit)
      pagination.value.hasNext = pagination.value.page < pagination.value.totalPages
      pagination.value.hasPrevious = pagination.value.page > 1

      // Transform data to OrganizationListItem format
      const transformedData: OrganizationListItem[] = (data || []).map(item => ({
        id: item.id || '',
        name: item.name || '',
        legal_name: null,
        industry: item.industry,
        type: null,
        size: null,
        status: item.status,
        website: null,
        email: null,
        primary_phone: null,
        city: null,
        country: null,
        employees_count: null,
        annual_revenue: null,
        lead_score: item.lead_score,
        contact_count: item.contact_count ?? undefined,
        last_interaction_date: item.last_interaction_date,
        next_follow_up_date: item.next_follow_up_date,
        created_at: null,
        updated_at: null
      }))

      if (options.resetList) {
        organizations.value = transformedData
      } else {
        organizations.value = [...organizations.value, ...transformedData]
      }

      const response: OrganizationListResponse = {
        data: transformedData,
        pagination: { ...pagination.value },
        filters: { ...filters.value },
        sort: { ...sortConfig.value }
      }

      return response

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch organizations'
      errors.list = message
      console.error('Error fetching organizations:', error)
      return null
    } finally {
      loading.list = false
    }
  }

  /**
   * Fetch organization details by ID
   */
  const fetchOrganizationById = async (id: string): Promise<OrganizationDetailData | null> => {
    loading.detail = true
    clearError('detail')

    try {
      // Fetch main organization data
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()

      if (orgError) {
        throw new Error(orgError.message)
      }

      // Fetch related data in parallel
      const [contactsResult, interactionsResult, documentsResult] = await Promise.all([
        supabase
          .from('contacts')
          .select('id, first_name, last_name, email')
          .eq('organization_id', id),
        
        supabase
          .from('organization_interactions')
          .select('id, type, subject, interaction_date, contact_id')
          .eq('organization_id', id)
          .order('interaction_date', { ascending: false })
          .limit(10),
        
        supabase
          .from('organization_documents')
          .select('id, name, category')
          .eq('organization_id', id)
      ])

      // Transform to OrganizationDetailData
      const detailData: OrganizationDetailData = {
        ...orgData,
        contact_count: contactsResult.data?.length || 0,
        interaction_count: interactionsResult.data?.length || 0,
        document_count: documentsResult.data?.length || 0,
        recent_interactions: (interactionsResult.data || []).map(interaction => ({
          id: interaction.id,
          type: interaction.type,
          subject: interaction.subject,
          interaction_date: interaction.interaction_date,
          contact_name: contactsResult.data?.find(c => c.id === interaction.contact_id)
            ? `${contactsResult.data.find(c => c.id === interaction.contact_id)?.first_name} ${contactsResult.data.find(c => c.id === interaction.contact_id)?.last_name}`
            : undefined
        }))
      }

      currentOrganization.value = detailData
      return detailData

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch organization details'
      errors.detail = message
      console.error('Error fetching organization details:', error)
      return null
    } finally {
      loading.detail = false
    }
  }

  /**
   * Create new organization
   */
  const createOrganization = async (formData: OrganizationCreateForm): Promise<Organization | null> => {
    loading.create = true
    clearError('create')

    try {
      // Validate form data
      const validation = await OrganizationValidator.validateCreate(formData)
      if (!validation.isValid) {
        throw new Error(validation.errors.map(e => e.message).join(', '))
      }

      // Convert form data to insert format
      const insertData = OrganizationValidator.formToInsert(validation.data!)

      const { data, error } = await supabase
        .from('organizations')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      // Refresh organizations list
      await fetchOrganizations({ resetList: true })

      return data

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create organization'
      errors.create = message
      console.error('Error creating organization:', error)
      return null
    } finally {
      loading.create = false
    }
  }

  /**
   * Update existing organization
   */
  const updateOrganization = async (id: string, formData: OrganizationUpdateForm): Promise<Organization | null> => {
    loading.update = true
    clearError('update')

    try {
      // Validate form data
      const validation = await OrganizationValidator.validateUpdate(formData)
      if (!validation.isValid) {
        throw new Error(validation.errors.map(e => e.message).join(', '))
      }

      // Convert form data to update format
      const updateData = OrganizationValidator.formToUpdate(validation.data!)

      const { data, error } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      // Update current organization if it's the one being updated
      if (currentOrganization.value?.id === id) {
        await fetchOrganizationById(id)
      }

      // Refresh organizations list
      await fetchOrganizations({ resetList: true })

      return data

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update organization'
      errors.update = message
      console.error('Error updating organization:', error)
      return null
    } finally {
      loading.update = false
    }
  }

  /**
   * Delete organization
   */
  const deleteOrganization = async (id: string): Promise<boolean> => {
    loading.delete = true
    clearError('delete')

    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }

      // Remove from local state
      organizations.value = organizations.value.filter(org => org.id !== id)
      
      // Clear current organization if it was deleted
      if (currentOrganization.value?.id === id) {
        currentOrganization.value = null
      }

      return true

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete organization'
      errors.delete = message
      console.error('Error deleting organization:', error)
      return false
    } finally {
      loading.delete = false
    }
  }

  /**
   * Search organizations
   */
  const searchOrganizations = async (searchTerm: string): Promise<OrganizationListItem[]> => {
    const response = await fetchOrganizations({
      page: 1,
      filters: { search: searchTerm },
      resetList: true
    })
    
    return response?.data || []
  }

  /**
   * Reset to initial state
   */
  const reset = () => {
    organizations.value = []
    currentOrganization.value = null
    analytics.value = []
    performance.value = []
    leadScoring.value = []
    
    pagination.value = {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false
    }
    
    filters.value = {}
    sortConfig.value = {
      field: 'name',
      order: 'asc'
    }
    
    Object.keys(loading).forEach(key => {
      loading[key as keyof OrganizationLoadingStates] = false
    })
    
    clearErrors()
  }

  /**
   * Get organization by ID from local state
   */
  const getOrganizationById = (id: string): OrganizationListItem | undefined => {
    return organizations.value.find(org => org.id === id)
  }

  /**
   * Check if organization exists
   */
  const organizationExists = (id: string): boolean => {
    return organizations.value.some(org => org.id === id)
  }

  /**
   * Refresh current data
   */
  const refresh = async () => {
    if (currentOrganization.value) {
      await fetchOrganizationById(currentOrganization.value.id)
    }
    await fetchOrganizations({ resetList: true })
  }

  return {
    // State
    organizations: organizations as Ref<OrganizationListItem[]>,
    currentOrganization: currentOrganization as Ref<OrganizationDetailData | null>,
    analytics: analytics as Ref<OrganizationSummaryAnalytics[]>,
    performance: performance as Ref<MonthlyOrganizationPerformance[]>,
    leadScoring: leadScoring as Ref<OrganizationLeadScoring[]>,
    
    // Loading states
    loading,
    isLoading,
    
    // Error states
    errors,
    hasErrors,
    
    // Pagination and filtering
    pagination,
    filters,
    sortConfig,
    
    // Computed
    hasOrganizations,
    
    // Methods
    fetchOrganizations,
    fetchOrganizationById,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    searchOrganizations,
    
    // Utility methods
    getOrganizationById,
    organizationExists,
    refresh,
    reset,
    clearErrors,
    clearError,
    
    // Organization utils (re-exported for convenience)
    utils: organizationUtils
  }
}