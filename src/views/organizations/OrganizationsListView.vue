<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Organizations</h1>
        <p class="mt-1 text-sm text-gray-500">
          Manage your business organizations and client companies
        </p>
      </div>
      
      <div class="mt-4 sm:mt-0 flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
        <!-- Search -->
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search organizations..."
            class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
        </div>
        
        <!-- Add Organization Button -->
        <router-link
          to="/organizations/new"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon class="h-4 w-4 mr-2" />
          Add Organization
        </router-link>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="border-b border-gray-200">
      <nav class="-mb-px flex space-x-8">
        <button
          v-for="filter in filters"
          :key="filter.key"
          @click="activeFilter = filter.key"
          :class="[
            'py-2 px-1 border-b-2 font-medium text-sm',
            activeFilter === filter.key
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          ]"
        >
          {{ filter.label }}
          <span
            v-if="filter.count"
            :class="[
              'ml-2 py-0.5 px-2 rounded-full text-xs',
              activeFilter === filter.key
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600'
            ]"
          >
            {{ filter.count }}
          </span>
        </button>
      </nav>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-flex items-center">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
        <span class="text-gray-600">Loading organizations...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <div class="text-red-600 mb-4">
        <ExclamationTriangleIcon class="h-12 w-12 mx-auto" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading Organizations</h3>
      <p class="text-gray-600 mb-4">{{ error }}</p>
      <button
        @click="loadOrganizations"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <ArrowPathIcon class="h-4 w-4 mr-2" />
        Try Again
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredOrganizations.length === 0 && !searchQuery" class="text-center py-12">
      <BuildingOfficeIcon class="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">No organizations yet</h3>
      <p class="text-gray-600 mb-6">Get started by adding your first organization.</p>
      <router-link
        to="/organizations/new"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <PlusIcon class="h-4 w-4 mr-2" />
        Add Organization
      </router-link>
    </div>

    <!-- Search Empty State -->
    <div v-else-if="filteredOrganizations.length === 0 && searchQuery" class="text-center py-12">
      <MagnifyingGlassIcon class="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">No organizations found</h3>
      <p class="text-gray-600 mb-4">No organizations match "{{ searchQuery }}"</p>
      <button
        @click="searchQuery = ''"
        class="text-blue-600 hover:text-blue-500 font-medium"
      >
        Clear search
      </button>
    </div>

    <!-- Organizations Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="organization in filteredOrganizations"
        :key="organization.id"
        class="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
        @click="navigateToOrganization(organization.id)"
      >
        <div class="p-6">
          <!-- Organization Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BuildingOfficeIcon class="h-6 w-6 text-blue-600" />
              </div>
              <div class="min-w-0 flex-1">
                <h3 class="text-lg font-medium text-gray-900 truncate">
                  {{ organization.name }}
                </h3>
                <p v-if="organization.industry" class="text-sm text-gray-500 truncate">
                  {{ organization.industry }}
                </p>
              </div>
            </div>
            
            <!-- Status Badge -->
            <span
              :class="[
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                getStatusColor(organization.status)
              ]"
            >
              {{ getStatusLabel(organization.status) }}
            </span>
          </div>

          <!-- Organization Details -->
          <div class="space-y-2 mb-4">
            <div v-if="organization.website" class="flex items-center text-sm text-gray-600">
              <GlobeAltIcon class="h-4 w-4 mr-2 flex-shrink-0" />
              <span class="truncate">{{ organization.website }}</span>
            </div>
            
            <div v-if="organization.primary_phone" class="flex items-center text-sm text-gray-600">
              <PhoneIcon class="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{{ organization.primary_phone }}</span>
            </div>
            
            <div v-if="organization.email" class="flex items-center text-sm text-gray-600">
              <EnvelopeIcon class="h-4 w-4 mr-2 flex-shrink-0" />
              <span class="truncate">{{ organization.email }}</span>
            </div>
          </div>

          <!-- Organization Stats -->
          <div class="flex items-center justify-between pt-4 border-t border-gray-200">
            <div class="flex items-center text-sm text-gray-500">
              <UsersIcon class="h-4 w-4 mr-1" />
              <span>{{ organization.employees_count || 0 }} employees</span>
            </div>
            
            <div class="flex items-center space-x-1">
              <button
                @click.stop="editOrganization(organization.id)"
                class="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                :aria-label="`Edit ${organization.name}`"
              >
                <PencilIcon class="h-4 w-4" />
              </button>
              
              <button
                @click.stop="deleteOrganization(organization.id)"
                class="p-1.5 text-red-400 hover:text-red-600 rounded-md hover:bg-red-50"
                :aria-label="`Delete ${organization.name}`"
              >
                <TrashIcon class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination (if needed) -->
    <div v-if="totalPages > 1" class="flex items-center justify-between pt-6">
      <div class="text-sm text-gray-700">
        Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to 
        {{ Math.min(currentPage * itemsPerPage, totalItems) }} of 
        {{ totalItems }} organizations
      </div>
      
      <div class="flex items-center space-x-2">
        <button
          @click="currentPage--"
          :disabled="currentPage === 1"
          class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon class="h-5 w-5" />
        </button>
        
        <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
          {{ currentPage }} of {{ totalPages }}
        </span>
        
        <button
          @click="currentPage++"
          :disabled="currentPage === totalPages"
          class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRightIcon class="h-5 w-5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  PhoneIcon,
  EnvelopeIcon,
  UsersIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/vue/24/outline'
