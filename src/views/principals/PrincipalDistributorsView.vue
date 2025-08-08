<!--
  Principal Distributors View - Relationship visualization and distributor management
  Features: Relationship hierarchy, network visualization, contact management, iPad optimized
-->
<template>
  <DashboardLayout>
    <div class="principal-distributors-view">
      <!-- Page Header -->
      <div class="mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div class="mb-4 sm:mb-0">
            <h1 class="text-2xl font-bold text-gray-900">Distributor Network</h1>
            <p class="mt-1 text-sm text-gray-500">
              Manage relationships and visualize distributor connections
            </p>
          </div>
          <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <!-- Add Relationship Button -->
            <button
              @click="openAddRelationshipModal"
              :disabled="!selectedPrincipal"
              class="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              <UserPlusIcon class="h-4 w-4 mr-2" />
              Add Relationship
            </button>
            <!-- View Toggle -->
            <div class="flex rounded-md shadow-sm">
              <button
                @click="viewMode = 'network'"
                :class="[
                  'px-4 py-2 text-sm font-medium rounded-l-md border min-h-[44px]',
                  viewMode === 'network'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                ]"
              >
                <ShareIcon class="h-4 w-4" />
              </button>
              <button
                @click="viewMode = 'hierarchy'"
                :class="[
                  'px-4 py-2 text-sm font-medium border-t border-b min-h-[44px]',
                  viewMode === 'hierarchy'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                ]"
              >
                <BuildingOfficeIcon class="h-4 w-4" />
              </button>
              <button
                @click="viewMode = 'table'"
                :class="[
                  'px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b min-h-[44px]',
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                ]"
              >
                <Bars3Icon class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Principal Selector -->
      <div class="mb-6">
        <PrincipalSelector
          v-model="selectedPrincipal"
          :loading="principalsLoading"
          :error="principalsError"
          placeholder="Select a principal to view their distributor network..."
          class="w-full"
        />
      </div>

      <!-- Loading State -->
      <div v-if="loading && selectedPrincipal" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-4 text-sm text-gray-500">Loading distributor network...</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!selectedPrincipal" class="text-center py-12">
        <ShareIcon class="mx-auto h-16 w-16 text-gray-400" />
        <h3 class="mt-4 text-lg font-medium text-gray-900">Distributor Network</h3>
        <p class="mt-2 text-sm text-gray-500">
          Select a principal above to view and manage their distributor relationships and network connections.
        </p>
      </div>

      <!-- Distributors Dashboard -->
      <div v-else-if="selectedPrincipal" class="space-y-6">
        <!-- Network Summary KPIs -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <BuildingOfficeIcon class="h-6 w-6 text-blue-500" />
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-500">Distributors</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ distributorsData?.length || 0 }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <UserGroupIcon class="h-6 w-6 text-green-500" />
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-500">Active Contacts</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ activeContacts }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <GlobeAltIcon class="h-6 w-6 text-purple-500" />
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-500">Territories</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ uniqueTerritories }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <CalendarDaysIcon class="h-6 w-6 text-yellow-500" />
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-500">Last Contact</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ daysSinceLastContact }}d
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Search and Filters -->
        <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <!-- Search -->
          <div class="flex-1">
            <div class="relative">
              <MagnifyingGlassIcon class="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search distributors..."
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
              />
            </div>
          </div>
          
          <!-- Territory Filter -->
          <select
            v-model="territoryFilter"
            class="block w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
          >
            <option value="">All Territories</option>
            <option v-for="territory in territories" :key="territory" :value="territory">
              {{ territory }}
            </option>
          </select>
          
          <!-- Relationship Type Filter -->
          <select
            v-model="relationshipFilter"
            class="block w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
          >
            <option value="">All Relationships</option>
            <option value="direct">Direct</option>
            <option value="indirect">Indirect</option>
            <option value="strategic">Strategic</option>
            <option value="partner">Partner</option>
          </select>
        </div>

        <!-- Network Visualization -->
        <div v-if="viewMode === 'network'" class="bg-white rounded-lg border border-gray-200 p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Network Visualization</h3>
          
          <!-- SVG Network Diagram -->
          <div class="relative h-96 bg-gray-50 rounded-lg overflow-hidden">
            <svg
              ref="networkSvg"
              :width="networkWidth"
              :height="networkHeight"
              class="w-full h-full"
            >
              <!-- Network connections -->
              <g class="connections">
                <line
                  v-for="connection in networkConnections"
                  :key="`${connection.from}-${connection.to}`"
                  :x1="connection.x1"
                  :y1="connection.y1"
                  :x2="connection.x2"
                  :y2="connection.y2"
                  stroke="#e5e7eb"
                  stroke-width="2"
                  :class="getConnectionClass(connection.type)"
                />
              </g>
              
              <!-- Network nodes -->
              <g class="nodes">
                <g
                  v-for="node in networkNodes"
                  :key="node.id"
                  :transform="`translate(${node.x}, ${node.y})`"
                  class="network-node cursor-pointer"
                  @click="selectNode(node)"
                >
                  <!-- Node circle -->
                  <circle
                    :r="node.size"
                    :fill="getNodeColor(node.type)"
                    :stroke="node.selected ? '#3b82f6' : '#ffffff'"
                    stroke-width="2"
                    class="hover:opacity-80 transition-opacity duration-200"
                  />
                  
                  <!-- Node icon -->
                  <text
                    text-anchor="middle"
                    dominant-baseline="middle"
                    class="text-xs fill-white font-medium pointer-events-none"
                  >
                    {{ getNodeIcon(node.type) }}
                  </text>
                  
                  <!-- Node label -->
                  <text
                    :y="node.size + 15"
                    text-anchor="middle"
                    class="text-xs fill-gray-700 font-medium pointer-events-none"
                  >
                    {{ truncateText(node.name, 12) }}
                  </text>
                </g>
              </g>
            </svg>

            <!-- Network Legend -->
            <div class="absolute top-4 right-4 bg-white rounded-lg p-3 shadow-sm border border-gray-200">
              <h4 class="text-xs font-medium text-gray-700 mb-2">Network Legend</h4>
              <div class="space-y-1">
                <div class="flex items-center text-xs">
                  <div class="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  <span class="text-gray-600">Principal</span>
                </div>
                <div class="flex items-center text-xs">
                  <div class="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span class="text-gray-600">Distributor</span>
                </div>
                <div class="flex items-center text-xs">
                  <div class="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                  <span class="text-gray-600">Partner</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Selected Node Details -->
          <div v-if="selectedNode" class="mt-4 p-4 bg-blue-50 rounded-lg">
            <div class="flex items-start justify-between">
              <div>
                <h4 class="text-sm font-medium text-blue-900">{{ selectedNode.name }}</h4>
                <p class="text-sm text-blue-700 mt-1">{{ formatNodeType(selectedNode.type) }}</p>
                <p class="text-xs text-blue-600 mt-2">
                  Territory: {{ selectedNode.territory }} • Last Contact: {{ formatDate(selectedNode.lastContact) }}
                </p>
              </div>
              <button
                @click="selectedNode = null"
                class="text-blue-400 hover:text-blue-600"
              >
                <XMarkIcon class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Hierarchy View -->
        <div v-else-if="viewMode === 'hierarchy'" class="bg-white rounded-lg border border-gray-200 p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Relationship Hierarchy</h3>
          
          <div class="space-y-4">
            <!-- Principal Node -->
            <div class="flex items-center p-4 bg-blue-50 rounded-lg">
              <div class="flex-shrink-0">
                <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <UserIcon class="h-5 w-5 text-white" />
                </div>
              </div>
              <div class="ml-4">
                <h4 class="text-sm font-medium text-gray-900">{{ selectedPrincipal.name }}</h4>
                <p class="text-sm text-gray-500">Principal</p>
              </div>
            </div>

            <!-- Distributor Hierarchy -->
            <div class="ml-6 space-y-3">
              <div
                v-for="(distributor, distributorIndex) in filteredDistributors"
                :key="distributor.distributor_id || `dist_${distributorIndex}`"
                class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <BuildingOfficeIcon class="h-4 w-4 text-white" />
                  </div>
                </div>
                <div class="ml-3 flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <div>
                      <h5 class="text-sm font-medium text-gray-900 truncate">
                        {{ distributor.distributor_name }}
                      </h5>
                      <p class="text-sm text-gray-500">
                        {{ formatRelationshipType(distributor.relationship_type) }} • {{ distributor.distributor_city }}, {{ distributor.distributor_state }}
                      </p>
                    </div>
                    <div class="flex items-center space-x-2 ml-4">
                      <span
                        :class="[
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          getRelationshipStatusClass(distributor.relationship_type)
                        ]"
                      >
                        {{ formatRelationshipType(distributor.relationship_type) }}
                      </span>
                      <button
                        @click="viewDistributorDetails(distributor)"
                        class="text-blue-600 hover:text-blue-800"
                      >
                        <EyeIcon class="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Table View -->
        <div v-else class="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <DistributorRelationshipTable
            :relationships="filteredDistributors"
            :loading="loading"
            :principal-name="selectedPrincipal?.name"
            @view-details="viewDistributorDetails"
            @edit-relationship="editRelationship"
            @remove-relationship="removeRelationship"
          />
        </div>

        <!-- Relationship Insights -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Relationship Statistics -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Relationship Statistics</h3>
            
            <div class="space-y-4">
              <!-- Relationship Types Breakdown -->
              <div>
                <h4 class="text-sm font-medium text-gray-700 mb-3">By Relationship Type</h4>
                <div class="space-y-2">
                  <div
                    v-for="stat in relationshipStats"
                    :key="stat.type"
                    class="flex items-center justify-between"
                  >
                    <div class="flex items-center">
                      <div
                        class="w-3 h-3 rounded-full mr-3"
                        :style="{ backgroundColor: getRelationshipTypeColor(stat.type) }"
                      ></div>
                      <span class="text-sm text-gray-700">{{ formatRelationshipType(stat.type) }}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                      <span class="text-sm font-medium text-gray-900">{{ stat.count }}</span>
                      <span class="text-xs text-gray-500">({{ Math.round((stat.count / totalDistributors) * 100) }}%)</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Territory Distribution -->
              <div>
                <h4 class="text-sm font-medium text-gray-700 mb-3">By Territory</h4>
                <div class="space-y-2">
                  <div
                    v-for="territory in territoryStats"
                    :key="territory.name"
                    class="flex items-center justify-between"
                  >
                    <span class="text-sm text-gray-700">{{ territory.name }}</span>
                    <div class="flex items-center space-x-2">
                      <span class="text-sm font-medium text-gray-900">{{ territory.count }}</span>
                      <div class="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          class="bg-blue-500 h-2 rounded-full"
                          :style="{ width: `${(territory.count / totalDistributors) * 100}%` }"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            
            <div class="space-y-4">
              <div
                v-for="activity in recentActivity"
                :key="activity.id"
                class="flex items-start space-x-3"
              >
                <div class="flex-shrink-0">
                  <div
                    :class="[
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      getActivityTypeClass(activity.type)
                    ]"
                  >
                    <component :is="getActivityIcon(activity.type)" class="h-4 w-4" />
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-900">
                    {{ activity.description }}
                  </p>
                  <p class="text-xs text-gray-500 mt-1">
                    {{ formatDate(activity.date) }} • {{ activity.distributor }}
                  </p>
                </div>
              </div>

              <div v-if="recentActivity.length === 0" class="text-center py-4">
                <p class="text-sm text-gray-500">No recent activity</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex">
          <ExclamationTriangleIcon class="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
          <div>
            <h3 class="text-sm font-medium text-red-800">Error Loading Distributor Network</h3>
            <p class="text-sm text-red-700 mt-1">{{ error }}</p>
            <button
              @click="loadDistributorsData"
              class="mt-2 text-sm font-medium text-red-800 hover:text-red-900"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
