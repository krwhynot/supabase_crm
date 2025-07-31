import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { contactsApi } from '@/services/contactsApi'
import type { Contact, ContactInsert, ContactUpdate, ContactListView, ContactDetailView } from '@/types/database.types'
import type { ContactSearchForm } from '@/types/contacts'

/**
 * Contact Store - Manages contact data and operations
 * Follows established Pinia patterns with reactive state management
 */
export const useContactStore = defineStore('contact', () => {
  // State
  const contacts = ref<ContactListView[]>([])
  const currentContact = ref<ContactDetailView | null>(null)
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const errorMessage = ref('')
  const searchQuery = ref('')
  const totalCount = ref(0)
  
  // Pagination state
  const currentPage = ref(1)
  const pageSize = ref(10)
  const sortBy = ref<'first_name' | 'last_name' | 'organization' | 'email' | 'created_at'>('first_name')
  const sortOrder = ref<'asc' | 'desc'>('asc')

  // Computed properties
  const hasContacts = computed(() => contacts.value.length > 0)
  const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value))
  const hasNextPage = computed(() => currentPage.value < totalPages.value)
  const hasPreviousPage = computed(() => currentPage.value > 1)

  /**
   * Reset error state
   */
  const clearError = () => {
    errorMessage.value = ''
  }

  /**
   * Set error message
   */
  const setError = (message: string) => {
    errorMessage.value = message
    console.error('Contact Store Error:', message)
  }

  /**
   * Fetch contacts with search and pagination
   */
  const fetchContacts = async (options: Partial<ContactSearchForm> = {}) => {
    try {
      isLoading.value = true
      clearError()

      const searchTerm = options.search || searchQuery.value
      const offset = options.offset || (currentPage.value - 1) * pageSize.value
      const limit = options.limit || pageSize.value
      const orderBy = options.sortBy || sortBy.value
      const order = options.sortOrder || sortOrder.value

      // Use contactsApi service
      const response = await contactsApi.getContacts({
        search: searchTerm?.trim() || undefined,
        offset,
        limit,
        sortBy: orderBy as 'first_name' | 'last_name' | 'organization' | 'email' | 'created_at',
        sortOrder: order as 'asc' | 'desc'
      })

      if (response.success && response.data) {
        contacts.value = response.data
        totalCount.value = response.data.length
      } else {
        throw new Error(response.error || 'Failed to fetch contacts')
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch contacts'
      setError(message)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch a single contact by ID
   */
  const fetchContact = async (id: string): Promise<ContactDetailView | null> => {
    try {
      isLoading.value = true
      clearError()

      const response = await contactsApi.getContact(id)

      if (response.success && response.data) {
        currentContact.value = response.data
        return response.data
      } else {
        throw new Error(response.error || 'Failed to fetch contact')
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch contact'
      setError(message)
      currentContact.value = null
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new contact
   */
  const createContact = async (contactData: ContactInsert): Promise<ContactDetailView | null> => {
    try {
      isSubmitting.value = true
      clearError()

      const response = await contactsApi.createContact(contactData)

      if (response.success && response.data) {
        // Refresh the current view to include the new contact
        await fetchContacts()
        return response.data
      } else {
        throw new Error(response.error || 'Failed to create contact')
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create contact'
      setError(message)
      return null
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * Update an existing contact
   */
  const updateContact = async (id: string, updates: ContactUpdate): Promise<ContactDetailView | null> => {
    try {
      isSubmitting.value = true
      clearError()

      const response = await contactsApi.updateContact(id, updates)

      if (response.success && response.data) {
        currentContact.value = response.data
        // Refresh the current view
        await fetchContacts()
        return response.data
      } else {
        throw new Error(response.error || 'Failed to update contact')
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update contact'
      setError(message)
      return null
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * Delete a contact
   */
  const deleteContact = async (id: string): Promise<boolean> => {
    try {
      isSubmitting.value = true
      clearError()

      const response = await contactsApi.deleteContact(id)

      if (response.success) {
        // Clear current contact if it was deleted
        if (currentContact.value?.id === id) {
          currentContact.value = null
        }

        // Refresh the current view
        await fetchContacts()
        return true
      } else {
        throw new Error(response.error || 'Failed to delete contact')
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete contact'
      setError(message)
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * Search contacts
   */
  const searchContacts = async (query: string) => {
    searchQuery.value = query
    currentPage.value = 1 // Reset to first page on new search
    await fetchContacts({ search: query })
  }

  /**
   * Clear search and show all contacts
   */
  const clearSearch = async () => {
    searchQuery.value = ''
    currentPage.value = 1
    await fetchContacts()
  }

  /**
   * Change page
   */
  const setPage = async (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
      await fetchContacts()
    }
  }

  /**
   * Go to next page
   */
  const nextPage = async () => {
    if (hasNextPage.value) {
      await setPage(currentPage.value + 1)
    }
  }

  /**
   * Go to previous page
   */
  const previousPage = async () => {
    if (hasPreviousPage.value) {
      await setPage(currentPage.value - 1)
    }
  }

  /**
   * Change sort settings
   */
  const setSorting = async (field: typeof sortBy.value, order: typeof sortOrder.value) => {
    sortBy.value = field
    sortOrder.value = order
    currentPage.value = 1 // Reset to first page on sort change
    await fetchContacts()
  }

  /**
   * Reset store state
   */
  const resetStore = () => {
    contacts.value = []
    currentContact.value = null
    isLoading.value = false
    isSubmitting.value = false
    errorMessage.value = ''
    searchQuery.value = ''
    currentPage.value = 1
    totalCount.value = 0
    sortBy.value = 'first_name'
    sortOrder.value = 'asc'
  }

  return {
    // State
    contacts,
    currentContact,
    isLoading,
    isSubmitting,
    errorMessage,
    searchQuery,
    currentPage,
    pageSize,
    totalCount,
    sortBy,
    sortOrder,
    
    // Computed
    hasContacts,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    
    // Actions
    fetchContacts,
    fetchContact,
    createContact,
    updateContact,
    deleteContact,
    searchContacts,
    clearSearch,
    setPage,
    nextPage,
    previousPage,
    setSorting,
    clearError,
    resetStore
  }
})