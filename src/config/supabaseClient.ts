import type { SupabaseClient } from '@supabase/supabase-js'
import env from '../utils/env'

// Use centralized environment utilities
const { useDemoMode, showDebugInfo, getString: getEnvString } = env

// Mock query builder that mimics Supabase's chain interface
class MockQueryBuilder {
  private mockData: any[] = []
  private mockError: any = null
  private tableName: string = ''
  private insertData: any = null
  private isInsertOperation: boolean = false

  constructor(tableName?: string) {
    this.tableName = tableName || ''
  }

  // Generate UUID v4 compatible string for testing
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  // Allow tests to override mock data
  static setMockResponse(data: any[] | any | null, error: any = null, count?: number) {
    MockQueryBuilder.globalMockData = data
    MockQueryBuilder.globalMockError = error
    MockQueryBuilder.globalMockCount = count
  }

  static clearMockResponse() {
    MockQueryBuilder.globalMockData = null
    MockQueryBuilder.globalMockError = null
    MockQueryBuilder.globalMockCount = 0
    
    // Also clear any API caches to prevent test isolation issues
    try {
      // Clear API cache if available
      const { principalActivityApi } = require('../services/principalActivityApi')
      if (principalActivityApi && typeof principalActivityApi.clearAllCache === 'function') {
        principalActivityApi.clearAllCache()
      }
    } catch {
      // Ignore if service not available
    }
  }

  private static globalMockData: any = null
  private static globalMockError: any = null  
  private static globalMockCount: number = 0

  select(_columns?: string): MockQueryBuilder {
    return this
  }
  
  insert(data: any): MockQueryBuilder {
    this.isInsertOperation = true
    this.insertData = data
    return this
  }
  
  update(_data: any): MockQueryBuilder {
    return this
  }
  
  delete(): MockQueryBuilder {
    return this
  }
  
  upsert(_data: any): MockQueryBuilder {
    return this
  }
  
  eq(_column: string, _value: any): MockQueryBuilder {
    return this
  }
  
  neq(_column: string, _value: any): MockQueryBuilder {
    return this
  }
  
  gt(_column: string, _value: any): MockQueryBuilder {
    return this
  }
  
  gte(_column: string, _value: any): MockQueryBuilder {
    return this
  }
  
  lt(_column: string, _value: any): MockQueryBuilder {
    return this
  }
  
  lte(_column: string, _value: any): MockQueryBuilder {
    return this
  }
  
  like(_column: string, _value: string): MockQueryBuilder {
    return this
  }
  
  ilike(_column: string, _value: string): MockQueryBuilder {
    return this
  }
  
  is(_column: string, _value: any): MockQueryBuilder {
    return this
  }
  
  not(_column: string, _operator: string, _value: any): MockQueryBuilder {
    return this
  }
  
  or(_filters: string): MockQueryBuilder {
    return this
  }
  
  and(_filters: string): MockQueryBuilder {
    return this
  }
  
  contains(_column: string, _value: any): MockQueryBuilder {
    return this
  }
  
  containedBy(_column: string, _value: any): MockQueryBuilder {
    return this
  }
  
  in(_column: string, _values: any[]): MockQueryBuilder {
    return this
  }
  
  order(_column: string, _options?: { ascending?: boolean }): MockQueryBuilder {
    return this
  }
  
  limit(_count: number): MockQueryBuilder {
    return this
  }
  
  range(_from: number, _to: number): MockQueryBuilder {
    return this
  }
  
  single(): Promise<{ data: any | null; error: any }> {
    // Handle organization creation specifically
    if (this.isInsertOperation && this.tableName === 'organizations' && this.insertData) {
      const createdOrg = {
        id: this.generateUUID(),
        name: this.insertData.name || 'Test Organization',
        industry: this.insertData.industry || 'Technology',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...this.insertData
      }
      
      return Promise.resolve({ data: createdOrg, error: null })
    }

    // Use global mock data if set, otherwise fall back to instance data
    let data = MockQueryBuilder.globalMockData !== null ? MockQueryBuilder.globalMockData : null
    const error = MockQueryBuilder.globalMockError !== null ? MockQueryBuilder.globalMockError : this.mockError
    
    // In Supabase, when there's an error, data is null
    if (error) {
      data = null
    } else if (Array.isArray(data) && data.length > 0) {
      // For single() calls, return first item from array
      data = data[0]
    } else if (Array.isArray(data) && data.length === 0) {
      // Empty array should return null for single()
      data = null
    }
    
    return Promise.resolve({ data, error })
  }
  
  // Make the class thenable to support await
  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    // Handle organization creation specifically
    if (this.isInsertOperation && this.tableName === 'organizations' && this.insertData) {
      const createdOrg = {
        id: this.generateUUID(),
        name: this.insertData.name || 'Test Organization',
        industry: this.insertData.industry || 'Technology',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...this.insertData
      }
      
      const result = { data: createdOrg, error: null, count: 1 }
      return Promise.resolve(result).then(onfulfilled, onrejected)
    }

