<template>
  <div class="relative">
    <!-- Search Input -->
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
      </div>
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        placeholder="Search organizations, contacts..."
        class="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown.enter="handleEnter"
        @keydown.escape="handleEscape"
        @keydown.arrow-down="handleArrowDown"
        @keydown.arrow-up="handleArrowUp"
      />
      
      <!-- Clear Button -->
      <div v-if="searchQuery" class="absolute inset-y-0 right-0 pr-3 flex items-center">
        <button
          @click="clearSearch"
          class="text-gray-400 hover:text-gray-600 focus:outline-none"
          aria-label="Clear search"
        >
          <XMarkIcon class="h-4 w-4" />
        </button>
      </div>
    </div>
    
    <!-- Search Results Dropdown -->
    <div
      v-if="showResults && (recentSearches.length > 0 || searchResults.length > 0)"
      class="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-80 overflow-y-auto"
    >
      <!-- Recent Searches (when no query) -->
      <div v-if="!searchQuery && recentSearches.length > 0" class="p-2">
        <div class="text-xs font-medium text-gray-500 px-3 py-2">Recent searches</div>
        <button
          v-for="(search, index) in recentSearches"
          :key="index"
          @click="selectRecentSearch(search)"
          class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center space-x-3"
        >
          <ClockIcon class="w-4 h-4 text-gray-400" />
          <span>{{ search }}</span>
        </button>
      </div>
      
      <!-- Search Results -->
      <div v-if="searchQuery && searchResults.length > 0" class="p-2">
        <div class="text-xs font-medium text-gray-500 px-3 py-2">
          {{ searchResults.length }} result{{ searchResults.length !== 1 ? 's' : '' }}
        </div>
        <button
          v-for="(result, index) in searchResults"
          :key="result.id"
          :ref="el => setResultRef(el, index)"
          @click="selectResult(result)"
          :class="[
            'w-full text-left px-3 py-2 text-sm rounded-md flex items-center space-x-3',
            selectedIndex === index 
              ? 'bg-blue-50 text-blue-700' 
              : 'text-gray-700 hover:bg-gray-100'
          ]"
        >
          <div class="flex-shrink-0">
            <BuildingOfficeIcon v-if="result.type === 'organization'" class="w-4 h-4 text-gray-400" />
            <UserIcon v-else-if="result.type === 'contact'" class="w-4 h-4 text-gray-400" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium truncate">{{ result.name }}</div>
            <div class="text-xs text-gray-500 truncate">{{ result.subtitle }}</div>
          </div>
        </button>
      </div>
      
      <!-- No Results -->
      <div v-if="searchQuery && searchResults.length === 0 && !isSearching" class="p-4 text-center text-sm text-gray-500">
        No results found for "{{ searchQuery }}"
      </div>
      
      <!-- Loading -->
      <div v-if="isSearching" class="p-4 text-center">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  ClockIcon,
  BuildingOfficeIcon,
  UserIcon
} from '@heroicons/vue/24/outline'

/**
 * Header Search - Global search component
 * Provides real-time search with keyboard navigation
 * Supports organizations, contacts, and recent searches
 */

interface SearchResult {
  id: string
  type: 'organization' | 'contact'
  name: string
  subtitle: string
  url: string
}

// Events
const emit = defineEmits<{
  search: [query: string]
  focus: []
}>()

const router = useRouter()

// State
const searchInput = ref<HTMLInputElement>()
const searchQuery = ref('')
const showResults = ref(false)
const selectedIndex = ref(-1)
const isSearching = ref(false)
const searchResults = ref<SearchResult[]>([])
const resultRefs = ref<HTMLElement[]>([])

// Recent searches (would be stored in localStorage in real app)
const recentSearches = ref<string[]>([
  'Tech companies',
  'San Francisco',
  'Enterprise clients'
])

// Computed
const hasQuery = computed(() => searchQuery.value.trim().length > 0)

// Methods
let searchTimeout: ReturnType<typeof setTimeout>

const handleInput = () => {
  selectedIndex.value = -1
  
  if (!hasQuery.value) {
    searchResults.value = []
    isSearching.value = false
    return
  }
  
  // Debounce search
  clearTimeout(searchTimeout)
  isSearching.value = true
  
  searchTimeout = setTimeout(async () => {
    await performSearch(searchQuery.value)
    isSearching.value = false
  }, 300)
}

