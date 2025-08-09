<template>
  <div class="principal-multi-select" ref="containerRef" :class="delightClasses">
    <label class="block text-sm font-medium text-gray-700 mb-2">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>

    <!-- Description -->
    <p v-if="description" class="text-sm text-gray-500 mb-3">
      {{ description }}
    </p>

    <!-- Principal Required Toggle -->
    <div class="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div class="flex items-start space-x-3">
        <input
          id="principal-required"
          type="checkbox"
          v-model="internalPrincipalRequired"
          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
          @change="handlePrincipalRequiredChange"
        />
        <div>
          <label for="principal-required" class="text-sm font-medium text-gray-900">
            Require Principal Access
          </label>
          <p class="text-xs text-gray-500 mt-1">
            When enabled, only assigned principals can access this product. When disabled, all users can access it.
          </p>
        </div>
      </div>
    </div>

    <!-- Principal Selection (only shown when required) -->
    <div v-if="internalPrincipalRequired" class="space-y-4">
      <!-- Search Input -->
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon class="h-4 w-4 text-gray-400" />
        </div>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search principals..."
          class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>

      <!-- Bulk Actions -->
      <div v-if="filteredPrincipals.length > 0" class="flex items-center justify-between">
        <div class="text-sm text-gray-600">
          {{ selectedPrincipals.length }} of {{ filteredPrincipals.length }} principals selected
        </div>
        <div class="flex space-x-2">
          <button
            type="button"
            @click="selectAll"
            :disabled="allSelected"
            class="text-xs font-medium text-blue-600 hover:text-blue-500 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Select All
          </button>
          <span class="text-gray-300">|</span>
          <button
            type="button"
            @click="selectNone"
            :disabled="noneSelected"
            class="text-xs font-medium text-red-600 hover:text-red-500 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Clear All
          </button>
        </div>
      </div>

      <!-- Principal List -->
      <div v-if="filteredPrincipals.length > 0" class="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
        <div
          v-for="principal in filteredPrincipals"
          :key="principal.id"
          class="principal-item delight-multiselect-item flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
          :class="{
            'selected': selectedPrincipals.includes(principal.id)
          }"
        >
          <input
            :id="`principal-${principal.id}`"
            type="checkbox"
            :checked="selectedPrincipals.includes(principal.id)"
            @change="togglePrincipal(principal.id)"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <div class="ml-3 flex-1">
            <label
              :for="`principal-${principal.id}`"
              class="block text-sm font-medium text-gray-900 cursor-pointer"
            >
              {{ principal.name }}
            </label>
            <p v-if="principal.description" class="text-xs text-gray-500 mt-0.5">
              {{ principal.description }}
            </p>
            <div class="flex items-center space-x-3 mt-1">
              <div class="flex items-center space-x-1">
                <BuildingOfficeIcon class="h-3 w-3 text-gray-400" />
                <span class="text-xs text-gray-500">{{ principal.type || 'Principal' }}</span>
              </div>
              <div v-if="principal.productCount !== undefined" class="flex items-center space-x-1">
                <DocumentIcon class="h-3 w-3 text-gray-400" />
                <span class="text-xs text-gray-500">{{ principal.productCount }} products</span>
              </div>
              <div :class="[
                'flex items-center space-x-1',
                principal.isActive ? 'text-green-600' : 'text-gray-400'
              ]">
                <div :class="[
                  'w-2 h-2 rounded-full',
                  principal.isActive ? 'bg-green-500' : 'bg-gray-300'
                ]"></div>
                <span class="text-xs">{{ principal.isActive ? 'Active' : 'Inactive' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="searchQuery" class="text-center py-8 text-gray-500">
        <MagnifyingGlassIcon class="h-8 w-8 mx-auto mb-2 text-gray-300" />
        <p class="text-sm">No principals found matching "{{ searchQuery }}"</p>
        <button
          type="button"
          @click="clearSearch"
          class="text-xs text-blue-600 hover:text-blue-500 mt-1"
        >
          Clear search
        </button>
      </div>

      <div v-else-if="!loading && availablePrincipals.length === 0" class="text-center py-8 text-gray-500">
        <BuildingOfficeIcon class="h-8 w-8 mx-auto mb-2 text-gray-300" />
        <p class="text-sm">No principals available</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-8">
        <div class="animate-spin h-6 w-6 border-2 border-gray-300 border-t-blue-600 rounded-full mx-auto mb-2"></div>
        <p class="text-sm text-gray-500">Loading principals...</p>
      </div>

      <!-- Delight Message -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 transform translate-y-2 scale-95"
        enter-to-class="opacity-100 transform translate-y-0 scale-100"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 transform translate-y-0 scale-100"
        leave-to-class="opacity-0 transform translate-y-2 scale-95"
      >
        <div v-if="currentMessage" class="mt-3 delight-message success">
          <span v-if="currentMessage.emoji" class="delight-message-emoji">{{ currentMessage.emoji }}</span>
          <div>
            <div class="font-medium">{{ currentMessage.title }}</div>
            <div class="text-sm opacity-90">{{ currentMessage.message }}</div>
          </div>
        </div>
      </Transition>

      <!-- Selected Principals Summary -->
      <div v-if="selectedPrincipals.length > 0" class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm font-medium text-blue-900">
            Selected Principals ({{ selectedPrincipals.length }})
          </div>
          <button
            type="button"
            @click="toggleSummary"
            class="text-xs text-blue-600 hover:text-blue-500"
          >
            {{ showSummary ? 'Hide' : 'Show' }} Details
          </button>
        </div>
        <div v-if="showSummary" class="space-y-1">
          <div
            v-for="principalId in selectedPrincipals.slice(0, 5)"
            :key="principalId"
            class="text-xs text-blue-800"
          >
            • {{ getPrincipalName(principalId) }}
          </div>
          <div v-if="selectedPrincipals.length > 5" class="text-xs text-blue-600">
            ... and {{ selectedPrincipals.length - 5 }} more
          </div>
        </div>
      </div>
    </div>

    <!-- Warning when no principals selected but required -->
    <div v-if="internalPrincipalRequired && selectedPrincipals.length === 0" class="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div class="flex items-start">
        <ExclamationTriangleIcon class="h-4 w-4 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
        <div class="text-sm">
          <span class="font-medium text-yellow-800">Warning:</span>
          <span class="text-yellow-700 ml-1">
            Principal access is required but no principals are selected. The product will be inaccessible to all users.
          </span>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <p v-if="error" class="mt-2 text-sm text-red-600" role="alert">
      {{ error }}
    </p>

    <!-- Guidelines -->
    <div v-if="showGuidelines" class="mt-4 p-3 bg-gray-50 rounded-lg">
      <div class="text-sm text-gray-700">
        <div class="font-medium mb-1">Principal Access Guidelines:</div>
        <ul class="text-xs space-y-1 text-gray-600">
          <li>• When principal access is required, only selected principals can view/order this product</li>
          <li>• When principal access is disabled, all authenticated users can access the product</li>
          <li>• You can modify principal assignments later in the product settings</li>
          <li>• Consider the business relationship when assigning principal access</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import {
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  DocumentIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import { usePrincipalStore } from '@/stores/principalStore'
import { useMultiSelectDelight } from '@/composables/useFormDelight'

interface Principal {
  id: string
  name: string
  description?: string
  type?: string
  isActive: boolean
  productCount?: number
}

interface Props {
  modelValue: string[]
  principalRequired: boolean
  label?: string
  required?: boolean
  description?: string
  error?: string
  showGuidelines?: boolean
  maxSelection?: number
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Principal Assignment',
  required: false,
  description: 'Control which principals can access this product',
  showGuidelines: true
})

interface Emits {
  'update:modelValue': [principals: string[]]
  'update:principalRequired': [required: boolean]
  'principals-changed': [principals: string[], principalRequired: boolean]
  'validation-changed': [isValid: boolean, error?: string]
}

const emit = defineEmits<Emits>()

// ===============================
// STORES
// ===============================

const principalStore = usePrincipalStore()

// ===============================
// REACTIVE STATE
// ===============================

const containerRef = ref<HTMLElement>()
const selectedPrincipals = ref<string[]>([...props.modelValue])
const internalPrincipalRequired = ref(props.principalRequired)
const searchQuery = ref('')
const loading = ref(false)
const showSummary = ref(false)

// ===============================
// DELIGHT SYSTEM
// ===============================

const {
  currentMessage,
  delightClasses,
  celebrateSelection,
  celebrateBulkOperation,
  showValidationFeedback,
  updateCompletionScore
} = useMultiSelectDelight({ level: 'standard' })

// ===============================
// COMPUTED PROPERTIES
// ===============================

const availablePrincipals = computed((): Principal[] => {
  return principalStore.principals.map(p => ({
    id: p.id,
    name: p.name,
    description: p.organization_name || 'Principal Description',
    type: p.organization_type || 'Principal',
    isActive: p.is_active ?? true,
    productCount: p.product_count || 0
  }))
})

const filteredPrincipals = computed(() => {
  if (!searchQuery.value.trim()) {
    return availablePrincipals.value
  }
  
  const query = searchQuery.value.toLowerCase().trim()
  return availablePrincipals.value.filter(principal =>
    principal.name.toLowerCase().includes(query) ||
    principal.description?.toLowerCase().includes(query) ||
    principal.type?.toLowerCase().includes(query)
  )
})

const allSelected = computed(() => {
  return filteredPrincipals.value.length > 0 &&
    filteredPrincipals.value.every(p => selectedPrincipals.value.includes(p.id))
})

const noneSelected = computed(() => {
  return selectedPrincipals.value.length === 0
})

const isValid = computed(() => {
  if (props.required && !internalPrincipalRequired.value) {
    return false
  }
  
  if (internalPrincipalRequired.value && selectedPrincipals.value.length === 0) {
    return false
  }
  
  return true
})

// ===============================
// UTILITY FUNCTIONS
// ===============================

const getPrincipalName = (principalId: string): string => {
  const principal = availablePrincipals.value.find(p => p.id === principalId)
  return principal?.name || `Principal ${principalId.slice(0, 8)}`
}

const emitChanges = () => {
  emit('update:modelValue', [...selectedPrincipals.value])
  emit('update:principalRequired', internalPrincipalRequired.value)
  emit('principals-changed', [...selectedPrincipals.value], internalPrincipalRequired.value)
  emitValidation()
}

const emitValidation = async () => {
  const valid = isValid.value
  let error: string | undefined
  
  if (props.required && !internalPrincipalRequired.value) {
    error = 'Principal access setting is required'
  } else if (internalPrincipalRequired.value && selectedPrincipals.value.length === 0) {
    error = 'At least one principal must be selected when principal access is required'
  }
  
  // Show validation feedback with delight
  if (containerRef.value) {
    await showValidationFeedback(containerRef.value, valid, error, 'Principal Assignment')
  }
  
  emit('validation-changed', valid, error)
}

// ===============================
// EVENT HANDLERS
// ===============================

const handlePrincipalRequiredChange = () => {
  if (!internalPrincipalRequired.value) {
    // Clear selected principals when principal access is disabled
    selectedPrincipals.value = []
  }
  emitChanges()
}

const togglePrincipal = async (principalId: string) => {
  const index = selectedPrincipals.value.indexOf(principalId)
  const wasSelected = index > -1
  
  if (wasSelected) {
    selectedPrincipals.value.splice(index, 1)
  } else {
    if (props.maxSelection && selectedPrincipals.value.length >= props.maxSelection) {
      return // Don't add if at max selection
    }
    selectedPrincipals.value.push(principalId)
    
    // Celebrate new selection
    if (containerRef.value) {
      await nextTick()
      await celebrateSelection(containerRef.value, selectedPrincipals.value.length)
    }
  }
  
  // Update completion score based on selection progress
  updateCompletionScore(Math.min(100, (selectedPrincipals.value.length / Math.max(1, filteredPrincipals.value.length)) * 100))
  
  emitChanges()
}

const selectAll = async () => {
  const newSelections = filteredPrincipals.value
    .filter(p => !selectedPrincipals.value.includes(p.id))
    .map(p => p.id)
  
  if (props.maxSelection) {
    const remainingSlots = props.maxSelection - selectedPrincipals.value.length
    newSelections.splice(remainingSlots)
  }
  
  selectedPrincipals.value.push(...newSelections)
  updateCompletionScore(100)
  
  // Celebrate bulk selection
  if (containerRef.value && newSelections.length > 0) {
    await nextTick()
    await celebrateBulkOperation(containerRef.value, 'selectAll')
  }
  
  emitChanges()
}

const selectNone = async () => {
  const hadSelections = selectedPrincipals.value.length > 0
  selectedPrincipals.value = []
  updateCompletionScore(0)
  
  // Celebrate clearing (fresh start)
  if (containerRef.value && hadSelections) {
    await nextTick()
    await celebrateBulkOperation(containerRef.value, 'clearAll')
  }
  
  emitChanges()
}

const clearSearch = () => {
  searchQuery.value = ''
}

const toggleSummary = () => {
  showSummary.value = !showSummary.value
}

const loadPrincipals = async () => {
  try {
    loading.value = true
    await principalStore.fetchPrincipals()
  } catch (error) {
    console.error('Failed to load principals:', error)
  } finally {
    loading.value = false
  }
}

// ===============================
// WATCHERS
// ===============================

watch(() => props.modelValue, (newValue) => {
  if (JSON.stringify(newValue) !== JSON.stringify(selectedPrincipals.value)) {
    selectedPrincipals.value = [...newValue]
    emitValidation()
  }
})

watch(() => props.principalRequired, (newValue) => {
  if (newValue !== internalPrincipalRequired.value) {
    internalPrincipalRequired.value = newValue
    emitValidation()
  }
})

watch([selectedPrincipals, internalPrincipalRequired], () => {
  emitValidation()
}, { deep: true })

// ===============================
// LIFECYCLE
// ===============================

onMounted(() => {
  if (availablePrincipals.value.length === 0) {
    loadPrincipals()
  }
  emitValidation()
})
</script>

<style scoped>
.principal-multi-select {
  @apply relative;
}

/* Principal item hover effects */
.principal-item {
  @apply transition-colors duration-200 ease-in-out;
}

.principal-item:hover {
  @apply bg-blue-50;
}

/* Checkbox animations */
input[type="checkbox"] {
  @apply transition-all duration-200 ease-in-out;
}

input[type="checkbox"]:checked {
  @apply transform scale-110;
}

/* Search input enhancements */
.principal-multi-select input[type="text"] {
  @apply transition-all duration-200 ease-in-out;
}

.principal-multi-select input[type="text"]:focus {
  @apply shadow-sm;
}

/* Loading animation */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Bulk action buttons */
.principal-multi-select button {
  @apply transition-colors duration-150 ease-in-out;
}

/* Summary section animations */
.summary-section {
  @apply transition-all duration-300 ease-in-out;
}

/* Responsive design */
@media (max-width: 768px) {
  .principal-item {
    @apply flex-col items-start space-y-2;
  }
  
  .principal-item input[type="checkbox"] {
    @apply mb-2;
  }
  
  .principal-multi-select .flex {
    @apply flex-col space-x-0 space-y-2;
  }
}

/* Custom scrollbar */
.principal-multi-select .overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.principal-multi-select .overflow-y-auto::-webkit-scrollbar-track {
  @apply bg-gray-100 rounded;
}

.principal-multi-select .overflow-y-auto::-webkit-scrollbar-thumb {
  @apply bg-gray-400 rounded;
}

.principal-multi-select .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-500;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .principal-item {
    @apply border-2 border-transparent;
  }
  
  .principal-item:hover {
    @apply border-blue-300;
  }
  
  .principal-multi-select input {
    @apply border-2;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .principal-multi-select *,
  .principal-item {
    transition: none !important;
    animation: none !important;
  }
}

/* Print styles */
@media print {
  .principal-multi-select button,
  .principal-multi-select .guidelines {
    @apply hidden;
  }
  
  .principal-item {
    @apply border-b border-gray-300 p-2;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .principal-item {
    @apply bg-gray-800 text-white border-gray-700;
  }
  
  .principal-item:hover {
    @apply bg-gray-700;
  }
  
  .principal-multi-select input {
    @apply bg-gray-700 border-gray-600 text-white;
  }
  
  .summary-section {
    @apply bg-gray-800 border-gray-600;
  }
}

/* Focus states for accessibility */
.principal-multi-select input:focus,
.principal-multi-select button:focus {
  @apply outline-none ring-2 ring-offset-2 ring-blue-500;
}

/* Status indicator animations */
.status-indicator {
  @apply transition-colors duration-200 ease-in-out;
}

/* Search clear button */
.search-clear {
  @apply absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600;
}

/* Selection counter animation */
.selection-counter {
  @apply transition-all duration-200 ease-in-out;
}

/* Warning state styling */
.warning-state {
  @apply animate-pulse;
}

/* Loading skeleton */
.loading-skeleton {
  @apply animate-pulse bg-gray-200 rounded;
}

.loading-skeleton-text {
  @apply h-4 bg-gray-200 rounded w-3/4 mb-2;
}

.loading-skeleton-line {
  @apply h-3 bg-gray-200 rounded w-1/2;
}

/* Empty state styling */
.empty-state {
  @apply transition-opacity duration-300 ease-in-out;
}

/* Validation error styling */
.validation-error {
  @apply border-red-300 bg-red-50;
}

.validation-success {
  @apply border-green-300 bg-green-50;
}
</style>