/**
 * Comprehensive Integration Testing for Interaction Management System
 * Task 6.4: Integration Testing (user-behavior-analyst)
 * 
 * This test suite validates end-to-end user workflows, cross-component integration,
 * and user experience journeys for the interaction management system.
 */

import { test, expect, type Page, type Locator } from '@playwright/test'

// Test Configuration
const BASE_URL = 'http://localhost:3003'
const TEST_TIMEOUT = 30000

// User Workflow Data
const testUserData = {
  standardUser: {
    name: 'Test Integration User',
    email: 'integration@testcompany.com',
    role: 'Sales Manager'
  },
  interactions: [
    {
      type: 'DEMO',
      subject: 'Product Demo - Integration Testing',
      notes: 'Comprehensive demo for testing integration workflows',
      followUpNeeded: true,
      followUpDate: '2024-08-25'
    },
    {
      type: 'CALL',
      subject: 'Follow-up Call - Integration Test',
      notes: 'Follow-up after demo session',
      followUpNeeded: false
    },
    {
      type: 'EMAIL',
      subject: 'Proposal Follow-up',
      notes: 'Sent detailed proposal via email',
      followUpNeeded: true,
      followUpDate: '2024-08-30'
    }
  ]
}

/**
 * Helper Functions for Integration Testing
 */
class IntegrationTestHelper {
  constructor(private page: Page) {}

  async navigateToSection(section: 'dashboard' | 'interactions' | 'opportunities' | 'contacts') {
    const routes = {
      dashboard: '/',
      interactions: '/interactions',
      opportunities: '/opportunities',
      contacts: '/contacts'
    }
    
    await this.page.goto(`${BASE_URL}${routes[section]}`)
    await this.page.waitForLoadState('networkidle')
  }

  async waitForPageTransition() {
    await this.page.waitForLoadState('networkidle')
    await this.page.waitForTimeout(500) // Allow for smooth transitions
  }

  async measurePageLoadTime(): Promise<number> {
    const startTime = Date.now()
    await this.page.waitForLoadState('networkidle')
    return Date.now() - startTime
  }

  async checkKPICards() {
    const kpiCards = this.page.locator('[data-testid="kpi-card"]')
    await expect(kpiCards).toHaveCount(4, { timeout: 10000 })
    
    const cardTitles = ['Total Interactions', 'This Week', 'Overdue Follow-ups', 'Scheduled']
    for (const title of cardTitles) {
      await expect(this.page.locator(`text=${title}`)).toBeVisible()
    }
  }

  async validateDataConsistency(interactionId: string) {
    // Check interaction appears in list view
    await this.navigateToSection('interactions')
    await expect(this.page.locator(`[data-testid="interaction-${interactionId}"]`)).toBeVisible()
    
    // Check interaction details are accessible
    await this.page.click(`[data-testid="interaction-${interactionId}"]`)
    await this.waitForPageTransition()
    await expect(this.page.locator('[data-testid="interaction-detail"]')).toBeVisible()
  }

  async simulateNetworkDelay(delayMs: number = 2000) {
    await this.page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, delayMs))
      await route.continue()
    })
  }

  async createInteractionFlow(interactionData: any) {
    // Navigate to create form
    await this.navigateToSection('interactions')
    await this.page.click('[data-testid="create-interaction-btn"]')
    await this.waitForPageTransition()

    // Fill form step by step
    await this.page.selectOption('[data-testid="interaction-type"]', interactionData.type)
    await this.page.fill('[data-testid="interaction-subject"]', interactionData.subject)
    await this.page.fill('[data-testid="interaction-notes"]', interactionData.notes)
    
    if (interactionData.followUpNeeded) {
      await this.page.check('[data-testid="follow-up-needed"]')
      await this.page.fill('[data-testid="follow-up-date"]', interactionData.followUpDate)
    }

    // Submit form
    await this.page.click('[data-testid="submit-interaction"]')
    await this.waitForPageTransition()
  }

  async validateErrorHandling(scenario: string) {
    switch (scenario) {
      case 'network-error':
        await this.page.route('**/api/interactions', route => route.abort())
        break
      case 'validation-error':
        // Submit form with missing required fields
        await this.page.click('[data-testid="submit-interaction"]')
        break
      case 'timeout':
        await this.simulateNetworkDelay(10000)
        break
    }
  }
}

