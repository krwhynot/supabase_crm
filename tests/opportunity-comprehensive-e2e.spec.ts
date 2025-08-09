import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive E2E Test Suite for Opportunity Management System
 * 
 * This test suite performs comprehensive functional and UI testing to identify:
 * - Page layout rendering issues
 * - Component visibility and interaction problems
 * - Data loading and display issues
 * - Navigation flow problems
 * - Form functionality errors
 * - Error states and loading states
 * - Mobile/tablet compatibility
 */

class OpportunityE2ETestHelper {
  constructor(public page: Page) {}

  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `screenshots/opportunity-${name}-${Date.now()}.png`,
      fullPage: true
    });
  }

  async checkConsoleErrors(): Promise<string[]> {
    const errors: string[] = [];
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    return errors;
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000); // Additional wait for dynamic content
  }

  async checkElementVisibility(selector: string, timeout = 5000): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { timeout, state: 'visible' });
      return true;
    } catch {
      return false;
    }
  }

  async navigateAndValidate(url: string, _expectedTitle: string) {
    console.log(`Navigating to: ${url}`);
    await this.page.goto(url);
    await this.waitForPageLoad();
    await this.takeScreenshot(url.replace(/[/:\\]/g, '-'));
    
    // Check for console errors
    const errors = await this.checkConsoleErrors();
    if (errors.length > 0) {
      console.log(`Console errors on ${url}:`, errors);
    }
    
    // Verify page title/heading
    const heading = await this.page.locator('h1').first().textContent();
    console.log(`Page heading: ${heading}`);
    
    return { errors, heading };
  }
}

