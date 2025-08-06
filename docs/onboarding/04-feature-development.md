# Feature Development Patterns

This guide covers practical patterns and best practices for developing features in our Vue 3 + TypeScript + Supabase CRM system.

## Table of Contents

- [Development Workflow](#development-workflow)
- [Vue 3 Composition API Patterns](#vue-3-composition-api-patterns)
- [Component Development](#component-development)
- [Form Handling](#form-handling)
- [State Management with Pinia](#state-management-with-pinia)
- [Supabase Integration](#supabase-integration)
- [Testing Strategies](#testing-strategies)
- [Performance Best Practices](#performance-best-practices)
- [Accessibility Implementation](#accessibility-implementation)
- [Real-world Examples](#real-world-examples)

## Development Workflow

### Feature Branch Strategy

```bash
# Create feature branch
git checkout main
git pull origin main
git checkout -b feature/contact-bulk-actions

# Work on feature with frequent commits
git add .
git commit -m "feat(contacts): add bulk selection component"
git commit -m "feat(contacts): implement bulk delete action"
git commit -m "test(contacts): add bulk actions test coverage"

# Keep branch up to date
git checkout main
git pull origin main
git checkout feature/contact-bulk-actions
git rebase main

# Create pull request
git push origin feature/contact-bulk-actions
gh pr create --title "feat: Contact bulk actions" --body "..."
```

### Development Commands

```bash
# Start development server
npm run dev

# Run type checking (always before commits)
npm run type-check

# Run linting (auto-fix enabled)
npm run lint

# Run unit tests
npm run test:unit:watch

# Run e2e tests
npm run test:e2e

# Build for production
npm run build
```

## Vue 3 Composition API Patterns

### Basic Component Structure

```vue
<template>
  <div class="feature-component">
    <header class="feature-component__header">
      <h2>{{ title }}</h2>
      <div class="feature-component__actions">
        <button 
          @click="handleAction" 
          :disabled="loading"
          class="btn btn-primary"
        >
          {{ loading ? 'Processing...' : 'Action' }}
        </button>
      </div>
    </header>
    
    <main class="feature-component__content">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watchEffect } from 'vue';
import { useFeatureStore } from '@/stores/featureStore';

// Props with TypeScript interface
interface Props {
  title: string;
  initialData?: FeatureData[];
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  initialData: () => [],
  readonly: false
});

// Emits with TypeScript
interface Emits {
  actionCompleted: [result: ActionResult];
  error: [error: Error];
}

const emit = defineEmits<Emits>();

// Reactive state
const loading = ref(false);
const error = ref<string | null>(null);

// Store usage
const featureStore = useFeatureStore();

// Computed properties
const canPerformAction = computed(() => 
  !props.readonly && !loading.value && featureStore.hasPermission
);

// Methods
const handleAction = async (): Promise<void> => {
  if (!canPerformAction.value) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    const result = await featureStore.performAction();
    emit('actionCompleted', result);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error';
    emit('error', err as Error);
  } finally {
    loading.value = false;
  }
};

// Lifecycle hooks
onMounted(() => {
  if (props.initialData.length > 0) {
    featureStore.setInitialData(props.initialData);
  }
});

// Watchers
watchEffect(() => {
  if (error.value) {
    console.error('Feature component error:', error.value);
  }
});
</script>
```

### Composables Pattern

```typescript
// composables/useFeatureData.ts
import { ref, computed, onMounted } from 'vue';
import { useFeatureStore } from '@/stores/featureStore';

export interface UseFeatureDataOptions {
  autoFetch?: boolean;
  refreshInterval?: number;
}

export const useFeatureData = (options: UseFeatureDataOptions = {}) => {
  const { autoFetch = true, refreshInterval } = options;
  
  const store = useFeatureStore();
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // Computed properties
  const data = computed(() => store.data);
  const isEmpty = computed(() => data.value.length === 0);
  const hasError = computed(() => error.value !== null);
  
  // Methods
  const fetchData = async (): Promise<void> => {
    loading.value = true;
    error.value = null;
    
    try {
      await store.fetchData();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch data';
      throw err;
    } finally {
      loading.value = false;
    }
  };
  
  const refreshData = async (): Promise<void> => {
    await fetchData();
  };
  
  const clearError = (): void => {
    error.value = null;
  };
  
  // Auto-fetch on mount
  onMounted(() => {
    if (autoFetch) {
      fetchData();
    }
  });
  
  // Auto-refresh setup
  if (refreshInterval) {
    setInterval(refreshData, refreshInterval);
  }
  
  return {
    // State
    data,
    loading: readonly(loading),
    error: readonly(error),
    
    // Computed
    isEmpty,
    hasError,
    
    // Methods
    fetchData,
    refreshData,
    clearError
  };
};
```

## Component Development

### Form Components with v-model

```vue
<!-- InputField.vue - Reusable form input -->
<template>
  <div class="input-field">
    <label 
      :for="inputId"
      class="input-field__label"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    
    <input
      :id="inputId"
      :type="type"
      :value="modelValue"
      @input="updateValue"
      @blur="handleBlur"
      :class="inputClasses"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :aria-describedby="error ? errorId : undefined"
      :aria-invalid="!!error"
    />
    
    <div 
      v-if="error" 
      :id="errorId"
      class="input-field__error"
      role="alert"
    >
      {{ error }}
    </div>
    
    <div 
      v-if="hint && !error"
      class="input-field__hint"
    >
      {{ hint }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue';

interface Props {
  name: string;
  label: string;
  modelValue: string | number;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  disabled: false,
  readonly: false
});

interface Emits {
  'update:modelValue': [value: string | number];
  blur: [event: FocusEvent];
}

const emit = defineEmits<Emits>();

// Generate unique IDs
const inputId = useId();
const errorId = computed(() => `error-${inputId}`);

// Computed classes
const inputClasses = computed(() => {
  const base = 'input-field__input w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2';
  const errorClasses = 'border-red-500 focus:ring-red-500';
  const normalClasses = 'border-gray-300 focus:ring-blue-500';
  const disabledClasses = 'bg-gray-100 cursor-not-allowed';
  
  let classes = base;
  
  if (props.error) {
    classes += ` ${errorClasses}`;
  } else {
    classes += ` ${normalClasses}`;
  }
  
  if (props.disabled) {
    classes += ` ${disabledClasses}`;
  }
  
  return classes;
});

// Event handlers
const updateValue = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  const value = props.type === 'number' ? Number(target.value) : target.value;
  emit('update:modelValue', value);
};

const handleBlur = (event: FocusEvent): void => {
  emit('blur', event);
};
</script>
```

### List Components with Actions

```vue
<!-- DataTable.vue - Reusable data table -->
<template>
  <div class="data-table">
    <div class="data-table__header">
      <div class="data-table__controls">
        <SearchInput 
          v-model="searchQuery"
          placeholder="Search items..."
        />
        
        <div class="data-table__actions">
          <button
            v-if="selectedItems.length > 0"
            @click="handleBulkAction('delete')"
            class="btn btn-danger btn-sm"
          >
            Delete Selected ({{ selectedItems.length }})
          </button>
          
          <button
            @click="$emit('create')"
            class="btn btn-primary btn-sm"
          >
            Add New
          </button>
        </div>
      </div>
    </div>
    
    <div class="data-table__content">
      <table class="table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                :checked="allSelected"
                :indeterminate="someSelected"
                @change="toggleSelectAll"
              />
            </th>
            <th 
              v-for="column in columns"
              :key="column.key"
              @click="handleSort(column.key)"
              :class="{ 'sortable': column.sortable }"
            >
              {{ column.label }}
              <SortIcon 
                v-if="column.sortable"
                :direction="getSortDirection(column.key)"
              />
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        
        <tbody>
          <tr 
            v-for="item in paginatedItems"
            :key="item.id"
          >
            <td>
              <input
                type="checkbox"
                :checked="selectedItems.includes(item.id)"
                @change="toggleSelect(item.id)"
              />
            </td>
            <td 
              v-for="column in columns"
              :key="column.key"
            >
              <slot 
                :name="`cell-${column.key}`"
                :item="item"
                :value="item[column.key]"
              >
                {{ item[column.key] }}
              </slot>
            </td>
            <td>
              <div class="action-buttons">
                <button
                  @click="$emit('edit', item)"
                  class="btn btn-sm btn-outline"
                >
                  Edit
                </button>
                <button
                  @click="handleDelete(item)"
                  class="btn btn-sm btn-danger"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div 
        v-if="filteredItems.length === 0"
        class="data-table__empty"
      >
        <slot name="empty">
          <p>No items found</p>
        </slot>
      </div>
    </div>
    
    <Pagination
      v-if="totalPages > 1"
      :current-page="currentPage"
      :total-pages="totalPages"
      @page-change="currentPage = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

interface Props {
  items: any[];
  columns: TableColumn[];
  pageSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  pageSize: 10
});

interface Emits {
  create: [];
  edit: [item: any];
  delete: [item: any];
  bulkDelete: [items: any[]];
}

const emit = defineEmits<Emits>();

// State
const searchQuery = ref('');
const selectedItems = ref<string[]>([]);
const currentPage = ref(1);
const sortKey = ref<string>('');
const sortDirection = ref<'asc' | 'desc'>('asc');

// Computed properties
const filteredItems = computed(() => {
  if (!searchQuery.value) return props.items;
  
  const query = searchQuery.value.toLowerCase();
  return props.items.filter(item =>
    Object.values(item).some(value =>
      String(value).toLowerCase().includes(query)
    )
  );
});

const sortedItems = computed(() => {
  if (!sortKey.value) return filteredItems.value;
  
  return [...filteredItems.value].sort((a, b) => {
    const aValue = a[sortKey.value];
    const bValue = b[sortKey.value];
    
    if (aValue < bValue) return sortDirection.value === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection.value === 'asc' ? 1 : -1;
    return 0;
  });
});

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize;
  const end = start + props.pageSize;
  return sortedItems.value.slice(start, end);
});

const totalPages = computed(() =>
  Math.ceil(filteredItems.value.length / props.pageSize)
);

const allSelected = computed(() =>
  paginatedItems.value.length > 0 &&
  paginatedItems.value.every(item => selectedItems.value.includes(item.id))
);

const someSelected = computed(() =>
  selectedItems.value.length > 0 && !allSelected.value
);

// Methods
const toggleSelectAll = (): void => {
  if (allSelected.value) {
    selectedItems.value = selectedItems.value.filter(id =>
      !paginatedItems.value.some(item => item.id === id)
    );
  } else {
    const pageIds = paginatedItems.value.map(item => item.id);
    selectedItems.value = [...new Set([...selectedItems.value, ...pageIds])];
  }
};

const toggleSelect = (id: string): void => {
  const index = selectedItems.value.indexOf(id);
  if (index > -1) {
    selectedItems.value.splice(index, 1);
  } else {
    selectedItems.value.push(id);
  }
};

const handleSort = (key: string): void => {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDirection.value = 'asc';
  }
};

const getSortDirection = (key: string): 'asc' | 'desc' | null => {
  return sortKey.value === key ? sortDirection.value : null;
};

const handleDelete = (item: any): void => {
  if (confirm(`Are you sure you want to delete this item?`)) {
    emit('delete', item);
  }
};

const handleBulkAction = (action: string): void => {
  if (action === 'delete') {
    const items = props.items.filter(item => 
      selectedItems.value.includes(item.id)
    );
    
    if (confirm(`Are you sure you want to delete ${items.length} items?`)) {
      emit('bulkDelete', items);
      selectedItems.value = [];
    }
  }
};
</script>
```

## Form Handling

### Form Validation with Yup

```typescript
// schemas/contactSchema.ts
import * as yup from 'yup';

export const contactSchema = yup.object({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
    
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),
    
  phone: yup
    .string()
    .optional()
    .matches(/^[\+]?[0-9\s\-\(\)]{10,15}$/, 'Please enter a valid phone number'),
    
  organization: yup
    .string()
    .optional()
    .max(200, 'Organization name cannot exceed 200 characters'),
    
  role: yup
    .string()
    .required('Role is required')
    .oneOf(['principal', 'assistant', 'other'], 'Please select a valid role'),
    
  notes: yup
    .string()
    .optional()
    .max(1000, 'Notes cannot exceed 1000 characters')
});

export type ContactFormData = yup.InferType<typeof contactSchema>;
```

```vue
<!-- ContactForm.vue - Complete form with validation -->
<template>
  <form @submit.prevent="handleSubmit" class="contact-form">
    <div class="form-grid">
      <InputField
        name="name"
        label="Full Name"
        v-model="formData.name"
        :error="errors.name"
        required
        @blur="validateField('name')"
      />
      
      <InputField
        name="email"
        type="email"
        label="Email Address"
        v-model="formData.email"
        :error="errors.email"
        required
        @blur="validateField('email')"
      />
      
      <InputField
        name="phone"
        type="tel"
        label="Phone Number"
        v-model="formData.phone"
        :error="errors.phone"
        @blur="validateField('phone')"
      />
      
      <InputField
        name="organization"
        label="Organization"
        v-model="formData.organization"
        :error="errors.organization"
        @blur="validateField('organization')"
      />
      
      <SelectField
        name="role"
        label="Role"
        v-model="formData.role"
        :options="roleOptions"
        :error="errors.role"
        required
        @blur="validateField('role')"
      />
      
      <TextareaField
        name="notes"
        label="Notes"
        v-model="formData.notes"
        :error="errors.notes"
        rows="3"
        @blur="validateField('notes')"
      />
    </div>
    
    <div class="form-actions">
      <button
        type="button"
        @click="$emit('cancel')"
        class="btn btn-secondary"
      >
        Cancel
      </button>
      
      <button
        type="submit"
        :disabled="!isValid || submitting"
        class="btn btn-primary"
      >
        {{ submitting ? 'Saving...' : (isEditing ? 'Update' : 'Create') }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { contactSchema, type ContactFormData } from '@/schemas/contactSchema';
import { useValidation } from '@/composables/useValidation';

interface Props {
  initialData?: Partial<ContactFormData>;
  isEditing?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  initialData: () => ({}),
  isEditing: false
});

interface Emits {
  submit: [data: ContactFormData];
  cancel: [];
}

const emit = defineEmits<Emits>();

// Form state
const formData = ref<ContactFormData>({
  name: '',
  email: '',
  phone: '',
  organization: '',
  role: '',
  notes: '',
  ...props.initialData
});

const submitting = ref(false);

// Validation
const { errors, validateField, validateAll, clearErrors } = useValidation(contactSchema);

// Computed properties
const isValid = computed(() => 
  Object.keys(errors.value).length === 0 && 
  formData.value.name && 
  formData.value.email
);

const roleOptions = [
  { value: 'principal', label: 'Principal' },
  { value: 'assistant', label: 'Assistant' },
  { value: 'other', label: 'Other' }
];

// Watch for prop changes
watch(
  () => props.initialData,
  (newData) => {
    Object.assign(formData.value, newData);
    clearErrors();
  },
  { deep: true }
);

// Methods
const handleSubmit = async (): Promise<void> => {
  const isValidForm = await validateAll(formData.value);
  if (!isValidForm) return;
  
  submitting.value = true;
  
  try {
    emit('submit', { ...formData.value });
  } finally {
    submitting.value = false;
  }
};
</script>
```

## State Management with Pinia

### Store Structure

```typescript
// stores/contactsStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '@/lib/supabase';
import type { Contact, ContactFormData } from '@/types/contact';

export const useContactsStore = defineStore('contacts', () => {
  // State
  const contacts = ref<Contact[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const searchQuery = ref('');
  const selectedContactId = ref<string | null>(null);
  
  // Getters
  const filteredContacts = computed(() => {
    if (!searchQuery.value) return contacts.value;
    
    const query = searchQuery.value.toLowerCase();
    return contacts.value.filter(contact =>
      contact.name.toLowerCase().includes(query) ||
      contact.email.toLowerCase().includes(query) ||
      contact.organization?.toLowerCase().includes(query)
    );
  });
  
  const selectedContact = computed(() =>
    contacts.value.find(c => c.id === selectedContactId.value) || null
  );
  
  const contactsByOrganization = computed(() => {
    const grouped = new Map<string, Contact[]>();
    
    contacts.value.forEach(contact => {
      const org = contact.organization || 'No Organization';
      if (!grouped.has(org)) {
        grouped.set(org, []);
      }
      grouped.get(org)!.push(contact);
    });
    
    return grouped;
  });
  
  // Actions
  const fetchContacts = async (): Promise<void> => {
    loading.value = true;
    error.value = null;
    
    try {
      const { data, error: fetchError } = await supabase
        .from('contacts')
        .select('*')
        .order('name');
        
      if (fetchError) throw fetchError;
      
      contacts.value = data || [];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch contacts';
      throw err;
    } finally {
      loading.value = false;
    }
  };
  
  const createContact = async (contactData: ContactFormData): Promise<Contact> => {
    loading.value = true;
    error.value = null;
    
    try {
      const { data, error: createError } = await supabase
        .from('contacts')
        .insert([contactData])
        .select()
        .single();
        
      if (createError) throw createError;
      
      contacts.value.push(data);
      return data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create contact';
      throw err;
    } finally {
      loading.value = false;
    }
  };
  
  const updateContact = async (id: string, updates: Partial<ContactFormData>): Promise<Contact> => {
    loading.value = true;
    error.value = null;
    
    try {
      const { data, error: updateError } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (updateError) throw updateError;
      
      const index = contacts.value.findIndex(c => c.id === id);
      if (index > -1) {
        contacts.value[index] = data;
      }
      
      return data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update contact';
      throw err;
    } finally {
      loading.value = false;
    }
  };
  
  const deleteContact = async (id: string): Promise<void> => {
    loading.value = true;
    error.value = null;
    
    try {
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);
        
      if (deleteError) throw deleteError;
      
      contacts.value = contacts.value.filter(c => c.id !== id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete contact';
      throw err;
    } finally {
      loading.value = false;
    }
  };
  
  const bulkDeleteContacts = async (ids: string[]): Promise<void> => {
    loading.value = true;
    error.value = null;
    
    try {
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .in('id', ids);
        
      if (deleteError) throw deleteError;
      
      contacts.value = contacts.value.filter(c => !ids.includes(c.id));
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete contacts';
      throw err;
    } finally {
      loading.value = false;
    }
  };
  
  const setSearchQuery = (query: string): void => {
    searchQuery.value = query;
  };
  
  const selectContact = (id: string | null): void => {
    selectedContactId.value = id;
  };
  
  const clearError = (): void => {
    error.value = null;
  };
  
  return {
    // State
    contacts,
    loading,
    error,
    searchQuery,
    selectedContactId,
    
    // Getters
    filteredContacts,
    selectedContact,
    contactsByOrganization,
    
    // Actions
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
    bulkDeleteContacts,
    setSearchQuery,
    selectContact,
    clearError
  };
});
```

## Supabase Integration

### Database Service Layer

```typescript
// services/contactService.ts
import { supabase } from '@/lib/supabase';
import type { Contact, ContactFormData } from '@/types/contact';

export class ContactService {
  static async getAll(): Promise<Contact[]> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('name');
      
    if (error) throw error;
    return data || [];
  }
  
  static async getById(id: string): Promise<Contact | null> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return data;
  }
  
  static async create(contactData: ContactFormData): Promise<Contact> {
    const { data, error } = await supabase
      .from('contacts')
      .insert([contactData])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
  
  static async update(id: string, updates: Partial<ContactFormData>): Promise<Contact> {
    const { data, error } = await supabase
      .from('contacts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
  
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  }
  
  static async bulkDelete(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .in('id', ids);
      
    if (error) throw error;
  }
  
  static async search(query: string): Promise<Contact[]> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,organization.ilike.%${query}%`)
      .order('name');
      
    if (error) throw error;
    return data || [];
  }
  
  static async getByOrganization(organization: string): Promise<Contact[]> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('organization', organization)
      .order('name');
      
    if (error) throw error;
    return data || [];
  }
}
```

### Real-time Subscriptions

```typescript
// services/realtimeService.ts
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();
  
  subscribeToContacts(callback: (payload: any) => void): () => void {
    const channel = supabase
      .channel('contacts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts'
        },
        callback
      )
      .subscribe();
      
    this.channels.set('contacts', channel);
    
    // Return unsubscribe function
    return () => {
      channel.unsubscribe();
      this.channels.delete('contacts');
    };
  }
  
  subscribeToOpportunities(callback: (payload: any) => void): () => void {
    const channel = supabase
      .channel('opportunities-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'opportunities'
        },
        callback
      )
      .subscribe();
      
    this.channels.set('opportunities', channel);
    
    return () => {
      channel.unsubscribe();
      this.channels.delete('opportunities');
    };
  }
  
  unsubscribeAll(): void {
    this.channels.forEach((channel) => {
      channel.unsubscribe();
    });
    this.channels.clear();
  }
}

export const realtimeService = new RealtimeService();
```

## Testing Strategies

### Unit Testing with Vitest

```typescript
// tests/unit/contactsStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useContactsStore } from '@/stores/contactsStore';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn()
    }))
  }
}));

