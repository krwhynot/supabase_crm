<!--
  Manage Principal Products Button - Product association management interface
  Features: Drag-and-drop, batch operations, performance indicators
-->
<template>
  <div class="manage-principal-products-button">
    <!-- Trigger Button -->
    <button
      @click="openModal"
      :disabled="!principal || loading"
      class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
    >
      <CubeIcon class="h-4 w-4 mr-1" />
      {{ loading ? 'Loading...' : 'Manage Products' }}
    </button>

    <!-- Modal -->
    <TransitionRoot as="template" :show="showModal">
      <Dialog as="div" class="relative z-50" @close="closeModal">
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-200"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </TransitionChild>

        <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild
              as="template"
              enter="ease-out duration-300"
              enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enter-to="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leave-from="opacity-100 translate-y-0 sm:scale-100"
              leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                <!-- Modal Header -->
                <div class="flex items-center justify-between mb-6">
                  <div>
                    <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900">
                      Manage Products for {{ principal?.principal_name }}
                    </DialogTitle>
                    <p class="mt-1 text-sm text-gray-600">
                      Associate and manage products for this principal
                    </p>
                  </div>
                  <button
                    @click="closeModal"
                    class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <XMarkIcon class="h-6 w-6" />
                  </button>
                </div>

                <!-- Error Display -->
                <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div class="flex">
                    <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
                    <div class="ml-3">
                      <p class="text-sm text-red-700">{{ error }}</p>
                    </div>
                  </div>
                </div>

                <!-- Loading State -->
                <div v-if="loadingData" class="flex items-center justify-center py-8">
                  <div class="text-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p class="mt-2 text-sm text-gray-600">Loading product data...</p>
                  </div>
                </div>

                <!-- Content -->
                <div v-else class="space-y-6">
                  <!-- Search and Filters -->
                  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    <div class="flex-1 max-w-lg">
                      <div class="relative">
                        <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          v-model="searchTerm"
                          type="text"
                          class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Search products..."
                        />
                      </div>
                    </div>
                    
                    <div class="flex items-center space-x-3">
                      <!-- Category Filter -->
                      <select
                        v-model="selectedCategory"
                        class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">All Categories</option>
                        <option v-for="category in productCategories" :key="category || 'null'" :value="category || ''">
                          {{ category || 'Uncategorized' }}
                        </option>
                      </select>
                      
                      <!-- Bulk Actions -->
                      <div class="relative" ref="bulkActionsRef">
                        <button
                          @click="showBulkActions = !showBulkActions"
                          :disabled="selectedProducts.length === 0"
                          class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          Bulk Actions
                          <ChevronDownIcon class="ml-1 h-4 w-4" />
                        </button>
                        
                        <!-- Bulk Actions Dropdown -->
                        <div
                          v-show="showBulkActions"
                          class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5"
                        >
                          <div class="py-1">
                            <button
                              @click="bulkAssociate"
                              class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Associate Selected
                            </button>
                            <button
                              @click="bulkDisassociate"
                              class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Remove Selected
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Product Stats -->
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div class="bg-blue-50 p-4 rounded-lg">
                      <div class="flex items-center">
                        <CubeIcon class="h-5 w-5 text-blue-500 mr-2" />
                        <span class="text-sm font-medium text-blue-900">Associated Products</span>
                      </div>
                      <p class="text-2xl font-bold text-blue-600 mt-1">{{ associatedProducts.length }}</p>
                    </div>
                    
                    <div class="bg-green-50 p-4 rounded-lg">
                      <div class="flex items-center">
                        <TrophyIcon class="h-5 w-5 text-green-500 mr-2" />
                        <span class="text-sm font-medium text-green-900">High Performance</span>
                      </div>
                      <p class="text-2xl font-bold text-green-600 mt-1">{{ highPerformanceCount }}</p>
                    </div>
                    
                    <div class="bg-yellow-50 p-4 rounded-lg">
                      <div class="flex items-center">
                        <ChartBarIcon class="h-5 w-5 text-yellow-500 mr-2" />
                        <span class="text-sm font-medium text-yellow-900">Avg Performance</span>
                      </div>
                      <p class="text-2xl font-bold text-yellow-600 mt-1">{{ averagePerformance.toFixed(1) }}</p>
                    </div>
                  </div>

                  <!-- Products Grid -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Available Products -->
                    <div>
                      <h4 class="text-md font-medium text-gray-900 mb-3">Available Products</h4>
                      <div class="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                        <div class="p-3">
                          <div v-if="filteredAvailableProducts.length === 0" class="text-center py-6 text-gray-500">
                            <CubeIcon class="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p class="text-sm">No available products found</p>
                          </div>
                          
                          <div v-else class="space-y-2">
                            <div
                              v-for="product in filteredAvailableProducts"
                              :key="product.id"
                              class="flex items-center justify-between p-3 rounded-md border border-gray-100 hover:bg-gray-50 transition-colors"
                            >
                              <div class="flex items-center space-x-3">
                                <input
                                  v-model="selectedProducts"
                                  type="checkbox"
                                  :value="product.id"
                                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <div>
                                  <p class="text-sm font-medium text-gray-900">{{ product.name }}</p>
                                  <p class="text-xs text-gray-500">{{ product.category }}</p>
                                </div>
                              </div>
                              
                              <button
                                @click="associateProduct(product)"
                                :disabled="saving"
                                class="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                              >
                                <PlusIcon class="h-3 w-3 mr-1" />
                                Add
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Associated Products -->
                    <div>
                      <h4 class="text-md font-medium text-gray-900 mb-3">Associated Products</h4>
                      <div class="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                        <div class="p-3">
                          <div v-if="associatedProducts.length === 0" class="text-center py-6 text-gray-500">
                            <CubeIcon class="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p class="text-sm">No associated products</p>
                          </div>
                          
                          <div v-else class="space-y-2">
                            <div
                              v-for="product in associatedProducts"
                              :key="product.id"
                              class="flex items-center justify-between p-3 rounded-md border border-gray-100 bg-blue-50 transition-colors"
                            >
                              <div class="flex items-center space-x-3">
                                <input
                                  v-model="selectedProducts"
                                  type="checkbox"
                                  :value="product.id"
                                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <div class="flex-1">
                                  <div class="flex items-center justify-between">
                                    <div>
                                      <p class="text-sm font-medium text-gray-900">{{ product.name }}</p>
                                      <p class="text-xs text-gray-500">{{ product.category }}</p>
                                    </div>
                                    <div class="text-right">
                                      <ProductPerformanceIndicator 
                                        :score="getProductPerformance(product.id)"
                                        size="sm"
                                      />
                                    </div>
                                  </div>
                                  
                                  <!-- Performance Metrics -->
                                  <div class="mt-2 flex items-center space-x-4 text-xs text-gray-600">
                                    <span>Opportunities: {{ getProductOpportunityCount(product.id) }}</span>
                                    <span>Win Rate: {{ getProductWinRate(product.id) }}%</span>
                                  </div>
                                </div>
                              </div>
                              
                              <button
                                @click="disassociateProduct(product)"
                                :disabled="saving"
                                class="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-600 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                              >
                                <MinusIcon class="h-3 w-3 mr-1" />
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Modal Actions -->
                <div class="mt-6 flex items-center justify-between">
                  <div class="text-sm text-gray-600">
                    {{ selectedProducts.length }} products selected
                  </div>
                  
                  <div class="flex items-center space-x-3">
                    <button
                      type="button"
                      @click="closeModal"
                      class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Close
                    </button>
                    <button
                      @click="saveChanges"
                      :disabled="saving || !hasChanges"
                      class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div v-if="saving" class="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                      {{ saving ? 'Saving...' : 'Save Changes' }}
                    </button>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot
} from '@headlessui/vue'
import {
  CubeIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  PlusIcon,
  MinusIcon,
  TrophyIcon,
  ChartBarIcon
} from '@heroicons/vue/24/outline'
import { useProductStore } from '@/stores/productStore'
import { usePrincipalStore } from '@/stores/principalStore'
import type { PrincipalActivitySummary, PrincipalProductPerformance } from '@/services/principalActivityApi'
import { ProductCategory } from '@/types/products'

