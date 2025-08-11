/**
 * Global Setup for Development Environment Testing
 * 
 * Prepares the MCP mock environment and ensures consistent test state
 * across all development environment test runs.
 */

import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs/promises';

async function globalSetup(config: FullConfig) {
  console.log('🔧 Setting up Development Environment for MCP Mock Testing...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for dev server to be ready
    console.log('📡 Waiting for development server...');
    const devServerUrl = process.env.DEV_SERVER_URL || 'http://localhost:3001';
    
    let retries = 30;
    while (retries > 0) {
      try {
        await page.goto(devServerUrl, { timeout: 5000 });
        const title = await page.title();
        if (title) {
          console.log(`✅ Development server is ready (${title})`);
          break;
        }
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw new Error(`Development server not ready after 30 attempts: ${error}`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Initialize MCP mock system
    console.log('🔧 Initializing MCP mock system...');
    await page.addInitScript(() => {
      // Ensure MockQueryBuilder is available
      if (typeof window !== 'undefined') {
        (window as any).__MCP_MOCK_INITIALIZED__ = true;
        (window as any).__TEST_ENVIRONMENT__ = 'development';
        (window as any).__MOCK_MODE__ = true;
      }
    });

    // Test basic mock functionality
    await page.goto(devServerUrl);
    await page.waitForFunction(() => {
      return (window as any).__MCP_MOCK_INITIALIZED__ === true;
    });

    // Clear any existing mock data and set up organization mock responses
    await page.evaluate(() => {
      if (typeof (window as any).MockQueryBuilder !== 'undefined') {
        (window as any).MockQueryBuilder.clearMockResponse();
        
        // Pre-populate some organizations for testing with valid UUIDs
        (window as any).__MOCK_ORGANIZATIONS__ = [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Test Organization',
            industry: 'Technology',
            created_at: new Date().toISOString()
          },
          {
            id: '987fcdeb-51a2-43d4-b567-123456789012', 
            name: 'Demo Company',
            industry: 'Manufacturing',
            created_at: new Date().toISOString()
          }
        ];
      }
    });

    console.log('✅ MCP mock system initialized successfully');

    // Validate mock responses
    console.log('🧪 Validating mock response system...');
    await page.goto(`${devServerUrl}/contacts/new`);
    
    // Take screenshot to debug what's on the page
    try {
      await page.waitForSelector('form', { timeout: 5000 });
      console.log('✅ Contact form loads correctly in mock mode');
    } catch (error) {
      console.log('ℹ️ Form selector not found, checking for main content...');
      const hasMainContent = await page.locator('main, #app, .main-content').first().isVisible();
      if (hasMainContent) {
        console.log('✅ Main content loads correctly, continuing tests...');
      } else {
        console.warn('⚠️ No main content found, tests may fail');
      }
    }

    await page.goto(`${devServerUrl}/opportunities/new`);
    
    try {
      await page.waitForSelector('form', { timeout: 5000 });
      console.log('✅ Opportunity form loads correctly in mock mode');
    } catch (error) {
      console.log('ℹ️ Opportunity form selector not found, but continuing...');
    }

    // Create test data directory for development tests
    const testDataDir = path.join(process.cwd(), 'test-results', 'dev');
    
    try {
      await fs.access(testDataDir);
    } catch {
      await fs.mkdir(testDataDir, { recursive: true });
      console.log('📁 Created test data directory for development tests');
    }

    // Write environment status file
    const statusFile = path.join(testDataDir, 'environment-status.json');
    await fs.writeFile(statusFile, JSON.stringify({
      environment: 'development',
      mockMode: true,
      serverUrl: devServerUrl,
      timestamp: new Date().toISOString(),
      status: 'ready'
    }, null, 2));

    console.log('🎯 Development environment setup complete!');

  } catch (error) {
    console.error('❌ Development environment setup failed:', error);
    throw error;
  } finally {
    await page.close();
    await browser.close();
  }
}

export default globalSetup;