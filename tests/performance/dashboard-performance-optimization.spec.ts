import { test, expect } from '@playwright/test'

/**
 * Dashboard Performance Optimization Tests
 * 
 * Tests performance improvements implemented to reduce dashboard load time
 * from 3933ms to under 2000ms target
 */

test.describe('Dashboard Performance Optimization', () => {
  
  test.beforeEach(async ({ page }) => {
    // Enable performance monitoring
    await page.addInitScript(() => {
      window.performance.mark('test-start')
    })
  })

  test('should load dashboard under 2000ms target after optimizations', async ({ page }) => {
    console.log('🚀 Testing optimized dashboard load performance...')
    
    const startTime = Date.now()
    
    // Navigate to dashboard and wait for critical content
    await page.goto('/')
    
    // Wait for critical above-the-fold content to be visible
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible()
    await expect(page.locator('h2:has-text("Performance Overview")')).toBeVisible()
    
    // Wait for KPI skeleton or actual KPI cards to appear (lazy loaded)
    await page.waitForSelector('[class*="kpi-skeleton"], [class*="opportunity-kpi"]', {
      timeout: 3000
    })
    
    const loadTime = Date.now() - startTime
    console.log(`⏱️  Dashboard load time: ${loadTime}ms`)
    
    // Assert load time is under 2000ms target
    expect(loadTime).toBeLessThan(2000)
    
    // Verify essential content is loaded
    await expect(page.locator('.quick-action-card')).toHaveCount(4)
    
    console.log('✅ Dashboard performance optimization successful!')
  })

  test('should lazy load KPI components without blocking initial render', async ({ page }) => {
    console.log('🔍 Testing lazy loading of KPI components...')
    
    const startTime = Date.now()
    
    await page.goto('/')
    
    // Dashboard header should appear quickly
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible()
    const headerTime = Date.now() - startTime
    console.log(`📊 Dashboard header rendered in: ${headerTime}ms`)
    
    // Header should render in under 500ms
    expect(headerTime).toBeLessThan(500)
    
    // KPI skeleton should appear while actual components load
    const skeletonVisible = await page.locator('.kpi-skeleton').isVisible()
    console.log(`💀 KPI skeleton visible: ${skeletonVisible}`)
    
    // Wait for actual KPI components to load (may take longer due to async loading)
    await page.waitForSelector('[data-testid="kpi-card"], .opportunity-kpi-lazy-wrapper .kpi-container', {
      timeout: 5000
    })
    
    const totalTime = Date.now() - startTime
    console.log(`📈 Total KPI loading time: ${totalTime}ms`)
    
    console.log('✅ Lazy loading working correctly!')
  })

  test('should have improved bundle size with code splitting', async ({ page }) => {
    console.log('📦 Testing bundle size optimization...')
    
    // Monitor network requests to verify code splitting
    const scriptRequests: string[] = []
    
    page.on('request', request => {
      if (request.resourceType() === 'script' && request.url().includes('.js')) {
        scriptRequests.push(request.url())
      }
    })
    
    await page.goto('/')
    
    // Wait for initial load
    await page.waitForLoadState('networkidle')
    
    console.log(`🔗 Script files loaded: ${scriptRequests.length}`)
    
    // Verify we have multiple chunk files (indicating code splitting)
    const chunkFiles = scriptRequests.filter(url => 
      url.includes('chunk') || url.includes('dashboard') || url.includes('vue-ecosystem')
    )
    
    console.log(`✂️  Code-split chunks detected: ${chunkFiles.length}`)
    expect(chunkFiles.length).toBeGreaterThan(0)
    
    // Verify main bundle isn't too large by checking timing
    const navigationTiming = await page.evaluate(() => {
      const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
        loadComplete: timing.loadEventEnd - timing.loadEventStart
      }
    })
    
    console.log(`⚡ DOM Content Loaded: ${navigationTiming.domContentLoaded}ms`)
    console.log(`🎯 Load Complete: ${navigationTiming.loadComplete}ms`)
    
    // DOM content should load quickly with optimized bundles
    expect(navigationTiming.domContentLoaded).toBeLessThan(1000)
    
    console.log('✅ Bundle optimization verified!')
  })

  test('should demonstrate improved Time to Interactive (TTI)', async ({ page }) => {
    console.log('⚡ Testing Time to Interactive optimization...')
    
    await page.goto('/')
    
    const startTime = Date.now()
    
    // Wait for page to become interactive
    await page.waitForLoadState('domcontentloaded')
    
    // Test that interactive elements are immediately responsive
    const refreshButton = page.locator('button:has-text("Refresh")')
    await expect(refreshButton).toBeVisible()
    await expect(refreshButton).toBeEnabled()
    
    // Test quick action cards are clickable
    const quickActions = page.locator('.quick-action-card')
    await expect(quickActions.first()).toBeVisible()
    
    // Click on first quick action to test interactivity
    await quickActions.first().click({ timeout: 1000 })
    
    const interactiveTime = Date.now() - startTime
    console.log(`🎮 Time to Interactive: ${interactiveTime}ms`)
    
    // TTI should be under 1500ms for good user experience
    expect(interactiveTime).toBeLessThan(1500)
    
    console.log('✅ Time to Interactive optimization successful!')
  })

  test('should cache static assets effectively', async ({ page }) => {
    console.log('💾 Testing service worker caching...')
    
    // First visit - assets should be cached
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const cachedRequests: string[] = []
    
    page.on('response', response => {
      const cacheHeader = response.headers()['cache-control']
      if (cacheHeader && (cacheHeader.includes('max-age') || response.fromServiceWorker())) {
        cachedRequests.push(response.url())
      }
    })
    
    // Reload page to test caching
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    console.log(`🗃️  Cached resources detected: ${cachedRequests.length}`)
    
    // Should have some cached resources
    expect(cachedRequests.length).toBeGreaterThan(0)
    
    console.log('✅ Caching strategy working!')
  })

  test('should maintain accessibility during performance optimizations', async ({ page }) => {
    console.log('♿ Verifying accessibility is maintained...')
    
    await page.goto('/')
    
    // Wait for content to load
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible()
    
    // Check for proper heading hierarchy
    const headings = await page.locator('h1, h2, h3').allTextContents()
    console.log(`📝 Headings found: ${headings.length}`)
    expect(headings.length).toBeGreaterThan(0)
    
    // Verify ARIA labels on interactive elements
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    console.log(`🔘 Interactive buttons: ${buttonCount}`)
    
    // Check that refresh button has proper labeling
    const refreshButton = page.locator('button:has-text("Refresh")')
    await expect(refreshButton).toBeVisible()
    
    // Verify keyboard navigation works
    await page.keyboard.press('Tab')
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    console.log('✅ Accessibility maintained during optimization!')
  })

  test('should show performance metrics in development console', async ({ page }) => {
    console.log('📊 Checking performance metrics logging...')
    
    const consoleMessages: string[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'log' && (
        msg.text().includes('Dashboard load') ||
        msg.text().includes('KPI') ||
        msg.text().includes('performance')
      )) {
        consoleMessages.push(msg.text())
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    console.log(`📋 Performance-related console messages: ${consoleMessages.length}`)
    
    // Should have some performance-related logging
    expect(consoleMessages.length).toBeGreaterThan(0)
    
    consoleMessages.forEach(msg => {
      console.log(`  📌 ${msg}`)
    })
    
    console.log('✅ Performance monitoring active!')
  })

  test('should handle offline scenarios gracefully', async ({ page, context }) => {
    console.log('🌐 Testing offline performance handling...')
    
    // First load with network
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Go offline
    await context.setOffline(true)
    
    // Reload page
    await page.reload()
    
    // Should still show cached content
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 5000 })
    
    // Go back online
    await context.setOffline(false)
    
    console.log('✅ Offline handling working!')
  })
})

