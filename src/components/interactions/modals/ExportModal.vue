<!--
  Export Modal Component
  Configurable export options for interaction data
  Supports CSV and Excel formats with customizable fields
-->

<template>
  <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">Export Interactions</h3>
        <button
          type="button"
          class="modal-close-btn"
          @click="closeModal"
        >
          <XMarkIcon class="h-6 w-6" />
        </button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="handleExport">
          <!-- Export Format -->
          <div class="form-group">
            <label class="form-label">Export Format</label>
            <div class="radio-group">
              <label class="radio-option">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  v-model="exportConfig.format"
                  class="radio-input"
                />
                <span class="radio-label">
                  <DocumentTextIcon class="h-5 w-5 text-gray-400" />
                  <div>
                    <span class="radio-title">CSV</span>
                    <span class="radio-description">Comma-separated values file</span>
                  </div>
                </span>
              </label>
              
              <label class="radio-option">
                <input
                  type="radio"
                  name="format"
                  value="excel"
                  v-model="exportConfig.format"
                  class="radio-input"
                />
                <span class="radio-label">
                  <TableCellsIcon class="h-5 w-5 text-gray-400" />
                  <div>
                    <span class="radio-title">Excel</span>
                    <span class="radio-description">Microsoft Excel spreadsheet</span>
                  </div>
                </span>
              </label>
            </div>
          </div>

          <!-- Export Options -->
          <div class="form-group">
            <label class="form-label">Include Data</label>
            <div class="checkbox-group">
              <label class="checkbox-option">
                <input
                  type="checkbox"
                  v-model="exportConfig.includeBasicInfo"
                  class="checkbox-input"
                />
                <span class="checkbox-label">Basic Information</span>
                <span class="checkbox-description">Type, date, subject, priority</span>
              </label>
              
              <label class="checkbox-option">
                <input
                  type="checkbox"
                  v-model="exportConfig.includeNotes"
                  class="checkbox-input"
                />
                <span class="checkbox-label">Notes</span>
                <span class="checkbox-description">Interaction notes and details</span>
              </label>
              
              <label class="checkbox-option">
                <input
                  type="checkbox"
                  v-model="exportConfig.includeContactInfo"
                  class="checkbox-input"
                />
                <span class="checkbox-label">Contact Information</span>
                <span class="checkbox-description">Contact names, positions, organizations</span>
              </label>
              
              <label class="checkbox-option">
                <input
                  type="checkbox"
                  v-model="exportConfig.includeOpportunityInfo"
                  class="checkbox-input"
                />
                <span class="checkbox-label">Opportunity Information</span>
                <span class="checkbox-description">Opportunity names, stages, contexts</span>
              </label>
              
              <label class="checkbox-option">
                <input
                  type="checkbox"
                  v-model="exportConfig.includeFollowUpInfo"
                  class="checkbox-input"
                />
                <span class="checkbox-label">Follow-up Information</span>
                <span class="checkbox-description">Follow-up dates and status</span>
              </label>
            </div>
          </div>

          <!-- Export Summary -->
          <div class="export-summary">
            <h4 class="summary-title">Export Summary</h4>
            <div class="summary-content">
              <div class="summary-item">
                <span class="summary-label">Interactions:</span>
                <span class="summary-value">{{ interactionIds.length }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Format:</span>
                <span class="summary-value">{{ exportConfig.format.toUpperCase() }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Estimated size:</span>
                <span class="summary-value">{{ estimatedFileSize }}</span>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div class="modal-footer">
        <button
          type="button"
          class="btn btn-secondary"
          @click="closeModal"
        >
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-primary"
          @click="handleExport"
          :disabled="!canExport"
        >
          <DocumentArrowDownIcon class="h-4 w-4" />
          Export
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  XMarkIcon,
  DocumentTextIcon,
  TableCellsIcon,
  DocumentArrowDownIcon
} from '@heroicons/vue/24/outline'

interface Props {
  /** Whether modal is visible */
  visible: boolean
  /** Array of interaction IDs to export */
  interactionIds: string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** Close modal */
  close: []
  /** Export with configuration */
  export: [config: {
    format: 'csv' | 'excel'
    includeBasicInfo: boolean
    includeNotes: boolean
    includeContactInfo: boolean
    includeOpportunityInfo: boolean
    includeFollowUpInfo: boolean
  }]
}>()

// Export configuration
const exportConfig = ref({
  format: 'csv' as 'csv' | 'excel',
  includeBasicInfo: true,
  includeNotes: true,
  includeContactInfo: true,
  includeOpportunityInfo: true,
  includeFollowUpInfo: true
})

// Computed properties
const canExport = computed(() => {
  return props.interactionIds.length > 0 && (
    exportConfig.value.includeBasicInfo ||
    exportConfig.value.includeNotes ||
    exportConfig.value.includeContactInfo ||
    exportConfig.value.includeOpportunityInfo ||
    exportConfig.value.includeFollowUpInfo
  )
})

const estimatedFileSize = computed(() => {
  // Rough estimation based on selected fields and number of interactions
  let fieldCount = 0
  if (exportConfig.value.includeBasicInfo) fieldCount += 4
  if (exportConfig.value.includeNotes) fieldCount += 1
  if (exportConfig.value.includeContactInfo) fieldCount += 3
  if (exportConfig.value.includeOpportunityInfo) fieldCount += 3
  if (exportConfig.value.includeFollowUpInfo) fieldCount += 2
  
  const estimatedBytes = props.interactionIds.length * fieldCount * 50 // rough estimate
  
  if (estimatedBytes < 1024) return `${estimatedBytes} B`
  if (estimatedBytes < 1024 * 1024) return `${(estimatedBytes / 1024).toFixed(1)} KB`
  return `${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`
})

// Methods
const closeModal = (): void => {
  emit('close')
}

const handleOverlayClick = (): void => {
  closeModal()
}

const handleExport = (): void => {
  if (!canExport.value) return
  
  emit('export', {
    format: exportConfig.value.format,
    includeBasicInfo: exportConfig.value.includeBasicInfo,
    includeNotes: exportConfig.value.includeNotes,
    includeContactInfo: exportConfig.value.includeContactInfo,
    includeOpportunityInfo: exportConfig.value.includeOpportunityInfo,
    includeFollowUpInfo: exportConfig.value.includeFollowUpInfo
  })
}
</script>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4;
}

