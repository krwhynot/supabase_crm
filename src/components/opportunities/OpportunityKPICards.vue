<template>
  <div 
    class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6"
    role="region"
    aria-label="Opportunity Key Performance Indicators"
  >
    <!-- Total Opportunities Card -->
    <div class="kpi-card">
      <div class="kpi-card-content">
        <div class="kpi-icon kpi-icon-blue">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div class="kpi-details">
          <div class="kpi-label">Total Opportunities</div>
          <div class="kpi-value" :class="{ 'kpi-loading': isLoading }">
            <span v-if="isLoading" class="loading-placeholder">--</span>
            <span v-else>{{ formatNumber(kpis?.total_opportunities || 0) }}</span>
          </div>
          <div class="kpi-subtitle">All time</div>
        </div>
      </div>
    </div>

    <!-- Active Opportunities Card -->
    <div class="kpi-card">
      <div class="kpi-card-content">
        <div class="kpi-icon kpi-icon-green">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div class="kpi-details">
          <div class="kpi-label">Active Opportunities</div>
          <div class="kpi-value" :class="{ 'kpi-loading': isLoading }">
            <span v-if="isLoading" class="loading-placeholder">--</span>
            <span v-else>{{ formatNumber(kpis?.active_opportunities || 0) }}</span>
          </div>
          <div class="kpi-subtitle">In progress</div>
        </div>
      </div>
    </div>

    <!-- Average Probability Card -->
    <div class="kpi-card">
      <div class="kpi-card-content">
        <div class="kpi-icon kpi-icon-purple">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div class="kpi-details">
          <div class="kpi-label">Average Probability</div>
          <div class="kpi-value" :class="{ 'kpi-loading': isLoading }">
            <span v-if="isLoading" class="loading-placeholder">--%</span>
            <span v-else>{{ formatPercentage(kpis?.average_probability || 0) }}</span>
          </div>
          <div class="kpi-subtitle">Success rate</div>
        </div>
      </div>
    </div>

    <!-- Won This Month Card -->
    <div class="kpi-card">
      <div class="kpi-card-content">
        <div class="kpi-icon kpi-icon-emerald">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
        <div class="kpi-details">
          <div class="kpi-label">Won This Month</div>
          <div class="kpi-value" :class="{ 'kpi-loading': isLoading }">
            <span v-if="isLoading" class="loading-placeholder">--</span>
            <span v-else>{{ formatNumber(kpis?.won_this_month || 0) }}</span>
          </div>
          <div class="kpi-subtitle">{{ getCurrentMonth() }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useOpportunityStore } from '@/stores/opportunityStore'
import type { OpportunityKPIs } from '@/types/opportunities'

/**
 * Props interface for OpportunityKPICards component
 */
interface Props {
  /** Whether to show loading state */
  loading?: boolean
  /** Override KPI data (for testing or custom data) */
  customKpis?: OpportunityKPIs | null
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  customKpis: null
})

/**
 * Component emits - none needed for display component
 */
defineEmits<{
  /** Emitted when a KPI card is clicked for drill-down */
  cardClick: [kpiType: string]
}>()

// ===============================
// STORE INTEGRATION
// ===============================

const opportunityStore = useOpportunityStore()

const kpis = computed(() => props.customKpis || opportunityStore.kpis)
const isLoading = computed(() => props.loading || opportunityStore.isLoading)

// ===============================
// UTILITY FUNCTIONS
// ===============================

/**
 * Format numbers with appropriate suffixes (K, M, B)
 */
const formatNumber = (value: number): string => {
  if (value >= 1000000000) {
    return (value / 1000000000).toFixed(1) + 'B'
  }
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M'
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K'
  }
  return value.toString()
}

/**
 * Format percentage values
 */
const formatPercentage = (value: number): string => {
  return Math.round(value) + '%'
}

/**
 * Get current month name for subtitle
 */
const getCurrentMonth = (): string => {
  return new Date().toLocaleDateString('en-US', { month: 'long' })
}
</script>

<style scoped>
/* ===============================
   KPI CARD COMPONENT STYLES
   =============================== */

.kpi-card {
  @apply bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200;
  @apply cursor-pointer;
  min-height: 120px;
}

.kpi-card:hover {
  @apply border-gray-300;
}

.kpi-card-content {
  @apply p-4 lg:p-6 flex items-start space-x-4;
  min-height: 120px;
}

/* ===============================
   KPI ICON STYLES
   =============================== */

.kpi-icon {
  @apply flex-shrink-0 rounded-lg p-3 flex items-center justify-center;
  @apply min-w-[48px] min-h-[48px];
  @apply lg:min-w-[52px] lg:min-h-[52px];
}

.kpi-icon-blue {
  @apply bg-blue-100 text-blue-600;
}

.kpi-icon-green {
  @apply bg-green-100 text-green-600;
}

.kpi-icon-purple {
  @apply bg-purple-100 text-purple-600;
}

.kpi-icon-emerald {
  @apply bg-emerald-100 text-emerald-600;
}

/* ===============================
   KPI DETAILS STYLES
   =============================== */

.kpi-details {
  @apply flex-1 min-w-0;
}

.kpi-label {
  @apply text-sm font-medium text-gray-600 mb-1;
  @apply truncate;
}

.kpi-value {
  @apply text-2xl lg:text-3xl font-bold text-gray-900 mb-1;
  @apply min-h-[32px] lg:min-h-[36px];
  @apply flex items-center;
}

.kpi-subtitle {
  @apply text-xs text-gray-500;
  @apply truncate;
}

/* ===============================
   LOADING STATES
   =============================== */

.kpi-loading {
  @apply animate-pulse;
}

.loading-placeholder {
  @apply bg-gray-200 rounded;
  @apply inline-block min-w-[40px] h-[32px] lg:h-[36px];
}

/* ===============================
   RESPONSIVE DESIGN
   =============================== */

/* iPad Portrait Optimization */
@media (min-width: 768px) and (max-width: 1024px) {
  .kpi-card {
    min-height: 140px;
  }
  
  .kpi-card-content {
    @apply p-5;
    min-height: 140px;
  }
  
  .kpi-icon {
    @apply min-w-[56px] min-h-[56px];
  }
  
  .kpi-value {
    @apply text-3xl;
    @apply min-h-[40px];
  }
}

/* Mobile Optimization */
@media (max-width: 767px) {
  .kpi-card {
    min-height: 100px;
  }
  
  .kpi-card-content {
    @apply p-3 space-x-3;
    min-height: 100px;
  }
  
  .kpi-icon {
    @apply min-w-[40px] min-h-[40px] p-2;
  }
  
  .kpi-value {
    @apply text-xl;
    @apply min-h-[28px];
  }
  
  .kpi-label {
    @apply text-xs;
  }
  
  .kpi-subtitle {
    @apply text-xs;
  }
}

/* ===============================
   ACCESSIBILITY ENHANCEMENTS
   =============================== */

.kpi-card:focus {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2;
}

.kpi-card:focus-visible {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .kpi-card {
    @apply border-2 border-gray-400;
  }
  
  .kpi-icon-blue {
    @apply bg-blue-200 text-blue-800;
  }
  
  .kpi-icon-green {
    @apply bg-green-200 text-green-800;
  }
  
  .kpi-icon-purple {
    @apply bg-purple-200 text-purple-800;
  }
  
  .kpi-icon-emerald {
    @apply bg-emerald-200 text-emerald-800;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .kpi-card {
    transition: none;
  }
  
  .kpi-loading {
    animation: none;
  }
}
</style>