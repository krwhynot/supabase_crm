# Component Architecture - Vue 3 Design Patterns

## Overview

The Vue 3 CRM project implements a sophisticated component architecture that combines atomic design principles, domain-driven organization, and accessibility-first development. The architecture demonstrates enterprise-level patterns with a focus on reusability, maintainability, and scalability.

## Component Organization Strategy

### Multi-Tiered Architecture

The project employs a **multi-tiered component organization strategy** with clear architectural boundaries:

```
src/
├── components/           # Application-specific components
├── design-system/        # Framework-agnostic design system
└── views/               # Page-level component composition
```

### Primary Component Structure

#### `/src/components/` - Domain-Driven Organization
Application-specific components organized by business domain:

- **`atomic/`** - Basic building blocks (Button.vue)
- **`molecular/`** - Composite components (FormGroup.vue)
- **`forms/`** - Form-specific components with validation
- **`layout/`** - Structural components (DashboardLayout.vue)
- **`opportunities/`** - Sales pipeline management components
- **`principal/`** - Principal activity tracking components
- **`organizations/`** - Company management components
- **`interactions/`** - Communication tracking components
- **`modals/`** - Overlay and dialog components
- **`navigation/`** - Navigation-specific components

#### `/src/design-system/` - Systematic Design Components
Framework-agnostic design system components:

- **Token-based design** with CSS custom properties
- **Component categories** (forms, layout, feedback, navigation, overlay)
- **Theme management** with `useTheme` composable
- **WCAG 2.1 AA** accessibility compliance

#### `/src/views/` - Page-Level Composition
Page-level components that compose other components into complete user interfaces.

## Atomic Design Implementation

### Atomic Level Components (`/atomic/`)

**Button Component** (`Button.vue`)
- **6 variants**: primary, secondary, success, danger, warning, ghost
- **Professional touch targets**: min-height 40px-52px for accessibility
- **Loading state management** with integrated spinners
- **Icon support** with proper spacing and alignment
- **Comprehensive accessibility** with ARIA attributes

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost'
  size: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  icon?: Component
}
```

### Molecular Level Components (`/molecular/`)

**FormGroup Component** (`FormGroup.vue`)
- **Composite form wrapper** handling labels, errors, and accessibility
- **Slot-based architecture** for flexible form field composition
- **Automatic ID generation** for form field relationships
- **Error state management** with ARIA error associations

```typescript
interface FormGroupProps {
  label: string
  error?: string
  required?: boolean
  helpText?: string
}
```

### Organizational Level Components (Domain Components)

Complex business components that implement complete user workflows:

- **`OpportunityFormWrapper.vue`** - Multi-step opportunity creation wizard
- **`ContactFormWrapper.vue`** - 3-step contact creation process
- **`OpportunityKPICards.vue`** - Real-time metrics dashboard
- **`PrincipalMultiSelect.vue`** - Multi-selection with batch preview

## Design System Integration

### Dual-Layer Design System Approach

**Layer 1: Planned Design System** (`/design-system/`)
- Token-based design with CSS custom properties
- Comprehensive component categories
- Theme management with `useTheme` composable
- WCAG 2.1 AA accessibility compliance

**Layer 2: Application Components** (`/components/`)
- Domain-specific implementations leveraging design tokens
- Business logic integrated components
- Complex multi-step form workflows

### Current Implementation Status
The design system is in early development with `ThemeToggle.vue` as the primary implemented component, indicating a transition toward a more systematic approach.

## Reusability Strategies

### Component Index Pattern
Each domain uses barrel exports for clean imports:

```typescript
// /components/opportunities/index.ts
export { default as OpportunityKPICards } from './OpportunityKPICards.vue'
export { default as StageTag } from './StageTag.vue'
export { default as OpportunityTable } from './OpportunityTable.vue'
export { default as OpportunityFormWrapper } from './OpportunityFormWrapper.vue'
```

### Form Component Standardization

All form components follow consistent patterns:

**BaseInputField Component**
```typescript
interface BaseInputFieldProps {
  name: string
  label: string
  modelValue: string | number
  error?: string
  type?: 'text' | 'email' | 'tel' | 'password'
  placeholder?: string
  required?: boolean
}
```

**Consistent Features Across Form Components**:
- v-model support with proper event emission
- Validation integration with error display
- Accessibility attributes (aria-describedby, aria-invalid)
- Unique ID generation for form field relationships

### Composable Integration

Business logic separated from UI components through composables:

- **`usePrincipalAnalytics.ts`** - Principal analytics calculations
- **`usePrincipalFilter.ts`** - Principal filtering logic  
- **`useTheme.ts`** - Theme management functionality
- **`useOpportunityNaming.ts`** - Auto-naming business logic

## Vue 3 Implementation Patterns

### Composition API First

All components use modern Vue 3 patterns:

```vue
<script setup lang="ts">
import { ref, computed, reactive } from 'vue'

