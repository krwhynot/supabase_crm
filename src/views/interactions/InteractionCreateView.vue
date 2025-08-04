<!--
  InteractionCreateView.vue
  Main view for creating new interactions
  Wrapper around InteractionFormWrapper component
-->
<template>
  <div class="interaction-create-page">
    <div class="mb-8">
      <div class="flex items-center space-x-3">
        <button
          @click="goBack"
          type="button"
          class="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon class="h-4 w-4 mr-1" />
          Back
        </button>
      </div>
      <div class="mt-4">
        <h1 class="text-2xl font-bold text-gray-900">New Interaction</h1>
        <p class="mt-1 text-sm text-gray-500">
          Record a new customer interaction or activity
        </p>
      </div>
    </div>

    <InteractionFormWrapper
      mode="create"
      @success="handleSuccess"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import InteractionFormWrapper from '@/components/interactions/InteractionFormWrapper.vue'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import type { Interaction } from '@/types/interactions'

const router = useRouter()
const route = useRoute()

const goBack = () => {
  // Go back to the referring page or interactions list
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/interactions')
  }
}

const handleSuccess = (interaction: Interaction) => {
  // Navigate to the created interaction detail page
  router.push(`/interactions/${interaction.id}`)
}

const handleCancel = () => {
  goBack()
}
</script>

<style scoped>
/* Page-specific styles */
</style>