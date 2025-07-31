<template>
  
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Loading State -->
      <div v-if="loading" class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div class="flex justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-white rounded-lg shadow-sm border border-danger p-6">
        <div class="flex items-center mb-4">
          <svg class="h-5 w-5 text-danger mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-red-700">{{ error }}</span>
        </div>
        <div class="flex space-x-3">
          <router-link
            to="/"
            class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Contacts
          </router-link>
          <Button
            @click="loadContact"
            variant="primary"
          >
            Try Again
          </Button>
        </div>
      </div>

      <!-- Edit Form -->
      <div v-else-if="contact">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center space-x-3 mb-4">
            <router-link
              :to="`/contacts/${contact.id}`"
              class="text-gray-500 hover:text-gray-700"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </router-link>
            <h1 class="text-3xl font-bold text-gray-900">Edit Contact</h1>
          </div>
          <p class="text-gray-600">Update contact information</p>
        </div>

        <!-- Form -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form @submit.prevent="handleSubmit">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- First Name -->
              <FormGroup
                name="first_name"
                label="First Name"
                :error="validationErrors.first_name"
                required
              >
                <template #default="{ fieldId, hasError, errorId }">
                  <input
                    :id="fieldId"
                    v-model="form.first_name"
                    type="text"
                    required
                    placeholder="Enter first name"
                    :aria-describedby="hasError ? errorId : undefined"
                    :aria-invalid="hasError ? 'true' : 'false'"
                    class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition duration-200 border-gray-300 focus:ring-primary"
                    :class="{ 'border-danger focus:ring-danger': hasError }"
                  />
                </template>
              </FormGroup>

              <!-- Last Name -->
              <FormGroup
                name="last_name"
                label="Last Name"
                :error="validationErrors.last_name"
                required
              >
                <template #default="{ fieldId, hasError, errorId }">
                  <input
                    :id="fieldId"
                    v-model="form.last_name"
                    type="text"
                    required
                    placeholder="Enter last name"
                    :aria-describedby="hasError ? errorId : undefined"
                    :aria-invalid="hasError ? 'true' : 'false'"
                    class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition duration-200 border-gray-300 focus:ring-primary"
                    :class="{ 'border-danger focus:ring-danger': hasError }"
                  />
                </template>
              </FormGroup>

              <!-- Email -->
              <FormGroup
                name="email"
                label="Email Address"
                :error="validationErrors.email"
                required
              >
                <template #default="{ fieldId, hasError, errorId }">
                  <input
                    :id="fieldId"
                    v-model="form.email"
                    type="email"
                    required
                    placeholder="Enter email address"
                    :aria-describedby="hasError ? errorId : undefined"
                    :aria-invalid="hasError ? 'true' : 'false'"
                    class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition duration-200 border-gray-300 focus:ring-primary"
                    :class="{ 'border-danger focus:ring-danger': hasError }"
                  />
                </template>
              </FormGroup>

              <!-- Phone -->
              <FormGroup
                name="phone"
                label="Phone Number"
                :error="validationErrors.phone"
              >
                <template #default="{ fieldId, hasError, errorId }">
                  <input
                    :id="fieldId"
                    v-model="form.phone"
                    type="tel"
                    placeholder="Enter phone number"
                    :aria-describedby="hasError ? errorId : undefined"
                    :aria-invalid="hasError ? 'true' : 'false'"
                    class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition duration-200 border-gray-300 focus:ring-primary"
                    :class="{ 'border-danger focus:ring-danger': hasError }"
                  />
                </template>
              </FormGroup>

              <!-- Organization -->
              <div class="md:col-span-2">
                <FormGroup
                  name="organization"
                  label="Organization"
                  :error="validationErrors.organization"
                  required
                >
                  <template #default="{ fieldId, hasError, errorId }">
                    <input
                      :id="fieldId"
                      v-model="form.organization_id"
                      type="text"
                      required
                      placeholder="Enter organization or company name"
                      :aria-describedby="hasError ? errorId : undefined"
                      :aria-invalid="hasError ? 'true' : 'false'"
                      class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition duration-200 border-gray-300 focus:ring-primary"
                      :class="{ 'border-danger focus:ring-danger': hasError }"
                    />
                  </template>
                </FormGroup>
              </div>

              <!-- Title -->
              <div class="md:col-span-2">
                <FormGroup
                  name="title"
                  label="Job Title"
                  :error="validationErrors.title"
                >
                  <template #default="{ fieldId, hasError, errorId }">
                    <input
                      :id="fieldId"
                      v-model="form.position"
                      type="text"
                      placeholder="Enter job title"
                      :aria-describedby="hasError ? errorId : undefined"
                      :aria-invalid="hasError ? 'true' : 'false'"
                      class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition duration-200 border-gray-300 focus:ring-primary"
                      :class="{ 'border-danger focus:ring-danger': hasError }"
                    />
                  </template>
                </FormGroup>
              </div>

              <!-- Notes -->
              <div class="md:col-span-2">
                <FormGroup
                  name="notes"
                  label="Notes"
                  :error="validationErrors.notes"
                >
                  <template #default="{ fieldId, hasError, errorId }">
                    <textarea
                      :id="fieldId"
                      v-model="form.notes"
                      rows="4"
                      placeholder="Add any additional notes about this contact..."
                      :aria-describedby="hasError ? errorId : undefined"
                      :aria-invalid="hasError ? 'true' : 'false'"
                      class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition duration-200 border-gray-300 focus:ring-primary"
                      :class="{ 'border-danger focus:ring-danger': hasError }"
                    ></textarea>
                  </template>
                </FormGroup>
              </div>
            </div>

            <!-- Error Message -->
            <div v-if="submitError" class="mt-6 p-4 border border-danger rounded-md bg-red-50">
              <div class="flex">
                <svg class="h-5 w-5 text-danger mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 class="text-sm font-medium text-red-800">Error updating contact</h3>
                  <p class="mt-1 text-sm text-red-700">{{ submitError }}</p>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="mt-8 flex justify-end space-x-3">
              <router-link
                :to="`/contacts/${contact.id}`"
                class="inline-flex items-center justify-center px-4 py-2 border text-sm font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary"
              >
                Cancel
              </router-link>
              <Button
                type="submit"
                variant="primary"
                :disabled="submitting"
              >
                <svg v-if="submitting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ submitting ? 'Updating...' : 'Update Contact' }}
              </Button>
            </div>
          </form>
        </div>
      </div>
      </div>
    </div>
  
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { contactsApi } from '@/services/contactsApi'
import { ContactValidator } from '@/types/contacts'
import type { ContactDetailView } from '@/types/database.types'
import type { ContactCreateForm, ValidationError } from '@/types/contacts'

