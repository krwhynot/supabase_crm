<!--
  Delete Confirmation Modal Component
  Confirms bulk deletion of interactions with safety warnings
  Provides clear information about what will be deleted
-->

<template>
  <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <div class="header-icon">
          <ExclamationTriangleIcon class="h-6 w-6 text-red-600" />
        </div>
        <div class="header-content">
          <h3 class="modal-title">Delete Interactions</h3>
          <p class="modal-subtitle">This action cannot be undone</p>
        </div>
        <button
          type="button"
          class="modal-close-btn"
          @click="closeModal"
        >
          <XMarkIcon class="h-6 w-6" />
        </button>
      </div>

      <div class="modal-body">
        <div class="warning-content">
          <div class="warning-message">
            <p class="warning-text">
              You are about to permanently delete 
              <strong>{{ interactionCount }} interaction{{ interactionCount === 1 ? '' : 's' }}</strong>.
              This will remove:
            </p>
            
            <ul class="warning-list">
              <li class="warning-item">
                <DocumentTextIcon class="h-4 w-4 text-gray-400" />
                All interaction details and notes
              </li>
              <li class="warning-item">
                <CalendarIcon class="h-4 w-4 text-gray-400" />
                Any scheduled follow-ups
              </li>
              <li class="warning-item">
                <ClockIcon class="h-4 w-4 text-gray-400" />
                Historical activity records
              </li>
              <li class="warning-item">
                <ChartBarIcon class="h-4 w-4 text-gray-400" />
                Related analytics data
              </li>
            </ul>
          </div>

          <div class="confirmation-section">
            <div class="confirmation-checkbox">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  class="checkbox-input"
                  v-model="confirmationChecked"
                />
                <span class="checkbox-text">
                  I understand that this action is permanent and cannot be undone
                </span>
              </label>
            </div>

            <div class="type-confirmation">
              <label for="confirmation-text" class="confirmation-label">
                Type <strong>DELETE</strong> to confirm:
              </label>
              <input
                id="confirmation-text"
                type="text"
                class="confirmation-input"
                v-model="confirmationText"
                placeholder="Type DELETE here"
                @input="handleConfirmationInput"
              />
            </div>
          </div>

          <div class="impact-summary">
            <h4 class="impact-title">Impact Summary</h4>
            <div class="impact-content">
              <div class="impact-item">
                <span class="impact-label">Interactions to delete:</span>
                <span class="impact-value">{{ interactionCount }}</span>
              </div>
              <div class="impact-item">
                <span class="impact-label">Estimated follow-ups affected:</span>
                <span class="impact-value">{{ estimatedFollowUps }}</span>
              </div>
              <div class="impact-item">
                <span class="impact-label">Data recovery:</span>
                <span class="impact-value impact-value-warning">Not possible</span>
              </div>
            </div>
          </div>
        </div>
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
          class="btn btn-danger"
          @click="handleConfirm"
          :disabled="!canConfirm"
        >
          <TrashIcon class="h-4 w-4" />
          Delete {{ interactionCount }} Interaction{{ interactionCount === 1 ? '' : 's' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon,
  ChartBarIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'

interface Props {
  /** Whether modal is visible */
  visible: boolean
  /** Number of interactions to delete */
  interactionCount: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** Close modal */
  close: []
  /** Confirm deletion */
  confirm: []
}>()

// Form state
const confirmationChecked = ref(false)
const confirmationText = ref('')

// Computed properties
const canConfirm = computed(() => {
  return confirmationChecked.value && confirmationText.value.toUpperCase() === 'DELETE'
})

const estimatedFollowUps = computed(() => {
  // Estimate that about 60% of interactions have follow-ups
  return Math.floor(props.interactionCount * 0.6)
})

// Methods
const closeModal = (): void => {
  // Reset form state
  confirmationChecked.value = false
  confirmationText.value = ''
  emit('close')
}

const handleOverlayClick = (): void => {
  closeModal()
}

const handleConfirm = (): void => {
  if (!canConfirm.value) return
  emit('confirm')
}

const handleConfirmationInput = (): void => {
  // Keep the text uppercase for easier comparison
  confirmationText.value = confirmationText.value.toUpperCase()
}
</script>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4;
}

.modal-container {
  @apply bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden;
}

.modal-header {
  @apply flex items-start space-x-4 p-6 border-b border-gray-200;
}

.header-icon {
  @apply flex-shrink-0;
}

.header-content {
  @apply flex-1 min-w-0;
}

.modal-title {
  @apply text-lg font-semibold text-gray-900;
}

.modal-subtitle {
  @apply text-sm text-gray-600 mt-1;
}

.modal-close-btn {
  @apply flex-shrink-0 text-gray-400 hover:text-gray-600;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded;
}

.modal-body {
  @apply p-6 overflow-y-auto max-h-[60vh];
}

.modal-footer {
  @apply flex items-center justify-end space-x-3 p-6 border-t border-gray-200;
}

/* Warning Content */
.warning-content {
  @apply space-y-6;
}

.warning-message {
  @apply space-y-4;
}

.warning-text {
  @apply text-sm text-gray-700;
}

.warning-list {
  @apply space-y-2;
}

.warning-item {
  @apply flex items-center space-x-2 text-sm text-gray-600;
}

/* Confirmation Section */
.confirmation-section {
  @apply space-y-4 bg-red-50 rounded-lg p-4 border border-red-200;
}

.confirmation-checkbox {
  @apply space-y-2;
}

.checkbox-label {
  @apply flex items-start space-x-3 cursor-pointer;
}

.checkbox-input {
  @apply h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500 mt-0.5;
}

.checkbox-text {
  @apply text-sm text-gray-700;
}

.type-confirmation {
  @apply space-y-2;
}

.confirmation-label {
  @apply block text-sm font-medium text-gray-700;
}

.confirmation-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md;
  @apply focus:ring-2 focus:ring-red-500 focus:border-red-500;
  @apply text-sm font-mono uppercase;
}

/* Impact Summary */
.impact-summary {
  @apply bg-gray-50 rounded-lg p-4;
}

.impact-title {
  @apply text-sm font-medium text-gray-900 mb-3;
}

.impact-content {
  @apply space-y-2;
}

.impact-item {
  @apply flex justify-between items-center;
}

.impact-label {
  @apply text-sm text-gray-600;
}

.impact-value {
  @apply text-sm font-medium text-gray-900;
}

.impact-value-warning {
  @apply text-red-600;
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

.btn-danger {
  @apply text-white bg-red-600 hover:bg-red-700;
  @apply focus:ring-red-500;
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
  
  .modal-header {
    @apply space-x-3;
  }
}

/* Accessibility Enhancements */
.checkbox-input:focus {
  @apply outline-none;
}

.confirmation-input:focus {
  @apply outline-none;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .modal-container {
    @apply border-2 border-gray-600;
  }
  
  .confirmation-section {
    @apply border-2 border-red-400;
  }
}

/* Animation */
.modal-overlay {
  animation: fadeIn 0.2s ease-out;
}

.modal-container {
  animation: slideIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .modal-overlay,
  .modal-container {
    animation: none;
  }
}
</style>