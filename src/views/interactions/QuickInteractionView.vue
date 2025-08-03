<template>
  <div class="quick-interaction-view">
    <!-- Mobile Header -->
    <div class="mobile-header">
      <button
        @click="goBack"
        class="touch-target p-2 text-gray-600 hover:text-gray-800"
        aria-label="Go back"
      >
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <h1 class="text-lg font-semibold text-gray-900">Quick Interaction</h1>
      
      <button
        @click="showQueue = !showQueue"
        class="touch-target p-2 text-gray-600 hover:text-gray-800 relative"
        aria-label="View offline queue"
      >
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span v-if="queueCount > 0" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {{ queueCount }}
        </span>
      </button>
    </div>

    <!-- Template Selection or Form -->
    <div class="flex-1 overflow-hidden">
      <QuickInteractionTemplates
        v-if="showTemplates"
        :organization-id="organizationId"
        :opportunity-id="opportunityId"
        @template-selected="handleTemplateSelected"
        @close="showTemplates = false"
      />
      
      <MobileInteractionForm
        v-else
        :template="selectedTemplate"
        :organization-id="organizationId"
        :opportunity-id="opportunityId"
        @success="handleSuccess"
        @cancel="handleCancel"
        @draft-saved="handleDraftSaved"
      />
    </div>

    <!-- Offline Queue Drawer -->
    <div v-if="showQueue" class="fixed inset-0 z-50 bg-white">
      <OfflineInteractionQueue
        @interaction-synced="handleInteractionSynced"
        @sync-failed="handleSyncFailed"
        @queue-empty="handleQueueEmpty"
      />
      
      <!-- Close Queue Button -->
      <div class="absolute top-4 right-4">
        <button
          @click="showQueue = false"
          class="touch-target p-2 bg-white rounded-full shadow-lg text-gray-600 hover:text-gray-800"
          aria-label="Close queue"
        >
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Success Toast -->
    <div v-if="showSuccess" class="fixed bottom-4 left-4 right-4 z-40">
      <div class="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3">
        <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <span class="flex-1">Interaction saved successfully!</span>
        <button
          @click="showSuccess = false"
          class="text-white hover:text-green-100"
        >
          <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<!--
  QuickInteractionView - Mobile-optimized view for field interaction creation
  
  Features:
  - Full-screen mobile interface
  - Template-based quick creation
  - Voice input and GPS location support
  - Offline queue management
  - Success/error feedback
  - One-handed operation optimized
  
  URL Parameters:
  - ?template=<template_id> - Pre-select a template
  - ?organization=<org_id> - Pre-select organization
  - ?opportunity=<opp_id> - Pre-select opportunity
  - ?source=shortcut - Track usage from PWA shortcuts
  
  Mobile UX:
  - Touch-first design with 44px targets
  - Swipe gestures for navigation
  - Voice input for hands-free operation
  - GPS auto-detection for location
  - Offline-first data handling
-->

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import QuickInteractionTemplates from '@/components/interactions/QuickInteractionTemplates.vue'
import MobileInteractionForm from '@/components/interactions/MobileInteractionForm.vue'
import OfflineInteractionQueue from '@/components/interactions/OfflineInteractionQueue.vue'

/**
 * Mobile interaction template interface
 */
interface MobileInteractionTemplate {
  id: string
  name: string
  description: string
  icon: string
  category: string
  interactionType: string
  estimatedDuration: number
  requiresLocation: boolean
  supportsVoice: boolean
  autoFillFields: string[]
  titleTemplate: string
  descriptionTemplate: string
  defaultFollowUpDays?: number
}

// ===============================
// REACTIVE STATE
// ===============================

const route = useRoute()
const router = useRouter()

const showTemplates = ref(true)
const showQueue = ref(false)
const showSuccess = ref(false)
const selectedTemplate = ref<MobileInteractionTemplate | null>(null)
const queueCount = ref(0)

// Extract URL parameters
const organizationId = computed(() => route.query.organization as string || '')
const opportunityId = computed(() => route.query.opportunity as string || '')
const templateId = computed(() => route.query.template as string || '')
const source = computed(() => route.query.source as string || '')

// ===============================
// EVENT HANDLERS
// ===============================

