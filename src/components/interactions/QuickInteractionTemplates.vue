<template>
  <div class="quick-interaction-templates">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-4 py-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">Quick Templates</h2>
        <button
          @click="$emit('close')"
          class="p-2 text-gray-400 hover:text-gray-600 touch-target"
          aria-label="Close templates"
        >
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <p class="mt-1 text-sm text-gray-600">Choose a template to quickly log field interactions</p>
    </div>

    <!-- Search Filter -->
    <div class="bg-white px-4 py-3 border-b border-gray-200">
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search templates..."
          class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent touch-target"
        />
        <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>

    <!-- Template Categories -->
    <div class="bg-white px-4 py-3 border-b border-gray-200">
      <div class="flex space-x-2 overflow-x-auto pb-2">
        <button
          v-for="category in categories"
          :key="category.id"
          @click="selectedCategory = category.id"
          :class="[
            'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors touch-target',
            selectedCategory === category.id
              ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
              : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
          ]"
        >
          <span class="mr-2">{{ category.icon }}</span>
          {{ category.name }}
        </button>
      </div>
    </div>

    <!-- Template List -->
    <div class="flex-1 overflow-y-auto bg-gray-50">
      <div class="px-4 py-4 space-y-3">
        <div
          v-for="template in filteredTemplates"
          :key="template.id"
          @click="selectTemplate(template)"
          :class="[
            'bg-white rounded-lg border-2 transition-all cursor-pointer touch-target',
            'hover:border-primary-300 hover:shadow-md active:scale-98',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
          ]"
          tabindex="0"
          @keydown.enter="selectTemplate(template)"
          @keydown.space.prevent="selectTemplate(template)"
        >
          <div class="p-4">
            <!-- Template Header -->
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center space-x-3">
                <div :class="[
                  'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl',
                  getTemplateColorClasses(template.category)
                ]">
                  {{ template.icon }}
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="text-base font-semibold text-gray-900 truncate">{{ template.name }}</h3>
                  <p class="text-sm text-gray-600">{{ template.description }}</p>
                </div>
              </div>
              <div class="flex-shrink-0 ml-2">
                <span :class="[
                  'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                  getCategoryBadgeClasses(template.category)
                ]">
                  {{ getCategoryName(template.category) }}
                </span>
              </div>
            </div>

            <!-- Template Details -->
            <div class="space-y-2">
              <div class="flex items-center space-x-4 text-sm text-gray-600">
                <div class="flex items-center space-x-1">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>~{{ template.estimatedDuration }}min</span>
                </div>
                <div class="flex items-center space-x-1">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{{ template.requiresLocation ? 'Location' : 'Remote' }}</span>
                </div>
                <div v-if="template.supportsVoice" class="flex items-center space-x-1">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span>Voice</span>
                </div>
              </div>

              <!-- Quick Fields Preview -->
              <div class="bg-gray-50 rounded-md p-3">
                <p class="text-xs font-medium text-gray-700 mb-2">Auto-fills:</p>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="field in template.autoFillFields"
                    :key="field"
                    class="inline-flex items-center px-2 py-1 rounded-md bg-white border text-xs text-gray-600"
                  >
                    {{ formatFieldName(field) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredTemplates.length === 0" class="text-center py-8">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
          <p class="mt-1 text-sm text-gray-500">Try adjusting your search or category filter</p>
        </div>
      </div>
    </div>

    <!-- Recently Used Templates -->
    <div v-if="recentTemplates.length > 0" class="bg-white border-t border-gray-200 px-4 py-3">
      <h3 class="text-sm font-medium text-gray-900 mb-3">Recently Used</h3>
      <div class="flex space-x-3 overflow-x-auto pb-2">
        <button
          v-for="template in recentTemplates"
          :key="`recent-${template.id}`"
          @click="selectTemplate(template)"
          class="flex-shrink-0 flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors touch-target"
        >
          <span>{{ template.icon }}</span>
          <span class="font-medium">{{ template.name }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<!--
  QuickInteractionTemplates - Mobile-optimized template selection for field interactions
  
  Features:
  - Touch-optimized interface with 44px minimum touch targets
  - Category-based filtering for quick access
  - Search functionality for template discovery
  - Visual indicators for template characteristics (location, voice, duration)
  - Recently used templates for frequent scenarios
  - Auto-fill field previews to show what will be populated
  - Keyboard navigation support for accessibility
  
  Mobile Templates:
  - Dropped Samples: Quick sample delivery logging
  - Quick Call: Brief phone call documentation
  - Site Visit: In-person meeting with location tracking
  - Demo Completed: Product demonstration results
  - Follow-up Scheduled: Next steps planning
  
  Design Principles:
  - Large touch targets (44px minimum)
  - Clear visual hierarchy
  - One-handed operation support
  - Fast template selection
  - Context-aware auto-filling
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { InteractionType } from '@/types/interactions'

/**
 * Template interface for mobile quick interactions
 */
interface MobileInteractionTemplate {
  id: string
  name: string
  description: string
  icon: string
  category: 'field' | 'communication' | 'meeting' | 'follow_up'
  interactionType: InteractionType
  estimatedDuration: number
  requiresLocation: boolean
  supportsVoice: boolean
  autoFillFields: string[]
  titleTemplate: string
  descriptionTemplate: string
  defaultFollowUpDays?: number
}

/**
 * Template category configuration
 */
interface TemplateCategory {
  id: string
  name: string
  icon: string
  description: string
}

/**
 * Component props
 */
interface Props {
  /** Pre-selected organization for context */
  organizationId?: string
  /** Pre-selected opportunity for context */
  opportunityId?: string
  /** Show only templates for specific category */
  filterCategory?: string
}

const props = defineProps<Props>()

/**
 * Component emits
 */
interface Emits {
  /** Emitted when template is selected */
  templateSelected: [template: MobileInteractionTemplate]
  /** Emitted when templates dialog should close */
  close: []
}

const emit = defineEmits<Emits>()

// ===============================
// REACTIVE STATE
// ===============================

const searchQuery = ref('')
const selectedCategory = ref('all')
const recentTemplates = ref<MobileInteractionTemplate[]>([])

// ===============================
// TEMPLATE CATEGORIES
// ===============================

const categories: TemplateCategory[] = [
  { id: 'all', name: 'All', icon: '📋', description: 'All available templates' },
  { id: 'field', name: 'Field Work', icon: '🚗', description: 'On-site activities and visits' },
  { id: 'communication', name: 'Communications', icon: '📞', description: 'Calls, emails, and messages' },
  { id: 'meeting', name: 'Meetings', icon: '👥', description: 'Scheduled meetings and demos' },
  { id: 'follow_up', name: 'Follow-ups', icon: '📅', description: 'Next steps and scheduling' }
]

// ===============================
// MOBILE INTERACTION TEMPLATES
// ===============================

const templates: MobileInteractionTemplate[] = [
  {
    id: 'dropped_samples',
    name: 'Dropped Samples',
    description: 'Quick sample delivery logging with location',
    icon: '📦',
    category: 'field',
    interactionType: InteractionType.IN_PERSON,
    estimatedDuration: 5,
    requiresLocation: true,
    supportsVoice: true,
    autoFillFields: ['title', 'description', 'location', 'duration'],
    titleTemplate: 'Sample delivery - {organization}',
    descriptionTemplate: 'Delivered product samples to {organization}. Samples include: [Voice input supported]',
    defaultFollowUpDays: 3
  },
  {
    id: 'quick_call',
    name: 'Quick Call',
    description: 'Brief phone call documentation',
    icon: '📱',
    category: 'communication',
    interactionType: InteractionType.CALL,
    estimatedDuration: 3,
    requiresLocation: false,
    supportsVoice: true,
    autoFillFields: ['title', 'description', 'duration'],
    titleTemplate: 'Quick call - {organization}',
    descriptionTemplate: 'Brief phone call with {organization}. Discussion topics: [Voice input supported]',
    defaultFollowUpDays: 7
  },
  {
    id: 'site_visit',
    name: 'Site Visit',
    description: 'In-person meeting with GPS location',
    icon: '🏢',
    category: 'field',
    interactionType: InteractionType.IN_PERSON,
    estimatedDuration: 45,
    requiresLocation: true,
    supportsVoice: true,
    autoFillFields: ['title', 'description', 'location', 'duration'],
    titleTemplate: 'Site visit - {organization}',
    descriptionTemplate: 'On-site meeting at {organization}. Meeting agenda: [Voice input supported]',
    defaultFollowUpDays: 5
  },
  {
    id: 'demo_completed',
    name: 'Demo Completed',
    description: 'Product demonstration results and feedback',
    icon: '🖥️',
    category: 'meeting',
    interactionType: InteractionType.DEMO,
    estimatedDuration: 30,
    requiresLocation: false,
    supportsVoice: true,
    autoFillFields: ['title', 'description', 'outcome', 'follow_up_needed'],
    titleTemplate: 'Product demo - {organization}',
    descriptionTemplate: 'Completed product demonstration for {organization}. Demo outcome: [Voice input supported]',
    defaultFollowUpDays: 2
  },
  {
    id: 'follow_up_scheduled',
    name: 'Follow-up Scheduled',
    description: 'Next steps planning and scheduling',
    icon: '📅',
    category: 'follow_up',
    interactionType: InteractionType.FOLLOW_UP,
    estimatedDuration: 10,
    requiresLocation: false,
    supportsVoice: false,
    autoFillFields: ['title', 'description', 'follow_up_date', 'follow_up_notes'],
    titleTemplate: 'Follow-up scheduled - {organization}',
    descriptionTemplate: 'Scheduled follow-up actions with {organization}. Next steps: [Manual input]'
  },
  {
    id: 'contract_discussion',
    name: 'Contract Discussion',
    description: 'Contract terms and pricing conversation',
    icon: '📄',
    category: 'meeting',
    interactionType: InteractionType.IN_PERSON,
    estimatedDuration: 60,
    requiresLocation: false,
    supportsVoice: true,
    autoFillFields: ['title', 'description', 'outcome'],
    titleTemplate: 'Contract discussion - {organization}',
    descriptionTemplate: 'Contract and pricing discussion with {organization}. Key points: [Voice input supported]',
    defaultFollowUpDays: 3
  },
  {
    id: 'technical_support',
    name: 'Technical Support',
    description: 'Technical assistance and troubleshooting',
    icon: '🔧',
    category: 'communication',
    interactionType: InteractionType.CALL,
    estimatedDuration: 20,
    requiresLocation: false,
    supportsVoice: true,
    autoFillFields: ['title', 'description', 'outcome'],
    titleTemplate: 'Technical support - {organization}',
    descriptionTemplate: 'Provided technical support to {organization}. Issue resolved: [Voice input supported]',
    defaultFollowUpDays: 7
  },
  {
    id: 'trade_show_contact',
    name: 'Trade Show Contact',
    description: 'New contact from trade show or event',
    icon: '🎪',
    category: 'field',
    interactionType: InteractionType.IN_PERSON,
    estimatedDuration: 15,
    requiresLocation: true,
    supportsVoice: true,
    autoFillFields: ['title', 'description', 'location', 'follow_up_needed'],
    titleTemplate: 'Trade show meeting - {organization}',
    descriptionTemplate: 'Met {organization} at trade show. Interest level: [Voice input supported]',
    defaultFollowUpDays: 2
  }
]

// ===============================
// COMPUTED PROPERTIES
// ===============================

const filteredTemplates = computed(() => {
  let filtered = templates

  // Filter by category
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(template => template.category === selectedCategory.value)
  }

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(template =>
      template.name.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query) ||
      template.autoFillFields.some(field => field.toLowerCase().includes(query))
    )
  }

  return filtered
})

