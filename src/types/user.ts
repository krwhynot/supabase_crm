/**
 * User Management Type Definitions
 * Enhanced with preference categories and notification settings
 */

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role?: 'user' | 'admin' | 'moderator'
  created_at: string
  updated_at?: string
  last_sign_in_at?: string
  preferences?: UserPreferences
  security_settings?: UserSecuritySettings
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  notifications: boolean
  language: string
  timezone: string
}

export interface UserPreferenceCategory {
  id: string
  name: string
  description?: string
  icon?: string
  display_order: number
  is_active: boolean
}

export interface UserPreferenceEnhanced {
  id: string
  user_id: string
  category_id: string
  preference_key: string
  preference_value: any
  data_type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  is_encrypted: boolean
  is_user_configurable: boolean
  validation_schema?: object
  created_at: string
  updated_at: string
}

export interface NotificationPreference {
  id: string
  user_id: string
  notification_type: string
  channel: 'email' | 'push' | 'sms' | 'in_app'
  is_enabled: boolean
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly' | 'monthly'
  quiet_hours_start?: string
  quiet_hours_end?: string
  timezone: string
  custom_settings?: object
  created_at: string
  updated_at: string
}

export interface UserSecuritySettings {
  two_factor_enabled: boolean
  password_last_changed: string
  failed_login_attempts: number
  security_questions_set: boolean
}

export interface User {
  id: string
  email: string
  email_confirmed_at?: string
  phone?: string
  confirmed_at?: string
  last_sign_in_at?: string
  app_metadata: {
    provider?: string
    providers?: string[]
  }
  user_metadata: {
    full_name?: string
    avatar_url?: string
    preferences?: UserPreferences
  }
  role?: string
  created_at: string
  updated_at: string
}

// Form interfaces
export interface UserFormData {
  full_name: string
  email: string
  phone?: string
  role: 'user' | 'moderator' | 'admin' | ''
  status: 'active' | 'inactive'
  preferences: UserPreferences
}

export interface UserCreateInput {
  email: string
  password?: string
  full_name?: string
  role?: 'user' | 'moderator' | 'admin'
  preferences?: Partial<UserPreferences>
}

export interface UserUpdateInput {
  full_name?: string
  role?: 'user' | 'moderator' | 'admin'
  preferences?: Partial<UserPreferences>
  security_settings?: Partial<UserSecuritySettings>
}

// API Response types
export interface UserListResponse {
  data: UserProfile[]
  count: number
  error?: string
}

export interface UserResponse {
  data: UserProfile | null
  error?: string
}