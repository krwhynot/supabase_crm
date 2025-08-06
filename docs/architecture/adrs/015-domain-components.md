# ADR-015: Business Domain Component Organization

## Status
- **Status**: Implemented
- **Date**: 2025-01-08
- **Deciders**: Frontend Team, Architecture Team
- **Consulted**: UX Team, Product Team
- **Informed**: All Developers

## Context

We needed to establish a clear organizational structure for Vue 3 components in our CRM application that would scale with business complexity while maintaining code discoverability and reusability. The requirements included:

- **Domain-Driven Organization**: Components grouped by business domains
- **Scalability**: Structure that grows with application complexity
- **Reusability**: Clear separation between shared and domain-specific components
- **Discoverability**: Easy to find and understand component purposes
- **Maintainability**: Clear ownership and responsibility boundaries
- **Consistency**: Uniform patterns across different business domains
- **Testing**: Organized test structure that matches component organization
- **Performance**: Efficient code splitting and lazy loading

The alternatives considered were:
1. **Domain-Driven Structure**: Components organized by business domains
2. **Feature-Based Structure**: Components grouped by application features
3. **Atomic Design**: Components organized by UI complexity levels
4. **Flat Structure**: All components in a single directory
5. **Type-Based Structure**: Components grouped by technical type (forms, tables, etc.)
6. **Hybrid Approach**: Combination of multiple organizational strategies

## Decision

We will use a **Domain-Driven Component Organization** strategy that separates components into shared design system components and business domain-specific components.

**Component Architecture:**
- **Design System**: Reusable UI components independent of business logic
- **Business Domains**: Domain-specific components organized by CRM entities
- **Layout Components**: Application structure and navigation components
- **Feature Components**: Cross-domain functionality components
- **Page Views**: Top-level route components

## Rationale

### Domain-Driven Advantages
- **Business Alignment**: Component organization reflects business structure
- **Scalability**: New domains can be added without restructuring existing code
- **Team Ownership**: Clear responsibility boundaries for different teams
- **Bounded Contexts**: Reduced coupling between different business domains
- **Discoverability**: Developers can easily find domain-related components

### Separation of Concerns Benefits
- **Reusability**: Design system components can be used across domains
- **Maintainability**: Business logic separated from UI presentation
- **Testing**: Clear test organization matching component structure
- **Performance**: Efficient code splitting by domain
- **Consistency**: Shared components ensure UI consistency

### Developer Experience Benefits
- **Navigation**: Easy to locate components by business purpose
- **Onboarding**: New developers can understand structure quickly
- **Collaboration**: Clear boundaries for team collaboration
- **Refactoring**: Safe refactoring within domain boundaries

### Code Organization Benefits
- **Modularity**: Self-contained domain modules
- **Import Patterns**: Clear import conventions and relationships
- **Bundle Optimization**: Efficient code splitting and lazy loading
- **Dependencies**: Explicit dependency management between domains

## Consequences

### Positive
- **Scalable Architecture**: Structure grows naturally with business complexity
- **Clear Ownership**: Domain teams have clear component responsibility
- **Reduced Coupling**: Business domains are loosely coupled
- **Easy Navigation**: Developers can quickly find relevant components
- **Consistent Patterns**: Shared components ensure consistency
- **Performance**: Efficient code splitting and bundle optimization

### Negative
- **Initial Complexity**: More complex structure than flat organization
- **Learning Curve**: Developers need to understand domain boundaries
- **Potential Duplication**: Risk of duplicating similar components across domains
- **Coordination**: Requires coordination for shared component changes

### Risks
- **Medium Risk**: Domain boundaries becoming unclear over time
  - **Mitigation**: Regular architecture reviews and clear documentation
- **Low Risk**: Over-segmentation leading to many small components
  - **Mitigation**: Balance between organization and simplicity
- **Medium Risk**: Shared component changes affecting multiple domains
  - **Mitigation**: Proper versioning and testing strategies

## Implementation

