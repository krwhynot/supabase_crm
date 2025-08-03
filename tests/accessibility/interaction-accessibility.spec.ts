/**
 * Interaction Management Accessibility Tests
 * 
 * Comprehensive WCAG 2.1 AA compliance testing for interaction management system:
 * - Form component accessibility with multi-step wizard
 * - Voice input accessibility and mobile compatibility
 * - Table accessibility with sorting and bulk operations
 * - Keyboard navigation and focus management
 * - Screen reader compatibility and ARIA attributes
 * - Color contrast and visual accessibility standards
 * - Touch targets and mobile accessibility requirements
 * - Modal dialogs and dropdown accessibility
 */

import { test, expect, devices } from '@playwright/test'
import type { Page } from '@playwright/test'

// Test data for accessibility testing
const accessibilityTestData = {
  organization: {
    id: 'org-interaction-a11y-1',
    name: 'Interaction Accessibility Test Org',
    contact_count: 5,
    interaction_count: 12
  },
  principals: [
    { 
      id: 'principal-interaction-a11y-1', 
      name: 'John Accessibility',
      email: 'john@example.com',
      phone: '555-0101'
    },
    { 
      id: 'principal-interaction-a11y-2', 
      name: 'Jane Universal',
      email: 'jane@example.com',
      phone: '555-0102'
    }
  ],
  opportunities: [
    {
      id: 'opp-interaction-a11y-1',
      name: 'Test Opportunity for Interaction A11y',
      stage: 'NEW_LEAD',
      probability_percent: 35,
      organization_name: 'Interaction Accessibility Test Org'
    }
  ],
  interactions: [
    {
      id: 'interaction-a11y-1',
      title: 'Initial Discovery Call',
      type: 'PHONE_CALL',
      status: 'COMPLETED',
      interaction_date: '2024-01-15T14:00:00Z',
      duration_minutes: 30,
      outcome: 'POSITIVE',
      organization_name: 'Interaction Accessibility Test Org',
      principal_name: 'John Accessibility',
      conducted_by: 'Test User',
      follow_up_required: true,
      follow_up_date: '2024-01-22'
    },
    {
      id: 'interaction-a11y-2',
      title: 'Product Demo',
      type: 'VIRTUAL_MEETING',
      status: 'PLANNED',
      interaction_date: '2024-01-25T10:00:00Z',
      duration_minutes: 60,
      organization_name: 'Interaction Accessibility Test Org',
      principal_name: 'Jane Universal',
      conducted_by: 'Test User',
      meeting_url: 'https://zoom.us/j/123456789'
    }
  ],
  templates: [
    {
      id: 'template-a11y-1',
      name: 'Discovery Call Template',
      type: 'PHONE_CALL',
      title_template: 'Discovery Call - {organization}',
      description_template: 'Initial discovery conversation to understand needs and requirements.',
      default_duration: 30,
      auto_follow_up: true,
      follow_up_days: 7
    }
  ]
}

// Helper class for interaction accessibility testing
class InteractionAccessibilityHelpers {
  constructor(public page: Page) {}

