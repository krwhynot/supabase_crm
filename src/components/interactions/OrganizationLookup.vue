<template>
  <div class="organization-lookup">
    <label :for="name" class="block text-sm font-medium text-gray-700 mb-2">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>
    
    <!-- Search Input -->
    <div class="relative">
      <div class="relative">
        <input
          :id="name"
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          :placeholder="placeholder"
          :class="inputClasses"
          :aria-invalid="!!error"
          :aria-describedby="error ? `${name}-error` : undefined"
          :aria-expanded="showDropdown"
          :aria-haspopup="listbox"
          role="combobox"
          aria-autocomplete="list"
          @input="handleInput"
          @focus="handleFocus"
          @blur="handleBlur"
          @keydown="handleKeydown"
        />
        
        <!-- Search Icon -->
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
        </div>
        
        <!-- Clear Button -->
        <button
          v-if="selectedOrganization && !disabled"
          type="button"
          @click="clearSelection"
          class="absolute inset-y-0 right-0 pr-3 flex items-center"
          :aria-label="'Clear selected organization'"
        >
          <XMarkIcon class="h-5 w-5 text-gray-400 hover:text-gray-600" />
        </button>
        
        <!-- Loading Spinner -->
        <div v-if="loading" class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <div class="animate-spin h-5 w-5 border-2 border-gray-300 border-t-primary-600 rounded-full"></div>
        </div>
      </div>
      
      <!-- Dropdown List -->
      <div
        v-if="showDropdown"
        class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
        role="listbox"
        :aria-label="'Select organization'"
      >
        <!-- No Results -->
        <div
          v-if="filteredOrganizations.length === 0 && !loading"
          class="px-4 py-2 text-sm text-gray-500"
        >
          {{ noResultsText }}
        </div>
        
        <!-- Loading State -->
        <div
          v-if="loading"
          class="px-4 py-2 text-sm text-gray-500 flex items-center"
        >
          <div class="animate-spin h-4 w-4 border-2 border-gray-300 border-t-primary-600 rounded-full mr-2"></div>
          Searching organizations...
        </div>
        
        <!-- Organization Options -->
        <div
          v-for="(organization, index) in filteredOrganizations"
          :key="organization.id"
          :class="[
            'px-4 py-3 cursor-pointer select-none relative',
            highlightedIndex === index ? 'bg-primary-100 text-primary-900' : 'text-gray-900',
            'hover:bg-primary-50'
          ]"
          role="option"
          :aria-selected="selectedOrganization?.id === organization.id"
          @click="selectOrganization(organization)"
          @mouseenter="highlightedIndex = index"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-2">
                <div class="text-sm font-medium text-gray-900 truncate">
                  {{ organization.name }}
                </div>
                <div
                  v-if="organization.type"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {{ organization.type }}
                </div>
              </div>
              
              <div class="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                <span v-if="organization.industry" class="flex items-center">
                  <TagIcon class="h-3 w-3 mr-1" />
                  {{ organization.industry }}
                </span>
                <span v-if="organization.website" class="flex items-center">
                  <GlobeAltIcon class="h-3 w-3 mr-1" />
                  {{ organization.website }}
                </span>
                <span v-if="organization.email" class="flex items-center">
                  <EnvelopeIcon class="h-3 w-3 mr-1" />
                  {{ organization.email }}
                </span>
                <span v-if="organization.phone" class="flex items-center">
                  <PhoneIcon class="h-3 w-3 mr-1" />
                  {{ organization.phone }}
                </span>
              </div>
              
              <!-- Active Opportunities/Contacts Count -->
              <div v-if="organization.active_opportunities > 0 || organization.active_contacts > 0" class="mt-1 flex items-center space-x-3 text-xs text-blue-600">
                <span v-if="organization.active_opportunities > 0" class="flex items-center">
                  <ChartBarIcon class="h-3 w-3 mr-1" />
                  {{ organization.active_opportunities }} {{ organization.active_opportunities === 1 ? 'opportunity' : 'opportunities' }}
                </span>
                <span v-if="organization.active_contacts > 0" class="flex items-center">
                  <UserIcon class="h-3 w-3 mr-1" />
                  {{ organization.active_contacts }} {{ organization.active_contacts === 1 ? 'contact' : 'contacts' }}
                </span>
              </div>
            </div>
            
            <!-- Selection Indicator -->
            <CheckIcon
              v-if="selectedOrganization?.id === organization.id"
              class="h-5 w-5 text-primary-600 ml-2 flex-shrink-0"
            />
          </div>
        </div>
        
        <!-- Create New Option -->
        <div
          v-if="allowCreate && searchQuery && !hasExactMatch"
          :class="[
            'px-4 py-3 cursor-pointer select-none relative border-t border-gray-200',
            highlightedIndex === filteredOrganizations.length ? 'bg-primary-100 text-primary-900' : 'text-gray-700',
            'hover:bg-primary-50'
          ]"
          role="option"
          :aria-selected="false"
          @click="createNewOrganization"
          @mouseenter="highlightedIndex = filteredOrganizations.length"
        >
          <div class="flex items-center">
            <PlusIcon class="h-4 w-4 text-gray-400 mr-2" />
            <span class="text-sm">Create new organization: "{{ searchQuery }}"</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Selected Organization Display -->
    <div v-if="selectedOrganization && !showDropdown" class="mt-2 p-3 bg-gray-50 rounded-md">
      <div class="flex items-center justify-between">
        <div class="flex-1 min-w-0">
          <div class="flex items-center space-x-2">
            <div class="text-sm font-medium text-gray-900">
              {{ selectedOrganization.name }}
            </div>
            <div
              v-if="selectedOrganization.type"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
            >
              {{ selectedOrganization.type }}
            </div>
          </div>
          
          <div class="mt-1 flex items-center space-x-4 text-xs text-gray-500">
            <span v-if="selectedOrganization.industry" class="flex items-center">
              <TagIcon class="h-3 w-3 mr-1" />
              {{ selectedOrganization.industry }}
            </span>
            <span v-if="selectedOrganization.website" class="flex items-center">
              <GlobeAltIcon class="h-3 w-3 mr-1" />
              {{ selectedOrganization.website }}
            </span>
          </div>
        </div>
        
        <button
          v-if="!disabled"
          type="button"
          @click="clearSelection"
          class="ml-2 p-1 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          :aria-label="'Remove selected organization'"
        >
          <XMarkIcon class="h-4 w-4 text-gray-500" />
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
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useOrganizationStore } from '@/stores/organizationStore'
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
  PlusIcon,
  TagIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChartBarIcon,
  UserIcon
} from '@heroicons/vue/24/outline'

