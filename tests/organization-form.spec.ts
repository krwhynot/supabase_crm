import { test, expect } from '@playwright/test';

/**
 * Organization Form Test Suite
 * 
 * Comprehensive testing for the multi-step organization creation form:
 * - Step 1: Name, Priority (A/B/C/D), Segment, Business Type, Principal/Distributor
 * - Step 2: Address, Phone, Notes
 * - Step 3: Contact selection/creation
 */

// Test data fixtures
const validOrganizationData = {
  name: 'Acme Corporation',
  priority: 'A', // Changed from 'High' to 'A' to match new A/B/C/D system
  segment: 'Food & Beverage - Manufacturing', // Updated to match prioritized segments
  businessType: 'B2B',
  isPrincipal: true,
  isDistributor: false,
  addressLine1: '123 Main Street',
  city: 'San Francisco',
  stateProvince: 'CA',
  postalCode: '94105',
  phone: '+1 (555) 123-4567',
  notes: 'Strategic technology partner for enterprise solutions'
};

const invalidData = {
  emptyName: '',
  invalidWebsite: 'not-a-valid-url',
  invalidPhone: '123',
  tooLongName: 'A'.repeat(300)
};

// Helper functions
class OrganizationFormHelpers {
  constructor(public page: any) {}

  async navigateToCreatePage() {
    await this.page.goto('/organizations/new');
    await this.page.waitForLoadState('networkidle');
  }

  async fillStep1(data: typeof validOrganizationData) {
    // Organization Name (required)
    await this.page.fill('input[name="name"]', data.name);
    
    // Priority dropdown (required) - now A/B/C/D system
    await this.page.click('select[name="priority"]');
    await this.page.selectOption('select[name="priority"]', { label: data.priority });
    
    // Segment selector with type-ahead (required)
    const segmentInput = this.page.locator('input[name="segment"]');
    await segmentInput.click();
    await segmentInput.fill(data.segment);
    
    // Wait for dropdown and select option
    await this.page.waitForSelector('[role="listbox"]', { state: 'visible' });
    await this.page.click(`[role="option"]:has-text("${data.segment}")`);
    
    // Principal checkbox (moved to Step 1)
    if (data.isPrincipal) {
      await this.page.check('input[id="principal"]');
    }
    
    // Distributor checkbox (moved to Step 1)
    if (data.isDistributor) {
      await this.page.check('input[id="distributor"]');
    }
  }

  async fillStep2(data: typeof validOrganizationData) {
    // Address fields
    await this.page.fill('input[name="address_line_1"]', data.addressLine1);
    await this.page.fill('input[name="city"]', data.city);
    await this.page.fill('input[name="state_province"]', data.stateProvince);
    await this.page.fill('input[name="postal_code"]', data.postalCode);
    
    // Contact information
    await this.page.fill('input[name="primary_phone"]', data.phone);
    
    // Notes
    await this.page.fill('textarea[name="description"]', data.notes);
  }

  async fillStep3(_data: typeof validOrganizationData) {
    // Step 3 is now contact selection/creation with ContactMultiSelector
    // For basic test, we'll just select the "create new contacts" mode and add one contact
    await this.page.click('button:has-text("Create New Contacts")');
    
    // Add a new contact
    await this.page.click('button:has-text("Add New Contact")');
    
    // Wait for the contact form to appear and fill it
    await this.page.waitForSelector('input[name="contact_1_first_name"]');
    await this.page.fill('input[name="contact_1_first_name"]', 'John');
    await this.page.fill('input[name="contact_1_last_name"]', 'Doe');
    await this.page.fill('input[name="contact_1_email"]', 'john.doe@acme.com');
    await this.page.fill('input[name="contact_1_phone"]', '+1 (555) 987-6543');
    await this.page.fill('input[name="contact_1_position"]', 'CTO');
  }

  async clickNext() {
    await this.page.click('button:has-text("Next")');
    await this.page.waitForTimeout(300); // Allow step transition
  }

  async clickBack() {
    await this.page.click('button:has-text("Back")');
    await this.page.waitForTimeout(300); // Allow step transition
  }

  async clickSubmit() {
    await this.page.click('button:has-text("Create Organization")');
  }

  async getCurrentStep(): Promise<number> {
    const stepIndicator = await this.page.textContent('.mt-4.text-center.text-sm.text-gray-500');
    if (!stepIndicator) return 1;
    
    const match = stepIndicator.match(/Step (\d+) of (\d+)/);
    return match ? parseInt(match[1]) : 1;
  }

