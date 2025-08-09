<template>
  <div class="space-y-1" ref="containerRef" :class="delightClasses">
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
        v-bind="autocomplete ? { autocomplete } : {}"
        :readonly="readonly || undefined"
        :disabled="disabled || undefined"
        :required="required"
        :min="min"
        :max="max"
        :step="step"
        :maxlength="maxLength"
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
        class="absolute inset-y-0 right-0 flex items-center pr-4"
        aria-hidden="true"
      >
        <svg
          class="h-5 w-5 animate-spin text-gray-400 delight-validating"
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
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="scale-0 opacity-0 rotate-180"
        enter-to-class="scale-100 opacity-100 rotate-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="scale-100 opacity-100 rotate-0"
        leave-to-class="scale-0 opacity-0 rotate-180"
      >
        <div
          v-if="showValidIcon && !hasError && modelValue && !loading"
          class="absolute inset-y-0 right-0 flex items-center pr-4"
          aria-hidden="true"
        >
          <svg
            class="h-5 w-5 text-success-500 delight-success-icon"
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
      </Transition>
    </div>

    <!-- Professional Feedback Message -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 transform translate-y-1 scale-98"
      enter-to-class="opacity-100 transform translate-y-0 scale-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 transform translate-y-0 scale-100"
      leave-to-class="opacity-0 transform translate-y-1 scale-98"
    >
      <div v-if="currentMessage && !error" class="mt-2 professional-feedback" 
           :class="fieldState.validationState === 'valid' ? 'success-state' : 'completion-state'">
        <div class="flex items-start space-x-2">
          <svg v-if="fieldState.validationState === 'valid'" 
               class="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" 
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <div class="text-sm font-medium text-gray-900">{{ currentMessage.title }}</div>
            <div class="text-sm text-gray-600">{{ currentMessage.message }}</div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Error Message -->
    <p
      v-if="error"
      :id="errorId"
      role="alert"
      class="form-error"
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
      v-if="helpText && !error && !currentMessage"
      :id="helpTextId"
      class="form-help"
    >
      {{ helpText }}
    </p>

    <!-- Character Count -->
    <div v-if="showCharacterCount && type === 'text'" class="mt-1 text-right">
      <span 
        class="text-xs transition-colors duration-200 font-mono"
        :class="{
          'text-gray-500': characterCount <= maxLength * 0.8,
          'text-yellow-600': characterCount > maxLength * 0.8 && characterCount <= maxLength * 0.9,
          'text-orange-600': characterCount > maxLength * 0.9 && characterCount < maxLength,
          'text-red-600 font-medium': characterCount >= maxLength
        }"
      >
        <span class="character-counter">{{ characterCount }}</span> / {{ maxLength || 200 }}
        <span v-if="characterCount >= (maxLength || 200)" class="ml-2 text-red-500">Limit reached</span>
        <span v-else-if="characterCount > (maxLength || 200) * 0.9" class="ml-2 text-orange-500">Approaching limit</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { useFormDelight } from '@/composables/useFormDelight'

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
  /** Show character count for text fields */
  showCharacterCount?: boolean
  /** Maximum character length */
  maxLength?: number
  /** Autocomplete attribute for better UX */
  autocomplete?: AutocompleteType
  /** Minimum value (for number/date inputs) */
  min?: string | number
  /** Maximum value (for number/date inputs) */
  max?: string | number
  /** Step value (for number inputs) */
  step?: string | number
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
  showCharacterCount: false,
  autocomplete: 'off',
  maxLength: 200
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

// ===============================
// REACTIVE STATE
// ===============================

const containerRef = ref<HTMLElement>()
const isFocused = ref(false)

// ===============================
// DELIGHT SYSTEM
// ===============================

const {
  fieldState,
  currentMessage,
  delightClasses,
  showValidationFeedback,
  celebrateFieldCompletion,
  updateCompletionScore,
  setFieldFocus,
  clearMessages
} = useFormDelight(props.type, { level: 'standard' })

// ===============================
// COMPUTED PROPERTIES
// ===============================

const fieldId = computed(() => `field-${props.name}`)
const errorId = computed(() => `error-${props.name}`)
const descriptionId = computed(() => `desc-${props.name}`)
const helpTextId = computed(() => `help-${props.name}`)

