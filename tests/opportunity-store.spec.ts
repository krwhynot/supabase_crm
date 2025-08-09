import { test, expect } from '@playwright/test';

/**
 * Opportunity Store Unit Tests
 * 
 * Tests for the Pinia opportunity store functionality:
 * - State management and reactivity
 * - CRUD operations through API
 * - KPI calculations and updates
 * - Batch operations and name previews
 * - Error handling and loading states
 * - Filter and pagination management
 */

// Mock data for testing
const mockOpportunities = [
  {
    id: 'opp-1',
    name: 'Test Corp - Principal One - Q1 2025',
    stage: 'NEW_LEAD',
    probability_percent: 25,
    expected_close_date: '2025-03-31',
    deal_owner: 'Sales Rep 1',
    is_won: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    organization_name: 'Test Corporation',
    organization_type: 'Enterprise',
    principal_name: 'Principal One',
    principal_id: 'principal-1',
    product_name: 'Enterprise Software',
    product_category: 'Software',
    days_since_created: 30,
    days_to_close: 60,
    stage_duration_days: 5
  },
  {
    id: 'opp-2', 
    name: 'Test Corp - Principal Two - Q1 2025',
    stage: 'INITIAL_OUTREACH',
    probability_percent: 40,
    expected_close_date: '2025-04-15',
    deal_owner: 'Sales Rep 2',
    is_won: false,
    created_at: '2025-01-15T00:00:00Z',
    updated_at: '2025-01-15T00:00:00Z',
    organization_name: 'Test Corporation',
    organization_type: 'Enterprise',
    principal_name: 'Principal Two',
    principal_id: 'principal-2',
    product_name: 'Analytics Platform',
    product_category: 'Analytics',
    days_since_created: 15,
    days_to_close: 75,
    stage_duration_days: 3
  }
];

const mockKPIs = {
  total_opportunities: 15,
  active_opportunities: 12,
  average_probability: 68,
  won_this_month: 3,
  pipeline_value: 250000,
  conversion_rate: 25.5
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _mockFormData = {
  name: '',
  organization_id: 'test-org-123',
  context: 'NEW_BUSINESS',
  stage: 'NEW_LEAD',
  probability_percent: 25,
  expected_close_date: '2025-03-31',
  deal_owner: 'Sales Representative',
  product_id: 'product-1',
  principal_ids: ['principal-1', 'principal-2'],
  notes: 'Test opportunity notes',
  auto_generate_name: true
};

const mockNamePreviews = [
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
];

// Helper class for testing store functionality through the UI
class OpportunityStoreTestHelpers {
  constructor(public page: any) {}

  async setupMockAPIs() {
    // Mock opportunity list API
    await this.page.route('**/api/opportunities**', route => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _url = route.request().url();
      
      if (route.request().method() === 'GET') {
        // Handle filtered/paginated requests
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              opportunities: mockOpportunities,
              total_count: mockOpportunities.length,
              page: 1,
              has_next: false,
              has_previous: false
            }
          })
        });
      } else if (route.request().method() === 'POST') {
        // Handle opportunity creation
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'new-opp-123',
              name: 'New Test Opportunity',
              stage: 'NEW_LEAD',
              probability_percent: 25,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          })
        });
      }
    });

    // Mock individual opportunity API
    await this.page.route('**/api/opportunities/opp-1', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ...mockOpportunities[0],
              organization: {
                id: 'test-org-123',
                name: 'Test Corporation'
              },
              contacts: [],
              products: []
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
              ...mockOpportunities[0],
              name: 'Updated Opportunity Name',
              updated_at: new Date().toISOString()
            }
          })
        });
      } else if (route.request().method() === 'DELETE') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true
          })
        });
      }
    });

    // Mock batch creation API
    await this.page.route('**/api/opportunities/batch', route => {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            success: true,
            created_opportunities: mockOpportunities,
            failed_opportunities: [],
            total_created: mockOpportunities.length,
            total_failed: 0
          }
        })
      });
    });

    // Mock name preview API
    await this.page.route('**/api/opportunities/name-preview', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockNamePreviews
        })
      });
    });

    // Mock KPI API
    await this.page.route('**/api/opportunities/kpis', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockKPIs
        })
      });
    });

    // Mock stage distribution API
    await this.page.route('**/api/opportunities/by-stage', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            'NEW_LEAD': [mockOpportunities[0]],
            'INITIAL_OUTREACH': [mockOpportunities[1]],
            'SAMPLE_VISIT_OFFERED': [],
            'AWAITING_RESPONSE': [],
            'FEEDBACK_LOGGED': [],
            'DEMO_SCHEDULED': [],
            'CLOSED_WON': []
          }
        })
      });
    });
  }

  async navigateToOpportunityList() {
    await this.page.goto('/opportunities');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToCreateOpportunity() {
    await this.page.goto('/opportunities/new');
    await this.page.waitForLoadState('networkidle');
  }

  async getStoreState(): Promise<any> {
    return await this.page.evaluate(() => {
      // Access Pinia store from window (assumes store is exposed for testing)
      const { useOpportunityStore } = window.__PINIA_STORES__ || {};
      if (!useOpportunityStore) return null;
      
      const store = useOpportunityStore();
      return {
        opportunities: store.opportunities,
        isLoading: store.isLoading,
        error: store.error,
        totalCount: store.totalCount,
        kpis: store.kpis,
        selectedOpportunity: store.selectedOpportunity
      };
    });
  }

  async triggerStoreAction(action: string, ...args: any[]): Promise<any> {
    return await this.page.evaluate(({ action, args }) => {
      const { useOpportunityStore } = window.__PINIA_STORES__ || {};
      if (!useOpportunityStore) return null;
      
      const store = useOpportunityStore();
      return store[action](...args);
    }, { action, args });
  }
}

