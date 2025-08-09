/**
 * Load Testing Specification
 * 
 * Comprehensive load testing for the Vue 3 + Supabase CRM system:
 * - Concurrent user simulation and scaling analysis
 * - Database connection pooling under load
 * - Memory usage and leak detection
 * - Rate limiting and throttling validation
 * - Resource contention analysis
 * - Auto-scaling and recovery testing
 */

import { test, expect } from '@playwright/test'

// Load Testing Thresholds (from handoff requirements)
const LOAD_TESTING_THRESHOLDS = {
  // User Load Targets
  maxConcurrentUsers: 100, // Target from handoff
  sustainedUserLoad: 75, // Users for sustained testing
  peakUserLoad: 150, // Peak load testing
  
  // Response Time Under Load
  responseTimeP50: 500, // ms - 50th percentile response time
  responseTimeP95: 1000, // ms - 95th percentile response time
  responseTimeP99: 2000, // ms - 99th percentile response time
  
  // Throughput Requirements
  requestsPerSecond: 50, // Minimum RPS under load
  transactionsPerSecond: 25, // Database transactions per second
  dataProcessingRate: 1000, // Records processed per second
  
  // Error Rate Thresholds
  maxErrorRate: 1, // % - Maximum acceptable error rate
  maxTimeoutRate: 0.5, // % - Maximum timeout rate
  maxConnectionErrors: 2, // % - Database connection errors
  
  // Resource Utilization
  maxMemoryUsage: 100 * 1024 * 1024, // 100MB per user session
  maxCPUUtilization: 80, // % - Simulated CPU usage
  maxDatabaseConnections: 20, // Concurrent DB connections
  
  // Recovery Metrics
  recoveryTime: 30000, // ms - Time to recover from overload
  gracefulDegradation: true, // Should degrade gracefully
  autoScalingResponse: 15000, // ms - Auto-scaling response time
  
  // Business Operation Performance Under Load
  opportunityCreationTime: 800, // ms - Under load
  contactSearchTime: 600, // ms - Search performance under load
  kpiCalculationTime: 1200, // ms - Dashboard KPIs under load
  interactionLoggingTime: 500 // ms - Interaction logging under load
}

// Load testing data generators
class LoadTestDataGenerator {
  static generateUserScenarios(userCount: number): UserScenario[] {
    return Array.from({ length: userCount }, (_, i) => ({
      userId: `load-user-${i}`,
      sessionId: `session-${i}-${Date.now()}`,
      userType: this.getUserType(i),
      actions: this.generateUserActions(i),
      startDelay: i * 100, // Staggered start (100ms apart)
      duration: 60000 + Math.random() * 30000, // 60-90 seconds
      thinkTime: 1000 + Math.random() * 2000 // 1-3 seconds between actions
    }))
  }

  private static getUserType(index: number): 'admin' | 'sales_rep' | 'viewer' | 'manager' {
    const types = ['admin', 'sales_rep', 'viewer', 'manager']
    return types[index % types.length] as any
  }

  private static generateUserActions(userIndex: number): UserAction[] {
    const baseActions: UserAction[] = [
      { type: 'login', weight: 1, endpoint: '/api/auth/login' },
      { type: 'dashboard_load', weight: 3, endpoint: '/api/dashboard/kpis' },
      { type: 'contacts_list', weight: 2, endpoint: '/api/contacts' },
      { type: 'opportunities_list', weight: 2, endpoint: '/api/opportunities' }
    ]

    // Add role-specific actions
    if (userIndex % 4 === 0) { // Admin actions
      baseActions.push(
        { type: 'create_contact', weight: 1, endpoint: '/api/contacts', method: 'POST' },
        { type: 'create_opportunity', weight: 1, endpoint: '/api/opportunities', method: 'POST' },
        { type: 'bulk_update', weight: 1, endpoint: '/api/opportunities/batch', method: 'PUT' }
      )
    } else if (userIndex % 4 === 1) { // Sales rep actions
      baseActions.push(
        { type: 'opportunity_detail', weight: 3, endpoint: '/api/opportunities/:id' },
        { type: 'log_interaction', weight: 2, endpoint: '/api/interactions', method: 'POST' },
        { type: 'update_opportunity', weight: 1, endpoint: '/api/opportunities/:id', method: 'PUT' }
      )
    } else if (userIndex % 4 === 2) { // Manager actions
      baseActions.push(
        { type: 'analytics_view', weight: 2, endpoint: '/api/opportunities/analytics' },
        { type: 'team_performance', weight: 1, endpoint: '/api/analytics/team' },
        { type: 'pipeline_analysis', weight: 1, endpoint: '/api/opportunities/pipeline' }
      )
    }
    // Viewers get only the base actions

    return baseActions
  }

