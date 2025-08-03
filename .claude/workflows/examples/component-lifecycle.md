# Component Development Lifecycle Example

This document demonstrates a real-world example of the frontend-quality chain workflow for developing a Vue 3 component in the CRM system.

## Scenario: Creating a New ContactCard Component

**Requirements:**
- Display contact information in a card format
- Support editing mode with form validation
- Mobile-responsive design
- Accessibility compliant (WCAG 2.1 AA)
- Integration with existing contact store

## Stage 1: Vue Component Implementation

**Agent**: `vue-component-architect`
**Duration**: 45 minutes
**Trigger**: User request - "Create a reusable ContactCard component for the dashboard"

### Initial Implementation

```vue
<!-- src/components/contacts/ContactCard.vue -->
<template>
  <div 
    class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
    :class="{ 'border-l-4 border-blue-500': isSelected }"
    role="article"
    :aria-labelledby="`contact-${contact.id}-name`"
  >
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <h3 
          :id="`contact-${contact.id}-name`"
          class="text-lg font-semibold text-gray-900"
        >
          {{ contact.firstName }} {{ contact.lastName }}
        </h3>
        
        <p class="text-sm text-gray-600 mt-1">
          {{ contact.title }} at {{ contact.organization?.name }}
        </p>
        
        <div class="mt-3 space-y-1">
          <div class="flex items-center text-sm text-gray-500">
            <EnvelopeIcon class="h-4 w-4 mr-2" aria-hidden="true" />
            <a 
              :href="`mailto:${contact.email}`"
              class="hover:text-blue-600 focus:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              {{ contact.email }}
            </a>
          </div>
          
          <div 
            v-if="contact.phone"
            class="flex items-center text-sm text-gray-500"
          >
            <PhoneIcon class="h-4 w-4 mr-2" aria-hidden="true" />
            <a 
              :href="`tel:${contact.phone}`"
              class="hover:text-blue-600 focus:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              {{ contact.phone }}
            </a>
          </div>
        </div>
      </div>
      
      <div class="ml-4 flex-shrink-0">
        <button
          @click="$emit('edit', contact)"
          class="p-2 text-gray-400 hover:text-gray-600 focus:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          :aria-label="`Edit ${contact.firstName} ${contact.lastName}`"
        >
          <PencilIcon class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
    
    <div 
      v-if="contact.tags && contact.tags.length > 0"
      class="mt-4 flex flex-wrap gap-2"
    >
      <span
        v-for="tag in contact.tags"
        :key="tag"
        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
      >
        {{ tag }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EnvelopeIcon, PhoneIcon, PencilIcon } from '@heroicons/vue/24/outline'
import type { Contact } from '@/types/contacts'

interface Props {
  contact: Contact
  isSelected?: boolean
}

interface Emits {
  edit: [contact: Contact]
}

defineProps<Props>()
defineEmits<Emits>()
</script>
```

### TypeScript Interface Definition

```typescript
// src/types/contacts.ts (updated)
export interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  title?: string
  organization?: {
    id: string
    name: string
  }
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface ContactCardProps {
  contact: Contact
  isSelected?: boolean
}

export interface ContactCardEmits {
  edit: [contact: Contact]
}
```

### Handoff Data Package

```yaml
handoff_package:
  source_agent: "vue-component-architect"
  target_agent: "quality-compliance-auditor"
  deliverable_type: "component"
  file_paths:
    - "src/components/contacts/ContactCard.vue"
    - "src/types/contacts.ts"
  validation_criteria:
    vue3_compliance: "Composition API with <script setup>"
    typescript_integration: "Full type safety with interfaces"
    accessibility_basic: "ARIA attributes and semantic HTML"
    responsive_design: "Mobile-first Tailwind classes"
  context:
    component_purpose: "Reusable contact display card for dashboard and lists"
    integration_points: "Contact store, routing to contact details"
    accessibility_requirements: "WCAG 2.1 AA compliance mandatory"
  priority: "high"
  timestamp: "2025-01-02T10:30:00Z"
```

## Stage 2: Quality Compliance Audit

**Agent**: `quality-compliance-auditor`
**Duration**: 20 minutes
**Receives**: Component implementation and handoff package

### Compliance Audit Report

