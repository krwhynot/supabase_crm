# Component Architecture - CRM System

## Overview

The Component Architecture diagram shows the internal structure of the Vue 3 Single Page Application container, breaking it down into major components and their relationships. This represents **Level 3** of the C4 Model hierarchy.

## Application Component Architecture

```mermaid
C4Component
    title Component Diagram for CRM Single Page Application

    Container_Boundary(spa, "Single Page Application") {
        
        Component_Boundary(routing, "Routing & Navigation") {
            Component(vue_router, "Vue Router", "Vue Router 4", "Client-side routing and navigation management")
            Component(dashboard_layout, "Dashboard Layout", "Vue Component", "Master layout with responsive sidebar navigation")
            Component(navigation_guard, "Navigation Guards", "TypeScript", "Route validation, authentication, and access control")
        }

        Component_Boundary(business_domains, "Business Domain Components") {
            Component(contact_mgmt, "Contact Management", "Vue Components", "Contact CRUD operations, list views, and relationship tracking")
            Component(org_mgmt, "Organization Management", "Vue Components", "Organization profiles, hierarchies, and business data")
            Component(opportunity_mgmt, "Opportunity Management", "Vue Components", "Sales pipeline, KPI tracking, and batch operations")
            Component(interaction_mgmt, "Interaction Management", "Vue Components", "Customer touchpoint tracking and activity logging")
            Component(principal_mgmt, "Principal Activity Management", "Vue Components", "Principal analytics, performance tracking, and reporting")
        }

        Component_Boundary(shared_components, "Shared UI Components") {
            Component(form_components, "Form Components", "Vue Components", "Reusable form fields with validation and accessibility")
            Component(data_components, "Data Components", "Vue Components", "Tables, lists, cards, and data visualization")
            Component(feedback_components, "Feedback Components", "Vue Components", "Alerts, toasts, modals, and user feedback")
            Component(navigation_components, "Navigation Components", "Vue Components", "Breadcrumbs, tabs, pagination, and navigation aids")
        }

        Component_Boundary(state_management, "State Management Layer") {
            Component(contact_store, "Contact Store", "Pinia Store", "Contact state management and API coordination")
            Component(org_store, "Organization Store", "Pinia Store", "Organization data and relationship management")
            Component(opportunity_store, "Opportunity Store", "Pinia Store", "Sales pipeline state and KPI calculations")
            Component(interaction_store, "Interaction Store", "Pinia Store", "Interaction data and activity tracking")
            Component(principal_store, "Principal Activity Store", "Pinia Store", "Principal analytics and performance data")
            Component(dashboard_store, "Dashboard Store", "Pinia Store", "Dashboard metrics and aggregated data")
        }

        Component_Boundary(api_layer, "API Service Layer") {
            Component(contacts_api, "Contacts API", "TypeScript Service", "Contact CRUD operations and relationship management")
            Component(orgs_api, "Organizations API", "TypeScript Service", "Organization management and hierarchy operations")
            Component(opportunities_api, "Opportunities API", "TypeScript Service", "Sales pipeline management and batch operations")
            Component(interactions_api, "Interactions API", "TypeScript Service", "Customer interaction logging and retrieval")
            Component(principal_api, "Principal Activity API", "TypeScript Service", "Principal analytics and performance data")
            Component(products_api, "Products API", "TypeScript Service", "Product catalog and principal relationships")
        }

        Component_Boundary(utilities, "Utilities & Infrastructure") {
            Component(validation, "Form Validation", "Yup Schemas", "Schema-based form validation with TypeScript types")
            Component(composables, "Vue Composables", "Composition API", "Reusable logic for common functionality")
            Component(utils, "Utility Functions", "TypeScript", "Helper functions for data manipulation and formatting")
            Component(types, "Type Definitions", "TypeScript", "Application-wide type definitions and interfaces")
        }
    }

    ' External dependencies
    System_Ext(supabase_api, "Supabase API", "Backend REST API")
    System_Ext(supabase_realtime, "Supabase Realtime", "WebSocket API")

    ' Routing relationships
    Rel(vue_router, dashboard_layout, "Renders components in", "Component Resolution")
    Rel(navigation_guard, vue_router, "Validates routes", "Route Guards")

    ' Business domain to layout
    Rel(contact_mgmt, dashboard_layout, "Rendered within", "Vue Component Tree")
    Rel(org_mgmt, dashboard_layout, "Rendered within", "Vue Component Tree")
    Rel(opportunity_mgmt, dashboard_layout, "Rendered within", "Vue Component Tree")
    Rel(interaction_mgmt, dashboard_layout, "Rendered within", "Vue Component Tree")
    Rel(principal_mgmt, dashboard_layout, "Rendered within", "Vue Component Tree")

    ' Business components use shared components
    Rel(contact_mgmt, form_components, "Uses", "Component Composition")
    Rel(contact_mgmt, data_components, "Uses", "Component Composition")
    Rel(org_mgmt, form_components, "Uses", "Component Composition")
    Rel(org_mgmt, data_components, "Uses", "Component Composition")
    Rel(opportunity_mgmt, form_components, "Uses", "Component Composition")
    Rel(opportunity_mgmt, data_components, "Uses", "Component Composition")
    Rel(interaction_mgmt, form_components, "Uses", "Component Composition")
    Rel(principal_mgmt, data_components, "Uses", "Component Composition")

    ' Components to stores
    Rel(contact_mgmt, contact_store, "Manages state via", "Pinia Composition API")
    Rel(org_mgmt, org_store, "Manages state via", "Pinia Composition API")
    Rel(opportunity_mgmt, opportunity_store, "Manages state via", "Pinia Composition API")
    Rel(interaction_mgmt, interaction_store, "Manages state via", "Pinia Composition API")
    Rel(principal_mgmt, principal_store, "Manages state via", "Pinia Composition API")
    Rel(dashboard_layout, dashboard_store, "Gets metrics from", "Pinia Composition API")

    ' Stores to API services
    Rel(contact_store, contacts_api, "Calls", "Service Functions")
    Rel(org_store, orgs_api, "Calls", "Service Functions")
    Rel(opportunity_store, opportunities_api, "Calls", "Service Functions")
    Rel(interaction_store, interactions_api, "Calls", "Service Functions")
    Rel(principal_store, principal_api, "Calls", "Service Functions")
    Rel(opportunity_store, products_api, "Calls", "Service Functions")

    ' API services to backend
    Rel(contacts_api, supabase_api, "HTTP calls", "REST API")
    Rel(orgs_api, supabase_api, "HTTP calls", "REST API")
    Rel(opportunities_api, supabase_api, "HTTP calls", "REST API")
    Rel(interactions_api, supabase_api, "HTTP calls", "REST API")
    Rel(principal_api, supabase_api, "HTTP calls", "REST API")
    Rel(products_api, supabase_api, "HTTP calls", "REST API")

    ' Realtime subscriptions
    Rel(contact_store, supabase_realtime, "Subscribes to", "WebSocket")
    Rel(org_store, supabase_realtime, "Subscribes to", "WebSocket")
    Rel(opportunity_store, supabase_realtime, "Subscribes to", "WebSocket")
    Rel(interaction_store, supabase_realtime, "Subscribes to", "WebSocket")

    ' Utility usage
    Rel(form_components, validation, "Validates with", "Schema Validation")
    Rel(contact_mgmt, composables, "Uses logic from", "Composition API")
    Rel(org_mgmt, composables, "Uses logic from", "Composition API")
    Rel(api_layer, utils, "Uses helpers from", "Function Calls")
    Rel(business_domains, types, "Uses types from", "TypeScript Imports")

    UpdateElementStyle(business_domains, $bgColor="#1f2937", $fontColor="#ffffff", $borderColor="#3b82f6")
    UpdateElementStyle(state_management, $bgColor="#059669", $fontColor="#ffffff")
    UpdateElementStyle(api_layer, $bgColor="#dc2626", $fontColor="#ffffff")
```

