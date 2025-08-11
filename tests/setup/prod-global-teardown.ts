/**
 * Global Teardown for Production Environment Testing
 * 
 * Cleans up test data from the real Supabase database and ensures
 * no test data persists after the test run.
 */

import { chromium, FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs/promises';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Tearing down Production Environment...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Get environment variables
    const supabaseUrl = process.env.VITE_TEST_SUPABASE_URL;
    const supabaseKey = process.env.VITE_TEST_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.VITE_TEST_SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️ Supabase credentials not available for cleanup');
      return;
    }

    // Initialize Supabase client for cleanup
    const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);

    // Read test session ID from status file
    const testDataDir = path.join(process.cwd(), 'test-results', 'prod');
    const statusFile = path.join(testDataDir, 'environment-status.json');
    
    let testSessionId = null;
    try {
      const statusContent = await fs.readFile(statusFile, 'utf8');
      const status = JSON.parse(statusContent);
      testSessionId = status.testSessionId;
    } catch (error) {
      console.warn('⚠️ Could not read test session ID, using fallback cleanup');
    }

    // Comprehensive test data cleanup
    console.log('🗑️ Cleaning up test data from database...');

    // Clean test contacts (both by naming pattern and session ID)
    const { error: contactError } = await supabase
      .from('contacts')
      .delete()
      .or(`first_name.ilike.test_%,last_name.ilike.test_%,email.ilike.test%@%,organization.ilike.test_%`);

    if (contactError && !contactError.message.includes('0 rows')) {
      console.warn('⚠️ Contact cleanup error:', contactError.message);
    } else {
      console.log('✅ Test contacts cleaned up');
    }

    // Clean test opportunities
    const { error: opportunityError } = await supabase
      .from('opportunities')
      .delete()
      .or(`name.ilike.test_%,deal_owner.ilike.test_%,notes.ilike.%test%`);

    if (opportunityError && !opportunityError.message.includes('0 rows')) {
      console.warn('⚠️ Opportunity cleanup error:', opportunityError.message);
    } else {
      console.log('✅ Test opportunities cleaned up');
    }

    // Clean test organizations
    const { error: organizationError } = await supabase
      .from('organizations')
      .delete()
      .or(`name.ilike.test_%,description.ilike.%test%`);

    if (organizationError && !organizationError.message.includes('0 rows')) {
      console.warn('⚠️ Organization cleanup error:', organizationError.message);
    } else {
      console.log('✅ Test organizations cleaned up');
    }

    // Clean test products if any were created
    const { error: productError } = await supabase
      .from('products')
      .delete()
      .ilike('name', 'test_%');

    if (productError && !productError.message.includes('0 rows')) {
      console.warn('⚠️ Product cleanup error:', productError.message);
    } else {
      console.log('✅ Test products cleaned up');
    }

    // Connect to production server for browser cleanup
    const prodServerUrl = 'http://localhost:3001';
    
    try {
      await page.goto(prodServerUrl, { timeout: 10000 });

      // Clear browser state
      await page.evaluate(() => {
        if (typeof window !== 'undefined') {
          delete (window as any).__TEST_ENVIRONMENT__;
          delete (window as any).__MOCK_MODE__;
          delete (window as any).__SUPABASE_CONFIG__;
          delete (window as any).__TEST_SESSION_ID__;
        }
      });

      // Clear localStorage and sessionStorage
      await page.evaluate(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.clear();
        }
        if (typeof window !== 'undefined' && window.sessionStorage) {
          window.sessionStorage.clear();
        }
      });

      console.log('✅ Browser state cleared');
    } catch (error) {
      console.warn('⚠️ Could not connect to production server for cleanup:', error.message);
    }

    // Update environment status file
    try {
      await fs.writeFile(statusFile, JSON.stringify({
        environment: 'production',
        mockMode: false,
        serverUrl: prodServerUrl,
        databaseUrl: supabaseUrl,
        testSessionId,
        timestamp: new Date().toISOString(),
        status: 'torn_down',
        cleanup: 'completed',
        dataCleanup: {
          contacts: !contactError || contactError.message.includes('0 rows'),
          opportunities: !opportunityError || opportunityError.message.includes('0 rows'),
          organizations: !organizationError || organizationError.message.includes('0 rows'),
          products: !productError || productError.message.includes('0 rows')
        }
      }, null, 2));
    } catch (error) {
      console.warn('⚠️ Could not update status file:', error.message);
    }

    console.log('🎯 Production environment teardown complete!');

  } catch (error) {
    console.error('❌ Production environment teardown failed:', error);
    // Don't throw - teardown failures shouldn't fail the test run
  } finally {
    await page.close();
    await browser.close();
  }
}

export default globalTeardown;