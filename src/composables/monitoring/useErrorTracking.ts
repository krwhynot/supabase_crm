import { ref, computed, reactive } from 'vue'

/**
 * Error Tracking Composable
 * Comprehensive error collection, analysis, and alerting system
 */

export interface ErrorRecord {
  id: string
  message: string
  stack?: string
  source: 'javascript' | 'api' | 'database' | 'user_action' | 'system'
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: string
  url: string
  userAgent: string
  userId?: string
  context?: Record<string, any>
  resolved: boolean
  resolvedAt?: string
  resolvedBy?: string
  tags: string[]
  fingerprint: string // For grouping similar errors
}

export interface ErrorGroup {
  fingerprint: string
  message: string
  count: number
  firstSeen: string
  lastSeen: string
  severity: ErrorRecord['severity']
  source: ErrorRecord['source']
  resolved: boolean
  errors: ErrorRecord[]
}

export interface ErrorStatistics {
  total: number
  bySource: Record<ErrorRecord['source'], number>
  bySeverity: Record<ErrorRecord['severity'], number>
  errorRate: number // errors per minute
  uniqueErrors: number
  resolvedErrors: number
  averageResolutionTime: number // in minutes
}

export interface AlertRule {
  id: string
  name: string
  condition: {
    type: 'error_rate' | 'error_count' | 'new_error' | 'severity'
    threshold: number
    timeWindow: number // minutes
    severity?: ErrorRecord['severity']
    source?: ErrorRecord['source']
  }
  enabled: boolean
  webhookUrl?: string
  emailRecipients?: string[]
  cooldownPeriod: number // minutes
  lastTriggered?: string
}

