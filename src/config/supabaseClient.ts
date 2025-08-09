// Mock client for demo mode to avoid PostgREST import issues
const mockClient = {
  from: (_table: string) => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: null, error: null }),
    update: () => ({ data: null, error: null }),
    delete: () => ({ data: null, error: null }),
    upsert: () => ({ data: null, error: null })
  }),
  auth: {
    getUser: () => ({ data: { user: null }, error: null }),
    signIn: () => ({ data: null, error: null }),
    signOut: () => ({ error: null })
  }
}

// Development mode - use mock client to avoid import issues
const isDevelopment = import.meta.env.DEV
const isDemo = true // Always use demo mode for QA testing

let supabase: any

if (isDevelopment && isDemo) {
  console.warn('🔧 Demo Mode Active:')
  console.warn('⚠️ Using mock Supabase client for testing')
  console.warn('💡 All database operations will be simulated')
  
  supabase = mockClient
} else {
  // Try to import and create real client only in production
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
    
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error('Failed to initialize Supabase client, falling back to mock:', error)
    supabase = mockClient
  }
}

export { supabase }

// Development utilities
export const devUtils = {
  isMCPEnabled: import.meta.env.MCP_ENABLED === 'true',
  isDevelopment: import.meta.env.DEV,
  
  logConnectionInfo() {
    if (this.isDevelopment) {
      console.log('🔧 Demo Mode Config:', {
        mode: 'demo',
        mcpEnabled: this.isMCPEnabled,
        mockClient: true
      })
    }
  }
}

// Initialize in development
if (devUtils.isDevelopment) {
  devUtils.logConnectionInfo()
}