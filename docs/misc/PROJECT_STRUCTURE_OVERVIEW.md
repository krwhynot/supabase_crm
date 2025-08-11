# Vue 3 TypeScript CRM - Project Structure Overview

This document provides a comprehensive overview of the Vue 3 TypeScript CRM application structure with Supabase backend integration.

## Vue 3 CRM Application Architecture

This is a comprehensive Vue 3 TypeScript CRM application with advanced component architecture, multi-domain entity management, sophisticated state management, and full Supabase backend integration supporting contacts, organizations, opportunities, interactions, and principal activity tracking.

### 📁 Root Configuration Files
```
📄 package.json                 # Project dependencies and Vue 3 + TypeScript tooling
📄 vite.config.ts              # Vite build configuration with Vue plugin
📄 vitest.config.ts            # Vitest unit testing configuration
📄 playwright.config.ts        # Playwright E2E testing configuration
📄 tsconfig.json               # TypeScript compiler configuration
📄 tailwind.config.js          # Tailwind CSS design system configuration
📄 vercel.json                 # Production deployment configuration
📄 CLAUDE.md                   # CRM architecture and development guide
```

### 📁 Core Application Structure
```
📁 src/
├── 📄 main.ts                 # Application entry point with Pinia and Vue Router
├── 📄 App.vue                 # Root component with dashboard layout
├── 📁 components/             # Vue 3 component library
│   ├── 📁 forms/              # Multi-step form components
│   │   ├── ContactFormWrapper.vue    # Contact creation and editing
│   │   ├── OrganizationFormWrapper.vue # Organization management forms
│   │   └── OpportunityFormWrapper.vue  # Opportunity pipeline forms
│   ├── 📁 layout/             # Layout components
│   │   ├── DashboardLayout.vue       # Main CRM dashboard layout
│   │   └── HeaderSearch.vue          # Global search functionality
│   ├── 📁 opportunities/      # Sales pipeline components
│   │   ├── OpportunityKPICards.vue   # Dashboard metrics cards
│   │   └── OpportunityTable.vue      # Data table with filtering
│   ├── 📁 organizations/      # Organization management
│   │   └── InteractionTimeline.vue   # Activity timeline
│   └── 📁 principal/          # Principal activity tracking
│       ├── PrincipalDashboard.vue    # Analytics dashboard
│       └── charts/                   # Analytics visualizations
├── 📁 services/               # API service layer
│   ├── contactsApi.ts         # Contact CRUD operations
│   ├── organizationsApi.ts    # Organization management API
│   ├── opportunitiesApi.ts    # Opportunity pipeline API
│   └── principalActivityApi.ts # Principal analytics API
├── 📁 stores/                 # Pinia state management
│   ├── contactStore.ts        # Contact entity state
│   ├── organizationStore.ts   # Organization entity state
│   └── opportunityStore.ts    # Opportunity pipeline state
├── 📁 types/                  # TypeScript definitions
│   ├── database.types.ts      # Auto-generated Supabase types
│   ├── contacts.ts           # Contact entity types
│   ├── organizations.ts      # Organization entity types
│   └── opportunities.ts      # Opportunity entity types
├── 📁 views/                  # Route-level components
│   ├── DashboardView.vue      # Main dashboard
│   ├── contacts/             # Contact management views
│   ├── organizations/        # Organization management views
│   ├── opportunities/        # Sales pipeline views
│   └── principals/           # Principal activity views
└── 📁 config/                # Configuration
    └── supabaseClient.ts     # Database connection
```

### 📁 Supporting Directories
```
📁 public/                     # Static assets and PWA files
├── 📄 favicon.ico             # Application favicon
├── 📄 manifest.json           # PWA manifest
└── 📁 icons/                  # PWA icons

📁 dist/                       # Production build output (generated)
└── 📁 assets/                 # Optimized static assets
```

### 📁 Testing Suite (`/tests`)
```
📁 tests/
├── 📄 contact-form-basic.spec.ts         # Contact form E2E tests
├── 📄 opportunity-management.spec.ts     # Opportunity workflow tests
├── 📄 organization-form.spec.ts          # Organization form tests
├── 📄 principal-activity-e2e.spec.ts     # Principal analytics tests
├── 📄 ui-healing.spec.ts                 # Component validation tests
├── 📁 accessibility/                     # WCAG compliance testing
├── 📁 components/                        # Component unit tests
├── 📁 integration/                       # Integration test suites
├── 📁 performance/                       # Performance benchmarks
└── 📁 unit/                              # Vitest unit tests
```

### 📁 Database Schema (`/sql`)
```
📁 sql/
├── 📄 README.md                          # Database setup guide
├── 📄 04_contacts_schema.sql             # Contact entity schema
├── 📄 10_organizations_schema.sql        # Organization schema
├── 📄 30_opportunities_schema.sql        # Opportunity pipeline schema
├── 📄 32_interactions_schema.sql         # Customer interaction schema
├── 📄 36_principal_activity_schema.sql   # Principal analytics schema
├── 📁 migrations/                        # Schema evolution scripts
├── 📁 queries/                           # Analytics and reporting queries
└── 📁 validation/                        # Schema validation tests
```

### 📁 Documentation (`/docs`)
```
📁 docs/
├── 📄 PROJECT_STRUCTURE_OVERVIEW.md         # This project structure guide
├── 📄 mcp-tool-guide.md                     # MCP tools documentation
├── 📁 architecture/                         # Architecture Decision Records (ADRs)
├── 📁 checklists/                           # Implementation checklists
├── 📁 deployment/                           # Deployment guides
├── 📁 technical/                            # Technical documentation
├── 📁 user-guide/                           # End-user guides
└── 📁 workflows/                            # Development workflows
```

---

## Key Architecture Patterns

### Vue 3 Application
- **Composition API**: Modern Vue 3 patterns with `<script setup>` syntax
- **Pinia State Management**: Reactive stores for CRM entities
- **TypeScript Integration**: Full type safety across application
- **Component Architecture**: Reusable forms, layouts, and business components

### Supabase Backend Integration
- **PostgreSQL Database**: Comprehensive CRM schema with 36+ migrations
- **Auto-generated APIs**: RESTful APIs from database schema
- **Real-time Subscriptions**: Live data updates via WebSocket
- **Row Level Security**: Database-level access control policies
- **Type Generation**: Auto-generated TypeScript types from schema

### Development Workflow
- **Vite Build System**: Fast development with optimized production builds
- **Testing Framework**: Playwright E2E + Vitest unit tests (177 tests, 97% success)
- **MCP Enhancement**: AI-assisted development with natural language database queries
- **Production Deployment**: Vercel hosting with environment configuration

For detailed implementation patterns and architectural decisions, see `CLAUDE.md` and the `/docs/architecture/adrs/` directory.