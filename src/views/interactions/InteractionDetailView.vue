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
              <span class="ml-4 text-sm font-medium text-gray-500">
                {{ interaction?.subject || 'Interaction Details' }}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      <div class="lg:flex lg:items-center lg:justify-between">
        <div class="min-w-0 flex-1">
          <h1 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {{ interaction?.subject || 'Loading...' }}
          </h1>
          <div class="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            <div class="mt-2 flex items-center text-sm text-gray-500">
              <svg class="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {{ formatInteractionType(interaction?.type) }}
            </div>
            <div class="mt-2 flex items-center text-sm text-gray-500">
              <svg class="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {{ formatDate(interaction?.interaction_date) }}
            </div>
            <div v-if="interaction?.organization" class="mt-2 flex items-center text-sm text-gray-500">
              <svg class="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {{ interaction.organization.name }}
            </div>
          </div>
        </div>
        <div class="mt-5 flex lg:ml-4 lg:mt-0">
          <button
            @click="editInteraction"
            type="button"
            class="sm:ml-3 inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            <svg class="-ml-0.5 mr-1.5 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
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

    <!-- Main Content -->
    <div v-else-if="interaction" class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Main Information -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Interaction Details Card -->
        <div class="bg-white shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Interaction Details</h3>
            
            <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt class="text-sm font-medium text-gray-500">Type</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  <span :class="getTypeColor(interaction.type)" 
                        class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
                    {{ formatInteractionType(interaction.type) }}
                  </span>
                </dd>
              </div>
              
              <div>
                <dt class="text-sm font-medium text-gray-500">Date & Time</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ formatDateTime(interaction.interaction_date) }}</dd>
              </div>
              
              <div v-if="interaction.rating">
                <dt class="text-sm font-medium text-gray-500">Rating</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  <div class="flex items-center">
                    <div class="flex space-x-1">
                      <svg v-for="star in 5" :key="star" 
                           :class="star <= interaction.rating ? 'text-yellow-400' : 'text-gray-300'"
                           class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <span class="ml-2 text-sm text-gray-500">({{ interaction.rating }}/5)</span>
                  </div>
                </dd>
              </div>
              
              <div class="sm:col-span-2" v-if="interaction.notes">
                <dt class="text-sm font-medium text-gray-500">Notes</dt>
                <dd class="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{{ interaction.notes }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Follow-up Section -->
        <div v-if="interaction.follow_up_required" class="bg-white shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Follow-up Required</h3>
            
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <svg class="h-8 w-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">
                  Follow-up scheduled for {{ formatDate(interaction.follow_up_date) }}
                </p>
                <p class="text-sm text-gray-500">
                  Ensure timely follow-up to maintain engagement
                </p>
              </div>
            </div>

            <div class="mt-4">
              <button
                @click="createFollowupInteraction"
                type="button"
                class="inline-flex items-center rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"
              >
                <svg class="-ml-0.5 mr-1.5 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Follow-up Interaction
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Related Opportunity -->
        <div v-if="interaction.opportunity" class="bg-white shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Related Opportunity</h3>
            
            <div class="space-y-3">
              <div>
                <router-link :to="`/opportunities/${interaction.opportunity.id}`" 
                            class="text-primary-600 hover:text-primary-700 font-medium">
                  {{ interaction.opportunity.name }}
                </router-link>
              </div>
              
              <div class="text-sm text-gray-500">
                <div class="flex items-center justify-between">
                  <span>Stage:</span>
                  <span :class="getStageColor(interaction.opportunity.stage)" 
                        class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
                    {{ formatOpportunityStage(interaction.opportunity.stage) }}
                  </span>
                </div>
              </div>
              
              <div v-if="interaction.opportunity.probability_percent" class="text-sm text-gray-500">
                <div class="flex items-center justify-between">
                  <span>Probability:</span>
                  <span>{{ interaction.opportunity.probability_percent }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Activity Timeline -->
        <div class="bg-white shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Activity Timeline</h3>
            
            <div class="flow-root">
              <ul role="list" class="-mb-8">
                <li>
                  <div class="relative pb-8">
                    <div class="relative flex space-x-3">
                      <div>
                        <span class="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </span>
                      </div>
                      <div class="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div>
                          <p class="text-sm text-gray-500">
                            Interaction logged 
                            <span class="font-medium text-gray-900">{{ interaction.subject }}</span>
                          </p>
                        </div>
                        <div class="whitespace-nowrap text-right text-sm text-gray-500">
                          {{ formatRelativeTime(interaction.created_at) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useInteractionStore } from '@/stores/interactionStore'
import type { Interaction } from '@/types/interactions'

const router = useRouter()
const route = useRoute()
const interactionStore = useInteractionStore()

// Component state
const loading = ref(true)
const error = ref<string | null>(null)

// Get interaction ID from route params
const interactionId = computed(() => route.params.id as string)

// Get interaction from store
const interaction = computed(() => interactionStore.selectedInteraction)

// Methods
const editInteraction = () => {
  router.push(`/interactions/${interactionId.value}/edit`)
}

const createFollowupInteraction = () => {
  router.push({
    name: 'InteractionCreateFromOpportunity',
    params: { opportunityId: interaction.value?.opportunity?.id },
    query: { followUp: 'true', previousInteraction: interactionId.value }
  })
}

// Formatting helpers
const formatInteractionType = (type: string) => {
  const types: Record<string, string> = {
    EMAIL: 'Email',
    CALL: 'Phone Call',
    IN_PERSON: 'In-Person Meeting',
    DEMO: 'Product Demo',
    FOLLOW_UP: 'Follow-up',
    SAMPLE_DELIVERY: 'Sample Delivery'
  }
  return types[type] || type
}

const formatOpportunityStage = (stage: string) => {
  const stages: Record<string, string> = {
    NEW_LEAD: 'New Lead',
    INITIAL_OUTREACH: 'Initial Outreach',
    SAMPLE_VISIT_OFFERED: 'Sample Visit Offered',
    AWAITING_RESPONSE: 'Awaiting Response',
    FEEDBACK_LOGGED: 'Feedback Logged',
    DEMO_SCHEDULED: 'Demo Scheduled',
    CLOSED_WON: 'Closed Won'
  }
  return stages[stage] || stage
}

const formatDate = (date: string | Date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatDateTime = (date: string | Date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const formatRelativeTime = (date: string | Date) => {
  if (!date) return ''
  const now = new Date()
  const then = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  return `${Math.floor(diffInSeconds / 86400)} days ago`
}

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    EMAIL: 'bg-blue-100 text-blue-800',
    CALL: 'bg-green-100 text-green-800',
    IN_PERSON: 'bg-purple-100 text-purple-800',
    DEMO: 'bg-yellow-100 text-yellow-800',
    FOLLOW_UP: 'bg-orange-100 text-orange-800',
    SAMPLE_DELIVERY: 'bg-pink-100 text-pink-800'
  }
  return colors[type] || 'bg-gray-100 text-gray-800'
}

const getStageColor = (stage: string) => {
  const colors: Record<string, string> = {
    NEW_LEAD: 'bg-blue-100 text-blue-800',
    INITIAL_OUTREACH: 'bg-yellow-100 text-yellow-800',
    SAMPLE_VISIT_OFFERED: 'bg-orange-100 text-orange-800',
    AWAITING_RESPONSE: 'bg-purple-100 text-purple-800',
    FEEDBACK_LOGGED: 'bg-indigo-100 text-indigo-800',
    DEMO_SCHEDULED: 'bg-pink-100 text-pink-800',
    CLOSED_WON: 'bg-green-100 text-green-800'
  }
  return colors[stage] || 'bg-gray-100 text-gray-800'
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