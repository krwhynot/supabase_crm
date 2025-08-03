<template>
  <div class="opportunity-table-container">
    <!-- Table Header with Actions -->
    <div class="table-header">
      <div class="header-left">
        <h3 class="table-title">Opportunities</h3>
        <span v-if="!isLoading" class="table-count">
          {{ totalCount }} total
        </span>
      </div>
      
      <div class="header-right">
        <!-- Bulk Actions (shown when items selected) -->
        <div v-if="selectedItems.length > 0" class="bulk-actions">
          <span class="selected-count">
            {{ selectedItems.length }} selected
          </span>
          <button
            type="button"
            class="bulk-action-btn bulk-action-btn-danger"
            @click="handleBulkDelete"
            :disabled="isDeleting"
          >
            <TrashIcon class="h-4 w-4" />
            Delete
          </button>
          <button
            type="button"
            class="bulk-action-btn bulk-action-btn-secondary"
            @click="clearSelection"
          >
            Clear
          </button>
        </div>
        
        <!-- Table Actions -->
        <div class="table-actions">
          <button
            type="button"
            class="action-btn action-btn-secondary"
            @click="refresh"
            :disabled="isLoading"
            :aria-label="isLoading ? 'Refreshing...' : 'Refresh table'"
          >
            <ArrowPathIcon 
              class="h-4 w-4" 
              :class="{ 'animate-spin': isLoading }"
            />
            Refresh
          </button>
        </div>
      </div>
    </div>

    <!-- Table Container -->
    <div class="table-wrapper">
      <!-- Loading State -->
      <div v-if="isLoading && opportunities.length === 0" class="loading-state">
        <div class="loading-spinner">
          <svg class="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <p class="loading-text">Loading opportunities...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="opportunities.length === 0 && !isLoading" class="empty-state">
        <div class="empty-icon">
          <DocumentTextIcon class="h-12 w-12 text-gray-400" />
        </div>
        <h3 class="empty-title">No opportunities found</h3>
        <p class="empty-description">
          Get started by creating your first opportunity.
        </p>
        <button
          type="button"
          class="empty-action-btn"
          @click="emit('createNew')"
        >
          Create Opportunity
        </button>
      </div>

      <!-- Data Table -->
      <div v-else class="table-scroll-container">
        <table class="opportunity-table" role="table">
          <!-- Table Header -->
          <thead class="table-head">
            <tr>
              <!-- Bulk Select -->
              <th class="select-column">
                <input
                  type="checkbox"
                  class="bulk-checkbox"
                  :checked="isAllSelected"
                  :indeterminate="isPartiallySelected"
                  @change="toggleSelectAll"
                  aria-label="Select all opportunities"
                />
              </th>
              
              <!-- Name Column -->
              <th class="sortable-column" @click="handleSort('name')">
                <div class="column-header">
                  <span>Name</span>
                  <SortIcon 
                    column="name" 
                    :current-sort="currentSort"
                    :current-order="currentOrder"
                  />
                </div>
              </th>
              
              <!-- Organization Column -->
              <th class="sortable-column" @click="handleSort('organization_name')">
                <div class="column-header">
                  <span>Organization</span>
                  <SortIcon 
                    column="organization_name" 
                    :current-sort="currentSort"
                    :current-order="currentOrder"
                  />
                </div>
              </th>
              
              <!-- Stage Column -->
              <th class="sortable-column" @click="handleSort('stage')">
                <div class="column-header">
                  <span>Stage</span>
                  <SortIcon 
                    column="stage" 
                    :current-sort="currentSort"
                    :current-order="currentOrder"
                  />
                </div>
              </th>
              
              <!-- Probability Column -->
              <th class="sortable-column" @click="handleSort('probability_percent')">
                <div class="column-header">
                  <span>Probability</span>
                  <SortIcon 
                    column="probability_percent" 
                    :current-sort="currentSort"
                    :current-order="currentOrder"
                  />
                </div>
              </th>
              
              <!-- Close Date Column -->
              <th class="sortable-column" @click="handleSort('expected_close_date')">
                <div class="column-header">
                  <span>Close Date</span>
                  <SortIcon 
                    column="expected_close_date" 
                    :current-sort="currentSort"
                    :current-order="currentOrder"
                  />
                </div>
              </th>
              
              <!-- Deal Owner Column -->
              <th class="sortable-column" @click="handleSort('deal_owner')">
                <div class="column-header">
                  <span>Owner</span>
                  <SortIcon 
                    column="deal_owner" 
                    :current-sort="currentSort"
                    :current-order="currentOrder"
                  />
                </div>
              </th>
              
              <!-- Actions Column -->
              <th class="actions-column">
                <span>Actions</span>
              </th>
            </tr>
          </thead>
          
          <!-- Table Body -->
          <tbody class="table-body">
            <tr
              v-for="opportunity in opportunities"
              :key="opportunity.id"
              class="table-row"
              :class="{ 'row-selected': isSelected(opportunity.id) }"
            >
              <!-- Select Checkbox -->
              <td class="select-cell">
                <input
                  type="checkbox"
                  class="row-checkbox"
                  :checked="isSelected(opportunity.id)"
                  @change="toggleSelect(opportunity.id)"
                  :aria-label="`Select ${opportunity.name}`"
                />
              </td>
              
              <!-- Name Cell -->
              <td class="name-cell">
                <button
                  type="button"
                  class="name-button"
                  @click="emit('rowClick', opportunity)"
                >
                  <span class="name-text">{{ opportunity.name }}</span>
                  <span v-if="opportunity.is_won" class="won-indicator">
                    <CheckCircleIcon class="h-4 w-4 text-green-500" />
                  </span>
                </button>
              </td>
              
              <!-- Organization Cell -->
              <td class="organization-cell">
                <div class="organization-info">
                  <span class="organization-name">{{ opportunity.organization_name }}</span>
                  <span v-if="opportunity.organization_type" class="organization-type">
                    {{ opportunity.organization_type }}
                  </span>
                </div>
              </td>
              
              <!-- Stage Cell -->
              <td class="stage-cell">
                <StageTag :stage="opportunity.stage" size="sm" compact />
              </td>
              
              <!-- Probability Cell -->
              <td class="probability-cell">
                <ProbabilityBar
                  :probability="opportunity.probability_percent || 0"
                  size="sm"
                  :show-label="false"
                  show-percentage-inline
                  compact
                />
              </td>
              
              <!-- Close Date Cell -->
              <td class="date-cell">
                <div v-if="opportunity.expected_close_date" class="date-info">
                  <span class="date-text">
                    {{ formatDate(opportunity.expected_close_date) }}
                  </span>
                  <span 
                    v-if="opportunity.days_to_close !== null" 
                    class="days-indicator"
                    :class="getDaysIndicatorClass(opportunity.days_to_close)"
                  >
                    {{ getDaysText(opportunity.days_to_close) }}
                  </span>
                </div>
                <span v-else class="no-date">No date set</span>
              </td>
              
              <!-- Deal Owner Cell -->
              <td class="owner-cell">
                <span v-if="opportunity.deal_owner" class="owner-name">
                  {{ opportunity.deal_owner }}
                </span>
                <span v-else class="no-owner">Unassigned</span>
              </td>
              
              <!-- Actions Cell -->
              <td class="actions-cell">
                <div class="actions-dropdown">
                  <button
                    type="button"
                    class="actions-trigger"
                    @click="toggleActionsMenu(opportunity.id)"
                    :aria-label="`Actions for ${opportunity.name}`"
                    :aria-expanded="activeActionsMenu === opportunity.id"
                  >
                    <EllipsisVerticalIcon class="h-5 w-5" />
                  </button>
                  
                  <!-- Actions Menu -->
                  <div
                    v-if="activeActionsMenu === opportunity.id"
                    class="actions-menu"
                    @click.stop
                  >
                    <button
                      type="button"
                      class="action-item"
                      @click="handleEdit(opportunity)"
                    >
                      <PencilIcon class="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      class="action-item"
                      @click="handleDuplicate(opportunity)"
                    >
                      <DocumentDuplicateIcon class="h-4 w-4" />
                      Duplicate
                    </button>
                    <div class="action-divider" />
                    <button
                      type="button"
                      class="action-item action-item-danger"
                      @click="handleDelete(opportunity)"
                    >
                      <TrashIcon class="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="opportunities.length > 0" class="pagination-container">
      <div class="pagination-info">
        <span class="pagination-text">
          Showing {{ startIndex }} to {{ endIndex }} of {{ totalCount }} results
        </span>
      </div>
      
      <div class="pagination-controls">
        <button
          type="button"
          class="pagination-btn"
          :disabled="!hasPreviousPage || isLoading"
          @click="handlePreviousPage"
          aria-label="Previous page"
        >
          <ChevronLeftIcon class="h-4 w-4" />
          Previous
        </button>
        
        <span class="page-indicator">
          Page {{ currentPage }}
        </span>
        
        <button
          type="button"
          class="pagination-btn"
          :disabled="!hasNextPage || isLoading"
          @click="handleNextPage"
          aria-label="Next page"
        >
          Next
          <ChevronRightIcon class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useOpportunityStore } from '@/stores/opportunityStore'
