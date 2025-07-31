<template>
  <div
    data-testid="contact-status-warning"
    class="bg-amber-50 border border-amber-200 rounded-md p-4"
    role="alert"
    aria-labelledby="contact-warning-title"
  >
    <div class="flex items-start">
      <!-- Warning Icon -->
      <div class="flex-shrink-0">
        <svg
          class="h-5 w-5 text-amber-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>

      <div class="ml-3 flex-1">
        <!-- Warning Title -->
        <h3
          id="contact-warning-title"
          class="text-sm font-medium text-amber-800"
        >
          No Contacts Found
        </h3>

        <!-- Warning Message -->
        <div class="mt-2 text-sm text-amber-700">
          <p v-if="organizationName">
            <strong>{{ organizationName }}</strong> currently has no associated contacts.
          </p>
          <p v-else>
            This organization currently has no associated contacts.
          </p>
          
          <p class="mt-2">
            Consider adding contacts after creating the organization to:
          </p>
          
          <ul class="mt-2 list-disc list-inside space-y-1">
            <li>Track communication and interactions</li>
            <li>Manage relationships with key decision makers</li>
            <li>Improve lead scoring and follow-up activities</li>
            <li>Enable comprehensive CRM functionality</li>
          </ul>
        </div>

        <!-- Action Buttons -->
        <div class="mt-4 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            class="inline-flex items-center px-3 py-2 border border-amber-300 shadow-sm text-sm leading-4 font-medium rounded-md text-amber-700 bg-amber-100 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors duration-200"
            @click="handleAddContactLater"
          >
            <svg
              class="h-4 w-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            I'll add contacts later
          </button>

          <button
            v-if="!hideAddNowButton"
            type="button"
            class="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors duration-200"
            @click="handleAddContactNow"
          >
            <svg
              class="h-4 w-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Add contact now
          </button>
        </div>

        <!-- Dismiss Option -->
        <div class="mt-3 flex items-center">
          <input
            :id="dismissCheckboxId"
            v-model="isDismissed"
            type="checkbox"
            class="h-4 w-4 text-amber-600 focus:ring-amber-500 border-amber-300 rounded"
            @change="handleDismissChange"
          />
          <label
            :for="dismissCheckboxId"
            class="ml-2 text-sm text-amber-700 cursor-pointer"
          >
            Don't show this warning again for this session
          </label>
        </div>
      </div>

      <!-- Close Button -->
      <div class="ml-auto pl-3">
        <div class="-mx-1.5 -my-1.5">
          <button
            type="button"
            class="inline-flex rounded-md p-1.5 text-amber-500 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-50 focus:ring-amber-600"
            aria-label="Dismiss warning"
            @click="handleClose"
          >
            <svg
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

/**
 * Props interface
 */
interface Props {
  /** Organization name to display in warning */
  organizationName?: string
  /** Hide the "Add contact now" button */
  hideAddNowButton?: boolean
  /** Automatically dismiss after a timeout (in seconds) */
  autoDismissAfter?: number
  /** Custom warning message */
  customMessage?: string
  /** Show contact count information */
  contactCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  hideAddNowButton: false,
  contactCount: 0
})

/**
 * Event emissions
 */
interface Emits {
  'add-contact-now': []
  'add-contact-later': []
  'dismiss': []
  'close': []
}

const emit = defineEmits<Emits>()

// Component state
const isDismissed = ref(false)
const isVisible = ref(true)

// Computed properties
const dismissCheckboxId = computed(() => 
  `dismiss-contact-warning-${Math.random().toString(36).substr(2, 9)}`
)

/**
 * Event handlers
 */
const handleAddContactNow = () => {
  emit('add-contact-now')
  handleClose()
}

const handleAddContactLater = () => {
  emit('add-contact-later')
  handleClose()
}

const handleDismissChange = () => {
  if (isDismissed.value) {
    // Store dismissal in session storage
    try {
      sessionStorage.setItem('contact-warning-dismissed', 'true')
    } catch (error) {
      console.warn('Failed to store dismissal preference:', error)
    }
    
    emit('dismiss')
  } else {
    // Remove dismissal from session storage
    try {
      sessionStorage.removeItem('contact-warning-dismissed')
    } catch (error) {
      console.warn('Failed to remove dismissal preference:', error)
    }
  }
}

const handleClose = () => {
  isVisible.value = false
  emit('close')
}

/**
 * Check if warning should be shown
 */
const shouldShowWarning = (): boolean => {
  try {
    const dismissed = sessionStorage.getItem('contact-warning-dismissed')
    return dismissed !== 'true'
  } catch (error) {
    // If sessionStorage is not available, always show warning
    return true
  }
}

/**
 * Auto-dismiss functionality
 */
const setupAutoDismiss = () => {
  if (props.autoDismissAfter && props.autoDismissAfter > 0) {
    setTimeout(() => {
      if (isVisible.value && !isDismissed.value) {
        handleClose()
      }
    }, props.autoDismissAfter * 1000)
  }
}

/**
 * Lifecycle hooks
 */
onMounted(() => {
  // Check if warning was previously dismissed
  if (!shouldShowWarning()) {
    isVisible.value = false
    return
  }
  
  // Setup auto-dismiss if configured
  setupAutoDismiss()
})

/**
 * Accessibility helpers
 */
const announceWarning = () => {
  // Create a live region for screen readers
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', 'polite')
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = `Warning: ${props.organizationName || 'This organization'} has no contacts. Consider adding contacts for better CRM functionality.`
  
  document.body.appendChild(announcement)
  
  // Remove the announcement after screen readers have had time to read it
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// Announce warning for accessibility
onMounted(() => {
  if (isVisible.value) {
    announceWarning()
  }
})

/**
 * Keyboard navigation
 */
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    handleClose()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

// Cleanup
import { onUnmounted } from 'vue'
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

/**
 * Expose methods for parent component
 */
defineExpose({
  dismiss: handleClose,
  isVisible: () => isVisible.value,
  isDismissed: () => isDismissed.value
})
</script>