## Component Details

### Routing & Navigation Components

#### Vue Router
- **Purpose**: Client-side routing and navigation management
- **Technology**: Vue Router 4.2+
- **Key Features**:
  - Nested routing with dashboard layout
  - Route-based code splitting
  - Navigation guards for validation
  - Meta-based page titles and descriptions
- **Route Structure**:
  ```typescript
  / (Dashboard Layout)
  ├── '' (Dashboard View)
  ├── contacts/* (Contact Management)
  ├── organizations/* (Organization Management)
  ├── opportunities/* (Opportunity Management)
  ├── interactions/* (Interaction Management)
  └── principals/* (Principal Management)
  ```

#### Dashboard Layout
- **Purpose**: Master layout component with responsive sidebar
- **Technology**: Vue 3 Composition API, Tailwind CSS
- **Key Features**:
  - Responsive sidebar navigation
  - Mobile-first collapsible design
  - Accessibility-compliant navigation
  - Route-aware active states
- **Layout Structure**:
  - Header with user context
  - Collapsible sidebar navigation
  - Main content area with routing
  - Toast notifications area

#### Navigation Guards
- **Purpose**: Route validation and access control
- **Technology**: TypeScript, Vue Router Guards
- **Key Features**:
  - UUID validation for entity routes
  - Principal ID validation
  - Page title management
  - Future authentication checks
