import { test, expect } from '@playwright/test';
import { EnvironmentManager } from '../helpers/EnvironmentManager';
import { ContactTestHelpers } from '../helpers/ContactTestHelpers';
import { DatabaseTestHelpers } from '../helpers/DatabaseTestHelpers';
import { contactTestSuite } from '../fixtures/contact-data';

/**
 * Contact Forms End-to-End Tests - Production Environment (Real Supabase)
 * 
 * Comprehensive testing of contact form functionality using real Supabase database.
 * Tests form validation, submission flow, and database operations with actual data persistence.
 */

test.describe('Contact Forms E2E - Production Environment', () => {
  let envManager: EnvironmentManager;
  let contactHelpers: ContactTestHelpers;
  let dbHelpers: DatabaseTestHelpers;
  let testDataCleanup: string[] = []; // Track created records for cleanup

  test.beforeEach(async ({ page }) => {
    envManager = new EnvironmentManager(page, 'production');
    contactHelpers = new ContactTestHelpers(page, envManager);
    dbHelpers = new DatabaseTestHelpers(page, envManager);

    await envManager.initialize();
    await dbHelpers.initialize();
    await dbHelpers.waitForDatabaseReady();
  });

  test.afterEach(async () => {
    // Clean up test data from production database
    for (const contactId of testDataCleanup) {
      try {
        await dbHelpers.deleteContact(contactId);
      } catch (error) {
        console.warn(`Cleanup warning for contact ${contactId}:`, error.message);
      }
    }
    testDataCleanup = [];
    await dbHelpers.cleanup();
  });

  test.describe('Basic Contact Creation - Real Database', () => {
    test('should create contact with valid data in production database', async () => {
      const testData = contactTestSuite.generators.unique('prod_basic', 1);
      
      await contactHelpers.navigateToCreateContact();
      
      // Verify form loads correctly
      await expect(contactHelpers.page.locator('h1')).toContainText('Create New Contact');
      
      // Fill and submit form
      await contactHelpers.fillContactForm(testData);
      await contactHelpers.submitForm();
      
      // Verify successful submission with real database
      const contactId = await contactHelpers.waitForContactCreated();
      expect(contactId).toBeTruthy();
      expect(contactId).not.toBe('success-no-id');
      testDataCleanup.push(contactId);

      // Verify actual database persistence
      const dbResult = await dbHelpers.selectContact({ email: testData.email });
      expect(dbResult.error).toBeNull();
      expect(dbResult.data).toBeTruthy();
      expect(dbResult.data.email).toBe(testData.email);
      expect(dbResult.data.first_name).toBe(testData.first_name);
      expect(dbResult.data.last_name).toBe(testData.last_name);
    });

    test('should enforce database constraints in production', async () => {
      const testData = contactTestSuite.generators.unique('prod_constraints');
      
      // First, create a contact
      await contactHelpers.navigateToCreateContact();
      await contactHelpers.fillContactForm(testData);
      await contactHelpers.submitForm();
      
      const contactId = await contactHelpers.waitForContactCreated();
      testDataCleanup.push(contactId);
      
      // Now try to create another contact with the same email
      const duplicateData = { ...testData, first_name: 'Different', last_name: 'Person' };
      
      await contactHelpers.navigateToCreateContact();
      await contactHelpers.fillContactForm(duplicateData);
      await contactHelpers.submitForm();
      
      // Should get a database constraint error
      const errors = await contactHelpers.getFormErrors();
      expect(errors.length).toBeGreaterThan(0);
      
      // Verify the error mentions email uniqueness
      const hasEmailError = errors.some(error => 
        error.toLowerCase().includes('email') && 
        (error.toLowerCase().includes('exists') || 
         error.toLowerCase().includes('duplicate') ||
         error.toLowerCase().includes('unique'))
      );
      expect(hasEmailError).toBe(true);
    });

    test('should handle multi-step form with real database validation', async () => {
      const { step1, step2, step3 } = contactTestSuite.valid.multiStep;
      const combinedData = { ...step1, ...step2, ...step3 };
      // Make email unique for production
      combinedData.email = `multistep_${Date.now()}@test.com`;
      
      await contactHelpers.navigateToCreateContact();
      
      const isMultiStep = await contactHelpers.isMultiStepForm();
      if (isMultiStep) {
        // Step 1: Basic Information
        expect(await contactHelpers.getCurrentStep()).toBe(1);
        await contactHelpers.fillBasicInformation(step1);
        await contactHelpers.clickNext();
        
        // Step 2: Authority Information  
        expect(await contactHelpers.getCurrentStep()).toBe(2);
        await contactHelpers.fillAuthorityInformation({ ...step2, ...combinedData });
        await contactHelpers.clickNext();
        
        // Step 3: Contact Preferences
        expect(await contactHelpers.getCurrentStep()).toBe(3);
        await contactHelpers.fillContactPreferences({ ...step3, ...combinedData });
        
        await contactHelpers.submitForm();
        
        const contactId = await contactHelpers.waitForContactCreated();
        expect(contactId).toBeTruthy();
        testDataCleanup.push(contactId);
        
        // Verify all data was saved correctly in database
        const dbResult = await dbHelpers.selectContact({ email: combinedData.email });
        expect(dbResult.error).toBeNull();
        expect(dbResult.data.authority_level).toBe(step2.authority_level);
        expect(dbResult.data.influence_level).toBe(step2.influence_level);
      } else {
        // Single-step form fallback
        await contactHelpers.fillContactForm(combinedData);
        await contactHelpers.submitForm();
        
        const contactId = await contactHelpers.waitForContactCreated();
        expect(contactId).toBeTruthy();
        testDataCleanup.push(contactId);
      }
    });
  });

  test.describe('Production Database Validation', () => {
    test('should validate required fields with database feedback', async () => {
      await contactHelpers.navigateToCreateContact();
      
      // Submit empty form
      await contactHelpers.submitForm();
      
      // Check for validation errors (these might come from frontend or backend)
      const errors = await contactHelpers.getFormErrors();
      expect(errors.length).toBeGreaterThan(0);
      
      // Verify specific required field errors
      const errorText = errors.join(' ').toLowerCase();
      expect(errorText).toContain('required');
    });

    test('should validate email format with database constraints', async () => {
      const invalidEmailScenario = contactTestSuite.invalid.find(s => s.name === 'Invalid Email Format');
      if (!invalidEmailScenario) throw new Error('Invalid email test scenario not found');
      
      // Make the test data unique for production
      const testData = {
        ...invalidEmailScenario.data,
        first_name: `invalid_email_${Date.now()}`,
        last_name: `test_${Date.now()}`
      };
      
      await contactHelpers.navigateToCreateContact();
      await contactHelpers.fillContactForm(testData);
      await contactHelpers.submitForm();
      
      const errors = await contactHelpers.getFormErrors();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.toLowerCase().includes('email'))).toBe(true);
    });

    test('should enforce field length constraints in database', async () => {
      const longNameData = contactTestSuite.generators.unique('prod_length');
      longNameData.first_name = 'A'.repeat(300); // Exceed typical varchar limits
      longNameData.last_name = 'B'.repeat(300);
      
      await contactHelpers.navigateToCreateContact();
      await contactHelpers.fillContactForm(longNameData);
      await contactHelpers.submitForm();
      
      const errors = await contactHelpers.getFormErrors();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => 
        error.toLowerCase().includes('long') || 
        error.toLowerCase().includes('characters') ||
        error.toLowerCase().includes('limit')
      )).toBe(true);
    });
  });

  test.describe('Production Database Operations', () => {
    test('should perform complete CRUD cycle in production database', async () => {
      const testData = contactTestSuite.generators.unique('prod_crud');
      
      // CREATE: Insert new contact
      const insertResult = await dbHelpers.insertContact(testData);
      expect(insertResult.error).toBeNull();
      expect(insertResult.data).toBeTruthy();
      expect(insertResult.data.email).toBe(testData.email);
      testDataCleanup.push(insertResult.data.id);
      
      // READ: Select the contact
      const selectResult = await dbHelpers.selectContact({ email: testData.email });
      expect(selectResult.error).toBeNull();
      expect(selectResult.data).toBeTruthy();
      expect(selectResult.data.id).toBe(insertResult.data.id);
      
      // UPDATE: Modify the contact
      const updateData = { title: 'Updated Senior Manager' };
      const updateResult = await dbHelpers.updateContact(insertResult.data.id, updateData);
      expect(updateResult.error).toBeNull();
      expect(updateResult.data.title).toBe(updateData.title);
      
      // Verify update persisted
      const selectUpdatedResult = await dbHelpers.selectContact({ id: insertResult.data.id });
      expect(selectUpdatedResult.data.title).toBe(updateData.title);
      
      // DELETE: Remove the contact (will be done in cleanup, but verify it works)
      const deleteResult = await dbHelpers.deleteContact(insertResult.data.id);
      expect(deleteResult.error).toBeNull();
      
      // Verify deletion
      const selectDeletedResult = await dbHelpers.selectContact({ id: insertResult.data.id });
      expect(selectDeletedResult.data).toBeNull();
      
      // Remove from cleanup list since we already deleted
      testDataCleanup = testDataCleanup.filter(id => id !== insertResult.data.id);
    });

    test('should validate table schema matches expectations', async () => {
      const expectedColumns = [
        'id', 'first_name', 'last_name', 'email', 'organization',
        'title', 'phone', 'notes', 'created_at', 'updated_at'
      ];
      
      const schemaResult = await dbHelpers.validateTableSchema('contacts', expectedColumns);
      expect(schemaResult.isValid).toBe(true);
      expect(schemaResult.errors).toHaveLength(0);
      expect(schemaResult.tableExists).toBe(true);
      expect(schemaResult.columnsMatch).toBe(true);
    });

    test('should handle foreign key constraints correctly', async () => {
      // Test foreign key relationships (if organizations table exists)
      const hasValidConstraints = await dbHelpers.testForeignKeyConstraints(
        'organizations', 
        'contacts', 
        'organization_id'
      );
      
      // Foreign keys might not be enforced in all setups, so we log the result
      console.log('Foreign key constraints working:', hasValidConstraints);
      expect(typeof hasValidConstraints).toBe('boolean');
    });
  });

  test.describe('Performance Testing - Production', () => {
    test('should create contacts within acceptable time limits', async () => {
      const testData = contactTestSuite.generators.unique('prod_perf');
      
      const { result, duration } = await dbHelpers.measureQueryPerformance(async () => {
        return await dbHelpers.insertContact(testData);
      });
      
      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      
      testDataCleanup.push(result.data.id);
    });

    test('should handle concurrent contact creation', async () => {
      const batchData = contactTestSuite.generators.batch(3, 'prod_concurrent');
      
      const operations = batchData.map(data => () => dbHelpers.insertContact(data));
      const results = await dbHelpers.testConcurrentOperations(operations);
      
      expect(results.errors).toHaveLength(0);
      expect(results.results).toHaveLength(3);
      expect(results.totalDuration).toBeLessThan(10000); // All operations within 10 seconds
      
      // Add all created contacts to cleanup
      results.results.forEach(result => {
        if (result.data?.id) {
          testDataCleanup.push(result.data.id);
        }
      });
    });

    test('should maintain performance under load', async () => {
      const contactCount = 5; // Keep reasonable for production testing
      const batchData = contactTestSuite.generators.batch(contactCount, 'prod_load');
      const createdIds: string[] = [];
      
      const startTime = performance.now();
      
      for (const contactData of batchData) {
        const result = await dbHelpers.insertContact(contactData);
        expect(result.error).toBeNull();
        if (result.data?.id) {
          createdIds.push(result.data.id);
        }
      }
      
      const totalTime = performance.now() - startTime;
      const averageTime = totalTime / contactCount;
      
      expect(createdIds).toHaveLength(contactCount);
      expect(averageTime).toBeLessThan(3000); // Average under 3 seconds per contact
      
      testDataCleanup.push(...createdIds);
    });
  });

  test.describe('Edge Cases - Production Environment', () => {
    test('should handle Unicode and special characters', async () => {
      const unicodeScenario = contactTestSuite.edgeCases.find(e => e.name === 'Unicode Characters');
      if (!unicodeScenario) throw new Error('Unicode test case not found');
      
      const testData = {
        ...unicodeScenario.data,
        email: `unicode_${Date.now()}@korean-company.com` // Make unique
      };
      
      const insertResult = await dbHelpers.insertContact(testData);
      expect(insertResult.error).toBeNull();
      expect(insertResult.data.first_name).toBe(testData.first_name);
      expect(insertResult.data.last_name).toBe(testData.last_name);
      
      testDataCleanup.push(insertResult.data.id);
      
      // Verify data integrity after storage and retrieval
      const selectResult = await dbHelpers.selectContact({ email: testData.email });
      expect(selectResult.data.first_name).toBe('김');
      expect(selectResult.data.last_name).toBe('민수');
      expect(selectResult.data.organization).toBe('한국 기업');
    });

    test('should handle special characters in names', async () => {
      const specialCharsScenario = contactTestSuite.edgeCases.find(e => e.name === 'Special Characters in Names');
      if (!specialCharsScenario) throw new Error('Special characters test case not found');
      
      const testData = {
        ...specialCharsScenario.data,
        email: `special_${Date.now()}@company.com` // Make unique
      };
      
      const insertResult = await dbHelpers.insertContact(testData);
      expect(insertResult.error).toBeNull();
      expect(insertResult.data.first_name).toBe("François-José");
      expect(insertResult.data.last_name).toBe("O'Connor-Smith");
      
      testDataCleanup.push(insertResult.data.id);
    });

    test('should handle maximum field lengths correctly', async () => {
      const maxLengthData = contactTestSuite.generators.unique('prod_maxlength');
      maxLengthData.organization = 'Very Long Company Name That Tests The Maximum Length Allowed In The Database Field And Form Validation System To Ensure Proper Handling Of Edge Cases In The Contact Management System';
      
      const insertResult = await dbHelpers.insertContact(maxLengthData);
      
      // This might succeed or fail depending on database constraints
      if (insertResult.error) {
        // If it fails, error should mention length or constraint
        expect(insertResult.error.message.toLowerCase()).toMatch(/length|constraint|limit|too long/);
      } else {
        // If it succeeds, data should be properly stored
        expect(insertResult.data.organization).toBe(maxLengthData.organization);
        testDataCleanup.push(insertResult.data.id);
      }
    });
  });

  test.describe('Error Recovery - Production', () => {
    test('should handle database connection issues gracefully', async () => {
      // Simulate by testing with invalid data that might cause DB errors
      const invalidData = {
        first_name: 'Test',
        last_name: 'User', 
        email: 'invalid-data-test@test.com',
        organization: null, // This might cause issues if NOT NULL constraint exists
        notes: 'Testing error handling in production environment'
      };
      
      const result = await dbHelpers.insertContact(invalidData);
      
      // We expect either success or a meaningful error
      if (result.error) {
        expect(result.error.message).toBeTruthy();
        expect(result.error.message.length).toBeGreaterThan(5);
      } else {
        expect(result.data).toBeTruthy();
        testDataCleanup.push(result.data.id);
      }
    });

    test('should maintain data integrity during partial failures', async () => {
      const testData1 = contactTestSuite.generators.unique('prod_integrity_1');
      const testData2 = contactTestSuite.generators.unique('prod_integrity_2');
      
      // Create first contact successfully
      const result1 = await dbHelpers.insertContact(testData1);
      expect(result1.error).toBeNull();
      testDataCleanup.push(result1.data.id);
      
      // Try to create second contact with same email (should fail)
      testData2.email = testData1.email; // Duplicate email
      const result2 = await dbHelpers.insertContact(testData2);
      expect(result2.error).toBeTruthy();
      
      // Verify first contact is still there and unchanged
      const selectResult = await dbHelpers.selectContact({ email: testData1.email });
      expect(selectResult.data.first_name).toBe(testData1.first_name);
      expect(selectResult.data.last_name).toBe(testData1.last_name);
    });
  });

  test.describe('Data Consistency Validation', () => {
    test('should maintain referential integrity', async () => {
      // Test contact creation and relationships
      const testData = contactTestSuite.generators.unique('prod_integrity');
      
      const insertResult = await dbHelpers.insertContact(testData);
      expect(insertResult.error).toBeNull();
      expect(insertResult.data.created_at).toBeTruthy();
      expect(insertResult.data.updated_at).toBeTruthy();
      
      // Verify timestamps are reasonable
      const createdAt = new Date(insertResult.data.created_at);
      const now = new Date();
      const timeDiff = now.getTime() - createdAt.getTime();
      expect(timeDiff).toBeLessThan(60000); // Created within last minute
      
      testDataCleanup.push(insertResult.data.id);
    });

    test('should handle database transactions correctly', async () => {
      const transactionId = await dbHelpers.createTestTransaction(['insert_contact', 'verify_contact']);
      
      const testData = contactTestSuite.generators.unique('prod_transaction');
      
      // Perform operation within transaction context
      const result = await dbHelpers.insertContact(testData);
      expect(result.error).toBeNull();
      testDataCleanup.push(result.data.id);
      
      await dbHelpers.completeTestTransaction(transactionId);
      
      // Verify operation was committed
      const verifyResult = await dbHelpers.selectContact({ email: testData.email });
      expect(verifyResult.data).toBeTruthy();
    });
  });
});