# ADR-010: Playwright + Vitest Testing Framework Selection

## Status
- **Status**: Implemented
- **Date**: 2025-01-08
- **Deciders**: QA Team, Tech Lead
- **Consulted**: Development Team, DevOps Team
- **Informed**: All Stakeholders

## Context

We needed to establish a comprehensive testing strategy for our Vue 3 CRM application with the following requirements:

- **End-to-End Testing**: Full user journey testing across browsers
- **Unit Testing**: Component and utility function testing
- **Integration Testing**: API and store integration validation
- **Cross-Browser Testing**: Support for Chrome, Firefox, Safari, and Edge
- **Mobile Testing**: Responsive design and mobile interaction testing
- **Accessibility Testing**: WCAG compliance validation
- **Performance Testing**: Core Web Vitals and load time monitoring
- **Visual Regression**: UI consistency validation
- **CI/CD Integration**: Automated testing in deployment pipeline

The alternatives considered were:
1. **Playwright + Vitest**: Modern E2E testing with fast unit testing
2. **Cypress + Jest**: Popular E2E framework with established unit testing
3. **Selenium + Jest**: Traditional WebDriver with unit testing
4. **TestCafe + Vitest**: Cross-browser testing with modern unit framework
5. **Puppeteer + Jest**: Chrome-focused testing with unit tests

## Decision

We will use **Playwright for end-to-end testing** and **Vitest for unit testing**, providing comprehensive test coverage with modern tooling and excellent developer experience.

**Testing Architecture:**
- **Playwright**: E2E, integration, and visual testing
- **Vitest**: Unit tests for components, stores, and utilities
- **TypeScript**: Type-safe test development
- **CI/CD Integration**: Automated testing in GitHub Actions

## Rationale

### Playwright Advantages
- **Multi-Browser Support**: Native support for Chromium, Firefox, and WebKit
- **Modern Architecture**: Built for modern web applications and frameworks
- **Parallel Execution**: Fast test execution with parallel browser instances
- **Auto-Wait**: Intelligent waiting for elements without explicit waits
- **Network Interception**: API mocking and network condition simulation
- **Mobile Testing**: Device emulation for responsive testing
- **Visual Comparisons**: Screenshot comparison for visual regression testing

### Vitest Benefits
- **Vite Integration**: Native integration with our build tool
- **Fast Execution**: Instant test feedback with hot reload
- **TypeScript Support**: First-class TypeScript support
- **Jest Compatibility**: Jest-compatible API for easy migration
- **Component Testing**: Vue component testing with happy-dom
- **Coverage Reports**: Built-in code coverage reporting

### Combined Testing Strategy Benefits
- **Comprehensive Coverage**: From unit to full E2E testing
- **Developer Experience**: Fast feedback loops and excellent tooling
- **CI/CD Ready**: Easy integration with automated pipelines
- **Modern Tooling**: Latest testing practices and capabilities
- **Type Safety**: TypeScript support across all test types

### Performance Characteristics
- **Parallel Execution**: Both frameworks support parallel test execution
- **Fast Feedback**: Vitest provides instant unit test feedback
- **Efficient E2E**: Playwright optimizes browser automation
- **Resource Management**: Efficient browser resource usage

## Consequences

### Positive
- **Fast Test Execution**: Quick feedback during development
- **Comprehensive Coverage**: Unit, integration, and E2E testing
- **Cross-Browser Validation**: Consistent behavior across browsers
- **Visual Regression Detection**: Automated UI consistency checking
- **Accessibility Testing**: Automated WCAG compliance validation
- **Mobile Testing**: Responsive design validation
- **Type Safety**: TypeScript support across all tests

### Negative
- **Learning Curve**: Team needs to learn Playwright and Vitest APIs
- **Tool Complexity**: Managing two different testing frameworks
- **Browser Management**: Playwright browser installation and updates
- **Test Maintenance**: Keeping tests updated with UI changes

### Risks
- **Medium Risk**: Test flakiness in E2E tests
  - **Mitigation**: Use Playwright's auto-wait and retry mechanisms
- **Low Risk**: Performance impact of parallel test execution
  - **Mitigation**: Configure parallel limits based on CI environment
- **Medium Risk**: Visual test maintenance overhead
  - **Mitigation**: Strategic use of visual tests for critical UI components

## Implementation

### Test Structure Organization
```
tests/
├── e2e/                    # Playwright E2E tests
│   ├── auth/              # Authentication flows
│   ├── contacts/          # Contact management
│   ├── opportunities/     # Sales pipeline
│   ├── accessibility/     # WCAG compliance
│   └── visual/           # Visual regression
├── unit/                  # Vitest unit tests
│   ├── components/        # Vue component tests
│   ├── stores/           # Pinia store tests
│   ├── services/         # API service tests
│   └── utils/            # Utility function tests
└── fixtures/             # Test data and helpers
    ├── data/             # Test data
    ├── mocks/            # API mocks
    └── helpers/          # Test utilities
```

### Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI
  }
})
```

### Vitest Configuration
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/unit/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})
```

### E2E Test Example
```typescript
// tests/e2e/contacts/contact-management.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Contact Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contacts')
    await page.waitForLoadState('networkidle')
  })

  test('should create a new contact', async ({ page }) => {
    // Navigate to create contact page
    await page.click('[data-testid="create-contact-btn"]')
    await expect(page).toHaveURL('/contacts/new')

    // Fill in contact form
    await page.fill('[data-testid="contact-name"]', 'John Doe')
    await page.fill('[data-testid="contact-email"]', 'john@example.com')
    await page.fill('[data-testid="contact-phone"]', '+1234567890')
    
    // Select organization
    await page.click('[data-testid="organization-select"]')
    await page.click('[data-testid="organization-option-1"]')

    // Submit form
    await page.click('[data-testid="submit-contact"]')

    // Verify contact was created
    await expect(page).toHaveURL(/\/contacts\/[\w-]+/)
    await expect(page.locator('[data-testid="contact-name"]')).toContainText('John Doe')
  })

  test('should search and filter contacts', async ({ page }) => {
    // Search for contact
    await page.fill('[data-testid="search-input"]', 'john')
    await page.waitForTimeout(500) // Debounce

    // Verify search results
    await expect(page.locator('[data-testid="contact-list"]')).toContainText('John')

    // Apply organization filter
    await page.click('[data-testid="filter-organization"]')
    await page.click('[data-testid="org-filter-acme"]')

    // Verify filtered results
    await expect(page.locator('[data-testid="contact-count"]')).toContainText('2 contacts')
  })

  test('should be accessible', async ({ page }) => {
    const { injectAxe, checkA11y } = await import('axe-playwright')
    
    await injectAxe(page)
    await checkA11y(page, undefined, {
      tags: ['wcag2a', 'wcag2aa'],
      rules: {
        'color-contrast': { enabled: true }
      }
    })
  })
})
```

### Unit Test Example
```typescript
// tests/unit/stores/contactStore.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useContactStore } from '@/stores/contactStore'
import * as contactsApi from '@/services/contactsApi'

vi.mock('@/services/contactsApi')

describe('Contact Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should fetch contacts successfully', async () => {
    const mockContacts = [
      { id: '1', name: 'John Doe', email: 'john@example.com' }
    ]
    
    vi.mocked(contactsApi.getContacts).mockResolvedValue({
      data: mockContacts,
      error: null
    })

    const store = useContactStore()
    await store.fetchContacts()

    expect(store.contacts).toEqual(mockContacts)
    expect(store.loading).toBe(false)
    expect(store.error).toBe(null)
  })

  it('should handle API errors gracefully', async () => {
    vi.mocked(contactsApi.getContacts).mockRejectedValue(
      new Error('Network error')
    )

    const store = useContactStore()
    await store.fetchContacts()

    expect(store.contacts).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBe('Failed to fetch contacts')
  })

  it('should filter contacts by search query', () => {
    const store = useContactStore()
    store.contacts = [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
    ]

    store.setSearchQuery('john')
    
    expect(store.filteredContacts).toHaveLength(1)
    expect(store.filteredContacts[0].name).toBe('John Doe')
  })
})
```

### Component Testing Example
```typescript
// tests/unit/components/ContactCard.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ContactCard from '@/components/ContactCard.vue'

describe('ContactCard', () => {
  const mockContact = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    organization: { name: 'Acme Corp' }
  }

  it('should display contact information', () => {
    const wrapper = mount(ContactCard, {
      props: { contact: mockContact }
    })

    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.text()).toContain('john@example.com')
    expect(wrapper.text()).toContain('Acme Corp')
  })

  it('should emit edit event when edit button is clicked', async () => {
    const wrapper = mount(ContactCard, {
      props: { contact: mockContact }
    })

    await wrapper.find('[data-testid="edit-contact"]').trigger('click')
    
    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')[0]).toEqual([mockContact.id])
  })

  it('should handle missing optional data gracefully', () => {
    const minimalContact = {
      id: '1',
      name: 'John Doe'
    }

    const wrapper = mount(ContactCard, {
      props: { contact: minimalContact }
    })

    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.find('[data-testid="email"]').exists()).toBe(false)
  })
})
```

### CI/CD Integration
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:unit
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Related Decisions
- [ADR-004: Vue 3 + TypeScript Technology Stack Selection](./004-vue3-typescript-stack.md)
- [ADR-006: MCP Ecosystem Integration for AI-Assisted Development](./006-mcp-ecosystem-integration.md)
- [ADR-008: Pinia State Management Architecture](./008-pinia-state-management.md)

## Notes
- E2E tests focus on critical user journeys and cross-browser compatibility
- Unit tests provide fast feedback for component and business logic changes
- Visual regression tests implemented for key UI components
- Accessibility testing integrated into E2E test suite
- Performance testing monitors Core Web Vitals and load times
- Test data managed through fixtures for consistency and maintainability