<!--
  PrincipalsListView - Principal overview page optimized for iPad viewport
  
  Features:
  - iPad-optimized layout (768px viewport, no horizontal scrolling)
  - Principal selector and filtering interface
  - KPI dashboard with engagement metrics
  - Principal grid/list with activity summaries
  - Touch-friendly interactions (44px minimum targets)
  - Quick actions for common workflows
  
  Viewport Optimization:
  - Mobile-first responsive design
  - Stacked layouts prevent overflow
  - Touch targets meet accessibility standards
  - No horizontal scrolling required
-->
<template>
  <div class="principals-list-view max-w-full" data-testid="principals-list-view">
    <!-- Page Header -->
    <div class="flex flex-col space-y-4 mb-6" data-testid="principals-header">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div class="mb-4 sm:mb-0">
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900" data-testid="page-title">
            Principal Activity Management
          </h1>
          <p class="mt-1 text-sm text-gray-600">
            Comprehensive relationship insights and performance analytics
          </p>
        </div>
        
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <!-- Refresh Button -->
          <button
            @click="handleRefresh"
            :disabled="isLoading"
            class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 min-h-[44px]"
            :aria-label="isLoading ? 'Refreshing...' : 'Refresh data'"
          >
            <svg 
              :class="['h-4 w-4 mr-2', { 'animate-spin': isLoading }]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          
          <!-- Export Button -->
          <button
            @click="handleExport"
            class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[44px]"
          >
            <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </button>
        </div>
      </div>
      
      <!-- Principal Selector - Full width on mobile -->
      <div class="w-full">
        <PrincipalSelector
          v-model="selectedPrincipalId"
          :loading="isLoadingSelector"
          :error="selectorError"
          allow-all-principals
          @change="handlePrincipalChange"
          class="w-full"
        />
      </div>
    </div>

    <!-- KPI Dashboard Section -->
    <section class="mb-8" data-testid="kpi-dashboard-section">
      <div class="mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Performance Overview</h2>
        <p class="text-sm text-gray-600">Key metrics and engagement insights</p>
      </div>
      
      <PrincipalKPICards 
        :activity-summary="activitySummary"
        :engagement-breakdown="engagementBreakdown"
        :stats="principalStats"
        :loading="isLoadingKPIs"
        :selected-principal-id="selectedPrincipalId"
        data-testid="kpi-cards"
      />
    </section>

    <!-- Search and Filters - Stacked layout for mobile -->
    <section class="mb-6">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div class="space-y-4">
          <!-- Search Input -->
          <div class="w-full">
            <label for="search" class="sr-only">Search principals</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search"
                v-model="searchQuery"
                type="text"
                placeholder="Search principals by name or organization..."
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
                @input="handleSearch"
              />
            </div>
          </div>
          
          <!-- Filter Controls - Stacked on mobile -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <!-- Activity Status Filter -->
            <select
              v-model="filters.activityStatus"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
              @change="applyFilters"
            >
              <option value="">All Activity Levels</option>
              <option value="ACTIVE">Active</option>
              <option value="MODERATE">Moderate</option>
              <option value="LOW">Low Activity</option>
              <option value="NO_ACTIVITY">No Activity</option>
            </select>
            
            <!-- Engagement Score Filter -->
            <select
              v-model="filters.engagementLevel"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
              @change="applyFilters"
            >
              <option value="">All Engagement Levels</option>
              <option value="high">High (80-100)</option>
              <option value="medium">Medium (40-79)</option>
              <option value="low">Low (0-39)</option>
            </select>
            
            <!-- Organization Type Filter -->
            <select
              v-model="filters.organizationType"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
              @change="applyFilters"
            >
              <option value="">All Organization Types</option>
              <option value="DISTRIBUTOR">Distributor</option>
              <option value="RETAILER">Retailer</option>
              <option value="MANUFACTURER">Manufacturer</option>
              <option value="CONSULTANT">Consultant</option>
            </select>
            
            <!-- Follow-up Filter -->
            <select
              v-model="filters.followUpStatus"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
              @change="applyFilters"
            >
              <option value="">All Follow-up Status</option>
              <option value="required">Requires Follow-up</option>
              <option value="scheduled">Scheduled</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          
          <!-- Active Filters and Clear -->
          <div v-if="hasActiveFilters" class="flex flex-wrap items-center gap-2">
            <span class="text-sm text-gray-600">Active filters:</span>
            <button
              v-for="filter in activeFiltersList"
              :key="filter.key"
              @click="removeFilter(filter.key)"
              class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {{ filter.label }}
              <svg class="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              @click="clearAllFilters"
              class="text-sm text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            >
              Clear all
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content Area -->
    <section class="space-y-6">
      <!-- Loading State -->
      <div v-if="isLoading && principalsList.length === 0" class="bg-white rounded-lg shadow-sm border border-gray-200 p-8" data-testid="loading-spinner">
        <div class="flex flex-col items-center justify-center space-y-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="text-center text-gray-500">Loading principal data...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-white rounded-lg shadow-sm border border-red-200 p-6" data-testid="error-message">
        <div class="flex items-start space-x-3">
          <svg class="h-5 w-5 text-red-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <h3 class="text-sm font-medium text-red-800">Error loading principal data</h3>
            <p class="mt-1 text-sm text-red-700">{{ error }}</p>
            <div class="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                @click="handleRefresh"
                class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 min-h-[44px]"
                data-testid="retry-button"
              >
                Try Again
              </button>
              <button
                @click="clearAllFilters"
                class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[44px]"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="principalsList.length === 0 && !isLoading" class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          {{ hasActiveFilters ? 'No principals match your search' : 'No principals found' }}
        </h3>
        <p class="text-gray-500 mb-6">
          {{ hasActiveFilters 
            ? 'Try adjusting your search terms or filters to find the principals you\'re looking for.' 
            : 'Principals will appear here once they are created in the system.' 
          }}
        </p>
        
        <div class="flex flex-col sm:flex-row justify-center gap-3">
          <button
            v-if="hasActiveFilters"
            @click="clearAllFilters"
            class="inline-flex items-center justify-center px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[44px]"
          >
            Clear All Filters
          </button>
          
          <router-link
            to="/organizations/new"
            class="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[44px]"
          >
            <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Organization
          </router-link>
        </div>
      </div>

      <!-- Principals Grid/List -->
      <div v-else data-testid="principals-grid-section">
        <!-- View Toggle -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-700">
              {{ filteredPrincipalsCount }} principal{{ filteredPrincipalsCount === 1 ? '' : 's' }}
            </span>
            <span v-if="hasActiveFilters" class="text-sm text-gray-500">
              (filtered from {{ totalPrincipalsCount }})
            </span>
          </div>
          
          <div class="flex items-center space-x-2">
            <label for="view-toggle" class="sr-only">Toggle view</label>
            <button
              @click="viewMode = 'grid'"
              :class="[
                'p-2 rounded-md transition-colors',
                viewMode === 'grid' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-400 hover:text-gray-600'
              ]"
              :aria-pressed="viewMode === 'grid'"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              @click="viewMode = 'list'"
              :class="[
                'p-2 rounded-md transition-colors',
                viewMode === 'list' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-400 hover:text-gray-600'
              ]"
              :aria-pressed="viewMode === 'list'"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Grid View -->
        <div v-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <PrincipalCard
            v-for="principal in paginatedPrincipals"
            :key="principal.principal_id"
            :principal="principal"
            @click="handlePrincipalClick(principal)"
            @create-opportunity="handleCreateOpportunity(principal)"
            @log-interaction="handleLogInteraction(principal)"
            class="cursor-pointer hover:shadow-md transition-shadow duration-200"
          />
        </div>

        <!-- List View -->
        <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <PrincipalTable
            :principals="paginatedPrincipals"
            :loading="isLoading"
            @principal-click="handlePrincipalClick"
            @create-opportunity="handleCreateOpportunity"
            @log-interaction="handleLogInteraction"
            @sort-change="handleSortChange"
          />
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="mt-6 flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
          <div class="text-sm text-gray-700">
            Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, filteredPrincipalsCount) }} 
            of {{ filteredPrincipalsCount }} principals
          </div>
          
          <div class="flex items-center space-x-2">
            <button
              @click="previousPage"
              :disabled="currentPage === 1"
              class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            
            <span class="text-sm text-gray-700">
              Page {{ currentPage }} of {{ totalPages }}
            </span>
            
            <button
              @click="nextPage"
              :disabled="currentPage === totalPages"
              class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              Next
              <svg class="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePrincipalStore } from '@/stores/principalStore'
