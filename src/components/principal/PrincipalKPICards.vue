<!--
  Principal KPI Cards - Comprehensive metrics dashboard
  Features: Real-time analytics, responsive grid, performance indicators
-->
<template>
  <div class="principal-kpi-cards">
    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div
        v-for="i in 4"
        :key="i"
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div class="animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div class="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    </div>

    <!-- KPI Cards Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Total Principals -->
      <KPICard
        title="Total Principals"
        :value="stats?.total_principals || 0"
        :change="calculateChange('total_principals')"
        :trend="getTrend('total_principals')"
        icon="UserGroupIcon"
        color="blue"
        :subtitle="`${stats?.active_principals || 0} active`"
      />

      <!-- Average Engagement Score -->
      <KPICard
        title="Avg Engagement"
        :value="formatScore(stats?.average_engagement_score || 0)"
        :change="calculateChange('engagement')"
        :trend="getTrend('engagement')"
        icon="ChartBarIcon"
        color="green"
        :subtitle="getEngagementLabel(stats?.average_engagement_score || 0)"
      />

      <!-- Product Coverage -->
      <KPICard
        title="Product Coverage"
        :value="stats?.principals_with_products || 0"
        :change="calculateChange('product_coverage')"
        :trend="getTrend('product_coverage')"
        icon="CubeIcon"
        color="purple"
        :subtitle="`${formatPercentage(getProductCoveragePercentage())}% of principals`"
      />

      <!-- Active Opportunities -->
      <KPICard
        title="Opportunities"
        :value="stats?.principals_with_opportunities || 0"
        :change="calculateChange('opportunities')"
        :trend="getTrend('opportunities')"
        icon="TrophyIcon"
        color="orange"
        :subtitle="`Across ${stats?.principals_with_opportunities || 0} principals`"
      />
    </div>

    <!-- Engagement Breakdown -->
    <div class="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Engagement Distribution</h3>
        <p class="text-sm text-gray-600 mt-1">Principal engagement score breakdown</p>
      </div>
      
      <div class="p-6">
        <div v-if="engagementBreakdown" class="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- High Engagement -->
          <div class="text-center">
            <div class="relative inline-flex items-center justify-center w-20 h-20 mb-3">
              <svg class="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  stroke="currentColor"
                  stroke-width="6"
                  fill="none"
                  class="text-gray-200"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  stroke="currentColor"
                  stroke-width="6"
                  fill="none"
                  :stroke-dasharray="getCircumference()"
                  :stroke-dashoffset="getOffset(getHighEngagementPercentage())"
                  class="text-green-500 transition-all duration-300"
                  stroke-linecap="round"
                />
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-2xl font-bold text-green-600">
                  {{ engagementBreakdown.high_engagement }}
                </span>
              </div>
            </div>
            <h4 class="text-sm font-medium text-gray-900">High Engagement</h4>
            <p class="text-xs text-gray-500">80-100 Score</p>
          </div>

          <!-- Medium Engagement -->
          <div class="text-center">
            <div class="relative inline-flex items-center justify-center w-20 h-20 mb-3">
              <svg class="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  stroke="currentColor"
                  stroke-width="6"
                  fill="none"
                  class="text-gray-200"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  stroke="currentColor"
                  stroke-width="6"
                  fill="none"
                  :stroke-dasharray="getCircumference()"
                  :stroke-dashoffset="getOffset(getMediumEngagementPercentage())"
                  class="text-yellow-500 transition-all duration-300"
                  stroke-linecap="round"
                />
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-2xl font-bold text-yellow-600">
                  {{ engagementBreakdown.medium_engagement }}
                </span>
              </div>
            </div>
            <h4 class="text-sm font-medium text-gray-900">Medium Engagement</h4>
            <p class="text-xs text-gray-500">40-79 Score</p>
          </div>

          <!-- Low Engagement -->
          <div class="text-center">
            <div class="relative inline-flex items-center justify-center w-20 h-20 mb-3">
              <svg class="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  stroke="currentColor"
                  stroke-width="6"
                  fill="none"
                  class="text-gray-200"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  stroke="currentColor"
                  stroke-width="6"
                  fill="none"
                  :stroke-dasharray="getCircumference()"
                  :stroke-dashoffset="getOffset(getLowEngagementPercentage())"
                  class="text-orange-500 transition-all duration-300"
                  stroke-linecap="round"
                />
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-2xl font-bold text-orange-600">
                  {{ engagementBreakdown.low_engagement }}
                </span>
              </div>
            </div>
            <h4 class="text-sm font-medium text-gray-900">Low Engagement</h4>
            <p class="text-xs text-gray-500">1-39 Score</p>
          </div>

          <!-- Inactive -->
          <div class="text-center">
            <div class="relative inline-flex items-center justify-center w-20 h-20 mb-3">
              <svg class="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  stroke="currentColor"
                  stroke-width="6"
                  fill="none"
                  class="text-gray-200"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  stroke="currentColor"
                  stroke-width="6"
                  fill="none"
                  :stroke-dasharray="getCircumference()"
                  :stroke-dashoffset="getOffset(getInactivePercentage())"
                  class="text-gray-500 transition-all duration-300"
                  stroke-linecap="round"
                />
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-2xl font-bold text-gray-600">
                  {{ engagementBreakdown.inactive }}
                </span>
              </div>
            </div>
            <h4 class="text-sm font-medium text-gray-900">Inactive</h4>
            <p class="text-xs text-gray-500">No Activity</p>
          </div>
        </div>

        <!-- Engagement Bar Chart -->
        <div class="mt-6">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">Overall Distribution</span>
            <span class="text-xs text-gray-500">
              {{ getTotalPrincipals() }} total principals
            </span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div class="h-full flex">
              <div
                class="bg-green-500 transition-all duration-500"
                :style="{ width: `${getHighEngagementPercentage()}%` }"
              ></div>
              <div
                class="bg-yellow-500 transition-all duration-500"
                :style="{ width: `${getMediumEngagementPercentage()}%` }"
              ></div>
              <div
                class="bg-orange-500 transition-all duration-500"
                :style="{ width: `${getLowEngagementPercentage()}%` }"
              ></div>
              <div
                class="bg-gray-500 transition-all duration-500"
                :style="{ width: `${getInactivePercentage()}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Activity Summary Cards -->
    <div class="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Follow-ups Required -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="flex items-center justify-center w-8 h-8 bg-red-100 rounded-md">
              <ExclamationTriangleIcon class="w-5 h-5 text-red-600" />
            </div>
          </div>
          <div class="ml-4 flex-1">
            <h4 class="text-sm font-medium text-gray-900">Follow-ups Required</h4>
            <div class="flex items-baseline">
              <span class="text-2xl font-semibold text-gray-900">
                {{ getFollowUpsRequired() }}
              </span>
              <span class="ml-2 text-sm text-gray-500">principals</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-md">
              <ClockIcon class="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div class="ml-4 flex-1">
            <h4 class="text-sm font-medium text-gray-900">Active This Week</h4>
            <div class="flex items-baseline">
              <span class="text-2xl font-semibold text-gray-900">
                {{ getActiveThisWeek() }}
              </span>
              <span class="ml-2 text-sm text-gray-500">principals</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Performers -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="flex items-center justify-center w-8 h-8 bg-green-100 rounded-md">
              <TrophyIcon class="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div class="ml-4 flex-1">
            <h4 class="text-sm font-medium text-gray-900">Top Performers</h4>
            <div class="flex items-baseline">
              <span class="text-2xl font-semibold text-gray-900">
                {{ getTopPerformers() }}
              </span>
              <span class="ml-2 text-sm text-gray-500">high scorers</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Vue imports (computed removed as unused)
