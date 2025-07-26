import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Environment configuration (using VITE_ prefix for Vite)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Validation with development fallback
const isDevelopment = import.meta.env.DEV
const hasPlaceholderValues = supabaseUrl === 'your-supabase-project-url' || 
                            supabaseAnonKey === 'your-supabase-anon-key'

if (!supabaseUrl || !supabaseAnonKey || hasPlaceholderValues) {
  if (isDevelopment) {
    console.warn('🔧 Supabase Configuration:')
    console.warn('⚠️ Using demo mode - form submissions will be simulated')
    console.warn('💡 To connect to real database:')
    console.warn('   1. Get your Supabase project URL and anon key')
    console.warn('   2. Update values in .env file')
    console.warn('   3. Restart the development server')
  } else {
    throw new Error('Missing required Supabase environment variables')
  }
}

// Create unified client (works in both dev and prod)
// Use valid URL format for demo mode to prevent URL constructor errors
const finalUrl = (supabaseUrl && supabaseUrl !== 'your-supabase-project-url') 
  ? supabaseUrl 
  : 'https://demo.supabase.co'
  
const finalKey = (supabaseAnonKey && supabaseAnonKey !== 'your-supabase-anon-key') 
  ? supabaseAnonKey 
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo-key'

// Create Supabase client with error handling
let supabase: SupabaseClient<Database>

try {
  supabase = createClient<Database>(
    finalUrl,
    finalKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-application-name': 'supabase-vue-app',
        },
      },
    }
  )
} catch (error) {
  console.error('Failed to initialize Supabase client:', error)
  // Create a dummy client that will fail gracefully
  supabase = createClient<Database>(
    'https://dummy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy-key',
    {}
  )
}

export { supabase }

// Development utilities
export const devUtils = {
  isMCPEnabled: import.meta.env.MCP_ENABLED === 'true',
  isDevelopment: import.meta.env.DEV,
  
  logConnectionInfo() {
    if (this.isDevelopment) {
      console.log('🔧 Supabase Config:', {
        url: supabaseUrl,
        mcpEnabled: this.isMCPEnabled,
        environment: import.meta.env.VITE_SUPABASE_ENV,
      })
    }
  }
}

// Initialize in development
if (devUtils.isDevelopment) {
  devUtils.logConnectionInfo()
}