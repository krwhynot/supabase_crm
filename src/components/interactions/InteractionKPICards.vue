<!-- 
  Interaction KPI Cards Component
  Dashboard-ready KPI components following opportunity patterns
  Displays real-time interaction metrics with responsive design
-->

<template>
  <div class="space-y-6">
    <!-- Basic KPI Cards Row -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Total Interactions -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Total Interactions</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ formatNumber(kpis?.total_interactions || 0) }}
            </p>
          </div>
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
              <ChatBubbleLeftRightIcon class="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div class="mt-2 flex items-center text-sm">
          <span class="text-green-600">
            +{{ kpis?.interactions_this_week || 0 }} this week
          </span>
        </div>
      </div>

      <!-- Overdue Follow-ups -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Overdue Follow-ups</p>
            <p class="text-2xl font-bold text-red-600">
              {{ formatNumber(kpis?.overdue_follow_ups || 0) }}
            </p>
          </div>
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
              <ExclamationTriangleIcon class="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
        <div class="mt-2 flex items-center text-sm">
          <span class="text-gray-600">
            {{ kpis?.scheduled_follow_ups || 0 }} scheduled
          </span>
        </div>
      </div>

      <!-- Follow-up Completion Rate -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Completion Rate</p>
            <p class="text-2xl font-bold text-green-600">
              {{ kpis?.follow_up_completion_rate || 0 }}%
            </p>
          </div>
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
              <CheckCircleIcon class="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div class="mt-2 flex items-center text-sm">
          <span class="text-gray-600">
            {{ kpis?.avg_days_to_follow_up || 0 }} days avg
          </span>
        </div>
      </div>

      <!-- Active Contacts -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Active Contacts</p>
            <p class="text-2xl font-bold text-purple-600">
              {{ formatNumber(kpis?.unique_contacts_contacted || 0) }}
            </p>
          </div>
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
              <UsersIcon class="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
        <div class="mt-2 flex items-center text-sm">
          <span class="text-gray-600">
            {{ kpis?.unique_opportunities_touched || 0 }} opportunities
          </span>
        </div>
      </div>
    </div>

    <!-- Extended KPI Cards Row (if available) -->
    <div v-if="extendedKPIs" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Response Time -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Avg Response Time</p>
            <p class="text-2xl font-bold text-indigo-600">
              {{ extendedKPIs.response_time_metrics.avg_response_time_hours }}h
            </p>
          </div>
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-indigo-100 rounded-md flex items-center justify-center">
              <ClockIcon class="w-5 h-5 text-indigo-600" />
            </div>
          </div>
        </div>
        <div class="mt-2 flex items-center text-sm">
          <span class="text-gray-600">
            {{ extendedKPIs.response_time_metrics.fastest_response_hours }}h fastest
          </span>
        </div>
      </div>

      <!-- Growth Trend -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Growth Rate</p>
            <p class="text-2xl font-bold" :class="growthColorClass">
              {{ extendedKPIs.activity_trends.growth_rate_percentage.toFixed(1) }}%
            </p>
          </div>
          <div class="flex-shrink-0">
            <div class="w-8 h-8 rounded-md flex items-center justify-center" :class="growthBgClass">
              <component :is="growthIcon" class="w-5 h-5" :class="growthIconClass" />
            </div>
          </div>
        </div>
        <div class="mt-2 flex items-center text-sm">
          <span class="text-gray-600">
            {{ extendedKPIs.activity_trends.trend_direction }} trend
          </span>
        </div>
      </div>

      <!-- Engagement Score -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Engagement Score</p>
            <p class="text-2xl font-bold text-amber-600">
              {{ extendedKPIs.efficiency_metrics.engagement_quality_score }}/10
            </p>
          </div>
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-amber-100 rounded-md flex items-center justify-center">
              <StarIcon class="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>
        <div class="mt-2 flex items-center text-sm">
          <span class="text-gray-600">
            {{ extendedKPIs.efficiency_metrics.conversion_to_opportunity_rate }}% conversion
          </span>
        </div>
      </div>
    </div>

    <!-- Type Distribution Chart -->
    <div v-if="kpis?.type_distribution" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Interaction Types</h3>
      <div class="space-y-3">
        <div 
          v-for="(count, type) in kpis.type_distribution" 
          :key="type"
          class="flex items-center justify-between"
        >
          <div class="flex items-center space-x-3">
            <div 
              class="w-3 h-3 rounded-full"
              :class="getTypeColor(type as InteractionType)"
            ></div>
            <span class="text-sm font-medium text-gray-700">{{ formatTypeName(type) }}</span>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-600">{{ count }}</span>
            <div class="w-20 bg-gray-200 rounded-full h-2">
              <div 
                class="h-2 rounded-full transition-all duration-300"
                :class="getTypeColor(type as InteractionType)"
                :style="{ width: `${getTypePercentage(count)}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p class="text-gray-600">Loading interaction metrics...</p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex">
        <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">
            Error loading KPIs
          </h3>
          <p class="mt-1 text-sm text-red-700">{{ error }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useInteractionStore } from '@/stores/interactionStore'
