<template>
  <div class="bg-white shadow-sm rounded-lg border border-gray-200">
    <!-- Form Header -->
    <div class="px-6 py-4 border-b border-gray-200">
      <h3 class="text-lg font-medium text-gray-900">
        {{ isEditing ? 'Edit Contact' : 'Create New Contact' }}
      </h3>
      <p class="mt-1 text-sm text-gray-600">
        Add a key contact who influences Principal product purchases within their organization.
      </p>
    </div>

    <!-- Form Content -->
    <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
      <!-- Required Fields Section -->
      <div class="grid grid-cols-1 gap-6">
        <div class="border-b border-gray-200 pb-6">
          <h4 class="text-md font-medium text-gray-900 mb-4">Required Information</h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- First Name -->
            <BaseInputField
              v-model="formData.first_name"
              name="first_name"
              label="First Name"
              required
              :error="errors.first_name"
              placeholder="Enter first name"
              @blur="validateField('first_name')"
            />

            <!-- Last Name -->
            <BaseInputField
              v-model="formData.last_name"
              name="last_name"
              label="Last Name"
              required
              :error="errors.last_name"
              placeholder="Enter last name"
              @blur="validateField('last_name')"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <!-- Organization Searchable Dropdown -->
            <div class="space-y-1">
              <label for="organization" class="block text-sm font-medium text-gray-700">
                Organization <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <div class="flex">
                  <div class="flex-1">
                    <SelectField
                      v-model="formData.organization_id"
                      name="organization_id"
                      label="Organization"
                      :options="organizationOptions"
                      required
                      :error="errors.organization_id"
                      placeholder="Search and select organization..."
                      searchable
                      @blur="validateField('organization_id')"
                    />
                  </div>
                  <button
                    type="button"
                    @click="showCreateOrganization = true"
                    class="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusIcon class="h-4 w-4" />
                    <span class="ml-1 hidden sm:inline">New</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Position Dropdown with Add New -->
            <div class="space-y-1">
              <label for="position" class="block text-sm font-medium text-gray-700">
                Position <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <div class="flex">
                  <div class="flex-1">
                    <SelectField
                      v-model="formData.position"
                      name="position"
                      label="Position"
                      :options="positionOptions"
                      required
                      :error="errors.position"
                      placeholder="Select position..."
                      @blur="validateField('position')"
                      allow-custom
                    />
                  </div>
                  <button
                    type="button"
                    @click="showAddPosition = true"
                    class="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusIcon class="h-4 w-4" />
                    <span class="ml-1 hidden sm:inline">Add</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Important Fields Section -->
        <div class="border-b border-gray-200 pb-6">
          <h4 class="text-md font-medium text-gray-900 mb-4">Purchase Decision Information</h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Purchase Influence -->
            <SelectField
              v-model="formData.purchase_influence"
              name="purchase_influence"
              label="Purchase Influence"
              required
              :options="purchaseInfluenceOptions"
              :error="errors.purchase_influence"
              placeholder="Select influence level..."
              @blur="validateField('purchase_influence')"
            />

            <!-- Decision Authority -->
            <SelectField
              v-model="formData.decision_authority"
              name="decision_authority"
              label="Decision Authority"
              required
              :options="decisionAuthorityOptions"
              :error="errors.decision_authority"
              placeholder="Select decision role..."
              @blur="validateField('decision_authority')"
            />
          </div>

          <!-- Preferred Principals Multi-Select -->
          <div class="mt-4">
            <label for="preferred_principals" class="block text-sm font-medium text-gray-700">
              Preferred Principal Brands
            </label>
            <div class="mt-1">
              <SelectField
                v-model="formData.preferred_principals"
                name="preferred_principals"
                label="Preferred Principal Brands"
                :options="principalOptions"
                :error="errors.preferred_principals"
                placeholder="Select Principal brands this contact advocates for..."
                multiple
                @blur="validateField('preferred_principals')"
              />
            </div>
            <p class="mt-1 text-xs text-gray-500">
              Select the Principal brands this contact champions within their organization
            </p>
          </div>
        </div>

        <!-- Optional Fields Section -->
        <div class="space-y-4">
          <h4 class="text-md font-medium text-gray-900">Contact Details (Optional)</h4>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Phone -->
            <BaseInputField
              v-model="formData.phone"
              name="phone"
              label="Phone Number"
              type="tel"
              :error="errors.phone"
              placeholder="(555) 123-4567"
              @blur="validateField('phone')"
            />

            <!-- Email -->
            <BaseInputField
              v-model="formData.email"
              name="email"
              label="Email Address"
              type="email"
              :error="errors.email"
              placeholder="contact@organization.com"
              @blur="validateField('email')"
            />
          </div>

          <!-- Address Fields -->
          <div class="space-y-4">
            <h5 class="text-sm font-medium text-gray-700">Address</h5>
            
            <BaseInputField
              v-model="formData.address"
              name="address"
              label="Street Address"
              :error="errors.address"
              placeholder="123 Main Street"
              @blur="validateField('address')"
            />

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <BaseInputField
                v-model="formData.city"
                name="city"
                label="City"
                :error="errors.city"
                placeholder="City"
                @blur="validateField('city')"
              />

              <BaseInputField
                v-model="formData.state"
                name="state"
                label="State"
                :error="errors.state"
                placeholder="State"
                @blur="validateField('state')"
              />

              <BaseInputField
                v-model="formData.zip_code"
                name="zip_code"
                label="ZIP Code"
                :error="errors.zip_code"
                placeholder="12345"
                @blur="validateField('zip_code')"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Website -->
            <BaseInputField
              v-model="formData.website"
              name="website"
              label="Website"
              type="url"
              :error="errors.website"
              placeholder="https://www.organization.com"
              @blur="validateField('website')"
            />

            <!-- Account Manager -->
            <BaseInputField
              v-model="formData.account_manager"
              name="account_manager"
              label="Account Manager"
              :error="errors.account_manager"
              placeholder="Assigned account manager"
              @blur="validateField('account_manager')"
            />
          </div>

          <!-- Notes -->
          <TextareaField
            v-model="formData.notes"
            name="notes"
            label="Notes"
            :error="errors.notes"
            placeholder="Additional notes about this contact..."
            :rows="4"
            @blur="validateField('notes')"
          />

          <!-- Primary Contact Checkbox -->
          <CheckboxField
            v-model="formData.is_primary"
            name="is_primary"
            label="Primary Contact"
            description="Mark this as the primary contact for the organization"
          />
        </div>
      </div>

      <!-- Form Actions -->
      <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          @click="$emit('cancel')"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="isSubmitting || !isFormValid"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isSubmitting" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isEditing ? 'Updating...' : 'Creating...' }}
          </span>
          <span v-else>
            {{ isEditing ? 'Update Contact' : 'Create Contact' }}
          </span>
        </button>
      </div>
    </form>

    <!-- Create Organization Modal -->
    <OrganizationCreateModal
      v-if="showCreateOrganization"
      @close="showCreateOrganization = false"
      @created="handleOrganizationCreated"
    />

    <!-- Add Position Modal -->
    <AddPositionModal
      v-if="showAddPosition"
      @close="showAddPosition = false"
      @added="handlePositionAdded"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { PlusIcon } from '@heroicons/vue/24/outline'
