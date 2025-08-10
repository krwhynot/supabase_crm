import type { SupabaseClient } from '@supabase/supabase-js'
import env from '../utils/env'

// Use centralized environment utilities
const { useDemoMode, showDebugInfo, getString: getEnvString } = env

// Mock query builder that mimics Supabase's chain interface
class MockQueryBuilder {
  private mockData: any[] = []
  private mockError: any = null

  select(_columns?: string): MockQueryBuilder {
    return this
  }
  
  insert(_data: any): MockQueryBuilder {
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
    return Promise.resolve({ data: null, error: this.mockError })
  }
  
  // Make the class thenable to support await
  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    const result = { data: this.mockData, error: this.mockError, count: 0 }
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
  from: (_table: string) => new MockQueryBuilder(),
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

export { supabase }

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