<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation Sidebar -->
    <nav
      :class="sidebarClasses"
      data-sidebar
    >
      <div class="flex h-full flex-col">
        <!-- Logo/Brand -->
        <div class="flex h-16 items-center justify-between px-4 border-b border-gray-200">
          <div class="flex items-center">
            <h1 class="text-xl font-bold text-gray-700">
              <span v-if="!isCollapsed || isMobile">CRM Dashboard</span>
              <span v-else class="text-center w-full block">CRM</span>
            </h1>
          </div>
          
          <!-- Sidebar Toggle (Desktop) -->
          <button
            v-if="!isMobile"
            @click="toggle"
            :class="toggleButtonClasses"
            :aria-label="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          >
            <ChevronLeftIcon 
              v-if="!isCollapsed"
              class="h-5 w-5" 
            />
            <ChevronRightIcon 
              v-else
              class="h-5 w-5" 
            />
          </button>
        </div>

        <!-- Navigation Items -->
        <div class="flex-1 overflow-y-auto py-4">
          <ul class="space-y-1 px-3">
            <li>
              <router-link
                to="/"
                :class="getNavItemClasses(isCurrentRoute('/'))"
                class="group"
              >
                <HomeIcon :class="getNavIconClasses(isCurrentRoute('/'))" />
                <span :class="getNavTextClasses()">Dashboard</span>
              </router-link>
            </li>
            
            <li>
              <router-link
                to="/contacts"
                :class="getNavItemClasses(isCurrentRoute('/contacts'))"
                class="group"
              >
                <UsersIcon :class="getNavIconClasses(isCurrentRoute('/contacts'))" />
                <span :class="getNavTextClasses()">Contacts</span>
              </router-link>
            </li>
            
            <!-- Week Filter (Dashboard only) -->
            <li v-if="isCurrentRoute('/')" class="pt-4">
              <div v-if="!isCollapsed || isMobile" class="px-3 pb-2">
                <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Time Filter
                </h3>
              </div>
              
              <div class="px-3">
                <WeekFilterDropdown />
              </div>
            </li>
          </ul>
        </div>

        <!-- User Profile Section -->
        <div class="border-t border-gray-200 p-4">
          <div v-if="!isCollapsed || isMobile" class="flex items-center">
            <div class="flex-shrink-0">
              <div class="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <UserIcon class="h-4 w-4 text-white" />
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-700">Demo User</p>
              <p class="text-xs text-gray-500">demo@example.com</p>
            </div>
          </div>
          <div v-else class="flex justify-center">
            <div class="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <UserIcon class="h-4 w-4 text-white" />
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Mobile Overlay -->
    <div
      v-if="shouldShowOverlay"
      :class="overlayClasses"
      @click="closeOverlay"
      aria-hidden="true"
    ></div>

    <!-- Main Content -->
    <div 
      class="flex flex-1 flex-col transition-all duration-300"
      :style="{ marginLeft: `${contentMargin}px` }"
    >
      <!-- Top Header -->
      <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <!-- Mobile Menu Button -->
          <button
            v-if="isMobile"
            @click="toggle"
            :class="toggleButtonClasses"
            aria-label="Open sidebar"
          >
            <Bars3Icon class="h-5 w-5" />
          </button>

          <!-- Page Title -->
          <div class="flex-1 min-w-0">
            <h1 class="text-2xl font-bold leading-7 text-gray-700 sm:truncate">
              {{ pageTitle }}
            </h1>
          </div>

          <!-- Header Actions -->
          <div class="flex items-center space-x-4">
            <!-- Refresh Button (Dashboard only) -->
            <button
              v-if="isCurrentRoute('/') && !isRefreshing"
              @click="refreshDashboard"
              class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              :disabled="isLoading"
            >
              <ArrowPathIcon class="h-4 w-4 mr-2" />
              Refresh
            </button>

            <!-- Loading Indicator -->
            <div
              v-if="isRefreshing"
              class="flex items-center text-sm text-gray-500"
            >
              <ArrowPathIcon class="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </div>

            <!-- Settings Button -->
            <button
              @click="openSettings"
              class="inline-flex items-center p-2 border border-transparent rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              aria-label="Dashboard settings"
            >
              <Cog6ToothIcon class="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <!-- Error Banner -->
      <div
        v-if="error"
        class="bg-red-50 border-l-4 border-red-400 p-4"
        role="alert"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-700">
              {{ error }}
            </p>
            <div class="mt-3 flex">
              <button
                @click="recoverFromError"
                class="bg-red-100 px-3 py-1 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Retry
              </button>
              <button
                @click="clearError"
                class="ml-3 bg-red-100 px-3 py-1 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <main class="flex-1 overflow-hidden">
        <div class="h-full px-4 py-6 sm:px-6 lg:px-8">
          <!-- Router View for Page Content -->
          <router-view />
        </div>
      </main>

      <!-- Footer -->
      <footer class="bg-white border-t border-gray-200 px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between text-sm text-gray-500">
          <div class="flex items-center">
            <span>Last updated: {{ lastUpdatedFormatted }}</span>
            <span v-if="isDemoMode" class="ml-4 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
              Demo Mode
            </span>
          </div>
          <div class="text-xs">
            CRM Dashboard v1.0
          </div>
        </div>
      </footer>
    </div>

    <!-- Settings Modal -->
    <DashboardSettings
      v-if="showSettings"
      @close="closeSettings"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  HomeIcon,
  UsersIcon,
  UserIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

// Composables
import { useSidebar } from '@/composables/useSidebar'
import { useResponsive } from '@/composables/useResponsive'
import { useDashboardStore } from '@/stores/dashboardStore'

// Components
import WeekFilterDropdown from './WeekFilterDropdown.vue'
import DashboardSettings from './DashboardSettings.vue'

const route = useRoute()

// Sidebar functionality
const {
  isCollapsed,
  shouldShowOverlay,
  contentMargin,
  sidebarClasses,
  overlayClasses,
  toggleButtonClasses,
  toggle,
  closeOverlay,
  getNavItemClasses,
  getNavIconClasses,
  getNavTextClasses
} = useSidebar()

// Responsive design
const { isMobile } = useResponsive()

// Dashboard store
const dashboardStore = useDashboardStore()
const {
  isDemoMode,
  isLoading,
  isRefreshing,
  error,
  lastUpdated,
  refreshAnalytics,
  clearError,
  recoverFromError
} = dashboardStore

// Local state
const showSettings = ref(false)

// Computed properties
const isCurrentRoute = (path: string) => {
  return route.path === path
}

const pageTitle = computed(() => {
  switch (route.path) {
    case '/':
      return 'Dashboard'
    case '/contacts':
      return 'Contacts'
    default:
      return 'CRM'
  }
})

const lastUpdatedFormatted = computed(() => {
  if (!lastUpdated) return 'Never'
  
  const now = new Date()
  const updated = new Date(lastUpdated)
  const diffMs = now.getTime() - updated.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  
  return updated.toLocaleDateString()
})

// Methods
const refreshDashboard = async () => {
  await refreshAnalytics()
}

const openSettings = () => {
  showSettings.value = true
}

const closeSettings = () => {
  showSettings.value = false
}

// Lifecycle
onMounted(() => {
  // Initialize dashboard if on dashboard route
  if (route.path === '/') {
    dashboardStore.initializeDashboard()
  }
})
</script>

<style scoped>
/* Custom scrollbar for sidebar */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}

/* Smooth transitions */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}
</style>