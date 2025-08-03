import { test, expect } from '@playwright/test';

/**
 * Opportunity Management Test Suite - Phase 9.1 Functionality Testing
 * 
 * Comprehensive testing for the complete opportunity management system:
 * - Single opportunity creation with auto-naming
 * - Multiple principal batch creation with previews
 * - Product filtering based on principal selection
 * - Form validation and error handling
 * - KPI calculations and display
 * - Table sorting and filtering functionality
 * - Edit and delete operations
 * - Contextual creation from contacts/organizations
 * - Cross-feature integration testing
 */

// Test data fixtures for comprehensive testing
const testOrganization = {
  id: 'test-org-123',
  name: 'Test Corporation',
  segment: 'Technology - Software',
  business_type: 'B2B'
};

const testContact = {
  id: 'test-contact-456',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@testcorp.com',
  position: 'VP of Sales'
};

const testPrincipals = [
  {
    id: 'principal-1',
    name: 'Principal One',
    organization_id: 'test-org-123'
  },
  {
    id: 'principal-2', 
    name: 'Principal Two',
    organization_id: 'test-org-123'
  }
];

const testProducts = [
  {
    id: 'product-1',
    name: 'Enterprise Software Suite',
    category: 'Software',
    description: 'Complete business management solution'
  },
  {
    id: 'product-2',
    name: 'Analytics Platform',
    category: 'Analytics',
    description: 'Data analytics and reporting platform'
  }
];

const validOpportunityData = {
  name: 'Test Corporation - Q1 2025 Enterprise Implementation',
  organization_id: 'test-org-123',
  context: 'NEW_BUSINESS',
  stage: 'NEW_LEAD',
  probability_percent: 25,
  expected_close_date: '2025-03-31',
  deal_owner: 'Sales Representative',
  product_id: 'product-1',
  principal_ids: ['principal-1'],
  notes: 'Strategic opportunity for Q1 expansion',
  auto_generate_name: true
};

// Helper class for opportunity management operations
class OpportunityTestHelpers {
  constructor(public page: any) {}