### Component Directory Structure
```
src/
├── components/                    # Shared components and design system
│   ├── design-system/            # Reusable UI components
│   │   ├── forms/               # Form components
│   │   │   ├── InputField.vue
│   │   │   ├── SelectField.vue
│   │   │   ├── TextAreaField.vue
│   │   │   └── CheckboxField.vue
│   │   ├── layout/              # Layout components
│   │   │   ├── Card.vue
│   │   │   ├── Container.vue
│   │   │   ├── Stack.vue
│   │   │   └── Grid.vue
│   │   ├── feedback/            # User feedback components
│   │   │   ├── Alert.vue
│   │   │   ├── Badge.vue
│   │   │   ├── Spinner.vue
│   │   │   └── Toast.vue
│   │   ├── navigation/          # Navigation components
│   │   │   ├── Breadcrumb.vue
│   │   │   ├── Tabs.vue
│   │   │   └── Pagination.vue
│   │   └── overlays/           # Overlay components
│   │       ├── Modal.vue
│   │       ├── Dropdown.vue
│   │       ├── Tooltip.vue
│   │       └── Popover.vue
│   ├── layout/                  # Application layout
│   │   ├── DashboardLayout.vue
│   │   ├── Sidebar.vue
│   │   ├── TopNavigation.vue
│   │   └── MobileNavigation.vue
│   └── shared/                  # Cross-domain shared components
│       ├── DataTable.vue
│       ├── SearchBar.vue
│       ├── FilterPanel.vue
│       └── ExportButton.vue
├── domains/                      # Business domain components
│   ├── contacts/                # Contact management domain
│   │   ├── components/          # Domain-specific components
│   │   │   ├── ContactCard.vue
│   │   │   ├── ContactForm.vue
│   │   │   ├── ContactList.vue
│   │   │   ├── ContactFilters.vue
│   │   │   ├── ContactImportWizard.vue
│   │   │   └── ContactBulkActions.vue
│   │   ├── composables/         # Domain-specific composables
│   │   │   ├── useContactSearch.ts
│   │   │   ├── useContactFilters.ts
│   │   │   └── useContactExport.ts
│   │   └── types/              # Domain-specific types
│   │       ├── contact.ts
│   │       └── contactFilters.ts
│   ├── organizations/           # Organization management domain
│   │   ├── components/
│   │   │   ├── OrganizationCard.vue
│   │   │   ├── OrganizationForm.vue
│   │   │   ├── OrganizationList.vue
│   │   │   ├── OrganizationHierarchy.vue
│   │   │   └── OrganizationMetrics.vue
│   │   ├── composables/
│   │   │   ├── useOrganizationHierarchy.ts
│   │   │   └── useOrganizationMetrics.ts
│   │   └── types/
│   │       └── organization.ts
│   ├── opportunities/           # Sales pipeline domain
│   │   ├── components/
│   │   │   ├── OpportunityCard.vue
│   │   │   ├── OpportunityForm.vue
│   │   │   ├── OpportunityKanban.vue
│   │   │   ├── OpportunityMetrics.vue
│   │   │   ├── OpportunityForecast.vue
│   │   │   └── PipelineVisualization.vue
│   │   ├── composables/
│   │   │   ├── useOpportunityPipeline.ts
│   │   │   ├── useOpportunityMetrics.ts
│   │   │   └── useOpportunityForecasting.ts
│   │   └── types/
│   │       ├── opportunity.ts
│   │       └── pipeline.ts
│   ├── interactions/            # Customer interaction domain
│   │   ├── components/
│   │   │   ├── InteractionTimeline.vue
│   │   │   ├── InteractionForm.vue
│   │   │   ├── InteractionSummary.vue
│   │   │   └── ActivityFeed.vue
│   │   ├── composables/
│   │   │   ├── useInteractionTimeline.ts
│   │   │   └── useActivityTracking.ts
│   │   └── types/
│   │       └── interaction.ts
│   └── analytics/               # Analytics and reporting domain
│       ├── components/
│       │   ├── DashboardMetrics.vue
│       │   ├── ReportBuilder.vue
│       │   ├── ChartComponents.vue
│       │   └── MetricCards.vue
│       ├── composables/
│       │   ├── useAnalytics.ts
│       │   ├── useReporting.ts
│       │   └── useMetrics.ts
│       └── types/
│           ├── analytics.ts
│           └── reports.ts
└── views/                       # Page-level route components
    ├── dashboard/
    │   └── DashboardView.vue
    ├── contacts/
    │   ├── ContactsListView.vue
    │   ├── ContactDetailView.vue
    │   ├── ContactEditView.vue
    │   └── ContactCreateView.vue
    ├── organizations/
    │   ├── OrganizationsListView.vue
    │   ├── OrganizationDetailView.vue
    │   ├── OrganizationEditView.vue
    │   └── OrganizationCreateView.vue
    └── opportunities/
        ├── OpportunitiesListView.vue
        ├── OpportunityDetailView.vue
        ├── OpportunityEditView.vue
        └── OpportunityCreateView.vue
```

