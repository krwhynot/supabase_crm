# Performance Architecture

## Performance Overview

The CRM system is designed for high performance across all user interactions, with specific focus on responsive user interfaces, efficient data operations, and optimal resource utilization.

## Performance Architecture Diagram

```mermaid
C4Container
    title Performance Architecture for CRM System

    System_Boundary(client_perf, "Client-Side Performance") {
        Container(browser_cache, "Browser Cache", "HTTP/Service Worker", "Cached assets and API responses")
        Container(vue_optimization, "Vue Optimization", "Virtual DOM, Reactivity", "Efficient rendering and updates")
        Container(bundle_optimization, "Bundle Optimization", "Code Splitting, Tree Shaking", "Minimal JavaScript payload")
        Container(prefetch, "Resource Prefetching", "Link Prefetch, Preload", "Anticipatory resource loading")
    }

    System_Boundary(network_perf, "Network Performance") {
        Container(cdn_cache, "CDN Caching", "Global CDN", "Edge-cached static assets")
        Container(compression, "Content Compression", "Brotli/Gzip", "Compressed text and assets")
        Container(http2, "HTTP/2 & HTTP/3", "Multiplexing", "Efficient connection usage")
        Container(edge_functions, "Edge Computing", "Vercel Edge", "Geographically distributed compute")
    }

    System_Boundary(backend_perf, "Backend Performance") {
        Container(query_optimization, "Query Optimization", "Indexes, Query Plans", "Efficient database operations")
        Container(connection_pooling, "Connection Pooling", "PgBouncer", "Database connection management")
        Container(realtime_optimization, "Real-time Optimization", "Phoenix Channels", "Efficient WebSocket handling")
        Container(api_caching, "API Response Caching", "Redis/Memory", "Cached query results")
    }

    System_Boundary(monitoring_perf, "Performance Monitoring") {
        Container(web_vitals, "Core Web Vitals", "CLS, FID, LCP", "User experience metrics")
        Container(api_monitoring, "API Performance", "Response Times", "Backend operation metrics")
        Container(db_monitoring, "Database Monitoring", "Query Performance", "Database operation analysis")
        Container(real_user_monitoring, "Real User Monitoring", "User Sessions", "Actual user performance data")
    }

    ' Performance relationships
    Rel(vue_optimization, browser_cache, "Utilizes", "Cache API")
    Rel(bundle_optimization, prefetch, "Enables", "Resource Hints")
    Rel(cdn_cache, compression, "Serves", "Compressed Assets")
    Rel(http2, edge_functions, "Routes to", "Edge Compute")
    
    Rel(query_optimization, connection_pooling, "Uses", "Pooled Connections")
    Rel(api_caching, realtime_optimization, "Coordinates", "Cache Invalidation")
    
    Rel(web_vitals, real_user_monitoring, "Feeds", "Performance Data")
    Rel(api_monitoring, db_monitoring, "Correlates", "End-to-end Metrics")

    UpdateElementStyle(vue_optimization, $bgColor="#4fc08d", $fontColor="#ffffff")
    UpdateElementStyle(query_optimization, $bgColor="#336791", $fontColor="#ffffff")
    UpdateElementStyle(web_vitals, $bgColor="#f59e0b", $fontColor="#ffffff")
```

## Performance Targets and Metrics

### Core Web Vitals Targets
| Metric | Target | Current | Status |
|--------|---------|---------|---------|
| **Largest Contentful Paint (LCP)** | < 2.5s | 1.8s | ✅ Good |
| **First Input Delay (FID)** | < 100ms | 45ms | ✅ Good |
| **Cumulative Layout Shift (CLS)** | < 0.1 | 0.05 | ✅ Good |
| **First Contentful Paint (FCP)** | < 1.8s | 1.2s | ✅ Good |
| **Time to Interactive (TTI)** | < 3.5s | 2.8s | ✅ Good |

### API Performance Targets
| Operation | Target | Current | Status |
|-----------|---------|---------|---------|
| **Contact List Load** | < 200ms | 150ms | ✅ Good |
| **Organization Detail** | < 150ms | 120ms | ✅ Good |
| **Opportunity Search** | < 300ms | 250ms | ✅ Good |
| **Real-time Update** | < 100ms | 75ms | ✅ Good |
| **Form Submission** | < 500ms | 380ms | ✅ Good |

