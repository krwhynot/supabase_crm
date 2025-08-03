<template>
  <div class="follow-up-scheduler">
    <div class="flex items-center justify-between mb-4">
      <label class="block text-sm font-medium text-gray-700">
        Follow-up Scheduling
      </label>
      
      <!-- Quick Toggle -->
      <div class="flex items-center">
        <input
          :id="`${name}-toggle`"
          type="checkbox"
          v-model="followUpRequired"
          @change="handleToggleChange"
          class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <label 
          :for="`${name}-toggle`" 
          class="ml-2 text-sm text-gray-600 cursor-pointer"
        >
          Schedule follow-up
        </label>
      </div>
    </div>
    
    <!-- Follow-up Configuration -->
    <div v-if="followUpRequired" class="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <!-- Quick Templates (when auto-suggest is enabled) -->
      <div v-if="autoSuggest && suggestedTemplates.length > 0" class="mb-4">
        <p class="text-sm font-medium text-blue-900 mb-2">Suggested based on interaction outcome:</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            v-for="template in suggestedTemplates"
            :key="template.label"
            type="button"
            @click="applyTemplate(template)"
            class="p-3 text-left bg-white border border-blue-200 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
          >
            <div class="text-sm font-medium text-blue-900">{{ template.label }}</div>
            <div class="text-xs text-blue-700 mt-1">{{ template.description }}</div>
          </button>
        </div>
        
        <div class="mt-3 pt-3 border-t border-blue-200">
          <p class="text-xs text-blue-600 mb-2">Or configure manually:</p>
        </div>
      </div>
      
      <!-- Follow-up Date -->
      <div>
        <label :for="`${name}-date`" class="block text-sm font-medium text-gray-700 mb-1">
          Follow-up Date & Time
          <span class="text-red-500 ml-1">*</span>
        </label>
        <input
          :id="`${name}-date`"
          type="datetime-local"
          v-model="followUpDate"
          :min="minDateTime"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          :aria-describedby="error ? `${name}-date-error` : undefined"
        />
        <p
          v-if="error"
          :id="`${name}-date-error`"
          class="mt-1 text-sm text-red-600"
          role="alert"
        >
          {{ error }}
        </p>
      </div>
      
      <!-- Follow-up Type -->
      <div>
        <label :for="`${name}-type`" class="block text-sm font-medium text-gray-700 mb-1">
          Follow-up Type
        </label>
        <select
          :id="`${name}-type`"
          v-model="followUpType"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Select type...</option>
          <option value="PHONE_CALL">📞 Phone Call</option>
          <option value="EMAIL">📧 Email</option>
          <option value="VIRTUAL_MEETING">💻 Virtual Meeting</option>
          <option value="IN_PERSON_MEETING">👥 In-Person Meeting</option>
          <option value="PRODUCT_DEMO">🎥 Product Demo</option>
          <option value="FOLLOW_UP">🔄 General Follow-up</option>
        </select>
      </div>
      
      <!-- Follow-up Notes -->
      <div>
        <label :for="`${name}-notes`" class="block text-sm font-medium text-gray-700 mb-1">
          Follow-up Notes
        </label>
        <textarea
          :id="`${name}-notes`"
          v-model="followUpNotes"
          rows="3"
          placeholder="Add notes about what should be discussed or accomplished in the follow-up..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-vertical"
        />
      </div>
      
      <!-- Priority & Reminders -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Priority -->
        <div>
          <label :for="`${name}-priority`" class="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            :id="`${name}-priority`"
            v-model="followUpPriority"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="LOW">🟢 Low</option>
            <option value="MEDIUM">🟡 Medium</option>
            <option value="HIGH">🔴 High</option>
            <option value="URGENT">🚨 Urgent</option>
          </select>
        </div>
        
        <!-- Reminder -->
        <div>
          <label :for="`${name}-reminder`" class="block text-sm font-medium text-gray-700 mb-1">
            Reminder
          </label>
          <select
            :id="`${name}-reminder`"
            v-model="reminderOffset"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="0">At scheduled time</option>
            <option value="15">15 minutes before</option>
            <option value="30">30 minutes before</option>
            <option value="60">1 hour before</option>
            <option value="1440">1 day before</option>
          </select>
        </div>
      </div>
      
      <!-- Summary Preview -->
      <div v-if="followUpDate" class="mt-4 p-3 bg-white border border-blue-200 rounded-md">
        <div class="flex items-start space-x-3">
          <CalendarIcon class="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-gray-900">
              Follow-up scheduled for {{ formatDateTime(followUpDate) }}
            </div>
            <div v-if="followUpType" class="text-sm text-gray-600 mt-1">
              Type: {{ formatFollowUpType(followUpType) }}
            </div>
            <div v-if="followUpPriority && followUpPriority !== 'MEDIUM'" class="text-sm text-gray-600 mt-1">
              Priority: {{ formatPriority(followUpPriority) }}
            </div>
            <div v-if="reminderOffset > 0" class="text-sm text-gray-600 mt-1">
              Reminder: {{ formatReminder(reminderOffset) }}
            </div>
            <div v-if="followUpNotes" class="text-sm text-gray-600 mt-2 italic">
              "{{ followUpNotes }}"
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Disabled State Message -->
    <div v-if="!followUpRequired" class="text-sm text-gray-500 italic">
      No follow-up scheduled for this interaction.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { CalendarIcon } from '@heroicons/vue/24/outline'
