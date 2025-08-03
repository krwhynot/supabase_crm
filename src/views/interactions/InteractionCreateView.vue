<template>
  <div class="interaction-create-view">
      <!-- Page Header -->
      <div class="mb-8">
        <!-- Breadcrumb Navigation -->
        <BreadcrumbNavigation :items="breadcrumbItems" />

        <!-- Header Content -->
        <div class="flex items-center space-x-3 mb-4">
          <router-link
            to="/interactions"
            class="inline-flex items-center text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md p-1"
            :aria-label="'Back to interactions list'"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </router-link>
          <div>
            <h1 class="text-3xl font-bold text-gray-900" data-testid="page-title">Create New Interaction</h1>
            <p class="mt-2 text-gray-600">
              Log customer interactions with mobile-optimized forms, voice input, and location tracking.
            </p>
          </div>
        </div>

        <!-- Mobile Quick Action Bar -->
        <div class="lg:hidden mb-4 bg-gray-50 rounded-lg p-3">
          <div class="text-sm font-medium text-gray-700 mb-2">Quick Actions</div>
          <div class="flex space-x-2 overflow-x-auto">
            <router-link
              to="/interactions/quick?template=dropped_samples"
              class="flex-shrink-0 inline-flex items-center px-3 py-2 border border-primary-300 rounded-md text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 whitespace-nowrap"
            >
              <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Drop Samples
            </router-link>
            <router-link
              to="/interactions/quick?template=quick_call"
              class="flex-shrink-0 inline-flex items-center px-3 py-2 border border-primary-300 rounded-md text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 whitespace-nowrap"
            >
              <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Quick Call
            </router-link>
            <router-link
              to="/interactions/quick?template=site_visit"
              class="flex-shrink-0 inline-flex items-center px-3 py-2 border border-primary-300 rounded-md text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 whitespace-nowrap"
            >
              <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Site Visit
            </router-link>
          </div>
        </div>
      </div>

      <!-- Interaction Form -->
      <div class="max-w-4xl" data-testid="interaction-form-container">
        <InteractionFormWrapper
          :is-editing="false"
          :initial-data="contextData"
          @success="handleSuccess"
          @cancel="handleCancel"
          @error="handleError"
          data-testid="interaction-form"
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
              <h3 class="text-sm font-medium text-red-800">Error creating interaction</h3>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BreadcrumbNavigation from '@/components/common/BreadcrumbNavigation.vue'
import InteractionFormWrapper from '@/components/interactions/InteractionFormWrapper.vue'

// Component props for contextual creation
interface Props {
  opportunityId?: string
  contactId?: string
  fromContext?: string
}

const props = withDefaults(defineProps<Props>(), {
  fromContext: 'direct'
})

// Dependencies
const router = useRouter()
const route = useRoute()

// ===============================
// REACTIVE STATE
// ===============================

const submitError = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Dynamic breadcrumb navigation based on context
const breadcrumbItems = computed(() => {
  const items = [
    { label: 'Interactions', to: '/interactions' }
  ]

  // Add context-specific breadcrumb
  if (props.fromContext === 'opportunity' && props.opportunityId) {
    items.unshift({ label: 'Opportunities', to: '/opportunities' })
    items.unshift({ label: 'Opportunity Details', to: `/opportunities/${props.opportunityId}` })
  } else if (props.fromContext === 'contact' && props.contactId) {
    items.unshift({ label: 'Contacts', to: '/contacts' })
    items.unshift({ label: 'Contact Details', to: `/contacts/${props.contactId}` })
  }

  items.push({ label: 'New Interaction' })
  return items
})