  async getVisibleErrors(): Promise<string[]> {
    const errorElements = await this.page.locator('[role="alert"], .text-danger, .text-red-700, .text-red-500').all();
    const errors = [];
    
    for (const element of errorElements) {
      const text = await element.textContent();
      if (text && text.trim()) {
        errors.push(text.trim());
      }
    }
    
    return errors;
  }

  async isNextButtonDisabled(): Promise<boolean> {
    const nextButton = this.page.locator('button:has-text("Next")');
    return await nextButton.isDisabled();
  }

  async isSubmitButtonDisabled(): Promise<boolean> {
    return await this.page.isDisabled('button:has-text("Create Organization")');
  }

  async waitForAutoSave() {
    // Wait for auto-save indicator
    await this.page.waitForSelector('text="Draft saved"', { timeout: 5000 });
  }

  async testSegmentTypeAhead(query: string, expectedResults: string[]) {
    const segmentInput = this.page.locator('input[name="segment"]');
    await segmentInput.click();
    await segmentInput.fill(query);
    
    // Wait for dropdown
    await this.page.waitForSelector('[role="listbox"]', { state: 'visible' });
    
    // Get visible options
    const options = await this.page.locator('[role="option"]').allTextContents();
    
    // Verify expected results are present
    for (const expected of expectedResults) {
      expect(options.some(option => option.includes(expected))).toBe(true);
    }
    
    return options;
  }
}

test.describe('Organization Form - Happy Path Tests', () => {
  test('should complete full form submission successfully', async ({ page }) => {
    const helpers = new OrganizationFormHelpers(page);
    
    await helpers.navigateToCreatePage();
    
    // Verify we start on step 1
    expect(await helpers.getCurrentStep()).toBe(1);
    
    // Fill and complete Step 1
    await helpers.fillStep1(validOrganizationData);
    await helpers.clickNext();
    
    // Verify we moved to step 2
    expect(await helpers.getCurrentStep()).toBe(2);
    
    // Fill and complete Step 2
    await helpers.fillStep2(validOrganizationData);
    await helpers.clickNext();
    
    // Verify we moved to step 3
    expect(await helpers.getCurrentStep()).toBe(3);
    
    // Fill and submit Step 3
    await helpers.fillStep3(validOrganizationData);
    await helpers.clickSubmit();
    
    // Verify successful submission (redirect to organization detail)
    await page.waitForURL(/\/organizations\/[a-f0-9-]+/, { timeout: 10000 });
    
    // Verify we're on the organization detail page (check main content area)
    await expect(page.locator('main h1')).toContainText(validOrganizationData.name);
  });

  test('should allow navigation between steps', async ({ page }) => {
    const helpers = new OrganizationFormHelpers(page);
    
    await helpers.navigateToCreatePage();
    
    // Complete Step 1 and go to Step 2
    await helpers.fillStep1(validOrganizationData);
    await helpers.clickNext();
    expect(await helpers.getCurrentStep()).toBe(2);
    
    // Go back to Step 1
    await helpers.clickBack();
    expect(await helpers.getCurrentStep()).toBe(1);
    
    // Verify data is preserved
    const nameValue = await page.inputValue('input[name="name"]');
    expect(nameValue).toBe(validOrganizationData.name);
    
    // Go forward again
    await helpers.clickNext();
    expect(await helpers.getCurrentStep()).toBe(2);
    
    // Complete Step 2 and go to Step 3
    await helpers.fillStep2(validOrganizationData);
    await helpers.clickNext();
    expect(await helpers.getCurrentStep()).toBe(3);
    
    // Go back to Step 2
    await helpers.clickBack();
    expect(await helpers.getCurrentStep()).toBe(2);
  });
});

