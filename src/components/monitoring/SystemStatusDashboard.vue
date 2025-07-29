<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="border-b border-gray-200 pb-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">System Status</h1>
          <p class="mt-1 text-sm text-gray-500">
            Real-time monitoring and system health visibility
          </p>
        </div>
        
        <!-- Overall Status Indicator -->
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-2">
            <div 
              :class="[
                'h-3 w-3 rounded-full',
                healthStatus.overall === 'healthy' ? 'bg-green-500' : 
                healthStatus.overall === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
              ]"
            />
            <span class="text-sm font-medium text-gray-900 capitalize">
              {{ healthStatus.overall }}
            </span>
          </div>
          
          <div class="text-right">
            <div class="text-sm font-medium text-gray-900">
              {{ Math.round(healthStatus.score) }}%
            </div>
            <div class="text-xs text-gray-500">
              System Health Score
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- System Overview Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Database Health -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Database</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ Math.round(healthStatus.components.database.responseTime) }}ms
            </p>
          </div>
          <div 
            :class="[
              'h-12 w-12 rounded-lg flex items-center justify-center',
              getComponentStatusColor(healthStatus.components.database.status)
            ]"
          >
            <CircleStackIcon class="h-6 w-6 text-white" />
          </div>
        </div>
        <div class="mt-4">
          <div class="flex items-center">
            <div 
              :class="[
                'h-2 w-2 rounded-full mr-2',
                getStatusIndicatorColor(healthStatus.components.database.status)
              ]"
            />
            <span class="text-sm text-gray-600">
              {{ getStatusLabel(healthStatus.components.database.status) }}
            </span>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            {{ healthStatus.components.database.message }}
          </p>
        </div>
      </div>

      <!-- API Health -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">API</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ Math.round(healthStatus.components.api.responseTime) }}ms
            </p>
          </div>
          <div 
            :class="[
              'h-12 w-12 rounded-lg flex items-center justify-center',
              getComponentStatusColor(healthStatus.components.api.status)
            ]"
          >
            <CloudIcon class="h-6 w-6 text-white" />
          </div>
        </div>
        <div class="mt-4">
          <div class="flex items-center">
            <div 
              :class="[
                'h-2 w-2 rounded-full mr-2',
                getStatusIndicatorColor(healthStatus.components.api.status)
              ]"
            />
            <span class="text-sm text-gray-600">
              {{ getStatusLabel(healthStatus.components.api.status) }}
            </span>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            {{ healthStatus.components.api.message }}
          </p>
        </div>
      </div>

      <!-- Frontend Health -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Frontend</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ Math.round(healthStatus.components.frontend.responseTime) }}ms
            </p>
          </div>
          <div 
            :class="[
              'h-12 w-12 rounded-lg flex items-center justify-center',
              getComponentStatusColor(healthStatus.components.frontend.status)
            ]"
          >
            <ComputerDesktopIcon class="h-6 w-6 text-white" />
          </div>
        </div>
        <div class="mt-4">
          <div class="flex items-center">
            <div 
              :class="[
                'h-2 w-2 rounded-full mr-2',
                getStatusIndicatorColor(healthStatus.components.frontend.status)
              ]"
            />
            <span class="text-sm text-gray-600">
              {{ getStatusLabel(healthStatus.components.frontend.status) }}
            </span>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            {{ healthStatus.components.frontend.message }}
          </p>
        </div>
      </div>

      <!-- User Experience -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">User Experience</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ Math.round(vitalsScore.score) }}%
            </p>
          </div>
          <div 
            :class="[
              'h-12 w-12 rounded-lg flex items-center justify-center',
              getComponentStatusColor(healthStatus.components.user_experience.status)
            ]"
          >
            <UsersIcon class="h-6 w-6 text-white" />
          </div>
        </div>
        <div class="mt-4">
          <div class="flex items-center">
            <div 
              :class="[
                'h-2 w-2 rounded-full mr-2',
                getStatusIndicatorColor(healthStatus.components.user_experience.status)
              ]"
            />
            <span class="text-sm text-gray-600">
              {{ getStatusLabel(healthStatus.components.user_experience.status) }}
            </span>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            Core Web Vitals Score
          </p>
        </div>
      </div>
    </div>

    <!-- Performance Metrics -->
    <PerformanceMetrics />

    <!-- Error Tracking -->
    <ErrorTracker />

    <!-- Health Checks -->
    <!-- <HealthChecks /> -->

    <!-- Real User Monitoring Summary -->
    <div class="bg-white rounded-lg border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Real User Monitoring</h3>
        <p class="mt-1 text-sm text-gray-500">
          User experience metrics and session analytics
        </p>
      </div>
      
      <div class="px-6 py-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="text-center">
            <div class="text-2xl font-bold text-gray-900">
              {{ rumStatistics.totalSessions }}
            </div>
            <div class="text-sm text-gray-500">Total Sessions</div>
          </div>
          
          <div class="text-center">
            <div class="text-2xl font-bold text-gray-900">
              {{ Math.round(rumStatistics.bounceRate * 100) }}%
            </div>
            <div class="text-sm text-gray-500">Bounce Rate</div>
          </div>
          
          <div class="text-center">
            <div class="text-2xl font-bold text-gray-900">
              {{ Math.round(rumStatistics.averagePageLoadTime) }}ms
            </div>
            <div class="text-sm text-gray-500">Avg Page Load</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Uptime and Monitoring Status -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Uptime Statistics -->
      <div class="bg-white rounded-lg border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">System Uptime</h3>
        </div>
        
        <div class="px-6 py-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="text-2xl font-bold text-gray-900">
                {{ uptimePercentage }}%
              </div>
              <div class="text-sm text-gray-500">Uptime (24h)</div>
            </div>
            <div class="text-right">
              <div class="text-lg font-medium text-gray-900">
                {{ formatUptime(healthStatus.uptime) }}
              </div>
              <div class="text-sm text-gray-500">Current Session</div>
            </div>
          </div>
          
          <!-- Uptime progress bar -->
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="h-2 rounded-full transition-all duration-300"
              :class="uptimePercentage >= 99 ? 'bg-green-500' : uptimePercentage >= 95 ? 'bg-yellow-500' : 'bg-red-500'"
              :style="{ width: `${uptimePercentage}%` }"
            />
          </div>
        </div>
      </div>

      <!-- Recent Issues -->
      <div class="bg-white rounded-lg border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Recent Issues</h3>
        </div>
        
        <div class="px-6 py-6">
          <div v-if="recentErrors.length === 0" class="text-center py-4">
            <CheckCircleIcon class="h-12 w-12 text-green-400 mx-auto mb-2" />
            <p class="text-sm text-gray-500">No recent issues detected</p>
          </div>
          
          <div v-else class="space-y-3">
            <div 
              v-for="error in recentErrors.slice(0, 3)" 
              :key="error.id"
              class="flex items-start space-x-3 p-3 bg-red-50 rounded-md"
            >
              <ExclamationTriangleIcon class="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-red-800">{{ error.message }}</p>
                <p class="text-xs text-red-600 mt-1">
                  {{ formatDate(error.timestamp) }} • {{ error.source }}
                </p>
              </div>
            </div>
            
            <div v-if="recentErrors.length > 3" class="text-center">
              <router-link 
                to="/monitoring/errors" 
                class="text-sm text-blue-600 hover:text-blue-800"
              >
                View all {{ recentErrors.length }} errors →
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  CircleStackIcon,
  CloudIcon,
  ComputerDesktopIcon,
  UsersIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import { useSystemHealth } from '@/composables/monitoring/useSystemHealth'
