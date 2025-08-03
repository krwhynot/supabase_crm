<template>
  <div class="interaction-table-container">
    <!-- Table Header with Actions -->
    <div class="table-header">
      <div class="header-left">
        <h3 class="table-title">Interactions</h3>
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
            @click="exportSelected"
            :disabled="isLoading"
          >
            <DocumentArrowDownIcon class="h-4 w-4" />
            Export
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
          <button
            type="button"
            class="action-btn action-btn-primary"
            @click="emit('createNew')"
          >
            <PlusIcon class="h-4 w-4" />
            New Interaction
          </button>
        </div>
      </div>
    </div>

    <!-- Table Container -->
    <div class="table-wrapper">
      <!-- Loading State -->
      <div v-if="isLoading && interactions.length === 0" class="loading-state">
        <div class="loading-spinner">
          <svg class="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <p class="loading-text">Loading interactions...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="interactions.length === 0 && !isLoading" class="empty-state">
        <div class="empty-icon">
          <ChatBubbleLeftRightIcon class="h-12 w-12 text-gray-400" />
        </div>
        <h3 class="empty-title">No interactions found</h3>
        <p class="empty-description">
          Get started by creating your first interaction record.
        </p>
        <button
          type="button"
          class="empty-action-btn"
          @click="emit('createNew')"
        >
          Create Interaction
        </button>
      </div>

      <!-- Data Table -->
      <div v-else class="table-scroll-container">
        <table class="interaction-table" role="table">
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
                  aria-label="Select all interactions"
                />
              </th>
              
              <!-- Priority Column -->
              <th class="sortable-column priority-column" @click="handleSort('interaction_priority')">
                <div class="column-header">
                  <span>Priority</span>
                  <SortIcon 
                    column="interaction_priority" 
                    :current-sort="currentSort"
                    :current-order="currentOrder"
                  />
                </div>
              </th>
              
              <!-- Type Column -->
              <th class="sortable-column" @click="handleSort('interaction_type')">
                <div class="column-header">
                  <span>Type</span>
                  <SortIcon 
                    column="interaction_type" 
                    :current-sort="currentSort"
                    :current-order="currentOrder"
                  />
                </div>
              </th>
              
              <!-- Date Column -->
              <th class="sortable-column" @click="handleSort('date')">
                <div class="column-header">
                  <span>Date</span>
                  <SortIcon 
                    column="date" 
                    :current-sort="currentSort"
                    :current-order="currentOrder"
                  />
                </div>
              </th>
              
              <!-- Subject Column -->
              <th class="sortable-column" @click="handleSort('subject')">
                <div class="column-header">
                  <span>Subject</span>
                  <SortIcon 
                    column="subject" 
                    :current-sort="currentSort"
                    :current-order="currentOrder"
                  />
                </div>
              </th>
              
              <!-- Account Manager Column -->
              <th class="sortable-column" @click="handleSort('created_by')">
                <div class="column-header">
                  <span>Account Manager</span>
                  <SortIcon 
                    column="created_by" 
                    :current-sort="currentSort"
                    :current-order="currentOrder"
                  />
                </div>
              </th>
              
              <!-- Opportunity Column -->
              <th class="sortable-column" @click="handleSort('opportunity_name')">
                <div class="column-header">
                  <span>Opportunity</span>
                  <SortIcon 
                    column="opportunity_name" 
                    :current-sort="currentSort"
                    :current-order="currentOrder"
                  />
                </div>
              </th>
              
              <!-- Contact Column -->
              <th class="sortable-column" @click="handleSort('contact_name')">
                <div class="column-header">
                  <span>Contact</span>
                  <SortIcon 
                    column="contact_name" 
                    :current-sort="currentSort"
                    :current-order="currentOrder"
                  />
                </div>
              </th>
              
              <!-- Principal Column -->
              <th class="non-sortable-column">
                <span>Principal</span>
              </th>
              
              <!-- Operator Column -->
              <th class="non-sortable-column">
                <span>Operator</span>
              </th>
              
              <!-- Notes Column -->
              <th class="non-sortable-column notes-column">
                <span>Notes</span>
              </th>
              
              <!-- Sample Rating Column -->
              <th class="non-sortable-column rating-column">
                <span>Rating</span>
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
              v-for="interaction in interactions"
              :key="interaction.id"
              class="table-row"
              :class="{ 
                'row-selected': isSelected(interaction.id),
                'row-overdue': interaction.is_overdue_follow_up
              }"
            >
              <!-- Select Checkbox -->
              <td class="select-cell">
                <input
                  type="checkbox"
                  class="row-checkbox"
                  :checked="isSelected(interaction.id)"
                  @change="toggleSelect(interaction.id)"
                  :aria-label="`Select ${interaction.subject}`"
                />
              </td>
              
              <!-- Priority Cell -->
              <td class="priority-cell">
                <PriorityBadge :priority="interaction.interaction_priority" size="sm" />
              </td>
              
              <!-- Type Cell -->
              <td class="type-cell">
                <InteractionTypeBadge :type="interaction.interaction_type" size="sm" compact />
              </td>
              
              <!-- Date Cell -->
              <td class="date-cell">
                <div class="date-info">
                  <span class="date-text">
                    {{ formatDate(interaction.date) }}
                  </span>
                  <span class="days-ago-text">
                    {{ getDaysAgoText(interaction.days_since_interaction) }}
                  </span>
                </div>
              </td>
              
              <!-- Subject Cell -->
              <td class="subject-cell">
                <button
                  type="button"
                  class="subject-button"
                  @click="emit('rowClick', interaction)"
                >
                  <span class="subject-text">{{ interaction.subject }}</span>
                  <span v-if="interaction.follow_up_needed" class="follow-up-indicator">
                    <ClockIcon class="h-4 w-4" :class="getFollowUpIndicatorClass(interaction)" />
                  </span>
                </button>
              </td>
              
              <!-- Account Manager Cell -->
              <td class="manager-cell">
                <div class="manager-info">
                  <span v-if="interaction.created_by" class="manager-name">
                    {{ formatAccountManager(interaction.created_by) }}
                  </span>
                  <span v-else class="no-manager">Unassigned</span>
                </div>
              </td>
              
              <!-- Opportunity Cell -->
              <td class="opportunity-cell">
                <div v-if="interaction.opportunity_name" class="opportunity-info">
                  <span class="opportunity-name">{{ interaction.opportunity_name }}</span>
                  <span v-if="interaction.opportunity_stage" class="opportunity-stage">
                    {{ formatStage(interaction.opportunity_stage) }}
                  </span>
                </div>
                <span v-else class="no-opportunity">No opportunity</span>
              </td>
              
              <!-- Contact Cell -->
              <td class="contact-cell">
                <div v-if="interaction.contact_name" class="contact-info">
                  <span class="contact-name">{{ interaction.contact_name }}</span>
                  <span v-if="interaction.contact_position" class="contact-position">
                    {{ interaction.contact_position }}
                  </span>
                </div>
                <span v-else class="no-contact">No contact</span>
              </td>
              
              <!-- Principal Cell -->
              <td class="principal-cell">
                <div class="principal-info">
                  <span class="principal-name">
                    {{ getPrincipalName(interaction) }}
                  </span>
                </div>
              </td>
              
              <!-- Operator Cell -->
              <td class="operator-cell">
                <div class="operator-info">
                  <span class="operator-name">
                    {{ getOperatorName(interaction) }}
                  </span>
                </div>
              </td>
              
              <!-- Notes Cell -->
              <td class="notes-cell">
                <div v-if="interaction.notes" class="notes-content">
                  <span class="notes-text">{{ truncateNotes(interaction.notes) }}</span>
                  <button
                    v-if="interaction.notes.length > 100"
                    type="button"
                    class="notes-expand-btn"
                    @click="showNotesModal(interaction)"
                  >
                    Read more
                  </button>
                </div>
                <span v-else class="no-notes">No notes</span>
              </td>
              
              <!-- Sample Rating Cell -->
              <td class="rating-cell">
                <SampleRating :interaction="interaction" size="sm" />
              </td>
              
              <!-- Actions Cell -->
              <td class="actions-cell">
                <div class="actions-dropdown">
                  <button
                    type="button"
                    class="actions-trigger"
                    @click="toggleActionsMenu(interaction.id)"
                    :aria-label="`Actions for ${interaction.subject}`"
                    :aria-expanded="activeActionsMenu === interaction.id"
                  >
                    <EllipsisVerticalIcon class="h-5 w-5" />
                  </button>
                  
                  <!-- Actions Menu -->
                  <div
                    v-if="activeActionsMenu === interaction.id"
                    class="actions-menu"
                    @click.stop
                  >
                    <button
                      type="button"
                      class="action-item"
                      @click="handleEdit(interaction)"
                    >
                      <PencilIcon class="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      v-if="interaction.follow_up_needed"
                      type="button"
                      class="action-item"
                      @click="handleFollowUp(interaction)"
                    >
                      <CheckCircleIcon class="h-4 w-4" />
                      Complete Follow-up
                    </button>
                    <button
                      type="button"
                      class="action-item"
                      @click="handleCreateFollowUp(interaction)"
                    >
                      <PlusIcon class="h-4 w-4" />
                      Create Follow-up
                    </button>
                    <button
                      type="button"
                      class="action-item"
                      @click="handleDuplicate(interaction)"
                    >
                      <DocumentDuplicateIcon class="h-4 w-4" />
                      Duplicate
                    </button>
                    <div class="action-divider" />
                    <button
                      type="button"
                      class="action-item action-item-danger"
                      @click="handleDelete(interaction)"
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
    <div v-if="interactions.length > 0" class="pagination-container">
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
import { useInteractionStore } from '@/stores/interactionStore'
import InteractionTypeBadge from './InteractionTypeBadge.vue'
import PriorityBadge from './PriorityBadge.vue'
import SampleRating from './SampleRating.vue'
import type { InteractionListView } from '@/types/interactions'