describe('Contacts Store', () => {
  let store: ReturnType<typeof useContactsStore>;
  
  beforeEach(() => {
    setActivePinia(createPinia());
    store = useContactsStore();
  });
  
  it('should initialize with empty state', () => {
    expect(store.contacts).toEqual([]);
    expect(store.loading).toBe(false);
    expect(store.error).toBe(null);
    expect(store.searchQuery).toBe('');
  });
  
  it('should filter contacts by search query', () => {
    store.contacts = [
      { id: '1', name: 'John Doe', email: 'john@example.com', organization: 'Acme Corp' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', organization: 'Tech Inc' }
    ];
    
    store.setSearchQuery('john');
    
    expect(store.filteredContacts).toHaveLength(1);
    expect(store.filteredContacts[0].name).toBe('John Doe');
  });
  
  it('should group contacts by organization', () => {
    store.contacts = [
      { id: '1', name: 'John Doe', email: 'john@example.com', organization: 'Acme Corp' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', organization: 'Acme Corp' },
      { id: '3', name: 'Bob Johnson', email: 'bob@example.com', organization: 'Tech Inc' }
    ];
    
    const grouped = store.contactsByOrganization;
    
    expect(grouped.get('Acme Corp')).toHaveLength(2);
    expect(grouped.get('Tech Inc')).toHaveLength(1);
  });
});
```

### Component Testing with Playwright

```typescript
// tests/components/ContactForm.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Contact Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contacts/new');
  });
  
  test('should display form fields', async ({ page }) => {
    await expect(page.getByLabel('Full Name')).toBeVisible();
    await expect(page.getByLabel('Email Address')).toBeVisible();
    await expect(page.getByLabel('Phone Number')).toBeVisible();
    await expect(page.getByLabel('Organization')).toBeVisible();
    await expect(page.getByLabel('Role')).toBeVisible();
    await expect(page.getByLabel('Notes')).toBeVisible();
  });
  
  test('should validate required fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Create' }).click();
    
    await expect(page.getByText('Name is required')).toBeVisible();
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Role is required')).toBeVisible();
  });
  
  test('should create contact with valid data', async ({ page }) => {
    await page.getByLabel('Full Name').fill('John Doe');
    await page.getByLabel('Email Address').fill('john@example.com');
    await page.getByLabel('Role').selectOption('principal');
    
    await page.getByRole('button', { name: 'Create' }).click();
    
    await expect(page).toHaveURL('/contacts');
    await expect(page.getByText('Contact created successfully')).toBeVisible();
  });
  
  test('should handle form submission errors', async ({ page }) => {
    // Mock API error
    await page.route('/api/contacts', route => {
      route.fulfill({
        status: 400,
        body: JSON.stringify({ error: 'Email already exists' })
      });
    });
    
    await page.getByLabel('Full Name').fill('John Doe');
    await page.getByLabel('Email Address').fill('existing@example.com');
    await page.getByLabel('Role').selectOption('principal');
    
    await page.getByRole('button', { name: 'Create' }).click();
    
    await expect(page.getByText('Email already exists')).toBeVisible();
  });
});
```

## Performance Best Practices

### Lazy Loading and Code Splitting

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Dashboard',
      component: () => import('@/views/DashboardView.vue')
    },
    {
      path: '/contacts',
      name: 'Contacts',
      component: () => import('@/views/contacts/ContactsListView.vue')
    },
    {
      path: '/contacts/new',
      name: 'CreateContact',
      component: () => import('@/views/contacts/ContactCreateView.vue')
    },
    {
      path: '/contacts/:id',
      name: 'ContactDetail',
      component: () => import('@/views/contacts/ContactDetailView.vue')
    },
    {
      path: '/opportunities',
      name: 'Opportunities',
      component: () => import('@/views/opportunities/OpportunitiesListView.vue')
    }
  ]
});

export default router;
```

