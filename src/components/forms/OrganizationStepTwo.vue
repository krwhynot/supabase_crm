<template>
  <div class="space-y-6">
    <!-- Organization Type Selection -->
    <div class="space-y-4">
      <div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Organization Type</h3>
        <p class="text-sm text-gray-600 mb-4">
          Select the type of organization and specify its business relationships
        </p>
      </div>

      <!-- Business Type (B2B, B2C, etc.) -->
      <SelectField
        name="type"
        label="Business Type"
        :model-value="modelValue.type || ''"
        :options="businessTypeOptions"
        :error="errors.type"
        placeholder="Select the business type"
        description="The primary business model of this organization"
        @update:model-value="updateField('type', $event)"
        @validate="validateField('type', $event)"
      />
    </div>

    <!-- Principal Organization (Custom Field) -->
    <div class="space-y-2">
      <CheckboxField
        name="isPrincipal"
        label="Principal Organization"
        :model-value="isPrincipal"
        description="Mark this organization as a principal"
        help-text="Principal organizations are primary decision makers or parent companies"
        @update:model-value="updateIsPrincipal"
        @validate="validateField('isPrincipal', $event)"
      />
      
      <!-- Principal Tooltip -->
      <div class="ml-8 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div class="flex items-start">
          <svg
            class="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0"
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
          <div class="text-sm">
            <p class="font-medium text-blue-800 mb-1">What is a Principal Organization?</p>
            <p class="text-blue-700">
              A principal organization typically has decision-making authority, acts as a parent company, 
              or serves as the primary point of contact for business relationships. Examples include:
            </p>
            <ul class="mt-2 list-disc list-inside text-blue-700 space-y-1">
              <li>Headquarters or parent companies</li>
              <li>Primary contractors or vendors</li>
              <li>Organizations with signing authority</li>
              <li>Strategic partners with decision power</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Distributor Organization (Custom Field) -->
    <div class="space-y-2">
      <CheckboxField
        name="isDistributor"
        label="Distributor Organization"
        :model-value="isDistributor"
        description="Mark this organization as a distributor"
        help-text="Distributor organizations resell or distribute products/services"
        @update:model-value="updateIsDistributor"
        @validate="validateField('isDistributor', $event)"
      />
      
      <!-- Distributor Tooltip -->
      <div class="ml-8 p-3 bg-green-50 border border-green-200 rounded-md">
        <div class="flex items-start">
          <svg
            class="h-5 w-5 text-green-400 mt-0.5 mr-2 flex-shrink-0"
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
          <div class="text-sm">
            <p class="font-medium text-green-800 mb-1">What is a Distributor Organization?</p>
            <p class="text-green-700">
              A distributor organization resells, distributes, or channels products and services 
              to end customers. They often act as intermediaries in the sales process:
            </p>
            <ul class="mt-2 list-disc list-inside text-green-700 space-y-1">
              <li>Authorized resellers and dealers</li>
              <li>Channel partners and distributors</li>
              <li>Retail chains and franchisees</li>
              <li>Value-added resellers (VARs)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Organization Size -->
    <SelectField
      name="size"
      label="Organization Size"
      :model-value="modelValue.size || ''"
      :options="organizationSizeOptions"
      :error="errors.size"
      placeholder="Select organization size"
      description="Approximate size of the organization"
      help-text="This helps categorize the organization for targeted engagement strategies"
      @update:model-value="updateField('size', $event)"
      @validate="validateField('size', $event)"
    />

    <!-- Additional Relationship Context -->
    <div class="space-y-4">
      <div>
        <h4 class="text-md font-medium text-gray-900 mb-2">Relationship Context</h4>
        <p class="text-sm text-gray-600">
          Optional information to provide more context about this organization
        </p>
      </div>

      <!-- Founded Year -->
      <BaseInputField
        name="founded_year"
        label="Founded Year"
        type="number"
        :model-value="modelValue.founded_year || ''"
        :error="errors.founded_year"
        placeholder="e.g., 2010"
        description="Year the organization was established"
        :min="1800"
        :max="currentYear + 1"
        @update:model-value="updateField('founded_year', $event ? parseInt($event.toString()) : null)"
        @validate="validateField('founded_year', $event)"
      />

      <!-- Employee Count -->
      <BaseInputField
        name="employees_count"
        label="Number of Employees"
        type="number"
        :model-value="modelValue.employees_count || ''"
        :error="errors.employees_count"
        placeholder="e.g., 50"
        description="Approximate number of employees"
        :min="0"
        @update:model-value="updateField('employees_count', $event ? parseInt($event.toString()) : null)"
        @validate="validateField('employees_count', $event)"
      />
    </div>

    <!-- Form Progress Indicator -->
    <div class="mt-8 p-4 bg-purple-50 rounded-md">
      <div class="flex items-start">
        <svg
          class="h-5 w-5 text-purple-400 mt-0.5 mr-3 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
        <div>
          <h3 class="text-sm font-medium text-purple-800">Step 2 of 3: Organization Type</h3>
          <div class="mt-2 text-sm text-purple-700">
            <p>Define the business relationship and organizational characteristics.</p>
            <p class="mt-1">
              <strong>Next:</strong> Contact details, address, and additional information
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import type { OrganizationCreateForm } from '@/types/organizations'
import type { OrganizationType, OrganizationSize } from '@/types/database.types'
import BaseInputField from './BaseInputField.vue'
import SelectField from './SelectField.vue'
import CheckboxField from './CheckboxField.vue'

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
 * Business type options
 */
