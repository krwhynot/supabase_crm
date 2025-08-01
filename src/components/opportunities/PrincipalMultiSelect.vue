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

    <!-- Multi-Select Dropdown -->
    <div class="relative">
      <div
        :class="containerClasses"
        @click="toggleDropdown"
      >
        <!-- Selected Items Display -->
        <div class="flex flex-wrap gap-1 min-h-[2.5rem] items-center p-2">
          <!-- Selected Principal Chips -->
          <div
            v-for="principalId in modelValue"
            :key="principalId"
            class="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-800 text-sm rounded-md border border-primary-200"
          >
            <span class="font-medium">{{ getPrincipalName(principalId) }}</span>
            <button
              type="button"
              @click.stop="removePrincipal(principalId)"
              :aria-label="`Remove ${getPrincipalName(principalId)}`"
              class="text-primary-600 hover:text-primary-800 focus:outline-none focus:ring-1 focus:ring-primary-500 rounded"
            >
              <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Placeholder when no selection -->
          <span 
            v-if="modelValue.length === 0 && placeholder"
            class="text-gray-500 text-sm"
          >
            {{ placeholder }}
          </span>
        </div>

        <!-- Dropdown Arrow -->
        <div
          class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none"
          aria-hidden="true"
        >
          <svg
            :class="[
              'h-4 w-4 transition-transform duration-200',
              isOpen ? 'rotate-180' : '',
              hasError ? 'text-red-500' : 'text-gray-400'
            ]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <!-- Dropdown Options -->
      <div
        v-if="isOpen"
        :class="dropdownClasses"
        role="listbox"
        :aria-labelledby="fieldId"
        :aria-expanded="isOpen"
      >
        <!-- Search Input -->
        <div class="p-2 border-b border-gray-200">
          <input
            ref="searchInput"
            v-model="searchTerm"
            type="text"
            placeholder="Search principals..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            @click.stop
          />
        </div>

        <!-- Options List -->
        <div class="max-h-48 overflow-y-auto">
          <div
            v-for="principal in filteredPrincipals"
            :key="principal.id"
            :class="optionClasses(principal.id)"
            role="option"
            :aria-selected="isSelected(principal.id)"
            @click="toggleSelection(principal.id)"
          >
            <!-- Checkbox -->
            <div class="flex items-center">
              <input
                type="checkbox"
                :checked="isSelected(principal.id)"
                :disabled="disabled"
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                @click.stop
              />
              <div class="ml-3 flex-1">
                <div class="flex items-center justify-between">
                  <span class="font-medium text-gray-900">{{ principal.name }}</span>
                  <span class="text-xs text-gray-500">{{ principal.organization_type || 'Unknown' }}</span>
                </div>
                <p class="text-sm text-gray-600">{{ principal.organization_name }}</p>
                <p class="text-xs text-gray-500">
                  {{ principal.available_products.length }} product{{ principal.available_products.length !== 1 ? 's' : '' }} available
                </p>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-if="filteredPrincipals.length === 0"
            class="px-4 py-6 text-center text-gray-500"
          >
            <svg class="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p>{{ searchTerm ? 'No principals found matching your search' : 'No principals available' }}</p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="p-2 border-t border-gray-200 flex justify-between">
          <button
            type="button"
            @click="clearSelection"
            class="text-sm text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
          >
            Clear All
          </button>
          <button
            type="button"
            @click="selectAll"
            class="text-sm text-primary-600 hover:text-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
          >
            Select All ({{ filteredPrincipals.length }})
          </button>
        </div>
      </div>
    </div>

    <!-- Batch Creation Preview -->
    <div
      v-if="modelValue.length > 0 && showBatchPreview"
      class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md"
    >
      <div class="flex items-start space-x-2">
        <svg class="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div class="flex-1">
          <h4 class="text-sm font-medium text-blue-800">Batch Opportunity Creation</h4>
          <p class="text-sm text-blue-700 mt-1">
            {{ modelValue.length }} opportunities will be created, one for each selected principal:
          </p>
          <ul class="text-sm text-blue-700 mt-2 space-y-1">
            <li
              v-for="principalId in modelValue"
              :key="principalId"
              class="flex items-center space-x-2"
            >
              <span class="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></span>
              <span>{{ generateOpportunityName(principalId) }}</span>
            </li>
          </ul>
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
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { usePrincipalStore } from '@/stores/principalStore'
import type { PrincipalOption } from '@/stores/principalStore'

