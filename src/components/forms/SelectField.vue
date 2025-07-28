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

    <!-- Select Field -->
    <div class="relative">
      <select
        :id="fieldId"
        :name="name"
        :disabled="disabled"
        :required="required"
        :multiple="multiple"
        :size="multiple ? (size || Math.min(options.length, 5)) : undefined"
        :value="modelValue"
        :aria-describedby="ariaDescribedBy"
        :aria-invalid="hasError"
        :aria-required="required"
        :class="selectClasses"
        @change="handleChange"
        @blur="handleBlur"
        @focus="handleFocus"
        @keydown="handleKeydown"
      >
        <!-- Placeholder option for single select -->
        <option
          v-if="!multiple && placeholder"
          value=""
          :disabled="required"
        >
          {{ placeholder }}
        </option>

        <!-- Options rendering with support for objects and strings -->
        <template v-if="isObjectOptions">
          <optgroup
            v-for="group in groupedObjectOptions"
            :key="group.label"
            :label="group.label"
          >
            <option
              v-for="option in group.options"
              :key="getOptionKey(option)"
              :value="getOptionValue(option)"
              :disabled="getOptionDisabled(option)"
            >
              {{ getOptionLabel(option) }}
            </option>
          </optgroup>
        </template>

        <template v-else>
          <option
            v-for="option in options"
            :key="String(option)"
            :value="option"
          >
            {{ option }}
          </option>
        </template>
      </select>

      <!-- Custom dropdown arrow for better styling -->
      <div
        v-if="!multiple"
        class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none"
        aria-hidden="true"
      >
        <svg
          class="h-4 w-4 text-gray-400"
          :class="{ 'text-red-500': hasError }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      <!-- Loading Spinner -->
      <div
        v-if="loading"
        class="absolute inset-y-0 right-8 flex items-center pr-3"
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

    <!-- Multiple selection counter -->
    <p
      v-if="multiple && Array.isArray(modelValue) && modelValue.length > 0"
      class="text-sm text-gray-600"
    >
      {{ modelValue.length }} item{{ modelValue.length === 1 ? '' : 's' }} selected
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'

/**
 * Option type definitions for flexible option handling
 */
interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
  group?: string
}

interface SelectOptionGroup {
  label: string
  options: SelectOption[]
}

/**
 * Enhanced props interface with comprehensive select functionality
 */
interface Props {
  /** Field name for form identification */
  name: string
  /** Visual label for the field */
  label: string
  /** Current field value - string for single, array for multiple */
  modelValue: string | number | (string | number)[]
  /** Options array - supports strings or objects */
  options: string[] | SelectOption[]
  /** Validation error message */
  error?: string
  /** Placeholder text for single select */
  placeholder?: string
  /** Field description for additional context */
  description?: string
  /** Help text shown when no error is present */
  helpText?: string
  /** Whether field is required */
  required?: boolean
  /** Whether field is disabled */
  disabled?: boolean
  /** Allow multiple selections */
  multiple?: boolean
  /** Size attribute for multiple select (number of visible options) */
  size?: number
  /** Whether options are currently loading */
  loading?: boolean
  /** Custom CSS classes for the select */
  selectClass?: string
  /** Custom CSS classes for the label */
  labelClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select an option'
})

/**
 * Enhanced event emissions
 */
interface Emits {
  'update:modelValue': [value: string | number | (string | number)[]]
  'blur': [event: FocusEvent]
  'focus': [event: FocusEvent] 
  'change': [event: Event]
  'keydown': [event: KeyboardEvent]
  'validate': [value: string | number | (string | number)[]]
}

const emit = defineEmits<Emits>()

// Reactive state
const isFocused = ref(false)

/**
 * Computed properties for option handling and accessibility
 */
const fieldId = computed(() => `select-${props.name}`)
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

// Check if options are objects or strings
const isObjectOptions = computed(() => 
  props.options.length > 0 && typeof props.options[0] === 'object'
)

// Group object options by group property
const groupedObjectOptions = computed((): SelectOptionGroup[] => {
  if (!isObjectOptions.value) return []
  
  const options = props.options as SelectOption[]
  const groups = new Map<string, SelectOption[]>()
  
  options.forEach(option => {
    const groupName = option.group || 'Options'
    if (!groups.has(groupName)) {
      groups.set(groupName, [])
    }
    groups.get(groupName)!.push(option)
  })
  
  return Array.from(groups.entries()).map(([label, options]) => ({
    label,
    options
  }))
})

/**
 * Option handling utilities
 */
const getOptionKey = (option: SelectOption): string | number => option.value
const getOptionValue = (option: SelectOption): string | number => option.value
const getOptionLabel = (option: SelectOption): string => option.label
const getOptionDisabled = (option: SelectOption): boolean => option.disabled || false

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

const selectClasses = computed(() => {
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
    : 'cursor-pointer'
  
  // Multiple select specific styling
  const multipleClasses = props.multiple 
    ? 'py-1' 
    : 'pr-10'  // Space for dropdown arrow
  
  // Loading padding
  const loadingClasses = props.loading ? 'pr-16' : ''
  
  const customClasses = props.selectClass || ''
  
  return `${base} ${stateClasses} ${disabledClasses} ${multipleClasses} ${loadingClasses} ${customClasses}`.trim()
})

/**
 * Event handlers with enhanced functionality
 */
const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  
  if (props.multiple) {
    // Handle multiple selection
    const selectedValues: string[] = []
    for (let i = 0; i < target.options.length; i++) {
      if (target.options[i].selected) {
        selectedValues.push(target.options[i].value)
      }
    }
    emit('update:modelValue', selectedValues)
  } else {
    // Handle single selection
    emit('update:modelValue', target.value)
  }
  
  emit('change', event)
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
    (event.target as HTMLSelectElement).blur()
  }
  
  // Space bar handling for better UX
  if (event.key === ' ' && !props.multiple) {
    event.preventDefault()
    ;(event.target as HTMLSelectElement).click()
  }
}

/**
 * Public methods for parent component interaction
 */
defineExpose({
  focus: () => {
    const select = document.getElementById(fieldId.value) as HTMLSelectElement
    select?.focus()
  },
  blur: () => {
    const select = document.getElementById(fieldId.value) as HTMLSelectElement
    select?.blur()
  }
})
</script>