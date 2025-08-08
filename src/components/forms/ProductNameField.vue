<template>
  <div class="product-name-field">
    <label :for="`input-${name}`" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>
    <div class="relative">
      <input
        :id="`input-${name}`"
        v-model="internalValue"
        type="text"
        :required="required"
        :placeholder="placeholder"
        :class="inputClasses"
        :aria-invalid="!!error"
        :aria-describedby="error ? `error-${name}` : description ? `desc-${name}` : undefined"
        @blur="handleBlur"
        @input="handleInput"
      />
      
      <!-- Validation Status Icon -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="scale-0 opacity-0 rotate-180"
        enter-to-class="scale-100 opacity-100 rotate-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="scale-100 opacity-100 rotate-0"
        leave-to-class="scale-0 opacity-0 rotate-180"
      >
        <div v-if="showValidationIcon && validationStatus !== 'idle'" class="absolute inset-y-0 right-0 flex items-center pr-3">
          <CheckCircleIcon 
            v-if="validationStatus === 'valid'" 
            class="h-5 w-5 text-green-500 animate-bounce-once validation-success" 
          />
          <ExclamationCircleIcon 
            v-else-if="validationStatus === 'invalid'" 
            class="h-5 w-5 text-red-500 animate-shake validation-error" 
          />
          <div 
            v-else-if="validationStatus === 'checking'" 
            class="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full validation-checking"
          ></div>
        </div>
      </Transition>
    </div>
    
    <!-- Description -->
    <p
      v-if="description && !error"
      :id="`desc-${name}`"
      class="mt-1 text-sm text-gray-500"
    >
      {{ description }}
    </p>
    
    <!-- Error Message -->
    <p
      v-if="error"
      :id="`error-${name}`"
      class="mt-1 text-sm text-red-600"
      role="alert"
    >
      {{ error }}
    </p>
    
    <!-- Name Suggestions -->
    <Transition
      enter-active-class="transition-all duration-400 ease-out"
      enter-from-class="opacity-0 transform translate-y-2 scale-95"
      enter-to-class="opacity-100 transform translate-y-0 scale-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 transform translate-y-0 scale-100"
      leave-to-class="opacity-0 transform translate-y-2 scale-95"
    >
      <div v-if="showSuggestions && suggestions.length > 0" class="mt-2 suggestions-container">
        <div class="text-sm text-gray-700 mb-2 flex items-center">
          <span class="animate-pulse mr-2">💡</span>
          Suggestions:
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="(suggestion, index) in suggestions.slice(0, 3)"
            :key="suggestion"
            type="button"
            @click="applySuggestion(suggestion)"
            class="suggestion-button inline-flex items-center px-3 py-2 text-xs font-medium rounded-lg text-blue-700 bg-gradient-to-r from-blue-100 to-blue-50 hover:from-blue-200 hover:to-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transform transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md"
            :style="{ animationDelay: `${index * 100}ms` }"
          >
            <span class="mr-1">✨</span>
            {{ suggestion }}
          </button>
        </div>
      </div>
    </Transition>
    
    <!-- Character Count -->
    <div v-if="showCharacterCount" class="mt-1 text-right">
      <span 
        class="text-xs transition-colors duration-200"
        :class="{
          'text-gray-500': characterCount <= maxLength * 0.8,
          'text-yellow-600': characterCount > maxLength * 0.8 && characterCount <= maxLength * 0.9,
          'text-orange-600': characterCount > maxLength * 0.9 && characterCount < maxLength,
          'text-red-600 font-medium animate-pulse': characterCount >= maxLength
        }"
      >
        <span class="character-counter">{{ characterCount }}</span>/<span>{{ maxLength }}</span>
        <span v-if="characterCount >= maxLength" class="ml-1">⚠️</span>
        <span v-else-if="characterCount > maxLength * 0.9" class="ml-1">⚡</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import { debounce } from 'lodash-es'

interface Props {
  name: string
  label: string
  modelValue: string
  error?: string
  required?: boolean
  placeholder?: string
  description?: string
  showValidationIcon?: boolean
  showSuggestions?: boolean
  showCharacterCount?: boolean
  maxLength?: number
  validateUniqueness?: boolean
  suggestions?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  placeholder: 'Enter product name...',
  showValidationIcon: true,
  showSuggestions: false,
  showCharacterCount: true,
  maxLength: 200,
  validateUniqueness: true,
  suggestions: () => []
})

interface Emits {
  'update:modelValue': [value: string]
  'blur': [value: string]
  'validation-changed': [isValid: boolean, error?: string]
}

const emit = defineEmits<Emits>()

// ===============================
// REACTIVE STATE
// ===============================

const internalValue = ref(props.modelValue)
const validationStatus = ref<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
const validationError = ref<string | null>(null)
const hasBeenBlurred = ref(false)

