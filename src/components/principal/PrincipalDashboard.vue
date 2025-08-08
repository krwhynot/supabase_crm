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
                Engagement trends and performance metrics for {{ selectedPrincipal.principal_name }}
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
                  :products="productPerformanceData"
                  :loading="isLoadingProducts"
                  :principal-name="selectedPrincipal?.principal_name"
                  @product-selected="handleProductSelected"
                  @create-opportunity="(_productId: string) => handleCreateOpportunity(selectedPrincipal)"
                  @export-data="handleExportData"
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
                  :relationships="distributorData"
                  :loading="isLoadingDistributors"
                  :principal-name="selectedPrincipal?.principal_name"
                  @export-data="handleExportData"
                  @distributor-selected="handleDistributorSelected"
                  @contact-distributor="handleContactDistributor"
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
import { usePrincipalStore, type Principal } from '@/stores/principalStore'
import { usePrincipalActivityStore } from '@/stores/principalActivityStore'
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

// Transform Principal to PrincipalActivitySummary
const transformPrincipalToSummary = (principal: Principal): PrincipalActivitySummary => {
  return {
    principal_id: principal.id,
    principal_name: principal.name,
    principal_status: null,
    organization_type: principal.organization_type as any,
    industry: null,
    organization_size: null,
    is_active: principal.is_active,
    lead_score: null,
    contact_count: principal.contact_count,
    active_contacts: 0,
    primary_contact_name: null,
    primary_contact_email: null,
    last_contact_update: null,
    total_interactions: 0,
    interactions_last_30_days: 0,
    interactions_last_90_days: 0,
    last_interaction_date: null,
    last_interaction_type: null,
    next_follow_up_date: null,
    avg_interaction_rating: 0,
    positive_interactions: 0,
    follow_ups_required: 0,
    total_opportunities: principal.opportunity_count,
    active_opportunities: 0,
    won_opportunities: 0,
    opportunities_last_30_days: 0,
    latest_opportunity_stage: null,
    latest_opportunity_date: null,
    avg_probability_percent: 0,
    highest_value_opportunity: null,
    product_count: principal.product_count,
    active_product_count: 0,
    product_categories: null,
    primary_product_category: null,
    is_principal: true,
    is_distributor: false,
    last_activity_date: null,
    activity_status: 'NO_ACTIVITY' as any,
    engagement_score: 0,
    principal_created_at: principal.created_at,
    principal_updated_at: principal.updated_at,
    summary_generated_at: new Date().toISOString()
  }
}

const selectedPrincipal = computed((): PrincipalActivitySummary | null => {
  if (!selectedPrincipalId.value) return null
  const principal = principalStore.getPrincipalById(selectedPrincipalId.value)
  return principal ? transformPrincipalToSummary(principal) : null
})

// Removed unused computed property isLoadingAnySection

// ===============================
// EVENT HANDLERS
// ===============================

const handlePrincipalChange = async (principal: PrincipalActivitySummary | null) => {
  if (principal) {
    selectedPrincipalId.value = principal.principal_id
    await loadPrincipalData(principal.principal_id)
  } else {
    selectedPrincipalId.value = ''
    clearPrincipalData()
  }
}

const handleRefresh = async () => {
  if (selectedPrincipalId.value) {
    await loadPrincipalData(selectedPrincipalId.value)
  }
  await loadDashboardData()
}

const handleCreateOpportunity = (principal?: PrincipalActivitySummary | null) => {
  // Navigate to opportunity creation with principal pre-selected
  // This would typically use vue-router
  const principalToUse = principal || selectedPrincipal.value
  console.log('Create opportunity for principal:', principalToUse?.principal_name)
}

const handleLogInteraction = () => {
  // Navigate to interaction logging with principal pre-selected
  console.log('Log interaction for principal:', selectedPrincipal.value?.principal_name)
}

const handleManageProducts = () => {
  // Open product management modal or navigate to management page
  console.log('Manage products for principal:', selectedPrincipal.value?.principal_name)
}

const handleOpportunityCreated = () => {
  // Refresh opportunities list
  if (selectedPrincipalId.value) {
    loadOpportunityData(selectedPrincipalId.value)
  }
}

// Additional event handlers for component interactions
const handleProductSelected = (_productId: string) => {
  // Product selection handling logic would go here
}

const handleExportData = () => {
  console.log('Export data')
}

const handleDistributorSelected = (distributorId: string) => {
  console.log('Distributor selected:', distributorId)
}

const handleContactDistributor = (distributorId: string) => {
  console.log('Contact distributor:', distributorId)
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
    
    // Access analytics data from the store's analytics property
    // Note: The store sets these as nested properties in the analytics object
    if (principalActivityStore.analytics) {
      engagementBreakdown.value = (principalActivityStore.analytics as any).engagement_breakdown || null
      principalStats.value = (principalActivityStore.analytics as any).principal_stats || null
    }
    activitySummary.value = principalActivityStore.principals
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
    await principalActivityStore.fetchPrincipalTimeline([principalId])
    timelineData.value = principalActivityStore.timelineEntries
  } catch (err) {
    console.error('Failed to load timeline data:', err)
  } finally {
    isLoadingTimeline.value = false
  }
}

const loadProductData = async (principalId: string) => {
  isLoadingProducts.value = true
  
  try {
    await principalActivityStore.fetchProductPerformance([principalId])
    productPerformanceData.value = principalActivityStore.productPerformance
  } catch (err) {
    console.error('Failed to load product data:', err)
  } finally {
    isLoadingProducts.value = false
  }
}

const loadDistributorData = async (_principalId: string) => {
  isLoadingDistributors.value = true
  
  try {
    await principalActivityStore.fetchDistributorRelationships()
    distributorData.value = principalActivityStore.distributorRelationships
  } catch (err) {
    console.error('Failed to load distributor data:', err)
  } finally {
    isLoadingDistributors.value = false
  }
}

const loadOpportunityData = async (_principalId: string) => {
  isLoadingOpportunities.value = true
  
  try {
    // This would typically call an opportunities API filtered by principal
    // For now, we'll simulate the loading
    await new Promise(resolve => setTimeout(resolve, 500))
  } finally {
    isLoadingOpportunities.value = false
  }
}

const loadInteractionData = async (_principalId: string) => {
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