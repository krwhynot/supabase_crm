<template>
  <div class="h-full flex flex-col">
    <!-- Widget Header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200">
      <div class="flex items-center">
        <ChartBarIcon class="h-5 w-5 text-green-600 mr-2" />
        <h3 class="text-lg font-semibold text-gray-900">Weekly Activity</h3>
      </div>
      <div class="flex items-center space-x-2">
        <!-- Chart Type Toggle -->
        <div class="flex rounded-md shadow-sm">
          <button
            @click="chartType = 'bar'"
            :class="chartTypeButtonClasses('bar')"
            class="px-2 py-1 text-xs font-medium rounded-l-md border focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            Bar
          </button>
          <button
            @click="chartType = 'line'"
            :class="chartTypeButtonClasses('line')"
            class="px-2 py-1 text-xs font-medium rounded-r-md border-t border-r border-b focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            Line
          </button>
        </div>
        
        <!-- Refresh Button -->
        <button
          @click="refreshChart"
          :disabled="isLoading"
          class="p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          aria-label="Refresh chart data"
        >
          <ArrowPathIcon 
            :class="{ 'animate-spin': isLoading }"
            class="h-4 w-4" 
          />
        </button>
        
        <!-- Menu Button -->
        <button
          class="p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          aria-label="Chart options"
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
        class="flex items-center justify-center h-40"
      >
        <div class="text-center">
          <ArrowPathIcon class="h-8 w-8 text-gray-400 animate-spin mx-auto" />
          <p class="mt-2 text-sm text-gray-500">Loading chart data...</p>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="flex items-center justify-center h-40"
      >
        <div class="text-center">
          <ExclamationTriangleIcon class="h-8 w-8 text-red-400 mx-auto" />
          <p class="mt-2 text-sm text-red-600">{{ error }}</p>
          <button
            @click="refreshChart"
            class="mt-2 text-xs text-blue-600 hover:text-blue-800 focus:outline-none"
          >
            Try again
          </button>
        </div>
      </div>

      <!-- Chart Content -->
      <div v-else class="h-full">
        <!-- Chart Legend -->
        <div class="flex items-center justify-center mb-4 space-x-6">
          <div class="flex items-center">
            <div class="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span class="text-xs text-gray-600">New Contacts</span>
          </div>
          <div class="flex items-center">
            <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span class="text-xs text-gray-600">Interactions</span>
          </div>
          <div class="flex items-center">
            <div class="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
            <span class="text-xs text-gray-600">Follow-ups</span>
          </div>
        </div>

        <!-- Chart Container -->
        <div class="relative h-48 bg-gray-50 rounded-lg p-4">
          <!-- Y-axis -->
          <div class="absolute left-0 top-4 bottom-4 w-8 flex flex-col justify-between text-xs text-gray-500">
            <span>{{ maxValue }}</span>
            <span>{{ Math.floor(maxValue * 0.75) }}</span>
            <span>{{ Math.floor(maxValue * 0.5) }}</span>
            <span>{{ Math.floor(maxValue * 0.25) }}</span>
            <span>0</span>
          </div>

          <!-- Chart Area -->
          <div class="ml-8 h-full flex items-end justify-between">
            <div
              v-for="day in chartData"
              :key="day.day"
              class="flex-1 flex flex-col items-center"
              :class="{ 'mx-1': chartData.length > 1 }"
            >
              <!-- Bar Chart -->
              <div
                v-if="chartType === 'bar'"
                class="w-full max-w-16 space-y-1"
              >
                <!-- New Contacts Bar -->
                <div
                  class="bg-blue-500 rounded-t-sm transition-all duration-300 hover:bg-blue-600"
                  :style="{ height: `${getBarHeight(day.newContacts)}px` }"
                  :title="`${day.newContacts} new contacts`"
                ></div>
                <!-- Interactions Bar -->
                <div
                  class="bg-green-500 transition-all duration-300 hover:bg-green-600"
                  :style="{ height: `${getBarHeight(day.interactions)}px` }"
                  :title="`${day.interactions} interactions`"
                ></div>
                <!-- Follow-ups Bar -->
                <div
                  class="bg-purple-500 rounded-b-sm transition-all duration-300 hover:bg-purple-600"
                  :style="{ height: `${getBarHeight(day.followUps)}px` }"
                  :title="`${day.followUps} follow-ups`"
                ></div>
              </div>

              <!-- Line Chart Points -->
              <div
                v-else
                class="relative w-full h-32 flex items-end"
              >
                <!-- Data points would be connected with SVG lines in a real implementation -->
                <div
                  class="absolute w-2 h-2 bg-blue-500 rounded-full transform -translate-x-1"
                  :style="{ bottom: `${getBarHeight(day.newContacts) * 0.8}px` }"
                ></div>
                <div
                  class="absolute w-2 h-2 bg-green-500 rounded-full transform -translate-x-1"
                  :style="{ bottom: `${getBarHeight(day.interactions) * 0.8}px` }"
                ></div>
                <div
                  class="absolute w-2 h-2 bg-purple-500 rounded-full transform -translate-x-1"
                  :style="{ bottom: `${getBarHeight(day.followUps) * 0.8}px` }"
                ></div>
              </div>

              <!-- Day Label -->
              <div class="mt-2 text-xs text-gray-600 text-center">
                <div class="font-medium">{{ day.dayName }}</div>
                <div class="text-gray-400">{{ day.date }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Summary Stats -->
        <div class="mt-4 grid grid-cols-3 gap-4 text-center">
          <div class="bg-blue-50 rounded-lg p-3">
            <p class="text-xl font-bold text-blue-900">{{ totalNewContacts }}</p>
            <p class="text-xs text-blue-600">Total New</p>
          </div>
          <div class="bg-green-50 rounded-lg p-3">
            <p class="text-xl font-bold text-green-900">{{ totalInteractions }}</p>
            <p class="text-xs text-green-600">Interactions</p>
          </div>
          <div class="bg-purple-50 rounded-lg p-3">
            <p class="text-xl font-bold text-purple-900">{{ totalFollowUps }}</p>
            <p class="text-xs text-purple-600">Follow-ups</p>
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
        📈 Showing sample chart data for demonstration
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  ChartBarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  EllipsisVerticalIcon
} from '@heroicons/vue/24/outline'

