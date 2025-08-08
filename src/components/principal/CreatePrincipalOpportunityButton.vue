<!--
  Create Principal Opportunity Button - Quick opportunity creation with pre-populated data
  Features: Modal form, principal pre-selection, validation
-->
<template>
  <div class="create-principal-opportunity-button">
    <!-- Trigger Button -->
    <button
      @click="openModal"
      :disabled="!principal || creating"
      class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
    >
      <PlusIcon class="h-4 w-4 mr-1" />
      {{ creating ? 'Creating...' : 'New Opportunity' }}
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
              <DialogPanel class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <!-- Modal Header -->
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900">
                      Create Opportunity
                    </DialogTitle>
                    <p class="mt-1 text-sm text-gray-600">
                      Create a new opportunity for {{ principal?.principal_name }}
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

                <!-- Opportunity Form -->
                <form @submit.prevent="handleSubmit">
                  <div class="space-y-4">
                    <!-- Principal (Read-only) -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Principal</label>
                      <div class="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md">
                        <div class="flex items-center justify-between">
                          <div>
                            <p class="text-sm font-medium text-gray-900">
                              {{ principal?.principal_name }}
                            </p>
                            <p class="text-xs text-gray-500">
                              {{ principal?.organization_type || 'No organization type' }}
                            </p>
                          </div>
                          <EngagementScoreRing
                            :score="principal?.engagement_score || 0"
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>

                    <!-- Opportunity Name -->
                    <div>
                      <label for="opportunity-name" class="block text-sm font-medium text-gray-700">
                        Opportunity Name *
                      </label>
                      <input
                        id="opportunity-name"
                        v-model="formData.name"
                        type="text"
                        required
                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        :class="{ 'border-red-300': errors.name }"
                        placeholder="Enter opportunity name..."
                      />
                      <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
                    </div>

                    <!-- Context -->
                    <div>
                      <label for="context" class="block text-sm font-medium text-gray-700">
                        Context *
                      </label>
                      <select
                        id="context"
                        v-model="formData.context"
                        required
                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        :class="{ 'border-red-300': errors.context }"
                      >
                        <option value="">Select context...</option>
                        <option value="SAMPLE_REQUEST">Sample Request</option>
                        <option value="PRICE_INQUIRY">Price Inquiry</option>
                        <option value="PRODUCT_INTEREST">Product Interest</option>
                        <option value="REFERRAL">Referral</option>
                        <option value="COLD_OUTREACH">Cold Outreach</option>
                        <option value="OTHER">Other</option>
                      </select>
                      <p v-if="errors.context" class="mt-1 text-sm text-red-600">{{ errors.context }}</p>
                    </div>

                    <!-- Custom Context (if Other selected) -->
                    <div v-if="formData.context === 'OTHER'">
                      <label for="custom-context" class="block text-sm font-medium text-gray-700">
                        Custom Context *
                      </label>
                      <input
                        id="custom-context"
                        v-model="formData.customContext"
                        type="text"
                        required
                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Describe the context..."
                      />
                    </div>

                    <!-- Product -->
                    <div>
                      <label for="product" class="block text-sm font-medium text-gray-700">
                        Product
                      </label>
                      <select
                        id="product"
                        v-model="formData.productId"
                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">Select product...</option>
                        <option 
                          v-for="product in availableProducts" 
                          :key="product.id" 
                          :value="product.id"
                        >
                          {{ product.name }}
                        </option>
                      </select>
                    </div>

                    <!-- Stage -->
                    <div>
                      <label for="stage" class="block text-sm font-medium text-gray-700">
                        Initial Stage
                      </label>
                      <select
                        id="stage"
                        v-model="formData.stage"
                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="NEW_LEAD">New Lead</option>
                        <option value="INITIAL_OUTREACH">Initial Outreach</option>
                        <option value="SAMPLE_VISIT_OFFERED">Sample Visit Offered</option>
                      </select>
                    </div>

                    <!-- Expected Close Date -->
                    <div>
                      <label for="close-date" class="block text-sm font-medium text-gray-700">
                        Expected Close Date
                      </label>
                      <input
                        id="close-date"
                        v-model="formData.expectedCloseDate"
                        type="date"
                        :min="getTodayDate()"
                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <!-- Probability -->
                    <div>
                      <label for="probability" class="block text-sm font-medium text-gray-700">
                        Probability (%)
                      </label>
                      <div class="mt-1 flex items-center space-x-3">
                        <input
                          id="probability"
                          v-model.number="formData.probability"
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          class="flex-1"
                        />
                        <span class="text-sm font-medium text-gray-700 w-12 text-right">
                          {{ formData.probability }}%
                        </span>
                      </div>
                    </div>

                    <!-- Notes -->
                    <div>
                      <label for="notes" class="block text-sm font-medium text-gray-700">
                        Notes
                      </label>
                      <textarea
                        id="notes"
                        v-model="formData.notes"
                        rows="3"
                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Additional details about this opportunity..."
                      ></textarea>
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
                      :disabled="creating || !isFormValid"
                      class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div v-if="creating" class="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                      {{ creating ? 'Creating...' : 'Create Opportunity' }}
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
import { ref, reactive, computed, watch, onMounted } from 'vue'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot
} from '@headlessui/vue'
import {
  PlusIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import { useProductStore } from '@/stores/productStore'
import { useOpportunityStore } from '@/stores/opportunityStore'
import type { PrincipalActivitySummary } from '@/services/principalActivityApi'

// Component imports
import EngagementScoreRing from './EngagementScoreRing.vue'

// ===============================
// COMPONENT INTERFACE
// ===============================

interface Props {
  principal?: PrincipalActivitySummary | null
}

interface Emits {
  (e: 'created', opportunity: any): void
}

const props = withDefaults(defineProps<Props>(), {
  principal: null
})

const emit = defineEmits<Emits>()

// ===============================
// STORES
// ===============================

const productStore = useProductStore()
const opportunityStore = useOpportunityStore()

// ===============================
// REACTIVE STATE
// ===============================

const showModal = ref(false)
const creating = ref(false)
const error = ref<string | null>(null)

const formData = reactive({
  name: '',
  context: '',
  customContext: '',
  productId: '',
  stage: 'NEW_LEAD',
  expectedCloseDate: '',
  probability: 25,
  notes: ''
})

const errors = reactive({
  name: '',
  context: ''
})

// ===============================
// COMPUTED PROPERTIES
// ===============================

const availableProducts = computed(() => {
  // Filter products available to this principal
  return productStore.products.filter(product => {
    // This would typically check product-principal associations
    // For now, return all active products
    return product.is_active
  })
})

const isFormValid = computed(() => {
  return formData.name.trim() !== '' && 
         formData.context !== '' &&
         (formData.context !== 'OTHER' || formData.customContext.trim() !== '')
})

// ===============================
// EVENT HANDLERS
// ===============================

const openModal = () => {
  if (!props.principal) return
  
  // Pre-populate form with principal data
  resetForm()
  generateOpportunityName()
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
  
  creating.value = true
  error.value = null
  
  try {
    // Prepare opportunity data
    const opportunityData = {
      name: formData.name,
      organization_id: props.principal.principal_id, // Using principal_id as organization reference
      principal_id: props.principal.principal_id,
      product_id: formData.productId || null,
      stage: formData.stage,
      context: formData.context,
      custom_context: formData.context === 'OTHER' ? formData.customContext : null,
      expected_close_date: formData.expectedCloseDate || null,
      probability_percent: formData.probability,
      notes: formData.notes || null,
      deal_owner: 'Current User' // This would come from auth context
    }
    
    // Create opportunity
    const result = await opportunityStore.createOpportunity(opportunityData)
    
    if (result) {
      emit('created', result)
      closeModal()
      
      // Show success message (you might want to use a toast notification)
      console.log('Opportunity created successfully:', result)
    } else {
      error.value = 'Failed to create opportunity. Please try again.'
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
  } finally {
    creating.value = false
  }
}

// ===============================
// FORM HELPERS
// ===============================

const resetForm = () => {
  formData.name = ''
  formData.context = ''
  formData.customContext = ''
  formData.productId = ''
  formData.stage = 'NEW_LEAD'
  formData.expectedCloseDate = ''
  formData.probability = 25
  formData.notes = ''
  clearErrors()
}

const clearErrors = () => {
  errors.name = ''
  errors.context = ''
}

const validateForm = (): boolean => {
  let isValid = true
  
  if (!formData.name.trim()) {
    errors.name = 'Opportunity name is required'
    isValid = false
  }
  
  if (!formData.context) {
    errors.context = 'Context is required'
    isValid = false
  }
  
  return isValid
}

const generateOpportunityName = () => {
  if (!props.principal) return
  
  // Generate auto-name based on principal and current date
  const date = new Date()
  const monthYear = date.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  })
  
  formData.name = `${props.principal.organization_type || 'Organization'} - ${props.principal.principal_name} - ${monthYear}`
}

const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0]
}

// ===============================
// WATCHERS
// ===============================

watch(() => formData.context, (newContext) => {
  if (newContext !== 'OTHER') {
    formData.customContext = ''
  }
})

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
.create-principal-opportunity-button {
  /* Custom styles for the component */
}

/* Modal animation improvements */
.modal-overlay {
  backdrop-filter: blur(4px);
}

/* Form field animations */
.form-field {
  transition: all 0.2s ease-in-out;
}

.form-field:focus-within {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Probability slider styling */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

input[type="range"]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Error state animations */
.error-field {
  animation: shake 0.3s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

/* Success state (for future use) */
.success-field {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}
</style>