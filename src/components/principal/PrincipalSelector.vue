<!--
  Principal Selector - Advanced dropdown with search and filtering
  Features: Real-time search, activity status filtering, performance indicators
-->
<template>
  <div class="principal-selector">
    <div class="relative">
      <!-- Search Input -->
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref="searchInput"
          v-model="searchTerm"
          type="text"
          class="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          :class="[
            error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : '',
            loading ? 'bg-gray-50' : 'bg-white'
          ]"
          placeholder="Search principals by name or organization..."
          :disabled="loading"
          @focus="showDropdown = true"
          @input="handleSearch"
          @keydown="handleKeyNavigation"
        />
        
        <!-- Loading Spinner -->
        <div v-if="loading" class="absolute inset-y-0 right-0 pr-3 flex items-center">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
        
        <!-- Clear Button -->
        <button
          v-else-if="searchTerm || selectedPrincipal"
          @click="clearSelection"
          class="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-700"
        >
          <XMarkIcon class="h-4 w-4 text-gray-400" />
        </button>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="mt-2 text-sm text-red-600 flex items-center">
        <ExclamationTriangleIcon class="h-4 w-4 mr-1" />
        {{ error }}
      </div>

      <!-- Dropdown Menu -->
      <Transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div
          v-show="showDropdown && (filteredPrincipals.length > 0 || searchTerm)"
          class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-96 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
        >
          <!-- Filters -->
          <div class="px-3 py-2 border-b border-gray-100">
            <div class="flex items-center space-x-4">
              <label class="text-xs font-medium text-gray-700">Filter:</label>
              <div class="flex space-x-2">
                <button
                  v-for="filter in activityFilters"
                  :key="filter.value"
                  @click="toggleActivityFilter(filter.value)"
                  class="inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors"
                  :class="[
                    activeFilters.includes(filter.value)
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  ]"
                >
                  <span
                    class="w-2 h-2 rounded-full mr-1"
                    :class="filter.colorClass"
                  ></span>
                  {{ filter.label }}
                </button>
              </div>
            </div>
          </div>

          <!-- Principal Options -->
          <div class="max-h-72 overflow-y-auto">
            <!-- No Results -->
            <div
              v-if="filteredPrincipals.length === 0 && searchTerm"
              class="px-3 py-4 text-sm text-gray-500 text-center"
            >
              <UserGroupIcon class="mx-auto h-8 w-8 text-gray-300 mb-2" />
              No principals found matching "{{ searchTerm }}"
            </div>

            <!-- Principal List -->
            <div
              v-for="(principal, index) in filteredPrincipals"
              :key="principal.principal_id"
              @click="selectPrincipal(principal)"
              @mouseenter="highlightedIndex = index"
              class="relative cursor-pointer select-none py-3 px-3 hover:bg-gray-50 transition-colors"
              :class="[
                highlightedIndex === index ? 'bg-blue-50' : '',
                selectedPrincipal?.principal_id === principal.principal_id ? 'bg-blue-100' : ''
              ]"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <!-- Principal Name -->
                  <div class="flex items-center space-x-2">
                    <span class="font-medium text-gray-900 truncate">
                      {{ principal.principal_name }}
                    </span>
                    <ActivityStatusBadge :status="principal.activity_status" />
                  </div>
                  
                  <!-- Organization Info -->
                  <div class="text-sm text-gray-500 truncate">
                    {{ principal.organization_name }}
                  </div>
                  
                  <!-- Metrics Row -->
                  <div class="flex items-center space-x-4 mt-1 text-xs text-gray-600">
                    <span class="flex items-center">
                      <ChartBarIcon class="h-3 w-3 mr-1" />
                      Score: {{ principal.engagement_score || 0 }}
                    </span>
                    <span class="flex items-center">
                      <CalendarIcon class="h-3 w-3 mr-1" />
                      {{ formatLastActivity(principal.last_activity_date) }}
                    </span>
                    <span class="flex items-center">
                      <BuildingOfficeIcon class="h-3 w-3 mr-1" />
                      {{ principal.total_opportunities || 0 }} ops
                    </span>
                  </div>
                </div>

                <!-- Engagement Score Visual -->
                <div class="ml-3 flex-shrink-0">
                  <EngagementScoreRing 
                    :score="principal.engagement_score || 0"
                    :size="'sm'"
                  />
                </div>
              </div>
              
              <!-- Selected Indicator -->
              <div
                v-if="selectedPrincipal?.principal_id === principal.principal_id"
                class="absolute inset-y-0 right-0 flex items-center pr-4"
              >
                <CheckIcon class="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div v-if="selectedPrincipal" class="border-t border-gray-100 px-3 py-2">
            <div class="flex items-center justify-between text-xs text-gray-600">
              <span>Quick Actions:</span>
              <div class="flex space-x-2">
                <button
                  @click.stop="createOpportunity"
                  class="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Create Opportunity
                </button>
                <span class="text-gray-300">•</span>
                <button
                  @click.stop="logInteraction"
                  class="text-green-600 hover:text-green-800 font-medium"
                >
                  Log Interaction
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Selected Principal Display -->
    <div
      v-if="selectedPrincipal && !showDropdown"
      class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="flex-shrink-0">
            <EngagementScoreRing 
              :score="selectedPrincipal.engagement_score || 0"
              :size="'md'"
            />
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-900">
              {{ selectedPrincipal.principal_name }}
            </h3>
            <p class="text-sm text-gray-600">
              {{ selectedPrincipal.organization_name }}
            </p>
            <div class="flex items-center space-x-3 mt-1">
              <ActivityStatusBadge :status="selectedPrincipal.activity_status" />
              <span class="text-xs text-gray-500">
                {{ selectedPrincipal.total_opportunities || 0 }} opportunities •
                {{ selectedPrincipal.total_interactions || 0 }} interactions
              </span>
            </div>
          </div>
        </div>
        <button
          @click="clearSelection"
          class="text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  CheckIcon,
  ChartBarIcon,
  CalendarIcon,
  BuildingOfficeIcon
} from '@heroicons/vue/24/outline'
import { usePrincipalStore } from '@/stores/principalStore'
import PrincipalActivityApi from '@/services/principalActivityApi'
import type { PrincipalActivitySummary } from '@/services/principalActivityApi'

