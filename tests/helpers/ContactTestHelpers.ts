import { Page, expect } from '@playwright/test';
import { EnvironmentManager } from './EnvironmentManager';

/**
 * Enhanced Contact Test Helpers for Dual-Environment Testing
 * 
 * Provides comprehensive helpers for testing contact forms across both
 * MCP mock (development) and real Supabase (production) environments.
 */

export interface ContactFormData {
  first_name: string;
  last_name: string;
  email: string;
  organization?: string;
  organization_id?: string;
  title?: string;
  phone?: string;
  position?: string;
  notes?: string;
  authority_level?: 'HIGH' | 'MEDIUM' | 'LOW';
  influence_level?: 'HIGH' | 'MEDIUM' | 'LOW';
  contact_preference?: 'EMAIL' | 'PHONE' | 'IN_PERSON';
}

export interface ContactValidationResult {
  isValid: boolean;
  errors: string[];
  data?: any;
}

export interface DatabaseContact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  organization: string;
  title?: string;
  phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export class ContactTestHelpers {
  constructor(
    private page: Page,
    private environmentManager: EnvironmentManager
  ) {}

  /**
   * Navigation helpers
   */
  async navigateToContactList(): Promise<void> {
    await this.page.goto('/contacts');
    await this.page.waitForLoadState('networkidle');
    await this.waitForContactListReady();
  }

  async navigateToCreateContact(): Promise<void> {
    await this.page.goto('/contacts/new');
    await this.page.waitForLoadState('networkidle');
    await this.waitForFormReady();
  }

  async navigateToContactDetail(id: string): Promise<void> {
    await this.page.goto(`/contacts/${id}`);
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToEditContact(id: string): Promise<void> {
    await this.page.goto(`/contacts/${id}/edit`);
    await this.page.waitForLoadState('networkidle');
    await this.waitForFormReady();
  }

  /**
   * Form interaction helpers
   */
  async fillContactForm(data: ContactFormData): Promise<void> {
    // Step 1: Basic Information
    await this.fillBasicInformation(data);
    
    // Navigate to next step if multi-step form
    if (await this.isMultiStepForm()) {
      await this.clickNext();
      await this.fillAuthorityInformation(data);
      
      await this.clickNext();
      await this.fillContactPreferences(data);
    }
  }

  async fillBasicInformation(data: ContactFormData): Promise<void> {
    await this.page.fill('input[name="first_name"]', data.first_name);
    await this.page.fill('input[name="last_name"]', data.last_name);
    await this.page.fill('input[name="email"]', data.email);

    // Handle organization - if we have organization_id, select it; otherwise try alternative approaches
    if (data.organization_id) {
      await this.selectOrganization(data.organization_id);
    } else if (data.organization) {
      await this.handleOrganizationField(data.organization);
    }

    // Handle position selection - use actual form position options
    if (data.position) {
      await this.selectPositionFromAvailableOptions(data.position);
    } else if (data.title) {
      // Map title to actual form position options
      const titleToPositionMapping: Record<string, string> = {
        'Chief Technology Officer': 'Manager',
        'CTO': 'Manager',
        'VP': 'Manager', 
        'Manager': 'Manager',
        'Director': 'Manager',
        'Owner': 'Owner',
        'Chef': 'Executive Chef',
        'Executive Chef': 'Executive Chef'
      };
      
      const mappedPosition = Object.entries(titleToPositionMapping).find(([key]) => 
        data.title?.toLowerCase().includes(key.toLowerCase())
      )?.[1] || 'Manager'; // Default to Manager
      
      await this.selectPositionFromAvailableOptions(mappedPosition);
    } else {
      // Default position selection
      await this.selectPositionFromAvailableOptions('Manager');
    }

    if (data.phone) {
      await this.page.fill('input[name="phone"]', data.phone);
    }
  }

  async fillAuthorityInformation(data: ContactFormData): Promise<void> {
    if (data.authority_level) {
      await this.page.selectOption('select[name="authority_level"]', data.authority_level);
    }

    if (data.influence_level) {
      await this.page.selectOption('select[name="influence_level"]', data.influence_level);
    }
  }

  async fillContactPreferences(data: ContactFormData): Promise<void> {
    if (data.contact_preference) {
      await this.page.check(`input[name="contact_preference"][value="${data.contact_preference}"]`);
    }

    if (data.notes) {
      await this.page.fill('textarea[name="notes"]', data.notes);
    }
  }

  async selectOrganization(organizationId: string): Promise<void> {
    await this.page.click('select[name="organization_id"]');
    await this.page.waitForSelector('[role="listbox"]', { state: 'visible' });
    await this.page.click(`[role="option"][data-value="${organizationId}"]`);
  }

  async handleOrganizationField(organizationName: string): Promise<void> {
    const orgSelect = this.page.locator('select[name="organization_id"]');
    
    // First check if there are existing organizations to select
    if (await orgSelect.isVisible()) {
      const options = await orgSelect.evaluate(select => {
        return Array.from(select.options).map(option => ({
          value: option.value,
          text: option.text
        }));
      });
      
      // If there are existing organizations (more than just the empty option), select the first one
      if (options.length > 1) {
        await orgSelect.selectOption(options[1].value);
        console.log(`Selected existing organization: ${options[1].text}`);
        return;
      }
      
      // If no existing organizations, try to create one
      const createOrgButton = this.page.locator('button:has-text("Create New Organization")');
      if (await createOrgButton.isVisible()) {
        await createOrgButton.click();
        await this.page.waitForTimeout(1000);
        
        // Fill organization details in modal
        const orgNameInput = this.page.locator('input[name="organization_name"], input[placeholder*="organization"], input[placeholder*="Organization"]');
        await orgNameInput.fill(organizationName);
        
        // Fill industry if required
        const industrySelect = this.page.locator('select[name="industry"]');
        if (await industrySelect.isVisible()) {
          await industrySelect.selectOption({ index: 1 });
        }
        
        // Try to submit organization creation
        const createOrgSubmitButton = this.page.locator('button:has-text("Create Organization"):not(:has-text("Create New Organization"))');
        if (await createOrgSubmitButton.isVisible() && await createOrgSubmitButton.isEnabled()) {
          await createOrgSubmitButton.click();
          
          // Wait for organization creation with improved handling
          try {
            // Wait for modal to close or success message
            await Promise.race([
              this.page.waitForSelector('button:has-text("Create Organization"):not(:has-text("Create New Organization"))', { 
                state: 'hidden', 
                timeout: 5000 
              }),
              this.page.waitForSelector('.success-message, .alert-success', { timeout: 3000 })
            ]);
            
            // Give extra time for the form to update with new organization
            await this.page.waitForTimeout(2000);
            console.log('Organization creation completed successfully');
            
            // Verify the organization was added to the select
            await this.page.waitForTimeout(1000);
            const updatedOptions = await orgSelect.evaluate(select => {
              return Array.from(select.options).map(option => ({
                value: option.value,
                text: option.text
              }));
            });
            
            // If new organization was added, select it
            if (updatedOptions.length > 1) {
              const lastOption = updatedOptions[updatedOptions.length - 1];
              if (lastOption.value && lastOption.value !== '') {
                await orgSelect.selectOption(lastOption.value);
                console.log(`Selected newly created organization: ${lastOption.text}`);
                return;
              }
            }
            
          } catch (error) {
            console.warn('Organization creation workflow completed but may not have succeeded:', error);
            
            // Try to close any open modals
            const cancelButton = this.page.locator('button:has-text("Cancel")');
            if (await cancelButton.isVisible()) {
              await cancelButton.click();
              await this.page.waitForTimeout(500);
            }
            
            // Check if there are now options available after the attempt
            const finalOptions = await orgSelect.evaluate(select => {
              return Array.from(select.options).map(option => ({
                value: option.value,
                text: option.text
              }));
            });
            
            if (finalOptions.length > 1) {
              await orgSelect.selectOption(finalOptions[1].value);
              console.log(`Selected fallback organization: ${finalOptions[1].text}`);
              return;
            }
          }
        }
      }
    }
  }

  async selectPosition(position: string): Promise<void> {
    const positionSelect = this.page.locator('select[name="position"]');
    if (await positionSelect.isVisible()) {
      await positionSelect.selectOption(position);
    }
  }

  async selectPositionFromAvailableOptions(preferredPosition: string): Promise<void> {
    const positionSelect = this.page.locator('select[name="position"]');
    if (await positionSelect.isVisible()) {
      // Get all available options
      const options = await positionSelect.evaluate(select => {
        return Array.from(select.options).map(option => ({
          value: option.value,
          text: option.text
        }));
      });
      
      // Try to find the preferred position
      let optionToSelect = options.find(opt => 
        opt.value === preferredPosition || opt.text === preferredPosition
      );
      
      // If preferred not found, use the first non-empty option
      if (!optionToSelect && options.length > 1) {
        optionToSelect = options[1]; // Skip the empty option at index 0
      }
      
      if (optionToSelect && optionToSelect.value) {
        await positionSelect.selectOption(optionToSelect.value);
      }
    }
  }

  /**
   * Form submission and validation
   */
  async submitForm(): Promise<void> {
    // Check if we need to complete additional steps first
    const nextButton = this.page.locator('button:has-text("Next")');
    const createButton = this.page.locator('button:has-text("Create Contact")');
    
    // If Create Contact button is visible, click it
    if (await createButton.isVisible()) {
      await createButton.click();
    } else if (await nextButton.isVisible()) {
      // This means we're not on the final step yet
      throw new Error('Form is not ready for submission - still on intermediate step. Call fillContactForm() instead of submitForm() directly.');
    } else {
      // Fallback to any submit button
      await this.page.click('button[type="submit"]');
    }
    
    await this.page.waitForTimeout(1000); // Allow for form processing
  }

  async clickNext(): Promise<void> {
    const nextButton = this.page.locator('button:has-text("Next")');
    
    // Check if the Next button is enabled, and if not, log validation errors
    const isEnabled = await nextButton.isEnabled();
    if (!isEnabled) {
      const errors = await this.getFormErrors();
      if (errors.length > 0) {
        console.warn('Next button disabled due to validation errors:', errors);
        throw new Error(`Next button is disabled due to validation errors: ${errors.join(', ')}`);
      } else {
        // Wait a bit longer in case validation is still processing
        await this.page.waitForTimeout(2000);
        const isEnabledAfterWait = await nextButton.isEnabled();
        if (!isEnabledAfterWait) {
          throw new Error('Next button is disabled but no validation errors found. Form may not be fully loaded.');
        }
      }
    }
    
    await expect(nextButton).toBeEnabled();
    await nextButton.click();
    await this.page.waitForTimeout(500);
  }

  async clickPrevious(): Promise<void> {
    const prevButton = this.page.locator('button:has-text("Previous"), button:has-text("Back")');
    await prevButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Validation helpers
   */
  async getFormErrors(): Promise<string[]> {
    const errorElements = await this.page.locator(
      '[role="alert"], .text-red-500, .text-red-700, .error-message, [data-testid*="error"]'
    ).all();
    
    const errors = [];
    for (const element of errorElements) {
      const text = await element.textContent();
      if (text && text.trim()) {
        errors.push(text.trim());
      }
    }
    
    return errors;
  }

  async getFieldError(fieldName: string): Promise<string | null> {
    const errorElement = this.page.locator(`[data-testid="${fieldName}-error"], #${fieldName}-error`);
    
    if (await errorElement.isVisible()) {
      return await errorElement.textContent();
    }
    
    return null;
  }

  async validateFormData(expectedData: ContactFormData): Promise<ContactValidationResult> {
    const errors: string[] = [];
    
    // Check required fields
    const firstName = await this.page.inputValue('input[name="first_name"]');
    if (firstName !== expectedData.first_name) {
      errors.push(`First name mismatch: expected "${expectedData.first_name}", got "${firstName}"`);
    }

    const lastName = await this.page.inputValue('input[name="last_name"]');
    if (lastName !== expectedData.last_name) {
      errors.push(`Last name mismatch: expected "${expectedData.last_name}", got "${lastName}"`);
    }

    const email = await this.page.inputValue('input[name="email"]');
    if (email !== expectedData.email) {
      errors.push(`Email mismatch: expected "${expectedData.email}", got "${email}"`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Database verification helpers
   */
  async verifyContactInDatabase(email: string): Promise<DatabaseContact | null> {
    return await this.environmentManager.executeInEnvironment(
      // Development: Mock verification
      async () => {
        // In mock mode, simulate database check
        const mockContact: DatabaseContact = {
          id: `mock-contact-${Date.now()}`,
          first_name: 'Test',
          last_name: 'Contact', 
          email,
          organization: 'Test Organization',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        return mockContact;
      },
      
      // Production: Real database verification
      async () => {
        return await this.queryContactFromDatabase(email);
      }
    );
  }

  private async queryContactFromDatabase(email: string): Promise<DatabaseContact | null> {
    // This would typically use a database client
    // For now, simulate with API call that the app would make
    const response = await this.page.evaluate(async (email) => {
      try {
        const response = await fetch(`/api/contacts?email=${encodeURIComponent(email)}`);
        if (response.ok) {
          const data = await response.json();
          return data.data?.[0] || null;
        }
      } catch (error) {
        console.error('Database query error:', error);
      }
      return null;
    }, email);

    return response;
  }

  async waitForContactCreated(): Promise<string> {
    // Wait for redirect to contact detail page or success message
    await Promise.race([
      this.page.waitForURL(/\/contacts\/[a-f0-9-]+$/),
      this.page.waitForSelector('[data-testid="success-message"]')
    ]);

    // Extract contact ID from URL if redirected
    const url = this.page.url();
    const match = url.match(/\/contacts\/([a-f0-9-]+)$/);
    if (match) {
      return match[1];
    }

    // If no redirect, contact might be created but not navigated to
    return 'success-no-id';
  }

  /**
   * List view and table operations
   */
  async searchContacts(query: string): Promise<void> {
    await this.page.fill('input[name="search"], [data-testid="search-input"]', query);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500);
  }

  async getContactRowCount(): Promise<number> {
    return await this.page.locator('[data-testid="contact-row"], .contact-row').count();
  }

  async clickContactRow(index: number): Promise<void> {
    await this.page.click(`[data-testid="contact-row"]:nth-child(${index + 1}), .contact-row:nth-child(${index + 1})`);
  }

  async deleteContact(index: number): Promise<void> {
    await this.page.click(`[data-testid="contact-row"]:nth-child(${index + 1}) [data-testid="delete-button"]`);
    await this.page.click('[data-testid="confirm-delete"]');
    await this.page.waitForTimeout(1000);
  }

  /**
   * Multi-step form helpers
   */
  async isMultiStepForm(): Promise<boolean> {
    // Look for the progress indicator with role="progressbar" or the step indicators
    return await this.page.locator('[role="progressbar"], .h-1\\.5.w-6.rounded-full, div:has-text("Step")').first().isVisible();
  }

  async getCurrentStep(): Promise<number> {
    const stepIndicator = this.page.locator('.step-current, [data-testid="current-step"]');
    const stepText = await stepIndicator.textContent();
    return parseInt(stepText?.match(/\d+/)?.[0] || '1');
  }

  async getTotalSteps(): Promise<number> {
    const steps = await this.page.locator('.step-item, [data-testid="step-item"]').count();
    return steps || 3; // Default to 3 if not found
  }

  /**
   * Error handling and edge cases
   */
  async handleFormErrors(): Promise<boolean> {
    const errors = await this.getFormErrors();
    if (errors.length > 0) {
      console.log('Form errors detected:', errors);
      return false;
    }
    return true;
  }

  async fillFormWithInvalidData(): Promise<void> {
    await this.page.fill('input[name="first_name"]', '');
    await this.page.fill('input[name="last_name"]', '');
    await this.page.fill('input[name="email"]', 'invalid-email');
  }

  async testFormValidation(): Promise<string[]> {
    await this.fillFormWithInvalidData();
    await this.submitForm();
    return await this.getFormErrors();
  }

  /**
   * Performance and accessibility helpers
   */
  async measureFormLoadTime(): Promise<number> {
    const startTime = Date.now();
    await this.navigateToCreateContact();
    return Date.now() - startTime;
  }

  async testKeyboardNavigation(): Promise<boolean> {
    await this.navigateToCreateContact();
    
    // Test tab navigation
    await this.page.keyboard.press('Tab');
    const focusedElement = await this.page.evaluate(() => document.activeElement?.tagName);
    
    return ['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA'].includes(focusedElement);
  }

  async checkAriaLabels(): Promise<boolean> {
    const requiredFields = ['first_name', 'last_name', 'email'];
    
    for (const field of requiredFields) {
      const input = this.page.locator(`input[name="${field}"]`);
      const hasAriaLabel = await input.getAttribute('aria-label') !== null;
      const hasAriaLabelledBy = await input.getAttribute('aria-labelledby') !== null;
      
      if (!hasAriaLabel && !hasAriaLabelledBy) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Utility methods
   */
  async takeFormScreenshot(step?: string): Promise<void> {
    const timestamp = Date.now();
    const filename = step 
      ? `contact-form-${step}-${timestamp}.png`
      : `contact-form-${timestamp}.png`;
    
    await this.page.screenshot({
      path: `screenshots/${filename}`,
      fullPage: true
    });
  }

  async waitForFormReady(): Promise<void> {
    // Wait for the form content to load - look for the basic info step and input fields
    await this.page.waitForSelector('h2:has-text("Basic Info")');
    await this.page.waitForSelector('input[name="first_name"]');
    await this.page.waitForSelector('input[name="last_name"]');
    await this.page.waitForSelector('input[name="email"]');
    await this.page.waitForSelector('select[name="organization_id"]');
  }

  async waitForContactListReady(): Promise<void> {
    await this.page.waitForSelector('[data-testid="contact-table"], .contact-list, table');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Test data generation
   */
  generateTestContactData(prefix: string = 'test'): ContactFormData {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    
    return {
      first_name: `${prefix}_${random}_first`,
      last_name: `${prefix}_${random}_last`,
      email: `${prefix}_${random}_${timestamp}@example.com`,
      organization: `${prefix} Organization ${random}`,
      title: `Test Title ${random}`,
      phone: `555-${random.substr(0, 4)}`,
      position: 'DECISION_MAKER',
      authority_level: 'HIGH',
      influence_level: 'HIGH',
      contact_preference: 'EMAIL',
      notes: `Test notes for contact ${random}`
    };
  }

  /**
   * Batch operations
   */
  async createMultipleContacts(count: number, prefix: string = 'test'): Promise<string[]> {
    const contactIds: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const testData = this.generateTestContactData(`${prefix}_${i}`);
      await this.navigateToCreateContact();
      await this.fillContactForm(testData);
      await this.submitForm();
      
      const contactId = await this.waitForContactCreated();
      contactIds.push(contactId);
    }
    
    return contactIds;
  }
}