const performSearch = async (query: string) => {
  try {
    // Search across organizations and contacts
    const results: SearchResult[] = []
    
    // Mock organization results - in real app, would use organization store
    const organizationResults: SearchResult[] = [
      {
        id: '1',
        type: 'organization' as const,
        name: 'Acme Corporation',
        subtitle: 'Technology • San Francisco, CA',
        url: '/organizations/1'
      },
      {
        id: '2',
        type: 'organization' as const,
        name: 'Tech Innovations Inc',
        subtitle: 'Software • Austin, TX',
        url: '/organizations/2'
      }
    ].filter(result => 
      result.name.toLowerCase().includes(query.toLowerCase()) ||
      result.subtitle.toLowerCase().includes(query.toLowerCase())
    )
    
    // Mock contact results - in real app, would use contact store
    const contactResults: SearchResult[] = [
      {
        id: '1',
        type: 'contact' as const,
        name: 'John Smith',
        subtitle: 'CEO at Acme Corporation',
        url: '/contacts/1'
      },
      {
        id: '2',
        type: 'contact' as const,
        name: 'Sarah Johnson',
        subtitle: 'CTO at Tech Innovations Inc',
        url: '/contacts/2'
      }
    ].filter(result => 
      result.name.toLowerCase().includes(query.toLowerCase()) ||
      result.subtitle.toLowerCase().includes(query.toLowerCase())
    )
    
    // Combine and limit results
    results.push(...organizationResults.slice(0, 3))
    results.push(...contactResults.slice(0, 3))
    
    searchResults.value = results.slice(0, 6) // Max 6 results
    emit('search', query)
  } catch (error) {
    console.error('Search failed:', error)
    searchResults.value = []
  }
}

const handleFocus = () => {
  showResults.value = true
  emit('focus')
}

const handleBlur = () => {
  // Delay hiding results to allow clicking
  setTimeout(() => {
    showResults.value = false
  }, 200)
}

const handleEnter = () => {
  if (selectedIndex.value >= 0 && searchResults.value[selectedIndex.value]) {
    selectResult(searchResults.value[selectedIndex.value])
  } else if (searchQuery.value.trim()) {
    // Perform global search
    router.push(`/search?q=${encodeURIComponent(searchQuery.value.trim())}`)
    hideResults()
  }
}

const handleEscape = () => {
  hideResults()
  searchInput.value?.blur()
}

const handleArrowDown = () => {
  const maxIndex = searchResults.value.length - 1
  selectedIndex.value = selectedIndex.value < maxIndex ? selectedIndex.value + 1 : 0
  scrollToSelected()
}

const handleArrowUp = () => {
  const maxIndex = searchResults.value.length - 1
  selectedIndex.value = selectedIndex.value > 0 ? selectedIndex.value - 1 : maxIndex
  scrollToSelected()
}

const scrollToSelected = () => {
  nextTick(() => {
    const selectedElement = resultRefs.value[selectedIndex.value]
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' })
    }
  })
}

const setResultRef = (el: any, index: number) => {
  if (el && el.$el) {
    resultRefs.value[index] = el.$el as HTMLElement
  } else if (el && typeof el === 'object' && 'nodeType' in el) {
    resultRefs.value[index] = el as HTMLElement
  }
}

const selectResult = (result: SearchResult) => {
  router.push(result.url)
  addToRecentSearches(searchQuery.value)
  hideResults()
}

const selectRecentSearch = (search: string) => {
  searchQuery.value = search
  handleInput()
}

const addToRecentSearches = (query: string) => {
  if (query.trim() && !recentSearches.value.includes(query.trim())) {
    recentSearches.value.unshift(query.trim())
    if (recentSearches.value.length > 5) {
      recentSearches.value.pop()
    }
    // In real app, save to localStorage
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  selectedIndex.value = -1
  isSearching.value = false
  searchInput.value?.focus()
}

const hideResults = () => {
  showResults.value = false
  selectedIndex.value = -1
}

// Handle clicks outside
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    hideResults()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  clearTimeout(searchTimeout)
})
</script>