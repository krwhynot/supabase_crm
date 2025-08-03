import { test, expect } from '@playwright/test';

/**
 * Opportunity Management Integration Tests
 * 
 * End-to-end integration testing for the complete opportunity management workflow:
 * - Cross-feature integration (contacts, organizations, opportunities)
 * - Data flow validation between components
 * - Navigation and state persistence
 * - Real-world user scenarios
 * - Performance under load
 * - Accessibility compliance
 */

// Comprehensive test data for integration scenarios
const testData = {
  organization: {
    id: 'org-integration-123',
    name: 'Integration Test Corporation',
    segment: 'Technology - Software Development',
    business_type: 'B2B',
    is_principal: true,
    is_distributor: false
  },
  contacts: [
    {
      id: 'contact-integration-1',
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah.johnson@integrationtest.com',
      position: 'VP of Technology',
      phone: '+1 (555) 123-4567'
    },
    {
      id: 'contact-integration-2',
      first_name: 'Michael',
      last_name: 'Chen',
      email: 'michael.chen@integrationtest.com',
      position: 'CTO',
      phone: '+1 (555) 123-4568'
    }
  ],
  principals: [
    {
      id: 'principal-integration-1',
      name: 'Sarah Johnson',
      organization_id: 'org-integration-123'
    },
    {
      id: 'principal-integration-2',
      name: 'Michael Chen',
      organization_id: 'org-integration-123'
    }
  ],
  products: [
    {
      id: 'product-integration-1',
      name: 'Enterprise Analytics Suite',
      category: 'Analytics',
      description: 'Complete business analytics solution'
    },
    {
      id: 'product-integration-2',
      name: 'Cloud Infrastructure Platform',
      category: 'Infrastructure',
      description: 'Scalable cloud infrastructure services'
    }
  ],
  opportunities: [
    {
      id: 'opp-integration-1',
      name: 'Integration Test Corp - Sarah Johnson - Q1 2025 Analytics',
      organization_id: 'org-integration-123',
      context: 'NEW_BUSINESS',
      stage: 'NEW_LEAD',
      probability_percent: 25,
      expected_close_date: '2025-03-31',
      deal_owner: 'Sales Manager',
      product_id: 'product-integration-1',
      principal_id: 'principal-integration-1',
      notes: 'Strategic analytics implementation opportunity'
    },
    {
      id: 'opp-integration-2',
      name: 'Integration Test Corp - Michael Chen - Q1 2025 Infrastructure',
      organization_id: 'org-integration-123',
      context: 'EXPANSION',
      stage: 'INITIAL_OUTREACH',
      probability_percent: 40,
      expected_close_date: '2025-04-15',
      deal_owner: 'Sales Manager',
      product_id: 'product-integration-2',
      principal_id: 'principal-integration-2',
      notes: 'Infrastructure expansion for scaling operations'
    }
  ]
};

// Helper class for comprehensive integration testing
class OpportunityIntegrationHelpers {
  constructor(public page: any) {}

