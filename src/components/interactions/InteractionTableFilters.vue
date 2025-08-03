<!--
  Interaction Table Filters Component
  Advanced filtering component for interaction table
  Following OpportunityTable architecture patterns
-->

<template>
  <div class="filters-container">
    <!-- Filter Header -->
    <div class="filter-header">
      <div class="filter-title-section">
        <h3 class="filter-title">Filters</h3>
        <span v-if="activeFilterCount > 0" class="active-filter-count">
          {{ activeFilterCount }} active
        </span>
      </div>
      
      <div class="filter-actions">
        <button
          type="button"
          class="filter-action-btn"
          @click="clearAllFilters"
          :disabled="activeFilterCount === 0"
        >
          Clear All
        </button>
        <button
          type="button"
          class="filter-toggle-btn"
          @click="toggleExpanded"
          :aria-expanded="isExpanded"
        >
          <ChevronDownIcon 
            class="toggle-icon" 
            :class="{ 'rotate-180': isExpanded }"
          />
        </button>
      </div>
    </div>

    <!-- Filter Content -->
    <div v-if="isExpanded" class="filter-content">
      <div class="filter-grid">
        <!-- Search Filter -->
        <div class="filter-group">
          <label class="filter-label">Search</label>
          <div class="search-input-wrapper">
            <MagnifyingGlassIcon class="search-icon" />
            <input
              type="text"
              class="search-input"
              placeholder="Search interactions..."
              v-model="localFilters.search"
              @input="debouncedApplyFilters"
            />
            <button
              v-if="localFilters.search"
              type="button"
              class="search-clear-btn"
              @click="clearSearch"
            >
              <XMarkIcon class="h-4 w-4" />
            </button>
          </div>
        </div>

        <!-- Interaction Type Filter -->
        <div class="filter-group">
          <label class="filter-label">Interaction Type</label>
          <div class="checkbox-group">
            <label
              v-for="type in interactionTypes"
              :key="type"
              class="checkbox-item"
            >
              <input
                type="checkbox"
                class="checkbox-input"
                :value="type"
                v-model="localFilters.interaction_type"
                @change="applyFilters"
              />
              <InteractionTypeBadge :type="type" size="xs" />
            </label>
          </div>
        </div>

        <!-- Priority Filter -->
        <div class="filter-group">
          <label class="filter-label">Priority</label>
          <div class="checkbox-group">
            <label
              v-for="priority in priorityLevels"
              :key="priority"
              class="checkbox-item"
            >
              <input
                type="checkbox"
                class="checkbox-input"
                :value="priority"
                v-model="localFilters.priority"
                @change="applyFilters"
              />
              <PriorityBadge :priority="priority" size="xs" />
            </label>
          </div>
        </div>

        <!-- Date Range Filter -->
        <div class="filter-group">
          <label class="filter-label">Date Range</label>
          <div class="date-range-inputs">
            <input
              type="date"
              class="date-input"
              placeholder="From"
              v-model="localFilters.date_from"
              @change="applyFilters"
            />
            <span class="date-separator">to</span>
            <input
              type="date"
              class="date-input"
              placeholder="To"
              v-model="localFilters.date_to"
              @change="applyFilters"
            />
          </div>
        </div>

        <!-- Follow-up Status Filter -->
        <div class="filter-group">
          <label class="filter-label">Follow-up Status</label>
          <div class="radio-group">
            <label class="radio-item">
              <input
                type="radio"
                class="radio-input"
                :value="undefined"
                v-model="localFilters.follow_up_status"
                @change="applyFilters"
              />
              <span class="radio-label">All</span>
            </label>
            <label class="radio-item">
              <input
                type="radio"
                class="radio-input"
                value="needed"
                v-model="localFilters.follow_up_status"
                @change="applyFilters"
              />
              <span class="radio-label">Follow-up Needed</span>
            </label>
            <label class="radio-item">
              <input
                type="radio"
                class="radio-input"
                value="overdue"
                v-model="localFilters.follow_up_status"
                @change="applyFilters"
              />
              <span class="radio-label">Overdue</span>
            </label>
          </div>
        </div>

        <!-- Contact/Opportunity Filter -->
        <div class="filter-group">
          <label class="filter-label">Relationships</label>
          <div class="checkbox-group">
            <label class="checkbox-item">
              <input
                type="checkbox"
                class="checkbox-input"
                v-model="localFilters.has_contact"
                @change="applyFilters"
              />
              <span class="checkbox-label">Has Contact</span>
            </label>
            <label class="checkbox-item">
              <input
                type="checkbox"
                class="checkbox-input"
                v-model="localFilters.has_opportunity"
                @change="applyFilters"
              />
              <span class="checkbox-label">Has Opportunity</span>
            </label>
          </div>
        </div>

        <!-- Account Manager Filter -->
        <div class="filter-group">
          <label class="filter-label">Account Manager</label>
          <select
            class="select-input"
            v-model="localFilters.created_by"
            @change="applyFilters"
          >
            <option value="">All Managers</option>
            <option
              v-for="manager in accountManagers"
              :key="manager"
              :value="manager"
            >
              {{ manager }}
            </option>
          </select>
        </div>
      </div>

      <!-- Quick Filters -->
      <div class="quick-filters">
        <h4 class="quick-filters-title">Quick Filters</h4>
        <div class="quick-filter-buttons">
          <button
            type="button"
            class="quick-filter-btn"
            :class="{ active: isQuickFilterActive('today') }"
            @click="applyQuickFilter('today')"
          >
            Today
          </button>
          <button
            type="button"
            class="quick-filter-btn"
            :class="{ active: isQuickFilterActive('this_week') }"
            @click="applyQuickFilter('this_week')"
          >
            This Week
          </button>
          <button
            type="button"
            class="quick-filter-btn"
            :class="{ active: isQuickFilterActive('overdue_followups') }"
            @click="applyQuickFilter('overdue_followups')"
          >
            Overdue Follow-ups
          </button>
          <button
            type="button"
            class="quick-filter-btn"
            :class="{ active: isQuickFilterActive('high_priority') }"
            @click="applyQuickFilter('high_priority')"
          >
            High Priority
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { debounce } from 'lodash-es'
import type { InteractionFilters, InteractionType } from '@/types/interactions'
import { InteractionType as InteractionTypeEnum } from '@/types/interactions'
import InteractionTypeBadge from './InteractionTypeBadge.vue'
import PriorityBadge from './PriorityBadge.vue'
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

