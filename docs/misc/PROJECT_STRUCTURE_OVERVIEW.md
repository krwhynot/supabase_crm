# Project Structure Overview

This document provides a comprehensive overview of the Vue.js application structure with Supabase integration.

## Frontend

This is a comprehensive Vue 3 TypeScript CRM application with advanced component architecture, multi-domain entity management, sophisticated state management, and full Supabase backend integration supporting contacts, organizations, opportunities, interactions, and principal activity tracking.

### 📁 Root Configuration Files
```
📄 package.json                 # Project dependencies and scripts with comprehensive dev tools
📄 vite.config.ts              # Vite build configuration with Vue plugin and PWA support
📄 vitest.config.ts            # Vitest unit testing configuration
📄 playwright.config.ts        # Playwright E2E testing configuration
📄 tsconfig.json               # TypeScript compiler configuration
📄 tsconfig.node.json          # TypeScript config for Node.js tooling
📄 tailwind.config.js          # Tailwind CSS configuration with custom design tokens
📄 postcss.config.js           # PostCSS configuration for CSS processing
📄 index.html                  # HTML entry point for Vite with PWA meta tags
📄 vercel.json                 # Vercel deployment configuration
📄 CLAUDE.md                   # AI development assistant instructions and architecture guide
```

### 📁 Source Code (`/src`)
```
📁 src/
├── 📄 main.ts                 # Application entry point with Pinia, Router, and PWA setup
├── 📄 App.vue                 # Root Vue component with layout orchestration
├── 📄 vite-env.d.ts          # Vite environment type declarations
├── 📁 api/                    # Legacy API layer (being phased out in favor of services/)
├── 📁 assets/
│   ├── 📁 css/
│   │   └── 📄 mobile-pwa.css  # Mobile-specific PWA styles and optimizations
│   └── 📁 styles/
│       └── 📄 index.css       # Global Tailwind CSS imports and custom styles
├── 📁 components/
│   ├── 📁 atomic/             # Atomic Design System - Basic building blocks
│   │   └── 📄 Button.vue      # Base button component with variant system
│   ├── 📁 molecular/          # Molecular components - Simple combinations of atoms
│   │   └── 📄 FormGroup.vue   # Form field grouping with label and error handling
│   ├── 📁 common/             # Shared utility components
│   │   └── 📄 BreadcrumbNavigation.vue  # Site navigation breadcrumbs
│   ├── 📁 forms/              # Form components and field types
│   │   ├── 📄 BaseInputField.vue      # Base input with validation and accessibility
│   │   ├── 📄 CheckboxField.vue       # Checkbox input with label association
│   │   ├── 📄 RadioField.vue          # Radio button input with group support
│   │   ├── 📄 SelectField.vue         # Select dropdown with computed classes
│   │   ├── 📄 TextareaField.vue       # Multi-line text input
│   │   ├── 📄 SegmentSelector.vue     # Multi-option segment selector UI
│   │   ├── 📄 ContactForm.vue         # Legacy contact form (deprecated)
│   │   ├── 📄 ContactFormWrapper.vue  # Multi-step contact form orchestrator
│   │   ├── 📄 ContactMultiSelector.vue # Multiple contact selection component
│   │   ├── 📄 ContactStatusWarning.vue # Contact status validation warnings
│   │   ├── 📄 ContactStepOne.vue      # Contact form step 1 - Basic info
│   │   ├── 📄 ContactStepThree.vue    # Contact form step 3 - Validation & confirmation
│   │   ├── 📄 OrganizationFormWrapper.vue # Multi-step organization form orchestrator
│   │   ├── 📄 OrganizationStepOne.vue # Organization form step 1 - Basic info
│   │   ├── 📄 OrganizationStepTwo.vue # Organization form step 2 - Details & relationships
│   │   ├── 📄 OrganizationStepThree.vue # Organization form step 3 - Validation
│   │   ├── 📄 PrincipalMultiSelector.vue # Multiple principal selection component
│   │   ├── 📄 QuickContactForm.vue    # Simplified contact creation modal
│   │   └── 📄 AddPositionModal.vue    # Modal for adding positions to contacts
│   ├── 📁 layout/             # Layout and shell components
│   │   ├── 📄 DashboardLayout.vue     # Main dashboard layout with responsive sidebar
│   │   ├── 📄 HeaderSearch.vue       # Global search functionality in header
│   │   ├── 📄 NotificationDropdown.vue # Notification center dropdown
│   │   └── 📄 UserMenu.vue           # User profile and settings menu
│   ├── 📁 navigation/         # Navigation-specific components
│   │   └── 📄 NavigationBreadcrumbs.vue # Dynamic breadcrumb navigation
│   ├── 📁 modals/             # Modal dialog components
│   │   └── 📄 OrganizationCreateModal.vue # Organization creation modal
│   ├── 📁 interactions/       # Interaction management components
│   │   ├── 📄 InteractionDetailView.vue  # Interaction detail display
│   │   ├── 📄 InteractionFormWrapper.vue # Multi-step interaction form
│   │   ├── 📄 InteractionListView.vue    # Interaction list with filtering
│   │   ├── 📄 InteractionStepOne.vue     # Interaction form step 1
│   │   ├── 📄 InteractionStepTwo.vue     # Interaction form step 2
│   │   └── 📄 InteractionStepThree.vue   # Interaction form step 3
│   ├── 📁 opportunities/      # Sales opportunity management components
│   │   ├── 📄 OpportunityFormWrapper.vue # Multi-step opportunity creation wizard
│   │   ├── 📄 OpportunityKPICards.vue    # Opportunity metrics dashboard cards
│   │   ├── 📄 OpportunityNameField.vue   # Auto-naming field with manual override
│   │   ├── 📄 OpportunityTable.vue       # Sortable opportunity data table
│   │   ├── 📄 PrincipalMultiSelect.vue   # Multi-principal selection for batch creation
│   │   ├── 📄 ProbabilityBar.vue         # Visual probability indicator
│   │   ├── 📄 ProductSelect.vue          # Product selection with principal filtering
│   │   ├── 📄 StageSelect.vue            # Opportunity stage selector
│   │   ├── 📄 StageTag.vue               # Visual stage indicator tag
│   │   └── 📄 index.ts                   # Opportunity components barrel export
│   ├── 📁 organizations/      # Organization management components
│   │   ├── 📄 DocumentRepository.vue     # Organization document management
│   │   ├── 📄 InteractionTimeline.vue    # Organization interaction history
│   │   ├── 📄 OpportunityPipeline.vue    # Organization opportunity overview
│   │   └── 📄 OrganizationCreateModal.vue # Organization creation modal
│   └── 📁 principal/          # Principal activity tracking and analytics
│       ├── 📄 ActivityStatusBadge.vue    # Principal activity status indicator
│       ├── 📄 CreatePrincipalOpportunityButton.vue # Quick opportunity creation
│       ├── 📄 DistributorRelationshipTable.vue    # Distributor relationship management
│       ├── 📄 EngagementScoreRing.vue             # Circular engagement score display
│       ├── 📄 KPICard.vue                         # Principal KPI metric card
│       ├── 📄 LogPrincipalInteractionButton.vue   # Quick interaction logging
│       ├── 📄 ManagePrincipalProductsButton.vue   # Product management interface
│       ├── 📄 PrincipalActionBar.vue              # Principal action buttons
│       ├── 📄 PrincipalActivityTimeline.vue       # Activity timeline visualization
│       ├── 📄 PrincipalAnalyticsChart.vue         # Analytics chart component
│       ├── 📄 PrincipalCard.vue                   # Principal summary card
│       ├── 📄 PrincipalDashboard.vue              # Principal overview dashboard
│       ├── 📄 PrincipalInteractionList.vue        # Principal-specific interactions
│       ├── 📄 PrincipalKPICards.vue               # Principal KPI cards collection
│       ├── 📄 PrincipalOpportunityList.vue        # Principal-specific opportunities
│       ├── 📄 PrincipalProductTable.vue           # Principal product association table
│       ├── 📄 PrincipalSelector.vue               # Principal selection component
│       ├── 📄 PrincipalTable.vue                  # Principal data table
│       ├── 📄 ProductPerformanceIndicator.vue     # Product performance metrics
│       ├── 📄 RecentOpportunitiesList.vue         # Recent opportunities display
│       ├── 📄 TrendIndicator.vue                  # Trend direction indicator
│       ├── 📁 charts/                             # Principal analytics charts
│       │   ├── 📄 ActivityVolumeChart.vue         # Activity volume over time
│       │   ├── 📄 EngagementTrendChart.vue        # Engagement trend analysis
│       │   ├── 📄 OpportunityPipelineChart.vue    # Opportunity pipeline visualization
│       │   └── 📄 ProductPerformanceChart.vue     # Product performance analytics
│       └── 📄 index.ts                            # Principal components barrel export
├── 📁 composables/            # Vue 3 composition functions
│   ├── 📄 usePrincipalAnalytics.ts  # Principal analytics data and calculations
│   ├── 📄 usePrincipalFilter.ts     # Principal filtering and search logic
│   └── 📄 usePrincipalTimeline.ts   # Principal timeline data processing
├── 📁 config/                 # Application configuration
│   ├── 📄 supabaseClient.ts         # Supabase client configuration and initialization
│   └── 📄 supabaseClient.backup.ts # Backup Supabase client configuration
├── 📁 design-system/          # Comprehensive design system architecture
│   ├── 📄 README.md                 # Design system documentation
│   ├── 📄 index.ts                  # Design system barrel export
│   ├── 📁 components/               # Design system components
│   │   ├── 📄 ThemeToggle.vue       # Light/dark theme toggle component
│   │   └── 📄 index.ts              # Components barrel export
│   └── 📁 composables/              # Design system composables
│       ├── 📄 index.ts              # Composables barrel export
│       ├── 📄 useIcons.ts           # Icon management composable
│       └── 📄 useTheme.ts           # Theme management composable
├── 📁 lib/                    # Shared utility libraries
│   └── 📄 supabase.ts              # Legacy Supabase utilities (deprecated)
├── 📁 router/                 # Vue Router configuration
│   └── 📄 index.ts                  # Route definitions and navigation guards
├── 📁 services/               # API service layer with domain separation
│   ├── 📄 contactAnalyticsApi.ts    # Contact analytics and reporting API
│   ├── 📄 contactsApi.ts            # Contact CRUD operations API
│   ├── 📄 interactionsApi.ts        # Interaction management API
│   ├── 📄 opportunitiesApi.ts       # Opportunity management API
│   ├── 📄 opportunityNaming.ts      # Opportunity auto-naming service
│   ├── 📄 organizationsApi.ts       # Organization management API
│   ├── 📄 principalActivityApi.ts   # Principal activity tracking API
│   └── 📄 productsApi.ts            # Product catalog API
├── 📁 stores/                 # Pinia state management stores
│   ├── 📄 contactStore.ts           # Contact entity state management
│   ├── 📄 dashboardStore.ts         # Dashboard analytics and KPI state
│   ├── 📄 formStore.ts              # Form state and validation management
│   ├── 📄 formStore.backup.ts      # Backup form store configuration
│   ├── 📄 interactionStore.ts       # Interaction entity state management
│   ├── 📄 opportunityStore.ts       # Opportunity pipeline state management
│   ├── 📄 organizationStore.ts      # Organization entity state management
│   ├── 📄 principalActivityStore.ts # Principal activity tracking state
│   ├── 📄 principalStore.ts         # Principal entity state management
│   └── 📄 productStore.ts           # Product catalog state management
├── 📁 tests/                  # Internal unit tests
│   └── 📄 stores-integration-test.ts # Store integration testing
├── 📁 types/                  # TypeScript type definitions
│   ├── 📄 contacts.ts               # Contact entity type definitions
│   ├── 📄 database.types.ts         # Supabase database schema types
│   ├── 📄 interactionForm.ts        # Interaction form type definitions
│   ├── 📄 interactions.ts           # Interaction entity type definitions
│   ├── 📄 opportunities.ts          # Opportunity entity type definitions
│   ├── 📄 opportunityForm.ts        # Opportunity form type definitions
│   ├── 📄 organization-contacts.ts  # Organization-contact relationship types
│   ├── 📄 organizations.ts          # Organization entity type definitions
│   ├── 📄 principal.ts              # Principal entity type definitions
│   └── 📄 products.ts               # Product catalog type definitions
├── 📁 utils/                  # Utility functions and helpers
│   └── 📄 productionMonitoring.ts   # Production monitoring and analytics
├── 📁 validation/             # Form validation schemas
│   └── 📄 interactionSchemas.ts     # Interaction form validation schemas
└── 📁 views/                  # Route-level view components
    ├── 📄 DashboardView.vue         # Main dashboard overview
    ├── 📁 contacts/                 # Contact management views
    │   ├── 📄 ContactCreateView.vue # Contact creation form view
    │   ├── 📄 ContactDetailView.vue # Contact detail display view
    │   ├── 📄 ContactEditView.vue   # Contact editing form view
    │   └── 📄 ContactsListView.vue  # Contact list with search and filtering
    ├── 📁 interactions/             # Interaction management views
    │   ├── 📄 InteractionCreateView.vue # Interaction creation form view
    │   ├── 📄 InteractionDetailView.vue # Interaction detail display view
    │   ├── 📄 InteractionEditView.vue   # Interaction editing form view
    │   └── 📄 InteractionsListView.vue  # Interaction list with filtering
    ├── 📁 opportunities/            # Sales opportunity management views
    │   ├── 📄 OpportunitiesListView.vue # Opportunity list with KPI dashboard
    │   ├── 📄 OpportunityCreateView.vue # 3-step opportunity creation wizard
    │   ├── 📄 OpportunityDetailView.vue # Opportunity detail with actions
    │   └── 📄 OpportunityEditView.vue   # Opportunity editing form
    ├── 📁 organizations/            # Organization management views
    │   ├── 📄 OrganizationCreateView.vue # Organization creation form view
    │   ├── 📄 OrganizationDetailView.vue # Organization detail with relationships
    │   ├── 📄 OrganizationEditView.vue   # Organization editing form view
    │   └── 📄 OrganizationsListView.vue  # Organization list with search
    └── 📁 principals/               # Principal activity management views
        ├── 📄 PrincipalAnalyticsView.vue    # Principal analytics dashboard
        ├── 📄 PrincipalDashboardView.vue    # Principal overview dashboard
        ├── 📄 PrincipalDetailView.vue       # Principal detail with activity
        ├── 📄 PrincipalDistributorsView.vue # Principal distributor relationships
        ├── 📄 PrincipalProductsView.vue     # Principal product associations
        └── 📄 PrincipalsListView.vue        # Principal list with filtering
```

