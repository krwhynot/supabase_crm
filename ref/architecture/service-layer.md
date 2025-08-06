# Service Layer Architecture - API Integration Patterns

## Overview

The Vue 3 CRM project implements a sophisticated service layer that handles all API interactions with Supabase. The architecture demonstrates enterprise-level patterns for error handling, data transformation, caching, and performance optimization while maintaining type safety throughout.

## Service Layer Structure

### API Services Organization

```
src/services/
├── contactsApi.ts              # Contact CRUD operations
├── opportunitiesApi.ts         # Opportunity management with batch operations
├── organizationsApi.ts         # Organization management with analytics
├── principalActivityApi.ts     # Principal activity tracking
├── contactAnalyticsApi.ts      # Contact analytics and reporting
├── interactionsApi.ts          # Communication tracking
├── productsApi.ts              # Product catalog management
└── opportunityNaming.ts        # Auto-naming service utilities
```

## Common API Patterns

### Standardized Response Interface

All API services implement a consistent response pattern:

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  metadata?: {
    total?: number
    page?: number
    limit?: number
    hasMore?: boolean
  }
}
```

### Error Handling Strategy

**Consistent Error Handling Pattern**:
```typescript
export async function apiOperation<T>(params: OperationParams): Promise<ApiResponse<T>> {
  try {
    const { data, error } = await supabase
      .from('table')
      .select('*')
      .match(params)
    
    if (error) {
      console.error('API operation failed:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
```

### Type Safety Integration

**Comprehensive TypeScript Integration**:
- Auto-generated database types from Supabase schema
- Service-specific interfaces for request/response data
- Generic type parameters for reusable service functions
- Strict type checking for all API operations

## Service Implementation Patterns

### Contact API Service (`contactsApi.ts`)

**Purpose**: Basic contact management with search and pagination

**Key Features**:
- Standard CRUD operations with type safety
- Search functionality with query optimization
- Pagination support with metadata
- Relationship management with organizations

**Implementation Pattern**:
```typescript
export async function searchContacts(params: ContactSearchParams): Promise<ApiResponse<Contact[]>> {
  const { searchQuery, page = 1, limit = 20, organizationId } = params
  
  let query = supabase
    .from('contacts')
    .select(`
      *,
      organization_contacts!inner(
        organization:organizations(*)
      )
    `)
  
  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
  }
  
  if (organizationId) {
    query = query.eq('organization_contacts.organization_id', organizationId)
  }
  
  const { data, error, count } = await query
    .range((page - 1) * limit, page * limit - 1)
    .order('created_at', { ascending: false })
  
  // ... error handling and response formatting
}
```

### Opportunity API Service (`opportunitiesApi.ts`)

**Purpose**: Advanced opportunity management with batch operations and auto-naming

**Key Features**:
- Batch opportunity creation for multiple principals
- Auto-naming system with collision detection
- KPI calculations and analytics
- 7-stage pipeline management
- Demo data fallbacks for development

**Advanced Implementation**:
```typescript
export async function createBatchOpportunities(params: BatchOpportunityParams): Promise<ApiResponse<Opportunity[]>> {
  const { organizationId, principalIds, context, productId, stageOverride } = params
  
  // Generate names for all opportunities
  const opportunities = await Promise.all(
    principalIds.map(async (principalId) => {
      const name = await generateOpportunityName({
        organizationId,
        principalId,
        context,
        productId
      })
      
      return {
        name,
        organization_id: organizationId,
        principal_id: principalId,
        product_id: productId,
        stage: stageOverride || 'NEW_LEAD',
        context,
        // ... additional fields
      }
    })
  )
  
  // Batch insert with transaction safety
  const { data, error } = await supabase
    .from('opportunities')
    .insert(opportunities)
    .select('*')
  
  // ... error handling and response formatting
}
```

### Organization API Service (`organizationsApi.ts`)

**Purpose**: Comprehensive organization management with analytics and caching

**Key Features**:
- Principal-distributor relationship management
- Advanced analytics and performance metrics
- Sophisticated caching with TTL
- Multi-principal organization queries
- Priority system integration

**Enterprise-Level Implementation**:
```typescript
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class OrganizationApiService {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
  
  async getOrganizationsWithAnalytics(params: AnalyticsParams): Promise<ApiResponse<OrganizationWithAnalytics[]>> {
    const cacheKey = `orgs_analytics_${JSON.stringify(params)}`
    const cached = this.getCachedData(cacheKey)
    
    if (cached) {
      return { success: true, data: cached }
    }
    
    // Complex query with analytics
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        opportunities(count),
        interactions(count),
        contacts(count),
        organization_analytics(*)
      `)
      .match(params.filters)
    
    if (data) {
      this.setCachedData(cacheKey, data, this.DEFAULT_TTL)
    }
    
    // ... error handling and response formatting
  }
  
  private getCachedData<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }
}
```

### Principal Activity API Service (`principalActivityApi.ts`)

**Purpose**: Real-time activity monitoring with comprehensive analytics

**Key Features**:
- Real-time metric updates with configurable intervals
- Complex analytics calculations
- Performance monitoring with query optimization
- Multi-dimensional data aggregation
- Timeline tracking capabilities

**Sophisticated Implementation**:
```typescript
export async function getPrincipalActivityMetrics(params: MetricsParams): Promise<ApiResponse<ActivityMetrics>> {
  const startTime = performance.now()
  
  try {
    // Parallel data fetching for performance
    const [activitiesResult, analyticsResult, timelineResult] = await Promise.all([
      fetchActivities(params),
      fetchAnalytics(params),  
      fetchTimeline(params)
    ])
    
    const queryTime = performance.now() - startTime
    
    // Performance monitoring
    if (queryTime > 1000) {
      console.warn(`Slow query detected: ${queryTime}ms for principal metrics`)
    }
    
    const metrics = aggregateMetrics({
      activities: activitiesResult.data,
      analytics: analyticsResult.data,
      timeline: timelineResult.data
    })
    
    return {
      success: true,
      data: metrics,
      metadata: { queryTime }
    }
  } catch (error) {
    // ... error handling
  }
}
```

## Data Transformation Patterns

### Response Data Transformation

**Consistent transformation patterns**:
```typescript
function transformDatabaseRecord<T>(record: DatabaseRecord): T {
  return {
    ...record,
    // Convert snake_case to camelCase
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    // Format dates
    displayDate: formatDate(record.created_at),
    // Calculate derived fields
    isActive: record.status === 'active',
    // Handle relationships
    organization: record.organizations ? transformOrganization(record.organizations) : null
  }
}
```

### Request Data Preparation

**Database-ready data preparation**:
```typescript
function prepareForDatabase<T>(data: T): DatabaseInsert {
  return {
    // Convert camelCase to snake_case
    created_at: new Date().toISOString(),
    // Handle nested objects
    metadata: JSON.stringify(data.metadata),
    // Validate and clean data
    email: data.email?.toLowerCase().trim(),
    // Handle optional fields
    ...(data.phone && { phone: formatPhoneNumber(data.phone) })
  }
}
```

## Performance Optimization Strategies

### Query Optimization

**Strategic data fetching**:
- **Selective field querying** to minimize data transfer  
- **Relationship optimization** with targeted joins
- **Index utilization** for common query patterns
- **Pagination** for large datasets

### Caching Strategy

**Multi-level caching approach**:
```typescript
class ApiCache {
  // Memory cache for frequently accessed data
  private memoryCache = new Map<string, CacheEntry<any>>()
  
  // Session storage for user-specific data
  private sessionCache = {
    get: (key: string) => JSON.parse(sessionStorage.getItem(key) || 'null'),
    set: (key: string, data: any) => sessionStorage.setItem(key, JSON.stringify(data))
  }
  
  // Strategic cache invalidation
  invalidatePattern(pattern: string) {
    const keys = Array.from(this.memoryCache.keys()).filter(key => key.includes(pattern))
    keys.forEach(key => this.memoryCache.delete(key))
  }
}
```

### Batch Operations

**Efficient bulk operations**:
```typescript
export async function batchUpdateContacts(updates: ContactUpdate[]): Promise<ApiResponse<Contact[]>> {
  // Group updates by operation type
  const grouped = groupBy(updates, 'operationType')
  
  // Execute in parallel where possible
  const results = await Promise.allSettled([
    grouped.update ? supabase.from('contacts').upsert(grouped.update) : null,
    grouped.delete ? supabase.from('contacts').delete().in('id', grouped.delete.map(u => u.id)) : null
  ])
  
  // Handle partial failures gracefully
  const successfulUpdates = results
    .filter(result => result.status === 'fulfilled' && result.value?.data)
    .flatMap(result => result.value.data)
  
  return { success: true, data: successfulUpdates }
}
```

## Error Handling & Resilience

### Comprehensive Error Classification

```typescript
enum ApiErrorType {
  NETWORK_ERROR = 'network_error',
  VALIDATION_ERROR = 'validation_error', 
  AUTHORIZATION_ERROR = 'authorization_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  SERVER_ERROR = 'server_error'
}

function classifyError(error: any): ApiErrorType {
  if (error.code === 'PGRST301') return ApiErrorType.VALIDATION_ERROR
  if (error.message?.includes('rate limit')) return ApiErrorType.RATE_LIMIT_ERROR
  if (error.status === 401) return ApiErrorType.AUTHORIZATION_ERROR
  // ... additional classification logic
}
```

### Retry Strategy

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  backoffMs: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, backoffMs * Math.pow(2, attempt - 1)))
    }
  }
}
```

## Integration Benefits

### Type Safety
- **End-to-end type safety** from database to UI
- **Compile-time error detection** for API misuse
- **IntelliSense support** for all API operations

### Maintainability
- **Consistent patterns** across all services
- **Centralized error handling** strategies
- **Clear separation** of concerns

### Performance
- **Intelligent caching** with TTL management
- **Query optimization** for common patterns
- **Batch operations** for efficiency

### Reliability  
- **Comprehensive error handling** with graceful degradation
- **Retry mechanisms** for transient failures
- **Performance monitoring** with alerting

This service layer architecture provides a robust, scalable, and maintainable foundation for API interactions while maintaining excellent developer experience and production-grade reliability.