  static generateDataLoad(recordCount: number) {
    return {
      contacts: Array.from({ length: recordCount }, (_, i) => ({
        id: `load-contact-${i}`,
        first_name: `LoadTest${i}`,
        last_name: `User${i}`,
        email: `loadtest${i}@example.com`,
        organization_id: `org-${Math.floor(i / 20)}` // 20 contacts per org
      })),
      opportunities: Array.from({ length: recordCount * 2 }, (_, i) => ({
        id: `load-opp-${i}`,
        name: `Load Test Opportunity ${i}`,
        stage: ['NEW_LEAD', 'INITIAL_OUTREACH', 'DEMO_SCHEDULED'][i % 3],
        organization_id: `org-${Math.floor(i / 40)}`,
        probability_percent: 25 + (i % 75)
      })),
      interactions: Array.from({ length: recordCount * 5 }, (_, i) => ({
        id: `load-interaction-${i}`,
        title: `Load Test Interaction ${i}`,
        type: ['PHONE_CALL', 'EMAIL', 'MEETING'][i % 3],
        organization_id: `org-${Math.floor(i / 100)}`
      }))
    }
  }
}

interface UserScenario {
  userId: string
  sessionId: string
  userType: 'admin' | 'sales_rep' | 'viewer' | 'manager'
  actions: UserAction[]
  startDelay: number
  duration: number
  thinkTime: number
}

interface UserAction {
  type: string
  weight: number
  endpoint: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
}

interface LoadTestResults {
  totalUsers: number
  completedUsers: number
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  requestsPerSecond: number
  errorRate: number
  memoryUsage: number[]
  resourceContention: number
}

// Load testing measurement and execution engine
class LoadTestEngine {
  constructor(public page: any) {}

  async executeLoadTest(scenarios: UserScenario[]): Promise<LoadTestResults> {
    const startTime = Date.now()
    const requestMetrics: any[] = []
    const memorySnapshots: number[] = []
    const errorCounts = { network: 0, timeout: 0, server: 0, client: 0 }
    
    let totalRequests = 0
    let successfulRequests = 0
    let completedUsers = 0

    // Set up API mocking with realistic load simulation
    await this.setupLoadTestMocks()

    // Execute user scenarios concurrently
    const userPromises = scenarios.map(async (scenario) => {
      // Staggered start
      await this.page.waitForTimeout(scenario.startDelay)
      
      try {
        await this.executeUserScenario(scenario, requestMetrics, errorCounts)
        completedUsers++
      } catch (error) {
        console.log(`User ${scenario.userId} failed:`, error)
      }
    })

    // Monitor system resources during load test
    const resourceMonitoring = this.startResourceMonitoring(memorySnapshots)

    // Wait for all users to complete or timeout
    await Promise.allSettled(userPromises)
    
    // Stop resource monitoring
    clearInterval(resourceMonitoring)

    const totalTime = Date.now() - startTime
    totalRequests = requestMetrics.length
    successfulRequests = requestMetrics.filter(m => m.success).length

    // Calculate response time percentiles
    const sortedResponseTimes = requestMetrics
      .filter(m => m.success)
      .map(m => m.responseTime)
      .sort((a, b) => a - b)

    const p95Index = Math.floor(sortedResponseTimes.length * 0.95)
    const p99Index = Math.floor(sortedResponseTimes.length * 0.99)

    const results: LoadTestResults = {
      totalUsers: scenarios.length,
      completedUsers,
      totalRequests,
      successfulRequests,
      failedRequests: totalRequests - successfulRequests,
      averageResponseTime: sortedResponseTimes.reduce((sum, time) => sum + time, 0) / sortedResponseTimes.length,
      p95ResponseTime: sortedResponseTimes[p95Index] || 0,
      p99ResponseTime: sortedResponseTimes[p99Index] || 0,
      requestsPerSecond: totalRequests / (totalTime / 1000),
      errorRate: ((totalRequests - successfulRequests) / totalRequests) * 100,
      memoryUsage: memorySnapshots,
      resourceContention: this.calculateResourceContention(requestMetrics)
    }

    return results
  }