### 📁 Public Assets (`/public`)
```
📁 public/
├── 📄 favicon.ico             # Application favicon (ICO format)
├── 📄 favicon.svg             # Application favicon (SVG format)
├── 📄 manifest.json           # PWA manifest for mobile installation
├── 📄 sw.js                   # Service worker for offline functionality
└── 📁 icons/                  # PWA icon assets
    ├── 📄 icon-72x72.png       # PWA icon for smaller displays
    └── 📄 icon-144x144.png     # PWA icon for larger displays
```

### 📁 Build Output (`/dist`)
```
📁 dist/                       # Production build output (generated)
└── 📁 assets/                 # Compiled and optimized static assets
```

### 📁 Testing Suite (`/tests`)
```
📁 tests/
├── 📄 INTERACTION_DATABASE_TEST_REPORT.md    # Interaction system test results
├── 📄 OPPORTUNITY_TEST_COVERAGE_REPORT.md    # Opportunity management test coverage
├── 📄 contact-form-basic.spec.ts             # Basic contact form testing
├── 📄 contact-multi-step-form.spec.ts        # Multi-step contact form testing
├── 📄 navigation-validation.spec.ts          # Navigation and routing validation
├── 📄 opportunity-comprehensive-e2e.spec.ts  # Comprehensive opportunity E2E tests
├── 📄 opportunity-integration.spec.ts        # Opportunity system integration tests
├── 📄 opportunity-management.spec.ts         # Opportunity management workflow tests
├── 📄 opportunity-store.spec.ts              # Opportunity store state testing
├── 📄 organization-form.spec.ts              # Organization form testing
├── 📄 principal-activity-e2e.spec.ts         # Principal activity E2E testing
├── 📄 ui-healing.spec.ts                     # UI component healing validation
├── 📁 accessibility/                         # WCAG 2.1 AA compliance testing
│   ├── 📄 ENHANCED_INTERACTION_ACCESSIBILITY_REPORT.md # Accessibility test results
│   ├── 📄 enhanced-interaction-accessibility.spec.ts  # Enhanced accessibility tests
│   ├── 📄 interaction-accessibility.spec.ts          # Interaction accessibility tests
│   └── 📄 opportunity-accessibility.spec.ts          # Opportunity accessibility tests
├── 📁 components/                            # Component-level testing
│   ├── 📄 opportunity-form-components.spec.ts # Opportunity form component tests
│   └── 📄 segment-selector.spec.ts           # Segment selector component tests
├── 📁 helpers/                               # Test helper utilities
│   ├── 📄 opportunity-test-helpers.ts        # Opportunity testing utilities
│   └── 📄 organization-form-helpers.ts      # Organization form test helpers
├── 📁 integration/                           # Integration testing suite
│   ├── 📄 INTERACTION_INTEGRATION_REPORT.md # Integration test results
│   ├── 📄 basic-integration-validation.spec.ts # Basic integration validation
│   └── 📄 interaction-integration.spec.ts   # Interaction system integration
├── 📁 performance/                           # Performance and load testing
│   ├── 📄 COMPREHENSIVE_PERFORMANCE_ANALYSIS_REPORT.md # Performance analysis
│   ├── 📄 api-performance-benchmark.spec.ts # API performance benchmarking
│   ├── 📄 interaction-mobile-performance.spec.ts # Mobile performance testing
│   ├── 📄 interaction-system-performance-test.spec.ts # System performance tests
│   ├── 📄 load-testing.spec.ts              # Load testing scenarios
│   └── 📄 opportunity-performance.spec.ts   # Opportunity performance testing
└── 📁 unit/                                  # Unit testing with Vitest
    ├── 📄 opportunity-naming.spec.ts         # Opportunity auto-naming unit tests
    ├── 📄 principal-activity-api.spec.ts    # Principal activity API unit tests
    └── 📄 principal-activity-store.spec.ts  # Principal activity store unit tests
```

