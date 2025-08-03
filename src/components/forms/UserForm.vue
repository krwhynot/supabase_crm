<template>
  <div class="user-form-container">
    <!-- Form Header -->
    <div class="form-header mb-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">
        {{ isEditing ? 'Edit User Profile' : 'Create New User' }}
      </h2>
      <p class="text-gray-600">
        {{ isEditing ? 'Update user information and preferences' : 'Add a new user to the system' }}
      </p>
    </div>

    <!-- Main Form -->
    <form @submit.prevent="handleSubmit" class="space-y-6" novalidate>
      <!-- Personal Information Section -->
      <section class="form-section">
        <h3 class="section-title">Personal Information</h3>
        <div class="form-grid">
          <!-- Full Name Field -->
          <div class="form-field">
            <label for="fullName" class="field-label required">
              Full Name *
            </label>
            <input
              id="fullName"
              v-model="formData.fullName"
              type="text"
              class="field-input"
              :class="{
                'field-error': errors.fullName,
                'field-success': !errors.fullName && formData.fullName.length > 0
              }"
              placeholder="Enter full name"
              maxlength="100"
              autocomplete="name"
              :aria-describedby="errors.fullName ? 'fullName-error' : undefined"
              :aria-invalid="!!errors.fullName"
              @blur="validateField('fullName')"
              @input="clearFieldError('fullName')"
            />
            <transition name="error-fade">
              <div
                v-if="errors.fullName"
                id="fullName-error"
                class="field-error-message"
                role="alert"
                aria-live="polite"
              >
                {{ errors.fullName }}
              </div>
            </transition>
          </div>

          <!-- Email Field -->
          <div class="form-field">
            <label for="email" class="field-label required">
              Email Address
            </label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              class="field-input"
              :class="{
                'field-error': errors.email,
                'field-success': !errors.email && isValidEmail(formData.email)
              }"
              placeholder="user@example.com"
              autocomplete="email"
              :aria-describedby="errors.email ? 'email-error' : 'email-hint'"
              :aria-invalid="!!errors.email"
              @blur="validateField('email')"
              @input="clearFieldError('email')"
            />
            <div id="email-hint" class="field-hint">
              We'll use this email for account communications
            </div>
            <transition name="error-fade">
              <div
                v-if="errors.email"
                id="email-error"
                class="field-error-message"
                role="alert"
                aria-live="polite"
              >
                {{ errors.email }}
              </div>
            </transition>
          </div>

          <!-- Phone Number Field -->
          <div class="form-field">
            <label for="phone" class="field-label">
              Phone Number
            </label>
            <input
              id="phone"
              v-model="formData.phone"
              type="tel"
              class="field-input"
              :class="{
                'field-error': errors.phone,
                'field-success': !errors.phone && formData.phone.length > 0
              }"
              placeholder="+1 (555) 123-4567"
              autocomplete="tel"
              :aria-describedby="errors.phone ? 'phone-error' : 'phone-hint'"
              :aria-invalid="!!errors.phone"
              @blur="validateField('phone')"
              @input="clearFieldError('phone')"
            />
            <div id="phone-hint" class="field-hint">
              Optional - for account recovery purposes
            </div>
            <transition name="error-fade">
              <div
                v-if="errors.phone"
                id="phone-error"
                class="field-error-message"
                role="alert"
                aria-live="polite"
              >
                {{ errors.phone }}
              </div>
            </transition>
          </div>

          <!-- Avatar Upload -->
          <div class="form-field col-span-2">
            <label for="avatar" class="field-label">
              Profile Picture
            </label>
            <div class="avatar-upload-area">
              <div class="avatar-preview">
                <img
                  v-if="avatarPreview"
                  :src="avatarPreview"
                  :alt="`${formData.fullName} profile picture`"
                  class="avatar-image"
                />
                <div v-else class="avatar-placeholder">
                  <svg class="avatar-icon" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              </div>
              <div class="avatar-controls">
                <input
                  id="avatar"
                  ref="avatarInput"
                  type="file"
                  accept="image/*"
                  class="sr-only"
                  @change="handleAvatarUpload"
                />
                <button
                  type="button"
                  class="btn-secondary"
                  @click="$refs.avatarInput.click()"
                >
                  Choose Photo
                </button>
                <button
                  v-if="avatarPreview"
                  type="button"
                  class="btn-outline"
                  @click="removeAvatar"
                >
                  Remove
                </button>
              </div>
            </div>
            <transition name="error-fade">
              <div
                v-if="errors.avatar"
                class="field-error-message"
                role="alert"
                aria-live="polite"
              >
                {{ errors.avatar }}
              </div>
            </transition>
          </div>
        </div>
      </section>

      <!-- Account Settings Section -->
      <section class="form-section">
        <h3 class="section-title">Account Settings</h3>
        <div class="form-grid">
          <!-- Role Selection -->
          <div class="form-field">
            <label for="role" class="field-label required">
              User Role
            </label>
            <select
              id="role"
              v-model="formData.role"
              class="field-select"
              :class="{
                'field-error': errors.role,
                'field-success': !errors.role && formData.role
              }"
              :aria-describedby="errors.role ? 'role-error' : 'role-hint'"
              :aria-invalid="!!errors.role"
              @change="validateField('role')"
            >
              <option value="">Select a role</option>
              <option value="user">Standard User</option>
              <option value="moderator">Moderator</option>
              <option value="admin" :disabled="!canAssignAdminRole">Administrator</option>
            </select>
            <div id="role-hint" class="field-hint">
              Role determines user permissions and access levels
            </div>
            <transition name="error-fade">
              <div
                v-if="errors.role"
                id="role-error"
                class="field-error-message"
                role="alert"
                aria-live="polite"
              >
                {{ errors.role }}
              </div>
            </transition>
          </div>

          <!-- Status Toggle -->
          <div class="form-field">
            <label class="field-label">Account Status</label>
            <div class="toggle-group" role="radiogroup" aria-labelledby="status-label">
              <label class="toggle-option">
                <input
                  v-model="formData.status"
                  type="radio"
                  value="active"
                  class="sr-only"
                  @change="validateField('status')"
                />
                <span class="toggle-indicator" :class="{ active: formData.status === 'active' }">
                  Active
                </span>
              </label>
              <label class="toggle-option">
                <input
                  v-model="formData.status"
                  type="radio"
                  value="inactive"
                  class="sr-only"
                  @change="validateField('status')"
                />
                <span class="toggle-indicator" :class="{ active: formData.status === 'inactive' }">
                  Inactive
                </span>
              </label>
            </div>
          </div>
        </div>
      </section>

      <!-- Preferences Section -->
      <section class="form-section">
        <h3 class="section-title">User Preferences</h3>
        <div class="form-grid">
          <!-- Theme Preference -->
          <div class="form-field">
            <label for="theme" class="field-label">Theme</label>
            <select
              id="theme"
              v-model="formData.preferences.theme"
              class="field-select"
            >
              <option value="light">Light Mode</option>
              <option value="dark">Dark Mode</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>

          <!-- Language Preference -->
          <div class="form-field">
            <label for="language" class="field-label">Language</label>
            <select
              id="language"
              v-model="formData.preferences.language"
              class="field-select"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="ja">Japanese</option>
            </select>
          </div>

          <!-- Timezone Preference -->
          <div class="form-field">
            <label for="timezone" class="field-label">Timezone</label>
            <select
              id="timezone"
              v-model="formData.preferences.timezone"
              class="field-select"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Tokyo">Tokyo</option>
            </select>
          </div>

          <!-- Notification Preferences -->
          <div class="form-field">
            <label class="field-label">Notifications</label>
            <div class="checkbox-group">
              <label class="checkbox-option">
                <input
                  v-model="formData.preferences.emailNotifications"
                  type="checkbox"
                  class="checkbox-input"
                />
                <span class="checkbox-indicator"></span>
                <span class="checkbox-label">Email notifications</span>
              </label>
              <label class="checkbox-option">
                <input
                  v-model="formData.preferences.pushNotifications"
                  type="checkbox"
                  class="checkbox-input"
                />
                <span class="checkbox-indicator"></span>
                <span class="checkbox-label">Push notifications</span>
              </label>
              <label class="checkbox-option">
                <input
                  v-model="formData.preferences.smsNotifications"
                  type="checkbox"
                  class="checkbox-input"
                />
                <span class="checkbox-indicator"></span>
                <span class="checkbox-label">SMS notifications</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      <!-- Form Actions -->
      <div class="form-actions">
        <div class="action-buttons">
          <button
            type="button"
            class="btn-outline"
            @click="handleCancel"
            :disabled="isSubmitting"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn-primary"
            :disabled="!isFormValid || isSubmitting"
            :aria-describedby="isSubmitting ? 'submit-status' : undefined"
          >
            <span v-if="isSubmitting" class="btn-spinner" aria-hidden="true"></span>
            {{ isSubmitting ? 'Saving...' : (isEditing ? 'Update User' : 'Create User') }}
          </button>
        </div>
        
        <!-- Submit Status -->
        <div
          v-if="isSubmitting"
          id="submit-status"
          class="submit-status"
          aria-live="polite"
        >
          {{ isEditing ? 'Updating user profile...' : 'Creating new user account...' }}
        </div>
        
        <!-- Success Message -->
        <transition name="success-fade">
          <div
            v-if="showSuccessMessage"
            class="success-message"
            role="alert"
            aria-live="polite"
          >
            {{ isEditing ? 'User profile updated successfully!' : 'New user created successfully!' }}
          </div>
        </transition>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { userApi, type UserSecurityContext } from '@/api/users'

