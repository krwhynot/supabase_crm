<template>
  <div class="opportunity-create-view">
      <!-- Page Header -->
      <div class="mb-8">
        <!-- Breadcrumb Navigation -->
        <nav class="flex mb-4" aria-label="Breadcrumb">
          <ol class="inline-flex items-center space-x-1 md:space-x-3">
            <li class="inline-flex items-center">
              <router-link
                to="/"
                class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-primary-600"
              >
                <svg class="w-3 h-3 mr-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"/>
                </svg>
                Dashboard
              </router-link>
            </li>
            <li>
              <div class="flex items-center">
                <svg class="w-3 h-3 text-gray-400 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 5 7 7-7 7"></path>
                </svg>
                <router-link
                  to="/opportunities"
                  class="ml-1 text-sm font-medium text-gray-700 hover:text-primary-600 md:ml-2"
                >
                  Opportunities
                </router-link>
              </div>
            </li>
            <li aria-current="page">
              <div class="flex items-center">
                <svg class="w-3 h-3 text-gray-400 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 5 7 7-7 7"></path>
                </svg>
                <span class="ml-1 text-sm font-medium text-gray-500 md:ml-2">New Opportunity</span>
              </div>
            </li>
          </ol>
        </nav>

        <!-- Header Content -->
        <div class="flex items-center space-x-3 mb-4">
          <router-link
            to="/opportunities"
            class="inline-flex items-center text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md p-1"
            :aria-label="'Back to opportunities list'"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </router-link>
          <div>
            <h1 class="text-3xl font-bold text-gray-900" data-testid="page-title">Create New Opportunity</h1>
            <p class="mt-2 text-gray-600">
              Set up a new sales opportunity with auto-naming, multi-principal support, and stage tracking.
            </p>
          </div>
        </div>
      </div>

      <!-- Opportunity Form -->
      <div class="max-w-4xl" data-testid="opportunity-form-container">
        <OpportunityFormWrapper
          :is-editing="false"
          :initial-data="contextData"
          @success="handleSuccess"
          @cancel="handleCancel"
          @error="handleError"
          data-testid="opportunity-form"
        />
      </div>
      
      <!-- Error Display -->
      <div v-if="submitError" class="mt-6 max-w-4xl">
        <div class="p-4 border border-red-300 rounded-md bg-red-50">
          <div class="flex">
            <svg class="h-5 w-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 class="text-sm font-medium text-red-800">Error creating opportunity</h3>
              <p class="mt-1 text-sm text-red-700">{{ submitError }}</p>
              <div class="mt-3">
                <button
                  @click="clearError"
                  class="text-sm font-medium text-red-800 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-md px-2 py-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Success Message (shown briefly before navigation) -->
      <div v-if="successMessage" class="mt-6 max-w-4xl">
        <div class="p-4 border border-green-300 rounded-md bg-green-50">
          <div class="flex">
            <svg class="h-5 w-5 text-green-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <h3 class="text-sm font-medium text-green-800">Success!</h3>
              <p class="mt-1 text-sm text-green-700">{{ successMessage }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import OpportunityFormWrapper from '@/components/opportunities/OpportunityFormWrapper.vue'
import type { OpportunityFormWrapperData } from '@/types/opportunityForm'
import { OpportunityContext } from '@/types/opportunities'

// Dependencies
const router = useRouter()
const route = useRoute()

// ===============================
// REACTIVE STATE
// ===============================

const submitError = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Context data processing
const contextData = computed((): Partial<OpportunityFormWrapperData> => {
  const query = route.query
  const initialData: Partial<OpportunityFormWrapperData> = {}
  
  // Handle context from contact detail page
  if (query.contextType === 'contact') {
    initialData.organizationName = (query.organizationName as string) || ''
    // Set context to indicate this came from a contact
    initialData.context = OpportunityContext.NEW_PRODUCT_INTEREST // Default context for contact-initiated opportunities
    initialData.notes = query.contactName 
      ? `Opportunity created from contact: ${query.contactName}`
      : 'Opportunity created from contact page'
  }
  
  // Handle context from organization detail page
  if (query.contextType === 'organization') {
    initialData.organizationName = (query.organizationName as string) || ''
    // Set context to indicate this came from an organization
    initialData.context = OpportunityContext.FOLLOW_UP // Default context for organization-initiated opportunities
    initialData.notes = 'Opportunity created from organization page'
  }
  
  return initialData
})

// ===============================
// EVENT HANDLERS
// ===============================

/**
 * Handle successful opportunity creation
 * Navigate to the created opportunity's detail page
 */
const handleSuccess = (data: { opportunityId?: string; opportunityIds?: string[]; count?: number }) => {
  console.log('Opportunity(s) created successfully:', data)
  
  // Clear any previous errors
  submitError.value = null
  
  // Handle single opportunity creation
  if (data.opportunityId) {
    successMessage.value = 'Opportunity created successfully! Redirecting to details...'
    
    // Brief delay to show success message before navigation
    setTimeout(() => {
      router.push(`/opportunities/${data.opportunityId}`)
    }, 1500)
  }
  // Handle batch opportunity creation
  else if (data.opportunityIds && data.opportunityIds.length > 0) {
    const count = data.count || data.opportunityIds.length
    successMessage.value = `${count} opportunities created successfully! Redirecting to list...`
    
    // Brief delay to show success message before navigation
    setTimeout(() => {
      router.push('/opportunities')
    }, 2000)
  }
  // Fallback - redirect to opportunities list
  else {
    successMessage.value = 'Opportunity created successfully! Redirecting...'
    
    setTimeout(() => {
      router.push('/opportunities')
    }, 1500)
  }
}

/**
 * Handle form cancellation
 * Navigate back to opportunities list
 */
const handleCancel = () => {
  // Clear any messages
  submitError.value = null
  successMessage.value = null
  
  // Navigate back to opportunities list
  router.push('/opportunities')
}

/**
 * Handle form submission error
 */
const handleError = (error: string | Error) => {
  console.error('Opportunity creation error:', error)
  
  // Clear success message if any
  successMessage.value = null
  
  // Set error message
  submitError.value = typeof error === 'string' ? error : error.message || 'An unexpected error occurred'
}

/**
 * Clear error message
 */
const clearError = () => {
  submitError.value = null
}
</script>

<style scoped>
.opportunity-create-view {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6;
}

/* Breadcrumb enhancements */
.opportunity-create-view nav ol li a:hover {
  @apply text-primary-600;
}

.opportunity-create-view nav ol li[aria-current="page"] span {
  color: rgb(107 114 128);
}

/* Back button enhancements */
.opportunity-create-view a[aria-label]:hover {
  @apply bg-gray-50;
}

/* Responsive design */
@media (max-width: 1024px) {
  .opportunity-create-view {
    @apply px-4;
  }
}

@media (max-width: 768px) {
  .opportunity-create-view {
    @apply px-2 py-4;
  }
  
  /* Stack header elements on mobile */
  .opportunity-create-view .flex.items-center.space-x-3 {
    @apply flex-col items-start space-x-0 space-y-3;
  }
  
  .opportunity-create-view .flex.items-center.space-x-3 > a {
    @apply self-start;
  }
}

/* Accessibility enhancements */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .opportunity-create-view .border-red-300 {
    border-color: rgb(220 38 38);
  }
  
  .opportunity-create-view .border-green-300 {
    border-color: rgb(22 163 74);
  }
  
  .opportunity-create-view .text-gray-500 {
    color: rgb(31 41 55);
  }
  
  .opportunity-create-view .text-gray-600 {
    color: rgb(17 24 39);
  }
}

/* Print styles */
@media print {
  .opportunity-create-view nav,
  .opportunity-create-view button {
    @apply hidden;
  }
  
  .opportunity-create-view {
    @apply shadow-none;
  }
}
</style>