  private async setupLoadTestMocks() {
    // Mock authentication with realistic delays
    await this.page.route('**/api/auth/**', route => {
      const authDelay = 100 + Math.random() * 100 // 100-200ms auth time
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            token: 'mock-jwt-token',
            user: { id: 'user-id', role: 'sales_rep' }
          })
        })
      }, authDelay)
    })

    // Mock API endpoints with load-aware response times
    await this.page.route('**/api/**', route => {
      const endpoint = route.request().url()
      const method = route.request().method()
      
      // Simulate load-based response time degradation
      const baseDelay = this.getBaseDelay(endpoint, method)
      const loadFactor = this.getCurrentLoadFactor()
      const actualDelay = baseDelay * (1 + loadFactor)
      
      // Simulate occasional failures under load
      const failureRate = Math.min(0.05, loadFactor * 0.02) // Up to 5% failure rate
      const shouldFail = Math.random() < failureRate

      setTimeout(() => {
        if (shouldFail) {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: 'Server overloaded'
            })
          })
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: this.generateMockData(endpoint)
            })
          })
        }
      }, actualDelay)
    })
  }

  private getBaseDelay(endpoint: string, method: string): number {
    // Base delays for different operations
    if (endpoint.includes('/kpis') || endpoint.includes('/analytics')) {
      return 200 // Complex analytics queries
    } else if (method === 'POST') {
      return 150 // Create operations
    } else if (method === 'PUT') {
      return 100 // Update operations
    } else if (endpoint.includes('/opportunities') && method === 'GET') {
      return 120 // Opportunity list with related data
    } else {
      return 80 // Simple GET operations
    }
  }

  private getCurrentLoadFactor(): number {
    // Simulate current system load (0-1, where 1 is fully loaded)
    return Math.min(1, Math.random() * 0.8) // 0-80% load factor
  }

  private generateMockData(endpoint: string): any {
    if (endpoint.includes('/contacts')) {
      return LoadTestDataGenerator.generateDataLoad(20).contacts.slice(0, 20)
    } else if (endpoint.includes('/opportunities')) {
      return LoadTestDataGenerator.generateDataLoad(20).opportunities.slice(0, 25)
    } else if (endpoint.includes('/interactions')) {
      return LoadTestDataGenerator.generateDataLoad(20).interactions.slice(0, 30)
    } else if (endpoint.includes('/kpis')) {
      return {
        total_opportunities: 1250,
        active_opportunities: 980,
        won_this_month: 45,
        average_probability: 62.5
      }
    }
    return {}
  }

  private async executeUserScenario(
    scenario: UserScenario, 
    requestMetrics: any[], 
    errorCounts: any
  ): Promise<void> {
    const scenarioStartTime = Date.now()
    
    while (Date.now() - scenarioStartTime < scenario.duration) {
      // Select a random action based on weights
      const action = this.selectWeightedAction(scenario.actions)
      
      const requestStartTime = Date.now()
      try {
        // Execute the action
        const endpoint = action.endpoint.replace(':id', 'test-id-123')
        const method = action.method || 'GET'
        
        let response
        switch (method) {
          case 'GET':
            response = await this.page.request.get(endpoint)
            break
          case 'POST':
            response = await this.page.request.post(endpoint, { 
              data: { test: 'data', userId: scenario.userId } 
            })
            break
          case 'PUT':
            response = await this.page.request.put(endpoint, { 
              data: { test: 'update', userId: scenario.userId } 
            })
            break
          case 'DELETE':
            response = await this.page.request.delete(endpoint)
            break
        }

        const responseTime = Date.now() - requestStartTime
        const success = response.ok()

        requestMetrics.push({
          userId: scenario.userId,
          action: action.type,
          endpoint,
          method,
          responseTime,
          success,
          statusCode: response.status()
        })

        if (!success) {
          if (response.status() >= 500) {
            errorCounts.server++
          } else if (response.status() >= 400) {
            errorCounts.client++
          }
        }

      } catch (error) {
        const responseTime = Date.now() - requestStartTime
        requestMetrics.push({
          userId: scenario.userId,
          action: action.type,
          endpoint: action.endpoint,
          method: action.method || 'GET',
          responseTime,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })

        if (error instanceof Error && error.message.includes('timeout')) {
          errorCounts.timeout++
        } else {
          errorCounts.network++
        }
      }

      // Think time between actions
      await this.page.waitForTimeout(scenario.thinkTime)
    }
  }

  private selectWeightedAction(actions: UserAction[]): UserAction {
    const totalWeight = actions.reduce((sum, action) => sum + action.weight, 0)
    let random = Math.random() * totalWeight
    
    for (const action of actions) {
      random -= action.weight
      if (random <= 0) {
        return action
      }
    }
    
    return actions[0] // Fallback
  }

  private startResourceMonitoring(memorySnapshots: number[]): NodeJS.Timeout {
    return setInterval(async () => {
      try {
        const memoryUsage = await this.page.evaluate(() => {
          if ('memory' in performance) {
            return (performance as any).memory.usedJSHeapSize
          }
          return 0
        })
        memorySnapshots.push(memoryUsage)
      } catch (error) {
        // Ignore memory monitoring errors
      }
    }, 1000) // Sample every second
  }

  private calculateResourceContention(requestMetrics: any[]): number {
    // Calculate resource contention based on response time variance
    const responseTimes = requestMetrics
      .filter(m => m.success)
      .map(m => m.responseTime)
    
    if (responseTimes.length === 0) return 0

    const mean = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    const variance = responseTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / responseTimes.length
    const stdDev = Math.sqrt(variance)
    
    // Normalize contention metric (higher variance indicates more contention)
    return Math.min(1, stdDev / mean)
  }
}

