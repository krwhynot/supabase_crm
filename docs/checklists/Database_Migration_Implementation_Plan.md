# 🚀 Database Migration Implementation Plan
**KitchenPantry CRM - Relationship-Focused Schema Migration**

## Project Analysis Summary



**Technology Stack:**
- Frontend: Vue 3 + TypeScript + Vite + Tailwind CSS
- Backend: Supabase (PostgreSQL + Auth + Real-time)
- Architecture: Atomic Design Pattern (atomic/molecular/organisms components)

**Current Database Structure:**
- Basic user submissions table
- Organizations table with comprehensive fields
- Contacts table with organization relationships
- Dashboard analytics schema
- Row Level Security (RLS) policies implemented

**Current Frontend Structure:**
```
src/
├── components/
│   ├── atomic/          # Basic UI components
│   ├── forms/           # Form components
│   ├── layout/          # Layout components
│   ├── modals/          # Modal dialogs
│   ├── molecular/       # Composite components
│   └── organizations/   # Organization-specific components
├── views/               # Page components
├── stores/              # Pinia state management
├── services/            # API services
└── types/               # TypeScript definitions
```

---

## 🎯 Migration Goals

Transform the current basic CRM into a **relationship-focused, principal-centric system** that:

1. **Eliminates financial metrics** (no revenue, deal values)
2. **Focuses on relationship building** and engagement tracking
3. **Provides principal-centric reporting** while maintaining contact-centric data entry
4. **Implements the complete opportunity → interaction workflow**
5. **Supports multi-principal opportunities** and product associations

---

## 📋 Implementation Phases

### Phase 1: Database Schema Foundation
**Duration:** 2-3 days  
**Confidence Required:** 95%

#### Phase 1A: Core Schema Updates
**Claude Sub-Agent Instructions:**
```
Role: Database Schema Architect
Task: Update core database schema to support relationship-focused CRM
Files to modify: sql/migrations/
```

**Checklist:**
- [ ] **Create new ENUM types**
  - [ ] `opportunity_stage_enum` with stages: 'New Lead', 'Initial Outreach', 'Sample/Visit Offered', 'Awaiting Response', 'Feedback Logged', 'Demo Scheduled', 'Closed - Won', 'Closed - Stalled', 'Closed - No Fit'
  - [ ] `interaction_type_enum` with types: 'Email', 'Phone Call', 'Meeting', 'Demo/sampled', 'Follow-up', 'Note'
  - [ ] `sentiment_enum` with values: 'Positive', 'Neutral', 'Negative'
  - [ ] `advocacy_status_enum` with values: 'Champion', 'Supporter', 'Neutral', 'Skeptic', 'Blocker'

- [ ] **Update organizations table**
  - [ ] Add `is_principal BOOLEAN DEFAULT FALSE`
  - [ ] Add `is_distributor BOOLEAN DEFAULT FALSE`
  - [ ] Remove any financial/revenue columns if they exist
  - [ ] Ensure proper indexing on principal/distributor flags

- [ ] **Create products table**
  ```sql
  CREATE TABLE products (
    product_id BIGSERIAL PRIMARY KEY,
    principal_id BIGINT REFERENCES organizations(organization_id),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
  );
  ```

- [ ] **Update opportunities table**
  - [ ] Remove any financial columns (deal_value, revenue, etc.)
  - [ ] Add `stage opportunity_stage_enum DEFAULT 'New Lead'`
  - [ ] Add `context VARCHAR(100)` (e.g., 'Food Show', 'Cold Call')
  - [ ] Ensure `primary_contact_id` and `organization_id` are properly referenced

#### Phase 1B: Relationship Tables
**Claude Sub-Agent Instructions:**
```
Role: Database Relationship Designer
Task: Create junction tables for many-to-many relationships
Files to modify: sql/migrations/
```

**Checklist:**
- [ ] **Create opportunity_products table**
  ```sql
  CREATE TABLE opportunity_products (
    opportunity_id BIGINT REFERENCES opportunities(opportunity_id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(product_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (opportunity_id, product_id)
  );
  ```

- [ ] **Create opportunity_principals table** (derived from products)
  ```sql
  CREATE TABLE opportunity_principals (
    opportunity_id BIGINT REFERENCES opportunities(opportunity_id) ON DELETE CASCADE,
    principal_id BIGINT REFERENCES organizations(organization_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (opportunity_id, principal_id)
  );
  ```

