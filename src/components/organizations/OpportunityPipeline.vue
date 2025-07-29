<template>
  <div class="bg-white shadow-sm rounded-lg border border-gray-200">
    <!-- Pipeline Header -->
    <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
      <div>
        <h3 class="text-lg font-medium text-gray-900">Opportunity Pipeline</h3>
        <p class="mt-1 text-sm text-gray-500">Track deals and sales opportunities for this organization</p>
      </div>
      
      <div class="flex items-center space-x-3">
        <!-- View Toggle -->
        <div class="flex items-center border border-gray-300 rounded-md">
          <button
            @click="viewMode = 'kanban'"
            :class="[
              'px-3 py-2 text-sm font-medium rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500',
              viewMode === 'kanban' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            ]"
          >
            Kanban
          </button>
          <button
            @click="viewMode = 'list'"
            :class="[
              'px-3 py-2 text-sm font-medium rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500',
              viewMode === 'list' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            ]"
          >
            List
          </button>
        </div>
        
        <!-- Add Opportunity Button -->
        <button
          @click="showAddForm = !showAddForm"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon class="h-4 w-4 mr-2" />
          Add Opportunity
        </button>
      </div>
    </div>

    <!-- Add Opportunity Form -->
    <div v-if="showAddForm" class="px-6 py-4 border-b border-gray-200 bg-gray-50">
      <form @submit.prevent="addOpportunity" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Opportunity Name -->
          <div>
            <label for="opportunity-name" class="block text-sm font-medium text-gray-700 mb-1">
              Opportunity Name *
            </label>
            <input
              id="opportunity-name"
              v-model="newOpportunity.name"
              type="text"
              required
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Enter opportunity name"
            >
          </div>

          <!-- Stage -->
          <div>
            <label for="stage" class="block text-sm font-medium text-gray-700 mb-1">
              Stage *
            </label>
            <select
              id="stage"
              v-model="newOpportunity.stage"
              required
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">Select stage</option>
              <option v-for="stage in pipelineStages" :key="stage.id" :value="stage.id">
                {{ stage.name }}
              </option>
            </select>
          </div>

          <!-- Value -->
          <div>
            <label for="value" class="block text-sm font-medium text-gray-700 mb-1">
              Value ($)
            </label>
            <input
              id="value"
              v-model.number="newOpportunity.value"
              type="number"
              min="0"
              step="0.01"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="0.00"
            >
          </div>

          <!-- Close Date -->
          <div>
            <label for="close-date" class="block text-sm font-medium text-gray-700 mb-1">
              Expected Close Date
            </label>
            <input
              id="close-date"
              v-model="newOpportunity.close_date"
              type="date"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
          </div>
        </div>

        <!-- Description -->
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            v-model="newOpportunity.description"
            rows="2"
            class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Brief description of the opportunity"
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
            {{ isSubmitting ? 'Adding...' : 'Add Opportunity' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Pipeline Content -->
    <div class="px-6 py-6">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-8">
        <div class="inline-flex items-center">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
          <span class="text-gray-600">Loading opportunities...</span>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-8">
        <div class="text-red-600 mb-4">
          <ExclamationTriangleIcon class="h-8 w-8 mx-auto" />
        </div>
        <h4 class="text-lg font-medium text-gray-900 mb-2">Error Loading Opportunities</h4>
        <p class="text-gray-600 mb-4">{{ error }}</p>
        <button
          @click="loadOpportunities"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
        >
          <ArrowPathIcon class="h-4 w-4 mr-2" />
          Try Again
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="opportunities.length === 0" class="text-center py-8">
        <CurrencyDollarIcon class="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h4 class="text-lg font-medium text-gray-900 mb-2">No opportunities yet</h4>
        <p class="text-gray-600 mb-4">Create your first sales opportunity for this organization.</p>
        <button
          @click="showAddForm = true"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon class="h-4 w-4 mr-2" />
          Create First Opportunity
        </button>
      </div>

      <!-- Kanban View -->
      <div v-else-if="viewMode === 'kanban'" class="space-y-6">
        <!-- Pipeline Summary -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-2xl font-bold text-gray-900">{{ opportunities.length }}</div>
            <div class="text-sm text-gray-600">Total Opportunities</div>
          </div>
          <div class="bg-blue-50 rounded-lg p-4">
            <div class="text-2xl font-bold text-blue-600">${{ totalPipelineValue.toLocaleString() }}</div>
            <div class="text-sm text-gray-600">Pipeline Value</div>
          </div>
          <div class="bg-green-50 rounded-lg p-4">
            <div class="text-2xl font-bold text-green-600">${{ wonValue.toLocaleString() }}</div>
            <div class="text-sm text-gray-600">Won Value</div>
          </div>
          <div class="bg-yellow-50 rounded-lg p-4">
            <div class="text-2xl font-bold text-yellow-600">{{ Math.round(winRate) }}%</div>
            <div class="text-sm text-gray-600">Win Rate</div>
          </div>
        </div>

        <!-- Kanban Board -->
        <div class="flex space-x-6 overflow-x-auto pb-4">
          <div
            v-for="stage in pipelineStages"
            :key="stage.id"
            class="flex-shrink-0 w-80"
          >
            <!-- Stage Header -->
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center space-x-2">
                <div
                  class="w-3 h-3 rounded-full"
                  :style="{ backgroundColor: stage.color }"
                />
                <h4 class="font-medium text-gray-900">{{ stage.name }}</h4>
                <span class="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {{ getOpportunitiesByStage(stage.id).length }}
                </span>
              </div>
              <div class="text-sm text-gray-500">
                ${{ getStageValue(stage.id).toLocaleString() }}
              </div>
            </div>

            <!-- Stage Cards -->
            <div class="space-y-3">
              <div
                v-for="opportunity in getOpportunitiesByStage(stage.id)"
                :key="opportunity.id"
                class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                @click="editOpportunity(opportunity)"
              >
                <div class="flex items-start justify-between mb-2">
                  <h5 class="font-medium text-gray-900 text-sm">{{ opportunity.name }}</h5>
                  <button
                    @click.stop="deleteOpportunity(opportunity.id)"
                    class="p-1 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                  >
                    <TrashIcon class="h-4 w-4" />
                  </button>
                </div>
                
                <div class="text-lg font-bold text-gray-900 mb-2">
                  ${{ opportunity.value?.toLocaleString() || '0' }}
                </div>
                
                <div v-if="opportunity.close_date" class="text-sm text-gray-500 mb-2">
                  <CalendarDaysIcon class="h-4 w-4 inline mr-1" />
                  {{ formatDate(opportunity.close_date) }}
                </div>
                
                <div v-if="opportunity.description" class="text-sm text-gray-600 line-clamp-2">
                  {{ opportunity.description }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div v-else class="space-y-4">
        <!-- Pipeline Summary -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-2xl font-bold text-gray-900">{{ opportunities.length }}</div>
            <div class="text-sm text-gray-600">Total Opportunities</div>
          </div>
          <div class="bg-blue-50 rounded-lg p-4">
            <div class="text-2xl font-bold text-blue-600">${{ totalPipelineValue.toLocaleString() }}</div>
            <div class="text-sm text-gray-600">Pipeline Value</div>
          </div>
          <div class="bg-green-50 rounded-lg p-4">
            <div class="text-2xl font-bold text-green-600">${{ wonValue.toLocaleString() }}</div>
            <div class="text-sm text-gray-600">Won Value</div>
          </div>
          <div class="bg-yellow-50 rounded-lg p-4">
            <div class="text-2xl font-bold text-yellow-600">{{ Math.round(winRate) }}%</div>
            <div class="text-sm text-gray-600">Win Rate</div>
          </div>
        </div>

        <!-- List Table -->
        <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table class="min-w-full divide-y divide-gray-300">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Opportunity
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Stage
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Value
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Close Date
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="opportunity in opportunities"
                :key="opportunity.id"
                class="hover:bg-gray-50"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div class="text-sm font-medium text-gray-900">{{ opportunity.name }}</div>
                    <div v-if="opportunity.description" class="text-sm text-gray-500 truncate max-w-xs">
                      {{ opportunity.description }}
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :style="{
                      backgroundColor: getStageById(opportunity.stage)?.color + '20',
                      color: getStageById(opportunity.stage)?.color
                    }"
                  >
                    {{ getStageById(opportunity.stage)?.name }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ${{ opportunity.value?.toLocaleString() || '0' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ opportunity.close_date ? formatDate(opportunity.close_date) : '-' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                  <button
                    @click="editOpportunity(opportunity)"
                    class="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  <button
                    @click="deleteOpportunity(opportunity.id)"
                    class="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  PlusIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  TrashIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon
} from '@heroicons/vue/24/outline'

/**
 * Opportunity Pipeline Component
 * Manages sales opportunities and deal stages for an organization
 */

interface Props {
  organizationId: string
}

interface Opportunity {
  id: string
  organization_id: string
  name: string
  description?: string | null
  value?: number | null
  stage: string
  close_date?: string | null
  created_at: string
  updated_at: string
}

interface PipelineStage {
  id: string
  name: string
  color: string
  order: number
}

interface NewOpportunityData {
  name: string
  stage: string
  value?: number
  close_date: string
  description: string
}

const props = defineProps<Props>()

// State
const loading = ref(false)
const error = ref<string | null>(null)
const isSubmitting = ref(false)
const showAddForm = ref(false)
const viewMode = ref<'kanban' | 'list'>('kanban')
const opportunities = ref<Opportunity[]>([])

// Form data
const newOpportunity = reactive<NewOpportunityData>({
  name: '',
  stage: '',
  value: undefined,
  close_date: '',
  description: ''
})

// Pipeline stages
const pipelineStages: PipelineStage[] = [
  { id: 'lead', name: 'Lead', color: '#6B7280', order: 1 },
  { id: 'qualified', name: 'Qualified', color: '#3B82F6', order: 2 },
  { id: 'proposal', name: 'Proposal', color: '#F59E0B', order: 3 },
  { id: 'negotiation', name: 'Negotiation', color: '#EF4444', order: 4 },
  { id: 'won', name: 'Won', color: '#10B981', order: 5 },
  { id: 'lost', name: 'Lost', color: '#6B7280', order: 6 }
]

// Computed
const totalPipelineValue = computed(() => {
  return opportunities.value
    .filter(opp => opp.stage !== 'lost')
    .reduce((sum, opp) => sum + (opp.value || 0), 0)
})

const wonValue = computed(() => {
  return opportunities.value
    .filter(opp => opp.stage === 'won')
    .reduce((sum, opp) => sum + (opp.value || 0), 0)
})

const winRate = computed(() => {
  const closedOpportunities = opportunities.value.filter(opp => 
    opp.stage === 'won' || opp.stage === 'lost'
  )
  if (closedOpportunities.length === 0) return 0
  
  const wonOpportunities = closedOpportunities.filter(opp => opp.stage === 'won')
  return (wonOpportunities.length / closedOpportunities.length) * 100
})

// Methods
const loadOpportunities = async () => {
  loading.value = true
  error.value = null
  
  try {
    // In a real implementation, this would call an API
    // For now, we'll simulate with empty data
    opportunities.value = []
  } catch (err) {
    console.error('Error loading opportunities:', err)
    error.value = 'Failed to load opportunities. Please try again.'
  } finally {
    loading.value = false
  }
}

const addOpportunity = async () => {
  isSubmitting.value = true
  
  try {
    // In a real implementation, this would call an API
    const mockOpportunity: Opportunity = {
      id: `opp_${Date.now()}`,
      organization_id: props.organizationId,
      name: newOpportunity.name,
      description: newOpportunity.description || null,
      value: newOpportunity.value || null,
      stage: newOpportunity.stage,
      close_date: newOpportunity.close_date || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    opportunities.value.push(mockOpportunity)
    
    // Reset form
    Object.assign(newOpportunity, {
      name: '',
      stage: '',
      value: undefined,
      close_date: '',
      description: ''
    })
    
    showAddForm.value = false
  } catch (err) {
    console.error('Error adding opportunity:', err)
    alert('Failed to add opportunity. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

const cancelAdd = () => {
  // Reset form
  Object.assign(newOpportunity, {
    name: '',
    stage: '',
    value: undefined,
    close_date: '',
    description: ''
  })
  
  showAddForm.value = false
}

const editOpportunity = (opportunity: Opportunity) => {
  // In a real implementation, this would open an edit modal or form
  console.log('Edit opportunity:', opportunity)
  alert('Edit functionality would be implemented here')
}

const deleteOpportunity = async (id: string) => {
  const opportunity = opportunities.value.find(opp => opp.id === id)
  if (!opportunity) return

  if (confirm(`Are you sure you want to delete the opportunity "${opportunity.name}"?`)) {
    try {
      // In a real implementation, this would call an API
      opportunities.value = opportunities.value.filter(opp => opp.id !== id)
    } catch (err) {
      console.error('Error deleting opportunity:', err)
      alert('Failed to delete opportunity. Please try again.')
    }
  }
}

const getOpportunitiesByStage = (stageId: string): Opportunity[] => {
  return opportunities.value.filter(opp => opp.stage === stageId)
}

const getStageValue = (stageId: string): number => {
  return getOpportunitiesByStage(stageId).reduce((sum, opp) => sum + (opp.value || 0), 0)
}

const getStageById = (stageId: string): PipelineStage | undefined => {
  return pipelineStages.find(stage => stage.id === stageId)
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Lifecycle
onMounted(() => {
  loadOpportunities()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>