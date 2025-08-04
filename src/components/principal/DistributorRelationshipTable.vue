<!--
  Distributor Relationship Table - Display distributor hierarchy and relationships
  Features: Hierarchical display, relationship status, expandable rows
-->
<template>
  <div class="distributor-relationship-table">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h3 class="text-lg font-medium text-gray-900">Distributor Relationships</h3>
        <p class="mt-1 text-sm text-gray-600">
          Distributor hierarchy and relationships for {{ principalName }}
        </p>
      </div>
      
      <div class="flex items-center space-x-3 mt-4 sm:mt-0">
        <!-- Expand/Collapse All -->
        <button
          @click="toggleAllExpanded"
          class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <component
            :is="allExpanded ? ChevronUpIcon : ChevronDownIcon"
            class="h-4 w-4 mr-1"
          />
          {{ allExpanded ? 'Collapse All' : 'Expand All' }}
        </button>
        
        <!-- Export Button -->
        <button
          @click="exportData"
          class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowDownTrayIcon class="h-4 w-4 mr-1" />
          Export
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="bg-white shadow rounded-lg overflow-hidden">
      <div class="animate-pulse p-6">
        <div class="space-y-4">
          <div v-for="i in 3" :key="i">
            <div class="flex items-center space-x-4 mb-2">
              <div class="h-4 bg-gray-200 rounded w-4"></div>
              <div class="h-4 bg-gray-200 rounded w-1/3"></div>
              <div class="flex-1"></div>
              <div class="h-4 bg-gray-200 rounded w-1/6"></div>
            </div>
            <div class="ml-8 space-y-2">
              <div v-for="j in 2" :key="j" class="flex items-center space-x-4">
                <div class="h-3 bg-gray-100 rounded w-1/4"></div>
                <div class="h-3 bg-gray-100 rounded w-1/6"></div>
                <div class="flex-1"></div>
                <div class="h-3 bg-gray-100 rounded w-16"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Relationships Tree -->
    <div v-else class="bg-white shadow rounded-lg overflow-hidden">
      <div class="p-6">
        <div v-if="relationshipTree.length === 0" class="text-center py-12">
          <BuildingOfficeIcon class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900">No relationships found</h3>
          <p class="mt-1 text-sm text-gray-500">
            This principal has no distributor relationships configured.
          </p>
        </div>
        
        <div v-else class="space-y-4">
          <div
            v-for="relationship in relationshipTree"
            :key="relationship.distributor_id"
            class="relationship-node"
          >
            <!-- Parent Distributor -->
            <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div class="flex items-center space-x-4">
                <!-- Expand/Collapse Button -->
                <button
                  v-if="relationship.subdistributors && relationship.subdistributors.length > 0"
                  @click="toggleExpanded(relationship.distributor_id)"
                  class="flex-shrink-0 p-1 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <component
                    :is="expandedNodes.has(relationship.distributor_id) ? ChevronDownIcon : ChevronRightIcon"
                    class="h-4 w-4 text-gray-500"
                  />
                </button>
                <div v-else class="w-6"></div>
                
                <!-- Distributor Info -->
                <div class="flex items-center space-x-3">
                  <div class="flex-shrink-0">
                    <BuildingOfficeIcon class="h-8 w-8 text-blue-500" />
                  </div>
                  <div>
                    <h4 class="text-sm font-medium text-gray-900">
                      {{ relationship.distributor_name }}
                    </h4>
                    <div class="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{{ relationship.relationship_type }}</span>
                      <span>•</span>
                      <span>Level {{ relationship.hierarchy_level }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="flex items-center space-x-4">
                <!-- Relationship Status -->
                <div class="flex items-center">
                  <div
                    class="w-2 h-2 rounded-full mr-2"
                    :class="getStatusColor(relationship.relationship_status)"
                  ></div>
                  <span class="text-sm text-gray-600 capitalize">
                    {{ relationship.relationship_status?.toLowerCase().replace('_', ' ') }}
                  </span>
                </div>
                
                <!-- Last Activity -->
                <div class="text-sm text-gray-500">
                  {{ formatDate(relationship.last_activity_date) }}
                </div>
                
                <!-- Actions -->
                <div class="flex items-center space-x-2">
                  <button
                    @click="viewDistributorDetails(relationship.distributor_id)"
                    class="text-blue-600 hover:text-blue-900 text-sm font-medium transition-colors"
                  >
                    View
                  </button>
                  <button
                    @click="contactDistributor(relationship.distributor_id, relationship.distributor_name)"
                    class="text-green-600 hover:text-green-900 text-sm font-medium transition-colors"
                  >
                    Contact
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Subdistributors (Expandable) -->
            <div
              v-if="relationship.subdistributors && relationship.subdistributors.length > 0 && expandedNodes.has(relationship.distributor_id)"
              class="ml-8 mt-2 space-y-2"
            >
              <div
                v-for="subdistributor in relationship.subdistributors"
                :key="subdistributor.distributor_id"
                class="flex items-center justify-between p-3 border border-gray-100 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div class="flex items-center space-x-3">
                  <!-- Connection Line -->
                  <div class="flex items-center">
                    <div class="w-4 h-px bg-gray-300"></div>
                    <div class="w-2 h-2 rounded-full bg-gray-300"></div>
                  </div>
                  
                  <!-- Subdistributor Info -->
                  <div class="flex items-center space-x-3">
                    <div class="flex-shrink-0">
                      <BuildingStorefrontIcon class="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <h5 class="text-sm font-medium text-gray-800">
                        {{ subdistributor.distributor_name }}
                      </h5>
                      <div class="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{{ subdistributor.relationship_type }}</span>
                        <span>•</span>
                        <span>Level {{ subdistributor.hierarchy_level }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="flex items-center space-x-4">
                  <!-- Status -->
                  <div class="flex items-center">
                    <div
                      class="w-1.5 h-1.5 rounded-full mr-2"
                      :class="getStatusColor(subdistributor.relationship_status)"
                    ></div>
                    <span class="text-xs text-gray-600 capitalize">
                      {{ subdistributor.relationship_status?.toLowerCase().replace('_', ' ') }}
                    </span>
                  </div>
                  
                  <!-- Last Activity -->
                  <div class="text-xs text-gray-500">
                    {{ formatDate(subdistributor.last_activity_date) }}
                  </div>
                  
                  <!-- Actions -->
                  <div class="flex items-center space-x-2">
                    <button
                      @click="viewDistributorDetails(subdistributor.distributor_id)"
                      class="text-blue-600 hover:text-blue-900 text-xs font-medium transition-colors"
                    >
                      View
                    </button>
                    <button
                      @click="contactDistributor(subdistributor.distributor_id, subdistributor.distributor_name)"
                      class="text-green-600 hover:text-green-900 text-xs font-medium transition-colors"
                    >
                      Contact
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Relationship Summary -->
    <div v-if="!loading && relationshipTree.length > 0" class="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <BuildingOfficeIcon class="h-6 w-6 text-blue-500" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Total Distributors
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {{ totalDistributors }}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
      
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <CheckCircleIcon class="h-6 w-6 text-green-500" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Active Relationships
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {{ activeRelationships }}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
      
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <ExclamationTriangleIcon class="h-6 w-6 text-yellow-500" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Pending Relationships
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {{ pendingRelationships }}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
      
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <ChartBarIcon class="h-6 w-6 text-purple-500" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Hierarchy Levels
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {{ maxHierarchyLevel }}
                </dd>
              </dl>
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
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  BuildingOfficeIcon,
  BuildingStorefrontIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon
} from '@heroicons/vue/24/outline'
import type { PrincipalDistributorRelationship } from '@/services/principalActivityApi'

// ===============================
// COMPONENT INTERFACE
// ===============================

interface Props {
  relationships: PrincipalDistributorRelationship[]
  loading?: boolean
  principalName?: string
}

interface Emits {
  (e: 'distributor-selected', distributorId: string): void
  (e: 'contact-distributor', distributorId: string, distributorName: string): void
  (e: 'export-data'): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  principalName: 'Principal'
})

