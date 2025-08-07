<!--
  InteractionDetailView.vue
  Detailed view of a single interaction with all related information
  Follows OpportunityDetailView patterns for consistency
-->
<template>
  <div class="interaction-detail-view">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="inline-flex items-center">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading interaction...
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="rounded-md bg-red-50 p-4">
      <div class="flex">
        <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error</h3>
          <div class="mt-2 text-sm text-red-700">
            {{ error }}
          </div>
        </div>
      </div>
    </div>

    <!-- Interaction Detail Content -->
    <div v-else-if="interaction" class="space-y-6">
      <!-- Header -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <component :is="getTypeIcon(interaction.type)" class="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 class="text-2xl font-bold text-gray-900">{{ interaction.subject }}</h1>
                <p class="text-sm text-gray-500">
                  {{ getInteractionTypeLabel(interaction.type) }} 
                  • {{ formatDate(interaction.interaction_date) }}
                </p>
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <router-link
                :to="`/interactions/${interaction.id}/edit`"
                class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PencilIcon class="h-4 w-4 mr-2" />
                Edit
              </router-link>
              <button
                @click="confirmDelete"
                type="button"
                class="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon class="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>

        <!-- Status and Key Info -->
        <div class="px-6 py-4">
          <div class="grid grid-cols-2 gap-6 lg:grid-cols-4">
            <!-- Status -->
            <div>
              <dt class="text-sm font-medium text-gray-500">Status</dt>
              <dd class="mt-1">
                <span :class="getStatusBadgeClass(interaction.status || '')" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                  {{ interaction.status ? getInteractionStatusLabel(interaction.status) : 'Unknown' }}
                </span>
              </dd>
            </div>

            <!-- Outcome -->
            <div v-if="interaction.outcome">
              <dt class="text-sm font-medium text-gray-500">Outcome</dt>
              <dd class="mt-1">
                <span :class="getOutcomeBadgeClass(interaction.outcome)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                  {{ getInteractionOutcomeLabel(interaction.outcome) }}
                </span>
              </dd>
            </div>

            <!-- Rating -->
            <div v-if="interaction.rating">
              <dt class="text-sm font-medium text-gray-500">Rating</dt>
              <dd class="mt-1 flex items-center">
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
              </dd>
            </div>

            <!-- Duration -->
            <div v-if="interaction.duration_minutes">
              <dt class="text-sm font-medium text-gray-500">Duration</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ interaction.duration_minutes }} minutes</dd>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Left Column: Main Details -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Opportunity Information -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Related Opportunity</h3>
            </div>
            <div class="px-6 py-4">
              <div v-if="interaction.opportunity" class="flex items-center">
                <BuildingOfficeIcon class="h-8 w-8 text-gray-400 mr-3" />
                <div>
                  <router-link
                    :to="`/opportunities/${interaction.opportunity.id}`"
                    class="text-lg font-medium text-blue-600 hover:text-blue-800"
                  >
                    {{ interaction.opportunity.name }}
                  </router-link>
                  <p class="text-sm text-gray-500">
                    {{ interaction.opportunity.organization?.name }} • Stage: {{ interaction.opportunity.stage }}
                  </p>
                </div>
              </div>
              <div v-else class="text-sm text-gray-500">
                Opportunity information not available
              </div>
            </div>
          </div>

          <!-- Interaction Details -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Interaction Details</h3>
            </div>
            <div class="px-6 py-4">
              <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <!-- Date & Time -->
                <div>
                  <dt class="text-sm font-medium text-gray-500">Date & Time</dt>
                  <dd class="mt-1 text-sm text-gray-900">
                    {{ formatDateTime(interaction.interaction_date) }}
                  </dd>
                </div>

                <!-- Contact Method -->
                <div v-if="interaction.contact_method">
                  <dt class="text-sm font-medium text-gray-500">Contact Method</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ interaction.contact_method }}</dd>
                </div>

                <!-- Location -->
                <div v-if="interaction.location">
                  <dt class="text-sm font-medium text-gray-500">Location</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ interaction.location }}</dd>
                </div>

                <!-- Participants -->
                <div v-if="interaction.participants && interaction.participants.length > 0">
                  <dt class="text-sm font-medium text-gray-500">Participants</dt>
                  <dd class="mt-1 text-sm text-gray-900">
                    {{ Array.isArray(interaction.participants) ? interaction.participants.join(', ') : interaction.participants }}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="interaction.notes" class="bg-white shadow rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Notes</h3>
            </div>
            <div class="px-6 py-4">
              <p class="text-sm text-gray-900 whitespace-pre-wrap">{{ interaction.notes }}</p>
            </div>
          </div>

          <!-- Follow-up Information -->
          <div v-if="interaction.follow_up_required" class="bg-white shadow rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Follow-up Required</h3>
            </div>
            <div class="px-6 py-4">
              <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <!-- Follow-up Date -->
                <div v-if="interaction.follow_up_date">
                  <dt class="text-sm font-medium text-gray-500">Follow-up Date</dt>
                  <dd class="mt-1 text-sm text-gray-900">
                    {{ formatDateTime(interaction.follow_up_date) }}
                    <span v-if="isFollowUpOverdue" class="ml-2 text-xs text-red-600 font-medium">
                      ({{ Math.abs(daysUntilFollowUp || 0) }} days overdue)
                    </span>
                    <span v-else-if="daysUntilFollowUp === 0" class="ml-2 text-xs text-orange-600 font-medium">
                      (Due today)
                    </span>
                    <span v-else-if="daysUntilFollowUp !== null && daysUntilFollowUp > 0" class="ml-2 text-xs text-gray-600">
                      (In {{ daysUntilFollowUp }} days)
                    </span>
                  </dd>
                </div>

                <!-- Next Action -->
                <div v-if="interaction.next_action">
                  <dt class="text-sm font-medium text-gray-500">Next Action</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ interaction.next_action }}</dd>
                </div>
              </dl>

              <!-- Follow-up Notes -->
              <div v-if="interaction.follow_up_notes" class="mt-4">
                <dt class="text-sm font-medium text-gray-500">Follow-up Notes</dt>
                <dd class="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{{ interaction.follow_up_notes }}</dd>
              </div>

              <!-- Follow-up Actions -->
              <div class="mt-4 flex space-x-3">
                <button
                  @click="markFollowUpComplete"
                  type="button"
                  class="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <CheckIcon class="h-3 w-3 mr-1" />
                  Mark Complete
                </button>
                <button
                  @click="rescheduleFollowUp"
                  type="button"
                  class="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <CalendarIcon class="h-3 w-3 mr-1" />
                  Reschedule
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Sidebar -->
        <div class="space-y-6">
          <!-- Quick Actions -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div class="px-6 py-4 space-y-3">
              <button
                v-if="interaction.status === 'SCHEDULED'"
                @click="markAsCompleted"
                type="button"
                class="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <CheckCircleIcon class="h-4 w-4 mr-2" />
                Mark as Completed
              </button>

              <button
                v-if="!interaction.follow_up_required && interaction.status === 'COMPLETED'"
                @click="scheduleFollowUp"
                type="button"
                class="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <CalendarIcon class="h-4 w-4 mr-2" />
                Schedule Follow-up
              </button>

              <router-link
                :to="`/interactions/new?opportunity_id=${interaction.opportunity_id}`"
                class="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon class="h-4 w-4 mr-2" />
                Create Related Interaction
              </router-link>
            </div>
          </div>

          <!-- Tags -->
          <div v-if="interaction.tags && interaction.tags.length > 0" class="bg-white shadow rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Tags</h3>
            </div>
            <div class="px-6 py-4">
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="tag in interaction.tags"
                  :key="tag"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>

          <!-- Metadata -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Information</h3>
            </div>
            <div class="px-6 py-4">
              <dl class="space-y-3">
                <div>
                  <dt class="text-sm font-medium text-gray-500">Created</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ formatDateTime(interaction.created_at || '') }}</dd>
                </div>
                <div v-if="interaction.updated_at">
                  <dt class="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ formatDateTime(interaction.updated_at || interaction.created_at || '') }}</dd>
                </div>
                <div v-if="interaction.created_by">
                  <dt class="text-sm font-medium text-gray-500">Created By</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ interaction.created_by }}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3 text-center">
          <ExclamationTriangleIcon class="mx-auto h-16 w-16 text-red-600" />
          <h3 class="text-lg font-medium text-gray-900 mt-4">Delete Interaction</h3>
          <p class="text-sm text-gray-500 mt-2">
            Are you sure you want to delete this interaction? This action cannot be undone.
          </p>
          <div class="flex justify-center space-x-3 mt-6">
            <button
              @click="showDeleteModal = false"
              type="button"
              class="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              @click="deleteInteraction"
              type="button" 
              class="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useInteractionStore } from '@/stores/interactionStore'
