/**
 * =============================================================================
 * PRINCIPAL ACTIVITY API SERVICE - COMPREHENSIVE TEST SUITE
 * =============================================================================
 * 
 * Complete test coverage for Principal Activity API Service including:
 * - Cache management functionality
 * - Performance monitoring
 * - Data fetching operations
 * - Error handling scenarios
 * - Batch operations 
 * - Filtering and search
 * - Analytics calculations
 * - Compatibility methods
 */

import { principalActivityApi } from '@/services/principalActivityApi'
import type {
  PrincipalActivitySummary,
  PrincipalDashboardData,
  PrincipalFilters,
  PrincipalListResponse,
  PrincipalSortConfig
} from '@/types/principal'
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

// Mock the supabase import with proper method chaining
vi.mock('@/lib/supabase', () => {
  // Global mock state to track configured responses
  let mockResponseQueue: any[] = []
  let mockErrorQueue: any[] = []
  let callHistory: { method: string; args: any[] }[] = []

  // Helper to get next configured response
  const getNextMockResponse = () => {
    if (mockErrorQueue.length > 0) {
      const error = mockErrorQueue.shift()
      return Promise.reject(error)
    }
    if (mockResponseQueue.length > 0) {
      return Promise.resolve(mockResponseQueue.shift())
    }
    // Default response if no mock configured
    return Promise.resolve({ data: [], error: null, count: 0 })
  }

  // Helper to record method calls for verification
  const recordCall = (method: string, args: any[] = []) => {
    callHistory.push({ method, args })
  }

  const createQueryChain = () => {
    const queryChain: any = {
      // Make the query chain thenable to handle await - this is where actual execution happens
      then: (resolve: any, reject?: any) => {
        const mockResponse = getNextMockResponse()
        if (mockResponse instanceof Promise) {
          return mockResponse.then(resolve).catch(reject || (() => {}))
        }
        return Promise.resolve(mockResponse).then(resolve)
      },
      // Also implement catch for proper promise handling
      catch: (reject: any) => {
        return getNextMockResponse().catch(reject)
      }
    }

    // All methods return the chain for fluent interface and record calls
    const methods = [
      'select', 'eq', 'in', 'or', 'gt', 'gte', 'lt', 'lte',
      'order', 'range', 'single', 'limit'
    ]

    methods.forEach(method => {
      queryChain[method] = vi.fn((...args: any[]) => {
        recordCall(method, args)
        return queryChain
      })
    })

    return queryChain
  }

  // Create the main supabase mock
  const mockSupabase = {
    from: vi.fn((table: string) => {
      recordCall('from', [table])
      return createQueryChain()
    })
  }

  // Add dynamic properties to expose query methods for test configuration
  let currentQueryChain: any = null
  
  // Override from to capture the current query chain
  const originalFrom = mockSupabase.from
  mockSupabase.from = vi.fn((table: string) => {
    recordCall('from', [table])
    currentQueryChain = createQueryChain()
    return currentQueryChain
  })

  // Expose query chain methods for test access with proper mock functions
  Object.defineProperties(mockSupabase, {
    select: {
      get() {
        const mockFn = vi.fn()
        // Connect mockResolvedValueOnce to the mock response queue
        mockFn.mockResolvedValueOnce = (response: any) => {
          mockResponseQueue.push(response)
          return mockFn
        }
        mockFn.mockRejectedValueOnce = (error: any) => {
          mockErrorQueue.push(error)
          return mockFn
        }
        mockFn.mockImplementation = (impl: any) => {
          // For custom implementations like slow queries
          const result = impl()
          if (result?.then) {
            mockResponseQueue.push(result)
          }
          return mockFn
        }
        return mockFn
      }
    },
    single: {
      get() {
        const mockFn = vi.fn()
        mockFn.mockResolvedValueOnce = (response: any) => {
          mockResponseQueue.push(response)
          return mockFn
        }
        mockFn.mockRejectedValueOnce = (error: any) => {
          mockErrorQueue.push(error)
          return mockFn
        }
        return mockFn
      }
    },
    limit: {
      get() {
        const mockFn = vi.fn()
        mockFn.mockResolvedValueOnce = (response: any) => {
          mockResponseQueue.push(response)
          return mockFn
        }
        return mockFn
      }
    },
    // Other query methods that tests might call - expose from the most recent query chain
    eq: { get() { return currentQueryChain?.eq || vi.fn() } },
    in: { get() { return currentQueryChain?.in || vi.fn() } },
    or: { get() { return currentQueryChain?.or || vi.fn() } },
    gte: { get() { return currentQueryChain?.gte || vi.fn() } },
    lte: { get() { return currentQueryChain?.lte || vi.fn() } },
    order: { get() { return currentQueryChain?.order || vi.fn() } },
    range: { get() { return currentQueryChain?.range || vi.fn() } },
    
    // Expose internal state for test utilities
    __mockState: {
      get responseQueue() { return mockResponseQueue },
      get errorQueue() { return mockErrorQueue },
      get callHistory() { return callHistory },
      clearQueue() { 
        mockResponseQueue = []
        mockErrorQueue = []
      },
      clearHistory() { 
        callHistory = []
      },
      reset() {
        mockResponseQueue = []
        mockErrorQueue = []
        callHistory = []
      }
    }
  })

  return {
    supabase: mockSupabase
  }
})

