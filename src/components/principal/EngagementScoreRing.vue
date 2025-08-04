<!--
  Engagement Score Ring - Circular progress indicator for engagement scores
  Features: Animated progress, color-coded scores, multiple sizes
-->
<template>
  <div 
    class="engagement-score-ring relative inline-flex items-center justify-center"
    :class="containerClasses"
  >
    <!-- SVG Ring -->
    <svg 
      class="transform -rotate-90 transition-all duration-300"
      :class="svgClasses"
      :width="diameter"
      :height="diameter"
    >
      <!-- Background circle -->
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        stroke="currentColor"
        :stroke-width="strokeWidth"
        fill="none"
        class="text-gray-200"
      />
      
      <!-- Progress circle -->
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        stroke="currentColor"
        :stroke-width="strokeWidth"
        fill="none"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="strokeDashoffset"
        :class="progressColorClass"
        stroke-linecap="round"
        class="transition-all duration-500 ease-out"
      />
    </svg>
    
    <!-- Score Display -->
    <div class="absolute inset-0 flex items-center justify-center">
      <div class="text-center">
        <span 
          class="font-bold tabular-nums"
          :class="[textSizeClass, scoreColorClass]"
        >
          {{ displayScore }}
        </span>
        <div 
          v-if="showLabel && size !== 'xs' && size !== 'sm'"
          class="text-xs text-gray-500 font-medium"
        >
          {{ scoreLabel }}
        </div>
      </div>
    </div>
    
    <!-- Hover tooltip -->
    <div 
      v-if="showTooltip"
      class="absolute z-10 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-md shadow-lg opacity-0 pointer-events-none transition-opacity duration-200 -top-8 left-1/2 transform -translate-x-1/2 group-hover:opacity-100"
    >
      {{ tooltipText }}
      <div class="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// ===============================
// COMPONENT INTERFACE
// ===============================

interface Props {
  score: number
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showLabel?: boolean
  showTooltip?: boolean
  animated?: boolean
  maxScore?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showLabel: true,
  showTooltip: false,
  animated: true,
  maxScore: 100
})

// ===============================
// COMPUTED PROPERTIES
// ===============================

const sizeConfig = computed(() => {
  const configs = {
    xs: {
      diameter: 32,
      strokeWidth: 3,
      textClass: 'text-xs'
    },
    sm: {
      diameter: 40,
      strokeWidth: 3,
      textClass: 'text-sm'
    },
    md: {
      diameter: 56,
      strokeWidth: 4,
      textClass: 'text-base'
    },
    lg: {
      diameter: 80,
      strokeWidth: 5,
      textClass: 'text-lg'
    },
    xl: {
      diameter: 120,
      strokeWidth: 6,
      textClass: 'text-2xl'
    }
  }
  return configs[props.size]
})

const diameter = computed(() => sizeConfig.value.diameter)
const center = computed(() => diameter.value / 2)
const radius = computed(() => center.value - sizeConfig.value.strokeWidth / 2)
const strokeWidth = computed(() => sizeConfig.value.strokeWidth)

const circumference = computed(() => 2 * Math.PI * radius.value)

const strokeDashoffset = computed(() => {
  const percentage = Math.min(Math.max(props.score, 0), props.maxScore) / props.maxScore
  return circumference.value - percentage * circumference.value
})

const containerClasses = computed(() => {
  return [
    props.showTooltip ? 'group cursor-help' : '',
    'relative'
  ].filter(Boolean).join(' ')
})

const svgClasses = computed(() => {
  const classes = []
  
  if (props.animated) {
    classes.push('transition-transform duration-300 hover:scale-105')
  }
  
  return classes.join(' ')
})

const progressColorClass = computed(() => {
  const score = props.score
  
  if (score >= 80) return 'text-green-500'
  if (score >= 60) return 'text-blue-500'  
  if (score >= 40) return 'text-yellow-500'
  if (score >= 20) return 'text-orange-500'
  return 'text-red-500'
})

const scoreColorClass = computed(() => {
  const score = props.score
  
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-blue-600'
  if (score >= 40) return 'text-yellow-600'  
  if (score >= 20) return 'text-orange-600'
  return 'text-red-600'
})

const textSizeClass = computed(() => sizeConfig.value.textClass)

const displayScore = computed(() => {
  return Math.round(props.score).toString()
})

const scoreLabel = computed(() => {
  const score = props.score
  
  if (score >= 90) return 'Excellent'
  if (score >= 80) return 'Very Good'
  if (score >= 70) return 'Good'
  if (score >= 60) return 'Above Avg'
  if (score >= 50) return 'Average'
  if (score >= 40) return 'Below Avg'
  if (score >= 30) return 'Poor'
  if (score >= 20) return 'Very Poor'
  return 'Critical'
})

const tooltipText = computed(() => {
  return `Engagement Score: ${props.score}/${props.maxScore} (${scoreLabel.value})`
})
</script>

<style scoped>
.engagement-score-ring {
  /* Custom styles for engagement score ring */
}

/* Animation for score changes */
@keyframes score-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.engagement-score-ring.score-changed {
  animation: score-pulse 0.6s ease-in-out;
}

/* Glow effect for high scores */
.engagement-score-ring:has(.text-green-500) {
  filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.3));
}

/* Accessibility improvements */
.engagement-score-ring:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-radius: 50%;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .engagement-score-ring svg,
  .engagement-score-ring circle {
    transition: none !important;
    animation: none !important;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .engagement-score-ring svg circle {
    stroke-width: calc(var(--stroke-width) + 1px);
  }
  
  .engagement-score-ring .text-gray-200 {
    stroke: #666;
  }
}

/* Print styles */
@media print {
  .engagement-score-ring {
    -webkit-print-color-adjust: exact;
    color-adjust: exact;
  }
}
</style>