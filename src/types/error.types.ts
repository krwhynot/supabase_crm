/**
 * Error Types - Comprehensive error handling for CRM application
 * Provides type-safe error handling with detailed error information
 */

// Base error interface
export interface AppError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: Date
  stack?: string
  userMessage?: string
}

// Authentication error types
export interface AuthError extends AppError {
  code: 'AUTH_REQUIRED' | 'AUTH_INVALID' | 'AUTH_EXPIRED' | 'AUTH_UNAUTHORIZED'
  userId?: string
}

// Database error types
export interface DatabaseError extends AppError {
  code: 'DB_CONNECTION' | 'DB_QUERY' | 'DB_CONSTRAINT' | 'DB_NOT_FOUND' | 'DB_TIMEOUT'
  query?: string
  table?: string
  constraint?: string
}

// Network error types
export interface NetworkError extends AppError {
  code: 'NETWORK_OFFLINE' | 'NETWORK_TIMEOUT' | 'NETWORK_SERVER_ERROR' | 'NETWORK_BAD_REQUEST'
  status?: number
  url?: string
}

// Validation error types
export interface ValidationError extends AppError {
  code: 'VALIDATION_REQUIRED' | 'VALIDATION_FORMAT' | 'VALIDATION_RANGE' | 'VALIDATION_UNIQUE'
  field?: string
  value?: any
  constraints?: Record<string, string>
}

// Dashboard-specific error types
export interface DashboardError extends AppError {
  code: 'DASHBOARD_LOAD' | 'DASHBOARD_SAVE' | 'DASHBOARD_WIDGET' | 'DASHBOARD_ANALYTICS'
  widget?: string
  operation?: string
}

// Union type for all application errors
export type ApplicationError = AuthError | DatabaseError | NetworkError | ValidationError | DashboardError

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

// Error context for debugging
export interface ErrorContext {
  userId?: string
  sessionId?: string
  route?: string
  component?: string
  action?: string
  environment: 'development' | 'staging' | 'production'
  userAgent?: string
  timestamp: Date
}

// Error handler result
export interface ErrorHandlerResult {
  handled: boolean
  retry?: boolean
  redirect?: string
  showUser?: boolean
  logError?: boolean
  severity: ErrorSeverity
}

// Recovery strategies
export type RecoveryStrategy = 
  | 'retry'
  | 'fallback'
  | 'redirect'
  | 'refresh'
  | 'logout'
  | 'ignore'

// Error boundary state
export interface ErrorBoundaryState {
  hasError: boolean
  error: ApplicationError | null
  errorInfo: ErrorContext | null
  recoveryAttempts: number
  lastRecovery?: Date
}

// Error reporting payload
export interface ErrorReport {
  error: ApplicationError
  context: ErrorContext
  severity: ErrorSeverity
  userAction?: string
  recovered?: boolean
  reportedAt: Date
}

// Predefined error messages
export const ERROR_MESSAGES = {
  // Authentication errors
  AUTH_REQUIRED: 'Authentication required to access this resource',
  AUTH_INVALID: 'Invalid authentication credentials',
  AUTH_EXPIRED: 'Your session has expired. Please log in again',
  AUTH_UNAUTHORIZED: 'You do not have permission to perform this action',

  // Database errors  
  DB_CONNECTION: 'Unable to connect to the database',
  DB_QUERY: 'Database query failed',
  DB_CONSTRAINT: 'Data validation constraint violation',
  DB_NOT_FOUND: 'Requested resource not found',
  DB_TIMEOUT: 'Database operation timed out',

  // Network errors
  NETWORK_OFFLINE: 'You appear to be offline. Please check your connection',
  NETWORK_TIMEOUT: 'Request timed out. Please try again',
  NETWORK_SERVER_ERROR: 'Server error occurred. Please try again later',
  NETWORK_BAD_REQUEST: 'Invalid request format',

  // Validation errors
  VALIDATION_REQUIRED: 'This field is required',
  VALIDATION_FORMAT: 'Invalid format',
  VALIDATION_RANGE: 'Value is outside allowed range',
  VALIDATION_UNIQUE: 'This value must be unique',

  // Dashboard errors
  DASHBOARD_LOAD: 'Failed to load dashboard data',
  DASHBOARD_SAVE: 'Failed to save dashboard preferences',
  DASHBOARD_WIDGET: 'Widget configuration error',
  DASHBOARD_ANALYTICS: 'Failed to load analytics data'
} as const