test.describe('Organization Form - Validation Tests', () => {
  test('should validate required fields in Step 1', async ({ page }) => {
    const helpers = new OrganizationFormHelpers(page);
    
    await helpers.navigateToCreatePage();
    
    // Should be on step 1
    expect(await helpers.getCurrentStep()).toBe(1);
    
    // Try to click Next button - should be disabled when no fields are filled
    expect(await helpers.isNextButtonDisabled()).toBe(true);
    
    // Should show validation errors
    const errors = await helpers.getVisibleErrors();
    expect(errors.length).toBeGreaterThan(0);
    // Check for typical yup validation messages
    expect(errors.some(error => 
      error.includes('required') || 
      error.includes('is required') || 
      error.includes('cannot be empty')
    )).toBe(true);
  });

  test('should validate field formats and lengths', async ({ page }) => {
    const helpers = new OrganizationFormHelpers(page);
    
    await helpers.navigateToCreatePage();
    
    // Test name too long
    await page.fill('input[name="name"]', invalidData.tooLongName);
    await page.locator('input[name="name"]').blur();
    
    const errors = await helpers.getVisibleErrors();
    expect(errors.some(error => error.includes('255 characters'))).toBe(true);
    
    // Complete step 1 with valid data and go to step 2
    await helpers.fillStep1(validOrganizationData);
    await helpers.clickNext();
    
    // Website field has been removed from Step 2 in the simplified version
    // Step 2 now only has address fields, phone, and notes - all optional
  });

  test('should show global form errors', async ({ page }) => {
    const helpers = new OrganizationFormHelpers(page);
    
    await helpers.navigateToCreatePage();
    
    // Fill step 1 and go to step 2
    await helpers.fillStep1(validOrganizationData);
    await helpers.clickNext();
    
    // Step 2 has been simplified - no website field
    
    // Complete step 2 and go to step 3
    await helpers.fillStep2(validOrganizationData);
    await helpers.clickNext();
    
    // Try to submit from step 3
    await helpers.clickSubmit();
    
    // Should show global error or validation error about website
    const errorSelectors = [
      '[role="alert"]', // Any alert
      '.text-red-500', // Red error text
      '.text-red-700', // Red error text
      '.bg-red-50' // Red background error
    ];
    
    let errorFound = false;
    for (const selector of errorSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          errorFound = true;
          break;
        }
      } catch {
        continue;
      }
    }
    
    expect(errorFound).toBe(true);
  });
});

test.describe('Organization Form - Segment Selector Tests', () => {
  test('should support type-ahead search functionality', async ({ page }) => {
    const helpers = new OrganizationFormHelpers(page);
    
    await helpers.navigateToCreatePage();
    
    // Test type-ahead with "Food"
    const foodOptions = await helpers.testSegmentTypeAhead('Food', ['Food & Beverage']);
    expect(foodOptions.some(option => option.includes('Food & Beverage'))).toBe(true);
    
    // Test type-ahead with "Tech"
    const techOptions = await helpers.testSegmentTypeAhead('Tech', ['Technology']);
    expect(techOptions.some(option => option.includes('Technology'))).toBe(true);
    
    // Test no results - should show "Add new segment" option
    await helpers.testSegmentTypeAhead('XYZNonExistent', []);
    const dropdown = page.locator('[role="listbox"]');
    await expect(dropdown).toContainText('Add new segment');
  });

  test('should allow adding new segments', async ({ page }) => {
    const helpers = new OrganizationFormHelpers(page);
    
    await helpers.navigateToCreatePage();
    
    const newSegment = 'Custom Industry Segment';
    
    // Type a new segment name
    const segmentInput = page.locator('input[name="segment"]');
    await segmentInput.click();
    await segmentInput.fill(newSegment);
    
    // Wait for dropdown
    await page.waitForSelector('[role="listbox"]', { state: 'visible' });
    
    // Should show "Add new" option
    const addNewOption = page.locator('[role="option"]:has-text("Add new segment")');
    await expect(addNewOption).toBeVisible();
    
    // Click add new
    await addNewOption.click();
    
    // Verify the value was set
    const inputValue = await segmentInput.inputValue();
    expect(inputValue).toBe(newSegment);
  });

  test('should show popular segments when no search query', async ({ page }) => {
    const helpers = new OrganizationFormHelpers(page);
    
    await helpers.navigateToCreatePage();
    
    // Click segment input
    const segmentInput = page.locator('input[name="segment"]');
    await segmentInput.click();
    
    // Wait for dropdown
    await page.waitForSelector('[role="listbox"]', { state: 'visible' });
    
    // Should show default segments
    const dropdown = page.locator('[role="listbox"]');
    await expect(dropdown).toContainText('Technology');
    await expect(dropdown).toContainText('Food & Beverage');
    await expect(dropdown).toContainText('Manufacturing');
  });
});

test.describe('Organization Form - Auto-save Tests', () => {
  test('should auto-save form draft', async ({ page }) => {
    const helpers = new OrganizationFormHelpers(page);
    
    await helpers.navigateToCreatePage();
    
    // Fill some data
    await page.fill('input[name="name"]', validOrganizationData.name);
    
    // Wait for auto-save
    await helpers.waitForAutoSave();
    
    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Data should be restored (if auto-save is implemented)
    const nameValue = await page.inputValue('input[name="name"]');
    expect(nameValue).toBe(validOrganizationData.name);
  });
});

