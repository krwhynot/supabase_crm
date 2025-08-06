# ADR-012: Vue 3 Composition API Component Architecture

## Status
- **Status**: Implemented
- **Date**: 2025-01-08
- **Deciders**: Frontend Team, Vue.js Specialists
- **Consulted**: Architecture Team, UX Team
- **Informed**: All Developers

## Context

We needed to establish component architecture patterns for our Vue 3 CRM application that would provide code reusability, maintainability, and type safety. The requirements included:

- **Component Composition**: Reusable logic across components and views
- **Type Safety**: Strong TypeScript integration with component APIs
- **Performance**: Optimized reactivity and efficient re-rendering
- **Maintainability**: Clear patterns for component organization and structure
- **Testing**: Easy-to-test component logic and behavior
- **Code Reuse**: Shared logic through composables and utilities
- **State Management**: Integration with Pinia stores and local state
- **Developer Experience**: Consistent patterns and good debugging support

The alternatives considered were:
1. **Composition API with `<script setup>`**: Modern Vue 3 approach
2. **Options API**: Traditional Vue component syntax
3. **Class-based Components**: TypeScript class syntax
4. **Mixed Approach**: Combination of Composition and Options API
5. **Renderless Components**: Logic-only components with slots

## Decision

We will use the **Vue 3 Composition API with `<script setup>` syntax** as our primary component architecture pattern, supplemented with custom composables for reusable logic.

**Architecture Patterns:**
- **`<script setup>` Syntax**: Primary component definition approach
- **Composables**: Reusable logic extraction into composable functions
- **Type-Safe Props**: Interface-based prop definitions with defaults
- **Reactive State**: `ref` and `reactive` for component state
- **Computed Properties**: Derived state with automatic dependency tracking

## Rationale

### Composition API Advantages
- **Logic Reusability**: Extract and share logic across components
- **TypeScript Integration**: Excellent type inference and IDE support
- **Performance**: More efficient reactivity system than Options API
- **Code Organization**: Group related logic together naturally
- **Tree Shaking**: Better bundle optimization with unused code elimination

### `<script setup>` Benefits
- **Reduced Boilerplate**: Less verbose than standard Composition API
- **Better Performance**: Compile-time optimizations
- **Type Inference**: Automatic TypeScript type inference
- **Developer Experience**: Cleaner, more readable component code
- **IDE Support**: Better autocomplete and error detection

### Composables Strategy
- **Single Responsibility**: Each composable handles one concern
- **Reactive Return**: Return reactive refs and computed values
- **Lifecycle Integration**: Proper cleanup and lifecycle management
- **Testing**: Easy to unit test composable logic independently

### Type Safety Benefits
- **Props Interface**: Clear component API definitions
- **Event Typing**: Type-safe event emissions
- **Template Safety**: TypeScript checking in templates
- **Store Integration**: Type-safe Pinia store usage

## Consequences

### Positive
- **Code Reusability**: Composables enable logic sharing across components
- **Type Safety**: Strong TypeScript integration reduces runtime errors
- **Performance**: Optimized reactivity and smaller bundle sizes
- **Maintainability**: Clear patterns for component organization
- **Developer Experience**: Excellent tooling and debugging support
- **Testing**: Easy to test component logic and composables independently

### Negative
- **Learning Curve**: Developers need to learn Composition API patterns
- **Migration Effort**: Moving from Options API requires refactoring
- **Complexity**: Can become complex with many reactive dependencies
- **Debugging**: Reactivity debugging can be challenging initially

### Risks
- **Medium Risk**: Over-abstraction with too many composables
  - **Mitigation**: Keep composables focused and avoid premature abstraction
- **Low Risk**: Performance issues with excessive reactivity
  - **Mitigation**: Use `shallowRef` and `markRaw` for optimization when needed
- **Medium Risk**: Inconsistent patterns across the team
  - **Mitigation**: Establish clear coding standards and code review practices

## Implementation

