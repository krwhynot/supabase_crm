<template>
  <div class="min-h-screen bg-gray-50 py-8 page-container">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Enhanced Loading State with Personality -->
      <Transition
        enter-active-class="transition-all duration-500 ease-out"
        enter-from-class="opacity-0 transform scale-95"
        enter-to-class="opacity-100 transform scale-100"
        leave-active-class="transition-all duration-300 ease-in"
        leave-from-class="opacity-100 transform scale-100"
        leave-to-class="opacity-0 transform scale-95"
      >
        <div v-if="loading" class="bg-white rounded-lg shadow-lg border border-gray-200 p-8 loading-card">
          <div class="flex flex-col items-center space-y-4">
            <div class="relative">
              <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 loading-spinner"></div>
              <div class="absolute inset-0 rounded-full bg-primary-50 animate-pulse"></div>
            </div>
            <div class="text-center space-y-2">
              <p class="text-lg font-medium text-gray-900 loading-message">{{ loadingMessage }}</p>
              <p class="text-sm text-gray-600">{{ loadingSubtext }}</p>
              <div class="flex justify-center space-x-1 mt-3">
                <div class="w-2 h-2 bg-primary-400 rounded-full animate-bounce loading-dot" style="animation-delay: 0ms"></div>
                <div class="w-2 h-2 bg-primary-400 rounded-full animate-bounce loading-dot" style="animation-delay: 150ms"></div>
                <div class="w-2 h-2 bg-primary-400 rounded-full animate-bounce loading-dot" style="animation-delay: 300ms"></div>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Enhanced Error State with Encouragement -->
      <Transition
        enter-active-class="transition-all duration-400 ease-out"
        enter-from-class="opacity-0 transform translate-y-4 scale-95"
        enter-to-class="opacity-100 transform translate-y-0 scale-100"
      >
        <div v-if="error" class="bg-white rounded-lg shadow-lg border border-red-200 p-8 error-card">
          <div class="text-center space-y-4">
            <div class="flex justify-center">
              <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center error-icon-container">
                <ExclamationTriangleIcon class="h-8 w-8 text-red-500 animate-bounce" />
              </div>
            </div>
            <div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
              <p class="text-gray-600 mb-4">{{ getErrorMessage(error) }}</p>
              <div class="bg-red-50 border border-red-100 rounded-lg p-4 mb-6">
                <p class="text-sm text-red-700 font-medium">{{ error }}</p>
              </div>
            </div>
            <div class="flex justify-center space-x-4">
              <router-link
                to="/products"
                class="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md transition-all duration-200 hover:scale-105"
              >
                <ArrowLeftIcon class="h-4 w-4 mr-2" />
                Back to Products
              </router-link>
              <button
                @click="retryLoadProduct"
                class="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 transition-all duration-200 hover:scale-105 hover:shadow-lg retry-button"
              >
                <ArrowPathIcon class="h-4 w-4 mr-2" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Enhanced Edit Form with Smooth Data Population -->
      <Transition
        enter-active-class="transition-all duration-600 ease-out"
        enter-from-class="opacity-0 transform translate-y-8 scale-95"
        enter-to-class="opacity-100 transform translate-y-0 scale-100"
      >
        <div v-if="product && !loading" class="edit-form-container">
          <!-- Enhanced Header with Breadcrumb Animation -->
          <div class="mb-8 header-section">
            <Transition
              enter-active-class="transition-all duration-400 ease-out"
              enter-from-class="opacity-0 transform -translate-x-4"
              enter-to-class="opacity-100 transform translate-x-0"
            >
              <div class="breadcrumb-wrapper">
                <BreadcrumbNavigation :items="breadcrumbItems" />
              </div>
            </Transition>
            
            <Transition
              enter-active-class="transition-all duration-500 ease-out"
              enter-from-class="opacity-0 transform translate-y-4"
              enter-to-class="opacity-100 transform translate-y-0"
              appear
            >
              <div class="mt-6 header-content">
                <div class="flex items-center space-x-4 mb-3">
                  <router-link
                    :to="`/products/${product.id}`"
                    class="group flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-primary-50 text-gray-500 hover:text-primary-600 rounded-full transition-all duration-200 hover:scale-110 hover:shadow-md back-button"
                  >
                    <ArrowLeftIcon class="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-0.5" />
                  </router-link>
                  <div class="flex-1">
                    <h1 class="text-3xl font-bold text-gray-900 edit-title">
                      Edit Product
                      <span class="inline-block ml-2 text-2xl animate-pulse">✏️</span>
                    </h1>
                    <p class="text-lg text-gray-600 mt-1 edit-subtitle">
                      Update <span class="font-semibold text-primary-600">{{ product.name }}</span> with confidence
                    </p>
                  </div>
                  
                  <!-- Edit Mode Indicator -->
                  <div class="edit-mode-indicator bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                    <div class="flex items-center space-x-2 text-amber-700">
                      <div class="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                      <span class="text-sm font-medium">Edit Mode Active</span>
                    </div>
                  </div>
                </div>
                
                <!-- Data Population Status -->
                <Transition
                  enter-active-class="transition-all duration-400 ease-out"
                  enter-from-class="opacity-0 transform translate-y-2"
                  enter-to-class="opacity-100 transform translate-y-0"
                >
                  <div v-if="showDataPopulationStatus" class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 data-population-status">
                    <div class="flex items-center space-x-3">
                      <div class="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                      <span class="text-sm font-medium text-blue-800">{{ dataPopulationMessage }}</span>
                      <div class="flex space-x-1">
                        <div class="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                        <div class="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 100ms"></div>
                        <div class="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 200ms"></div>
                      </div>
                    </div>
                  </div>
                </Transition>
                
                <!-- Confidence Building Messages -->
                <div class="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 confidence-message">
                  <div class="flex items-center space-x-2 text-green-700">
                    <CheckCircleIcon class="h-4 w-4 text-green-500" />
                    <span class="text-sm font-medium">Your changes are automatically saved and can be reviewed before finalizing</span>
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Enhanced Form Wrapper with Smooth Population -->
          <Transition
            enter-active-class="transition-all duration-700 ease-out"
            enter-from-class="opacity-0 transform translate-y-6 scale-95"
            enter-to-class="opacity-100 transform translate-y-0 scale-100"
          >
            <div class="form-wrapper-container bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              <!-- Form Population Progress Bar -->
              <div class="bg-gradient-to-r from-primary-500 to-primary-600 h-1">
                <div 
                  class="h-full bg-gradient-to-r from-primary-400 to-primary-300 transition-all duration-1000 ease-out population-progress"
                  :style="{ width: `${populationProgress}%` }"
                ></div>
              </div>
              
              <div class="p-6">
                <!-- Change Tracking Indicator -->
                <Transition
                  enter-active-class="transition-all duration-300 ease-out"
                  enter-from-class="opacity-0 transform -translate-y-2"
                  enter-to-class="opacity-100 transform translate-y-0"
                  leave-active-class="transition-all duration-200 ease-in"
                  leave-from-class="opacity-100 transform translate-y-0"
                  leave-to-class="opacity-0 transform -translate-y-2"
                >
                  <div v-if="hasUnsavedChanges" class="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 change-indicator">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-3">
                        <div class="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
                        <span class="text-sm font-medium text-amber-800">You have unsaved changes</span>
                      </div>
                      <div class="text-xs text-amber-600 modified-indicator">
                        Changes will be preserved as you work
                      </div>
                    </div>
                  </div>
                </Transition>
                
                <ProductFormWrapper
                  :is-editing="true"
                  :initial-data="{ ...formData, productId }"
                  @success="handleSuccess"
                  @cancel="handleCancel"
                  @error="handleError"
                  @data-changed="handleDataChanged"
                />
              </div>
            </div>
          </Transition>
        </div>
        
        <!-- Not Found State -->
        <div v-if="!loading && !product" class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div class="text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Product not found</h3>
          <p class="text-gray-500 mb-6">
            The product you're looking for doesn't exist or may have been deleted.
          </p>
          <router-link
            to="/products"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            Back to Products
          </router-link>
        </div>
        </div>
      </Transition>

      <!-- Enhanced Success Toast with Celebration -->
      <Transition
        enter-active-class="transition-all duration-500 ease-out"
        enter-from-class="opacity-0 transform translate-y-8 scale-75 rotate-12"
        enter-to-class="opacity-100 transform translate-y-0 scale-100 rotate-0"
        leave-active-class="transition-all duration-300 ease-in"
        leave-from-class="opacity-100 transform translate-y-0 scale-100"
        leave-to-class="opacity-0 transform translate-y-4 scale-95"
      >
        <div
          v-if="showSuccessToast"
          class="fixed top-4 right-4 z-50 success-toast"
        >
          <div class="bg-white border border-green-200 rounded-xl shadow-xl p-6 max-w-sm">
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0">
                <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center success-icon-container">
                  <CheckCircleIcon class="h-6 w-6 text-green-600 animate-bounce" />
                </div>
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-900 mb-1">
                  Product Updated! 🎉
                </h3>
                <p class="text-sm text-gray-600 mb-3">
                  Your changes have been saved successfully and are now live.
                </p>
                <div class="flex items-center space-x-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
                  <div class="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Redirecting to product details...</span>
                </div>
              </div>
              <div class="flex-shrink-0">
                <div class="success-confetti">✨</div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  ArrowLeftIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon, 
  CheckCircleIcon 
} from '@heroicons/vue/24/outline'
import { useProductStore } from '@/stores/productStore'
import { usePrincipalStore } from '@/stores/principalStore'
import BreadcrumbNavigation from '@/components/common/BreadcrumbNavigation.vue'
import ProductFormWrapper from '@/components/forms/ProductFormWrapper.vue'
import type { 
  Product,
  ProductWithPrincipals, 
  ProductCategory 
} from '@/types/products'
import type { 
  ProductFormWrapperData,
  ProductSpecification,
  UnitOfMeasure,
  Currency
} from '@/types/productForm'

