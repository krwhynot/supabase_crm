<template>
  <fieldset class="space-y-3">
    <!-- Legend (acts as label for the group) -->
    <legend :class="legendClasses">
      {{ label }}
      <span v-if="required" class="text-danger ml-1" aria-label="required">*</span>
    </legend>

    <!-- Description -->
    <p
      v-if="description"
      :id="descriptionId"
      class="text-sm text-gray-600 -mt-1"
    >
      {{ description }}
    </p>

    <!-- Radio Options -->
    <div :class="optionsContainerClasses">
      <div
        v-for="option in normalizedOptions"
        :key="getOptionKey(option)"
        class="flex items-start space-x-3"
      >
        <div class="relative flex-shrink-0 mt-0.5">
          <input
            :id="getOptionId(option)"
            :name="name"
            type="radio"
            :value="getOptionValue(option)"
            :disabled="disabled || getOptionDisabled(option)"
            :required="required"
            :checked="isOptionSelected(option)"
            :aria-describedby="ariaDescribedBy"
            :aria-invalid="hasError"
            :class="radioClasses"
            @change="handleChange"
            @blur="handleBlur"
            @focus="handleFocus"
            @keydown="handleKeydown"
          />

          <!-- Custom radio styling overlay -->
          <div
            v-if="!disabled && !getOptionDisabled(option)"
            :class="getRadioOverlayClasses(option)"
            aria-hidden="true"
          >
            <!-- Radio dot -->
            <div
              v-show="isOptionSelected(option)"
              class="w-2 h-2 bg-white rounded-full"
            />
          </div>
        </div>

        <!-- Option label and description -->
        <div class="flex-1 min-w-0">
          <label
            :for="getOptionId(option)"
            :class="getOptionLabelClasses(option)"
          >
            {{ getOptionLabel(option) }}
          </label>

          <!-- Option description -->
          <p
            v-if="getOptionDescription(option)"
            class="text-sm text-gray-500 mt-1"
          >
            {{ getOptionDescription(option) }}
          </p>
        </div>
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
  </fieldset>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'

/**
 * Radio option type definitions
 */
interface RadioOption {
  value: string | number
  label: string
  description?: string
  disabled?: boolean
}

/**
 * Layout options for radio button arrangement
 */
type RadioLayout = 'vertical' | 'horizontal' | 'grid'

/**
 * Enhanced props interface for radio group component
 */
interface Props {
  /** Field name for form identification */
  name: string
  /** Visual label for the radio group */
  label: string
  /** Current selected value */
  modelValue: string | number | null
  /** Options array - supports strings or objects */
  options: string[] | RadioOption[]
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
  /** Layout arrangement of radio options */
  layout?: RadioLayout
  /** Number of columns for grid layout */
  gridColumns?: number
  /** Custom CSS classes for the fieldset */
  fieldsetClass?: string
  /** Custom CSS classes for the legend */
  legendClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'vertical',
  gridColumns: 2
})

/**
 * Enhanced event emissions
 */
interface Emits {
  'update:modelValue': [value: string | number | null]
  'blur': [event: FocusEvent]
  'focus': [event: FocusEvent] 
  'change': [event: Event, value: string | number]
  'keydown': [event: KeyboardEvent]
  'validate': [value: string | number | null]
}

const emit = defineEmits<Emits>()

// Reactive state
const focusedOption = ref<string | number | null>(null)

/**
 * Computed properties for accessibility and functionality
 */
const fieldId = computed(() => `radio-${props.name}`)
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

// Normalize options to consistent format
const normalizedOptions = computed((): RadioOption[] => {
  return props.options.map(option => {
    if (typeof option === 'string') {
      return {
        value: option,
        label: option
      }
    }
    return option
  })
})

/**
 * Option utility functions
 */
const getOptionKey = (option: RadioOption): string | number => option.value
const getOptionValue = (option: RadioOption): string | number => option.value
const getOptionLabel = (option: RadioOption): string => option.label
const getOptionDescription = (option: RadioOption): string | undefined => option.description
const getOptionDisabled = (option: RadioOption): boolean => option.disabled || false
const getOptionId = (option: RadioOption): string => `${fieldId.value}-${option.value}`

const isOptionSelected = (option: RadioOption): boolean => {
  return props.modelValue === option.value
}

/**
 * Enhanced styling with state management
 */
const legendClasses = computed(() => {
  const base = 'text-sm font-medium mb-3'
  const stateClasses = hasError.value ? 'text-red-700' : 'text-gray-700'
  const disabledClasses = props.disabled ? 'opacity-60' : ''
  const customClasses = props.legendClass || ''
  
  return `${base} ${stateClasses} ${disabledClasses} ${customClasses}`.trim()
})

