/**
 * Opportunity Management Performance Tests
 * 
 * Comprehensive performance benchmarking and load testing:
 * - Page load performance measurement
 * - Form submission performance
 * - Large dataset handling
 * - Memory usage monitoring
 * - Network request optimization
 * - Bundle size impact assessment
 * - Database query performance simulation
 * - User interaction response times
 */

import { expect, test } from '@playwright/test'

// Performance thresholds based on requirements
const PERFORMANCE_THRESHOLDS = {
  pageLoad: 3000, // 3 seconds
  formSubmission: 2000, // 2 seconds
  searchResponse: 1000, // 1 second
  filterResponse: 500, // 0.5 seconds
  largeDatasetLoad: 5000, // 5 seconds for 100+ items
  memoryUsage: 50 * 1024 * 1024, // 50MB maximum
  networkRequests: 10, // Maximum concurrent requests
  firstContentfulPaint: 1500, // 1.5 seconds
  largestContentfulPaint: 2500 // 2.5 seconds
}

// Test data generators for performance testing
class PerformanceTestDataGenerator {
  static generateLargeOpportunityDataset(count: number) {
    return Array.from({ length: count }, (_, i) => ({
      id: `perf-opp-${i}`,
      name: `Performance Test Opportunity ${i}`,
      stage: ['NEW_LEAD', 'INITIAL_OUTREACH', 'DEMO_SCHEDULED'][i % 3],
      probability_percent: 25 + (i % 75),
      expected_close_date: '2025-06-30',
      deal_owner: `Sales Rep ${(i % 10) + 1}`,
      organization_name: `Test Organization ${(i % 20) + 1}`,
      organization_type: 'Enterprise',
      principal_name: `Principal ${(i % 30) + 1}`,
      product_name: `Product ${(i % 15) + 1}`,
      created_at: new Date(Date.now() - (i * 86400000)).toISOString(), // Spread over days
      updated_at: new Date(Date.now() - (i * 3600000)).toISOString() // Spread over hours
    }))
  }

  static generateKPIData() {
    return {
      total_opportunities: 1250,
      active_opportunities: 980,
      average_probability: 62.5,
      won_this_month: 45,
      pipeline_value: 15750000,
      conversion_rate: 23.8,
      stage_distribution: {
        'NEW_LEAD': 156,
        'INITIAL_OUTREACH': 234,
        'SAMPLE_VISIT_OFFERED': 123,
        'AWAITING_RESPONSE': 189,
        'FEEDBACK_LOGGED': 98,
        'DEMO_SCHEDULED': 156,
        'CLOSED_WON': 89
      }
    }
  }

  static generateHeavyFormData() {
    return {
      organization_name: 'Very Long Organization Name That Tests Input Performance With Extended Character Length',
      principals: Array.from({ length: 50 }, (_, i) => ({
        id: `principal-${i}`,
        name: `Principal Name ${i} With Additional Context Information`
      })),
      products: Array.from({ length: 100 }, (_, i) => ({
        id: `product-${i}`,
        name: `Product ${i}`,
        category: `Category ${i % 10}`,
        description: `Detailed product description for performance testing with extended content that simulates real-world data volume ${i}`
      }))
    }
  }
}

// Performance measurement helpers
class PerformanceMeasurement {
  constructor(public page: any) { }