/**
 * Props interface for PrincipalMultiSelect component
 */
interface Props {
  /** Field name for form identification */
  name: string
  /** Visual label for the field */
  label: string
  /** Array of selected principal IDs */
  modelValue: string[]
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
  /** Show batch creation preview */
  showBatchPreview?: boolean
  /** Base opportunity name for batch creation */
  baseOpportunityName?: string
  /** Custom CSS classes for the container */
  containerClass?: string
  /** Custom CSS classes for the label */
  labelClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select principals...',
  showBatchPreview: true,
  baseOpportunityName: 'New Opportunity'
})

/**
 * Event emissions
 */
interface Emits {
  'update:modelValue': [value: string[]]
  'selection-changed': [selectedIds: string[], selectedPrincipals: PrincipalOption[]]
  'principal-added': [principalId: string, principal: PrincipalOption]
  'principal-removed': [principalId: string, principal: PrincipalOption | undefined]
}

const emit = defineEmits<Emits>()

// Store
const principalStore = usePrincipalStore()

// Reactive state
const isOpen = ref(false)
const searchTerm = ref('')
const searchInput = ref<HTMLInputElement>()

/**
 * Computed properties for accessibility and styling
 */
const fieldId = computed(() => `principal-multiselect-${props.name}`)
const errorId = computed(() => `error-${props.name}`)
const descriptionId = computed(() => `desc-${props.name}`)
const helpTextId = computed(() => `help-${props.name}`)

const hasError = computed(() => !!props.error)

/**
 * Styling with state-aware classes
 */
const labelClasses = computed(() => {
  const base = 'block text-sm font-medium transition-colors duration-200'
  const stateClasses = hasError.value 
    ? 'text-red-700' 
    : 'text-gray-700'
  const disabledClasses = props.disabled ? 'opacity-60' : ''
  const customClasses = props.labelClass || ''
  
  return `${base} ${stateClasses} ${disabledClasses} ${customClasses}`.trim()
})

const containerClasses = computed(() => {
  const base = 'relative w-full border rounded-md transition-all duration-200 cursor-pointer focus-within:ring-2 focus-within:border-transparent'
  
  let stateClasses = ''
  if (hasError.value) {
    stateClasses = 'border-red-500 bg-red-50 focus-within:ring-red-500'
  } else if (isOpen.value) {
    stateClasses = 'border-primary-500 bg-white ring-2 ring-primary-500'
  } else {
    stateClasses = 'border-gray-300 bg-white hover:border-gray-400 focus-within:ring-primary-500'
  }
  
  const disabledClasses = props.disabled 
    ? 'bg-gray-100 cursor-not-allowed border-gray-200' 
    : ''
  
  const customClasses = props.containerClass || ''
  
  return `${base} ${stateClasses} ${disabledClasses} ${customClasses}`.trim()
})

const dropdownClasses = computed(() => {
  const base = 'absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg'
  return base
})

const optionClasses = (principalId: string) => {
  const base = 'px-4 py-2 cursor-pointer transition-colors duration-150'
  const selected = isSelected(principalId)
  const stateClasses = selected
    ? 'bg-primary-50 text-primary-900'
    : 'hover:bg-gray-50 text-gray-900'
  
  return `${base} ${stateClasses}`
}

/**
 * Filtered principals based on search term
 */
