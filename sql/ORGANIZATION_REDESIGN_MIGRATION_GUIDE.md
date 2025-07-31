# Organization Form Redesign - Database Migration Guide

## Overview

This guide documents the comprehensive database schema updates required for the Organization Form Redesign. The migration includes priority system enhancements, expanded organization status options, principal/distributor business logic, and contact-organization relationship management.

## Migration Files

### Core Migrations (Apply in Order)

1. **`18_priority_system_update.sql`** - Priority System Enhancement
2. **`19_organization_status_enum_update.sql`** - Organization Status Expansion  
3. **`20_principal_distributor_constraints.sql`** - Business Relationship Logic
4. **`21_organization_contacts_relationship.sql`** - Contact-Organization Junction Table
5. **`22_organization_redesign_validation.sql`** - Comprehensive Validation

## Migration Details

### 1. Priority System Update (Migration 18)

**Purpose**: Updates priority mapping from 0-100 scale to discrete A/B/C/D system

**Key Changes**:
- Updates `lead_score` constraint: `0, 30, 50, 70, 90` values only
- Priority mapping: A=90, B=70, C=50, D=30, Unscored=0
- Adds helper functions: `priority_to_lead_score()`, `lead_score_to_priority()`
- Creates `organizations_with_priority` view
- Migrates existing data automatically

**Performance Impact**: Minimal - adds constraint and helper functions

### 2. Organization Status Enum Update (Migration 19)

**Purpose**: Expands organization status options for better categorization

**Key Changes**:
- Adds enum values: 'Active Customer', 'Inactive Customer', 'Other', 'Principal', 'Distributor'
- Preserves backward compatibility with existing status values
- Adds status helper functions: `is_customer_status()`, `get_organization_category()`
- Creates `organizations_with_status_info` view
- Migrates 'Customer' to 'Active Customer' automatically

**Performance Impact**: Minimal - enum expansion is efficient in PostgreSQL

### 3. Principal/Distributor Constraints (Migration 20)

**Purpose**: Implements business relationship logic with performance optimization

**Key Changes**:
- Enforces mutual exclusivity: Cannot be both principal AND distributor
- Adds partial indexes for boolean queries (high performance)
- Creates business relationship helper functions
- Adds distributor hierarchy validation
- Creates performance views for business relationships

**Performance Impact**: Positive - adds targeted indexes for common queries

### 4. Organization-Contacts Relationship (Migration 21)

**Purpose**: Creates many-to-many relationship between organizations and contacts

**Key Changes**:
- Creates `organization_contacts` junction table
- Includes relationship metadata (role, primary contact, notes)
- Implements RLS policies for security
- Creates comprehensive indexes for performance
- Migrates existing contact-organization relationships
- Adds relationship management functions

**Performance Impact**: Positive - enables efficient contact-organization queries

## Pre-Migration Checklist

- [ ] **Backup Database**: Create full backup before applying migrations
- [ ] **Review Current Data**: Check existing organizations, contacts, and relationships
- [ ] **Validate Environment**: Ensure migrations run in test environment first
- [ ] **Check Dependencies**: Verify all referenced tables and functions exist
- [ ] **Resource Planning**: Migrations 20-21 create multiple indexes (may take time on large datasets)

## Migration Execution

### Recommended Approach

```sql
-- 1. Apply migrations in sequence
\i sql/18_priority_system_update.sql
\i sql/19_organization_status_enum_update.sql  
\i sql/20_principal_distributor_constraints.sql
\i sql/21_organization_contacts_relationship.sql

-- 2. Run comprehensive validation
\i sql/22_organization_redesign_validation.sql
```

### Alternative: Single Transaction

```sql
BEGIN;
\i sql/18_priority_system_update.sql
\i sql/19_organization_status_enum_update.sql
\i sql/20_principal_distributor_constraints.sql
\i sql/21_organization_contacts_relationship.sql
COMMIT;

-- Validate after commit
\i sql/22_organization_redesign_validation.sql
```

## Data Migration Impact

### Automatic Data Migrations

1. **Priority Scores**: Existing lead_score values automatically mapped to new system
2. **Organization Status**: 'Customer' status updated to 'Active Customer'
3. **Contact Relationships**: Existing contacts with organization field migrated to junction table

### Manual Review Required

1. **Invalid Distributor References**: Check for organizations referencing non-existent distributors
2. **Business Relationship Logic**: Verify principal/distributor assignments are correct
3. **Primary Contact Assignments**: Review auto-assigned primary contacts

## Performance Considerations

### New Indexes Created

- **Priority System**: No new indexes (uses existing lead_score index)
- **Status System**: Uses existing status index
- **Principal/Distributor**: 5 new partial indexes for optimal boolean queries
- **Contact Relationships**: 8 new indexes for junction table operations

