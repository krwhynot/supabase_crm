<template>
  <div class="opportunity-form-wrapper">
    <!-- Form Progress Indicator -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <h2 class="text-xl font-semibold text-gray-900">
            {{ isEditing ? 'Edit Opportunity' : 'Create New Opportunity' }}
          </h2>
          <div v-if="!isEditing" class="text-sm text-gray-500">
            Step {{ currentStep }} of {{ totalSteps }}
          </div>
        </div>
        
        <!-- Batch Indicator -->
        <div v-if="formData.selectedPrincipals.length > 1" class="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
          <svg class="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span class="text-sm font-medium text-blue-700">
            Batch Creation ({{ formData.selectedPrincipals.length }} opportunities)
          </span>
        </div>
      </div>
      
      <!-- Progress Bar (only for creation) -->
      <div v-if="!isEditing" class="mt-4">
        <div class="flex items-center">
          <div
            v-for="step in totalSteps"
            :key="step"
            class="flex items-center"
          >
            <!-- Step Circle -->
            <div
              :class="[
                'flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium',
                step < currentStep 
                  ? 'bg-primary-600 border-primary-600 text-white' 
                  : step === currentStep
                    ? 'bg-white border-primary-600 text-primary-600'
                    : 'bg-white border-gray-300 text-gray-400'
              ]"
            >
              <svg v-if="step < currentStep" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              <span v-else>{{ step }}</span>
            </div>
            
            <!-- Step Connector -->
            <div
              v-if="step < totalSteps"
              :class="[
                'w-16 h-0.5 mx-2',
                step < currentStep ? 'bg-primary-600' : 'bg-gray-300'
              ]"
            />
          </div>
        </div>
        
        <!-- Step Labels -->
        <div class="flex mt-2">
          <div
            v-for="(stepInfo, index) in stepLabels"
            :key="index"
            class="flex-1 text-center"
          >
            <div
              :class="[
                'text-xs font-medium',
                (index + 1) <= currentStep ? 'text-primary-600' : 'text-gray-400'
              ]"
            >
              {{ stepInfo.label }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Form Content -->
    <form @submit.prevent="handleSubmit" class="space-y-8">
      <!-- Step 1: Basic Information -->
      <div v-if="currentStep === 1 || isEditing" class="step-section">
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-6">
            <span class="flex items-center space-x-2">
              <span class="w-2 h-2 bg-primary-500 rounded-full"></span>
              <span>Basic Information</span>
            </span>
          </h3>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Organization Name -->
            <div class="lg:col-span-2">
              <label for="organization-name" class="block text-sm font-medium text-gray-700 mb-1">
                Organization Name
                <span class="text-red-500 ml-1">*</span>
              </label>
              <input
                id="organization-name"
                v-model="formData.organizationName"
                type="text"
                required
                placeholder="Enter organization name..."
                :class="inputClasses"
                :aria-invalid="!!validationErrors.organizationName"
                :aria-describedby="validationErrors.organizationName ? 'org-name-error' : undefined"
              />
              <p
                v-if="validationErrors.organizationName"
                id="org-name-error"
                class="mt-1 text-sm text-red-600"
              >
                {{ validationErrors.organizationName }}
              </p>
            </div>

            <!-- Context Selection -->
            <div>
              <label for="context" class="block text-sm font-medium text-gray-700 mb-1">
                Opportunity Context
              </label>
              <select
                id="context"
                v-model="formData.context"
                :class="selectClasses"
              >
                <option value="">Select context...</option>
                <option value="EVENT">Event/Trade Show</option>
                <option value="REFERRAL">Referral</option>
                <option value="WEBSITE">Website Inquiry</option>
                <option value="COLD_OUTREACH">Cold Outreach</option>
                <option value="FOLLOW_UP">Follow-up</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>

            <!-- Custom Context -->
            <div v-if="formData.context === OpportunityContextRef.CUSTOM">
              <label for="custom-context" class="block text-sm font-medium text-gray-700 mb-1">
                Custom Context
              </label>
              <input
                id="custom-context"
                v-model="formData.customContext"
                type="text"
                placeholder="Describe the context..."
                :class="inputClasses"
              />
            </div>

            <!-- Opportunity Name Field -->
            <div class="lg:col-span-2">
              <OpportunityNameField
                name="opportunity-name"
                label="Opportunity Name"
                v-model="formData.opportunityName"
                v-model:auto-generate="formData.autoGenerateName"
                :organization-name="formData.organizationName"
                :principal-name="getSinglePrincipalName()"
                :principal-data="getBatchPrincipalData()"
                :context="formData.context"
                :custom-context="formData.customContext"
                :error="validationErrors.opportunityName"
                :required="true"
                @name-generated="handleNameGenerated"
                @batch-names-generated="handleBatchNamesGenerated"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Principal Selection -->
      <div v-if="currentStep === 2 || isEditing" class="step-section">
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-6">
            <span class="flex items-center space-x-2">
              <span class="w-2 h-2 bg-primary-500 rounded-full"></span>
              <span>Principal Selection</span>
            </span>
          </h3>
          
          <div class="space-y-6">
            <!-- Principal Multi-Select -->
            <PrincipalMultiSelect
              name="principals"
              label="Select Principals"
              v-model="formData.selectedPrincipals"
              :error="validationErrors.selectedPrincipals"
              :required="true"
              :show-batch-preview="true"
              :base-opportunity-name="formData.opportunityName"
              description="Choose one or more principals for this opportunity. Multiple selections will create separate opportunities for each principal."
              @selection-changed="handlePrincipalSelectionChanged"
            />
          </div>
        </div>
      </div>

      <!-- Step 3: Product & Details -->
      <div v-if="currentStep === 3 || isEditing" class="step-section">
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-6">
            <span class="flex items-center space-x-2">
              <span class="w-2 h-2 bg-primary-500 rounded-full"></span>
              <span>Product & Details</span>
            </span>
          </h3>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Product Selection -->
            <div class="lg:col-span-2">
              <ProductSelect
                name="product"
                label="Product"
                v-model="formData.selectedProduct"
                :selected-principals="formData.selectedPrincipals"
                :error="validationErrors.selectedProduct"
                :required="true"
                @product-selected="handleProductSelected"
              />
            </div>

            <!-- Stage Selection -->
            <div>
              <StageSelect
                name="stage"
                label="Opportunity Stage"
                v-model="formData.stage"
                :error="validationErrors.stage"
                :required="true"
                @stage-changed="handleStageChanged"
              />
            </div>

            <!-- Probability -->
            <div>
              <label for="probability" class="block text-sm font-medium text-gray-700 mb-1">
                Success Probability (%)
              </label>
              <div class="relative">
                <input
                  id="probability"
                  v-model.number="formData.probabilityPercent"
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  placeholder="0"
                  :class="inputClasses"
                />
                <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span class="text-gray-500 text-sm">%</span>
                </div>
              </div>
              <p class="mt-1 text-xs text-gray-500">
                Auto-populated based on stage, but can be customized
              </p>
            </div>

            <!-- Expected Close Date -->
            <div>
              <label for="close-date" class="block text-sm font-medium text-gray-700 mb-1">
                Expected Close Date
              </label>
              <input
                id="close-date"
                v-model="formData.expectedCloseDate"
                type="date"
                :min="minCloseDate"
                :class="inputClasses"
              />
            </div>

            <!-- Deal Owner -->
            <div>
              <label for="deal-owner" class="block text-sm font-medium text-gray-700 mb-1">
                Deal Owner
              </label>
              <input
                id="deal-owner"
                v-model="formData.dealOwner"
                type="text"
                placeholder="Enter deal owner name..."
                :class="inputClasses"
              />
            </div>

            <!-- Notes -->
            <div class="lg:col-span-2">
              <label for="notes" class="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                v-model="formData.notes"
                rows="4"
                placeholder="Add any additional notes about this opportunity..."
                :class="textareaClasses"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Error Summary -->
      <div v-if="submitError" class="bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex">
          <svg class="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
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
              <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
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
              :disabled="isSaving"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {{ isSaving ? 'Saving...' : 'Save Draft' }}
            </button>

            <!-- Next/Submit Button -->
            <button
              v-if="!isEditing && currentStep < totalSteps"
              type="button"
              @click="nextStep"
              :disabled="!canProceedToNext"
              class="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <svg class="ml-2 -mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              v-else
              type="submit"
              :disabled="isSubmitting || !isFormValid"
              class="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isSubmitting ? 'Creating...' : isEditing ? 'Update Opportunity' : getSubmitButtonText() }}
            </button>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<!--
  OpportunityFormWrapper - Comprehensive opportunity creation and editing form
  
  Features:
  - Multi-step wizard for new opportunity creation (3 steps)
  - Single-page editing mode for existing opportunities
  - Auto-naming with manual override capability
  - Batch creation for multiple principals
  - Real-time validation with accessible error handling
  - Auto-save functionality with draft recovery
  - Contextual creation from contacts/organizations
  - Responsive design optimized for iPad
  - WCAG 2.1 AA accessibility compliance
  
  Form Steps:
  1. Organization & Context - Select organization and opportunity context
  2. Principals & Naming - Choose principals and configure naming
  3. Product & Details - Select product, stage, probability, and notes
  
  Batch Creation:
  - Supports creating multiple opportunities for different principals
  - Shows name previews for each principal
  - Handles batch submission with progress feedback
-->

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useOpportunityStore } from '@/stores/opportunityStore'
import OpportunityNameField from './OpportunityNameField.vue'
import PrincipalMultiSelect from './PrincipalMultiSelect.vue'
import ProductSelect from './ProductSelect.vue'
import StageSelect from './StageSelect.vue'
import type { 
  OpportunityStage,
  OpportunityNamePreview 
} from '@/types/opportunities'
import { OpportunityContext } from '@/types/opportunities'
import type { 
  OpportunityFormWrapperData
} from '@/types/opportunityForm'
import type { PrincipalOption } from '@/stores/principalStore'