### Component Structure Pattern
```vue
<!-- Standard component structure -->
<template>
  <div class="contact-form">
    <h2>{{ title }}</h2>
    
    <form @submit.prevent="handleSubmit">
      <InputField
        v-model="form.name"
        label="Name"
        :error="errors.name"
        required
        @blur="validateField('name')"
      />
      
      <InputField
        v-model="form.email"
        label="Email"
        type="email"
        :error="errors.email"
        @blur="validateField('email')"
      />
      
      <div class="flex justify-end space-x-3">
        <button
          type="button"
          @click="handleCancel"
          class="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="!isValid || loading"
          class="btn-primary"
        >
          {{ loading ? 'Saving...' : 'Save Contact' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useContactStore } from '@/stores/contactStore'
import { useFormValidation } from '@/composables/useFormValidation'
import { useLoadingState } from '@/composables/useLoadingState'
import type { ContactInsert } from '@/types/database.types'

// Props with TypeScript interface
interface Props {
  contactId?: string
  title?: string
  mode?: 'create' | 'edit'
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Contact Form',
  mode: 'create'
})

// Emits with TypeScript
interface Emits {
  (e: 'saved', contact: ContactInsert): void
  (e: 'cancelled'): void
}

const emit = defineEmits<Emits>()

// Composables and external dependencies
const router = useRouter()
const contactStore = useContactStore()
const { loading, withLoading } = useLoadingState()

// Form state
const form = ref<ContactInsert>({
  name: '',
  email: '',
  phone: '',
  organization_id: null
})

// Form validation
const { errors, validateField, validateForm, isValid } = useFormValidation(form, {
  name: (value: string) => {
    if (!value.trim()) return 'Name is required'
    if (value.length < 2) return 'Name must be at least 2 characters'
    return null
  },
  email: (value: string) => {
    if (!value.trim()) return 'Email is required'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) return 'Please enter a valid email'
    return null
  }
})

// Computed properties
const isEditMode = computed(() => props.mode === 'edit')
const submitButtonText = computed(() => 
  isEditMode.value ? 'Update Contact' : 'Create Contact'
)

// Methods
async function handleSubmit() {
  if (!validateForm()) return
  
  await withLoading(async () => {
    try {
      let savedContact
      if (isEditMode.value && props.contactId) {
        savedContact = await contactStore.updateContact(props.contactId, form.value)
      } else {
        savedContact = await contactStore.createContact(form.value)
      }
      
      emit('saved', savedContact)
      
      if (!isEditMode.value) {
        router.push(`/contacts/${savedContact.id}`)
      }
    } catch (error) {
      console.error('Failed to save contact:', error)
      // Error handling through global error handler
    }
  })
}

function handleCancel() {
  emit('cancelled')
  router.back()
}

// Load existing contact for edit mode
if (isEditMode.value && props.contactId) {
  withLoading(async () => {
    const contact = await contactStore.getContactById(props.contactId!)
    if (contact) {
      form.value = { ...contact }
    }
  })
}
</script>
```

### Composables Pattern
```typescript
// src/composables/useFormValidation.ts
import { ref, computed, reactive, type Ref } from 'vue'

type ValidationRule<T> = (value: T) => string | null
type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]>
}

export function useFormValidation<T extends Record<string, any>>(
  form: Ref<T>,
  rules: ValidationRules<T>
) {
  const errors = reactive<Partial<Record<keyof T, string>>>({})
  const touchedFields = reactive<Partial<Record<keyof T, boolean>>>({})

  const validateField = (fieldName: keyof T): boolean => {
    const rule = rules[fieldName]
    if (!rule) return true

    const value = form.value[fieldName]
    const error = rule(value)
    
    if (error) {
      errors[fieldName] = error
      return false
    } else {
      delete errors[fieldName]
      return true
    }
  }

  const validateForm = (): boolean => {
    let isValid = true
    
    for (const fieldName in rules) {
      touchedFields[fieldName] = true
      if (!validateField(fieldName)) {
        isValid = false
      }
    }
    
    return isValid
  }

  const clearErrors = () => {
    for (const key in errors) {
      delete errors[key]
    }
    for (const key in touchedFields) {
      touchedFields[key] = false
    }
  }

  const isValid = computed(() => {
    return Object.keys(errors).length === 0 && 
           Object.keys(touchedFields).some(key => touchedFields[key])
  })

  const hasErrors = computed(() => Object.keys(errors).length > 0)

  return {
    errors,
    touchedFields,
    validateField,
    validateForm,
    clearErrors,
    isValid,
    hasErrors
  }
}
```

```typescript
// src/composables/useLoadingState.ts
import { ref } from 'vue'

export function useLoadingState(initialState = false) {
  const loading = ref(initialState)
  const error = ref<string | null>(null)

  const withLoading = async <T>(fn: () => Promise<T>): Promise<T> => {
    loading.value = true
    error.value = null
    
    try {
      const result = await fn()
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  const setLoading = (state: boolean) => {
    loading.value = state
  }

  const setError = (message: string | null) => {
    error.value = message
  }

  return {
    loading,
    error,
    withLoading,
    setLoading,
    setError
  }
}
```

```typescript
// src/composables/useApiState.ts
import { ref, computed } from 'vue'

export function useApiState<T>() {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const isIdle = computed(() => !loading.value && !error.value && !data.value)
  const isLoading = computed(() => loading.value)
  const isError = computed(() => !!error.value)
  const isSuccess = computed(() => !loading.value && !error.value && !!data.value)

  const execute = async (apiCall: () => Promise<T>) => {
    loading.value = true
    error.value = null
    
    try {
      const result = await apiCall()
      data.value = result
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      data.value = null
      throw err
    } finally {
      loading.value = false
    }
  }

  const reset = () => {
    data.value = null
    loading.value = false
    error.value = null
  }

  return {
    data,
    loading,
    error,
    isIdle,
    isLoading,
    isError,
    isSuccess,
    execute,
    reset
  }
}
```

