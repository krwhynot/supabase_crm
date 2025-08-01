# Opportunity Form & List Implementation Checklist

## Overview
**Target**: Sales Opportunity Management System  
**Architecture**: Vue 3 + TypeScript + Pinia + Supabase  
**Timeline**: 2 weeks (following Vertical Scaling Workflow)  
**Safety Protocol**: MVP Checkpoint Safety Protocol with git checkpoints

---

## Design Intent Summary

The Opportunity Form and List page will serve as the central hub for sales pipeline management, featuring a 7-stage progression system with auto-naming, multi-principal logic, and iPad-optimized layouts. The design follows the established Vue 3 CRM clean lines and blue/gray color scheme with WCAG 2.1 AA accessibility compliance.

## UI Component Hierarchy

### Opportunities List Page (`/opportunities`)
- **DashboardLayout** wrapper with responsive sidebar
- **PageHeader** with search, filters, and "New Opportunity" button
- **KPISummarySection** with 4 metric cards (Total, Active, Avg Probability, Won This Month)
- **OpportunityTable** with sortable columns, stage tags, probability bars, and pagination
- **ActionModals** for delete confirmation and bulk operations

### Create New Opportunity Form (`/opportunities/new`)
- **DashboardLayout** wrapper maintaining navigation consistency
- **OpportunityFormWrapper** with 3 sections: Deal Information, Details, Notes
- **OpportunityNameField** with auto-generate toggle and live preview
- **StageSelect** with 7-stage color-coded dropdown
- **PrincipalMultiSelect** with batch creation preview
- **ProductSelect** with dynamic filtering based on principals

---

## Phase 1: Project Setup & Safety Checkpoints (Day 1)

### 1.1 Create Safety Baseline
- [ ] Create immediate safety checkpoint: `git commit -m "CHECKPOINT: Pre-opportunity-implementation baseline - $(date)"`
- [ ] Tag current stable state: `git tag -a "pre-opportunities-mvp" -m "Stable state before opportunities implementation"`
- [ ] Create working branch: `git checkout -b feature/opportunities-management`
- [ ] Verify build stability: `npm run build && npm run type-check`

### 1.2 Architecture Validation
- [ ] Run pre-task validation script (TypeScript, build, git status)
- [ ] Verify existing component patterns in `src/components/forms/`
- [ ] Confirm DashboardLayout integration patterns from contacts
- [ ] Validate Pinia store patterns from existing stores

---

## Phase 2: Database Schema & Types (Day 1-2)

### 2.1 Database Schema Implementation
- [ ] **SAFETY CHECKPOINT**: `git commit -m "ROLLBACK_POINT: Before database schema changes"`
- [ ] Create `sql/30_opportunities_schema.sql`:
  - Opportunities table with 7-stage enum
  - Products table with name, description, category
  - Product_principals junction table
  - Proper RLS policies and indexes
- [ ] Create `sql/31_opportunities_views.sql`:
  - `opportunity_list_view` with joined data
  - `opportunity_detail_view` with relationships
- [ ] Apply migration in Supabase dashboard
- [ ] Generate TypeScript types: `npx supabase gen types typescript --local > src/types/database.types.ts`
- [ ] **VALIDATION**: Verify migration runs without errors, test RLS policies

### 2.2 Feature-Specific Types
- [ ] Create `src/types/opportunities.ts`:
  - OpportunityStage enum (7 stages)
  - OpportunityContext enum
  - Opportunity interfaces (base, insert, update, list view, detail view)
  - OpportunityFormData interface
  - Yup validation schema
- [ ] Create `src/types/products.ts`:
  - Product interfaces and types
  - Principal-product relationship types
- [ ] **VALIDATION**: `npm run type-check` passes without errors
- [ ] **SAFETY CHECKPOINT**: `git commit -m "feat(opportunities): database schema and type definitions complete"`

---

## Phase 3: Core Services & API Layer (Day 2-3)

### 3.1 API Services
- [ ] Create `src/services/opportunitiesApi.ts`:
  - CRUD operations following `contactsApi.ts` patterns
  - Search and filtering capabilities
  - Batch creation for multiple principals
  - Proper error handling and TypeScript types
- [ ] Create `src/services/productsApi.ts`:
  - Product catalog management
  - Principal-product filtering logic
