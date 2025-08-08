<!--
  Principal Analytics View - Comprehensive analytics dashboard for individual principals
  Features: Multi-chart dashboard, time range filtering, export capabilities, iPad optimized
-->
<template>
  <DashboardLayout>
    <div class="principal-analytics-view">
      <!-- Page Header -->
      <div class="mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div class="mb-4 sm:mb-0">
            <h1 class="text-2xl font-bold text-gray-900">Principal Analytics</h1>
            <p class="mt-1 text-sm text-gray-500">
              Comprehensive performance insights and trends
            </p>
          </div>
          <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <!-- Export Button -->
            <button
              @click="exportAnalytics"
              :disabled="loading || !selectedPrincipal"
              class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              <ArrowDownTrayIcon class="h-4 w-4 mr-2" />
              Export
            </button>
            <!-- Time Range Selector -->
            <select
              v-model="selectedTimeRange"
              class="block w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Principal Selector -->
      <div class="mb-6">
        <PrincipalSelector
          v-model="selectedPrincipal"
          :loading="principalsLoading"
          :error="principalsError"
          placeholder="Select a principal to view analytics..."
          class="w-full"
        />
      </div>

      <!-- Loading State -->
      <div v-if="loading && selectedPrincipal" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-4 text-sm text-gray-500">Loading analytics data...</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!selectedPrincipal" class="text-center py-12">
        <ChartBarIcon class="mx-auto h-16 w-16 text-gray-400" />
        <h3 class="mt-4 text-lg font-medium text-gray-900">Principal Analytics</h3>
        <p class="mt-2 text-sm text-gray-500">
          Select a principal above to view comprehensive analytics and performance insights.
        </p>
      </div>

      <!-- Analytics Dashboard -->
      <div v-else-if="selectedPrincipal" class="space-y-6">
        <!-- Summary KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <ArrowTrendingUpIcon class="h-6 w-6 text-blue-500" />
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-500">Current Score</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ analyticsData?.currentEngagementScore || 0 }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <CalendarDaysIcon class="h-6 w-6 text-green-500" />
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-500">Total Activities</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ analyticsData?.totalActivities || 0 }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <CurrencyDollarIcon class="h-6 w-6 text-purple-500" />
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-500">Pipeline Value</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ formatCurrency(analyticsData?.totalPipelineValue || 0) }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <TrophyIcon class="h-6 w-6 text-yellow-500" />
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-500">Win Rate</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ Math.round(analyticsData?.winRate || 0) }}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Grid - Responsive Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Engagement Trend Chart -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <div class="h-64">
              <EngagementTrendChart
                :data="analyticsData?.engagementTrend || []"
                :time-range="selectedTimeRange"
                :principal-name="selectedPrincipal?.name"
                :show-trend-line="true"
              />
            </div>
          </div>

          <!-- Activity Volume Chart -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <div class="h-64">
              <ActivityVolumeChart
                :data="analyticsData?.activityVolume || []"
                :time-range="selectedTimeRange"
                :principal-name="selectedPrincipal?.name"
              />
            </div>
          </div>

          <!-- Product Performance Chart -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <div class="h-64">
              <ProductPerformanceChart
                :data="analyticsData?.productPerformance || []"
                :principal-name="selectedPrincipal?.name"
              />
            </div>
          </div>

          <!-- Opportunity Pipeline Chart -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <div class="h-64">
              <OpportunityPipelineChart
                :data="analyticsData?.opportunityPipeline || []"
                :principal-name="selectedPrincipal?.name"
              />
            </div>
          </div>
        </div>

        <!-- Detailed Insights Section -->
        <div class="bg-white rounded-lg border border-gray-200 p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Key Insights</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Top Performing Products -->
            <div>
              <h4 class="text-sm font-medium text-gray-700 mb-3">Top Performing Products</h4>
              <div class="space-y-2">
                <div
                  v-for="product in topProducts"
                  :key="product.product_id"
                  class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">
                      {{ product.product_name }}
                    </p>
                    <p class="text-xs text-gray-500">
                      {{ product.total_opportunities }} opportunities
                    </p>
                  </div>
                  <div class="flex-shrink-0 ml-4">
                    <ProductPerformanceIndicator
                      :score="product.product_performance_score || 0"
                      size="sm"
                      :show-label="false"
                    />
                  </div>
                </div>
                
                <div v-if="topProducts.length === 0" class="text-center py-4">
                  <p class="text-sm text-gray-500">No product data available</p>
                </div>
              </div>
            </div>

            <!-- Recent Activity Trends -->
            <div>
              <h4 class="text-sm font-medium text-gray-700 mb-3">Activity Distribution</h4>
              <div class="space-y-2">
                <div
                  v-for="activity in activityBreakdown"
                  :key="activity.type"
                  class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div class="flex items-center">
                    <div
                      class="w-3 h-3 rounded-full mr-3"
                      :style="{ backgroundColor: getActivityTypeColor(activity.type) }"
                    ></div>
                    <div>
                      <p class="text-sm font-medium text-gray-900">
                        {{ formatActivityType(activity.type) }}
                      </p>
                      <p class="text-xs text-gray-500">
                        {{ Math.round((activity.count / totalActivities) * 100) }}% of total
                      </p>
                    </div>
                  </div>
                  <span class="text-sm font-semibold text-gray-900">
                    {{ activity.count }}
                  </span>
                </div>
                
                <div v-if="activityBreakdown.length === 0" class="text-center py-4">
                  <p class="text-sm text-gray-500">No activity data available</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Data Export Summary -->
        <div v-if="exportData" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-start">
            <InformationCircleIcon class="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
            <div class="flex-1">
              <h4 class="text-sm font-medium text-blue-900">Export Ready</h4>
              <p class="text-sm text-blue-700 mt-1">
                Analytics data for {{ selectedPrincipal?.name }} ({{ selectedTimeRange }}) is ready for export.
                Includes {{ exportData.totalDataPoints }} data points across all metrics.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex">
          <ExclamationTriangleIcon class="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
          <div>
            <h3 class="text-sm font-medium text-red-800">Error Loading Analytics</h3>
            <p class="text-sm text-red-700 mt-1">{{ error }}</p>
            <button
              @click="loadAnalyticsData"
              class="mt-2 text-sm font-medium text-red-800 hover:text-red-900"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  ArrowDownTrayIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