  // Navigation helpers
  async navigateToOpportunityList() {
    await this.page.goto('/opportunities');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToCreateOpportunity() {
    await this.page.goto('/opportunities/new');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToOpportunityDetail(id: string) {
    await this.page.goto(`/opportunities/${id}`);
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToEditOpportunity(id: string) {
    await this.page.goto(`/opportunities/${id}/edit`);
    await this.page.waitForLoadState('networkidle');
  }

  // Form filling helpers
  async fillBasicOpportunityForm(data: typeof validOpportunityData) {
    // Organization selection
    await this.page.click('[name="organization_id"]');
    await this.page.waitForSelector('[role="listbox"]', { state: 'visible' });
    await this.page.click(`[role="option"]:has-text("${testOrganization.name}")`);

    // Context selection
    await this.page.selectOption('[name="context"]', data.context);

    // Stage selection
    await this.page.selectOption('[name="stage"]', data.stage);

    // Probability percentage
    await this.page.fill('[name="probability_percent"]', data.probability_percent.toString());

    // Expected close date
    await this.page.fill('[name="expected_close_date"]', data.expected_close_date);

    // Deal owner
    await this.page.fill('[name="deal_owner"]', data.deal_owner);

    // Notes
    await this.page.fill('[name="notes"]', data.notes);
  }

  async fillPrincipalSelection(principalIds: string[]) {
    // Open principal multi-select
    await this.page.click('[data-testid="principal-multi-select"]');
    await this.page.waitForSelector('[role="listbox"]', { state: 'visible' });

    // Select each principal
    for (const principalId of principalIds) {
      const principal = testPrincipals.find(p => p.id === principalId);
      if (principal) {
        await this.page.click(`[role="option"]:has-text("${principal.name}")`);
      }
    }

    // Close dropdown
    await this.page.keyboard.press('Escape');
  }

  async selectProduct(productId: string) {
    const product = testProducts.find(p => p.id === productId);
    if (product) {
      await this.page.click('[name="product_id"]');
      await this.page.waitForSelector('[role="listbox"]', { state: 'visible' });
      await this.page.click(`[role="option"]:has-text("${product.name}")`);
    }
  }

  async toggleAutoNaming(enabled: boolean) {
    const checkbox = this.page.locator('[name="auto_generate_name"]');
    const isChecked = await checkbox.isChecked();
    if (isChecked !== enabled) {
      await checkbox.click();
    }
  }

  async getNamePreview(): Promise<string> {
    const previewElement = this.page.locator('[data-testid="name-preview"]');
    return await previewElement.textContent() || '';
  }

  async getNamePreviews(): Promise<string[]> {
    const previewElements = this.page.locator('[data-testid="name-preview-item"]');
    const count = await previewElements.count();
    const previews = [];
    
    for (let i = 0; i < count; i++) {
      const text = await previewElements.nth(i).textContent();
      if (text) previews.push(text);
    }
    
    return previews;
  }

  async submitForm() {
    await this.page.click('button[type="submit"]');
  }

  // Validation helpers
  async getFormErrors(): Promise<string[]> {
    const errorElements = await this.page.locator('[role="alert"], .text-red-500, .text-red-700').all();
    const errors = [];
    
    for (const element of errorElements) {
      const text = await element.textContent();
      if (text && text.trim()) {
        errors.push(text.trim());
      }
    }
    
    return errors;
  }

  async waitForSuccessMessage() {
    await this.page.waitForSelector('[data-testid="success-message"]', { timeout: 5000 });
  }

  // Table interaction helpers
  async searchOpportunities(query: string) {
    await this.page.fill('[name="search"]', query);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500); // Allow search to process
  }

  async filterByStage(stage: string) {
    await this.page.selectOption('[name="stage_filter"]', stage);
    await this.page.waitForTimeout(500);
  }

  async sortTable(column: string) {
    await this.page.click(`[data-sort="${column}"]`);
    await this.page.waitForTimeout(500);
  }

  async getTableRows() {
    return await this.page.locator('[data-testid="opportunity-row"]').count();
  }

  async clickOpportunityRow(index: number) {
    await this.page.click(`[data-testid="opportunity-row"]:nth-child(${index + 1})`);
  }

  async editOpportunity(index: number) {
    await this.page.click(`[data-testid="opportunity-row"]:nth-child(${index + 1}) [data-testid="edit-button"]`);
  }

  async deleteOpportunity(index: number) {
    await this.page.click(`[data-testid="opportunity-row"]:nth-child(${index + 1}) [data-testid="delete-button"]`);
    await this.page.click('[data-testid="confirm-delete"]');
  }

  // KPI helpers
  async getKPIValue(kpiName: string): Promise<string> {
    const kpiElement = this.page.locator(`[data-testid="kpi-${kpiName}"] .kpi-value`);
    return await kpiElement.textContent() || '0';
  }

  async clickKPICard(kpiName: string) {
    await this.page.click(`[data-testid="kpi-${kpiName}"]`);
  }

  // Mock API helpers for testing
  async mockOpportunityAPI() {
    // Mock successful opportunity creation
    await this.page.route('**/api/opportunities', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'test-opportunity-123',
              name: validOpportunityData.name,
              stage: validOpportunityData.stage,
              probability_percent: validOpportunityData.probability_percent,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          })
        });
      } else {
        route.continue();
      }
    });
  }

  async mockBatchCreationAPI() {
    await this.page.route('**/api/opportunities/batch', route => {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            success: true,
            created_opportunities: [
              { id: 'opp-1', name: 'Test Corp - Principal One - Q1 2025', principal_id: 'principal-1' },
              { id: 'opp-2', name: 'Test Corp - Principal Two - Q1 2025', principal_id: 'principal-2' }
            ],
            failed_opportunities: [],
            total_created: 2,
            total_failed: 0
          }
        })
      });
    });
  }

  async mockNamePreviewAPI() {
    await this.page.route('**/api/opportunities/name-preview', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              principal_id: 'principal-1',
              principal_name: 'Principal One',
              generated_name: 'Test Corporation - Principal One - New Business - Jan 2025',
              is_duplicate: false
            },
            {
              principal_id: 'principal-2',
              principal_name: 'Principal Two',
              generated_name: 'Test Corporation - Principal Two - New Business - Jan 2025',
              is_duplicate: false
            }
          ]
        })
      });
    });
  }

  async mockProductFilteringAPI() {
    await this.page.route('**/api/products/filter-by-principals', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: testProducts
        })
      });
    });
  }

  async mockKPIAPI() {
    await this.page.route('**/api/opportunities/kpis', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            total_opportunities: 15,
            active_opportunities: 12,
            average_probability: 68,
            won_this_month: 3,
            pipeline_value: 250000,
            conversion_rate: 25.5
          }
        })
      });
    });
  }
}

