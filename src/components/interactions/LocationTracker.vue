<template>
  <div class="location-tracker">
    <!-- Location Input Field -->
    <div class="relative">
      <input
        ref="locationInput"
        v-model="internalLocation"
        type="text"
        :placeholder="placeholder"
        :class="[
          'w-full px-4 py-3 pr-12 text-base border border-gray-300 rounded-lg',
          'focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors',
          error && 'border-red-300 focus:ring-red-500',
          isDetecting && 'bg-blue-50 border-blue-300'
        ]"
        @input="handleInput"
        @focus="handleFocus"
      />
      
      <!-- GPS Detection Button -->
      <button
        @click="detectLocation"
        type="button"
        :disabled="isDetecting || !isGeolocationSupported"
        :class="[
          'absolute right-3 top-1/2 transform -translate-y-1/2 touch-target p-2 rounded-full',
          'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
          isDetecting
            ? 'bg-blue-500 text-white animate-pulse focus:ring-blue-500'
            : isGeolocationSupported
              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 focus:ring-gray-500'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        ]"
        :aria-label="isDetecting ? 'Detecting location...' : 'Detect current location'"
        :title="getGpsButtonTitle()"
      >
        <svg v-if="isDetecting" class="h-5 w-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>

    <!-- Location Status -->
    <div v-if="statusMessage" class="mt-2 flex items-start space-x-2">
      <svg v-if="statusType === 'error'" class="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      <svg v-else-if="statusType === 'success'" class="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
      </svg>
      <svg v-else class="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
      </svg>
      <p :class="[
        'text-sm',
        statusType === 'error' ? 'text-red-600' : statusType === 'success' ? 'text-green-600' : 'text-blue-600'
      ]">
        {{ statusMessage }}
      </p>
    </div>

    <!-- Location Details -->
    <div v-if="currentLocation && showDetails" class="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
      <h4 class="text-sm font-medium text-gray-900 mb-2">Location Details</h4>
      <div class="space-y-2 text-sm text-gray-600">
        <div class="flex justify-between">
          <span>Address:</span>
          <span class="font-medium text-right">{{ currentLocation.address || 'Not available' }}</span>
        </div>
        <div v-if="currentLocation.coordinates" class="flex justify-between">
          <span>Coordinates:</span>
          <span class="font-mono text-xs">
            {{ currentLocation.coordinates.lat.toFixed(6) }}, {{ currentLocation.coordinates.lng.toFixed(6) }}
          </span>
        </div>
        <div v-if="currentLocation.accuracy" class="flex justify-between">
          <span>Accuracy:</span>
          <span>±{{ Math.round(currentLocation.accuracy) }}m</span>
        </div>
        <div v-if="currentLocation.timestamp" class="flex justify-between">
          <span>Detected:</span>
          <span>{{ formatTimestamp(currentLocation.timestamp) }}</span>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="mt-3 flex space-x-2">
        <button
          @click="copyCoordinates"
          type="button"
          class="flex-1 px-3 py-2 text-xs bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Copy Coordinates
        </button>
        <button
          @click="openInMaps"
          type="button"
          class="flex-1 px-3 py-2 text-xs bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          Open in Maps
        </button>
      </div>
    </div>

    <!-- Accuracy Indicator -->
    <div v-if="currentLocation?.accuracy && showAccuracy" class="mt-2">
      <div class="flex items-center justify-between text-xs text-gray-600 mb-1">
        <span>Location Accuracy</span>
        <span>{{ getAccuracyLabel(currentLocation.accuracy) }}</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div
          :class="[
            'h-2 rounded-full transition-all duration-500',
            getAccuracyColorClass(currentLocation.accuracy)
          ]"
          :style="{ width: `${getAccuracyPercentage(currentLocation.accuracy)}%` }"
        />
      </div>
    </div>

    <!-- Error Display -->
    <p v-if="error" class="mt-2 text-sm text-red-600">{{ error }}</p>

    <!-- Permission Help -->
    <div v-if="showPermissionHelp" class="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
      <h4 class="text-sm font-medium text-yellow-800 mb-2">Location Permission Required</h4>
      <p class="text-sm text-yellow-700 mb-3">
        To automatically detect your location, please allow location access when prompted.
      </p>
      <div class="text-xs text-yellow-600 space-y-1">
        <p><strong>Chrome/Safari:</strong> Click the location icon in the address bar</p>
        <p><strong>Mobile:</strong> Check your browser settings for location permissions</p>
      </div>
      <button
        @click="showPermissionHelp = false"
        class="mt-2 text-xs text-yellow-600 hover:text-yellow-800 underline"
      >
        Got it
      </button>
    </div>
  </div>
</template>

