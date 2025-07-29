import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { supabase } from '@/config/supabaseClient'
import type {
  Organization,
  OrganizationInsert,
  OrganizationUpdate,
  OrganizationInteraction,
  OrganizationInteractionInsert,
  OrganizationDocument,
  OrganizationDocumentInsert,
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
  OrganizationSortField,
  PaginationConfig,
  OrganizationMetrics,
  BulkOrganizationOperation,
  BulkOperationResult
} from '@/types/organizations'

/**
 * Organization Store - Manages organization data and operations
 * Follows established Pinia patterns with reactive state management
 * Comprehensive CRUD operations with analytics and relationship management
 */
export const useOrganizationStore = defineStore('organization', () => {
  // ===============================
  // STATE MANAGEMENT
  // ===============================
  
  // Core data state
  const organizations = ref<OrganizationListItem[]>([])
  const currentOrganization = ref<OrganizationDetailData | null>(null)
  
  // Analytics and performance data
  const analyticsData = ref<OrganizationSummaryAnalytics[]>([])
  const performanceData = ref<MonthlyOrganizationPerformance[]>([])
  const leadScoringData = ref<OrganizationLeadScoring[]>([])
  const dashboardMetrics = ref<OrganizationMetrics | null>(null)
  
  // Interactions and documents
  const interactions = ref<OrganizationInteraction[]>([])
  const documents = ref<OrganizationDocument[]>([])
  
  // Loading states - granular loading management
  const loading = reactive({
    organizations: false,
    currentOrganization: false,
    analytics: false,
    performance: false,
    leadScoring: false,
    metrics: false,
    interactions: false,
    documents: false,
    creating: false,
    updating: false,
    deleting: false,
    bulkOperations: false
  })
  
  // Error states
  const errors = reactive({
    organizations: '',
    currentOrganization: '',
    analytics: '',
    performance: '',
    leadScoring: '',
    metrics: '',
    interactions: '',
    documents: '',
    creating: '',
    updating: '',
    deleting: '',
    bulkOperations: ''
  })
  
  // Search and filtering state
  const searchQuery = ref('')
  const appliedFilters = ref<OrganizationFilters>({})
  const sortConfig = ref<OrganizationSortConfig>({
    field: 'name',
    order: 'asc'
  })
  
  // Pagination state
  const pagination = ref<PaginationConfig>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false
  })
  
  // Cache and optimization
  const lastRefreshed = ref<Date | null>(null)
  const dataCache = reactive<Record<string, { data: any; timestamp: number; ttl: number }>>({})
  
  // ===============================
  // COMPUTED PROPERTIES
  // ===============================
  
  const hasOrganizations = computed(() => organizations.value.length > 0)
  const totalOrganizations = computed(() => pagination.value.total)
  const isLoading = computed(() => Object.values(loading).some(state => state))
  const hasErrors = computed(() => Object.values(errors).some(error => error !== ''))
  const currentError = computed(() => {
    const errorKeys = Object.keys(errors) as Array<keyof typeof errors>
    const firstError = errorKeys.find(key => errors[key] !== '')
    return firstError ? errors[firstError] : ''
  })
  
  // Analytics computed properties
  const organizationStats = computed(() => {
    if (!dashboardMetrics.value) return null
    
    return {
      total: dashboardMetrics.value.total_organizations,
      active: dashboardMetrics.value.active_organizations,
      prospects: dashboardMetrics.value.prospect_organizations,
      customers: dashboardMetrics.value.customer_organizations,
      partners: dashboardMetrics.value.partner_organizations,
      totalRevenue: dashboardMetrics.value.total_revenue,
      averageLeadScore: dashboardMetrics.value.average_lead_score,
      thisMonth: dashboardMetrics.value.organizations_this_month,
      thisWeek: dashboardMetrics.value.organizations_this_week
    }
  })
  
  // Top performing organizations
  const topPerformingOrganizations = computed(() => {
    return organizations.value
      .filter(org => org.lead_score !== null)
      .sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0))
      .slice(0, 10)
  })
  
  // Organizations by status
  const organizationsByStatus = computed(() => {
    return organizations.value.reduce((acc, org) => {
      const status = org.status || 'Unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  })
  
  // Recent organizations (created in last 30 days)
  const recentOrganizations = computed(() => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    return organizations.value.filter(org => {
      if (!org.created_at) return false
      return new Date(org.created_at) >= thirtyDaysAgo
    })
  })
  
  // ===============================
  // ERROR MANAGEMENT
  // ===============================
  
  /**
   * Clear all errors
   */
  const clearErrors = () => {
    Object.keys(errors).forEach(key => {
      errors[key as keyof typeof errors] = ''
    })
  }
  
  /**
   * Clear specific error
   */
  const clearError = (type: keyof typeof errors) => {
    errors[type] = ''
  }
  
  /**
   * Set error message
   */
  const setError = (type: keyof typeof errors, message: string) => {
    errors[type] = message
    console.error(`Organization Store Error (${type}):`, message)
  }
  
  // ===============================
  // CACHE MANAGEMENT
  // ===============================
  
  /**
   * Check if cached data is still valid
   */
  const isCacheValid = (key: string): boolean => {
    const cached = dataCache[key]
    if (!cached) return false
    return Date.now() - cached.timestamp < cached.ttl
  }
  
  /**
   * Get cached data if valid
   */
  const getCachedData = <T>(key: string): T | null => {
    if (isCacheValid(key)) {
      return dataCache[key].data as T
    }
    return null
  }
  
  /**
   * Set cache data with TTL
   */
  const setCacheData = (key: string, data: any, ttlMs: number = 300000) => { // 5 minutes default
    dataCache[key] = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    }
  }
  
  /**
   * Clear specific cache entry
   */
  const clearCache = (key?: string) => {
    if (key) {
      delete dataCache[key]
    } else {
      Object.keys(dataCache).forEach(k => delete dataCache[k])
    }
  }
  
  // ===============================
  // CORE CRUD OPERATIONS
  // ===============================
  
  /**
   * Fetch organizations with advanced filtering, sorting, and pagination
   */
  const fetchOrganizations = async (options: {
    page?: number
    limit?: number
    filters?: Partial<OrganizationFilters>
    sort?: Partial<OrganizationSortConfig>
    search?: string
    useCache?: boolean
    resetList?: boolean
  } = {}): Promise<OrganizationListResponse | null> => {
    try {
      loading.organizations = true
      clearError('organizations')
      
      // Update pagination and filters
      if (options.page !== undefined) pagination.value.page = options.page
      if (options.limit !== undefined) pagination.value.limit = options.limit
      if (options.filters) appliedFilters.value = { ...appliedFilters.value, ...options.filters }
      if (options.sort) sortConfig.value = { ...sortConfig.value, ...options.sort }
      if (options.search !== undefined) searchQuery.value = options.search
      
      // Check cache first
      const cacheKey = `organizations_${JSON.stringify({ 
        page: pagination.value.page, 
        limit: pagination.value.limit,
        filters: appliedFilters.value,
        sort: sortConfig.value,
        search: searchQuery.value
      })}`
      
      if (options.useCache !== false) {
        const cached = getCachedData<OrganizationListResponse>(cacheKey)
        if (cached) {
          organizations.value = options.resetList ? cached.data : [...organizations.value, ...cached.data]
          pagination.value = cached.pagination
          return cached
        }
      }
      
      // Build Supabase query
      let query = supabase
        .from('organization_summary_analytics')
        .select('*', { count: 'exact' })
      
      // Apply search
      if (searchQuery.value.trim()) {
        const searchTerm = searchQuery.value.trim()
        query = query.or(`name.ilike.%${searchTerm}%,legal_name.ilike.%${searchTerm}%,industry.ilike.%${searchTerm}%`)
      }
      
      // Apply filters
      if (appliedFilters.value.industry && appliedFilters.value.industry.length > 0) {
        query = query.in('industry', appliedFilters.value.industry)
      }
      
      if (appliedFilters.value.status && appliedFilters.value.status.length > 0) {
        query = query.in('status', appliedFilters.value.status)
      }
      
      if (appliedFilters.value.type && appliedFilters.value.type.length > 0) {
        query = query.in('type', appliedFilters.value.type)
      }
      
      if (appliedFilters.value.size && appliedFilters.value.size.length > 0) {
        query = query.in('size', appliedFilters.value.size)
      }
      
      if (appliedFilters.value.country && appliedFilters.value.country.length > 0) {
        query = query.in('country', appliedFilters.value.country)
      }
      
      // Lead score range filter
      if (appliedFilters.value.leadScoreRange) {
        if (appliedFilters.value.leadScoreRange.min !== undefined) {
          query = query.gte('lead_score', appliedFilters.value.leadScoreRange.min)
        }
        if (appliedFilters.value.leadScoreRange.max !== undefined) {
          query = query.lte('lead_score', appliedFilters.value.leadScoreRange.max)
        }
      }
      
      // Employee range filter
      if (appliedFilters.value.employeeRange) {
        if (appliedFilters.value.employeeRange.min !== undefined) {
          query = query.gte('employees_count', appliedFilters.value.employeeRange.min)
        }
        if (appliedFilters.value.employeeRange.max !== undefined) {
          query = query.lte('employees_count', appliedFilters.value.employeeRange.max)
        }
      }
      
      // Revenue range filter
      if (appliedFilters.value.revenueRange) {
        if (appliedFilters.value.revenueRange.min !== undefined) {
          query = query.gte('annual_revenue', appliedFilters.value.revenueRange.min)
        }
        if (appliedFilters.value.revenueRange.max !== undefined) {
          query = query.lte('annual_revenue', appliedFilters.value.revenueRange.max)
        }
      }
      
      // Date range filters
      if (appliedFilters.value.lastContactDateRange) {
        query = query.gte('last_contact_date', appliedFilters.value.lastContactDateRange.start.toISOString())
        query = query.lte('last_contact_date', appliedFilters.value.lastContactDateRange.end.toISOString())
      }
      
      // Apply sorting
      const ascending = sortConfig.value.order === 'asc'
      query = query.order(sortConfig.value.field, { ascending })
      
      // Apply pagination
      const offset = (pagination.value.page - 1) * pagination.value.limit
      query = query.range(offset, offset + pagination.value.limit - 1)
      
      const { data, error, count } = await query
      
      if (error) {
        throw new Error(error.message)
      }
      
      // Transform data to OrganizationListItem format
      const transformedData: OrganizationListItem[] = (data || []).map(item => ({
        id: item.id || '',
        name: item.name || '',
        legal_name: null, // Not available in summary analytics view
        industry: item.industry,
        type: null, // Not available in summary analytics view
        size: null, // Not available in summary analytics view
        status: item.status,
        website: null, // Not available in summary analytics view
        email: null, // Not available in summary analytics view
        primary_phone: null, // Not available in summary analytics view
        city: null, // Not available in summary analytics view
        country: null, // Not available in summary analytics view
        employees_count: null, // Not available in summary analytics view
        annual_revenue: null, // Not available in summary analytics view
        lead_score: item.lead_score,
        contact_count: item.contact_count ?? undefined,
        last_interaction_date: item.last_interaction_date,
        next_follow_up_date: item.next_follow_up_date,
        created_at: null, // Not available in summary analytics view
        updated_at: null // Not available in summary analytics view
      }))
      
      // Update pagination
      pagination.value.total = count || 0
      pagination.value.totalPages = Math.ceil(pagination.value.total / pagination.value.limit)
      pagination.value.hasNext = pagination.value.page < pagination.value.totalPages
      pagination.value.hasPrevious = pagination.value.page > 1
      
      // Update organizations list
      if (options.resetList !== false) {
        organizations.value = transformedData
      } else {
        organizations.value = [...organizations.value, ...transformedData]
      }
      
      const response: OrganizationListResponse = {
        data: transformedData,
        pagination: { ...pagination.value },
        filters: { ...appliedFilters.value },
        sort: { ...sortConfig.value }
      }
      
      // Cache the response
      setCacheData(cacheKey, response)
      lastRefreshed.value = new Date()
      
      return response
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch organizations'
      setError('organizations', message)
      return null
    } finally {
      loading.organizations = false
    }
  }
  
  /**
   * Fetch organization by ID with detailed information
   */
  const fetchOrganization = async (id: string): Promise<OrganizationDetailData | null> => {
    try {
      loading.currentOrganization = true
      clearError('currentOrganization')
      
      // Check cache first
      const cacheKey = `organization_${id}`
      const cached = getCachedData<OrganizationDetailData>(cacheKey)
      if (cached) {
        currentOrganization.value = cached
        return cached
      }
      
      // Fetch organization data
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
          .select('id, first_name, last_name, email, title')
          .eq('organization_id', id),
        
        supabase
          .from('organization_interactions')
          .select('id, type, subject, interaction_date, contact_id, direction')
          .eq('organization_id', id)
          .order('interaction_date', { ascending: false })
          .limit(10),
        
        supabase
          .from('organization_documents')
          .select('id, name, category, size, created_at')
          .eq('organization_id', id)
      ])
      
      // Build detailed data
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
        })),
        analytics_summary: {
          total_interactions: interactionsResult.data?.length || 0,
          revenue_generated: orgData.annual_revenue,
          deals_closed: 0, // Would need to fetch from opportunities table
          engagement_status: getEngagementStatus(interactionsResult.data?.length || 0)
        }
      }
      
      currentOrganization.value = detailData
      
      // Cache the result
      setCacheData(cacheKey, detailData)
      
      return detailData
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch organization'
      setError('currentOrganization', message)
      currentOrganization.value = null
      return null
    } finally {
      loading.currentOrganization = false
    }
  }
  
  /**
   * Create new organization
   */
  const createOrganization = async (organizationData: OrganizationInsert): Promise<Organization | null> => {
    try {
      loading.creating = true
      clearError('creating')
      
      const { data, error } = await supabase
        .from('organizations')
        .insert(organizationData)
        .select()
        .single()
      
      if (error) {
        throw new Error(error.message)
      }
      
      // Clear cache and refresh list
      clearCache()
      await fetchOrganizations({ resetList: true })
      
      return data
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create organization'
      setError('creating', message)
      return null
    } finally {
      loading.creating = false
    }
  }
  
  /**
   * Update existing organization
   */
  const updateOrganization = async (id: string, updates: OrganizationUpdate): Promise<Organization | null> => {
    try {
      loading.updating = true
      clearError('updating')
      
      const { data, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        throw new Error(error.message)
      }
      
      // Update current organization if it's the one being updated
      if (currentOrganization.value?.id === id) {
        await fetchOrganization(id)
      }
      
      // Clear cache and refresh list
      clearCache()
      await fetchOrganizations({ resetList: true })
      
      return data
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update organization'
      setError('updating', message)
      return null
    } finally {
      loading.updating = false
    }
  }
  
  /**
   * Delete organization
   */
  const deleteOrganization = async (id: string): Promise<boolean> => {
    try {
      loading.deleting = true
      clearError('deleting')
      
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
      
      // Clear cache
      clearCache()
      
      return true
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete organization'
      setError('deleting', message)
      return false
    } finally {
      loading.deleting = false
    }
  }
  
  // ===============================
  // SEARCH AND FILTERING
  // ===============================
  
  /**
   * Search organizations
   */
  const searchOrganizations = async (query: string) => {
    searchQuery.value = query
    pagination.value.page = 1 // Reset to first page on new search
    await fetchOrganizations({ search: query, resetList: true })
  }
  
  /**
   * Clear search and show all organizations
   */
  const clearSearch = async () => {
    searchQuery.value = ''
    pagination.value.page = 1
    await fetchOrganizations({ resetList: true })
  }
  
  /**
   * Apply filters
   */
  const applyFilters = async (filters: Partial<OrganizationFilters>) => {
    appliedFilters.value = { ...appliedFilters.value, ...filters }
    pagination.value.page = 1 // Reset to first page
    await fetchOrganizations({ resetList: true })
  }
  
  /**
   * Clear all filters
   */
  const clearFilters = async () => {
    appliedFilters.value = {}
    pagination.value.page = 1
    await fetchOrganizations({ resetList: true })
  }
  
  /**
   * Change sorting
   */
  const setSorting = async (field: OrganizationSortField, order: 'asc' | 'desc') => {
    sortConfig.value = { field, order }
    pagination.value.page = 1 // Reset to first page on sort change
    await fetchOrganizations({ resetList: true })
  }
  
  // ===============================
  // PAGINATION
  // ===============================
  
  /**
   * Change page
   */
  const setPage = async (page: number) => {
    if (page >= 1 && page <= pagination.value.totalPages) {
      pagination.value.page = page
      await fetchOrganizations()
    }
  }
  
  /**
   * Go to next page
   */
  const nextPage = async () => {
    if (pagination.value.hasNext) {
      await setPage(pagination.value.page + 1)
    }
  }
  
  /**
   * Go to previous page
   */
  const previousPage = async () => {
    if (pagination.value.hasPrevious) {
      await setPage(pagination.value.page - 1)
    }
  }
  
  // ===============================
  // ANALYTICS AND METRICS
  // ===============================
  
  /**
   * Fetch dashboard metrics
   */
  const fetchDashboardMetrics = async (): Promise<OrganizationMetrics | null> => {
    try {
      loading.metrics = true
      clearError('metrics')
      
      // Check cache first
      const cacheKey = 'dashboard_metrics'
      const cached = getCachedData<OrganizationMetrics>(cacheKey)
      if (cached) {
        dashboardMetrics.value = cached
        return cached
      }
      
      // Fetch metrics in parallel
      const [totalResult, activeResult, prospectResult, customerResult, partnerResult, revenueResult] = await Promise.all([
        supabase.from('organizations').select('id', { count: 'exact', head: true }),
        supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('status', 'Active'),
        supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('status', 'Prospect'),
        supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('status', 'Customer'),
        supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('status', 'Partner'),
        supabase.from('organizations').select('annual_revenue, lead_score', { count: 'exact' }).not('annual_revenue', 'is', null)
      ])
      
      // Calculate date ranges
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const firstDayOfWeek = new Date(now)
      firstDayOfWeek.setDate(now.getDate() - now.getDay())
      
      const [monthResult, weekResult] = await Promise.all([
        supabase.from('organizations').select('id', { count: 'exact', head: true }).gte('created_at', firstDayOfMonth.toISOString()),
        supabase.from('organizations').select('id', { count: 'exact', head: true }).gte('created_at', firstDayOfWeek.toISOString())
      ])
      
      // Calculate metrics
      const totalRevenue = revenueResult.data?.reduce((sum, org) => sum + (org.annual_revenue || 0), 0) || 0
      const averageLeadScore = revenueResult.data?.length 
        ? revenueResult.data.reduce((sum, org) => sum + (org.lead_score || 0), 0) / revenueResult.data.length
        : 0
      
      const metrics: OrganizationMetrics = {
        total_organizations: totalResult.count || 0,
        active_organizations: activeResult.count || 0,
        prospect_organizations: prospectResult.count || 0,
        customer_organizations: customerResult.count || 0,
        partner_organizations: partnerResult.count || 0,
        total_revenue: totalRevenue,
        average_lead_score: averageLeadScore,
        organizations_this_month: monthResult.count || 0,
        organizations_this_week: weekResult.count || 0
      }
      
      dashboardMetrics.value = metrics
      
      // Cache the result
      setCacheData(cacheKey, metrics, 600000) // 10 minutes cache
      
      return metrics
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch dashboard metrics'
      setError('metrics', message)
      return null
    } finally {
      loading.metrics = false
    }
  }
  
  /**
   * Fetch organization analytics data
   */
  const fetchAnalytics = async (): Promise<OrganizationSummaryAnalytics[] | null> => {
    try {
      loading.analytics = true
      clearError('analytics')
      
      const { data, error } = await supabase
        .from('organization_summary_analytics')
        .select('*')
        .order('lead_score', { ascending: false })
        .limit(50)
      
      if (error) {
        throw new Error(error.message)
      }
      
      analyticsData.value = data || []
      return data
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch analytics'
      setError('analytics', message)
      return null
    } finally {
      loading.analytics = false
    }
  }
  
  /**
   * Fetch performance data
   */
  const fetchPerformanceData = async (): Promise<MonthlyOrganizationPerformance[] | null> => {
    try {
      loading.performance = true
      clearError('performance')
      
      const { data, error } = await supabase
        .from('monthly_organization_performance')
        .select('*')
        .order('performance_month', { ascending: false })
        .limit(12)
      
      if (error) {
        throw new Error(error.message)
      }
      
      performanceData.value = data || []
      return data
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch performance data'
      setError('performance', message)
      return null
    } finally {
      loading.performance = false
    }
  }
  
  /**
   * Fetch lead scoring data
   */
  const fetchLeadScoringData = async (): Promise<OrganizationLeadScoring[] | null> => {
    try {
      loading.leadScoring = true
      clearError('leadScoring')
      
      const { data, error } = await supabase
        .from('organization_lead_scoring')
        .select('*')
        .order('lead_score', { ascending: false })
        .limit(100)
      
      if (error) {
        throw new Error(error.message)
      }
      
      leadScoringData.value = data || []
      return data
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch lead scoring data'
      setError('leadScoring', message)
      return null
    } finally {
      loading.leadScoring = false
    }
  }
  
  // ===============================
  // INTERACTION MANAGEMENT
  // ===============================
  
  /**
   * Fetch interactions for current organization
   */
  const fetchInteractions = async (organizationId?: string): Promise<OrganizationInteraction[] | null> => {
    try {
      loading.interactions = true
      clearError('interactions')
      
      const orgId = organizationId || currentOrganization.value?.id
      if (!orgId) {
        throw new Error('No organization ID provided')
      }
      
      const { data, error } = await supabase
        .from('organization_interactions')
        .select('*')
        .eq('organization_id', orgId)
        .order('interaction_date', { ascending: false })
      
      if (error) {
        throw new Error(error.message)
      }
      
      interactions.value = data || []
      return data
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch interactions'
      setError('interactions', message)
      return null
    } finally {
      loading.interactions = false
    }
  }
  
  /**
   * Create new interaction
   */
  const createInteraction = async (interactionData: OrganizationInteractionInsert): Promise<OrganizationInteraction | null> => {
    try {
      const { data, error } = await supabase
        .from('organization_interactions')
        .insert(interactionData)
        .select()
        .single()
      
      if (error) {
        throw new Error(error.message)
      }
      
      // Refresh interactions
      await fetchInteractions(interactionData.organization_id)
      
      return data
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create interaction'
      setError('interactions', message)
      return null
    }
  }
  
  // ===============================
  // DOCUMENT MANAGEMENT
  // ===============================
  
  /**
   * Fetch documents for current organization
   */
  const fetchDocuments = async (organizationId?: string): Promise<OrganizationDocument[] | null> => {
    try {
      loading.documents = true
      clearError('documents')
      
      const orgId = organizationId || currentOrganization.value?.id
      if (!orgId) {
        throw new Error('No organization ID provided')
      }
      
      const { data, error } = await supabase
        .from('organization_documents')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
      
      if (error) {
        throw new Error(error.message)
      }
      
      documents.value = data || []
      return data
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch documents'
      setError('documents', message)
      return null
    } finally {
      loading.documents = false
    }
  }
  
  /**
   * Create new document
   */
  const createDocument = async (documentData: OrganizationDocumentInsert): Promise<OrganizationDocument | null> => {
    try {
      const { data, error } = await supabase
        .from('organization_documents')
        .insert(documentData)
        .select()
        .single()
      
      if (error) {
        throw new Error(error.message)
      }
      
      // Refresh documents
      await fetchDocuments(documentData.organization_id)
      
      return data
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create document'
      setError('documents', message)
      return null
    }
  }
  
  // ===============================
  // BULK OPERATIONS
  // ===============================
  
  /**
   * Perform bulk operations on multiple organizations
   */
  const performBulkOperation = async (operation: BulkOrganizationOperation): Promise<BulkOperationResult> => {
    try {
      loading.bulkOperations = true
      clearError('bulkOperations')
      
      let processedCount = 0
      let errorCount = 0
      const errors: Array<{ organizationId: string; error: string }> = []
      
      for (const orgId of operation.organizationIds) {
        try {
          switch (operation.type) {
            case 'update':
              if (operation.data) {
                await updateOrganization(orgId, operation.data)
                processedCount++
              }
              break
              
            case 'delete':
              await deleteOrganization(orgId)
              processedCount++
              break
              
            case 'tag':
              if (operation.data?.tags) {
                const org = organizations.value.find(o => o.id === orgId)
                if (org) {
                  await updateOrganization(orgId, { tags: operation.data.tags })
                  processedCount++
                }
              }
              break
              
            default:
              throw new Error(`Unsupported bulk operation: ${operation.type}`)
          }
        } catch (error) {
          errorCount++
          errors.push({
            organizationId: orgId,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
      
      return {
        success: errorCount === 0,
        processedCount,
        errorCount,
        errors
      }
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to perform bulk operation'
      setError('bulkOperations', message)
      return {
        success: false,
        processedCount: 0,
        errorCount: operation.organizationIds.length,
        errors: operation.organizationIds.map(id => ({ organizationId: id, error: message }))
      }
    } finally {
      loading.bulkOperations = false
    }
  }
  
  // ===============================
  // UTILITY FUNCTIONS
  // ===============================
  
  /**
   * Get organization by ID from local state
   */
  const getOrganizationById = (id: string): OrganizationListItem | undefined => {
    return organizations.value.find(org => org.id === id)
  }
  
  /**
   * Check if organization exists in local state
   */
  const organizationExists = (id: string): boolean => {
    return organizations.value.some(org => org.id === id)
  }
  
  /**
   * Get engagement status based on interaction count
   */
  const getEngagementStatus = (interactionCount: number): string => {
    if (interactionCount >= 10) return 'High'
    if (interactionCount >= 5) return 'Medium'
    if (interactionCount >= 1) return 'Low'
    return 'None'
  }
  
  /**
   * Refresh all data
   */
  const refreshAllData = async () => {
    clearCache()
    await Promise.all([
      fetchOrganizations({ resetList: true }),
      fetchDashboardMetrics(),
      fetchAnalytics()
    ])
    lastRefreshed.value = new Date()
  }
  
  /**
   * Reset store to initial state
   */
  const resetStore = () => {
    organizations.value = []
    currentOrganization.value = null
    analyticsData.value = []
    performanceData.value = []
    leadScoringData.value = []
    dashboardMetrics.value = null
    interactions.value = []
    documents.value = []
    
    searchQuery.value = ''
    appliedFilters.value = {}
    sortConfig.value = { field: 'name', order: 'asc' }
    
    pagination.value = {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false
    }
    
    Object.keys(loading).forEach(key => {
      loading[key as keyof typeof loading] = false
    })
    
    clearErrors()
    clearCache()
    lastRefreshed.value = null
  }
  
  // ===============================
  // RETURN STATEMENT
  // ===============================
  
  return {
    // State
    organizations,
    currentOrganization,
    analyticsData,
    performanceData,
    leadScoringData,
    dashboardMetrics,
    interactions,
    documents,
    searchQuery,
    appliedFilters,
    sortConfig,
    pagination,
    lastRefreshed,
    
    // Loading states
    loading,
    isLoading,
    
    // Error states
    errors,
    hasErrors,
    currentError,
    
    // Computed
    hasOrganizations,
    totalOrganizations,
    organizationStats,
    topPerformingOrganizations,
    organizationsByStatus,
    recentOrganizations,
    
    // Core CRUD operations
    fetchOrganizations,
    fetchOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    
    // Search and filtering
    searchOrganizations,
    clearSearch,
    applyFilters,
    clearFilters,
    setSorting,
    
    // Pagination
    setPage,
    nextPage,
    previousPage,
    
    // Analytics and metrics
    fetchDashboardMetrics,
    fetchAnalytics,
    fetchPerformanceData,
    fetchLeadScoringData,
    
    // Interaction management
    fetchInteractions,
    createInteraction,
    
    // Document management
    fetchDocuments,
    createDocument,
    
    // Bulk operations
    performBulkOperation,
    
    // Utility methods
    getOrganizationById,
    organizationExists,
    refreshAllData,
    resetStore,
    clearErrors,
    clearError,
    clearCache
  }
})