test.describe('Opportunity Management - Single Opportunity Creation', () => {
  test('should create opportunity with single principal successfully', async ({ page }) => {
    const helpers = new OpportunityTestHelpers(page);
    
    await helpers.mockOpportunityAPI();
    await helpers.navigateToCreateOpportunity();
    
    // Verify form loads
    await expect(page.locator('h1')).toContainText('Create New Opportunity');
    
    // Fill basic form
    await helpers.fillBasicOpportunityForm(validOpportunityData);
    await helpers.fillPrincipalSelection(['principal-1']);
    await helpers.selectProduct('product-1');
    
    // Test auto-naming
    await helpers.toggleAutoNaming(true);
    const namePreview = await helpers.getNamePreview();
    expect(namePreview).toContain('Test Corporation');
    expect(namePreview).toContain('Principal One');
    
    // Submit form
    await helpers.submitForm();
    
    // Verify success
    await helpers.waitForSuccessMessage();
    await page.waitForURL(/\/opportunities\/[a-f0-9-]+/);
  });

  test('should validate required fields', async ({ page }) => {
    const helpers = new OpportunityTestHelpers(page);
    
    await helpers.navigateToCreateOpportunity();
    
    // Try to submit empty form
    await helpers.submitForm();
    
    // Check for validation errors
    const errors = await helpers.getFormErrors();
    expect(errors.length).toBeGreaterThan(0);
    
    // Should have errors for required fields
    const errorText = errors.join(' ').toLowerCase();
    expect(errorText).toContain('required');
  });

  test('should handle manual name override', async ({ page }) => {
    const helpers = new OpportunityTestHelpers(page);
    
    await helpers.navigateToCreateOpportunity();
    
    // Fill form with auto-naming enabled
    await helpers.fillBasicOpportunityForm(validOpportunityData);
    await helpers.fillPrincipalSelection(['principal-1']);
    await helpers.toggleAutoNaming(true);
    
    // Get auto-generated name
    const autoName = await helpers.getNamePreview();
    expect(autoName).toContain('Test Corporation');
    
    // Disable auto-naming and enter manual name
    await helpers.toggleAutoNaming(false);
    await page.fill('[name="name"]', 'Custom Opportunity Name');
    
    // Verify manual name is used
    const manualName = await page.inputValue('[name="name"]');
    expect(manualName).toBe('Custom Opportunity Name');
  });
});

