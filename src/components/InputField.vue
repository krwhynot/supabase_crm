<template>
  <div class="space-y-1">
    <label
      :for="inputId"
      class="block text-sm font-medium text-gray-700"
    >
      {{ label }}
    </label>
    <input
      :id="inputId"
      :type="type"
      :placeholder="placeholder"
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @blur="$emit('blur')"
      :aria-describedby="error ? errorId : undefined"
      :aria-invalid="error ? 'true' : 'false'"
      :class="inputClasses"
    />
    <p
      v-if="error"
      :id="errorId"
      role="alert"
      class="text-sm text-danger"
    >
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  name: string
  label: string
  type?: 'text' | 'email' | 'password'
  modelValue: string | number
  error?: string
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
})

defineEmits<{
  'update:modelValue': [value: string | number]
  'blur': []
}>()

const inputId = computed(() => `input-${props.name}`)
const errorId = computed(() => `error-${props.name}`)

const inputClasses = computed(() => {
  const base = 'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition duration-200'
  const errorClasses = 'border-danger focus:ring-danger'
  const normalClasses = 'border-gray-300 focus:ring-primary'
  
  return `${base} ${props.error ? errorClasses : normalClasses}`
})
</script>