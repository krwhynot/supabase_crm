import { Page, expect } from '@playwright/test';
import { EnvironmentManager } from './EnvironmentManager';

/**
 * Enhanced Opportunity Test Helpers for Dual-Environment Testing
 * 
 * Provides comprehensive helpers for testing opportunity forms across both
 * MCP mock (development) and real Supabase (production) environments.
 * Includes support for batch creation, auto-naming, and multi-step workflows.
 */

export interface OpportunityFormData {
  name?: string;
  stage?: 'NEW_LEAD' | 'INITIAL_OUTREACH' | 'SAMPLE_VISIT_OFFERED' | 'AWAITING_RESPONSE' | 'FEEDBACK_LOGGED' | 'DEMO_SCHEDULED' | 'CLOSED_WON';
  probability_percent?: number;
  expected_close_date?: string;
  organization_id?: string;
  organization_name?: string;
  principal_id?: string;
  principal_ids?: string[]; // For batch creation
  product_id?: string;
  deal_owner?: string;
  notes?: string;
  context?: 'COLD_OUTREACH' | 'WARM_INTRODUCTION' | 'INBOUND_INQUIRY' | 'REFERRAL' | 'EVENT_MEETING' | 'EXISTING_RELATIONSHIP';
  custom_context?: string;
  auto_name?: boolean; // Whether to use auto-naming
  name_template?: string;
}

export interface OpportunityValidationResult {
  isValid: boolean;
  errors: string[];
  data?: any;
}

export interface DatabaseOpportunity {
  id: string;
  name: string;
  stage: string;
  probability_percent?: number;
  expected_close_date?: string;
  organization_id?: string;
  principal_id?: string;
  product_id?: string;
  deal_owner?: string;
  notes?: string;
  context?: string;
  custom_context?: string;
  is_won: boolean;
  created_at: string;
  updated_at: string;
}

export class OpportunityTestHelpers {
  constructor(
    private page: Page,
    private environmentManager: EnvironmentManager
  ) {}

  /**
   * Navigation helpers
   */
  async navigateToOpportunityList(): Promise<void> {
    await this.page.goto('/opportunities');
    await this.page.waitForLoadState('networkidle');
    await this.waitForOpportunityListReady();
  }

  async navigateToCreateOpportunity(): Promise<void> {
    await this.page.goto('/opportunities/new');
    await this.page.waitForLoadState('networkidle');
    await this.waitForFormReady();
  }

