<!--
  Bulk Follow-up Modal Component
  Handles bulk follow-up completion and scheduling
  Supports marking follow-ups as complete or scheduling new ones
-->

<template>
  <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">
          {{ actionType === 'complete' ? 'Complete Follow-ups' : 'Schedule Follow-ups' }}
        </h3>
        <button
          type="button"
          class="modal-close-btn"
          @click="closeModal"
        >
          <XMarkIcon class="h-6 w-6" />
        </button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <!-- Action Type Selection -->
          <div v-if="actionType === 'complete'" class="form-group">
            <label class="form-label">Follow-up Action</label>
            <div class="radio-group">
              <label class="radio-option">
                <input
                  type="radio"
                  name="completion-type"
                  value="complete"
                  v-model="followUpData.completionType"
                  class="radio-input"
                />
                <span class="radio-label">
                  <CheckCircleIcon class="h-5 w-5 text-green-500" />
                  <div>
                    <span class="radio-title">Mark as Complete</span>
                    <span class="radio-description">Follow-up has been completed</span>
                  </div>
                </span>
              </label>
              
              <label class="radio-option">
                <input
                  type="radio"
                  name="completion-type"
                  value="complete-and-schedule"
                  v-model="followUpData.completionType"
                  class="radio-input"
                />
                <span class="radio-label">
                  <CalendarIcon class="h-5 w-5 text-blue-500" />
                  <div>
                    <span class="radio-title">Complete and Schedule New</span>
                    <span class="radio-description">Mark complete and create new follow-up</span>
                  </div>
                </span>
              </label>
            </div>
          </div>

          <!-- Follow-up Date (for scheduling or new follow-up) -->
          <div 
            v-if="actionType === 'schedule' || followUpData.completionType === 'complete-and-schedule'"
            class="form-group"
          >
            <label for="followup-date" class="form-label">
              {{ actionType === 'schedule' ? 'Follow-up Date' : 'New Follow-up Date' }}
            </label>
            <input
              id="followup-date"
              type="date"
              class="form-input"
              v-model="followUpData.date"
              :min="minDate"
              required
            />
            <p class="form-help">Select when the follow-up should be scheduled</p>
          </div>

          <!-- Notes -->
          <div class="form-group">
            <label for="followup-notes" class="form-label">
              {{ actionType === 'complete' ? 'Completion Notes' : 'Follow-up Notes' }}
            </label>
            <textarea
              id="followup-notes"
              class="form-textarea"
              rows="3"
              v-model="followUpData.notes"
              :placeholder="actionType === 'complete' 
                ? 'Add notes about the completed follow-up...'
                : 'Add notes for the scheduled follow-up...'"
            ></textarea>
          </div>

          <!-- Create New Interaction Option (for completion) -->
          <div v-if="actionType === 'complete'" class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                class="checkbox-input"
                v-model="followUpData.createNewInteraction"
              />
              <span class="checkbox-text">Create new interaction for completed follow-up</span>
            </label>
            <p class="form-help">This will create a new interaction record documenting the follow-up completion</p>
          </div>

          <!-- Affected Interactions Summary -->
          <div class="affected-summary">
            <h4 class="summary-title">Affected Interactions</h4>
            <div class="summary-content">
              <div class="summary-item">
                <span class="summary-label">Total interactions:</span>
                <span class="summary-value">{{ interactionIds.length }}</span>
              </div>
              <div v-if="actionType === 'complete'" class="summary-item">
                <span class="summary-label">With pending follow-ups:</span>
                <span class="summary-value">{{ pendingFollowUpsCount }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Action:</span>
                <span class="summary-value">
                  {{ actionType === 'complete' ? 'Mark follow-ups complete' : 'Schedule new follow-ups' }}
                </span>
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
          @click="handleSubmit"
          :disabled="!canSubmit"
        >
          <component :is="actionIcon" class="h-4 w-4" />
          {{ actionType === 'complete' ? 'Complete Follow-ups' : 'Schedule Follow-ups' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  XMarkIcon,
  CheckCircleIcon,
  CalendarIcon
} from '@heroicons/vue/24/outline'

interface Props {
  /** Whether modal is visible */
  visible: boolean
  /** Array of interaction IDs */
  interactionIds: string[]
  /** Type of follow-up action */
  actionType: 'complete' | 'schedule'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** Close modal */
  close: []
  /** Process follow-up action */
  process: [data: {
    action: 'complete' | 'schedule'
    date?: string
    notes?: string
    createNewInteraction?: boolean
    completionType?: string
  }]
}>()

// Form data
const followUpData = ref({
  date: '',
  notes: '',
  createNewInteraction: false,
  completionType: 'complete'
})

// Computed properties
const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

const canSubmit = computed(() => {
  if (props.actionType === 'schedule') {
    return followUpData.value.date !== ''
  } else {
    // For completion, always valid
    return true
  }
})

const actionIcon = computed(() => {
  return props.actionType === 'complete' ? CheckCircleIcon : CalendarIcon
})

const pendingFollowUpsCount = computed(() => {
  // This would normally be calculated from the actual interactions
  // For now, we'll estimate based on the selection
  return Math.floor(props.interactionIds.length * 0.7) // Assume 70% have pending follow-ups
})

// Methods
const closeModal = (): void => {
  emit('close')
}

const handleOverlayClick = (): void => {
  closeModal()
}

const handleSubmit = (): void => {
  if (!canSubmit.value) return
  
  emit('process', {
    action: props.actionType,
    date: followUpData.value.date || undefined,
    notes: followUpData.value.notes || undefined,
    createNewInteraction: followUpData.value.createNewInteraction,
    completionType: followUpData.value.completionType
  })
}

// Initialize form data
const initializeForm = (): void => {
  // Set default date to tomorrow for scheduling
  if (props.actionType === 'schedule') {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    followUpData.value.date = tomorrow.toISOString().split('T')[0]
  }
}

initializeForm()
</script>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4;
}

.modal-container {
  @apply bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden;
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
  @apply block text-sm font-medium text-gray-700 mb-2;
}

.form-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md;
  @apply focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
  @apply text-sm;
}

.form-textarea {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md;
  @apply focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
  @apply text-sm resize-none;
}

.form-help {
  @apply mt-1 text-xs text-gray-500;
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

/* Checkbox */
.checkbox-label {
  @apply flex items-start space-x-3 cursor-pointer;
}

.checkbox-input {
  @apply h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5;
}

.checkbox-text {
  @apply text-sm text-gray-700;
}

/* Affected Summary */
.affected-summary {
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
  
  .radio-label {
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