### 📁 Database (`/sql`)
```
📁 sql/
├── 📄 README.md                              # Database setup and migration instructions
├── 📄 01_initial_schema.sql                  # Initial database schema definition
├── 📄 02_rls_policies.sql                    # Row Level Security policies
├── 📄 03_indexes.sql                         # Database indexes for performance
├── 📄 04_contacts_schema.sql                 # Contact entity schema
├── 📄 05_contacts_rls.sql                    # Contact Row Level Security
├── 📄 10_organizations_schema.sql            # Organization entity schema
├── 📄 14_organizations_rls.sql               # Organization Row Level Security
├── 📄 30_opportunities_schema.sql            # Opportunity pipeline schema
├── 📄 32_interactions_schema.sql             # Interaction tracking schema
├── 📄 33_interactions_rls_policies.sql       # Interaction security policies
├── 📄 36_principal_activity_schema.sql       # Principal activity tracking schema
├── 📁 deployment/                            # Production deployment scripts
├── 📁 migrations/                            # Incremental database migrations
│   ├── 📄 001_add_email_column.sql           # Email column migration
│   └── 📄 20250131_001_add_principal_distributor_flags.sql # Principal flags
├── 📁 queries/                               # Reference and maintenance queries
│   ├── 📄 analytics.sql                      # Analytics and reporting queries
│   ├── 📄 maintenance.sql                    # Database maintenance queries
│   └── 📄 organization_form_queries.sql     # Organization form queries
└── 📁 validation/                            # Database validation scripts
    ├── 📄 organization_enhancement_testing.sql # Organization validation tests
    └── 📄 rls_policy_validation.sql         # RLS policy validation
```