    // Handle organization select operations
    if (this.tableName === 'organizations' && !this.isInsertOperation) {
      // Try to get organizations from window mock data first
      let mockOrganizations: any[] = []
      
      try {
        // Check if running in browser environment
        if (typeof window !== 'undefined') {
          mockOrganizations = (window as any).__MOCK_ORGANIZATIONS__ || []
        }
      } catch {
        // Fallback for Node.js environments
      }
      
      // If no mock organizations, create some defaults with valid UUIDs
      if (mockOrganizations.length === 0) {
        mockOrganizations = [
          {
            id: 'a0b1c2d3-e4f5-4678-9abc-def123456789',
            name: 'Default Organization',
            industry: 'Technology',
            created_at: new Date().toISOString()
          }
        ]
      }
      
      const result = { data: mockOrganizations, error: null, count: mockOrganizations.length }
      return Promise.resolve(result).then(onfulfilled, onrejected)
    }

    // Use global mock data if set, otherwise fall back to instance data
    let data = MockQueryBuilder.globalMockData !== null ? MockQueryBuilder.globalMockData : this.mockData
    const error = MockQueryBuilder.globalMockError !== null ? MockQueryBuilder.globalMockError : this.mockError
    const count = MockQueryBuilder.globalMockCount !== undefined ? MockQueryBuilder.globalMockCount : 0
    
    // In Supabase, when there's an error, data is null, not empty array
    if (error) {
      data = null
    }
    
    const result = { data, error, count }
    return Promise.resolve(result).then(onfulfilled, onrejected)
  }
}

// Type for mock client to match Supabase interface
interface MockSupabaseClient {
  from: (table: string) => MockQueryBuilder
  auth: {
    getUser: () => Promise<{ data: { user: any | null }; error: any }>
    signIn: (credentials: any) => Promise<{ data: any | null; error: any }>
    signOut: () => Promise<{ error: any }>
  }
}

// Mock client for demo mode to avoid PostgREST import issues
const mockClient: MockSupabaseClient = {
  from: (table: string) => new MockQueryBuilder(table),
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signIn: () => Promise.resolve({ data: null, error: null }),
    signOut: () => Promise.resolve({ error: null })
  }
}

// Initialize Supabase client with proper environment handling
function createSupabaseClient(): SupabaseClient | MockSupabaseClient {
  if (useDemoMode) {
    // Use mock client for development, testing, and Node.js environments
    if (showDebugInfo) {
      console.warn('🔧 Demo Mode Active:')
      console.warn('⚠️ Using mock Supabase client for testing')
      console.warn('💡 All database operations will be simulated')
    }
    
    return mockClient
  } else {
    // For production browser environment, we'll handle real client initialization
    // Since this is a synchronous function, we return mock and handle real client lazily
    const supabaseUrl = getEnvString('VITE_SUPABASE_URL')
    const supabaseAnonKey = getEnvString('VITE_SUPABASE_ANON_KEY')
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Missing Supabase credentials, falling back to mock client')
      return mockClient
    }
    
    // In a real Vite environment, this import should work
    if (env.isBrowserEnvironment) {
      try {
        // This will be handled by the bundler in production
        // For now, return mock and let the application handle real initialization
        console.warn('Production Supabase client initialization deferred')
        return mockClient
      } catch (error) {
        console.error('Failed to initialize Supabase client, falling back to mock:', error)
        return mockClient
      }
    }
    
    return mockClient
  }
}

// Initialize the client
let supabase: SupabaseClient | MockSupabaseClient = createSupabaseClient()

// Async initialization for production environments
export async function initializeRealSupabaseClient(): Promise<SupabaseClient | MockSupabaseClient> {
  if (useDemoMode) {
    return mockClient
  }
  
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = getEnvString('VITE_SUPABASE_URL')
    const supabaseAnonKey = getEnvString('VITE_SUPABASE_ANON_KEY')
    
    if (supabaseUrl && supabaseAnonKey) {
      const realClient = createClient(supabaseUrl, supabaseAnonKey)
      // Update the exported client
      supabase = realClient
      return realClient
    } else {
      console.warn('Missing Supabase credentials, keeping mock client')
      return mockClient
    }
  } catch (error) {
    console.error('Failed to initialize real Supabase client:', error)
    return mockClient
  }
}

export { supabase, MockQueryBuilder }

// Development utilities with centralized environment access
export const devUtils = {
  isMCPEnabled: env.isMCPEnabled,
  isDevelopment: env.isDevelopment,
  isTestEnvironment: env.isTest,
  isNodeEnvironment: env.isNodeEnvironment,
  
  logConnectionInfo() {
    if (env.showDebugInfo) {
      console.log('🔧 Demo Mode Config:', {
        mode: 'demo',
        mcpEnabled: this.isMCPEnabled,
        mockClient: true,
        environment: this.isNodeEnvironment ? 'node' : 'browser',
        testing: this.isTestEnvironment
      })
    }
  }
}

// Initialize in development (but not during tests)
if (env.showDebugInfo) {
  devUtils.logConnectionInfo()
}