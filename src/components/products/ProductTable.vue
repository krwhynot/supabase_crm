<template>
  <div class="product-table-container">
    <!-- Celebration Confetti for Bulk Operations -->    
    <div 
      v-if="showConfetti" 
      class="celebration-confetti absolute inset-0 pointer-events-none z-50"
      aria-hidden="true"
    >
      <div class="confetti-piece" v-for="n in 20" :key="n" :style="getConfettiStyle(n)">
        {{ getConfettiEmoji(n) }}
      </div>
    </div>

    <!-- Table Header with Bulk Actions -->
    <div v-if="selectedProducts.length > 0" class="bg-blue-50 border border-blue-200 rounded-t-lg p-4 bulk-actions-bar">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <span class="text-sm font-medium text-blue-900 selection-count">
            <span class="selection-icon">{{ getSelectionIcon(selectedProducts.length) }}</span>
            {{ selectedProducts.length }} product{{ selectedProducts.length === 1 ? '' : 's' }} selected
            <span class="selection-encouragement">{{ getSelectionEncouragement(selectedProducts.length) }}</span>
          </span>
          <button
            @click="clearSelection"
            class="text-blue-600 hover:text-blue-800 text-sm font-medium transition-all duration-150 hover:scale-105"
          >
            Clear selection
          </button>
        </div>
        <div class="flex items-center space-x-2">
          <button
            @click="bulkActivate"
            class="bulk-action-btn activate-btn px-3 py-1 text-sm font-medium text-green-700 bg-green-100 border border-green-200 rounded-md hover:bg-green-200 transition-all duration-200"
          >
            <span class="action-icon">✨</span> Activate
          </button>
          <button
            @click="bulkDeactivate"
            class="bulk-action-btn deactivate-btn px-3 py-1 text-sm font-medium text-yellow-700 bg-yellow-100 border border-yellow-200 rounded-md hover:bg-yellow-200 transition-all duration-200"
          >
            <span class="action-icon">⏸️</span> Pause
          </button>
          <button
            @click="bulkDelete"
            class="bulk-action-btn delete-btn px-3 py-1 text-sm font-medium text-red-700 bg-red-100 border border-red-200 rounded-md hover:bg-red-200 transition-all duration-200"
          >
            <span class="action-icon">🗑️</span> Archive
          </button>
        </div>
      </div>
    </div>

    <!-- Products Table -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  :checked="allSelected"
                  :indeterminate.prop="someSelected"
                  @change="toggleSelectAll"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  aria-label="Select all products"
                />
              </th>
              
              <th 
                scope="col" 
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                @click="sortBy('name')"
              >
                <div class="flex items-center space-x-1">
                  <span>Product</span>
                  <svg v-if="currentSort === 'name'" class="h-4 w-4" :class="sortDirection === 'asc' ? 'transform rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </th>
              
              <th 
                scope="col" 
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                @click="sortBy('category')"
              >
                <div class="flex items-center space-x-1">
                  <span>Category</span>
                  <svg v-if="currentSort === 'category'" class="h-4 w-4" :class="sortDirection === 'asc' ? 'transform rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </th>
              
              <th 
                scope="col" 
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                @click="sortBy('unit_price')"
              >
                <div class="flex items-center space-x-1">
                  <span>Price</span>
                  <svg v-if="currentSort === 'unit_price'" class="h-4 w-4" :class="sortDirection === 'asc' ? 'transform rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </th>
              
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Principals
              </th>
              
              <th 
                scope="col" 
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                @click="sortBy('created_at')"
              >
                <div class="flex items-center space-x-1">
                  <span>Created</span>
                  <svg v-if="currentSort === 'created_at'" class="h-4 w-4" :class="sortDirection === 'asc' ? 'transform rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </th>
              
              <th scope="col" class="relative px-6 py-3">
                <span class="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          
          <tbody class="bg-white divide-y divide-gray-200">
            <!-- Loading Skeleton Rows -->
            <tr v-if="loading && products.length === 0" v-for="n in 3" :key="`skeleton-${n}`" class="skeleton-row">
              <td class="px-4 py-4">
                <div class="skeleton-checkbox"></div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center">
                  <div class="skeleton-icon"></div>
                  <div class="ml-4 space-y-2">
                    <div class="skeleton-text skeleton-product-name"></div>
                    <div class="skeleton-text skeleton-sku"></div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="skeleton-badge"></div>
              </td>
              <td class="px-6 py-4">
                <div class="skeleton-text skeleton-price"></div>
              </td>
              <td class="px-6 py-4">
                <div class="skeleton-status-badge"></div>
              </td>
              <td class="px-6 py-4">
                <div class="skeleton-text skeleton-principals"></div>
              </td>
              <td class="px-6 py-4">
                <div class="skeleton-text skeleton-date"></div>
              </td>
              <td class="px-6 py-4">
                <div class="flex space-x-2">
                  <div class="skeleton-action-btn"></div>
                  <div class="skeleton-action-btn"></div>
                  <div class="skeleton-action-btn"></div>
                </div>
              </td>
            </tr>
            
            <!-- Delightful Empty State -->
            <tr v-if="!loading && products.length === 0" class="empty-state-row">
              <td colspan="8" class="px-6 py-16 text-center">
                <div class="empty-state-container">
                  <div class="empty-state-illustration">
                    <div class="empty-box">
                      <div class="empty-box-lid"></div>
                      <div class="empty-box-body">
                        <span class="empty-search-icon">🔍</span>
                      </div>
                    </div>
                  </div>
                  <div class="empty-state-content">
                    <h3 class="empty-state-title">
                      {{ getEmptyStateTitle() }}
                    </h3>
                    <p class="empty-state-message">
                      {{ getEmptyStateMessage() }}
                    </p>
                    <button 
                      @click="handleCreateNew"
                      class="empty-state-cta"
                    >
                      <span class="cta-icon">✨</span>
                      {{ getEmptyStateCTA() }}
                      <span class="cta-arrow">→</span>
                    </button>
                  </div>
                </div>
              </td>
            </tr>
            
            <!-- Product Rows -->
            <tr
              v-for="(product, index) in products"
              :key="product.id"
              class="product-row hover:bg-gray-50 cursor-pointer transition-all duration-200 ease-out"
              :class="{
                'row-selected': selectedProducts.includes(product.id),
                'row-staggered': true
              }"
              :style="{ animationDelay: `${index * 50}ms` }"
              @click="handleRowClick(product)"
              @mouseenter="handleRowHover(product, true)"
              @mouseleave="handleRowHover(product, false)"
            >
              <td class="px-4 py-4" @click.stop>
                <input
                  type="checkbox"
                  :value="product.id"
                  v-model="selectedProducts"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  :aria-label="`Select ${product.name}`"
                />
              </td>
              
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div class="product-icon-container h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center transition-all duration-300">
                      <span class="product-icon text-lg transition-transform duration-200">{{ getCategoryIcon(product.category) }}</span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ product.name }}
                    </div>
                    <div v-if="product.sku" class="text-sm text-gray-500">
                      SKU: {{ product.sku }}
                    </div>
                  </div>
                </div>
              </td>
              
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  v-if="product.category"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getCategoryBadgeClass(product.category)"
                >
                  {{ product.category }}
                </span>
                <span v-else class="text-gray-400 text-sm">No category</span>
              </td>
              
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span v-if="product.unit_price">
                  ${{ formatPrice(product.unit_price) }}
                </span>
                <span v-else class="text-gray-400">Not set</span>
              </td>
              
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="product.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                  "
                >
                  {{ product.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div class="flex items-center">
                  <svg class="h-4 w-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{{ product.principal_count || 0 }}</span>
                </div>
              </td>
              
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(product.created_at) }}
              </td>
              
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center space-x-2">
                  <button
                    @click.stop="handleEdit(product)"
                    class="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50"
                    :aria-label="`Edit ${product.name}`"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  
                  <button
                    @click.stop="handleDuplicate(product)"
                    class="text-gray-600 hover:text-gray-900 p-1 rounded-md hover:bg-gray-50"
                    :aria-label="`Duplicate ${product.name}`"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  
                  <button
                    @click.stop="handleDelete(product)"
                    class="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                    :aria-label="`Delete ${product.name}`"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Enhanced Pagination with Delight -->
    <div v-if="products.length > 0" class="pagination-footer bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
    <div class="flex items-center justify-between">
    <div class="flex items-center space-x-2 text-sm text-gray-700">
    <span class="product-count-icon">📊</span>
      <span>Showing {{ products.length }} products</span>
      <span v-if="selectedProducts.length > 0" class="selected-indicator">
          ({{ selectedProducts.length }} selected)
          </span>
        </div>
        <div v-if="products.length >= 25" class="text-sm text-gray-500">
          <span class="pagination-hint">💡 Tip: Use search to find specific products faster!</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProductStore } from '@/stores/productStore'
