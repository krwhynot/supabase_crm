/**
 * User Management API
 * 
 * Comprehensive user operations with authentication and security
 * TEST MODIFICATION: Adding enhanced security features and rate limiting
 */

import { supabase } from '@/lib/supabase'
import type { User, UserProfile, UserPreferences } from '@/types/user'

export interface UserApiResponse<T = any> {
  data: T | null
  error: string | null
  success: boolean
}

export interface UserListOptions {
  page?: number
  limit?: number
  sortBy?: 'created_at' | 'email' | 'last_sign_in'
  sortOrder?: 'asc' | 'desc'
  search?: string
  role?: string
}

export interface UserSecurityContext {
  requestId: string
  userAgent: string
  ipAddress: string
  timestamp: Date
  authLevel: 'anonymous' | 'authenticated' | 'admin'
}

// Rate limiting configuration
const RATE_LIMITS = {
  getUserProfile: { requests: 100, window: 60000 }, // 100 requests per minute
  updateUser: { requests: 10, window: 60000 }, // 10 updates per minute
  deleteUser: { requests: 5, window: 300000 }, // 5 deletions per 5 minutes
  searchUsers: { requests: 50, window: 60000 } // 50 searches per minute
}

class UserApiService {
  private rateLimitTracker = new Map<string, { count: number; resetTime: number }>()

  /**
   * Enhanced rate limiting with user-specific tracking
   */
  private checkRateLimit(operation: keyof typeof RATE_LIMITS, userId: string): boolean {
    const limit = RATE_LIMITS[operation]
    const key = `${operation}:${userId}`
    const now = Date.now()
    
    const userLimit = this.rateLimitTracker.get(key)
    if (!userLimit || now > userLimit.resetTime) {
      this.rateLimitTracker.set(key, {
        count: 1,
        resetTime: now + limit.window
      })
      return true
    }
    
    if (userLimit.count >= limit.requests) {
      console.warn(`Rate limit exceeded for ${operation} by user ${userId}`)
      return false
    }
    
    userLimit.count++
    return true
  }

  /**
   * Security audit logging for sensitive operations
   */
  private logSecurityEvent(
    event: string,
    context: UserSecurityContext,
    details: Record<string, any> = {}
  ): void {
    console.log(`🔐 Security Event: ${event}`, {
      requestId: context.requestId,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
      timestamp: context.timestamp.toISOString(),
      authLevel: context.authLevel,
      ...details
    })
    
    // In production, send to security monitoring system
    // await securityLogger.log(event, context, details)
  }

