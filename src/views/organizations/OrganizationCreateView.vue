<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <nav class="flex items-center space-x-2 text-sm text-gray-500 mb-2">
          <router-link to="/organizations" class="hover:text-gray-700">Organizations</router-link>
          <ChevronRightIcon class="h-4 w-4" />
          <span class="text-gray-900">New Organization</span>
        </nav>
        <h1 class="text-2xl font-bold text-gray-900">Create New Organization</h1>
        <p class="mt-1 text-sm text-gray-500">
          Add a new organization to your CRM system
        </p>
      </div>
      
      <router-link
        to="/organizations"
        class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <XMarkIcon class="h-4 w-4 mr-2" />
        Cancel
      </router-link>
    </div>

    <!-- Error Display -->
    <div v-if="submitError" class="bg-red-50 border border-red-200 rounded-md p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error Creating Organization</h3>
          <div class="mt-2 text-sm text-red-700">
            <p>{{ submitError }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="space-y-8">
      <!-- Basic Information -->
      <div class="bg-white shadow-sm rounded-lg border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Basic Information</h3>
          <p class="mt-1 text-sm text-gray-500">Essential details about the organization</p>
        </div>
        
        <div class="px-6 py-6 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Organization Name -->
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                Organization Name *
              </label>
              <input
                id="name"
                v-model="formData.name"
                type="text"
                required
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter organization name"
                :class="{ 'border-red-500 focus:ring-red-500 focus:border-red-500': errors.name }"
              >
              <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
            </div>

            <!-- Industry -->
            <div>
              <label for="industry" class="block text-sm font-medium text-gray-700 mb-2">
                Industry
              </label>
              <select
                id="industry"
                v-model="formData.industry"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select industry</option>
                <option v-for="industry in industries" :key="industry" :value="industry">
                  {{ industry }}
                </option>
              </select>
            </div>

            <!-- Status -->
            <div>
              <label for="status" class="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                id="status"
                v-model="formData.status"
                required
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Prospect">Prospect</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Customer">Customer</option>
                <option value="Partner">Partner</option>
                <option value="Vendor">Vendor</option>
              </select>
            </div>

            <!-- Employee Count -->
            <div>
              <label for="employees_count" class="block text-sm font-medium text-gray-700 mb-2">
                Employee Count
              </label>
              <input
                id="employees_count"
                v-model.number="formData.employees_count"
                type="number"
                min="1"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Number of employees"
              >
            </div>
          </div>

          <!-- Description -->
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              v-model="formData.description"
              rows="3"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brief description of the organization"
            />
          </div>
        </div>
      </div>

      <!-- Contact Information -->
      <div class="bg-white shadow-sm rounded-lg border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Contact Information</h3>
          <p class="mt-1 text-sm text-gray-500">How to reach this organization</p>
        </div>
        
        <div class="px-6 py-6 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Email -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                v-model="formData.email"
                type="email"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="contact@organization.com"
                :class="{ 'border-red-500 focus:ring-red-500 focus:border-red-500': errors.email }"
              >
              <p v-if="errors.email" class="mt-1 text-sm text-red-600">{{ errors.email }}</p>
            </div>

            <!-- Phone -->
            <div>
              <label for="primary_phone" class="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                id="primary_phone"
                v-model="formData.primary_phone"
                type="tel"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="+1 (555) 123-4567"
              >
            </div>

            <!-- Website -->
            <div>
              <label for="website" class="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                id="website"
                v-model="formData.website"
                type="url"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://www.organization.com"
                :class="{ 'border-red-500 focus:ring-red-500 focus:border-red-500': errors.website }"
              >
              <p v-if="errors.website" class="mt-1 text-sm text-red-600">{{ errors.website }}</p>
            </div>

          </div>
        </div>
      </div>

      <!-- Address Information -->
      <div class="bg-white shadow-sm rounded-lg border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Address Information</h3>
          <p class="mt-1 text-sm text-gray-500">Physical location details</p>
        </div>
        
        <div class="px-6 py-6 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Street Address -->
            <div class="md:col-span-2">
              <label for="address_line_1" class="block text-sm font-medium text-gray-700 mb-2">
                Street Address
              </label>
              <input
                id="address_line_1"
                v-model="formData.address_line_1"
                type="text"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="123 Main Street"
              >
            </div>

            <!-- Address Line 2 -->
            <div class="md:col-span-2">
              <label for="address_line_2" class="block text-sm font-medium text-gray-700 mb-2">
                Address Line 2 (Optional)
              </label>
              <input
                id="address_line_2"
                v-model="formData.address_line_2"
                type="text"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Suite, unit, building, floor, etc."
              >
            </div>

            <!-- City -->
            <div>
              <label for="city" class="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                id="city"
                v-model="formData.city"
                type="text"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="New York"
              >
            </div>

            <!-- State/Province -->
            <div>
              <label for="state_province" class="block text-sm font-medium text-gray-700 mb-2">
                State/Province
              </label>
              <input
                id="state_province"
                v-model="formData.state_province"
                type="text"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="NY"
              >
            </div>

            <!-- Postal Code -->
            <div>
              <label for="postal_code" class="block text-sm font-medium text-gray-700 mb-2">
                Postal Code
              </label>
              <input
                id="postal_code"
                v-model="formData.postal_code"
                type="text"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="10001"
              >
            </div>

            <!-- Country -->
            <div>
              <label for="country" class="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <input
                id="country"
                v-model="formData.country"
                type="text"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="United States"
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
        <router-link
          to="/organizations"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </router-link>
        
        <button
          type="submit"
          :disabled="isSubmitting"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div v-if="isSubmitting" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          {{ isSubmitting ? 'Creating...' : 'Create Organization' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronRightIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { useOrganizationStore } from '@/stores/organizationStore'
// Simple validation - removing complex validation composable dependency
import type { OrganizationInsert, OrganizationStatus } from '@/types/database.types'

/**
 * Organization Create View
 * Form for creating new organizations with validation
 */

const router = useRouter()
const organizationStore = useOrganizationStore()
// Simple validation function for basic organization data
const validateOrganization = (data: any) => {
  const errors: Record<string, string> = {}
  
  if (!data.name?.trim()) {
    errors.name = 'Organization name is required'
  }
  
  if (data.email && !/^[^@]+@[^@]+\.[^@]+$/.test(data.email)) {
    errors.email = 'Please enter a valid email address'
  }
  
  if (data.website && !data.website.startsWith('http')) {
    errors.website = 'Website must start with http:// or https://'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Form state
const isSubmitting = ref(false)
const errors = ref<Record<string, string>>({})
const submitError = ref<string>('')

// Form data - using correct database types
const formData = reactive({
  name: '',
  industry: null as string | null,
  status: 'Prospect' as OrganizationStatus,
  description: null as string | null,
  website: null as string | null,
  email: null as string | null,
  primary_phone: null as string | null,
  employees_count: null as number | null,
  address_line_1: null as string | null,
  address_line_2: null as string | null,
  city: null as string | null,
  state_province: null as string | null,
  postal_code: null as string | null,
  country: null as string | null
})

// Industry options
const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Real Estate',
  'Consulting',
  'Non-profit',
  'Government',
  'Media & Entertainment',
  'Transportation',
  'Energy',
  'Agriculture',
  'Construction',
  'Food & Beverage',
  'Telecommunications',
  'Automotive',
  'Aerospace',
  'Other'
]

// Methods
const validateForm = (): boolean => {
  const validation = validateOrganization(formData)
  errors.value = validation.errors
  return validation.isValid
}

// Helper function to prepare data for submission
const prepareSubmissionData = (data: OrganizationInsert): OrganizationInsert => {
  const cleanData: OrganizationInsert = {
    name: data.name.trim()
  }
  
  // Only include non-empty string fields
  if (data.industry?.trim()) cleanData.industry = data.industry.trim()
  if (data.description?.trim()) cleanData.description = data.description.trim()
  if (data.website?.trim()) cleanData.website = data.website.trim()
  if (data.email?.trim()) cleanData.email = data.email.trim()
  if (data.primary_phone?.trim()) cleanData.primary_phone = data.primary_phone.trim()
  if (data.address_line_1?.trim()) cleanData.address_line_1 = data.address_line_1.trim()
  if (data.address_line_2?.trim()) cleanData.address_line_2 = data.address_line_2.trim()
  if (data.city?.trim()) cleanData.city = data.city.trim()
  if (data.state_province?.trim()) cleanData.state_province = data.state_province.trim()
  if (data.postal_code?.trim()) cleanData.postal_code = data.postal_code.trim()
  if (data.country?.trim()) cleanData.country = data.country.trim()
  
  // Include status (required field with default)
  cleanData.status = data.status || 'Prospect'
  
  // Include numeric fields if they have valid values
  if (typeof data.employees_count === 'number' && data.employees_count > 0) {
    cleanData.employees_count = data.employees_count
  }
  
  return cleanData
}

const handleSubmit = async () => {
  // Clear previous errors
  errors.value = {}
  submitError.value = ''
  
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true
  
  try {
    console.log('Submitting organization data:', formData)
    
    // Prepare clean data for submission
    const submitData = prepareSubmissionData(formData)
    console.log('Cleaned submission data:', submitData)
    
    const organization = await organizationStore.createOrganization(submitData)
    console.log('Organization created:', organization)
    
    if (organization?.id) {
      // Success - navigate to the new organization's detail page
      console.log('Organization created successfully, navigating to detail page')
      await router.push(`/organizations/${organization.id}`)
    } else {
      // Success but no ID returned - go to organizations list
      console.log('Organization created successfully, navigating to list')
      await router.push('/organizations')
    }
  } catch (error) {
    console.error('Error creating organization:', error)
    
    // Handle different types of errors
    if (error && typeof error === 'object') {
      if ('message' in error) {
        submitError.value = (error as any).message
      } else if ('details' in error) {
        const serverErrors = (error as any).details as Record<string, string>
        errors.value = { ...errors.value, ...serverErrors }
      } else {
        submitError.value = 'An unexpected error occurred'
      }
    } else {
      submitError.value = 'Failed to create organization. Please try again.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>