import BaseInputField from './BaseInputField.vue'
import SelectField from './SelectField.vue'
import TextareaField from './TextareaField.vue'
import CheckboxField from './CheckboxField.vue'
import OrganizationCreateModal from '../organizations/OrganizationCreateModal.vue'
import AddPositionModal from './AddPositionModal.vue'
import { 
  ContactCreateForm, 
  ContactUpdateForm,
  ContactValidator,
  POSITION_OPTIONS,
  PURCHASE_INFLUENCE_OPTIONS,
  DECISION_AUTHORITY_OPTIONS,
  fieldValidators
} from '@/types/contacts'
import { useOrganizationStore } from '@/stores/organizationStore'
import type { Contact } from '@/types/database.types'

// Form interface for component state (all strings for v-model compatibility)
interface ContactFormData {
  first_name: string
  last_name: string
  organization_id: string
  position: string
  purchase_influence: 'High' | 'Medium' | 'Low' | 'Unknown'
  decision_authority: 'Decision Maker' | 'Influencer' | 'End User' | 'Gatekeeper'
  preferred_principals: string[]
  phone: string
  email: string
  address: string
  city: string
  state: string
  zip_code: string
  website: string
  account_manager: string
  notes: string
  is_primary: boolean
}

// Props
interface Props {
  contact?: Contact | null
  isEditing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  contact: null,
  isEditing: false
})