<!--
  LocationTracker - GPS location tracking component for field interactions
  
  Features:
  - Automatic GPS location detection using Geolocation API
  - Manual location input with address support
  - Location accuracy indicators and validation
  - Reverse geocoding for human-readable addresses
  - Privacy-conscious with user permission handling
  - Offline caching of recent locations
  - Integration with device maps application
  - Touch-optimized mobile interface
  
  Privacy & Permissions:
  - Only requests location when user initiates
  - Clear permission prompts and help
  - No data sent to external services (except geocoding)
  - User can always manually enter location
  
  Accuracy Levels:
  - High: < 10m (GPS)
  - Medium: 10-100m (Network)
  - Low: > 100m (IP-based)
  
  Browser Support:
  - All modern browsers support Geolocation API
  - Fallback to manual input always available
  - HTTPS required for location access
-->

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

/**
 * Location data interface
 */
interface LocationData {
  address: string
  coordinates?: {
    lat: number
    lng: number
  }
  accuracy?: number
  timestamp?: number
}

/**
 * Component props
 */
interface Props {
  /** Location value (v-model) */
  modelValue: string
  /** Placeholder text */
  placeholder?: string
  /** Error message */
  error?: string
  /** Auto-detect location on mount */
  autoDetect?: boolean
  /** Show location details panel */
  showDetails?: boolean
  /** Show accuracy indicator */
  showAccuracy?: boolean
  /** Enable location caching */
  enableCaching?: boolean
  /** Geocoding service API key (optional) */
  geocodingApiKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Enter location or detect automatically...',
  autoDetect: false,
  showDetails: true,
  showAccuracy: true,
  enableCaching: true
})

/**
 * Component emits
 */
interface Emits {
  /** v-model update */
  'update:modelValue': [value: string]
  /** Location detected successfully */
  'location-detected': [location: LocationData]
  /** Location detection error */
  'location-error': [error: string]
  /** User denied location permission */
  'permission-denied': []
}

const emit = defineEmits<Emits>()

// ===============================
// REACTIVE STATE
// ===============================

const locationInput = ref<HTMLInputElement>()
const isGeolocationSupported = ref(false)
const isDetecting = ref(false)
const currentLocation = ref<LocationData | null>(null)
const statusMessage = ref('')
const statusType = ref<'info' | 'success' | 'error'>('info')
const showPermissionHelp = ref(false)

// Location cache for offline use
const locationCache = ref<LocationData[]>([])

// ===============================
// COMPUTED PROPERTIES
// ===============================

const internalLocation = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// ===============================
// GEOLOCATION DETECTION
// ===============================

const detectLocation = async () => {
  if (!isGeolocationSupported.value) {
    setStatus('Location detection not supported in this browser', 'error')
    return
  }
  
  if (isDetecting.value) {
    return
  }
  
  isDetecting.value = true
  setStatus('Detecting your location...', 'info')
  
  try {
    // Request high accuracy location
    const position = await getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000 // 1 minute
    })
    
    const coordinates = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    }
    
    // Try to get human-readable address
    const address = await reverseGeocode(coordinates)
    
    const locationData: LocationData = {
      address: address || `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`,
      coordinates,
      accuracy: position.coords.accuracy,
      timestamp: Date.now()
    }
    
    currentLocation.value = locationData
    internalLocation.value = locationData.address
    
    // Cache location for offline use
    if (props.enableCaching) {
      cacheLocation(locationData)
    }
    
    setStatus(`Location detected with ${Math.round(position.coords.accuracy)}m accuracy`, 'success')
    emit('location-detected', locationData)
    
  } catch (error) {
    console.error('Location detection error:', error)
    handleLocationError(error as GeolocationPositionError)
  } finally {
    isDetecting.value = false
  }
}

const getCurrentPosition = (options: PositionOptions): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  })
}

// ===============================
// REVERSE GEOCODING
// ===============================

