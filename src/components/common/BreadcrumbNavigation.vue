<template>
  <nav class="flex mb-4" aria-label="Breadcrumb">
    <ol role="list" class="flex items-center space-x-4">
      <!-- Home Link -->
      <li>
        <div>
          <router-link to="/" class="text-gray-400 hover:text-gray-500 transition-colors duration-200">
            <svg class="flex-shrink-0 h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-9 9a1 1 0 001.414 1.414L8 5.414V17a1 1 0 102 0V5.414l6.293 6.293a1 1 0 001.414-1.414l-9-9z" />
            </svg>
            <span class="sr-only">Home</span>
          </router-link>
        </div>
      </li>

      <!-- Dynamic breadcrumb items -->
      <li v-for="(crumb, index) in breadcrumbs" :key="index">
        <div class="flex items-center">
          <svg class="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
          </svg>
          
          <!-- Clickable breadcrumb -->
          <router-link 
            v-if="crumb.to && index < breadcrumbs.length - 1"
            :to="crumb.to" 
            class="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            {{ crumb.label }}
          </router-link>
          
          <!-- Current page breadcrumb (not clickable) -->
          <span 
            v-else
            class="ml-4 text-sm font-medium text-gray-500"
            :aria-current="index === breadcrumbs.length - 1 ? 'page' : undefined"
          >
            {{ crumb.label }}
          </span>
        </div>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

interface BreadcrumbItem {
  label: string
  to?: string
}

interface Props {
  items?: BreadcrumbItem[]
}

const props = withDefaults(defineProps<Props>(), {
  items: () => []
})

const route = useRoute()

// Auto-generate breadcrumbs based on route if not provided
const breadcrumbs = computed(() => {
  if (props.items.length > 0) {
    return props.items
  }

  // Auto-generate from route path
  const pathSegments = route.path.split('/').filter(Boolean)
  const crumbs: BreadcrumbItem[] = []

  // Map route segments to readable labels
  const segmentLabels: Record<string, string> = {
    interactions: 'Interactions',
    opportunities: 'Opportunities',
    contacts: 'Contacts',
    organizations: 'Organizations',
    new: 'New',
    edit: 'Edit'
  }

  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i]
    const isLast = i === pathSegments.length - 1
    
    // Skip IDs in breadcrumbs
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
      continue
    }

    const label = segmentLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
    const path = '/' + pathSegments.slice(0, i + 1).join('/')

    crumbs.push({
      label,
      to: isLast ? undefined : path
    })
  }

  return crumbs
})
</script>