/**
 * Global Setup for Production Environment Testing
 * 
 * Prepares the real Supabase database environment and ensures
 * proper test isolation and data consistency for production testing.
 */

import { chromium, FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('🔧 Setting up Production Environment for Real Database Testing...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Validate environment variables
    const supabaseUrl = process.env.VITE_TEST_SUPABASE_URL;
    const supabaseKey = process.env.VITE_TEST_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.VITE_TEST_SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Production testing requires VITE_TEST_SUPABASE_URL and VITE_TEST_SUPABASE_ANON_KEY environment variables'
      );
    }

    console.log('🔑 Environment variables validated');

    // Initialize Supabase client for setup
    const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);

    // Test database connection
    console.log('📡 Testing database connection...');
    const { data, error } = await supabase
      .from('contacts')
      .select('count', { count: 'exact', head: true });

    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }

    console.log('✅ Database connection established successfully');

    // Create test data isolation schema
    console.log('🗄️ Setting up test data isolation...');
    
    // Create test session identifier
    const testSessionId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Clean up any existing test data (older than 1 hour)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // Clean old test contacts
    await supabase
      .from('contacts')
      .delete()
      .ilike('first_name', 'test_%')
      .lt('created_at', oneHourAgo.toISOString());

    // Clean old test opportunities  
    await supabase
      .from('opportunities')
      .delete()
      .ilike('name', 'test_%')
      .lt('created_at', oneHourAgo.toISOString());

    // Clean old test organizations
    await supabase
      .from('organizations')
      .delete()
      .ilike('name', 'test_%')
      .lt('created_at', oneHourAgo.toISOString());

    console.log('🗑️ Cleaned up old test data');

    // Validate database schema
    console.log('📋 Validating database schema...');
    
    // Check required tables exist
    const requiredTables = ['contacts', 'opportunities', 'organizations', 'products'];
    for (const table of requiredTables) {
      const { error: tableError } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (tableError) {
        throw new Error(`Required table '${table}' not accessible: ${tableError.message}`);
      }
    }

    console.log('✅ Database schema validated');

    // Wait for production server to be ready
    console.log('📡 Waiting for production server...');
    const prodServerUrl = 'http://localhost:3001';
    
    let retries = 60; // More retries for production build
    while (retries > 0) {
      try {
        await page.goto(prodServerUrl, { timeout: 10000 });
        const title = await page.title();
        if (title) {
          console.log(`✅ Production server is ready (${title})`);
          break;
        }
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw new Error(`Production server not ready after 60 attempts: ${error}`);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Initialize production environment in browser
    await page.addInitScript((config) => {
      if (typeof window !== 'undefined') {
        (window as any).__TEST_ENVIRONMENT__ = 'production';
        (window as any).__MOCK_MODE__ = false;
        (window as any).__SUPABASE_CONFIG__ = {
          url: config.supabaseUrl,
          key: config.supabaseKey
        };
        (window as any).__TEST_SESSION_ID__ = config.testSessionId;
      }
    }, { supabaseUrl, supabaseKey, testSessionId });

    // Test basic form loading
    await page.goto(`${prodServerUrl}/contacts/new`);
    await page.waitForSelector('form', { timeout: 15000 });
    console.log('✅ Contact form loads correctly in production mode');

    await page.goto(`${prodServerUrl}/opportunities/new`);
    await page.waitForSelector('form', { timeout: 15000 });
    console.log('✅ Opportunity form loads correctly in production mode');

    // Create test data directory for production tests
    const fs = require('fs').promises;
    const testDataDir = path.join(process.cwd(), 'test-results', 'prod');
    
    try {
      await fs.access(testDataDir);
    } catch {
      await fs.mkdir(testDataDir, { recursive: true });
      console.log('📁 Created test data directory for production tests');
    }

    // Write environment status file
    const statusFile = path.join(testDataDir, 'environment-status.json');
    await fs.writeFile(statusFile, JSON.stringify({
      environment: 'production',
      mockMode: false,
      serverUrl: prodServerUrl,
      databaseUrl: supabaseUrl,
      testSessionId,
      timestamp: new Date().toISOString(),
      status: 'ready'
    }, null, 2));

    console.log('🎯 Production environment setup complete!');

  } catch (error) {
    console.error('❌ Production environment setup failed:', error);
    throw error;
  } finally {
    await page.close();
    await browser.close();
  }
}

export default globalSetup;