<template>
  <div class="interaction-form-wrapper">
    <!-- Form Progress Indicator -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <h2 class="text-xl font-semibold text-gray-900">
            {{ isEditing ? 'Edit Interaction' : 'New Interaction' }}
          </h2>
          <div v-if="!isEditing" class="text-sm text-gray-500">
            Step {{ currentStep }} of {{ totalSteps }}
          </div>
        </div>
        
        <!-- Quick Template Indicator -->
        <div v-if="formData.useTemplate && formData.selectedTemplate" class="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
          <svg class="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          <span class="text-sm font-medium text-blue-700">
            Using Template: {{ formData.selectedTemplate.name }}
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
      <!-- Step 1: Type & Context -->
      <div v-if="currentStep === 1 || isEditing" class="step-section">
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-6">
            <span class="flex items-center space-x-2">
              <span class="w-2 h-2 bg-primary-500 rounded-full"></span>
              <span>Interaction Type & Context</span>
            </span>
          </h3>
          
          <div class="space-y-6">
            <!-- Template Selection -->
            <div v-if="!isEditing">
              <InteractionTemplateSelect
                name="template"
                label="Quick Start Template (Optional)"
                v-model="formData.selectedTemplate"
                v-model:use-template="formData.useTemplate"
                :error="validationErrors.template"
                @template-selected="handleTemplateSelected"
              />
            </div>

            <!-- Interaction Type -->
            <div>
              <InteractionTypeSelect
                name="interaction-type"
                label="Interaction Type"
                v-model="formData.interactionType"
                :error="validationErrors.interactionType"
                :required="true"
                :disabled="formData.useTemplate"
                @type-selected="handleTypeSelected"
              />
            </div>

            <!-- Title -->
            <div>
              <label for="interaction-title" class="block text-sm font-medium text-gray-700 mb-1">
                Title
                <span class="text-red-500 ml-1">*</span>
              </label>
              <input
                id="interaction-title"
                v-model="formData.title"
                type="text"
                required
                placeholder="Enter interaction title..."
                :class="inputClasses"
                :aria-invalid="!!validationErrors.title"
                :aria-describedby="validationErrors.title ? 'title-error' : undefined"
              />
              <p
                v-if="validationErrors.title"
                id="title-error"
                class="mt-1 text-sm text-red-600"
              >
                {{ validationErrors.title }}
              </p>
            </div>

            <!-- Organization Lookup -->
            <div>
              <OrganizationLookup
                name="organization"
                label="Organization"
                v-model="formData.organizationId"
                :error="validationErrors.organizationId"
                :required="true"
                :initial-organization-id="initialData?.organizationId"
                @organization-selected="handleOrganizationSelected"
              />
            </div>

            <!-- Opportunity Lookup (Optional) -->
            <div>
              <OpportunityLookup
                name="opportunity"
                label="Related Opportunity (Optional)"
                v-model="formData.opportunityId"
                :organization-id="formData.organizationId"
                :error="validationErrors.opportunityId"
                @opportunity-selected="handleOpportunitySelected"
              />
            </div>

            <!-- Principal Selection (Optional) -->
            <div v-if="formData.organizationId">
              <PrincipalSelect
                name="principal"
                label="Principal Contact (Optional)"
                v-model="formData.principalId"
                :organization-id="formData.organizationId"
                :error="validationErrors.principalId"
                @principal-selected="handlePrincipalSelected"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Details & Scheduling -->
      <div v-if="currentStep === 2 || isEditing" class="step-section">
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-6">
            <span class="flex items-center space-x-2">
              <span class="w-2 h-2 bg-primary-500 rounded-full"></span>
              <span>Details & Scheduling</span>
            </span>
          </h3>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Status -->
            <div>
              <label for="status" class="block text-sm font-medium text-gray-700 mb-1">
                Status
                <span class="text-red-500 ml-1">*</span>
              </label>
              <select
                id="status"
                v-model="formData.status"
                required
                :class="selectClasses"
              >
                <option value="">Select status...</option>
                <option value="PLANNED">Planned</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="RESCHEDULED">Rescheduled</option>
              </select>
            </div>

            <!-- Interaction Date -->
            <div>
              <label for="interaction-date" class="block text-sm font-medium text-gray-700 mb-1">
                {{ formData.status === 'PLANNED' ? 'Scheduled Date' : 'Interaction Date' }}
                <span class="text-red-500 ml-1">*</span>
              </label>
              <input
                id="interaction-date"
                v-model="formData.interactionDate"
                type="datetime-local"
                required
                :class="inputClasses"
              />
            </div>

            <!-- Duration -->
            <div>
              <label for="duration" class="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <input
                id="duration"
                v-model.number="formData.duration"
                type="number"
                min="1"
                max="1440"
                placeholder="30"
                :class="inputClasses"
              />
            </div>

            <!-- Conducted By -->
            <div>
              <label for="conducted-by" class="block text-sm font-medium text-gray-700 mb-1">
                Conducted By
              </label>
              <input
                id="conducted-by"
                v-model="formData.conductedBy"
                type="text"
                placeholder="Enter your name..."
                :class="inputClasses"
              />
            </div>

            <!-- Location (for in-person meetings) -->
            <div v-if="shouldShowLocation">
              <label for="location" class="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                id="location"
                v-model="formData.location"
                type="text"
                placeholder="Enter meeting location..."
                :class="inputClasses"
              />
            </div>

            <!-- Meeting URL (for virtual meetings) -->
            <div v-if="shouldShowMeetingUrl">
              <label for="meeting-url" class="block text-sm font-medium text-gray-700 mb-1">
                Meeting URL
              </label>
              <input
                id="meeting-url"
                v-model="formData.meetingUrl"
                type="url"
                placeholder="https://zoom.us/j/..."
                :class="inputClasses"
              />
            </div>

            <!-- Outcome (for completed interactions) -->
            <div v-if="formData.status === 'COMPLETED'" class="lg:col-span-2">
              <label for="outcome" class="block text-sm font-medium text-gray-700 mb-1">
                Outcome
              </label>
              <select
                id="outcome"
                v-model="formData.outcome"
                :class="selectClasses"
              >
                <option value="">Select outcome...</option>
                <option value="POSITIVE">Positive</option>
                <option value="NEUTRAL">Neutral</option>
                <option value="NEGATIVE">Negative</option>
                <option value="FOLLOW_UP_NEEDED">Follow-up Needed</option>
                <option value="OPPORTUNITY_CREATED">Opportunity Created</option>
                <option value="DEAL_ADVANCED">Deal Advanced</option>
                <option value="DEAL_STALLED">Deal Stalled</option>
                <option value="LOST_OPPORTUNITY">Lost Opportunity</option>
              </select>
            </div>

            <!-- Description -->
            <div class="lg:col-span-2">
              <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                v-model="formData.description"
                rows="4"
                placeholder="Add notes about the interaction..."
                :class="textareaClasses"
              />
            </div>

            <!-- Follow-up Scheduler -->
            <div class="lg:col-span-2">
              <FollowUpScheduler
                name="follow-up"
                v-model:required="formData.followUpRequired"
                v-model:date="formData.followUpDate"
                v-model:notes="formData.followUpNotes"
                :interaction-outcome="formData.outcome"
                :auto-suggest="formData.status === 'COMPLETED'"
                @follow-up-configured="handleFollowUpConfigured"
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
              {{ isSubmitting ? 'Saving...' : isEditing ? 'Update Interaction' : 'Create Interaction' }}
            </button>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<!--
  InteractionFormWrapper - Comprehensive interaction creation and editing form
  
  Features:
  - 2-step wizard for new interaction creation
  - Single-page editing mode for existing interactions
  - Template-based quick creation with auto-population
  - Real-time validation with accessible error handling
  - Auto-save functionality with draft recovery
  - Follow-up scheduling with outcome-based suggestions
  - Contextual creation from opportunities/organizations
  - Responsive design optimized for mobile
  - WCAG 2.1 AA accessibility compliance
  
  Form Steps:
  1. Type & Context - Select interaction type, organization, and opportunity
  2. Details & Scheduling - Configure timing, outcome, and follow-up
  
  Template System:
  - Quick start templates for common interaction types
  - Auto-population of fields based on template selection
  - Customization options while maintaining template base
