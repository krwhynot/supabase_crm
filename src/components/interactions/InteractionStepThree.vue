<!--
  InteractionStepThree.vue
  Third step of interaction form - Outcome and follow-up
  Outcome, rating, notes, follow-up planning
-->
<template>
  <div class="interaction-step-three space-y-6">
    <!-- Outcome and Rating (for completed interactions) -->
    <div v-if="status === 'COMPLETED'" class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Outcome -->
      <div>
        <label for="outcome" class="block text-sm font-medium text-gray-700 mb-2">
          Outcome <span class="text-red-500">*</span>
        </label>
        <select
          id="outcome"
          v-model="localFormData.outcome"
          @change="handleOutcomeChange"
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          :class="{ 'border-red-300': hasError('outcome') }"
        >
          <option value="">Select outcome...</option>
          <option v-for="outcome in INTERACTION_OUTCOMES" :key="outcome.value" :value="outcome.value">
            {{ outcome.label }}
          </option>
        </select>
        <p v-if="hasError('outcome')" class="mt-1 text-sm text-red-600">
          {{ getError('outcome') }}
        </p>
      </div>

      <!-- Rating -->
      <div>
        <label for="rating" class="block text-sm font-medium text-gray-700 mb-2">
          Rating (1-5)
        </label>
        <select
          id="rating"
          v-model.number="localFormData.rating"
          @change="handleRatingChange"
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          :class="{ 'border-red-300': hasError('rating') }"
        >
          <option :value="null">Select rating...</option>
          <option v-for="rating in ratingOptions" :key="rating.value" :value="rating.value">
            {{ rating.label }}
          </option>
        </select>
        <p v-if="hasError('rating')" class="mt-1 text-sm text-red-600">
          {{ getError('rating') }}
        </p>
        <p class="mt-1 text-sm text-gray-500">
          Rate the effectiveness of this interaction
        </p>
      </div>
    </div>

    <!-- Notes -->
    <div>
      <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
        Notes
      </label>
      <textarea
        id="notes"
        v-model="localFormData.notes"
        @input="handleNotesChange"
        rows="4"
        placeholder="Additional notes about this interaction..."
        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        :class="{ 'border-red-300': hasError('notes') }"
        maxlength="2000"
      />
      <p v-if="hasError('notes')" class="mt-1 text-sm text-red-600">
        {{ getError('notes') }}
      </p>
      <p class="mt-1 text-sm text-gray-500">
        {{ (localFormData.notes?.length || 0) }}/2000 characters
      </p>
    </div>

    <!-- Follow-up Section -->
    <div class="border-t pt-6">
      <h4 class="text-sm font-medium text-gray-700 mb-4">Follow-up Planning</h4>
      
      <!-- Follow-up Required Toggle -->
      <div class="flex items-center mb-4">
        <input
          id="follow-up-required"
          v-model="localFormData.follow_up_required"
          @change="handleFollowUpRequiredChange"
          type="checkbox"
          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label for="follow-up-required" class="ml-2 block text-sm text-gray-700">
          This interaction requires follow-up
        </label>
      </div>

      <!-- Follow-up Details (conditional) -->
      <div v-if="localFormData.follow_up_required" class="space-y-4 pl-6">
        <!-- Follow-up Date -->
        <div>
          <label for="follow-up-date" class="block text-sm font-medium text-gray-700 mb-2">
            Follow-up Date <span class="text-red-500">*</span>
          </label>
          <input
            id="follow-up-date"
            type="datetime-local"
            v-model="localFormData.follow_up_date"
            @input="handleFollowUpDateChange"
            :min="minFollowUpDate"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            :class="{ 'border-red-300': hasError('follow_up_date') }"
          />
          <p v-if="hasError('follow_up_date')" class="mt-1 text-sm text-red-600">
            {{ getError('follow_up_date') }}
          </p>
        </div>

        <!-- Follow-up Notes -->
        <div>
          <label for="follow-up-notes" class="block text-sm font-medium text-gray-700 mb-2">
            Follow-up Notes
          </label>
          <textarea
            id="follow-up-notes"
            v-model="localFormData.follow_up_notes"
            @input="handleFollowUpNotesChange"
            rows="3"
            placeholder="What needs to be done in the follow-up?"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            maxlength="500"
          />
          <p class="mt-1 text-sm text-gray-500">
            {{ (localFormData.follow_up_notes?.length || 0) }}/500 characters
          </p>
        </div>

        <!-- Next Action -->
        <div>
          <label for="next-action" class="block text-sm font-medium text-gray-700 mb-2">
            Next Action
          </label>
          <select
            id="next-action"
            v-model="localFormData.next_action"
            @change="handleNextActionChange"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Select next action...</option>
            <option v-for="action in nextActionOptions" :key="action" :value="action">
              {{ action }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Tags -->
    <div>
      <label for="tags" class="block text-sm font-medium text-gray-700 mb-2">
        Tags
      </label>
      <div class="flex flex-wrap gap-2 mb-2">
        <span
          v-for="tag in localFormData.tags"
          :key="tag"
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
        >
          {{ tag }}
          <button
            type="button"
            @click="removeTag(tag)"
            class="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none focus:bg-blue-500 focus:text-white"
          >
            <XMarkIcon class="h-3 w-3" />
          </button>
        </span>
      </div>
      <div class="flex">
        <input
          v-model="newTag"
          @keyup.enter="addTag"
          @keydown="handleTagKeydown"
          type="text"
          placeholder="Add tag and press Enter"
          class="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          maxlength="50"
        />
        <button
          type="button"
          @click="addTag"
          class="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add
        </button>
      </div>
      <p class="mt-1 text-sm text-gray-500">
        Use tags to categorize and search interactions later
      </p>
    </div>

    <!-- Quick Actions Based on Outcome -->
    <div v-if="showOutcomeGuidance" class="bg-gray-50 rounded-lg p-4">
      <div class="flex">
        <InformationCircleIcon class="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
        <div>
          <h4 class="text-sm font-medium text-gray-900 mb-2">Recommended Next Steps</h4>
          <div class="space-y-2">
            <div v-for="suggestion in outcomeSuggestions" :key="suggestion.action || 'default'" class="flex items-center justify-between">
              <span class="text-sm text-gray-700">{{ suggestion.description }}</span>
              <button
                v-if="suggestion.action"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type {
  InteractionFormStep3,
  InteractionFormValidation,
  InteractionStatus
} from '@/types/interactions'
import { INTERACTION_OUTCOMES } from '@/types/interactions'
import { XMarkIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'

// Props
interface Props {
  formData: InteractionFormStep3
  validation: InteractionFormValidation
  status: InteractionStatus
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:formData': [data: Partial<InteractionFormStep3>]
}>()

// Local form data
const localFormData = ref<InteractionFormStep3>({ ...props.formData })
const newTag = ref('')

// Update local data when props change
watch(() => props.formData, (newData) => {
  localFormData.value = { ...newData }
}, { deep: true })

// Rating options
const ratingOptions = [
  { value: 1, label: '1 - Poor' },
  { value: 2, label: '2 - Below Average' },
  { value: 3, label: '3 - Average' },
  { value: 4, label: '4 - Good' },
  { value: 5, label: '5 - Excellent' }
]

// Next action options
const nextActionOptions = [
  'Schedule Follow-up Call',
  'Send Information',
  'Prepare Proposal',
  'Schedule Demo',
  'Send Samples',
  'Schedule Site Visit',
  'Internal Discussion',
  'Wait for Customer Response',
  'Update Opportunity Stage',
  'Close Opportunity'
]

// Computed properties
const minFollowUpDate = computed(() => {
  return new Date().toISOString().slice(0, 16) // datetime-local format
})

const showOutcomeGuidance = computed(() => {
  return props.status === 'COMPLETED' && localFormData.value.outcome
})

const outcomeSuggestions = computed(() => {
  const outcome = localFormData.value.outcome
  if (!outcome) return []

  const suggestions = {
    POSITIVE: [
      { description: 'Schedule follow-up to maintain momentum', action: 'follow_up' },
      { description: 'Consider updating opportunity stage', action: null },
      { description: 'Add positive interaction tag', action: 'tag_positive' }
    ],
    NEUTRAL: [
      { description: 'Schedule follow-up to address concerns', action: 'follow_up' },
      { description: 'Consider sending additional information', action: null },
      { description: 'Add neutral interaction tag', action: 'tag_neutral' }
    ],
    NEGATIVE: [
      { description: 'Schedule follow-up to address issues', action: 'follow_up' },
      { description: 'Consider internal team discussion', action: null },
      { description: 'Add negative interaction tag', action: 'tag_negative' }
    ],
    NEEDS_FOLLOW_UP: [
      { description: 'Schedule immediate follow-up', action: 'follow_up' },
      { description: 'Set next action as priority', action: null },
      { description: 'Add follow-up required tag', action: 'tag_followup' }
    ]
  }

  return suggestions[outcome] || []
})

// Validation helpers
const hasError = (field: string) => {
  return props.validation.errors.step3?.some(err => err.includes(field)) || 
         props.validation.errors[field]?.length > 0
}

const getError = (field: string) => {
  return props.validation.errors[field]?.[0] || 
         props.validation.errors.step3?.find(err => err.includes(field))
}

// Event handlers
const handleOutcomeChange = () => {
  emit('update:formData', { outcome: localFormData.value.outcome })
}

const handleRatingChange = () => {
  emit('update:formData', { rating: localFormData.value.rating })
}

const handleNotesChange = () => {
  emit('update:formData', { notes: localFormData.value.notes })
}

const handleFollowUpRequiredChange = () => {
  const updates: Partial<InteractionFormStep3> = {
    follow_up_required: localFormData.value.follow_up_required
  }
  
  // Clear follow-up data if not required
  if (!localFormData.value.follow_up_required) {
    updates.follow_up_date = null
    updates.follow_up_notes = ''
    updates.next_action = ''
    localFormData.value.follow_up_date = null
    localFormData.value.follow_up_notes = ''
    localFormData.value.next_action = ''
  }
  
  emit('update:formData', updates)
}

const handleFollowUpDateChange = () => {
  emit('update:formData', { follow_up_date: localFormData.value.follow_up_date })
}

const handleFollowUpNotesChange = () => {
  emit('update:formData', { follow_up_notes: localFormData.value.follow_up_notes })
}

const handleNextActionChange = () => {
  emit('update:formData', { next_action: localFormData.value.next_action })
}

// Tag management
const addTag = () => {
  const tag = newTag.value.trim().replace(',', '')
  if (tag && !localFormData.value.tags?.includes(tag)) {
    const tags = [...(localFormData.value.tags || []), tag]
    localFormData.value.tags = tags
    emit('update:formData', { tags })
  }
  newTag.value = ''
}

const handleTagKeydown = (event: KeyboardEvent) => {
  if (event.key === ',') {
    event.preventDefault()
    addTag()
  }
}

const removeTag = (tagToRemove: string) => {
  const tags = (localFormData.value.tags || []).filter(tag => tag !== tagToRemove)
  localFormData.value.tags = tags
  emit('update:formData', { tags })
}

// Suggestion application
const applySuggestion = (suggestion: any) => {
  if (suggestion.action === 'follow_up') {
    localFormData.value.follow_up_required = true
    
    // Set follow-up date to one week from now
    const followUpDate = new Date()
    followUpDate.setDate(followUpDate.getDate() + 7)
    localFormData.value.follow_up_date = followUpDate.toISOString().slice(0, 16)
    
    emit('update:formData', {
      follow_up_required: true,
      follow_up_date: localFormData.value.follow_up_date
    })
  } else if (suggestion.action?.startsWith('tag_')) {
    const tagType = suggestion.action.replace('tag_', '')
    const tag = `${tagType}-interaction`
    
    if (!localFormData.value.tags?.includes(tag)) {
      const tags = [...(localFormData.value.tags || []), tag]
      localFormData.value.tags = tags
      emit('update:formData', { tags })
    }
  }
}

// Initialize tags array if not present
if (!localFormData.value.tags) {
  localFormData.value.tags = []
  emit('update:formData', { tags: [] })
}
</script>

<style scoped>
/* Component-specific styles */
</style>