// Router and route
const route = useRoute()
const router = useRouter()

// Stores
const productStore = useProductStore()
const principalStore = usePrincipalStore()

// Get product ID from route params
const productId = route.params.id as string

// State
const product = ref<Product | ProductWithPrincipals | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const showSuccessToast = ref(false)
const hasUnsavedChanges = ref(false)

// Enhanced UX State
const showDataPopulationStatus = ref(false)
const dataPopulationMessage = ref('Preparing your product data...')
const populationProgress = ref(0)
const loadingMessage = ref('Loading your product...')
const loadingSubtext = ref('Gathering all the details to make editing smooth and easy')

// Loading messages rotation for personality
const loadingMessages = [
  { main: 'Loading your product...', sub: 'Gathering all the details to make editing smooth and easy' },
  { main: 'Preparing your workspace...', sub: 'Setting up everything you need for confident editing' },
  { main: 'Almost ready...', sub: 'Just a moment while we organize your product data' }
]

const dataPopulationMessages = [
  'Preparing your product data...',
  'Loading product details...',
  'Setting up editing workspace...',
  'Finalizing data population...'
]

// Form data for ProductFormWrapper
const formData = reactive<Partial<ProductFormWrapperData>>({})

// ===============================
// COMPUTED PROPERTIES
// ===============================

