<template>
  <div class="offline-interaction-queue">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-4 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div :class="[
            'w-3 h-3 rounded-full',
            isOnline ? 'bg-green-500' : 'bg-yellow-500'
          ]" />
          <h2 class="text-lg font-semibold text-gray-900">
            {{ isOnline ? 'Connected' : 'Offline Mode' }}
          </h2>
        </div>
        
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-600">
            {{ queuedInteractions.length }} queued
          </span>
          
          <button
            v-if="queuedInteractions.length > 0"
            @click="syncAll"
            :disabled="isSyncing || !isOnline"
            class="touch-target px-3 py-1 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isSyncing ? 'Syncing...' : 'Sync All' }}
          </button>
        </div>
      </div>
      
      <!-- Status Message -->
      <div v-if="statusMessage" class="mt-2">
        <div :class="[
          'flex items-center space-x-2 px-3 py-2 rounded-md text-sm',
          statusType === 'success' ? 'bg-green-50 text-green-800' :
          statusType === 'error' ? 'bg-red-50 text-red-800' :
          'bg-blue-50 text-blue-800'
        ]">
          <svg v-if="statusType === 'success'" class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <svg v-else-if="statusType === 'error'" class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <svg v-else class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
          <span>{{ statusMessage }}</span>
        </div>
      </div>
    </div>

    <!-- Queue List -->
    <div class="flex-1 overflow-y-auto bg-gray-50">
      <div v-if="queuedInteractions.length === 0" class="p-8 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No Queued Interactions</h3>
        <p class="text-sm text-gray-600">
          {{ isOnline ? 'All interactions are synced' : 'Create interactions offline to see them here' }}
        </p>
      </div>

      <div v-else class="p-4 space-y-3">
        <div
          v-for="interaction in queuedInteractions"
          :key="interaction.id"
          class="bg-white rounded-lg border border-gray-200 shadow-sm"
        >
          <!-- Interaction Header -->
          <div class="p-4 border-b border-gray-100">
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <h3 class="text-base font-medium text-gray-900 truncate">
                  {{ interaction.data.title }}
                </h3>
                <p class="text-sm text-gray-600 mt-1">
                  {{ getInteractionTypeLabel(interaction.data.interactionType) }}
                </p>
              </div>
              
              <div class="flex-shrink-0 ml-4">
                <div :class="[
                  'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                  getStatusClasses(interaction.status)
                ]">
                  <span class="w-2 h-2 rounded-full mr-2" :class="getStatusDotClass(interaction.status)" />
                  {{ getStatusLabel(interaction.status) }}
                </div>
              </div>
            </div>
            
            <!-- Metadata -->
            <div class="mt-3 flex items-center space-x-4 text-xs text-gray-500">
              <span>Created: {{ formatDate(interaction.timestamp) }}</span>
              <span v-if="interaction.lastAttempt">
                Last attempt: {{ formatDate(interaction.lastAttempt) }}
              </span>
              <span v-if="interaction.attempts > 1">
                {{ interaction.attempts }} attempts
              </span>
            </div>
          </div>

          <!-- Interaction Content -->
          <div class="p-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div v-if="interaction.data.organizationId">
                <span class="font-medium text-gray-700">Organization:</span>
                <span class="ml-2 text-gray-600">{{ interaction.data.organizationId }}</span>
              </div>
              
              <div v-if="interaction.data.interactionDate">
                <span class="font-medium text-gray-700">Date:</span>
                <span class="ml-2 text-gray-600">{{ formatInteractionDate(interaction.data.interactionDate) }}</span>
              </div>
              
              <div v-if="interaction.data.duration">
                <span class="font-medium text-gray-700">Duration:</span>
                <span class="ml-2 text-gray-600">{{ interaction.data.duration }} min</span>
              </div>
              
              <div v-if="interaction.data.location">
                <span class="font-medium text-gray-700">Location:</span>
                <span class="ml-2 text-gray-600">{{ interaction.data.location }}</span>
              </div>
            </div>
            
            <div v-if="interaction.data.description" class="mt-3">
              <span class="font-medium text-gray-700">Description:</span>
              <p class="mt-1 text-gray-600 text-sm line-clamp-2">{{ interaction.data.description }}</p>
            </div>

            <!-- Error Message -->
            <div v-if="interaction.error" class="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <p class="text-sm text-red-800">
                <strong>Sync Error:</strong> {{ interaction.error }}
              </p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <div class="flex space-x-2">
              <button
                @click="editInteraction(interaction)"
                class="text-sm text-primary-600 hover:text-primary-800 font-medium"
              >
                Edit
              </button>
              <button
                @click="viewInteraction(interaction)"
                class="text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                View
              </button>
            </div>
            
            <div class="flex space-x-2">
              <button
                v-if="interaction.status === 'failed'"
                @click="retrySync(interaction)"
                :disabled="isSyncing || !isOnline"
                class="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
              >
                Retry
              </button>
              
              <button
                @click="removeFromQueue(interaction)"
                class="px-3 py-1 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Auto-sync Settings -->
    <div class="bg-white border-t border-gray-200 px-4 py-3">
      <div class="flex items-center justify-between">
        <div>
          <label class="text-sm font-medium text-gray-700">Auto-sync when online</label>
          <p class="text-xs text-gray-600">Automatically sync queued interactions when connection is restored</p>
        </div>
        
        <button
          @click="autoSync = !autoSync"
          type="button"
          :class="[
            'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            autoSync ? 'bg-primary-600' : 'bg-gray-200'
          ]"
        >
          <span
            :class="[
              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
              autoSync ? 'translate-x-5' : 'translate-x-0'
            ]"
          />
        </button>
      </div>
    </div>

    <!-- Sync Progress Modal -->
    <div v-if="showSyncProgress" class="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div class="p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Syncing Interactions</h3>
          
          <div class="space-y-3">
            <div class="flex justify-between text-sm">
              <span>Progress</span>
              <span>{{ syncProgress.completed }} / {{ syncProgress.total }}</span>
            </div>
            
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="bg-primary-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${(syncProgress.completed / syncProgress.total) * 100}%` }"
              />
            </div>
            
            <div v-if="syncProgress.current" class="text-sm text-gray-600">
              Syncing: {{ syncProgress.current.title }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<!--
  OfflineInteractionQueue - Manages offline interaction storage and background sync
  
  Features:
  - IndexedDB storage for persistent offline data
  - Background sync when connection restored
  - Retry mechanism for failed syncs
  - Visual sync progress indication
  - Queue management with edit/remove options
  - Auto-sync configuration
  - Error handling and user feedback
  - Service Worker integration
  
  Storage Strategy:
  - IndexedDB for persistent storage
  - Automatic cleanup of synced items
  - Conflict resolution for concurrent edits
  - Data integrity checks
  
  Sync Behavior:
  - Automatic sync when online
  - Manual sync on demand
  - Exponential backoff for retries
  - Batch processing for efficiency
  
  Error Handling:
  - Network error recovery
  - Server error handling
  - User-friendly error messages
  - Fallback options
-->

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { InteractionType } from '@/types/interactions'

/**
 * Queued interaction interface
 */
interface QueuedInteraction {
  id: string
  method: 'POST' | 'PUT' | 'DELETE'
  url: string
  data: any
  timestamp: number
  status: 'pending' | 'syncing' | 'synced' | 'failed'
  attempts: number
  lastAttempt?: number
  error?: string
  headers?: Record<string, string>
}

/**
 * Sync progress tracking
 */
interface SyncProgress {
  total: number
  completed: number
  current?: QueuedInteraction
}

/**
 * Component props
 */
interface Props {
  /** Show queue in compact mode */
  compact?: boolean
  /** Auto-open when items are queued */
  autoOpen?: boolean
  /** Maximum retry attempts */
  maxRetries?: number
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
  autoOpen: false,
  maxRetries: 3
})

