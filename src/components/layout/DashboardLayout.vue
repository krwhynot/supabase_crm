<template>
  <div class="min-h-screen bg-gray-50 flex">
    <!-- Sidebar -->
    <div
      :class="[
        'flex-shrink-0 bg-white shadow-lg transition-all duration-300 ease-in-out',
        sidebarCollapsed ? 'w-16' : 'w-64',
        'md:relative absolute z-40 h-full',
        showMobileSidebar ? 'translate-x-0' : 'md:translate-x-0 -translate-x-full'
      ]"
    >
      <!-- Sidebar Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <div v-if="!sidebarCollapsed" class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <span class="text-lg font-semibold text-gray-900">CRM</span>
        </div>
        
        <button
          @click="toggleSidebar"
          class="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          :aria-label="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-4">
        <ul class="space-y-2">
          <li>
            <router-link
              to="/"
              :class="[
                'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                $route.path === '/'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              ]"
            >
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v0M8 11h8m-4-4v8" />
              </svg>
              <span v-if="!sidebarCollapsed" class="ml-3">Dashboard</span>
            </router-link>
          </li>

          <li>
            <router-link
              to="/contacts"
              :class="[
                'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                $route.path.startsWith('/contacts')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              ]"
            >
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span v-if="!sidebarCollapsed" class="ml-3">Contacts</span>
            </router-link>
          </li>
        </ul>

        <!-- Current Week Filter (if not collapsed) -->
        <div v-if="!sidebarCollapsed" class="mt-6 pt-6 border-t border-gray-200">
          <h3 class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Filters
          </h3>
          <div class="mt-2 space-y-1">
            <button
              @click="toggleWeekFilter"
              :class="[
                'flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors',
                weekFilterActive
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              ]"
            >
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span class="ml-3">Current Week</span>
              <span v-if="weekFilterActive" class="ml-auto">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </nav>

      <!-- Sidebar Footer -->
      <div class="p-4 border-t border-gray-200">
        <div v-if="!sidebarCollapsed" class="flex items-center">
          <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-900">User</p>
            <p class="text-xs text-gray-500">Dashboard v1.0</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile sidebar overlay -->
    <div
      v-if="showMobileSidebar"
      class="fixed inset-0 bg-gray-600 bg-opacity-75 z-30 md:hidden"
      @click="closeMobileSidebar"
    />

    <!-- Main content -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Mobile header -->
      <div class="md:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div class="flex items-center justify-between">
          <button
            @click="openMobileSidebar"
            class="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Open sidebar"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 class="text-lg font-semibold text-gray-900">CRM Dashboard</h1>
          <div class="w-10 h-6" /> <!-- Spacer for centering -->
        </div>
      </div>

      <!-- Page content -->
      <main class="flex-1 p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboardStore'

// Dashboard store integration
const dashboardStore = useDashboardStore()

// Sidebar state - integrated with store
const sidebarCollapsed = ref(dashboardStore.preferences.sidebarCollapsed)
const showMobileSidebar = ref(false)
const weekFilterActive = ref(dashboardStore.preferences.weekFilterEnabled)

// Mobile detection
const isMobile = ref(false)

// Methods
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  dashboardStore.updatePreferences({ sidebarCollapsed: sidebarCollapsed.value })
}

const openMobileSidebar = () => {
  showMobileSidebar.value = true
}

const closeMobileSidebar = () => {
  showMobileSidebar.value = false
}

const toggleWeekFilter = () => {
  weekFilterActive.value = !weekFilterActive.value
  dashboardStore.updatePreferences({ weekFilterEnabled: weekFilterActive.value })
}

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

const handleResize = () => {
  checkMobile()
  if (!isMobile.value) {
    showMobileSidebar.value = false
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  // ESC key to close mobile sidebar
  if (event.key === 'Escape' && showMobileSidebar.value) {
    closeMobileSidebar()
  }
}

// Initialize component
onMounted(() => {
  // Initialize dashboard store
  dashboardStore.initializeDashboard()
  
  // Sync local state with store
  sidebarCollapsed.value = dashboardStore.preferences.sidebarCollapsed
  weekFilterActive.value = dashboardStore.preferences.weekFilterEnabled

  // Setup mobile detection
  checkMobile()
  window.addEventListener('resize', handleResize)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('keydown', handleKeydown)
})
</script>