<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" @click="handleOverlayClick">
    <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
      <!-- Modal Header -->
      <div class="flex items-center justify-between pb-3">
        <h3 class="text-lg font-semibold text-gray-900">Create New Organization</h3>
        <button
          @click="$emit('close')"
          type="button"
          class="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
          aria-label="Close modal"
        >
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="mt-4 space-y-4">
        <!-- Organization Name -->
        <BaseInputField
          name="organization_name"
          label="Organization Name"
          type="text"
          :model-value="formData.name"
          :error="errors.name"
          placeholder="Enter organization name"
          required
          @update:model-value="updateField('name', String($event))"
        />

        <!-- Industry -->
        <SelectField
          name="industry"
          label="Industry"
          :model-value="formData.industry"
          :options="industryOptions"
          :error="errors.industry"
          placeholder="Select industry"
          required
          @update:model-value="updateField('industry', String(Array.isArray($event) ? $event[0] || '' : $event))"
        />
      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-end pt-6 space-x-3">
        <button
          @click="$emit('close')"
          type="button"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          @click="handleSubmit"
          type="button"
          :disabled="!isValid || isSubmitting"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isSubmitting ? 'Creating...' : 'Create Organization' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import BaseInputField from '@/components/forms/BaseInputField.vue'
import SelectField from '@/components/forms/SelectField.vue'
import { useOrganizationStore } from '@/stores/organizationStore'

/**
 * Event emissions
 */
interface Emits {
  'close': []
  'success': [organizationId: string]
}

const emit = defineEmits<Emits>()

// Dependencies
const organizationStore = useOrganizationStore()

// Component state
const isSubmitting = ref(false)
const formData = reactive({
  name: '',
  industry: ''
})
const errors = reactive<Record<string, string>>({})

// Industry options (simplified for modal)
const industryOptions = [
  { value: 'Food & Beverage - Manufacturing', label: 'Food & Beverage - Manufacturing', description: 'Food and beverage production' },
  { value: 'Food & Beverage - Distribution', label: 'Food & Beverage - Distribution', description: 'Food and beverage distribution' },
  { value: 'Food & Beverage - Restaurant', label: 'Food & Beverage - Restaurant', description: 'Restaurants and food service' },
  { value: 'Technology', label: 'Technology', description: 'Software and tech services' },
  { value: 'Healthcare', label: 'Healthcare', description: 'Medical and health services' },
  { value: 'Finance', label: 'Finance', description: 'Banking and financial services' },
  { value: 'Manufacturing', label: 'Manufacturing', description: 'Production and industrial' },
  { value: 'Retail', label: 'Retail', description: 'Consumer goods and services' }
]

// Computed properties
const isValid = computed(() => {
  return formData.name.trim().length > 0 && formData.industry.trim().length > 0
})

// Methods
const updateField = (field: keyof typeof formData, value: string) => {
  formData[field] = value
  // Clear error when user starts typing
  if (errors[field]) {
    delete errors[field]
  }
}

const handleOverlayClick = (event: MouseEvent) => {
  // Close modal if clicking on overlay (not the modal content)
  if (event.target === event.currentTarget) {
    emit('close')
  }
}

const handleSubmit = async () => {
  try {
    isSubmitting.value = true
    
    // Clear previous errors
    Object.keys(errors).forEach(key => delete errors[key])
    
    // Basic validation
    if (!formData.name.trim()) {
      errors.name = 'Organization name is required'
      return
    }
    if (!formData.industry.trim()) {
      errors.industry = 'Industry is required'
      return
    }
    
    // Create organization
    const organizationData = {
      name: formData.name.trim(),
      industry: formData.industry,
      lead_score: 50, // Default to medium priority
      status: 'Prospect' as const
    }
    
    const result = await organizationStore.createOrganization(organizationData)
    
    if (result) {
      emit('success', result.id)
    } else {
      errors.name = organizationStore.errors.creating || 'Failed to create organization'
    }
    
  } catch (error: any) {
    console.error('Error creating organization:', error)
    errors.name = error.message || 'An unexpected error occurred'
  } finally {
    isSubmitting.value = false
  }
}
</script>