import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  outputDir: './screenshots',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'desktop-chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },
    {
      name: 'tablet',
      use: { 
        ...devices['iPad'],
        viewport: { width: 768, height: 1024 },
        hasTouch: true
      },
    },
    {
      name: 'iPhone 12',
      use: { 
        ...devices['iPhone 12'],
        viewport: { width: 375, height: 667 },
        hasTouch: true
      },
    },
    // Mobile device projects for performance testing
    {
      name: 'iPhone 14',
      use: { 
        ...devices['iPhone 14'],
        hasTouch: true
      },
    },
    {
      name: 'iPhone 14 Pro Max',
      use: { 
        ...devices['iPhone 14 Pro Max'],
        hasTouch: true
      },
    },
    {
      name: 'Samsung Galaxy S22',
      use: { 
        ...devices['Galaxy S9+'], // Using closest available Samsung device
        hasTouch: true
      },
    },
    {
      name: 'Samsung Galaxy A53',
      use: { 
        ...devices['Galaxy S9+'], // Using closest available Samsung device
        hasTouch: true
      },
    },
    {
      name: 'Pixel 7',
      use: { 
        ...devices['Pixel 5'], // Using closest available Pixel device
        hasTouch: true
      },
    },
    // Network-specific projects for performance testing
    {
      name: 'iPhone 14 3G',
      use: { 
        ...devices['iPhone 14'],
        hasTouch: true,
        // Network throttling will be handled in tests
      },
    },
    {
      name: 'iPhone 14 4G',
      use: { 
        ...devices['iPhone 14'],
        hasTouch: true,
        // Network throttling will be handled in tests
      },
    },
    {
      name: 'iPhone 14 5G',
      use: { 
        ...devices['iPhone 14'],
        hasTouch: true,
        // Network throttling will be handled in tests
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});