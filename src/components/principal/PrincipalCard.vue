<!--
  PrincipalCard - Individual principal card component optimized for touch interactions
  
  Features:
  - Touch-friendly card design with 44px minimum touch targets
  - Engagement score visualization with color coding
  - Activity status indicators with clear visual hierarchy
  - Quick action buttons for common workflows
  - Responsive layout that works on all screen sizes
-->
<template>
  <div 
    class="principal-card bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
    @click="handleCardClick"
    @keydown.enter="handleCardClick"
    @keydown.space.prevent="handleCardClick"
    role="button"
    tabindex="0"
    :aria-label="`View details for ${principal.principal_name}`"
  >
    <!-- Header with Principal Name and Status -->
    <div class="flex items-start justify-between mb-3">
      <div class="flex-1 min-w-0">
        <h3 class="text-lg font-semibold text-gray-900 truncate">
          {{ principal.principal_name }}
        </h3>
        <p class="text-sm text-gray-600 truncate">
          {{ principal.principal_name }}
        </p>
        <p v-if="principal.organization_type" class="text-xs text-gray-500 uppercase tracking-wide">
          {{ principal.organization_type }}
        </p>
      </div>
      
      <!-- Activity Status Badge -->
      <ActivityStatusBadge 
        :status="mapActivityStatus(principal.activity_status)" 
        size="sm"
        class="flex-shrink-0"
      />
    </div>

    <!-- Engagement Score Ring -->
    <div class="flex items-center justify-center mb-4">
      <EngagementScoreRing 
        :score="principal.engagement_score || 0"
        size="lg"
      />
    </div>

    <!-- Key Metrics Grid -->
    <div class="grid grid-cols-2 gap-3 mb-4">
      <div class="text-center">
        <div class="text-lg font-semibold text-gray-900">
          {{ principal.total_interactions || 0 }}
        </div>
        <div class="text-xs text-gray-500">Interactions</div>
      </div>
      
      <div class="text-center">
        <div class="text-lg font-semibold text-gray-900">
          {{ principal.active_opportunities || 0 }}
        </div>
        <div class="text-xs text-gray-500">Opportunities</div>
      </div>
      
      <div class="text-center">
        <div class="text-lg font-semibold text-gray-900">
          {{ principal.product_count || 0 }}
        </div>
        <div class="text-xs text-gray-500">Products</div>
      </div>
      
      <div class="text-center">
        <div class="text-lg font-semibold text-gray-900">
          {{ formatDaysAgo(principal.last_activity_date) }}
        </div>
        <div class="text-xs text-gray-500">Last Activity</div>
      </div>
    </div>

    <!-- Follow-up Indicator -->
    <div v-if="principal.follow_ups_required && principal.follow_ups_required > 0" class="mb-4">
      <div class="flex items-center space-x-2 p-2 bg-amber-50 rounded-md border border-amber-200">
        <svg class="h-4 w-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-amber-800">
            {{ principal.follow_ups_required }} Follow-up{{ principal.follow_ups_required > 1 ? 's' : '' }} Required
          </p>
          <p v-if="principal.next_follow_up_date" class="text-xs text-amber-700">
            Next: {{ formatDate(principal.next_follow_up_date) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="grid grid-cols-2 gap-2">
      <button
        @click.stop="handleCreateOpportunity"
        class="inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 min-h-[36px]"
        :aria-label="`Create opportunity for ${principal.principal_name}`"
      >
        <svg class="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Opportunity
      </button>
      
      <button
        @click.stop="handleLogInteraction"
        class="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 min-h-[36px]"
        :aria-label="`Log interaction for ${principal.principal_name}`"
      >
        <svg class="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Interaction
      </button>
    </div>

    <!-- Hover/Focus States -->
    <div class="absolute inset-0 rounded-lg bg-blue-50 opacity-0 hover:opacity-10 focus:opacity-10 transition-opacity duration-200 pointer-events-none"></div>
  </div>
</template>

<script setup lang="ts">
// Vue imports (computed removed as unused)
import type { PrincipalActivitySummary } from '@/services/principalActivityApi'
import ActivityStatusBadge from './ActivityStatusBadge.vue'
import EngagementScoreRing from './EngagementScoreRing.vue'

// ===============================
// PROPS & EMITS
// ===============================

interface Props {
  principal: PrincipalActivitySummary
}

interface Emits {
  (e: 'click', principal: PrincipalActivitySummary): void
  (e: 'create-opportunity', principal: PrincipalActivitySummary): void
  (e: 'log-interaction', principal: PrincipalActivitySummary): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// ===============================
// COMPUTED PROPERTIES
// ===============================

const formatDaysAgo = (dateString: string | null): string => {
  if (!dateString) return 'Never'
  
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return '1 day ago'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  
  return `${Math.floor(diffDays / 365)} years ago`
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

// ===============================
// UTILITY FUNCTIONS
// ===============================

const mapActivityStatus = (status: 'NO_ACTIVITY' | 'STALE' | 'MODERATE' | 'ACTIVE'): 'NO_ACTIVITY' | 'MODERATE' | 'ACTIVE' | 'LOW' => {
  switch (status) {
    case 'NO_ACTIVITY':
      return 'NO_ACTIVITY'
    case 'STALE':
      return 'LOW'
    case 'MODERATE':
      return 'MODERATE'
    case 'ACTIVE':
      return 'ACTIVE'
    default:
      return 'LOW'
  }
}

// ===============================
// EVENT HANDLERS
// ===============================

const handleCardClick = () => {
  emit('click', props.principal)
}

const handleCreateOpportunity = () => {
  emit('create-opportunity', props.principal)
}

const handleLogInteraction = () => {
  emit('log-interaction', props.principal)
}
</script>

<style scoped>
.principal-card {
  /* Ensure card doesn't shrink below minimum touch target */
  min-height: 280px;
  position: relative;
}

/* Touch target enhancements */
.principal-card button {
  min-height: 36px;
  min-width: 36px;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .principal-card {
    min-height: 260px;
  }
  
  .grid-cols-2 {
    gap: 0.5rem;
  }
}

/* Focus and hover enhancements for accessibility */
.principal-card:focus {
  outline: none;
}

.principal-card:focus-visible {
  @apply ring-2 ring-blue-500 ring-offset-2;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .principal-card {
    @apply border-2 border-gray-800;
  }
  
  .bg-blue-600 {
    @apply bg-gray-900;
  }
  
  .text-gray-500 {
    @apply text-gray-900;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .principal-card,
  .principal-card button {
    transition: none !important;
  }
}
</style>