<template>
  <div class="space-y-1">
    <!-- Label -->
    <label
      :for="fieldId"
      :class="labelClasses"
    >
      {{ label }}
      <span v-if="required" class="text-danger ml-1" aria-label="required">*</span>
    </label>

    <!-- Description -->
    <p
      v-if="description"
      :id="descriptionId"
      class="text-sm text-gray-600"
    >
      {{ description }}
    </p>

    <!-- Input Field -->
    <div class="relative">
      <input
        :id="fieldId"
        :type="type"
        :name="name"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :readonly="readonly"
        :disabled="disabled"
        :required="required"
        :min="min"
        :max="max"
        :step="step"
        :maxlength="maxlength"
        :minlength="minlength"
        :pattern="pattern"
        :value="modelValue"
        :aria-describedby="ariaDescribedBy"
        :aria-invalid="hasError"
        :aria-required="required"
        :class="inputClasses"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
        @keydown="handleKeydown"
      />

      <!-- Loading Spinner -->
      <div
        v-if="loading"
        class="absolute inset-y-0 right-0 flex items-center pr-3"
        aria-hidden="true"
      >
        <svg
          class="h-4 w-4 animate-spin text-gray-400"
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
      </div>

      <!-- Success Icon -->
      <div
        v-if="showValidIcon && !hasError && modelValue && !loading"
        class="absolute inset-y-0 right-0 flex items-center pr-3"
        aria-hidden="true"
      >
        <svg
          class="h-4 w-4 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
    </div>

    <!-- Error Message -->
    <p
      v-if="error"
      :id="errorId"
      role="alert"
      class="text-sm text-danger flex items-center space-x-1"
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

    <!-- Help Text -->
    <p
      v-if="helpText && !error"
      :id="helpTextId"
      class="text-sm text-gray-500"
    >
      {{ helpText }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'

/**
 * Supported input types with enhanced HTML5 support
 */
type InputType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'tel' 
  | 'url' 
  | 'number' 
  | 'search'
  | 'date'
  | 'datetime-local'
  | 'time'

/**
 * Autocomplete attribute values for better UX
 */
type AutocompleteType = 
  | 'off'
  | 'on'
  | 'name'
  | 'email'
  | 'username'
  | 'current-password'
  | 'new-password'
  | 'tel'
  | 'url'
  | 'given-name'
  | 'family-name'
  | 'organization'
  | 'street-address'
  | 'postal-code'

/**
 * Enhanced props interface with comprehensive options
 */
interface Props {
  /** Field name for form identification */
  name: string
  /** Visual label for the field */
  label: string
  /** Input type - supports all HTML5 input types */
  type?: InputType
  /** Current field value */
  modelValue: string | number
  /** Validation error message */
  error?: string
  /** Placeholder text */
  placeholder?: string
  /** Field description for additional context */
  description?: string
  /** Help text shown when no error is present */
  helpText?: string
  /** Whether field is required */
  required?: boolean
  /** Whether field is disabled */
  disabled?: boolean
  /** Whether field is readonly */
  readonly?: boolean
  /** Whether field is currently validating */
  loading?: boolean
  /** Show valid icon when field is valid */
  showValidIcon?: boolean
  /** Autocomplete attribute for better UX */
  autocomplete?: AutocompleteType
  /** Minimum value (for number/date inputs) */
  min?: string | number
  /** Maximum value (for number/date inputs) */
  max?: string | number
  /** Step value (for number inputs) */
  step?: string | number
  /** Maximum character length */
  maxlength?: number
  /** Minimum character length */
  minlength?: number
  /** Validation pattern (regex) */
  pattern?: string
  /** Custom CSS classes for the input */
  inputClass?: string
  /** Custom CSS classes for the label */
  labelClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  showValidIcon: true,
  autocomplete: 'off'
})

/**
 * Enhanced event emissions with proper typing
 */
interface Emits {
  'update:modelValue': [value: string | number]
  'blur': [event: FocusEvent]
  'focus': [event: FocusEvent] 
  'input': [event: Event]
  'keydown': [event: KeyboardEvent]
  'validate': [value: string | number]
}

const emit = defineEmits<Emits>()

// Reactive state for internal component logic
const isFocused = ref(false)

/**
 * Computed properties for enhanced accessibility and styling
 */
const fieldId = computed(() => `field-${props.name}`)
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

/**
 * Enhanced styling with state-aware classes
 */
const labelClasses = computed(() => {
  const base = 'block text-sm font-medium transition-colors duration-200'
  const stateClasses = hasError.value 
    ? 'text-red-700' 
    : isFocused.value 
      ? 'text-primary' 
      : 'text-gray-700'
  const disabledClasses = props.disabled ? 'opacity-60' : ''
  const customClasses = props.labelClass || ''
  
  return `${base} ${stateClasses} ${disabledClasses} ${customClasses}`.trim()
})

const inputClasses = computed(() => {
  const base = 'w-full px-3 py-2 border rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent'
  
  // State-specific styling
  const stateClasses = hasError.value
    ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:bg-white'
    : isFocused.value
      ? 'border-primary bg-white focus:ring-primary'
      : 'border-gray-300 bg-white hover:border-gray-400 focus:ring-primary'
  
  // Interaction states
  const disabledClasses = props.disabled 
    ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
    : ''
  const readonlyClasses = props.readonly 
    ? 'bg-gray-50 cursor-default' 
    : ''
  
  // Loading and icon padding
  const paddingClasses = (props.loading || (props.showValidIcon && !hasError.value && props.modelValue)) 
    ? 'pr-10' 
    : ''
  
  const customClasses = props.inputClass || ''
  
  return `${base} ${stateClasses} ${disabledClasses} ${readonlyClasses} ${paddingClasses} ${customClasses}`.trim()
})

/**
 * Enhanced event handlers with proper type safety
 */
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = props.type === 'number' ? Number(target.value) : target.value
  emit('update:modelValue', value)
  emit('input', event)
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
    ;(event.target as HTMLInputElement).blur()
  }
}

/**
 * Public methods for parent component interaction
 */
defineExpose({
  focus: () => {
    const input = document.getElementById(fieldId.value) as HTMLInputElement
    input?.focus()
  },
  blur: () => {
    const input = document.getElementById(fieldId.value) as HTMLInputElement
    input?.blur()
  },
  select: () => {
    const input = document.getElementById(fieldId.value) as HTMLInputElement
    input?.select()
  }
})
</script>