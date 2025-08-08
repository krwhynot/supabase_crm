<!--
  InteractionFormWrapper.vue
  Multi-step interaction creation form with validation and smart defaults
  Follows OpportunityFormWrapper patterns for consistency
-->
<template>
  <div class="interaction-form-wrapper">
    <!-- Form Header -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">
        {{ isEditing ? 'Edit Interaction' : 'New Interaction' }}
      </h2>
      <p class="text-gray-600">
        {{ isEditing ? 'Update interaction details' : 'Record a new customer interaction' }}
      </p>
    </div>

    <!-- Step Progress Indicator -->
    <div class="mb-8">
      <nav aria-label="Progress">
        <ol class="flex items-center">
          <li v-for="(step, index) in steps" :key="step.id" class="relative">
            <!-- Step Circle -->
            <div class="flex items-center">
              <div
                :class="[
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                  getStepClasses(index + 1)
                ]"
              >
                <CheckIcon v-if="isStepCompleted(index + 1)" class="h-5 w-5" />
                <span v-else>{{ index + 1 }}</span>
              </div>
              
              <!-- Step Label -->
              <span
                :class="[
                  'ml-3 text-sm font-medium',
                  currentStep === index + 1 ? 'text-blue-600' : 'text-gray-500'
                ]"
              >
                {{ step.name }}
              </span>
            </div>

            <!-- Step Connector -->
            <div
              v-if="index < steps.length - 1"
              :class="[
                'absolute left-4 top-8 h-6 w-0.5',
                isStepCompleted(index + 1) ? 'bg-blue-600' : 'bg-gray-300'
              ]"
            />
          </li>
        </ol>
      </nav>
    </div>

    <!-- Form Content -->
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Step 1: Basic Information -->
      <div v-show="currentStep === 1" class="space-y-6">
        <InteractionStepOne
          v-model:form-data="formData.step1"
          :validation="validation"
          :opportunities="availableOpportunities"
          :loading="loadingOpportunities"
          @opportunity-selected="handleOpportunitySelected"
          @update:form-data="updateStep1Data"
        />
      </div>

      <!-- Step 2: Details -->
      <div v-show="currentStep === 2" class="space-y-6">
        <InteractionStepTwo
          v-model:form-data="formData.step2"
          :validation="validation"
          :interaction-type="formData.step1.type"
          @update:form-data="updateStep2Data"
        />
      </div>

      <!-- Step 3: Outcome & Follow-up -->
      <div v-show="currentStep === 3" class="space-y-6">
        <InteractionStepThree
          v-model:form-data="formData.step3"
          :validation="validation"
          :status="formData.step2.status"
          @update:form-data="updateStep3Data"
        />
      </div>

      <!-- Form Actions -->
      <div class="flex justify-between pt-6 border-t border-gray-200">
        <!-- Previous Button -->
        <button
          v-if="currentStep > 1"
          type="button"
          @click="previousStep"
          class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ChevronLeftIcon class="h-4 w-4 mr-2" />
          Previous
        </button>
        <div v-else></div>

        <!-- Next/Submit Button -->
        <div class="flex space-x-3">
          <!-- Save Draft (if applicable) -->
          <button
            v-if="!isEditing && currentStep === 3"
            type="button"
            @click="saveDraft"
            :disabled="creating"
            class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <DocumentIcon class="h-4 w-4 mr-2" />
            Save Draft
          </button>

          <!-- Next/Submit -->
          <button
            v-if="currentStep < 3"
            type="button"
            @click="nextStep"
            :disabled="!isCurrentStepValid"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Next
            <ChevronRightIcon class="h-4 w-4 ml-2" />
          </button>

          <button
            v-else
            type="submit"
            :disabled="!canSubmit || creating"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <span v-if="creating" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isEditing ? 'Updating...' : 'Creating...' }}
            </span>
            <span v-else>
              {{ isEditing ? 'Update Interaction' : 'Create Interaction' }}
            </span>
          </button>
        </div>
      </div>
    </form>

    <!-- Error Display -->
    <div v-if="error" class="mt-6 rounded-md bg-red-50 p-4">
      <div class="flex">
        <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error</h3>
          <div class="mt-2 text-sm text-red-700">
            {{ error }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useInteractionStore } from '@/stores/interactionStore'
