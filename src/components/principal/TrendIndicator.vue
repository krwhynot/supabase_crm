<!--
  Trend Indicator - Visual change indicator with percentage and direction
  Features: Color-coded trends, multiple sizes, animated icons
-->
<template>
  <div 
    class="trend-indicator inline-flex items-center"
    :class="sizeClasses"
  >
    <component
      :is="trendIcon"
      class="mr-1 transition-transform duration-200"
      :class="[iconClasses, iconColorClasses]"
    />
    <span 
      class="font-medium tabular-nums"
      :class="textColorClasses"
    >
      {{ formattedChange }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon
} from '@heroicons/vue/24/solid'

// ===============================
// COMPONENT INTERFACE
// ===============================

interface Props {
  change: number
  trend?: 'up' | 'down' | 'stable'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showIcon?: boolean
  showSign?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  trend: 'stable',
  size: 'sm',
  showIcon: true,
  showSign: true
})

// ===============================
// COMPUTED PROPERTIES
// ===============================

const trendIcon = computed(() => {
  if (!props.showIcon) return null
  
  switch (props.trend) {
    case 'up':
      return ArrowTrendingUpIcon
    case 'down':
      return ArrowTrendingDownIcon
    default:
      return MinusIcon
  }
})

const sizeClasses = computed(() => {
  const sizeMap = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }
  return sizeMap[props.size]
})

const iconClasses = computed(() => {
  const sizeMap = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }
  return sizeMap[props.size]
})

const iconColorClasses = computed(() => {
  switch (props.trend) {
    case 'up':
      return 'text-green-500'
    case 'down':
      return 'text-red-500'
    default:
      return 'text-gray-400'
  }
})

const textColorClasses = computed(() => {
  switch (props.trend) {
    case 'up':
      return 'text-green-600'
    case 'down':
      return 'text-red-600'
    default:
      return 'text-gray-500'
  }
})

const formattedChange = computed(() => {
  const absChange = Math.abs(props.change)
  const sign = props.showSign && props.change > 0 ? '+' : ''
  
  if (absChange >= 100) {
    return `${sign}${props.change.toFixed(0)}%`
  }
  if (absChange >= 10) {
    return `${sign}${props.change.toFixed(1)}%`
  }
  
  return `${sign}${props.change.toFixed(2)}%`
})
</script>

<style scoped>
.trend-indicator {
  /* Custom styles for trend indicator */
}

/* Animation for trend changes */
.trend-indicator component {
  transition: all 0.2s ease-in-out;
}

/* Pulse animation for significant changes */
@keyframes pulse-green {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
  }
}

@keyframes pulse-red {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
  }
}

.trend-indicator.significant-up {
  animation: pulse-green 2s infinite;
}

.trend-indicator.significant-down {
  animation: pulse-red 2s infinite;
}
</style>