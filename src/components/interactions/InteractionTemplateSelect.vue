<template>
  <div class="interaction-template-select">
    <div class="flex items-center justify-between mb-4">
      <label class="block text-sm font-medium text-gray-700">
        {{ label }}
      </label>
      
      <!-- Quick Start Toggle -->
      <div class="flex items-center">
        <input
          :id="`${name}-quick-toggle`"
          type="checkbox"
          v-model="showQuickTemplates"
          class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <label 
          :for="`${name}-quick-toggle`" 
          class="ml-2 text-sm text-gray-600 cursor-pointer"
        >
          Show quick templates
        </label>
      </div>
    </div>
    
    <!-- Quick Templates Grid -->
    <div v-if="showQuickTemplates" class="mb-6">
      <p class="text-sm font-medium text-gray-700 mb-3">Quick Start Templates</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <button
          v-for="template in quickTemplates"
          :key="template.id"
          type="button"
          @click="selectTemplate(template)"
          class="p-4 text-left bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
          :class="{ 'ring-2 ring-primary-500 border-primary-500': selectedTemplate?.id === template.id }"
        >
          <div class="flex items-start space-x-3">
            <div class="flex-shrink-0">
              <span class="text-2xl">{{ template.icon }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-900">{{ template.name }}</div>
              <div class="text-xs text-gray-500 mt-1">{{ template.description }}</div>
              <div class="flex items-center mt-2 space-x-2">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  {{ formatInteractionType(template.interactionType) }}
                </span>
                <span v-if="template.followUpSuggested" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  Follow-up
                </span>
              </div>
            </div>
          </div>
        </button>
      </div>
      
      <div class="mt-4 pt-4 border-t border-gray-200">
        <p class="text-xs text-gray-500 mb-3">Or choose from all templates:</p>
      </div>
    </div>
    
    <!-- Full Template List -->
    <div class="space-y-4">
      <!-- Search Bar -->
      <div class="relative">
        <input
          :id="`${name}-search`"
          type="text"
          v-model="searchQuery"
          placeholder="Search templates..."
          class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
        </div>
      </div>
      
      <!-- Category Filters -->
      <div class="flex flex-wrap gap-2">
        <button
          v-for="category in categories"
          :key="category"
          type="button"
          @click="toggleCategory(category)"
          :class="[
            'px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200',
            selectedCategories.includes(category)
              ? 'bg-primary-100 text-primary-800 border border-primary-300'
              : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
          ]"
        >
          {{ category }}
        </button>
        <button
          v-if="selectedCategories.length > 0"
          type="button"
          @click="clearCategories"
          class="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-300 hover:bg-red-200 transition-colors duration-200"
        >
          Clear filters
        </button>
      </div>
      
      <!-- Template List -->
      <div class="space-y-3 max-h-64 overflow-y-auto">
        <div
          v-for="template in filteredTemplates"
          :key="template.id"
          :class="[
            'p-4 border rounded-lg cursor-pointer transition-all duration-200',
            selectedTemplate?.id === template.id
              ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          ]"
          @click="selectTemplate(template)"
          role="button"
          tabindex="0"
          @keydown="handleTemplateKeydown($event, template)"
          :aria-selected="selectedTemplate?.id === template.id"
        >
          <div class="flex items-start space-x-3">
            <div class="flex-shrink-0">
              <span class="text-xl">{{ template.icon }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium text-gray-900">{{ template.name }}</h4>
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  {{ template.category }}
                </span>
              </div>
              <p class="text-sm text-gray-600 mt-1">{{ template.description }}</p>
              
              <!-- Template Preview -->
              <div class="mt-3 space-y-2">
                <div class="text-xs text-gray-500">
                  <span class="font-medium">Type:</span> {{ formatInteractionType(template.interactionType) }}
                </div>
                <div class="text-xs text-gray-500">
                  <span class="font-medium">Subject:</span> "{{ template.subjectTemplate }}"
                </div>
                <div v-if="template.notesTemplate" class="text-xs text-gray-500">
                  <span class="font-medium">Notes:</span> {{ template.notesTemplate.substring(0, 100) }}{{ template.notesTemplate.length > 100 ? '...' : '' }}
                </div>
                <div v-if="template.followUpSuggested" class="text-xs text-blue-600">
                  <span class="font-medium">Follow-up:</span> {{ template.followUpTemplate.description }}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- No Results -->
        <div v-if="filteredTemplates.length === 0" class="text-center py-8 text-gray-500">
          <DocumentIcon class="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p class="text-sm">No templates found matching your criteria</p>
        </div>
      </div>
    </div>
    
    <!-- Selected Template Summary -->
    <div v-if="selectedTemplate" class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div class="flex items-start space-x-3">
        <CheckCircleIcon class="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-blue-900">
            Template Selected: {{ selectedTemplate.name }}
          </div>
          <div class="text-sm text-blue-700 mt-1">
            This will pre-fill your interaction form with the template data. You can modify any fields after selection.
          </div>
          <div class="mt-3 flex items-center space-x-4">
            <button
              type="button"
              @click="applyTemplate"
              class="inline-flex items-center px-3 py-1 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Apply Template
            </button>
            <button
              type="button"
              @click="clearSelection"
              class="text-sm text-blue-600 hover:text-blue-500"
            >
              Clear Selection
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Custom Template Option -->
    <div class="mt-6 pt-4 border-t border-gray-200">
      <button
        type="button"
        @click="selectCustom"
        class="w-full p-3 border border-dashed border-gray-300 rounded-lg text-center hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
      >
        <PlusIcon class="h-5 w-5 mx-auto mb-1 text-gray-400" />
        <span class="text-sm text-gray-600">Start with blank form (no template)</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  MagnifyingGlassIcon,
  DocumentIcon,
  CheckCircleIcon,
  PlusIcon
} from '@heroicons/vue/24/outline'
import type { InteractionType } from '@/types/interactions'

