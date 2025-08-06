<!--
  PrincipalOpportunityList - Principal-specific opportunity listing component
  Features: Filtered opportunities, stage tracking, quick actions, responsive design
-->
<template>
  <div class="principal-opportunity-list">
    <!-- Loading State -->
    <div v-if="loading" class="animate-pulse space-y-4">
      <div v-for="i in 3" :key="i" class="bg-gray-200 h-16 rounded-lg"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="opportunities.length === 0" class="text-center py-8">
      <div class="mx-auto h-12 w-12 text-gray-400 mb-4">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 class="text-sm font-medium text-gray-900 mb-1">No opportunities found</h3>
      <p class="text-sm text-gray-500">
        {{ principalName ? `No opportunities for ${principalName}` : 'No opportunities to display' }}
      </p>
    </div>

    <!-- Opportunities List -->
    <div v-else class="space-y-3">
      <div
        v-for="opportunity in opportunities"
        :key="opportunity.id"
        class="opportunity-card bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
        @click="handleOpportunityClick(opportunity)"
        role="button"
        tabindex="0"
        @keypress.enter="handleOpportunityClick(opportunity)"
        @keypress.space.prevent="handleOpportunityClick(opportunity)"
      >
        <!-- Opportunity Header -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-medium text-gray-900 truncate">
              {{ opportunity.name }}
            </h4>
            <div class="flex items-center mt-1 space-x-3 text-xs text-gray-500">
              <span v-if="opportunity.organization_name" class="flex items-center">
                <svg class="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {{ opportunity.organization_name }}
              </span>
              <span v-if="opportunity.expected_close_date" class="flex items-center">
                <svg class="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {{ formatDate(opportunity.expected_close_date) }}
              </span>
            </div>
          </div>
          
          <!-- Stage Badge -->
          <StageTag 
            :stage="opportunity.stage" 
            size="sm"
            class="ml-2 flex-shrink-0"
          />
        </div>

        <!-- Opportunity Details -->
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4 text-sm text-gray-600">
            <!-- Probability -->
            <div v-if="opportunity.probability_percent !== null" class="flex items-center">
              <ProbabilityBar 
                :percentage="opportunity.probability_percent" 
                size="sm"
                class="mr-2"
              />
              <span class="text-xs">{{ opportunity.probability_percent }}%</span>
            </div>
            
            <!-- Product -->
            <span v-if="opportunity.product_name" class="text-xs text-gray-500 truncate max-w-32">
              {{ opportunity.product_name }}
            </span>
          </div>

          <!-- Quick Actions -->
          <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              @click.stop="handleEdit(opportunity)"
              class="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              :aria-label="`Edit ${opportunity.name}`"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            
            <button
              @click.stop="handleDelete(opportunity)"
              class="p-1 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
              :aria-label="`Delete ${opportunity.name}`"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Notes Preview -->
        <div v-if="opportunity.notes" class="mt-3 pt-3 border-t border-gray-100">
          <p class="text-xs text-gray-600 line-clamp-2">{{ opportunity.notes }}</p>
        </div>
      </div>

      <!-- Load More Button -->
      <div v-if="hasMore" class="text-center pt-4">
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
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { OpportunityListView } from '@/types/opportunities'
import StageTag from '@/components/opportunities/StageTag.vue'
import ProbabilityBar from '@/components/opportunities/ProbabilityBar.vue'

/**
 * Component props interface
 */
interface Props {
  /** Principal ID to filter opportunities */
  principalId: string
  /** Principal name for display */
  principalName?: string
  /** Loading state */
  loading?: boolean
  /** Loading more state */
  loadingMore?: boolean
  /** Whether there are more opportunities to load */
  hasMore?: boolean
  /** Maximum number of opportunities to display */
  limit?: number
  /** Custom opportunities data (overrides API data) */
  customOpportunities?: OpportunityListView[]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  loadingMore: false,
  hasMore: false,
  limit: 10,
  customOpportunities: undefined
})

/**
 * Component emits
 */
const emit = defineEmits<{
  /** Emitted when opportunity is clicked */
  opportunityClick: [opportunity: OpportunityListView]
  /** Emitted when edit is requested */
  edit: [opportunity: OpportunityListView]
  /** Emitted when delete is requested */
  delete: [opportunity: OpportunityListView]
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
 * Get opportunities data - either from props or store
 * In a real implementation, this would fetch from opportunityStore filtered by principalId
 */
const opportunities = computed((): OpportunityListView[] => {
  if (props.customOpportunities) {
    return props.customOpportunities.slice(0, props.limit)
  }
  
  // Mock data for demonstration - in real implementation, 
  // this would come from the opportunity store filtered by principalId
  return [
    {
      id: '1',
      name: `${props.principalName} - Q4 Initiative`,
      stage: 'INITIAL_OUTREACH',
      probability_percent: 25,
      expected_close_date: '2024-12-31',
      organization_name: 'Sample Organization',
      product_name: 'Product A',
      notes: 'Initial outreach completed, waiting for response from decision maker.',
      created_at: '2024-11-01T10:00:00Z',
      updated_at: '2024-11-15T14:30:00Z'
    },
    {
      id: '2',
      name: `${props.principalName} - Expansion Project`,
      stage: 'SAMPLE_VISIT_OFFERED',
      probability_percent: 60,
      expected_close_date: '2024-11-30',
      organization_name: 'Another Organization',
      product_name: 'Product B',
      notes: 'Sample visit scheduled for next week. High interest level.',
      created_at: '2024-10-15T09:00:00Z',
      updated_at: '2024-11-10T16:45:00Z'
    }
  ].filter(opp => props.principalId) // Only show if principal is selected
})

// ===============================
// EVENT HANDLERS
// ===============================

/**
 * Handle opportunity click - navigate to detail view
 */
const handleOpportunityClick = (opportunity: OpportunityListView) => {
  emit('opportunityClick', opportunity)
  router.push(`/opportunities/${opportunity.id}`)
}

/**
 * Handle edit opportunity
 */
const handleEdit = (opportunity: OpportunityListView) => {
  emit('edit', opportunity)
  router.push(`/opportunities/${opportunity.id}/edit`)
}

/**
 * Handle delete opportunity
 */
const handleDelete = (opportunity: OpportunityListView) => {
  if (confirm(`Are you sure you want to delete "${opportunity.name}"? This action cannot be undone.`)) {
    emit('delete', opportunity)
  }
}

// ===============================
// UTILITY FUNCTIONS
// ===============================

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
</script>

<style scoped>
/* ===============================
   COMPONENT STYLES
   =============================== */

.opportunity-card {
  @apply transition-all duration-200;
}

.opportunity-card:hover {
  @apply transform scale-[1.01];
}

.opportunity-card:focus {
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

/* ===============================
   RESPONSIVE DESIGN
   =============================== */

@media (max-width: 640px) {
  .opportunity-card {
    @apply p-3;
  }
  
  .opportunity-card h4 {
    font-size: 0.75rem;
  }
  
  .opportunity-card .text-xs {
    font-size: 10px;
  }
}

/* ===============================
   ACCESSIBILITY ENHANCEMENTS
   =============================== */

@media (prefers-reduced-motion: reduce) {
  .opportunity-card {
    transition: none;
  }
  
  .opportunity-card:hover {
    transform: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .opportunity-card {
    @apply border-2 border-gray-400;
  }
  
  .opportunity-card:hover {
    @apply border-gray-600;
  }
}
</style>