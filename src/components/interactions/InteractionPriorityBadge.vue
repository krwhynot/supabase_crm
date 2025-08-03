<!--
  Interaction Priority Badge Component
  Displays interaction priority with appropriate colors and icons
  Follows design system patterns for consistent UI
-->

<template>
  <span
    class="priority-badge"
    :class="[
      sizeClasses,
      priorityClasses,
      { 'compact': compact }
    ]"
  >
    <component 
      :is="priorityIcon" 
      class="priority-icon"
      :class="iconSizeClasses"
    />
    <span v-if="!compact" class="priority-label">
      {{ priority }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  ExclamationTriangleIcon,
  MinusIcon,
  ChevronDownIcon
} from '@heroicons/vue/24/outline'

interface Props {
  /** Priority level to display */
  priority: 'High' | 'Medium' | 'Low'
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** Whether to show compact version (icon only) */
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  compact: false
})

// Icon mapping
const priorityIconMap = {
  'High': ExclamationTriangleIcon,
  'Medium': MinusIcon,
  'Low': ChevronDownIcon
}

const priorityIcon = computed(() => priorityIconMap[props.priority])

// Size classes
const sizeClasses = computed(() => {
  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2 text-base'
  }
  return sizes[props.size]
})

// Icon size classes
const iconSizeClasses = computed(() => {
  const sizes = {
    xs: 'h-3 w-3',
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }
  return sizes[props.size]
})

// Priority color classes
const priorityClasses = computed(() => {
  const colorMap = {
    'High': 'bg-red-100 text-red-800 border-red-200',
    'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Low': 'bg-gray-100 text-gray-800 border-gray-200'
  }
  return colorMap[props.priority]
})
</script>

<style scoped>
.priority-badge {
  @apply inline-flex items-center font-medium rounded-full border;
  @apply transition-colors duration-200;
}

.priority-icon {
  @apply flex-shrink-0;
}

.priority-label {
  @apply ml-1.5 whitespace-nowrap;
}

.compact .priority-icon {
  @apply mr-0;
}

.compact .priority-label {
  @apply hidden;
}

/* Hover effects for interactive contexts */
.priority-badge:hover {
  @apply opacity-80;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .priority-badge {
    @apply border-2;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .priority-badge {
    transition: none;
  }
}
</style>