/**
 * Interaction template interface
 */
interface InteractionTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: string
  interactionType: InteractionType
  subjectTemplate: string
  notesTemplate?: string
  followUpSuggested: boolean
  followUpTemplate?: {
    description: string
    daysOffset: number
    type: InteractionType
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  }
  isQuickTemplate: boolean
}

/**
 * Props interface
 */
interface Props {
  name: string
  label?: string
  autoSelect?: boolean
  showQuickOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Choose Interaction Template',
  autoSelect: false,
  showQuickOnly: false
})

/**
 * Emits interface
 */
interface Emits {
  'template-selected': [template: InteractionTemplate | null]
  'apply-template': [templateData: {
    interactionType: InteractionType
    subject: string
    notes?: string
    followUpNeeded: boolean
    followUpDate?: string
    followUpNotes?: string
    followUpType?: InteractionType
    followUpPriority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  }]
  'custom-selected': []
}

const emit = defineEmits<Emits>()

// ===============================
// COMPONENT STATE
// ===============================

const showQuickTemplates = ref(true)
const searchQuery = ref('')
const selectedCategories = ref<string[]>([])
const selectedTemplate = ref<InteractionTemplate | null>(null)

// ===============================
// TEMPLATE DATA
// ===============================

const templates = ref<InteractionTemplate[]>([
  // Quick Templates (Most Common)
  {
    id: 'quick-phone-follow-up',
    name: 'Follow-up Phone Call',
    description: 'Quick follow-up call to check on previous interaction',
    category: 'Follow-up',
    icon: '📞',
    interactionType: 'PHONE_CALL',
    subjectTemplate: 'Follow-up call with [Contact Name]',
    notesTemplate: 'Follow-up call to discuss previous meeting outcomes and next steps.',
    followUpSuggested: true,
    followUpTemplate: {
      description: 'Schedule next meeting',
      daysOffset: 7,
      type: 'VIRTUAL_MEETING',
      priority: 'MEDIUM'
    },
    isQuickTemplate: true
  },
  {
    id: 'quick-demo-request',
    name: 'Product Demo Request',
    description: 'Initial product demonstration request',
    category: 'Sales',
    icon: '🎥',
    interactionType: 'PRODUCT_DEMO',
    subjectTemplate: 'Product demonstration for [Organization Name]',
    notesTemplate: 'Initial product demonstration to showcase key features and capabilities.',
    followUpSuggested: true,
    followUpTemplate: {
      description: 'Follow-up on demo feedback',
      daysOffset: 3,
      type: 'PHONE_CALL',
      priority: 'HIGH'
    },
    isQuickTemplate: true
  },
  {
    id: 'quick-virtual-meeting',
    name: 'Virtual Meeting',
    description: 'Standard virtual meeting with clients',
    category: 'Meetings',
    icon: '💻',
    interactionType: 'VIRTUAL_MEETING',
    subjectTemplate: 'Virtual meeting with [Contact Name]',
    notesTemplate: 'Virtual meeting to discuss project requirements and next steps.',
    followUpSuggested: false,
    isQuickTemplate: true
  },
  {
    id: 'quick-email-outreach',
    name: 'Email Outreach',
    description: 'Initial email contact with prospects',
    category: 'Lead Generation',
    icon: '📧',
    interactionType: 'EMAIL',
    subjectTemplate: 'Introduction email to [Contact Name]',
    notesTemplate: 'Initial outreach email introducing our services and exploring potential collaboration.',
    followUpSuggested: true,
    followUpTemplate: {
      description: 'Follow-up email if no response',
      daysOffset: 5,
      type: 'EMAIL',
      priority: 'MEDIUM'
    },
    isQuickTemplate: true
  },
  {
    id: 'quick-support-request',
    name: 'Support Request',
    description: 'Customer support inquiry or issue',
    category: 'Support',
    icon: '🆘',
    interactionType: 'SUPPORT_REQUEST',
    subjectTemplate: 'Support request from [Contact Name]',
    notesTemplate: 'Customer support request requiring investigation and resolution.',
    followUpSuggested: true,
    followUpTemplate: {
      description: 'Follow-up on resolution',
      daysOffset: 1,
      type: 'EMAIL',
      priority: 'HIGH'
    },
    isQuickTemplate: true
  },
  {
    id: 'quick-feedback-collection',
    name: 'Feedback Collection',
    description: 'Gathering customer feedback and insights',
    category: 'Research',
    icon: '💭',
    interactionType: 'FEEDBACK',
    subjectTemplate: 'Feedback session with [Contact Name]',
    notesTemplate: 'Collecting customer feedback on recent service experience.',
    followUpSuggested: false,
    isQuickTemplate: true
  },

  // Extended Templates
  {
    id: 'cold-call-outreach',
    name: 'Cold Call Outreach',
    description: 'Initial cold call to new prospects',
    category: 'Lead Generation',
    icon: '☎️',
    interactionType: 'PHONE_CALL',
    subjectTemplate: 'Cold call introduction to [Contact Name] at [Organization Name]',
    notesTemplate: 'Cold call to introduce our services, understand their needs, and qualify as potential client. Key discussion points: current challenges, budget timeline, decision-making process.',
    followUpSuggested: true,
    followUpTemplate: {
      description: 'Send follow-up email with information',
      daysOffset: 1,
      type: 'EMAIL',
      priority: 'HIGH'
    },
    isQuickTemplate: false
  },
  {
    id: 'proposal-presentation',
    name: 'Proposal Presentation',
    description: 'Formal proposal presentation meeting',
    category: 'Sales',
    icon: '📊',
    interactionType: 'IN_PERSON_MEETING',
    subjectTemplate: 'Proposal presentation for [Organization Name] project',
    notesTemplate: 'Formal presentation of project proposal including scope, timeline, budget, and deliverables. Address any questions or concerns from stakeholders.',
    followUpSuggested: true,
    followUpTemplate: {
      description: 'Follow-up on proposal decision',
      daysOffset: 5,
      type: 'PHONE_CALL',
      priority: 'HIGH'
    },
    isQuickTemplate: false
  },
  {
    id: 'client-onboarding',
    name: 'Client Onboarding',
    description: 'New client onboarding session',
    category: 'Onboarding',
    icon: '🎯',
    interactionType: 'VIRTUAL_MEETING',
    subjectTemplate: 'Onboarding session with [Contact Name]',
    notesTemplate: 'Client onboarding session covering project overview, team introductions, communication protocols, and next steps.',
    followUpSuggested: true,
    followUpTemplate: {
      description: 'Check onboarding progress',
      daysOffset: 7,
      type: 'EMAIL',
      priority: 'MEDIUM'
    },
    isQuickTemplate: false
  },
  {
    id: 'technical-consultation',
    name: 'Technical Consultation',
    description: 'Technical discussion and consultation',
    category: 'Technical',
    icon: '⚙️',
    interactionType: 'VIRTUAL_MEETING',
    subjectTemplate: 'Technical consultation with [Contact Name]',
    notesTemplate: 'Technical consultation to discuss implementation details, architecture decisions, and technical requirements.',
    followUpSuggested: true,
    followUpTemplate: {
      description: 'Send technical documentation',
      daysOffset: 2,
      type: 'EMAIL',
      priority: 'MEDIUM'
    },
    isQuickTemplate: false
  },
  {
    id: 'complaint-resolution',
    name: 'Complaint Resolution',
    description: 'Handling customer complaints',
    category: 'Support',
    icon: '⚠️',
    interactionType: 'COMPLAINT',
    subjectTemplate: 'Complaint resolution for [Contact Name]',
    notesTemplate: 'Customer complaint requiring immediate attention and resolution. Document issue details, customer impact, and resolution steps taken.',
    followUpSuggested: true,
    followUpTemplate: {
      description: 'Follow-up on satisfaction',
      daysOffset: 3,
      type: 'PHONE_CALL',
      priority: 'HIGH'
    },
    isQuickTemplate: false
  },
  {
    id: 'quarterly-review',
    name: 'Quarterly Business Review',
    description: 'Quarterly review with existing clients',
    category: 'Relationship Management',
    icon: '📈',
    interactionType: 'IN_PERSON_MEETING',
    subjectTemplate: 'Q[Quarter] business review with [Organization Name]',
    notesTemplate: 'Quarterly business review covering performance metrics, success stories, challenges, upcoming opportunities, and relationship feedback.',
    followUpSuggested: true,
    followUpTemplate: {
      description: 'Send QBR summary and action items',
      daysOffset: 2,
      type: 'EMAIL',
      priority: 'MEDIUM'
    },
    isQuickTemplate: false
  },
  {
    id: 'trade-show-follow-up',
    name: 'Trade Show Follow-up',
    description: 'Follow-up from trade show interactions',
    category: 'Events',
    icon: '🏢',
    interactionType: 'TRADE_SHOW',
    subjectTemplate: 'Follow-up from [Event Name] trade show',
    notesTemplate: 'Follow-up from trade show booth interaction. Recap conversation, provide requested information, and explore next steps.',
    followUpSuggested: true,
    followUpTemplate: {
      description: 'Schedule detailed discussion',
      daysOffset: 5,
      type: 'VIRTUAL_MEETING',
      priority: 'MEDIUM'
    },
    isQuickTemplate: false
  },
  {
    id: 'site-visit-evaluation',
    name: 'Site Visit & Evaluation',
    description: 'On-site evaluation and assessment',
    category: 'Assessment',
    icon: '🏗️',
    interactionType: 'SITE_VISIT',
    subjectTemplate: 'Site visit and evaluation at [Organization Name]',
    notesTemplate: 'On-site visit to evaluate current setup, assess requirements, and identify improvement opportunities.',
    followUpSuggested: true,
    followUpTemplate: {
      description: 'Send evaluation report',
      daysOffset: 3,
      type: 'EMAIL',
      priority: 'HIGH'
    },
    isQuickTemplate: false
  }
])

