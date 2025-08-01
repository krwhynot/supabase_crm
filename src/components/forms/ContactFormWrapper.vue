<template>
  <div class="max-w-4xl mx-auto">
    <!-- Compact Progress Indicator -->
    <div class="mb-3">
      <div class="flex items-center justify-center space-x-2 mb-2">
        <div
          v-for="(step, index) in steps"
          :key="step.id"
          :class="[
            'h-1.5 w-6 rounded-full transition-colors duration-200',
            index + 1 <= currentStep ? 'bg-primary-600' : 'bg-gray-200'
          ]"
          :aria-label="`Step ${index + 1}: ${step.title}`"
        />
      </div>
      
      <!-- Compact Step Header -->
      <div class="text-center">
        <h2 class="text-base font-medium text-gray-900">
          {{ currentStepData.title }}
        </h2>
        <p class="text-xs text-gray-600 mt-0.5">
          {{ currentStepData.description }}
        </p>
      </div>
    </div>

    <!-- Auto-save Status -->
    <div
      v-if="autoSaveStatus"
      class="mb-3 flex items-center justify-center text-xs"
    >
      <div
        :class="[
          'flex items-center space-x-2 px-3 py-1 rounded-full',
          autoSaveStatus === 'saving' ? 'bg-blue-50 text-blue-700' :
          autoSaveStatus === 'saved' ? 'bg-green-50 text-green-700' :
          'bg-red-50 text-red-700'
        ]"
      >
        <!-- Saving Spinner -->
        <svg
          v-if="autoSaveStatus === 'saving'"
          class="animate-spin h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        
        <!-- Saved Check -->
        <svg
          v-else-if="autoSaveStatus === 'saved'"
          class="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
        
        <!-- Error Icon -->
        <svg
          v-else
          class="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>

        <span>
          {{ 
            autoSaveStatus === 'saving' ? 'Saving draft...' :
            autoSaveStatus === 'saved' ? 'Draft saved' :
            'Failed to save draft'
          }}
        </span>
      </div>
    </div>

    <!-- Global Form Errors -->
    <div
      v-if="globalError"
      class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md"
      role="alert"
    >
      <div class="flex items-start">
        <svg
          class="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <h3 class="text-sm font-medium text-red-800">Error</h3>
          <p class="mt-1 text-sm text-red-700">{{ globalError }}</p>
        </div>
      </div>
    </div>

    <!-- Form Content with Reduced Padding -->
    <div class="bg-white shadow-sm rounded-lg border border-gray-200">
      <div class="p-3 md:p-4">
        <!-- Step Components -->
        <component
          :is="currentStepComponent"
          :model-value="formData"
          :errors="stepErrors"
          :loading="isValidating"
          @validate="handleStepValidation"
          @update:modelValue="handleFormDataUpdate"
        />
      </div>
    </div>

    <!-- Floating Action Bar -->
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:relative md:bg-gray-50 md:border-0 md:shadow-none md:mt-3 md:rounded-lg">
      <div class="max-w-4xl mx-auto px-3 py-2 md:px-4 md:py-3">
        <div class="flex items-center justify-between">
          <!-- Back Button -->
          <Button
            v-if="currentStep > 1"
            variant="secondary"
            size="sm"
            :disabled="isSubmitting"
            @click="goToPreviousStep"
          >
            <svg
              class="h-4 w-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </Button>
          <div v-else></div>

          <div class="flex items-center space-x-3">
            <!-- Step Indicator -->
            <div class="text-xs text-gray-500">
              Step {{ currentStep }} of {{ totalSteps }}
            </div>
            
            <!-- Next/Submit Button -->
            <Button
              :variant="isLastStep ? 'success' : 'primary'"
              size="sm"
              :loading="isSubmitting || isValidating"
              :disabled="!isCurrentStepValid || isSubmitting"
              @click="handleNextOrSubmit"
            >
              {{ isLastStep ? 'Create Contact' : 'Next' }}
              <svg
                v-if="!isLastStep"
                class="h-4 w-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useContactStore } from '@/stores/contactStore'
import { ContactValidator } from '@/types/contacts'
import type { ContactCreateForm, ContactFormData } from '@/types/contacts'
import Button from '@/components/atomic/Button.vue'
import ContactStepOne from './ContactStepOne.vue'
import ContactStepTwo from './ContactStepTwo.vue'
import ContactStepThree from './ContactStepThree.vue'

/**
 * Props interface for contact form wrapper
 */
interface Props {
  /** Initial form data (for editing) */
  initialData?: Partial<ContactCreateForm>
  /** Whether this is an edit operation */
  isEditing?: boolean
  /** Contact ID for editing */
  contactId?: string
}

const props = withDefaults(defineProps<Props>(), {
  isEditing: false
})

