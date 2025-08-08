# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a Vue 3 TypeScript CRM application with a modern dashboard interface, comprehensive contact management, and MCP (Model Context Protocol) integration.

**Technology Stack:**
- Vue 3 with Composition API and TypeScript
- Vite for fast development and optimized builds
- Pinia for state management
- Vue Router 4 for routing
- Yup for schema-based validation
- Tailwind CSS for styling
- Headless UI for accessible components
- Heroicons for icons

**Dashboard Architecture:**
- **DashboardLayout**: Master layout component with responsive sidebar navigation
- **Contact Management**: Full CRUD operations integrated with dashboard layout
- **Responsive Design**: Mobile-first approach with collapsible sidebar
- **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation support

**Enhanced Dependencies:**
- `vue` - Progressive JavaScript framework with Composition API
- `pinia` - Intuitive state management for Vue
- `vue-router` - Official router for Vue.js
- `@headlessui/vue` - Unstyled, accessible UI components
- `@heroicons/vue` - Beautiful hand-crafted SVG icons
- `yup` - Schema-based validation with TypeScript inference
- `@supabase/supabase-js` - Real-time database and authentication
- `@playwright/test` - End-to-end testing framework
- `lodash-es` - Utility library with ES modules

## Component Architecture Patterns

**Vue 3 Composition API Pattern:**
The project demonstrates production-grade form handling through Vue 3 components:

1. **Schema-Driven Validation**: Forms use Yup schemas with TypeScript type inference (`yup.InferType<typeof schema>`)
2. **Reusable Form Components**: `InputField` and `SelectField` components with v-model support
3. **Accessibility-First Design**: WCAG compliant with proper ARIA attributes, label associations, and error messaging
4. **Composition API**: Uses `<script setup>` syntax with reactive state management

**Component Composition Strategy:**
- `DashboardLayout.vue` - Master layout with responsive sidebar navigation
- `DashboardView.vue` - Main dashboard page (default route)
- `ContactsListView.vue` - Contact management with integrated sidebar
- `ContactDetailView.vue` - Individual contact details with dashboard layout
- `ContactEditView.vue` - Contact editing form with dashboard layout
- `ContactCreateView.vue` - New contact creation with dashboard layout
- `UserInfoForm.vue` - Reusable form component showcasing Vue 3 patterns
- `InputField.vue` - Reusable input component with v-model and validation
- `SelectField.vue` - Reusable select component with computed classes

**Form Component Props Pattern:**
All form components accept standardized props with Vue 3 patterns:
```typescript
interface Props {
  name: string;
  label: string;
  modelValue: string | number;
  error?: string;
  // ... component-specific props
}
```

**Validation Architecture:**
- Schema definitions use Yup with chainable validators
- Type-safe form data with automatic TypeScript inference
- Error handling with accessible error messages
- Real-time validation on blur events
- Reactive state management with Vue 3 reactivity

**Accessibility Implementation:**
- Unique IDs for form elements (`input-${name}`, `error-${name}`)
- `aria-describedby` linking inputs to error messages
- `aria-invalid` state management
- `role="alert"` for error announcements
- Proper `for`/`id` label associations

**State Management:**
- Pinia stores for application state
- Reactive form data with Vue 3 reactivity system
- Centralized form submission logic
- Type-safe store interfaces

## MCP Integration

This project includes comprehensive MCP server configuration (`.mcp.json`) enabling AI-assisted development:

**Essential MCP Servers:**
- `knowledge-graph` - Persistent memory across sessions
- `exa` - Advanced web search and research capabilities  
- `github` - Repository management and code collaboration
- `filesystem` - Secure local file operations

**Development-Focused MCP Tools:**
- `supabase` - Database operations and project management
- `Context7` - Library documentation lookup
- `sequential-thinking` - Complex problem-solving workflows
- `playwright` - Browser automation and testing

**MCP Documentation:**
See `docs/mcp-tool-guide.md` for comprehensive tool documentation and usage examples.

