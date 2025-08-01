<template>
  <div 
    class="probability-bar-container"
    :aria-label="`Success probability: ${displayPercentage}`"
    role="progressbar"
    :aria-valuenow="probability"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <!-- Probability Label -->
    <div v-if="showLabel" class="probability-label">
      <span class="label-text">Probability</span>
      <span class="percentage-text" :class="percentageColorClass">
        {{ displayPercentage }}
      </span>
    </div>
    
    <!-- Progress Bar -->
    <div class="progress-track" :class="trackSizeClasses">
      <!-- Background track -->
      <div class="progress-background" />
      
      <!-- Progress fill -->
      <div 
        class="progress-fill"
        :class="[fillColorClasses, fillSizeClasses]"
        :style="{ width: `${clampedProbability}%` }"
      />
      
      <!-- Percentage overlay (for inline display) -->
      <div v-if="showPercentageInline" class="percentage-overlay">
        <span class="percentage-inline" :class="inlineTextColorClass">
          {{ displayPercentage }}
        </span>
      </div>
    </div>
    
    <!-- Range indicator (optional) -->
    <div v-if="showRange" class="range-indicator">
      <span class="range-label" :class="rangeColorClass">
        {{ probabilityRange }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * Props interface for ProbabilityBar component
 */
interface Props {
  /** Probability percentage (0-100) */
  probability: number
  /** Size variant of the progress bar */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to show the probability label */
  showLabel?: boolean
  /** Whether to show percentage inside the bar */
  showPercentageInline?: boolean
  /** Whether to show probability range indicator */
  showRange?: boolean
  /** Custom color override */
  customColor?: string
  /** Whether the bar is in a compact layout */
  compact?: boolean
  /** Whether to animate the progress fill */
  animated?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showLabel: true,
  showPercentageInline: false,
  showRange: false,
  compact: false,
  animated: true
})

/**
 * Component emits - none needed for display component
 */
defineEmits<{
  /** Emitted when the probability bar is clicked */
  click: [probability: number]
}>()

// ===============================
// COMPUTED PROPERTIES
// ===============================

/**
 * Ensure probability is within valid range
 */
const clampedProbability = computed(() => {
  return Math.max(0, Math.min(100, props.probability || 0))
})

/**
 * Display percentage with proper formatting
 */
const displayPercentage = computed(() => {
  const value = clampedProbability.value
  return value % 1 === 0 ? `${value}%` : `${value.toFixed(1)}%`
})

/**
 * Get probability range category
 */
const probabilityRange = computed(() => {
  const value = clampedProbability.value
  if (value === 0) return 'No Chance'
  if (value < 25) return 'Low'
  if (value < 50) return 'Medium-Low'
  if (value < 75) return 'Medium-High'
  if (value < 100) return 'High'
  return 'Certain'
})

/**
 * Get color category based on probability
 */
const colorCategory = computed(() => {
  if (props.customColor) return 'custom'
  
  const value = clampedProbability.value
  if (value === 0) return 'gray'
  if (value < 25) return 'red'
  if (value < 50) return 'orange'
  if (value < 75) return 'yellow'
  if (value < 100) return 'green'
  return 'emerald'
})

/**
 * Track size classes
 */
const trackSizeClasses = computed(() => {
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }
  return sizeClasses[props.size]
})

/**
 * Fill size classes
 */
const fillSizeClasses = computed(() => {
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }
  return sizeClasses[props.size]
})

/**
 * Fill color classes
 */
const fillColorClasses = computed(() => {
  if (props.customColor) {
    return '' // Custom color handled via style
  }
  
  const colorClasses = {
    gray: 'bg-gray-400',
    red: 'bg-red-500',
    orange: 'bg-orange-500', 
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    emerald: 'bg-emerald-500',
    custom: ''
  }
  
  const baseClass = colorClasses[colorCategory.value]
  const animationClass = props.animated ? 'transition-all duration-500 ease-out' : ''
  
  return `${baseClass} ${animationClass}`.trim()
})

/**
 * Percentage text color class
 */
const percentageColorClass = computed(() => {
  const colorClasses = {
    gray: 'text-gray-600',
    red: 'text-red-600',
    orange: 'text-orange-600',
    yellow: 'text-yellow-600',
    green: 'text-green-600',
    emerald: 'text-emerald-600',
    custom: 'text-gray-700'
  }
  return `font-semibold ${colorClasses[colorCategory.value]}`
})

/**
 * Inline text color class (for text inside bar)
 */
const inlineTextColorClass = computed(() => {
  const value = clampedProbability.value
  // Use white text for darker backgrounds, dark text for lighter ones
  if (value < 50) {
    return 'text-gray-700'
  }
  return 'text-white'
})