/**
 * Form events
 */
interface Emits {
  'success': [contactId: string]
  'cancel': []
  'draft-saved': [formData: Partial<ContactCreateForm>]
}

const emit = defineEmits<Emits>()

// Dependencies
const router = useRouter()
const contactStore = useContactStore()

// Form state
const currentStep = ref(1)
const totalSteps = 3
const isSubmitting = ref(false)
const isValidating = ref(false)
const globalError = ref('')
const autoSaveStatus = ref<'saving' | 'saved' | 'error' | null>(null)

// Step validation state
const stepValidation = reactive({
  1: false, // Step 1 has required fields
  2: false, // Step 2 has required fields
  3: true   // Step 3 has no required fields
})

// Form data with default values
const formData = reactive<Partial<ContactFormData>>({
  first_name: '',
  last_name: '', 
  organization_id: '',
  position: '',
  purchase_influence: 'Unknown',
  decision_authority: 'End User',
  preferred_principals: [],
  email: null,
  phone: null,
  address: null,
  city: null,
  state: null,
  zip_code: null,
  website: null,
  account_manager: null,
  notes: null,
  is_primary: false,
  ...props.initialData
})

// Form errors
const formErrors = reactive<Record<string, Record<string, string>>>({
  1: {},
  2: {},
  3: {}
})

/**
 * Step configuration
 */
const steps = [
  {
    id: 1,
    title: 'Basic Info',
    description: 'Enter contact name, organization, position, and contact details',
    component: 'ContactStepOne',
    requiredFields: ['first_name', 'last_name', 'organization_id', 'position'],
    optionalFields: ['email', 'phone']
  },
  {
    id: 2,
    title: 'Authority & Influence',
    description: 'Define purchase influence and decision authority',
    component: 'ContactStepTwo',
    requiredFields: ['purchase_influence', 'decision_authority'],
    optionalFields: ['preferred_principals']
  },
  {
    id: 3,
    title: 'Contact Details',
    description: 'Add address, website, and additional information',
    component: 'ContactStepThree',
    requiredFields: [],
    optionalFields: ['address', 'city', 'state', 'zip_code', 'website', 'account_manager', 'notes', 'is_primary']
  }
]

/**
 * Computed properties
 */
const currentStepData = computed(() => steps[currentStep.value - 1])

const currentStepComponent = computed(() => {
  const componentMap = {
    ContactStepOne,
    ContactStepTwo,
    ContactStepThree
  }
  return componentMap[currentStepData.value.component as keyof typeof componentMap]
})

const isLastStep = computed(() => currentStep.value === totalSteps)

const stepErrors = computed(() => formErrors[currentStep.value] || {})

const isCurrentStepValid = computed(() => stepValidation[currentStep.value as keyof typeof stepValidation])

/**
 * Form data handling
 */
const handleFormDataUpdate = (newData: Partial<ContactCreateForm>) => {
  Object.assign(formData, newData)
  
  // Auto-save draft after data changes
  debouncedAutoSave()
}

/**
 * Step validation
 */
const handleStepValidation = async (stepNumber: number, isValid: boolean, errors: Record<string, string> = {}) => {
  stepValidation[stepNumber as keyof typeof stepValidation] = isValid
  formErrors[stepNumber] = errors
  
  // Clear global error when step becomes valid
  if (isValid && globalError.value) {
    globalError.value = ''
  }
}

const validateCurrentStep = async (): Promise<boolean> => {
  isValidating.value = true
  
  try {
    const allStepFields = [...currentStepData.value.requiredFields, ...currentStepData.value.optionalFields]
    const stepData: Record<string, any> = {}
    
    // Extract data for current step
    allStepFields.forEach(field => {
      stepData[field] = formData[field as keyof typeof formData]
    })
    
    // Validate step data using step-specific validation
    let validationResult
    switch (currentStep.value) {
      case 1:
        validationResult = await ContactValidator.validateStepOne(stepData)
        break
      case 2:
        validationResult = await ContactValidator.validateStepTwo(stepData)
        break
      case 3:
        validationResult = await ContactValidator.validateStepThree(stepData)
        break
      default:
        throw new Error('Invalid step number')
    }
    
    if (validationResult.isValid) {
      // Mark step as valid
      await handleStepValidation(currentStep.value, true, {})
      return true
    } else {
      // Handle validation errors
      const errors: Record<string, string> = {}
      validationResult.errors.forEach(error => {
        errors[error.field] = error.message
      })
      
      await handleStepValidation(currentStep.value, false, errors)
      return false
    }
    
  } catch (error: any) {
    const errors: Record<string, string> = {
      general: error.message || 'Validation failed'
    }
    
    await handleStepValidation(currentStep.value, false, errors)
    return false
    
  } finally {
    isValidating.value = false
  }
}