const emit = defineEmits<Emits>()

// ===============================
// REACTIVE STATE
// ===============================

const expandedNodes = ref(new Set<string>())

// ===============================
// COMPUTED PROPERTIES
// ===============================

const relationshipTree = computed(() => {
  // Group relationships by hierarchy to create a tree structure
  if (!props.relationships || props.relationships.length === 0) return []
  
  // Create a map to group distributors by parent relationship
  const parentMap = new Map<string, PrincipalDistributorRelationship[]>()
  const rootDistributors: PrincipalDistributorRelationship[] = []
  
  // First pass: identify root distributors (level 1) and group others by parent
  props.relationships.forEach(relationship => {
    if (relationship.hierarchy_level === 1) {
      rootDistributors.push({
        ...relationship,
        subdistributors: []
      })
    } else {
      // For now, we'll simulate parent-child relationships
      // In a real implementation, this would use actual parent_distributor_id
      const parentId = 'parent-' + Math.floor((relationship.hierarchy_level - 1) / 2)
      
      if (!parentMap.has(parentId)) {
        parentMap.set(parentId, [])
      }
      parentMap.get(parentId)!.push(relationship)
    }
  })
  
  // Second pass: attach subdistributors to their parents
  rootDistributors.forEach((root, index) => {
    const parentKey = 'parent-' + index
    if (parentMap.has(parentKey)) {
      root.subdistributors = parentMap.get(parentKey)
    }
  })
  
  return rootDistributors
})