import StageTag from './StageTag.vue'
import ProbabilityBar from './ProbabilityBar.vue'
import type { OpportunityListView } from '@/types/opportunities'

// Icons
import {
  TrashIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  EllipsisVerticalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/vue/24/outline'

/**
 * Props interface for OpportunityTable component
 */
interface Props {
  /** Override opportunities data */
  customOpportunities?: OpportunityListView[]
  /** Whether to show pagination */
  showPagination?: boolean
  /** Items per page */
  itemsPerPage?: number
  /** Whether table is in compact mode */
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showPagination: true,
  itemsPerPage: 20,
  compact: false
})

/**
 * Component emits
 */
const emit = defineEmits<{
  /** Emitted when a row is clicked */
  rowClick: [opportunity: OpportunityListView]
  /** Emitted when edit action is triggered */
  edit: [opportunity: OpportunityListView]
  /** Emitted when delete action is triggered */
  delete: [opportunity: OpportunityListView]
  /** Emitted when duplicate action is triggered */
  duplicate: [opportunity: OpportunityListView]
  /** Emitted when bulk delete is triggered */
  bulkDelete: [opportunityIds: string[]]
  /** Emitted when create new is triggered */
  createNew: []
  /** Emitted when sort changes */
  sortChange: [column: string, order: 'asc' | 'desc']
}>()

