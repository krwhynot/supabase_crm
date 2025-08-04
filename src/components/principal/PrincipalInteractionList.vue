<!--
  PrincipalInteractionList - Principal-specific interaction listing component
  Features: Timeline view, interaction filtering, rating display, responsive design
-->
<template>
  <div class="principal-interaction-list">
    <!-- Loading State -->
    <div v-if="loading" class="animate-pulse space-y-4">
      <div v-for="i in 3" :key="i" class="flex items-start space-x-3">
        <div class="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
        <div class="flex-1 space-y-2">
          <div class="h-4 bg-gray-200 rounded w-3/4"></div>
          <div class="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="interactions.length === 0" class="text-center py-8">
      <div class="mx-auto h-12 w-12 text-gray-400 mb-4">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <h3 class="text-sm font-medium text-gray-900 mb-1">No interactions found</h3>
      <p class="text-sm text-gray-500">
        {{ principalName ? `No interactions recorded for ${principalName}` : 'No interactions to display' }}
      </p>
    </div>

    <!-- Interactions Timeline -->
    <div v-else class="flow-root">
      <ul class="-mb-8" role="list">
        <li
          v-for="(interaction, index) in interactions"
          :key="interaction.id"
          class="relative"
        >
          <!-- Timeline Line -->
          <div
            v-if="index !== interactions.length - 1"
            class="absolute left-4 top-8 -ml-px h-full w-0.5 bg-gray-200"
            aria-hidden="true"
          />

          <!-- Interaction Item -->
          <div class="relative flex items-start space-x-3 group">
            <!-- Interaction Type Icon -->
            <div
              class="relative flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white"
              :class="getInteractionTypeClasses(interaction.interaction_type)"
            >
              <component
                :is="getInteractionIcon(interaction.interaction_type)"
                class="h-4 w-4"
                aria-hidden="true"
              />
            </div>

            <!-- Interaction Content -->
            <div class="flex-1 min-w-0">
              <div class="interaction-card bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
                   @click="handleInteractionClick(interaction)"
                   role="button"
                   tabindex="0"
                   @keypress.enter="handleInteractionClick(interaction)"
                   @keypress.space.prevent="handleInteractionClick(interaction)"
              >
                <!-- Interaction Header -->
                <div class="flex items-start justify-between mb-2">
                  <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-medium text-gray-900">
                      {{ interaction.subject || getInteractionTypeLabel(interaction.interaction_type) }}
                    </h4>
                    <div class="flex items-center mt-1 space-x-3 text-xs text-gray-500">
                      <span class="flex items-center">
                        <svg class="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {{ formatDateTime(interaction.interaction_date) }}
                      </span>
                      
                      <span v-if="interaction.organization_name" class="flex items-center">
                        <svg class="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {{ interaction.organization_name }}
                      </span>
                    </div>
                  </div>

                  <!-- Rating Display -->
                  <div v-if="interaction.sample_rating" class="flex items-center ml-2 flex-shrink-0">
                    <div class="flex items-center space-x-1">
                      <svg
                        v-for="star in 5"
                        :key="star"
                        :class="[
                          'h-3 w-3',
                          star <= interaction.sample_rating 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        ]"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span class="text-xs text-gray-600 ml-1">{{ interaction.sample_rating }}/5</span>
                    </div>
                  </div>
                </div>

                <!-- Interaction Summary -->
                <div v-if="interaction.summary" class="mb-3">
                  <p class="text-sm text-gray-700 line-clamp-2">{{ interaction.summary }}</p>
                </div>

                <!-- Interaction Tags/Badges -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <!-- Interaction Type Badge -->
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          :class="getInteractionTypeBadgeClasses(interaction.interaction_type)">
                      {{ getInteractionTypeLabel(interaction.interaction_type) }}
                    </span>

                    <!-- Follow-up Badge -->
                    <span v-if="interaction.follow_up_date" 
                          class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <svg class="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Follow-up {{ formatDate(interaction.follow_up_date) }}
                    </span>
                  </div>

                  <!-- Quick Actions -->
                  <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      @click.stop="handleEdit(interaction)"
                      class="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                      :aria-label="`Edit interaction`"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </li>
      </ul>

      <!-- Load More Button -->
      <div v-if="hasMore" class="text-center pt-6">
        <button
          @click="$emit('load-more')"
          :disabled="loadingMore"
          class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <svg v-if="loadingMore" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ loadingMore ? 'Loading...' : 'Load More' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { useRouter } from 'vue-router'
