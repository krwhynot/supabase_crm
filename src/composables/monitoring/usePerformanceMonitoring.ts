import { ref, computed, reactive } from 'vue'

/**
 * Performance Monitoring Composable
 * Tracks API response times, user interactions, and system performance metrics
 */

export interface PerformanceMetric {
  id: string
  name: string
  type: 'api_call' | 'user_interaction' | 'page_load' | 'database_query'
  duration: number
  timestamp: string
  success: boolean
  metadata?: Record<string, any>
}

export interface PerformanceStatistics {
  averageResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  successRate: number
  totalRequests: number
  errorCount: number
  slowestRequests: PerformanceMetric[]
  fastestRequests: PerformanceMetric[]
}

export interface PerformanceThresholds {
  acceptable: number // ms
  tolerable: number // ms
  // anything above tolerable is considered slow
}

const DEFAULT_THRESHOLDS: Record<PerformanceMetric['type'], PerformanceThresholds> = {
  api_call: { acceptable: 500, tolerable: 2000 },
  user_interaction: { acceptable: 100, tolerable: 300 },
  page_load: { acceptable: 2000, tolerable: 5000 },
  database_query: { acceptable: 200, tolerable: 1000 }
}

export function usePerformanceMonitoring() {
  // State
  const metrics = ref<PerformanceMetric[]>([])
  const isRecording = ref(true)
  const activeOperations = reactive<Map<string, { start: number; name: string; type: PerformanceMetric['type'] }>>(new Map())
  
  // Computed
  const statistics = computed((): Record<PerformanceMetric['type'], PerformanceStatistics> => {
    const result = {} as Record<PerformanceMetric['type'], PerformanceStatistics>
    
    const types: PerformanceMetric['type'][] = ['api_call', 'user_interaction', 'page_load', 'database_query']
    
    types.forEach(type => {
      const typeMetrics = metrics.value.filter(m => m.type === type)
      
      if (typeMetrics.length === 0) {
        result[type] = {
          averageResponseTime: 0,
          p95ResponseTime: 0,
          p99ResponseTime: 0,
          successRate: 0,
          totalRequests: 0,
          errorCount: 0,
          slowestRequests: [],
          fastestRequests: []
        }
        return
      }
      
      const durations = typeMetrics.map(m => m.duration).sort((a, b) => a - b)
      const successCount = typeMetrics.filter(m => m.success).length
      
      const p95Index = Math.floor(durations.length * 0.95)
      const p99Index = Math.floor(durations.length * 0.99)
      
      result[type] = {
        averageResponseTime: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        p95ResponseTime: durations[p95Index] || 0,
        p99ResponseTime: durations[p99Index] || 0,
        successRate: successCount / typeMetrics.length,
        totalRequests: typeMetrics.length,
        errorCount: typeMetrics.length - successCount,
        slowestRequests: [...typeMetrics].sort((a, b) => b.duration - a.duration).slice(0, 5),
        fastestRequests: [...typeMetrics].sort((a, b) => a.duration - b.duration).slice(0, 5)
      }
    })
    
    return result
  })
  
  const overallStatistics = computed((): PerformanceStatistics => {
    if (metrics.value.length === 0) {
      return {
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        successRate: 0,
        totalRequests: 0,
        errorCount: 0,
        slowestRequests: [],
        fastestRequests: []
      }
    }
    
    const durations = metrics.value.map(m => m.duration).sort((a, b) => a - b)
    const successCount = metrics.value.filter(m => m.success).length
    
    const p95Index = Math.floor(durations.length * 0.95)
    const p99Index = Math.floor(durations.length * 0.99)
    
    return {
      averageResponseTime: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      p95ResponseTime: durations[p95Index] || 0,
      p99ResponseTime: durations[p99Index] || 0,
      successRate: successCount / metrics.value.length,
      totalRequests: metrics.value.length,
      errorCount: metrics.value.length - successCount,
      slowestRequests: [...metrics.value].sort((a, b) => b.duration - a.duration).slice(0, 10),
      fastestRequests: [...metrics.value].sort((a, b) => a.duration - b.duration).slice(0, 10)
    }
  })
  
  const recentMetrics = computed(() => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    return metrics.value.filter(m => m.timestamp > oneHourAgo)
  })
  
  const slowRequests = computed(() => {
    return metrics.value.filter(metric => {
      const threshold = DEFAULT_THRESHOLDS[metric.type]
      return metric.duration > threshold.tolerable
    })
  })
  
  const performanceIssues = computed(() => {
    const issues: Array<{ type: string; message: string; severity: 'warning' | 'error' }> = []
    
    Object.entries(statistics.value).forEach(([type, stats]) => {
      const threshold = DEFAULT_THRESHOLDS[type as PerformanceMetric['type']]
      
      if (stats.averageResponseTime > threshold.tolerable) {
        issues.push({
          type,
          message: `Average ${type} response time (${Math.round(stats.averageResponseTime)}ms) exceeds tolerable threshold (${threshold.tolerable}ms)`,
          severity: 'error'
        })
      } else if (stats.averageResponseTime > threshold.acceptable) {
        issues.push({
          type,
          message: `Average ${type} response time (${Math.round(stats.averageResponseTime)}ms) exceeds acceptable threshold (${threshold.acceptable}ms)`,
          severity: 'warning'
        })
      }
      
      if (stats.successRate < 0.95) {
        issues.push({
          type,
          message: `${type} success rate (${Math.round(stats.successRate * 100)}%) is below 95%`,
          severity: 'error'
        })
      } else if (stats.successRate < 0.98) {
        issues.push({
          type,
          message: `${type} success rate (${Math.round(stats.successRate * 100)}%) is below 98%`,
          severity: 'warning'
        })
      }
    })
    
    return issues
  })
  
  // Methods
  const startOperation = (operationId: string, name: string, type: PerformanceMetric['type']) => {
    if (!isRecording.value) return
    
    activeOperations.set(operationId, {
      start: performance.now(),
      name,
      type
    })
  }
  
  const endOperation = (operationId: string, success: boolean = true, metadata?: Record<string, any>) => {
    if (!isRecording.value) return
    
    const operation = activeOperations.get(operationId)
    if (!operation) return
    
    const duration = performance.now() - operation.start
    
    const metric: PerformanceMetric = {
      id: operationId,
      name: operation.name,
      type: operation.type,
      duration,
      timestamp: new Date().toISOString(),
      success,
      metadata
    }
    
    metrics.value.push(metric)
    activeOperations.delete(operationId)
    
    // Keep only last 1000 metrics to prevent memory issues
    if (metrics.value.length > 1000) {
      metrics.value = metrics.value.slice(-1000)
    }
  }
  
  const recordMetric = (name: string, type: PerformanceMetric['type'], duration: number, success: boolean = true, metadata?: Record<string, any>) => {
    if (!isRecording.value) return
    
    const metric: PerformanceMetric = {
      id: `${type}_${Date.now()}_${Math.random()}`,
      name,
      type,
      duration,
      timestamp: new Date().toISOString(),
      success,
      metadata
    }
    
    metrics.value.push(metric)
    
    // Keep only last 1000 metrics
    if (metrics.value.length > 1000) {
      metrics.value = metrics.value.slice(-1000)
    }
  }
  
  const measureFunction = async <T>(
    fn: () => Promise<T>,
    name: string,
    type: PerformanceMetric['type'],
    metadata?: Record<string, any>
  ): Promise<T> => {
    const operationId = `${type}_${Date.now()}_${Math.random()}`
    startOperation(operationId, name, type)
    
    try {
      const result = await fn()
      endOperation(operationId, true, metadata)
      return result
    } catch (error) {
      endOperation(operationId, false, { 
        ...metadata, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      throw error
    }
  }
  
  const measureSyncFunction = <T>(
    fn: () => T,
    name: string,
    type: PerformanceMetric['type'],
    metadata?: Record<string, any>
  ): T => {
    const start = performance.now()
    
    try {
      const result = fn()
      const duration = performance.now() - start
      recordMetric(name, type, duration, true, metadata)
      return result
    } catch (error) {
      const duration = performance.now() - start
      recordMetric(name, type, duration, false, { 
        ...metadata, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      throw error
    }
  }
  
  const clearMetrics = () => {
    metrics.value = []
    activeOperations.clear()
  }
  
  const exportMetrics = () => {
    return {
      metrics: metrics.value,
      statistics: statistics.value,
      overallStatistics: overallStatistics.value,
      exportedAt: new Date().toISOString()
    }
  }
  
  const getMetricsByTimeRange = (startTime: string, endTime: string) => {
    return metrics.value.filter(m => m.timestamp >= startTime && m.timestamp <= endTime)
  }
  
  const getAverageResponseTimeByHour = (hours: number = 24) => {
    const now = new Date()
    const hourlyData: Array<{ hour: string; averageTime: number; requestCount: number }> = []
    
    for (let i = hours - 1; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000)
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000)
      
      const hourMetrics = metrics.value.filter(m => {
        const metricTime = new Date(m.timestamp)
        return metricTime >= hourStart && metricTime < hourEnd
      })
      
      const averageTime = hourMetrics.length > 0 
        ? hourMetrics.reduce((sum, m) => sum + m.duration, 0) / hourMetrics.length 
        : 0
      
      hourlyData.push({
        hour: hourStart.toISOString().substring(0, 13) + ':00',
        averageTime,
        requestCount: hourMetrics.length
      })
    }
    
    return hourlyData
  }
  
  const startRecording = () => {
    isRecording.value = true
  }
  
  const stopRecording = () => {
    isRecording.value = false
  }
  
  return {
    // State
    metrics: computed(() => metrics.value),
    isRecording: computed(() => isRecording.value),
    activeOperations: computed(() => Array.from(activeOperations.entries())),
    
    // Computed
    statistics,
    overallStatistics,
    recentMetrics,
    slowRequests,
    performanceIssues,
    
    // Methods
    startOperation,
    endOperation,
    recordMetric,
    measureFunction,
    measureSyncFunction,
    clearMetrics,
    exportMetrics,
    getMetricsByTimeRange,
    getAverageResponseTimeByHour,
    startRecording,
    stopRecording,
    
    // Configuration
    thresholds: DEFAULT_THRESHOLDS
  }
}