import { useOpportunityStore } from '@/stores/opportunityStore'
import type {
  InteractionFormStep1,
  InteractionFormStep2,
  InteractionFormStep3,
  InteractionFormValidation,
  InteractionType
} from '@/types/interactions'
import {
  INTERACTION_FORM_DEFAULTS
} from '@/types/interactions'
import type { OpportunityListView } from '@/types/opportunities'
import InteractionStepOne from './InteractionStepOne.vue'
import InteractionStepTwo from './InteractionStepTwo.vue'
import InteractionStepThree from './InteractionStepThree.vue'
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

// Props
interface Props {
  interactionId?: string
  opportunityId?: string
  isEditing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isEditing: false
})

// Stores
const interactionStore = useInteractionStore()
const opportunityStore = useOpportunityStore()
const router = useRouter()

// Reactive state
const currentStep = ref(1)
const availableOpportunities = ref<OpportunityListView[]>([])
const loadingOpportunities = ref(false)

// Form data structure
const formData = reactive({
  step1: {
    type: 'Phone' as InteractionType,
    subject: '',
    opportunity_id: props.opportunityId || '',
    interaction_date: new Date().toISOString().slice(0, 16) // datetime-local format
  } as InteractionFormStep1,
  step2: {
    status: 'SCHEDULED' as const,
    duration_minutes: null,
    location: null,
    contact_method: null,
    participants: []
  } as InteractionFormStep2,
  step3: {
    outcome: null,
    rating: null,
    notes: '',
    follow_up_required: false,
    follow_up_date: null,
    follow_up_notes: '',
    next_action: '',
    tags: [],
    attachments: [],
    custom_fields: null
  } as InteractionFormStep3
})

// Validation state
const validation = reactive<InteractionFormValidation>({
  isValid: false,
  errors: {},
  warnings: {},
  touched: {},
  step1Valid: false,
  step2Valid: false,
  step3Valid: false
})

// Step configuration
const steps = [
  { id: 'basic', name: 'Basic Info' },
  { id: 'details', name: 'Details' },
  { id: 'outcome', name: 'Outcome' }
]

// Computed properties
const creating = computed(() => interactionStore.creating)
const error = computed(() => interactionStore.error)

const isCurrentStepValid = computed(() => {
  switch (currentStep.value) {
    case 1: return validation.step1Valid
    case 2: return validation.step2Valid
    case 3: return validation.step3Valid
    default: return false
  }
})

const canSubmit = computed(() => {
  return validation.step1Valid && validation.step2Valid && validation.step3Valid
})

// Step styling
const getStepClasses = (stepNumber: number) => {
  if (isStepCompleted(stepNumber)) {
    return 'bg-blue-600 text-white'
  } else if (currentStep.value === stepNumber) {
    return 'bg-blue-600 text-white'
  } else {
    return 'bg-gray-300 text-gray-500'
  }
}

const isStepCompleted = (stepNumber: number) => {
  switch (stepNumber) {
    case 1: return validation.step1Valid && currentStep.value > 1
    case 2: return validation.step2Valid && currentStep.value > 2
    case 3: return validation.step3Valid
    default: return false
  }
}

