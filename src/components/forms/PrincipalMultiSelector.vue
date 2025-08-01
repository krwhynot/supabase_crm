<template>
  <div class="space-y-2">
    <!-- Multi-select field for principals -->
    <div class="relative">
      <div
        ref="containerRef"
        :class="[
          'min-h-[2.5rem] w-full px-3 py-2 border rounded-md focus-within:outline-none focus-within:ring-2 transition-colors duration-200 cursor-text',
          error ? 'border-red-500 focus-within:ring-red-500' : 'border-gray-300 focus-within:ring-blue-500'
        ]"
        @click="focusInput"
      >
        <!-- Selected principals as tags -->
        <div class="flex flex-wrap gap-2 items-center">
          <div
            v-for="principalId in modelValue"
            :key="principalId"
            class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
          >
            {{ getPrincipalLabel(principalId) }}
            <button
              type="button"
              @click.stop="removePrincipal(principalId)"
              class="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 focus:outline-none focus:bg-blue-200"
              :aria-label="`Remove ${getPrincipalLabel(principalId)}`"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <!-- Input for searching/adding principals -->
          <input
            ref="inputRef"
            v-model="searchQuery"
            type="text"
            :placeholder="modelValue.length === 0 ? placeholder : ''"
            class="flex-1 min-w-[120px] border-0 p-0 focus:ring-0 focus:outline-none bg-transparent"
            @input="handleInput"
            @keydown="handleKeydown"
            @focus="showDropdown = true"
            @blur="handleBlur"
            :aria-describedby="error ? `${name}-error` : undefined"
            :aria-invalid="!!error"
          />
        </div>
      </div>
      
      <!-- Dropdown with principal options -->
      <div
        v-if="showDropdown && filteredOptions.length > 0"
        class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
      >
        <div
          v-for="option in filteredOptions"
          :key="option.value"
          @mousedown.prevent="selectPrincipal(option.value)"
          class="px-3 py-2 cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
          :class="{
            'bg-blue-50': modelValue.includes(option.value)
          }"
          role="option"
          :aria-selected="modelValue.includes(option.value)"
        >
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-medium text-gray-900">{{ option.label }}</div>
              <div v-if="option.description" class="text-xs text-gray-500">{{ option.description }}</div>
            </div>
            <svg
              v-if="modelValue.includes(option.value)"
              class="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        
        <!-- No results message -->
        <div
          v-if="searchQuery && filteredOptions.length === 0"
          class="px-3 py-2 text-sm text-gray-500"
        >
          No principals found matching "{{ searchQuery }}"
        </div>
      </div>
    </div>
    
    <!-- Error message -->
    <div
      v-if="error"
      :id="`${name}-error`"
      class="text-sm text-red-600"
      role="alert"
    >
      {{ error }}
    </div>
    
    <!-- Helper text -->
    <div v-if="!error && helperText" class="text-xs text-gray-500">
      {{ helperText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'

/**
 * Props interface
 */
interface Props {
  /** Field name */
  name: string
  /** Selected principal IDs */
  modelValue: string[]
  /** Validation error message */
  error?: string
  /** Placeholder text */
  placeholder?: string
  /** Helper text */
  helperText?: string
  /** Whether multiple selection is allowed */
  allowMultiple?: boolean
  /** Loading state */
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select principals...',
  allowMultiple: true,
  loading: false
})

/**
 * Event emissions
 */
interface Emits {
  'update:modelValue': [value: string[]]
  'validate': [fieldName: string, value: string[]]
}

const emit = defineEmits<Emits>()

// Component state
const searchQuery = ref('')
const showDropdown = ref(false)
const inputRef = ref<HTMLInputElement>()
const containerRef = ref<HTMLDivElement>()

// Mock principal options (would be loaded from API/store)
const principalOptions = [
  { value: 'prin-1', label: 'ABC Foods Inc.', description: 'Premium food manufacturer' },
  { value: 'prin-2', label: 'XYZ Beverages Corp.', description: 'National beverage distributor' },
  { value: 'prin-3', label: 'Global Ingredients Ltd.', description: 'Specialty ingredients supplier' },
  { value: 'prin-4', label: 'Fresh Products Co.', description: 'Organic produce distributor' },
  { value: 'prin-5', label: 'Quality Meats LLC.', description: 'Premium meat processor' },
  { value: 'prin-6', label: 'Dairy Excellence Inc.', description: 'Regional dairy processor' },
  { value: 'prin-7', label: 'Spice World Trading', description: 'International spice importer' },
  { value: 'prin-8', label: 'Frozen Foods Direct', description: 'Frozen food manufacturer' }
]

/**
 * Computed properties
 */
const filteredOptions = computed(() => {
  if (!searchQuery.value.trim()) {
    return principalOptions
  }
  
  const query = searchQuery.value.toLowerCase()
  return principalOptions.filter(option =>
    option.label.toLowerCase().includes(query) ||
    (option.description && option.description.toLowerCase().includes(query))
  )
})

/**
 * Utility functions
 */
const getPrincipalLabel = (principalId: string): string => {
  const principal = principalOptions.find(p => p.value === principalId)
  return principal ? principal.label : principalId
}

const focusInput = () => {
  nextTick(() => {
    inputRef.value?.focus()
  })
}

/**
 * Selection handlers
 */
const selectPrincipal = (principalId: string) => {
  let newValue: string[]
  
  if (props.modelValue.includes(principalId)) {
    // Remove if already selected
    newValue = props.modelValue.filter(id => id !== principalId)
  } else {
    // Add to selection
    if (props.allowMultiple) {
      newValue = [...props.modelValue, principalId]
    } else {
      newValue = [principalId]
    }
  }
  
  emit('update:modelValue', newValue)
  emit('validate', props.name, newValue)
  
  // Clear search and hide dropdown
  searchQuery.value = ''
  showDropdown.value = false
  
  // Focus input for continued typing
  focusInput()
}

const removePrincipal = (principalId: string) => {
  const newValue = props.modelValue.filter(id => id !== principalId)
  emit('update:modelValue', newValue)
  emit('validate', props.name, newValue)
}

/**
 * Input handlers
 */
const handleInput = () => {
  showDropdown.value = true
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    showDropdown.value = false
    searchQuery.value = ''
  } else if (event.key === 'Backspace' && !searchQuery.value && props.modelValue.length > 0) {
    // Remove last selected principal if backspace is pressed with empty search
    const newValue = props.modelValue.slice(0, -1)
    emit('update:modelValue', newValue)
    emit('validate', props.name, newValue)
  } else if (event.key === 'Enter' && filteredOptions.value.length > 0) {
    event.preventDefault()
    const firstOption = filteredOptions.value[0]
    if (!props.modelValue.includes(firstOption.value)) {
      selectPrincipal(firstOption.value)
    }
  }
}

const handleBlur = () => {
  // Small delay to allow click events on dropdown items
  setTimeout(() => {
    showDropdown.value = false
    searchQuery.value = ''
  }, 150)
}

/**
 * Lifecycle hooks
 */
onMounted(() => {
  // Emit initial validation
  emit('validate', props.name, props.modelValue)
})
</script>