<template>
  <div v-if="!isErrored" class="error-boundary-wrapper">
    <!-- Normal content when no error -->
    <slot />
  </div>
  
  <!-- Error state UI -->
  <div v-else class="error-boundary-container">
    <div class="error-boundary-content">
      <!-- Error severity indicator -->
      <div :class="severityClasses" class="error-indicator">
        <component :is="severityIcon" class="w-8 h-8" />
      </div>
      
      <!-- Error message -->
      <div class="error-details">
        <h2 class="error-title">{{ errorTitle }}</h2>
        <p class="error-message">{{ errorMessage }}</p>
        
        <!-- Error code for technical users -->
        <div v-if="showTechnicalDetails" class="error-code">
          <code>{{ currentError?.code }}</code>
          <span class="error-timestamp">
            {{ formatTimestamp(currentError?.timestamp) }}
          </span>
        </div>
        
        <!-- Recovery recommendations -->
        <div v-if="recoveryRecommendations.length > 0" class="recovery-recommendations">
          <h3 class="recommendations-title">What you can try:</h3>
          <ul class="recommendations-list">
            <li v-for="(recommendation, index) in recoveryRecommendations" :key="index">
              {{ recommendation }}
            </li>
          </ul>
        </div>
      </div>
      
      <!-- Action buttons -->
      <div class="error-actions">
        <button 
          v-if="canRetry"
          @click="handleRetry"
          :disabled="isRetrying"
          class="retry-button"
        >
          <ArrowPathIcon v-if="!isRetrying" class="w-4 h-4 mr-2" />
          <div v-else class="spinner w-4 h-4 mr-2"></div>
          {{ isRetrying ? 'Retrying...' : 'Try Again' }}
        </button>
        
        <button 
          @click="handleRefresh"
          class="refresh-button"
        >
          <ArrowPathIcon class="w-4 h-4 mr-2" />
          Refresh Page
        </button>
        
        <button 
          v-if="canGoHome"
          @click="handleGoHome"
          class="home-button"
        >
          <HomeIcon class="w-4 h-4 mr-2" />
          Go to Dashboard
        </button>
        
        <button 
          @click="toggleTechnicalDetails"
          class="details-button"
        >
          {{ showTechnicalDetails ? 'Hide' : 'Show' }} Details
        </button>
      </div>
      
      <!-- Technical details (collapsible) -->
      <div v-if="showTechnicalDetails" class="technical-details">
        <div class="details-section">
          <h4>Error Information:</h4>
          <pre class="error-json">{{ formatErrorDetails() }}</pre>
        </div>
        
        <div v-if="errorState.errorInfo" class="details-section">
          <h4>Context:</h4>
          <pre class="context-json">{{ formatContextDetails() }}</pre>
        </div>
        
        <div class="details-section">
          <h4>Recovery Status:</h4>
          <p>Attempts: {{ errorState.recoveryAttempts }}/{{ maxRetries }}</p>
          <p v-if="errorState.lastRecovery">
            Last attempt: {{ formatTimestamp(errorState.lastRecovery) }}
          </p>
        </div>
        
        <!-- Report error button -->
        <button 
          @click="handleReportError"
          class="report-button"
        >
          <ExclamationTriangleIcon class="w-4 h-4 mr-2" />
          Report This Error
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ArrowPathIcon, 
  HomeIcon, 
  ExclamationTriangleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline'
import { useErrorBoundary } from '@/composables/useErrorBoundary'
import { getErrorSeverity } from '@/types/error.types'
import type { RecoveryStrategy } from '@/types/error.types'

interface Props {
  /** Maximum number of retry attempts */
  maxRetries?: number
  /** Show technical error details by default */
  showDetailsDefault?: boolean
  /** Custom fallback component name */
  fallback?: string
  /** Enable error reporting */
  enableReporting?: boolean
  /** Custom recovery strategies */
  customRecovery?: RecoveryStrategy[]
}

const props = withDefaults(defineProps<Props>(), {
  maxRetries: 3,
  showDetailsDefault: false,
  enableReporting: true
})

const emit = defineEmits<{
  error: [error: any, context: any]
  recovery: [strategy: RecoveryStrategy]
  retry: []
}>()

const router = useRouter()

// Error boundary composable
const {
  errorState,
  isErrored,
  currentError,
  retry,
  getRecoveryOptions,
  reportError
} = useErrorBoundary({
  maxRetries: props.maxRetries,
  onError: (error, context) => emit('error', error, context),
  onRecovery: (strategy) => emit('recovery', strategy)
})

// Local state
const isRetrying = ref(false)
const showTechnicalDetails = ref(props.showDetailsDefault)

// Computed properties
const errorTitle = computed(() => {
  if (!currentError.value) return 'Something went wrong'
  
  const severity = getErrorSeverity(currentError.value)
  switch (severity) {
    case 'critical':
      return 'Service Unavailable'
    case 'high':
      return 'Authentication Required'
    case 'medium':
      return 'Operation Failed'
    default:
      return 'Something went wrong'
  }
})

const errorMessage = computed(() => {
  if (!currentError.value) return 'An unexpected error occurred'
  
  // Use user-friendly message if available, otherwise use the error message
  return currentError.value.userMessage || currentError.value.message
})

