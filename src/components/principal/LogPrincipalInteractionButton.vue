<!--
  Log Principal Interaction Button - Quick interaction logging with principal context
  Features: Modal form, interaction types, rating system, follow-up scheduling
-->
<template>
  <div class="log-principal-interaction-button">
    <!-- Trigger Button -->
    <button
      @click="openModal"
      :disabled="!principal || logging"
      class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
    >
      <ChatBubbleLeftIcon class="h-4 w-4 mr-1" />
      {{ logging ? 'Logging...' : 'Log Interaction' }}
    </button>

    <!-- Modal -->
    <TransitionRoot as="template" :show="showModal">
      <Dialog as="div" class="relative z-50" @close="closeModal">
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-200"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </TransitionChild>

        <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild
              as="template"
              enter="ease-out duration-300"
              enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enter-to="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leave-from="opacity-100 translate-y-0 sm:scale-100"
              leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <!-- Modal Header -->
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900">
                      Log Interaction
                    </DialogTitle>
                    <p class="mt-1 text-sm text-gray-600">
                      Record an interaction with {{ principal?.principal_name }}
                    </p>
                  </div>
                  <button
                    @click="closeModal"
                    class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <XMarkIcon class="h-6 w-6" />
                  </button>
                </div>

                <!-- Error Display -->
                <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div class="flex">
                    <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
                    <div class="ml-3">
                      <p class="text-sm text-red-700">{{ error }}</p>
                    </div>
                  </div>
                </div>

                <!-- Interaction Form -->
                <form @submit.prevent="handleSubmit">
                  <div class="space-y-6">
                    <!-- Principal Context -->
                    <div class="bg-gray-50 p-4 rounded-lg">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                          <div class="flex-shrink-0">
                            <UserCircleIcon class="h-10 w-10 text-gray-400" />
                          </div>
                          <div>
                            <h4 class="text-sm font-medium text-gray-900">
                              {{ principal?.principal_name }}
                            </h4>
                            <p class="text-sm text-gray-600">
                              {{ principal?.organization_type || 'Organization' }}
                            </p>
                          </div>
                        </div>
                        <div class="text-right">
                          <EngagementScoreRing
                            :score="principal?.engagement_score || 0"
                            size="sm"
                          />
                          <p class="text-xs text-gray-500 mt-1">
                            Current Score
                          </p>
                        </div>
                      </div>
                    </div>

                    <!-- Interaction Type and Date -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label for="interaction-type" class="block text-sm font-medium text-gray-700">
                          Interaction Type *
                        </label>
                        <select
                          id="interaction-type"
                          v-model="formData.type"
                          required
                          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          :class="{ 'border-red-300': errors.type }"
                        >
                          <option value="">Select type...</option>
                          <option value="Phone">Phone Call</option>
                          <option value="Email">Email</option>
                          <option value="Meeting">In-Person Meeting</option>
                          <option value="Demo">Product Demo</option>
                          <option value="Event">Sample Visit</option>
                          <option value="Other">Follow-up</option>
                        </select>
                        <p v-if="errors.type" class="mt-1 text-sm text-red-600">{{ errors.type }}</p>
                      </div>

                      <div>
                        <label for="interaction-date" class="block text-sm font-medium text-gray-700">
                          Date & Time *
                        </label>
                        <input
                          id="interaction-date"
                          v-model="formData.dateTime"
                          type="datetime-local"
                          required
                          :max="getCurrentDateTime()"
                          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          :class="{ 'border-red-300': errors.dateTime }"
                        />
                        <p v-if="errors.dateTime" class="mt-1 text-sm text-red-600">{{ errors.dateTime }}</p>
                      </div>
                    </div>

                    <!-- Subject -->
                    <div>
                      <label for="subject" class="block text-sm font-medium text-gray-700">
                        Subject *
                      </label>
                      <input
                        id="subject"
                        v-model="formData.subject"
                        type="text"
                        required
                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        :class="{ 'border-red-300': errors.subject }"
                        placeholder="Brief description of the interaction..."
                      />
                      <p v-if="errors.subject" class="mt-1 text-sm text-red-600">{{ errors.subject }}</p>
                    </div>

                    <!-- Notes -->
                    <div>
                      <label for="notes" class="block text-sm font-medium text-gray-700">
                        Detailed Notes *
                      </label>
                      <textarea
                        id="notes"
                        v-model="formData.notes"
                        rows="4"
                        required
                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        :class="{ 'border-red-300': errors.notes }"
                        placeholder="Detailed description of what was discussed, outcomes, next steps..."
                      ></textarea>
                      <p v-if="errors.notes" class="mt-1 text-sm text-red-600">{{ errors.notes }}</p>
                    </div>

                    <!-- Rating -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Interaction Rating
                      </label>
                      <div class="flex items-center space-x-2">
                        <button
                          v-for="rating in 5"
                          :key="rating"
                          type="button"
                          @click="formData.rating = rating"
                          class="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
                        >
                          <StarIcon
                            class="h-6 w-6 transition-colors duration-150"
                            :class="[
                              rating <= formData.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300 hover:text-yellow-200'
                            ]"
                          />
                        </button>
                        <span class="ml-2 text-sm text-gray-600">
                          {{ getRatingLabel(formData.rating) }}
                        </span>
                      </div>
                    </div>

                    <!-- Products Discussed -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Products Discussed
                      </label>
                      <div class="space-y-2 max-h-32 overflow-y-auto">
                        <label
                          v-for="product in availableProducts"
                          :key="product.id"
                          class="flex items-center p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            v-model="formData.productIds"
                            type="checkbox"
                            :value="product.id"
                            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span class="ml-2 text-sm text-gray-700">{{ product.name }}</span>
                        </label>
                      </div>
                    </div>

                    <!-- Outcome -->
                    <div>
                      <label for="outcome" class="block text-sm font-medium text-gray-700">
                        Outcome
                      </label>
                      <select
                        id="outcome"
                        v-model="formData.outcome"
                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">Select outcome...</option>
                        <option value="POSITIVE">Positive - Strong Interest</option>
                        <option value="NEUTRAL">Neutral - Information Gathering</option>
                        <option value="NEGATIVE">Negative - Not Interested</option>
                        <option value="FOLLOW_UP_REQUIRED">Follow-up Required</option>
                        <option value="SAMPLE_REQUESTED">Sample Requested</option>
                        <option value="QUOTE_REQUESTED">Quote Requested</option>
                      </select>
                    </div>

                    <!-- Follow-up Checkbox -->
                    <div class="flex items-center">
                      <input
                        id="schedule-follow-up"
                        v-model="formData.scheduleFollowUp"
                        type="checkbox"
                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label for="schedule-follow-up" class="ml-2 block text-sm text-gray-700">
                        Schedule follow-up activity
                      </label>
                    </div>

                    <!-- Follow-up Details (if checked) -->
                    <div v-if="formData.scheduleFollowUp" class="pl-6 space-y-4 border-l-2 border-blue-200">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label for="follow-up-type" class="block text-sm font-medium text-gray-700">
                            Follow-up Type
                          </label>
                          <select
                            id="follow-up-type"
                            v-model="formData.followUpType"
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="Phone">Phone Call</option>
                            <option value="Email">Email</option>
                            <option value="Meeting">In-Person Meeting</option>
                            <option value="Event">Sample Delivery</option>
                          </select>
                        </div>

                        <div>
                          <label for="follow-up-date" class="block text-sm font-medium text-gray-700">
                            Follow-up Date
                          </label>
                          <input
                            id="follow-up-date"
                            v-model="formData.followUpDate"
                            type="date"
                            :min="getTomorrowDate()"
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label for="follow-up-notes" class="block text-sm font-medium text-gray-700">
                          Follow-up Notes
                        </label>
                        <textarea
                          id="follow-up-notes"
                          v-model="formData.followUpNotes"
                          rows="2"
                          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="What should be discussed in the follow-up..."
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  <!-- Modal Actions -->
                  <div class="mt-6 flex items-center justify-end space-x-3">
                    <button
                      type="button"
                      @click="closeModal"
                      class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      :disabled="logging || !isFormValid"
                      class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div v-if="logging" class="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                      {{ logging ? 'Logging...' : 'Log Interaction' }}
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot
} from '@headlessui/vue'
import {
  ChatBubbleLeftIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  UserCircleIcon,
  StarIcon
} from '@heroicons/vue/24/outline'
import { useProductStore } from '@/stores/productStore'
import { useInteractionStore } from '@/stores/interactionStore'
import type { PrincipalActivitySummary } from '@/services/principalActivityApi'
import type { InteractionType } from '@/types/interactions'