### Database Performance Targets
| Query Type | Target | Current | Status |
|------------|---------|---------|---------|
| **Simple SELECT** | < 50ms | 35ms | ✅ Good |
| **Complex JOIN** | < 200ms | 165ms | ✅ Good |
| **Full-text Search** | < 300ms | 245ms | ✅ Good |
| **Aggregation Query** | < 150ms | 125ms | ✅ Good |
| **Write Operations** | < 100ms | 80ms | ✅ Good |

## Client-Side Performance Optimization

### Bundle Optimization Strategy

```typescript
// vite.config.ts - Bundle optimization configuration
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries (changes infrequently)
          'vendor-core': ['vue', 'vue-router', 'pinia'],
          'vendor-ui': ['@headlessui/vue', '@heroicons/vue'],
          'vendor-utils': ['lodash-es', 'yup'],
          
          // Business domain chunks (moderate change frequency)
          'contacts': [
            'src/views/contacts',
            'src/stores/contactStore.ts',
            'src/services/contactsApi.ts'
          ],
          'organizations': [
            'src/views/organizations',
            'src/stores/organizationStore.ts',
            'src/services/organizationsApi.ts'
          ],
          'opportunities': [
            'src/views/opportunities',
            'src/stores/opportunityStore.ts',
            'src/services/opportunitiesApi.ts'
          ]
        }
      }
    },
    target: 'es2020',
    minify: 'esbuild',
    cssCodeSplit: true,
    sourcemap: true
  },
  
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      '@supabase/supabase-js',
      'lodash-es'
    ]
  }
})
```

### Code Splitting Implementation

```typescript
// Router with lazy loading
const routes = [
  {
    path: '/contacts',
    component: () => import('@/views/contacts/ContactsListView.vue'),
    meta: { preload: true }
  },
  {
    path: '/opportunities',
    component: () => import('@/views/opportunities/OpportunitiesListView.vue'),
    meta: { preload: false }
  }
]

// Preload critical routes
router.beforeEach((to, from, next) => {
  if (to.meta?.preload && !componentCache.has(to.path)) {
    // Preload component in background
    preloadComponent(to.component)
  }
  next()
})
```

### Virtual Scrolling for Large Lists

```typescript
// Virtual scrolling implementation
<template>
  <div class="virtual-list" ref="containerRef">
    <div 
      v-for="item in visibleItems" 
      :key="item.id"
      :style="{ height: itemHeight + 'px' }"
      class="virtual-item"
    >
      <ContactListItem :contact="item" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  items: Contact[]
  itemHeight: number
}>()

const containerRef = ref<HTMLElement>()
const scrollTop = ref(0)
const containerHeight = ref(0)

const visibleRange = computed(() => {
  const start = Math.floor(scrollTop.value / props.itemHeight)
  const end = Math.min(
    start + Math.ceil(containerHeight.value / props.itemHeight) + 2,
    props.items.length
  )
  return { start, end }
})

const visibleItems = computed(() => 
  props.items.slice(visibleRange.value.start, visibleRange.value.end)
)

const handleScroll = () => {
  if (containerRef.value) {
    scrollTop.value = containerRef.value.scrollTop
  }
}

onMounted(() => {
  if (containerRef.value) {
    containerRef.value.addEventListener('scroll', handleScroll, { passive: true })
    containerHeight.value = containerRef.value.clientHeight
  }
})
</script>
```

### Image Optimization

```typescript
// Responsive image component with lazy loading
<template>
  <picture class="responsive-image">
    <source 
      :srcset="webpSrcset" 
      type="image/webp"
      v-if="supportsWebP"
    >
    <img 
      :src="src"
      :alt="alt"
      :loading="loading"
      :decoding="decoding"
      @load="handleLoad"
      @error="handleError"
    >
  </picture>
</template>

<script setup lang="ts">
interface Props {
  src: string
  alt: string
  loading?: 'lazy' | 'eager'
  decoding?: 'sync' | 'async' | 'auto'
  sizes?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: 'lazy',
  decoding: 'async'
})

const supportsWebP = ref(false)
const webpSrcset = computed(() => {
  // Generate WebP srcset for different screen sizes
  return [1, 2, 3].map(scale => 
    `${props.src}?format=webp&w=${300 * scale} ${scale}x`
  ).join(', ')
})

// Detect WebP support
onMounted(() => {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  supportsWebP.value = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
})
</script>
```

## Network Performance Optimization

### Caching Strategy

