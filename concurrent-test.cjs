const { chromium } = require('playwright');

async function simulateUser(userId) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const userMetrics = {
    userId: userId,
    dashboardTime: 0,
    opportunitiesTime: 0,
    contactsTime: 0,
    totalTime: 0,
    errors: 0
  };
  
  try {
    const totalStart = Date.now();
    
    // Simulate user journey
    const dashStart = Date.now();
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    userMetrics.dashboardTime = Date.now() - dashStart;
    
    const oppStart = Date.now();
    await page.goto('http://localhost:3000/opportunities', { waitUntil: 'domcontentloaded' });
    userMetrics.opportunitiesTime = Date.now() - oppStart;
    
    const conStart = Date.now();
    await page.goto('http://localhost:3000/contacts', { waitUntil: 'domcontentloaded' });
    userMetrics.contactsTime = Date.now() - conStart;
    
    userMetrics.totalTime = Date.now() - totalStart;
    
  } catch (error) {
    userMetrics.errors++;
    console.log(`User ${userId} encountered error: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  return userMetrics;
}

async function runConcurrentUserTest() {
  console.log('🚀 CONCURRENT USER LOAD TESTING');
  console.log('=================================');
  
  const userCounts = [1, 5, 10];
  const results = {};
  
  for (const userCount of userCounts) {
    console.log(`\n👥 Testing ${userCount} Concurrent Users...`);
    
    const startTime = Date.now();
    const userPromises = [];
    
    for (let i = 0; i < userCount; i++) {
      userPromises.push(simulateUser(i + 1));
    }
    
    const userResults = await Promise.all(userPromises);
    const totalTime = Date.now() - startTime;
    
    // Calculate metrics
    const avgDashboard = userResults.reduce((sum, user) => sum + user.dashboardTime, 0) / userCount;
    const avgOpportunities = userResults.reduce((sum, user) => sum + user.opportunitiesTime, 0) / userCount;
    const avgContacts = userResults.reduce((sum, user) => sum + user.contactsTime, 0) / userCount;
    const avgTotal = userResults.reduce((sum, user) => sum + user.totalTime, 0) / userCount;
    const totalErrors = userResults.reduce((sum, user) => sum + user.errors, 0);
    
    results[userCount] = {
      totalTime,
      avgDashboard: Math.round(avgDashboard),
      avgOpportunities: Math.round(avgOpportunities),
      avgContacts: Math.round(avgContacts),
      avgTotal: Math.round(avgTotal),
      errorRate: (totalErrors / userCount) * 100,
      throughput: (userCount * 3) / (totalTime / 1000) // requests per second
    };
    
    console.log(`  Execution Time: ${totalTime}ms`);
    console.log(`  Avg Dashboard Load: ${results[userCount].avgDashboard}ms`);
    console.log(`  Avg Opportunities Load: ${results[userCount].avgOpportunities}ms`);
    console.log(`  Avg Contacts Load: ${results[userCount].avgContacts}ms`);
    console.log(`  Error Rate: ${results[userCount].errorRate}%`);
    console.log(`  Throughput: ${results[userCount].throughput.toFixed(2)} req/sec`);
  }
  
  console.log('\n📊 LOAD TESTING SUMMARY');
  console.log('========================');
  
  // Analyze scalability
  const scalabilityMetrics = {
    dashboardScaling: results[10].avgDashboard / results[1].avgDashboard,
    opportunitiesScaling: results[10].avgOpportunities / results[1].avgOpportunities,
    contactsScaling: results[10].avgContacts / results[1].avgContacts,
    throughputScaling: results[10].throughput / results[1].throughput
  };
  
  console.log(`Dashboard Performance Scaling: ${scalabilityMetrics.dashboardScaling.toFixed(2)}x`);
  console.log(`Opportunities Performance Scaling: ${scalabilityMetrics.opportunitiesScaling.toFixed(2)}x`);
  console.log(`Contacts Performance Scaling: ${scalabilityMetrics.contactsScaling.toFixed(2)}x`);
  console.log(`Throughput Efficiency: ${scalabilityMetrics.throughputScaling.toFixed(2)}x`);
  
  // Performance assessment
  let loadScore = 100;
  if (results[10].errorRate > 5) loadScore -= 30;
  if (scalabilityMetrics.dashboardScaling > 2) loadScore -= 20;
  if (results[10].throughput < 1) loadScore -= 25;
  
  console.log(`\n🏆 Load Testing Score: ${Math.max(0, loadScore)}/100`);
  console.log(`Concurrent User Capacity: ${loadScore >= 80 ? '🟢 EXCELLENT' : loadScore >= 60 ? '🟡 ADEQUATE' : '🔴 LIMITED'}`);
  
  return { results, scalabilityMetrics, loadScore: Math.max(0, loadScore) };
}

runConcurrentUserTest();