  async navigateToOpportunityDetail(id: string): Promise<void> {
    await this.page.goto(`/opportunities/${id}`);
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToEditOpportunity(id: string): Promise<void> {
    await this.page.goto(`/opportunities/${id}/edit`);
    await this.page.waitForLoadState('networkidle');
    await this.waitForFormReady();
  }

  async navigateToCreateFromContact(contactId: string): Promise<void> {
    await this.page.goto(`/contacts/${contactId}`);
    await this.page.waitForLoadState('networkidle');
    await this.page.click('[data-testid="create-opportunity"], button:has-text("Create Opportunity")');
    await this.waitForFormReady();
  }

  async navigateToCreateFromOrganization(organizationId: string): Promise<void> {
    await this.page.goto(`/organizations/${organizationId}`);
    await this.page.waitForLoadState('networkidle');
    await this.page.click('[data-testid="create-opportunity"], button:has-text("Create Opportunity")');
    await this.waitForFormReady();
  }

  /**
   * Multi-step form helpers
   */
  async isMultiStepForm(): Promise<boolean> {
    return await this.page.locator('.step-indicator, [data-testid="step-indicator"]').isVisible();
  }

  async getCurrentStep(): Promise<number> {
    const stepIndicator = this.page.locator('.step-current, [data-testid="current-step"]');
    const stepText = await stepIndicator.textContent();
    return parseInt(stepText?.match(/\\d+/)?.[0] || '1');
  }

  async getTotalSteps(): Promise<number> {
    const steps = await this.page.locator('.step-item, [data-testid="step-item"]').count();
    return steps || 3; // Default to 3 steps
  }

  async clickNext(): Promise<void> {
    const nextButton = this.page.locator('button:has-text("Next")');
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
   * Form interaction helpers
   */
  async fillOpportunityForm(data: OpportunityFormData): Promise<void> {
    if (await this.isMultiStepForm()) {
      await this.fillMultiStepForm(data);
    } else {
      await this.fillSingleStepForm(data);
    }
  }

  async fillSingleStepForm(data: OpportunityFormData): Promise<void> {
    // Organization selection
    if (data.organization_id) {
      await this.selectOrganization(data.organization_id);
    } else if (data.organization_name) {
      await this.fillOrganizationName(data.organization_name);
    }

    // Context selection
    if (data.context) {
      await this.selectContext(data.context);
    }
    if (data.custom_context) {
      await this.fillCustomContext(data.custom_context);
    }

    // Principal selection (single or multiple)
    if (data.principal_ids && data.principal_ids.length > 0) {
      await this.selectMultiplePrincipals(data.principal_ids);
    } else if (data.principal_id) {
      await this.selectPrincipal(data.principal_id);
    }

    // Auto-naming or manual name
    if (data.auto_name !== false) {
      await this.enableAutoNaming();
    } else if (data.name) {
      await this.disableAutoNaming();
      await this.page.fill('input[name="name"]', data.name);
    }

    // Additional fields
    if (data.stage) {
      await this.selectStage(data.stage);
    }
    if (data.probability_percent !== undefined) {
      await this.setProbability(data.probability_percent);
    }
    if (data.expected_close_date) {
      await this.setExpectedCloseDate(data.expected_close_date);
    }
    if (data.product_id) {
      await this.selectProduct(data.product_id);
    }
    if (data.deal_owner) {
      await this.fillDealOwner(data.deal_owner);
    }
    if (data.notes) {
      await this.fillNotes(data.notes);
    }
  }

  async fillMultiStepForm(data: OpportunityFormData): Promise<void> {
    // Step 1: Organization and Context
    await this.fillOrganizationAndContext(data);
    await this.clickNext();

    // Step 2: Principal Selection
    await this.fillPrincipalSelection(data);
    await this.clickNext();

    // Step 3: Opportunity Details
    await this.fillOpportunityDetails(data);
  }

  async fillOrganizationAndContext(data: OpportunityFormData): Promise<void> {
    if (data.organization_id) {
      await this.selectOrganization(data.organization_id);
    } else if (data.organization_name) {
      await this.fillOrganizationName(data.organization_name);
    }

    if (data.context) {
      await this.selectContext(data.context);
    }
    if (data.custom_context) {
      await this.fillCustomContext(data.custom_context);
    }
  }

  async fillPrincipalSelection(data: OpportunityFormData): Promise<void> {
    if (data.principal_ids && data.principal_ids.length > 0) {
      await this.selectMultiplePrincipals(data.principal_ids);
    } else if (data.principal_id) {
      await this.selectPrincipal(data.principal_id);
    }

    // Check batch creation preview if multiple principals
    if (data.principal_ids && data.principal_ids.length > 1) {
      await this.verifyBatchPreview(data.principal_ids.length);
    }
  }

  async fillOpportunityDetails(data: OpportunityFormData): Promise<void> {
    if (data.stage) {
      await this.selectStage(data.stage);
    }
    if (data.probability_percent !== undefined) {
      await this.setProbability(data.probability_percent);
    }
    if (data.expected_close_date) {
      await this.setExpectedCloseDate(data.expected_close_date);
    }
    if (data.product_id) {
      await this.selectProduct(data.product_id);
    }
    if (data.deal_owner) {
      await this.fillDealOwner(data.deal_owner);
    }
    if (data.notes) {
      await this.fillNotes(data.notes);
    }
  }

  /**
   * Individual form field helpers
   */
  async selectOrganization(organizationId: string): Promise<void> {
    const orgSelect = this.page.locator('select[name="organization_id"], [data-testid="organization-select"]');
    if (await orgSelect.isVisible()) {
      await orgSelect.selectOption(organizationId);
    } else {
      // Handle dropdown component
      await this.page.click('[data-testid="organization-dropdown"]');
      await this.page.waitForSelector('[role="listbox"]', { state: 'visible' });
      await this.page.click(`[role="option"][data-value="${organizationId}"]`);
    }
    await this.page.waitForTimeout(500); // Allow for data loading
  }

  async fillOrganizationName(name: string): Promise<void> {
    await this.page.fill('input[name="organization_name"], [data-testid="organization-input"]', name);
  }

  async selectContext(context: string): Promise<void> {
    const contextSelect = this.page.locator('select[name="context"], [data-testid="context-select"]');
    if (await contextSelect.isVisible()) {
      await contextSelect.selectOption(context);
    } else {
      // Handle radio buttons or dropdown
      await this.page.check(`input[name="context"][value="${context}"]`);
    }
  }

  async fillCustomContext(customContext: string): Promise<void> {
    await this.page.fill('input[name="custom_context"], textarea[name="custom_context"]', customContext);
  }

  async selectPrincipal(principalId: string): Promise<void> {
    const principalSelect = this.page.locator('select[name="principal_id"], [data-testid="principal-select"]');
    if (await principalSelect.isVisible()) {
      await principalSelect.selectOption(principalId);
    } else {
      await this.page.click('[data-testid="principal-dropdown"]');
      await this.page.waitForSelector('[role="listbox"]', { state: 'visible' });
      await this.page.click(`[role="option"][data-value="${principalId}"]`);
    }
  }

  async selectMultiplePrincipals(principalIds: string[]): Promise<void> {
    // Handle multi-select component
    const multiSelect = this.page.locator('[data-testid="principal-multiselect"]');
    if (await multiSelect.isVisible()) {
      for (const principalId of principalIds) {
        await this.page.check(`input[name="principal_ids"][value="${principalId}"]`);
      }
    } else {
      // Handle dropdown with multiple selection
      for (const principalId of principalIds) {
        await this.page.click('[data-testid="add-principal"]');
        await this.selectPrincipal(principalId);
      }
    }
  }

  async enableAutoNaming(): Promise<void> {
    const autoNameToggle = this.page.locator('input[name="auto_name"], [data-testid="auto-name-toggle"]');
    if (await autoNameToggle.isVisible() && !await autoNameToggle.isChecked()) {
      await autoNameToggle.check();
    }
  }

  async disableAutoNaming(): Promise<void> {
    const autoNameToggle = this.page.locator('input[name="auto_name"], [data-testid="auto-name-toggle"]');
    if (await autoNameToggle.isVisible() && await autoNameToggle.isChecked()) {
      await autoNameToggle.uncheck();
    }
  }

  async selectStage(stage: string): Promise<void> {
    await this.page.selectOption('select[name="stage"]', stage);
  }

  async setProbability(probability: number): Promise<void> {
    await this.page.fill('input[name="probability_percent"]', probability.toString());
  }

  async setExpectedCloseDate(date: string): Promise<void> {
    await this.page.fill('input[name="expected_close_date"]', date);
  }

  async selectProduct(productId: string): Promise<void> {
    await this.page.selectOption('select[name="product_id"]', productId);
  }

  async fillDealOwner(owner: string): Promise<void> {
    await this.page.fill('input[name="deal_owner"]', owner);
  }

  async fillNotes(notes: string): Promise<void> {
    await this.page.fill('textarea[name="notes"]', notes);
  }

  /**
   * Auto-naming and batch creation helpers
   */
  async verifyAutoNamingPreview(expectedPattern: string): Promise<boolean> {
    const namePreview = this.page.locator('[data-testid="name-preview"], .name-preview');
    if (await namePreview.isVisible()) {
      const previewText = await namePreview.textContent();
      return previewText?.includes(expectedPattern) || false;
    }
    return false;
  }

  async verifyBatchPreview(expectedCount: number): Promise<boolean> {
    const batchPreview = this.page.locator('[data-testid="batch-preview"], .batch-preview');
    if (await batchPreview.isVisible()) {
      const previewItems = await this.page.locator('[data-testid="batch-preview-item"]').count();
      return previewItems === expectedCount;
    }
    return false;
  }

  async getBatchPreviewNames(): Promise<string[]> {
    const previewItems = await this.page.locator('[data-testid="batch-preview-item"]').all();
    const names = [];
    
    for (const item of previewItems) {
      const name = await item.textContent();
      if (name) {
        names.push(name.trim());
      }
    }
    
    return names;
  }

  /**
   * Form submission and validation
   */
  async submitForm(): Promise<void> {
    await this.page.click('button[type="submit"], [data-testid="submit-button"]');
    await this.page.waitForTimeout(1000);
  }

  async submitBatchForm(): Promise<void> {
    await this.page.click('[data-testid="submit-batch"], button:has-text("Create Opportunities")');
    await this.page.waitForTimeout(2000); // Batch operations take longer
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

  /**
   * Wait and verification helpers
   */
  async waitForOpportunityCreated(): Promise<string> {
    await Promise.race([
      this.page.waitForURL(/\\/opportunities\\/[a-f0-9-]+$/),
      this.page.waitForSelector('[data-testid="success-message"]')
    ]);

    const url = this.page.url();
    const match = url.match(/\\/opportunities\\/([a-f0-9-]+)$/);
    if (match) {
      return match[1];
    }

    return 'success-no-id';
  }

  async waitForBatchCreated(): Promise<string[]> {
    await this.page.waitForSelector('[data-testid="batch-success"], [data-testid="batch-complete"]');
    
    // Extract created opportunity IDs from success message or redirect
    const successMessage = await this.page.locator('[data-testid="batch-success"]').textContent();
    const idMatches = successMessage?.match(/[a-f0-9-]{36}/g) || [];
    
    return idMatches;
  }

  async waitForFormReady(): Promise<void> {
    await this.page.waitForSelector('form, [data-testid="opportunity-form"]');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForOpportunityListReady(): Promise<void> {
    await this.page.waitForSelector('[data-testid="opportunity-table"], .opportunity-list, table');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Database verification helpers
   */
  async verifyOpportunityInDatabase(name: string): Promise<DatabaseOpportunity | null> {
    return await this.environmentManager.executeInEnvironment(
      // Development: Mock verification
      async () => {
        const mockOpportunity: DatabaseOpportunity = {
          id: `mock-opportunity-${Date.now()}`,
          name,
          stage: 'NEW_LEAD',
          probability_percent: 10,
          is_won: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        return mockOpportunity;
      },
      
      // Production: Real database verification
      async () => {
        return await this.queryOpportunityFromDatabase(name);
      }
    );
  }

  private async queryOpportunityFromDatabase(name: string): Promise<DatabaseOpportunity | null> {
    const response = await this.page.evaluate(async (name) => {
      try {
        const response = await fetch(`/api/opportunities?name=${encodeURIComponent(name)}`);
        if (response.ok) {
          const data = await response.json();
          return data.data?.[0] || null;
        }
      } catch (error) {
        console.error('Database query error:', error);
      }
      return null;
    }, name);

    return response;
  }

  /**
   * List and table operations
   */
  async searchOpportunities(query: string): Promise<void> {
    await this.page.fill('input[name="search"], [data-testid="search-input"]', query);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500);
  }

  async filterByStage(stage: string): Promise<void> {
    await this.page.selectOption('select[name="stage_filter"], [data-testid="stage-filter"]', stage);
    await this.page.waitForTimeout(500);
  }

  async getOpportunityRowCount(): Promise<number> {
    return await this.page.locator('[data-testid="opportunity-row"], .opportunity-row').count();
  }

  async clickOpportunityRow(index: number): Promise<void> {
    await this.page.click(`[data-testid="opportunity-row"]:nth-child(${index + 1})`);
  }

  /**
   * Performance and utility helpers
   */
  async measureFormLoadTime(): Promise<number> {
    const startTime = Date.now();
    await this.navigateToCreateOpportunity();
    return Date.now() - startTime;
  }

  async takeFormScreenshot(step?: string): Promise<void> {
    const timestamp = Date.now();
    const filename = step 
      ? `opportunity-form-${step}-${timestamp}.png`
      : `opportunity-form-${timestamp}.png`;
    
    await this.page.screenshot({
      path: `screenshots/${filename}`,
      fullPage: true
    });
  }

  /**
   * Test data generation
   */
  generateTestOpportunityData(prefix: string = 'test'): OpportunityFormData {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    
    return {
      name: `${prefix} Opportunity ${random}`,
      stage: 'NEW_LEAD',
      probability_percent: 25,
      context: 'COLD_OUTREACH',
      deal_owner: `${prefix}_owner_${random}`,
      notes: `Test opportunity created at ${new Date().toISOString()}`,
      auto_name: true
    };
  }

  /**
   * Batch operations
   */
  async createMultipleOpportunities(count: number, prefix: string = 'test'): Promise<string[]> {
    const opportunityIds: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const testData = this.generateTestOpportunityData(`${prefix}_${i}`);
      testData.auto_name = false; // Use manual names to avoid conflicts
      testData.name = `${prefix} Opportunity ${i} ${Date.now()}`;
      
      await this.navigateToCreateOpportunity();
      await this.fillOpportunityForm(testData);
      await this.submitForm();
      
      const opportunityId = await this.waitForOpportunityCreated();
      opportunityIds.push(opportunityId);
    }
    
    return opportunityIds;
  }
}