import type { InteractionType } from '@/types/interactions'
import {
  getInteractionTypeLabel,
  getInteractionStatusLabel,
  getInteractionOutcomeLabel
} from '@/types/interactions'
import {
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon,
  StarIcon,
  CheckCircleIcon,
  CalendarIcon,
  PlusIcon,
  CheckIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserGroupIcon,
  PresentationChartLineIcon,
  ArrowPathIcon,
  TruckIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/vue/24/outline'

// Props
interface Props {
  interactionId: string
}

const props = defineProps<Props>()

// Router and store
const router = useRouter()
const interactionStore = useInteractionStore()

// Local state
const showDeleteModal = ref(false)

// Computed properties
const interaction = computed(() => interactionStore.selectedInteraction)
const loading = computed(() => interactionStore.loading)
const error = computed(() => interactionStore.error)

const daysUntilFollowUp = computed(() => {
  if (!interaction.value?.follow_up_date) return null
  
  const followUpDate = new Date(interaction.value.follow_up_date)
  const today = new Date()
  const diffTime = followUpDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
})

const isFollowUpOverdue = computed(() => {
  return daysUntilFollowUp.value !== null && daysUntilFollowUp.value < 0
})

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

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

// Event handlers
const confirmDelete = () => {
  showDeleteModal.value = true
}

const deleteInteraction = async () => {
  const success = await interactionStore.deleteInteraction(props.interactionId)
  if (success) {
    router.push('/interactions')
  }
  showDeleteModal.value = false
}

const markAsCompleted = () => {
  router.push(`/interactions/${props.interactionId}/edit?step=3&status=completed`)
}

const scheduleFollowUp = () => {
  router.push(`/interactions/${props.interactionId}/edit?step=3&follow_up=true`)
}

const markFollowUpComplete = async () => {
  if (!interaction.value) return
  
  const success = await interactionStore.updateInteraction(props.interactionId, {
    follow_up_required: false,
    follow_up_date: null,
    follow_up_notes: null,
    next_action: null
  })
  
  if (success) {
    // Refresh the interaction data
    await interactionStore.fetchInteractionById(props.interactionId)
  }
}

const rescheduleFollowUp = () => {
  router.push(`/interactions/${props.interactionId}/edit?step=3&reschedule=true`)
}

// Load interaction data
onMounted(async () => {
  await interactionStore.fetchInteractionById(props.interactionId)
})
</script>

<style scoped>
/* Component-specific styles */
</style>