const severityClasses = computed(() => {
  if (!currentError.value) return 'text-yellow-600 bg-yellow-100'
  
  const severity = getErrorSeverity(currentError.value)
  switch (severity) {
    case 'critical':
      return 'text-red-700 bg-red-100'
    case 'high':
      return 'text-red-600 bg-red-50'
    case 'medium':
      return 'text-yellow-600 bg-yellow-50'
    default:
      return 'text-blue-600 bg-blue-50'
  }
})

const severityIcon = computed(() => {
  if (!currentError.value) return ExclamationCircleIcon
  
  const severity = getErrorSeverity(currentError.value)
  switch (severity) {
    case 'critical':
      return XCircleIcon
    case 'high':
      return ExclamationTriangleIcon
    case 'medium':
      return ExclamationCircleIcon
    default:
      return InformationCircleIcon
  }
})

const canRetry = computed(() => {
  if (!currentError.value) return false
  
  const recoveryOptions = getRecoveryOptions()
  return recoveryOptions.includes('retry') && 
         errorState.value.recoveryAttempts < props.maxRetries
})

const canGoHome = computed(() => {
  return router.currentRoute.value.path !== '/'
})

const recoveryRecommendations = computed(() => {
  if (!currentError.value) return []
  
  const recommendations: string[] = []
  const recoveryOptions = getRecoveryOptions()
  
  if (recoveryOptions.includes('retry')) {
    recommendations.push('Check your internet connection and try again')
  }
  
  if (recoveryOptions.includes('refresh')) {
    recommendations.push('Refresh the page to reload the application')
  }
  
  if (recoveryOptions.includes('redirect')) {
    recommendations.push('Log in again to restore your session')
  }
  
  if (recoveryOptions.includes('fallback')) {
    recommendations.push('Some features may be limited while offline')
  }
  
  // Add generic recommendation if no specific ones
  if (recommendations.length === 0) {
    recommendations.push('Contact support if the problem persists')
  }
  
  return recommendations
})

// Methods
const handleRetry = async () => {
  if (isRetrying.value) return
  
  isRetrying.value = true
  emit('retry')
  
  try {
    await retry()
  } finally {
    isRetrying.value = false
  }
}

const handleRefresh = () => {
  window.location.reload()
}

const handleGoHome = () => {
  router.push('/')
}

const handleReportError = () => {
  reportError('user_reported')
  
  // Show confirmation (in a real app, this might be a toast notification)
  alert('Error reported. Thank you for helping us improve!')
}

const toggleTechnicalDetails = () => {
  showTechnicalDetails.value = !showTechnicalDetails.value
}

const formatTimestamp = (timestamp?: Date) => {
  if (!timestamp) return 'Unknown'
  return timestamp.toLocaleString()
}

const formatErrorDetails = () => {
  if (!currentError.value) return ''
  
  return JSON.stringify({
    code: currentError.value.code,
    message: currentError.value.message,
    timestamp: currentError.value.timestamp,
    details: currentError.value.details
  }, null, 2)
}

const formatContextDetails = () => {
  if (!errorState.value.errorInfo) return ''
  
  return JSON.stringify({
    route: errorState.value.errorInfo.route,
    component: errorState.value.errorInfo.component,
    action: errorState.value.errorInfo.action,
    environment: errorState.value.errorInfo.environment,
    timestamp: errorState.value.errorInfo.timestamp
  }, null, 2)
}

// Watch for error changes to reset retry state
watch(currentError, (newError) => {
  if (!newError) {
    isRetrying.value = false
  }
})
</script>

<style scoped>
.error-boundary-wrapper {
  @apply w-full h-full;
}

.error-boundary-container {
  @apply min-h-screen bg-gray-50 flex items-center justify-center p-4;
}

.error-boundary-content {
  @apply max-w-md w-full bg-white rounded-lg shadow-lg p-6 space-y-6;
}

.error-indicator {
  @apply flex items-center justify-center w-16 h-16 mx-auto rounded-full;
}

.error-details {
  @apply text-center space-y-4;
}

.error-title {
  @apply text-xl font-semibold text-gray-900;
}

.error-message {
  @apply text-gray-600 leading-relaxed;
}

.error-code {
  @apply text-sm space-y-1;
}

.error-code code {
  @apply px-2 py-1 bg-gray-100 rounded text-gray-800 font-mono;
}

.error-timestamp {
  @apply block text-xs text-gray-500 mt-1;
}

.recovery-recommendations {
  @apply text-left;
}

.recommendations-title {
  @apply text-sm font-medium text-gray-900 mb-2;
}

.recommendations-list {
  @apply text-sm text-gray-600 space-y-1 list-disc list-inside;
}

.error-actions {
  @apply flex flex-col space-y-3;
}

.retry-button {
  @apply w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}

.refresh-button {
  @apply w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors;
}

.home-button {
  @apply w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors;
}

.details-button {
  @apply w-full px-4 py-2 text-sm text-gray-500 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors;
}

.technical-details {
  @apply space-y-4 pt-4 border-t border-gray-200;
}

.details-section {
  @apply space-y-2;
}

.details-section h4 {
  @apply text-sm font-medium text-gray-900;
}

.error-json, .context-json {
  @apply text-xs bg-gray-100 p-3 rounded-md overflow-x-auto font-mono text-gray-800;
}

.report-button {
  @apply w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors;
}

.spinner {
  @apply animate-spin rounded-full border-2 border-white border-t-transparent;
}
</style>