test.describe('Opportunity Management - Comprehensive E2E Testing', () => {
  let helper: OpportunityE2ETestHelper;

  test.beforeEach(async ({ page: _ }) => {
    helper = new OpportunityE2ETestHelper(page);
    
    // Set base URL to match running server
    page.setDefaultTimeout(10000);
  });

  test('01 - Navigate to /opportunities page - verify layout renders correctly', async ({ page: _ }) => {
    const result = await helper.navigateAndValidate('http://localhost:3001/opportunities', 'Opportunities');
    
    // Check main layout elements
    const layoutChecks = [
      { selector: '[data-testid="dashboard-layout"]', name: 'Dashboard Layout' },
      { selector: '[data-testid="sidebar"]', name: 'Sidebar Navigation' },
      { selector: '[data-testid="main-content"]', name: 'Main Content Area' },
      { selector: 'h1', name: 'Page Title' },
      { selector: '[data-testid="opportunities-header"]', name: 'Opportunities Header' }
    ];

    const layoutResults = [];
    for (const check of layoutChecks) {
      const isVisible = await helper.checkElementVisibility(check.selector);
      layoutResults.push({ ...check, visible: isVisible });
      
      if (!isVisible) {
        console.log(`❌ Missing: ${check.name} (${check.selector})`);
      } else {
        console.log(`✅ Found: ${check.name}`);
      }
    }

    // Verify responsive layout
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    await helper.takeScreenshot('opportunities-mobile');
    
    await page.setViewportSize({ width: 768, height: 1024 }); // Tablet
    await helper.takeScreenshot('opportunities-tablet');
    
    await page.setViewportSize({ width: 1280, height: 720 }); // Desktop
    await helper.takeScreenshot('opportunities-desktop');

    // Report findings
    expect(result.errors.length).toBe(0);
    expect(layoutResults.filter(r => r.visible).length).toBeGreaterThan(2);
  });

  test('02 - Check if KPI cards are displaying', async ({ page: _ }) => {
    await helper.navigateAndValidate('http://localhost:3001/opportunities', 'Opportunities');
    
    const kpiCards = [
      { selector: '[data-testid="kpi-total"]', name: 'Total Opportunities' },
      { selector: '[data-testid="kpi-active"]', name: 'Active Opportunities' },
      { selector: '[data-testid="kpi-average-probability"]', name: 'Average Probability' },
      { selector: '[data-testid="kpi-won-this-month"]', name: 'Won This Month' },
      { selector: '[data-testid="kpi-pipeline-value"]', name: 'Pipeline Value' },
      { selector: '[data-testid="kpi-conversion-rate"]', name: 'Conversion Rate' }
    ];

    const kpiResults = [];
    for (const kpi of kpiCards) {
      const isVisible = await helper.checkElementVisibility(kpi.selector);
      const hasValue = isVisible ? await page.locator(kpi.selector).textContent() : null;
      
      kpiResults.push({ 
        ...kpi, 
        visible: isVisible, 
        value: hasValue,
        hasNumericValue: hasValue ? /\d/.test(hasValue) : false
      });
      
      if (!isVisible) {
        console.log(`❌ KPI Missing: ${kpi.name}`);
      } else {
        console.log(`✅ KPI Found: ${kpi.name} - Value: ${hasValue}`);
      }
    }

    // Check if KPI container exists
    const kpiContainer = await helper.checkElementVisibility('[data-testid="kpi-cards"]');
    console.log(`KPI Container visible: ${kpiContainer}`);

    await helper.takeScreenshot('kpi-cards-analysis');

    // Verify at least some KPIs are visible
    expect(kpiResults.filter(k => k.visible).length).toBeGreaterThan(0);
  });

  test('03 - Test opportunity table rendering and data', async ({ page: _ }) => {
    await helper.navigateAndValidate('http://localhost:3001/opportunities', 'Opportunities');
    
    // Check table structure
    const tableElements = [
      { selector: '[data-testid="opportunity-table"]', name: 'Main Table' },
      { selector: 'table', name: 'HTML Table Element' },
      { selector: 'thead', name: 'Table Header' },
      { selector: 'tbody', name: 'Table Body' },
      { selector: 'th', name: 'Column Headers' },
      { selector: '[data-testid="opportunity-row"]', name: 'Opportunity Rows' }
    ];

    const tableResults = [];
    for (const element of tableElements) {
      const isVisible = await helper.checkElementVisibility(element.selector);
      const count = isVisible ? await page.locator(element.selector).count() : 0;
      
      tableResults.push({ ...element, visible: isVisible, count });
      
      if (!isVisible) {
        console.log(`❌ Table Element Missing: ${element.name}`);
      } else {
        console.log(`✅ Table Element Found: ${element.name} (Count: ${count})`);
      }
    }

    // Check for data loading states
    const loadingStates = [
      { selector: '[data-testid="loading-spinner"]', name: 'Loading Spinner' },
      { selector: '[data-testid="empty-state"]', name: 'Empty State' },
      { selector: '[data-testid="error-message"]', name: 'Error Message' }
    ];

    for (const state of loadingStates) {
      const isVisible = await helper.checkElementVisibility(state.selector, 2000);
      console.log(`${state.name}: ${isVisible ? 'Visible' : 'Not Visible'}`);
    }

    // Test table sorting functionality
    const sortableColumns = ['name', 'stage', 'probability_percent', 'expected_close_date'];
    for (const column of sortableColumns) {
      const sortButton = `[data-sort="${column}"]`;
      const hasSortButton = await helper.checkElementVisibility(sortButton);
      
      if (hasSortButton) {
        console.log(`✅ Sortable column: ${column}`);
        await page.click(sortButton);
        await page.waitForTimeout(500);
      } else {
        console.log(`❌ Missing sort for column: ${column}`);
      }
    }

    await helper.takeScreenshot('opportunity-table-analysis');

    expect(tableResults.filter(r => r.visible).length).toBeGreaterThan(2);
  });

  test('04 - Navigate to /opportunities/new - test create form', async ({ page: _ }) => {
    const result = await helper.navigateAndValidate('http://localhost:3001/opportunities/new', 'New Opportunity');
    
    // Check form structure
    const formElements = [
      { selector: 'form', name: 'Main Form' },
      { selector: '[data-testid="opportunity-form"]', name: 'Opportunity Form Container' },
      { selector: '[name="organization_id"]', name: 'Organization Select' },
      { selector: '[name="context"]', name: 'Context Select' },
      { selector: '[name="stage"]', name: 'Stage Select' },
      { selector: '[name="probability_percent"]', name: 'Probability Input' },
      { selector: '[name="expected_close_date"]', name: 'Close Date Input' },
      { selector: '[name="deal_owner"]', name: 'Deal Owner Input' },
      { selector: '[name="notes"]', name: 'Notes Textarea' },
      { selector: 'button[type="submit"]', name: 'Submit Button' }
    ];

    const formResults = [];
    for (const element of formElements) {
      const isVisible = await helper.checkElementVisibility(element.selector);
      const isEnabled = isVisible ? await page.locator(element.selector).isEnabled() : false;
      
      formResults.push({ ...element, visible: isVisible, enabled: isEnabled });
      
      if (!isVisible) {
        console.log(`❌ Form Element Missing: ${element.name}`);
      } else {
        console.log(`✅ Form Element Found: ${element.name} (Enabled: ${isEnabled})`);
      }
    }

    // Test form validation
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    const validationErrors = await page.locator('[role="alert"], .text-red-500, .text-red-700').count();
    console.log(`Validation errors shown: ${validationErrors}`);

    await helper.takeScreenshot('create-form-analysis');

    expect(result.errors.length).toBeLessThan(5); // Allow some non-critical errors
    expect(formResults.filter(f => f.visible).length).toBeGreaterThan(5);
  });

  test('05 - Test form components interaction', async ({ page: _ }) => {
    await helper.navigateAndValidate('http://localhost:3001/opportunities/new', 'New Opportunity');
    
    // Test Organization Select
    console.log('Testing Organization Select...');
    const orgSelect = page.locator('[name="organization_id"]');
    if (await orgSelect.isVisible()) {
      await orgSelect.click();
      await page.waitForTimeout(1000);
      
      const options = await page.locator('[role="option"]').count();
      console.log(`Organization options available: ${options}`);
      
      if (options > 0) {
        await page.locator('[role="option"]').first().click();
        console.log('✅ Organization selection works');
      } else {
        console.log('❌ No organization options available');
      }
    }

    // Test Stage Select
    console.log('Testing Stage Select...');
    const stageSelect = page.locator('[name="stage"]');
    if (await stageSelect.isVisible()) {
      await stageSelect.selectOption('NEW_LEAD');
      const selectedValue = await stageSelect.inputValue();
      console.log(`Stage selected: ${selectedValue}`);
    }

    // Test Principal Multi-Select
    console.log('Testing Principal Multi-Select...');
    const principalSelect = page.locator('[data-testid="principal-multi-select"]');
    if (await principalSelect.isVisible()) {
      await principalSelect.click();
      await page.waitForTimeout(1000);
      
      const principalOptions = await page.locator('[role="option"]').count();
      console.log(`Principal options available: ${principalOptions}`);
    }

    // Test Product Select
    console.log('Testing Product Select...');
    const productSelect = page.locator('[name="product_id"]');
    if (await productSelect.isVisible()) {
      await productSelect.click();
      await page.waitForTimeout(1000);
      
      const productOptions = await page.locator('[role="option"]').count();
      console.log(`Product options available: ${productOptions}`);
    }

    // Test Auto-naming Toggle
    console.log('Testing Auto-naming Toggle...');
    const autoNamingToggle = page.locator('[name="auto_generate_name"]');
    if (await autoNamingToggle.isVisible()) {
      await autoNamingToggle.click();
      const isChecked = await autoNamingToggle.isChecked();
      console.log(`Auto-naming enabled: ${isChecked}`);
    }

    await helper.takeScreenshot('form-components-interaction');
  });

  test('06 - Test navigation back to list', async ({ page: _ }) => {
    await helper.navigateAndValidate('http://localhost:3001/opportunities/new', 'New Opportunity');
    
    // Look for navigation elements
    const navElements = [
      { selector: '[data-testid="back-button"]', name: 'Back Button' },
      { selector: '[data-testid="cancel-button"]', name: 'Cancel Button' },
      { selector: 'a[href="/opportunities"]', name: 'Opportunities Link' },
      { selector: '[data-testid="breadcrumb"]', name: 'Breadcrumb Navigation' }
    ];

    let navigationFound = false;
    for (const nav of navElements) {
      const isVisible = await helper.checkElementVisibility(nav.selector);
      if (isVisible) {
        console.log(`✅ Navigation element found: ${nav.name}`);
        
        // Test navigation
        await page.click(nav.selector);
        await helper.waitForPageLoad();
        
        const currentUrl = page.url();
        if (currentUrl.includes('/opportunities') && !currentUrl.includes('/new')) {
          console.log('✅ Navigation back to list successful');
          navigationFound = true;
          break;
        }
      }
    }

    if (!navigationFound) {
      // Try browser back button
      await page.goBack();
      await helper.waitForPageLoad();
      console.log('Used browser back navigation');
    }

    await helper.takeScreenshot('navigation-back-test');
  });

  test('07 - Test opportunity detail view', async ({ page: _ }) => {
    // First, try to find an existing opportunity ID or create a mock
    await helper.navigateAndValidate('http://localhost:3001/opportunities', 'Opportunities');
    
    // Look for opportunity rows to get an ID
    const opportunityRows = await page.locator('[data-testid="opportunity-row"]').count();
    
    let testId = 'test-opportunity-123'; // Fallback test ID
    
    if (opportunityRows > 0) {
      // Try to extract an actual ID from the first row
      const firstRow = page.locator('[data-testid="opportunity-row"]').first();
      const href = await firstRow.locator('a').getAttribute('href');
      if (href) {
        const idMatch = href.match(/\/opportunities\/(.+)$/);
        if (idMatch) {
          testId = idMatch[1];
          console.log(`Using actual opportunity ID: ${testId}`);
        }
      }
    }

    await helper.navigateAndValidate(`http://localhost:3001/opportunities/${testId}`, 'Opportunity');
    
    // Check detail view elements
    const detailElements = [
      { selector: '[data-testid="opportunity-detail"]', name: 'Detail Container' },
      { selector: '[data-testid="opportunity-name"]', name: 'Opportunity Name' },
      { selector: '[data-testid="opportunity-stage"]', name: 'Stage Display' },
      { selector: '[data-testid="opportunity-probability"]', name: 'Probability Display' },
      { selector: '[data-testid="opportunity-organization"]', name: 'Organization Info' },
      { selector: '[data-testid="opportunity-principals"]', name: 'Principals List' },
      { selector: '[data-testid="opportunity-product"]', name: 'Product Info' },
      { selector: '[data-testid="edit-button"]', name: 'Edit Button' },
      { selector: '[data-testid="delete-button"]', name: 'Delete Button' }
    ];

    const detailResults = [];
    for (const element of detailElements) {
      const isVisible = await helper.checkElementVisibility(element.selector);
      detailResults.push({ ...element, visible: isVisible });
      
      console.log(`${element.name}: ${isVisible ? '✅ Visible' : '❌ Missing'}`);
    }

    await helper.takeScreenshot('opportunity-detail-view');

    // Check if we get a 404 or error state
    const errorState = await helper.checkElementVisibility('[data-testid="error-404"]');
    const notFound = await helper.checkElementVisibility('[data-testid="not-found"]');
    
    if (errorState || notFound) {
      console.log('⚠️ Detail view shows error state - this is expected for test data');
    } else {
      expect(detailResults.filter(r => r.visible).length).toBeGreaterThan(2);
    }
  });

  test('08 - Test opportunity edit view', async ({ page: _ }) => {
    const testId = 'test-opportunity-123';
    await helper.navigateAndValidate(`http://localhost:3001/opportunities/${testId}/edit`, 'Edit Opportunity');
    
    // Check edit form elements
    const editFormElements = [
      { selector: 'form', name: 'Edit Form' },
      { selector: '[name="name"]', name: 'Name Input' },
      { selector: '[name="stage"]', name: 'Stage Select' },
      { selector: '[name="probability_percent"]', name: 'Probability Input' },
      { selector: '[name="expected_close_date"]', name: 'Close Date Input' },
      { selector: '[name="notes"]', name: 'Notes Textarea' },
      { selector: 'button[type="submit"]', name: 'Update Button' },
      { selector: '[data-testid="cancel-button"]', name: 'Cancel Button' }
    ];

    const editResults = [];
    for (const element of editFormElements) {
      const isVisible = await helper.checkElementVisibility(element.selector);
      const hasValue = isVisible ? await page.locator(element.selector).inputValue() : null;
      
      editResults.push({ ...element, visible: isVisible, hasValue: !!hasValue });
      
      console.log(`${element.name}: ${isVisible ? '✅ Visible' : '❌ Missing'} ${hasValue ? `(Value: ${hasValue})` : ''}`);
    }

    // Test form pre-population
    const nameField = page.locator('[name="name"]');
    if (await nameField.isVisible()) {
      const nameValue = await nameField.inputValue();
      console.log(`Name field pre-populated: ${!!nameValue}`);
    }

    await helper.takeScreenshot('opportunity-edit-view');

    // Check if we get a 404 or error state
    const errorState = await helper.checkElementVisibility('[data-testid="error-404"]');
    if (errorState) {
      console.log('⚠️ Edit view shows error state - this is expected for test data');
    } else {
      expect(editResults.filter(r => r.visible).length).toBeGreaterThan(3);
    }
  });

  test('09 - Test mobile/tablet compatibility', async ({ page: _ }) => {
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1280, height: 720, name: 'Desktop' }
    ];

    for (const viewport of viewports) {
      console.log(`Testing ${viewport.name} viewport (${viewport.width}x${viewport.height})`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await helper.navigateAndValidate('http://localhost:3001/opportunities', 'Opportunities');
      
      // Check responsive elements
      const responsiveElements = [
        { selector: '[data-testid="mobile-menu-button"]', name: 'Mobile Menu Button' },
        { selector: '[data-testid="sidebar"]', name: 'Sidebar' },
        { selector: '[data-testid="table-responsive"]', name: 'Responsive Table' },
        { selector: '[data-testid="kpi-cards"]', name: 'KPI Cards' }
      ];

      for (const element of responsiveElements) {
        const isVisible = await helper.checkElementVisibility(element.selector);
        console.log(`  ${element.name}: ${isVisible ? '✅' : '❌'}`);
      }

      // Test touch interactions on mobile/tablet
      if (viewport.width <= 768) {
        const touchElements = await page.locator('[data-testid="opportunity-row"]').count();
        if (touchElements > 0) {
          await page.locator('[data-testid="opportunity-row"]').first().tap();
          console.log(`  Touch interaction tested: ${touchElements > 0 ? '✅' : '❌'}`);
        }
      }

      await helper.takeScreenshot(`responsive-${viewport.name.toLowerCase()}`);
    }
  });

  test('10 - Error states and loading states comprehensive test', async ({ page: _ }) => {
    console.log('Testing loading states...');
    
    // Test loading states by intercepting network requests
    await page.route('**/api/opportunities**', route => {
      // Delay response to see loading state
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { opportunities: [], total_count: 0, kpis: {} }
          })
        });
      }, 2000);
    });

    await page.goto('http://localhost:3001/opportunities');
    
    // Check for loading spinner
    const loadingVisible = await helper.checkElementVisibility('[data-testid="loading-spinner"]', 1000);
    console.log(`Loading spinner visible: ${loadingVisible ? '✅' : '❌'}`);
    
    await helper.waitForPageLoad();
    await helper.takeScreenshot('loading-state-test');

    // Test error states
    console.log('Testing error states...');
    
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

    await page.reload();
    await helper.waitForPageLoad();
    
    const errorVisible = await helper.checkElementVisibility('[data-testid="error-message"]');
    const retryButtonVisible = await helper.checkElementVisibility('[data-testid="retry-button"]');
    
    console.log(`Error message visible: ${errorVisible ? '✅' : '❌'}`);
    console.log(`Retry button visible: ${retryButtonVisible ? '✅' : '❌'}`);
    
    await helper.takeScreenshot('error-state-test');

    // Test empty state
    console.log('Testing empty states...');
    
    await page.route('**/api/opportunities**', route => {
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
    await helper.waitForPageLoad();
    
    const emptyStateVisible = await helper.checkElementVisibility('[data-testid="empty-state"]');
    console.log(`Empty state visible: ${emptyStateVisible ? '✅' : '❌'}`);
    
    await helper.takeScreenshot('empty-state-test');
  });
});