// Component imports (these would be created as separate components)
import ActivityStatusBadge from './ActivityStatusBadge.vue'
import EngagementScoreRing from './EngagementScoreRing.vue'

// ===============================
// COMPONENT INTERFACE
// ===============================

interface Props {
  modelValue?: string
  loading?: boolean
  error?: string | null
  placeholder?: string
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', principal: PrincipalActivitySummary | null): void
  (e: 'search', searchTerm: string): void
  (e: 'create-opportunity', principal: PrincipalActivitySummary): void
  (e: 'log-interaction', principal: PrincipalActivitySummary): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  loading: false,
  error: null,
  placeholder: 'Search principals...',
  disabled: false
})

const emit = defineEmits<Emits>()

// ===============================
// COMPOSABLES & STORES
// ===============================

const principalStore = usePrincipalStore()

// ===============================
// REACTIVE STATE
// ===============================

const searchInput = ref<HTMLInputElement>()
const searchTerm = ref('')
const showDropdown = ref(false)
const highlightedIndex = ref(-1)
const principals = ref<PrincipalActivitySummary[]>([])
const isSearching = ref(false)

// Filter states
const activeFilters = ref<string[]>(['ACTIVE', 'MODERATE'])
const activityFilters = [
  { value: 'ACTIVE', label: 'Active', colorClass: 'bg-green-400' },
  { value: 'MODERATE', label: 'Moderate', colorClass: 'bg-yellow-400' },
  { value: 'LOW', label: 'Low', colorClass: 'bg-orange-400' },
  { value: 'NO_ACTIVITY', label: 'Inactive', colorClass: 'bg-gray-400' }
]

// ===============================
// COMPUTED PROPERTIES
// ===============================

const selectedPrincipal = computed(() => {
  if (!props.modelValue) return null
  return principals.value.find(p => p.principal_id === props.modelValue) || null
})

const filteredPrincipals = computed(() => {
  let filtered = principals.value

  // Apply activity status filters
  if (activeFilters.value.length > 0) {
    filtered = filtered.filter(p => activeFilters.value.includes(p.activity_status))
  }

  // Apply search filter
  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    filtered = filtered.filter(p =>
      p.principal_name.toLowerCase().includes(search) ||
      p.organization_name.toLowerCase().includes(search)
    )
  }

  // Sort by engagement score and activity
  return filtered.sort((a, b) => {
    // First, sort by engagement score (descending)
    const scoreA = a.engagement_score || 0
    const scoreB = b.engagement_score || 0
    if (scoreA !== scoreB) {
      return scoreB - scoreA
    }
    
    // Then by name (ascending)
    return a.principal_name.localeCompare(b.principal_name)
  })
})

const isLoading = computed(() => props.loading || isSearching.value)