  /**
   * Get user profile with enhanced security validation
   */
  async getUserProfile(
    userId: string,
    securityContext: UserSecurityContext
  ): Promise<UserApiResponse<UserProfile>> {
    try {
      // Rate limiting check
      if (!this.checkRateLimit('getUserProfile', userId)) {
        return {
          data: null,
          error: 'Rate limit exceeded. Please try again later.',
          success: false
        }
      }

      // Security audit
      this.logSecurityEvent('user_profile_access', securityContext, { targetUserId: userId })

      // Input validation and sanitization
      if (!userId || typeof userId !== 'string' || userId.length < 1) {
        return {
          data: null,
          error: 'Invalid user ID provided',
          success: false
        }
      }

      // Sanitize user ID to prevent injection attacks
      const sanitizedUserId = userId.replace(/[^a-zA-Z0-9-_]/g, '')
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          email,
          full_name,
          avatar_url,
          role,
          created_at,
          updated_at,
          last_sign_in_at,
          preferences,
          security_settings
        `)
        .eq('id', sanitizedUserId)
        .single()

      if (error) {
        this.logSecurityEvent('user_profile_access_failed', securityContext, { 
          error: error.message,
          targetUserId: sanitizedUserId
        })
        
        return {
          data: null,
          error: `Failed to fetch user profile: ${error.message}`,
          success: false
        }
      }

      // Filter sensitive data based on auth level
      const filteredData = this.filterSensitiveUserData(data, securityContext.authLevel)

      return {
        data: filteredData,
        error: null,
        success: true
      }
    } catch (error) {
      this.logSecurityEvent('user_profile_access_error', securityContext, { 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      return {
        data: null,
        error: 'An unexpected error occurred while fetching user profile',
        success: false
      }
    }
  }

  /**
   * List users with advanced filtering and security controls
   */
  async listUsers(
    options: UserListOptions = {},
    securityContext: UserSecurityContext
  ): Promise<UserApiResponse<{ users: UserProfile[]; total: number; page: number }>> {
    try {
      // Enhanced authentication check for user listing
      if (securityContext.authLevel !== 'admin') {
        this.logSecurityEvent('unauthorized_user_list_attempt', securityContext)
        return {
          data: null,
          error: 'Insufficient permissions to list users',
          success: false
        }
      }

      // Rate limiting for search operations
      if (!this.checkRateLimit('searchUsers', securityContext.userAgent)) {
        return {
          data: null,
          error: 'Search rate limit exceeded',
          success: false
        }
      }

      const {
        page = 1,
        limit = 20,
        sortBy = 'created_at',
        sortOrder = 'desc',
        search,
        role
      } = options

      // Validate and sanitize parameters
      const validatedLimit = Math.min(Math.max(1, limit), 100) // Max 100 users per page
      const validatedPage = Math.max(1, page)
      const offset = (validatedPage - 1) * validatedLimit

      let query = supabase
        .from('user_profiles')
        .select(`
          id,
          email,
          full_name,
          avatar_url,
          role,
          created_at,
          last_sign_in_at,
          status
        `, { count: 'exact' })

      // Apply security filters
      if (role) {
        const sanitizedRole = role.replace(/[^a-zA-Z0-9_]/g, '')
        query = query.eq('role', sanitizedRole)
      }

      // Apply search with proper sanitization
      if (search) {
        const sanitizedSearch = search.replace(/[<>'"]/g, '').substring(0, 100)
        query = query.or(`full_name.ilike.%${sanitizedSearch}%,email.ilike.%${sanitizedSearch}%`)
      }

      // Apply sorting with validation
      const validSortColumns = ['created_at', 'email', 'last_sign_in']
      const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at'
      const safeSortOrder = sortOrder === 'asc' ? 'asc' : 'desc'
      
      query = query
        .order(safeSortBy, { ascending: safeSortOrder === 'asc' })
        .range(offset, offset + validatedLimit - 1)

      const { data, error, count } = await query

      if (error) {
        this.logSecurityEvent('user_list_query_failed', securityContext, { 
          error: error.message,
          searchTerm: search,
          filters: { role, sortBy, sortOrder }
        })
        
        return {
          data: null,
          error: `Failed to fetch users: ${error.message}`,
          success: false
        }
      }

      this.logSecurityEvent('user_list_accessed', securityContext, {
        resultCount: data?.length || 0,
        totalCount: count || 0,
        filters: { search, role, sortBy, sortOrder }
      })

      return {
        data: {
          users: data || [],
          total: count || 0,
          page: validatedPage
        },
        error: null,
        success: true
      }
    } catch (error) {
      this.logSecurityEvent('user_list_error', securityContext, { 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      return {
        data: null,
        error: 'An unexpected error occurred while fetching users',
        success: false
      }
    }
  }

  /**
   * Update user with comprehensive validation and audit trail
   */
  async updateUser(
    userId: string,
    updates: Partial<UserProfile>,
    securityContext: UserSecurityContext
  ): Promise<UserApiResponse<UserProfile>> {
    try {
      // Rate limiting for updates
      if (!this.checkRateLimit('updateUser', userId)) {
        return {
          data: null,
          error: 'Update rate limit exceeded',
          success: false
        }
      }

      // Comprehensive input validation
      if (!userId || typeof userId !== 'string') {
        return {
          data: null,
          error: 'Invalid user ID',
          success: false
        }
      }

      // Sanitize and validate update fields
      const sanitizedUpdates = this.sanitizeUserUpdates(updates)
      if (Object.keys(sanitizedUpdates).length === 0) {
        return {
          data: null,
          error: 'No valid fields to update',
          success: false
        }
      }

      // Security validation for sensitive field updates
      if (sanitizedUpdates.role && securityContext.authLevel !== 'admin') {
        this.logSecurityEvent('unauthorized_role_change_attempt', securityContext, {
          targetUserId: userId,
          attemptedRole: sanitizedUpdates.role
        })
        return {
          data: null,
          error: 'Insufficient permissions to change user role',
          success: false
        }
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...sanitizedUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        this.logSecurityEvent('user_update_failed', securityContext, {
          targetUserId: userId,
          error: error.message,
          attemptedUpdates: Object.keys(sanitizedUpdates)
        })
        
        return {
          data: null,
          error: `Failed to update user: ${error.message}`,
          success: false
        }
      }

      this.logSecurityEvent('user_updated', securityContext, {
        targetUserId: userId,
        updatedFields: Object.keys(sanitizedUpdates)
      })

      return {
        data: data,
        error: null,
        success: true
      }
    } catch (error) {
      this.logSecurityEvent('user_update_error', securityContext, {
        targetUserId: userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      return {
        data: null,
        error: 'An unexpected error occurred while updating user',
        success: false
      }
    }
  }

  /**
   * Delete user with enhanced security and audit trail
   */
  async deleteUser(
    userId: string,
    securityContext: UserSecurityContext
  ): Promise<UserApiResponse<boolean>> {
    try {
      // Strict rate limiting for deletions
      if (!this.checkRateLimit('deleteUser', userId)) {
        return {
          data: null,
          error: 'Deletion rate limit exceeded',
          success: false
        }
      }

      // Enhanced authorization check
      if (securityContext.authLevel !== 'admin') {
        this.logSecurityEvent('unauthorized_user_deletion_attempt', securityContext, {
          targetUserId: userId
        })
        return {
          data: null,
          error: 'Insufficient permissions to delete users',
          success: false
        }
      }

      // Validate user ID
      if (!userId || typeof userId !== 'string') {
        return {
          data: null,
          error: 'Invalid user ID',
          success: false
        }
      }

      // Check if user exists before deletion
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('id, email, role')
        .eq('id', userId)
        .single()

      if (!existingUser) {
        return {
          data: null,
          error: 'User not found',
          success: false
        }
      }

      // Prevent deletion of admin users
      if (existingUser.role === 'admin') {
        this.logSecurityEvent('admin_deletion_attempt', securityContext, {
          targetUserId: userId,
          targetEmail: existingUser.email
        })
        return {
          data: null,
          error: 'Cannot delete admin users',
          success: false
        }
      }

      // Soft delete implementation
      const { error } = await supabase
        .from('user_profiles')
        .update({
          status: 'deleted',
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        this.logSecurityEvent('user_deletion_failed', securityContext, {
          targetUserId: userId,
          error: error.message
        })
        
        return {
          data: null,
          error: `Failed to delete user: ${error.message}`,
          success: false
        }
      }

      this.logSecurityEvent('user_deleted', securityContext, {
        targetUserId: userId,
        targetEmail: existingUser.email
      })

      return {
        data: true,
        error: null,
        success: true
      }
    } catch (error) {
      this.logSecurityEvent('user_deletion_error', securityContext, {
        targetUserId: userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      return {
        data: null,
        error: 'An unexpected error occurred while deleting user',
        success: false
      }
    }
  }

  /**
   * Filter sensitive data based on authentication level
   */
  private filterSensitiveUserData(userData: any, authLevel: UserSecurityContext['authLevel']): UserProfile {
    const baseData = {
      id: userData.id,
      email: userData.email,
      full_name: userData.full_name,
      avatar_url: userData.avatar_url,
      created_at: userData.created_at
    }

    switch (authLevel) {
      case 'admin':
        return {
          ...baseData,
          role: userData.role,
          last_sign_in_at: userData.last_sign_in_at,
          preferences: userData.preferences,
          security_settings: userData.security_settings,
          updated_at: userData.updated_at
        }
      
      case 'authenticated':
        return {
          ...baseData,
          preferences: userData.preferences
        }
      
      default:
        return baseData
    }
  }

  /**
   * Sanitize user update fields
   */
  private sanitizeUserUpdates(updates: Partial<UserProfile>): Partial<UserProfile> {
    const sanitized: Partial<UserProfile> = {}
    
    // Allowed fields for updates
    const allowedFields = ['full_name', 'avatar_url', 'preferences', 'role']
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        if (typeof value === 'string') {
          // Sanitize string fields
          sanitized[key as keyof UserProfile] = value.trim().replace(/[<>'"]/g, '').substring(0, 255)
        } else if (typeof value === 'object' && key === 'preferences') {
          // Validate preferences object
          sanitized.preferences = this.sanitizePreferences(value)
        } else if (key === 'role') {
          // Validate role values
          const validRoles = ['user', 'admin', 'moderator']
          if (validRoles.includes(value as string)) {
            sanitized.role = value as string
          }
        }
      }
    }
    
    return sanitized
  }

  /**
   * Sanitize user preferences
   */
  private sanitizePreferences(preferences: any): UserPreferences {
    const defaultPreferences: UserPreferences = {
      theme: 'light',
      notifications: true,
      language: 'en',
      timezone: 'UTC'
    }

    if (!preferences || typeof preferences !== 'object') {
      return defaultPreferences
    }

    return {
      theme: ['light', 'dark', 'auto'].includes(preferences.theme) ? preferences.theme : 'light',
      notifications: typeof preferences.notifications === 'boolean' ? preferences.notifications : true,
      language: typeof preferences.language === 'string' ? preferences.language.substring(0, 10) : 'en',
      timezone: typeof preferences.timezone === 'string' ? preferences.timezone.substring(0, 50) : 'UTC'
    }
  }
}

// Export singleton instance
export const userApi = new UserApiService()

// Export types for external use
export type { UserSecurityContext, UserListOptions }