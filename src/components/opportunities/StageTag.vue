<template>
  <span
    :class="stageClasses"
    :aria-label="`Opportunity stage: ${stage}`"
    role="status"
  >
    <!-- Stage indicator dot -->
    <span
      :class="dotClasses"
      aria-hidden="true"
    />
    
    <!-- Stage text -->
    <span class="stage-text">
      {{ displayText }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OpportunityStage, STAGE_COLORS } from '@/types/opportunities'

/**
 * Props interface for StageTag component
 */
interface Props {
  /** The opportunity stage to display */
  stage: OpportunityStage
  /** Size variant of the tag */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to show the indicator dot */
  showDot?: boolean
  /** Custom display text (optional) */
  customText?: string
  /** Whether to use compact display */
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showDot: true,
  compact: false
})

/**
 * Component emits - none needed for display component
 */
defineEmits<{
  /** Emitted when the stage tag is clicked */
  click: [stage: OpportunityStage]
}>()

// ===============================
// COMPUTED PROPERTIES
// ===============================

/**
 * Get the display text for the stage
 */
const displayText = computed(() => {
  if (props.customText) {
    return props.customText
  }
  
  if (props.compact) {
    // Shortened versions for compact display
    const compactMap: Record<OpportunityStage, string> = {
      [OpportunityStage.NEW_LEAD]: 'New',
      [OpportunityStage.INITIAL_OUTREACH]: 'Outreach',
      [OpportunityStage.SAMPLE_VISIT_OFFERED]: 'Sample',
      [OpportunityStage.AWAITING_RESPONSE]: 'Awaiting',
      [OpportunityStage.FEEDBACK_LOGGED]: 'Feedback',
      [OpportunityStage.DEMO_SCHEDULED]: 'Demo',
      [OpportunityStage.CLOSED_WON]: 'Won'
    }
    return compactMap[props.stage]
  }
  
  return props.stage
})

/**
 * Get the color theme for the stage
 */
const stageColor = computed(() => STAGE_COLORS[props.stage])

/**
 * Computed classes for the stage tag
 */
const stageClasses = computed(() => {
  const baseClasses = [
    'stage-tag',
    'inline-flex items-center',
    'font-medium rounded-full',
    'border transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2'
  ]
  
  // Size-specific classes
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs min-h-[24px]',
    md: 'px-3 py-1.5 text-sm min-h-[32px]',
    lg: 'px-4 py-2 text-base min-h-[40px]'
  }
  
  // Color-specific classes based on stage
  const colorClasses: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 focus:ring-gray-500',
    blue: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 focus:ring-blue-500',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 focus:ring-yellow-500',
    orange: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 focus:ring-orange-500',
    purple: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 focus:ring-purple-500',
    green: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 focus:ring-green-500',
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200 focus:ring-emerald-500'
  }
  
  return [
    ...baseClasses,
    sizeClasses[props.size],
    colorClasses[stageColor.value] || colorClasses.gray
  ].join(' ')
})

/**
 * Computed classes for the indicator dot
 */
const dotClasses = computed(() => {
  if (!props.showDot) return ''
  
  const baseClasses = [
    'stage-dot',
    'inline-block rounded-full mr-1.5 flex-shrink-0'
  ]
  
  // Size-specific dot classes
  const dotSizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  }
  
  // Color-specific dot classes
  const dotColorClasses: Record<string, string> = {
    gray: 'bg-gray-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    emerald: 'bg-emerald-500'
  }
  
  return [
    ...baseClasses,
    dotSizeClasses[props.size],
    dotColorClasses[stageColor.value] || dotColorClasses.gray
  ].join(' ')
})
</script>

<style scoped>
/* ===============================
   STAGE TAG COMPONENT STYLES
   =============================== */

.stage-tag {
  @apply cursor-default;
  @apply max-w-full;
  @apply touch-manipulation; /* iPad optimization */
}

.stage-tag:hover {
  @apply shadow-sm;
}

.stage-text {
  @apply truncate;
  @apply min-w-0 flex-1;
}

.stage-dot {
  @apply flex-shrink-0;
}

/* ===============================
   INTERACTIVE STYLES
   =============================== */

.stage-tag:focus {
  @apply ring-2 ring-offset-2;
}

.stage-tag:focus-visible {
  @apply ring-2 ring-offset-2;
}

/* ===============================
   RESPONSIVE DESIGN
   =============================== */

/* iPad Portrait Optimization */
@media (min-width: 768px) and (max-width: 1024px) {
  .stage-tag {
    @apply min-h-[36px];
    @apply px-3 py-2;
  }
}

/* Mobile Optimization */
@media (max-width: 767px) {
  .stage-tag {
    @apply text-xs;
    @apply min-h-[28px];
    @apply px-2 py-1;
  }
  
  .stage-dot {
    @apply w-1.5 h-1.5 mr-1;
  }
}

/* ===============================
   ACCESSIBILITY ENHANCEMENTS
   =============================== */

/* High contrast mode support */
@media (prefers-contrast: high) {
  .stage-tag {
    @apply border-2;
  }
  
  /* Enhanced contrast for each color variant */
  .stage-tag.bg-gray-100 {
    @apply bg-gray-200 text-gray-900 border-gray-400;
  }
  
  .stage-tag.bg-blue-100 {
    @apply bg-blue-200 text-blue-900 border-blue-400;
  }
  
  .stage-tag.bg-yellow-100 {
    @apply bg-yellow-200 text-yellow-900 border-yellow-400;
  }
  
  .stage-tag.bg-orange-100 {
    @apply bg-orange-200 text-orange-900 border-orange-400;
  }
  
  .stage-tag.bg-purple-100 {
    @apply bg-purple-200 text-purple-900 border-purple-400;
  }
  
  .stage-tag.bg-green-100 {
    @apply bg-green-200 text-green-900 border-green-400;
  }
  
  .stage-tag.bg-emerald-100 {
    @apply bg-emerald-200 text-emerald-900 border-emerald-400;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .stage-tag {
    transition: none;
  }
}

/* ===============================
   PRINT STYLES
   =============================== */

@media print {
  .stage-tag {
    @apply bg-white text-black border-black;
  }
  
  .stage-dot {
    @apply bg-black;
  }
}

/* ===============================
   DARK MODE SUPPORT (Future)
   =============================== */

@media (prefers-color-scheme: dark) {
  .stage-tag {
    /* Dark mode styles would go here when implemented */
  }
}
</style>