### Query Optimization

The migration creates several performance-optimized views:
- `organizations_with_priority` - Priority letter display
- `organizations_with_status_info` - Enhanced status categorization
- `organization_business_relationships` - Business hierarchy view
- `organization_contact_details` - Complete relationship details
- `organization_contact_summary` - Relationship statistics

## Security Implementation

### Row Level Security (RLS)

All new tables maintain existing security patterns:
- **organization_contacts**: Full RLS with authenticated user policies
- **Existing Tables**: No RLS policy changes

### Data Access Control

- Helper functions respect existing RLS policies
- Views inherit security from underlying tables
- No anonymous access permitted

## Rollback Procedures

Each migration file includes detailed rollback instructions in comments:

### Migration 18 Rollback
```sql
DROP CONSTRAINT organizations_lead_score_priority_values;
ALTER TABLE organizations ALTER COLUMN lead_score SET DEFAULT 0;
UPDATE organizations SET lead_score = 0 WHERE lead_score IN (30, 50, 70, 90);
```

### Migration 19 Rollback
```sql
-- Note: PostgreSQL enum rollbacks are complex
-- Requires updating data to old values first
-- See migration file for detailed instructions
```

### Migration 20 Rollback
```sql
DROP INDEX idx_organizations_principal_only;
DROP INDEX idx_organizations_distributor_only;
-- See migration file for complete rollback
```

### Migration 21 Rollback
```sql
DROP TABLE organization_contacts CASCADE;
-- See migration file for complete rollback
```

## Validation and Testing

### Automated Validation

The validation script (`22_organization_redesign_validation.sql`) performs:
- Constraint verification
- Function testing
- Data integrity checks
- Performance validation
- Security verification

### Manual Testing Checklist

- [ ] **Priority System**: Test A/B/C/D priority assignments
- [ ] **Status System**: Verify new status values work in application
- [ ] **Business Logic**: Test principal/distributor relationships
- [ ] **Contact Relations**: Test contact-organization associations
- [ ] **Performance**: Verify query performance with new indexes

## Application Integration

### TypeScript Type Updates

The application will need updated types for:
```typescript
// Priority system
type OrganizationPriority = 'A' | 'B' | 'C' | 'D' | 'Unscored';
type LeadScore = 0 | 30 | 50 | 70 | 90;

// Enhanced status
type OrganizationStatus = 
  | 'Active' | 'Inactive' | 'Prospect' | 'Customer' | 'Partner' | 'Vendor'
  | 'Active Customer' | 'Inactive Customer' | 'Other' | 'Principal' | 'Distributor';

// Contact relationships
interface OrganizationContact {
  relationship_id: string;
  organization_id: string;
  contact_id: string;
  is_primary_contact: boolean;
  role?: string;
  relationship_status: 'Active' | 'Inactive' | 'Former';
  notes?: string;
}
```

### API Updates Required

1. **Organizations API**: Update to handle new priority and status values
2. **Contacts API**: Add relationship management endpoints
3. **Business Logic**: Implement principal/distributor validation

## Monitoring and Maintenance

### Performance Monitoring

Monitor these key metrics post-migration:
- Query performance on new indexes
- Junction table growth rate
- Business relationship query patterns

### Data Quality Checks

Regular validation queries:
```sql
-- Check for constraint violations
SELECT COUNT(*) FROM organizations WHERE is_principal = TRUE AND is_distributor = TRUE;

-- Verify relationship integrity  
SELECT COUNT(*) FROM organization_contacts oc
WHERE NOT EXISTS (SELECT 1 FROM organizations o WHERE o.id = oc.organization_id);

-- Monitor primary contact assignments
SELECT organization_id, COUNT(*) 
FROM organization_contacts 
WHERE is_primary_contact = TRUE 
GROUP BY organization_id 
HAVING COUNT(*) > 1;
```

## Support and Troubleshooting

### Common Issues

1. **Migration Timeout**: Large datasets may require increased statement timeout
2. **Constraint Violations**: Existing data may violate new constraints
3. **Index Creation**: Concurrent index creation may fail on busy systems

### Recovery Procedures

1. **Partial Migration Failure**: Roll back completed migrations before retry
2. **Data Corruption**: Restore from backup and reapply migrations
3. **Performance Issues**: Analyze query plans and adjust indexes if needed

## Contact Information

For migration support or questions:
- Review migration file comments for detailed technical information
- Check validation script output for specific error details
- Consult database logs for detailed error messages

---

**Last Updated**: 2025-07-31  
**Migration Version**: 2.0 - Organization Form Redesign  
**Status**: Ready for Production Deployment