# Interaction System Architecture Scaffold

## Overview

This document outlines the complete scaffolding for the interaction form/page system, following the established patterns from the opportunity management system. The scaffolding includes component hierarchies, state management structures, API patterns, and integration points.

## Component Architecture

### 1. Core Form Components

#### **InteractionFormWrapper.vue** ✅ CREATED
- **Pattern**: Following `OpportunityFormWrapper.vue` 2-step wizard pattern
- **Features**: 
  - Template-based quick creation with auto-population
  - Step 1: Type & Context (interaction type, organization, opportunity)
  - Step 2: Details & Scheduling (timing, outcome, follow-up)
  - Real-time validation with accessible error handling
  - Auto-save functionality with draft recovery
- **Props**: `isEditing`, `initialData`, `autoSaveInterval`
- **Emits**: `success`, `cancel`, `error`, `draftSaved`, `dataChanged`

#### **InteractionTypeSelect.vue** ✅ CREATED
- **Pattern**: Enhanced select component with icon integration
- **Features**:
  - Quick template grid for common interaction types
  - Full type selection with categorized options
  - Icon integration with real-time descriptions
  - Template-based auto-population
- **Props**: `name`, `label`, `modelValue`, `error`, `required`, `showQuickTemplates`
- **Emits**: `update:modelValue`, `type-selected`

#### **OrganizationLookup.vue** ⚠️ TO CREATE
- **Pattern**: Real-time search with autocomplete
- **Features**:
  - Async search with debouncing
  - Organization selection with related data loading
  - Integration with opportunity and principal lookups
- **Props**: `name`, `label`, `modelValue`, `organizationId`, `required`
- **Emits**: `update:modelValue`, `organization-selected`

#### **OpportunityLookup.vue** ⚠️ TO CREATE
- **Pattern**: Conditional lookup based on organization
- **Features**:
  - Real-time filtering by organization
  - Opportunity context pre-population
  - Stage-based suggestions
- **Props**: `name`, `label`, `modelValue`, `organizationId`, `required`
- **Emits**: `update:modelValue`, `opportunity-selected`

#### **FollowUpScheduler.vue** ⚠️ TO CREATE
- **Pattern**: Conditional form section with smart defaults
- **Features**:
  - Outcome-based follow-up suggestions
  - Date/time picker with business rules
  - Reminder configuration
  - Integration with task creation
- **Props**: `required`, `date`, `notes`, `interactionOutcome`, `autoSuggest`
- **Emits**: `follow-up-configured`

#### **InteractionTemplateSelect.vue** ⚠️ TO CREATE
- **Pattern**: Template selection with preview
- **Features**:
  - Template grid with icons and descriptions
  - Auto-population of form fields
  - Customization options while maintaining template base
- **Props**: `name`, `label`, `modelValue`, `useTemplate`
- **Emits**: `update:modelValue`, `template-selected`

### 2. List and Display Components

#### **InteractionsListView.vue** ✅ CREATED
- **Pattern**: Following `OpportunitiesListView.vue` with KPI integration
- **Features**:
  - KPI cards for interaction metrics
  - Advanced filtering (type, status, follow-up, organization)
  - Quick action dropdown for common interactions
  - Follow-up alerts and overdue notifications
  - Real-time search with debouncing
- **Integration**: InteractionKPICards, InteractionTable components

#### **InteractionTable.vue** ⚠️ TO CREATE
- **Pattern**: Following `OpportunityTable.vue` responsive table design
- **Features**:
  - Sortable columns with status indicators
  - Bulk operations for follow-up management
  - Mobile-optimized card view
  - Follow-up status indicators
- **Props**: `interactions`, `loading`, `totalCount`, pagination props
- **Emits**: `interaction-selected`, `page-changed`, `sort-changed`

#### **InteractionKPICards.vue** ⚠️ TO CREATE
- **Pattern**: Following `OpportunityKPICards.vue` metric display
- **Features**:
  - Total/weekly/monthly interaction counts
  - Follow-up tracking metrics
  - Outcome percentage indicators
  - Type distribution charts
- **Props**: `loading`
- **Emits**: `card-click`

#### **InteractionDetailView.vue** ⚠️ TO CREATE
- **Pattern**: Comprehensive detail page with related data
- **Features**:
  - Full interaction details with timeline
  - Related opportunity and organization context
  - Follow-up action buttons
  - Edit/delete operations