- [ ] **Create interactions table**
  ```sql
  CREATE TABLE interactions (
    interaction_id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT REFERENCES opportunities(opportunity_id),
    contact_id BIGINT REFERENCES contacts(contact_id),
    interaction_type interaction_type_enum NOT NULL,
    interaction_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    sentiment sentiment_enum DEFAULT 'Neutral',
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
  );
  ```

- [ ] **Update contacts table**
  - [ ] Add `advocacy_status advocacy_status_enum DEFAULT 'Neutral'`
  - [ ] Add `is_key_contact BOOLEAN DEFAULT FALSE`
  - [ ] Ensure proper relationship with organizations

#### Phase 1C: Indexes and Performance
**Claude Sub-Agent Instructions:**
```
Role: Database Performance Optimizer
Task: Create indexes for optimal query performance
Files to modify: sql/migrations/
```

**Checklist:**
- [ ] **Create performance indexes**
  ```sql
  -- Principal/Distributor lookups
  CREATE INDEX idx_organizations_is_principal ON organizations(is_principal) WHERE is_principal = TRUE;
  CREATE INDEX idx_organizations_is_distributor ON organizations(is_distributor) WHERE is_distributor = TRUE;
  
  -- Product lookups
  CREATE INDEX idx_products_principal_id ON products(principal_id);
  CREATE INDEX idx_products_category ON products(category);
  
  -- Opportunity lookups
  CREATE INDEX idx_opportunities_stage ON opportunities(stage);
  CREATE INDEX idx_opportunities_organization_id ON opportunities(organization_id);
  
  -- Interaction lookups
  CREATE INDEX idx_interactions_opportunity_id ON interactions(opportunity_id);
  CREATE INDEX idx_interactions_contact_id ON interactions(contact_id);
  CREATE INDEX idx_interactions_date ON interactions(interaction_date);
  CREATE INDEX idx_interactions_follow_up ON interactions(follow_up_required, follow_up_date) WHERE follow_up_required = TRUE;
  ```

---

### Phase 2: Database Functions and Views
**Duration:** 1-2 days  
**Confidence Required:** 90%

#### Phase 2A: Engagement Scoring Functions
**Claude Sub-Agent Instructions:**
```
Role: Database Function Developer
Task: Create automated engagement scoring and analytics functions
Files to modify: sql/functions/
```

**Checklist:**
- [ ] **Create engagement level function**
  ```sql
  CREATE OR REPLACE FUNCTION calculate_engagement_level(last_interaction_date TIMESTAMPTZ)
  RETURNS TEXT AS $$
  BEGIN
    IF last_interaction_date >= (CURRENT_DATE - INTERVAL '7 days') THEN
      RETURN 'High Engagement';
    ELSIF last_interaction_date >= (CURRENT_DATE - INTERVAL '14 days') THEN
      RETURN 'Medium Engagement';
    ELSIF last_interaction_date >= (CURRENT_DATE - INTERVAL '30 days') THEN
      RETURN 'Low Engagement';
    ELSE
      RETURN 'Inactive';
    END IF;
  END;
  $$ LANGUAGE plpgsql;
  ```

- [ ] **Create principal activity view**
  ```sql
  CREATE VIEW principal_activity_summary AS
  SELECT 
    p.organization_id,
    p.name,
    COUNT(DISTINCT o.opportunity_id) as opportunities_count,
    COUNT(DISTINCT i.interaction_id) as interactions_count,
    COUNT(DISTINCT pr.product_id) as products_count,
    MAX(i.interaction_date) as last_activity_date,
    calculate_engagement_level(MAX(i.interaction_date)) as engagement_level
  FROM organizations p
  LEFT JOIN products pr ON p.organization_id = pr.principal_id
  LEFT JOIN opportunity_products op ON pr.product_id = op.product_id
  LEFT JOIN opportunities o ON op.opportunity_id = o.opportunity_id
  LEFT JOIN interactions i ON o.opportunity_id = i.opportunity_id
  WHERE p.is_principal = TRUE
  GROUP BY p.organization_id, p.name;
  ```

#### Phase 2B: Trigger Functions
**Claude Sub-Agent Instructions:**
```
Role: Database Trigger Developer
Task: Create automated data maintenance triggers
Files to modify: sql/triggers/
```

