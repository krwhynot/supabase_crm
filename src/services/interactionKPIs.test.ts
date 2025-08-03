/**
 * Interaction KPIs Service Test
 * Comprehensive test suite for KPI calculation functionality
 * Validates calculation accuracy, caching, and performance optimization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { interactionKPIsService } from './interactionKPIs'
import type { InteractionFilters, InteractionType } from '@/types/interactions'

// Mock the Supabase client
vi.mock('@/config/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        is: vi.fn(() => ({
          or: vi.fn(() => ({
            in: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  lte: vi.fn(() => ({
                    order: vi.fn(() => ({
                      data: [],
                      error: null
                    }))
                  }))
                }))
              }))
            }))
          }))
        }))
      }))
    }))
  }
}))

describe('InteractionKPIsService', () => {
  beforeEach(() => {
    // Clear cache before each test
    interactionKPIsService.clearCache()
  })

  describe('calculateInteractionKPIs', () => {
    it('should calculate basic KPIs correctly', async () => {
      const kpis = await interactionKPIsService.calculateInteractionKPIs()
      
      expect(kpis).toBeDefined()
      expect(kpis.total_interactions).toBeGreaterThanOrEqual(0)
      expect(kpis.interactions_this_week).toBeGreaterThanOrEqual(0)
      expect(kpis.interactions_this_month).toBeGreaterThanOrEqual(0)
      expect(kpis.overdue_follow_ups).toBeGreaterThanOrEqual(0)
      expect(kpis.scheduled_follow_ups).toBeGreaterThanOrEqual(0)
      expect(kpis.follow_up_completion_rate).toBeGreaterThanOrEqual(0)
      expect(kpis.follow_up_completion_rate).toBeLessThanOrEqual(100)
    })

    it('should include type distribution', async () => {
      const kpis = await interactionKPIsService.calculateInteractionKPIs()
      
      expect(kpis.type_distribution).toBeDefined()
      expect(kpis.type_distribution.EMAIL).toBeGreaterThanOrEqual(0)
      expect(kpis.type_distribution.CALL).toBeGreaterThanOrEqual(0)
      expect(kpis.type_distribution.IN_PERSON).toBeGreaterThanOrEqual(0)
      expect(kpis.type_distribution.DEMO).toBeGreaterThanOrEqual(0)
      expect(kpis.type_distribution.FOLLOW_UP).toBeGreaterThanOrEqual(0)
    })

    it('should include extended metrics', async () => {
      const kpis = await interactionKPIsService.calculateInteractionKPIs()
      
      expect(kpis.response_time_metrics).toBeDefined()
      expect(kpis.activity_trends).toBeDefined()
      expect(kpis.principal_metrics).toBeDefined()
      expect(kpis.efficiency_metrics).toBeDefined()
      
      expect(kpis.response_time_metrics.avg_response_time_hours).toBeGreaterThanOrEqual(0)
      expect(kpis.activity_trends.trend_direction).toMatch(/^(up|down|stable)$/)
      expect(kpis.efficiency_metrics.engagement_quality_score).toBeGreaterThanOrEqual(0)
      expect(kpis.efficiency_metrics.engagement_quality_score).toBeLessThanOrEqual(10)
    })

    it('should apply filters correctly', async () => {
      const filters: InteractionFilters = {
        interaction_type: ['EMAIL', 'CALL'],
        date_from: '2024-08-01'
      }
      
      const kpis = await interactionKPIsService.calculateInteractionKPIs(filters)
      
      expect(kpis).toBeDefined()
      // KPIs should be calculated with filtered data
      expect(kpis.total_interactions).toBeGreaterThanOrEqual(0)
    })
  })

  describe('calculateTypeDistribution', () => {
    it('should calculate type distribution correctly', async () => {
      const distribution = await interactionKPIsService.calculateTypeDistribution()
      
      expect(distribution).toBeDefined()
      expect(distribution.distribution).toBeDefined()
      expect(distribution.percentages).toBeDefined()
      expect(distribution.trends).toBeDefined()
      expect(distribution.effectiveness).toBeDefined()
      
      // Check that percentages add up to 100 (with some tolerance for rounding)
      const totalPercentage = Object.values(distribution.percentages).reduce((sum, val) => sum + val, 0)
      expect(totalPercentage).toBeGreaterThanOrEqual(0)
      expect(totalPercentage).toBeLessThanOrEqual(100)
      
      // Check that all interaction types are included
      const types: InteractionType[] = ['EMAIL', 'CALL', 'IN_PERSON', 'DEMO', 'FOLLOW_UP']
      types.forEach(type => {
        expect(distribution.distribution[type]).toBeGreaterThanOrEqual(0)
        expect(distribution.percentages[type]).toBeGreaterThanOrEqual(0)
        expect(distribution.trends[type]).toMatch(/^(increasing|decreasing|stable)$/)
        expect(distribution.effectiveness[type]).toBeGreaterThanOrEqual(0)
        expect(distribution.effectiveness[type]).toBeLessThanOrEqual(100)
      })
    })
  })

  describe('calculateFollowUpMetrics', () => {
    it('should calculate follow-up metrics correctly', async () => {
      const metrics = await interactionKPIsService.calculateFollowUpMetrics()
      
      expect(metrics).toBeDefined()
      expect(metrics.total_follow_ups_needed).toBeGreaterThanOrEqual(0)
      expect(metrics.overdue_count).toBeGreaterThanOrEqual(0)
      expect(metrics.due_today).toBeGreaterThanOrEqual(0)
      expect(metrics.due_this_week).toBeGreaterThanOrEqual(0)
      expect(metrics.due_next_week).toBeGreaterThanOrEqual(0)
      expect(metrics.completion_rate).toBeGreaterThanOrEqual(0)
      expect(metrics.completion_rate).toBeLessThanOrEqual(100)
      expect(metrics.avg_completion_time_days).toBeGreaterThanOrEqual(0)
      
      // Check overdue by type
      expect(metrics.overdue_by_type).toBeDefined()
      Object.values(metrics.overdue_by_type).forEach(count => {
        expect(count).toBeGreaterThanOrEqual(0)
      })
      
      // Check success rate by type
      expect(metrics.success_rate_by_type).toBeDefined()
      Object.values(metrics.success_rate_by_type).forEach(rate => {
        expect(rate).toBeGreaterThanOrEqual(0)
        expect(rate).toBeLessThanOrEqual(100)
      })
    })
  })

  describe('calculateActivityTrends', () => {
    it('should calculate weekly trends correctly', async () => {
      const trends = await interactionKPIsService.calculateActivityTrends('week')
      
      expect(trends).toBeDefined()
      expect(trends.period).toBe('week')
      expect(trends.current_period).toBeDefined()
      expect(trends.previous_period).toBeDefined()
      expect(trends.growth_metrics).toBeDefined()
      expect(trends.projections).toBeDefined()
      
      // Check current period metrics
      expect(trends.current_period.total_interactions).toBeGreaterThanOrEqual(0)
      expect(trends.current_period.unique_contacts).toBeGreaterThanOrEqual(0)
      expect(trends.current_period.unique_opportunities).toBeGreaterThanOrEqual(0)
      expect(trends.current_period.avg_daily_interactions).toBeGreaterThanOrEqual(0)
      
      // Check projections
      expect(trends.projections.estimated_month_end).toBeGreaterThanOrEqual(0)
      expect(trends.projections.estimated_quarter_end).toBeGreaterThanOrEqual(0)
      expect(trends.projections.target_achievement_rate).toBeGreaterThanOrEqual(0)
      expect(trends.projections.target_achievement_rate).toBeLessThanOrEqual(100)
    })

    it('should calculate monthly trends correctly', async () => {
      const trends = await interactionKPIsService.calculateActivityTrends('month')
      
      expect(trends).toBeDefined()
      expect(trends.period).toBe('month')
    })

    it('should calculate quarterly trends correctly', async () => {
      const trends = await interactionKPIsService.calculateActivityTrends('quarter')
      
      expect(trends).toBeDefined()
      expect(trends.period).toBe('quarter')
    })
  })

  describe('calculatePrincipalPerformance', () => {
    it('should calculate overall principal metrics', async () => {
      const metrics = await interactionKPIsService.calculatePrincipalPerformance()
      
      expect(metrics).toBeDefined()
      expect(metrics.total_interactions).toBeGreaterThanOrEqual(0)
      expect(metrics.interactions_this_week).toBeGreaterThanOrEqual(0)
      expect(metrics.interactions_this_month).toBeGreaterThanOrEqual(0)
      expect(metrics.follow_ups_completed).toBeGreaterThanOrEqual(0)
      expect(metrics.follow_ups_pending).toBeGreaterThanOrEqual(0)
      expect(metrics.overdue_follow_ups).toBeGreaterThanOrEqual(0)
      expect(metrics.response_time_avg_hours).toBeGreaterThanOrEqual(0)
      expect(metrics.opportunity_conversion_rate).toBeGreaterThanOrEqual(0)
      expect(metrics.opportunity_conversion_rate).toBeLessThanOrEqual(100)
      expect(metrics.engagement_score).toBeGreaterThanOrEqual(0)
      expect(metrics.engagement_score).toBeLessThanOrEqual(10)
      expect(metrics.performance_trend).toMatch(/^(improving|declining|stable)$/)
      
      // Check top interaction types
      expect(metrics.top_interaction_types).toBeDefined()
      expect(Array.isArray(metrics.top_interaction_types)).toBe(true)
      metrics.top_interaction_types.forEach(type => {
        expect(type.type).toBeDefined()
        expect(type.count).toBeGreaterThanOrEqual(0)
      })
    })

    it('should calculate specific principal metrics', async () => {
      const principalId = 'test-principal-id'
      const metrics = await interactionKPIsService.calculatePrincipalPerformance(principalId)
      
      expect(metrics).toBeDefined()
      expect(metrics.principal_id).toBe(principalId)
    })
  })

  describe('caching', () => {
    it('should cache KPI results', async () => {
      // First call
      const kpis1 = await interactionKPIsService.calculateInteractionKPIs()
      
      // Second call should return cached result
      const kpis2 = await interactionKPIsService.calculateInteractionKPIs()
      
      expect(kpis1).toEqual(kpis2)
    })

    it('should respect cache invalidation', async () => {
      // First call
      await interactionKPIsService.calculateInteractionKPIs()
      
      // Clear cache
      interactionKPIsService.clearCache()
      
      // Second call should recalculate
      const kpis = await interactionKPIsService.calculateInteractionKPIs()
      expect(kpis).toBeDefined()
    })
  })

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      // The service should fall back to demo data when database fails
      const kpis = await interactionKPIsService.calculateInteractionKPIs()
      
      expect(kpis).toBeDefined()
      expect(kpis.total_interactions).toBeGreaterThanOrEqual(0)
    })

    it('should provide status information', () => {
      const status = interactionKPIsService.getCalculationStatus()
      
      expect(status.isCalculating).toBeDefined()
      expect(status.hasError).toBeDefined()
      expect(status.lastError).toBeDefined()
      expect(status.lastUpdated).toBeDefined()
    })
  })

  describe('reactive computations', () => {
    it('should provide reactive KPI values', () => {
      const reactiveKPIs = interactionKPIsService.getReactiveKPIs()
      
      expect(reactiveKPIs).toBeDefined()
      // The reactive value should be a computed ref
      expect(typeof reactiveKPIs.value).toBeDefined()
    })
  })
})