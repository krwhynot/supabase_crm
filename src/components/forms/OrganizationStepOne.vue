<template>
  <div class="space-y-6">
    <!-- Organization Name (Required) -->
    <BaseInputField
      name="name"
      label="Organization Name"
      type="text"
      :model-value="modelValue.name || ''"
      :error="errors.name"
      placeholder="Enter the organization name"
      description="The legal or commonly used name of the organization"
      required
      autocomplete="organization"
      @update:model-value="updateField('name', $event)"
      @validate="validateField('name', $event)"
    />

    <!-- Priority (Required - mapped to lead_score) -->
    <SelectField
      name="priority"
      label="Priority"
      :model-value="priorityValue"
      :options="priorityOptions"
      :error="errors.priority || errors.lead_score"
      placeholder="Select organization priority"
      description="How important this organization is for your business objectives"
      required
      @update:model-value="updatePriority"
      @validate="validateField('priority', $event)"
    >
      <template #help-text>
        <div class="text-sm text-gray-600 mt-2">
          <p class="mb-2"><strong>Priority Guidelines:</strong></p>
          <ul class="space-y-1 text-xs">
            <li><span class="inline-block w-12 text-red-600 font-medium">High:</span> Strategic accounts, major clients, high-value prospects</li>
            <li><span class="inline-block w-12 text-orange-600 font-medium">Medium:</span> Regular clients, qualified leads, growth opportunities</li>
            <li><span class="inline-block w-12 text-blue-600 font-medium">Low:</span> New prospects, small accounts, informational contacts</li>
          </ul>
        </div>
      </template>
    </SelectField>

    <!-- Segment (Required - mapped to industry) -->
    <SegmentSelector
      name="segment"
      label="Segment"
      :model-value="modelValue.industry || ''"
      :error="errors.segment || errors.industry"
      :options="segmentOptions"
      :popular-segments="popularSegments"
      placeholder="Select or type an industry segment..."
      description="The industry or market segment this organization operates in"
      help-text="Start typing to search existing segments or create a new one"
      required
      allow-add-new
      @update:model-value="updateField('industry', $event)"
      @add-new="handleAddNewSegment"
      @search="handleSegmentSearch"
      @validate="validateField('segment', $event)"
    />

    <!-- Organization Status -->
    <SelectField
      name="status"
      label="Organization Status"
      :model-value="modelValue.status || 'Prospect'"
      :options="statusOptions"
      :error="errors.status"
      placeholder="Select organization status"
      description="Current relationship status with this organization"
      @update:model-value="updateField('status', $event)"
      @validate="validateField('status', $event)"
    />

    <!-- Form Progress Indicator -->
    <div class="mt-8 p-4 bg-blue-50 rounded-md">
      <div class="flex items-start">
        <svg
          class="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <h3 class="text-sm font-medium text-blue-800">Step 1 of 3: Basic Information</h3>
          <div class="mt-2 text-sm text-blue-700">
            <p>Enter the essential details to identify and categorize the organization.</p>
            <p class="mt-1">
              <strong>Next:</strong> Organization type and business relationship details
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { organizationCreateSchema } from '@/types/organizations'
import type { OrganizationCreateForm } from '@/types/organizations'
import type { OrganizationStatus } from '@/types/database.types'
import BaseInputField from './BaseInputField.vue'
import SelectField from './SelectField.vue'
import SegmentSelector from './SegmentSelector.vue'

/**
 * Props interface
 */
