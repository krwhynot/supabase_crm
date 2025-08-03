<template>
  <div class="mobile-interaction-form">
    <!-- Mobile Header -->
    <div class="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
      <div class="flex items-center justify-between">
        <button
          @click="$emit('cancel')"
          class="touch-target p-2 text-gray-600 hover:text-gray-800"
          aria-label="Cancel"
        >
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div class="text-center">
          <h1 class="text-lg font-semibold text-gray-900">
            {{ selectedTemplate ? selectedTemplate.name : 'New Interaction' }}
          </h1>
          <p v-if="selectedTemplate" class="text-sm text-gray-600">{{ selectedTemplate.description }}</p>
        </div>
        
        <button
          @click="handleSave"
          :disabled="!isFormValid || isSaving"
          class="touch-target px-4 py-2 bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isSaving ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </div>

    <!-- Form Content -->
    <form @submit.prevent="handleSubmit" class="flex-1 overflow-y-auto">
      <div class="px-4 py-4 space-y-6">
        
        <!-- Template Selection (if no template pre-selected) -->
        <div v-if="!selectedTemplate" class="touch-section">
          <button
            @click="showTemplates = true"
            type="button"
            class="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-primary-300 transition-colors touch-target"
          >
            <svg class="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <p class="text-base font-medium text-gray-700">Choose Quick Template</p>
            <p class="text-sm text-gray-500">Or continue with custom interaction</p>
          </button>
        </div>

        <!-- Organization Selection -->
        <div class="touch-section">
          <label class="touch-label">
            Organization
            <span class="text-red-500 ml-1">*</span>
          </label>
          <div class="mt-2">
            <OrganizationLookup
              v-model="formData.organizationId"
              :error="validationErrors.organizationId"
              placeholder="Search organizations..."
              class="touch-input"
              @organization-selected="handleOrganizationSelected"
            />
          </div>
        </div>

        <!-- Interaction Type -->
        <div class="touch-section">
          <label class="touch-label">
            Type
            <span class="text-red-500 ml-1">*</span>
          </label>
          <div class="mt-2 grid grid-cols-2 gap-3">
            <button
              v-for="type in interactionTypes"
              :key="type.value"
              @click="formData.interactionType = type.value"
              type="button"
              :class="[
                'touch-target p-4 border-2 rounded-lg text-left transition-all',
                formData.interactionType === type.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-300 hover:border-gray-400'
              ]"
            >
              <div class="flex items-center space-x-3">
                <span class="text-xl">{{ type.icon }}</span>
                <div>
                  <p class="font-medium text-sm">{{ type.label }}</p>
                  <p class="text-xs text-gray-600 mt-1">{{ type.description }}</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Title -->
        <div class="touch-section">
          <label for="title" class="touch-label">
            Title
            <span class="text-red-500 ml-1">*</span>
          </label>
          <input
            id="title"
            v-model="formData.title"
            type="text"
            required
            placeholder="Enter interaction title..."
            class="touch-input"
            :class="{ 'border-red-300': validationErrors.title }"
          />
          <p v-if="validationErrors.title" class="mt-2 text-sm text-red-600">
            {{ validationErrors.title }}
          </p>
        </div>

        <!-- Description with Voice Input -->
        <div class="touch-section">
          <label for="description" class="touch-label">
            Description
          </label>
          <div class="mt-2 relative">
            <VoiceNotesInput
              v-if="selectedTemplate?.supportsVoice"
              v-model="formData.description"
              :placeholder="getDescriptionPlaceholder()"
              class="touch-input min-h-[120px]"
            />
            <textarea
              v-else
              id="description"
              v-model="formData.description"
              rows="4"
              :placeholder="getDescriptionPlaceholder()"
              class="touch-input resize-none"
            />
          </div>
        </div>

        <!-- Location (if required by template) -->
        <div v-if="shouldShowLocation" class="touch-section">
          <label class="touch-label">
            Location
            <span v-if="selectedTemplate?.requiresLocation" class="text-red-500 ml-1">*</span>
          </label>
          <div class="mt-2">
            <LocationTracker
              v-model="formData.location"
              :auto-detect="selectedTemplate?.requiresLocation"
              :error="validationErrors.location"
              @location-detected="handleLocationDetected"
            />
          </div>
        </div>

        <!-- Outcome (for completed interactions) -->
        <div v-if="formData.status === 'COMPLETED'" class="touch-section">
          <label class="touch-label">Outcome</label>
          <div class="mt-2 grid grid-cols-2 gap-3">
            <button
              v-for="outcome in outcomeOptions"
              :key="outcome.value"
              @click="formData.outcome = outcome.value"
              type="button"
              :class="[
                'touch-target p-3 border-2 rounded-lg text-center transition-all',
                formData.outcome === outcome.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-300 hover:border-gray-400'
              ]"
            >
              <span class="block text-lg mb-1">{{ outcome.icon }}</span>
              <span class="text-sm font-medium">{{ outcome.label }}</span>
            </button>
          </div>
        </div>

        <!-- Follow-up Section -->
        <div class="touch-section">
          <div class="flex items-center justify-between mb-3">
            <label class="touch-label mb-0">Follow-up Required</label>
            <button
              @click="formData.followUpRequired = !formData.followUpRequired"
              type="button"
              :class="[
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                formData.followUpRequired ? 'bg-primary-600' : 'bg-gray-200'
              ]"
            >
              <span
                :class="[
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  formData.followUpRequired ? 'translate-x-5' : 'translate-x-0'
                ]"
              />
            </button>
          </div>
          
          <div v-if="formData.followUpRequired" class="space-y-4">
            <div>
              <label for="follow-up-date" class="touch-label">
                Follow-up Date
                <span class="text-red-500 ml-1">*</span>
              </label>
              <input
                id="follow-up-date"
                v-model="formData.followUpDate"
                type="date"
                :min="tomorrow"
                class="touch-input"
                :class="{ 'border-red-300': validationErrors.followUpDate }"
              />
            </div>
            
            <div>
              <label for="follow-up-notes" class="touch-label">Follow-up Notes</label>
              <textarea
                id="follow-up-notes"
                v-model="formData.followUpNotes"
                rows="3"
                placeholder="What needs to be followed up on?"
                class="touch-input resize-none"
              />
            </div>
          </div>
        </div>

        <!-- Status and Date -->
        <div class="touch-section">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="status" class="touch-label">
                Status
                <span class="text-red-500 ml-1">*</span>
              </label>
              <select
                id="status"
                v-model="formData.status"
                class="touch-input"
              >
                <option value="PLANNED">Planned</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            
            <div>
              <label for="interaction-date" class="touch-label">
                {{ formData.status === 'PLANNED' ? 'Scheduled' : 'Date' }}
                <span class="text-red-500 ml-1">*</span>
              </label>
              <input
                id="interaction-date"
                v-model="formData.interactionDate"
                type="datetime-local"
                class="touch-input"
                :class="{ 'border-red-300': validationErrors.interactionDate }"
              />
            </div>
          </div>
        </div>

        <!-- Additional Fields -->
        <div class="touch-section">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="duration" class="touch-label">Duration (min)</label>
              <input
                id="duration"
                v-model.number="formData.duration"
                type="number"
                min="1"
                max="480"
                :placeholder="selectedTemplate?.estimatedDuration?.toString() || '30'"
                class="touch-input"
              />
            </div>
            
            <div>
              <label for="conducted-by" class="touch-label">Conducted By</label>
              <input
                id="conducted-by"
                v-model="formData.conductedBy"
                type="text"
                placeholder="Your name..."
                class="touch-input"
              />
            </div>
          </div>
        </div>
      </div>
    </form>

    <!-- Mobile Footer Actions -->
    <div class="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
      <div class="flex space-x-3">
        <button
          @click="saveDraft"
          type="button"
          :disabled="isSaving"
          class="flex-1 touch-target py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          Save Draft
        </button>
        <button
          @click="handleSubmit"
          type="submit"
          :disabled="!isFormValid || isSaving"
          class="flex-1 touch-target py-3 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isSaving ? 'Saving...' : 'Complete' }}
        </button>
      </div>
    </div>

    <!-- Offline Indicator -->
    <div v-if="!isOnline" class="fixed top-20 left-4 right-4 z-20">
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center space-x-2">
        <svg class="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span class="text-sm text-yellow-800">You're offline. Data will sync when reconnected.</span>
      </div>
    </div>

    <!-- Template Selection Modal -->
    <div v-if="showTemplates" class="fixed inset-0 z-50 bg-white">
      <QuickInteractionTemplates
        :organization-id="formData.organizationId"
        @template-selected="handleTemplateSelected"
        @close="showTemplates = false"
      />
    </div>
  </div>
