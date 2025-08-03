<template>
  <div class="dashboard-view">
    <!-- Dashboard Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p class="text-gray-600 mt-1">Welcome to your CRM dashboard</p>
        </div>
        <div class="flex items-center space-x-3">
          <button
            @click="refreshDashboard"
            :disabled="isLoading"
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <svg class="w-4 h-4 mr-2" :class="{ 'animate-spin': isLoading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {{ isLoading ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Combined KPI Overview Section -->
    <div class="mb-8">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Performance Overview</h2>
      
      <!-- Opportunity KPIs -->
      <div class="mb-6">
        <h3 class="text-lg font-medium text-gray-800 mb-3">Sales Pipeline</h3>
        <OpportunityKPICards :loading="opportunityStore.isLoading" />
      </div>
      
      <!-- Interaction KPIs -->
      <div>
        <h3 class="text-lg font-medium text-gray-800 mb-3">Customer Engagement</h3>
        <InteractionKPICards :show-extended="false" />
      </div>
    </div>

    <!-- Quick Actions Enhanced -->
    <div class="mb-8">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <!-- New Opportunity -->
        <router-link
          to="/opportunities/new"
          class="quick-action-card group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-200"
        >
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors shadow-lg">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-semibold text-gray-900 group-hover:text-blue-700">New Opportunity</p>
              <p class="text-xs text-gray-600">Create sales opportunity</p>
            </div>
          </div>
        </router-link>

        <!-- New Interaction -->
        <router-link
          to="/interactions/new"
          class="quick-action-card group bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-green-200"
        >
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center group-hover:bg-green-600 transition-colors shadow-lg">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-semibold text-gray-900 group-hover:text-green-700">New Interaction</p>
              <p class="text-xs text-gray-600">Log customer interaction</p>
            </div>
          </div>
        </router-link>

        <!-- Add Contact -->
        <router-link
          to="/contacts/new"
          class="quick-action-card group bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-purple-200"
        >
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center group-hover:bg-purple-600 transition-colors shadow-lg">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-semibold text-gray-900 group-hover:text-purple-700">Add Contact</p>
              <p class="text-xs text-gray-600">Create new contact</p>
            </div>
          </div>
        </router-link>

        <!-- Follow-up Reminders -->
        <router-link
          to="/interactions?filter=follow_up_overdue"
          class="quick-action-card group bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 border-amber-200"
        >
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center group-hover:bg-amber-600 transition-colors shadow-lg">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-semibold text-gray-900 group-hover:text-amber-700">Follow-ups</p>
              <p class="text-xs text-gray-600">Review overdue items</p>
            </div>
          </div>
        </router-link>
      </div>
    </div>

    <!-- Recent Activity Section with Tabs -->
    <div class="mt-8">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
      
      <!-- Tab Navigation -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-8 px-6" aria-label="Recent activity tabs">
            <button
              @click="activeTab = 'opportunities'"
              :class="[
                activeTab === 'opportunities'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200'
              ]"
            >
              Recent Opportunities
            </button>
            <button
              @click="activeTab = 'interactions'"
              :class="[
                activeTab === 'interactions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200'
              ]"
            >
              Recent Interactions
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="p-6">
          <!-- Opportunities Tab -->
          <div v-if="activeTab === 'opportunities'" class="recent-opportunities">
            <div v-if="recentOpportunities.length === 0" class="text-center py-8">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No recent opportunities</h3>
              <p class="mt-1 text-sm text-gray-500">Create your first sales opportunity to get started.</p>
              <div class="mt-6">
                <router-link
                  to="/opportunities/new"
                  class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Opportunity
                </router-link>
              </div>
            </div>
            
            <div v-else class="space-y-3">
              <div
                v-for="opportunity in recentOpportunities"
                :key="opportunity.id"
                class="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors duration-200"
                @click="navigateToOpportunity(opportunity.id)"
              >
                <div class="flex-shrink-0">
                  <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <div class="ml-4 flex-1">
                  <p class="text-sm font-medium text-gray-900">{{ opportunity.name }}</p>
                  <p class="text-sm text-gray-500">{{ opportunity.organization }} • {{ formatOpportunityStage(opportunity.stage) }}</p>
                  <p class="text-xs text-gray-400 mt-1">{{ formatRelativeDate(opportunity.created_at) }}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-medium text-gray-900">{{ opportunity.probability_percent }}%</p>
                  <p class="text-xs text-gray-500">probability</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Interactions Tab -->
          <div v-if="activeTab === 'interactions'">
            <RecentInteractionsCard :limit="5" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboardStore } from '@/stores/dashboardStore'