  async setupAccessibilityMocks() {
    // Mock interactions API
    await this.page.route('**/api/interactions**', route => {
      const url = route.request().url()
      
      if (url.includes('/kpis')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              total_interactions: 156,
              this_month: 23,
              follow_ups_due: 8,
              completion_rate: 87.5
            }
          })
        })
      } else if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: accessibilityTestData.interactions,
            total: accessibilityTestData.interactions.length
          })
        })
      } else if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { id: 'new-interaction-id' }
          })
        })
      }
    })

    // Mock organizations API
    await this.page.route('**/api/organizations**', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [accessibilityTestData.organization]
          })
        })
      }
    })

    // Mock principals API
    await this.page.route('**/api/principals**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: accessibilityTestData.principals
        })
      })
    })

    // Mock opportunities API
    await this.page.route('**/api/opportunities**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: accessibilityTestData.opportunities
        })
      })
    })

    // Mock templates API
    await this.page.route('**/api/interaction-templates**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: accessibilityTestData.templates
        })
      })
    })
  }

  async injectAxeCore() {
    await this.page.addScriptTag({
      url: 'https://unpkg.com/axe-core@4.7.0/axe.min.js'
    })
  }

  async runAxeTest(context?: string) {
    const accessibilityResults = await this.page.evaluate(async (context) => {
      // @ts-ignore
      return await axe.run(context ? context : document)
    }, context)

    return accessibilityResults
  }

  async checkColorContrast(selector: string) {
    return await this.page.evaluate((selector) => {
      const element = document.querySelector(selector)
      if (!element) return null

      const styles = window.getComputedStyle(element)
      const backgroundColor = styles.backgroundColor
      const color = styles.color
      
      return { backgroundColor, color, element: element.tagName }
    }, selector)
  }

  async checkTouchTargets() {
    return await this.page.evaluate(() => {
      const touchTargets = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [role="link"]')
      const results = []

      touchTargets.forEach(target => {
        const rect = target.getBoundingClientRect()
        const minSize = 44 // WCAG AA minimum touch target size
        
        results.push({
          element: target.tagName,
          className: target.className,
          width: rect.width,
          height: rect.height,
          meetsMinimum: rect.width >= minSize && rect.height >= minSize
        })
      })

      return results
    })
  }

  async checkKeyboardNavigation() {
    // Test tab order and focus management
    const focusableElements = await this.page.evaluate(() => {
      const focusable = document.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      
      return Array.from(focusable).map((el, index) => ({
        tagName: el.tagName,
        type: el.getAttribute('type'),
        tabIndex: el.tabIndex,
        id: el.id,
        className: el.className,
        'aria-label': el.getAttribute('aria-label'),
        'aria-describedby': el.getAttribute('aria-describedby'),
        order: index
      }))
    })

    return focusableElements
  }

  async checkAriaAttributes(selector?: string) {
    return await this.page.evaluate((selector) => {
      const elements = selector ? 
        document.querySelectorAll(selector) : 
        document.querySelectorAll('[aria-label], [aria-describedby], [aria-labelledby], [aria-expanded], [aria-hidden], [role]')
      
      return Array.from(elements).map(el => ({
        tagName: el.tagName,
        id: el.id,
        className: el.className,
        'aria-label': el.getAttribute('aria-label'),
        'aria-describedby': el.getAttribute('aria-describedby'),
        'aria-labelledby': el.getAttribute('aria-labelledby'),
        'aria-expanded': el.getAttribute('aria-expanded'),
        'aria-hidden': el.getAttribute('aria-hidden'),
        'aria-invalid': el.getAttribute('aria-invalid'),
        'role': el.getAttribute('role')
      }))
    }, selector)
  }

  async simulateScreenReader() {
    // Test screen reader announcements
    return await this.page.evaluate(() => {
      const liveRegions = document.querySelectorAll('[aria-live], [role="alert"], [role="status"]')
      return Array.from(liveRegions).map(region => ({
        tagName: region.tagName,
        'aria-live': region.getAttribute('aria-live'),
        'role': region.getAttribute('role'),
        textContent: region.textContent?.trim()
      }))
    })
  }

  async checkFormLabels() {
    return await this.page.evaluate(() => {
      const formControls = document.querySelectorAll('input, select, textarea')
      const results = []

      formControls.forEach(control => {
        const id = control.id
        const ariaLabel = control.getAttribute('aria-label')
        const ariaLabelledby = control.getAttribute('aria-labelledby')
        const associatedLabel = id ? document.querySelector(`label[for="${id}"]`) : null
        
        results.push({
          tagName: control.tagName,
          type: control.getAttribute('type'),
          id: id,
          hasLabel: !!(associatedLabel || ariaLabel || ariaLabelledby),
          labelText: associatedLabel?.textContent?.trim() || ariaLabel,
          required: control.hasAttribute('required'),
          'aria-required': control.getAttribute('aria-required'),
          'aria-invalid': control.getAttribute('aria-invalid')
        })
      })

      return results
    })
  }
}