// Context data processing from route props and query parameters
const contextData = computed(() => {
  const query = route.query
  const initialData: any = {}
  
  // Handle props from contextual routes
  if (props.opportunityId) {
    initialData.opportunityId = props.opportunityId
    initialData.notes = 'Interaction created from opportunity page'
  }
  
  if (props.contactId) {
    initialData.contactId = props.contactId
    initialData.notes = 'Interaction created from contact page'
  }
  
  // Handle context from route query parameters (legacy support)
  if (query.contextType === 'contact') {
    initialData.organizationId = query.organizationId || null
    initialData.organizationName = (query.organizationName as string) || ''
    initialData.contactId = query.contactId || null
    initialData.contactName = (query.contactName as string) || ''
    initialData.notes = query.contactName 
      ? `Interaction from contact: ${query.contactName}`
      : 'Interaction created from contact page'
  }
  
  // Handle context from organization detail page
  if (query.contextType === 'organization') {
    initialData.organizationId = query.organizationId || null
    initialData.organizationName = (query.organizationName as string) || ''
    initialData.notes = 'Interaction created from organization page'
  }

  // Handle context from opportunity detail page
  if (query.contextType === 'opportunity' || props.opportunityId) {
    initialData.opportunityId = props.opportunityId || query.opportunityId || null
    initialData.organizationId = query.organizationId || null
    initialData.organizationName = (query.organizationName as string) || ''
    initialData.notes = 'Interaction created from opportunity page'
  }

  // Handle template pre-selection
  if (query.template) {
    initialData.templateId = query.template
  }
  
  return initialData
})

// ===============================
// EVENT HANDLERS
// ===============================

/**
 * Handle successful interaction creation
 * Navigate to the created interaction's detail page or list
 */
const handleSuccess = (data: { interactionId?: string; count?: number }) => {
  console.log('Interaction created successfully:', data)
  
  // Clear any previous errors
  submitError.value = null
  
  // Handle single interaction creation
  if (data.interactionId) {
    successMessage.value = 'Interaction created successfully! Redirecting...'
    
    // Brief delay to show success message before navigation
    setTimeout(() => {
      router.push('/interactions')
    }, 1500)
  }
  // Fallback - redirect to interactions list
  else {
    successMessage.value = 'Interaction created successfully! Redirecting...'
    
    setTimeout(() => {
      router.push('/interactions')
    }, 1500)
  }
}

/**
 * Handle form cancellation
 * Navigate back to interactions list
 */
const handleCancel = () => {
  // Clear any messages
  submitError.value = null
  successMessage.value = null
  
  // Navigate back to interactions list
  router.push('/interactions')
}

/**
 * Handle form submission error
 */
const handleError = (error: string | Error) => {
  console.error('Interaction creation error:', error)
  
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
.interaction-create-view {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6;
}

/* Breadcrumb enhancements */
.interaction-create-view nav ol li a:hover {
  @apply text-primary-600;
}

.interaction-create-view nav ol li[aria-current="page"] span {
  color: rgb(107 114 128);
}

/* Back button enhancements */
.interaction-create-view a[aria-label]:hover {
  @apply bg-gray-50;
}

/* Mobile quick actions - horizontal scroll */
.interaction-create-view .overflow-x-auto::-webkit-scrollbar {
  display: none;
}

.interaction-create-view .overflow-x-auto {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Responsive design */
@media (max-width: 1024px) {
  .interaction-create-view {
    @apply px-4;
  }
}

@media (max-width: 768px) {
  .interaction-create-view {
    @apply px-2 py-4;
  }
  
  /* Stack header elements on mobile */
  .interaction-create-view .flex.items-center.space-x-3 {
    @apply flex-col items-start space-x-0 space-y-3;
  }
  
  .interaction-create-view .flex.items-center.space-x-3 > a {
    @apply self-start;
  }

  /* Ensure quick action buttons have adequate touch targets */
  .interaction-create-view .lg\\:hidden a {
    min-height: 44px;
    min-width: 44px;
  }
}

/* Touch targets for mobile */
@media (max-width: 1024px) {
  .interaction-create-view button,
  .interaction-create-view a {
    min-height: 44px;
    min-width: 44px;
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
  .interaction-create-view .border-red-300 {
    border-color: rgb(220 38 38);
  }
  
  .interaction-create-view .border-green-300 {
    border-color: rgb(22 163 74);
  }
  
  .interaction-create-view .text-gray-500 {
    color: rgb(31 41 55);
  }
  
  .interaction-create-view .text-gray-600 {
    color: rgb(17 24 39);
  }
}

/* Print styles */
@media print {
  .interaction-create-view nav,
  .interaction-create-view button {
    @apply hidden;
  }
  
  .interaction-create-view {
    @apply shadow-none;
  }
}
</style>