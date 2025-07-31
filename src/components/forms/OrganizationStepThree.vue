<template>
  <div class="space-y-6">
    <!-- Contact Information Section -->
    <div class="space-y-4">
      <div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Contact Information</h3>
        <p class="text-sm text-gray-600 mb-4">
          Provide contact details and address information for this organization
        </p>
      </div>

      <!-- Primary Phone -->
      <BaseInputField
        name="primary_phone"
        label="Primary Phone"
        type="tel"
        :model-value="modelValue.primary_phone || ''"
        :error="errors.primary_phone"
        placeholder="e.g., +1 (555) 123-4567"
        description="Main phone number for the organization"
        autocomplete="tel"
        @update:model-value="updateField('primary_phone', $event)"
        @validate="validateField('primary_phone', $event)"
      />

      <!-- Secondary Phone -->
      <BaseInputField
        name="secondary_phone"
        label="Secondary Phone"
        type="tel"
        :model-value="modelValue.secondary_phone || ''"
        :error="errors.secondary_phone"
        placeholder="e.g., +1 (555) 987-6543"
        description="Alternative phone number (optional)"
        autocomplete="tel"
        @update:model-value="updateField('secondary_phone', $event)"
        @validate="validateField('secondary_phone', $event)"
      />

      <!-- Email -->
      <BaseInputField
        name="email"
        label="Email Address"
        type="email"
        :model-value="modelValue.email || ''"
        :error="errors.email"
        placeholder="e.g., contact@company.com"
        description="Primary email address for the organization"
        autocomplete="email"
        @update:model-value="updateField('email', $event)"
        @validate="validateField('email', $event)"
      />

      <!-- Website -->
      <BaseInputField
        name="website"
        label="Website"
        type="url"
        :model-value="modelValue.website || ''"
        :error="errors.website"
        placeholder="e.g., https://www.company.com"
        description="Organization's website URL"
        autocomplete="url"
        @update:model-value="updateField('website', $event)"
        @validate="validateField('website', $event)"
      />
    </div>

    <!-- Address Section -->
    <div class="space-y-4">
      <div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Address</h3>
        <p class="text-sm text-gray-600 mb-4">
          Physical address of the organization's main office or headquarters
        </p>
      </div>

      <!-- Address Line 1 -->
      <BaseInputField
        name="address_line_1"
        label="Address Line 1"
        type="text"
        :model-value="modelValue.address_line_1 || ''"
        :error="errors.address_line_1"
        placeholder="e.g., 123 Main Street"
        description="Street address, building number, and street name"
        autocomplete="street-address"
        @update:model-value="updateField('address_line_1', $event)"
        @validate="validateField('address_line_1', $event)"
      />

      <!-- Address Line 2 -->
      <BaseInputField
        name="address_line_2"
        label="Address Line 2"
        type="text"
        :model-value="modelValue.address_line_2 || ''"
        :error="errors.address_line_2"
        placeholder="e.g., Suite 100"
        description="Apartment, suite, unit, or floor (optional)"
        autocomplete="off"
        @update:model-value="updateField('address_line_2', $event)"
        @validate="validateField('address_line_2', $event)"
      />

      <!-- City and State/Province Row -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- City -->
        <BaseInputField
          name="city"
          label="City"
          type="text"
          :model-value="modelValue.city || ''"
          :error="errors.city"
          placeholder="e.g., New York"
          description="City or locality"
          autocomplete="off"
          @update:model-value="updateField('city', $event)"
          @validate="validateField('city', $event)"
        />

        <!-- State/Province -->
        <BaseInputField
          name="state_province"
          label="State/Province"
          type="text"
          :model-value="modelValue.state_province || ''"
          :error="errors.state_province"
          placeholder="e.g., NY"
          description="State, province, or region"
          autocomplete="off"
          @update:model-value="updateField('state_province', $event)"
          @validate="validateField('state_province', $event)"
        />
      </div>

      <!-- Postal Code and Country Row -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Postal Code -->
        <BaseInputField
          name="postal_code"
          label="Postal Code"
          type="text"
          :model-value="modelValue.postal_code || ''"
          :error="errors.postal_code"
          placeholder="e.g., 10001"
          description="ZIP or postal code"
          autocomplete="postal-code"
          @update:model-value="updateField('postal_code', $event)"
          @validate="validateField('postal_code', $event)"
        />

        <!-- Country -->
        <SelectField
          name="country"
          label="Country"
          :model-value="modelValue.country || ''"
          :options="countryOptions"
          :error="errors.country"
          placeholder="Select country"
          description="Country or territory"
          @update:model-value="updateField('country', $event)"
          @validate="validateField('country', $event)"
        />
      </div>
    </div>

    <!-- Business Details Section -->
    <div class="space-y-4">
      <div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Business Details</h3>
        <p class="text-sm text-gray-600 mb-4">
          Additional information about the organization's business and operations
        </p>
      </div>

      <!-- Legal Name -->
      <BaseInputField
        name="legal_name"
        label="Legal Name"
        type="text"
        :model-value="modelValue.legal_name || ''"
        :error="errors.legal_name"
        placeholder="e.g., Company Name LLC"
        description="Official legal name if different from organization name"
        help-text="Only fill this if the legal name differs from the organization name"
        @update:model-value="updateField('legal_name', $event)"
        @validate="validateField('legal_name', $event)"
      />

      <!-- Annual Revenue -->
      <BaseInputField
        name="annual_revenue"
        label="Annual Revenue"
        type="number"
        :model-value="modelValue.annual_revenue || ''"
        :error="errors.annual_revenue"
        placeholder="e.g., 1000000"
        description="Annual revenue in USD (optional)"
        help-text="This helps with lead scoring and segmentation"
        :min="0"
        @update:model-value="updateField('annual_revenue', $event ? parseFloat($event.toString()) : null)"
        @validate="validateField('annual_revenue', $event)"
      />

      <!-- Account Manager -->
      <SelectField
        name="assigned_user_id"
        label="Account Manager"
        :model-value="modelValue.assigned_user_id || ''"
        :options="accountManagerOptions"
        :error="errors.assigned_user_id"
        placeholder="Select account manager"
        description="Team member responsible for this organization"
        help-text="This person will be the primary contact for this organization"
        @update:model-value="updateField('assigned_user_id', $event)"
        @validate="validateField('assigned_user_id', $event)"
      />
    </div>

    <!-- Notes Section -->
    <div class="space-y-4">
      <div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Additional Information</h3>
        <p class="text-sm text-gray-600 mb-4">
          Any additional notes or context about this organization
        </p>
      </div>

      <!-- Description/Notes -->
      <TextareaField
        name="description"
        label="Notes & Description"
        :model-value="modelValue.description || ''"
        :error="errors.description"
        placeholder="Enter any additional notes, context, or important information about this organization..."
        description="Internal notes about the organization, relationship history, or other relevant details"
        :rows="4"
        :maxlength="2000"
        show-character-count
        @update:model-value="updateField('description', $event)"
        @validate="validateField('description', $event)"
      />

      <!-- Lead Source -->
      <BaseInputField
        name="lead_source"
        label="Lead Source"
        type="text"
        :model-value="modelValue.lead_source || ''"
        :error="errors.lead_source"
        placeholder="e.g., Website, Referral, Trade Show"
        description="How did you learn about this organization?"
        help-text="This helps track the effectiveness of different marketing channels"
        @update:model-value="updateField('lead_source', $event)"
        @validate="validateField('lead_source', $event)"
      />
    </div>

    <!-- Form Progress Indicator -->
    <div class="mt-8 p-4 bg-green-50 rounded-md">
      <div class="flex items-start">
        <svg
          class="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <h3 class="text-sm font-medium text-green-800">Step 3 of 3: Contact Details & Notes</h3>
          <div class="mt-2 text-sm text-green-700">
            <p>Complete the organization profile with contact information and additional details.</p>
            <p class="mt-1">
              <strong>Ready to create:</strong> All required information has been collected
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, onMounted } from 'vue'
import type { OrganizationCreateForm } from '@/types/organizations'
import BaseInputField from './BaseInputField.vue'
import SelectField from './SelectField.vue'
import TextareaField from './TextareaField.vue'

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
 * Country options (top countries for business)
 */