## Styling Conventions

**Tailwind Implementation:**
- Utility-first approach with consistent design tokens
- Responsive design using mobile-first breakpoints
- Form styling with error state variants
- Focus management for accessibility compliance
- Color scheme: blue-500/600 for primary actions, red-500/600 for errors

**Vue Component Styling Pattern:**
```typescript
const inputClasses = computed(() => {
  const base = 'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2'
  const errorClasses = 'border-red-500 focus:ring-red-500'
  const normalClasses = 'border-gray-300 focus:ring-blue-500'
  
  return `${base} ${props.error ? errorClasses : normalClasses}`
})
```

**Environment Configuration:**
- Vite environment variables use `VITE_` prefix
- Import meta environment accessed via `import.meta.env`
- Type-safe environment variables with custom declarations
- Demo mode when Supabase environment variables are missing
- Sample configuration provided in `.env.example`

**Demo Mode:**
- Application runs without Supabase configuration
- Form submissions are simulated with console logging
- Development-friendly with graceful fallbacks
- Production builds require proper environment variables

**Setting up Supabase (Optional):**
To connect to a real Supabase database:
1. Copy `.env.example` to `.env`
2. Replace placeholder values with your Supabase project credentials:
   - Get URL and anon key from your Supabase project settings
   - Ensure you have a `user_submissions` table with the required schema
3. The app will automatically detect valid credentials and disable demo mode

## Database Schema Management

**SQL Files Organization (`/sql/`):**
- `01_initial_schema.sql` - Core table definitions for `user_submissions`
- `02_rls_policies.sql` - Row Level Security policies for data access
- `03_indexes.sql` - Performance optimization indexes
- `migrations/` - Incremental schema changes over time
- `queries/` - Reference queries for analytics and maintenance

**Database Type Safety:**
- TypeScript types auto-generated from Supabase schema in `src/types/database.types.ts`
- Helper types: `UserSubmission`, `UserSubmissionInsert`, `UserSubmissionUpdate`
- Full type safety across database operations

**Supabase Client Configuration:**
- Production error handling with connection validation
- Development utilities for debugging (`devUtils.logConnectionInfo()`)

## Error Handling Patterns

**Form Validation:**
- Yup schema validation with TypeScript inference
- Real-time validation on blur events
- Accessible error messaging with ARIA attributes

**Supabase Integration:**
- Demo mode simulation when database unavailable
- Production error logging and fallback handling
- Environment variable validation with helpful development warnings

## Dashboard Implementation

**CRM Dashboard v1.0:** Full-featured dashboard with contact management integration.

**Key Features:**
- **Dashboard as Home Page**: Root route (/) now displays the dashboard
- **Left Sidebar Navigation**: Collapsible navigation with Dashboard and Contacts sections
- **Contact Management Integration**: All contact pages use consistent dashboard layout
- **Responsive Design**: Mobile-optimized with touch-friendly navigation
- **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation

**Navigation Structure:**
```
/ (Dashboard - Default Route)
├── /contacts (Contact List with Sidebar)
├── /contacts/new (Create Contact with Sidebar)
├── /contacts/:id (Contact Details with Sidebar)
├── /contacts/:id/edit (Edit Contact with Sidebar)
├── /organizations (Organization List with Sidebar)
├── /organizations/new (Create Organization with Sidebar)
├── /organizations/:id (Organization Details with Sidebar)
└── /organizations/:id/edit (Edit Organization with Sidebar)
```

**Documentation:**
- User Guide: `docs/user-guide/Dashboard_User_Guide.md`
- Technical Docs: `docs/technical/Dashboard_Technical_Documentation.md`
- Implementation Checklist: `docs/checklists/Dashboard_Migration_Plan_Checklist.md`

## Opportunity Management System

**Comprehensive Sales Pipeline Management:** Full-featured opportunity tracking with 7-stage pipeline, auto-naming, and batch creation capabilities.