### 📁 Documentation (`/docs`)
```
📁 docs/
├── 📄 PROJECT_STRUCTURE_OVERVIEW.md         # This comprehensive structure guide
├── 📄 mcp-tool-guide.md                     # MCP (Model Context Protocol) tools documentation
├── 📁 architecture/                         # Architecture documentation
│   ├── 📄 README.md                         # Architecture overview
│   ├── 📁 adrs/                             # Architecture Decision Records (15 ADRs)
│   ├── 📁 c4-model/                         # C4 architecture diagrams
│   ├── 📁 data/                             # Data architecture documentation
│   └── 📁 security/                         # Security architecture documentation
├── 📁 checklists/                           # Implementation and migration checklists
├── 📁 deployment/                           # Deployment guides and procedures
├── 📁 maintenance/                          # Maintenance and troubleshooting guides
├── 📁 misc/                                 # Miscellaneous documentation
├── 📁 onboarding/                           # Developer onboarding documentation
├── 📁 pages/                                # Feature-specific documentation (6 major features)
├── 📁 technical/                            # Technical implementation documentation
├── 📁 user-guide/                           # End-user documentation
└── 📁 workflows/                            # Development workflow documentation
```

## Backend

This application uses **Supabase** as a Backend-as-a-Service (BaaS) platform, providing a comprehensive PostgreSQL database with real-time capabilities, authentication, Row Level Security (RLS), and auto-generated APIs. The backend logic is implemented through SQL schemas, database functions, triggers, and RLS policies rather than traditional server-side application code.

