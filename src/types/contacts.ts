/**
 * Contact validation schemas and form types
 * Uses Yup for schema validation with TypeScript inference
 */

import * as yup from 'yup'
import type { Contact, ContactInsert, ContactUpdate } from './database.types'

/**
 * Email validation regex (RFC 5322 compliant)
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

/**
 * Phone validation regex (international formats)
 */
const PHONE_REGEX = /^[+]?[1-9][\d]{0,15}$|^[+]?[()]?[\d\s\-()]{10,20}$/

/**
 * Contact creation validation schema
 */
export const contactCreateSchema = yup.object({
  first_name: yup
    .string()
    .required('First name is required')
    .min(1, 'First name cannot be empty')
    .max(255, 'First name must be less than 255 characters')
    .trim(),
  
  last_name: yup
    .string()
    .required('Last name is required')
    .min(1, 'Last name cannot be empty')
    .max(255, 'Last name must be less than 255 characters')
    .trim(),
  
  organization: yup
    .string()
    .required('Organization is required')
    .min(1, 'Organization cannot be empty')
    .max(255, 'Organization must be less than 255 characters')
    .trim(),
  
  email: yup
    .string()
    .required('Email is required')
    .matches(EMAIL_REGEX, 'Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .trim()
    .lowercase(),
  
  title: yup
    .string()
    .nullable()
    .max(255, 'Title must be less than 255 characters')
    .trim()
    .transform((value) => value === '' ? null : value),
  
  phone: yup
    .string()
    .nullable()
    .max(50, 'Phone number must be less than 50 characters')
    .matches(PHONE_REGEX, 'Please enter a valid phone number')
    .trim()
    .transform((value) => value === '' ? null : value),
  
  notes: yup
    .string()
    .nullable()
    .max(5000, 'Notes must be less than 5000 characters')
    .trim()
    .transform((value) => value === '' ? null : value)
})

/**
 * Contact update validation schema (all fields optional except those being updated)
 */
export const contactUpdateSchema = yup.object({
  first_name: yup
    .string()
    .min(1, 'First name cannot be empty')
    .max(255, 'First name must be less than 255 characters')
    .trim(),
  
  last_name: yup
    .string()
    .min(1, 'Last name cannot be empty')
    .max(255, 'Last name must be less than 255 characters')
    .trim(),
  
  organization: yup
    .string()
    .min(1, 'Organization cannot be empty')
    .max(255, 'Organization must be less than 255 characters')
    .trim(),
  
  email: yup
    .string()
    .matches(EMAIL_REGEX, 'Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .trim()
    .lowercase(),
  
  title: yup
    .string()
    .nullable()
    .max(255, 'Title must be less than 255 characters')
    .trim()
    .transform((value) => value === '' ? null : value),
  
  phone: yup
    .string()
    .nullable()
    .max(50, 'Phone number must be less than 50 characters')
    .matches(PHONE_REGEX, 'Please enter a valid phone number')
    .trim()
    .transform((value) => value === '' ? null : value),
  
  notes: yup
    .string()
    .nullable()
    .max(5000, 'Notes must be less than 5000 characters')
    .trim()
    .transform((value) => value === '' ? null : value)
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
 * TypeScript types inferred from Yup schemas
 */
export type ContactCreateForm = yup.InferType<typeof contactCreateSchema>
export type ContactUpdateForm = yup.InferType<typeof contactUpdateSchema>
export type ContactSearchForm = yup.InferType<typeof contactSearchSchema>

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
      organization: form.organization,
      email: form.email,
      title: form.title,
      phone: form.phone,
      notes: form.notes
    }
  }

  /**
   * Convert ContactUpdateForm to ContactUpdate
   */
  static formToUpdate(form: ContactUpdateForm): ContactUpdate {
    const update: ContactUpdate = {}
    
    if (form.first_name !== undefined) update.first_name = form.first_name
    if (form.last_name !== undefined) update.last_name = form.last_name
    if (form.organization !== undefined) update.organization = form.organization
    if (form.email !== undefined) update.email = form.email
    if (form.title !== undefined) update.title = form.title
    if (form.phone !== undefined) update.phone = form.phone
    if (form.notes !== undefined) update.notes = form.notes
    
    return update
  }

  /**
   * Convert Contact to form data
   */
  static contactToForm(contact: Contact): ContactCreateForm {
    return {
      first_name: contact.first_name,
      last_name: contact.last_name,
      organization: contact.organization,
      email: contact.email,
      title: contact.title,
      phone: contact.phone,
      notes: contact.notes
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
   * Get display name with organization
   */
  getDisplayName: (contact: Contact): string => {
    const fullName = contactUtils.getFullName(contact)
    return contact.organization ? `${fullName} (${contact.organization})` : fullName
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