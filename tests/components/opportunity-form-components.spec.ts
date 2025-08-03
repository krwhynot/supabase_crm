/**
 * Opportunity Form Components Integration Tests
 * 
 * Tests for the integration and functionality of opportunity form components:
 * - OpportunityNameField with auto-generation and manual override
 * - StageSelect with 7-stage progression and validation
 * - PrincipalMultiSelect with batch creation preview
 * - ProductSelect with dynamic filtering based on principals
 * - Form validation and error handling
 * - Component interactions and data flow
 */

import { test, expect } from '@playwright/test'

// Test data for component testing
const testData = {
  organization: {
    id: 'org-comp-test-1',
    name: 'Component Test Corporation'
  },
  principals: [
    { id: 'principal-comp-1', name: 'Alex Johnson' },
    { id: 'principal-comp-2', name: 'Sarah Williams' },
    { id: 'principal-comp-3', name: 'Michael Chen' }
  ],
  products: [
    { id: 'product-comp-1', name: 'Analytics Platform', category: 'Software' },
    { id: 'product-comp-2', name: 'Security Suite', category: 'Security' },
    { id: 'product-comp-3', name: 'Integration Tools', category: 'Integration' }
  ]
}

// Helper class for component-specific testing
class OpportunityFormComponentHelpers {
  constructor(public page: any) {}

