# Database Schema Architecture - PostgreSQL & Type System

## Overview

The Vue 3 CRM project implements a comprehensive PostgreSQL database schema through Supabase with sophisticated entity relationships, type safety, and business logic integration. The design demonstrates enterprise-level database architecture with performance optimization and security-first principles.

## Core Entity Architecture

### Primary Entities

#### Organizations (`organizations`)
Central entity representing companies and businesses with comprehensive metadata:

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status organization_status DEFAULT 'prospect',
  priority organization_priority DEFAULT 'C',
  lead_score INTEGER GENERATED ALWAYS AS (
    CASE priority 
      WHEN 'A' THEN 90
      WHEN 'B' THEN 70  
      WHEN 'C' THEN 50
      WHEN 'D' THEN 30
    END
  ) STORED,
  is_principal BOOLEAN DEFAULT FALSE,
  is_distributor BOOLEAN DEFAULT FALSE,
  website TEXT,
  industry TEXT,
  employee_count INTEGER,
  annual_revenue DECIMAL(15,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Business logic constraints
  CONSTRAINT exclusive_principal_distributor 
    CHECK (NOT (is_principal AND is_distributor))
);
```

**Key Features**:
- **Status progression**: Prospect → Active Customer → Inactive Customer → Other → Principal → Distributor
- **Priority system**: A/B/C/D mapping to lead scores (90/70/50/30)
- **Mutual exclusivity**: Organizations cannot be both Principal and Distributor
- **Soft delete pattern**: Using `deleted_at` timestamp

#### Contacts (`contacts`)
Individual people with detailed contact information:

```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  email TEXT UNIQUE,
  phone TEXT,
  position TEXT,
  department TEXT,
  is_primary_contact BOOLEAN DEFAULT FALSE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Email validation constraint
  CONSTRAINT valid_email CHECK (
    email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
);
```

#### Opportunities (`opportunities`)
Sales pipeline tracking with 7-stage workflow:

```sql
CREATE TYPE opportunity_stage AS ENUM (
  'NEW_LEAD',
  'INITIAL_OUTREACH', 
  'SAMPLE_VISIT_OFFERED',
  'AWAITING_RESPONSE',
  'FEEDBACK_LOGGED',
  'DEMO_SCHEDULED',
  'CLOSED_WON'
);

CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  stage opportunity_stage NOT NULL DEFAULT 'NEW_LEAD',
  probability_percent INTEGER CHECK (probability_percent >= 0 AND probability_percent <= 100),
  expected_close_date DATE,
  organization_id UUID REFERENCES organizations(id),
  principal_id UUID REFERENCES organizations(id),
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
```

#### Products (`products`)
Product catalog with principal relationships:

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category product_category DEFAULT 'OTHER',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table for product-principal relationships
CREATE TABLE product_principals (
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  principal_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, principal_id)
);
```

### Junction Tables & Relationships

#### Organization-Contact Relationships
Many-to-many relationship with additional metadata:

```sql
CREATE TABLE organization_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  role TEXT,
  relationship_status contact_relationship_status DEFAULT 'active',
  override_email TEXT,
  override_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, contact_id)
);
```

**Key Features**:
- **Primary contact designation** with unique constraints
- **Role-based assignments** with flexible role definitions
- **Override contact information** for organization-specific details
- **Relationship status tracking** (Active/Inactive/Former)

## Advanced Database Features

### Database Views for Analytics

#### Principal Activity Summary
Materialized view for performance-optimized analytics:

```sql
CREATE MATERIALIZED VIEW principal_activity_summary AS
SELECT 
  p.id as principal_id,
  p.name as principal_name,
  COUNT(DISTINCT o.id) as total_opportunities,
  COUNT(DISTINCT CASE WHEN o.stage != 'CLOSED_WON' THEN o.id END) as active_opportunities,
  COUNT(DISTINCT CASE WHEN o.is_won THEN o.id END) as won_opportunities,
  AVG(CASE WHEN o.stage != 'CLOSED_WON' THEN o.probability_percent END) as avg_probability,
  COUNT(DISTINCT i.id) as total_interactions,
  MAX(i.created_at) as last_interaction_date,
  -- Additional computed metrics
  COUNT(DISTINCT o.organization_id) as unique_organizations,
  COUNT(DISTINCT pr.product_id) as available_products
FROM organizations p
LEFT JOIN opportunities o ON p.id = o.principal_id AND o.deleted_at IS NULL
LEFT JOIN interactions i ON p.id = i.principal_id AND i.deleted_at IS NULL  
LEFT JOIN product_principals pr ON p.id = pr.principal_id
WHERE p.is_principal = TRUE AND p.deleted_at IS NULL
GROUP BY p.id, p.name;

-- Refresh strategy for real-time updates
CREATE OR REPLACE FUNCTION refresh_principal_activity_summary()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY principal_activity_summary;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

### Row Level Security (RLS)

Comprehensive security policies for data access:

```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Authentication-based access policies
CREATE POLICY "Users can view all organizations" ON organizations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage organizations" ON organizations
  FOR ALL USING (auth.role() = 'authenticated');