**Core Features:**
- **7-Stage Pipeline**: NEW_LEAD → INITIAL_OUTREACH → SAMPLE_VISIT_OFFERED → AWAITING_RESPONSE → FEEDBACK_LOGGED → DEMO_SCHEDULED → CLOSED_WON
- **Auto-Naming System**: Intelligent opportunity naming following pattern: `[Organization] - [Principal] - [Context] - [Month Year]`
- **Batch Creation**: Create multiple opportunities for different principals simultaneously
- **KPI Dashboard**: Real-time metrics including total opportunities, active count, average probability, and monthly wins
- **Advanced Filtering**: Search and filter by stage, organization, product, date range, and probability
- **Contextual Creation**: Create opportunities directly from contact and organization detail pages

**Architecture Components:**

**Data Layer:**
- `OpportunityStore` (Pinia) - Comprehensive state management with reactive KPIs
- `ProductStore` (Pinia) - Product catalog with principal-specific filtering
- `opportunitiesApi.ts` - Full CRUD operations with batch creation support
- `opportunityNaming.ts` - Auto-naming service with template system

**View Components:**
- `OpportunitiesListView.vue` - Main list with KPI cards, search, and filtering
- `OpportunityCreateView.vue` - Multi-step creation wizard with batch support
- `OpportunityDetailView.vue` - Individual opportunity details and actions
- `OpportunityEditView.vue` - Edit form with auto-naming preservation

**Form Components:**
- `OpportunityFormWrapper.vue` - 3-step wizard orchestration with validation
- `OpportunityNameField.vue` - Auto-naming with manual override capability
- `PrincipalMultiSelect.vue` - Multi-selection with batch preview
- `OpportunityKPICards.vue` - Responsive dashboard metrics
- `OpportunityTable.vue` - Sortable table with bulk operations

**Database Schema:**
```sql
-- Core opportunities table
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  stage opportunity_stage NOT NULL DEFAULT 'NEW_LEAD',
  probability_percent INTEGER CHECK (probability_percent >= 0 AND probability_percent <= 100),
  expected_close_date DATE,
  organization_id UUID REFERENCES organizations(id),
  principal_id UUID REFERENCES principals(id),
  product_id UUID REFERENCES products(id),
  deal_owner TEXT,
  notes TEXT,
  name_template TEXT, -- For auto-naming tracking
  context opportunity_context,
  custom_context TEXT,
  is_won BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Products table with principal relationships
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE product_principals (
  product_id UUID REFERENCES products(id),
  principal_id UUID REFERENCES principals(id),
  PRIMARY KEY (product_id, principal_id)
);
```

**Type Definitions:**
- `opportunities.ts` - Complete type system with 7-stage enum and form interfaces
- `opportunityForm.ts` - Form-specific types with validation schemas
- `products.ts` - Product catalog types with principal relationships

**Navigation Integration:**
```
/opportunities (List View with KPIs)
├── /opportunities/new (3-Step Creation Wizard)
├── /opportunities/:id (Detail View)
├── /opportunities/:id/edit (Edit Form)
└── Contextual creation from:
    ├── /contacts/:id (Pre-populated organization)
    └── /organizations/:id (Pre-selected organization)
```
**Auto-Naming System:**
- **Pattern**: `[Organization] - [Principal] - [Context] - [Month Year]`
- **Template System**: Tracks naming templates for consistency
- **Manual Override**: Toggle between auto-generation and custom names
- **Batch Preview**: Shows generated names for multiple principals
- **Uniqueness**: Automatic collision detection and resolution

**Batch Creation Workflow:**
1. Select organization and context
2. Choose multiple principals
3. Preview generated opportunity names
4. Configure shared product and stage settings
5. Submit batch with progress feedback

**Integration Points:**
- **Contacts**: Create opportunities from contact detail pages
- **Organizations**: Bulk opportunity creation from organization view
- **Products**: Principal-filtered product selection
- **Dashboard**: Opportunity metrics in main dashboard overview

## Design System Architecture