import { principalActivityApi } from '@/services/principalActivityApi'
import type {
  PrincipalActivitySummary
} from '@/types/principal'

// Component imports
import PrincipalSelector from '@/components/principal/PrincipalSelector.vue'
import PrincipalKPICards from '@/components/principal/PrincipalKPICards.vue'
import PrincipalCard from '@/components/principal/PrincipalCard.vue'
import PrincipalTable from '@/components/principal/PrincipalTable.vue'

// ===============================
// COMPOSABLES & STORES
// ===============================

const router = useRouter()
const principalStore = usePrincipalStore()

// ===============================
// REACTIVE STATE
// ===============================

const selectedPrincipalId = ref<string>('all')
const searchQuery = ref('')
const viewMode = ref<'grid' | 'list'>('grid')
const currentPage = ref(1)
const pageSize = ref(12)

// Loading states
const isLoading = ref(false)
const isLoadingSelector = ref(false)
const isLoadingKPIs = ref(false)

// Error handling
const error = ref<string | null>(null)
const selectorError = ref<string | null>(null)

// Data states
const principalsList = ref<PrincipalActivitySummary[]>([])
const activitySummary = ref<PrincipalActivitySummary[]>([])
const engagementBreakdown = ref<any>(null)
const principalStats = ref<any>(null)

