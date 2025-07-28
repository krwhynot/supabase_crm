<template>
  <div class="h-full flex flex-col">
    <!-- Widget Header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200">
      <div class="flex items-center">
        <BoltIcon class="h-5 w-5 text-yellow-600 mr-2" />
        <h3 class="text-lg font-semibold text-gray-900">Quick Actions</h3>
      </div>
      <div class="flex items-center space-x-2">
        <!-- Menu Button -->
        <button
          class="p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          aria-label="Widget options"
        >
          <EllipsisVerticalIcon class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Widget Content -->
    <div class="flex-1 p-4">
      <!-- Primary Actions -->
      <div class="space-y-3">
        <h4 class="text-sm font-medium text-gray-700">Primary Actions</h4>
        
        <div class="grid grid-cols-1 gap-2">
          <!-- Add New Contact -->
          <button
            @click="addNewContact"
            class="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors duration-150 group"
          >
            <div class="flex items-center">
              <div class="p-2 bg-blue-500 rounded-lg">
                <UserPlusIcon class="h-4 w-4 text-white" />
              </div>
              <div class="ml-3 text-left">
                <p class="text-sm font-medium text-blue-900">Add Contact</p>
                <p class="text-xs text-blue-600">Create new contact record</p>
              </div>
            </div>
            <ChevronRightIcon class="h-4 w-4 text-blue-500 group-hover:text-blue-700 transition-colors duration-150" />
          </button>

          <!-- New Organization -->
          <button
            @click="addNewOrganization"
            class="flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors duration-150 group"
          >
            <div class="flex items-center">
              <div class="p-2 bg-purple-500 rounded-lg">
                <BuildingOfficeIcon class="h-4 w-4 text-white" />
              </div>
              <div class="ml-3 text-left">
                <p class="text-sm font-medium text-purple-900">Add Organization</p>
                <p class="text-xs text-purple-600">Create new organization</p>
              </div>
            </div>
            <ChevronRightIcon class="h-4 w-4 text-purple-500 group-hover:text-purple-700 transition-colors duration-150" />
          </button>

          <!-- Import Contacts -->
          <button
            @click="importContacts"
            class="flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors duration-150 group"
          >
            <div class="flex items-center">
              <div class="p-2 bg-green-500 rounded-lg">
                <ArrowUpTrayIcon class="h-4 w-4 text-white" />
              </div>
              <div class="ml-3 text-left">
                <p class="text-sm font-medium text-green-900">Import Contacts</p>
                <p class="text-xs text-green-600">Bulk import from CSV</p>
              </div>
            </div>
            <ChevronRightIcon class="h-4 w-4 text-green-500 group-hover:text-green-700 transition-colors duration-150" />
          </button>
        </div>
      </div>

      <!-- Recent Actions -->
      <div class="mt-6 space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-medium text-gray-700">Recent Actions</h4>
          <button
            @click="clearRecentActions"
            class="text-xs text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            Clear
          </button>
        </div>

        <!-- Recent Actions List -->
        <div class="space-y-2">
          <div
            v-for="action in recentActions"
            :key="action.id"
            class="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
            @click="repeatAction(action)"
          >
            <div class="flex items-center flex-1 min-w-0">
              <div class="flex-shrink-0">
                <component 
                  :is="getActionIcon(action.type)" 
                  class="h-4 w-4 text-gray-500"
                />
              </div>
              <div class="ml-3 flex-1 min-w-0">
                <p class="text-sm text-gray-900 truncate">{{ action.title }}</p>
                <p class="text-xs text-gray-500">{{ formatActionTime(action.timestamp) }}</p>
              </div>
            </div>
            <button
              @click.stop="removeRecentAction(action.id)"
              class="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 focus:outline-none rounded"
              aria-label="Remove action"
            >
              <XMarkIcon class="h-3 w-3" />
            </button>
          </div>

          <!-- Empty State -->
          <div
            v-if="recentActions.length === 0"
            class="text-center py-4"
          >
            <ClockIcon class="h-8 w-8 text-gray-300 mx-auto" />
            <p class="mt-2 text-xs text-gray-500">No recent actions</p>
          </div>
        </div>
      </div>

      <!-- Shortcuts -->
      <div class="mt-6 space-y-3">
        <h4 class="text-sm font-medium text-gray-700">Shortcuts</h4>
        
        <div class="grid grid-cols-2 gap-2">
          <!-- Search -->
          <button
            @click="openSearch"
            class="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-150"
          >
            <MagnifyingGlassIcon class="h-5 w-5 text-gray-600 mb-1" />
            <span class="text-xs text-gray-700">Search</span>
          </button>

          <!-- Reports -->
          <button
            @click="openReports"
            class="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-150"
          >
            <DocumentChartBarIcon class="h-5 w-5 text-gray-600 mb-1" />
            <span class="text-xs text-gray-700">Reports</span>
          </button>

          <!-- Export -->
          <button
            @click="openExport"
            class="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-150"
          >
            <ArrowDownTrayIcon class="h-5 w-5 text-gray-600 mb-1" />
            <span class="text-xs text-gray-700">Export</span>
          </button>

          <!-- Settings -->
          <button
            @click="openSettings"
            class="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-150"
          >
            <Cog6ToothIcon class="h-5 w-5 text-gray-600 mb-1" />
            <span class="text-xs text-gray-700">Settings</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Demo Mode Notice -->
    <div
      v-if="isDemoMode"
      class="p-3 bg-blue-50 border-t border-blue-100"
    >
      <p class="text-xs text-blue-600 text-center">
        ⚡ Quick actions are simulated in demo mode
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  BoltIcon,
  UserPlusIcon,
  BuildingOfficeIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
  ChevronRightIcon,
  ClockIcon,
  XMarkIcon,
  EllipsisVerticalIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  DocumentIcon
} from '@heroicons/vue/24/outline'

