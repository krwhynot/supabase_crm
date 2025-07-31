<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-label="ariaLabel"
    :class="buttonClasses"
    @click="$emit('click', $event)"
  >
    <!-- Loading Spinner -->
    <svg
      v-if="loading"
      class="animate-spin -ml-1 mr-2 h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
    
    <!-- Icon (optional) -->
    <component
      v-if="icon && !loading"
      :is="iconComponent"
      :class="iconClasses"
    />
    
    <!-- Button Content -->
    <span v-if="$slots.default">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Enhanced ButtonVariant type with professional CRM variants
type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

// Enhanced ButtonProps interface with comprehensive options
interface Props {
  variant?: ButtonVariant
  size?: ButtonSize
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  icon?: string
  ariaLabel?: string
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  fullWidth: false
})

defineEmits<{
  click: [event: MouseEvent]
}>()

// Icon component handling (placeholder for icon system)
const iconComponent = computed(() => {
  // This would integrate with your icon system
  return props.icon ? 'div' : null
})

const iconClasses = computed(() => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5', 
    lg: 'h-6 w-6'
  }
  
  return sizeClasses[props.size]
})

const buttonClasses = computed(() => {
  // Base classes using new design system
  const base = [
    'btn-base',
    'inline-flex items-center justify-center',
    'font-medium rounded-md',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  ]

  // Variant-specific styling with enhanced design tokens
  const variants = {
    primary: [
      'border-transparent bg-primary-500 text-white',
      'hover:bg-primary-600 focus:ring-primary-500',
      'shadow-sm hover:shadow-md'
    ],
    secondary: [
      'border-gray-300 bg-white text-gray-700',
      'hover:bg-gray-50 hover:border-gray-400 focus:ring-primary-500',
      'shadow-sm'
    ],
    success: [
      'border-transparent bg-success-500 text-white',
      'hover:bg-success-600 focus:ring-success-500',
      'shadow-sm hover:shadow-md'
    ],
    danger: [
      'border-transparent bg-danger-500 text-white',
      'hover:bg-danger-600 focus:ring-danger-500',
      'shadow-sm hover:shadow-md'
    ],
    warning: [
      'border-transparent bg-warning-500 text-white',
      'hover:bg-warning-600 focus:ring-warning-500',
      'shadow-sm hover:shadow-md'
    ],
    ghost: [
      'border-transparent bg-transparent text-gray-600',
      'hover:bg-gray-100 hover:text-gray-900 focus:ring-primary-500'
    ]
  }

  // Size-specific styling with touch-friendly targets
  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[40px] min-w-[80px]',
    md: 'px-4 py-3 text-sm min-h-button min-w-button',
    lg: 'px-6 py-4 text-base min-h-[52px] min-w-[120px]'
  }

  // Full width handling
  const widthClasses = props.fullWidth ? 'w-full' : ''

  // Loading state adjustments
  const loadingClasses = props.loading ? 'cursor-wait' : ''

  return [
    ...base,
    ...variants[props.variant],
    sizes[props.size],
    widthClasses,
    loadingClasses
  ].filter(Boolean).join(' ')
})
</script>