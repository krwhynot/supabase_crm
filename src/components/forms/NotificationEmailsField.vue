<template>
  <div class="notification-emails-field">
    <label class="block text-sm font-medium text-gray-700 mb-2">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>

    <!-- Description -->
    <p v-if="description" class="text-sm text-gray-500 mb-3">
      {{ description }}
    </p>

    <!-- Email Input -->
    <div class="flex space-x-2 mb-3">
      <div class="flex-1 relative">
        <input
          ref="emailInput"
          v-model="currentEmail"
          type="email"
          placeholder="Enter email address..."
          :class="[
            'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200',
            emailInputError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          ]"
          @keydown.enter.prevent="addEmail"
          @keydown.comma.prevent="addEmail"
          @input="handleEmailInput"
          @blur="validateCurrentEmail"
          :aria-invalid="!!emailInputError"
          :aria-describedby="emailInputError ? 'email-input-error' : undefined"
        />
        <div v-if="isValidatingEmail" class="absolute inset-y-0 right-0 flex items-center pr-3">
          <div class="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
        </div>
      </div>
      <button
        type="button"
        @click="addEmail"
        :disabled="!canAddEmail"
        :class="[
          'px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200',
          canAddEmail
            ? 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            : 'text-gray-400 bg-gray-100 cursor-not-allowed'
        ]"
      >
        <PlusIcon class="h-4 w-4" />
      </button>
    </div>

    <!-- Email Input Error -->
    <p v-if="emailInputError" id="email-input-error" class="text-sm text-red-600 mb-3">
      {{ emailInputError }}
    </p>

    <!-- Email Tags -->
    <div v-if="internalEmails.length > 0" class="mb-3">
      <div class="flex flex-wrap gap-2">
        <div
          v-for="(email, index) in internalEmails"
          :key="`${email}-${index}`"
          class="email-tag inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
        >
          <EnvelopeIcon class="h-3 w-3 mr-1.5 text-blue-600" />
          <span>{{ email }}</span>
          <button
            type="button"
            @click="removeEmail(index)"
            class="ml-2 inline-flex items-center p-0.5 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150"
            :aria-label="`Remove ${email}`"
          >
            <XMarkIcon class="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>

    <!-- Email Suggestions -->
    <div v-if="showSuggestions && emailSuggestions.length > 0" class="mb-3">
      <div class="text-xs text-gray-600 mb-2">Suggestions:</div>
      <div class="flex flex-wrap gap-1">
        <button
          v-for="suggestion in emailSuggestions"
          :key="suggestion"
          type="button"
          @click="addEmailFromSuggestion(suggestion)"
          class="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150"
        >
          {{ suggestion }}
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="internalEmails.length === 0 && showEmptyState" class="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <EnvelopeIcon class="h-8 w-8 text-gray-400 mx-auto mb-2" />
      <p class="text-sm text-gray-500 mb-1">No notification emails added</p>
      <p class="text-xs text-gray-400">Enter an email address and press Enter or click the + button</p>
    </div>

    <!-- Email Count and Limit -->
    <div v-if="showCount" class="flex items-center justify-between text-xs text-gray-500 mt-2">
      <span>{{ internalEmails.length }} email{{ internalEmails.length !== 1 ? 's' : '' }} added</span>
      <span v-if="maxEmails">{{ internalEmails.length }}/{{ maxEmails }} emails</span>
    </div>

    <!-- Error Message -->
    <p v-if="error" class="mt-2 text-sm text-red-600" role="alert">
      {{ error }}
    </p>

    <!-- Guidelines -->
    <div v-if="showGuidelines" class="mt-4 p-3 bg-blue-50 rounded-lg">
      <div class="text-sm text-blue-800">
        <div class="font-medium mb-1">Email Guidelines:</div>
        <ul class="text-xs space-y-1 text-blue-700">
          <li>• Add multiple emails to notify different team members</li>
          <li>• Use work emails for important product notifications</li>
          <li>• Press Enter or comma after typing an email to add it</li>
          <li>• All emails will receive notifications about product updates</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { PlusIcon, EnvelopeIcon, XMarkIcon } from '@heroicons/vue/24/outline'
// Native debounce implementation to replace lodash-es dependency
function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>): void => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