import { useOpportunityStore } from '@/stores/opportunityStore'
import { useInteractionStore } from '@/stores/interactionStore'
import OpportunityKPICards from '@/components/opportunities/OpportunityKPICards.vue'
import InteractionKPICards from '@/components/interactions/InteractionKPICards.vue'
import RecentInteractionsCard from '@/components/interactions/RecentInteractionsCard.vue'
import type { OpportunityListView } from '@/types/opportunities'

// Composables
const router = useRouter()

// Store access
const dashboardStore = useDashboardStore()
const opportunityStore = useOpportunityStore()
const interactionStore = useInteractionStore()

// Local reactive state
const activeTab = ref<'opportunities' | 'interactions'>('opportunities')

// Computed properties
const isLoading = computed(() => 
  dashboardStore.loading || 
  dashboardStore.refreshing ||
  opportunityStore.isLoading ||
  interactionStore.isLoading
)

const recentOpportunities = computed((): OpportunityListView[] => {
  const opportunities = opportunityStore.opportunities
  return opportunities.slice(0, 5) // Show latest 5 opportunities
})

// Methods
const refreshDashboard = async () => {
  try {
    await Promise.all([
      dashboardStore.refreshDashboard(),
      opportunityStore.fetchKPIs(),
      opportunityStore.fetchOpportunities({
        search: '',
        stages: [],
        organizations: [],
        products: [],
        probability_min: 0,
        probability_max: 100,
        date_from: '',
        date_to: '',
        context: '',
        principal_id: ''
      }, {
        page: 1,
        limit: 5,
        sort_by: 'created_at',
        sort_order: 'desc'
      }),
      interactionStore.fetchKPIs()
    ])
  } catch (error) {
    console.error('Failed to refresh dashboard:', error)
  }
}

const navigateToOpportunity = (opportunityId: string) => {
  router.push(`/opportunities/${opportunityId}`)
}

const formatOpportunityStage = (stage: string): string => {
  return stage.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
}

const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }
}

// Initialize dashboard
onMounted(async () => {
  // Initialize stores first
  dashboardStore.initializeDashboard()
  
  // Then refresh all data
  await refreshDashboard()
})
</script>

<style scoped>
/* Quick Action Card Styles */
.quick-action-card {
  @apply relative p-6 rounded-xl shadow-sm border-2 transition-all duration-200;
  @apply hover:shadow-md hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
  min-height: 100px;
}

.quick-action-card:active {
  @apply transform scale-[0.98];
}

/* Mobile Responsiveness */
@media (max-width: 640px) {
  .quick-action-card {
    @apply p-4;
    min-height: 80px;
  }
  
  .quick-action-card .w-12 {
    @apply w-10;
  }
  
  .quick-action-card .h-12 {
    @apply h-10;
  }
  
  .quick-action-card .w-6 {
    @apply w-5;
  }
  
  .quick-action-card .h-6 {
    @apply h-5;
  }
}

/* Tab Styles */
.tab-button {
  @apply relative py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200;
}

.tab-button.active {
  @apply border-blue-500 text-blue-600;
}

.tab-button:not(.active) {
  @apply border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300;
}

/* Recent Activity Items */
.recent-opportunities .space-y-3 > div {
  @apply transition-all duration-200;
}

.recent-opportunities .space-y-3 > div:hover {
  @apply transform scale-[1.01] shadow-sm;
}

/* Performance Overview Section */
.performance-overview {
  @apply space-y-6;
}

.kpi-section {
  @apply space-y-3;
}

.kpi-section h3 {
  @apply text-lg font-medium text-gray-800;
}

/* Loading States */
.dashboard-view .animate-pulse {
  @apply bg-gray-200 rounded;
}

/* High Contrast Mode Support */
@media (prefers-contrast: high) {
  .quick-action-card {
    @apply border-4;
  }
  
  .tab-button.active {
    @apply border-b-4;
  }
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  .quick-action-card,
  .tab-button,
  .recent-opportunities .space-y-3 > div {
    transition: none;
  }
  
  .quick-action-card:hover {
    @apply scale-100;
  }
  
  .recent-opportunities .space-y-3 > div:hover {
    @apply scale-100;
  }
}

/* Print Styles */
@media print {
  .quick-action-card {
    @apply shadow-none border border-gray-300;
  }
  
  .tab-button {
    @apply border-b border-gray-300;
  }
}
</style>