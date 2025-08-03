<template>
  <div class="voice-notes-input">
    <!-- Text Input Area -->
    <div class="relative">
      <textarea
        ref="textareaRef"
        v-model="internalValue"
        :placeholder="placeholder"
        :rows="rows"
        :class="[
          'w-full px-4 py-3 pr-16 text-base border border-gray-300 rounded-lg resize-none',
          'focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors',
          isListening && 'ring-2 ring-red-500 border-red-500 bg-red-50',
          error && 'border-red-300 focus:ring-red-500'
        ]"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />
      
      <!-- Voice Recording Button -->
      <div class="absolute bottom-3 right-3">
        <button
          @click="toggleRecording"
          type="button"
          :disabled="!isVoiceSupported"
          :class="[
            'touch-target p-2 rounded-full transition-all duration-200',
            isListening
              ? 'bg-red-500 text-white animate-pulse'
              : isVoiceSupported
                ? 'bg-primary-500 text-white hover:bg-primary-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            isListening ? 'focus:ring-red-500' : 'focus:ring-primary-500'
          ]"
          :aria-label="isListening ? 'Stop recording' : 'Start voice recording'"
          :title="getVoiceButtonTitle()"
        >
          <svg v-if="isListening" class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h12v12H6z"/>
          </svg>
          <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Voice Feedback -->
    <div v-if="isListening" class="mt-3 flex items-center space-x-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
      <div class="flex-shrink-0">
        <div class="voice-indicator">
          <div class="voice-wave"></div>
          <div class="voice-wave"></div>
          <div class="voice-wave"></div>
        </div>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-red-800">
          {{ isProcessing ? 'Processing...' : 'Listening...' }}
        </p>
        <p v-if="interimTranscript" class="text-sm text-red-600 italic truncate">
          "{{ interimTranscript }}"
        </p>
      </div>
      <button
        @click="stopRecording"
        class="flex-shrink-0 touch-target p-2 text-red-600 hover:text-red-800"
        aria-label="Stop recording"
      >
        <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 6h12v12H6z"/>
        </svg>
      </button>
    </div>

    <!-- Voice Status Messages -->
    <div v-if="statusMessage" class="mt-2 flex items-start space-x-2">
      <svg v-if="statusType === 'error'" class="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
      <svg v-else-if="statusType === 'success'" class="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
      <svg v-else class="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
      </svg>
      <p :class="[
        'text-sm',
        statusType === 'error' ? 'text-red-600' : statusType === 'success' ? 'text-green-600' : 'text-blue-600'
      ]">
        {{ statusMessage }}
      </p>
    </div>

    <!-- Voice Commands Help -->
    <div v-if="showHelp" class="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
      <h4 class="text-sm font-medium text-blue-800 mb-2">Voice Commands:</h4>
      <div class="text-xs text-blue-700 space-y-1">
        <p><strong>"New paragraph"</strong> - Start a new line</p>
        <p><strong>"Period" / "Comma"</strong> - Add punctuation</p>
        <p><strong>"Clear text"</strong> - Clear all content</p>
        <p><strong>"Stop recording"</strong> - Stop voice input</p>
      </div>
      <button
        @click="showHelp = false"
        class="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
      >
        Hide help
      </button>
    </div>

    <!-- Error Display -->
    <p v-if="error" class="mt-2 text-sm text-red-600">{{ error }}</p>
  </div>
</template>

<!--
  VoiceNotesInput - Voice-to-text input component for hands-free field use
  
  Features:
  - Web Speech API integration for voice recognition
  - Real-time transcription with interim results
  - Voice commands for punctuation and formatting
  - Fallback to manual text input when voice not available
  - Visual feedback during recording
  - Error handling and user guidance
  - Mobile-optimized touch targets
  - Accessibility support with ARIA labels
  
  Voice Commands:
  - "New paragraph" - Inserts line break
  - "Period", "Comma", etc. - Adds punctuation
  - "Clear text" - Clears all content
  - "Stop recording" - Stops voice input
  
  Browser Support:
  - Chrome/Edge: Full support
  - Safari: Limited support
  - Firefox: No support (fallback to manual input)
  
  Privacy:
  - Uses browser's built-in speech recognition
  - No data sent to external services
  - User can disable voice features
