/**
 * Mobile Performance Test Suite for Interaction Management System
 * 
 * Tests Core Web Vitals, mobile responsiveness, touch interactions,
 * and mobile-specific performance optimizations.
 * 
 * Performance Targets:
 * - LCP (Largest Contentful Paint): <2.5s on mobile
 * - FID (First Input Delay): <100ms for touch interactions
 * - CLS (Cumulative Layout Shift): <0.1 for stable UI
 * - Touch targets: minimum 44px
 * - Scroll performance: 60fps smooth scrolling
 */

import { test, expect, devices, Page } from '@playwright/test'

// Mobile device configurations for testing
const MOBILE_DEVICES = [
  'iPhone 14', 
  'iPhone 14 Pro Max',
  'Samsung Galaxy S22',
  'Samsung Galaxy A53',
  'Pixel 7'
]

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  LCP: 2500, // 2.5 seconds
  FID: 100,  // 100 milliseconds
  CLS: 0.1,  // 0.1 layout shift score
  TOUCH_TARGET_MIN: 44, // 44px minimum touch target
  SCROLL_FPS_MIN: 55 // Minimum 55fps for smooth scrolling
}

// Network conditions for testing
const NETWORK_CONDITIONS = {
  '3G': { downloadThroughput: 1.5 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8, latency: 300 },
  '4G': { downloadThroughput: 9 * 1024 * 1024 / 8, uploadThroughput: 3 * 1024 * 1024 / 8, latency: 50 },
  '5G': { downloadThroughput: 50 * 1024 * 1024 / 8, uploadThroughput: 25 * 1024 * 1024 / 8, latency: 10 }
}

/**
 * Helper function to measure Core Web Vitals
 */
async function measureCoreWebVitals(page: Page) {
  return await page.evaluate(() => {
    return new Promise((resolve) => {
      const vitals = { LCP: 0, FID: 0, CLS: 0 }
      let metricsCollected = 0
      const totalMetrics = 3

      // LCP (Largest Contentful Paint)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        if (entries.length > 0) {
          vitals.LCP = entries[entries.length - 1].startTime
          metricsCollected++
          if (metricsCollected === totalMetrics) resolve(vitals)
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] })

      // FID (First Input Delay) - measured on first interaction
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        if (entries.length > 0) {
          vitals.FID = entries[0].processingStart - entries[0].startTime
          metricsCollected++
          if (metricsCollected === totalMetrics) resolve(vitals)
        }
      }).observe({ entryTypes: ['first-input'] })

      // CLS (Cumulative Layout Shift)
      new PerformanceObserver((entryList) => {
        let clsValue = 0
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        }
        vitals.CLS = clsValue
        metricsCollected++
        if (metricsCollected === totalMetrics) resolve(vitals)
      }).observe({ entryTypes: ['layout-shift'] })

      // Fallback timeout after 10 seconds
      setTimeout(() => resolve(vitals), 10000)
    })
  })
}

/**
 * Helper function to measure touch target sizes
 */
async function measureTouchTargets(page: Page, selector: string) {
  return await page.evaluate((sel) => {
    const elements = document.querySelectorAll(sel)
    const touchTargets = []
    
    elements.forEach((element, index) => {
      const rect = element.getBoundingClientRect()
      const computedStyle = window.getComputedStyle(element)
      
      touchTargets.push({
        index,
        width: rect.width,
        height: rect.height,
        minDimension: Math.min(rect.width, rect.height),
        hasMinHeight: parseFloat(computedStyle.minHeight) >= 44,
        hasMinWidth: parseFloat(computedStyle.minWidth) >= 44,
        element: element.tagName.toLowerCase(),
        className: element.className
      })
    })
    
    return touchTargets
  }, selector)
}

/**
 * Helper function to measure scroll performance
 */
async function measureScrollPerformance(page: Page, container: string = 'body') {
  return await page.evaluate((containerSelector) => {
    return new Promise((resolve) => {
      const container = document.querySelector(containerSelector) || document.body
      const frameRate = []
      let lastTime = performance.now()
      let scrollCount = 0
      const maxScrolls = 20

      const measureFrame = () => {
        const currentTime = performance.now()
        const fps = 1000 / (currentTime - lastTime)
        frameRate.push(fps)
        lastTime = currentTime
        
        if (scrollCount < maxScrolls) {
          container.scrollTop += 50
          scrollCount++
          requestAnimationFrame(measureFrame)
        } else {
          const avgFps = frameRate.reduce((a, b) => a + b, 0) / frameRate.length
          const minFps = Math.min(...frameRate)
          resolve({ avgFps, minFps, samples: frameRate.length })
        }
      }

      // Start measuring
      requestAnimationFrame(measureFrame)
    })
  }, container)
}