export function useErrorTracking() {
  // State
  const errors = ref<ErrorRecord[]>([])
  const alertRules = ref<AlertRule[]>([])
  const isTracking = ref(true)
  const lastAlerts = reactive<Map<string, string>>(new Map()) // rule ID -> last triggered time
  
  // Computed
  const errorGroups = computed((): ErrorGroup[] => {
    const groups = new Map<string, ErrorGroup>()
    
    errors.value.forEach(error => {
      const existing = groups.get(error.fingerprint)
      
      if (existing) {
        existing.count++
        existing.lastSeen = error.timestamp
        existing.errors.push(error)
        
        // Update severity to highest
        const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 }
        if (severityLevels[error.severity] > severityLevels[existing.severity]) {
          existing.severity = error.severity
        }
      } else {
        groups.set(error.fingerprint, {
          fingerprint: error.fingerprint,
          message: error.message,
          count: 1,
          firstSeen: error.timestamp,
          lastSeen: error.timestamp,
          severity: error.severity,
          source: error.source,
          resolved: error.resolved,
          errors: [error]
        })
      }
    })
    
    return Array.from(groups.values()).sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
  })
  
  const statistics = computed((): ErrorStatistics => {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const recentErrors = errors.value.filter(e => new Date(e.timestamp) > oneHourAgo)
    
    const bySource: Record<ErrorRecord['source'], number> = {
      javascript: 0,
      api: 0,
      database: 0,
      user_action: 0,
      system: 0
    }
    
    const bySeverity: Record<ErrorRecord['severity'], number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    }
    
    errors.value.forEach(error => {
      bySource[error.source]++
      bySeverity[error.severity]++
    })
    
    const resolvedErrors = errors.value.filter(e => e.resolved)
    const avgResolutionTime = resolvedErrors.length > 0
      ? resolvedErrors.reduce((sum, error) => {
          if (error.resolvedAt) {
            const resolutionTime = new Date(error.resolvedAt).getTime() - new Date(error.timestamp).getTime()
            return sum + (resolutionTime / (1000 * 60)) // Convert to minutes
          }
          return sum
        }, 0) / resolvedErrors.length
      : 0
    
    return {
      total: errors.value.length,
      bySource,
      bySeverity,
      errorRate: recentErrors.length / 60, // errors per minute
      uniqueErrors: errorGroups.value.length,
      resolvedErrors: resolvedErrors.length,
      averageResolutionTime: avgResolutionTime
    }
  })
  
  const recentErrors = computed(() => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    return errors.value.filter(e => e.timestamp > oneHourAgo)
  })
  
  const criticalErrors = computed(() => {
    return errors.value.filter(e => e.severity === 'critical' && !e.resolved)
  })
  
  const unresolvedErrors = computed(() => {
    return errors.value.filter(e => !e.resolved)
  })
  
  // Methods
  const generateFingerprint = (message: string, stack?: string, source?: string): string => {
    // Create a fingerprint for grouping similar errors
    const stackLines = stack?.split('\n').slice(0, 3).join('|') || ''
    const content = `${source}:${message}:${stackLines}`
    
    // Simple hash function
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36)
  }
  
  const recordError = (
    message: string,
    options: {
      stack?: string
      source?: ErrorRecord['source']
      severity?: ErrorRecord['severity']
      context?: Record<string, any>
      tags?: string[]
      userId?: string
    } = {}
  ) => {
    if (!isTracking.value) return
    
    const error: ErrorRecord = {
      id: `error_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      message,
      stack: options.stack,
      source: options.source || 'javascript',
      severity: options.severity || 'medium',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: options.userId,
      context: options.context,
      resolved: false,
      tags: options.tags || [],
      fingerprint: generateFingerprint(message, options.stack, options.source)
    }
    
    errors.value.push(error)
    
    // Keep only last 2000 errors to prevent memory issues
    if (errors.value.length > 2000) {
      errors.value = errors.value.slice(-2000)
    }
    
    // Check alert rules
    checkAlertRules(error)
    
    return error
  }
  
  const recordJavaScriptError = (error: Error, context?: Record<string, any>) => {
    return recordError(error.message, {
      stack: error.stack,
      source: 'javascript',
      severity: 'high',
      context,
      tags: ['javascript', 'unhandled']
    })
  }
  
  const recordApiError = (
    message: string,
    statusCode?: number,
    endpoint?: string,
    context?: Record<string, any>
  ) => {
    const severity = statusCode && statusCode >= 500 ? 'high' : 'medium'
    
    return recordError(message, {
      source: 'api',
      severity,
      context: {
        statusCode,
        endpoint,
        ...context
      },
      tags: ['api', 'http']
    })
  }
  
  const recordDatabaseError = (message: string, query?: string, context?: Record<string, any>) => {
    return recordError(message, {
      source: 'database',
      severity: 'high',
      context: {
        query,
        ...context
      },
      tags: ['database', 'sql']
    })
  }
  
  const recordUserActionError = (
    action: string,
    message: string,
    context?: Record<string, any>
  ) => {
    return recordError(`User action failed: ${action} - ${message}`, {
      source: 'user_action',
      severity: 'medium',
      context: {
        action,
        ...context
      },
      tags: ['user_action', action]
    })
  }
  
  const resolveError = (errorId: string, resolvedBy?: string) => {
    const error = errors.value.find(e => e.id === errorId)
    if (error) {
      error.resolved = true
      error.resolvedAt = new Date().toISOString()
      error.resolvedBy = resolvedBy
    }
  }
  
  const resolveErrorGroup = (fingerprint: string, resolvedBy?: string) => {
    const groupErrors = errors.value.filter(e => e.fingerprint === fingerprint)
    groupErrors.forEach(error => {
      error.resolved = true
      error.resolvedAt = new Date().toISOString()
      error.resolvedBy = resolvedBy
    })
  }
  
  const addTag = (errorId: string, tag: string) => {
    const error = errors.value.find(e => e.id === errorId)
    if (error && !error.tags.includes(tag)) {
      error.tags.push(tag)
    }
  }
  
  const removeTag = (errorId: string, tag: string) => {
    const error = errors.value.find(e => e.id === errorId)
    if (error) {
      error.tags = error.tags.filter(t => t !== tag)
    }
  }
  
  const checkAlertRules = (error: ErrorRecord) => {
    alertRules.value.forEach(rule => {
      if (!rule.enabled) return
      
      const now = new Date()
      const lastTriggered = lastAlerts.get(rule.id)
      
      // Check cooldown period
      if (lastTriggered) {
        const cooldownEnd = new Date(lastTriggered)
        cooldownEnd.setMinutes(cooldownEnd.getMinutes() + rule.cooldownPeriod)
        if (now < cooldownEnd) return
      }
      
      let shouldTrigger = false
      
      switch (rule.condition.type) {
        case 'new_error':
          shouldTrigger = true
          break
          
        case 'severity':
          shouldTrigger = rule.condition.severity === error.severity
          break
          
        case 'error_rate':
          const windowStart = new Date(now.getTime() - rule.condition.timeWindow * 60 * 1000)
          const windowErrors = errors.value.filter(e => new Date(e.timestamp) > windowStart)
          const rate = windowErrors.length / rule.condition.timeWindow // errors per minute
          shouldTrigger = rate > rule.condition.threshold
          break
          
        case 'error_count':
          const countWindowStart = new Date(now.getTime() - rule.condition.timeWindow * 60 * 1000)
          const countWindowErrors = errors.value.filter(e => new Date(e.timestamp) > countWindowStart)
          shouldTrigger = countWindowErrors.length > rule.condition.threshold
          break
      }
      
      if (shouldTrigger) {
        triggerAlert(rule, error)
      }
    })
  }
  
  const triggerAlert = (rule: AlertRule, triggeringError: ErrorRecord) => {
    console.warn(`Alert triggered: ${rule.name}`, {
      rule,
      error: triggeringError,
      timestamp: new Date().toISOString()
    })
    
    lastAlerts.set(rule.id, new Date().toISOString())
    
    // In a real implementation, you would send webhooks, emails, etc.
    if (rule.webhookUrl) {
      // Send webhook notification
      console.log(`Would send webhook to: ${rule.webhookUrl}`)
    }
    
    if (rule.emailRecipients?.length) {
      // Send email notifications
      console.log(`Would send emails to: ${rule.emailRecipients.join(', ')}`)
    }
  }
  
  const addAlertRule = (rule: Omit<AlertRule, 'id'>) => {
    const newRule: AlertRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substring(7)}`
    }
    
    alertRules.value.push(newRule)
    return newRule
  }
  
  const removeAlertRule = (ruleId: string) => {
    const index = alertRules.value.findIndex(r => r.id === ruleId)
    if (index > -1) {
      alertRules.value.splice(index, 1)
      lastAlerts.delete(ruleId)
    }
  }
  
  const clearErrors = () => {
    errors.value = []
  }
  
  const exportErrors = (filters?: {
    startDate?: string
    endDate?: string
    source?: ErrorRecord['source']
    severity?: ErrorRecord['severity']
    resolved?: boolean
  }) => {
    let filteredErrors = errors.value
    
    if (filters) {
      filteredErrors = errors.value.filter(error => {
        if (filters.startDate && error.timestamp < filters.startDate) return false
        if (filters.endDate && error.timestamp > filters.endDate) return false
        if (filters.source && error.source !== filters.source) return false
        if (filters.severity && error.severity !== filters.severity) return false
        if (filters.resolved !== undefined && error.resolved !== filters.resolved) return false
        return true
      })
    }
    
    return {
      errors: filteredErrors,
      statistics: statistics.value,
      errorGroups: errorGroups.value,
      exportedAt: new Date().toISOString(),
      filters
    }
  }
  
  const getErrorTrend = (hours: number = 24) => {
    const now = new Date()
    const hourlyData: Array<{ hour: string; errorCount: number; uniqueErrors: number }> = []
    
    for (let i = hours - 1; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000)
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000)
      
      const hourErrors = errors.value.filter(e => {
        const errorTime = new Date(e.timestamp)
        return errorTime >= hourStart && errorTime < hourEnd
      })
      
      const uniqueFingerprints = new Set(hourErrors.map(e => e.fingerprint))
      
      hourlyData.push({
        hour: hourStart.toISOString().substring(0, 13) + ':00',
        errorCount: hourErrors.length,
        uniqueErrors: uniqueFingerprints.size
      })
    }
    
    return hourlyData
  }
  
  const startTracking = () => {
    isTracking.value = true
  }
  
  const stopTracking = () => {
    isTracking.value = false
  }
  
  // Set up global error handlers
  const setupGlobalErrorHandlers = () => {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      recordJavaScriptError(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    })
    
    // Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
      recordJavaScriptError(error, { type: 'unhandled_promise_rejection' })
    })
  }
  
  return {
    // State
    errors: computed(() => errors.value),
    alertRules: computed(() => alertRules.value),
    isTracking: computed(() => isTracking.value),
    
    // Computed
    errorGroups,
    statistics,
    recentErrors,
    criticalErrors,
    unresolvedErrors,
    
    // Methods
    recordError,
    recordJavaScriptError,
    recordApiError,
    recordDatabaseError,
    recordUserActionError,
    resolveError,
    resolveErrorGroup,
    addTag,
    removeTag,
    addAlertRule,
    removeAlertRule,
    clearErrors,
    exportErrors,
    getErrorTrend,
    startTracking,
    stopTracking,
    setupGlobalErrorHandlers
  }
}