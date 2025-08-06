# Development Workflow Guide

This guide outlines our development workflow, coding standards, and best practices for contributing to the Vue 3 + TypeScript + Supabase CRM system.

## 🔄 Git Workflow

### Branching Strategy

We use a **feature branch workflow** with the following branch structure:

```mermaid
gitgraph
    commit id: "Initial"
    branch develop
    checkout develop
    commit id: "Setup"
    
    branch feature/contact-management
    checkout feature/contact-management
    commit id: "Add contact form"
    commit id: "Add validation"
    commit id: "Add tests"
    
    checkout develop
    merge feature/contact-management
    commit id: "Merge feature"
    
    checkout main
    merge develop
    commit id: "Release v1.0"
```

### Branch Naming Conventions

```bash
# Feature branches
feature/contact-form-validation
feature/opportunity-dashboard
feature/principal-activity-tracking

# Bug fixes
fix/contact-search-performance
fix/opportunity-stage-validation

# Hotfixes
hotfix/security-patch-auth
hotfix/critical-data-loss

# Chores/maintenance
chore/update-dependencies
chore/improve-documentation
```

### Workflow Steps

#### 1. Create Feature Branch
```bash
# Ensure you're on the latest develop
git checkout develop
git pull origin develop

# Create and switch to feature branch
git checkout -b feature/your-feature-name

# Push branch to origin
git push -u origin feature/your-feature-name
```

#### 2. Development Process
```bash
# Make small, focused commits
git add src/components/ContactForm.vue
git commit -m "feat(contacts): add contact form validation

- Add Yup schema validation for contact fields
- Implement real-time validation feedback
- Add accessibility attributes for screen readers
- Include unit tests for validation logic"

# Push changes frequently
git push origin feature/your-feature-name
```

#### 3. Code Review Process
```bash
# Create pull request when feature is complete
gh pr create --title "feat(contacts): Contact form validation" \
             --body "Implements comprehensive form validation for contact creation"

# Address review feedback
git add .
git commit -m "fix: address code review feedback"
git push origin feature/your-feature-name
```

#### 4. Merge and Cleanup
```bash
# After PR approval and merge
git checkout develop
git pull origin develop
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

## 📝 Commit Message Standards

### Conventional Commits Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Commit Types
- **feat**: New features
- **fix**: Bug fixes
- **docs**: Documentation changes
- **style**: Code style changes (formatting, no logic changes)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process or auxiliary tool changes

### Examples

```bash
# Feature commit
git commit -m "feat(opportunities): implement batch opportunity creation

- Add multi-principal selection component
- Implement auto-naming for bulk operations
- Add progress tracking for batch processing
- Include validation for duplicate opportunities

Closes #123"

# Bug fix commit
git commit -m "fix(contacts): resolve search performance issue

- Optimize database query with proper indexing
- Add debouncing to search input
- Reduce API calls by 60%

Fixes #456"

# Documentation commit
git commit -m "docs(onboarding): add development workflow guide

- Document Git workflow and branching strategy
- Add commit message conventions
- Include code review process"
```

## 🔍 Code Review Process

### Pre-Review Checklist

Before creating a pull request, ensure:

```bash
# ✅ Code quality checks
npm run lint                    # ESLint passes
npm run type-check             # TypeScript compilation succeeds
npm run test:unit              # Unit tests pass

# ✅ Build verification
npm run build                  # Production build succeeds

# ✅ E2E testing
npm run test:e2e               # Critical user journeys work

# ✅ Accessibility testing
npm run test:accessibility     # WCAG compliance maintained
```

### Pull Request Template

```markdown
## Description
Brief description of the changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that causes existing functionality to change)
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Accessibility
- [ ] Keyboard navigation tested
- [ ] Screen reader compatibility verified
- [ ] Color contrast meets WCAG AA standards
- [ ] ARIA attributes properly implemented

## Performance
- [ ] No performance regressions introduced
- [ ] Bundle size impact assessed
- [ ] Database queries optimized if applicable

