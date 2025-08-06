# ADR-005: Supabase Backend Architecture Decision

## Status
- **Status**: Implemented
- **Date**: 2025-01-08
- **Deciders**: Development Team, Backend Architect
- **Consulted**: Database Team, DevOps Team
- **Informed**: All Stakeholders

## Context

We needed to select a backend platform that could provide comprehensive services for our CRM system with the following requirements:

- **Database**: PostgreSQL-based solution with strong ACID properties
- **Authentication**: User management with session handling and role-based access
- **Real-time**: Live data synchronization for collaborative features
- **API Generation**: Automatic REST API generation from database schema
- **Security**: Row Level Security (RLS) and data protection
- **Scalability**: Ability to handle growing user base and data volume
- **Developer Experience**: Easy to develop, test, and deploy
- **Cost Efficiency**: Reasonable pricing for small to medium teams

The alternatives considered were:
1. **Supabase**: Open-source Firebase alternative with PostgreSQL
2. **Firebase**: Google's Backend-as-a-Service platform
3. **AWS Amplify**: Amazon's full-stack development platform
4. **Custom Backend**: Node.js/Express with PostgreSQL
5. **Hasura + PostgreSQL**: GraphQL API with real-time subscriptions

## Decision

We will use **Supabase** as our primary Backend-as-a-Service platform, providing:

**Core Services:**
- **PostgreSQL Database**: Managed PostgreSQL 15+ with full SQL capabilities
- **Auto-generated API**: PostgREST-powered REST API
- **Authentication**: GoTrue-based user management with JWT tokens
- **Real-time**: Phoenix-powered WebSocket subscriptions
- **Storage**: S3-compatible file storage
- **Row Level Security**: Database-level security policies

## Rationale

### Supabase Advantages
- **Open Source**: No vendor lock-in, can self-host if needed
- **PostgreSQL**: Full SQL capabilities, ACID compliance, and rich data types
- **Auto-generated API**: Automatic REST API generation from schema changes
- **Type Safety**: Auto-generated TypeScript types from database schema
- **Real-time**: Built-in real-time subscriptions with minimal setup
- **Security**: Row Level Security (RLS) at the database level
- **Developer Experience**: Excellent tooling, dashboard, and documentation

### Database Benefits
- **SQL Flexibility**: Complex queries, joins, and analytical capabilities
- **ACID Compliance**: Strong consistency and transaction support
- **Scalability**: Vertical and horizontal scaling options
- **Extensions**: Rich ecosystem of PostgreSQL extensions
- **Data Integrity**: Foreign keys, constraints, and validation at DB level

### Authentication Features
- **JWT-based**: Stateless authentication with secure token handling
- **Role-based Access**: User roles and permissions management
- **OAuth Integration**: Support for third-party authentication providers
- **Session Management**: Automatic token refresh and session handling

### Real-time Capabilities
- **Database Changes**: Live notifications for database row changes
- **Presence**: Real-time user presence tracking
- **Broadcasting**: Custom event broadcasting across clients
- **Channels**: Topic-based real-time communication

## Consequences

### Positive
- **Rapid Development**: Instant API generation from schema changes
- **Type Safety**: Auto-generated TypeScript types prevent API mismatches
- **Real-time Features**: Built-in collaborative features with minimal code
- **Security**: Database-level security with Row Level Security policies
- **Scalability**: Managed infrastructure with automatic scaling
- **Cost Effective**: Pay-as-you-scale pricing model
- **Open Source**: No vendor lock-in with self-hosting options

### Negative
- **Platform Dependency**: Reliance on Supabase platform and tooling
- **PostgreSQL Only**: Limited to PostgreSQL, no NoSQL options
- **Learning Curve**: Team needs to learn Supabase-specific patterns
- **Real-time Complexity**: WebSocket connection management overhead

### Risks
- **Low Risk**: Platform stability and long-term viability
  - **Mitigation**: Strong funding, active development, and open-source nature
- **Medium Risk**: Vendor lock-in for proprietary features
  - **Mitigation**: Use standard PostgreSQL features where possible
- **Low Risk**: Performance limitations at scale
  - **Mitigation**: Monitor performance and optimize queries proactively

## Implementation

### Database Architecture
```sql
-- Core business entities
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security policies
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view contacts in their organization" 
  ON contacts FOR SELECT 
  USING (organization_id = auth.jwt() ->> 'organization_id');
```

### API Integration
```typescript
// Auto-generated types from Supabase schema
import { Database } from '@/types/database.types'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient<Database>(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// Type-safe API calls
const { data: contacts, error } = await supabase
  .from('contacts')
  .select('id, name, email, organization:organizations(name)')
  .eq('organization_id', organizationId)
```

### Real-time Subscriptions
```typescript
// Real-time data synchronization
const subscription = supabase
  .channel('contact_changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'contacts' },
    (payload) => {
      // Handle real-time updates
      contactStore.handleRealtimeUpdate(payload)
    }
  )
  .subscribe()
```

### Authentication Flow
```typescript
// User authentication with session management
const { data: { user }, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// Automatic JWT token handling
const { data, error } = await supabase
  .from('user_data')
  .select('*')
  // RLS automatically filters based on authenticated user
```

### Migration Management
- **Schema Versioning**: 36+ migration files tracking database evolution
- **Type Generation**: Automated TypeScript type generation from schema
- **Development Workflow**: Local development with Supabase CLI
- **Production Deployment**: Managed migrations through Supabase dashboard

## Related Decisions
- [ADR-004: Vue 3 + TypeScript Technology Stack Selection](./004-vue3-typescript-stack.md)
- [ADR-008: Pinia State Management Architecture](./008-pinia-state-management.md)
- [ADR-013: API Service Layer Design Pattern](./013-api-service-layer.md)

## Notes
- Database schema documented in `/sql/` directory with migration history
- TypeScript types auto-generated in `src/types/database.types.ts`
- Real-time subscriptions implemented in Pinia stores for reactive UI updates
- Row Level Security policies ensure data isolation between organizations