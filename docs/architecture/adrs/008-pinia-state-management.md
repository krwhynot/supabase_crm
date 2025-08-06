# ADR-008: Pinia State Management Architecture

## Status
- **Status**: Implemented
- **Date**: 2025-01-08
- **Deciders**: Frontend Team, Tech Lead
- **Consulted**: Vue.js Specialists, Architecture Team
- **Informed**: All Developers

## Context

We needed to select a state management solution for our Vue 3 CRM application with the following requirements:

- **Centralized State**: Shared state across multiple components and views
- **Type Safety**: Strong TypeScript integration and type inference
- **Developer Experience**: Good debugging tools and development workflow
- **Performance**: Efficient updates and minimal re-renders
- **Modularity**: Ability to organize state by business domains
- **Vue 3 Integration**: Seamless integration with Composition API
- **Real-time Updates**: Support for real-time data synchronization
- **Testing**: Easy to test and mock for unit tests

The alternatives considered were:
1. **Pinia**: Official Vue state management with TypeScript support
2. **Vuex 4**: Traditional Vue state management
3. **Composables only**: Local state with composable functions
4. **Zustand**: Lightweight state management library
5. **Component state**: Props drilling and event emissions only

## Decision

We will use **Pinia** as our primary state management solution, organizing stores by business domains with 10 specialized stores.

**Store Architecture:**
- **Domain-Specific Stores**: One store per major business entity
- **Composition API**: Using `defineStore` with setup syntax
- **TypeScript Integration**: Full type safety with auto-completion
- **Real-time Sync**: Integration with Supabase real-time subscriptions

## Rationale

### Pinia Advantages
- **Official Support**: Official Vue.js state management library
- **TypeScript First**: Excellent TypeScript support with type inference
- **Composition API**: Natural integration with Vue 3 Composition API
- **Developer Experience**: Excellent Vue DevTools integration
- **Modularity**: Stores can be used independently and composed together
- **Tree Shaking**: Only imported stores are included in the bundle

### Type Safety Benefits
- **Auto-completion**: IDE support with full type inference
- **Compile-time Checks**: TypeScript catches state-related errors
- **API Integration**: Type-safe integration with Supabase responses
- **Refactoring Safety**: Safe refactoring across the entire application

### Performance Characteristics
- **Selective Reactivity**: Components only re-render when used state changes
- **Minimal Bundle**: Tree-shaking eliminates unused store code
- **Efficient Updates**: Optimized reactivity system
- **Memory Management**: Automatic cleanup of unused stores

### Developer Experience
- **Hot Module Replacement**: Store changes reflected immediately
- **Time Travel Debugging**: Vue DevTools integration
- **Easy Testing**: Simple mocking and testing patterns
- **Clear Organization**: Business domain separation

## Consequences

### Positive
- **Maintainable State**: Clear separation of concerns by business domain
- **Type Safety**: Compile-time protection against state errors
- **Developer Productivity**: Excellent tooling and debugging experience
- **Performance**: Efficient reactivity with selective updates
- **Real-time Integration**: Easy integration with Supabase subscriptions
- **Testing**: Straightforward unit testing of business logic

### Negative
- **Learning Curve**: Developers need to learn Pinia patterns and concepts
- **Boilerplate**: Some initial setup required for each store
- **State Complexity**: Can become complex with many interconnected stores
- **Over-engineering**: Risk of using stores for simple local state

### Risks
- **Low Risk**: Store organization becoming unwieldy
  - **Mitigation**: Clear naming conventions and domain boundaries
- **Medium Risk**: Performance issues with many reactive subscriptions
  - **Mitigation**: Monitor performance and optimize reactivity patterns
- **Low Risk**: Complex inter-store dependencies
  - **Mitigation**: Keep stores focused and minimize cross-dependencies

## Implementation

### Store Organization
```typescript
// Store structure by business domain
src/stores/
├── contactStore.ts          # Contact management
├── organizationStore.ts     # Organization data
├── opportunityStore.ts      # Sales pipeline
├── interactionStore.ts      # Customer interactions
├── principalActivityStore.ts # Principal analytics
├── dashboardStore.ts        # Dashboard metrics
├── productStore.ts          # Product catalog
├── principalStore.ts        # Principal data
├── formStore.ts            # Form state management
└── index.ts                # Store exports
```

