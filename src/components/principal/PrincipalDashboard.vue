<!--
  Principal Dashboard - Main orchestration component for Principal Activity Tracking
  Features: Real-time analytics, responsive design, comprehensive CRM integration
-->
<template>
  <div class="principal-dashboard bg-gray-50 min-h-screen" role="main" aria-label="Principal Activity Dashboard">
    <!-- Dashboard Header -->
    <div class="bg-white shadow-sm border-b border-gray-200">
      <div class="px-4 sm:px-6 lg:px-8">
        <div class="py-6">
          <div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Principal Activity Dashboard</h1>
              <p class="mt-1 text-sm text-gray-500">
                Comprehensive relationship insights and performance analytics
              </p>
            </div>
            
            <!-- Action Bar -->
            <PrincipalActionBar 
              :selected-principal="selectedPrincipal"
              @refresh="handleRefresh"
              @create-opportunity="handleCreateOpportunity"
              @log-interaction="handleLogInteraction"
              @manage-products="handleManageProducts"
            />
          </div>
          
          <!-- Principal Selector -->
          <div class="mt-6">
            <PrincipalSelector
              v-model="selectedPrincipalId"
              :loading="isLoadingSelector"
              :error="selectorError"
              @change="handlePrincipalChange"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="flex items-center space-x-3">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span class="text-gray-600">Loading principal analytics...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex">
          <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Error Loading Data</h3>
            <p class="mt-1 text-sm text-red-700">{{ error }}</p>
            <button
              @click="handleRefresh"
              class="mt-2 bg-red-100 px-3 py-1 rounded text-sm text-red-800 hover:bg-red-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Dashboard Content -->
    <div v-else class="px-4 sm:px-6 lg:px-8 py-8">
      <!-- KPI Cards Section -->
      <section class="mb-8">
        <PrincipalKPICards 
          :activity-summary="activitySummary"
          :engagement-breakdown="engagementBreakdown"
          :stats="principalStats"
          :loading="isLoadingKPIs"
        />
      </section>

      <!-- Principal-Specific Content -->
      <div v-if="selectedPrincipal" class="space-y-8">
        <!-- Analytics Section -->
        <section>
          <div class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-900">Performance Analytics</h2>
              <p class="text-sm text-gray-600 mt-1">
                Engagement trends and performance metrics for {{ selectedPrincipal.name }}
              </p>
            </div>
            <div class="p-6">
              <PrincipalAnalyticsChart
                :principal-id="selectedPrincipalId"
                :activity-data="timelineData"
                :product-performance="productPerformanceData"
                :loading="isLoadingAnalytics"
              />
            </div>
          </div>
        </section>

        <!-- Timeline and Activity Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Activity Timeline -->
          <section>
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
              <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">Activity Timeline</h3>
                <p class="text-sm text-gray-600 mt-1">Recent interactions and milestones</p>
              </div>
              <div class="p-6">
                <PrincipalActivityTimeline
                  :principal-id="selectedPrincipalId"
                  :timeline-data="timelineData"
                  :loading="isLoadingTimeline"
                />
              </div>
            </div>
          </section>

          <!-- Opportunities -->
          <section>
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
              <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-medium text-gray-900">Active Opportunities</h3>
                  <p class="text-sm text-gray-600 mt-1">Current sales pipeline</p>
                </div>
                <CreatePrincipalOpportunityButton
                  :principal="selectedPrincipal"
                  @created="handleOpportunityCreated"
                />
              </div>
              <div class="p-6">
                <PrincipalOpportunityList
                  :principal-id="selectedPrincipalId"
                  :loading="isLoadingOpportunities"
                />
              </div>
            </div>
          </section>
        </div>

        <!-- Data Tables Section -->
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <!-- Product Performance -->
          <section>
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-medium text-gray-900">Product Performance</h3>
                  <p class="text-sm text-gray-600 mt-1">Product associations and success rates</p>
                </div>
                <ManagePrincipalProductsButton
                  :principal="selectedPrincipal"
                  @updated="handleProductsUpdated"
                />
              </div>
              <div class="p-6">
                <PrincipalProductTable
                  :principal-id="selectedPrincipalId"
                  :product-data="productPerformanceData"
                  :loading="isLoadingProducts"
                />
              </div>
            </div>
          </section>

          <!-- Distributor Relationships -->
          <section>
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">Distributor Network</h3>
                <p class="text-sm text-gray-600 mt-1">Relationship hierarchy and connections</p>
              </div>
              <div class="p-6">
                <DistributorRelationshipTable
                  :principal-id="selectedPrincipalId"
                  :relationship-data="distributorData"
                  :loading="isLoadingDistributors"
                />
              </div>
            </div>
          </section>
        </div>

        <!-- Interactions Section -->
        <section>
          <div class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 class="text-lg font-medium text-gray-900">Recent Interactions</h3>
                <p class="text-sm text-gray-600 mt-1">Communication history and ratings</p>
              </div>
              <LogPrincipalInteractionButton
                :principal="selectedPrincipal"
                @logged="handleInteractionLogged"
              />
            </div>
            <div class="p-6">
              <PrincipalInteractionList
                :principal-id="selectedPrincipalId"
                :loading="isLoadingInteractions"
              />
            </div>
          </div>
        </section>
      </div>

      <!-- No Principal Selected State -->
      <div v-else class="text-center py-12">
        <UserGroupIcon class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-4 text-lg font-medium text-gray-900">Select a Principal</h3>
        <p class="mt-2 text-gray-600">
          Choose a principal from the dropdown above to view their activity dashboard and analytics.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ExclamationTriangleIcon, UserGroupIcon } from '@heroicons/vue/24/outline'