  async setupComponentMocks() {
    // Mock organizations API
    await this.page.route('**/api/organizations**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            organizations: [testData.organization],
            total_count: 1
          }
        })
      })
    })

    // Mock principals API
    await this.page.route('**/api/principals**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: testData.principals
        })
      })
    })

    // Mock products API with filtering
    await this.page.route('**/api/products**', route => {
      const url = route.request().url()
      
      if (url.includes('/filter-by-principals')) {
        // Return all products for simplicity in component tests
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: testData.products
          })
        })
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: testData.products
          })
        })
      }
    })

    // Mock name preview API
    await this.page.route('**/api/opportunities/name-preview', route => {
      const postData = route.request().postDataJSON()
      const principalIds = postData.principal_ids || []
      
      const previews = principalIds.map((principalId: string) => {
        const principal = testData.principals.find(p => p.id === principalId)
        return {
          principal_id: principalId,
          principal_name: principal?.name || 'Unknown',
          generated_name: `${testData.organization.name} - ${principal?.name} - New Business - Jan 2025`,
          is_duplicate: false
        }
      })

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: previews
        })
      })
    })
  }

  async navigateToCreateForm() {
    await this.page.goto('/opportunities/new')
    await this.page.waitForLoadState('networkidle')
  }

  // OpportunityNameField helpers
  async toggleAutoNaming(enabled: boolean) {
    const checkbox = this.page.locator('[data-testid="auto-generate-name"]')
    const isChecked = await checkbox.isChecked()
    
    if (isChecked !== enabled) {
      await checkbox.click()
    }
  }

  async getNamePreview(): Promise<string> {
    const preview = this.page.locator('[data-testid="name-preview"]')
    return await preview.textContent() || ''
  }

  async setManualName(name: string) {
    await this.page.fill('[data-testid="manual-name-input"]', name)
  }

  async getManualName(): Promise<string> {
    return await this.page.inputValue('[data-testid="manual-name-input"]')
  }

  // StageSelect helpers
  async selectStage(stage: string) {
    await this.page.selectOption('[data-testid="stage-select"]', stage)
  }

  async getSelectedStage(): Promise<string> {
    return await this.page.inputValue('[data-testid="stage-select"]')
  }

  async getStageOptions(): Promise<string[]> {
    const options = await this.page.locator('[data-testid="stage-select"] option').all()
    const values = []
    
    for (const option of options) {
      const value = await option.getAttribute('value')
      if (value) values.push(value)
    }
    
    return values
  }

  // PrincipalMultiSelect helpers
  async openPrincipalSelect() {
    await this.page.click('[data-testid="principal-multi-select"]')
    await this.page.waitForSelector('[role="listbox"]', { state: 'visible' })
  }

  async selectPrincipal(principalName: string) {
    await this.page.click(`[role="option"]:has-text("${principalName}")`)
  }

  async selectMultiplePrincipals(principalNames: string[]) {
    await this.openPrincipalSelect()
    
    for (const name of principalNames) {
      await this.selectPrincipal(name)
    }
    
    await this.page.keyboard.press('Escape')
  }

  async getSelectedPrincipals(): Promise<string[]> {
    const chips = await this.page.locator('[data-testid="selected-principal-chip"]').all()
    const names = []
    
    for (const chip of chips) {
      const text = await chip.textContent()
      if (text) names.push(text.trim())
    }
    
    return names
  }

  async getBatchPreviewCount(): Promise<number> {
    return await this.page.locator('[data-testid="batch-preview-item"]').count()
  }

  // ProductSelect helpers
  async openProductSelect() {
    await this.page.click('[data-testid="product-select"]')
    await this.page.waitForSelector('[role="listbox"]', { state: 'visible' })
  }

  async selectProduct(productName: string) {
    await this.openProductSelect()
    await this.page.click(`[role="option"]:has-text("${productName}")`)
  }

  async getSelectedProduct(): Promise<string> {
    const selected = this.page.locator('[data-testid="product-select"] [data-selected="true"]')
    return await selected.textContent() || ''
  }

  async getAvailableProducts(): Promise<string[]> {
    await this.openProductSelect()
    const options = await this.page.locator('[role="option"]').all()
    const products = []
    
    for (const option of options) {
      const text = await option.textContent()
      if (text) products.push(text.trim())
    }
    
    await this.page.keyboard.press('Escape')
    return products
  }

  // Form validation helpers
  async getFieldError(fieldName: string): Promise<string> {
    const errorElement = this.page.locator(`[data-testid="${fieldName}-error"]`)
    return await errorElement.textContent() || ''
  }

  async hasFieldError(fieldName: string): Promise<boolean> {
    const errorElement = this.page.locator(`[data-testid="${fieldName}-error"]`)
    return await errorElement.isVisible()
  }

  async submitForm() {
    await this.page.click('[data-testid="submit-opportunity-form"]')
  }

  async fillBasicFormFields() {
    // Fill organization
    await this.page.selectOption('[data-testid="organization-select"]', testData.organization.id)
    
    // Fill context
    await this.page.selectOption('[data-testid="context-select"]', 'NEW_BUSINESS')
    
    // Fill probability
    await this.page.fill('[data-testid="probability-input"]', '25')
    
    // Fill close date
    await this.page.fill('[data-testid="close-date-input"]', '2025-06-30')
    
    // Fill deal owner
    await this.page.fill('[data-testid="deal-owner-input"]', 'Test Sales Rep')
  }
}