  async measurePageLoad(url: string): Promise<{
    loadTime: number,
    domContentLoaded: number,
    firstContentfulPaint: number,
    largestContentfulPaint: number,
    networkRequests: number
  }> {
    const startTime = Date.now()
    let domContentLoadedTime = 0
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _firstContentfulPaint = 0
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _largestContentfulPaint = 0
    let networkRequestCount = 0

    // Set up performance monitoring
    await this.page.route('**/*', route => {
      networkRequestCount++
      route.continue()
    })

    // Monitor performance metrics
    await this.page.evaluate(() => {
      // Performance observer for paint timing
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              (window as any).fcpTime = entry.startTime
            }
            if (entry.name === 'largest-contentful-paint') {
              (window as any).lcpTime = entry.startTime
            }
          }
        })
        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] })
      }
    })

    // Navigate and measure
    await this.page.goto(url)

    // Wait for DOM content loaded
    await this.page.waitForEvent('domcontentloaded')
    domContentLoadedTime = Date.now() - startTime

    // Wait for network idle
    await this.page.waitForLoadState('networkidle')
    const totalLoadTime = Date.now() - startTime

    // Get paint metrics
    const paintMetrics = await this.page.evaluate(() => ({
      fcp: (window as any).fcpTime || 0,
      lcp: (window as any).lcpTime || 0
    }))

    return {
      loadTime: totalLoadTime,
      domContentLoaded: domContentLoadedTime,
      firstContentfulPaint: paintMetrics.fcp,
      largestContentfulPaint: paintMetrics.lcp,
      networkRequests: networkRequestCount
    }
  }

  async measureFormSubmission(formActions: () => Promise<void>): Promise<{
    fillTime: number,
    submissionTime: number,
    totalTime: number
  }> {
    const startTime = Date.now()

    // Execute form filling actions
    await formActions()
    const fillTime = Date.now() - startTime

    // Measure submission
    const submissionStartTime = Date.now()
    await this.page.click('[data-testid="submit-opportunity-form"]')

    // Wait for submission completion (success or error)
    await this.page.waitForSelector('[data-testid="success-message"], [data-testid="error-message"]')
    const submissionTime = Date.now() - submissionStartTime

    return {
      fillTime,
      submissionTime,
      totalTime: Date.now() - startTime
    }
  }

  async measureMemoryUsage(): Promise<{
    usedHeapSize: number,
    totalHeapSize: number,
    heapSizeLimit: number
  }> {
    return await this.page.evaluate(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        return {
          usedHeapSize: memory.usedJSHeapSize,
          totalHeapSize: memory.totalJSHeapSize,
          heapSizeLimit: memory.jsHeapSizeLimit
        }
      }
      return {
        usedHeapSize: 0,
        totalHeapSize: 0,
        heapSizeLimit: 0
      }
    })
  }

  async measureSearchPerformance(searchTerm: string): Promise<number> {
    const startTime = Date.now()

    await this.page.fill('[name="search"]', searchTerm)
    await this.page.keyboard.press('Enter')

    // Wait for search results to update
    await this.page.waitForSelector('[data-testid="opportunity-row"], [data-testid="no-results"]')

    return Date.now() - startTime
  }

  async measureFilterPerformance(filterValue: string): Promise<number> {
    const startTime = Date.now()

    await this.page.selectOption('[name="stage_filter"]', filterValue)

    // Wait for filter results to update
    await this.page.waitForTimeout(100) // Small delay for UI update
    await this.page.waitForSelector('[data-testid="opportunity-row"], [data-testid="no-results"]')

    return Date.now() - startTime
  }
}

