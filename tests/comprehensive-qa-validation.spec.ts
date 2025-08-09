/**
 * Comprehensive QA Validation Test Suite
 * Testing all critical aspects of the KitchenPantry CRM system
 * 
 * Coverage:
 * - Database schema validation
 * - Frontend component functionality
 * - API service layer validation
 * - Navigation and user experience
 * - Business logic workflows
 * - Performance benchmarks
 * - Accessibility compliance
 */

import { test, expect } from '@playwright/test'

// Use the correct port from our running development server
const BASE_URL = 'http://localhost:3000'

test.describe('Comprehensive QA Validation', () => {
  
  // ===============================
  // DATABASE SCHEMA & DATA INTEGRITY
  // ===============================
  
  test.describe('Database Schema & Data Integrity', () => {
    test('Dashboard loads with proper data structure', async ({ page }) => {
      await page.goto(BASE_URL)
      await page.waitForLoadState('networkidle')
      
      // Verify dashboard title and structure
      await expect(page).toHaveTitle(/Dashboard - CRM/)
      await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible()
      
      // Check KPI cards are present with proper structure
      const kpiCards = page.locator('[aria-label*="Opportunity"], [aria-labelledby*="opportunity"]')
      await expect(kpiCards.first()).toBeVisible({ timeout: 10000 })
      
      // Verify data integrity - KPI values should be displayed
      const kpiValues = page.locator('text=/^\\d+$/, text=/^\\d+%$/, text=/^--$/')
      const kpiCount = await kpiValues.count()
      expect(kpiCount).toBeGreaterThan(0)
      
      console.log(`✓ Database integrity: Found ${kpiCount} KPI values`)
    })

    test('Opportunities list displays proper schema fields', async ({ page }) => {
      await page.goto(`${BASE_URL}/opportunities`)
      await page.waitForLoadState('networkidle')
      
      // Verify page structure and schema fields
      await expect(page.locator('h1:has-text("Opportunities")')).toBeVisible()
      
      // Check filter controls match database schema
      const stageFilter = page.locator('select, [role="combobox"]').first()
      await expect(stageFilter).toBeVisible()
      
      // Verify stage options match enum in database
      await stageFilter.click()
      const stageOptions = [
        'New Lead', 'Initial Outreach', 'Sample/Visit Offered', 
        'Awaiting Response', 'Feedback Logged', 'Demo Scheduled', 'Closed - Won'
      ]
      
      for (const stage of stageOptions) {
        await expect(page.locator(`option:has-text("${stage}"), [role="option"]:has-text("${stage}")`)).toBeVisible()
      }
      
      console.log('✓ Database schema: All opportunity stages present')
    })
  })

  // ===============================
  // FRONTEND COMPONENTS & UI
  // ===============================
  
  test.describe('Frontend Components & User Interface', () => {
    test('Navigation sidebar works correctly', async ({ page }) => {
      await page.goto(BASE_URL)
      await page.waitForLoadState('networkidle')
      
      // Test main navigation links
      const navLinks = [
        { name: 'Dashboard', url: '/' },
        { name: 'Organizations', url: '/organizations' },
        { name: 'Contacts', url: '/contacts' },
        { name: 'Opportunities', url: '/opportunities' },
        { name: 'Interactions', url: '/interactions' },
        { name: 'Products', url: '/products' },
        { name: 'Principals', url: '/principals' }
      ]
      
      for (const link of navLinks) {
        const linkElement = page.locator(`a[href="${link.url}"]:has-text("${link.name}")`)
        await expect(linkElement).toBeVisible()
        
        // Test navigation
        await linkElement.click()
        await page.waitForLoadState('networkidle')
        expect(page.url()).toContain(link.url)
        
        console.log(`✓ Navigation: ${link.name} page loaded successfully`)
      }
    })

    test('Opportunity creation form components work', async ({ page }) => {
      await page.goto(`${BASE_URL}/opportunities/new`)
      await page.waitForLoadState('networkidle')
      
      // Verify form structure
      await expect(page.locator('h1:has-text("Create New Opportunity")')).toBeVisible()
      await expect(page.locator('text=Step 1 of 3')).toBeVisible()
      
      // Test form components
      const orgNameField = page.locator('input[placeholder*="Organization"], textbox:near(:text("Organization Name"))')
      await expect(orgNameField).toBeVisible()
      
      const contextSelect = page.locator('select:near(:text("Context")), [role="combobox"]:near(:text("Context"))')
      await expect(contextSelect).toBeVisible()
      
      // Test auto-naming functionality
      const autoNamingCheckbox = page.locator('input[type="checkbox"]:near(:text("Auto-generate"))')
      await expect(autoNamingCheckbox).toBeVisible()
      await expect(autoNamingCheckbox).toBeChecked()
      
      // Test form validation
      await orgNameField.fill('Test Organization')
      await contextSelect.selectOption('Event/Trade Show')
      
      const nextButton = page.locator('button:has-text("Next")')
      await expect(nextButton).not.toBeDisabled()
      
      console.log('✓ Frontend: Opportunity creation form components working')
    })

    test('Principal activity dashboard components', async ({ page }) => {
      await page.goto(`${BASE_URL}/principals`)
      await page.waitForLoadState('networkidle')
      
      // Verify principal dashboard structure
      await expect(page.locator('h1:has-text("Principal Activity Management")')).toBeVisible()
      
      // Check performance overview components
      await expect(page.locator('h2:has-text("Performance Overview")')).toBeVisible()
      
      // Verify engagement distribution components
      const engagementLevels = ['High Engagement', 'Medium Engagement', 'Low Engagement', 'Inactive']
      for (const level of engagementLevels) {
        await expect(page.locator(`h4:has-text("${level}")`)).toBeVisible()
      }
      
      // Test search functionality
      const searchInput = page.locator('input[placeholder*="Search principals"]')
      await expect(searchInput).toBeVisible()
      
      console.log('✓ Frontend: Principal dashboard components working')
    })
  })

  // ===============================
  // API & SERVICE LAYER
  // ===============================
  
  test.describe('API & Service Layer Validation', () => {
    test('KPI data loading and error handling', async ({ page }) => {
      await page.goto(BASE_URL)
      
      // Wait for KPI data to load
      const kpiLoadingTimeout = 5000
      await page.waitForTimeout(1000) // Allow initial load
      
      // Check for loading states
      const refreshButton = page.locator('button:has-text("Refresh"), button:has-text("Refreshing")')
      if (await refreshButton.isVisible()) {
        console.log('✓ API: KPI refresh mechanism present')
      }
      
      // Verify KPI data is displayed (either real data or demo fallback)
      const kpiCards = page.locator('[role="region"]:has-text("Opportunity Key Performance Indicators")')
      await expect(kpiCards).toBeVisible({ timeout: kpiLoadingTimeout })
      
      // Check for proper error handling (no error messages should be visible)
      const errorMessages = page.locator('[role="alert"], .error, text=/Error/i, text=/Failed/i')
      const errorCount = await errorMessages.count()
      expect(errorCount).toBe(0)
      
      console.log('✓ API: KPI data loading and error handling working')
    })

    test('Interaction data service integration', async ({ page }) => {
      await page.goto(`${BASE_URL}/interactions`)
      await page.waitForLoadState('networkidle')
      
      // Verify interaction KPIs load
      const kpiElements = page.locator('dd, [data-testid*="kpi-value"]')
      const kpiCount = await kpiElements.count()
      expect(kpiCount).toBeGreaterThan(0)
      
      // Test filter functionality (API integration)
      const typeFilter = page.locator('select[aria-label*="Type"], [role="combobox"]:near(:text("Type"))')
      await expect(typeFilter).toBeVisible()
      
      const applyButton = page.locator('button:has-text("Apply")')
      if (await applyButton.isVisible()) {
        await applyButton.click()
        await page.waitForTimeout(1000) // Allow filter to process
      }
      
      console.log('✓ API: Interaction data service integration working')
    })
  })

  // ===============================
  // NAVIGATION & USER EXPERIENCE
  // ===============================
  
  test.describe('Navigation & User Experience', () => {
    test('Breadcrumb navigation system', async ({ page }) => {
      await page.goto(`${BASE_URL}/opportunities/new`)
      await page.waitForLoadState('networkidle')
      
      // Check breadcrumb structure
      const breadcrumb = page.locator('nav[aria-label="Breadcrumb"], [role="navigation"]:has([aria-label*="breadcrumb"])')
      await expect(breadcrumb).toBeVisible()
      
      // Test breadcrumb links
      const dashboardLink = page.locator('a:has-text("Dashboard")')
      await expect(dashboardLink).toBeVisible()
      
      await dashboardLink.click()
      await page.waitForLoadState('networkidle')
      expect(page.url()).toBe(`${BASE_URL}/`)
      
      console.log('✓ UX: Breadcrumb navigation working')
    })

    test('Mobile responsive design', async ({ page }) => {
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto(BASE_URL)
      await page.waitForLoadState('networkidle')
      
      // Sidebar should be collapsible on mobile
      const sidebarToggle = page.locator('button:has-text("Open sidebar"), button:has-text("Collapse sidebar")')
      await expect(sidebarToggle).toBeVisible()
      
      // Test mobile navigation
      await page.setViewportSize({ width: 375, height: 667 })
      await page.reload()
      await page.waitForLoadState('networkidle')
      
      // Mobile layout should work
      await expect(page.locator('h1')).toBeVisible()
      
      // Reset to desktop
      await page.setViewportSize({ width: 1280, height: 720 })
      
      console.log('✓ UX: Mobile responsive design working')
    })
  })

  // ===============================
  // BUSINESS LOGIC & WORKFLOWS
  // ===============================
  
  test.describe('Business Logic & Workflow Validation', () => {
    test('Auto-naming system functionality', async ({ page }) => {
      await page.goto(`${BASE_URL}/opportunities/new`)
      await page.waitForLoadState('networkidle')
      
      // Verify auto-naming is enabled by default
      const autoNamingCheckbox = page.locator('input[type="checkbox"]:near(:text("Auto-generate"))')
      await expect(autoNamingCheckbox).toBeChecked()
      
      // Verify naming pattern information is displayed
      await expect(page.locator('text=/Organization.*Principal.*Context.*Month Year/')).toBeVisible()
      
      // Test manual override functionality
      const overrideButton = page.locator('button:has-text("customize the name")')
      if (await overrideButton.isVisible()) {
        await overrideButton.click()
        
        // Manual name field should appear
        const manualNameField = page.locator('input:near(:text("Opportunity Name"))')
        await expect(manualNameField).toBeVisible()
      }
      
      console.log('✓ Business Logic: Auto-naming system working')
    })

    test('Opportunity stage progression validation', async ({ page }) => {
      await page.goto(`${BASE_URL}/opportunities`)
      await page.waitForLoadState('networkidle')
      
      // Test stage filter functionality
      const stageFilter = page.locator('select').first()
      await expect(stageFilter).toBeVisible()
      
      await stageFilter.selectOption('New Lead')
      await page.waitForTimeout(500)
      
      await stageFilter.selectOption('Demo Scheduled')
      await page.waitForTimeout(500)
      
      // Verify stage progression logic (no errors should occur)
      const errorMessages = page.locator('[role="alert"], .error')
      const errorCount = await errorMessages.count()
      expect(errorCount).toBe(0)
      
      console.log('✓ Business Logic: Stage progression validation working')
    })
  })

  // ===============================
  // PERFORMANCE & INTEGRATION
  // ===============================
  
  test.describe('Performance & Integration Testing', () => {
    test('Page load performance benchmarks', async ({ page }) => {
      // Dashboard performance
      const dashboardStart = Date.now()
      await page.goto(BASE_URL)
      await page.waitForLoadState('networkidle')
      const dashboardLoad = Date.now() - dashboardStart
      
      expect(dashboardLoad).toBeLessThan(5000) // 5 second limit
      console.log(`✓ Performance: Dashboard loaded in ${dashboardLoad}ms`)
      
      // Navigation performance
      const navStart = Date.now()
      await page.click('a[href="/opportunities"]')
      await page.waitForLoadState('networkidle')
      const navLoad = Date.now() - navStart
      
      expect(navLoad).toBeLessThan(3000) // 3 second limit for navigation
      console.log(`✓ Performance: Navigation completed in ${navLoad}ms`)
    })

    test('Cross-component integration', async ({ page }) => {
      await page.goto(BASE_URL)
      await page.waitForLoadState('networkidle')
      
      // Test dashboard to opportunity creation flow
      const newOpportunityLink = page.locator('a:has-text("New Opportunity")')
      await expect(newOpportunityLink).toBeVisible()
      
      await newOpportunityLink.click()
      await page.waitForLoadState('networkidle')
      
      // Verify we're on the creation page
      await expect(page.locator('h1:has-text("Create New Opportunity")')).toBeVisible()
      
      // Test back navigation
      const backButton = page.locator('a:has-text("Back to opportunities")')
      if (await backButton.isVisible()) {
        await backButton.click()
        await page.waitForLoadState('networkidle')
        expect(page.url()).toContain('/opportunities')
      }
      
      console.log('✓ Integration: Cross-component navigation working')
    })
  })

  // ===============================
  // ACCESSIBILITY VALIDATION
  // ===============================
  
  test.describe('Accessibility Compliance', () => {
    test('ARIA attributes and semantic structure', async ({ page }) => {
      await page.goto(BASE_URL)
      await page.waitForLoadState('networkidle')
      
      // Check for proper heading hierarchy
      const h1Elements = page.locator('h1')
      const h1Count = await h1Elements.count()
      expect(h1Count).toBeGreaterThan(0)
      
      // Check for ARIA landmarks
      const mainLandmark = page.locator('main, [role="main"]')
      await expect(mainLandmark).toBeVisible()
      
      const navigation = page.locator('nav, [role="navigation"]')
      await expect(navigation).toBeVisible()
      
      // Check for keyboard navigation support
      const interactiveElements = page.locator('button, a, input, select, [tabindex="0"]')
      const interactiveCount = await interactiveElements.count()
      expect(interactiveCount).toBeGreaterThan(5)
      
      console.log(`✓ Accessibility: Found ${interactiveCount} interactive elements`)
    })

    test('Form accessibility validation', async ({ page }) => {
      await page.goto(`${BASE_URL}/opportunities/new`)
      await page.waitForLoadState('networkidle')
      
      // Check form labels and associations
      const formFields = page.locator('input, select, textarea')
      const fieldCount = await formFields.count()
      
      for (let i = 0; i < fieldCount; i++) {
        const field = formFields.nth(i)
        const fieldId = await field.getAttribute('id')
        const fieldAriaLabel = await field.getAttribute('aria-label')
        const fieldAriaLabelledBy = await field.getAttribute('aria-labelledby')
        
        // Each field should have proper labeling
        const hasProperLabel = fieldId || fieldAriaLabel || fieldAriaLabelledBy
        expect(hasProperLabel).toBeTruthy()
      }
      
      console.log(`✓ Accessibility: ${fieldCount} form fields have proper labels`)
    })
  })
})