const hasError = computed(() => !!props.error)
const characterCount = computed(() => String(props.modelValue).length)

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
  const base = 'form-label transition-colors duration-200'
  const stateClasses = hasError.value 
    ? 'text-danger-700' 
    : isFocused.value 
      ? 'text-primary-600' 
      : 'text-gray-700'
  const disabledClasses = props.disabled ? 'opacity-60' : ''
  const customClasses = props.labelClass || ''
  
  return `${base} ${stateClasses} ${disabledClasses} ${customClasses}`.trim()
})

const inputClasses = computed(() => {
  const base = 'w-full min-h-input px-4 py-3 border rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:border-transparent'
  
  // State-specific styling with delight integration
  const stateClasses = hasError.value
    ? 'border-danger-300 bg-danger-50 focus:ring-danger-500 focus:bg-white text-gray-900'
    : fieldState.value.validationState === 'valid'
      ? 'border-success-300 bg-success-50 focus:ring-success-500 focus:bg-white text-gray-900'
      : isFocused.value
        ? 'border-primary-500 bg-white focus:ring-primary-500'
        : 'border-gray-300 bg-white hover:border-gray-400 focus:ring-primary-500'
  
  // Interaction states with enhanced styling
  const disabledClasses = props.disabled 
    ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' 
    : ''
  const readonlyClasses = props.readonly 
    ? 'bg-gray-50 cursor-default border-gray-200' 
    : ''
  
  // Enhanced padding for icons with touch-friendly sizing
  const paddingClasses = (props.loading || (props.showValidIcon && !hasError.value && props.modelValue)) 
    ? 'pr-12' 
    : ''
  
  const customClasses = props.inputClass || ''
  
  return `${base} ${stateClasses} ${disabledClasses} ${readonlyClasses} ${paddingClasses} ${customClasses}`.trim()
})

// ===============================
// EVENT HANDLERS
// ===============================

const handleInput = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = props.type === 'number' ? Number(target.value) : target.value
  
  // Update completion score based on input progress
  if (props.type === 'text') {
    const progress = Math.min(100, (String(value).length / (props.minlength || 1)) * 100)
    updateCompletionScore(progress)
  } else if (value) {
    updateCompletionScore(100)
  } else {
    updateCompletionScore(0)
  }
  
  emit('update:modelValue', value)
  emit('input', event)
}

const handleBlur = async (event: FocusEvent) => {
  isFocused.value = false
  setFieldFocus(false)
  emit('blur', event)
  
  // Trigger validation on blur with delight feedback
  if (containerRef.value) {
    const isValid = validateField()
    const errorMessage = !isValid ? getValidationError() : undefined
    await showValidationFeedback(containerRef.value, isValid, errorMessage, props.label)
    
    // Celebrate completion if field is now complete and valid
    if (isValid && props.modelValue && fieldState.value.completionScore >= 100) {
      await celebrateFieldCompletion(containerRef.value, props.label)
    }
  }
  
  await nextTick()
  emit('validate', props.modelValue)
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  setFieldFocus(true)
  emit('focus', event)
  
  // Clear any previous messages when focusing
  clearMessages()
}

const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event)
  
  // Enhanced keyboard navigation
  if (event.key === 'Escape' && isFocused.value) {
    (event.target as HTMLInputElement).blur()
  }
}

// ===============================
// VALIDATION HELPERS
// ===============================

const validateField = (): boolean => {
  if (props.required && !props.modelValue) return false
  if (props.minlength && String(props.modelValue).length < props.minlength) return false
  if (props.maxLength && String(props.modelValue).length > props.maxLength) return false
  if (props.pattern && !new RegExp(props.pattern).test(String(props.modelValue))) return false
  return true
}

const getValidationError = (): string => {
  if (props.required && !props.modelValue) return `${props.label} is required`
  if (props.minlength && String(props.modelValue).length < props.minlength) return `${props.label} is too short`
  if (props.maxLength && String(props.modelValue).length > props.maxLength) return `${props.label} is too long`
  if (props.pattern && !new RegExp(props.pattern).test(String(props.modelValue))) return `${props.label} format is invalid`
  return 'Invalid input'
}

// ===============================
// PUBLIC METHODS
// ===============================

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

<style scoped>
/* Enhanced character counter with delight */
.character-counter {
  animation: counter-update 0.3s ease-in-out;
}

@keyframes counter-update {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); color: theme('colors.blue.600'); }
  100% { transform: scale(1); }
}
</style>