import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * Real User Monitoring (RUM) Composable
 * Tracks actual user experience metrics including Core Web Vitals,
 * user interactions, session data, and page performance
 */

export interface CoreWebVitals {
  FCP: number | null // First Contentful Paint
  LCP: number | null // Largest Contentful Paint
  FID: number | null // First Input Delay
  CLS: number | null // Cumulative Layout Shift
  TTFB: number | null // Time to First Byte
  INP: number | null // Interaction to Next Paint
}

export interface UserSession {
  sessionId: string
  userId?: string
  startTime: string
  endTime?: string
  duration?: number
  pageViews: PageView[]
  interactions: UserInteraction[]
  deviceInfo: DeviceInfo
  // connectionInfo: ConnectionInfo // Removed - not used
  vitals: CoreWebVitals
  bounced: boolean
  converted: boolean
}

export interface PageView {
  id: string
  url: string
  title: string
  timestamp: string
  loadTime: number
  timeOnPage?: number
  referrer?: string
  exitPage: boolean
}

export interface UserInteraction {
  id: string
  type: 'click' | 'scroll' | 'input' | 'form_submit' | 'navigation'
  element?: string
  timestamp: string
  responseTime?: number
  successful: boolean
  metadata?: Record<string, any>
}

export interface DeviceInfo {
  userAgent: string
  viewport: { width: number; height: number }
  screen: { width: number; height: number }
  devicePixelRatio: number
  platform: string
  language: string
  timezone: string
  cookiesEnabled: boolean
  javaScriptEnabled: boolean
}

export interface ConnectionInfo {
  effectiveType: string // '4g', '3g', '2g', 'slow-2g'
  downlink: number // Mbps
  rtt: number // Round trip time in ms
  saveData: boolean
}

export interface RUMStatistics {
  totalSessions: number
  averageSessionDuration: number
  bounceRate: number
  conversionRate: number
  averagePageLoadTime: number
  averageTimeOnPage: number
  uniqueUsers: number
  returningUsers: number
  topPages: Array<{ url: string; views: number; avgLoadTime: number }>
  deviceBreakdown: Record<string, number>
  browserBreakdown: Record<string, number>
  connectionBreakdown: Record<string, number>
}

export interface VitalsScore {
  FCP: 'good' | 'needs-improvement' | 'poor'
  LCP: 'good' | 'needs-improvement' | 'poor'
  FID: 'good' | 'needs-improvement' | 'poor'
  CLS: 'good' | 'needs-improvement' | 'poor'
  overall: 'good' | 'needs-improvement' | 'poor'
  score: number // 0-100
}

// Core Web Vitals thresholds (in milliseconds, except CLS which is unitless)
const VITALS_THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 }
}