- **Integration**: Organization and opportunity components

### 3. Specialized Components

#### **PrincipalSelect.vue** ⚠️ TO CREATE
- **Pattern**: Organization-filtered selection
- **Features**:
  - Dynamic loading based on organization
  - Principal contact information display
  - Integration with opportunity context
- **Props**: `name`, `label`, `modelValue`, `organizationId`
- **Emits**: `update:modelValue`, `principal-selected`

## State Management Architecture

### **InteractionStore** ✅ CREATED

```typescript
interface InteractionStoreState {
  // Data collections
  interactions: InteractionListView[]
  selectedInteraction: InteractionDetailView | null
  templates: InteractionTemplate[]
  
  // UI state
  loading: boolean
  creating: boolean
  updating: boolean
  deleting: boolean
  error: string | null
  
  // Pagination and filtering
  currentPage: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  
  // KPIs and analytics
  kpis: InteractionKPIs | null
  typeDistribution: { [K in InteractionType]: InteractionListView[] }
  statusDistribution: { [K in InteractionStatus]: number }
  
  // Follow-up tracking
  pendingFollowUps: InteractionListView[]
  overdueFollowUps: InteractionListView[]
  upcomingFollowUps: InteractionListView[]
}
```

#### **Key Actions**:
- **CRUD Operations**: `fetchInteractions`, `createInteraction`, `updateInteraction`, `deleteInteraction`
- **Analytics**: `fetchKPIs`, `fetchFollowUpTracking`
- **Templates**: `fetchTemplates`
- **Utilities**: `clearError`, `resetFilters`, `refresh`

#### **Computed Properties**:
- `recentInteractions` - Last 7 days
- `upcomingInteractions` - Planned interactions
- `getInteractionsByType/Status/Opportunity`

## API Integration Architecture

### **InteractionsApi Service** ✅ CREATED

```typescript
class InteractionsApiService {
  // Core CRUD operations
  async getInteractions(options: InteractionSearchOptions): Promise<ApiResponse<InteractionListView[]>>
  async getInteractionById(id: string): Promise<ApiResponse<InteractionDetailView>>
  async createInteraction(data: InteractionFormData): Promise<ApiResponse<Interaction>>
  async updateInteraction(id: string, updates: Partial<InteractionFormData>): Promise<ApiResponse<Interaction>>
  async deleteInteraction(id: string): Promise<ApiResponse<boolean>>
  
  // Analytics and KPIs
  async getInteractionKPIs(): Promise<ApiResponse<InteractionKPIs>>
  async getFollowUpTracking(): Promise<ApiResponse<FollowUpTrackingResult>>
  
  // Templates and utilities
  async getInteractionTemplates(): Promise<ApiResponse<InteractionTemplate[]>>
  async getInteractionCount(filters: InteractionFilters): Promise<ApiResponse<number>>
}
```

#### **Error Handling Pattern**:
- Consistent `ApiResponse<T>` wrapper
- Fallback to demo data on API failures
- Graceful degradation with user feedback

## Type System Architecture

### **Core Types** ✅ CREATED

#### **Enums**:
- `InteractionType` - 12 types (Phone Call, Email, Meeting, etc.)
- `InteractionStatus` - 4 states (Planned, Completed, Cancelled, Rescheduled)
- `InteractionOutcome` - 8 outcomes (Positive, Negative, Follow-up Needed, etc.)

#### **Interfaces**:
- `Interaction` - Base database interface
- `InteractionListView` - Enhanced list view with calculated fields
- `InteractionDetailView` - Comprehensive detail view with all relations
- `InteractionFormData` - Form submission interface
- `InteractionKPIs` - Dashboard metrics interface

#### **Form Types** ✅ CREATED
- `InteractionFormWrapperData` - Complete form state
- `InteractionContextData` - Contextual creation data
- `InteractionFormErrors` - Validation error handling
- `QuickInteractionAction` - Quick action definitions

#### **Validation Schema**:
```typescript
export const interactionValidationSchema = yup.object({
  type: yup.string().required().oneOf(Object.values(InteractionType)),
  title: yup.string().required().min(3).max(255),
  organization_id: yup.string().required().uuid(),
  interaction_date: yup.string().required(),
  follow_up_date: yup.string().when('follow_up_required', {
    is: true,
    then: schema => schema.required()
  })
  // ... additional validation rules
})
```