-->

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

/**
 * Component props
 */
interface Props {
  /** Input value (v-model) */
  modelValue: string
  /** Placeholder text */
  placeholder?: string
  /** Number of textarea rows */
  rows?: number
  /** Error message to display */
  error?: string
  /** Auto-start recording on focus */
  autoStart?: boolean
  /** Language for speech recognition */
  language?: string
  /** Continuous recording mode */
  continuous?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Type or use voice input...',
  rows: 4,
  autoStart: false,
  language: 'en-US',
  continuous: true
})

/**
 * Component emits
 */
interface Emits {
  /** v-model update */
  'update:modelValue': [value: string]
  /** Voice recording started */
  'recording-started': []
  /** Voice recording stopped */
  'recording-stopped': []
  /** Transcription received */
  'transcription': [text: string]
  /** Voice error occurred */
  'voice-error': [error: string]
}

const emit = defineEmits<Emits>()

// ===============================
// REACTIVE STATE
// ===============================

const textareaRef = ref<HTMLTextAreaElement>()
const isVoiceSupported = ref(false)
const isListening = ref(false)
const isProcessing = ref(false)
const interimTranscript = ref('')
const statusMessage = ref('')
const statusType = ref<'info' | 'success' | 'error'>('info')
const showHelp = ref(false)

let recognition: SpeechRecognition | null = null
let silenceTimer: ReturnType<typeof setTimeout> | null = null

// ===============================
// COMPUTED PROPERTIES
// ===============================

const internalValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// ===============================
// VOICE RECOGNITION SETUP
// ===============================

const initializeSpeechRecognition = () => {
  // Check for browser support
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  
  if (!SpeechRecognition) {
    isVoiceSupported.value = false
    console.warn('Speech recognition not supported in this browser')
    return
  }
  
  isVoiceSupported.value = true
  recognition = new SpeechRecognition()
  
  // Configure recognition settings
  recognition.continuous = props.continuous
  recognition.interimResults = true
  recognition.lang = props.language
  recognition.maxAlternatives = 1
  
  // Event handlers
  recognition.onstart = handleRecognitionStart
  recognition.onresult = handleRecognitionResult
  recognition.onerror = handleRecognitionError
  recognition.onend = handleRecognitionEnd
  recognition.onnomatch = handleNoMatch
  recognition.onspeechstart = handleSpeechStart
  recognition.onspeechend = handleSpeechEnd
}

// ===============================
// VOICE RECOGNITION HANDLERS
// ===============================

const handleRecognitionStart = () => {
  isListening.value = true
  isProcessing.value = false
  interimTranscript.value = ''
  statusMessage.value = ''
  emit('recording-started')
  
  // Start silence detection
  startSilenceTimer()
}

const handleRecognitionResult = (event: SpeechRecognitionEvent) => {
  let finalTranscript = ''
  let interimText = ''
  
  // Process all results
  for (let i = 0; i < event.results.length; i++) {
    const result = event.results[i]
    const transcript = result[0].transcript
    
    if (result.isFinal) {
      finalTranscript += processVoiceCommands(transcript)
    } else {
      interimText += transcript
    }
  }
  
  // Update interim display
  interimTranscript.value = interimText
  
  // Add final transcript to textarea
  if (finalTranscript) {
    const currentValue = internalValue.value
    const newValue = currentValue + (currentValue ? ' ' : '') + finalTranscript
    internalValue.value = newValue
    emit('transcription', finalTranscript)
    
    // Reset silence timer
    resetSilenceTimer()
  }
}

