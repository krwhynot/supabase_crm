<template>
  <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
    <!-- Contact Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-3">
        <h4 class="text-md font-medium text-gray-900">
          Contact {{ contactNumber }}
        </h4>
        <button
          v-if="!isPrimary && showSetPrimary"
          type="button"
          @click="$emit('set-primary')"
          class="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-gray-300 text-gray-700 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          Set as Primary
        </button>
        <span
          v-else-if="isPrimary"
          class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
        >
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          Primary Contact
        </span>
      </div>
      <button
        v-if="showRemove"
        type="button"
        @click="$emit('remove')"
        class="text-red-600 hover:text-red-800 transition-colors"
        :aria-label="`Remove contact ${contactNumber}`"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>

    <!-- Contact Form Fields -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- First Name (Required) -->
      <BaseInputField
        :name="`contact_${contactNumber}_first_name`"
        label="First Name"
        type="text"
        :model-value="modelValue.first_name"
        :error="errors.first_name"
        placeholder="Enter first name"
        required
        @update:model-value="updateField('first_name', $event)"
        @blur="validateField('first_name')"
      />

      <!-- Last Name (Required) -->
      <BaseInputField
        :name="`contact_${contactNumber}_last_name`"
        label="Last Name"
        type="text"
        :model-value="modelValue.last_name"
        :error="errors.last_name"
        placeholder="Enter last name"
        required
        @update:model-value="updateField('last_name', $event)"
        @blur="validateField('last_name')"
      />

      <!-- Email (Required) -->
      <BaseInputField
        :name="`contact_${contactNumber}_email`"
        label="Email Address"
        type="email"
        :model-value="modelValue.email"
        :error="errors.email"
        placeholder="Enter email address"
        required
        autocomplete="email"
        @update:model-value="updateField('email', $event)"
        @blur="validateField('email')"
      />

      <!-- Phone -->
      <BaseInputField
        :name="`contact_${contactNumber}_phone`"
        label="Phone Number"
        type="tel"
        :model-value="modelValue.phone"
        :error="errors.phone"
        placeholder="Enter phone number"
        autocomplete="tel"
        @update:model-value="updateField('phone', $event)"
        @blur="validateField('phone')"
      />

      <!-- Job Title/Position -->
      <BaseInputField
        :name="`contact_${contactNumber}_position`"
        label="Job Title"
        type="text"
        :model-value="modelValue.position"
        :error="errors.position"
        placeholder="Enter job title"
        autocomplete="organization"
        @update:model-value="updateField('position', $event)"
      />

      <!-- Department -->
      <BaseInputField
        :name="`contact_${contactNumber}_department`"
        label="Department"
        type="text"
        :model-value="modelValue.department"
        :error="errors.department"
        placeholder="Enter department"
        @update:model-value="updateField('department', $event)"
      />
    </div>

    <!-- Contact Preview -->
    <div v-if="hasValidBasicInfo" class="mt-4 p-3 bg-white border border-gray-200 rounded-md">
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900">
            {{ modelValue.first_name }} {{ modelValue.last_name }}
            <span
              v-if="isPrimary"
              class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
            >
              Primary
            </span>
          </p>
          <p class="text-sm text-gray-500">{{ modelValue.email }}</p>
          <p v-if="modelValue.position" class="text-xs text-gray-400">
            {{ modelValue.position }}
            <span v-if="modelValue.department"> • {{ modelValue.department }}</span>
          </p>
          <p v-if="modelValue.phone" class="text-xs text-gray-400">{{ modelValue.phone }}</p>
        </div>
      </div>
    </div>

    <!-- Validation Summary -->
    <div v-if="validationSummary" class="mt-3">
      <div 
        :class="[
          'flex items-center text-xs px-2 py-1 rounded',
          validationSummary.isValid 
            ? 'bg-green-50 text-green-700' 
            : 'bg-red-50 text-red-700'
        ]"
      >
        <svg 
          :class="[
            'w-4 h-4 mr-1',
            validationSummary.isValid ? 'text-green-400' : 'text-red-400'
          ]"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            v-if="validationSummary.isValid"
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M5 13l4 4L19 7" 
          />
          <path 
            v-else
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
        {{ validationSummary.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { NewContact } from './ContactMultiSelector.vue'
import BaseInputField from './BaseInputField.vue'

/**
 * Props interface
 */
interface Props {
  /** Contact data */
  modelValue: NewContact
  /** Validation errors */
  errors: Record<string, string>
  /** Contact number for display */
  contactNumber: number
  /** Whether to show remove button */
  showRemove?: boolean
  /** Whether this is the primary contact */
  isPrimary?: boolean
  /** Whether to show set primary button */
  showSetPrimary?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showRemove: true,
  isPrimary: false,
  showSetPrimary: true
})

/**
 * Event emissions
 */
interface Emits {
  'update:modelValue': [value: NewContact]
  'remove': []
  'set-primary': []
}

const emit = defineEmits<Emits>()

/**
 * Computed properties
 */
const hasValidBasicInfo = computed(() => {
  return props.modelValue.first_name?.trim() && 
         props.modelValue.last_name?.trim() && 
         props.modelValue.email?.trim()
})

const validationSummary = computed(() => {
  const errors = Object.keys(props.errors).length
  const requiredFields = ['first_name', 'last_name', 'email']
  const filledRequired = requiredFields.filter(field => 
    props.modelValue[field as keyof NewContact]?.trim()
  ).length
  
  if (errors > 0) {
    return {
      isValid: false,
      message: `${errors} validation error${errors > 1 ? 's' : ''} found`
    }
  } else if (filledRequired === requiredFields.length) {
    return {
      isValid: true,
      message: 'Contact information is complete'
    }
  } else {
    return {
      isValid: false,
      message: `${requiredFields.length - filledRequired} required field${requiredFields.length - filledRequired > 1 ? 's' : ''} remaining`
    }
  }
})

/**
 * Field update handler
 */
const updateField = (field: keyof NewContact, value: string | number | (string | number)[]) => {
  const stringValue = Array.isArray(value) ? value[0]?.toString() || '' : value?.toString() || ''
  
  const updatedContact: NewContact = {
    ...props.modelValue,
    [field]: stringValue
  }
  
  emit('update:modelValue', updatedContact)
}

/**
 * Field validation (can be expanded for real-time validation)
 */
const validateField = (fieldName: string) => {
  // Individual field validation can be added here
  // For now, validation is handled by the parent component
  console.debug(`Validating field: ${fieldName}`)
}
</script>