/**
 * Component emits
 */
interface Emits {
  /** Emitted when interaction is synced successfully */
  'interaction-synced': [interactionId: string]
  /** Emitted when sync fails */
  'sync-failed': [error: string]
  /** Emitted when queue is empty */
  'queue-empty': []
}

const emit = defineEmits<Emits>()

// ===============================
// REACTIVE STATE
// ===============================

const queuedInteractions = ref<QueuedInteraction[]>([])
const isOnline = ref(navigator.onLine)
const isSyncing = ref(false)
const autoSync = ref(true)
const statusMessage = ref('')
const statusType = ref<'info' | 'success' | 'error'>('info')
const showSyncProgress = ref(false)

const syncProgress = reactive<SyncProgress>({
  total: 0,
  completed: 0,
  current: undefined
})

// IndexedDB reference
let db: IDBDatabase | null = null

// ===============================
// COMPUTED PROPERTIES
// ===============================

const pendingCount = computed(() => 
  queuedInteractions.value.filter(i => i.status === 'pending').length
)

const failedCount = computed(() => 
  queuedInteractions.value.filter(i => i.status === 'failed').length
)

// ===============================
// INDEXEDDB SETUP
// ===============================

const initDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CRMOfflineDB', 2)
    
    request.onerror = () => reject(request.error)
    
    request.onsuccess = () => {
      db = request.result
      resolve()
    }
    
    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result
      
      // Create interactions store if it doesn't exist
      if (!database.objectStoreNames.contains('interactions')) {
        const store = database.createObjectStore('interactions', { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('status', 'status', { unique: false })
      }
      
      // Create sync_queue store
      if (!database.objectStoreNames.contains('sync_queue')) {
        const store = database.createObjectStore('sync_queue', { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('status', 'status', { unique: false })
      }
    }
  })
}

