<template>
  <div class="product-form-wrapper">
    <!-- Form Progress Indicator -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <h2 class="text-xl font-semibold text-gray-900">
            {{ isEditing ? 'Edit Product' : 'Create New Product' }}
          </h2>
          <div v-if="!isEditing" class="text-sm text-gray-500">
            Step {{ currentStep }} of {{ totalSteps }}
          </div>
        </div>
        
        <!-- Form Status Indicator -->
        <div v-if="formStatus !== ProductFormSubmissionState.IDLE" class="flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium"
             :class="getStatusClasses()">
          <div v-if="formStatus === ProductFormSubmissionState.SUBMITTING" class="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full"></div>
          <CheckIcon v-else-if="formStatus === ProductFormSubmissionState.SUCCESS" class="h-3 w-3" />
          <ExclamationTriangleIcon v-else-if="formStatus === ProductFormSubmissionState.ERROR" class="h-3 w-3" />
          <ClockIcon v-else-if="formStatus === ProductFormSubmissionState.DRAFT_SAVING" class="h-3 w-3" />
          <span>{{ getStatusText() }}</span>
        </div>
      </div>
      
      <!-- Progress Bar (only for creation) -->
      <div v-if="!isEditing" class="mt-4">
        <div class="flex items-center">
          <div
            v-for="step in totalSteps"
            :key="step"
            class="flex items-center step-container"
          >
            <!-- Step Circle -->
            <div
              :class="[
                'step-circle flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium transition-all duration-300 ease-in-out',
                step < currentStep 
                  ? 'bg-primary-600 border-primary-600 text-white scale-100 shadow-md step-completed' 
                  : step === currentStep
                    ? 'bg-white border-primary-600 text-primary-600 scale-110 shadow-lg ring-2 ring-primary-200 step-active'
                    : 'bg-white border-gray-300 text-gray-400 scale-95 step-pending'
              ]"
            >
              <Transition
                enter-active-class="transition-all duration-300 ease-out"
                enter-from-class="scale-0 rotate-180"
                enter-to-class="scale-100 rotate-0"
                leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="scale-100 rotate-0"
                leave-to-class="scale-0 rotate-180"
              >
                <CheckIcon v-if="step < currentStep" class="w-4 h-4 animate-bounce-once" />
                <span v-else class="transition-transform duration-200" :class="{ 'scale-110 font-bold': step === currentStep }">{{ step }}</span>
              </Transition>
            </div>
            
            <!-- Step Connector -->
            <div
              v-if="step < totalSteps"
              class="step-connector relative w-16 h-0.5 mx-2 bg-gray-300 overflow-hidden rounded-full"
            >
              <div
                class="absolute top-0 left-0 h-full bg-primary-600 rounded-full transition-all duration-500 ease-in-out"
                :style="{ width: step < currentStep ? '100%' : '0%' }"
              ></div>
            </div>
          </div>
        </div>
        
        <!-- Step Labels -->
        <div class="flex mt-3">
          <div
            v-for="(stepInfo, index) in stepLabels"
            :key="index"
            class="flex-1 text-center step-label-container"
          >
            <div
              class="text-xs font-medium transition-all duration-300 ease-in-out"
              :class="[
                (index + 1) < currentStep 
                  ? 'text-primary-600 transform scale-105' 
                  : (index + 1) === currentStep
                    ? 'text-primary-700 font-bold transform scale-110 animate-pulse'
                    : 'text-gray-400 transform scale-95'
              ]"
            >
              {{ stepInfo.label }}
              <span v-if="(index + 1) < currentStep" class="ml-1 text-green-500">✓</span>
            </div>
            <div
              v-if="stepInfo.description"
              class="text-xs mt-1 transition-all duration-300 ease-in-out"
              :class="[
                (index + 1) < currentStep 
                  ? 'text-gray-600 opacity-100' 
                  : (index + 1) === currentStep
                    ? 'text-gray-700 opacity-100 font-medium'
                    : 'text-gray-400 opacity-80'
              ]"
            >
              {{ stepInfo.description }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Form Content -->
    <form @submit.prevent="handleSubmit" class="space-y-8">
      <!-- Step 1: Basic Information -->
      <Transition
        enter-active-class="transition-all duration-500 ease-out"
        enter-from-class="opacity-0 transform translate-x-8 scale-95"
        enter-to-class="opacity-100 transform translate-x-0 scale-100"
        leave-active-class="transition-all duration-300 ease-in"
        leave-from-class="opacity-100 transform translate-x-0 scale-100"
        leave-to-class="opacity-0 transform -translate-x-8 scale-95"
      >
        <div v-if="currentStep === 1 || isEditing" class="step-section step-animation">
          <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6 step-card">
          <h3 class="text-lg font-medium text-gray-900 mb-6">
            <span class="flex items-center space-x-2">
              <span class="w-2 h-2 bg-primary-500 rounded-full"></span>
              <span>Basic Information</span>
            </span>
          </h3>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Product Name -->
            <div class="lg:col-span-2">
              <ProductNameField
                name="product-name"
                label="Product Name"
                v-model="formData.name"
                :error="validationErrors.name"
                :required="true"
                description="Enter a unique and descriptive name for your product"
              />
            </div>

            <!-- Category Selection -->
            <div>
              <CategorySelect
                name="category"
                label="Category"
                v-model="formData.category"
                :error="validationErrors.category"
                :required="true"
                :show-icons="true"
                @category-changed="handleCategoryChanged"
              />
            </div>

            <!-- SKU Field -->
            <div>
              <SkuField
                name="sku"
                label="SKU / Product Code"
                v-model="formData.sku"
                v-model:auto-generate="formData.autoGenerateSku"
                :product-name="formData.name"
                :category="formData.category"
                :error="validationErrors.sku"
                :required="!formData.autoGenerateSku"
                @sku-generated="handleSkuGenerated"
              />
            </div>

            <!-- Product Description -->
            <div class="lg:col-span-2">
              <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                v-model="formData.description"
                rows="4"
                placeholder="Provide a detailed description of the product, its features, and benefits..."
                :class="textareaClasses"
                :aria-invalid="!!validationErrors.description"
                :aria-describedby="validationErrors.description ? 'description-error' : undefined"
              />
              <p
                v-if="validationErrors.description"
                id="description-error"
                class="mt-1 text-sm text-red-600"
              >
                {{ validationErrors.description }}
              </p>
            </div>

            <!-- Active Status -->
            <div class="lg:col-span-2">
              <div class="flex items-center space-x-3">
                <input
                  id="is-active"
                  type="checkbox"
                  v-model="formData.isActive"
                  class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label for="is-active" class="text-sm font-medium text-gray-700">
                  Active Product
                </label>
              </div>
              <p class="mt-1 text-sm text-gray-500">
                Active products are available for selection in opportunities and orders
              </p>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Step 2: Product Details & Pricing -->
      <Transition
        enter-active-class="transition-all duration-500 ease-out"
        enter-from-class="opacity-0 transform translate-x-8 scale-95"
        enter-to-class="opacity-100 transform translate-x-0 scale-100"
        leave-active-class="transition-all duration-300 ease-in"
        leave-from-class="opacity-100 transform translate-x-0 scale-100"
        leave-to-class="opacity-0 transform -translate-x-8 scale-95"
      >
        <div v-if="currentStep === 2 || isEditing" class="step-section step-animation">
          <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6 step-card">
          <h3 class="text-lg font-medium text-gray-900 mb-6">
            <span class="flex items-center space-x-2">
              <span class="w-2 h-2 bg-primary-500 rounded-full"></span>
              <span>Product Details & Pricing</span>
            </span>
          </h3>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Pricing Section -->
            <div class="lg:col-span-2">
              <PricingFields
                v-model:unit-price="formData.unitPrice"
                v-model:cost-price="formData.costPrice"
                v-model:currency="formData.currency"
                :unit-price-error="validationErrors.unitPrice"
                :cost-price-error="validationErrors.costPrice"
                :currency-error="validationErrors.currency"
              />
            </div>

            <!-- Unit of Measure -->
            <div>
              <label for="unit-of-measure" class="block text-sm font-medium text-gray-700 mb-1">
                Unit of Measure
                <span class="text-red-500 ml-1">*</span>
              </label>
              <select
                id="unit-of-measure"
                v-model="formData.unitOfMeasure"
                :class="selectClasses"
                :aria-invalid="!!validationErrors.unitOfMeasure"
                :aria-describedby="validationErrors.unitOfMeasure ? 'unit-error' : undefined"
              >
                <option value="">Select unit...</option>
                <option v-for="unit in availableUnits" :key="unit" :value="unit">
                  {{ unit }}
                </option>
              </select>
              <p
                v-if="validationErrors.unitOfMeasure"
                id="unit-error"
                class="mt-1 text-sm text-red-600"
              >
                {{ validationErrors.unitOfMeasure }}
              </p>
            </div>

            <!-- Minimum Order Quantity -->
            <div>
              <label for="min-order-qty" class="block text-sm font-medium text-gray-700 mb-1">
                Minimum Order Quantity
              </label>
              <input
                id="min-order-qty"
                v-model.number="formData.minimumOrderQuantity"
                type="number"
                min="1"
                step="1"
                placeholder="1"
                :class="inputClasses"
              />
            </div>

            <!-- Lead Time -->
            <div>
              <label for="lead-time" class="block text-sm font-medium text-gray-700 mb-1">
                Lead Time (Days)
              </label>
              <input
                id="lead-time"
                v-model.number="formData.leadTimeDays"
                type="number"
                min="0"
                max="365"
                step="1"
                placeholder="0"
                :class="inputClasses"
              />
            </div>

            <!-- Specifications Editor -->
            <div class="lg:col-span-2">
              <SpecificationsEditor
                v-model="formData.specifications"
                :category="formData.category"
                :error="validationErrors.specifications"
                label="Product Specifications"
                description="Add key specifications and attributes for this product"
              />
            </div>
          </div>
        </div>
      </Transition>

      <!-- Step 3: Principal Assignment -->
      <Transition
        enter-active-class="transition-all duration-500 ease-out"
        enter-from-class="opacity-0 transform translate-x-8 scale-95"
        enter-to-class="opacity-100 transform translate-x-0 scale-100"
        leave-active-class="transition-all duration-300 ease-in"
        leave-from-class="opacity-100 transform translate-x-0 scale-100"
        leave-to-class="opacity-0 transform -translate-x-8 scale-95"
      >
        <div v-if="currentStep === 3 || isEditing" class="step-section step-animation">
          <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6 step-card">
          <h3 class="text-lg font-medium text-gray-900 mb-6">
            <span class="flex items-center space-x-2">
              <span class="w-2 h-2 bg-primary-500 rounded-full"></span>
              <span>Principal Assignment</span>
            </span>
          </h3>
          
          <div class="space-y-6">
            <!-- Principal Multi-Select -->
            <PrincipalMultiSelect
              name="principals"
              label="Assign Principals"
              v-model="formData.selectedPrincipals"
              :principal-required="formData.principalRequired"
              :error="validationErrors.selectedPrincipals"
              :required="formData.principalRequired"
              :show-assignment-preview="true"
              :bulk-assign-mode="formData.bulkAssignMode"
              description="Select which principals can access and order this product"
              @selection-changed="handlePrincipalSelectionChanged"
              @bulk-assign-toggled="handleBulkAssignToggled"
            />

            <!-- Assignment Options -->
            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="text-sm font-medium text-gray-900 mb-3">Assignment Options</h4>
              <div class="space-y-3">
                <div class="flex items-center space-x-3">
                  <input
                    id="principal-required"
                    type="checkbox"
                    v-model="formData.principalRequired"
                    class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label for="principal-required" class="text-sm text-gray-700">
                    Require principal assignment (at least one principal must be assigned)
                  </label>
                </div>
                
                <div class="flex items-center space-x-3">
                  <input
                    id="bulk-assign"
                    type="checkbox"
                    v-model="formData.bulkAssignMode"
                    class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label for="bulk-assign" class="text-sm text-gray-700">
                    Enable bulk assignment tools for easier multi-principal selection
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Step 4: Review & Confirmation -->
      <Transition
        enter-active-class="transition-all duration-500 ease-out"
        enter-from-class="opacity-0 transform translate-x-8 scale-95"
        enter-to-class="opacity-100 transform translate-x-0 scale-100"
        leave-active-class="transition-all duration-300 ease-in"
        leave-from-class="opacity-100 transform translate-x-0 scale-100"
        leave-to-class="opacity-0 transform -translate-x-8 scale-95"
      >
        <div v-if="currentStep === 4 || isEditing" class="step-section step-animation">
          <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6 step-card">
          <h3 class="text-lg font-medium text-gray-900 mb-6">
            <span class="flex items-center space-x-2">
              <span class="w-2 h-2 bg-primary-500 rounded-full"></span>
              <span>Review & Confirmation</span>
            </span>
          </h3>
          
          <!-- Form Summary -->
          <ProductFormSummary
            :form-data="formData"
            :principal-names="selectedPrincipalNames as any"
            @edit-step="goToStep"
            class="mb-6"
          />

          <!-- Terms and Notifications -->
          <div class="space-y-6">
            <!-- Terms Acceptance -->
            <div class="border-t border-gray-200 pt-6">
              <div class="flex items-start space-x-3">
                <input
                  id="terms-accepted"
                  type="checkbox"
                  v-model="formData.termsAccepted"
                  :class="[
                    'mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded',
                    validationErrors.termsAccepted ? 'border-red-500' : ''
                  ]"
                  :aria-invalid="!!validationErrors.termsAccepted"
                />
                <label for="terms-accepted" class="text-sm text-gray-700">
                  I accept the <button type="button" class="text-primary-600 hover:text-primary-500 underline">terms and conditions</button> 
                  for product creation and understand that this product will be made available to the selected principals.
                </label>
              </div>
              <p
                v-if="validationErrors.termsAccepted"
                class="mt-1 text-sm text-red-600"
              >
                {{ validationErrors.termsAccepted }}
              </p>
            </div>

            <!-- Notification Emails (Optional) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Notification Emails (Optional)
              </label>
              <NotificationEmailsField
                v-model="formData.notificationEmails"
                :error="validationErrors.notificationEmails"
                description="Enter email addresses to notify when the product is created"
                placeholder="Enter email address..."
              />
            </div>
          </div>
        </div>
      </Transition>

      <!-- Error Summary -->
      <div v-if="submitError" class="bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex">
          <ExclamationTriangleIcon class="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 class="text-sm font-medium text-red-800">Error submitting form</h3>
            <p class="mt-1 text-sm text-red-700">{{ submitError }}</p>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="bg-gray-50 rounded-lg p-6">
        <div class="flex items-center justify-between">
          <!-- Left Side Actions -->
          <div class="flex items-center space-x-3">
            <button
              v-if="!isEditing && currentStep > 1"
              type="button"
              @click="previousStep"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ArrowLeftIcon class="-ml-1 mr-2 h-4 w-4" />
              Previous
            </button>
            
            <button
              type="button"
              @click="handleCancel"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
          </div>

          <!-- Right Side Actions -->
          <div class="flex items-center space-x-3">
            <!-- Save Draft (creation only) -->
            <button
              v-if="!isEditing"
              type="button"
              @click="saveDraft"
              :disabled="isSaving || formStatus === ProductFormSubmissionState.DRAFT_SAVING"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <ClockIcon class="-ml-1 mr-2 h-4 w-4" />
              {{ formStatus === ProductFormSubmissionState.DRAFT_SAVING ? 'Saving...' : 'Save Draft' }}
            </button>

            <!-- Next/Submit Button -->
            <button
              v-if="!isEditing && currentStep < totalSteps"
              type="button"
              @click="nextStep"
              :disabled="!canProceedToNext"
              class="next-button inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out hover:transform hover:scale-105 hover:shadow-lg"
            >
              <span class="flex items-center">
                Next
                <ArrowRightIcon class="ml-2 -mr-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </button>

            <button
              v-else
              type="submit"
              :disabled="isSubmitting || !isFormValid"
              class="submit-button inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out hover:transform hover:scale-105 hover:shadow-lg"
            >
              <Transition
                enter-active-class="transition-all duration-200 ease-out"
                enter-from-class="scale-0 rotate-180"
                enter-to-class="scale-100 rotate-0"
                leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="scale-100 rotate-0"
                leave-to-class="scale-0 rotate-180"
              >
                <div v-if="isSubmitting" class="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              </Transition>
              <span class="flex items-center">
                {{ isSubmitting ? 'Creating Product...' : isEditing ? 'Update Product' : getSubmitButtonText() }}
                <span v-if="!isSubmitting" class="ml-2 text-lg">✨</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { 
  CheckIcon, 
  ExclamationTriangleIcon, 
  ClockIcon, 
  ArrowLeftIcon, 
  ArrowRightIcon 
} from '@heroicons/vue/24/outline'
import { useProductStore } from '@/stores/productStore'
import { usePrincipalStore } from '@/stores/principalStore'
import ProductNameField from './ProductNameField.vue'
import CategorySelect from './CategorySelect.vue'
import SkuField from './SkuField.vue'
import PricingFields from './PricingFields.vue'
import SpecificationsEditor from './SpecificationsEditor.vue'
import PrincipalMultiSelect from './PrincipalMultiSelect.vue'
import ProductFormSummary from './ProductFormSummary.vue'
import NotificationEmailsField from './NotificationEmailsField.vue'
import { 
  ProductFormWrapperData, 
  ProductFormValidationErrors, 
  ProductFormSubmissionState,
  UnitOfMeasure,
  CATEGORY_VALIDATION_RULES,
  DEFAULT_PRODUCT_FORM_DATA
} from '@/types/productForm'
import { 
  productFormStep1ValidationSchema,
  productFormStep2ValidationSchema,
  productFormStep3ValidationSchema,
  productFormStep4ValidationSchema,
  productFormCompleteValidationSchema
} from '@/types/productForm'
import { ProductCategory } from '@/types/products'

