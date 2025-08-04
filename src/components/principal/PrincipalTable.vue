<!--
  PrincipalTable - Responsive table component optimized for iPad viewport
  
  Features:
  - Responsive table that converts to cards on smaller screens
  - Sortable columns with touch-friendly controls
  - Inline actions with proper touch targets
  - Horizontal scrolling fallback for complex data
  - Accessibility compliant with keyboard navigation
-->
<template>
  <div class="principal-table-container">
    <!-- Desktop/Tablet Table View -->
    <div class="hidden sm:block overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th 
              scope="col" 
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 focus:bg-gray-100 transition-colors duration-200"
              @click="handleSort('name')"
              @keydown.enter="handleSort('name')"
              @keydown.space.prevent="handleSort('name')"
              tabindex="0"
              :aria-sort="getSortAriaLabel('name')"
            >
              <div class="flex items-center space-x-1">
                <span>Principal</span>
                <svg :class="getSortIconClass('name')" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getSortIcon('name')" />
                </svg>
              </div>
            </th>
            
            <th 
              scope="col" 
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 focus:bg-gray-100 transition-colors duration-200"
              @click="handleSort('engagement')"
              @keydown.enter="handleSort('engagement')"
              @keydown.space.prevent="handleSort('engagement')"
              tabindex="0"
              :aria-sort="getSortAriaLabel('engagement')"
            >
              <div class="flex items-center space-x-1">
                <span>Engagement</span>
                <svg :class="getSortIconClass('engagement')" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getSortIcon('engagement')" />
                </svg>
              </div>
            </th>
            
            <th 
              scope="col" 
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 focus:bg-gray-100 transition-colors duration-200"
              @click="handleSort('activity')"
              @keydown.enter="handleSort('activity')"
              @keydown.space.prevent="handleSort('activity')"
              tabindex="0"
              :aria-sort="getSortAriaLabel('activity')"
            >
              <div class="flex items-center space-x-1">
                <span>Last Activity</span>
                <svg :class="getSortIconClass('activity')" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getSortIcon('activity')" />
                </svg>
              </div>
            </th>
            
            <th 
              scope="col" 
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 focus:bg-gray-100 transition-colors duration-200"
              @click="handleSort('opportunities')"
              @keydown.enter="handleSort('opportunities')"
              @keydown.space.prevent="handleSort('opportunities')"
              tabindex="0"
              :aria-sort="getSortAriaLabel('opportunities')"
            >
              <div class="flex items-center space-x-1">
                <span>Opportunities</span>
                <svg :class="getSortIconClass('opportunities')" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getSortIcon('opportunities')" />
                </svg>
              </div>
            </th>
            
            <th scope="col" class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        
        <tbody class="bg-white divide-y divide-gray-200">
          <tr 
            v-for="principal in principals" 
            :key="principal.principal_id"
            class="hover:bg-gray-50 cursor-pointer transition-colors duration-200"
            @click="handlePrincipalClick(principal)"
            @keydown.enter="handlePrincipalClick(principal)"
            @keydown.space.prevent="handlePrincipalClick(principal)"
            tabindex="0"
            :aria-label="`View details for ${principal.principal_name}`"
          >
            <!-- Principal Name and Organization -->
            <td class="px-4 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10">
                  <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span class="text-sm font-medium text-blue-600">
                      {{ getInitials(principal.principal_name) }}
                    </span>
                  </div>
                </div>
                <div class="ml-4">
                  <div class="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                    {{ principal.principal_name }}
                  </div>
                  <div class="text-sm text-gray-500 truncate max-w-[200px]">
                    {{ principal.organization_name }}
                  </div>
                  <div v-if="principal.organization_type" class="text-xs text-gray-400 uppercase">
                    {{ principal.organization_type }}
                  </div>
                </div>
              </div>
            </td>
            
            <!-- Engagement Score -->
            <td class="px-4 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <EngagementScoreRing 
                  :score="principal.engagement_score || 0" 
                  size="sm" 
                  class="mr-3"
                />
                <div class="flex flex-col">
                  <span class="text-sm font-medium text-gray-900">
                    {{ principal.engagement_score || 0 }}%
                  </span>
                  <ActivityStatusBadge 
                    :status="principal.activity_status" 
                    size="xs"
                  />
                </div>
              </div>
            </td>
            
            <!-- Last Activity -->
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
              <div class="flex flex-col">
                <span>{{ formatDate(principal.last_activity_date) }}</span>
                <span class="text-xs text-gray-500">
                  {{ formatDaysAgo(principal.last_activity_date) }}
                </span>
              </div>
            </td>
            
            <!-- Opportunities -->
            <td class="px-4 py-4 whitespace-nowrap">
              <div class="flex items-center space-x-4 text-sm text-gray-900">
                <div class="flex flex-col items-center">
                  <span class="font-medium">{{ principal.active_opportunities || 0 }}</span>
                  <span class="text-xs text-gray-500">Active</span>
                </div>
                <div class="flex flex-col items-center">
                  <span class="font-medium">{{ principal.total_interactions || 0 }}</span>
                  <span class="text-xs text-gray-500">Interactions</span>
                </div>
                <div class="flex flex-col items-center">
                  <span class="font-medium">{{ principal.products_associated || 0 }}</span>
                  <span class="text-xs text-gray-500">Products</span>
                </div>
              </div>
            </td>
            
            <!-- Actions -->
            <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex items-center justify-end space-x-2">
                <button
                  @click.stop="handleCreateOpportunity(principal)"
                  class="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[32px] min-w-[32px]"
                  :aria-label="`Create opportunity for ${principal.principal_name}`"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
                
                <button
                  @click.stop="handleLogInteraction(principal)"
                  class="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[32px] min-w-[32px]"
                  :aria-label="`Log interaction for ${principal.principal_name}`"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
                
                <button
                  @click.stop="handlePrincipalClick(principal)"
                  class="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[32px] min-w-[32px]"
                  :aria-label="`View details for ${principal.principal_name}`"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Mobile Card View -->
    <div class="sm:hidden space-y-3">
      <div 
        v-for="principal in principals" 
        :key="principal.principal_id"
        class="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow duration-200"
        @click="handlePrincipalClick(principal)"
        @keydown.enter="handlePrincipalClick(principal)"
        @keydown.space.prevent="handlePrincipalClick(principal)"
        tabindex="0"
        :aria-label="`View details for ${principal.principal_name}`"
      >
        <!-- Mobile Card Header -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center space-x-3">
            <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span class="text-sm font-medium text-blue-600">
                {{ getInitials(principal.principal_name) }}
              </span>
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-sm font-medium text-gray-900 truncate">
                {{ principal.principal_name }}
              </h3>
              <p class="text-xs text-gray-500 truncate">
                {{ principal.organization_name }}
              </p>
              <p v-if="principal.organization_type" class="text-xs text-gray-400 uppercase">
                {{ principal.organization_type }}
              </p>
            </div>
          </div>
          
          <ActivityStatusBadge 
            :status="principal.activity_status" 
            size="sm"
          />
        </div>
        
        <!-- Mobile Card Metrics -->
        <div class="grid grid-cols-2 gap-4 mb-3">
          <div class="text-center">
            <EngagementScoreRing 
              :score="principal.engagement_score || 0" 
              size="sm"
              class="mx-auto mb-1"
            />
            <div class="text-xs text-gray-500">Engagement</div>
          </div>
          
          <div class="text-center">
            <div class="text-sm font-medium text-gray-900">
              {{ formatDaysAgo(principal.last_activity_date) }}
            </div>
            <div class="text-xs text-gray-500">Last Activity</div>
          </div>
        </div>
        
        <!-- Mobile Card Stats -->
        <div class="grid grid-cols-3 gap-2 mb-3 text-center">
          <div>
            <div class="text-sm font-medium text-gray-900">{{ principal.active_opportunities || 0 }}</div>
            <div class="text-xs text-gray-500">Opportunities</div>
          </div>
          <div>
            <div class="text-sm font-medium text-gray-900">{{ principal.total_interactions || 0 }}</div>
            <div class="text-xs text-gray-500">Interactions</div>
          </div>
          <div>
            <div class="text-sm font-medium text-gray-900">{{ principal.products_associated || 0 }}</div>
            <div class="text-xs text-gray-500">Products</div>
          </div>
        </div>
        
        <!-- Mobile Card Actions -->
        <div class="grid grid-cols-2 gap-2">
          <button
            @click.stop="handleCreateOpportunity(principal)"
            class="inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[44px]"
          >
            <svg class="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Opportunity
          </button>
          
          <button
            @click.stop="handleLogInteraction(principal)"
            class="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[44px]"
          >
            <svg class="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Interaction
          </button>
        </div>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      <span class="ml-2 text-gray-600">Loading...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PrincipalActivitySummary } from '@/services/principalActivityApi'