test.describe('Opportunity Management - Multiple Principal Batch Creation', () => {
  test('should create opportunities for multiple principals', async ({ page }) => {
    const helpers = new OpportunityTestHelpers(page);
    
    await helpers.mockBatchCreationAPI();
    await helpers.mockNamePreviewAPI();
    await helpers.navigateToCreateOpportunity();
    
    // Fill form with multiple principals
    await helpers.fillBasicOpportunityForm(validOpportunityData);
    await helpers.fillPrincipalSelection(['principal-1', 'principal-2']);
    await helpers.selectProduct('product-1');
    
    // Enable auto-naming
    await helpers.toggleAutoNaming(true);
    
    // Check name previews for multiple principals
    const previews = await helpers.getNamePreviews();
    expect(previews.length).toBe(2);
    expect(previews[0]).toContain('Principal One');
    expect(previews[1]).toContain('Principal Two');
    
    // Submit batch creation
    await helpers.submitForm();
    
    // Verify batch creation success
    await helpers.waitForSuccessMessage();
    
    // Should show batch creation results
    await expect(page.locator('[data-testid="batch-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="created-count"]')).toContainText('2');
  });

  test('should show preview for batch creation', async ({ page }) => {
    const helpers = new OpportunityTestHelpers(page);
    
    await helpers.mockNamePreviewAPI();
    await helpers.navigateToCreateOpportunity();
    
    // Fill form to trigger preview
    await helpers.fillBasicOpportunityForm(validOpportunityData);
    await helpers.fillPrincipalSelection(['principal-1', 'principal-2']);
    await helpers.toggleAutoNaming(true);
    
    // Wait for previews to load
    await page.waitForSelector('[data-testid="name-preview-item"]');
    
    // Verify preview shows multiple opportunities
    const previewItems = await page.locator('[data-testid="name-preview-item"]').count();
    expect(previewItems).toBe(2);
    
    // Verify preview content
    await expect(page.locator('[data-testid="name-preview-item"]').first()).toContainText('Principal One');
    await expect(page.locator('[data-testid="name-preview-item"]').nth(1)).toContainText('Principal Two');
  });
});

test.describe('Opportunity Management - Product Filtering', () => {
  test('should filter products based on principal selection', async ({ page }) => {
    const helpers = new OpportunityTestHelpers(page);
    
    await helpers.mockProductFilteringAPI();
    await helpers.navigateToCreateOpportunity();
    
    // Initially no products should be available (no principals selected)
    await page.click('[name="product_id"]');
    let options = await page.locator('[role="option"]').count();
    expect(options).toBe(0);
    await page.keyboard.press('Escape');
    
    // Select principals
    await helpers.fillPrincipalSelection(['principal-1']);
    
    // Now products should be filtered and available
    await page.click('[name="product_id"]');
    await page.waitForSelector('[role="option"]');
    options = await page.locator('[role="option"]').count();
    expect(options).toBeGreaterThan(0);
    
    // Verify filtered products are relevant
    await expect(page.locator('[role="option"]').first()).toContainText('Enterprise Software Suite');
  });

  test('should show empty state when no products match principals', async ({ page }) => {
    const helpers = new OpportunityTestHelpers(page);
    
    // Mock API to return no products
    await page.route('**/api/products/filter-by-principals', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: []
        })
      });
    });
    
    await helpers.navigateToCreateOpportunity();
    
    // Select principals
    await helpers.fillPrincipalSelection(['principal-1']);
    
    // Product dropdown should show empty state
    await page.click('[name="product_id"]');
    await expect(page.locator('[data-testid="no-products-message"]')).toBeVisible();
  });
});

test.describe('Opportunity Management - Form Validation', () => {
  test('should prevent invalid form submissions', async ({ page }) => {
    const helpers = new OpportunityTestHelpers(page);
    
    await helpers.navigateToCreateOpportunity();
    
    // Test invalid probability percentage
    await page.fill('[name="probability_percent"]', '150');
    await page.blur('[name="probability_percent"]');
    
    const errors = await helpers.getFormErrors();
    expect(errors.some(error => error.includes('100') || error.includes('percentage'))).toBe(true);
    
    // Test invalid date
    await page.fill('[name="expected_close_date"]', '2020-01-01'); // Past date
    await page.blur('[name="expected_close_date"]');
    
    const updatedErrors = await helpers.getFormErrors();
    expect(updatedErrors.some(error => error.includes('future') || error.includes('date'))).toBe(true);
  });

  test('should show field-specific validation messages', async ({ page }) => {
    const helpers = new OpportunityTestHelpers(page);
    
    await helpers.navigateToCreateOpportunity();
    
    // Test required organization field
    await page.focus('[name="organization_id"]');
    await page.blur('[name="organization_id"]');
    
    // Should show specific error for organization
    await expect(page.locator('[data-testid="organization-error"]')).toBeVisible();
    
    // Test required principal selection
    await page.focus('[data-testid="principal-multi-select"]');
    await page.blur('[data-testid="principal-multi-select"]');
    
    // Should show specific error for principals
    await expect(page.locator('[data-testid="principal-error"]')).toBeVisible();
  });
});