## Screenshots (if applicable)
Include screenshots for UI changes.

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Related issues linked
```

### Review Guidelines

#### For Reviewers
1. **Functionality**: Does the code work as intended?
2. **Code Quality**: Is the code clean, readable, and maintainable?
3. **Performance**: Are there any performance implications?
4. **Security**: Are there security vulnerabilities?
5. **Testing**: Are there adequate tests?
6. **Documentation**: Is documentation updated?

#### Review Comments Template
```markdown
# Positive feedback
✅ Great implementation of the validation logic!

# Suggestions
💡 Consider extracting this logic into a composable for reusability.

# Required changes
❌ This introduces a security vulnerability. Please use parameterized queries.

# Questions
❓ Why did you choose this approach over using the existing utility function?
```

## 🧪 Testing Standards

### Testing Pyramid

```mermaid
pyramid
    title Testing Strategy
    a["E2E Tests (Few, Critical Paths)"]
    b["Integration Tests (More, Component Interactions)"]  
    c["Unit Tests (Many, Individual Functions)"]
```

### Unit Testing (Vitest)

```typescript
// tests/unit/contact-validation.spec.ts
import { describe, it, expect } from 'vitest'
import { validateContactData } from '@/utils/validation'

describe('Contact Validation', () => {
  it('should validate required fields', () => {
    const invalidContact = { name: '', email: 'invalid-email' }
    const result = validateContactData(invalidContact)
    
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Name is required')
    expect(result.errors).toContain('Invalid email format')
  })
  
  it('should pass validation for valid contact', () => {
    const validContact = { 
      name: 'John Doe', 
      email: 'john@example.com',
      phone: '555-0123'
    }
    const result = validateContactData(validContact)
    
    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual([])
  })
})
```

### Component Testing (Playwright)

```typescript
// tests/components/contact-form.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Contact Form', () => {
  test('should display validation errors', async ({ page }) => {
    await page.goto('/contacts/new')
    
    // Submit empty form
    await page.click('[data-testid="submit-button"]')
    
    // Check validation errors
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible()
  })
  
  test('should create contact successfully', async ({ page }) => {
    await page.goto('/contacts/new')
    
    // Fill form
    await page.fill('[data-testid="name-input"]', 'John Doe')
    await page.fill('[data-testid="email-input"]', 'john@example.com')
    
    // Submit form
    await page.click('[data-testid="submit-button"]')
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page).toHaveURL('/contacts')
  })
})
```

### E2E Testing (Playwright)

```typescript
// tests/e2e/contact-management.spec.ts
import { test, expect } from '@playwright/test'

test('complete contact management workflow', async ({ page }) => {
  // Navigate to contacts
  await page.goto('/')
  await page.click('text=Contacts')
  
  // Create new contact
  await page.click('text=Add Contact')
  await page.fill('[data-testid="name-input"]', 'Jane Smith')
  await page.fill('[data-testid="email-input"]', 'jane@company.com')
  await page.click('[data-testid="submit-button"]')
  
  // Verify contact appears in list
  await expect(page.locator('text=Jane Smith')).toBeVisible()
  
  // Edit contact
  await page.click('[aria-label="Edit Jane Smith"]')
  await page.fill('[data-testid="phone-input"]', '555-0123')
  await page.click('[data-testid="save-button"]')
  
  // View contact details
  await page.click('text=Jane Smith')
  await expect(page.locator('text=555-0123')).toBeVisible()
})
```

### Test Organization

```
tests/
├── 📄 unit/                           # Vitest unit tests
│   ├── utils/validation.spec.ts       # Utility function tests
│   ├── stores/contacts.spec.ts        # Store logic tests
│   └── services/api.spec.ts           # API service tests
├── 📄 components/                     # Component tests
│   ├── ContactForm.spec.ts            # Form component tests
│   ├── OpportunityTable.spec.ts       # Table component tests
│   └── NavigationSidebar.spec.ts      # Navigation tests
├── 📄 integration/                    # Integration tests
│   ├── contact-workflow.spec.ts       # Cross-component workflows
│   └── opportunity-creation.spec.ts   # Feature integration tests
├── 📄 e2e/                           # End-to-end tests
│   ├── critical-user-journeys.spec.ts # Core application flows
│   └── regression-tests.spec.ts       # Prevent bug regression
├── 📄 accessibility/                  # Accessibility tests
│   ├── wcag-compliance.spec.ts        # WCAG 2.1 AA compliance
│   └── keyboard-navigation.spec.ts    # Keyboard accessibility
└── 📄 performance/                    # Performance tests
    ├── load-testing.spec.ts           # Load and stress tests
    └── core-web-vitals.spec.ts        # Performance metrics