// Emits
const emit = defineEmits<{
  submit: [data: ContactCreateForm | ContactUpdateForm]
  cancel: []
}>()

// Stores
const organizationStore = useOrganizationStore()

// Reactive state
const isSubmitting = ref(false)
const showCreateOrganization = ref(false)
const showAddPosition = ref(false)

// Form data
const formData = reactive<ContactFormData>({
  first_name: '',
  last_name: '',
  organization_id: '',
  position: '',
  purchase_influence: 'Unknown',
  decision_authority: 'End User',
  preferred_principals: [],
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  website: '',
  account_manager: '',
  notes: '',
  is_primary: false
})

// Form errors
const errors = reactive<Record<string, string>>({})

// Load form data if editing
if (props.isEditing && props.contact) {
  const contactData = ContactValidator.contactToForm(props.contact)
  // Convert nullable fields to strings for form compatibility
  Object.assign(formData, {
    ...contactData,
    phone: contactData.phone || '',
    email: contactData.email || '',
    address: contactData.address || '',
    city: contactData.city || '',
    state: contactData.state || '',
    zip_code: contactData.zip_code || '',
    website: contactData.website || '',
    account_manager: contactData.account_manager || '',
    notes: contactData.notes || '',
    preferred_principals: contactData.preferred_principals || []
  })
}

// Computed properties
const isFormValid = computed(() => {
  const requiredFields = ['first_name', 'last_name', 'organization_id', 'position', 'purchase_influence', 'decision_authority']
  return requiredFields.every(field => formData[field as keyof ContactFormData]) && 
         Object.keys(errors).every(key => !errors[key])
})

// Organization options for dropdown
const organizationOptions = computed(() => {
  return organizationStore.organizations.map(org => ({
    value: org.id,
    label: org.name,
    subtitle: org.industry || undefined
  }))
})

// Position options with dynamic additions
const positionOptions = ref<Array<{value: string, label: string}>>([
  ...POSITION_OPTIONS.map(pos => ({ value: pos, label: pos }))
])

// Purchase influence options
const purchaseInfluenceOptions = PURCHASE_INFLUENCE_OPTIONS.map(influence => ({
  value: influence,
  label: influence,
  description: getInfluenceDescription(influence)
}))

// Decision authority options
const decisionAuthorityOptions = DECISION_AUTHORITY_OPTIONS.map(authority => ({
  value: authority,
  label: authority,
  description: getAuthorityDescription(authority)
}))

// Principal options from organizations filtered as Principals
const principalOptions = computed(() => {
  // Filter organizations that could be considered Principal brands
  // This could be based on organization type, tags, or a specific field
  return organizationStore.organizations
    .filter(org => 
      org.name.toLowerCase().includes('principal') || // Name contains 'principal'
      org.status === 'Partner' || // Based on partner status
      org.status === 'Vendor' // Or vendor status - adjust based on your Principal identification criteria
    )
    .map(org => ({
      value: org.id,
      label: org.name,
      subtitle: org.industry || undefined
    }))
})

// Helper functions
function getInfluenceDescription(influence: string): string {
  switch (influence) {
    case 'High': return 'Significant decision-making power'
    case 'Medium': return 'Moderate influence on purchases'
    case 'Low': return 'Limited purchase decision impact'
    case 'Unknown': return 'Influence level needs assessment'
    default: return ''
  }
}

function getAuthorityDescription(authority: string): string {
  switch (authority) {
    case 'Decision Maker': return 'Final approval authority'
    case 'Influencer': return 'Influences purchase decisions'
    case 'End User': return 'Uses the products/services'
    case 'Gatekeeper': return 'Controls access to decision makers'
    default: return ''
  }
}

