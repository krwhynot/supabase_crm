import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    name: 'integration',
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup/integration-setup.ts'],
    include: [
      'tests/integration/**/*.spec.ts',
      'tests/integration/**/*.test.ts'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'tests/unit/**',
      'tests/e2e/**'
    ],
    testTimeout: 30000, // Longer timeout for database operations
    hookTimeout: 10000,
    teardownTimeout: 10000,
    // Enable sequential execution for database integrity
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    env: {
      NODE_ENV: 'test',
      TEST_MODE: 'integration',
      VITE_USE_DEMO_MODE: 'false', // Force production client behavior
      VITEST_INTEGRATION: 'true'
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    }
  },
  esbuild: {
    target: 'node18'
  }
})