// Components
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import PrincipalSelector from '@/components/principal/PrincipalSelector.vue'
import ProductPerformanceIndicator from '@/components/principal/ProductPerformanceIndicator.vue'
import {
  EngagementTrendChart,
  ActivityVolumeChart,
  ProductPerformanceChart,
  OpportunityPipelineChart
} from '@/components/principal'

// Services and Types
import { usePrincipalStore } from '@/stores/principalStore'
import type {
  PrincipalProductPerformance
} from '@/types/principal'

// ===============================
// REACTIVE STATE
// ===============================

const route = useRoute()
const principalStore = usePrincipalStore()

const selectedPrincipal = ref<any>(null)
const selectedTimeRange = ref('30d')
const loading = ref(false)
const error = ref<string | null>(null)

// Analytics data structure
interface AnalyticsData {
  currentEngagementScore: number
  totalActivities: number
  totalPipelineValue: number
  winRate: number
  engagementTrend: any[]
  activityVolume: any[]
  productPerformance: PrincipalProductPerformance[]
  opportunityPipeline: any[]
  activityBreakdown: { type: string; count: number }[]
}

const analyticsData = ref<AnalyticsData | null>(null)
const exportData = ref<any>(null)

// ===============================
// COMPUTED PROPERTIES
// ===============================

const principalsLoading = computed(() => principalStore.loading)
const principalsError = computed(() => principalStore.error)

const topProducts = computed(() => {
  if (!analyticsData.value?.productPerformance) return []
  
  return analyticsData.value.productPerformance
    .slice(0, 5)
    .sort((a, b) => (b.product_performance_score || 0) - (a.product_performance_score || 0))
})

const activityBreakdown = computed(() => {
  return analyticsData.value?.activityBreakdown || []
})

const totalActivities = computed(() => {
  return activityBreakdown.value.reduce((sum, activity) => sum + activity.count, 0)
})

// ===============================
// METHODS
// ===============================

