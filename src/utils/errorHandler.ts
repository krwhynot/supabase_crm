/**
 * Centralized error handling utilities
 * Provides consistent error processing, logging, and user-friendly messages
 */

/**
 * Standard error types for the application
 */
export enum ErrorType {
  VALIDATION = 'validation',
  NETWORK = 'network',
  DATABASE = 'database',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  UNKNOWN = 'unknown'
}

/**
 * Application error class with enhanced context
 */
export class AppError extends Error {
  public readonly type: ErrorType
  public readonly code: string
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly context?: Record<string, any>
  public readonly timestamp: string

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message)
    
    this.name = 'AppError'
    this.type = type
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.context = context
    this.timestamp = new Date().toISOString()

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype)
  }

  /**
   * Convert to JSON for logging
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      code: this.code,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack
    }
  }
}

/**
 * User-friendly error messages
 */
export const ErrorMessages = {
  // Validation errors
  VALIDATION_FAILED: 'Please check your input and try again',
  INVALID_EMAIL: 'Please enter a valid email address',
  REQUIRED_FIELD: 'This field is required',
  FIELD_TOO_LONG: 'This field is too long',
  INVALID_PHONE: 'Please enter a valid phone number',

  // Network errors
  NETWORK_ERROR: 'Network connection error. Please check your internet connection',
  REQUEST_TIMEOUT: 'Request timed out. Please try again',
  SERVER_UNAVAILABLE: 'Server is temporarily unavailable. Please try again later',

  // Database errors
  DATABASE_ERROR: 'Database error occurred. Please try again',
  DUPLICATE_EMAIL: 'This email address is already in use',
  CONTACT_NOT_FOUND: 'Contact not found',
  SAVE_FAILED: 'Failed to save changes. Please try again',
  DELETE_FAILED: 'Failed to delete contact. Please try again',

  // Authentication errors
  AUTH_REQUIRED: 'Please log in to continue',
  AUTH_FAILED: 'Authentication failed. Please log in again',
  SESSION_EXPIRED: 'Your session has expired. Please log in again',

  // Authorization errors
  ACCESS_DENIED: 'You do not have permission to perform this action',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',

  // General errors
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again',
  OPERATION_FAILED: 'Operation failed. Please try again',
  NOT_FOUND: 'The requested resource was not found'
}

/**
 * Supabase error code mapping
 */
const SupabaseErrorCodes = {
  // PostgreSQL error codes that we might encounter
  '23505': 'DUPLICATE_KEY', // unique_violation
  '23502': 'NOT_NULL_VIOLATION', // not_null_violation
  '23503': 'FOREIGN_KEY_VIOLATION', // foreign_key_violation
  '23514': 'CHECK_VIOLATION', // check_violation
  '42501': 'INSUFFICIENT_PRIVILEGE', // insufficient_privilege
  '42P01': 'UNDEFINED_TABLE', // undefined_table
  '42703': 'UNDEFINED_COLUMN', // undefined_column
  
  // Supabase Auth errors
  'invalid_credentials': 'INVALID_CREDENTIALS',
  'email_not_confirmed': 'EMAIL_NOT_CONFIRMED',
  'user_not_found': 'USER_NOT_FOUND',
  'signup_disabled': 'SIGNUP_DISABLED',
  'email_address_invalid': 'EMAIL_ADDRESS_INVALID',
  'password_is_too_weak': 'PASSWORD_TOO_WEAK',
  'email_address_not_authorized': 'EMAIL_NOT_AUTHORIZED',
  'token_expired': 'TOKEN_EXPIRED',
  'invalid_token': 'INVALID_TOKEN'
}

/**
 * Error handler utility class
 */