-- Development mode policy for demo access
CREATE POLICY "Anonymous can view for demo" ON organizations
  FOR SELECT USING (current_setting('app.demo_mode', true) = 'true');
```

### Performance Optimization

#### Strategic Indexing
```sql
-- Frequently queried fields
CREATE INDEX idx_organizations_status ON organizations(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_priority ON organizations(priority) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_principal ON organizations(is_principal) WHERE is_principal = TRUE;

-- Composite indexes for complex queries
CREATE INDEX idx_opportunities_org_stage ON opportunities(organization_id, stage) WHERE deleted_at IS NULL;
CREATE INDEX idx_opportunities_principal_won ON opportunities(principal_id, is_won) WHERE deleted_at IS NULL;

-- Full-text search indexes
CREATE INDEX idx_contacts_search ON contacts USING gin(to_tsvector('english', first_name || ' ' || last_name || ' ' || COALESCE(email, '')));
```

#### Query Optimization Patterns
```sql
-- Optimized opportunity metrics query
SELECT 
  COUNT(*) as total_opportunities,
  COUNT(*) FILTER (WHERE stage != 'CLOSED_WON') as active_opportunities,  
  COUNT(*) FILTER (WHERE is_won = TRUE) as won_opportunities,
  AVG(probability_percent) FILTER (WHERE stage != 'CLOSED_WON') as avg_probability
FROM opportunities 
WHERE deleted_at IS NULL 
  AND created_at >= date_trunc('month', CURRENT_DATE);
```

## TypeScript Type System Integration

### Auto-Generated Database Types

**Supabase CLI generates comprehensive types**:
```typescript
// database.types.ts (auto-generated)
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          status: 'prospect' | 'active_customer' | 'inactive_customer' | 'other' | 'principal' | 'distributor'
          priority: 'A' | 'B' | 'C' | 'D'
          lead_score: number
          is_principal: boolean
          is_distributor: boolean
          // ... complete type definitions
        }
        Insert: {
          id?: string
          name: string
          status?: 'prospect' | 'active_customer' | 'inactive_customer' | 'other' | 'principal' | 'distributor'
          // ... insert-specific types
        }
        Update: {
          id?: string
          name?: string
          // ... update-specific types
        }
      }
      // ... all other tables
    }
    Views: {
      principal_activity_summary: {
        Row: {
          principal_id: string
          principal_name: string
          total_opportunities: number
          // ... view-specific types
        }
      }
    }
    Enums: {
      organization_status: 'prospect' | 'active_customer' | 'inactive_customer' | 'other' | 'principal' | 'distributor'
      opportunity_stage: 'NEW_LEAD' | 'INITIAL_OUTREACH' | 'SAMPLE_VISIT_OFFERED' | 'AWAITING_RESPONSE' | 'FEEDBACK_LOGGED' | 'DEMO_SCHEDULED' | 'CLOSED_WON'
      // ... all enums
    }
  }
}
```

### Application-Specific Types

**Enhanced types for business logic**:
```typescript
// organizations.ts
export interface Organization extends Database['public']['Tables']['organizations']['Row'] {
  // Computed fields
  displayName: string
  isActive: boolean
  leadScoreCategory: 'High' | 'Medium' | 'Low'
  
  // Relationship data
  contacts?: Contact[]
  opportunities?: Opportunity[]
  interactions?: Interaction[]
}

export interface OrganizationInsert extends Database['public']['Tables']['organizations']['Insert'] {
  // Additional validation rules
}

export interface OrganizationUpdate extends Database['public']['Tables']['organizations']['Update'] {
  // Update-specific enhancements
}