import { useOrganizationStore } from '@/stores/organizationStore'
import type { OrganizationStatus } from '@/types/organizations'

/**
 * Organizations List View
 * Main listing page for all organizations with search, filtering, and pagination
 */

const router = useRouter()
const organizationStore = useOrganizationStore()

// Reactive state
const searchQuery = ref('')
const activeFilter = ref('all')
const loading = ref(false)
const error = ref<string | null>(null)
const currentPage = ref(1)
const itemsPerPage = ref(12)

// Filter options
const filters = ref([
  { key: 'all', label: 'All Organizations', count: 0 },
  { key: 'active', label: 'Active', count: 0 },
  { key: 'inactive', label: 'Inactive', count: 0 },
  { key: 'prospect', label: 'Prospects', count: 0 }
])

// Computed properties
const organizations = computed(() => organizationStore.organizations)

const filteredOrganizations = computed(() => {
  let filtered = organizations.value

  // Apply status filter
  if (activeFilter.value !== 'all') {
    filtered = filtered.filter(org => org.status?.toLowerCase() === activeFilter.value)
  }

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(org =>
      org.name.toLowerCase().includes(query) ||
      org.industry?.toLowerCase().includes(query) ||
      org.website?.toLowerCase().includes(query) ||
      org.email?.toLowerCase().includes(query)
    )
  }

  return filtered
})

const totalItems = computed(() => filteredOrganizations.value.length)
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

// Methods
const loadOrganizations = async () => {
  loading.value = true
  error.value = null
  
  try {
    await organizationStore.fetchOrganizations()
    updateFilterCounts()
  } catch (err) {
    console.error('Error loading organizations:', err)
    error.value = 'Failed to load organizations. Please try again.'
  } finally {
    loading.value = false
  }
}

const updateFilterCounts = () => {
  const counts = organizations.value.reduce((acc, org) => {
    acc.all++
    const status = org.status?.toLowerCase() || 'unknown'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, { all: 0, active: 0, inactive: 0, prospect: 0 } as Record<string, number>)

  filters.value.forEach(filter => {
    filter.count = counts[filter.key] || 0
  })
}

const navigateToOrganization = (id: string) => {
  router.push(`/organizations/${id}`)
}

const editOrganization = (id: string) => {
  router.push(`/organizations/${id}/edit`)
}

const deleteOrganization = async (id: string) => {
  const organization = organizations.value.find(org => org.id === id)
  if (!organization) return

  if (confirm(`Are you sure you want to delete "${organization.name}"? This action cannot be undone.`)) {
    try {
      await organizationStore.deleteOrganization(id)
      updateFilterCounts()
    } catch (err) {
      console.error('Error deleting organization:', err)
      alert('Failed to delete organization. Please try again.')
    }
  }
}

const getStatusColor = (status: OrganizationStatus | null): string => {
  if (!status) return 'bg-gray-100 text-gray-800'
  const colors = {
    Active: 'bg-green-100 text-green-800',
    Inactive: 'bg-gray-100 text-gray-800',
    Prospect: 'bg-blue-100 text-blue-800',
    Customer: 'bg-purple-100 text-purple-800',
    Partner: 'bg-yellow-100 text-yellow-800',
    Vendor: 'bg-indigo-100 text-indigo-800'
  }
  return colors[status] || colors.Inactive
}

const getStatusLabel = (status: OrganizationStatus | null): string => {
  if (!status) return 'Unknown'
  return status
}

// Watchers
watch(searchQuery, () => {
  currentPage.value = 1
})

watch(activeFilter, () => {
  currentPage.value = 1
})

// Lifecycle
onMounted(() => {
  loadOrganizations()
})
</script>