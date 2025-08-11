import { test, expect } from '@playwright/test';
import { EnvironmentManager } from '../helpers/EnvironmentManager';
import { OpportunityTestHelpers } from '../helpers/OpportunityTestHelpers';
import { DatabaseTestHelpers } from '../helpers/DatabaseTestHelpers';
import { opportunityTestSuite } from '../fixtures/opportunity-data';

/**
 * Opportunity Forms End-to-End Tests - Development Environment (MCP Mock)
 * 
 * Comprehensive testing of opportunity form functionality using MCP mock system.
 * Tests include auto-naming, batch creation, business logic validation, and database operations.
 */

test.describe('Opportunity Forms E2E - Development Environment', () => {
  let envManager: EnvironmentManager;
  let opportunityHelpers: OpportunityTestHelpers;
  let dbHelpers: DatabaseTestHelpers;

  test.beforeEach(async ({ page }) => {
    envManager = new EnvironmentManager(page, 'development');
    opportunityHelpers = new OpportunityTestHelpers(page, envManager);
    dbHelpers = new DatabaseTestHelpers(page, envManager);

    await envManager.initialize();
    await dbHelpers.initialize();
  });

  test.afterEach(async () => {
    await envManager.clearMockData();
    await dbHelpers.cleanup();
  });

  test.describe('Basic Opportunity Creation', () => {
    test('should create single opportunity with manual name successfully', async () => {
      const testData = opportunityTestSuite.valid.single;
      
      // Set up mock response for successful creation
      await envManager.setMockResponse({
        id: 'mock-opportunity-123',
        ...testData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      await opportunityHelpers.navigateToCreateOpportunity();
      
      // Verify form loads correctly
      await expect(opportunityHelpers.page.locator('h1')).toContainText('Create New Opportunity');
      
      // Fill and submit form
      await opportunityHelpers.fillOpportunityForm(testData);
      await opportunityHelpers.submitForm();
      
      // Verify successful submission
      const opportunityId = await opportunityHelpers.waitForOpportunityCreated();
      expect(opportunityId).toBeTruthy();
      expect(opportunityId).not.toBe('success-no-id');

      // Verify mock database operation
      const dbResult = await dbHelpers.selectOpportunity({ name: testData.name });
      expect(dbResult.error).toBeNull();
      expect(dbResult.data).toBeTruthy();
    });

    test('should create opportunity with auto-naming', async () => {
      const { withContext } = opportunityTestSuite.valid.autoNaming;
      const testData = {
        ...withContext,
        principal_id: 'mock-principal-1'
      };
      
      // Set up mock response with auto-generated name
      await envManager.setMockResponse({
        id: 'mock-opportunity-auto',
        name: 'Tech Innovations Inc - John Principal - Warm Introduction - Jan 2024',
        ...testData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      await opportunityHelpers.navigateToCreateOpportunity();
      await opportunityHelpers.fillOpportunityForm(testData);
      
      // Verify auto-naming preview appears
      const hasPreview = await opportunityHelpers.verifyAutoNamingPreview('Tech Innovations Inc');
      expect(hasPreview).toBe(true);
      
      await opportunityHelpers.submitForm();
      
      const opportunityId = await opportunityHelpers.waitForOpportunityCreated();
      expect(opportunityId).toBeTruthy();
    });

    test('should handle multi-step opportunity form correctly', async () => {
      const testData = opportunityTestSuite.generators.unique('multistep_dev');
      testData.principal_id = 'mock-principal-1';
      
      await opportunityHelpers.navigateToCreateOpportunity();
      
      const isMultiStep = await opportunityHelpers.isMultiStepForm();
      if (isMultiStep) {
        // Step 1: Organization and Context
        expect(await opportunityHelpers.getCurrentStep()).toBe(1);
        await opportunityHelpers.fillOrganizationAndContext(testData);
        await opportunityHelpers.clickNext();
        
        // Step 2: Principal Selection
        expect(await opportunityHelpers.getCurrentStep()).toBe(2);
        await opportunityHelpers.fillPrincipalSelection(testData);
        await opportunityHelpers.clickNext();
        
        // Step 3: Opportunity Details
        expect(await opportunityHelpers.getCurrentStep()).toBe(3);
        await opportunityHelpers.fillOpportunityDetails(testData);
        
        await opportunityHelpers.submitForm();
        
        const opportunityId = await opportunityHelpers.waitForOpportunityCreated();
        expect(opportunityId).toBeTruthy();
      } else {
        // Single-step form fallback
        await opportunityHelpers.fillOpportunityForm(testData);
        await opportunityHelpers.submitForm();
        
        const opportunityId = await opportunityHelpers.waitForOpportunityCreated();
        expect(opportunityId).toBeTruthy();
      }
    });
  });

  test.describe('Batch Creation Testing', () => {
    test('should create small batch of opportunities successfully', async () => {
      const batchScenario = opportunityTestSuite.valid.batchCreation[0]; // Small batch
      const testData = batchScenario.data;
      
      // Set up mock responses for batch creation
      const mockResponses = testData.principal_ids!.map((principalId, index) => ({
        id: `mock-batch-opportunity-${index}`,
        name: `${testData.organization_name} - Principal ${index + 1} - ${testData.context}`,
        principal_id: principalId,
        ...testData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      await envManager.setMockResponse(mockResponses);

      await opportunityHelpers.navigateToCreateOpportunity();
      await opportunityHelpers.fillOpportunityForm(testData);
      
      // Verify batch preview
      const hasValidPreview = await opportunityHelpers.verifyBatchPreview(testData.principal_ids!.length);
      expect(hasValidPreview).toBe(true);
      
      // Get preview names for verification
      const previewNames = await opportunityHelpers.getBatchPreviewNames();
      expect(previewNames.length).toBe(testData.principal_ids!.length);
      
      await opportunityHelpers.submitBatchForm();
      
      const opportunityIds = await opportunityHelpers.waitForBatchCreated();
      expect(opportunityIds.length).toBe(testData.principal_ids!.length);
    });

    test('should create large batch of opportunities', async () => {
      const batchScenario = opportunityTestSuite.valid.batchCreation[1]; // Large batch
      const testData = batchScenario.data;
      
      // Set up mock responses for large batch
      const mockResponses = testData.principal_ids!.map((principalId, index) => ({
        id: `mock-large-batch-${index}`,
        name: `${testData.organization_name} - Principal ${index + 1} - ${testData.context}`,
        principal_id: principalId,
        ...testData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      await envManager.setMockResponse(mockResponses);

      await opportunityHelpers.navigateToCreateOpportunity();
      await opportunityHelpers.fillOpportunityForm(testData);
      
      // Verify large batch preview
      const hasValidPreview = await opportunityHelpers.verifyBatchPreview(testData.principal_ids!.length);
      expect(hasValidPreview).toBe(true);
      
      await opportunityHelpers.submitBatchForm();
      
      const opportunityIds = await opportunityHelpers.waitForBatchCreated();
      expect(opportunityIds.length).toBe(testData.principal_ids!.length);
    });

    test('should handle batch creation with custom context', async () => {
      const batchScenario = opportunityTestSuite.valid.batchCreation[2]; // Mixed context batch
      const testData = batchScenario.data;
      
      await opportunityHelpers.navigateToCreateOpportunity();
      await opportunityHelpers.fillOpportunityForm(testData);
      
      // Verify custom context is handled in batch preview
      const previewNames = await opportunityHelpers.getBatchPreviewNames();
      expect(previewNames.length).toBe(testData.principal_ids!.length);
      expect(previewNames[0]).toContain(testData.custom_context!);
      
      await opportunityHelpers.submitBatchForm();
      
      const opportunityIds = await opportunityHelpers.waitForBatchCreated();
      expect(opportunityIds.length).toBe(testData.principal_ids!.length);
    });
  });

  test.describe('Form Validation Testing', () => {
    test('should validate all required fields', async () => {
      await opportunityHelpers.navigateToCreateOpportunity();
      
      // Submit empty form
      await opportunityHelpers.submitForm();
      
      const errors = await opportunityHelpers.getFormErrors();
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific required field errors
      const errorText = errors.join(' ').toLowerCase();
      expect(errorText).toMatch(/organization|required/);
    });

    test('should handle all invalid data scenarios', async () => {
      for (const scenario of opportunityTestSuite.invalid) {
        await test.step(`Testing: ${scenario.name}`, async () => {
          await opportunityHelpers.navigateToCreateOpportunity();
          await opportunityHelpers.fillOpportunityForm(scenario.data);
          await opportunityHelpers.submitForm();
          
          const errors = await opportunityHelpers.getFormErrors();
          expect(errors.length).toBeGreaterThan(0);
          
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

    test('should validate probability percentage range', async () => {
      const invalidProbabilityScenario = opportunityTestSuite.invalid.find(s => s.name === 'Invalid Probability Range');
      if (!invalidProbabilityScenario) throw new Error('Invalid probability test scenario not found');
      
      await opportunityHelpers.navigateToCreateOpportunity();
      await opportunityHelpers.fillOpportunityForm(invalidProbabilityScenario.data);
      await opportunityHelpers.submitForm();
      
      const errors = await opportunityHelpers.getFormErrors();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.toLowerCase().includes('probability'))).toBe(true);
    });

    test('should validate custom context requirement', async () => {
      const customContextScenario = opportunityTestSuite.invalid.find(s => s.name === 'Empty Custom Context');
      if (!customContextScenario) throw new Error('Custom context test scenario not found');
      
      await opportunityHelpers.navigateToCreateOpportunity();
      await opportunityHelpers.fillOpportunityForm(customContextScenario.data);
      await opportunityHelpers.submitForm();
      
      const errors = await opportunityHelpers.getFormErrors();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => 
        error.toLowerCase().includes('custom') || 
        error.toLowerCase().includes('context')
      )).toBe(true);
    });
  });

  test.describe('Auto-Naming System Testing', () => {
    test('should generate correct auto-names with different contexts', async () => {
      const { withContext } = opportunityTestSuite.valid.autoNaming;
      
      // Test each context type
      const contexts = ['COLD_OUTREACH', 'WARM_INTRODUCTION', 'INBOUND_INQUIRY', 'REFERRAL'];
      
      for (const context of contexts) {
        await test.step(`Testing auto-naming with ${context}`, async () => {
          const testData = opportunityTestSuite.generators.autoNaming(
            'Auto Naming Test Corp',
            context,
            1
          );
          
          await opportunityHelpers.navigateToCreateOpportunity();
          await opportunityHelpers.fillOpportunityForm(testData);
          
          // Verify auto-naming preview shows correct pattern
          const hasValidPreview = await opportunityHelpers.verifyAutoNamingPreview('Auto Naming Test Corp');
          expect(hasValidPreview).toBe(true);
        });
      }
    });

    test('should handle auto-naming with custom context', async () => {
      const { withCustomContext } = opportunityTestSuite.valid.autoNaming;
      
      const testData = {
        ...withCustomContext,
        principal_id: 'mock-principal-1'
      };
      
      await opportunityHelpers.navigateToCreateOpportunity();
      await opportunityHelpers.fillOpportunityForm(testData);
      
      const hasValidPreview = await opportunityHelpers.verifyAutoNamingPreview(testData.custom_context!);
      expect(hasValidPreview).toBe(true);
    });

    test('should generate unique names for multiple principals', async () => {
      const { multiPrincipal } = opportunityTestSuite.valid.autoNaming;
      
      await opportunityHelpers.navigateToCreateOpportunity();
      await opportunityHelpers.fillOpportunityForm(multiPrincipal);
      
      // Verify batch preview shows unique names
      const previewNames = await opportunityHelpers.getBatchPreviewNames();
      expect(previewNames.length).toBe(multiPrincipal.expected_count);
      
      // Check that all names are unique
      const uniqueNames = new Set(previewNames);
      expect(uniqueNames.size).toBe(previewNames.length);
      
      // Check that all names follow the expected pattern
      previewNames.forEach(name => {
        expect(name).toContain(multiPrincipal.organization_name!);
        expect(name).toContain('Referral');
      });
    });
  });

  test.describe('Business Logic Testing', () => {
    test('should handle stage-probability alignment', async () => {
      const stageProbabilityScenario = opportunityTestSuite.businessLogic.find(s => s.name === 'Stage Probability Alignment');
      if (!stageProbabilityScenario) throw new Error('Stage probability test scenario not found');
      
      await opportunityHelpers.navigateToCreateOpportunity();
      await opportunityHelpers.fillOpportunityForm(stageProbabilityScenario.data);
      
      // Mock might auto-adjust probability based on stage
      await opportunityHelpers.submitForm();
      
      const opportunityId = await opportunityHelpers.waitForOpportunityCreated();
      expect(opportunityId).toBeTruthy();
    });

    test('should handle won opportunity requirements', async () => {
      const wonOpportunityScenario = opportunityTestSuite.businessLogic.find(s => s.name === 'Won Opportunity Validation');
      if (!wonOpportunityScenario) throw new Error('Won opportunity test scenario not found');
      
      // Set up mock to simulate probability correction
      await envManager.setMockResponse({
        id: 'mock-won-opportunity',
        ...wonOpportunityScenario.data,
        probability_percent: 100, // Should be corrected to 100%
        is_won: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      await opportunityHelpers.navigateToCreateOpportunity();
      await opportunityHelpers.fillOpportunityForm(wonOpportunityScenario.data);
      await opportunityHelpers.submitForm();
      
      const opportunityId = await opportunityHelpers.waitForOpportunityCreated();
      expect(opportunityId).toBeTruthy();
      
      // Verify database shows corrected probability
      const dbResult = await dbHelpers.selectOpportunity({ id: opportunityId });
      expect(dbResult.data?.probability_percent).toBe(100);
    });
  });

  test.describe('Database Integration (Mock)', () => {
    test('should verify mock opportunity database operations', async () => {
      const testData = opportunityTestSuite.generators.unique('db_test_opp');
      
      // Test mock insert
      const insertResult = await dbHelpers.insertOpportunity(testData);
      expect(insertResult.error).toBeNull();
      expect(insertResult.data).toBeTruthy();
      expect(insertResult.data.name).toBe(testData.name);
      
      // Test mock select
      const selectResult = await dbHelpers.selectOpportunity({ name: testData.name });
      expect(selectResult.error).toBeNull();
      expect(selectResult.data).toBeTruthy();
      
      // Test mock update
      const updateResult = await dbHelpers.updateOpportunity(insertResult.data.id, { 
        stage: 'DEMO_SCHEDULED',
        probability_percent: 75
      });
      expect(updateResult.error).toBeNull();
      expect(updateResult.data.stage).toBe('DEMO_SCHEDULED');
      expect(updateResult.data.probability_percent).toBe(75);
      
      // Test mock delete
      const deleteResult = await dbHelpers.deleteOpportunity(insertResult.data.id);
      expect(deleteResult.error).toBeNull();
    });

    test('should validate opportunity table schema in mock environment', async () => {
      const expectedColumns = [
        'id', 'name', 'stage', 'probability_percent', 'expected_close_date',
        'organization_id', 'principal_id', 'product_id', 'deal_owner', 'notes',
        'context', 'custom_context', 'name_template', 'is_won', 
        'created_at', 'updated_at'
      ];
      
      const schemaResult = await dbHelpers.validateTableSchema('opportunities', expectedColumns);
      expect(schemaResult.isValid).toBe(true);
      expect(schemaResult.errors).toHaveLength(0);
      expect(schemaResult.tableExists).toBe(true);
    });

    test('should handle concurrent opportunity creation', async () => {
      const batchData = opportunityTestSuite.generators.batch(3, 'concurrent_opp');
      
      const mockOperations = Array.from({ length: 3 }, (_, i) => {
        const oppData = opportunityTestSuite.generators.unique(`concurrent_${i}`);
        return () => dbHelpers.insertOpportunity(oppData);
      });
      
      const results = await dbHelpers.testConcurrentOperations(mockOperations);
      expect(results.errors).toHaveLength(0);
      expect(results.results).toHaveLength(3);
      
      results.results.forEach(result => {
        expect(result.error).toBeNull();
        expect(result.data).toBeTruthy();
      });
    });
  });

  test.describe('Edge Cases Testing', () => {
    test('should handle special characters in organization names', async () => {
      const specialCharsScenario = opportunityTestSuite.edgeCases.find(e => e.name === 'Special Characters in Organization');
      if (!specialCharsScenario) throw new Error('Special characters test case not found');
      
      await envManager.setMockResponse({
        id: 'mock-special-chars-opp',
        ...specialCharsScenario.data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      await opportunityHelpers.navigateToCreateOpportunity();
      await opportunityHelpers.fillOpportunityForm(specialCharsScenario.data);
      await opportunityHelpers.submitForm();
      
      const opportunityId = await opportunityHelpers.waitForOpportunityCreated();
      expect(opportunityId).toBeTruthy();
    });

    test('should handle maximum and minimum probability values', async () => {
      const minProbScenario = opportunityTestSuite.edgeCases.find(e => e.name === 'Minimum Probability Edge Case');
      const maxProbScenario = opportunityTestSuite.edgeCases.find(e => e.name === 'Maximum Probability Edge Case');
      
      if (!minProbScenario || !maxProbScenario) {
        throw new Error('Probability edge case scenarios not found');
      }
      
      // Test minimum probability (0%)
      await test.step('Testing 0% probability', async () => {
        await opportunityHelpers.navigateToCreateOpportunity();
        await opportunityHelpers.fillOpportunityForm(minProbScenario.data);
        await opportunityHelpers.submitForm();
        
        const opportunityId = await opportunityHelpers.waitForOpportunityCreated();
        expect(opportunityId).toBeTruthy();
      });
      
      // Test maximum probability (100%)
      await test.step('Testing 100% probability', async () => {
        await opportunityHelpers.navigateToCreateOpportunity();
        await opportunityHelpers.fillOpportunityForm(maxProbScenario.data);
        await opportunityHelpers.submitForm();
        
        const opportunityId = await opportunityHelpers.waitForOpportunityCreated();
        expect(opportunityId).toBeTruthy();
      });
    });

    test('should handle very long notes field', async () => {
      const longNotesScenario = opportunityTestSuite.edgeCases.find(e => e.name === 'Very Long Notes Field');
      if (!longNotesScenario) throw new Error('Long notes test case not found');
      
      await opportunityHelpers.navigateToCreateOpportunity();
      await opportunityHelpers.fillOpportunityForm(longNotesScenario.data);
      await opportunityHelpers.submitForm();
      
      const opportunityId = await opportunityHelpers.waitForOpportunityCreated();
      expect(opportunityId).toBeTruthy();
    });
  });

  test.describe('Performance Testing', () => {
    test('should handle batch creation performance', async () => {
      const { batchSizes } = opportunityTestSuite.performance;
      
      for (const batchSize of batchSizes) {
        await test.step(`Testing batch size: ${batchSize}`, async () => {
          const startTime = Date.now();
          
          const batchData = opportunityTestSuite.generators.batch(batchSize, `perf_batch_${batchSize}`);
          
          await opportunityHelpers.navigateToCreateOpportunity();
          await opportunityHelpers.fillOpportunityForm(batchData);
          await opportunityHelpers.submitBatchForm();
          
          const opportunityIds = await opportunityHelpers.waitForBatchCreated();
          const totalTime = Date.now() - startTime;
          
          expect(opportunityIds.length).toBe(batchSize);
          expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
          
          const averageTime = totalTime / batchSize;
          expect(averageTime).toBeLessThan(2000); // Average under 2 seconds per opportunity
        });
      }
    });

    test('should maintain form performance under load', async () => {
      const loadStartTime = Date.now();
      const createdOpportunities = [];
      
      // Create multiple opportunities rapidly
      for (let i = 0; i < 5; i++) {
        const testData = opportunityTestSuite.generators.unique(`load_test_${i}`);
        
        await opportunityHelpers.navigateToCreateOpportunity();
        await opportunityHelpers.fillOpportunityForm(testData);
        await opportunityHelpers.submitForm();
        
        const opportunityId = await opportunityHelpers.waitForOpportunityCreated();
        createdOpportunities.push(opportunityId);
      }
      
      const totalTime = Date.now() - loadStartTime;
      expect(createdOpportunities.length).toBe(5);
      expect(totalTime).toBeLessThan(30000); // All operations within 30 seconds
    });
  });

  test.describe('Integration Testing', () => {
    test('should create opportunity from contact context', async () => {
      // Mock existing contact
      await envManager.setMockResponse({
        id: 'mock-contact-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@company.com',
        organization: 'Integration Test Corp'
      });
      
      const { contactToOpportunity } = opportunityTestSuite.integration;
      
      // Navigate from contact page
      await opportunityHelpers.navigateToCreateFromContact('mock-contact-123');
      
      // Form should pre-populate organization
      await opportunityHelpers.fillOpportunityForm(contactToOpportunity.data);
      await opportunityHelpers.submitForm();
      
      const opportunityId = await opportunityHelpers.waitForOpportunityCreated();
      expect(opportunityId).toBeTruthy();
    });

    test('should create multiple opportunities from organization context', async () => {
      // Mock existing organization with principals
      await envManager.setMockResponse({
        id: 'mock-org-123',
        name: 'Integration Test Organization',
        principals: [
          { id: 'principal-1', name: 'Principal One' },
          { id: 'principal-2', name: 'Principal Two' },
          { id: 'principal-3', name: 'Principal Three' }
        ]
      });
      
      const { organizationToOpportunity } = opportunityTestSuite.integration;
      
      await opportunityHelpers.navigateToCreateFromOrganization('mock-org-123');
      
      // Should have pre-populated organization and available principals
      const testData = {
        ...organizationToOpportunity.data,
        principal_ids: ['principal-1', 'principal-2', 'principal-3']
      };
      
      await opportunityHelpers.fillOpportunityForm(testData);
      await opportunityHelpers.submitBatchForm();
      
      const opportunityIds = await opportunityHelpers.waitForBatchCreated();
      expect(opportunityIds.length).toBe(3);
    });
  });

  test.describe('User Experience Testing', () => {
    test('should support keyboard navigation', async () => {
      await opportunityHelpers.navigateToCreateOpportunity();
      
      // Test tab navigation
      await opportunityHelpers.page.keyboard.press('Tab');
      const focusedElement = await opportunityHelpers.page.evaluate(() => document.activeElement?.tagName);
      
      expect(['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA'].includes(focusedElement)).toBe(true);
    });

    test('should maintain form state during navigation', async () => {
      await opportunityHelpers.navigateToCreateOpportunity();
      
      const testData = opportunityTestSuite.generators.unique('state_test');
      
      if (await opportunityHelpers.isMultiStepForm()) {
        // Fill first step
        await opportunityHelpers.fillOrganizationAndContext(testData);
        await opportunityHelpers.clickNext();
        
        // Go back
        await opportunityHelpers.clickPrevious();
        
        // Verify data is still there (organization name should persist)
        const orgName = await opportunityHelpers.page.inputValue('input[name="organization_name"], [data-testid="organization-input"]');
        if (orgName) {
          expect(orgName).toBe(testData.organization_name);
        }
      }
    });

    test('should load opportunity form within performance requirements', async () => {
      const loadTime = await opportunityHelpers.measureFormLoadTime();
      expect(loadTime).toBeLessThan(5000); // Should load in under 5 seconds
    });
  });
});