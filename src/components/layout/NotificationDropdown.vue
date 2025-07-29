<template>
  <div class="relative">
    <!-- Notification Bell -->
    <button
      @click="toggleDropdown"
      class="relative p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label="View notifications"
    >
      <BellIcon class="w-5 h-5" />
      
      <!-- Notification Badge -->
      <span
        v-if="unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
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
        class="absolute right-0 z-50 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 py-1"
        @click.stop
      >
        <!-- Header -->
        <div class="px-4 py-3 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-gray-900">Notifications</h3>
            <button
              v-if="unreadCount > 0"
              @click="markAllAsRead"
              class="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Mark all as read
            </button>
          </div>
        </div>
        
        <!-- Notifications List -->
        <div class="max-h-96 overflow-y-auto">
          <div v-if="notifications.length === 0" class="px-4 py-8 text-center text-sm text-gray-500">
            No notifications
          </div>
          
          <div v-else>
            <button
              v-for="notification in notifications"
              :key="notification.id"
              @click="handleNotificationClick(notification)"
              :class="[
                'w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0',
                !notification.read ? 'bg-blue-50' : ''
              ]"
            >
              <div class="flex items-start space-x-3">
                <!-- Icon -->
                <div class="flex-shrink-0 mt-0.5">
                  <div :class="[
                    'w-2 h-2 rounded-full',
                    !notification.read ? 'bg-blue-500' : 'bg-gray-300'
                  ]" />
                </div>
                
                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <p :class="[
                    'text-sm',
                    !notification.read ? 'font-medium text-gray-900' : 'text-gray-700'
                  ]">
                    {{ notification.title }}
                  </p>
                  <p class="text-xs text-gray-500 mt-1">
                    {{ notification.message }}
                  </p>
                  <p class="text-xs text-gray-400 mt-2">
                    {{ formatTime(notification.createdAt) }}
                  </p>
                </div>
                
                <!-- Type Icon -->
                <div class="flex-shrink-0">
                  <component 
                    :is="getNotificationIcon(notification.type)"
                    class="w-4 h-4 text-gray-400"
                  />
                </div>
              </div>
            </button>
          </div>
        </div>
        
        <!-- Footer -->
        <div v-if="notifications.length > 0" class="px-4 py-3 border-t border-gray-200">
          <router-link
            to="/notifications"
            class="text-sm text-blue-600 hover:text-blue-700 font-medium"
            @click="closeDropdown"
          >
            View all notifications
          </router-link>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  BellIcon,
  BuildingOfficeIcon,
  UserIcon,
  CalendarIcon,
  DocumentIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

/**
 * Notification Dropdown - Real-time notifications
 * Displays system notifications with different types and priorities
 * Supports mark as read functionality and navigation to notification details
 */

interface Notification {
  id: string
  type: 'organization' | 'contact' | 'meeting' | 'document' | 'system' | 'warning'
  title: string
  message: string
  read: boolean
  createdAt: Date
  actionUrl?: string
}

const router = useRouter()

// State
const isOpen = ref(false)
const notifications = ref<Notification[]>([
  {
    id: '1',
    type: 'organization',
    title: 'New organization added',
    message: 'Acme Corporation has been added to your CRM',
    read: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    actionUrl: '/organizations/1'
  },
  {
    id: '2',
    type: 'contact',
    title: 'Contact updated',
    message: 'John Smith updated his contact information',
    read: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    actionUrl: '/contacts/2'
  },
  {
    id: '3',
    type: 'meeting',
    title: 'Upcoming meeting',
    message: 'Meeting with Acme Corp in 30 minutes',
    read: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: '4',
    type: 'system',
    title: 'System maintenance',
    message: 'Scheduled maintenance completed successfully',
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  }
])

// Computed
const unreadCount = computed(() => 
  notifications.value.filter(n => !n.read).length
)

// Methods
const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const closeDropdown = () => {
  isOpen.value = false
}

const markAllAsRead = () => {
  notifications.value.forEach(notification => {
    notification.read = true
  })
}

const handleNotificationClick = (notification: Notification) => {
  // Mark as read
  notification.read = true
  
  // Navigate to action URL if provided
  if (notification.actionUrl) {
    router.push(notification.actionUrl)
  }
  
  closeDropdown()
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'organization':
      return BuildingOfficeIcon
    case 'contact':
      return UserIcon
    case 'meeting':
      return CalendarIcon
    case 'document':
      return DocumentIcon
    case 'warning':
      return ExclamationTriangleIcon
    default:
      return BellIcon
  }
}

const formatTime = (date: Date): string => {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`
  
  return date.toLocaleDateString()
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