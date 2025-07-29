<template>
  <div class="bg-white shadow-sm rounded-lg border border-gray-200">
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-900">Organizational Structure</h3>
        <button
          v-if="hasStructureData"
          @click="toggleExpanded"
          class="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          :aria-label="isExpanded ? 'Collapse structure' : 'Expand structure'"
        >
          <ChevronDownIcon 
            :class="[
              'h-4 w-4 mr-1 transition-transform duration-200',
              isExpanded ? 'rotate-180' : ''
            ]" 
          />
          {{ isExpanded ? 'Collapse' : 'Expand' }}
        </button>
      </div>
    </div>
    
    <div class="px-6 py-6">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
        <span class="text-gray-600">Loading organizational structure...</span>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="text-center py-8">
        <ExclamationTriangleIcon class="h-8 w-8 text-red-500 mx-auto mb-3" />
        <p class="text-red-600 mb-4">{{ error }}</p>
        <button
          @click="$emit('retry')"
          class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-600 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <ArrowPathIcon class="h-4 w-4 mr-2" />
          Retry
        </button>
      </div>
      
      <!-- No Structure Data -->
      <div v-else-if="!hasStructureData" class="text-center py-8">
        <BuildingOfficeIcon class="h-8 w-8 text-gray-400 mx-auto mb-3" />
        <p class="text-gray-500 mb-2">No organizational structure defined</p>
        <p class="text-sm text-gray-400">
          This organization doesn't have parent or child organizations
        </p>
      </div>
      
      <!-- Structure Display -->
      <div v-else class="space-y-4">
        <!-- Parent Organization -->
        <div v-if="parentOrganization" class="relative">
          <div class="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <ArrowUpIcon class="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-blue-900">Parent Organization</p>
                  <router-link
                    :to="`/organizations/${parentOrganization.id}`"
                    class="text-blue-700 hover:text-blue-800 font-medium hover:underline focus:outline-none focus:underline transition-colors duration-200"
                  >
                    {{ parentOrganization.name }}
                  </router-link>
                </div>
                <div class="text-xs text-blue-600">
                  {{ parentOrganization.industry || 'Industry not specified' }}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Connection line to current -->
          <div 
            class="absolute left-4 top-full w-0.5 h-4 bg-gray-300"
            aria-hidden="true"
          ></div>
        </div>
        
        <!-- Current Organization -->
        <div class="relative">
          <div class="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <BuildingOfficeIcon class="h-4 w-4 text-green-600" />
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-green-900">Current Organization</p>
                  <p class="text-green-700 font-medium">{{ currentOrganization.name }}</p>
                </div>
                <div class="text-xs text-green-600">
                  {{ currentOrganization.industry || 'Industry not specified' }}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Connection line to children -->
          <div 
            v-if="childOrganizations.length > 0"
            class="absolute left-4 top-full w-0.5 h-4 bg-gray-300"
            aria-hidden="true"
          ></div>
        </div>
        
        <!-- Child Organizations -->
        <div v-if="childOrganizations.length > 0" :class="{ 'hidden': !isExpanded }">
          <div class="space-y-2 ml-6">
            <div
              v-for="(child, index) in childOrganizations"
              :key="child.id"
              class="relative"
            >
              <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ArrowDownIcon class="h-4 w-4 text-gray-600" />
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm font-medium text-gray-900">Child Organization</p>
                      <router-link
                        :to="`/organizations/${child.id}`"
                        class="text-gray-700 hover:text-gray-800 font-medium hover:underline focus:outline-none focus:underline transition-colors duration-200"
                      >
                        {{ child.name }}
                      </router-link>
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ child.industry || 'Industry not specified' }}
                    </div>
                  </div>
                  
                  <!-- Child organization stats -->
                  <div class="mt-2 flex items-center space-x-4">
                    <span v-if="child.employees_count" class="text-xs text-gray-500">
                      {{ child.employees_count.toLocaleString() }} employees
                    </span>
                    <span v-if="child.status" :class="getStatusClass(child.status)">
                      {{ child.status }}
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- Connection line between children -->
              <div 
                v-if="index < childOrganizations.length - 1"
                class="absolute left-4 top-full w-0.5 h-2 bg-gray-300"
                aria-hidden="true"
              ></div>
            </div>
          </div>
        </div>
        
        <!-- Summary Stats -->
        <div v-if="hasStructureData" class="mt-6 pt-4 border-t border-gray-200">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="text-center">
              <div class="text-lg font-semibold text-gray-900">
                {{ totalEmployees.toLocaleString() }}
              </div>
              <div class="text-sm text-gray-500">Total Employees</div>
            </div>
            
            <div class="text-center">
              <div class="text-lg font-semibold text-gray-900">
                {{ organizationCount }}
              </div>
              <div class="text-sm text-gray-500">Organizations</div>
            </div>
            
            <div class="text-center">
              <div class="text-lg font-semibold text-gray-900">
                {{ hierarchyDepth }}
              </div>
              <div class="text-sm text-gray-500">Hierarchy Levels</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  ChevronDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'
import type { OrganizationListItem, OrganizationStatus } from '@/types/organizations'

/**
 * Organization Structure Component
 * Displays hierarchical organization relationships with parent and child organizations
 */

interface Props {
  currentOrganization: OrganizationListItem
  parentOrganization?: OrganizationListItem | null
  childOrganizations?: OrganizationListItem[]
  loading?: boolean
  error?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  parentOrganization: null,
  childOrganizations: () => [],
  loading: false,
  error: null
})

// Emit events
defineEmits<{
  retry: []
}>()

// State
const isExpanded = ref(true)

// Computed properties
const hasStructureData = computed(() => {
  return !!(props.parentOrganization || props.childOrganizations.length > 0)
})

const totalEmployees = computed(() => {
  let total = props.currentOrganization.employees_count || 0
  
  if (props.parentOrganization?.employees_count) {
    total += props.parentOrganization.employees_count
  }
  
  props.childOrganizations.forEach(child => {
    if (child.employees_count) {
      total += child.employees_count
    }
  })
  
  return total
})

const organizationCount = computed(() => {
  let count = 1 // Current organization
  if (props.parentOrganization) count += 1
  count += props.childOrganizations.length
  return count
})

const hierarchyDepth = computed(() => {
  let depth = 1 // Current level
  if (props.parentOrganization) depth += 1
  if (props.childOrganizations.length > 0) depth += 1
  return depth
})

// Methods
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const getStatusClass = (status: OrganizationStatus | null): string => {
  if (!status) return 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800'
  
  const baseClasses = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium'
  const statusClasses = {
    Active: 'bg-green-100 text-green-800',
    Inactive: 'bg-gray-100 text-gray-800',
    Prospect: 'bg-blue-100 text-blue-800',
    Customer: 'bg-purple-100 text-purple-800',
    Partner: 'bg-yellow-100 text-yellow-800',
    Vendor: 'bg-indigo-100 text-indigo-800'
  }
  
  return `${baseClasses} ${statusClasses[status] || statusClasses.Inactive}`
}
</script>

<style scoped>
/* Custom connection lines styling */
.connection-line {
  background: linear-gradient(to bottom, transparent 50%, #d1d5db 50%);
}
</style>