// Test data fixtures
const mockPrincipalSummary: PrincipalActivitySummary = {
  principal_id: 'test-principal-1',
  principal_name: 'Test Principal Organization',
  principal_status: 'ACTIVE',
  organization_type: 'CORPORATE',
  industry: 'Technology',
  organization_size: 'MEDIUM',
  is_active: true,
  lead_score: 85,
  contact_count: 3,
  active_contacts: 2,
  primary_contact_name: 'John Doe',
  primary_contact_email: 'john@test.com',
  last_contact_update: '2024-01-15T10:00:00Z',
  total_interactions: 15,
  interactions_last_30_days: 5,
  interactions_last_90_days: 12,
  last_interaction_date: '2024-01-14T15:30:00Z',
  last_interaction_type: 'EMAIL',
  next_follow_up_date: '2024-01-20T09:00:00Z',
  avg_interaction_rating: 4.2,
  positive_interactions: 12,
  follow_ups_required: 2,
  total_opportunities: 4,
  active_opportunities: 2,
  won_opportunities: 1,
  opportunities_last_30_days: 1,
  latest_opportunity_stage: 'PROPOSAL',
  latest_opportunity_date: '2024-01-10T14:00:00Z',
  avg_probability_percent: 65,
  highest_value_opportunity: 'Big Tech Deal',
  product_count: 3,
  active_product_count: 2,
  product_categories: ['SOFTWARE', 'SERVICES'],
  primary_product_category: 'SOFTWARE',
  is_principal: true,
  is_distributor: false,
  last_activity_date: '2024-01-14T15:30:00Z',
  activity_status: 'ACTIVE',
  engagement_score: 87,
  principal_created_at: '2023-06-01T10:00:00Z',
  principal_updated_at: '2024-01-14T15:30:00Z',
  summary_generated_at: '2024-01-15T12:00:00Z'
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockPrincipalListResponse: PrincipalListResponse = {
  data: [mockPrincipalSummary],
  pagination: {
    page: 1,
    limit: 20,
    total: 1,
    total_pages: 1,
    has_next: false,
    has_previous: false
  },
  filters: {},
  sort: { field: 'engagement_score', order: 'desc' },
  analytics_summary: {
    total_count: 1,
    active_count: 1,
    avg_engagement_score: 87,
    total_opportunities: 4,
    total_interactions: 15
  }
}

describe('Principal Activity API Service', () => {
  let consoleWarnSpy: Mock
  let consoleErrorSpy: Mock
  let mockSupabase: any

  beforeEach(async () => {
    vi.clearAllMocks()
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { })
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

    // Get mocked supabase object
    const { supabase } = await import('@/lib/supabase')
    mockSupabase = supabase

    // Clear mock state for each test
    if (mockSupabase.__mockState) {
      mockSupabase.__mockState.reset()
    }

    // Also clear Vitest mock call counts
    if (mockSupabase.from && typeof mockSupabase.from.mockClear === 'function') {
      mockSupabase.from.mockClear()
    }
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  // ============================
  // CACHE MANAGEMENT TESTS
  // ============================

  describe('Cache Management', () => {
    it('should cache successful API responses', async () => {
      // Setup the final select call to resolve with data
      mockSupabase.select.mockResolvedValueOnce({
        data: [mockPrincipalSummary],
        error: null,
        count: 1
      })

      // First call
      const response1 = await principalActivityApi.getPrincipalSummaries({})
      expect(response1.success).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledTimes(1)

      // Reset the mock call count
      vi.clearAllMocks()

      // Second call should use cache (no new API call)
      const response2 = await principalActivityApi.getPrincipalSummaries({})
      expect(response2.success).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledTimes(0) // Should not call API again
    })

    it('should invalidate cache after TTL expires', async () => {
      vi.useFakeTimers()

      // First call
      mockSupabase.select.mockResolvedValueOnce({
        data: [mockPrincipalSummary],
        error: null,
        count: 1
      })

      const response1 = await principalActivityApi.getPrincipalSummaries({})
      expect(response1.success).toBe(true)

      // Fast-forward time beyond cache TTL (5 minutes + 1 second)
      vi.advanceTimersByTime(300000 + 1000)

      mockSupabase.select.mockResolvedValueOnce({
        data: [mockPrincipalSummary],
        error: null,
        count: 1
      })

      // Second call should fetch fresh data
      const response2 = await principalActivityApi.getPrincipalSummaries({})
      expect(response2.success).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledTimes(2)

      vi.useRealTimers()
    })
  })

  // ============================
  // PERFORMANCE MONITORING TESTS
  // ============================

  describe('Performance Monitoring', () => {
    it('should log warning for slow queries', async () => {
      // Mock slow query
      mockSupabase.select.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              data: [mockPrincipalSummary],
              error: null,
              count: 1
            })
          }, 1500) // Exceeds 1000ms threshold
        })
      })

      await principalActivityApi.getPrincipalSummaries({})

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Slow query detected: getPrincipalSummaries')
      )
    })

    it('should handle and log query errors', async () => {
      const testError = new Error('Database connection failed')
      mockSupabase.select.mockRejectedValueOnce(testError)

      const response = await principalActivityApi.getPrincipalSummaries({})

      expect(response.success).toBe(false)
      expect(response.error).toBe('Database connection failed')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Query failed: getPrincipalSummaries'),
        testError
      )
    })
  })

  // ============================
  // DATA FETCHING TESTS
  // ============================

  describe('Principal Summaries', () => {
    it('should fetch principal summaries successfully', async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: [mockPrincipalSummary],
        error: null,
        count: 1
      })

      const response = await principalActivityApi.getPrincipalSummaries({})

      expect(response.success).toBe(true)
      expect(response.data?.data).toHaveLength(1)
      expect(response.data?.data[0]).toEqual(mockPrincipalSummary)
      expect(response.data?.pagination.total).toBe(1)
    })

    it('should handle database errors gracefully', async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: null,
        error: { message: 'Table not found' },
        count: null
      })

      const response = await principalActivityApi.getPrincipalSummaries({})

      expect(response.success).toBe(false)
      expect(response.error).toBe('Table not found')
    })

    it('should handle empty data response', async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: null,
        error: null,
        count: 0
      })

      const response = await principalActivityApi.getPrincipalSummaries({})

      expect(response.success).toBe(false)
      expect(response.error).toBe('No data returned from query')
    })

    it('should apply filters correctly', async () => {
      const filters: PrincipalFilters = {
        search: 'test',
        activity_status: ['ACTIVE'],
        engagement_score_range: { min: 50, max: 100 }
      }

      mockSupabase.select.mockResolvedValueOnce({
        data: [mockPrincipalSummary],
        error: null,
        count: 1
      })

      await principalActivityApi.getPrincipalSummaries(filters)

      expect(mockSupabase.or).toHaveBeenCalledWith(
        'principal_name.ilike.%test%,organization_name.ilike.%test%'
      )
      expect(mockSupabase.in).toHaveBeenCalledWith('activity_status', ['ACTIVE'])
      expect(mockSupabase.gte).toHaveBeenCalledWith('engagement_score', 50)
      expect(mockSupabase.lte).toHaveBeenCalledWith('engagement_score', 100)
    })

    it('should apply sorting correctly', async () => {
      const sort: PrincipalSortConfig = {
        field: 'principal_name',
        order: 'asc'
      }

      mockSupabase.select.mockResolvedValueOnce({
        data: [mockPrincipalSummary],
        error: null,
        count: 1
      })

      await principalActivityApi.getPrincipalSummaries({}, sort)

      expect(mockSupabase.order).toHaveBeenCalledWith('principal_name', { ascending: true })
    })

    it('should apply pagination correctly', async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: [mockPrincipalSummary],
        error: null,
        count: 1
      })

      await principalActivityApi.getPrincipalSummaries({}, {}, { page: 2, limit: 10 })

      expect(mockSupabase.range).toHaveBeenCalledWith(10, 19) // (page-1)*limit to (page*limit-1)
    })
  })

  describe('Dashboard Data', () => {
    it('should fetch principal dashboard successfully', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const mockDashboardData: PrincipalDashboardData = {
        summary: mockPrincipalSummary,
        distributor_relationships: [],
        product_performance: [],
        recent_timeline: [],
        analytics: {
          total_principals: 1,
          active_principals: 1,
          inactive_principals: 0,
          avg_engagement_score: 87,
          avg_lead_score: 85,
          total_interactions: 15,
          total_opportunities: 4,
          total_revenue: 0,
          avg_conversion_rate: 25,
          principals_with_opportunities: 1,
          principals_with_products: 1,
          vip_principals: 0,
          follow_ups_required: 2,
          geographic_distribution: [],
          activity_trends: {
            daily_average: 0.17,
            weekly_average: 1.25,
            monthly_total: 5,
            trend_direction: 'stable'
          },
          top_performing_principals: [],
          engagement_score_distribution: [],
          opportunity_pipeline_health: {
            total_opportunities: 4,
            recent_opportunities: 1,
            avg_conversion_rate: 25,
            health_score: 15.4,
            status: 'fair'
          },
          last_calculated: new Date().toISOString()
        },
        last_updated: new Date().toISOString()
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: mockPrincipalSummary,
        error: null
      })

      const response = await principalActivityApi.getPrincipalDashboard('test-principal-1')

      expect(response.success).toBe(true)
      expect(response.data?.summary).toEqual(mockPrincipalSummary)
      expect(mockSupabase.eq).toHaveBeenCalledWith('principal_id', 'test-principal-1')
    })

    it('should handle dashboard fetch errors', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Principal not found' }
      })

      const response = await principalActivityApi.getPrincipalDashboard('invalid-id')

      expect(response.success).toBe(false)
      expect(response.error).toBe('Principal not found')
    })
  })

  // ============================
  // COMPATIBILITY METHODS TESTS
  // ============================

  describe('Compatibility Methods', () => {
    it('should provide backward compatibility for getPrincipalActivitySummary', async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: [mockPrincipalSummary],
        error: null,
        count: 1
      })

      const response = await principalActivityApi.getPrincipalActivitySummary({})

      expect(response.success).toBe(true)
      expect(response.data).toEqual([mockPrincipalSummary])
    })

    it('should provide mock data for getEngagementScoreBreakdown', async () => {
      const response = await principalActivityApi.getEngagementScoreBreakdown()

      expect(response.success).toBe(true)
      expect(response.data).toHaveLength(5)
      expect(response.data[0]).toHaveProperty('range', '0-20')
      expect(response.data[0]).toHaveProperty('label', 'Low')
    })

    it('should provide mock data for getPrincipalStats', async () => {
      const response = await principalActivityApi.getPrincipalStats()

      expect(response.success).toBe(true)
      expect(response.data).toHaveProperty('followUpsRequired')
      expect(response.data).toHaveProperty('activeThisWeek')
      expect(response.data).toHaveProperty('topPerformers')
    })

    it('should search principals with activity', async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: [mockPrincipalSummary],
        error: null,
        count: 1
      })

      const response = await principalActivityApi.searchPrincipalsWithActivity('test', false)

      expect(response.success).toBe(true)
      expect(response.data).toEqual([mockPrincipalSummary])
      expect(mockSupabase.or).toHaveBeenCalledWith(
        'principal_name.ilike.%test%,organization_name.ilike.%test%'
      )
    })
  })

  // ============================
  // ERROR HANDLING TESTS
  // ============================

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockSupabase.select.mockRejectedValueOnce(new Error('Network timeout'))

      const response = await principalActivityApi.getPrincipalSummaries({})

      expect(response.success).toBe(false)
      expect(response.error).toBe('Network timeout')
    })

    it('should handle unexpected error types', async () => {
      mockSupabase.select.mockRejectedValueOnce('String error')

      const response = await principalActivityApi.getPrincipalSummaries({})

      expect(response.success).toBe(false)
      expect(response.error).toBe('Unexpected error occurred')
    })

    it('should clear errors between calls', async () => {
      // First call fails
      mockSupabase.select.mockRejectedValueOnce(new Error('First error'))
      const response1 = await principalActivityApi.getPrincipalSummaries({})
      expect(response1.success).toBe(false)

      // Second call succeeds
      mockSupabase.select.mockResolvedValueOnce({
        data: [mockPrincipalSummary],
        error: null,
        count: 1
      })
      const response2 = await principalActivityApi.getPrincipalSummaries({})
      expect(response2.success).toBe(true)
    })
  })

  // ============================
  // ANALYTICS TESTS
  // ============================

  describe('Analytics Calculations', () => {
    it('should calculate analytics from principal data', async () => {
      const principals = [mockPrincipalSummary]

      const response = await principalActivityApi.calculateAnalytics(principals)

      expect(response.success).toBe(true)
      expect(response.data?.total_principals).toBe(1)
      expect(response.data?.active_principals).toBe(1)
      expect(response.data?.avg_engagement_score).toBe(87)
      expect(response.data?.total_interactions).toBe(15)
      expect(response.data?.total_opportunities).toBe(4)
    })

    it('should handle empty principal array', async () => {
      const response = await principalActivityApi.calculateAnalytics([])

      expect(response.success).toBe(true)
      expect(response.data?.total_principals).toBe(0)
      expect(response.data?.avg_engagement_score).toBe(0)
    })

    it('should calculate geographic distribution', async () => {
      const principalWithRegion = {
        ...mockPrincipalSummary,
        geographic_region: 'North America'
      }

      const response = await principalActivityApi.calculateAnalytics([principalWithRegion])

      expect(response.success).toBe(true)
      expect(response.data?.geographic_distribution).toHaveLength(1)
      expect(response.data?.geographic_distribution[0].region).toBe('North America')
      expect(response.data?.geographic_distribution[0].count).toBe(1)
    })
  })

  // ============================
  // BATCH OPERATIONS TESTS
  // ============================

  describe('Batch Operations', () => {
    it('should simulate batch update operations', async () => {
      const principalIds = ['test-1', 'test-2']
      const updates = { activity_status: 'INACTIVE' as const }

      const response = await principalActivityApi.batchUpdatePrincipals(principalIds, updates)

      expect(response.success).toBe(true)
      expect(response.data).toBe(true)
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('should handle batch operation errors', async () => {
      // Mock console.log to throw an error for testing
      const originalLog = console.log
      console.log = vi.fn().mockImplementation(() => {
        throw new Error('Batch operation failed')
      })

      const response = await principalActivityApi.batchUpdatePrincipals(['test-1'], {})

      expect(response.success).toBe(false)
      expect(response.error).toBe('Batch operation failed')

      console.log = originalLog
    })
  })

  // ============================
  // RELATIONSHIP DATA TESTS
  // ============================

  describe('Relationship Data', () => {
    it('should fetch distributor relationships', async () => {
      const mockRelationships = [{
        principal_id: 'test-principal-1',
        distributor_id: 'test-distributor-1',
        relationship_type: 'AUTHORIZED_DISTRIBUTOR',
        status: 'ACTIVE',
        established_date: '2023-01-01',
        performance_rating: 4.5
      }]

      mockSupabase.select.mockResolvedValueOnce({
        data: mockRelationships,
        error: null
      })

      const response = await principalActivityApi.getDistributorRelationships(['test-principal-1'])

      expect(response.success).toBe(true)
      expect(response.data).toEqual(mockRelationships)
    })

    it('should fetch product performance data', async () => {
      const mockPerformance = [{
        principal_id: 'test-principal-1',
        product_id: 'test-product-1',
        product_name: 'Test Product',
        sales_count: 10,
        revenue_generated: 50000,
        avg_rating: 4.2,
        last_sale_date: '2024-01-10'
      }]

      mockSupabase.select.mockResolvedValueOnce({
        data: mockPerformance,
        error: null
      })

      const response = await principalActivityApi.getProductPerformance(['test-principal-1'])

      expect(response.success).toBe(true)
      expect(response.data).toEqual(mockPerformance)
    })
  })

  // ============================
  // TIMELINE DATA TESTS
  // ============================

  describe('Timeline Data', () => {
    it('should fetch timeline entries', async () => {
      const mockTimeline = [{
        principal_id: 'test-principal-1',
        activity_date: '2024-01-15T10:00:00Z',
        activity_type: 'INTERACTION',
        activity_description: 'Email sent to client',
        related_entity_id: 'interaction-123',
        created_by: 'user-456'
      }]

      mockSupabase.limit.mockResolvedValueOnce({
        data: mockTimeline,
        error: null
      })

      const response = await principalActivityApi.getPrincipalTimeline(['test-principal-1'], 20)

      expect(response.success).toBe(true)
      expect(response.data).toEqual(mockTimeline)
      expect(mockSupabase.limit).toHaveBeenCalledWith(20)
      expect(mockSupabase.order).toHaveBeenCalledWith('activity_date', { ascending: false })
    })
  })

  // ============================
  // SELECTION OPTIONS TESTS
  // ============================

  describe('Selection Options', () => {
    it('should fetch principal options for forms', async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: [{
          principal_id: 'test-principal-1',
          principal_name: 'Test Principal',
          organization_type: 'CORPORATE',
          engagement_score: 87,
          activity_status: 'ACTIVE',
          contact_count: 3,
          total_opportunities: 4,
          last_activity_date: '2024-01-14T15:30:00Z'
        }],
        error: null
      })

      const response = await principalActivityApi.getPrincipalOptions()

      expect(response.success).toBe(true)
      expect(response.data).toHaveLength(1)
      expect(response.data[0]).toHaveProperty('is_recommended', true) // engagement_score > 70
      expect(mockSupabase.eq).toHaveBeenCalledWith('activity_status', 'ACTIVE')
      expect(mockSupabase.order).toHaveBeenCalledWith('engagement_score', { ascending: false })
    })

    it('should filter options by organization', async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: [],
        error: null
      })

      await principalActivityApi.getPrincipalOptions('org-123')

      expect(mockSupabase.eq).toHaveBeenCalledWith('organization_id', 'org-123')
    })
  })
})