const businessTypeOptions: Array<{ value: OrganizationType; label: string; description: string }> = [
  { value: 'B2B', label: 'B2B', description: 'Sells products or services to other businesses' },
  { value: 'B2C', label: 'B2C', description: 'Sells directly to individual consumers' },
  { value: 'B2B2C', label: 'B2B2C', description: 'Sells to businesses who sell to consumers' },
  { value: 'Non-Profit', label: 'Non-Profit', description: 'Charitable or educational organization' },
  { value: 'Government', label: 'Government', description: 'Government agency or public sector' },
  { value: 'Other', label: 'Other', description: 'Other business model' }
]

/**
 * Organization size options
 */
const organizationSizeOptions: Array<{ value: OrganizationSize; label: string; description: string }> = [
  { value: 'Startup', label: 'Startup (1-10 employees)', description: 'Early-stage company' },
  { value: 'Small', label: 'Small (11-50 employees)', description: 'Small business' },
  { value: 'Medium', label: 'Medium (51-250 employees)', description: 'Medium-sized company' },
  { value: 'Large', label: 'Large (251-1000 employees)', description: 'Large corporation' },
  { value: 'Enterprise', label: 'Enterprise (1000+ employees)', description: 'Large enterprise' }
]

/**
 * Computed properties
 */
const currentYear = computed(() => new Date().getFullYear())

// Custom fields from custom_fields JSON
const customFields = computed(() => props.modelValue.custom_fields as Record<string, any> || {})

const isPrincipal = computed(() => customFields.value.is_principal || false)
const isDistributor = computed(() => customFields.value.is_distributor || false)

/**
 * Field update handlers
 */
const updateField = (field: keyof OrganizationCreateForm, value: any) => {
  const updatedData = { ...props.modelValue, [field]: value }
  emit('update:modelValue', updatedData)
}

const updateCustomField = (fieldName: string, value: any) => {
  const updatedCustomFields = { ...customFields.value, [fieldName]: value }
  updateField('custom_fields', updatedCustomFields)
}

const updateIsPrincipal = (value: boolean) => {
  updateCustomField('is_principal', value)
}

const updateIsDistributor = (value: boolean) => {
  updateCustomField('is_distributor', value)
}

/**
 * Validation handlers
 */
const validateField = (_fieldName: string, _value: any) => {
  // Individual field validation
  validateStep()
}

const validateStep = () => {
  const errors: Record<string, string> = {}
  let isValid = true
  
  // Step 2 has no required fields, but we can validate data types
  if (props.modelValue.founded_year !== null && props.modelValue.founded_year !== undefined) {
    const year = props.modelValue.founded_year
    if (year < 1800 || year > currentYear.value + 1) {
      errors.founded_year = `Founded year must be between 1800 and ${currentYear.value + 1}`
      isValid = false
    }
  }
  
  if (props.modelValue.employees_count !== null && props.modelValue.employees_count !== undefined) {
    const count = props.modelValue.employees_count
    if (count < 0) {
      errors.employees_count = 'Employee count cannot be negative'
      isValid = false
    }
  }
  
  // Emit validation result
  emit('validate', 2, isValid, errors)
}

/**
 * Watch for changes to trigger validation
 */
watch(
  () => [
    props.modelValue.type,
    props.modelValue.size,
    props.modelValue.founded_year,
    props.modelValue.employees_count,
    props.modelValue.custom_fields
  ],
  () => {
    validateStep()
  },
  { immediate: true }
)

/**
 * Initial validation on mount
 */
onMounted(() => {
  validateStep()
})
</script>