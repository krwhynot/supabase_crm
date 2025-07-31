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

    <!-- Segment Selector with Type-ahead -->
    <div class="relative">
      <!-- Input Field -->
      <input
        :id="fieldId"
        ref="inputRef"
        :name="name"
        type="text"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :value="displayValue"
        :aria-describedby="ariaDescribedBy"
        :aria-invalid="hasError"
        :aria-required="required"
        :aria-expanded="isDropdownOpen"
        :aria-haspopup="true"
        :aria-owns="dropdownId"
        :class="inputClasses"
        autocomplete="off"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
      />

      <!-- Dropdown Toggle Button -->
      <button
        type="button"
        :disabled="disabled"
        class="absolute inset-y-0 right-0 flex items-center pr-2"
        aria-label="Toggle dropdown"
        @click="toggleDropdown"
      >
        <svg
          :class="[
            'h-4 w-4 transition-transform duration-200',
            isDropdownOpen ? 'rotate-180' : '',
            hasError ? 'text-red-500' : 'text-gray-400'
          ]"
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
      </button>

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

      <!-- Dropdown Options -->
      <div
        v-if="isDropdownOpen"
        :id="dropdownId"
        :class="dropdownClasses"
        role="listbox"
        :aria-label="`${label} options`"
      >
        <!-- No Results -->
        <div
          v-if="filteredOptions.length === 0 && !showAddNew"
          class="px-3 py-2 text-sm text-gray-500"
          role="option"
          aria-selected="false"
        >
          No segments found
        </div>

        <!-- Filtered Options -->
        <button
          v-for="(option, index) in filteredOptions"
          :key="option.value"
          type="button"
          :class="[
            'w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none',
            index === highlightedIndex ? 'bg-primary-50 text-primary-900' : 'text-gray-900'
          ]"
          role="option"
          :aria-selected="option.value === modelValue"
          @click="selectOption(option)"
          @mouseenter="highlightedIndex = index"
        >
          <div class="flex items-center justify-between">
            <span>{{ option.label }}</span>
            <!-- Selected Indicator -->
            <svg
              v-if="option.value === modelValue"
              class="h-4 w-4 text-primary-600"
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
          <!-- Option Description -->
          <p
            v-if="option.description"
            class="text-xs text-gray-500 mt-1"
          >
            {{ option.description }}
          </p>
        </button>

        <!-- Add New Option -->
        <div
          v-if="showAddNew"
          class="border-t border-gray-200"
        >
          <button
            type="button"
            :class="[
              'w-full text-left px-3 py-2 text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none',
              highlightedIndex === filteredOptions.length ? 'bg-blue-50 text-blue-900' : 'text-blue-700'
            ]"
            role="option"
            aria-selected="false"
            @click="handleAddNew"
            @mouseenter="highlightedIndex = filteredOptions.length"
          >
            <div class="flex items-center">
              <svg
                class="h-4 w-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add new segment: "{{ searchQuery }}"
            </div>
          </button>
        </div>

        <!-- Popular Segments -->
        <div
          v-if="showPopularSegments && popularSegments.length > 0"
          class="border-t border-gray-200"
        >
          <div class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Popular Segments
          </div>
          <button
            v-for="segment in popularSegments"
            :key="`popular-${segment.value}`"
            type="button"
            class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
            role="option"
            :aria-selected="segment.value === modelValue"
            @click="selectOption(segment)"
          >
            <div class="flex items-center justify-between">
              <span>{{ segment.label }}</span>
              <span class="text-xs text-gray-400">{{ segment.count }} orgs</span>
            </div>
          </button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

/**
 * Segment option interface
 */
interface SegmentOption {
  value: string
  label: string
  description?: string
  count?: number
}

/**
 * Props interface
 */
interface Props {
  /** Field name for form identification */
  name: string
  /** Visual label for the field */
  label: string
  /** Current field value */
  modelValue: string
  /** Available segment options */
  options?: SegmentOption[]
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
  /** Whether options are currently loading */
  loading?: boolean
  /** Whether to allow adding new segments */
  allowAddNew?: boolean
  /** Popular segments to show */
  popularSegments?: SegmentOption[]
  /** Minimum characters to trigger search */
  minSearchLength?: number
  /** Custom CSS classes for the input */
  inputClass?: string
  /** Custom CSS classes for the label */
  labelClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select or type a segment...',
  options: () => [],
  allowAddNew: true,
  popularSegments: () => [],
  minSearchLength: 1
})