import ActivityStatusBadge from './ActivityStatusBadge.vue'
import EngagementScoreRing from './EngagementScoreRing.vue'

// ===============================
// PROPS & EMITS
// ===============================

interface Props {
  principals: PrincipalActivitySummary[]
  loading?: boolean
}

interface Emits {
  (e: 'principal-click', principal: PrincipalActivitySummary): void
  (e: 'create-opportunity', principal: PrincipalActivitySummary): void
  (e: 'log-interaction', principal: PrincipalActivitySummary): void
  (e: 'sort-change', column: string, direction: 'asc' | 'desc'): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<Emits>()

// ===============================
// REACTIVE STATE
// ===============================

const currentSort = ref<{
  column: string | null
  direction: 'asc' | 'desc'
}>({
  column: null,
  direction: 'asc'
})

// ===============================
// COMPUTED PROPERTIES
// ===============================

const getSortAriaLabel = (column: string): string => {
  if (currentSort.value.column !== column) {
    return 'none'
  }
  return currentSort.value.direction === 'asc' ? 'ascending' : 'descending'
}

// ===============================
// UTILITY FUNCTIONS
// ===============================

const getInitials = (name: string): string => {
  if (!name) return '?'
  
  const words = name.split(' ')
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase()
  }
  
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Never'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

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

// ===============================
// EVENT HANDLERS
// ===============================

const handleSort = (column: string) => {
  let direction: 'asc' | 'desc' = 'asc'
  
  if (currentSort.value.column === column) {
    direction = currentSort.value.direction === 'asc' ? 'desc' : 'asc'
  }
  
  currentSort.value = { column, direction }
  emit('sort-change', column, direction)
}

const handlePrincipalClick = (principal: PrincipalActivitySummary) => {
  emit('principal-click', principal)
}

const handleCreateOpportunity = (principal: PrincipalActivitySummary) => {
  emit('create-opportunity', principal)
}

const handleLogInteraction = (principal: PrincipalActivitySummary) => {
  emit('log-interaction', principal)
}

// ===============================
// SORT ICON COMPONENT
// ===============================

const getSortIcon = (column: string) => {
  if (currentSort.value.column !== column) {
    return 'M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4'
  }
  
  if (currentSort.value.direction === 'asc') {
    return 'M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12'
  }
  
  return 'M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4'
}

const getSortIconClass = (column: string) => {
  return currentSort.value.column === column ? 'h-3 w-3 text-blue-600' : 'h-3 w-3 text-gray-400'
}
</script>

<style scoped>
.principal-table-container {
  /* Ensure proper overflow handling */
  @apply w-full;
}

/* Table responsive behavior */
@media (max-width: 640px) {
  .overflow-x-auto {
    @apply hidden;
  }
}

/* Touch targets for mobile */
button {
  min-height: 44px;
  min-width: 44px;
}

@media (min-width: 640px) {
  button {
    min-height: 32px;
    min-width: 32px;
  }
}

/* Focus and hover states */
tr:focus {
  outline: none;
}

tr:focus-visible {
  @apply ring-2 ring-blue-500 ring-inset;
}

th:focus {
  outline: none;
}

th:focus-visible {
  @apply ring-2 ring-blue-500 ring-inset;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .bg-white {
    @apply border-2 border-gray-800;
  }
  
  .text-gray-500 {
    @apply text-gray-900;
  }
  
  .bg-blue-600 {
    @apply bg-gray-900;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
</style>