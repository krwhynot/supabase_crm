<template>
  <div class="bg-white shadow-sm rounded-lg border border-gray-200">
    <!-- Timeline Header -->
    <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
      <div>
        <h3 class="text-lg font-medium text-gray-900">Interaction Timeline</h3>
        <p class="mt-1 text-sm text-gray-500">Communication history and engagement tracking</p>
      </div>
      
      <button
        @click="showAddForm = !showAddForm"
        class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <PlusIcon class="h-4 w-4 mr-2" />
        Add Interaction
      </button>
    </div>

    <!-- Add Interaction Form -->
    <div v-if="showAddForm" class="px-6 py-4 border-b border-gray-200 bg-gray-50">
      <form @submit.prevent="addInteraction" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Interaction Type -->
          <div>
            <label for="interaction-type" class="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <select
              id="interaction-type"
              v-model="newInteraction.type"
              required
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">Select type</option>
              <option value="email">Email</option>
              <option value="phone">Phone Call</option>
              <option value="meeting">Meeting</option>
              <option value="note">Note</option>
              <option value="task">Task</option>
              <option value="demo">Demo</option>
              <option value="proposal">Proposal</option>
            </select>
          </div>

          <!-- Communication Channel -->
          <div>
            <label for="channel" class="block text-sm font-medium text-gray-700 mb-1">
              Channel
            </label>
            <select
              id="channel"
              v-model="newInteraction.channel"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">Select channel</option>
              <option value="direct">Direct</option>
              <option value="linkedin">LinkedIn</option>
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="cold_outreach">Cold Outreach</option>
              <option value="event">Event</option>
              <option value="social_media">Social Media</option>
            </select>
          </div>
        </div>

        <!-- Subject/Title -->
        <div>
          <label for="subject" class="block text-sm font-medium text-gray-700 mb-1">
            Subject *
          </label>
          <input
            id="subject"
            v-model="newInteraction.subject"
            type="text"
            required
            class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Enter interaction subject"
          >
        </div>

        <!-- Notes/Description -->
        <div>
          <label for="notes" class="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            v-model="newInteraction.notes"
            rows="3"
            class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Add detailed notes about this interaction"
          />
        </div>

        <!-- Form Actions -->
        <div class="flex items-center justify-end space-x-3">
          <button
            type="button"
            @click="cancelAdd"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div v-if="isSubmitting" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {{ isSubmitting ? 'Adding...' : 'Add Interaction' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Timeline Content -->
    <div class="px-6 py-6">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-8">
        <div class="inline-flex items-center">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
          <span class="text-gray-600">Loading interactions...</span>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-8">
        <div class="text-red-600 mb-4">
          <ExclamationTriangleIcon class="h-8 w-8 mx-auto" />
        </div>
        <h4 class="text-lg font-medium text-gray-900 mb-2">Error Loading Interactions</h4>
        <p class="text-gray-600 mb-4">{{ error }}</p>
        <button
          @click="loadInteractions"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
        >
          <ArrowPathIcon class="h-4 w-4 mr-2" />
          Try Again
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="interactions.length === 0" class="text-center py-8">
        <ChatBubbleLeftEllipsisIcon class="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h4 class="text-lg font-medium text-gray-900 mb-2">No interactions yet</h4>
        <p class="text-gray-600 mb-4">Start tracking communication with this organization.</p>
        <button
          @click="showAddForm = true"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon class="h-4 w-4 mr-2" />
          Add First Interaction
        </button>
      </div>

      <!-- Timeline Items -->
      <div v-else class="flow-root">
        <ul class="-mb-8">
          <li
            v-for="(interaction, index) in interactions"
            :key="interaction.id"
            class="relative pb-8"
          >
            <!-- Timeline connector -->
            <div
              v-if="index !== interactions.length - 1"
              class="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
              aria-hidden="true"
            />

            <!-- Timeline item -->
            <div class="relative flex items-start space-x-3">
              <!-- Icon -->
              <div class="relative">
                <div
                  :class="[
                    'h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white',
                    getTypeColor(interaction.type)
                  ]"
                >
                  <component :is="getTypeIcon(interaction.type)" class="h-5 w-5 text-white" />
                </div>
              </div>

              <!-- Content -->
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-sm">
                      <span class="font-medium text-gray-900">{{ interaction.subject }}</span>
                    </div>
                    <div class="mt-1 flex items-center space-x-2 text-sm text-gray-500">
                      <span class="capitalize">{{ interaction.type }}</span>
                      <span v-if="interaction.channel" class="capitalize">• {{ interaction.channel }}</span>
                      <span>• {{ formatDate(interaction.created_at) }}</span>
                    </div>
                  </div>
                  
                  <!-- Actions -->
                  <div class="flex items-center space-x-2">
                    <button
                      @click="editInteraction(interaction)"
                      class="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                      :aria-label="`Edit interaction: ${interaction.subject}`"
                    >
                      <PencilIcon class="h-4 w-4" />
                    </button>
                    <button
                      @click="deleteInteraction(interaction.id)"
                      class="p-1 text-red-400 hover:text-red-600 rounded-md hover:bg-red-50"
                      :aria-label="`Delete interaction: ${interaction.subject}`"
                    >
                      <TrashIcon class="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <!-- Notes -->
                <div v-if="interaction.notes" class="mt-2 text-sm text-gray-700">
                  <p class="whitespace-pre-wrap">{{ interaction.notes }}</p>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  PlusIcon,
  ChatBubbleLeftEllipsisIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  PlayIcon,
  PresentationChartLineIcon
} from '@heroicons/vue/24/outline'

