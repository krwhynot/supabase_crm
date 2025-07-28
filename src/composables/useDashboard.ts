/**
 * Dashboard Composable - Main dashboard state and functionality
 * Follows Vue 3 Composition API patterns with reactive state management
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/config/supabaseClient'
import type { 
  DashboardPreferences, 
  DashboardPreferencesInsert,
  DashboardPreferencesUpdate,
  DashboardLayout,
  DashboardFilters,
  WidgetConfig,
  DashboardTheme
} from '@/types/dashboard.types'

export function useDashboard() {
  // State
  const preferences = ref<DashboardPreferences | null>(null)
  const layout = ref<DashboardLayout>({
    widgets: [],
    theme: 'default',
    refreshInterval: 300,
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

  // Computed properties
  const visibleWidgets = computed(() => 
    layout.value.widgets.filter(widget => widget.visible)
  )

  const isDarkTheme = computed(() => 
    layout.value.theme === 'dark'
  )

  const refreshIntervalMs = computed(() => 
    layout.value.refreshInterval * 1000
  )

  // Dashboard initialization
  const initializeDashboard = async () => {
    isLoading.value = true
    error.value = null

    try {
      await loadPreferences()
      await refreshDashboardData()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to initialize dashboard'
      console.error('Dashboard initialization error:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Load user preferences
  const loadPreferences = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data, error: fetchError } = await supabase
        .from('dashboard_preferences')
        .select('*')
        .eq('user_id', user.user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (data) {
        preferences.value = data
        updateLayoutFromPreferences(data)
      } else {
        // Create default preferences
        await createDefaultPreferences(user.user.id)
      }
    } catch (err) {
      console.error('Error loading preferences:', err)
      throw err
    }
  }

  // Create default preferences for new users
  const createDefaultPreferences = async (userId: string) => {
    const defaultPreferences: DashboardPreferencesInsert = {
      user_id: userId,
      widget_layout: getDefaultWidgetLayout(),
      visible_widgets: getDefaultVisibleWidgets(),
      dashboard_theme: 'default',
      refresh_interval: 300
    }

    const { data, error: insertError } = await supabase
      .from('dashboard_preferences')
      .insert(defaultPreferences)
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    preferences.value = data
    updateLayoutFromPreferences(data)
  }

  // Update layout from preferences
  const updateLayoutFromPreferences = (prefs: DashboardPreferences) => {
    layout.value = {
      widgets: Array.isArray(prefs.widget_layout) ? prefs.widget_layout as unknown as WidgetConfig[] : [],
      theme: prefs.dashboard_theme as DashboardTheme,
      refreshInterval: prefs.refresh_interval,
      compactMode: false
    }
  }

  // Save preferences
  const savePreferences = async () => {
    if (!preferences.value) return

    const updates: DashboardPreferencesUpdate = {
      widget_layout: layout.value.widgets,
      visible_widgets: visibleWidgets.value.map(w => w.id),
      dashboard_theme: layout.value.theme,
      refresh_interval: layout.value.refreshInterval,
      updated_at: new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('dashboard_preferences')
      .update(updates)
      .eq('id', preferences.value.id)

    if (updateError) {
      throw updateError
    }

    // Update local preferences
    Object.assign(preferences.value, updates)
  }

  // Toggle widget visibility
  const toggleWidget = async (widgetId: string) => {
    const widget = layout.value.widgets.find(w => w.id === widgetId)
    if (widget) {
      widget.visible = !widget.visible
      await savePreferences()
    }
  }

  // Update theme
  const updateTheme = async (theme: DashboardTheme) => {
    layout.value.theme = theme
    await savePreferences()
  }

  // Update refresh interval
  const updateRefreshInterval = async (intervalSeconds: number) => {
    layout.value.refreshInterval = intervalSeconds
    await savePreferences()
  }

  // Refresh dashboard data
  const refreshDashboardData = async () => {
    isRefreshing.value = true
    error.value = null

    try {
      // Refresh analytics data through other composables
      lastUpdated.value = new Date()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to refresh dashboard'
      console.error('Dashboard refresh error:', err)
    } finally {
      isRefreshing.value = false
    }
  }

  // Auto-refresh setup
  let refreshInterval: NodeJS.Timeout | null = null

  const setupAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }

    if (layout.value.refreshInterval > 0) {
      refreshInterval = setInterval(() => {
        refreshDashboardData()
      }, refreshIntervalMs.value)
    }
  }

  const stopAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  }

  // Default configurations
  const getDefaultWidgetLayout = () => ([
    {
      id: 'contact-metrics',
      type: 'contact-metrics' as const,
      title: 'Contact Metrics',
      position: { x: 0, y: 0, row: 0, col: 0 },
      size: { width: 6, height: 4 },
      visible: true,
      settings: {}
    },
    {
      id: 'weekly-chart',
      type: 'weekly-chart' as const,
      title: 'Weekly Interactions',
      position: { x: 6, y: 0, row: 0, col: 1 },
      size: { width: 6, height: 4 },
      visible: true,
      settings: {}
    },
    {
      id: 'quick-actions',
      type: 'quick-actions' as const,
      title: 'Quick Actions',
      position: { x: 0, y: 4, row: 1, col: 0 },
      size: { width: 4, height: 3 },
      visible: true,
      settings: {}
    },
    {
      id: 'recent-contacts',
      type: 'recent-contacts' as const,
      title: 'Recent Contacts',
      position: { x: 4, y: 4, row: 1, col: 1 },
      size: { width: 8, height: 3 },
      visible: true,
      settings: {}
    }
  ])

  const getDefaultVisibleWidgets = () => [
    'contact-metrics',
    'weekly-chart', 
    'quick-actions',
    'recent-contacts'
  ]

  // Watch for layout changes to auto-save
  watch(
    () => layout.value,
    () => {
      if (preferences.value) {
        savePreferences().catch(console.error)
      }
    },
    { deep: true }
  )

  // Watch for refresh interval changes
  watch(
    () => layout.value.refreshInterval,
    () => setupAutoRefresh(),
    { immediate: false }
  )

  // Lifecycle hooks
  onMounted(() => {
    initializeDashboard()
    setupAutoRefresh()
  })

  onUnmounted(() => {
    stopAutoRefresh()
  })

  return {
    // State
    preferences,
    layout,
    filters,
    isLoading,
    isRefreshing,
    lastUpdated,
    error,

    // Computed
    visibleWidgets,
    isDarkTheme,
    refreshIntervalMs,

    // Methods
    initializeDashboard,
    loadPreferences,
    savePreferences,
    toggleWidget,
    updateTheme,
    updateRefreshInterval,
    refreshDashboardData,
    setupAutoRefresh,
    stopAutoRefresh
  }
}