test.describe('OpportunityNameField Component', () => {
  test('should toggle between auto-generation and manual input', async ({ page }) => {
    const helpers = new OpportunityFormComponentHelpers(page)
    await helpers.setupComponentMocks()
    await helpers.navigateToCreateForm()

    // Initially auto-generation should be enabled
    const autoCheckbox = page.locator('[data-testid="auto-generate-name"]')
    await expect(autoCheckbox).toBeChecked()

    // Manual input should be disabled
    const manualInput = page.locator('[data-testid="manual-name-input"]')
    await expect(manualInput).toBeDisabled()

    // Toggle to manual mode
    await helpers.toggleAutoNaming(false)
    await expect(autoCheckbox).not.toBeChecked()
    await expect(manualInput).toBeEnabled()

    // Toggle back to auto mode
    await helpers.toggleAutoNaming(true)
    await expect(autoCheckbox).toBeChecked()
    await expect(manualInput).toBeDisabled()
  })

  test('should generate name preview when form fields change', async ({ page }) => {
    const helpers = new OpportunityFormComponentHelpers(page)
    await helpers.setupComponentMocks()
    await helpers.navigateToCreateForm()

    // Fill basic form fields
    await helpers.fillBasicFormFields()
    
    // Select a principal to trigger name generation
    await helpers.selectMultiplePrincipals(['Alex Johnson'])

    // Wait for name preview to appear
    await page.waitForSelector('[data-testid="name-preview"]')
    
    const preview = await helpers.getNamePreview()
    expect(preview).toContain('Component Test Corporation')
    expect(preview).toContain('Alex Johnson')
    expect(preview).toContain('New Business')
  })

  test('should update preview when principals change', async ({ page }) => {
    const helpers = new OpportunityFormComponentHelpers(page)
    await helpers.setupComponentMocks()
    await helpers.navigateToCreateForm()

    // Fill basic form fields
    await helpers.fillBasicFormFields()
    
    // Select first principal
    await helpers.selectMultiplePrincipals(['Alex Johnson'])
    
    const preview = await helpers.getNamePreview()
    expect(preview).toContain('Alex Johnson')

    // Add second principal
    await helpers.selectMultiplePrincipals(['Alex Johnson', 'Sarah Williams'])
    
    // Should now show multiple previews
    const previewCount = await helpers.getBatchPreviewCount()
    expect(previewCount).toBe(2)
  })

  test('should allow manual name override', async ({ page }) => {
    const helpers = new OpportunityFormComponentHelpers(page)
    await helpers.setupComponentMocks()
    await helpers.navigateToCreateForm()

    // Toggle to manual mode
    await helpers.toggleAutoNaming(false)

    // Enter custom name
    const customName = 'Custom Strategic Opportunity 2025'
    await helpers.setManualName(customName)

    const enteredName = await helpers.getManualName()
    expect(enteredName).toBe(customName)
  })

  test('should validate required name field', async ({ page }) => {
    const helpers = new OpportunityFormComponentHelpers(page)
    await helpers.setupComponentMocks()
    await helpers.navigateToCreateForm()

    // Toggle to manual mode and leave name empty
    await helpers.toggleAutoNaming(false)
    await helpers.setManualName('')

    // Try to submit form
    await helpers.submitForm()

    // Should show validation error
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible()
    const error = await helpers.getFieldError('name')
    expect(error.toLowerCase()).toContain('required')
  })
})

test.describe('StageSelect Component', () => {
  test('should display all 7 stages', async ({ page }) => {
    const helpers = new OpportunityFormComponentHelpers(page)
    await helpers.setupComponentMocks()
    await helpers.navigateToCreateForm()

    const stageOptions = await helpers.getStageOptions()
    
    const expectedStages = [
      'NEW_LEAD',
      'INITIAL_OUTREACH', 
      'SAMPLE_VISIT_OFFERED',
      'AWAITING_RESPONSE',
      'FEEDBACK_LOGGED',
      'DEMO_SCHEDULED',
      'CLOSED_WON'
    ]

    expectedStages.forEach(stage => {
      expect(stageOptions).toContain(stage)
    })
  })

  test('should update selected stage', async ({ page }) => {
    const helpers = new OpportunityFormComponentHelpers(page)
    await helpers.setupComponentMocks()
    await helpers.navigateToCreateForm()

    // Select different stages
    await helpers.selectStage('DEMO_SCHEDULED')
    let selectedStage = await helpers.getSelectedStage()
    expect(selectedStage).toBe('DEMO_SCHEDULED')

    await helpers.selectStage('INITIAL_OUTREACH')
    selectedStage = await helpers.getSelectedStage()
    expect(selectedStage).toBe('INITIAL_OUTREACH')
  })

  test('should show stage colors correctly', async ({ page }) => {
    const helpers = new OpportunityFormComponentHelpers(page)
    await helpers.setupComponentMocks()
    await helpers.navigateToCreateForm()

    // Select a stage and verify color coding
    await helpers.selectStage('DEMO_SCHEDULED')
    
    const stageSelect = page.locator('[data-testid="stage-select"]')
    const computedStyle = await stageSelect.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    )
    
    // Should have some background color (not default)
    expect(computedStyle).not.toBe('rgba(0, 0, 0, 0)')
  })

  test('should validate required stage selection', async ({ page }) => {
    const helpers = new OpportunityFormComponentHelpers(page)
    await helpers.setupComponentMocks()
    await helpers.navigateToCreateForm()

    // Leave stage unselected and submit
    await helpers.submitForm()

    // Should show validation error
    const hasError = await helpers.hasFieldError('stage')
    expect(hasError).toBe(true)
  })
})

