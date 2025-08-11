import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Production Environment (Real Supabase Testing)
 * 
 * This configuration tests against a real Supabase database instance
 * to validate actual SQL queries, database constraints, and data persistence.
 * 
 * Key Features:
 * - Tests against real Supabase PostgreSQL database
 * - Validates SQL query compatibility and performance
 * - Tests database constraints and triggers
 * - Verifies data persistence and integrity
 * - Schema compliance validation
 * 
 * IMPORTANT: Uses a dedicated test database to prevent production data corruption
 */

export default defineConfig({
  testDir: './tests/dual-environment',
  testMatch: ['**/*.prod.spec.ts', '**/*-prod.spec.ts'],
  outputDir: './test-results/prod',
  fullyParallel: false, // Sequential for database integrity
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, // Less retries for prod to catch real issues
  workers: 1, // Single worker to avoid database conflicts
  reporter: [
    ['html', { outputFolder: './playwright-report/prod' }],
    ['json', { outputFile: './test-results/prod/results.json' }],
    ['junit', { outputFile: './test-results/prod/results.xml' }]
  ],
  
  use: {
    baseURL: 'http://localhost:3001', // Different port for prod testing
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Environment-specific headers for production testing
    extraHTTPHeaders: {
      'X-Test-Environment': 'production',
      'X-Test-Mode': 'real-database',
      'X-Mock-Database': 'false'
    }
  },

  // Extended timeouts for real database operations
  timeout: 60000,
  expect: {
    timeout: 15000,
  },

  projects: [
    {
      name: 'prod-chromium-primary',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        // Production-specific context options
        contextOptions: {
          // Strict security for production testing
          ignoreHTTPSErrors: false,
        }
      },
    },
    // Reduced browser matrix for production to focus on core functionality
    {
      name: 'prod-mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        hasTouch: true
      },
    }
  ],

  webServer: {
    command: 'npm run preview', // Use production build
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    // Environment variables for production testing
    env: {
      NODE_ENV: 'production',
      VITE_TEST_MODE: 'production',
      MCP_ENABLED: 'false',
      // Real Supabase credentials (test database)
      VITE_SUPABASE_URL: process.env.VITE_TEST_SUPABASE_URL || '',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_TEST_SUPABASE_ANON_KEY || '',
      VITE_SUPABASE_SERVICE_KEY: process.env.VITE_TEST_SUPABASE_SERVICE_KEY || '',
      // Test database identification
      TEST_ENVIRONMENT: 'production',
      DATABASE_NAME: 'test_database',
      // Enable database validation
      VALIDATE_SCHEMA: 'true',
      VALIDATE_QUERIES: 'true'
    },
    timeout: 180 * 1000, // Longer timeout for production build
    stdout: 'pipe',
    stderr: 'pipe'
  },

  // Global setup and teardown for production environment
  globalSetup: './tests/setup/prod-global-setup.ts',
  globalTeardown: './tests/setup/prod-global-teardown.ts',
});