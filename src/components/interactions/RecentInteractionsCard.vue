<!-- 
  Recent Interactions Card Component
  Dashboard component displaying recent interaction activity with navigation links
  Follows opportunity patterns for consistent dashboard integration
-->

<template>
  <div class="recent-interactions-card">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-medium text-gray-900">Recent Interactions</h3>
      <router-link 
        to="/interactions" 
        class="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
      >
        View all
      </router-link>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="animate-pulse">
        <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <div class="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-gray-200 rounded w-3/4"></div>
            <div class="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div class="w-16 h-3 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-6">
      <ExclamationTriangleIcon class="mx-auto h-8 w-8 text-red-400 mb-2" />
      <p class="text-sm text-red-600 mb-2">Failed to load recent interactions</p>
      <button 
        @click="refresh"
        class="text-xs text-red-600 hover:text-red-800 font-medium hover:underline"
      >
        Try again
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!recentInteractions || recentInteractions.length === 0" class="text-center py-8">
      <ChatBubbleLeftRightIcon class="mx-auto h-12 w-12 text-gray-400 mb-3" />
      <h4 class="text-sm font-medium text-gray-900 mb-1">No recent interactions</h4>
      <p class="text-sm text-gray-500 mb-4">
        Get started by creating your first interaction.
      </p>
      <router-link
        to="/interactions/new"
        class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <PlusIcon class="w-4 h-4 mr-1" />
        New Interaction
      </router-link>
    </div>

    <!-- Interactions List -->
    <div v-else class="space-y-3">
      <div
        v-for="interaction in recentInteractions"
        :key="interaction.id"
        class="interaction-item group cursor-pointer"
        @click="navigateToInteraction(interaction.id)"
      >
        <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
          <!-- Type Icon -->
          <div class="flex-shrink-0">
            <div 
              class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
              :class="getTypeIconClass(interaction.interaction_type)"
            >
              <component :is="getTypeIcon(interaction.interaction_type)" class="w-4 h-4" />
            </div>
          </div>

          <!-- Interaction Details -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">
                {{ interaction.subject }}
              </p>
              <div class="flex items-center space-x-2 flex-shrink-0 ml-2">
                <!-- Follow-up indicator -->
                <div 
                  v-if="interaction.follow_up_needed" 
                  class="flex items-center"
                  :class="interaction.is_overdue_follow_up ? 'text-red-600' : 'text-amber-600'"
                >
                  <ClockIcon class="w-3 h-3 mr-1" />
                  <span class="text-xs font-medium">
                    {{ interaction.is_overdue_follow_up ? 'Overdue' : 'Follow-up' }}
                  </span>
                </div>
                
                <!-- Priority indicator -->
                <div 
                  v-if="interaction.interaction_priority === 'High'"
                  class="w-2 h-2 bg-red-500 rounded-full"
                  title="High Priority"
                ></div>
              </div>
            </div>
            
            <div class="mt-1 flex items-center text-xs text-gray-500 space-x-2">
              <!-- Contact/Organization info -->
              <span v-if="interaction.contact_name" class="truncate">
                {{ interaction.contact_name }}
                <span v-if="interaction.contact_organization"> 
                  • {{ interaction.contact_organization }}
                </span>
              </span>
              <span v-else-if="interaction.opportunity_name" class="truncate">
                {{ interaction.opportunity_name }}
              </span>
              
              <!-- Date -->
              <span class="text-gray-400">•</span>
              <span>{{ formatRelativeDate(interaction.date) }}</span>
            </div>
            
            <!-- Notes preview -->
            <p 
              v-if="interaction.notes" 
              class="mt-1 text-xs text-gray-600 truncate"
            >
              {{ interaction.notes }}
            </p>
          </div>

          <!-- Navigation arrow -->
          <div class="flex-shrink-0">
            <ChevronRightIcon class="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
          </div>
        </div>
      </div>
    </div>

    <!-- Show more link if there are more interactions -->
    <div v-if="hasMoreInteractions" class="mt-4 text-center">
      <router-link
        to="/interactions"
        class="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
      >
        View {{ totalCount - recentInteractions.length }} more interactions
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useInteractionStore } from '@/stores/interactionStore'
import type { InteractionListView, InteractionType } from '@/types/interactions'
import {
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ChevronRightIcon,
  ClockIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserGroupIcon,
  PresentationChartLineIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'

// Props
interface Props {
  limit?: number
  refreshInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  limit: 5,
  refreshInterval: 0
})

// Composables
const router = useRouter()
const interactionStore = useInteractionStore()

// Local state
const refreshTimer = ref<number | null>(null)

// Computed properties
const recentInteractions = computed(() => {
  const interactions = interactionStore.interactions
  return interactions.slice(0, props.limit)
})

const totalCount = computed(() => interactionStore.totalCount)
const loading = computed(() => interactionStore.loading)
const error = computed(() => interactionStore.error)

const hasMoreInteractions = computed(() => {
  return totalCount.value > props.limit
})

// Methods
const refresh = async () => {
  try {
    await interactionStore.fetchInteractions({
      search: '',
      interaction_type: [],
      follow_up_needed: undefined,
      follow_up_overdue: false,
      date_from: '',
      date_to: '',
      opportunity_id: '',
      contact_id: ''
    }, {
      page: 1,
      limit: props.limit,
      sort_by: 'created_at',
      sort_order: 'desc'
    })
  } catch (error) {
    console.error('Failed to fetch recent interactions:', error)
  }
}

const navigateToInteraction = (interactionId: string) => {
  router.push(`/interactions/${interactionId}`)
}

const getTypeIcon = (type: InteractionType) => {
  const iconMap = {
    'EMAIL': EnvelopeIcon,
    'CALL': PhoneIcon,
    'IN_PERSON': UserGroupIcon,
    'DEMO': PresentationChartLineIcon,
    'FOLLOW_UP': ArrowPathIcon
  }
  return iconMap[type] || ChatBubbleLeftRightIcon
}

const getTypeIconClass = (type: InteractionType): string => {
  const classMap = {
    'EMAIL': 'bg-blue-500',
    'CALL': 'bg-green-500',
    'IN_PERSON': 'bg-purple-500',
    'DEMO': 'bg-orange-500',
    'FOLLOW_UP': 'bg-indigo-500'
  }
  return classMap[type] || 'bg-gray-500'
}

const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }
}

// Setup refresh interval if specified
const setupRefreshInterval = () => {
  if (props.refreshInterval > 0) {
    refreshTimer.value = window.setInterval(refresh, props.refreshInterval)
  }
}

const clearRefreshInterval = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

// Lifecycle
onMounted(async () => {
  await refresh()
  setupRefreshInterval()
})

// Cleanup
import { onUnmounted } from 'vue'
onUnmounted(() => {
  clearRefreshInterval()
})
</script>

<style scoped>
.recent-interactions-card {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 p-6;
}

.interaction-item {
  @apply transition-all duration-200;
}

.interaction-item:hover {
  @apply transform scale-[1.01];
}

/* Mobile optimizations */
@media (max-width: 640px) {
  .recent-interactions-card {
    @apply p-4;
  }
  
  .interaction-item .p-3 {
    @apply p-2;
  }
  
  .interaction-item .space-x-3 {
    @apply space-x-2;
  }
}
</style>