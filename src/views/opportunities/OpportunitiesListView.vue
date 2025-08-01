<template>
  <div class="opportunities-list-view">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Opportunities</h1>
          <p class="mt-2 text-gray-600">Manage your sales pipeline and track deal progress</p>
        </div>
        <div class="mt-4 sm:mt-0">
          <router-link
            to="/opportunities/new"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <PlusIcon class="-ml-1 mr-2 h-5 w-5" />
            New Opportunity
          </router-link>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="mb-8">
        <OpportunityKPICards
          :loading="kpisLoading"
          @card-click="handleKPICardClick"
        />
      </div>

      <!-- Search and Filters -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <!-- Search -->
          <div class="flex-1 max-w-md">
            <label for="search" class="sr-only">Search opportunities</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="search"
                v-model="searchQuery"
                type="text"
                placeholder="Search opportunities..."
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                @input="handleSearchDebounced"
              />
            </div>
          </div>
          
          <!-- Filters -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <!-- Stage Filter -->
            <select
              v-model="selectedStage"
              class="block w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              @change="handleFilterChange"
            >
              <option value="">All Stages</option>
              <option v-for="stage in availableStages" :key="stage" :value="stage">
                {{ stage }}
              </option>
            </select>
            
            <!-- Deal Owner Filter -->
            <select
              v-model="selectedOwner"
              class="block w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              @change="handleFilterChange"
            >
              <option value="">All Owners</option>
              <option v-for="owner in availableOwners" :key="owner" :value="owner">
                {{ owner }}
              </option>
            </select>
            
            <!-- Sort Options -->
            <select
              v-model="sortBy"
              class="block w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              @change="handleSortChange"
            >
              <option value="created_at">Sort by Created Date</option>
              <option value="name">Sort by Name</option>
              <option value="stage">Sort by Stage</option>
              <option value="expected_close_date">Sort by Close Date</option>
              <option value="probability_percent">Sort by Probability</option>
            </select>
            
            <!-- Sort Order -->
            <button
              @click="toggleSortOrder"
              class="inline-flex items-center justify-center p-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              :class="{ 'bg-gray-50': sortOrder === 'desc' }"
              :aria-label="`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`"
            >
              <ArrowUpIcon 
                v-if="sortOrder === 'asc'"
                class="h-5 w-5 text-gray-500" 
              />
              <ArrowDownIcon 
                v-else
                class="h-5 w-5 text-gray-500" 
              />
            </button>
            
            <!-- Clear Filters -->
            <button
              v-if="hasActiveFilters"
              @click="clearAllFilters"
              class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <XMarkIcon class="h-4 w-4 mr-1" />
              Clear
            </button>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-if="error && !isLoading" class="bg-white rounded-lg shadow-sm border border-red-200 p-6 mb-6">
        <div class="flex items-center">
          <ExclamationTriangleIcon class="h-5 w-5 text-red-400 mr-2" />
          <span class="text-red-700">{{ error }}</span>
        </div>
        <div class="mt-4">
          <button
            @click="retryLoad"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <ArrowPathIcon class="h-4 w-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>

      <!-- Opportunities Table -->
      <OpportunityTable
        :show-pagination="true"
        :items-per-page="20"
        @row-click="handleRowClick"
        @edit="handleEdit"
        @delete="handleDelete"
        @duplicate="handleDuplicate"
        @bulk-delete="handleBulkDelete"
        @create-new="handleCreateNew"
        @sort-change="handleTableSortChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useOpportunityStore } from '@/stores/opportunityStore'
import { OpportunityStage } from '@/types/opportunities'
import type { OpportunityListView, OpportunityFilters, OpportunityPagination } from '@/types/opportunities'

// Components
import OpportunityKPICards from '@/components/opportunities/OpportunityKPICards.vue'
import OpportunityTable from '@/components/opportunities/OpportunityTable.vue'

// Icons
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'

// ===============================
// ROUTER INTEGRATION
// ===============================

const router = useRouter()

// ===============================
// STORE INTEGRATION
// ===============================

const opportunityStore = useOpportunityStore()

const opportunities = computed(() => opportunityStore.opportunities)
const isLoading = computed(() => opportunityStore.isLoading)
const error = computed(() => opportunityStore.error)
const kpis = computed(() => opportunityStore.kpis)
const kpisLoading = computed(() => opportunityStore.loading && !opportunityStore.kpis)

// ===============================
// LOCAL STATE
// ===============================

const searchQuery = ref('')
const selectedStage = ref<string>('')
const selectedOwner = ref<string>('')
const sortBy = ref<string>('created_at')
const sortOrder = ref<'asc' | 'desc'>('desc')

// Debounced search timeout
let searchTimeout: ReturnType<typeof setTimeout>

// ===============================
// COMPUTED PROPERTIES
// ===============================

const availableStages = computed(() => Object.values(OpportunityStage))

const availableOwners = computed(() => {
  const owners = new Set<string>()
  opportunities.value.forEach(opp => {
    if (opp.deal_owner) {
      owners.add(opp.deal_owner)
    }
  })
  return Array.from(owners).sort()
})

const hasActiveFilters = computed(() => {
  return !!(searchQuery.value || selectedStage.value || selectedOwner.value)
})

