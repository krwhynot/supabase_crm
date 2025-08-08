<!--
  PrincipalDetailView - Individual principal dashboard optimized for iPad viewport
  
  Features:
  - Comprehensive single principal view with no horizontal scrolling
  - Activity timeline with chronological insights
  - KPI cards specific to selected principal
  - Quick action buttons for opportunities/interactions
  - Product association management
  - Touch-friendly interface with 44px minimum touch targets
  
  Viewport Optimization:
  - Stacked layout prevents overflow on 768px width
  - Progressive disclosure for complex information
  - Touch targets optimized for iPad interaction
  - Responsive grid system for varying content
-->
<template>
  <div class="principal-detail-view max-w-full" data-testid="principal-detail-view">
    <!-- Loading State -->
    <div v-if="isLoading && !principal" class="flex items-center justify-center py-12">
      <div class="flex flex-col items-center space-y-4">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="text-gray-600">Loading principal details...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-white rounded-lg shadow-sm border border-red-200 p-6 mb-6">
      <div class="flex items-start space-x-3">
        <svg class="h-5 w-5 text-red-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div class="flex-1">
          <h3 class="text-sm font-medium text-red-800">Error loading principal</h3>
          <p class="mt-1 text-sm text-red-700">{{ error }}</p>
          <div class="mt-4">
            <button
              @click="handleRefresh"
              class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 min-h-[44px]"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else-if="principal" class="space-y-6">
      <!-- Header Section -->
      <section class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex flex-col space-y-4 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
          <!-- Principal Info -->
          <div class="flex items-start space-x-4">
            <div class="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span class="text-xl font-semibold text-blue-600">
                {{ getInitials(principal.principal_name) }}
              </span>
            </div>
            
            <div class="flex-1 min-w-0">
              <h1 class="text-2xl font-bold text-gray-900 mb-1">
                {{ principal.principal_name }}
              </h1>
              <p class="text-lg text-gray-600 mb-2">
                {{ principal.organization_type }}
              </p>
              <div class="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
                <ActivityStatusBadge 
                  :status="(principal.activity_status === 'STALE' ? 'LOW' : principal.activity_status) as 'NO_ACTIVITY' | 'MODERATE' | 'ACTIVE' | 'LOW'"
                  size="md"
                />
                <div v-if="principal.organization_type" class="text-sm text-gray-500 uppercase tracking-wide">
                  {{ principal.organization_type }}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <PrincipalActionBar 
            :selected-principal="principal"
            @refresh="handleRefresh"
            @create-opportunity="handleCreateOpportunity"
            @log-interaction="handleLogInteraction"
            @manage-products="handleManageProducts"
            class="flex-shrink-0"
          />
        </div>
      </section>

      <!-- KPI Cards Section -->
      <section>
        <div class="mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Performance Overview</h2>
          <p class="text-sm text-gray-600">Key metrics and engagement insights for this principal</p>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Engagement Score Card -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div class="mb-4">
              <EngagementScoreRing 
                :score="principal.engagement_score || 0" 
                size="xl"
                class="mx-auto"
              />
            </div>
            <h3 class="text-sm font-medium text-gray-900 mb-1">Engagement Score</h3>
            <p class="text-2xl font-bold text-gray-900">{{ principal.engagement_score || 0 }}%</p>
            <p class="text-sm text-gray-500">{{ getEngagementLevel(principal.engagement_score || 0) }}</p>
          </div>
          
          <!-- Total Interactions Card -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div class="mb-4">
              <div class="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
            <h3 class="text-sm font-medium text-gray-900 mb-1">Total Interactions</h3>
            <p class="text-2xl font-bold text-gray-900">{{ principal.total_interactions || 0 }}</p>
            <p class="text-sm text-gray-500">All time</p>
          </div>
          
          <!-- Active Opportunities Card -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div class="mb-4">
              <div class="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto">
                <svg class="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <h3 class="text-sm font-medium text-gray-900 mb-1">Active Opportunities</h3>
            <p class="text-2xl font-bold text-gray-900">{{ principal.active_opportunities || 0 }}</p>
            <p class="text-sm text-gray-500">In pipeline</p>
          </div>
          
          <!-- Products Associated Card -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div class="mb-4">
              <div class="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto">
                <svg class="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <h3 class="text-sm font-medium text-gray-900 mb-1">Products Associated</h3>
            <p class="text-2xl font-bold text-gray-900">{{ principal.product_count || 0 }}</p>
            <p class="text-sm text-gray-500">Portfolio</p>
          </div>
        </div>
      </section>

      <!-- Follow-up Alert -->
      <section v-if="principal.follow_ups_required && principal.follow_ups_required > 0">
        <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div class="flex items-start space-x-3">
            <svg class="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="flex-1">
              <h3 class="text-sm font-medium text-amber-800">
                {{ principal.follow_ups_required }} Follow-up{{ principal.follow_ups_required > 1 ? 's' : '' }} Required
              </h3>
              <p v-if="principal.next_follow_up_date" class="mt-1 text-sm text-amber-700">
                Next follow-up scheduled for {{ formatDate(principal.next_follow_up_date) }}
              </p>
            </div>
            <div class="flex-shrink-0">
              <button
                @click="handleLogInteraction"
                class="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-amber-800 bg-amber-100 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 min-h-[36px]"
              >
                Log Follow-up
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <!-- Activity Timeline -->
        <section class="xl:col-span-1">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Activity Timeline</h3>
              <p class="text-sm text-gray-600 mt-1">Recent interactions and milestones</p>
            </div>
            <div class="p-6">
              <PrincipalActivityTimeline
                :principal-id="principalId"
                :timeline-data="timelineData"
                :loading="isLoadingTimeline"
                :max-items="10"
              />
              
              <div v-if="timelineData.length > 10" class="mt-4 text-center">
                <button
                  @click="handleViewFullTimeline"
                  class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[44px]"
                >
                  View Complete Timeline
                  <svg class="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Product Performance -->
        <section class="xl:col-span-1">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 class="text-lg font-medium text-gray-900">Product Performance</h3>
                <p class="text-sm text-gray-600 mt-1">Associated products and success rates</p>
              </div>
              <ManagePrincipalProductsButton
                :principal="principal"
                @updated="handleProductsUpdated"
              />
            </div>
            <div class="p-6">
              <PrincipalProductTable
                :products="productPerformanceData"
                :loading="isLoadingProducts"
                :principal-name="principal?.principal_name"
              />
            </div>
          </div>
        </section>
      </div>

      <!-- Additional Information Sections -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <!-- Distributor Relationships -->
        <section class="xl:col-span-1">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Distributor Network</h3>
              <p class="text-sm text-gray-600 mt-1">Relationship hierarchy and connections</p>
            </div>
            <div class="p-6">
              <DistributorRelationshipTable
                :relationships="distributorData"
                :loading="isLoadingDistributors"
                :principal-name="principal?.principal_name"
              />
            </div>
          </div>
        </section>

        <!-- Recent Opportunities -->
        <section class="xl:col-span-1">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 class="text-lg font-medium text-gray-900">Recent Opportunities</h3>
                <p class="text-sm text-gray-600 mt-1">Current sales pipeline</p>
              </div>
              <CreatePrincipalOpportunityButton
                :principal="principal"
                @created="handleOpportunityCreated"
              />
            </div>
            <div class="p-6">
              <RecentOpportunitiesList
                :principal-id="principalId"
                :loading="isLoadingOpportunities"
                :max-items="5"
              />
            </div>
          </div>
        </section>
      </div>

      <!-- Analytics Chart Section -->
      <section>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 class="text-lg font-medium text-gray-900">Performance Analytics</h3>
              <p class="text-sm text-gray-600 mt-1">Engagement trends and performance metrics</p>
            </div>
            <div class="flex items-center space-x-2">
              <select
                v-model="analyticsTimeframe"
                @change="handleTimeframeChange"
                class="block w-auto px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
              >
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="180">Last 6 Months</option>
                <option value="365">Last Year</option>
              </select>
            </div>
          </div>
          <div class="p-6">
            <PrincipalAnalyticsChart
              :principal-id="principalId"
              :activity-data="timelineData"
              :product-performance="productPerformanceData"
              :timeframe="analyticsTimeframe"
              :loading="isLoadingAnalytics"
            />
          </div>
        </div>
      </section>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Principal not found</h3>
      <p class="text-gray-500 mb-6">
        The principal you're looking for could not be found or may have been removed.
      </p>
      <router-link
        to="/principals"
        class="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[44px]"
      >
        <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Principals
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PrincipalActivityApi from '@/services/principalActivityApi'
import type {
  PrincipalActivitySummary,
  PrincipalProductPerformance
} from '@/services/principalActivityApi'

