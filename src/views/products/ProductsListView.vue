<template>
  <div class="products-list-view" data-testid="products-list-view">
    <!-- Page Header -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8" data-testid="products-header">
      <div class="mb-4 lg:mb-0">
        <h1 class="text-3xl font-bold text-gray-900" data-testid="page-title">Products</h1>
        <p class="mt-2 text-gray-600">
          Manage your product catalog and principal assignments
        </p>
      </div>
      
      <div class="flex items-center space-x-3">
        <!-- Refresh Button -->
        <button
          @click="refreshData"
          :disabled="isLoading"
          class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 hover:scale-105 refresh-btn"
          :aria-label="isLoading ? 'Refreshing...' : 'Refresh data'"
        >
          <svg 
            :class="['h-4 w-4 transition-transform duration-200', { 'animate-spin': isLoading }]" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span class="ml-2 hidden sm:inline">{{ isLoading ? '🔄 Refreshing...' : 'Refresh' }}</span>
        </button>
        
        <!-- New Product Button -->
        <router-link
          to="/products/new"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:scale-105 new-product-btn"
        >
          <svg class="-ml-1 mr-2 h-5 w-5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Product
        </router-link>
      </div>
    </div>

    <!-- KPI Cards Section -->
    <div class="mb-8" data-testid="kpi-cards-section">
      <ProductKPICards 
        :loading="isLoadingKPIs"
        @card-click="handleKPICardClick"
        data-testid="kpi-cards"
      />
    </div>

    <!-- Search and Filters -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <!-- Search Input -->
        <div class="flex-1 max-w-md">
          <label for="search" class="sr-only">Search products</label>
          <div class="relative search-container" :class="{ 'search-focused': isSearchFocused, 'search-has-value': searchQuery.length > 0 }">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none search-icon">
              <svg class="h-5 w-5 text-gray-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              id="search"
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              placeholder="Search products..."
              class="search-input block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              @input="handleSearch"
              @focus="isSearchFocused = true"
              @blur="isSearchFocused = false"
            />
            <!-- Clear button -->
            <div v-if="searchQuery.length > 0" class="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                @click="clearSearch"
                class="text-gray-400 hover:text-gray-600 transition-colors duration-150 clear-search-btn"
                aria-label="Clear search"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Filter Controls -->
        <div class="flex items-center space-x-3">
          <!-- Category Filter -->
          <select
            v-model="filters.category"
            class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            @change="applyFilters"
          >
            <option value="">All Categories</option>
            <option value="Protein">Protein</option>
            <option value="Sauce">Sauce</option>
            <option value="Seasoning">Seasoning</option>
            <option value="Beverage">Beverage</option>
            <option value="Snack">Snack</option>
            <option value="Frozen">Frozen</option>
            <option value="Dairy">Dairy</option>
            <option value="Bakery">Bakery</option>
            <option value="Other">Other</option>
          </select>
          
          <!-- Status Filter -->
          <select
            v-model="filters.is_active"
            class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            @change="applyFilters"
          >
            <option value="">All Products</option>
            <option :value="true">Active Only</option>
            <option :value="false">Inactive Only</option>
          </select>
          
          <!-- Sort Controls -->
          <select
            v-model="sortBy"
            class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            @change="handleSort"
          >
            <option value="created_at">Sort by Created Date</option>
            <option value="name">Sort by Name</option>
            <option value="category">Sort by Category</option>
            <option value="unit_price">Sort by Price</option>
            <option value="updated_at">Sort by Updated Date</option>
          </select>
          
          <button
            @click="toggleSortOrder"
            class="p-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
            :class="{ 'bg-gray-50': sortOrder === 'desc' }"
            :aria-label="`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`"
          >
            <svg class="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                :d="sortOrder === 'asc' ? 'M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12' : 'M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4'" 
              />
            </svg>
          </button>
          
          <!-- Clear Filters -->
          <button
            v-if="hasActiveFilters"
            @click="clearFilters"
            class="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="space-y-6">
      <!-- Loading State -->
      <div v-if="isLoading && products.length === 0" class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 loading-container" data-testid="loading-spinner">
        <div class="flex justify-center mb-4">
          <div class="relative">
            <div class="loading-spinner animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div class="loading-dots">
              <div class="loading-dot"></div>
              <div class="loading-dot"></div>
              <div class="loading-dot"></div>
            </div>
          </div>
        </div>
        <p class="text-center text-gray-500 loading-text">
          <span class="loading-message">{{ loadingMessages[currentLoadingMessageIndex] }}</span>
        </p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-white rounded-lg shadow-sm border border-red-200 p-6" data-testid="error-message">
        <div class="flex items-center">
          <svg class="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-red-700">{{ error }}</span>
        </div>
        <div class="mt-4 flex space-x-3">
          <button
            @click="refreshData"
            class="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            data-testid="retry-button"
          >
            Try Again
          </button>
          <button
            @click="clearFilters"
            class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="products.length === 0 && !isLoading" class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center empty-state">
        <div class="empty-icon-container">
          <svg class="mx-auto h-12 w-12 text-gray-400 mb-4 empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          {{ hasActiveFilters ? '🔍 No products match your search' : '📦 Ready to build your catalog?' }}
        </h3>
        <p class="text-gray-500 mb-6">
          {{ hasActiveFilters 
            ? 'Don\'t worry! Try adjusting your search terms or filters to find what you\'re looking for.' 
            : 'Your product catalog is waiting to be filled with amazing products. Let\'s get started!' 
          }}
        </p>
        
        <div class="flex justify-center space-x-3">
          <router-link
            v-if="!hasActiveFilters"
            to="/products/new"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 hover:scale-105 empty-cta-btn"
          >
            <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Your First Product
          </router-link>
          
          <button
            v-if="hasActiveFilters"
            @click="clearFilters"
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 hover:scale-105"
          >
            🔄 Clear All Filters
          </button>
        </div>
      </div>

      <!-- Products Table -->
      <div v-else data-testid="product-table-section">
        <ProductTable
          :loading="isLoading"
          @row-click="handleRowClick"
          @edit="handleEdit"
          @delete="handleDelete"
          @duplicate="handleDuplicate"
          @bulk-delete="handleBulkDelete"
          @create-new="handleCreateNew"
          @sort-change="handleTableSort"
          data-testid="product-table"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '@/stores/productStore'
