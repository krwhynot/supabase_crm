<template>
  <div class="bg-white shadow-sm rounded-lg border border-gray-200">
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-medium text-gray-900">Contact Directory</h3>
          <p class="text-sm text-gray-500 mt-1">
            People associated with this organization
          </p>
        </div>
        <div class="flex items-center space-x-3">
          <!-- Search within contacts -->
          <div class="relative" v-if="contacts.length > 5">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon class="h-4 w-4 text-gray-400" />
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search contacts..."
              class="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
          </div>
          
          <!-- Add Contact Button -->
          <button
            @click="$emit('add-contact')"
            class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon class="h-4 w-4 mr-1" />
            Add Contact
          </button>
        </div>
      </div>
    </div>
    
    <div class="px-6 py-6">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
        <span class="text-gray-600">Loading contacts...</span>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="text-center py-8">
        <ExclamationTriangleIcon class="h-8 w-8 text-red-500 mx-auto mb-3" />
        <p class="text-red-600 mb-4">{{ error }}</p>
        <button
          @click="$emit('retry')"
          class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-600 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <ArrowPathIcon class="h-4 w-4 mr-2" />
          Retry
        </button>
      </div>
      
      <!-- Empty State -->
      <div v-else-if="filteredContacts.length === 0 && !searchQuery" class="text-center py-8">
        <UserGroupIcon class="h-8 w-8 text-gray-400 mx-auto mb-3" />
        <p class="text-gray-500 mb-2">No contacts found</p>
        <p class="text-sm text-gray-400 mb-4">
          Add contacts to track people associated with this organization
        </p>
        <button
          @click="$emit('add-contact')"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon class="h-4 w-4 mr-2" />
          Add First Contact
        </button>
      </div>
      
      <!-- No Search Results -->
      <div v-else-if="filteredContacts.length === 0 && searchQuery" class="text-center py-8">
        <MagnifyingGlassIcon class="h-8 w-8 text-gray-400 mx-auto mb-3" />
        <p class="text-gray-500 mb-2">No contacts match "{{ searchQuery }}"</p>
        <button
          @click="searchQuery = ''"
          class="text-blue-600 hover:text-blue-700 text-sm font-medium focus:outline-none focus:underline"
        >
          Clear search
        </button>
      </div>
      
      <!-- Contact List -->
      <div v-else class="space-y-4">
        <!-- Contact Stats Summary -->
        <div v-if="contacts.length > 0 && !searchQuery" class="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div class="text-center">
            <div class="text-lg font-semibold text-gray-900">{{ contacts.length }}</div>
            <div class="text-sm text-gray-500">Total Contacts</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-semibold text-gray-900">{{ primaryContacts }}</div>
            <div class="text-sm text-gray-500">Primary Contacts</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-semibold text-gray-900">{{ activeContacts }}</div>
            <div class="text-sm text-gray-500">Recently Active</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-semibold text-gray-900">{{ departmentCount }}</div>
            <div class="text-sm text-gray-500">Departments</div>
          </div>
        </div>
        
        <!-- Contacts grouped by department/role -->
        <div class="space-y-6">
          <div
            v-for="group in groupedContacts"
            :key="group.department"
            class="border border-gray-200 rounded-lg overflow-hidden"
          >
            <!-- Department Header -->
            <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium text-gray-900 flex items-center">
                  <BuildingOffice2Icon class="h-4 w-4 mr-2 text-gray-500" />
                  {{ group.department }}
                </h4>
                <span class="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                  {{ group.contacts.length }} {{ group.contacts.length === 1 ? 'contact' : 'contacts' }}
                </span>
              </div>
            </div>
            
            <!-- Contacts in this department -->
            <div class="divide-y divide-gray-200">
              <div
                v-for="contact in group.contacts"
                :key="contact.id"
                class="p-4 hover:bg-gray-50 transition-colors duration-200"
              >
                <div class="flex items-start justify-between">
                  <div class="flex items-start space-x-3">
                    <!-- Avatar -->
                    <div class="flex-shrink-0">
                      <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span class="text-sm font-medium text-blue-600">
                          {{ getInitials(contact.first_name, contact.last_name) }}
                        </span>
                      </div>
                    </div>
                    
                    <!-- Contact Info -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center space-x-2">
                        <router-link
                          :to="`/contacts/${contact.id}`"
                          class="text-sm font-medium text-gray-900 hover:text-blue-600 focus:outline-none focus:text-blue-600 transition-colors duration-200"
                        >
                          {{ contact.first_name }} {{ contact.last_name }}
                        </router-link>
                        <span
                          v-if="contact.is_primary"
                          class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          title="Primary contact for this organization"
                        >
                          Primary
                        </span>
                      </div>
                      
                      <p v-if="contact.title" class="text-sm text-gray-600 mt-1">
                        {{ contact.title }}
                      </p>
                      
                      <!-- Contact Methods -->
                      <div class="flex items-center space-x-4 mt-2">
                        <a
                          v-if="contact.email"
                          :href="`mailto:${contact.email}`"
                          class="inline-flex items-center text-xs text-gray-500 hover:text-blue-600 transition-colors duration-200"
                          :title="`Email ${contact.first_name}`"
                        >
                          <EnvelopeIcon class="h-3 w-3 mr-1" />
                          {{ contact.email }}
                        </a>
                        
                        <a
                          v-if="contact.phone"
                          :href="`tel:${contact.phone}`"
                          class="inline-flex items-center text-xs text-gray-500 hover:text-blue-600 transition-colors duration-200"
                          :title="`Call ${contact.first_name}`"
                        >
                          <PhoneIcon class="h-3 w-3 mr-1" />
                          {{ contact.phone }}
                        </a>
                      </div>
                      
                      <!-- Last Contact Info -->
                      <div v-if="contact.last_contact_date" class="mt-2">
                        <span class="text-xs text-gray-400">
                          Last contact: {{ formatDate(contact.last_contact_date) }}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Actions -->
                  <div class="flex items-center space-x-2 ml-4">
                    <button
                      @click="$emit('edit-contact', contact)"
                      class="p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors duration-200"
                      :title="`Edit ${contact.first_name} ${contact.last_name}`"
                    >
                      <PencilIcon class="h-4 w-4" />
                    </button>
                    
                    <button
                      @click="$emit('contact-interaction', contact)"
                      class="p-1 text-gray-400 hover:text-blue-600 focus:outline-none focus:text-blue-600 transition-colors duration-200"
                      :title="`Log interaction with ${contact.first_name} ${contact.last_name}`"
                    >
                      <ChatBubbleLeftIcon class="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- View All Contacts Link -->
        <div v-if="hasMoreContacts" class="text-center pt-4 border-t border-gray-200">
          <router-link
            :to="`/contacts?organization=${organizationId}`"
            class="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:underline transition-colors duration-200"
          >
            View all {{ totalContactCount }} contacts
            <ArrowTopRightOnSquareIcon class="h-4 w-4 ml-1" />
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  BuildingOffice2Icon,
  EnvelopeIcon,
  PhoneIcon,
  PencilIcon,
  ChatBubbleLeftIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/vue/24/outline'

