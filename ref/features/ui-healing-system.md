# UI Healing System Reference

## Overview
The UI Healing System provides automated component validation and visual regression detection to maintain design system compliance and accessibility standards throughout development.

## System Architecture

### Core Components

**UIHealer Class** (`/tests/ui-healing.spec.ts`)
Central orchestrator for component validation and screenshot capture:

```typescript
class UIHealer {
  private scores: ComponentScore[] = []
  private screenshotDir = './screenshots'
  
  async captureAndEvaluate(page: Page, componentName: string, selector: string, viewport: string)
  private async evaluateComponent(page: Page, selector: string): Promise<string[]>
  private calculateScore(violations: string[]): number
  generateReport(): string
}
```

**ComponentScore Interface**
Standardized scoring system for component compliance:

```typescript
interface ComponentScore {
  name: string
  score: number        // 0-10 scale
  violations: string[]
  screenshot: string
  viewport: string
}
```

### Validation Categories

**1. Design Token Compliance**
Validates components against design system standards:
- Font family (Inter required)
- Font sizes (14px, 16px, 18px, 24px approved)
- Font weights (400 regular, 600 semibold)
- Color palette adherence
- Spacing and layout consistency

**2. Accessibility Validation**
Ensures WCAG 2.1 AA compliance:
- Proper ARIA attributes and labels
- Focus visibility and keyboard navigation
- Interactive element accessible names
- Screen reader compatibility
- Color contrast ratios

**3. Responsive Design Validation**
Verifies cross-device compatibility:
- Touch target minimum size (44px x 44px)
- Viewport adaptation behavior
- Content reflow and readability
- Mobile-first responsive breakpoints

## Scoring System

### Score Calculation
Components receive scores from 0-10 based on violation severity:

**Violation Penalties:**
- Critical Issues (component not found): -4 points
- Accessibility Issues: -2 points  
- Design Token Issues: -1.5 points
- Responsive Issues: -1 point
- Minor Issues: -0.5 points

**Thresholds:**
- **Passing Components**: Score ≥ 8/10
- **Failing Components**: Score < 8/10

### Validation Rules

**Design System Validation:**
```typescript
// Font family validation
if (!styles.fontFamily.includes('Inter')) {
  violations.push('Font family should use Inter from design system')
}

// Font size validation
const validFontSizes = ['14px', '16px', '18px', '24px']
if (!validFontSizes.some(size => styles.fontSize.includes(size))) {
  violations.push(`Font size ${styles.fontSize} not in design system`)
}
```

**Accessibility Validation:**
```typescript
// Interactive elements need accessible names
if (interactiveElements.includes(tagName) && !ariaLabel && !ariaLabelledBy) {
  violations.push('Interactive element missing accessible name')
}

// Focus visibility check
if (focusStyles.outline === 'none' && !focusStyles.boxShadow.includes('rgb')) {
  violations.push('Element lacks visible focus indicator')
}
```

**Touch Target Validation:**
```typescript
// Minimum touch target size for mobile
if (interactiveElements.includes(tagName)) {
  if (boundingBox.height < 44 || boundingBox.width < 44) {
    violations.push(`Touch target too small: ${width}x${height} (minimum 44x44)`)
  }
}
```

## Multi-Viewport Testing

### Viewport Configuration
Tests run across multiple device contexts:

**Desktop (Chrome)**
- Primary development and testing viewport
- Full feature validation and interaction testing
- Performance baseline measurements

**Tablet (iPad - 768x1024)**
- Touch interface validation
- Responsive layout verification  
- Accessibility compliance on tablets

**Mobile (WebKit)**
- Mobile-first responsive validation
- Touch target size compliance
- Performance on constrained devices

### Component Coverage

**Target Components for Validation:**
- Dashboard Layout (`min-h-screen.bg-gray-50`)
- Sidebar Navigation (`nav[data-sidebar]`) 
- Main Content Area (`main`)
- Contact List (`contact-list, [data-testid="contact-list"]`)
- Form Components (Primary buttons, input fields, form fields)
- Navigation Items (`nav a, .nav-item`)
- Card Components (`.card, [class*="card"]`)

