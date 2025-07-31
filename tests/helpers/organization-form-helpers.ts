import { Page, expect } from '@playwright/test';

/**
 * Organization Form Test Helpers
 * 
 * Reusable utilities for testing the organization form components
 */

export interface OrganizationFormData {
  name: string;
  priority: 'High' | 'Medium' | 'Low';
  segment: string;
  businessType?: 'B2B' | 'B2C' | 'B2B2C' | 'Non-Profit' | 'Government' | 'Other';
  isPrincipal?: boolean;
  isDistributor?: boolean;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  phone?: string;
  secondaryPhone?: string;
  website?: string;
  email?: string;
  accountManager?: string;
  notes?: string;
}

export class OrganizationFormPage {
  constructor(private page: Page) {}

  // Navigation methods
  async navigateToCreatePage(): Promise<void> {
    await this.page.goto('/organizations/new');
    await this.page.waitForLoadState('networkidle');
    await this.waitForFormReady();
  }

  async waitForFormReady(): Promise<void> {
    // Wait for form wrapper to be visible
    await this.page.waitForSelector('.max-w-4xl', { state: 'visible' });
    
    // Wait for step indicator
    await this.page.waitForSelector('nav[aria-label="Progress"]', { state: 'visible' });
    
    // Wait for first input to be ready
    await this.page.waitForSelector('input[name="name"]', { state: 'visible' });
  }

  // Step navigation
  async getCurrentStep(): Promise<number> {
    const stepIndicator = await this.page.textContent('.mt-4.text-center.text-sm.text-gray-500');
    if (!stepIndicator) return 1;
    
    const match = stepIndicator.match(/Step (\d+) of (\d+)/);
    return match ? parseInt(match[1]) : 1;
  }

  async clickNext(): Promise<void> {
    const nextButton = this.page.locator('button:has-text("Next")');
    await nextButton.click();
    await this.page.waitForTimeout(300); // Allow step transition animation
  }

  async clickBack(): Promise<void> {
    const backButton = this.page.locator('button:has-text("Back")');
    await expect(backButton).toBeEnabled();
    await backButton.click();
    await this.page.waitForTimeout(300); // Allow step transition animation
  }

  async clickSubmit(): Promise<void> {
    const submitButton = this.page.locator('button:has-text("Create Organization")');
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
  }

  // Form filling methods
  async fillStep1(data: OrganizationFormData): Promise<void> {
    // Organization Name (required)
    await this.fillInput('name', data.name);
    
    // Priority (required)
    await this.selectOption('priority', data.priority);
    
    // Segment (required) - use segment selector
    await this.fillSegmentSelector(data.segment);
  }

  async fillStep2(data: OrganizationFormData): Promise<void> {
    // Business Type
    if (data.businessType) {
      await this.selectOption('type', data.businessType);
    }
    
    // Principal checkbox
    if (data.isPrincipal !== undefined) {
      await this.setCheckbox('isPrincipal', data.isPrincipal);
    }
    
    // Distributor checkbox
    if (data.isDistributor !== undefined) {
      await this.setCheckbox('isDistributor', data.isDistributor);
    }
  }

  async fillStep3(data: OrganizationFormData): Promise<void> {
    // Address fields
    if (data.addressLine1) await this.fillInput('address_line_1', data.addressLine1);
    if (data.addressLine2) await this.fillInput('address_line_2', data.addressLine2);
    if (data.city) await this.fillInput('city', data.city);
    if (data.stateProvince) await this.fillInput('state_province', data.stateProvince);
    if (data.postalCode) await this.fillInput('postal_code', data.postalCode);
    
    // Contact information
    if (data.phone) await this.fillInput('primary_phone', data.phone);
    if (data.secondaryPhone) await this.fillInput('secondary_phone', data.secondaryPhone);
    if (data.website) await this.fillInput('website', data.website);
    if (data.email) await this.fillInput('email', data.email);
    
    // Account manager
    if (data.accountManager) await this.selectOption('assigned_user_id', data.accountManager);
    
    // Notes
    if (data.notes) await this.fillTextarea('description', data.notes);
  }

