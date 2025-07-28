import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

interface ComponentScore {
  name: string;
  score: number;
  violations: string[];
  screenshot: string;
  viewport: string;
}

class UIHealer {
  private scores: ComponentScore[] = [];
  private screenshotDir = './screenshots';

  constructor() {
    // Ensure screenshots directory exists
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  async captureAndEvaluate(page: Page, componentName: string, selector: string, viewport: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = `${this.screenshotDir}/${componentName}-${viewport}-${timestamp}.png`;
    
    // Wait for component to be visible
    await page.waitForSelector(selector, { timeout: 5000 });
    
    // Capture screenshot
    await page.locator(selector).first().screenshot({ 
      path: screenshotPath,
      animations: 'disabled'
    });

    // Evaluate component against design standards
    const violations = await this.evaluateComponent(page, selector);
    const score = this.calculateScore(violations);

    const componentScore: ComponentScore = {
      name: componentName,
      score,
      violations,
      screenshot: screenshotPath,
      viewport
    };

    this.scores.push(componentScore);
    return componentScore;
  }

  private async evaluateComponent(page: Page, selector: string): Promise<string[]> {
    const violations: string[] = [];

    try {
      const element = page.locator(selector).first();
      
      // Check if element exists
      const elementExists = await element.count() > 0;
      if (!elementExists) {
        violations.push('Component not found on page');
        return violations;
      }

      // Check design token compliance
      const styles = await element.evaluate((el) => {
        const computedStyle = window.getComputedStyle(el);
        return {
          backgroundColor: computedStyle.backgroundColor,
          color: computedStyle.color,
          fontFamily: computedStyle.fontFamily,
          fontSize: computedStyle.fontSize,
          fontWeight: computedStyle.fontWeight,
          padding: computedStyle.padding,
          margin: computedStyle.margin,
          borderRadius: computedStyle.borderRadius,
          display: computedStyle.display,
          gap: computedStyle.gap
        };
      });

      // Validate against design tokens (from tailwind.config.js)
      await this.validateDesignTokens(styles, violations);
      
      // Check accessibility
      await this.validateAccessibility(page, element, violations);
      
      // Check responsive behavior
      await this.validateResponsiveness(page, element, violations);

    } catch (error) {
      violations.push(`Evaluation error: ${error}`);
    }

    return violations;
  }

  private async validateDesignTokens(styles: any, violations: string[]): Promise<void> {
    // Font family validation
    if (!styles.fontFamily.includes('Inter')) {
      violations.push('Font family should use Inter from design system');
    }

    // Font size validation (check against design system sizes)
    const validFontSizes = ['14px', '16px', '18px', '24px'];
    if (!validFontSizes.some(size => styles.fontSize.includes(size))) {
      violations.push(`Font size ${styles.fontSize} not in design system (14px, 16px, 18px, 24px)`);
    }

    // Color validation - check for design system colors
    const primaryBlue = 'rgb(59, 130, 246)'; // #3b82f6
    const successGreen = 'rgb(22, 163, 74)'; // #16a34a
    const dangerRed = 'rgb(220, 38, 38)'; // #dc2626

    // Font weight validation
    const validWeights = ['400', '600'];
    if (!validWeights.includes(styles.fontWeight)) {
      violations.push(`Font weight ${styles.fontWeight} should be 400 (regular) or 600 (semibold)`);
    }
  }

  private async validateAccessibility(page: Page, element: any, violations: string[]): Promise<void> {
    try {
      // Check for proper ARIA attributes
      const ariaLabel = await element.getAttribute('aria-label');
      const ariaLabelledBy = await element.getAttribute('aria-labelledby');
      const ariaDescribedBy = await element.getAttribute('aria-describedby');
      
      // Interactive elements should have accessible names
      const tagName = await element.evaluate((el: Element) => el.tagName.toLowerCase());
      const interactiveElements = ['button', 'a', 'input', 'select', 'textarea'];
      
      if (interactiveElements.includes(tagName) && !ariaLabel && !ariaLabelledBy) {
        violations.push('Interactive element missing accessible name (aria-label or aria-labelledby)');
      }

      // Check focus visibility
      await element.focus();
      const focusStyles = await element.evaluate((el) => {
        const computedStyle = window.getComputedStyle(el);
        return {
          outline: computedStyle.outline,
          outlineOffset: computedStyle.outlineOffset,
          boxShadow: computedStyle.boxShadow
        };
      });

      if (focusStyles.outline === 'none' && !focusStyles.boxShadow.includes('rgb')) {
        violations.push('Element lacks visible focus indicator');
      }

    } catch (error) {
      violations.push(`Accessibility check failed: ${error}`);
    }
  }

  private async validateResponsiveness(page: Page, element: any, violations: string[]): Promise<void> {
    try {
      // Check if element maintains proper spacing on different viewports
      const boundingBox = await element.boundingBox();
      if (!boundingBox) {
        violations.push('Element not visible for responsive check');
        return;
      }

      // Check minimum touch target size (44px x 44px)
      const tagName = await element.evaluate((el: Element) => el.tagName.toLowerCase());
      const interactiveElements = ['button', 'a', 'input'];
      
      if (interactiveElements.includes(tagName)) {
        if (boundingBox.height < 44 || boundingBox.width < 44) {
          violations.push(`Touch target too small: ${boundingBox.width}x${boundingBox.height} (minimum 44x44)`);
        }
      }

    } catch (error) {
      violations.push(`Responsive check failed: ${error}`);
    }
  }

  private calculateScore(violations: string[]): number {
    // Start with perfect score
    let score = 10;
    
    // Deduct points based on violation severity
    violations.forEach(violation => {
      if (violation.includes('not found') || violation.includes('Evaluation error')) {
        score -= 4; // Critical issues
      } else if (violation.includes('accessibility') || violation.includes('focus')) {
        score -= 2; // Accessibility issues
      } else if (violation.includes('Font') || violation.includes('Color')) {
        score -= 1.5; // Design token issues
      } else if (violation.includes('responsive') || violation.includes('Touch target')) {
        score -= 1; // Responsive issues
      } else {
        score -= 0.5; // Minor issues
      }
    });

    return Math.max(0, Math.round(score * 10) / 10); // Round to 1 decimal, minimum 0
  }

  getFailingComponents(): ComponentScore[] {
    return this.scores.filter(score => score.score < 8);
  }

  getPassingComponents(): ComponentScore[] {
    return this.scores.filter(score => score.score >= 8);
  }

  generateReport(): string {
    const failing = this.getFailingComponents();
    const passing = this.getPassingComponents();

    let report = '# UI Healing & Checkpoint Report\\n\\n';
    
    if (failing.length > 0) {
      report += '## ❌ COMPONENTS REQUIRING REPAIR (Score < 8)\\n\\n';
      failing.forEach(component => {
        report += `### ${component.name} (${component.score}/10) - ${component.viewport}\\n\\n`;
        report += `**Violations:**\\n`;
        component.violations.forEach(violation => {
          report += `- ${violation}\\n`;
        });
        report += `\\n**Screenshot:** ${component.screenshot}\\n\\n`;
      });
    }

    if (passing.length > 0) {
      report += '## ✅ COMPLIANT COMPONENTS (Score ≥ 8)\\n\\n';
      passing.forEach(component => {
        report += `- ${component.name} (${component.score}/10) - ${component.viewport} ✅\\n`;
      });
    }

    report += `\\n## 📊 SUMMARY\\n\\n`;
    report += `- Total Components Evaluated: ${this.scores.length}\\n`;
    report += `- Components Requiring Repair: ${failing.length}\\n`;
    report += `- Compliant Components: ${passing.length}\\n`;
    report += `- Overall Compliance Rate: ${Math.round((passing.length / this.scores.length) * 100)}%\\n`;

    return report;
  }
}

// Test suite for UI healing workflow
test.describe('UI Healing Workflow', () => {
  let healer: UIHealer;

  test.beforeEach(async () => {
    healer = new UIHealer();
  });

  test('Step 1: Visual Extraction - Capture all key components', async ({ page, browserName }) => {
    const viewport = browserName === 'webkit' ? 'mobile' : 
                    browserName === 'firefox' ? 'tablet' : 'desktop';
    
    // Navigate to dashboard
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Capture dashboard layout
    await healer.captureAndEvaluate(page, 'Dashboard Layout', '.min-h-screen.bg-gray-50', viewport);
    
    // Capture sidebar navigation
    await healer.captureAndEvaluate(page, 'Sidebar Navigation', 'nav[data-sidebar]', viewport);
    
    // Capture main content area
    await healer.captureAndEvaluate(page, 'Main Content', 'main', viewport);

    // Navigate to contacts and capture contact components
    try {
      await page.click('a[href="/contacts"]', { timeout: 3000 });
      await page.waitForLoadState('networkidle');
      
      // Capture contact list
      await healer.captureAndEvaluate(page, 'Contact List', '.contact-list, [data-testid="contact-list"]', viewport);
    } catch (e) {
      console.log('Contacts page not accessible, skipping contact components');
    }

    // Try to capture common UI components
    const components = [
      { name: 'Primary Button', selector: 'button[class*="primary"], .btn-primary, button[class*="bg-primary"]' },
      { name: 'Input Field', selector: 'input[type="text"], input[type="email"], .form-input' },
      { name: 'Form Field', selector: '.form-field, .input-field, .field-group' },
      { name: 'Navigation Item', selector: 'nav a, .nav-item, [role="navigation"] a' },
      { name: 'Card Component', selector: '.card, [class*="card"], .widget' }
    ];

    for (const component of components) {
      try {
        const elementExists = await page.locator(component.selector).count() > 0;
        if (elementExists) {
          await healer.captureAndEvaluate(page, component.name, component.selector, viewport);
        }
      } catch (e) {
        console.log(`Could not capture ${component.name}: ${e}`);
      }
    }

    // Generate and save report
    const report = healer.generateReport();
    const reportPath = `./screenshots/ui-healing-report-${viewport}-${new Date().toISOString().slice(0, 10)}.md`;
    fs.writeFileSync(reportPath, report);
    
    console.log(`\\n${report}`);
    console.log(`\\nReport saved to: ${reportPath}`);
    
    // Verify we captured at least some components
    expect(healer.scores.length).toBeGreaterThan(0);
  });
});