test.describe('Opportunity List - Performance', () => {
  test('should load within performance thresholds', async ({ page: _ }) => {
    const perf = new PerformanceMeasurement(page)

    // Mock normal dataset
    await page.route('**/api/opportunities**', route => {
      const opportunities = PerformanceTestDataGenerator.generateLargeOpportunityDataset(20)
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            opportunities,
            total_count: opportunities.length
          }
        })
      })
    })

    await page.route('**/api/opportunities/kpis', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: PerformanceTestDataGenerator.generateKPIData()
        })
      })
    })

    // Measure page load performance
    const metrics = await perf.measurePageLoad('/opportunities')

    // Validate against thresholds
    expect(metrics.loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad)
    expect(metrics.domContentLoaded).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad / 2)
    expect(metrics.networkRequests).toBeLessThan(PERFORMANCE_THRESHOLDS.networkRequests)

    if (metrics.firstContentfulPaint > 0) {
      expect(metrics.firstContentfulPaint).toBeLessThan(PERFORMANCE_THRESHOLDS.firstContentfulPaint)
    }

    if (metrics.largestContentfulPaint > 0) {
      expect(metrics.largestContentfulPaint).toBeLessThan(PERFORMANCE_THRESHOLDS.largestContentfulPaint)
    }

    console.log('Opportunity List Performance Metrics:', metrics)
  })

  test('should handle large datasets efficiently', async ({ page: _ }) => {
    const perf = new PerformanceMeasurement(page)

    // Mock large dataset (100+ opportunities)
    await page.route('**/api/opportunities**', route => {
      const opportunities = PerformanceTestDataGenerator.generateLargeOpportunityDataset(150)
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            opportunities: opportunities.slice(0, 20), // Paginated response
            total_count: opportunities.length,
            page: 1,
            has_next: true
          }
        })
      })
    })

    await page.route('**/api/opportunities/kpis', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: PerformanceTestDataGenerator.generateKPIData()
        })
      })
    })

    const metrics = await perf.measurePageLoad('/opportunities')

    // Large dataset should still load within acceptable time
    expect(metrics.loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.largeDatasetLoad)

    // Check memory usage after loading large dataset
    const memoryUsage = await perf.measureMemoryUsage()
    if (memoryUsage.usedHeapSize > 0) {
      expect(memoryUsage.usedHeapSize).toBeLessThan(PERFORMANCE_THRESHOLDS.memoryUsage)
    }

    console.log('Large Dataset Performance Metrics:', { metrics, memoryUsage })
  })

  test('should perform search operations efficiently', async ({ page: _ }) => {
    const perf = new PerformanceMeasurement(page)

    // Mock search API with realistic response time
    await page.route('**/api/opportunities**', route => {
      const url = new URL(route.request().url())
      const searchTerm = url.searchParams.get('search')

      let opportunities = PerformanceTestDataGenerator.generateLargeOpportunityDataset(100)

      if (searchTerm) {
        opportunities = opportunities.filter(opp =>
          opp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          opp.organization_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      // Simulate realistic network delay
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              opportunities: opportunities.slice(0, 20),
              total_count: opportunities.length
            }
          })
        })
      }, 50) // 50ms simulated server processing
    })

    await page.goto('/opportunities')
    await page.waitForLoadState('networkidle')

    // Test search performance
    const searchTime = await perf.measureSearchPerformance('Test Corporation')
    expect(searchTime).toBeLessThan(PERFORMANCE_THRESHOLDS.searchResponse)

    // Test multiple searches to ensure consistent performance
    const searchTimes = []
    const searchTerms = ['Enterprise', 'Software', 'Analytics', 'Principal', 'Demo']

    for (const term of searchTerms) {
      const time = await perf.measureSearchPerformance(term)
      searchTimes.push(time)
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.searchResponse)
    }

    const averageSearchTime = searchTimes.reduce((sum, time) => sum + time, 0) / searchTimes.length
    console.log('Search Performance:', { searchTimes, averageSearchTime })
  })

  test('should filter data quickly', async ({ page: _ }) => {
    const perf = new PerformanceMeasurement(page)

    await page.route('**/api/opportunities**', route => {
      const url = new URL(route.request().url())
      const stageFilter = url.searchParams.get('stage')

      let opportunities = PerformanceTestDataGenerator.generateLargeOpportunityDataset(100)

      if (stageFilter) {
        opportunities = opportunities.filter(opp => opp.stage === stageFilter)
      }

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            opportunities: opportunities.slice(0, 20),
            total_count: opportunities.length
          }
        })
      })
    })

    await page.goto('/opportunities')
    await page.waitForLoadState('networkidle')

    // Test filter performance
    const stages = ['NEW_LEAD', 'INITIAL_OUTREACH', 'DEMO_SCHEDULED']
    const filterTimes = []

    for (const stage of stages) {
      const filterTime = await perf.measureFilterPerformance(stage)
      filterTimes.push(filterTime)
      expect(filterTime).toBeLessThan(PERFORMANCE_THRESHOLDS.filterResponse)
    }

    const averageFilterTime = filterTimes.reduce((sum, time) => sum + time, 0) / filterTimes.length
    console.log('Filter Performance:', { filterTimes, averageFilterTime })
  })
})