// Validation methods
const validateField = async (fieldName: string) => {
  const value = formData[fieldName as keyof ContactFormData]
  
  try {
    if (fieldName === 'first_name' || fieldName === 'last_name') {
      const error = fieldValidators.requiredText(value as string, fieldName.replace('_', ' '))
      errors[fieldName] = error || ''
    } else if (fieldName === 'organization_id') {
      const error = fieldValidators.requiredSelect(value as string, 'Organization')
      errors[fieldName] = error || ''
    } else if (fieldName === 'position') {
      const error = fieldValidators.requiredText(value as string, 'Position')
      errors[fieldName] = error || ''
    } else if (fieldName === 'purchase_influence' || fieldName === 'decision_authority') {
      const error = fieldValidators.requiredSelect(value as string, fieldName.replace('_', ' '))
      errors[fieldName] = error || ''
    } else if (fieldName === 'phone') {
      const error = fieldValidators.phone(value as string)
      errors[fieldName] = error || ''
    } else if (fieldName === 'email') {
      const error = fieldValidators.email(value as string)
      errors[fieldName] = error || ''
    } else if (fieldName === 'website') {
      const error = fieldValidators.website(value as string)
      errors[fieldName] = error || ''
    } else {
      // For other optional text fields
      const error = fieldValidators.optionalText(value as string, fieldName.replace('_', ' '))
      errors[fieldName] = error || ''
    }
  } catch (error) {
    errors[fieldName] = 'Validation error'
  }
}

// Form submission
const handleSubmit = async () => {
  if (isSubmitting.value) return

  try {
    isSubmitting.value = true
    
    // Convert form data to ContactCreateForm/ContactUpdateForm format (with nullable fields)
    const convertedData: ContactCreateForm = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      organization_id: formData.organization_id,
      position: formData.position,
      purchase_influence: formData.purchase_influence,
      decision_authority: formData.decision_authority,
      preferred_principals: formData.preferred_principals,
      phone: formData.phone || null,
      email: formData.email || null,
      address: formData.address || null,
      city: formData.city || null,
      state: formData.state || null,
      zip_code: formData.zip_code || null,
      website: formData.website || null,
      account_manager: formData.account_manager || null,
      notes: formData.notes || null,
      is_primary: formData.is_primary
    }
    
    // Validate converted data
    const result = props.isEditing 
      ? await ContactValidator.validateUpdate(convertedData)
      : await ContactValidator.validateCreate(convertedData)

    if (!result.isValid) {
      // Set field errors
      result.errors.forEach(error => {
        errors[error.field] = error.message
      })
      return
    }

    // Emit validated data with principal relationships
    const submitData = {
      ...result.data!,
      _principalIds: formData.preferred_principals // Include principal IDs for relationship handling
    }
    emit('submit', submitData)
    
  } catch (error) {
    console.error('Form validation error:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Event handlers
const handleOrganizationCreated = (organization: any) => {
  // Add new organization to options and select it
  organizationStore.organizations.push(organization)
  formData.organization_id = organization.id
  showCreateOrganization.value = false
}

const handlePositionAdded = (position: string) => {
  // Add new position to options and select it
  positionOptions.value.push({ value: position, label: position })
  formData.position = position
  showAddPosition.value = false
}

// Load organizations on mount
onMounted(async () => {
  if (organizationStore.organizations.length === 0) {
    await organizationStore.fetchOrganizations()
  }
})

// Watch for prop changes (if contact is updated externally)
watch(() => props.contact, (newContact) => {
  if (newContact && props.isEditing) {
    const contactData = ContactValidator.contactToForm(newContact)
    Object.assign(formData, contactData)
  }
}, { deep: true })
</script>

<style scoped>
/* Custom styles for form sections */
.form-section {
  @apply border-b border-gray-200 pb-6 mb-6 last:border-b-0 last:pb-0 last:mb-0;
}

.form-section h4 {
  @apply text-base font-medium text-gray-900 mb-4;
}

.field-group {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.field-group-triple {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4;
}
</style>