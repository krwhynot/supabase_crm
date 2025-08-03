<!--
  Sample Rating Component
  Displays interaction sample/quality rating with star visualization
  Following opportunity patterns for consistent UI
-->

<template>
  <div class="sample-rating" :class="containerClasses">
    <div class="rating-display">
      <!-- Star display -->
      <div class="stars-container">
        <div
          v-for="star in maxRating"
          :key="star"
          class="star"
          :class="getStarClass(star)"
        >
          <StarIcon class="star-icon" />
        </div>
      </div>
      
      <!-- Numeric display (optional) -->
      <span v-if="showNumeric" class="rating-text">
        {{ rating }}/{{ maxRating }}
      </span>
    </div>
    
    <!-- Rating label (optional) -->
    <span v-if="showLabel" class="rating-label">
      {{ getRatingLabel(rating) }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { StarIcon } from '@heroicons/vue/24/solid'

interface Props {
  /** The rating value (0-5) */
  rating: number
  /** Maximum rating value */
  maxRating?: number
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** Whether to show numeric rating */
  showNumeric?: boolean
  /** Whether to show rating label */
  showLabel?: boolean
  /** Compact mode with minimal spacing */
  compact?: boolean
  /** Whether rating is readonly */
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  maxRating: 5,
  size: 'sm',
  showNumeric: false,
  showLabel: false,
  compact: false,
  readonly: true
})

// Container classes
const containerClasses = computed(() => {
  return [
    `rating-${props.size}`,
    { 'rating-compact': props.compact }
  ]
})

// Get star class based on rating
const getStarClass = (starNumber: number): string[] => {
  const classes = ['star-base']
  
  if (starNumber <= props.rating) {
    classes.push('star-filled')
  } else if (starNumber - 0.5 <= props.rating) {
    classes.push('star-half')
  } else {
    classes.push('star-empty')
  }
  
  return classes
}

// Get rating label text
const getRatingLabel = (rating: number): string => {
  if (rating === 0) return 'No rating'
  if (rating <= 1) return 'Poor'
  if (rating <= 2) return 'Fair'
  if (rating <= 3) return 'Good'
  if (rating <= 4) return 'Very Good'
  return 'Excellent'
}
</script>

<style scoped>
/* Base container styles */
.sample-rating {
  @apply flex items-center;
}

.rating-display {
  @apply flex items-center;
}

.stars-container {
  @apply flex items-center;
}

.rating-text {
  @apply ml-2 text-gray-600 font-medium;
}

.rating-label {
  @apply ml-2 text-gray-500;
}

/* Size variants */
.rating-xs .stars-container {
  @apply gap-0.5;
}

.rating-xs .star-icon {
  @apply h-3 w-3;
}

.rating-xs .rating-text {
  @apply text-xs;
}

.rating-xs .rating-label {
  @apply text-xs;
}

.rating-sm .stars-container {
  @apply gap-0.5;
}

.rating-sm .star-icon {
  @apply h-4 w-4;
}

.rating-sm .rating-text {
  @apply text-sm;
}

.rating-sm .rating-label {
  @apply text-sm;
}

.rating-md .stars-container {
  @apply gap-1;
}

.rating-md .star-icon {
  @apply h-5 w-5;
}

.rating-md .rating-text {
  @apply text-base;
}

.rating-md .rating-label {
  @apply text-base;
}

.rating-lg .stars-container {
  @apply gap-1;
}

.rating-lg .star-icon {
  @apply h-6 w-6;
}

.rating-lg .rating-text {
  @apply text-lg;
}

.rating-lg .rating-label {
  @apply text-lg;
}

/* Compact variant */
.rating-compact {
  @apply space-x-1;
}

.rating-compact .rating-text {
  @apply ml-1;
}

.rating-compact .rating-label {
  @apply ml-1;
}

/* Star states */
.star {
  @apply relative transition-colors duration-200;
}

.star-base {
  @apply text-gray-300;
}

.star-filled {
  @apply text-yellow-400;
}

.star-half {
  @apply text-yellow-400;
  /* Half-filled effect can be achieved with CSS gradients if needed */
  background: linear-gradient(90deg, #fbbf24 50%, #d1d5db 50%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.star-empty {
  @apply text-gray-300;
}

/* Hover effects for interactive ratings */
.star:hover .star-icon {
  @apply scale-110;
}

/* Star icon styles */
.star-icon {
  @apply transition-transform duration-200;
}

/* Rating quality color coding */
.sample-rating[data-quality="poor"] .rating-text {
  @apply text-red-600;
}

.sample-rating[data-quality="fair"] .rating-text {
  @apply text-orange-600;
}

.sample-rating[data-quality="good"] .rating-text {
  @apply text-yellow-600;
}

.sample-rating[data-quality="very-good"] .rating-text {
  @apply text-blue-600;
}

.sample-rating[data-quality="excellent"] .rating-text {
  @apply text-green-600;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .rating-text {
    @apply text-gray-300;
  }
  
  .rating-label {
    @apply text-gray-400;
  }
  
  .star-base {
    @apply text-gray-600;
  }
  
  .star-empty {
    @apply text-gray-600;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .star-filled {
    @apply text-yellow-500;
  }
  
  .star-empty {
    @apply text-gray-500;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .star,
  .star-icon {
    transition: none;
  }
  
  .star:hover .star-icon {
    transform: none;
  }
}

/* Accessibility improvements */
.sample-rating[role="img"] {
  @apply cursor-help;
}

/* Focus styles for interactive elements */
.star:focus {
  @apply outline-none ring-2 ring-yellow-500 ring-offset-2 rounded;
}

/* Loading state */
.sample-rating.loading .star-icon {
  @apply animate-pulse;
}

/* Error state */
.sample-rating.error .star-icon {
  @apply text-red-400;
}

/* Tooltip support */
.sample-rating[title] {
  @apply cursor-help;
}
</style>