const countryOptions = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'IT', label: 'Italy' },
  { value: 'ES', label: 'Spain' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'AU', label: 'Australia' },
  { value: 'JP', label: 'Japan' },
  { value: 'CN', label: 'China' },
  { value: 'IN', label: 'India' },
  { value: 'BR', label: 'Brazil' },
  { value: 'MX', label: 'Mexico' },
  { value: 'SG', label: 'Singapore' },
  { value: 'HK', label: 'Hong Kong' },
  { value: 'Other', label: 'Other' }
]

/**
 * Account manager options (would typically come from user/team API)
 */
const accountManagerOptions = [
  { value: '', label: 'Unassigned', description: 'No account manager assigned' },
  { value: 'user-1', label: 'John Smith', description: 'Senior Account Manager' },
  { value: 'user-2', label: 'Sarah Johnson', description: 'Account Manager' },
  { value: 'user-3', label: 'Mike Davis', description: 'Regional Manager' },
  { value: 'user-4', label: 'Lisa Chen', description: 'Enterprise Account Manager' },
  { value: 'user-5', label: 'David Wilson', description: 'Account Executive' }
]

/**
 * Field update handlers
 */
const updateField = (field: keyof OrganizationCreateForm, value: any) => {
  const updatedData = { ...props.modelValue, [field]: value }
  emit('update:modelValue', updatedData)
}