test.describe('Opportunity Form - Performance', () => {
  test('should load form within performance thresholds', async ({ page: _ }) => {
    const perf = new PerformanceMeasurement(page)

    // Mock form dependencies
    await page.route('**/api/organizations**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { organizations: [{ id: '1', name: 'Test Org' }] }
        })
      })
    })

    await page.route('**/api/principals**', route => {
      const heavyData = PerformanceTestDataGenerator.generateHeavyFormData()
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: heavyData.principals
        })
      })
    })

    await page.route('**/api/products**', route => {
      const heavyData = PerformanceTestDataGenerator.generateHeavyFormData()
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: heavyData.products
        })
      })
    })

    const metrics = await perf.measurePageLoad('/opportunities/new')

    expect(metrics.loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad)
    console.log('Form Load Performance:', metrics)
  })

  test('should handle form submission efficiently', async ({ page: _ }) => {
    const perf = new PerformanceMeasurement(page)

    // Mock APIs
    await page.route('**/api/organizations**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { organizations: [{ id: '1', name: 'Test Org' }] }
        })
      })
    })

    await page.route('**/api/principals**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: '1', name: 'Test Principal' }]
        })
      })
    })

    await page.route('**/api/products**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: '1', name: 'Test Product' }]
        })
      })
    })

    await page.route('**/api/opportunities', route => {
      // Simulate realistic submission processing time
      setTimeout(() => {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { id: 'new-opp-123', name: 'Test Opportunity' }
          })
        })
      }, 100) // 100ms processing time
    })

    await page.goto('/opportunities/new')
    await page.waitForLoadState('networkidle')

    // Measure form filling and submission
    const submissionMetrics = await perf.measureFormSubmission(async () => {
      // Fill form efficiently
      await page.selectOption('[data-testid="organization-select"]', '1')
      await page.selectOption('[data-testid="context-select"]', 'NEW_BUSINESS')
      await page.selectOption('[data-testid="stage-select"]', 'NEW_LEAD')
      await page.fill('[data-testid="probability-input"]', '25')
      await page.fill('[data-testid="close-date-input"]', '2025-06-30')
      await page.fill('[data-testid="deal-owner-input"]', 'Test Rep')

      // Select principal
      await page.click('[data-testid="principal-multi-select"]')
      await page.click('[role="option"]:has-text("Test Principal")')
      await page.keyboard.press('Escape')

      // Select product  
      await page.click('[data-testid="product-select"]')
      await page.click('[role="option"]:has-text("Test Product")')
    })

    expect(submissionMetrics.submissionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.formSubmission)
    expect(submissionMetrics.totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.formSubmission + 1000)

    console.log('Form Submission Performance:', submissionMetrics)
  })

  test('should handle batch creation efficiently', async ({ page: _ }) => {
    const perf = new PerformanceMeasurement(page)

    // Mock APIs for batch creation
    await page.route('**/api/organizations**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { organizations: [{ id: '1', name: 'Test Org' }] }
        })
      })
    })

    await page.route('**/api/principals**', route => {
      const principals = Array.from({ length: 20 }, (_, i) => ({
        id: `principal-${i}`,
        name: `Principal ${i}`
      }))
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: principals
        })
      })
    })

    await page.route('**/api/opportunities/name-preview', route => {
      const postData = route.request().postDataJSON()
      const principalIds = postData.principal_ids || []

      const previews = principalIds.map((id: string) => ({
        principal_id: id,
        principal_name: `Principal ${id.split('-')[1]}`,
        generated_name: `Test Org - Principal ${id.split('-')[1]} - New Business - Jan 2025`,
        is_duplicate: false
      }))

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: previews
        })
      })
    })

    await page.route('**/api/opportunities/batch', route => {
      // Simulate batch processing time
      setTimeout(() => {
        const postData = route.request().postDataJSON()
        const principalIds = postData.principal_ids || []

        const createdOpportunities = principalIds.map((id: string) => ({
          id: `opp-${id}`,
          name: `Batch Opportunity ${id}`,
          principal_id: id
        }))

        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              success: true,
              created_opportunities: createdOpportunities,
              failed_opportunities: [],
              total_created: createdOpportunities.length,
              total_failed: 0
            }
          })
        })
      }, 200) // 200ms batch processing time
    })

    await page.goto('/opportunities/new')
    await page.waitForLoadState('networkidle')

    // Test batch creation performance
    const batchMetrics = await perf.measureFormSubmission(async () => {
      await page.selectOption('[data-testid="organization-select"]', '1')
      await page.selectOption('[data-testid="context-select"]', 'NEW_BUSINESS')

      // Select multiple principals (10 for batch test)
      await page.click('[data-testid="principal-multi-select"]')
      for (let i = 0; i < 10; i++) {
        await page.click(`[role="option"]:has-text("Principal ${i}")`)
      }
      await page.keyboard.press('Escape')

      // Enable auto-naming
      await page.check('[data-testid="auto-generate-name"]')
    })

    // Batch operations should still complete within reasonable time
    expect(batchMetrics.submissionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.formSubmission * 2)

    console.log('Batch Creation Performance:', batchMetrics)
  })
})

