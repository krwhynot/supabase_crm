/**
 * Professional Form Enhancement Composable
 * 
 * This composable provides sophisticated user experience enhancements for form fields,
 * including smooth animations, professional feedback messages, progressive disclosure,
 * and subtle success acknowledgments for field completion.
 * 
 * Features:
 * - Smooth validation feedback with professional transitions
 * - Clear, actionable error messages with helpful guidance
 * - Progressive disclosure with elegant animations
 * - Subtle success acknowledgments for field completion
 * - Accessibility-conscious with prefers-reduced-motion support
 * - Enterprise-appropriate tone for professional applications
 */

import { ref, computed, nextTick, onMounted } from 'vue'

// ===============================
// TYPES & INTERFACES
// ===============================

export type DelightLevel = 'minimal' | 'standard' | 'enhanced'
export type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid' | 'celebrating'
export type FieldType = 'text' | 'select' | 'multiselect' | 'textarea' | 'number' | 'email' | 'search' | 'date' | 'datetime-local' | 'time' | 'tel' | 'url' | 'password'

export interface DelightConfig {
  level: DelightLevel
  enableAnimations: boolean
  enableSounds: boolean
  enablePersonality: boolean
  enableCelebrations: boolean
  enableProgressiveDisclosure: boolean
  animationDuration: number
  celebrationDuration: number
}

export interface FieldDelightState {
  validationState: ValidationState
  isCompleted: boolean
  isFocused: boolean
  hasBeenTouched: boolean
  completionScore: number // 0-100
  delightTriggerCount: number
  lastCelebrationTime: number | null
}

export interface DelightMessage {
  type: 'error' | 'success' | 'encouragement' | 'celebration'
  title: string
  message: string
  emoji?: string
  action?: string
}

// ===============================
// DELIGHT CONFIGURATION
// ===============================

const DEFAULT_CONFIG: DelightConfig = {
  level: 'standard',
  enableAnimations: true,
  enableSounds: false, // Disabled for professional environment
  enablePersonality: true,
  enableCelebrations: true,
  enableProgressiveDisclosure: true,
  animationDuration: 300,
  celebrationDuration: 1000 // Reduced duration for professional context
}

// ===============================
// PROFESSIONAL FEEDBACK MESSAGES
// ===============================

const DELIGHT_MESSAGES = {
  validation: {
    success: [
      { type: 'success' as const, title: 'Validated', message: 'Input meets requirements' },
      { type: 'success' as const, title: 'Complete', message: 'Field successfully validated' },
      { type: 'success' as const, title: 'Confirmed', message: 'Data format is correct' },
      { type: 'success' as const, title: 'Verified', message: 'Information has been accepted' }
    ],
    error: {
      required: [
        { type: 'error' as const, title: 'Required Field', message: 'This information is needed to proceed' },
        { type: 'error' as const, title: 'Missing Information', message: 'Please complete this required field' },
        { type: 'error' as const, title: 'Field Required', message: 'This field must be completed' }
      ],
      invalid: [
        { type: 'error' as const, title: 'Format Error', message: 'Please check the input format' },
        { type: 'error' as const, title: 'Invalid Input', message: 'The entered value is not in the correct format' },
        { type: 'error' as const, title: 'Validation Failed', message: 'Please verify the information entered' }
      ],
      tooLong: [
        { type: 'error' as const, title: 'Exceeds Limit', message: 'Please reduce the length of your input' },
        { type: 'error' as const, title: 'Too Long', message: 'Input exceeds maximum character limit' }
      ],
      tooShort: [
        { type: 'error' as const, title: 'Too Short', message: 'Please provide more detail' },
        { type: 'error' as const, title: 'Insufficient Length', message: 'Additional information is required' }
      ]
    },
    encouragement: [
      { type: 'encouragement' as const, title: 'Progress', message: 'Form completion is proceeding well' },
      { type: 'encouragement' as const, title: 'Continue', message: 'Additional fields remain to be completed' },
      { type: 'encouragement' as const, title: 'Advancing', message: 'Good progress on form completion' }
    ]
  },
  completion: {
    field: [
      { type: 'celebration' as const, title: 'Field Complete', message: 'Information successfully entered' },
      { type: 'celebration' as const, title: 'Data Saved', message: 'Field has been completed' },
      { type: 'celebration' as const, title: 'Input Accepted', message: 'Field validation successful' }
    ],
    multiselect: [
      { type: 'celebration' as const, title: 'Selection Applied', message: 'Choices have been confirmed' },
      { type: 'celebration' as const, title: 'Options Selected', message: 'Multiple items selected successfully' },
      { type: 'celebration' as const, title: 'Selection Complete', message: 'Items have been chosen' }
    ],
    section: [
      { type: 'celebration' as const, title: 'Section Complete', message: 'All required fields in this section are filled' },
      { type: 'celebration' as const, title: 'Progress Saved', message: 'This section has been completed' },
      { type: 'celebration' as const, title: 'Section Validated', message: 'All information in this section is complete' }
    ]
  },
  categorySpecific: {
    productName: [
      { type: 'success' as const, title: 'Product Name Set', message: 'Product identifier has been established' },
      { type: 'success' as const, title: 'Name Validated', message: 'Product name meets requirements' }
    ],
    category: [
      { type: 'success' as const, title: 'Category Selected', message: 'Product classification has been set' },
      { type: 'success' as const, title: 'Classification Applied', message: 'Product category has been assigned' }
    ],
    principals: [
      { type: 'success' as const, title: 'Access Configured', message: 'Principal permissions have been set' },
      { type: 'success' as const, title: 'Principals Assigned', message: 'User access has been configured' }
    ]
  }
}