import ProductKPICards from '@/components/products/ProductKPICards.vue'
import ProductTable from '@/components/products/ProductTable.vue'
import type { 
  ProductWithPrincipals, 
  ProductFilters,
  ProductPagination
} from '@/types/products'

/**
 * ProductsListView - Main products list page with KPI dashboard and comprehensive filtering
 * 
 * Features:
 * - KPI cards showing total products, active products, categories, and principal assignments
 * - Advanced search and filtering capabilities (name, description, category, status, price)
 * - Sortable table with pagination
 * - Bulk operations support (activate, deactivate, soft delete, category update)
 * - Responsive design optimized for iPad and mobile
 * - Accessibility compliant with WCAG 2.1 AA standards
 * - Real-time data updates with loading states
 * 
 * Navigation:
 * - Create new products via "New Product" button
 * - Click rows to view product details
 * - Quick edit via table actions
 * - Contextual empty states with clear next actions
 * 
 * @component
 * @example
 * <ProductsListView />
 */

// Dependencies
const router = useRouter()
const productStore = useProductStore()

// ===============================
// REACTIVE STATE
// ===============================

const searchQuery = ref('')
const sortBy = ref<string>('created_at')
const sortOrder = ref<'asc' | 'desc'>('desc')
const isLoadingKPIs = ref(false)

// Delight features
const isSearchFocused = ref(false)
const searchInputRef = ref<HTMLInputElement>()

// Loading messages with personality
const loadingMessages = [
  'Loading your amazing products...',
  'Gathering product information...',
  'Building your catalog view...',
  'Almost ready to show your inventory...',
  'Preparing product showcase...'
]
const currentLoadingMessageIndex = ref(0)

// Cycle loading messages
let loadingMessageInterval: ReturnType<typeof setInterval> | null = null

// Filters
const filters = ref<ProductFilters>({
  search: '',
  category: [],
  is_active: undefined,
  price_min: undefined,
  price_max: undefined
})

// ===============================
// COMPUTED PROPERTIES
// ===============================

const products = computed(() => productStore.products)
const isLoading = computed(() => productStore.isLoading)
const error = computed(() => productStore.error)

const hasActiveFilters = computed(() => {
  return !!(
    searchQuery.value ||
    filters.value.category?.length ||
    filters.value.is_active !== undefined ||
    filters.value.price_min !== undefined ||
    filters.value.price_max !== undefined ||
    filters.value.principal_id ||
    filters.value.created_after ||
    filters.value.created_before
  )
})

// ===============================
// SEARCH & FILTERING
// ===============================

let searchTimeout: ReturnType<typeof setTimeout>

const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    applyFilters()
  }, 300)
}

const applyFilters = async () => {
  const appliedFilters: ProductFilters = {
    ...filters.value
  }
  
  // Add search query to filters
  if (searchQuery.value.trim()) {
    appliedFilters.search = searchQuery.value.trim()
  }
  
  const pagination: ProductPagination = {
    page: 1,
    limit: 20,
    sort_by: sortBy.value,
    sort_order: sortOrder.value
  }
  
  await productStore.fetchProducts({ 
    ...appliedFilters,
    ...pagination 
  })
}

