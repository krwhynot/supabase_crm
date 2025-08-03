/**
 * User Preferences API Service
 * Handles enhanced user preferences, categories, and notification settings
 */

import { supabase } from '@/config/supabaseClient'
import type { 
  UserPreferenceCategory, 
  UserPreferenceEnhanced, 
  NotificationPreference,
  UserPreferences 
} from '@/types/user'

export interface PreferencesUpdateRequest {
  preferences: UserPreferences
  notificationChannels: NotificationPreference[]
  privacySettings: Record<string, any>
}

class UserPreferencesApiService {
  /**
   * Get all preference categories
   */
  async getPreferenceCategories(): Promise<{ data: UserPreferenceCategory[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('user_preference_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order')

      if (error) {
        console.error('Error fetching preference categories:', error)
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Unexpected error fetching categories:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }
    }
  }

  /**
   * Get user's enhanced preferences
   */
  async getUserPreferences(userId: string): Promise<{ data: UserPreferences | null; error: string | null }> {
    try {
      // Get basic preferences first
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('preferences')
        .eq('id', userId)
        .single()

      if (profileError) {
        return { data: null, error: profileError.message }
      }

      // Get enhanced preferences
      const { data: enhancedData, error: enhancedError } = await supabase
        .from('user_preferences_enhanced')
        .select(`
          preference_key,
          preference_value,
          data_type,
          user_preference_categories (
            name,
            description
          )
        `)
        .eq('user_id', userId)

      if (enhancedError) {
        console.warn('Enhanced preferences not available:', enhancedError.message)
      }

      // Merge basic and enhanced preferences
      const basePreferences = profileData?.preferences || {
        theme: 'light',
        notifications: true,
        language: 'en',
        timezone: 'UTC'
      }

      // TODO: Merge enhanced preferences into base preferences
      // This would involve converting JSONB data back to typed preferences

      return { data: basePreferences, error: null }
    } catch (error) {
      console.error('Unexpected error fetching user preferences:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }
    }
  }

  /**
   * Get user's notification preferences
   */
  async getNotificationPreferences(userId: string): Promise<{ data: NotificationPreference[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .order('notification_type')

      if (error) {
        console.error('Error fetching notification preferences:', error)
        return { data: null, error: error.message }
      }

      // If no preferences exist, return defaults
      if (!data || data.length === 0) {
        const defaultChannels: NotificationPreference[] = [
          {
            id: '',
            user_id: userId,
            notification_type: 'general',
            channel: 'email',
            is_enabled: true,
            frequency: 'immediate',
            timezone: 'UTC',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '',
            user_id: userId,
            notification_type: 'general',
            channel: 'push',
            is_enabled: true,
            frequency: 'immediate',
            timezone: 'UTC',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
        return { data: defaultChannels, error: null }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Unexpected error fetching notification preferences:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }
    }
  }

  /**
   * Update user preferences (comprehensive update)
   */
  async updateUserPreferences(
    userId: string, 
    updates: PreferencesUpdateRequest
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Start a transaction-like approach with multiple operations
      const operations = []

      // 1. Update basic preferences in user_profiles
      operations.push(
        supabase
          .from('user_profiles')
          .update({ 
            preferences: updates.preferences,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
      )

      // 2. Update notification preferences
      for (const channel of updates.notificationChannels) {
        if (channel.id) {
          // Update existing
          operations.push(
            supabase
              .from('notification_preferences')
              .update({
                is_enabled: channel.is_enabled,
                frequency: channel.frequency,
                quiet_hours_start: channel.quiet_hours_start,
                quiet_hours_end: channel.quiet_hours_end,
                custom_settings: channel.custom_settings,
                updated_at: new Date().toISOString()
              })
              .eq('id', channel.id)
          )
        } else {
          // Insert new
          operations.push(
            supabase
              .from('notification_preferences')
              .insert({
                user_id: userId,
                notification_type: channel.notification_type,
                channel: channel.channel,
                is_enabled: channel.is_enabled,
                frequency: channel.frequency,
                timezone: channel.timezone || 'UTC',
                quiet_hours_start: channel.quiet_hours_start,
                quiet_hours_end: channel.quiet_hours_end,
                custom_settings: channel.custom_settings
              })
          )
        }
      }

      // 3. Update enhanced preferences for privacy settings
      for (const [key, value] of Object.entries(updates.privacySettings)) {
        operations.push(
          supabase
            .from('user_preferences_enhanced')
            .upsert({
              user_id: userId,
              category_id: 'privacy-category-id', // Would get this from categories
              preference_key: key,
              preference_value: value,
              data_type: typeof value,
              updated_at: new Date().toISOString()
            })
        )
      }

      // Execute all operations
      const results = await Promise.allSettled(operations)
      
      // Check for failures
      const failures = results.filter(result => 
        result.status === 'rejected' || 
        (result.status === 'fulfilled' && result.value.error)
      )

      if (failures.length > 0) {
        console.error('Some preference updates failed:', failures)
        return { 
          success: false, 
          error: 'Some preferences could not be updated' 
        }
      }

      return { success: true, error: null }
    } catch (error) {
      console.error('Unexpected error updating preferences:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }
    }
  }

  /**
   * Create enhanced preference
   */
  async createEnhancedPreference(
    userId: string,
    categoryId: string,
    preferenceKey: string,
    preferenceValue: any,
    options: {
      dataType?: 'string' | 'number' | 'boolean' | 'object' | 'array'
      isEncrypted?: boolean
      isUserConfigurable?: boolean
      validationSchema?: object
    } = {}
  ): Promise<{ data: UserPreferenceEnhanced | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('user_preferences_enhanced')
        .insert({
          user_id: userId,
          category_id: categoryId,
          preference_key: preferenceKey,
          preference_value: preferenceValue,
          data_type: options.dataType || typeof preferenceValue,
          is_encrypted: options.isEncrypted || false,
          is_user_configurable: options.isUserConfigurable !== false,
          validation_schema: options.validationSchema
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating enhanced preference:', error)
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Unexpected error creating preference:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }
    }
  }

  /**
   * Delete enhanced preference
   */
  async deleteEnhancedPreference(
    userId: string,
    preferenceId: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('user_preferences_enhanced')
        .delete()
        .eq('id', preferenceId)
        .eq('user_id', userId) // Additional security check

      if (error) {
        console.error('Error deleting preference:', error)
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error) {
      console.error('Unexpected error deleting preference:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }
    }
  }

  /**
   * Reset user preferences to defaults
   */
  async resetToDefaults(userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const defaultPreferences: UserPreferences = {
        theme: 'light',
        notifications: true,
        language: 'en',
        timezone: 'UTC'
      }

      // Reset basic preferences
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ 
          preferences: defaultPreferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (profileError) {
        return { success: false, error: profileError.message }
      }

      // Delete all enhanced preferences (user can reconfigure)
      const { error: enhancedError } = await supabase
        .from('user_preferences_enhanced')
        .delete()
        .eq('user_id', userId)
        .eq('is_user_configurable', true)

      if (enhancedError) {
        console.warn('Could not reset enhanced preferences:', enhancedError.message)
      }

      // Reset notification preferences to defaults
      const { error: notificationError } = await supabase
        .from('notification_preferences')
        .delete()
        .eq('user_id', userId)

      if (notificationError) {
        console.warn('Could not reset notification preferences:', notificationError.message)
      }

      return { success: true, error: null }
    } catch (error) {
      console.error('Unexpected error resetting preferences:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }
    }
  }
}

// Export singleton instance
export const userPreferencesApi = new UserPreferencesApiService()

// Export class for testing
export { UserPreferencesApiService }