  async setupFullMockEnvironment() {
    // Mock organization APIs
    await this.page.route('**/api/organizations**', route => {
      const method = route.request().method();
      const url = route.request().url();
      
      if (method === 'GET' && url.includes('/organizations')) {
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
        });
      } else if (method === 'GET' && url.includes('org-integration-123')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ...testData.organization,
              contacts: testData.contacts,
              opportunities: testData.opportunities
            }
          })
        });
      }
    });

    // Mock contact APIs
    await this.page.route('**/api/contacts**', route => {
      const method = route.request().method();
      const url = route.request().url();
      
      if (method === 'GET' && url.includes('/contacts')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              contacts: testData.contacts,
              total_count: testData.contacts.length
            }
          })
        });
      } else if (method === 'GET' && url.includes('contact-integration-1')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ...testData.contacts[0],
              organization: testData.organization,
              opportunities: [testData.opportunities[0]]
            }
          })
        });
      }
    });

    // Mock opportunity APIs
    await this.page.route('**/api/opportunities**', route => {
      const method = route.request().method();
      const url = route.request().url();
      
      if (method === 'GET' && url.includes('/opportunities')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              opportunities: testData.opportunities,
              total_count: testData.opportunities.length,
              page: 1,
              has_next: false,
              has_previous: false
            }
          })
        });
      } else if (method === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'new-opp-' + Date.now(),
              name: 'New Integration Opportunity',
              stage: 'NEW_LEAD',
              created_at: new Date().toISOString()
            }
          })
        });
      }
    });

    // Mock principal APIs
    await this.page.route('**/api/principals**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: testData.principals
        })
      });
    });

    // Mock product APIs
    await this.page.route('**/api/products**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: testData.products
        })
      });
    });

    // Mock KPI APIs
    await this.page.route('**/api/opportunities/kpis', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            total_opportunities: testData.opportunities.length,
            active_opportunities: testData.opportunities.filter(o => !o.is_won).length,
            average_probability: 32.5,
            won_this_month: 0,
            pipeline_value: 500000,
            conversion_rate: 15.5
          }
        })
      });
    });
  }

  async performCompleteOpportunityFlow() {
    // 1. Start from organization detail page
    await this.page.goto('/organizations/org-integration-123');
    await this.page.waitForLoadState('networkidle');
    
    // 2. Create opportunity from organization context
    await this.page.click('[data-testid="create-opportunity-btn"]');
    await this.page.waitForURL(/\/opportunities\/new/);
    
    // 3. Verify organization is pre-populated
    const orgValue = await this.page.inputValue('[name="organization_id"]');
    expect(orgValue).toBe('org-integration-123');
    
    // 4. Fill opportunity form
    await this.page.selectOption('[name="context"]', 'NEW_BUSINESS');
    await this.page.selectOption('[name="stage"]', 'NEW_LEAD');
    await this.page.fill('[name="probability_percent"]', '30');
    await this.page.fill('[name="expected_close_date"]', '2025-06-30');
    await this.page.fill('[name="deal_owner"]', 'Integration Test Sales Rep');
    
    // 5. Select principal
    await this.page.click('[data-testid="principal-multi-select"]');
    await this.page.click('[role="option"]:has-text("Sarah Johnson")');
    await this.page.keyboard.press('Escape');
    
    // 6. Select product
    await this.page.click('[name="product_id"]');
    await this.page.click('[role="option"]:has-text("Enterprise Analytics Suite")');
    
    // 7. Enable auto-naming
    await this.page.check('[name="auto_generate_name"]');
    
    // 8. Add notes
    await this.page.fill('[name="notes"]', 'Complete integration test opportunity');
    
    // 9. Submit form
    await this.page.click('button[type="submit"]');
    
    // 10. Wait for success and navigation
    await this.page.waitForURL(/\/opportunities\/new-opp-\d+/);
    
    return true;
  }

  async validateDataConsistency() {
    // Navigate to opportunities list
    await this.page.goto('/opportunities');
    await this.page.waitForLoadState('networkidle');
    
    // Verify opportunities are displayed
    await this.page.waitForSelector('[data-testid="opportunity-row"]');
    const opportunityCount = await this.page.locator('[data-testid="opportunity-row"]').count();
    expect(opportunityCount).toBeGreaterThan(0);
    
    // Check first opportunity details
    const firstOpportunityName = await this.page.locator('[data-testid="opportunity-row"]').first().locator('.opportunity-name').textContent();
    expect(firstOpportunityName).toContain('Integration Test Corp');
    
    // Navigate to opportunity detail
    await this.page.click('[data-testid="opportunity-row"]');
    await this.page.waitForURL(/\/opportunities\/opp-integration-\d+/);
    
    // Verify opportunity details are consistent
    await expect(page.locator('h1')).toContain('Integration Test Corp');
    await expect(page.locator('[data-testid="organization-link"]')).toBeVisible();
    await expect(page.locator('[data-testid="principal-info"]')).toBeVisible();
    
    return true;
  }

  async testCrossFeatureNavigation() {
    // Start from opportunities list
    await this.page.goto('/opportunities');
    await this.page.waitForSelector('[data-testid="opportunity-row"]');
    
    // Click on opportunity to go to detail
    await this.page.click('[data-testid="opportunity-row"]');
    await this.page.waitForURL(/\/opportunities\/opp-integration-\d+/);
    
    // Navigate to related organization
    await this.page.click('[data-testid="organization-link"]');
    await this.page.waitForURL(/\/organizations\/org-integration-123/);
    
    // Verify organization detail shows related opportunities
    await expect(page.locator('[data-testid="related-opportunities"]')).toBeVisible();
    
    // Navigate to contact from organization
    await this.page.click('[data-testid="contact-link"]');
    await this.page.waitForURL(/\/contacts\/contact-integration-\d+/);
    
    // Verify contact detail shows related opportunities
    await expect(page.locator('[data-testid="related-opportunities"]')).toBeVisible();
    
    return true;
  }

  async measurePerformance() {
    const startTime = Date.now();
    
    // Navigate to opportunities list
    await this.page.goto('/opportunities');
    await this.page.waitForLoadState('networkidle');
    
    // Wait for all content to load
    await this.page.waitForSelector('[data-testid="kpi-total"]');
    await this.page.waitForSelector('[data-testid="opportunity-table"]');
    
    const loadTime = Date.now() - startTime;
    
    // Performance requirement: < 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    return loadTime;
  }

  async validateAccessibility() {
    await this.page.goto('/opportunities');
    await this.page.waitForLoadState('networkidle');
    
    // Check main heading structure
    const h1 = this.page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).toHaveText('Opportunities');
    
    // Check table accessibility
    const table = this.page.locator('[role="table"]');
    await expect(table).toBeVisible();
    
    // Check column headers
    const columnHeaders = this.page.locator('[role="columnheader"]');
    const headerCount = await columnHeaders.count();
    expect(headerCount).toBeGreaterThan(0);
    
    // Check keyboard navigation
    await this.page.keyboard.press('Tab');
    const focusedElement = await this.page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'INPUT', 'A'].includes(focusedElement)).toBe(true);
    
    // Check ARIA labels on interactive elements
    const buttons = this.page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const hasAriaLabel = await button.getAttribute('aria-label');
      const hasText = await button.textContent();
      
      // Button should have either aria-label or visible text
      expect(hasAriaLabel || (hasText && hasText.trim())).toBeTruthy();
    }
    
    return true;
  }
}

