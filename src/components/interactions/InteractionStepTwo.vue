<!--
  InteractionStepTwo.vue
  Second step of interaction form - Details and logistics
  Status, duration, location, contact method, participants
-->
<template>
  <div class="interaction-step-two space-y-6">
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Status -->
      <div>
        <label for="status" class="block text-sm font-medium text-gray-700 mb-2">
          Status <span class="text-red-500">*</span>
        </label>
        <select
          id="status"
          v-model="localFormData.status"
          @change="handleStatusChange"
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          :class="{ 'border-red-300': hasError('status') }"
        >
          <option v-for="status in INTERACTION_STATUSES" :key="status.value" :value="status.value">
            {{ status.label }}
          </option>
        </select>
        <p v-if="hasError('status')" class="mt-1 text-sm text-red-600">
          {{ getError('status') }}
        </p>
      </div>

      <!-- Duration -->
      <div>
        <label for="duration" class="block text-sm font-medium text-gray-700 mb-2">
          Duration (minutes)
        </label>
        <input
          id="duration"
          type="number"
          v-model.number="localFormData.duration_minutes"
          @input="handleDurationChange"
          placeholder="e.g., 30"
          min="1"
          max="480"
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          :class="{ 'border-red-300': hasError('duration_minutes') }"
        />
        <p v-if="hasError('duration_minutes')" class="mt-1 text-sm text-red-600">
          {{ getError('duration_minutes') }}
        </p>
        <p class="mt-1 text-sm text-gray-500">
          Leave blank if duration is not applicable
        </p>
      </div>
    </div>

    <!-- Location (conditional) -->
    <div v-if="requiresLocation">
      <label for="location" class="block text-sm font-medium text-gray-700 mb-2">
        Location <span v-if="interactionType === 'Meeting'" class="text-red-500">*</span>
      </label>
      <input
        id="location"
        type="text"
        v-model="localFormData.location"
        @input="handleLocationChange"
        placeholder="Meeting location, address, or venue"
        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        :class="{ 'border-red-300': hasError('location') }"
        maxlength="255"
      />
      <p v-if="hasError('location')" class="mt-1 text-sm text-red-600">
        {{ getError('location') }}
      </p>
    </div>

    <!-- Contact Method -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div>
        <label for="contact-method" class="block text-sm font-medium text-gray-700 mb-2">
          Contact Method
        </label>
        <select
          id="contact-method"
          v-model="localFormData.contact_method"
          @change="handleContactMethodChange"
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="">Select method...</option>
          <option v-for="method in contactMethods" :key="method" :value="method">
            {{ method }}
          </option>
        </select>
        <p class="mt-1 text-sm text-gray-500">
          How was this interaction conducted?
        </p>
      </div>

      <!-- Participants Count (simplified) -->
      <div>
        <label for="participant-count" class="block text-sm font-medium text-gray-700 mb-2">
          Number of Participants
        </label>
        <input
          id="participant-count"
          type="number"
          v-model.number="participantCount"
          @input="handleParticipantCountChange"
          placeholder="1"
          min="1"
          max="20"
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
        <p class="mt-1 text-sm text-gray-500">
          Total people involved in this interaction
        </p>
      </div>
    </div>

    <!-- Smart Suggestions -->
    <div v-if="showSuggestions" class="bg-blue-50 rounded-lg p-4">
      <div class="flex">
        <LightBulbIcon class="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
        <div>
          <h4 class="text-sm font-medium text-blue-900 mb-2">Smart Suggestions</h4>
          <div class="space-y-2">
            <div v-for="suggestion in suggestions" :key="suggestion.field" class="flex items-center justify-between">
              <span class="text-sm text-blue-800">{{ suggestion.label }}</span>
              <button
                type="button"
                @click="applySuggestion(suggestion)"
                class="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Interaction Type Specific Fields -->
    <div v-if="interactionType === 'Email'" class="border-t pt-6">
      <h4 class="text-sm font-medium text-gray-700 mb-3">Email Details</h4>
      <div class="text-sm text-gray-500">
        <p>• Duration is typically not applicable for emails</p>
        <p>• Consider follow-up requirements for important emails</p>
      </div>
    </div>

    <div v-else-if="interactionType === 'Demo'" class="border-t pt-6">
      <h4 class="text-sm font-medium text-gray-700 mb-3">Demo Details</h4>
      <div class="text-sm text-gray-500">
        <p>• Consider setting duration to 45-60 minutes for product demos</p>
        <p>• Location helps track whether it's on-site or virtual</p>
        <p>• Multiple participants are common for demos</p>
      </div>
    </div>

    <div v-else-if="interactionType === 'Event'" class="border-t pt-6">
      <h4 class="text-sm font-medium text-gray-700 mb-3">Sample Delivery Details</h4>
      <div class="text-sm text-gray-500">
        <p>• Duration is typically short (10-15 minutes)</p>
        <p>• Location is important for delivery tracking</p>
        <p>• Consider scheduling follow-up for feedback</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type {
  InteractionFormStep2,
  InteractionFormValidation,
  InteractionType
} from '@/types/interactions'
import { LightBulbIcon } from '@heroicons/vue/24/outline'