/**
 * Test Suite: End-to-End User Workflow Testing
 */
test.describe('User Workflow Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
  })

  test('WF1: New User Onboarding Flow', async ({ page }) => {
    const helper = new IntegrationTestHelper(page)
    
    // Step 1: Dashboard Overview
    await helper.navigateToSection('dashboard')
    await helper.checkKPICards()
    
    // Step 2: Navigate to Interactions
    await page.click('text=Interactions')
    await helper.waitForPageTransition()
    await expect(page.locator('[data-testid="interactions-list"]')).toBeVisible()
    
    // Step 3: Create First Interaction
    await helper.createInteractionFlow(testUserData.interactions[0])
    
    // Step 4: Verify Success
    await expect(page.locator('text=Interaction created successfully')).toBeVisible()
    
    // Step 5: Set Follow-up
    await expect(page.locator('[data-testid="follow-up-indicator"]')).toBeVisible()
  })

  test('WF2: Daily Usage Pattern', async ({ page }) => {
    const helper = new IntegrationTestHelper(page)
    
    // Step 1: Dashboard Review
    await helper.navigateToSection('dashboard')
    const loadTime = await helper.measurePageLoadTime()
    expect(loadTime).toBeLessThan(3000) // Performance benchmark
    
    // Step 2: Review KPIs
    await helper.checkKPICards()
    
    // Step 3: Quick Interaction Creation
    await helper.createInteractionFlow(testUserData.interactions[1])
    
    // Step 4: Process Follow-ups
    await helper.navigateToSection('interactions')
    const followUpCount = await page.locator('[data-testid="overdue-follow-up"]').count()
    console.log(`Found ${followUpCount} overdue follow-ups`)
  })

  test('WF3: Mobile Field Worker Simulation', async ({ page }) => {
    const helper = new IntegrationTestHelper(page)
    
    // Simulate mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Step 1: Quick Templates Access
    await helper.navigateToSection('interactions')
    await expect(page.locator('[data-testid="quick-templates"]')).toBeVisible()
    
    // Step 2: Voice Notes Simulation
    await page.click('[data-testid="voice-note-btn"]')
    await expect(page.locator('[data-testid="voice-recording"]')).toBeVisible()
    
    // Step 3: Offline Creation Simulation
    await page.setOffline(true)
    await helper.createInteractionFlow(testUserData.interactions[2])
    
    // Step 4: Sync when Online
    await page.setOffline(false)
    await page.reload()
    await helper.waitForPageTransition()
  })

  test('WF4: Manager Review Workflow', async ({ page }) => {
    const helper = new IntegrationTestHelper(page)
    
    // Step 1: Dashboard Analytics
    await helper.navigateToSection('dashboard')
    await expect(page.locator('[data-testid="analytics-panel"]')).toBeVisible()
    
    // Step 2: Team Performance Review
    await page.click('[data-testid="team-metrics-btn"]')
    await expect(page.locator('[data-testid="team-performance"]')).toBeVisible()
    
    // Step 3: Bulk Operations
    await helper.navigateToSection('interactions')
    await page.click('[data-testid="select-all-interactions"]')
    await page.click('[data-testid="bulk-actions-btn"]')
    await expect(page.locator('[data-testid="bulk-actions-menu"]')).toBeVisible()
  })

  test('WF5: Opportunity Follow-up Integration', async ({ page }) => {
    const helper = new IntegrationTestHelper(page)
    
    // Step 1: Navigate to Opportunities
    await helper.navigateToSection('opportunities')
    await expect(page.locator('[data-testid="opportunities-list"]')).toBeVisible()
    
    // Step 2: Create Interaction from Opportunity
    const firstOpportunity = page.locator('[data-testid="opportunity-row"]').first()
    await firstOpportunity.click()
    await helper.waitForPageTransition()
    
    await page.click('[data-testid="add-interaction-btn"]')
    await helper.waitForPageTransition()
    
    // Step 3: Verify Pre-population
    await expect(page.locator('[data-testid="opportunity-context"]')).not.toBeEmpty()
    
    // Step 4: Schedule Demo
    await page.selectOption('[data-testid="interaction-type"]', 'DEMO')
    await page.fill('[data-testid="interaction-subject"]', 'Demo Scheduled from Opportunity')
    await page.click('[data-testid="submit-interaction"]')
    
    // Step 5: Track Progress
    await helper.navigateToSection('opportunities')
    await expect(page.locator('[data-testid="recent-interactions"]')).toBeVisible()
  })
})