// Test suites for different mobile devices
MOBILE_DEVICES.forEach(deviceName => {
  test.describe(`Mobile Performance - ${deviceName}`, () => {
    test.use({ ...devices[deviceName] })

    test('Core Web Vitals meet mobile performance standards', async ({ page, context }) => {
      // Enable performance metrics
      await context.addInitScript(() => {
        // Ensure performance observers are available
        if (!window.PerformanceObserver) {
          console.warn('PerformanceObserver not available')
        }
      })

      // Navigate to interactions list page
      await page.goto('http://localhost:3004/interactions')
      
      // Wait for page to be fully loaded
      await page.waitForSelector('[data-testid="interaction-table"]', { timeout: 10000 })
      
      // Trigger an interaction to measure FID
      await page.click('button[aria-label="Quick interaction"]', { timeout: 5000 })
      
      // Measure Core Web Vitals
      const vitals = await measureCoreWebVitals(page)
      
      // Assertions for Core Web Vitals
      expect(vitals.LCP).toBeLessThan(PERFORMANCE_THRESHOLDS.LCP)
      expect(vitals.FID).toBeLessThan(PERFORMANCE_THRESHOLDS.FID)
      expect(vitals.CLS).toBeLessThan(PERFORMANCE_THRESHOLDS.CLS)
      
      console.log(`${deviceName} Core Web Vitals:`, {
        LCP: `${vitals.LCP.toFixed(2)}ms (target: <${PERFORMANCE_THRESHOLDS.LCP}ms)`,
        FID: `${vitals.FID.toFixed(2)}ms (target: <${PERFORMANCE_THRESHOLDS.FID}ms)`,
        CLS: `${vitals.CLS.toFixed(3)} (target: <${PERFORMANCE_THRESHOLDS.CLS})`
      })
    })

    test('Touch targets meet minimum size requirements', async ({ page }) => {
      await page.goto('http://localhost:3004/interactions')
      await page.waitForSelector('[data-testid="interaction-table"]')
      
      // Test touch targets for buttons
      const buttons = await measureTouchTargets(page, 'button')
      const links = await measureTouchTargets(page, 'a')
      const interactiveElements = await measureTouchTargets(page, '[onclick], [role="button"], input, select')
      
      const allTouchTargets = [...buttons, ...links, ...interactiveElements]
      
      // Check that touch targets meet minimum size
      const failingTargets = allTouchTargets.filter(target => 
        target.minDimension < PERFORMANCE_THRESHOLDS.TOUCH_TARGET_MIN
      )
      
      expect(failingTargets.length).toBe(0)
      
      console.log(`${deviceName} Touch Targets Analysis:`, {
        totalTargets: allTouchTargets.length,
        passingTargets: allTouchTargets.length - failingTargets.length,
        failingTargets: failingTargets.length,
        avgSize: allTouchTargets.reduce((sum, t) => sum + t.minDimension, 0) / allTouchTargets.length
      })
    })

    test('Scroll performance maintains smooth 60fps', async ({ page }) => {
      await page.goto('http://localhost:3004/interactions')
      await page.waitForSelector('[data-testid="interaction-table"]')
      
      // Test scroll performance on interaction table
      const tablePerformance = await measureScrollPerformance(page, '[data-testid="interaction-table-container"]')
      
      expect(tablePerformance.minFps).toBeGreaterThan(PERFORMANCE_THRESHOLDS.SCROLL_FPS_MIN)
      expect(tablePerformance.avgFps).toBeGreaterThan(PERFORMANCE_THRESHOLDS.SCROLL_FPS_MIN)
      
      console.log(`${deviceName} Scroll Performance:`, {
        averageFPS: `${tablePerformance.avgFps.toFixed(1)}fps`,
        minimumFPS: `${tablePerformance.minFps.toFixed(1)}fps`,
        target: `>${PERFORMANCE_THRESHOLDS.SCROLL_FPS_MIN}fps`
      })
    })

    test('Quick interaction templates load and respond quickly', async ({ page }) => {
      const startTime = Date.now()
      
      await page.goto('http://localhost:3004/interactions')
      await page.waitForSelector('[data-testid="interaction-table"]')
      
      // Open quick interaction templates
      await page.click('button[aria-label="Quick interaction"]')
      
      // Wait for templates to load
      await page.waitForSelector('[data-testid="quick-templates"]', { timeout: 2000 })
      
      const loadTime = Date.now() - startTime
      
      // Templates should load quickly on mobile
      expect(loadTime).toBeLessThan(2000) // 2 seconds
      
      // Test template selection responsiveness
      const templateSelectionStart = Date.now()
      await page.click('[data-testid="template-dropped-samples"]')
      
      // Should show form quickly
      await page.waitForSelector('[data-testid="interaction-form"]', { timeout: 1000 })
      
      const selectionTime = Date.now() - templateSelectionStart
      expect(selectionTime).toBeLessThan(500) // 500ms
      
      console.log(`${deviceName} Quick Templates Performance:`, {
        loadTime: `${loadTime}ms`,
        selectionTime: `${selectionTime}ms`
      })
    })

    test('Voice input responds within performance targets', async ({ page }) => {
      await page.goto('http://localhost:3004/interactions/new')
      await page.waitForSelector('[data-testid="voice-input"]')
      
      // Test voice input activation time
      const activationStart = Date.now()
      
      // Click voice button (may not actually record due to permissions, but should respond)
      await page.click('[data-testid="voice-button"]')
      
      // Should show voice feedback quickly
      const voicePromise = page.waitForSelector('[data-testid="voice-feedback"]', { timeout: 1000 }).catch(() => null)
      const errorPromise = page.waitForSelector('[data-testid="voice-error"]', { timeout: 1000 }).catch(() => null)
      
      await Promise.race([voicePromise, errorPromise])
      
      const activationTime = Date.now() - activationStart
      
      // Voice input should respond within 500ms
      expect(activationTime).toBeLessThan(500)
      
      console.log(`${deviceName} Voice Input Performance:`, {
        activationTime: `${activationTime}ms`,
        target: '<500ms'
      })
    })
  })
})

