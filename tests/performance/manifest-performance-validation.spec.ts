import { test, expect } from '@playwright/test';

test.describe('PWA Manifest Performance & Validation', () => {
  test.setTimeout(30000);

  test('should serve manifest.webmanifest without 401 errors', async ({ page, context }) => {
    // Listen for all network requests
    const manifestRequests: any[] = [];
    const errorRequests: any[] = [];

    page.on('request', request => {
      const url = request.url();
      if (url.includes('manifest')) {
        manifestRequests.push({
          url,
          method: request.method(),
          timestamp: Date.now()
        });
      }
    });

    page.on('response', response => {
      const url = response.url();
      if (url.includes('manifest')) {
        if (response.status() >= 400) {
          errorRequests.push({
            url,
            status: response.status(),
            statusText: response.statusText()
          });
        }
      }
    });

    // Navigate to the app
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;

    // Performance validation: Page should load in <2s
    expect(loadTime).toBeLessThan(2000);

    // Verify no 401 or 404 errors for manifest files
    expect(errorRequests).toHaveLength(0);
    
    // Verify manifest requests were made
    expect(manifestRequests.length).toBeGreaterThan(0);

    // Test manifest accessibility directly
    const manifestResponse = await page.request.get('/manifest.webmanifest');
    expect(manifestResponse.status()).toBe(200);

    const manifestContent = await manifestResponse.json();
    
    // Validate manifest structure
    expect(manifestContent).toHaveProperty('name');
    expect(manifestContent).toHaveProperty('short_name');
    expect(manifestContent).toHaveProperty('icons');
    expect(manifestContent).toHaveProperty('start_url');
    expect(manifestContent).toHaveProperty('display');
    expect(manifestContent).toHaveProperty('theme_color');
    expect(manifestContent).toHaveProperty('background_color');

    // Validate PWA requirements
    expect(manifestContent.icons.length).toBeGreaterThan(0);
    expect(manifestContent.start_url).toBe('/');
    expect(manifestContent.display).toBe('standalone');
    
    // Performance: Manifest should be small (<10KB)
    const manifestSize = JSON.stringify(manifestContent).length;
    expect(manifestSize).toBeLessThan(10240);
  });

  test('should have proper PWA manifest configuration', async ({ page }) => {
    await page.goto('/');

    // Check if service worker is properly registered
    const swRegistration = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistrations();
    });

    expect(swRegistration.length).toBeGreaterThan(0);

    // Test PWA installation prompt capability
    const isPWAInstallable = await page.evaluate(() => {
      return 'serviceWorker' in navigator && 'PushManager' in window;
    });

    expect(isPWAInstallable).toBe(true);
  });

  test('should validate icon assets are accessible', async ({ page }) => {
    await page.goto('/');
    
    // Get manifest content
    const manifestResponse = await page.request.get('/manifest.webmanifest');
    const manifest = await manifestResponse.json();

    // Test each icon is accessible
    const iconTests = manifest.icons?.map(async (icon: any) => {
      const iconResponse = await page.request.get(icon.src);
      expect(iconResponse.status()).toBe(200);
      expect(iconResponse.headers()['content-type']).toContain('image');
    });

    if (iconTests) {
      await Promise.all(iconTests);
    }
  });

  test('should validate shortcut URLs are functional', async ({ page }) => {
    await page.goto('/');
    
    const manifestResponse = await page.request.get('/manifest.webmanifest');
    const manifest = await manifestResponse.json();

    if (manifest.shortcuts) {
      for (const shortcut of manifest.shortcuts) {
        // Test that shortcut URLs resolve (but may redirect to login or show appropriate response)
        const shortcutResponse = await page.request.get(shortcut.url);
        expect(shortcutResponse.status()).toBeLessThan(500); // Allow redirects and client errors, but not server errors
      }
    }
  });

  test('should measure manifest loading performance', async ({ page }) => {
    const performanceEntries: any[] = [];
    
    await page.addInitScript(() => {
      // Monitor all resource loading
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if ((entry as any).name.includes('manifest')) {
            (window as any).__manifestPerformance = entry;
          }
        }
      }).observe({ entryTypes: ['resource'] });
    });

    const startTime = performance.now();
    await page.goto('/');
    const endTime = performance.now();

    const totalLoadTime = endTime - startTime;
    
    // Performance threshold: Total page load should be under 2000ms
    expect(totalLoadTime).toBeLessThan(2000);

    // Get manifest-specific timing if available
    const manifestTiming = await page.evaluate(() => (window as any).__manifestPerformance);
    
    if (manifestTiming) {
      // Manifest should load quickly (<100ms)
      const manifestLoadTime = manifestTiming.responseEnd - manifestTiming.startTime;
      expect(manifestLoadTime).toBeLessThan(100);
    }
  });

  test('should handle offline manifest caching', async ({ page, context }) => {
    // First, load the page online to cache assets
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);

    // Navigate again - should still work due to service worker caching
    await page.reload();
    
    // Basic functionality should still work offline
    const title = await page.title();
    expect(title).toContain('CRM');

    // Re-enable online
    await context.setOffline(false);
  });
});