test.describe('Opportunity Management - List View and Table Operations', () => {
  test('should load opportunities list with KPIs', async ({ page }) => {
    const helpers = new OpportunityTestHelpers(page);
    
    await helpers.mockKPIAPI();
    await helpers.navigateToOpportunityList();
    
    // Verify page loads
    await expect(page.locator('h1')).toContainText('Opportunities');
    
    // Verify KPI cards are displayed
    await expect(page.locator('[data-testid="kpi-total"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-active"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-average-probability"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-won-this-month"]')).toBeVisible();
    
    // Verify KPI values
    const totalValue = await helpers.getKPIValue('total');
    expect(totalValue).toBe('15');
    
    const activeValue = await helpers.getKPIValue('active');
    expect(activeValue).toBe('12');
  });

  test('should support table sorting', async ({ page }) => {
    const helpers = new OpportunityTestHelpers(page);
    
    await helpers.navigateToOpportunityList();
    
    // Test sorting by different columns
    await helpers.sortTable('name');
    await page.waitForTimeout(500);
    
    // Verify sort indicator is shown
    await expect(page.locator('[data-sort="name"] .sort-indicator')).toBeVisible();
    
    // Test probability sorting
    await helpers.sortTable('probability_percent');
    await expect(page.locator('[data-sort="probability_percent"] .sort-indicator')).toBeVisible();
  });

  test('should support search and filtering', async ({ page }) => {
    const helpers = new OpportunityTestHelpers(page);
    
    await helpers.navigateToOpportunityList();
    
    // Test search functionality
    await helpers.searchOpportunities('Test Corporation');
    
    // Verify search is applied (mock would need to return filtered results)
    await expect(page.locator('[name="search"]')).toHaveValue('Test Corporation');
    
    // Test stage filtering
    await helpers.filterByStage('NEW_LEAD');
    
    // Verify filter is applied
    await expect(page.locator('[name="stage_filter"]')).toHaveValue('NEW_LEAD');
    
    // Test clear filters
    await page.click('[data-testid="clear-filters"]');
    await expect(page.locator('[name="search"]')).toHaveValue('');
  });

  test('should handle row interactions', async ({ page }) => {
    const helpers = new OpportunityTestHelpers(page);
    
    // Mock opportunities list
    await page.route('**/api/opportunities**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            opportunities: [
              {
                id: 'opp-1',
                name: 'Test Opportunity 1',
                stage: 'NEW_LEAD',
                probability_percent: 25,
                organization_name: 'Test Corp'
              }
            ],
            total_count: 1,
            page: 1,
            has_next: false,
            has_previous: false
          }
        })
      });
    });
    
    await helpers.navigateToOpportunityList();
    
    // Wait for table to load
    await page.waitForSelector('[data-testid="opportunity-row"]');
    
    // Test row click navigation
    await helpers.clickOpportunityRow(0);
    await page.waitForURL(/\/opportunities\/opp-1/);
    
    // Go back to list
    await helpers.navigateToOpportunityList();
    
    // Test edit button
    await helpers.editOpportunity(0);
    await page.waitForURL(/\/opportunities\/opp-1\/edit/);
  });
});