export function useRealUserMonitoring() {
  // State
  const currentSession = ref<UserSession | null>(null)
  const sessions = ref<UserSession[]>([])
  const isMonitoring = ref(false)
  const vitals = ref<CoreWebVitals>({
    FCP: null,
    LCP: null,
    FID: null,
    CLS: null,
    TTFB: null,
    INP: null
  })
  
  let performanceObserver: PerformanceObserver | null = null
  let sessionStartTime: number = 0
  let currentPageView: PageView | null = null
  
  // Computed
  const statistics = computed((): RUMStatistics => {
    if (sessions.value.length === 0) {
      return {
        totalSessions: 0,
        averageSessionDuration: 0,
        bounceRate: 0,
        conversionRate: 0,
        averagePageLoadTime: 0,
        averageTimeOnPage: 0,
        uniqueUsers: 0,
        returningUsers: 0,
        topPages: [],
        deviceBreakdown: {},
        browserBreakdown: {},
        connectionBreakdown: {}
      }
    }
    
    const completedSessions = sessions.value.filter(s => s.duration)
    const allPageViews = sessions.value.flatMap(s => s.pageViews)
    
    // Calculate unique users (simplified - would use real user IDs in production)
    const uniqueUserIds = new Set(sessions.value.map(s => s.userId || s.sessionId))
    const returningUserSessions = sessions.value.filter(s => 
      sessions.value.filter(ss => ss.userId === s.userId).length > 1
    )
    
    // Page statistics
    const pageStats = new Map<string, { views: number; totalLoadTime: number }>()
    allPageViews.forEach(pv => {
      const existing = pageStats.get(pv.url) || { views: 0, totalLoadTime: 0 }
      pageStats.set(pv.url, {
        views: existing.views + 1,
        totalLoadTime: existing.totalLoadTime + pv.loadTime
      })
    })
    
    const topPages = Array.from(pageStats.entries())
      .map(([url, stats]) => ({
        url,
        views: stats.views,
        avgLoadTime: stats.totalLoadTime / stats.views
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)
    
    // Device/Browser breakdown
    const deviceBreakdown: Record<string, number> = {}
    const browserBreakdown: Record<string, number> = {}
    const connectionBreakdown: Record<string, number> = {}
    
    sessions.value.forEach(session => {
      // Simplified device detection
      const platform = session.deviceInfo.platform
      deviceBreakdown[platform] = (deviceBreakdown[platform] || 0) + 1
      
      // Simplified browser detection
      const browser = getBrowserName(session.deviceInfo.userAgent)
      browserBreakdown[browser] = (browserBreakdown[browser] || 0) + 1
      
      // Connection type
      const connection = 'unknown' // connectionInfo not available in deviceInfo
      connectionBreakdown[connection] = (connectionBreakdown[connection] || 0) + 1
    })
    
    return {
      totalSessions: sessions.value.length,
      averageSessionDuration: completedSessions.length > 0 
        ? completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / completedSessions.length 
        : 0,
      bounceRate: sessions.value.filter(s => s.bounced).length / sessions.value.length,
      conversionRate: sessions.value.filter(s => s.converted).length / sessions.value.length,
      averagePageLoadTime: allPageViews.length > 0 
        ? allPageViews.reduce((sum, pv) => sum + pv.loadTime, 0) / allPageViews.length 
        : 0,
      averageTimeOnPage: allPageViews.filter(pv => pv.timeOnPage).length > 0
        ? allPageViews.filter(pv => pv.timeOnPage).reduce((sum, pv) => sum + (pv.timeOnPage || 0), 0) / allPageViews.filter(pv => pv.timeOnPage).length
        : 0,
      uniqueUsers: uniqueUserIds.size,
      returningUsers: returningUserSessions.length,
      topPages,
      deviceBreakdown,
      browserBreakdown,
      connectionBreakdown
    }
  })
  
  const vitalsScore = computed((): VitalsScore => {
    const scores: Array<'good' | 'needs-improvement' | 'poor'> = []
    
    const fcpScore = getVitalScore('FCP', vitals.value.FCP)
    const lcpScore = getVitalScore('LCP', vitals.value.LCP)
    const fidScore = getVitalScore('FID', vitals.value.FID)
    const clsScore = getVitalScore('CLS', vitals.value.CLS)
    
    scores.push(fcpScore, lcpScore, fidScore, clsScore)
    
    const goodCount = scores.filter(s => s === 'good').length
    const poorCount = scores.filter(s => s === 'poor').length
    
    let overall: 'good' | 'needs-improvement' | 'poor'
    let score: number
    
    if (poorCount > 0) {
      overall = 'poor'
      score = Math.max(0, 50 - (poorCount * 10))
    } else if (goodCount === scores.length) {
      overall = 'good'
      score = 90 + (goodCount * 2.5)
    } else {
      overall = 'needs-improvement'
      score = 50 + (goodCount * 10)
    }
    
    return {
      FCP: fcpScore,
      LCP: lcpScore,
      FID: fidScore,
      CLS: clsScore,
      overall,
      score: Math.min(100, score)
    }
  })
  
  const recentSessions = computed(() => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    return sessions.value.filter(s => s.startTime > oneHourAgo)
  })
  
  // Methods
  const getVitalScore = (metric: keyof typeof VITALS_THRESHOLDS, value: number | null): 'good' | 'needs-improvement' | 'poor' => {
    if (value === null) return 'needs-improvement'
    
    const thresholds = VITALS_THRESHOLDS[metric]
    if (value <= thresholds.good) return 'good'
    if (value <= thresholds.poor) return 'needs-improvement'
    return 'poor'
  }
  
  const getBrowserName = (userAgent: string): string => {
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Other'
  }
  
  const generateSessionId = (): string => {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
  }
  
  const getDeviceInfo = (): DeviceInfo => {
    return {
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      screen: {
        width: screen.width,
        height: screen.height
      },
      devicePixelRatio: window.devicePixelRatio,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cookiesEnabled: navigator.cookieEnabled,
      javaScriptEnabled: true
    }
  }
  
  // getConnectionInfo removed - not used in interface
  
  const startSession = (userId?: string) => {
    if (currentSession.value) {
      endSession()
    }
    
    sessionStartTime = performance.now()
    
    currentSession.value = {
      sessionId: generateSessionId(),
      userId,
      startTime: new Date().toISOString(),
      pageViews: [],
      interactions: [],
      deviceInfo: getDeviceInfo(),
      // connectionInfo: getConnectionInfo(), // Not used in interface
      vitals: { ...vitals.value },
      bounced: false,
      converted: false
    }
    
    // Track initial page view
    recordPageView()
  }
  
  const endSession = () => {
    if (!currentSession.value) return
    
    const now = new Date()
    const duration = (performance.now() - sessionStartTime) / 1000 // Convert to seconds
    
    currentSession.value.endTime = now.toISOString()
    currentSession.value.duration = duration
    
    // Determine if session bounced (single page, short duration)
    currentSession.value.bounced = currentSession.value.pageViews.length <= 1 && duration < 30
    
    // Store completed session
    sessions.value.push({ ...currentSession.value })
    
    // Keep only last 500 sessions to prevent memory issues
    if (sessions.value.length > 500) {
      sessions.value = sessions.value.slice(-500)
    }
    
    currentSession.value = null
  }
  
  const recordPageView = (url?: string, title?: string) => {
    if (!currentSession.value) return
    
    const now = new Date().toISOString()
    
    // End previous page view
    if (currentPageView) {
      const timeOnPage = (Date.now() - new Date(currentPageView.timestamp).getTime()) / 1000
      currentPageView.timeOnPage = timeOnPage
      currentPageView.exitPage = false
    }
    
    // Get navigation timing for load time
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const loadTime = navigationEntry ? navigationEntry.loadEventEnd - navigationEntry.fetchStart : 0
    
    currentPageView = {
      id: `page_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      url: url || window.location.href,
      title: title || document.title,
      timestamp: now,
      loadTime,
      referrer: document.referrer,
      exitPage: true // Will be set to false when next page loads
    }
    
    currentSession.value.pageViews.push(currentPageView)
  }
  
  const recordInteraction = (
    type: UserInteraction['type'],
    element?: string,
    responseTime?: number,
    successful: boolean = true,
    metadata?: Record<string, any>
  ) => {
    if (!currentSession.value) return
    
    const interaction: UserInteraction = {
      id: `interaction_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      type,
      element,
      timestamp: new Date().toISOString(),
      responseTime,
      successful,
      metadata
    }
    
    currentSession.value.interactions.push(interaction)
  }
  
  const markConversion = (conversionType?: string, value?: number) => {
    if (!currentSession.value) return
    
    currentSession.value.converted = true
    
    recordInteraction('form_submit', undefined, undefined, true, {
      conversion: true,
      conversionType,
      value
    })
  }
  
  const collectCoreWebVitals = () => {
    if (!('PerformanceObserver' in window)) return
    
    try {
      // First Contentful Paint
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            vitals.value.FCP = entry.startTime
          }
        })
      })
      paintObserver.observe({ entryTypes: ['paint'] })
      
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        vitals.value.LCP = lastEntry.startTime
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      
      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          vitals.value.FID = entry.processingStart - entry.startTime
        })
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
      
      // Cumulative Layout Shift
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
            vitals.value.CLS = clsValue
          }
        })
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
      
      // Navigation timing for TTFB
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          vitals.value.TTFB = entry.responseStart - entry.requestStart
        })
      })
      navigationObserver.observe({ entryTypes: ['navigation'] })
      
      performanceObserver = paintObserver // Store reference for cleanup
      
    } catch (error) {
      console.warn('Could not initialize Core Web Vitals collection:', error)
    }
  }
  
  const setupInteractionListeners = () => {
    // Click tracking
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      const element = target.tagName.toLowerCase() + (target.id ? `#${target.id}` : '') + (target.className ? `.${target.className.split(' ').join('.')}` : '')
      recordInteraction('click', element)
    })
    
    // Scroll tracking (throttled)
    let scrollTimeout: NodeJS.Timeout
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        recordInteraction('scroll', 'window', undefined, true, {
          scrollY: window.scrollY,
          scrollPercentage: Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100)
        })
      }, 250)
    })
    
    // Form submission tracking
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement
      const formId = form.id || form.className || 'unknown'
      recordInteraction('form_submit', `form#${formId}`)
    })
  }
  
  const startMonitoring = (userId?: string) => {
    if (isMonitoring.value) return
    
    isMonitoring.value = true
    startSession(userId)
    collectCoreWebVitals()
    setupInteractionListeners()
  }
  
  const stopMonitoring = () => {
    if (!isMonitoring.value) return
    
    isMonitoring.value = false
    endSession()
    
    if (performanceObserver) {
      performanceObserver.disconnect()
      performanceObserver = null
    }
  }
  
  const exportSessionData = (filters?: {
    startDate?: string
    endDate?: string
    userId?: string
    bounced?: boolean
    converted?: boolean
  }) => {
    let filteredSessions = sessions.value
    
    if (filters) {
      filteredSessions = sessions.value.filter(session => {
        if (filters.startDate && session.startTime < filters.startDate) return false
        if (filters.endDate && session.startTime > filters.endDate) return false
        if (filters.userId && session.userId !== filters.userId) return false
        if (filters.bounced !== undefined && session.bounced !== filters.bounced) return false
        if (filters.converted !== undefined && session.converted !== filters.converted) return false
        return true
      })
    }
    
    return {
      sessions: filteredSessions,
      statistics: statistics.value,
      vitalsScore: vitalsScore.value,
      exportedAt: new Date().toISOString(),
      filters
    }
  }
  
  const getSessionTrend = (hours: number = 24) => {
    const now = new Date()
    const hourlyData: Array<{ hour: string; sessionCount: number; bounceRate: number; conversionRate: number }> = []
    
    for (let i = hours - 1; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000)
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000)
      
      const hourSessions = sessions.value.filter(s => {
        const sessionTime = new Date(s.startTime)
        return sessionTime >= hourStart && sessionTime < hourEnd
      })
      
      const bounced = hourSessions.filter(s => s.bounced).length
      const converted = hourSessions.filter(s => s.converted).length
      
      hourlyData.push({
        hour: hourStart.toISOString().substring(0, 13) + ':00',
        sessionCount: hourSessions.length,
        bounceRate: hourSessions.length > 0 ? bounced / hourSessions.length : 0,
        conversionRate: hourSessions.length > 0 ? converted / hourSessions.length : 0
      })
    }
    
    return hourlyData
  }
  
  // Lifecycle
  onMounted(() => {
    // Auto-start monitoring if not already started
    if (!isMonitoring.value) {
      startMonitoring()
    }
  })
  
  onUnmounted(() => {
    // Clean up when component unmounts
    stopMonitoring()
  })
  
  return {
    // State
    currentSession: computed(() => currentSession.value),
    sessions: computed(() => sessions.value),
    isMonitoring: computed(() => isMonitoring.value),
    vitals: computed(() => vitals.value),
    
    // Computed
    statistics,
    vitalsScore,
    recentSessions,
    
    // Methods
    startMonitoring,
    stopMonitoring,
    recordPageView,
    recordInteraction,
    markConversion,
    exportSessionData,
    getSessionTrend
  }
}