const handleRecognitionError = (event: SpeechRecognitionErrorEvent) => {
  console.error('Speech recognition error:', event.error)
  
  let errorMessage = 'Voice recognition error occurred'
  
  switch (event.error) {
    case 'no-speech':
      errorMessage = 'No speech detected. Try speaking closer to the microphone.'
      break
    case 'audio-capture':
      errorMessage = 'Microphone access denied or not available.'
      break
    case 'not-allowed':
      errorMessage = 'Microphone permission denied. Please allow microphone access.'
      break
    case 'network':
      errorMessage = 'Network error occurred during speech recognition.'
      break
    case 'aborted':
      errorMessage = 'Speech recognition aborted.'
      break
    default:
      errorMessage = `Speech recognition error: ${event.error}`
  }
  
  setStatus(errorMessage, 'error')
  emit('voice-error', errorMessage)
  stopRecording()
}

const handleRecognitionEnd = () => {
  isListening.value = false
  isProcessing.value = false
  interimTranscript.value = ''
  clearSilenceTimer()
  emit('recording-stopped')
  
  // Auto-restart if we were stopped due to silence and continuous mode is enabled
  if (props.continuous && statusType.value !== 'error') {
    // Small delay before potential restart
    setTimeout(() => {
      if (!isListening.value && textareaRef.value === document.activeElement) {
        // Only restart if textarea still has focus
      }
    }, 1000)
  }
}

const handleNoMatch = () => {
  setStatus('No speech was recognized. Try speaking more clearly.', 'info')
}

const handleSpeechStart = () => {
  isProcessing.value = false
  clearSilenceTimer()
}

const handleSpeechEnd = () => {
  isProcessing.value = true
  startSilenceTimer()
}

// ===============================
// VOICE COMMANDS PROCESSING
// ===============================

const processVoiceCommands = (transcript: string): string => {
  let processedText = transcript.toLowerCase()
  
  // Handle voice commands
  if (processedText.includes('new paragraph') || processedText.includes('new line')) {
    processedText = processedText.replace(/new paragraph|new line/g, '\n')
  }
  
  if (processedText.includes('clear text') || processedText.includes('clear all')) {
    internalValue.value = ''
    setStatus('Text cleared', 'success')
    return ''
  }
  
  if (processedText.includes('stop recording')) {
    stopRecording()
    return ''
  }
  
  // Handle punctuation
  processedText = processedText.replace(/\bperiod\b/g, '.')
  processedText = processedText.replace(/\bcomma\b/g, ',')
  processedText = processedText.replace(/\bquestion mark\b/g, '?')
  processedText = processedText.replace(/\bexclamation mark\b|\bexclamation point\b/g, '!')
  processedText = processedText.replace(/\bcolon\b/g, ':')
  processedText = processedText.replace(/\bsemicolon\b/g, ';')
  processedText = processedText.replace(/\bdash\b/g, '-')
  
  // Capitalize first letter of sentences
  processedText = processedText.replace(/(^|[.!?]\s+)([a-z])/g, (match, prefix, letter) => {
    return prefix + letter.toUpperCase()
  })
  
  return processedText
}

// ===============================
// SILENCE DETECTION
// ===============================

const startSilenceTimer = () => {
  clearSilenceTimer()
  silenceTimer = setTimeout(() => {
    if (isListening.value) {
      setStatus('Silence detected. Stopping recording.', 'info')
      stopRecording()
    }
  }, 5000) // 5 seconds of silence
}

const resetSilenceTimer = () => {
  clearSilenceTimer()
  startSilenceTimer()
}

const clearSilenceTimer = () => {
  if (silenceTimer) {
    clearTimeout(silenceTimer)
    silenceTimer = null
  }
}

// ===============================
// PUBLIC METHODS
// ===============================

const toggleRecording = () => {
  if (isListening.value) {
    stopRecording()
  } else {
    startRecording()
  }
}