import type { ProductWithPrincipals, ProductCategory } from '@/types/products'
import { CATEGORY_ICONS } from '@/types/products'

/**
 * Props interface for ProductTable component
 */
interface Props {
  /** Whether to show loading state */
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: false
})

/**
 * Component emits
 */
const emit = defineEmits<{
  /** Emitted when a product row is clicked */
  rowClick: [product: ProductWithPrincipals]
  /** Emitted when edit action is triggered */
  edit: [product: ProductWithPrincipals]
  /** Emitted when delete action is triggered */
  delete: [product: ProductWithPrincipals]
  /** Emitted when duplicate action is triggered */
  duplicate: [product: ProductWithPrincipals]
  /** Emitted when bulk delete is triggered */
  bulkDelete: [productIds: string[]]
  /** Emitted when create new is triggered */
  createNew: []
  /** Emitted when sort changes */
  sortChange: [column: string, direction: 'asc' | 'desc']
}>()

// ===============================
// STORE INTEGRATION
// ===============================

const productStore = useProductStore()
const products = computed(() => productStore.products)

// ===============================
// REACTIVE STATE
// ===============================

const selectedProducts = ref<string[]>([])
const currentSort = ref<string>('created_at')
const sortDirection = ref<'asc' | 'desc'>('desc')

