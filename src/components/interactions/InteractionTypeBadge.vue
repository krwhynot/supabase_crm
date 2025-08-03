<!--
  Interaction Type Badge Component
  Displays interaction type with icon and color coding
  Following opportunity patterns for consistent UI
-->

<template>
  <span class="interaction-type-badge" :class="badgeClasses">
    <component :is="typeIcon" class="type-icon" />
    <span class="type-label">{{ typeConfig.label }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { InteractionType } from '@/types/interactions'
import { INTERACTION_TYPE_CONFIG } from '@/types/interactions'
import {
  EnvelopeIcon,
  PhoneIcon,
  UsersIcon,
  PresentationChartLineIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'

interface Props {
  /** The interaction type to display */
  type: InteractionType
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** Whether to show icon */
  showIcon?: boolean
  /** Whether to show label */
  showLabel?: boolean
  /** Compact mode with minimal padding */
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm',
  showIcon: true,
  showLabel: true,
  compact: false
})

// Type configuration
const typeConfig = computed(() => INTERACTION_TYPE_CONFIG[props.type])

// Icon mapping
const iconMap = {
  EMAIL: EnvelopeIcon,
  CALL: PhoneIcon,
  IN_PERSON: UsersIcon,
  DEMO: PresentationChartLineIcon,
  FOLLOW_UP: ArrowPathIcon
}

const typeIcon = computed(() => iconMap[props.type])

// Badge styling classes
const badgeClasses = computed(() => {
  const color = typeConfig.value.color
  const size = props.size
  const compact = props.compact
  
  return [
    `badge-${color}`,
    `badge-${size}`,
    { 'badge-compact': compact }
  ]
})
</script>

<style scoped>
/* Base badge styles */
.interaction-type-badge {
  @apply inline-flex items-center rounded-full font-medium;
  @apply transition-colors duration-200;
}

.type-icon {
  @apply flex-shrink-0;
}

.type-label {
  @apply truncate;
}

/* Size variants */
.badge-xs {
  @apply px-2 py-0.5 text-xs gap-1;
}

.badge-xs .type-icon {
  @apply h-3 w-3;
}

.badge-sm {
  @apply px-2.5 py-1 text-xs gap-1.5;
}

.badge-sm .type-icon {
  @apply h-3.5 w-3.5;
}

.badge-md {
  @apply px-3 py-1.5 text-sm gap-2;
}

.badge-md .type-icon {
  @apply h-4 w-4;
}

.badge-lg {
  @apply px-4 py-2 text-base gap-2;
}

.badge-lg .type-icon {
  @apply h-5 w-5;
}

/* Compact variant */
.badge-compact {
  @apply px-1.5 py-0.5 gap-1;
}

/* Color variants */
.badge-blue {
  @apply bg-blue-100 text-blue-800 border border-blue-200;
}

.badge-green {
  @apply bg-green-100 text-green-800 border border-green-200;
}

.badge-purple {
  @apply bg-purple-100 text-purple-800 border border-purple-200;
}

.badge-orange {
  @apply bg-orange-100 text-orange-800 border border-orange-200;
}

.badge-indigo {
  @apply bg-indigo-100 text-indigo-800 border border-indigo-200;
}

/* Hover effects */
.interaction-type-badge:hover {
  transform: translateY(-1px);
}

.badge-blue:hover {
  @apply bg-blue-200;
}

.badge-green:hover {
  @apply bg-green-200;
}

.badge-purple:hover {
  @apply bg-purple-200;
}

.badge-orange:hover {
  @apply bg-orange-200;
}

.badge-indigo:hover {
  @apply bg-indigo-200;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .badge-blue {
    @apply bg-blue-900 text-blue-200 border-blue-700;
  }
  
  .badge-green {
    @apply bg-green-900 text-green-200 border-green-700;
  }
  
  .badge-purple {
    @apply bg-purple-900 text-purple-200 border-purple-700;
  }
  
  .badge-orange {
    @apply bg-orange-900 text-orange-200 border-orange-700;
  }
  
  .badge-indigo {
    @apply bg-indigo-900 text-indigo-200 border-indigo-700;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .interaction-type-badge {
    @apply border-2;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .interaction-type-badge {
    transition: none;
  }
  
  .interaction-type-badge:hover {
    transform: none;
  }
}
</style>