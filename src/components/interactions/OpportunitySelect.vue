<template>
  <div class="opportunity-select">
    <label :for="name" class="block text-sm font-medium text-gray-700 mb-2">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>
    
    <!-- Search Input -->
    <div class="relative">
      <div class="relative">
        <input
          :id="name"
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          :placeholder="placeholder"
          :class="inputClasses"
          :aria-invalid="!!error"
          :aria-describedby="error ? `${name}-error` : undefined"
          :aria-expanded="showDropdown"
          :aria-haspopup="listbox"
          role="combobox"
          aria-autocomplete="list"
          @input="handleInput"
          @focus="handleFocus"
          @blur="handleBlur"
          @keydown="handleKeydown"
        />
        
        <!-- Search Icon -->
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
        </div>
        
        <!-- Clear Button -->
        <button
          v-if="selectedOpportunity && !disabled"
          type="button"
          @click="clearSelection"
          class="absolute inset-y-0 right-0 pr-3 flex items-center"
          :aria-label="'Clear selected opportunity'"
        >
          <XMarkIcon class="h-5 w-5 text-gray-400 hover:text-gray-600" />
        </button>
        
        <!-- Loading Spinner -->
        <div v-if="loading" class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <div class="animate-spin h-5 w-5 border-2 border-gray-300 border-t-primary-600 rounded-full"></div>
        </div>
      </div>
      
      <!-- Dropdown List -->
      <div
        v-if="showDropdown"
        class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
        role="listbox"
        :aria-label="'Select opportunity'"
      >
        <!-- No Results -->
        <div
          v-if="filteredOpportunities.length === 0 && !loading"
          class="px-4 py-2 text-sm text-gray-500"
        >
          {{ noResultsText }}
        </div>
        
        <!-- Loading State -->
        <div
          v-if="loading"
          class="px-4 py-2 text-sm text-gray-500 flex items-center"
        >
          <div class="animate-spin h-4 w-4 border-2 border-gray-300 border-t-primary-600 rounded-full mr-2"></div>
          Searching opportunities...
        </div>
        
        <!-- Opportunity Options -->
        <div
          v-for="(opportunity, index) in filteredOpportunities"
          :key="opportunity.id"
          :class="[
            'px-4 py-2 cursor-pointer select-none relative',
            highlightedIndex === index ? 'bg-primary-100 text-primary-900' : 'text-gray-900',
            'hover:bg-primary-50'
          ]"
          role="option"
          :aria-selected="selectedOpportunity?.id === opportunity.id"
          @click="selectOpportunity(opportunity)"
          @mouseenter="highlightedIndex = index"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-2">
                <div class="text-sm font-medium text-gray-900 truncate">
                  {{ opportunity.name }}
                </div>
                <div
                  :class="[
                    'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                    getStageClasses(opportunity.stage)
                  ]"
                >
                  {{ formatStageDisplay(opportunity.stage) }}
                </div>
              </div>
              
              <div class="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                <span v-if="opportunity.organization_name" class="flex items-center">
                  <BuildingOfficeIcon class="h-3 w-3 mr-1" />
                  {{ opportunity.organization_name }}
                </span>
                <span v-if="opportunity.deal_owner" class="flex items-center">
                  <UserIcon class="h-3 w-3 mr-1" />
                  {{ opportunity.deal_owner }}
                </span>
                <span v-if="opportunity.probability_percent !== null" class="flex items-center">
                  <ChartBarIcon class="h-3 w-3 mr-1" />
                  {{ opportunity.probability_percent }}%
                </span>
                <span v-if="opportunity.expected_close_date" class="flex items-center">
                  <CalendarIcon class="h-3 w-3 mr-1" />
                  {{ formatDate(opportunity.expected_close_date) }}
                </span>
              </div>
            </div>
            
            <!-- Selection Indicator -->
            <CheckIcon
              v-if="selectedOpportunity?.id === opportunity.id"
              class="h-5 w-5 text-primary-600 ml-2 flex-shrink-0"
            />
          </div>
        </div>
        
        <!-- Create New Option -->
        <div
          v-if="allowCreate && searchQuery && !hasExactMatch"
          :class="[
            'px-4 py-2 cursor-pointer select-none relative border-t border-gray-200',
            highlightedIndex === filteredOpportunities.length ? 'bg-primary-100 text-primary-900' : 'text-gray-700',
            'hover:bg-primary-50'
          ]"
          role="option"
          :aria-selected="false"
          @click="createNewOpportunity"
          @mouseenter="highlightedIndex = filteredOpportunities.length"
        >
          <div class="flex items-center">
            <PlusIcon class="h-4 w-4 text-gray-400 mr-2" />
            <span class="text-sm">Create new opportunity: "{{ searchQuery }}"</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Selected Opportunity Display -->
    <div v-if="selectedOpportunity && !showDropdown" class="mt-2 p-3 bg-gray-50 rounded-md">
      <div class="flex items-center justify-between">
        <div class="flex-1 min-w-0">
          <div class="flex items-center space-x-2">
            <div class="text-sm font-medium text-gray-900">
              {{ selectedOpportunity.name }}
            </div>
            <div
              :class="[
                'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                getStageClasses(selectedOpportunity.stage)
              ]"
            >
              {{ formatStageDisplay(selectedOpportunity.stage) }}
            </div>
          </div>
          
          <div class="mt-1 flex items-center space-x-4 text-xs text-gray-500">
            <span v-if="selectedOpportunity.organization_name" class="flex items-center">
              <BuildingOfficeIcon class="h-3 w-3 mr-1" />
              {{ selectedOpportunity.organization_name }}
            </span>
            <span v-if="selectedOpportunity.deal_owner" class="flex items-center">
              <UserIcon class="h-3 w-3 mr-1" />
              {{ selectedOpportunity.deal_owner }}
            </span>
            <span v-if="selectedOpportunity.probability_percent !== null" class="flex items-center">
              <ChartBarIcon class="h-3 w-3 mr-1" />
              {{ selectedOpportunity.probability_percent }}%
            </span>
          </div>
        </div>
        
        <button
          v-if="!disabled"
          type="button"
          @click="clearSelection"
          class="ml-2 p-1 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          :aria-label="'Remove selected opportunity'"
        >
          <XMarkIcon class="h-4 w-4 text-gray-500" />
        </button>
      </div>
    </div>
    
    <!-- Error Message -->
    <p
      v-if="error"
      :id="`${name}-error`"
      class="mt-1 text-sm text-red-600"
      role="alert"
    >
      {{ error }}
    </p>
    
    <!-- Helper Text -->
    <p v-if="description && !error" class="mt-1 text-sm text-gray-500">
      {{ description }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useOpportunityStore } from '@/stores/opportunityStore'
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
  PlusIcon,
  BuildingOfficeIcon,
  UserIcon,
  ChartBarIcon,
  CalendarIcon
} from '@heroicons/vue/24/outline'
import type { OpportunityStage } from '@/types/opportunities'