interface Props {
  modelValue: string[]
  label?: string
  required?: boolean
  description?: string
  error?: string
  placeholder?: string
  maxEmails?: number
  showSuggestions?: boolean
  showEmptyState?: boolean
  showCount?: boolean
  showGuidelines?: boolean
  suggestions?: string[]
  validateDomain?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Notification Emails',
  required: false,
  description: 'Team members to notify about product changes and updates',
  placeholder: 'Enter email address...',
  maxEmails: 10,
  showSuggestions: true,
  showEmptyState: true,
  showCount: true,
  showGuidelines: true,
  suggestions: () => [],
  validateDomain: false
})

interface Emits {
  'update:modelValue': [emails: string[]]
  'emails-changed': [emails: string[]]
  'validation-changed': [isValid: boolean, error?: string]
}

const emit = defineEmits<Emits>()

// ===============================
// REACTIVE STATE
// ===============================

const internalEmails = ref<string[]>([...props.modelValue])
const currentEmail = ref('')
const emailInputError = ref<string | null>(null)
const isValidatingEmail = ref(false)
const emailInput = ref<HTMLInputElement>()

// ===============================
// COMPUTED PROPERTIES
// ===============================

const canAddEmail = computed(() => {
  return (
    currentEmail.value.trim() &&
    !emailInputError.value &&
    !internalEmails.value.includes(currentEmail.value.trim().toLowerCase()) &&
    (props.maxEmails ? internalEmails.value.length < props.maxEmails : true)
  )
})

const emailSuggestions = computed(() => {
  return props.suggestions.filter(suggestion => 
    !internalEmails.value.includes(suggestion.toLowerCase()) &&
    suggestion.toLowerCase().includes(currentEmail.value.toLowerCase())
  ).slice(0, 5)
})

const isValid = computed(() => {
  if (props.required && internalEmails.value.length === 0) {
    return false
  }
  return internalEmails.value.every(email => isValidEmail(email))
})

// ===============================
// VALIDATION FUNCTIONS
// ===============================

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const isValidDomain = async (email: string): Promise<boolean> => {
  if (!props.validateDomain) return true
  
  // Mock domain validation - in real implementation, this might check against a list
  // of valid domains or use a service to validate domains
  const domain = email.split('@')[1]
  const blockedDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com']
  
  return !blockedDomains.includes(domain.toLowerCase())
}

const validateEmail = async (email: string): Promise<string | null> => {
  const trimmedEmail = email.trim().toLowerCase()
  
  if (!trimmedEmail) {
    return 'Email address is required'
  }
  
  if (!isValidEmail(trimmedEmail)) {
    return 'Please enter a valid email address'
  }
  
  if (internalEmails.value.includes(trimmedEmail)) {
    return 'This email has already been added'
  }
  
  if (props.maxEmails && internalEmails.value.length >= props.maxEmails) {
    return `Maximum of ${props.maxEmails} emails allowed`
  }
  
  if (props.validateDomain) {
    isValidatingEmail.value = true
    const isDomainValid = await isValidDomain(trimmedEmail)
    isValidatingEmail.value = false
    
    if (!isDomainValid) {
      return 'Please use a valid business email domain'
    }
  }
  
  return null
}

const validateCurrentEmail = async () => {
  if (!currentEmail.value.trim()) {
    emailInputError.value = null
    return
  }
  
  emailInputError.value = await validateEmail(currentEmail.value)
}

// Debounced validation to avoid excessive API calls
const debouncedValidateCurrentEmail = debounce(validateCurrentEmail, 300)

// ===============================
// EVENT HANDLERS
// ===============================

const handleEmailInput = () => {
  if (currentEmail.value.trim()) {
    emailInputError.value = null
    debouncedValidateCurrentEmail()
  }
}

const addEmail = async () => {
  const trimmedEmail = currentEmail.value.trim().toLowerCase()
  
  if (!trimmedEmail) return
  
  const error = await validateEmail(trimmedEmail)
  if (error) {
    emailInputError.value = error
    return
  }
  
  // Add the email
  internalEmails.value.push(trimmedEmail)
  currentEmail.value = ''
  emailInputError.value = null
  
  // Focus back to input
  await nextTick()
  emailInput.value?.focus()
  
  emitChanges()
}