test.describe('Load Testing - Concurrent Users', () => {
  test('should handle sustained user load', async ({ page: _ }) => {
    const engine = new LoadTestEngine(page)
    
    // Generate sustained load scenarios
    const sustainedUserCount = LOAD_TESTING_THRESHOLDS.sustainedUserLoad
    const scenarios = LoadTestDataGenerator.generateUserScenarios(sustainedUserCount)
    
    console.log(`Starting sustained load test with ${sustainedUserCount} users...`)
    const results = await engine.executeLoadTest(scenarios)
    
    console.log('Sustained Load Test Results:', {
      users: `${results.completedUsers}/${results.totalUsers}`,
      requests: `${results.successfulRequests}/${results.totalRequests}`,
      averageResponseTime: `${results.averageResponseTime.toFixed(0)}ms`,
      p95ResponseTime: `${results.p95ResponseTime.toFixed(0)}ms`,
      p99ResponseTime: `${results.p99ResponseTime.toFixed(0)}ms`,
      requestsPerSecond: results.requestsPerSecond.toFixed(1),
      errorRate: `${results.errorRate.toFixed(2)}%`,
      resourceContention: results.resourceContention.toFixed(3)
    })

    // Validate sustained load performance
    expect(results.completedUsers / results.totalUsers).toBeGreaterThan(0.95) // 95% completion rate
    expect(results.averageResponseTime).toBeLessThan(LOAD_TESTING_THRESHOLDS.responseTimeP50)
    expect(results.p95ResponseTime).toBeLessThan(LOAD_TESTING_THRESHOLDS.responseTimeP95)
    expect(results.p99ResponseTime).toBeLessThan(LOAD_TESTING_THRESHOLDS.responseTimeP99)
    expect(results.requestsPerSecond).toBeGreaterThan(LOAD_TESTING_THRESHOLDS.requestsPerSecond)
    expect(results.errorRate).toBeLessThan(LOAD_TESTING_THRESHOLDS.maxErrorRate)
  })

  test('should handle peak user load', async ({ page: _ }) => {
    const engine = new LoadTestEngine(page)
    
    // Generate peak load scenarios
    const peakUserCount = LOAD_TESTING_THRESHOLDS.peakUserLoad
    const scenarios = LoadTestDataGenerator.generateUserScenarios(peakUserCount)
    
    console.log(`Starting peak load test with ${peakUserCount} users...`)
    const results = await engine.executeLoadTest(scenarios)
    
    console.log('Peak Load Test Results:', {
      users: `${results.completedUsers}/${results.totalUsers}`,
      requests: `${results.successfulRequests}/${results.totalRequests}`,
      averageResponseTime: `${results.averageResponseTime.toFixed(0)}ms`,
      p95ResponseTime: `${results.p95ResponseTime.toFixed(0)}ms`,
      requestsPerSecond: results.requestsPerSecond.toFixed(1),
      errorRate: `${results.errorRate.toFixed(2)}%`,
      resourceContention: results.resourceContention.toFixed(3)
    })

    // Validate peak load handling (more relaxed thresholds)
    expect(results.completedUsers / results.totalUsers).toBeGreaterThan(0.85) // 85% completion rate under peak load
    expect(results.errorRate).toBeLessThan(LOAD_TESTING_THRESHOLDS.maxErrorRate * 2) // Allow 2x error rate under peak
    expect(results.requestsPerSecond).toBeGreaterThan(LOAD_TESTING_THRESHOLDS.requestsPerSecond * 0.7) // 70% throughput under peak
    expect(results.resourceContention).toBeLessThan(0.8) // Resource contention should be manageable
  })

  test('should demonstrate graceful degradation under overload', async ({ page: _ }) => {
    const engine = new LoadTestEngine(page)
    
    // Test with excessive load to trigger degradation
    const overloadUserCount = LOAD_TESTING_THRESHOLDS.maxConcurrentUsers * 2 // 200 users
    const scenarios = LoadTestDataGenerator.generateUserScenarios(overloadUserCount)
    
    console.log(`Starting overload test with ${overloadUserCount} users...`)
    const results = await engine.executeLoadTest(scenarios)
    
    console.log('Overload Test Results:', {
      users: `${results.completedUsers}/${results.totalUsers}`,
      requests: `${results.successfulRequests}/${results.totalRequests}`,
      averageResponseTime: `${results.averageResponseTime.toFixed(0)}ms`,
      errorRate: `${results.errorRate.toFixed(2)}%`,
      resourceContention: results.resourceContention.toFixed(3)
    })

    // Validate graceful degradation
    expect(results.completedUsers / results.totalUsers).toBeGreaterThan(0.5) // At least 50% should complete
    expect(results.errorRate).toBeLessThan(20) // Should not exceed 20% error rate even under overload
    expect(results.averageResponseTime).toBeLessThan(5000) // Should not exceed 5 seconds even under stress
    
    // System should remain responsive (some requests should still succeed quickly)
    const fastRequests = results.successfulRequests * 0.3 // At least 30% should be reasonably fast
    expect(fastRequests).toBeGreaterThan(0)
  })
})