// ===============================
// STORE INTEGRATION
// ===============================

const opportunityStore = useOpportunityStore()

const opportunities = computed(() => 
  props.customOpportunities || opportunityStore.opportunities
)
const isLoading = computed(() => opportunityStore.isLoading)
const isDeleting = computed(() => opportunityStore.deleting)
const totalCount = computed(() => opportunityStore.totalCount)
const currentPage = computed(() => opportunityStore.currentPage)
const hasNextPage = computed(() => opportunityStore.hasNextPage)
const hasPreviousPage = computed(() => opportunityStore.hasPreviousPage)

// ===============================
// LOCAL STATE
// ===============================

const selectedItems = ref<string[]>([])
const activeActionsMenu = ref<string | null>(null)
const currentSort = ref<string>('created_at')
const currentOrder = ref<'asc' | 'desc'>('desc')

// ===============================
// COMPUTED PROPERTIES
// ===============================

const isAllSelected = computed(() => {
  return opportunities.value.length > 0 && 
         selectedItems.value.length === opportunities.value.length
})

const isPartiallySelected = computed(() => {
  return selectedItems.value.length > 0 && 
         selectedItems.value.length < opportunities.value.length
})

const startIndex = computed(() => {
  if (opportunities.value.length === 0) return 0
  return ((currentPage.value - 1) * props.itemsPerPage) + 1
})

const endIndex = computed(() => {
  const end = currentPage.value * props.itemsPerPage
  return Math.min(end, totalCount.value)
})

// ===============================
// METHODS
// ===============================

/**
 * Toggle selection of all items
 */
