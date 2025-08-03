<template>
  <div class="interactions-list-view" data-testid="interactions-list-view">
      <!-- Breadcrumb Navigation -->
      <BreadcrumbNavigation :items="[{ label: 'Interactions' }]" />
      
      <!-- Page Header -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8" data-testid="interactions-header">
        <div class="mb-4 lg:mb-0">
          <h1 class="text-3xl font-bold text-gray-900" data-testid="page-title">Interactions</h1>
          <p class="mt-2 text-gray-600">
            Track customer interactions and manage follow-ups
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
          
          <!-- Quick Action Dropdown -->
          <div class="relative" ref="quickActionDropdown">
            <button
              @click="showQuickActions = !showQuickActions"
              class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              <span class="ml-2 hidden sm:inline">Quick Add</span>
              <svg class="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            <!-- Quick Actions Menu -->
            <div
              v-if="showQuickActions"
              class="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
            >
              <div class="py-1" role="menu">
                <button
                  v-for="action in quickActions"
                  :key="action.id"
                  @click="handleQuickAction(action)"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center"
                  role="menuitem"
                >
                  <component :is="getIconComponent(action.icon)" class="h-4 w-4 mr-3 text-gray-400" />
                  {{ action.name }}
                </button>
                <div class="border-t border-gray-100"></div>
                <router-link
                  to="/interactions/new"
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  role="menuitem"
                  @click="showQuickActions = false"
                >
                  <div class="flex items-center">
                    <svg class="h-4 w-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Full Form...
                  </div>
                </router-link>
              </div>
            </div>
          </div>
          
          <!-- New Interaction Button -->
          <router-link
            to="/interactions/new"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Interaction
          </router-link>
        </div>
      </div>

      <!-- KPI Cards Section -->
      <div class="mb-8" data-testid="kpi-cards-section">
        <InteractionKPICards 
          :loading="isLoadingKPIs"
          @card-click="handleKPICardClick"
          data-testid="kpi-cards"
        />
      </div>

      <!-- Follow-up Alerts -->
      <div v-if="overdueFollowUps.length > 0" class="mb-6">
        <div class="bg-red-50 border border-red-200 rounded-md p-4">
          <div class="flex">
            <svg class="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="flex-1">
              <h3 class="text-sm font-medium text-red-800">
                {{ overdueFollowUps.length }} Overdue Follow-ups
              </h3>
              <p class="mt-1 text-sm text-red-700">
                You have follow-ups that are past due. Click to view and update them.
              </p>
            </div>
            <div class="ml-4">
              <button
                @click="filterByOverdueFollowUps"
                class="text-sm font-medium text-red-800 hover:text-red-600"
              >
                View All →
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Search and Filters -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <!-- Search Input -->
          <div class="flex-1 max-w-md">
            <label for="search" class="sr-only">Search interactions</label>
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
                placeholder="Search interactions..."
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                @input="handleSearch"
              />
            </div>
          </div>
          
          <!-- Filter Controls -->
          <div class="flex items-center space-x-3 flex-wrap">
            <!-- Type Filter -->
            <select
              v-model="filters.type"
              class="block px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              @change="applyFilters"
            >
              <option value="">All Types</option>
              <option value="PHONE_CALL">Phone Call</option>
              <option value="EMAIL">Email</option>
              <option value="IN_PERSON_MEETING">In-Person Meeting</option>
              <option value="VIRTUAL_MEETING">Virtual Meeting</option>
              <option value="PRODUCT_DEMO">Product Demo</option>
              <option value="SITE_VISIT">Site Visit</option>
              <option value="FOLLOW_UP">Follow-up</option>
              <option value="OTHER">Other</option>
            </select>
            
            <!-- Status Filter -->
            <select
              v-model="filters.status"
              class="block px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              @change="applyFilters"
            >
              <option value="">All Status</option>
              <option value="PLANNED">Planned</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="RESCHEDULED">Rescheduled</option>
            </select>
            
            <!-- Follow-up Filter -->
            <select
              v-model="filters.followUp"
              class="block px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              @change="applyFilters"
            >
              <option value="">All Follow-ups</option>
              <option value="required">Follow-up Required</option>
              <option value="overdue">Overdue</option>
              <option value="upcoming">Due Soon</option>
            </select>
            
            <!-- Sort Controls -->
            <select
              v-model="sortBy"
              class="block px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              @change="handleSort"
            >
              <option value="interaction_date">Sort by Date</option>
              <option value="title">Sort by Title</option>
              <option value="type">Sort by Type</option>
              <option value="status">Sort by Status</option>
              <option value="organization_name">Sort by Organization</option>
              <option value="created_at">Sort by Created</option>
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
        <div v-if="isLoading && interactions.length === 0" class="bg-white rounded-lg shadow-sm border border-gray-200 p-8" data-testid="loading-spinner">
          <div class="flex justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
          <p class="text-center text-gray-500 mt-4">Loading interactions...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-white rounded-lg shadow-sm border border-red-200 p-6" data-testid="error-message">
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
              data-testid="retry-button"
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
        <div v-else-if="interactions.length === 0 && !isLoading" class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">
            {{ hasActiveFilters ? 'No interactions match your search' : 'No interactions found' }}
          </h3>
          <p class="text-gray-500 mb-6">
            {{ hasActiveFilters 
              ? 'Try adjusting your search terms or filters.' 
              : 'Get started by logging your first customer interaction.' 
            }}
          </p>
          
          <div class="flex justify-center space-x-3">
            <router-link
              v-if="!hasActiveFilters"
              to="/interactions/new"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create First Interaction
            </router-link>
            
            <button
              v-if="hasActiveFilters"
              @click="clearFilters"
              class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <!-- Interactions Table -->
        <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200">
          <InteractionTable
            :interactions="interactions"
            :loading="isLoading"
            :total-count="totalCount"
            :current-page="currentPage"
            :has-next-page="hasNextPage"
            :has-previous-page="hasPreviousPage"
            @interaction-selected="handleInteractionSelected"
            @page-changed="handlePageChanged"
            @sort-changed="handleSortChanged"
            @refresh="refreshData"
            data-testid="interactions-table"
          />
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useInteractionStore } from '@/stores/interactionStore'
import BreadcrumbNavigation from '@/components/common/BreadcrumbNavigation.vue'
import InteractionKPICards from '@/components/interactions/InteractionKPICards.vue'
import InteractionTable from '@/components/interactions/InteractionTable.vue'
import { 
  PhoneIcon,
  EnvelopeIcon,
  PresentationChartLineIcon,
  UsersIcon
} from '@heroicons/vue/24/outline'
import type { InteractionListView, InteractionFilters, InteractionPagination } from '@/types/interactions'
import type { QuickInteractionAction } from '@/types/interactionForm'