const optionsContainerClasses = computed(() => {
  const base = 'space-y-3'
  
  switch (props.layout) {
    case 'horizontal':
      return 'flex flex-wrap gap-6'
    case 'grid':
      return `grid grid-cols-1 md:grid-cols-${props.gridColumns} gap-4`
    default:
      return base
  }
})

const radioClasses = computed(() => {
  const base = 'sr-only' // Hide default radio, use custom styling
  return base
})

const getRadioOverlayClasses = (option: RadioOption) => {
  const base = 'absolute inset-0 flex items-center justify-center w-5 h-5 border-2 rounded-full transition-all duration-200 cursor-pointer'
  
  // State-specific styling
  const isSelected = isOptionSelected(option)
  const isFocused = focusedOption.value === option.value
  const isDisabled = props.disabled || getOptionDisabled(option)
  
  let stateClasses = ''
  if (hasError.value) {
    stateClasses = 'border-red-500'
  } else if (isSelected) {
    stateClasses = 'border-primary bg-primary'
  } else if (isFocused) {
    stateClasses = 'border-primary bg-primary/10'
  } else {
    stateClasses = 'border-gray-300 hover:border-primary'
  }
  
  const disabledClasses = isDisabled 
    ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-300' 
    : ''
  
  return `${base} ${stateClasses} ${disabledClasses}`.trim()
}

const getOptionLabelClasses = (option: RadioOption) => {
  const base = 'block text-sm font-medium cursor-pointer transition-colors duration-200'
  const isDisabled = props.disabled || getOptionDisabled(option)
  const isFocused = focusedOption.value === option.value
  
  const stateClasses = hasError.value 
    ? 'text-red-700' 
    : isFocused 
      ? 'text-primary' 
      : 'text-gray-700'
  const disabledClasses = isDisabled ? 'opacity-60 cursor-not-allowed' : ''
  
  return `${base} ${stateClasses} ${disabledClasses}`.trim()
}

/**
 * Event handlers with enhanced functionality
 */
const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value
  
  // Convert to number if original option was a number
  const normalizedValue = normalizedOptions.value.find(opt => 
    String(opt.value) === value
  )?.value || value
  
  emit('update:modelValue', normalizedValue)
  emit('change', event, normalizedValue)
}

const handleBlur = async (event: FocusEvent) => {
  focusedOption.value = null
  emit('blur', event)
  
  // Trigger validation on blur
  await nextTick()
  emit('validate', props.modelValue)
}

const handleFocus = (event: FocusEvent) => {
  const target = event.target as HTMLInputElement
  focusedOption.value = target.value
  emit('focus', event)
}

const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event)
  
  const target = event.target as HTMLInputElement
  const currentIndex = normalizedOptions.value.findIndex(opt => 
    String(opt.value) === target.value
  )
  
  // Enhanced keyboard navigation
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      event.preventDefault()
      selectNextOption(currentIndex, 1)
      break
    case 'ArrowUp':
    case 'ArrowLeft':
      event.preventDefault()
      selectNextOption(currentIndex, -1)
      break
    case 'Home':
      event.preventDefault()
      selectOption(0)
      break
    case 'End':
      event.preventDefault()
      selectOption(normalizedOptions.value.length - 1)
      break
    case 'Escape':
      target.blur()
      break
  }
}

/**
 * Navigation helper functions
 */
const selectNextOption = (currentIndex: number, direction: number) => {
  const options = normalizedOptions.value
  let nextIndex = currentIndex + direction
  
  // Wrap around
  if (nextIndex >= options.length) nextIndex = 0
  if (nextIndex < 0) nextIndex = options.length - 1
  
  // Skip disabled options
  while (options[nextIndex]?.disabled && nextIndex !== currentIndex) {
    nextIndex += direction
    if (nextIndex >= options.length) nextIndex = 0
    if (nextIndex < 0) nextIndex = options.length - 1
  }
  
  selectOption(nextIndex)
}

const selectOption = (index: number) => {
  const option = normalizedOptions.value[index]
  if (option && !option.disabled) {
    const radioElement = document.getElementById(getOptionId(option)) as HTMLInputElement
    radioElement?.focus()
    radioElement?.click()
  }
}

/**
 * Public methods for parent component interaction
 */
defineExpose({
  focus: () => {
    // Focus the selected option or the first option
    const selectedOption = normalizedOptions.value.find(opt => opt.value === props.modelValue)
    const targetOption = selectedOption || normalizedOptions.value[0]
    if (targetOption) {
      const radioElement = document.getElementById(getOptionId(targetOption)) as HTMLInputElement
      radioElement?.focus()
    }
  },
  selectValue: (value: string | number) => {
    const option = normalizedOptions.value.find(opt => opt.value === value)
    if (option) {
      emit('update:modelValue', value)
    }
  }
})
</script>