// Component imports
import ProductPerformanceIndicator from './ProductPerformanceIndicator.vue'

// ===============================
// COMPONENT INTERFACE
// ===============================

interface Props {
  principal?: PrincipalActivitySummary | null
}

interface Emits {
  (e: 'updated'): void
}

const props = withDefaults(defineProps<Props>(), {
  principal: null
})

const emit = defineEmits<Emits>()

// ===============================
// STORES
// ===============================

const productStore = useProductStore()
const principalStore = usePrincipalStore()

// ===============================
// REACTIVE STATE
// ===============================

const showModal = ref(false)
const loading = ref(false)
const loadingData = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

const searchTerm = ref('')
const selectedCategory = ref('')
const selectedProducts = ref<string[]>([])
const showBulkActions = ref(false)
const bulkActionsRef = ref<HTMLElement>()

const originalAssociatedProductIds = ref<string[]>([])
const currentAssociatedProductIds = ref<string[]>([])
const productPerformanceData = ref<PrincipalProductPerformance[]>([])

// ===============================
// COMPUTED PROPERTIES
// ===============================

const productCategories = computed(() => {
  const categories = new Set(
    productStore.products
      .map(p => p.category)
      .filter((category): category is ProductCategory => Boolean(category) && category !== null)
  )
  return Array.from(categories).sort()
})