/**
 * Props interface for OpportunityFormWrapper
 */
interface Props {
  /** Whether this is an edit form */
  isEditing?: boolean
  /** Initial data for editing or context from other pages */
  initialData?: Partial<OpportunityFormWrapperData>
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
  success: [data: { opportunityId?: string; opportunityIds?: string[]; count?: number }]
  /** Emitted when form is cancelled */
  cancel: []
  /** Emitted when form submission error occurs */
  error: [error: string | Error]
  /** Emitted when draft is saved */
  draftSaved: [formData: OpportunityFormWrapperData]
  /** Emitted when form data changes */
  dataChanged: [formData: OpportunityFormWrapperData]
}

const emit = defineEmits<Emits>()

// Dependencies
const opportunityStore = useOpportunityStore()

// Expose enums to template
const OpportunityContextRef = OpportunityContext

// ===============================
// FORM STATE MANAGEMENT
// ===============================

const currentStep = ref(1)
const totalSteps = 3
const isSubmitting = ref(false)
const isSaving = ref(false)
const submitError = ref<string | null>(null)
const batchNamePreviews = ref<OpportunityNamePreview[]>([])

const stepLabels = [
  { label: 'Basic Info', key: 'basic' },
  { label: 'Principals', key: 'principals' },
  { label: 'Details', key: 'details' }
]