### 📁 Database Schema (`/sql`)

The `/sql` directory contains all database schema definitions, migrations, and database-level business logic that runs on Supabase's PostgreSQL infrastructure.

```
📁 sql/
├── 📄 README.md                              # Database setup and migration instructions
├── 📄 01_initial_schema.sql                  # Initial user_submissions table schema
├── 📄 02_rls_policies.sql                    # Initial Row Level Security policies
├── 📄 03_indexes.sql                         # Performance optimization indexes
├── 📄 04_contacts_schema.sql                 # Contact entity schema with validations
├── 📄 05_contacts_rls.sql                    # Contact entity Row Level Security
├── 📄 06_contacts_indexes.sql                # Contact entity performance indexes
├── 📄 07_dashboard_analytics_schema.sql      # Dashboard analytics schema
├── 📄 08_dashboard_rls.sql                   # Dashboard analytics security policies
├── 📄 09_dashboard_indexes.sql               # Dashboard analytics indexes
├── 📄 10_organizations_schema.sql            # Organization entity schema with enums
├── 📄 11_organization_interactions_schema.sql # Organization interaction tracking
├── 📄 12_organization_analytics_schema.sql   # Organization analytics views
├── 📄 13_contacts_organizations_migration.sql # Contact-organization relationships
├── 📄 14_organizations_rls.sql               # Organization Row Level Security policies
├── 📄 15_organizations_indexes.sql           # Organization performance indexes
├── 📄 16_organizations_validation_tests.sql  # Organization schema validation tests
├── 📄 17_contacts_enhanced_schema.sql        # Enhanced contact entity schema
├── 📄 17_development_anonymous_access.sql    # Development environment anonymous access
├── 📄 18_priority_system_update.sql          # Priority system enhancements
├── 📄 19_organization_status_enum_update.sql # Organization status enumeration updates
├── 📄 20_principal_distributor_constraints.sql # Principal-distributor relationship constraints
├── 📄 21_organization_contacts_relationship.sql # Organization-contact relationship tables
├── 📄 22_organization_redesign_validation.sql # Organization redesign validation
├── 📄 23_remove_authority_influence_fields.sql # Cleanup deprecated fields
├── 📄 30_opportunities_schema.sql            # Sales opportunity pipeline schema
├── 📄 31_opportunities_views.sql             # Opportunity analytics views and aggregations
├── 📄 32_interactions_schema.sql             # Customer interaction tracking schema
├── 📄 33_interactions_rls_policies.sql       # Interaction security policies
├── 📄 33_interactions_rls_test_verification.sql # RLS policy testing verification
├── 📄 34_interactions_indexes.sql            # Interaction performance indexes
├── 📄 34_interactions_indexes_performance_analysis.sql # Index performance analysis
├── 📄 35_interactions_verification.sql       # Interaction schema verification tests
├── 📄 36_principal_activity_schema.sql       # Principal activity tracking schema
├── 📄 ORGANIZATIONS_STAGE1_README.md         # Organization schema documentation
├── 📄 ORGANIZATION_REDESIGN_MIGRATION_GUIDE.md # Organization migration guide
├── 📄 README.md                              # Database documentation overview
├── 📄 SECURITY_REMEDIATION_PLAN.sql          # Security vulnerability remediation
├── 📄 SECURITY_VULNERABILITY_TESTS.sql       # Security testing procedures
├── 📁 deployment/                            # Production deployment scripts
│   ├── 📄 migration_performance_monitor.sql  # Migration performance monitoring
│   ├── 📄 production_migration_verification.sql # Production migration validation
│   └── 📄 rollback_procedures.sql           # Database rollback procedures
├── 📁 migrations/                            # Incremental database migrations
│   ├── 📄 001_add_email_column.sql           # Email column addition migration
│   ├── 📄 20250131_001_add_principal_distributor_flags.sql # Principal distributor flags
│   ├── 📄 20250803_add_analytics_tracking.sql # Analytics tracking implementation
│   └── 📄 20250803_add_analytics_tracking_optimized.sql # Optimized analytics tracking
├── 📁 queries/                               # Reference and maintenance queries
│   ├── 📄 analytics.sql                      # Analytics and reporting queries
│   ├── 📄 maintenance.sql                    # Database maintenance procedures
│   └── 📄 organization_form_queries.sql     # Organization form support queries
└── 📁 validation/                            # Database validation and testing
    ├── 📄 organization_enhancement_testing.sql # Organization enhancement validation
    └── 📄 rls_policy_validation.sql         # Row Level Security policy validation
```

