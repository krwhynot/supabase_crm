<!--
  InteractionEditView.vue
  Main view for editing interactions
  Wrapper around InteractionFormWrapper component in edit mode
-->
<template>
  <div class="interaction-edit-page">
    <div class="mb-8">
      <div class="flex items-center space-x-3">
        <button
          @click="goBack"
          type="button"
          class="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon class="h-4 w-4 mr-1" />
          Back to Interaction
        </button>
      </div>
      <div class="mt-4">
        <h1 class="text-2xl font-bold text-gray-900">Edit Interaction</h1>
        <p class="mt-1 text-sm text-gray-500">
          Modify interaction details and information
        </p>
      </div>
    </div>

    <InteractionFormWrapper
      mode="edit"
      :interaction-id="interactionId"
      @success="handleSuccess"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import InteractionFormWrapper from '@/components/interactions/InteractionFormWrapper.vue'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import type { Interaction } from '@/types/interactions'

interface Props {
  id: string
}

const props = defineProps<Props>()

const router = useRouter()

// Use the id prop as interactionId
const interactionId = props.id

const goBack = () => {
  // Go back to the interaction detail page
  router.push(`/interactions/${interactionId}`)
}

const handleSuccess = (interaction: Interaction) => {
  // Navigate to the updated interaction detail page
  router.push(`/interactions/${interaction.id}`)
}

const handleCancel = () => {
  goBack()
}
</script>

<style scoped>
/* Page-specific styles */
</style>