import {
  ExclamationTriangleIcon,
  ClockIcon,
  TrophyIcon
} from '@heroicons/vue/24/outline'
import type { PrincipalActivitySummary } from '@/services/principalActivityApi'

// Component imports
import KPICard from './KPICard.vue'

// ===============================
// COMPONENT INTERFACE
// ===============================

interface Props {
  activitySummary?: PrincipalActivitySummary[]
  engagementBreakdown?: {
    high_engagement: number
    medium_engagement: number
    low_engagement: number
    inactive: number
  } | null
  stats?: {
    total_principals: number
    active_principals: number
    principals_with_products: number
    principals_with_opportunities: number
    average_products_per_principal: number
    average_engagement_score: number
    top_performers: any[]
  } | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  activitySummary: () => [],
  engagementBreakdown: null,
  stats: null,
  loading: false
})

// ===============================
// COMPUTED PROPERTIES
// ===============================

const getTotalPrincipals = () => {
  if (!props.engagementBreakdown) return 0
  return (
    props.engagementBreakdown.high_engagement +
    props.engagementBreakdown.medium_engagement +
    props.engagementBreakdown.low_engagement +
    props.engagementBreakdown.inactive
  )
}

const getHighEngagementPercentage = () => {
  const total = getTotalPrincipals()
  if (total === 0) return 0
  return (props.engagementBreakdown!.high_engagement / total) * 100
}