**Comprehensive Design System (`src/design-system/`):**
- **Token-Based Design**: CSS custom properties for consistent theming
- **Component Library**: Organized by category (forms, layout, feedback, navigation)
- **Theme Management**: Light/dark mode with `useTheme` composable
- **Accessibility**: WCAG 2.1 AA compliant components with proper ARIA support
- **Performance**: Tree-shakable components and CSS variables for efficient theming

**Key Design System Components:**
- Form components with validation and accessibility
- Layout components (Card, Container, Stack, Grid)
- Feedback components (Alert, Badge, Spinner, Toast)
- Navigation components (Breadcrumb, Tabs, Pagination)
- Overlay components (Modal, Dropdown, Tooltip, Popover)

## Testing Strategy

**End-to-End Testing:**
- Playwright test suite in `/tests/` directory
- UI healing validation with automated screenshot capture
- Navigation validation tests for accessibility compliance
- Custom test configuration in `playwright.config.ts`

**Comprehensive Test Suite:** 177 tests with 97% success rate across multiple categories

**Test Categories:**
- Unit Tests (Vitest) - 25 tests for auto-naming service logic
- Component Integration - 18 tests for form component interactions  
- End-to-End Workflows - 42 tests for complete user journeys
- Store Management - 32 tests for Pinia state management
- Accessibility - 20 tests for WCAG 2.1 AA compliance
- Performance - 15 tests for page load and response times
- UI Healing - Automated component validation system


## Live Deployment

**Production URL:** [crm.kjrcloud.com](https://crm.kjrcloud.com)
- Deployed on Vercel with automatic builds from main branch
- Dashboard v1.0 live in production with full functionality
- Environment variables configured in Vercel dashboard
- Production Supabase integration with real database

## Implementation Reference Documentation

For comprehensive implementation details and architectural patterns, see the reference documentation in `/ref/`:

### Architecture Documentation (`/ref/architecture/`)
- **[Project Overview](./ref/architecture/project-overview.md)** - High-level project summary and technology stack
- **[State Management](./ref/architecture/state-management.md)** - Pinia store architecture and patterns  
- **[Component Architecture](./ref/architecture/component-architecture.md)** - Vue 3 component organization and design patterns
- **[Service Layer](./ref/architecture/service-layer.md)** - API services architecture and integration patterns
- **[Database Schema](./ref/architecture/database-schema.md)** - PostgreSQL database design and type system
- **[Routing & Navigation](./ref/architecture/routing-navigation.md)** - Vue Router configuration and navigation patterns

### Implementation Documentation (`/ref/implementation/`)
- **[Testing Strategy](./ref/implementation/testing-strategy.md)** - Comprehensive testing architecture with Playwright and Vitest
- **[Build System](./ref/implementation/build-system.md)** - Vite configuration, optimization, and deployment
- **[Deployment Configuration](./ref/implementation/deployment-configuration.md)** - Production deployment, performance monitoring, and infrastructure scaling

### Feature Documentation (`/ref/features/`)
- **[UI Healing System](./ref/features/ui-healing-system.md)** - Automated component validation and visual regression detection
- **[Testing Framework](./ref/features/testing-framework.md)** - Complete testing framework with 97% success rate across 177 tests

### Development Documentation (`/ref/development/`)
- **[Setup Guide](./ref/development/setup-guide.md)** - Complete development environment setup and workflow guide

**Key Reference Benefits:**
- **Comprehensive Implementation Patterns** - Detailed examples of Vue 3, TypeScript, and enterprise patterns
- **Architecture Decision Documentation** - Rationale behind design choices and technical decisions
- **Developer Onboarding** - Complete guides for new team members and contributors
- **Quality Standards** - Testing strategies, accessibility requirements, and performance benchmarks
- **Production Deployment** - Real-world deployment patterns and optimization strategies

These reference documents provide deep implementation insights complementing the high-level overview in this CLAUDE.md file.
- No revenue, deal value, or financial metrics allowed in design. Focus on progress in building relationships with potential buyer