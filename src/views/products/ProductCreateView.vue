<template>
  <div class="product-create-view">
    <!-- Page Header -->
    <div class="mb-8">
      <!-- Breadcrumb Navigation -->
      <nav class="flex mb-4" aria-label="Breadcrumb">
        <ol class="inline-flex items-center space-x-1 md:space-x-3">
          <li class="inline-flex items-center">
            <router-link
              to="/"
              class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-primary-600"
            >
              <svg class="w-3 h-3 mr-2.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"/>
              </svg>
              Dashboard
            </router-link>
          </li>
          <li>
            <div class="flex items-center">
              <svg class="w-3 h-3 text-gray-400 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 5 7 7-7 7"></path>
              </svg>
              <router-link
                to="/products"
                class="ml-1 text-sm font-medium text-gray-700 hover:text-primary-600 md:ml-2"
              >
                Products
              </router-link>
            </div>
          </li>
          <li aria-current="page">
            <div class="flex items-center">
              <svg class="w-3 h-3 text-gray-400 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 5 7 7-7 7"></path>
              </svg>
              <span class="ml-1 text-sm font-medium text-gray-500 md:ml-2">New Product</span>
            </div>
          </li>
        </ol>
      </nav>

      <!-- Header Content -->
      <div class="flex items-center space-x-3 mb-4">
        <router-link
          to="/products"
          class="inline-flex items-center text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md p-1"
          :aria-label="'Back to products list'"
        >
          <ArrowLeftIcon class="h-5 w-5" />
        </router-link>
        <div>
          <h1 class="text-3xl font-bold text-gray-900" data-testid="page-title">Create New Product</h1>
          <p class="mt-2 text-gray-600">
            Set up a new product with comprehensive details, pricing, and principal assignments in four simple steps.
          </p>
        </div>
      </div>
    </div>

    <!-- Product Form -->
    <div class="max-w-4xl" data-testid="product-form-container">
      <ProductFormWrapper
        :is-editing="false"
        :initial-data="contextData"
        @success="handleSuccess"
        @cancel="handleCancel"
        @error="handleError"
        @draft-saved="handleDraftSaved"
        data-testid="product-form"
      />
    </div>
    
    <!-- Error Display -->
    <div v-if="submitError" class="mt-6 max-w-4xl">
      <div class="p-4 border border-red-300 rounded-md bg-red-50">
        <div class="flex">
          <ExclamationTriangleIcon class="h-5 w-5 text-red-400 mr-2 mt-0.5" />
          <div>
            <h3 class="text-sm font-medium text-red-800">Error creating product</h3>
            <p class="mt-1 text-sm text-red-700">{{ submitError }}</p>
            <div class="mt-3">
              <button
                @click="clearError"
                class="text-sm font-medium text-red-800 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-md px-2 py-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Message (shown briefly before navigation) -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 scale-95 translate-y-2"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 translate-y-2"
    >
      <div v-if="successMessage" class="mt-6 max-w-4xl celebration-card">
        <div class="p-6 border border-green-300 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg relative overflow-hidden">
          <!-- Celebration confetti animation -->
          <div class="absolute inset-0 pointer-events-none">
            <div class="confetti-particle absolute animate-bounce" style="left: 20%; top: 10%; animation-delay: 0ms;"></div>
            <div class="confetti-particle absolute animate-bounce" style="left: 70%; top: 15%; animation-delay: 200ms;"></div>
            <div class="confetti-particle absolute animate-bounce" style="left: 45%; top: 20%; animation-delay: 400ms;"></div>
            <div class="confetti-particle absolute animate-bounce" style="left: 80%; top: 25%; animation-delay: 600ms;"></div>
          </div>
          
          <div class="flex items-center relative z-10">
            <div class="celebration-icon-wrapper mr-4">
              <CheckCircleIcon class="h-8 w-8 text-green-500 animate-pulse" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-green-800 flex items-center">
                <span class="animate-bounce mr-2">🎉</span>
                Product Created Successfully!
                <span class="animate-bounce ml-2">🎉</span>
              </h3>
              <p class="mt-2 text-sm text-green-700">{{ successMessage }}</p>
              <div class="mt-3">
                <div class="w-full bg-green-200 rounded-full h-1 overflow-hidden">
                  <div class="redirect-progress h-full bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeftIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'
import ProductFormWrapper from '@/components/forms/ProductFormWrapper.vue'
import type { ProductFormWrapperData } from '@/types/productForm'
// import type { ProductFormContext } from '@/types/productForm' // Currently unused
import { ProductCategory } from '@/types/products'

// Dependencies
const router = useRouter()
const route = useRoute()

// ===============================
// REACTIVE STATE
// ===============================

const submitError = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Context data processing
const contextData = computed((): Partial<ProductFormWrapperData> => {
  const query = route.query
  const initialData: Partial<ProductFormWrapperData> = {}
  
  // Handle context from principal detail page
  if (query.contextType === 'principal') {
    initialData.selectedPrincipals = query.principalId ? [query.principalId as string] : []
    // Pre-select principal if coming from principal page
    initialData.principalRequired = true
    
    if (query.principalName) {
      initialData.description = `Product created for principal: ${query.principalName}`
    }
  }
  
  // Handle context from category filter
  if (query.contextType === 'category' && query.category) {
    const category = query.category as string
    if (Object.values(ProductCategory).includes(category as ProductCategory)) {
      initialData.category = category as ProductCategory
    }
  }
  
  // Handle duplication context
  if (query.contextType === 'duplicate' && query.duplicateFromId) {
    // This would need to fetch the original product data
    // For now, just note that it's a duplicate
    initialData.name = query.duplicateFromName ? `Copy of ${query.duplicateFromName}` : 'Copy of Product'
  }
  
  return initialData
})

