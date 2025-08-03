<!-- 
  Interaction Dashboard Component
  Comprehensive dashboard showcasing all KPI calculation features
  Demonstrates real-time updates, filtering, and principal-specific metrics
-->

<template>
  <div class="space-y-8">
    <!-- Dashboard Header -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-bold text-gray-900">Interaction Analytics</h2>
        <div class="flex items-center space-x-4">
          <!-- Period Selector -->
          <select 
            v-model="selectedPeriod" 
            @change="handlePeriodChange"
            class="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
          
          <!-- Refresh Button -->
          <button 
            @click="refreshData"
            :disabled="loading"
            class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <ArrowPathIcon class="w-4 h-4 mr-1" :class="{ 'animate-spin': loading }" />
            Refresh
          </button>
        </div>
      </div>
      
      <!-- Quick Filters -->
      <div class="flex flex-wrap gap-2">
        <button
          v-for="filter in quickFilters"
          :key="filter.key"
          @click="applyQuickFilter(filter)"
          :class="[
            'px-3 py-1 rounded-full text-sm font-medium transition-colors',
            activeFilter === filter.key
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <!-- Main KPI Cards -->
    <InteractionKPICards 
      :filters="currentFilters" 
      :show-extended="true" 
    />

    <!-- Secondary Metrics Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Activity Trends Chart -->
      <div v-if="activityTrends" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Activity Trends</h3>
        <div class="space-y-4">
          <!-- Current vs Previous Period -->
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center">
              <p class="text-sm text-gray-600">Current {{ selectedPeriod }}</p>
              <p class="text-2xl font-bold text-blue-600">
                {{ activityTrends.current_period.total_interactions }}
              </p>
              <p class="text-xs text-gray-500">
                {{ activityTrends.current_period.avg_daily_interactions }}/day avg
              </p>
            </div>
            <div class="text-center">
              <p class="text-sm text-gray-600">Previous {{ selectedPeriod }}</p>
              <p class="text-2xl font-bold text-gray-600">
                {{ activityTrends.previous_period.total_interactions }}
              </p>
              <p class="text-xs text-gray-500">
                {{ activityTrends.previous_period.avg_daily_interactions }}/day avg
              </p>
            </div>
          </div>
          
          <!-- Growth Metrics -->
          <div class="border-t pt-4">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-600">Interaction Growth:</span>
                <span :class="getGrowthClass(activityTrends.growth_metrics.interaction_growth)" class="ml-1 font-medium">
                  {{ activityTrends.growth_metrics.interaction_growth > 0 ? '+' : '' }}{{ activityTrends.growth_metrics.interaction_growth }}%
                </span>
              </div>
              <div>
                <span class="text-gray-600">Contact Growth:</span>
                <span :class="getGrowthClass(activityTrends.growth_metrics.contact_growth)" class="ml-1 font-medium">
                  {{ activityTrends.growth_metrics.contact_growth > 0 ? '+' : '' }}{{ activityTrends.growth_metrics.contact_growth }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Follow-up Management -->
      <div v-if="followUpMetrics" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Follow-up Management</h3>
        <div class="space-y-3">
          <div class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <div class="flex items-center">
              <ExclamationTriangleIcon class="w-5 h-5 text-red-500 mr-2" />
              <span class="text-sm font-medium text-red-700">Overdue</span>
            </div>
            <span class="text-lg font-bold text-red-600">{{ followUpMetrics.overdue_count }}</span>
          </div>
          
          <div class="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div class="flex items-center">
              <ClockIcon class="w-5 h-5 text-yellow-500 mr-2" />
              <span class="text-sm font-medium text-yellow-700">Due Today</span>
            </div>
            <span class="text-lg font-bold text-yellow-600">{{ followUpMetrics.due_today }}</span>
          </div>
          
          <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div class="flex items-center">
              <CalendarIcon class="w-5 h-5 text-blue-500 mr-2" />
              <span class="text-sm font-medium text-blue-700">Due This Week</span>
            </div>
            <span class="text-lg font-bold text-blue-600">{{ followUpMetrics.due_this_week }}</span>
          </div>
          
          <div class="border-t pt-3 mt-3">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600">Completion Rate</span>
              <span class="font-medium text-green-600">{{ followUpMetrics.completion_rate }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Principal Performance Section -->
    <div v-if="principalMetrics" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-medium text-gray-900">Principal Performance</h3>
        <select 
          v-model="selectedPrincipal" 
          @change="handlePrincipalChange"
          class="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">All Principals</option>
          <option value="sarah.johnson@company.com">Sarah Johnson</option>
          <option value="alex.rodriguez@company.com">Alex Rodriguez</option>
          <option value="emma.thompson@company.com">Emma Thompson</option>
        </select>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Performance Overview -->
        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900">Overview</h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Total Interactions:</span>
              <span class="font-medium">{{ principalMetrics.total_interactions }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">This Week:</span>
              <span class="font-medium">{{ principalMetrics.interactions_this_week }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">This Month:</span>
              <span class="font-medium">{{ principalMetrics.interactions_this_month }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Response Time:</span>
              <span class="font-medium">{{ principalMetrics.response_time_avg_hours }}h avg</span>
            </div>
          </div>
        </div>
        
        <!-- Follow-up Status -->
        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900">Follow-ups</h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Completed:</span>
              <span class="font-medium text-green-600">{{ principalMetrics.follow_ups_completed }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Pending:</span>
              <span class="font-medium text-blue-600">{{ principalMetrics.follow_ups_pending }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Overdue:</span>
              <span class="font-medium text-red-600">{{ principalMetrics.overdue_follow_ups }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Conversion Rate:</span>
              <span class="font-medium">{{ principalMetrics.opportunity_conversion_rate }}%</span>
            </div>
          </div>
        </div>
        
        <!-- Top Interaction Types -->
        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900">Top Interaction Types</h4>
          <div class="space-y-2">
            <div 
              v-for="type in principalMetrics.top_interaction_types" 
              :key="type.type"
              class="flex items-center justify-between text-sm"
            >
              <div class="flex items-center">
                <div 
                  class="w-2 h-2 rounded-full mr-2"
                  :class="getTypeColor(type.type)"
                ></div>
                <span class="text-gray-600">{{ formatTypeName(type.type) }}</span>
              </div>
              <span class="font-medium">{{ type.count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Real-time Status Indicator -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div class="flex items-center justify-between text-sm">
        <div class="flex items-center">
          <div :class="[
            'w-2 h-2 rounded-full mr-2',
            isConnected ? 'bg-green-500' : 'bg-red-500'
          ]"></div>
          <span class="text-gray-600">
            {{ isConnected ? 'Real-time updates active' : 'Offline mode' }}
          </span>
        </div>
        <span class="text-gray-500">
          Last updated: {{ lastUpdated || 'Never' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useInteractionStore } from '@/stores/interactionStore'
import type { InteractionFilters, InteractionType } from '@/types/interactions'
import InteractionKPICards from './InteractionKPICards.vue'
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CalendarIcon
} from '@heroicons/vue/24/outline'

// Store
const interactionStore = useInteractionStore()

// Reactive state
const selectedPeriod = ref<'week' | 'month' | 'quarter'>('month')
const selectedPrincipal = ref<string>('')
const activeFilter = ref<string>('')
const currentFilters = ref<InteractionFilters>({})

// Quick filters configuration
const quickFilters = [
  { key: '', label: 'All Interactions', filters: {} },
  { key: 'overdue', label: 'Overdue Follow-ups', filters: { follow_up_overdue: true } },
  { key: 'opportunities', label: 'With Opportunities', filters: { has_opportunity: true } },
  { key: 'this-week', label: 'This Week', filters: { date_from: getWeekStart() } },
  { key: 'demos', label: 'Demos Only', filters: { interaction_type: ['DEMO'] } }
]

// Computed properties
const loading = computed(() => interactionStore.isLoading)
const error = computed(() => interactionStore.error)
const activityTrends = computed(() => interactionStore.activityTrends)
const followUpMetrics = computed(() => interactionStore.followUpMetrics)
const principalMetrics = computed(() => interactionStore.principalMetrics)
const isConnected = computed(() => interactionStore.isConnected)

const lastUpdated = computed(() => {
  // This would come from the KPI service in a real implementation
  return new Date().toLocaleTimeString()
})

// Methods
function getWeekStart(): string {
  const now = new Date()
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
  return weekStart.toISOString().split('T')[0]
}

const getGrowthClass = (growth: number): string => {
  if (growth > 0) return 'text-green-600'
  if (growth < 0) return 'text-red-600'
  return 'text-gray-600'
}

const getTypeColor = (type: InteractionType): string => {
  const colors = {
    EMAIL: 'bg-blue-500',
    CALL: 'bg-green-500',
    IN_PERSON: 'bg-purple-500',
    DEMO: 'bg-orange-500',
    FOLLOW_UP: 'bg-indigo-500'
  }
  return colors[type] || 'bg-gray-500'
}

const formatTypeName = (type: string): string => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
}

const applyQuickFilter = (filter: any): void => {
  activeFilter.value = filter.key
  currentFilters.value = { ...filter.filters }
  refreshData()
}

const handlePeriodChange = async (): Promise<void> => {
  await interactionStore.fetchActivityTrends(selectedPeriod.value)
}

const handlePrincipalChange = async (): Promise<void> => {
  await interactionStore.fetchPrincipalMetrics(selectedPrincipal.value || undefined)
}

const refreshData = async (): Promise<void> => {
  try {
    // Load all KPI data with current filters
    await Promise.all([
      interactionStore.fetchExtendedKPIs(currentFilters.value),
      interactionStore.fetchFollowUpTracking(currentFilters.value),
      interactionStore.fetchActivityTrends(selectedPeriod.value),
      interactionStore.fetchPrincipalMetrics(selectedPrincipal.value || undefined)
    ])
  } catch (error) {
    console.error('Failed to refresh dashboard data:', error)
  }
}

// Lifecycle
onMounted(async () => {
  // Subscribe to real-time updates
  await interactionStore.subscribeToChanges()
  
  // Load initial data
  await refreshData()
  
  // Set up periodic refresh (every 5 minutes)
  const refreshInterval = setInterval(refreshData, 5 * 60 * 1000)
  
  // Clean up on unmount
  onUnmounted(() => {
    clearInterval(refreshInterval)
    interactionStore.unsubscribeFromChanges()
  })
})
</script>