- **Guard Types**:
  - `beforeEach`: Route validation and title setting
  - `afterEach`: Analytics and PWA state management

### Business Domain Components

#### Contact Management
- **Views**: List, Detail, Create, Edit
- **Key Components**:
  - `ContactsListView.vue` - Contact list with search and filtering
  - `ContactDetailView.vue` - Individual contact details and actions
  - `ContactCreateView.vue` - New contact creation form
  - `ContactEditView.vue` - Contact editing with validation
- **Features**:
  - Comprehensive contact profiles
  - Organization relationship management
  - Opportunity creation integration
  - Activity history tracking

#### Organization Management
- **Views**: List, Detail, Create, Edit
- **Key Components**:
  - `OrganizationsListView.vue` - Organization list with analytics
  - `OrganizationDetailView.vue` - Organization profile and relationships
  - `OrganizationCreateView.vue` - New organization setup
  - `OrganizationEditView.vue` - Organization data editing
- **Features**:
  - Hierarchical organization structures
  - Contact associations
  - Business intelligence integration
  - Distributor network management

#### Opportunity Management
- **Views**: List, Detail, Create, Edit
- **Key Components**:
  - `OpportunitiesListView.vue` - Pipeline view with KPI cards
  - `OpportunityDetailView.vue` - Opportunity details and progression
  - `OpportunityCreateView.vue` - Multi-step opportunity creation
  - `OpportunityEditView.vue` - Opportunity data editing
- **Features**:
  - 7-stage sales pipeline
  - Auto-naming system
  - Batch creation capabilities
  - KPI dashboard integration

#### Interaction Management
- **Views**: List, Detail, Create, Edit
- **Key Components**:
  - `InteractionsListView.vue` - Activity timeline and filtering
  - `InteractionDetailView.vue` - Interaction details and context
  - `InteractionCreateView.vue` - New interaction logging
  - `InteractionEditView.vue` - Interaction data editing
- **Features**:
  - Multi-channel interaction tracking
  - Contact and organization integration
  - Activity timeline visualization
  - Reporting and analytics

#### Principal Activity Management
- **Views**: List, Dashboard, Detail, Analytics
- **Key Components**:
  - `PrincipalsListView.vue` - Principal overview and management
  - `PrincipalDashboardView.vue` - Analytics and performance metrics
  - `PrincipalDetailView.vue` - Individual principal profiles
  - `PrincipalAnalyticsView.vue` - Advanced analytics and insights
- **Features**:
  - Performance tracking and analytics
  - Product portfolio management
  - Distributor relationship analytics
  - Executive reporting and dashboards

### Shared UI Components

#### Form Components
- **Purpose**: Reusable form elements with validation and accessibility
- **Key Components**:
  - `InputField.vue` - Text input with validation and ARIA support
  - `SelectField.vue` - Dropdown selection with computed classes
  - `TextAreaField.vue` - Multi-line text input
  - `CheckboxField.vue` - Boolean input with custom styling
  - `RadioGroup.vue` - Radio button group with accessibility
- **Features**:
  - v-model support for two-way binding
  - Schema-based validation with Yup
  - WCAG 2.1 AA accessibility compliance
  - Error state management and display

#### Data Components
- **Purpose**: Data display and interaction components
- **Key Components**:
  - `DataTable.vue` - Sortable, filterable data tables
  - `KPICard.vue` - Metric display cards
  - `ListItem.vue` - Consistent list item formatting
  - `CardLayout.vue` - Standard card container
  - `Pagination.vue` - Data pagination controls
- **Features**:
  - Responsive design patterns
  - Loading states and skeletons
  - Empty state handling
  - Accessibility-compliant interactions

#### Feedback Components
- **Purpose**: User feedback and notification components
- **Key Components**:
  - `Toast.vue` - Temporary notification messages
  - `Modal.vue` - Modal dialogs with focus management
  - `Alert.vue` - Contextual alert messages
  - `LoadingSpinner.vue` - Loading indicators
  - `Badge.vue` - Status and label indicators
- **Features**:
  - Focus management for modals
  - Screen reader announcements
  - Customizable styling variants
  - Animation and transition support

#### Navigation Components
- **Purpose**: Navigation and wayfinding components
- **Key Components**:
  - `Breadcrumb.vue` - Hierarchical navigation
  - `TabGroup.vue` - Tabbed interface components
  - `SidebarNav.vue` - Main navigation sidebar
  - `ActionMenu.vue` - Dropdown action menus