import type { InteractionWithDetails } from '@/types/interactions'
import type { Enums } from '@/types/database.types'

/**
 * Component props interface
 */
interface Props {
  /** Principal ID to filter interactions */
  principalId: string
  /** Principal name for display */
  principalName?: string
  /** Loading state */
  loading?: boolean
  /** Loading more state */
  loadingMore?: boolean
  /** Whether there are more interactions to load */
  hasMore?: boolean
  /** Maximum number of interactions to display */
  limit?: number
  /** Custom interactions data (overrides API data) */
  customInteractions?: InteractionWithDetails[]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  loadingMore: false,
  hasMore: false,
  limit: 10,
  customInteractions: undefined
})

/**
 * Component emits
 */
const emit = defineEmits<{
  /** Emitted when interaction is clicked */
  interactionClick: [interaction: InteractionWithDetails]
  /** Emitted when edit is requested */
  edit: [interaction: InteractionWithDetails]
  /** Emitted when load more is requested */
  'load-more': []
}>()

// ===============================
// DEPENDENCIES
// ===============================

const router = useRouter()

// ===============================
// COMPUTED PROPERTIES
// ===============================

/**
 * Get interactions data - either from props or store
 * In a real implementation, this would fetch from interactionStore filtered by principalId
 */
const interactions = computed((): InteractionWithDetails[] => {
  if (props.customInteractions) {
    return props.customInteractions.slice(0, props.limit)
  }
  
  // Mock data for demonstration - in real implementation, 
  // this would come from the interaction store filtered by principalId
  return [
    {
      id: '1',
      interaction_type: 'phone_call',
      subject: `Follow-up call with ${props.principalName}`,
      summary: 'Discussed upcoming project requirements and timeline. Very positive response, showing strong interest in our solution.',
      interaction_date: '2024-11-15T14:30:00Z',
      sample_rating: 4,
      follow_up_date: '2024-11-20',
      organization_name: 'Sample Organization',
      organization_id: 'org-1',
      principal_id: props.principalId,
      created_at: '2024-11-15T14:35:00Z',
      updated_at: '2024-11-15T14:35:00Z'
    },
    {
      id: '2',
      interaction_type: 'email',
      subject: 'Product information request',
      summary: 'Sent detailed product specifications and pricing information as requested.',
      interaction_date: '2024-11-10T09:15:00Z',
      sample_rating: null,
      follow_up_date: null,
      organization_name: 'Another Organization',
      organization_id: 'org-2',
      principal_id: props.principalId,
      created_at: '2024-11-10T09:20:00Z',
      updated_at: '2024-11-10T09:20:00Z'
    },
    {
      id: '3',
      interaction_type: 'meeting',
      subject: 'Quarterly business review',
      summary: 'Comprehensive review of product performance and relationship status. Identified new opportunities for expansion.',
      interaction_date: '2024-11-05T11:00:00Z',
      sample_rating: 5,
      follow_up_date: null,
      organization_name: 'Sample Organization',
      organization_id: 'org-1',
      principal_id: props.principalId,
      created_at: '2024-11-05T11:30:00Z',
      updated_at: '2024-11-05T11:30:00Z'
    }
  ].filter(interaction => props.principalId) // Only show if principal is selected
})

// ===============================
// EVENT HANDLERS
// ===============================

/**
 * Handle interaction click - navigate to detail view
 */