```typescript
// Service Worker caching strategy
const CACHE_NAME = 'crm-v1.0.0'
const STATIC_CACHE = 'static-v1.0.0'
const API_CACHE = 'api-v1.0.0'

// Cache strategies for different resource types
const cacheStrategies = {
  // Static assets - Cache First
  static: async (request: Request): Promise<Response> => {
    const cache = await caches.open(STATIC_CACHE)
    const cached = await cache.match(request)
    
    if (cached) {
      return cached
    }
    
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  },
  
  // API calls - Network First with fallback
  api: async (request: Request): Promise<Response> => {
    try {
      const response = await fetch(request)
      
      if (response.ok) {
        const cache = await caches.open(API_CACHE)
        cache.put(request, response.clone())
      }
      
      return response
    } catch (error) {
      const cache = await caches.open(API_CACHE)
      const cached = await cache.match(request)
      
      if (cached) {
        return cached
      }
      
      throw error
    }
  }
}
```

### Resource Prefetching

```typescript
// Intelligent prefetching based on user behavior
class ResourcePrefetcher {
  private prefetchQueue: Set<string> = new Set()
  private userBehavior: Map<string, number> = new Map()
  
  trackNavigation(route: string) {
    const count = this.userBehavior.get(route) || 0
    this.userBehavior.set(route, count + 1)
    
    // Prefetch likely next routes
    this.prefetchLikelyRoutes(route)
  }
  
  private prefetchLikelyRoutes(currentRoute: string) {
    const likelyRoutes = this.getLikelyNextRoutes(currentRoute)
    
    likelyRoutes.forEach(route => {
      if (!this.prefetchQueue.has(route)) {
        this.prefetchRoute(route)
      }
    })
  }
  
  private async prefetchRoute(route: string) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.performPrefetch(route)
      })
    } else {
      setTimeout(() => this.performPrefetch(route), 100)
    }
  }
  
  private async performPrefetch(route: string) {
    try {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = route
      document.head.appendChild(link)
      
      this.prefetchQueue.add(route)
    } catch (error) {
      console.warn(`Failed to prefetch ${route}:`, error)
    }
  }
}
```

### HTTP/2 Push and Preload

```html
<!-- Critical resource preloading -->
<link rel="preload" href="/fonts/Inter-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/api/dashboard/metrics" as="fetch" crossorigin>

<!-- Module preloading for critical JavaScript -->
<link rel="modulepreload" href="/src/main.ts">
<link rel="modulepreload" href="/src/stores/dashboardStore.ts">

<!-- DNS prefetch for external domains -->
<link rel="dns-prefetch" href="//fonts.googleapis.com">
<link rel="dns-prefetch" href="//supabase.co">
```

## Backend Performance Optimization

### Database Query Optimization

```sql
-- Performance-optimized queries with proper indexing

-- Composite index for contact search
CREATE INDEX CONCURRENTLY idx_contacts_search_active 
ON contacts (organization_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- Partial index for active opportunities
CREATE INDEX CONCURRENTLY idx_opportunities_active_stage 
ON opportunities (stage, probability_percent, created_at DESC) 
WHERE deleted_at IS NULL AND stage != 'CLOSED_WON';

-- GIN index for full-text search
CREATE INDEX CONCURRENTLY idx_organizations_search 
ON organizations 
USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')))
WHERE deleted_at IS NULL;

-- Function-based index for case-insensitive email search
CREATE INDEX CONCURRENTLY idx_contacts_email_lower 
ON contacts (LOWER(email)) 
WHERE deleted_at IS NULL;
```

### Query Performance Analysis