/**
 * Organization option interface for display
 */
interface OrganizationOption {
  id: string
  name: string
  type?: string
  industry?: string
  website?: string
  email?: string
  phone?: string
  active_opportunities: number
  active_contacts: number
}

/**
 * Props interface
 */
interface Props {
  name: string
  label: string
  modelValue: string | null
  error?: string
  required?: boolean
  disabled?: boolean
  description?: string
  placeholder?: string
  allowCreate?: boolean
  minSearchLength?: number
  initialOrganizationId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  disabled: false,
  placeholder: 'Search organizations...',
  allowCreate: false,
  minSearchLength: 2
})

/**
 * Emits interface
 */
interface Emits {
  'update:modelValue': [value: string | null]
  'organization-selected': [organizationId: string | null, organizationData: OrganizationOption | null]
  'create-organization': [name: string]
}

const emit = defineEmits<Emits>()

// ===============================
// COMPONENT STATE
// ===============================

const searchInput = ref<HTMLInputElement>()
const searchQuery = ref('')
const showDropdown = ref(false)
const loading = ref(false)
const highlightedIndex = ref(-1)
const organizations = ref<OrganizationOption[]>([])
const selectedOrganization = ref<OrganizationOption | null>(null)

// Dependencies
const organizationStore = useOrganizationStore()

// ===============================
// COMPUTED PROPERTIES
// ===============================

const inputClasses = computed(() => {
  const baseClasses = 'w-full pl-10 pr-10 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200'
  
  if (props.error) {
    return `${baseClasses} border-red-500 text-red-900 placeholder-red-300 focus:ring-red-500`
  }
  
  if (props.disabled) {
    return `${baseClasses} border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed`
  }
  
  return `${baseClasses} border-gray-300 text-gray-900 placeholder-gray-400`
})