/**
 * Contact Directory Component
 * Displays and manages contacts associated with an organization
 */

interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  title: string | null
  department: string | null
  is_primary: boolean
  last_contact_date: string | null
  created_at: string | null
}

interface ContactGroup {
  department: string
  contacts: Contact[]
}

interface Props {
  contacts: Contact[]
  organizationId: string
  loading?: boolean
  error?: string | null
  totalContactCount?: number
  maxDisplayCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  totalContactCount: 0,
  maxDisplayCount: 20
})

// Emit events
defineEmits<{
  'add-contact': []
  'edit-contact': [contact: Contact]
  'contact-interaction': [contact: Contact]
  retry: []
}>()

// State
const searchQuery = ref('')

// Computed properties
const filteredContacts = computed(() => {
  if (!searchQuery.value) return props.contacts.slice(0, props.maxDisplayCount)
  
  const query = searchQuery.value.toLowerCase()
  return props.contacts.filter(contact => {
    const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase()
    const email = contact.email?.toLowerCase() || ''
    const title = contact.title?.toLowerCase() || ''
    const department = contact.department?.toLowerCase() || ''
    
    return (
      fullName.includes(query) ||
      email.includes(query) ||
      title.includes(query) ||
      department.includes(query)
    )
  })
})

const groupedContacts = computed((): ContactGroup[] => {
  const groups = new Map<string, Contact[]>()
  
  filteredContacts.value.forEach(contact => {
    const department = contact.department || 'General'
    if (!groups.has(department)) {
      groups.set(department, [])
    }
    groups.get(department)!.push(contact)
  })
  
  // Sort groups by department name, with Primary/General first
  const sortedGroups = Array.from(groups.entries()).sort(([a], [b]) => {
    if (a === 'General') return -1
    if (b === 'General') return 1
    return a.localeCompare(b)
  })
  
  return sortedGroups.map(([department, contacts]) => ({
    department,
    contacts: contacts.sort((a, b) => {
      // Primary contacts first, then by name
      if (a.is_primary && !b.is_primary) return -1
      if (!a.is_primary && b.is_primary) return 1
      return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
    })
  }))
})

const primaryContacts = computed(() => {
  return props.contacts.filter(contact => contact.is_primary).length
})

const activeContacts = computed(() => {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  return props.contacts.filter(contact => {
    if (!contact.last_contact_date) return false
    return new Date(contact.last_contact_date) >= thirtyDaysAgo
  }).length
})

const departmentCount = computed(() => {
  const departments = new Set(props.contacts.map(contact => contact.department || 'General'))
  return departments.size
})

const hasMoreContacts = computed(() => {
  return props.totalContactCount > props.contacts.length
})

// Methods
const getInitials = (firstName: string, lastName: string): string => {
  const first = firstName?.charAt(0)?.toUpperCase() || ''
  const last = lastName?.charAt(0)?.toUpperCase() || ''
  return `${first}${last}` || '?'
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysDiff === 0) return 'Today'
  if (daysDiff === 1) return 'Yesterday'
  if (daysDiff < 7) return `${daysDiff} days ago`
  if (daysDiff < 30) return `${Math.floor(daysDiff / 7)} weeks ago`
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}
</script>