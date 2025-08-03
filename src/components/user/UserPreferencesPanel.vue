<template>
  <div class="user-preferences-panel">
    <!-- Header -->
    <div class="panel-header">
      <h2 class="panel-title">User Preferences</h2>
      <p class="panel-description">
        Customize your experience and notification settings
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <div class="spinner" aria-label="Loading preferences"></div>
      <p>Loading your preferences...</p>
    </div>

    <!-- Preferences Content -->
    <div v-else class="preferences-content">
      <!-- Category Tabs -->
      <div class="category-tabs" role="tablist">
        <button
          v-for="category in categories"
          :key="category.id"
          :class="['tab-button', { active: selectedCategory === category.id }]"
          role="tab"
          :aria-selected="selectedCategory === category.id"
          :aria-controls="`panel-${category.id}`"
          @click="selectCategory(category.id)"
        >
          <Icon :name="category.icon" class="tab-icon" />
          {{ category.name }}
        </button>
      </div>

      <!-- Preference Panels -->
      <div class="preference-panels">
        <!-- Appearance Panel -->
        <div
          v-if="selectedCategory === 'appearance'"
          id="panel-appearance"
          class="preference-panel"
          role="tabpanel"
        >
          <h3 class="panel-section-title">Theme & Appearance</h3>
          
          <div class="preference-group">
            <label class="preference-label">
              Theme Preference
            </label>
            <div class="theme-selector">
              <button
                v-for="theme in themeOptions"
                :key="theme.value"
                :class="['theme-option', { selected: preferences.theme === theme.value }]"
                @click="updatePreference('theme', theme.value)"
              >
                <Icon :name="theme.icon" class="theme-icon" />
                <span>{{ theme.label }}</span>
              </button>
            </div>
          </div>

          <div class="preference-group">
            <label for="language" class="preference-label">
              Language
            </label>
            <select
              id="language"
              v-model="preferences.language"
              class="preference-select"
              @change="updatePreference('language', $event.target.value)"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>

          <div class="preference-group">
            <label for="timezone" class="preference-label">
              Timezone
            </label>
            <select
              id="timezone"
              v-model="preferences.timezone"
              class="preference-select"
              @change="updatePreference('timezone', $event.target.value)"
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
        </div>

        <!-- Notifications Panel -->
        <div
          v-if="selectedCategory === 'notifications'"
          id="panel-notifications"
          class="preference-panel"
          role="tabpanel"
        >
          <h3 class="panel-section-title">Notification Settings</h3>
          
          <div class="notification-channels">
            <div
              v-for="channel in notificationChannels"
              :key="channel.channel"
              class="channel-group"
            >
              <div class="channel-header">
                <Icon :name="channel.icon" class="channel-icon" />
                <h4 class="channel-title">{{ channel.title }}</h4>
                <label class="toggle-switch">
                  <input
                    type="checkbox"
                    :checked="channel.is_enabled"
                    @change="toggleNotificationChannel(channel.channel, $event.target.checked)"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              
              <div v-if="channel.is_enabled" class="channel-settings">
                <div class="frequency-setting">
                  <label class="setting-label">Frequency</label>
                  <select
                    :value="channel.frequency"
                    class="frequency-select"
                    @change="updateChannelFrequency(channel.channel, $event.target.value)"
                  >
                    <option value="immediate">Immediate</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                
                <div v-if="channel.channel === 'email'" class="quiet-hours">
                  <label class="setting-label">Quiet Hours</label>
                  <div class="time-range">
                    <input
                      type="time"
                      :value="channel.quiet_hours_start"
                      @change="updateQuietHours(channel.channel, 'start', $event.target.value)"
                    />
                    <span>to</span>
                    <input
                      type="time"
                      :value="channel.quiet_hours_end"
                      @change="updateQuietHours(channel.channel, 'end', $event.target.value)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Privacy Panel -->
        <div
          v-if="selectedCategory === 'privacy'"
          id="panel-privacy"
          class="preference-panel"
          role="tabpanel"
        >
          <h3 class="panel-section-title">Privacy & Data</h3>
          
          <div class="privacy-options">
            <div class="privacy-setting">
              <label class="privacy-label">
                <input
                  type="checkbox"
                  v-model="privacySettings.analytics_enabled"
                  @change="updatePrivacySetting('analytics_enabled', $event.target.checked)"
                />
                <span class="privacy-checkbox"></span>
                Allow usage analytics
              </label>
              <p class="privacy-description">
                Help us improve the app by sharing anonymous usage data
              </p>
            </div>
            
            <div class="privacy-setting">
              <label class="privacy-label">
                <input
                  type="checkbox"
                  v-model="privacySettings.marketing_enabled"
                  @change="updatePrivacySetting('marketing_enabled', $event.target.checked)"
                />
                <span class="privacy-checkbox"></span>
                Marketing communications
              </label>
              <p class="privacy-description">
                Receive updates about new features and product announcements
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Save Actions -->
      <div class="panel-actions">
        <button
          class="btn-secondary"
          @click="resetToDefaults"
          :disabled="isSaving"
        >
          Reset to Defaults
        </button>
        <button
          class="btn-primary"
          @click="savePreferences"
          :disabled="isSaving || !hasChanges"
        >
          <span v-if="isSaving" class="spinner-small"></span>
          {{ isSaving ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </div>

    <!-- Success Message -->
    <transition name="fade">
      <div v-if="showSuccessMessage" class="success-toast">
        <Icon name="check-circle" class="success-icon" />
        Preferences saved successfully!
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import type { 
  UserPreferenceCategory, 
  UserPreferences, 
  NotificationPreference 
} from '@/types/user'
import { userPreferencesApi } from '@/services/userPreferencesApi'
import Icon from '@/components/ui/Icon.vue'

// Props
interface Props {
  userId: string
}

const props = defineProps<Props>()

// Reactive State
const isLoading = ref(true)
const isSaving = ref(false)
const showSuccessMessage = ref(false)
const selectedCategory = ref('appearance')

const categories = ref<UserPreferenceCategory[]>([])
const preferences = reactive<UserPreferences>({
  theme: 'light',
  notifications: true,
  language: 'en',
  timezone: 'UTC'
})

const notificationChannels = ref<NotificationPreference[]>([])
const privacySettings = reactive({
  analytics_enabled: true,
  marketing_enabled: false
})

// Constants
const themeOptions = [
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'auto', label: 'Auto', icon: 'computer' }
]

// Computed
const hasChanges = computed(() => {
  // Would implement change detection logic
  return true
})

// Methods
const selectCategory = (categoryId: string) => {
  selectedCategory.value = categoryId
}

const updatePreference = async (key: keyof UserPreferences, value: any) => {
  preferences[key] = value
  // Auto-save implementation would go here
}

const toggleNotificationChannel = async (channel: string, enabled: boolean) => {
  const channelSettings = notificationChannels.value.find(c => c.channel === channel)
  if (channelSettings) {
    channelSettings.is_enabled = enabled
  }
}

const updateChannelFrequency = async (channel: string, frequency: string) => {
  const channelSettings = notificationChannels.value.find(c => c.channel === channel)
  if (channelSettings) {
    channelSettings.frequency = frequency as any
  }
}

const updateQuietHours = async (channel: string, type: 'start' | 'end', time: string) => {
  const channelSettings = notificationChannels.value.find(c => c.channel === channel)
  if (channelSettings) {
    if (type === 'start') {
      channelSettings.quiet_hours_start = time
    } else {
      channelSettings.quiet_hours_end = time
    }
  }
}

const updatePrivacySetting = async (key: string, value: boolean) => {
  privacySettings[key] = value
}

const savePreferences = async () => {
  isSaving.value = true
  try {
    await userPreferencesApi.updateUserPreferences(props.userId, {
      preferences,
      notificationChannels: notificationChannels.value,
      privacySettings
    })
    
    showSuccessMessage.value = true
    setTimeout(() => {
      showSuccessMessage.value = false
    }, 3000)
  } catch (error) {
    console.error('Failed to save preferences:', error)
  } finally {
    isSaving.value = false
  }
}

const resetToDefaults = async () => {
  if (confirm('Are you sure you want to reset all preferences to defaults?')) {
    // Reset logic would go here
  }
}

const loadUserPreferences = async () => {
  try {
    const [categoriesResponse, preferencesResponse, notificationsResponse] = await Promise.all([
      userPreferencesApi.getPreferenceCategories(),
      userPreferencesApi.getUserPreferences(props.userId),
      userPreferencesApi.getNotificationPreferences(props.userId)
    ])
    
    if (categoriesResponse.data) {
      categories.value = categoriesResponse.data
    }
    
    if (preferencesResponse.data) {
      Object.assign(preferences, preferencesResponse.data)
    }
    
    if (notificationsResponse.data) {
      notificationChannels.value = notificationsResponse.data
    }
  } catch (error) {
    console.error('Failed to load preferences:', error)
  } finally {
    isLoading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadUserPreferences()
})
</script>

<style scoped>
/* Component styles would go here */
.user-preferences-panel {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 p-6;
}

.panel-header {
  @apply mb-6 pb-4 border-b border-gray-200;
}

.panel-title {
  @apply text-2xl font-bold text-gray-900 mb-2;
}

.panel-description {
  @apply text-gray-600;
}

.loading-container {
  @apply flex flex-col items-center justify-center py-12;
}

.category-tabs {
  @apply flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6;
}

.tab-button {
  @apply flex items-center space-x-2 px-4 py-2 rounded-md font-medium text-sm transition-colors;
}

.tab-button.active {
  @apply bg-white text-blue-600 shadow-sm;
}

.preference-panel {
  @apply space-y-6;
}

.preference-group {
  @apply space-y-3;
}

.preference-label {
  @apply block text-sm font-medium text-gray-700;
}

.theme-selector {
  @apply flex space-x-3;
}

.theme-option {
  @apply flex flex-col items-center space-y-2 p-3 border rounded-lg transition-colors;
}

.theme-option.selected {
  @apply border-blue-500 bg-blue-50;
}

.notification-channels {
  @apply space-y-4;
}

.channel-group {
  @apply border border-gray-200 rounded-lg p-4;
}

.channel-header {
  @apply flex items-center justify-between;
}

.toggle-switch {
  @apply relative inline-block w-12 h-6;
}

.toggle-slider {
  @apply absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 rounded-full transition-colors;
}

.panel-actions {
  @apply flex justify-end space-x-3 pt-6 border-t border-gray-200;
}

.btn-primary, .btn-secondary {
  @apply px-4 py-2 rounded-md font-medium transition-colors;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50;
}

.btn-secondary {
  @apply border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50;
}

.success-toast {
  @apply fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>