- [ ] **VALIDATION**: Test API functions in isolation
- [ ] **SAFETY CHECKPOINT**: `git commit -m "feat(opportunities): API services implemented"`

### 3.2 Auto-Naming Service
- [ ] Create `src/services/opportunityNaming.ts`:
  - Auto-name generation logic
  - Format: `[Organization] - [Principal] - [Context] - [Month Year]`
  - Preview generation for multiple principals
  - Manual override handling
- [ ] **VALIDATION**: Test naming logic with various inputs

---

## Phase 4: Store Implementation (Day 3-4)

### 4.1 Pinia Stores
- [ ] **SAFETY CHECKPOINT**: `git commit -m "ROLLBACK_POINT: Before store implementation"`
- [ ] Create `src/stores/opportunityStore.ts`:
  - State management following existing store patterns
  - CRUD operations with proper error handling
  - Search, filter, and pagination logic
  - KPI computed properties (total, active, avg probability, won this month)
  - Batch creation handling
- [ ] Create `src/stores/productStore.ts`:
  - Product catalog state management
  - Principal filtering logic
- [ ] Update `src/stores/organizationStore.ts`:
  - Add principal-specific queries if needed
- [ ] **VALIDATION**: Test stores in isolation, verify reactive updates
- [ ] **SAFETY CHECKPOINT**: `git commit -m "feat(opportunities): Pinia stores implemented with reactive state management"`

---

## Phase 5: Core Components Development (Day 4-6)

### 5.1 Form Components
- [ ] **SAFETY CHECKPOINT**: `git commit -m "ROLLBACK_POINT: Before component implementation"`
- [ ] Create `src/components/opportunities/OpportunityNameField.vue`:
  - Auto-generate toggle with checkbox
  - Live preview of generated names
  - Manual override input field
  - Integration with naming service
- [ ] Create `src/components/opportunities/StageSelect.vue`:
  - 7-stage dropdown with color-coded options
  - Progress indicator styling
  - Visual stage progression
- [ ] Create `src/components/opportunities/PrincipalMultiSelect.vue`:
  - Multi-selection with chips
  - Preview of multiple opportunity names
  - Clear indication of batch creation
- [ ] Create `src/components/opportunities/ProductSelect.vue`:
  - Filtered by selected principals
  - Loading states during filtering
  - Empty state when no products match
- [ ] **VALIDATION**: Test each component individually, verify props/events
- [ ] **SAFETY CHECKPOINT**: `git commit -m "feat(opportunities): Core form components implemented"`

### 5.2 Display Components  
- [ ] Create `src/components/opportunities/OpportunityKPICards.vue`:
  - 4 metric cards with computed values
  - Responsive grid layout for iPad
  - Color-coded metrics
- [ ] Create `src/components/opportunities/StageTag.vue`:
  - Color-coded stage pills
  - Consistent with 7-stage color scheme
- [ ] Create `src/components/opportunities/ProbabilityBar.vue`:
  - Progress bar with percentage display
  - Visual probability indicator
- [ ] Create `src/components/opportunities/OpportunityTable.vue`:
  - Sortable table with all required columns
  - Bulk selection checkboxes
  - Action buttons (edit, delete, more)
  - Pagination controls
- [ ] **VALIDATION**: Visual testing on iPad viewport, accessibility check
- [ ] **SAFETY CHECKPOINT**: `git commit -m "feat(opportunities): Display components implemented with iPad optimization"`

---

## Phase 6: View Components & Form Integration (Day 6-8)

### 6.1 Main Views
- [ ] **SAFETY CHECKPOINT**: `git commit -m "ROLLBACK_POINT: Before view implementation"`
- [ ] Create `src/views/opportunities/OpportunitiesListView.vue`:
  - DashboardLayout integration
  - Header with search, filters, "New Opportunity" button
  - KPI cards section
  - Opportunities table with pagination
  - Loading/error/empty states
- [ ] Create `src/views/opportunities/OpportunityCreateView.vue`:
  - DashboardLayout integration
  - Form header with breadcrumb navigation
  - OpportunityFormWrapper integration
  - Success/error handling
- [ ] Create `src/views/opportunities/OpportunityDetailView.vue`:
  - Individual opportunity display
  - Edit/delete actions
