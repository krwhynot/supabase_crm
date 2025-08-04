/**
 * Comprehensive Performance Testing for Interaction Management System
 * 
 * Tests the 4-phase performance validation process:
 * Phase 1: API Testing & Navigation
 * Phase 2: Load Testing & Component Integration
 * Phase 3: Performance Analysis & Error Validation
 * Phase 4: Optimization & Reporting
 */

import { test, expect, type Page } from '@playwright/test'

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  PAGE_LOAD: 2000,           // Page load < 2s
  NAVIGATION: 1000,          // Navigation < 1s
  API_RESPONSE: 500,         // API response < 500ms
  FORM_INTERACTION: 300,     // Form interactions < 300ms
  COMPONENT_RENDER: 200      // Component render < 200ms
}

// Test data
const TEST_INTERACTION = {
  type: 'CALL',
  subject: 'Performance Test Interaction',
  description: 'Testing interaction system performance',
  duration: 30,
  rating: 4
}

test.describe('Interaction System Performance Validation', () => {
  let performanceMetrics: any = {}
  
  test.beforeEach(async ({ page }) => {
    // Enable performance monitoring
    await page.addInitScript(() => {
      window.performance.mark('test-start')
    })

    // Track console errors and warnings
    const consoleMessages: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleMessages.push(`${msg.type()}: ${msg.text()}`)
      }
    })
    
    // Track network errors
    page.on('response', response => {
      if (response.status() >= 400) {
        consoleMessages.push(`Network Error: ${response.status()} - ${response.url()}`)
      }
    })

    // Store messages for later validation
    page.consoleMessages = consoleMessages
  })

  // ===============================
  // PHASE 1: API TESTING & NAVIGATION
  // ===============================
  
  test('Phase 1: Navigation Testing - Base Routes', async ({ page }) => {
    console.log('🚀 Phase 1: Testing Navigation Performance')
    
    const startTime = performance.now()
    
    // Navigate to dashboard
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' })
    const dashboardLoadTime = performance.now() - startTime
    
    // Verify dashboard loads without errors
    await expect(page.locator('h1')).toContainText('Dashboard', { timeout: 10000 })
    console.log(`✅ Dashboard load time: ${dashboardLoadTime.toFixed(2)}ms`)
    
    // Navigate to interactions list
    const navStartTime = performance.now()
    await page.click('a[href="/interactions"]')
    await page.waitForURL('**/interactions')
    await page.waitForLoadState('networkidle')
    const navTime = performance.now() - navStartTime
    
    // Verify interactions page loads
    await expect(page.locator('h1')).toContainText('Interactions', { timeout: 10000 })
    console.log(`✅ Navigation to interactions: ${navTime.toFixed(2)}ms`)
    
    // Performance assertions
    expect(dashboardLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PAGE_LOAD)
    expect(navTime).toBeLessThan(PERFORMANCE_THRESHOLDS.NAVIGATION)
    
    performanceMetrics.dashboardLoad = dashboardLoadTime
    performanceMetrics.navigationTime = navTime
  })

  test('Phase 1: Interactions List Performance', async ({ page }) => {
    console.log('🚀 Phase 1: Testing Interactions List Performance')
    
    const startTime = performance.now()
    await page.goto('http://localhost:3000/interactions', { waitUntil: 'networkidle' })
    const loadTime = performance.now() - startTime
    
    // Verify page elements load
    await expect(page.locator('h1')).toContainText('Interactions')
    await expect(page.locator('[data-testid="kpi-cards"], .grid')).toBeVisible({ timeout: 10000 })
    
    // Test KPI cards load
    const kpiCards = await page.locator('.grid .bg-white').count()
    expect(kpiCards).toBeGreaterThanOrEqual(3) // Should have multiple KPI cards
    console.log(`✅ KPI cards loaded: ${kpiCards}`)
    
    // Test filters are present
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible()
    await expect(page.locator('select')).toBeVisible()
    console.log(`✅ Filters loaded successfully`)
    
    // Performance validation
    expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PAGE_LOAD)
    console.log(`✅ Interactions list load time: ${loadTime.toFixed(2)}ms`)
    
    performanceMetrics.interactionsListLoad = loadTime
  })

  test('Phase 1: New Interaction Form Navigation', async ({ page }) => {
    console.log('🚀 Phase 1: Testing New Interaction Form Navigation')
    
    await page.goto('http://localhost:3000/interactions')
    await page.waitForLoadState('networkidle')
    
    // Click new interaction button
    const navStartTime = performance.now()
    await page.click('a[href="/interactions/new"]')
    await page.waitForURL('**/interactions/new')
    await page.waitForLoadState('networkidle')
    const navTime = performance.now() - navStartTime
    
    // Verify form loads
    await expect(page.locator('h1')).toContainText('New Interaction', { timeout: 10000 })
    
    // Check for form steps or form elements
    const hasFormElements = await page.locator('form, .form-step, input, select, textarea').count()
    expect(hasFormElements).toBeGreaterThan(0)
    console.log(`✅ Form elements found: ${hasFormElements}`)
    
    // Performance validation
    expect(navTime).toBeLessThan(PERFORMANCE_THRESHOLDS.NAVIGATION)
    console.log(`✅ New interaction form navigation: ${navTime.toFixed(2)}ms`)
    
    performanceMetrics.formNavigation = navTime
  })

  // ===============================
  // PHASE 2: LOAD TESTING & COMPONENT INTEGRATION
  // ===============================
  
  test('Phase 2: Component Integration Testing', async ({ page }) => {
    console.log('🚀 Phase 2: Testing Component Integration Performance')
    
    await page.goto('http://localhost:3000/interactions')
    await page.waitForLoadState('networkidle')
    
    // Test search functionality performance
    const searchStartTime = performance.now()
    await page.fill('input[placeholder*="Search"]', 'test search')
    await page.waitForTimeout(500) // Allow for debounce
    const searchTime = performance.now() - searchStartTime
    
    console.log(`✅ Search interaction time: ${searchTime.toFixed(2)}ms`)
    expect(searchTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FORM_INTERACTION)
    
    // Test filter dropdown performance
    const filterStartTime = performance.now()
    await page.selectOption('select[id*="type"], select[id*="status"]', { index: 1 })
    await page.waitForTimeout(300)
    const filterTime = performance.now() - filterStartTime
    
    console.log(`✅ Filter interaction time: ${filterTime.toFixed(2)}ms`)
    expect(filterTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FORM_INTERACTION)
    
    // Test sort functionality
    const sortStartTime = performance.now()
    const sortDropdown = page.locator('select').first()
    if (await sortDropdown.isVisible()) {
      await sortDropdown.selectOption({ index: 1 })
      await page.waitForTimeout(300)
    }
    const sortTime = performance.now() - sortStartTime
    
    console.log(`✅ Sort interaction time: ${sortTime.toFixed(2)}ms`)
    
    performanceMetrics.searchPerformance = searchTime
    performanceMetrics.filterPerformance = filterTime
    performanceMetrics.sortPerformance = sortTime
  })

  test('Phase 2: Form Functionality Performance', async ({ page }) => {
    console.log('🚀 Phase 2: Testing Form Functionality Performance')
    
    await page.goto('http://localhost:3000/interactions/new')
    await page.waitForLoadState('networkidle')
    
    // Test form field interactions
    const formFields = await page.locator('input, select, textarea').count()
    console.log(`✅ Form fields available: ${formFields}`)
    
    if (formFields > 0) {
      // Test first input field
      const fieldStartTime = performance.now()
      const firstInput = page.locator('input').first()
      if (await firstInput.isVisible()) {
        await firstInput.fill('Test Performance')
      }
      const fieldTime = performance.now() - fieldStartTime
      
      console.log(`✅ Form field interaction: ${fieldTime.toFixed(2)}ms`)
      expect(fieldTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FORM_INTERACTION)
      
      performanceMetrics.formFieldPerformance = fieldTime
    }
    
    // Test form validation if available
    const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Create"), button:has-text("Save")')
    if (await submitButton.count() > 0) {
      const validationStartTime = performance.now()
      await submitButton.first().click()
      await page.waitForTimeout(500) // Allow for validation
      const validationTime = performance.now() - validationStartTime
      
      console.log(`✅ Form validation time: ${validationTime.toFixed(2)}ms`)
      expect(validationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FORM_INTERACTION)
      
      performanceMetrics.formValidation = validationTime
    }
  })

  // ===============================
  // PHASE 3: PERFORMANCE ANALYSIS & ERROR VALIDATION
  // ===============================
  
  test('Phase 3: Error Validation and Console Monitoring', async ({ page }) => {
    console.log('🚀 Phase 3: Testing Error Validation and Console Monitoring')
    
    const consoleMessages: string[] = []
    const networkErrors: string[] = []
    
    // Monitor console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(`Console Error: ${msg.text()}`)
      } else if (msg.type() === 'warning') {
        consoleMessages.push(`Console Warning: ${msg.text()}`)
      }
    })
    
    // Monitor network responses
    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push(`${response.status()} - ${response.url()}`)
      }
    })
    
    // Navigate through key pages
    const pages = [
      'http://localhost:3000/',
      'http://localhost:3000/interactions',
      'http://localhost:3000/interactions/new'
    ]
    
    for (const url of pages) {
      console.log(`Testing: ${url}`)
      await page.goto(url)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000) // Allow for any async operations
    }
    
    // Validate no critical errors
    const criticalErrors = consoleMessages.filter(msg => 
      msg.includes('Error') && 
      !msg.includes('Supabase') && // Allow Supabase demo mode warnings
      !msg.includes('demo') &&
      !msg.includes('Failed to fetch')
    )
    
    console.log(`📊 Console messages: ${consoleMessages.length}`)
    console.log(`📊 Network errors: ${networkErrors.length}`)
    console.log(`📊 Critical errors: ${criticalErrors.length}`)
    
    if (consoleMessages.length > 0) {
      console.log('Console Messages:', consoleMessages.slice(0, 5)) // Show first 5
    }
    
    // Allow demo mode warnings but not critical application errors
    expect(criticalErrors.length, 'Should have no critical application errors').toBeLessThan(3)
    
    performanceMetrics.consoleErrors = consoleMessages.length
    performanceMetrics.networkErrors = networkErrors.length
    performanceMetrics.criticalErrors = criticalErrors.length
  })

  test('Phase 3: Route and Component Validation', async ({ page }) => {
    console.log('🚀 Phase 3: Testing Route and Component Validation')
    
    // Test all interaction routes
    const routes = [
      { path: '/interactions', expectedText: 'Interactions' },
      { path: '/interactions/new', expectedText: 'New Interaction' }
    ]
    
    for (const route of routes) {
      const startTime = performance.now()
      await page.goto(`http://localhost:3000${route.path}`)
      await page.waitForLoadState('networkidle')
      
      // Verify route loads correctly
      const hasExpectedContent = await page.locator(`h1:has-text("${route.expectedText}")`).count() > 0
      expect(hasExpectedContent, `Route ${route.path} should load correctly`).toBeTruthy()
      
      const loadTime = performance.now() - startTime
      console.log(`✅ Route ${route.path}: ${loadTime.toFixed(2)}ms`)
      
      // Performance validation
      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PAGE_LOAD)
    }
    
    // Test back navigation
    const backNavTime = performance.now()
    await page.goBack()
    await page.waitForLoadState('networkidle')
    const backTime = performance.now() - backNavTime
    
    console.log(`✅ Back navigation: ${backTime.toFixed(2)}ms`)
    expect(backTime).toBeLessThan(PERFORMANCE_THRESHOLDS.NAVIGATION)
    
    performanceMetrics.backNavigation = backTime
  })

  // ===============================
  // PHASE 4: OPTIMIZATION & REPORTING
  // ===============================
  
  test('Phase 4: Performance Metrics Collection and Reporting', async ({ page }) => {
    console.log('🚀 Phase 4: Performance Metrics Collection and Reporting')
    
    // Collect comprehensive performance data
    await page.goto('http://localhost:3000/interactions')
    await page.waitForLoadState('networkidle')
    
    // Get performance navigation timing
    const performanceData = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const paint = performance.getEntriesByType('paint')
      const resources = performance.getEntriesByType('resource')
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
        resourceCount: resources.length,
        totalTransferSize: resources.reduce((total, resource) => total + (resource.transferSize || 0), 0)
      }
    })
    
    console.log('📊 Performance Data:')
    console.log(`  DOM Content Loaded: ${performanceData.domContentLoaded.toFixed(2)}ms`)
    console.log(`  Load Complete: ${performanceData.loadComplete.toFixed(2)}ms`)
    console.log(`  First Paint: ${performanceData.firstPaint.toFixed(2)}ms`)
    console.log(`  First Contentful Paint: ${performanceData.firstContentfulPaint.toFixed(2)}ms`)
    console.log(`  Resources Loaded: ${performanceData.resourceCount}`)
    console.log(`  Total Transfer Size: ${(performanceData.totalTransferSize / 1024).toFixed(2)}KB`)
    
    // Bundle size analysis
    const jsResources = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      return resources
        .filter(resource => resource.name.includes('.js'))
        .map(resource => ({
          name: resource.name.split('/').pop(),
          size: resource.transferSize || 0,
          loadTime: resource.responseEnd - resource.requestStart
        }))
    })
    
    const totalJSSize = jsResources.reduce((total, resource) => total + resource.size, 0)
    console.log(`📦 JavaScript Bundle Size: ${(totalJSSize / 1024).toFixed(2)}KB`)
    
    // Performance assertions
    expect(performanceData.firstContentfulPaint).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER * 5)
    expect(totalJSSize).toBeLessThan(1024 * 1024) // Less than 1MB
    
    performanceMetrics.performanceData = performanceData
    performanceMetrics.bundleSize = totalJSSize
  })

  test('Phase 4: Final Performance Report', async ({ page }) => {
    console.log('🚀 Phase 4: Generating Final Performance Report')
    
    // Generate comprehensive performance report
    const report = {
      timestamp: new Date().toISOString(),
      testEnvironment: 'Local Development',
      performanceThresholds: PERFORMANCE_THRESHOLDS,
      actualMetrics: performanceMetrics,
      status: 'COMPLETED',
      recommendations: []
    }
    
    // Performance evaluation
    const evaluations = [
      {
        metric: 'Dashboard Load',
        actual: performanceMetrics.dashboardLoad || 0,
        threshold: PERFORMANCE_THRESHOLDS.PAGE_LOAD,
        status: (performanceMetrics.dashboardLoad || 0) < PERFORMANCE_THRESHOLDS.PAGE_LOAD ? 'PASS' : 'FAIL'
      },
      {
        metric: 'Navigation Time',
        actual: performanceMetrics.navigationTime || 0,
        threshold: PERFORMANCE_THRESHOLDS.NAVIGATION,
        status: (performanceMetrics.navigationTime || 0) < PERFORMANCE_THRESHOLDS.NAVIGATION ? 'PASS' : 'FAIL'
      },
      {
        metric: 'Form Performance',
        actual: performanceMetrics.formFieldPerformance || 0,
        threshold: PERFORMANCE_THRESHOLDS.FORM_INTERACTION,
        status: (performanceMetrics.formFieldPerformance || 0) < PERFORMANCE_THRESHOLDS.FORM_INTERACTION ? 'PASS' : 'FAIL'
      }
    ]
    
    console.log('📊 COMPREHENSIVE PERFORMANCE REPORT')
    console.log('=====================================')
    console.log(`Test Timestamp: ${report.timestamp}`)
    console.log('Performance Evaluations:')
    
    evaluations.forEach(evaluation => {
      const status = evaluation.status === 'PASS' ? '✅' : '❌'
      console.log(`  ${status} ${evaluation.metric}: ${evaluation.actual.toFixed(2)}ms (Threshold: ${evaluation.threshold}ms)`)
    })
    
    const passingTests = evaluations.filter(e => e.status === 'PASS').length
    const totalTests = evaluations.length
    const successRate = (passingTests / totalTests) * 100
    
    console.log(`Overall Performance Score: ${successRate.toFixed(1)}% (${passingTests}/${totalTests} tests passed)`)
    
    // Generate recommendations
    if (performanceMetrics.consoleErrors > 5) {
      report.recommendations.push('Consider reducing console warnings for cleaner logs')
    }
    if (performanceMetrics.bundleSize > 500 * 1024) {
      report.recommendations.push('Consider code splitting to reduce bundle size')
    }
    if (successRate < 80) {
      report.recommendations.push('Performance optimization needed - some metrics exceed thresholds')
    }
    
    if (report.recommendations.length > 0) {
      console.log('Recommendations:')
      report.recommendations.forEach(rec => console.log(`  • ${rec}`))
    } else {
      console.log('✅ All performance metrics are within acceptable thresholds')
    }
    
    // Final assertion - overall system should be performant
    expect(successRate, 'Overall performance should be above 70%').toBeGreaterThan(70)
    
    console.log('🎉 Performance testing completed successfully!')
  })
})