import type { InteractionType, InteractionOutcome } from '@/types/interactions'

/**
 * Follow-up template interface
 */
interface FollowUpTemplate {
  label: string
  description: string
  daysOffset: number
  type: InteractionType
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  notes: string
}

/**
 * Props interface
 */
interface Props {
  name: string
  required?: boolean
  autoSuggest?: boolean
  interactionOutcome?: InteractionOutcome | null
  modelValue?: {
    required: boolean
    date: string | null
    notes: string
    type?: InteractionType | null
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    reminderOffset?: number
  }
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  autoSuggest: false
})

/**
 * Emits interface
 */
interface Emits {
  'update:required': [value: boolean]
  'update:date': [value: string | null]
  'update:notes': [value: string]
  'update:type': [value: InteractionType | null]
  'update:priority': [value: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT']
  'update:reminderOffset': [value: number]
  'follow-up-configured': [config: {
    required: boolean
    date: string | null
    notes: string
    type: InteractionType | null
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    reminderOffset: number
  }]
}

const emit = defineEmits<Emits>()

// ===============================
// COMPONENT STATE
// ===============================

const followUpRequired = ref(false)
const followUpDate = ref('')
const followUpNotes = ref('')
const followUpType = ref<InteractionType | null>(null)
const followUpPriority = ref<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM')
const reminderOffset = ref(0)
const error = ref<string | null>(null)

// ===============================
// COMPUTED PROPERTIES
// ===============================

const minDateTime = computed(() => {
  const now = new Date()
  now.setMinutes(now.getMinutes() + 15) // Minimum 15 minutes from now
  return now.toISOString().slice(0, 16)
})

const suggestedTemplates = computed((): FollowUpTemplate[] => {
  if (!props.autoSuggest || !props.interactionOutcome) {
    return []
  }
  
  const templates: { [key in InteractionOutcome]?: FollowUpTemplate[] } = {
    POSITIVE: [
      {
        label: 'Schedule Demo',
        description: 'Product demonstration in 3-5 days',
        daysOffset: 3,
        type: 'PRODUCT_DEMO',
        priority: 'HIGH',
        notes: 'Schedule product demonstration to showcase key features discussed'
      },
      {
        label: 'Proposal Follow-up',
        description: 'Send proposal in 1-2 days',
        daysOffset: 1,
        type: 'EMAIL',
        priority: 'HIGH',
        notes: 'Send detailed proposal based on requirements discussed'
      }
    ],
    NEUTRAL: [
      {
        label: 'Check-in Call',
        description: 'Follow-up call in 1 week',
        daysOffset: 7,
        type: 'PHONE_CALL',
        priority: 'MEDIUM',
        notes: 'Check-in call to address any questions and gauge interest level'
      },
      {
        label: 'Information Email',
        description: 'Send additional information in 2-3 days',
        daysOffset: 2,
        type: 'EMAIL',
        priority: 'MEDIUM',
        notes: 'Send additional product information and case studies'
      }
    ],
    NEGATIVE: [
      {
        label: 'Address Concerns',
        description: 'Follow-up to address concerns in 3-5 days',
        daysOffset: 3,
        type: 'PHONE_CALL',
        priority: 'HIGH',
        notes: 'Address specific concerns raised during the interaction'
      }
    ],
    FOLLOW_UP_NEEDED: [
      {
        label: 'Next Meeting',
        description: 'Schedule next meeting in 5-7 days',
        daysOffset: 5,
        type: 'IN_PERSON_MEETING',
        priority: 'HIGH',
        notes: 'Schedule next meeting to continue discussion'
      }
    ],
    OPPORTUNITY_CREATED: [
      {
        label: 'Opportunity Review',
        description: 'Review opportunity progress in 1 week',
        daysOffset: 7,
        type: 'PHONE_CALL',
        priority: 'MEDIUM',
        notes: 'Review opportunity progress and next steps'
      }
    ],
    DEAL_ADVANCED: [
      {
        label: 'Next Phase Meeting',
        description: 'Plan next phase in 3-5 days',
        daysOffset: 3,
        type: 'VIRTUAL_MEETING',
        priority: 'HIGH',
        notes: 'Plan and initiate next phase of the sales process'
      }
    ],
    DEAL_STALLED: [
      {
        label: 'Stakeholder Outreach',
        description: 'Contact decision makers in 2-3 days',
        daysOffset: 2,
        type: 'PHONE_CALL',
        priority: 'HIGH',
        notes: 'Reach out to key stakeholders to move deal forward'
      }
    ],
    LOST_OPPORTUNITY: [
      {
        label: 'Future Opportunities',
        description: 'Check for future opportunities in 3 months',
        daysOffset: 90,
        type: 'EMAIL',
        priority: 'LOW',
        notes: 'Check-in for potential future opportunities and maintain relationship'
      }
    ]
  }
  
  return templates[props.interactionOutcome] || []
})

// ===============================
// EVENT HANDLERS
// ===============================

const handleToggleChange = () => {
  emit('update:required', followUpRequired.value)
  
  if (!followUpRequired.value) {
    // Clear all follow-up data when disabled
    followUpDate.value = ''
    followUpNotes.value = ''
    followUpType.value = null
    followUpPriority.value = 'MEDIUM'
    reminderOffset.value = 0
    error.value = null
    
    emitUpdate()
  } else {
    // Set default date to tomorrow at 9 AM
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    followUpDate.value = tomorrow.toISOString().slice(0, 16)
    
    emitUpdate()
  }
}

const applyTemplate = (template: FollowUpTemplate) => {
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + template.daysOffset)
  targetDate.setHours(9, 0, 0, 0) // Default to 9 AM
  
