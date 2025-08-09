<template>
  <div class="opportunity-detail-view">
      <!-- Loading State -->
      <div v-if="loading" class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div class="flex justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
        <p class="text-center text-gray-500 mt-4">Loading opportunity details...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-white rounded-lg shadow-sm border border-red-200 p-6">
        <div class="flex items-center mb-4">
          <svg class="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-red-700">{{ error }}</span>
        </div>
        <div class="flex space-x-3">
          <router-link
            to="/opportunities"
            class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Opportunities
          </router-link>
          <button
            @click="loadOpportunity"
            class="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      </div>

      <!-- Opportunity Details -->
      <div v-else-if="opportunity" class="space-y-6">
        <!-- Breadcrumb Navigation -->
        <nav class="flex mb-4" aria-label="Breadcrumb">
          <ol class="inline-flex items-center space-x-1 md:space-x-3">
            <li class="inline-flex items-center">
              <router-link
                to="/"
                class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-primary-600"
              >
                <svg class="w-3 h-3 mr-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"/>
                </svg>
                Dashboard
              </router-link>
            </li>
            <li>
              <div class="flex items-center">
                <svg class="w-3 h-3 text-gray-400 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 5 7 7-7 7"></path>
                </svg>
                <router-link
                  to="/opportunities"
                  class="ml-1 text-sm font-medium text-gray-700 hover:text-primary-600 md:ml-2"
                >
                  Opportunities
                </router-link>
              </div>
            </li>
            <li aria-current="page">
              <div class="flex items-center">
                <svg class="w-3 h-3 text-gray-400 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 5 7 7-7 7"></path>
                </svg>
                <span class="ml-1 text-sm font-medium text-gray-500 md:ml-2">{{ opportunity.name }}</span>
              </div>
            </li>
          </ol>
        </nav>

        <!-- Header -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center space-x-3">
              <router-link
                to="/opportunities"
                class="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md p-1"
                aria-label="Back to opportunities list"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </router-link>
              <h1 class="text-3xl font-bold text-gray-900">Opportunity Details</h1>
            </div>
            <div class="flex space-x-3">
              <router-link
                :to="`/opportunities/${opportunity.id}/edit`"
                class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Opportunity
              </router-link>
              <button
                @click="confirmDelete"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>

          <!-- Opportunity Name and Basic Info -->
          <div class="flex items-start space-x-6">
            <div class="flex-shrink-0">
              <div class="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center">
                <svg class="h-10 w-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div class="flex-1">
              <h2 class="text-2xl font-bold text-gray-900">{{ opportunity.name }}</h2>
              <div class="flex items-center space-x-4 mt-2">
                <StageTag :stage="opportunity.stage" />
                <ProbabilityBar 
                  :probability="opportunity.probability_percent || 0" 
                  :size="'sm'"
                  :show-label="true"
                />
              </div>
              <p v-if="opportunity.organization_name" class="text-lg text-gray-600 mt-1">
                {{ opportunity.organization_name }}
              </p>
            </div>
          </div>
        </div>

        <!-- Key Details -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Left Column - Opportunity Information -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-6">Opportunity Information</h3>
            
            <div class="space-y-4">
              <!-- Stage -->
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-500">Stage</span>
                <StageTag :stage="opportunity.stage" />
              </div>
              
              <!-- Probability -->
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-500">Probability</span>
                <ProbabilityBar 
                  :probability="opportunity.probability_percent || 0" 
                  :size="'sm'"
                  :show-label="true"
                />
              </div>

              <!-- Expected Close Date -->
              <div v-if="opportunity.expected_close_date" class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-500">Expected Close Date</span>
                <span class="text-gray-900">{{ formatDate(opportunity.expected_close_date) }}</span>
              </div>

              <!-- Created Date -->
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-500">Created</span>
                <span class="text-gray-900">{{ formatDate(opportunity.created_at) }}</span>
              </div>

              <!-- Last Updated -->
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-500">Last Updated</span>
                <span class="text-gray-900">{{ formatDate(opportunity.updated_at) }}</span>
              </div>
            </div>
          </div>

          <!-- Right Column - Organization & Product Details -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-6">Details</h3>
            
            <div class="space-y-4">
              <!-- Organization -->
              <div>
                <span class="text-sm font-medium text-gray-500">Organization</span>
                <div class="mt-1">
                  <span class="text-gray-900">{{ opportunity.organization_name || 'Not specified' }}</span>
                </div>
              </div>

              <!-- Principal -->
              <div v-if="opportunity.principal_name">
                <span class="text-sm font-medium text-gray-500">Principal</span>
                <div class="mt-1">
                  <span class="text-gray-900">{{ opportunity.principal_name }}</span>
                </div>
              </div>

              <!-- Product -->
              <div v-if="opportunity.product_name">
                <span class="text-sm font-medium text-gray-500">Product</span>
                <div class="mt-1">
                  <span class="text-gray-900">{{ opportunity.product_name }}</span>
                  <p v-if="opportunity.product_description" class="text-sm text-gray-600 mt-1">
                    {{ opportunity.product_description }}
                  </p>
                </div>
              </div>

              <!-- Context -->
              <div v-if="opportunity.context">
                <span class="text-sm font-medium text-gray-500">Context</span>
                <div class="mt-1">
                  <span class="text-gray-900 capitalize">{{ opportunity.context.toLowerCase() }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Notes Section -->
        <div v-if="opportunity.notes" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Notes</h3>
          <div class="prose max-w-none">
            <p class="text-gray-700 whitespace-pre-wrap">{{ opportunity.notes }}</p>
          </div>
        </div>

        <!-- Interactions Section -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium text-gray-900">Interactions</h3>
              <router-link
                :to="`/interactions/new?opportunity_id=${opportunity.id}`"
                class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Interaction
              </router-link>
            </div>
          </div>
          
          <!-- Interaction Tabs -->
          <div class="border-b border-gray-200">
            <nav class="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              <button
                @click="activeInteractionTab = 'recent'"
                :class="[
                  activeInteractionTab === 'recent'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                  'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
                ]"
              >
                Recent Activity
              </button>
              <button
                @click="activeInteractionTab = 'upcoming'"
                :class="[
                  activeInteractionTab === 'upcoming'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                  'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
                ]"
              >
                Follow-ups
                <span v-if="upcomingFollowUps > 0" class="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs font-medium">
                  {{ upcomingFollowUps }}
                </span>
              </button>
              <button
                @click="activeInteractionTab = 'all'"
                :class="[
                  activeInteractionTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                  'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
                ]"
              >
                All ({{ interactionCount }})
              </button>
            </nav>
          </div>

          <!-- Interaction Content -->
          <div class="p-6">
            <!-- Loading State -->
            <div v-if="interactionsLoading" class="flex justify-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>

            <!-- Empty State -->
            <div v-else-if="filteredInteractions.length === 0" class="text-center py-8">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.449L3 21l2.551-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
              </svg>
              <h4 class="mt-2 text-sm font-medium text-gray-900">
                {{ activeInteractionTab === 'upcoming' ? 'No upcoming follow-ups' : 'No interactions yet' }}
              </h4>
              <p class="mt-1 text-sm text-gray-500">
                {{ activeInteractionTab === 'upcoming' 
                    ? 'All follow-ups for this opportunity are complete.' 
                    : 'Get started by adding your first interaction with this opportunity.' 
                }}
              </p>
              <div v-if="activeInteractionTab !== 'upcoming'" class="mt-4">
                <router-link
                  :to="`/interactions/new?opportunity_id=${opportunity.id}`"
                  class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add First Interaction
                </router-link>
              </div>
            </div>

            <!-- Interaction List -->
            <div v-else class="space-y-4">
              <div
                v-for="interaction in filteredInteractions"
                :key="interaction.id"
                class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-150"
              >
                <div class="flex items-start justify-between">
                  <div class="flex items-start space-x-3">
                    <!-- Interaction Type Icon -->
                    <div class="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <component :is="getInteractionIcon(interaction.type)" class="h-4 w-4 text-blue-600" />
                    </div>

                    <!-- Interaction Details -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center space-x-2 mb-1">
                        <h5 class="text-sm font-medium text-gray-900 truncate">
                          {{ interaction.subject }}
                        </h5>
                        <span :class="getStatusBadgeClass(interaction.status)" class="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full">
                          {{ getInteractionStatusLabel(interaction.status) }}
                        </span>
                        <span v-if="interaction.outcome" :class="getOutcomeBadgeClass(interaction.outcome)" class="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full">
                          {{ getInteractionOutcomeLabel(interaction.outcome) }}
                        </span>
                      </div>
                      
                      <div class="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                        <span>{{ getInteractionTypeLabel(interaction.type) }}</span>
                        <span>{{ formatInteractionDate(interaction.interaction_date) }}</span>
                        <span v-if="interaction.duration_minutes">{{ interaction.duration_minutes }}min</span>
                        <div v-if="interaction.rating" class="flex items-center">
                          <svg class="h-4 w-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {{ interaction.rating }}/5
                        </div>
                      </div>

                      <p v-if="interaction.notes" class="text-sm text-gray-700 line-clamp-2 mb-2">
                        {{ interaction.notes }}
                      </p>

                      <!-- Follow-up Information -->
                      <div v-if="interaction.follow_up_required && interaction.follow_up_date" class="flex items-center text-sm">
                        <svg class="h-4 w-4 text-orange-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span :class="isFollowUpOverdue(interaction.follow_up_date) ? 'text-red-600' : 'text-orange-600'">
                          Follow-up {{ isFollowUpOverdue(interaction.follow_up_date) ? 'overdue' : 'due' }}: 
                          {{ formatInteractionDate(interaction.follow_up_date) }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="flex items-center space-x-2">
                    <router-link
                      :to="`/interactions/${interaction.id}`"
                      class="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View
                    </router-link>
                    <router-link
                      :to="`/interactions/${interaction.id}/edit`"
                      class="text-sm text-gray-600 hover:text-gray-800 font-medium"
                    >
                      Edit
                    </router-link>
                  </div>
                </div>
              </div>

              <!-- Show More Link -->
              <div v-if="hasMoreInteractions" class="text-center pt-4">
                <router-link
                  :to="`/interactions?opportunity_id=${opportunity.id}`"
                  class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  View All Interactions ({{ interactionCount }})
                  <svg class="ml-2 -mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div class="mt-3 text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mt-4">Delete Opportunity</h3>
            <div class="mt-2 px-7 py-3">
              <p class="text-sm text-gray-500">
                Are you sure you want to delete <strong>{{ opportunity?.name }}</strong>? 
                This action cannot be undone.
              </p>
            </div>
            <div class="flex items-center px-4 py-3">
              <div class="flex space-x-3 justify-center w-full">
                <button
                  @click="showDeleteModal = false"
                  class="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  @click="deleteOpportunity"
                  :disabled="deleting"
                  class="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  {{ deleting ? 'Deleting...' : 'Delete' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOpportunityStore } from '@/stores/opportunityStore'
import { useInteractionStore } from '@/stores/interactionStore'
import StageTag from '@/components/opportunities/StageTag.vue'
import ProbabilityBar from '@/components/opportunities/ProbabilityBar.vue'
import type { OpportunityDetailView } from '@/types/opportunities'
import type { InteractionListView, InteractionType } from '@/types/interactions'
import {
  getInteractionTypeLabel,
  getInteractionStatusLabel,
  getInteractionOutcomeLabel
} from '@/types/interactions'
import {
  PhoneIcon,
  EnvelopeIcon,
  UserGroupIcon,
  PresentationChartLineIcon,
  ArrowPathIcon,
  TruckIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ClipboardDocumentIcon,
  PencilIcon,
  CheckCircleIcon,
  UserIcon,
  GlobeAltIcon
} from '@heroicons/vue/24/outline'

// Dependencies
const route = useRoute()
const router = useRouter()
const opportunityStore = useOpportunityStore()
const interactionStore = useInteractionStore()

// Get opportunity ID from route params
const opportunityId = route.params.id as string

// ===============================
// REACTIVE STATE
// ===============================

const opportunity = ref<OpportunityDetailView | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const showDeleteModal = ref(false)
const deleting = ref(false)

// Interaction-related state
const activeInteractionTab = ref<'recent' | 'upcoming' | 'all'>('recent')
const interactions = ref<InteractionListView[]>([])
const interactionsLoading = ref(false)

// ===============================
// COMPUTED PROPERTIES
// ===============================

/**
 * Filter interactions based on active tab
 */
const filteredInteractions = computed(() => {
  if (!interactions.value.length) return []

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  switch (activeInteractionTab.value) {
    case 'recent':
      return interactions.value
        .filter(interaction => new Date(interaction.interaction_date) >= thirtyDaysAgo)
        .sort((a, b) => new Date(b.interaction_date).getTime() - new Date(a.interaction_date).getTime())
        .slice(0, 5) // Show only 5 most recent

    case 'upcoming':
      return interactions.value
        .filter(interaction => 
          interaction.follow_up_required && 
          interaction.follow_up_date &&
          new Date(interaction.follow_up_date) >= now
        )
        .sort((a, b) => new Date(a.follow_up_date!).getTime() - new Date(b.follow_up_date!).getTime())

    case 'all':
      // eslint-disable-next-line vue/no-side-effects-in-computed-properties
      return interactions.value
        .sort((a, b) => new Date(b.interaction_date).getTime() - new Date(a.interaction_date).getTime())
        .slice(0, 10) // Show 10 most recent for 'all' tab

    default:
      return []
  }
})

/**
 * Count of total interactions for this opportunity
 */
const interactionCount = computed(() => interactions.value.length)

/**
 * Count of upcoming follow-ups
 */
const upcomingFollowUps = computed(() => {
  const now = new Date()
  return interactions.value.filter(interaction => 
    interaction.follow_up_required && 
    interaction.follow_up_date &&
    new Date(interaction.follow_up_date) >= now
  ).length
})

/**
 * Check if there are more interactions than displayed
 */
const hasMoreInteractions = computed(() => {
  return interactions.value.length > filteredInteractions.value.length
})

// ===============================
// DATA LOADING
// ===============================

/**
 * Load opportunity details
 */
const loadOpportunity = async () => {
  try {
    loading.value = true
    error.value = null
    
    await opportunityStore.fetchOpportunityById(opportunityId)
    
    if (opportunityStore.selectedOpportunity) {
      opportunity.value = opportunityStore.selectedOpportunity
      // Load interactions for this opportunity
      await loadInteractions()
    } else {
      error.value = opportunityStore.error || 'Opportunity not found'
    }
  } catch (err) {
    console.error('Error loading opportunity:', err)
    error.value = 'An unexpected error occurred while loading the opportunity'
  } finally {
    loading.value = false
  }
}

/**
 * Load interactions for this opportunity
 */
const loadInteractions = async () => {
  try {
    interactionsLoading.value = true
    
    // Fetch interactions filtered by opportunity ID
    await interactionStore.fetchInteractions(
      { opportunity_id: opportunityId },
      { page: 1, limit: 50, sort_by: 'interaction_date', sort_order: 'desc' }
    )
    
    interactions.value = interactionStore.interactions || []
  } catch (err) {
    console.error('Error loading interactions:', err)
    // Don't show error for interactions - just show empty state
  } finally {
    interactionsLoading.value = false
  }
}

// ===============================
// DELETE HANDLING
// ===============================

/**
 * Show delete confirmation modal
 */
const confirmDelete = () => {
  showDeleteModal.value = true
}

/**
 * Delete opportunity after confirmation
 */
const deleteOpportunity = async () => {
  if (!opportunity.value) return
  
  try {
    deleting.value = true
    
    const success = await opportunityStore.deleteOpportunity(opportunity.value.id)
    
    if (success) {
      // Success - redirect to opportunities list
      router.push('/opportunities')
    } else {
      error.value = opportunityStore.error || 'Failed to delete opportunity'
      showDeleteModal.value = false
    }
  } catch (err) {
    console.error('Error deleting opportunity:', err)
    error.value = 'An unexpected error occurred while deleting the opportunity'
    showDeleteModal.value = false
  } finally {
    deleting.value = false
  }
}

// ===============================
// UTILITY FUNCTIONS
// ===============================

/**
 * Format date for display
 */
const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Not specified'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Format interaction date for display
 */
const formatInteractionDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Get icon component for interaction type
 */
const getInteractionIcon = (type: InteractionType) => {
  const iconMap = {
    Email: EnvelopeIcon,
    Phone: PhoneIcon,
    Meeting: UserGroupIcon,
    Demo: PresentationChartLineIcon,
    Other: ArrowPathIcon,
    Event: TruckIcon,
    Proposal: DocumentTextIcon,
    Contract: ClipboardDocumentIcon,
    Note: PencilIcon,
    Task: CheckCircleIcon,
    Social: UserIcon,
    Website: GlobeAltIcon
  }
  return iconMap[type] || ChatBubbleLeftRightIcon
}

/**
 * Get CSS classes for status badges
 */
const getStatusBadgeClass = (status: string) => {
  const classes = {
    SCHEDULED: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
    NO_SHOW: 'bg-red-100 text-red-800'
  }
  return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800'
}

/**
 * Get CSS classes for outcome badges
 */
const getOutcomeBadgeClass = (outcome: string) => {
  const classes = {
    POSITIVE: 'bg-green-100 text-green-800',
    NEUTRAL: 'bg-yellow-100 text-yellow-800',
    NEGATIVE: 'bg-red-100 text-red-800',
    NEEDS_FOLLOW_UP: 'bg-orange-100 text-orange-800'
  }
  return classes[outcome as keyof typeof classes] || 'bg-gray-100 text-gray-800'
}

/**
 * Check if follow-up is overdue
 */
const isFollowUpOverdue = (followUpDate: string): boolean => {
  return new Date(followUpDate) < new Date()
}

// ===============================
// LIFECYCLE
// ===============================

onMounted(() => {
  loadOpportunity()
})
</script>

<style scoped>
.opportunity-detail-view {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6;
}

/* Breadcrumb enhancements */
.opportunity-detail-view nav ol li a:hover {
  @apply text-primary-600;
}

.opportunity-detail-view nav ol li[aria-current="page"] span {
  color: rgb(107 114 128); /* text-gray-500 */
}

/* Back button enhancements */
.opportunity-detail-view a[aria-label]:hover {
  @apply bg-gray-50;
}

/* Responsive design */
@media (max-width: 1024px) {
  .opportunity-detail-view {
    @apply px-4;
  }
  
  /* Stack header elements on tablet */
  .opportunity-detail-view .flex.items-center.justify-between {
    @apply flex-col items-start space-y-4;
  }
  
  .opportunity-detail-view .flex.items-center.justify-between > div:last-child {
    @apply self-stretch;
  }
}

@media (max-width: 768px) {
  .opportunity-detail-view {
    @apply px-2 py-4;
  }
  
  /* Single column layout on mobile - already applied via responsive classes */
  
  /* Stack action buttons on mobile */
  .opportunity-detail-view .flex.space-x-3:has(button) {
    @apply flex-col space-y-2 space-x-0;
  }
}

/* Modal enhancements */
@media (max-width: 480px) {
  .opportunity-detail-view .fixed .w-96 {
    @apply w-full mx-4;
  }
}

/* Accessibility enhancements */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .opportunity-detail-view .border-red-200 {
    @apply border-red-600;
  }
  
  .opportunity-detail-view .border-gray-200 {
    @apply border-gray-400;
  }
  
  .opportunity-detail-view .text-gray-500 {
    @apply text-gray-800;
  }
  
  .opportunity-detail-view .text-gray-600 {
    @apply text-gray-900;
  }
}

/* Print styles */
@media print {
  .opportunity-detail-view nav,
  .opportunity-detail-view button,
  .opportunity-detail-view .fixed {
    @apply hidden;
  }
  
  .opportunity-detail-view {
    @apply shadow-none;
  }
  
  .opportunity-detail-view .bg-white {
    @apply bg-transparent border-gray-300;
  }
}
</style>