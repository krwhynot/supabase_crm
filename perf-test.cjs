const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const start = Date.now();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  const loadTime = Date.now() - start;
  
  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paints = performance.getEntriesByType('paint');
    
    return {
      domContentLoaded: nav ? nav.domContentLoadedEventEnd - nav.navigationStart : 0,
      firstPaint: paints.find(p => p.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paints.find(p => p.name === 'first-contentful-paint')?.startTime || 0
    };
  });
  
  console.log('🚀 DASHBOARD PERFORMANCE METRICS');
  console.log('=====================================');
  console.log('Load Time: ' + loadTime + 'ms (Target: <2000ms) → ' + (loadTime < 2000 ? '✅ PASS' : '❌ FAIL'));
  console.log('DOM Content Loaded: ' + Math.round(metrics.domContentLoaded) + 'ms');
  console.log('First Paint: ' + Math.round(metrics.firstPaint) + 'ms');
  console.log('First Contentful Paint: ' + Math.round(metrics.firstContentfulPaint) + 'ms');
  
  const score = 100 - (loadTime > 2000 ? 30 : 0) - (metrics.firstContentfulPaint > 1000 ? 20 : 0);
  console.log('Performance Score: ' + Math.max(0, score) + '/100');
  console.log('Status: ' + (score >= 80 ? '🟢 EXCELLENT' : score >= 60 ? '🟡 GOOD' : '🔴 NEEDS_OPTIMIZATION'));
  
  await browser.close();
})();