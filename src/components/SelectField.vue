<template>
  <div class="space-y-1">
    <label
      :for="selectId"
      class="block text-sm font-medium text-gray-700"
    >
      {{ label }}
    </label>
    <select
      :id="selectId"
      :value="modelValue"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      @blur="$emit('blur')"
      :aria-describedby="error ? errorId : undefined"
      :aria-invalid="error ? 'true' : 'false'"
      :class="selectClasses"
    >
      <option value="">{{ placeholder }}</option>
      <option 
        v-for="option in options" 
        :key="option" 
        :value="option"
      >
        {{ option }}
      </option>
    </select>
    <p
      v-if="error"
      :id="errorId"
      role="alert"
      class="text-sm text-red-600"
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
  options: string[]
  modelValue: string
  error?: string
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select an option',
})

defineEmits<{
  'update:modelValue': [value: string]
  'blur': []
}>()

const selectId = computed(() => `select-${props.name}`)
const errorId = computed(() => `error-${props.name}`)

const selectClasses = computed(() => {
  const base = 'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition duration-200'
  const errorClasses = 'border-red-500 focus:ring-red-500'
  const normalClasses = 'border-gray-300 focus:ring-blue-500'
  
  return `${base} ${props.error ? errorClasses : normalClasses}`
})
</script>