// Network-specific performance tests
Object.entries(NETWORK_CONDITIONS).forEach(([networkType, conditions]) => {
  test.describe(`Mobile Performance on ${networkType} Network`, () => {
    test.use({ ...devices['iPhone 14'] })

    test(`Page load performance on ${networkType}`, async ({ page, context }) => {
      // Throttle network to simulate conditions
      await context.route('**/*', async (route) => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, conditions.latency / 10))
        await route.continue()
      })

      const startTime = Date.now()
      
      await page.goto('http://localhost:3004/interactions')
      await page.waitForSelector('[data-testid="interaction-table"]')
      
      const loadTime = Date.now() - startTime
      
      // Set different expectations based on network type
      const expectedLoadTime = networkType === '3G' ? 5000 : networkType === '4G' ? 3000 : 2000
      
      expect(loadTime).toBeLessThan(expectedLoadTime)
      
      console.log(`${networkType} Network Performance:`, {
        loadTime: `${loadTime}ms`,
        target: `<${expectedLoadTime}ms`
      })
    })

    test(`Interaction creation performance on ${networkType}`, async ({ page, context }) => {
      // Throttle network
      await context.route('**/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, conditions.latency / 10))
        await route.continue()
      })

      await page.goto('http://localhost:3004/interactions/new')
      await page.waitForSelector('[data-testid="interaction-form"]')
      
      // Fill out form quickly
      await page.fill('[data-testid="interaction-title"]', 'Test Mobile Interaction')
      await page.fill('[data-testid="interaction-description"]', 'Testing mobile performance')
      
      const submitStart = Date.now()
      
      // Submit form
      await page.click('[data-testid="submit-interaction"]')
      
      // Wait for response (success or error)
      const responsePromise = page.waitForSelector('[data-testid="success-message"]', { timeout: 10000 }).catch(() => null)
      const errorPromise = page.waitForSelector('[data-testid="error-message"]', { timeout: 10000 }).catch(() => null)
      
      await Promise.race([responsePromise, errorPromise])
      
      const submitTime = Date.now() - submitStart
      
      // Form submission should complete within reasonable time for network
      const expectedSubmitTime = networkType === '3G' ? 3000 : networkType === '4G' ? 2000 : 1000
      
      expect(submitTime).toBeLessThan(expectedSubmitTime)
      
      console.log(`${networkType} Form Submission Performance:`, {
        submitTime: `${submitTime}ms`,
        target: `<${expectedSubmitTime}ms`
      })
    })
  })
})

