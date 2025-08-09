const { chromium, devices } = require('playwright');

async function testMobilePerformance() {
  console.log('📱 MOBILE PERFORMANCE TESTING');
  console.log('=============================');
  
  const deviceTests = ['iPhone 13', 'Pixel 5', 'iPad'];
  const results = {};
  
  for (const deviceName of deviceTests) {
    console.log(`\n📱 Testing ${deviceName}...`);
    
    const browser = await chromium.launch();
    const context = await browser.newContext({
      ...devices[deviceName]
    });
    const page = await context.newPage();
    
    try {
      const startTime = Date.now();
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      
      // Test touch responsiveness
      const touchTest = await page.evaluate(() => {
        // Simulate touch interactions
        const buttons = document.querySelectorAll('button');
        const links = document.querySelectorAll('a');
        
        return {
          touchTargets: buttons.length + links.length,
          averageTargetSize: buttons.length > 0 ? 
            Array.from(buttons).reduce((sum, btn) => {
              const rect = btn.getBoundingClientRect();
              return sum + Math.min(rect.width, rect.height);
            }, 0) / buttons.length : 0
        };
      });
      
      // Test viewport and responsive design
      const viewportTest = await page.evaluate(() => {
        const sidebar = document.querySelector('nav');
        const mainContent = document.querySelector('main');
        
        return {
          sidebarVisible: sidebar ? getComputedStyle(sidebar).display !== 'none' : false,
          mainContentWidth: mainContent ? mainContent.offsetWidth : 0,
          viewportWidth: window.innerWidth,
          responsive: window.innerWidth < 768 // Mobile breakpoint
        };
      });
      
      results[deviceName] = {
        loadTime,
        touchTargets: touchTest.touchTargets,
        averageTargetSize: Math.round(touchTest.averageTargetSize),
        sidebarVisible: viewportTest.sidebarVisible,
        responsive: viewportTest.responsive,
        viewportWidth: viewportTest.viewportWidth
      };
      
      console.log(`  Load Time: ${loadTime}ms`);
      console.log(`  Touch Targets: ${touchTest.touchTargets}`);
      console.log(`  Avg Target Size: ${Math.round(touchTest.averageTargetSize)}px`);
      console.log(`  Responsive Design: ${viewportTest.responsive ? '✅ YES' : '❌ NO'}`);
      console.log(`  Viewport Width: ${viewportTest.viewportWidth}px`);
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      results[deviceName] = { error: error.message };
    } finally {
      await browser.close();
    }
  }
  
  console.log('\n📊 Mobile Performance Summary:');
  console.log('===============================');
  
  const mobileMetrics = {
    averageLoadTime: 0,
    touchTargetCompliance: 0,
    responsiveDesignScore: 0
  };
  
  const validResults = Object.values(results).filter(r => !r.error);
  if (validResults.length > 0) {
    mobileMetrics.averageLoadTime = Math.round(
      validResults.reduce((sum, r) => sum + r.loadTime, 0) / validResults.length
    );
    
    mobileMetrics.touchTargetCompliance = Math.round(
      (validResults.filter(r => r.averageTargetSize >= 44).length / validResults.length) * 100
    );
    
    mobileMetrics.responsiveDesignScore = Math.round(
      (validResults.filter(r => r.responsive).length / validResults.length) * 100
    );
  }
  
  console.log(`Average Mobile Load Time: ${mobileMetrics.averageLoadTime}ms`);
  console.log(`Touch Target Compliance: ${mobileMetrics.touchTargetCompliance}% (Target: 100%)`);
  console.log(`Responsive Design Score: ${mobileMetrics.responsiveDesignScore}% (Target: 100%)`);
  
  // Mobile performance score
  let mobileScore = 100;
  if (mobileMetrics.averageLoadTime > 3000) mobileScore -= 30;
  if (mobileMetrics.touchTargetCompliance < 90) mobileScore -= 25;
  if (mobileMetrics.responsiveDesignScore < 90) mobileScore -= 20;
  
  console.log(`\n🏆 Mobile Performance Score: ${Math.max(0, mobileScore)}/100`);
  console.log(`Status: ${mobileScore >= 80 ? '🟢 MOBILE_READY' : mobileScore >= 60 ? '🟡 NEEDS_IMPROVEMENT' : '🔴 MOBILE_ISSUES'}`);
  
  return {
    deviceResults: results,
    mobileMetrics,
    mobileScore: Math.max(0, mobileScore)
  };
}

testMobilePerformance();