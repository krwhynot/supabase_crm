<template>
  <div class="max-w-4xl mx-auto">
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-2">Preferences</h1>
      <p class="text-muted-foreground">Customize your application settings and preferences</p>
    </div>

    <!-- Preferences Content -->
    <div class="space-y-6">
      <!-- Theme Settings Card -->
      <div class="bg-surface-elevated rounded-lg border border-border p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4 flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          Appearance
        </h2>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <label class="block text-sm font-medium text-foreground">Theme</label>
              <p class="text-xs text-muted-foreground">Choose your preferred color scheme</p>
            </div>
            <ThemeToggle />
          </div>
          
          <div class="border-t border-border pt-4">
            <div class="flex items-center justify-between">
              <div>
                <label class="block text-sm font-medium text-foreground">Sidebar Collapsed</label>
                <p class="text-xs text-muted-foreground">Keep sidebar collapsed by default</p>
              </div>
              <button
                @click="toggleSidebarCollapsed"
                :class="[
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                  sidebarCollapsed ? 'bg-primary-600' : 'bg-gray-200'
                ]"
              >
                <span
                  :class="[
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    sidebarCollapsed ? 'translate-x-6' : 'translate-x-1'
                  ]"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Dashboard Settings Card -->
      <div class="bg-surface-elevated rounded-lg border border-border p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4 flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Dashboard
        </h2>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <label class="block text-sm font-medium text-foreground">Current Week Filter</label>
              <p class="text-xs text-muted-foreground">Show only current week data by default</p>
            </div>
            <button
              @click="toggleWeekFilter"
              :class="[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                weekFilterEnabled ? 'bg-primary-600' : 'bg-gray-200'
              ]"
            >
              <span
                :class="[
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  weekFilterEnabled ? 'translate-x-6' : 'translate-x-1'
                ]"
              />
            </button>
          </div>

          <div class="border-t border-border pt-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">Auto-refresh Interval</label>
              <select 
                v-model="refreshInterval" 
                @change="updateRefreshInterval"
                class="w-full px-3 py-2 border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500 text-foreground"
              >
                <option value="30000">30 seconds</option>
                <option value="60000">1 minute</option>
                <option value="300000">5 minutes</option>
                <option value="600000">10 minutes</option>
                <option value="1800000">30 minutes</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Data & Privacy Card -->
      <div class="bg-surface-elevated rounded-lg border border-border p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4 flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Data & Privacy
        </h2>
        
        <div class="space-y-4">
          <div>
            <button class="w-full text-left px-4 py-3 bg-surface-secondary hover:bg-surface-tertiary rounded-lg border border-border transition-colors">
              <div class="font-medium text-foreground">Export Data</div>
              <div class="text-sm text-muted-foreground">Download a copy of your data</div>
            </button>
          </div>
          
          <div>
            <button class="w-full text-left px-4 py-3 bg-surface-secondary hover:bg-surface-tertiary rounded-lg border border-border transition-colors">
              <div class="font-medium text-foreground">Privacy Settings</div>
              <div class="text-sm text-muted-foreground">Manage your privacy preferences</div>
            </button>
          </div>
        </div>
      </div>

      <!-- Reset Settings -->
      <div class="bg-surface-elevated rounded-lg border border-border p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4 flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset Settings
        </h2>
        
        <div class="space-y-4">
          <p class="text-muted-foreground">
            Reset all preferences to their default values. This action cannot be undone.
          </p>
          <button 
            @click="resetAllPreferences"
            class="px-4 py-2 bg-semantic-error text-white rounded-lg hover:bg-semantic-error-dark transition-colors"
          >
            Reset All Settings
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDashboardStore } from '@/stores/dashboardStore'
import { ThemeToggle } from '@/design-system/components'

const dashboardStore = useDashboardStore()

// Local reactive state
const sidebarCollapsed = ref(dashboardStore.preferences.sidebarCollapsed)
const weekFilterEnabled = ref(dashboardStore.preferences.weekFilterEnabled)
const refreshInterval = ref(dashboardStore.preferences.refreshInterval)

// Methods
const toggleSidebarCollapsed = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  dashboardStore.updatePreferences({ sidebarCollapsed: sidebarCollapsed.value })
}

const toggleWeekFilter = () => {
  weekFilterEnabled.value = !weekFilterEnabled.value
  dashboardStore.updatePreferences({ weekFilterEnabled: weekFilterEnabled.value })
}

const updateRefreshInterval = () => {
  dashboardStore.updatePreferences({ refreshInterval: refreshInterval.value })
}

const resetAllPreferences = () => {
  if (confirm('Are you sure you want to reset all preferences? This action cannot be undone.')) {
    dashboardStore.resetPreferences()
    // Update local state
    sidebarCollapsed.value = dashboardStore.preferences.sidebarCollapsed
    weekFilterEnabled.value = dashboardStore.preferences.weekFilterEnabled
    refreshInterval.value = dashboardStore.preferences.refreshInterval
  }
}
</script>