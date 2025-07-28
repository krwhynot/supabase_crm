<template>
  <form
    :class="formClasses"
    :novalidate="novalidate"
    @submit.prevent="handleSubmit"
  >
    <!-- Form Header -->
    <div v-if="title || $slots.header" class="mb-6">
      <slot name="header">
        <h2 v-if="title" class="text-2xl font-bold text-gray-900 mb-2">
          {{ title }}
        </h2>
        <p v-if="description" class="text-gray-600">
          {{ description }}
        </p>
      </slot>
    </div>

    <!-- Global Success Message -->
    <div
      v-if="showSuccess && successMessage"
      class="mb-6 p-4 bg-green-50 border border-green-200 rounded-md"
      role="alert"
    >
      <div class="flex items-center">
        <svg
          class="h-5 w-5 text-green-400 mr-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <h3 class="text-sm font-medium text-green-800">{{ successTitle }}</h3>
          <p class="mt-1 text-sm text-green-700">{{ successMessage }}</p>
        </div>
      </div>
    </div>

    <!-- Global Error Message -->
    <div
      v-if="showErrors && (generalError || firstError)"
      class="mb-6 p-4 bg-red-50 border border-red-200 rounded-md"
      role="alert"
    >
      <div class="flex items-start">
        <svg
          class="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <h3 class="text-sm font-medium text-red-800">{{ errorTitle }}</h3>
          <div class="mt-1 text-sm text-red-700">
            <p v-if="generalError">{{ generalError }}</p>
            <p v-else-if="firstError">{{ firstError }}</p>
            
            <!-- Error List -->
            <ul v-if="showErrorList && hasMultipleErrors" class="mt-2 list-disc list-inside space-y-1">
              <li v-for="(error, field) in errors" :key="field">
                <span class="font-medium">{{ getFieldLabel(field) }}:</span> {{ error }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Form Content -->
    <div :class="contentClasses">
      <slot
        :errors="errors"
        :isValid="isValid"
        :isDirty="isDirty"
        :isSubmitting="isSubmitting"
        :getFieldProps="getFieldProps"
        :resetForm="resetForm"
      />
    </div>

    <!-- Form Actions -->
    <div v-if="$slots.actions || showDefaultActions" :class="actionsClasses">
      <slot
        name="actions"
        :isValid="isValid"
        :isDirty="isDirty"
        :isSubmitting="isSubmitting"
        :resetForm="resetForm"
        :handleSubmit="handleSubmit"
      >
        <!-- Default Actions -->
        <div v-if="showDefaultActions" class="flex justify-end space-x-3">
          <button
            v-if="showResetButton"
            type="button"
            :disabled="!isDirty || isSubmitting"
            class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-semibold rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleReset"
          >
            Reset
          </button>
          
          <button
            type="submit"
            :disabled="(!isValid && strictValidation) || isSubmitting"
            class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <!-- Loading Spinner -->
            <svg
              v-if="isSubmitting"
              class="animate-spin -ml-1 mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {{ submitButtonText }}
          </button>
        </div>
      </slot>
    </div>

    <!-- Form Debug Panel (Development Only) -->
    <details
      v-if="showDebugPanel && isDevelopment"
      class="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md"
    >
      <summary class="cursor-pointer text-sm font-medium text-gray-700 mb-2">
        Debug Info (Development Only)
      </summary>
      <div class="text-xs space-y-2">
        <div><strong>Is Valid:</strong> {{ isValid }}</div>
        <div><strong>Is Dirty:</strong> {{ isDirty }}</div>
        <div><strong>Is Submitting:</strong> {{ isSubmitting }}</div>
        <div><strong>Has Been Submitted:</strong> {{ hasBeenSubmitted }}</div>
        <div><strong>Touched Fields:</strong> {{ touchedFields.join(', ') || 'None' }}</div>
        <div><strong>Errors:</strong> {{ Object.keys(errors).length ? JSON.stringify(errors, null, 2) : 'None' }}</div>
      </div>
    </details>
  </form>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

/**
 * Form layout options
 */
type FormLayout = 'default' | 'compact' | 'wide' | 'card'

/**
 * Enhanced props for form wrapper
 */
interface Props {
  /** Form title */
  title?: string
  /** Form description */
  description?: string
  /** Form validation errors object */
  errors?: Record<string, string>
  /** Whether form is valid */
  isValid?: boolean
  /** Whether form has been modified */
  isDirty?: boolean
  /** Whether form is currently submitting */
  isSubmitting?: boolean
  /** Whether form has been submitted */
  hasBeenSubmitted?: boolean
  /** List of touched field names */
  touchedFields?: string[]
  /** First validation error */
  firstError?: string
  /** General error message */
  generalError?: string
  /** Success message */
  successMessage?: string
  /** Success notification title */
  successTitle?: string
  /** Error notification title */
  errorTitle?: string
  /** Submit button text */
  submitButtonText?: string
  /** Whether to show success message */
  showSuccess?: boolean
  /** Whether to show error messages */
  showErrors?: boolean
  /** Whether to show list of all errors */
  showErrorList?: boolean
  /** Whether to show default action buttons */
  showDefaultActions?: boolean
  /** Whether to show reset button */
  showResetButton?: boolean
  /** Whether to disable HTML5 validation */
  novalidate?: boolean
  /** Form layout style */
  layout?: FormLayout
  /** Whether to require validation before submit */
  strictValidation?: boolean
  /** Whether to show debug panel in development */
  showDebugPanel?: boolean
  /** Field labels for error display */
  fieldLabels?: Record<string, string>
  /** Custom CSS classes for form */
  formClass?: string
  /** Custom CSS classes for form content */
  contentClass?: string
  /** Custom CSS classes for form actions */
  actionsClass?: string
  /** Function to get field props */
  getFieldProps?: (fieldName: string) => any
  /** Function to reset form */
  resetForm?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  successTitle: 'Success!',
  errorTitle: 'Please fix the following errors:',
  submitButtonText: 'Submit',
  showErrors: true,
  showErrorList: false,
  showDefaultActions: true,
  showResetButton: false,
  novalidate: true,
  layout: 'default',
  strictValidation: true,
  showDebugPanel: false,
  fieldLabels: () => ({})
})

