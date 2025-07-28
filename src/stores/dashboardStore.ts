import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/config/supabaseClient'
import type { 
  DashboardPreferences,
  DashboardPreferencesInsert,
  DashboardPreferencesUpdate,
  DashboardLayout,
  DashboardTheme,
  WidgetConfig,
  ContactMetrics,
  OrganizationMetrics,
  InteractionData,
  WeekFilter,
  DashboardFilters
} from '@/types/dashboard.types'

/**
 * Dashboard Store - Manages dashboard state and preferences
 * Follows established Pinia patterns with reactive state management
 */
export const useDashboardStore = defineStore('dashboard', () => {
  // Local storage keys
  const STORAGE_KEYS = {
    THEME: 'dashboard-theme',
    REFRESH_INTERVAL: 'dashboard-refresh-interval',
    WIDGET_VISIBILITY: 'dashboard-widget-visibility',
    LAST_UPDATE: 'dashboard-last-update'
  } as const
  // State
  const preferences = ref<DashboardPreferences | null>(null)
  const layout = ref<DashboardLayout>({
    widgets: [],
    theme: 'default',
    refreshInterval: 300000, // 5 minutes
    compactMode: false
  })
  
  const filters = ref<DashboardFilters>({
    selectedWeek: {
      weekStart: new Date(),
      weekEnd: new Date(),
      label: 'Current Week'
    }
  })
  
  const isLoading = ref(false)
  const isRefreshing = ref(false)
  const lastUpdated = ref<Date | null>(null)
  const error = ref<string | null>(null)
  
  // Analytics state
  const contactMetrics = ref<ContactMetrics>({
    totalContacts: 0,
    contactsThisWeek: 0,
    contactsThisMonth: 0,
    uniqueOrganizations: 0,
    growthRate: 0,
    weeklyGrowth: []
  })
  
  const organizationMetrics = ref<OrganizationMetrics>({
    topOrganizations: [],
    organizationCount: 0,
    averageContactsPerOrg: 0
  })
  
  const interactionData = ref<InteractionData[]>([])
  
  // Demo mode detection (following established pattern)
  const isDemoMode = computed(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    return !supabaseUrl || !supabaseKey || 
           supabaseUrl === 'your-supabase-project-url' || 
           supabaseKey === 'your-supabase-anon-key'
  })
  
  // Demo dashboard data
  const demoContactMetrics: ContactMetrics = {
    totalContacts: 247,
    contactsThisWeek: 18,
    contactsThisMonth: 73,
    uniqueOrganizations: 42,
    growthRate: 12.5,
    weeklyGrowth: [8, 12, 15, 18, 22, 16, 18]
  }
  
  const demoOrganizationMetrics: OrganizationMetrics = {
    topOrganizations: [
      { name: 'Acme Corporation', contactCount: 23, firstContactDate: '2024-01-15', latestContactDate: '2024-01-28', avgDaysSinceContact: 3.5 },
      { name: 'Tech Solutions Inc', contactCount: 18, firstContactDate: '2024-01-10', latestContactDate: '2024-01-27', avgDaysSinceContact: 2.1 },
      { name: 'Global Industries', contactCount: 15, firstContactDate: '2024-01-12', latestContactDate: '2024-01-26', avgDaysSinceContact: 4.2 },
      { name: 'Innovation Labs', contactCount: 12, firstContactDate: '2024-01-08', latestContactDate: '2024-01-25', avgDaysSinceContact: 5.8 },
      { name: 'Digital Dynamics', contactCount: 10, firstContactDate: '2024-01-14', latestContactDate: '2024-01-24', avgDaysSinceContact: 3.0 }
    ],
    organizationCount: 42,
    averageContactsPerOrg: 5.9
  }
  
  const demoInteractionData: InteractionData[] = [
    { weekStart: '2024-01-22', interactionCount: 45, organizationsContacted: 12, uniqueEmails: 38, organizationsList: ['Acme Corp', 'Tech Solutions', 'Global Industries'] },
    { weekStart: '2024-01-15', interactionCount: 52, organizationsContacted: 15, uniqueEmails: 43, organizationsList: ['Innovation Labs', 'Digital Dynamics', 'Acme Corp'] },
    { weekStart: '2024-01-08', interactionCount: 38, organizationsContacted: 11, uniqueEmails: 32, organizationsList: ['Tech Solutions', 'Global Industries', 'Innovation Labs'] },
    { weekStart: '2024-01-01', interactionCount: 29, organizationsContacted: 9, uniqueEmails: 25, organizationsList: ['Digital Dynamics', 'Acme Corp', 'Tech Solutions'] }
  ]
  
  // Default widget configuration
  const defaultWidgets: WidgetConfig[] = [
    {
      id: 'contact-metrics',
      type: 'contact-metrics',
      title: 'Contact Overview',
      position: { x: 0, y: 0, row: 0, col: 0 },
      size: { width: 1, height: 1 },
      visible: true,
      settings: { showGrowthRate: true, timeRange: 'month' }
    },
    {
      id: 'weekly-chart',
      type: 'weekly-chart',
      title: 'Weekly Interactions',
      position: { x: 1, y: 0, row: 0, col: 1 },
      size: { width: 2, height: 1 },
      visible: true,
      settings: { chartType: 'bar', showLegend: true }
    },
    {
      id: 'organization-metrics',
      type: 'organization-metrics',
      title: 'Top Organizations',
      position: { x: 0, y: 1, row: 1, col: 0 },
      size: { width: 1, height: 1 },
      visible: true,
      settings: {}
    },
    {
      id: 'quick-actions',
      type: 'quick-actions',
      title: 'Quick Actions',
      position: { x: 1, y: 1, row: 1, col: 1 },
      size: { width: 1, height: 1 },
      visible: true,
      settings: {}
    }
  ]
  
  // Computed properties
  const dashboardState = computed(() => ({
    preferences: preferences.value,
    layout: layout.value,
    filters: filters.value,
    isLoading: isLoading.value,
    isRefreshing: isRefreshing.value,
    lastUpdated: lastUpdated.value,
    error: error.value
  }))
  
  const visibleWidgets = computed(() => 
    layout.value.widgets.filter(widget => widget.visible)
  )
  
  const currentTheme = computed(() => layout.value.theme)
  
  const autoRefreshInterval = computed(() => layout.value.refreshInterval)
  
  const hasPreferences = computed(() => !!preferences.value)
  
  const isInitialized = computed(() => 
    hasPreferences.value || isDemoMode.value
  )
  
  // Actions
  const initializeDashboard = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      if (isDemoMode.value) {
        // Demo mode initialization
        layout.value.widgets = defaultWidgets
        contactMetrics.value = demoContactMetrics
        organizationMetrics.value = demoOrganizationMetrics
        interactionData.value = demoInteractionData
        lastUpdated.value = new Date()
        
        console.log('Dashboard initialized in demo mode')
      } else {
        // Load user preferences
        await loadPreferences()
        await refreshAnalytics()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to initialize dashboard'
      console.error('Dashboard initialization error:', err)
    } finally {
      isLoading.value = false
    }
  }
  
  const loadPreferences = async () => {
    if (isDemoMode.value) return
    
    try {
      const { data: authUser } = await supabase.auth.getUser()
      if (!authUser.user) {
        throw new Error('User not authenticated')
      }
      
      const { data, error: fetchError } = await supabase
        .from('dashboard_preferences')
        .select('*')
        .eq('user_id', authUser.user.id)
        .single()
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for new users
        throw fetchError
      }
      
      if (data) {
        preferences.value = data
        updateLayoutFromPreferences(data)
      } else {
        // Create default preferences for new user
        await createDefaultPreferences()
      }
    } catch (err) {
      console.error('Error loading preferences:', err)
      // Fallback to default layout
      layout.value.widgets = defaultWidgets
    }
  }
  
  const createDefaultPreferences = async () => {
    if (isDemoMode.value) return
    
    try {
      const { data: authUser } = await supabase.auth.getUser()
      if (!authUser.user) return
      
      const defaultPreferences: DashboardPreferencesInsert = {
        user_id: authUser.user.id,
        widget_layout: JSON.parse(JSON.stringify(defaultWidgets)) as any,
        dashboard_theme: 'default',
        refresh_interval: 300000
      }
      
      const { data, error: insertError } = await supabase
        .from('dashboard_preferences')
        .insert(defaultPreferences)
        .select()
        .single()
      
      if (insertError) throw insertError
      
      preferences.value = data
      layout.value.widgets = defaultWidgets
    } catch (err) {
      console.error('Error creating default preferences:', err)
    }
  }
  
  const updateLayoutFromPreferences = (prefs: DashboardPreferences) => {
    let widgets: WidgetConfig[] = defaultWidgets
    
    try {
      if (Array.isArray(prefs.widget_layout)) {
        widgets = prefs.widget_layout as unknown as WidgetConfig[]
      }
    } catch (err) {
      console.warn('Failed to parse widget layout, using defaults:', err)
    }
    
    layout.value = {
      widgets,
      theme: prefs.dashboard_theme as DashboardTheme,
      refreshInterval: prefs.refresh_interval,
      compactMode: false
    }
  }
  
  const savePreferences = async () => {
    if (isDemoMode.value || !preferences.value) return
    
    try {
      const updateData: DashboardPreferencesUpdate = {
        widget_layout: JSON.parse(JSON.stringify(layout.value.widgets)) as any,
        dashboard_theme: layout.value.theme,
        refresh_interval: layout.value.refreshInterval,
        updated_at: new Date().toISOString()
      }
      
      const { error: updateError } = await supabase
        .from('dashboard_preferences')
        .update(updateData)
        .eq('id', preferences.value.id)
      
      if (updateError) throw updateError
      
      console.log('Dashboard preferences saved successfully')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to save preferences'
      console.error('Error saving preferences:', err)
    }
  }
  
  const updateTheme = async (theme: DashboardTheme) => {
    layout.value.theme = theme
    await savePreferencesWithRetry()
  }
  
  const updateRefreshInterval = async (interval: number) => {
    layout.value.refreshInterval = interval
    await savePreferencesWithRetry()
  }
  
  const updateWidgetVisibility = async (widgetId: string, visible: boolean) => {
    const widget = layout.value.widgets.find(w => w.id === widgetId)
    if (widget) {
      widget.visible = visible
      await savePreferencesWithRetry()
    }
  }
  
  const updateWidgetPosition = async (widgetId: string, position: WidgetConfig['position']) => {
    const widget = layout.value.widgets.find(w => w.id === widgetId)
    if (widget) {
      widget.position = position
      await savePreferencesWithRetry()
    }
  }
  
  const updateWidgetSettings = async (widgetId: string, settings: Record<string, any>) => {
    const widget = layout.value.widgets.find(w => w.id === widgetId)
    if (widget) {
      widget.settings = { ...widget.settings, ...settings }
      await savePreferencesWithRetry()
    }
  }
  
  const refreshAnalytics = async () => {
    if (isDemoMode.value) {
      // In demo mode, simulate refresh with demo data
      contactMetrics.value = demoContactMetrics
      organizationMetrics.value = demoOrganizationMetrics
      interactionData.value = demoInteractionData
      lastUpdated.value = new Date()
      return
    }
    
    isRefreshing.value = true
    error.value = null
    
    try {
      // Fetch analytics data from Supabase views
      const [contactData, orgData, weeklyData] = await Promise.all([
        supabase.from('dashboard_contact_analytics').select('*').limit(30),
        supabase.from('dashboard_organization_analytics').select('*').limit(20),
        supabase.from('dashboard_weekly_interactions').select('*').limit(10)
      ])
      
      if (contactData.error) throw contactData.error
      if (orgData.error) throw orgData.error
      if (weeklyData.error) throw weeklyData.error
      
      // Process contact metrics
      const contacts = contactData.data || []
      if (contacts.length > 0) {
        const totals = contacts.reduce((acc, item) => ({
          total: acc.total + (item.total_contacts || 0),
          thisWeek: acc.thisWeek + (item.contacts_this_week || 0),
          thisMonth: acc.thisMonth + (item.contacts_this_month || 0),
          orgs: acc.orgs + (item.unique_organizations || 0)
        }), { total: 0, thisWeek: 0, thisMonth: 0, orgs: 0 })
        
        contactMetrics.value = {
          totalContacts: totals.total,
          contactsThisWeek: totals.thisWeek,
          contactsThisMonth: totals.thisMonth,
          uniqueOrganizations: totals.orgs,
          growthRate: totals.thisMonth > 0 ? 
            ((totals.thisMonth - (totals.total - totals.thisMonth)) / Math.max(1, totals.total - totals.thisMonth)) * 100 : 0,
          weeklyGrowth: contacts.slice(-7).map(item => item.daily_contact_count || 0)
        }
      }
      
      // Process organization metrics
      const orgs = orgData.data || []
      if (orgs.length > 0) {
        organizationMetrics.value = {
          topOrganizations: orgs
            .filter(org => org.organization && org.contact_count)
            .sort((a, b) => (b.contact_count || 0) - (a.contact_count || 0))
            .slice(0, 10)
            .map(org => ({
              name: org.organization || 'Unknown',
              contactCount: org.contact_count || 0,
              firstContactDate: org.first_contact_date || '',
              latestContactDate: org.latest_contact_date || '',
              avgDaysSinceContact: Math.round((org.avg_days_since_contact || 0) * 10) / 10
            })),
          organizationCount: orgs.length,
          averageContactsPerOrg: orgs.length > 0 ? 
            Math.round((orgs.reduce((sum, org) => sum + (org.contact_count || 0), 0) / orgs.length) * 10) / 10 : 0
        }
      }
      
      // Process interaction data
      const weekly = weeklyData.data || []
      interactionData.value = weekly
        .filter(week => week.week_start && week.interaction_count)
        .sort((a, b) => new Date(b.week_start!).getTime() - new Date(a.week_start!).getTime())
        .slice(0, 8)
        .map(week => ({
          weekStart: week.week_start!,
          interactionCount: week.interaction_count || 0,
          organizationsContacted: week.organizations_contacted || 0,
          uniqueEmails: week.unique_emails || 0,
          organizationsList: Array.isArray(week.organizations_list) ? week.organizations_list : []
        }))
        .reverse()
      
      lastUpdated.value = new Date()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to refresh analytics'
      console.error('Analytics refresh error:', err)
    } finally {
      isRefreshing.value = false
    }
  }
  
  const updateWeekFilter = (weekFilter: WeekFilter) => {
    filters.value.selectedWeek = weekFilter
    // Trigger analytics refresh for new week
    refreshAnalytics()
  }
  
  const resetToDefaults = async () => {
    layout.value = {
      widgets: [...defaultWidgets],
      theme: 'default',
      refreshInterval: 300000,
      compactMode: false
    }
    
    await savePreferences()
  }
  
  const clearError = () => {
    error.value = null
  }
  
  // Persistence helpers
  const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(key)
      if (saved !== null) {
        return JSON.parse(saved)
      }
    } catch (err) {
      console.warn(`Failed to load ${key} from localStorage:`, err)
    }
    return defaultValue
  }
  
  const saveToLocalStorage = <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (err) {
      console.warn(`Failed to save ${key} to localStorage:`, err)
    }
  }
  
  const removeFromLocalStorage = (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch (err) {
      console.warn(`Failed to remove ${key} from localStorage:`, err)
    }
  }
  
  // Enhanced persistence for offline functionality
  const persistThemeLocally = () => {
    saveToLocalStorage(STORAGE_KEYS.THEME, layout.value.theme)
  }
  
  const persistRefreshIntervalLocally = () => {
    saveToLocalStorage(STORAGE_KEYS.REFRESH_INTERVAL, layout.value.refreshInterval)
  }
  
  const persistWidgetVisibilityLocally = () => {
    const visibility = layout.value.widgets.reduce((acc, widget) => {
      acc[widget.id] = widget.visible
      return acc
    }, {} as Record<string, boolean>)
    saveToLocalStorage(STORAGE_KEYS.WIDGET_VISIBILITY, visibility)
  }
  
  const loadLocalPreferences = () => {
    // Load theme
    const savedTheme = loadFromLocalStorage(STORAGE_KEYS.THEME, 'default' as DashboardTheme)
    layout.value.theme = savedTheme
    
    // Load refresh interval
    const savedInterval = loadFromLocalStorage(STORAGE_KEYS.REFRESH_INTERVAL, 300000)
    layout.value.refreshInterval = savedInterval
    
    // Load widget visibility
    const savedVisibility = loadFromLocalStorage(STORAGE_KEYS.WIDGET_VISIBILITY, {} as Record<string, boolean>)
    layout.value.widgets.forEach(widget => {
      if (savedVisibility[widget.id] !== undefined) {
        widget.visible = savedVisibility[widget.id]
      }
    })
  }
  
  const clearLocalPreferences = () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      removeFromLocalStorage(key)
    })
  }
  
  // Enhanced error handling
  const handleError = (operation: string, err: unknown): string => {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
    const fullMessage = `${operation}: ${errorMessage}`
    
    console.error(fullMessage, err)
    error.value = fullMessage
    
    // Save error details for debugging
    saveToLocalStorage('dashboard-last-error', {
      operation,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      stack: err instanceof Error ? err.stack : undefined
    })
    
    return fullMessage
  }
  
  const retryOperation = async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T | null> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (err) {
        if (attempt === maxRetries) {
          console.error(`Operation failed after ${maxRetries} attempts:`, err)
          return null
        }
        
        console.warn(`Operation attempt ${attempt} failed, retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        delay *= 2 // Exponential backoff
      }
    }
    return null
  }
  
  const validateNetworkConnection = async (): Promise<boolean> => {
    try {
      if (!navigator.onLine) {
        return false
      }
      
      // Simple connectivity check
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache'
      })
      return response.ok
    } catch {
      return false
    }
  }
  
  // Enhanced save with offline support
  const savePreferencesWithRetry = async (): Promise<boolean> => {
    if (isDemoMode.value) {
      persistThemeLocally()
      persistRefreshIntervalLocally()
      persistWidgetVisibilityLocally()
      return true
    }
    
    // Check network connectivity
    const isOnline = await validateNetworkConnection()
    if (!isOnline) {
      // Save locally for later sync
      persistThemeLocally()
      persistRefreshIntervalLocally()
      persistWidgetVisibilityLocally()
      console.warn('Offline: preferences saved locally, will sync when online')
      return false
    }
    
    // Attempt save with retry logic
    const result = await retryOperation(savePreferences, 3, 1000)
    if (result !== null) {
      // Also persist locally as backup
      persistThemeLocally()
      persistRefreshIntervalLocally()
      persistWidgetVisibilityLocally()
      return true
    } else {
      handleError('Save preferences with retry', new Error('All retry attempts failed'))
      return false
    }
  }
  
  // Recovery mechanisms
  const recoverFromError = async () => {
    clearError()
    
    try {
      // Attempt to reload preferences
      if (!isDemoMode.value) {
        await loadPreferences()
      }
      
      // If that fails, load from localStorage
      if (!hasPreferences.value && !isDemoMode.value) {
        loadLocalPreferences()
        console.log('Recovered preferences from localStorage')
      }
      
      // Last resort: use defaults
      if (!hasPreferences.value && !isDemoMode.value) {
        layout.value.widgets = [...defaultWidgets]
        console.log('Using default preferences for recovery')
      }
    } catch (err) {
      handleError('Error recovery', err)
    }
  }
  
  // Return store interface
  return {
    // State
    preferences,
    layout,
    filters,
    isLoading,
    isRefreshing,
    lastUpdated,
    error,
    contactMetrics,
    organizationMetrics,
    interactionData,
    
    // Computed
    isDemoMode,
    dashboardState,
    visibleWidgets,
    currentTheme,
    autoRefreshInterval,
    hasPreferences,
    isInitialized,
    
    // Actions
    initializeDashboard,
    loadPreferences,
    savePreferences,
    updateTheme,
    updateRefreshInterval,
    updateWidgetVisibility,
    updateWidgetPosition,
    updateWidgetSettings,
    refreshAnalytics,
    updateWeekFilter,
    resetToDefaults,
    clearError,
    
    // Enhanced persistence & error handling
    savePreferencesWithRetry,
    loadLocalPreferences,
    clearLocalPreferences,
    recoverFromError,
    handleError,
    retryOperation,
    validateNetworkConnection
  }
})