<!--
  KPI Card - Reusable metric display component
  Features: Multiple icon types, trend indicators, responsive design
-->
<template>
  <div class="kpi-card bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <div 
          class="flex items-center justify-center w-8 h-8 rounded-md"
          :class="iconBackgroundClass"
        >
          <component 
            :is="iconComponent" 
            class="w-5 h-5"
            :class="iconClass"
          />
        </div>
      </div>
      <div class="ml-4 flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-gray-600 truncate">{{ title }}</p>
          <TrendIndicator 
            v-if="change !== undefined"
            :change="change"
            :trend="trend"
            size="sm"
          />
        </div>
        <div class="flex items-baseline mt-1">
          <p class="text-2xl font-semibold text-gray-900">
            {{ formattedValue }}
          </p>
        </div>
        <p v-if="subtitle" class="text-sm text-gray-500 mt-1 truncate">
          {{ subtitle }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  UserGroupIcon,
  ChartBarIcon,
  CubeIcon,
  TrophyIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  FireIcon,
  StarIcon
} from '@heroicons/vue/24/outline'

// Component imports
import TrendIndicator from './TrendIndicator.vue'

// ===============================
// COMPONENT INTERFACE
// ===============================

interface Props {
  title: string
  value: number | string
  subtitle?: string
  change?: number
  trend?: 'up' | 'down' | 'stable'
  icon: string
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow' | 'gray'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  change: undefined,
  trend: 'stable',
  loading: false
})

// ===============================
// COMPUTED PROPERTIES
// ===============================

const iconComponent = computed(() => {
  const iconMap: Record<string, any> = {
    UserGroupIcon,
    ChartBarIcon,
    CubeIcon,
    TrophyIcon,
    BuildingOfficeIcon,
    CalendarIcon,
    ExclamationTriangleIcon,
    ClockIcon,
    FireIcon,
    StarIcon
  }
  return iconMap[props.icon] || UserGroupIcon
})

const iconBackgroundClass = computed(() => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    purple: 'bg-purple-100',
    orange: 'bg-orange-100',
    red: 'bg-red-100',
    yellow: 'bg-yellow-100',
    gray: 'bg-gray-100'
  }
  return colorMap[props.color] || 'bg-blue-100'
})

const iconClass = computed(() => {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    gray: 'text-gray-600'
  }
  return colorMap[props.color] || 'text-blue-600'
})

const formattedValue = computed(() => {
  if (typeof props.value === 'string') {
    return props.value
  }
  
  // Format numbers with appropriate suffixes
  if (props.value >= 1000000) {
    return `${(props.value / 1000000).toFixed(1)}M`
  }
  if (props.value >= 1000) {
    return `${(props.value / 1000).toFixed(1)}K`
  }
  
  return props.value.toString()
})
</script>

<style scoped>
.kpi-card {
  /* Custom styles for the KPI card */
}

/* Hover effect animation */
.kpi-card:hover {
  transform: translateY(-2px);
}

/* Loading state styles */
.kpi-card.loading {
  opacity: 0.7;
}
</style>