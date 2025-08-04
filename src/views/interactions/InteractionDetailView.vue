<!--
  InteractionDetailView.vue
  Main view for interaction detail page
  Wrapper around InteractionDetailView component with navigation
-->
<template>
  <div class="interaction-detail-page">
    <div class="mb-6">
      <div class="flex items-center space-x-3">
        <button
          @click="goBack"
          type="button"
          class="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon class="h-4 w-4 mr-1" />
          Back to Interactions
        </button>
      </div>
    </div>

    <InteractionDetailView
      :interaction-id="interactionId"
    />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import InteractionDetailView from '@/components/interactions/InteractionDetailView.vue'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

interface Props {
  id: string
}

const props = defineProps<Props>()

const router = useRouter()

// Use the id prop as interactionId
const interactionId = props.id

const goBack = () => {
  // Go back to interactions list or previous page
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/interactions')
  }
}
</script>

<style scoped>
/* Page-specific styles */
</style>