const loadAnalyticsData = async () => {
  if (!selectedPrincipal.value) return

  loading.value = true
  error.value = null

  try {
    // Simulate comprehensive analytics data loading
    // In real implementation, this would call multiple API endpoints
    
    await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate API call

    // Mock comprehensive analytics data
    analyticsData.value = {
      currentEngagementScore: Math.floor(Math.random() * 40) + 60, // 60-100
      totalActivities: Math.floor(Math.random() * 200) + 50, // 50-250
      totalPipelineValue: Math.floor(Math.random() * 500000) + 100000, // $100k-$600k
      winRate: Math.floor(Math.random() * 30) + 40, // 40-70%
      
      // Engagement trend data (last 30 days)
      engagementTrend: generateEngagementTrendData(),
      
      // Activity volume data
      activityVolume: generateActivityVolumeData(),
      
      // Product performance data
      productPerformance: generateProductPerformanceData(),
      
      // Opportunity pipeline data
      opportunityPipeline: generateOpportunityPipelineData(),
      
      // Activity breakdown
      activityBreakdown: [
        { type: 'PHONE_CALL', count: Math.floor(Math.random() * 20) + 10 },
        { type: 'EMAIL', count: Math.floor(Math.random() * 30) + 15 },
        { type: 'IN_PERSON', count: Math.floor(Math.random() * 15) + 5 },
        { type: 'VIDEO_CALL', count: Math.floor(Math.random() * 10) + 3 },
        { type: 'SAMPLE_VISIT', count: Math.floor(Math.random() * 8) + 2 },
      ]
    }

    // Prepare export data
    exportData.value = {
      principalName: selectedPrincipal.value.name,
      timeRange: selectedTimeRange.value,
      totalDataPoints: analyticsData.value.engagementTrend.length + 
                      analyticsData.value.activityVolume.length +
                      analyticsData.value.productPerformance.length +
                      analyticsData.value.opportunityPipeline.length,
      generatedAt: new Date().toISOString()
    }

  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load analytics data'
    console.error('Error loading analytics data:', err)
  } finally {
    loading.value = false
  }
}

const generateEngagementTrendData = () => {
  const data = []
  const days = selectedTimeRange.value === '7d' ? 7 : 
               selectedTimeRange.value === '30d' ? 30 :
               selectedTimeRange.value === '90d' ? 90 : 365

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    data.push({
      date: date.toISOString().split('T')[0],
      engagement_score: Math.floor(Math.random() * 30) + 55, // 55-85
      activity_type: ['PHONE_CALL', 'EMAIL', 'IN_PERSON', 'VIDEO_CALL'][Math.floor(Math.random() * 4)],
      principal_name: selectedPrincipal.value?.name || 'Principal'
    })
  }
  
  return data
}

const generateActivityVolumeData = () => {
  const data = []
  const days = selectedTimeRange.value === '7d' ? 7 : 
               selectedTimeRange.value === '30d' ? 30 :
               selectedTimeRange.value === '90d' ? 90 : 365

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    const activityCount = Math.floor(Math.random() * 8)
    const types: string[] = []
    
    if (activityCount > 0) {
      const possibleTypes = ['PHONE_CALL', 'EMAIL', 'IN_PERSON', 'VIDEO_CALL', 'SAMPLE_VISIT']
      const numTypes = Math.min(activityCount, Math.floor(Math.random() * 3) + 1)
      
      for (let j = 0; j < numTypes; j++) {
        const typeIndex = Math.floor(Math.random() * possibleTypes.length)
        if (!types.includes(possibleTypes[typeIndex])) {
          types.push(possibleTypes[typeIndex])
        }
      }
    }
    
    data.push({
      date: date.toISOString().split('T')[0],
      count: activityCount,
      types
    })
  }
  
  return data
}

const generateProductPerformanceData = (): PrincipalProductPerformance[] => {
  const products = [
    'Premium Widget', 'Standard Package', 'Enterprise Solution', 
    'Basic Service', 'Advanced Analytics', 'Custom Integration',
    'Mobile App', 'Cloud Platform', 'Security Suite'
  ]
  
  return products.map((name, index) => ({
    principal_id: 'mock_principal',
    principal_name: 'Mock Principal',
    product_id: `prod_${index + 1}`,
    product_name: name,
    product_category: null,
    product_sku: `SKU-${index + 1}`,
    is_primary_principal: true,
    exclusive_rights: false,
    wholesale_price: Math.floor(Math.random() * 1000) + 100,
    minimum_order_quantity: Math.floor(Math.random() * 100) + 10,
    lead_time_days: Math.floor(Math.random() * 30) + 7,
    contract_start_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    contract_end_date: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    territory_restrictions: null,
    // Database interface properties
    opportunities_for_product: Math.floor(Math.random() * 15) + 3,
    won_opportunities_for_product: Math.floor(Math.random() * 8) + 1,
    active_opportunities_for_product: Math.floor(Math.random() * 10) + 2,
    latest_opportunity_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    avg_opportunity_probability: Math.floor(Math.random() * 50) + 25,
    
    // Component-expected properties (aliases/computed)
    total_opportunities: Math.floor(Math.random() * 15) + 3, // 3-18
    win_rate: Math.floor(Math.random() * 50) + 25, // 25-75%
    total_value: Math.floor(Math.random() * 100000) + 50000, // $50k-$150k
    
    // Interaction metrics
    interactions_for_product: Math.floor(Math.random() * 20) + 5,
    recent_interactions_for_product: Math.floor(Math.random() * 5) + 1,
    last_interaction_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    
    // Product status
    product_is_active: true,
    launch_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    discontinue_date: null,
    unit_cost: Math.floor(Math.random() * 500) + 50,
    suggested_retail_price: Math.floor(Math.random() * 1500) + 200,
    
    // Calculated metrics
    contract_status: 'ACTIVE' as const,
    product_performance_score: Math.floor(Math.random() * 40) + 40, // 40-80
    
    // Metadata
    relationship_created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    relationship_updated_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
  })).slice(0, 6) // Show top 6 products
}

