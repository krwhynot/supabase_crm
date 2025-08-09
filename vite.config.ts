import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Remove Vue dev-only features for smaller production builds
          isCustomElement: () => false,
        }
      }
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'Supabase CRM - Principal Activity Management',
        short_name: 'CRM',
        description: 'Vue 3 TypeScript CRM Application with Principal Activity Tracking',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        sourcemap: false,
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 5000000,
        skipWaiting: true,
        clientsClaim: true
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable source maps in production for smaller builds
    assetsDir: 'assets',
    emptyOutDir: true,
    
    rollupOptions: {
      // External dependencies to be loaded from CDN for production
      external: process.env.NODE_ENV === 'production' ? [
        // Large dependencies that can be loaded from CDN
        // 'vue', // Keep Vue bundled for better control
        // '@supabase/supabase-js' // Keep Supabase bundled for reliability
      ] : [],
      output: {
        // Enhanced manual chunk splitting for optimal caching
        manualChunks: {
          // Micro-chunk splitting for optimal caching
          'vue-runtime': ['vue'],
          'vue-router': ['vue-router'],
          'pinia': ['pinia'],
          'headlessui': ['@headlessui/vue'],
          'heroicons': ['@heroicons/vue/24/outline', '@heroicons/vue/24/solid'],
          'yup': ['yup'],
          'supabase': ['@supabase/supabase-js']
        },
        
        // Optimize chunk naming for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `js/[name]-[hash:8].js`;
        },
        entryFileNames: 'js/[name]-[hash:8].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'css/[name]-[hash:8][extname]';
          }
          return 'assets/[name]-[hash:8][extname]';
        },
      }
    },
    
    // Aggressive optimization settings
    chunkSizeWarningLimit: 400, // Reduced from 600KB to enforce smaller chunks
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.warn', 'console.trace'],
        passes: 3, // Multiple optimization passes
        reduce_vars: true,
        reduce_funcs: true,
        collapse_vars: true,
        computed_props: true,
        hoist_funs: true,
        hoist_props: true,
        hoist_vars: false,
        if_return: true,
        join_vars: true,
        loops: true,
        negate_iife: true,
        properties: true,
        sequences: true,
        side_effects: true,
        switches: true,
        top_retain: false,
        typeofs: true,
        unused: true,
        conditionals: true,
        dead_code: true,
        evaluate: true,
        booleans: true,
        // Advanced dead code elimination
        global_defs: {
          __DEV__: false,
          'process.env.NODE_ENV': JSON.stringify('production')
        }
      },
      mangle: {
        safari10: true,
        properties: {
          regex: /^_/
        }
      },
      format: {
        comments: false,
        ecma: 2020
      }
    },
    
    // CSS optimization
    cssCodeSplit: true,
    cssMinify: true, // Use default CSS minifier instead of lightningcss
    
    // Advanced build optimizations
    target: 'esnext', // Latest JS features for modern browsers
    modulePreload: {
      polyfill: false // Disable polyfill for smaller builds
    },
    reportCompressedSize: true,
  },
  
  server: {
    port: 3000,
    open: true,
  },
  
  // Production-optimized define flags
  define: {
    __VUE_OPTIONS_API__: false,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  
  // CSS optimization
  css: {
    modules: {
      generateScopedName: '[hash:base64:5]'
    },
    devSourcemap: false,
    preprocessorOptions: {
      // Future: could add PostCSS optimizations here
    }
  },
  
  // Dependency optimization
  optimizeDeps: {
    include: [
      'vue', 
      'vue-router', 
      'pinia',
      '@headlessui/vue',
      '@heroicons/vue/24/outline',
      '@heroicons/vue/24/solid',
      'yup'
    ],
    exclude: [
      // Exclude large dependencies that should be chunked separately
      '@supabase/supabase-js'
    ]
  }
})