// ===============================
// COMPUTED PROPERTIES
// ===============================

const characterCount = computed(() => internalValue.value.length)

const inputClasses = computed(() => {
  const base = 'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200'
  const errorClasses = 'border-red-500 focus:ring-red-500 focus:border-red-500'
  const validClasses = validationStatus.value === 'valid' ? 'border-green-500 focus:ring-green-500 focus:border-green-500' : ''
  const normalClasses = 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
  
  if (props.error || validationError.value) {
    return `${base} ${errorClasses}`
  } else if (validationStatus.value === 'valid') {
    return `${base} ${validClasses}`
  } else {
    return `${base} ${normalClasses}`
  }
})

// ===============================
// VALIDATION LOGIC
// ===============================

/**
 * Validate product name format and constraints
 */
const validateName = (value: string): string | null => {
  // Basic validation
  if (props.required && !value.trim()) {
    return 'Product name is required'
  }
  
  if (value.length < 2) {
    return 'Name must be at least 2 characters'
  }
  
  if (value.length > props.maxLength) {
    return `Name must be less than ${props.maxLength} characters`
  }
  
  // Check for invalid characters
  if (!/^[a-zA-Z0-9\s\-_&.()]+$/.test(value)) {
    return 'Name contains invalid characters'
  }
  
  return null
}

/**
 * Check if product name is unique (simulated)
 */
const checkNameUniqueness = async (value: string): Promise<string | null> => {
  if (!props.validateUniqueness || !value.trim()) return null
  
  // Simulate API call to check uniqueness
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Mock uniqueness check - in real implementation, this would call an API
  const existingNames = ['Sample Product', 'Test Product', 'Demo Item']
  if (existingNames.some(name => name.toLowerCase() === value.toLowerCase())) {
    return 'A product with this name already exists'
  }
  
  return null
}

/**
 * Perform complete validation including uniqueness check
 */
const performValidation = async (value: string): Promise<void> => {
  if (!hasBeenBlurred.value) return
  
  validationStatus.value = 'checking'
  validationError.value = null
  
  // Basic validation
  const formatError = validateName(value)
  if (formatError) {
    validationStatus.value = 'invalid'
    validationError.value = formatError
    emit('validation-changed', false, formatError)
    return
  }
  
  // Uniqueness validation
  if (props.validateUniqueness && value.trim()) {
    const uniquenessError = await checkNameUniqueness(value)
    if (uniquenessError) {
      validationStatus.value = 'invalid'
      validationError.value = uniquenessError
      emit('validation-changed', false, uniquenessError)
      return
    }
  }
  
  // All validations passed
  validationStatus.value = 'valid'
  emit('validation-changed', true)
}

// Debounced validation to avoid excessive API calls
const debouncedValidation = debounce(performValidation, 300)

// ===============================
// EVENT HANDLERS
// ===============================

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  internalValue.value = target.value
  emit('update:modelValue', target.value)
  
  // Reset validation status on input
  if (hasBeenBlurred.value) {
    validationStatus.value = 'idle'
    validationError.value = null
    debouncedValidation(target.value)
  }
}

const handleBlur = () => {
  hasBeenBlurred.value = true
  emit('blur', internalValue.value)
  
  // Trigger validation on blur
  performValidation(internalValue.value)
}

const applySuggestion = (suggestion: string) => {
  internalValue.value = suggestion
  emit('update:modelValue', suggestion)
  
  // Trigger validation for the suggestion
  nextTick(() => {
    performValidation(suggestion)
  })
}

// ===============================
// WATCHERS
// ===============================

// Watch for external prop changes
watch(() => props.modelValue, (newValue) => {
  if (newValue !== internalValue.value) {
    internalValue.value = newValue
  }
})

// Watch for error prop changes
watch(() => props.error, (newError) => {
  if (newError) {
    validationStatus.value = 'invalid'
    validationError.value = null // Let prop error take precedence
  } else if (!validationError.value) {
    validationStatus.value = 'idle'
  }
})
</script>

<style scoped>
.product-name-field {
  @apply relative;
}