import { usePrincipalStore } from '@/stores/principalStore'
import { usePrincipalActivityStore } from '@/stores/principalActivityStore'
import { principalActivityApi } from '@/services/principalActivityApi'
import type {
  PrincipalActivitySummary,
  PrincipalDistributorRelationship,
  PrincipalProductPerformance,
  PrincipalTimelineEntry
} from '@/types/principal'

// Component imports
import PrincipalSelector from './PrincipalSelector.vue'
import PrincipalKPICards from './PrincipalKPICards.vue'
import PrincipalActivityTimeline from './PrincipalActivityTimeline.vue'
import PrincipalAnalyticsChart from './PrincipalAnalyticsChart.vue'
import PrincipalProductTable from './PrincipalProductTable.vue'
import DistributorRelationshipTable from './DistributorRelationshipTable.vue'
import PrincipalOpportunityList from './PrincipalOpportunityList.vue'
import PrincipalInteractionList from './PrincipalInteractionList.vue'
import PrincipalActionBar from './PrincipalActionBar.vue'
import CreatePrincipalOpportunityButton from './CreatePrincipalOpportunityButton.vue'
import LogPrincipalInteractionButton from './LogPrincipalInteractionButton.vue'
import ManagePrincipalProductsButton from './ManagePrincipalProductsButton.vue'

// ===============================
// COMPOSABLES & STORES
// ===============================

const principalStore = usePrincipalStore()
const principalActivityStore = usePrincipalActivityStore()

// ===============================
// REACTIVE STATE
// ===============================

const selectedPrincipalId = ref<string>('')
const isLoading = ref(false)
const error = ref<string | null>(null)

// Loading states for different sections
const isLoadingSelector = ref(false)
const isLoadingKPIs = ref(false)
const isLoadingAnalytics = ref(false)
const isLoadingTimeline = ref(false)
const isLoadingOpportunities = ref(false)
const isLoadingProducts = ref(false)
const isLoadingDistributors = ref(false)
const isLoadingInteractions = ref(false)

// Data states
const activitySummary = ref<PrincipalActivitySummary[]>([])
const timelineData = ref<PrincipalTimelineEntry[]>([])
const productPerformanceData = ref<PrincipalProductPerformance[]>([])
const distributorData = ref<PrincipalDistributorRelationship[]>([])
const engagementBreakdown = ref<any>(null)
const principalStats = ref<any>(null)

// Error states for individual sections
const selectorError = ref<string | null>(null)

// ===============================
// COMPUTED PROPERTIES
// ===============================

const hasError = computed(() => !!error.value || principalActivityStore.hasError)

const selectedPrincipal = computed(() => {
  if (!selectedPrincipalId.value) return null
  return principalStore.getPrincipalById(selectedPrincipalId.value)
})

const isLoadingAnySection = computed(() => {
  return isLoadingSelector.value ||
         isLoadingKPIs.value ||
         isLoadingAnalytics.value ||
         isLoadingTimeline.value ||
         isLoadingOpportunities.value ||
         isLoadingProducts.value ||
         isLoadingDistributors.value ||
         isLoadingInteractions.value
})

// ===============================
// EVENT HANDLERS
// ===============================

const handlePrincipalChange = async (principalId: string) => {
  selectedPrincipalId.value = principalId
  
  if (principalId) {
    await loadPrincipalData(principalId)
  } else {
    clearPrincipalData()
  }
}

const handleRefresh = async () => {
  if (selectedPrincipalId.value) {
    await loadPrincipalData(selectedPrincipalId.value)
  }
  await loadDashboardData()
}

const handleCreateOpportunity = () => {
  // Navigate to opportunity creation with principal pre-selected
  // This would typically use vue-router
  console.log('Create opportunity for principal:', selectedPrincipal.value?.name)
}