export class ErrorHandler {
  /**
   * Process Supabase errors into AppError instances
   */
  static processSupabaseError(error: any, context?: Record<string, any>): AppError {
    // Handle network errors
    if (!navigator.onLine) {
      return new AppError(
        ErrorMessages.NETWORK_ERROR,
        ErrorType.NETWORK,
        'NETWORK_OFFLINE',
        0,
        true,
        { ...context, offline: true }
      )
    }

    // Handle Supabase auth errors
    if (error.status === 401) {
      return new AppError(
        ErrorMessages.AUTH_REQUIRED,
        ErrorType.AUTHENTICATION,
        'AUTH_REQUIRED',
        401,
        true,
        context
      )
    }

    if (error.status === 403) {
      return new AppError(
        ErrorMessages.ACCESS_DENIED,
        ErrorType.AUTHORIZATION,
        'ACCESS_DENIED',
        403,
        true,
        context
      )
    }

    // Handle specific PostgreSQL errors
    if (error.code) {
      const mappedCode = SupabaseErrorCodes[error.code as keyof typeof SupabaseErrorCodes]
      
      switch (mappedCode) {
        case 'DUPLICATE_KEY':
          // Check if it's email duplicate based on constraint name
          if (error.details?.includes('email') || error.constraint?.includes('email')) {
            return new AppError(
              ErrorMessages.DUPLICATE_EMAIL,
              ErrorType.VALIDATION,
              'DUPLICATE_EMAIL',
              409,
              true,
              context
            )
          }
          break
          
        case 'NOT_NULL_VIOLATION':
          return new AppError(
            ErrorMessages.VALIDATION_FAILED,
            ErrorType.VALIDATION,
            'REQUIRED_FIELD',
            400,
            true,
            { ...context, field: error.column }
          )
          
        case 'CHECK_VIOLATION':
          return new AppError(
            ErrorMessages.VALIDATION_FAILED,
            ErrorType.VALIDATION,
            'VALIDATION_FAILED',
            400,
            true,
            { ...context, constraint: error.constraint }
          )
      }
    }

    // Handle generic Supabase errors
    if (error.message) {
      // Try to map known error messages
      if (error.message.includes('not found')) {
        return new AppError(
          ErrorMessages.CONTACT_NOT_FOUND,
          ErrorType.NOT_FOUND,
          'NOT_FOUND',
          404,
          true,
          context
        )
      }

      if (error.message.includes('timeout')) {
        return new AppError(
          ErrorMessages.REQUEST_TIMEOUT,
          ErrorType.NETWORK,
          'REQUEST_TIMEOUT',
          408,
          true,
          context
        )
      }

      // Generic database error
      return new AppError(
        ErrorMessages.DATABASE_ERROR,
        ErrorType.DATABASE,
        'DATABASE_ERROR',
        500,
        true,
        { ...context, originalError: error.message }
      )
    }

    // Fallback for unknown errors
    return new AppError(
      ErrorMessages.UNKNOWN_ERROR,
      ErrorType.UNKNOWN,
      'UNKNOWN_ERROR',
      500,
      false,
      { ...context, originalError: error }
    )
  }

  /**
   * Process validation errors from Yup
   */
  static processValidationError(error: any, context?: Record<string, any>): AppError {
    let message = ErrorMessages.VALIDATION_FAILED
    let code = 'VALIDATION_FAILED'

    // Extract specific validation message if available
    if (error.inner && error.inner.length > 0) {
      message = error.inner[0].message
      code = `VALIDATION_${error.inner[0].path?.toUpperCase() || 'FIELD'}`
    } else if (error.message) {
      message = error.message
    }

    return new AppError(
      message,
      ErrorType.VALIDATION,
      code,
      400,
      true,
      { ...context, validationErrors: error.inner }
    )
  }

  /**
   * Process network errors
   */
  static processNetworkError(error: any, context?: Record<string, any>): AppError {
    if (!navigator.onLine) {
      return new AppError(
        ErrorMessages.NETWORK_ERROR,
        ErrorType.NETWORK,
        'NETWORK_OFFLINE',
        0,
        true,
        { ...context, offline: true }
      )
    }

    if (error.name === 'TimeoutError' || error.code === 'ETIMEDOUT') {
      return new AppError(
        ErrorMessages.REQUEST_TIMEOUT,
        ErrorType.NETWORK,
        'REQUEST_TIMEOUT',
        408,
        true,
        context
      )
    }

    return new AppError(
      ErrorMessages.NETWORK_ERROR,
      ErrorType.NETWORK,
      'NETWORK_ERROR',
      500,
      true,
      { ...context, originalError: error.message }
    )
  }

