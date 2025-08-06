/**
 * =============================================================================
 * PRINCIPAL ACTIVITY - END-TO-END INTEGRATION TEST SUITE
 * =============================================================================
 * 
 * Comprehensive E2E testing for Principal Activity Management System including:
 * - Principal list view navigation and interaction
 * - Dashboard functionality and data display
 * - Search and filtering operations
 * - Analytics and KPI visualization
 * - Selection and batch operations
 * - Real-time updates and data refreshing
 * - Mobile responsiveness
 * - Accessibility compliance
 */

import { test, expect, type Page } from '@playwright/test'

// Test configuration
const DESKTOP_VIEWPORT = { width: 1280, height: 720 }
const TABLET_VIEWPORT = { width: 768, height: 1024 }
const MOBILE_VIEWPORT = { width: 375, height: 667 }

// Base URL for testing
const BASE_URL = 'http://localhost:5173'

// Test data helpers
const mockPrincipalData = {
  principal_id: 'test-principal-1',
  principal_name: 'Test Principal Organization',
  activity_status: 'ACTIVE',
  engagement_score: 87,
  total_interactions: 15,
  total_opportunities: 4,
  follow_ups_required: 2
}

// Page object model for Principal Activity components
class PrincipalActivityPage {
  constructor(private page: Page) {}

  // Navigation
  async navigateToPrincipals() {
    await this.page.goto(`${BASE_URL}/principals`)
    await this.page.waitForLoadState('networkidle')
  }

  async navigateToPrincipalDetail(principalId: string) {
    await this.page.goto(`${BASE_URL}/principals/${principalId}`)
    await this.page.waitForLoadState('networkidle')
  }

  async navigateToPrincipalDashboard() {
    await this.page.goto(`${BASE_URL}/principals/dashboard`)
    await this.page.waitForLoadState('networkidle')
  }

  // List view interactions
  async searchPrincipals(query: string) {
    await this.page.fill('[data-testid="principal-search-input"]', query)
    await this.page.press('[data-testid="principal-search-input"]', 'Enter')
    await this.page.waitForResponse(response => 
      response.url().includes('principal_activity_summary_secure') && response.status() === 200
    )
  }

  async applyFilter(filterType: string, value: string) {
    await this.page.click('[data-testid="filter-dropdown-trigger"]')
    await this.page.waitForSelector('[data-testid="filter-dropdown-content"]')
    await this.page.click(`[data-testid="filter-${filterType}"]`)
    await this.page.selectOption(`[data-testid="filter-${filterType}-select"]`, value)
    await this.page.click('[data-testid="apply-filters-button"]')
  }

  async sortPrincipals(field: string, order: 'asc' | 'desc') {
    await this.page.click('[data-testid="sort-dropdown"]')
    await this.page.click(`[data-testid="sort-${field}-${order}"]`)
    await this.page.waitForResponse(response => 
      response.url().includes('principal_activity_summary_secure')
    )
  }

  async selectPrincipal(principalId: string) {
    await this.page.check(`[data-testid="principal-checkbox-${principalId}"]`)
  }

  async enableBatchMode() {
    await this.page.click('[data-testid="batch-mode-toggle"]')
    await expect(this.page.locator('[data-testid="batch-toolbar"]')).toBeVisible()
  }

  async performBatchAction(action: string) {
    await this.page.click(`[data-testid="batch-action-${action}"]`)
  }

  // Dashboard interactions
  async refreshDashboard() {
    await this.page.click('[data-testid="refresh-dashboard-button"]')
    await this.page.waitForResponse(response => 
      response.url().includes('principal_activity_summary_secure')
    )
  }

  async changeTimeRange(range: string) {
    await this.page.selectOption('[data-testid="time-range-selector"]', range)
    await this.page.waitForResponse(response => 
      response.url().includes('principal_activity_summary_secure')
    )
  }

  // KPI interactions
  async clickKPICard(kpiType: string) {
    await this.page.click(`[data-testid="kpi-card-${kpiType}"]`)
  }

  // Analytics interactions
  async viewAnalyticsChart(chartType: string) {
    await this.page.click(`[data-testid="analytics-${chartType}-tab"]`)
    await expect(this.page.locator(`[data-testid="${chartType}-chart"]`)).toBeVisible()
  }

  // Assertions
  async expectPrincipalCount(count: number) {
    await expect(this.page.locator('[data-testid="principal-count"]')).toHaveText(count.toString())
  }