import type { InteractionType, InteractionKPIs } from '@/types/interactions'
import type { ExtendedInteractionKPIs } from '@/services/interactionKPIs'
import {
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UsersIcon,
  ClockIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon
} from '@heroicons/vue/24/outline'

// Props
interface Props {
  filters?: Record<string, any>
  showExtended?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  filters: () => ({}),
  showExtended: true
})

// Store
const interactionStore = useInteractionStore()

// Computed properties
const kpis = computed(() => interactionStore.kpis)
const extendedKPIs = computed(() => interactionStore.extendedKPIs)
const loading = computed(() => interactionStore.isLoading)
const error = computed(() => interactionStore.error)

// Growth trend computed properties
const growthColorClass = computed(() => {
  if (!extendedKPIs.value) return 'text-gray-600'
  const trend = extendedKPIs.value.activity_trends.trend_direction
  switch (trend) {
    case 'up': return 'text-green-600'
    case 'down': return 'text-red-600'
    default: return 'text-gray-600'
  }
})

const growthBgClass = computed(() => {
  if (!extendedKPIs.value) return 'bg-gray-100'
  const trend = extendedKPIs.value.activity_trends.trend_direction
  switch (trend) {
    case 'up': return 'bg-green-100'
    case 'down': return 'bg-red-100'
    default: return 'bg-gray-100'
  }
})

const growthIconClass = computed(() => {
  if (!extendedKPIs.value) return 'text-gray-600'
  const trend = extendedKPIs.value.activity_trends.trend_direction
  switch (trend) {
    case 'up': return 'text-green-600'
    case 'down': return 'text-red-600'
    default: return 'text-gray-600'
  }
})

const growthIcon = computed(() => {
  if (!extendedKPIs.value) return MinusIcon
  const trend = extendedKPIs.value.activity_trends.trend_direction
  switch (trend) {
    case 'up': return ArrowTrendingUpIcon
    case 'down': return ArrowTrendingDownIcon
    default: return MinusIcon
  }
})

// Methods
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const formatTypeName = (type: string): string => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
}

const getTypeColor = (type: InteractionType): string => {
  const colors = {
    EMAIL: 'bg-blue-500',
    CALL: 'bg-green-500',
    IN_PERSON: 'bg-purple-500',
    DEMO: 'bg-orange-500',
    FOLLOW_UP: 'bg-indigo-500'
  }
  return colors[type] || 'bg-gray-500'
}

const getTypePercentage = (count: number): number => {
  if (!kpis.value?.type_distribution) return 0
  const total = Object.values(kpis.value.type_distribution).reduce((sum, val) => sum + val, 0)
  return total > 0 ? (count / total) * 100 : 0
}

// Lifecycle
onMounted(async () => {
  try {
    if (props.showExtended) {
      await interactionStore.fetchExtendedKPIs(props.filters)
    } else {
      await interactionStore.fetchKPIs(props.filters)
    }
  } catch (error) {
    console.error('Failed to load interaction KPIs:', error)
  }
})
</script>