test.describe('Memory and Resource Usage', () => {
  test('should maintain reasonable memory usage', async ({ page: _ }) => {
    const perf = new PerformanceMeasurement(page)

    // Mock heavy dataset
    await page.route('**/api/opportunities**', route => {
      const opportunities = PerformanceTestDataGenerator.generateLargeOpportunityDataset(200)
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            opportunities: opportunities.slice(0, 50), // Large page size
            total_count: opportunities.length
          }
        })
      })
    })

    // Initial memory measurement
    await page.goto('/opportunities')
    await page.waitForLoadState('networkidle')

    const initialMemory = await perf.measureMemoryUsage()
    console.log('Initial Memory Usage:', initialMemory)

    // Perform memory-intensive operations
    for (let i = 0; i < 5; i++) {
      // Navigate between pages
      await page.goto('/opportunities/new')
      await page.waitForLoadState('networkidle')

      await page.goto('/opportunities')
      await page.waitForLoadState('networkidle')

      // Perform searches
      await page.fill('[name="search"]', `test ${i}`)
      await page.keyboard.press('Enter')
      await page.waitForTimeout(500)
    }

    const finalMemory = await perf.measureMemoryUsage()
    console.log('Final Memory Usage:', finalMemory)

    // Memory should not increase dramatically
    if (initialMemory.usedHeapSize > 0 && finalMemory.usedHeapSize > 0) {
      const memoryIncrease = finalMemory.usedHeapSize - initialMemory.usedHeapSize
      const memoryIncreasePercent = (memoryIncrease / initialMemory.usedHeapSize) * 100

      console.log('Memory Increase:', { memoryIncrease, memoryIncreasePercent })

      // Memory increase should be reasonable (less than 100% increase)
      expect(memoryIncreasePercent).toBeLessThan(100)
    }
  })

  test('should optimize network requests', async ({ page: _ }) => {
    let requestCount = 0
    const requestUrls: string[] = []

    await page.route('**/*', route => {
      requestCount++
      requestUrls.push(route.request().url())
      route.continue()
    })

    await page.goto('/opportunities')
    await page.waitForLoadState('networkidle')

    // Count API requests vs asset requests
    const apiRequests = requestUrls.filter(url => url.includes('/api/'))
    const assetRequests = requestUrls.filter(url =>
      url.includes('.js') || url.includes('.css') || url.includes('.svg') || url.includes('.png')
    )

    console.log('Network Requests:', {
      total: requestCount,
      api: apiRequests.length,
      assets: assetRequests.length,
      apiRequests: apiRequests.map(url => url.split('/api/')[1])
    })

    // Should not make excessive API requests
    expect(apiRequests.length).toBeLessThan(10)

    // Should not duplicate API calls
    const uniqueApiRequests = [...new Set(apiRequests)]
    expect(uniqueApiRequests.length).toBe(apiRequests.length)
  })
})

test.describe('Stress Testing', () => {
  test('should handle rapid user interactions', async ({ page: _ }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _perf = new PerformanceMeasurement(page)

    await page.route('**/api/opportunities**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            opportunities: PerformanceTestDataGenerator.generateLargeOpportunityDataset(50),
            total_count: 50
          }
        })
      })
    })

    await page.goto('/opportunities')
    await page.waitForLoadState('networkidle')

    const startTime = Date.now()

    // Perform rapid interactions
    for (let i = 0; i < 20; i++) {
      // Rapid search changes
      await page.fill('[name="search"]', `test${i}`)

      // Rapid filter changes
      const stages = ['NEW_LEAD', 'INITIAL_OUTREACH', 'DEMO_SCHEDULED']
      await page.selectOption('[name="stage_filter"]', stages[i % stages.length])

      // Short delay to allow some processing
      await page.waitForTimeout(50)
    }

    const totalTime = Date.now() - startTime
    console.log('Rapid Interaction Test:', { totalTime, averagePerInteraction: totalTime / 20 })

    // Should handle rapid interactions without breaking
    expect(totalTime).toBeLessThan(10000) // 10 seconds for 20 rapid interactions

    // Page should still be responsive
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('[name="search"]')).toBeVisible()
  })
})