  followUpDate.value = targetDate.toISOString().slice(0, 16)
  followUpType.value = template.type
  followUpPriority.value = template.priority
  followUpNotes.value = template.notes
  
  emitUpdate()
}

const emitUpdate = () => {
  const config = {
    required: followUpRequired.value,
    date: followUpDate.value || null,
    notes: followUpNotes.value,
    type: followUpType.value,
    priority: followUpPriority.value,
    reminderOffset: reminderOffset.value
  }
  
  emit('update:date', config.date)
  emit('update:notes', config.notes)
  emit('update:type', config.type)
  emit('update:priority', config.priority)
  emit('update:reminderOffset', config.reminderOffset)
  emit('follow-up-configured', config)
}

// ===============================
// UTILITY FUNCTIONS
// ===============================

const formatDateTime = (dateTimeString: string): string => {
  const date = new Date(dateTimeString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

const formatFollowUpType = (type: InteractionType): string => {
  const typeLabels = {
    'PHONE_CALL': 'Phone Call',
    'EMAIL': 'Email',
    'VIRTUAL_MEETING': 'Virtual Meeting',
    'IN_PERSON_MEETING': 'In-Person Meeting',
    'PRODUCT_DEMO': 'Product Demo',
    'FOLLOW_UP': 'General Follow-up',
    'SITE_VISIT': 'Site Visit',
    'TRADE_SHOW': 'Trade Show',
    'SUPPORT_REQUEST': 'Support Request',
    'COMPLAINT': 'Complaint',
    'FEEDBACK': 'Feedback',
    'OTHER': 'Other'
  }
  
  return typeLabels[type] || type
}

const formatPriority = (priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'): string => {
  const priorityLabels = {
    'LOW': '🟢 Low',
    'MEDIUM': '🟡 Medium',
    'HIGH': '🔴 High',
    'URGENT': '🚨 Urgent'
  }
  
  return priorityLabels[priority]
}

const formatReminder = (offsetMinutes: number): string => {
  if (offsetMinutes === 0) return 'At scheduled time'
  if (offsetMinutes < 60) return `${offsetMinutes} minutes before`
  if (offsetMinutes < 1440) return `${Math.floor(offsetMinutes / 60)} hour(s) before`
  return `${Math.floor(offsetMinutes / 1440)} day(s) before`
}

// ===============================
// VALIDATION
// ===============================

const validateFollowUpDate = () => {
  error.value = null
  
  if (followUpRequired.value && !followUpDate.value) {
    error.value = 'Follow-up date is required'
    return false
  }
  
  if (followUpDate.value) {
    const followUpDateTime = new Date(followUpDate.value)
    const now = new Date()
    
    if (followUpDateTime <= now) {
      error.value = 'Follow-up date must be in the future'
      return false
    }
  }
  
  return true
}

// ===============================
// WATCHERS
// ===============================

// Watch for external model changes
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    followUpRequired.value = newValue.required
    followUpDate.value = newValue.date || ''
    followUpNotes.value = newValue.notes || ''
    followUpType.value = newValue.type || null
    followUpPriority.value = newValue.priority || 'MEDIUM'
    reminderOffset.value = newValue.reminderOffset || 0
  }
}, { immediate: true })