const reverseGeocode = async (coordinates: { lat: number; lng: number }): Promise<string | null> => {
  try {
    // Try browser's built-in reverse geocoding first (limited support)
    if ('geocoder' in window) {
      // This is a placeholder - browser geocoding APIs are limited
      // In production, you might use a service like:
      // - Google Geocoding API
      // - Mapbox Geocoding API
      // - OpenStreetMap Nominatim
    }
    
    // Fallback to a free geocoding service (for demo purposes)
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coordinates.lat}&longitude=${coordinates.lng}&localityLanguage=en`
    )
    
    if (response.ok) {
      const data = await response.json()
      
      // Build address from components
      const parts = []
      if (data.locality) parts.push(data.locality)
      if (data.principalSubdivision) parts.push(data.principalSubdivision)
      if (data.countryName) parts.push(data.countryName)
      
      return parts.join(', ') || null
    }
    
  } catch (error) {
    console.warn('Reverse geocoding failed:', error)
  }
  
  return null
}

// ===============================
// ERROR HANDLING
// ===============================

const handleLocationError = (error: GeolocationPositionError) => {
  let errorMessage = 'Failed to detect location'
  let showHelp = false
  
  switch (error.code) {
    case error.PERMISSION_DENIED:
      errorMessage = 'Location access denied. Please enable location permissions.'
      showHelp = true
      emit('permission-denied')
      break
    case error.POSITION_UNAVAILABLE:
      errorMessage = 'Location information unavailable. Please enter manually.'
      break
    case error.TIMEOUT:
      errorMessage = 'Location detection timed out. Please try again.'
      break
    default:
      errorMessage = 'Location detection failed. Please enter manually.'
  }
  
  setStatus(errorMessage, 'error')
  showPermissionHelp.value = showHelp
  emit('location-error', errorMessage)
}

// ===============================
// HELPER METHODS
// ===============================

const setStatus = (message: string, type: 'info' | 'success' | 'error') => {
  statusMessage.value = message
  statusType.value = type
  
  // Auto-clear success/info messages
  if (type !== 'error') {
    setTimeout(() => {
      if (statusMessage.value === message) {
        statusMessage.value = ''
      }
    }, 3000)
  }
}

const getGpsButtonTitle = (): string => {
  if (!isGeolocationSupported.value) {
    return 'Location detection not supported'
  }
  if (isDetecting.value) {
    return 'Detecting location...'
  }
  return 'Detect current location'
}

const getAccuracyLabel = (accuracy: number): string => {
  if (accuracy < 10) return 'High'
  if (accuracy < 100) return 'Medium'
  return 'Low'
}

const getAccuracyColorClass = (accuracy: number): string => {
  if (accuracy < 10) return 'bg-green-500'
  if (accuracy < 100) return 'bg-yellow-500'
  return 'bg-red-500'
}

const getAccuracyPercentage = (accuracy: number): number => {
  // Convert accuracy to percentage (inverse relationship)
  // Perfect accuracy (0m) = 100%, 100m+ = 10%
  const maxAccuracy = 200
  const percentage = Math.max(10, 100 - (accuracy / maxAccuracy) * 90)
  return Math.min(100, percentage)
}

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}

// ===============================
// LOCATION ACTIONS
// ===============================

const copyCoordinates = async () => {
  if (!currentLocation.value?.coordinates) return
  
  const coords = currentLocation.value.coordinates
  const coordsText = `${coords.lat}, ${coords.lng}`
  
  try {
    await navigator.clipboard.writeText(coordsText)
    setStatus('Coordinates copied to clipboard', 'success')
  } catch (error) {
    console.warn('Failed to copy coordinates:', error)
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = coordsText
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    setStatus('Coordinates copied to clipboard', 'success')
  }
}

const openInMaps = () => {
  if (!currentLocation.value?.coordinates) return
  
  const coords = currentLocation.value.coordinates
  const url = `https://maps.google.com/maps?q=${coords.lat},${coords.lng}`
  
  // Open in new tab/window
  window.open(url, '_blank')
}

// ===============================
// CACHING
// ===============================

const cacheLocation = (location: LocationData) => {
  // Add to cache, keeping only recent locations
  locationCache.value.unshift(location)
  locationCache.value = locationCache.value.slice(0, 10) // Keep last 10
  
  // Persist to localStorage
  try {
    localStorage.setItem('crm-location-cache', JSON.stringify(locationCache.value))
  } catch (error) {
    console.warn('Failed to cache location:', error)
  }
}

const loadLocationCache = () => {
  try {
    const cached = localStorage.getItem('crm-location-cache')
    if (cached) {
      locationCache.value = JSON.parse(cached)
    }
  } catch (error) {
    console.warn('Failed to load location cache:', error)
    locationCache.value = []
  }
}

// ===============================
// EVENT HANDLERS
// ===============================

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  internalLocation.value = target.value
  
  // Clear current location data when manually editing
  if (currentLocation.value && target.value !== currentLocation.value.address) {
    currentLocation.value = null
  }
}

const handleFocus = () => {
  if (props.autoDetect && isGeolocationSupported.value && !currentLocation.value) {
    setTimeout(() => detectLocation(), 500)
  }
}

// ===============================
// LIFECYCLE
// ===============================

onMounted(() => {
  // Check geolocation support
  isGeolocationSupported.value = 'geolocation' in navigator
  
  // Load cached locations
  if (props.enableCaching) {
    loadLocationCache()
  }
  
  // Auto-detect if requested
  if (props.autoDetect && isGeolocationSupported.value) {
    detectLocation()
  }
})

// Watch for prop changes
watch(() => props.autoDetect, (newValue) => {
  if (newValue && isGeolocationSupported.value && !currentLocation.value) {
    detectLocation()
  }
})

// Expose public methods
defineExpose({
  detectLocation,
  getCurrentLocation: () => currentLocation.value,
  clearLocation: () => {
    currentLocation.value = null
    internalLocation.value = ''
  },
  isDetecting: () => isDetecting.value
})
</script>

<style scoped>
.location-tracker {
  @apply relative;
}

.touch-target {
  @apply min-h-[44px] min-w-[44px];
}

/* Animation for accuracy bar */
.accuracy-bar {
  transition: width 0.5s ease-in-out;
}

/* Focus styles */
button:focus-visible,
input:focus-visible {
  @apply outline-none ring-2 ring-primary-500 ring-offset-2;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .location-tracker input {
    @apply text-base; /* Prevent zoom on iOS */
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .animate-pulse,
  .animate-spin {
    animation: none;
  }
  
  .accuracy-bar {
    transition: none;
  }
}
</style>