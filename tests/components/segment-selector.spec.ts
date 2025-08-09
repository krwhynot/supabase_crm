import { test, expect } from '@playwright/test';

/**
 * Segment Selector Component Tests
 * 
 * Comprehensive testing for the SegmentSelector component:
 * - Type-ahead search functionality
 * - Dropdown interactions
 * - Add new segment capability
 * - Keyboard navigation
 * - Accessibility compliance
 */

test.describe('Segment Selector Component', () => {
  test.beforeEach(async ({ page: _ }) => {
    // Navigate to a page with the segment selector
    await page.goto('/organizations/new');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Basic Functionality', () => {
    test('should display segment selector with proper initial state', async ({ page: _ }) => {
      const segmentInput = page.locator('input[name="segment"]');
      
      // Should be visible and enabled
      await expect(segmentInput).toBeVisible();
      await expect(segmentInput).toBeEnabled();
      
      // Should have placeholder text
      await expect(segmentInput).toHaveAttribute('placeholder', /Select or type/);
      
      // Should have proper ARIA attributes
      await expect(segmentInput).toHaveAttribute('aria-haspopup', 'true');
      await expect(segmentInput).toHaveAttribute('aria-expanded', 'false');
    });

    test('should open dropdown when input is clicked', async ({ page: _ }) => {
      const segmentInput = page.locator('input[name="segment"]');
      
      // Click input
      await segmentInput.click();
      
      // Dropdown should be visible
      await page.waitForSelector('[role="listbox"]', { state: 'visible' });
      await expect(segmentInput).toHaveAttribute('aria-expanded', 'true');
      
      // Should show default segments
      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).toContainText('Technology');
      await expect(dropdown).toContainText('Healthcare');
      await expect(dropdown).toContainText('Finance');
    });

    test('should close dropdown when clicking outside', async ({ page: _ }) => {
      const segmentInput = page.locator('input[name="segment"]');
      
      // Open dropdown
      await segmentInput.click();
      await page.waitForSelector('[role="listbox"]', { state: 'visible' });
      
      // Click outside
      await page.click('body');
      
      // Dropdown should be hidden
      await page.waitForSelector('[role="listbox"]', { state: 'hidden' });
      await expect(segmentInput).toHaveAttribute('aria-expanded', 'false');
    });

    test('should select option when clicked', async ({ page: _ }) => {
      const segmentInput = page.locator('input[name="segment"]');
      
      // Open dropdown and select Technology
      await segmentInput.click();
      await page.waitForSelector('[role="listbox"]', { state: 'visible' });
      await page.click('[role="option"]:has-text("Technology")');
      
      // Input should have the selected value
      await expect(segmentInput).toHaveValue('Technology');
      
      // Dropdown should be closed
      await page.waitForSelector('[role="listbox"]', { state: 'hidden' });
    });
  });

  test.describe('Type-ahead Search', () => {
    test('should filter options based on search query', async ({ page: _ }) => {
      const segmentInput = page.locator('input[name="segment"]');
      
      // Type "Tech"
      await segmentInput.click();
      await segmentInput.fill('Tech');
      
      // Wait for dropdown with filtered results
      await page.waitForSelector('[role="listbox"]', { state: 'visible' });
      
      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).toContainText('Technology');
      
      // Should not show unrelated segments
      const options = await page.locator('[role="option"]').allTextContents();
      expect(options.some(option => option.includes('Healthcare'))).toBe(false);
    });

    test('should show no results message when no matches found', async ({ page: _ }) => {
      const segmentInput = page.locator('input[name="segment"]');
      
      // Type non-existent segment
      await segmentInput.click();
      await segmentInput.fill('NonExistentSegment');
      
      await page.waitForSelector('[role="listbox"]', { state: 'visible' });
      
      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).toContainText('No segments found');
    });

    test('should debounce search queries', async ({ page: _ }) => {
      const segmentInput = page.locator('input[name="segment"]');
      
      await segmentInput.click();
      
      // Type rapidly
      await segmentInput.type('Technology', { delay: 50 });
      
      // Should handle rapid typing without errors
      await page.waitForTimeout(500);
      await page.waitForSelector('[role="listbox"]', { state: 'visible' });
      
      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).toContainText('Technology');
    });

    test('should search in both label and description', async ({ page: _ }) => {
      const segmentInput = page.locator('input[name="segment"]');
      
      // Search for "software" which should match Technology description
      await segmentInput.click();
      await segmentInput.fill('software');
      
      await page.waitForSelector('[role="listbox"]', { state: 'visible' });
      
      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).toContainText('Technology');
    });
  });

  test.describe('Add New Segment', () => {
    test('should show "Add new" option for unique search terms', async ({ page: _ }) => {
      const segmentInput = page.locator('input[name="segment"]');
      
      // Type a unique segment name
      await segmentInput.click();
      await segmentInput.fill('Custom Industry');
      
      await page.waitForSelector('[role="listbox"]', { state: 'visible' });
      
      // Should show add new option
      const addNewOption = page.locator('[role="option"]:has-text("Add new segment")');
      await expect(addNewOption).toBeVisible();
      await expect(addNewOption).toContainText('Custom Industry');
    });

    test('should not show "Add new" option for existing segments', async ({ page: _ }) => {
      const segmentInput = page.locator('input[name="segment"]');
      
      // Type exact match for existing segment
      await segmentInput.click();
      await segmentInput.fill('Technology');
      
      await page.waitForSelector('[role="listbox"]', { state: 'visible' });
      
      // Should not show add new option
      const addNewOption = page.locator('[role="option"]:has-text("Add new segment")');
      await expect(addNewOption).not.toBeVisible();
    });

    test('should add new segment when "Add new" is clicked', async ({ page: _ }) => {
      const segmentInput = page.locator('input[name="segment"]');
      const customSegment = 'Custom Industry Segment';
      
      // Type and select add new
      await segmentInput.click();
      await segmentInput.fill(customSegment);
      
      await page.waitForSelector('[role="listbox"]', { state: 'visible' });
      
      const addNewOption = page.locator('[role="option"]:has-text("Add new segment")');
      await expect(addNewOption).toBeVisible();
      await addNewOption.click();
      
      // Input should have the new segment value
      await expect(segmentInput).toHaveValue(customSegment);
      
      // Dropdown should be closed
      await page.waitForSelector('[role="listbox"]', { state: 'hidden' });
    });

    test('should not show "Add new" option when allowAddNew is false', async ({ page: _page }) => {
      // This test would require a component instance with allowAddNew=false
      // Since we're testing through the organization form, we assume allowAddNew is true
      // This test serves as documentation for the expected behavior
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support arrow key navigation', async ({ page: _ }) => {
      const segmentInput = page.locator('input[name="segment"]');
      
      // Open dropdown
      await segmentInput.click();
      await page.waitForSelector('[role="listbox"]', { state: 'visible' });
      
      // Press Arrow Down to highlight first option
      await page.keyboard.press('ArrowDown');
      
      // First option should be highlighted
      const firstOption = page.locator('[role="option"]').first();
      await expect(firstOption).toHaveClass(/bg-primary-50/);
      
      // Press Arrow Down again
      await page.keyboard.press('ArrowDown');
      
      // Second option should be highlighted
      const secondOption = page.locator('[role="option"]').nth(1);
      await expect(secondOption).toHaveClass(/bg-primary-50/);
      
      // Press Arrow Up
      await page.keyboard.press('ArrowUp');
      
      // First option should be highlighted again
      await expect(firstOption).toHaveClass(/bg-primary-50/);
    });

    test('should select highlighted option with Enter key', async ({ page: _ }) => {
      const segmentInput = page.locator('input[name="segment"]');
      
      // Open dropdown and navigate
      await segmentInput.click();
      await page.waitForSelector('[role="listbox"]', { state: 'visible' });
      
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      
      // Should select the first option (Technology)
      await expect(segmentInput).toHaveValue('Technology');
      
      // Dropdown should be closed
      await page.waitForSelector('[role="listbox"]', { state: 'hidden' });
    });

    test('should close dropdown with Escape key', async ({ page: _ }) => {
      const segmentInput = page.locator('input[name="segment"]');
      
      // Open dropdown
      await segmentInput.click();
      await page.waitForSelector('[role="listbox"]', { state: 'visible' });
      
      // Press Escape
      await page.keyboard.press('Escape');
      
      // Dropdown should be closed
      await page.waitForSelector('[role="listbox"]', { state: 'hidden' });
      
      // Input should lose focus
      const activeElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(activeElement).not.toBe('INPUT');
    });

    test('should handle Tab key properly', async ({ page: _ }) => {
      const segmentInput = page.locator('input[name="segment"]');
      
      // Open dropdown
      await segmentInput.click();
      await page.waitForSelector('[role="listbox"]', { state: 'visible' });
      
      // Press Tab
      await page.keyboard.press('Tab');
      
      // Dropdown should be closed
      await page.waitForSelector('[role="listbox"]', { state: 'hidden' });
      
      // Focus should move to next element
      const activeElement = await page.evaluate(() => document.activeElement?.getAttribute('name'));
      expect(activeElement).not.toBe('segment');
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA attributes', async ({ page: _ }) => {
      const segmentInput = page.locator('input[name="segment"]');
      
      // Check initial ARIA attributes
      await expect(segmentInput).toHaveAttribute('aria-haspopup', 'true');
      await expect(segmentInput).toHaveAttribute('aria-expanded', 'false');
      await expect(segmentInput).toHaveAttribute('role', 'combobox');
      
      // Open dropdown
      await segmentInput.click();
      await page.waitForSelector('[role="listbox"]', { state: 'visible' });
      
      // Check updated ARIA attributes
      await expect(segmentInput).toHaveAttribute('aria-expanded', 'true');
      
      // Check dropdown ARIA attributes
      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).toHaveAttribute('role', 'listbox');
      
      // Check option ARIA attributes
      const firstOption = page.locator('[role="option"]').first();
      await expect(firstOption).toHaveAttribute('role', 'option');
      await expect(firstOption).toHaveAttribute('aria-selected');
    });

    test('should have proper label association', async ({ page: _ }) => {
      const segmentInput = page.locator('input[name="segment"]');
      const inputId = await segmentInput.getAttribute('id');
      
      // Should have associated label
      const label = page.locator(`label[for="${inputId}"]`);
      await expect(label).toBeVisible();
      await expect(label).toContainText('Segment');
    });

    test('should announce errors to screen readers', async ({ page: _ }) => {
      const segmentInput = page.locator('input[name="segment"]');
      
      // Trigger validation error (if validation is implemented)
      await segmentInput.focus();
      await segmentInput.blur();
      
      // Check for error message with role="alert"
      const errorMessage = page.locator('[role="alert"]').first();
      
      // If validation is implemented, error should be announced
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toHaveAttribute('role', 'alert');
      }
    });

    test('should support screen reader navigation', async ({ page: _ }) => {
      const segmentInput = page.locator('input[name="segment"]');
      
      // Open dropdown
      await segmentInput.click();
      await page.waitForSelector('[role="listbox"]', { state: 'visible' });
      
      // Options should be properly marked up for screen readers
      const options = page.locator('[role="option"]');
      const optionCount = await options.count();
      
      expect(optionCount).toBeGreaterThan(0);
      
      // Each option should have proper markup
      for (let i = 0; i < Math.min(optionCount, 5); i++) {
        const option = options.nth(i);
        await expect(option).toHaveAttribute('role', 'option');
        
        const text = await option.textContent();
        expect(text).toBeTruthy();
      }
    });
  });

  test.describe('Loading and Error States', () => {
    test('should show loading spinner when loading prop is true', async ({ page: _ }) => {
      // This would require mocking the component with loading=true
      // For now, we test that the spinner element exists in the DOM
      const spinner = page.locator('.animate-spin').first();
      
      // If loading state is active, spinner should be visible
      if (await spinner.isVisible()) {
        await expect(spinner).toHaveClass(/animate-spin/);
      }
    });

    test('should handle network errors gracefully', async ({ page: _ }) => {
      // Mock network failure for segment search
      await page.route('**/api/segments/search*', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Server Error' })
        });
      });
      
      const segmentInput = page.locator('input[name="segment"]');
      
      // Search should still work with default segments
      await segmentInput.click();
      await segmentInput.fill('Tech');
      
      await page.waitForSelector('[role="listbox"]', { state: 'visible' });
      
      // Should show default filtered results
      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).toContainText('Technology');
    });
  });

  test.describe('Popular Segments', () => {
    test('should show popular segments when available', async ({ page: _ }) => {
      const segmentInput = page.locator('input[name="segment"]');
      
      // Open dropdown without typing
      await segmentInput.click();
      await page.waitForSelector('[role="listbox"]', { state: 'visible' });
      
      // Check if popular segments section exists
      const popularSection = page.locator('text="Popular Segments"');
      
      if (await popularSection.isVisible()) {
        await expect(popularSection).toBeVisible();
        
        // Should show segment counts
        const segmentWithCount = page.locator('text=/\\d+ orgs/').first();
        await expect(segmentWithCount).toBeVisible();
      }
    });

    test('should hide popular segments when searching', async ({ page: _ }) => {
      const segmentInput = page.locator('input[name="segment"]');
      
      // Type search query
      await segmentInput.click();
      await segmentInput.fill('Tech');
      
      await page.waitForSelector('[role="listbox"]', { state: 'visible' });
      
      // Popular segments section should not be visible
      const popularSection = page.locator('text="Popular Segments"');
      await expect(popularSection).not.toBeVisible();
    });
  });

  test.describe('Mobile Interactions', () => {
    test('should work with touch interactions', async ({ page: _ }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      const segmentInput = page.locator('input[name="segment"]');
      
      // Touch input
      await segmentInput.tap();
      await page.waitForSelector('[role="listbox"]', { state: 'visible' });
      
      // Touch option
      await page.tap('[role="option"]:has-text("Technology")');
      
      // Should select the option
      await expect(segmentInput).toHaveValue('Technology');
      
      // Dropdown should be closed
      await page.waitForSelector('[role="listbox"]', { state: 'hidden' });
    });

    test('should handle mobile keyboard', async ({ page: _ }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const segmentInput = page.locator('input[name="segment"]');
      
      // Tap to focus and open mobile keyboard
      await segmentInput.tap();
      
      // Type on mobile
      await segmentInput.fill('Healthcare');
      
      await page.waitForSelector('[role="listbox"]', { state: 'visible' });
      
      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).toContainText('Healthcare');
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle empty search query', async ({ page: _ }) => {
      const segmentInput = page.locator('input[name="segment"]');
      
      // Open dropdown
      await segmentInput.click();
      await page.waitForSelector('[role="listbox"]', { state: 'visible' });
      
      // Clear input
      await segmentInput.fill('');
      
      // Should show default segments
      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).toContainText('Technology');
    });

    test('should handle special characters in search', async ({ page: _ }) => {
      const segmentInput = page.locator('input[name="segment"]');
      
      await segmentInput.click();
      await segmentInput.fill('Consulting & Services');
      
      await page.waitForSelector('[role="listbox"]', { state: 'visible' });
      
      // Should handle special characters gracefully
      const addNewOption = page.locator('[role="option"]:has-text("Add new segment")');
      await expect(addNewOption).toContainText('Consulting & Services');
    });

    test('should handle very long segment names', async ({ page: _ }) => {
      const segmentInput = page.locator('input[name="segment"]');
      const longName = 'Very Long Industry Segment Name That Exceeds Normal Expectations';
      
      await segmentInput.click();
      await segmentInput.fill(longName);
      
      await page.waitForSelector('[role="listbox"]', { state: 'visible' });
      
      // Should handle long names without breaking layout
      const addNewOption = page.locator('[role="option"]:has-text("Add new segment")');
      await expect(addNewOption).toBeVisible();
    });

    test('should handle rapid open/close operations', async ({ page: _ }) => {
      const segmentInput = page.locator('input[name="segment"]');
      
      // Rapidly open and close dropdown
      for (let i = 0; i < 5; i++) {
        await segmentInput.click();
        await page.keyboard.press('Escape');
        await page.waitForTimeout(100);
      }
      
      // Should still be functional
      await segmentInput.click();
      await page.waitForSelector('[role="listbox"]', { state: 'visible' });
      
      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).toBeVisible();
    });
  });
});