const clearFilters = () => {
  searchQuery.value = ''
  filters.value = {
    search: '',
    category: [],
    is_active: undefined,
    price_min: undefined,
    price_max: undefined
  }
  sortBy.value = 'created_at'
  sortOrder.value = 'desc'
  
  applyFilters()
}

/**
 * Clear search with delightful animation
 */
const clearSearch = () => {
  searchQuery.value = ''
  
  // Focus back to search input with slight delay for animation
  setTimeout(() => {
    searchInputRef.value?.focus()
  }, 150)
  
  applyFilters()
}

// ===============================
// SORTING
// ===============================

const handleSort = () => {
  applyFilters()
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  applyFilters()
}

const handleTableSort = (column: string, order: 'asc' | 'desc') => {
  sortBy.value = column
  sortOrder.value = order
  applyFilters()
}

// ===============================
// DATA LOADING
// ===============================

const refreshData = async () => {
  await Promise.all([
    loadProducts(),
    loadKPIs()
  ])
}

const loadProducts = async () => {
  const appliedFilters: ProductFilters = {
    ...filters.value
  }
  
  if (searchQuery.value.trim()) {
    appliedFilters.search = searchQuery.value.trim()
  }
  
  const pagination: ProductPagination = {
    page: 1,
    limit: 20,
    sort_by: sortBy.value,
    sort_order: sortOrder.value
  }
  
  await productStore.fetchProducts({
    ...appliedFilters,
    ...pagination
  })
}

const loadKPIs = async () => {
  isLoadingKPIs.value = true
  try {
    await productStore.fetchStats()
  } finally {
    isLoadingKPIs.value = false
  }
}

// ===============================
// EVENT HANDLERS
// ===============================

/**
 * Handle KPI card clicks for drill-down functionality
 * @param kpiType - The type of KPI card clicked
 */
const handleKPICardClick = (kpiType: string) => {
  // Handle KPI card drill-down
  console.log('KPI card clicked:', kpiType)
  
  // Filter products based on KPI type
  switch (kpiType) {
    case 'total':
      clearFilters()
      break
    case 'active':
      filters.value.is_active = true
      applyFilters()
      break
    case 'inactive':
      filters.value.is_active = false
      applyFilters()
      break
    case 'category':
      // Could show category breakdown modal
      break
  }
}

/**
 * Navigate to product detail view
 * @param product - The product to view
 */
const handleRowClick = (product: ProductWithPrincipals) => {
  router.push(`/products/${product.id}`)
}

/**
 * Navigate to product edit form
 * @param product - The product to edit
 */
const handleEdit = (product: ProductWithPrincipals) => {
  router.push(`/products/${product.id}/edit`)
}

/**
 * Delete a product with confirmation
 * @param product - The product to delete
 */
const handleDelete = async (product: ProductWithPrincipals) => {
  if (confirm(`Are you sure you want to delete "${product.name}"? This will deactivate the product but preserve the data.`)) {
    const success = await productStore.deleteProduct(product.id)
    if (success) {
      // Product was updated in store automatically (soft delete)
      // Show success message if needed
    }
  }
}

/**
 * Create a duplicate of an existing product
 * @param product - The product to duplicate
 */
const handleDuplicate = (product: ProductWithPrincipals) => {
  // TODO: Implement product duplication
  console.log('Duplicate product:', product.id)
}

/**
 * Delete multiple products in batch
 * @param productIds - Array of product IDs to delete
 */
const handleBulkDelete = async (productIds: string[]) => {
  if (confirm(`Are you sure you want to deactivate ${productIds.length} products? This action can be reversed later.`)) {
    const operation = {
      operation: 'deactivate' as const,
      product_ids: productIds
    }
    
    const success = await productStore.performBulkOperation(operation)
    if (success) {
      // Products were updated in store automatically
    }
  }
}

/**
 * Navigate to new product creation form
 */
const handleCreateNew = () => {
  router.push('/products/new')
}

// ===============================
// LIFECYCLE
// ===============================

onMounted(async () => {
  await refreshData()
})

// Watch for route changes to refresh data
watch(() => router.currentRoute.value.fullPath, (newPath) => {
  if (newPath === '/products') {
    refreshData()
  }
})

// Watch loading state to cycle messages
watch(isLoading, (loading) => {
  if (loading && products.value.length === 0) {
    // Start cycling loading messages
    currentLoadingMessageIndex.value = 0
    loadingMessageInterval = setInterval(() => {
      currentLoadingMessageIndex.value = (currentLoadingMessageIndex.value + 1) % loadingMessages.length
    }, 2000)
  } else {
    // Clear loading message cycling
    if (loadingMessageInterval) {
      clearInterval(loadingMessageInterval)
      loadingMessageInterval = null
    }
  }
})
</script>

