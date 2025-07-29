<template>
  <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <!-- Backdrop -->
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="$emit('close')"></div>

      <!-- Modal Panel -->
      <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full sm:p-6">
        <div>
          <!-- Modal Header -->
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900" id="modal-title">
              Add New Position
            </h3>
            <button
              @click="$emit('close')"
              class="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
            >
              <XMarkIcon class="h-6 w-6" />
            </button>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <BaseInputField
                v-model="newPosition"
                name="position"
                label="Position Title"
                required
                :error="error"
                placeholder="e.g., F&B Director, Kitchen Manager"
                @blur="validatePosition"
              />
              
              <p class="mt-1 text-xs text-gray-500">
                Examples: F&B Director, Kitchen Manager, Food Service Director, Assistant Manager
              </p>
            </div>

            <!-- Action Buttons -->
            <div class="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                @click="$emit('close')"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="!isFormValid"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Position
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import BaseInputField from './BaseInputField.vue'

// Emits
const emit = defineEmits<{
  close: []
  added: [position: string]
}>()

// Reactive state
const newPosition = ref('')
const error = ref('')

// Computed properties
const isFormValid = computed(() => {
  return newPosition.value.trim() && !error.value
})

// Validation
const validatePosition = () => {
  const value = newPosition.value.trim()
  
  if (!value) {
    error.value = 'Position title is required'
  } else if (value.length > 100) {
    error.value = 'Position title must be less than 100 characters'
  } else {
    error.value = ''
  }
}

// Form submission
const handleSubmit = () => {
  validatePosition()
  
  if (isFormValid.value) {
    // Format the position title with proper capitalization
    const formatted = newPosition.value
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
    
    emit('added', formatted)
  }
}
</script>