- [ ] Create `src/views/opportunities/OpportunityEditView.vue`:
  - Edit form with pre-populated data
- [ ] **VALIDATION**: Navigate between views, test responsive design
- [ ] **SAFETY CHECKPOINT**: `git commit -m "feat(opportunities): Main view components implemented"`

### 6.2 Form Orchestration
- [ ] Create `src/components/opportunities/OpportunityFormWrapper.vue`:
  - Multi-step form orchestration
  - Auto-naming logic integration
  - Multiple principal handling with preview
  - Validation and submission
  - Success/error feedback
- [ ] **VALIDATION**: Test complete form flow, including multi-principal scenarios
- [ ] **SAFETY CHECKPOINT**: `git commit -m "feat(opportunities): Form orchestration complete with validation"`

---

## Phase 7: Router Integration & Navigation (Day 8-9)

### 7.1 Route Configuration
- [ ] **SAFETY CHECKPOINT**: `git commit -m "ROLLBACK_POINT: Before router changes"`
- [ ] Update `src/router/index.ts`:
  - Add opportunities routes under DashboardLayout
  - `/opportunities` - List view
  - `/opportunities/new` - Create form  
  - `/opportunities/:id` - Detail view
  - `/opportunities/:id/edit` - Edit form
  - Proper lazy loading and meta tags
- [ ] Update `src/components/layout/DashboardLayout.vue`:
  - Add "Opportunities" navigation item with icon
  - Update active state logic
  - Ensure consistent navigation patterns
- [ ] **VALIDATION**: Test navigation between all routes, verify active states
- [ ] **SAFETY CHECKPOINT**: `git commit -m "feat(opportunities): Router integration and navigation complete"`

---

## Phase 8: Integration & Cross-Feature Connectivity (Day 9-10)

### 8.1 Context-Aware Creation
- [ ] Add opportunity creation from Contact detail pages:
  - "Create Opportunity" button on contact pages
  - Pre-populate organization context
  - Pass contact information to form
- [ ] Add opportunity creation from Organization detail pages:
  - "Create Opportunity" button on organization pages
  - Pre-populate organization selection
  - Context-aware form initialization
- [ ] **VALIDATION**: Test contextual opportunity creation from different entry points
- [ ] **SAFETY CHECKPOINT**: `git commit -m "feat(opportunities): Cross-feature integration implemented"`

### 8.2 Data Relationships
- [ ] Ensure proper data relationships:
  - Link opportunities to contacts and organizations
  - Validate principal-product relationships
  - Test referential integrity
- [ ] Implement proper data cleanup:
  - Handle deletions appropriately
  - Maintain data consistency
- [ ] **VALIDATION**: Test data relationships and integrity

---

## Phase 9: Testing & Quality Assurance (Day 10-12)

### 9.1 Functionality Testing
- [ ] **Manual Testing Checklist**:
  - [ ] Create opportunity with single principal
  - [ ] Create opportunity with multiple principals (batch creation)
  - [ ] Auto-naming works correctly with preview
  - [ ] Manual name override functions
  - [ ] Product filtering based on principal selection
  - [ ] Form validation prevents invalid submissions
  - [ ] KPI calculations are accurate
  - [ ] Table sorting and filtering work
  - [ ] Edit and delete operations function
  - [ ] Contextual creation from contacts/organizations

### 9.2 Accessibility & Usability Testing
- [ ] **iPad Viewport Testing**:
  - [ ] Single-column form layout works without scrolling
  - [ ] Touch targets meet 44px minimum
  - [ ] Navigation is touch-friendly
  - [ ] Tables are readable and functional
- [ ] **WCAG 2.1 AA Compliance**:
  - [ ] Proper ARIA attributes and labels
  - [ ] Keyboard navigation works
  - [ ] Screen reader compatibility
  - [ ] Color contrast meets standards
  - [ ] Error messages are accessible
- [ ] **Cross-browser Testing**:
  - [ ] Chrome, Firefox, Safari functionality
  - [ ] Mobile browser compatibility

### 9.3 Performance & Load Testing
- [ ] **Performance Validation**:
  - [ ] Page loads in <3 seconds
  - [ ] Form submissions complete in <2 seconds
  - [ ] List view handles 100+ opportunities smoothly
  - [ ] Database queries are optimized