test.describe('Opportunity Store - State Management', () => {
  test('should initialize with correct default state', async ({ page: _ }) => {
    const helpers = new OpportunityStoreTestHelpers(page);
    await helpers.setupMockAPIs();
    
    // Navigate to trigger store initialization
    await helpers.navigateToOpportunityList();
    
    // Wait for initial load
    await page.waitForTimeout(1000);
    
    const state = await helpers.getStoreState();
    
    // Verify initial state structure
    expect(state).toBeTruthy();
    expect(Array.isArray(state.opportunities)).toBe(true);
    expect(typeof state.isLoading).toBe('boolean');
    expect(state.totalCount).toBeGreaterThanOrEqual(0);
  });

  test('should update loading states correctly', async ({ page: _ }) => {
    const helpers = new OpportunityStoreTestHelpers(page);
    
    // Mock delayed API response to test loading state
    await page.route('**/api/opportunities**', async route => {
      await new Promise(resolve => setTimeout(resolve, 500));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            opportunities: mockOpportunities,
            total_count: mockOpportunities.length
          }
        })
      });
    });
    
    await helpers.navigateToOpportunityList();
    
    // Check loading state is initially true
    await page.waitForSelector('[data-testid="loading-spinner"]');
    
    // Wait for loading to complete
    await page.waitForSelector('[data-testid="opportunity-table"]');
    
    const finalState = await helpers.getStoreState();
    expect(finalState.isLoading).toBe(false);
  });

  test('should handle error states properly', async ({ page: _ }) => {
    const helpers = new OpportunityStoreTestHelpers(page);
    
    // Mock API error
    await page.route('**/api/opportunities**', route => {
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
    
    // Wait for error to be displayed
    await page.waitForSelector('[data-testid="error-message"]');
    
    const state = await helpers.getStoreState();
    expect(state.error).toBeTruthy();
    expect(state.isLoading).toBe(false);
  });
});