const handleLogInteraction = () => {
  // Navigate to interaction logging with principal pre-selected
  console.log('Log interaction for principal:', selectedPrincipal.value?.name)
}

const handleManageProducts = () => {
  // Open product management modal or navigate to management page
  console.log('Manage products for principal:', selectedPrincipal.value?.name)
}

const handleOpportunityCreated = () => {
  // Refresh opportunities list
  if (selectedPrincipalId.value) {
    loadOpportunityData(selectedPrincipalId.value)
  }
}

const handleInteractionLogged = () => {
  // Refresh timeline and interactions
  if (selectedPrincipalId.value) {
    loadTimelineData(selectedPrincipalId.value)
    loadInteractionData(selectedPrincipalId.value)
  }
}

const handleProductsUpdated = () => {
  // Refresh product performance data
  if (selectedPrincipalId.value) {
    loadProductData(selectedPrincipalId.value)
  }
}

// ===============================
// DATA LOADING FUNCTIONS
// ===============================

const loadDashboardData = async () => {
  isLoadingKPIs.value = true
  error.value = null

  try {
    // Load data using the store which handles API calls
    await principalActivityStore.loadEngagementBreakdown()
    await principalActivityStore.loadPrincipalStats()
    await principalActivityStore.loadActivitySummaries()
    
    engagementBreakdown.value = principalActivityStore.engagementBreakdown
    principalStats.value = principalActivityStore.principalStats
    activitySummary.value = principalActivityStore.activitySummaries
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load dashboard data'
  } finally {
    isLoadingKPIs.value = false
  }
}

const loadPrincipalData = async (principalId: string) => {
  isLoading.value = true
  error.value = null

  try {
    // Load all principal-specific data in parallel
    await Promise.all([
      loadTimelineData(principalId),
      loadProductData(principalId),
      loadDistributorData(principalId),
      loadOpportunityData(principalId),
      loadInteractionData(principalId)
    ])
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load principal data'
  } finally {
    isLoading.value = false
  }
}

const loadTimelineData = async (principalId: string) => {
  isLoadingTimeline.value = true
  
  try {
    await principalActivityStore.fetchPrincipalTimeline(principalId)
    timelineData.value = principalActivityStore.selectedPrincipalTimeline
  } catch (err) {
    console.error('Failed to load timeline data:', err)
  } finally {
    isLoadingTimeline.value = false
  }
}

const loadProductData = async (principalId: string) => {
  isLoadingProducts.value = true
  
  try {
    await principalActivityStore.fetchProductPerformance(principalId)
    productPerformanceData.value = principalActivityStore.productPerformances
  } catch (err) {
    console.error('Failed to load product data:', err)
  } finally {
    isLoadingProducts.value = false
  }
}

const loadDistributorData = async (principalId: string) => {
  isLoadingDistributors.value = true
  
  try {
    await principalActivityStore.fetchDistributorRelationships([principalId])
    distributorData.value = principalActivityStore.distributorRelationships
  } catch (err) {
    console.error('Failed to load distributor data:', err)
  } finally {
    isLoadingDistributors.value = false
  }
}

const loadOpportunityData = async (principalId: string) => {
  isLoadingOpportunities.value = true
  
  try {
    // This would typically call an opportunities API filtered by principal
    // For now, we'll simulate the loading
    await new Promise(resolve => setTimeout(resolve, 500))
  } finally {
    isLoadingOpportunities.value = false
  }
}

const loadInteractionData = async (principalId: string) => {
  isLoadingInteractions.value = true
  
  try {
    // This would typically call an interactions API filtered by principal
    // For now, we'll simulate the loading
    await new Promise(resolve => setTimeout(resolve, 500))
  } finally {
    isLoadingInteractions.value = false
  }
}

const clearPrincipalData = () => {
  timelineData.value = []
  productPerformanceData.value = []
  distributorData.value = []
}

// ===============================
// LIFECYCLE HOOKS
// ===============================

onMounted(async () => {
  // Load initial dashboard data
  await loadDashboardData()
  
  // Load principals for selector
  await principalStore.fetchPrincipalOptions()
})

// Watch for principal store errors
watch(
  [() => principalStore.error, () => principalActivityStore.error],
  ([principalError, activityError]) => {
    if (principalError) {
      error.value = principalError
    } else if (activityError) {
      error.value = activityError
    }
  }
)
</script>

<style scoped>
.principal-dashboard {
  /* Custom scrollbar for better UX */
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.principal-dashboard::-webkit-scrollbar {
  width: 6px;
}

.principal-dashboard::-webkit-scrollbar-track {
  background: transparent;
}

.principal-dashboard::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.principal-dashboard::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.7);
}

/* Animation for section loading */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.principal-dashboard section {
  animation: fadeIn 0.3s ease-out;
}
</style>