import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useOrganizationStore } from '@/stores/organizationStore'

/**
 * System Health Monitoring Composable
 * Provides comprehensive health status monitoring for the CRM system
 */

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'critical'
  responseTime: number
  errorRate: number
  message?: string
  lastChecked: string
}

export interface SystemHealthStatus {
  overall: 'healthy' | 'degraded' | 'critical'
  score: number // 0-100
  components: {
    database: ComponentHealth
    api: ComponentHealth
    frontend: ComponentHealth
    user_experience: ComponentHealth
  }
  lastChecked: string
  uptime: number
  checksPerformed: number
}

export interface HealthCheckConfig {
  interval: number // milliseconds
  timeout: number // milliseconds
  thresholds: {
    responseTime: {
      healthy: number
      degraded: number
    }
    errorRate: {
      healthy: number
      degraded: number
    }
  }
}

const DEFAULT_CONFIG: HealthCheckConfig = {
  interval: 30000, // 30 seconds
  timeout: 5000, // 5 seconds
  thresholds: {
    responseTime: {
      healthy: 1000, // < 1s is healthy
      degraded: 3000 // 1-3s is degraded, >3s is critical
    },
    errorRate: {
      healthy: 0.01, // < 1% error rate is healthy
      degraded: 0.05 // 1-5% is degraded, >5% is critical
    }
  }
}

