<template>
  <div v-if="loading" class="text-center py-12">
    <div class="inline-flex items-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
      <span class="text-lg text-gray-600">Loading organization...</span>
    </div>
  </div>

  <div v-else-if="error" class="text-center py-12">
    <div class="text-red-600 mb-4">
      <ExclamationTriangleIcon class="h-16 w-16 mx-auto" />
    </div>
    <h3 class="text-xl font-medium text-gray-900 mb-2">Error Loading Organization</h3>
    <p class="text-gray-600 mb-6">{{ error }}</p>
    <div class="space-x-4">
      <button
        @click="loadOrganization"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
      >
        <ArrowPathIcon class="h-4 w-4 mr-2" />
        Try Again
      </button>
      <router-link
        to="/organizations"
        class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
      >
        Back to Organizations
      </router-link>
    </div>
  </div>

  <div v-else-if="organization" class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-start justify-between">
      <div class="min-w-0 flex-1">
        <nav class="flex items-center space-x-2 text-sm text-gray-500 mb-2">
          <router-link to="/organizations" class="hover:text-gray-700">Organizations</router-link>
          <ChevronRightIcon class="h-4 w-4" />
          <span class="text-gray-900 truncate">{{ organization.name }}</span>
        </nav>
        
        <div class="flex items-center space-x-4">
          <div class="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
            <BuildingOfficeIcon class="h-8 w-8 text-blue-600" />
          </div>
          
          <div class="min-w-0 flex-1">
            <h1 class="text-2xl font-bold text-gray-900 truncate">{{ organization.name }}</h1>
            <div class="flex items-center space-x-4 mt-1">
              <span v-if="organization.industry" class="text-sm text-gray-500">
                {{ organization.industry }}
              </span>
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  getStatusColor(organization.status)
                ]"
              >
                {{ getStatusLabel(organization.status) }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex items-center space-x-3 ml-4">
        <router-link
          :to="`/organizations/${organization.id}/edit`"
          class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PencilIcon class="h-4 w-4 mr-2" />
          Edit
        </router-link>
        
        <button
          @click="deleteOrganization"
          class="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <TrashIcon class="h-4 w-4 mr-2" />
          Delete
        </button>
      </div>
    </div>

    <!-- Organization Information -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Information -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Basic Details -->
        <div class="bg-white shadow-sm rounded-lg border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Organization Details</h3>
          </div>
          
          <div class="px-6 py-6 space-y-6">
            <div v-if="organization.description" class="prose max-w-none">
              <p class="text-gray-700">{{ organization.description }}</p>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div v-if="organization.employees_count">
                <dt class="text-sm font-medium text-gray-500">Employee Count</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  {{ organization.employees_count.toLocaleString() }} employees
                </dd>
              </div>
              
              <div v-if="organization.created_at">
                <dt class="text-sm font-medium text-gray-500">Created</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  {{ formatDate(organization.created_at) }}
                </dd>
              </div>
              
              <div v-if="organization.updated_at">
                <dt class="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  {{ formatDate(organization.updated_at) }}
                </dd>
              </div>
            </div>
          </div>
        </div>

        <!-- Contact Information -->
        <div class="bg-white shadow-sm rounded-lg border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Contact Information</h3>
          </div>
          
          <div class="px-6 py-6">
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div v-if="organization.email">
                <dt class="text-sm font-medium text-gray-500 flex items-center">
                  <EnvelopeIcon class="h-4 w-4 mr-2" />
                  Email
                </dt>
                <dd class="mt-1">
                  <a
                    :href="`mailto:${organization.email}`"
                    class="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {{ organization.email }}
                  </a>
                </dd>
              </div>
              
              <div v-if="organization.primary_phone">
                <dt class="text-sm font-medium text-gray-500 flex items-center">
                  <PhoneIcon class="h-4 w-4 mr-2" />
                  Phone
                </dt>
                <dd class="mt-1">
                  <a
                    :href="`tel:${organization.primary_phone}`"
                    class="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {{ organization.primary_phone }}
                  </a>
                </dd>
              </div>
              
              <div v-if="organization.website">
                <dt class="text-sm font-medium text-gray-500 flex items-center">
                  <GlobeAltIcon class="h-4 w-4 mr-2" />
                  Website
                </dt>
                <dd class="mt-1">
                  <a
                    :href="organization.website"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    {{ organization.website }}
                    <ArrowTopRightOnSquareIcon class="h-3 w-3 ml-1" />
                  </a>
                </dd>
              </div>
              
            </dl>
          </div>
        </div>

        <!-- Address Information -->
        <div v-if="hasAddress" class="bg-white shadow-sm rounded-lg border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Address</h3>
          </div>
          
          <div class="px-6 py-6">
            <address class="text-sm text-gray-900 not-italic">
              <div v-if="organization.address_line_1">{{ organization.address_line_1 }}</div>
              <div v-if="organization.address_line_2">{{ organization.address_line_2 }}</div>
              <div class="flex items-center space-x-2">
                <span v-if="organization.city">{{ organization.city }}</span>
                <span v-if="organization.city && organization.state_province">,</span>
                <span v-if="organization.state_province">{{ organization.state_province }}</span>
                <span v-if="organization.postal_code">{{ organization.postal_code }}</span>
              </div>
              <div v-if="organization.country">{{ organization.country }}</div>
            </address>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Quick Stats -->
        <div class="bg-white shadow-sm rounded-lg border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Quick Stats</h3>
          </div>
          
          <div class="px-6 py-6 space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">Status</span>
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  getStatusColor(organization.status)
                ]"
              >
                {{ getStatusLabel(organization.status) }}
              </span>
            </div>
            
            <div v-if="organization.employees_count" class="flex items-center justify-between">
              <span class="text-sm text-gray-500">Employees</span>
              <span class="text-sm font-medium text-gray-900">
                {{ organization.employees_count.toLocaleString() }}
              </span>
            </div>
            
            <div v-if="organization.industry" class="flex items-center justify-between">
              <span class="text-sm text-gray-500">Industry</span>
              <span class="text-sm font-medium text-gray-900">{{ organization.industry }}</span>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white shadow-sm rounded-lg border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          
          <div class="px-6 py-6 space-y-3">
            <router-link
              :to="`/organizations/${organization.id}/edit`"
              class="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <PencilIcon class="h-4 w-4 mr-2" />
              Edit Organization
            </router-link>
            
            <button
              v-if="organization.website"
              @click="openWebsite"
              class="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <GlobeAltIcon class="h-4 w-4 mr-2" />
              Visit Website
            </button>
            
            <button
              v-if="organization.email"
              @click="sendEmail"
              class="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <EnvelopeIcon class="h-4 w-4 mr-2" />
              Send Email
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Advanced Features Sections -->
    <div class="space-y-6">
      <!-- Interaction Timeline -->
      <InteractionTimeline :organization-id="organization.id" />
      
      <!-- Document Repository -->
      <DocumentRepository :organization-id="organization.id" />
      
      <!-- Opportunity Pipeline -->
      <OpportunityPipeline :organization-id="organization.id" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ChevronRightIcon,
  BuildingOfficeIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'
