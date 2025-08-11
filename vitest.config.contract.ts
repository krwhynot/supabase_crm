import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    name: 'contract',
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup/contract-setup.ts'],
    include: [
      'tests/contract/**/*.spec.ts',
      'tests/contract/**/*.test.ts'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'tests/unit/**',
      'tests/integration/**',
      'tests/e2e/**'
    ],
    testTimeout: 15000,
    hookTimeout: 5000,
    // Run contract tests in parallel for speed
    pool: 'threads',
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: 4
      }
    },
    env: {
      NODE_ENV: 'test',
      TEST_MODE: 'contract',
      VITEST_CONTRACT: 'true'
    },
    // Generate coverage for contract validation
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/services/**/*.ts',
        'src/lib/supabase.ts',
        'src/config/supabaseClient.ts'
      ],
      exclude: [
        'src/**/*.spec.ts',
        'src/**/*.test.ts',
        'tests/**'
      ]
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