</template>

<!--
  MobileInteractionForm - Touch-optimized interaction form for mobile field use
  
  Features:
  - Touch-first design with 44px minimum touch targets
  - Voice input support for hands-free operation
  - GPS location tracking for field interactions
  - Offline functionality with visual indicators
  - Template-based quick creation
  - Large, thumb-friendly buttons and inputs
  - Single-handed operation support
  - Auto-save draft functionality
  
  Mobile Optimizations:
  - Sticky header and footer for easy access
  - Large touch targets throughout
  - Simplified form layout
  - Visual feedback for all interactions
  - Gesture-friendly interface
  - One-thumb navigation
-->

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { InteractionType } from '@/types/interactions'
import { useInteractionStore } from '@/stores/interactionStore'
import type { InteractionFormWrapperData } from '@/types/interactionForm'
import QuickInteractionTemplates from './QuickInteractionTemplates.vue'
import VoiceNotesInput from './VoiceNotesInput.vue'
import LocationTracker from './LocationTracker.vue'
import OrganizationLookup from './OrganizationLookup.vue'

/**
 * Mobile interaction form data
 */
interface MobileInteractionFormData {
  interactionType: InteractionType | null
  title: string
  description: string
  organizationId: string
  opportunityId: string | null
  principalId: string | null
  status: 'PLANNED' | 'COMPLETED' | 'CANCELLED'
  interactionDate: string
  duration: number | null
  location: string
  outcome: string | null
  followUpRequired: boolean
  followUpDate: string | null
  followUpNotes: string
  conductedBy: string
}

