<template>
  <div class="interaction-type-select">
    <label :for="name" class="block text-sm font-medium text-gray-700 mb-2">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>
    
    <!-- Quick Template Grid -->
    <div v-if="showQuickTemplates && !modelValue" class="mb-4">
      <p class="text-sm text-gray-500 mb-3">Quick Start Templates</p>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          v-for="template in quickTemplates"
          :key="template.type"
          type="button"
          @click="selectFromTemplate(template)"
          class="template-card"
          :class="{ 'template-card-selected': selectedTemplate === template.type }"
        >
          <div class="template-icon">
            <component :is="getIconComponent(template.icon)" class="h-6 w-6" />
          </div>
          <span class="template-name">{{ template.name }}</span>
        </button>
      </div>
      
      <div class="mt-3 text-center">
        <button
          type="button"
          @click="showAllTypes = true"
          class="text-sm text-primary-600 hover:text-primary-500"
        >
          Or choose from all types →
        </button>
      </div>
    </div>

    <!-- Full Type Selection -->
    <div v-if="showAllTypes || modelValue || !showQuickTemplates">
      <select
        :id="name"
        :value="modelValue"
        @change="handleSelection"
        :required="required"
        :disabled="disabled"
        :class="selectClasses"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${name}-error` : undefined"
      >
        <option value="">Select interaction type...</option>
        
        <!-- Communication Types -->
        <optgroup label="Communication">
          <option value="PHONE_CALL">📞 Phone Call</option>
          <option value="EMAIL">📧 Email</option>
          <option value="FOLLOW_UP">🔄 Follow-up</option>
        </optgroup>
        
        <!-- Meeting Types -->
        <optgroup label="Meetings">
          <option value="IN_PERSON_MEETING">👥 In-Person Meeting</option>
          <option value="VIRTUAL_MEETING">💻 Virtual Meeting</option>
          <option value="SITE_VISIT">🏢 Site Visit</option>
        </optgroup>
        
        <!-- Sales Activities -->
        <optgroup label="Sales Activities">
          <option value="PRODUCT_DEMO">🎥 Product Demo</option>
          <option value="TRADE_SHOW">🎪 Trade Show</option>
        </optgroup>
        
        <!-- Support Types -->
        <optgroup label="Support">
          <option value="SUPPORT_REQUEST">🛠️ Support Request</option>
          <option value="COMPLAINT">⚠️ Complaint</option>
          <option value="FEEDBACK">💬 Feedback</option>
        </optgroup>
        
        <!-- Other -->
        <optgroup label="Other">
          <option value="OTHER">📋 Other</option>
        </optgroup>
      </select>

      <!-- Type Description -->
      <div v-if="selectedTypeInfo" class="mt-2 p-3 bg-blue-50 rounded-md">
        <div class="flex items-start space-x-2">
          <component :is="getIconComponent(selectedTypeInfo.icon)" class="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p class="text-sm font-medium text-blue-900">{{ selectedTypeInfo.name }}</p>
            <p class="text-sm text-blue-700 mt-1">{{ selectedTypeInfo.description }}</p>
            <div v-if="selectedTypeInfo.suggestedDuration" class="mt-2 text-xs text-blue-600">
              Typical duration: {{ selectedTypeInfo.suggestedDuration }} minutes
            </div>
          </div>
        </div>
      </div>

      <!-- Back to Templates -->
      <div v-if="showQuickTemplates && showAllTypes && !modelValue" class="mt-3 text-center">
        <button
          type="button"
          @click="showAllTypes = false"
          class="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to quick templates
        </button>
      </div>
    </div>

    <!-- Error Message -->
    <p
      v-if="error"
      :id="`${name}-error`"
      class="mt-1 text-sm text-red-600"
      role="alert"
    >
      {{ error }}
    </p>

    <!-- Helper Text -->
    <p v-if="description && !error" class="mt-1 text-sm text-gray-500">
      {{ description }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  PhoneIcon,
  EnvelopeIcon,
  UsersIcon,
  ComputerDesktopIcon,
  PresentationChartLineIcon,
  BuildingOfficeIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'
import type { InteractionType } from '@/types/interactions'

/**
 * Props interface
 */
interface Props {
  name: string
  label: string
  modelValue: InteractionType | null
  error?: string
  required?: boolean
  disabled?: boolean
  description?: string
  showQuickTemplates?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  disabled: false,
  showQuickTemplates: true
})

/**
 * Emits interface
 */
interface Emits {
  'update:modelValue': [value: InteractionType | null]
  'type-selected': [type: InteractionType, typeInfo: TypeInfo]
}

const emit = defineEmits<Emits>()

// ===============================
// COMPONENT STATE
// ===============================

const showAllTypes = ref(false)
const selectedTemplate = ref<InteractionType | null>(null)

// ===============================
// TYPE DEFINITIONS
// ===============================

interface TypeInfo {
  type: InteractionType
  name: string
  description: string
  icon: string
  suggestedDuration?: number
  category: string
}

interface QuickTemplate {
  type: InteractionType
  name: string
  icon: string
  popular: boolean
}

// ===============================
// INTERACTION TYPE DATA
// ===============================

const interactionTypes: TypeInfo[] = [
  {
    type: 'PHONE_CALL',
    name: 'Phone Call',
    description: 'Voice conversation with customer or prospect',
    icon: 'phone',
    suggestedDuration: 30,
    category: 'Communication'
  },
  {
    type: 'EMAIL',
    name: 'Email',
    description: 'Written correspondence via email',
    icon: 'envelope',
    category: 'Communication'
  },
  {
    type: 'IN_PERSON_MEETING',
    name: 'In-Person Meeting',
    description: 'Face-to-face meeting at office or customer location',
    icon: 'users',
    suggestedDuration: 90,
    category: 'Meetings'
  },
  {
    type: 'VIRTUAL_MEETING',
    name: 'Virtual Meeting',
    description: 'Online meeting via video conference',
    icon: 'computer-desktop',
    suggestedDuration: 60,
    category: 'Meetings'
  },
  {
    type: 'PRODUCT_DEMO',
    name: 'Product Demo',
    description: 'Demonstration of product features and capabilities',
    icon: 'presentation-chart-line',
    suggestedDuration: 60,
    category: 'Sales'
  },
  {
    type: 'SITE_VISIT',
    name: 'Site Visit',
    description: 'Visit to customer facility or site',
    icon: 'building-office',
    suggestedDuration: 120,
    category: 'Meetings'
  },
  {
    type: 'TRADE_SHOW',
    name: 'Trade Show',
    description: 'Interaction at trade show or industry event',
    icon: 'sparkles',
    suggestedDuration: 45,
    category: 'Sales'
  },
  {
    type: 'FOLLOW_UP',
    name: 'Follow-up',
    description: 'Follow-up communication after previous interaction',
    icon: 'arrow-path',
    suggestedDuration: 20,
    category: 'Communication'
  },
  {
    type: 'SUPPORT_REQUEST',
    name: 'Support Request',
    description: 'Customer requesting technical or service support',
    icon: 'wrench-screwdriver',
    suggestedDuration: 45,
    category: 'Support'
  },
  {
    type: 'COMPLAINT',
    name: 'Complaint',
    description: 'Customer complaint or issue resolution',
    icon: 'exclamation-triangle',
    suggestedDuration: 30,
    category: 'Support'
  },
  {
    type: 'FEEDBACK',
    name: 'Feedback',
    description: 'Customer feedback or testimonial collection',
    icon: 'chat-bubble-left-right',
    suggestedDuration: 25,
    category: 'Communication'
  },
  {
    type: 'OTHER',
    name: 'Other',
    description: 'Other type of customer interaction',
    icon: 'document-text',
    category: 'Other'
  }
]

const quickTemplates: QuickTemplate[] = [
  { type: 'PHONE_CALL', name: 'Phone Call', icon: 'phone', popular: true },
  { type: 'PRODUCT_DEMO', name: 'Demo', icon: 'presentation-chart-line', popular: true },
  { type: 'IN_PERSON_MEETING', name: 'Meeting', icon: 'users', popular: true },
  { type: 'EMAIL', name: 'Email', icon: 'envelope', popular: true }
]

// ===============================
// COMPUTED PROPERTIES
// ===============================

const selectClasses = computed(() => {
  const baseClasses = 'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200'
  
  if (props.error) {
    return `${baseClasses} border-red-500 text-red-900 placeholder-red-300 focus:ring-red-500`
  }
  
  if (props.disabled) {
    return `${baseClasses} border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed`
  }
  
  return `${baseClasses} border-gray-300 text-gray-900 placeholder-gray-400`
})

const selectedTypeInfo = computed(() => {
  if (!props.modelValue) return null
  return interactionTypes.find(type => type.type === props.modelValue) || null
})

// ===============================
// ICON MAPPING
// ===============================

const iconComponents = {
  'phone': PhoneIcon,
  'envelope': EnvelopeIcon,
  'users': UsersIcon,
  'computer-desktop': ComputerDesktopIcon,
  'presentation-chart-line': PresentationChartLineIcon,
  'building-office': BuildingOfficeIcon,
  'sparkles': SparklesIcon,
  'wrench-screwdriver': WrenchScrewdriverIcon,
  'exclamation-triangle': ExclamationTriangleIcon,
  'chat-bubble-left-right': ChatBubbleLeftRightIcon,
  'document-text': DocumentTextIcon,
  'arrow-path': ArrowPathIcon
}

const getIconComponent = (iconName: string) => {
  return iconComponents[iconName as keyof typeof iconComponents] || DocumentTextIcon
}

// ===============================
// EVENT HANDLERS
// ===============================

const handleSelection = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const value = target.value as InteractionType | ''
  const interactionType = value || null
  
  emit('update:modelValue', interactionType)
  
  if (interactionType) {
    const typeInfo = interactionTypes.find(type => type.type === interactionType)
    if (typeInfo) {
      emit('type-selected', interactionType, typeInfo)
    }
  }
}

const selectFromTemplate = (template: QuickTemplate) => {
  selectedTemplate.value = template.type
  emit('update:modelValue', template.type)
  
  const typeInfo = interactionTypes.find(type => type.type === template.type)
  if (typeInfo) {
    emit('type-selected', template.type, typeInfo)
  }
  
  // Auto-advance to full form after template selection
  showAllTypes.value = true
}

// ===============================
// WATCHERS
// ===============================

// Reset template selection when modelValue changes externally
watch(() => props.modelValue, (newValue) => {
  if (newValue !== selectedTemplate.value) {
    selectedTemplate.value = newValue
  }
  
  // Show full types if a value is selected
  if (newValue && !showAllTypes.value) {
    showAllTypes.value = true
  }
})

// Reset showAllTypes when modelValue is cleared
watch(() => props.modelValue, (newValue) => {
  if (!newValue && props.showQuickTemplates) {
    showAllTypes.value = false
    selectedTemplate.value = null
  }
})
</script>

<style scoped>
.interaction-type-select {
  @apply w-full;
}

.template-card {
  @apply flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500;
}

.template-card-selected {
  @apply border-primary-500 bg-primary-50 ring-2 ring-primary-500;
}

.template-icon {
  @apply w-8 h-8 flex items-center justify-center text-gray-600 mb-2;
}

.template-card:hover .template-icon,
.template-card-selected .template-icon {
  @apply text-primary-600;
}

.template-name {
  @apply text-sm font-medium text-gray-700 text-center;
}

.template-card:hover .template-name,
.template-card-selected .template-name {
  @apply text-primary-700;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .template-card {
    @apply p-3;
  }
  
  .template-icon {
    @apply w-6 h-6 mb-1;
  }
  
  .template-name {
    @apply text-xs;
  }
}

/* Focus improvements for accessibility */
.template-card:focus-visible {
  @apply ring-offset-2;
}

/* Animation for template grid reveal */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.template-card {
  animation: fadeInUp 0.2s ease-out;
}
</style>