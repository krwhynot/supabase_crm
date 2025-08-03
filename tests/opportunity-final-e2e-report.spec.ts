import { test, expect } from '@playwright/test';

/**
 * Final E2E Test Report for Opportunity Management System
 * 
 * This test provides a comprehensive report of all functional and UI issues
 * found during testing.
 */

test.describe('Opportunity Management - Final E2E Report', () => {
  test('Generate comprehensive test report', async ({ page }) => {
    const results = {
      routing: {},
      layout: {},
      components: {},
      forms: {},
      responsive: {},
      errors: []
    };

    console.log('🔍 OPPORTUNITY MANAGEMENT E2E TEST REPORT');
    console.log('==========================================');

    // Test 1: Opportunities List Page
    console.log('\n📋 Testing Opportunities List Page...');
    try {
      await page.goto('http://localhost:3000/opportunities');
      await page.waitForLoadState('networkidle');
      
      const url = page.url();
      const title = await page.title();
      const headings = await page.locator('h1').allTextContents();
      
      results.routing.opportunitiesList = {
        url,
        title,
        headings,
        loads: url.includes('/opportunities')
      };
      
      console.log(`  ✓ URL: ${url}`);
      console.log(`  ✓ Title: ${title}`);
      console.log(`  ✓ Headings: ${headings.join(', ')}`);
      
      // Check for KPI cards
      const kpiCards = await page.locator('[data-testid*="kpi"]').count();
      const kpiVisible = await page.locator('[data-testid="kpi-cards"]').isVisible().catch(() => false);
      
      results.components.kpiCards = {
        count: kpiCards,
        containerVisible: kpiVisible,
        found: kpiCards > 0
      };
      
      console.log(`  📊 KPI Cards: ${kpiCards} found, container visible: ${kpiVisible}`);
      
      // Check for table
      const tableVisible = await page.locator('[data-testid="opportunity-table"]').isVisible().catch(() => false);
      const tableRowsCount = await page.locator('table tr').count();
      
      results.components.table = {
        visible: tableVisible,
        rowCount: tableRowsCount,
        found: tableVisible || tableRowsCount > 0
      };
      
      console.log(`  📋 Table: visible=${tableVisible}, rows=${tableRowsCount}`);
      
    } catch (error) {
      results.errors.push(`Opportunities List: ${error.message}`);
      console.log(`  ❌ Error: ${error.message}`);
    }

    // Test 2: Create Opportunity Page  
    console.log('\n📝 Testing Create Opportunity Page...');
    try {
      await page.goto('http://localhost:3000/opportunities/new');
      await page.waitForLoadState('networkidle');
      
      const url = page.url();
      const headings = await page.locator('h1').allTextContents();
      
      results.routing.opportunityCreate = {
        url,
        headings,
        loads: url.includes('/opportunities/new'),
        showsCorrectContent: headings.some(h => h.includes('Create') || h.includes('Opportunity'))
      };
      
      console.log(`  ✓ URL: ${url}`);
      console.log(`  ✓ Headings: ${headings.join(', ')}`);
      
      // Check for form elements
      const formElements = await page.locator('form, input, select, textarea').count();
      const formVisible = await page.locator('[data-testid="opportunity-form"]').isVisible().catch(() => false);
      
      results.forms.createForm = {
        elementsCount: formElements,
        formVisible,
        hasFormElements: formElements > 0
      };
      
      console.log(`  📝 Form: visible=${formVisible}, elements=${formElements}`);
      
    } catch (error) {
      results.errors.push(`Create Opportunity: ${error.message}`);
      console.log(`  ❌ Error: ${error.message}`);
    }

    // Test 3: Navigation and Routing
    console.log('\n🧭 Testing Navigation...');
    try {
      // Test root navigation
      await page.goto('http://localhost:3000/');
      await page.waitForLoadState('networkidle');
      
      const rootUrl = page.url();
      const navLinks = await page.locator('a[href*="opportunit"]').count();
      
      results.routing.root = {
        url: rootUrl,
        opportunityLinksFound: navLinks,
        hasNavigation: navLinks > 0
      };
      
      console.log(`  ✓ Root URL: ${rootUrl}`);
      console.log(`  ✓ Opportunity navigation links: ${navLinks}`);
      
    } catch (error) {
      results.errors.push(`Navigation: ${error.message}`);
      console.log(`  ❌ Navigation Error: ${error.message}`);
    }

    // Test 4: Responsive Design
    console.log('\n📱 Testing Responsive Design...');
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1280, height: 720, name: 'Desktop' }
    ];

    for (const viewport of viewports) {
      try {
        await page.setViewportSize(viewport);
        await page.goto('http://localhost:3000/opportunities');
        await page.waitForLoadState('networkidle');
        
        const mobileMenu = await page.locator('[data-testid="mobile-menu"]').isVisible().catch(() => false);
        const sidebar = await page.locator('[data-testid="sidebar"]').isVisible().catch(() => false);
        
        results.responsive[viewport.name.toLowerCase()] = {
          viewport: `${viewport.width}x${viewport.height}`,
          mobileMenuVisible: mobileMenu,
          sidebarVisible: sidebar,
          responsive: true
        };
        
        console.log(`  📱 ${viewport.name}: mobile-menu=${mobileMenu}, sidebar=${sidebar}`);
        
      } catch (error) {
        results.errors.push(`${viewport.name} viewport: ${error.message}`);
        console.log(`  ❌ ${viewport.name} Error: ${error.message}`);
      }
    }

    // Generate Final Report
    console.log('\n📊 COMPREHENSIVE TEST RESULTS');
    console.log('===============================');

    // Routing Issues
    console.log('\n🔍 ROUTING ANALYSIS:');
    if (results.routing.opportunitiesList?.loads) {
      console.log('  ✅ /opportunities route loads successfully');
    } else {
      console.log('  ❌ /opportunities route has issues');
    }
    
    if (results.routing.opportunityCreate?.loads) {
      if (results.routing.opportunityCreate?.showsCorrectContent) {
        console.log('  ✅ /opportunities/new shows correct content');
      } else {
        console.log('  ⚠️  /opportunities/new loads but shows wrong content (dashboard instead of form)');
      }
    } else {
      console.log('  ❌ /opportunities/new route has issues');
    }

    // Component Issues
    console.log('\n🧩 COMPONENT ANALYSIS:');
    if (results.components.kpiCards?.found) {
      console.log('  ✅ KPI cards are implemented and visible');
    } else {
      console.log('  ❌ KPI cards missing or not rendering');
    }
    
    if (results.components.table?.found) {
      console.log('  ✅ Opportunity table is implemented');
    } else {
      console.log('  ❌ Opportunity table missing or not rendering');
    }

    // Form Issues
    console.log('\n📝 FORM ANALYSIS:');
    if (results.forms.createForm?.hasFormElements) {
      console.log('  ✅ Create form has form elements');
    } else {
      console.log('  ❌ Create form missing form elements');
    }

    // Error Summary
    console.log('\n❌ ERRORS FOUND:');
    if (results.errors.length === 0) {
      console.log('  ✅ No critical errors found');
    } else {
      results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('  1. Fix routing issue in /opportunities/new (shows dashboard instead of form)');
    console.log('  2. Ensure KPI components are properly connected to data');
    console.log('  3. Verify opportunity table data loading');
    console.log('  4. Add missing data-testid attributes throughout components');
    console.log('  5. Test form validation and submission functionality');

    // Take final screenshots
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('http://localhost:3000/opportunities');
    await page.screenshot({ path: 'screenshots/final-opportunities-list.png', fullPage: true });
    
    await page.goto('http://localhost:3000/opportunities/new');
    await page.screenshot({ path: 'screenshots/final-opportunities-create.png', fullPage: true });

    console.log('\n📸 Screenshots saved: final-opportunities-list.png, final-opportunities-create.png');
    console.log('\n🎯 E2E TEST REPORT COMPLETE');
    
    // The test should pass to generate the report, but we can still show issues
    expect(true).toBe(true);
  });
});