// Error codes for programmatic handling
export const ERROR_CODES = {
  // Success codes
  SUCCESS: 'SUCCESS',
  
  // Authentication
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID: 'AUTH_INVALID', 
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',

  // Database
  DB_CONNECTION: 'DB_CONNECTION',
  DB_QUERY: 'DB_QUERY',
  DB_CONSTRAINT: 'DB_CONSTRAINT',
  DB_NOT_FOUND: 'DB_NOT_FOUND',
  DB_TIMEOUT: 'DB_TIMEOUT',

  // Network
  NETWORK_OFFLINE: 'NETWORK_OFFLINE',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  NETWORK_SERVER_ERROR: 'NETWORK_SERVER_ERROR',
  NETWORK_BAD_REQUEST: 'NETWORK_BAD_REQUEST',

  // Validation
  VALIDATION_REQUIRED: 'VALIDATION_REQUIRED',
  VALIDATION_FORMAT: 'VALIDATION_FORMAT',
  VALIDATION_RANGE: 'VALIDATION_RANGE',
  VALIDATION_UNIQUE: 'VALIDATION_UNIQUE',

  // Dashboard
  DASHBOARD_LOAD: 'DASHBOARD_LOAD',
  DASHBOARD_SAVE: 'DASHBOARD_SAVE',
  DASHBOARD_WIDGET: 'DASHBOARD_WIDGET',
  DASHBOARD_ANALYTICS: 'DASHBOARD_ANALYTICS'
} as const

// Type guards for error types
export const isAuthError = (error: ApplicationError): error is AuthError => {
  return ['AUTH_REQUIRED', 'AUTH_INVALID', 'AUTH_EXPIRED', 'AUTH_UNAUTHORIZED'].includes(error.code)
}

export const isDatabaseError = (error: ApplicationError): error is DatabaseError => {
  return ['DB_CONNECTION', 'DB_QUERY', 'DB_CONSTRAINT', 'DB_NOT_FOUND', 'DB_TIMEOUT'].includes(error.code)
}

export const isNetworkError = (error: ApplicationError): error is NetworkError => {
  return ['NETWORK_OFFLINE', 'NETWORK_TIMEOUT', 'NETWORK_SERVER_ERROR', 'NETWORK_BAD_REQUEST'].includes(error.code)
}

export const isValidationError = (error: ApplicationError): error is ValidationError => {
  return ['VALIDATION_REQUIRED', 'VALIDATION_FORMAT', 'VALIDATION_RANGE', 'VALIDATION_UNIQUE'].includes(error.code)
}

export const isDashboardError = (error: ApplicationError): error is DashboardError => {
  return ['DASHBOARD_LOAD', 'DASHBOARD_SAVE', 'DASHBOARD_WIDGET', 'DASHBOARD_ANALYTICS'].includes(error.code)
}

// Helper function to create typed errors
export const createError = <T extends ApplicationError>(
  type: T['code'],
  message: string,
  details?: Record<string, any>
): T => {
  return {
    code: type,
    message,
    details,
    timestamp: new Date(),
    userMessage: ERROR_MESSAGES[type as keyof typeof ERROR_MESSAGES] || message
  } as T
}

// Helper function to determine error severity
export const getErrorSeverity = (error: ApplicationError): ErrorSeverity => {
  switch (error.code) {
    case 'AUTH_REQUIRED':
    case 'AUTH_EXPIRED':
      return 'high'
    
    case 'DB_CONNECTION':
    case 'NETWORK_SERVER_ERROR':
      return 'critical'
    
    case 'DB_NOT_FOUND':
    case 'NETWORK_OFFLINE':
      return 'medium'
    
    default:
      return 'low'
  }
}

// Recovery strategy mapping
export const getRecoveryStrategy = (error: ApplicationError): RecoveryStrategy => {
  switch (error.code) {
    case 'AUTH_REQUIRED':
    case 'AUTH_EXPIRED':
      return 'redirect'
    
    case 'DB_CONNECTION':
    case 'NETWORK_TIMEOUT':
      return 'retry'
    
    case 'NETWORK_OFFLINE':
      return 'fallback'
    
    case 'DB_NOT_FOUND':
      return 'redirect'
    
    default:
      return 'ignore'
  }
}