// Icons
import {
  TrashIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  DocumentArrowDownIcon,
  EllipsisVerticalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon
} from '@heroicons/vue/24/outline'

/**
 * Props interface for InteractionTable component
 */
interface Props {
  /** Override interactions data */
  customInteractions?: InteractionListView[]
  /** Whether to show pagination */
  showPagination?: boolean
  /** Items per page */
  itemsPerPage?: number
  /** Whether table is in compact mode */
  compact?: boolean
  /** Principal filter for security context */
  principalId?: string
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
  rowClick: [interaction: InteractionListView]
  /** Emitted when edit action is triggered */
  edit: [interaction: InteractionListView]
  /** Emitted when delete action is triggered */
  delete: [interaction: InteractionListView]
  /** Emitted when duplicate action is triggered */
  duplicate: [interaction: InteractionListView]
  /** Emitted when follow-up action is triggered */
  followUp: [interaction: InteractionListView]
  /** Emitted when create follow-up action is triggered */
  createFollowUp: [interaction: InteractionListView]
  /** Emitted when bulk delete is triggered */
  bulkDelete: [interactionIds: string[]]
  /** Emitted when export is triggered */
  export: [interactions: InteractionListView[]]
  /** Emitted when create new is triggered */
  createNew: []
  /** Emitted when sort changes */
  sortChange: [column: string, order: 'asc' | 'desc']
}>()