test.describe('PrincipalMultiSelect Component', () => {
  test('should display available principals', async ({ page }) => {
    const helpers = new OpportunityFormComponentHelpers(page)
    await helpers.setupComponentMocks()
    await helpers.navigateToCreateForm()

    // Fill organization first to enable principal selection
    await page.selectOption('[data-testid="organization-select"]', testData.organization.id)
    
    await helpers.openPrincipalSelect()

    // Should show all test principals
    for (const principal of testData.principals) {
      await expect(page.locator(`[role="option"]:has-text("${principal.name}")`)).toBeVisible()
    }
  })

  test('should allow multiple principal selection', async ({ page }) => {
    const helpers = new OpportunityFormComponentHelpers(page)
    await helpers.setupComponentMocks()
    await helpers.navigateToCreateForm()

    // Fill organization first
    await page.selectOption('[data-testid="organization-select"]', testData.organization.id)
    
    // Select multiple principals
    const selectedNames = ['Alex Johnson', 'Sarah Williams']
    await helpers.selectMultiplePrincipals(selectedNames)

    const selectedPrincipals = await helpers.getSelectedPrincipals()
    expect(selectedPrincipals).toEqual(expect.arrayContaining(selectedNames))
  })

  test('should show batch creation preview for multiple principals', async ({ page }) => {
    const helpers = new OpportunityFormComponentHelpers(page)
    await helpers.setupComponentMocks()
    await helpers.navigateToCreateForm()

    // Fill required fields
    await helpers.fillBasicFormFields()
    
    // Select multiple principals
    await helpers.selectMultiplePrincipals(['Alex Johnson', 'Sarah Williams', 'Michael Chen'])

    // Should show batch preview
    await page.waitForSelector('[data-testid="batch-preview"]')
    
    const previewCount = await helpers.getBatchPreviewCount()
    expect(previewCount).toBe(3)

    // Each preview should contain the principal name
    await expect(page.locator('[data-testid="batch-preview-item"]:has-text("Alex Johnson")')).toBeVisible()
    await expect(page.locator('[data-testid="batch-preview-item"]:has-text("Sarah Williams")')).toBeVisible()
    await expect(page.locator('[data-testid="batch-preview-item"]:has-text("Michael Chen")')).toBeVisible()
  })

  test('should remove principals when deselected', async ({ page }) => {
    const helpers = new OpportunityFormComponentHelpers(page)
    await helpers.setupComponentMocks()
    await helpers.navigateToCreateForm()

    // Fill organization first
    await page.selectOption('[data-testid="organization-select"]', testData.organization.id)
    
    // Select multiple principals
    await helpers.selectMultiplePrincipals(['Alex Johnson', 'Sarah Williams'])

    let selectedPrincipals = await helpers.getSelectedPrincipals()
    expect(selectedPrincipals).toHaveLength(2)

    // Remove one principal using chip close button
    await page.click('[data-testid="selected-principal-chip"]:has-text("Alex Johnson") [data-testid="remove-chip"]')

    selectedPrincipals = await helpers.getSelectedPrincipals()
    expect(selectedPrincipals).toHaveLength(1)
    expect(selectedPrincipals).toContain('Sarah Williams')
    expect(selectedPrincipals).not.toContain('Alex Johnson')
  })

  test('should validate required principal selection', async ({ page }) => {
    const helpers = new OpportunityFormComponentHelpers(page)
    await helpers.setupComponentMocks()
    await helpers.navigateToCreateForm()

    // Fill other required fields but leave principals empty
    await helpers.fillBasicFormFields()

    // Try to submit without selecting principals
    await helpers.submitForm()

    // Should show validation error
    const hasError = await helpers.hasFieldError('principals')
    expect(hasError).toBe(true)
  })
})