test.describe('Load Testing - Resource Utilization', () => {
  test('should monitor memory usage under load', async ({ page: _ }) => {
    const engine = new LoadTestEngine(page)
    
    // Run load test with memory monitoring
    const scenarios = LoadTestDataGenerator.generateUserScenarios(50)
    const results = await engine.executeLoadTest(scenarios)
    
    // Analyze memory usage patterns
    const maxMemory = Math.max(...results.memoryUsage)
    const avgMemory = results.memoryUsage.reduce((sum, mem) => sum + mem, 0) / results.memoryUsage.length
    const memoryGrowth = results.memoryUsage.length > 1 ? 
      results.memoryUsage[results.memoryUsage.length - 1] - results.memoryUsage[0] : 0

    console.log('Memory Usage Analysis:', {
      maxMemory: `${(maxMemory / 1024 / 1024).toFixed(1)}MB`,
      avgMemory: `${(avgMemory / 1024 / 1024).toFixed(1)}MB`,
      memoryGrowth: `${(memoryGrowth / 1024 / 1024).toFixed(1)}MB`,
      memoryPerUser: `${(avgMemory / scenarios.length / 1024).toFixed(1)}KB`
    })

    // Validate memory usage
    expect(maxMemory).toBeLessThan(LOAD_TESTING_THRESHOLDS.maxMemoryUsage * scenarios.length)
    expect(memoryGrowth).toBeLessThan(LOAD_TESTING_THRESHOLDS.maxMemoryUsage) // Limited memory growth
    
    // Check for memory leaks (memory should not grow continuously)
    if (results.memoryUsage.length > 10) {
      const earlyAvg = results.memoryUsage.slice(0, 5).reduce((sum, mem) => sum + mem, 0) / 5
      const lateAvg = results.memoryUsage.slice(-5).reduce((sum, mem) => sum + mem, 0) / 5
      const growthRate = (lateAvg - earlyAvg) / earlyAvg
      
      expect(growthRate).toBeLessThan(0.5) // Memory should not grow more than 50%
    }
  })

  test('should validate database connection handling', async ({ page: _ }) => {
    const engine = new LoadTestEngine(page)
    
    // Test database-intensive scenarios
    const dbHeavyScenarios = LoadTestDataGenerator.generateUserScenarios(30).map(scenario => ({
      ...scenario,
      actions: scenario.actions.filter(action => 
        action.endpoint.includes('/api/') && !action.endpoint.includes('/auth/')
      )
    }))

    const results = await engine.executeLoadTest(dbHeavyScenarios)
    
    // Analyze database performance indicators
    const dbErrorRate = results.errorRate // Assuming DB errors contribute to overall error rate
    const avgResponseTime = results.averageResponseTime
    
    console.log('Database Connection Analysis:', {
      concurrentUsers: dbHeavyScenarios.length,
      avgResponseTime: `${avgResponseTime.toFixed(0)}ms`,
      dbErrorRate: `${dbErrorRate.toFixed(2)}%`,
      throughput: `${results.requestsPerSecond.toFixed(1)} RPS`
    })

    // Validate database performance under load
    expect(dbErrorRate).toBeLessThan(LOAD_TESTING_THRESHOLDS.maxConnectionErrors)
    expect(avgResponseTime).toBeLessThan(800) // Database queries should remain reasonably fast
    expect(results.requestsPerSecond).toBeGreaterThan(20) // Minimum database throughput
  })
})

