<template>
  <div class="space-y-6">
    <!-- Selection Mode Toggle -->
    <div class="flex items-center justify-center space-x-4">
      <button
        type="button"
        :class="[
          'px-4 py-2 rounded-md font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors',
          mode === 'select'
            ? 'bg-blue-100 text-blue-800 border border-blue-200'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        ]"
        @click="setMode('select')"
      >
        <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Select Existing Contacts
      </button>
      <button
        type="button"
        :class="[
          'px-4 py-2 rounded-md font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors',
          mode === 'create'
            ? 'bg-blue-100 text-blue-800 border border-blue-200'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        ]"
        @click="setMode('create')"
      >
        <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Create New Contacts
      </button>
    </div>

    <!-- Existing Contact Selection Mode -->
    <div v-if="mode === 'select'" class="space-y-4">
      <!-- Search Bar -->
      <div class="relative">
        <BaseInputField
          name="contact_search"
          label="Search Contacts"
          type="text"
          :model-value="searchQuery"
          placeholder="Type to search for existing contacts..."
          @update:model-value="(value) => updateSearch(String(value))"
        >
          <template #icon>
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </template>
        </BaseInputField>
      </div>

      <!-- Contact List -->
      <div v-if="filteredContacts.length > 0" class="space-y-2">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-medium text-gray-700">Available Contacts</h4>
          <span class="text-xs text-gray-500">{{ filteredContacts.length }} found</span>
        </div>
        
        <div class="max-h-64 overflow-y-auto border border-gray-200 rounded-md bg-white">
          <div
            v-for="contact in filteredContacts"
            :key="contact.id"
            class="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
          >
            <div class="flex items-center space-x-3">
              <input
                :id="`contact-${contact.id}`"
                type="checkbox"
                :checked="selectedContactIds.includes(contact.id)"
                @change="toggleContact(contact.id, ($event.target as HTMLInputElement).checked)"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div class="flex-1">
                <label
                  :for="`contact-${contact.id}`"
                  class="text-sm font-medium text-gray-900 cursor-pointer block"
                >
                  {{ contact.first_name }} {{ contact.last_name }}
                </label>
                <p class="text-xs text-gray-500">{{ contact.email }}</p>
                <p v-if="contact.position" class="text-xs text-gray-400">{{ contact.position }}</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <span
                v-if="getPrimaryContactId() === contact.id"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                Primary
              </span>
              <button
                v-if="selectedContactIds.includes(contact.id)"
                type="button"
                @click="setPrimaryContact(contact.id)"
                :class="[
                  'text-xs px-2 py-1 rounded border transition-colors',
                  getPrimaryContactId() === contact.id
                    ? 'bg-blue-50 text-blue-600 border-blue-200 cursor-default'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-blue-50 hover:text-blue-600'
                ]"
                :disabled="getPrimaryContactId() === contact.id"
              >
                {{ getPrimaryContactId() === contact.id ? 'Primary' : 'Set Primary' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- No Results -->
      <div v-else-if="searchQuery && !isLoading" class="text-center py-8">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p class="mt-2 text-sm text-gray-500">No contacts found matching "{{ searchQuery }}"</p>
        <button
          type="button"
          @click="setMode('create')"
          class="mt-2 text-sm text-blue-600 hover:text-blue-500"
        >
          Create a new contact instead
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-4">
        <div class="inline-flex items-center">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span class="text-sm text-gray-600">Searching contacts...</span>
        </div>
      </div>

      <!-- Selected Contacts Summary -->
      <div v-if="selectedContactIds.length > 0" class="mt-6">
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-sm font-medium text-gray-700">
            Selected Contacts ({{ selectedContactIds.length }})
          </h4>
          <button
            type="button"
            @click="clearSelection"
            class="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear all
          </button>
        </div>
        <div class="space-y-2">
          <div
            v-for="contactId in selectedContactIds"
            :key="contactId"
            class="flex items-center justify-between bg-blue-50 border border-blue-200 p-3 rounded-md"
          >
            <div class="flex items-center space-x-3">
              <div class="flex-1">
                <span class="text-sm font-medium text-gray-900">
                  {{ getContactName(contactId) }}
                </span>
                <span
                  v-if="getPrimaryContactId() === contactId"
                  class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                >
                  Primary Contact
                </span>
              </div>
            </div>
            <button
              type="button"
              @click="removeContact(contactId)"
              class="text-red-600 hover:text-red-800 transition-colors"
              :aria-label="`Remove ${getContactName(contactId)}`"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create New Contacts Mode -->
    <div v-else-if="mode === 'create'" class="space-y-4">
      <!-- Add Contact Button -->
      <div class="text-center">
        <button
          type="button"
          @click="addNewContact"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add New Contact
        </button>
      </div>

      <!-- New Contact Forms -->
      <div v-if="newContacts.length > 0" class="space-y-6">
        <QuickContactForm
          v-for="(contact, index) in newContacts"
          :key="contact.tempId"
          :model-value="contact"
          :errors="contactErrors[contact.tempId] || {}"
          :contact-number="index + 1"
          :show-remove="newContacts.length > 1"
          :is-primary="primaryContactIndex === index"
          @update:model-value="updateNewContact(index, $event)"
          @remove="removeNewContact(index)"
          @set-primary="setPrimaryContactIndex(index)"
        />
      </div>

      <!-- No Contacts Message -->
      <div v-else class="text-center py-8">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <p class="mt-2 text-sm text-gray-500">No contacts added yet</p>
        <p class="text-xs text-gray-400">Click "Add New Contact" to get started</p>
      </div>
    </div>

    <!-- Global Error Display -->
    <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-md" role="alert">
      <div class="flex items-start">
        <svg class="w-5 h-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-sm text-red-700">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useContactStore } from '@/stores/contactStore'
import BaseInputField from './BaseInputField.vue'
import QuickContactForm from './QuickContactForm.vue'

/**
 * New Contact Interface
 */
export interface NewContact {
  tempId: string
  first_name: string
  last_name: string
  email: string
  phone: string
  position: string
  department: string
}

/**
 * Contact Data Interface
 */
export interface ContactData {
  mode: 'select' | 'create'
  selectedContactIds: string[]
  newContacts: NewContact[]
  primaryContactId?: string
  primaryContactIndex?: number
}

/**
 * Props interface
 */
interface Props {
  /** Initial contact data */
  modelValue: ContactData
  /** Validation errors */
  error?: string
  /** Loading state */
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

/**
 * Event emissions
 */
interface Emits {
  'update:modelValue': [value: ContactData]
  'validate': [isValid: boolean, errors: Record<string, string>]
}

const emit = defineEmits<Emits>()

// Contact store
const contactStore = useContactStore()

// Local state
const mode = ref<'select' | 'create'>(props.modelValue.mode || 'select')
const searchQuery = ref('')
const selectedContactIds = ref<string[]>(props.modelValue.selectedContactIds || [])
const newContacts = ref<NewContact[]>(props.modelValue.newContacts || [])
const primaryContactIndex = ref<number>(props.modelValue.primaryContactIndex ?? -1)
const contactErrors = ref<Record<string, Record<string, string>>>({})
const isLoading = ref(false)

/**
 * Computed properties
 */
const filteredContacts = computed(() => {
  if (!searchQuery.value) {
    return contactStore.contacts.slice(0, 20) // Show first 20 contacts by default
  }
  
  const query = searchQuery.value.toLowerCase()
  return contactStore.contacts.filter(contact => 
    contact.first_name?.toLowerCase().includes(query) ||
    contact.last_name?.toLowerCase().includes(query) ||
    contact.email?.toLowerCase().includes(query) ||
    contact.position?.toLowerCase().includes(query)
  ).slice(0, 50) // Limit search results
})

/**
 * Mode management
 */
const setMode = (newMode: 'select' | 'create') => {
  mode.value = newMode
  
  // Clear data when switching modes
  if (newMode === 'select') {
    newContacts.value = []
    primaryContactIndex.value = -1
    contactErrors.value = {}
  } else {
    selectedContactIds.value = []
    searchQuery.value = ''
  }
  
  emitUpdate()
}

/**
 * Search functionality
 */
const updateSearch = async (query: string) => {
  searchQuery.value = query
  
  if (query.length >= 2) {
    isLoading.value = true
    try {
      await contactStore.searchContacts(query)
    } finally {
      isLoading.value = false
    }
  }
}

/**
 * Contact selection handlers
 */
const toggleContact = (contactId: string, selected: boolean) => {
  if (selected) {
    if (!selectedContactIds.value.includes(contactId)) {
      selectedContactIds.value.push(contactId)
      
      // Set as primary if it's the first selected contact
      if (selectedContactIds.value.length === 1) {
        setPrimaryContact(contactId)
      }
    }
  } else {
    selectedContactIds.value = selectedContactIds.value.filter(id => id !== contactId)
    
    // If removing primary contact, set first remaining as primary
    if (getPrimaryContactId() === contactId && selectedContactIds.value.length > 0) {
      setPrimaryContact(selectedContactIds.value[0])
    }
  }
  
  emitUpdate()
}

const removeContact = (contactId: string) => {
  selectedContactIds.value = selectedContactIds.value.filter(id => id !== contactId)
  
  // If removing primary contact, set first remaining as primary
  if (getPrimaryContactId() === contactId && selectedContactIds.value.length > 0) {
    setPrimaryContact(selectedContactIds.value[0])
  }
  
  emitUpdate()
}

const clearSelection = () => {
  selectedContactIds.value = []
  emitUpdate()
}

const setPrimaryContact = (contactId: string) => {
  // Store primary contact ID in model value
  emitUpdate({ primaryContactId: contactId })
}

const getPrimaryContactId = (): string | undefined => {
  return props.modelValue.primaryContactId || selectedContactIds.value[0]
}

const getContactName = (contactId: string): string => {
  const contact = contactStore.contacts.find(c => c.id === contactId)
  return contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown Contact'
}

/**
 * New contact creation handlers
 */
const addNewContact = () => {
  const newContact: NewContact = {
    tempId: `temp_${Date.now()}_${Math.random()}`,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    department: ''
  }
  
  newContacts.value.push(newContact)
  
  // Set as primary if it's the first contact
  if (newContacts.value.length === 1) {
    primaryContactIndex.value = 0
  }
  
  emitUpdate()
}

const removeNewContact = (index: number) => {
  const removedContact = newContacts.value[index]
  newContacts.value.splice(index, 1)
  
  // Clean up validation errors
  if (contactErrors.value[removedContact.tempId]) {
    delete contactErrors.value[removedContact.tempId]
  }
  
  // Update primary contact index
  if (primaryContactIndex.value === index) {
    primaryContactIndex.value = newContacts.value.length > 0 ? 0 : -1
  } else if (primaryContactIndex.value > index) {
    primaryContactIndex.value--
  }
  
  emitUpdate()
}

const updateNewContact = (index: number, updatedContact: NewContact) => {
  if (newContacts.value[index]) {
    newContacts.value[index] = { ...updatedContact }
    
    // Clear validation errors for this contact
    if (contactErrors.value[updatedContact.tempId]) {
      contactErrors.value[updatedContact.tempId] = {}
    }
    
    emitUpdate()
  }
}

const setPrimaryContactIndex = (index: number) => {
  primaryContactIndex.value = index
  emitUpdate()
}

/**
 * Emit updated data
 */
const emitUpdate = (overrides: Partial<ContactData> = {}) => {
  const contactData: ContactData = {
    mode: mode.value,
    selectedContactIds: [...selectedContactIds.value],
    newContacts: [...newContacts.value],
    primaryContactId: getPrimaryContactId(),
    primaryContactIndex: primaryContactIndex.value,
    ...overrides
  }
  
  emit('update:modelValue', contactData)
  
  // Validate
  const isValid = validateContacts()
  emit('validate', isValid, {})
}

/**
 * Validation
 */
const validateContacts = (): boolean => {
  const errors: Record<string, string> = {}
  let isValid = true
  
  if (mode.value === 'select') {
    // Must have at least one selected contact
    if (selectedContactIds.value.length === 0) {
      errors.contacts = 'Please select at least one contact'
      isValid = false
    }
  } else if (mode.value === 'create') {
    // Must have at least one new contact and all must be valid
    if (newContacts.value.length === 0) {
      errors.contacts = 'Please add at least one contact'
      isValid = false
    } else {
      // Validate each new contact
      newContacts.value.forEach((contact) => {
        const contactErr: Record<string, string> = {}
        
        if (!contact.first_name.trim()) {
          contactErr.first_name = 'First name is required'
          isValid = false
        }
        
        if (!contact.last_name.trim()) {
          contactErr.last_name = 'Last name is required'
          isValid = false
        }
        
        if (!contact.email.trim()) {
          contactErr.email = 'Email is required'
          isValid = false
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(contact.email)) {
            contactErr.email = 'Please enter a valid email address'
            isValid = false
          }
        }
        
        if (Object.keys(contactErr).length > 0) {
          contactErrors.value[contact.tempId] = contactErr
        }
      })
    }
  }
  
  return isValid
}

/**
 * Initialize from props
 */
const initializeFromProps = () => {
  mode.value = props.modelValue.mode || 'select'
  selectedContactIds.value = [...(props.modelValue.selectedContactIds || [])]
  newContacts.value = [...(props.modelValue.newContacts || [])]
  primaryContactIndex.value = props.modelValue.primaryContactIndex ?? -1
}

/**
 * Watch for prop changes
 */
watch(() => props.modelValue, initializeFromProps, { deep: true })

/**
 * Load contacts on mount
 */
onMounted(async () => {
  await contactStore.fetchContacts()
  initializeFromProps()
  
  // Initial validation
  const isValid = validateContacts()
  emit('validate', isValid, {})
})
</script>