const filteredPrincipals = computed(() => {
  if (!searchTerm.value) {
    return principalStore.principalOptions
  }
  
  const search = searchTerm.value.toLowerCase()
  return principalStore.principalOptions.filter(principal => 
    principal.name.toLowerCase().includes(search) ||
    principal.organization_name.toLowerCase().includes(search) ||
    (principal.organization_type || '').toLowerCase().includes(search)
  )
})

/**
 * Utility functions
 */
const isSelected = (principalId: string): boolean => {
  return props.modelValue.includes(principalId)
}

const getPrincipalName = (principalId: string): string => {
  const principal = principalStore.principalOptions.find(p => p.id === principalId)
  return principal ? principal.name : 'Unknown Principal'
}

const generateOpportunityName = (principalId: string): string => {
  const principal = principalStore.principalOptions.find(p => p.id === principalId)
  if (!principal) return props.baseOpportunityName
  
  return `${props.baseOpportunityName} - ${principal.organization_name}`
}

/**
 * Selection management
 */
const toggleSelection = (principalId: string): void => {
  if (props.disabled) return
  
  const newSelection = [...props.modelValue]
  const index = newSelection.indexOf(principalId)
  const principal = principalStore.principalOptions.find(p => p.id === principalId)
  
  if (index > -1) {
    newSelection.splice(index, 1)
    emit('principal-removed', principalId, principal)
  } else {
    newSelection.push(principalId)
    if (principal) {
      emit('principal-added', principalId, principal)
    }
  }
  
  emit('update:modelValue', newSelection)
  emitSelectionChanged(newSelection)
}

const removePrincipal = (principalId: string): void => {
  if (props.disabled) return
  
  const newSelection = props.modelValue.filter(id => id !== principalId)
  const principal = principalStore.principalOptions.find(p => p.id === principalId)
  
  emit('update:modelValue', newSelection)
  emit('principal-removed', principalId, principal)
  emitSelectionChanged(newSelection)
}

const clearSelection = (): void => {
  if (props.disabled) return
  
  emit('update:modelValue', [])
  emitSelectionChanged([])
}

const selectAll = (): void => {
  if (props.disabled) return
  
  const allIds = filteredPrincipals.value.map(p => p.id)
  emit('update:modelValue', allIds)
  emitSelectionChanged(allIds)
}

const emitSelectionChanged = (selectedIds: string[]): void => {
  const selectedPrincipals = principalStore.principalOptions.filter(p => 
    selectedIds.includes(p.id)
  )
  emit('selection-changed', selectedIds, selectedPrincipals)
}

/**
 * Dropdown management
 */
const toggleDropdown = (): void => {
  if (props.disabled) return
  
  isOpen.value = !isOpen.value
  
  if (isOpen.value) {
    // Focus search input when dropdown opens
    setTimeout(() => {
      searchInput.value?.focus()
    }, 100)
  }
}

const closeDropdown = (): void => {
  isOpen.value = false
  searchTerm.value = ''
}

/**
 * Click outside handler
 */
const handleClickOutside = (event: Event): void => {
  const target = event.target as Element
  const container = document.getElementById(fieldId.value)
  
  if (container && !container.contains(target)) {
    closeDropdown()
  }
}

/**
 * Lifecycle hooks
 */
onMounted(async () => {
  // Load principal options if not already loaded
  if (principalStore.principalOptions.length === 0) {
    await principalStore.fetchPrincipalOptions()
  }
  
  // Add click outside listener
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

/**
 * Watch for changes to emit selection events
 */
watch(() => props.modelValue, (newValue) => {
  emitSelectionChanged(newValue)
}, { immediate: true })

/**
 * Public methods for parent component interaction
 */
defineExpose({
  focus: () => {
    const container = document.getElementById(fieldId.value)
    container?.focus()
  },
  openDropdown: () => {
    isOpen.value = true
  },
  closeDropdown,
  clearSelection,
  selectAll,
  getSelectedPrincipals: () => {
    return principalStore.principalOptions.filter(p => 
      props.modelValue.includes(p.id)
    )
  }
})
</script>