interface Props {
  /** Form data */
  modelValue: Partial<OrganizationCreateForm>
  /** Validation errors */
  errors: Record<string, string>
  /** Loading state */
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

/**
 * Event emissions
 */
interface Emits {
  'update:modelValue': [value: Partial<OrganizationCreateForm>]
  'validate': [stepNumber: number, isValid: boolean, errors: Record<string, string>]
}

const emit = defineEmits<Emits>()

/**
 * Priority options (mapped to lead_score)
 */
const priorityOptions = [
  { value: 90, label: 'High', description: 'Strategic accounts and major opportunities' },
  { value: 60, label: 'Medium', description: 'Regular prospects and qualified leads' },
  { value: 30, label: 'Low', description: 'New prospects and informational contacts' }
]

/**
 * Organization status options
 */
const statusOptions: Array<{ value: OrganizationStatus; label: string; description: string }> = [
  { value: 'Prospect', label: 'Prospect', description: 'Potential customer or client' },
  { value: 'Active', label: 'Active', description: 'Currently engaged organization' },
  { value: 'Customer', label: 'Customer', description: 'Paying customer or client' },
  { value: 'Partner', label: 'Partner', description: 'Business partner or alliance' },
  { value: 'Vendor', label: 'Vendor', description: 'Service or product provider' },
  { value: 'Inactive', label: 'Inactive', description: 'No longer active relationship' }
]

/**
 * Segment/Industry options
 */
const segmentOptions = [
  { value: 'Technology', label: 'Technology', description: 'Software, hardware, and tech services' },
  { value: 'Healthcare', label: 'Healthcare', description: 'Medical and health services' },
  { value: 'Finance', label: 'Finance', description: 'Banking and financial services' },
  { value: 'Manufacturing', label: 'Manufacturing', description: 'Production and industrial' },
  { value: 'Retail', label: 'Retail', description: 'Consumer goods and services' }
]

/**
 * Popular segments (could be loaded from API)
 */
const popularSegments = [
  { value: 'Technology', label: 'Technology', count: 245 },
  { value: 'Healthcare', label: 'Healthcare', count: 189 },
  { value: 'Finance', label: 'Finance', count: 156 },
  { value: 'Manufacturing', label: 'Manufacturing', count: 134 },
  { value: 'Professional Services', label: 'Professional Services', count: 98 }
]

/**
 * Computed properties
 */
const priorityValue = computed(() => {
  const leadScore = props.modelValue.lead_score
  if (leadScore === null || leadScore === undefined) return ''
  
  // Map lead_score back to priority levels
  if (leadScore >= 80) return 90  // High
  if (leadScore >= 50) return 60  // Medium
  return 30  // Low
})

/**
 * Field update handlers
 */
const updateField = (field: keyof OrganizationCreateForm, value: any) => {
  const updatedData = { ...props.modelValue, [field]: value }
  emit('update:modelValue', updatedData)
}

const updatePriority = (priorityLevel: string | number | (string | number)[]) => {
  const value = Array.isArray(priorityLevel) ? priorityLevel[0] : priorityLevel
  const numericValue = typeof value === 'string' ? parseInt(value) : value
  updateField('lead_score', numericValue)
}

/**
 * Validation handlers
 */
const validateField = async (_fieldName: string, _value: any) => {
  // Individual field validation will be handled by the parent component
  // This component focuses on UI and data binding
  await validateStep()
}

const validateStep = async () => {
  const errors: Record<string, string> = {}
  let isValid = true
  
  try {
    // Use yup schema for validation
    const stepData = {
      name: props.modelValue.name,
      industry: props.modelValue.industry,
      lead_score: props.modelValue.lead_score
    }
    
    const stepSchema = organizationCreateSchema.pick(['name', 'industry', 'lead_score'])
    await stepSchema.validate(stepData, { abortEarly: false })
    
  } catch (error: any) {
    isValid = false
    if (error.inner) {
      error.inner.forEach((err: any) => {
        if (err.path) {
          // Map field names for display
          const fieldName = err.path === 'industry' ? 'segment' : 
                           err.path === 'lead_score' ? 'priority' : err.path
          errors[fieldName] = err.message
        }
      })
    }
  }
  
  // Emit validation result
  emit('validate', 1, isValid, errors)
}

/**
 * Segment handling
 */
const handleAddNewSegment = (newSegment: string) => {
  // Add new segment to the form data
  updateField('industry', newSegment)
  
  // Could also emit event to parent to save new segment globally
  // emit('add-new-segment', newSegment)
}

const handleSegmentSearch = (_query: string) => {
  // Could emit to parent to search for segments from API
  // emit('search-segments', query)
}

/**
 * Watch for changes to trigger validation
 */
watch(
  () => [props.modelValue.name, props.modelValue.industry, props.modelValue.lead_score],
  async () => {
    await validateStep()
  },
  { immediate: true }
)

/**
 * Initial validation on mount
 */
onMounted(async () => {
  await validateStep()
})
</script>