### Computed Properties and Memoization

```typescript
// composables/useOptimizedData.ts
import { computed, ref, shallowRef } from 'vue';

export const useOptimizedData = <T>(data: Ref<T[]>) => {
  const sortKey = ref<keyof T>('name');
  const sortDirection = ref<'asc' | 'desc'>('asc');
  const searchQuery = ref('');
  
  // Use shallowRef for large datasets to avoid deep reactivity
  const processedData = shallowRef<T[]>([]);
  
  // Memoized filtering
  const filteredData = computed(() => {
    if (!searchQuery.value) return data.value;
    
    const query = searchQuery.value.toLowerCase();
    return data.value.filter(item =>
      Object.values(item as any).some(value =>
        String(value).toLowerCase().includes(query)
      )
    );
  });
  
  // Memoized sorting
  const sortedData = computed(() => {
    return [...filteredData.value].sort((a, b) => {
      const aValue = a[sortKey.value];
      const bValue = b[sortKey.value];
      
      if (aValue < bValue) return sortDirection.value === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection.value === 'asc' ? 1 : -1;
      return 0;
    });
  });
  
  return {
    sortedData,
    sortKey,
    sortDirection,
    searchQuery
  };
};
```

### Virtual Scrolling for Large Lists

```vue
<!-- VirtualList.vue - For large datasets -->
<template>
  <div 
    ref="containerRef"
    class="virtual-list"
    @scroll="handleScroll"
  >
    <div 
      class="virtual-list__spacer"
      :style="{ height: `${totalHeight}px` }"
    >
      <div
        class="virtual-list__content"
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <div
          v-for="item in visibleItems"
          :key="item.id"
          class="virtual-list__item"
          :style="{ height: `${itemHeight}px` }"
        >
          <slot :item="item" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

interface Props {
  items: any[];
  itemHeight: number;
  containerHeight: number;
}

const props = defineProps<Props>();

const containerRef = ref<HTMLElement>();
const scrollTop = ref(0);

const visibleCount = computed(() => 
  Math.ceil(props.containerHeight / props.itemHeight) + 2
);

const startIndex = computed(() =>
  Math.floor(scrollTop.value / props.itemHeight)
);

const endIndex = computed(() =>
  Math.min(startIndex.value + visibleCount.value, props.items.length)
);

const visibleItems = computed(() =>
  props.items.slice(startIndex.value, endIndex.value)
);

const totalHeight = computed(() =>
  props.items.length * props.itemHeight
);

const offsetY = computed(() =>
  startIndex.value * props.itemHeight
);

const handleScroll = (event: Event): void => {
  const target = event.target as HTMLElement;
  scrollTop.value = target.scrollTop;
};

onMounted(() => {
  if (containerRef.value) {
    containerRef.value.style.height = `${props.containerHeight}px`;
    containerRef.value.style.overflow = 'auto';
  }
});
</script>
```

