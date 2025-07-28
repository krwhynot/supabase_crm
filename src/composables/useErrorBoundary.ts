/**
 * Error Boundary Composable - Vue.js equivalent of React Error Boundaries
 * Provides comprehensive error catching and recovery for Vue components
 */

import { ref, onErrorCaptured, type Ref } from 'vue'
import type { 
  ApplicationError, 
  ErrorBoundaryState, 
  ErrorContext, 
  RecoveryStrategy 
} from '@/types/error.types'
import { 
  createError, 
  getErrorSeverity, 
  getRecoveryStrategy,
  isAuthError,
  isDatabaseError
} from '@/types/error.types'

interface UseErrorBoundaryOptions {
  fallbackComponent?: string
  maxRetries?: number
  onError?: (error: ApplicationError, context: ErrorContext) => void
  onRecovery?: (strategy: RecoveryStrategy) => void
  enableLogging?: boolean
}

interface UseErrorBoundaryReturn {
  // State
  errorState: Ref<ErrorBoundaryState>
  isErrored: Ref<boolean>
  currentError: Ref<ApplicationError | null>
  
  // Actions
  captureError: (error: unknown, context?: Partial<ErrorContext>) => void
  clearError: () => void
  retry: () => Promise<void>
  getRecoveryOptions: () => RecoveryStrategy[]
  reportError: (userAction?: string) => void
  cleanup?: () => void
}