test.describe('Opportunity Management - Edit and Delete Operations', () => {
  test('should edit opportunity successfully', async ({ page }) => {
    const helpers = new OpportunityTestHelpers(page);
    
    // Mock edit APIs
    await page.route('**/api/opportunities/test-opp-123', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'test-opp-123',
              name: 'Test Opportunity',
              stage: 'NEW_LEAD',
              probability_percent: 25,
              expected_close_date: '2025-03-31',
              deal_owner: 'Sales Rep',
              notes: 'Original notes'
            }
          })
        });
      } else if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'test-opp-123',
              name: 'Updated Opportunity',
              stage: 'INITIAL_OUTREACH',
              probability_percent: 40,
              updated_at: new Date().toISOString()
            }
          })
        });
      }
    });
    
    await helpers.navigateToEditOpportunity('test-opp-123');
    
    // Verify form loads with existing data
    await expect(page.locator('[name="name"]')).toHaveValue('Test Opportunity');
    await expect(page.locator('[name="stage"]')).toHaveValue('NEW_LEAD');
    
    // Make changes
    await page.fill('[name="name"]', 'Updated Opportunity');
    await page.selectOption('[name="stage"]', 'INITIAL_OUTREACH');
    await page.fill('[name="probability_percent"]', '40');
    
    // Submit changes
    await helpers.submitForm();
    
    // Verify success
    await helpers.waitForSuccessMessage();
  });

  test('should delete opportunity with confirmation', async ({ page }) => {
    const helpers = new OpportunityTestHelpers(page);
    
    // Mock delete API
    await page.route('**/api/opportunities/test-opp-123', route => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true
          })
        });
      }
    });
    
    await helpers.navigateToOpportunityList();
    
    // Mock list with opportunity
    await page.route('**/api/opportunities**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json', 
        body: JSON.stringify({
          success: true,
          data: {
            opportunities: [
              {
                id: 'test-opp-123',
                name: 'Test Opportunity',
                stage: 'NEW_LEAD'
              }
            ],
            total_count: 1
          }
        })
      });
    });
    
    await page.reload();
    await page.waitForSelector('[data-testid="opportunity-row"]');
    
    // Delete opportunity
    await helpers.deleteOpportunity(0);
    
    // Verify deletion (opportunity should be removed from list)
    await expect(page.locator('[data-testid="opportunity-row"]')).toHaveCount(0);
  });
});

test.describe('Opportunity Management - Contextual Creation', () => {
  test('should create opportunity from contact detail page', async ({ page }) => {
    const helpers = new OpportunityTestHelpers(page);
    
    // Mock contact detail page
    await page.route('**/api/contacts/test-contact-123', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'test-contact-123',
            first_name: 'John',
            last_name: 'Doe',
            organization_id: 'test-org-123',
            organization_name: 'Test Corporation'
          }
        })
      });
    });
    
    // Navigate to contact detail page
    await page.goto('/contacts/test-contact-123');
    await page.waitForLoadState('networkidle');
    
    // Click "Create Opportunity" button
    await page.click('[data-testid="create-opportunity-btn"]');
    
    // Should navigate to opportunity creation with context
    await page.waitForURL(/\/opportunities\/new/);
    
    // Verify organization is pre-populated
    const orgValue = await page.inputValue('[name="organization_id"]');
    expect(orgValue).toBe('test-org-123');
    
    // Verify context indicates it's from contact
    await expect(page.locator('[data-testid="creation-context"]')).toContainText('contact');
  });

  test('should create opportunity from organization detail page', async ({ page }) => {
    const helpers = new OpportunityTestHelpers(page);
    
    // Mock organization detail page
    await page.route('**/api/organizations/test-org-123', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'test-org-123',
            name: 'Test Corporation',
            segment: 'Technology',
            business_type: 'B2B'
          }
        })
      });
    });
    
    // Navigate to organization detail page
    await page.goto('/organizations/test-org-123');
    await page.waitForLoadState('networkidle');
    
    // Click "Create Opportunity" button
    await page.click('[data-testid="create-opportunity-btn"]');
    
    // Should navigate to opportunity creation with context
    await page.waitForURL(/\/opportunities\/new/);
    
    // Verify organization is pre-populated
    const orgValue = await page.inputValue('[name="organization_id"]');
    expect(orgValue).toBe('test-org-123');
    
    // Verify context indicates it's from organization
    await expect(page.locator('[data-testid="creation-context"]')).toContainText('organization');
  });
});