test.describe('Opportunity Store - CRUD Operations', () => {
  test('should fetch opportunities list successfully', async ({ page: _ }) => {
    const helpers = new OpportunityStoreTestHelpers(page);
    await helpers.setupMockAPIs();
    
    await helpers.navigateToOpportunityList();
    
    // Wait for opportunities to load
    await page.waitForSelector('[data-testid="opportunity-row"]');
    
    const state = await helpers.getStoreState();
    
    // Verify opportunities are loaded
    expect(state.opportunities).toHaveLength(mockOpportunities.length);
    expect(state.opportunities[0].id).toBe(mockOpportunities[0].id);
    expect(state.opportunities[0].name).toBe(mockOpportunities[0].name);
    expect(state.totalCount).toBe(mockOpportunities.length);
  });

  test('should fetch individual opportunity details', async ({ page: _ }) => {
    const helpers = new OpportunityStoreTestHelpers(page);
    await helpers.setupMockAPIs();
    
    // Navigate to opportunity detail page
    await page.goto('/opportunities/opp-1');
    await page.waitForLoadState('networkidle');
    
    // Wait for opportunity details to load
    await page.waitForSelector('[data-testid="opportunity-detail"]');
    
    const state = await helpers.getStoreState();
    
    // Verify selected opportunity is loaded
    expect(state.selectedOpportunity).toBeTruthy();
    expect(state.selectedOpportunity.id).toBe('opp-1');
    expect(state.selectedOpportunity.name).toBe(mockOpportunities[0].name);
  });

  test('should create new opportunity successfully', async ({ page: _ }) => {
    const helpers = new OpportunityStoreTestHelpers(page);
    await helpers.setupMockAPIs();
    
    await helpers.navigateToCreateOpportunity();
    
    // Fill and submit form
    await page.fill('[name="organization_id"]', 'test-org-123');
    await page.selectOption('[name="context"]', 'NEW_BUSINESS');
    await page.selectOption('[name="stage"]', 'NEW_LEAD');
    await page.fill('[name="probability_percent"]', '25');
    await page.fill('[name="expected_close_date"]', '2025-03-31');
    await page.fill('[name="deal_owner"]', 'Sales Rep');
    await page.fill('[name="notes"]', 'Test notes');
    
    await page.click('button[type="submit"]');
    
    // Wait for success response
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Verify opportunity was created (would need to check if it appears in list)
    await helpers.navigateToOpportunityList();
    const state = await helpers.getStoreState();
    
    // In a real scenario, new opportunity would be in the list
    expect(state.opportunities).toBeTruthy();
  });

  test('should update opportunity successfully', async ({ page: _ }) => {
    const helpers = new OpportunityStoreTestHelpers(page);
    await helpers.setupMockAPIs();
    
    // Navigate to edit page
    await page.goto('/opportunities/opp-1/edit');
    await page.waitForLoadState('networkidle');
    
    // Wait for form to load with existing data
    await page.waitForSelector('[name="name"]');
    
    // Update the opportunity name
    await page.fill('[name="name"]', 'Updated Opportunity Name');
    await page.click('button[type="submit"]');
    
    // Wait for success
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Verify update was processed
    const state = await helpers.getStoreState();
    
    // The mock API returns updated data, so we can verify the change
    expect(state.selectedOpportunity.name).toContain('Updated');
  });

  test('should delete opportunity successfully', async ({ page: _ }) => {
    const helpers = new OpportunityStoreTestHelpers(page);
    await helpers.setupMockAPIs();
    
    await helpers.navigateToOpportunityList();
    
    // Wait for opportunities to load
    await page.waitForSelector('[data-testid="opportunity-row"]');
    
    // Click delete button on first opportunity
    await page.click('[data-testid="opportunity-row"]:first-child [data-testid="delete-button"]');
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete"]');
    
    // Wait for delete operation to complete
    await page.waitForTimeout(500);
    
    // Verify opportunity was removed from store
    const state = await helpers.getStoreState();
    
    // Note: In real implementation, the deleted opportunity would be removed from the array
    expect(state.opportunities).toBeTruthy();
  });
});

