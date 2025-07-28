/**
 * Global Error Boundary Plugin
 * Provides application-wide error handling and reporting
 */

import type { App } from 'vue'
import { useGlobalErrorBoundary } from '@/composables/useErrorBoundary'
import type { ApplicationError, ErrorContext } from '@/types/error.types'
import { createError, getErrorSeverity } from '@/types/error.types'

interface ErrorBoundaryPluginOptions {
  /** Enable console logging of errors */
  enableLogging?: boolean
  /** Maximum number of error reports to store locally */
  maxStoredReports?: number
  /** Custom error handler */
  onError?: (error: ApplicationError, context: ErrorContext) => void
  /** Custom recovery handler */
  onRecovery?: (strategy: string) => void
  /** Enable automatic error reporting */
  enableReporting?: boolean
}

interface ErrorReport {
  id: string
  error: ApplicationError
  context: ErrorContext
  timestamp: Date
  reported: boolean
  userAgent: string
  url: string
}

class GlobalErrorHandler {
  private options: Required<ErrorBoundaryPluginOptions>
  private errorBoundary = useGlobalErrorBoundary()
  private errorReports: ErrorReport[] = []

  constructor(options: ErrorBoundaryPluginOptions = {}) {
    this.options = {
      enableLogging: true,
      maxStoredReports: 50,
      enableReporting: true,
      onError: () => {},
      onRecovery: () => {},
      ...options
    }

    this.loadStoredReports()
    this.setupGlobalHandlers()
  }

  private setupGlobalHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = createError(
        'NETWORK_SERVER_ERROR',
        event.reason?.message || 'Unhandled promise rejection',
        { originalError: event.reason }
      )
      
      this.captureError(error, {
        action: 'unhandled_promise_rejection',
        component: 'global'
      })
      
