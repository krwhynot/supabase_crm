/**
 * Contract Test Setup - Mock vs Production Behavior Validation
 * 
 * This setup validates that mock responses in development match
 * the structure and behavior of production Supabase responses
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { vi } from 'vitest'

// Contract validation utilities
export interface ContractValidation {
  validateResponseStructure(mockResponse: any, expectedStructure: any): boolean
  validateQueryChaining(mockChain: any, expectedMethods: string[]): boolean
  compareResponses(mockResponse: any, realResponse: any): ValidationResult
}

export interface ValidationResult {
  isValid: boolean
  differences: string[]
  warnings: string[]
  errors: string[]
}

// Mock behavior patterns from production
export const SUPABASE_RESPONSE_PATTERNS = {
  successResponse: {
    data: expect.any(Array),
    error: null,
    count: expect.any(Number)
  },
  
  singleSuccessResponse: {
    data: expect.any(Object),
    error: null
  },
  
  errorResponse: {
    data: null,
    error: {
      message: expect.any(String),
      details: expect.any(String),
      hint: expect.any(String),
      code: expect.any(String)
    }
  },
  
  emptyResponse: {
    data: [],
    error: null,
    count: 0
  }
}

export const SUPABASE_QUERY_METHODS = [
  'select', 'insert', 'update', 'delete', 'upsert',
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike',
  'is', 'in', 'contains', 'containedBy', 'or', 'and',
  'order', 'limit', 'range', 'single'
]

// Contract validation implementation
export const contractValidator: ContractValidation = {
  validateResponseStructure(mockResponse: any, expectedStructure: any): boolean {
    try {
      expect(mockResponse).toMatchObject(expectedStructure)
      return true
    } catch (error) {
      console.warn('Response structure validation failed:', error)
      return false
    }
  },
  
  validateQueryChaining(mockChain: any, expectedMethods: string[]): boolean {
    const missingMethods: string[] = []
    const invalidMethods: string[] = []
    
    expectedMethods.forEach(method => {
      if (!mockChain[method]) {
        missingMethods.push(method)
      } else if (typeof mockChain[method] !== 'function') {
        invalidMethods.push(method)
      }
    })
    
    if (missingMethods.length > 0) {
      console.warn('Missing query methods:', missingMethods)
      return false
    }
    
    if (invalidMethods.length > 0) {
      console.warn('Invalid query methods (not functions):', invalidMethods)
      return false
    }
    
    return true
  },
  
  compareResponses(mockResponse: any, realResponse: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      differences: [],
      warnings: [],
      errors: []
    }
    
    // Check basic structure
    if (typeof mockResponse !== typeof realResponse) {
      result.differences.push(`Type mismatch: mock is ${typeof mockResponse}, real is ${typeof realResponse}`)
      result.isValid = false
    }
    
    // Check required properties - success is always required
    const requiredProps = ['success']
    requiredProps.forEach(prop => {
      if ((prop in mockResponse) !== (prop in realResponse)) {
        result.differences.push(`Property '${prop}' existence mismatch`)
        result.isValid = false
      }
    })
    
    // Success responses should have data, error responses should have error
    if (mockResponse.success && realResponse.success) {
      if (!mockResponse.data && !realResponse.data) {
        result.warnings.push('Both success responses have no data')
      } else if (mockResponse.data && realResponse.data) {
        if (Array.isArray(mockResponse.data) !== Array.isArray(realResponse.data)) {
          result.differences.push('Data array/object type mismatch')
          result.isValid = false
        }
        
        if (Array.isArray(mockResponse.data) && Array.isArray(realResponse.data)) {
          if (mockResponse.data.length !== realResponse.data.length) {
            result.warnings.push(`Array length difference: mock=${mockResponse.data.length}, real=${realResponse.data.length}`)
          }
        }
      }
    }
    
    // Error responses should have error field
    if (!mockResponse.success && !realResponse.success) {
      if (!mockResponse.error || !realResponse.error) {
        result.differences.push('Error responses should have error field')
        result.isValid = false
      }
    }
    
    return result
  }
}

// Global setup for contract testing
let originalConsoleWarn: typeof console.warn
let originalConsoleError: typeof console.error
let contractViolations: string[] = []

beforeAll(() => {
  console.log('🔧 Setting up contract validation environment...')
  
  // Capture console output for contract violations
  originalConsoleWarn = console.warn
  originalConsoleError = console.error
  
  console.warn = (...args: any[]) => {
    const message = args.join(' ')
    if (message.includes('contract') || message.includes('validation')) {
      contractViolations.push(`WARN: ${message}`)
    }
    originalConsoleWarn.apply(console, args)
  }
  
  console.error = (...args: any[]) => {
    const message = args.join(' ')
    if (message.includes('contract') || message.includes('validation')) {
      contractViolations.push(`ERROR: ${message}`)
    }
    originalConsoleError.apply(console, args)
  }
})

beforeEach(() => {
  // Clear violations for each test
  contractViolations = []
  
  // Set up contract testing environment variables
  process.env.CONTRACT_TESTING = 'true'
  process.env.VALIDATE_MOCKS = 'true'
})

afterEach(() => {
  // Report any contract violations found during test
  if (contractViolations.length > 0) {
    console.log('\n📋 Contract Violations Found:')
    contractViolations.forEach(violation => {
      console.log(`  ❌ ${violation}`)
    })
    console.log('')
  }
  
  // Clear Vitest mocks
  vi.clearAllMocks()
})

afterAll(() => {
  console.log('🧹 Cleaning up contract validation environment...')
  
  // Restore original console methods
  console.warn = originalConsoleWarn
  console.error = originalConsoleError
  
  // Generate contract validation report
  console.log('\n📊 Contract Testing Summary:')
  console.log(`Total violations detected: ${contractViolations.length}`)
  
  if (contractViolations.length > 0) {
    console.log('📋 All Contract Violations:')
    contractViolations.forEach((violation, index) => {
      console.log(`  ${index + 1}. ${violation}`)
    })
  } else {
    console.log('✅ No contract violations detected')
  }
  
  console.log('')
})

// Utility functions for contract testing
export const contractTestUtils = {
  // Validate that mock behaves like production Supabase client
  validateSupabaseMock(mockClient: any) {
    const validationResults: ValidationResult[] = []
    
    // Test that from() returns a query builder
    const queryBuilder = mockClient.from('test_table')
    
    // Validate query methods exist and chain correctly
    const chainValidation = contractValidator.validateQueryChaining(
      queryBuilder,
      SUPABASE_QUERY_METHODS
    )
    
    if (!chainValidation) {
      validationResults.push({
        isValid: false,
        differences: ['Query chaining validation failed'],
        warnings: [],
        errors: ['Mock query builder missing required methods']
      })
    }
    
    return validationResults
  },
  
  // Compare API response structures
  async validateApiResponse(
    apiFunction: () => Promise<any>,
    expectedPattern: any,
    testName: string
  ) {
    try {
      const response = await apiFunction()
      
      const isValid = contractValidator.validateResponseStructure(response, expectedPattern)
      
      if (!isValid) {
        contractViolations.push(`${testName}: Response structure validation failed`)
      }
      
      return isValid
    } catch (error) {
      contractViolations.push(`${testName}: API call failed - ${error}`)
      return false
    }
  },
  
  // Create mock response that matches production structure
  createValidMockResponse(data: any[] | any | null, error: any = null, count?: number) {
    if (error) {
      return {
        data: null,
        error: {
          message: error.message || 'Unknown error',
          details: error.details || '',
          hint: error.hint || '',
          code: error.code || 'UNKNOWN'
        }
      }
    }
    
    if (Array.isArray(data)) {
      return {
        data,
        error: null,
        count: count ?? data.length
      }
    }
    
    if (data === null) {
      return {
        data: [],
        error: null,
        count: 0
      }
    }
    
    // Single object response
    return {
      data,
      error: null
    }
  },
  
  // Log contract violation
  logViolation(violation: string, severity: 'warn' | 'error' = 'warn') {
    const message = `Contract violation: ${violation}`
    contractViolations.push(`${severity.toUpperCase()}: ${message}`)
    
    if (severity === 'error') {
      console.error(message)
    } else {
      console.warn(message)
    }
  }
}