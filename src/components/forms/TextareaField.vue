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

    <!-- Textarea Field -->
    <div class="relative">
      <textarea
        :id="fieldId"
        :name="name"
        :placeholder="placeholder"
        :readonly="readonly"
        :disabled="disabled"
        :required="required"
        :rows="rows"
        :maxlength="maxlength"
        :minlength="minlength"
        :value="modelValue"
        :aria-describedby="ariaDescribedBy"
        :aria-invalid="hasError"
        :aria-required="required"
        :class="textareaClasses"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
        @keydown="handleKeydown"
      />

      <!-- Character Counter -->
      <div
        v-if="showCharacterCount && maxlength"
        class="absolute bottom-2 right-2 text-xs text-gray-400 bg-white px-1 rounded"
        :class="{ 'text-red-500': characterCount > maxlength * 0.9 }"
      >
        {{ characterCount }}/{{ maxlength }}
      </div>

      <!-- Resize Handle Visual Indicator -->
      <div
        v-if="resizable"
        class="absolute bottom-1 right-1 w-3 h-3 opacity-30"
        aria-hidden="true"
      >
        <svg viewBox="0 0 12 12" class="w-full h-full text-gray-400">
          <path
            d="M12 0v12H0L12 0zM8.5 0v3.5H12V0H8.5zM5 0v7h7V0H5z"
            fill="currentColor"
            opacity="0.3"
          />
        </svg>
      </div>
    </div>

    <!-- Error Message -->
    <p
      v-if="error"
      :id="errorId"
      role="alert"
      class="text-sm text-danger flex items-start space-x-1"
    >
      <svg
        class="h-4 w-4 flex-shrink-0 mt-0.5"
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
 * Enhanced props interface for textarea component
 */
interface Props {
  /** Field name for form identification */
  name: string
  /** Visual label for the field */
  label: string
  /** Current field value */
  modelValue: string
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
  /** Number of visible text lines */
  rows?: number
  /** Maximum character length */
  maxlength?: number
  /** Minimum character length */
  minlength?: number
  /** Show character count indicator */
  showCharacterCount?: boolean
  /** Allow textarea resizing */
  resizable?: boolean
  /** Custom CSS classes for the textarea */
  textareaClass?: string
  /** Custom CSS classes for the label */
  labelClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  rows: 4,
  showCharacterCount: true,
  resizable: true
})

/**
 * Enhanced event emissions
 */
interface Emits {
  'update:modelValue': [value: string]
  'blur': [event: FocusEvent]
  'focus': [event: FocusEvent] 
  'input': [event: Event]
  'keydown': [event: KeyboardEvent]
  'validate': [value: string]
}

const emit = defineEmits<Emits>()

// Reactive state
const isFocused = ref(false)

/**
 * Computed properties for accessibility and functionality
 */
const fieldId = computed(() => `textarea-${props.name}`)
const errorId = computed(() => `error-${props.name}`)
const descriptionId = computed(() => `desc-${props.name}`)
const helpTextId = computed(() => `help-${props.name}`)

const hasError = computed(() => !!props.error)
const characterCount = computed(() => props.modelValue?.length || 0)

const ariaDescribedBy = computed(() => {
  const ids: string[] = []
  if (props.description) ids.push(descriptionId.value)
  if (props.error) ids.push(errorId.value)
  if (props.helpText && !props.error) ids.push(helpTextId.value)
  return ids.length > 0 ? ids.join(' ') : undefined
})

/**
 * Enhanced styling with state management
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

const textareaClasses = computed(() => {
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
  
  // Resize behavior
  const resizeClasses = props.resizable 
    ? 'resize-y' 
    : 'resize-none'
  
  // Character counter padding
  const paddingClasses = (props.showCharacterCount && props.maxlength) 
    ? 'pb-8' 
    : ''
  
  const customClasses = props.textareaClass || ''
  
  return `${base} ${stateClasses} ${disabledClasses} ${readonlyClasses} ${resizeClasses} ${paddingClasses} ${customClasses}`.trim()
})

/**
 * Event handlers with enhanced functionality
 */
const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
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
  
  // Enhanced keyboard shortcuts
  if (event.key === 'Escape' && isFocused.value) {
    ;(event.target as HTMLTextAreaElement).blur()
  }
  
  // Tab behavior for better UX
  if (event.key === 'Tab' && !event.shiftKey) {
    // Allow default tab behavior unless custom handling is needed
  }
}

/**
 * Public methods for parent component interaction
 */
defineExpose({
  focus: () => {
    const textarea = document.getElementById(fieldId.value) as HTMLTextAreaElement
    textarea?.focus()
  },
  blur: () => {
    const textarea = document.getElementById(fieldId.value) as HTMLTextAreaElement
    textarea?.blur()
  },
  select: () => {
    const textarea = document.getElementById(fieldId.value) as HTMLTextAreaElement
    textarea?.select()
  }
})
</script>