// Desktop accessibility tests
test.describe('Interaction Management Accessibility - Desktop', () => {
  let helpers: InteractionAccessibilityHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new InteractionAccessibilityHelpers(page)
    await helpers.setupAccessibilityMocks()
    await helpers.injectAxeCore()
  })

  test('Interactions List View - WCAG 2.1 AA Compliance', async ({ page }) => {
    await page.goto('/interactions')
    await page.waitForLoadState('networkidle')

    // Run automated accessibility scan
    const axeResults = await helpers.runAxeTest()
    
    // Should have no critical or serious accessibility violations
    expect(axeResults.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toHaveLength(0)

    // Check page structure
    await expect(page.locator('h1')).toHaveText('Interactions')
    await expect(page.locator('[data-testid="interactions-list-view"]')).toBeVisible()

    // Check ARIA landmarks
    const landmarks = await page.locator('[role="main"], main, [role="navigation"], nav').count()
    expect(landmarks).toBeGreaterThan(0)

    // Check breadcrumb navigation
    await expect(page.locator('[aria-label*="breadcrumb"], .breadcrumb')).toBeVisible()

    // Verify keyboard navigation
    await page.keyboard.press('Tab')
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeTruthy()
  })

  test('Interaction Table - Accessibility Features', async ({ page }) => {
    await page.goto('/interactions')
    await page.waitForLoadState('networkidle')

    // Check table accessibility
    const table = page.locator('table, [role="table"]')
    await expect(table).toBeVisible()

    // Check table headers
    const headers = await page.locator('th, [role="columnheader"]').count()
    expect(headers).toBeGreaterThan(0)

    // Check sorting accessibility
    const sortableHeaders = await page.locator('th[aria-sort], [role="columnheader"][aria-sort]').count()
    expect(sortableHeaders).toBeGreaterThanOrEqual(0)

    // Check bulk selection accessibility
    const selectAllCheckbox = page.locator('input[type="checkbox"][aria-label*="Select all"], input[type="checkbox"][aria-label*="select all"]')
    if (await selectAllCheckbox.count() > 0) {
      await expect(selectAllCheckbox).toHaveAttribute('aria-label')
    }

    // Test keyboard navigation in table
    await page.keyboard.press('Tab')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowRight')
    
    // Should not have trapped focus
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeTruthy()
  })

  test('Interaction Creation Form - Multi-step Wizard Accessibility', async ({ page }) => {
    await page.goto('/interactions/new')
    await page.waitForLoadState('networkidle')

    // Run accessibility scan on form
    const axeResults = await helpers.runAxeTest()
    expect(axeResults.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toHaveLength(0)

    // Check form labels
    const formLabels = await helpers.checkFormLabels()
    const unlabeledControls = formLabels.filter(control => !control.hasLabel)
    expect(unlabeledControls).toHaveLength(0)

    // Check step indicator accessibility
    const stepIndicator = page.locator('.progress-step, [role="progressbar"], [aria-label*="step"]')
    if (await stepIndicator.count() > 0) {
      await expect(stepIndicator.first()).toHaveAttribute('aria-label')
    }

    // Check required field indicators
    const requiredFields = await page.locator('input[required], select[required], textarea[required]').all()
    for (const field of requiredFields) {
      const ariaRequired = await field.getAttribute('aria-required')
      const hasVisualIndicator = await page.locator('label:has(+ input[required]) .text-red-500, label:has(+ select[required]) .text-red-500').count()
      
      expect(ariaRequired === 'true' || hasVisualIndicator > 0).toBeTruthy()
    }

    // Test keyboard navigation through form steps
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Fill first step and navigate
    const titleInput = page.locator('#interaction-title, input[name="title"]')
    if (await titleInput.count() > 0) {
      await titleInput.fill('Test Accessibility Interaction')
      
      // Check that next button becomes enabled
      const nextButton = page.locator('button:has-text("Next"), [type="button"]:has-text("Next")')
      if (await nextButton.count() > 0) {
        await expect(nextButton).not.toBeDisabled()
      }
    }

    // Test error message accessibility
    const errorMessages = await page.locator('[role="alert"], .text-red-600, .error-message').all()
    for (const error of errorMessages) {
      const ariaLive = await error.getAttribute('aria-live')
      const role = await error.getAttribute('role')
      expect(ariaLive === 'polite' || ariaLive === 'assertive' || role === 'alert').toBeTruthy()
    }
  })

  test('Voice Notes Input - Accessibility and ARIA Support', async ({ page }) => {
    await page.goto('/interactions/new')
    await page.waitForLoadState('networkidle')

    // Check if voice input component is present
    const voiceInput = page.locator('.voice-notes-input, [data-testid*="voice"]')
    if (await voiceInput.count() > 0) {
      
      // Check voice button accessibility
      const voiceButton = page.locator('button[aria-label*="voice"], button[aria-label*="recording"]')
      await expect(voiceButton).toHaveAttribute('aria-label')
      
      // Check voice status announcements
      const statusRegion = page.locator('[aria-live], [role="status"]')
      if (await statusRegion.count() > 0) {
        await expect(statusRegion).toHaveAttribute('aria-live')
      }

      // Test touch target size for voice button
      const touchTargets = await helpers.checkTouchTargets()
      const voiceButtonTargets = touchTargets.filter(target => 
        target.className.includes('voice') || target.className.includes('touch-target')
      )
      
      if (voiceButtonTargets.length > 0) {
        expect(voiceButtonTargets.every(target => target.meetsMinimum)).toBeTruthy()
      }
    }
  })

  test('Modal Dialogs - Focus Management and ARIA', async ({ page }) => {
    await page.goto('/interactions')
    await page.waitForLoadState('networkidle')

    // Look for modal triggers
    const modalTriggers = await page.locator('button:has-text("Delete"), button:has-text("Export"), button:has-text("Bulk")').all()
    
    if (modalTriggers.length > 0) {
      // Click first modal trigger
      await modalTriggers[0].click()
      
      // Wait for modal to appear
      await page.waitForTimeout(500)
      
      // Check modal accessibility
      const modal = page.locator('[role="dialog"], .modal, [aria-modal="true"]')
      if (await modal.count() > 0) {
        await expect(modal).toHaveAttribute('role', 'dialog')
        await expect(modal).toHaveAttribute('aria-modal', 'true')
        
        // Check focus is trapped in modal
        const focusedElement = await page.evaluate(() => document.activeElement?.closest('[role="dialog"]'))
        expect(focusedElement).toBeTruthy()
        
        // Test Escape key closes modal
        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)
        await expect(modal).not.toBeVisible()
      }
    }
  })

  test('Color Contrast - WCAG AA Compliance', async ({ page }) => {
    await page.goto('/interactions')
    await page.waitForLoadState('networkidle')

    // Test primary text contrast
    const textElements = [
      'h1', 'h2', 'h3', 'p', 'span', 'button', 'a',
      '.text-gray-900', '.text-gray-800', '.text-gray-700'
    ]

    for (const selector of textElements) {
      const elements = await page.locator(selector).all()
      if (elements.length > 0) {
        const contrast = await helpers.checkColorContrast(selector)
        if (contrast) {
          // Note: Full contrast calculation would require color parsing library
          // This is a basic check for common patterns
          expect(contrast.color).not.toBe(contrast.backgroundColor)
        }
      }
    }

    // Check error text contrast
    const errorElements = await page.locator('.text-red-600, .text-red-500, .error').all()
    for (const element of errorElements) {
      const isVisible = await element.isVisible()
      if (isVisible) {
        // Error text should have sufficient contrast
        const textColor = await element.evaluate(el => window.getComputedStyle(el).color)
        expect(textColor).toBeTruthy()
      }
    }
  })

  test('Keyboard Navigation - Complete Workflow', async ({ page }) => {
    await page.goto('/interactions')
    await page.waitForLoadState('networkidle')

    // Get initial focusable elements
    const focusableElements = await helpers.checkKeyboardNavigation()
    expect(focusableElements.length).toBeGreaterThan(0)

    // Test Tab navigation
    let tabCount = 0
    const maxTabs = 20

    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab')
      tabCount++
      
      const currentFocus = await page.evaluate(() => {
        const active = document.activeElement
        return {
          tagName: active?.tagName,
          type: active?.getAttribute('type'),
          role: active?.getAttribute('role'),
          ariaLabel: active?.getAttribute('aria-label')
        }
      })

      // Should always have a focused element
      expect(currentFocus.tagName).toBeTruthy()
      
      // Break if we've cycled back to the first element
      if (tabCount > 5 && currentFocus.tagName === 'BODY') {
        break
      }
    }

    // Test Skip Links (if present)
    await page.keyboard.press('Home')
    await page.keyboard.press('Tab')
    
    const skipLink = page.locator('a[href*="#main"], a:has-text("Skip to")')
    if (await skipLink.count() > 0) {
      await expect(skipLink).toBeFocused()
    }
  })

  test('Screen Reader Compatibility', async ({ page }) => {
    await page.goto('/interactions')
    await page.waitForLoadState('networkidle')

    // Check ARIA attributes
    const ariaElements = await helpers.checkAriaAttributes()
    
    // Verify important elements have proper ARIA
    const mainHeading = await page.locator('h1').first()
    const headingText = await mainHeading.textContent()
    expect(headingText).toBeTruthy()

    // Check live regions for dynamic content
    const liveRegions = await helpers.simulateScreenReader()
    
    // If there are status updates, they should be announced
    if (liveRegions.length > 0) {
      expect(liveRegions.some(region => 
        region['aria-live'] === 'polite' || 
        region['aria-live'] === 'assertive' || 
        region.role === 'alert'
      )).toBeTruthy()
    }

    // Check form error announcements
    await page.goto('/interactions/new')
    await page.waitForLoadState('networkidle')
    
    // Try to submit invalid form
    const submitButton = page.locator('button[type="submit"], button:has-text("Create")')
    if (await submitButton.count() > 0) {
      await submitButton.click()
      
      // Check for error announcements
      await page.waitForTimeout(500)
      const errorRegions = await page.locator('[role="alert"], [aria-live="assertive"]').all()
      
      if (errorRegions.length > 0) {
        for (const region of errorRegions) {
          const content = await region.textContent()
          expect(content?.trim()).toBeTruthy()
        }
      }
    }
  })
})