// ===============================
// EVENT HANDLERS
// ===============================

/**
 * Handle successful product creation
 * Navigate to the created product's detail page
 */
const handleSuccess = (data: { productId?: string; productName?: string; assignedPrincipals?: number }) => {
  console.log('Product created successfully:', data)
  
  // Clear any previous errors
  submitError.value = null
  
  if (data.productId) {
    const assignedCount = data.assignedPrincipals || 0
    const assignmentText = assignedCount > 0 ? ` and assigned to ${assignedCount} principal${assignedCount !== 1 ? 's' : ''}` : ''
    
    successMessage.value = `Product "${data.productName || 'New Product'}" created successfully${assignmentText}! Redirecting to details...`
    
    // Brief delay to show success message before navigation
    setTimeout(() => {
      router.push(`/products/${data.productId}`)
    }, 1500)
  } else {
    // Fallback - redirect to products list
    successMessage.value = 'Product created successfully! Redirecting...'
    
    setTimeout(() => {
      router.push('/products')
    }, 1500)
  }
}

/**
 * Handle form cancellation
 * Navigate back to products list
 */
const handleCancel = () => {
  // Clear any messages
  submitError.value = null
  successMessage.value = null
  
  // Navigate back to products list
  router.push('/products')
}

/**
 * Handle form submission error
 */
const handleError = (error: string | Error) => {
  console.error('Product creation error:', error)
  
  // Clear success message if any
  successMessage.value = null
  
  // Set error message
  submitError.value = typeof error === 'string' ? error : error.message || 'An unexpected error occurred'
}

/**
 * Handle draft saving
 */
const handleDraftSaved = (formData: ProductFormWrapperData) => {
  console.log('Product form draft saved:', formData)
  // Could show a brief toast notification here
}

/**
 * Clear error message
 */
const clearError = () => {
  submitError.value = null
}
</script>

<style scoped>
.product-create-view {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6;
}

/* Breadcrumb enhancements */
.product-create-view nav ol li a:hover {
  @apply text-primary-600 transform scale-105;
  transition: all 0.2s ease-in-out;
}

.product-create-view nav ol li[aria-current="page"] span {
  color: rgb(107 114 128);
}

/* Back button enhancements */
.product-create-view a[aria-label]:hover {
  @apply bg-gray-50 transform scale-110;
  transition: all 0.2s ease-in-out;
}

/* Success celebration styles */
.celebration-card {
  animation: celebration-entrance 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes celebration-entrance {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(20px) rotateX(90deg);
  }
  60% {
    opacity: 0.8;
    transform: scale(1.05) translateY(-5px) rotateX(0deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0) rotateX(0deg);
  }
}

.celebration-icon-wrapper {
  animation: icon-celebration 0.8s ease-in-out;
}

@keyframes icon-celebration {
  0%, 100% { transform: scale(1); }
  25% { transform: scale(1.2) rotate(10deg); }
  50% { transform: scale(1.3) rotate(-10deg); }
  75% { transform: scale(1.1) rotate(5deg); }
}

.confetti-particle {
  width: 8px;
  height: 8px;
  background: linear-gradient(45deg, #10b981, #059669);
  border-radius: 50%;
  opacity: 0.8;
  animation-duration: 2s;
  animation-iteration-count: infinite;
}

.confetti-particle:nth-child(odd) {
  background: linear-gradient(45deg, #3b82f6, #1d4ed8);
}

.redirect-progress {
  animation: progress-fill 1.5s ease-in-out;
  width: 100%;
}

@keyframes progress-fill {
  0% { width: 0%; }
  100% { width: 100%; }
}

/* Hover animations for interactive elements */
.product-create-view button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease-in-out;
}

.product-create-view a:hover {
  transition: all 0.2s ease-in-out;
}

/* Responsive design */
@media (max-width: 1024px) {
  .product-create-view {
    @apply px-4;
  }
}

@media (max-width: 768px) {
  .product-create-view {
    @apply px-2 py-4;
  }
  
  /* Stack header elements on mobile */
  .product-create-view .flex.items-center.space-x-3 {
    @apply flex-col items-start space-x-0 space-y-3;
  }
  
  .product-create-view .flex.items-center.space-x-3 > a {
    @apply self-start;
  }

  .confetti-particle {
    width: 6px;
    height: 6px;
  }
}

/* Accessibility enhancements */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
  
  .celebration-card {
    animation: none;
  }
  
  .confetti-particle {
    animation: none;
    opacity: 0.3;
  }
  
  .redirect-progress {
    animation: none;
    width: 100%;
  }
  
  .product-create-view a:hover,
  .product-create-view button:hover {
    transform: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .product-create-view .border-red-300 {
    border-color: rgb(220 38 38);
  }
  
  .product-create-view .border-green-300 {
    border-color: rgb(22 163 74);
  }
  
  .product-create-view .text-gray-500 {
    color: rgb(31 41 55);
  }
  
  .product-create-view .text-gray-600 {
    color: rgb(17 24 39);
  }

  .confetti-particle {
    opacity: 1;
    border: 2px solid currentColor;
  }
}

/* Print styles */
@media print {
  .product-create-view nav,
  .product-create-view button {
    @apply hidden;
  }
  
  .product-create-view {
    @apply shadow-none;
  }
  
  .celebration-card {
    animation: none;
  }
}
</style>