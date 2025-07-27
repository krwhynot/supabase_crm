/**
 * Contacts API Service
 * Centralized Supabase operations for contact management
 * Supports both authenticated and demo modes
 */

import { supabase } from '@/config/supabaseClient'
import type { Contact, ContactInsert, ContactUpdate } from '@/types/database.types'

/**
 * API Response wrapper for consistent error handling
 */
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

/**
 * Search and pagination options
 */
export interface ContactSearchOptions {
  search?: string
  limit?: number
  offset?: number
  sortBy?: 'first_name' | 'last_name' | 'organization' | 'email' | 'created_at'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Contact statistics for analytics
 */
export interface ContactStats {
  total: number
  recentlyAdded: number // Last 30 days
  organizations: number
}

class ContactsApiService {
  private isDemoMode: boolean = false

  constructor() {
    // Check if we're in demo mode (invalid Supabase config)
    this.isDemoMode = this.checkDemoMode()
  }

  private checkDemoMode(): boolean {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    return !url || !key || url === 'your-supabase-project-url' || key === 'your-supabase-anon-key'
  }

  /**
   * Get all contacts with optional search and pagination
   */
  async getContacts(options: ContactSearchOptions = {}): Promise<ApiResponse<Contact[]>> {
    if (this.isDemoMode) {
      return this.getMockContacts(options)
    }

    try {
      let query = supabase
        .from('contacts')
        .select('*')

      // Apply search filter
      if (options.search) {
        query = query.or(`first_name.ilike.%${options.search}%,last_name.ilike.%${options.search}%,organization.ilike.%${options.search}%,email.ilike.%${options.search}%`)
      }

      // Apply sorting
      const sortBy = options.sortBy || 'last_name'
      const sortOrder = options.sortOrder || 'asc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit)
      }
      if (options.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 50)) - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching contacts:', error)
        return {
          data: null,
          error: `Failed to fetch contacts: ${error.message}`,
          success: false
        }
      }

