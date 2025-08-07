<!--
  InteractionListView.vue
  Comprehensive interaction list with filtering, searching, and KPI cards
  Follows OpportunitiesListView patterns for consistency
-->
<template>
  <div class="interaction-list-view">
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Interactions</h1>
          <p class="mt-1 text-sm text-gray-500">
            Track and manage customer interactions across all opportunities
          </p>
        </div>
        <div class="mt-4 sm:mt-0">
          <router-link
            to="/interactions/new"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon class="h-4 w-4 mr-2" />
            New Interaction
          </router-link>
        </div>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <ChatBubbleLeftRightIcon class="h-8 w-8 text-blue-500" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Total Interactions
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {{ kpis?.total_interactions || totalInteractions }}
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
              <CheckCircleIcon class="h-8 w-8 text-green-500" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Completed
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {{ kpis?.completed_interactions || completedInteractions }}
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
              <StarIcon class="h-8 w-8 text-yellow-500" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Average Rating
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {{ (kpis?.average_rating || averageRating)?.toFixed(1) || 'N/A' }}
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
              <ClockIcon class="h-8 w-8 text-orange-500" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Pending Follow-ups
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {{ kpis?.pending_follow_ups || pendingFollowUps }}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="bg-white shadow rounded-lg mb-6">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Filters</h3>
      </div>
      <div class="px-6 py-4 space-y-4">
        <!-- Search and Quick Filters Row -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <!-- Search -->
          <div>
            <label for="search" class="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div class="relative">
              <input
                id="search"
                v-model="filters.search"
                @input="handleFilterChange"
                type="text"
                placeholder="Search interactions..."
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <MagnifyingGlassIcon class="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <!-- Type Filter -->
          <div>
            <label for="type-filter" class="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              id="type-filter"
              v-model="filters.type"
              @change="handleFilterChange"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Types</option>
              <option v-for="type in INTERACTION_TYPES" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
          </div>

          <!-- Status Filter -->
          <div>
            <label for="status-filter" class="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              v-model="filters.status"
              @change="handleFilterChange"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Statuses</option>
              <option v-for="status in INTERACTION_STATUSES" :key="status.value" :value="status.value">
                {{ status.label }}
              </option>
            </select>
          </div>

          <!-- Outcome Filter -->
          <div>
            <label for="outcome-filter" class="block text-sm font-medium text-gray-700 mb-1">
              Outcome
            </label>
            <select
              id="outcome-filter"
              v-model="filters.outcome"
              @change="handleFilterChange"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Outcomes</option>
              <option v-for="outcome in INTERACTION_OUTCOMES" :key="outcome.value" :value="outcome.value">
                {{ outcome.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Date Range and Advanced Filters -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <!-- Date From -->
          <div>
            <label for="date-from" class="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              id="date-from"
              v-model="filters.date_from"
              @change="handleFilterChange"
              type="date"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <!-- Date To -->
          <div>
            <label for="date-to" class="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              id="date-to"
              v-model="filters.date_to"
              @change="handleFilterChange"
              type="date"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <!-- Follow-up Required -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Follow-up
            </label>
            <select
              v-model="filters.follow_up_required"
              @change="handleFilterChange"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All</option>
              <option :value="true">Required</option>
              <option :value="false">Not Required</option>
            </select>
          </div>

          <!-- Clear Filters -->
          <div class="flex items-end">
            <button
              @click="clearFilters"
              type="button"
              class="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <XMarkIcon class="h-4 w-4 mr-2" />
              Clear
            </button>
          </div>

          <!-- Apply Filters -->
          <div class="flex items-end">
            <button
              @click="applyFilters"
              type="button"
              class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FunnelIcon class="h-4 w-4 mr-2" />
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Interactions Table -->
    <div class="bg-white shadow rounded-lg overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-900">
          Interactions ({{ totalCount || interactions.length }})
        </h3>
        <div class="flex items-center space-x-2">
          <!-- Sort Dropdown -->
          <select
            v-model="sortBy"
            @change="handleSortChange"
            class="text-sm border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="interaction_date">Date</option>
            <option value="created_at">Created</option>
            <option value="subject">Subject</option>
            <option value="rating">Rating</option>
          </select>
          
          <!-- Sort Direction -->
          <button
            @click="toggleSortDirection"
            type="button"
            class="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
          >
            <ArrowUpIcon v-if="sortOrder === 'asc'" class="h-4 w-4" />
            <ArrowDownIcon v-else class="h-4 w-4" />
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="px-6 py-12 text-center">
        <div class="inline-flex items-center">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading interactions...
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="interactions.length === 0" class="px-6 py-12 text-center">
        <ChatBubbleLeftRightIcon class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-4 text-sm font-medium text-gray-900">No interactions found</h3>
        <p class="mt-2 text-sm text-gray-500">
          {{ hasActiveFilters ? 'Try adjusting your filters' : 'Get started by creating your first interaction' }}
        </p>
        <div class="mt-6">
          <router-link
            v-if="!hasActiveFilters"
            to="/interactions/new"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon class="h-4 w-4 mr-2" />
            New Interaction
          </router-link>
          <button
            v-else
            @click="clearFilters"
            type="button"
            class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <!-- Interactions Table -->
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Interaction
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Opportunity
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rating
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Follow-up
              </th>
              <th scope="col" class="relative px-6 py-3">
                <span class="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="interaction in interactions" :key="interaction.id" class="hover:bg-gray-50">
              <!-- Interaction Info -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-8 w-8">
                    <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <component :is="getTypeIcon(interaction.type)" class="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ interaction.subject }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ getInteractionTypeLabel(interaction.type) }}
                      <span v-if="interaction.duration_minutes">
                        • {{ interaction.duration_minutes }}min
                      </span>
                    </div>
                  </div>
                </div>
              </td>

              <!-- Opportunity -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ interaction.opportunity_name }}</div>
                <div class="text-sm text-gray-500">{{ interaction.organization_name }}</div>
              </td>

              <!-- Status -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getStatusBadgeClass(interaction.status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                  {{ getInteractionStatusLabel(interaction.status) }}
                </span>
                <div v-if="interaction.outcome" class="mt-1">
                  <span :class="getOutcomeBadgeClass(interaction.outcome)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                    {{ getInteractionOutcomeLabel(interaction.outcome) }}
                  </span>
                </div>
              </td>

              <!-- Date -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div>{{ formatDate(interaction.interaction_date) }}</div>
                <div class="text-gray-500">
                  {{ formatRelativeTime(interaction.interaction_date) }}
                </div>
              </td>

              <!-- Rating -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div v-if="interaction.rating" class="flex items-center">
                  <div class="flex">
                    <StarIcon
                      v-for="star in 5"
                      :key="star"
                      :class="[
                        star <= interaction.rating ? 'text-yellow-400' : 'text-gray-300',
                        'h-4 w-4'
                      ]"
                    />
                  </div>
                  <span class="ml-1 text-sm text-gray-600">{{ interaction.rating }}/5</span>
                </div>
                <span v-else class="text-sm text-gray-500">Not rated</span>
              </td>

              <!-- Follow-up -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div v-if="interaction.follow_up_required && interaction.follow_up_date">
                  <div class="text-sm text-gray-900">
                    {{ formatDate(interaction.follow_up_date) }}
                  </div>
                  <div :class="[
                    'text-xs',
                    interaction.days_until_followup && interaction.days_until_followup < 0 
                      ? 'text-red-600' 
                      : 'text-gray-500'
                  ]">
                    {{
                      interaction.days_until_followup && interaction.days_until_followup < 0 
                        ? `${Math.abs(interaction.days_until_followup)} days overdue`
                        : interaction.days_until_followup === 0
                        ? 'Due today'
                        : `In ${interaction.days_until_followup} days`
                    }}
                  </div>
                </div>
                <span v-else class="text-sm text-gray-500">No follow-up</span>
              </td>

              <!-- Actions -->
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end space-x-2">
                  <router-link
                    :to="`/interactions/${interaction.id}`"
                    class="text-blue-600 hover:text-blue-900"
                  >
                    View
                  </router-link>
                  <router-link
                    :to="`/interactions/${interaction.id}/edit`"
                    class="text-gray-600 hover:text-gray-900"
                  >
                    Edit
                  </router-link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="interactions.length > 0" class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        <div class="flex items-center justify-between">
          <div class="flex-1 flex justify-between sm:hidden">
            <button
              @click="previousPage"
              :disabled="!hasPreviousPage"
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              @click="nextPage"
              :disabled="!hasNextPage"
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Showing
                <span class="font-medium">{{ ((currentPage - 1) * limit) + 1 }}</span>
                to
                <span class="font-medium">{{ Math.min(currentPage * limit, totalCount || interactions.length) }}</span>
                of
                <span class="font-medium">{{ totalCount || interactions.length }}</span>
                results
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  @click="previousPage"
                  :disabled="!hasPreviousPage"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon class="h-5 w-5" />
                </button>
                <button
                  @click="nextPage"
                  :disabled="!hasNextPage"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon class="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useInteractionStore } from '@/stores/interactionStore'
