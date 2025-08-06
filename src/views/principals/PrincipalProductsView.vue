<!--
  Principal Products View - Product management and performance interface
  Features: Product portfolio overview, performance metrics, opportunity tracking, iPad optimized
-->
<template>
  <DashboardLayout>
    <div class="principal-products-view">
      <!-- Page Header -->
      <div class="mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div class="mb-4 sm:mb-0">
            <h1 class="text-2xl font-bold text-gray-900">Product Portfolio</h1>
            <p class="mt-1 text-sm text-gray-500">
              Manage products and analyze performance metrics
            </p>
          </div>
          <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <!-- Manage Products Button -->
            <button
              @click="openManageProductsModal"
              :disabled="!selectedPrincipal"
              class="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              <CogIcon class="h-4 w-4 mr-2" />
              Manage Products
            </button>
            <!-- View Toggle -->
            <div class="flex rounded-md shadow-sm">
              <button
                @click="viewMode = 'grid'"
                :class="[
                  'px-4 py-2 text-sm font-medium rounded-l-md border min-h-[44px]',
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                ]"
              >
                <Squares2X2Icon class="h-4 w-4" />
              </button>
              <button
                @click="viewMode = 'table'"
                :class="[
                  'px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b min-h-[44px]',
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                ]"
              >
                <Bars3Icon class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Principal Selector -->
      <div class="mb-6">
        <PrincipalSelector
          v-model="selectedPrincipal"
          :loading="principalsLoading"
          :error="principalsError"
          placeholder="Select a principal to view their product portfolio..."
          class="w-full"
        />
      </div>

      <!-- Loading State -->
      <div v-if="loading && selectedPrincipal" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-4 text-sm text-gray-500">Loading product portfolio...</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!selectedPrincipal" class="text-center py-12">
        <CubeIcon class="mx-auto h-16 w-16 text-gray-400" />
        <h3 class="mt-4 text-lg font-medium text-gray-900">Product Portfolio</h3>
        <p class="mt-2 text-sm text-gray-500">
          Select a principal above to view and manage their product portfolio and performance metrics.
        </p>
      </div>

      <!-- Products Dashboard -->
      <div v-else-if="selectedPrincipal" class="space-y-6">
        <!-- Portfolio Summary KPIs -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <CubeIcon class="h-6 w-6 text-blue-500" />
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-500">Active Products</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ productsData?.length || 0 }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <ArrowTrendingUpIcon class="h-6 w-6 text-green-500" />
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-500">Avg Performance</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ Math.round(averagePerformance) }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <ChartBarIcon class="h-6 w-6 text-purple-500" />
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-500">Total Opportunities</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ totalOpportunities }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <CurrencyDollarIcon class="h-6 w-6 text-yellow-500" />
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-500">Total Value</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ formatCurrency(totalValue) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Search and Filters -->
        <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <!-- Search -->
          <div class="flex-1">
            <div class="relative">
              <MagnifyingGlassIcon class="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search products..."
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
              />
            </div>
          </div>
          
          <!-- Performance Filter -->
          <select
            v-model="performanceFilter"
            class="block w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
          >
            <option value="">All Performance Levels</option>
            <option value="high">High (70-100)</option>
            <option value="medium">Medium (40-69)</option>
            <option value="low">Low (0-39)</option>
          </select>
          
          <!-- Sort Options -->
          <select
            v-model="sortBy"
            class="block w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
          >
            <option value="performance">Sort by Performance</option>
            <option value="name">Sort by Name</option>
            <option value="opportunities">Sort by Opportunities</option>
            <option value="value">Sort by Value</option>
          </select>
        </div>

        <!-- Products Grid/Table View -->
        <div v-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="product in filteredProducts"
            :key="product.product_id"
            class="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors duration-200"
          >
            <!-- Product Card Header -->
            <div class="p-6 pb-4">
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <h3 class="text-lg font-medium text-gray-900 truncate">
                    {{ product.product_name }}
                  </h3>
                  <p class="text-sm text-gray-500 mt-1">
                    {{ product.total_opportunities }} opportunities
                  </p>
                </div>
                <ProductPerformanceIndicator
                  :score="product.product_performance_score || 0"
                  size="md"
                  :show-label="true"
                />
              </div>
            </div>

            <!-- Product Metrics -->
            <div class="px-6 pb-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Win Rate</p>
                  <p class="text-lg font-semibold text-gray-900 mt-1">
                    {{ Math.round(product.win_rate || 0) }}%
                  </p>
                </div>
                <div>
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Value</p>
                  <p class="text-lg font-semibold text-gray-900 mt-1">
                    {{ formatCurrency(product.total_value || 0) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Product Actions -->
            <div class="px-6 py-4 bg-gray-50 rounded-b-lg">
              <div class="flex space-x-3">
                <button
                  @click="viewProductDetails(product)"
                  class="flex-1 text-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] flex items-center justify-center"
                >
                  <EyeIcon class="h-4 w-4 mr-1" />
                  View Details
                </button>
                <button
                  @click="createOpportunity(product)"
                  class="flex-1 text-center px-3 py-2 text-sm font-medium text-green-600 bg-green-100 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[44px] flex items-center justify-center"
                >
                  <PlusIcon class="h-4 w-4 mr-1" />
                  New Opp
                </button>
              </div>
            </div>
          </div>

          <!-- Empty Search Results -->
          <div v-if="filteredProducts.length === 0" class="col-span-full text-center py-12">
            <MagnifyingGlassIcon class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-4 text-lg font-medium text-gray-900">No products found</h3>
            <p class="mt-2 text-sm text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        </div>

        <!-- Table View -->
        <div v-else class="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <PrincipalProductTable
            :data="filteredProducts"
            :loading="loading"
            :view-mode="'table'"
            :show-actions="true"
            @view-details="viewProductDetails"
            @create-opportunity="createOpportunity"
          />
        </div>

        <!-- Performance Analysis Section -->
        <div class="bg-white rounded-lg border border-gray-200 p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Performance Analysis</h3>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Performance Distribution Chart -->
            <div class="h-64">
              <ProductPerformanceChart
                :data="productsData || []"
                :principal-name="selectedPrincipal?.name"
              />
            </div>
            
            <!-- Top/Bottom Performers -->
            <div class="space-y-6">
              <!-- Top Performers -->
              <div>
                <h4 class="text-sm font-medium text-gray-700 mb-3">Top Performers</h4>
                <div class="space-y-2">
                  <div
                    v-for="product in topPerformers"
                    :key="`top-${product.product_id}`"
                    class="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                  >
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">
                        {{ product.product_name }}
                      </p>
                      <p class="text-xs text-gray-500">
                        {{ product.total_opportunities }} opps • {{ Math.round(product.win_rate || 0) }}% win rate
                      </p>
                    </div>
                    <ProductPerformanceIndicator
                      :score="product.product_performance_score || 0"
                      size="sm"
                      :show-label="false"
                    />
                  </div>
                </div>
              </div>

              <!-- Bottom Performers -->
              <div>
                <h4 class="text-sm font-medium text-gray-700 mb-3">Needs Attention</h4>
                <div class="space-y-2">
                  <div
                    v-for="product in bottomPerformers"
                    :key="`bottom-${product.product_id}`"
                    class="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
                  >
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">
                        {{ product.product_name }}
                      </p>
                      <p class="text-xs text-gray-500">
                        {{ product.total_opportunities }} opps • {{ Math.round(product.win_rate || 0) }}% win rate
                      </p>
                    </div>
                    <ProductPerformanceIndicator
                      :score="product.product_performance_score || 0"
                      size="sm"
                      :show-label="false"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex">
          <ExclamationTriangleIcon class="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
          <div>
            <h3 class="text-sm font-medium text-red-800">Error Loading Products</h3>
            <p class="text-sm text-red-700 mt-1">{{ error }}</p>
            <button
              @click="loadProductsData"
              class="mt-2 text-sm font-medium text-red-800 hover:text-red-900"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  CubeIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  CogIcon,
  Squares2X2Icon,
  Bars3Icon,
  MagnifyingGlassIcon,
  EyeIcon,
  PlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

// Components
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import PrincipalSelector from '@/components/principal/PrincipalSelector.vue'
import ProductPerformanceIndicator from '@/components/principal/ProductPerformanceIndicator.vue'
import PrincipalProductTable from '@/components/principal/PrincipalProductTable.vue'
import { ProductPerformanceChart } from '@/components/principal'

// Services and Types
import { usePrincipalStore } from '@/stores/principalStore'
import type { PrincipalProductPerformance } from '@/types/principal'

// ===============================
// REACTIVE STATE
// ===============================

const router = useRouter()
const route = useRoute()
const principalStore = usePrincipalStore()

const selectedPrincipal = ref<any>(null)
const viewMode = ref<'grid' | 'table'>('grid')
const searchQuery = ref('')
const performanceFilter = ref('')
const sortBy = ref('performance')
const loading = ref(false)
const error = ref<string | null>(null)

const productsData = ref<PrincipalProductPerformance[]>([])

// ===============================
// COMPUTED PROPERTIES
// ===============================

const principalsLoading = computed(() => principalStore.loading)
const principalsError = computed(() => principalStore.error)

const averagePerformance = computed(() => {
  if (!productsData.value.length) return 0
  const total = productsData.value.reduce((sum, product) => sum + (product.product_performance_score || 0), 0)
  return total / productsData.value.length
})

const totalOpportunities = computed(() => {
  return productsData.value.reduce((sum, product) => sum + (product.total_opportunities || 0), 0)
})

const totalValue = computed(() => {
  return productsData.value.reduce((sum, product) => sum + (product.total_value || 0), 0)
})

const filteredProducts = computed(() => {
  let filtered = [...productsData.value]

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(product =>
      product.product_name.toLowerCase().includes(query)
    )
  }

  // Apply performance filter
  if (performanceFilter.value) {
    filtered = filtered.filter(product => {
      const score = product.product_performance_score || 0
      switch (performanceFilter.value) {
        case 'high':
          return score >= 70
        case 'medium':
          return score >= 40 && score < 70
        case 'low':
          return score < 40
        default:
          return true
      }
    })
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.product_name.localeCompare(b.product_name)
      case 'opportunities':
        return (b.total_opportunities || 0) - (a.total_opportunities || 0)
      case 'value':
        return (b.total_value || 0) - (a.total_value || 0)
      case 'performance':
      default:
        return (b.product_performance_score || 0) - (a.product_performance_score || 0)
    }
  })

  return filtered
})