### Store Integration Pattern
```vue
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useContactStore } from '@/stores/contactStore'
import { useOrganizationStore } from '@/stores/organizationStore'

// Store access
const contactStore = useContactStore()
const organizationStore = useOrganizationStore()

// Reactive store state
const contacts = computed(() => contactStore.filteredContacts)
const loading = computed(() => contactStore.loading || organizationStore.loading)
const organizations = computed(() => organizationStore.organizations)

// Store actions
const searchContacts = (query: string) => {
  contactStore.setSearchQuery(query)
}

const filterByOrganization = (orgId: string | null) => {
  contactStore.setOrganizationFilter(orgId)
}

// Lifecycle hooks
onMounted(async () => {
  await Promise.all([
    contactStore.fetchContacts(),
    organizationStore.fetchOrganizations()
  ])
})
</script>
```

### Event Handling Pattern
```vue
<script setup lang="ts">
import { ref } from 'vue'

// Event definitions with types
interface Emits {
  (e: 'contact-selected', contactId: string): void
  (e: 'contact-updated', contact: Contact): void
  (e: 'action-performed', action: 'edit' | 'delete' | 'duplicate', contactId: string): void
}

const emit = defineEmits<Emits>()

// Event handlers
function handleContactClick(contactId: string) {
  emit('contact-selected', contactId)
}

function handleContactUpdate(contact: Contact) {
  emit('contact-updated', contact)
}

function handleActionClick(action: 'edit' | 'delete' | 'duplicate', contactId: string) {
  emit('action-performed', action, contactId)
}
</script>

<template>
  <div>
    <ContactCard
      v-for="contact in contacts"
      :key="contact.id"
      :contact="contact"
      @click="handleContactClick(contact.id)"
      @updated="handleContactUpdate"
      @action="handleActionClick"
    />
  </div>
</template>
```

### Lifecycle and Cleanup Pattern
```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watchEffect } from 'vue'

const subscription = ref<any>(null)
const intervalId = ref<number | null>(null)

// Setup with cleanup
onMounted(() => {
  // Set up real-time subscription
  subscription.value = supabase
    .channel('contact_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, 
      (payload) => {
        contactStore.handleRealtimeUpdate(payload)
      }
    )
    .subscribe()

  // Set up periodic data refresh
  intervalId.value = window.setInterval(() => {
    contactStore.refreshData()
  }, 30000)
})

// Cleanup on unmount
onUnmounted(() => {
  if (subscription.value) {
    subscription.value.unsubscribe()
  }
  
  if (intervalId.value) {
    clearInterval(intervalId.value)
  }
})

// Reactive cleanup with watchEffect
watchEffect((onCleanup) => {
  const controller = new AbortController()
  
  // Async operation with cleanup
  fetchData(controller.signal)
  
  onCleanup(() => {
    controller.abort()
  })
})
</script>
```

### Testing Pattern
```typescript
// tests/unit/components/ContactForm.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ContactForm from '@/components/ContactForm.vue'
import { useContactStore } from '@/stores/contactStore'

describe('ContactForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should render form fields correctly', () => {
    const wrapper = mount(ContactForm, {
      props: {
        mode: 'create',
        title: 'Create Contact'
      }
    })

    expect(wrapper.find('[data-testid="contact-name"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="contact-email"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Create Contact')
  })

  it('should validate required fields', async () => {
    const wrapper = mount(ContactForm, {
      props: { mode: 'create' }
    })

    // Try to submit without filling fields
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('Name is required')
    expect(wrapper.text()).toContain('Email is required')
  })

  it('should emit saved event when form is submitted successfully', async () => {
    const contactStore = useContactStore()
    vi.spyOn(contactStore, 'createContact').mockResolvedValue({
      id: '1',
      name: 'John Doe',
      email: 'john@example.com'
    })

    const wrapper = mount(ContactForm, {
      props: { mode: 'create' }
    })

    // Fill form
    await wrapper.find('[data-testid="contact-name"]').setValue('John Doe')
    await wrapper.find('[data-testid="contact-email"]').setValue('john@example.com')

    // Submit form
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.emitted('saved')).toBeTruthy()
  })
})
```

## Related Decisions
- [ADR-004: Vue 3 + TypeScript Technology Stack Selection](./004-vue3-typescript-stack.md)
- [ADR-008: Pinia State Management Architecture](./008-pinia-state-management.md)
- [ADR-011: Design System Architecture with Tailwind CSS](./011-design-system-tailwind.md)

## Notes
- All new components use `<script setup>` syntax for consistency
- Composables provide reusable logic across components
- Type safety enforced through interfaces and proper TypeScript usage
- Component testing focuses on behavior rather than implementation details
- Clear patterns established for form handling, API integration, and state management
- Lifecycle management includes proper cleanup to prevent memory leaks