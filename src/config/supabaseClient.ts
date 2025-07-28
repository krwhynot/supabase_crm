import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Environment configuration (using VITE_ prefix for Vite)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

// Create Supabase client
const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
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

// Production debugging - log environment variable status
if (!devUtils.isDevelopment) {
  console.log('🚀 Production Supabase Config Check:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlPrefix: supabaseUrl?.substring(0, 20) + '...',
    keyPrefix: supabaseAnonKey?.substring(0, 20) + '...',
    buildTime: new Date().toISOString()
  })
}

// Initialize in development
if (devUtils.isDevelopment) {
  devUtils.logConnectionInfo()
}