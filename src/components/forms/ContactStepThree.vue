<template>
  <!-- Two-Column Layout for Tablet+ Screens -->
  <div class="space-y-4 md:space-y-6">
    <!-- Address Information (2-column) -->
    <div class="space-y-4">
      <h3 class="text-sm font-medium text-gray-900">Address Information</h3>
      
      <!-- Address Line 1 (Full Width) -->
      <BaseInputField
        name="address"
        label="Street Address"
        type="text"
        :model-value="modelValue.address || ''"
        :error="errors.address"
        placeholder="Enter street address"
        autocomplete="street-address"
        @update:model-value="updateField('address', $event)"
        @validate="validateField('address', $event)"
      />
      
      <!-- City, State, ZIP (3-column on larger screens) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <!-- City -->
        <BaseInputField
          name="city"
          label="City"
          type="text"
          :model-value="modelValue.city || ''"
          :error="errors.city"
          placeholder="Enter city"
          @update:model-value="updateField('city', $event)"
          @validate="validateField('city', $event)"
        />
        
        <!-- State -->
        <BaseInputField
          name="state"
          label="State"
          type="text"
          :model-value="modelValue.state || ''"
          :error="errors.state"
          placeholder="Enter state"
          @update:model-value="updateField('state', $event)"
          @validate="validateField('state', $event)"
        />
        
        <!-- ZIP Code -->
        <BaseInputField
          name="zip_code"
          label="ZIP Code"
          type="text"
          :model-value="modelValue.zip_code || ''"
          :error="errors.zip_code"
          placeholder="Enter ZIP code"
          autocomplete="postal-code"
          @update:model-value="updateField('zip_code', $event)"
          @validate="validateField('zip_code', $event)"
        />
      </div>
    </div>

    <!-- Additional Information (2-column) -->
    <div class="space-y-4">
      <h3 class="text-sm font-medium text-gray-900">Additional Information</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <!-- Website -->
        <BaseInputField
          name="website"
          label="Website"
          type="url"
          :model-value="modelValue.website || ''"
          :error="errors.website"
          placeholder="https://example.com"
          autocomplete="url"
          @update:model-value="updateField('website', $event)"
          @validate="validateField('website', $event)"
        />
        
        <!-- Account Manager -->
        <BaseInputField
          name="account_manager"
          label="Account Manager"
          type="text"
          :model-value="modelValue.account_manager || ''"
          :error="errors.account_manager"
          placeholder="Enter account manager name"
          @update:model-value="updateField('account_manager', $event)"
          @validate="validateField('account_manager', $event)"
        />
      </div>
    </div>

    <!-- Primary Contact Toggle -->
    <div class="flex items-center space-x-3">
      <input
        id="is_primary"
        name="is_primary"
        type="checkbox"
        :checked="modelValue.is_primary || false"
        @change="updateField('is_primary', ($event.target as HTMLInputElement).checked)"
        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
      <label for="is_primary" class="flex-1">
        <span class="text-sm font-medium text-gray-900">Primary Contact</span>
        <p class="text-xs text-gray-500 mt-0.5">
          Mark this as the primary contact for the organization
        </p>
      </label>
    </div>

    <!-- Notes (Full Width) -->
    <div class="space-y-2">
      <label for="notes" class="block text-sm font-medium text-gray-700">
        Notes
      </label>
      <textarea
        id="notes"
        name="notes"
        rows="4"
        :value="modelValue.notes || ''"
        @input="updateField('notes', ($event.target as HTMLTextAreaElement).value)"
        @blur="validateField('notes', ($event.target as HTMLTextAreaElement).value)"
        :class="[
          'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors duration-200 resize-none',
          errors.notes ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
        ]"
        placeholder="Add any additional notes about this contact..."
        :aria-describedby="errors.notes ? 'notes-error' : undefined"
        :aria-invalid="!!errors.notes"
        maxlength="5000"
      />
      
      <!-- Character count -->
      <div class="flex justify-between items-center">
        <div
          v-if="errors.notes"
          id="notes-error"
          class="text-sm text-red-600"
          role="alert"
        >
          {{ errors.notes }}
        </div>
        <div v-else class="text-xs text-gray-500">
          Optional notes and comments
        </div>
        <div class="text-xs text-gray-400">
          {{ (modelValue.notes || '').length }}/5000
        </div>
      </div>
    </div>

    <!-- Step 3 Info Card -->
    <div class="bg-green-50 border border-green-200 rounded-md p-4">
      <div class="flex items-start">
        <svg
          class="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <h3 class="text-sm font-medium text-green-800">Contact Details</h3>
          <p class="mt-1 text-sm text-green-700">
            All fields in this step are optional. Add any additional information that will help 
            you and your team better understand and communicate with this contact.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, onMounted } from 'vue'
import { contactStepThreeSchema } from '@/types/contacts'
import type { ContactCreateForm } from '@/types/contacts'
import BaseInputField from './BaseInputField.vue'

/**
 * Props interface
 */
interface Props {
  /** Form data */
  modelValue: Partial<ContactCreateForm>
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
  'update:modelValue': [value: Partial<ContactCreateForm>]
  'validate': [stepNumber: number, isValid: boolean, errors: Record<string, string>]
}

const emit = defineEmits<Emits>()

/**
 * Field update handlers
 */
const updateField = (field: keyof ContactCreateForm, value: any) => {
  const updatedData = { ...props.modelValue, [field]: value }
  emit('update:modelValue', updatedData)
}

/**
 * Validation handlers
 */
const validateField = async (_fieldName: string, _value: any) => {
  // Individual field validation will be handled by the parent component
  // This component focuses on UI and data binding
  await validateStep()
}

const validateStep = async () => {
  const errors: Record<string, string> = {}
  let isValid = true
  
  try {
    // Use step-specific schema for validation
    const stepData = {
      address: props.modelValue.address,
      city: props.modelValue.city,
      state: props.modelValue.state,
      zip_code: props.modelValue.zip_code,
      website: props.modelValue.website,
      account_manager: props.modelValue.account_manager,
      notes: props.modelValue.notes,
      is_primary: props.modelValue.is_primary
    }
    
    await contactStepThreeSchema.validate(stepData, { abortEarly: false })
    
  } catch (error: any) {
    isValid = false
    if (error.inner) {
      error.inner.forEach((err: any) => {
        if (err.path) {
          errors[err.path] = err.message
        }
      })
    }
  }
  
  // Step 3 has no required fields, so it's always valid from a required field perspective
  // Only validate format/length constraints
  
  // Emit validation result
  emit('validate', 3, isValid, errors)
}

/**
 * Watch for changes to trigger validation
 */
watch(
  () => [
    props.modelValue.address,
    props.modelValue.city,
    props.modelValue.state,
    props.modelValue.zip_code,
    props.modelValue.website,
    props.modelValue.account_manager,
    props.modelValue.notes,
    props.modelValue.is_primary
  ],
  async () => {
    await validateStep()
  },
  { immediate: true }
)

/**
 * Initial validation on mount
 */
onMounted(async () => {
  await validateStep()
})
</script>