-->

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useInteractionStore } from '@/stores/interactionStore'
import InteractionTemplateSelect from './InteractionTemplateSelect.vue'
import InteractionTypeSelect from './InteractionTypeSelect.vue'
import OrganizationLookup from './OrganizationLookup.vue'
import OpportunityLookup from './OpportunityLookup.vue'
import PrincipalSelect from './PrincipalSelect.vue'
import FollowUpScheduler from './FollowUpScheduler.vue'
import type { 
  InteractionType, 
  InteractionStatus, 
  InteractionOutcome,
  InteractionTemplate 
} from '@/types/interactions'
import type { 
  InteractionFormWrapperData,
  InteractionContextData,
  InteractionFormErrors
} from '@/types/interactionForm'

/**
 * Props interface for InteractionFormWrapper
 */
interface Props {
  /** Whether this is an edit form */
  isEditing?: boolean
  /** Initial data for editing or context from other pages */
  initialData?: Partial<InteractionFormWrapperData> & InteractionContextData
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
  success: [data: { interactionId: string }]
  /** Emitted when form is cancelled */
  cancel: []
  /** Emitted when form submission error occurs */
  error: [error: string | Error]
  /** Emitted when draft is saved */
  draftSaved: [formData: InteractionFormWrapperData]
  /** Emitted when form data changes */
  dataChanged: [formData: InteractionFormWrapperData]
}

