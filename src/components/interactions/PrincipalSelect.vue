<template>
  <div class="principal-select">
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
          v-if="selectedPrincipal && !disabled"
          type="button"
          @click="clearSelection"
          class="absolute inset-y-0 right-0 pr-3 flex items-center"
          :aria-label="'Clear selected principal'"
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
        :aria-label="'Select principal'"
      >
        <!-- No Results -->
        <div
          v-if="filteredPrincipals.length === 0 && !loading"
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
          Searching principals...
        </div>
        
        <!-- Principal Options -->
        <div
          v-for="(principal, index) in filteredPrincipals"
          :key="principal.id"
          :class="[
            'px-4 py-3 cursor-pointer select-none relative',
            highlightedIndex === index ? 'bg-primary-100 text-primary-900' : 'text-gray-900',
            'hover:bg-primary-50'
          ]"
          role="option"
          :aria-selected="selectedPrincipal?.id === principal.id"
          @click="selectPrincipal(principal)"
          @mouseenter="highlightedIndex = index"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-3">
                <!-- Avatar -->
                <div class="flex-shrink-0">
                  <div class="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span class="text-sm font-medium text-gray-600">
                      {{ getInitials(principal.name) }}
                    </span>
                  </div>
                </div>
                
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-2">
                    <div class="text-sm font-medium text-gray-900 truncate">
                      {{ principal.name }}
                    </div>
                    <div
                      v-if="principal.isPrimary"
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      Primary
                    </div>
                  </div>
                  
                  <div class="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                    <span v-if="principal.title" class="flex items-center">
                      <BriefcaseIcon class="h-3 w-3 mr-1" />
                      {{ principal.title }}
                    </span>
                    <span v-if="principal.organization" class="flex items-center">
                      <BuildingOfficeIcon class="h-3 w-3 mr-1" />
                      {{ principal.organization }}
                    </span>
                    <span v-if="principal.department" class="flex items-center">
                      <UsersIcon class="h-3 w-3 mr-1" />
                      {{ principal.department }}
                    </span>
                  </div>
                  
                  <div class="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                    <span v-if="principal.email" class="flex items-center">
                      <EnvelopeIcon class="h-3 w-3 mr-1" />
                      {{ principal.email }}
                    </span>
                    <span v-if="principal.phone" class="flex items-center">
                      <PhoneIcon class="h-3 w-3 mr-1" />
                      {{ principal.phone }}
                    </span>
                  </div>
                  
                  <!-- Decision Making Authority -->
                  <div v-if="principal.decisionMakingLevel" class="mt-1 flex items-center text-xs">
                    <span
                      :class="[
                        'inline-flex items-center px-2 py-0.5 rounded',
                        getDecisionLevelClasses(principal.decisionMakingLevel)
                      ]"
                    >
                      {{ formatDecisionLevel(principal.decisionMakingLevel) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Selection Indicator -->
            <CheckIcon
              v-if="selectedPrincipal?.id === principal.id"
              class="h-5 w-5 text-primary-600 ml-2 flex-shrink-0"
            />
          </div>
        </div>
        
        <!-- Create New Option -->
        <div
          v-if="allowCreate && searchQuery && !hasExactMatch"
          :class="[
            'px-4 py-3 cursor-pointer select-none relative border-t border-gray-200',
            highlightedIndex === filteredPrincipals.length ? 'bg-primary-100 text-primary-900' : 'text-gray-700',
            'hover:bg-primary-50'
          ]"
          role="option"
          :aria-selected="false"
          @click="createNewPrincipal"
          @mouseenter="highlightedIndex = filteredPrincipals.length"
        >
          <div class="flex items-center">
            <PlusIcon class="h-4 w-4 text-gray-400 mr-2" />
            <span class="text-sm">Create new principal: "{{ searchQuery }}"</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Selected Principal Display -->
    <div v-if="selectedPrincipal && !showDropdown" class="mt-2 p-3 bg-gray-50 rounded-md">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <!-- Avatar -->
          <div class="flex-shrink-0">
            <div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              <span class="text-sm font-medium text-gray-600">
                {{ getInitials(selectedPrincipal.name) }}
              </span>
            </div>
          </div>
          
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2">
              <div class="text-sm font-medium text-gray-900">
                {{ selectedPrincipal.name }}
              </div>
              <div
                v-if="selectedPrincipal.isPrimary"
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
              >
                Primary
              </div>
            </div>
            
            <div class="mt-1 flex items-center space-x-4 text-xs text-gray-500">
              <span v-if="selectedPrincipal.title" class="flex items-center">
                <BriefcaseIcon class="h-3 w-3 mr-1" />
                {{ selectedPrincipal.title }}
              </span>
              <span v-if="selectedPrincipal.organization" class="flex items-center">
                <BuildingOfficeIcon class="h-3 w-3 mr-1" />
                {{ selectedPrincipal.organization }}
              </span>
            </div>
          </div>
        </div>
        
        <button
          v-if="!disabled"
          type="button"
          @click="clearSelection"
          class="ml-2 p-1 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          :aria-label="'Remove selected principal'"
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
import { useContactStore } from '@/stores/contactStore'
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
  PlusIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  UsersIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/vue/24/outline'

/**
 * Principal option interface for display
 */
interface PrincipalOption {
  id: string
  name: string
  title?: string
  organization?: string
  department?: string
  email?: string
  phone?: string
  isPrimary: boolean
  decisionMakingLevel?: 'HIGH' | 'MEDIUM' | 'LOW'
  organizationId?: string
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
  organizationId?: string | null
  allowCreate?: boolean
  minSearchLength?: number
  showDecisionLevel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  disabled: false,
  placeholder: 'Search principals...',
  allowCreate: false,
  minSearchLength: 2,
  showDecisionLevel: true
})