const allExpanded = computed(() => {
  return relationshipTree.value.every(rel => 
    !rel.subdistributors?.length || expandedNodes.value.has(rel.distributor_id)
  )
})

const totalDistributors = computed(() => {
  return props.relationships?.length || 0
})

const activeRelationships = computed(() => {
  return props.relationships?.filter(rel => 
    rel.relationship_status === 'ACTIVE'
  ).length || 0
})

const pendingRelationships = computed(() => {
  return props.relationships?.filter(rel => 
    rel.relationship_status === 'PENDING'
  ).length || 0
})

const maxHierarchyLevel = computed(() => {
  if (!props.relationships || props.relationships.length === 0) return 0
  return Math.max(...props.relationships.map(rel => rel.hierarchy_level || 1))
})

// ===============================
// EVENT HANDLERS
// ===============================

const toggleExpanded = (distributorId: string) => {
  if (expandedNodes.value.has(distributorId)) {
    expandedNodes.value.delete(distributorId)
  } else {
    expandedNodes.value.add(distributorId)
  }
}

const toggleAllExpanded = () => {
  if (allExpanded.value) {
    expandedNodes.value.clear()
  } else {
    relationshipTree.value.forEach(rel => {
      if (rel.subdistributors?.length) {
        expandedNodes.value.add(rel.distributor_id)
      }
    })
  }
}

const viewDistributorDetails = (distributorId: string) => {
  emit('distributor-selected', distributorId)
}

const contactDistributor = (distributorId: string, distributorName: string) => {
  emit('contact-distributor', distributorId, distributorName)
}

const exportData = () => {
  emit('export-data')
}

// ===============================
// UTILITY FUNCTIONS
// ===============================

const getStatusColor = (status: string | null): string => {
  const statusColors: Record<string, string> = {
    'ACTIVE': 'bg-green-400',
    'PENDING': 'bg-yellow-400',
    'INACTIVE': 'bg-gray-400',
    'TERMINATED': 'bg-red-400'
  }
  return statusColors[status || ''] || 'bg-gray-400'
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Never'
  
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 1) return 'Today'
  if (diffDays <= 7) return `${diffDays} days ago`
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`
  if (diffDays <= 365) return `${Math.ceil(diffDays / 30)} months ago`
  
  return date.toLocaleDateString()
}
</script>

<style scoped>
.distributor-relationship-table {
  /* Custom styles for relationship table */
}

/* Tree structure styling */
.relationship-node {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Connection lines for tree structure */
.relationship-node .connection-line {
  position: relative;
}

.relationship-node .connection-line::before {
  content: '';
  position: absolute;
  left: -12px;
  top: 50%;
  width: 12px;
  height: 1px;
  background-color: #d1d5db;
}

/* Hover effects */
.relationship-node > div:hover {
  background-color: rgba(249, 250, 251, 0.8);
}

/* Subdistributor styling */
.subdistributor-item {
  position: relative;
}

.subdistributor-item::before {
  content: '';
  position: absolute;
  left: -24px;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: #e5e7eb;
}

/* Status indicator pulse animation */
.status-indicator {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .distributor-relationship-table .relationship-details {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .distributor-relationship-table .relationship-actions {
    margin-top: 8px;
  }
}

/* Print styles */
@media print {
  .distributor-relationship-table .expand-collapse-buttons,
  .distributor-relationship-table .export-button,
  .distributor-relationship-table .relationship-actions {
    display: none;
  }
}
</style>