// Delight enhancement states
const showConfetti = ref(false)
const hoveredProduct = ref<string | null>(null)
const celebrationMessage = ref('')

// ===============================
// COMPUTED PROPERTIES
// ===============================

const allSelected = computed(() => {
  return products.value.length > 0 && selectedProducts.value.length === products.value.length
})

const someSelected = computed(() => {
  return selectedProducts.value.length > 0 && selectedProducts.value.length < products.value.length
})

// ===============================
// SELECTION HANDLERS
// ===============================

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedProducts.value = []
  } else {
    selectedProducts.value = products.value.map(p => p.id)
  }
}

const clearSelection = () => {
  selectedProducts.value = []
}

// ===============================
// BULK OPERATIONS
// ===============================

const bulkActivate = async () => {
  if (selectedProducts.value.length === 0) return
  
  const operation = {
    operation: 'activate' as const,
    product_ids: selectedProducts.value,
    parameters: { is_active: true }
  }
  
  const success = await productStore.performBulkOperation(operation)
  if (success) {
    const count = selectedProducts.value.length
    triggerCelebration(`🎉 Successfully activated ${count} product${count === 1 ? '' : 's'}!`)
    clearSelection()
  }
}

const bulkDeactivate = async () => {
  if (selectedProducts.value.length === 0) return
  
  const operation = {
    operation: 'deactivate' as const,
    product_ids: selectedProducts.value,
    parameters: { is_active: false }
  }
  
  const success = await productStore.performBulkOperation(operation)
  if (success) {
    const count = selectedProducts.value.length
    triggerCelebration(`⏸️ Paused ${count} product${count === 1 ? '' : 's'} successfully!`)
    clearSelection()
  }
}

const bulkDelete = () => {
  if (selectedProducts.value.length === 0) return
  
  const count = selectedProducts.value.length
  emit('bulkDelete', [...selectedProducts.value])
  
  // Trigger celebration after successful deletion (handled by parent)
  setTimeout(() => {
    triggerCelebration(`🗄️ Archived ${count} product${count === 1 ? '' : 's'} safely!`)
  }, 500)
  
  clearSelection()
}

// ===============================
// SORTING
// ===============================

const sortBy = (column: string) => {
  if (currentSort.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    currentSort.value = column
    sortDirection.value = 'asc'
  }
  
  emit('sortChange', column, sortDirection.value)
}

// ===============================
// EVENT HANDLERS
// ===============================