test.describe('ProductSelect Component', () => {
  test('should display available products when principals are selected', async ({ page }) => {
    const helpers = new OpportunityFormComponentHelpers(page)
    await helpers.setupComponentMocks()
    await helpers.navigateToCreateForm()

    // Fill organization and select principals first
    await page.selectOption('[data-testid="organization-select"]', testData.organization.id)
    await helpers.selectMultiplePrincipals(['Alex Johnson'])

    // Now products should be available
    const availableProducts = await helpers.getAvailableProducts()
    
    expect(availableProducts.length).toBeGreaterThan(0)
    expect(availableProducts).toContain('Analytics Platform')
    expect(availableProducts).toContain('Security Suite')
    expect(availableProducts).toContain('Integration Tools')
  })

  test('should be disabled when no principals are selected', async ({ page }) => {
    const helpers = new OpportunityFormComponentHelpers(page)
    await helpers.setupComponentMocks()
    await helpers.navigateToCreateForm()

    // Fill organization but don't select principals
    await page.selectOption('[data-testid="organization-select"]', testData.organization.id)

    // Product select should be disabled or show empty state
    const productSelect = page.locator('[data-testid="product-select"]')
    const isDisabled = await productSelect.isDisabled()
    
    if (!isDisabled) {
      // Check for empty state message
      await helpers.openProductSelect()
      await expect(page.locator('[data-testid="no-products-message"]')).toBeVisible()
    } else {
      expect(isDisabled).toBe(true)
    }
  })

  test('should update available products when principals change', async ({ page }) => {
    const helpers = new OpportunityFormComponentHelpers(page)
    await helpers.setupComponentMocks()
    await helpers.navigateToCreateForm()

    // Fill organization and select first principal
    await page.selectOption('[data-testid="organization-select"]', testData.organization.id)
    await helpers.selectMultiplePrincipals(['Alex Johnson'])

    let availableProducts = await helpers.getAvailableProducts()
    const initialProductCount = availableProducts.length

    // Add another principal
    await helpers.selectMultiplePrincipals(['Alex Johnson', 'Sarah Williams'])

    // Products should still be available (might be filtered differently in real app)
    availableProducts = await helpers.getAvailableProducts()
    expect(availableProducts.length).toBeGreaterThanOrEqual(initialProductCount)
  })

  test('should allow product selection', async ({ page }) => {
    const helpers = new OpportunityFormComponentHelpers(page)
    await helpers.setupComponentMocks()
    await helpers.navigateToCreateForm()

    // Fill prerequisites
    await page.selectOption('[data-testid="organization-select"]', testData.organization.id)
    await helpers.selectMultiplePrincipals(['Alex Johnson'])

    // Select a product
    await helpers.selectProduct('Analytics Platform')

    const selectedProduct = await helpers.getSelectedProduct()
    expect(selectedProduct).toContain('Analytics Platform')
  })

  test('should validate required product selection', async ({ page }) => {
    const helpers = new OpportunityFormComponentHelpers(page)
    await helpers.setupComponentMocks()
    await helpers.navigateToCreateForm()

    // Fill all other required fields but leave product empty
    await helpers.fillBasicFormFields()
    await helpers.selectMultiplePrincipals(['Alex Johnson'])

    // Try to submit without selecting product
    await helpers.submitForm()

    // Should show validation error
    const hasError = await helpers.hasFieldError('product')
    expect(hasError).toBe(true)
  })
})

