import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useContactStore } from './contactStore'

/**
 * Dashboard Store - Manages dashboard data and state
 * Follows established Pinia patterns with reactive state management
 */
export const useDashboardStore = defineStore('dashboard', () => {
  // State
  const isLoading = ref(false)
  const errorMessage = ref('')
  const lastRefreshed = ref<Date | null>(null)
  
  // Dashboard preferences
  const preferences = ref({
    weekFilterEnabled: false,
    sidebarCollapsed: false,
    refreshInterval: 300000, // 5 minutes in milliseconds
    theme: 'light' as 'light' | 'dark'
  })

  // Widget visibility state
  const widgetVisibility = ref({
    stats: true,
    quickActions: true,
    recentActivity: true,
    weeklyFilter: true
  })

  // Get contact store for data access
  const contactStore = useContactStore()

  // Computed properties
  const dashboardStats = computed(() => ({
    totalContacts: contactStore.totalCount,
    recentContacts: Math.min(contactStore.totalCount, 5),
    organizations: new Set(
      contactStore.contacts
        .map(c => c.organization)
        .filter(Boolean)
    ).size,
    activeContacts: contactStore.contacts.filter(c => {
      const updateDate = c.updated_at || c.created_at
      return updateDate && new Date(updateDate).getTime() > Date.now() - (30 * 24 * 60 * 60 * 1000) // 30 days
    }).length
  }))

  const recentActivity = computed(() => {
    // Generate activity feed from recent contacts
    return contactStore.contacts
      .filter(contact => contact.created_at) // Ensure created_at exists
      .map(contact => ({
        id: contact.id,
        action: 'Contact Added',
        description: `${contact.first_name} ${contact.last_name} was added`,
        timestamp: new Date(contact.created_at!), // Non-null assertion after filter
        type: 'contact_created' as const
      }))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5) // Take only the 5 most recent after sorting
  })

  const isStale = computed(() => {
    if (!lastRefreshed.value) return true
    return Date.now() - lastRefreshed.value.getTime() > preferences.value.refreshInterval
  })

  // Actions
  const clearError = () => {
    errorMessage.value = ''
  }

  const setError = (message: string) => {
    errorMessage.value = message
    console.error('Dashboard Store Error:', message)
  }

  const refreshDashboard = async () => {
    try {
      isLoading.value = true
      clearError()

      // Refresh contact data which drives dashboard stats
      await contactStore.fetchContacts()
      
      lastRefreshed.value = new Date()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to refresh dashboard'
      setError(message)
    } finally {
      isLoading.value = false
    }
  }

  const updatePreferences = (newPreferences: Partial<typeof preferences.value>) => {
    preferences.value = { ...preferences.value, ...newPreferences }
    localStorage.setItem('dashboard-preferences', JSON.stringify(preferences.value))
  }

  const updateWidgetVisibility = (widgetKey: keyof typeof widgetVisibility.value, visible: boolean) => {
    widgetVisibility.value[widgetKey] = visible
    localStorage.setItem('dashboard-widgets', JSON.stringify(widgetVisibility.value))
  }

  const toggleWeekFilter = () => {
    updatePreferences({ weekFilterEnabled: !preferences.value.weekFilterEnabled })
  }

  const toggleSidebar = () => {
    updatePreferences({ sidebarCollapsed: !preferences.value.sidebarCollapsed })
  }

  const initializeDashboard = () => {
    // Restore preferences from localStorage
    const savedPreferences = localStorage.getItem('dashboard-preferences')
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences)
        preferences.value = { ...preferences.value, ...parsed }
      } catch (error) {
        console.warn('Failed to parse saved dashboard preferences:', error)
      }
    }

    // Restore widget visibility from localStorage
    const savedWidgets = localStorage.getItem('dashboard-widgets')
    if (savedWidgets) {
      try {
        const parsed = JSON.parse(savedWidgets)
        widgetVisibility.value = { ...widgetVisibility.value, ...parsed }
      } catch (error) {
        console.warn('Failed to parse saved widget visibility:', error)
      }
    }
  }

  const resetDashboard = () => {
    isLoading.value = false
    errorMessage.value = ''
    lastRefreshed.value = null
    preferences.value = {
      weekFilterEnabled: false,
      sidebarCollapsed: false,
      refreshInterval: 300000,
      theme: 'light'
    }
    widgetVisibility.value = {
      stats: true,
      quickActions: true,
      recentActivity: true,
      weeklyFilter: true
    }
    
    // Clear localStorage
    localStorage.removeItem('dashboard-preferences')
    localStorage.removeItem('dashboard-widgets')
  }

  const getFilteredData = (weekFilter: boolean = preferences.value.weekFilterEnabled) => {
    if (!weekFilter) {
      return {
        contacts: contactStore.contacts,
        stats: dashboardStats.value,
        activity: recentActivity.value
      }
    }

    // Calculate current week (Monday-based)
    const now = new Date()
    const dayOfWeek = now.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Handle Sunday (0) and other days
    const monday = new Date(now)
    monday.setDate(now.getDate() + mondayOffset)
    monday.setHours(0, 0, 0, 0)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    // Filter contacts created this week
    const weekContacts = contactStore.contacts.filter(contact => {
      if (!contact.created_at) return false
      const createdDate = new Date(contact.created_at)
      return createdDate >= monday && createdDate <= sunday
    })

    // Calculate week-specific stats
    const weekStats = {
      totalContacts: weekContacts.length,
      recentContacts: Math.min(weekContacts.length, 5),
      organizations: new Set(
        weekContacts
          .map(c => c.organization)
          .filter(Boolean)
      ).size,
      activeContacts: weekContacts.length
    }

    // Filter activity for this week
    const weekActivity = recentActivity.value.filter(activity =>
      activity.timestamp >= monday && activity.timestamp <= sunday
    )

    return {
      contacts: weekContacts,
      stats: weekStats,
      activity: weekActivity,
      weekRange: { start: monday, end: sunday }
    }
  }

  return {
    // State
    isLoading,
    errorMessage,
    lastRefreshed,
    preferences,
    widgetVisibility,
    
    // Computed
    dashboardStats,
    recentActivity,
    isStale,
    
    // Actions
    refreshDashboard,
    updatePreferences,
    updateWidgetVisibility,
    toggleWeekFilter,
    toggleSidebar,
    initializeDashboard,
    resetDashboard,
    getFilteredData,
    clearError
  }
})