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

    <!-- Multi-step Form -->
    <OrganizationFormWrapper
      @success="handleSuccess"
      @cancel="handleCancel"
      @draft-saved="handleDraftSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ChevronRightIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import OrganizationFormWrapper from '@/components/forms/OrganizationFormWrapper.vue'
import type { OrganizationCreateForm } from '@/types/organizations'

/**
 * Organization Create View
 * Uses the multi-step OrganizationFormWrapper component
 */

const router = useRouter()

/**
 * Event handlers
 */
const handleSuccess = (organizationId: string) => {
  // Navigate to the new organization's detail page
  router.push(`/organizations/${organizationId}`)
}

const handleCancel = () => {
  // Navigate back to organizations list
  router.push('/organizations')
}

const handleDraftSaved = (formData: Partial<OrganizationCreateForm>) => {
  console.log('Draft saved:', formData)
  // Could show a toast notification here
}
</script>