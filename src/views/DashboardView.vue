<template>
  <div class="dashboard-view">
    <!-- Dashboard Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p class="text-gray-600 mt-1">Welcome to your CRM dashboard</p>
        </div>
        <div class="flex items-center space-x-3">
          <button
            @click="refreshDashboard"
            :disabled="isLoading"
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <svg class="w-4 h-4 mr-2" :class="{ 'animate-spin': isLoading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {{ isLoading ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Dashboard Content -->
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <!-- Stats Cards -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Total Contacts</p>
            <p class="text-2xl font-semibold text-gray-900">{{ stats.totalContacts }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Recent Contacts</p>
            <p class="text-2xl font-semibold text-gray-900">{{ stats.recentContacts }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Organizations</p>
            <p class="text-2xl font-semibold text-gray-900">{{ stats.organizations }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="mt-8">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <router-link
          to="/contacts/new"
          class="group relative bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 hover:border-blue-300"
        >
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-900 group-hover:text-blue-600">Add Contact</p>
              <p class="text-sm text-gray-500">Create new contact</p>
            </div>
          </div>
        </router-link>

        <router-link
          to="/contacts"
          class="group relative bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 hover:border-blue-300"
        >
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center group-hover:bg-green-600 transition-colors">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-900 group-hover:text-green-600">View Contacts</p>
              <p class="text-sm text-gray-500">Browse all contacts</p>
            </div>
          </div>
        </router-link>

        <button
          @click="refreshDashboard"
          class="group relative bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 hover:border-blue-300"
        >
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-900 group-hover:text-purple-600">Refresh Data</p>
              <p class="text-sm text-gray-500">Update dashboard</p>
            </div>
          </div>
        </button>

        <div class="relative bg-white p-6 rounded-lg shadow border border-gray-200">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-10 h-10 bg-gray-400 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-900">Analytics</p>
              <p class="text-sm text-gray-500">Coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="mt-8">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
      <div class="bg-white rounded-lg shadow">
        <div class="p-6">
          <div v-if="recentActivity.length === 0" class="text-center py-8">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
            <p class="mt-1 text-sm text-gray-500">Get started by adding your first contact.</p>
            <div class="mt-6">
              <router-link
                to="/contacts/new"
                class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Contact
              </router-link>
            </div>
          </div>
          
          <div v-else class="space-y-4">
            <div
              v-for="activity in recentActivity"
              :key="activity.id"
              class="flex items-center p-4 bg-gray-50 rounded-lg"
            >
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div class="ml-4 flex-1">
                <p class="text-sm font-medium text-gray-900">{{ activity.action }}</p>
                <p class="text-sm text-gray-500">{{ activity.description }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ formatDate(activity.timestamp) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboardStore'

// Store access
const dashboardStore = useDashboardStore()

// Computed dashboard stats from dashboard store
const stats = computed(() => dashboardStore.dashboardStats)
const recentActivity = computed(() => dashboardStore.recentActivity)
const isLoading = computed(() => dashboardStore.isLoading)

// Methods
const refreshDashboard = async () => {
  await dashboardStore.refreshDashboard()
}

const formatDate = (date: Date) => {
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
    Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    'day'
  )
}

// Initialize dashboard
onMounted(async () => {
  // Initialize dashboard store first
  dashboardStore.initializeDashboard()
  // Then refresh data
  await refreshDashboard()
})
</script>