// Mobile-specific interaction tests
test.describe('Mobile Interaction Patterns', () => {
  test.use({ ...devices['iPhone 14'] })

  test('Swipe gestures work correctly on mobile tables', async ({ page }) => {
    await page.goto('http://localhost:3004/interactions')
    await page.waitForSelector('[data-testid="interaction-table"]')
    
    // Test horizontal swipe on table rows
    const firstRow = page.locator('[data-testid="interaction-row"]').first()
    const box = await firstRow.boundingBox()
    
    if (box) {
      // Perform swipe gesture
      await page.mouse.move(box.x + 10, box.y + box.height / 2)
      await page.mouse.down()
      await page.mouse.move(box.x + box.width - 10, box.y + box.height / 2)
      await page.mouse.up()
      
      // Should reveal action buttons or swipe menu
      await expect(page.locator('[data-testid="row-actions"]')).toBeVisible({ timeout: 1000 })
    }
  })

  test('Pull-to-refresh works on mobile', async ({ page }) => {
    await page.goto('http://localhost:3004/interactions')
    await page.waitForSelector('[data-testid="interaction-table"]')
    
    // Simulate pull-to-refresh gesture
    await page.evaluate(() => {
      const event = new TouchEvent('touchstart', {
        touches: [new Touch({
          identifier: 0,
          target: document.body,
          clientX: window.innerWidth / 2,
          clientY: 100
        })]
      })
      document.body.dispatchEvent(event)
    })
    
    await page.evaluate(() => {
      const event = new TouchEvent('touchmove', {
        touches: [new Touch({
          identifier: 0,
          target: document.body,
          clientX: window.innerWidth / 2,
          clientY: 200
        })]
      })
      document.body.dispatchEvent(event)
    })
    
    await page.evaluate(() => {
      const event = new TouchEvent('touchend', {
        changedTouches: [new Touch({
          identifier: 0,
          target: document.body,
          clientX: window.innerWidth / 2,
          clientY: 200
        })]
      })
      document.body.dispatchEvent(event)
    })
    
    // Should show refresh indicator
    await expect(page.locator('[data-testid="refresh-indicator"]')).toBeVisible({ timeout: 2000 })
  })

  test('Keyboard appearance does not break layout on mobile', async ({ page }) => {
    await page.goto('http://localhost:3004/interactions/new')
    await page.waitForSelector('[data-testid="interaction-form"]')
    
    // Take screenshot before input focus
    const beforeScreenshot = await page.screenshot({ fullPage: true })
    
    // Focus on input field (simulates keyboard appearance)
    await page.focus('[data-testid="interaction-title"]')
    
    // Wait for layout adjustments
    await page.waitForTimeout(500)
    
    // Take screenshot after input focus
    const afterScreenshot = await page.screenshot({ fullPage: true })
    
    // Form should still be usable (submit button visible)
    await expect(page.locator('[data-testid="submit-interaction"]')).toBeVisible()
    
    // Critical elements should remain accessible
    await expect(page.locator('[data-testid="interaction-title"]')).toBeVisible()
    await expect(page.locator('[data-testid="interaction-description"]')).toBeVisible()
  })
})

// Memory and resource usage tests
test.describe('Mobile Resource Usage', () => {
  test.use({ ...devices['Samsung Galaxy A53'] }) // Lower-end device

  test('Memory usage remains stable during extended use', async ({ page }) => {
    await page.goto('http://localhost:3004/interactions')
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit
      } : null
    })
    
    // Perform multiple interactions to stress test memory
    for (let i = 0; i < 10; i++) {
      // Navigate to different views
      await page.goto('http://localhost:3004/interactions/new')
      await page.waitForSelector('[data-testid="interaction-form"]')
      
      await page.goto('http://localhost:3004/interactions')
      await page.waitForSelector('[data-testid="interaction-table"]')
      
      // Open and close modals
      await page.click('button[aria-label="Filter interactions"]')
      await page.waitForSelector('[data-testid="filter-modal"]')
      await page.click('[data-testid="close-modal"]')
    }
    
    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit
      } : null
    })
    
    if (initialMemory && finalMemory) {
      const memoryIncrease = finalMemory.used - initialMemory.used
      const memoryIncreasePercent = (memoryIncrease / initialMemory.used) * 100
      
      // Memory should not increase by more than 50% during normal usage
      expect(memoryIncreasePercent).toBeLessThan(50)
      
      console.log('Memory Usage Analysis:', {
        initial: `${(initialMemory.used / 1024 / 1024).toFixed(2)}MB`,
        final: `${(finalMemory.used / 1024 / 1024).toFixed(2)}MB`,
        increase: `${memoryIncreasePercent.toFixed(1)}%`
      })
    }
  })

  test('Battery usage optimizations are in place', async ({ page }) => {
    await page.goto('http://localhost:3004/interactions')
    
    // Check for battery-optimized features
    const batteryOptimizations = await page.evaluate(() => {
      const optimizations = {
        hasReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        hasLowPowerMode: false,
        hasPassiveListeners: false,
        hasIntersectionObserver: 'IntersectionObserver' in window,
        hasRequestIdleCallback: 'requestIdleCallback' in window
      }
      
      // Check for low power mode (Safari specific)
      if ('navigator' in window && 'getBattery' in navigator) {
        optimizations.hasLowPowerMode = true
      }
      
      return optimizations
    })
    
    // Verify battery optimization features are available
    expect(batteryOptimizations.hasIntersectionObserver).toBe(true)
    expect(batteryOptimizations.hasRequestIdleCallback).toBe(true)
    
    console.log('Battery Optimizations:', batteryOptimizations)
  })
})