/**
 * Opportunity option interface for display
 */
interface OpportunityOption {
  id: string
  name: string
  stage: OpportunityStage
  organization_name?: string
  deal_owner?: string
  probability_percent?: number | null
  expected_close_date?: string | null
  organization_id?: string
}

/**
 * Props interface
 */
interface Props {
  name: string
  label: string
  modelValue: string | null
  error?: string
  required?: boolean
  disabled?: boolean
  description?: string
  placeholder?: string
  organizationId?: string | null
  allowCreate?: boolean
  minSearchLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  disabled: false,
  placeholder: 'Search opportunities...',
  allowCreate: false,
  minSearchLength: 2
})

/**
 * Emits interface
 */
interface Emits {
  'update:modelValue': [value: string | null]
  'opportunity-selected': [opportunityId: string | null, opportunityData: OpportunityOption | null]
  'create-opportunity': [name: string, organizationId?: string]
}

const emit = defineEmits<Emits>()

// ===============================
// COMPONENT STATE
// ===============================

const searchInput = ref<HTMLInputElement>()
const searchQuery = ref('')
const showDropdown = ref(false)
const loading = ref(false)
const highlightedIndex = ref(-1)
const opportunities = ref<OpportunityOption[]>([])
const selectedOpportunity = ref<OpportunityOption | null>(null)

// Dependencies
const opportunityStore = useOpportunityStore()

// ===============================
// COMPUTED PROPERTIES
// ===============================

const inputClasses = computed(() => {
  const baseClasses = 'w-full pl-10 pr-10 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200'
  
  if (props.error) {
    return `${baseClasses} border-red-500 text-red-900 placeholder-red-300 focus:ring-red-500`
  }
  
  if (props.disabled) {
    return `${baseClasses} border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed`
  }
  
  return `${baseClasses} border-gray-300 text-gray-900 placeholder-gray-400`
})

const filteredOpportunities = computed(() => {
  if (!searchQuery.value || searchQuery.value.length < props.minSearchLength) {
    return opportunities.value.slice(0, 10) // Show first 10 opportunities
  }
  
  const query = searchQuery.value.toLowerCase()
  return opportunities.value.filter(opportunity =>
    opportunity.name.toLowerCase().includes(query) ||
    (opportunity.organization_name && opportunity.organization_name.toLowerCase().includes(query)) ||
    (opportunity.deal_owner && opportunity.deal_owner.toLowerCase().includes(query))
  ).slice(0, 20) // Limit to 20 results
})