// ===============================
// COMPUTED PROPERTIES
// ===============================

const quickTemplates = computed(() => 
  templates.value.filter(t => t.isQuickTemplate)
)

const categories = computed(() => {
  const cats = new Set(templates.value.map(t => t.category))
  return Array.from(cats).sort()
})

const filteredTemplates = computed(() => {
  let filtered = templates.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(template =>
      template.name.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query) ||
      template.category.toLowerCase().includes(query) ||
      template.subjectTemplate.toLowerCase().includes(query)
    )
  }

  // Filter by categories
  if (selectedCategories.value.length > 0) {
    filtered = filtered.filter(template =>
      selectedCategories.value.includes(template.category)
    )
  }

  return filtered
})

// ===============================
// EVENT HANDLERS
// ===============================

const selectTemplate = (template: InteractionTemplate) => {
  selectedTemplate.value = template
  emit('template-selected', template)
}

const clearSelection = () => {
  selectedTemplate.value = null
  emit('template-selected', null)
}

const selectCustom = () => {
  clearSelection()
  emit('custom-selected')
}

const applyTemplate = () => {
  if (!selectedTemplate.value) return

  const template = selectedTemplate.value
  const templateData = {
    interactionType: template.interactionType,
    subject: template.subjectTemplate,
    notes: template.notesTemplate,
    followUpNeeded: template.followUpSuggested,
    ...(template.followUpSuggested && template.followUpTemplate && {
      followUpDate: calculateFollowUpDate(template.followUpTemplate.daysOffset),
      followUpNotes: template.followUpTemplate.description,
      followUpType: template.followUpTemplate.type,
      followUpPriority: template.followUpTemplate.priority
    })
  }

  emit('apply-template', templateData)
}