// Dependencies
const router = useRouter()
const interactionStore = useInteractionStore()

// ===============================
// COMPONENT STATE
// ===============================

const searchQuery = ref('')
const showQuickActions = ref(false)
const quickActionDropdown = ref<HTMLElement>()

// Filter and sorting state
const filters = reactive({
  type: '',
  status: '',
  followUp: '',
  organization: ''
})

const sortBy = ref('interaction_date')
const sortOrder = ref<'asc' | 'desc'>('desc')

// ===============================
// COMPUTED PROPERTIES
// ===============================

const interactions = computed(() => interactionStore.interactions)
const isLoading = computed(() => interactionStore.loading)
const isLoadingKPIs = computed(() => interactionStore.loading)
const error = computed(() => interactionStore.error)
const totalCount = computed(() => interactionStore.totalCount)
const currentPage = computed(() => interactionStore.currentPage)
const hasNextPage = computed(() => interactionStore.hasNextPage)
const hasPreviousPage = computed(() => interactionStore.hasPreviousPage)
const overdueFollowUps = computed(() => interactionStore.overdueFollowUps)

const hasActiveFilters = computed(() => {
  return !!(
    searchQuery.value ||
    filters.type ||
    filters.status ||
    filters.followUp ||
    filters.organization
  )
})

// Quick actions for common interactions
const quickActions: QuickInteractionAction[] = [
  {
    id: 'quick-call',
    name: 'Log Phone Call',
    type: 'PHONE_CALL',
    icon: 'phone',
    template: {
      interactionType: 'PHONE_CALL',
      status: 'COMPLETED',
      duration: 15,
      followUpRequired: true
    },
    requiresDetails: false
  },
  {
    id: 'quick-email',
    name: 'Log Email',
    type: 'EMAIL',
    icon: 'envelope',
    template: {
      interactionType: 'EMAIL',
      status: 'COMPLETED',
      followUpRequired: false
    },
    requiresDetails: false
  },
  {
    id: 'schedule-demo',
    name: 'Schedule Demo',
    type: 'PRODUCT_DEMO',
    icon: 'presentation-chart-line',
    template: {
      interactionType: 'PRODUCT_DEMO',
      status: 'PLANNED',
      duration: 60,
      followUpRequired: true
    },
    requiresDetails: true
  },
  {
    id: 'schedule-meeting',
    name: 'Schedule Meeting',
    type: 'IN_PERSON_MEETING',
    icon: 'users',
    template: {
      interactionType: 'IN_PERSON_MEETING',
      status: 'PLANNED',
      duration: 90,
      followUpRequired: true
    },
    requiresDetails: true
  }
]

// ===============================
// METHODS
// ===============================

/**
 * Get icon component for quick actions
 */
