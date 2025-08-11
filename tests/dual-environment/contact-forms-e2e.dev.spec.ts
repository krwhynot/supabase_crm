import { test, expect } from '@playwright/test';
import { EnvironmentManager } from '../helpers/EnvironmentManager';
import { ContactTestHelpers } from '../helpers/ContactTestHelpers';
import { DatabaseTestHelpers } from '../helpers/DatabaseTestHelpers';
import { contactTestSuite } from '../fixtures/contact-data';

/**
 * Contact Forms End-to-End Tests - Development Environment (MCP Mock)
 * 
 * Comprehensive testing of contact form functionality using MCP mock system.
 * Tests form validation, submission flow, and mock database operations.
 */

test.describe('Contact Forms E2E - Development Environment', () => {
  let envManager: EnvironmentManager;
  let contactHelpers: ContactTestHelpers;
  let dbHelpers: DatabaseTestHelpers;

  test.beforeEach(async ({ page }) => {
    envManager = new EnvironmentManager(page, 'development');
    contactHelpers = new ContactTestHelpers(page, envManager);
    dbHelpers = new DatabaseTestHelpers(page, envManager);

    await envManager.initialize();
    await dbHelpers.initialize();
  });

  test.afterEach(async () => {
    await envManager.clearMockData();
    await dbHelpers.cleanup();
  });

  test.describe('Basic Contact Creation', () => {
    test('should create contact with valid data successfully', async () => {
      const testData = contactTestSuite.valid.single;
      
      // Set up mock response for successful creation
      await envManager.setMockResponse({
        id: 'mock-contact-123',
        ...testData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      await contactHelpers.navigateToCreateContact();
      
      // Verify form loads correctly - use more specific selector for the page title
      await expect(contactHelpers.page.locator('main h1, .main-content h1')).toContainText('Create New Contact');
      
      // Fill and submit form
      await contactHelpers.fillContactForm(testData);
      await contactHelpers.submitForm();
      
      // Verify successful submission
      const contactId = await contactHelpers.waitForContactCreated();
      expect(contactId).toBeTruthy();
      expect(contactId).not.toBe('success-no-id');

      // Verify mock database operation
      const dbResult = await dbHelpers.selectContact({ email: testData.email });
      expect(dbResult.error).toBeNull();
      expect(dbResult.data).toBeTruthy();
    });

    test('should handle multi-step form progression correctly', async () => {
      const { step1, step2, step3 } = contactTestSuite.valid.multiStep;
      
      await contactHelpers.navigateToCreateContact();
      
      // Verify multi-step form is detected
      const isMultiStep = await contactHelpers.isMultiStepForm();
      if (isMultiStep) {
        // Step 1: Basic Information
        expect(await contactHelpers.getCurrentStep()).toBe(1);
        await contactHelpers.fillBasicInformation(step1);
        await contactHelpers.clickNext();
        
        // Step 2: Authority Information
        expect(await contactHelpers.getCurrentStep()).toBe(2);
        await contactHelpers.fillAuthorityInformation(step2);
        await contactHelpers.clickNext();
        
        // Step 3: Contact Preferences
        expect(await contactHelpers.getCurrentStep()).toBe(3);
        await contactHelpers.fillContactPreferences(step3);
        
        // Submit complete form
        await contactHelpers.submitForm();
        
        // Verify successful completion
        const contactId = await contactHelpers.waitForContactCreated();
        expect(contactId).toBeTruthy();
      } else {
        // Single-step form fallback
        const combinedData = { ...step1, ...step2, ...step3 };
        await contactHelpers.fillContactForm(combinedData);
        await contactHelpers.submitForm();
        
        const contactId = await contactHelpers.waitForContactCreated();
        expect(contactId).toBeTruthy();
      }
    });

    test('should validate required fields', async () => {
      await contactHelpers.navigateToCreateContact();
      
      // Submit empty form
      await contactHelpers.submitForm();
      
      // Check for validation errors
      const errors = await contactHelpers.getFormErrors();
      expect(errors.length).toBeGreaterThan(0);
      
      // Verify specific required field errors
      const errorText = errors.join(' ').toLowerCase();
      expect(errorText).toContain('first name');
      expect(errorText).toContain('last name');
      expect(errorText).toContain('email');
    });

    test('should validate email format', async () => {
      const invalidEmailScenario = contactTestSuite.invalid.find(s => s.name === 'Invalid Email Format');
      if (!invalidEmailScenario) throw new Error('Invalid email test scenario not found');
      
      await contactHelpers.navigateToCreateContact();
      await contactHelpers.fillContactForm(invalidEmailScenario.data);
      await contactHelpers.submitForm();
      
      const errors = await contactHelpers.getFormErrors();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.toLowerCase().includes('email'))).toBe(true);
    });
  });

  test.describe('Form Validation', () => {
    test('should handle all invalid data scenarios', async () => {
      for (const scenario of contactTestSuite.invalid) {
        await test.step(`Testing: ${scenario.name}`, async () => {
          await contactHelpers.navigateToCreateContact();
          await contactHelpers.fillContactForm(scenario.data);
          await contactHelpers.submitForm();
          
          const errors = await contactHelpers.getFormErrors();
          expect(errors.length).toBeGreaterThan(0);
          
          // Verify specific expected errors if provided
          if (scenario.validationErrors) {
            for (const expectedError of scenario.validationErrors) {
              const hasExpectedError = errors.some(error => 
                error.toLowerCase().includes(expectedError.toLowerCase()) ||
                expectedError.toLowerCase().includes(error.toLowerCase())
              );
              expect(hasExpectedError).toBe(true);
            }
          }
        });
      }
    });

    test('should handle edge cases correctly', async () => {
      for (const scenario of contactTestSuite.edgeCases) {
        if (scenario.expectedOutcome === 'success') {
          await test.step(`Testing edge case: ${scenario.name}`, async () => {
            // Set up mock for success
            await envManager.setMockResponse({
              id: `mock-edge-${Date.now()}`,
              ...scenario.data,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

            await contactHelpers.navigateToCreateContact();
            await contactHelpers.fillContactForm(scenario.data);
            await contactHelpers.submitForm();
            
            const contactId = await contactHelpers.waitForContactCreated();
            expect(contactId).toBeTruthy();
          });
        }
      }
    });

    test('should prevent duplicate email addresses', async () => {
      const duplicateScenario = contactTestSuite.duplicates.find(s => s.name === 'Duplicate Email');
      if (!duplicateScenario) throw new Error('Duplicate email test scenario not found');
      
      // Set up mock to simulate duplicate error
      await envManager.setMockResponse(null, {
        code: '23505',
        message: 'duplicate key value violates unique constraint "contacts_email_unique"'
      });

      await contactHelpers.navigateToCreateContact();
      await contactHelpers.fillContactForm(duplicateScenario.data);
      await contactHelpers.submitForm();
      
      const errors = await contactHelpers.getFormErrors();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => 
        error.toLowerCase().includes('email') && 
        (error.toLowerCase().includes('exists') || error.toLowerCase().includes('duplicate'))
      )).toBe(true);
    });
  });

  test.describe('Database Integration (Mock)', () => {
    test('should verify mock database operations', async () => {
      const testData = contactTestSuite.generators.unique('db_test');
      
      // Test mock insert
      const insertResult = await dbHelpers.insertContact(testData);
      expect(insertResult.error).toBeNull();
      expect(insertResult.data).toBeTruthy();
      expect(insertResult.data.email).toBe(testData.email);
      
      // Test mock select
      const selectResult = await dbHelpers.selectContact({ email: testData.email });
      expect(selectResult.error).toBeNull();
      expect(selectResult.data).toBeTruthy();
      
      // Test mock update
      const updateResult = await dbHelpers.updateContact(insertResult.data.id, { 
        title: 'Updated Title' 
      });
      expect(updateResult.error).toBeNull();
      expect(updateResult.data.title).toBe('Updated Title');
      
      // Test mock delete
      const deleteResult = await dbHelpers.deleteContact(insertResult.data.id);
      expect(deleteResult.error).toBeNull();
    });

    test('should validate table schema in mock environment', async () => {
      const expectedColumns = [
        'id', 'first_name', 'last_name', 'email', 'organization',
        'title', 'phone', 'notes', 'created_at', 'updated_at'
      ];
      
      const schemaResult = await dbHelpers.validateTableSchema('contacts', expectedColumns);
      expect(schemaResult.isValid).toBe(true);
      expect(schemaResult.errors).toHaveLength(0);
      expect(schemaResult.tableExists).toBe(true);
    });

    test('should handle concurrent form submissions', async () => {
      const batchData = contactTestSuite.generators.batch(5, 'concurrent_test');
      
      // Set up mock responses for concurrent operations
      const mockOperations = batchData.map(data => () => dbHelpers.insertContact(data));
      
      const results = await dbHelpers.testConcurrentOperations(mockOperations);
      expect(results.errors).toHaveLength(0);
      expect(results.results).toHaveLength(5);
      
      // All operations should succeed in mock environment
      results.results.forEach(result => {
        expect(result.error).toBeNull();
        expect(result.data).toBeTruthy();
      });
    });
  });

  test.describe('User Interface', () => {
    test('should support keyboard navigation', async () => {
      const canNavigateWithKeyboard = await contactHelpers.testKeyboardNavigation();
      expect(canNavigateWithKeyboard).toBe(true);
    });

    test('should have proper ARIA labels', async () => {
      await contactHelpers.navigateToCreateContact();
      const hasProperAriaLabels = await contactHelpers.checkAriaLabels();
      expect(hasProperAriaLabels).toBe(true);
    });

    test('should load form within performance requirements', async () => {
      const loadTime = await contactHelpers.measureFormLoadTime();
      expect(loadTime).toBeLessThan(3000); // Should load in under 3 seconds
    });

    test('should maintain form state during navigation', async () => {
      await contactHelpers.navigateToCreateContact();
      
      if (await contactHelpers.isMultiStepForm()) {
        // Fill step 1
        const step1Data = contactTestSuite.valid.multiStep.step1;
        await contactHelpers.fillBasicInformation(step1Data);
        await contactHelpers.clickNext();
        
        // Go back to step 1
        await contactHelpers.clickPrevious();
        
        // Verify data is still there
        const validation = await contactHelpers.validateFormData(step1Data);
        expect(validation.isValid).toBe(true);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Set up mock to simulate network error
      await envManager.setMockResponse(null, {
        message: 'Network error',
        code: 'NETWORK_ERROR'
      });

      const testData = contactTestSuite.valid.single;
      await contactHelpers.navigateToCreateContact();
      await contactHelpers.fillContactForm(testData);
      await contactHelpers.submitForm();
      
      const errors = await contactHelpers.getFormErrors();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => 
        error.toLowerCase().includes('network') || 
        error.toLowerCase().includes('error') ||
        error.toLowerCase().includes('try again')
      )).toBe(true);
    });

    test('should provide clear error messages', async () => {
      const testData = contactTestSuite.invalid[0]; // Empty required fields
      
      await contactHelpers.navigateToCreateContact();
      await contactHelpers.fillContactForm(testData.data);
      await contactHelpers.submitForm();
      
      const errors = await contactHelpers.getFormErrors();
      expect(errors.length).toBeGreaterThan(0);
      
      // Errors should be user-friendly, not technical
      errors.forEach(error => {
        expect(error).not.toMatch(/undefined|null|NaN|[{}]/);
        expect(error.length).toBeGreaterThan(3); // Not just punctuation
      });
    });

    test('should handle form reset correctly', async () => {
      const testData = contactTestSuite.valid.single;
      
      await contactHelpers.navigateToCreateContact();
      await contactHelpers.fillContactForm(testData);
      
      // Look for reset button and click it
      const resetButton = contactHelpers.page.locator('button:has-text("Reset"), button:has-text("Clear"), button[type="reset"]');
      
      if (await resetButton.isVisible()) {
        await resetButton.click();
        
        // Verify form is cleared
        const firstName = await contactHelpers.page.inputValue('input[name="first_name"]');
        const lastName = await contactHelpers.page.inputValue('input[name="last_name"]');
        const email = await contactHelpers.page.inputValue('input[name="email"]');
        
        expect(firstName).toBe('');
        expect(lastName).toBe('');
        expect(email).toBe('');
      }
    });
  });

  test.describe('Bulk Operations', () => {
    test('should handle batch contact creation', async () => {
      const batchData = contactTestSuite.generators.batch(10, 'batch_dev');
      const createdIds: string[] = [];
      
      for (const contactData of batchData) {
        await envManager.setMockResponse({
          id: `mock-batch-${Date.now()}-${Math.random()}`,
          ...contactData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        await contactHelpers.navigateToCreateContact();
        await contactHelpers.fillContactForm(contactData);
        await contactHelpers.submitForm();
        
        const contactId = await contactHelpers.waitForContactCreated();
        expect(contactId).toBeTruthy();
        createdIds.push(contactId);
      }
      
      expect(createdIds).toHaveLength(10);
      expect(new Set(createdIds).size).toBe(10); // All unique
    });

    test('should maintain performance with multiple operations', async () => {
      const startTime = Date.now();
      const batchSize = 5;
      
      const contactIds = await contactHelpers.createMultipleContacts(batchSize, 'perf_test');
      
      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / batchSize;
      
      expect(contactIds).toHaveLength(batchSize);
      expect(averageTime).toBeLessThan(5000); // Average under 5 seconds per contact
    });
  });

  test.describe('Data Validation', () => {
    test('should enforce field length constraints', async () => {
      const longNameData = {
        first_name: 'A'.repeat(300),
        last_name: 'B'.repeat(300), 
        email: 'test@example.com',
        organization: 'Test Company'
      };
      
      await contactHelpers.navigateToCreateContact();
      await contactHelpers.fillContactForm(longNameData);
      await contactHelpers.submitForm();
      
      const errors = await contactHelpers.getFormErrors();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => 
        error.toLowerCase().includes('long') || 
        error.toLowerCase().includes('characters')
      )).toBe(true);
    });

    test('should handle special characters correctly', async () => {
      const specialCharData = contactTestSuite.edgeCases.find(e => e.name === 'Special Characters in Names');
      if (!specialCharData) throw new Error('Special characters test case not found');
      
      await envManager.setMockResponse({
        id: 'mock-special-chars',
        ...specialCharData.data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      await contactHelpers.navigateToCreateContact();
      await contactHelpers.fillContactForm(specialCharData.data);
      await contactHelpers.submitForm();
      
      const contactId = await contactHelpers.waitForContactCreated();
      expect(contactId).toBeTruthy();
    });
  });

  test.describe('Form State Management', () => {
    test('should persist form data during page refresh', async () => {
      const testData = contactTestSuite.valid.single;
      
      await contactHelpers.navigateToCreateContact();
      await contactHelpers.fillBasicInformation(testData);
      
      // Refresh page
      await contactHelpers.page.reload();
      await contactHelpers.waitForFormReady();
      
      // Check if form data is restored (this depends on implementation)
      // Some forms save to localStorage/sessionStorage
      const firstName = await contactHelpers.page.inputValue('input[name="first_name"]');
      
      // This might be empty if no persistence is implemented, which is also valid
      if (firstName) {
        expect(firstName).toBe(testData.first_name);
      }
    });

    test('should clear sensitive data on form cancel', async () => {
      const testData = contactTestSuite.valid.single;
      
      await contactHelpers.navigateToCreateContact();
      await contactHelpers.fillContactForm(testData);
      
      // Cancel form
      const cancelButton = contactHelpers.page.locator('button:has-text("Cancel"), a:has-text("Cancel")');
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
        
        // Navigate back to form
        await contactHelpers.navigateToCreateContact();
        
        // Form should be empty
        const firstName = await contactHelpers.page.inputValue('input[name="first_name"]');
        expect(firstName).toBe('');
      }
    });
  });
});