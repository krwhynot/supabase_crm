<template>
  <DashboardLayout>
    <div class="opportunities-list-view">
      <!-- Page Header -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div class="mb-4 lg:mb-0">
          <h1 class="text-3xl font-bold text-gray-900">Opportunities</h1>
          <p class="mt-2 text-gray-600">
            Manage your sales pipeline and track opportunity progress
          </p>
        </div>
        
        <div class="flex items-center space-x-3">
          <!-- Refresh Button -->
          <button
            @click="refreshData"
            :disabled="isLoading"
            class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            :aria-label="isLoading ? 'Refreshing...' : 'Refresh data'"
          >
            <svg 
              :class="['h-4 w-4', { 'animate-spin': isLoading }]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span class="ml-2 hidden sm:inline">Refresh</span>
          </button>
          
          <!-- New Opportunity Button -->
          <router-link
            to="/opportunities/new"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Opportunity
          </router-link>
        </div>
      </div>

      <!-- KPI Cards Section -->
      <div class="mb-8">
        <OpportunityKPICards 
          :loading="isLoadingKPIs"
          @card-click="handleKPICardClick"
        />
      </div>

      <!-- Search and Filters -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <!-- Search Input -->
          <div class="flex-1 max-w-md">
            <label for="search" class="sr-only">Search opportunities</label>
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
                placeholder="Search opportunities..."
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                @input="handleSearch"
              />
            </div>
          </div>
          
          <!-- Filter Controls -->
          <div class="flex items-center space-x-3">
            <!-- Stage Filter -->
            <select
              v-model="filters.stage"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              @change="applyFilters"
            >
              <option value="">All Stages</option>
              <option value="NEW_LEAD">New Lead</option>
              <option value="INITIAL_OUTREACH">Initial Outreach</option>
              <option value="SAMPLE_VISIT_OFFERED">Sample/Visit Offered</option>
              <option value="AWAITING_RESPONSE">Awaiting Response</option>
              <option value="FEEDBACK_LOGGED">Feedback Logged</option>
              <option value="DEMO_SCHEDULED">Demo Scheduled</option>
              <option value="CLOSED_WON">Closed - Won</option>
            </select>
            
            <!-- Organization Filter -->
            <select
              v-model="filters.organization"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              @change="applyFilters"
            >
              <option value="">All Organizations</option>
              <!-- Organizations would be populated dynamically -->
            </select>
            
            <!-- Sort Controls -->
            <select
              v-model="sortBy"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              @change="handleSort"
            >
              <option value="created_at">Sort by Created Date</option>
              <option value="name">Sort by Name</option>
              <option value="stage">Sort by Stage</option>
              <option value="probability_percent">Sort by Probability</option>
              <option value="expected_close_date">Sort by Close Date</option>
            </select>
            
            <button
              @click="toggleSortOrder"
              class="p-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary-500"
              :class="{ 'bg-gray-50': sortOrder === 'desc' }"
              :aria-label="`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`"
            >
              <svg class="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  stroke-linecap="round" 
                  stroke-linejoin="round" 
                  stroke-width="2" 
                  :d="sortOrder === 'asc' ? 'M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12' : 'M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4'" 
                />
              </svg>
            </button>
            
            <!-- Clear Filters -->
            <button
              v-if="hasActiveFilters"
              @click="clearFilters"
              class="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-1 focus:ring-primary-500 rounded-md"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="space-y-6">
        <!-- Loading State -->
        <div v-if="isLoading && opportunities.length === 0" class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div class="flex justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
          <p class="text-center text-gray-500 mt-4">Loading opportunities...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-white rounded-lg shadow-sm border border-red-200 p-6">
          <div class="flex items-center">
            <svg class="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-red-700">{{ error }}</span>
          </div>
          <div class="mt-4 flex space-x-3">
            <button
              @click="refreshData"
              class="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              Try Again
            </button>
            <button
              @click="clearFilters"
              class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="opportunities.length === 0 && !isLoading" class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">
            {{ hasActiveFilters ? 'No opportunities match your search' : 'No opportunities found' }}
          </h3>
          <p class="text-gray-500 mb-6">
            {{ hasActiveFilters 
              ? 'Try adjusting your search terms or filters.' 
              : 'Get started by creating your first opportunity.' 
            }}
          </p>
          
          <div class="flex justify-center space-x-3">
            <router-link
              v-if="!hasActiveFilters"
              to="/opportunities/new"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Your First Opportunity
            </router-link>
            
            <button
              v-if="hasActiveFilters"
              @click="clearFilters"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        <!-- Opportunities Table -->
        <div v-else>
          <OpportunityTable
            :loading="isLoading"
            @row-click="handleRowClick"
            @edit="handleEdit"
            @delete="handleDelete"
            @duplicate="handleDuplicate"
            @bulk-delete="handleBulkDelete"
            @create-new="handleCreateNew"
            @sort-change="handleTableSort"
          />
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useOpportunityStore } from '@/stores/opportunityStore'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import OpportunityKPICards from '@/components/opportunities/OpportunityKPICards.vue'
import OpportunityTable from '@/components/opportunities/OpportunityTable.vue'
import type { 
  OpportunityListView, 
  OpportunityFilters,
  OpportunityPagination
} from '@/types/opportunities'

// Dependencies
const router = useRouter()
const opportunityStore = useOpportunityStore()

// ===============================
// REACTIVE STATE
// ===============================

const searchQuery = ref('')
const sortBy = ref<string>('created_at')
const sortOrder = ref<'asc' | 'desc'>('desc')
const isLoadingKPIs = ref(false)

