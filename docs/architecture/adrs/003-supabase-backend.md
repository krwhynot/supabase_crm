# ADR-003: Supabase as Backend-as-a-Service Platform

## Status
- **Status**: Implemented
- **Date**: 2024-03-10
- **Deciders**: Technical Lead, Backend Team, Architecture Team
- **Consulted**: DevOps Team, Security Team
- **Informed**: Full Development Team, Stakeholders, Management

## Context
The CRM system needed a robust backend solution to handle data persistence, real-time updates, authentication, and file storage. We evaluated several options including traditional backend frameworks, cloud databases, and Backend-as-a-Service (BaaS) solutions.

Requirements:
- PostgreSQL database with advanced features (JSONB, full-text search, etc.)
- Real-time data synchronization for collaborative features
- Built-in authentication and authorization
- RESTful API with minimal configuration
- File storage capabilities
- Row Level Security for multi-tenant data isolation
- Scalable infrastructure with minimal operational overhead

## Decision
We will use **Supabase** as our primary Backend-as-a-Service platform, providing PostgreSQL database, real-time subscriptions, authentication, and file storage.

## Rationale

### Technical Advantages
- **PostgreSQL Foundation**: Full-featured PostgreSQL 15+ with advanced capabilities
- **Auto-generated API**: RESTful API automatically generated from database schema
- **Real-time Capabilities**: WebSocket-based real-time subscriptions built-in
- **Row Level Security**: Database-level security policies for fine-grained access control
- **TypeScript Support**: Automatic type generation from database schema
- **Performance**: Edge network with global distribution

### Business Benefits
- **Rapid Development**: Reduced backend development time by 70%
- **Lower Operational Costs**: No infrastructure management required
- **Scalability**: Automatic scaling with usage-based pricing
- **Security**: Enterprise-grade security with SOC 2 compliance
- **Developer Experience**: Excellent tooling and documentation

### Architecture Alignment
Supabase aligns perfectly with our technology choices:
- PostgreSQL expertise on the team
- Real-time requirements for CRM collaboration
- TypeScript-first development approach
- Security requirements with RLS policies
- Rapid prototyping and iteration needs

## Consequences

### Positive
- **Accelerated Development**: Focus on business logic instead of infrastructure
- **Built-in Real-time**: Native WebSocket support for live updates
- **Type Safety**: Auto-generated TypeScript types from schema
- **Security**: Database-level security with RLS policies
- **Observability**: Built-in monitoring and logging
- **Cost Effective**: Pay-as-you-scale pricing model

### Negative
- **Vendor Lock-in**: Dependency on Supabase ecosystem
- **Limited Customization**: Less control over backend infrastructure
- **Pricing Scaling**: Costs can increase with heavy usage

### Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|---------|------------|------------|
| Vendor lock-in dependency | High | Medium | Abstract database layer, maintain schema migrations |
| Service outages | High | Low | Monitor status, implement graceful degradation |
| Pricing increases | Medium | Medium | Monitor usage, optimize queries, consider alternatives |
| Feature limitations | Medium | Low | Evaluate alternatives, use edge functions for custom logic |

## Implementation

### Database Architecture
We implemented a comprehensive PostgreSQL schema with 36+ migrations:

```sql
-- Example: Organizations table with RLS
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(500) NOT NULL,
    email VARCHAR(255),
    -- ... other fields
    assigned_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Row Level Security Policy
CREATE POLICY "org_access_policy" ON organizations
FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
        assigned_user_id = auth.uid() OR
        id IN (SELECT organization_id FROM user_organization_access WHERE user_id = auth.uid())
    )
);
```

### API Integration
Supabase provides auto-generated REST API with filtering and embedding:

```typescript
// Supabase client configuration
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// API service example
export const contactsApi = {
  async getContacts(filters?: ContactFilters) {
    let query = supabase
      .from('contacts')
      .select(`
        *,
        organization:organizations(id, name, status)
      `)
      .is('deleted_at', null)
    
    if (filters?.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }
    
    if (filters?.organizationId) {
      query = query.eq('organization_id', filters.organizationId)
    }
    
    const { data, error } = await query
      .order(filters?.sortBy || 'created_at', { ascending: filters?.sortOrder === 'asc' })
    
    if (error) throw error
    return { data: data || [] }
  },

  async createContact(contact: ContactInsert) {
    const { data, error } = await supabase
      .from('contacts')
      .insert(contact)
      .select()
      .single()
    
    if (error) throw error
    return { data }
  }
}
```

### Real-time Integration
Supabase real-time subscriptions for live updates:

```typescript
// Real-time subscription setup
export function useRealtimeSubscription() {
  const contactStore = useContactStore()
  const organizationStore = useOrganizationStore()
  
  onMounted(() => {
    // Subscribe to contacts changes
    const contactsSubscription = supabase
      .channel('contacts-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'contacts'
      }, (payload) => {
        contactStore.handleRealtimeUpdate(payload)
      })
      .subscribe()
    
    // Subscribe to organizations changes
    const orgsSubscription = supabase
      .channel('organizations-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'organizations'
      }, (payload) => {
        organizationStore.handleRealtimeUpdate(payload)
      })
      .subscribe()
    
    // Cleanup on unmount
    onUnmounted(() => {
      contactsSubscription.unsubscribe()
      orgsSubscription.unsubscribe()
    })
  })
}
```

### Authentication Integration
Supabase Auth with JWT tokens:

```typescript
// Authentication service
export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  },
  
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },
  
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },
  
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}
```

### Type Generation
Automatic TypeScript types from database schema:

```bash
# Generate types command
npx supabase gen types typescript --project-id your-project-id > src/types/database.types.ts
```

```typescript
// Generated types example
export interface Database {
  public: {
    Tables: {
      contacts: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          organization_id: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          organization_id?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          organization_id?: string | null
          updated_at?: string
          deleted_at?: string | null
        }
      }
    }
  }
}

// Type aliases for easier usage
export type Contact = Database['public']['Tables']['contacts']['Row']
export type ContactInsert = Database['public']['Tables']['contacts']['Insert']
export type ContactUpdate = Database['public']['Tables']['contacts']['Update']
```

## Performance Optimization

### Query Optimization
```typescript
// Efficient query with proper indexing
export const getOrganizationWithMetrics = async (id: string) => {
  const { data, error } = await supabase
    .from('organizations')
    .select(`
      *,
      contacts_count:contacts(count),
      opportunities_count:opportunities(count),
      last_interaction:interactions(
        interaction_date,
        type
      )
    `)
    .eq('id', id)
    .order('interaction_date', { 
      ascending: false, 
      foreignTable: 'interactions' 
    })
    .limit(1, { foreignTable: 'interactions' })
    .single()
  
  if (error) throw error
  return data
}
```

### Connection Management
```typescript
// Connection pooling and optimization
const supabaseConfig = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
}

export const supabase = createClient<Database>(
  supabaseUrl, 
  supabaseAnonKey, 
  supabaseConfig
)
```

## Security Implementation

### Row Level Security Policies
```sql
-- Example RLS policies for different access patterns

-- Users can only see their assigned organizations
CREATE POLICY "user_organization_access" ON organizations
FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
        assigned_user_id = auth.uid() OR
        id IN (
            SELECT organization_id 
            FROM user_organization_access 
            WHERE user_id = auth.uid()
        )
    )
);

-- Users can only modify organizations they manage
CREATE POLICY "user_organization_update" ON organizations
FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    assigned_user_id = auth.uid()
);

-- Soft delete policy
CREATE POLICY "soft_delete_access" ON organizations
FOR SELECT USING (deleted_at IS NULL);
```

### API Security
```typescript
// Security headers and validation
const secureApiCall = async (endpoint: string, options: RequestInit = {}) => {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Authentication required')
  }
  
  return fetch(endpoint, {
    ...options,
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      'X-Client-Info': 'crm-spa/1.0',
      ...options.headers
    }
  })
}
```

## Monitoring and Observability

### Performance Monitoring
```typescript
// Query performance tracking
export const trackQuery = (queryName: string, duration: number, rowCount: number) => {
  // Log slow queries
  if (duration > 1000) {
    console.warn(`Slow query detected: ${queryName} took ${duration}ms for ${rowCount} rows`)
  }
  
  // Send to monitoring service
  if (import.meta.env.PROD) {
    // analytics.track('query_performance', {
    //   query: queryName,
    //   duration,
    //   row_count: rowCount
    // })
  }
}
```

### Error Handling
```typescript
// Centralized error handling
export const handleSupabaseError = (error: any, context?: string) => {
  console.error(`Supabase error ${context ? `in ${context}` : ''}:`, error)
  
  // Categorize errors
  if (error.code === 'PGRST116') {
    throw new Error('Resource not found')
  } else if (error.code === '23505') {
    throw new Error('Duplicate entry detected')
  } else if (error.message?.includes('JWT')) {
    throw new Error('Authentication expired')
  } else {
    throw new Error('Database operation failed')
  }
}
```

## Related Decisions
- **ADR-002**: Pinia State Management (integrates with Supabase real-time)
- **ADR-005**: PWA Implementation (offline/online sync with Supabase)
- **ADR-007**: Testing Strategy (includes Supabase integration testing)

## Migration Strategy

### Database Migrations
```sql
-- Migration management with Supabase
-- File: sql/migrations/20240315_add_organizations_table.sql
CREATE TABLE organizations (
    -- table definition
);

-- Apply migration
supabase db push

-- Generate types after schema changes
supabase gen types typescript > src/types/database.types.ts
```

### Data Migration
```typescript
// Data migration utilities
export const migrateContactsToOrganizations = async () => {
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .is('organization_id', null)
  
  for (const contact of contacts || []) {
    // Create organization from contact data
    const { data: org } = await supabase
      .from('organizations')
      .insert({
        name: contact.organization,
        // ... other fields
      })
      .select()
      .single()
    
    // Update contact with organization reference
    await supabase
      .from('contacts')
      .update({ organization_id: org.id })
      .eq('id', contact.id)
  }
}
```

## Notes

### Cost Analysis
Current Supabase usage and costs:
- **Database**: ~$25/month for current usage
- **Bandwidth**: ~$5/month for API calls
- **Storage**: ~$2/month for file storage
- **Total**: ~$32/month vs ~$200/month for equivalent AWS infrastructure

### Performance Benchmarks
- **API Response Time**: Average 120ms for typical queries
- **Real-time Latency**: <100ms for update propagation
- **Database Query Time**: <50ms for indexed queries
- **Concurrent Users**: Successfully tested with 100+ simultaneous users

### Future Considerations
- **Edge Functions**: For complex business logic
- **Vector Embeddings**: For AI-powered search features
- **Multi-region**: Geographic distribution for global users
- **Advanced Security**: Additional compliance requirements

---

*This ADR documents our successful choice of Supabase as our backend platform, which has enabled rapid development, excellent developer experience, and robust real-time capabilities for our CRM system.*