/* Input focus enhancements */
.product-name-field input {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.product-name-field input:focus {
  animation: input-focus-glow 0.4s ease-out;
}

@keyframes input-focus-glow {
  0% { 
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
  50% { 
    transform: scale(1.01);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  }
  100% { 
    transform: scale(1);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
}

/* Validation animations */
.validation-success {
  animation: validation-success 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes validation-success {
  0% { 
    transform: scale(0) rotate(180deg);
    opacity: 0;
  }
  60% { 
    transform: scale(1.2) rotate(0deg);
    opacity: 1;
  }
  100% { 
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.validation-error {
  animation: validation-error 0.5s ease-in-out;
}

@keyframes validation-error {
  0%, 100% { transform: translateX(0) scale(1); }
  20% { transform: translateX(-3px) scale(1.05); }
  40% { transform: translateX(3px) scale(1.05); }
  60% { transform: translateX(-2px) scale(1.05); }
  80% { transform: translateX(2px) scale(1.05); }
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

.validation-checking {
  animation: checking-pulse 1.5s ease-in-out infinite;
}

@keyframes checking-pulse {
  0%, 100% { 
    opacity: 1;
    transform: scale(1);
  }
  50% { 
    opacity: 0.6;
    transform: scale(1.1);
  }
}

/* Bounce animation for icons and suggestions */
.animate-bounce-once {
  animation: bounce-once 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes bounce-once {
  0% { transform: translateY(0) scale(1); }
  40% { transform: translateY(-4px) scale(1.1); }
  70% { transform: translateY(-2px) scale(1.05); }
  100% { transform: translateY(0) scale(1); }
}

/* Suggestions container animations */
.suggestions-container {
  animation: suggestions-entrance 0.4s ease-out;
}

@keyframes suggestions-entrance {
  0% {
    opacity: 0;
    transform: translateY(10px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Suggestion button enhancements */
.suggestion-button {
  animation: suggestion-slide-in 0.3s ease-out forwards;
  opacity: 0;
  transform: translateY(10px);
}

@keyframes suggestion-slide-in {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.suggestion-button:hover {
  animation: suggestion-excitement 0.3s ease-in-out;
}

@keyframes suggestion-excitement {
  0% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.05) rotate(1deg); }
  75% { transform: scale(1.05) rotate(-1deg); }
  100% { transform: scale(1.05) rotate(0deg); }
}

.suggestion-button:active {
  animation: suggestion-select 0.2s ease-in-out;
}

@keyframes suggestion-select {
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

/* Character counter animations */
.character-counter {
  animation: counter-update 0.3s ease-in-out;
}

@keyframes counter-update {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); color: theme('colors.blue.600'); }
  100% { transform: scale(1); }
}

/* Loading animation enhancement */
.animate-spin {
  animation: enhanced-spin 1s linear infinite;
}

@keyframes enhanced-spin {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.05); }
  100% { transform: rotate(360deg) scale(1); }
}

/* Focus within styling */
.product-name-field:focus-within .suggestions-container {
  animation: focus-highlight 0.3s ease-out;
}

@keyframes focus-highlight {
  0% { opacity: 0.8; }
  100% { opacity: 1; }
}

/* Input validation states */
.product-name-field input.border-green-500 {
  animation: input-success 0.4s ease-out;
}

@keyframes input-success {
  0% { 
    border-color: theme('colors.gray.300');
    background-color: white;
  }
  50% { 
    border-color: theme('colors.green.400');
    background-color: theme('colors.green.50');
  }
  100% { 
    border-color: theme('colors.green.500');
    background-color: white;
  }
}

.product-name-field input.border-red-500 {
  animation: input-error 0.4s ease-out;
}

@keyframes input-error {
  0% { 
    border-color: theme('colors.gray.300');
    transform: translateX(0);
  }
  25% { 
    border-color: theme('colors.red.400');
    transform: translateX(-2px);
  }
  75% { 
    border-color: theme('colors.red.400');
    transform: translateX(2px);
  }
  100% { 
    border-color: theme('colors.red.500');
    transform: translateX(0);
  }
}

/* Responsive design */
@media (max-width: 640px) {
  .suggestions-container .flex {
    @apply flex-col gap-1;
  }
  
  .suggestion-button {
    @apply w-full justify-center py-3;
  }

  .product-name-field input:focus {
    animation: none; /* Reduce animation on mobile for performance */
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .product-name-field input {
    @apply border-2;
  }
  
  .product-name-field input:focus {
    @apply border-4;
    box-shadow: 0 0 0 2px currentColor;
  }

  .validation-success,
  .validation-error {
    filter: contrast(1.5);
  }
}

/* Reduced motion accessibility */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .product-name-field input:focus {
    animation: none;
    box-shadow: 0 0 0 2px theme('colors.primary.500');
  }
  
  .suggestion-button:hover {
    transform: scale(1.02);
  }
  
  /* Keep essential feedback */
  .validation-success,
  .validation-error {
    animation: none;
    transform: scale(1);
  }
}

/* Print styles */
@media print {
  .suggestions-container,
  .character-counter {
    @apply hidden;
  }
  
  .validation-success,
  .validation-error {
    animation: none;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .product-name-field input:focus {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4);
  }
  
  .suggestion-button {
    @apply bg-gray-800 border border-gray-600 text-gray-200;
  }
  
  .suggestion-button:hover {
    @apply bg-gray-700 border-gray-500;
  }
}
</style>