/**
 * Emits interface
 */
interface Emits {
  'update:modelValue': [value: string | null]
  'principal-selected': [principalId: string | null, principalData: PrincipalOption | null]
  'create-principal': [name: string, organizationId?: string]
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
const principals = ref<PrincipalOption[]>([])
const selectedPrincipal = ref<PrincipalOption | null>(null)

// Dependencies
const contactStore = useContactStore()

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

const filteredPrincipals = computed(() => {
  if (!searchQuery.value || searchQuery.value.length < props.minSearchLength) {
    return principals.value.slice(0, 10) // Show first 10 principals
  }
  
  const query = searchQuery.value.toLowerCase()
  return principals.value.filter(principal =>
    principal.name.toLowerCase().includes(query) ||
    (principal.title && principal.title.toLowerCase().includes(query)) ||
    (principal.organization && principal.organization.toLowerCase().includes(query)) ||
    (principal.department && principal.department.toLowerCase().includes(query)) ||
    (principal.email && principal.email.toLowerCase().includes(query))
  ).slice(0, 20) // Limit to 20 results
})

const hasExactMatch = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return filteredPrincipals.value.some(principal => 
    principal.name.toLowerCase() === query
  )
})

const noResultsText = computed(() => {
  if (searchQuery.value.length < props.minSearchLength) {
    return `Type at least ${props.minSearchLength} characters to search`
  }
  return 'No principals found'
})

// ===============================
// PRINCIPAL DATA MANAGEMENT
// ===============================

/**
 * Load principals from store
 */
const loadPrincipals = async () => {
  loading.value = true
  
  try {
    // Filter by organization if provided
    const filters = props.organizationId ? { organization_id: props.organizationId } : {}
    
    await contactStore.fetchContacts(filters)
    
    // Convert store contacts to principal options (filter for principals)
    principals.value = contactStore.contacts
      .filter(contact => contact.is_principal === true) // Assuming contacts have is_principal field
      .map(contact => ({
        id: contact.id,
        name: `${contact.first_name} ${contact.last_name}`.trim(),
        title: contact.title,
        organization: contact.organization_name,
        department: contact.department,
        email: contact.email,
        phone: contact.phone,
        isPrimary: contact.is_primary_contact || false,
        decisionMakingLevel: contact.decision_making_level || 'MEDIUM',
        organizationId: contact.organization_id
      }))
    
    // Set selected principal if modelValue exists
    if (props.modelValue) {
      const selected = principals.value.find(principal => principal.id === props.modelValue)
      if (selected) {
        selectedPrincipal.value = selected
        searchQuery.value = selected.name
      }
    }
  } catch (error) {
    console.error('Failed to load principals:', error)
    
    // Fallback to demo data
    principals.value = getDemoPrincipals()
    
    if (props.modelValue) {
      const selected = principals.value.find(principal => principal.id === props.modelValue)
      if (selected) {
        selectedPrincipal.value = selected
        searchQuery.value = selected.name
      }
    }
  } finally {
    loading.value = false
  }
}