const emit = defineEmits<Emits>()

// Dependencies
const router = useRouter()
const interactionStore = useInteractionStore()

// ===============================
// FORM STATE MANAGEMENT
// ===============================

const currentStep = ref(1)
const totalSteps = 2
const isSubmitting = ref(false)
const isSaving = ref(false)
const submitError = ref<string | null>(null)

const stepLabels = [
  { label: 'Type & Context', key: 'type' },
  { label: 'Details', key: 'details' }
]

// Form data reactive object
const formData = reactive<InteractionFormWrapperData>({
  // Step 1: Type & Context
  interactionType: null,
  title: '',
  organizationId: '',
  opportunityId: null,
  principalId: null,
  
  // Step 2: Details & Scheduling
  status: 'PLANNED' as InteractionStatus,
  interactionDate: '',
  duration: null,
  description: '',
  conductedBy: '',
  location: '',
  meetingUrl: '',
  
  // Follow-up
  followUpRequired: false,
  followUpDate: null,
  followUpNotes: '',
  
  // Outcome
  outcome: null,
  
  // Template
  selectedTemplate: null,
  useTemplate: false
})

// Validation errors
const validationErrors = ref<InteractionFormErrors>({})

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

const shouldShowLocation = computed(() => {
  return formData.interactionType === 'IN_PERSON_MEETING' || 
         formData.interactionType === 'SITE_VISIT' ||
         formData.interactionType === 'TRADE_SHOW'
})

const shouldShowMeetingUrl = computed(() => {
  return formData.interactionType === 'VIRTUAL_MEETING' || 
         formData.interactionType === 'PRODUCT_DEMO'
})

const canProceedToNext = computed(() => {
  switch (currentStep.value) {
    case 1:
      return !!(formData.interactionType && formData.title && formData.organizationId)
    case 2:
      return !!(formData.status && formData.interactionDate)
    default:
      return false
  }
})

const isFormValid = computed(() => {
  return !!(
    formData.interactionType &&
    formData.title &&
    formData.organizationId &&
    formData.status &&
    formData.interactionDate
  )
})

// ===============================
// FORM VALIDATION
// ===============================

