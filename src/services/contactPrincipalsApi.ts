/**
 * Contact Principals API Service
 * Manages Principal advocacy relationships for contacts
 * Handles contact-principals junction table operations
 */

import { supabase } from '@/config/supabaseClient'
import type { ContactPrincipal, ContactPrincipalInsert, ContactPrincipalUpdate } from '@/types/database.types'

/**
 * API Response wrapper for consistent error handling
 */
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

/**
 * Contact Principal advocacy data with organization details
 */
export interface ContactPrincipalWithDetails extends ContactPrincipal {
  principal_name?: string
  principal_industry?: string
}

class ContactPrincipalsApiService {

  /**
   * Get all principal advocacies for a contact
   */
  async getContactPrincipals(contactId: string): Promise<ApiResponse<ContactPrincipalWithDetails[]>> {
    try {
      const { data, error } = await supabase
        .from('contact_principals')
        .select(`
          *,
          principal:organizations!principal_id (
            name,
            industry
          )
        `)
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching contact principals:', error)
        return {
          data: null,
          error: `Failed to fetch contact principals: ${error.message}`,
          success: false
        }
      }

      // Transform the data to include principal details
      const transformedData = data?.map((item: any) => ({
        ...item,
        principal_name: item.principal?.name,
        principal_industry: item.principal?.industry
      })) || []

      return {
        data: transformedData,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error fetching contact principals:', error)
      return {
        data: null,
        error: 'An unexpected error occurred while fetching contact principals',
        success: false
      }
    }
  }