### 📁 Frontend API Service Layer (`/src/services`)

The frontend communicates with Supabase through a comprehensive API service layer that abstracts database operations and provides domain-specific business logic.

```
📁 src/services/
├── 📄 contactAnalyticsApi.ts    # Contact analytics and reporting API layer
├── 📄 contactsApi.ts            # Contact CRUD operations with Supabase integration
├── 📄 interactionsApi.ts        # Interaction management API with validation
├── 📄 opportunitiesApi.ts       # Opportunity pipeline management API
├── 📄 opportunityNaming.ts      # Opportunity auto-naming business logic service
├── 📄 organizationsApi.ts       # Organization management API with relationships
├── 📄 principalActivityApi.ts   # Principal activity tracking API
└── 📄 productsApi.ts            # Product catalog management API
```

### 📁 Supabase Client Configuration (`/src/config`)

Supabase client configuration and connection management for secure database access.

```
📁 src/config/
├── 📄 supabaseClient.ts         # Primary Supabase client configuration
└── 📄 supabaseClient.backup.ts # Backup Supabase client configuration
```

### 📁 Type Safety Integration (`/src/types`)

TypeScript type definitions that map directly to Supabase database schemas, ensuring type safety across the entire application.

```
📁 src/types/
├── 📄 database.types.ts         # Auto-generated Supabase database schema types
├── 📄 contacts.ts               # Contact entity type definitions and enums
├── 📄 interactions.ts           # Interaction entity type definitions
├── 📄 opportunities.ts          # Opportunity pipeline type definitions
├── 📄 organizations.ts          # Organization entity type definitions
├── 📄 principal.ts              # Principal entity type definitions
└── 📄 products.ts               # Product catalog type definitions
```

