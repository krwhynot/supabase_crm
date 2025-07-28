<template>
  <button
    :type="type"
    :disabled="disabled"
    :aria-label="ariaLabel"
    :class="buttonClasses"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// ButtonVariant type: 'primary' | 'secondary'
type ButtonVariant = 'primary' | 'secondary'

// Basic ButtonProps interface
interface Props {
  variant?: ButtonVariant
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  type: 'button',
  disabled: false,
})

defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClasses = computed(() => {
  const base = 'inline-flex items-center justify-center px-4 py-2 border text-sm font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'border-transparent bg-primary text-white hover:bg-primary-dark focus:ring-primary',
    secondary: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary'
  }
  
  return `${base} ${variants[props.variant]}`
})
</script>