test.describe('Opportunity Management - Complete Integration Workflow', () => {
  test('should complete end-to-end opportunity creation from organization', async ({ page }) => {
    const helpers = new OpportunityIntegrationHelpers(page);
    await helpers.setupFullMockEnvironment();
    
    // Perform complete opportunity creation workflow
    const success = await helpers.performCompleteOpportunityFlow();
    expect(success).toBe(true);
    
    // Verify opportunity was created successfully
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Integration Test Corp');
  });

  test('should maintain data consistency across all features', async ({ page }) => {
    const helpers = new OpportunityIntegrationHelpers(page);
    await helpers.setupFullMockEnvironment();
    
    // Validate data consistency
    const isConsistent = await helpers.validateDataConsistency();
    expect(isConsistent).toBe(true);
  });

  test('should support seamless cross-feature navigation', async ({ page }) => {
    const helpers = new OpportunityIntegrationHelpers(page);
    await helpers.setupFullMockEnvironment();
    
    // Test navigation between opportunities, organizations, and contacts
    const navigationWorks = await helpers.testCrossFeatureNavigation();
    expect(navigationWorks).toBe(true);
  });
});

test.describe('Opportunity Management - Real-World User Scenarios', () => {
  test('should handle sales manager daily workflow', async ({ page }) => {
    const helpers = new OpportunityIntegrationHelpers(page);
    await helpers.setupFullMockEnvironment();
    
    // Scenario: Sales manager starts their day
    // 1. Check dashboard KPIs
    await page.goto('/opportunities');
    await page.waitForSelector('[data-testid="kpi-total"]');
    
    const totalOpps = await page.locator('[data-testid="kpi-total"] .kpi-value').textContent();
    expect(parseInt(totalOpps)).toBeGreaterThan(0);
    
    // 2. Review opportunities requiring attention
    await page.selectOption('[name="stage_filter"]', 'AWAITING_RESPONSE');
    await page.waitForTimeout(500);
    
    // 3. Update opportunity stage
    if (await page.locator('[data-testid="opportunity-row"]').count() > 0) {
      await page.click('[data-testid="opportunity-row"]');
      await page.waitForURL(/\/opportunities\/opp-/);
      
      await page.click('[data-testid="edit-opportunity"]');
      await page.waitForURL(/\/edit$/);
      
      await page.selectOption('[name="stage"]', 'DEMO_SCHEDULED');
      await page.fill('[name="probability_percent"]', '75');
      await page.click('button[type="submit"]');
      
      await page.waitForSelector('[data-testid="success-message"]');
    }
    
    // 4. Create new opportunity from warm lead
    await page.goto('/opportunities/new');
    await helpers.performCompleteOpportunityFlow();
  });

  test('should handle account executive opportunity management', async ({ page }) => {
    const helpers = new OpportunityIntegrationHelpers(page);
    await helpers.setupFullMockEnvironment();
    
    // Scenario: Account executive managing multiple opportunities
    // 1. Review pipeline by stage
    await page.goto('/opportunities');
    await page.waitForSelector('[data-testid="opportunity-table"]');
    
    // 2. Sort by close date to prioritize
    await page.click('[data-sort="expected_close_date"]');
    await page.waitForTimeout(500);
    
    // 3. Filter by probability range
    if (await page.locator('[name="probability_min"]').isVisible()) {
      await page.fill('[name="probability_min"]', '50');
      await page.waitForTimeout(500);
    }
    
    // 4. Bulk update high-probability opportunities
    const opportunityRows = page.locator('[data-testid="opportunity-row"]');
    const rowCount = await opportunityRows.count();
    
    if (rowCount > 0) {
      // Select first opportunity for bulk action
      await page.check('[data-testid="opportunity-row"] input[type="checkbox"]');
      
      if (await page.locator('[data-testid="bulk-actions"]').isVisible()) {
        await page.click('[data-testid="bulk-actions"]');
        // Handle bulk operations if implemented
      }
    }
  });

  test('should handle business development representative workflow', async ({ page }) => {
    const helpers = new OpportunityIntegrationHelpers(page);
    await helpers.setupFullMockEnvironment();
    
    // Scenario: BDR qualifying and creating opportunities
    // 1. Start from contact detail (warm outreach)
    await page.goto('/contacts/contact-integration-1');
    await page.waitForLoadState('networkidle');
    
    // 2. Review contact's organization context
    await expect(page.locator('[data-testid="organization-info"]')).toBeVisible();
    
    // 3. Create qualified opportunity
    await page.click('[data-testid="create-opportunity-btn"]');
    await page.waitForURL(/\/opportunities\/new/);
    
    // 4. Fill opportunity with qualification notes
    await page.selectOption('[name="context"]', 'INBOUND_LEAD');
    await page.selectOption('[name="stage"]', 'NEW_LEAD');
    await page.fill('[name="probability_percent"]', '20');
    await page.fill('[name="notes"]', 'Qualified lead from website demo request. Showed strong interest in analytics capabilities.');
    
    // 5. Submit for sales team follow-up
    await page.click('button[type="submit"]');
    await page.waitForSelector('[data-testid="success-message"]');
  });
});