  /**
   * Log error with appropriate level
   */
  static logError(error: AppError, additionalContext?: Record<string, any>): void {
    const logData = {
      ...error.toJSON(),
      ...additionalContext
    }

    // In development, log to console
    if (import.meta.env.DEV) {
      if (error.isOperational) {
        console.warn('⚠️ Operational Error:', logData)
      } else {
        console.error('🚨 Programming Error:', logData)
      }
    }

    // In production, you might want to send to error tracking service
    // Example: Sentry, LogRocket, etc.
    if (!import.meta.env.DEV && !error.isOperational) {
      // Send to error tracking service
      console.error('Production Error:', logData)
    }
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: any): string {
    if (error instanceof AppError) {
      return error.message
    }

    // Check for common error patterns
    if (typeof error === 'string') {
      return error
    }

    if (error?.message) {
      // Don't expose technical error messages to users
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return ErrorMessages.NETWORK_ERROR
      }
      
      return error.message
    }

    return ErrorMessages.UNKNOWN_ERROR
  }

  /**
   * Create a retry function for operations
   */
  static createRetryWrapper<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): () => Promise<T> {
    return async (): Promise<T> => {
      let lastError: any

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await operation()
        } catch (error) {
          lastError = error

          // Don't retry validation errors or client errors
          if (error instanceof AppError) {
            if (error.type === ErrorType.VALIDATION || 
                error.statusCode >= 400 && error.statusCode < 500) {
              throw error
            }
          }

          // Wait before retrying (exponential backoff)
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, delay * attempt))
          }
        }
      }

      throw lastError
    }
  }
}

/**
 * Error boundary utility for React-like error handling
 */
export class ErrorBoundary {
  private static errorHandlers: ((error: AppError) => void)[] = []

  /**
   * Register global error handler
   */
  static addErrorHandler(handler: (error: AppError) => void): void {
    this.errorHandlers.push(handler)
  }

  /**
   * Remove error handler
   */
  static removeErrorHandler(handler: (error: AppError) => void): void {
    const index = this.errorHandlers.indexOf(handler)
    if (index > -1) {
      this.errorHandlers.splice(index, 1)
    }
  }

  /**
   * Handle error and notify all registered handlers
   */
  static handleError(error: any, context?: Record<string, any>): AppError {
    let appError: AppError

    // Convert to AppError if needed
    if (error instanceof AppError) {
      appError = error
    } else {
      appError = ErrorHandler.processSupabaseError(error, context)
    }

    // Log the error
    ErrorHandler.logError(appError, context)

    // Notify all handlers
    this.errorHandlers.forEach(handler => {
      try {
        handler(appError)
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError)
      }
    })

    return appError
  }
}

/**
 * Utility functions for common error scenarios
 */
export const errorUtils = {
  /**
   * Check if error is recoverable
   */
  isRecoverable: (error: AppError): boolean => {
    return error.isOperational && [
      ErrorType.NETWORK,
      ErrorType.DATABASE
    ].includes(error.type)
  },

  /**
   * Check if error should trigger retry
   */
  shouldRetry: (error: AppError): boolean => {
    return errorUtils.isRecoverable(error) && 
           error.statusCode >= 500 &&
           error.code !== 'VALIDATION_FAILED'
  },

  /**
   * Extract field name from validation error
   */
  getValidationField: (error: AppError): string | null => {
    return error.context?.field || null
  },

  /**
   * Check if error is user-facing
   */
  isUserFacing: (error: AppError): boolean => {
    return error.isOperational && error.type !== ErrorType.UNKNOWN
  }
}