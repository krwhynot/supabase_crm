const { chromium } = require('playwright');

async function measureAPIEndpoints() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const apiMetrics = {};
  const networkRequests = [];
  
  // Collect network requests
  page.on('response', response => {
    if (response.url().includes('localhost:3000') || response.url().includes('api')) {
      networkRequests.push({
        url: response.url(),
        status: response.status(),
        method: response.request().method(),
        size: response.headers()['content-length'] || 0
      });
    }
  });
  
  try {
    console.log('🔥 PHASE 2: LOAD TESTING & API PERFORMANCE');
    console.log('===========================================');
    
    // Test 1: Dashboard API Performance
    console.log('\n📊 Testing Dashboard Load...');
    const dashStart = Date.now();
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    const dashTime = Date.now() - dashStart;
    apiMetrics.dashboard = { loadTime: dashTime, target: 2000 };
    console.log(`Dashboard: ${dashTime}ms (Target: <2000ms) → ${dashTime < 2000 ? '✅ PASS' : '❌ FAIL'}`);
    
    // Test 2: Opportunities Page Performance
    console.log('\n💼 Testing Opportunities Page...');
    const oppStart = Date.now();
    await page.goto('http://localhost:3000/opportunities', { waitUntil: 'networkidle' });
    const oppTime = Date.now() - oppStart;
    apiMetrics.opportunities = { loadTime: oppTime, target: 2000 };
    console.log(`Opportunities: ${oppTime}ms (Target: <2000ms) → ${oppTime < 2000 ? '✅ PASS' : '❌ FAIL'}`);
    
    // Test 3: Contacts Page Performance
    console.log('\n👥 Testing Contacts Page...');
    const conStart = Date.now();
    await page.goto('http://localhost:3000/contacts', { waitUntil: 'networkidle' });
    const conTime = Date.now() - conStart;
    apiMetrics.contacts = { loadTime: conTime, target: 2000 };
    console.log(`Contacts: ${conTime}ms (Target: <2000ms) → ${conTime < 2000 ? '✅ PASS' : '❌ FAIL'}`);
    
    // Test 4: Interactions Page Performance  
    console.log('\n🔄 Testing Interactions Page...');
    const intStart = Date.now();
    await page.goto('http://localhost:3000/interactions', { waitUntil: 'networkidle' });
    const intTime = Date.now() - intStart;
    apiMetrics.interactions = { loadTime: intTime, target: 2000 };
    console.log(`Interactions: ${intTime}ms (Target: <2000ms) → ${intTime < 2000 ? '✅ PASS' : '❌ FAIL'}`);
    
    // Test 5: Navigation Performance (Critical UX metric)
    console.log('\n🧭 Testing Navigation Performance...');
    const navStart = Date.now();
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    const navTime = Date.now() - navStart;
    apiMetrics.navigation = { loadTime: navTime, target: 1000 };
    console.log(`Navigation: ${navTime}ms (Target: <1000ms) → ${navTime < 1000 ? '✅ PASS' : '❌ FAIL'}`);
    
    await browser.close();
    
    // Performance Analysis
    console.log('\n📈 PERFORMANCE ANALYSIS');
    console.log('========================');
    
    const totalTests = Object.keys(apiMetrics).length;
    const passedTests = Object.values(apiMetrics).filter(metric => metric.loadTime < metric.target).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Pass Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    // Critical Issues
    const criticalIssues = [];
    Object.entries(apiMetrics).forEach(([page, metric]) => {
      if (metric.loadTime > metric.target) {
        const severity = metric.loadTime > metric.target * 2 ? 'CRITICAL' : 'HIGH';
        criticalIssues.push({
          page: page,
          loadTime: metric.loadTime,
          target: metric.target,
          severity: severity,
          impact: metric.loadTime - metric.target
        });
      }
    });
    
    console.log('\n🚨 CRITICAL PERFORMANCE ISSUES:');
    if (criticalIssues.length === 0) {
      console.log('✅ No critical performance issues detected');
    } else {
      criticalIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.page.toUpperCase()}`);
        console.log(`   Load Time: ${issue.loadTime}ms (Target: ${issue.target}ms)`);
        console.log(`   Severity: ${issue.severity}`);
        console.log(`   Impact: +${issue.impact}ms slower than target`);
      });
    }
    
    // Performance Score Calculation
    let score = 100;
    criticalIssues.forEach(issue => {
      if (issue.severity === 'CRITICAL') score -= 25;
      else if (issue.severity === 'HIGH') score -= 15;
    });
    
    console.log('\n🏆 OVERALL PERFORMANCE ASSESSMENT');
    console.log('==================================');
    console.log(`Performance Score: ${Math.max(0, score)}/100`);
    console.log(`Status: ${score >= 80 ? '🟢 PRODUCTION READY' : score >= 60 ? '🟡 NEEDS OPTIMIZATION' : '🔴 CRITICAL ISSUES'}`);
    
    if (score < 60) {
      console.log('\n⚠️  PRODUCTION READINESS: NOT READY');
      console.log('System requires immediate optimization before deployment');
    } else if (score < 80) {
      console.log('\n⚠️  PRODUCTION READINESS: CONDITIONAL');
      console.log('System can deploy with monitoring and optimization plan');
    } else {
      console.log('\n✅ PRODUCTION READINESS: APPROVED');
      console.log('System meets performance requirements for production');
    }
    
    return { apiMetrics, criticalIssues, performanceScore: Math.max(0, score), networkRequests };
    
  } catch (error) {
    console.error('❌ Load testing failed:', error.message);
    await browser.close();
    return null;
  }
}

measureAPIEndpoints();