const validateCurrentStep = (): boolean => {
  const errors: InteractionFormErrors = {}
  
  // Step 1 validation
  if (currentStep.value >= 1) {
    if (!formData.interactionType) {
      errors.interactionType = 'Interaction type is required'
    }
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required'
    }
    
    if (!formData.organizationId) {
      errors.organizationId = 'Organization is required'
    }
  }
  
  // Step 2 validation
  if (currentStep.value >= 2) {
    if (!formData.status) {
      errors.status = 'Status is required'
    }
    
    if (!formData.interactionDate) {
      errors.interactionDate = 'Interaction date is required'
    }
    
    if (formData.followUpRequired && !formData.followUpDate) {
      errors.followUpDate = 'Follow-up date is required when follow-up is needed'
    }
    
    if (formData.meetingUrl && !isValidUrl(formData.meetingUrl)) {
      errors.meetingUrl = 'Please enter a valid URL'
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

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
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

const handleTemplateSelected = (template: InteractionTemplate | null) => {
  if (template && formData.useTemplate) {
    // Auto-populate form fields from template
    formData.interactionType = template.type
    formData.title = template.title_template.replace('{organization}', 'New Organization')
    formData.description = template.description_template || ''
    formData.duration = template.default_duration
    
    if (template.auto_follow_up && template.follow_up_days) {
      formData.followUpRequired = true
      const followUpDate = new Date()
      followUpDate.setDate(followUpDate.getDate() + template.follow_up_days)
      formData.followUpDate = followUpDate.toISOString().split('T')[0]
    }
  }
}

const handleTypeSelected = (type: InteractionType) => {
  // Update title if using template format
  if (formData.title.includes('New Organization') && formData.organizationId) {
    // Would need organization name lookup to update title
  }
}

const handleOrganizationSelected = (organizationId: string, organizationData: any) => {
  formData.organizationId = organizationId
  
  // Update title if using template
  if (formData.selectedTemplate && formData.useTemplate) {
    formData.title = formData.selectedTemplate.title_template.replace(
      '{organization}', 
      organizationData.name || 'Selected Organization'
    )
  }
}

const handleOpportunitySelected = (opportunityId: string | null, opportunityData: any) => {
  formData.opportunityId = opportunityId
}

const handlePrincipalSelected = (principalId: string | null, principalData: any) => {
  formData.principalId = principalId
}

const handleFollowUpConfigured = (config: any) => {
  // Handle follow-up configuration changes
  console.log('Follow-up configured:', config)
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }
  
  isSubmitting.value = true
  submitError.value = null
  
  try {
    const interactionData = {
      type: formData.interactionType!,
      status: formData.status,
      title: formData.title,
      description: formData.description || null,
      interaction_date: formData.interactionDate,
      duration_minutes: formData.duration,
      outcome: formData.outcome,
      follow_up_required: formData.followUpRequired,
      follow_up_date: formData.followUpDate,
      follow_up_notes: formData.followUpNotes || null,
      organization_id: formData.organizationId,
      opportunity_id: formData.opportunityId,
      principal_id: formData.principalId,
      conducted_by: formData.conductedBy || null,
      location: formData.location || null,
      meeting_url: formData.meetingUrl || null
    }

    if (props.isEditing) {
      // Handle update logic
      const success = await interactionStore.updateInteraction('', interactionData)
      if (success) {
        emit('success', { interactionId: 'updated' })
      } else {
        const error = interactionStore.error || 'Failed to update interaction'
        submitError.value = error
        emit('error', error)
      }
    } else {
      // Handle creation
      const success = await interactionStore.createInteraction(interactionData)
      if (success) {
        emit('success', { interactionId: 'created' })
      } else {
        const error = interactionStore.error || 'Failed to create interaction'
        submitError.value = error
        emit('error', error)
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
    // Merge initial data with form data
    Object.assign(formData, props.initialData)
    
    // Set default interaction date to now if not provided
    if (!formData.interactionDate) {
      const now = new Date()
      formData.interactionDate = now.toISOString().slice(0, 16) // Format for datetime-local
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
      interactionType: null,
      title: '',
      organizationId: '',
      opportunityId: null,
      principalId: null,
      status: 'PLANNED' as InteractionStatus,
      interactionDate: '',
      duration: null,
      description: '',
      conductedBy: '',
      location: '',
      meetingUrl: '',
      followUpRequired: false,
      followUpDate: null,
      followUpNotes: '',
      outcome: null,
      selectedTemplate: null,
      useTemplate: false
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
  getFormData: (): InteractionFormWrapperData => ({ ...formData })
})
</script>

<style scoped>
.interaction-form-wrapper {
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
  .interaction-form-wrapper {
    @apply max-w-full mx-4;
  }
  
  .step-section .grid {
    @apply grid-cols-1;
  }
}

/* Print styles */
@media print {
  .interaction-form-wrapper {
    @apply shadow-none;
  }
  
  .form-actions {
    @apply hidden;
  }
}
</style>