// Composables
import { useDashboardStore } from '@/stores/dashboardStore'

// Dashboard store
const dashboardStore = useDashboardStore()
const { isDemoMode, isLoading } = dashboardStore

// Local state
const error = ref<string | null>(null)
const chartType = ref<'bar' | 'line'>('bar')
const chartData = ref<Array<{
  day: string
  dayName: string
  date: string
  newContacts: number
  interactions: number
  followUps: number
}>>([])

// Computed properties
const hasData = computed(() => 
  chartData.value.length > 0 || isDemoMode
)

const maxValue = computed(() => {
  if (chartData.value.length === 0) return 100
  
  const allValues = chartData.value.flatMap(day => [
    day.newContacts,
    day.interactions,
    day.followUps
  ])
  
  const max = Math.max(...allValues)
  return Math.ceil(max / 10) * 10 // Round up to nearest 10
})

const totalNewContacts = computed(() =>
  chartData.value.reduce((sum, day) => sum + day.newContacts, 0)
)

const totalInteractions = computed(() =>
  chartData.value.reduce((sum, day) => sum + day.interactions, 0)
)

const totalFollowUps = computed(() =>
  chartData.value.reduce((sum, day) => sum + day.followUps, 0)
)

// Demo data for development
const generateDemoData = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const dates = ['12/23', '12/24', '12/25', '12/26', '12/27', '12/28', '12/29']
  
  return days.map((dayName, index) => ({
    day: dayName.toLowerCase(),
    dayName,
    date: dates[index],
    newContacts: Math.floor(Math.random() * 15) + 5,
    interactions: Math.floor(Math.random() * 25) + 10,
    followUps: Math.floor(Math.random() * 12) + 3
  }))
}

// Methods
const chartTypeButtonClasses = (type: 'bar' | 'line') => {
  const isActive = chartType.value === type
  return isActive
    ? 'bg-blue-600 text-white border-blue-600'
    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
}

const getBarHeight = (value: number): number => {
  const maxHeight = 100 // Max height in pixels
  return Math.max(2, (value / maxValue.value) * maxHeight)
}

const refreshChart = async () => {
  error.value = null
  
  try {
    if (isDemoMode) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Generate new demo data
      chartData.value = generateDemoData()
    } else {
      // TODO: Real API call would go here
      // const response = await dashboardStore.fetchWeeklyChart(selectedWeek.value)
      // chartData.value = response.data
      
      // For now, use demo data
      chartData.value = generateDemoData()
    }
  } catch (err) {
    console.error('Failed to fetch chart data:', err)
    error.value = 'Failed to load chart data'
  }
}

// Lifecycle
onMounted(() => {
  refreshChart()
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

/* Chart transitions */
.transition-all {
  transition: all 0.3s ease-in-out;
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

/* Chart bars */
.bg-blue-500:hover,
.bg-green-500:hover,
.bg-purple-500:hover {
  transform: scaleY(1.05);
  transition: transform 0.2s ease-in-out;
}
</style>