```

## 💻 Coding Standards

### TypeScript Guidelines

#### Type Definitions
```typescript
// ✅ Good: Explicit interface definitions
interface ContactFormData {
  name: string
  email: string
  phone?: string
  organizationId?: string
}

// ✅ Good: Union types for enums
type ContactStatus = 'active' | 'inactive' | 'archived'

// ❌ Avoid: Using 'any' type
const processData = (data: any) => { ... }

// ✅ Better: Use generic types
const processData = <T>(data: T): ProcessedData<T> => { ... }
```

#### Function Declarations
```typescript
// ✅ Good: Explicit return types
const validateEmail = (email: string): ValidationResult => {
  // Implementation
}

// ✅ Good: Async function typing
const fetchContacts = async (filters: ContactFilters): Promise<Contact[]> => {
  // Implementation
}
```

### Vue Component Standards

#### Script Setup Pattern
```vue
<script setup lang="ts">
// ✅ Good: Props interface
interface Props {
  contactId: string
  readonly?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

// ✅ Good: Emits typing
const emit = defineEmits<{
  save: [contact: Contact]
  cancel: []
}>()

// ✅ Good: Reactive state
const loading = ref(false)
const contact = ref<Contact | null>(null)

// ✅ Good: Computed properties
const isFormValid = computed(() => {
  return contact.value?.name && contact.value?.email
})
</script>
```

#### Template Standards
```vue
<template>
  <!-- ✅ Good: Semantic HTML -->
  <form @submit.prevent="handleSubmit" class="contact-form">
    <fieldset :disabled="loading" class="form-fieldset">
      <legend class="form-legend">Contact Information</legend>
      
      <!-- ✅ Good: Accessibility attributes -->
      <label for="contact-name" class="form-label">
        Name <span aria-label="required">*</span>
      </label>
      <input
        id="contact-name"
        v-model="formData.name"
        type="text"
        required
        :aria-invalid="errors.name ? 'true' : 'false'"
        :aria-describedby="errors.name ? 'name-error' : undefined"
        class="form-input"
      />
      <div v-if="errors.name" id="name-error" role="alert" class="form-error">
        {{ errors.name }}
      </div>
    </fieldset>
  </form>
</template>
```

### CSS/Tailwind Standards

#### Component Styling
```vue
<template>
  <!-- ✅ Good: Semantic class names with Tailwind -->
  <div class="contact-card bg-white rounded-lg shadow-md p-6">
    <header class="contact-card__header border-b border-gray-200 pb-4 mb-4">
      <h2 class="contact-card__title text-xl font-semibold text-gray-900">
        {{ contact.name }}
      </h2>
    </header>
    
    <div class="contact-card__content space-y-2">
      <p class="contact-card__email text-sm text-gray-600">
        {{ contact.email }}
      </p>
    </div>
  </div>
</template>

<style scoped>
/* ✅ Good: Component-specific styles when needed */
.contact-card {
  /* Custom styles that can't be achieved with Tailwind */
}

.contact-card__title {
  /* Specific component styling */
}
</style>
```

#### Tailwind Best Practices
```vue
<!-- ✅ Good: Responsive design -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  
<!-- ✅ Good: State variants -->
<button class="btn-primary hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50">

<!-- ✅ Good: Dark mode support -->
<div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
```

## 🚀 Development Best Practices

### Performance Guidelines

#### Bundle Optimization
```typescript
// ✅ Good: Dynamic imports for code splitting
const ContactCreateView = defineAsyncComponent(() => 
  import('@/views/contacts/ContactCreateView.vue')
)

// ✅ Good: Tree-shaking friendly imports
import { debounce } from 'lodash-es'

// ❌ Avoid: Full library imports
import _ from 'lodash'
```

#### Component Performance
```vue
<script setup lang="ts">
// ✅ Good: Memoize expensive computations
const expensiveComputation = computed(() => {
  return heavyCalculation(props.data)
})

// ✅ Good: Use v-memo for expensive lists
const contactListKey = computed(() => `${searchTerm.value}-${sortOrder.value}`)
</script>

<template>
  <div v-for="contact in contacts" :key="contact.id" v-memo="[contact.updatedAt]">
    <ContactCard :contact="contact" />
  </div>
</template>
```

### Error Handling

#### API Error Handling
```typescript
// ✅ Good: Consistent error handling
export class ApiService {
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    try {
      const response = await this.supabase
        .from(endpoint)
        .select()
      
      if (response.error) {
        throw new ApiError(response.error.message, response.error.code)
      }
      
      return response.data
    } catch (error) {
      // Log error for monitoring
      console.error(`API request failed: ${endpoint}`, error)
      
      // Re-throw with context
      throw new ApiError(
        `Failed to fetch ${endpoint}`,
        'NETWORK_ERROR',
        error
      )
    }
  }
}
```

#### Component Error Handling
```vue
<script setup lang="ts">
const error = ref<string | null>(null)
const loading = ref(false)