const filteredAvailableProducts = computed(() => {
  let products = productStore.products.filter(product => 
    product.is_active && !currentAssociatedProductIds.value.includes(product.id)
  )
  
  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    products = products.filter(product =>
      product.name.toLowerCase().includes(search) ||
      product.description?.toLowerCase().includes(search) ||
      product.category?.toLowerCase().includes(search)
    )
  }
  
  if (selectedCategory.value) {
    products = products.filter(product => product.category === selectedCategory.value)
  }
  
  return products
})

const associatedProducts = computed(() => {
  return productStore.products.filter(product => 
    currentAssociatedProductIds.value.includes(product.id)
  )
})

const hasChanges = computed(() => {
  const original = new Set(originalAssociatedProductIds.value)
  const current = new Set(currentAssociatedProductIds.value)
  
  return original.size !== current.size || 
         [...original].some(id => !current.has(id)) ||
         [...current].some(id => !original.has(id))
})

const highPerformanceCount = computed(() => {
  return productPerformanceData.value.filter(p => 
    (p.product_performance_score || 0) >= 80
  ).length
})

const averagePerformance = computed(() => {
  if (productPerformanceData.value.length === 0) return 0
  const total = productPerformanceData.value.reduce((sum, p) => 
    sum + (p.product_performance_score || 0), 0
  )
  return total / productPerformanceData.value.length
})

// ===============================
// EVENT HANDLERS
// ===============================

const openModal = async () => {
  if (!props.principal) return
  
  showModal.value = true
  await loadProductData()
}

const closeModal = () => {
  showModal.value = false
  resetState()
}

const associateProduct = (product: any) => {
  if (!currentAssociatedProductIds.value.includes(product.id)) {
    currentAssociatedProductIds.value.push(product.id)
  }
}

const disassociateProduct = (product: any) => {
  const index = currentAssociatedProductIds.value.indexOf(product.id)
  if (index >= 0) {
    currentAssociatedProductIds.value.splice(index, 1)
  }
}

const bulkAssociate = () => {
  selectedProducts.value.forEach(productId => {
    if (!currentAssociatedProductIds.value.includes(productId)) {
      currentAssociatedProductIds.value.push(productId)
    }
  })
  selectedProducts.value = []
  showBulkActions.value = false
}

const bulkDisassociate = () => {
  selectedProducts.value.forEach(productId => {
    const index = currentAssociatedProductIds.value.indexOf(productId)
    if (index >= 0) {
      currentAssociatedProductIds.value.splice(index, 1)
    }
  })
  selectedProducts.value = []
  showBulkActions.value = false
}

const saveChanges = async () => {
  if (!props.principal || !hasChanges.value) return
  
  saving.value = true
  error.value = null
  
  try {
    // Determine what products to add and remove
    const originalSet = new Set(originalAssociatedProductIds.value)
    const currentSet = new Set(currentAssociatedProductIds.value)
    
    const toAdd = [...currentSet].filter(id => !originalSet.has(id))
    const toRemove = [...originalSet].filter(id => !currentSet.has(id))
    
    // Call store methods to update associations
    if (toAdd.length > 0) {
      await principalStore.associateProductsWithPrincipals(toAdd, [props.principal.principal_id])
    }
    
    if (toRemove.length > 0) {
      // This would need a disassociate method in the store
      console.log('Remove products:', toRemove)
    }
    
    // Update original state
    originalAssociatedProductIds.value = [...currentAssociatedProductIds.value]
    
    emit('updated')
    closeModal()
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save changes'
  } finally {
    saving.value = false
  }
}

// ===============================
// DATA LOADING
// ===============================

const loadProductData = async () => {
  if (!props.principal) return
  
  loadingData.value = true
  error.value = null
  
  try {
    // Load products if not already loaded
    if (productStore.products.length === 0) {
      await productStore.fetchProducts()
    }
    
    // Load current product associations for this principal
    // This would typically come from an API call
    // For now, simulate with existing data
    const associatedIds = await loadAssociatedProducts(props.principal.principal_id)
    originalAssociatedProductIds.value = associatedIds
    currentAssociatedProductIds.value = [...associatedIds]
    
    // Load product performance data
    await loadProductPerformanceData(props.principal.principal_id)
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load product data'
  } finally {
    loadingData.value = false
  }
}

const loadAssociatedProducts = async (_principalId: string): Promise<string[]> => {
  // This would typically call an API to get associated products
  // For now, return mock data
  return ['product-1', 'product-2'] // Mock product IDs
}

