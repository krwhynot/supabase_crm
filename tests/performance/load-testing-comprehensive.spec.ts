import { test, expect, chromium, Browser, BrowserContext, Page } from '@playwright/test';

test.describe('Comprehensive Load Testing', () => {
  test.setTimeout(120000); // 2 minutes for load tests

  const LOAD_TEST_CONFIG = {
    CONCURRENT_USERS: 5,           // Simulate 5 concurrent users
    RAMP_UP_TIME: 10000,          // 10 seconds ramp-up
    TEST_DURATION: 30000,         // 30 seconds sustained load
    MAX_RESPONSE_TIME: 2000,      // 2 seconds max response time
    ERROR_THRESHOLD: 0.05,        // 5% error rate threshold
    MEMORY_THRESHOLD: 100 * 1024 * 1024, // 100MB memory threshold
  };

  interface LoadTestMetrics {
    userId: number;
    timestamp: number;
    action: string;
    url: string;
    responseTime: number;
    status: number;
    error?: string;
    memoryUsage?: number;
  }

  let loadTestMetrics: LoadTestMetrics[] = [];
  let browsers: Browser[] = [];
  let contexts: BrowserContext[] = [];

  test.beforeAll(async () => {
    // Initialize browsers for concurrent testing
    for (let i = 0; i < LOAD_TEST_CONFIG.CONCURRENT_USERS; i++) {
      const browser = await chromium.launch({ headless: true });
      browsers.push(browser);
    }
  });

  test.afterAll(async () => {
    // Clean up browsers
    await Promise.all(browsers.map(browser => browser.close()));
    
    // Generate comprehensive load test report
    generateLoadTestReport(loadTestMetrics);
  });

  test('Load Test - Dashboard Performance Under Concurrent Users', async () => {
    loadTestMetrics = [];
    
    // Create browser contexts for each user
    for (const browser of browsers) {
      const context = await browser.newContext();
      contexts.push(context);
    }

    const userTasks: Promise<void>[] = [];

    // Simulate concurrent users
    for (let userId = 0; userId < LOAD_TEST_CONFIG.CONCURRENT_USERS; userId++) {
      const userTask = simulateUser(contexts[userId], userId, 'dashboard');
      userTasks.push(userTask);
      
      // Stagger user entry (ramp-up)
      await new Promise(resolve => setTimeout(resolve, LOAD_TEST_CONFIG.RAMP_UP_TIME / LOAD_TEST_CONFIG.CONCURRENT_USERS));
    }

    // Wait for all users to complete their tasks
    await Promise.all(userTasks);

    // Analyze results
    const metrics = analyzeLoadTestResults(loadTestMetrics);
    
    // Performance assertions
    expect(metrics.averageResponseTime).toBeLessThan(LOAD_TEST_CONFIG.MAX_RESPONSE_TIME);
    expect(metrics.errorRate).toBeLessThan(LOAD_TEST_CONFIG.ERROR_THRESHOLD);
    expect(metrics.p95ResponseTime).toBeLessThan(LOAD_TEST_CONFIG.MAX_RESPONSE_TIME * 1.5);

    console.log('Dashboard Load Test Results:', metrics);
  });

  test('Load Test - Contacts CRUD Operations Under Load', async () => {
    loadTestMetrics = [];
    
    const userTasks: Promise<void>[] = [];

    // Create fresh contexts if needed
    if (contexts.length === 0) {
      for (const browser of browsers) {
        const context = await browser.newContext();
        contexts.push(context);
      }
    }

    // Simulate concurrent CRUD operations
    for (let userId = 0; userId < LOAD_TEST_CONFIG.CONCURRENT_USERS; userId++) {
      const userTask = simulateUser(contexts[userId], userId, 'contacts_crud');
      userTasks.push(userTask);
      
      // Stagger operations
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    await Promise.all(userTasks);

    const metrics = analyzeLoadTestResults(loadTestMetrics);
    
    // CRUD operations can be slower, but should still be reasonable
    expect(metrics.averageResponseTime).toBeLessThan(LOAD_TEST_CONFIG.MAX_RESPONSE_TIME * 1.5);
    expect(metrics.errorRate).toBeLessThan(LOAD_TEST_CONFIG.ERROR_THRESHOLD);

    console.log('Contacts CRUD Load Test Results:', metrics);
  });

  test('Load Test - Database Connection Pool Performance', async () => {
    loadTestMetrics = [];
    
    // Test database connection handling under concurrent load
    const dbTasks: Promise<void>[] = [];

    for (let userId = 0; userId < LOAD_TEST_CONFIG.CONCURRENT_USERS * 2; userId++) {
      const context = await browsers[userId % browsers.length].newContext();
      const task = simulateUser(context, userId, 'database_intensive');
      dbTasks.push(task);
    }

    const startTime = Date.now();
    await Promise.all(dbTasks);
    const totalTime = Date.now() - startTime;

    const metrics = analyzeLoadTestResults(loadTestMetrics);
    
    // Database operations should complete in reasonable time even under heavy load
    expect(totalTime).toBeLessThan(60000); // 60 seconds max
    expect(metrics.errorRate).toBeLessThan(LOAD_TEST_CONFIG.ERROR_THRESHOLD * 2); // Allow slightly higher error rate for DB stress

    console.log('Database Connection Pool Test Results:', metrics);
    console.log(`Total Test Duration: ${totalTime}ms`);
  });

  test('Load Test - Memory Leak Detection', async () => {
    loadTestMetrics = [];
    
    const memoryMeasurements: number[] = [];
    const context = await browsers[0].newContext();
    const page = await context.newPage();

    // Perform repeated operations to detect memory leaks
    for (let i = 0; i < 20; i++) {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Navigate through different pages
      const pages = ['/contacts', '/organizations', '/opportunities', '/principals'];
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
        
        // Measure memory usage
        const memoryUsage = await page.evaluate(() => {
          return (performance as any).memory?.usedJSHeapSize || 0;
        });
        
        if (memoryUsage > 0) {
          memoryMeasurements.push(memoryUsage);
          
          loadTestMetrics.push({
            userId: 0,
            timestamp: Date.now(),
            action: 'memory_check',
            url: pagePath,
            responseTime: 0,
            status: 200,
            memoryUsage
          });
        }
      }

      // Force garbage collection if available
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });
    }

    await context.close();

    // Analyze memory usage
    if (memoryMeasurements.length > 0) {
      const firstMeasurement = memoryMeasurements[0];
      const lastMeasurement = memoryMeasurements[memoryMeasurements.length - 1];
      const memoryGrowth = lastMeasurement - firstMeasurement;
      const averageMemory = memoryMeasurements.reduce((sum, val) => sum + val, 0) / memoryMeasurements.length;

      console.log(`Memory Usage - Initial: ${(firstMeasurement / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Memory Usage - Final: ${(lastMeasurement / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Memory Growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Average Memory: ${(averageMemory / 1024 / 1024).toFixed(2)}MB`);

      // Memory leak detection: growth shouldn't exceed 50MB over 20 iterations
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);
      expect(averageMemory).toBeLessThan(LOAD_TEST_CONFIG.MEMORY_THRESHOLD);
    }
  });

  test('Load Test - Real-time Features Performance', async () => {
    loadTestMetrics = [];
    
    // Test Supabase real-time subscriptions under load
    const realtimeTasks: Promise<void>[] = [];

    for (let userId = 0; userId < LOAD_TEST_CONFIG.CONCURRENT_USERS; userId++) {
      const context = await browsers[userId % browsers.length].newContext();
      const task = simulateUser(context, userId, 'realtime');
      realtimeTasks.push(task);
    }

    await Promise.all(realtimeTasks);

    const metrics = analyzeLoadTestResults(loadTestMetrics);
    
    // Real-time features should maintain good performance
    expect(metrics.averageResponseTime).toBeLessThan(LOAD_TEST_CONFIG.MAX_RESPONSE_TIME);
    expect(metrics.errorRate).toBeLessThan(LOAD_TEST_CONFIG.ERROR_THRESHOLD);

    console.log('Real-time Features Load Test Results:', metrics);
  });

  async function simulateUser(context: BrowserContext, userId: number, scenario: string): Promise<void> {
    const page = await context.newPage();
    const startTime = Date.now();

    try {
      switch (scenario) {
        case 'dashboard':
          await simulateDashboardUser(page, userId);
          break;
        case 'contacts_crud':
          await simulateContactsCRUDUser(page, userId);
          break;
        case 'database_intensive':
          await simulateDatabaseIntensiveUser(page, userId);
          break;
        case 'realtime':
          await simulateRealtimeUser(page, userId);
          break;
        default:
          await simulateBasicUser(page, userId);
      }
    } catch (error) {
      loadTestMetrics.push({
        userId,
        timestamp: Date.now(),
        action: scenario,
        url: page.url(),
        responseTime: Date.now() - startTime,
        status: 500,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      await context.close();
    }
  }

  async function simulateDashboardUser(page: Page, userId: number): Promise<void> {
    const actions = [
      () => page.goto('/'),
      () => page.click('nav a[href="/contacts"]'),
      () => page.click('nav a[href="/organizations"]'),
      () => page.click('nav a[href="/opportunities"]'),
      () => page.goto('/'),
    ];

    for (const action of actions) {
      const startTime = Date.now();
      try {
        await action();
        await page.waitForLoadState('networkidle');
        const responseTime = Date.now() - startTime;
        
        loadTestMetrics.push({
          userId,
          timestamp: Date.now(),
          action: 'navigate',
          url: page.url(),
          responseTime,
          status: 200
        });
      } catch (error) {
        loadTestMetrics.push({
          userId,
          timestamp: Date.now(),
          action: 'navigate',
          url: page.url(),
          responseTime: Date.now() - startTime,
          status: 500,
          error: error instanceof Error ? error.message : 'Navigation failed'
        });
      }

      // Simulate user think time
      await page.waitForTimeout(Math.random() * 1000 + 500);
    }
  }

  async function simulateContactsCRUDUser(page: Page, userId: number): Promise<void> {
    const actions = [
      // Read
      async () => {
        await page.goto('/contacts');
        await page.waitForSelector('[data-testid="contacts-table"], .contact-card, .contacts-list');
      },
      // Create (navigate to form)
      async () => {
        await page.click('a[href="/contacts/new"], button[data-testid="add-contact"]');
        await page.waitForLoadState('networkidle');
      },
      // Simulate form interaction
      async () => {
        const nameInput = await page.$('[data-testid="first-name"], input[name="firstName"]');
        if (nameInput) {
          await nameInput.fill(`Test User ${userId}`);
        }
      }
    ];

    for (let i = 0; i < actions.length; i++) {
      const startTime = Date.now();
      try {
        await actions[i]();
        const responseTime = Date.now() - startTime;
        
        loadTestMetrics.push({
          userId,
          timestamp: Date.now(),
          action: `contacts_crud_${i}`,
          url: page.url(),
          responseTime,
          status: 200
        });
      } catch (error) {
        loadTestMetrics.push({
          userId,
          timestamp: Date.now(),
          action: `contacts_crud_${i}`,
          url: page.url(),
          responseTime: Date.now() - startTime,
          status: 500,
          error: error instanceof Error ? error.message : 'CRUD operation failed'
        });
      }

      await page.waitForTimeout(500);
    }
  }

  async function simulateDatabaseIntensiveUser(page: Page, userId: number): Promise<void> {
    // Simulate heavy database operations
    const pages = ['/contacts', '/organizations', '/opportunities', '/principals', '/products'];
    
    for (let i = 0; i < 3; i++) { // 3 rounds of intensive operations
      for (const pagePath of pages) {
        const startTime = Date.now();
        try {
          await page.goto(pagePath);
          await page.waitForLoadState('networkidle');
          
          // Simulate search operations that trigger database queries
          const searchInput = await page.$('input[placeholder*="Search"], [data-testid="search-input"]');
          if (searchInput) {
            await searchInput.fill(`search${userId}${i}`);
            await page.waitForTimeout(300);
            await searchInput.clear();
          }

          const responseTime = Date.now() - startTime;
          loadTestMetrics.push({
            userId,
            timestamp: Date.now(),
            action: 'db_intensive',
            url: pagePath,
            responseTime,
            status: 200
          });
        } catch (error) {
          loadTestMetrics.push({
            userId,
            timestamp: Date.now(),
            action: 'db_intensive',
            url: pagePath,
            responseTime: Date.now() - startTime,
            status: 500,
            error: error instanceof Error ? error.message : 'DB operation failed'
          });
        }

        await page.waitForTimeout(200);
      }
    }
  }

  async function simulateRealtimeUser(page: Page, userId: number): Promise<void> {
    const startTime = Date.now();
    try {
      await page.goto('/');
      
      // Keep the page open to test real-time subscriptions
      await page.waitForTimeout(LOAD_TEST_CONFIG.TEST_DURATION / 2);
      
      // Navigate to different pages while maintaining subscriptions
      await page.goto('/contacts');
      await page.waitForTimeout(1000);
      await page.goto('/opportunities');
      await page.waitForTimeout(1000);
      
      const responseTime = Date.now() - startTime;
      loadTestMetrics.push({
        userId,
        timestamp: Date.now(),
        action: 'realtime',
        url: page.url(),
        responseTime,
        status: 200
      });
    } catch (error) {
      loadTestMetrics.push({
        userId,
        timestamp: Date.now(),
        action: 'realtime',
        url: page.url(),
        responseTime: Date.now() - startTime,
        status: 500,
        error: error instanceof Error ? error.message : 'Realtime test failed'
      });
    }
  }

  async function simulateBasicUser(page: Page, userId: number): Promise<void> {
    const startTime = Date.now();
    try {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const responseTime = Date.now() - startTime;
      
      loadTestMetrics.push({
        userId,
        timestamp: Date.now(),
        action: 'basic',
        url: '/',
        responseTime,
        status: 200
      });
    } catch (error) {
      loadTestMetrics.push({
        userId,
        timestamp: Date.now(),
        action: 'basic',
        url: '/',
        responseTime: Date.now() - startTime,
        status: 500,
        error: error instanceof Error ? error.message : 'Basic test failed'
      });
    }
  }

  function analyzeLoadTestResults(metrics: LoadTestMetrics[]) {
    const successfulRequests = metrics.filter(m => m.status < 400);
    const errorRequests = metrics.filter(m => m.status >= 400);
    
    const responseTimes = successfulRequests.map(m => m.responseTime);
    const averageResponseTime = responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length;
    
    responseTimes.sort((a, b) => a - b);
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p95ResponseTime = responseTimes[p95Index] || 0;
    
    const errorRate = errorRequests.length / metrics.length;

    return {
      totalRequests: metrics.length,
      successfulRequests: successfulRequests.length,
      errorRequests: errorRequests.length,
      averageResponseTime: Math.round(averageResponseTime),
      p95ResponseTime: Math.round(p95ResponseTime),
      errorRate: Number((errorRate * 100).toFixed(2)),
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes)
    };
  }

  function generateLoadTestReport(metrics: LoadTestMetrics[]) {
    console.log('\n=== COMPREHENSIVE LOAD TEST REPORT ===');
    
    const analysis = analyzeLoadTestResults(metrics);
    console.log('Overall Performance:');
    console.log(`  Total Requests: ${analysis.totalRequests}`);
    console.log(`  Success Rate: ${((analysis.successfulRequests / analysis.totalRequests) * 100).toFixed(1)}%`);
    console.log(`  Error Rate: ${analysis.errorRate}%`);
    console.log(`  Average Response Time: ${analysis.averageResponseTime}ms`);
    console.log(`  95th Percentile: ${analysis.p95ResponseTime}ms`);
    console.log(`  Min Response Time: ${analysis.minResponseTime}ms`);
    console.log(`  Max Response Time: ${analysis.maxResponseTime}ms`);

    // Analysis by action type
    const actionGroups = metrics.reduce((groups: Record<string, LoadTestMetrics[]>, metric) => {
      if (!groups[metric.action]) {
        groups[metric.action] = [];
      }
      groups[metric.action].push(metric);
      return groups;
    }, {});

    console.log('\nPerformance by Action:');
    Object.entries(actionGroups).forEach(([action, actionMetrics]) => {
      const actionAnalysis = analyzeLoadTestResults(actionMetrics);
      console.log(`  ${action}:`);
      console.log(`    Requests: ${actionAnalysis.totalRequests}`);
      console.log(`    Success Rate: ${((actionAnalysis.successfulRequests / actionAnalysis.totalRequests) * 100).toFixed(1)}%`);
      console.log(`    Avg Response Time: ${actionAnalysis.averageResponseTime}ms`);
    });

    console.log('\n==============================\n');
  }
});