// Filters
const filters = ref<OpportunityFilters>({
  stage: '',
  organization: '',
  product: '',
  deal_owner: '',
  probability_min: undefined,
  probability_max: undefined,
  close_date_from: '',
  close_date_to: ''
})

// ===============================
// COMPUTED PROPERTIES
// ===============================

const opportunities = computed(() => opportunityStore.opportunities)
const isLoading = computed(() => opportunityStore.isLoading)
const error = computed(() => opportunityStore.error)
const totalCount = computed(() => opportunityStore.totalCount)

const hasActiveFilters = computed(() => {
  return !!(
    searchQuery.value ||
    filters.value.stage ||
    filters.value.organization ||
    filters.value.product ||
    filters.value.deal_owner ||
    filters.value.probability_min ||
    filters.value.probability_max ||
    filters.value.close_date_from ||
    filters.value.close_date_to
  )
})

// ===============================
// SEARCH & FILTERING
// ===============================

let searchTimeout: ReturnType<typeof setTimeout>

const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    applyFilters()
  }, 300)
}

const applyFilters = async () => {
  const appliedFilters: OpportunityFilters = {
    ...filters.value
  }
  
  // Add search query to filters
  if (searchQuery.value.trim()) {
    appliedFilters.search = searchQuery.value.trim()
  }
  
  const pagination: OpportunityPagination = {
    page: 1,
    limit: 20,
    sort_by: sortBy.value,
    sort_order: sortOrder.value
  }
  
  await opportunityStore.fetchOpportunities(appliedFilters, pagination)
}

const clearFilters = () => {
  searchQuery.value = ''
  filters.value = {
    stage: '',
    organization: '',
    product: '',
    deal_owner: '',
    probability_min: undefined,
    probability_max: undefined,
    close_date_from: '',
    close_date_to: ''
  }
  sortBy.value = 'created_at'
  sortOrder.value = 'desc'
  
  applyFilters()
}

// ===============================
// SORTING
// ===============================

const handleSort = () => {
  applyFilters()
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  applyFilters()
}

const handleTableSort = (column: string, order: 'asc' | 'desc') => {
  sortBy.value = column
  sortOrder.value = order
  applyFilters()
}

// ===============================
// DATA LOADING
// ===============================

const refreshData = async () => {
  await Promise.all([
    loadOpportunities(),
    loadKPIs()
  ])
}

const loadOpportunities = async () => {
  const appliedFilters: OpportunityFilters = {
    ...filters.value
  }
  
  if (searchQuery.value.trim()) {
    appliedFilters.search = searchQuery.value.trim()
  }
  
  const pagination: OpportunityPagination = {
    page: 1,
    limit: 20,
    sort_by: sortBy.value,
    sort_order: sortOrder.value
  }
  
  await opportunityStore.fetchOpportunities(appliedFilters, pagination)
}

const loadKPIs = async () => {
  isLoadingKPIs.value = true
  try {
    await opportunityStore.fetchKPIs()
  } finally {
    isLoadingKPIs.value = false
  }
}

// ===============================
// EVENT HANDLERS
// ===============================

const handleKPICardClick = (kpiType: string) => {
  // Handle KPI card drill-down
  console.log('KPI card clicked:', kpiType)
  // TODO: Implement filtering based on KPI type
}

const handleRowClick = (opportunity: OpportunityListView) => {
  router.push(`/opportunities/${opportunity.id}`)
}

const handleEdit = (opportunity: OpportunityListView) => {
  router.push(`/opportunities/${opportunity.id}/edit`)
}

const handleDelete = async (opportunity: OpportunityListView) => {
  if (confirm(`Are you sure you want to delete "${opportunity.name}"? This action cannot be undone.`)) {
    const success = await opportunityStore.deleteOpportunity(opportunity.id)
    if (success) {
      // Opportunity was removed from store automatically
      // Show success message if needed
    }
  }
}

const handleDuplicate = (opportunity: OpportunityListView) => {
  // TODO: Implement opportunity duplication
  console.log('Duplicate opportunity:', opportunity.id)
}

const handleBulkDelete = async (opportunityIds: string[]) => {
  if (confirm(`Are you sure you want to delete ${opportunityIds.length} opportunities? This action cannot be undone.`)) {
    // TODO: Implement bulk delete
    console.log('Bulk delete opportunities:', opportunityIds)
  }
}

const handleCreateNew = () => {
  router.push('/opportunities/new')
}

// ===============================
// LIFECYCLE
// ===============================

onMounted(async () => {
  await refreshData()
})

// Watch for route changes to refresh data
watch(() => router.currentRoute.value.fullPath, (newPath) => {
  if (newPath === '/opportunities') {
    refreshData()
  }
})
</script>

<style scoped>
.opportunities-list-view {
  @apply max-w-7xl mx-auto;
}

/* Loading states */
.loading-overlay {
  @apply absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center;
}

/* Search input enhancements */
.search-input:focus {
  @apply ring-2 ring-primary-500 border-primary-500;
}

/* Filter controls */
.filter-controls select:focus {
  @apply ring-2 ring-primary-500 border-primary-500;
}

/* Responsive design */
@media (max-width: 1024px) {
  .opportunities-list-view {
    @apply px-4;
  }
}

@media (max-width: 768px) {
  .opportunities-list-view {
    @apply px-2;
  }
  
  /* Stack filters vertically on mobile */
  .filter-controls {
    @apply flex-col space-y-3;
  }
  
  .filter-controls > div {
    @apply space-x-0 space-y-2 flex-col;
  }
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
  .opportunities-list-view {
    @apply shadow-none;
  }
  
  .bg-primary-600,
  .bg-primary-700 {
    @apply bg-gray-800 !important;
  }
  
  button {
    @apply hidden;
  }
}
</style>