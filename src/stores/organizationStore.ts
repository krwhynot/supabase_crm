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
  BulkOperationResult,
  EnhancedOrganizationCreateForm,
  PriorityOption
} from '@/types/organizations'
import {
  PRIORITY_OPTIONS,
  priorityLetterToScore,
  scoreToPriorityLetter
} from '@/types/organizations'

/**
 * Organization Store - Manages organization data and operations
 * Follows established Pinia patterns with reactive state management
 * Comprehensive CRUD operations with analytics and relationship management
 */
export const useOrganizationStore = defineStore('organization', () => {
  // ===============================
  // MONITORING INTEGRATION
  // ===============================
  
  // Monitoring functionality removed - was unused
  
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
      total: dashboardMetrics.value.totalOrganizations,
      active: dashboardMetrics.value.activeOrganizations,
      prospects: dashboardMetrics.value.prospects,
      customers: dashboardMetrics.value.customers,
      partners: dashboardMetrics.value.partners,
      totalRevenue: dashboardMetrics.value.totalRevenue,
      averageLeadScore: dashboardMetrics.value.averageLeadScore,
      thisMonth: dashboardMetrics.value.monthlyGrowth > 0 ? Math.round(dashboardMetrics.value.totalOrganizations * dashboardMetrics.value.monthlyGrowth / 100) : 0,
      thisWeek: Math.round((dashboardMetrics.value.monthlyGrowth > 0 ? dashboardMetrics.value.totalOrganizations * dashboardMetrics.value.monthlyGrowth / 100 : 0) / 4)
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
  // ENHANCED FORM REDESIGN COMPUTED PROPERTIES - Stage 3.1
  // ===============================

  // Priority options for A/B/C/D system
  const priorityOptions = computed<PriorityOption[]>(() => PRIORITY_OPTIONS)

  // Food & Beverage segments prioritized list
  const foodBeverageSegments = computed(() => [
    { value: 'Food & Beverage - Restaurants', label: 'Food & Beverage - Restaurants', priority: true },
    { value: 'Food & Beverage - Manufacturing', label: 'Food & Beverage - Manufacturing', priority: true },
    { value: 'Food & Beverage - Distribution', label: 'Food & Beverage - Distribution', priority: true },
    { value: 'Food & Beverage - Retail', label: 'Food & Beverage - Retail', priority: true },
    { value: 'Food & Beverage - Service', label: 'Food & Beverage - Service', priority: true },
    // Add other industry segments with lower priority
    { value: 'Technology', label: 'Technology', priority: false },
    { value: 'Healthcare', label: 'Healthcare', priority: false },
    { value: 'Manufacturing', label: 'Manufacturing', priority: false },
    { value: 'Retail', label: 'Retail', priority: false },
    { value: 'Financial Services', label: 'Financial Services', priority: false },
    { value: 'Real Estate', label: 'Real Estate', priority: false },
    { value: 'Education', label: 'Education', priority: false },
    { value: 'Government', label: 'Government', priority: false },
    { value: 'Non-Profit', label: 'Non-Profit', priority: false },
    { value: 'Other', label: 'Other', priority: false }
  ])

  // Distributor organizations for dropdown
  const distributorOrganizations = computed(() => 
    organizations.value.filter(org => {
      const orgWithFields = org as any
      return orgWithFields.custom_fields && 
        typeof orgWithFields.custom_fields === 'object' && 
        'is_distributor' in orgWithFields.custom_fields &&
        orgWithFields.custom_fields.is_distributor === true
    })
  )

  // Principal organizations for reference
  const principalOrganizations = computed(() => 
    organizations.value.filter(org => {
      const orgWithFields = org as any
      return orgWithFields.custom_fields && 
        typeof orgWithFields.custom_fields === 'object' && 
        'is_principal' in orgWithFields.custom_fields &&
        orgWithFields.custom_fields.is_principal === true
    })
  )

  // Organizations associated with specific principals (for opportunity integration)
  const getOrganizationsForPrincipals = computed(() => {
    return (principalIds: string[]) => {
      return organizations.value.filter(org => {
        // Check if organization has relationships with specified principals
        // This could be expanded to check contact_principals junction table
        return principalIds.includes(org.id) || // Organization is itself a principal
          (org as any).assigned_principals?.some((pid: string) => principalIds.includes(pid))
      })
    }
  })

  // Organizations that have principal relationships (for analytics)
  const principalRelatedOrganizations = computed(() => 
    organizations.value.filter(org => {
      const orgWithFields = org as any
      return (orgWithFields.custom_fields?.is_principal === true) ||
        (orgWithFields.custom_fields?.is_distributor === true) ||
        (orgWithFields.assigned_principals && orgWithFields.assigned_principals.length > 0)
    })
  )
  
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
   * Fetch organizations associated with specific principals
   * Enhanced for opportunity management with contact-principal relationships
   */
  const fetchOrganizationsByPrincipal = async (
    principalId: string,
    options: {
      includeDirectRelationships?: boolean
      includeContactRelationships?: boolean
      useCache?: boolean
      includeOpportunityData?: boolean
    } = {}
  ): Promise<OrganizationListItem[] | null> => {
    try {
      loading.organizations = true
      clearError('organizations')
      
      const cacheKey = `organizations_by_principal_${principalId}_${JSON.stringify(options)}`
      
      if (options.useCache !== false) {
        const cached = getCachedData<OrganizationListItem[]>(cacheKey)
        if (cached) return cached
      }
      
      let organizationsFromDirect: any[] = []
      let organizationsFromContacts: any[] = []
      
      // Direct relationship: organization is the principal
      if (options.includeDirectRelationships !== false) {
        const { data: directData, error: directError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', principalId)
          
        if (directError) {
          console.warn('Failed to fetch direct principal organizations:', directError.message)
        } else {
          organizationsFromDirect = directData || []
        }
      }
      
      // Contact-principal relationships: find organizations through contacts that have principal relationships
      if (options.includeContactRelationships !== false) {
        const { data: contactPrincipalData, error: contactError } = await supabase
          .from('contact_principals')
          .select(`
            contact_id,
            contacts!inner(
              organization_id,
              organizations!inner(*)
            )
          `)
          .eq('principal_id', principalId)
          
        if (contactError) {
          console.warn('Failed to fetch contact-principal organizations:', contactError.message)
        } else {
          // Extract organizations from contact relationships
          organizationsFromContacts = (contactPrincipalData || [])
            .map(cp => (cp.contacts as any)?.organizations)
            .filter(org => org)
        }
      }
      
      // Combine and deduplicate organizations
      const allOrganizations = [...organizationsFromDirect, ...organizationsFromContacts]
      const uniqueOrganizations = allOrganizations.reduce((acc: any[], org: any) => {
        if (!acc.find((existing: any) => existing.id === org.id)) {
          acc.push(org)
        }
        return acc
      }, [] as any[])
      
      // Transform to OrganizationListItem format
      const transformedData: OrganizationListItem[] = uniqueOrganizations.map((item: any) => ({
        id: item.id || '',
        name: item.name || '',
        legal_name: item.legal_name,
        industry: item.industry,
        type: item.type,
        size: item.size,
        status: item.status,
        website: item.website,
        email: item.email,
        primary_phone: item.primary_phone,
        city: item.city,
        country: item.country,
        employees_count: item.employees_count,
        annual_revenue: item.annual_revenue,
        lead_score: item.lead_score,
        contact_count: undefined,
        last_interaction_date: item.last_contact_date,
        next_follow_up_date: item.next_follow_up_date,
        created_at: item.created_at,
        updated_at: item.updated_at
      }))
      
      setCacheData(cacheKey, transformedData)
      return transformedData
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch organizations by principal'
      setError('organizations', message)
      
      console.error(`Failed to fetch organizations by principal: ${message}`, {
        operation: 'fetch_organizations_by_principal',
        principalId,
        options
      })
      
      return null
    } finally {
      loading.organizations = false
    }
  }

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
      
      // Build Supabase query - using basic organizations table instead of missing analytics view
      let query = supabase
        .from('organizations')
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
        if (appliedFilters.value.lastContactDateRange.start) {
          query = query.gte('last_contact_date', appliedFilters.value.lastContactDateRange.start.toISOString())
        }
        if (appliedFilters.value.lastContactDateRange.end) {
          query = query.lte('last_contact_date', appliedFilters.value.lastContactDateRange.end.toISOString())
        }
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
      
      // Transform data to OrganizationListItem format using full organization data
      const transformedData: OrganizationListItem[] = (data || []).map(item => ({
        id: item.id || '',
        name: item.name || '',
        legal_name: item.legal_name,
        industry: item.industry,
        type: item.type,
        size: item.size,
        status: item.status,
        website: item.website,
        email: item.email,
        primary_phone: item.primary_phone,
        city: item.city,
        country: item.country,
        employees_count: item.employees_count,
        annual_revenue: item.annual_revenue,
        lead_score: item.lead_score,
        contact_count: undefined, // Will need to be calculated separately if needed
        last_interaction_date: item.last_contact_date,
        next_follow_up_date: item.next_follow_up_date,
        created_at: item.created_at,
        updated_at: item.updated_at
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
      
      console.error(`Failed to fetch organizations: ${message}`, {
        operation: 'fetch_organizations',
        options
      })
      
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
          .select('id, first_name, last_name, email, position')
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
        }))
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
          console.error(`Failed to create organization: ${error.message}`, {
            operation: 'create_organization',
            data: organizationData
          })
          throw new Error(error.message)
        }
        
        // Clear cache and refresh list
        clearCache()
        await fetchOrganizations({ resetList: true })
        
        // Record successful user action
        console.log('Organization created successfully', {
          organizationName: organizationData.name,
          organizationIndustry: organizationData.industry
        })
        
        return data
        
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create organization'
        setError('creating', message)
        
        console.error('Failed to create organization', message, {
          organizationData
        })
        
        return null
      } finally {
        loading.creating = false
      }
    }

  /**
   * Create new organization with contact associations
   */
  const createOrganizationWithContacts = async (
    organizationData: OrganizationInsert,
    contactData: {
      mode: 'select' | 'create'
      selectedContactIds: string[]
      newContacts: Array<{
        first_name: string
        last_name: string
        email: string
        phone?: string
        title?: string
        department?: string
      }>
    }
  ): Promise<Organization | null> => {
    try {
      loading.creating = true
      clearError('creating')

      // Start transaction by creating organization first
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .insert(organizationData)
        .select()
        .single()

      if (orgError) {
        throw new Error(orgError.message)
      }

      // Handle contacts based on mode
      if (contactData.mode === 'create' && contactData.newContacts.length > 0) {
        // Create new contacts and associate with organization
        const contactInserts = contactData.newContacts.map(contact => ({
          organization_id: organization.id,
          first_name: contact.first_name,
          last_name: contact.last_name,
          email: contact.email,
          phone: contact.phone || null,
          position: contact.title || 'Unknown' // Map title to position
        }))

        const { error: contactError } = await supabase
          .from('contacts')
          .insert(contactInserts)

        if (contactError) {
          console.warn('Failed to create some contacts:', contactError.message)
          // Don't fail the entire operation for contact creation errors
        }
      } else if (contactData.mode === 'select' && contactData.selectedContactIds.length > 0) {
        // Update existing contacts to associate with this organization
        const { error: updateError } = await supabase
          .from('contacts')
          .update({ organization_id: organization.id })
          .in('id', contactData.selectedContactIds)

        if (updateError) {
          console.warn('Failed to associate some contacts:', updateError.message)
          // Don't fail the entire operation for contact association errors
        }
      }

      // Clear cache and refresh list
      clearCache()
      await fetchOrganizations({ resetList: true })

      // Record successful user action
      console.log('Organization with contacts created successfully', {
        organizationName: organizationData.name,
        organizationIndustry: organizationData.industry,
        contactMode: contactData.mode,
        contactCount: contactData.mode === 'create' 
          ? contactData.newContacts.length 
          : contactData.selectedContactIds.length
      })

      return organization

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create organization with contacts'
      setError('creating', message)

      console.error('Failed to create organization with contacts', message, {
        organizationData,
        contactData
      })

      return null
    } finally {
      loading.creating = false
    }
  }

  /**
   * Enhanced creation method for redesigned form - Stage 3.1
   */
  const createOrganizationWithEnhancedForm = async (
    formData: EnhancedOrganizationCreateForm
  ): Promise<{ success: boolean; data?: Organization; error?: string }> => {
    try {
      loading.creating = true
      clearError('creating')

      // Transform priority letter to lead_score and filter out non-database fields
      const { priority_letter, ...organizationData } = formData
      
      // Clean up the data for database insertion
      const transformedData: OrganizationInsert = {
        ...organizationData,
        lead_score: priorityLetterToScore(priority_letter),
        status: getAutoStatus(formData) as any, // Cast to allow enhanced status values
        // Ensure tags is properly formatted for JSON field
        tags: organizationData.tags ? organizationData.tags.filter(tag => tag !== undefined) : null,
        // Ensure custom_fields is properly typed
        custom_fields: organizationData.custom_fields as any,
        // Convert Date objects to ISO strings for database
        last_contact_date: organizationData.last_contact_date instanceof Date 
          ? organizationData.last_contact_date.toISOString() 
          : organizationData.last_contact_date,
        next_follow_up_date: organizationData.next_follow_up_date instanceof Date 
          ? organizationData.next_follow_up_date.toISOString() 
          : organizationData.next_follow_up_date
      }

      // Create organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert(transformedData)
        .select()
        .single()

      if (orgError) throw orgError

      // Create contact relationships if specified
      if (formData.assigned_contacts?.length && orgData) {
        await createContactRelationships(orgData.id, formData.assigned_contacts)
      }

      // Refresh organization list
      clearCache()
      await fetchOrganizations({ resetList: true })

      console.log('Enhanced organization created successfully', {
        organizationName: formData.name,
        priority: formData.priority_letter,
        leadScore: transformedData.lead_score,
        isPrincipal: formData.custom_fields?.is_principal,
        isDistributor: formData.custom_fields?.is_distributor,
        contactCount: formData.assigned_contacts?.length || 0
      })

      return { success: true, data: orgData }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create organization'
      setError('creating', message)
      return { success: false, error: message }
    } finally {
      loading.creating = false
    }
  }

  // Helper methods for enhanced form
  const getAutoStatus = (formData: EnhancedOrganizationCreateForm): string => {
    if (formData.custom_fields?.is_principal) return 'Principal'
    if (formData.custom_fields?.is_distributor) return 'Distributor'
    return formData.status
  }

  const createContactRelationships = async (organizationId: string, contactIds: string[]) => {
    // This would create entries in organization_contacts junction table when implemented
    // For now, update existing contacts table with organization_id (legacy approach)
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ organization_id: organizationId })
        .in('id', contactIds)

      if (error) throw error
    } catch (error) {
      console.warn('Failed to create contact relationships:', error)
      throw error
    }
  }

  // ===============================
  // ENHANCED HELPER METHODS - Stage 4.1
  // ===============================

  /**
   * Convert priority letter (A/B/C/D) to lead score value
   */
  const convertPriorityLetterToScore = (letter: 'A' | 'B' | 'C' | 'D'): number => {
    return priorityLetterToScore(letter)
  }

  /**
   * Convert lead score value to priority letter (A/B/C/D)
   */
  const convertScoreToPriorityLetter = (score: number | null): 'A' | 'B' | 'C' | 'D' => {
    return scoreToPriorityLetter(score)
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
   * Update existing organization with contact associations
   */
  const updateOrganizationWithContacts = async (
    id: string,
    updates: OrganizationUpdate,
    contactData: {
      mode: 'select' | 'create'
      selectedContactIds: string[]
      newContacts: Array<{
        first_name: string
        last_name: string
        email: string
        phone?: string
        title?: string
        department?: string
      }>
    }
  ): Promise<Organization | null> => {
    try {
      loading.updating = true
      clearError('updating')

      // Update the organization first
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (orgError) {
        throw new Error(orgError.message)
      }

      // Handle contacts based on mode
      if (contactData.mode === 'create' && contactData.newContacts.length > 0) {
        // Create new contacts and associate with organization
        const contactInserts = contactData.newContacts.map(contact => ({
          organization_id: id,
          first_name: contact.first_name,
          last_name: contact.last_name,
          email: contact.email,
          phone: contact.phone || null,
          position: contact.title || 'Unknown' // Map title to position
        }))

        const { error: contactError } = await supabase
          .from('contacts')
          .insert(contactInserts)

        if (contactError) {
          console.warn('Failed to create some contacts:', contactError.message)
          // Don't fail the entire operation for contact creation errors
        }
      } else if (contactData.mode === 'select' && contactData.selectedContactIds.length > 0) {
        // Update existing contacts to associate with this organization
        const { error: updateError } = await supabase
          .from('contacts')
          .update({ organization_id: id })
          .in('id', contactData.selectedContactIds)

        if (updateError) {
          console.warn('Failed to associate some contacts:', updateError.message)
          // Don't fail the entire operation for contact association errors
        }
      }

      // Update current organization if it's the one being updated
      if (currentOrganization.value?.id === id) {
        await fetchOrganization(id)
      }

      // Clear cache and refresh list
      clearCache()
      await fetchOrganizations({ resetList: true })

      // Record successful user action
      console.log('Organization with contacts updated successfully', {
        organizationId: id,
        contactMode: contactData.mode,
        contactCount: contactData.mode === 'create' 
          ? contactData.newContacts.length 
          : contactData.selectedContactIds.length
      })

      return organization

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update organization with contacts'
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
   * Fetch dashboard metrics with principal-specific analytics
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
      
      // Fetch metrics in parallel, including principal-specific queries
      const [
        totalResult, 
        activeResult, 
        prospectResult, 
        customerResult, 
        partnerResult, 
        revenueResult,
        principalResult,
        distributorResult
      ] = await Promise.all([
        supabase.from('organizations').select('id', { count: 'exact', head: true }),
        supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('status', 'Active'),
        supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('status', 'Prospect'),
        supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('status', 'Customer'),
        supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('status', 'Partner'),
        supabase.from('organizations').select('annual_revenue, lead_score', { count: 'exact' }).not('annual_revenue', 'is', null),
        // Principal-specific metrics
        supabase.from('organizations').select('id', { count: 'exact', head: true }).contains('custom_fields', { is_principal: true }),
        supabase.from('organizations').select('id', { count: 'exact', head: true }).contains('custom_fields', { is_distributor: true })
      ])
      
      // Calculate date ranges
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      
      const monthResult = await supabase.from('organizations').select('id', { count: 'exact', head: true }).gte('created_at', firstDayOfMonth.toISOString())
      
      // Calculate metrics
      const totalRevenue = revenueResult.data?.reduce((sum, org) => sum + (org.annual_revenue || 0), 0) || 0
      const averageLeadScore = revenueResult.data?.length 
        ? revenueResult.data.reduce((sum, org) => sum + (org.lead_score || 0), 0) / revenueResult.data.length
        : 0
      
      const metrics: OrganizationMetrics = {
        totalOrganizations: totalResult.count || 0,
        activeOrganizations: activeResult.count || 0,
        prospects: prospectResult.count || 0,
        customers: customerResult.count || 0,
        partners: partnerResult.count || 0,
        totalRevenue: totalRevenue,
        averageLeadScore: averageLeadScore,
        monthlyGrowth: monthResult.count || 0,
        industryDistribution: [], // Will be populated by industry analytics
        statusDistribution: [], // Will be populated by status analytics
        recentActivity: [], // Will be populated by activity analytics
        // Principal-specific metrics
        principalCount: principalResult.count || 0,
        distributorCount: distributorResult.count || 0
      } as OrganizationMetrics & { principalCount: number; distributorCount: number }
      
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
   * Fetch all available principals with their contact information for opportunity selection
   */
  const fetchAvailablePrincipals = async (options: {
    includeContactCount?: boolean
    useCache?: boolean
  } = {}): Promise<Array<{
    id: string
    name: string
    type: string | null
    contact_count?: number
    primary_contact?: {
      id: string
      name: string
      email: string | null
      phone: string | null
    } | null
  }> | null> => {
    try {
      loading.organizations = true
      clearError('organizations')
      
      const cacheKey = `available_principals_${JSON.stringify(options)}`
      
      if (options.useCache !== false) {
        const cached = getCachedData<any[]>(cacheKey)
        if (cached) return cached
      }
      
      // Fetch organizations that are marked as principals
      const { data: principals, error: principalError } = await supabase
        .from('organizations')
        .select('id, name, type, custom_fields')
        .contains('custom_fields', { is_principal: true })
        .order('name')
      
      if (principalError) throw new Error(principalError.message)
      
      const result = await Promise.all((principals || []).map(async (principal) => {
        let contactCount = 0
        let primaryContact = null
        
        if (options.includeContactCount) {
          // Get contact count and primary contact for each principal
          const { data: contacts, error: contactError } = await supabase
            .from('contacts')
            .select('id, first_name, last_name, email, phone, is_primary')
            .eq('organization_id', principal.id)
            .order('is_primary', { ascending: false })
            .limit(1)
            
          if (!contactError && contacts?.length) {
            contactCount = contacts.length
            const contact = contacts[0]
            primaryContact = {
              id: contact.id,
              name: `${contact.first_name} ${contact.last_name}`,
              email: contact.email,
              phone: contact.phone
            }
          }
        }
        
        return {
          id: principal.id,
          name: principal.name,
          type: principal.type,
          ...(options.includeContactCount && { 
            contact_count: contactCount,
            primary_contact: primaryContact 
          })
        }
      }))
      
      setCacheData(cacheKey, result, 300000) // 5 minutes cache
      return result
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch available principals'
      setError('organizations', message)
      return null
    } finally {
      loading.organizations = false
    }
  }

  /**
   * Fetch organizations that have relationships with multiple principals (for opportunity targeting)
   */
  const fetchMultiPrincipalOrganizations = async (options: {
    minimumPrincipalCount?: number
    useCache?: boolean
  } = {}): Promise<Array<{
    id: string
    name: string
    type: string | null
    principal_count: number
    principal_names: string[]
    total_opportunities?: number
  }> | null> => {
    try {
      loading.organizations = true
      clearError('organizations')
      
      const minimumCount = options.minimumPrincipalCount || 2
      const cacheKey = `multi_principal_orgs_${minimumCount}`
      
      if (options.useCache !== false) {
        const cached = getCachedData<any[]>(cacheKey)
        if (cached) return cached
      }
      
      // Query to find organizations with multiple principal relationships through contacts
      const { data: orgPrincipalData, error } = await supabase
        .from('contact_principals')
        .select(`
          contacts!inner(
            organization_id,
            organizations!inner(id, name, type)
          ),
          organizations!principal_id!inner(id, name)
        `)
      
      if (error) throw new Error(error.message)
      
      // Group by organization and count principals
      const orgPrincipalMap = new Map<string, {
        org: any
        principals: Set<string>
        principalNames: string[]
      }>()
      
      orgPrincipalData?.forEach(item => {
        const org = (item.contacts as any)?.organizations
        const principal = (item.organizations as any)
        
        if (org && principal) {
          const orgId = org.id
          
          if (!orgPrincipalMap.has(orgId)) {
            orgPrincipalMap.set(orgId, {
              org,
              principals: new Set(),
              principalNames: []
            })
          }
          
          const entry = orgPrincipalMap.get(orgId)!
          if (!entry.principals.has(principal.id)) {
            entry.principals.add(principal.id)
            entry.principalNames.push(principal.name)
          }
        }
      })
      
      // Filter organizations with minimum principal count
      const result = Array.from(orgPrincipalMap.values())
        .filter(entry => entry.principals.size >= minimumCount)
        .map(entry => ({
          id: entry.org.id,
          name: entry.org.name,
          type: entry.org.type,
          principal_count: entry.principals.size,
          principal_names: entry.principalNames
        }))
        .sort((a, b) => b.principal_count - a.principal_count)
      
      setCacheData(cacheKey, result, 300000) // 5 minutes cache
      return result
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch multi-principal organizations'
      setError('organizations', message)
      return null
    } finally {
      loading.organizations = false
    }
  }

  /**
   * Fetch principal-organization relationship analytics
   */
  const fetchPrincipalAnalytics = async (): Promise<any | null> => {
    try {
      loading.analytics = true
      clearError('analytics')
      
      const cacheKey = 'principal_analytics'
      const cached = getCachedData<any>(cacheKey)
      if (cached) return cached
      
      // Fetch organizations with principal relationships
      const { data: principalOrgs, error } = await supabase
        .from('organizations')
        .select('id, name, type, custom_fields, annual_revenue, lead_score')
        .or('custom_fields->>is_principal.eq.true,custom_fields->>is_distributor.eq.true')
      
      if (error) throw new Error(error.message)
      
      // Get contact-principal relationship counts
      const { data: contactPrincipalCounts, error: countError } = await supabase
        .from('contact_principals')
        .select('principal_id, contact_id')
      
      if (countError) throw new Error(countError.message)
      
      // Count relationships per principal
      const principalRelationshipCounts = new Map<string, number>()
      contactPrincipalCounts?.forEach(cp => {
        const count = principalRelationshipCounts.get(cp.principal_id) || 0
        principalRelationshipCounts.set(cp.principal_id, count + 1)
      })
      
      // Analyze principal-distributor relationships
      const analytics = {
        principalDistribution: principalOrgs?.filter(org => 
          (org.custom_fields as any)?.is_principal === true
        ).length || 0,
        distributorDistribution: principalOrgs?.filter(org => 
          (org.custom_fields as any)?.is_distributor === true
        ).length || 0,
        totalPrincipalRevenue: principalOrgs?.filter(org => 
          (org.custom_fields as any)?.is_principal === true
        ).reduce((sum, org) => sum + (org.annual_revenue || 0), 0) || 0,
        averagePrincipalLeadScore: (() => {
          const principals = principalOrgs?.filter(org => 
            (org.custom_fields as any)?.is_principal === true && org.lead_score
          ) || []
          return principals.length > 0 
            ? principals.reduce((sum, org) => sum + (org.lead_score || 0), 0) / principals.length
            : 0
        })(),
        totalContactRelationships: contactPrincipalCounts?.length || 0,
        averageRelationshipsPerPrincipal: principalRelationshipCounts.size > 0 
          ? Array.from(principalRelationshipCounts.values()).reduce((sum, count) => sum + count, 0) / principalRelationshipCounts.size
          : 0,
        topPrincipalsByRelationships: Array.from(principalRelationshipCounts.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([principalId, count]) => {
            const principal = principalOrgs?.find(org => org.id === principalId)
            return {
              id: principalId,
              name: principal?.name || 'Unknown',
              relationship_count: count
            }
          })
      }
      
      setCacheData(cacheKey, analytics, 300000) // 5 minutes cache
      return analytics
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch principal analytics'
      setError('analytics', message)
      return null
    } finally {
      loading.analytics = false
    }
  }
  
  /**
   * Get principals with opportunity potential (for batch opportunity creation)
   * Returns principals with active organizations and contact relationships
   */
  const getPrincipalsForOpportunityCreation = async (options: {
    organizationId?: string
    includeExistingOpportunities?: boolean
    useCache?: boolean
  } = {}): Promise<Array<{
    id: string
    name: string
    organization_type: string | null
    contact_relationships: number
    existing_opportunities?: number
    last_opportunity_date?: string | null
    recommended_for_batch: boolean
  }> | null> => {
    try {
      loading.organizations = true
      clearError('organizations')
      
      const cacheKey = `principals_for_opportunities_${JSON.stringify(options)}`
      
      if (options.useCache !== false) {
        const cached = getCachedData<any[]>(cacheKey)
        if (cached) return cached
      }
      
      // Get all principals
      const { data: principals, error: principalError } = await supabase
        .from('organizations')
        .select('id, name, type, custom_fields')
        .contains('custom_fields', { is_principal: true })
      
      if (principalError) throw new Error(principalError.message)
      
      // Get contact relationships for each principal
      const { data: contactRelationships, error: contactError } = await supabase
        .from('contact_principals')
        .select('principal_id, contact_id, contacts!inner(organization_id)')
      
      if (contactError) throw new Error(contactError.message)
      
      // Optionally get existing opportunities
      let opportunityData: any[] = []
      if (options.includeExistingOpportunities) {
        const { data: opportunities, error: oppError } = await supabase
          .from('opportunities')
          .select('organization_id, created_at')
          .order('created_at', { ascending: false })
        
        if (!oppError) {
          opportunityData = opportunities || []
        }
      }
      
      // Build principal summary
      const result = (principals || []).map(principal => {
        // Count contact relationships
        const relationships = contactRelationships?.filter(cr => cr.principal_id === principal.id) || []
        
        // Filter by organization if specified
        const relevantRelationships = options.organizationId 
          ? relationships.filter(r => (r.contacts as any)?.organization_id === options.organizationId)
          : relationships
        
        // Count existing opportunities if requested
        let existingOpportunities = 0
        let lastOpportunityDate: string | null = null
        
        if (options.includeExistingOpportunities) {
          const orgIds = relationships.map(r => (r.contacts as any)?.organization_id).filter(Boolean)
          const principalOpportunities = opportunityData.filter(opp => orgIds.includes(opp.organization_id))
          existingOpportunities = principalOpportunities.length
          
          if (principalOpportunities.length > 0) {
            lastOpportunityDate = principalOpportunities[0].created_at
          }
        }
        
        // Determine if recommended for batch creation
        const recommendedForBatch = relevantRelationships.length > 0 && 
          (existingOpportunities === 0 || 
           (lastOpportunityDate && new Date(lastOpportunityDate) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))) // No opportunities in last 30 days
        
        return {
          id: principal.id,
          name: principal.name,
          organization_type: principal.type,
          contact_relationships: relevantRelationships.length,
          ...(options.includeExistingOpportunities && {
            existing_opportunities: existingOpportunities,
            last_opportunity_date: lastOpportunityDate
          }),
          recommended_for_batch: recommendedForBatch
        }
      })
      .filter(p => p.contact_relationships > 0) // Only include principals with relationships
      .sort((a, b) => {
        // Sort by recommendation, then by relationship count
        if (a.recommended_for_batch !== b.recommended_for_batch) {
          return a.recommended_for_batch ? -1 : 1
        }
        return b.contact_relationships - a.contact_relationships
      })
      
      setCacheData(cacheKey, result, 300000) // 5 minutes cache
      return result
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get principals for opportunity creation'
      setError('organizations', message)
      return null
    } finally {
      loading.organizations = false
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
      const errors: Array<{ id: string; error: string }> = []
      
      for (const orgId of operation.organizationIds) {
        try {
          switch (operation.type) {
            case 'update_status':
              if (operation.data?.status) {
                await updateOrganization(orgId, { status: operation.data.status })
                processedCount++
              }
              break
              
            case 'delete':
              await deleteOrganization(orgId)
              processedCount++
              break
              
            case 'add_tags':
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
            id: orgId,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
      
      return {
        operation,
        success: errorCount === 0,
        total: operation.organizationIds.length,
        successful: processedCount,
        failed: errorCount,
        errors
      }
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to perform bulk operation'
      setError('bulkOperations', message)
      return {
        operation,
        success: false,
        total: operation.organizationIds.length,
        successful: 0,
        failed: operation.organizationIds.length,
        errors: operation.organizationIds.map(id => ({ id: id, error: message }))
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
    
    // Enhanced form redesign computed properties
    priorityOptions,
    foodBeverageSegments,
    distributorOrganizations,
    principalOrganizations,
    getOrganizationsForPrincipals,
    principalRelatedOrganizations,
    
    // Core CRUD operations
    fetchOrganizations,
    fetchOrganization,
    fetchOrganizationsByPrincipal,
    createOrganization,
    createOrganizationWithContacts,
    createOrganizationWithEnhancedForm,
    updateOrganization,
    updateOrganizationWithContacts,
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
    fetchPrincipalAnalytics,
    
    // Principal-specific methods for opportunity management
    fetchAvailablePrincipals,
    fetchMultiPrincipalOrganizations,
    getPrincipalsForOpportunityCreation,
    
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
    clearCache,
    
    // Enhanced helper methods - Stage 4.1
    convertPriorityLetterToScore,
    convertScoreToPriorityLetter,
    getAutoStatus,
    createContactRelationships
  }
})