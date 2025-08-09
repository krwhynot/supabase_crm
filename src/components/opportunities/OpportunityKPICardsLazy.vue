<template>
  <div class="opportunity-kpi-lazy-wrapper">
    <!-- Loading skeleton while component is loading -->
    <div v-if="!isComponentLoaded" class="kpi-skeleton">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
          <div class="flex items-center justify-between mb-2">
            <div class="h-4 bg-gray-300 rounded w-24"></div>
            <div class="w-6 h-6 bg-gray-300 rounded"></div>
          </div>
          <div class="h-8 bg-gray-300 rounded w-16 mb-1"></div>
          <div class="h-3 bg-gray-300 rounded w-20"></div>
        </div>
      </div>
    </div>
    
    <!-- Actual component with intersection observer -->
    <div v-show="isComponentLoaded" ref="kpiContainer" class="kpi-container">
      <Suspense>
        <template #default>
          <OpportunityKPICards v-if="shouldLoadComponent" v-bind="$attrs" />
        </template>
        <template #fallback>
          <div class="kpi-skeleton">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div v-for="i in 4" :key="i" class="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
                <div class="flex items-center justify-between mb-2">
                  <div class="h-4 bg-gray-300 rounded w-24"></div>
                  <div class="w-6 h-6 bg-gray-300 rounded"></div>
                </div>
                <div class="h-8 bg-gray-300 rounded w-16 mb-1"></div>
                <div class="h-3 bg-gray-300 rounded w-20"></div>
              </div>
            </div>
          </div>
        </template>
      </Suspense>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineAsyncComponent } from 'vue'

// Props forwarding
defineOptions({
  inheritAttrs: true
})

// Lazy load the actual KPI component
const OpportunityKPICards = defineAsyncComponent({
  loader: () => import('./OpportunityKPICards.vue'),
  delay: 100,
  timeout: 5000,
  suspensible: true
})

// Reactive state
const kpiContainer = ref<HTMLElement>()
const shouldLoadComponent = ref(false)
const isComponentLoaded = ref(false)
let observer: IntersectionObserver | null = null

// Intersection Observer for lazy loading
const setupIntersectionObserver = () => {
  if (!kpiContainer.value) return

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          shouldLoadComponent.value = true
          // Add small delay for smooth loading
          setTimeout(() => {
            isComponentLoaded.value = true
          }, 200)
          observer?.disconnect()
        }
      })
    },
    {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    }
  )

  observer.observe(kpiContainer.value)
}

// Component lifecycle
onMounted(() => {
  // Use requestIdleCallback for better performance
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      setupIntersectionObserver()
    })
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      setupIntersectionObserver()
    }, 100)
  }
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<style scoped>
.opportunity-kpi-lazy-wrapper {
  min-height: 200px; /* Prevent layout shift */
}

.kpi-skeleton {
  opacity: 0.7;
}

.kpi-container {
  transition: opacity 0.3s ease-in-out;
}

/* Reduce animations for better performance */
@media (prefers-reduced-motion: reduce) {
  .kpi-container {
    transition: none;
  }
}
</style>