- [ ] **VALIDATION**: `npm run build && npm run type-check && npm run lint`
- [ ] **SAFETY CHECKPOINT**: `git commit -m "feat(opportunities): Testing and quality assurance complete"`

---

## Phase 10: Documentation & Deployment (Day 12-14)

### 10.1 Code Documentation
- [ ] Add JSDoc comments to all components and functions
- [ ] Update `CLAUDE.md` with opportunity management section:
  - Component architecture overview
  - Database schema documentation
  - API endpoint documentation
  - Usage patterns and examples
- [ ] Create component documentation with usage examples

### 10.2 User Documentation
- [ ] Create `docs/user-guide/Opportunity_Management_Guide.md`:
  - How to create opportunities
  - Understanding the 7-stage pipeline
  - Using auto-naming features
  - Managing multiple principals
  - KPI interpretation
- [ ] Update main user documentation with opportunity workflows

### 10.3 Final Validation & Deployment
- [ ] **Pre-deployment Checklist**:
  - [ ] All TypeScript checks pass: `npm run type-check`
  - [ ] Production build succeeds: `npm run build`
  - [ ] Linting passes: `npm run lint`
  - [ ] No console errors in development: `npm run dev`
  - [ ] All manual test cases pass
  - [ ] Accessibility requirements met
  - [ ] Performance benchmarks satisfied

### 10.4 Production Deployment
- [ ] **FINAL SAFETY CHECKPOINT**: `git commit -m "COMPLETE: Opportunity management MVP implementation - $(date)"`
- [ ] Create production deployment tag: `git tag -a "opportunity-mvp-v1.0" -m "Opportunity Management MVP v1.0 Complete"`
- [ ] Merge to main branch with proper commit message
- [ ] Deploy to production environment
- [ ] Monitor deployment for issues
- [ ] Verify all functionality in production

---

## Emergency Rollback Protocol

**If critical issues arise during implementation:**

1. **Identify rollback target**: `git log --oneline -10 | grep -E "(CHECKPOINT|ROLLBACK_POINT)"`
2. **Execute rollback**: `git reset --hard [commit-hash]`
3. **Clean working directory**: `git clean -fd`
4. **Verify rollback state**: `npm run type-check && npm run build && npm run dev`
5. **Document issue**: Create issue in project tracker with details

**Rollback triggers:**
- TypeScript errors persisting >30 minutes
- Build failures affecting existing functionality
- Breaking changes to user submission flow
- Performance degradation >50% in existing features

---

## Success Metrics

- [ ] **Technical**: All builds pass, no TypeScript errors, performance maintained
- [ ] **Functional**: Complete 7-stage pipeline management with auto-naming
- [ ] **UX**: iPad-optimized interface with accessibility compliance
- [ ] **Integration**: Seamless integration with existing contact/organization workflows
- [ ] **Business**: Sales team can efficiently manage pipeline with KPI visibility

**Timeline**: 14 days with safety checkpoints every 1-2 days
**Architecture**: Maintains Vue 3 + TypeScript + Pinia patterns
**Quality**: WCAG 2.1 AA compliant with comprehensive testing

---

## Architecture Notes

### Component Patterns to Follow
- **Vue 3 Composition API**: Use `<script setup>` syntax throughout
- **TypeScript Interfaces**: Define proper props and emits interfaces
- **Form Components**: Follow existing `InputField.vue` and `SelectField.vue` patterns
- **State Management**: Use Pinia stores with reactive state and computed properties
- **Styling**: Tailwind utilities with computed classes for conditional styling

### Integration Points
- **DashboardLayout**: Maintain consistent navigation and layout patterns
- **Existing Stores**: Integrate with contact and organization stores where appropriate
- **Router**: Follow lazy loading patterns and proper meta configuration
- **API Layer**: Use consistent error handling and TypeScript types

### Performance Considerations
- **Lazy Loading**: All route components should be lazy-loaded
- **Database Queries**: Optimize with proper indexes and joins
- **Component Optimization**: Use computed properties and avoid unnecessary re-renders
- **Bundle Size**: Monitor bundle size impact of new components

This checklist ensures systematic implementation while maintaining the established Vue 3 CRM architecture and ensuring iPad compatibility with comprehensive testing and quality assurance.