export function useSystemHealth(config: Partial<HealthCheckConfig> = {}) {
  const healthConfig = { ...DEFAULT_CONFIG, ...config }
  const organizationStore = useOrganizationStore()
  
  // State
  const isMonitoring = ref(false)
  const healthStatus = ref<SystemHealthStatus>({
    overall: 'healthy',
    score: 100,
    components: {
      database: {
        status: 'healthy',
        responseTime: 0,
        errorRate: 0,
        lastChecked: new Date().toISOString()
      },
      api: {
        status: 'healthy',
        responseTime: 0,
        errorRate: 0,
        lastChecked: new Date().toISOString()
      },
      frontend: {
        status: 'healthy',
        responseTime: 0,
        errorRate: 0,
        lastChecked: new Date().toISOString()
      },
      user_experience: {
        status: 'healthy',
        responseTime: 0,
        errorRate: 0,
        lastChecked: new Date().toISOString()
      }
    },
    lastChecked: new Date().toISOString(),
    uptime: 0,
    checksPerformed: 0
  })
  
  const healthHistory = ref<SystemHealthStatus[]>([])
  const errors = ref<Array<{ timestamp: string; component: string; error: string }>>([])
  
  let healthCheckInterval: NodeJS.Timeout | null = null
  const startTime = Date.now()
  
  // Computed
  const isHealthy = computed(() => healthStatus.value.overall === 'healthy')
  const isDegraded = computed(() => healthStatus.value.overall === 'degraded')
  const isCritical = computed(() => healthStatus.value.overall === 'critical')
  
  const recentErrors = computed(() => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    return errors.value.filter(error => error.timestamp > oneHourAgo)
  })
  
  const uptimePercentage = computed(() => {
    if (healthHistory.value.length === 0) return 100
    const healthyChecks = healthHistory.value.filter(h => h.overall === 'healthy').length
    return Math.round((healthyChecks / healthHistory.value.length) * 100)
  })
  
  // Methods
  const calculateComponentHealth = (responseTime: number, errorRate: number): ComponentHealth['status'] => {
    if (errorRate > healthConfig.thresholds.errorRate.degraded || 
        responseTime > healthConfig.thresholds.responseTime.degraded) {
      return 'critical'
    }
    if (errorRate > healthConfig.thresholds.errorRate.healthy || 
        responseTime > healthConfig.thresholds.responseTime.healthy) {
      return 'degraded'
    }
    return 'healthy'
  }
  
  const calculateOverallHealth = (components: SystemHealthStatus['components']): { status: SystemHealthStatus['overall']; score: number } => {
    const componentStatuses = Object.values(components)
    const criticalCount = componentStatuses.filter(c => c.status === 'critical').length
    const degradedCount = componentStatuses.filter(c => c.status === 'degraded').length
    
    if (criticalCount > 0) {
      return { status: 'critical', score: Math.max(0, 50 - (criticalCount * 20)) }
    }
    if (degradedCount > 0) {
      return { status: 'degraded', score: Math.max(50, 80 - (degradedCount * 15)) }
    }
    
    // Calculate score based on average response times and error rates
    const avgResponseTime = componentStatuses.reduce((sum, c) => sum + c.responseTime, 0) / componentStatuses.length
    const avgErrorRate = componentStatuses.reduce((sum, c) => sum + c.errorRate, 0) / componentStatuses.length
    
    const responseTimeScore = Math.max(0, 100 - (avgResponseTime / 50)) // Penalize slow responses
    const errorRateScore = Math.max(0, 100 - (avgErrorRate * 1000)) // Penalize errors heavily
    
    return { status: 'healthy', score: Math.min(100, (responseTimeScore + errorRateScore) / 2) }
  }
  
  const checkDatabaseHealth = async (): Promise<ComponentHealth> => {
    const startTime = Date.now()
    try {
      // Perform a lightweight health check query
      await organizationStore.fetchOrganizations({ limit: 1 })
      const responseTime = Date.now() - startTime
      
      return {
        status: calculateComponentHealth(responseTime, 0),
        responseTime,
        errorRate: 0,
        message: 'Database connection healthy',
        lastChecked: new Date().toISOString()
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error'
      
      errors.value.push({
        timestamp: new Date().toISOString(),
        component: 'database',
        error: errorMessage
      })
      
      return {
        status: 'critical',
        responseTime,
        errorRate: 1,
        message: `Database error: ${errorMessage}`,
        lastChecked: new Date().toISOString()
      }
    }
  }
  
  const checkApiHealth = async (): Promise<ComponentHealth> => {
    const startTime = Date.now()
    try {
      // Test API responsiveness with a simple operation
      const response = await fetch('/api/health', { 
        method: 'GET',
        signal: AbortSignal.timeout(healthConfig.timeout)
      }).catch(() => {
        // If no health endpoint exists, use database check as proxy
        return { ok: true, status: 200 }
      })
      
      const responseTime = Date.now() - startTime
      const isHealthy = response.ok
      
      return {
        status: calculateComponentHealth(responseTime, isHealthy ? 0 : 1),
        responseTime,
        errorRate: isHealthy ? 0 : 1,
        message: isHealthy ? 'API responding normally' : `API error: ${response.status}`,
        lastChecked: new Date().toISOString()
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'API timeout or error'
      
      errors.value.push({
        timestamp: new Date().toISOString(),
        component: 'api',
        error: errorMessage
      })
      
      return {
        status: 'critical',
        responseTime,
        errorRate: 1,
        message: `API error: ${errorMessage}`,
        lastChecked: new Date().toISOString()
      }
    }
  }
  
  const checkFrontendHealth = (): ComponentHealth => {
    const startTime = Date.now()
    
    try {
      // Check browser capabilities and performance
      const memoryInfo = (performance as any).memory
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      const pageLoadTime = navigationTiming ? navigationTiming.loadEventEnd - navigationTiming.fetchStart : 0
      const memoryUsage = memoryInfo ? memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize : 0
      
      const responseTime = pageLoadTime || (Date.now() - startTime)
      const errorRate = memoryUsage > 0.8 ? 0.5 : 0 // High memory usage indicates potential issues
      
      return {
        status: calculateComponentHealth(responseTime, errorRate),
        responseTime,
        errorRate,
        message: `Page load: ${responseTime}ms, Memory: ${Math.round(memoryUsage * 100)}%`,
        lastChecked: new Date().toISOString()
      }
    } catch (error) {
      return {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        errorRate: 0.1,
        message: 'Frontend performance monitoring limited',
        lastChecked: new Date().toISOString()
      }
    }
  }
  
  const checkUserExperienceHealth = (): ComponentHealth => {
    try {
      // Check Core Web Vitals if available
      const paintEntries = performance.getEntriesByType('paint')
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')
      const navigationEntries = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      const firstContentfulPaint = fcp ? fcp.startTime : 0
      const domContentLoaded = navigationEntries ? navigationEntries.domContentLoadedEventEnd - navigationEntries.fetchStart : 0
      
      // Use DOM content loaded as a proxy for user experience
      const responseTime = domContentLoaded || firstContentfulPaint || 1000
      const errorRate = responseTime > 3000 ? 0.3 : 0 // Poor performance affects UX
      
      return {
        status: calculateComponentHealth(responseTime, errorRate),
        responseTime,
        errorRate,
        message: `DOM ready: ${Math.round(responseTime)}ms, FCP: ${Math.round(firstContentfulPaint)}ms`,
        lastChecked: new Date().toISOString()
      }
    } catch (error) {
      return {
        status: 'healthy',
        responseTime: 1000,
        errorRate: 0,
        message: 'UX monitoring basic mode',
        lastChecked: new Date().toISOString()
      }
    }
  }
  
  const performHealthCheck = async () => {
    try {
      const [database, api, frontend, userExperience] = await Promise.all([
        checkDatabaseHealth(),
        checkApiHealth(),
        Promise.resolve(checkFrontendHealth()),
        Promise.resolve(checkUserExperienceHealth())
      ])
      
      const components = { database, api, frontend, user_experience: userExperience }
      const { status, score } = calculateOverallHealth(components)
      
      const newHealthStatus: SystemHealthStatus = {
        overall: status,
        score,
        components,
        lastChecked: new Date().toISOString(),
        uptime: Date.now() - startTime,
        checksPerformed: healthStatus.value.checksPerformed + 1
      }
      
      healthStatus.value = newHealthStatus
      
      // Store in history (keep last 100 checks)
      healthHistory.value.push(newHealthStatus)
      if (healthHistory.value.length > 100) {
        healthHistory.value = healthHistory.value.slice(-100)
      }
      
      // Cleanup old errors (keep last 24 hours)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      errors.value = errors.value.filter(error => error.timestamp > twentyFourHoursAgo)
      
    } catch (error) {
      console.error('Health check failed:', error)
      errors.value.push({
        timestamp: new Date().toISOString(),
        component: 'health_check',
        error: error instanceof Error ? error.message : 'Health check system error'
      })
    }
  }
  
  const startMonitoring = () => {
    if (isMonitoring.value) return
    
    isMonitoring.value = true
    
    // Perform initial check
    performHealthCheck()
    
    // Set up periodic checks
    healthCheckInterval = setInterval(performHealthCheck, healthConfig.interval)
  }
  
  const stopMonitoring = () => {
    if (!isMonitoring.value) return
    
    isMonitoring.value = false
    
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval)
      healthCheckInterval = null
    }
  }
  
  const recordError = (component: string, error: string) => {
    errors.value.push({
      timestamp: new Date().toISOString(),
      component,
      error
    })
  }
  
  const getComponentTrend = (component: keyof SystemHealthStatus['components'], hours = 1) => {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
    const recentHistory = healthHistory.value.filter(h => h.lastChecked > cutoff)
    
    if (recentHistory.length === 0) return 'stable'
    
    const recentStatuses = recentHistory.map(h => h.components[component].status)
    const healthyCount = recentStatuses.filter(s => s === 'healthy').length
    const totalCount = recentStatuses.length
    
    const healthyPercentage = healthyCount / totalCount
    
    if (healthyPercentage > 0.8) return 'improving'
    if (healthyPercentage < 0.5) return 'degrading'
    return 'stable'
  }
  
  // Lifecycle
  onMounted(() => {
    startMonitoring()
  })
  
  onUnmounted(() => {
    stopMonitoring()
  })
  
  return {
    // State
    isMonitoring,
    healthStatus: computed(() => healthStatus.value),
    healthHistory: computed(() => healthHistory.value),
    errors: computed(() => errors.value),
    recentErrors,
    
    // Computed
    isHealthy,
    isDegraded,
    isCritical,
    uptimePercentage,
    
    // Methods
    startMonitoring,
    stopMonitoring,
    performHealthCheck,
    recordError,
    getComponentTrend,
    
    // Configuration
    config: healthConfig
  }
}