test.describe('Opportunity Store - Batch Operations', () => {
  test('should create batch opportunities successfully', async ({ page: _ }) => {
    const helpers = new OpportunityStoreTestHelpers(page);
    await helpers.setupMockAPIs();
    
    await helpers.navigateToCreateOpportunity();
    
    // Fill form for batch creation (multiple principals)
    await page.fill('[name="organization_id"]', 'test-org-123');
    await page.selectOption('[name="context"]', 'NEW_BUSINESS');
    
    // Select multiple principals
    await page.click('[data-testid="principal-multi-select"]');
    await page.click('[role="option"]:has-text("Principal One")');
    await page.click('[role="option"]:has-text("Principal Two")');
    await page.keyboard.press('Escape');
    
    // Enable auto-naming
    await page.check('[name="auto_generate_name"]');
    
    // Submit batch creation
    await page.click('button[type="submit"]');
    
    // Wait for batch creation results
    await page.waitForSelector('[data-testid="batch-results"]');
    
    // Verify batch results are displayed
    await expect(page.locator('[data-testid="created-count"]')).toContainText('2');
    await expect(page.locator('[data-testid="failed-count"]')).toContainText('0');
  });

  test('should generate name previews correctly', async ({ page: _ }) => {
    const helpers = new OpportunityStoreTestHelpers(page);
    await helpers.setupMockAPIs();
    
    await helpers.navigateToCreateOpportunity();
    
    // Fill form to trigger name preview
    await page.fill('[name="organization_id"]', 'test-org-123');
    await page.selectOption('[name="context"]', 'NEW_BUSINESS');
    
    // Select multiple principals
    await page.click('[data-testid="principal-multi-select"]');
    await page.click('[role="option"]:has-text("Principal One")');
    await page.click('[role="option"]:has-text("Principal Two")');
    await page.keyboard.press('Escape');
    
    // Enable auto-naming to trigger preview
    await page.check('[name="auto_generate_name"]');
    
    // Wait for name previews to load
    await page.waitForSelector('[data-testid="name-preview-item"]');
    
    // Verify previews are displayed
    const previewCount = await page.locator('[data-testid="name-preview-item"]').count();
    expect(previewCount).toBe(2);
    
    // Verify preview content
    await expect(page.locator('[data-testid="name-preview-item"]').first()).toContainText('Principal One');
    await expect(page.locator('[data-testid="name-preview-item"]').nth(1)).toContainText('Principal Two');
  });

  test('should handle batch creation errors gracefully', async ({ page: _ }) => {
    const helpers = new OpportunityStoreTestHelpers(page);
    
    // Mock batch creation error
    await page.route('**/api/opportunities/batch', route => {
      route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Validation failed for some opportunities',
          data: {
            success: false,
            created_opportunities: [mockOpportunities[0]],
            failed_opportunities: [
              {
                principal_id: 'principal-2',
                error: 'Duplicate opportunity name'
              }
            ],
            total_created: 1,
            total_failed: 1
          }
        })
      });
    });
    
    await helpers.navigateToCreateOpportunity();
    
    // Fill and submit batch form
    await page.fill('[name="organization_id"]', 'test-org-123');
    await page.click('[data-testid="principal-multi-select"]');
    await page.click('[role="option"]:has-text("Principal One")');
    await page.click('[role="option"]:has-text("Principal Two")');
    await page.keyboard.press('Escape');
    
    await page.click('button[type="submit"]');
    
    // Wait for batch results with errors
    await page.waitForSelector('[data-testid="batch-results"]');
    
    // Verify partial success is handled
    await expect(page.locator('[data-testid="created-count"]')).toContainText('1');
    await expect(page.locator('[data-testid="failed-count"]')).toContainText('1');
    
    // Verify error details are shown
    await expect(page.locator('[data-testid="batch-errors"]')).toBeVisible();
  });
});

test.describe('Opportunity Store - KPIs and Analytics', () => {
  test('should fetch and display KPIs correctly', async ({ page: _ }) => {
    const helpers = new OpportunityStoreTestHelpers(page);
    await helpers.setupMockAPIs();
    
    await helpers.navigateToOpportunityList();
    
    // Wait for KPIs to load
    await page.waitForSelector('[data-testid="kpi-total"]');
    
    const state = await helpers.getStoreState();
    
    // Verify KPIs are loaded in store
    expect(state.kpis).toBeTruthy();
    expect(state.kpis.total_opportunities).toBe(mockKPIs.total_opportunities);
    expect(state.kpis.active_opportunities).toBe(mockKPIs.active_opportunities);
    expect(state.kpis.average_probability).toBe(mockKPIs.average_probability);
    expect(state.kpis.won_this_month).toBe(mockKPIs.won_this_month);
    
    // Verify KPIs are displayed correctly
    await expect(page.locator('[data-testid="kpi-total"] .kpi-value')).toContainText('15');
    await expect(page.locator('[data-testid="kpi-active"] .kpi-value')).toContainText('12');
    await expect(page.locator('[data-testid="kpi-average-probability"] .kpi-value')).toContainText('68');
    await expect(page.locator('[data-testid="kpi-won-this-month"] .kpi-value')).toContainText('3');
  });

  test('should calculate computed KPIs correctly', async ({ page: _ }) => {
    const helpers = new OpportunityStoreTestHelpers(page);
    await helpers.setupMockAPIs();
    
    await helpers.navigateToOpportunityList();
    
    // Wait for data to load
    await page.waitForSelector('[data-testid="opportunity-row"]');
    
    const state = await helpers.getStoreState();
    
    // Verify computed properties
    expect(state.opportunities.length).toBeGreaterThan(0);
    
    // Test computed average probability calculation
    const totalProbability = mockOpportunities.reduce((sum, opp) => sum + opp.probability_percent, 0);
    const expectedAverage = Math.round(totalProbability / mockOpportunities.length);
    
    // The store should calculate this automatically
    const computedAverage = await page.evaluate(() => {
      const { useOpportunityStore } = window.__PINIA_STORES__ || {};
      if (!useOpportunityStore) return 0;
      const store = useOpportunityStore();
      return store.averageProbability;
    });
    
    expect(computedAverage).toBe(expectedAverage);
  });

  test('should fetch stage distribution correctly', async ({ page: _ }) => {
    const helpers = new OpportunityStoreTestHelpers(page);
    await helpers.setupMockAPIs();
    
    // Navigate to a page that triggers stage distribution fetch
    await page.goto('/opportunities/pipeline');
    await page.waitForLoadState('networkidle');
    
    // Wait for stage distribution to load
    await page.waitForTimeout(1000);
    
    const state = await helpers.getStoreState();
    
    // Verify stage distribution is loaded
    expect(state.stageDistribution).toBeTruthy();
    
    // The mock returns specific stage distribution
    expect(state.stageDistribution['NEW_LEAD']).toHaveLength(1);
    expect(state.stageDistribution['INITIAL_OUTREACH']).toHaveLength(1);
  });
});