// ===============================
// STORE INTEGRATION
// ===============================

const interactionStore = useInteractionStore()

const interactions = computed(() => 
  props.customInteractions || interactionStore.interactions
)
const isLoading = computed(() => interactionStore.isLoading)
const isDeleting = computed(() => interactionStore.deleting)
const totalCount = computed(() => interactionStore.totalCount)
const currentPage = computed(() => interactionStore.currentPage)
const hasNextPage = computed(() => interactionStore.hasNextPage)
const hasPreviousPage = computed(() => interactionStore.hasPreviousPage)

// ===============================
// LOCAL STATE
// ===============================

const selectedItems = ref<string[]>([])
const activeActionsMenu = ref<string | null>(null)
const currentSort = ref<string>('date')
const currentOrder = ref<'asc' | 'desc'>('desc')

// ===============================
// COMPUTED PROPERTIES
// ===============================

const isAllSelected = computed(() => {
  return interactions.value.length > 0 && 
         selectedItems.value.length === interactions.value.length
})

const isPartiallySelected = computed(() => {
  return selectedItems.value.length > 0 && 
         selectedItems.value.length < interactions.value.length
})

const startIndex = computed(() => {
  if (interactions.value.length === 0) return 0
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
    selectedItems.value = interactions.value.map(interaction => interaction.id)
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
  interactionStore.activePagination.sort_by = column
  interactionStore.activePagination.sort_order = currentOrder.value
  
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
    interactionStore.activePagination.page = currentPage.value - 1
    await refresh()
  }
}