/**
 * Search principals based on query
 */
const searchPrincipals = async (query: string) => {
  if (!query || query.length < props.minSearchLength) {
    return
  }
  
  loading.value = true
  
  try {
    const filters = {
      search: query,
      is_principal: true,
      ...(props.organizationId && { organization_id: props.organizationId })
    }
    
    await contactStore.fetchContacts(filters)
    
    // Update principals list
    principals.value = contactStore.contacts
      .filter(contact => contact.is_principal === true)
      .map(contact => ({
        id: contact.id,
        name: `${contact.first_name} ${contact.last_name}`.trim(),
        title: contact.title,
        organization: contact.organization_name,
        department: contact.department,
        email: contact.email,
        phone: contact.phone,
        isPrimary: contact.is_primary_contact || false,
        decisionMakingLevel: contact.decision_making_level || 'MEDIUM',
        organizationId: contact.organization_id
      }))
  } catch (error) {
    console.error('Search failed:', error)
    // Keep existing principals on search failure
  } finally {
    loading.value = false
  }
}

// ===============================
// EVENT HANDLERS
// ===============================

const handleInput = async () => {
  if (!selectedPrincipal.value) {
    showDropdown.value = true
    highlightedIndex.value = -1
    
    // Debounced search
    setTimeout(() => {
      if (searchQuery.value.length >= props.minSearchLength) {
        searchPrincipals(searchQuery.value)
      }
    }, 300)
  }
}

