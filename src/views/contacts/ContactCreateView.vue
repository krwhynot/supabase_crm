<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center space-x-3 mb-4">
        <router-link
          to="/contacts"
          class="text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon class="h-5 w-5" />
        </router-link>
        <h1 class="text-3xl font-bold text-gray-900">Create New Contact</h1>
      </div>
      <p class="text-gray-600">
        Add a key contact who influences Principal product purchases within their organization.
      </p>
    </div>

    <!-- Contact Form -->
    <ContactForm
      :is-editing="false"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
    
    <!-- Error Display -->
    <div v-if="submitError" class="mt-6 p-4 border border-red-300 rounded-md bg-red-50">
      <div class="flex">
        <ExclamationTriangleIcon class="h-5 w-5 text-red-400 mr-2 mt-0.5" />
        <div>
          <h3 class="text-sm font-medium text-red-800">Error creating contact</h3>
          <p class="mt-1 text-sm text-red-700">{{ submitError }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import ContactForm from '@/components/forms/ContactForm.vue'
import { useContactStore } from '@/stores/contactStore'
import { ContactValidator } from '@/types/contacts'
import type { ContactCreateForm } from '@/types/contacts'

const router = useRouter()
const contactStore = useContactStore()

// State
const submitError = ref<string | null>(null)

// Handle form submission
const handleSubmit = async (formData: ContactCreateForm & { _principalIds?: string[] }) => {
  try {
    submitError.value = null
    
    // Extract principal IDs before converting form data
    const principalIds = formData._principalIds || []
    
    // Convert form data (removing the _principalIds helper field)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _principalIds, ...cleanFormData } = formData
    const contactData = ContactValidator.formToInsert(cleanFormData)
    
    // Create the contact first
    const createdContact = await contactStore.createContact(contactData)

    if (createdContact) {
      // Principal functionality removed during cleanup - was incomplete
      if (principalIds.length > 0) {
        console.log('Principal IDs would be associated:', principalIds)
      }
      
      // Success - redirect to contact detail or list
      router.push(`/contacts/${createdContact.id}`)
    } else {
      submitError.value = contactStore.errorMessage || 'Failed to create contact'
    }
  } catch (error) {
    console.error('Error creating contact:', error)
    submitError.value = 'An unexpected error occurred while creating the contact'
  }
}

// Handle form cancellation
const handleCancel = () => {
  router.push('/contacts')
}
</script>