const filteredOrganizations = computed(() => {
  if (!searchQuery.value || searchQuery.value.length < props.minSearchLength) {
    return organizations.value.slice(0, 10) // Show first 10 organizations
  }
  
  const query = searchQuery.value.toLowerCase()
  return organizations.value.filter(org =>
    org.name.toLowerCase().includes(query) ||
    (org.type && org.type.toLowerCase().includes(query)) ||
    (org.industry && org.industry.toLowerCase().includes(query)) ||
    (org.website && org.website.toLowerCase().includes(query))
  ).slice(0, 20) // Limit to 20 results
})

const hasExactMatch = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return filteredOrganizations.value.some(org => 
    org.name.toLowerCase() === query
  )
})

const noResultsText = computed(() => {
  if (searchQuery.value.length < props.minSearchLength) {
    return `Type at least ${props.minSearchLength} characters to search`
  }
  return 'No organizations found'
})

// ===============================
// ORGANIZATION DATA MANAGEMENT
// ===============================

/**
 * Load organizations from store
 */
const loadOrganizations = async () => {
  loading.value = true
  
  try {
    await organizationStore.fetchOrganizations()
    
    // Convert store organizations to options format
    organizations.value = organizationStore.organizations.map(org => ({
      id: org.id,
      name: org.name,
      type: org.type,
      industry: org.industry,
      website: org.website,
      email: org.email,
      phone: org.phone,
      active_opportunities: org.active_opportunities || 0,
      active_contacts: org.active_contacts || 0
    }))
    
    // Set selected organization if modelValue or initialOrganizationId exists
    const targetId = props.modelValue || props.initialOrganizationId
    if (targetId) {
      const selected = organizations.value.find(org => org.id === targetId)
      if (selected) {
        selectedOrganization.value = selected
        searchQuery.value = selected.name
      }
    }
  } catch (error) {
    console.error('Failed to load organizations:', error)
    
    // Fallback to demo data
    organizations.value = getDemoOrganizations()
    
    const targetId = props.modelValue || props.initialOrganizationId
    if (targetId) {
      const selected = organizations.value.find(org => org.id === targetId)
      if (selected) {
        selectedOrganization.value = selected
        searchQuery.value = selected.name
      }
    }
  } finally {
    loading.value = false
  }
}

/**
 * Search organizations based on query
 */
const searchOrganizations = async (query: string) => {
  if (!query || query.length < props.minSearchLength) {
    return
  }
  
  loading.value = true
  
  try {
    const filters = { search: query }
    await organizationStore.fetchOrganizations(filters)
    
    // Update organizations list
    organizations.value = organizationStore.organizations.map(org => ({
      id: org.id,
      name: org.name,
      type: org.type,
      industry: org.industry,
      website: org.website,
      email: org.email,
      phone: org.phone,
      active_opportunities: org.active_opportunities || 0,
      active_contacts: org.active_contacts || 0
    }))
  } catch (error) {
    console.error('Search failed:', error)
    // Keep existing organizations on search failure
  } finally {
    loading.value = false
  }
}

// ===============================
// EVENT HANDLERS
// ===============================

const handleInput = async () => {
  if (!selectedOrganization.value) {
    showDropdown.value = true
    highlightedIndex.value = -1
    
    // Debounced search
    setTimeout(() => {
      if (searchQuery.value.length >= props.minSearchLength) {
        searchOrganizations(searchQuery.value)
      }
    }, 300)
  }
}

const handleFocus = () => {
  if (!props.disabled && !selectedOrganization.value) {
    showDropdown.value = true
    highlightedIndex.value = -1
  }
}

const handleBlur = () => {
  // Delay hiding dropdown to allow for clicks
  setTimeout(() => {
    showDropdown.value = false
    highlightedIndex.value = -1
    
    // Reset search query if no selection made
    if (!selectedOrganization.value) {
      searchQuery.value = ''
    }
  }, 150)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!showDropdown.value) return
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      const maxDown = props.allowCreate && searchQuery.value && !hasExactMatch.value 
        ? filteredOrganizations.value.length 
        : filteredOrganizations.value.length - 1
      highlightedIndex.value = Math.min(highlightedIndex.value + 1, maxDown)
      break
      
    case 'ArrowUp':
      event.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1)
      break
      
    case 'Enter':
      event.preventDefault()
      if (highlightedIndex.value >= 0) {
        if (highlightedIndex.value < filteredOrganizations.value.length) {
          selectOrganization(filteredOrganizations.value[highlightedIndex.value])
        } else if (props.allowCreate && searchQuery.value && !hasExactMatch.value) {
          createNewOrganization()
        }
      }
      break
      
    case 'Escape':
      event.preventDefault()
      showDropdown.value = false
      searchInput.value?.blur()
      break
  }
}