test.describe('Organization Form - Accessibility Tests', () => {
  test('should support keyboard navigation', async ({ page }) => {
    const helpers = new OrganizationFormHelpers(page);
    
    await helpers.navigateToCreatePage();
    
    // Test tab navigation through form fields
    await page.keyboard.press('Tab'); // Focus first field
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'SELECT'].includes(focusedElement)).toBe(true);
    
    // Test form submission with Enter key - need to focus on Next button first
    await helpers.fillStep1(validOrganizationData);
    
    // Focus the Next button and press Enter
    await page.locator('button:has-text("Next")').focus();
    await page.keyboard.press('Enter');
    
    // Wait for step transition
    await page.waitForTimeout(500);
    
    // Should advance to next step
    expect(await helpers.getCurrentStep()).toBe(2);
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    const helpers = new OrganizationFormHelpers(page);
    
    await helpers.navigateToCreatePage();
    
    // Check required field ARIA attributes
    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toHaveAttribute('aria-required', 'true');
    // Initially aria-invalid should be "true" since field is empty and required
    await expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    
    // Check label associations
    const nameLabel = page.locator('label[for*="name"]');
    await expect(nameLabel).toBeVisible();
    
    // Fill the field to make it valid
    await page.fill('input[name="name"]', 'Test Organization');
    await page.locator('input[name="name"]').blur();
    
    // Now aria-invalid should be false
    await expect(nameInput).toHaveAttribute('aria-invalid', 'false');
    
    // Check progress indicator
    const progressNav = page.locator('nav[aria-label="Progress"]');
    await expect(progressNav).toBeVisible();
  });

  test('should announce errors to screen readers', async ({ page }) => {
    const helpers = new OrganizationFormHelpers(page);
    
    await helpers.navigateToCreatePage();
    
    // Check that Next button is disabled when no fields are filled
    expect(await helpers.isNextButtonDisabled()).toBe(true);
    
    // Error messages should have role="alert" for screen readers
    const errorAlerts = page.locator('[role="alert"]');
    const alertCount = await errorAlerts.count();
    expect(alertCount).toBeGreaterThan(0);
  });
});

test.describe('Organization Form - Mobile Tests', () => {
  test('should work on mobile viewport', async ({ page }, testInfo) => {
    // Skip this test on desktop browsers that don't support touch
    test.skip(testInfo.project.name === 'desktop-chromium', 'Mobile tests only run on touch-enabled projects');
    
    const helpers = new OrganizationFormHelpers(page);
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await helpers.navigateToCreatePage();
    
    // Form should be responsive - target the specific form container
    const formContainer = page.locator('.max-w-4xl').nth(1); // Second occurrence is the form
    await expect(formContainer).toBeVisible();
    
    // Use click instead of tap for broader compatibility
    await page.click('input[name="name"]');
    await page.fill('input[name="name"]', validOrganizationData.name);
    
    // Segment selector should work on mobile
    await page.click('input[name="segment"]');
    await page.waitForSelector('[role="listbox"]', { state: 'visible' });
    
    // Dropdown should be visible and accessible
    const dropdown = page.locator('[role="listbox"]');
    await expect(dropdown).toBeVisible();
    
    // Should be able to complete form
    await helpers.fillStep1(validOrganizationData);
    await page.click('button:has-text("Next")');
    expect(await helpers.getCurrentStep()).toBe(2);
  });

  test('should handle touch interactions for segment selector', async ({ page }, testInfo) => {
    // Skip this test on desktop browsers that don't support touch
    test.skip(testInfo.project.name === 'desktop-chromium', 'Mobile tests only run on touch-enabled projects');
    
    const helpers = new OrganizationFormHelpers(page);
    
    await page.setViewportSize({ width: 375, height: 667 });
    await helpers.navigateToCreatePage();
    
    // Test touch on segment selector
    const segmentInput = page.locator('input[name="segment"]');
    await segmentInput.click(); // Use click instead of tap for compatibility
    
    // Should open dropdown
    await page.waitForSelector('[role="listbox"]', { state: 'visible' });
    
    // Should be able to select option with touch
    await page.click('[role="option"]:has-text("Food & Beverage")');
    
    // Should close dropdown and set value
    await page.waitForSelector('[role="listbox"]', { state: 'hidden' });
    const inputValue = await segmentInput.inputValue();
    expect(inputValue).toBe('Food & Beverage - Manufacturing');
  });
});