/**
 * Range indicator color class
 */
const rangeColorClass = computed(() => {
  const colorClasses = {
    gray: 'text-gray-500',
    red: 'text-red-500',
    orange: 'text-orange-500',
    yellow: 'text-yellow-500',
    green: 'text-green-500',
    emerald: 'text-emerald-500',
    custom: 'text-gray-500'
  }
  return `text-xs font-medium ${colorClasses[colorCategory.value]}`
})
</script>

<style scoped>
/* ===============================
   PROBABILITY BAR COMPONENT STYLES
   =============================== */

.probability-bar-container {
  @apply w-full;
}

/* ===============================
   LABEL STYLES
   =============================== */

.probability-label {
  @apply flex items-center justify-between mb-2;
}

.label-text {
  @apply text-sm font-medium text-gray-700;
}

.percentage-text {
  @apply text-sm tabular-nums;
}

/* ===============================
   PROGRESS BAR STYLES
   =============================== */

.progress-track {
  @apply relative w-full rounded-full overflow-hidden;
  @apply touch-manipulation; /* iPad optimization */
}

.progress-background {
  @apply absolute inset-0 bg-gray-200 rounded-full;
}

.progress-fill {
  @apply relative rounded-full;
  @apply min-w-0;
  transition-property: width, background-color;
}

/* ===============================
   PERCENTAGE OVERLAY STYLES
   =============================== */

.percentage-overlay {
  @apply absolute inset-0 flex items-center justify-center;
  @apply pointer-events-none;
}

.percentage-inline {
  @apply text-xs font-semibold tabular-nums;
  @apply drop-shadow-sm;
}

/* ===============================
   RANGE INDICATOR STYLES  
   =============================== */

.range-indicator {
  @apply mt-1 text-right;
}

.range-label {
  @apply text-xs font-medium uppercase tracking-wide;
}

/* ===============================
   SIZE VARIANTS
   =============================== */

/* Small variant */
.probability-bar-container.size-sm .probability-label {
  @apply mb-1;
}

.probability-bar-container.size-sm .label-text,
.probability-bar-container.size-sm .percentage-text {
  @apply text-xs;
}

.probability-bar-container.size-sm .percentage-inline {
  @apply text-xs;
}

/* Large variant */
.probability-bar-container.size-lg .probability-label {
  @apply mb-3;
}

.probability-bar-container.size-lg .label-text,
.probability-bar-container.size-lg .percentage-text {
  @apply text-base;
}

.probability-bar-container.size-lg .percentage-inline {
  @apply text-sm;
}

/* ===============================
   COMPACT LAYOUT
   =============================== */

.probability-bar-container.compact .probability-label {
  @apply mb-1;
}

.probability-bar-container.compact .label-text,
.probability-bar-container.compact .percentage-text {
  @apply text-xs;
}

.probability-bar-container.compact .range-indicator {
  @apply mt-0.5;
}

/* ===============================
   RESPONSIVE DESIGN
   =============================== */

/* iPad Portrait Optimization */
@media (min-width: 768px) and (max-width: 1024px) {
  .progress-track {
    @apply min-h-[44px]; /* Touch-friendly height */
  }
  
  .percentage-inline {
    @apply text-sm;
  }
}

/* Mobile Optimization */
@media (max-width: 767px) {
  .probability-label {
    @apply text-xs;
  }
  
  .percentage-text {
    @apply text-xs;
  }
  
  .progress-track {
    @apply min-h-[32px]; /* Touch-friendly on mobile */
  }
  
  .percentage-inline {
    @apply text-xs;
  }
}

/* ===============================
   ACCESSIBILITY ENHANCEMENTS
   =============================== */

.probability-bar-container:focus-within .progress-track {
  @apply ring-2 ring-blue-500 ring-offset-2;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .progress-background {
    @apply bg-gray-300 border border-gray-400;
  }
  
  .progress-fill {
    @apply border border-gray-600;
  }
  
  .percentage-inline {
    @apply drop-shadow-md;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .progress-fill {
    transition: none;
  }
}

/* ===============================
   ANIMATION ENHANCEMENTS
   =============================== */

.progress-fill.animated {
  transition-delay: 0.1s;
}

/* Pulse animation for loading state */
@keyframes probability-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.progress-fill.loading {
  animation: probability-pulse 1.5s ease-in-out infinite;
}

/* ===============================
   PRINT STYLES
   =============================== */

@media print {
  .progress-background {
    @apply bg-gray-300;
  }
  
  .progress-fill {
    @apply bg-gray-800;
  }
  
  .percentage-text,
  .label-text,
  .range-label {
    @apply text-black;
  }
}
</style>