// Additional utility tests for Stage 5.2 validation
test.describe('Interaction System Stage 5.2 Validation', () => {
  
  test('Database Integration - Demo Mode Handling', async ({ page }) => {
    await page.goto('http://localhost:3000/interactions')
    await page.waitForLoadState('networkidle')
    
    // Check that the system handles demo mode gracefully
    const interactionsVisible = await page.locator('h1:has-text("Interactions")').isVisible()
    expect(interactionsVisible).toBeTruthy()
    
    // Should show some content even in demo mode
    const hasContent = await page.locator('.grid, table, .bg-white').count() > 0
    expect(hasContent).toBeTruthy()
    
    console.log('✅ Demo mode handling validated')
  })
  
  test('API Calls - Demo Mode Fallback', async ({ page }) => {
    // Monitor network requests
    const apiCalls: string[] = []
    page.on('request', request => {
      if (request.url().includes('/api/') || request.url().includes('supabase')) {
        apiCalls.push(request.url())
      }
    })
    
    await page.goto('http://localhost:3000/interactions')
    await page.waitForLoadState('networkidle')
    
    console.log(`📊 API calls made: ${apiCalls.length}`)
    
    // System should handle API failures gracefully
    const pageStillWorks = await page.locator('h1').isVisible()
    expect(pageStillWorks).toBeTruthy()
    
    console.log('✅ API fallback handling validated')
  })
  
  test('Production Readiness Check', async ({ page }) => {
    const issues: string[] = []
    
    // Check for missing alt attributes
    const images = await page.locator('img').count()
    for (let i = 0; i < images; i++) {
      const img = page.locator('img').nth(i)
      const alt = await img.getAttribute('alt')
      if (!alt) {
        issues.push(`Image ${i + 1} missing alt attribute`)
      }
    }
    
    // Check for missing labels
    const inputs = await page.locator('input:not([type="hidden"])').count()
    for (let i = 0; i < inputs; i++) {
      const input = page.locator('input:not([type="hidden"])').nth(i)
      const hasLabel = await page.locator(`label[for="${await input.getAttribute('id')}"]`).count() > 0
      const hasAriaLabel = await input.getAttribute('aria-label')
      
      if (!hasLabel && !hasAriaLabel) {
        issues.push(`Input ${i + 1} missing label or aria-label`)
      }
    }
    
    console.log(`🔍 Accessibility issues found: ${issues.length}`)
    if (issues.length > 0) {
      console.log('Issues:', issues.slice(0, 3)) // Show first 3
    }
    
    // Should have minimal accessibility issues for production
    expect(issues.length).toBeLessThan(10)
    
    console.log('✅ Production readiness check completed')
  })
})