<template>
  <div class="space-y-1">
    <!-- Description -->
    <p
      v-if="description"
      :id="descriptionId"
      class="text-sm text-gray-600 mb-2"
    >
      {{ description }}
    </p>

    <!-- Checkbox Field -->
    <div class="flex items-start space-x-3">
      <div class="relative flex-shrink-0">
        <input
          :id="fieldId"
          :name="name"
          type="checkbox"
          :disabled="disabled"
          :required="required"
          :value="checkboxValue"
          :checked="isChecked"
          :aria-describedby="ariaDescribedBy"
          :aria-invalid="hasError"
          :aria-required="required"
          :class="checkboxClasses"
          @change="handleChange"
          @blur="handleBlur"
          @focus="handleFocus"
          @keydown="handleKeydown"
        />

        <!-- Custom checkbox styling overlay -->
        <div
          v-if="!disabled"
          :class="checkboxOverlayClasses"
          aria-hidden="true"
        >
          <!-- Check mark -->
          <svg
            v-show="isChecked"
            class="w-3 h-3 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>

          <!-- Indeterminate mark -->
          <svg
            v-show="isIndeterminate"
            class="w-3 h-3 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
      </div>

      <!-- Label and content -->
      <div class="flex-1 min-w-0">
        <label
          :for="fieldId"
          :class="labelClasses"
        >
          {{ label }}
          <span v-if="required" class="text-danger ml-1" aria-label="required">*</span>
        </label>

        <!-- Help text -->
        <p
          v-if="helpText && !error"
          :id="helpTextId"
          class="text-sm text-gray-500 mt-1"
        >
          {{ helpText }}
        </p>
      </div>
    </div>

    <!-- Error Message -->
    <p
      v-if="error"
      :id="errorId"
      role="alert"
      class="text-sm text-danger flex items-center space-x-1 ml-6"
    >
      <svg
        class="h-4 w-4 flex-shrink-0"
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
      <span>{{ error }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'

/**
 * Enhanced props interface for checkbox component
 */
interface Props {
  /** Field name for form identification */
  name: string
  /** Visual label for the checkbox */
  label: string
  /** Current field value - boolean for single checkbox, array for checkbox group */
  modelValue: boolean | (string | number)[]
  /** Value of this specific checkbox (for checkbox groups) */
  checkboxValue?: string | number
  /** Validation error message */
  error?: string
  /** Field description for additional context */
  description?: string
  /** Help text shown when no error is present */
  helpText?: string
  /** Whether field is required */
  required?: boolean
  /** Whether field is disabled */
  disabled?: boolean
  /** Indeterminate state for partial selections */
  indeterminate?: boolean
  /** Custom CSS classes for the checkbox */
  checkboxClass?: string
  /** Custom CSS classes for the label */
  labelClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  checkboxValue: undefined,
  indeterminate: false
})

/**
 * Enhanced event emissions
 */
interface Emits {
  'update:modelValue': [value: boolean | (string | number)[]]
  'blur': [event: FocusEvent]
  'focus': [event: FocusEvent] 
  'change': [event: Event, checked: boolean]
  'keydown': [event: KeyboardEvent]
  'validate': [value: boolean | (string | number)[]]
}

const emit = defineEmits<Emits>()

// Reactive state
const isFocused = ref(false)

/**
 * Computed properties for state management
 */
const fieldId = computed(() => `checkbox-${props.name}`)
const errorId = computed(() => `error-${props.name}`)
const descriptionId = computed(() => `desc-${props.name}`)
const helpTextId = computed(() => `help-${props.name}`)

const hasError = computed(() => !!props.error)

const ariaDescribedBy = computed(() => {
  const ids: string[] = []
  if (props.description) ids.push(descriptionId.value)
  if (props.error) ids.push(errorId.value)
  if (props.helpText && !props.error) ids.push(helpTextId.value)
  return ids.length > 0 ? ids.join(' ') : undefined
})

// Determine if checkbox is checked
const isChecked = computed(() => {
  if (typeof props.modelValue === 'boolean') {
    return props.modelValue
  }
  
  if (Array.isArray(props.modelValue) && props.checkboxValue !== undefined) {
    return (props.modelValue as (string | number)[]).includes(props.checkboxValue)
  }
  
  return false
})

// Determine if checkbox is in indeterminate state
const isIndeterminate = computed(() => props.indeterminate && !isChecked.value)

/**
 * Enhanced styling with state management
 */
const labelClasses = computed(() => {
  const base = 'block text-sm font-medium cursor-pointer transition-colors duration-200'
  const stateClasses = hasError.value 
    ? 'text-red-700' 
    : isFocused.value 
      ? 'text-primary' 
      : 'text-gray-700'
  const disabledClasses = props.disabled ? 'opacity-60 cursor-not-allowed' : ''
  const customClasses = props.labelClass || ''
  
  return `${base} ${stateClasses} ${disabledClasses} ${customClasses}`.trim()
})

const checkboxClasses = computed(() => {
  const base = 'sr-only' // Hide default checkbox, use custom styling
  const customClasses = props.checkboxClass || ''
  
  return `${base} ${customClasses}`.trim()
})

const checkboxOverlayClasses = computed(() => {
  const base = 'absolute inset-0 flex items-center justify-center w-5 h-5 border-2 rounded transition-all duration-200 cursor-pointer'
  
  // State-specific styling
  const stateClasses = hasError.value
    ? 'border-red-500'
    : isChecked.value || isIndeterminate.value
      ? 'border-primary bg-primary'
      : isFocused.value
        ? 'border-primary bg-primary/10'
        : 'border-gray-300 hover:border-primary'
  
  // Disabled state
  const disabledClasses = props.disabled 
    ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-300' 
    : ''
  
  return `${base} ${stateClasses} ${disabledClasses}`.trim()
})

/**
 * Event handlers with enhanced functionality
 */
const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const checked = target.checked
  
  if (typeof props.modelValue === 'boolean') {
    // Single checkbox
    emit('update:modelValue', checked)
  } else if (Array.isArray(props.modelValue) && props.checkboxValue !== undefined) {
    // Checkbox group
    const currentValues = [...(props.modelValue as (string | number)[])]
    
    if (checked) {
      if (!currentValues.includes(props.checkboxValue)) {
        currentValues.push(props.checkboxValue)
      }
    } else {
      const index = currentValues.indexOf(props.checkboxValue)
      if (index > -1) {
        currentValues.splice(index, 1)
      }
    }
    
    emit('update:modelValue', currentValues)
  }
  
  emit('change', event, checked)
}

const handleBlur = async (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
  
  // Trigger validation on blur
  await nextTick()
  emit('validate', props.modelValue)
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event)
  
  // Enhanced keyboard navigation
  if (event.key === 'Escape' && isFocused.value) {
    (event.target as HTMLInputElement).blur()
  }
  
  // Space bar handling for better UX
  if (event.key === ' ') {
    event.preventDefault()
    ;(event.target as HTMLInputElement).click()
  }
}

/**
 * Public methods for parent component interaction
 */
defineExpose({
  focus: () => {
    const checkbox = document.getElementById(fieldId.value) as HTMLInputElement
    checkbox?.focus()
  },
  blur: () => {
    const checkbox = document.getElementById(fieldId.value) as HTMLInputElement
    checkbox?.blur()
  },
  toggle: () => {
    const checkbox = document.getElementById(fieldId.value) as HTMLInputElement
    checkbox?.click()
  }
})
</script>