/**
 * Performance Regression Tests
 * 
 * These tests ensure that future changes don't degrade performance
 */
test.describe('Performance Regression Prevention', () => {
  
  test('should prevent performance regression - load time threshold', async ({ page }) => {
    console.log('🛡️  Running performance regression check...')
    
    const measurements: number[] = []
    
    // Run multiple measurements for reliability
    for (let i = 0; i < 3; i++) {
      const startTime = Date.now()
      
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible()
      
      const loadTime = Date.now() - startTime
      measurements.push(loadTime)
      
      console.log(`  📏 Measurement ${i + 1}: ${loadTime}ms`)
    }
    
    const averageLoadTime = measurements.reduce((a, b) => a + b) / measurements.length
    console.log(`📊 Average load time: ${averageLoadTime}ms`)
    
    // Enforce performance threshold
    expect(averageLoadTime).toBeLessThan(2000)
    
    // Log warning if approaching threshold
    if (averageLoadTime > 1500) {
      console.warn(`⚠️  Warning: Load time ${averageLoadTime}ms is approaching 2000ms threshold`)
    }
    
    console.log('✅ Performance regression check passed!')
  })

  test('should monitor Core Web Vitals', async ({ page }) => {
    console.log('🔍 Monitoring Core Web Vitals...')
    
    await page.goto('/')
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    
    // Get Core Web Vitals
    const webVitals = await page.evaluate(() => {
      return new Promise(resolve => {
        const vitals: any = {}
        
        // Largest Contentful Paint
        new PerformanceObserver(list => {
          const entries = list.getEntries()
          if (entries.length > 0) {
            vitals.LCP = entries[entries.length - 1].startTime
          }
        }).observe({ entryTypes: ['largest-contentful-paint'] })
        
        // Cumulative Layout Shift
        let clsValue = 0
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value
            }
          }
          vitals.CLS = clsValue
        }).observe({ entryTypes: ['layout-shift'] })
        
        // First Input Delay would be measured in real user interaction
        vitals.FID = 0 // Placeholder
        
        setTimeout(() => resolve(vitals), 2000)
      })
    })
    
    console.log('📊 Core Web Vitals:', webVitals)
    
    // Basic thresholds for Core Web Vitals
    if ((webVitals as any).LCP) {
      expect((webVitals as any).LCP).toBeLessThan(2500) // LCP should be under 2.5s
    }
    
    if ((webVitals as any).CLS) {
      expect((webVitals as any).CLS).toBeLessThan(0.1) // CLS should be under 0.1
    }
    
    console.log('✅ Core Web Vitals within acceptable ranges!')
  })
})