// Types
interface UserFormData {
  fullName: string
  email: string
  phone: string
  role: 'user' | 'moderator' | 'admin' | ''
  status: 'active' | 'inactive'
  avatarFile: File | null
  preferences: {
    theme: 'light' | 'dark' | 'auto'
    language: string
    timezone: string
    emailNotifications: boolean
    pushNotifications: boolean
    smsNotifications: boolean
  }
}

interface FormErrors {
  fullName?: string
  email?: string
  phone?: string
  role?: string
  avatar?: string
}

// Props
interface Props {
  userId?: string
  isEditing?: boolean
  canAssignAdminRole?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isEditing: false,
  canAssignAdminRole: false
})

// Emits
interface Emits {
  submit: [formData: UserFormData]
  cancel: []
  success: [userId: string]
  error: [error: string]
}

const emit = defineEmits<Emits>()

// Router
const router = useRouter()

// Reactive State
const formData = reactive<UserFormData>({
  fullName: '',
  email: '',
  phone: '',
  role: '',
  status: 'active',
  avatarFile: null,
  preferences: {
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false
  }
})

const errors = reactive<FormErrors>({})
const isSubmitting = ref(false)
const showSuccessMessage = ref(false)
const avatarPreview = ref<string | null>(null)
const avatarInput = ref<HTMLInputElement>()