/**
 * Template interface from QuickInteractionTemplates
 */
interface MobileInteractionTemplate {
  id: string
  name: string
  description: string
  icon: string
  category: string
  interactionType: InteractionType
  estimatedDuration: number
  requiresLocation: boolean
  supportsVoice: boolean
  autoFillFields: string[]
  titleTemplate: string
  descriptionTemplate: string
  defaultFollowUpDays?: number
}

/**
 * Component props
 */
interface Props {
  /** Initial template to use */
  template?: MobileInteractionTemplate
  /** Pre-selected organization */
  organizationId?: string
  /** Pre-selected opportunity */
  opportunityId?: string
}

const props = defineProps<Props>()

/**
 * Component emits
 */
interface Emits {
  /** Emitted when form is submitted successfully */
  success: [data: { interactionId: string }]
  /** Emitted when form is cancelled */
  cancel: []
  /** Emitted when draft is saved */
  draftSaved: [data: MobileInteractionFormData]
}

const emit = defineEmits<Emits>()

// ===============================
// STORES
// ===============================

const interactionStore = useInteractionStore()

// ===============================
// REACTIVE STATE
// ===============================

const showTemplates = ref(false)
const isSaving = ref(false)
const isOnline = ref(navigator.onLine)
const selectedTemplate = ref<MobileInteractionTemplate | null>(props.template || null)

const formData = reactive<MobileInteractionFormData>({
  interactionType: null,
  title: '',
  description: '',
  organizationId: props.organizationId || '',
  opportunityId: props.opportunityId || null,
  principalId: null,
  status: 'COMPLETED',
  interactionDate: new Date().toISOString().slice(0, 16),
  duration: null,
  location: '',
  outcome: null,
  followUpRequired: false,
  followUpDate: null,
  followUpNotes: '',
  conductedBy: ''
})

const validationErrors = ref<Record<string, string>>({})

// ===============================
// COMPUTED PROPERTIES
// ===============================

const tomorrow = computed(() => {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return date.toISOString().split('T')[0]
})

const isFormValid = computed(() => {
  return !!(
    formData.interactionType &&
    formData.title.trim() &&
    formData.organizationId &&
    formData.status &&
    formData.interactionDate &&
    (!formData.followUpRequired || formData.followUpDate)
  )
})

const shouldShowLocation = computed(() => {
  return selectedTemplate.value?.requiresLocation || 
         formData.interactionType === InteractionType.IN_PERSON ||
         formData.location
})

// ===============================
// FORM OPTIONS
// ===============================

const interactionTypes = [
  {
    value: InteractionType.CALL,
    label: 'Phone Call',
    description: 'Voice conversation',
    icon: '📞'
  },
  {
    value: InteractionType.EMAIL,
    label: 'Email',
    description: 'Email communication',
    icon: '✉️'
  },
  {
    value: InteractionType.IN_PERSON,
    label: 'In-Person',
    description: 'Face-to-face meeting',
    icon: '👥'
  },
  {
    value: InteractionType.DEMO,
    label: 'Demo',
    description: 'Product demonstration',
    icon: '🖥️'
  },
  {
    value: InteractionType.FOLLOW_UP,
    label: 'Follow-up',
    description: 'Follow-up interaction',
    icon: '📅'
  }
]

