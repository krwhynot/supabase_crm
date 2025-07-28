import { test, expect } from '@playwright/test';

test.describe('Navigation Component Validation', () => {
  test('Navigation Item meets design standards after repair', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find navigation items
    const dashboardLink = page.locator('a[href="/"]').first();
    const contactsLink = page.locator('a[href="/contacts"]').first();

    // ✅ In-test checkpoint: Verify font weight is semibold (600)
    const dashboardFontWeight = await dashboardLink.evaluate((el) => {
      return window.getComputedStyle(el).fontWeight;
    });
    expect(dashboardFontWeight).toBe('600');
    console.log('✅ Font weight validation passed: 600 (semibold)');

    // ✅ In-test checkpoint: Verify aria-label is present for accessibility
    const dashboardAriaLabel = await dashboardLink.getAttribute('aria-label');
    expect(dashboardAriaLabel).toBe('Navigate to Dashboard');
    console.log('✅ Accessibility validation passed: aria-label present');

    const contactsAriaLabel = await contactsLink.getAttribute('aria-label');
    expect(contactsAriaLabel).toBe('Navigate to Contacts');
    console.log('✅ Accessibility validation passed: aria-label present for contacts');

    // ✅ In-test checkpoint: Verify touch target size is at least 44x44
    const dashboardBoundingBox = await dashboardLink.boundingBox();
    expect(dashboardBoundingBox).not.toBeNull();
    
    if (dashboardBoundingBox) {
      expect(dashboardBoundingBox.height).toBeGreaterThanOrEqual(44);
      expect(dashboardBoundingBox.width).toBeGreaterThanOrEqual(44);
      console.log(`✅ Touch target validation passed: ${dashboardBoundingBox.width}x${dashboardBoundingBox.height} (minimum 44x44)`);
    }

    // ✅ In-test checkpoint: Verify proper hover state styling
    await dashboardLink.hover();
    const hoverBackgroundColor = await dashboardLink.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    // Should have hover background (not transparent)
    expect(hoverBackgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    console.log('✅ Hover state validation passed: proper background color on hover');

    // ✅ In-test checkpoint: Verify focus ring is visible
    await dashboardLink.focus();
    const focusOutline = await dashboardLink.evaluate((el) => {
      const computedStyle = window.getComputedStyle(el);
      return {
        outline: computedStyle.outline,
        boxShadow: computedStyle.boxShadow
      };
    });
    
    // Should have focus ring (either outline or box-shadow)
    const hasFocusIndicator = focusOutline.outline !== 'none' || focusOutline.boxShadow !== 'none';
    expect(hasFocusIndicator).toBe(true);
    console.log('✅ Focus indicator validation passed: visible focus ring');

    console.log('🎉 All navigation component validations passed!');
  });

  test('Navigation component passes comprehensive design evaluation', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test navigation on multiple viewports
    const viewports = [
      { width: 1280, height: 720, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(300); // Allow responsive changes

      const navLink = page.locator('a[href="/"]').first();
      
      // Comprehensive validation
      const isVisible = await navLink.isVisible();
      expect(isVisible).toBe(true);

      const boundingBox = await navLink.boundingBox();
      if (boundingBox) {
        // Touch target requirements
        expect(boundingBox.height).toBeGreaterThanOrEqual(44);
        
        console.log(`✅ ${viewport.name} viewport: Navigation accessible and properly sized`);
      }
    }
  });
});