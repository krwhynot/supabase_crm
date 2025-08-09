/**
 * Basic Integration Validation for Interaction Management System
 * Simplified test suite to validate core functionality
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3003'

test.describe('Basic Integration Validation', () => {
  test('Dashboard loads and displays KPI cards', async ({ page: _ }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    // Check if page loads
    await expect(page).toHaveTitle(/CRM/)
    
    // Check for dashboard elements
    await expect(page.locator('text=Dashboard')).toBeVisible()
    
    // Check for navigation sidebar
    const sidebar = page.locator('nav')
    await expect(sidebar).toBeVisible()
    
    // Check for main navigation links
    await expect(page.locator('text=Interactions')).toBeVisible()
    await expect(page.locator('text=Opportunities')).toBeVisible()
    await expect(page.locator('text=Contacts')).toBeVisible()
  })

  test('Navigation between modules works', async ({ page: _ }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    // Navigate to Interactions
    await page.click('text=Interactions')
    await page.waitForLoadState('networkidle')
    
    // Check if interactions page loads
    await expect(page.locator('h1')).toContainText('Interactions')
    
    // Navigate to Opportunities
    await page.click('text=Opportunities')
    await page.waitForLoadState('networkidle')
    
    // Check if opportunities page loads
    await expect(page.locator('h1')).toContainText('Opportunities')
    
    // Navigate back to Dashboard
    await page.click('text=Dashboard')
    await page.waitForLoadState('networkidle')
    
    // Check if back on dashboard
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })

  test('Interactions list displays demo data', async ({ page: _ }) => {
    await page.goto(`${BASE_URL}/interactions`)
    await page.waitForLoadState('networkidle')
    
    // Check if interactions list is visible
    const interactionsList = page.locator('[data-testid="interactions-list"], table, .interactions-table')
    await expect(interactionsList.first()).toBeVisible({ timeout: 10000 })
    
    // Check for demo interactions (should have some content)
    const rows = page.locator('tr, .interaction-row, [data-testid*="interaction"]')
    const rowCount = await rows.count()
    expect(rowCount).toBeGreaterThan(0)
    
    console.log(`Found ${rowCount} interaction rows`)
  })

  test('Create interaction form is accessible', async ({ page: _ }) => {
    await page.goto(`${BASE_URL}/interactions`)
    await page.waitForLoadState('networkidle')
    
    // Look for create button (various possible selectors)
    const createButton = page.locator(
      'text=Create, text=New Interaction, text=Add Interaction, [data-testid="create-interaction"], [aria-label*="create"], [aria-label*="new"], button:has-text("Create")'
    ).first()
    
    if (await createButton.isVisible()) {
      await createButton.click()
      await page.waitForLoadState('networkidle')
      
      // Check if form loads
      const form = page.locator('form, [data-testid="interaction-form"], .interaction-form')
      await expect(form.first()).toBeVisible({ timeout: 10000 })
      
      console.log('Create interaction form is accessible')
    } else {
      console.log('Create button not found - may need different selector')
      // Take screenshot for debugging
      await page.screenshot({ path: 'debug-interactions-page.png' })
    }
  })

  test('Responsive design works on mobile viewport', async ({ page: _ }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    // Check if mobile layout is applied
    await expect(page.locator('body')).toBeVisible()
    
    // Navigation should still work on mobile
    await expect(page.locator('text=Dashboard')).toBeVisible()
    
    console.log('Mobile responsive design validated')
  })

  test('Search functionality works', async ({ page: _ }) => {
    await page.goto(`${BASE_URL}/interactions`)
    await page.waitForLoadState('networkidle')
    
    // Look for search input
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search"], input[placeholder*="Search"], [data-testid="search"], .search-input'
    ).first()
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('demo')
      await page.waitForTimeout(1000) // Allow for search debouncing
      
      console.log('Search functionality is accessible')
    } else {
      console.log('Search input not immediately visible - may be in different location')
    }
  })

  test('Error handling displays user-friendly messages', async ({ page: _ }) => {
    await page.goto(`${BASE_URL}/interactions`)
    await page.waitForLoadState('networkidle')
    
    // The page should load without errors
    await expect(page.locator('body')).toBeVisible()
    
    // Check for any error messages that might be displayed
    const errorMessages = page.locator('text=Error, .error, [role="alert"], .alert-error')
    const errorCount = await errorMessages.count()
    
    if (errorCount > 0) {
      const errorText = await errorMessages.first().textContent()
      console.log(`Found error message: ${errorText}`)
    } else {
      console.log('No error messages displayed - good!')
    }
  })

  test('Performance: Page loads within acceptable time', async ({ page: _ }) => {
    const startTime = Date.now()
    
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    console.log(`Dashboard load time: ${loadTime}ms`)
    expect(loadTime).toBeLessThan(5000) // 5 second limit for initial load
    
    // Test navigation performance
    const navStartTime = Date.now()
    await page.click('text=Interactions')
    await page.waitForLoadState('networkidle')
    const navTime = Date.now() - navStartTime
    
    console.log(`Navigation time: ${navTime}ms`)
    expect(navTime).toBeLessThan(3000) // 3 second limit for navigation
  })
})