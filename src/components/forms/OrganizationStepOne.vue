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
      required
      autocomplete="organization"
      @update:model-value="updateField('name', $event)"
      @validate="validateField('name', $event)"
    />

    <!-- Priority (Required - A/B/C/D mapped to lead_score) -->
    <SelectField
      name="priority"
      label="Priority"
      :model-value="priorityValue"
      :options="priorityOptions"
      :error="errors.priority || errors.lead_score"
      placeholder="Select organization priority"
      required
      @update:model-value="updatePriority"
      @validate="validateField('priority', $event)"
    />

    <!-- Segment (Required - mapped to industry with Food & Beverage prioritized) -->
    <SegmentSelector
      name="segment"
      label="Segment"
      :model-value="modelValue.industry || ''"
      :error="errors.segment || errors.industry"
      :options="segmentOptions"
      :popular-segments="popularSegments"
      placeholder="Select or type an industry segment..."
      required
      allow-add-new
      @update:model-value="updateField('industry', $event)"
      @add-new="handleAddNewSegment"
      @search="handleSegmentSearch"
      @validate="validateField('segment', $event)"
    />

    <!-- Principal/Distributor Selection (Mutually Exclusive) -->
    <div class="space-y-4">
      <label class="block text-sm font-medium text-gray-700">
        Business Type
      </label>
      <div class="space-y-3">
        <div class="flex items-center">
          <input
            id="principal"
            name="business-type"
            type="checkbox"
            :checked="isPrincipal"
            @change="updateBusinessType('principal', ($event.target as HTMLInputElement).checked)"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label for="principal" class="ml-2 block text-sm text-gray-900">
            Principal
          </label>
        </div>
        <div class="flex items-center">
          <input
            id="distributor"
            name="business-type"
            type="checkbox"
            :checked="isDistributor"
            @change="updateBusinessType('distributor', ($event.target as HTMLInputElement).checked)"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label for="distributor" class="ml-2 block text-sm text-gray-900">
            Distributor
          </label>
        </div>
      </div>
    </div>

    <!-- Distributor Selection (Only if NOT Distributor) -->
    <SelectField
      v-if="!isDistributor"
      name="distributor_id"
      label="Distributor"
      :model-value="modelValue.distributor_id || ''"
      :options="distributorOptions"
      :error="errors.distributor_id"
      placeholder="Select a distributor"
      @update:model-value="updateField('distributor_id', $event)"
      @validate="validateField('distributor_id', $event)"
    />

    <!-- Account Manager -->
    <SelectField
      name="account_manager_id"
      label="Account Manager"
      :model-value="modelValue.account_manager_id || ''"
      :options="accountManagerOptions"
      :error="errors.account_manager_id"
      placeholder="Select an account manager"
      @update:model-value="updateField('account_manager_id', $event)"
      @validate="validateField('account_manager_id', $event)"
    />

    <!-- Organization Status -->
    <SelectField
      name="status"
      label="Organization Status"
      :model-value="modelValue.status || 'Prospect'"
      :options="statusOptions"
      :error="errors.status"
      placeholder="Select organization status"
      @update:model-value="updateField('status', $event)"
      @validate="validateField('status', $event)"
    />
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
 * Priority options (A/B/C/D mapped to lead_score)
 * A=90 (highest), B=70, C=50, D=30 (lowest)
 */
const priorityOptions = [
  { value: 90, label: 'A', description: 'Highest priority - Strategic accounts and major opportunities' },
  { value: 70, label: 'B', description: 'High priority - Important prospects and qualified leads' },
  { value: 50, label: 'C', description: 'Medium priority - Regular prospects and opportunities' },
  { value: 30, label: 'D', description: 'Low priority - New prospects and informational contacts' }
]

/**
 * Organization status options (updated)
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
 * Segment/Industry options (Food & Beverage prioritized)
 */
