<!--
  InteractionStepOne.vue
  First step of interaction form - Basic information
  Type, subject, opportunity selection, and date
-->
<template>
  <div class="interaction-step-one space-y-6">
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Interaction Type -->
      <div>
        <label for="interaction-type" class="block text-sm font-medium text-gray-700 mb-2">
          Interaction Type <span class="text-red-500">*</span>
        </label>
        <select
          id="interaction-type"
          v-model="localFormData.type"
          @change="handleTypeChange"
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          :class="{ 'border-red-300': hasError('type') }"
        >
          <option v-for="type in InteractionTypesList" :key="type.value" :value="type.value">
            {{ type.label }}
          </option>
        </select>
        <p v-if="hasError('type')" class="mt-1 text-sm text-red-600">
          {{ getError('type') }}
        </p>
        <p class="mt-1 text-sm text-gray-500">
          {{ getTypeDescription(localFormData.type) }}
        </p>
      </div>

      <!-- Interaction Date -->
      <div>
        <label for="interaction-date" class="block text-sm font-medium text-gray-700 mb-2">
          Date & Time <span class="text-red-500">*</span>
        </label>
        <input
          id="interaction-date"
          type="datetime-local"
          v-model="localFormData.interaction_date"
          @input="handleDateChange"
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          :class="{ 'border-red-300': hasError('interaction_date') }"
        />
        <p v-if="hasError('interaction_date')" class="mt-1 text-sm text-red-600">
          {{ getError('interaction_date') }}
        </p>
      </div>
    </div>

    <!-- Subject -->
    <div>
      <label for="subject" class="block text-sm font-medium text-gray-700 mb-2">
        Subject <span class="text-red-500">*</span>
      </label>
      <input
        id="subject"
        type="text"
        v-model="localFormData.subject"
        @input="handleSubjectChange"
        placeholder="Brief description of the interaction"
        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        :class="{ 'border-red-300': hasError('subject') }"
        maxlength="255"
      />
      <p v-if="hasError('subject')" class="mt-1 text-sm text-red-600">
        {{ getError('subject') }}
      </p>
      <p class="mt-1 text-sm text-gray-500">
        {{ localFormData.subject.length }}/255 characters
      </p>
    </div>

    <!-- Opportunity Selection -->
    <div>
      <label for="opportunity" class="block text-sm font-medium text-gray-700 mb-2">
        Related Opportunity <span class="text-red-500">*</span>
      </label>
      
      <!-- Opportunity Search/Select -->
      <div class="relative">
        <select
          id="opportunity"
          v-model="localFormData.opportunity_id"
          @change="handleOpportunityChange"
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          :class="{ 'border-red-300': hasError('opportunity_id') }"
          :disabled="loading"
        >
          <option value="">Select an opportunity...</option>
          <option v-for="opportunity in opportunities" :key="opportunity.id" :value="opportunity.id">
            {{ opportunity.name }} - {{ opportunity.organization_name }}
          </option>
        </select>
        
        <!-- Loading indicator -->
        <div v-if="loading" class="absolute inset-y-0 right-0 flex items-center pr-3">
          <svg class="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
      
      <p v-if="hasError('opportunity_id')" class="mt-1 text-sm text-red-600">
        {{ getError('opportunity_id') }}
      </p>
      
      <!-- Selected Opportunity Info -->
      <div v-if="selectedOpportunity" class="mt-3 p-3 bg-blue-50 rounded-md">
        <div class="flex items-center">
          <BuildingOfficeIcon class="h-5 w-5 text-blue-400 mr-2" />
          <div>
            <p class="text-sm font-medium text-blue-900">{{ selectedOpportunity.name }}</p>
            <p class="text-sm text-blue-700">
              {{ selectedOpportunity.organization_name }} • Stage: {{ selectedOpportunity.stage }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Templates (for mobile optimization) -->
    <div v-if="showQuickTemplates" class="border-t pt-6">
      <h4 class="text-sm font-medium text-gray-700 mb-3">Quick Templates</h4>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          v-for="template in availableTemplates"
          :key="template.id"
          type="button"
          @click="applyTemplate(template)"
          class="flex flex-col items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <span class="text-lg mb-1">{{ template.icon }}</span>
          <span class="text-xs text-center">{{ template.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineEmits } from 'vue'
import type {
  InteractionFormStep1,
  InteractionFormValidation,
  InteractionType,
  InteractionQuickTemplate
} from '@/types/interactions'
import {
  INTERACTION_TYPES as InteractionTypesList,
  QUICK_TEMPLATES as QuickTemplatesList
} from '@/types/interactions'
import type { OpportunityListView } from '@/types/opportunities'
import { BuildingOfficeIcon } from '@heroicons/vue/24/outline'

// Props
interface Props {
  formData: InteractionFormStep1
  validation: InteractionFormValidation
  opportunities: OpportunityListView[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Emits
const emit = defineEmits<{
  'update:formData': [data: Partial<InteractionFormStep1>]
  'opportunitySelected': [opportunityId: string]
}>()

// Local form data
const localFormData = ref<InteractionFormStep1>({ ...props.formData })

// Update local data when props change
watch(() => props.formData, (newData) => {
  localFormData.value = { ...newData }
}, { deep: true })

// Use imported constants

// Computed properties
const selectedOpportunity = computed(() => {
  return props.opportunities.find(opp => opp.id === localFormData.value.opportunity_id)
})

const showQuickTemplates = computed(() => {
  // Show templates on mobile or when no subject is entered
  return !localFormData.value.subject || window.innerWidth < 768
})

const availableTemplates = computed(() => {
  return QuickTemplatesList.filter(template => template.type === localFormData.value.type)
})

// Validation helpers
const hasError = (field: string) => {
  return props.validation.errors.step1?.includes(`${field} is required`) || 
         props.validation.errors[field]?.length > 0
}

const getError = (field: string) => {
  return props.validation.errors[field]?.[0] || 
         props.validation.errors.step1?.find(err => err.includes(field))
}

// Type descriptions
const getTypeDescription = (type: InteractionType) => {
  const descriptions = {
    Email: 'Email communication or email campaign',
    Phone: 'Phone call or voice conversation',
    Meeting: 'Face-to-face meeting or site visit',
    Demo: 'Product demonstration or presentation',
    Proposal: 'Business proposal or quote',
    Contract: 'Contract discussion or signing',
    Note: 'Internal note or documentation',
    Task: 'Task or follow-up action',
    Event: 'Sample drop-off or delivery',
    Social: 'Social media interaction',
    Website: 'Website or online interaction',
    Other: 'Follow-up contact or check-in'
  }
  return descriptions[type] || ''
}

// Event handlers
const handleTypeChange = () => {
  emit('update:formData', { type: localFormData.value.type })
}

const handleSubjectChange = () => {
  emit('update:formData', { subject: localFormData.value.subject })
}

const handleDateChange = () => {
  emit('update:formData', { interaction_date: localFormData.value.interaction_date })
}

const handleOpportunityChange = () => {
  emit('update:formData', { opportunity_id: localFormData.value.opportunity_id })
  emit('opportunitySelected', localFormData.value.opportunity_id)
}

// Template application
const applyTemplate = (template: InteractionQuickTemplate) => {
  localFormData.value.type = template.type
  localFormData.value.subject = template.subject_template
  
  emit('update:formData', {
    type: template.type,
    subject: template.subject_template
  })
}
</script>

<style scoped>
/* Component-specific styles */
</style>