// Component imports
import ActivityStatusBadge from '@/components/principal/ActivityStatusBadge.vue'
import EngagementScoreRing from '@/components/principal/EngagementScoreRing.vue'
import PrincipalActionBar from '@/components/principal/PrincipalActionBar.vue'
import PrincipalActivityTimeline from '@/components/principal/PrincipalActivityTimeline.vue'
import PrincipalAnalyticsChart from '@/components/principal/PrincipalAnalyticsChart.vue'
import PrincipalProductTable from '@/components/principal/PrincipalProductTable.vue'
import DistributorRelationshipTable from '@/components/principal/DistributorRelationshipTable.vue'
import CreatePrincipalOpportunityButton from '@/components/principal/CreatePrincipalOpportunityButton.vue'
import ManagePrincipalProductsButton from '@/components/principal/ManagePrincipalProductsButton.vue'
import RecentOpportunitiesList from '@/components/principal/RecentOpportunitiesList.vue'

// ===============================
// COMPOSABLES
// ===============================

const route = useRoute()
const router = useRouter()

// ===============================
// REACTIVE STATE
// ===============================

const principalId = computed(() => route.params.id as string)
const analyticsTimeframe = ref(30)

// Loading states
const isLoading = ref(false)
const isLoadingTimeline = ref(false)
const isLoadingProducts = ref(false)
const isLoadingDistributors = ref(false)
const isLoadingOpportunities = ref(false)
const isLoadingAnalytics = ref(false)