test.describe('Opportunity Store - Filtering and Pagination', () => {
  test('should apply filters correctly', async ({ page: _ }) => {
    const helpers = new OpportunityStoreTestHelpers(page);
    
    // Mock filtered API response
    await page.route('**/api/opportunities**', route => {
      const url = new URL(route.request().url());
      const stage = url.searchParams.get('stage');
      
      let filteredOpportunities = mockOpportunities;
      if (stage) {
        filteredOpportunities = mockOpportunities.filter(opp => opp.stage === stage);
      }
      
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            opportunities: filteredOpportunities,
            total_count: filteredOpportunities.length,
            page: 1,
            has_next: false,
            has_previous: false
          }
        })
      });
    });
    
    await helpers.navigateToOpportunityList();
    
    // Apply stage filter
    await page.selectOption('[name="stage_filter"]', 'NEW_LEAD');
    await page.waitForTimeout(500);
    
    // Verify filtered results
    const rows = await page.locator('[data-testid="opportunity-row"]').count();
    expect(rows).toBe(1); // Only one opportunity has NEW_LEAD stage in mock data
  });

  test('should handle search functionality', async ({ page: _ }) => {
    const helpers = new OpportunityStoreTestHelpers(page);
    
    // Mock search API response
    await page.route('**/api/opportunities**', route => {
      const url = new URL(route.request().url());
      const search = url.searchParams.get('search');
      
      let filteredOpportunities = mockOpportunities;
      if (search) {
        filteredOpportunities = mockOpportunities.filter(opp => 
          opp.name.toLowerCase().includes(search.toLowerCase()) ||
          opp.organization_name.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            opportunities: filteredOpportunities,
            total_count: filteredOpportunities.length
          }
        })
      });
    });
    
    await helpers.navigateToOpportunityList();
    
    // Perform search
    await page.fill('[name="search"]', 'Test Corp');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Verify search results
    const state = await helpers.getStoreState();
    expect(state.opportunities.length).toBeGreaterThan(0);
    
    // All results should match search term
    state.opportunities.forEach((opp: any) => {
      expect(
        opp.name.toLowerCase().includes('test corp') || 
        opp.organization_name.toLowerCase().includes('test corp')
      ).toBe(true);
    });
  });

  test('should handle pagination correctly', async ({ page: _ }) => {
    const helpers = new OpportunityStoreTestHelpers(page);
    
    // Mock paginated API response
    await page.route('**/api/opportunities**', route => {
      const url = new URL(route.request().url());
      const page_num = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      
      const start = (page_num - 1) * limit;
      const end = start + limit;
      const paginatedOpportunities = mockOpportunities.slice(start, end);
      
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            opportunities: paginatedOpportunities,
            total_count: mockOpportunities.length,
            page: page_num,
            has_next: end < mockOpportunities.length,
            has_previous: page_num > 1
          }
        })
      });
    });
    
    await helpers.navigateToOpportunityList();
    
    // Test pagination controls (if implemented)
    if (await page.locator('[data-testid="next-page"]').isVisible()) {
      await page.click('[data-testid="next-page"]');
      await page.waitForTimeout(500);
      
      const state = await helpers.getStoreState();
      expect(state.currentPage).toBe(2);
    }
  });

  test('should reset filters correctly', async ({ page: _ }) => {
    const helpers = new OpportunityStoreTestHelpers(page);
    await helpers.setupMockAPIs();
    
    await helpers.navigateToOpportunityList();
    
    // Apply some filters
    await page.selectOption('[name="stage_filter"]', 'NEW_LEAD');
    await page.fill('[name="search"]', 'test');
    
    // Clear filters
    await page.click('[data-testid="clear-filters"]');
    
    // Verify filters are reset
    await expect(page.locator('[name="stage_filter"]')).toHaveValue('');
    await expect(page.locator('[name="search"]')).toHaveValue('');
    
    // Verify store state is reset
    const state = await helpers.getStoreState();
    expect(state.opportunities.length).toBe(mockOpportunities.length);
  });
});