const toggleSelectAll = (): void => {
  if (isAllSelected.value) {
    selectedItems.value = []
  } else {
    selectedItems.value = opportunities.value.map(opp => opp.id)
  }
}

/**
 * Toggle selection of a single item
 */
const toggleSelect = (id: string): void => {
  const index = selectedItems.value.indexOf(id)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push(id)
  }
}

/**
 * Check if an item is selected
 */
const isSelected = (id: string): boolean => {
  return selectedItems.value.includes(id)
}

/**
 * Clear all selections
 */
const clearSelection = (): void => {
  selectedItems.value = []
}

/**
 * Handle sorting
 */
const handleSort = (column: string): void => {
  if (currentSort.value === column) {
    currentOrder.value = currentOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    currentSort.value = column
    currentOrder.value = 'asc'
  }
  
  // Update store pagination with new sort
  opportunityStore.activePagination.sort_by = column
  opportunityStore.activePagination.sort_order = currentOrder.value
  
  // Refresh data
  refresh()
}

/**
 * Toggle actions menu
 */
const toggleActionsMenu = (id: string): void => {
  activeActionsMenu.value = activeActionsMenu.value === id ? null : id
}

/**
 * Handle pagination
 */
const handlePreviousPage = async (): Promise<void> => {
  if (hasPreviousPage.value) {
    opportunityStore.activePagination.page = currentPage.value - 1
    await refresh()
  }
}

const handleNextPage = async (): Promise<void> => {
  if (hasNextPage.value) {
    opportunityStore.activePagination.page = currentPage.value + 1
    await refresh()
  }
}

/**
 * Refresh data
 */
const refresh = async (): Promise<void> => {
  await opportunityStore.fetchOpportunities(
    opportunityStore.activeFilters,
    opportunityStore.activePagination
  )
}

/**
 * Handle actions
 */
const handleEdit = (opportunity: OpportunityListView): void => {
  activeActionsMenu.value = null
  emit('edit', opportunity)
}

const handleDelete = (opportunity: OpportunityListView): void => {
  activeActionsMenu.value = null
  emit('delete', opportunity)
}

const handleDuplicate = (opportunity: OpportunityListView): void => {
  activeActionsMenu.value = null
  emit('duplicate', opportunity)
}

const handleBulkDelete = (): void => {
  if (selectedItems.value.length > 0) {
    emit('bulkDelete', selectedItems.value)
    selectedItems.value = []
  }
}

/**
 * Format date for display
 */
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Get days text for display
 */
const getDaysText = (days: number): string => {
  if (days < 0) {
    return `${Math.abs(days)} days overdue`
  }
  if (days === 0) {
    return 'Due today'
  }
  return `${days} days left`
}

/**
 * Get CSS class for days indicator
 */
const getDaysIndicatorClass = (days: number): string => {
  if (days < 0) return 'days-overdue'
  if (days <= 7) return 'days-urgent'
  if (days <= 30) return 'days-soon'
  return 'days-normal'
}

/**
 * Close actions menu when clicking outside
 */
const handleClickOutside = (event: Event): void => {
  const target = event.target as Element
  if (!target.closest('.actions-dropdown')) {
    activeActionsMenu.value = null
  }
}

// ===============================
// LIFECYCLE
// ===============================

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// ===============================
// SORT ICON COMPONENT
// ===============================
</script>

<script lang="ts">
/**
 * Sort Icon Component
 */
const SortIcon = {
  props: {
    column: String,
    currentSort: String,
    currentOrder: String
  },
  template: `
    <div class="sort-icon">
      <svg v-if="column === currentSort" class="h-4 w-4" :class="currentOrder === 'asc' ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
      <svg v-else class="h-4 w-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
      </svg>
    </div>
  `
}
</script>

<style scoped>
/* ===============================
   TABLE CONTAINER STYLES
   =============================== */

.opportunity-table-container {
  @apply bg-white rounded-lg border border-gray-200 shadow-sm;
}

/* ===============================
   TABLE HEADER STYLES
   =============================== */

.table-header {
  @apply flex items-center justify-between p-4 lg:p-6 border-b border-gray-200;
}

.header-left {
  @apply flex items-center space-x-3;
}