const getMediumEngagementPercentage = () => {
  const total = getTotalPrincipals()
  if (total === 0) return 0
  return (props.engagementBreakdown!.medium_engagement / total) * 100
}

const getLowEngagementPercentage = () => {
  const total = getTotalPrincipals()
  if (total === 0) return 0
  return (props.engagementBreakdown!.low_engagement / total) * 100
}

const getInactivePercentage = () => {
  const total = getTotalPrincipals()
  if (total === 0) return 0
  return (props.engagementBreakdown!.inactive / total) * 100
}

const getProductCoveragePercentage = () => {
  if (!props.stats || props.stats.total_principals === 0) return 0
  return (props.stats.principals_with_products / props.stats.total_principals) * 100
}

// ===============================
// UTILITY FUNCTIONS
// ===============================

const formatScore = (score: number): string => {
  return Math.round(score).toString()
}

const formatPercentage = (percentage: number): string => {
  return Math.round(percentage).toString()
}

const getEngagementLabel = (score: number): string => {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  if (score >= 20) return 'Poor'
  return 'Very Low'
}

const calculateChange = (metric: string): number => {
  // This would typically compare with previous period data
  // For now, return mock changes
  const changes: Record<string, number> = {
    total_principals: 5.2,
    engagement: 8.1,
    product_coverage: -2.3,
    opportunities: 12.5
  }
  return changes[metric] || 0
}

const getTrend = (metric: string): 'up' | 'down' | 'stable' => {
  const change = calculateChange(metric)
  if (change > 2) return 'up'
  if (change < -2) return 'down'
  return 'stable'
}

const getFollowUpsRequired = (): number => {
  if (!props.activitySummary) return 0
  return props.activitySummary.filter(p => p.follow_ups_required > 0).length
}

const getActiveThisWeek = (): number => {
  if (!props.activitySummary) return 0
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  
  return props.activitySummary.filter(p => {
    if (!p.last_activity_date) return false
    return new Date(p.last_activity_date) >= oneWeekAgo
  }).length
}

const getTopPerformers = (): number => {
  if (!props.activitySummary) return 0
  return props.activitySummary.filter(p => p.engagement_score >= 80).length
}

// SVG circle calculations
const getCircumference = (): number => {
  return 2 * Math.PI * 35 // radius = 35
}

const getOffset = (percentage: number): number => {
  const circumference = getCircumference()
  return circumference - (percentage / 100) * circumference
}
</script>

<style scoped>
.principal-kpi-cards {
  /* Animation for cards */
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.principal-kpi-cards > * {
  animation: slideInUp 0.4s ease-out;
}

.principal-kpi-cards > *:nth-child(2) {
  animation-delay: 0.1s;
}

.principal-kpi-cards > *:nth-child(3) {
  animation-delay: 0.2s;
}

.principal-kpi-cards > *:nth-child(4) {
  animation-delay: 0.3s;
}

/* Progress bar animations */
.progress-bar {
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Custom ring progress animation */
circle {
  transition: stroke-dashoffset 0.5s ease-in-out;
}
</style>