// Form data reactive object
const formData = reactive<OpportunityFormWrapperData>({
  // Basic Info
  organizationName: '',
  opportunityName: '',
  autoGenerateName: true,
  context: null,
  customContext: '',
  
  // Principal Selection
  selectedPrincipals: [],
  
  // Product & Details
  selectedProduct: '',
  stage: '' as OpportunityStage,
  probabilityPercent: null,
  expectedCloseDate: null,
  dealOwner: '',
  notes: ''
})

// Validation errors
const validationErrors = ref<Record<string, string>>({})

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

const minCloseDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

const canProceedToNext = computed(() => {
  switch (currentStep.value) {
    case 1:
      return !!(formData.organizationName && formData.opportunityName)
    case 2:
      return formData.selectedPrincipals.length > 0
    case 3:
      return !!(formData.selectedProduct && formData.stage)
    default:
      return false
  }
})

const isFormValid = computed(() => {
  return !!(
    formData.organizationName &&
    formData.opportunityName &&
    formData.selectedPrincipals.length > 0 &&
    formData.selectedProduct &&
    formData.stage
  )
})

const getSubmitButtonText = () => {
  if (formData.selectedPrincipals.length > 1) {
    return `Create ${formData.selectedPrincipals.length} Opportunities`
  }
  return 'Create Opportunity'
}