## Navigation and Routing Integration

### **Route Structure**:
```
/interactions (List View with KPIs and Filtering)
├── /interactions/new (2-Step Creation Wizard)
├── /interactions/:id (Detail View with Context)
├── /interactions/:id/edit (Edit Form)
└── Contextual creation from:
    ├── /opportunities/:id (Pre-populated opportunity)
    ├── /organizations/:id (Pre-selected organization)
    └── /contacts/:id (Pre-populated principal)
```

### **Quick Action Integration**:
- Quick action dropdown in list view
- Template-based rapid creation
- Context-aware form pre-population
- Mobile-optimized action buttons

## Mobile-First Responsive Design

### **Breakpoint Strategy**:
- **Mobile (< 640px)**: Single column forms, stacked components
- **Tablet (640px - 1024px)**: Optimized form layouts, grid adjustments
- **Desktop (> 1024px)**: Full feature set, side-by-side layouts

### **Component Adaptations**:
- `InteractionTable.vue` - Card view on mobile, table on desktop
- `InteractionFormWrapper.vue` - Single column on mobile, grid on desktop
- `InteractionKPICards.vue` - Responsive grid with metric prioritization

## Integration Points with Existing Systems

### **Opportunity System Integration**:
- **Contextual Creation**: Create interactions from opportunity detail pages
- **Stage Progression**: Interactions influence opportunity stage updates
- **Activity Timeline**: Interactions appear in opportunity activity feeds

### **Organization System Integration**:
- **Contact Context**: Pre-populate organization and principal data
- **Activity History**: Track all interactions per organization
- **Relationship Mapping**: Link interactions to organization hierarchy

### **Dashboard Integration**:
- **KPI Cards**: Interaction metrics in main dashboard
- **Recent Activity**: Latest interactions in activity feed
- **Follow-up Alerts**: Overdue follow-ups in notification center

## Accessibility and Performance

### **WCAG 2.1 AA Compliance**:
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Error message associations
- Focus management in wizards

### **Performance Optimizations**:
- **Lazy Loading**: Components load on demand
- **Virtual Scrolling**: Large interaction lists
- **Debounced Search**: Real-time search with 300ms delay
- **Optimistic Updates**: Immediate UI feedback
- **Caching Strategy**: Store-level caching with TTL

## Testing Strategy

### **Component Testing**:
- Form validation scenarios
- Template selection workflows
- Error handling and recovery
- Accessibility compliance

### **Integration Testing**:
- Store action sequences
- API integration patterns
- Cross-component communication
- Navigation flows

### **E2E Testing**:
- Complete interaction creation workflows
- Filtering and search scenarios
- Mobile responsive behaviors
- Performance benchmarking

## Implementation Roadmap

### **Phase 1: Core Components** (CURRENT)
- ✅ InteractionFormWrapper.vue
- ✅ InteractionTypeSelect.vue
- ✅ InteractionsListView.vue
- ✅ InteractionStore
- ✅ InteractionsApi
- ✅ Type definitions

### **Phase 2: Supporting Components**
- ⚠️ OrganizationLookup.vue
- ⚠️ OpportunityLookup.vue
- ⚠️ FollowUpScheduler.vue
- ⚠️ InteractionTemplateSelect.vue
- ⚠️ PrincipalSelect.vue

### **Phase 3: Display Components**
- ⚠️ InteractionTable.vue
- ⚠️ InteractionKPICards.vue
- ⚠️ InteractionDetailView.vue
- ⚠️ InteractionCreateView.vue
- ⚠️ InteractionEditView.vue

### **Phase 4: Integration & Polish**
- Navigation integration
- Dashboard integration
- Mobile optimization
- Performance tuning
- Accessibility audit

## Shared Logic with Opportunity System

### **Reusable Patterns**:
- Form wizard progression logic
- Validation error handling
- API response patterns
- Store state management
- Responsive design utilities

### **Abstracted Components**:
- Form field components (InputField, SelectField, etc.)
- Loading states and error boundaries
- Pagination components
- Search and filter utilities
- KPI card layouts

This scaffolding provides a comprehensive foundation for the interaction management system, ensuring consistency with existing opportunity patterns while introducing specialized functionality for customer interaction tracking and follow-up management.