import { useOrganizationStore } from '@/stores/organizationStore'
import type { OrganizationStatus } from '@/types/organizations'
import InteractionTimeline from '@/components/organizations/InteractionTimeline.vue'
import DocumentRepository from '@/components/organizations/DocumentRepository.vue'
import OpportunityPipeline from '@/components/organizations/OpportunityPipeline.vue'

/**
 * Organization Detail View
 * Display comprehensive information about a single organization
 */

interface Props {
  id: string
}

const props = defineProps<Props>()
const router = useRouter()
const organizationStore = useOrganizationStore()

// State
const loading = ref(false)
const error = ref<string | null>(null)

// Computed
const organization = computed(() => organizationStore.currentOrganization)

const hasAddress = computed(() => {
  if (!organization.value) return false
  return !!(
    organization.value.address_line_1 ||
    organization.value.city ||
    organization.value.state_province ||
    organization.value.postal_code ||
    organization.value.country
  )
})

// Methods
const loadOrganization = async () => {
  loading.value = true
  error.value = null
  
  try {
    await organizationStore.fetchOrganization(props.id)
    
    if (!organization.value) {
      error.value = 'Organization not found'
    }
  } catch (err) {
    console.error('Error loading organization:', err)
    error.value = 'Failed to load organization. Please try again.'
  } finally {
    loading.value = false
  }
}

const deleteOrganization = async () => {
  if (!organization.value) return

  const confirmed = confirm(
    `Are you sure you want to delete "${organization.value.name}"? This action cannot be undone.`
  )
  
  if (confirmed) {
    try {
      await organizationStore.deleteOrganization(props.id)
      router.push('/organizations')
    } catch (err) {
      console.error('Error deleting organization:', err)
      alert('Failed to delete organization. Please try again.')
    }
  }
}

const openWebsite = () => {
  if (organization.value?.website) {
    window.open(organization.value.website, '_blank', 'noopener,noreferrer')
  }
}

const sendEmail = () => {
  if (organization.value?.email) {
    window.location.href = `mailto:${organization.value.email}`
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

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Lifecycle
onMounted(() => {
  loadOrganization()
})
</script>