import type {
  InteractionFilters,
  InteractionType
} from '@/types/interactions'
import {
  INTERACTION_TYPES,
  INTERACTION_STATUSES,
  INTERACTION_OUTCOMES,
  getInteractionTypeLabel,
  getInteractionStatusLabel,
  getInteractionOutcomeLabel
} from '@/types/interactions'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  StarIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserGroupIcon,
  PresentationChartLineIcon,
  ArrowPathIcon,
  TruckIcon
} from '@heroicons/vue/24/outline'

// Store
const interactionStore = useInteractionStore()

// Reactive state
const filters = ref<InteractionFilters>({})
const sortBy = ref<string>('interaction_date')
const sortOrder = ref<'asc' | 'desc'>('desc')

// Computed properties from store
const interactions = computed(() => interactionStore.interactions)
const loading = computed(() => interactionStore.loading)
const kpis = computed(() => interactionStore.kpis)
const totalCount = computed(() => interactionStore.totalCount)
const currentPage = computed(() => interactionStore.currentPage)
const hasNextPage = computed(() => interactionStore.hasNextPage)
const hasPreviousPage = computed(() => interactionStore.hasPreviousPage)

// KPI computeds (fallback to store computeds)
const totalInteractions = computed(() => interactionStore.totalInteractions)
const completedInteractions = computed(() => interactionStore.completedInteractions)
const averageRating = computed(() => interactionStore.averageRating)
const pendingFollowUps = computed(() => interactionStore.pendingFollowUps)