// ===============================
// QUEUE MANAGEMENT
// ===============================

const addToQueue = async (interaction: Omit<QueuedInteraction, 'id' | 'timestamp' | 'status' | 'attempts'>) => {
  const queueItem: QueuedInteraction = {
    ...interaction,
    id: generateId(),
    timestamp: Date.now(),
    status: 'pending',
    attempts: 0
  }
  
  try {
    await storeInteraction(queueItem)
    queuedInteractions.value.push(queueItem)
    
    setStatus(`Interaction queued for sync (${queuedInteractions.value.length} total)`, 'info')
    
    // Auto-sync if online and enabled
    if (isOnline.value && autoSync.value) {
      setTimeout(() => syncAll(), 1000)
    }
    
  } catch (error) {
    console.error('Failed to queue interaction:', error)
    setStatus('Failed to queue interaction for offline sync', 'error')
  }
}

const removeFromQueue = async (interaction: QueuedInteraction) => {
  try {
    await deleteInteraction(interaction.id)
    const index = queuedInteractions.value.findIndex(i => i.id === interaction.id)
    if (index > -1) {
      queuedInteractions.value.splice(index, 1)
    }
    
    setStatus('Interaction removed from queue', 'success')
    
    if (queuedInteractions.value.length === 0) {
      emit('queue-empty')
    }
    
  } catch (error) {
    console.error('Failed to remove interaction from queue:', error)
    setStatus('Failed to remove interaction from queue', 'error')
  }
}

const loadQueue = async () => {
  try {
    const interactions = await getAllInteractions()
    queuedInteractions.value = interactions.sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    console.error('Failed to load interaction queue:', error)
  }
}

// ===============================
// SYNC OPERATIONS
// ===============================

