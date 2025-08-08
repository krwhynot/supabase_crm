<template>
  <div class="product-table-container">
    <!-- Table Header with Bulk Actions -->
    <div v-if="selectedProducts.length > 0" class="bg-blue-50 border border-blue-200 rounded-t-lg p-4 bulk-actions-bar">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <span class="text-sm font-medium text-blue-900 selection-count">
            🎯 {{ selectedProducts.length }} product{{ selectedProducts.length === 1 ? '' : 's' }} selected
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
            class="bulk-action-btn px-3 py-1 text-sm font-medium text-green-700 bg-green-100 border border-green-200 rounded-md hover:bg-green-200 transition-all duration-200"
          >
            ✅ Activate
          </button>
          <button
            @click="bulkDeactivate"
            class="bulk-action-btn px-3 py-1 text-sm font-medium text-yellow-700 bg-yellow-100 border border-yellow-200 rounded-md hover:bg-yellow-200 transition-all duration-200"
          >
            ⏸️ Deactivate
          </button>
          <button
            @click="bulkDelete"
            class="bulk-action-btn px-3 py-1 text-sm font-medium text-red-700 bg-red-100 border border-red-200 rounded-md hover:bg-red-200 transition-all duration-200"
          >
            🗑️ Delete
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
            <!-- Loading Row -->
            <tr v-if="loading && products.length === 0" class="table-loading-row">
              <td colspan="8" class="px-6 py-12 text-center">
                <div class="flex justify-center mb-4">
                  <div class="relative">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <div class="absolute inset-0 rounded-full border-t-2 border-blue-200"></div>
                  </div>
                </div>
                <p class="text-gray-500 table-loading-text">
                  ⏳ Loading your product catalog...
                </p>
              </td>
            </tr>
            
            <!-- Product Rows -->
            <tr
              v-for="product in products"
              :key="product.id"
              class="product-row hover:bg-gray-50 cursor-pointer transition-all duration-200 ease-out"
              @click="handleRowClick(product)"
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
                    <div class="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <span class="text-lg">{{ getCategoryIcon(product.category) }}</span>
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

    <!-- Pagination -->
    <div v-if="products.length > 0" class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-700">
          Showing {{ products.length }} products
        </div>
        <!-- Pagination controls would go here if needed -->
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
    clearSelection()
  }
}

const bulkDelete = () => {
  if (selectedProducts.value.length === 0) return
  
  emit('bulkDelete', [...selectedProducts.value])
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
</script>

<style scoped>
.product-table-container {
  @apply space-y-0;
}

/* ===============================
   DELIGHTFUL TABLE ENHANCEMENTS
   =============================== */

/* Bulk actions bar */
.bulk-actions-bar {
  animation: slideInDown 0.3s ease-out;
}

.selection-count {
  animation: fadeInScale 0.2s ease-out;
}

.bulk-action-btn {
  @apply transform transition-all duration-200;
}

.bulk-action-btn:hover {
  @apply scale-105 shadow-md;
}

.bulk-action-btn:active {
  @apply scale-95;
}

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

/* Product row enhancements */
.product-row {
  @apply transform transition-all duration-200;
}

.product-row:hover {
  @apply bg-blue-50 shadow-sm;
  transform: translateX(2px);
}

.product-row:active {
  transform: translateX(0) scale(0.995);
}

/* Table loading enhancements */
.table-loading-row {
  animation: pulseGlow 2s infinite;
}

.table-loading-text {
  @apply text-blue-600 font-medium;
  animation: textPulse 1.5s infinite;
}

@keyframes pulseGlow {
  0%, 100% {
    background-color: rgba(249, 250, 251, 1);
  }
  50% {
    background-color: rgba(239, 246, 255, 0.5);
  }
}

@keyframes textPulse {
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

/* Enhanced row hover effects (legacy preserved) */
tbody tr:hover {
  @apply bg-gray-50;
}

/* Improve checkbox styling */
input[type="checkbox"]:indeterminate {
  @apply bg-blue-600 border-blue-600;
  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M5.707 7.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4a1 1 0 0 0-1.414-1.414L7 8.586 5.707 7.293z'/%3e%3c/svg%3e");
}

/* Action button hover effects */
button:hover svg {
  @apply transform scale-110 transition-transform duration-150;
}

/* Responsive table */
@media (max-width: 768px) {
  .product-table-container {
    @apply text-sm;
  }
  
  th, td {
    @apply px-3 py-2;
  }
}

/* Accessibility improvements */
button:focus-visible {
  @apply ring-2 ring-blue-500 ring-offset-1 outline-none;
}

tr:focus-within {
  @apply bg-blue-50;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .bulk-actions-bar {
    animation: none;
  }
  
  .selection-count {
    animation: none;
  }
  
  .bulk-action-btn {
    transition: none;
  }
  
  .bulk-action-btn:hover {
    transform: none;
  }
  
  .product-row {
    transition: none;
  }
  
  .product-row:hover {
    transform: none;
  }
  
  .table-loading-row {
    animation: none;
  }
  
  .table-loading-text {
    animation: none;
  }
}

/* Print styles */
@media print {
  .product-table-container button {
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
}
</style>