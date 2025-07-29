<template>
  <div class="bg-white rounded-lg border border-gray-200">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
      <div>
        <h3 class="text-lg font-medium text-gray-900">Error Tracking</h3>
        <p class="mt-1 text-sm text-gray-500">
          Error monitoring, categorization, and resolution tracking
        </p>
      </div>
      
      <div class="flex items-center space-x-3">
        <!-- Filter by Source -->
        <select
          v-model="selectedSource"
          class="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Sources</option>
          <option value="javascript">JavaScript</option>
          <option value="api">API</option>
          <option value="database">Database</option>
          <option value="user_action">User Action</option>
          <option value="system">System</option>
        </select>
        
        <!-- Filter by Severity -->
        <select
          v-model="selectedSeverity"
          class="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        
        <!-- Show only unresolved -->
        <label class="flex items-center text-sm text-gray-600">
          <input
            v-model="showOnlyUnresolved"
            type="checkbox"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
          >
          Unresolved only
        </label>
      </div>
    </div>

    <!-- Error Statistics -->
    <div class="px-6 py-6 border-b border-gray-200">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <!-- Total Errors -->
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-900">
            {{ statistics.total }}
          </div>
          <div class="text-sm text-gray-500">Total Errors</div>
          <div class="text-xs text-gray-400 mt-1">
            {{ statistics.uniqueErrors }} unique
          </div>
        </div>

        <!-- Error Rate -->
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-900">
            {{ Math.round(statistics.errorRate * 100) / 100 }}
          </div>
          <div class="text-sm text-gray-500">Errors/Minute</div>
          <div 
            :class="[
              'text-xs mt-1',
              statistics.errorRate <= 0.1 ? 'text-green-600' :
              statistics.errorRate <= 1 ? 'text-yellow-600' : 'text-red-600'
            ]"
          >
            {{ getErrorRateLabel(statistics.errorRate) }}
          </div>
        </div>

        <!-- Critical Errors -->
        <div class="text-center">
          <div class="text-2xl font-bold text-red-600">
            {{ criticalErrors.length }}
          </div>
          <div class="text-sm text-gray-500">Critical Errors</div>
          <div class="text-xs text-gray-400 mt-1">
            Unresolved
          </div>
        </div>

        <!-- Resolution Rate -->
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-900">
            {{ Math.round((statistics.resolvedErrors / Math.max(statistics.total, 1)) * 100) }}%
          </div>
          <div class="text-sm text-gray-500">Resolution Rate</div>
          <div class="text-xs text-gray-400 mt-1">
            {{ Math.round(statistics.averageResolutionTime) }}m avg
          </div>
        </div>
      </div>
    </div>

    <!-- Error Breakdown by Source and Severity -->
    <div class="px-6 py-6 border-b border-gray-200">
      <h4 class="text-base font-medium text-gray-900 mb-4">Error Breakdown</h4>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- By Source -->
        <div>
          <h5 class="text-sm font-medium text-gray-700 mb-3">By Source</h5>
          <div class="space-y-2">
            <div
              v-for="[source, count] in Object.entries(statistics.bySource)"
              :key="source"
              class="flex items-center justify-between"
            >
              <div class="flex items-center space-x-2">
                <div 
                  :class="[
                    'h-3 w-3 rounded-full',
                    getSourceColor(source)
                  ]"
                />
                <span class="text-sm text-gray-700 capitalize">
                  {{ source.replace('_', ' ') }}
                </span>
              </div>
              <span class="text-sm font-medium text-gray-900">{{ count }}</span>
            </div>
          </div>
        </div>

        <!-- By Severity -->
        <div>
          <h5 class="text-sm font-medium text-gray-700 mb-3">By Severity</h5>
          <div class="space-y-2">
            <div
              v-for="[severity, count] in Object.entries(statistics.bySeverity)"
              :key="severity"
              class="flex items-center justify-between"
            >
              <div class="flex items-center space-x-2">
                <div 
                  :class="[
                    'h-3 w-3 rounded-full',
                    getSeverityColor(severity)
                  ]"
                />
                <span class="text-sm text-gray-700 capitalize">{{ severity }}</span>
              </div>
              <span class="text-sm font-medium text-gray-900">{{ count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Groups -->
    <div class="px-6 py-6">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-base font-medium text-gray-900">Error Groups</h4>
        <span class="text-sm text-gray-500">
          {{ filteredErrorGroups.length }} groups
        </span>
      </div>
      
      <div v-if="filteredErrorGroups.length === 0" class="text-center py-8">
        <CheckCircleIcon class="h-12 w-12 text-green-400 mx-auto mb-2" />
        <p class="text-sm text-gray-500">No errors found with current filters</p>
      </div>
      
      <div v-else class="space-y-4">
        <div
          v-for="group in filteredErrorGroups.slice(0, 10)"
          :key="group.fingerprint"
          class="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
        >
          <div class="flex items-start justify-between">
            <div class="min-w-0 flex-1">
              <div class="flex items-center space-x-3 mb-2">
                <!-- Severity Badge -->
                <span 
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    getSeverityBadgeColor(group.severity)
                  ]"
                >
                  {{ group.severity }}
                </span>
                
                <!-- Source Badge -->
                <span 
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    getSourceBadgeColor(group.source)
                  ]"
                >
                  {{ group.source.replace('_', ' ') }}
                </span>
                
                <!-- Resolution Status -->
                <span 
                  v-if="group.resolved"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                  <CheckCircleIcon class="h-3 w-3 mr-1" />
                  Resolved
                </span>
              </div>
              
              <h5 class="text-sm font-medium text-gray-900 mb-1">
                {{ group.message }}
              </h5>
              
              <div class="text-xs text-gray-500 space-x-4">
                <span>{{ group.count }} occurrences</span>
                <span>First seen: {{ formatDate(group.firstSeen) }}</span>
                <span>Last seen: {{ formatDate(group.lastSeen) }}</span>
              </div>
              
              <!-- Recent Error Sample -->
              <div v-if="group.errors.length > 0" class="mt-3">
                <div class="text-xs text-gray-400 mb-1">Latest occurrence:</div>
                <div class="bg-gray-50 rounded p-2 text-xs font-mono text-gray-700">
                  {{ group.errors[0].stack?.split('\n')[0] || group.errors[0].message }}
                </div>
              </div>
            </div>
            
            <div class="flex-shrink-0 ml-4">
              <div class="flex space-x-2">
                <!-- Resolve Button -->
                <button
                  v-if="!group.resolved"
                  @click="resolveErrorGroup(group.fingerprint)"
                  class="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded"
                >
                  Resolve
                </button>
                
                <!-- View Details Button -->
                <button
                  @click="viewErrorDetails(group)"
                  class="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded"
                >
                  Details
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Show More Button -->
        <div v-if="filteredErrorGroups.length > 10" class="text-center pt-4">
          <button
            @click="showAllErrors"
            class="text-sm text-blue-600 hover:text-blue-800"
          >
            Show all {{ filteredErrorGroups.length }} error groups
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { CheckCircleIcon } from '@heroicons/vue/24/outline'
import { useErrorTracking } from '@/composables/monitoring/useErrorTracking'
import type { ErrorGroup } from '@/composables/monitoring/useErrorTracking'