// const router = useRouter() // Available for future navigation needs
import {
  ShareIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  GlobeAltIcon,
  CalendarDaysIcon,
  UserPlusIcon,
  Bars3Icon,
  MagnifyingGlassIcon,
  EyeIcon,
  UserIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon
} from '@heroicons/vue/24/outline'

// Components
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import PrincipalSelector from '@/components/principal/PrincipalSelector.vue'
import DistributorRelationshipTable from '@/components/principal/DistributorRelationshipTable.vue'

// Services and Types
import { usePrincipalStore } from '@/stores/principalStore'
import type { PrincipalDistributorRelationship } from '@/services/principalActivityApi'

// Network Connection Interface
interface NetworkConnection {
  from: string
  to: string
  type: string
  x1: number
  y1: number
  x2: number
  y2: number
}

// ===============================
// REACTIVE STATE
// ===============================

// Router is available but not used in current implementation
const route = useRoute()
const principalStore = usePrincipalStore()

const selectedPrincipal = ref<any>(null)
const viewMode = ref<'network' | 'hierarchy' | 'table'>('hierarchy')
const searchQuery = ref('')
const territoryFilter = ref('')
const relationshipFilter = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

const distributorsData = ref<PrincipalDistributorRelationship[]>([])
const selectedNode = ref<any>(null)