const generateOpportunityPipelineData = () => {
  const stages = [
    'NEW_LEAD', 'INITIAL_OUTREACH', 'SAMPLE_VISIT_OFFERED', 
    'AWAITING_RESPONSE', 'FEEDBACK_LOGGED', 'DEMO_SCHEDULED', 'CLOSED_WON'
  ]
  
  let baseCount = Math.floor(Math.random() * 20) + 15 // Start with 15-35
  
  return stages.map(stage => {
    const count = Math.max(1, Math.floor(baseCount * (0.6 + Math.random() * 0.3))) // 60-90% conversion
    const value = count * (Math.floor(Math.random() * 25000) + 15000) // $15k-$40k per opp
    
    baseCount = Math.floor(count * 0.8) // Reduce for next stage
    
    return {
      stage,
      count,
      value
    }
  })
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`
  }
  return `$${value.toFixed(0)}`
}

const getActivityTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    'PHONE_CALL': '#3b82f6',
    'EMAIL': '#10b981',
    'IN_PERSON': '#f59e0b',
    'VIDEO_CALL': '#8b5cf6',
    'SAMPLE_VISIT': '#ef4444',
    'FOLLOW_UP': '#6b7280',
    'OTHER': '#9ca3af'
  }
  return colors[type] || '#9ca3af'
}

const formatActivityType = (type: string): string => {
  return type.toLowerCase().replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const exportAnalytics = async () => {
  if (!selectedPrincipal.value || !analyticsData.value) return

  try {
    // Simulate export process
    const exportPayload = {
      principal: selectedPrincipal.value,
      timeRange: selectedTimeRange.value,
      analytics: analyticsData.value,
      exportedAt: new Date().toISOString()
    }

    // In real implementation, this would trigger a download or send to API
    console.log('Exporting analytics data:', exportPayload)
    
    // Simulate download
    const dataStr = JSON.stringify(exportPayload, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `principal-analytics-${selectedPrincipal.value.name.replace(/\s+/g, '-')}-${selectedTimeRange.value}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    
  } catch (err) {
    console.error('Export failed:', err)
    error.value = 'Failed to export analytics data'
  }
}

// ===============================
// WATCHERS
// ===============================

watch([selectedPrincipal, selectedTimeRange], () => {
  if (selectedPrincipal.value) {
    loadAnalyticsData()
  }
}, { immediate: false })

// ===============================
// LIFECYCLE HOOKS
// ===============================

onMounted(async () => {
  // Load principals if not already loaded
  if (principalStore.principals.length === 0) {
    await principalStore.fetchPrincipals()
  }

  // Auto-select principal from route params
  const principalId = route.params.principalId as string
  if (principalId) {
    const principal = principalStore.principals.find(p => p.id === principalId)
    if (principal) {
      selectedPrincipal.value = principal
    }
  }
})
</script>

<style scoped>
.principal-analytics-view {
  /* Custom styles for analytics view */
}

/* Ensure proper grid layout on all screen sizes */
@media (max-width: 640px) {
  .grid {
    gap: 1rem;
  }
  
  /* Stack charts vertically on mobile */
  .lg\:grid-cols-2 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}

/* Touch targets for mobile */
.principal-analytics-view button,
.principal-analytics-view select {
  min-height: 44px;
}

/* Performance indicator sizing */
.principal-analytics-view .performance-indicator {
  flex-shrink: 0;
}

/* Responsive text scaling */
@media (max-width: 640px) {
  .text-2xl {
    font-size: 1.5rem;
  }
  
  .text-lg {
    font-size: 1rem;
  }
}
</style>