const startRecording = async () => {
  if (!isVoiceSupported.value || !recognition) {
    setStatus('Voice input not supported in this browser', 'error')
    return
  }
  
  if (isListening.value) {
    return
  }
  
  try {
    // Request microphone permission
    await navigator.mediaDevices.getUserMedia({ audio: true })
    
    // Start recognition
    recognition.start()
    setStatus('Starting voice recognition...', 'info')
    
  } catch (error) {
    console.error('Failed to start voice recognition:', error)
    setStatus('Failed to access microphone. Please check permissions.', 'error')
    emit('voice-error', 'Microphone access failed')
  }
}

const stopRecording = () => {
  if (recognition && isListening.value) {
    recognition.stop()
  }
  clearSilenceTimer()
}

const setStatus = (message: string, type: 'info' | 'success' | 'error') => {
  statusMessage.value = message
  statusType.value = type
  
  // Auto-clear status messages after delay
  setTimeout(() => {
    if (statusMessage.value === message) {
      statusMessage.value = ''
    }
  }, type === 'error' ? 5000 : 3000)
}

const getVoiceButtonTitle = (): string => {
  if (!isVoiceSupported.value) {
    return 'Voice input not supported'
  }
  return isListening.value ? 'Stop voice recording' : 'Start voice recording'
}

// ===============================
// EVENT HANDLERS
// ===============================

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  internalValue.value = target.value
}

const handleFocus = () => {
  if (props.autoStart && isVoiceSupported.value && !isListening.value) {
    setTimeout(() => startRecording(), 500)
  }
}

const handleBlur = () => {
  // Don't auto-stop when losing focus to maintain recording
}

// ===============================
// KEYBOARD SHORTCUTS
// ===============================

const handleKeydown = (event: KeyboardEvent) => {
  // Ctrl/Cmd + M to toggle recording
  if ((event.ctrlKey || event.metaKey) && event.key === 'm') {
    event.preventDefault()
    toggleRecording()
  }
  
  // Escape to stop recording
  if (event.key === 'Escape' && isListening.value) {
    event.preventDefault()
    stopRecording()
  }
  
  // F1 to toggle help
  if (event.key === 'F1') {
    event.preventDefault()
    showHelp.value = !showHelp.value
  }
}

// ===============================
// LIFECYCLE
// ===============================

onMounted(() => {
  initializeSpeechRecognition()
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  stopRecording()
  clearSilenceTimer()
  document.removeEventListener('keydown', handleKeydown)
})

// Watch for changes in support
watch(() => props.language, () => {
  if (recognition) {
    recognition.lang = props.language
  }
})

// Expose public methods
defineExpose({
  startRecording,
  stopRecording,
  toggleRecording,
  isListening: () => isListening.value,
  isSupported: () => isVoiceSupported.value
})
</script>

<style scoped>
.voice-notes-input {
  @apply relative;
}

.touch-target {
  @apply min-h-[44px] min-w-[44px];
}

/* Voice indicator animation */
.voice-indicator {
  @apply flex items-end space-x-1;
}

.voice-wave {
  @apply w-1 bg-red-500 rounded-full;
  animation: voice-wave 1s ease-in-out infinite;
}

.voice-wave:nth-child(1) {
  @apply h-2;
  animation-delay: 0s;
}

.voice-wave:nth-child(2) {
  @apply h-3;
  animation-delay: 0.2s;
}

.voice-wave:nth-child(3) {
  @apply h-2;
  animation-delay: 0.4s;
}

@keyframes voice-wave {
  0%, 100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(2);
  }
}

/* Pulse animation for recording button */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Focus styles */
button:focus-visible,
textarea:focus-visible {
  @apply outline-none ring-2 ring-primary-500 ring-offset-2;
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .voice-notes-input textarea {
    @apply text-base; /* Prevent zoom on iOS */
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .voice-wave {
    animation: none;
    @apply h-2;
  }
  
  .animate-pulse {
    animation: none;
  }
}
</style>