/**
 * Props interface for ProductFormWrapper
 */
interface Props {
  /** Whether this is an edit form */
  isEditing?: boolean
  /** Initial data for editing or context from other pages */
  initialData?: Partial<ProductFormWrapperData & { productId?: string }>
  /** Auto-save interval in milliseconds */
  autoSaveInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  isEditing: false,
  autoSaveInterval: 30000 // 30 seconds
})

/**
 * Component emits
 */
interface Emits {
  /** Emitted when form is successfully submitted */
  success: [data: { productId?: string; productName?: string; assignedPrincipals?: number }]
  /** Emitted when form is cancelled */
  cancel: []
  /** Emitted when form submission error occurs */
  error: [error: string | Error]
  /** Emitted when draft is saved */
  draftSaved: [formData: ProductFormWrapperData]
  /** Emitted when form data changes */
  dataChanged: [formData: ProductFormWrapperData]
}

const emit = defineEmits<Emits>()

// Dependencies
const productStore = useProductStore()
const principalStore = usePrincipalStore()

// Note: ProductFormSubmissionState is imported from types

// ===============================
// FORM STATE MANAGEMENT
// ===============================

const currentStep = ref(1)
const totalSteps = 4
const isSubmitting = ref(false)
const isSaving = ref(false)
const submitError = ref<string | null>(null)
const formStatus = ref<string>(ProductFormSubmissionState.IDLE)