// ===============================
// MAIN COMPOSABLE
// ===============================

export function useFormDelight(
  fieldType: FieldType = 'text',
  config: Partial<DelightConfig> = {}
) {
  // ===============================
  // REACTIVE STATE
  // ===============================
  
  const delightConfig = ref<DelightConfig>({ ...DEFAULT_CONFIG, ...config })
  const fieldState = ref<FieldDelightState>({
    validationState: 'idle',
    isCompleted: false,
    isFocused: false,
    hasBeenTouched: false,
    completionScore: 0,
    delightTriggerCount: 0,
    lastCelebrationTime: null
  })
  
  const currentMessage = ref<DelightMessage | null>(null)
  const showCelebration = ref(false)
  const prefersReducedMotion = ref(false)
  
  // ===============================
  // COMPUTED PROPERTIES
  // ===============================
  
  const shouldAnimate = computed(() => 
    delightConfig.value.enableAnimations && !prefersReducedMotion.value
  )
  
  const canCelebrate = computed(() => {
    const now = Date.now()
    const lastCelebration = fieldState.value.lastCelebrationTime
    return !lastCelebration || (now - lastCelebration) > delightConfig.value.celebrationDuration
  })
  
  const delightClasses = computed(() => {
    const classes: string[] = []
    
    if (!shouldAnimate.value) return classes
    
    // Base transition classes
    classes.push('transition-all', 'duration-300', 'ease-out')
    
    // State-specific classes
    switch (fieldState.value.validationState) {
      case 'validating':
        classes.push('delight-validating')
        break
      case 'valid':
        classes.push('delight-valid')
        if (showCelebration.value) classes.push('delight-celebrating')
        break
      case 'invalid':
        classes.push('delight-invalid')
        break
      case 'celebrating':
        classes.push('delight-celebrating')
        break
    }
    
    // Focus state
    if (fieldState.value.isFocused) {
      classes.push('delight-focused')
    }
    
    // Completion state
    if (fieldState.value.isCompleted) {
      classes.push('delight-completed')
    }
    
    return classes
  })
  
  // ===============================
  // MESSAGE GENERATION
  // ===============================
  
  const getRandomMessage = (messageArray: DelightMessage[]): DelightMessage => {
    return messageArray[Math.floor(Math.random() * messageArray.length)]
  }
  
  const generateSuccessMessage = (fieldName?: string): DelightMessage => {
    const messages = DELIGHT_MESSAGES.validation.success
    const baseMessage = getRandomMessage(messages)
    
    // Add field-specific context
    if (fieldName) {
      switch (fieldType) {
        case 'text':
          if (fieldName.toLowerCase().includes('name')) {
            return getRandomMessage(DELIGHT_MESSAGES.categorySpecific.productName)
          }
          break
        case 'select':
          if (fieldName.toLowerCase().includes('category')) {
            return getRandomMessage(DELIGHT_MESSAGES.categorySpecific.category)
          }
          break
        case 'multiselect':
          if (fieldName.toLowerCase().includes('principal')) {
            return getRandomMessage(DELIGHT_MESSAGES.categorySpecific.principals)
          }
          return getRandomMessage(DELIGHT_MESSAGES.completion.multiselect)
      }
    }
    
    return baseMessage
  }
  
  const generateErrorMessage = (_errorType: string, originalError?: string): DelightMessage => {
    let messageCategory = DELIGHT_MESSAGES.validation.error.invalid
    
    // Categorize error types
    if (originalError?.toLowerCase().includes('required')) {
      messageCategory = DELIGHT_MESSAGES.validation.error.required
    } else if (originalError?.toLowerCase().includes('too long') || originalError?.toLowerCase().includes('maximum')) {
      messageCategory = DELIGHT_MESSAGES.validation.error.tooLong
    } else if (originalError?.toLowerCase().includes('too short') || originalError?.toLowerCase().includes('minimum')) {
      messageCategory = DELIGHT_MESSAGES.validation.error.tooShort
    }
    
    const baseMessage = getRandomMessage(messageCategory)
    
    return {
      ...baseMessage,
      // Append original error for clarity while keeping personality
      message: originalError ? `${baseMessage.message}: ${originalError}` : baseMessage.message
    }
  }
  
  // ===============================
  // ANIMATION CONTROLS
  // ===============================
  
  const triggerSpringAnimation = async (element: HTMLElement, type: 'success' | 'error' | 'celebration') => {
    if (!shouldAnimate.value) return
    
    const animationClass = `delight-spring-${type}`
    element.classList.add(animationClass)
    
    // Remove animation class after animation completes
    setTimeout(() => {
      element.classList.remove(animationClass)
    }, delightConfig.value.animationDuration)
  }
  
  const triggerCelebrationParticles = async (element: HTMLElement) => {
    if (!shouldAnimate.value || !delightConfig.value.enableCelebrations) return
    
    // Create subtle success indicator
    const indicator = document.createElement('div')
    indicator.className = 'success-indicator'
    indicator.innerHTML = '<div class="success-pulse"></div>'
    
    const rect = element.getBoundingClientRect()
    indicator.style.position = 'fixed'
    indicator.style.left = `${rect.right - 20}px`
    indicator.style.top = `${rect.top + rect.height / 2 - 10}px`
    indicator.style.pointerEvents = 'none'
    indicator.style.zIndex = '1000'
    
    document.body.appendChild(indicator)
    
    // Animate subtle success pulse
    indicator.style.animation = 'success-pulse 0.6s ease-out forwards'
    
    // Remove indicator after animation
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator)
      }
    }, 600)
  }
  
  // ===============================
  // PROGRESSIVE DISCLOSURE
  // ===============================
  
  const createProgressiveDisclosure = (
    triggerElement: HTMLElement,
    targetElement: HTMLElement,
    condition: () => boolean
  ) => {
    if (!delightConfig.value.enableProgressiveDisclosure) return
    
    const updateVisibility = async () => {
      if (condition()) {
        targetElement.style.maxHeight = '0'
        targetElement.style.opacity = '0'
        targetElement.style.overflow = 'hidden'
        targetElement.style.transition = `all ${delightConfig.value.animationDuration}ms ease-out`
        
        await nextTick()
        
        targetElement.style.maxHeight = `${targetElement.scrollHeight}px`
        targetElement.style.opacity = '1'
        
        // Reset maxHeight after animation for dynamic content
        setTimeout(() => {
          targetElement.style.maxHeight = 'none'
        }, delightConfig.value.animationDuration)
      } else {
        targetElement.style.transition = `all ${delightConfig.value.animationDuration}ms ease-in`
        targetElement.style.maxHeight = '0'
        targetElement.style.opacity = '0'
      }
    }
    
    // Set up observer
    const observer = new MutationObserver(updateVisibility)
    observer.observe(triggerElement, { attributes: true, childList: true, subtree: true })
    
    // Initial check
    updateVisibility()
    
    return () => observer.disconnect()
  }
  
  // ===============================
  // MAIN API FUNCTIONS
  // ===============================
  
  const celebrateFieldCompletion = async (
    element: HTMLElement,
    fieldName?: string,
    customMessage?: DelightMessage
  ) => {
    if (!canCelebrate.value) return
    
    fieldState.value.isCompleted = true
    fieldState.value.completionScore = 100
    fieldState.value.lastCelebrationTime = Date.now()
    fieldState.value.delightTriggerCount += 1
    
    // Show success message
    const message = customMessage || generateSuccessMessage(fieldName)
    currentMessage.value = message
    
    // Trigger animations
    if (shouldAnimate.value) {
      showCelebration.value = true
      await triggerSpringAnimation(element, 'success')
      
      // Add celebration particles for enhanced delight
      if (delightConfig.value.level === 'enhanced') {
        await triggerCelebrationParticles(element)
      }
      
      // Hide celebration after duration
      setTimeout(() => {
        showCelebration.value = false
      }, delightConfig.value.celebrationDuration)
    }
  }
  
  const showValidationFeedback = async (
    element: HTMLElement,
    isValid: boolean,
    errorMessage?: string,
    fieldName?: string
  ) => {
    fieldState.value.validationState = isValid ? 'valid' : 'invalid'
    fieldState.value.hasBeenTouched = true
    
    if (isValid) {
      // Success feedback
      const message = generateSuccessMessage(fieldName)
      currentMessage.value = message
      
      if (shouldAnimate.value) {
        await triggerSpringAnimation(element, 'success')
      }
      
      // Check for completion celebration
      if (fieldState.value.completionScore >= 100) {
        await celebrateFieldCompletion(element, fieldName)
      }
    } else {
      // Error feedback
      const message = generateErrorMessage('validation', errorMessage)
      currentMessage.value = message
      
      if (shouldAnimate.value) {
        await triggerSpringAnimation(element, 'error')
      }
    }
  }
  
  const updateValidationState = (newState: ValidationState) => {
    fieldState.value.validationState = newState
  }
  
  const setFieldFocus = (focused: boolean) => {
    fieldState.value.isFocused = focused
  }
  
  const updateCompletionScore = (score: number) => {
    const previousScore = fieldState.value.completionScore
    fieldState.value.completionScore = Math.max(0, Math.min(100, score))
    
    // Trigger completion celebration if threshold reached
    if (previousScore < 100 && fieldState.value.completionScore >= 100) {
      // Will be triggered by the next validation cycle
    }
  }
  
  const clearMessages = () => {
    currentMessage.value = null
    showCelebration.value = false
  }
  
  const resetFieldState = () => {
    fieldState.value = {
      validationState: 'idle',
      isCompleted: false,
      isFocused: false,
      hasBeenTouched: false,
      completionScore: 0,
      delightTriggerCount: 0,
      lastCelebrationTime: null
    }
    clearMessages()
  }
  
  // ===============================
  // LIFECYCLE & UTILITIES
  // ===============================
  
  const checkReducedMotionPreference = () => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      prefersReducedMotion.value = mediaQuery.matches
      
      mediaQuery.addEventListener('change', (e) => {
        prefersReducedMotion.value = e.matches
      })
    }
  }
  
  onMounted(() => {
    checkReducedMotionPreference()
  })
  
  // ===============================
  // RETURN API
  // ===============================
  
  return {
    // State
    fieldState,
    currentMessage,
    showCelebration,
    delightConfig,
    
    // Computed
    shouldAnimate,
    delightClasses,
    
    // Core API
    celebrateFieldCompletion,
    showValidationFeedback,
    updateValidationState,
    setFieldFocus,
    updateCompletionScore,
    clearMessages,
    resetFieldState,
    
    // Advanced API
    triggerSpringAnimation,
    triggerCelebrationParticles,
    createProgressiveDisclosure,
    
    // Message API
    generateSuccessMessage,
    generateErrorMessage,
    
    // Utilities
    prefersReducedMotion
  }
}