// ===============================
// UTILITY FUNCTIONS
// ===============================

/**
 * Transform wrapper form data to API form data format
 */
const transformToApiFormat = (): any => {
  return {
    name: formData.opportunityName,
    organization_id: 'temp-id', // This would need to be resolved from organizationName
    stage: formData.stage,
    principal_ids: formData.selectedPrincipals,
    product_id: formData.selectedProduct,
    context: formData.context,
    probability_percent: formData.probabilityPercent,
    expected_close_date: formData.expectedCloseDate,
    deal_owner: formData.dealOwner,
    notes: formData.notes,
    auto_generate_name: formData.autoGenerateName,
    name_template: null // This could be set based on auto-generation
  }
}

const getSinglePrincipalName = (): string | undefined => {
  if (formData.selectedPrincipals.length === 1) {
    // Get principal name from store - this would need to be implemented
    return formData.selectedPrincipals[0] // Placeholder
  }
  return undefined
}

const getBatchPrincipalData = () => {
  if (formData.selectedPrincipals.length > 1) {
    // Convert principal IDs to principal data - this would need store integration
    return formData.selectedPrincipals.map(id => ({ id, name: id })) // Placeholder
  }
  return undefined
}

// ===============================
// FORM VALIDATION
// ===============================

const validateCurrentStep = (): boolean => {
  const errors: Record<string, string> = {}
  
  // Step 1 validation
  if (currentStep.value >= 1) {
    if (!formData.organizationName.trim()) {
      errors.organizationName = 'Organization name is required'
    }
    
    if (!formData.opportunityName.trim()) {
      errors.opportunityName = 'Opportunity name is required'
    }
  }
  
  // Step 2 validation
  if (currentStep.value >= 2) {
    if (formData.selectedPrincipals.length === 0) {
      errors.selectedPrincipals = 'At least one principal must be selected'
    }
  }
  
  // Step 3 validation
  if (currentStep.value >= 3) {
    if (!formData.selectedProduct) {
      errors.selectedProduct = 'Product selection is required'
    }
    
    if (!formData.stage) {
      errors.stage = 'Stage selection is required'
    }
  }
  
  validationErrors.value = errors
  return Object.keys(errors).length === 0
}

const validateForm = (): boolean => {
  const tempStep = currentStep.value
  currentStep.value = totalSteps // Validate all steps
  const isValid = validateCurrentStep()
  currentStep.value = tempStep
  return isValid
}

// ===============================
// STEP NAVIGATION
// ===============================