import { useErrorTracking } from '@/composables/monitoring/useErrorTracking'
import { useRealUserMonitoring } from '@/composables/monitoring/useRealUserMonitoring'
import PerformanceMetrics from './PerformanceMetrics.vue'
import ErrorTracker from './ErrorTracker.vue'
// import HealthChecks from './HealthChecks.vue'

/**
 * System Status Dashboard
 * Comprehensive monitoring overview with health status, performance metrics,
 * error tracking, and real user monitoring data
 */

// Monitoring composables
const { healthStatus, uptimePercentage } = useSystemHealth()
const { recentErrors } = useErrorTracking()
const { vitalsScore, statistics: rumStatistics } = useRealUserMonitoring()

// Computed
const getComponentStatusColor = (status: 'healthy' | 'degraded' | 'critical'): string => {
  switch (status) {
    case 'healthy':
      return 'bg-green-500'
    case 'degraded':
      return 'bg-yellow-500'
    case 'critical':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

const getStatusIndicatorColor = (status: 'healthy' | 'degraded' | 'critical'): string => {
  switch (status) {
    case 'healthy':
      return 'bg-green-400'
    case 'degraded':
      return 'bg-yellow-400'
    case 'critical':
      return 'bg-red-400'
    default:
      return 'bg-gray-400'
  }
}

// Methods
const getStatusLabel = (status: 'healthy' | 'degraded' | 'critical'): string => {
  switch (status) {
    case 'healthy':
      return 'Operational'
    case 'degraded':
      return 'Degraded Performance'
    case 'critical':
      return 'Major Outage'
    default:
      return 'Unknown'
  }
}

const formatUptime = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
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
  } else if (diffMinutes < 1440) { // 24 hours
    const diffHours = Math.floor(diffMinutes / 60)
    return `${diffHours}h ago`
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}
</script>