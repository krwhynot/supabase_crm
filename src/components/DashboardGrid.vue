<template>
  <div class="dashboard-grid h-full overflow-auto">
    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="flex items-center justify-center h-64"
    >
      <div class="text-center">
        <ArrowPathIcon class="h-8 w-8 text-gray-400 animate-spin mx-auto" />
        <p class="mt-2 text-sm text-gray-500">Loading dashboard...</p>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!hasVisibleWidgets"
      class="flex flex-col items-center justify-center h-64 text-center"
    >
      <ChartBarIcon class="h-16 w-16 text-gray-300 mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">No Widgets Configured</h3>
      <p class="text-sm text-gray-500 mb-4 max-w-sm">
        Your dashboard is empty. Configure widgets in settings to start tracking your data.
      </p>
      <button
        @click="$emit('openSettings')"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Cog6ToothIcon class="h-4 w-4 mr-2" />
        Configure Widgets
      </button>
    </div>

    <!-- Dashboard Content -->
    <div
      v-else
      :class="gridClasses"
      class="gap-6 p-6"
    >
      <!-- Contact Metrics Widget -->
      <div
        v-if="isWidgetVisible('contact-metrics')"
        :class="getWidgetClasses('contact-metrics')"
      >
        <DashboardContactMetrics />
      </div>

      <!-- Weekly Chart Widget -->
      <div
        v-if="isWidgetVisible('weekly-chart')"
        :class="getWidgetClasses('weekly-chart')"
      >
        <DashboardWeeklyChart />
      </div>

      <!-- Organization Metrics Widget -->
      <div
        v-if="isWidgetVisible('organization-metrics')"
        :class="getWidgetClasses('organization-metrics')"
      >
        <DashboardOrganizationMetrics />
      </div>

      <!-- Quick Actions Widget -->
      <div
        v-if="isWidgetVisible('quick-actions')"
        :class="getWidgetClasses('quick-actions')"
      >
        <DashboardQuickActions />
      </div>
    </div>

    <!-- Demo Mode Notice -->
    <div
      v-if="isDemoMode && hasVisibleWidgets"
      class="mx-6 mb-6 rounded-md bg-blue-50 p-4"
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
              You're viewing sample data. Connect to Supabase to see your real analytics data.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  ArrowPathIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline'

// Composables
import { useResponsive } from '@/composables/useResponsive'
import { useDashboardStore } from '@/stores/dashboardStore'

// Widget components
import DashboardContactMetrics from './widgets/DashboardContactMetrics.vue'
import DashboardWeeklyChart from './widgets/DashboardWeeklyChart.vue'
import DashboardOrganizationMetrics from './widgets/DashboardOrganizationMetrics.vue'
import DashboardQuickActions from './widgets/DashboardQuickActions.vue'

// Define emits
defineEmits<{
  openSettings: []
}>()

// Dashboard store
const dashboardStore = useDashboardStore()
const { isDemoMode, isLoading, visibleWidgets } = dashboardStore

// Responsive design
const { isMobile, isTablet } = useResponsive()

// Computed properties
const hasVisibleWidgets = computed(() => visibleWidgets.length > 0)

const gridClasses = computed(() => {
  const baseClasses = 'grid auto-rows-fr'
  
  if (isMobile.value) {
    // Mobile: single column
    return `${baseClasses} grid-cols-1`
  } else if (isTablet.value) {
    // Tablet: 2 columns
    return `${baseClasses} grid-cols-1 sm:grid-cols-2`
  } else {
    // Desktop: 3 columns with responsive breakpoints
    return `${baseClasses} grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
  }
})

const isWidgetVisible = (widgetId: string): boolean => {
  const widget = visibleWidgets.find(w => w.id === widgetId)
  return widget?.visible ?? false
}

const getWidgetClasses = (widgetId: string) => {
  const widget = visibleWidgets.find(w => w.id === widgetId)
  if (!widget) return 'col-span-1'

  const baseClasses = 'bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-shadow duration-200 hover:shadow-md'
  
  // Responsive widget sizing based on widget type and screen size
  if (isMobile.value) {
    // Mobile: all widgets take full width
    return `${baseClasses} col-span-1`
  } else if (isTablet.value) {
    // Tablet: some widgets span 2 columns
    switch (widgetId) {
      case 'weekly-chart':
        return `${baseClasses} col-span-2`
      case 'contact-metrics':
      case 'organization-metrics':
      case 'quick-actions':
      default:
        return `${baseClasses} col-span-1`
    }
  } else {
    // Desktop: more complex grid layout
    switch (widgetId) {
      case 'weekly-chart':
        return `${baseClasses} col-span-2 lg:col-span-2 xl:col-span-2`
      case 'contact-metrics':
        return `${baseClasses} col-span-1`
      case 'organization-metrics':
        return `${baseClasses} col-span-1 lg:col-span-1 xl:col-span-2`
      case 'quick-actions':
        return `${baseClasses} col-span-1`
      default:
        return `${baseClasses} col-span-1`
    }
  }
}
</script>

<style scoped>
/* Custom grid layout for dashboard widgets */
.dashboard-grid {
  min-height: 100%;
}

/* Ensure consistent widget heights */
.auto-rows-fr {
  grid-auto-rows: minmax(200px, 1fr);
}

/* Responsive adjustments for small screens */
@media (max-width: 640px) {
  .auto-rows-fr {
    grid-auto-rows: minmax(180px, auto);
  }
}

/* Enhanced hover effects */
.hover\:shadow-md:hover {
  --tw-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --tw-shadow-colored: 0 4px 6px -1px var(--tw-shadow-color), 0 2px 4px -1px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}

/* Smooth transitions */
.transition-shadow {
  transition-property: box-shadow;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

/* Loading animation */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Custom scrollbar for overflow areas */
.overflow-auto::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}

/* Responsive grid gap adjustments */
@media (max-width: 640px) {
  .gap-6 {
    gap: 1rem;
  }
}

@media (min-width: 1024px) {
  .gap-6 {
    gap: 1.5rem;
  }
}

/* Accessibility focus styles */
button:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

button:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
</style>