/**
 * Navigation handlers
 */
const goToNextStep = async () => {
  if (currentStep.value < totalSteps) {
    const isValid = await validateCurrentStep()
    if (isValid) {
      currentStep.value++
      await nextTick()
      // Focus first input in next step
      focusFirstInput()
    }
  }
}

const goToPreviousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
    nextTick(() => {
      focusFirstInput()
    })
  }
}

const handleNextOrSubmit = async () => {
  if (isLastStep.value) {
    await handleSubmit()
  } else {
    await goToNextStep()
  }
}

/**
 * Form submission
 */
const handleSubmit = async () => {
  try {
    isSubmitting.value = true
    globalError.value = ''
    
    // Validate all steps
    for (let step = 1; step <= totalSteps; step++) {
      currentStep.value = step
      const isValid = await validateCurrentStep()
      if (!isValid) {
        globalError.value = `Please fix errors in Step ${step}`
        return
      }
    }
    
    // Final validation with complete schema
    const validationResult = await ContactValidator.validateCreate(formData)
    if (!validationResult.isValid) {
      globalError.value = 'Please fix all validation errors'
      return
    }
    
    // Submit contact data
    let result
    if (props.isEditing && props.contactId) {
      result = await contactStore.updateContact(props.contactId, validationResult.data!)
    } else {
      result = await contactStore.createContact(validationResult.data!)
    }
    
    if (result) {
      // Clear auto-saved draft
      clearAutoSavedDraft()
      
      // Emit success
      emit('success', result.id)
      
      // Navigate to contact detail
      router.push(`/contacts/${result.id}`)
    } else {
      globalError.value = 'Failed to save contact. Please try again.'
    }
    
  } catch (error: any) {
    globalError.value = error.message || 'An unexpected error occurred'
    console.error('Contact form submission error:', error)
    
  } finally {
    isSubmitting.value = false
  }
}

/**
 * Auto-save functionality
 */
let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null

const debouncedAutoSave = () => {
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout)
  }
  
  autoSaveTimeout = setTimeout(async () => {
    await saveFormDraft()
  }, 2000) // Save 2 seconds after last change
}

const saveFormDraft = async () => {
  try {
    autoSaveStatus.value = 'saving'
    
    // Save to localStorage
    const draftKey = props.isEditing ? `contact-edit-draft-${props.contactId}` : 'contact-create-draft'
    localStorage.setItem(draftKey, JSON.stringify({
      formData: { ...formData },
      currentStep: currentStep.value,
      timestamp: Date.now()
    }))
    
    autoSaveStatus.value = 'saved'
    
    // Hide status after 3 seconds
    setTimeout(() => {
      if (autoSaveStatus.value === 'saved') {
        autoSaveStatus.value = null
      }
    }, 3000)
    
    // Emit draft-saved event
    emit('draft-saved', { ...formData })
    
  } catch (error) {
    autoSaveStatus.value = 'error'
    console.error('Failed to save draft:', error)
    
    setTimeout(() => {
      if (autoSaveStatus.value === 'error') {
        autoSaveStatus.value = null
      }
    }, 5000)
  }
}

const loadAutoSavedDraft = async () => {
  try {
    const draftKey = props.isEditing ? `contact-edit-draft-${props.contactId}` : 'contact-create-draft'
    const savedDraft = localStorage.getItem(draftKey)
    
    if (savedDraft) {
      const draft = JSON.parse(savedDraft)
      const age = Date.now() - draft.timestamp
      
      // Only load drafts less than 1 hour old
      if (age < 3600000) {
        Object.assign(formData, draft.formData)
        currentStep.value = draft.currentStep || 1
      } else {
        // Remove old draft
        localStorage.removeItem(draftKey)
      }
    }
  } catch (error) {
    console.error('Failed to load auto-saved draft:', error)
  }
}

const clearAutoSavedDraft = () => {
  try {
    const draftKey = props.isEditing ? `contact-edit-draft-${props.contactId}` : 'contact-create-draft'
    localStorage.removeItem(draftKey)
  } catch (error) {
    console.error('Failed to clear auto-saved draft:', error)
  }
}

/**
 * Focus management
 */
const focusFirstInput = () => {
  nextTick(() => {
    const firstInput = document.querySelector('input, select, textarea') as HTMLElement
    if (firstInput) {
      firstInput.focus()
    }
  })
}

/**
 * Lifecycle hooks
 */
onMounted(async () => {
  // Load auto-saved draft if not editing
  if (!props.isEditing) {
    await loadAutoSavedDraft()
  }
  
  // Focus first input
  focusFirstInput()
  
  // Initial validation
  await validateCurrentStep()
})
</script>