.table-title {
  @apply text-lg font-semibold text-gray-900;
}

.table-count {
  @apply text-sm text-gray-500;
}

.header-right {
  @apply flex items-center space-x-3;
}

/* ===============================
   BULK ACTIONS STYLES
   =============================== */

.bulk-actions {
  @apply flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200;
}

.selected-count {
  @apply text-sm font-medium text-blue-700;
}

.bulk-action-btn {
  @apply inline-flex items-center space-x-1 px-3 py-1.5 text-sm font-medium rounded-md;
  @apply min-h-[32px] min-w-[64px];
  @apply transition-colors duration-200;
}

.bulk-action-btn-danger {
  @apply bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2;
}

.bulk-action-btn-secondary {
  @apply bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
}

/* ===============================
   TABLE ACTIONS STYLES
   =============================== */

.table-actions {
  @apply flex items-center space-x-2;
}

.action-btn {
  @apply inline-flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md;
  @apply min-h-[36px] min-w-[80px];
  @apply transition-colors duration-200;
}

.action-btn-secondary {
  @apply bg-white text-gray-700 border border-gray-300 hover:bg-gray-50;
  @apply focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
}

/* ===============================
   TABLE WRAPPER STYLES
   =============================== */

.table-wrapper {
  @apply min-h-[400px];
}

.table-scroll-container {
  @apply overflow-x-auto;
}

.opportunity-table {
  @apply min-w-full divide-y divide-gray-200;
}

/* ===============================
   TABLE HEAD STYLES
   =============================== */

.table-head {
  @apply bg-gray-50;
}

.table-head th {
  @apply px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider;
  @apply min-h-[44px];
}

.select-column {
  @apply w-12;
}

.sortable-column {
  @apply cursor-pointer hover:bg-gray-100 transition-colors duration-150;
}

.column-header {
  @apply flex items-center space-x-1;
}

.actions-column {
  @apply w-20;
}

/* ===============================
   TABLE BODY STYLES
   =============================== */

.table-body {
  @apply bg-white divide-y divide-gray-200;
}

.table-row {
  @apply hover:bg-gray-50 transition-colors duration-150;
  @apply min-h-[60px];
}

.row-selected {
  @apply bg-blue-50;
}

.table-row td {
  @apply px-4 py-4 whitespace-nowrap;
  @apply min-h-[60px];
}

/* ===============================
   CELL SPECIFIC STYLES
   =============================== */

.select-cell {
  @apply w-12;
}

.bulk-checkbox,
.row-checkbox {
  @apply h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500;
  @apply min-w-[16px] min-h-[16px];
}

.name-cell {
  @apply min-w-[200px] max-w-[300px];
}

.name-button {
  @apply flex items-center space-x-2 text-left hover:text-blue-600 transition-colors duration-150;
}

.name-text {
  @apply font-medium text-gray-900 truncate;
}

.won-indicator {
  @apply flex-shrink-0;
}

.organization-cell {
  @apply min-w-[150px] max-w-[200px];
}

.organization-info {
  @apply space-y-1;
}

.organization-name {
  @apply text-sm font-medium text-gray-900 truncate block;
}

.organization-type {
  @apply text-xs text-gray-500 truncate block;
}

.stage-cell {
  @apply min-w-[120px];
}

.probability-cell {
  @apply min-w-[100px] max-w-[150px];
}

.date-cell {
  @apply min-w-[120px];
}

.date-info {
  @apply space-y-1;
}

.date-text {
  @apply text-sm text-gray-900 block;
}

.days-indicator {
  @apply text-xs font-medium block;
}

.days-normal {
  @apply text-gray-500;
}

.days-soon {
  @apply text-yellow-600;
}

.days-urgent {
  @apply text-orange-600;
}

.days-overdue {
  @apply text-red-600;
}

.no-date {
  @apply text-sm text-gray-400;
}

.owner-cell {
  @apply min-w-[100px];
}

.owner-name {
  @apply text-sm text-gray-900;
}

.no-owner {
  @apply text-sm text-gray-400;
}