// Network visualization data
const networkSvg = ref<SVGElement>()
const networkWidth = ref(800)
const networkHeight = ref(400)

// ===============================
// COMPUTED PROPERTIES
// ===============================

const principalsLoading = computed(() => principalStore.loading)
const principalsError = computed(() => principalStore.error)

const activeContacts = computed(() => {
  return distributorsData.value.filter(d => 
    d.relationship_type === 'HAS_DISTRIBUTOR'
  ).length
})

const uniqueTerritories = computed(() => {
  const territories = new Set(distributorsData.value.map(d => `${d.distributor_city}, ${d.distributor_state}`))
  return territories.size
})

const daysSinceLastContact = computed(() => {
  if (!distributorsData.value.length) return 0
  
  const lastContactDates = distributorsData.value
    .map(d => new Date(d.distributor_last_contact || Date.now()))
    .filter(date => !isNaN(date.getTime()))
  
  if (!lastContactDates.length) return 0
  
  const mostRecent = Math.max(...lastContactDates.map(date => date.getTime()))
  const daysDiff = Math.floor((Date.now() - mostRecent) / (1000 * 60 * 60 * 24))
  
  return daysDiff
})

const territories = computed(() => {
  const territorySet = new Set(distributorsData.value.map(d => `${d.distributor_city}, ${d.distributor_state}`))
  return Array.from(territorySet).sort()
})