const outcomeOptions = [
  { value: 'POSITIVE', label: 'Positive', icon: '✅' },
  { value: 'NEUTRAL', label: 'Neutral', icon: '➖' },
  { value: 'NEGATIVE', label: 'Negative', icon: '❌' },
  { value: 'FOLLOW_UP_NEEDED', label: 'Follow-up', icon: '📅' },
  { value: 'OPPORTUNITY_CREATED', label: 'Opportunity', icon: '🎯' },
  { value: 'DEAL_ADVANCED', label: 'Advanced', icon: '📈' }
]

// ===============================
// EVENT HANDLERS
// ===============================

const handleTemplateSelected = (template: MobileInteractionTemplate) => {
  selectedTemplate.value = template
  showTemplates.value = false
  
  // Auto-fill form based on template
  formData.interactionType = template.interactionType
  formData.title = template.titleTemplate.replace('{organization}', 'Selected Organization')
  formData.description = template.descriptionTemplate.replace('{organization}', 'Selected Organization')
  formData.duration = template.estimatedDuration
  
  // Set default follow-up if template specifies
  if (template.defaultFollowUpDays) {
    formData.followUpRequired = true
    const followUpDate = new Date()
    followUpDate.setDate(followUpDate.getDate() + template.defaultFollowUpDays)
    formData.followUpDate = followUpDate.toISOString().split('T')[0]
  }
}

const handleOrganizationSelected = (organizationId: string, organizationData: any) => {
  formData.organizationId = organizationId
  
  // Update template titles with organization name
  if (selectedTemplate.value && organizationData?.name) {
    formData.title = selectedTemplate.value.titleTemplate.replace('{organization}', organizationData.name)
    formData.description = selectedTemplate.value.descriptionTemplate.replace('{organization}', organizationData.name)
  }
}

const handleLocationDetected = (location: { address: string; coordinates?: { lat: number; lng: number } }) => {
  formData.location = location.address
}

const getDescriptionPlaceholder = (): string => {
  if (selectedTemplate.value?.supportsVoice) {
    return 'Tap the microphone to record notes, or type manually...'
  }
  return 'Enter interaction details...'
}

const validateForm = (): boolean => {
  const errors: Record<string, string> = {}
  
  if (!formData.interactionType) {
    errors.interactionType = 'Interaction type is required'
  }
  
  if (!formData.title.trim()) {
    errors.title = 'Title is required'
  }
  
  if (!formData.organizationId) {
    errors.organizationId = 'Organization is required'
  }
  
  if (!formData.interactionDate) {
    errors.interactionDate = 'Date is required'
  }
  
  if (formData.followUpRequired && !formData.followUpDate) {
    errors.followUpDate = 'Follow-up date is required'
  }
  
  if (selectedTemplate.value?.requiresLocation && !formData.location.trim()) {
    errors.location = 'Location is required for this interaction type'
  }
  
  validationErrors.value = errors
  return Object.keys(errors).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }
  
  isSaving.value = true
  
  try {
    // Convert mobile form data to interaction store format
    const interactionData: InteractionFormWrapperData = {
      interactionType: formData.interactionType!,
      date: formData.interactionDate.split('T')[0], // Extract date part
      subject: formData.title,
      notes: buildInteractionNotes(),
      selectedOpportunity: formData.opportunityId,
      selectedContact: null, // TODO: Add contact selection to mobile form
      followUpNeeded: formData.followUpRequired,
      followUpDate: formData.followUpDate
    }
    
    // Create interaction using the store
    const success = await interactionStore.createInteraction(interactionData)
    
    if (success) {
      // Clear offline queue if this was saved offline
      if (!isOnline.value) {
        // Add to offline queue for later sync
        await addToOfflineQueue(interactionData)
      }
      
      emit('success', { interactionId: 'mobile-' + Date.now() })
    } else {
      throw new Error('Failed to create interaction')
    }
    
  } catch (error) {
    console.error('Failed to save interaction:', error)
    
    // If offline or error, save to offline queue
    if (!isOnline.value) {
      try {
        const interactionData: InteractionFormWrapperData = {
          interactionType: formData.interactionType!,
          date: formData.interactionDate.split('T')[0],
          subject: formData.title,
          notes: buildInteractionNotes(),
          selectedOpportunity: formData.opportunityId,
          selectedContact: null,
          followUpNeeded: formData.followUpRequired,
          followUpDate: formData.followUpDate
        }
        
        await addToOfflineQueue(interactionData)
        emit('success', { interactionId: 'offline-' + Date.now() })
      } catch (offlineError) {
        console.error('Failed to save to offline queue:', offlineError)
        // Show error to user
      }
    }
  } finally {
    isSaving.value = false
  }
}