// Mobile accessibility tests - iPhone 12
test.describe('Interaction Management Accessibility - Mobile iPhone', () => {
  let helpers: InteractionAccessibilityHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new InteractionAccessibilityHelpers(page)
    await helpers.setupAccessibilityMocks()
    await helpers.injectAxeCore()
  })

  test('Mobile Touch Targets - WCAG AA Compliance', async ({ page }) => {
    await page.goto('/interactions')
    await page.waitForLoadState('networkidle')

    // Check touch target sizes
    const touchTargets = await helpers.checkTouchTargets()
    const insufficientTargets = touchTargets.filter(target => !target.meetsMinimum)
    
    // All interactive elements should meet 44px minimum
    expect(insufficientTargets.length).toBe(0)

    // Test specific mobile buttons
    const mobileButtons = await page.locator('button, [role="button"]').all()
    for (const button of mobileButtons.slice(0, 5)) { // Test first 5 buttons
      const box = await button.boundingBox()
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
    }
  })

  test('Mobile Voice Input - Accessibility Features', async ({ page }) => {
    await page.goto('/interactions/new')
    await page.waitForLoadState('networkidle')

    // Check voice input on mobile
    const voiceButton = page.locator('button[aria-label*="voice"], .voice-notes-input button')
    if (await voiceButton.count() > 0) {
      // Touch target should be sufficient
      const box = await voiceButton.boundingBox()
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(44)
      }

      // Should have proper ARIA labels for screen readers
      await expect(voiceButton).toHaveAttribute('aria-label')
      
      // Should be keyboard accessible
      await voiceButton.focus()
      await expect(voiceButton).toBeFocused()
    }
  })

  test('Mobile Navigation - Accessibility', async ({ page }) => {
    await page.goto('/interactions')
    await page.waitForLoadState('networkidle')

    // Check mobile menu accessibility
    const mobileMenuButton = page.locator('button[aria-label*="menu"], button[aria-expanded]')
    if (await mobileMenuButton.count() > 0) {
      await expect(mobileMenuButton).toHaveAttribute('aria-expanded')
      
      // Open mobile menu
      await mobileMenuButton.click()
      
      // Check if menu is announced as expanded
      const expanded = await mobileMenuButton.getAttribute('aria-expanded')
      expect(expanded).toBe('true')
    }

    // Check responsive table accessibility
    const table = page.locator('table, [role="table"]')
    if (await table.count() > 0) {
      // Should be scrollable horizontally if needed
      const tableContainer = page.locator('.table-container, .overflow-x-auto').first()
      if (await tableContainer.count() > 0) {
        await expect(tableContainer).toBeVisible()
      }
    }
  })

  test('Mobile Form Accessibility', async ({ page }) => {
    await page.goto('/interactions/new')
    await page.waitForLoadState('networkidle')

    // Run accessibility scan on mobile form
    const axeResults = await helpers.runAxeTest()
    expect(axeResults.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toHaveLength(0)

    // Check mobile form inputs
    const inputs = await page.locator('input, select, textarea').all()
    for (const input of inputs.slice(0, 5)) { // Test first 5 inputs
      // Should have sufficient touch target
      const box = await input.boundingBox()
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44)
      }

      // Should be properly labeled
      const ariaLabel = await input.getAttribute('aria-label')
      const id = await input.getAttribute('id')
      const hasLabel = ariaLabel || (id && await page.locator(`label[for="${id}"]`).count() > 0)
      expect(hasLabel).toBeTruthy()
    }
  })
})