const breadcrumbItems = computed(() => [
  { label: 'Products', href: '/products' },
  { 
    label: product.value?.name || 'Loading...', 
    href: product.value ? `/products/${product.value.id}` : '#' 
  },
  { label: 'Edit', href: '#', current: true }
])

// ===============================
// DATA TRANSFORMATION
// ===============================

/**
 * Transform product data to form data structure
 */
const transformProductToFormData = (productData: Product | ProductWithPrincipals): Partial<ProductFormWrapperData> => {
  // Get principal relationships if available
  const principalIds = 'principal_ids' in productData ? productData.principal_ids : []
  
  return {
    // Step 1: Basic Information
    name: productData.name,
    description: productData.description || '',
    category: productData.category as ProductCategory | null,
    sku: productData.sku || '',
    autoGenerateSku: false, // Since we have existing SKU, disable auto-generation
    isActive: productData.is_active,
    
    // Step 2: Product Details & Pricing
    unitPrice: productData.unit_price || null,
    costPrice: null, // Would need to be added to product schema
    currency: 'USD' as Currency, // Default, would need to be in product schema
    unitOfMeasure: 'Each' as UnitOfMeasure, // Default, would need to be in product schema
    minimumOrderQuantity: null, // Would need to be in product schema
    leadTimeDays: null, // Would need to be in product schema
    specifications: [] as ProductSpecification[], // Would need separate API call or join
    
    // Step 3: Principal Assignment
    selectedPrincipals: principalIds,
    principalRequired: true,
    bulkAssignMode: false,
    
    // Step 4: Review & Confirmation
    termsAccepted: true, // Already accepted since product exists
    notificationEmails: [],
    saveAsDraft: false
  }
}

