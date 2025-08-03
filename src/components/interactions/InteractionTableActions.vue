<!--
  Interaction Table Actions Component
  Bulk action management for interaction table
  Following OpportunityTable architecture patterns
-->

<template>
  <div class="table-actions-container">
    <!-- Bulk Actions Bar (shown when items selected) -->
    <div v-if="selectedItems.length > 0" class="bulk-actions-bar">
      <div class="selection-info">
        <span class="selection-count">
          {{ selectedItems.length }} interaction{{ selectedItems.length === 1 ? '' : 's' }} selected
        </span>
        <button
          type="button"
          class="clear-selection-btn"
          @click="clearSelection"
        >
          Clear selection
        </button>
      </div>
      
      <div class="bulk-action-buttons">
        <!-- Bulk Follow-up Actions -->
        <div class="action-group">
          <button
            type="button"
            class="bulk-action-btn bulk-action-btn-primary"
            @click="handleBulkFollowUp"
            :disabled="isProcessing"
          >
            <CalendarIcon class="action-icon" />
            Schedule Follow-up
          </button>
          
          <button
            type="button"
            class="bulk-action-btn bulk-action-btn-secondary"
            @click="handleBulkCompleteFollowUp"
            :disabled="isProcessing"
          >
            <CheckCircleIcon class="action-icon" />
            Complete Follow-up
          </button>
        </div>
        
        <!-- Bulk Status Actions -->
        <div class="action-group">
          <div class="dropdown-container">
            <button
              type="button"
              class="dropdown-trigger bulk-action-btn bulk-action-btn-secondary"
              @click="togglePriorityDropdown"
              :disabled="isProcessing"
            >
              <ExclamationTriangleIcon class="action-icon" />
              Set Priority
              <ChevronDownIcon class="dropdown-icon" />
            </button>
            
            <div v-if="showPriorityDropdown" class="dropdown-menu">
              <button
                v-for="priority in priorityLevels"
                :key="priority"
                type="button"
                class="dropdown-item"
                @click="handleBulkPriorityUpdate(priority)"
              >
                <PriorityBadge :priority="priority" size="xs" />
              </button>
            </div>
          </div>
        </div>
        
        <!-- Export Actions -->
        <div class="action-group">
          <button
            type="button"
            class="bulk-action-btn bulk-action-btn-secondary"
            @click="handleBulkExport"
            :disabled="isProcessing"
          >
            <DocumentArrowDownIcon class="action-icon" />
            Export
          </button>
        </div>
        
        <!-- Danger Actions -->
        <div class="action-group danger-group">
          <button
            type="button"
            class="bulk-action-btn bulk-action-btn-danger"
            @click="handleBulkDelete"
            :disabled="isProcessing"
          >
            <TrashIcon class="action-icon" />
            Delete
          </button>
        </div>
      </div>
    </div>
    
    <!-- Regular Table Actions -->
    <div v-else class="regular-actions">
      <div class="action-group">
        <button
          type="button"
          class="action-btn action-btn-secondary"
          @click="handleRefresh"
          :disabled="isLoading"
        >
          <ArrowPathIcon 
            class="action-icon" 
            :class="{ 'animate-spin': isLoading }"
          />
          Refresh
        </button>
        
        <button
          type="button"
          class="action-btn action-btn-secondary"
          @click="handleExportAll"
          :disabled="isLoading"
        >
          <DocumentArrowDownIcon class="action-icon" />
          Export All
        </button>
      </div>
      
      <div class="action-group">
        <button
          type="button"
          class="action-btn action-btn-primary"
          @click="handleCreateNew"
        >
          <PlusIcon class="action-icon" />
          New Interaction
        </button>
      </div>
    </div>
    
    <!-- Processing Indicator -->
    <div v-if="isProcessing" class="processing-indicator">
      <div class="processing-spinner">
        <svg class="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
      <span class="processing-text">{{ processingMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import PriorityBadge from './PriorityBadge.vue'
import {
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  DocumentArrowDownIcon,
  TrashIcon,
  ArrowPathIcon,
  PlusIcon
} from '@heroicons/vue/24/outline'

interface Props {
  /** Array of selected interaction IDs */
  selectedItems: string[]
  /** Whether operations are in progress */
  isLoading?: boolean
  /** Total count of interactions */
  totalCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  totalCount: 0
})

const emit = defineEmits<{
  /** Clear selection */
  clearSelection: []
  /** Refresh data */
  refresh: []
  /** Create new interaction */
  createNew: []
  /** Export all interactions */
  exportAll: []
  /** Export selected interactions */
  exportSelected: [interactionIds: string[]]
  /** Bulk delete interactions */
  bulkDelete: [interactionIds: string[]]
  /** Bulk follow-up scheduling */
  bulkFollowUp: [interactionIds: string[]]
  /** Bulk follow-up completion */
  bulkCompleteFollowUp: [interactionIds: string[]]
  /** Bulk priority update */
  bulkPriorityUpdate: [interactionIds: string[], priority: string]
}>()

// Local state
const isProcessing = ref(false)
const processingMessage = ref('')
const showPriorityDropdown = ref(false)

// Constants
const priorityLevels: ('High' | 'Medium' | 'Low')[] = ['High', 'Medium', 'Low']

// Methods
const clearSelection = (): void => {
  emit('clearSelection')
}

const handleRefresh = (): void => {
  emit('refresh')
}

const handleCreateNew = (): void => {
  emit('createNew')
}

const handleExportAll = (): void => {
  emit('exportAll')
}

const handleBulkExport = (): void => {
  emit('exportSelected', props.selectedItems)
}

const handleBulkDelete = async (): Promise<void> => {
  if (props.selectedItems.length === 0) return
  
  const confirmed = confirm(
    `Are you sure you want to delete ${props.selectedItems.length} interaction${props.selectedItems.length === 1 ? '' : 's'}? This action cannot be undone.`
  )
  
  if (confirmed) {
    isProcessing.value = true
    processingMessage.value = 'Deleting interactions...'
    
    try {
      emit('bulkDelete', props.selectedItems)
    } finally {
      isProcessing.value = false
      processingMessage.value = ''
    }
  }
}

const handleBulkFollowUp = (): void => {
  if (props.selectedItems.length === 0) return
  
  isProcessing.value = true
  processingMessage.value = 'Scheduling follow-ups...'
  
  try {
    emit('bulkFollowUp', props.selectedItems)
  } finally {
    isProcessing.value = false
    processingMessage.value = ''
  }
}

const handleBulkCompleteFollowUp = (): void => {
  if (props.selectedItems.length === 0) return
  
  isProcessing.value = true
  processingMessage.value = 'Completing follow-ups...'
  
  try {
    emit('bulkCompleteFollowUp', props.selectedItems)
  } finally {
    isProcessing.value = false
    processingMessage.value = ''
  }
}

const togglePriorityDropdown = (): void => {
  showPriorityDropdown.value = !showPriorityDropdown.value
}

const handleBulkPriorityUpdate = (priority: 'High' | 'Medium' | 'Low'): void => {
  if (props.selectedItems.length === 0) return
  
  showPriorityDropdown.value = false
  isProcessing.value = true
  processingMessage.value = `Setting priority to ${priority}...`
  
  try {
    emit('bulkPriorityUpdate', props.selectedItems, priority)
  } finally {
    isProcessing.value = false
    processingMessage.value = ''
  }
}

// Close dropdown when clicking outside
const handleClickOutside = (event: Event): void => {
  const target = event.target as Element
  if (!target.closest('.dropdown-container')) {
    showPriorityDropdown.value = false
  }
}

// Add event listener for clicks outside dropdown
if (typeof document !== 'undefined') {
  document.addEventListener('click', handleClickOutside)
}
</script>

<style scoped>
/* Container */
.table-actions-container {
  @apply relative;
}

/* Bulk Actions Bar */
.bulk-actions-bar {
  @apply flex items-center justify-between p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg;
  @apply shadow-sm mb-4;
}

.selection-info {
  @apply flex items-center space-x-3;
}

.selection-count {
  @apply text-sm font-medium text-blue-800;
}

.clear-selection-btn {
  @apply text-sm text-blue-600 hover:text-blue-800 underline;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded;
}

/* Regular Actions */
.regular-actions {
  @apply flex items-center justify-between p-4;
}

/* Action Groups */
.action-group {
  @apply flex items-center space-x-2;
}

.danger-group {
  @apply border-l border-gray-200 pl-2 ml-2;
}

.bulk-action-buttons {
  @apply flex items-center space-x-4;
}

/* Button Styles */
.action-btn,
.bulk-action-btn {
  @apply inline-flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  @apply transition-colors duration-200;
}

.action-btn-primary,
.bulk-action-btn-primary {
  @apply text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500;
}

.action-btn-secondary,
.bulk-action-btn-secondary {
  @apply text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-blue-500;
}

.bulk-action-btn-danger {
  @apply text-white bg-red-600 hover:bg-red-700 focus:ring-red-500;
}

/* Icon Styles */
.action-icon {
  @apply h-4 w-4 flex-shrink-0;
}

/* Dropdown Styles */
.dropdown-container {
  @apply relative;
}

.dropdown-trigger {
  @apply relative;
}

.dropdown-icon {
  @apply h-4 w-4 ml-1;
}

.dropdown-menu {
  @apply absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200;
  @apply z-10 py-1;
}

.dropdown-item {
  @apply flex items-center w-full px-4 py-2 text-sm text-gray-700;
  @apply hover:bg-gray-100 transition-colors duration-150;
}

/* Processing Indicator */
.processing-indicator {
  @apply flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-md;
}

.processing-spinner {
  @apply flex-shrink-0;
}

.processing-text {
  @apply text-sm text-blue-700;
}

/* Responsive Design */
@media (max-width: 768px) {
  .bulk-actions-bar {
    @apply flex-col space-y-3 items-stretch;
  }
  
  .selection-info {
    @apply justify-between;
  }
  
  .bulk-action-buttons {
    @apply flex-wrap gap-2;
  }
  
  .regular-actions {
    @apply flex-col space-y-3 items-stretch;
  }
  
  .action-group {
    @apply justify-center;
  }
  
  .danger-group {
    @apply border-l-0 border-t pt-2 mt-2 pl-0 ml-0;
  }
}

@media (max-width: 480px) {
  .bulk-action-buttons {
    @apply grid grid-cols-1 gap-2;
  }
  
  .action-btn,
  .bulk-action-btn {
    @apply w-full justify-center;
  }
}

/* Accessibility Enhancements */
.dropdown-trigger:focus {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2;
}

.dropdown-item:focus {
  @apply outline-none bg-gray-100;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .bulk-actions-bar {
    @apply border-l-4 border-blue-600;
  }
  
  .dropdown-menu {
    @apply border-2 border-gray-600;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .action-btn,
  .bulk-action-btn,
  .dropdown-item {
    transition: none;
  }
  
  .processing-spinner svg {
    animation: none;
  }
}

/* Loading state styles */
.action-btn:disabled,
.bulk-action-btn:disabled {
  @apply cursor-not-allowed opacity-50;
}

/* Focus management */
.action-btn:focus-visible,
.bulk-action-btn:focus-visible {
  @apply ring-2 ring-offset-2;
}

.action-btn-primary:focus-visible,
.bulk-action-btn-primary:focus-visible {
  @apply ring-blue-500;
}

.action-btn-secondary:focus-visible,
.bulk-action-btn-secondary:focus-visible {
  @apply ring-blue-500;
}

.bulk-action-btn-danger:focus-visible {
  @apply ring-red-500;
}
</style>