- **Features**:
  - Keyboard navigation support
  - Route-aware active states
  - Mobile-responsive design
  - Screen reader navigation support

### State Management Layer (Pinia Stores)

#### Contact Store
- **File**: `src/stores/contactStore.ts`
- **Purpose**: Contact data management and API coordination
- **State Management**:
  - Contact list caching
  - Search and filter state
  - Form state management
  - Real-time updates handling
- **Key Actions**:
  - CRUD operations for contacts
  - Search and filtering
  - Organization relationship management
  - Bulk operations

#### Organization Store
- **File**: `src/stores/organizationStore.ts`
- **Purpose**: Organization data and relationship management
- **State Management**:
  - Organization hierarchy data
  - Contact associations
  - Business intelligence metrics
  - Search and filtering state
- **Key Actions**:
  - Organization CRUD operations
  - Hierarchy management
  - Contact association handling
  - Analytics data aggregation

#### Opportunity Store
- **File**: `src/stores/opportunityStore.ts`
- **Purpose**: Sales pipeline state and KPI calculations
- **State Management**:
  - Pipeline stage tracking
  - KPI metrics calculation
  - Batch operation state
  - Filter and search state
- **Key Actions**:
  - Opportunity CRUD operations
  - Pipeline progression management
  - Batch creation handling
  - KPI calculation and caching

#### Interaction Store
- **File**: `src/stores/interactionStore.ts`
- **Purpose**: Interaction data and activity tracking
- **State Management**:
  - Interaction timeline data
  - Activity categorization
  - Contact and organization context
  - Reporting data aggregation
- **Key Actions**:
  - Interaction logging and retrieval
  - Timeline management
  - Activity categorization
  - Context resolution

#### Principal Activity Store
- **File**: `src/stores/principalActivityStore.ts`
- **Purpose**: Principal analytics and performance data
- **State Management**:
  - Performance metrics
  - Product portfolio data
  - Distributor relationship tracking
  - Analytics dashboard state
- **Key Actions**:
  - Performance data aggregation
  - Product management
  - Distributor analytics
  - Dashboard metric calculation

#### Dashboard Store
- **File**: `src/stores/dashboardStore.ts`
- **Purpose**: Dashboard metrics and aggregated data
- **State Management**:
  - Cross-domain KPI aggregation
  - Dashboard widget state
  - Real-time metric updates
  - User preference management
- **Key Actions**:
  - Metric aggregation across domains
  - Widget state management
  - Real-time data synchronization
  - Dashboard customization

### API Service Layer

#### Contacts API
- **File**: `src/services/contactsApi.ts`
- **Purpose**: Contact CRUD operations and relationship management
- **Key Functions**:
  - `getContacts()` - Retrieve contact list with filtering
  - `getContactById()` - Get individual contact details
  - `createContact()` - Create new contact record
  - `updateContact()` - Update existing contact
  - `deleteContact()` - Soft delete contact record
- **Features**:
  - Type-safe API calls with TypeScript
  - Error handling and retry logic
  - Response data validation
  - Relationship management

#### Organizations API
- **File**: `src/services/organizationsApi.ts`
- **Purpose**: Organization management and hierarchy operations
- **Key Functions**:
  - `getOrganizations()` - Organization list with hierarchy
  - `getOrganizationById()` - Detailed organization data
  - `createOrganization()` - New organization creation
  - `updateOrganization()` - Organization data updates
  - `getOrganizationContacts()` - Associated contacts
- **Features**:
  - Hierarchical data handling
  - Contact association management
  - Business intelligence integration
  - Analytics data aggregation

#### Opportunities API
- **File**: `src/services/opportunitiesApi.ts`
- **Purpose**: Sales pipeline management and batch operations
- **Key Functions**:
  - `getOpportunities()` - Pipeline data with filtering
  - `getOpportunityById()` - Individual opportunity details
  - `createOpportunity()` - Single opportunity creation
  - `createOpportunitiesBatch()` - Batch opportunity creation
  - `updateOpportunityStage()` - Pipeline progression
- **Features**:
  - Batch operation support
  - Auto-naming system integration
  - KPI calculation support
  - Pipeline stage management

#### Interactions API
- **File**: `src/services/interactionsApi.ts`
- **Purpose**: Customer interaction logging and retrieval
- **Key Functions**:
  - `getInteractions()` - Activity timeline retrieval
  - `getInteractionById()` - Detailed interaction data
  - `createInteraction()` - New interaction logging
  - `updateInteraction()` - Interaction data updates
  - `getInteractionsByContact()` - Contact-specific activities
