<!--
  Principal Analytics Chart - Performance visualization with engagement trends
  Features: Interactive charts, multiple chart types, responsive design
-->
<template>
  <div class="principal-analytics-chart">
    <!-- Chart Controls -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div class="flex items-center space-x-4 mb-4 sm:mb-0">
        <h3 class="text-lg font-medium text-gray-900">Performance Analytics</h3>
        <div class="flex items-center space-x-2">
          <button
            v-for="chartType in chartTypes"
            :key="chartType.value"
            @click="selectedChartType = chartType.value"
            class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
            :class="[
              selectedChartType === chartType.value
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            ]"
          >
            {{ chartType.label }}
          </button>
        </div>
      </div>
      
      <div class="flex items-center space-x-4">
        <!-- Time Range Selector -->
        <select
          v-model="selectedTimeRange"
          class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
        
        <!-- Refresh Button -->
        <button
          @click="refreshData"
          :disabled="loading"
          class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <ArrowPathIcon 
            class="h-4 w-4" 
            :class="{ 'animate-spin': loading }"
          />
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-sm text-gray-600">Loading analytics...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center h-64 bg-red-50 rounded-lg border border-red-200">
      <div class="text-center">
        <ExclamationTriangleIcon class="h-8 w-8 text-red-400 mx-auto" />
        <p class="mt-2 text-sm text-red-600">{{ error }}</p>
        <button
          @click="refreshData"
          class="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    </div>

    <!-- Chart Container -->
    <div v-else class="bg-white">
      <!-- Engagement Score Trend -->
      <div v-if="selectedChartType === 'engagement'" class="h-64">
        <EngagementTrendChart
          :data="engagementData"
          :time-range="selectedTimeRange"
          :principal-name="principalName"
        />
      </div>

      <!-- Activity Volume -->
      <div v-else-if="selectedChartType === 'activity'" class="h-64">
        <ActivityVolumeChart
          :data="activityData"
          :time-range="selectedTimeRange"
          :principal-name="principalName"
        />
      </div>

      <!-- Product Performance -->
      <div v-else-if="selectedChartType === 'products'" class="h-64">
        <ProductPerformanceChart
          :data="productPerformanceData"
          :principal-name="principalName"
        />
      </div>

      <!-- Opportunity Pipeline -->
      <div v-else-if="selectedChartType === 'opportunities'" class="h-64">
        <OpportunityPipelineChart
          :data="opportunityData"
          :principal-name="principalName"
        />
      </div>
    </div>

    <!-- Chart Legend -->
    <div class="mt-4 flex flex-wrap items-center justify-center space-x-6 text-sm">
      <div 
        v-for="legend in getCurrentLegend()"
        :key="legend.label"
        class="flex items-center space-x-2"
      >
        <div 
          class="w-3 h-3 rounded-full"
          :style="{ backgroundColor: legend.color }"
        ></div>
        <span class="text-gray-600">{{ legend.label }}</span>
      </div>
    </div>

    <!-- Key Insights -->
    <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div 
        v-for="insight in keyInsights"
        :key="insight.label"
        class="bg-gray-50 rounded-lg p-4"
      >
        <div class="flex items-center">
          <component
            :is="insight.icon"
            class="h-5 w-5 mr-2"
            :class="insight.iconColor"
          />
          <span class="text-sm font-medium text-gray-700">{{ insight.label }}</span>
        </div>
        <p class="mt-1 text-2xl font-semibold text-gray-900">{{ insight.value }}</p>
        <p class="text-sm text-gray-600">{{ insight.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/vue/24/outline'
import type {
  PrincipalTimelineEntry,
  PrincipalProductPerformance
} from '@/types/principal'

// Chart component imports (these would be separate components)
import EngagementTrendChart from './charts/EngagementTrendChart.vue'
import ActivityVolumeChart from './charts/ActivityVolumeChart.vue'
import ProductPerformanceChart from './charts/ProductPerformanceChart.vue'
import OpportunityPipelineChart from './charts/OpportunityPipelineChart.vue'

// ===============================
// COMPONENT INTERFACE
// ===============================

interface Props {
  principalId: string
  activityData?: PrincipalTimelineEntry[]
  productPerformanceData?: PrincipalProductPerformance[]
  loading?: boolean
  principalName?: string
}

interface Emits {
  (e: 'refresh'): void
  (e: 'time-range-change', timeRange: string): void
  (e: 'chart-type-change', chartType: string): void
}

const props = withDefaults(defineProps<Props>(), {
  activityData: () => [],
  productPerformanceData: () => [],
  loading: false,
  principalName: 'Principal'
})

const emit = defineEmits<Emits>()

// ===============================
// REACTIVE STATE
// ===============================

const selectedChartType = ref('engagement')
const selectedTimeRange = ref('30d')
const error = ref<string | null>(null)

const chartTypes = [
  { value: 'engagement', label: 'Engagement' },
  { value: 'activity', label: 'Activity' },
  { value: 'products', label: 'Products' },
  { value: 'opportunities', label: 'Opportunities' }
]

// ===============================
// COMPUTED PROPERTIES  
// ===============================

const engagementData = computed(() => {
  // Transform activity data for engagement trend chart
  if (!props.activityData || props.activityData.length === 0) return []
  
  return props.activityData.map(activity => ({
    date: activity.activity_date,
    engagement_score: parseFloat(activity.engagement_impact?.toString() || '0'),
    activity_type: activity.activity_type,
    principal_name: activity.principal_name
  }))
})

const activityData = computed(() => {
  // Transform activity data for volume chart
  if (!props.activityData || props.activityData.length === 0) return []
  
  const grouped = new Map<string, { date: string; count: number; types: string[] }>()
  
  props.activityData.forEach(activity => {
    const date = activity.activity_date.split('T')[0] // Get date part only
    const existing = grouped.get(date)
    
    if (existing) {
      existing.count++
      if (!existing.types.includes(activity.activity_type)) {
        existing.types.push(activity.activity_type)
      }
    } else {
      grouped.set(date, {
        date,
        count: 1,
        types: [activity.activity_type]
      })
    }
  })
  
  return Array.from(grouped.values()).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )
})

const opportunityData = computed(() => {
  // This would typically come from opportunities API filtered by principal
  // For now, return mock data structure
  return [
    { stage: 'NEW_LEAD', count: 2, value: 50000 },
    { stage: 'INITIAL_OUTREACH', count: 1, value: 25000 },
    { stage: 'SAMPLE_VISIT_OFFERED', count: 3, value: 75000 },
    { stage: 'AWAITING_RESPONSE', count: 1, value: 30000 },
    { stage: 'DEMO_SCHEDULED', count: 1, value: 40000 }
  ]
})

const keyInsights = computed(() => {
  const insights = []
  
  // Engagement Trend Insight
  const avgEngagement = engagementData.value.reduce((sum, item) => sum + item.engagement_score, 0) / (engagementData.value.length || 1)
  insights.push({
    label: 'Avg Engagement',
    value: avgEngagement.toFixed(1),
    description: 'Average engagement score',
    icon: ArrowTrendingUpIcon,
    iconColor: avgEngagement >= 70 ? 'text-green-500' : avgEngagement >= 40 ? 'text-yellow-500' : 'text-red-500'
  })
  
  // Activity Frequency
  const totalActivities = activityData.value.reduce((sum, item) => sum + item.count, 0)
  const avgDaily = totalActivities / (activityData.value.length || 1)
  insights.push({
    label: 'Daily Activity',
    value: avgDaily.toFixed(1),
    description: 'Average activities per day',
    icon: CalendarIcon,
    iconColor: 'text-blue-500'
  })
  
  // Product Performance
  const productCount = props.productPerformanceData?.length || 0
  insights.push({
    label: 'Products',
    value: productCount.toString(),
    description: 'Associated products',
    icon: ChartBarIcon,
    iconColor: 'text-purple-500'
  })
  
  return insights
})

const getCurrentLegend = () => {
  const legends = {
    engagement: [
      { label: 'Engagement Score', color: '#3b82f6' },
      { label: 'Trend Line', color: '#10b981' }
    ],
    activity: [
      { label: 'Interactions', color: '#3b82f6' },
      { label: 'Meetings', color: '#f59e0b' },
      { label: 'Opportunities', color: '#ef4444' }
    ],
    products: [
      { label: 'High Performance', color: '#10b981' },
      { label: 'Medium Performance', color: '#f59e0b' },
      { label: 'Low Performance', color: '#ef4444' }
    ],
    opportunities: [
      { label: 'Pipeline Value', color: '#3b82f6' },
      { label: 'Count', color: '#8b5cf6' }
    ]
  }
  return legends[selectedChartType.value as keyof typeof legends] || []
}

// ===============================
// EVENT HANDLERS
// ===============================

const refreshData = () => {
  error.value = null
  emit('refresh')
}

// ===============================
// WATCHERS
// ===============================

watch(selectedTimeRange, (newRange) => {
  emit('time-range-change', newRange)
})

watch(selectedChartType, (newType) => {
  emit('chart-type-change', newType)
})

// ===============================
// LIFECYCLE HOOKS
// ===============================

onMounted(() => {
  // Initialize chart if needed
  refreshData()
})
</script>

<style scoped>
.principal-analytics-chart {
  /* Custom styles for analytics chart */
}

/* Chart container animations */
.chart-container {
  animation: fadeIn 0.3s ease-out;
}

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

/* Chart type button transitions */
.chart-type-button {
  transition: all 0.2s ease-in-out;
}

.chart-type-button:hover {
  transform: translateY(-1px);
}

/* Key insights animation */
.key-insights {
  animation: slideUp 0.4s ease-out 0.2s both;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive chart adjustments */
@media (max-width: 640px) {
  .principal-analytics-chart .chart-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .principal-analytics-chart .chart-types {
    justify-content: center;
    margin-bottom: 1rem;
  }
}

/* Print styles */
@media print {
  .principal-analytics-chart .chart-controls {
    display: none;
  }
  
  .principal-analytics-chart {
    break-inside: avoid;
  }
}
</style>