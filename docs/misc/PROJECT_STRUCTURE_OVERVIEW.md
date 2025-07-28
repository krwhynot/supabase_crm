# Project Structure Overview

This document provides a comprehensive overview of the Vue.js application structure with Supabase integration.

## Frontend

This is a modern Vue 3 TypeScript application with comprehensive form handling, state management, and Supabase backend integration.

### 📁 Root Configuration Files
```
📄 package.json                 # Project dependencies and scripts
📄 vite.config.ts              # Vite build configuration with Vue plugin
📄 tsconfig.json               # TypeScript compiler configuration
📄 tsconfig.node.json          # TypeScript config for Node.js tooling
📄 tailwind.config.js          # Tailwind CSS configuration
📄 postcss.config.js           # PostCSS configuration for CSS processing
📄 index.html                  # HTML entry point for Vite
📄 netlify.toml                # Netlify deployment configuration
📄 vercel.json                 # Vercel deployment configuration
```

### 📁 Source Code (`/src`)
```
📁 src/
├── 📄 main.ts                 # Application entry point with Pinia and Router setup
├── 📄 App.vue                 # Root Vue component
├── 📄 vite-env.d.ts          # Vite environment type declarations
├── 📁 assets/
│   └── 📁 styles/
│       └── 📄 index.css       # Global Tailwind CSS imports and custom styles
├── 📁 components/
│   ├── 📄 InputField.vue      # Reusable form input with v-model, validation, accessibility
│   ├── 📄 SelectField.vue     # Reusable select dropdown with computed classes
│   └── 📄 UserInfoForm.vue    # Main form component with Yup validation schema
├── 📁 config/
│   └── 📄 supabaseClient.ts   # Supabase client configuration and initialization
├── 📁 router/
│   └── 📄 index.ts            # Vue Router 4 configuration and route definitions
├── 📁 stores/
│   └── 📄 formStore.ts        # Pinia store for form state management
├── 📁 types/
│   └── 📄 database.types.ts   # TypeScript interfaces for database schemas
└── 📁 views/
    └── 📄 HomeView.vue        # Main application view component
```

### 📁 Public Assets (`/public`)
```
📁 public/
├── 📄 favicon.ico             # Application favicon (ICO format)
└── 📄 favicon.svg             # Application favicon (SVG format)
```

### 📁 Build Output (`/dist`)
```
📁 dist/                       # Production build output (generated)
└── 📁 assets/                 # Compiled and optimized static assets
```

### 📁 Database (`/sql`)
```
📁 sql/
├── 📄 README.md               # Database setup and migration instructions
├── 📄 01_initial_schema.sql   # Initial database schema definition
├── 📄 02_rls_policies.sql     # Row Level Security policies
├── 📄 03_indexes.sql          # Database indexes for performance
├── 📁 migrations/
│   └── 📄 001_add_email_column.sql  # Database migration scripts
└── 📁 queries/
    ├── 📄 analytics.sql       # Analytics and reporting queries
    └── 📄 maintenance.sql     # Database maintenance queries
```

### 📁 Documentation (`/docs`)
```
📁 docs/
├── 📄 PROJECT_STRUCTURE_OVERVIEW.md  # This file
└── 📄 mcp-tool-guide.md             # MCP (Model Context Protocol) tools documentation
```

## Architecture Highlights

### Component Architecture
- **Vue 3 Composition API**: Uses `<script setup>` syntax with reactive state management
- **Schema-Driven Validation**: Forms use Yup schemas with TypeScript type inference
- **Accessibility-First Design**: WCAG compliant with proper ARIA attributes and label associations
- **Reusable Components**: `InputField` and `SelectField` with v-model support and standardized props

### State Management
- **Pinia**: Modern state management with TypeScript support
- **Reactive Forms**: Vue 3 reactivity system for form data management
- **Type Safety**: TypeScript interfaces throughout the application

### Styling & UI
- **Tailwind CSS**: Utility-first CSS framework with responsive design
- **Headless UI**: Unstyled, accessible UI components
- **Heroicons**: SVG icon library
- **Design Tokens**: Consistent color scheme (blue-500/600 primary, red-500/600 errors)

### Backend Integration
- **Supabase Client**: Configured for database operations and authentication
- **Demo Mode**: Graceful fallbacks when Supabase credentials are not configured
- **Environment Configuration**: Type-safe environment variables with Vite

### Development Tools
- **Vite**: Fast development server and optimized production builds
- **TypeScript**: Full type safety with Vue 3 integration
- **ESLint**: Code linting with Vue and TypeScript rules
- **Vue TSC**: Type checking for Vue single-file components

### Build & Deployment
- **Multiple Deployment Targets**: Netlify and Vercel configurations
- **Source Maps**: Enabled for production debugging
- **Optimized Builds**: Tree-shaking and code splitting via Vite
- **Asset Management**: Automatic asset optimization and versioning