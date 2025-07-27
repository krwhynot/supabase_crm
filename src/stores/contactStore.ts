import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/config/supabaseClient'
import type { Contact, ContactInsert, ContactUpdate } from '@/types/database.types'
import type { ContactSearchForm } from '@/types/contacts'

/**
 * Contact Store - Manages contact data and operations
 * Follows established Pinia patterns with reactive state management
 */
export const useContactStore = defineStore('contact', () => {
  // State
  const contacts = ref<Contact[]>([])
  const currentContact = ref<Contact | null>(null)
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
  
  // Demo mode detection (following established pattern)
  const isDemoMode = computed(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    return !supabaseUrl || !supabaseKey || 
           supabaseUrl === 'your-supabase-project-url' || 
           supabaseKey === 'your-supabase-anon-key'
  })

  // Demo data for development
  const demoContacts: Contact[] = [
    {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      organization: 'Acme Corp',
      email: 'john.doe@acme.com',
      title: 'Software Engineer',
      phone: '+1 (555) 123-4567',
      notes: 'Lead developer for React applications',
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T10:00:00Z'
    },
    {
      id: '2',
      first_name: 'Jane',
      last_name: 'Smith',
      organization: 'TechStart Inc',
      email: 'jane.smith@techstart.io',
      title: 'Product Manager',
      phone: '+1 (555) 987-6543',
      notes: 'Experienced in B2B SaaS products',
      created_at: '2025-01-10T14:30:00Z',
      updated_at: '2025-01-10T14:30:00Z'
    },
    {
      id: '3',
      first_name: 'Mike',
      last_name: 'Johnson',
      organization: 'Design Studio',
      email: 'mike@designstudio.com',
      title: 'UX Designer',
      phone: null,
      notes: null,
      created_at: '2025-01-05T09:15:00Z',
      updated_at: '2025-01-05T09:15:00Z'
    }
  ]

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

      if (isDemoMode.value) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Filter demo data
        let filtered = [...demoContacts]
        if (searchTerm?.trim()) {
          const search = searchTerm.toLowerCase()
          filtered = filtered.filter(contact => 
            contact.first_name.toLowerCase().includes(search) ||
            contact.last_name.toLowerCase().includes(search) ||
            contact.organization.toLowerCase().includes(search) ||
            contact.email.toLowerCase().includes(search)
          )
        }

        // Sort demo data
        filtered.sort((a, b) => {
          const aVal = (a as any)[orderBy] || ''
          const bVal = (b as any)[orderBy] || ''
          const comparison = aVal.toString().localeCompare(bVal.toString())
          return order === 'desc' ? -comparison : comparison
        })

        // Paginate demo data
        const startIdx = offset
        const endIdx = startIdx + limit
        const paginatedContacts = filtered.slice(startIdx, endIdx)

        contacts.value = paginatedContacts
        totalCount.value = filtered.length
        
        console.log('Demo mode: Fetched contacts', { 
          total: totalCount.value, 
          page: currentPage.value,
          search: searchTerm 
        })
        return
      }

      // Production Supabase query
      let query = supabase
        .from('contacts')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order(orderBy, { ascending: order === 'asc' })

      // Add search filter if provided
      if (searchTerm?.trim()) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,organization.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      }

      const { data, error, count } = await query

      if (error) {
        throw new Error(`Failed to fetch contacts: ${error.message}`)
      }

      contacts.value = data || []
      totalCount.value = count || 0

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
  const fetchContact = async (id: string): Promise<Contact | null> => {
    try {
      isLoading.value = true
      clearError()

      if (isDemoMode.value) {
        await new Promise(resolve => setTimeout(resolve, 300))
        const contact = demoContacts.find(c => c.id === id) || null
        currentContact.value = contact
        console.log('Demo mode: Fetched contact', { id, found: !!contact })
        return contact
      }

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        throw new Error(`Failed to fetch contact: ${error.message}`)
      }

      currentContact.value = data
      return data

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
  const createContact = async (contactData: ContactInsert): Promise<Contact | null> => {
    try {
      isSubmitting.value = true
      clearError()

      if (isDemoMode.value) {
        await new Promise(resolve => setTimeout(resolve, 800))
        
        const newContact: Contact = {
          id: Date.now().toString(),
          first_name: contactData.first_name,
          last_name: contactData.last_name,
          organization: contactData.organization,
          email: contactData.email,
          title: contactData.title || null,
          phone: contactData.phone || null,
          notes: contactData.notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        demoContacts.unshift(newContact)
        console.log('Demo mode: Created contact', newContact)
        
        // Refresh the current view
        await fetchContacts()
        return newContact
      }

      const { data, error } = await supabase
        .from('contacts')
        .insert([contactData])
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create contact: ${error.message}`)
      }

      // Refresh the current view
      await fetchContacts()
      return data

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
  const updateContact = async (id: string, updates: ContactUpdate): Promise<Contact | null> => {
    try {
      isSubmitting.value = true
      clearError()

      if (isDemoMode.value) {
        await new Promise(resolve => setTimeout(resolve, 600))
        
        const contactIndex = demoContacts.findIndex(c => c.id === id)
        if (contactIndex === -1) {
          throw new Error('Contact not found')
        }
        
        const updatedContact = {
          ...demoContacts[contactIndex],
          ...updates,
          updated_at: new Date().toISOString()
        }
        
        demoContacts[contactIndex] = updatedContact
        currentContact.value = updatedContact
        console.log('Demo mode: Updated contact', updatedContact)
        
        // Refresh the current view
        await fetchContacts()
        return updatedContact
      }

      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update contact: ${error.message}`)
      }

      currentContact.value = data
      // Refresh the current view
      await fetchContacts()
      return data

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

      if (isDemoMode.value) {
        await new Promise(resolve => setTimeout(resolve, 400))
        
        const contactIndex = demoContacts.findIndex(c => c.id === id)
        if (contactIndex === -1) {
          throw new Error('Contact not found')
        }
        
        demoContacts.splice(contactIndex, 1)
        console.log('Demo mode: Deleted contact', { id })
        
        // Clear current contact if it was deleted
        if (currentContact.value?.id === id) {
          currentContact.value = null
        }
        
        // Refresh the current view
        await fetchContacts()
        return true
      }

      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(`Failed to delete contact: ${error.message}`)
      }

      // Clear current contact if it was deleted
      if (currentContact.value?.id === id) {
        currentContact.value = null
      }

      // Refresh the current view
      await fetchContacts()
      return true

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
    isDemoMode,
    
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