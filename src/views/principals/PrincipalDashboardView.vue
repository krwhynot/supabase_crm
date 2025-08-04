<!--
  Principal Dashboard View - Main dashboard page for Principal Activity Management
  Features: Real-time analytics, relationship tracking, performance monitoring
-->
<template>
  <div class="principal-dashboard-view">
    <!-- Page Header with Navigation -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Principal Activity Dashboard</h1>
        <p class="mt-1 text-sm text-gray-500">
          Comprehensive relationship insights and performance analytics
        </p>
      </div>
      
      <!-- Quick Navigation -->
      <div class="flex items-center space-x-3">
        <router-link
          to="/interactions"
          class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Interactions
        </router-link>
        
        <router-link
          to="/opportunities"
          class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Opportunities
        </router-link>
      </div>
    </div>

    <!-- Principal Dashboard Component -->
    <PrincipalDashboard />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { usePrincipalActivityStore } from '@/stores/principalActivityStore'
import { PrincipalDashboard } from '@/components/principal'

/**
 * Dashboard View - Acts as a container for the main dashboard component
 * Handles view-level concerns like navigation and initial data loading
 */

// ===============================
// COMPOSABLES & STORES
// ===============================

const principalActivityStore = usePrincipalActivityStore()

// ===============================
// LIFECYCLE HOOKS
// ===============================

onMounted(async () => {
  // Initialize dashboard data if needed
  // The PrincipalDashboard component handles its own data loading,
  // but we can pre-load critical data here for better UX
  try {
    await principalActivityStore.loadActivitySummaries()
  } catch (error) {
    console.error('Failed to initialize principal dashboard:', error)
    // Error handling is managed by the store and dashboard component
  }
})
</script>

<style scoped>
.principal-dashboard-view {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .principal-dashboard-view {
    @apply px-2 py-4;
  }
}

/* Print styles */
@media print {
  .principal-dashboard-view {
    @apply shadow-none px-0;
  }
  
  /* Hide navigation buttons when printing */
  .principal-dashboard-view > div:first-child > div:last-child {
    @apply hidden;
  }
}
</style>