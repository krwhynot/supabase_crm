/**
 * Contract Tests - Principal Activity API
 * 
 * Validates that mock responses match production Supabase behavior
 * and that query chains work identically between environments
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { contractValidator, contractTestUtils, SUPABASE_RESPONSE_PATTERNS } from '../setup/contract-setup'
import type { PrincipalActivitySummary } from '@/types/principal'

// Import both mock and real implementations for comparison
import { principalActivityApi } from '@/services/principalActivityApi'

describe('Principal Activity API - Contract Validation', () => {
  
  beforeEach(() => {
    // Ensure clean state for each contract test
    vi.clearAllMocks()
  })

  describe('Mock Client Contract Validation', () => {
    it('should validate Supabase mock client interface', async () => {
      // Import the mocked supabase client
      const { supabase } = await import('@/lib/supabase')
      
      // Validate that mock implements required Supabase interface
      const validationResults = contractTestUtils.validateSupabaseMock(supabase)
      
      validationResults.forEach(result => {
        if (!result.isValid) {
          console.error('Mock validation failed:', result.errors)
          result.differences.forEach(diff => {
            contractTestUtils.logViolation(diff, 'error')
          })
        }
      })
      
      expect(validationResults.every(r => r.isValid)).toBe(true)
    })

    it('should validate query builder method chaining', async () => {
      const { supabase } = await import('@/lib/supabase')
      
      // Test that query builder supports all required methods
      const queryBuilder = supabase.from('principal_activity_summary')
      
      // Test method chaining
      const chain = queryBuilder
        .select('*')
        .eq('principal_status', 'ACTIVE')
        .gte('engagement_score', 70)
        .order('engagement_score', { ascending: false })
        .limit(10)
      
      // Validate chain methods exist and return correct types
      expect(typeof queryBuilder.select).toBe('function')
      expect(typeof queryBuilder.eq).toBe('function')
      expect(typeof queryBuilder.gte).toBe('function')
      expect(typeof queryBuilder.order).toBe('function')
      expect(typeof queryBuilder.limit).toBe('function')
      
      // Validate that methods return query builder for chaining
      expect(chain).toBeDefined()
      expect(typeof chain.then).toBe('function') // Should be thenable
    })
  })

  describe('API Response Structure Validation', () => {
    it('should validate getPrincipalSummaries response structure', async () => {
      const isValid = await contractTestUtils.validateApiResponse(
        () => principalActivityApi.getPrincipalSummaries({}),
        {
          success: expect.any(Boolean),
          data: expect.objectContaining({
            data: expect.any(Array),
            pagination: expect.objectContaining({
              page: expect.any(Number),
              limit: expect.any(Number),
              total: expect.any(Number),
              total_pages: expect.any(Number),
              has_next: expect.any(Boolean),
              has_previous: expect.any(Boolean)
            }),
            filters: expect.any(Object),
            sort: expect.any(Object),
            analytics_summary: expect.objectContaining({
              total_count: expect.any(Number),
              active_count: expect.any(Number),
              avg_engagement_score: expect.any(Number)
            })
          })
          // Note: error field only present in error responses, not success responses
        },
        'getPrincipalSummaries'
      )
      
      expect(isValid).toBe(true)
    })

    it('should validate getPrincipalDashboard response structure', async () => {
      const { MockQueryBuilder } = await import('@/config/supabaseClient')
      
      // Create mock principal data for the single() call
      const mockPrincipal: PrincipalActivitySummary = {
        principal_id: 'test-principal-1',
        principal_name: 'Test Principal Dashboard',
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

      // Set mock data for the single() call in getPrincipalDashboard
      MockQueryBuilder.setMockResponse(mockPrincipal, null, 1)
      
      const isValid = await contractTestUtils.validateApiResponse(
        () => principalActivityApi.getPrincipalDashboard('test-principal-1'),
        {
          success: expect.any(Boolean),
          data: expect.objectContaining({
            summary: expect.any(Object),
            relationships: expect.any(Array),
            product_performance: expect.any(Array),
            recent_timeline: expect.any(Array),
            analytics: expect.objectContaining({
              total_principals: expect.any(Number),
              active_principals: expect.any(Number),
              avg_engagement_score: expect.any(Number)
            }),
            kpi_metrics: expect.any(Object)
          })
          // Note: error field only present in error responses, not success responses
        },
        'getPrincipalDashboard'
      )
      
      // Clear mock response for subsequent tests
      MockQueryBuilder.clearMockResponse()
      
      expect(isValid).toBe(true)
    })

    it('should validate error response structure', async () => {
      // Import the MockQueryBuilder class
      const { MockQueryBuilder } = await import('@/config/supabaseClient')
      
      // Set mock error response using the new static method
      MockQueryBuilder.setMockResponse(null, { 
        message: 'Test error', 
        code: 'TEST_ERROR', 
        details: 'Test details',
        hint: ''
      })
      
      const isValid = await contractTestUtils.validateApiResponse(
        () => principalActivityApi.getPrincipalSummaries({ search: 'error-test-unique' }),
        {
          success: false,
          data: null,
          error: expect.any(String)
        },
        'getPrincipalSummaries_Error'
      )
      
      // Clear mock response for subsequent tests
      MockQueryBuilder.clearMockResponse()
      
      expect(isValid).toBe(true)
    })
  })

  describe('Data Type Contract Validation', () => {
    it('should validate PrincipalActivitySummary data structure', async () => {
      // Import MockQueryBuilder for test setup
      const { MockQueryBuilder } = await import('@/config/supabaseClient')
      
      const mockSummary: PrincipalActivitySummary = {
        principal_id: 'test-principal-1',
        principal_name: 'Test Principal',
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
      
      // Set mock response using static method
      MockQueryBuilder.setMockResponse([mockSummary], null, 1)
      
      const response = await principalActivityApi.getPrincipalSummaries({})
      
      // Clear mock for subsequent tests
      MockQueryBuilder.clearMockResponse()
      
      expect(response.success).toBe(true)
      expect(response.data?.data[0]).toMatchObject({
        principal_id: expect.any(String),
        principal_name: expect.any(String),
        principal_status: expect.stringMatching(/^(ACTIVE|INACTIVE|PENDING|SUSPENDED)$/),
        engagement_score: expect.any(Number),
        is_active: expect.any(Boolean),
        contact_count: expect.any(Number),
        total_opportunities: expect.any(Number)
      })
    })
  })

  describe('Query Parameter Contract Validation', () => {
    it('should validate filter parameter handling', async () => {
      const { MockQueryBuilder } = await import('@/config/supabaseClient')
      
      // Mock successful empty response
      MockQueryBuilder.setMockResponse([], null, 0)
      
      // Test various filter combinations
      const filters = {
        search: 'test query',
        activity_status: ['ACTIVE', 'INACTIVE'],
        engagement_score_range: { min: 50, max: 100 },
        has_opportunities: true,
        last_interaction_days: 30
      }
      
      const response = await principalActivityApi.getPrincipalSummaries(filters)
      
      // Clear mock for subsequent tests
      MockQueryBuilder.clearMockResponse()
      
      // Validate that the API accepts and processes filters without errors
      expect(response.success).toBe(true)
    })

    it('should validate sorting parameter handling', async () => {
      const { MockQueryBuilder } = await import('@/config/supabaseClient')
      
      // Mock successful empty response
      MockQueryBuilder.setMockResponse([], null, 0)
      
      const sortConfig = {
        field: 'engagement_score',
        order: 'desc' as const
      }
      
      const response = await principalActivityApi.getPrincipalSummaries({}, sortConfig)
      
      // Clear mock for subsequent tests
      MockQueryBuilder.clearMockResponse()
      
      expect(response.success).toBe(true)
    })

    it('should validate pagination parameter handling', async () => {
      const { MockQueryBuilder } = await import('@/config/supabaseClient')
      
      // Mock successful empty response
      MockQueryBuilder.setMockResponse([], null, 0)
      
      const pagination = {
        page: 2,
        limit: 15
      }
      
      const response = await principalActivityApi.getPrincipalSummaries({}, {}, pagination)
      
      // Clear mock for subsequent tests
      MockQueryBuilder.clearMockResponse()
      
      expect(response.success).toBe(true)
    })
  })

  describe('Performance Contract Validation', () => {
    it('should validate response time expectations', async () => {
      const { MockQueryBuilder } = await import('@/config/supabaseClient')
      const startTime = Date.now()
      
      // Mock fast response
      MockQueryBuilder.setMockResponse([], null, 0)
      
      const response = await principalActivityApi.getPrincipalSummaries({})
      const responseTime = Date.now() - startTime
      
      // Clear mock for subsequent tests
      MockQueryBuilder.clearMockResponse()
      
      expect(response.success).toBe(true)
      
      // Mock should respond very quickly (under 10ms)
      expect(responseTime).toBeLessThan(10)
      
      // Log if response is slower than expected
      if (responseTime > 5) {
        contractTestUtils.logViolation(
          `Mock response slower than expected: ${responseTime}ms`,
          'warn'
        )
      }
    })

    it('should validate caching behavior contract', async () => {
      const { MockQueryBuilder } = await import('@/config/supabaseClient')
      
      // Mock response for first call
      MockQueryBuilder.setMockResponse([], null, 0)
      
      // First call
      const response1 = await principalActivityApi.getPrincipalSummaries({})
      expect(response1.success).toBe(true)
      
      // Second call should use same mock data
      const response2 = await principalActivityApi.getPrincipalSummaries({})
      expect(response2.success).toBe(true)
      
      // Clear mock for subsequent tests
      MockQueryBuilder.clearMockResponse()
      
      // Validate that caching behavior is consistent
      expect(response1.data).toEqual(response2.data)
    })
  })
})