## Automated Testing Integration

### Test Execution Flow

**Step 1: Visual Extraction**
```typescript
test('Step 1: Visual Extraction - Capture all key components', async ({ page, browserName }) => {
  const viewport = browserName === 'webkit' ? 'mobile' : 
                  browserName === 'firefox' ? 'tablet' : 'desktop'
  
  // Navigate and capture components
  await page.goto('/')
  await healer.captureAndEvaluate(page, 'Dashboard Layout', '.min-h-screen.bg-gray-50', viewport)
})
```

**Step 2: Component Analysis**
For each captured component:
1. Screenshot capture with disabled animations
2. Design token validation against Tailwind config
3. Accessibility audit with ARIA compliance
4. Responsive behavior verification
5. Score calculation and violation logging

**Step 3: Report Generation**
Automated report creation with:
- Failing components requiring repair (Score < 8)
- Compliant components (Score ≥ 8)
- Overall compliance rate calculation
- Screenshot references for visual debugging

### Report Format

**Sample Report Structure:**
```markdown
# UI Healing & Checkpoint Report

## ❌ COMPONENTS REQUIRING REPAIR (Score < 8)

### Contact Form (6.5/10) - tablet
**Violations:**
- Font size 12px not in design system (14px, 16px, 18px, 24px)
- Interactive element missing accessible name
- Touch target too small: 40x32 (minimum 44x44)

**Screenshot:** ./screenshots/contact-form-tablet-2025-01-31.png

## ✅ COMPLIANT COMPONENTS (Score ≥ 8)
- Dashboard Layout (9.5/10) - desktop ✅
- Sidebar Navigation (8.5/10) - tablet ✅

## 📊 SUMMARY
- Total Components Evaluated: 8
- Components Requiring Repair: 2
- Compliant Components: 6
- Overall Compliance Rate: 75%
```

## Integration with Development Workflow

### Continuous Integration
UI Healing runs as part of the comprehensive test suite:

**Execution Commands:**
```bash
# Full UI healing validation
npx playwright test tests/ui-healing.spec.ts

# Multi-browser validation
npx playwright test tests/ui-healing.spec.ts --project=desktop-chromium
npx playwright test tests/ui-healing.spec.ts --project=tablet

# Generate detailed reports
npx playwright test tests/ui-healing.spec.ts --reporter=html
```

### Pre-Deployment Validation
UI Healing serves as a quality gate:
- Automated execution before production deployments
- Compliance rate must maintain >85% threshold
- Critical violations block deployment pipeline
- Visual regression detection for component changes

## Error Recovery and Debugging

### Component Not Found Handling
```typescript
const elementExists = await element.count() > 0
if (!elementExists) {
  violations.push('Component not found on page')
  return violations
}
```

### Graceful Degradation
- Continues validation even if individual components fail
- Captures partial results for debugging
- Provides detailed error context in violations
- Maintains test execution flow despite individual failures

### Screenshot Management
- Automatic directory creation (`./screenshots`)
- Timestamped filename generation
- Cross-platform path handling
- Storage cleanup for CI environments

## Performance Considerations

### Optimization Strategies
- Disabled animations during screenshot capture
- Selective component validation (only visible elements)
- Parallel validation across viewport sizes
- Efficient DOM querying with specific selectors

### Resource Management
- Screenshot compression for storage efficiency
- Temporary file cleanup after test completion
- Memory management for large component sets
- Network request optimization during page loads

## Future Enhancements

### Planned Features
- Visual diff comparison with baseline screenshots
- Machine learning-based component recognition
- Automated repair suggestions for common violations
- Integration with design system documentation
- Performance impact measurement during validation

### Extensibility
- Plugin system for custom validation rules
- Configurable violation severity levels
- Custom scoring algorithms per component type
- Integration with external design systems