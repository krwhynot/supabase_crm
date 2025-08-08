<!--
  Principal Product Table - Display product performance data in table format
  Features: Sortable columns, performance indicators, responsive design
-->
<template>
  <div class="principal-product-table">
    <!-- Table Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h3 class="text-lg font-medium text-gray-900">Product Performance</h3>
        <p class="mt-1 text-sm text-gray-600">
          Performance metrics for products associated with {{ principalName }}
        </p>
      </div>
      
      <div class="flex items-center space-x-3 mt-4 sm:mt-0">
        <!-- View Toggle -->
        <div class="flex rounded-md shadow-sm">
          <button
            @click="viewMode = 'table'"
            :class="[
              'px-4 py-2 text-sm font-medium border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10',
              viewMode === 'table' 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            ]"
          >
            Table
          </button>
          <button
            @click="viewMode = 'cards'"
            :class="[
              'px-4 py-2 text-sm font-medium border-t border-r border-b rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10 -ml-px',
              viewMode === 'cards' 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            ]"
          >
            Cards
          </button>
        </div>
        
        <!-- Export Button -->
        <button
          @click="exportData"
          class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowDownTrayIcon class="h-4 w-4 mr-1" />
          Export
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="animate-pulse">
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <div class="px-4 py-5 sm:p-6">
          <div class="space-y-4">
            <div v-for="i in 5" :key="i" class="flex items-center space-x-4">
              <div class="h-4 bg-gray-200 rounded w-1/4"></div>
              <div class="h-4 bg-gray-200 rounded w-1/6"></div>
              <div class="h-4 bg-gray-200 rounded w-1/6"></div>
              <div class="h-4 bg-gray-200 rounded w-1/4"></div>
              <div class="h-4 bg-gray-200 rounded w-1/6"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Table View -->
    <div v-else-if="viewMode === 'table'" class="bg-white shadow rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                v-for="column in tableColumns"
                :key="column.key"
                @click="column.sortable && handleSort(column.key)"
                :class="[
                  'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                  column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                ]"
              >
                <div class="flex items-center space-x-1">
                  <span>{{ column.label }}</span>
                  <div v-if="column.sortable" class="flex flex-col">
                    <ChevronUpIcon
                      class="h-3 w-3"
                      :class="[
                        sortBy === column.key && sortDirection === 'asc' 
                          ? 'text-blue-600' 
                          : 'text-gray-400'
                      ]"
                    />
                    <ChevronDownIcon
                      class="h-3 w-3 -mt-1"
                      :class="[
                        sortBy === column.key && sortDirection === 'desc' 
                          ? 'text-blue-600' 
                          : 'text-gray-400'
                      ]"
                    />
                  </div>
                </div>
              </th>
              <th class="relative px-6 py-3">
                <span class="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="product in sortedProducts"
              :key="product.product_id"
              class="hover:bg-gray-50 transition-colors duration-150"
            >
              <!-- Product Name -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div>
                    <div class="text-sm font-medium text-gray-900">
                      {{ product.product_name }}
                    </div>
                    <div class="text-sm text-gray-500">
                      ID: {{ product.product_id.slice(0, 8) }}...
                    </div>
                  </div>
                </div>
              </td>
              
              <!-- Performance Score -->
              <td class="px-6 py-4 whitespace-nowrap">
                <ProductPerformanceIndicator 
                  :score="product.product_performance_score || 0"
                  size="md"
                />
              </td>
              
              <!-- Opportunities -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div class="flex items-center">
                  <span class="font-medium">{{ product.total_opportunities || 0 }}</span>
                  <span class="ml-1 text-gray-500">total</span>
                </div>
                <div class="text-xs text-green-600">
                  {{ product.won_opportunities_for_product || 0 }} won
                </div>
              </td>
              
              <!-- Win Rate -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                    <div
                      class="h-2 rounded-full transition-all duration-300"
                      :class="getWinRateColor(product.win_rate || 0)"
                      :style="{ width: `${Math.min(product.win_rate || 0, 100)}%` }"
                    ></div>
                  </div>
                  <span class="text-sm font-medium text-gray-900">
                    {{ Math.round(product.win_rate || 0) }}%
                  </span>
                </div>
              </td>
              
              <!-- Total Value -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div class="font-semibold">
                  {{ formatCurrency(product.total_value || 0) }}
                </div>
                <div class="text-xs text-gray-500">
                  Avg: {{ formatCurrency((product.total_value || 0) / Math.max(product.total_opportunities || 1, 1)) }}
                </div>
              </td>
              
              <!-- Engagement Trend -->
              <td class="px-6 py-4 whitespace-nowrap">
                <TrendIndicator 
                  :change="0"
                  :trend="'stable'"
                  size="sm"
                />
              </td>
              
              <!-- Last Activity -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(product.latest_opportunity_date) }}
              </td>
              
              <!-- Actions -->
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center space-x-2">
                  <button
                    @click="viewProductDetails(product.product_id)"
                    class="text-blue-600 hover:text-blue-900 transition-colors"
                  >
                    View
                  </button>
                  <button
                    @click="createOpportunity(product.product_id)"
                    class="text-green-600 hover:text-green-900 transition-colors"
                  >
                    New Opp
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Empty State -->
      <div v-if="sortedProducts.length === 0" class="text-center py-12">
        <CubeIcon class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">No products found</h3>
        <p class="mt-1 text-sm text-gray-500">
          This principal has no associated products yet.
        </p>
      </div>
    </div>

    <!-- Cards View -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="product in sortedProducts"
        :key="product.product_id"
        class="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
      >
        <div class="p-6">
          <!-- Product Header -->
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-lg font-medium text-gray-900 truncate">
              {{ product.product_name }}
            </h4>
            <ProductPerformanceIndicator 
              :score="product.product_performance_score || 0"
              size="sm"
            />
          </div>
          
          <!-- Metrics Grid -->
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600">
                {{ product.total_opportunities || 0 }}
              </div>
              <div class="text-xs text-gray-500">Opportunities</div>
            </div>
            
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">
                {{ Math.round(product.win_rate || 0) }}%
              </div>
              <div class="text-xs text-gray-500">Win Rate</div>
            </div>
          </div>
          
          <!-- Value Information -->
          <div class="mb-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-gray-600">Total Value</span>
              <span class="text-sm font-semibold text-gray-900">
                {{ formatCurrency(product.total_value || 0) }}
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">Avg per Opp</span>
              <span class="text-sm font-medium text-gray-700">
                {{ formatCurrency((product.total_value || 0) / Math.max(product.total_opportunities || 1, 1)) }}
              </span>
            </div>
          </div>
          
          <!-- Trend and Last Activity -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <TrendIndicator 
                :change="0"
                :trend="'stable'"
                size="sm"
              />
              <span class="ml-2 text-sm text-gray-600">Trend</span>
            </div>
            <div class="text-sm text-gray-500">
              {{ formatDate(product.latest_opportunity_date) }}
            </div>
          </div>
          
          <!-- Actions -->
          <div class="flex space-x-2">
            <button
              @click="viewProductDetails(product.product_id)"
              class="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Details
            </button>
            <button
              @click="createOpportunity(product.product_id)"
              class="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              New Opportunity
            </button>
          </div>
        </div>
      </div>
      
      <!-- Empty State for Cards -->
      <div v-if="sortedProducts.length === 0" class="col-span-full text-center py-12">
        <CubeIcon class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">No products found</h3>
        <p class="mt-1 text-sm text-gray-500">
          This principal has no associated products yet.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  ArrowDownTrayIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CubeIcon
} from '@heroicons/vue/24/outline'
import type { PrincipalProductPerformance } from '@/services/principalActivityApi'