  /**
   * Get all contacts advocating for a specific principal
   */
  async getPrincipalContacts(principalId: string): Promise<ApiResponse<ContactPrincipalWithDetails[]>> {
    try {
      const { data, error } = await supabase
        .from('contact_principals')
        .select(`
          *,
          contact:contacts!contact_id (
            first_name,
            last_name,
            organization_id,
            position,
            email
          )
        `)
        .eq('principal_id', principalId)
        .order('advocacy_level', { ascending: false }) // High > Medium > Low

      if (error) {
        console.error('Error fetching principal contacts:', error)
        return {
          data: null,
          error: `Failed to fetch principal contacts: ${error.message}`,
          success: false
        }
      }

      return {
        data: data || [],
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error fetching principal contacts:', error)
      return {
        data: null,
        error: 'An unexpected error occurred while fetching principal contacts',
        success: false
      }
    }
  }

  /**
   * Create a new contact-principal advocacy relationship
   */
  async createContactPrincipal(advocacy: ContactPrincipalInsert): Promise<ApiResponse<ContactPrincipal>> {
    try {
      const { data, error } = await supabase
        .from('contact_principals')
        .insert(advocacy)
        .select()
        .single()

      if (error) {
        console.error('Error creating contact principal:', error)
        return {
          data: null,
          error: `Failed to create contact principal: ${error.message}`,
          success: false
        }
      }

      return {
        data,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error creating contact principal:', error)
      return {
        data: null,
        error: 'An unexpected error occurred while creating the contact principal',
        success: false
      }
    }
  }

  /**
   * Update an existing contact-principal advocacy relationship
   */
  async updateContactPrincipal(id: string, updates: ContactPrincipalUpdate): Promise<ApiResponse<ContactPrincipal>> {
    try {
      const { data, error } = await supabase
        .from('contact_principals')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating contact principal:', error)
        return {
          data: null,
          error: `Failed to update contact principal: ${error.message}`,
          success: false
        }
      }

      return {
        data,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error updating contact principal:', error)
      return {
        data: null,
        error: 'An unexpected error occurred while updating the contact principal',
        success: false
      }
    }
  }

  /**
   * Delete a contact-principal advocacy relationship
   */
  async deleteContactPrincipal(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('contact_principals')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting contact principal:', error)
        return {
          data: null,
          error: `Failed to delete contact principal: ${error.message}`,
          success: false
        }
      }

      return {
        data: true,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error deleting contact principal:', error)
      return {
        data: null,
        error: 'An unexpected error occurred while deleting the contact principal',
        success: false
      }
    }
  }

  /**
   * Bulk update contact principals for a contact
   * This is useful when updating the preferred principals from the contact form
   */
  async updateContactPrincipals(
    contactId: string, 
    principalIds: string[], 
    defaultAdvocacyLevel: 'High' | 'Medium' | 'Low' = 'Medium'
  ): Promise<ApiResponse<ContactPrincipal[]>> {
    try {
      // First, delete existing contact-principal relationships
      const { error: deleteError } = await supabase
        .from('contact_principals')
        .delete()
        .eq('contact_id', contactId)

      if (deleteError) {
        throw deleteError
      }

      // If no principals to add, return success
      if (principalIds.length === 0) {
        return {
          data: [],
          error: null,
          success: true
        }
      }

      // Create new contact-principal relationships
      const advocacies: ContactPrincipalInsert[] = principalIds.map(principalId => ({
        contact_id: contactId,
        principal_id: principalId,
        advocacy_level: defaultAdvocacyLevel
      }))

      const { data, error } = await supabase
        .from('contact_principals')
        .insert(advocacies)
        .select()

      if (error) {
        console.error('Error updating contact principals:', error)
        return {
          data: null,
          error: `Failed to update contact principals: ${error.message}`,
          success: false
        }
      }

      return {
        data: data || [],
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error updating contact principals:', error)
      return {
        data: null,
        error: 'An unexpected error occurred while updating contact principals',
        success: false
      }
    }
  }

  /**
   * Get advocacy statistics for reporting
   */
  async getAdvocacyStats(): Promise<ApiResponse<{
    totalAdvocacies: number
    highAdvocacies: number
    mediumAdvocacies: number
    lowAdvocacies: number
    topPrincipals: Array<{
      principal_id: string
      principal_name: string
      advocacy_count: number
    }>
  }>> {
    try {
      // Get total counts by advocacy level
      const { data: countsData, error: countsError } = await supabase
        .from('contact_principals')
        .select('advocacy_level')

      if (countsError) {
        throw countsError
      }

      const advocacyCounts = countsData?.reduce((acc, item) => {
        acc[item.advocacy_level] = (acc[item.advocacy_level] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      // Get top principals by advocacy count
      const { data: topPrincipalsData, error: topPrincipalsError } = await supabase
        .from('contact_principals')
        .select(`
          principal_id,
          principal:organizations!principal_id (name)
        `)

      if (topPrincipalsError) {
        throw topPrincipalsError
      }

      const principalCounts = topPrincipalsData?.reduce((acc, item) => {
        const principalId = item.principal_id
        const principalName = (item as any).principal?.name || 'Unknown'
        
        if (!acc[principalId]) {
          acc[principalId] = {
            principal_id: principalId,
            principal_name: principalName,
            advocacy_count: 0
          }
        }
        acc[principalId].advocacy_count++
        return acc
      }, {} as Record<string, any>) || {}

      const topPrincipals = Object.values(principalCounts)
        .sort((a: any, b: any) => b.advocacy_count - a.advocacy_count)
        .slice(0, 10) // Top 10

      const stats = {
        totalAdvocacies: countsData?.length || 0,
        highAdvocacies: advocacyCounts['High'] || 0,
        mediumAdvocacies: advocacyCounts['Medium'] || 0,
        lowAdvocacies: advocacyCounts['Low'] || 0,
        topPrincipals
      }

      return {
        data: stats,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Error fetching advocacy stats:', error)
      return {
        data: null,
        error: 'Failed to fetch advocacy statistics',
        success: false
      }
    }
  }
}

// Export singleton instance
export const contactPrincipalsApi = new ContactPrincipalsApiService()

// Export class for testing
export { ContactPrincipalsApiService }