<template>
  <div class="opportunity-edit-view">
      <!-- Loading State -->
      <div v-if="loading" class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div class="flex justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
        <p class="text-center text-gray-500 mt-4">Loading opportunity details...</p>
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
            to="/opportunities"
            class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Opportunities
          </router-link>
          <button
            @click="loadOpportunity"
            class="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      </div>

      <!-- Edit Form -->
      <div v-else-if="opportunity">
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
            <li>
              <div class="flex items-center">
                <svg class="w-3 h-3 text-gray-400 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 5 7 7-7 7"></path>
                </svg>
                <router-link
                  :to="`/opportunities/${opportunity.id}`"
                  class="ml-1 text-sm font-medium text-gray-700 hover:text-primary-600 md:ml-2"
                >
                  {{ opportunity.name }}
                </router-link>
              </div>
            </li>
            <li aria-current="page">
              <div class="flex items-center">
                <svg class="w-3 h-3 text-gray-400 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 5 7 7-7 7"></path>
                </svg>
                <span class="ml-1 text-sm font-medium text-gray-500 md:ml-2">Edit</span>
              </div>
            </li>
          </ol>
        </nav>

        <!-- Page Header -->
        <div class="mb-8">
          <!-- Header Content -->
          <div class="flex items-center space-x-3 mb-4">
            <router-link
              :to="`/opportunities/${opportunity.id}`"
              class="inline-flex items-center text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md p-1"
              :aria-label="'Back to opportunity details'"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </router-link>
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Edit Opportunity</h1>
              <p class="mt-2 text-gray-600">
                Update opportunity details, stage, and associated information.
              </p>
            </div>
          </div>
        </div>

        <!-- Opportunity Form -->
        <div class="max-w-4xl">
          <OpportunityFormWrapper
            :is-editing="true"
            :existing-opportunity="opportunity"
            @success="handleSuccess"
            @cancel="handleCancel"
            @error="handleError"
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
                <h3 class="text-sm font-medium text-red-800">Error updating opportunity</h3>
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
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOpportunityStore } from '@/stores/opportunityStore'
import OpportunityFormWrapper from '@/components/opportunities/OpportunityFormWrapper.vue'
import type { OpportunityDetailView } from '@/types/opportunities'

// Dependencies
const route = useRoute()
const router = useRouter()
const opportunityStore = useOpportunityStore()

// Get opportunity ID from route params
const opportunityId = route.params.id as string

// ===============================
// REACTIVE STATE
// ===============================

const opportunity = ref<OpportunityDetailView | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const submitError = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// ===============================
// DATA LOADING
// ===============================

/**
 * Load opportunity details for editing
 */
const loadOpportunity = async () => {
  try {
    loading.value = true
    error.value = null
    
    await opportunityStore.fetchOpportunityById(opportunityId)
    
    if (opportunityStore.selectedOpportunity) {
      opportunity.value = opportunityStore.selectedOpportunity
    } else {
      error.value = opportunityStore.error || 'Opportunity not found'
    }
  } catch (err) {
    console.error('Error loading opportunity:', err)
    error.value = 'An unexpected error occurred while loading the opportunity'
  } finally {
    loading.value = false
  }
}

// ===============================
// EVENT HANDLERS
// ===============================

/**
 * Handle successful opportunity update
 * Navigate back to the opportunity detail page
 */
const handleSuccess = (data: { opportunityId?: string; opportunityIds?: string[]; count?: number }) => {
  console.log('Opportunity updated successfully:', data)
  
  // Clear any previous errors
  submitError.value = null
  
  // Show success message
  successMessage.value = 'Opportunity updated successfully! Redirecting to details...'
  
  // Brief delay to show success message before navigation
  setTimeout(() => {
    router.push(`/opportunities/${data.opportunityId}`)
  }, 1500)
}

/**
 * Handle form cancellation
 * Navigate back to opportunity detail page
 */
const handleCancel = () => {
  // Clear any messages
  submitError.value = null
  successMessage.value = null
  
  // Navigate back to opportunity detail page
  if (opportunity.value) {
    router.push(`/opportunities/${opportunity.value.id}`)
  } else {
    router.push('/opportunities')
  }
}

/**
 * Handle form submission error
 */
const handleError = (error: string | Error) => {
  console.error('Opportunity update error:', error)
  
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

// ===============================
// LIFECYCLE
// ===============================

onMounted(() => {
  loadOpportunity()
})
</script>

<style scoped>
.opportunity-edit-view {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6;
}

/* Breadcrumb enhancements */
.opportunity-edit-view nav ol li a:hover {
  @apply text-primary-600;
}

.opportunity-edit-view nav ol li[aria-current="page"] span {
  color: rgb(107 114 128); /* text-gray-500 */
}

/* Back button enhancements */
.opportunity-edit-view a[aria-label]:hover {
  @apply bg-gray-50;
}

/* Responsive design */
@media (max-width: 1024px) {
  .opportunity-edit-view {
    @apply px-4;
  }
}

@media (max-width: 768px) {
  .opportunity-edit-view {
    @apply px-2 py-4;
  }
  
  /* Stack header elements on mobile */
  .opportunity-edit-view .flex.items-center.space-x-3 {
    @apply flex-col items-start space-x-0 space-y-3;
  }
  
  .opportunity-edit-view .flex.items-center.space-x-3 > a {
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
  .opportunity-edit-view .border-red-300 {
    @apply border-red-600;
  }
  
  .opportunity-edit-view .border-green-300 {
    @apply border-green-600;
  }
  
  .opportunity-edit-view .text-gray-500 {
    color: rgb(31 41 55); /* gray-800 */
  }
  
  .opportunity-edit-view .text-gray-600 {
    color: rgb(17 24 39); /* gray-900 */
  }
}

/* Print styles */
@media print {
  .opportunity-edit-view nav,
  .opportunity-edit-view button {
    @apply hidden;
  }
  
  .opportunity-edit-view {
    @apply shadow-none;
  }
}
</style>