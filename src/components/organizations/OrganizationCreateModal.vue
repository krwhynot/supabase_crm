<template>
  <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <!-- Backdrop -->
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="$emit('close')"></div>

      <!-- Modal Panel -->
      <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
        <div>
          <!-- Modal Header -->
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900" id="modal-title">
              Create New Organization
            </h3>
            <button
              @click="$emit('close')"
              class="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
            >
              <XMarkIcon class="h-6 w-6" />
            </button>
          </div>

          <!-- Quick Create Form -->
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <BaseInputField
              v-model="formData.name"
              name="name"
              label="Organization Name"
              required
              :error="errors.name"
              placeholder="Enter organization name"
              @blur="validateField('name')"
            />

            <BaseInputField
              v-model="formData.industry"
              name="industry"
              label="Industry"
              :error="errors.industry"
              placeholder="e.g., Restaurant, Healthcare, Education"
              @blur="validateField('industry')"
            />

            <SelectField
              v-model="formData.type"
              name="type"
              label="Organization Type"
              :options="organizationTypeOptions"
              :error="errors.type"
              placeholder="Select type..."
              @blur="validateField('type')"
            />

            <!-- Action Buttons -->
            <div class="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                @click="$emit('close')"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isSubmitting || !isFormValid"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="isSubmitting" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
                <span v-else>
                  Create Organization
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import BaseInputField from '../forms/BaseInputField.vue'
import SelectField from '../forms/SelectField.vue'
import { useOrganizationStore } from '@/stores/organizationStore'
import { ORGANIZATION_TYPES, type OrganizationType } from '@/types/organizations'
import type { OrganizationInsert } from '@/types/database.types'

// Emits
const emit = defineEmits<{
  close: []
  created: [organization: any]
}>()

// Store
const organizationStore = useOrganizationStore()

// Reactive state
const isSubmitting = ref(false)

// Form data
const formData = reactive({
  name: '',
  industry: '',
  type: '' as OrganizationType | ''
})

// Form errors
const errors = reactive<Record<string, string>>({})

// Computed properties
const isFormValid = computed(() => {
  return formData.name.trim() && !Object.keys(errors).some(key => errors[key])
})

// Organization type options
const organizationTypeOptions = ORGANIZATION_TYPES.map(type => ({
  value: type,
  label: type
}))

// Validation methods
const validateField = (fieldName: string) => {
  const value = formData[fieldName as keyof typeof formData]
  
  if (fieldName === 'name') {
    if (!value || typeof value !== 'string' || !value.trim()) {
      errors[fieldName] = 'Organization name is required'
    } else if (value.length > 255) {
      errors[fieldName] = 'Organization name must be less than 255 characters'
    } else {
      errors[fieldName] = ''
    }
  } else if (fieldName === 'industry') {
    if (value && typeof value === 'string' && value.length > 255) {
      errors[fieldName] = 'Industry must be less than 255 characters'
    } else {
      errors[fieldName] = ''
    }
  }
}

// Form submission
const handleSubmit = async () => {
  if (isSubmitting.value || !isFormValid.value) return

  try {
    isSubmitting.value = true
    
    // Prepare organization data
    const organizationData: OrganizationInsert = {
      name: formData.name.trim(),
      industry: formData.industry.trim() || null,
      type: formData.type || null,
      status: 'Prospect' // Default status for new organizations
    }

    // Create organization
    const createdOrganization = await organizationStore.createOrganization(organizationData)
    
    if (createdOrganization) {
      emit('created', createdOrganization)
    } else {
      // Handle error
      console.error('Failed to create organization')
    }
    
  } catch (error) {
    console.error('Error creating organization:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>