// Filters
const filters = ref({
  activityStatus: '',
  engagementLevel: '',
  organizationType: '',
  followUpStatus: ''
})

// ===============================
// COMPUTED PROPERTIES
// ===============================

const hasActiveFilters = computed(() => {
  return !!(
    searchQuery.value ||
    filters.value.activityStatus ||
    filters.value.engagementLevel ||
    filters.value.organizationType ||
    filters.value.followUpStatus
  )
})

const activeFiltersList = computed(() => {
  const filtersList: Array<{ key: string; label: string }> = []
  
  if (searchQuery.value) {
    filtersList.push({ key: 'search', label: `Search: "${searchQuery.value}"` })
  }
  
  if (filters.value.activityStatus) {
    filtersList.push({ key: 'activityStatus', label: `Activity: ${filters.value.activityStatus}` })
  }
  
  if (filters.value.engagementLevel) {
    filtersList.push({ key: 'engagementLevel', label: `Engagement: ${filters.value.engagementLevel}` })
  }
  
  if (filters.value.organizationType) {
    filtersList.push({ key: 'organizationType', label: `Type: ${filters.value.organizationType}` })
  }
  
  if (filters.value.followUpStatus) {
    filtersList.push({ key: 'followUpStatus', label: `Follow-up: ${filters.value.followUpStatus}` })
  }
  
  return filtersList
})

const filteredPrincipals = computed(() => {
  let filtered = [...principalsList.value]
  
  // Apply search filter
  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase()
    filtered = filtered.filter(principal => 
      principal.principal_name?.toLowerCase().includes(search) ||
      principal.principal_name?.toLowerCase().includes(search)
    )
  }
  
  // Apply activity status filter
  if (filters.value.activityStatus) {
    filtered = filtered.filter(principal => 
      principal.activity_status === filters.value.activityStatus
    )
  }
  
  // Apply engagement level filter
  if (filters.value.engagementLevel) {
    filtered = filtered.filter(principal => {
      const score = principal.engagement_score || 0
      switch (filters.value.engagementLevel) {
        case 'high': return score >= 80
        case 'medium': return score >= 40 && score < 80
        case 'low': return score < 40
        default: return true
      }
    })
  }
  
  // Apply organization type filter
  if (filters.value.organizationType) {
    filtered = filtered.filter(principal => 
      principal.organization_type === filters.value.organizationType
    )
  }
  
  // Apply follow-up filter
  if (filters.value.followUpStatus) {
    filtered = filtered.filter(principal => {
      switch (filters.value.followUpStatus) {
        case 'required': return (principal.follow_ups_required || 0) > 0
        case 'scheduled': return principal.next_follow_up_date != null
        case 'overdue': 
          return principal.next_follow_up_date != null && 
                 new Date(principal.next_follow_up_date) < new Date()
        default: return true
      }
    })
  }
  
  return filtered
})

const filteredPrincipalsCount = computed(() => filteredPrincipals.value.length)
const totalPrincipalsCount = computed(() => principalsList.value.length)

const totalPages = computed(() => 
  Math.ceil(filteredPrincipalsCount.value / pageSize.value)
)

const paginatedPrincipals = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredPrincipals.value.slice(start, end)
})

// ===============================
// EVENT HANDLERS
// ===============================

let searchTimeout: ReturnType<typeof setTimeout>

const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1 // Reset to first page when searching
  }, 300)
}

const handlePrincipalChange = (principalId: string) => {
  selectedPrincipalId.value = principalId
  // KPI cards will automatically update based on selectedPrincipalId
}

const handleRefresh = async () => {
  await Promise.all([
    loadPrincipalsData(),
    loadKPIData()
  ])
}

const handleExport = () => {
  // TODO: Implement export functionality
  console.log('Export principals data')
}

const applyFilters = () => {
  currentPage.value = 1 // Reset to first page when filtering
}

const removeFilter = (filterKey: string) => {
  switch (filterKey) {
    case 'search':
      searchQuery.value = ''
      break
    case 'activityStatus':
      filters.value.activityStatus = ''
      break
    case 'engagementLevel':
      filters.value.engagementLevel = ''
      break
    case 'organizationType':
      filters.value.organizationType = ''
      break
    case 'followUpStatus':
      filters.value.followUpStatus = ''
      break
  }
  applyFilters()
}