const handleInteractionClick = (interaction: InteractionWithDetails) => {
  emit('interactionClick', interaction)
  router.push(`/interactions/${interaction.id}`)
}

/**
 * Handle edit interaction
 */
const handleEdit = (interaction: InteractionWithDetails) => {
  emit('edit', interaction)
  router.push(`/interactions/${interaction.id}/edit`)
}

// ===============================
// UTILITY FUNCTIONS
// ===============================

/**
 * Get interaction type display label
 */
const getInteractionTypeLabel = (type: Enums<'interaction_type'>): string => {
  const labels: Record<Enums<'interaction_type'>, string> = {
    'phone_call': 'Phone Call',
    'email': 'Email',
    'meeting': 'Meeting',
    'site_visit': 'Site Visit',
    'conference': 'Conference',
    'other': 'Other'
  }
  return labels[type] || type
}

/**
 * Get interaction type icon component
 */
const getInteractionIcon = (type: Enums<'interaction_type'>) => {
  const iconMap = {
    'phone_call': () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' })
    ]),
    'email': () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' })
    ]),
    'meeting': () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' })
    ]),
    'site_visit': () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' }),
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M15 11a3 3 0 11-6 0 3 3 0 016 0z' })
    ]),
    'conference': () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' })
    ]),
    'other': () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' })
    ])
  }
  return iconMap[type] || iconMap['other']
}

/**
 * Get interaction type timeline icon classes
 */
const getInteractionTypeClasses = (type: Enums<'interaction_type'>): string => {
  const classMap = {
    'phone_call': 'bg-blue-500 text-white',
    'email': 'bg-green-500 text-white',
    'meeting': 'bg-purple-500 text-white',
    'site_visit': 'bg-orange-500 text-white',
    'conference': 'bg-indigo-500 text-white',
    'other': 'bg-gray-500 text-white'
  }
  return classMap[type] || classMap['other']
}

/**
 * Get interaction type badge classes
 */
const getInteractionTypeBadgeClasses = (type: Enums<'interaction_type'>): string => {
  const classMap = {
    'phone_call': 'bg-blue-100 text-blue-800',
    'email': 'bg-green-100 text-green-800',
    'meeting': 'bg-purple-100 text-purple-800',
    'site_visit': 'bg-orange-100 text-orange-800',
    'conference': 'bg-indigo-100 text-indigo-800',
    'other': 'bg-gray-100 text-gray-800'
  }
  return classMap[type] || classMap['other']
}

/**
 * Format date for display
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  })
}

/**
 * Format date and time for display
 */
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    hour: 'numeric',
    minute: '2-digit'
  })
}
</script>

<style scoped>
/* ===============================
   COMPONENT STYLES
   =============================== */

.interaction-card {
  @apply transition-all duration-200;
}

.interaction-card:hover {
  @apply transform scale-[1.01];
}

.interaction-card:focus {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2;
}

.group:hover .opacity-0 {
  @apply opacity-100;
}

/* Text truncation utilities */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Timeline styling */
.flow-root ul {
  @apply list-none;
}

/* ===============================
   RESPONSIVE DESIGN
   =============================== */

@media (max-width: 640px) {
  .interaction-card {
    @apply p-3;
  }
  
  .interaction-card h4 {
    @apply text-xs;
  }
  
  .interaction-card .text-xs {
    @apply text-[10px];
  }
  
  /* Simplify timeline on mobile */
  .relative {
    @apply pl-0;
  }
  
  .absolute {
    @apply hidden;
  }
}

/* ===============================
   ACCESSIBILITY ENHANCEMENTS
   =============================== */

@media (prefers-reduced-motion: reduce) {
  .interaction-card {
    transition: none;
  }
  
  .interaction-card:hover {
    transform: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .interaction-card {
    @apply border-2 border-gray-400;
  }
  
  .interaction-card:hover {
    @apply border-gray-600;
  }
}
</style>