// Error handling
const error = ref<string | null>(null)

// Data states
const principal = ref<PrincipalActivitySummary | null>(null)
const timelineData = ref<any[]>([]) // TODO: Add proper timeline type
const productPerformanceData = ref<PrincipalProductPerformance[]>([])
const distributorData = ref<any[]>([]) // TODO: Add proper distributor relationship type

// ===============================
// COMPUTED PROPERTIES
// ===============================

const getInitials = (name: string): string => {
  if (!name) return '?'
  
  const words = name.split(' ')
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase()
  }
  
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
}

const getEngagementLevel = (score: number): string => {
  if (score >= 80) return 'High Engagement'
  if (score >= 40) return 'Moderate Engagement'
  if (score > 0) return 'Low Engagement'
  return 'No Activity'
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

// ===============================
// EVENT HANDLERS
// ===============================

const handleRefresh = async () => {
  await Promise.all([
    loadPrincipalData(),
    loadTimelineData(),
    loadProductData(),
    loadDistributorData()
  ])
}

const handleCreateOpportunity = () => {
  router.push(`/opportunities/new?principal=${principalId.value}`)
}

const handleLogInteraction = () => {
  router.push(`/interactions/new?principal=${principalId.value}`)
}

const handleManageProducts = () => {
  // This would typically open a modal or navigate to a product management page
  console.log('Manage products for principal:', principal.value?.principal_name)
}

const handleOpportunityCreated = () => {
  // Refresh opportunities data
  loadOpportunityData()
}

const handleProductsUpdated = () => {
  // Refresh product performance data
  loadProductData()
}

const handleViewFullTimeline = () => {
  // Navigate to dedicated timeline view or expand current view
  router.push(`/principals/${principalId.value}/timeline`)
}

const handleTimeframeChange = () => {
  // Reload analytics data with new timeframe
  loadAnalyticsData()
}

// ===============================
// DATA LOADING FUNCTIONS
// ===============================

const loadPrincipalData = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    const response = await PrincipalActivityApi.getPrincipalActivitySummary({
      principalIds: [principalId.value]
    })
    
    if (response.success && response.data && response.data.length > 0) {
      principal.value = response.data[0]
    } else {
      principal.value = null
      error.value = 'Principal not found'
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load principal data'
  } finally {
    isLoading.value = false
  }
}