// Component imports
import ProductPerformanceIndicator from './ProductPerformanceIndicator.vue'
import TrendIndicator from './TrendIndicator.vue'

// ===============================
// COMPONENT INTERFACE
// ===============================

interface Props {
  products: PrincipalProductPerformance[]
  loading?: boolean
  principalName?: string
}

interface Emits {
  (e: 'product-selected', productId: string): void
  (e: 'create-opportunity', productId: string): void
  (e: 'export-data'): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  principalName: 'Principal'
})

const emit = defineEmits<Emits>()

// ===============================
// REACTIVE STATE
// ===============================

const viewMode = ref<'table' | 'cards'>('table')
const sortBy = ref<string>('product_performance_score')
const sortDirection = ref<'asc' | 'desc'>('desc')

const tableColumns = [
  { key: 'product_name', label: 'Product', sortable: true },
  { key: 'product_performance_score', label: 'Performance', sortable: true },
  { key: 'total_opportunities', label: 'Opportunities', sortable: true },
  { key: 'win_rate', label: 'Win Rate', sortable: true },
  { key: 'total_value', label: 'Value', sortable: true },
  { key: 'engagement_trend', label: 'Trend', sortable: false },
  { key: 'last_opportunity_date', label: 'Last Activity', sortable: true }
]