// Component imports
import EngagementScoreRing from './EngagementScoreRing.vue'

// ===============================
// COMPONENT INTERFACE
// ===============================

interface Props {
  principal?: PrincipalActivitySummary | null
}

interface Emits {
  (e: 'logged', interaction: any): void
}

const props = withDefaults(defineProps<Props>(), {
  principal: null
})

const emit = defineEmits<Emits>()

// ===============================
// STORES
// ===============================

const productStore = useProductStore()
const interactionStore = useInteractionStore()

// ===============================
// REACTIVE STATE
// ===============================

const showModal = ref(false)
const logging = ref(false)
const error = ref<string | null>(null)

const formData = reactive({
  type: '' as InteractionType | '',
  dateTime: '',
  subject: '',
  notes: '',
  rating: 0,
  productIds: [] as string[],
  outcome: '',
  scheduleFollowUp: false,
  followUpType: 'Phone' as InteractionType,
  followUpDate: '',
  followUpNotes: ''
})

const errors = reactive({
  type: '',
  dateTime: '',
  subject: '',
  notes: ''
})

// ===============================
// COMPUTED PROPERTIES
// ===============================

const availableProducts = computed(() => {
  return productStore.products.filter(product => product.is_active)
})

const isFormValid = computed(() => {
  return formData.type !== '' &&
         formData.dateTime !== '' &&
         formData.subject.trim() !== '' &&
         formData.notes.trim() !== ''
})