.modal-container {
  @apply bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden;
}

.modal-header {
  @apply flex items-center justify-between p-6 border-b border-gray-200;
}

.modal-title {
  @apply text-lg font-semibold text-gray-900;
}

.modal-close-btn {
  @apply text-gray-400 hover:text-gray-600;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded;
}

.modal-body {
  @apply p-6 overflow-y-auto max-h-[60vh];
}

.modal-footer {
  @apply flex items-center justify-end space-x-3 p-6 border-t border-gray-200;
}

/* Form Elements */
.form-group {
  @apply mb-6;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 mb-3;
}

/* Radio Group */
.radio-group {
  @apply space-y-3;
}

.radio-option {
  @apply block cursor-pointer;
}

.radio-input {
  @apply sr-only;
}

.radio-label {
  @apply flex items-start space-x-3 p-3 border border-gray-200 rounded-lg;
  @apply hover:bg-gray-50 transition-colors duration-200;
}

.radio-input:checked + .radio-label {
  @apply border-blue-500 bg-blue-50;
}

.radio-title {
  @apply block text-sm font-medium text-gray-900;
}

.radio-description {
  @apply block text-xs text-gray-500 mt-1;
}

/* Checkbox Group */
.checkbox-group {
  @apply space-y-3;
}

.checkbox-option {
  @apply flex items-start space-x-3 p-3 border border-gray-200 rounded-lg;
  @apply hover:bg-gray-50 transition-colors duration-200 cursor-pointer;
}

.checkbox-input {
  @apply h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5;
}

.checkbox-label {
  @apply block text-sm font-medium text-gray-900;
}

.checkbox-description {
  @apply block text-xs text-gray-500 mt-1;
}

/* Export Summary */
.export-summary {
  @apply bg-gray-50 rounded-lg p-4 mt-6;
}

.summary-title {
  @apply text-sm font-medium text-gray-900 mb-3;
}

.summary-content {
  @apply space-y-2;
}

.summary-item {
  @apply flex justify-between items-center;
}

.summary-label {
  @apply text-sm text-gray-600;
}

.summary-value {
  @apply text-sm font-medium text-gray-900;
}

/* Buttons */
.btn {
  @apply inline-flex items-center space-x-1 px-4 py-2 text-sm font-medium rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  @apply transition-colors duration-200;
}

.btn-secondary {
  @apply text-gray-700 bg-white border border-gray-300 hover:bg-gray-50;
  @apply focus:ring-blue-500;
}

.btn-primary {
  @apply text-white bg-blue-600 hover:bg-blue-700;
  @apply focus:ring-blue-500;
}

/* Responsive Design */
@media (max-width: 640px) {
  .modal-container {
    @apply max-w-full m-4;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    @apply p-4;
  }
  
  .radio-label,
  .checkbox-option {
    @apply p-2;
  }
}

/* Accessibility Enhancements */
.radio-input:focus + .radio-label {
  @apply ring-2 ring-blue-500 ring-offset-2;
}

.checkbox-input:focus {
  @apply outline-none;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .modal-container {
    @apply border-2 border-gray-600;
  }
  
  .radio-input:checked + .radio-label {
    @apply border-2 border-blue-600;
  }
}
</style>