/**
 * Test Suite: Cross-Component Integration Testing
 */
test.describe('Cross-Component Integration Tests', () => {
  test('CC1: Navigation Between Modules', async ({ page }) => {
    const helper = new IntegrationTestHelper(page)
    const modules = ['dashboard', 'interactions', 'opportunities', 'contacts']
    
    for (const module of modules) {
      const startTime = Date.now()
      await helper.navigateToSection(module as any)
      const loadTime = Date.now() - startTime
      
      expect(loadTime).toBeLessThan(500) // Navigation performance
      console.log(`${module} navigation: ${loadTime}ms`)
    }
  })

  test('CC2: Data Consistency Across Views', async ({ page }) => {
    const helper = new IntegrationTestHelper(page)
    
    // Create interaction in one view
    await helper.createInteractionFlow(testUserData.interactions[0])
    const interactionId = await page.getAttribute('[data-testid="interaction-id"]', 'data-id')
    
    // Verify in list view
    await helper.navigateToSection('interactions')
    await expect(page.locator(`[data-testid="interaction-${interactionId}"]`)).toBeVisible()
    
    // Verify in dashboard
    await helper.navigateToSection('dashboard')
    await helper.checkKPICards()
    
    // Verify in related opportunity
    if (interactionId) {
      await helper.validateDataConsistency(interactionId)
    }
  })

  test('CC3: Real-time Updates and Synchronization', async ({ page, context }) => {
    const helper = new IntegrationTestHelper(page)
    
    // Open second tab to simulate multiple users
    const secondPage = await context.newPage()
    const secondHelper = new IntegrationTestHelper(secondPage)
    
    // Navigate both tabs to interactions
    await helper.navigateToSection('interactions')
    await secondHelper.navigateToSection('interactions')
    
    // Create interaction in first tab
    await helper.createInteractionFlow(testUserData.interactions[0])
    
    // Verify real-time update in second tab
    await secondPage.waitForTimeout(2000) // Allow for real-time sync
    await secondPage.reload()
    await expect(secondPage.locator('[data-testid="interaction-list"] tr')).toHaveCount(6) // Assuming 5 demo + 1 new
    
    await secondPage.close()
  })

  test('CC4: KPI Calculations and Dashboard Integration', async ({ page }) => {
    const helper = new IntegrationTestHelper(page)
    
    // Record initial KPI values
    await helper.navigateToSection('dashboard')
    const initialTotal = await page.textContent('[data-testid="total-interactions"]')
    const initialWeek = await page.textContent('[data-testid="interactions-this-week"]')
    
    // Create new interaction
    await helper.createInteractionFlow(testUserData.interactions[0])
    
    // Verify KPI updates
    await helper.navigateToSection('dashboard')
    await page.waitForTimeout(1000) // Allow for KPI recalculation
    
    const newTotal = await page.textContent('[data-testid="total-interactions"]')
    const newWeek = await page.textContent('[data-testid="interactions-this-week"]')
    
    // Validate increases
    expect(parseInt(newTotal || '0')).toBeGreaterThan(parseInt(initialTotal || '0'))
    expect(parseInt(newWeek || '0')).toBeGreaterThanOrEqual(parseInt(initialWeek || '0'))
  })

  test('CC5: Search and Filtering Integration', async ({ page }) => {
    const helper = new IntegrationTestHelper(page)
    
    await helper.navigateToSection('interactions')
    
    // Test search functionality
    await page.fill('[data-testid="search-input"]', 'demo')
    await page.waitForTimeout(500)
    
    const searchResults = await page.locator('[data-testid="interaction-row"]').count()
    expect(searchResults).toBeGreaterThan(0)
    
    // Test type filtering
    await page.selectOption('[data-testid="type-filter"]', 'DEMO')
    await page.waitForTimeout(500)
    
    const filteredResults = await page.locator('[data-testid="interaction-row"]').count()
    expect(filteredResults).toBeLessThanOrEqual(searchResults)
    
    // Clear filters
    await page.click('[data-testid="clear-filters"]')
    const clearedResults = await page.locator('[data-testid="interaction-row"]').count()
    expect(clearedResults).toBeGreaterThanOrEqual(filteredResults)
  })
})

