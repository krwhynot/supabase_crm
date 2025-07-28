<template>
  <DashboardLayout>
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center space-x-3 mb-4">
          <router-link
            to="/contacts"
            class="text-gray-500 hover:text-gray-700"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </router-link>
          <h1 class="text-3xl font-bold text-gray-900">New Contact</h1>
        </div>
        <p class="text-gray-600">Add a new contact to your CRM</p>
      </div>

      <!-- Form -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form @submit.prevent="handleSubmit">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- First Name -->
            <div>
              <label for="first_name" class="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                id="first_name"
                v-model="form.first_name"
                type="text"
                required
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500': validationErrors.first_name }"
                placeholder="Enter first name"
              />
              <p v-if="validationErrors.first_name" class="mt-1 text-sm text-red-600">
                {{ validationErrors.first_name }}
              </p>
            </div>

            <!-- Last Name -->
            <div>
              <label for="last_name" class="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                id="last_name"
                v-model="form.last_name"
                type="text"
                required
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500': validationErrors.last_name }"
                placeholder="Enter last name"
              />
              <p v-if="validationErrors.last_name" class="mt-1 text-sm text-red-600">
                {{ validationErrors.last_name }}
              </p>
            </div>

            <!-- Email -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                required
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500': validationErrors.email }"
                placeholder="Enter email address"
              />
              <p v-if="validationErrors.email" class="mt-1 text-sm text-red-600">
                {{ validationErrors.email }}
              </p>
            </div>

            <!-- Phone -->
            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                id="phone"
                v-model="form.phone"
                type="tel"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500': validationErrors.phone }"
                placeholder="Enter phone number"
              />
              <p v-if="validationErrors.phone" class="mt-1 text-sm text-red-600">
                {{ validationErrors.phone }}
              </p>
            </div>

            <!-- Organization -->
            <div class="md:col-span-2">
              <label for="organization" class="block text-sm font-medium text-gray-700 mb-2">
                Organization *
              </label>
              <input
                id="organization"
                v-model="form.organization"
                type="text"
                required
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500': validationErrors.organization }"
                placeholder="Enter organization or company name"
              />
              <p v-if="validationErrors.organization" class="mt-1 text-sm text-red-600">
                {{ validationErrors.organization }}
              </p>
            </div>

            <!-- Title -->
            <div class="md:col-span-2">
              <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
                Job Title
              </label>
              <input
                id="title"
                v-model="form.title"
                type="text"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500': validationErrors.title }"
                placeholder="Enter job title"
              />
              <p v-if="validationErrors.title" class="mt-1 text-sm text-red-600">
                {{ validationErrors.title }}
              </p>
            </div>

            <!-- Notes -->
            <div class="md:col-span-2">
              <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                v-model="form.notes"
                rows="4"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500': validationErrors.notes }"
                placeholder="Add any additional notes about this contact..."
              ></textarea>
              <p v-if="validationErrors.notes" class="mt-1 text-sm text-red-600">
                {{ validationErrors.notes }}
              </p>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="submitError" class="mt-6 p-4 border border-red-200 rounded-md bg-red-50">
            <div class="flex">
              <svg class="h-5 w-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 class="text-sm font-medium text-red-800">Error creating contact</h3>
                <p class="mt-1 text-sm text-red-700">{{ submitError }}</p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-8 flex justify-end space-x-3">
            <router-link
              to="/contacts"
              class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </router-link>
            <button
              type="submit"
              :disabled="submitting"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg v-if="submitting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ submitting ? 'Creating...' : 'Create Contact' }}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { contactsApi } from '@/services/contactsApi'
import { ContactValidator } from '@/types/contacts'
import type { ContactCreateForm, ValidationError } from '@/types/contacts'

// Layout Components
import DashboardLayout from '@/components/DashboardLayout.vue'

const router = useRouter()

// Form state
const form = reactive<ContactCreateForm>({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  organization: '',
  title: '',
  notes: ''
})

// Validation and submission state
const validationErrors = ref<Record<string, string>>({})
const submitError = ref<string | null>(null)
const submitting = ref(false)


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
  try {
    submitting.value = true
    submitError.value = null
    
    // Validate form
    const isValid = await validateForm()
    if (!isValid) {
      return
    }

    // Convert form data and create contact
    const contactData = ContactValidator.formToInsert(form)
    const response = await contactsApi.createContact(contactData)

    if (response.success && response.data) {
      // Success - redirect to contact detail
      router.push(`/contacts/${response.data.id}`)
    } else {
      submitError.value = response.error || 'Failed to create contact'
    }
  } catch (error) {
    console.error('Error creating contact:', error)
    submitError.value = 'An unexpected error occurred'
  } finally {
    submitting.value = false
  }
}
</script>