## Backend Architecture Patterns

### Database-First Architecture
- **Schema-Driven Development**: Database schema defines the application's data model and business rules
- **PostgreSQL Functions**: Complex business logic implemented as database functions
- **Triggers and Constraints**: Data integrity enforced at the database level
- **View-Based Analytics**: Pre-computed analytics through PostgreSQL views

### Row Level Security (RLS)
- **User-Based Access Control**: RLS policies control data access at the row level
- **Secure Multi-Tenancy**: Data isolation through policy-based security
- **Authentication Integration**: Supabase Auth seamlessly integrates with RLS policies
- **Audit Trail**: Built-in audit capabilities through RLS policy logging

### Real-Time Capabilities
- **WebSocket Integration**: Real-time data synchronization through Supabase subscriptions
- **Live Query Updates**: Frontend components automatically update when database changes
- **Collaborative Features**: Multiple users can work simultaneously with live updates
- **Event-Driven Architecture**: Database changes trigger real-time events

### API Generation
- **Auto-Generated REST API**: Supabase automatically generates REST endpoints from schema
- **GraphQL Support**: Optional GraphQL interface for complex queries
- **Real-Time API**: WebSocket-based real-time API for live data subscriptions
- **Type-Safe Client**: Generated TypeScript types ensure compile-time safety

### Service Layer Pattern
- **Domain Separation**: Services organized by business domain (contacts, opportunities, etc.)
- **Business Logic Abstraction**: Complex operations abstracted into service functions
- **Error Handling**: Centralized error handling and validation
- **Caching Strategy**: Intelligent caching through Pinia stores with Supabase integration

### Migration Management
- **Sequential Migrations**: Numbered SQL files for controlled schema evolution
- **Rollback Procedures**: Comprehensive rollback scripts for safe deployments
- **Performance Monitoring**: Migration performance tracking and optimization
- **Validation Testing**: Automated testing of schema changes and data integrity

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