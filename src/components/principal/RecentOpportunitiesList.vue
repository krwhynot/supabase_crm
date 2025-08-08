<!--
  RecentOpportunitiesList - Compact opportunities list for principal detail view
  
  Features:
  - Touch-friendly list optimized for iPad viewport
  - Opportunity status indicators with clear visual hierarchy
  - Quick actions for viewing and editing opportunities
  - Responsive design that adapts to container width
-->
<template>
  <div class="recent-opportunities-list">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      <span class="ml-2 text-gray-600">Loading opportunities...</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="opportunities.length === 0" class="text-center py-8">
      <svg class="mx-auto h-8 w-8 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
      <p class="text-sm text-gray-500 mb-4">No opportunities found for this principal</p>
      <button
        @click="handleCreateOpportunity"
        class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[36px]"
      >
        <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Create First Opportunity
      </button>
    </div>

    <!-- Opportunities List -->
    <div v-else class="space-y-3">
      <div
        v-for="opportunity in displayedOpportunities"
        :key="opportunity.id"
        class="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
        @click="handleOpportunityClick(opportunity)"
        @keydown.enter="handleOpportunityClick(opportunity)"
        @keydown.space.prevent="handleOpportunityClick(opportunity)"
        tabindex="0"
        :aria-label="`View opportunity ${opportunity.name}`"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-medium text-gray-900 truncate">
              {{ opportunity.name }}
            </h4>
            <p v-if="opportunity.product_name" class="text-xs text-gray-500 mt-1">
              {{ opportunity.product_name }}
            </p>
            <div class="flex items-center space-x-4 mt-2">
              <StageTag 
                :stage="opportunity.stage as OpportunityStage" 
                size="sm"
              />
              <div v-if="opportunity.probability_percent" class="text-xs text-gray-600">
                {{ opportunity.probability_percent }}% probability
              </div>
            </div>
          </div>
          
          <div class="flex items-center space-x-2 flex-shrink-0 ml-4">
            <div v-if="opportunity.expected_close_date" class="text-right">
              <div class="text-xs text-gray-500">Expected close</div>
              <div class="text-xs font-medium text-gray-900">
                {{ formatDate(opportunity.expected_close_date) }}
              </div>
            </div>
            
            <!-- Quick Actions -->
            <div class="flex items-center space-x-1">
              <button
                @click.stop="handleEditOpportunity(opportunity)"
                class="p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded min-h-[32px] min-w-[32px] flex items-center justify-center"
                :aria-label="`Edit opportunity ${opportunity.name}`"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              
              <button
                @click.stop="handleOpportunityClick(opportunity)"
                class="p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded min-h-[32px] min-w-[32px] flex items-center justify-center"
                :aria-label="`View opportunity details ${opportunity.name}`"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Show More Button -->
      <div v-if="opportunities.length > maxItems" class="text-center pt-3 border-t border-gray-200">
        <button
          @click="handleViewAllOpportunities"
          class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[44px]"
        >
          View All {{ opportunities.length }} Opportunities
          <svg class="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { StageTag } from '@/components/opportunities'
import type { OpportunityStage } from '@/types/opportunities'

// ===============================
// INTERFACES
// ===============================

interface Opportunity {
  id: string
  name: string
  stage: string
  probability_percent?: number
  expected_close_date?: string
  product_name?: string
  organization_name?: string
}

// ===============================
// PROPS & EMITS
// ===============================

interface Props {
  principalId: string
  loading?: boolean
  maxItems?: number
}

interface Emits {
  (e: 'create-opportunity'): void
  (e: 'opportunity-click', opportunity: Opportunity): void
  (e: 'edit-opportunity', opportunity: Opportunity): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  maxItems: 5
})

const emit = defineEmits<Emits>()

// ===============================
// COMPOSABLES
// ===============================

const router = useRouter()

// ===============================
// REACTIVE STATE & COMPUTED
// ===============================

// Mock data - in real implementation, this would come from an API call
const opportunities = computed<Opportunity[]>(() => {
  // This would be replaced with actual data fetching
  return [
    {
      id: '1',
      name: 'Q4 Product Line Expansion',
      stage: 'DEMO_SCHEDULED' as OpportunityStage,
      probability_percent: 75,
      expected_close_date: '2024-12-15',
      product_name: 'Premium Widget Series',
      organization_name: 'Acme Corporation'
    },
    {
      id: '2',
      name: 'Annual Contract Renewal',
      stage: 'FEEDBACK_LOGGED' as OpportunityStage,
      probability_percent: 90,
      expected_close_date: '2024-11-30',
      product_name: 'Standard Widget Package',
      organization_name: 'Acme Corporation'
    },
    {
      id: '3',
      name: 'New Territory Pilot Program',
      stage: 'SAMPLE_VISIT_OFFERED' as OpportunityStage,
      probability_percent: 45,
      expected_close_date: '2025-01-31',
      product_name: 'Starter Widget Kit',
      organization_name: 'Acme Corporation'
    }
  ]
})

const displayedOpportunities = computed(() => {
  return opportunities.value.slice(0, props.maxItems)
})

// ===============================
// UTILITY FUNCTIONS
// ===============================

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

// ===============================
// EVENT HANDLERS
// ===============================

const handleCreateOpportunity = () => {
  emit('create-opportunity')
}

const handleOpportunityClick = (opportunity: Opportunity) => {
  emit('opportunity-click', opportunity)
  router.push(`/opportunities/${opportunity.id}`)
}

const handleEditOpportunity = (opportunity: Opportunity) => {
  emit('edit-opportunity', opportunity)
  router.push(`/opportunities/${opportunity.id}/edit`)
}

const handleViewAllOpportunities = () => {
  router.push(`/opportunities?principal=${props.principalId}`)
}
</script>

<style scoped>
.recent-opportunities-list {
  /* Ensure proper spacing and layout */
  @apply w-full;
}

/* Touch targets */
button {
  min-height: 44px;
}

@media (min-width: 640px) {
  button {
    min-height: 32px;
  }
}

/* Focus states */
.cursor-pointer:focus {
  outline: none;
}

.cursor-pointer:focus-visible {
  @apply ring-2 ring-blue-500 ring-offset-2;
}

/* Hover and transition effects */
.transition-all {
  transition: all 0.2s ease-in-out;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .space-y-3 > * + * {
    margin-top: 0.75rem;
  }
  
  .p-4 {
    @apply p-3;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .border-gray-200 {
    @apply border-gray-800;
  }
  
  .text-gray-500 {
    @apply text-gray-900;
  }
  
  .hover\\:border-gray-300:hover {
    @apply border-gray-900;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .transition-all {
    transition: none !important;
  }
  
  .animate-spin {
    animation: none;
  }
}
</style>