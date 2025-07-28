/**
 * Sidebar Composable - Navigation state management with persistence
 * Follows Vue 3 Composition API patterns with localStorage persistence
 */

import { ref, computed, watch, onMounted } from 'vue'
import { useResponsive } from './useResponsive'

export function useSidebar() {
  const { isMobile, isTablet } = useResponsive()
  
  // State
  const isCollapsed = ref(false)
  const isOverlayOpen = ref(false)
  const sidebarMode = ref<'overlay' | 'push' | 'fixed'>('push')
  
  // Local storage key
  const STORAGE_KEY = 'dashboard-sidebar-collapsed'

  // Computed properties
  const shouldShowOverlay = computed(() => 
    isMobile.value && isOverlayOpen.value
  )

  const shouldAutoCollapse = computed(() => 
    isTablet.value || isMobile.value
  )

  const sidebarWidth = computed(() => {
    if (isMobile.value) {
      return isOverlayOpen.value ? 256 : 0
    }
    
    if (isTablet.value) {
      return isCollapsed.value ? 64 : 256
    }
    
    return isCollapsed.value ? 64 : 256
  })

  const contentMargin = computed(() => {
    if (isMobile.value) return 0
    if (sidebarMode.value === 'overlay') return 0
    return sidebarWidth.value
  })

  const sidebarClasses = computed(() => {
    const classes = ['transition-all', 'duration-300', 'ease-in-out']
    
    if (isMobile.value) {
      classes.push(
        'fixed', 'inset-y-0', 'left-0', 'z-50',
        'transform', isOverlayOpen.value ? 'translate-x-0' : '-translate-x-full'
      )
    } else {
      classes.push('fixed', 'inset-y-0', 'left-0', 'z-40')
      
      if (isCollapsed.value) {
        classes.push('w-16')
      } else {
        classes.push('w-64')
      }
    }
    
    return classes.join(' ')
  })

  const overlayClasses = computed(() => {
    const classes = ['fixed', 'inset-0', 'bg-black', 'bg-opacity-50', 'z-40', 'transition-opacity', 'duration-300']
    
    if (shouldShowOverlay.value) {
      classes.push('opacity-100')
    } else {
      classes.push('opacity-0', 'pointer-events-none')
    }
    
    return classes.join(' ')
  })

  const toggleButtonClasses = computed(() => [
    'inline-flex', 'items-center', 'justify-center',
    'p-2', 'rounded-md', 'text-gray-400',
    'hover:text-gray-500', 'hover:bg-gray-100',
    'focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500',
    'transition-colors', 'duration-200'
  ].join(' '))

  // Methods
  const toggle = () => {
    if (isMobile.value) {
      isOverlayOpen.value = !isOverlayOpen.value
    } else {
      isCollapsed.value = !isCollapsed.value
      saveCollapsedState()
    }
  }

  const open = () => {
    if (isMobile.value) {
      isOverlayOpen.value = true
    } else {
      isCollapsed.value = false
      saveCollapsedState()
    }
  }

  const close = () => {
    if (isMobile.value) {
      isOverlayOpen.value = false
    } else {
      isCollapsed.value = true
      saveCollapsedState()
    }
  }

  const closeOverlay = () => {
    if (isMobile.value) {
      isOverlayOpen.value = false
    }
  }

  // Persistence
  const loadCollapsedState = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved !== null) {
        isCollapsed.value = JSON.parse(saved)
      }
    } catch (error) {
      console.warn('Failed to load sidebar state:', error)
    }
  }

  const saveCollapsedState = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(isCollapsed.value))
    } catch (error) {
      console.warn('Failed to save sidebar state:', error)
    }
  }

  // Auto-collapse on smaller screens
  const updateSidebarMode = () => {
    if (isMobile.value) {
      sidebarMode.value = 'overlay'
      isOverlayOpen.value = false
    } else if (isTablet.value) {
      sidebarMode.value = 'push'
      if (!isCollapsed.value) {
        isCollapsed.value = true
      }
    } else {
      sidebarMode.value = 'push'
    }
  }

  // Keyboard shortcuts
  const handleKeydown = (event: KeyboardEvent) => {
    // Toggle sidebar with Ctrl/Cmd + B
    if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
      event.preventDefault()
      toggle()
    }
    
    // Close overlay with Escape
    if (event.key === 'Escape' && shouldShowOverlay.value) {
      closeOverlay()
    }
  }

  // Touch gestures for mobile
  const handleTouchStart = (event: TouchEvent) => {
    if (!isMobile.value) return
    
    const touch = event.touches[0]
    const startX = touch.clientX
    
    // Only handle swipe from left edge
    if (startX > 20) return
    
    const startTime = Date.now()
    
    const handleTouchMove = (moveEvent: TouchEvent) => {
      moveEvent.preventDefault()
    }
    
    const handleTouchEnd = (endEvent: TouchEvent) => {
      const endTouch = endEvent.changedTouches[0]
      const endX = endTouch.clientX
      const endTime = Date.now()
      
      const distance = endX - startX
      const duration = endTime - startTime
      const velocity = distance / duration
      
      // Swipe right to open sidebar
      if (distance > 50 && velocity > 0.3) {
        open()
      }
      
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
  }

  // Click outside to close overlay
  const handleClickOutside = (event: Event) => {
    if (!shouldShowOverlay.value) return
    
    const target = event.target as HTMLElement
    const sidebar = document.querySelector('[data-sidebar]')
    
    if (sidebar && !sidebar.contains(target)) {
      closeOverlay()
    }
  }

  // Navigation item helper
  const getNavItemClasses = (isActive: boolean) => {
    const baseClasses = [
      'flex', 'items-center', 'px-3', 'py-3', 'text-sm', 'font-semibold',
      'rounded-md', 'transition-colors', 'duration-200', 'min-h-[44px]'
    ]
    
    if (isActive) {
      baseClasses.push('bg-blue-100', 'text-blue-700')
    } else {
      baseClasses.push('text-gray-600', 'hover:text-gray-900', 'hover:bg-gray-50')
    }
    
    return baseClasses.join(' ')
  }

  const getNavIconClasses = (isActive: boolean) => {
    const baseClasses = ['flex-shrink-0', 'mr-3', 'h-5', 'w-5']
    
    if (isCollapsed.value && !isMobile.value) {
      baseClasses.push('mr-0')
    }
    
    if (isActive) {
      baseClasses.push('text-blue-500')
    } else {
      baseClasses.push('text-gray-400', 'group-hover:text-gray-500')
    }
    
    return baseClasses.join(' ')
  }

  const getNavTextClasses = () => {
    const classes = ['truncate']
    
    if (isCollapsed.value && !isMobile.value) {
      classes.push('sr-only')
    }
    
    return classes.join(' ')
  }

  // Watchers
  watch([isMobile, isTablet], updateSidebarMode, { immediate: true })

  // Lifecycle
  onMounted(() => {
    loadCollapsedState()
    updateSidebarMode()
    
    // Event listeners
    document.addEventListener('keydown', handleKeydown)
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('click', handleClickOutside)
  })

  // Cleanup (would be in onUnmounted in real component)
  const cleanup = () => {
    document.removeEventListener('keydown', handleKeydown)
    document.removeEventListener('touchstart', handleTouchStart)
    document.removeEventListener('click', handleClickOutside)
  }

  return {
    // State
    isCollapsed,
    isOverlayOpen,
    sidebarMode,

    // Computed
    shouldShowOverlay,
    shouldAutoCollapse,
    sidebarWidth,
    contentMargin,
    sidebarClasses,
    overlayClasses,
    toggleButtonClasses,

    // Methods
    toggle,
    open,
    close,
    closeOverlay,

    // Helpers
    getNavItemClasses,
    getNavIconClasses,
    getNavTextClasses,
    
    // Cleanup
    cleanup
  }
}