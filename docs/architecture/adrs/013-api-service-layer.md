# ADR-013: API Service Layer Design Pattern

## Status
- **Status**: Implemented
- **Date**: 2025-01-08
- **Deciders**: Backend Team, Frontend Team
- **Consulted**: Architecture Team, Security Team
- **Informed**: All Developers

## Context

We needed to establish a structured API service layer for our Vue 3 CRM application that would provide consistent data access patterns, error handling, and integration with Supabase. The requirements included:

- **Consistent API Interface**: Uniform patterns for data operations across all services
- **Type Safety**: Strong TypeScript integration with database schema types
- **Error Handling**: Centralized error processing and user feedback
- **Caching Strategy**: Intelligent caching for performance optimization
- **Real-time Integration**: Seamless integration with Supabase subscriptions
- **Testing**: Easy to mock and test API interactions
- **Security**: Proper authentication and authorization patterns
- **Performance**: Optimized queries and data loading strategies

The alternatives considered were:
1. **Service Layer Pattern**: Dedicated service classes for each entity
2. **Repository Pattern**: Abstract data access with repository interfaces
3. **Direct Supabase Usage**: Direct database calls from components/stores
4. **GraphQL Client**: Apollo or similar GraphQL integration
5. **RESTful Wrapper**: Custom REST API wrapper around Supabase

## Decision

We will implement a **Service Layer Pattern** with dedicated service modules for each business entity, providing type-safe, consistent API access patterns.

**Service Architecture:**
- **Entity-Specific Services**: One service module per business entity
- **Typed Responses**: Consistent response patterns with TypeScript types
- **Error Handling**: Standardized error processing and user feedback
- **Supabase Integration**: Direct integration with Supabase client
- **Real-time Support**: Built-in subscription management

## Rationale

### Service Layer Advantages
- **Separation of Concerns**: Clear boundary between data access and business logic
- **Consistent Interface**: Uniform API patterns across all data operations
- **Centralized Logic**: Common operations like caching and error handling
- **Easy Testing**: Service layer can be easily mocked for component testing
- **Type Safety**: Strong typing through auto-generated Supabase types
- **Maintainability**: Changes to data access patterns centralized in services

### Supabase Integration Benefits
- **Real-time Support**: Native integration with Supabase subscriptions
- **Query Optimization**: Leverage Supabase query capabilities
- **Security**: Built-in Row Level Security (RLS) support
- **Performance**: Edge caching and CDN optimizations
- **Type Generation**: Auto-generated TypeScript types from schema

### Error Handling Strategy
- **Consistent Responses**: Standardized error and success response format
- **User-Friendly Messages**: Translated error messages for UI display
- **Logging**: Comprehensive error logging for debugging
- **Graceful Degradation**: Fallback behaviors for failed requests

### Performance Characteristics
- **Query Optimization**: Efficient Supabase queries with proper indexing
- **Caching**: Strategic caching for frequently accessed data
- **Lazy Loading**: On-demand data loading patterns
- **Batch Operations**: Efficient bulk operations where applicable

## Consequences

### Positive
- **Maintainable Code**: Clear separation between data access and UI logic
- **Type Safety**: Compile-time protection against API misuse
- **Consistent Patterns**: Uniform data access across the application
- **Easy Testing**: Simple mocking and unit testing of services
- **Performance**: Optimized queries and caching strategies
- **Real-time Integration**: Seamless subscriptions and live updates

### Negative
- **Additional Abstraction**: Extra layer between components and database
- **Learning Curve**: Developers need to understand service patterns
- **Boilerplate Code**: Some repetitive service setup across entities
- **Over-Engineering**: Risk of unnecessary abstraction for simple operations

### Risks
- **Medium Risk**: Service layer becoming too complex
  - **Mitigation**: Keep services focused and avoid business logic in services
- **Low Risk**: Performance overhead from abstraction
  - **Mitigation**: Monitor performance and optimize where needed
- **Medium Risk**: Inconsistent patterns across different services
  - **Mitigation**: Establish clear conventions and code review practices

## Implementation

### Service Layer Structure
```typescript
// Service organization by business domain
src/services/
├── types/                   # Shared service types
│   ├── responses.ts        # Standard response interfaces
│   ├── errors.ts          # Error type definitions
│   └── filters.ts         # Common filter types
├── contactsApi.ts          # Contact management operations
├── organizationsApi.ts     # Organization data operations
├── opportunitiesApi.ts     # Sales pipeline operations
├── interactionsApi.ts      # Customer interaction tracking
├── principalsApi.ts        # Principal management
├── productsApi.ts          # Product catalog operations
├── dashboardApi.ts         # Dashboard metrics and analytics
├── principalActivityApi.ts # Principal activity analytics
├── supabase.ts            # Supabase client configuration
└── index.ts               # Service exports
```