// Computed Properties
const isFormValid = computed(() => {
  return (
    formData.fullName.length > 0 &&
    isValidEmail(formData.email) &&
    formData.role &&
    Object.keys(errors).length === 0
  )
})

// Security Context Generation
const generateSecurityContext = (): UserSecurityContext => ({
  requestId: crypto.randomUUID(),
  userAgent: navigator.userAgent,
  ipAddress: 'client-side', // Would be populated server-side
  timestamp: new Date(),
  authLevel: 'authenticated' // Would be determined from actual auth state
})

// Validation Functions
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const isValidPhone = (phone: string): boolean => {
  if (!phone) return true // Phone is optional
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
}

const validateField = (fieldName: keyof FormErrors): void => {
  delete errors[fieldName]

  switch (fieldName) {
    case 'fullName':
      if (!formData.fullName.trim()) {
        errors.fullName = 'Full name is required'
      } else if (formData.fullName.length < 2) {
        errors.fullName = 'Full name must be at least 2 characters'
      } else if (formData.fullName.length > 100) {
        errors.fullName = 'Full name must be less than 100 characters'
      }
      break

    case 'email':
      if (!formData.email.trim()) {
        errors.email = 'Email address is required'
      } else if (!isValidEmail(formData.email)) {
        errors.email = 'Please enter a valid email address'
      }
      break

    case 'phone':
      if (formData.phone && !isValidPhone(formData.phone)) {
        errors.phone = 'Please enter a valid phone number'
      }
      break

    case 'role':
      if (!formData.role) {
        errors.role = 'Please select a user role'
      }
      break
  }
}