// ===============================
// EVENT HANDLERS
// ===============================

const openModal = () => {
  if (!props.principal) return
  
  resetForm()
  setDefaultDateTime()
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  resetForm()
  error.value = null
}

const handleSubmit = async () => {
  if (!isFormValid.value || !props.principal) return
  
  // Clear previous errors
  clearErrors()
  
  // Validate form
  if (!validateForm()) return
  
  logging.value = true
  error.value = null
  
  try {
    // Prepare interaction data
    const interactionData = {
      type: formData.type as InteractionType,
      interaction_date: new Date(formData.dateTime).toISOString(),
      subject: formData.subject,
      notes: formData.notes,
      rating: formData.rating || null,
      outcome: formData.outcome as ("POSITIVE" | "NEUTRAL" | "NEGATIVE" | "NEEDS_FOLLOW_UP" | null) || null,
      organization_id: props.principal.principal_id, // Using principal_id as organization reference
      principal_id: props.principal.principal_id,
      opportunity_id: null, // Not tied to specific opportunity
      product_ids: formData.productIds.length > 0 ? formData.productIds : null,
      // Follow-up data
      follow_up_required: formData.scheduleFollowUp,
      follow_up_type: formData.scheduleFollowUp ? formData.followUpType as InteractionType : null,
      follow_up_date: formData.scheduleFollowUp && formData.followUpDate 
        ? new Date(formData.followUpDate).toISOString() 
        : null,
      follow_up_notes: formData.scheduleFollowUp ? formData.followUpNotes : null
    }
    
    // Create interaction
    const result = await interactionStore.createInteraction(interactionData)
    
    if (result) {
      emit('logged', result)
      closeModal()
      
      // Show success message
      console.log('Interaction logged successfully:', result)
    } else {
      error.value = 'Failed to log interaction. Please try again.'
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
  } finally {
    logging.value = false
  }
}

// ===============================
// FORM HELPERS
// ===============================

const resetForm = () => {
  formData.type = ''
  formData.dateTime = ''
  formData.subject = ''
  formData.notes = ''
  formData.rating = 0
  formData.productIds = []
  formData.outcome = ''
  formData.scheduleFollowUp = false
  formData.followUpType = 'Phone'
  formData.followUpDate = ''
  formData.followUpNotes = ''
  clearErrors()
}

const clearErrors = () => {
  errors.type = ''
  errors.dateTime = ''
  errors.subject = ''
  errors.notes = ''
}

const validateForm = (): boolean => {
  let isValid = true
  
  if (!formData.type) {
    errors.type = 'Interaction type is required'
    isValid = false
  }
  
  if (!formData.dateTime) {
    errors.dateTime = 'Date and time are required'
    isValid = false
  }
  
  if (!formData.subject.trim()) {
    errors.subject = 'Subject is required'
    isValid = false
  }
  
  if (!formData.notes.trim()) {
    errors.notes = 'Detailed notes are required'
    isValid = false
  }
  
  return isValid
}

const setDefaultDateTime = () => {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  formData.dateTime = now.toISOString().slice(0, 16)
}

const getCurrentDateTime = (): string => {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
}

const getTomorrowDate = (): string => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
}

const getRatingLabel = (rating: number): string => {
  const labels = {
    0: 'No rating',
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  }
  return labels[rating as keyof typeof labels] || 'No rating'
}

// ===============================
// LIFECYCLE HOOKS
// ===============================

onMounted(async () => {
  // Load products if not already loaded
  if (productStore.products.length === 0) {
    await productStore.fetchProducts()
  }
})
</script>

<style scoped>
.log-principal-interaction-button {
  /* Custom styles for the component */
}

/* Star rating hover effects */
.star-rating button:hover {
  transform: scale(1.1);
}

/* Follow-up section styling */
.follow-up-section {
  background: linear-gradient(to right, rgba(59, 130, 246, 0.05), transparent);
}

/* Form animations */
.form-section {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Product checkbox grid */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
}

/* Rating stars animation */
.rating-stars .star {
  transition: all 0.15s ease-in-out;
}

.rating-stars .star:hover {
  transform: scale(1.2);
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .log-principal-interaction-button .modal-panel {
    margin: 0;
    height: 100vh;
    max-height: none;
    border-radius: 0;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>