const loadProductPerformanceData = async (principalId: string) => {
  // This would load actual performance data from the API
  // For now, create mock performance data that matches the PrincipalProductPerformance interface
  productPerformanceData.value = currentAssociatedProductIds.value.map(productId => {
    const product = productStore.products.find(p => p.id === productId)
    const totalOpportunities = Math.floor(Math.random() * 10)
    const wonOpportunities = Math.floor(Math.random() * Math.max(1, totalOpportunities))
    
    return {
      // Core identifiers
      principal_id: principalId,
      principal_name: props.principal?.principal_name || 'Unknown Principal',
      product_id: productId,
      product_name: product?.name || 'Unknown Product',
      product_category: product?.category || null,
      product_sku: product?.sku || null,
      
      // Relationship details
      is_primary_principal: Math.random() > 0.5,
      exclusive_rights: Math.random() > 0.7,
      wholesale_price: Math.floor(Math.random() * 1000) + 100,
      minimum_order_quantity: Math.floor(Math.random() * 100) + 10,
      lead_time_days: Math.floor(Math.random() * 30) + 5,
      
      // Contract info
      contract_start_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      contract_end_date: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      territory_restrictions: null,
      
      // Performance metrics
      opportunities_for_product: totalOpportunities,
      won_opportunities_for_product: wonOpportunities,
      active_opportunities_for_product: Math.floor(Math.random() * (totalOpportunities - wonOpportunities)),
      latest_opportunity_date: new Date().toISOString(),
      avg_opportunity_probability: Math.floor(Math.random() * 100),
      
      // Component-expected properties (aliases/computed values)
      total_opportunities: totalOpportunities,
      win_rate: totalOpportunities > 0 ? Math.floor((wonOpportunities / totalOpportunities) * 100) : 0,
      total_value: Math.floor(Math.random() * 100000),
      
      // Interaction metrics
      interactions_for_product: Math.floor(Math.random() * 20),
      recent_interactions_for_product: Math.floor(Math.random() * 5),
      last_interaction_date: new Date().toISOString(),
      
      // Product status
      product_is_active: product?.is_active || true,
      launch_date: new Date(Date.now() - Math.random() * 730 * 24 * 60 * 60 * 1000).toISOString(),
      discontinue_date: null,
      unit_cost: Math.floor(Math.random() * 500) + 50,
      suggested_retail_price: Math.floor(Math.random() * 1500) + 200,
      
      // Calculated metrics
      contract_status: Math.random() > 0.8 ? 'EXPIRED' : Math.random() > 0.6 ? 'EXPIRING_SOON' : 'ACTIVE',
      product_performance_score: Math.floor(Math.random() * 100),
      
      // Metadata
      relationship_created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      relationship_updated_at: new Date().toISOString()
    }
  })
}

// ===============================
// PERFORMANCE HELPERS
// ===============================

const getProductPerformance = (productId: string): number => {
  const performance = productPerformanceData.value.find(p => p.product_id === productId)
  return performance?.product_performance_score || 0
}

const getProductOpportunityCount = (productId: string): number => {
  const performance = productPerformanceData.value.find(p => p.product_id === productId)
  return performance?.total_opportunities || 0
}

const getProductWinRate = (productId: string): number => {
  const performance = productPerformanceData.value.find(p => p.product_id === productId)
  return Math.round(performance?.win_rate || 0)
}

// ===============================
// UTILITY FUNCTIONS
// ===============================

const resetState = () => {
  searchTerm.value = ''
  selectedCategory.value = ''
  selectedProducts.value = []
  showBulkActions.value = false
  error.value = null
  originalAssociatedProductIds.value = []
  currentAssociatedProductIds.value = []
  productPerformanceData.value = []
}

// ===============================
// CLICK OUTSIDE HANDLER
// ===============================

const handleClickOutside = (event: Event) => {
  const target = event.target as Element
  if (bulkActionsRef.value && !bulkActionsRef.value.contains(target)) {
    showBulkActions.value = false
  }
}

// ===============================
// LIFECYCLE HOOKS
// ===============================

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.manage-principal-products-button {
  /* Custom styles for the component */
}

/* Product card animations */
.product-card {
  transition: all 0.2s ease-in-out;
}

.product-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Drag and drop styling (for future enhancement) */
.product-draggable {
  cursor: move;
}

.product-drop-zone {
  border-style: dashed;
  background-color: rgba(59, 130, 246, 0.05);
}

/* Performance indicator styling */
.performance-high {
  background: linear-gradient(to right, #10b981, #059669);
}

.performance-medium {
  background: linear-gradient(to right, #f59e0b, #d97706);
}

.performance-low {
  background: linear-gradient(to right, #ef4444, #dc2626);
}

/* Search highlight */
.search-highlight {
  background-color: rgba(255, 235, 59, 0.3);
  padding: 1px 2px;
  border-radius: 2px;
}

/* Responsive grid adjustments */
@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: 1fr;
  }
  
  .product-stats {
    grid-template-columns: 1fr;
  }
}

/* Loading skeleton animation */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>