/**
 * Event emissions
 */
interface Emits {
  'update:modelValue': [value: string]
  'add-new': [value: string]
  'search': [query: string]
  'focus': [event: FocusEvent]
  'blur': [event: FocusEvent]
  'validate': [value: string]
}

const emit = defineEmits<Emits>()

// Template refs
const inputRef = ref<HTMLInputElement>()

// Component state
const isDropdownOpen = ref(false)
const searchQuery = ref('')
const highlightedIndex = ref(-1)
const isFocused = ref(false)

// Default segment options
const defaultSegments: SegmentOption[] = [
  { value: 'Technology', label: 'Technology', description: 'Software, hardware, and tech services' },
  { value: 'Healthcare', label: 'Healthcare', description: 'Medical, pharmaceutical, and health services' },
  { value: 'Finance', label: 'Finance', description: 'Banking, insurance, and financial services' },
  { value: 'Manufacturing', label: 'Manufacturing', description: 'Production and industrial companies' },
  { value: 'Retail', label: 'Retail', description: 'Consumer goods and retail services' },
  { value: 'Education', label: 'Education', description: 'Schools, universities, and educational services' },
  { value: 'Real Estate', label: 'Real Estate', description: 'Property development and real estate services' },
  { value: 'Energy', label: 'Energy', description: 'Oil, gas, renewable energy, and utilities' },
  { value: 'Transportation', label: 'Transportation', description: 'Logistics, shipping, and transportation' },
  { value: 'Media', label: 'Media', description: 'Publishing, broadcasting, and entertainment' },
  { value: 'Agriculture', label: 'Agriculture', description: 'Farming, food production, and agribusiness' },
  { value: 'Construction', label: 'Construction', description: 'Building and construction services' },
  { value: 'Consulting', label: 'Consulting', description: 'Business and professional consulting' },
  { value: 'Government', label: 'Government', description: 'Public sector and government agencies' },
  { value: 'Non-Profit', label: 'Non-Profit', description: 'Charitable organizations and NGOs' }
]

/**
 * Computed properties
 */
const fieldId = computed(() => `segment-${props.name}`)
const dropdownId = computed(() => `segment-dropdown-${props.name}`)
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

// Combined options (default + custom)
const allOptions = computed(() => {
  const customOptions = props.options || []
  const combined = [...customOptions]
  
  // Add default segments that aren't already in custom options
  defaultSegments.forEach(defaultSegment => {
    if (!combined.some(option => option.value.toLowerCase() === defaultSegment.value.toLowerCase())) {
      combined.push(defaultSegment)
    }
  })
  
  return combined.sort((a, b) => a.label.localeCompare(b.label))
})

// Display value for input
const displayValue = computed(() => {
  if (isDropdownOpen.value && searchQuery.value !== '') {
    return searchQuery.value
  }
  return props.modelValue || ''
})

// Filtered options based on search
const filteredOptions = computed(() => {
  if (!searchQuery.value || searchQuery.value.length < props.minSearchLength) {
    return allOptions.value.slice(0, 10) // Show top 10 when no search
  }
  
  const query = searchQuery.value.toLowerCase()
  return allOptions.value
    .filter(option => 
      option.label.toLowerCase().includes(query) ||
      option.description?.toLowerCase().includes(query)
    )
    .slice(0, 20) // Limit results
})

// Show add new option
const showAddNew = computed(() => {
  if (!props.allowAddNew || !searchQuery.value || searchQuery.value.length < props.minSearchLength) {
    return false
  }
  
  // Don't show if exact match exists
  const exactMatch = allOptions.value.some(option => 
    option.label.toLowerCase() === searchQuery.value.toLowerCase()
  )
  
  return !exactMatch
})

// Show popular segments
const showPopularSegments = computed(() => {
  return !searchQuery.value && props.popularSegments.length > 0
})

/**
 * Styling
 */
const labelClasses = computed(() => {
  const base = 'block text-sm font-medium transition-colors duration-200'
  const stateClasses = hasError.value 
    ? 'text-red-700' 
    : isFocused.value 
      ? 'text-primary-600' 
      : 'text-gray-700'
  const disabledClasses = props.disabled ? 'opacity-60' : ''
  const customClasses = props.labelClass || ''
  
  return `${base} ${stateClasses} ${disabledClasses} ${customClasses}`.trim()
})