const hasExactMatch = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return filteredOpportunities.value.some(opp => 
    opp.name.toLowerCase() === query
  )
})

const noResultsText = computed(() => {
  if (searchQuery.value.length < props.minSearchLength) {
    return `Type at least ${props.minSearchLength} characters to search`
  }
  return 'No opportunities found'
})

// ===============================
// OPPORTUNITY DATA MANAGEMENT
// ===============================

/**
 * Load opportunities from store
 */
const loadOpportunities = async () => {
  loading.value = true
  
  try {
    // Filter by organization if provided
    const filters = props.organizationId ? { organization_id: props.organizationId } : {}
    
    await opportunityStore.fetchOpportunities(filters)
    
    // Convert store opportunities to options format
    opportunities.value = opportunityStore.opportunities.map(opportunity => ({
      id: opportunity.id,
      name: opportunity.name,
      stage: opportunity.stage,
      organization_name: opportunity.organization_name,
      deal_owner: opportunity.deal_owner,
      probability_percent: opportunity.probability_percent,
      expected_close_date: opportunity.expected_close_date,
      organization_id: opportunity.organization_id
    }))
    
    // Set selected opportunity if modelValue exists
    if (props.modelValue) {
      const selected = opportunities.value.find(opp => opp.id === props.modelValue)
      if (selected) {
        selectedOpportunity.value = selected
        searchQuery.value = selected.name
      }
    }
  } catch (error) {
    console.error('Failed to load opportunities:', error)
    
    // Fallback to demo data
    opportunities.value = getDemoOpportunities()
    
    if (props.modelValue) {
      const selected = opportunities.value.find(opp => opp.id === props.modelValue)
      if (selected) {
        selectedOpportunity.value = selected
        searchQuery.value = selected.name
      }
    }
  } finally {
    loading.value = false
  }
}

/**
 * Search opportunities based on query
 */
const searchOpportunities = async (query: string) => {
  if (!query || query.length < props.minSearchLength) {
    return
  }
  
  loading.value = true
  
  try {
    const filters = {
      search: query,
      ...(props.organizationId && { organization_id: props.organizationId })
    }
    
    await opportunityStore.fetchOpportunities(filters)
    
    // Update opportunities list
    opportunities.value = opportunityStore.opportunities.map(opportunity => ({
      id: opportunity.id,
      name: opportunity.name,
      stage: opportunity.stage,
      organization_name: opportunity.organization_name,
      deal_owner: opportunity.deal_owner,
      probability_percent: opportunity.probability_percent,
      expected_close_date: opportunity.expected_close_date,
      organization_id: opportunity.organization_id
    }))
  } catch (error) {
    console.error('Search failed:', error)
    // Keep existing opportunities on search failure
  } finally {
    loading.value = false
  }
}

// ===============================
// EVENT HANDLERS
// ===============================

const handleInput = async () => {
  if (!selectedOpportunity.value) {
    showDropdown.value = true
    highlightedIndex.value = -1
    
    // Debounced search
    setTimeout(() => {
      if (searchQuery.value.length >= props.minSearchLength) {
        searchOpportunities(searchQuery.value)
      }
    }, 300)
  }
}

const handleFocus = () => {
  if (!props.disabled && !selectedOpportunity.value) {
    showDropdown.value = true
    highlightedIndex.value = -1
  }
}

const handleBlur = () => {
  // Delay hiding dropdown to allow for clicks
  setTimeout(() => {
    showDropdown.value = false
    highlightedIndex.value = -1
    
    // Reset search query if no selection made
    if (!selectedOpportunity.value) {
      searchQuery.value = ''
    }
  }, 150)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!showDropdown.value) return
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      const maxDown = props.allowCreate && searchQuery.value && !hasExactMatch.value 
        ? filteredOpportunities.value.length 
        : filteredOpportunities.value.length - 1
      highlightedIndex.value = Math.min(highlightedIndex.value + 1, maxDown)
      break
      
    case 'ArrowUp':
      event.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1)
      break
      
    case 'Enter':
      event.preventDefault()
      if (highlightedIndex.value >= 0) {
        if (highlightedIndex.value < filteredOpportunities.value.length) {
          selectOpportunity(filteredOpportunities.value[highlightedIndex.value])
        } else if (props.allowCreate && searchQuery.value && !hasExactMatch.value) {
          createNewOpportunity()
        }
      }
      break
      
    case 'Escape':
      event.preventDefault()
      showDropdown.value = false
      searchInput.value?.blur()
      break
  }
}

