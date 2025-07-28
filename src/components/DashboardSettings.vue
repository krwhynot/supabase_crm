<template>
  <!-- Settings Modal -->
  <div 
    class="fixed inset-0 z-50 overflow-y-auto"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <!-- Backdrop -->
    <div 
      class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
    >
      <div 
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        aria-hidden="true"
        @click="$emit('close')"
      ></div>

      <!-- Modal Panel -->
      <div 
        class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
      >
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
              Dashboard Settings
            </h3>
            <p class="mt-1 text-sm text-gray-500">
              Customize your dashboard appearance and behavior
            </p>
          </div>
          <button
            @click="$emit('close')"
            class="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close settings"
          >
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>

        <!-- Settings Form -->
        <div class="space-y-6">
          <!-- Theme Selection -->
          <div>
            <label class="text-base font-medium text-gray-900">Theme</label>
            <p class="text-sm leading-5 text-gray-500">
              Choose the visual theme for your dashboard
            </p>
            <fieldset class="mt-4">
              <legend class="sr-only">Theme selection</legend>
              <div class="space-y-4">
                <div
                  v-for="theme in themeOptions"
                  :key="theme.value"
                  class="flex items-center"
                >
                  <input
                    :id="`theme-${theme.value}`"
                    :value="theme.value"
                    v-model="localSettings.theme"
                    name="theme"
                    type="radio"
                    class="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <label 
                    :for="`theme-${theme.value}`"
                    class="ml-3 block text-sm font-medium text-gray-700"
                  >
                    <div class="flex items-center">
                      <span>{{ theme.label }}</span>
                      <span 
                        v-if="theme.badge"
                        class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {{ theme.badge }}
                      </span>
                    </div>
                    <span class="text-xs text-gray-500">{{ theme.description }}</span>
                  </label>
                </div>
              </div>
            </fieldset>
          </div>

          <!-- Refresh Interval -->
          <div>
            <label for="refresh-interval" class="text-base font-medium text-gray-900">
              Auto-refresh Interval
            </label>
            <p class="text-sm leading-5 text-gray-500">
              How often should the dashboard automatically refresh data
            </p>
            <select
              id="refresh-interval"
              v-model="localSettings.refreshInterval"
              class="mt-2 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option
                v-for="interval in refreshIntervalOptions"
                :key="interval.value"
                :value="interval.value"
              >
                {{ interval.label }}
              </option>
            </select>
          </div>

          <!-- Widget Visibility -->
          <div>
            <label class="text-base font-medium text-gray-900">Widget Visibility</label>
            <p class="text-sm leading-5 text-gray-500">
              Choose which widgets to display on your dashboard
            </p>
            <fieldset class="mt-4">
              <legend class="sr-only">Widget visibility settings</legend>
              <div class="space-y-4">
                <div
                  v-for="widget in visibleWidgets"
                  :key="widget.id"
                  class="flex items-start"
                >
                  <div class="flex items-center h-5">
                    <input
                      :id="`widget-${widget.id}`"
                      :checked="localSettings.widgetVisibility[widget.id]"
                      @change="updateWidgetVisibilityLocal(widget.id, ($event.target as HTMLInputElement).checked)"
                      type="checkbox"
                      class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div class="ml-3 text-sm">
                    <label 
                      :for="`widget-${widget.id}`"
                      class="font-medium text-gray-700"
                    >
                      {{ widget.title }}
                    </label>
                    <p class="text-gray-500">{{ getWidgetDescription(widget.type) }}</p>
                  </div>
                </div>
              </div>
            </fieldset>
          </div>

          <!-- Demo Mode Notice -->
          <div
            v-if="isDemoMode"
            class="rounded-md bg-blue-50 p-4"
          >
            <div class="flex">
              <div class="flex-shrink-0">
                <InformationCircleIcon class="h-5 w-5 text-blue-400" />
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-blue-800">
                  Demo Mode Active
                </h3>
                <div class="mt-2 text-sm text-blue-700">
                  <p>
                    Settings are saved locally only. Connect to Supabase for persistent settings across devices.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-8 flex flex-col sm:flex-row sm:justify-between space-y-3 sm:space-y-0 sm:space-x-3">
          <!-- Reset to Defaults -->
          <button
            @click="resetToDefaults"
            type="button"
            class="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Reset to Defaults
          </button>

          <div class="flex space-x-3">
            <!-- Cancel -->
            <button
              @click="$emit('close')"
              type="button"
              class="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>

            <!-- Save -->
            <button
              @click="saveSettings"
              :disabled="isSaving"
              type="button"
              class="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowPathIcon 
                v-if="isSaving"
                class="h-4 w-4 mr-2 animate-spin"
              />
              {{ isSaving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  XMarkIcon,
  InformationCircleIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'

// Store
import { useDashboardStore } from '@/stores/dashboardStore'
import type { DashboardTheme } from '@/types/dashboard.types'

// Define emits
const emit = defineEmits<{
  close: []
}>()

// Dashboard store
const dashboardStore = useDashboardStore()

// Local state
const isSaving = ref(false)
const localSettings = ref({
  theme: 'default' as DashboardTheme,
  refreshInterval: 300000,
  widgetVisibility: {} as Record<string, boolean>
})

// Theme options
const themeOptions = [
  {
    value: 'default',
    label: 'Default',
    description: 'Clean and professional light theme',
    badge: 'Recommended'
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Dark theme for low-light environments',
    badge: 'Coming Soon'
  },
  {
    value: 'compact',
    label: 'Compact',
    description: 'Condensed layout with smaller widgets',
    badge: 'Beta'
  }
] as const

// Refresh interval options
const refreshIntervalOptions = [
  { value: 60000, label: '1 minute' },
  { value: 300000, label: '5 minutes' },
  { value: 600000, label: '10 minutes' },
  { value: 1800000, label: '30 minutes' },
  { value: 3600000, label: '1 hour' },
  { value: 0, label: 'Manual only' }
]

// Computed properties
const { 
  isDemoMode, 
  layout, 
  visibleWidgets,
  updateTheme,
  updateRefreshInterval,
  updateWidgetVisibility,
  resetToDefaults: storeResetToDefaults
} = dashboardStore

// Widget descriptions
const getWidgetDescription = (type: string): string => {
  const descriptions: Record<string, string> = {
    'contact-metrics': 'Overview of contact statistics and growth trends',
    'weekly-chart': 'Interactive chart showing weekly interaction patterns',
    'organization-metrics': 'Top organizations and contact distribution',
    'quick-actions': 'Frequently used actions and shortcuts'
  }
  return descriptions[type] || 'Dashboard widget'
}

// Methods
const updateWidgetVisibilityLocal = (widgetId: string, visible: boolean) => {
  localSettings.value.widgetVisibility[widgetId] = visible
}

const resetToDefaults = async () => {
  if (confirm('Are you sure you want to reset all settings to their default values?')) {
    await storeResetToDefaults()
    loadCurrentSettings()
  }
}

const saveSettings = async () => {
  isSaving.value = true
  
  try {
    // Update theme if changed
    if (localSettings.value.theme !== layout.theme) {
      await updateTheme(localSettings.value.theme)
    }
    
    // Update refresh interval if changed
    if (localSettings.value.refreshInterval !== layout.refreshInterval) {
      await updateRefreshInterval(localSettings.value.refreshInterval)
    }
    
    // Update widget visibility
    for (const [widgetId, visible] of Object.entries(localSettings.value.widgetVisibility)) {
      const currentWidget = layout.widgets.find(w => w.id === widgetId)
      if (currentWidget && currentWidget.visible !== visible) {
        await updateWidgetVisibility(widgetId, visible)
      }
    }
    
    // Close modal on successful save
    emit('close')
    
  } catch (error) {
    console.error('Failed to save settings:', error)
    // TODO: Show error notification
  } finally {
    isSaving.value = false
  }
}

const loadCurrentSettings = () => {
  localSettings.value = {
    theme: layout.theme,
    refreshInterval: layout.refreshInterval,
    widgetVisibility: layout.widgets.reduce((acc, widget) => {
      acc[widget.id] = widget.visible
      return acc
    }, {} as Record<string, boolean>)
  }
}

// Lifecycle
onMounted(() => {
  loadCurrentSettings()
})
</script>

<style scoped>
/* Enhanced focus styles for accessibility */
.focus\:ring-2:focus {
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
}

/* Smooth transitions */
.transition-opacity {
  transition-property: opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* Modal backdrop blur effect */
.bg-opacity-75 {
  backdrop-filter: blur(4px);
}

/* Responsive modal sizing */
@media (max-width: 640px) {
  .sm\:max-w-lg {
    max-width: calc(100vw - 2rem);
  }
}
</style>