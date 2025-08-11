/**
 * Integration Tests - Principal Activity API with SQLite
 * 
 * Tests actual SQL queries and database operations using SQLite in-memory database
 * that mirrors the PostgreSQL production schema
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { testDb, testUtils } from '../setup/integration-setup'
import type { PrincipalActivitySummary, PrincipalFilters, PrincipalSortConfig } from '@/types/principal'

// SQLite-based service that mimics production Supabase queries
class SQLitePrincipalActivityService {
  
  async getPrincipalSummaries(
    filters: PrincipalFilters = {},
    sort: PrincipalSortConfig = { field: 'engagement_score', order: 'desc' },
    pagination = { page: 1, limit: 20 }
  ) {
    try {
      let query = 'SELECT * FROM principal_activity_summary WHERE 1=1'
      const params: any[] = []
      
      // Apply filters
      if (filters.search) {
        query += ` AND (principal_name LIKE ? OR primary_contact_name LIKE ?)`
        params.push(`%${filters.search}%`, `%${filters.search}%`)
      }
      
      if (filters.activity_status && filters.activity_status.length > 0) {
        const placeholders = filters.activity_status.map(() => '?').join(',')
        query += ` AND activity_status IN (${placeholders})`
        params.push(...filters.activity_status)
      }
      
      if (filters.engagement_score_range) {
        if (filters.engagement_score_range.min !== undefined) {
          query += ` AND engagement_score >= ?`
          params.push(filters.engagement_score_range.min)
        }
        if (filters.engagement_score_range.max !== undefined) {
          query += ` AND engagement_score <= ?`
          params.push(filters.engagement_score_range.max)
        }
      }
      
      if (filters.has_opportunities !== undefined) {
        if (filters.has_opportunities) {
          query += ` AND total_opportunities > 0`
        } else {
          query += ` AND total_opportunities = 0`
        }
      }
      
      // Apply sorting
      const sortField = sort.field || 'engagement_score'
      const sortOrder = sort.order === 'asc' ? 'ASC' : 'DESC'
      query += ` ORDER BY ${sortField} ${sortOrder}`
      
      // Apply pagination
      const offset = (pagination.page - 1) * pagination.limit
      query += ` LIMIT ? OFFSET ?`
      params.push(pagination.limit, offset)
      
      const data = testDb.prepare(query).all(...params) as PrincipalActivitySummary[]
      
      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM principal_activity_summary WHERE 1=1'
      const countParams: any[] = []
      
      if (filters.search) {
        countQuery += ` AND (principal_name LIKE ? OR primary_contact_name LIKE ?)`
        countParams.push(`%${filters.search}%`, `%${filters.search}%`)
      }
      
      if (filters.activity_status && filters.activity_status.length > 0) {
        const placeholders = filters.activity_status.map(() => '?').join(',')
        countQuery += ` AND activity_status IN (${placeholders})`
        countParams.push(...filters.activity_status)
      }
      
      const { total } = testDb.prepare(countQuery).get(...countParams) as { total: number }
      
      return {
        success: true,
        data: {
          data,
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total,
            total_pages: Math.ceil(total / pagination.limit),
            has_next: pagination.page * pagination.limit < total,
            has_previous: pagination.page > 1
          },
          filters,
          sort,
          analytics_summary: this.calculateAnalytics(data)
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      }
    }
  }
  
  async getPrincipalDashboard(principalId: string) {
    try {
      const summary = testDb.prepare(
        'SELECT * FROM principal_activity_summary WHERE principal_id = ?'
      ).get(principalId) as PrincipalActivitySummary
      
      if (!summary) {
        return {
          success: false,
          error: 'Principal not found',
          data: null
        }
      }
      
      // Get related data
      const distributorRelationships = testDb.prepare(`
        SELECT p.id as principal_id, p.name as distributor_name, 'AUTHORIZED' as relationship_type,
               'ACTIVE' as status, p.created_at as established_date, 4.5 as performance_rating
        FROM principals p 
        WHERE p.organization_id = ? AND p.id != ?
      `).all(summary.principal_id, summary.principal_id)
      
      const productPerformance = testDb.prepare(`
        SELECT pr.id as product_id, pr.name as product_name, 
               COUNT(o.id) as sales_count, 0 as revenue_generated,
               4.2 as avg_rating, MAX(o.created_at) as last_sale_date
        FROM products pr
        LEFT JOIN opportunities o ON o.product_id = pr.id AND o.principal_id = ?
        GROUP BY pr.id, pr.name
      `).all(summary.principal_id)
      
      const recentTimeline = testDb.prepare(`
        SELECT principal_id, created_at as activity_date, 'OPPORTUNITY' as activity_type,
               'Opportunity ' || name || ' created' as activity_description,
               id as related_entity_id, 'system' as created_by
        FROM opportunities 
        WHERE principal_id = ?
        ORDER BY created_at DESC
        LIMIT 10
      `).all(summary.principal_id)
      
      return {
        success: true,
        data: {
          summary,
          distributor_relationships: distributorRelationships,
          product_performance: productPerformance,
          recent_timeline: recentTimeline,
          analytics: this.calculateAnalytics([summary]),
          last_updated: new Date().toISOString()
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      }
    }
  }
  
  private calculateAnalytics(principals: PrincipalActivitySummary[]) {
    const active = principals.filter(p => p.activity_status === 'ACTIVE')
    const totalInteractions = principals.reduce((sum, p) => sum + p.total_interactions, 0)
    const totalOpportunities = principals.reduce((sum, p) => sum + p.total_opportunities, 0)
    const avgEngagementScore = principals.length > 0 
      ? principals.reduce((sum, p) => sum + p.engagement_score, 0) / principals.length 
      : 0
    
    return {
      total_count: principals.length,
      active_count: active.length,
      avg_engagement_score: Math.round(avgEngagementScore),
      total_interactions: totalInteractions,
      total_opportunities: totalOpportunities
    }
  }
}

describe('Principal Activity API - SQLite Integration Tests', () => {
  let sqliteService: SQLitePrincipalActivityService
  
  beforeEach(() => {
    // Reset database to clean state
    testUtils.resetDatabase()
    sqliteService = new SQLitePrincipalActivityService()
    
    // Verify test data exists
    const stats = testUtils.getStats()
    expect(stats.principals).toBeGreaterThan(0)
    expect(stats.organizations).toBeGreaterThan(0)
  })

  describe('Database Query Validation', () => {
    it('should execute principal summaries query successfully', async () => {
      const result = await sqliteService.getPrincipalSummaries()
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.data).toBeInstanceOf(Array)
      expect(result.data!.data.length).toBeGreaterThan(0)
      
      // Validate data structure matches production
      const firstRecord = result.data!.data[0]
      expect(firstRecord).toHaveProperty('principal_id')
      expect(firstRecord).toHaveProperty('principal_name')
      expect(firstRecord).toHaveProperty('engagement_score')
      expect(firstRecord).toHaveProperty('activity_status')
    })
    
    it('should handle search filters correctly', async () => {
      const searchResult = await sqliteService.getPrincipalSummaries({
        search: 'Acme'
      })
      
      expect(searchResult.success).toBe(true)
      expect(searchResult.data!.data).toBeInstanceOf(Array)
      
      // Should find Acme Corporation
      const acmeResults = searchResult.data!.data.filter(p => 
        p.principal_name.includes('Acme')
      )
      expect(acmeResults.length).toBeGreaterThan(0)
    })
    
    it('should handle activity status filters', async () => {
      const activeResult = await sqliteService.getPrincipalSummaries({
        activity_status: ['ACTIVE']
      })
      
      expect(activeResult.success).toBe(true)
      expect(activeResult.data!.data.every(p => p.activity_status === 'ACTIVE')).toBe(true)
      
      const inactiveResult = await sqliteService.getPrincipalSummaries({
        activity_status: ['INACTIVE']
      })
      
      expect(inactiveResult.success).toBe(true)
      expect(inactiveResult.data!.data.every(p => p.activity_status === 'INACTIVE')).toBe(true)
    })
    
    it('should handle engagement score range filters', async () => {
      const highEngagementResult = await sqliteService.getPrincipalSummaries({
        engagement_score_range: { min: 80, max: 100 }
      })
      
      expect(highEngagementResult.success).toBe(true)
      expect(highEngagementResult.data!.data.every(p => 
        p.engagement_score >= 80 && p.engagement_score <= 100
      )).toBe(true)
      
      const lowEngagementResult = await sqliteService.getPrincipalSummaries({
        engagement_score_range: { min: 0, max: 50 }
      })
      
      expect(lowEngagementResult.success).toBe(true)
      expect(lowEngagementResult.data!.data.every(p => 
        p.engagement_score >= 0 && p.engagement_score <= 50
      )).toBe(true)
    })
    
    it('should handle opportunity filters', async () => {
      const withOpportunities = await sqliteService.getPrincipalSummaries({
        has_opportunities: true
      })
      
      expect(withOpportunities.success).toBe(true)
      expect(withOpportunities.data!.data.every(p => p.total_opportunities > 0)).toBe(true)
      
      const withoutOpportunities = await sqliteService.getPrincipalSummaries({
        has_opportunities: false
      })
      
      expect(withoutOpportunities.success).toBe(true)
      expect(withoutOpportunities.data!.data.every(p => p.total_opportunities === 0)).toBe(true)
    })
  })

  describe('Sorting and Pagination', () => {
    it('should sort by engagement score descending', async () => {
      const result = await sqliteService.getPrincipalSummaries({}, {
        field: 'engagement_score',
        order: 'desc'
      })
      
      expect(result.success).toBe(true)
      const scores = result.data!.data.map(p => p.engagement_score)
      
      // Verify descending order
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeLessThanOrEqual(scores[i - 1])
      }
    })
    
    it('should sort by principal name ascending', async () => {
      const result = await sqliteService.getPrincipalSummaries({}, {
        field: 'principal_name',
        order: 'asc'
      })
      
      expect(result.success).toBe(true)
      const names = result.data!.data.map(p => p.principal_name)
      
      // Verify ascending order
      for (let i = 1; i < names.length; i++) {
        expect(names[i] >= names[i - 1]).toBe(true)
      }
    })
    
    it('should handle pagination correctly', async () => {
      // Get first page
      const page1 = await sqliteService.getPrincipalSummaries({}, {}, {
        page: 1,
        limit: 2
      })
      
      expect(page1.success).toBe(true)
      expect(page1.data!.data.length).toBeLessThanOrEqual(2)
      expect(page1.data!.pagination.page).toBe(1)
      expect(page1.data!.pagination.limit).toBe(2)
      
      // Get second page if there are enough records
      if (page1.data!.pagination.has_next) {
        const page2 = await sqliteService.getPrincipalSummaries({}, {}, {
          page: 2,
          limit: 2
        })
        
        expect(page2.success).toBe(true)
        expect(page2.data!.pagination.page).toBe(2)
        
        // Ensure different records
        const page1Ids = page1.data!.data.map(p => p.principal_id)
        const page2Ids = page2.data!.data.map(p => p.principal_id)
        const overlap = page1Ids.filter(id => page2Ids.includes(id))
        expect(overlap.length).toBe(0)
      }
    })
  })

  describe('Dashboard Data Queries', () => {
    it('should retrieve principal dashboard successfully', async () => {
      const result = await sqliteService.getPrincipalDashboard('test-principal-1')
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.summary).toBeDefined()
      expect(result.data!.summary.principal_id).toBe('test-principal-1')
      expect(result.data!.distributor_relationships).toBeInstanceOf(Array)
      expect(result.data!.product_performance).toBeInstanceOf(Array)
      expect(result.data!.recent_timeline).toBeInstanceOf(Array)
      expect(result.data!.analytics).toBeDefined()
    })
    
    it('should handle non-existent principal gracefully', async () => {
      const result = await sqliteService.getPrincipalDashboard('non-existent-id')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Principal not found')
      expect(result.data).toBe(null)
    })
  })

  describe('Analytics Calculations', () => {
    it('should calculate analytics correctly', async () => {
      const result = await sqliteService.getPrincipalSummaries()
      
      expect(result.success).toBe(true)
      const analytics = result.data!.analytics_summary
      
      expect(analytics.total_count).toBeGreaterThan(0)
      expect(analytics.active_count).toBeGreaterThanOrEqual(0)
      expect(analytics.avg_engagement_score).toBeGreaterThanOrEqual(0)
      expect(analytics.avg_engagement_score).toBeLessThanOrEqual(100)
      expect(analytics.total_interactions).toBeGreaterThanOrEqual(0)
      expect(analytics.total_opportunities).toBeGreaterThanOrEqual(0)
      
      // Validate calculations
      const principals = result.data!.data
      const expectedTotal = principals.length
      const expectedActive = principals.filter(p => p.activity_status === 'ACTIVE').length
      const expectedAvgScore = principals.length > 0 
        ? Math.round(principals.reduce((sum, p) => sum + p.engagement_score, 0) / principals.length)
        : 0
      
      expect(analytics.total_count).toBe(expectedTotal)
      expect(analytics.active_count).toBe(expectedActive)
      expect(analytics.avg_engagement_score).toBe(expectedAvgScore)
    })
  })

  describe('Complex Query Scenarios', () => {
    it('should handle multiple filters combined', async () => {
      const result = await sqliteService.getPrincipalSummaries({
        search: 'Corp',
        activity_status: ['ACTIVE'],
        engagement_score_range: { min: 70 },
        has_opportunities: true
      })
      
      expect(result.success).toBe(true)
      
      // Validate all filters applied
      result.data!.data.forEach(principal => {
        expect(principal.principal_name.toLowerCase()).toContain('corp')
        expect(principal.activity_status).toBe('ACTIVE')
        expect(principal.engagement_score).toBeGreaterThanOrEqual(70)
        expect(principal.total_opportunities).toBeGreaterThan(0)
      })
    })
    
    it('should handle edge case with no results', async () => {
      const result = await sqliteService.getPrincipalSummaries({
        search: 'NonExistentCompany',
        activity_status: ['ACTIVE']
      })
      
      expect(result.success).toBe(true)
      expect(result.data!.data).toHaveLength(0)
      expect(result.data!.pagination.total).toBe(0)
      expect(result.data!.pagination.has_next).toBe(false)
      expect(result.data!.pagination.has_previous).toBe(false)
    })
  })

  describe('Database Performance', () => {
    it('should execute queries within performance thresholds', async () => {
      const startTime = Date.now()
      
      const result = await sqliteService.getPrincipalSummaries({
        search: 'test',
        activity_status: ['ACTIVE', 'INACTIVE'],
        engagement_score_range: { min: 0, max: 100 }
      })
      
      const queryTime = Date.now() - startTime
      
      expect(result.success).toBe(true)
      expect(queryTime).toBeLessThan(100) // Should be very fast with SQLite in-memory
      
      console.log(`Query execution time: ${queryTime}ms`)
    })
    
    it('should handle concurrent queries efficiently', async () => {
      const startTime = Date.now()
      
      // Execute multiple queries concurrently
      const promises = [
        sqliteService.getPrincipalSummaries({ activity_status: ['ACTIVE'] }),
        sqliteService.getPrincipalSummaries({ engagement_score_range: { min: 50 } }),
        sqliteService.getPrincipalDashboard('test-principal-1'),
        sqliteService.getPrincipalSummaries({ has_opportunities: true })
      ]
      
      const results = await Promise.all(promises)
      const totalTime = Date.now() - startTime
      
      // All queries should succeed
      results.forEach(result => {
        expect(result.success).toBe(true)
      })
      
      expect(totalTime).toBeLessThan(200) // Concurrent execution should be fast
      console.log(`Concurrent query time: ${totalTime}ms`)
    })
  })
})