## Accessibility Implementation

### Focus Management

```vue
<!-- AccessibleModal.vue -->
<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="modal-overlay"
      @click="handleOverlayClick"
      @keydown.escape="close"
    >
      <div
        ref="modalRef"
        class="modal"
        role="dialog"
        :aria-labelledby="titleId"
        :aria-describedby="descriptionId"
        aria-modal="true"
      >
        <header class="modal__header">
          <h2 :id="titleId" class="modal__title">
            {{ title }}
          </h2>
          
          <button
            @click="close"
            class="modal__close"
            aria-label="Close modal"
          >
            ×
          </button>
        </header>
        
        <div :id="descriptionId" class="modal__body">
          <slot />
        </div>
        
        <footer v-if="$slots.footer" class="modal__footer">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, useId } from 'vue';

interface Props {
  isOpen: boolean;
  title: string;
  closeOnOverlayClick?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  closeOnOverlayClick: true
});

interface Emits {
  close: [];
}

const emit = defineEmits<Emits>();

const modalRef = ref<HTMLElement>();
const titleId = useId();
const descriptionId = useId();
let previousActiveElement: HTMLElement | null = null;

// Focus management
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    // Store the currently focused element
    previousActiveElement = document.activeElement as HTMLElement;
    
    // Wait for DOM update
    await nextTick();
    
    // Focus the modal
    modalRef.value?.focus();
    
    // Trap focus within modal
    document.addEventListener('keydown', trapFocus);
  } else {
    // Remove focus trap
    document.removeEventListener('keydown', trapFocus);
    
    // Restore focus to previous element
    previousActiveElement?.focus();
    previousActiveElement = null;
  }
});

const trapFocus = (event: KeyboardEvent): void => {
  if (!modalRef.value || event.key !== 'Tab') return;
  
  const focusableElements = modalRef.value.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
  
  if (event.shiftKey) {
    if (document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }
  } else {
    if (document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
};

const handleOverlayClick = (event: MouseEvent): void => {
  if (props.closeOnOverlayClick && event.target === event.currentTarget) {
    close();
  }
};

const close = (): void => {
  emit('close');
};
</script>
```