// List view interface with computed fields
export interface OrganizationListItem {
  id: string
  name: string
  status: OrganizationStatus
  priority: OrganizationPriority
  leadScore: number
  contactCount: number
  opportunityCount: number
  lastInteractionDate: string | null
  isPrincipal: boolean
  isDistributor: boolean
}
```

## Data Validation Architecture

### Database-Level Validation

**Constraint-based validation**:
```sql
-- Business rule constraints
ALTER TABLE organizations ADD CONSTRAINT exclusive_principal_distributor 
  CHECK (NOT (is_principal AND is_distributor));

-- Data format validation
ALTER TABLE contacts ADD CONSTRAINT valid_email 
  CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Range validation
ALTER TABLE opportunities ADD CONSTRAINT valid_probability 
  CHECK (probability_percent >= 0 AND probability_percent <= 100);
```

### Application-Level Validation (Yup)

**Comprehensive validation schemas**:
```typescript
// organizationValidation.ts
export const organizationSchema = yup.object({
  name: yup
    .string()
    .required('Organization name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
    
  status: yup
    .string()
    .oneOf(['prospect', 'active_customer', 'inactive_customer', 'other', 'principal', 'distributor'])
    .required('Status is required'),
    
  priority: yup
    .string()
    .oneOf(['A', 'B', 'C', 'D'])
    .default('C'),
    
  website: yup
    .string()
    .url('Invalid website URL')
    .nullable(),
    
  email: yup
    .string()
    .email('Invalid email format')
    .nullable(),
    
  // Business logic validation
  isPrincipal: yup.boolean().default(false),
  isDistributor: yup.boolean().default(false)
}).test('principal-distributor-exclusive', 'Cannot be both Principal and Distributor', function(value) {
  return !(value?.isPrincipal && value?.isDistributor);
});

export type OrganizationFormData = yup.InferType<typeof organizationSchema>;
```

## Migration Strategy

### Database Migrations Organization

```
sql/
├── 01_initial_schema.sql           # Core table definitions
├── 02_rls_policies.sql            # Row Level Security policies  
├── 03_indexes.sql                 # Performance optimization indexes
├── 04_views_functions.sql         # Views and stored procedures
├── 05_triggers.sql                # Automated triggers
├── migrations/
│   ├── 20231201_add_opportunity_context.sql
│   ├── 20231215_principal_activity_view.sql
│   └── 20240101_performance_optimizations.sql
└── queries/
    ├── analytics_queries.sql       # Reference queries
    └── maintenance_queries.sql     # Maintenance procedures
```

### Migration Patterns

**Safe migration practices**:
```sql
-- Add column with default value
ALTER TABLE opportunities 
ADD COLUMN context opportunity_context DEFAULT 'GENERAL';

-- Update existing data in batches
UPDATE opportunities 
SET context = 'SAMPLE' 
WHERE name LIKE '%Sample%' 
  AND context = 'GENERAL';

-- Add constraint after data cleanup
ALTER TABLE opportunities 
ADD CONSTRAINT valid_context 
CHECK (context IN ('GENERAL', 'SAMPLE', 'DEMO', 'FOLLOW_UP'));
```

## Performance Monitoring

### Query Performance Tracking

**Built-in performance monitoring**:
```sql
-- Query performance logging
CREATE TABLE query_performance_log (
  id SERIAL PRIMARY KEY,
  query_name TEXT NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  query_params JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance monitoring function
CREATE OR REPLACE FUNCTION log_query_performance(
  p_query_name TEXT,
  p_execution_time INTEGER,
  p_params JSONB DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO query_performance_log (query_name, execution_time_ms, query_params)
  VALUES (p_query_name, p_execution_time, p_params);
  
  -- Alert on slow queries
  IF p_execution_time > 1000 THEN
    RAISE WARNING 'Slow query detected: % took %ms', p_query_name, p_execution_time;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

## Architecture Benefits

### Data Integrity
- **Comprehensive constraints** ensure data consistency
- **Foreign key relationships** maintain referential integrity
- **Business rule validation** at database level
- **Soft delete patterns** preserve data history

### Performance Optimization
- **Strategic indexing** for common query patterns
- **Materialized views** for complex analytics
- **Query optimization** with execution monitoring
- **Batch operations** for efficiency

### Type Safety
- **End-to-end type safety** from database to UI
- **Auto-generated types** synchronized with schema
- **Compile-time validation** of database operations
- **IntelliSense support** for all database interactions

### Scalability
- **Normalized design** with efficient relationships
- **Flexible JSON fields** for extensible metadata
- **View-based abstractions** for complex queries
- **Partition-ready structure** for future growth

This database architecture provides a robust, scalable, and maintainable foundation for the CRM system with excellent performance characteristics and comprehensive data integrity.