// Note: Form data transformation is handled by the ProductFormWrapper

// ===============================
// ACTIONS
// ===============================

/**
 * Enhanced error message generation
 */
const getErrorMessage = (errorText: string): string => {
  if (errorText.includes('not found')) {
    return "This product seems to have moved or been removed. Let's try loading it again, or you can return to the product list."
  }
  if (errorText.includes('network') || errorText.includes('fetch')) {
    return "We're having trouble connecting right now. Your internet connection might be slow, but don't worry - we'll get you back on track."
  }
  if (errorText.includes('permission') || errorText.includes('access')) {
    return "It looks like you might not have permission to edit this product. Let's try refreshing or contact your administrator."
  }
  return "Something unexpected happened, but these things usually resolve quickly. Let's give it another try!"
}

/**
 * Animate loading messages for personality
 */
const rotateLoadingMessages = () => {
  let messageIndex = 0
  const interval = setInterval(() => {
    if (!loading.value) {
      clearInterval(interval)
      return
    }
    messageIndex = (messageIndex + 1) % loadingMessages.length
    const message = loadingMessages[messageIndex]
    loadingMessage.value = message.main
    loadingSubtext.value = message.sub
  }, 2000)
}

/**
 * Enhanced data population simulation
 */
const simulateDataPopulation = async () => {
  showDataPopulationStatus.value = true
  
  // Simulate progressive data population
  const steps = dataPopulationMessages.length
  for (let i = 0; i < steps; i++) {
    dataPopulationMessage.value = dataPopulationMessages[i]
    populationProgress.value = ((i + 1) / steps) * 100
    await new Promise(resolve => setTimeout(resolve, 300))
  }
  
  // Complete population
  await new Promise(resolve => setTimeout(resolve, 200))
  showDataPopulationStatus.value = false
  populationProgress.value = 100
}

/**
 * Enhanced load product with smooth UX
 */
const loadProduct = async () => {
  try {
    loading.value = true
    error.value = null
    populationProgress.value = 0
    
    // Start loading message rotation
    rotateLoadingMessages()
    
    // Fetch product details
    await productStore.fetchProductById(productId)
    
    if (productStore.selectedProduct) {
      product.value = productStore.selectedProduct
      
      // Stop loading and start data population simulation
      loading.value = false
      await simulateDataPopulation()
      
      // Transform product data to form data
      const transformedData = transformProductToFormData(productStore.selectedProduct)
      Object.assign(formData, transformedData)
    } else {
      error.value = productStore.error || 'Product not found'
      loading.value = false
    }
  } catch (err) {
    error.value = 'An unexpected error occurred while loading the product'
    console.error('Error loading product:', err)
    loading.value = false
  }
}

/**
 * Enhanced retry with gentle shake animation
 */
const retryLoadProduct = async () => {
  // Add shake animation to retry button
  const retryButton = document.querySelector('.retry-button')
  if (retryButton) {
    retryButton.classList.add('animate-shake')
    setTimeout(() => {
      retryButton.classList.remove('animate-shake')
    }, 600)
  }
  
  await loadProduct()
}

/**
 * Enhanced success handling with celebration
 */
const handleSuccess = async () => {
  try {
    // Reset unsaved changes flag immediately
    hasUnsavedChanges.value = false
    
    // Add success celebration effects
    const formContainer = document.querySelector('.form-wrapper-container')
    if (formContainer) {
      formContainer.classList.add('success-celebration')
      setTimeout(() => {
        formContainer.classList.remove('success-celebration')
      }, 1000)
    }
    
    // Show enhanced success toast with celebration
    showSuccessToast.value = true
    
    // Add confetti animation
    createSuccessConfetti()
    
    // Auto-hide toast and navigate after celebration
    setTimeout(() => {
      showSuccessToast.value = false
      router.push(`/products/${productId}`)
    }, 3500)
    
  } catch (err) {
    console.error('Error handling success:', err)
  }
}