```markdown
**AUDIT DECISION:** NEEDS_REVISION

**COMPLIANCE SUMMARY:**
- Architectural Compliance: PASS
- Design System Adherence: PASS  
- Accessibility Standards: NEEDS_IMPROVEMENT
- Code Quality Standards: PASS

**VIOLATIONS FOUND:**
1. Missing keyboard navigation for card selection - References: CLAUDE.md accessibility patterns
2. Color contrast on tag badges may not meet AA standards - References: WCAG 2.1 AA requirements
3. Focus management could be improved for screen readers - References: Vue 3 accessibility best practices

**REMEDIATION REQUIRED:**
- Add keyboard event handlers for card interaction (Enter/Space keys)
- Verify and adjust color contrast ratios for all text elements
- Implement proper focus trap for interactive elements
- Add aria-describedby for additional context

**STANDARDS REFERENCES:**
- CLAUDE.md Section: Accessibility Implementation
- Vue 3 Composition API patterns
- Tailwind CSS accessibility utilities
```

### Handoff Back to Vue Component Architect

The quality compliance auditor returns the component to `vue-component-architect` with specific remediation requirements.

### Updated Implementation (Post-Revision)

```vue
<!-- Updated ContactCard.vue with accessibility improvements -->
<template>
  <div 
    class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow focus-within:ring-2 focus-within:ring-blue-500"
    :class="{ 
      'border-l-4 border-blue-500': isSelected,
      'cursor-pointer': clickable 
    }"
    role="article"
    :tabindex="clickable ? 0 : -1"
    :aria-labelledby="`contact-${contact.id}-name`"
    :aria-describedby="`contact-${contact.id}-details`"
    @click="handleCardClick"
    @keydown.enter="handleCardClick"
    @keydown.space.prevent="handleCardClick"
  >
    <!-- Rest of template with improved accessibility -->
    <div class="sr-only" :id="`contact-${contact.id}-details`">
      Contact card for {{ contact.firstName }} {{ contact.lastName }}.
      {{ contact.title ? `Works as ${contact.title}` : '' }}
      {{ contact.organization?.name ? `at ${contact.organization.name}` : '' }}.
      {{ clickable ? 'Press Enter or Space to select.' : '' }}
    </div>
    
    <!-- Rest of component unchanged -->
  </div>
</template>

<script setup lang="ts">
// Enhanced props and event handling
interface Props {
  contact: Contact
  isSelected?: boolean
  clickable?: boolean
}

interface Emits {
  edit: [contact: Contact]
  select?: [contact: Contact]
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  clickable: false
})

const emit = defineEmits<Emits>()

const handleCardClick = () => {
  if (props.clickable) {
    emit('select', props.contact)
  }
}
</script>
```

### Second Audit (Post-Revision)

```markdown
**AUDIT DECISION:** APPROVED

**COMPLIANCE SUMMARY:**
- Architectural Compliance: PASS
- Design System Adherence: PASS  
- Accessibility Standards: PASS
- Code Quality Standards: PASS

**QUALITY SCORE:** 92/100
- Architecture: 28/30 (Vue 3 patterns excellent)
- Accessibility: 24/25 (WCAG 2.1 AA compliant)
- Design System: 23/25 (Tailwind best practices)
- Code Quality: 17/20 (Minor optimization opportunities)

**APPROVED FOR TESTING PHASE**
```

## Stage 3: Comprehensive Testing

**Agent**: `test-writer-fixer`
**Duration**: 30 minutes
**Receives**: Approved component and compliance report

### Unit Test Implementation

```typescript
// tests/unit/components/contacts/ContactCard.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ContactCard from '@/components/contacts/ContactCard.vue'
import type { Contact } from '@/types/contacts'

const mockContact: Contact = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-123-4567',
  title: 'Senior Developer',
  organization: {
    id: 'org-1',
    name: 'Tech Corp'
  },
  tags: ['VIP', 'Technical'],
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z'
}

describe('ContactCard', () => {
  it('renders contact information correctly', () => {
    const wrapper = mount(ContactCard, {
      props: { contact: mockContact }
    })
    
    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.text()).toContain('Senior Developer at Tech Corp')
    expect(wrapper.text()).toContain('john.doe@example.com')
    expect(wrapper.text()).toContain('+1-555-123-4567')
  })
  
  it('emits edit event when edit button clicked', async () => {
    const wrapper = mount(ContactCard, {
      props: { contact: mockContact }
    })
    
    const editButton = wrapper.find('[aria-label*="Edit"]')
    await editButton.trigger('click')
    
    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')?.[0]).toEqual([mockContact])
  })
  
  it('handles keyboard navigation correctly', async () => {
    const wrapper = mount(ContactCard, {
      props: { 
        contact: mockContact, 
        clickable: true 
      }
    })
    
    const card = wrapper.find('[role="article"]')
    await card.trigger('keydown.enter')
    
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')?.[0]).toEqual([mockContact])
  })
  
  it('meets accessibility requirements', () => {
    const wrapper = mount(ContactCard, {
      props: { contact: mockContact }
    })
    
    // Check ARIA attributes
    expect(wrapper.find('[role="article"]').exists()).toBe(true)
    expect(wrapper.find('[aria-labelledby]').exists()).toBe(true)
    expect(wrapper.find('[aria-describedby]').exists()).toBe(true)
    
    // Check semantic structure
    expect(wrapper.find('h3').exists()).toBe(true)
    expect(wrapper.find('a[href^="mailto:"]').exists()).toBe(true)
    expect(wrapper.find('a[href^="tel:"]').exists()).toBe(true)
  })
})
```

