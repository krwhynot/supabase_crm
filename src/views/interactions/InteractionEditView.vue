<template>
  <div class="max-w-7xl mx-auto">
    <!-- Page Header -->
    <div class="mb-8">
      <nav class="flex mb-4" aria-label="Breadcrumb">
        <ol role="list" class="flex items-center space-x-4">
          <li>
            <div>
              <router-link to="/" class="text-gray-400 hover:text-gray-500">
                <svg class="flex-shrink-0 h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-9 9a1 1 0 001.414 1.414L8 5.414V17a1 1 0 102 0V5.414l6.293 6.293a1 1 0 001.414-1.414l-9-9z" />
                </svg>
                <span class="sr-only">Home</span>
              </router-link>
            </div>
          </li>
          <li>
            <div class="flex items-center">
              <svg class="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
              </svg>
              <router-link to="/interactions" class="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                Interactions
              </router-link>
            </div>
          </li>
          <li>
            <div class="flex items-center">
              <svg class="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
              </svg>
              <router-link :to="`/interactions/${interactionId}`" class="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                {{ interaction?.subject || 'Interaction' }}
              </router-link>
            </div>
          </li>
          <li>
            <div class="flex items-center">
              <svg class="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
              </svg>
              <span class="ml-4 text-sm font-medium text-gray-500">Edit</span>
            </div>
          </li>
        </ol>
      </nav>

      <div class="lg:flex lg:items-center lg:justify-between">
        <div class="min-w-0 flex-1">
          <h1 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Edit Interaction
          </h1>
          <div class="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            <div class="mt-2 flex items-center text-sm text-gray-500">
              <svg class="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editing: {{ interaction?.subject || 'Loading...' }}
            </div>
          </div>
        </div>
        <div class="mt-5 flex lg:ml-4 lg:mt-0">
          <button
            @click="cancelEdit"
            type="button"
            class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="rounded-md bg-red-50 p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error loading interaction</h3>
          <div class="mt-2 text-sm text-red-700">{{ error }}</div>
        </div>
      </div>
    </div>

    <!-- Edit Form -->
    <div v-else-if="interaction" class="bg-white shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <InteractionFormWrapper
          :interaction="interaction"
          :is-editing="true"
          @submit="handleSubmit"
          @cancel="cancelEdit"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useInteractionStore } from '@/stores/interactionStore'
import InteractionFormWrapper from '@/components/interactions/InteractionFormWrapper.vue'
import type { InteractionFormData } from '@/types/interactions'

const router = useRouter()
const route = useRoute()
const interactionStore = useInteractionStore()

// Component state
const loading = ref(true)
const error = ref<string | null>(null)
const submitting = ref(false)

// Get interaction ID from route params
const interactionId = computed(() => route.params.id as string)

// Get interaction from store
const interaction = computed(() => interactionStore.selectedInteraction)

// Methods
const handleSubmit = async (formData: InteractionFormData) => {
  if (submitting.value) return

  submitting.value = true
  try {
    await interactionStore.updateInteraction(interactionId.value, formData)
    
    // Show success notification
    // TODO: Add notification system integration
    console.log('Interaction updated successfully')
    
    // Navigate back to detail view
    router.push(`/interactions/${interactionId.value}`)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to update interaction'
  } finally {
    submitting.value = false
  }
}

const cancelEdit = () => {
  router.push(`/interactions/${interactionId.value}`)
}

// Load interaction on mount
onMounted(async () => {
  try {
    await interactionStore.fetchInteractionById(interactionId.value)
    if (!interaction.value) {
      error.value = 'Interaction not found'
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load interaction'
  } finally {
    loading.value = false
  }
})
</script>