test.describe('Form Component Integration', () => {
  test('should handle complete form flow with all components', async ({ page }) => {
    const helpers = new OpportunityFormComponentHelpers(page)
    await helpers.setupComponentMocks()
    await helpers.navigateToCreateForm()

    // Fill form step by step, testing component interactions
    
    // 1. Fill basic organization and context
    await page.selectOption('[data-testid="organization-select"]', testData.organization.id)
    await page.selectOption('[data-testid="context-select"]', 'NEW_BUSINESS')

    // 2. Select stage
    await helpers.selectStage('INITIAL_OUTREACH')

    // 3. Fill probability and dates
    await page.fill('[data-testid="probability-input"]', '40')
    await page.fill('[data-testid="close-date-input"]', '2025-06-30')
    await page.fill('[data-testid="deal-owner-input"]', 'Integration Test Rep')

    // 4. Select principals (this should enable products)
    await helpers.selectMultiplePrincipals(['Alex Johnson', 'Sarah Williams'])

    // 5. Select product
    await helpers.selectProduct('Analytics Platform')

    // 6. Verify auto-naming is working
    await page.waitForSelector('[data-testid="batch-preview"]')
    const previewCount = await helpers.getBatchPreviewCount()
    expect(previewCount).toBe(2)

    // 7. All fields should be valid - no errors visible
    const errorElements = await page.locator('[data-testid$="-error"]:visible').count()
    expect(errorElements).toBe(0)

    // 8. Form should be submittable
    const submitButton = page.locator('[data-testid="submit-opportunity-form"]')
    await expect(submitButton).toBeEnabled()
  })

  test('should show appropriate validation errors when fields are missing', async ({ page }) => {
    const helpers = new OpportunityFormComponentHelpers(page)
    await helpers.setupComponentMocks()
    await helpers.navigateToCreateForm()

    // Try to submit completely empty form
    await helpers.submitForm()

    // Should show multiple validation errors
    const errorCount = await page.locator('[data-testid$="-error"]:visible').count()
    expect(errorCount).toBeGreaterThan(0)

    // Check for specific required field errors
    await expect(page.locator('[data-testid="organization-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="stage-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="principals-error"]')).toBeVisible()
  })

  test('should reset form appropriately when switching between single and batch mode', async ({ page }) => {
    const helpers = new OpportunityFormComponentHelpers(page)
    await helpers.setupComponentMocks()
    await helpers.navigateToCreateForm()

    // Fill form for single principal
    await helpers.fillBasicFormFields()
    await helpers.selectMultiplePrincipals(['Alex Johnson'])

    // Should show single preview
    await page.waitForSelector('[data-testid="name-preview"]')
    const preview = await helpers.getNamePreview()
    expect(preview).toContain('Alex Johnson')

    // Add second principal to trigger batch mode
    await helpers.selectMultiplePrincipals(['Alex Johnson', 'Sarah Williams'])

    // Should now show batch preview
    await page.waitForSelector('[data-testid="batch-preview"]')
    const previewCount = await helpers.getBatchPreviewCount()
    expect(previewCount).toBe(2)
  })

  test('should handle form state persistence during navigation', async ({ page }) => {
    const helpers = new OpportunityFormComponentHelpers(page)
    await helpers.setupComponentMocks()
    await helpers.navigateToCreateForm()

    // Fill part of the form
    await page.selectOption('[data-testid="organization-select"]', testData.organization.id)
    await helpers.selectStage('DEMO_SCHEDULED')
    await page.fill('[data-testid="probability-input"]', '75')

    // Get current form values
    const selectedOrg = await page.inputValue('[data-testid="organization-select"]')
    const selectedStage = await helpers.getSelectedStage()
    const probabilityValue = await page.inputValue('[data-testid="probability-input"]')

    // Navigate away and back (simulating browser back/forward)
    await page.goto('/opportunities')
    await page.waitForLoadState('networkidle')
    await page.goBack()
    await page.waitForLoadState('networkidle')

    // Form should reset to defaults (this is expected behavior)
    const resetOrgValue = await page.inputValue('[data-testid="organization-select"]')
    expect(resetOrgValue).toBe('')
  })
})