<style scoped>
.products-list-view {
  @apply max-w-7xl mx-auto;
}

/* ===============================
   DELIGHTFUL SEARCH ENHANCEMENTS
   =============================== */

.search-container {
  @apply transition-all duration-200;
}

.search-focused .search-icon svg {
  @apply text-blue-500 scale-110;
}

.search-has-value .search-icon svg {
  @apply text-blue-600;
}

.search-input {
  @apply transition-all duration-200;
}

.search-focused .search-input {
  @apply shadow-md ring-2 ring-blue-500 border-blue-500;
  transform: scale(1.01);
}

.clear-search-btn {
  @apply transform transition-all duration-150;
  animation: fadeInScale 0.2s ease-out;
}

.clear-search-btn:hover {
  @apply scale-110;
}

@keyframes fadeInScale {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* ===============================
   DELIGHTFUL LOADING STATES
   =============================== */

.loading-container {
  @apply relative;
  animation: slideInUp 0.3s ease-out;
}

.loading-spinner {
  @apply relative z-10;
}

.loading-dots {
  @apply absolute top-12 left-1/2 transform -translate-x-1/2 flex space-x-1;
}

.loading-dot {
  @apply w-2 h-2 bg-blue-400 rounded-full;
  animation: loadingDots 1.5s infinite ease-in-out;
}

.loading-dot:nth-child(2) {
  animation-delay: 0.3s;
}

.loading-dot:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes loadingDots {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

.loading-message {
  @apply transition-all duration-300 inline-block;
  animation: messageSlide 0.3s ease-out;
}

@keyframes messageSlide {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===============================
   DELIGHTFUL EMPTY STATES
   =============================== */

.empty-state {
  animation: slideInUp 0.4s ease-out;
}

.empty-icon-container {
  @apply mb-4;
}

.empty-icon {
  @apply transition-transform duration-300;
  animation: floatBob 3s infinite ease-in-out;
}

.empty-cta-btn {
  @apply transform transition-all duration-200;
  animation: ctaPulse 2s infinite;
}

.empty-cta-btn:hover {
  animation: none;
}

@keyframes floatBob {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes ctaPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
  }
}

@keyframes slideInUp {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===============================
   DELIGHTFUL BUTTON ENHANCEMENTS
   =============================== */

.refresh-btn:hover:not(:disabled) {
  @apply shadow-md;
}

.refresh-btn:hover:not(:disabled) svg {
  transform: rotate(180deg);
}

.refresh-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.new-product-btn:hover svg {
  transform: rotate(90deg) scale(1.1);
}

.new-product-btn:active {
  transform: scale(0.95);
}

/* ===============================
   LEGACY STYLES (PRESERVED)
   =============================== */

/* Loading states */
.loading-overlay {
  @apply absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center;
}

/* Filter controls */
.filter-controls select:focus {
  @apply ring-2 ring-blue-500 border-blue-500;
}

/* Responsive design */
@media (max-width: 1024px) {
  .products-list-view {
    @apply px-4;
  }
}

@media (max-width: 768px) {
  .products-list-view {
    @apply px-2;
  }
  
  /* Stack filters vertically on mobile */
  .filter-controls {
    @apply flex-col space-y-3;
  }
  
  .filter-controls > div {
    @apply space-x-0 space-y-2 flex-col;
  }
}

/* Accessibility enhancements */
@media (prefers-reduced-motion: reduce) {
  .animate-spin {
    animation: none;
  }
  
  * {
    transition: none !important;
  }
  
  .search-focused .search-input {
    transform: none;
  }
  
  .clear-search-btn {
    animation: none;
  }
  
  .loading-container {
    animation: none;
  }
  
  .loading-dots .loading-dot {
    animation: none;
  }
  
  .loading-message {
    animation: none;
  }
  
  .empty-state {
    animation: none;
  }
  
  .empty-icon {
    animation: none;
  }
  
  .empty-cta-btn {
    animation: none;
  }
  
  .refresh-btn:hover:not(:disabled) svg {
    transform: none;
  }
  
  .new-product-btn:hover svg {
    transform: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .bg-white {
    @apply border-2 border-gray-800;
  }
  
  .text-gray-400 {
    @apply text-gray-800;
  }
  
  .text-gray-500 {
    @apply text-gray-900;
  }
}

/* Print styles */
@media print {
  .products-list-view {
    @apply shadow-none;
  }
  
  .bg-blue-600,
  .bg-blue-700 {
    @apply bg-gray-800 !important;
  }
  
  button {
    @apply hidden;
  }
}
</style>