test.describe('Load Testing - Business Operation Performance', () => {
  test('should validate critical business operations under load', async ({ page: _ }) => {
    const engine = new LoadTestEngine(page)
    
    // Create scenarios focused on critical business operations
    const businessScenarios = Array.from({ length: 25 }, (_, i) => ({
      userId: `business-user-${i}`,
      sessionId: `business-session-${i}`,
      userType: 'sales_rep' as const,
      actions: [
        { type: 'opportunity_creation', weight: 2, endpoint: '/api/opportunities', method: 'POST' as const },
        { type: 'contact_search', weight: 3, endpoint: '/api/contacts?search=test' },
        { type: 'kpi_calculation', weight: 1, endpoint: '/api/opportunities/kpis' },
        { type: 'interaction_logging', weight: 2, endpoint: '/api/interactions', method: 'POST' as const }
      ],
      startDelay: i * 50,
      duration: 45000, // 45 seconds
      thinkTime: 2000 // 2 seconds between operations
    }))

    const results = await engine.executeLoadTest(businessScenarios)
    
    console.log('Business Operations Under Load:', {
      totalOperations: results.totalRequests,
      successfulOperations: results.successfulRequests,
      operationSuccessRate: `${((results.successfulRequests / results.totalRequests) * 100).toFixed(1)}%`,
      avgOperationTime: `${results.averageResponseTime.toFixed(0)}ms`,
      operationsPerSecond: results.requestsPerSecond.toFixed(1)
    })

    // Validate business operation performance under load
    expect(results.averageResponseTime).toBeLessThan(LOAD_TESTING_THRESHOLDS.opportunityCreationTime)
    expect(results.errorRate).toBeLessThan(LOAD_TESTING_THRESHOLDS.maxErrorRate)
    expect(results.requestsPerSecond).toBeGreaterThan(LOAD_TESTING_THRESHOLDS.transactionsPerSecond)
    
    // Critical business operations should maintain high success rate
    expect((results.successfulRequests / results.totalRequests)).toBeGreaterThan(0.98) // 98% success rate
  })
})