// Composables
import { useDashboardStore } from '@/stores/dashboardStore'

// Dashboard store
const dashboardStore = useDashboardStore()
const { isDemoMode } = dashboardStore

// Types
interface RecentAction {
  id: string
  type: 'contact' | 'organization' | 'call' | 'email' | 'meeting' | 'note'
  title: string
  timestamp: Date
  data?: any
}

// Local state
const recentActions = ref<RecentAction[]>([])

// Demo data
const demoRecentActions: RecentAction[] = [
  {
    id: '1',
    type: 'contact',
    title: 'Added John Smith to TechCorp',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    data: { contactId: 'c1', organizationId: 'o1' }
  },
  {
    id: '2',
    type: 'call',
    title: 'Called Sarah Johnson',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    data: { contactId: 'c2', duration: 1800 }
  },
  {
    id: '3',
    type: 'meeting',
    title: 'Scheduled meeting with Finance Team',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    data: { meetingId: 'm1', organizationId: 'o2' }
  },
  {
    id: '4',
    type: 'email',
    title: 'Sent proposal to Global Healthcare',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    data: { emailId: 'e1', organizationId: 'o3' }
  }
]

// Methods
const getActionIcon = (type: RecentAction['type']) => {
  const icons = {
    'contact': UserPlusIcon,
    'organization': BuildingOfficeIcon,
    'call': PhoneIcon,
    'email': EnvelopeIcon,
    'meeting': CalendarIcon,
    'note': DocumentIcon
  }
  return icons[type] || DocumentIcon
}

const formatActionTime = (timestamp: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - timestamp.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return timestamp.toLocaleDateString()
}

const addRecentAction = (action: Omit<RecentAction, 'id' | 'timestamp'>) => {
  const newAction: RecentAction = {
    id: Date.now().toString(),
    timestamp: new Date(),
    ...action
  }
  
  recentActions.value.unshift(newAction)
  
  // Keep only the last 10 actions
  if (recentActions.value.length > 10) {
    recentActions.value = recentActions.value.slice(0, 10)
  }
  
  // Save to localStorage
  localStorage.setItem('crm_recent_actions', JSON.stringify(recentActions.value))
}

const removeRecentAction = (actionId: string) => {
  recentActions.value = recentActions.value.filter(action => action.id !== actionId)
  localStorage.setItem('crm_recent_actions', JSON.stringify(recentActions.value))
}

const clearRecentActions = () => {
  recentActions.value = []
  localStorage.removeItem('crm_recent_actions')
}

const repeatAction = (action: RecentAction) => {
  // TODO: Implement action repetition based on type
  console.log('Repeating action:', action.title)
  
  if (isDemoMode) {
    alert(`Demo: Would repeat action "${action.title}"`)
  }
}

// Primary Action Handlers
const addNewContact = () => {
  if (isDemoMode) {
    addRecentAction({
      type: 'contact',
      title: 'Added new contact (Demo)',
      data: { demo: true }
    })
    alert('Demo: Would open new contact form')
  } else {
    // TODO: Navigate to new contact form
    console.log('Opening new contact form')
  }
}

const addNewOrganization = () => {
  if (isDemoMode) {
    addRecentAction({
      type: 'organization',
      title: 'Added new organization (Demo)',
      data: { demo: true }
    })
    alert('Demo: Would open new organization form')
  } else {
    // TODO: Navigate to new organization form
    console.log('Opening new organization form')
  }
}

const importContacts = () => {
  if (isDemoMode) {
    alert('Demo: Would open contact import dialog')
  } else {
    // TODO: Open import dialog
    console.log('Opening import contacts dialog')
  }
}

// Shortcut Handlers
const openSearch = () => {
  if (isDemoMode) {
    alert('Demo: Would open search interface')
  } else {
    // TODO: Open search modal or navigate to search page
    console.log('Opening search')
  }
}

const openReports = () => {
  if (isDemoMode) {
    alert('Demo: Would navigate to reports page')
  } else {
    // TODO: Navigate to reports
    console.log('Opening reports')
  }
}

const openExport = () => {
  if (isDemoMode) {
    alert('Demo: Would open export dialog')
  } else {
    // TODO: Open export dialog
    console.log('Opening export dialog')
  }
}

const openSettings = () => {
  if (isDemoMode) {
    alert('Demo: Would open settings page')
  } else {
    // TODO: Open settings
    console.log('Opening settings')
  }
}

// Lifecycle
onMounted(() => {
  // Load recent actions from localStorage
  const saved = localStorage.getItem('crm_recent_actions')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      recentActions.value = parsed.map((action: any) => ({
        ...action,
        timestamp: new Date(action.timestamp)
      }))
    } catch (error) {
      console.warn('Failed to parse saved recent actions:', error)
    }
  }
  
  // Add demo data if in demo mode and no saved actions
  if (isDemoMode && recentActions.value.length === 0) {
    recentActions.value = demoRecentActions
  }
})
</script>

<style scoped>
/* Enhanced hover effects */
button:hover {
  transition: all 0.15s ease-in-out;
}

/* Focus styles for accessibility */
button:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

button:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Smooth transitions */
.transition-colors {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* Group hover effects */
.group:hover .group-hover\:text-blue-700 {
  color: #1d4ed8;
}

.group:hover .group-hover\:text-purple-700 {
  color: #6b21a8;
}

.group:hover .group-hover\:text-green-700 {
  color: #047857;
}

/* Action button gradient effects */
.bg-blue-50:hover,
.bg-purple-50:hover,
.bg-green-50:hover {
  background-image: linear-gradient(to right, var(--tw-gradient-stops));
}
</style>