const handleNextPage = async (): Promise<void> => {
  if (hasNextPage.value) {
    interactionStore.activePagination.page = currentPage.value + 1
    await refresh()
  }
}

/**
 * Refresh data
 */
const refresh = async (): Promise<void> => {
  // Apply principal filter if provided
  const filters = { ...interactionStore.activeFilters }
  if (props.principalId) {
    filters.principal_id = props.principalId
  }
  
  await interactionStore.fetchInteractions(
    filters,
    interactionStore.activePagination
  )
}

/**
 * Handle actions
 */
const handleEdit = (interaction: InteractionListView): void => {
  activeActionsMenu.value = null
  emit('edit', interaction)
}

const handleDelete = (interaction: InteractionListView): void => {
  activeActionsMenu.value = null
  emit('delete', interaction)
}

const handleDuplicate = (interaction: InteractionListView): void => {
  activeActionsMenu.value = null
  emit('duplicate', interaction)
}

const handleFollowUp = (interaction: InteractionListView): void => {
  activeActionsMenu.value = null
  emit('followUp', interaction)
}

const handleCreateFollowUp = (interaction: InteractionListView): void => {
  activeActionsMenu.value = null
  emit('createFollowUp', interaction)
}

const handleBulkDelete = (): void => {
  if (selectedItems.value.length > 0) {
    emit('bulkDelete', selectedItems.value)
    selectedItems.value = []
  }
}

