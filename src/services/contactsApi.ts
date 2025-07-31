/**
 * Contacts API Service
 * Centralized Supabase operations for contact management
 * Requires valid Supabase authentication
 */

import { supabase } from '@/config/supabaseClient'
import type { Contact, ContactInsert, ContactUpdate, ContactListView, ContactDetailView } from '@/types/database.types'

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

  /**
   * Get all contacts with optional search and pagination
   */
  async getContacts(options: ContactSearchOptions = {}): Promise<ApiResponse<ContactListView[]>> {
    try {
      let query = supabase
        .from('contact_list_view')
        .select('*')

      // Apply search filter
      if (options.search) {
        query = query.or(`first_name.ilike.%${options.search}%,last_name.ilike.%${options.search}%,organization_name.ilike.%${options.search}%,email.ilike.%${options.search}%,position.ilike.%${options.search}%`)
      }

      // Apply sorting - map organization field to organization_name from view
      const sortBy = options.sortBy === 'organization' ? 'organization_name' : (options.sortBy || 'last_name')
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
  async getContact(id: string): Promise<ApiResponse<ContactDetailView>> {
    try {
      const { data, error } = await supabase
        .from('contact_detail_view')
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
        .select('organization_id')
        .not('organization_id', 'is', null)

      if (orgError) {
        throw orgError
      }

      const uniqueOrganizations = new Set(orgData?.map(item => item.organization_id)).size

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

}

// Export singleton instance
export const contactsApi = new ContactsApiService()

// Export class for testing
export { ContactsApiService }