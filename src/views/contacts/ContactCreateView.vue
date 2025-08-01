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
        Add a new contact with their organization, authority level, and contact details in three simple steps.
      </p>
    </div>

    <!-- Multi-Step Contact Form -->
    <ContactFormWrapper
      :is-editing="false"
      @success="handleSuccess"
      @cancel="handleCancel"
      @draft-saved="handleDraftSaved"
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
import ContactFormWrapper from '@/components/forms/ContactFormWrapper.vue'
const router = useRouter()

// State
const submitError = ref<string | null>(null)

// Handle successful form submission
const handleSuccess = (contactId: string) => {
  // ContactFormWrapper already handles the creation and navigation
  // This event is fired after successful contact creation
  console.log('Contact created successfully with ID:', contactId)
  submitError.value = null
}

// Handle draft saving
const handleDraftSaved = (formData: any) => {
  console.log('Contact form draft saved:', formData)
}

// Handle form cancellation
const handleCancel = () => {
  router.push('/contacts')
}
</script>