- **Features**:
  - Multi-channel interaction support
  - Context resolution for contacts/organizations
  - Activity categorization
  - Timeline data formatting

#### Principal Activity API
- **File**: `src/services/principalActivityApi.ts`
- **Purpose**: Principal analytics and performance data
- **Key Functions**:
  - `getPrincipalActivities()` - Activity data retrieval
  - `getPrincipalAnalytics()` - Performance metrics
  - `createPrincipalActivity()` - Activity logging
  - `updatePrincipalActivity()` - Activity data updates
  - `getPrincipalKPIs()` - Key performance indicators
- **Features**:
  - Performance metric calculation
  - Analytics data aggregation
  - Dashboard integration support
  - Trend analysis capabilities

#### Products API
- **File**: `src/services/productsApi.ts`
- **Purpose**: Product catalog and principal relationships
- **Key Functions**:
  - `getProducts()` - Product catalog retrieval
  - `getProductById()` - Individual product details
  - `getProductsByPrincipal()` - Principal-specific products
  - `createProduct()` - New product creation
  - `updateProduct()` - Product data updates
- **Features**:
  - Principal relationship management
  - Product categorization
  - Availability and pricing data
  - Integration with opportunity management

### Utilities & Infrastructure

#### Form Validation
- **Technology**: Yup schemas with TypeScript integration
- **Purpose**: Schema-based form validation with type inference
- **Key Features**:
  - Type-safe validation schemas
  - Real-time validation on blur events
  - Accessible error messaging
  - Custom validation rules
- **Schema Examples**:
  - Contact validation schemas
  - Organization validation schemas
  - Opportunity creation validation
  - User input sanitization

#### Vue Composables
- **Technology**: Vue 3 Composition API
- **Purpose**: Reusable logic for common functionality
- **Key Composables**:
  - `useFormValidation.ts` - Form validation logic
  - `useApiState.ts` - API loading and error states
  - `useRealtime.ts` - Supabase realtime integration
  - `usePagination.ts` - Data pagination logic
  - `useSearch.ts` - Search and filtering logic
- **Features**:
  - Reactive state management
  - Lifecycle management
  - Error handling patterns
  - Performance optimization

#### Utility Functions
- **Purpose**: Helper functions for data manipulation and formatting
- **Key Utilities**:
  - Date formatting and manipulation
  - Currency and number formatting
  - String manipulation and validation
  - Data transformation helpers
  - API response normalization
- **Features**:
  - Pure functions for testability
  - TypeScript type safety
  - Performance optimized
  - Consistent across application

#### Type Definitions
- **Purpose**: Application-wide type definitions and interfaces
- **Key Type Files**:
  - `database.types.ts` - Auto-generated from Supabase schema
  - `api.types.ts` - API request/response types
  - `form.types.ts` - Form validation and state types
  - `component.types.ts` - Component prop and emit types
- **Features**:
  - Strict TypeScript typing
  - Auto-generated from schema
  - Consistent naming conventions
  - Interface composition patterns

## Component Communication Patterns

### 1. Parent-Child Communication
- **Props**: Type-safe data passing from parent to child
- **Events**: Custom events with typed payloads
- **Slots**: Content projection with scoped slots
- **Template Refs**: Direct child component access

### 2. Store-Based Communication
- **Pinia Stores**: Centralized state management
- **Reactive State**: Automatic UI updates on state changes
- **Actions**: Coordinated business logic execution
- **Getters**: Computed state derivation

### 3. Event Bus Patterns
- **Custom Events**: Cross-component communication
- **Realtime Events**: Supabase subscription handling
- **PWA Events**: Service worker communication
- **Global Events**: Application-level event handling

### 4. API Integration Patterns
- **Service Layer**: Abstracted API communication
- **Error Handling**: Consistent error management
- **Loading States**: User feedback during operations
- **Cache Management**: Data synchronization and caching

## Performance Optimizations

### Component-Level Optimizations
- **Lazy Loading**: Route-based code splitting
- **Computed Properties**: Cached calculated values
- **v-memo**: Template memoization for large lists
- **Async Components**: Dynamic component loading

### State Management Optimizations
- **Selective Reactivity**: Optimized store subscriptions
- **Data Normalization**: Efficient state structure
- **Batch Updates**: Coordinated state changes
- **Memory Management**: Cleanup on component unmount

### Bundle Optimizations
- **Tree Shaking**: Unused code elimination
- **Code Splitting**: Route and component level splitting
- **Asset Optimization**: Image and font optimization
- **Dependency Management**: Minimal bundle size

---

**Next**: [Code Architecture](./04-code-architecture.md) - Implementation patterns and coding conventions