const clearAllFilters = () => {
  searchQuery.value = ''
  filters.value = {
    activityStatus: '',
    engagementLevel: '',
    organizationType: '',
    followUpStatus: ''
  }
  selectedPrincipalId.value = 'all'
  applyFilters()
}

const handlePrincipalClick = (principal: PrincipalActivitySummary) => {
  router.push(`/principals/${principal.principal_id}`)
}

const handleCreateOpportunity = (principal: PrincipalActivitySummary) => {
  router.push(`/opportunities/new?principal=${principal.principal_id}`)
}

const handleLogInteraction = (principal: PrincipalActivitySummary) => {
  router.push(`/interactions/new?principal=${principal.principal_id}`)
}

const handleSortChange = (column: string, direction: 'asc' | 'desc') => {
  // Sort the principalsList
  principalsList.value.sort((a, b) => {
    let aValue: any
    let bValue: any
    
    switch (column) {
      case 'name':
        aValue = a.principal_name || ''
        bValue = b.principal_name || ''
        break
      case 'engagement':
        aValue = a.engagement_score || 0
        bValue = b.engagement_score || 0
        break
      case 'activity':
        aValue = a.last_activity_date || ''
        bValue = b.last_activity_date || ''
        break
      case 'opportunities':
        aValue = a.active_opportunities || 0
        bValue = b.active_opportunities || 0
        break
      default:
        return 0
    }
    
    if (direction === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })
}

// Pagination handlers
const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

// ===============================
// DATA LOADING FUNCTIONS
// ===============================

const loadPrincipalsData = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    const response = await principalActivityApi.getPrincipalActivitySummary()
    if (response.success) {
      principalsList.value = response.data || []
    } else {
      error.value = response.error || 'Failed to load principals data'
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unexpected error occurred'
  } finally {
    isLoading.value = false
  }
}

const loadKPIData = async () => {
  isLoadingKPIs.value = true
  
  try {
    // Load engagement breakdown
    const engagementResponse = await principalActivityApi.getEngagementScoreBreakdown()
    if (engagementResponse.success) {
      engagementBreakdown.value = engagementResponse.data
    }

    // Load principal stats
    const statsResponse = await principalActivityApi.getPrincipalStats()
    if (statsResponse.success) {
      principalStats.value = statsResponse.data
    }

    // Load activity summary for KPI cards
    const summaryResponse = await principalActivityApi.getPrincipalActivitySummary()
    if (summaryResponse.success) {
      activitySummary.value = summaryResponse.data || []
    }
  } catch (err) {
    console.error('Failed to load KPI data:', err)
  } finally {
    isLoadingKPIs.value = false
  }
}

// ===============================
// LIFECYCLE
// ===============================

onMounted(async () => {
  await Promise.all([
    loadPrincipalsData(),
    loadKPIData(),
    principalStore.fetchPrincipalOptions()
  ])
})

// Watch for route changes to refresh data
watch(() => router.currentRoute.value.fullPath, (newPath) => {
  if (newPath === '/principals') {
    handleRefresh()
  }
})

// Reset page when filters change
watch([searchQuery, filters], () => {
  currentPage.value = 1
}, { deep: true })
</script>

<style scoped>
.principals-list-view {
  /* Ensure no horizontal overflow on small screens */
  overflow-x: hidden;
}

/* Loading states */
.loading-overlay {
  @apply absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center;
}

/* Responsive adjustments for iPad and smaller */
@media (max-width: 1024px) {
  .principals-list-view {
    @apply px-4;
  }
}

@media (max-width: 768px) {
  .principals-list-view {
    @apply px-2;
  }
  
  /* Ensure proper spacing on mobile */
  .grid {
    @apply gap-3;
  }
  
  /* Stack pagination on mobile */
  .pagination-controls {
    @apply flex-col space-y-3;
  }
}

/* Touch targets - ensure minimum 44px height */
button, select, input, .touch-target {
  min-height: 44px;
}

/* Accessibility enhancements */
@media (prefers-reduced-motion: reduce) {
  .animate-spin {
    animation: none;
  }
  
  * {
    transition: none !important;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .bg-white {
    @apply border-2 border-gray-800;
  }
  
  .text-gray-400 {
    @apply text-gray-800;
  }
  
  .text-gray-500 {
    @apply text-gray-900;
  }
}

/* Print styles */
@media print {
  .principals-list-view {
    @apply shadow-none;
  }
  
  .bg-blue-600,
  .bg-blue-700 {
    @apply bg-gray-800 !important;
  }
  
  button {
    @apply hidden;
  }
}
</style>