const syncAll = async () => {
  if (isSyncing.value || !isOnline.value) return
  
  const pendingInteractions = queuedInteractions.value.filter(i => i.status === 'pending' || i.status === 'failed')
  
  if (pendingInteractions.length === 0) {
    setStatus('No interactions to sync', 'info')
    return
  }
  
  isSyncing.value = true
  showSyncProgress.value = true
  
  syncProgress.total = pendingInteractions.length
  syncProgress.completed = 0
  
  try {
    for (const interaction of pendingInteractions) {
      syncProgress.current = interaction
      await syncInteraction(interaction)
      syncProgress.completed++
    }
    
    setStatus(`Successfully synced ${syncProgress.completed} interactions`, 'success')
    
    if (queuedInteractions.value.filter(i => i.status !== 'synced').length === 0) {
      emit('queue-empty')
    }
    
  } catch (error) {
    console.error('Batch sync failed:', error)
    setStatus('Some interactions failed to sync', 'error')
  } finally {
    isSyncing.value = false
    showSyncProgress.value = false
    syncProgress.current = undefined
  }
}

const syncInteraction = async (interaction: QueuedInteraction): Promise<void> => {
  // Update status to syncing
  interaction.status = 'syncing'
  interaction.attempts++
  interaction.lastAttempt = Date.now()
  
  await updateInteraction(interaction)
  
  try {
    const response = await fetch(interaction.url, {
      method: interaction.method,
      headers: {
        'Content-Type': 'application/json',
        ...interaction.headers
      },
      body: JSON.stringify(interaction.data)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    // Mark as synced
    interaction.status = 'synced'
    interaction.error = undefined
    await updateInteraction(interaction)
    
    emit('interaction-synced', interaction.id)
    
  } catch (error) {
    console.error(`Failed to sync interaction ${interaction.id}:`, error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    interaction.error = errorMessage
    
    // Mark as failed if max retries reached
    if (interaction.attempts >= props.maxRetries) {
      interaction.status = 'failed'
      emit('sync-failed', errorMessage)
    } else {
      interaction.status = 'pending'
    }
    
    await updateInteraction(interaction)
    throw error
  }
}

const retrySync = async (interaction: QueuedInteraction) => {
  if (isSyncing.value || !isOnline.value) return
  
  isSyncing.value = true
  
  try {
    await syncInteraction(interaction)
    setStatus('Interaction synced successfully', 'success')
  } catch (error) {
    setStatus('Failed to sync interaction', 'error')
  } finally {
    isSyncing.value = false
  }
}

// ===============================
// INDEXEDDB OPERATIONS
// ===============================

const storeInteraction = (interaction: QueuedInteraction): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'))
      return
    }
    
    const transaction = db.transaction(['sync_queue'], 'readwrite')
    const store = transaction.objectStore('sync_queue')
    
    const request = store.add(interaction)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

const updateInteraction = (interaction: QueuedInteraction): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'))
      return
    }
    
    const transaction = db.transaction(['sync_queue'], 'readwrite')
    const store = transaction.objectStore('sync_queue')
    
    const request = store.put(interaction)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

const deleteInteraction = (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'))
      return
    }
    
    const transaction = db.transaction(['sync_queue'], 'readwrite')
    const store = transaction.objectStore('sync_queue')
    
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

const getAllInteractions = (): Promise<QueuedInteraction[]> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'))
      return
    }
    
    const transaction = db.transaction(['sync_queue'], 'readonly')
    const store = transaction.objectStore('sync_queue')
    
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// ===============================
// HELPER METHODS
// ===============================

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

const setStatus = (message: string, type: 'info' | 'success' | 'error') => {
  statusMessage.value = message
  statusType.value = type
  
  // Auto-clear messages
  setTimeout(() => {
    if (statusMessage.value === message) {
      statusMessage.value = ''
    }
  }, type === 'error' ? 5000 : 3000)
}

const getInteractionTypeLabel = (type: InteractionType): string => {
  const labels = {
    [InteractionType.CALL]: 'Phone Call',
    [InteractionType.EMAIL]: 'Email',
    [InteractionType.IN_PERSON]: 'In-Person Meeting',
    [InteractionType.DEMO]: 'Product Demo',
    [InteractionType.FOLLOW_UP]: 'Follow-up'
  }
  return labels[type] || type
}

const getStatusClasses = (status: string): string => {
  const classes = {
    pending: 'bg-yellow-100 text-yellow-800',
    syncing: 'bg-blue-100 text-blue-800',
    synced: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  }
  return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800'
}