interface Props {
  /** Current filter values */
  filters: InteractionFilters
  /** Available account managers */
  accountManagers?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  accountManagers: () => []
})

const emit = defineEmits<{
  /** Emitted when filters change */
  change: [filters: InteractionFilters]
  /** Emitted when filters are cleared */
  clear: []
}>()

// Local state
const isExpanded = ref(true)
const localFilters = ref<InteractionFilters & { 
  priority?: string[]
  follow_up_status?: 'needed' | 'overdue' | undefined
}>({
  ...props.filters,
  priority: [],
  follow_up_status: undefined
})

// Constants
const interactionTypes = Object.values(InteractionTypeEnum)
const priorityLevels: ('High' | 'Medium' | 'Low')[] = ['High', 'Medium', 'Low']

// Computed properties
const activeFilterCount = computed(() => {
  let count = 0
  if (localFilters.value.search) count++
  if (localFilters.value.interaction_type?.length) count++
  if (localFilters.value.priority?.length) count++
  if (localFilters.value.date_from) count++
  if (localFilters.value.date_to) count++
  if (localFilters.value.follow_up_status) count++
  if (localFilters.value.has_contact) count++
  if (localFilters.value.has_opportunity) count++
  if (localFilters.value.created_by) count++
  return count
})

// Methods
const toggleExpanded = (): void => {
  isExpanded.value = !isExpanded.value
}

const applyFilters = (): void => {
  // Convert local filters to API format
  const apiFilters: InteractionFilters = {
    search: localFilters.value.search,
    interaction_type: localFilters.value.interaction_type,
    date_from: localFilters.value.date_from,
    date_to: localFilters.value.date_to,
    created_by: localFilters.value.created_by,
    has_contact: localFilters.value.has_contact,
    has_opportunity: localFilters.value.has_opportunity
  }

  // Handle follow-up status
  if (localFilters.value.follow_up_status === 'needed') {
    apiFilters.follow_up_needed = true
  } else if (localFilters.value.follow_up_status === 'overdue') {
    apiFilters.follow_up_overdue = true
  }

  emit('change', apiFilters)
}

const debouncedApplyFilters = debounce(applyFilters, 300)

const clearAllFilters = (): void => {
  localFilters.value = {
    search: '',
    interaction_type: [],
    priority: [],
    date_from: '',
    date_to: '',
    follow_up_status: undefined,
    has_contact: false,
    has_opportunity: false,
    created_by: ''
  }
  emit('clear')
}

