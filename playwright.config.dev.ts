import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Development Environment (MCP Mock Testing)
 * 
 * This configuration is optimized for testing against the MCP mock system
 * which uses MockQueryBuilder to simulate database operations without
 * requiring a real Supabase connection.
 * 
 * Key Features:
 * - Uses MCP mock responses for database operations
 * - Faster test execution without network calls
 * - Isolated test environment with predictable data
 * - Comprehensive form validation testing
 */

export default defineConfig({
  testDir: './tests/dual-environment',
  testMatch: ['**/*.dev.spec.ts', '**/*-dev.spec.ts'],
  outputDir: './test-results/dev',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['html', { outputFolder: './playwright-report/dev' }],
    ['json', { outputFile: './test-results/dev/results.json' }],
    ['junit', { outputFile: './test-results/dev/results.xml' }]
  ],
  
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Environment-specific headers for dev testing
    extraHTTPHeaders: {
      'X-Test-Environment': 'development',
      'X-Test-Mode': 'mcp-mock',
      'X-Mock-Database': 'true'
    }
  },

  // Test timeout configuration for mock environment
  timeout: 30000,
  expect: {
    timeout: 10000,
  },

  projects: [
    {
      name: 'dev-chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        // Dev-specific context options
        contextOptions: {
          // Disable web security for easier mocking
          ignoreHTTPSErrors: true,
        }
      },
    },
    {
      name: 'dev-firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 }
      },
    },
    {
      name: 'dev-webkit', 
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 }
      },
    },
    {
      name: 'dev-mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        hasTouch: true
      },
    },
    {
      name: 'dev-mobile-safari',
      use: { 
        ...devices['iPhone 13'],
        hasTouch: true
      },
    }
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    // Environment variables for dev testing
    env: {
      NODE_ENV: 'test',
      DEV: 'true',
      VITE_TEST_MODE: 'true',
      MCP_ENABLED: 'true',
      VITE_SUPABASE_URL: 'mock://localhost',
      VITE_SUPABASE_ANON_KEY: 'mock-anon-key',
      // Enable MCP mock mode
      PLAYWRIGHT_TEST: 'true',
      TEST_ENVIRONMENT: 'development'
    },
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe'
  },

  // Global setup and teardown for dev environment
  globalSetup: './tests/setup/dev-global-setup.ts',
  globalTeardown: './tests/setup/dev-global-teardown.ts',
});