      return {
        data: data || [],
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error fetching contacts:', error)
      return {
        data: null,
        error: 'An unexpected error occurred while fetching contacts',
        success: false
      }
    }
  }

  /**
   * Get a single contact by ID
   */
  async getContact(id: string): Promise<ApiResponse<Contact>> {
    if (this.isDemoMode) {
      return this.getMockContact(id)
    }

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching contact:', error)
        return {
          data: null,
          error: `Failed to fetch contact: ${error.message}`,
          success: false
        }
      }

      return {
        data,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error fetching contact:', error)
      return {
        data: null,
        error: 'An unexpected error occurred while fetching the contact',
        success: false
      }
    }
  }

  /**
   * Create a new contact
   */
  async createContact(contact: ContactInsert): Promise<ApiResponse<Contact>> {
    if (this.isDemoMode) {
      return this.createMockContact(contact)
    }

    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert(contact)
        .select()
        .single()

      if (error) {
        console.error('Error creating contact:', error)
        return {
          data: null,
          error: `Failed to create contact: ${error.message}`,
          success: false
        }
      }

      return {
        data,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error creating contact:', error)
      return {
        data: null,
        error: 'An unexpected error occurred while creating the contact',
        success: false
      }
    }
  }

  /**
   * Update an existing contact
   */
  async updateContact(id: string, updates: ContactUpdate): Promise<ApiResponse<Contact>> {
    if (this.isDemoMode) {
      return this.updateMockContact(id, updates)
    }

    try {
      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating contact:', error)
        return {
          data: null,
          error: `Failed to update contact: ${error.message}`,
          success: false
        }
      }

      return {
        data,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error updating contact:', error)
      return {
        data: null,
        error: 'An unexpected error occurred while updating the contact',
        success: false
      }
    }
  }

  /**
   * Delete a contact
   */
  async deleteContact(id: string): Promise<ApiResponse<boolean>> {
    if (this.isDemoMode) {
      return this.deleteMockContact(id)
    }

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting contact:', error)
        return {
          data: null,
          error: `Failed to delete contact: ${error.message}`,
          success: false
        }
      }

      return {
        data: true,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error deleting contact:', error)
      return {
        data: null,
        error: 'An unexpected error occurred while deleting the contact',
        success: false
      }
    }
  }

  /**
   * Get contact statistics
   */
  async getContactStats(): Promise<ApiResponse<ContactStats>> {
    if (this.isDemoMode) {
      return this.getMockStats()
    }

    try {
      // Get total count
      const { count: total, error: countError } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })

      if (countError) {
        throw countError
      }

      // Get recently added (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { count: recentlyAdded, error: recentError } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString())

      if (recentError) {
        throw recentError
      }

      // Get unique organizations count
      const { data: orgData, error: orgError } = await supabase
        .from('contacts')
        .select('organization')
        .not('organization', 'is', null)

      if (orgError) {
        throw orgError
      }

      const uniqueOrganizations = new Set(orgData?.map(item => item.organization)).size

      const stats: ContactStats = {
        total: total || 0,
        recentlyAdded: recentlyAdded || 0,
        organizations: uniqueOrganizations
      }

      return {
        data: stats,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Error fetching contact stats:', error)
      return {
        data: null,
        error: 'Failed to fetch contact statistics',
        success: false
      }
    }
  }

  // Demo mode mock implementations
  private async getMockContacts(options: ContactSearchOptions): Promise<ApiResponse<Contact[]>> {
    const mockContacts: Contact[] = [
      {
        id: 'mock-1',
        first_name: 'John',
        last_name: 'Doe',
        organization: 'Tech Corp',
        email: 'john.doe@techcorp.com',
        title: 'Software Engineer',
        phone: '+1-555-0123',
        notes: 'Met at tech conference 2024',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 'mock-2',
        first_name: 'Jane',
        last_name: 'Smith',
        organization: 'Design Studio',
        email: 'jane.smith@designstudio.com',
        title: 'UX Designer',
        phone: '+1-555-0124',
        notes: 'Portfolio review scheduled',
        created_at: '2024-01-20T14:30:00Z',
        updated_at: '2024-01-20T14:30:00Z'
      },
      {
        id: 'mock-3',
        first_name: 'Bob',
        last_name: 'Johnson',
        organization: 'Marketing Agency',
        email: 'bob.johnson@marketing.com',
        title: 'Marketing Manager',
        phone: null,
        notes: null,
        created_at: '2024-02-01T09:15:00Z',
        updated_at: '2024-02-01T09:15:00Z'
      }
    ]

    // Apply search filter
    let filteredContacts = mockContacts
    if (options.search) {
      const searchLower = options.search.toLowerCase()
      filteredContacts = mockContacts.filter(contact =>
        contact.first_name.toLowerCase().includes(searchLower) ||
        contact.last_name.toLowerCase().includes(searchLower) ||
        contact.organization.toLowerCase().includes(searchLower) ||
        contact.email.toLowerCase().includes(searchLower)
      )
    }

    // Apply sorting
    const sortBy = options.sortBy || 'last_name'
    const sortOrder = options.sortOrder || 'asc'
    filteredContacts.sort((a, b) => {
      const aVal = a[sortBy] || ''
      const bVal = b[sortBy] || ''
      const comparison = aVal.localeCompare(bVal)
      return sortOrder === 'asc' ? comparison : -comparison
    })

    // Apply pagination
    if (options.offset || options.limit) {
      const start = options.offset || 0
      const end = start + (options.limit || filteredContacts.length)
      filteredContacts = filteredContacts.slice(start, end)
    }

    return {
      data: filteredContacts,
      error: null,
      success: true
    }
  }

  private async getMockContact(id: string): Promise<ApiResponse<Contact>> {
    const mockContacts = await this.getMockContacts({})
    const contact = mockContacts.data?.find(c => c.id === id)
    
    if (!contact) {
      return {
        data: null,
        error: 'Contact not found',
        success: false
      }
    }

    return {
      data: contact,
      error: null,
      success: true
    }
  }

  private async createMockContact(contact: ContactInsert): Promise<ApiResponse<Contact>> {
    const newContact: Contact = {
      id: `mock-${Date.now()}`,
      first_name: contact.first_name,
      last_name: contact.last_name,
      organization: contact.organization,
      email: contact.email,
      title: contact.title || null,
      phone: contact.phone || null,
      notes: contact.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return {
      data: newContact,
      error: null,
      success: true
    }
  }

  private async updateMockContact(id: string, updates: ContactUpdate): Promise<ApiResponse<Contact>> {
    const existing = await this.getMockContact(id)
    if (!existing.success || !existing.data) {
      return existing
    }

    const updatedContact: Contact = {
      ...existing.data,
      ...updates,
      updated_at: new Date().toISOString()
    }

    return {
      data: updatedContact,
      error: null,
      success: true
    }
  }

  private async deleteMockContact(_id: string): Promise<ApiResponse<boolean>> {
    // In demo mode, we can't actually delete, but we simulate success
    return {
      data: true,
      error: null,
      success: true
    }
  }

  private async getMockStats(): Promise<ApiResponse<ContactStats>> {
    return {
      data: {
        total: 3,
        recentlyAdded: 2,
        organizations: 3
      },
      error: null,
      success: true
    }
  }
}

// Export singleton instance
export const contactsApi = new ContactsApiService()

// Export class for testing
export { ContactsApiService }