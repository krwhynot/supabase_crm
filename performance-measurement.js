const { chromium } = require('playwright');

async function measureDashboardPerformance() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.coverage.startJSCoverage();
  await page.coverage.startCSSCoverage();
  
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting Dashboard Performance Analysis...');
    console.log('=====================================');
    
    const response = await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    const loadTime = Date.now() - startTime;
    
    const webVitals = await page.evaluate(() => {
      const metrics = {
        domContentLoaded: 0,
        loadEvent: 0,
        firstPaint: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0
      };
      
      if (typeof performance \!== 'undefined') {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
          metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.navigationStart;
          metrics.loadEvent = navigation.loadEventEnd - navigation.navigationStart;
        }
        
        performance.getEntriesByType('paint').forEach((entry) => {
          if (entry.name === 'first-paint') {
            metrics.firstPaint = entry.startTime;
          }
          if (entry.name === 'first-contentful-paint') {
            metrics.firstContentfulPaint = entry.startTime;
          }
        });
        
        const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
        if (lcpEntries.length > 0) {
          metrics.largestContentfulPaint = lcpEntries[lcpEntries.length - 1].startTime;
        }
      }
      
      return metrics;
    });
    
    const jsCoverage = await page.coverage.stopJSCoverage();
    const cssCoverage = await page.coverage.stopCSS();
    
    const jsUsage = jsCoverage.reduce((total, entry) => total + entry.text.length, 0);
    const cssUsage = cssCoverage.reduce((total, entry) => total + entry.text.length, 0);
    
    console.log('📊 PHASE 1: API TESTING RESULTS');
    console.log('=====================================');
    console.log('Dashboard Load Time: ' + loadTime + 'ms');
    console.log('Target: <2000ms → ' + (loadTime < 2000 ? '✅ PASS' : '❌ FAIL'));
    console.log('');
    
    console.log('🎯 Core Web Vitals:');
    console.log('DOM Content Loaded: ' + Math.round(webVitals.domContentLoaded) + 'ms');
    console.log('First Paint: ' + Math.round(webVitals.firstPaint) + 'ms');
    console.log('First Contentful Paint: ' + Math.round(webVitals.firstContentfulPaint) + 'ms');
    console.log('Largest Contentful Paint: ' + Math.round(webVitals.largestContentfulPaint) + 'ms');
    console.log('');
    
    console.log('📦 Resource Analysis:');
    console.log('JavaScript Bundle Size: ' + Math.round(jsUsage / 1024) + ' KB');
    console.log('CSS Bundle Size: ' + Math.round(cssUsage / 1024) + ' KB');
    console.log('Total Bundle Size: ' + Math.round((jsUsage + cssUsage) / 1024) + ' KB');
    console.log('Target: <500KB → ' + ((jsUsage + cssUsage) / 1024 < 500 ? '✅ PASS' : '❌ FAIL'));
    console.log('');
    
    let score = 100;
    if (loadTime > 2000) score -= 30;
    if (webVitals.firstContentfulPaint > 1000) score -= 20;
    if (webVitals.largestContentfulPaint > 2500) score -= 25;
    if ((jsUsage + cssUsage) / 1024 > 500) score -= 15;
    
    console.log('🏆 Performance Score: ' + Math.max(0, score) + '/100');
    console.log('Status: ' + (score >= 80 ? '🟢 EXCELLENT' : score >= 60 ? '🟡 GOOD' : '🔴 NEEDS_OPTIMIZATION'));
    console.log('=====================================');
    
    return { loadTime, webVitals, resourceUsage: { jsUsage, cssUsage }, performanceScore: Math.max(0, score) };
    
  } catch (error) {
    console.error('❌ Performance measurement failed:', error.message);
    return null;
  } finally {
    await browser.close();
  }
}

measureDashboardPerformance();