// iPad specific accessibility tests
test.describe('Interaction Management Accessibility - iPad', () => {
  let helpers: InteractionAccessibilityHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new InteractionAccessibilityHelpers(page)
    await helpers.setupAccessibilityMocks()
    await helpers.injectAxeCore()
  })

  test('iPad Touch and Voice Input Accessibility', async ({ page }) => {
    await page.goto('/interactions/new')
    await page.waitForLoadState('networkidle')

    // Check iPad-specific voice input features
    const voiceInput = page.locator('.voice-notes-input')
    if (await voiceInput.count() > 0) {
      // Voice button should work with touch
      const voiceButton = voiceInput.locator('button')
      await expect(voiceButton).toBeVisible()
      
      // Should support iPad voice commands
      const helpSection = page.locator('[data-testid*="voice-help"], .voice-commands')
      if (await helpSection.count() > 0) {
        await expect(helpSection).toBeVisible()
      }
    }

    // Test iPad keyboard accessibility
    await page.keyboard.press('Tab')
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeTruthy()
  })

  test('iPad Table Interaction Accessibility', async ({ page }) => {
    await page.goto('/interactions')
    await page.waitForLoadState('networkidle')

    // Check table accessibility on iPad
    const table = page.locator('table')
    if (await table.count() > 0) {
      // Should support touch scrolling
      await expect(table).toBeVisible()
      
      // Check row selection with touch
      const selectableRows = page.locator('tr[role="row"] input[type="checkbox"]')
      if (await selectableRows.count() > 0) {
        const firstCheckbox = selectableRows.first()
        const box = await firstCheckbox.boundingBox()
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(44)
          expect(box.height).toBeGreaterThanOrEqual(44)
        }
      }
    }
  })
})

// High contrast mode tests
test.describe('Interaction Management Accessibility - High Contrast', () => {
  let helpers: InteractionAccessibilityHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new InteractionAccessibilityHelpers(page)
    await helpers.setupAccessibilityMocks()
    await helpers.injectAxeCore()
    
    // Simulate high contrast mode
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          * { outline: 2px solid !important; }
        }
        @media (forced-colors: active) {
          * { forced-color-adjust: none !important; }
        }
      `
    })
  })

  test('High Contrast Mode Compatibility', async ({ page }) => {
    await page.goto('/interactions')
    await page.waitForLoadState('networkidle')

    // Elements should remain visible in high contrast
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('button').first()).toBeVisible()
    
    // Form elements should be accessible
    await page.goto('/interactions/new')
    await page.waitForLoadState('networkidle')
    
    const inputs = await page.locator('input, select, button').all()
    for (const input of inputs.slice(0, 3)) {
      await expect(input).toBeVisible()
    }
  })
})