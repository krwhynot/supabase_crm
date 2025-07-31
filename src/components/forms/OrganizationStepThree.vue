<template>
  <div class="space-y-6">
    <!-- Contact Management Section -->
    <div class="space-y-4">
      <div class="text-center">
        <h3 class="text-lg font-medium text-gray-900 mb-2">Contact Information</h3>
        <p class="text-sm text-gray-600 mb-6">
          Select existing contacts or create new contacts for this organization
        </p>
      </div>

      <!-- Contact Multi-Selector Component -->
      <ContactMultiSelector
        :model-value="contactData"
        :error="contactError"
        :loading="loading"
        @update:model-value="handleContactDataUpdate"
        @validate="handleContactValidation"
      />

      <!-- Contact Assignment Summary -->
      <div v-if="hasContacts" class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div class="flex items-start">
          <svg class="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <h4 class="text-sm font-medium text-blue-800">Contact Assignment</h4>
            <div class="mt-2 text-sm text-blue-700">
              <p v-if="contactData.mode === 'select'">
                {{ contactData.selectedContactIds.length }} existing contact{{ contactData.selectedContactIds.length !== 1 ? 's' : '' }} will be linked to this organization.
              </p>
              <p v-else>
                {{ contactData.newContacts.length }} new contact{{ contactData.newContacts.length !== 1 ? 's' : '' }} will be created and linked to this organization.
              </p>
              <p v-if="primaryContactName" class="mt-1">
                <strong>{{ primaryContactName }}</strong> will be set as the primary contact.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useContactStore } from '@/stores/contactStore'
import type { OrganizationCreateForm } from '@/types/organizations'
import ContactMultiSelector from './ContactMultiSelector.vue'
import type { ContactData } from './ContactMultiSelector.vue'

/**
 * Props interface
 */
interface Props {
  /** Form data */
  modelValue: Partial<OrganizationCreateForm>
  /** Validation errors */
  errors: Record<string, string>
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
  'update:modelValue': [value: Partial<OrganizationCreateForm>]
  'validate': [stepNumber: number, isValid: boolean, errors: Record<string, string>]
}

const emit = defineEmits<Emits>()

/**
 * Contact Store
 */
const contactStore = useContactStore()

/**
 * Contact data and validation
 */
const contactData = ref<ContactData>({
  mode: 'select',
  selectedContactIds: [],
  newContacts: [],
  primaryContactId: undefined,
  primaryContactIndex: -1
})

const contactError = ref<string>('')
const isContactDataValid = ref(false)

/**
 * Computed properties
 */
const hasContacts = computed(() => {
  return contactData.value.mode === 'select'
    ? contactData.value.selectedContactIds.length > 0
    : contactData.value.newContacts.length > 0
})

const primaryContactName = computed(() => {
  if (contactData.value.mode === 'select' && contactData.value.primaryContactId) {
    const contact = contactStore.contacts.find(c => c.id === contactData.value.primaryContactId)
    return contact ? `${contact.first_name} ${contact.last_name}` : undefined
  } else if (contactData.value.mode === 'create' && contactData.value.primaryContactIndex !== undefined && contactData.value.primaryContactIndex >= 0) {
    const contact = contactData.value.newContacts[contactData.value.primaryContactIndex]
    return contact ? `${contact.first_name} ${contact.last_name}` : undefined
  }
  return undefined
})

/**
 * Contact data update handler
 */
const handleContactDataUpdate = (newContactData: ContactData) => {
  contactData.value = { ...newContactData }
  updateFormData()
}

/**
 * Contact validation handler
 */
const handleContactValidation = (isValid: boolean, errors: Record<string, string>) => {
  isContactDataValid.value = isValid
  contactError.value = errors.contacts || ''
  
  // Emit validation result for the step
  emit('validate', 3, isValid, errors)
}

/**
 * Update form data with contact information
 */
const updateFormData = () => {
  const updatedData = { ...props.modelValue }
  
  // Store contact data in custom fields
  updatedData.custom_fields = {
    ...updatedData.custom_fields,
    contact_mode: contactData.value.mode,
    selected_contact_ids: contactData.value.selectedContactIds,
    new_contacts: contactData.value.newContacts,
    primary_contact_id: contactData.value.primaryContactId,
    primary_contact_index: contactData.value.primaryContactIndex
  }
  
  emit('update:modelValue', updatedData)
}

/**
 * Initialize from existing form data
 */
const initializeFromFormData = () => {
  const customFields = props.modelValue.custom_fields as any
  if (customFields) {
    contactData.value = {
      mode: customFields.contact_mode || 'select',
      selectedContactIds: customFields.selected_contact_ids || [],
      newContacts: customFields.new_contacts || [],
      primaryContactId: customFields.primary_contact_id,
      primaryContactIndex: customFields.primary_contact_index ?? -1
    }
  }
}

/**
 * Watch for form data changes from parent
 */
watch(
  () => props.modelValue.custom_fields,
  () => {
    initializeFromFormData()
  },
  { deep: true }
)

/**
 * Initialize on mount
 */
onMounted(async () => {
  // Load contacts from store
  await contactStore.fetchContacts()
  
  // Initialize from existing form data if available
  initializeFromFormData()
})
</script>