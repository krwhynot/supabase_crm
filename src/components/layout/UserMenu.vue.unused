<template>
  <div class="relative">
    <!-- User Avatar Button -->
    <button
      @click="toggleDropdown"
      class="flex items-center p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label="User menu"
    >
      <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
        <UserIcon class="w-4 h-4 text-white" />
      </div>
      <ChevronDownIcon 
        :class="[
          'w-4 h-4 ml-1 transition-transform',
          isOpen ? 'transform rotate-180' : ''
        ]" 
      />
    </button>
    
    <!-- Dropdown Panel -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 z-50 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1"
        @click.stop
      >
        <!-- User Info Section -->
        <div class="px-4 py-3 border-b border-gray-200">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <UserIcon class="w-5 h-5 text-white" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ user.name }}</p>
              <p class="text-xs text-gray-500 truncate">{{ user.email }}</p>
            </div>
          </div>
        </div>
        
        <!-- Menu Items -->
        <div class="py-1">
          <!-- Profile -->
          <button
            @click="navigateTo('/profile')"
            class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <UserIcon class="w-4 h-4 mr-3 text-gray-400" />
            Your Profile
          </button>
          
          <!-- Settings -->
          <button
            @click="navigateTo('/settings')"
            class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <Cog6ToothIcon class="w-4 h-4 mr-3 text-gray-400" />
            Settings
          </button>
          
          <!-- Organizations -->
          <button
            @click="navigateTo('/organizations')"
            class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <BuildingOfficeIcon class="w-4 h-4 mr-3 text-gray-400" />
            Organizations
          </button>
          
          <!-- Help -->
          <button
            @click="navigateTo('/help')"
            class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <QuestionMarkCircleIcon class="w-4 h-4 mr-3 text-gray-400" />
            Help & Support
          </button>
          
          <!-- Divider -->
          <div class="border-t border-gray-100 my-1" />
          
          <!-- Theme Toggle -->
          <button
            @click="toggleTheme"
            class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <SunIcon v-if="isDarkMode" class="w-4 h-4 mr-3 text-gray-400" />
            <MoonIcon v-else class="w-4 h-4 mr-3 text-gray-400" />
            {{ isDarkMode ? 'Light Mode' : 'Dark Mode' }}
          </button>
          
          <!-- Divider -->
          <div class="border-t border-gray-100 my-1" />
          
          <!-- Sign Out -->
          <button
            @click="signOut"
            class="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 hover:text-red-900"
          >
            <ArrowRightOnRectangleIcon class="w-4 h-4 mr-3 text-red-400" />
            Sign out
          </button>
        </div>
      </div>
    </Transition>
    
    <!-- Backdrop -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40"
      @click="closeDropdown"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  UserIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
  QuestionMarkCircleIcon,
  SunIcon,
  MoonIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/vue/24/outline'

/**
 * User Menu - User account dropdown
 * Provides user profile, settings, navigation, and authentication actions
 * Supports theme switching and secure sign out functionality
 */

interface User {
  name: string
  email: string
  avatar?: string
  role?: string
}

const router = useRouter()

// State
const isOpen = ref(false)
const isDarkMode = ref(false)

// Mock user data - replace with real user store/auth
const user = ref<User>({
  name: 'Demo User',
  email: 'demo@kitchenpantrycrm.com',
  role: 'Administrator'
})

// Methods
const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const closeDropdown = () => {
  isOpen.value = false
}

const navigateTo = (path: string) => {
  router.push(path)
  closeDropdown()
}

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  // In a real app, this would update the global theme
  console.log('Theme toggled:', isDarkMode.value ? 'dark' : 'light')
  closeDropdown()
}

const signOut = () => {
  // In a real app, this would handle authentication logout
  console.log('User signed out')
  // Potentially redirect to login page
  // router.push('/login')
  closeDropdown()
}

// Handle clicks outside
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    closeDropdown()
  }
}

// Handle escape key
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})
</script>