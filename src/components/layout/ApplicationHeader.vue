<template>
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Left Section -->
        <div class="flex items-center space-x-4">
          <!-- Back Button (Optional) -->
          <button
            v-if="showBackButton"
            @click="$emit('back')"
            class="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Go back"
          >
            <ArrowLeftIcon class="w-5 h-5" />
          </button>
          
          <!-- Logo/Brand -->
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <BuildingOfficeIcon class="w-5 h-5 text-white" />
            </div>
            <span class="text-lg font-semibold text-gray-900">Kitchen Pantry CRM</span>
          </div>
        </div>
        
        <!-- Center Section - Search (when enabled) -->
        <div v-if="showSearch" class="flex-1 max-w-md mx-8">
          <HeaderSearch 
            @search="handleSearch"
            @focus="handleSearchFocus"
          />
        </div>
        
        <!-- Right Section -->
        <div class="flex items-center space-x-4">
          <!-- Quick Actions -->
          <div v-if="showQuickActions" class="hidden sm:flex items-center space-x-2">
            <button
              class="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Quick add"
            >
              <PlusIcon class="w-5 h-5" />
            </button>
            
            <button
              class="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Settings"
            >
              <Cog6ToothIcon class="w-5 h-5" />
            </button>
          </div>
          
          <!-- Notifications -->
          <NotificationDropdown v-if="showNotifications" />
          
          <!-- User Menu -->
          <UserMenu v-if="showUserMenu" />
          
          <!-- Mobile Menu Toggle (when navigation is shown) -->
          <button
            v-if="showNavigation"
            @click="$emit('toggle-mobile-menu')"
            class="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Toggle mobile menu"
          >
            <Bars3Icon class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { 
  ArrowLeftIcon, 
  BuildingOfficeIcon,
  PlusIcon,
  Cog6ToothIcon,
  Bars3Icon
} from '@heroicons/vue/24/outline'
import HeaderSearch from './HeaderSearch.vue'
import NotificationDropdown from './NotificationDropdown.vue'
import UserMenu from './UserMenu.vue'

/**
 * Application Header - Global header component
 * Provides branding, search, notifications, and user menu
 * Configurable features based on layout requirements
 */

interface Props {
  showBackButton?: boolean
  showSearch?: boolean
  showQuickActions?: boolean
  showNotifications?: boolean
  showUserMenu?: boolean
  showNavigation?: boolean
}

withDefaults(defineProps<Props>(), {
  showBackButton: false,
  showSearch: true,
  showQuickActions: true,
  showNotifications: true,
  showUserMenu: true,
  showNavigation: true
})

// Events
defineEmits<{
  back: []
  'toggle-mobile-menu': []
  search: [query: string]
  'search-focus': []
}>()

const handleSearch = (query: string) => {
  // Emit search event for parent components to handle
  console.log('Header search:', query)
}

const handleSearchFocus = () => {
  // Handle search focus for advanced search UI
  console.log('Search focused')
}
</script>