const stepLabels = [
  { label: 'Basic Info', description: 'Name & Category', key: 'basic' },
  { label: 'Details', description: 'Pricing & Specs', key: 'details' },
  { label: 'Principals', description: 'Access Assignment', key: 'principals' },
  { label: 'Review', description: 'Final Confirmation', key: 'review' }
]

// Form data reactive object
const formData = reactive<ProductFormWrapperData>({
  ...DEFAULT_PRODUCT_FORM_DATA
})

// Validation errors
const validationErrors = ref<ProductFormValidationErrors>({})

// ===============================
// COMPUTED PROPERTIES
// ===============================

const inputClasses = computed(() => 
  'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200'
)

const selectClasses = computed(() => 
  'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200'
)

const textareaClasses = computed(() => 
  'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200 resize-vertical'
)

const availableUnits = computed(() => {
  if (!formData.category) return Object.values(UnitOfMeasure)
  
  const categoryRules = CATEGORY_VALIDATION_RULES[formData.category]
  return categoryRules?.unitOfMeasure || Object.values(UnitOfMeasure)
})

const selectedPrincipalNames = computed(() => {
  return formData.selectedPrincipals.map(id => {
    const principal = principalStore.getPrincipalById(id)
    return principal?.name || id
  })
})

const canProceedToNext = computed(() => {
  switch (currentStep.value) {
    case 1:
      return !!(formData.name && formData.category && (!formData.autoGenerateSku ? formData.sku : true))
    case 2:
      return !!(formData.unitOfMeasure)
    case 3:
      return !formData.principalRequired || formData.selectedPrincipals.length > 0
    case 4:
      return formData.termsAccepted
    default:
      return false
  }
})