const addEmailFromSuggestion = (email: string) => {
  if (!internalEmails.value.includes(email.toLowerCase())) {
    internalEmails.value.push(email.toLowerCase())
    emitChanges()
  }
}

const removeEmail = (index: number) => {
  internalEmails.value.splice(index, 1)
  emitChanges()
}

const emitChanges = () => {
  emit('update:modelValue', [...internalEmails.value])
  emit('emails-changed', [...internalEmails.value])
  emitValidation()
}

const emitValidation = () => {
  const valid = isValid.value
  const error = props.required && internalEmails.value.length === 0 
    ? 'At least one notification email is required'
    : undefined
    
  emit('validation-changed', valid, error)
}

// ===============================
// WATCHERS
// ===============================

watch(() => props.modelValue, (newValue) => {
  if (JSON.stringify(newValue) !== JSON.stringify(internalEmails.value)) {
    internalEmails.value = [...newValue]
    emitValidation()
  }
}, { deep: true })

watch(internalEmails, () => {
  emitValidation()
}, { deep: true })

// Initial validation
emitValidation()
</script>

<style scoped>
.notification-emails-field {
  @apply relative;
}

/* Email tag animations */
.email-tag {
  @apply transition-all duration-200 ease-in-out;
}

.email-tag:hover {
  @apply shadow-sm transform scale-105;
}

/* Loading animation */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Suggestion button animations */
.notification-emails-field button {
  @apply transition-all duration-150 ease-in-out;
}

.notification-emails-field button:hover {
  @apply transform scale-105;
}

.notification-emails-field button:active {
  @apply transform scale-95;
}

/* Focus states */
.notification-emails-field input:focus,
.notification-emails-field button:focus {
  @apply outline-none ring-2;
}

/* Email tag enter/leave animations */
.email-enter-active,
.email-leave-active {
  transition: all 0.3s ease-in-out;
}

.email-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.9);
}

.email-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.9);
}

/* Responsive design */
@media (max-width: 640px) {
  .notification-emails-field .flex {
    @apply flex-col space-x-0 space-y-2;
  }
  
  .email-tag {
    @apply text-xs px-2 py-1;
  }
  
  .notification-emails-field button {
    @apply w-full justify-center;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .email-tag {
    @apply border-2 border-blue-400;
  }
  
  .notification-emails-field input {
    @apply border-2;
  }
  
  .notification-emails-field input:focus {
    @apply border-4;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .notification-emails-field *,
  .email-tag {
    transition: none !important;
    animation: none !important;
  }
}

/* Print styles */
@media print {
  .notification-emails-field button,
  .notification-emails-field .guidelines {
    @apply hidden;
  }
  
  .email-tag {
    @apply border border-gray-400 bg-white text-black;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .email-tag {
    @apply bg-blue-800 text-blue-200 border-blue-700;
  }
  
  .notification-emails-field input {
    @apply bg-gray-700 border-gray-600 text-white;
  }
  
  .empty-state {
    @apply bg-gray-800 border-gray-600;
  }
}

/* Validation states */
.validation-error {
  @apply border-red-300 bg-red-50;
}

.validation-success {
  @apply border-green-300 bg-green-50;
}

/* Email input enhancements */
.email-input-wrapper {
  @apply relative;
}

.email-input-icon {
  @apply absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400;
}

.email-input-with-icon {
  @apply pl-10;
}

/* Loading overlay */
.loading-overlay {
  @apply absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-md;
}

/* Custom scrollbar for long email lists */
.email-list::-webkit-scrollbar {
  width: 6px;
}

.email-list::-webkit-scrollbar-track {
  @apply bg-gray-100 rounded;
}

.email-list::-webkit-scrollbar-thumb {
  @apply bg-gray-400 rounded;
}

.email-list::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-500;
}

/* Accessibility enhancements */
.email-tag button:focus {
  @apply outline-none ring-2 ring-blue-500 ring-offset-1;
}

/* Animation for validation feedback */
.validation-feedback-enter-active,
.validation-feedback-leave-active {
  transition: all 0.3s ease-in-out;
}

.validation-feedback-enter-from {
  opacity: 0;
  transform: translateY(-5px);
}

.validation-feedback-leave-to {
  opacity: 0;
  transform: translateY(5px);
}
</style>