const segmentOptions = [
  // Food & Beverage Industries (prioritized at top)
  { value: 'Food & Beverage - Manufacturing', label: 'Food & Beverage - Manufacturing', description: 'Food and beverage production companies' },
  { value: 'Food & Beverage - Distribution', label: 'Food & Beverage - Distribution', description: 'Food and beverage distribution companies' },
  { value: 'Food & Beverage - Retail', label: 'Food & Beverage - Retail', description: 'Food and beverage retail outlets' },
  { value: 'Food & Beverage - Restaurant', label: 'Food & Beverage - Restaurant', description: 'Restaurants and food service establishments' },
  // Other industries
  { value: 'Technology', label: 'Technology', description: 'Software, hardware, and tech services' },
  { value: 'Healthcare', label: 'Healthcare', description: 'Medical and health services' },
  { value: 'Finance', label: 'Finance', description: 'Banking and financial services' },
  { value: 'Manufacturing', label: 'Manufacturing', description: 'Production and industrial' },
  { value: 'Retail', label: 'Retail', description: 'Consumer goods and services' },
  { value: 'Professional Services', label: 'Professional Services', description: 'Consulting and professional services' }
]

/**
 * Popular segments (Food & Beverage prioritized)
 */
const popularSegments = [
  { value: 'Food & Beverage - Manufacturing', label: 'Food & Beverage - Manufacturing', count: 312 },
  { value: 'Food & Beverage - Distribution', label: 'Food & Beverage - Distribution', count: 287 },
  { value: 'Food & Beverage - Restaurant', label: 'Food & Beverage - Restaurant', count: 245 },
  { value: 'Technology', label: 'Technology', count: 189 },
  { value: 'Manufacturing', label: 'Manufacturing', count: 156 }
]

/**
 * Distributor options (mock data - would be loaded from API)
 */
const distributorOptions = [
  { value: 'dist-1', label: 'ABC Distribution Corp', description: 'National food distributor' },
  { value: 'dist-2', label: 'XYZ Supply Chain', description: 'Regional beverage distributor' },
  { value: 'dist-3', label: 'Global Foods Distribution', description: 'International food distributor' }
]

/**
 * Account Manager options (mock data - would be loaded from API)
 */
const accountManagerOptions = [
  { value: 'am-1', label: 'John Smith', description: 'Senior Account Manager' },
  { value: 'am-2', label: 'Sarah Johnson', description: 'Account Manager - Food & Beverage' },
  { value: 'am-3', label: 'Mike Davis', description: 'Regional Account Manager' }
]

/**
 * Computed properties
 */
const priorityValue = computed(() => {
  const leadScore = props.modelValue.lead_score
  if (leadScore === null || leadScore === undefined) return ''
  
  // Map lead_score back to A/B/C/D priority levels
  if (leadScore >= 90) return 90  // A
  if (leadScore >= 70) return 70  // B
  if (leadScore >= 50) return 50  // C
  return 30  // D
})

/**
 * Principal/Distributor computed properties
 */
const isPrincipal = computed(() => {
  return props.modelValue.is_principal === true
})

const isDistributor = computed(() => {
  return props.modelValue.is_distributor === true
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
 * Business type update handler (Principal/Distributor mutually exclusive)
 */
const updateBusinessType = (type: 'principal' | 'distributor', checked: boolean) => {
  if (type === 'principal') {
    if (checked) {
      // Set as principal, unset distributor
      updateField('is_principal', true)
      updateField('is_distributor', false)
      // Clear distributor_id when becoming a principal
      updateField('distributor_id', '')
    } else {
      updateField('is_principal', false)
    }
  } else if (type === 'distributor') {
    if (checked) {
      // Set as distributor, unset principal
      updateField('is_distributor', true)
      updateField('is_principal', false)
      // Clear distributor_id when becoming a distributor themselves
      updateField('distributor_id', '')
    } else {
      updateField('is_distributor', false)
    }
  }
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
      lead_score: props.modelValue.lead_score,
      status: props.modelValue.status,
      is_principal: props.modelValue.is_principal,
      is_distributor: props.modelValue.is_distributor,
      distributor_id: props.modelValue.distributor_id,
      account_manager_id: props.modelValue.account_manager_id
    }
    
    const stepSchema = organizationCreateSchema.pick([
      'name', 
      'industry', 
      'lead_score', 
      'status'
      // Note: is_principal, is_distributor, distributor_id, account_manager_id 
      // may not be in the existing schema yet - will need to be added
    ])
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
  () => [
    props.modelValue.name, 
    props.modelValue.industry, 
    props.modelValue.lead_score,
    props.modelValue.status,
    props.modelValue.is_principal,
    props.modelValue.is_distributor,
    props.modelValue.distributor_id,
    props.modelValue.account_manager_id
  ],
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