const isFormValid = computed(() => {
  return !!(
    formData.name &&
    formData.category &&
    formData.unitOfMeasure &&
    (!formData.principalRequired || formData.selectedPrincipals.length > 0) &&
    formData.termsAccepted
  )
})

const getSubmitButtonText = () => {
  return 'Create Product'
}

const getStatusClasses = () => {
  switch (formStatus.value) {
    case ProductFormSubmissionState.SUBMITTING:
    case ProductFormSubmissionState.DRAFT_SAVING:
      return 'bg-blue-50 text-blue-700'
    case ProductFormSubmissionState.SUCCESS:
    case ProductFormSubmissionState.DRAFT_SAVED:
      return 'bg-green-50 text-green-700'
    case ProductFormSubmissionState.ERROR:
      return 'bg-red-50 text-red-700'
    default:
      return 'bg-gray-50 text-gray-700'
  }
}

const getStatusText = () => {
  switch (formStatus.value) {
    case ProductFormSubmissionState.SUBMITTING:
      return 'Creating Product...'
    case ProductFormSubmissionState.DRAFT_SAVING:
      return 'Saving Draft...'
    case ProductFormSubmissionState.DRAFT_SAVED:
      return 'Draft Saved'
    case ProductFormSubmissionState.SUCCESS:
      return 'Product Created'
    case ProductFormSubmissionState.ERROR:
      return 'Error Occurred'
    default:
      return ''
  }
}

