import { test, expect } from '@playwright/test';

test.describe('Comprehensive API Performance Testing', () => {
  test.setTimeout(60000);

  const PERFORMANCE_THRESHOLDS = {
    SIMPLE_API_RESPONSE: 200,    // <200ms for simple operations
    COMPLEX_API_RESPONSE: 500,   // <500ms for complex operations
    DATABASE_QUERY: 100,         // <100ms for simple queries
    COMPLEX_QUERY: 300,          // <300ms for complex queries
    PAGE_LOAD: 2000,             // <2s for initial page load
    SUBSEQUENT_LOAD: 1000        // <1s for subsequent navigation
  };

  let responseTimeMetrics: Array<{
    endpoint: string;
    method: string;
    responseTime: number;
    status: number;
    size: number;
    timestamp: number;
  }> = [];

  test.beforeEach(async ({ page }) => {
    responseTimeMetrics = [];
    
    // Monitor all API requests
    page.on('response', response => {
      const url = response.url();
      const request = response.request();
      
      // Only track API endpoints (Supabase, local API)
      if (url.includes('/rest/v1/') || url.includes('/api/') || url.includes('supabase')) {
        responseTimeMetrics.push({
          endpoint: new URL(url).pathname,
          method: request.method(),
          responseTime: response.timing().responseEnd,
          status: response.status(),
          size: response.headers()['content-length'] ? parseInt(response.headers()['content-length']) : 0,
          timestamp: Date.now()
        });
      }
    });
  });

  test('Dashboard Load Performance - Initial & Subsequent', async ({ page }) => {
    // Test 1: Initial Dashboard Load
    const initialStartTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const initialLoadTime = Date.now() - initialStartTime;

    console.log(`Initial Dashboard Load: ${initialLoadTime}ms`);
    expect(initialLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PAGE_LOAD);

    // Test 2: Navigation to other pages (subsequent loads)
    const subsequentStartTime = Date.now();
    await page.click('nav a[href="/contacts"]');
    await page.waitForLoadState('networkidle');
    const subsequentLoadTime = Date.now() - subsequentStartTime;

    console.log(`Subsequent Navigation Load: ${subsequentLoadTime}ms`);
    expect(subsequentLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SUBSEQUENT_LOAD);

    // Analyze API response times
    const apiResponses = responseTimeMetrics.filter(metric => metric.responseTime > 0);
    const avgResponseTime = apiResponses.reduce((sum, metric) => sum + metric.responseTime, 0) / apiResponses.length;

    console.log(`Average API Response Time: ${avgResponseTime}ms`);
    console.log(`Total API Requests: ${apiResponses.length}`);
    
    // Performance validation
    expect(avgResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SIMPLE_API_RESPONSE);
  });

  test('Contacts API Performance Testing', async ({ page }) => {
    await page.goto('/contacts');
    
    // Wait for contacts to load
    await page.waitForSelector('[data-testid="contacts-table"], .contact-card, .contacts-list');
    
    // Test contacts list load performance
    const contactsResponses = responseTimeMetrics.filter(m => 
      m.endpoint.includes('contacts') && m.method === 'GET'
    );

    if (contactsResponses.length > 0) {
      const avgContactsResponseTime = contactsResponses.reduce((sum, m) => sum + m.responseTime, 0) / contactsResponses.length;
      console.log(`Contacts List Load: ${avgContactsResponseTime}ms`);
      expect(avgContactsResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SIMPLE_API_RESPONSE);
    }

    // Test contact creation performance
    await page.click('a[href="/contacts/new"], button[data-testid="add-contact"]');
    await page.waitForLoadState('networkidle');

    const createFormResponses = responseTimeMetrics.filter(m => 
      m.timestamp > Date.now() - 5000 && m.method === 'GET'
    );

    if (createFormResponses.length > 0) {
      const avgFormLoadTime = createFormResponses.reduce((sum, m) => sum + m.responseTime, 0) / createFormResponses.length;
      console.log(`Contact Form Load: ${avgFormLoadTime}ms`);
      expect(avgFormLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SIMPLE_API_RESPONSE);
    }
  });

  test('Organizations API Performance Testing', async ({ page }) => {
    await page.goto('/organizations');
    
    // Wait for organizations to load
    await page.waitForSelector('[data-testid="organizations-table"], .organization-card, .organizations-list');
    
    const organizationsResponses = responseTimeMetrics.filter(m => 
      m.endpoint.includes('organizations') && m.method === 'GET'
    );

    if (organizationsResponses.length > 0) {
      const avgOrgsResponseTime = organizationsResponses.reduce((sum, m) => sum + m.responseTime, 0) / organizationsResponses.length;
      console.log(`Organizations List Load: ${avgOrgsResponseTime}ms`);
      expect(avgOrgsResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SIMPLE_API_RESPONSE);
    }

    // Test search functionality performance
    const searchInput = await page.$('[data-testid="search-input"], input[placeholder*="Search"]');
    if (searchInput) {
      await searchInput.fill('test search');
      await page.waitForTimeout(500); // Wait for debounced search
      
      const searchResponses = responseTimeMetrics.filter(m => 
        m.timestamp > Date.now() - 2000 && m.method === 'GET'
      );

      if (searchResponses.length > 0) {
        const avgSearchTime = searchResponses.reduce((sum, m) => sum + m.responseTime, 0) / searchResponses.length;
        console.log(`Organization Search: ${avgSearchTime}ms`);
        expect(avgSearchTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SIMPLE_API_RESPONSE);
      }
    }
  });

  test('Opportunities API Performance Testing', async ({ page }) => {
    await page.goto('/opportunities');
    
    // Wait for opportunities to load
    await page.waitForSelector('[data-testid="opportunities-table"], .opportunity-card, .opportunities-list');
    
    const opportunitiesResponses = responseTimeMetrics.filter(m => 
      m.endpoint.includes('opportunities') && m.method === 'GET'
    );

    if (opportunitiesResponses.length > 0) {
      const avgOppsResponseTime = opportunitiesResponses.reduce((sum, m) => sum + m.responseTime, 0) / opportunitiesResponses.length;
      console.log(`Opportunities List Load: ${avgOppsResponseTime}ms`);
      expect(avgOppsResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPLEX_API_RESPONSE); // Complex due to joins
    }

    // Test KPI cards performance
    const kpiCards = await page.$$('[data-testid*="kpi"], .kpi-card');
    if (kpiCards.length > 0) {
      const kpiResponses = responseTimeMetrics.filter(m => 
        m.timestamp > Date.now() - 3000 && m.method === 'GET'
      );

      if (kpiResponses.length > 0) {
        const avgKpiTime = kpiResponses.reduce((sum, m) => sum + m.responseTime, 0) / kpiResponses.length;
        console.log(`KPI Cards Load: ${avgKpiTime}ms`);
        expect(avgKpiTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPLEX_API_RESPONSE);
      }
    }
  });

  test('Authentication Flow Performance', async ({ page }) => {
    // Test various auth-related operations
    await page.goto('/');
    
    const authResponses = responseTimeMetrics.filter(m => 
      m.endpoint.includes('auth') || m.endpoint.includes('session') || m.endpoint.includes('user')
    );

    if (authResponses.length > 0) {
      const avgAuthTime = authResponses.reduce((sum, m) => sum + m.responseTime, 0) / authResponses.length;
      console.log(`Authentication Operations: ${avgAuthTime}ms`);
      expect(avgAuthTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SIMPLE_API_RESPONSE);
    }

    // Test RLS (Row Level Security) policy performance impact
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');
    
    const rlsResponses = responseTimeMetrics.filter(m => 
      m.timestamp > Date.now() - 5000 && m.status === 200
    );

    // RLS-protected queries should still be fast
    if (rlsResponses.length > 0) {
      const avgRlsTime = rlsResponses.reduce((sum, m) => sum + m.responseTime, 0) / rlsResponses.length;
      console.log(`RLS-Protected Queries: ${avgRlsTime}ms`);
      expect(avgRlsTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SIMPLE_API_RESPONSE * 1.5); // Allow slight overhead for security
    }
  });

  test('Concurrent Request Performance', async ({ page, context }) => {
    // Simulate concurrent user scenarios
    const concurrentPages = await Promise.all([
      context.newPage(),
      context.newPage(),
      context.newPage()
    ]);

    const concurrentMetrics: any[] = [];

    // Set up monitoring for each page
    concurrentPages.forEach((concurrentPage, index) => {
      concurrentPage.on('response', response => {
        const request = response.request();
        const url = request.url();
        if (url.includes('/rest/v1/') || url.includes('/api/')) {
          concurrentMetrics.push({
            pageIndex: index,
            endpoint: new URL(url).pathname,
            responseTime: response.timing().responseEnd,
            status: response.status(),
            timestamp: Date.now()
          });
        }
      });
    });

    // Execute concurrent operations
    const startTime = Date.now();
    await Promise.all([
      concurrentPages[0].goto('/contacts'),
      concurrentPages[1].goto('/organizations'),
      concurrentPages[2].goto('/opportunities')
    ]);

    // Wait for all pages to fully load
    await Promise.all([
      concurrentPages[0].waitForLoadState('networkidle'),
      concurrentPages[1].waitForLoadState('networkidle'),
      concurrentPages[2].waitForLoadState('networkidle')
    ]);

    const totalConcurrentTime = Date.now() - startTime;
    console.log(`Concurrent Load Time: ${totalConcurrentTime}ms`);
    console.log(`Concurrent Requests: ${concurrentMetrics.length}`);

    // Performance validation for concurrent operations
    expect(totalConcurrentTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PAGE_LOAD * 1.5); // Allow some overhead

    const avgConcurrentResponseTime = concurrentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / concurrentMetrics.length;
    console.log(`Average Concurrent Response Time: ${avgConcurrentResponseTime}ms`);
    expect(avgConcurrentResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPLEX_API_RESPONSE);

    // Clean up
    await Promise.all(concurrentPages.map(p => p.close()));
  });

  test('Database Query Performance Analysis', async ({ page }) => {
    await page.goto('/');
    
    // Navigate through various pages to trigger different query types
    const pages = ['/contacts', '/organizations', '/opportunities', '/principals', '/products'];
    
    for (const pagePath of pages) {
      const startTime = Date.now();
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      console.log(`${pagePath} Load Time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PAGE_LOAD);
    }

    // Analyze database query patterns
    const dbQueries = responseTimeMetrics.filter(m => 
      m.endpoint.includes('/rest/v1/') && m.status === 200
    );

    if (dbQueries.length > 0) {
      const simpleQueries = dbQueries.filter(q => !q.endpoint.includes('select=') || q.endpoint.includes('select=').length < 50);
      const complexQueries = dbQueries.filter(q => q.endpoint.includes('select=') && q.endpoint.includes('select=').length >= 50);

      if (simpleQueries.length > 0) {
        const avgSimpleQueryTime = simpleQueries.reduce((sum, q) => sum + q.responseTime, 0) / simpleQueries.length;
        console.log(`Simple Database Queries: ${avgSimpleQueryTime}ms`);
        expect(avgSimpleQueryTime).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_QUERY);
      }

      if (complexQueries.length > 0) {
        const avgComplexQueryTime = complexQueries.reduce((sum, q) => sum + q.responseTime, 0) / complexQueries.length;
        console.log(`Complex Database Queries: ${avgComplexQueryTime}ms`);
        expect(avgComplexQueryTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPLEX_QUERY);
      }
    }
  });

  test.afterEach(async ({ page }) => {
    // Generate performance report
    console.log('\n=== API PERFORMANCE SUMMARY ===');
    
    if (responseTimeMetrics.length > 0) {
      const totalRequests = responseTimeMetrics.length;
      const avgResponseTime = responseTimeMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
      const slowQueries = responseTimeMetrics.filter(m => m.responseTime > PERFORMANCE_THRESHOLDS.SIMPLE_API_RESPONSE);
      const errorRequests = responseTimeMetrics.filter(m => m.status >= 400);

      console.log(`Total API Requests: ${totalRequests}`);
      console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`Slow Queries (>${PERFORMANCE_THRESHOLDS.SIMPLE_API_RESPONSE}ms): ${slowQueries.length}`);
      console.log(`Error Requests: ${errorRequests.length}`);

      if (slowQueries.length > 0) {
        console.log('Slow Queries:');
        slowQueries.forEach(q => {
          console.log(`  ${q.method} ${q.endpoint}: ${q.responseTime}ms (${q.status})`);
        });
      }

      if (errorRequests.length > 0) {
        console.log('Error Requests:');
        errorRequests.forEach(q => {
          console.log(`  ${q.method} ${q.endpoint}: ${q.status}`);
        });
      }
    }
    console.log('==============================\n');
  });
});