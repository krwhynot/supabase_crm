/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SUPABASE_ENV?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_ENABLE_DEBUG_LOGGING?: string
  readonly VITE_ENABLE_DEV_TOOLS?: string
  readonly MCP_ENABLED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}