const handleRowClick = (product: ProductWithPrincipals) => {
  emit('rowClick', product)
}

const handleEdit = (product: ProductWithPrincipals) => {
  emit('edit', product)
}

const handleDelete = (product: ProductWithPrincipals) => {
  emit('delete', product)
}

const handleDuplicate = (product: ProductWithPrincipals) => {
  emit('duplicate', product)
}

const handleCreateNew = () => {
  emit('createNew')
}

const handleRowHover = (product: ProductWithPrincipals, isHovering: boolean) => {
  hoveredProduct.value = isHovering ? product.id : null
}

// ===============================
// UTILITY FUNCTIONS
// ===============================

const getCategoryIcon = (category: ProductCategory | null): string => {
  if (!category) return '📦'
  return CATEGORY_ICONS[category] || '📦'
}

const getCategoryBadgeClass = (category: ProductCategory): string => {
  const colorMap = {
    'Protein': 'bg-red-100 text-red-800',
    'Sauce': 'bg-orange-100 text-orange-800',
    'Seasoning': 'bg-green-100 text-green-800',
    'Beverage': 'bg-blue-100 text-blue-800',
    'Snack': 'bg-yellow-100 text-yellow-800',
    'Frozen': 'bg-cyan-100 text-cyan-800',
    'Dairy': 'bg-purple-100 text-purple-800',
    'Bakery': 'bg-pink-100 text-pink-800',
    'Other': 'bg-gray-100 text-gray-800'
  }
  
  return colorMap[category] || 'bg-gray-100 text-gray-800'
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price)
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Unknown'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// ===============================
// DELIGHT ENHANCEMENT FUNCTIONS
// ===============================

/**
 * Trigger celebration confetti for successful bulk operations
 */
const triggerCelebration = (message: string) => {
  celebrationMessage.value = message
  showConfetti.value = true
  
  // Auto-hide after animation completes
  setTimeout(() => {
    showConfetti.value = false
    celebrationMessage.value = ''
  }, 3000)
}

/**
 * Get dynamic selection icon based on count
 */
const getSelectionIcon = (count: number): string => {
  if (count === 1) return '🎯'
  if (count <= 5) return '📦'
  if (count <= 10) return '📋'
  return '🚀'
}

/**
 * Get encouraging selection message
 */
const getSelectionEncouragement = (count: number): string => {
  if (count === 1) return ' - Ready for action!'
  if (count <= 3) return ' - Great choice!'
  if (count <= 10) return ' - Looking good!'
  return ' - Impressive selection!'
}

/**
 * Get confetti emoji for celebration
 */
const getConfettiEmoji = (index: number): string => {
  const emojis = ['🎉', '✨', '🎊', '⭐', '💫', '🌟', '🎈']
  return emojis[index % emojis.length]
}

/**
 * Generate random confetti positioning styles
 */
