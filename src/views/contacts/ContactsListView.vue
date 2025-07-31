<template>
  <div>
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Contacts</h1>
          <p class="mt-2 text-gray-600">Manage your professional contacts</p>
        </div>
        <router-link
          to="/contacts/new"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Contact
        </router-link>
      </div>

      <!-- Search and Filters -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex-1 max-w-md">
            <label for="search" class="sr-only">Search contacts</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search"
                v-model="searchQuery"
                type="text"
                placeholder="Search contacts..."
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                @input="handleSearch"
              />
            </div>
          </div>
          
          <div class="flex items-center space-x-3">
            <select
              v-model="sortBy"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              @change="handleSort"
            >
              <option value="last_name">Sort by Last Name</option>
              <option value="first_name">Sort by First Name</option>
              <option value="organization">Sort by Organization</option>
              <option value="email">Sort by Email</option>
              <option value="created_at">Sort by Date Added</option>
            </select>
            
            <button
              @click="toggleSortOrder"
              class="p-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
              :class="{ 'bg-gray-50': sortOrder === 'desc' }"
            >
              <svg class="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="sortOrder === 'asc' ? 'M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12' : 'M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4'" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div class="flex justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-white rounded-lg shadow-sm border border-red-200 p-6">
        <div class="flex items-center">
          <svg class="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-red-700">{{ error }}</span>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="contacts.length === 0" class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
        <p class="text-gray-500 mb-6">
          {{ searchQuery ? 'Try adjusting your search terms.' : 'Get started by adding your first contact.' }}
        </p>
        <router-link
          v-if="!searchQuery"
          to="/contacts/new"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Your First Contact
        </router-link>
      </div>

      <!-- Contacts Table -->
      <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Added
                </th>
                <th scope="col" class="relative px-6 py-3">
                  <span class="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="contact in contacts"
                :key="contact.id"
                class="hover:bg-gray-50 cursor-pointer"
                @click="viewContact(contact.id)"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span class="text-sm font-medium text-blue-600">
                          {{ getInitials(contact) }}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        {{ getFullName(contact) }}
                      </div>
                      <div v-if="contact.position" class="text-sm text-gray-500">
                        {{ contact.position }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ contact.organization_name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <a :href="`mailto:${contact.email}`" class="hover:text-blue-600" @click.stop>
                    {{ contact.email }}
                  </a>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatPhone(contact.phone) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(contact.created_at) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex items-center space-x-2">
                    <router-link
                      :to="`/contacts/${contact.id}`"
                      class="text-blue-600 hover:text-blue-900"
                      @click.stop
                    >
                      View
                    </router-link>
                    <router-link
                      :to="`/contacts/${contact.id}/edit`"
                      class="text-indigo-600 hover:text-indigo-900"
                      @click.stop
                    >
                      Edit
                    </router-link>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination (placeholder for future implementation) -->
      <div v-if="contacts.length > 0" class="mt-6 flex justify-center">
        <div class="text-sm text-gray-500">
          Showing {{ contacts.length }} contacts
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { contactsApi } from '@/services/contactsApi'
import { contactUtils } from '@/types/contacts'
import type { ContactListView } from '@/types/database.types'

// Remove DashboardLayout import

const router = useRouter()

// Reactive state
const contacts = ref<ContactListView[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const searchQuery = ref('')
const sortBy = ref<'first_name' | 'last_name' | 'organization' | 'email' | 'created_at'>('last_name')
const sortOrder = ref<'asc' | 'desc'>('asc')

// Load contacts
const loadContacts = async () => {
  try {
    loading.value = true
    error.value = null
    
    const response = await contactsApi.getContacts({
      search: searchQuery.value.trim() || undefined,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    })

    if (response.success && response.data) {
      contacts.value = response.data
    } else {
      error.value = response.error || 'Failed to load contacts'
    }
  } catch (err) {
    error.value = 'An unexpected error occurred'
    console.error('Error loading contacts:', err)
  } finally {
    loading.value = false
  }
}

// Search handler with debounce
let searchTimeout: ReturnType<typeof setTimeout>
const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadContacts()
  }, 300)
}

// Sort handlers
const handleSort = () => {
  loadContacts()
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  loadContacts()
}

// Navigation
const viewContact = (id: string) => {
  router.push(`/contacts/${id}`)
}

// Utility functions
const getFullName = (contact: ContactListView): string => {
  return contactUtils.getFullName(contact as any)
}

const getInitials = (contact: ContactListView): string => {
  return contactUtils.getInitials(contact as any)
}

const formatPhone = (phone: string | null): string => {
  return contactUtils.formatPhone(phone)
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Unknown'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Load contacts on mount
onMounted(() => {
  loadContacts()
})
</script>