### Domain Component Example
```vue
<!-- src/domains/contacts/components/ContactCard.vue -->
<template>
  <Card class="contact-card">
    <div class="flex items-start justify-between">
      <div class="flex items-center space-x-3">
        <Avatar
          :name="contact.name"
          :image="contact.avatar_url"
          size="md"
        />
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ contact.name }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ contact.title || 'No title' }}
          </p>
          <p v-if="contact.organization" class="text-sm text-gray-600 dark:text-gray-300">
            {{ contact.organization.name }}
          </p>
        </div>
      </div>
      
      <Dropdown>
        <template #trigger>
          <button class="btn-icon" aria-label="Contact actions">
            <EllipsisVerticalIcon class="w-5 h-5" />
          </button>
        </template>
        
        <template #content>
          <DropdownItem @click="handleEdit">
            <PencilIcon class="w-4 h-4" />
            Edit Contact
          </DropdownItem>
          <DropdownItem @click="handleDelete" variant="danger">
            <TrashIcon class="w-4 h-4" />
            Delete Contact
          </DropdownItem>
        </template>
      </Dropdown>
    </div>
    
    <div class="mt-4 space-y-2">
      <div v-if="contact.email" class="flex items-center space-x-2">
        <EnvelopeIcon class="w-4 h-4 text-gray-400" />
        <a
          :href="`mailto:${contact.email}`"
          class="text-sm text-blue-600 hover:text-blue-800"
        >
          {{ contact.email }}
        </a>
      </div>
      
      <div v-if="contact.phone" class="flex items-center space-x-2">
        <PhoneIcon class="w-4 h-4 text-gray-400" />
        <a
          :href="`tel:${contact.phone}`"
          class="text-sm text-blue-600 hover:text-blue-800"
        >
          {{ contact.phone }}
        </a>
      </div>
    </div>
    
    <div v-if="contact.tags?.length" class="mt-3 flex flex-wrap gap-1">
      <Badge
        v-for="tag in contact.tags"
        :key="tag"
        variant="secondary"
        size="sm"
      >
        {{ tag }}
      </Badge>
    </div>
    
    <div class="mt-4 flex justify-between items-center">
      <span class="text-xs text-gray-500">
        Last updated {{ formatDate(contact.updated_at) }}
      </span>
      
      <div class="flex space-x-2">
        <button
          @click="handleViewDetails"
          class="btn-sm btn-secondary"
        >
          View Details
        </button>
        <button
          @click="handleCreateOpportunity"
          class="btn-sm btn-primary"
        >
          Create Opportunity
        </button>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Contact } from '@/domains/contacts/types/contact'
import { useContactActions } from '@/domains/contacts/composables/useContactActions'
import { formatDate } from '@/utils/dateUtils'

// Design system components
import Card from '@/components/design-system/layout/Card.vue'
import Avatar from '@/components/design-system/Avatar.vue'
import Badge from '@/components/design-system/feedback/Badge.vue'
import Dropdown from '@/components/design-system/overlays/Dropdown.vue'
import DropdownItem from '@/components/design-system/overlays/DropdownItem.vue'

// Icons
import {
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/vue/24/outline'

// Props and emits
interface Props {
  contact: Contact
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true
})

interface Emits {
  (e: 'edit', contact: Contact): void
  (e: 'delete', contactId: string): void
  (e: 'view-details', contactId: string): void
  (e: 'create-opportunity', contact: Contact): void
}

const emit = defineEmits<Emits>()

// Composables
const router = useRouter()
const { deleteContact } = useContactActions()

// Event handlers
const handleEdit = () => {
  emit('edit', props.contact)
  router.push(`/contacts/${props.contact.id}/edit`)
}

const handleDelete = async () => {
  if (confirm(`Are you sure you want to delete ${props.contact.name}?`)) {
    await deleteContact(props.contact.id)
    emit('delete', props.contact.id)
  }
}

const handleViewDetails = () => {
  emit('view-details', props.contact.id)
  router.push(`/contacts/${props.contact.id}`)
}

const handleCreateOpportunity = () => {
  emit('create-opportunity', props.contact)
  router.push({
    path: '/opportunities/new',
    query: { contactId: props.contact.id }
  })
}
</script>
```