// ===============================
// UTILITY FUNCTIONS
// ===============================

/**
 * Transform wrapper form data to API form data format
 */
const transformToApiFormat = (): any => {
  return {
    name: formData.name,
    description: formData.description || null,
    category: formData.category,
    sku: formData.sku || null,
    unit_price: formData.unitPrice || null,
    is_active: formData.isActive,
    // Additional fields would be mapped here
    specifications: formData.specifications,
    principal_ids: formData.selectedPrincipals,
    minimum_order_quantity: formData.minimumOrderQuantity,
    lead_time_days: formData.leadTimeDays,
    currency: formData.currency,
    unit_of_measure: formData.unitOfMeasure,
    cost_price: formData.costPrice
  }
}

// ===============================
// FORM VALIDATION
// ===============================

const validateCurrentStep = (): boolean => {
  const errors: ProductFormValidationErrors = {}
  
  try {
    switch (currentStep.value) {
      case 1:
        productFormStep1ValidationSchema.validateSync({
          name: formData.name,
          category: formData.category,
          description: formData.description,
          sku: formData.sku,
          autoGenerateSku: formData.autoGenerateSku,
          isActive: formData.isActive
        }, { abortEarly: false })
        break
      case 2:
        productFormStep2ValidationSchema.validateSync({
          unitPrice: formData.unitPrice,
          costPrice: formData.costPrice,
          currency: formData.currency,
          unitOfMeasure: formData.unitOfMeasure,
          minimumOrderQuantity: formData.minimumOrderQuantity,
          leadTimeDays: formData.leadTimeDays,
          specifications: formData.specifications
        }, { abortEarly: false })
        break
      case 3:
        productFormStep3ValidationSchema.validateSync({
          selectedPrincipals: formData.selectedPrincipals,
          principalRequired: formData.principalRequired,
          bulkAssignMode: formData.bulkAssignMode
        }, { abortEarly: false })
        break
      case 4:
        productFormStep4ValidationSchema.validateSync({
          termsAccepted: formData.termsAccepted,
          notificationEmails: formData.notificationEmails,
          saveAsDraft: formData.saveAsDraft
        }, { abortEarly: false })
        break
    }
  } catch (validationError: any) {
    if (validationError.inner) {
      validationError.inner.forEach((err: any) => {
        errors[err.path as keyof ProductFormValidationErrors] = err.message
      })
    } else {
      errors.name = 'Validation error occurred'
    }
  }
  
  validationErrors.value = errors
  return Object.keys(errors).length === 0
}