const clearSearch = (): void => {
  localFilters.value.search = ''
  applyFilters()
}

const applyQuickFilter = (type: string): void => {
  const today = new Date()
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
  
  switch (type) {
    case 'today':
      localFilters.value.date_from = new Date().toISOString().split('T')[0]
      localFilters.value.date_to = new Date().toISOString().split('T')[0]
      break
    case 'this_week':
      localFilters.value.date_from = startOfWeek.toISOString().split('T')[0]
      localFilters.value.date_to = new Date().toISOString().split('T')[0]
      break
    case 'overdue_followups':
      localFilters.value.follow_up_status = 'overdue'
      break
    case 'high_priority':
      localFilters.value.priority = ['High']
      break
  }
  applyFilters()
}

const isQuickFilterActive = (type: string): boolean => {
  const today = new Date().toISOString().split('T')[0]
  
  switch (type) {
    case 'today':
      return localFilters.value.date_from === today && localFilters.value.date_to === today
    case 'overdue_followups':
      return localFilters.value.follow_up_status === 'overdue'
    case 'high_priority':
      return localFilters.value.priority?.includes('High') || false
    default:
      return false
  }
}

// Watch for external filter changes
watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters, priority: [], follow_up_status: undefined }
}, { deep: true })
</script>

<style scoped>
/* Container */
.filters-container {
  @apply bg-white border border-gray-200 rounded-lg shadow-sm;
}

/* Header */
.filter-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200;
}

.filter-title-section {
  @apply flex items-center space-x-2;
}

.filter-title {
  @apply text-lg font-semibold text-gray-900;
}

.active-filter-count {
  @apply px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full;
}

.filter-actions {
  @apply flex items-center space-x-2;
}

.filter-action-btn {
  @apply px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md;
  @apply hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.filter-toggle-btn {
  @apply p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100;
}

.toggle-icon {
  @apply h-5 w-5 transition-transform duration-200;
}

/* Content */
.filter-content {
  @apply p-4 space-y-6;
}

.filter-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.filter-group {
  @apply space-y-2;
}

.filter-label {
  @apply block text-sm font-medium text-gray-700;
}

/* Search Input */
.search-input-wrapper {
  @apply relative;
}

.search-icon {
  @apply absolute left-3 top-3 h-4 w-4 text-gray-400;
}

.search-input {
  @apply w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md;
  @apply focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.search-clear-btn {
  @apply absolute right-3 top-3 text-gray-400 hover:text-gray-600;
}

/* Form Inputs */
.select-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md;
  @apply focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.date-range-inputs {
  @apply flex items-center space-x-2;
}

.date-input {
  @apply flex-1 px-3 py-2 border border-gray-300 rounded-md;
  @apply focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.date-separator {
  @apply text-sm text-gray-500;
}

/* Checkbox Group */
.checkbox-group {
  @apply space-y-2;
}

.checkbox-item {
  @apply flex items-center space-x-2 cursor-pointer;
}

.checkbox-input {
  @apply h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500;
}

.checkbox-label {
  @apply text-sm text-gray-700;
}

/* Radio Group */
.radio-group {
  @apply space-y-2;
}

.radio-item {
  @apply flex items-center space-x-2 cursor-pointer;
}

.radio-input {
  @apply h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500;
}

.radio-label {
  @apply text-sm text-gray-700;
}

/* Quick Filters */
.quick-filters {
  @apply pt-4 border-t border-gray-200;
}

.quick-filters-title {
  @apply text-sm font-medium text-gray-700 mb-3;
}

.quick-filter-buttons {
  @apply flex flex-wrap gap-2;
}

.quick-filter-btn {
  @apply px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md;
  @apply hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
  @apply transition-colors duration-200;
}

.quick-filter-btn.active {
  @apply bg-blue-100 text-blue-800 border-blue-200;
}

/* Responsive Design */
@media (max-width: 768px) {
  .filter-grid {
    @apply grid-cols-1;
  }
  
  .date-range-inputs {
    @apply flex-col space-y-2 space-x-0;
  }
  
  .quick-filter-buttons {
    @apply grid grid-cols-2 gap-2;
  }
}

/* Accessibility */
.filter-toggle-btn:focus {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .filters-container {
    @apply border-2 border-gray-600;
  }
  
  .quick-filter-btn.active {
    @apply border-2 border-blue-600;
  }
}
</style>