// Layout Components
import Button from '@/components/atomic/Button.vue'
import FormGroup from '@/components/molecular/FormGroup.vue'

const route = useRoute()
const router = useRouter()

// Get contact ID from route params
const contactId = route.params.id as string

// State
const contact = ref<ContactDetailView | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// Form state
const form = reactive<ContactCreateForm>({
  first_name: '',
  last_name: '',
  organization_id: '',
  position: '',
  purchase_influence: 'Unknown',
  decision_authority: 'End User',
  preferred_principals: [],
  phone: null,
  email: null,
  address: null,
  city: null,
  state: null,
  zip_code: null,
  website: null,
  account_manager: null,
  notes: null,
  is_primary: false
})

// Validation and submission state
const validationErrors = ref<Record<string, string>>({})
const submitError = ref<string | null>(null)
const submitting = ref(false)

// Load contact details
const loadContact = async () => {
  try {
    loading.value = true
    error.value = null
    
    const response = await contactsApi.getContact(contactId)

    if (response.success && response.data) {
      contact.value = response.data
      
      // Populate form with contact data
      const contactData = ContactValidator.contactToForm(response.data)
      Object.assign(form, contactData)
    } else {
      error.value = response.error || 'Contact not found'
    }
  } catch (err) {
    error.value = 'An unexpected error occurred'
    console.error('Error loading contact:', err)
  } finally {
    loading.value = false
  }
}

// Validate form data
const validateForm = async (): Promise<boolean> => {
  try {
    const validation = await ContactValidator.validateCreate(form)
    
    if (validation.isValid) {
      validationErrors.value = {}
      return true
    } else {
      // Convert validation errors to field-indexed object
      const errors: Record<string, string> = {}
      validation.errors.forEach((error: ValidationError) => {
        errors[error.field] = error.message
      })
      validationErrors.value = errors
      return false
    }
  } catch (error) {
    console.error('Form validation error:', error)
    submitError.value = 'Form validation failed'
    return false
  }
}

// Handle form submission
const handleSubmit = async () => {
  if (!contact.value) return
  
  try {
    submitting.value = true
    submitError.value = null
    
    // Validate form
    const isValid = await validateForm()
    if (!isValid) {
      return
    }

    // Convert form data and update contact
    const updateData = ContactValidator.formToUpdate(form)
    const response = await contactsApi.updateContact(contact.value.id, updateData)

    if (response.success && response.data) {
      // Success - redirect to contact detail
      router.push(`/contacts/${response.data.id}`)
    } else {
      submitError.value = response.error || 'Failed to update contact'
    }
  } catch (error) {
    console.error('Error updating contact:', error)
    submitError.value = 'An unexpected error occurred'
  } finally {
    submitting.value = false
  }
}

// Load contact on mount
onMounted(() => {
  loadContact()
})
</script>