/**
 * Organizations API Service
 * 
 * Handles all API calls related to organizations
 */

import { supabase } from '@/config/supabaseClient'
import type { Organization, OrganizationInsert, OrganizationUpdate } from '@/types/organizations'

/**
 * Generic API response interface
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Organizations API class
 */
class OrganizationsApi {
  /**
   * Get all organizations
   */
  async getOrganizations(): Promise<ApiResponse<Organization[]>> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching organizations:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Unexpected error fetching organizations:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  /**
   * Get a single organization by ID
   */
  async getOrganization(id: string): Promise<ApiResponse<Organization>> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching organization:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Unexpected error fetching organization:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  /**
   * Create a new organization
   */
  async createOrganization(organizationData: OrganizationInsert): Promise<ApiResponse<Organization>> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .insert([organizationData])
        .select()
        .single()

      if (error) {
        console.error('Error creating organization:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Unexpected error creating organization:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  /**
   * Update an existing organization
   */
  async updateOrganization(id: string, organizationData: OrganizationUpdate): Promise<ApiResponse<Organization>> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .update(organizationData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating organization:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Unexpected error updating organization:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  /**
   * Delete an organization
   */
  async deleteOrganization(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting organization:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Unexpected error deleting organization:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  /**
   * Search organizations by name or other criteria
   */
  async searchOrganizations(searchTerm: string): Promise<ApiResponse<Organization[]>> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .order('name')
        .limit(50)

      if (error) {
        console.error('Error searching organizations:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Unexpected error searching organizations:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }
}

// Export singleton instance
export const organizationsApi = new OrganizationsApi()