test.describe('Opportunity Management - KPI Calculations', () => {
  test('should display accurate KPI calculations', async ({ page }) => {
    const helpers = new OpportunityTestHelpers(page);
    
    await helpers.mockKPIAPI();
    await helpers.navigateToOpportunityList();
    
    // Verify KPI values are accurate
    const totalValue = await helpers.getKPIValue('total');
    const activeValue = await helpers.getKPIValue('active');
    const avgProbability = await helpers.getKPIValue('average-probability');
    const wonThisMonth = await helpers.getKPIValue('won-this-month');
    
    expect(parseInt(totalValue)).toBeGreaterThan(0);
    expect(parseInt(activeValue)).toBeLessThanOrEqual(parseInt(totalValue));
    expect(parseFloat(avgProbability)).toBeGreaterThanOrEqual(0);
    expect(parseFloat(avgProbability)).toBeLessThanOrEqual(100);
    expect(parseInt(wonThisMonth)).toBeGreaterThanOrEqual(0);
  });

  test('should handle KPI card interactions', async ({ page }) => {
    const helpers = new OpportunityTestHelpers(page);
    
    await helpers.mockKPIAPI();
    await helpers.navigateToOpportunityList();
    
    // Click on active opportunities KPI
    await helpers.clickKPICard('active');
    
    // Should filter to show only active opportunities
    // This would depend on implementation - verify filter is applied
    await expect(page.locator('[data-testid="active-filter-indicator"]')).toBeVisible();
  });
});

test.describe('Opportunity Management - Performance and Error Handling', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    const helpers = new OpportunityTestHelpers(page);
    
    // Mock API error
    await page.route('**/api/opportunities', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal server error'
        })
      });
    });
    
    await helpers.navigateToOpportunityList();
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('server error');
    
    // Should show retry button
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('should handle network timeouts', async ({ page }) => {
    const helpers = new OpportunityTestHelpers(page);
    
    // Mock slow/timeout response
    await page.route('**/api/opportunities', route => {
      // Simulate timeout by not responding
      setTimeout(() => {
        route.abort('timeout');
      }, 1000);
    });
    
    await helpers.navigateToOpportunityList();
    
    // Should show loading state initially
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    
    // Should eventually show error state
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 10000 });
  });

  test('should load list page within performance requirements', async ({ page }) => {
    const helpers = new OpportunityTestHelpers(page);
    
    const startTime = Date.now();
    
    await helpers.navigateToOpportunityList();
    
    // Wait for page to be fully loaded
    await page.waitForSelector('[data-testid="opportunity-table"]');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds as per requirements
    expect(loadTime).toBeLessThan(3000);
  });
});

test.describe('Opportunity Management - Accessibility', () => {
  test('should support keyboard navigation', async ({ page }) => {
    const helpers = new OpportunityTestHelpers(page);
    
    await helpers.navigateToCreateOpportunity();
    
    // Test tab navigation through form
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'SELECT', 'BUTTON'].includes(focused)).toBe(true);
    
    // Test form submission with Enter key
    await helpers.fillBasicOpportunityForm(validOpportunityData);
    await helpers.fillPrincipalSelection(['principal-1']);
    
    // Focus submit button and press Enter
    await page.locator('button[type="submit"]').focus();
    await page.keyboard.press('Enter');
    
    // Should trigger form submission
    await page.waitForTimeout(500);
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    const helpers = new OpportunityTestHelpers(page);
    
    await helpers.navigateToCreateOpportunity();
    
    // Check required fields have proper ARIA
    await expect(page.locator('[name="organization_id"]')).toHaveAttribute('aria-required', 'true');
    
    // Check error messages have proper ARIA
    await helpers.submitForm(); // Trigger validation
    const errorElements = page.locator('[role="alert"]');
    expect(await errorElements.count()).toBeGreaterThan(0);
    
    // Check form labels are properly associated
    const nameLabel = page.locator('label[for*="name"]');
    await expect(nameLabel).toBeVisible();
  });

  test('should work with screen readers', async ({ page }) => {
    const helpers = new OpportunityTestHelpers(page);
    
    await helpers.navigateToOpportunityList();
    
    // Check main heading structure
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h1')).toHaveAttribute('role', 'heading');
    
    // Check table has proper structure
    await expect(page.locator('[role="table"]')).toBeVisible();
    await expect(page.locator('[role="columnheader"]')).toHaveCount(6); // Adjust based on actual columns
    
    // Check status messages are announced
    await page.route('**/api/opportunities', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { opportunities: [], total_count: 0 }
        })
      });
    });
    
    await page.reload();
    await expect(page.locator('[role="status"]')).toBeVisible();
  });
});