/**
 * Responsive Composable - Breakpoint management and responsive behavior
 * Follows Vue 3 Composition API patterns with reactive state management
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { BreakpointSize } from '@/types/dashboard.types'

// Tailwind CSS breakpoints
const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const

export function useResponsive() {
  // State
  const windowWidth = ref(0)
  const windowHeight = ref(0)

  // Computed properties
  const currentBreakpoint = computed((): BreakpointSize => {
    const width = windowWidth.value
    
    if (width >= BREAKPOINTS['2xl']) return '2xl'
    if (width >= BREAKPOINTS.xl) return 'xl'
    if (width >= BREAKPOINTS.lg) return 'lg'
    if (width >= BREAKPOINTS.md) return 'md'
    if (width >= BREAKPOINTS.sm) return 'sm'
    return 'xs'
  })

  const isXs = computed(() => currentBreakpoint.value === 'xs')
  const isSm = computed(() => currentBreakpoint.value === 'sm')
  const isMd = computed(() => currentBreakpoint.value === 'md')
  const isLg = computed(() => currentBreakpoint.value === 'lg')
  const isXl = computed(() => currentBreakpoint.value === 'xl')
  const is2Xl = computed(() => currentBreakpoint.value === '2xl')

  // Convenience computed properties
  const isMobile = computed(() => isXs.value || isSm.value)
  const isTablet = computed(() => isMd.value)
  const isDesktop = computed(() => isLg.value || isXl.value || is2Xl.value)
  const isLargeScreen = computed(() => isXl.value || is2Xl.value)

  // Breakpoint checks
  const isAtLeast = (breakpoint: BreakpointSize): boolean => {
    const currentIndex = Object.keys(BREAKPOINTS).indexOf(currentBreakpoint.value)
    const targetIndex = Object.keys(BREAKPOINTS).indexOf(breakpoint)
    return currentIndex >= targetIndex
  }

  const isAtMost = (breakpoint: BreakpointSize): boolean => {
    const currentIndex = Object.keys(BREAKPOINTS).indexOf(currentBreakpoint.value)
    const targetIndex = Object.keys(BREAKPOINTS).indexOf(breakpoint)
    return currentIndex <= targetIndex
  }

  const isExactly = (breakpoint: BreakpointSize): boolean => {
    return currentBreakpoint.value === breakpoint
  }

  // Responsive grid calculations
  const getGridCols = computed(() => {
    if (isMobile.value) return 1
    if (isTablet.value) return 2
    if (isDesktop.value) return 3
    if (isLargeScreen.value) return 4
    return 2
  })

  const getWidgetCols = computed(() => {
    if (isMobile.value) return 1
    if (isTablet.value) return 2
    return 4
  })

  const getSidebarWidth = computed(() => {
    if (isMobile.value) return 0 // Hidden on mobile
    if (isTablet.value) return 64 // Collapsed on tablet
    return 256 // Full width on desktop
  })

  // Touch device detection
  const isTouchDevice = ref(false)

  const detectTouchDevice = () => {
    isTouchDevice.value = (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0
    )
  }

  // Orientation detection
  const orientation = ref<'portrait' | 'landscape'>('portrait')
  
  const updateOrientation = () => {
    orientation.value = windowWidth.value > windowHeight.value ? 'landscape' : 'portrait'
  }

  const isPortrait = computed(() => orientation.value === 'portrait')
  const isLandscape = computed(() => orientation.value === 'landscape')

  // Viewport utilities
  const getViewportSize = () => ({
    width: windowWidth.value,
    height: windowHeight.value
  })

  const getAspectRatio = computed(() => 
    windowWidth.value / windowHeight.value
  )

  // Responsive text sizes
  const getResponsiveFontSize = (base: number): string => {
    const scale = isMobile.value ? 0.875 : isTablet.value ? 0.925 : 1
    return `${base * scale}rem`
  }

  // Responsive spacing
  const getResponsiveSpacing = (base: number): string => {
    const scale = isMobile.value ? 0.75 : isTablet.value ? 0.875 : 1
    return `${base * scale}rem`
  }

  // Container max widths
  const getContainerMaxWidth = computed(() => {
    if (isMobile.value) return '100%'
    if (isTablet.value) return '768px'
    if (isLg.value) return '1024px'
    if (isXl.value) return '1280px'
    return '1536px'
  })

  // Media query matching
  const matchesMediaQuery = (query: string): boolean => {
    return window.matchMedia(query).matches
  }

  // Common media queries
  const mediaQueries = {
    prefersReducedMotion: () => matchesMediaQuery('(prefers-reduced-motion: reduce)'),
    prefersDarkScheme: () => matchesMediaQuery('(prefers-color-scheme: dark)'),
    prefersHighContrast: () => matchesMediaQuery('(prefers-contrast: high)'),
    canHover: () => matchesMediaQuery('(hover: hover)'),
    finePointer: () => matchesMediaQuery('(pointer: fine)')
  }

  // Responsive classes helper
  const getResponsiveClasses = (classes: Partial<Record<BreakpointSize, string>>): string => {
    const activeClasses: string[] = []
    
    Object.entries(classes).forEach(([breakpoint, className]) => {
      if (isAtLeast(breakpoint as BreakpointSize) && className) {
        activeClasses.push(className)
      }
    })
    
    return activeClasses.join(' ')
  }

  // Update window dimensions
  const updateDimensions = () => {
    windowWidth.value = window.innerWidth
    windowHeight.value = window.innerHeight
    updateOrientation()
  }

  // Event listeners
  let resizeObserver: ResizeObserver | null = null

  const setupResizeListener = () => {
    // Use ResizeObserver if available, fallback to window resize
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateDimensions)
      resizeObserver.observe(document.documentElement)
    } else {
      window.addEventListener('resize', updateDimensions, { passive: true })
    }
    
    window.addEventListener('orientationchange', updateDimensions, { passive: true })
  }

  const cleanupResizeListener = () => {
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    } else {
      window.removeEventListener('resize', updateDimensions)
    }
    
    window.removeEventListener('orientationchange', updateDimensions)
  }

  // Lifecycle
  onMounted(() => {
    updateDimensions()
    detectTouchDevice()
    setupResizeListener()
  })

  onUnmounted(() => {
    cleanupResizeListener()
  })

  return {
    // State
    windowWidth,
    windowHeight,
    isTouchDevice,
    orientation,

    // Computed - Breakpoints
    currentBreakpoint,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,

    // Computed - Categories
    isMobile,
    isTablet,
    isDesktop,
    isLargeScreen,
    isPortrait,
    isLandscape,

    // Computed - Layout
    getGridCols,
    getWidgetCols,
    getSidebarWidth,
    getContainerMaxWidth,
    getAspectRatio,

    // Methods - Breakpoint checks
    isAtLeast,
    isAtMost,
    isExactly,

    // Methods - Utilities
    getViewportSize,
    getResponsiveFontSize,
    getResponsiveSpacing,
    getResponsiveClasses,
    matchesMediaQuery,
    mediaQueries,

    // Constants
    BREAKPOINTS
  }
}