const currentFilters = computed((): OpportunityFilters => {
  const filters: OpportunityFilters = {}
  
  if (searchQuery.value.trim()) {
    filters.search = searchQuery.value.trim()
  }
  
  if (selectedStage.value) {
    filters.stage = [selectedStage.value as OpportunityStage]
  }
  
  if (selectedOwner.value) {
    filters.deal_owner = selectedOwner.value
  }
  
  return filters
})

const currentPagination = computed((): OpportunityPagination => ({
  page: 1,
  limit: 20,
  sort_by: sortBy.value,
  sort_order: sortOrder.value
}))

// ===============================
// METHODS
// ===============================

/**
 * Load opportunities with current filters and pagination
 */
const loadOpportunities = async (): Promise<void> => {
  await opportunityStore.fetchOpportunities(currentFilters.value, currentPagination.value)
}

/**
 * Load KPIs for dashboard cards
 */
const loadKPIs = async (): Promise<void> => {
  await opportunityStore.fetchKPIs()
}

/**
 * Handle debounced search
 */
const handleSearchDebounced = (): void => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadOpportunities()
  }, 300)
}

/**
 * Handle filter changes
 */
const handleFilterChange = (): void => {
  loadOpportunities()
}

/**
 * Handle sort changes
 */
const handleSortChange = (): void => {
  loadOpportunities()
}

/**
 * Toggle sort order
 */
const toggleSortOrder = (): void => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  loadOpportunities()
}

/**
 * Clear all active filters
 */
const clearAllFilters = (): void => {
  searchQuery.value = ''
  selectedStage.value = ''
  selectedOwner.value = ''
  sortBy.value = 'created_at'
  sortOrder.value = 'desc'
  loadOpportunities()
}

/**
 * Retry loading data
 */
const retryLoad = async (): Promise<void> => {
  opportunityStore.clearError()
  await Promise.all([loadOpportunities(), loadKPIs()])
}

/**
 * Handle KPI card clicks for drill-down
 */
const handleKPICardClick = (kpiType: string): void => {
  // TODO: Implement KPI drill-down filtering
  console.log('KPI card clicked:', kpiType)
}

/**
 * Handle table row clicks
 */
const handleRowClick = (opportunity: OpportunityListView): void => {
  router.push(`/opportunities/${opportunity.id}`)
}

/**
 * Handle edit action
 */
const handleEdit = (opportunity: OpportunityListView): void => {
  router.push(`/opportunities/${opportunity.id}/edit`)
}

/**
 * Handle delete action
 */
const handleDelete = async (opportunity: OpportunityListView): Promise<void> => {
  if (confirm(`Are you sure you want to delete "${opportunity.name}"? This action cannot be undone.`)) {
    const success = await opportunityStore.deleteOpportunity(opportunity.id)
    if (success) {
      // Reload opportunities to reflect changes
      await loadOpportunities()
    }
  }
}

/**
 * Handle duplicate action
 */
const handleDuplicate = (opportunity: OpportunityListView): void => {
  // TODO: Implement opportunity duplication
  console.log('Duplicate opportunity:', opportunity.id)
}

/**
 * Handle bulk delete
 */
const handleBulkDelete = async (opportunityIds: string[]): Promise<void> => {
  const confirmMessage = `Are you sure you want to delete ${opportunityIds.length} opportunities? This action cannot be undone.`
  
  if (confirm(confirmMessage)) {
    // Delete each opportunity
    const deletePromises = opportunityIds.map(id => 
      opportunityStore.deleteOpportunity(id)
    )
    
    await Promise.all(deletePromises)
    
    // Reload opportunities to reflect changes
    await loadOpportunities()
  }
}

/**
 * Handle create new opportunity
 */
const handleCreateNew = (): void => {
  router.push('/opportunities/new')
}

/**
 * Handle table sort changes
 */
const handleTableSortChange = (column: string, order: 'asc' | 'desc'): void => {
  sortBy.value = column
  sortOrder.value = order
  loadOpportunities()
}

// ===============================
// WATCHERS
// ===============================

// Watch for route changes to reload data
watch(() => router.currentRoute.value.path, (newPath) => {
  if (newPath === '/opportunities' || newPath === '/opportunities/') {
    loadOpportunities()
  }
})

// ===============================
// LIFECYCLE
// ===============================

onMounted(async () => {
  // Load initial data
  await Promise.all([
    loadOpportunities(),
    loadKPIs()
  ])
})
</script>

<style scoped>
.opportunities-list-view {
  @apply min-h-screen;
}

/* Responsive design optimizations */
@media (min-width: 768px) and (max-width: 1024px) {
  /* iPad Portrait Optimization */
  .opportunities-list-view {
    @apply px-4;
  }
}

@media (max-width: 767px) {
  /* Mobile Optimization */
  .opportunities-list-view {
    @apply px-3;
  }
  
  .opportunities-list-view h1 {
    @apply text-2xl;
  }
}

/* Accessibility enhancements */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .opportunities-list-view input,
  .opportunities-list-view select,
  .opportunities-list-view button {
    @apply border-2 border-gray-600;
  }
}
</style>