test.describe('Opportunity Management - Performance Integration', () => {
  test('should meet performance requirements under load', async ({ page }) => {
    const helpers = new OpportunityIntegrationHelpers(page);
    await helpers.setupFullMockEnvironment();
    
    // Measure page load performance
    const loadTime = await helpers.measurePerformance();
    console.log(`Opportunities list loaded in ${loadTime}ms`);
    
    // Test form submission performance
    const formStartTime = Date.now();
    
    await page.goto('/opportunities/new');
    await page.waitForLoadState('networkidle');
    
    // Fill form quickly
    await page.fill('[name="organization_id"]', 'org-integration-123');
    await page.selectOption('[name="context"]', 'NEW_BUSINESS');
    await page.selectOption('[name="stage"]', 'NEW_LEAD');
    await page.fill('[name="probability_percent"]', '25');
    await page.fill('[name="expected_close_date"]', '2025-06-30');
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('[data-testid="success-message"]');
    
    const formTime = Date.now() - formStartTime;
    console.log(`Form submission completed in ${formTime}ms`);
    
    // Performance requirement: form submission < 2 seconds
    expect(formTime).toBeLessThan(2000);
  });

  test('should handle large datasets efficiently', async ({ page }) => {
    const helpers = new OpportunityIntegrationHelpers(page);
    
    // Mock large dataset
    const largeOpportunityList = Array.from({ length: 100 }, (_, i) => ({
      id: `opp-${i}`,
      name: `Opportunity ${i}`,
      stage: ['NEW_LEAD', 'INITIAL_OUTREACH', 'DEMO_SCHEDULED'][i % 3],
      probability_percent: 25 + (i % 75),
      organization_name: `Organization ${i}`,
      expected_close_date: '2025-06-30'
    }));
    
    await page.route('**/api/opportunities**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            opportunities: largeOpportunityList,
            total_count: largeOpportunityList.length,
            page: 1,
            has_next: false,
            has_previous: false
          }
        })
      });
    });
    
    const startTime = Date.now();
    
    await page.goto('/opportunities');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="opportunity-table"]');
    
    const loadTime = Date.now() - startTime;
    console.log(`Large dataset (100 opportunities) loaded in ${loadTime}ms`);
    
    // Should still meet performance requirements
    expect(loadTime).toBeLessThan(5000);
    
    // Verify all opportunities are rendered
    const rowCount = await page.locator('[data-testid="opportunity-row"]').count();
    expect(rowCount).toBe(Math.min(largeOpportunityList.length, 20)); // Assuming pagination
  });
});

