# Project Overview - Vue 3 CRM System

## Project Summary

This is a comprehensive Vue 3 TypeScript CRM application with modern dashboard interface, contact management, opportunity tracking, and MCP (Model Context Protocol) integration. The application demonstrates production-grade architecture with accessibility-first design and comprehensive testing coverage.

## Technology Stack

### Core Framework
- **Vue 3** with Composition API and TypeScript
- **Vite** for fast development and optimized builds
- **Pinia** for state management
- **Vue Router 4** for routing

### UI/UX Technologies
- **Tailwind CSS** for styling
- **Headless UI** for accessible components
- **Heroicons** for icons
- **Custom Design System** with token-based theming

### Backend Integration
- **Supabase** for real-time database and authentication
- **PostgreSQL** with Row Level Security (RLS)
- **Auto-generated TypeScript types** from database schema

### Development & Testing
- **Playwright** for end-to-end testing
- **Vitest** for unit testing
- **ESLint** for code quality
- **TypeScript** strict mode for type safety

### Deployment & Infrastructure
- **Vercel** for production deployment
- **PWA capabilities** with service worker
- **Multi-environment** configuration support

## Key Features

### Dashboard & Navigation
- **Responsive Dashboard Layout** with collapsible sidebar
- **Mobile-first design** with touch-friendly navigation
- **WCAG 2.1 AA compliant** accessibility
- **PWA support** for mobile app-like experience

### Contact Management
- Full CRUD operations for contacts and organizations
- Many-to-many organization-contact relationships
- Role-based contact assignments
- Advanced search and filtering capabilities

### Opportunity Management
- **7-stage sales pipeline** tracking
- **Auto-naming system** with template support
- **Batch creation** for multiple principals
- **KPI dashboard** with real-time metrics
- Advanced filtering and search

### Principal Activity Tracking
- Real-time activity monitoring
- Analytics dashboard with performance metrics
- Multi-selection and batch operations
- Timeline tracking capabilities

### Form System
- **Schema-driven validation** with Yup
- **Multi-step form wizards** with progress indicators
- **Reusable form components** with v-model support
- **Accessibility-first** form design

## Architecture Highlights

### Component Architecture
- **Atomic design principles** with hierarchical organization
- **Domain-driven component** structure
- **Design system integration** with token-based theming
- **Reusable composables** for business logic

### State Management
- **Pinia stores** for each domain (contacts, opportunities, organizations)
- **Reactive state** with computed properties
- **Comprehensive error handling** and loading states
- **Cache management** with TTL and validation

### Database Design
- **Comprehensive entity relationships** with junction tables
- **Type-safe operations** with auto-generated types
- **Row Level Security** policies
- **Performance optimization** with strategic indexing

### Testing Strategy
- **95%+ unit test coverage** with Vitest
- **Comprehensive E2E testing** with Playwright
- **Accessibility testing** integrated throughout
- **Performance benchmarking** with defined thresholds
- **Multi-device testing** (desktop, tablet, mobile)

## Production Deployment

- **Live URL**: [crm.kjrcloud.com](https://crm.kjrcloud.com)
- **Vercel deployment** with automatic builds
- **Environment variable** configuration
- **Production Supabase** integration

## Development Environment

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (optional for demo mode)

### Quick Start
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

## Project Structure Overview

```
├── src/
│   ├── components/          # Vue components organized by domain
│   ├── views/              # Page-level components
│   ├── stores/             # Pinia state management
│   ├── services/           # API integration layer
│   ├── types/              # TypeScript type definitions
│   ├── design-system/      # Reusable design components
│   ├── utils/              # Utility functions
│   └── validation/         # Yup validation schemas
├── sql/                    # Database schema and migrations
├── tests/                  # Comprehensive test suite
├── docs/                   # Project documentation
└── ref/                    # Implementation reference docs
```

## Documentation Organization

This reference documentation is organized into four main categories:

- **`/ref/architecture/`** - System architecture and design patterns
- **`/ref/implementation/`** - Technical implementation details
- **`/ref/features/`** - Feature-specific implementation guides
- **`/ref/development/`** - Development workflow and setup

## Next Steps

For detailed implementation information, explore the specific documentation files in each category. Each document provides comprehensive insights into the architecture, patterns, and implementation strategies used throughout the project.