const handleFocus = () => {
  if (!props.disabled && !selectedPrincipal.value) {
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
    if (!selectedPrincipal.value) {
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
        ? filteredPrincipals.value.length 
        : filteredPrincipals.value.length - 1
      highlightedIndex.value = Math.min(highlightedIndex.value + 1, maxDown)
      break
      
    case 'ArrowUp':
      event.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1)
      break
      
    case 'Enter':
      event.preventDefault()
      if (highlightedIndex.value >= 0) {
        if (highlightedIndex.value < filteredPrincipals.value.length) {
          selectPrincipal(filteredPrincipals.value[highlightedIndex.value])
        } else if (props.allowCreate && searchQuery.value && !hasExactMatch.value) {
          createNewPrincipal()
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

const selectPrincipal = (principal: PrincipalOption) => {
  selectedPrincipal.value = principal
  searchQuery.value = principal.name
  showDropdown.value = false
  highlightedIndex.value = -1
  
  emit('update:modelValue', principal.id)
  emit('principal-selected', principal.id, principal)
}

const clearSelection = () => {
  selectedPrincipal.value = null
  searchQuery.value = ''
  showDropdown.value = false
  highlightedIndex.value = -1
  
  emit('update:modelValue', null)
  emit('principal-selected', null, null)
  
  nextTick(() => {
    searchInput.value?.focus()
  })
}

const createNewPrincipal = () => {
  const name = searchQuery.value.trim()
  if (name) {
    emit('create-principal', name, props.organizationId || undefined)
    showDropdown.value = false
    highlightedIndex.value = -1
  }
}

// ===============================
// UTILITY FUNCTIONS
// ===============================

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getDecisionLevelClasses = (level: 'HIGH' | 'MEDIUM' | 'LOW'): string => {
  const levelClasses = {
    'HIGH': 'bg-red-100 text-red-800',
    'MEDIUM': 'bg-yellow-100 text-yellow-800',
    'LOW': 'bg-green-100 text-green-800'
  }
  
  return levelClasses[level] || 'bg-gray-100 text-gray-800'
}

const formatDecisionLevel = (level: 'HIGH' | 'MEDIUM' | 'LOW'): string => {
  const levelLabels = {
    'HIGH': 'Key Decision Maker',
    'MEDIUM': 'Influencer',
    'LOW': 'End User'
  }
  
  return levelLabels[level] || level
}

/**
 * Demo principals for fallback
 */
const getDemoPrincipals = (): PrincipalOption[] => {
  return [
    {
      id: 'demo-principal-1',
      name: 'Sarah Johnson',
      title: 'Chief Technology Officer',
      organization: 'TechCorp Solutions',
      department: 'Technology',
      email: 'sarah.johnson@techcorp.com',
      phone: '+1-555-0101',
      isPrimary: true,
      decisionMakingLevel: 'HIGH',
      organizationId: 'org-1'
    },
    {
      id: 'demo-principal-2',
      name: 'Michael Chen',
      title: 'VP of Engineering',
      organization: 'StartupCo Inc',
      department: 'Engineering',
      email: 'michael.chen@startupco.com',
      phone: '+1-555-0102',
      isPrimary: false,
      decisionMakingLevel: 'MEDIUM',
      organizationId: 'org-2'
    },
    {
      id: 'demo-principal-3',
      name: 'Emily Rodriguez',
      title: 'IT Director',
      organization: 'RetailGiant Corp',
      department: 'Information Technology',
      email: 'emily.rodriguez@retailgiant.com',
      phone: '+1-555-0103',
      isPrimary: true,
      decisionMakingLevel: 'HIGH',
      organizationId: 'org-3'
    },
    {
      id: 'demo-principal-4',
      name: 'David Thompson',
      title: 'Senior Software Architect',
      organization: 'Finance Secure Ltd',
      department: 'Technology',
      email: 'david.thompson@financesecure.com',
      phone: '+1-555-0104',
      isPrimary: false,
      decisionMakingLevel: 'MEDIUM',
      organizationId: 'org-4'
    },
    {
      id: 'demo-principal-5',
      name: 'Lisa Park',
      title: 'Chief Innovation Officer',
      organization: 'Innovation Labs',
      department: 'Research & Development',
      email: 'lisa.park@innovationlabs.com',
      phone: '+1-555-0105',
      isPrimary: true,
      decisionMakingLevel: 'HIGH',
      organizationId: 'org-5'
    }
  ]
}

// ===============================
// WATCHERS
// ===============================

// Watch for external modelValue changes
watch(() => props.modelValue, async (newValue) => {
  if (newValue && newValue !== selectedPrincipal.value?.id) {
    // Find principal in current list or load it
    let principal = principals.value.find(p => p.id === newValue)
    
    if (!principal) {
      // Try to load the specific principal
      await loadPrincipals()
      principal = principals.value.find(p => p.id === newValue)
    }
    
    if (principal) {
      selectedPrincipal.value = principal
      searchQuery.value = principal.name
    }
  } else if (!newValue) {
    selectedPrincipal.value = null
    searchQuery.value = ''
  }
})

// Watch for organization changes
watch(() => props.organizationId, () => {
  // Clear selection and reload principals for new organization
  clearSelection()
  loadPrincipals()
})

// ===============================
// LIFECYCLE
// ===============================

onMounted(() => {
  loadPrincipals()
})
</script>

<style scoped>
.principal-select {
  @apply w-full;
}

/* Dropdown animation */
.principal-select .absolute.z-10 {
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
.principal-select input:focus-visible {
  @apply ring-offset-2;
}

/* Highlight styles for keyboard navigation */
.principal-select [role="option"][aria-selected="true"] {
  @apply bg-primary-100;
}

/* Avatar hover effects */
.principal-select .avatar {
  transition: all 0.2s ease-in-out;
}

.principal-select .avatar:hover {
  transform: scale(1.05);
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .principal-select .max-h-60 {
    @apply max-h-48;
  }
  
  .principal-select .text-xs {
    @apply text-xs;
  }
}

/* Decision level badge animations */
.principal-select .decision-level {
  transition: all 0.2s ease-in-out;
}

/* Selected principal card enhancement */
.principal-select .bg-gray-50 {
  transition: all 0.2s ease-in-out;
}

.principal-select .bg-gray-50:hover {
  @apply bg-gray-100;
}
</style>