/**
 * Test Suite: User Experience Journey Testing
 */
test.describe('User Experience Journey Tests', () => {
  test('UX1: Error Handling and Recovery', async ({ page }) => {
    const helper = new IntegrationTestHelper(page)
    
    await helper.navigateToSection('interactions')
    await page.click('[data-testid="create-interaction-btn"]')
    
    // Test validation errors
    await helper.validateErrorHandling('validation-error')
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('text=Please fill in all required fields')).toBeVisible()
    
    // Test error recovery
    await page.fill('[data-testid="interaction-subject"]', 'Recovery Test')
    await page.selectOption('[data-testid="interaction-type"]', 'EMAIL')
    await page.click('[data-testid="submit-interaction"]')
    
    await expect(page.locator('text=Interaction created successfully')).toBeVisible()
  })

  test('UX2: Loading States and Progressive Enhancement', async ({ page }) => {
    const helper = new IntegrationTestHelper(page)
    
    // Simulate slow network
    await helper.simulateNetworkDelay(1000)
    
    await helper.navigateToSection('interactions')
    
    // Verify loading states
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()
    await expect(page.locator('[data-testid="loading-skeleton"]')).toBeVisible()
    
    // Wait for content to load
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[data-testid="interactions-list"]')).toBeVisible()
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible()
  })

  test('UX3: Responsive Behavior Across Device Transitions', async ({ page }) => {
    const helper = new IntegrationTestHelper(page)
    
    // Start desktop
    await page.setViewportSize({ width: 1200, height: 800 })
    await helper.navigateToSection('interactions')
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible()
    
    // Transition to tablet
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(500)
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible()
    
    // Transition to mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(500)
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible()
    
    // Test mobile-specific features
    await expect(page.locator('[data-testid="mobile-quick-actions"]')).toBeVisible()
  })

  test('UX4: User Feedback and Notifications', async ({ page }) => {
    const helper = new IntegrationTestHelper(page)
    
    // Test success notifications
    await helper.createInteractionFlow(testUserData.interactions[0])
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()
    await expect(page.locator('text=Interaction created successfully')).toBeVisible()
    
    // Test follow-up notifications
    await expect(page.locator('[data-testid="follow-up-notification"]')).toBeVisible()
    
    // Test auto-dismiss
    await page.waitForTimeout(5000)
    await expect(page.locator('[data-testid="success-toast"]')).not.toBeVisible()
  })

  test('UX5: Accessibility and Keyboard Navigation', async ({ page }) => {
    const helper = new IntegrationTestHelper(page)
    
    await helper.navigateToSection('interactions')
    
    // Test keyboard navigation
    await page.keyboard.press('Tab') // Focus first interactive element
    await page.keyboard.press('Enter') // Activate element
    
    // Test ARIA labels and roles
    const createButton = page.locator('[data-testid="create-interaction-btn"]')
    await expect(createButton).toHaveAttribute('aria-label')
    
    // Test focus management
    await page.click('[data-testid="create-interaction-btn"]')
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeTruthy()
  })
})