// ===============================
// SPECIALIZED COMPOSABLES
// ===============================

/**
 * Multi-select specific professional enhancements
 */
export function useMultiSelectDelight(config: Partial<DelightConfig> = {}) {
  const baseDelight = useFormDelight('multiselect', config)
  
  const celebrateSelection = async (element: HTMLElement, selectedCount: number) => {
    let message: DelightMessage
    
    if (selectedCount === 1) {
      message = { type: 'celebration', title: 'Item Selected', message: 'Selection has been applied' }
    } else if (selectedCount === 5) {
      message = { type: 'celebration', title: 'Multiple Selections', message: `${selectedCount} items selected` }
    } else if (selectedCount >= 10) {
      message = { type: 'celebration', title: 'Extensive Selection', message: `${selectedCount} items selected` }
    } else {
      message = DELIGHT_MESSAGES.completion.multiselect[0] // Use the first multiselect message
    }
    
    baseDelight.currentMessage.value = message
    
    if (baseDelight.shouldAnimate.value) {
      await baseDelight.triggerSpringAnimation(element, 'success')
    }
  }
  
  const celebrateBulkOperation = async (element: HTMLElement, operation: 'selectAll' | 'clearAll') => {
    const messages = {
      selectAll: { type: 'celebration' as const, title: 'All Items Selected', message: 'Bulk selection applied' },
      clearAll: { type: 'celebration' as const, title: 'Selection Cleared', message: 'All items deselected' }
    }
    
    baseDelight.currentMessage.value = messages[operation]
    
    if (baseDelight.shouldAnimate.value) {
      await baseDelight.triggerSpringAnimation(element, 'celebration')
    }
  }
  
  return {
    ...baseDelight,
    celebrateSelection,
    celebrateBulkOperation
  }
}

