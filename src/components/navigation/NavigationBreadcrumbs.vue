<!--
  NavigationBreadcrumbs - Dynamic breadcrumb generation with Principal context
  
  Features:
  - Automatic breadcrumb generation from current route
  - Principal name integration in breadcrumb path
  - Click-through navigation to parent routes
  - Responsive breadcrumb display for mobile devices
  - Context-sensitive navigation based on route structure
-->
<template>
  <nav class="flex mb-6" aria-label="Breadcrumb" data-testid="navigation-breadcrumbs">
    <ol class="flex items-center space-x-2 text-sm">
      <li>
        <router-link
          to="/"
          class="text-gray-500 hover:text-gray-700 font-medium transition-colors duration-200"
        >
          <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v0M8 11h8m-4-4v8" />
          </svg>
          Dashboard
        </router-link>
      </li>

      <li
        v-for="(breadcrumb, index) in breadcrumbs"
        :key="breadcrumb.path"
        class="flex items-center"
      >
        <!-- Separator -->
        <svg class="w-4 h-4 text-gray-400 mx-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>

        <!-- Breadcrumb Link or Text -->
        <router-link
          v-if="index < breadcrumbs.length - 1"
          :to="breadcrumb.path"
          class="text-gray-500 hover:text-gray-700 font-medium transition-colors duration-200 truncate max-w-32 sm:max-w-48"
          :title="breadcrumb.name"
        >
          {{ breadcrumb.name }}
        </router-link>
        
        <span
          v-else
          class="text-gray-900 font-semibold truncate max-w-32 sm:max-w-48"
          :title="breadcrumb.name"
        >
          {{ breadcrumb.name }}
        </span>
      </li>
    </ol>

    <!-- Mobile Breadcrumb Toggle -->
    <div class="sm:hidden ml-auto">
      <button
        @click="showMobileBreadcrumbs = !showMobileBreadcrumbs"
        class="p-2 text-gray-500 hover:text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        :aria-label="showMobileBreadcrumbs ? 'Hide breadcrumbs' : 'Show breadcrumbs'"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>

    <!-- Mobile Breadcrumb Dropdown -->
    <div
      v-if="showMobileBreadcrumbs"
      class="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg mt-1 z-10 sm:hidden"
    >
      <div class="p-3 space-y-2">
        <router-link
          to="/"
          class="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
        >
          <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          </svg>
          Dashboard
        </router-link>
        
        <router-link
          v-for="breadcrumb in breadcrumbs"
          :key="breadcrumb.path"
          :to="breadcrumb.path"
          class="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
        >
          {{ breadcrumb.name }}
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

interface Breadcrumb {
  name: string
  path: string
}

// ===============================
// COMPOSABLES
// ===============================

const route = useRoute()

// ===============================
// REACTIVE STATE
// ===============================

const showMobileBreadcrumbs = ref(false)

// ===============================
// COMPUTED PROPERTIES
// ===============================

const breadcrumbs = computed((): Breadcrumb[] => {
  const pathSegments = route.path.split('/').filter(segment => segment !== '')
  const breadcrumbList: Breadcrumb[] = []
  
  let currentPath = ''
  
  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i]
    currentPath += `/${segment}`
    
    // Skip certain segments or provide custom names
    let breadcrumbName = getBreadcrumbName(segment, i, pathSegments)
    
    if (breadcrumbName) {
      breadcrumbList.push({
        name: breadcrumbName,
        path: currentPath
      })
    }
  }
  
  return breadcrumbList
})

// ===============================
// METHODS
// ===============================

const getBreadcrumbName = (segment: string, index: number, allSegments: string[]): string => {
  // Handle special cases and provide readable names
  switch (segment) {
    case 'principals':
      return 'Principals'
    case 'dashboard':
      if (allSegments[index - 1] === 'principals') {
        return 'Activity Dashboard'
      }
      return 'Dashboard'
    case 'analytics':
      return 'Analytics'
    case 'products':
      return 'Products'
    case 'distributors':
      return 'Distributors'
    case 'organizations':
      return 'Organizations'
    case 'contacts':
      return 'Contacts'
    case 'opportunities':
      return 'Opportunities'
    case 'interactions':
      return 'Interactions'
    case 'new':
      return 'New'
    case 'edit':
      return 'Edit'
    default:
      // Handle UUIDs and other dynamic segments
      if (isUUID(segment)) {
        return getPrincipalName(segment, allSegments) || `${capitalize(allSegments[index - 1] || 'Item')} Details`
      }
      return capitalize(segment)
  }
}

const isUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const getPrincipalName = (principalId: string, pathSegments: string[]): string | null => {
  // Check if this is a principal route
  const principalIndex = pathSegments.indexOf('principals')
  if (principalIndex !== -1 && pathSegments[principalIndex + 1] === principalId) {
    // Try to get principal name from store or use shortened ID
    // For now, return a generic name - this would be enhanced with actual principal data
    return `Principal ${principalId.slice(0, 8)}`
  }
  return null
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Element
  if (!target.closest('[data-testid="navigation-breadcrumbs"]')) {
    showMobileBreadcrumbs.value = false
  }
}

// ===============================
// LIFECYCLE
// ===============================

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Watch route changes to close mobile dropdown
watch(() => route.path, () => {
  showMobileBreadcrumbs.value = false
})
</script>

<style scoped>
/* Ensure breadcrumb container is positioned relative for mobile dropdown */
nav {
  position: relative;
}

/* Smooth animations for mobile dropdown */
.mobile-breadcrumb-dropdown {
  transition: all 0.2s ease-in-out;
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .text-gray-500 {
    @apply text-gray-900;
  }
  
  .text-gray-400 {
    @apply text-gray-800;
  }
  
  .border-gray-200 {
    @apply border-gray-800;
  }
}

/* Print styles */
@media print {
  nav {
    @apply border-b border-gray-300 pb-2 mb-4;
  }
  
  .mobile-breadcrumb-dropdown,
  button {
    @apply hidden;
  }
}
</style>