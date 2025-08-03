import { test, expect } from '@playwright/test';

test.describe('Opportunity Management - Debug Routes', () => {
  test('Check what happens when navigating to /opportunities', async ({ page }) => {
    console.log('Starting debug test...');
    
    // Navigate to opportunities route
    console.log('Navigating to /opportunities...');
    await page.goto('http://localhost:3000/opportunities');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot to see what we get
    await page.screenshot({ path: 'screenshots/debug-opportunities-route.png', fullPage: true });
    
    // Get current URL after navigation
    const currentUrl = page.url();
    console.log(`Current URL after navigation: ${currentUrl}`);
    
    // Get page title
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Get main heading
    const heading = await page.locator('h1').first().textContent();
    console.log(`Main heading: ${heading}`);
    
    // Check if we're on the right page or if we got redirected
    if (currentUrl.includes('/opportunities')) {
      console.log('✅ Successfully navigated to opportunities route');
    } else {
      console.log(`❌ Got redirected to: ${currentUrl}`);
    }
    
    // Look for any content on the page
    const bodyText = await page.locator('body').textContent();
    console.log(`Page contains "opportunity": ${bodyText?.toLowerCase().includes('opportunity') ? 'Yes' : 'No'}`);
    console.log(`Page contains "dashboard": ${bodyText?.toLowerCase().includes('dashboard') ? 'Yes' : 'No'}`);
    
    // Check what components are actually rendered
    const components = [
      'main',
      'nav', 
      'header',
      'table',
      'form',
      '[data-testid]'
    ];
    
    for (const selector of components) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`Found ${count} ${selector} elements`);
      }
    }
    
    // Get all data-testid attributes to see what components exist
    const testIds = await page.locator('[data-testid]').all();
    const testIdValues = [];
    for (const element of testIds) {
      const testId = await element.getAttribute('data-testid');
      if (testId) testIdValues.push(testId);
    }
    
    if (testIdValues.length > 0) {
      console.log('Found data-testid elements:', testIdValues);
    } else {
      console.log('No data-testid elements found');
    }
  });
  
  test('Check if opportunity routes exist in Vue Router', async ({ page }) => {
    // Go to the root first
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    console.log('Checking root page...');
    const rootUrl = page.url();
    console.log(`Root URL: ${rootUrl}`);
    
    // Try to find navigation links
    const links = await page.locator('a').all();
    const linkHrefs = [];
    
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href) linkHrefs.push(href);
    }
    
    console.log('Found links:', linkHrefs.filter(href => href.includes('opportunit')));
    
    // Check if Vue Router is working by examining the app
    const vueApp = await page.evaluate(() => {
      // Check if Vue router exists
      return {
        hasRouter: !!(window as any).__VUE_ROUTER__,
        currentRoute: (window as any).__VUE_ROUTER__?.currentRoute?.value?.path,
        routes: (window as any).__VUE_ROUTER__?.getRoutes?.()?.map((r: any) => r.path)
      };
    });
    
    console.log('Vue Router info:', vueApp);
  });
  
  test('Test navigation to opportunity create form', async ({ page }) => {
    await page.goto('http://localhost:3000/opportunities/new');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'screenshots/debug-opportunity-create.png', fullPage: true });
    
    const currentUrl = page.url();
    console.log(`Create form URL: ${currentUrl}`);
    
    const headings = await page.locator('h1').allTextContents();
    console.log(`All headings found: ${headings.join(', ')}`);
    
    // Look specifically for create form heading
    const createHeading = await page.locator('h1[data-testid="page-title"]').textContent();
    console.log(`Create form heading: ${createHeading}`);
    
    // Look for form elements
    const formElements = await page.locator('form, input, select, textarea, button').count();
    console.log(`Found ${formElements} form elements`);
    
    if (formElements > 0) {
      console.log('✅ Form elements found on create page');
    } else {
      console.log('❌ No form elements found');
    }
  });
});