/**
 * Enhanced event emissions
 */
interface Emits {
  'submit': [event: Event]
  'reset': [event: Event]
  'valid': [isValid: boolean]
  'dirty': [isDirty: boolean]
}

const emit = defineEmits<Emits>()

/**
 * Computed properties for enhanced functionality
 */
const hasMultipleErrors = computed(() => {
  return Object.keys(props.errors || {}).length > 1
})

const isDevelopment = computed(() => {
  return import.meta.env.DEV
})

/**
 * Enhanced styling based on layout and state
 */
const formClasses = computed(() => {
  const base = 'space-y-6'
  
  const layoutClasses = {
    default: 'max-w-2xl',
    compact: 'max-w-lg',
    wide: 'max-w-4xl',
    card: 'max-w-2xl bg-white rounded-lg shadow-sm border border-gray-200 p-6'
  }
  
  const customClasses = props.formClass || ''
  
  return `${base} ${layoutClasses[props.layout]} ${customClasses}`.trim()
})

const contentClasses = computed(() => {
  const base = 'space-y-4'
  const layoutClasses = props.layout === 'wide' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : ''
  const customClasses = props.contentClass || ''
  
  return `${base} ${layoutClasses} ${customClasses}`.trim()
})

const actionsClasses = computed(() => {
  const base = 'pt-4 border-t border-gray-200'
  const customClasses = props.actionsClass || ''
  
  return `${base} ${customClasses}`.trim()
})

/**
 * Utility functions
 */
const getFieldLabel = (fieldName: string): string => {
  return props.fieldLabels?.[fieldName] || fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
}

/**
 * Event handlers
 */
const handleSubmit = (event: Event) => {
  emit('submit', event)
}

const handleReset = (event: Event) => {
  if (props.resetForm) {
    props.resetForm()
  }
  emit('reset', event)
}

/**
 * Watchers for prop changes
 */
// Watch for validation state changes
const isValid = computed(() => props.isValid)
const isDirty = computed(() => props.isDirty)

// Emit validation state changes
// Note: In a real implementation, you'd use watch() here
// but for the template, we'll keep it simple
</script>