const inputClasses = computed(() => {
  const base = 'w-full px-3 py-2 pr-10 border rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent'
  
  const stateClasses = hasError.value
    ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:bg-white'
    : isFocused.value
      ? 'border-primary-500 bg-white focus:ring-primary-500'
      : 'border-gray-300 bg-white hover:border-gray-400 focus:ring-primary-500'
  
  const disabledClasses = props.disabled 
    ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
    : 'cursor-text'
  
  const loadingClasses = props.loading ? 'pr-16' : ''
  
  const customClasses = props.inputClass || ''
  
  return `${base} ${stateClasses} ${disabledClasses} ${loadingClasses} ${customClasses}`.trim()
})

const dropdownClasses = computed(() => {
  return [
    'absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg',
    'max-h-60 overflow-auto focus:outline-none'
  ].join(' ')
})

/**
 * Event handlers
 */
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  searchQuery.value = target.value
  
  // Open dropdown when typing
  if (!isDropdownOpen.value && target.value.length >= props.minSearchLength) {
    openDropdown()
  }
  
  // Reset highlighted index
  highlightedIndex.value = -1
  
  // Emit search event
  if (target.value.length >= props.minSearchLength) {
    emit('search', target.value)
  }
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
  
  // Set search query to current value for editing
  searchQuery.value = props.modelValue || ''
  
  // Open dropdown after a short delay
  setTimeout(() => {
    openDropdown()
  }, 100)
}

const handleBlur = (event: FocusEvent) => {
  // Delay blur to allow for dropdown interactions
  setTimeout(() => {
    isFocused.value = false
    closeDropdown()
    
    // If no option was selected and we have a search query, select it
    if (searchQuery.value && !props.modelValue) {
      // Check if it matches an existing option
      const exactMatch = allOptions.value.find(option => 
        option.label.toLowerCase() === searchQuery.value.toLowerCase()
      )
      
      if (exactMatch) {
        selectOption(exactMatch)
      } else if (props.allowAddNew) {
        handleAddNew()
      }
    }
    
    // Reset search query to display value
    searchQuery.value = ''
    
    emit('blur', event)
    emit('validate', props.modelValue)
  }, 200)
}

const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      if (!isDropdownOpen.value) {
        openDropdown()
      } else {
        const maxIndex = showAddNew.value ? filteredOptions.value.length : filteredOptions.value.length - 1
        highlightedIndex.value = Math.min(highlightedIndex.value + 1, maxIndex)
      }
      break
      
    case 'ArrowUp':
      event.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1)
      break
      
    case 'Enter':
      event.preventDefault()
      if (isDropdownOpen.value) {
        if (highlightedIndex.value === filteredOptions.value.length && showAddNew.value) {
          handleAddNew()
        } else if (highlightedIndex.value >= 0 && highlightedIndex.value < filteredOptions.value.length) {
          selectOption(filteredOptions.value[highlightedIndex.value])
        }
      }
      break
      
    case 'Escape':
      event.preventDefault()
      closeDropdown()
      inputRef.value?.blur()
      break
      
    case 'Tab':
      closeDropdown()
      break
  }
}

const toggleDropdown = () => {
  if (isDropdownOpen.value) {
    closeDropdown()
  } else {
    openDropdown()
    inputRef.value?.focus()
  }
}

const openDropdown = () => {
  if (!props.disabled) {
    isDropdownOpen.value = true
    highlightedIndex.value = -1
  }
}

const closeDropdown = () => {
  isDropdownOpen.value = false
  highlightedIndex.value = -1
}

/**
 * Option selection
 */
const selectOption = (option: SegmentOption) => {
  emit('update:modelValue', option.value)
  searchQuery.value = ''
  closeDropdown()
  inputRef.value?.blur()
}

const handleAddNew = () => {
  if (searchQuery.value.trim()) {
    const newValue = searchQuery.value.trim()
    emit('add-new', newValue)
    emit('update:modelValue', newValue)
    searchQuery.value = ''
    closeDropdown()
    inputRef.value?.blur()
  }
}

/**
 * Click outside handler
 */
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  const dropdown = document.getElementById(dropdownId.value)
  const input = inputRef.value
  
  if (dropdown && input && !dropdown.contains(target) && !input.contains(target)) {
    closeDropdown()
  }
}

/**
 * Lifecycle hooks
 */
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

/**
 * Watch for model value changes
 */
watch(() => props.modelValue, (newValue) => {
  if (!isFocused.value) {
    searchQuery.value = newValue || ''
  }
})
</script>