## Real-world Examples

### Complete Contact Management Feature

```vue
<!-- ContactsPage.vue - Full feature implementation -->
<template>
  <div class="contacts-page">
    <PageHeader
      title="Contacts"
      :subtitle="`${filteredContacts.length} contacts`"
    >
      <template #actions>
        <button
          @click="openCreateModal"
          class="btn btn-primary"
        >
          Add Contact
        </button>
      </template>
    </PageHeader>
    
    <div class="contacts-page__content">
      <ContactFilters
        v-model:search="searchQuery"
        v-model:organization="organizationFilter"
        v-model:role="roleFilter"
        :organizations="organizations"
        @clear="clearFilters"
      />
      
      <ContactTable
        :contacts="paginatedContacts"
        :loading="loading"
        :selected-contacts="selectedContacts"
        @select="handleSelect"
        @select-all="handleSelectAll"
        @edit="openEditModal"
        @delete="handleDelete"
        @bulk-delete="handleBulkDelete"
      />
      
      <Pagination
        v-if="totalPages > 1"
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-items="filteredContacts.length"
        @page-change="currentPage = $event"
      />
    </div>
    
    <!-- Modals -->
    <ContactModal
      v-model:is-open="showCreateModal"
      title="Create Contact"
      @submit="handleCreate"
    />
    
    <ContactModal
      v-model:is-open="showEditModal"
      title="Edit Contact"
      :initial-data="selectedContact"
      is-editing
      @submit="handleUpdate"
    />
    
    <ConfirmDialog
      v-model:is-open="showDeleteConfirm"
      title="Delete Contact"
      :message="deleteMessage"
      confirm-text="Delete"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useContactsStore } from '@/stores/contactsStore';
import { useNotifications } from '@/composables/useNotifications';
import type { Contact, ContactFormData } from '@/types/contact';

// Store and composables
const contactsStore = useContactsStore();
const { showSuccess, showError } = useNotifications();

// State
const currentPage = ref(1);
const pageSize = ref(20);
const selectedContacts = ref<string[]>([]);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDeleteConfirm = ref(false);
const contactToDelete = ref<Contact | null>(null);
const contactsToDelete = ref<Contact[]>([]);

// Computed properties
const { 
  contacts, 
  loading, 
  error,
  filteredContacts,
  searchQuery,
  selectedContact
} = storeToRefs(contactsStore);

const organizationFilter = ref('');
const roleFilter = ref('');

const filteredAndSearchedContacts = computed(() => {
  let result = filteredContacts.value;
  
  if (organizationFilter.value) {
    result = result.filter(c => c.organization === organizationFilter.value);
  }
  
  if (roleFilter.value) {
    result = result.filter(c => c.role === roleFilter.value);
  }
  
  return result;
});

const paginatedContacts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredAndSearchedContacts.value.slice(start, end);
});

const totalPages = computed(() =>
  Math.ceil(filteredAndSearchedContacts.value.length / pageSize.value)
);

const organizations = computed(() => [
  ...new Set(contacts.value.map(c => c.organization).filter(Boolean))
].sort());

const deleteMessage = computed(() => {
  if (contactToDelete.value) {
    return `Are you sure you want to delete "${contactToDelete.value.name}"?`;
  }
  if (contactsToDelete.value.length > 0) {
    return `Are you sure you want to delete ${contactsToDelete.value.length} contacts?`;
  }
  return '';
});

// Methods
const openCreateModal = (): void => {
  showCreateModal.value = true;
};

const openEditModal = (contact: Contact): void => {
  contactsStore.selectContact(contact.id);
  showEditModal.value = true;
};

const handleCreate = async (data: ContactFormData): Promise<void> => {
  try {
    await contactsStore.createContact(data);
    showCreateModal.value = false;
    showSuccess('Contact created successfully');
  } catch (err) {
    showError('Failed to create contact');
  }
};

const handleUpdate = async (data: ContactFormData): Promise<void> => {
  if (!selectedContact.value) return;
  
  try {
    await contactsStore.updateContact(selectedContact.value.id, data);
    showEditModal.value = false;
    showSuccess('Contact updated successfully');
  } catch (err) {
    showError('Failed to update contact');
  }
};

const handleDelete = (contact: Contact): void => {
  contactToDelete.value = contact;
  contactsToDelete.value = [];
  showDeleteConfirm.value = true;
};

const handleBulkDelete = (contacts: Contact[]): void => {
  contactToDelete.value = null;
  contactsToDelete.value = contacts;
  showDeleteConfirm.value = true;
};

const confirmDelete = async (): Promise<void> => {
  try {
    if (contactToDelete.value) {
      await contactsStore.deleteContact(contactToDelete.value.id);
      showSuccess('Contact deleted successfully');
    } else if (contactsToDelete.value.length > 0) {
      const ids = contactsToDelete.value.map(c => c.id);
      await contactsStore.bulkDeleteContacts(ids);
      showSuccess(`${contactsToDelete.value.length} contacts deleted successfully`);
      selectedContacts.value = [];
    }
    
    showDeleteConfirm.value = false;
  } catch (err) {
    showError('Failed to delete contact(s)');
  }
};

const handleSelect = (contactId: string): void => {
  const index = selectedContacts.value.indexOf(contactId);
  if (index > -1) {
    selectedContacts.value.splice(index, 1);
  } else {
    selectedContacts.value.push(contactId);
  }
};

const handleSelectAll = (selected: boolean): void => {
  if (selected) {
    selectedContacts.value = paginatedContacts.value.map(c => c.id);
  } else {
    selectedContacts.value = [];
  }
};

const clearFilters = (): void => {
  searchQuery.value = '';
  organizationFilter.value = '';
  roleFilter.value = '';
  currentPage.value = 1;
};

// Lifecycle
onMounted(() => {
  contactsStore.fetchContacts();
});
</script>
```

This comprehensive guide provides practical patterns and real-world examples for developing features in our CRM system. Follow these patterns to maintain consistency and quality across the codebase.