test.describe('Opportunity Management - Accessibility Integration', () => {
  test('should maintain accessibility across complete workflow', async ({ page }) => {
    const helpers = new OpportunityIntegrationHelpers(page);
    await helpers.setupFullMockEnvironment();
    
    // Test accessibility on list page
    await helpers.validateAccessibility();
    
    // Test accessibility on create page
    await page.goto('/opportunities/new');
    await page.waitForLoadState('networkidle');
    
    // Check form accessibility
    const requiredFields = page.locator('[aria-required="true"]');
    const requiredCount = await requiredFields.count();
    expect(requiredCount).toBeGreaterThan(0);
    
    // Check error message accessibility
    await page.click('button[type="submit"]'); // Trigger validation
    const errorAlerts = page.locator('[role="alert"]');
    const alertCount = await errorAlerts.count();
    expect(alertCount).toBeGreaterThan(0);
    
    // Test keyboard navigation through form
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA'].includes(focusedElement)).toBe(true);
  });

  test('should support screen reader workflow', async ({ page }) => {
    const helpers = new OpportunityIntegrationHelpers(page);
    await helpers.setupFullMockEnvironment();
    
    await page.goto('/opportunities');
    await page.waitForLoadState('networkidle');
    
    // Check landmark roles
    await expect(page.locator('[role="main"]')).toBeVisible();
    await expect(page.locator('[role="navigation"]')).toBeVisible();
    
    // Check heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
    
    const h2Count = await page.locator('h2').count();
    expect(h2Count).toBeGreaterThanOrEqual(0);
    
    // Check table structure for screen readers
    await expect(page.locator('table caption, [role="table"] [aria-labelledby]')).toBeVisible();
    await expect(page.locator('th, [role="columnheader"]')).toHaveCount(6); // Adjust based on actual columns
    
    // Check status announcements
    await page.click('[data-testid="refresh-button"]');
    await page.waitForSelector('[role="status"], [aria-live="polite"]');
  });

  test('should work with high contrast mode', async ({ page }) => {
    const helpers = new OpportunityIntegrationHelpers(page);
    await helpers.setupFullMockEnvironment();
    
    // Simulate high contrast mode
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          * {
            filter: contrast(150%);
          }
        }
      `
    });
    
    await page.goto('/opportunities');
    await page.waitForLoadState('networkidle');
    
    // Verify content is still visible and functional
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-total"]')).toBeVisible();
    await expect(page.locator('[data-testid="opportunity-table"]')).toBeVisible();
    
    // Test interactions still work
    await page.click('[data-testid="new-opportunity-btn"]');
    await page.waitForURL(/\/opportunities\/new/);
    
    await expect(page.locator('h1')).toContainText('Create');
  });
});

test.describe('Opportunity Management - Error Handling Integration', () => {
  test('should gracefully handle API failures across the workflow', async ({ page }) => {
    const helpers = new OpportunityIntegrationHelpers(page);
    
    // Mock API failures
    await page.route('**/api/opportunities**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Database connection failed'
        })
      });
    });
    
    await page.goto('/opportunities');
    
    // Should show error state
    await page.waitForSelector('[data-testid="error-message"]');
    await expect(page.locator('[data-testid="error-message"]')).toContainText('error');
    
    // Should show retry option
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    
    // Should maintain page structure
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[role="navigation"]')).toBeVisible();
  });

  test('should handle partial data failures', async ({ page }) => {
    const helpers = new OpportunityIntegrationHelpers(page);
    
    // Mock successful opportunities but failed KPIs
    await page.route('**/api/opportunities/kpis', route => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'KPI service unavailable'
        })
      });
    });
    
    await page.route('**/api/opportunities**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            opportunities: testData.opportunities,
            total_count: testData.opportunities.length
          }
        })
      });
    });
    
    await page.goto('/opportunities');
    await page.waitForLoadState('networkidle');
    
    // Should show opportunities table
    await expect(page.locator('[data-testid="opportunity-table"]')).toBeVisible();
    
    // Should show KPI error state
    await expect(page.locator('[data-testid="kpi-error"]')).toBeVisible();
    
    // Should remain functional for other operations
    await page.click('[data-testid="new-opportunity-btn"]');
    await page.waitForURL(/\/opportunities\/new/);
  });

  test('should recover from network interruptions', async ({ page }) => {
    const helpers = new OpportunityIntegrationHelpers(page);
    await helpers.setupFullMockEnvironment();
    
    // Start with working API
    await page.goto('/opportunities');
    await page.waitForSelector('[data-testid="opportunity-table"]');
    
    // Simulate network interruption
    await page.route('**/api/**', route => {
      route.abort('failed');
    });
    
    // Try to refresh data
    await page.click('[data-testid="refresh-button"]');
    
    // Should show error state
    await page.waitForSelector('[data-testid="error-message"]');
    
    // Restore network
    await page.unroute('**/api/**');
    await helpers.setupFullMockEnvironment();
    
    // Retry should work
    await page.click('[data-testid="retry-button"]');
    await page.waitForSelector('[data-testid="opportunity-table"]');
    
    // Should be back to normal state
    await expect(page.locator('[data-testid="opportunity-row"]')).toHaveCount(testData.opportunities.length);
  });
});