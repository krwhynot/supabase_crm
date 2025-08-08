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
            :key="relationship.distributor_id || relationship.principal_id"
            class="relationship-node"
          >
            <!-- Parent Distributor -->
            <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div class="flex items-center space-x-4">
                <!-- Expand/Collapse Button (simplified for now) -->
                <div class="w-6"></div>
                
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
                      <span>Direct Relationship</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="flex items-center space-x-4">
                <!-- Relationship Status -->
                <div class="flex items-center">
                  <div
                    class="w-2 h-2 rounded-full mr-2"
                    :class="getStatusColor(relationship.principal_status)"
                  ></div>
                  <span class="text-sm text-gray-600 capitalize">
                    {{ relationship.principal_status?.toLowerCase().replace('_', ' ') || 'Unknown' }}
                  </span>
                </div>
                
                <!-- Last Activity -->
                <div class="text-sm text-gray-500">
                  {{ formatDate(relationship.principal_last_contact) }}
                </div>
                
                <!-- Actions -->
                <div class="flex items-center space-x-2">
                  <button
                    @click="viewDistributorDetails(relationship.distributor_id!)"
                    :disabled="!relationship.distributor_id"
                    class="text-blue-600 hover:text-blue-900 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    View
                  </button>
                  <button
                    @click="contactDistributor(relationship.distributor_id!, relationship.distributor_name!)" 
                    :disabled="!relationship.distributor_id || !relationship.distributor_name"
                    class="text-green-600 hover:text-green-900 text-sm font-medium transition-colors"
                  >
                    Contact
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Distributor Details (if available) -->
            <div
              v-if="relationship.distributor_name && expandedNodes.has(relationship.distributor_id || relationship.principal_id)"
              class="ml-8 mt-2 space-y-2"
            >
              <div class="flex items-center justify-between p-3 border border-gray-100 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
                <div class="flex items-center space-x-3">
                  <!-- Connection Line -->
                  <div class="flex items-center">
                    <div class="w-4 h-px bg-gray-300"></div>
                    <div class="w-2 h-2 rounded-full bg-gray-300"></div>
                  </div>
                  
                  <!-- Distributor Info -->
                  <div class="flex items-center space-x-3">
                    <div class="flex-shrink-0">
                      <BuildingStorefrontIcon class="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <h5 class="text-sm font-medium text-gray-800">
                        {{ relationship.distributor_name }}
                      </h5>
                      <div class="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{{ relationship.relationship_type }}</span>
                        <span>•</span>
                        <span>{{ relationship.distributor_city }}, {{ relationship.distributor_state }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="flex items-center space-x-4">
                  <!-- Status -->
                  <div class="flex items-center">
                    <div
                      class="w-1.5 h-1.5 rounded-full mr-2"
                      :class="getStatusColor(relationship.distributor_status)"
                    ></div>
                    <span class="text-xs text-gray-600 capitalize">
                      {{ relationship.distributor_status?.toLowerCase().replace('_', ' ') || 'Unknown' }}
                    </span>
                  </div>
                  
                  <!-- Last Activity -->
                  <div class="text-xs text-gray-500">
                    {{ formatDate(relationship.distributor_last_contact) }}
                  </div>
                  
                  <!-- Actions -->
                  <div class="flex items-center space-x-2">
                    <button
                      @click="viewDistributorDetails(relationship.distributor_id!)"
                      :disabled="!relationship.distributor_id"
                      class="text-blue-600 hover:text-blue-900 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      View
                    </button>
                    <button
                      @click="contactDistributor(relationship.distributor_id!, relationship.distributor_name!)"
                      :disabled="!relationship.distributor_id || !relationship.distributor_name"
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
  // Return relationships as a flat list since we don't have hierarchy data
  if (!props.relationships || props.relationships.length === 0) return []
  
  return props.relationships
})

const allExpanded = computed(() => {
  return relationshipTree.value.every(rel => 
    !rel.distributor_name || expandedNodes.value.has(rel.distributor_id || rel.principal_id)
  )
})

const totalDistributors = computed(() => {
  return props.relationships?.length || 0
})

const activeRelationships = computed(() => {
  return props.relationships?.filter(rel => 
    rel.principal_status === 'Active'
  ).length || 0
})

const pendingRelationships = computed(() => {
  return props.relationships?.filter(rel => 
    rel.principal_status === 'Prospect'
  ).length || 0
})

const maxHierarchyLevel = computed(() => {
  if (!props.relationships || props.relationships.length === 0) return 0
  return props.relationships.filter(rel => rel.distributor_name).length > 0 ? 2 : 1
})

// ===============================
// EVENT HANDLERS
// ===============================

// Removed unused function - expandable functionality simplified

const toggleAllExpanded = () => {
  if (allExpanded.value) {
    expandedNodes.value.clear()
  } else {
    relationshipTree.value.forEach(rel => {
      if (rel.distributor_name) {
        expandedNodes.value.add(rel.distributor_id || rel.principal_id)
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
    'Active': 'bg-green-400',
    'Prospect': 'bg-yellow-400',
    'Inactive': 'bg-gray-400',
    'Customer': 'bg-blue-400',
    'Partner': 'bg-purple-400',
    'Vendor': 'bg-orange-400'
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