/**
 * Touch Optimization Composable
 * Provides mobile-optimized touch event handling with passive listeners
 * and debouncing to eliminate main thread blocking
 */

import { ref, onMounted, onUnmounted, type Ref } from 'vue'

interface TouchOptimizationOptions {
  /** Debounce delay in milliseconds */
  debounceDelay?: number
  /** Enable passive event listeners for better performance */
  passive?: boolean
  /** Enable touch event capture */
  capture?: boolean
  /** Custom touch event handler */
  onTouch?: (event: TouchEvent) => void
  /** Custom touch end handler */
  onTouchEnd?: (event: TouchEvent) => void
}

interface TouchMetrics {
  /** Touch response time in milliseconds */
  responseTime: number
  /** Whether touch target meets minimum size (44px) */
  isAccessible: boolean
  /** Touch target size in pixels */
  targetSize: { width: number; height: number }
  /** Last touch event timestamp */
  lastTouchTime: number
}

export function useTouchOptimization(
  elementRef: Ref<HTMLElement | null>,
  options: TouchOptimizationOptions = {}
) {
  const {
    debounceDelay = 100,
    passive = true,
    capture = false,
    onTouch,
    onTouchEnd
  } = options

  const touchMetrics = ref<TouchMetrics>({
    responseTime: 0,
    isAccessible: false,
    targetSize: { width: 0, height: 0 },
    lastTouchTime: 0
  })

  const isTouching = ref(false)
  const touchStartTime = ref(0)

  // Debounced touch handler to prevent rapid-fire events
  let touchDebounceTimer: number | null = null
  
  const debouncedTouchHandler = (handler: (event: TouchEvent) => void) => {
    return (event: TouchEvent) => {
      if (touchDebounceTimer) {
        window.clearTimeout(touchDebounceTimer)
      }
      
      touchDebounceTimer = window.setTimeout(() => {
        handler(event)
        touchDebounceTimer = null
      }, debounceDelay)
    }
  }

  // Optimized touch event handlers
  const handleTouchStart = debouncedTouchHandler((event: TouchEvent) => {
    touchStartTime.value = performance.now()
    isTouching.value = true
    
    // Measure touch target size for accessibility
    if (elementRef.value) {
      const rect = elementRef.value.getBoundingClientRect()
      touchMetrics.value.targetSize = {
        width: rect.width,
        height: rect.height
      }
      touchMetrics.value.isAccessible = Math.min(rect.width, rect.height) >= 44
    }
    
    // Call custom handler if provided
    if (onTouch) {
      onTouch(event)
    }
  })

  const handleTouchEnd = debouncedTouchHandler((event: TouchEvent) => {
    const endTime = performance.now()
    touchMetrics.value.responseTime = endTime - touchStartTime.value
    touchMetrics.value.lastTouchTime = endTime
    isTouching.value = false
    
    // Call custom handler if provided
    if (onTouchEnd) {
      onTouchEnd(event)
    }
  })

  // Touch event listeners with passive optimization
  const addTouchListeners = () => {
    if (!elementRef.value) return

    elementRef.value.addEventListener('touchstart', handleTouchStart, {
      passive,
      capture
    })

    elementRef.value.addEventListener('touchend', handleTouchEnd, {
      passive,
      capture
    })
  }

  const removeTouchListeners = () => {
    if (!elementRef.value) return

    elementRef.value.removeEventListener('touchstart', handleTouchStart, {
      capture
    } as EventListenerOptions)

    elementRef.value.removeEventListener('touchend', handleTouchEnd, {
      capture
    } as EventListenerOptions)
  }

  // Performance monitoring for mobile interactions
  const measureTouchPerformance = () => {
    if (!elementRef.value) return null

    const rect = elementRef.value.getBoundingClientRect()
    const touchArea = rect.width * rect.height
    const minTouchSize = 44 * 44 // WCAG minimum
    
    return {
      element: elementRef.value.tagName.toLowerCase(),
      touchArea,
      isAccessible: touchArea >= minTouchSize,
      responsiveness: touchMetrics.value.responseTime < 100 ? 'optimal' : 
                     touchMetrics.value.responseTime < 300 ? 'good' : 'poor'
    }
  }

  // Lifecycle management
  onMounted(() => {
    addTouchListeners()
  })

  onUnmounted(() => {
    removeTouchListeners()
    if (touchDebounceTimer) {
      window.clearTimeout(touchDebounceTimer)
    }
  })

  return {
    touchMetrics,
    isTouching,
    measureTouchPerformance,
    addTouchListeners,
    removeTouchListeners
  }
}

/**
 * Mobile Detection Composable
 * Detects mobile devices and provides mobile-specific optimization flags
 */
export function useMobileDetection() {
  const isMobile = ref(false)
  const isTablet = ref(false)
  const screenSize = ref({ width: 0, height: 0 })
  const touchSupport = ref(false)

  const detectMobile = () => {
    if (typeof window === 'undefined') return

    const width = window.innerWidth
    const height = window.innerHeight
    
    screenSize.value = { width, height }
    isMobile.value = width < 768
    isTablet.value = width >= 768 && width < 1024
    touchSupport.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }

  onMounted(() => {
    detectMobile()
    window.addEventListener('resize', detectMobile)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', detectMobile)
  })

  return {
    isMobile,
    isTablet,
    screenSize,
    touchSupport
  }
}