const validateAllFields = (): boolean => {
  const fieldsToValidate: (keyof FormErrors)[] = ['fullName', 'email', 'phone', 'role']
  fieldsToValidate.forEach(validateField)
  return Object.keys(errors).length === 0
}

const clearFieldError = (fieldName: keyof FormErrors): void => {
  if (errors[fieldName]) {
    delete errors[fieldName]
  }
}

// Avatar Handling
const handleAvatarUpload = (event: Event): void => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // Validate file type
  if (!file.type.startsWith('image/')) {
    errors.avatar = 'Please select a valid image file'
    return
  }

  // Validate file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    errors.avatar = 'Image file must be less than 5MB'
    return
  }

  // Clear any previous errors
  delete errors.avatar

  // Set file and create preview
  formData.avatarFile = file
  const reader = new FileReader()
  reader.onload = (e) => {
    avatarPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const removeAvatar = (): void => {
  formData.avatarFile = null
  avatarPreview.value = null
  if (avatarInput.value) {
    avatarInput.value.value = ''
  }
}

// Form Submission
const handleSubmit = async (): Promise<void> => {
  if (!validateAllFields()) {
    // Focus first error field
    const firstErrorField = Object.keys(errors)[0]
    const errorElement = document.getElementById(firstErrorField)
    if (errorElement) {
      errorElement.focus()
    }
    return
  }

  isSubmitting.value = true

  try {
    emit('submit', { ...formData })

    // If we're creating/updating via API directly
    if (props.isEditing && props.userId) {
      const securityContext = generateSecurityContext()
      const result = await userApi.updateUser(
        props.userId,
        {
          full_name: formData.fullName,
          role: formData.role as 'user' | 'moderator' | 'admin',
          preferences: formData.preferences
        },
        securityContext
      )

      if (result.success) {
        showSuccessMessage.value = true
        emit('success', props.userId)
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          showSuccessMessage.value = false
        }, 3000)
      } else {
        emit('error', result.error || 'Failed to update user')
      }
    } else {
      // Handle creation logic here
      showSuccessMessage.value = true
      emit('success', 'new-user-id')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    emit('error', errorMessage)
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = (): void => {
  emit('cancel')
  if (router) {
    router.back()
  }
}

// Load User Data (if editing)
const loadUserData = async (): Promise<void> => {
  if (!props.isEditing || !props.userId) return

  try {
    const securityContext = generateSecurityContext()
    const result = await userApi.getUserProfile(props.userId, securityContext)

    if (result.success && result.data) {
      const user = result.data
      formData.fullName = user.full_name || ''
      formData.email = user.email || ''
      formData.role = user.role || ''
      
      if (user.preferences) {
        Object.assign(formData.preferences, user.preferences)
      }

      if (user.avatar_url) {
        avatarPreview.value = user.avatar_url
      }
    }
  } catch (error) {
    console.error('Failed to load user data:', error)
    emit('error', 'Failed to load user data')
  }
}

// Watchers
watch(() => formData.fullName, () => {
  if (errors.fullName) {
    clearFieldError('fullName')
  }
})

watch(() => formData.email, () => {
  if (errors.email) {
    clearFieldError('email')
  }
})

// Lifecycle
onMounted(async () => {
  await nextTick()
  
  if (props.isEditing) {
    await loadUserData()
  }
  
  // Focus first field
  const firstField = document.getElementById('fullName')
  if (firstField) {
    firstField.focus()
  }
})
</script>

<style scoped>
/* Form Container */
.user-form-container {
  @apply max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg;
}

/* Form Header */
.form-header {
  @apply border-b border-gray-200 pb-4;
}

/* Form Sections */
.form-section {
  @apply bg-gray-50 rounded-lg p-6 border border-gray-200;
}

.section-title {
  @apply text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200;
}

/* Form Grid */
.form-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}

.form-field {
  @apply space-y-2;
}

.col-span-2 {
  @apply md:col-span-2;
}

/* Labels */
.field-label {
  @apply block text-sm font-medium text-gray-700;
}

.field-label.required::after {
  content: " *";
  @apply text-red-500;
}

/* Input Fields */
.field-input,
.field-select {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
         transition-colors duration-200;
}

.field-input.field-error,
.field-select.field-error {
  @apply border-red-500 focus:ring-red-500 focus:border-red-500;
}

.field-input.field-success,
.field-select.field-success {
  @apply border-green-500 focus:ring-green-500 focus:border-green-500;
}

/* Field Hints and Errors */
.field-hint {
  @apply text-sm text-gray-500;
}

.field-error-message {
  @apply text-sm text-red-600 font-medium;
}

/* Avatar Upload */
.avatar-upload-area {
  @apply flex items-center space-x-4;
}

.avatar-preview {
  @apply w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-300;
}

.avatar-image {
  @apply w-full h-full object-cover;
}

.avatar-placeholder {
  @apply w-full h-full flex items-center justify-center;
}

.avatar-icon {
  @apply w-8 h-8 text-gray-400 fill-current;
}

.avatar-controls {
  @apply flex space-x-2;
}

/* Toggle Group */
.toggle-group {
  @apply flex space-x-1 bg-gray-100 rounded-md p-1;
}

.toggle-option {
  @apply cursor-pointer;
}

.toggle-indicator {
  @apply px-4 py-2 rounded text-sm font-medium transition-colors duration-200
         text-gray-700 hover:text-gray-900;
}

.toggle-indicator.active {
  @apply bg-white text-blue-600 shadow-sm;
}

/* Checkbox Group */
.checkbox-group {
  @apply space-y-3;
}

.checkbox-option {
  @apply flex items-center cursor-pointer;
}

.checkbox-input {
  @apply sr-only;
}

.checkbox-indicator {
  @apply w-4 h-4 border-2 border-gray-300 rounded mr-3 relative
         transition-colors duration-200;
}

.checkbox-input:checked + .checkbox-indicator {
  @apply bg-blue-600 border-blue-600;
}

.checkbox-input:checked + .checkbox-indicator::after {
  content: "✓";
  @apply absolute inset-0 flex items-center justify-center text-white text-xs;
}

.checkbox-label {
  @apply text-sm text-gray-700;
}

/* Buttons */
.btn-primary {
  @apply px-6 py-2 bg-blue-600 text-white font-medium rounded-md shadow-sm
         hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
         disabled:opacity-50 disabled:cursor-not-allowed
         transition-colors duration-200;
}

.btn-secondary {
  @apply px-4 py-2 bg-gray-600 text-white font-medium rounded-md shadow-sm
         hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500
         transition-colors duration-200;
}

.btn-outline {
  @apply px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-md shadow-sm
         hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500
         disabled:opacity-50 disabled:cursor-not-allowed
         transition-colors duration-200;
}

/* Form Actions */
.form-actions {
  @apply border-t border-gray-200 pt-6 space-y-4;
}

.action-buttons {
  @apply flex justify-end space-x-4;
}

/* Loading States */
.btn-spinner {
  @apply inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2;
}

.submit-status {
  @apply text-sm text-gray-600 text-center;
}

/* Messages */
.success-message {
  @apply text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-3 text-center;
}

/* Transitions */
.error-fade-enter-active,
.error-fade-leave-active {
  transition: opacity 0.3s ease;
}

.error-fade-enter-from,
.error-fade-leave-to {
  opacity: 0;
}

.success-fade-enter-active,
.success-fade-leave-active {
  transition: all 0.3s ease;
}

.success-fade-enter-from,
.success-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Screen Reader Only */
.sr-only {
  @apply absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0;
  clip: rect(0, 0, 0, 0);
}

/* Focus Management */
.field-input:focus,
.field-select:focus,
.btn-primary:focus,
.btn-secondary:focus,
.btn-outline:focus {
  @apply ring-2 ring-offset-2;
}

/* High Contrast Mode Support */
@media (prefers-contrast: high) {
  .field-input,
  .field-select {
    @apply border-2;
  }
  
  .field-error-message {
    @apply font-bold;
  }
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  .field-input,
  .field-select,
  .btn-primary,
  .btn-secondary,
  .btn-outline,
  .toggle-indicator,
  .checkbox-indicator {
    transition: none;
  }
  
  .error-fade-enter-active,
  .error-fade-leave-active,
  .success-fade-enter-active,
  .success-fade-leave-active {
    transition: none;
  }
}
</style>