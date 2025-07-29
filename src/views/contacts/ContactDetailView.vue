<template>
  
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Loading State -->
      <div v-if="loading" class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div class="flex justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-white rounded-lg shadow-sm border border-red-200 p-6">
        <div class="flex items-center mb-4">
          <svg class="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <button
            @click="loadContact"
            class="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>

      <!-- Contact Details -->
      <div v-else-if="contact" class="space-y-6">
        <!-- Header -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center space-x-3">
              <router-link
                to="/"
                class="text-gray-500 hover:text-gray-700"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </router-link>
              <h1 class="text-3xl font-bold text-gray-900">Contact Details</h1>
            </div>
            <div class="flex space-x-3">
              <router-link
                :to="`/contacts/${contact.id}/edit`"
                class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Contact
              </router-link>
              <button
                @click="confirmDelete"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
              >
                <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>

          <!-- Contact Avatar and Basic Info -->
          <div class="flex items-center space-x-6">
            <div class="flex-shrink-0">
              <div class="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                <span class="text-2xl font-medium text-blue-600">
                  {{ getInitials(contact) }}
                </span>
              </div>
            </div>
            <div class="flex-1">
              <h2 class="text-2xl font-bold text-gray-900">{{ getFullName(contact) }}</h2>
              <p v-if="contact.position" class="text-lg text-gray-600 mt-1">{{ contact.position }}</p>
              <p class="text-lg text-gray-600 mt-1">{{ contact.organization_name }}</p>
            </div>
          </div>
        </div>

        <!-- Contact Information -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-6">Contact Information</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Email -->
            <div class="flex items-center space-x-3">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div>
                <p class="text-sm font-medium text-gray-500">Email</p>
                <a 
                  :href="`mailto:${contact.email}`"
                  class="text-blue-600 hover:text-blue-800"
                >
                  {{ contact.email }}
                </a>
              </div>
            </div>

            <!-- Phone -->
            <div class="flex items-center space-x-3">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <div>
                <p class="text-sm font-medium text-gray-500">Phone</p>
                <p class="text-gray-900">{{ formatPhone(contact.phone) }}</p>
              </div>
            </div>

            <!-- Organization -->
            <div class="flex items-center space-x-3">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <div>
                <p class="text-sm font-medium text-gray-500">Organization</p>
                <p class="text-gray-900">{{ contact.organization_name }}</p>
              </div>
            </div>

            <!-- Added Date -->
            <div class="flex items-center space-x-3">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <p class="text-sm font-medium text-gray-500">Added</p>
                <p class="text-gray-900">{{ formatDate(contact.created_at) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Notes Section -->
        <div v-if="contact.notes" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Notes</h3>
          <div class="prose max-w-none">
            <p class="text-gray-700 whitespace-pre-wrap">{{ contact.notes }}</p>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div class="mt-3 text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mt-4">Delete Contact</h3>
            <div class="mt-2 px-7 py-3">
              <p class="text-sm text-gray-500">
                Are you sure you want to delete <strong>{{ contact ? getFullName(contact) : 'this contact' }}</strong>? 
                This action cannot be undone.
              </p>
            </div>
            <div class="items-center px-4 py-3">
              <div class="flex space-x-3 justify-center">
                <button
                  @click="showDeleteModal = false"
                  class="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  @click="deleteContact"
                  :disabled="deleting"
                  class="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-600 disabled:opacity-50"
                >
                  {{ deleting ? 'Deleting...' : 'Delete' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { contactsApi } from '@/services/contactsApi'
import { contactUtils } from '@/types/contacts'
import type { ContactDetailView } from '@/types/database.types'

// Layout Components

const route = useRoute()
const router = useRouter()

// Get contact ID from route params
const contactId = route.params.id as string

// Reactive state
const contact = ref<ContactDetailView | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const showDeleteModal = ref(false)
const deleting = ref(false)

// Load contact details
const loadContact = async () => {
  try {
    loading.value = true
    error.value = null
    
    const response = await contactsApi.getContact(contactId)

    if (response.success && response.data) {
      contact.value = response.data
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

// Delete contact
const confirmDelete = () => {
  showDeleteModal.value = true
}

const deleteContact = async () => {
  if (!contact.value) return
  
  try {
    deleting.value = true
    
    const response = await contactsApi.deleteContact(contact.value.id)

    if (response.success) {
      // Success - redirect to contacts list
      router.push('/contacts')
    } else {
      error.value = response.error || 'Failed to delete contact'
      showDeleteModal.value = false
    }
  } catch (err) {
    console.error('Error deleting contact:', err)
    error.value = 'An unexpected error occurred'
    showDeleteModal.value = false
  } finally {
    deleting.value = false
  }
}

// Utility functions
const getFullName = (contact: ContactDetailView): string => {
  return contactUtils.getFullName(contact)
}

const getInitials = (contact: ContactDetailView): string => {
  return contactUtils.getInitials(contact)
}

const formatPhone = (phone: string | null): string => {
  return contactUtils.formatPhone(phone)
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Unknown'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Load contact on mount
onMounted(() => {
  loadContact()
})
</script>