const selectOrganization = (organization: OrganizationOption) => {
  selectedOrganization.value = organization
  searchQuery.value = organization.name
  showDropdown.value = false
  highlightedIndex.value = -1
  
  emit('update:modelValue', organization.id)
  emit('organization-selected', organization.id, organization)
}

const clearSelection = () => {
  selectedOrganization.value = null
  searchQuery.value = ''
  showDropdown.value = false
  highlightedIndex.value = -1
  
  emit('update:modelValue', null)
  emit('organization-selected', null, null)
  
  nextTick(() => {
    searchInput.value?.focus()
  })
}

const createNewOrganization = () => {
  const name = searchQuery.value.trim()
  if (name) {
    emit('create-organization', name)
    showDropdown.value = false
    highlightedIndex.value = -1
  }
}

// ===============================
// DEMO DATA
// ===============================

/**
 * Demo organizations for fallback
 */
const getDemoOrganizations = (): OrganizationOption[] => {
  return [
    {
      id: 'demo-org-1',
      name: 'TechCorp Solutions',
      type: 'Technology',
      industry: 'Software',
      website: 'https://techcorp.com',
      email: 'info@techcorp.com',
      phone: '+1-555-0100',
      active_opportunities: 3,
      active_contacts: 5
    },
    {
      id: 'demo-org-2',
      name: 'StartupCo Inc',
      type: 'Startup',
      industry: 'SaaS',
      website: 'https://startupco.com',
      email: 'hello@startupco.com',
      phone: '+1-555-0200',
      active_opportunities: 1,
      active_contacts: 2
    },
    {
      id: 'demo-org-3',
      name: 'RetailGiant Corp',
      type: 'Enterprise',
      industry: 'Retail',
      website: 'https://retailgiant.com',
      email: 'contact@retailgiant.com',
      phone: '+1-555-0300',
      active_opportunities: 2,
      active_contacts: 8
    },
    {
      id: 'demo-org-4',
      name: 'Finance Secure Ltd',
      type: 'Financial Services',
      industry: 'Finance',
      website: 'https://financesecure.com',
      email: 'info@financesecure.com',
      phone: '+1-555-0400',
      active_opportunities: 1,
      active_contacts: 3
    },
    {
      id: 'demo-org-5',
      name: 'Innovation Labs',
      type: 'R&D',
      industry: 'Technology',
      website: 'https://innovationlabs.com',
      email: 'research@innovationlabs.com',
      phone: '+1-555-0500',
      active_opportunities: 0,
      active_contacts: 1
    }
  ]
}

// ===============================
// WATCHERS
// ===============================

// Watch for external modelValue changes
watch(() => props.modelValue, async (newValue) => {
  if (newValue && newValue !== selectedOrganization.value?.id) {
    // Find organization in current list or load it
    let organization = organizations.value.find(org => org.id === newValue)
    
    if (!organization) {
      // Try to load the specific organization
      await loadOrganizations()
      organization = organizations.value.find(org => org.id === newValue)
    }
    
    if (organization) {
      selectedOrganization.value = organization
      searchQuery.value = organization.name
    }
  } else if (!newValue) {
    selectedOrganization.value = null
    searchQuery.value = ''
  }
})

// Watch for initial organization ID changes
watch(() => props.initialOrganizationId, async (newValue) => {
  if (newValue && !props.modelValue) {
    await loadOrganizations()
  }
})

// ===============================
// LIFECYCLE
// ===============================

onMounted(() => {
  loadOrganizations()
})
</script>

<style scoped>
.organization-lookup {
  @apply w-full;
}

/* Dropdown animation */
.organization-lookup .absolute.z-10 {
  animation: fadeInDown 0.2s ease-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Focus improvements for accessibility */
.organization-lookup input:focus-visible {
  @apply ring-offset-2;
}

/* Highlight styles for keyboard navigation */
.organization-lookup [role="option"][aria-selected="true"] {
  @apply bg-primary-100;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .organization-lookup .max-h-60 {
    @apply max-h-48;
  }
}
</style>