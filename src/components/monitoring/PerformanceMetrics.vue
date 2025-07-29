<template>
  <div class="bg-white rounded-lg border border-gray-200">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
      <div>
        <h3 class="text-lg font-medium text-gray-900">Performance Metrics</h3>
        <p class="mt-1 text-sm text-gray-500">
          API response times, user interactions, and system performance
        </p>
      </div>
      
      <div class="flex items-center space-x-3">
        <!-- Time Range Selector -->
        <select
          v-model="selectedTimeRange"
          class="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="1h">Last Hour</option>
          <option value="6h">Last 6 Hours</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
        </select>
        
        <!-- Refresh Button -->
        <button
          @click="refreshMetrics"
          class="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
          :disabled="isRefreshing"
        >
          <ArrowPathIcon 
            :class="['h-4 w-4', isRefreshing ? 'animate-spin' : '']" 
          />
        </button>
      </div>
    </div>

    <!-- Performance Summary Cards -->
    <div class="px-6 py-6 border-b border-gray-200">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <!-- Average Response Time -->
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-900">
            {{ Math.round(overallStatistics.averageResponseTime) }}ms
          </div>
          <div class="text-sm text-gray-500">Average Response Time</div>
          <div 
            :class="[
              'text-xs mt-1',
              overallStatistics.averageResponseTime <= 500 ? 'text-green-600' :
              overallStatistics.averageResponseTime <= 2000 ? 'text-yellow-600' : 'text-red-600'
            ]"
          >
            {{ getPerformanceLabel(overallStatistics.averageResponseTime) }}
          </div>
        </div>

        <!-- P95 Response Time -->
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-900">
            {{ Math.round(overallStatistics.p95ResponseTime) }}ms
          </div>
          <div class="text-sm text-gray-500">95th Percentile</div>
          <div 
            :class="[
              'text-xs mt-1',
              overallStatistics.p95ResponseTime <= 1000 ? 'text-green-600' :
              overallStatistics.p95ResponseTime <= 3000 ? 'text-yellow-600' : 'text-red-600'
            ]"
          >
            {{ getPerformanceLabel(overallStatistics.p95ResponseTime) }}
          </div>
        </div>

        <!-- Success Rate -->
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-900">
            {{ Math.round(overallStatistics.successRate * 100) }}%
          </div>
          <div class="text-sm text-gray-500">Success Rate</div>
          <div 
            :class="[
              'text-xs mt-1',
              overallStatistics.successRate >= 0.99 ? 'text-green-600' :
              overallStatistics.successRate >= 0.95 ? 'text-yellow-600' : 'text-red-600'
            ]"
          >
            {{ getSuccessRateLabel(overallStatistics.successRate) }}
          </div>
        </div>

        <!-- Total Requests -->
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-900">
            {{ overallStatistics.totalRequests.toLocaleString() }}
          </div>
          <div class="text-sm text-gray-500">Total Requests</div>
          <div class="text-xs text-gray-500 mt-1">
            {{ overallStatistics.errorCount }} errors
          </div>
        </div>
      </div>
    </div>

    <!-- Performance by Type -->
    <div class="px-6 py-6 border-b border-gray-200">
      <h4 class="text-base font-medium text-gray-900 mb-4">Performance by Type</h4>
      
      <div class="space-y-4">
        <div
          v-for="[type, stats] in Object.entries(statistics)"
          :key="type"
          class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
        >
          <div class="flex items-center space-x-3">
            <div 
              :class="[
                'h-3 w-3 rounded-full',
                getTypeColor(type)
              ]"
            />
            <div>
              <div class="font-medium text-gray-900 capitalize">
                {{ type.replace('_', ' ') }}
              </div>
              <div class="text-sm text-gray-500">
                {{ stats.totalRequests }} requests
              </div>
            </div>
          </div>
          
          <div class="text-right">
            <div class="font-medium text-gray-900">
              {{ Math.round(stats.averageResponseTime) }}ms
            </div>
            <div class="text-sm text-gray-500">
              {{ Math.round(stats.successRate * 100) }}% success
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Issues -->
    <div v-if="performanceIssues.length > 0" class="px-6 py-6 border-b border-gray-200">
      <h4 class="text-base font-medium text-gray-900 mb-4 flex items-center">
        <ExclamationTriangleIcon class="h-5 w-5 text-yellow-500 mr-2" />
        Performance Issues
      </h4>
      
      <div class="space-y-3">
        <div
          v-for="issue in performanceIssues"
          :key="`${issue.type}-${issue.message}`"
          :class="[
            'p-3 rounded-md border-l-4',
            issue.severity === 'error' 
              ? 'bg-red-50 border-red-400' 
              : 'bg-yellow-50 border-yellow-400'
          ]"
        >
          <div class="flex">
            <div class="flex-shrink-0">
              <ExclamationTriangleIcon 
                :class="[
                  'h-5 w-5',
                  issue.severity === 'error' ? 'text-red-400' : 'text-yellow-400'
                ]" 
              />
            </div>
            <div class="ml-3">
              <p 
                :class="[
                  'text-sm font-medium',
                  issue.severity === 'error' ? 'text-red-800' : 'text-yellow-800'
                ]"
              >
                {{ issue.type.replace('_', ' ').toUpperCase() }}
              </p>
              <p 
                :class="[
                  'text-sm mt-1',
                  issue.severity === 'error' ? 'text-red-700' : 'text-yellow-700'
                ]"
              >
                {{ issue.message }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Slowest Operations -->
    <div class="px-6 py-6 border-b border-gray-200">
      <h4 class="text-base font-medium text-gray-900 mb-4">Slowest Operations</h4>
      
      <div v-if="slowRequests.length === 0" class="text-center py-4">
        <CheckCircleIcon class="h-8 w-8 text-green-400 mx-auto mb-2" />
        <p class="text-sm text-gray-500">No slow operations detected</p>
      </div>
      
      <div v-else class="space-y-3">
        <div
          v-for="request in slowRequests.slice(0, 5)"
          :key="request.id"
          class="flex items-center justify-between p-3 bg-red-50 rounded-md"
        >
          <div class="min-w-0 flex-1">
            <div class="font-medium text-red-900">{{ request.name }}</div>
            <div class="text-sm text-red-700">
              {{ request.type.replace('_', ' ') }} • {{ formatDate(request.timestamp) }}
            </div>
            <div v-if="request.metadata" class="text-xs text-red-600 mt-1">
              {{ Object.entries(request.metadata).map(([k, v]) => `${k}: ${v}`).join(', ') }}
            </div>
          </div>
          <div class="flex-shrink-0 ml-4">
            <div class="text-lg font-bold text-red-900">
              {{ Math.round(request.duration) }}ms
            </div>
            <div 
              :class="[
                'text-xs',
                request.success ? 'text-green-600' : 'text-red-600'
              ]"
            >
              {{ request.success ? 'Success' : 'Failed' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Trend Chart Placeholder -->
    <div class="px-6 py-6">
      <h4 class="text-base font-medium text-gray-900 mb-4">Performance Trend</h4>
      
      <div class="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
        <div class="text-center">
          <ChartBarIcon class="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p class="text-sm text-gray-500 mb-2">Performance trend chart</p>
          <p class="text-xs text-gray-400">
            Chart implementation would show response time trends over time
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChartBarIcon
} from '@heroicons/vue/24/outline'
import { usePerformanceMonitoring } from '@/composables/monitoring/usePerformanceMonitoring'

/**
 * Performance Metrics Component
 * Displays comprehensive performance monitoring data including
 * response times, success rates, and performance issues
 */

// State
const selectedTimeRange = ref('24h')
const isRefreshing = ref(false)

// Monitoring data
const { 
  statistics, 
  overallStatistics, 
  slowRequests, 
  performanceIssues 
} = usePerformanceMonitoring()

// Methods
const refreshMetrics = async () => {
  isRefreshing.value = true
  
  try {
    // In a real implementation, this would trigger a refresh of metrics data
    await new Promise(resolve => setTimeout(resolve, 1000))
  } finally {
    isRefreshing.value = false
  }
}

const getPerformanceLabel = (responseTime: number): string => {
  if (responseTime <= 500) return 'Excellent'
  if (responseTime <= 1000) return 'Good'
  if (responseTime <= 2000) return 'Fair'
  if (responseTime <= 5000) return 'Poor'
  return 'Critical'
}

const getSuccessRateLabel = (successRate: number): string => {
  if (successRate >= 0.99) return 'Excellent'
  if (successRate >= 0.95) return 'Good'
  if (successRate >= 0.90) return 'Fair'
  return 'Poor'
}

const getTypeColor = (type: string): string => {
  const colors = {
    api_call: 'bg-blue-500',
    database_query: 'bg-green-500',
    user_interaction: 'bg-purple-500',
    page_load: 'bg-orange-500'
  }
  return colors[type as keyof typeof colors] || 'bg-gray-500'
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  
  if (diffMinutes < 1) {
    return 'Just now'
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  } else {
    const diffHours = Math.floor(diffMinutes / 60)
    return `${diffHours}h ago`
  }
}
</script>