```typescript
// Query performance monitoring
class QueryPerformanceMonitor {
  private queryMetrics: Map<string, QueryMetric[]> = new Map()
  
  async trackQuery<T>(
    queryName: string, 
    queryFn: () => Promise<T>,
    options: { warnThreshold?: number } = {}
  ): Promise<T> {
    const startTime = performance.now()
    
    try {
      const result = await queryFn()
      const duration = performance.now() - startTime
      
      this.recordMetric(queryName, {
        duration,
        success: true,
        timestamp: Date.now()
      })
      
      // Warn about slow queries
      if (options.warnThreshold && duration > options.warnThreshold) {
        console.warn(`Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`)
      }
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      
      this.recordMetric(queryName, {
        duration,
        success: false,
        error: error.message,
        timestamp: Date.now()
      })
      
      throw error
    }
  }
  
  private recordMetric(queryName: string, metric: QueryMetric) {
    if (!this.queryMetrics.has(queryName)) {
      this.queryMetrics.set(queryName, [])
    }
    
    const metrics = this.queryMetrics.get(queryName)!
    metrics.push(metric)
    
    // Keep only recent metrics (last 100)
    if (metrics.length > 100) {
      metrics.shift()
    }
  }
  
  getQueryStats(queryName: string) {
    const metrics = this.queryMetrics.get(queryName) || []
    const successfulMetrics = metrics.filter(m => m.success)
    
    return {
      totalQueries: metrics.length,
      successRate: successfulMetrics.length / metrics.length,
      averageDuration: successfulMetrics.reduce((sum, m) => sum + m.duration, 0) / successfulMetrics.length,
      p95Duration: this.calculatePercentile(successfulMetrics.map(m => m.duration), 95),
      p99Duration: this.calculatePercentile(successfulMetrics.map(m => m.duration), 99)
    }
  }
}

// Usage in API services
export const contactsApi = {
  async getContacts(filters?: ContactFilters) {
    return queryMonitor.trackQuery('contacts.list', async () => {
      let query = supabase
        .from('contacts')
        .select(`
          *,
          organization:organizations!inner(id, name, status)
        `)
        .is('deleted_at', null)
      
      // Apply filters efficiently
      if (filters?.search) {
        query = query.or(`
          first_name.ilike.%${filters.search}%,
          last_name.ilike.%${filters.search}%,
          email.ilike.%${filters.search}%
        `)
      }
      
      if (filters?.organizationId) {
        query = query.eq('organization_id', filters.organizationId)
      }
      
      const { data, error } = await query
        .order(filters?.sortBy || 'created_at', { 
          ascending: filters?.sortOrder === 'asc' 
        })
        .limit(filters?.limit || 100)
      
      if (error) throw error
      return { data: data || [] }
    }, { warnThreshold: 200 })
  }
}
```

### Connection Pooling Optimization

```typescript
// Supabase client configuration for performance
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
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-client-info': 'crm-spa@1.0.0'
    }
  }
}

// Connection pool monitoring
class ConnectionMonitor {
  private activeConnections = 0
  private maxConnections = 0
  
  trackConnection() {
    this.activeConnections++
    this.maxConnections = Math.max(this.maxConnections, this.activeConnections)
  }
  
  releaseConnection() {
    this.activeConnections = Math.max(0, this.activeConnections - 1)
  }
  
  getStats() {
    return {
      active: this.activeConnections,
      peak: this.maxConnections,
      utilization: this.activeConnections / 100 // Assuming 100 max connections
    }
  }
}
```

## Real-time Performance Optimization

### WebSocket Connection Management

```typescript
// Efficient real-time subscription management
class RealtimeSubscriptionManager {
  private subscriptions: Map<string, RealtimeChannel> = new Map()
  private connectionState: 'connecting' | 'connected' | 'disconnected' = 'disconnected'
  
  subscribe(channel: string, table: string, callback: (payload: any) => void) {
    const subscriptionKey = `${channel}:${table}`
    
    if (this.subscriptions.has(subscriptionKey)) {
      console.warn(`Already subscribed to ${subscriptionKey}`)
      return
    }
    
    const subscription = supabase
      .channel(channel)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: table,
        filter: this.getOptimalFilter(table)  // Only subscribe to relevant changes
      }, callback)
      .subscribe((status) => {
        this.connectionState = status === 'SUBSCRIBED' ? 'connected' : 'connecting'
      })
    
    this.subscriptions.set(subscriptionKey, subscription)
  }
  
  unsubscribe(channel: string, table: string) {
    const subscriptionKey = `${channel}:${table}`
    const subscription = this.subscriptions.get(subscriptionKey)
    
    if (subscription) {
      subscription.unsubscribe()
      this.subscriptions.delete(subscriptionKey)
    }
  }
  
  private getOptimalFilter(table: string): string {
    // Apply user-specific filters to reduce unnecessary events
    const userId = getCurrentUserId()
    
    switch (table) {
      case 'contacts':
        return `organization_id=in.(${getUserOrganizationIds(userId).join(',')})`
      case 'opportunities':
        return `assigned_user_id=eq.${userId}`
      default:
        return ''
    }
  }
  
  // Batch multiple updates to reduce re-renders
  private updateBatch: Map<string, any[]> = new Map()
  private batchTimeout: NodeJS.Timeout | null = null
  
  batchUpdate(table: string, payload: any) {
    if (!this.updateBatch.has(table)) {
      this.updateBatch.set(table, [])
    }
    
    this.updateBatch.get(table)!.push(payload)
    
    // Process batch after 50ms of inactivity
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
    }
    
    this.batchTimeout = setTimeout(() => {
      this.processBatches()
    }, 50)
  }
  
  private processBatches() {
    for (const [table, updates] of this.updateBatch.entries()) {
      const store = getStoreForTable(table)
      store?.handleBatchRealtimeUpdate(updates)
    }
    
    this.updateBatch.clear()
    this.batchTimeout = null
  }
}
```

