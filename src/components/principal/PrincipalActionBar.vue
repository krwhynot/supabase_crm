<!--
  Principal Action Bar - Context-aware action buttons for principal management
  Features: Dynamic actions, permission-based visibility, keyboard shortcuts
-->
<template>
  <div class="principal-action-bar flex items-center space-x-3">
    <!-- Primary Actions -->
    <div class="flex items-center space-x-2">
      <!-- Create Opportunity -->
      <button
        v-if="canCreateOpportunity"
        @click="handleCreateOpportunity"
        :disabled="!selectedPrincipal"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        <PlusIcon class="h-4 w-4 mr-2" />
        Create Opportunity
      </button>

      <!-- Log Interaction -->
      <button
        v-if="canLogInteraction"
        @click="handleLogInteraction"
        :disabled="!selectedPrincipal"
        class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        <ChatBubbleLeftIcon class="h-4 w-4 mr-2" />
        Log Interaction
      </button>
    </div>

    <!-- Secondary Actions Dropdown -->
    <div class="relative" ref="dropdownRef">
      <button
        @click="showDropdown = !showDropdown"
        :disabled="!selectedPrincipal"
        class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        <EllipsisHorizontalIcon class="h-4 w-4" />
        <span class="sr-only">More actions</span>
      </button>

      <!-- Dropdown Menu -->
      <Transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div
          v-show="showDropdown"
          class="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
        >
          <div class="py-1">
            <!-- Manage Products -->
            <button
              v-if="canManageProducts"
              @click="handleManageProducts"
              class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
            >
              <CubeIcon class="h-4 w-4 mr-3" />
              Manage Products
            </button>

            <!-- Schedule Follow-up -->
            <button
              v-if="canScheduleFollowUp"
              @click="handleScheduleFollowUp"
              class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
            >
              <CalendarIcon class="h-4 w-4 mr-3" />
              Schedule Follow-up
            </button>

            <!-- View Analytics -->
            <button
              @click="handleViewAnalytics"
              class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
            >
              <ChartBarIcon class="h-4 w-4 mr-3" />
              View Analytics
            </button>

            <!-- Export Data -->
            <button
              v-if="canExportData"
              @click="handleExportData"
              class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
            >
              <ArrowDownTrayIcon class="h-4 w-4 mr-3" />
              Export Data
            </button>

            <div class="border-t border-gray-100 my-1"></div>

            <!-- Refresh Data -->
            <button
              @click="handleRefresh"
              :disabled="refreshing"
              class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            >
              <ArrowPathIcon 
                class="h-4 w-4 mr-3" 
                :class="{ 'animate-spin': refreshing }"
              />
              {{ refreshing ? 'Refreshing...' : 'Refresh Data' }}
            </button>

            <!-- Principal Settings -->
            <button
              v-if="canManageSettings"
              @click="handlePrincipalSettings"
              class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
            >
              <Cog6ToothIcon class="h-4 w-4 mr-3" />
              Principal Settings
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Status Indicator -->
    <div v-if="selectedPrincipal" class="flex items-center space-x-2 text-sm text-gray-600">
      <div class="flex items-center">
        <div 
          class="w-2 h-2 rounded-full mr-1"
          :class="getStatusIndicatorColor()"
        ></div>
        <span>{{ getStatusText() }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  PlusIcon,
  ChatBubbleLeftIcon,
  EllipsisHorizontalIcon,
  CubeIcon,
  CalendarIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  Cog6ToothIcon
} from '@heroicons/vue/24/outline'
import type { PrincipalActivitySummary } from '@/services/principalActivityApi'

// ===============================
// COMPONENT INTERFACE
// ===============================

interface Props {
  selectedPrincipal?: PrincipalActivitySummary | null
  permissions?: {
    canCreateOpportunity?: boolean
    canLogInteraction?: boolean
    canManageProducts?: boolean
    canScheduleFollowUp?: boolean
    canExportData?: boolean
    canManageSettings?: boolean
  }
  loading?: boolean
}

interface Emits {
  (e: 'create-opportunity'): void
  (e: 'log-interaction'): void
  (e: 'manage-products'): void
  (e: 'schedule-follow-up'): void
  (e: 'view-analytics'): void
  (e: 'export-data'): void
  (e: 'refresh'): void
  (e: 'principal-settings'): void
}

const props = withDefaults(defineProps<Props>(), {
  selectedPrincipal: null,
  permissions: () => ({
    canCreateOpportunity: true,
    canLogInteraction: true,
    canManageProducts: true,
    canScheduleFollowUp: true,
    canExportData: true,
    canManageSettings: false
  }),
  loading: false
})

const emit = defineEmits<Emits>()

// ===============================
// REACTIVE STATE
// ===============================

const showDropdown = ref(false)
const dropdownRef = ref<HTMLElement>()
const refreshing = ref(false)

// ===============================
// COMPUTED PROPERTIES
// ===============================

const canCreateOpportunity = computed(() => 
  props.permissions?.canCreateOpportunity !== false
)