// Filter state
const hasActiveFilters = computed(() => {
  return Object.values(filters.value).some(value => 
    value !== '' && value !== null && value !== undefined
  )
})

const limit = 20 // Items per page

// Icon mapping
const getTypeIcon = (type: InteractionType) => {
  const iconMap = {
    Email: EnvelopeIcon,
    Phone: PhoneIcon,
    Meeting: UserGroupIcon,
    Demo: PresentationChartLineIcon,
    Proposal: PresentationChartLineIcon,
    Contract: PresentationChartLineIcon,
    Note: ChatBubbleLeftRightIcon,
    Task: ArrowPathIcon,
    Event: TruckIcon,
    Social: ChatBubbleLeftRightIcon,
    Website: ChatBubbleLeftRightIcon,
    Other: ArrowPathIcon
  }
  return iconMap[type] || ChatBubbleLeftRightIcon
}

// Status badge styling
const getStatusBadgeClass = (status: string) => {
  const classes = {
    SCHEDULED: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
    NO_SHOW: 'bg-red-100 text-red-800'
  }
  return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800'
}

// Outcome badge styling
const getOutcomeBadgeClass = (outcome: string) => {
  const classes = {
    POSITIVE: 'bg-green-100 text-green-800',
    NEUTRAL: 'bg-yellow-100 text-yellow-800',
    NEGATIVE: 'bg-red-100 text-red-800',
    NEEDS_FOLLOW_UP: 'bg-orange-100 text-orange-800'
  }
  return classes[outcome as keyof typeof classes] || 'bg-gray-100 text-gray-800'
}

// Date formatting
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  return `${Math.floor(diffInDays / 30)} months ago`
}

// Event handlers
const handleFilterChange = () => {
  // Debounce filter changes for search
  setTimeout(() => {
    applyFilters()
  }, 300)
}

const applyFilters = async () => {
  await interactionStore.fetchInteractions(filters.value, {
    page: 1,
    limit,
    sort_by: sortBy.value as any,
    sort_order: sortOrder.value
  })
}

const clearFilters = async () => {
  filters.value = {}
  await applyFilters()
}

const handleSortChange = async () => {
  await interactionStore.fetchInteractions(filters.value, {
    page: currentPage.value,
    limit,
    sort_by: sortBy.value as any,
    sort_order: sortOrder.value
  })
}

const toggleSortDirection = async () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  await handleSortChange()
}

// Pagination
const nextPage = async () => {
  if (hasNextPage.value) {
    await interactionStore.fetchInteractions(filters.value, {
      page: currentPage.value + 1,
      limit,
      sort_by: sortBy.value as any,
      sort_order: sortOrder.value
    })
  }
}

const previousPage = async () => {
  if (hasPreviousPage.value) {
    await interactionStore.fetchInteractions(filters.value, {
      page: currentPage.value - 1,
      limit,
      sort_by: sortBy.value as any,
      sort_order: sortOrder.value
    })
  }
}

// Initialize data
onMounted(async () => {
  // Load initial data
  await Promise.all([
    interactionStore.fetchKPIs(),
    interactionStore.fetchInteractions(filters.value, {
      page: 1,
      limit,
      sort_by: sortBy.value as any,
      sort_order: sortOrder.value
    })
  ])
})
</script>

<style scoped>
/* Component-specific styles */
</style>