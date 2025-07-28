<template>
  <div class="h-full flex flex-col">
    <!-- Widget Header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200">
      <div class="flex items-center">
        <BuildingOfficeIcon class="h-5 w-5 text-purple-600 mr-2" />
        <h3 class="text-lg font-semibold text-gray-900">Organizations</h3>
      </div>
      <div class="flex items-center space-x-2">
        <!-- View Toggle -->
        <div class="flex rounded-md shadow-sm">
          <button
            @click="viewMode = 'top'"
            :class="viewModeButtonClasses('top')"
            class="px-2 py-1 text-xs font-medium rounded-l-md border focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            Top
          </button>
          <button
            @click="viewMode = 'recent'"
            :class="viewModeButtonClasses('recent')"
            class="px-2 py-1 text-xs font-medium rounded-r-md border-t border-r border-b focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            Recent
          </button>
        </div>
        
        <!-- Refresh Button -->
        <button
          @click="refreshMetrics"
          :disabled="isLoading"
          class="p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          aria-label="Refresh organization metrics"
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
        class="flex items-center justify-center h-40"
      >
        <div class="text-center">
          <ArrowPathIcon class="h-8 w-8 text-gray-400 animate-spin mx-auto" />
          <p class="mt-2 text-sm text-gray-500">Loading organizations...</p>
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
            @click="refreshMetrics"
            class="mt-2 text-xs text-blue-600 hover:text-blue-800 focus:outline-none"
          >
            Try again
          </button>
        </div>
      </div>

      <!-- Organizations Content -->
      <div v-else class="space-y-4">
        <!-- Summary Stats -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-purple-50 rounded-lg p-3 text-center">
            <p class="text-xl font-bold text-purple-900">{{ organizations.length }}</p>
            <p class="text-xs text-purple-600">Total Organizations</p>
          </div>
          <div class="bg-blue-50 rounded-lg p-3 text-center">
            <p class="text-xl font-bold text-blue-900">{{ averageContactsPerOrg }}</p>
            <p class="text-xs text-blue-600">Avg Contacts</p>
          </div>
        </div>

        <!-- Organizations List -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-medium text-gray-700">
              {{ viewMode === 'top' ? 'Top Organizations' : 'Recent Activity' }}
            </h4>
            <span class="text-xs text-gray-500">
              {{ organizations.length }} {{ organizations.length === 1 ? 'organization' : 'organizations' }}
            </span>
          </div>

          <!-- Organization Items -->
          <div class="space-y-2 max-h-48 overflow-y-auto">
            <div
              v-for="(org, index) in displayedOrganizations"
              :key="org.id"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
              @click="selectOrganization(org)"
            >
              <div class="flex items-center flex-1 min-w-0">
                <!-- Rank/Position -->
                <div 
                  v-if="viewMode === 'top'"
                  class="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold mr-3"
                >
                  {{ index + 1 }}
                </div>
                
                <!-- Status Indicator -->
                <div 
                  v-else
                  class="flex-shrink-0 w-3 h-3 rounded-full mr-3"
                  :class="getStatusIndicatorClass(org.status)"
                ></div>

                <!-- Organization Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center">
                    <h5 class="text-sm font-medium text-gray-900 truncate">
                      {{ org.name }}
                    </h5>
                    <span 
                      v-if="org.industry"
                      class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                    >
                      {{ org.industry }}
                    </span>
                  </div>
                  <div class="flex items-center mt-1">
                    <UsersIcon class="h-3 w-3 text-gray-400 mr-1" />
                    <span class="text-xs text-gray-500">
                      {{ org.contactCount }} {{ org.contactCount === 1 ? 'contact' : 'contacts' }}
                    </span>
                    <span 
                      v-if="viewMode === 'recent' && org.lastActivity"
                      class="ml-2 text-xs text-gray-400"
                    >
                      {{ formatLastActivity(org.lastActivity) }}
                    </span>
                  </div>
                </div>

                <!-- Value/Score -->
                <div class="flex-shrink-0 text-right">
                  <div v-if="viewMode === 'top'">
                    <p class="text-sm font-semibold text-gray-900">
                      ${{ formatCurrency(org.value) }}
                    </p>
                    <p class="text-xs text-gray-500">Value</p>
                  </div>
                  <div v-else>
                    <div class="flex items-center">
                      <div 
                        class="w-2 h-2 rounded-full mr-2"
                        :class="getActivityIndicatorClass(org.activityScore)"
                      ></div>
                      <span class="text-xs text-gray-500">
                        {{ org.activityScore }}/10
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Chevron -->
              <ChevronRightIcon class="h-4 w-4 text-gray-300 ml-2" />
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-if="organizations.length === 0"
            class="text-center py-8"
          >
            <BuildingOfficeIcon class="h-12 w-12 text-gray-300 mx-auto" />
            <p class="mt-2 text-sm text-gray-500">No organizations found</p>
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
        🏢 Showing sample organization data for demonstration
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  BuildingOfficeIcon,
  UsersIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  EllipsisVerticalIcon,
  ChevronRightIcon
} from '@heroicons/vue/24/outline'

