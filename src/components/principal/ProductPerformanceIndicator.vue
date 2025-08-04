<!--
  Product Performance Indicator - Visual indicator for product performance scores
  Features: Circular progress indicator, color-coded performance levels, responsive sizing
-->
<template>
  <div class="product-performance-indicator" :class="sizeClasses">
    <div class="relative inline-flex items-center justify-center">
      <!-- Background Circle -->
      <svg
        :width="dimensions.size"
        :height="dimensions.size"
        class="transform -rotate-90"
      >
        <circle
          :cx="dimensions.center"
          :cy="dimensions.center"
          :r="dimensions.radius"
          fill="none"
          :stroke-width="dimensions.strokeWidth"
          stroke="#e5e7eb"
        />
        
        <!-- Performance Circle -->
        <circle
          :cx="dimensions.center"
          :cy="dimensions.center"
          :r="dimensions.radius"
          fill="none"
          :stroke-width="dimensions.strokeWidth"
          :stroke="performanceColor"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="strokeDashoffset"
          stroke-linecap="round"
          class="transition-all duration-500 ease-out"
        />
      </svg>
      
      <!-- Score Text -->
      <div class="absolute inset-0 flex items-center justify-center">
        <span 
          :class="textClasses"
          class="font-semibold"
        >
          {{ Math.round(score) }}
        </span>
      </div>
      
      <!-- Performance Badge (for larger sizes) -->
      <div 
        v-if="showBadge && size !== 'xs' && size !== 'sm'"
        class="absolute -top-1 -right-1"
      >
        <div
          :class="badgeClasses"
          class="w-3 h-3 rounded-full border-2 border-white"
        ></div>
      </div>
    </div>
    
    <!-- Performance Label (optional) -->
    <div v-if="showLabel" :class="labelClasses" class="text-center mt-1">
      {{ performanceLabel }}
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
  showBadge?: boolean
  animated?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  score: 0,
  size: 'md',
  showLabel: false,
  showBadge: true,
  animated: true
})

// ===============================
// COMPUTED PROPERTIES
// ===============================

const dimensions = computed(() => {
  const sizeMap = {
    xs: { size: 24, strokeWidth: 3, center: 12, radius: 9, fontSize: 'text-xs' },
    sm: { size: 32, strokeWidth: 3, center: 16, radius: 13, fontSize: 'text-xs' },
    md: { size: 48, strokeWidth: 4, center: 24, radius: 20, fontSize: 'text-sm' },
    lg: { size: 64, strokeWidth: 5, center: 32, radius: 27, fontSize: 'text-base' },
    xl: { size: 80, strokeWidth: 6, center: 40, radius: 34, fontSize: 'text-lg' }
  }
  return sizeMap[props.size]
})

const circumference = computed(() => {
  return 2 * Math.PI * dimensions.value.radius
})

const strokeDashoffset = computed(() => {
  const percentage = Math.min(Math.max(props.score, 0), 100) / 100
  return circumference.value * (1 - percentage)
})

const performanceLevel = computed(() => {
  if (props.score >= 80) return 'excellent'
  if (props.score >= 60) return 'good'
  if (props.score >= 40) return 'fair'
  if (props.score >= 20) return 'poor'
  return 'critical'
})

const performanceColor = computed(() => {
  const colorMap = {
    excellent: '#10b981', // Green
    good: '#22c55e',      // Light Green
    fair: '#f59e0b',      // Yellow
    poor: '#ef4444',      // Red
    critical: '#dc2626'   // Dark Red
  }
  return colorMap[performanceLevel.value]
})

const performanceLabel = computed(() => {
  const labelMap = {
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
    critical: 'Critical'
  }
  return labelMap[performanceLevel.value]
})

const sizeClasses = computed(() => {
  const classes = []
  
  if (props.size === 'xs') classes.push('performance-indicator-xs')
  else if (props.size === 'sm') classes.push('performance-indicator-sm')
  else if (props.size === 'md') classes.push('performance-indicator-md')
  else if (props.size === 'lg') classes.push('performance-indicator-lg')
  else if (props.size === 'xl') classes.push('performance-indicator-xl')
  
  return classes.join(' ')
})

const textClasses = computed(() => {
  const baseClasses = ['text-gray-900']
  baseClasses.push(dimensions.value.fontSize)
  
  return baseClasses.join(' ')
})

const labelClasses = computed(() => {
  const baseClasses = ['text-gray-600']
  
  if (props.size === 'xs' || props.size === 'sm') {
    baseClasses.push('text-xs')
  } else if (props.size === 'md') {
    baseClasses.push('text-sm')
  } else {
    baseClasses.push('text-base')
  }
  
  return baseClasses.join(' ')
})

const badgeClasses = computed(() => {
  const baseClasses = []
  
  if (performanceLevel.value === 'excellent') {
    baseClasses.push('bg-green-500')
  } else if (performanceLevel.value === 'good') {
    baseClasses.push('bg-green-400')
  } else if (performanceLevel.value === 'fair') {
    baseClasses.push('bg-yellow-500')
  } else if (performanceLevel.value === 'poor') {
    baseClasses.push('bg-red-500')
  } else {
    baseClasses.push('bg-red-600')
  }
  
  return baseClasses.join(' ')
})
</script>

<style scoped>
.product-performance-indicator {
  /* Custom styles for performance indicator */
}

/* Size-specific styling */
.performance-indicator-xs {
  @apply inline-block;
}

.performance-indicator-sm {
  @apply inline-block;
}

.performance-indicator-md {
  @apply inline-block;
}

.performance-indicator-lg {
  @apply block;
}

.performance-indicator-xl {
  @apply block;
}

/* Animation styles */
.product-performance-indicator svg circle:last-child {
  transition: stroke-dashoffset 0.6s ease-in-out;
}

/* Pulse animation for excellent performance */
.performance-indicator-excellent {
  animation: pulse-green 2s infinite;
}

@keyframes pulse-green {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

/* Hover effects */
.product-performance-indicator:hover {
  transform: scale(1.05);
  transition: transform 0.2s ease-in-out;
}

/* Loading state */
.performance-indicator-loading svg circle:last-child {
  animation: loading-spin 1s linear infinite;
}

@keyframes loading-spin {
  from {
    stroke-dashoffset: 0;
  }
  to {
    stroke-dashoffset: -283; /* Approximate full circle */
  }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .performance-indicator-lg,
  .performance-indicator-xl {
    transform: scale(0.8);
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .product-performance-indicator svg circle:last-child {
    stroke-width: 6px;
  }
  
  .product-performance-indicator span {
    font-weight: 700;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .product-performance-indicator svg circle:last-child {
    transition: none;
  }
  
  .product-performance-indicator:hover {
    transform: none;
  }
  
  .performance-indicator-excellent {
    animation: none;
  }
}

/* Print styles */
@media print {
  .product-performance-indicator {
    -webkit-print-color-adjust: exact;
    color-adjust: exact;
  }
}
</style>