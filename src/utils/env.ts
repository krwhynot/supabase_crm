/**
 * Cross-environment utility for safe environment variable access
 * Works in both Node.js (Playwright tests, SSR) and browser (Vite) environments
 */

// Safe environment variable access for cross-platform compatibility
export function getSafeEnv<T = string>(key: string, defaultValue?: T): T | string | undefined {
  // Handle Node.js environment (Playwright tests, SSR, etc.)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue
  }
  
  // Handle Vite environment (browser, development)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || defaultValue
  }
  
  return defaultValue
}

// Type-safe environment variable getters
export function getEnvString(key: string, defaultValue = ''): string {
  const value = getSafeEnv(key, defaultValue)
  return typeof value === 'string' ? value : defaultValue
}

export function getEnvBoolean(key: string, defaultValue = false): boolean {
  const value = getSafeEnv(key)
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true'
  }
  return defaultValue
}

// Environment detection helpers
export const env = {
  // Basic environment flags
  isDevelopment: getEnvBoolean('DEV') || getEnvString('NODE_ENV') !== 'production',
  isProduction: getEnvBoolean('PROD') || getEnvString('NODE_ENV') === 'production',
  isTest: getEnvString('NODE_ENV') === 'test' || getEnvBoolean('CI'),
  
  // Runtime environment detection
  isNodeEnvironment: typeof process !== 'undefined' && !!process.env,
  isBrowserEnvironment: typeof window !== 'undefined',
  isViteEnvironment: typeof import.meta !== 'undefined' && !!import.meta.env,
  
  // CI/CD detection
  isCI: getEnvBoolean('CI'),
  
  // Test mode detection
  isPlaywrightTest: getEnvBoolean('PLAYWRIGHT_TEST') || getEnvBoolean('VITE_TEST_MODE'),
  
  // Feature flags
  isMCPEnabled: getEnvBoolean('MCP_ENABLED'),
  
  // Get environment variable with fallback
  get: getSafeEnv,
  getString: getEnvString,
  getBoolean: getEnvBoolean,
  
  // Check if we should use demo/mock mode
  get useDemoMode() {
    return this.isDevelopment || this.isTest || this.isPlaywrightTest || this.isNodeEnvironment
  },
  
  // Check if we should show debug information
  get showDebugInfo() {
    return this.isDevelopment && !this.isTest && !this.isPlaywrightTest
  }
}

export default env