/**
 * Interaction Timeline Component
 * Displays and manages communication history for an organization
 */

interface Props {
  organizationId: string
}

interface Interaction {
  id: string
  organization_id: string
  type: 'email' | 'phone' | 'meeting' | 'note' | 'task' | 'demo' | 'proposal'
  channel?: 'direct' | 'linkedin' | 'website' | 'referral' | 'cold_outreach' | 'event' | 'social_media' | null
  subject: string
  notes?: string | null
  created_at: string
  updated_at: string
}

interface NewInteractionData {
  type: string
  channel: string
  subject: string
  notes: string
}

const props = defineProps<Props>()

// State
const loading = ref(false)
const error = ref<string | null>(null)
const isSubmitting = ref(false)
const showAddForm = ref(false)
const interactions = ref<Interaction[]>([])

// Form data
const newInteraction = reactive<NewInteractionData>({
  type: '',
  channel: '',
  subject: '',
  notes: ''
})

// Methods
const loadInteractions = async () => {
  loading.value = true
  error.value = null
  
  try {
    // In a real implementation, this would call an API
    // For now, we'll simulate with empty data
    interactions.value = []
  } catch (err) {
    console.error('Error loading interactions:', err)
    error.value = 'Failed to load interactions. Please try again.'
  } finally {
    loading.value = false
  }
}

const addInteraction = async () => {
  isSubmitting.value = true
  
  try {
    // In a real implementation, this would call an API
    const mockInteraction: Interaction = {
      id: `interaction_${Date.now()}`,
      organization_id: props.organizationId,
      type: newInteraction.type as any,
      channel: newInteraction.channel as any || null,
      subject: newInteraction.subject,
      notes: newInteraction.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    interactions.value.unshift(mockInteraction)
    
    // Reset form
    Object.assign(newInteraction, {
      type: '',
      channel: '',
      subject: '',
      notes: ''
    })
    
    showAddForm.value = false
  } catch (err) {
    console.error('Error adding interaction:', err)
    alert('Failed to add interaction. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

const cancelAdd = () => {
  // Reset form
  Object.assign(newInteraction, {
    type: '',
    channel: '',
    subject: '',
    notes: ''
  })
  
  showAddForm.value = false
}

const editInteraction = (interaction: Interaction) => {
  // In a real implementation, this would open an edit modal or form
  console.log('Edit interaction:', interaction)
  alert('Edit functionality would be implemented here')
}

const deleteInteraction = async (id: string) => {
  const interaction = interactions.value.find(i => i.id === id)
  if (!interaction) return

  if (confirm(`Are you sure you want to delete this interaction: "${interaction.subject}"?`)) {
    try {
      // In a real implementation, this would call an API
      interactions.value = interactions.value.filter(i => i.id !== id)
    } catch (err) {
      console.error('Error deleting interaction:', err)
      alert('Failed to delete interaction. Please try again.')
    }
  }
}

const getTypeColor = (type: string): string => {
  const colors = {
    email: 'bg-blue-500',
    phone: 'bg-green-500',
    meeting: 'bg-purple-500',
    note: 'bg-gray-500',
    task: 'bg-orange-500',
    demo: 'bg-indigo-500',
    proposal: 'bg-red-500'
  }
  return colors[type as keyof typeof colors] || colors.note
}

const getTypeIcon = (type: string) => {
  const icons = {
    email: EnvelopeIcon,
    phone: PhoneIcon,
    meeting: CalendarDaysIcon,
    note: DocumentTextIcon,
    task: CheckCircleIcon,
    demo: PlayIcon,
    proposal: PresentationChartLineIcon
  }
  return icons[type as keyof typeof icons] || DocumentTextIcon
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
}

// Lifecycle
onMounted(() => {
  loadInteractions()
})
</script>