// Form navigation
const nextStep = () => {
  if (currentStep.value < 3 && isCurrentStepValid.value) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

// Form handlers
const updateStep1Data = (data: Partial<InteractionFormStep1>) => {
  Object.assign(formData.step1, data)
  validateStep1()
}

const updateStep2Data = (data: Partial<InteractionFormStep2>) => {
  Object.assign(formData.step2, data)
  validateStep2()
}

const updateStep3Data = (data: Partial<InteractionFormStep3>) => {
  Object.assign(formData.step3, data)
  validateStep3()
}

const handleOpportunitySelected = (opportunityId: string) => {
  formData.step1.opportunity_id = opportunityId
  validateStep1()
}

// Validation functions
const validateStep1 = () => {
  const errors: string[] = []
  
  if (!formData.step1.subject || formData.step1.subject.length < 3) {
    errors.push('Subject must be at least 3 characters')
  }
  
  if (!formData.step1.opportunity_id) {
    errors.push('Opportunity must be selected')
  }
  
  if (!formData.step1.interaction_date) {
    errors.push('Interaction date is required')
  }
  
  validation.step1Valid = errors.length === 0
  validation.errors.step1 = errors
}

const validateStep2 = () => {
  const errors: string[] = []
  
  if (!formData.step2.status) {
    errors.push('Status is required')
  }
  
  // Conditional validation based on interaction type
  if (formData.step1.type === 'Meeting' && !formData.step2.location) {
    errors.push('Location is required for in-person meetings')
  }
  
  if (formData.step2.duration_minutes && (formData.step2.duration_minutes < 1 || formData.step2.duration_minutes > 480)) {
    errors.push('Duration must be between 1 and 480 minutes')
  }
  
  validation.step2Valid = errors.length === 0
  validation.errors.step2 = errors
}

const validateStep3 = () => {
  const errors: string[] = []
  
  // Conditional validation for completed interactions
  if (formData.step2.status === 'COMPLETED' && !formData.step3.outcome) {
    errors.push('Outcome is required for completed interactions')
  }
  
  if (formData.step3.follow_up_required && !formData.step3.follow_up_date) {
    errors.push('Follow-up date is required when follow-up is needed')
  }
  
  if (formData.step3.rating && (formData.step3.rating < 1 || formData.step3.rating > 5)) {
    errors.push('Rating must be between 1 and 5')
  }
  
  validation.step3Valid = errors.length === 0
  validation.errors.step3 = errors
}

// Apply smart defaults when interaction type changes
watch(() => formData.step1.type, (newType: InteractionType) => {
  const defaults = INTERACTION_FORM_DEFAULTS[newType]
  if (defaults) {
    Object.assign(formData.step2, defaults)
    validateStep2()
  }
})

// Load opportunities on mount
onMounted(async () => {
  loadingOpportunities.value = true
  try {
    await opportunityStore.fetchOpportunities({}, { page: 1, limit: 100, sort_by: 'created_at', sort_order: 'desc' })
    availableOpportunities.value = opportunityStore.opportunities
  } catch (error) {
    console.error('Failed to load opportunities:', error)
  } finally {
    loadingOpportunities.value = false
  }
  
  // Load existing interaction if editing
  if (props.isEditing && props.interactionId) {
    await loadExistingInteraction()
  }
  
  // Initial validation
  validateStep1()
  validateStep2()
  validateStep3()
})

// Load existing interaction for editing
const loadExistingInteraction = async () => {
  if (!props.interactionId) return
  
  try {
    await interactionStore.fetchInteractionById(props.interactionId)
    const interaction = interactionStore.selectedInteraction
    
    if (interaction) {
      // Cast to any to avoid infinite type recursion
      const interactionData = interaction as any
      
      // Populate form data from existing interaction
      formData.step1 = {
        type: interactionData.type,
        subject: interactionData.subject || '',
        opportunity_id: interactionData.opportunity_id,
        interaction_date: interactionData.interaction_date.slice(0, 16)
      }
      
      const participantsArray: string[] = Array.isArray(interactionData.participants) ? interactionData.participants : []
      formData.step2 = {
        status: interactionData.status || 'SCHEDULED',
        duration_minutes: interactionData.duration_minutes,
        location: interactionData.location,
        contact_method: interactionData.contact_method,
        participants: participantsArray
      }
      
      formData.step3 = {
        outcome: interactionData.outcome,
        rating: interactionData.rating,
        notes: interactionData.notes || '',
        follow_up_required: interactionData.follow_up_required || false,
        follow_up_date: interactionData.follow_up_date,
        follow_up_notes: interactionData.follow_up_notes || '',
        next_action: interactionData.next_action || '',
        tags: Array.isArray(interactionData.tags) ? interactionData.tags : [],
        attachments: Array.isArray(interactionData.attachments) ? interactionData.attachments : [],
        custom_fields: interactionData.custom_fields
      }
    }
  } catch (error) {
    console.error('Failed to load interaction:', error)
  }
}

// Form submission
const handleSubmit = async () => {
  if (!canSubmit.value) return
  
  // Combine all form data and convert to database format
  const interactionData = {
    ...formData.step1,
    ...formData.step2,
    ...formData.step3
  }

  // Note: Database schema requires opportunity_id, but business logic allows null
  // This is a known limitation that should be addressed in database schema
  
  try {
    let success = false
    
    if (props.isEditing && props.interactionId) {
      success = await interactionStore.updateInteraction(props.interactionId, interactionData)
    } else {
      success = await interactionStore.createInteraction(interactionData)
    }
    
    if (success) {
      // Navigate back to interaction list or detail view
      if (props.opportunityId) {
        router.push(`/opportunities/${props.opportunityId}`)
      } else {
        router.push('/interactions')
      }
    }
  } catch (error) {
    console.error('Form submission failed:', error)
  }
}

// Save draft functionality
const saveDraft = async () => {
  // Implementation for saving draft - could store in localStorage or send to API
  console.log('Saving draft...', formData)
}
</script>

<style scoped>
.interaction-form-wrapper {
  @apply max-w-4xl mx-auto;
}
</style>