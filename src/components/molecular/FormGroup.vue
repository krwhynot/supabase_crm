<template>
  <div class="space-y-1">
    <label
      v-if="label"
      :for="fieldId"
      class="block text-sm font-medium text-gray-700"
    >
      {{ label }}
      <span v-if="required" class="text-danger">*</span>
    </label>
    
    <div class="relative">
      <slot 
        :fieldId="fieldId"
        :hasError="!!error"
        :errorId="errorId"
      />
    </div>
    
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
  label?: string
  error?: string
  required?: boolean
}

const props = defineProps<Props>()

const fieldId = computed(() => `field-${props.name}`)
const errorId = computed(() => `error-${props.name}`)
</script>