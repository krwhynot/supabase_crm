<!--
  Activity Status Badge - Visual indicator for principal activity levels
  Features: Color-coded status, responsive sizing, accessibility
-->
<template>
  <span 
    class="activity-status-badge inline-flex items-center font-medium rounded-full transition-colors duration-200"
    :class="[sizeClasses, colorClasses]"
  >
    <span 
      class="mr-1 rounded-full"
      :class="dotClasses"
      :aria-hidden="true"
    ></span>
    {{ statusLabel }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// ===============================  
// COMPONENT INTERFACE
// ===============================

interface Props {
  status: 'ACTIVE' | 'MODERATE' | 'LOW' | 'NO_ACTIVITY'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm',
  showLabel: true
})

// ===============================
// COMPUTED PROPERTIES
// ===============================

const statusConfig = computed(() => {
  const configs = {
    ACTIVE: {
      label: 'Active',
      colorClasses: 'bg-green-100 text-green-800 border border-green-200',
      dotClasses: 'bg-green-400'
    },
    MODERATE: {
      label: 'Moderate',
      colorClasses: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      dotClasses: 'bg-yellow-400'
    },
    LOW: {
      label: 'Low',
      colorClasses: 'bg-orange-100 text-orange-800 border border-orange-200',
      dotClasses: 'bg-orange-400'
    },
    NO_ACTIVITY: {
      label: 'Inactive',
      colorClasses: 'bg-gray-100 text-gray-800 border border-gray-200',
      dotClasses: 'bg-gray-400'
    }
  }
  return configs[props.status] || configs.NO_ACTIVITY
})

const sizeClasses = computed(() => {
  const sizeMap = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-3 py-1.5 text-sm'
  }
  return sizeMap[props.size]
})

const dotClasses = computed(() => {
  const sizeMap = {
    xs: 'h-1.5 w-1.5',
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3'
  }
  return `${sizeMap[props.size]} ${statusConfig.value.dotClasses}`
})

const colorClasses = computed(() => statusConfig.value.colorClasses)

const statusLabel = computed(() => {
  if (!props.showLabel) return ''
  return statusConfig.value.label
})
</script>

<style scoped>
.activity-status-badge {
  /* Custom styles for activity status badge */
}

/* Pulse animation for active status */
.activity-status-badge:has(.bg-green-400) {
  position: relative;
}

.activity-status-badge:has(.bg-green-400)::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0.5rem;
  transform: translateY(-50%);
  width: 0.5rem;
  height: 0.5rem;
  background-color: rgb(74, 222, 128);
  border-radius: 50%;
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%, 100% {
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }
  50% {
    opacity: 0.5;
    transform: translateY(-50%) scale(1.2);
  }
}

/* Accessibility improvements */
.activity-status-badge:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .activity-status-badge {
    border-width: 2px;
    font-weight: 600;
  }
}
</style>