export function useErrorBoundary(options: UseErrorBoundaryOptions = {}): UseErrorBoundaryReturn {
  const {
    maxRetries = 3,
    onError,
    onRecovery,
    enableLogging = true
  } = options

  // Error boundary state
  const errorState = ref<ErrorBoundaryState>({
    hasError: false,
    error: null,
    errorInfo: null,
    recoveryAttempts: 0,
    lastRecovery: undefined
  })

  // Computed values
  const isErrored = ref(false)
  const currentError = ref<ApplicationError | null>(null)

  // Create error context
  const createErrorContext = (additionalContext?: Partial<ErrorContext>): ErrorContext => {
    return {
      userId: '', // Would be populated from auth store
      sessionId: '', // Would be populated from session management
      route: window.location.pathname,
      component: 'Unknown',
      action: 'unknown',
      environment: import.meta.env.MODE as 'development' | 'staging' | 'production',
      userAgent: navigator.userAgent,
      timestamp: new Date(),
      ...additionalContext
    }
  }

  // Capture and process errors
  const captureError = (error: unknown, additionalContext?: Partial<ErrorContext>) => {
    let appError: ApplicationError

    // Convert various error types to ApplicationError
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      appError = error as ApplicationError
    } else if (error instanceof Error) {
      // Classify error based on message content and context
      if (error.message.includes('auth') || error.message.includes('session')) {
        appError = createError('AUTH_INVALID', error.message, { 
          stack: error.stack,
          name: error.name
        })
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        appError = createError('NETWORK_SERVER_ERROR', error.message, { 
          stack: error.stack,
          name: error.name
        })
      } else if (error.message.includes('database') || error.message.includes('query')) {
        appError = createError('DB_QUERY', error.message, { 
          stack: error.stack,
          name: error.name
        })
      } else {
        appError = createError('DASHBOARD_LOAD', error.message, { 
          stack: error.stack,
          name: error.name
        })
      }
    } else {
      appError = createError('DASHBOARD_LOAD', 'Unknown error occurred', { 
        originalError: error 
      })
    }

    // Create error context
    const context = createErrorContext(additionalContext)

    // Update error state
    errorState.value = {
      hasError: true,
      error: appError,
      errorInfo: context,
      recoveryAttempts: errorState.value.recoveryAttempts,
      lastRecovery: errorState.value.lastRecovery
    }

    isErrored.value = true
    currentError.value = appError

    // Log error if enabled
    if (enableLogging) {
      console.error('[ErrorBoundary] Error captured:', {
        error: appError,
        context,
        severity: getErrorSeverity(appError)
      })
    }

    // Call error callback
    if (onError) {
      onError(appError, context)
    }

    // Store error in localStorage for debugging
    try {
      localStorage.setItem('error-boundary-last-error', JSON.stringify({
        error: {
          code: appError.code,
          message: appError.message,
          timestamp: appError.timestamp
        },
        context,
        recoveryAttempts: errorState.value.recoveryAttempts
      }))
    } catch (err) {
      console.warn('Failed to store error in localStorage:', err)
    }
  }

  // Clear error state
  const clearError = () => {
    errorState.value = {
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryAttempts: 0,
      lastRecovery: undefined
    }
    isErrored.value = false
    currentError.value = null
  }

  // Retry operation with exponential backoff
  const retry = async () => {
    if (!errorState.value.error || errorState.value.recoveryAttempts >= maxRetries) {
      return
    }

    const strategy = getRecoveryStrategy(errorState.value.error)
    
    // Update recovery attempt count
    errorState.value.recoveryAttempts += 1
    errorState.value.lastRecovery = new Date()

    if (enableLogging) {
      console.log(`[ErrorBoundary] Attempting recovery (${errorState.value.recoveryAttempts}/${maxRetries}) with strategy: ${strategy}`)
    }

    try {
      switch (strategy) {
        case 'retry': {
          // Implement exponential backoff
          const delay = Math.min(1000 * Math.pow(2, errorState.value.recoveryAttempts - 1), 10000)
          await new Promise(resolve => setTimeout(resolve, delay))
          clearError()
          break
        }

        case 'refresh':
          window.location.reload()
          break

        case 'redirect':
          // Handle authentication errors by redirecting to login
          if (isAuthError(errorState.value.error)) {
            window.location.href = '/login'
          } else {
            window.location.href = '/'
          }
          break

        case 'fallback':
          // Clear error and continue with degraded functionality
          clearError()
          break

        default:
          clearError()
      }

      if (onRecovery) {
        onRecovery(strategy)
      }

    } catch (retryError) {
      console.error('[ErrorBoundary] Recovery attempt failed:', retryError)
      
      // If we've exhausted retries, capture the new error
      if (errorState.value.recoveryAttempts >= maxRetries) {
        captureError(retryError, { action: 'recovery_failed' })
      }
    }
  }

  // Get available recovery options
  const getRecoveryOptions = (): RecoveryStrategy[] => {
    if (!errorState.value.error) return []

    const primaryStrategy = getRecoveryStrategy(errorState.value.error)
    const options: RecoveryStrategy[] = [primaryStrategy]

    // Add additional recovery options based on error type
    if (isAuthError(errorState.value.error)) {
      options.push('redirect', 'refresh')
    } else if (isDatabaseError(errorState.value.error)) {
      options.push('retry', 'fallback')
    } else {
      options.push('retry', 'refresh')
    }

    // Remove duplicates
    return [...new Set(options)]
  }

  // Report error to external service (placeholder)
  const reportError = (userAction?: string) => {
    if (!errorState.value.error || !errorState.value.errorInfo) return

    const report = {
      error: errorState.value.error,
      context: errorState.value.errorInfo,
      severity: getErrorSeverity(errorState.value.error),
      userAction,
      recovered: false,
      reportedAt: new Date()
    }

    // In a real app, this would send to an error reporting service
    console.log('[ErrorBoundary] Error report:', report)
    
    // Store report locally for debugging
    try {
      const existingReports = JSON.parse(localStorage.getItem('error-boundary-reports') || '[]')
      existingReports.push(report)
      // Keep only last 10 reports
      if (existingReports.length > 10) {
        existingReports.splice(0, existingReports.length - 10)
      }
      localStorage.setItem('error-boundary-reports', JSON.stringify(existingReports))
    } catch (err) {
      console.warn('Failed to store error report:', err)
    }
  }

  // Vue error capturing
  onErrorCaptured((error, instance, info) => {
    const context: Partial<ErrorContext> = {
      component: instance?.$options.name || instance?.$options.__name || 'Unknown',
      action: info || 'component_error'
    }

    captureError(error, context)

    // Return false to prevent the error from propagating further
    return false
  })

  // Global error handler for unhandled promise rejections
  if (typeof window !== 'undefined') {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      captureError(event.reason, { action: 'unhandled_promise_rejection' })
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // Cleanup on unmount (would need to be handled by the component using this composable)
    const cleanup = () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }

    // Return cleanup function as part of the composable
    return {
      errorState,
      isErrored,
      currentError,
      captureError,
      clearError,
      retry,
      getRecoveryOptions,
      reportError,
      cleanup
    }
  }

  return {
    errorState,
    isErrored,
    currentError,
    captureError,
    clearError,
    retry,
    getRecoveryOptions,
    reportError
  }
}

// Global error boundary composable for app-level error handling
export function useGlobalErrorBoundary() {
  return useErrorBoundary({
    maxRetries: 5,
    enableLogging: true,
    onError: (error, context) => {
      // Global error handling logic
      console.error('[GlobalErrorBoundary]', error, context)
      
      // For critical errors, show user notification
      const severity = getErrorSeverity(error)
      if (severity === 'critical') {
        // In a real app, this would trigger a global notification
        console.error('CRITICAL ERROR:', error.message)
      }
    },
    onRecovery: (strategy) => {
      console.log('[GlobalErrorBoundary] Recovery completed with strategy:', strategy)
    }
  })
}