      // Prevent browser's default unhandled rejection handling
      event.preventDefault()
    })

    // Handle global JavaScript errors
    window.addEventListener('error', (event) => {
      const error = createError(
        'DASHBOARD_LOAD',
        event.message || 'Global JavaScript error',
        { 
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        }
      )
      
      this.captureError(error, {
        action: 'global_javascript_error',
        component: 'global'
      })
    })

    // Handle network connection changes
    window.addEventListener('online', () => {
      console.log('[ErrorBoundary] Network connection restored')
      this.handleNetworkReconnect()
    })

    window.addEventListener('offline', () => {
      console.log('[ErrorBoundary] Network connection lost')
      this.handleNetworkDisconnect()
    })
  }

  public captureError(error: ApplicationError, context: Partial<ErrorContext> = {}) {
    const fullContext: ErrorContext = {
      userId: '', // Would be populated from auth store
      sessionId: this.generateSessionId(),
      route: window.location.pathname,
      component: 'unknown',
      action: 'unknown',
      environment: import.meta.env.MODE as 'development' | 'staging' | 'production',
      userAgent: navigator.userAgent,
      timestamp: new Date(),
      ...context
    }

    // Log error if enabled
    if (this.options.enableLogging) {
      const severity = getErrorSeverity(error)
      console.error(`[GlobalErrorHandler] ${severity.toUpperCase()} ERROR:`, {
        code: error.code,
        message: error.message,
        context: fullContext,
        details: error.details
      })
    }

    // Store error report
    const report: ErrorReport = {
      id: this.generateErrorId(),
      error,
      context: fullContext,
      timestamp: new Date(),
      reported: false,
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    this.addErrorReport(report)

    // Call custom error handler
    this.options.onError(error, fullContext)

    // Auto-report critical errors
    if (this.options.enableReporting && getErrorSeverity(error) === 'critical') {
      this.reportError(report.id)
    }

    // Use error boundary to capture error
    this.errorBoundary.captureError(error, context)
  }

  private addErrorReport(report: ErrorReport) {
    this.errorReports.unshift(report)
    
    // Limit stored reports
    if (this.errorReports.length > this.options.maxStoredReports) {
      this.errorReports = this.errorReports.slice(0, this.options.maxStoredReports)
    }

    this.saveStoredReports()
  }

  private loadStoredReports() {
    try {
      const stored = localStorage.getItem('global-error-reports')
      if (stored) {
        const reports = JSON.parse(stored)
        this.errorReports = reports.map((report: any) => ({
          ...report,
          timestamp: new Date(report.timestamp),
          context: {
            ...report.context,
            timestamp: new Date(report.context.timestamp)
          },
          error: {
            ...report.error,
            timestamp: new Date(report.error.timestamp)
          }
        }))
      }
    } catch (error) {
      console.warn('[ErrorBoundary] Failed to load stored error reports:', error)
    }
  }

  private saveStoredReports() {
    try {
      localStorage.setItem('global-error-reports', JSON.stringify(this.errorReports))
    } catch (error) {
      console.warn('[ErrorBoundary] Failed to save error reports:', error)
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private handleNetworkReconnect() {
    // Attempt to report any unreported errors
    const unreportedErrors = this.errorReports.filter(report => !report.reported)
    
    if (unreportedErrors.length > 0) {
      console.log(`[ErrorBoundary] Attempting to report ${unreportedErrors.length} unreported errors`)
      
      unreportedErrors.forEach(report => {
        this.reportError(report.id)
      })
    }
  }

  private handleNetworkDisconnect() {
    // Could implement offline caching strategies here
    console.log('[ErrorBoundary] Switching to offline mode')
  }

  public reportError(errorId: string, userFeedback?: string): boolean {
    const report = this.errorReports.find(r => r.id === errorId)
    if (!report) {
      console.warn('[ErrorBoundary] Error report not found:', errorId)
      return false
    }

    try {
      // In a real application, this would send to an error reporting service
      // like Sentry, Bugsnag, or a custom endpoint
      const payload = {
        ...report,
        userFeedback,
        reportedAt: new Date(),
        version: import.meta.env.VITE_APP_VERSION || 'unknown'
      }

      console.log('[ErrorBoundary] Error report payload:', payload)

      // Simulate successful reporting
      report.reported = true
      this.saveStoredReports()

      return true
    } catch (error) {
      console.error('[ErrorBoundary] Failed to report error:', error)
      return false
    }
  }

  public getErrorReports(): ErrorReport[] {
    return [...this.errorReports]
  }

  public clearErrorReports() {
    this.errorReports = []
    this.saveStoredReports()
  }

  public getErrorStats() {
    const total = this.errorReports.length
    const reported = this.errorReports.filter(r => r.reported).length
    const byCode = this.errorReports.reduce((acc, report) => {
      acc[report.error.code] = (acc[report.error.code] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total,
      reported,
      unreported: total - reported,
      byCode,
      mostCommon: Object.entries(byCode)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([code, count]) => ({ code, count }))
    }
  }
}

// Global error handler instance
let globalErrorHandler: GlobalErrorHandler | null = null

export default {
  install(app: App, options: ErrorBoundaryPluginOptions = {}) {
    // Create global error handler
    globalErrorHandler = new GlobalErrorHandler(options)

    // Add global properties
    app.config.globalProperties.$errorHandler = globalErrorHandler
    
    // Provide error handler for composition API
    app.provide('errorHandler', globalErrorHandler)

    // Add global error handler to Vue's error handling
    app.config.errorHandler = (error, instance, info) => {
      const context: Partial<ErrorContext> = {
        component: instance?.$options.name || instance?.$options.__name || 'unknown',
        action: info || 'vue_error_handler'
      }

      let appError: ApplicationError
      if (error instanceof Error) {
        appError = createError(
          'DASHBOARD_LOAD',
          error.message,
          { stack: error.stack, name: error.name }
        )
      } else {
        appError = createError(
          'DASHBOARD_LOAD',
          'Unknown Vue error',
          { originalError: error }
        )
      }

      globalErrorHandler?.captureError(appError, context)
    }

    console.log('[ErrorBoundary] Global error boundary plugin installed')
  }
}

// Export helper functions
export function useGlobalErrorHandler(): GlobalErrorHandler | null {
  return globalErrorHandler
}

export function captureError(error: unknown, context?: Partial<ErrorContext>) {
  if (globalErrorHandler) {
    let appError: ApplicationError
    
    if (error && typeof error === 'object' && 'code' in error) {
      appError = error as ApplicationError
    } else if (error instanceof Error) {
      appError = createError('DASHBOARD_LOAD', error.message, {
        stack: error.stack,
        name: error.name
      })
    } else {
      appError = createError('DASHBOARD_LOAD', 'Unknown error', {
        originalError: error
      })
    }
    
    globalErrorHandler.captureError(appError, context)
  } else {
    console.error('Global error handler not initialized:', error)
  }
}

export function reportError(errorId: string, userFeedback?: string): boolean {
  return globalErrorHandler?.reportError(errorId, userFeedback) || false
}

export function getErrorStats() {
  return globalErrorHandler?.getErrorStats() || {
    total: 0,
    reported: 0,
    unreported: 0,
    byCode: {},
    mostCommon: []
  }
}