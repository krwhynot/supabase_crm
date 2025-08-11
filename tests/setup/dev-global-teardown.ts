/**
 * Global Teardown for Development Environment Testing
 * 
 * Cleans up the MCP mock environment and ensures no test data
 * persists between test runs.
 */

import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs/promises';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Tearing down Development Environment...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    const devServerUrl = process.env.DEV_SERVER_URL || 'http://localhost:3001';
    
    // Connect to development server for cleanup
    await page.goto(devServerUrl);

    // Clear all mock data
    console.log('🗑️ Clearing mock data...');
    await page.evaluate(() => {
      if (typeof (window as any).MockQueryBuilder !== 'undefined') {
        (window as any).MockQueryBuilder.clearMockResponse();
      }
      
      // Clear any other test-related global state
      if (typeof window !== 'undefined') {
        delete (window as any).__MCP_MOCK_INITIALIZED__;
        delete (window as any).__TEST_ENVIRONMENT__;
        delete (window as any).__MOCK_MODE__;
        delete (window as any).__TEST_DATA__;
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

    console.log('✅ Mock data cleared successfully');

    // Update environment status file
    const testDataDir = path.join(process.cwd(), 'test-results', 'dev');
    const statusFile = path.join(testDataDir, 'environment-status.json');
    
    try {
      await fs.writeFile(statusFile, JSON.stringify({
        environment: 'development',
        mockMode: true,
        serverUrl: devServerUrl,
        timestamp: new Date().toISOString(),
        status: 'torn_down',
        cleanup: 'completed'
      }, null, 2));
    } catch (error) {
      console.warn('⚠️ Could not update status file:', error.message);
    }

    console.log('🎯 Development environment teardown complete!');

  } catch (error) {
    console.error('❌ Development environment teardown failed:', error);
    // Don't throw - teardown failures shouldn't fail the test run
  } finally {
    await page.close();
    await browser.close();
  }
}

export default globalTeardown;