<template>
  <div class="max-w-4xl mx-auto">
    <!-- Multi-step Progress Indicator -->
    <div class="mb-8">
      <nav aria-label="Progress">
        <ol role="list" class="flex items-center justify-center">
          <li
            v-for="(step, index) in steps"
            :key="step.id"
            :class="[
              index !== steps.length - 1 ? 'pr-8 sm:pr-20' : '',
              'relative'
            ]"
          >
            <!-- Step Connector Line -->
            <div
              v-if="index !== steps.length - 1"
              class="absolute inset-0 flex items-center"
              aria-hidden="true"
            >
              <div
                :class="[
                  'h-0.5 w-full',
                  index + 1 < currentStep ? 'bg-primary-600' : 'bg-gray-200'
                ]"
              />
            </div>

            <!-- Step Content -->
            <div
              :class="[
                'relative flex h-10 w-10 items-center justify-center rounded-full',
                getStepClasses(index + 1)
              ]"
            >
              <!-- Completed Step -->
              <template v-if="index + 1 < currentStep">
                <svg
                  class="h-5 w-5 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </template>
              
              <!-- Current or Future Step -->
              <template v-else>
                <span
                  :class="[
                    'text-sm font-semibold',
                    index + 1 === currentStep ? 'text-white' : 'text-gray-500'
                  ]"
                >
                  {{ index + 1 }}
                </span>
              </template>
            </div>

            <!-- Step Label -->
            <div class="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <span
                :class="[
                  'text-sm font-medium',
                  index + 1 === currentStep 
                    ? 'text-primary-600' 
                    : index + 1 < currentStep
                      ? 'text-green-600'
                      : 'text-gray-500'
                ]"
              >
                {{ step.title }}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      <!-- Step Description -->
      <div class="mt-12 text-center">
        <h2 class="text-2xl font-bold text-gray-900">
          {{ currentStepData.title }}
        </h2>
        <p class="mt-2 text-gray-600">
          {{ currentStepData.description }}
        </p>
      </div>
    </div>

    <!-- Auto-save Status -->
    <div
      v-if="autoSaveStatus"
      class="mb-4 flex items-center justify-center text-sm"
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
      class="mb-6 p-4 bg-red-50 border border-red-200 rounded-md"
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

    <!-- Form Content -->
    <div class="bg-white shadow-sm rounded-lg border border-gray-200">
      <div class="p-6">
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

      <!-- Form Actions -->
      <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div class="flex items-center justify-between">
          <!-- Back Button -->
          <Button
            v-if="currentStep > 1"
            variant="secondary"
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

          <!-- Next/Submit Button -->
          <Button
            :variant="isLastStep ? 'success' : 'primary'"
            :loading="isSubmitting || isValidating"
            :disabled="!isCurrentStepValid || isSubmitting"
            @click="handleNextOrSubmit"
          >
            {{ isLastStep ? 'Create Organization' : 'Next' }}
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

        <!-- Step Indicator -->
        <div class="mt-4 text-center text-sm text-gray-500">
          Step {{ currentStep }} of {{ totalSteps }}
        </div>
      </div>
    </div>

    <!-- Contact Status Warning -->
    <ContactStatusWarning
      v-if="showContactWarning"
      :organization-name="formData.name"
      class="mt-6"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useOrganizationStore } from '@/stores/organizationStore'
import { organizationCreateSchema } from '@/types/organizations'
import type { OrganizationCreateForm } from '@/types/organizations'
import Button from '@/components/atomic/Button.vue'
import OrganizationStepOne from './OrganizationStepOne.vue'
import OrganizationStepTwo from './OrganizationStepTwo.vue'
import OrganizationStepThree from './OrganizationStepThree.vue'
import ContactStatusWarning from './ContactStatusWarning.vue'

/**
 * Props interface for form wrapper
 */
interface Props {
  /** Initial form data (for editing) */
  initialData?: Partial<OrganizationCreateForm>
  /** Whether this is an edit operation */
  isEditing?: boolean
  /** Organization ID for editing */
  organizationId?: string
  /** Show contact warning */
  showContactWarning?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isEditing: false,
  showContactWarning: true
})

/**
 * Form events
 */
interface Emits {
  'success': [organizationId: string]
  'cancel': []
  'draft-saved': [formData: Partial<OrganizationCreateForm>]
}

const emit = defineEmits<Emits>()

// Dependencies
const router = useRouter()
const organizationStore = useOrganizationStore()

// Form state
const currentStep = ref(1)
const totalSteps = 3
const isSubmitting = ref(false)
const isValidating = ref(false)
const globalError = ref('')
const autoSaveStatus = ref<'saving' | 'saved' | 'error' | null>(null)

// Step validation state
const stepValidation = reactive({
  1: false,
  2: true, // Step 2 has no required fields
  3: true  // Step 3 has no required fields
})

// Form data with default values
const formData = reactive<Partial<OrganizationCreateForm>>({
  name: '',
  industry: '', // Maps to segment
  lead_score: null, // Maps to priority
  type: null,
  status: 'Prospect',
  address_line_1: '',
  city: '',
  state_province: '',
  postal_code: '',
  primary_phone: '',
  website: '',
  assigned_user_id: null,
  description: '',
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
    description: 'Enter organization name, priority, segment, and business type',
    component: 'OrganizationStepOne',
    requiredFields: ['name', 'industry', 'lead_score']
  },
  {
    id: 2,
    title: 'Organization Info',
    description: 'Add address, phone, and additional notes',
    component: 'OrganizationStepTwo',
    requiredFields: []
  },
  {
    id: 3,
    title: 'Contact Info',
    description: 'Select existing contacts or create new contacts',
    component: 'OrganizationStepThree',
    requiredFields: []
  }
]