// Composables
import { useDashboardStore } from '@/stores/dashboardStore'

// Dashboard store
const dashboardStore = useDashboardStore()
const { isDemoMode, isLoading } = dashboardStore

// Types
interface Organization {
  id: string
  name: string
  industry?: string
  contactCount: number
  value: number
  status: 'active' | 'inactive' | 'prospect'
  lastActivity?: Date
  activityScore: number
}

// Local state
const error = ref<string | null>(null)
const viewMode = ref<'top' | 'recent'>('top')
const organizations = ref<Organization[]>([])

// Computed properties
const hasData = computed(() => 
  organizations.value.length > 0 || isDemoMode
)

const displayedOrganizations = computed(() => {
  if (viewMode.value === 'top') {
    return [...organizations.value]
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  } else {
    return [...organizations.value]
      .sort((a, b) => {
        if (!a.lastActivity && !b.lastActivity) return 0
        if (!a.lastActivity) return 1
        if (!b.lastActivity) return -1
        return b.lastActivity.getTime() - a.lastActivity.getTime()
      })
      .slice(0, 8)
  }
})

const averageContactsPerOrg = computed(() => {
  if (organizations.value.length === 0) return 0
  const total = organizations.value.reduce((sum, org) => sum + org.contactCount, 0)
  return Math.round(total / organizations.value.length)
})

// Demo data for development
const demoOrganizations: Organization[] = [
  {
    id: '1',
    name: 'TechCorp Industries',
    industry: 'Technology',
    contactCount: 45,
    value: 125000,
    status: 'active',
    lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    activityScore: 9
  },
  {
    id: '2',
    name: 'Global Healthcare Solutions',
    industry: 'Healthcare',
    contactCount: 32,
    value: 89000,
    status: 'active',
    lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    activityScore: 8
  },
  {
    id: '3',
    name: 'Financial Partners LLC',
    industry: 'Finance',
    contactCount: 28,
    value: 156000,
    status: 'prospect',
    lastActivity: new Date(Date.now() - 5 * 60 * 60 * 1000),
    activityScore: 7
  },
  {
    id: '4',
    name: 'Manufacturing Co',
    industry: 'Manufacturing',
    contactCount: 19,
    value: 67000,
    status: 'active',
    lastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    activityScore: 6
  },
  {
    id: '5',
    name: 'Education Systems',
    industry: 'Education',
    contactCount: 23,
    value: 42000,
    status: 'inactive',
    lastActivity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    activityScore: 4
  }
]

// Methods
const viewModeButtonClasses = (mode: 'top' | 'recent') => {
  const isActive = viewMode.value === mode
  return isActive
    ? 'bg-blue-600 text-white border-blue-600'
    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
}

const getStatusIndicatorClass = (status: Organization['status']) => {
  const classes = {
    'active': 'bg-green-400',
    'inactive': 'bg-gray-400',
    'prospect': 'bg-yellow-400'
  }
  return classes[status] || 'bg-gray-400'
}

const getActivityIndicatorClass = (score: number) => {
  if (score >= 8) return 'bg-green-400'
  if (score >= 6) return 'bg-yellow-400'
  if (score >= 4) return 'bg-orange-400'
  return 'bg-red-400'
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M'
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(0) + 'K'
  }
  return value.toString()
}

const formatLastActivity = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString()
}

const selectOrganization = (org: Organization) => {
  // TODO: Navigate to organization detail view
  console.log('Selected organization:', org.name)
}

const refreshMetrics = async () => {
  error.value = null
  
  try {
    if (isDemoMode) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Use demo data with some randomization
      organizations.value = demoOrganizations.map(org => ({
        ...org,
        contactCount: org.contactCount + Math.floor(Math.random() * 10) - 5,
        activityScore: Math.max(1, Math.min(10, org.activityScore + Math.floor(Math.random() * 3) - 1))
      }))
    } else {
      // TODO: Real API call would go here
      // const response = await dashboardStore.fetchOrganizationMetrics(selectedWeek.value)
      // organizations.value = response.data
      
      // For now, use demo data
      organizations.value = demoOrganizations
    }
  } catch (err) {
    console.error('Failed to fetch organization metrics:', err)
    error.value = 'Failed to load organization data'
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

/* Custom scrollbar for organization list */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
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

/* Smooth transitions */
.transition-colors {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
</style>