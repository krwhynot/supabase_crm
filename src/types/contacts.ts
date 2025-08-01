/**
 * Contact validation schemas and form types - Updated for Kitchen Pantry CRM
 * Uses Yup for schema validation with TypeScript inference
 * Based on Contact Form documentation requirements
 */

import * as yup from 'yup'
import type { Contact, ContactInsert, ContactUpdate, ContactDetailView } from './database.types'

/**
 * Email validation regex (RFC 5322 compliant)
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

/**
 * Phone validation regex (international formats)
 */
const PHONE_REGEX = /^[+]?[1-9][\d]{0,15}$|^[+]?[()]?[\d\s\-()]{10,20}$/

/**
 * Position options for contact form dropdown
 */
export const POSITION_OPTIONS = [
  'Executive Chef',
  'Manager', 
  'Buyer',
  'Owner',
  'F&B Director',
  'Kitchen Manager',
  'Assistant Manager',
  'Head Chef',
  'Sous Chef',
  'Food Service Director'
] as const


/**
 * Contact creation validation schema - Updated for Kitchen Pantry CRM
 */
export const contactCreateSchema = yup.object({
  // Required fields
  first_name: yup
    .string()
    .required('First name is required')
    .min(1, 'First name cannot be empty')
    .max(100, 'First name must be less than 100 characters')
    .trim(),
  
  last_name: yup
    .string()
    .required('Last name is required')
    .min(1, 'Last name cannot be empty')
    .max(100, 'Last name must be less than 100 characters')
    .trim(),
  
  organization_id: yup
    .string()
    .required('Organization is required')
    .uuid('Organization ID must be valid'),
  
  position: yup
    .string()
    .required('Position is required')
    .min(1, 'Position cannot be empty')
    .max(100, 'Position must be less than 100 characters')
    .trim(),

  // Optional fields
  phone: yup
    .string()
    .nullable()
    .max(20, 'Phone number must be less than 20 characters')
    .matches(PHONE_REGEX, 'Please enter a valid phone number')
    .trim()
    .transform((value) => value === '' ? null : value),

  email: yup
    .string()
    .nullable()
    .matches(EMAIL_REGEX, 'Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .trim()
    .lowercase()
    .transform((value) => value === '' ? null : value),

  address: yup
    .string()
    .nullable()
    .max(255, 'Address must be less than 255 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  city: yup
    .string()
    .nullable()
    .max(100, 'City must be less than 100 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  state: yup
    .string()
    .nullable()
    .max(50, 'State must be less than 50 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  zip_code: yup
    .string()
    .nullable()
    .max(20, 'ZIP code must be less than 20 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  website: yup
    .string()
    .nullable()
    .matches(/^https?:\/\/[^\s]+$/, 'Website must be a valid URL starting with http:// or https://')
    .max(255, 'Website must be less than 255 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  account_manager: yup
    .string()
    .nullable()
    .max(100, 'Account manager must be less than 100 characters')
    .trim()
    .transform((value) => value === '' ? null : value),
  
  notes: yup
    .string()
    .nullable()
    .max(5000, 'Notes must be less than 5000 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  is_primary: yup
    .boolean()
    .nullable()
    .default(false)
})

/**
 * Contact update validation schema (all fields optional except those being updated)
 */
export const contactUpdateSchema = yup.object({
  first_name: yup
    .string()
    .min(1, 'First name cannot be empty')
    .max(100, 'First name must be less than 100 characters')
    .trim(),
  
  last_name: yup
    .string()
    .min(1, 'Last name cannot be empty')
    .max(100, 'Last name must be less than 100 characters')
    .trim(),
  
  organization_id: yup
    .string()
    .uuid('Organization ID must be valid'),
  
  position: yup
    .string()
    .max(100, 'Position must be less than 100 characters')
    .trim(),
  
  email: yup
    .string()
    .nullable()
    .matches(EMAIL_REGEX, 'Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .trim()
    .lowercase()
    .transform((value) => value === '' ? null : value),
  
  phone: yup
    .string()
    .nullable()
    .max(20, 'Phone number must be less than 20 characters')
    .matches(PHONE_REGEX, 'Please enter a valid phone number')
    .trim()
    .transform((value) => value === '' ? null : value),

  address: yup
    .string()
    .nullable()
    .max(255, 'Address must be less than 255 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  city: yup
    .string()
    .nullable()
    .max(100, 'City must be less than 100 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  state: yup
    .string()
    .nullable()
    .max(50, 'State must be less than 50 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  zip_code: yup
    .string()
    .nullable()
    .max(20, 'ZIP code must be less than 20 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  website: yup
    .string()
    .nullable()
    .matches(/^https?:\/\/[^\s]+$/, 'Website must be a valid URL starting with http:// or https://')
    .max(255, 'Website must be less than 255 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  account_manager: yup
    .string()
    .nullable()
    .max(100, 'Account manager must be less than 100 characters')
    .trim()
    .transform((value) => value === '' ? null : value),
  
  notes: yup
    .string()
    .nullable()
    .max(5000, 'Notes must be less than 5000 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  is_primary: yup
    .boolean()
    .nullable()
    .default(false)
})

/**
 * Search validation schema
 */
export const contactSearchSchema = yup.object({
  search: yup
    .string()
    .max(255, 'Search term must be less than 255 characters')
    .trim(),
  
  limit: yup
    .number()
    .positive('Limit must be positive')
    .max(100, 'Limit cannot exceed 100')
    .integer('Limit must be an integer'),
  
  offset: yup
    .number()
    .min(0, 'Offset cannot be negative')
    .integer('Offset must be an integer'),
  
  sortBy: yup
    .string()
    .oneOf(['first_name', 'last_name', 'organization', 'email', 'created_at'], 'Invalid sort field'),
  
  sortOrder: yup
    .string()
    .oneOf(['asc', 'desc'], 'Sort order must be asc or desc')
})

/**
 * Step-specific validation schemas for multi-step contact form
 */

// Step 1: Basic Info (Required: first_name, last_name, organization_id, position)
export const contactStepOneSchema = contactCreateSchema.pick([
  'first_name', 'last_name', 'organization_id', 'position', 'email', 'phone'
])

// Step 2: Contact Details (All optional) - formerly Step 3
export const contactStepThreeSchema = contactCreateSchema.pick([
  'address', 'city', 'state', 'zip_code', 'website', 'account_manager', 'notes', 'is_primary'
])

/**
 * TypeScript types inferred from Yup schemas
 */
export type ContactCreateForm = yup.InferType<typeof contactCreateSchema>
export type ContactUpdateForm = yup.InferType<typeof contactUpdateSchema>
export type ContactSearchForm = yup.InferType<typeof contactSearchSchema>

// Step-specific form types
export type ContactStepOneForm = yup.InferType<typeof contactStepOneSchema>
export type ContactStepThreeForm = yup.InferType<typeof contactStepThreeSchema>

/**
 * Multi-step form interfaces
 */
export interface ContactFormStep {
  id: number
  title: string
  description: string
  component: string
  requiredFields: string[]
  optionalFields: string[]
}

export interface ContactStepValidation {
  [stepNumber: number]: boolean
}

export interface ContactFormData extends ContactCreateForm {
  // Form-specific helpers
  _organizationSearch?: string
  _principalIds?: string[]
}

/**
 * Form validation helper types
 */
export interface ValidationError {
  field: string
  message: string
}

export interface FormValidationResult<T> {
  isValid: boolean
  data?: T
  errors: ValidationError[]
}

/**
 * Validation utility functions
 */
export class ContactValidator {
  /**
   * Validate contact creation form
   */
  static async validateCreate(data: unknown): Promise<FormValidationResult<ContactCreateForm>> {
    try {
      const validData = await contactCreateSchema.validate(data, { abortEarly: false })
      return {
        isValid: true,
        data: validData,
        errors: []
      }
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        return {
          isValid: false,
          errors: error.inner.map(err => ({
            field: err.path || 'unknown',
            message: err.message
          }))
        }
      }
      
      return {
        isValid: false,
        errors: [{ field: 'general', message: 'Validation failed' }]
      }
    }
  }

  /**
   * Validate contact update form
   */
  static async validateUpdate(data: unknown): Promise<FormValidationResult<ContactUpdateForm>> {
    try {
      const validData = await contactUpdateSchema.validate(data, { abortEarly: false })
      return {
        isValid: true,
        data: validData,
        errors: []
      }
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        return {
          isValid: false,
          errors: error.inner.map(err => ({
            field: err.path || 'unknown',
            message: err.message
          }))
        }
      }
      
      return {
        isValid: false,
        errors: [{ field: 'general', message: 'Validation failed' }]
      }
    }
  }

  /**
   * Validate search parameters
   */
  static async validateSearch(data: unknown): Promise<FormValidationResult<ContactSearchForm>> {
    try {
      const validData = await contactSearchSchema.validate(data, { abortEarly: false })
      return {
        isValid: true,
        data: validData,
        errors: []
      }
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        return {
          isValid: false,
          errors: error.inner.map(err => ({
            field: err.path || 'unknown',
            message: err.message
          }))
        }
      }
      
      return {
        isValid: false,
        errors: [{ field: 'general', message: 'Validation failed' }]
      }
    }
  }

  /**
   * Validate contact step one form
   */
  static async validateStepOne(data: unknown): Promise<FormValidationResult<ContactStepOneForm>> {
    try {
      const validData = await contactStepOneSchema.validate(data, { abortEarly: false })
      return {
        isValid: true,
        data: validData,
        errors: []
      }
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        return {
          isValid: false,
          errors: error.inner.map(err => ({
            field: err.path || 'unknown',
            message: err.message
          }))
        }
      }
      
      return {
        isValid: false,
        errors: [{ field: 'general', message: 'Step 1 validation failed' }]
      }
    }
  }


  /**
   * Validate contact step three form
   */
  static async validateStepThree(data: unknown): Promise<FormValidationResult<ContactStepThreeForm>> {
    try {
      const validData = await contactStepThreeSchema.validate(data, { abortEarly: false })
      return {
        isValid: true,
        data: validData,
        errors: []
      }
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        return {
          isValid: false,
          errors: error.inner.map(err => ({
            field: err.path || 'unknown',
            message: err.message
          }))
        }
      }
      
      return {
        isValid: false,
        errors: [{ field: 'general', message: 'Step 3 validation failed' }]
      }
    }
  }

  /**
   * Clean form data by removing empty strings and trimming
   */
  static cleanFormData(data: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = {}
    
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'string') {
        const trimmed = value.trim()
        cleaned[key] = trimmed === '' ? null : trimmed
      } else {
        cleaned[key] = value
      }
    })
    
    return cleaned
  }

  /**
   * Convert ContactCreateForm to ContactInsert
   */
  static formToInsert(form: ContactCreateForm): ContactInsert {
    return {
      first_name: form.first_name,
      last_name: form.last_name,
      organization_id: form.organization_id,
      position: form.position,
      phone: form.phone,
      email: form.email,
      address: form.address,
      city: form.city,
      state: form.state,
      zip_code: form.zip_code,
      website: form.website,
      account_manager: form.account_manager,
      notes: form.notes,
      is_primary: form.is_primary || false
    }
  }

  /**
   * Convert ContactUpdateForm to ContactUpdate
   */
  static formToUpdate(form: ContactUpdateForm): ContactUpdate {
    const update: ContactUpdate = {}
    
    if (form.first_name !== undefined) update.first_name = form.first_name
    if (form.last_name !== undefined) update.last_name = form.last_name
    if (form.organization_id !== undefined) update.organization_id = form.organization_id
    if (form.position !== undefined) update.position = form.position
    if (form.phone !== undefined) update.phone = form.phone
    if (form.email !== undefined) update.email = form.email
    if (form.address !== undefined) update.address = form.address
    if (form.city !== undefined) update.city = form.city
    if (form.state !== undefined) update.state = form.state
    if (form.zip_code !== undefined) update.zip_code = form.zip_code
    if (form.website !== undefined) update.website = form.website
    if (form.account_manager !== undefined) update.account_manager = form.account_manager
    if (form.notes !== undefined) update.notes = form.notes
    if (form.is_primary !== undefined) update.is_primary = form.is_primary
    
    return update
  }

  /**
   * Convert Contact or ContactDetailView to form data
   */
  static contactToForm(contact: Contact | ContactDetailView): ContactCreateForm {
    return {
      first_name: contact.first_name,
      last_name: contact.last_name,
      organization_id: contact.organization_id,
      position: contact.position,
      phone: contact.phone,
      email: contact.email,
      address: contact.address,
      city: contact.city,
      state: contact.state,
      zip_code: contact.zip_code,
      website: contact.website,
      account_manager: contact.account_manager,
      notes: contact.notes,
      is_primary: contact.is_primary
    }
  }
}

/**
 * Field validation helpers for real-time validation
 */
export const fieldValidators = {
  /**
   * Validate email field
   */
  email: (value: string): string | null => {
    if (!value.trim()) return 'Email is required'
    if (!EMAIL_REGEX.test(value)) return 'Please enter a valid email address'
    if (value.length > 255) return 'Email must be less than 255 characters'
    return null
  },

  /**
   * Validate required text field
   */
  requiredText: (value: string, fieldName: string, maxLength = 255): string | null => {
    if (!value.trim()) return `${fieldName} is required`
    if (value.length > maxLength) return `${fieldName} must be less than ${maxLength} characters`
    return null
  },

  /**
   * Validate optional text field
   */
  optionalText: (value: string, fieldName: string, maxLength = 255): string | null => {
    if (value && value.length > maxLength) return `${fieldName} must be less than ${maxLength} characters`
    return null
  },

  /**
   * Validate phone field
   */
  phone: (value: string): string | null => {
    if (value && !PHONE_REGEX.test(value)) return 'Please enter a valid phone number'
    if (value && value.length > 50) return 'Phone number must be less than 50 characters'
    return null
  },

  /**
   * Validate required select field
   */
  requiredSelect: (value: string, fieldName: string): string | null => {
    if (!value || value.trim() === '') return `${fieldName} is required`
    return null
  },

  /**
   * Validate website field
   */
  website: (value: string): string | null => {
    if (value && !/^https?:\/\/[^\s]+$/.test(value)) return 'Website must be a valid URL starting with http:// or https://'
    if (value && value.length > 255) return 'Website must be less than 255 characters'
    return null
  }
}

/**
 * Contact display utilities
 */
export const contactUtils = {
  /**
   * Get full name
   */
  getFullName: (contact: Contact): string => {
    return `${contact.first_name} ${contact.last_name}`.trim()
  },

  /**
   * Get display name with organization name (requires organization lookup)
   */
  getDisplayName: (contact: Contact, organizationName?: string): string => {
    const fullName = contactUtils.getFullName(contact)
    return organizationName ? `${fullName} (${organizationName})` : fullName
  },

  /**
   * Get position display label
   */
  getPositionLabel: (position: string): string => {
    return position || 'No position specified'
  },


  /**
   * Format phone number for display
   */
  formatPhone: (phone: string | null): string => {
    if (!phone) return 'No phone'
    
    // Basic formatting for US phone numbers
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
    }
    
    return phone
  },

  /**
   * Get initials for avatar
   */
  getInitials: (contact: Contact): string => {
    const first = contact.first_name.charAt(0).toUpperCase()
    const last = contact.last_name.charAt(0).toUpperCase()
    return `${first}${last}`
  },

  /**
   * Format creation date
   */
  formatCreatedDate: (contact: Contact): string => {
    if (!contact.created_at) return 'Unknown'
    
    const date = new Date(contact.created_at)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
}

/**
 * Contact Principal Advocacy Interface
 */
export interface ContactPrincipalAdvocacy {
  contact_id: string
  principal_id: string
  advocacy_level: 'High' | 'Medium' | 'Low'
  notes?: string
}

/**
 * Contact list display utilities
 */
export const contactListUtils = {
  /**
   * Sort contacts by name
   */
  sortByName: (contacts: Contact[]): Contact[] => {
    return [...contacts].sort((a, b) => {
      const nameA = `${a.first_name} ${a.last_name}`.toLowerCase()
      const nameB = `${b.first_name} ${b.last_name}`.toLowerCase()
      return nameA.localeCompare(nameB)
    })
  },

  /**
   * Filter contacts by position
   */
  filterByPosition: (contacts: Contact[], positions: string[]): Contact[] => {
    return contacts.filter(contact => positions.includes(contact.position))
  },

  /**
   * Group contacts by organization
   */
  groupByOrganization: (contacts: Contact[]): Record<string, Contact[]> => {
    return contacts.reduce((groups, contact) => {
      const orgId = contact.organization_id || 'Unknown'
      if (!groups[orgId]) {
        groups[orgId] = []
      }
      groups[orgId].push(contact)
      return groups
    }, {} as Record<string, Contact[]>)
  }
}

// Type exports for external use
export type PositionOption = typeof POSITION_OPTIONS[number]