**Checklist:**
- [ ] **Auto-populate opportunity_principals trigger**
  ```sql
  CREATE OR REPLACE FUNCTION sync_opportunity_principals()
  RETURNS TRIGGER AS $$
  BEGIN
    -- When products are added to opportunity, auto-add their principals
    IF TG_OP = 'INSERT' THEN
      INSERT INTO opportunity_principals (opportunity_id, principal_id)
      SELECT NEW.opportunity_id, p.principal_id
      FROM products p
      WHERE p.product_id = NEW.product_id
      ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  
  CREATE TRIGGER trigger_sync_opportunity_principals
    AFTER INSERT ON opportunity_products
    FOR EACH ROW EXECUTE FUNCTION sync_opportunity_principals();
  ```

- [ ] **Updated_at timestamp triggers**
  ```sql
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  
  -- Apply to all relevant tables
  CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER update_interactions_updated_at BEFORE UPDATE ON interactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  ```

---

### Phase 3: API Layer Updates
**Duration:** 2-3 days  
**Confidence Required:** 85%

#### Phase 3A: TypeScript Type Definitions
**Claude Sub-Agent Instructions:**
```
Role: TypeScript Type Developer
Task: Update TypeScript definitions to match new schema
Files to modify: src/types/
```

**Checklist:**
- [ ] **Update database types** (`src/types/database.ts`)
  ```typescript
  export type OpportunityStage = 
    | 'New Lead'
    | 'Initial Outreach'
    | 'Sample/Visit Offered'
    | 'Awaiting Response'
    | 'Feedback Logged'
    | 'Demo Scheduled'
    | 'Closed - Won'
    | 'Closed - Stalled'
    | 'Closed - No Fit';

  export type InteractionType = 
    | 'Email'
    | 'Phone Call'
    | 'Meeting'
    | 'Demo/sampled'
    | 'Follow-up'
    | 'Note';

  export type Sentiment = 'Positive' | 'Neutral' | 'Negative';
  export type AdvocacyStatus = 'Champion' | 'Supporter' | 'Neutral' | 'Skeptic' | 'Blocker';

  export interface Organization {
    organization_id: number;
    name: string;
    is_principal: boolean;
    is_distributor: boolean;
    // ... other fields
  }

  export interface Product {
    product_id: number;
    principal_id: number;
    name: string;
    category?: string;
    description?: string;
  }

  export interface Opportunity {
    opportunity_id: number;
    name: string;
    organization_id: number;
    primary_contact_id: number;
    stage: OpportunityStage;
    context?: string;
    notes?: string;
  }

  export interface Interaction {
    interaction_id: number;
    opportunity_id: number;
    contact_id: number;
    interaction_type: InteractionType;
    interaction_date: string;
    notes?: string;
    sentiment: Sentiment;
    follow_up_required: boolean;
    follow_up_date?: string;
  }
  ```

#### Phase 3B: Supabase Service Updates
**Claude Sub-Agent Instructions:**
```
Role: API Service Developer
Task: Update Supabase service functions for new schema
Files to modify: src/services/
```

**Checklist:**
- [ ] **Update organizations service** (`src/services/organizationsService.ts`)
  - [ ] Add `getPrincipals()` function
  - [ ] Add `getDistributors()` function
  - [ ] Update create/update functions for new fields

- [ ] **Create products service** (`src/services/productsService.ts`)
  - [ ] `getProductsByPrincipal(principalId: number)`
  - [ ] `createProduct(product: CreateProductData)`
  - [ ] `updateProduct(id: number, updates: UpdateProductData)`

- [ ] **Update opportunities service** (`src/services/opportunitiesService.ts`)
  - [ ] Remove any financial-related functions
  - [ ] Add `getOpportunitiesByPrincipal(principalId: number)`
  - [ ] Update stage management functions
  - [ ] Add product association functions

- [ ] **Create interactions service** (`src/services/interactionsService.ts`)
  - [ ] `createInteraction(interaction: CreateInteractionData)`
  - [ ] `getInteractionsByOpportunity(opportunityId: number)`
  - [ ] `getInteractionsByContact(contactId: number)`
  - [ ] `updateFollowUpStatus(id: number, status: boolean)`

#### Phase 3C: Store Updates (Pinia)
**Claude Sub-Agent Instructions:**
```
Role: State Management Developer
Task: Update Pinia stores for new data structure
Files to modify: src/stores/
```

