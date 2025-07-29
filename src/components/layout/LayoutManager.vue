<template>
  <component
    :is="currentLayoutComponent"
    v-bind="layoutProps"
  >
    <router-view />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DashboardLayout from './DashboardLayout.vue'
import DefaultLayout from './DefaultLayout.vue'

/**
 * Layout Manager - Route-based layout switching
 * Manages different layout types based on route meta information
 * Provides centralized layout configuration with persistent state
 */

const route = useRoute()

// Layout type mapping based on route patterns
const getLayoutType = (routePath: string): 'dashboard' | 'default' => {
  // Dashboard layout for main app routes
  if (routePath.startsWith('/') && (
    routePath === '/' || 
    routePath.startsWith('/contacts') || 
    routePath.startsWith('/organizations') ||
    routePath.startsWith('/opportunities') ||
    routePath.startsWith('/profile') ||
    routePath.startsWith('/preferences')
  )) {
    return 'dashboard'
  }
  
  // Default layout for standalone pages
  return 'default'
}

// Dynamic layout component selection
const currentLayoutComponent = computed(() => {
  const layoutType = route.meta?.layout as string || getLayoutType(route.path)
  
  switch (layoutType) {
    case 'dashboard':
      return DashboardLayout
    case 'default':
      return DefaultLayout
    default:
      return DashboardLayout // Default to dashboard layout
  }
})

// Props to pass to the layout component
const layoutProps = computed(() => {
  return {
    route: route.path,
    title: route.meta?.title as string,
    description: route.meta?.description as string
  }
})
</script>