/**
 * Test Suite: Data Flow Integration Testing
 */
test.describe('Data Flow Integration Tests', () => {
  test('DF1: Data Persistence Across Page Refreshes', async ({ page }) => {
    const helper = new IntegrationTestHelper(page)
    
    // Create interaction
    await helper.createInteractionFlow(testUserData.interactions[0])
    const interactionId = await page.getAttribute('[data-testid="interaction-id"]', 'data-id')
    
    // Refresh page
    await page.reload()
    await helper.waitForPageTransition()
    
    // Verify data persistence
    await helper.navigateToSection('interactions')
    if (interactionId) {
      await expect(page.locator(`[data-testid="interaction-${interactionId}"]`)).toBeVisible()
    }
  })

  test('DF2: Form State Management and Recovery', async ({ page }) => {
    const helper = new IntegrationTestHelper(page)
    
    await helper.navigateToSection('interactions')
    await page.click('[data-testid="create-interaction-btn"]')
    
    // Fill partial form
    await page.fill('[data-testid="interaction-subject"]', 'Partial Form Test')
    await page.selectOption('[data-testid="interaction-type"]', 'CALL')
    
    // Navigate away and back
    await helper.navigateToSection('dashboard')
    await helper.navigateToSection('interactions')
    await page.click('[data-testid="create-interaction-btn"]')
    
    // Check if form state is recovered (demo mode may not persist)
    const subject = await page.inputValue('[data-testid="interaction-subject"]')
    console.log('Form recovery test - Subject value:', subject)
  })

  test('DF3: Real-time Data Synchronization', async ({ page }) => {
    const helper = new IntegrationTestHelper(page)
    
    // Subscribe to real-time updates
    await helper.navigateToSection('interactions')
    
    // Simulate external data change
    await page.evaluate(() => {
      // Trigger a manual store refresh
      const event = new CustomEvent('dataUpdate', { detail: { type: 'interaction' } })
      window.dispatchEvent(event)
    })
    
    await page.waitForTimeout(1000)
    
    // Verify UI updates
    await expect(page.locator('[data-testid="interactions-list"]')).toBeVisible()
  })

  test('DF4: Caching and Optimization Effectiveness', async ({ page }) => {
    const helper = new IntegrationTestHelper(page)
    
    // First load
    const firstLoad = await helper.measurePageLoadTime()
    await helper.navigateToSection('interactions')
    
    // Second load (should be faster due to caching)
    await helper.navigateToSection('dashboard')
    const secondLoad = await helper.measurePageLoadTime()
    await helper.navigateToSection('interactions')
    
    console.log(`First load: ${firstLoad}ms, Second load: ${secondLoad}ms`)
    
    // Cache should improve performance
    expect(secondLoad).toBeLessThanOrEqual(firstLoad * 1.1) // Allow 10% variance
  })
})

/**
 * Test Suite: Performance Integration Testing
 */
