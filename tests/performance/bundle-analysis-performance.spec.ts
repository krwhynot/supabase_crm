import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Bundle Performance Analysis', () => {
  test.setTimeout(60000);

  const BUNDLE_THRESHOLDS = {
    INITIAL_BUNDLE: 500 * 1024,      // 500KB for initial bundle
    CHUNK_SIZE: 200 * 1024,          // 200KB for individual chunks
    TOTAL_JS: 2 * 1024 * 1024,       // 2MB total JavaScript
    TOTAL_CSS: 200 * 1024,           // 200KB total CSS
    CRITICAL_CSS: 50 * 1024,         // 50KB critical CSS
    ASSET_COUNT: 50,                 // Maximum number of assets
    COMPRESSION_RATIO: 0.3           // Assets should compress to <30% of original
  };

  interface BundleAnalysis {
    file: string;
    size: number;
    type: 'js' | 'css' | 'asset';
    critical: boolean;
    loadOrder: number;
    dependencies?: string[];
  }

  let bundleAssets: BundleAnalysis[] = [];

  test.beforeAll(async () => {
    // Ensure we have a fresh build for analysis
    console.log('Analyzing production build...');
    
    const distPath = path.join(__dirname, '../../dist');
    if (!fs.existsSync(distPath)) {
      throw new Error('Build output not found. Run "npm run build" first.');
    }

    // Analyze bundle structure
    bundleAssets = analyzeBundleStructure(distPath);
  });

  test('Bundle Size Analysis - Initial Load Performance', async ({ page }) => {
    // Navigate to the app and measure what's loaded initially
    const resourceSizes: Record<string, number> = {};
    const loadOrder: string[] = [];

    page.on('response', async (response) => {
      const url = response.url();
      const request = response.request();
      
      if (url.includes('.js') || url.includes('.css') || url.includes('.woff') || url.includes('.png')) {
        const size = parseInt(response.headers()['content-length'] || '0');
        if (size > 0) {
          resourceSizes[path.basename(url)] = size;
          loadOrder.push(path.basename(url));
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Analyze initial bundle size
    const jsFiles = Object.entries(resourceSizes).filter(([name]) => name.endsWith('.js'));
    const cssFiles = Object.entries(resourceSizes).filter(([name]) => name.endsWith('.css'));
    
    const totalJSSize = jsFiles.reduce((sum, [, size]) => sum + size, 0);
    const totalCSSSize = cssFiles.reduce((sum, [, size]) => sum + size, 0);
    const initialBundleSize = jsFiles.find(([name]) => name.includes('index'))?.[1] || 0;

    console.log('Bundle Analysis Results:');
    console.log(`  Initial Bundle Size: ${(initialBundleSize / 1024).toFixed(2)}KB`);
    console.log(`  Total JavaScript: ${(totalJSSize / 1024).toFixed(2)}KB`);
    console.log(`  Total CSS: ${(totalCSSSize / 1024).toFixed(2)}KB`);
    console.log(`  Total Resources: ${Object.keys(resourceSizes).length}`);

    // Performance assertions
    expect(initialBundleSize).toBeLessThan(BUNDLE_THRESHOLDS.INITIAL_BUNDLE);
    expect(totalJSSize).toBeLessThan(BUNDLE_THRESHOLDS.TOTAL_JS);
    expect(totalCSSSize).toBeLessThan(BUNDLE_THRESHOLDS.TOTAL_CSS);
    expect(Object.keys(resourceSizes).length).toBeLessThan(BUNDLE_THRESHOLDS.ASSET_COUNT);

    // Analyze individual chunks
    jsFiles.forEach(([name, size]) => {
      if (!name.includes('index')) { // Skip main bundle, check chunks
        expect(size).toBeLessThan(BUNDLE_THRESHOLDS.CHUNK_SIZE);
      }
    });
  });

  test('Code Splitting Analysis - Route-based Performance', async ({ page, context }) => {
    const routeLoadTimes: Record<string, number> = {};
    const routeBundleSizes: Record<string, number> = {};

    // Test different routes to validate code splitting
    const routes = [
      { path: '/', name: 'dashboard' },
      { path: '/contacts', name: 'contacts' },
      { path: '/organizations', name: 'organizations' },
      { path: '/opportunities', name: 'opportunities' },
      { path: '/principals', name: 'principals' },
      { path: '/products', name: 'products' }
    ];

    for (const route of routes) {
      const routeResourceSizes: Record<string, number> = {};
      
      // Create fresh context to measure clean loads
      const newContext = await context.browser().newContext();
      const routePage = await newContext.newPage();

      routePage.on('response', async (response) => {
        const url = response.url();
        if (url.includes('.js') || url.includes('.css')) {
          const size = parseInt(response.headers()['content-length'] || '0');
          if (size > 0) {
            routeResourceSizes[path.basename(url)] = size;
          }
        }
      });

      const startTime = Date.now();
      await routePage.goto(route.path);
      await routePage.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      routeLoadTimes[route.name] = loadTime;
      routeBundleSizes[route.name] = Object.values(routeResourceSizes).reduce((sum, size) => sum + size, 0);

      console.log(`Route: ${route.name}`);
      console.log(`  Load Time: ${loadTime}ms`);
      console.log(`  Bundle Size: ${(routeBundleSizes[route.name] / 1024).toFixed(2)}KB`);
      console.log(`  Resources: ${Object.keys(routeResourceSizes).length}`);

      await newContext.close();

      // Performance assertions per route
      expect(loadTime).toBeLessThan(2000); // 2 seconds max per route
      expect(routeBundleSizes[route.name]).toBeLessThan(BUNDLE_THRESHOLDS.TOTAL_JS);
    }

    // Analyze code splitting effectiveness
    const bundleSizeVariation = Math.max(...Object.values(routeBundleSizes)) - Math.min(...Object.values(routeBundleSizes));
    console.log(`Bundle Size Variation: ${(bundleSizeVariation / 1024).toFixed(2)}KB`);
    
    // If code splitting is effective, there should be variation in bundle sizes
    expect(bundleSizeVariation).toBeGreaterThan(50 * 1024); // At least 50KB difference
  });

  test('Tree Shaking Analysis - Unused Code Detection', async ({ page }) => {
    // This test analyzes the built bundles for potential unused code
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for common libraries that might not be tree-shaken properly
    const bundleContent = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      return scripts.map(script => (script as HTMLScriptElement).src);
    });

    console.log('Analyzing tree shaking effectiveness...');
    
    // Test Vue 3 tree shaking
    const hasVueFeatures = await page.evaluate(() => {
      // Check if unused Vue features are present in the bundle
      const hasOptionsAPI = window.toString().includes('optionsAPI');
      const hasTransitionGroup = window.toString().includes('TransitionGroup');
      const hasKeepAlive = window.toString().includes('KeepAlive');
      
      return { hasOptionsAPI, hasTransitionGroup, hasKeepAlive };
    });

    // Since we're using Composition API only, Options API should be tree-shaken
    console.log('Vue 3 Tree Shaking Analysis:');
    console.log(`  Options API Present: ${hasVueFeatures.hasOptionsAPI}`);
    console.log(`  TransitionGroup Present: ${hasVueFeatures.hasTransitionGroup}`);
    console.log(`  KeepAlive Present: ${hasVueFeatures.hasKeepAlive}`);

    // Test library imports
    const libraryAnalysis = bundleAssets.filter(asset => asset.type === 'js').map(asset => {
      const potentialUnusedFeatures = [
        'lodash', // Should be using lodash-es with tree shaking
        'moment', // Should be using date-fns or native Date
        'jquery', // Should not be present in Vue 3 app
        'bootstrap' // Should be using Tailwind instead
      ];

      const unusedFeatures = potentialUnusedFeatures.filter(feature => 
        asset.file.toLowerCase().includes(feature)
      );

      return {
        file: asset.file,
        size: asset.size,
        potentialUnusedFeatures: unusedFeatures
      };
    });

    // Report tree shaking issues
    const treeshakingIssues = libraryAnalysis.filter(analysis => 
      analysis.potentialUnusedFeatures.length > 0
    );

    if (treeshakingIssues.length > 0) {
      console.log('Potential Tree Shaking Issues:');
      treeshakingIssues.forEach(issue => {
        console.log(`  ${issue.file}: ${issue.potentialUnusedFeatures.join(', ')}`);
      });
    }

    expect(treeshakingIssues.length).toBe(0); // No tree shaking issues
  });

  test('Asset Compression Analysis', async ({ page }) => {
    const compressionData: Array<{
      file: string;
      originalSize: number;
      compressedSize: number;
      compressionRatio: number;
    }> = [];

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('.js') || url.includes('.css')) {
        const contentEncoding = response.headers()['content-encoding'];
        const contentLength = parseInt(response.headers()['content-length'] || '0');
        const originalSize = parseInt(response.headers()['x-original-size'] || contentLength.toString());

        if (contentEncoding && contentLength > 0) {
          compressionData.push({
            file: path.basename(url),
            originalSize,
            compressedSize: contentLength,
            compressionRatio: contentLength / originalSize
          });
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('Compression Analysis:');
    compressionData.forEach(data => {
      console.log(`  ${data.file}:`);
      console.log(`    Original: ${(data.originalSize / 1024).toFixed(2)}KB`);
      console.log(`    Compressed: ${(data.compressedSize / 1024).toFixed(2)}KB`);
      console.log(`    Ratio: ${(data.compressionRatio * 100).toFixed(1)}%`);
    });

    // Verify compression effectiveness
    compressionData.forEach(data => {
      expect(data.compressionRatio).toBeLessThan(BUNDLE_THRESHOLDS.COMPRESSION_RATIO);
    });
  });

  test('Critical Resource Prioritization', async ({ page }) => {
    const resourceLoadOrder: Array<{
      url: string;
      type: string;
      startTime: number;
      duration: number;
      priority: string;
    }> = [];

    await page.addInitScript(() => {
      // Monitor resource loading with Performance Observer
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming;
          (window as any).__resourceMetrics = (window as any).__resourceMetrics || [];
          (window as any).__resourceMetrics.push({
            url: resourceEntry.name,
            startTime: resourceEntry.startTime,
            duration: resourceEntry.duration,
            size: resourceEntry.transferSize || 0
          });
        }
      });
      observer.observe({ entryTypes: ['resource'] });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const resourceMetrics = await page.evaluate(() => (window as any).__resourceMetrics || []);
    
    // Analyze critical resource loading order
    const criticalResources = resourceMetrics.filter((resource: any) => 
      resource.url.includes('.css') || 
      (resource.url.includes('.js') && resource.url.includes('index'))
    );

    criticalResources.sort((a: any, b: any) => a.startTime - b.startTime);

    console.log('Critical Resource Load Order:');
    criticalResources.forEach((resource: any, index: number) => {
      console.log(`  ${index + 1}. ${path.basename(resource.url)} - ${resource.duration.toFixed(2)}ms`);
    });

    // CSS should load before JavaScript for optimal rendering
    const firstCSS = criticalResources.find((r: any) => r.url.includes('.css'));
    const firstJS = criticalResources.find((r: any) => r.url.includes('.js'));

    if (firstCSS && firstJS) {
      expect(firstCSS.startTime).toBeLessThanOrEqual(firstJS.startTime);
    }

    // Critical resources should load quickly
    criticalResources.forEach((resource: any) => {
      expect(resource.duration).toBeLessThan(1000); // 1 second max for critical resources
    });
  });

  test('Bundle Caching Strategy Validation', async ({ page, context }) => {
    // Test browser caching behavior
    
    // First load
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Get loaded resources
    const firstLoadResources = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map(entry => ({
        name: entry.name,
        transferSize: (entry as PerformanceResourceTiming).transferSize
      }));
    });

    // Second load (should use cache)
    await page.reload();
    await page.waitForLoadState('networkidle');

    const secondLoadResources = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map(entry => ({
        name: entry.name,
        transferSize: (entry as PerformanceResourceTiming).transferSize
      }));
    });

    // Compare cached resources
    const cachedResources = secondLoadResources.filter(resource => resource.transferSize === 0);
    const cachingEffectiveness = cachedResources.length / secondLoadResources.length;

    console.log('Caching Analysis:');
    console.log(`  Total Resources: ${secondLoadResources.length}`);
    console.log(`  Cached Resources: ${cachedResources.length}`);
    console.log(`  Caching Effectiveness: ${(cachingEffectiveness * 100).toFixed(1)}%`);

    // At least 70% of resources should be cacheable
    expect(cachingEffectiveness).toBeGreaterThan(0.7);
  });

  function analyzeBundleStructure(distPath: string): BundleAnalysis[] {
    const assets: BundleAnalysis[] = [];
    
    // Read JS files
    const jsPath = path.join(distPath, 'js');
    if (fs.existsSync(jsPath)) {
      const jsFiles = fs.readdirSync(jsPath);
      jsFiles.forEach((file, index) => {
        const filePath = path.join(jsPath, file);
        const stats = fs.statSync(filePath);
        assets.push({
          file,
          size: stats.size,
          type: 'js',
          critical: file.includes('index') || file.includes('runtime'),
          loadOrder: index
        });
      });
    }

    // Read CSS files
    const cssPath = path.join(distPath, 'css');
    if (fs.existsSync(cssPath)) {
      const cssFiles = fs.readdirSync(cssPath);
      cssFiles.forEach((file, index) => {
        const filePath = path.join(cssPath, file);
        const stats = fs.statSync(filePath);
        assets.push({
          file,
          size: stats.size,
          type: 'css',
          critical: file.includes('index'),
          loadOrder: index
        });
      });
    }

    return assets;
  }

  test.afterAll(async () => {
    console.log('\n=== BUNDLE PERFORMANCE SUMMARY ===');
    
    const jsAssets = bundleAssets.filter(a => a.type === 'js');
    const cssAssets = bundleAssets.filter(a => a.type === 'css');
    
    const totalJSSize = jsAssets.reduce((sum, asset) => sum + asset.size, 0);
    const totalCSSSize = cssAssets.reduce((sum, asset) => sum + asset.size, 0);
    
    console.log(`Total JavaScript: ${(totalJSSize / 1024).toFixed(2)}KB (${jsAssets.length} files)`);
    console.log(`Total CSS: ${(totalCSSSize / 1024).toFixed(2)}KB (${cssAssets.length} files)`);
    console.log(`Total Assets: ${bundleAssets.length}`);
    
    // Recommendations
    const largeAssets = bundleAssets.filter(asset => asset.size > BUNDLE_THRESHOLDS.CHUNK_SIZE);
    if (largeAssets.length > 0) {
      console.log('\nOptimization Opportunities:');
      largeAssets.forEach(asset => {
        console.log(`  Large Asset: ${asset.file} - ${(asset.size / 1024).toFixed(2)}KB`);
      });
    }

    console.log('====================================\n');
  });
});