/**
 * Create success confetti animation
 */
const createSuccessConfetti = () => {
  const confettiContainer = document.querySelector('.success-confetti')
  if (confettiContainer) {
    // Add floating confetti animation
    const confettiEmojis = ['🎉', '✨', '🌟', '⭐', '💫']
    let confettiIndex = 0
    
    const animateConfetti = () => {
      if (confettiIndex < 8) {
        const emoji = confettiEmojis[Math.floor(Math.random() * confettiEmojis.length)]
        const confetti = document.createElement('div')
        confetti.textContent = emoji
        confetti.className = 'floating-confetti'
        confetti.style.cssText = `
          position: absolute;
          font-size: 1.2rem;
          animation: confettiFall 2s ease-out forwards;
          left: ${Math.random() * 100}%;
          top: 0;
          z-index: 10;
        `
        confettiContainer.appendChild(confetti)
        
        setTimeout(() => {
          confetti.remove()
        }, 2000)
        
        confettiIndex++
        setTimeout(animateConfetti, 200)
      }
    }
    
    animateConfetti()
  }
}

/**
 * Enhanced form cancellation with gentle confirmation
 */
const handleCancel = () => {
  if (hasUnsavedChanges.value) {
    // Create a more user-friendly confirmation experience
    const confirmMessage = `You have unsaved changes that will be lost.\n\nAre you sure you want to leave without saving your edits to "${product.value?.name || 'this product'}"?`
    const confirmed = window.confirm(confirmMessage)
    if (!confirmed) {
      // Add gentle shake to indicate staying
      const formContainer = document.querySelector('.form-wrapper-container')
      if (formContainer) {
        formContainer.classList.add('cancel-shake')
        setTimeout(() => {
          formContainer.classList.remove('cancel-shake')
        }, 600)
      }
      return
    }
  }
  
  // Add smooth exit animation
  const editContainer = document.querySelector('.edit-form-container')
  if (editContainer) {
    editContainer.classList.add('exit-animation')
  }
  
  // Navigate back after animation
  setTimeout(() => {
    router.push(`/products/${productId}`)
  }, 300)
}

/**
 * Handle form submission error
 */
const handleError = (error: string | Error) => {
  console.error('Form submission error:', error)
  // Error handling is managed by the ProductFormWrapper component
}

/**
 * Handle form data changes
 */
const handleDataChanged = () => {
  hasUnsavedChanges.value = true
  // Could implement auto-save or change tracking here
}

// ===============================
// NAVIGATION GUARDS
// ===============================

/**
 * Handle browser navigation away from page
 */
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (hasUnsavedChanges.value) {
    event.preventDefault()
    event.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
    return 'You have unsaved changes. Are you sure you want to leave?'
  }
}

// ===============================
// LIFECYCLE HOOKS
// ===============================

onMounted(async () => {
  // Add beforeunload event listener for unsaved changes
  window.addEventListener('beforeunload', handleBeforeUnload)
  
  // Load product data
  await loadProduct()
  
  // Ensure principals are loaded for the form
  if (!principalStore.principals.length) {
    await principalStore.fetchPrincipals()
  }
})

// Cleanup on unmount
import { onUnmounted } from 'vue'
onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  productStore.clearSelectedProduct()
  productStore.clearError()
})
</script>

<style scoped>
/* ===================================
   ENHANCED LOADING ANIMATIONS
   =================================== */

/* Enhanced loading spinner with personality */
.loading-spinner {
  position: relative;
}

.loading-spinner::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: linear-gradient(45deg, transparent, rgba(59, 130, 246, 0.3), transparent);
  animation: spinGlow 2s linear infinite;
}