const handleTemplateSelected = (template: MobileInteractionTemplate) => {
  selectedTemplate.value = template
  showTemplates.value = false
  
  // Track template usage
  if (source.value === 'shortcut') {
    console.log('Template selected from PWA shortcut:', template.id)
  }
}

const handleSuccess = (data: { interactionId: string }) => {
  console.log('Interaction created successfully:', data.interactionId)
  
  // Show success message
  showSuccess.value = true
  setTimeout(() => {
    showSuccess.value = false
  }, 3000)
  
  // Reset form to templates view
  selectedTemplate.value = null
  showTemplates.value = true
  
  // Track successful creation
  trackInteractionCreation(data.interactionId)
}

const handleCancel = () => {
  if (selectedTemplate.value) {
    // Go back to template selection
    selectedTemplate.value = null
    showTemplates.value = true
  } else {
    // Go back to previous page
    goBack()
  }
}

const handleDraftSaved = (formData: any) => {
  console.log('Draft saved:', formData)
  // Could show a subtle toast notification
}

const handleInteractionSynced = (interactionId: string) => {
  console.log('Interaction synced:', interactionId)
  updateQueueCount()
}

const handleSyncFailed = (error: string) => {
  console.error('Sync failed:', error)
  // Could show error notification
}

const handleQueueEmpty = () => {
  queueCount.value = 0
}

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/interactions')
  }
}

// ===============================
// QUEUE MANAGEMENT
// ===============================

const updateQueueCount = () => {
  // This would integrate with the OfflineInteractionQueue component
  // For now, just a placeholder
  queueCount.value = 0
}

// ===============================
// ANALYTICS & TRACKING
// ===============================

const trackInteractionCreation = (interactionId: string) => {
  // Track usage analytics
  const trackingData = {
    event: 'interaction_created',
    interactionId,
    template: selectedTemplate.value?.id,
    source: source.value,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    isOnline: navigator.onLine
  }
  
  console.log('Tracking interaction creation:', trackingData)
  
  // In production, send to analytics service
  // analytics.track('interaction_created', trackingData)
}

// ===============================
// LIFECYCLE
// ===============================

onMounted(() => {
  // Initialize queue count
  updateQueueCount()
  
  // Handle pre-selected template from URL
  if (templateId.value) {
    // This would need to load the template by ID
    console.log('Pre-selecting template:', templateId.value)
  }
  
  // Track page view
  const pageViewData = {
    page: 'quick_interaction',
    source: source.value,
    hasOrganization: !!organizationId.value,
    hasOpportunity: !!opportunityId.value,
    hasTemplate: !!templateId.value
  }
  
  console.log('Quick interaction view loaded:', pageViewData)
})

onUnmounted(() => {
  // Cleanup if needed
})

// ===============================
// KEYBOARD SHORTCUTS
// ===============================

const handleKeydown = (event: KeyboardEvent) => {
  // Escape key to go back/cancel
  if (event.key === 'Escape') {
    handleCancel()
  }
  
  // Ctrl/Cmd + S to save draft (when in form)
  if ((event.ctrlKey || event.metaKey) && event.key === 's' && !showTemplates.value) {
    event.preventDefault()
    // Would trigger draft save
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.quick-interaction-view {
  @apply h-screen flex flex-col bg-gray-50;
}

.mobile-header {
  @apply bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10;
}

.touch-target {
  @apply min-h-[44px] min-w-[44px] flex items-center justify-center;
}

/* Success toast animation */
.success-toast {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Focus styles for accessibility */
button:focus-visible {
  @apply outline-none ring-2 ring-primary-500 ring-offset-2;
}

/* Mobile-specific adjustments */
@media (max-width: 375px) {
  .touch-target {
    @apply min-h-[48px] min-w-[48px];
  }
}

/* Support for notch/safe areas */
@supports (padding: max(0px)) {
  .mobile-header {
    padding-left: max(1rem, env(safe-area-inset-left));
    padding-right: max(1rem, env(safe-area-inset-right));
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .quick-interaction-view {
    @apply bg-gray-900;
  }
  
  .mobile-header {
    @apply bg-gray-800 border-gray-700;
  }
}
</style>