// ===============================
// EVENT HANDLERS
// ===============================

const handleSearch = async (event: Event) => {
  const target = event.target as HTMLInputElement
  searchTerm.value = target.value
  
  emit('search', searchTerm.value)
  
  if (searchTerm.value.length >= 2) {
    await searchPrincipals(searchTerm.value)
  } else if (searchTerm.value.length === 0) {
    await loadPrincipals()
  }
}

const handleKeyNavigation = (event: KeyboardEvent) => {
  if (!showDropdown.value || filteredPrincipals.value.length === 0) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      highlightedIndex.value = Math.min(
        highlightedIndex.value + 1,
        filteredPrincipals.value.length - 1
      )
      break
    case 'ArrowUp':
      event.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1)
      break
    case 'Enter':
      event.preventDefault()
      if (highlightedIndex.value >= 0) {
        selectPrincipal(filteredPrincipals.value[highlightedIndex.value])
      }
      break
    case 'Escape':
      event.preventDefault()
      showDropdown.value = false
      highlightedIndex.value = -1
      break
  }
}

const selectPrincipal = (principal: PrincipalActivitySummary) => {
  emit('update:modelValue', principal.principal_id)
  emit('change', principal)
  
  searchTerm.value = principal.principal_name
  showDropdown.value = false
  highlightedIndex.value = -1
}

const clearSelection = () => {
  emit('update:modelValue', '')
  emit('change', null)
  
  searchTerm.value = ''
  showDropdown.value = false
  highlightedIndex.value = -1
  
  nextTick(() => {
    searchInput.value?.focus()
  })
}

const toggleActivityFilter = (filterValue: string) => {
  const index = activeFilters.value.indexOf(filterValue)
  if (index >= 0) {
    activeFilters.value.splice(index, 1)
  } else {
    activeFilters.value.push(filterValue)
  }
}

const createOpportunity = (event: Event) => {
  event.stopPropagation()
  if (selectedPrincipal.value) {
    emit('create-opportunity', selectedPrincipal.value)
  }
  showDropdown.value = false
}

const logInteraction = (event: Event) => {
  event.stopPropagation()
  if (selectedPrincipal.value) {
    emit('log-interaction', selectedPrincipal.value)
  }
  showDropdown.value = false
}

// ===============================
// DATA LOADING FUNCTIONS
// ===============================

const loadPrincipals = async () => {
  isSearching.value = true
  
  try {
    const response = await PrincipalActivityApi.getPrincipalActivitySummary()
    if (response.success) {
      principals.value = response.data || []
    }
  } catch (error) {
    console.error('Failed to load principals:', error)
  } finally {
    isSearching.value = false
  }
}

const searchPrincipals = async (searchTerm: string) => {
  isSearching.value = true
  
  try {
    const response = await PrincipalActivityApi.searchPrincipalsWithActivity(searchTerm, false)
    if (response.success) {
      principals.value = response.data || []
    }
  } catch (error) {
    console.error('Failed to search principals:', error)
  } finally {
    isSearching.value = false
  }
}

// ===============================
// UTILITY FUNCTIONS
// ===============================

const formatLastActivity = (dateString: string | null): string => {
  if (!dateString) return 'No activity'
  
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
  return `${Math.floor(diffInDays / 365)} years ago`
}

// ===============================
// CLICK OUTSIDE HANDLER
// ===============================

const handleClickOutside = (event: Event) => {
  const target = event.target as Element
  if (!target.closest('.principal-selector')) {
    showDropdown.value = false
    highlightedIndex.value = -1
  }
}

// ===============================
// LIFECYCLE HOOKS
// ===============================

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  await loadPrincipals()
  
  // Set initial value if provided
  if (props.modelValue) {
    const principal = principals.value.find(p => p.principal_id === props.modelValue)
    if (principal) {
      searchTerm.value = principal.principal_name
    }
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Watch for external model value changes
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      const principal = principals.value.find(p => p.principal_id === newValue)
      if (principal) {
        searchTerm.value = principal.principal_name
      }
    } else {
      searchTerm.value = ''
    }
  }
)
</script>

<style scoped>
.principal-selector {
  /* Custom styles for the selector component */
}

/* Smooth dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Highlight animation for keyboard navigation */
.principal-option:focus {
  outline: none;
  box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.5);
}

/* Custom scrollbar for dropdown */
.principal-selector ::-webkit-scrollbar {
  width: 6px;
}

.principal-selector ::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.principal-selector ::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.principal-selector ::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>