// Props
interface Props {
  formData: InteractionFormStep2
  validation: InteractionFormValidation
  interactionType: InteractionType
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:formData': [data: Partial<InteractionFormStep2>]
}>()

// Local form data
const localFormData = ref<InteractionFormStep2>({ ...props.formData })
const participantCount = ref(1)

// Update local data when props change
watch(() => props.formData, (newData) => {
  localFormData.value = { ...newData }
  participantCount.value = newData.participants?.length || 1
}, { deep: true })

// Status options
const INTERACTION_STATUSES = [
  { value: 'SCHEDULED' as const, label: 'Scheduled' },
  { value: 'COMPLETED' as const, label: 'Completed' },
  { value: 'CANCELLED' as const, label: 'Cancelled' },
  { value: 'NO_SHOW' as const, label: 'No Show' }
]

// Contact methods
const contactMethods = [
  'Phone',
  'Email', 
  'Video Call',
  'In Person',
  'Text',
  'Social Media',
  'Other'
]

// Computed properties
const requiresLocation = computed(() => {
  return ['Meeting', 'Demo', 'Event'].includes(props.interactionType)
})

const showSuggestions = computed(() => {
  return suggestions.value.length > 0
})

const suggestions = computed(() => {
  const sug = []
  
  // Duration suggestions based on type
  if (!localFormData.value.duration_minutes) {
    const durationSuggestions = {
      Email: null,
      Phone: 15,
      Meeting: 60,
      Demo: 45,
      Proposal: 30,
      Contract: 45,
      Note: null,
      Task: 15,
      Event: 15,
      Social: null,
      Website: null,
      Other: 20
    }
    
    const suggestedDuration = durationSuggestions[props.interactionType]
    if (suggestedDuration) {
      sug.push({
        field: 'duration_minutes',
        label: `Set duration to ${suggestedDuration} minutes`,
        value: suggestedDuration
      })
    }
  }
  
  // Contact method suggestions
  if (!localFormData.value.contact_method) {
    const methodSuggestions = {
      Email: 'Email',
      Phone: 'Phone',
      Meeting: 'In Person',
      Demo: 'In Person',
      Proposal: 'Email',
      Contract: 'In Person',
      Note: 'Other',
      Task: 'Phone',
      Event: 'In Person',
      Social: 'Social Media',
      Website: 'Other',
      Other: 'Phone'
    }
    
    const suggestedMethod = methodSuggestions[props.interactionType]
    if (suggestedMethod) {
      sug.push({
        field: 'contact_method',
        label: `Set contact method to ${suggestedMethod}`,
        value: suggestedMethod
      })
    }
  }
  
  return sug
})

// Validation helpers
const hasError = (field: string) => {
  return props.validation.errors.step2?.some(err => err.includes(field)) || 
         props.validation.errors[field]?.length > 0
}

const getError = (field: string) => {
  return props.validation.errors[field]?.[0] || 
         props.validation.errors.step2?.find(err => err.includes(field))
}

// Event handlers
const handleStatusChange = () => {
  emit('update:formData', { status: localFormData.value.status })
}

const handleDurationChange = () => {
  emit('update:formData', { duration_minutes: localFormData.value.duration_minutes })
}

const handleLocationChange = () => {
  emit('update:formData', { location: localFormData.value.location })
}

const handleContactMethodChange = () => {
  emit('update:formData', { contact_method: localFormData.value.contact_method })
}

const handleParticipantCountChange = () => {
  // Generate simple participant array based on count
  const participants = Array.from({ length: participantCount.value }, (_, i) => `Participant ${i + 1}`)
  localFormData.value.participants = participants
  emit('update:formData', { participants })
}

// Suggestion application
const applySuggestion = (suggestion: any) => {
  if (suggestion.field === 'duration_minutes') {
    localFormData.value.duration_minutes = suggestion.value
    emit('update:formData', { duration_minutes: suggestion.value })
  } else if (suggestion.field === 'contact_method') {
    localFormData.value.contact_method = suggestion.value
    emit('update:formData', { contact_method: suggestion.value })
  }
}
</script>

<style scoped>
/* Component-specific styles */
</style>