/**
 * Category select specific professional enhancements
 */
export function useCategorySelectDelight(config: Partial<DelightConfig> = {}) {
  const baseDelight = useFormDelight('select', config)
  
  const celebrateCategoryChange = async (element: HTMLElement, category: string) => {
    const categoryMessages = {
      'Protein': { type: 'success' as const, title: 'Category: Protein', message: 'Classification applied for protein products' },
      'Sauce': { type: 'success' as const, title: 'Category: Sauce', message: 'Classification applied for condiment products' },
      'Seasoning': { type: 'success' as const, title: 'Category: Seasoning', message: 'Classification applied for seasoning products' },
      'Beverage': { type: 'success' as const, title: 'Category: Beverage', message: 'Classification applied for beverage products' },
      'Snack': { type: 'success' as const, title: 'Category: Snack', message: 'Classification applied for snack products' },
      'Frozen': { type: 'success' as const, title: 'Category: Frozen', message: 'Classification applied for frozen products' },
      'Dairy': { type: 'success' as const, title: 'Category: Dairy', message: 'Classification applied for dairy products' },
      'Bakery': { type: 'success' as const, title: 'Category: Bakery', message: 'Classification applied for bakery products' },
      'Other': { type: 'success' as const, title: 'Category: Other', message: 'General classification applied' }
    }
    
    const message = categoryMessages[category as keyof typeof categoryMessages] || 
      { type: 'success' as const, title: 'Category Applied', message: 'Product classification has been set' }
    
    baseDelight.currentMessage.value = message
    
    if (baseDelight.shouldAnimate.value) {
      await baseDelight.triggerSpringAnimation(element, 'success')
    }
  }
  
  return {
    ...baseDelight,
    celebrateCategoryChange
  }
}