  // Individual form controls
  async fillInput(name: string, value: string): Promise<void> {
    const input = this.page.locator(`input[name="${name}"]`);
    await input.fill(value);
    await input.blur(); // Trigger validation
  }

  async fillTextarea(name: string, value: string): Promise<void> {
    const textarea = this.page.locator(`textarea[name="${name}"]`);
    await textarea.fill(value);
    await textarea.blur(); // Trigger validation
  }

  async selectOption(name: string, value: string): Promise<void> {
    const select = this.page.locator(`select[name="${name}"]`);
    await select.selectOption({ label: value });
  }

  async setCheckbox(name: string, checked: boolean): Promise<void> {
    const checkbox = this.page.locator(`input[name="${name}"]`);
    const isCurrentlyChecked = await checkbox.isChecked();
    
    if (checked && !isCurrentlyChecked) {
      await checkbox.check();
    } else if (!checked && isCurrentlyChecked) {
      await checkbox.uncheck();
    }
  }

  // Segment selector specific methods
  async fillSegmentSelector(segment: string): Promise<void> {
    const segmentInput = this.page.locator('input[name="segment"]');
    
    // Click to open dropdown
    await segmentInput.click();
    
    // Type the segment
    await segmentInput.fill(segment);
    
    // Wait for dropdown to appear
    await this.page.waitForSelector('[role="listbox"]', { state: 'visible' });
    
    // Look for exact match first
    const exactMatch = this.page.locator(`[role="option"]:has-text("${segment}")`).first();
    
    try {
      await expect(exactMatch).toBeVisible({ timeout: 2000 });
      await exactMatch.click();
    } catch {
      // If no exact match, use "Add new" option
      const addNewOption = this.page.locator('[role="option"]:has-text("Add new segment")');
      await expect(addNewOption).toBeVisible();
      await addNewOption.click();
    }
    
    await this.page.waitForSelector('[role="listbox"]', { state: 'hidden' });
  }

  async searchSegment(query: string): Promise<string[]> {
    const segmentInput = this.page.locator('input[name="segment"]');
    await segmentInput.click();
    await segmentInput.fill(query);
    
    // Wait for dropdown
    await this.page.waitForSelector('[role="listbox"]', { state: 'visible' });
    
    // Get all option texts
    const options = await this.page.locator('[role="option"]').allTextContents();
    return options.map(text => text.trim()).filter(text => text.length > 0);
  }

  // Validation and error handling
  async getFieldError(fieldName: string): Promise<string | null> {
    const errorSelector = `[id*="error-${fieldName}"], [aria-describedby*="${fieldName}"] + [role="alert"]`;
    const errorElement = this.page.locator(errorSelector).first();
    
    try {
      await expect(errorElement).toBeVisible({ timeout: 1000 });
      return await errorElement.textContent();
    } catch {
      return null;
    }
  }

  async getAllErrors(): Promise<string[]> {
    const errorSelectors = [
      '[role="alert"]',
      '.text-danger',
      '.text-red-700',
      '.text-red-500',
      '[id*="error-"]'
    ];
    
    const errors: string[] = [];
    
    for (const selector of errorSelectors) {
      const elements = await this.page.locator(selector).all();
      
      for (const element of elements) {
        const text = await element.textContent();
        if (text && text.trim() && !errors.includes(text.trim())) {
          errors.push(text.trim());
        }
      }
    }
    
    return errors;
  }

