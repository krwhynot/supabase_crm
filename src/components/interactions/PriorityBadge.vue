<!--
  Priority Badge Component
  Displays interaction priority with appropriate color coding
  Following opportunity patterns for consistent UI
-->

<template>
  <span class="priority-badge" :class="badgeClasses">
    <component :is="priorityIcon" class="priority-icon" />
    <span class="priority-label">{{ priority }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/vue/24/outline'

interface Props {
  /** The priority level to display */
  priority: 'High' | 'Medium' | 'Low'
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

// Icon mapping based on priority
const iconMap = {
  High: ExclamationTriangleIcon,
  Medium: ClockIcon,
  Low: CheckCircleIcon
}

const priorityIcon = computed(() => iconMap[props.priority])

// Badge styling classes
const badgeClasses = computed(() => {
  const priority = props.priority.toLowerCase()
  const size = props.size
  const compact = props.compact
  
  return [
    `badge-${priority}`,
    `badge-${size}`,
    { 'badge-compact': compact }
  ]
})
</script>

<style scoped>
/* Base badge styles */
.priority-badge {
  @apply inline-flex items-center rounded-full font-medium;
  @apply transition-colors duration-200;
}

.priority-icon {
  @apply flex-shrink-0;
}

.priority-label {
  @apply truncate;
}

/* Size variants */
.badge-xs {
  @apply px-2 py-0.5 text-xs gap-1;
}

.badge-xs .priority-icon {
  @apply h-3 w-3;
}

.badge-sm {
  @apply px-2.5 py-1 text-xs gap-1.5;
}

.badge-sm .priority-icon {
  @apply h-3.5 w-3.5;
}

.badge-md {
  @apply px-3 py-1.5 text-sm gap-2;
}

.badge-md .priority-icon {
  @apply h-4 w-4;
}

.badge-lg {
  @apply px-4 py-2 text-base gap-2;
}

.badge-lg .priority-icon {
  @apply h-5 w-5;
}

/* Compact variant */
.badge-compact {
  @apply px-1.5 py-0.5 gap-1;
}

/* Priority color variants */
.badge-high {
  @apply bg-red-100 text-red-800 border border-red-200;
}

.badge-medium {
  @apply bg-yellow-100 text-yellow-800 border border-yellow-200;
}

.badge-low {
  @apply bg-green-100 text-green-800 border border-green-200;
}

/* Hover effects */
.priority-badge:hover {
  transform: translateY(-1px);
}

.badge-high:hover {
  @apply bg-red-200;
}

.badge-medium:hover {
  @apply bg-yellow-200;
}

.badge-low:hover {
  @apply bg-green-200;
}

/* Pulse animation for high priority */
.badge-high {
  animation: pulse-red 2s infinite;
}

@keyframes pulse-red {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .badge-high {
    @apply bg-red-900 text-red-200 border-red-700;
  }
  
  .badge-medium {
    @apply bg-yellow-900 text-yellow-200 border-yellow-700;
  }
  
  .badge-low {
    @apply bg-green-900 text-green-200 border-green-700;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .priority-badge {
    @apply border-2;
  }
  
  .badge-high {
    @apply border-red-600;
  }
  
  .badge-medium {
    @apply border-yellow-600;
  }
  
  .badge-low {
    @apply border-green-600;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .priority-badge {
    transition: none;
  }
  
  .priority-badge:hover {
    transform: none;
  }
  
  .badge-high {
    animation: none;
  }
}

/* Accessibility improvements */
.priority-badge[aria-label] {
  @apply cursor-help;
}

/* Focus styles for interactive badges */
.priority-badge:focus {
  @apply outline-none ring-2 ring-offset-2;
}

.badge-high:focus {
  @apply ring-red-500;
}

.badge-medium:focus {
  @apply ring-yellow-500;
}

.badge-low:focus {
  @apply ring-green-500;
}
</style>