// Props with TypeScript interfaces
interface Props {
  modelValue: string
  label: string
  error?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// Reactive state management
const localValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value)
})
</script>
```

### TypeScript Integration

- **Comprehensive type definitions** for all component props
- **Interface segregation** for different component concerns
- **Generic types** for reusable component patterns
- **Strict type checking** throughout component hierarchy

## Accessibility-First Design

### WCAG 2.1 AA Compliance

All components implement comprehensive accessibility:

- **ARIA attributes** throughout (aria-describedby, aria-invalid, role="alert")
- **Unique ID generation** patterns (`field-${name}`, `error-${name}`)
- **Keyboard navigation** support and focus management
- **Screen reader** compatibility with proper semantic markup

### Accessibility Implementation Patterns

```vue
<template>
  <div class="form-group">
    <label :for="`field-${name}`" class="form-label">
      {{ label }}
      <span v-if="required" aria-label="required">*</span>
    </label>
    
    <input
      :id="`field-${name}`"
      v-model="localValue"
      :aria-describedby="error ? `error-${name}` : undefined"
      :aria-invalid="!!error"
      class="form-input"
    />
    
    <div
      v-if="error"
      :id="`error-${name}`"
      role="alert"
      class="form-error"
    >
      {{ error }}
    </div>
  </div>
</template>
```

## Advanced Component Patterns

### Multi-Step Form Architecture

Complex workflows broken into manageable steps:

**ContactFormWrapper.vue** - 3-step contact creation:
1. **Basic Information** - Name, email, phone
2. **Organization Details** - Company association, role  
3. **Additional Details** - Notes, tags, preferences

**Features**:
- Progress indicators with ARIA progressbar
- Auto-save functionality with visual feedback
- Form validation at each step
- Navigation controls with proper focus management

### Layout Component Strategy

**DashboardLayout.vue** - Master layout implementation:
- **Responsive sidebar** with collapsible navigation
- **Consistent navigation** patterns across all views
- **Mobile-first design** with touch-friendly targets
- **Accessibility compliance** with keyboard navigation

### Component Composition Patterns

- **Slot-based composition** for maximum flexibility
- **Event-driven communication** between components
- **Prop drilling minimization** through strategic component boundaries
- **Render prop patterns** for complex state sharing

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Dynamic imports for large components
2. **Computed Properties**: Efficient reactive calculations
3. **v-memo**: Strategic memoization for expensive renders
4. **Component Caching**: Intelligent component instance reuse

### Bundle Optimization

- **Tree-shaking** compatible component exports
- **CSS variable usage** for efficient theming
- **Dynamic imports** for route-based code splitting
- **Component library** separate from application code

## Testing Integration

### Component Testing Strategy

- **Unit testing** with Vitest for component logic
- **Integration testing** with Playwright for user workflows
- **Accessibility testing** integrated throughout test suite
- **Visual regression testing** with screenshot comparison

### Testing Patterns

```typescript
// Component unit test example
describe('BaseInputField', () => {
  it('emits update event on input change', async () => {
    const wrapper = mount(BaseInputField, {
      props: { modelValue: '', label: 'Test', name: 'test' }
    })
    
    await wrapper.find('input').setValue('new value')
    expect(wrapper.emitted('update:modelValue')).toEqual([['new value']])
  })
})
```

## Architecture Benefits

### Scalability
- **Domain-driven organization** supports team growth
- **Consistent patterns** reduce development time
- **Reusable components** minimize code duplication

### Maintainability  
- **Clear component boundaries** with defined responsibilities
- **Consistent API patterns** across component hierarchy
- **Comprehensive documentation** embedded in component code

### Quality Assurance
- **Accessibility built-in** rather than retrofitted
- **Type safety** throughout component system
- **Comprehensive testing** with automated validation

This component architecture provides a robust foundation for a scalable, maintainable, and accessible Vue 3 application with enterprise-level quality and development velocity.