const toggleCategory = (category: string) => {
  const index = selectedCategories.value.indexOf(category)
  if (index > -1) {
    selectedCategories.value.splice(index, 1)
  } else {
    selectedCategories.value.push(category)
  }
}

const clearCategories = () => {
  selectedCategories.value = []
}

const handleTemplateKeydown = (event: KeyboardEvent, template: InteractionTemplate) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    selectTemplate(template)
  }
}

// ===============================
// UTILITY FUNCTIONS
// ===============================

const formatInteractionType = (type: InteractionType): string => {
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}

const calculateFollowUpDate = (daysOffset: number): string => {
  const date = new Date()
  date.setDate(date.getDate() + daysOffset)
  date.setHours(9, 0, 0, 0) // Default to 9 AM
  return date.toISOString().slice(0, 16)
}

// ===============================
// LIFECYCLE
// ===============================

onMounted(() => {
  if (props.autoSelect && quickTemplates.value.length > 0) {
    selectTemplate(quickTemplates.value[0])
  }
  
  if (props.showQuickOnly) {
    showQuickTemplates.value = true
  }
})
</script>

<style scoped>
.interaction-template-select {
  @apply w-full;
}

/* Template card animations */
.interaction-template-select button {
  transition: all 0.2s ease-in-out;
}

.interaction-template-select button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Focus improvements for accessibility */
.interaction-template-select button:focus-visible,
.interaction-template-select input:focus-visible {
  @apply ring-offset-2;
}

/* Category filter animations */
.interaction-template-select .category-filter {
  transition: all 0.2s ease-in-out;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .interaction-template-select .grid-cols-3 {
    @apply grid-cols-1;
  }
  
  .interaction-template-select .max-h-64 {
    @apply max-h-48;
  }
}

/* Template selection animation */
@keyframes templateSelect {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}

.interaction-template-select [aria-selected="true"] {
  animation: templateSelect 0.3s ease-out;
}

/* Quick template grid responsive */
@media (max-width: 1024px) {
  .interaction-template-select .lg\\:grid-cols-3 {
    @apply grid-cols-2;
  }
}

@media (max-width: 640px) {
  .interaction-template-select .sm\\:grid-cols-2 {
    @apply grid-cols-1;
  }
}
</style>