// Watch for changes and emit updates
watch([followUpDate, followUpNotes, followUpType, followUpPriority, reminderOffset], () => {
  if (followUpRequired.value) {
    validateFollowUpDate()
    emitUpdate()
  }
})

// ===============================
// LIFECYCLE
// ===============================

onMounted(() => {
  // Initialize with model value if provided
  if (props.modelValue) {
    followUpRequired.value = props.modelValue.required
    followUpDate.value = props.modelValue.date || ''
    followUpNotes.value = props.modelValue.notes || ''
    followUpType.value = props.modelValue.type || null
    followUpPriority.value = props.modelValue.priority || 'MEDIUM'
    reminderOffset.value = props.modelValue.reminderOffset || 0
  }
})
</script>

<style scoped>
.follow-up-scheduler {
  @apply w-full;
}

/* Template button animations */
.follow-up-scheduler button {
  transition: all 0.2s ease-in-out;
}

.follow-up-scheduler button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Focus improvements for accessibility */
.follow-up-scheduler input:focus-visible,
.follow-up-scheduler select:focus-visible,
.follow-up-scheduler textarea:focus-visible,
.follow-up-scheduler button:focus-visible {
  @apply ring-offset-2;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .follow-up-scheduler .grid-cols-2 {
    @apply grid-cols-1;
  }
}

/* Animation for the follow-up section */
@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    max-height: 1000px;
    transform: translateY(0);
  }
}

.follow-up-scheduler .bg-blue-50 {
  animation: slideDown 0.3s ease-out;
}
</style>