### Standard Response Types
```typescript
// src/services/types/responses.ts
export interface ApiResponse<T = any> {
  data: T | null
  error: string | null
  count?: number
  status?: number
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

export interface RealtimePayload<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T | null
  old: T | null
  table: string
}
```

### Base Service Pattern
```typescript
// src/services/contactsApi.ts
import { supabase } from './supabase'
import type { Contact, ContactInsert, ContactUpdate } from '@/types/database.types'
import type { ApiResponse, PaginatedResponse } from './types/responses'

// Filter and query types
interface ContactFilters {
  organizationId?: string
  isActive?: boolean
  search?: string
}

interface ContactQueryOptions {
  page?: number
  limit?: number
  sortBy?: 'name' | 'created_at' | 'updated_at'
  sortOrder?: 'asc' | 'desc'
}

// Service implementation
export const contactsApi = {
  /**
   * Fetch all contacts with optional filtering
   */
  async getContacts(
    filters: ContactFilters = {},
    options: ContactQueryOptions = {}
  ): Promise<PaginatedResponse<Contact>> {
    try {
      let query = supabase
        .from('contacts')
        .select(`
          *,
          organization:organizations(id, name, type),
          interactions_count:interactions(count)
        `, { count: 'exact' })

      // Apply filters
      if (filters.organizationId) {
        query = query.eq('organization_id', filters.organizationId)
      }
      
      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive)
      }
      
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
      }

      // Apply sorting
      const sortBy = options.sortBy || 'name'
      const sortOrder = options.sortOrder || 'asc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply pagination
      const page = options.page || 1
      const limit = options.limit || 20
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching contacts:', error)
        return {
          data: null,
          error: 'Failed to fetch contacts',
          pagination: {
            page,
            limit,
            total: 0,
            hasMore: false
          }
        }
      }

      return {
        data: data || [],
        error: null,
        count,
        pagination: {
          page,
          limit,
          total: count || 0,
          hasMore: (count || 0) > to + 1
        }
      }
    } catch (err) {
      console.error('Unexpected error fetching contacts:', err)
      return {
        data: null,
        error: 'An unexpected error occurred',
        pagination: {
          page: options.page || 1,
          limit: options.limit || 20,
          total: 0,
          hasMore: false
        }
      }
    }
  },

  /**
   * Get a single contact by ID
   */
  async getContactById(id: string): Promise<ApiResponse<Contact>> {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          organization:organizations(*),
          interactions:interactions(*)
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching contact:', error)
        return {
          data: null,
          error: error.code === 'PGRST116' ? 'Contact not found' : 'Failed to fetch contact'
        }
      }

      return {
        data,
        error: null
      }
    } catch (err) {
      console.error('Unexpected error fetching contact:', err)
      return {
        data: null,
        error: 'An unexpected error occurred'
      }
    }
  },

  /**
   * Create a new contact
   */
  async createContact(contactData: ContactInsert): Promise<ApiResponse<Contact>> {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert(contactData)
        .select(`
          *,
          organization:organizations(*)
        `)
        .single()

      if (error) {
        console.error('Error creating contact:', error)
        return {
          data: null,
          error: getErrorMessage(error)
        }
      }

      return {
        data,
        error: null
      }
    } catch (err) {
      console.error('Unexpected error creating contact:', err)
      return {
        data: null,
        error: 'Failed to create contact'
      }
    }
  },

  /**
   * Update an existing contact
   */
  async updateContact(id: string, updates: ContactUpdate): Promise<ApiResponse<Contact>> {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          organization:organizations(*)
        `)
        .single()

      if (error) {
        console.error('Error updating contact:', error)
        return {
          data: null,
          error: getErrorMessage(error)
        }
      }

      return {
        data,
        error: null
      }
    } catch (err) {
      console.error('Unexpected error updating contact:', err)
      return {
        data: null,
        error: 'Failed to update contact'
      }
    }
  },

  /**
   * Soft delete a contact
   */
  async deleteContact(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ 
          is_active: false,
          deleted_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        console.error('Error deleting contact:', error)
        return {
          data: null,
          error: 'Failed to delete contact'
        }
      }

      return {
        data: true,
        error: null
      }
    } catch (err) {
      console.error('Unexpected error deleting contact:', err)
      return {
        data: null,
        error: 'Failed to delete contact'
      }
    }
  },

  /**
   * Batch create multiple contacts
   */
  async createContactsBatch(contacts: ContactInsert[]): Promise<ApiResponse<Contact[]>> {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert(contacts)
        .select(`
          *,
          organization:organizations(*)
        `)

      if (error) {
        console.error('Error creating contacts batch:', error)
        return {
          data: null,
          error: 'Failed to create contacts'
        }
      }

      return {
        data: data || [],
        error: null
      }
    } catch (err) {
      console.error('Unexpected error creating contacts batch:', err)
      return {
        data: null,
        error: 'Failed to create contacts'
      }
    }
  }
}

