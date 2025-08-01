# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Start development server:**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
```

**Preview production build:**
```bash
npm run preview
```

**Run linting:**
```bash
npm run lint
```

**Run type checking:**
```bash
npm run type-check
```

**Install dependencies after cloning:**
```bash
npm install
```

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

**Test Commands:**
```bash
npx playwright test              # Run all tests
npx playwright test --ui        # Run tests with UI mode
npx playwright show-report      # View test results
```

## Live Deployment

**Production URL:** [crm.kjrcloud.com](https://crm.kjrcloud.com)
- Deployed on Vercel with automatic builds from main branch
- Dashboard v1.0 live in production with full functionality
- Environment variables configured in Vercel dashboard
- Production Supabase integration with real database