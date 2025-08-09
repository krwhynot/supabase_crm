const { chromium } = require('playwright');
const fs = require('fs');

async function analyzeBundlePerformance() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Enable detailed performance monitoring
  await page.coverage.startJSCoverage();
  await page.coverage.startCSSCoverage();
  
  console.log('🔍 PHASE 3: PERFORMANCE ANALYSIS');
  console.log('=================================');
  
  try {
    // Analyze resource loading
    const resources = [];
    page.on('response', response => {
      if (response.url().includes('localhost:3000')) {
        resources.push({
          url: response.url(),
          status: response.status(),
          size: response.headers()['content-length'] || 0,
          type: response.request().resourceType()
        });
      }
    });
    
    console.log('\n📦 Bundle Analysis - Loading Dashboard...');
    const loadStart = Date.now();
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - loadStart;
    
    // Get JavaScript and CSS coverage
    const jsCoverage = await page.coverage.stopJSCoverage();
    const cssCoverage = await page.coverage.stopCSSCoverage();
    
    // Analyze JavaScript usage
    const jsAnalysis = jsCoverage.map(entry => ({
      url: entry.url,
      totalBytes: entry.text.length,
      usedBytes: entry.ranges.reduce((used, range) => used + range.end - range.start, 0),
      unusedBytes: 0
    })).map(entry => ({
      ...entry,
      unusedBytes: entry.totalBytes - entry.usedBytes,
      utilization: ((entry.usedBytes / entry.totalBytes) * 100).toFixed(2)
    }));
    
    // Analyze CSS usage
    const cssAnalysis = cssCoverage.map(entry => ({
      url: entry.url,
      totalBytes: entry.text.length,
      usedBytes: entry.ranges.reduce((used, range) => used + range.end - range.start, 0),
      unusedBytes: 0
    })).map(entry => ({
      ...entry,
      unusedBytes: entry.totalBytes - entry.usedBytes,
      utilization: ((entry.usedBytes / entry.totalBytes) * 100).toFixed(2)
    }));
    
    // Calculate bundle metrics
    const totalJsBytes = jsAnalysis.reduce((total, entry) => total + entry.totalBytes, 0);
    const usedJsBytes = jsAnalysis.reduce((total, entry) => total + entry.usedBytes, 0);
    const totalCssBytes = cssAnalysis.reduce((total, entry) => total + entry.totalBytes, 0);
    const usedCssBytes = cssAnalysis.reduce((total, entry) => total + entry.usedBytes, 0);
    
    console.log('\n📊 Bundle Size Analysis:');
    console.log('========================');
    console.log(`JavaScript Bundle: ${Math.round(totalJsBytes / 1024)} KB`);
    console.log(`JavaScript Used: ${Math.round(usedJsBytes / 1024)} KB (${((usedJsBytes / totalJsBytes) * 100).toFixed(1)}%)`);
    console.log(`JavaScript Unused: ${Math.round((totalJsBytes - usedJsBytes) / 1024)} KB`);
    console.log(`CSS Bundle: ${Math.round(totalCssBytes / 1024)} KB`);
    console.log(`CSS Used: ${Math.round(usedCssBytes / 1024)} KB (${((usedCssBytes / totalCssBytes) * 100).toFixed(1)}%)`);
    console.log(`CSS Unused: ${Math.round((totalCssBytes - usedCssBytes) / 1024)} KB`);
    
    const totalBundle = totalJsBytes + totalCssBytes;
    const targetSize = 500 * 1024; // 500KB target
    console.log(`\nTotal Bundle Size: ${Math.round(totalBundle / 1024)} KB`);
    console.log(`Target: <500KB → ${totalBundle < targetSize ? '✅ PASS' : '❌ FAIL'}`);
    
    // Vue 3 component performance analysis
    console.log('\n🔧 Vue 3 Component Performance:');
    console.log('===============================');
    
    const componentMetrics = await page.evaluate(() => {
      // Check for Vue devtools performance data
      if (window.__VUE__) {
        return {
          componentCount: document.querySelectorAll('[data-v-]').length,
          reactiveElements: document.querySelectorAll('[data-reactivity]').length,
          vueVersion: '3.x detected'
        };
      }
      
      // Fallback analysis
      return {
        componentCount: document.querySelectorAll('div[class*="v-"], div[id*="app"]').length,
        totalElements: document.querySelectorAll('*').length,
        vueVersion: 'Vue 3 (inferred)'
      };
    });
    
    console.log(`Vue Version: ${componentMetrics.vueVersion}`);
    console.log(`Component Elements: ${componentMetrics.componentCount}`);
    console.log(`Total DOM Elements: ${componentMetrics.totalElements || 'N/A'}`);
    
    // Performance scoring
    let bundleScore = 100;
    if (totalBundle > targetSize) bundleScore -= 20;
    if ((usedJsBytes / totalJsBytes) < 0.5) bundleScore -= 25; // Poor JS utilization
    if ((usedCssBytes / totalCssBytes) < 0.3) bundleScore -= 15; // Poor CSS utilization
    if (loadTime > 3000) bundleScore -= 30; // Slow loading
    
    console.log('\n🎯 Optimization Opportunities:');
    console.log('==============================');
    
    const optimizations = [];
    
    if ((totalJsBytes - usedJsBytes) > 100 * 1024) {
      optimizations.push({
        type: 'JavaScript Tree Shaking',
        impact: 'HIGH',
        savings: `${Math.round((totalJsBytes - usedJsBytes) / 1024)}KB`,
        description: 'Remove unused JavaScript code through better tree shaking'
      });
    }
    
    if ((totalCssBytes - usedCssBytes) > 50 * 1024) {
      optimizations.push({
        type: 'CSS Purging',
        impact: 'MEDIUM',
        savings: `${Math.round((totalCssBytes - usedCssBytes) / 1024)}KB`,
        description: 'Remove unused CSS styles, especially from Tailwind'
      });
    }
    
    if (loadTime > 3000) {
      optimizations.push({
        type: 'Code Splitting',
        impact: 'CRITICAL',
        savings: 'Reduce initial load by 50-70%',
        description: 'Implement route-based code splitting for faster initial loads'
      });
    }
    
    if (componentMetrics.componentCount > 100) {
      optimizations.push({
        type: 'Component Lazy Loading',
        impact: 'MEDIUM',
        savings: 'Improve render performance',
        description: 'Lazy load components that are not immediately visible'
      });
    }
    
    optimizations.forEach((opt, index) => {
      console.log(`${index + 1}. ${opt.type} (${opt.impact} Impact)`);
      console.log(`   Potential Savings: ${opt.savings}`);
      console.log(`   Description: ${opt.description}`);
    });
    
    console.log('\n🏆 Bundle Performance Score: ' + Math.max(0, bundleScore) + '/100');
    console.log('Status: ' + (bundleScore >= 80 ? '🟢 OPTIMIZED' : bundleScore >= 60 ? '🟡 NEEDS_IMPROVEMENT' : '🔴 REQUIRES_OPTIMIZATION'));
    
    await browser.close();
    
    return {
      bundleMetrics: {
        totalJsKB: Math.round(totalJsBytes / 1024),
        usedJsKB: Math.round(usedJsBytes / 1024),
        totalCssKB: Math.round(totalCssBytes / 1024),
        usedCssKB: Math.round(usedCssBytes / 1024),
        totalBundleKB: Math.round(totalBundle / 1024)
      },
      componentMetrics,
      optimizations,
      bundleScore: Math.max(0, bundleScore),
      loadTime
    };
    
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message);
    await browser.close();
    return null;
  }
}

analyzeBundlePerformance();