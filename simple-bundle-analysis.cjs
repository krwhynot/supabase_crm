const { chromium } = require('playwright');

async function simpleBundleAnalysis() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🔍 PHASE 3: BUNDLE & COMPONENT ANALYSIS');
  console.log('=======================================');
  
  try {
    // Track network requests for bundle size analysis
    const resources = [];
    page.on('response', response => {
      if (response.url().includes('localhost:3000') && 
          (response.url().includes('.js') || response.url().includes('.css'))) {
        resources.push({
          url: response.url(),
          status: response.status(),
          type: response.request().resourceType(),
          size: parseInt(response.headers()['content-length'] || '0')
        });
      }
    });
    
    console.log('\n📦 Loading Dashboard for Analysis...');
    const loadStart = Date.now();
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - loadStart;
    
    // Analyze loaded resources
    const jsResources = resources.filter(r => r.url.includes('.js'));
    const cssResources = resources.filter(r => r.url.includes('.css'));
    
    const totalJsSize = jsResources.reduce((total, resource) => total + resource.size, 0);
    const totalCssSize = cssResources.reduce((total, resource) => total + resource.size, 0);
    const totalBundleSize = totalJsSize + totalCssSize;
    
    console.log('\n📊 Bundle Size Analysis:');
    console.log('========================');
    console.log(`JavaScript Files: ${jsResources.length}`);
    console.log(`JavaScript Bundle Size: ${Math.round(totalJsSize / 1024)} KB`);
    console.log(`CSS Files: ${cssResources.length}`);
    console.log(`CSS Bundle Size: ${Math.round(totalCssSize / 1024)} KB`);
    console.log(`Total Bundle Size: ${Math.round(totalBundleSize / 1024)} KB`);
    console.log(`Target: <500KB → ${totalBundleSize < 500 * 1024 ? '✅ PASS' : '❌ FAIL'}`);
    
    // Vue 3 component analysis
    console.log('\n🔧 Vue 3 Component Analysis:');
    console.log('============================');
    
    const componentAnalysis = await page.evaluate(() => {
      // Analyze DOM structure for Vue components
      const totalElements = document.querySelectorAll('*').length;
      const vueComponents = document.querySelectorAll('[data-v-], .v-application, #app > div').length;
      const formElements = document.querySelectorAll('input, select, textarea, button').length;
      const links = document.querySelectorAll('a').length;
      const images = document.querySelectorAll('img').length;
      
      // Check for Vue 3 specific indicators
      const hasVue3 = !!(window.Vue || document.querySelector('[data-v-]') || document.querySelector('#app'));
      
      // Measure render performance
      const renderStart = performance.now();
      // Simulate a small DOM operation to measure responsiveness
      const testDiv = document.createElement('div');
      document.body.appendChild(testDiv);
      document.body.removeChild(testDiv);
      const renderTime = performance.now() - renderStart;
      
      return {
        totalElements,
        vueComponents,
        formElements,
        links,
        images,
        hasVue3,
        renderTime: renderTime.toFixed(2),
        domComplexity: totalElements > 1000 ? 'HIGH' : totalElements > 500 ? 'MEDIUM' : 'LOW'
      };
    });
    
    console.log(`Vue 3 Detected: ${componentAnalysis.hasVue3 ? '✅ YES' : '❌ NO'}`);
    console.log(`Total DOM Elements: ${componentAnalysis.totalElements}`);
    console.log(`Vue Components: ${componentAnalysis.vueComponents}`);
    console.log(`Form Elements: ${componentAnalysis.formElements}`);
    console.log(`Links: ${componentAnalysis.links}`);
    console.log(`Images: ${componentAnalysis.images}`);
    console.log(`DOM Complexity: ${componentAnalysis.domComplexity}`);
    console.log(`Render Performance: ${componentAnalysis.renderTime}ms`);
    
    // Dashboard specific analysis
    console.log('\n📈 Dashboard Performance Issues:');
    console.log('================================');
    
    const performanceIssues = [];
    
    if (loadTime > 3000) {
      performanceIssues.push({
        issue: 'Slow Dashboard Loading',
        severity: 'CRITICAL',
        impact: `${loadTime}ms load time (Target: <2000ms)`,
        solution: 'Implement code splitting and lazy loading'
      });
    }
    
    if (totalBundleSize > 500 * 1024) {
      performanceIssues.push({
        issue: 'Large Bundle Size',
        severity: 'HIGH', 
        impact: `${Math.round(totalBundleSize / 1024)}KB bundle (Target: <500KB)`,
        solution: 'Tree shaking, code splitting, and unused code removal'
      });
    }
    
    if (componentAnalysis.totalElements > 1000) {
      performanceIssues.push({
        issue: 'High DOM Complexity',
        severity: 'MEDIUM',
        impact: `${componentAnalysis.totalElements} DOM elements`,
        solution: 'Component virtualization and lazy rendering'
      });
    }
    
    if (jsResources.length > 10) {
      performanceIssues.push({
        issue: 'Too Many JavaScript Files',
        severity: 'MEDIUM',
        impact: `${jsResources.length} separate JS files`,
        solution: 'Bundle consolidation and HTTP/2 optimization'
      });
    }
    
    if (performanceIssues.length === 0) {
      console.log('✅ No critical performance issues detected');
    } else {
      performanceIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.issue} (${issue.severity})`);
        console.log(`   Impact: ${issue.impact}`);
        console.log(`   Solution: ${issue.solution}`);
      });
    }
    
    // Generate performance score
    let performanceScore = 100;
    performanceIssues.forEach(issue => {
      if (issue.severity === 'CRITICAL') performanceScore -= 30;
      else if (issue.severity === 'HIGH') performanceScore -= 20;
      else if (issue.severity === 'MEDIUM') performanceScore -= 10;
    });
    
    console.log('\n🏆 Bundle Performance Assessment:');
    console.log('=================================');
    console.log(`Performance Score: ${Math.max(0, performanceScore)}/100`);
    console.log(`Status: ${performanceScore >= 80 ? '🟢 OPTIMIZED' : performanceScore >= 60 ? '🟡 NEEDS_IMPROVEMENT' : '🔴 CRITICAL_ISSUES'}`);
    
    await browser.close();
    
    return {
      bundleMetrics: {
        jsSize: Math.round(totalJsSize / 1024),
        cssSize: Math.round(totalCssSize / 1024),
        totalSize: Math.round(totalBundleSize / 1024),
        jsFiles: jsResources.length,
        cssFiles: cssResources.length
      },
      componentAnalysis,
      performanceIssues,
      performanceScore: Math.max(0, performanceScore),
      loadTime
    };
    
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message);
    await browser.close();
    return null;
  }
}

simpleBundleAnalysis();