/**
 * Error Tracker Component
 * Comprehensive error monitoring with categorization,
 * filtering, and resolution tracking
 */

// State
const selectedSource = ref('')
const selectedSeverity = ref('')
const showOnlyUnresolved = ref(false)

// Error tracking data
const { 
  errorGroups, 
  statistics, 
  criticalErrors, 
  resolveErrorGroup: resolveGroup 
} = useErrorTracking()

// Computed
const filteredErrorGroups = computed(() => {
  return errorGroups.value.filter(group => {
    if (selectedSource.value && group.source !== selectedSource.value) return false
    if (selectedSeverity.value && group.severity !== selectedSeverity.value) return false
    if (showOnlyUnresolved.value && group.resolved) return false
    return true
  })
})

// Methods
const getErrorRateLabel = (rate: number): string => {
  if (rate <= 0.1) return 'Excellent'
  if (rate <= 1) return 'Good'
  if (rate <= 5) return 'Fair'
  return 'Critical'
}

const getSourceColor = (source: string): string => {
  const colors = {
    javascript: 'bg-yellow-500',
    api: 'bg-blue-500',
    database: 'bg-green-500',
    user_action: 'bg-purple-500',
    system: 'bg-red-500'
  }
  return colors[source as keyof typeof colors] || 'bg-gray-500'
}

const getSeverityColor = (severity: string): string => {
  const colors = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-blue-500'
  }
  return colors[severity as keyof typeof colors] || 'bg-gray-500'
}

const getSeverityBadgeColor = (severity: string): string => {
  const colors = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800'
  }
  return colors[severity as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

const getSourceBadgeColor = (source: string): string => {
  const colors = {
    javascript: 'bg-yellow-100 text-yellow-800',
    api: 'bg-blue-100 text-blue-800',
    database: 'bg-green-100 text-green-800',
    user_action: 'bg-purple-100 text-purple-800',
    system: 'bg-red-100 text-red-800'
  }
  return colors[source as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

const resolveErrorGroup = (fingerprint: string) => {
  resolveGroup(fingerprint, 'System Administrator')
}

const viewErrorDetails = (group: ErrorGroup) => {
  // In a real implementation, this would open a detailed view
  console.log('View error details:', group)
  alert(`Error details for: ${group.message}\n\nOccurrences: ${group.count}\nFingerprint: ${group.fingerprint}`)
}

const showAllErrors = () => {
  // In a real implementation, this would navigate to a full error list view
  console.log('Show all errors')
  alert('Would navigate to full error list view')
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
      day: 'numeric'
    })
  }
}
</script>