### Domain Composable Example
```typescript
// src/domains/contacts/composables/useContactActions.ts
import { useContactStore } from '@/stores/contactStore'
import { useToast } from '@/composables/useToast'
import type { Contact, ContactInsert, ContactUpdate } from '@/domains/contacts/types/contact'

export function useContactActions() {
  const contactStore = useContactStore()
  const toast = useToast()

  const createContact = async (contactData: ContactInsert): Promise<Contact | null> => {
    try {
      const contact = await contactStore.createContact(contactData)
      toast.success('Contact created successfully')
      return contact
    } catch (error) {
      toast.error('Failed to create contact')
      console.error('Create contact error:', error)
      return null
    }
  }

  const updateContact = async (id: string, updates: ContactUpdate): Promise<Contact | null> => {
    try {
      const contact = await contactStore.updateContact(id, updates)
      toast.success('Contact updated successfully')
      return contact
    } catch (error) {
      toast.error('Failed to update contact')
      console.error('Update contact error:', error)
      return null
    }
  }

  const deleteContact = async (id: string): Promise<boolean> => {
    try {
      await contactStore.deleteContact(id)
      toast.success('Contact deleted successfully')
      return true
    } catch (error) {
      toast.error('Failed to delete contact')
      console.error('Delete contact error:', error)
      return false
    }
  }

  const duplicateContact = async (contact: Contact): Promise<Contact | null> => {
    const duplicateData: ContactInsert = {
      name: `${contact.name} (Copy)`,
      email: '', // Clear email to avoid duplication
      phone: contact.phone,
      title: contact.title,
      organization_id: contact.organization_id,
      notes: contact.notes,
      tags: contact.tags
    }

    return createContact(duplicateData)
  }

  return {
    createContact,
    updateContact,
    deleteContact,
    duplicateContact
  }
}
```

### Import Conventions
```typescript
// Import patterns for domain components

// 1. Design system imports (always first)
import Card from '@/components/design-system/layout/Card.vue'
import InputField from '@/components/design-system/forms/InputField.vue'
import Button from '@/components/design-system/Button.vue'

// 2. Shared application components
import DataTable from '@/components/shared/DataTable.vue'
import SearchBar from '@/components/shared/SearchBar.vue'

// 3. Domain-specific components (same domain)
import ContactCard from '@/domains/contacts/components/ContactCard.vue'
import ContactFilters from '@/domains/contacts/components/ContactFilters.vue'

// 4. Cross-domain imports (carefully considered)
import OrganizationSelect from '@/domains/organizations/components/OrganizationSelect.vue'

// 5. Domain composables and types
import { useContactActions } from '@/domains/contacts/composables/useContactActions'
import type { Contact } from '@/domains/contacts/types/contact'

// 6. Shared utilities and stores
import { formatDate } from '@/utils/dateUtils'
import { useContactStore } from '@/stores/contactStore'
```

### Testing Organization
```
tests/
├── unit/
│   ├── components/
│   │   ├── design-system/         # Design system component tests
│   │   │   ├── forms/
│   │   │   └── layout/
│   │   └── shared/               # Shared component tests
│   └── domains/                  # Domain-specific tests
│       ├── contacts/
│       │   ├── components/
│       │   ├── composables/
│       │   └── types/
│       ├── organizations/
│       └── opportunities/
└── e2e/
    ├── contacts/                 # Contact domain E2E tests
    ├── organizations/            # Organization domain E2E tests
    └── opportunities/            # Opportunity domain E2E tests
```

### Code Splitting Strategy
```typescript
// router/index.ts - Domain-based code splitting
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/contacts',
    component: () => import('@/views/contacts/ContactsListView.vue'),
    children: [
      {
        path: 'new',
        component: () => import('@/views/contacts/ContactCreateView.vue')
      },
      {
        path: ':id',
        component: () => import('@/views/contacts/ContactDetailView.vue')
      }
    ]
  },
  {
    path: '/organizations',
    component: () => import('@/views/organizations/OrganizationsListView.vue'),
    children: [
      {
        path: 'new',
        component: () => import('@/views/organizations/OrganizationCreateView.vue')
      },
      {
        path: ':id',
        component: () => import('@/views/organizations/OrganizationDetailView.vue')
      }
    ]
  }
]
```

## Related Decisions
- [ADR-011: Design System Architecture with Tailwind CSS](./011-design-system-tailwind.md)
- [ADR-012: Vue 3 Composition API Component Architecture](./012-composition-api-architecture.md)
- [ADR-008: Pinia State Management Architecture](./008-pinia-state-management.md)

## Notes
- Domain organization reflects business structure and team ownership
- Clear separation between shared design system and domain-specific components
- Import conventions enforce proper dependency management
- Testing organization matches component structure for consistency
- Code splitting optimized by domain for performance
- Cross-domain dependencies carefully managed to prevent tight coupling