**Checklist:**
- [ ] **Update organizations store** (`src/stores/organizationsStore.ts`)
  - [ ] Add principal/distributor filtering
  - [ ] Add engagement level calculations
  - [ ] Update CRUD operations

- [ ] **Create products store** (`src/stores/productsStore.ts`)
  - [ ] Product CRUD operations
  - [ ] Principal-product relationships
  - [ ] Category management

- [ ] **Update opportunities store** (`src/stores/opportunitiesStore.ts`)
  - [ ] Remove financial metrics
  - [ ] Add stage management
  - [ ] Add product associations
  - [ ] Add principal filtering

- [ ] **Create interactions store** (`src/stores/interactionsStore.ts`)
  - [ ] Interaction CRUD operations
  - [ ] Follow-up management
  - [ ] Sentiment tracking

---

### Phase 4: Frontend Component Updates
**Duration:** 3-4 days  
**Confidence Required:** 80%

#### Phase 4A: Form Components
**Claude Sub-Agent Instructions:**
```
Role: Vue Component Developer
Task: Update form components for new data structure
Files to modify: src/components/forms/
```

**Checklist:**
- [ ] **Update CreateOrganizationForm**
  - [ ] Add principal/distributor checkboxes
  - [ ] Remove any financial fields
  - [ ] Update validation rules

- [ ] **Update CreateContactForm**
  - [ ] Add advocacy status dropdown
  - [ ] Add key contact checkbox
  - [ ] Update organization selection to show principal status

- [ ] **Create CreateOpportunityForm**
  - [ ] Multi-step form (Basic Info → Principals → Details)
  - [ ] Product selection with principal auto-population
  - [ ] Stage selection dropdown
  - [ ] Context field (Food Show, Cold Call, etc.)

- [ ] **Create CreateInteractionForm**
  - [ ] Interaction type selection
  - [ ] Sentiment selection
  - [ ] Follow-up checkbox and date picker
  - [ ] Notes field with character count

#### Phase 4B: Dashboard Components
**Claude Sub-Agent Instructions:**
```
Role: Dashboard Developer
Task: Create principal-centric dashboard components
Files to modify: src/components/dashboard/
```

**Checklist:**
- [ ] **Create PrincipalDashboard component**
  - [ ] Principal search and filtering
  - [ ] Engagement level gauge charts
  - [ ] Activity metrics (interactions, opportunities, products)
  - [ ] Follow-ups required alerts

- [ ] **Create PrincipalCard component**
  - [ ] Engagement score display
  - [ ] Last activity date
  - [ ] Quick action buttons (Opportunity, Interaction)
  - [ ] Product count and list

- [ ] **Create EngagementGauge component**
  - [ ] Circular progress indicators
  - [ ] Color-coded engagement levels
  - [ ] Percentage calculations

#### Phase 4C: Modal Components
**Claude Sub-Agent Instructions:**
```
Role: Modal Component Developer
Task: Create modal dialogs for quick actions
Files to modify: src/components/modals/
```

**Checklist:**
- [ ] **Create QuickInteractionModal**
  - [ ] Contact selection
  - [ ] Interaction type and notes
  - [ ] Sentiment selection
  - [ ] Follow-up scheduling

- [ ] **Create OpportunityDetailsModal**
  - [ ] Full opportunity information
  - [ ] Associated products and principals
  - [ ] Interaction history
  - [ ] Stage progression timeline

---

### Phase 5: Views and Navigation
**Duration:** 2-3 days  
**Confidence Required:** 85%

#### Phase 5A: Principal Views
**Claude Sub-Agent Instructions:**
```
Role: Vue Page Developer
Task: Create principal-centric views
Files to modify: src/views/
```

**Checklist:**
- [ ] **Create PrincipalsView**
  - [ ] Principal list with search and filtering
  - [ ] Engagement level filtering
  - [ ] Bulk actions (export, follow-up scheduling)

- [ ] **Create PrincipalDetailView**
  - [ ] Complete principal information
  - [ ] Associated products list
  - [ ] Opportunity pipeline
  - [ ] Interaction timeline
  - [ ] Engagement analytics

- [ ] **Update OpportunitiesView**
  - [ ] Remove financial columns
  - [ ] Add stage-based filtering
  - [ ] Add principal filtering
  - [ ] Product association display