const getConfettiStyle = (index: number) => {
  const delay = Math.random() * 2 + (index * 0.1) // Use index for staggered timing
  const left = Math.random() * 100
  const animationDuration = 2 + Math.random() * 3
  
  return {
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${animationDuration}s`
  }
}

/**
 * Get contextual empty state title
 */
const getEmptyStateTitle = (): string => {
  // For now, assume no active filters - this should be connected to actual filter state
  const hasActiveFilters = false
  
  if (hasActiveFilters) {
    return "No products match your search"
  }
  
  return "Your product catalog awaits!"
}

/**
 * Get contextual empty state message
 */
const getEmptyStateMessage = (): string => {
  // For now, assume no active filters - this should be connected to actual filter state
  const hasActiveFilters = false
  
  if (hasActiveFilters) {
    return "Try adjusting your filters or search terms. Every great discovery starts with exploration!"
  }
  
  return "Time to stock up! Add your first products and start building relationships with your principals. Every successful business begins with great products."
}

/**
 * Get contextual call-to-action text
 */
const getEmptyStateCTA = (): string => {
  // For now, assume no active filters - this should be connected to actual filter state
  const hasActiveFilters = false
  
  if (hasActiveFilters) {
    return "Clear filters"
  }
  
  return "Add your first product"
}
</script>

<style scoped>
.product-table-container {
  @apply space-y-0 relative;
}

/* ===============================
   CELEBRATION CONFETTI SYSTEM
   =============================== */

.celebration-confetti {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 9999;
}

.confetti-piece {
  position: absolute;
  top: -10px;
  font-size: 24px;
  animation: confettiFall linear forwards;
  user-select: none;
}

@keyframes confettiFall {
  0% {
    transform: translateY(-10px) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(360deg);
    opacity: 0;
  }
}

/* ===============================
   BULK ACTIONS DELIGHT
   =============================== */

.bulk-actions-bar {
  animation: slideInDown 0.3s ease-out;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(147, 197, 253, 0.1));
  border: 1px solid rgba(59, 130, 246, 0.2);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.selection-count {
  animation: fadeInScale 0.2s ease-out;
  @apply flex items-center space-x-1;
}

.selection-icon {
  @apply inline-block;
  animation: bounce 0.5s ease-in-out;
}

.selection-encouragement {
  @apply text-blue-700 font-semibold ml-1;
  animation: fadeInRight 0.3s ease-out 0.2s both;
}

.bulk-action-btn {
  @apply transform transition-all duration-200 relative overflow-hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.bulk-action-btn:hover {
  @apply scale-105 shadow-lg;
  transform: scale(1.05) translateY(-1px);
}

.bulk-action-btn:active {
  @apply scale-95;
  transform: scale(0.95) translateY(0);
}

.bulk-action-btn .action-icon {
  @apply inline-block transition-transform duration-200;
}

.bulk-action-btn:hover .action-icon {
  transform: scale(1.2) rotate(10deg);
}

/* Specific button enhancements */
.activate-btn:hover {
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  border-color: #16a34a;
}

.deactivate-btn:hover {
  background: linear-gradient(135deg, #fefce8, #fde047);
  border-color: #ca8a04;
}

.delete-btn:hover {
  background: linear-gradient(135deg, #fecaca, #fca5a5);
  border-color: #dc2626;
}

/* ===============================
   SKELETON LOADING SYSTEM
   =============================== */

.skeleton-row {
  animation: skeletonAppear 0.3s ease-out;
}

.skeleton-checkbox,
.skeleton-icon,
.skeleton-text,
.skeleton-badge,
.skeleton-status-badge,
.skeleton-action-btn {
  @apply bg-gray-200 rounded;
  animation: skeletonPulse 1.5s ease-in-out infinite;
}

.skeleton-checkbox {
  @apply w-4 h-4;
}

.skeleton-icon {
  @apply w-10 h-10 rounded-lg;
}

.skeleton-product-name {
  @apply h-4 w-32;
}

.skeleton-sku {
  @apply h-3 w-20;
}

.skeleton-badge {
  @apply h-6 w-16 rounded-full;
}

.skeleton-price {
  @apply h-4 w-16;
}

.skeleton-status-badge {
  @apply h-6 w-14 rounded-full;
}

.skeleton-principals {
  @apply h-4 w-8;
}

.skeleton-date {
  @apply h-4 w-20;
}

.skeleton-action-btn {
  @apply w-8 h-8 rounded-md;
}

@keyframes skeletonPulse {
  0%, 100% {
    opacity: 1;
    background-color: rgb(229, 231, 235);
  }
  50% {
    opacity: 0.7;
    background-color: rgb(209, 213, 219);
  }
}

@keyframes skeletonAppear {
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
   DELIGHTFUL EMPTY STATE
   =============================== */

.empty-state-row {
  animation: fadeInUp 0.5s ease-out;
}

.empty-state-container {
  @apply max-w-md mx-auto;
}

.empty-state-illustration {
  @apply mb-6;
  animation: float 3s ease-in-out infinite;
}

.empty-box {
  @apply relative mx-auto;
  width: 80px;
  height: 60px;
}

.empty-box-lid {
  @apply bg-gray-300 rounded-t-lg absolute top-0 left-2 right-2;
  height: 8px;
  animation: lidBob 2s ease-in-out infinite;
}

.empty-box-body {
  @apply bg-gray-200 border-2 border-gray-300 rounded-lg flex items-center justify-center;
  height: 52px;
  margin-top: 8px;
}

.empty-search-icon {
  @apply text-2xl;
  animation: searchPulse 2s ease-in-out infinite;
}

.empty-state-content {
  @apply space-y-4;
}

.empty-state-title {
  @apply text-xl font-semibold text-gray-900;
  animation: fadeInUp 0.5s ease-out 0.2s both;
}

.empty-state-message {
  @apply text-gray-600 leading-relaxed;
  animation: fadeInUp 0.5s ease-out 0.4s both;
}

.empty-state-cta {
  @apply inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg transition-all duration-200 hover:bg-blue-700 hover:shadow-lg transform hover:scale-105;
  animation: fadeInUp 0.5s ease-out 0.6s both;
}

.empty-state-cta:active {
  transform: scale(0.98);
}

.cta-icon {
  animation: sparkle 2s ease-in-out infinite;
}

.cta-arrow {
  @apply transition-transform duration-200;
}

.empty-state-cta:hover .cta-arrow {
  transform: translateX(4px);
}

/* Empty state animations */
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes lidBob {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@keyframes searchPulse {
  0%, 100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

@keyframes sparkle {
  0%, 100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1) rotate(5deg);
  }
}

/* ===============================
   ENHANCED PRODUCT ROWS
   =============================== */

.product-row {
  @apply transform transition-all duration-200 relative;
}

.row-staggered {
  opacity: 0;
  animation: rowAppear 0.3s ease-out forwards;
}

.product-row:hover {
  @apply bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md;
  transform: translateX(4px) scale(1.01);
  z-index: 10;
}

.product-row:active {
  transform: translateX(2px) scale(0.99);
}

.row-selected {
  @apply bg-gradient-to-r from-blue-100 to-indigo-100 border-l-4 border-blue-500;
  animation: selectedGlow 0.3s ease-out;
}

.product-icon-container {
  @apply relative overflow-hidden;
}

.product-row:hover .product-icon-container {
  @apply bg-gradient-to-br from-blue-100 to-indigo-100;
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.2);
}

.product-icon {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.product-row:hover .product-icon {
  transform: scale(1.2) rotate(5deg);
  filter: brightness(1.1);
}

/* ===============================
   COMMON ANIMATION KEYFRAMES
   =============================== */

@keyframes slideInDown {
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInRight {
  0% {
    opacity: 0;
    transform: translateX(-10px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translateY(0) scale(1);
  }
  40%, 43% {
    transform: translateY(-8px) scale(1.1);
  }
  70% {
    transform: translateY(-4px) scale(1.05);
  }
  90% {
    transform: translateY(-2px) scale(1.02);
  }
}

@keyframes rowAppear {
  0% {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes selectedGlow {
  0% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
}

/* ===============================
   CHECKBOX & FORM ENHANCEMENTS
   =============================== */

/* Enhanced checkbox styling */
input[type="checkbox"] {
  @apply transition-all duration-200;
}

input[type="checkbox"]:checked {
  animation: checkboxPop 0.2s ease-out;
}

input[type="checkbox"]:indeterminate {
  @apply bg-blue-600 border-blue-600;
  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M4 8h8' stroke='white' stroke-width='2' stroke-linecap='round'/%3e%3c/svg%3e");
  animation: checkboxIndeterminate 0.2s ease-out;
}

/* Action button enhancements */
button:hover svg {
  @apply transform scale-110 transition-transform duration-150;
}

/* ===============================
   RESPONSIVE DESIGN
   =============================== */

@media (max-width: 768px) {
  .product-table-container {
    @apply text-sm;
  }
  
  th, td {
    @apply px-3 py-2;
  }
  
  .bulk-actions-bar {
    @apply flex-col space-y-3;
  }
  
  .bulk-actions-bar .flex {
    @apply justify-center;
  }
  
  .confetti-piece {
    font-size: 20px;
  }
}

@media (max-width: 640px) {
  .empty-state-illustration {
    transform: scale(0.8);
  }
  
  .empty-state-title {
    @apply text-lg;
  }
  
  .empty-state-message {
    @apply text-sm;
  }
}

/* ===============================
   ACCESSIBILITY ENHANCEMENTS
   =============================== */

/* Focus management */
button:focus-visible {
  @apply ring-2 ring-blue-500 ring-offset-1 outline-none;
  animation: focusRing 0.3s ease-out;
}

tr:focus-within {
  @apply bg-blue-50;
}

/* Screen reader optimizations */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* ===============================
   REDUCED MOTION SUPPORT
   =============================== */

@media (prefers-reduced-motion: reduce) {
  /* Disable all animations */
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  /* Keep essential transforms for functionality */
  .bulk-action-btn:hover {
    transform: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .product-row:hover {
    transform: none;
    background-color: rgb(239, 246, 255);
  }
  
  /* Disable confetti system */
  .celebration-confetti {
    display: none;
  }
}

/* ===============================
   PRINT STYLES
   =============================== */

@media print {
  .product-table-container button,
  .bulk-actions-bar,
  .celebration-confetti {
    @apply hidden;
  }
  
  input[type="checkbox"] {
    @apply hidden;
  }
  
  th:first-child,
  td:first-child,
  th:last-child,
  td:last-child {
    @apply hidden;
  }
  
  .product-row {
    page-break-inside: avoid;
  }
}

/* ===============================
   ADDITIONAL KEYFRAMES
   =============================== */

@keyframes checkboxPop {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes checkboxIndeterminate {
  0% {
    transform: scale(1) rotate(0deg);
  }
  50% {
    transform: scale(1.1) rotate(5deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}

@keyframes focusRing {
  0% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
  }
  100% {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  }
}

/* ===============================
   HIGH CONTRAST MODE SUPPORT
   =============================== */

@media (prefers-contrast: high) {
  .product-row:hover {
    background-color: HighlightText;
    color: Highlight;
  }
  
  .bulk-action-btn {
    border: 2px solid ButtonText;
  }
  
  .empty-state-cta {
    border: 2px solid ButtonText;
  }
}

/* ===============================
   PERFORMANCE OPTIMIZATIONS
   =============================== */

/* GPU acceleration for smooth animations */
.product-row,
.bulk-action-btn,
.confetti-piece,
.empty-state-illustration {
  will-change: transform;
  backface-visibility: hidden;
}

/* Optimize repaints */
.skeleton-row * {
  contain: layout style paint;
}

.product-icon-container {
  contain: layout;
}

/* ===============================
   DARK MODE SUPPORT (if implemented)
   =============================== */

@media (prefers-color-scheme: dark) {
  .empty-box-lid {
    @apply bg-gray-600;
  }
  
  .empty-box-body {
    @apply bg-gray-700 border-gray-600;
  }
  
  .skeleton-checkbox,
  .skeleton-icon,
  .skeleton-text,
  .skeleton-badge,
  .skeleton-status-badge,
  .skeleton-action-btn {
    @apply bg-gray-700;
  }
}

/* ===============================
   ENHANCED PAGINATION FOOTER
   =============================== */

.pagination-footer {
  @apply transition-all duration-200;
  background: linear-gradient(180deg, rgba(249, 250, 251, 0.8), rgba(255, 255, 255, 1));
}

.product-count-icon {
  @apply inline-block;
  animation: countPulse 2s ease-in-out infinite;
}

.selected-indicator {
  @apply text-blue-600 font-semibold;
  animation: selectedBadge 0.3s ease-out;
}

.pagination-hint {
  @apply italic;
  animation: hintSlide 0.5s ease-out;
}

@keyframes countPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes selectedBadge {
  0% {
    opacity: 0;
    transform: translateX(-10px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes hintSlide {
  0% {
    opacity: 0;
    transform: translateX(10px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

/* ===============================
   TOOLTIP SYSTEM (for future use)
   =============================== */

.tooltip-trigger {
  @apply relative;
}

.tooltip-trigger::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-4px);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s, transform 0.2s;
  z-index: 1000;
}

.tooltip-trigger:hover::after {
  opacity: 1;
  transform: translateX(-50%) translateY(-8px);
}

/* ===============================
   FUTURE ENHANCEMENT PLACEHOLDERS
   =============================== */

/* Reserved for drag-and-drop styling */
.drag-over {
  @apply border-2 border-dashed border-blue-400 bg-blue-50;
}

/* Reserved for advanced filtering UI */
.filter-active {
  @apply ring-2 ring-blue-400 ring-opacity-50;
}

/* Reserved for export functionality */
.export-progress {
  @apply relative overflow-hidden;
}

.export-progress::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: exportShimmer 2s infinite;
}

@keyframes exportShimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}
</style>