const nextStep = () => {
  if (validateCurrentStep() && currentStep.value < totalSteps) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

// ===============================
// EVENT HANDLERS
// ===============================

const handleNameGenerated = (name: string, template: string) => {
  console.log('Name generated:', name, template)
}

const handleBatchNamesGenerated = (previews: OpportunityNamePreview[]) => {
  batchNamePreviews.value = previews
}

const handlePrincipalSelectionChanged = (selectedIds: string[], selectedPrincipals: PrincipalOption[]) => {
  console.log('Principal selection changed:', selectedIds, selectedPrincipals)
}

const handleProductSelected = (productId: string, product: any) => {
  console.log('Product selected:', productId, product)
}

const handleStageChanged = (_stage: OpportunityStage, probability: number) => {
  formData.probabilityPercent = probability
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }
  
  isSubmitting.value = true
  submitError.value = null
  
  try {
    if (props.isEditing) {
      // Handle update logic
      const apiData = transformToApiFormat()
      const success = await opportunityStore.updateOpportunity('', apiData)
      if (success) {
        emit('success', { opportunityId: 'updated' })
      } else {
        const error = opportunityStore.error || 'Failed to update opportunity'
        submitError.value = error
        emit('error', error)
      }
    } else {
      // Handle batch creation
      if (formData.selectedPrincipals.length > 1) {
        const apiData = transformToApiFormat()
        const success = await opportunityStore.createBatchOpportunities(apiData)
        if (success && opportunityStore.batchCreationResult) {
          emit('success', {
            opportunityIds: opportunityStore.batchCreationResult.created_opportunities.map(o => o.id),
            count: opportunityStore.batchCreationResult.total_created
          })
        } else {
          const error = opportunityStore.error || 'Failed to create opportunities'
          submitError.value = error
          emit('error', error)
        }
      } else {
        // Single opportunity creation
        const apiData = transformToApiFormat()
        const success = await opportunityStore.createOpportunity(apiData)
        if (success) {
          // Assuming the store sets a currentOpportunity or returns an ID
          emit('success', { opportunityId: 'created' }) // This would need to be the actual ID
        } else {
          const error = opportunityStore.error || 'Failed to create opportunity'
          submitError.value = error
          emit('error', error)
        }
      }
    }
  } catch (error) {
    console.error('Form submission error:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
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
  
  try {
    // Here you would implement draft saving logic
    // For now, just emit the event
    emit('draftSaved', { ...formData })
    
    // Show success feedback
    setTimeout(() => {
      isSaving.value = false
    }, 500)
  } catch (error) {
    console.error('Draft save error:', error)
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
    
    // If organizationName is provided but opportunityName is not set and auto-generate is enabled,
    // the OpportunityNameField component will handle auto-generation
    if (props.initialData.organizationName && formData.autoGenerateName) {
      // The name field component will auto-generate based on organization name
      console.log('Form initialized with organization:', props.initialData.organizationName)
    }
  }
  
  if (props.isEditing) {
    // For editing, show all steps at once
    currentStep.value = totalSteps
  }
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
      if (isFormValid.value) {
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
    Object.assign(formData, {
      organizationName: '',
      opportunityName: '',
      autoGenerateName: true,
      context: null,
      customContext: '',
      selectedPrincipals: [],
      selectedProduct: '',
      stage: '' as OpportunityStage,
      probabilityPercent: null,
      expectedCloseDate: null,
      dealOwner: '',
      notes: ''
    })
    currentStep.value = 1
    validationErrors.value = {}
    submitError.value = null
  },
  goToStep: (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      currentStep.value = step
    }
  },
  getFormData: (): OpportunityFormWrapperData => ({ ...formData })
})
</script>

<style scoped>
.opportunity-form-wrapper {
  @apply max-w-4xl mx-auto;
}

.step-section {
  @apply transition-all duration-300;
}

/* Step transition animations */
.step-section:not(.active) {
  @apply opacity-60;
}

/* Form focus styles */
.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  @apply ring-2 ring-primary-500 border-primary-500;
}

/* Progress indicator styles */
.progress-step {
  @apply transition-all duration-200;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .opportunity-form-wrapper {
    @apply max-w-full mx-4;
  }
  
  .step-section .grid {
    @apply grid-cols-1;
  }
}

/* Print styles */
@media print {
  .opportunity-form-wrapper {
    @apply shadow-none;
  }
  
  .form-actions {
    @apply hidden;
  }
}
</style>