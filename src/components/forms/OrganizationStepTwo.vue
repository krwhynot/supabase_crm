<template>
  <div class="space-y-6">
    <!-- Address Information -->
    <div class="space-y-4">
      <div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Address Information</h3>
        <p class="text-sm text-gray-600 mb-4">
          Provide the organization's address and contact details
        </p>
      </div>

      <!-- Address Line 1 -->
      <BaseInputField
        name="address_line_1"
        label="Address Line 1"
        type="text"
        :model-value="modelValue.address_line_1 || ''"
        :error="errors.address_line_1"
        placeholder="Enter street address"
        @update:model-value="updateField('address_line_1', $event)"
        @validate="validateField('address_line_1', $event)"
      />

      <!-- Address Line 2 -->
      <BaseInputField
        name="address_line_2"
        label="Address Line 2"
        type="text"
        :model-value="modelValue.address_line_2 || ''"
        :error="errors.address_line_2"
        placeholder="Apt, suite, unit, etc. (optional)"
        @update:model-value="updateField('address_line_2', $event)"
        @validate="validateField('address_line_2', $event)"
      />

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
        name="state_province"
        label="State"
        type="text"
        :model-value="modelValue.state_province || ''"
        :error="errors.state_province"
        placeholder="Enter state"
        @update:model-value="updateField('state_province', $event)"
        @validate="validateField('state_province', $event)"
      />

      <!-- Zip Code -->
      <BaseInputField
        name="postal_code"
        label="Zip Code"
        type="text"
        :model-value="modelValue.postal_code || ''"
        :error="errors.postal_code"
        placeholder="Enter zip code"
        @update:model-value="updateField('postal_code', $event)"
        @validate="validateField('postal_code', $event)"
      />

      <!-- Office Phone -->
      <BaseInputField
        name="primary_phone"
        label="Office Phone"
        type="tel"
        :model-value="modelValue.primary_phone || ''"
        :error="errors.primary_phone"
        placeholder="Enter office phone number"
        @update:model-value="updateField('primary_phone', $event)"
        @validate="validateField('primary_phone', $event)"
      />

    </div>

    <!-- Notes & Description -->
    <div class="space-y-4">
      <div>
        <h4 class="text-md font-medium text-gray-900 mb-2">Notes & Description</h4>
        <p class="text-sm text-gray-600">
          Additional information about the organization
        </p>
      </div>

      <!-- Description/Notes -->
      <div class="space-y-2">
        <label for="description" class="block text-sm font-medium text-gray-700">
          Notes & Description
        </label>
        <textarea
          id="description"
          name="description"
          rows="4"
          :value="modelValue.description || ''"
          :class="[
            'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2',
            errors.description
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          ]"
          placeholder="Enter any additional notes or description about the organization..."
          @input="updateField('description', ($event.target as HTMLTextAreaElement).value)"
          @blur="validateField('description', ($event.target as HTMLTextAreaElement).value)"
        />
        <p v-if="errors.description" class="text-sm text-red-600">
          {{ errors.description }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, onMounted } from 'vue'
import type { OrganizationCreateForm } from '@/types/organizations'
import BaseInputField from './BaseInputField.vue'

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
 * Field update handlers
 */
const updateField = (field: keyof OrganizationCreateForm, value: any) => {
  const updatedData = { ...props.modelValue, [field]: value }
  emit('update:modelValue', updatedData)
}

/**
 * Validation handlers
 */
const validateField = (_fieldName: string, _value: any) => {
  // Individual field validation
  validateStep()
}

const validateStep = () => {
  const errors: Record<string, string> = {}
  let isValid = true
  
  // Step 2 has no required fields, all fields are optional
  
  // Emit validation result
  emit('validate', 2, isValid, errors)
}

/**
 * Watch for changes to trigger validation
 */
watch(
  () => [
    props.modelValue.address_line_1,
    props.modelValue.address_line_2,
    props.modelValue.city,
    props.modelValue.state_province,
    props.modelValue.postal_code,
    props.modelValue.primary_phone,
    props.modelValue.description
  ],
  () => {
    validateStep()
  },
  { immediate: true }
)

/**
 * Initial validation on mount
 */
onMounted(() => {
  validateStep()
})
</script>