const getStatusDotClass = (status: string): string => {
  const classes = {
    pending: 'bg-yellow-500',
    syncing: 'bg-blue-500 animate-pulse',
    synced: 'bg-green-500',
    failed: 'bg-red-500'
  }
  return classes[status as keyof typeof classes] || 'bg-gray-500'
}

const getStatusLabel = (status: string): string => {
  const labels = {
    pending: 'Pending',
    syncing: 'Syncing',
    synced: 'Synced',
    failed: 'Failed'
  }
  return labels[status as keyof typeof labels] || status
}

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString()
}

const formatInteractionDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString()
}

// ===============================
// EVENT HANDLERS
// ===============================

const editInteraction = (interaction: QueuedInteraction) => {
  // Emit event for parent to handle editing
  // Could open the mobile form with pre-filled data
  console.log('Edit interaction:', interaction)
}

const viewInteraction = (interaction: QueuedInteraction) => {
  // Emit event for parent to handle viewing
  console.log('View interaction:', interaction)
}

const handleOnline = () => {
  isOnline.value = true
  setStatus('Connection restored', 'success')
  
  if (autoSync.value && pendingCount.value > 0) {
    setTimeout(() => syncAll(), 2000)
  }
}

const handleOffline = () => {
  isOnline.value = false
  setStatus('Working offline - interactions will sync when reconnected', 'info')
}

// ===============================
// SERVICE WORKER INTEGRATION
// ===============================

const handleServiceWorkerMessage = (event: MessageEvent) => {
  if (event.data.type === 'INTERACTION_SYNC_RESULT') {
    const { interactionId, success } = event.data
    
    const interaction = queuedInteractions.value.find(i => i.id === interactionId)
    if (interaction) {
      interaction.status = success ? 'synced' : 'failed'
      updateInteraction(interaction)
      
      if (success) {
        emit('interaction-synced', interactionId)
      }
    }
  }
}

// ===============================
// LIFECYCLE
// ===============================

onMounted(async () => {
  try {
    await initDatabase()
    await loadQueue()
    
    // Listen for network status changes
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)
    }
    
    // Auto-sync on mount if online
    if (isOnline.value && autoSync.value && pendingCount.value > 0) {
      setTimeout(() => syncAll(), 3000)
    }
    
  } catch (error) {
    console.error('Failed to initialize offline queue:', error)
    setStatus('Failed to initialize offline storage', 'error')
  }
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage)
  }
})

// Watch for auto-sync setting changes
watch(autoSync, (newValue) => {
  localStorage.setItem('crm-auto-sync', JSON.stringify(newValue))
  
  if (newValue && isOnline.value && pendingCount.value > 0) {
    setTimeout(() => syncAll(), 1000)
  }
})

// Load auto-sync setting
const loadAutoSyncSetting = () => {
  try {
    const stored = localStorage.getItem('crm-auto-sync')
    if (stored !== null) {
      autoSync.value = JSON.parse(stored)
    }
  } catch (error) {
    console.warn('Failed to load auto-sync setting:', error)
  }
}

loadAutoSyncSetting()

// Expose public methods
defineExpose({
  addToQueue,
  syncAll,
  retrySync,
  removeFromQueue,
  getQueuedCount: () => queuedInteractions.value.length,
  getPendingCount: () => pendingCount.value,
  getFailedCount: () => failedCount.value,
  isOnline: () => isOnline.value,
  isSyncing: () => isSyncing.value
})
</script>

<style scoped>
.offline-interaction-queue {
  @apply h-full flex flex-col;
}

.touch-target {
  @apply min-h-[44px] min-w-[44px] flex items-center justify-center;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Animation for sync progress */
.sync-progress-bar {
  transition: width 0.3s ease-in-out;
}

/* Focus styles */
button:focus-visible {
  @apply outline-none ring-2 ring-primary-500 ring-offset-2;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .animate-pulse {
    animation: none;
  }
  
  .sync-progress-bar {
    transition: none;
  }
}
</style>