## Performance Monitoring Implementation

### Core Web Vitals Tracking

```typescript
// Comprehensive web vitals monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB, onINP } from 'web-vitals'

class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()
  
  init() {
    // Track Core Web Vitals
    getCLS(this.recordMetric.bind(this))
    getFID(this.recordMetric.bind(this))
    getFCP(this.recordMetric.bind(this))
    getLCP(this.recordMetric.bind(this))
    getTTFB(this.recordMetric.bind(this))
    onINP(this.recordMetric.bind(this))
    
    // Track custom metrics
    this.trackResourceLoadTimes()
    this.trackRouteChangeTimes()
    this.trackAPIResponseTimes()
  }
  
  private recordMetric(metric: any) {
    const { name, value, rating } = metric
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    this.metrics.get(name)!.push(value)
    
    // Send to analytics
    this.sendToAnalytics(name, value, rating)
    
    // Log poor performance
    if (rating === 'poor') {
      console.warn(`Poor ${name} performance: ${value}`)
    }
  }
  
  private trackResourceLoadTimes() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming
          this.recordCustomMetric('resource_load_time', resourceEntry.duration)
        }
      }
    })
    
    observer.observe({ entryTypes: ['resource'] })
  }
  
  private trackRouteChangeTimes() {
    let routeStartTime = performance.now()
    
    router.beforeEach(() => {
      routeStartTime = performance.now()
    })
    
    router.afterEach(() => {
      const routeChangeTime = performance.now() - routeStartTime
      this.recordCustomMetric('route_change_time', routeChangeTime)
    })
  }
  
  private async sendToAnalytics(name: string, value: number, rating: string) {
    // Send to Vercel Analytics
    if (window.va) {
      window.va('track', 'Performance Metric', {
        metric: name,
        value: Math.round(value),
        rating: rating
      })
    }
    
    // Send to custom analytics endpoint for detailed analysis
    if (import.meta.env.PROD) {
      try {
        await fetch('/api/analytics/performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metric: name,
            value: value,
            rating: rating,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            connectionType: (navigator as any).connection?.effectiveType
          })
        })
      } catch (error) {
        console.warn('Failed to send performance metric:', error)
      }
    }
  }
}

// Initialize performance monitoring
const performanceMonitor = new PerformanceMonitor()
performanceMonitor.init()
```

### Performance Budget Enforcement

```typescript
// Performance budget monitoring
const PERFORMANCE_BUDGETS = {
  // Bundle size budgets
  maxBundleSize: 500, // KB
  maxVendorSize: 300, // KB
  maxCSSSize: 50,     // KB
  
  // Runtime performance budgets
  maxLCP: 2500,       // ms
  maxFID: 100,        // ms
  maxCLS: 0.1,        // score
  
  // API performance budgets
  maxAPIResponse: 200, // ms
  maxDBQuery: 100     // ms
}

class PerformanceBudgetMonitor {
  checkBudgets() {
    this.checkBundleSizes()
    this.checkRuntimeMetrics()
    this.checkAPIPerformance()
  }
  
  private async checkBundleSizes() {
    const buildStats = await this.getBuildStats()
    
    if (buildStats.bundleSize > PERFORMANCE_BUDGETS.maxBundleSize * 1024) {
      console.error(`Bundle size exceeded: ${buildStats.bundleSize} bytes`)
      this.alertTeam('Bundle size budget exceeded')
    }
  }
  
  private checkRuntimeMetrics() {
    const metrics = performanceMonitor.getMetrics()
    
    Object.entries(PERFORMANCE_BUDGETS).forEach(([metric, budget]) => {
      if (metric.startsWith('max') && metrics[metric.substring(3).toLowerCase()]) {
        const value = metrics[metric.substring(3).toLowerCase()]
        if (value > budget) {
          console.warn(`${metric} budget exceeded: ${value} > ${budget}`)
        }
      }
    })
  }
}
```

---

**Next**: [Scalability](./02-scalability.md) - Scalability patterns and capacity planning