const loadTimelineData = async () => {
  isLoadingTimeline.value = true
  
  try {
    const response = await PrincipalActivityApi.getPrincipalTimeline([principalId.value], 50)
    if (response.success) {
      timelineData.value = response.data || []
    }
  } catch (err) {
    console.error('Failed to load timeline data:', err)
  } finally {
    isLoadingTimeline.value = false
  }
}

const loadProductData = async () => {
  isLoadingProducts.value = true
  
  try {
    const response = await PrincipalActivityApi.getPrincipalProductPerformance(principalId.value)
    if (response.success) {
      productPerformanceData.value = response.data || []
    }
  } catch (err) {
    console.error('Failed to load product data:', err)
  } finally {
    isLoadingProducts.value = false
  }
}

const loadDistributorData = async () => {
  isLoadingDistributors.value = true
  
  try {
    const response = await PrincipalActivityApi.getPrincipalDistributorRelationships([principalId.value])
    if (response.success) {
      distributorData.value = response.data || []
    }
  } catch (err) {
    console.error('Failed to load distributor data:', err)
  } finally {
    isLoadingDistributors.value = false
  }
}

const loadOpportunityData = async () => {
  isLoadingOpportunities.value = true
  
  try {
    // This would typically call an opportunities API filtered by principal
    // For now, we'll simulate the loading
    await new Promise(resolve => setTimeout(resolve, 500))
  } finally {
    isLoadingOpportunities.value = false
  }
}

const loadAnalyticsData = async () => {
  isLoadingAnalytics.value = true
  
  try {
    // Reload timeline data based on timeframe
    await loadTimelineData()
  } finally {
    isLoadingAnalytics.value = false
  }
}

// ===============================
// LIFECYCLE
// ===============================

onMounted(async () => {
  await handleRefresh()
})

// Watch for route parameter changes
watch(
  () => route.params.id,
  async (newId) => {
    if (newId && newId !== principalId.value) {
      await handleRefresh()
    }
  }
)
</script>

<style scoped>
.principal-detail-view {
  /* Ensure no horizontal overflow */
  overflow-x: hidden;
}

/* Loading states */
.loading-overlay {
  @apply absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center;
}

/* Touch targets */
button, select {
  min-height: 44px;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .principal-detail-view {
    @apply px-4;
  }
  
  .grid {
    @apply gap-4;
  }
}

@media (max-width: 768px) {
  .principal-detail-view {
    @apply px-2;
  }
  
  .grid {
    @apply gap-3;
  }
  
  /* Stack all grids on mobile */
  .xl\\:grid-cols-2 {
    @apply grid-cols-1;
  }
}

/* Animation for sections */
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

section {
  animation: fadeIn 0.3s ease-out;
}

/* Accessibility enhancements */
@media (prefers-reduced-motion: reduce) {
  .animate-spin,
  section {
    animation: none !important;
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
  
  .bg-blue-600 {
    @apply bg-gray-900;
  }
}

/* Print styles */
@media print {
  .principal-detail-view {
    @apply shadow-none;
  }
  
  button {
    @apply hidden;
  }
  
  .bg-blue-600,
  .bg-green-100,
  .bg-purple-100,
  .bg-orange-100 {
    @apply bg-gray-200 !important;
  }
  
  .text-blue-600,
  .text-green-600,
  .text-purple-600,
  .text-orange-600 {
    @apply text-gray-900 !important;
  }
}
</style>