/* ===============================
   ACTIONS DROPDOWN STYLES
   =============================== */

.actions-cell {
  @apply relative;
}

.actions-dropdown {
  @apply relative;
}

.actions-trigger {
  @apply p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100;
  @apply min-w-[32px] min-h-[32px];
  @apply transition-colors duration-150;
}

.actions-menu {
  @apply absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200;
  @apply z-10 py-1;
}

.action-item {
  @apply flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700;
  @apply hover:bg-gray-100 transition-colors duration-150;
  @apply min-h-[36px];
}

.action-item-danger {
  @apply text-red-700 hover:bg-red-50;
}

.action-divider {
  @apply border-t border-gray-200 my-1;
}

/* ===============================
   LOADING & EMPTY STATES
   =============================== */

.loading-state,
.empty-state {
  @apply flex flex-col items-center justify-center py-12;
}

.loading-spinner {
  @apply mb-4;
}

.loading-text {
  @apply text-sm text-gray-500;
}

.empty-icon {
  @apply mb-4;
}

.empty-title {
  @apply text-lg font-medium text-gray-900 mb-2;
}

.empty-description {
  @apply text-sm text-gray-500 mb-6 text-center max-w-sm;
}

.empty-action-btn {
  @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md;
  @apply text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
  @apply min-h-[36px];
}

/* ===============================
   PAGINATION STYLES
   =============================== */

.pagination-container {
  @apply flex items-center justify-between px-4 py-3 border-t border-gray-200;
}

.pagination-info {
  @apply flex-1;
}

.pagination-text {
  @apply text-sm text-gray-700;
}

.pagination-controls {
  @apply flex items-center space-x-4;
}

.pagination-btn {
  @apply inline-flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-md;
  @apply bg-white text-gray-700 border border-gray-300 hover:bg-gray-50;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  @apply focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
  @apply min-h-[36px] min-w-[80px];
}

.page-indicator {
  @apply text-sm font-medium text-gray-700;
}

/* ===============================
   SORT ICON STYLES
   =============================== */

.sort-icon {
  @apply flex-shrink-0;
}

/* ===============================
   RESPONSIVE DESIGN
   =============================== */

/* iPad Portrait Optimization */
@media (min-width: 768px) and (max-width: 1024px) {
  .table-header {
    @apply flex-col space-y-4 items-stretch;
  }
  
  .header-left,
  .header-right {
    @apply justify-between;
  }
  
  .table-row td {
    @apply py-3;
    @apply min-h-[52px];
  }
  
  .actions-trigger {
    @apply min-w-[44px] min-h-[44px];
  }
}

/* Mobile Optimization */
@media (max-width: 767px) {
  .opportunity-table-container {
    @apply rounded-none border-x-0;
  }
  
  .table-header {
    @apply p-3 flex-col space-y-3 items-stretch;
  }
  
  .table-title {
    @apply text-base;
  }
  
  .bulk-actions,
  .table-actions {
    @apply space-x-1;
  }
  
  .bulk-action-btn,
  .action-btn {
    @apply px-2 py-1.5 text-xs;
  }
  
  .table-scroll-container {
    @apply -mx-3;
  }
  
  .opportunity-table {
    @apply min-w-[800px];
  }
  
  .table-row td {
    @apply px-3 py-2 text-xs;
    @apply min-h-[44px];
  }
  
  .pagination-container {
    @apply px-3 py-2 flex-col space-y-2 items-stretch;
  }
  
  .pagination-controls {
    @apply justify-center;
  }
}

/* ===============================
   ACCESSIBILITY ENHANCEMENTS
   =============================== */

.sortable-column:focus {
  @apply outline-none ring-2 ring-blue-500 ring-inset;
}

.actions-trigger:focus {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .opportunity-table-container {
    @apply border-2 border-gray-600;
  }
  
  .table-row:hover {
    @apply bg-gray-200;
  }
  
  .row-selected {
    @apply bg-blue-200;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .table-row,
  .sortable-column,
  .actions-trigger,
  .action-item {
    transition: none;
  }
  
  .loading-spinner svg {
    animation: none;
  }
}
</style>