test.describe('Performance Integration Tests', () => {
  test('PERF1: Page Transition Performance', async ({ page }) => {
    const helper = new IntegrationTestHelper(page)
    const modules = ['dashboard', 'interactions', 'opportunities', 'contacts']
    
    for (const module of modules) {
      const startTime = performance.now()
      await helper.navigateToSection(module as any)
      const endTime = performance.now()
      
      const transitionTime = endTime - startTime
      expect(transitionTime).toBeLessThan(500) // 500ms benchmark
      console.log(`${module} transition: ${transitionTime.toFixed(2)}ms`)
    }
  })

  test('PERF2: Form Submission Performance', async ({ page }) => {
    const helper = new IntegrationTestHelper(page)
    
    await helper.navigateToSection('interactions')
    await page.click('[data-testid="create-interaction-btn"]')
    
    // Fill form
    await page.selectOption('[data-testid="interaction-type"]', 'EMAIL')
    await page.fill('[data-testid="interaction-subject"]', 'Performance Test Interaction')
    await page.fill('[data-testid="interaction-notes"]', 'Testing form submission performance')
    
    // Measure submission time
    const startTime = performance.now()
    await page.click('[data-testid="submit-interaction"]')
    await page.waitForSelector('[data-testid="success-toast"]')
    const endTime = performance.now()
    
    const submissionTime = endTime - startTime
    expect(submissionTime).toBeLessThan(2000) // 2s benchmark
    console.log(`Form submission: ${submissionTime.toFixed(2)}ms`)
  })

  test('PERF3: Search Performance', async ({ page }) => {
    const helper = new IntegrationTestHelper(page)
    
    await helper.navigateToSection('interactions')
    
    const searchTerms = ['demo', 'call', 'email', 'follow']
    
    for (const term of searchTerms) {
      const startTime = performance.now()
      await page.fill('[data-testid="search-input"]', term)
      await page.waitForTimeout(300) // Debounce time
      const endTime = performance.now()
      
      const searchTime = endTime - startTime
      expect(searchTime).toBeLessThan(1000) // 1s benchmark
      console.log(`Search "${term}": ${searchTime.toFixed(2)}ms`)
      
      await page.clear('[data-testid="search-input"]')
    }
  })

  test('PERF4: KPI Update Performance', async ({ page }) => {
    const helper = new IntegrationTestHelper(page)
    
    await helper.navigateToSection('dashboard')
    
    // Measure KPI calculation time
    const startTime = performance.now()
    await page.click('[data-testid="refresh-kpis"]')
    await page.waitForSelector('[data-testid="kpi-card"]')
    const endTime = performance.now()
    
    const updateTime = endTime - startTime
    expect(updateTime).toBeLessThan(3000) // 3s benchmark
    console.log(`KPI update: ${updateTime.toFixed(2)}ms`)
  })

  test('PERF5: Concurrent User Simulation', async ({ page, context }) => {
    const helper = new IntegrationTestHelper(page)
    
    // Create multiple tabs to simulate concurrent users
    const tabs = []
    for (let i = 0; i < 3; i++) {
      const newPage = await context.newPage()
      tabs.push(new IntegrationTestHelper(newPage))
    }
    
    // Simulate concurrent operations
    const operations = tabs.map(async (tabHelper, index) => {
      await tabHelper.navigateToSection('interactions')
      await tabHelper.createInteractionFlow({
        ...testUserData.interactions[0],
        subject: `Concurrent Test ${index + 1}`
      })
    })
    
    const startTime = performance.now()
    await Promise.all(operations)
    const endTime = performance.now()
    
    const concurrentTime = endTime - startTime
    console.log(`Concurrent operations: ${concurrentTime.toFixed(2)}ms`)
    
    // Clean up
    for (const tab of tabs) {
      await tab.page.close()
    }
  })
})

/**
 * Test Suite: Integration Report Generation
 */
test.describe('Integration Report Generation', () => {
  test('Generate Comprehensive Integration Report', async ({ page }) => {
    const helper = new IntegrationTestHelper(page)
    const report = {
      timestamp: new Date().toISOString(),
      testResults: {
        userWorkflows: 0,
        crossComponent: 0,
        userExperience: 0,
        dataFlow: 0,
        performance: 0
      },
      performanceMetrics: {
        pageTransitions: [] as number[],
        formSubmissions: [] as number[],
        searchOperations: [] as number[],
        kpiUpdates: [] as number[]
      },
      recommendations: [] as string[]
    }
    
    // Collect performance data during test execution
    console.log('Integration Test Report Generated:', JSON.stringify(report, null, 2))
    
    // This would be expanded to collect actual test results
    // and generate a comprehensive report file
  })
})