const selectOpportunity = (opportunity: OpportunityOption) => {
  selectedOpportunity.value = opportunity
  searchQuery.value = opportunity.name
  showDropdown.value = false
  highlightedIndex.value = -1
  
  emit('update:modelValue', opportunity.id)
  emit('opportunity-selected', opportunity.id, opportunity)
}

const clearSelection = () => {
  selectedOpportunity.value = null
  searchQuery.value = ''
  showDropdown.value = false
  highlightedIndex.value = -1
  
  emit('update:modelValue', null)
  emit('opportunity-selected', null, null)
  
  nextTick(() => {
    searchInput.value?.focus()
  })
}

const createNewOpportunity = () => {
  const name = searchQuery.value.trim()
  if (name) {
    emit('create-opportunity', name, props.organizationId || undefined)
    showDropdown.value = false
    highlightedIndex.value = -1
  }
}

// ===============================
// UTILITY FUNCTIONS
// ===============================

const getStageClasses = (stage: OpportunityStage): string => {
  const stageColorMap = {
    'NEW_LEAD': 'bg-gray-100 text-gray-800',
    'INITIAL_OUTREACH': 'bg-blue-100 text-blue-800',
    'SAMPLE_VISIT_OFFERED': 'bg-indigo-100 text-indigo-800',
    'AWAITING_RESPONSE': 'bg-yellow-100 text-yellow-800',
    'FEEDBACK_LOGGED': 'bg-purple-100 text-purple-800',
    'DEMO_SCHEDULED': 'bg-cyan-100 text-cyan-800',
    'CLOSED_WON': 'bg-green-100 text-green-800'
  }
  
  return stageColorMap[stage] || 'bg-gray-100 text-gray-800'
}

const formatStageDisplay = (stage: OpportunityStage): string => {
  return stage.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Demo opportunities for fallback
 */
const getDemoOpportunities = (): OpportunityOption[] => {
  return [
    {
      id: 'demo-opp-1',
      name: 'Enterprise Integration - TechCorp',
      stage: 'DEMO_SCHEDULED',
      organization_name: 'TechCorp Solutions',
      deal_owner: 'Sarah Johnson',
      probability_percent: 75,
      expected_close_date: '2024-09-15',
      organization_id: 'org-1'
    },
    {
      id: 'demo-opp-2',
      name: 'Cloud Migration - StartupCo',
      stage: 'INITIAL_OUTREACH',
      organization_name: 'StartupCo Inc',
      deal_owner: 'Alex Rodriguez',
      probability_percent: 25,
      expected_close_date: '2024-10-30',
      organization_id: 'org-2'
    },
    {
      id: 'demo-opp-3',
      name: 'Data Analytics - RetailGiant',
      stage: 'FEEDBACK_LOGGED',
      organization_name: 'RetailGiant Corp',
      deal_owner: 'Emma Thompson',
      probability_percent: 60,
      expected_close_date: '2024-08-30',
      organization_id: 'org-3'
    },
    {
      id: 'demo-opp-4',
      name: 'Security Upgrade - FinanceSecure',
      stage: 'SAMPLE_VISIT_OFFERED',
      organization_name: 'Finance Secure Ltd',
      deal_owner: 'James Wilson',
      probability_percent: 40,
      expected_close_date: '2024-11-15',
      organization_id: 'org-4'
    }
  ]
}

// ===============================
// WATCHERS
// ===============================

// Watch for external modelValue changes
watch(() => props.modelValue, async (newValue) => {
  if (newValue && newValue !== selectedOpportunity.value?.id) {
    // Find opportunity in current list or load it
    let opportunity = opportunities.value.find(opp => opp.id === newValue)
    
    if (!opportunity) {
      // Try to load the specific opportunity
      await loadOpportunities()
      opportunity = opportunities.value.find(opp => opp.id === newValue)
    }
    
    if (opportunity) {
      selectedOpportunity.value = opportunity
      searchQuery.value = opportunity.name
    }
  } else if (!newValue) {
    selectedOpportunity.value = null
    searchQuery.value = ''
  }
})

// Watch for organization changes
watch(() => props.organizationId, () => {
  // Clear selection and reload opportunities for new organization
  clearSelection()
  loadOpportunities()
})

// ===============================
// LIFECYCLE
// ===============================

onMounted(() => {
  loadOpportunities()
})
</script>

<style scoped>
.opportunity-select {
  @apply w-full;
}

/* Dropdown animation */
.opportunity-select .absolute.z-10 {
  animation: fadeInDown 0.2s ease-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Focus improvements for accessibility */
.opportunity-select input:focus-visible {
  @apply ring-offset-2;
}

/* Highlight styles for keyboard navigation */
.opportunity-select [role="option"][aria-selected="true"] {
  @apply bg-primary-100;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .opportunity-select .max-h-60 {
    @apply max-h-48;
  }
}
</style>