const topPerformers = computed(() => {
  return [...productsData.value]
    .sort((a, b) => (b.product_performance_score || 0) - (a.product_performance_score || 0))
    .slice(0, 3)
})

const bottomPerformers = computed(() => {
  return [...productsData.value]
    .sort((a, b) => (a.product_performance_score || 0) - (b.product_performance_score || 0))
    .slice(0, 3)
})

// ===============================
// METHODS
// ===============================

const loadProductsData = async () => {
  if (!selectedPrincipal.value) return

  loading.value = true
  error.value = null

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Generate mock product performance data
    const productNames = [
      'Premium Widget Pro', 'Standard Package Plus', 'Enterprise Solution Max',
      'Basic Service Lite', 'Advanced Analytics Suite', 'Custom Integration Tool',
      'Mobile App Platform', 'Cloud Platform Enterprise', 'Security Suite Premium',
      'Data Visualization Tool', 'Workflow Automation', 'Communication Hub'
    ]

    productsData.value = productNames.map((name, index) => ({
      product_id: `prod_${index + 1}`,
      product_name: name,
      product_performance_score: Math.floor(Math.random() * 60) + 30, // 30-90
      total_opportunities: Math.floor(Math.random() * 25) + 5, // 5-30
      win_rate: Math.floor(Math.random() * 50) + 25, // 25-75%
      total_value: Math.floor(Math.random() * 200000) + 50000, // $50k-$250k
      last_interaction_date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString()
    }))

  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load product data'
    console.error('Error loading products data:', err)
  } finally {
    loading.value = false
  }
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`
  }
  return `$${value.toFixed(0)}`
}

const viewProductDetails = (product: PrincipalProductPerformance) => {
  // Navigate to product detail page or open modal
  console.log('Viewing product details:', product)
  // In real implementation, this would navigate to a product detail page
  // router.push(`/products/${product.product_id}`)
}

const createOpportunity = (product: PrincipalProductPerformance) => {
  // Navigate to opportunity creation with pre-selected product and principal
  console.log('Creating opportunity for product:', product)
  router.push({
    path: '/opportunities/new',
    query: {
      principalId: selectedPrincipal.value?.id,
      productId: product.product_id
    }
  })
}

const openManageProductsModal = () => {
  // Open product management modal
  console.log('Opening manage products modal for principal:', selectedPrincipal.value)
  // In real implementation, this would open a modal for managing product assignments
}

// ===============================
// WATCHERS
// ===============================

watch(selectedPrincipal, () => {
  if (selectedPrincipal.value) {
    loadProductsData()
  } else {
    productsData.value = []
  }
}, { immediate: false })

// ===============================
// LIFECYCLE HOOKS
// ===============================

onMounted(async () => {
  // Load principals if not already loaded
  if (principalStore.principals.length === 0) {
    await principalStore.fetchPrincipals()
  }

  // Auto-select principal from route params
  const principalId = route.params.principalId as string
  if (principalId) {
    const principal = principalStore.principals.find(p => p.id === principalId)
    if (principal) {
      selectedPrincipal.value = principal
    }
  }
})
</script>

<style scoped>
.principal-products-view {
  /* Custom styles for products view */
}

/* Ensure proper grid layout on all screen sizes */
@media (max-width: 768px) {
  .grid {
    gap: 1rem;
  }
  
  /* Stack grid items on mobile */
  .lg\:grid-cols-3 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
  
  .md\:grid-cols-2 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}

/* Touch targets for mobile */
.principal-products-view button,
.principal-products-view select,
.principal-products-view input {
  min-height: 44px;
}

/* Product card hover effects */
.principal-products-view .bg-white:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Performance indicator alignment in cards */
.principal-products-view .performance-indicator {
  flex-shrink: 0;
}

/* Responsive text scaling */
@media (max-width: 640px) {
  .text-2xl {
    font-size: 1.5rem;
  }
  
  .text-lg {
    font-size: 1rem;
  }
}

/* Grid to single column on small screens */
@media (max-width: 640px) {
  .sm\:grid-cols-2 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
  
  .lg\:grid-cols-4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>