### Store Definition Pattern
```typescript
// Example: Contact Store with Composition API
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Contact, ContactInsert, ContactUpdate } from '@/types/database.types'
import { contactsApi } from '@/services/contactsApi'

export const useContactStore = defineStore('contact', () => {
  // State
  const contacts = ref<Contact[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const searchQuery = ref('')
  const filters = ref({
    organizationId: null as string | null,
    isActive: true
  })

  // Getters (computed)
  const filteredContacts = computed(() => {
    return contacts.value.filter(contact => {
      const matchesSearch = !searchQuery.value || 
        contact.name.toLowerCase().includes(searchQuery.value.toLowerCase())
      const matchesOrg = !filters.value.organizationId || 
        contact.organization_id === filters.value.organizationId
      const matchesActive = contact.is_active === filters.value.isActive
      
      return matchesSearch && matchesOrg && matchesActive
    })
  })

  const contactCount = computed(() => contacts.value.length)
  const activeContactCount = computed(() => 
    contacts.value.filter(c => c.is_active).length
  )

  // Actions
  async function fetchContacts() {
    loading.value = true
    error.value = null
    
    try {
      const response = await contactsApi.getContacts()
      contacts.value = response.data || []
    } catch (err) {
      error.value = 'Failed to fetch contacts'
      console.error('Contact fetch error:', err)
    } finally {
      loading.value = false
    }
  }

  async function createContact(contactData: ContactInsert) {
    loading.value = true
    error.value = null
    
    try {
      const response = await contactsApi.createContact(contactData)
      if (response.data) {
        contacts.value.push(response.data)
      }
      return response.data
    } catch (err) {
      error.value = 'Failed to create contact'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateContact(id: string, updates: ContactUpdate) {
    loading.value = true
    error.value = null
    
    try {
      const response = await contactsApi.updateContact(id, updates)
      if (response.data) {
        const index = contacts.value.findIndex(c => c.id === id)
        if (index !== -1) {
          contacts.value[index] = response.data
        }
      }
      return response.data
    } catch (err) {
      error.value = 'Failed to update contact'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Real-time subscription handling
  function handleRealtimeUpdate(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload
    
    switch (eventType) {
      case 'INSERT':
        if (newRecord) contacts.value.push(newRecord)
        break
      case 'UPDATE':
        if (newRecord) {
          const index = contacts.value.findIndex(c => c.id === newRecord.id)
          if (index !== -1) contacts.value[index] = newRecord
        }
        break
      case 'DELETE':
        if (oldRecord) {
          contacts.value = contacts.value.filter(c => c.id !== oldRecord.id)
        }
        break
    }
  }

  // Search and filtering
  function setSearchQuery(query: string) {
    searchQuery.value = query
  }

  function setOrganizationFilter(orgId: string | null) {
    filters.value.organizationId = orgId
  }

  function clearFilters() {
    searchQuery.value = ''
    filters.value = {
      organizationId: null,
      isActive: true
    }
  }

  return {
    // State
    contacts,
    loading,
    error,
    searchQuery,
    filters,
    
    // Getters
    filteredContacts,
    contactCount,
    activeContactCount,
    
    // Actions
    fetchContacts,
    createContact,
    updateContact,
    handleRealtimeUpdate,
    setSearchQuery,
    setOrganizationFilter,
    clearFilters
  }
})
```

### Component Integration
```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useContactStore } from '@/stores/contactStore'

const contactStore = useContactStore()

// Auto-completion and type safety
onMounted(async () => {
  await contactStore.fetchContacts()
})

// Reactive computed properties
const { filteredContacts, loading, contactCount } = contactStore
</script>

<template>
  <div>
    <h2>Contacts ({{ contactCount }})</h2>
    <div v-if="loading">Loading...</div>
    <div v-else>
      <ContactCard 
        v-for="contact in filteredContacts" 
        :key="contact.id"
        :contact="contact"
      />
    </div>
  </div>
</template>
```

### Real-time Integration
```typescript
// Supabase real-time integration in stores
import { supabase } from '@/services/supabase'

export function setupRealtimeSubscriptions() {
  // Contact changes
  supabase
    .channel('contact_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'contacts' },
      (payload) => {
        const contactStore = useContactStore()
        contactStore.handleRealtimeUpdate(payload)
      }
    )
    .subscribe()

  // Organization changes
  supabase
    .channel('organization_changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'organizations' },
      (payload) => {
        const orgStore = useOrganizationStore()
        orgStore.handleRealtimeUpdate(payload)
      }
    )
    .subscribe()
}
```

### Testing Pattern
```typescript
// Store testing with Vitest
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useContactStore } from '@/stores/contactStore'
import * as contactsApi from '@/services/contactsApi'

vi.mock('@/services/contactsApi')

describe('Contact Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
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

## Related Decisions
- [ADR-004: Vue 3 + TypeScript Technology Stack Selection](./004-vue3-typescript-stack.md)
- [ADR-005: Supabase Backend Architecture Decision](./005-supabase-backend.md)
- [ADR-013: API Service Layer Design Pattern](./013-api-service-layer.md)

## Notes
- 10 domain-specific stores provide clear separation of concerns
- Real-time subscriptions handled within relevant stores
- Type safety ensured through auto-generated Supabase types
- Testing patterns established for all store operations
- Store composition allows for complex business logic coordination