<template>
  <div 
    class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6"
    role="region"
    aria-label="Product Key Performance Indicators"
  >
    <!-- Total Products Card -->
    <div 
      class="kpi-card" 
      :class="{ 'kpi-card-clicked': clickedCard === 'total' }"
      @click="handleCardClick('total')" 
      tabindex="0" 
      role="button" 
      aria-label="View all products"
      @keydown.enter="handleCardClick('total')"
      @keydown.space.prevent="handleCardClick('total')"
    >
      <div class="kpi-card-content">
        <div class="kpi-icon kpi-icon-blue">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <div class="kpi-details">
          <div class="kpi-label">Total Products</div>
          <div class="kpi-value" :class="{ 'kpi-loading': isLoading }">
            <span v-if="isLoading" class="loading-placeholder">--</span>
            <span v-else>{{ formatNumber(stats?.total_products || 0) }}</span>
          </div>
          <div class="kpi-subtitle">In catalog</div>
        </div>
      </div>
    </div>

    <!-- Active Products Card -->
    <div 
      class="kpi-card" 
      :class="{ 'kpi-card-clicked': clickedCard === 'active' }"
      @click="handleCardClick('active')" 
      tabindex="0" 
      role="button" 
      aria-label="View active products"
      @keydown.enter="handleCardClick('active')"
      @keydown.space.prevent="handleCardClick('active')"
    >
      <div class="kpi-card-content">
        <div class="kpi-icon kpi-icon-green">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="kpi-details">
          <div class="kpi-label">Active Products</div>
          <div class="kpi-value" :class="{ 'kpi-loading': isLoading }">
            <span v-if="isLoading" class="loading-placeholder">--</span>
            <span v-else>{{ formatNumber(stats?.active_products || 0) }}</span>
          </div>
          <div class="kpi-subtitle">Available for sale</div>
        </div>
      </div>
    </div>

    <!-- Categories Card -->
    <div 
      class="kpi-card" 
      :class="{ 'kpi-card-clicked': clickedCard === 'categories' }"
      @click="handleCardClick('categories')" 
      tabindex="0" 
      role="button" 
      aria-label="View categories breakdown"
      @keydown.enter="handleCardClick('categories')"
      @keydown.space.prevent="handleCardClick('categories')"
    >
      <div class="kpi-card-content">
        <div class="kpi-icon kpi-icon-purple">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <div class="kpi-details">
          <div class="kpi-label">Categories</div>
          <div class="kpi-value" :class="{ 'kpi-loading': isLoading }">
            <span v-if="isLoading" class="loading-placeholder">--</span>
            <span v-else>{{ getCategoriesCount() }}</span>
          </div>
          <div class="kpi-subtitle">{{ getMostCommonCategory() }}</div>
        </div>
      </div>
    </div>

    <!-- Principal Assignments Card -->
    <div 
      class="kpi-card" 
      :class="{ 'kpi-card-clicked': clickedCard === 'principals' }"
      @click="handleCardClick('principals')" 
      tabindex="0" 
      role="button" 
      aria-label="View principal assignments"
      @keydown.enter="handleCardClick('principals')"
      @keydown.space.prevent="handleCardClick('principals')"
    >
      <div class="kpi-card-content">
        <div class="kpi-icon kpi-icon-emerald">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div class="kpi-details">
          <div class="kpi-label">Principal Coverage</div>
          <div class="kpi-value" :class="{ 'kpi-loading': isLoading }">
            <span v-if="isLoading" class="loading-placeholder">--%</span>
            <span v-else>{{ formatPercentage(getPrincipalCoverage()) }}</span>
          </div>
          <div class="kpi-subtitle">With assignments</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProductStore } from '@/stores/productStore'
import type { ProductStats } from '@/types/products'

/**
 * Props interface for ProductKPICards component
 */
interface Props {
  /** Whether to show loading state */
  loading?: boolean
  /** Override KPI data (for testing or custom data) */
  customStats?: ProductStats | null
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  customStats: null
})