const validateForm = (): boolean => {
  try {
    productFormCompleteValidationSchema.validateSync(formData, { abortEarly: false })
    validationErrors.value = {}
    return true
  } catch (validationError: any) {
    const errors: ProductFormValidationErrors = {}
    if (validationError.inner) {
      validationError.inner.forEach((err: any) => {
        errors[err.path as keyof ProductFormValidationErrors] = err.message
      })
    }
    validationErrors.value = errors
    return false
  }
}

// ===============================
// STEP NAVIGATION
// ===============================

const nextStep = () => {
  if (validateCurrentStep() && currentStep.value < totalSteps) {
    // Add step completion celebration
    const currentStepElement = document.querySelector(`.step-circle:nth-child(${currentStep.value * 2 - 1})`)
    if (currentStepElement) {
      currentStepElement.classList.add('step-completing')
      setTimeout(() => {
        currentStepElement.classList.remove('step-completing')
      }, 300)
    }
    
    currentStep.value++
    
    // Trigger step entrance animation for new step
    nextTick(() => {
      const newStepElement = document.querySelector(`.step-circle:nth-child(${currentStep.value * 2 - 1})`)
      if (newStepElement) {
        newStepElement.classList.add('step-entering')
        setTimeout(() => {
          newStepElement.classList.remove('step-entering')
        }, 500)
      }
    })
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const goToStep = (step: number) => {
  if (step >= 1 && step <= totalSteps) {
    currentStep.value = step
  }
}

// ===============================
// EVENT HANDLERS
// ===============================

const handleCategoryChanged = (category: ProductCategory | null) => {
  if (!category) return
  
  console.log('Category changed:', category)
  
  // Update available units based on category
  const categoryRules = CATEGORY_VALIDATION_RULES[category]
  if (categoryRules?.unitOfMeasure && !categoryRules.unitOfMeasure.includes(formData.unitOfMeasure as any)) {
    formData.unitOfMeasure = categoryRules.unitOfMeasure[0] || UnitOfMeasure.EACH
  }
  
  // Add required specifications for this category
  if (categoryRules?.requiredSpecs) {
    const existingKeys = formData.specifications.map(spec => spec.key)
    categoryRules.requiredSpecs.forEach((specKey: string) => {
      if (!existingKeys.includes(specKey)) {
        formData.specifications.push({
          id: `spec-${Date.now()}-${Math.random()}`,
          key: specKey,
          value: '',
          isRequired: true
        })
      }
    })
  }
}

const handleSkuGenerated = (sku: string) => {
  console.log('SKU generated:', sku)
}

const handlePrincipalSelectionChanged = (selectedIds: string[], selectedPrincipals: any[]) => {
  console.log('Principal selection changed:', selectedIds, selectedPrincipals)
}

const handleBulkAssignToggled = (enabled: boolean) => {
  console.log('Bulk assign toggled:', enabled)
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }
  
  isSubmitting.value = true
  submitError.value = null
  formStatus.value = ProductFormSubmissionState.SUBMITTING
  
  try {
    const apiData = transformToApiFormat()
    let success: boolean
    let productId: string | undefined
    
    if (props.isEditing) {
      // For editing, we need the product ID from the initial data
      const editProductId = props.initialData?.productId || productStore.selectedProduct?.id
      if (!editProductId) {
        throw new Error('Product ID is required for editing')
      }
      
      success = await productStore.updateProduct(editProductId, apiData)
      productId = editProductId
    } else {
      // For creating
      success = await productStore.createProduct(apiData)
      productId = productStore.selectedProduct?.id || 'created-product-id'
    }
    
    if (success) {
      formStatus.value = ProductFormSubmissionState.SUCCESS
      
      const assignedPrincipals = formData.selectedPrincipals.length
      
      emit('success', { 
        productId, 
        productName: formData.name,
        assignedPrincipals
      })
    } else {
      const error = productStore.error || (props.isEditing ? 'Failed to update product' : 'Failed to create product')
      formStatus.value = ProductFormSubmissionState.ERROR
      submitError.value = error
      emit('error', error)
    }
  } catch (error) {
    console.error('Form submission error:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    formStatus.value = ProductFormSubmissionState.ERROR
    submitError.value = errorMessage
    emit('error', errorMessage)
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  emit('cancel')
}

const saveDraft = async () => {
  isSaving.value = true
  formStatus.value = ProductFormSubmissionState.DRAFT_SAVING
  
  try {
    // Here you would implement draft saving logic
    await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API call
    
    emit('draftSaved', { ...formData })
    formStatus.value = ProductFormSubmissionState.DRAFT_SAVED
    
    // Reset status after delay
    setTimeout(() => {
      formStatus.value = ProductFormSubmissionState.IDLE
    }, 2000)
  } catch (error) {
    console.error('Draft save error:', error)
    formStatus.value = ProductFormSubmissionState.ERROR
  } finally {
    isSaving.value = false
  }
}

// ===============================
// LIFECYCLE & INITIALIZATION
// ===============================

const initializeForm = () => {
  if (props.initialData) {
    // Merge initial data with form data, preserving existing values
    Object.assign(formData, props.initialData)
  }
  
  if (props.isEditing) {
    // For editing, show all steps at once
    currentStep.value = totalSteps
  }
  
  // Load principals for selection
  principalStore.fetchPrincipals()
}

// Watch for form data changes
watch(
  () => ({ ...formData }),
  (newData) => {
    emit('dataChanged', newData)
  },
  { deep: true }
)

// Auto-save functionality (for creation only)
let autoSaveTimer: ReturnType<typeof setInterval>

const startAutoSave = () => {
  if (!props.isEditing && props.autoSaveInterval > 0) {
    autoSaveTimer = setInterval(() => {
      if (isFormValid.value && formStatus.value === ProductFormSubmissionState.IDLE) {
        saveDraft()
      }
    }, props.autoSaveInterval)
  }
}

const stopAutoSave = () => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
  }
}

onMounted(() => {
  initializeForm()
  startAutoSave()
})

// Cleanup on unmount
import { onUnmounted } from 'vue'
onUnmounted(() => {
  stopAutoSave()
})

/**
 * Public methods for parent components
 */
defineExpose({
  validateForm,
  resetForm: () => {
    Object.assign(formData, DEFAULT_PRODUCT_FORM_DATA)
    currentStep.value = 1
    validationErrors.value = {}
    submitError.value = null
    formStatus.value = ProductFormSubmissionState.IDLE
  },
  goToStep,
  getFormData: (): ProductFormWrapperData => ({ ...formData })
})
</script>

<style scoped>
.product-form-wrapper {
  @apply max-w-4xl mx-auto;
}

/* Step transition animations */
.step-section {
  @apply transition-all duration-300;
}

.step-animation {
  animation: step-entrance 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

@keyframes step-entrance {
  0% {
    opacity: 0;
    transform: translateX(20px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

/* Step card hover effects */
.step-card {
  transition: all 0.3s ease-in-out;
}

.step-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

/* Progress indicator enhanced styles */
.step-circle {
  position: relative;
  z-index: 10;
}

.step-circle.step-active {
  animation: step-pulse 2s ease-in-out infinite;
}

@keyframes step-pulse {
  0%, 100% { 
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% { 
    box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
  }
}

.step-circle.step-completed {
  animation: step-completion 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes step-completion {
  0% { transform: scale(1); }
  50% { transform: scale(1.3) rotate(10deg); }
  100% { transform: scale(1) rotate(0deg); }
}

.step-circle.step-completing {
  animation: step-completing 0.3s ease-in-out;
}

@keyframes step-completing {
  0% { transform: scale(1); background-color: theme('colors.primary.600'); }
  50% { transform: scale(1.2); background-color: theme('colors.green.500'); }
  100% { transform: scale(1); background-color: theme('colors.primary.600'); }
}

.step-circle.step-entering {
  animation: step-entering 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes step-entering {
  0% { transform: scale(0.8); opacity: 0.5; }
  60% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

/* Bounce animation for checkmarks */
@keyframes animate-bounce-once {
  0%, 100% { 
    transform: translateY(0);
  }
  50% { 
    transform: translateY(-4px);
  }
}

.animate-bounce-once {
  animation: animate-bounce-once 0.6s ease-in-out;
}

/* Step connector progress animation */
.step-connector .bg-primary-600 {
  transform-origin: left center;
  animation: connector-fill 0.5s ease-in-out;
}

@keyframes connector-fill {
  0% { transform: scaleX(0); }
  100% { transform: scaleX(1); }
}

/* Button hover enhancements */
.next-button:hover,
.submit-button:hover {
  animation: button-excitement 0.3s ease-in-out;
}

@keyframes button-excitement {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1.02); }
}

.next-button:disabled,
.submit-button:disabled {
  animation: none;
  transform: none !important;
}

/* Form focus styles */
.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  @apply ring-2 ring-primary-500 border-primary-500;
  animation: input-focus-glow 0.3s ease-in-out;
}

@keyframes input-focus-glow {
  0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
  100% { box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2); }
}

/* Step label animations */
.step-label-container {
  transition: all 0.3s ease-in-out;
}

.step-label-container:hover {
  transform: translateY(-1px);
}

/* Status indicator animations */
.bg-blue-50 {
  animation: status-pulse 2s ease-in-out infinite;
}

@keyframes status-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

/* Loading spinner enhancement */
.animate-spin {
  animation: enhanced-spin 1s linear infinite;
}

@keyframes enhanced-spin {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.1); }
  100% { transform: rotate(360deg) scale(1); }
}

/* Section header animations */
.step-section h3 {
  animation: header-slide-in 0.4s ease-out;
}

@keyframes header-slide-in {
  0% {
    opacity: 0;
    transform: translateX(-20px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Form field focus transitions */
input:focus,
select:focus,
textarea:focus {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .product-form-wrapper {
    @apply max-w-full mx-4;
  }
  
  .step-section .grid {
    @apply grid-cols-1;
  }

  .step-circle {
    @apply w-6 h-6 text-xs;
  }

  .step-connector {
    @apply w-8;
  }

  /* Reduce animation intensity on mobile */
  .step-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

/* Accessibility - Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
  }
  
  .step-circle,
  .step-card,
  .next-button,
  .submit-button {
    transform: none !important;
  }
  
  /* Still allow basic hover states for better UX */
  .step-card:hover {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .step-circle {
    border-width: 3px;
  }
  
  .step-connector {
    height: 2px;
  }
  
  .bg-blue-50,
  .bg-green-50,
  .bg-red-50 {
    border-width: 2px;
  }
}

/* Print styles */
@media print {
  .product-form-wrapper {
    @apply shadow-none;
  }
  
  .form-actions,
  .step-section h3 span.w-2 {
    @apply hidden;
  }
  
  .step-card {
    box-shadow: none;
    transform: none;
  }
  
  /* Simplify step indicators for print */
  .step-circle {
    @apply border-2 border-gray-400;
  }
}

/* Dark mode support (if implemented) */
@media (prefers-color-scheme: dark) {
  .step-card {
    @apply bg-gray-800 border-gray-700;
  }
  
  .step-circle.step-pending {
    @apply border-gray-600 text-gray-400;
  }
}
</style>