// Error message mapping
function getErrorMessage(error: any): string {
  if (error.code === '23505') {
    return 'A contact with this email already exists'
  }
  if (error.code === '23503') {
    return 'Invalid organization selected'
  }
  if (error.code === '42501') {
    return 'You do not have permission to perform this action'
  }
  return 'Failed to save contact'
}

// Real-time subscription helper
export function subscribeToContactChanges(callback: (payload: RealtimePayload<Contact>) => void) {
  return supabase
    .channel('contact_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'contacts' },
      callback
    )
    .subscribe()
}
```

### Service Integration with Stores
```typescript
// Integration pattern in Pinia stores
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { contactsApi, subscribeToContactChanges } from '@/services/contactsApi'
import type { Contact, ContactInsert } from '@/types/database.types'

export const useContactStore = defineStore('contact', () => {
  const contacts = ref<Contact[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Use service layer for all data operations
  async function fetchContacts() {
    loading.value = true
    error.value = null
    
    const response = await contactsApi.getContacts()
    
    if (response.error) {
      error.value = response.error
    } else {
      contacts.value = response.data || []
    }
    
    loading.value = false
  }

  async function createContact(contactData: ContactInsert) {
    const response = await contactsApi.createContact(contactData)
    
    if (response.error) {
      throw new Error(response.error)
    }
    
    return response.data
  }

  // Set up real-time subscriptions
  subscribeToContactChanges((payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload
    
    switch (eventType) {
      case 'INSERT':
        if (newRecord) contacts.value.push(newRecord)
        break
      case 'UPDATE':
        if (newRecord) {
          const index = contacts.value.findIndex(c => c.id === newRecord.id)
          if (index !== -1) contacts.value[index] = newRecord
        }
        break
      case 'DELETE':
        if (oldRecord) {
          contacts.value = contacts.value.filter(c => c.id !== oldRecord.id)
        }
        break
    }
  })

  return {
    contacts,
    loading,
    error,
    fetchContacts,
    createContact
  }
})
```

### Testing Pattern
```typescript
// Service testing with Vitest
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { contactsApi } from '@/services/contactsApi'
import { supabase } from '@/services/supabase'

vi.mock('@/services/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
}))

describe('Contacts API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch contact by ID successfully', async () => {
    const mockContact = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com'
    }

    const mockQuery = {
      single: vi.fn().mockResolvedValue({
        data: mockContact,
        error: null
      })
    }

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue(mockQuery)
      })
    } as any)

    const result = await contactsApi.getContactById('1')

    expect(result.data).toEqual(mockContact)
    expect(result.error).toBeNull()
    expect(supabase.from).toHaveBeenCalledWith('contacts')
  })

  it('should handle contact not found error', async () => {
    const mockQuery = {
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' }
      })
    }

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue(mockQuery)
      })
    } as any)

    const result = await contactsApi.getContactById('999')

    expect(result.data).toBeNull()
    expect(result.error).toBe('Contact not found')
  })
})
```

## Related Decisions
- [ADR-005: Supabase Backend Architecture Decision](./005-supabase-backend.md)
- [ADR-008: Pinia State Management Architecture](./008-pinia-state-management.md)
- [ADR-010: Playwright + Vitest Testing Framework Selection](./010-testing-framework.md)

## Notes
- Service layer provides consistent interface across all data operations
- Type safety ensured through auto-generated Supabase database types
- Error handling centralized with user-friendly error messages
- Real-time subscriptions managed within service layer
- Testing patterns established for easy mocking and unit testing
- Performance optimized through strategic query patterns and caching