test.describe('Organization Form - Error Handling Tests', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    const helpers = new OrganizationFormHelpers(page);
    
    await helpers.navigateToCreatePage();
    
    // Mock network failure
    await page.route('**/api/organizations', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    // Fill and submit form
    await helpers.fillStep1(validOrganizationData);
    await helpers.clickNext();
    await helpers.clickNext();
    await helpers.fillStep3(validOrganizationData);
    await helpers.clickSubmit();
    
    // Should show some kind of error message
    // Look for global errors or any error alert
    const errorSelectors = [
      '.mb-6.bg-red-50[role="alert"]', // Global error
      '[role="alert"]', // Any alert
      '.text-red-500', // Red error text
      '.text-red-700', // Red error text
      '.bg-red-50' // Red background error
    ];
    
    let errorFound = false;
    for (const selector of errorSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          errorFound = true;
          break;
        }
      } catch {
        continue;
      }
    }
    
    expect(errorFound).toBe(true);
  });

  test('should handle validation errors from server', async ({ page }) => {
    const helpers = new OrganizationFormHelpers(page);
    
    await helpers.navigateToCreatePage();
    
    // Mock validation error response
    await page.route('**/api/organizations', route => {
      route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ 
          error: 'Validation failed',
          details: { name: 'Organization name already exists' }
        })
      });
    });
    
    // Fill and submit form
    await helpers.fillStep1(validOrganizationData);
    await helpers.clickNext();
    await helpers.clickNext();
    await helpers.fillStep3(validOrganizationData);
    await helpers.clickSubmit();
    
    // Wait for error to appear - try multiple approaches
    await page.waitForTimeout(1000); // Give time for error processing
    
    // Check for global error alert first
    const globalError = page.locator('.mb-6.bg-red-50[role="alert"]');
    try {
      await expect(globalError).toBeVisible({ timeout: 3000 });
      const errorText = await globalError.textContent();
      expect(errorText).toContain('error');
    } catch {
      // Fallback to checking all visible errors
      const errors = await helpers.getVisibleErrors();
      expect(errors.length).toBeGreaterThan(0);
      
      // Ensure some error text is present
      const hasAnyError = errors.length > 0 && 
        errors.some(error => error.trim().length > 0);
      expect(hasAnyError).toBe(true);
    }
  });
});

test.describe('Organization Form - Performance Tests', () => {
  test('should load form quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/organizations/new');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // Should load in under 3 seconds
    
    // Form should be interactive
    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toBeEnabled();
  });

  test('should handle rapid typing in segment selector', async ({ page }) => {
    const helpers = new OrganizationFormHelpers(page);
    
    await helpers.navigateToCreatePage();
    
    const segmentInput = page.locator('input[name="segment"]');
    await segmentInput.click();
    
    // Type rapidly
    await segmentInput.type('Technology', { delay: 50 });
    
    // Should handle debounced search
    await page.waitForTimeout(500);
    await page.waitForSelector('[role="listbox"]', { state: 'visible' });
    
    // Should show relevant results
    const dropdown = page.locator('[role="listbox"]');
    await expect(dropdown).toContainText('Technology');
  });
});

test.describe('Organization Form - Contact Status Warning', () => {
  test('should show contact warning when organization has no contacts', async ({ page }) => {
    const helpers = new OrganizationFormHelpers(page);
    
    await helpers.navigateToCreatePage();
    
    // Complete form
    await helpers.fillStep1(validOrganizationData);
    await helpers.clickNext();
    await helpers.fillStep2(validOrganizationData);
    await helpers.clickNext();
    await helpers.fillStep3(validOrganizationData);
    
    // Mock API to return organization with no contacts
    await page.route('**/api/organizations', route => {
      route.fulfill({
        status: 201,
        body: JSON.stringify({ 
          id: '123',
          name: validOrganizationData.name,
          contact_count: 0
        })
      });
    });
    
    await helpers.clickSubmit();
    
    // Should show contact warning
    await page.waitForSelector('[data-testid="contact-status-warning"]', { timeout: 5000 });
    const warning = page.locator('[data-testid="contact-status-warning"]');
    await expect(warning).toBeVisible();
    await expect(warning).toContainText('No Contacts Found');
  });
});

// Utility test for debugging
test.describe('Organization Form - Debug Tests', () => {
  test.skip('debug form state', async ({ page }) => {
    const helpers = new OrganizationFormHelpers(page);
    
    await helpers.navigateToCreatePage();
    
    // Fill partial data for debugging
    await helpers.fillStep1(validOrganizationData);
    
    // Pause for manual inspection
    await page.pause();
  });
});