/**
 * Validation handlers
 */
const validateField = (_fieldName: string, _value: any) => {
  validateStep()
}

const validateStep = () => {
  const errors: Record<string, string> = {}
  let isValid = true
  
  // Email validation
  if (props.modelValue.email && props.modelValue.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(props.modelValue.email)) {
      errors.email = 'Please enter a valid email address'
      isValid = false
    }
  }
  
  // Website validation
  if (props.modelValue.website && props.modelValue.website.trim()) {
    const urlRegex = /^https?:\/\/[^\s]+$/
    if (!urlRegex.test(props.modelValue.website)) {
      errors.website = 'Website must be a valid URL starting with http:// or https://'
      isValid = false
    }
  }
  
  // Phone validation (basic)
  if (props.modelValue.primary_phone && props.modelValue.primary_phone.trim()) {
    const phoneRegex = /^[+\-\s().\d]{10,}$/
    if (!phoneRegex.test(props.modelValue.primary_phone.replace(/\s/g, ''))) {
      errors.primary_phone = 'Please enter a valid phone number'
      isValid = false
    }
  }
  
  if (props.modelValue.secondary_phone && props.modelValue.secondary_phone.trim()) {
    const phoneRegex = /^[+\-\s().\d]{10,}$/
    if (!phoneRegex.test(props.modelValue.secondary_phone.replace(/\s/g, ''))) {
      errors.secondary_phone = 'Please enter a valid phone number'
      isValid = false
    }
  }
  
  // Annual revenue validation
  if (props.modelValue.annual_revenue !== null && props.modelValue.annual_revenue !== undefined) {
    if (props.modelValue.annual_revenue < 0) {
      errors.annual_revenue = 'Annual revenue cannot be negative'
      isValid = false
    }
  }
  
  // Description length validation
  if (props.modelValue.description && props.modelValue.description.length > 2000) {
    errors.description = 'Description must be less than 2000 characters'
    isValid = false
  }
  
  // Emit validation result
  emit('validate', 3, isValid, errors)
}

/**
 * Watch for changes to trigger validation
 */
watch(
  () => [
    props.modelValue.email,
    props.modelValue.website,
    props.modelValue.primary_phone,
    props.modelValue.secondary_phone,
    props.modelValue.annual_revenue,
    props.modelValue.description
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

/**
 * Phone number formatting helper (unused for now)
 */
// const formatPhoneNumber = (value: string): string => {
//   // Basic US phone number formatting
//   const cleaned = value.replace(/\D/g, '')
//   const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
//   
//   if (match) {
//     return `(${match[1]}) ${match[2]}-${match[3]}`
//   }
//   
//   return value
// }
</script>