const canLogInteraction = computed(() => 
  props.permissions?.canLogInteraction !== false
)

const canManageProducts = computed(() => 
  props.permissions?.canManageProducts !== false
)

const canScheduleFollowUp = computed(() => 
  props.permissions?.canScheduleFollowUp !== false
)

const canExportData = computed(() => 
  props.permissions?.canExportData !== false
)

const canManageSettings = computed(() => 
  props.permissions?.canManageSettings === true
)

// ===============================
// STATUS HELPERS
// ===============================

const getStatusIndicatorColor = (): string => {
  if (!props.selectedPrincipal) return 'bg-gray-400'
  
  const status = props.selectedPrincipal.activity_status
  const statusColorMap: Record<string, string> = {
    'ACTIVE': 'bg-green-400',
    'MODERATE': 'bg-yellow-400',
    'LOW': 'bg-orange-400',
    'NO_ACTIVITY': 'bg-gray-400'
  }
  
  return statusColorMap[status] || 'bg-gray-400'
}

const getStatusText = (): string => {
  if (!props.selectedPrincipal) return 'No principal selected'
  
  const engagement = props.selectedPrincipal.engagement_score || 0
  const activities = props.selectedPrincipal.total_interactions || 0
  
  return `${engagement} engagement • ${activities} interactions`
}

// ===============================
// EVENT HANDLERS
// ===============================

const handleCreateOpportunity = () => {
  if (props.selectedPrincipal) {
    emit('create-opportunity')
    showDropdown.value = false
  }
}

const handleLogInteraction = () => {
  if (props.selectedPrincipal) {
    emit('log-interaction')
    showDropdown.value = false
  }
}

const handleManageProducts = () => {
  if (props.selectedPrincipal) {
    emit('manage-products')
    showDropdown.value = false
  }
}

const handleScheduleFollowUp = () => {
  if (props.selectedPrincipal) {
    emit('schedule-follow-up')
    showDropdown.value = false
  }
}

const handleViewAnalytics = () => {
  if (props.selectedPrincipal) {
    emit('view-analytics')
    showDropdown.value = false
  }
}

const handleExportData = () => {
  if (props.selectedPrincipal) {
    emit('export-data')
    showDropdown.value = false
  }
}

const handleRefresh = async () => {
  refreshing.value = true
  emit('refresh')
  
  // Simulate refresh delay
  setTimeout(() => {
    refreshing.value = false
    showDropdown.value = false
  }, 1000)
}

const handlePrincipalSettings = () => {
  if (props.selectedPrincipal) {
    emit('principal-settings')
    showDropdown.value = false
  }
}

// ===============================
// KEYBOARD SHORTCUTS
// ===============================

const handleKeydown = (event: KeyboardEvent) => {
  if (!props.selectedPrincipal) return
  
  // Only handle shortcuts when not in input fields
  if (
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLTextAreaElement ||
    event.target instanceof HTMLSelectElement
  ) {
    return
  }
  
  // Handle keyboard shortcuts
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'o':
        event.preventDefault()
        if (canCreateOpportunity.value) handleCreateOpportunity()
        break
      case 'i':
        event.preventDefault()
        if (canLogInteraction.value) handleLogInteraction()
        break
      case 'r':
        event.preventDefault()
        handleRefresh()
        break
      case 'p':
        event.preventDefault()
        if (canManageProducts.value) handleManageProducts()
        break
    }
  }
  
  // Escape key to close dropdown
  if (event.key === 'Escape') {
    showDropdown.value = false
  }
}

// ===============================
// CLICK OUTSIDE HANDLER
// ===============================

const handleClickOutside = (event: Event) => {
  const target = event.target as Element
  if (dropdownRef.value && !dropdownRef.value.contains(target)) {
    showDropdown.value = false
  }
}

// ===============================
// LIFECYCLE HOOKS
// ===============================

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.principal-action-bar {
  /* Custom styles for action bar */
}

/* Button hover animations */
.principal-action-bar button {
  transition: all 0.2s ease-in-out;
}

.principal-action-bar button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.principal-action-bar button:active:not(:disabled) {
  transform: translateY(0);
}

/* Dropdown animation improvements */
.dropdown-menu {
  backdrop-filter: blur(8px);
  background-color: rgba(255, 255, 255, 0.95);
}

/* Status indicator pulse animation */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.status-indicator.active {
  animation: pulse 2s infinite;
}

/* Keyboard shortcut hints */
.principal-action-bar button[title] {
  position: relative;
}

.principal-action-bar button[title]:hover::after {
  content: attr(title);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 1000;
  margin-bottom: 4px;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .principal-action-bar {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .principal-action-bar .primary-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .principal-action-bar .secondary-actions {
    width: auto;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .principal-action-bar button {
    border-width: 2px;
    font-weight: 600;
  }
  
  .dropdown-menu {
    border-width: 2px;
    background-color: white;
  }
}

/* Print styles */
@media print {
  .principal-action-bar {
    display: none;
  }
}
</style>