// ===============================
// HELPER METHODS
// ===============================

const getTemplateColorClasses = (category: string): string => {
  const colorMap = {
    field: 'bg-green-100 text-green-700',
    communication: 'bg-blue-100 text-blue-700',
    meeting: 'bg-purple-100 text-purple-700',
    follow_up: 'bg-orange-100 text-orange-700'
  }
  return colorMap[category as keyof typeof colorMap] || 'bg-gray-100 text-gray-700'
}

const getCategoryBadgeClasses = (category: string): string => {
  const colorMap = {
    field: 'bg-green-100 text-green-800',
    communication: 'bg-blue-100 text-blue-800',
    meeting: 'bg-purple-100 text-purple-800',
    follow_up: 'bg-orange-100 text-orange-800'
  }
  return colorMap[category as keyof typeof colorMap] || 'bg-gray-100 text-gray-800'
}

const getCategoryName = (category: string): string => {
  const nameMap = {
    field: 'Field',
    communication: 'Call',
    meeting: 'Meeting',
    follow_up: 'Follow-up'
  }
  return nameMap[category as keyof typeof nameMap] || 'Other'
}

const formatFieldName = (field: string): string => {
  return field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const selectTemplate = (template: MobileInteractionTemplate) => {
  // Add to recent templates
  addToRecentTemplates(template)
  
  // Emit template selection
  emit('templateSelected', template)
}

const addToRecentTemplates = (template: MobileInteractionTemplate) => {
  // Remove if already in recent list
  recentTemplates.value = recentTemplates.value.filter(t => t.id !== template.id)
  
  // Add to beginning of list
  recentTemplates.value.unshift(template)
  
  // Keep only last 5 recent templates
  recentTemplates.value = recentTemplates.value.slice(0, 5)
  
  // Store in localStorage for persistence
  localStorage.setItem('crm-recent-templates', JSON.stringify(recentTemplates.value))
}

const loadRecentTemplates = () => {
  try {
    const stored = localStorage.getItem('crm-recent-templates')
    if (stored) {
      recentTemplates.value = JSON.parse(stored)
    }
  } catch (error) {
    console.warn('Failed to load recent templates:', error)
    recentTemplates.value = []
  }
}

// ===============================
// LIFECYCLE
// ===============================

onMounted(() => {
  loadRecentTemplates()
  
  // Set initial category filter if provided
  if (props.filterCategory) {
    selectedCategory.value = props.filterCategory
  }
})
</script>

<style scoped>
.quick-interaction-templates {
  @apply h-full flex flex-col;
}

.touch-target {
  @apply min-h-[44px] min-w-[44px] flex items-center justify-center;
}

.active\:scale-98:active {
  transform: scale(0.98);
}

/* Scrollbar styling for mobile */
.overflow-x-auto::-webkit-scrollbar {
  height: 4px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  @apply bg-gray-100 rounded;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  @apply bg-gray-300 rounded;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400;
}

/* Focus styles for accessibility */
button:focus-visible,
[tabindex]:focus-visible {
  @apply outline-none ring-2 ring-primary-500 ring-offset-2;
}

/* Mobile-specific adjustments */
@media (max-width: 768px) {
  .quick-interaction-templates {
    @apply h-screen;
  }
}
</style>