// ===============================
// COMPUTED PROPERTIES
// ===============================

const sortedProducts = computed(() => {
  if (!props.products || props.products.length === 0) return []
  
  const sorted = [...props.products].sort((a, b) => {
    const aValue = a[sortBy.value as keyof PrincipalProductPerformance]
    const bValue = b[sortBy.value as keyof PrincipalProductPerformance]
    
    // Handle different data types
    let aComp: number | string = aValue ?? 0
    let bComp: number | string = bValue ?? 0
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aComp = aValue.toLowerCase()
      bComp = bValue.toLowerCase()
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      aComp = aValue
      bComp = bValue
    }
    
    if (sortDirection.value === 'asc') {
      return aComp < bComp ? -1 : aComp > bComp ? 1 : 0
    } else {
      return aComp > bComp ? -1 : aComp < bComp ? 1 : 0
    }
  })
  
  return sorted
})

// ===============================
// EVENT HANDLERS
// ===============================

const handleSort = (column: string) => {
  if (sortBy.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = column
    sortDirection.value = 'desc'
  }
}

const viewProductDetails = (productId: string) => {
  emit('product-selected', productId)
}

const createOpportunity = (productId: string) => {
  emit('create-opportunity', productId)
}

const exportData = () => {
  emit('export-data')
}

// ===============================
// UTILITY FUNCTIONS
// ===============================

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Never'
  
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 1) return 'Today'
  if (diffDays <= 7) return `${diffDays} days ago`
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`
  if (diffDays <= 365) return `${Math.ceil(diffDays / 30)} months ago`
  
  return date.toLocaleDateString()
}

const getWinRateColor = (winRate: number): string => {
  if (winRate >= 70) return 'bg-green-500'
  if (winRate >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}
</script>

<style scoped>
.principal-product-table {
  /* Custom styles for the product table */
}

/* Table row hover effects */
.principal-product-table tbody tr:hover {
  background-color: rgba(249, 250, 251, 0.8);
}

/* Card hover effects */
.product-card {
  transition: all 0.2s ease-in-out;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

/* Performance indicator animations */
.performance-bar {
  transition: width 0.6s ease-in-out;
}

/* Responsive table adjustments */
@media (max-width: 768px) {
  .principal-product-table .table-container {
    overflow-x: auto;
  }
  
  .principal-product-table table {
    min-width: 600px;
  }
}

/* Loading skeleton animation */
.skeleton-loader {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Print styles */
@media print {
  .principal-product-table .view-toggle,
  .principal-product-table .export-button {
    display: none;
  }
  
  .principal-product-table .actions-column {
    display: none;
  }
}
</style>