const handleSave = () => {
  handleSubmit()
}

const saveDraft = async () => {
  isSaving.value = true
  
  try {
    // Save to localStorage for offline access
    const draftKey = `crm-interaction-draft-${Date.now()}`
    localStorage.setItem(draftKey, JSON.stringify({
      ...formData,
      template: selectedTemplate.value,
      savedAt: new Date().toISOString()
    }))
    
    emit('draftSaved', formData)
    
    // Show success feedback
    setTimeout(() => {
      isSaving.value = false
    }, 500)
    
  } catch (error) {
    console.error('Failed to save draft:', error)
    isSaving.value = false
  }
}

/**
 * Build comprehensive interaction notes from form data
 */
const buildInteractionNotes = (): string => {
  const notes = []
  
  // Add main description
  if (formData.description.trim()) {
    notes.push(formData.description.trim())
  }
  
  // Add location if provided
  if (formData.location.trim()) {
    notes.push(`\nLocation: ${formData.location}`)
  }
  
  // Add duration if provided
  if (formData.duration) {
    notes.push(`Duration: ${formData.duration} minutes`)
  }
  
  // Add outcome if provided
  if (formData.outcome) {
    notes.push(`Outcome: ${formData.outcome}`)
  }
  
  // Add conducted by if provided
  if (formData.conductedBy.trim()) {
    notes.push(`Conducted by: ${formData.conductedBy}`)
  }
  
  // Add template context if used
  if (selectedTemplate.value) {
    notes.push(`\n[Created using ${selectedTemplate.value.name} template]`)
  }
  
  // Add mobile context
  notes.push('[Created via mobile app]')
  
  return notes.join('\n')
}

/**
 * Add interaction to offline queue for later sync
 */
const addToOfflineQueue = async (interactionData: InteractionFormWrapperData): Promise<void> => {
  try {
    // Use the OfflineInteractionQueue component's functionality
    const queueItem = {
      id: `mobile-offline-${Date.now()}`,
      interaction: interactionData,
      timestamp: Date.now(),
      retryCount: 0,
      metadata: {
        template: selectedTemplate.value?.name,
        location: formData.location,
        device: 'mobile',
        userAgent: navigator.userAgent
      }
    }
    
    // Get existing queue from localStorage
    const existingQueue = JSON.parse(localStorage.getItem('crm-offline-interactions') || '[]')
    existingQueue.push(queueItem)
    
    // Save updated queue
    localStorage.setItem('crm-offline-interactions', JSON.stringify(existingQueue))
    
    // Trigger service worker sync if available
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready
      await registration.sync.register('interaction-sync')
    }
  } catch (error) {
    console.error('Failed to add to offline queue:', error)
    throw error
  }
}

// ===============================
// NETWORK STATUS MONITORING
// ===============================

const handleOnline = () => {
  isOnline.value = true
}

const handleOffline = () => {
  isOnline.value = false
}

// ===============================
// LIFECYCLE
// ===============================

onMounted(() => {
  // Monitor network status
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  // Initialize form with template if provided
  if (selectedTemplate.value) {
    handleTemplateSelected(selectedTemplate.value)
  }
  
  // Set default interaction date to now
  if (!formData.interactionDate) {
    formData.interactionDate = new Date().toISOString().slice(0, 16)
  }
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})
</script>

<style scoped>
.mobile-interaction-form {
  @apply h-screen flex flex-col bg-gray-50;
}

.touch-target {
  @apply min-h-[44px] min-w-[44px] flex items-center justify-center;
}

.touch-section {
  @apply bg-white rounded-lg border border-gray-200 p-4;
}

.touch-label {
  @apply block text-sm font-medium text-gray-700 mb-2;
}

.touch-input {
  @apply w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors;
}

/* Focus styles for better accessibility */
button:focus-visible,
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  @apply outline-none ring-2 ring-primary-500 ring-offset-2;
}

/* Active states for better touch feedback */
button:active {
  @apply transform scale-95;
}

/* Ensure proper touch targets on small screens */
@media (max-width: 375px) {
  .touch-target {
    @apply min-h-[48px] min-w-[48px];
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .mobile-interaction-form {
    @apply bg-gray-900;
  }
  
  .touch-section {
    @apply bg-gray-800 border-gray-700;
  }
  
  .touch-label {
    @apply text-gray-300;
  }
  
  .touch-input {
    @apply bg-gray-700 border-gray-600 text-white;
  }
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  * {
    @apply transition-none;
  }
}
</style>