#### Phase 5B: Navigation Updates
**Claude Sub-Agent Instructions:**
```
Role: Navigation Developer
Task: Update navigation structure
Files to modify: src/router/, src/components/layout/
```

**Checklist:**
- [ ] **Update router configuration**
  - [ ] Add principal routes
  - [ ] Add interaction routes
  - [ ] Update opportunity routes

- [ ] **Update navigation menu**
  - [ ] Add "Principals" menu item
  - [ ] Update "Opportunities" to show relationship focus
  - [ ] Add "Interactions" menu item
  - [ ] Remove any financial/revenue menu items

---

### Phase 6: Data Migration and Testing
**Duration:** 2-3 days  
**Confidence Required:** 95%

#### Phase 6A: Data Migration Scripts
**Claude Sub-Agent Instructions:**
```
Role: Data Migration Specialist
Task: Create scripts to migrate existing data
Files to modify: sql/migrations/
```

**Checklist:**
- [ ] **Create migration script for existing data**
  - [ ] Identify existing principals in organizations
  - [ ] Create default products for principals
  - [ ] Convert existing opportunities to new structure
  - [ ] Create initial interactions from opportunity history

- [ ] **Data validation scripts**
  - [ ] Verify referential integrity
  - [ ] Check for orphaned records
  - [ ] Validate enum values
  - [ ] Test engagement calculations

#### Phase 6B: Testing and Validation
**Claude Sub-Agent Instructions:**
```
Role: QA Testing Specialist
Task: Create comprehensive tests for new functionality
Files to modify: tests/
```

**Checklist:**
- [ ] **Database tests**
  - [ ] Schema validation tests
  - [ ] Function and trigger tests
  - [ ] Performance tests for complex queries

- [ ] **Frontend component tests**
  - [ ] Form validation tests
  - [ ] Dashboard component tests
  - [ ] Modal interaction tests

- [ ] **Integration tests**
  - [ ] End-to-end user workflows
  - [ ] API endpoint tests
  - [ ] Data consistency tests

---

## 🚨 Critical Success Factors

### Data Integrity Requirements
1. **No data loss** during migration
2. **Referential integrity** maintained at all times
3. **Backup strategy** before any schema changes
4. **Rollback plan** for each phase

### Performance Requirements
1. **Dashboard load time** < 2 seconds
2. **Principal search** < 500ms response time
3. **Engagement calculations** updated in real-time
4. **Mobile responsiveness** maintained

### User Experience Requirements
1. **Intuitive navigation** between contact-centric entry and principal-centric reporting
2. **Clear visual indicators** for engagement levels
3. **Efficient workflows** for common tasks
4. **Consistent design language** throughout

---

## 📊 Success Metrics

### Technical Metrics
- [ ] All database migrations execute without errors
- [ ] All existing functionality preserved
- [ ] New functionality works as specified
- [ ] Performance benchmarks met
- [ ] Test coverage > 80%

### Business Metrics
- [ ] Principal dashboard provides actionable insights
- [ ] Engagement tracking improves relationship management
- [ ] User workflow efficiency improved
- [ ] Data entry time reduced
- [ ] Reporting accuracy increased

---

## 🔄 Rollback Strategy

### Phase-by-Phase Rollback
Each phase includes:
1. **Database backup** before changes
2. **Rollback SQL scripts** for schema changes
3. **Git branch strategy** for code changes
4. **Feature flags** for gradual rollout

### Emergency Procedures
1. **Immediate rollback** triggers
2. **Data recovery** procedures
3. **User communication** plan
4. **Incident response** team contacts

---

## 📝 Implementation Notes

### Development Environment Setup
1. **Local Supabase** instance for testing
2. **Staging environment** for integration testing
3. **Production deployment** strategy
4. **Environment variable** management

### Code Quality Standards
1. **TypeScript strict mode** enabled
2. **ESLint and Prettier** configuration
3. **Vue 3 Composition API** patterns
4. **Atomic design** component structure

### Documentation Requirements
1. **API documentation** updates
2. **Component documentation** with Storybook
3. **Database schema** documentation
4. **User guide** updates

---

This implementation plan provides a comprehensive roadmap for transforming the existing CRM into a relationship-focused, principal-centric system while maintaining data integrity and user experience quality.