  async hasGlobalError(): Promise<boolean> {
    const globalError = this.page.locator('.bg-red-50 [role="alert"]').first();
    try {
      await expect(globalError).toBeVisible({ timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  // Button state checking
  async isNextButtonEnabled(): Promise<boolean> {
    return await this.page.locator('button:has-text("Next")').isEnabled();
  }

  async isSubmitButtonEnabled(): Promise<boolean> {
    return await this.page.locator('button:has-text("Create Organization")').isEnabled();
  }

  async isBackButtonVisible(): Promise<boolean> {
    return await this.page.locator('button:has-text("Back")').isVisible();
  }

  // Auto-save functionality
  async waitForAutoSave(): Promise<void> {
    // Wait for saving indicator
    await this.page.waitForSelector('text="Saving draft..."', { timeout: 3000 });
    
    // Wait for saved confirmation
    await this.page.waitForSelector('text="Draft saved"', { timeout: 5000 });
  }

  async hasAutoSaveIndicator(): Promise<boolean> {
    const indicators = [
      'text="Saving draft..."',
      'text="Draft saved"',
      'text="Failed to save draft"'
    ];
    
    for (const indicator of indicators) {
      try {
        await this.page.waitForSelector(indicator, { timeout: 1000 });
        return true;
      } catch {
        continue;
      }
    }
    
    return false;
  }

  // Progress indicator
  async getStepProgress(): Promise<{ current: number; total: number; completed: number[] }> {
    const current = await this.getCurrentStep();
    
    // Count completed steps (those with checkmarks) - unused for now
    // const _completedSteps = await this.page.locator('nav[aria-label="Progress"] svg[viewBox="0 0 20 20"]').count();
    
    const completed = [];
    for (let i = 1; i < current; i++) {
      completed.push(i);
    }
    
    return {
      current,
      total: 3,
      completed
    };
  }

  // Accessibility helpers
  async testKeyboardNavigation(): Promise<boolean> {
    // Test Tab navigation
    await this.page.keyboard.press('Tab');
    
    const activeElement = await this.page.evaluate(() => {
      const active = document.activeElement;
      return {
        tagName: active?.tagName,
        name: active?.getAttribute('name'),
        type: active?.getAttribute('type')
      };
    });
    
    return activeElement.tagName === 'INPUT';
  }

  async checkAriaAttributes(fieldName: string): Promise<{ valid: boolean; issues: string[] }> {
    const input = this.page.locator(`input[name="${fieldName}"], select[name="${fieldName}"], textarea[name="${fieldName}"]`);
    const issues: string[] = [];
    
    // Check required attribute
    const isRequired = await input.getAttribute('required');
    const ariaRequired = await input.getAttribute('aria-required');
    
    if (isRequired && ariaRequired !== 'true') {
      issues.push('Missing aria-required="true" for required field');
    }
    
    // Check aria-invalid
    const ariaInvalid = await input.getAttribute('aria-invalid');
    if (ariaInvalid === null) {
      issues.push('Missing aria-invalid attribute');
    }
    
    // Check label association
    const inputId = await input.getAttribute('id');
    const label = this.page.locator(`label[for="${inputId}"]`);
    
    try {
      await expect(label).toBeVisible({ timeout: 1000 });
    } catch {
      issues.push('No associated label found');
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }

  // Mobile-specific helpers
  async testTouchInteractions(): Promise<boolean> {
    try {
      // Test tap on first input
      await this.page.tap('input[name="name"]');
      
      // Test tap on segment selector
      await this.page.tap('input[name="segment"]');
      await this.page.waitForSelector('[role="listbox"]', { state: 'visible', timeout: 2000 });
      
      // Test tap to close dropdown
      await this.page.tap('body');
      await this.page.waitForSelector('[role="listbox"]', { state: 'hidden', timeout: 2000 });
      
      return true;
    } catch {
      return false;
    }
  }

  // Data persistence
  async getFormData(): Promise<Partial<OrganizationFormData>> {
    const data: Partial<OrganizationFormData> = {};
    
    // Get values from inputs
    const fields = [
      'name', 'segment', 'address_line_1', 'address_line_2',
      'city', 'state_province', 'postal_code', 'primary_phone',
      'secondary_phone', 'website', 'email', 'description'
    ];
    
    for (const field of fields) {
      try {
        const value = await this.page.inputValue(`input[name="${field}"], textarea[name="${field}"]`);
        if (value) {
          (data as any)[field] = value;
        }
      } catch {
        // Field doesn't exist or isn't visible
      }
    }
    
    // Get select values
    try {
      const priority = await this.page.inputValue('select[name="priority"]');
      if (priority) data.priority = priority as any;
    } catch {
      // Ignore input reading errors
    }
    
    try {
      const businessType = await this.page.inputValue('select[name="type"]');
      if (businessType) data.businessType = businessType as any;
    } catch {
      // Ignore input reading errors
    }
    
    // Get checkbox values
    try {
      data.isPrincipal = await this.page.isChecked('input[name="isPrincipal"]');
    } catch {
      // Ignore checkbox reading errors
    }
    
    try {
      data.isDistributor = await this.page.isChecked('input[name="isDistributor"]');
    } catch {
      // Ignore checkbox reading errors
    }
    
    return data;
  }

  // Performance helpers
  async measureFormLoad(): Promise<number> {
    const startTime = Date.now();
    await this.navigateToCreatePage();
    return Date.now() - startTime;
  }

  async measureStepTransition(): Promise<number> {
    const startTime = Date.now();
    await this.clickNext();
    return Date.now() - startTime;
  }
}

// Mock data helpers
export class OrganizationTestData {
  static readonly VALID_ORGANIZATION: OrganizationFormData = {
    name: 'Acme Corporation',
    priority: 'High',
    segment: 'Technology',
    businessType: 'B2B',
    isPrincipal: true,
    isDistributor: false,
    addressLine1: '123 Main Street',
    city: 'San Francisco',
    stateProvince: 'CA',
    postalCode: '94105',
    phone: '+1 (555) 123-4567',
    website: 'https://acme.com',
    notes: 'Strategic technology partner for enterprise solutions'
  };

  static readonly MINIMAL_ORGANIZATION: OrganizationFormData = {
    name: 'Minimal Corp',
    priority: 'Medium',
    segment: 'Finance'
  };

  static readonly INVALID_DATA = {
    emptyName: '',
    tooLongName: 'A'.repeat(300),
    invalidWebsite: 'not-a-valid-url',
    invalidEmail: 'invalid-email',
    invalidPhone: '123'
  };

  static readonly SEGMENT_SEARCH_TESTS = [
    { query: 'Tech', expectedResults: ['Technology'] },
    { query: 'Health', expectedResults: ['Healthcare'] },
    { query: 'Fin', expectedResults: ['Finance'] },
    { query: 'XYZNonExistent', expectedResults: [] }
  ];

  static createRandomOrganization(): OrganizationFormData {
    const industries = ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail'];
    const priorities: Array<'High' | 'Medium' | 'Low'> = ['High', 'Medium', 'Low'];
    const businessTypes: Array<'B2B' | 'B2C' | 'B2B2C'> = ['B2B', 'B2C', 'B2B2C'];
    
    const randomId = Math.floor(Math.random() * 10000);
    
    return {
      name: `Test Organization ${randomId}`,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      segment: industries[Math.floor(Math.random() * industries.length)],
      businessType: businessTypes[Math.floor(Math.random() * businessTypes.length)],
      isPrincipal: Math.random() > 0.5,
      isDistributor: Math.random() > 0.5,
      addressLine1: `${randomId} Test Street`,
      city: 'Test City',
      stateProvince: 'CA',
      postalCode: '12345',
      phone: `+1 (555) ${randomId.toString().padStart(4, '0')}`,
      website: `https://test${randomId}.com`,
      notes: `Test organization number ${randomId}`
    };
  }
}

// Network mocking helpers
export class OrganizationApiMocks {
  constructor(private page: Page) {}

  async mockSuccessfulCreation(organizationId: string = '123'): Promise<void> {
    await this.page.route('**/api/organizations', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: organizationId,
            name: 'Test Organization',
            created_at: new Date().toISOString(),
            contact_count: 0
          })
        });
      } else {
        route.continue();
      }
    });
  }

  async mockValidationError(fieldErrors: Record<string, string>): Promise<void> {
    await this.page.route('**/api/organizations', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Validation failed',
            details: fieldErrors
          })
        });
      } else {
        route.continue();
      }
    });
  }

  async mockServerError(): Promise<void> {
    await this.page.route('**/api/organizations', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal Server Error'
          })
        });
      } else {
        route.continue();
      }
    });
  }

  async mockNetworkTimeout(): Promise<void> {
    await this.page.route('**/api/organizations', _route => {
      // Don't fulfill the request to simulate timeout
      // The test should handle this with appropriate timeout settings
    });
  }

  async clearMocks(): Promise<void> {
    await this.page.unroute('**/api/organizations');
  }
}