const filteredDistributors = computed(() => {
  let filtered = [...distributorsData.value]

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(distributor =>
      distributor.distributor_name?.toLowerCase().includes(query) ||
      `${distributor.distributor_city}, ${distributor.distributor_state}`.toLowerCase().includes(query)
    )
  }

  // Apply territory filter
  if (territoryFilter.value) {
    filtered = filtered.filter(distributor =>
      `${distributor.distributor_city}, ${distributor.distributor_state}` === territoryFilter.value
    )
  }

  // Apply relationship filter
  if (relationshipFilter.value) {
    filtered = filtered.filter(distributor =>
      distributor.relationship_type === relationshipFilter.value
    )
  }

  return filtered
})

const totalDistributors = computed(() => distributorsData.value.length)

const relationshipStats = computed(() => {
  const stats = distributorsData.value.reduce((acc, distributor) => {
    const type = distributor.relationship_type
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(stats).map(([type, count]) => ({ type, count }))
})

const territoryStats = computed(() => {
  const stats = distributorsData.value.reduce((acc, distributor) => {
    const territory = `${distributor.distributor_city}, ${distributor.distributor_state}`
    acc[territory] = (acc[territory] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(stats)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

const networkNodes = computed(() => {
  const nodes = []
  
  // Principal node (center)
  if (selectedPrincipal.value) {
    nodes.push({
      id: `principal_${selectedPrincipal.value.id}`,
      name: selectedPrincipal.value.name,
      type: 'principal',
      x: networkWidth.value / 2,
      y: networkHeight.value / 2,
      size: 25,
      selected: selectedNode.value?.id === `principal_${selectedPrincipal.value.id}`,
      territory: 'All',
      lastContact: new Date().toISOString()
    })
  }

  // Distributor nodes (around principal)
  filteredDistributors.value.forEach((distributor, index) => {
    const angle = (index / filteredDistributors.value.length) * 2 * Math.PI
    const radius = 120
    const x = networkWidth.value / 2 + Math.cos(angle) * radius
    const y = networkHeight.value / 2 + Math.sin(angle) * radius

    nodes.push({
      id: distributor.distributor_id,
      name: distributor.distributor_name || 'Unknown',
      type: distributor.relationship_type,
      x,
      y,
      size: 18,
      selected: selectedNode.value?.id === distributor.distributor_id,
      territory: `${distributor.distributor_city}, ${distributor.distributor_state}`,
      lastContact: distributor.distributor_last_contact
    })
  })

  return nodes
})

const networkConnections = computed(() => {
  const connections: NetworkConnection[] = []
  const principalNode = networkNodes.value.find((node: any) => node.type === 'principal')
  
  if (!principalNode) return connections

  networkNodes.value.forEach(node => {
    if (node.type !== 'principal') {
      connections.push({
        from: principalNode.id,
        to: node.id,
        type: node.type,
        x1: principalNode.x,
        y1: principalNode.y,
        x2: node.x,
        y2: node.y
      })
    }
  })

  return connections
})

const recentActivity = computed(() => {
  // Mock recent activity data
  return [
    {
      id: 1,
      type: 'contact',
      description: 'Phone call with ABC Distribution regarding new product line',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      distributor: 'ABC Distribution'
    },
    {
      id: 2,
      type: 'email',
      description: 'Sent quarterly performance report to XYZ Partners',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      distributor: 'XYZ Partners'
    },
    {
      id: 3,
      type: 'meeting',
      description: 'Scheduled strategy meeting with Regional Sales Inc',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      distributor: 'Regional Sales Inc'
    }
  ]
})

// ===============================
// METHODS
// ===============================

const loadDistributorsData = async () => {
  if (!selectedPrincipal.value) return

  loading.value = true
  error.value = null

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Generate mock distributor relationship data
    const organizations = [
      'ABC Distribution Network', 'XYZ Sales Partners', 'Regional Market Solutions',
      'Global Supply Chain Co', 'Premium Distribution LLC', 'Strategic Partners Inc',
      'Market Leaders Group', 'Nationwide Distributors', 'Elite Sales Network',
      'Professional Partners Corp', 'Industry Leaders Alliance', 'Prime Distribution Hub'
    ]

    const relationshipTypes = ['direct', 'indirect', 'strategic', 'partner']

    distributorsData.value = organizations.map((name, index) => ({
      principal_id: selectedPrincipal.value?.id || `principal_${index + 1}`,
      principal_name: `Principal ${index + 1}`,
      principal_status: 'Active' as any,
      distributor_id: `dist_${index + 1}`,
      distributor_name: name,
      distributor_status: 'Active' as any,
      relationship_type: relationshipTypes[Math.floor(Math.random() * relationshipTypes.length)] as any,
      principal_city: 'Sample City',
      principal_state: 'Sample State', 
      principal_country: 'Sample Country',
      distributor_city: 'Distributor City',
      distributor_state: 'Distributor State',
      distributor_country: 'Distributor Country',
      principal_lead_score: Math.floor(Math.random() * 100),
      distributor_lead_score: Math.floor(Math.random() * 100),
      principal_created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      principal_last_contact: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      distributor_last_contact: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
    }))

  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load distributor data'
    console.error('Error loading distributors data:', err)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return `${Math.floor(diffDays / 30)} months ago`
}

const formatRelationshipType = (type: string): string => {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

// Function removed as it's no longer used after interface updates

const formatNodeType = (type: string): string => {
  const types: Record<string, string> = {
    'principal': 'Principal',
    'direct': 'Direct Distributor',
    'indirect': 'Indirect Distributor',
    'strategic': 'Strategic Partner',
    'partner': 'Business Partner'
  }
  return types[type] || type
}

const getRelationshipStatusClass = (status: string): string => {
  const classes: Record<string, string> = {
    'active': 'bg-green-100 text-green-800',
    'strong': 'bg-blue-100 text-blue-800',
    'developing': 'bg-yellow-100 text-yellow-800',
    'inactive': 'bg-gray-100 text-gray-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const getRelationshipTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    'direct': '#10b981',
    'indirect': '#3b82f6',
    'strategic': '#8b5cf6',
    'partner': '#f59e0b'
  }
  return colors[type] || '#6b7280'
}

const getNodeColor = (type: string): string => {
  const colors: Record<string, string> = {
    'principal': '#3b82f6',
    'direct': '#10b981',
    'indirect': '#06b6d4',
    'strategic': '#8b5cf6',
    'partner': '#f59e0b'
  }
  return colors[type] || '#6b7280'
}

const getNodeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    'principal': '👤',
    'direct': '🏢',
    'indirect': '🔗',
    'strategic': '⭐',
    'partner': '🤝'
  }
  return icons[type] || '🏢'
}

const getConnectionClass = (type: string): string => {
  const classes: Record<string, string> = {
    'direct': 'stroke-green-400',
    'indirect': 'stroke-blue-400',
    'strategic': 'stroke-purple-400',
    'partner': 'stroke-yellow-400'
  }
  return classes[type] || 'stroke-gray-400'
}

const getActivityTypeClass = (type: string): string => {
  const classes: Record<string, string> = {
    'contact': 'bg-blue-100 text-blue-600',
    'email': 'bg-green-100 text-green-600',
    'meeting': 'bg-purple-100 text-purple-600'
  }
  return classes[type] || 'bg-gray-100 text-gray-600'
}

const getActivityIcon = (type: string) => {
  const icons: Record<string, any> = {
    'contact': PhoneIcon,
    'email': EnvelopeIcon,
    'meeting': CalendarIcon
  }
  return icons[type] || CalendarIcon
}

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

const selectNode = (node: any) => {
  selectedNode.value = selectedNode.value?.id === node.id ? null : node
}

const viewDistributorDetails = (distributor: PrincipalDistributorRelationship) => {
  console.log('Viewing distributor details:', distributor)
  // In real implementation, this would navigate to distributor detail page
}

const editRelationship = (distributor: PrincipalDistributorRelationship) => {
  console.log('Editing relationship:', distributor)
  // In real implementation, this would open an edit modal
}

const removeRelationship = (distributor: PrincipalDistributorRelationship) => {
  console.log('Removing relationship:', distributor)
  // In real implementation, this would show confirmation and remove relationship
}

const openAddRelationshipModal = () => {
  console.log('Opening add relationship modal for principal:', selectedPrincipal.value)
  // In real implementation, this would open an add relationship modal
}

// ===============================
// WATCHERS
// ===============================

watch(selectedPrincipal, () => {
  if (selectedPrincipal.value) {
    loadDistributorsData()
  } else {
    distributorsData.value = []
  }
}, { immediate: false })

// ===============================
// LIFECYCLE HOOKS
// ===============================

onMounted(async () => {
  // Load principals if not already loaded
  if (principalStore.principals.length === 0) {
    await principalStore.fetchPrincipals()
  }

  // Auto-select principal from route params
  const principalId = route.params.principalId as string
  if (principalId) {
    const principal = principalStore.principals.find(p => p.id === principalId)
    if (principal) {
      selectedPrincipal.value = principal
    }
  }
})
</script>

<style scoped>
.principal-distributors-view {
  /* Custom styles for distributors view */
}

/* Network visualization styles */
.network-node {
  transition: all 0.2s ease-in-out;
}

.network-node:hover {
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}

/* Connection line styles */
.connections line {
  transition: all 0.2s ease-in-out;
}

.connections line:hover {
  stroke-width: 3;
}

/* Ensure proper grid layout on all screen sizes */
@media (max-width: 768px) {
  .grid {
    gap: 1rem;
  }
  
  /* Stack grid items on mobile */
  .lg\:grid-cols-2 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}

/* Touch targets for mobile */
.principal-distributors-view button,
.principal-distributors-view select,
.principal-distributors-view input {
  min-height: 44px;
}

/* Responsive text scaling */
@media (max-width: 640px) {
  .text-2xl {
    font-size: 1.5rem;
  }
  
  .text-lg {
    font-size: 1rem;
  }
}

/* Grid to single column on small screens */
@media (max-width: 640px) {
  .sm\:grid-cols-2 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
  
  .lg\:grid-cols-4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* Network visualization responsive */
@media (max-width: 768px) {
  .principal-distributors-view svg {
    height: 300px;
  }
}
</style>