const handleSubmit = async () => {
  try {
    loading.value = true
    error.value = null
    
    await contactsApi.create(formData.value)
    
    // Success handling
    emit('created')
    router.push('/contacts')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
  } finally {
    loading.value = false
  }
}
</script>
```

### Accessibility Best Practices

#### Form Accessibility
```vue
<template>
  <!-- ✅ Good: Proper form structure -->
  <form @submit.prevent="handleSubmit" novalidate>
    <div class="form-group">
      <label for="contact-email" class="form-label">
        Email Address
        <span class="required-indicator" aria-label="required">*</span>
      </label>
      
      <input
        id="contact-email"
        v-model="formData.email"
        type="email"
        required
        :aria-invalid="errors.email ? 'true' : 'false'"
        :aria-describedby="errors.email ? 'email-error' : 'email-help'"
        class="form-input"
      />
      
      <div id="email-help" class="form-help">
        We'll use this to contact you about opportunities
      </div>
      
      <div
        v-if="errors.email"
        id="email-error"
        role="alert"
        aria-live="polite"
        class="form-error"
      >
        {{ errors.email }}
      </div>
    </div>
  </form>
</template>
```

#### Keyboard Navigation
```vue
<script setup lang="ts">
const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Escape':
      emit('close')
      break
    case 'Enter':
      if (event.ctrlKey || event.metaKey) {
        handleSubmit()
      }
      break
  }
}
</script>

<template>
  <div @keydown="handleKeydown" tabindex="-1">
    <!-- Modal content -->
  </div>
</template>
```

## 📋 Definition of Done

Before marking a task as complete, ensure:

### Functional Requirements
- [ ] Feature works as specified in requirements
- [ ] All acceptance criteria met
- [ ] Edge cases handled appropriately
- [ ] Error states handled gracefully

### Code Quality
- [ ] Code follows established patterns and conventions
- [ ] TypeScript compilation succeeds without errors
- [ ] ESLint passes without warnings
- [ ] Code is properly documented

### Testing
- [ ] Unit tests written for business logic
- [ ] Component tests cover user interactions
- [ ] Integration tests verify feature workflows
- [ ] Accessibility tests pass WCAG 2.1 AA standards

### Performance
- [ ] No performance regressions introduced
- [ ] Bundle size impact assessed and acceptable
- [ ] Database queries optimized where applicable

### Documentation
- [ ] Code is self-documenting with clear variable names
- [ ] Complex logic includes comments explaining why
- [ ] Public APIs have JSDoc documentation
- [ ] User-facing changes documented in user guides

### Security
- [ ] No sensitive data exposed in client code
- [ ] Input validation implemented
- [ ] Authorization checks in place
- [ ] SQL injection prevention measures applied

## 🔄 Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: Continuous Integration

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Build application
      run: npm run build
```

### Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{vue,ts,js}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{md,json}": [
      "prettier --write"
    ]
  }
}
```

## 🎯 Next Steps

Now that you understand our development workflow:

1. **[Learn Feature Development Patterns](./04-feature-development.md)** - Practice building components
2. **[Set Up Your Tools](./05-tools-and-resources.md)** - Configure your development environment
3. **[Start Your First Contribution](./08-onboarding-checklist.md)** - Begin with a simple task

**Ready to start coding?** The next guide will walk you through practical feature development patterns and best practices.