const exportSelected = (): void => {
  const selectedInteractions = interactions.value.filter(interaction => 
    selectedItems.value.includes(interaction.id)
  )
  emit('export', selectedInteractions)
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
 * Get days ago text for display
 */
const getDaysAgoText = (days: number): string => {
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

/**
 * Get follow-up indicator CSS class
 */
const getFollowUpIndicatorClass = (interaction: InteractionListView): string => {
  if (interaction.is_overdue_follow_up) {
    return 'text-red-500'
  }
  if (interaction.days_to_follow_up !== null && interaction.days_to_follow_up <= 3) {
    return 'text-orange-500'
  }
  return 'text-blue-500'
}

/**
 * Format account manager name
 */
const formatAccountManager = (email: string): string => {
  if (email.includes('@')) {
    return email.split('@')[0].replace(/[._]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
  return email
}

/**
 * Format stage name
 */
const formatStage = (stage: string): string => {
  return stage.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
}

/**
 * Get principal name from interaction
 */
const getPrincipalName = (interaction: InteractionListView): string => {
  // This would be derived from opportunity or contact principal relationship
  // For now, showing placeholder - would need to extend the interaction data structure
  if (interaction.opportunity_name) {
    return 'Principal from Opp'
  }
  if (interaction.contact_name) {
    return 'Principal from Contact'
  }
  return 'Unknown'
}

/**
 * Get operator name from interaction
 */
const getOperatorName = (interaction: InteractionListView): string => {
  // This would map interaction type to operational category
  const operatorMap = {
    'EMAIL': 'Email Operations',
    'CALL': 'Phone Operations',
    'IN_PERSON': 'Field Operations',
    'DEMO': 'Sales Operations',
    'FOLLOW_UP': 'Follow-up Operations'
  }
  return operatorMap[interaction.interaction_type] || 'General Operations'
}

/**
 * Truncate notes for table display
 */
const truncateNotes = (notes: string): string => {
  if (notes.length <= 100) return notes
  return notes.substring(0, 100) + '...'
}

/**
 * Show notes modal (placeholder for now)
 */
const showNotesModal = (interaction: InteractionListView): void => {
  // This would open a modal with full notes
  console.log('Show notes modal for:', interaction.id)
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

.interaction-table-container {
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

.action-btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700;
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

.interaction-table {
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

.priority-column {
  @apply w-20;
}

.notes-column {
  @apply min-w-[200px] max-w-[250px];
}

.rating-column {
  @apply w-24;
}

.sortable-column {
  @apply cursor-pointer hover:bg-gray-100 transition-colors duration-150;
}

.non-sortable-column {
  /* No special styling needed for non-sortable columns */
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

.row-overdue {
  @apply bg-red-50 border-l-4 border-red-400;
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

.priority-cell {
  @apply w-20;
}

.type-cell {
  @apply min-w-[100px];
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

.days-ago-text {
  @apply text-xs text-gray-500 block;
}

.subject-cell {
  @apply min-w-[200px] max-w-[300px];
}

.subject-button {
  @apply flex items-center space-x-2 text-left hover:text-blue-600 transition-colors duration-150;
}

.subject-text {
  @apply font-medium text-gray-900 truncate;
}

.follow-up-indicator {
  @apply flex-shrink-0;
}

.manager-cell {
  @apply min-w-[120px];
}

.manager-info {
  /* Base styling for manager info */
}

.manager-name {
  @apply text-sm text-gray-900;
}

.no-manager {
  @apply text-sm text-gray-400;
}

.opportunity-cell {
  @apply min-w-[150px] max-w-[200px];
}

.opportunity-info {
  @apply space-y-1;
}

.opportunity-name {
  @apply text-sm font-medium text-gray-900 truncate block;
}

.opportunity-stage {
  @apply text-xs text-gray-500 truncate block;
}

.no-opportunity {
  @apply text-sm text-gray-400;
}

.contact-cell {
  @apply min-w-[120px] max-w-[180px];
}

.contact-info {
  @apply space-y-1;
}

.contact-name {
  @apply text-sm font-medium text-gray-900 truncate block;
}

.contact-position {
  @apply text-xs text-gray-500 truncate block;
}

.no-contact {
  @apply text-sm text-gray-400;
}

.principal-cell {
  @apply min-w-[100px] max-w-[150px];
}

.principal-info {
  /* Base styling for principal info */
}

.principal-name {
  @apply text-sm text-gray-900 truncate;
}

.operator-cell {
  @apply min-w-[120px] max-w-[150px];
}

.operator-info {
  /* Base styling for operator info */
}

.operator-name {
  @apply text-sm text-gray-700 truncate;
}

.notes-cell {
  @apply min-w-[200px] max-w-[250px];
}

.notes-content {
  @apply space-y-1;
}

.notes-text {
  @apply text-sm text-gray-700 block;
}

.notes-expand-btn {
  @apply text-xs text-blue-600 hover:text-blue-800 underline;
}

.no-notes {
  @apply text-sm text-gray-400;
}

.rating-cell {
  @apply w-24 text-center;
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
  .interaction-table-container {
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
  
  .interaction-table {
    @apply min-w-[1200px];
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
  .interaction-table-container {
    @apply border-2 border-gray-600;
  }
  
  .table-row:hover {
    @apply bg-gray-200;
  }
  
  .row-selected {
    @apply bg-blue-200;
  }
  
  .row-overdue {
    @apply bg-red-200;
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