/**
 * Component emits
 */
const emit = defineEmits<{
  /** Emitted when a KPI card is clicked for drill-down */
  cardClick: [kpiType: string]
}>()

// ===============================
// STORE INTEGRATION
// ===============================

const productStore = useProductStore()

const stats = computed(() => props.customStats || productStore.stats)
const isLoading = computed(() => props.loading || productStore.isLoading)

// ===============================
// DELIGHT FEATURES
// ===============================

const clickedCard = ref<string | null>(null)

/**
 * Handle card click with delightful feedback
 */
const handleCardClick = (kpiType: string) => {
  // Trigger click animation
  clickedCard.value = kpiType
  
  // Clear animation after 300ms
  setTimeout(() => {
    clickedCard.value = null
  }, 300)
  
  // Emit the card click event
  emit('cardClick', kpiType)
}

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
 * Get the count of categories in use
 */
const getCategoriesCount = (): number => {
  if (!stats.value?.products_by_category) return 0
  
  return Object.values(stats.value.products_by_category).filter(count => count > 0).length
}

/**
 * Get the most common category name for subtitle
 */
const getMostCommonCategory = (): string => {
  if (!stats.value?.most_common_category) return 'No category'
  
  return `Most: ${stats.value.most_common_category}`
}

/**
 * Calculate principal coverage percentage
 * (Products with principal assignments / Total active products)
 */
const getPrincipalCoverage = (): number => {
  const totalActive = stats.value?.active_products || 0
  if (totalActive === 0) return 0
  
  // This would need to be calculated based on product-principal relationships
  // For now, using a placeholder calculation
  // TODO: Add actual principal coverage calculation to ProductStats
  const productsWithPrincipals = Math.floor(totalActive * 0.85) // Placeholder: 85% coverage
  
  return (productsWithPrincipals / totalActive) * 100
}
</script>

<style scoped>
/* ===============================
   KPI CARD COMPONENT STYLES
   =============================== */

.kpi-card {
  @apply bg-white rounded-lg border border-gray-200 shadow-sm cursor-pointer;
  @apply transition-all duration-200 ease-out;
  min-height: 120px;
  transform: translateY(0);
}

.kpi-card:hover {
  @apply border-gray-300 shadow-lg;
  transform: translateY(-2px) scale(1.02);
}

.kpi-card:focus {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2;
}

.kpi-card:active {
  transform: translateY(0) scale(0.98);
  @apply shadow-md;
}

.kpi-card-clicked {
  @apply bg-blue-50 border-blue-300;
  animation: successPulse 0.3s ease-out;
}

@keyframes successPulse {
  0% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-1px) scale(1.03);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
  }
  100% {
    transform: translateY(0) scale(1);
  }
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
  @apply transition-all duration-200 ease-out;
}

.kpi-card:hover .kpi-icon {
  transform: scale(1.1) rotate(5deg);
}

.kpi-card:active .kpi-icon {
  transform: scale(1.05) rotate(2deg);
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
  position: relative;
  overflow: hidden;
}

.kpi-loading::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { left: -100%; }
  50% { left: 100%; }
  100% { left: 100%; }
}

.loading-placeholder {
  @apply bg-gray-200 rounded;
  @apply inline-block min-w-[40px] h-[32px] lg:h-[36px];
  @apply animate-pulse;
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
  
  .kpi-card:hover {
    transform: none;
  }
  
  .kpi-card:hover .kpi-icon {
    transform: none;
  }
  
  .kpi-loading {
    animation: none;
  }
  
  .kpi-loading::before {
    animation: none;
  }
  
  .kpi-card-clicked {
    animation: none;
  }
}

/* Keyboard navigation enhancement */
.kpi-card:focus {
  @apply transform scale-[1.02];
}

@media (prefers-reduced-motion: reduce) {
  .kpi-card:focus {
    transform: none;
  }
}
</style>