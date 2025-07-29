<template>
  <nav class="flex" aria-label="Breadcrumb">
    <ol class="flex items-center space-x-2 text-sm text-gray-500">
      <!-- Home -->
      <li>
        <router-link
          to="/"
          class="hover:text-gray-700 focus:outline-none focus:text-gray-700 transition-colors duration-200"
          aria-label="Go to dashboard"
        >
          <HomeIcon class="h-4 w-4" />
          <span class="sr-only">Dashboard</span>
        </router-link>
      </li>
      
      <!-- Organizations Index -->
      <li class="flex items-center">
        <ChevronRightIcon class="h-4 w-4 text-gray-400" aria-hidden="true" />
        <router-link
          to="/organizations"
          class="ml-2 hover:text-gray-700 focus:outline-none focus:text-gray-700 transition-colors duration-200"
        >
          Organizations
        </router-link>
      </li>
      
      <!-- Parent Organization (if exists) -->
      <li v-if="parentOrganization" class="flex items-center">
        <ChevronRightIcon class="h-4 w-4 text-gray-400" aria-hidden="true" />
        <router-link
          :to="`/organizations/${parentOrganization.id}`"
          class="ml-2 hover:text-gray-700 focus:outline-none focus:text-gray-700 transition-colors duration-200"
          :title="`View ${parentOrganization.name}`"
        >
          <span class="truncate max-w-32">{{ parentOrganization.name }}</span>
        </router-link>
      </li>
      
      <!-- Current Organization -->
      <li class="flex items-center">
        <ChevronRightIcon class="h-4 w-4 text-gray-400" aria-hidden="true" />
        <span 
          class="ml-2 text-gray-900 font-medium truncate max-w-48"
          :title="organizationName"
          aria-current="page"
        >
          {{ organizationName }}
        </span>
      </li>
      
      <!-- Sub-route (if exists) -->
      <li v-if="subRoute || currentSubRoute" class="flex items-center">
        <ChevronRightIcon class="h-4 w-4 text-gray-400" aria-hidden="true" />
        <span class="ml-2 text-gray-900 font-medium capitalize" aria-current="page">
          {{ subRoute || currentSubRoute }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { HomeIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import type { OrganizationListItem } from '@/types/organizations'

/**
 * Organization Breadcrumb Component
 * Comprehensive breadcrumb navigation for organization detail pages
 * Supports hierarchical organization structures and sub-routes
 */

interface Props {
  organizationName: string
  parentOrganization?: OrganizationListItem | null
  subRoute?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  parentOrganization: null,
  subRoute: null
})

const route = useRoute()

// Determine sub-route from current route
const currentSubRoute = computed(() => {
  if (props.subRoute) return props.subRoute
  
  const routeName = route.name as string
  if (routeName?.includes('edit')) return 'edit'
  if (routeName?.includes('contacts')) return 'contacts'
  if (routeName?.includes('interactions')) return 'interactions'
  if (routeName?.includes('documents')) return 'documents'
  if (routeName?.includes('analytics')) return 'analytics'
  
  return null
})
</script>

<style scoped>
/* Ensure breadcrumb truncation works properly */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>