/**
 * Computed properties
 */
const currentStepData = computed(() => steps[currentStep.value - 1])

const currentStepComponent = computed(() => {
  const componentMap = {
    OrganizationStepOne,
    OrganizationStepTwo,
    OrganizationStepThree
  }
  return componentMap[currentStepData.value.component as keyof typeof componentMap]
})

const isLastStep = computed(() => currentStep.value === totalSteps)

const stepErrors = computed(() => formErrors[currentStep.value] || {})

const isCurrentStepValid = computed(() => stepValidation[currentStep.value as keyof typeof stepValidation])

/**
 * Step styling
 */
const getStepClasses = (stepNumber: number) => {
  if (stepNumber < currentStep.value) {
    return 'bg-primary-600' // Completed
  } else if (stepNumber === currentStep.value) {
    return 'bg-primary-600' // Current
  } else {
    return 'bg-gray-200' // Future
  }
}

/**
 * Form data handling
 */
const handleFormDataUpdate = (newData: Partial<OrganizationCreateForm>) => {
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
    const requiredFields = currentStepData.value.requiredFields
    const stepData: Record<string, any> = {}
    
    // Extract data for current step
    requiredFields.forEach(field => {
      stepData[field] = formData[field as keyof typeof formData]
    })
    
    // Validate step data
    if (requiredFields.length > 0) {
      const partialSchema = organizationCreateSchema.pick(requiredFields as any)
      await partialSchema.validate(stepData, { abortEarly: false })
    }
    
    // Mark step as valid
    await handleStepValidation(currentStep.value, true, {})
    return true
    
  } catch (error: any) {
    const errors: Record<string, string> = {}
    
    if (error.inner) {
      error.inner.forEach((err: any) => {
        if (err.path) {
          errors[err.path] = err.message
        }
      })
    } else {
      errors.general = error.message || 'Validation failed'
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
    
    // Extract contact data from custom_fields
    const customFields = formData.custom_fields as any
    const contactData = {
      mode: customFields?.contact_mode || 'select',
      selectedContactIds: customFields?.selected_contact_ids || [],
      newContacts: customFields?.new_contacts || []
    }
    
    // Transform form data for submission
    const organizationData = {
      ...formData,
      // Ensure required fields are present
      name: formData.name || '',
      industry: formData.industry || null,
      lead_score: formData.lead_score || null,
      // Clean up tags array to remove undefined values
      tags: formData.tags?.filter(tag => tag !== undefined) || null,
      // Remove contact data from custom_fields as it will be handled separately
      custom_fields: customFields ? {
        ...customFields,
        contact_mode: undefined,
        selected_contact_ids: undefined,
        new_contacts: undefined
      } : {}
    }
    
    // Submit to store with contact data
    let result
    if (props.isEditing && props.organizationId) {
      result = await organizationStore.updateOrganizationWithContacts(
        props.organizationId, 
        organizationData as any,
        contactData
      )
    } else {
      result = await organizationStore.createOrganizationWithContacts(
        organizationData as any,
        contactData
      )
    }
    
    if (result) {
      // Clear auto-saved draft
      clearAutoSavedDraft()
      
      // Emit success
      emit('success', result.id)
      
      // Navigate to organization detail
      router.push(`/organizations/${result.id}`)
    } else {
      globalError.value = 'Failed to save organization. Please try again.'
    }
    
  } catch (error: any) {
    globalError.value = error.message || 'An unexpected error occurred'
    console.error('Form submission error:', error)
    
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
    const draftKey = props.isEditing ? `org-edit-draft-${props.organizationId}` : 'org-create-draft'
    localStorage.setItem(draftKey, JSON.stringify({
      formData: { ...formData },
      currentStep: currentStep.value,
      timestamp: Date.now()
    }))
    
    autoSaveStatus.value = 'saved'
    emit('draft-saved', { ...formData })
    
    // Clear saved status after 3 seconds
    setTimeout(() => {
      autoSaveStatus.value = null
    }, 3000)
    
  } catch (error) {
    autoSaveStatus.value = 'error'
    console.error('Auto-save error:', error)
    
    setTimeout(() => {
      autoSaveStatus.value = null
    }, 3000)
  }
}

const loadAutoSavedDraft = () => {
  try {
    const draftKey = props.isEditing ? `org-edit-draft-${props.organizationId}` : 'org-create-draft'
    const savedDraft = localStorage.getItem(draftKey)
    
    if (savedDraft) {
      const draft = JSON.parse(savedDraft)
      const ageInMinutes = (Date.now() - draft.timestamp) / (1000 * 60)
      
      // Only load drafts less than 1 hour old
      if (ageInMinutes < 60 && !props.initialData) {
        Object.assign(formData, draft.formData)
        currentStep.value = draft.currentStep || 1
      }
    }
  } catch (error) {
    console.error('Failed to load auto-saved draft:', error)
  }
}

const clearAutoSavedDraft = () => {
  try {
    const draftKey = props.isEditing ? `org-edit-draft-${props.organizationId}` : 'org-create-draft'
    localStorage.removeItem(draftKey)
  } catch (error) {
    console.error('Failed to clear auto-saved draft:', error)
  }
}

/**
 * Utility functions
 */
const focusFirstInput = () => {
  nextTick(() => {
    const firstInput = document.querySelector('input, select, textarea') as HTMLElement
    firstInput?.focus()
  })
}

/**
 * Lifecycle hooks
 */
onMounted(() => {
  // Load auto-saved draft if available
  loadAutoSavedDraft()
  
  // Focus first input
  focusFirstInput()
})

/**
 * Keyboard navigation
 */
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('cancel')
  }
}

// Add keyboard event listener
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

// Remove keyboard event listener
import { onUnmounted } from 'vue'
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout)
  }
})
</script>