const getIconComponent = (iconName: string) => {
  const icons: Record<string, any> = {
    'phone': PhoneIcon,
    'envelope': EnvelopeIcon,
    'presentation-chart-line': PresentationChartLineIcon,
    'users': UsersIcon
  }
  return icons[iconName] || PhoneIcon
}

/**
 * Refresh all data
 */
const refreshData = async () => {
  const currentFilters = buildFilters()
  const currentPagination = buildPagination()
  
  await Promise.all([
    interactionStore.fetchInteractions(currentFilters, currentPagination),
    interactionStore.fetchKPIs(),
    interactionStore.fetchFollowUpTracking()
  ])
}

/**
 * Build filters object from component state
 */
const buildFilters = (): InteractionFilters => {
  const filterObj: InteractionFilters = {}
  
  if (searchQuery.value) filterObj.search = searchQuery.value
  if (filters.type) filterObj.type = [filters.type as any]
  if (filters.status) filterObj.status = [filters.status as any]
  if (filters.organization) filterObj.organization_id = filters.organization
  
  // Handle follow-up filters
  if (filters.followUp === 'required') filterObj.follow_up_required = true
  if (filters.followUp === 'overdue') filterObj.follow_up_overdue = true
  
  return filterObj
}

/**
 * Build pagination object from component state
 */
const buildPagination = (): InteractionPagination => {
  return {
    page: currentPage.value,
    limit: 20,
    sort_by: sortBy.value,
    sort_order: sortOrder.value
  }
}

/**
 * Apply current filters
 */
const applyFilters = async () => {
  const currentFilters = buildFilters()
  const currentPagination = { ...buildPagination(), page: 1 } // Reset to first page
  
  await interactionStore.fetchInteractions(currentFilters, currentPagination)
}

/**
 * Handle search input with debouncing
 */
let searchTimeout: ReturnType<typeof setTimeout>
const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    applyFilters()
  }, 300)
}

/**
 * Clear all filters
 */
const clearFilters = () => {
  searchQuery.value = ''
  filters.type = ''
  filters.status = ''
  filters.followUp = ''
  filters.organization = ''
  sortBy.value = 'interaction_date'
  sortOrder.value = 'desc'
  
  interactionStore.resetFilters()
  refreshData()
}

/**
 * Handle sort changes
 */
const handleSort = () => {
  applyFilters()
}

/**
 * Toggle sort order
 */
const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  applyFilters()
}

/**
 * Filter by overdue follow-ups
 */
const filterByOverdueFollowUps = () => {
  clearFilters()
  filters.followUp = 'overdue'
  applyFilters()
}

/**
 * Handle KPI card clicks
 */
const handleKPICardClick = (kpiType: string) => {
  clearFilters()
  
  switch (kpiType) {
    case 'pending_follow_ups':
      filters.followUp = 'required'
      break
    case 'overdue_follow_ups':
      filters.followUp = 'overdue'
      break
    case 'this_week':
      // Would need date range filter
      break
  }
  
  applyFilters()
}

/**
 * Handle quick action selection
 */
const handleQuickAction = (action: QuickInteractionAction) => {
  showQuickActions.value = false
  
  if (action.requiresDetails) {
    // Navigate to full form with template pre-selected
    router.push({
      path: '/interactions/new',
      query: { template: action.id }
    })
  } else {
    // Navigate to quick form
    router.push({
      path: '/interactions/new',
      query: { 
        quick: 'true',
        type: action.type,
        status: action.template.status,
        duration: action.template.duration?.toString()
      }
    })
  }
}

/**
 * Handle interaction selection
 */
const handleInteractionSelected = (interaction: InteractionListView) => {
  router.push(`/interactions/${interaction.id}`)
}

/**
 * Handle page changes
 */
const handlePageChanged = (page: number) => {
  const currentFilters = buildFilters()
  const currentPagination = { ...buildPagination(), page }
  
  interactionStore.fetchInteractions(currentFilters, currentPagination)
}

/**
 * Handle sort changes from table
 */
const handleSortChanged = (column: string, order: 'asc' | 'desc') => {
  sortBy.value = column
  sortOrder.value = order
  applyFilters()
}

// ===============================
// LIFECYCLE
// ===============================

onMounted(() => {
  refreshData()
})

// Close quick actions dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (quickActionDropdown.value && !quickActionDropdown.value.contains(event.target as Node)) {
    showQuickActions.value = false
  }
}

watch(showQuickActions, (isOpen) => {
  if (isOpen) {
    document.addEventListener('click', handleClickOutside)
  } else {
    document.removeEventListener('click', handleClickOutside)
  }
})
</script>

<style scoped>
.interactions-list-view {
  @apply min-h-screen;
}

/* Responsive table container */
@media (max-width: 768px) {
  .interactions-list-view {
    @apply px-4;
  }
}

/* Loading animation */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>