### Integration Test

```typescript
// tests/integration/ContactCard.integration.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import ContactCard from '@/components/contacts/ContactCard.vue'
import { useContactStore } from '@/stores/contactStore'

describe('ContactCard Integration', () => {
  it('integrates with contact store for real data', async () => {
    const pinia = createPinia()
    const wrapper = mount(ContactCard, {
      props: { contact: mockContact },
      global: {
        plugins: [pinia]
      }
    })
    
    const store = useContactStore()
    
    // Test store integration
    expect(wrapper.vm.contact).toBeDefined()
    expect(store.getContactById).toBeDefined()
  })
})
```

### E2E Test

```typescript
// tests/e2e/contact-card.spec.ts
import { test, expect } from '@playwright/test'

test.describe('ContactCard Component', () => {
  test('displays contact information and handles interactions', async ({ page }) => {
    await page.goto('/contacts')
    
    // Wait for contact cards to load
    await page.waitForSelector('[role="article"]')
    
    // Check contact information display
    const contactCard = page.locator('[role="article"]').first()
    await expect(contactCard).toContainText('John Doe')
    
    // Test edit button functionality
    const editButton = contactCard.locator('[aria-label*="Edit"]')
    await editButton.click()
    
    // Verify navigation or modal opening
    await expect(page).toHaveURL(/.*\/contacts\/.*\/edit/)
  })
  
  test('keyboard navigation works correctly', async ({ page }) => {
    await page.goto('/contacts')
    
    // Focus on contact card
    const contactCard = page.locator('[role="article"]').first()
    await contactCard.focus()
    
    // Test keyboard interaction
    await page.keyboard.press('Enter')
    
    // Verify appropriate response
    await expect(contactCard).toHaveClass(/border-blue-500/)
  })
})
```

### Test Coverage Report

```
File                                    | % Stmts | % Branch | % Funcs | % Lines
----------------------------------------|---------|----------|---------|--------
src/components/contacts/ContactCard.vue |   96.8  |   87.5   |  100.0  |   96.8
src/types/contacts.ts                   |  100.0  |  100.0   |  100.0  |  100.0
----------------------------------------|---------|----------|---------|--------
All files                               |   97.2  |   89.1   |  100.0  |   97.2
```

## Final Workflow Completion

### Deliverables Summary

1. **Production-Ready Component**: ContactCard.vue with full accessibility compliance
2. **TypeScript Integration**: Complete type definitions and interfaces
3. **Quality Assurance**: Passed compliance audit with 92/100 score
4. **Test Coverage**: 97.2% coverage with unit, integration, and E2E tests
5. **Documentation**: Component usage examples and API documentation

### Handoff to Documentation

```yaml
final_deliverable:
  source_workflow: "frontend-quality"
  target_agent: "technical-documentation-agent"
  deliverable_type: "feature"
  components_delivered:
    - "ContactCard.vue component"
    - "TypeScript interfaces"
    - "Comprehensive test suite"
    - "Accessibility compliance validation"
  success_metrics:
    - "Quality score: 92/100"
    - "Test coverage: 97.2%"
    - "WCAG 2.1 AA compliant"
    - "Zero critical issues found"
  
  next_steps:
    - "Update design system documentation"
    - "Create Storybook story for component library"
    - "Add usage examples to developer documentation"
```

## Lessons Learned

1. **Early Accessibility Focus**: Addressing accessibility requirements from the beginning reduces revision cycles
2. **Quality Gate Effectiveness**: The compliance audit caught important accessibility issues that would have been missed
3. **Test-Driven Validation**: Comprehensive testing revealed integration points that needed attention
4. **Handoff Protocol Value**: Structured handoffs ensured no requirements were lost between agents

This example demonstrates the effectiveness of the frontend-quality chain workflow in delivering production-ready, accessible, and well-tested Vue 3 components for the CRM system.