@keyframes spinGlow {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-card {
  animation: loadingPulse 2s ease-in-out infinite;
}

@keyframes loadingPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.loading-message {
  animation: messageSlideIn 0.5s ease-out;
}

@keyframes messageSlideIn {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.loading-dot {
  animation-duration: 1.4s !important;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
}

/* ===================================
   PAGE ENTRANCE ANIMATIONS
   =================================== */

.page-container {
  animation: pageSlideIn 0.6s cubic-bezier(0.23, 1, 0.32, 1);
}

@keyframes pageSlideIn {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.breadcrumb-wrapper {
  animation: breadcrumbSlide 0.4s ease-out;
}

@keyframes breadcrumbSlide {
  0% {
    opacity: 0;
    transform: translateX(-20px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

/* ===================================
   HEADER ENHANCEMENTS
   =================================== */

.edit-title {
  animation: titleBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes titleBounce {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.9);
  }
  60% {
    transform: translateY(-5px) scale(1.05);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.edit-subtitle {
  animation: subtitleFade 0.8s ease-out 0.2s both;
}

@keyframes subtitleFade {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.back-button {
  position: relative;
  overflow: hidden;
}

.back-button::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, transparent, rgba(59, 130, 246, 0.1), transparent);
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.back-button:hover::before {
  transform: translateX(100%);
}

.edit-mode-indicator {
  animation: modeIndicatorPulse 2s ease-in-out infinite;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
}

@keyframes modeIndicatorPulse {
  0%, 100% {
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
  }
  50% {
    box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4);
  }
}

/* ===================================
   DATA POPULATION ANIMATIONS
   =================================== */

.data-population-status {
  animation: statusSlideIn 0.4s ease-out;
}

@keyframes statusSlideIn {
  0% {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.population-progress {
  background: linear-gradient(90deg, #60A5FA, #3B82F6, #2563EB);
  background-size: 200% 100%;
  animation: progressShimmer 1.5s ease-in-out infinite;
}

@keyframes progressShimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.confidence-message {
  animation: confidenceGlow 0.6s ease-out;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.1);
}

@keyframes confidenceGlow {
  0% {
    opacity: 0;
    transform: translateY(10px);
    box-shadow: 0 0 0 rgba(34, 197, 94, 0);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.1);
  }
}

/* ===================================
   FORM ENHANCEMENTS
   =================================== */

.form-wrapper-container {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-wrapper-container:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.change-indicator {
  animation: changeAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes changeAppear {
  0% {
    opacity: 0;
    transform: translateY(-10px) scale(0.9);
  }
  50% {
    transform: translateY(-2px) scale(1.05);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modified-indicator {
  animation: indicatorPulse 2s ease-in-out infinite;
}

@keyframes indicatorPulse {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

/* ===================================
   SUCCESS CELEBRATIONS
   =================================== */

.success-celebration {
  animation: celebrationBounce 1s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes celebrationBounce {
  0% { transform: scale(1); }
  25% { transform: scale(1.05) rotate(1deg); }
  50% { transform: scale(1.1) rotate(-1deg); }
  75% { transform: scale(1.05) rotate(0.5deg); }
  100% { transform: scale(1) rotate(0deg); }
}

.success-toast {
  animation: toastSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  backdrop-filter: blur(12px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

@keyframes toastSlideIn {
  0% {
    opacity: 0;
    transform: translateY(20px) translateX(20px) scale(0.8) rotate(5deg);
  }
  100% {
    opacity: 1;
    transform: translateY(0) translateX(0) scale(1) rotate(0deg);
  }
}

.success-icon-container {
  animation: iconCelebration 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes iconCelebration {
  0% { transform: scale(0.5) rotate(-180deg); }
  50% { transform: scale(1.2) rotate(10deg); }
  100% { transform: scale(1) rotate(0deg); }
}

.success-confetti {
  position: relative;
  animation: confettiSpin 2s ease-in-out;
}

@keyframes confettiSpin {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.5); }
  100% { transform: rotate(360deg) scale(1); }
}

@keyframes confettiFall {
  0% {
    opacity: 1;
    transform: translateY(0) rotate(0deg) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(100px) rotate(360deg) scale(0.5);
  }
}

/* ===================================
   ERROR STATE ENHANCEMENTS
   =================================== */

.error-card {
  animation: errorGentleBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes errorGentleBounce {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.9);
  }
  60% {
    transform: translateY(-5px) scale(1.05);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.error-icon-container {
  animation: errorIconPulse 2s ease-in-out infinite;
}

@keyframes errorIconPulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 4px 8px rgba(239, 68, 68, 0.2);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 6px 12px rgba(239, 68, 68, 0.3);
  }
}

.retry-button {
  position: relative;
  overflow: hidden;
}

.retry-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.retry-button:hover::before {
  left: 100%;
}

/* ===================================
   ANIMATION UTILITIES
   =================================== */

.animate-shake {
  animation: gentleShake 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

@keyframes gentleShake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
}

.cancel-shake {
  animation: cancelShake 0.6s ease-in-out;
}

@keyframes cancelShake {
  0%, 100% { transform: translateX(0) scale(1); }
  25% { transform: translateX(-3px) scale(1.01); }
  75% { transform: translateX(3px) scale(1.01); }
}

.exit-animation {
  animation: exitSlide 0.3s ease-in both;
}

@keyframes exitSlide {
  0% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateX(-20px) scale(0.95);
  }
}

/* ===================================
   INTERACTION ENHANCEMENTS
   =================================== */

/* Enhanced focus states */
button:focus-visible,
.back-button:focus-visible,
.retry-button:focus-visible {
  outline: 2px solid #3B82F6;
  outline-offset: 3px;
  animation: focusGlow 0.3s ease-out;
}

@keyframes focusGlow {
  0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5); }
  100% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
}

/* Hover state enhancements */
button:not(:disabled):hover {
  animation: buttonHover 0.2s ease-out;
}

@keyframes buttonHover {
  0% { transform: translateY(0); }
  100% { transform: translateY(-1px); }
}

/* ===================================
   RESPONSIVE OPTIMIZATIONS
   =================================== */

@media (max-width: 768px) {
  .page-container {
    animation-duration: 0.4s;
  }
  
  .edit-title {
    font-size: 1.75rem;
  }
  
  .success-toast {
    margin: 0 1rem;
    max-width: calc(100vw - 2rem);
  }
  
  .form-wrapper-container:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }
  
  /* Reduce animation intensity on mobile */
  .celebration-bounce,
  .error-gentle-bounce {
    animation-duration: 0.3s;
  }
}

/* ===================================
   ACCESSIBILITY OPTIMIZATIONS
   =================================== */

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
  }
  
  /* Maintain essential feedback */
  .success-toast {
    opacity: 1;
    transform: none;
  }
  
  .back-button:hover,
  .retry-button:hover {
    background-color: rgba(59, 130, 246, 0.1);
  }
  
  .form-wrapper-container:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .edit-mode-indicator,
  .confidence-message,
  .change-indicator,
  .data-population-status {
    border-width: 2px;
  }
  
  .loading-spinner {
    border-width: 3px;
  }
  
  .success-toast {
    border-width: 2px;
    border-color: #059669;
  }
}

/* ===================================
   LEGACY STYLES (PRESERVED)
   =================================== */

/* Form container responsive adjustments */
@media (max-width: 640px) {
  .max-w-5xl {
    max-width: 100%;
    margin-left: 1rem;
    margin-right: 1rem;
  }
}

/* Focus management for accessibility */
.focus-visible:focus {
  outline: 2px solid theme('colors.primary.500');
  outline-offset: 2px;
}

/* Error state styling */
.border-red-200 {
  border-color: rgb(254 202 202);
}

/* Loading state enhancements */
.border-b-2 {
  border-bottom-width: 2px;
}

.border-primary-600 {
  border-color: rgb(37 99 235);
}

/* Smooth transitions */
.transition-colors {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Button hover effects */
.hover\:bg-gray-50:hover {
  background-color: rgb(249 250 251);
}

.hover\:bg-primary-700:hover {
  background-color: rgb(29 78 216);
}

.hover\:text-gray-700:hover {
  color: rgb(55 65 81);
}

/* Shadow enhancements */
.shadow-lg {
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

/* Responsive text sizing */
@media (max-width: 768px) {
  .text-3xl {
    font-size: 1.875rem;
    line-height: 2.25rem;
  }
  
  .text-lg {
    font-size: 1rem;
    line-height: 1.5rem;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .border-gray-200 {
    border-color: rgb(0 0 0);
    border-width: 2px;
  }
  
  .text-gray-500 {
    color: rgb(0 0 0);
  }
  
  .text-gray-700 {
    color: rgb(0 0 0);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .transition-all,
  .transition-colors,
  .animate-spin {
    transition: none !important;
    animation: none !important;
  }
}

/* Print styles */
@media print {
  .fixed {
    position: static;
  }
  
  .shadow-lg,
  .shadow-sm {
    box-shadow: none;
  }
  
  .bg-gray-50 {
    background-color: white;
  }
}
</style>