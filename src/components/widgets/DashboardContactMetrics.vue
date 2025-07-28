<template>
  <div class="h-full flex flex-col">
    <!-- Widget Header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200">
      <div class="flex items-center">
        <UsersIcon class="h-5 w-5 text-blue-600 mr-2" />
        <h3 class="text-lg font-semibold text-gray-900">Contact Metrics</h3>
      </div>
      <div class="flex items-center space-x-2">
        <!-- Refresh Button -->
        <button
          @click="refreshMetrics"
          :disabled="isLoading"
          class="p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          aria-label="Refresh contact metrics"
        >
          <ArrowPathIcon 
            :class="{ 'animate-spin': isLoading }"
            class="h-4 w-4" 
          />
        </button>
        <!-- Menu Button -->
        <button
          class="p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          aria-label="Widget options"
        >
          <EllipsisVerticalIcon class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Widget Content -->
    <div class="flex-1 p-4">
      <!-- Loading State -->
      <div
        v-if="isLoading && !hasData"
        class="flex items-center justify-center h-32"
      >
        <div class="text-center">
          <ArrowPathIcon class="h-8 w-8 text-gray-400 animate-spin mx-auto" />
          <p class="mt-2 text-sm text-gray-500">Loading metrics...</p>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="flex items-center justify-center h-32"
      >
        <div class="text-center">
          <ExclamationTriangleIcon class="h-8 w-8 text-red-400 mx-auto" />
          <p class="mt-2 text-sm text-red-600">{{ error }}</p>
          <button
            @click="refreshMetrics"
            class="mt-2 text-xs text-blue-600 hover:text-blue-800 focus:outline-none"
          >
            Try again
          </button>
        </div>
      </div>

      <!-- Metrics Content -->
      <div v-else class="space-y-4">
        <!-- Summary Cards -->
        <div class="grid grid-cols-2 gap-4">
          <!-- Total Contacts -->
          <div class="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-blue-600 uppercase tracking-wide">Total</p>
                <p class="text-2xl font-bold text-blue-900">{{ formatNumber(metrics.totalContacts) }}</p>
              </div>
              <div class="p-2 bg-blue-200 rounded-full">
                <UsersIcon class="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          <!-- New This Week -->
          <div class="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-green-600 uppercase tracking-wide">This Week</p>
                <p class="text-2xl font-bold text-green-900">{{ formatNumber(metrics.newThisWeek) }}</p>
              </div>
              <div class="p-2 bg-green-200 rounded-full">
                <PlusIcon class="h-5 w-5 text-green-600" />
              </div>
            </div>
            <!-- Growth Indicator -->
            <div class="mt-2 flex items-center">
              <span class="text-xs text-green-600">
                {{ formatGrowthPercentage(metrics.weeklyGrowth) }}
              </span>
              <ArrowTrendingUpIcon class="h-3 w-3 text-green-500 ml-1" />
            </div>
          </div>
        </div>

        <!-- Activity Metrics -->
        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-700">Activity Breakdown</h4>
          
          <!-- Active Contacts -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
              <span class="text-sm text-gray-600">Active Contacts</span>
            </div>
            <div class="flex items-center">
              <span class="text-sm font-medium text-gray-900 mr-2">
                {{ formatNumber(metrics.activeContacts) }}
              </span>
              <span class="text-xs text-gray-500">
                ({{ formatPercentage(metrics.activeContacts, metrics.totalContacts) }})
              </span>
            </div>
          </div>

          <!-- Inactive Contacts -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="w-3 h-3 bg-gray-400 rounded-full mr-3"></div>
              <span class="text-sm text-gray-600">Inactive</span>
            </div>
            <div class="flex items-center">
              <span class="text-sm font-medium text-gray-900 mr-2">
                {{ formatNumber(metrics.inactiveContacts) }}
              </span>
              <span class="text-xs text-gray-500">
                ({{ formatPercentage(metrics.inactiveContacts, metrics.totalContacts) }})
              </span>
            </div>
          </div>

          <!-- Organizations -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
              <span class="text-sm text-gray-600">Organizations</span>
            </div>
            <div class="flex items-center">
              <span class="text-sm font-medium text-gray-900">
                {{ formatNumber(metrics.totalOrganizations) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Demo Mode Notice -->
    <div
      v-if="isDemoMode && hasData"
      class="p-3 bg-blue-50 border-t border-blue-100"
    >
      <p class="text-xs text-blue-600 text-center">
        📊 Showing sample data for demonstration
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  UsersIcon,
  PlusIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  EllipsisVerticalIcon,
  ArrowTrendingUpIcon
} from '@heroicons/vue/24/outline'

// Composables
import { useDashboardStore } from '@/stores/dashboardStore'

// Dashboard store
const dashboardStore = useDashboardStore()
const { isDemoMode, isLoading } = dashboardStore

// Local state
const error = ref<string | null>(null)
const metrics = ref({
  totalContacts: 0,
  newThisWeek: 0,
  activeContacts: 0,
  inactiveContacts: 0,
  totalOrganizations: 0,
  weeklyGrowth: 0
})

// Computed properties
const hasData = computed(() => 
  metrics.value.totalContacts > 0 || isDemoMode
)

// Demo data for development
const demoMetrics = {
  totalContacts: 1247,
  newThisWeek: 23,
  activeContacts: 892,
  inactiveContacts: 355,
  totalOrganizations: 89,
  weeklyGrowth: 8.5
}

// Methods
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%'
  return Math.round((value / total) * 100) + '%'
}

const formatGrowthPercentage = (growth: number): string => {
  const sign = growth >= 0 ? '+' : ''
  return `${sign}${growth.toFixed(1)}%`
}

const refreshMetrics = async () => {
  error.value = null
  
  try {
    if (isDemoMode) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Use demo data with some randomization
      metrics.value = {
        ...demoMetrics,
        newThisWeek: demoMetrics.newThisWeek + Math.floor(Math.random() * 10) - 5,
        weeklyGrowth: demoMetrics.weeklyGrowth + (Math.random() * 4) - 2
      }
    } else {
      // TODO: Real API call would go here
      // const response = await dashboardStore.fetchContactMetrics(selectedWeek.value)
      // metrics.value = response.data
      
      // For now, use demo data
      metrics.value = demoMetrics
    }
  } catch (err) {
    console.error('Failed to fetch contact metrics:', err)
    error.value = 'Failed to load contact metrics'
  }
}

// Lifecycle
onMounted(() => {
  refreshMetrics()
})
</script>

<style scoped>
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

/* Gradient backgrounds */
.bg-gradient-to-r {
  background-image: linear-gradient(to right, var(--tw-gradient-stops));
}

/* Enhanced hover effects */
button:hover {
  transition: all 0.15s ease-in-out;
}

/* Focus styles for accessibility */
button:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

button:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
</style>