  async expectLoadingState(loading: boolean = true) {
    const spinner = this.page.locator('[data-testid="loading-spinner"]')
    if (loading) {
      await expect(spinner).toBeVisible()
    } else {
      await expect(spinner).not.toBeVisible()
    }
  }

  async expectErrorMessage(message: string) {
    await expect(this.page.locator('[data-testid="error-message"]')).toContainText(message)
  }

  async expectKPIValue(kpiType: string, value: string) {
    await expect(this.page.locator(`[data-testid="kpi-${kpiType}-value"]`)).toContainText(value)
  }

  async expectFilterApplied(filterType: string, active: boolean = true) {
    const filterBadge = this.page.locator(`[data-testid="active-filter-${filterType}"]`)
    if (active) {
      await expect(filterBadge).toBeVisible()
    } else {
      await expect(filterBadge).not.toBeVisible()
    }
  }
}

test.describe('Principal Activity Management - E2E Tests', () => {
  let principalPage: PrincipalActivityPage

  test.beforeEach(async ({ page }) => {
    principalPage = new PrincipalActivityPage(page)
    
    // Mock API responses for consistent testing
    await page.route('**/principal_activity_summary_secure*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            mockPrincipalData,
            {
              ...mockPrincipalData,
              principal_id: 'test-principal-2',
              principal_name: 'Another Principal',
              activity_status: 'INACTIVE',
              engagement_score: 45
            }
          ],
          count: 2
        })
      })
    })

    await page.route('**/principal_distributor_relationships_secure*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] })
      })
    })

    await page.route('**/principal_product_performance_secure*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] })
      })
    })

    await page.route('**/principal_timeline_summary_secure*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] })
      })
    })
  })

  // ============================
  // NAVIGATION TESTS
  // ============================

  test.describe('Navigation and Routing', () => {
    test('should navigate to principal list view', async ({ page }) => {
      await principalPage.navigateToPrincipals()
      
      await expect(page).toHaveTitle(/Principals/)
      await expect(page.locator('h1')).toContainText('Principal Activity')
      await expect(page.locator('[data-testid="principal-table"]')).toBeVisible()
    })

    test('should navigate to principal detail view', async ({ page }) => {
      await principalPage.navigateToPrincipalDetail('test-principal-1')
      
      await expect(page.locator('[data-testid="principal-detail-header"]')).toBeVisible()
      await expect(page.locator('[data-testid="principal-name"]')).toContainText('Test Principal Organization')
    })

    test('should navigate to dashboard view', async ({ page }) => {
      await principalPage.navigateToPrincipalDashboard()
      
      await expect(page.locator('[data-testid="principal-dashboard"]')).toBeVisible()
      await expect(page.locator('[data-testid="kpi-cards-container"]')).toBeVisible()
    })

    test('should handle navigation errors gracefully', async ({ page }) => {
      await page.route('**/principal_activity_summary_secure*', async route => {
        await route.fulfill({ status: 500, body: 'Server Error' })
      })

      await principalPage.navigateToPrincipals()
      await principalPage.expectErrorMessage('Failed to load principals')
    })
  })

  // ============================
  // LIST VIEW FUNCTIONALITY
  // ============================

  test.describe('Principal List View', () => {
    test.beforeEach(async () => {
      await principalPage.navigateToPrincipals()
    })

    test('should display principal list with correct data', async ({ page }) => {
      await expect(page.locator('[data-testid="principal-row"]')).toHaveCount(2)
      
      const firstRow = page.locator('[data-testid="principal-row"]').first()
      await expect(firstRow.locator('[data-testid="principal-name"]')).toContainText('Test Principal Organization')
      await expect(firstRow.locator('[data-testid="engagement-score"]')).toContainText('87')
      await expect(firstRow.locator('[data-testid="activity-status"]')).toContainText('ACTIVE')
    })

    test('should perform search functionality', async ({ page }) => {
      await principalPage.searchPrincipals('Test Principal')
      
      // Should show loading state during search
      await principalPage.expectLoadingState(true)
      await principalPage.expectLoadingState(false)
      
      // Should display filtered results
      await expect(page.locator('[data-testid="principal-row"]')).toHaveCount(1)
      await expect(page.locator('[data-testid="search-results-count"]')).toContainText('1')
    })

    test('should apply and remove filters', async ({ page }) => {
      await principalPage.applyFilter('activity-status', 'ACTIVE')
      await principalPage.expectFilterApplied('activity-status')
      
      // Should show only active principals
      await expect(page.locator('[data-testid="principal-row"]')).toHaveCount(1)
      
      // Clear filters
      await page.click('[data-testid="clear-filters-button"]')
      await principalPage.expectFilterApplied('activity-status', false)
      await expect(page.locator('[data-testid="principal-row"]')).toHaveCount(2)
    })

    test('should sort principals correctly', async ({ page }) => {
      await principalPage.sortPrincipals('principal_name', 'asc')
      
      const firstRowName = page.locator('[data-testid="principal-row"]').first().locator('[data-testid="principal-name"]')
      await expect(firstRowName).toContainText('Another Principal')
      
      await principalPage.sortPrincipals('engagement_score', 'desc')
      await expect(firstRowName).toContainText('Test Principal Organization')
    })

    test('should handle pagination', async ({ page }) => {
      // Mock more data for pagination testing
      await page.route('**/principal_activity_summary_secure*', async route => {
        const url = new URL(route.request().url())
        const page_num = url.searchParams.get('page') || '1'
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: page_num === '1' ? [mockPrincipalData] : [{ ...mockPrincipalData, principal_id: 'page2-principal' }],
            count: 25 // Total count for pagination
          })
        })
      })

      await principalPage.navigateToPrincipals()
      
      // Should show pagination controls
      await expect(page.locator('[data-testid="pagination-controls"]')).toBeVisible()
      await expect(page.locator('[data-testid="next-page-button"]')).toBeEnabled()
      
      // Navigate to next page
      await page.click('[data-testid="next-page-button"]')
      await expect(page.locator('[data-testid="current-page"]')).toContainText('2')
    })
  })

  // ============================
  // SELECTION AND BATCH OPERATIONS
  // ============================

  test.describe('Selection and Batch Operations', () => {
    test.beforeEach(async () => {
      await principalPage.navigateToPrincipals()
    })

    test('should select individual principals', async ({ page }) => {
      await principalPage.selectPrincipal('test-principal-1')
      
      await expect(page.locator('[data-testid="selected-count"]')).toContainText('1')
      await expect(page.locator('[data-testid="principal-checkbox-test-principal-1"]')).toBeChecked()
    })

    test('should enable batch mode and perform batch operations', async ({ page }) => {
      await principalPage.enableBatchMode()
      
      // Select multiple principals
      await principalPage.selectPrincipal('test-principal-1')
      await principalPage.selectPrincipal('test-principal-2')
      
      await expect(page.locator('[data-testid="selected-count"]')).toContainText('2')
      
      // Mock batch update API
      await page.route('**/batch-update*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      })
      
      await principalPage.performBatchAction('update-status')
      
      // Should show success message
      await expect(page.locator('[data-testid="batch-success-message"]')).toBeVisible()
    })

    test('should export selected principals', async ({ page }) => {
      await principalPage.enableBatchMode()
      await principalPage.selectPrincipal('test-principal-1')
      
      // Setup download handler
      const downloadPromise = page.waitForEvent('download')
      await page.click('[data-testid="export-csv-button"]')
      const download = await downloadPromise
      
      expect(download.suggestedFilename()).toContain('.csv')
    })
  })

  // ============================
  // DASHBOARD FUNCTIONALITY
  // ============================

  test.describe('Dashboard Functionality', () => {
    test.beforeEach(async () => {
      await principalPage.navigateToPrincipalDashboard()
    })

    test('should display KPI cards with correct data', async ({ page }) => {
      await principalPage.expectKPIValue('total-principals', '2')
      await principalPage.expectKPIValue('active-principals', '1')
      await principalPage.expectKPIValue('avg-engagement', '66')
      
      // KPI cards should be interactive
      await principalPage.clickKPICard('total-principals')
      await expect(page.locator('[data-testid="kpi-detail-modal"]')).toBeVisible()
    })

    test('should refresh dashboard data', async ({ page }) => {
      await principalPage.refreshDashboard()
      
      // Should show loading state during refresh
      await principalPage.expectLoadingState(true)
      await principalPage.expectLoadingState(false)
      
      // Should display refreshed data
      await expect(page.locator('[data-testid="last-updated"]')).toBeVisible()
    })

    test('should change time range and update data', async ({ page }) => {
      await principalPage.changeTimeRange('last-30-days')
      
      // Should trigger data refresh
      await principalPage.expectLoadingState(true)
      await principalPage.expectLoadingState(false)
      
      // Should show time range indicator
      await expect(page.locator('[data-testid="active-time-range"]')).toContainText('Last 30 Days')
    })

    test('should display analytics charts', async ({ page }) => {
      await principalPage.viewAnalyticsChart('engagement-distribution')
      await expect(page.locator('[data-testid="engagement-distribution-chart"]')).toBeVisible()
      
      await principalPage.viewAnalyticsChart('activity-timeline')
      await expect(page.locator('[data-testid="activity-timeline-chart"]')).toBeVisible()
      
      await principalPage.viewAnalyticsChart('geographic-distribution')
      await expect(page.locator('[data-testid="geographic-distribution-chart"]')).toBeVisible()
    })
  })

  // ============================
  // PRINCIPAL DETAIL VIEW
  // ============================

  test.describe('Principal Detail View', () => {
    test.beforeEach(async () => {
      await principalPage.navigateToPrincipalDetail('test-principal-1')
    })

    test('should display comprehensive principal information', async ({ page }) => {
      // Header information
      await expect(page.locator('[data-testid="principal-name"]')).toContainText('Test Principal Organization')
      await expect(page.locator('[data-testid="engagement-score-badge"]')).toContainText('87')
      await expect(page.locator('[data-testid="activity-status-badge"]')).toContainText('ACTIVE')
      
      // Metrics cards
      await expect(page.locator('[data-testid="interactions-metric"]')).toContainText('15')
      await expect(page.locator('[data-testid="opportunities-metric"]')).toContainText('4')
      await expect(page.locator('[data-testid="follow-ups-metric"]')).toContainText('2')
    })

    test('should display activity timeline', async ({ page }) => {
      await expect(page.locator('[data-testid="activity-timeline"]')).toBeVisible()
      
      // Should show timeline entries
      await expect(page.locator('[data-testid="timeline-entry"]')).toHaveCount.greaterThanOrEqual(0)
      
      // Should allow filtering timeline
      await page.click('[data-testid="timeline-filter-interactions"]')
      await expect(page.locator('[data-testid="timeline-filter-active"]')).toHaveText('Interactions')
    })

    test('should display product performance', async ({ page }) => {
      await page.click('[data-testid="products-tab"]')
      await expect(page.locator('[data-testid="product-performance-table"]')).toBeVisible()
    })

    test('should display distributor relationships', async ({ page }) => {
      await page.click('[data-testid="distributors-tab"]')
      await expect(page.locator('[data-testid="distributor-relationships-table"]')).toBeVisible()
    })

    test('should provide action buttons', async ({ page }) => {
      await expect(page.locator('[data-testid="create-opportunity-button"]')).toBeVisible()
      await expect(page.locator('[data-testid="log-interaction-button"]')).toBeVisible()
      await expect(page.locator('[data-testid="manage-products-button"]')).toBeVisible()
      
      // Test opportunity creation
      await page.click('[data-testid="create-opportunity-button"]')
      await expect(page.locator('[data-testid="opportunity-form-modal"]')).toBeVisible()
    })
  })

  // ============================
  // RESPONSIVE DESIGN TESTS
  // ============================

  test.describe('Responsive Design', () => {
    test('should work correctly on desktop', async ({ page }) => {
      await page.setViewportSize(DESKTOP_VIEWPORT)
      await principalPage.navigateToPrincipals()
      
      await expect(page.locator('[data-testid="principal-table"]')).toBeVisible()
      await expect(page.locator('[data-testid="sidebar-navigation"]')).toBeVisible()
      await expect(page.locator('[data-testid="filter-panel"]')).toBeVisible()
    })

    test('should adapt layout for tablet', async ({ page }) => {
      await page.setViewportSize(TABLET_VIEWPORT)
      await principalPage.navigateToPrincipals()
      
      // Sidebar should be collapsible on tablet
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
      
      // Table should be responsive
      await expect(page.locator('[data-testid="principal-table"]')).toBeVisible()
    })

    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORT)
      await principalPage.navigateToPrincipals()
      
      // Should show mobile-optimized layout
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
      await expect(page.locator('[data-testid="mobile-principal-cards"]')).toBeVisible()
      
      // Mobile menu should work
      await page.click('[data-testid="mobile-menu-button"]')
      await expect(page.locator('[data-testid="mobile-menu-panel"]')).toBeVisible()
    })
  })

  // ============================
  // ACCESSIBILITY TESTS
  // ============================

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await principalPage.navigateToPrincipals()
      
      // Tab through interactive elements
      await page.keyboard.press('Tab') // Focus search input
      await expect(page.locator('[data-testid="principal-search-input"]')).toBeFocused()
      
      await page.keyboard.press('Tab') // Focus filter button
      await expect(page.locator('[data-testid="filter-dropdown-trigger"]')).toBeFocused()
      
      await page.keyboard.press('Tab') // Focus first principal row
      await expect(page.locator('[data-testid="principal-row"]').first()).toBeFocused()
    })

    test('should have proper ARIA labels and roles', async ({ page }) => {
      await principalPage.navigateToPrincipals()
      
      // Check ARIA attributes
      await expect(page.locator('[data-testid="principal-table"]')).toHaveAttribute('role', 'table')
      await expect(page.locator('[data-testid="principal-search-input"]')).toHaveAttribute('aria-label', 'Search principals')
      await expect(page.locator('[data-testid="filter-dropdown-trigger"]')).toHaveAttribute('aria-expanded', 'false')
    })

    test('should announce loading states to screen readers', async ({ page }) => {
      await principalPage.navigateToPrincipals()
      
      // Trigger loading state
      await principalPage.searchPrincipals('test')
      
      // Check for loading announcement
      await expect(page.locator('[data-testid="loading-announcement"]')).toHaveAttribute('aria-live', 'polite')
    })

    test('should have proper heading structure', async ({ page }) => {
      await principalPage.navigateToPrincipals()
      
      const h1 = page.locator('h1')
      await expect(h1).toHaveCount(1)
      await expect(h1).toContainText('Principal Activity')
      
      // Check heading hierarchy
      const headings = page.locator('h1, h2, h3, h4, h5, h6')
      const headingLevels = await headings.evaluateAll(elements => 
        elements.map(el => parseInt(el.tagName.charAt(1)))
      )
      
      // Ensure proper heading order (no skipping levels)
      for (let i = 1; i < headingLevels.length; i++) {
        expect(headingLevels[i] - headingLevels[i-1]).toBeLessThanOrEqual(1)
      }
    })
  })

  // ============================
  // ERROR HANDLING TESTS
  // ============================

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      await page.route('**/principal_activity_summary_secure*', async route => {
        await route.fulfill({ status: 500, body: 'Internal Server Error' })
      })

      await principalPage.navigateToPrincipals()
      
      await principalPage.expectErrorMessage('Failed to load principals')
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
    })

    test('should retry failed requests', async ({ page }) => {
      let attemptCount = 0
      await page.route('**/principal_activity_summary_secure*', async route => {
        attemptCount++
        if (attemptCount === 1) {
          await route.fulfill({ status: 500, body: 'Server Error' })
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ data: [mockPrincipalData], count: 1 })
          })
        }
      })

      await principalPage.navigateToPrincipals()
      await principalPage.expectErrorMessage('Failed to load principals')
      
      await page.click('[data-testid="retry-button"]')
      await expect(page.locator('[data-testid="principal-table"]')).toBeVisible()
    })

    test('should handle network connectivity issues', async ({ page }) => {
      await principalPage.navigateToPrincipals()
      
      // Simulate network offline
      await page.context().setOffline(true)
      await principalPage.searchPrincipals('test')
      
      await principalPage.expectErrorMessage('Network connection lost')
      
      // Restore network
      await page.context().setOffline(false)
      await page.click('[data-testid="retry-button"]')
      await expect(page.locator('[data-testid="principal-table"]')).toBeVisible()
    })
  })

  // ============================
  // PERFORMANCE TESTS
  // ============================

  test.describe('Performance', () => {
    test('should load principal list within acceptable time', async ({ page }) => {
      const startTime = Date.now()
      await principalPage.navigateToPrincipals()
      const endTime = Date.now()
      
      const loadTime = endTime - startTime
      expect(loadTime).toBeLessThan(3000) // Should load within 3 seconds
    })

    test('should handle large datasets efficiently', async ({ page }) => {
      // Mock large dataset
      const largeMockData = Array.from({ length: 100 }, (_, i) => ({
        ...mockPrincipalData,
        principal_id: `test-principal-${i}`,
        principal_name: `Principal ${i}`
      }))

      await page.route('**/principal_activity_summary_secure*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: largeMockData.slice(0, 20), count: 100 })
        })
      })

      const startTime = Date.now()
      await principalPage.navigateToPrincipals()
      const endTime = Date.now()
      
      const loadTime = endTime - startTime
      expect(loadTime).toBeLessThan(5000) // Should handle large datasets within 5 seconds
    })

    test('should optimize search performance', async ({ page }) => {
      await principalPage.navigateToPrincipals()
      
      const startTime = Date.now()
      await principalPage.searchPrincipals('test query')
      const endTime = Date.now()
      
      const searchTime = endTime - startTime
      expect(searchTime).toBeLessThan(2000) // Search should be fast
    })
  })
})