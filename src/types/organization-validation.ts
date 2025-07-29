/**
 * Organization validation utilities and helper functions
 * Follows established patterns from contacts.ts validation system
 */

import * as yup from 'yup'
import type {
  OrganizationCreateForm,
  OrganizationUpdateForm,
  OrganizationSearchForm,
  OrganizationInteractionCreateForm,
  OrganizationFormValidationResult,
  OrganizationValidationError
} from './organizations'
import type {
  Organization,
  OrganizationInsert,
  OrganizationUpdate,
  OrganizationType,
  OrganizationSize,
  OrganizationStatus
} from './database.types'
import {
  organizationCreateSchema,
  organizationUpdateSchema,
  organizationSearchSchema,
  organizationInteractionCreateSchema
} from './organizations'

/**
 * Organization validation utility class
 * Provides comprehensive validation methods for all organization forms
 */
export class OrganizationValidator {
  /**
   * Validate organization creation form
   */
  static async validateCreate(data: unknown): Promise<OrganizationFormValidationResult<OrganizationCreateForm>> {
    try {
      const validData = await organizationCreateSchema.validate(data, { abortEarly: false })
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
   * Validate organization update form
   */
  static async validateUpdate(data: unknown): Promise<OrganizationFormValidationResult<OrganizationUpdateForm>> {
    try {
      const validData = await organizationUpdateSchema.validate(data, { abortEarly: false })
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
   * Validate organization search parameters
   */
  static async validateSearch(data: unknown): Promise<OrganizationFormValidationResult<OrganizationSearchForm>> {
    try {
      const validData = await organizationSearchSchema.validate(data, { abortEarly: false })
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
   * Validate organization interaction form
   */
  static async validateInteraction(data: unknown): Promise<OrganizationFormValidationResult<OrganizationInteractionCreateForm>> {
    try {
      const validData = await organizationInteractionCreateSchema.validate(data, { abortEarly: false })
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
      } else if (Array.isArray(value)) {
        // Clean array values (for tags, etc.)
        cleaned[key] = value
          .filter(item => item !== null && item !== undefined && item !== '')
          .map(item => typeof item === 'string' ? item.trim() : item)
      } else {
        cleaned[key] = value
      }
    })
    
    return cleaned
  }

  /**
   * Convert OrganizationCreateForm to OrganizationInsert
   */
  static formToInsert(form: OrganizationCreateForm): OrganizationInsert {
    return {
      name: form.name,
      legal_name: form.legal_name,
      description: form.description,
      industry: form.industry,
      type: form.type as OrganizationType | null,
      size: form.size as OrganizationSize | null,
      status: form.status as OrganizationStatus | null,
      website: form.website,
      email: form.email,
      primary_phone: form.primary_phone,
      secondary_phone: form.secondary_phone,
      address_line_1: form.address_line_1,
      address_line_2: form.address_line_2,
      city: form.city,
      state_province: form.state_province,
      postal_code: form.postal_code,
      country: form.country,
      founded_year: form.founded_year,
      employees_count: form.employees_count,
      annual_revenue: form.annual_revenue,
      currency_code: form.currency_code,
      lead_source: form.lead_source,
      lead_score: form.lead_score,
      parent_org_id: form.parent_org_id,
      tags: form.tags ? JSON.stringify(form.tags) : null,
      next_follow_up_date: form.next_follow_up_date?.toISOString() || null
    }
  }

  /**
   * Convert OrganizationUpdateForm to OrganizationUpdate
   */
  static formToUpdate(form: OrganizationUpdateForm): OrganizationUpdate {
    const update: OrganizationUpdate = {}
    
    if (form.name !== undefined) update.name = form.name
    if (form.legal_name !== undefined) update.legal_name = form.legal_name
    if (form.description !== undefined) update.description = form.description
    if (form.industry !== undefined) update.industry = form.industry
    if (form.type !== undefined) update.type = form.type as OrganizationType | null
    if (form.size !== undefined) update.size = form.size as OrganizationSize | null
    if (form.status !== undefined) update.status = form.status as OrganizationStatus | null
    if (form.website !== undefined) update.website = form.website
    if (form.email !== undefined) update.email = form.email
    if (form.primary_phone !== undefined) update.primary_phone = form.primary_phone
    if (form.secondary_phone !== undefined) update.secondary_phone = form.secondary_phone
    if (form.address_line_1 !== undefined) update.address_line_1 = form.address_line_1
    if (form.address_line_2 !== undefined) update.address_line_2 = form.address_line_2
    if (form.city !== undefined) update.city = form.city
    if (form.state_province !== undefined) update.state_province = form.state_province
    if (form.postal_code !== undefined) update.postal_code = form.postal_code
    if (form.country !== undefined) update.country = form.country
    if (form.founded_year !== undefined) update.founded_year = form.founded_year
    if (form.employees_count !== undefined) update.employees_count = form.employees_count
    if (form.annual_revenue !== undefined) update.annual_revenue = form.annual_revenue
    if (form.currency_code !== undefined) update.currency_code = form.currency_code
    if (form.lead_source !== undefined) update.lead_source = form.lead_source
    if (form.lead_score !== undefined) update.lead_score = form.lead_score
    if (form.parent_org_id !== undefined) update.parent_org_id = form.parent_org_id
    if (form.tags !== undefined) update.tags = form.tags ? JSON.stringify(form.tags) : null
    if (form.next_follow_up_date !== undefined) {
      update.next_follow_up_date = form.next_follow_up_date?.toISOString() || null
    }
    
    return update
  }

  /**
   * Convert Organization to form data
   */
  static organizationToForm(organization: Organization): OrganizationCreateForm {
    return {
      name: organization.name,
      legal_name: organization.legal_name,
      description: organization.description,
      industry: organization.industry,
      type: organization.type,
      size: organization.size,
      status: organization.status,
      website: organization.website,
      email: organization.email,
      primary_phone: organization.primary_phone,
      secondary_phone: organization.secondary_phone,
      address_line_1: organization.address_line_1,
      address_line_2: organization.address_line_2,
      city: organization.city,
      state_province: organization.state_province,
      postal_code: organization.postal_code,
      country: organization.country,
      founded_year: organization.founded_year,
      employees_count: organization.employees_count,
      annual_revenue: organization.annual_revenue,
      currency_code: organization.currency_code,
      lead_source: organization.lead_source,
      lead_score: organization.lead_score,
      parent_org_id: organization.parent_org_id,
      tags: organization.tags ? JSON.parse(organization.tags as string) : null,
      next_follow_up_date: organization.next_follow_up_date ? new Date(organization.next_follow_up_date) : null
    }
  }

  /**
   * Validate individual field for real-time validation
   */
  static async validateField(
    fieldName: keyof OrganizationCreateForm | keyof OrganizationUpdateForm,
    value: any,
    schema: yup.ObjectSchema<any>
  ): Promise<string | null> {
    try {
      await schema.validateAt(String(fieldName), { [fieldName]: value })
      return null
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        return error.message
      }
      return 'Validation failed'
    }
  }

  /**
   * Validate business rules for organization
   */
  static validateBusinessRules(data: OrganizationCreateForm | OrganizationUpdateForm): OrganizationValidationError[] {
    const errors: OrganizationValidationError[] = []

    // Employee count vs company size validation
    if (data.employees_count && data.size) {
      const employeeCount = data.employees_count
      const size = data.size

      if (size === 'Startup' && employeeCount > 50) {
        errors.push({
          field: 'employees_count',
          message: 'Startup organizations typically have 50 or fewer employees'
        })
      } else if (size === 'Small' && (employeeCount < 10 || employeeCount > 250)) {
        errors.push({
          field: 'employees_count',
          message: 'Small organizations typically have 10-250 employees'
        })
      } else if (size === 'Medium' && (employeeCount < 250 || employeeCount > 1000)) {
        errors.push({
          field: 'employees_count',
          message: 'Medium organizations typically have 250-1000 employees'
        })
      } else if (size === 'Large' && (employeeCount < 1000 || employeeCount > 10000)) {
        errors.push({
          field: 'employees_count',
          message: 'Large organizations typically have 1000-10000 employees'
        })
      } else if (size === 'Enterprise' && employeeCount < 10000) {
        errors.push({
          field: 'employees_count',
          message: 'Enterprise organizations typically have 10000+ employees'
        })
      }
    }

    // Revenue validation
    if (data.annual_revenue && data.annual_revenue < 0) {
      errors.push({
        field: 'annual_revenue',
        message: 'Annual revenue cannot be negative'
      })
    }

    // Phone number format validation (basic)
    if (data.primary_phone && data.secondary_phone && data.primary_phone === data.secondary_phone) {
      errors.push({
        field: 'secondary_phone',
        message: 'Secondary phone cannot be the same as primary phone'
      })
    }

    // Lead score validation
    if (data.lead_score !== null && data.lead_score !== undefined) {
      if (data.lead_score < 0 || data.lead_score > 100) {
        errors.push({
          field: 'lead_score',
          message: 'Lead score must be between 0 and 100'
        })
      }
    }

    return errors
  }

  /**
   * Check for duplicate organization by name or website
   */
  static async checkDuplicate(
    data: OrganizationCreateForm,
    existingOrganizations: Organization[]
  ): Promise<OrganizationValidationError[]> {
    const errors: OrganizationValidationError[] = []

    // Check for duplicate name
    const duplicateName = existingOrganizations.find(
      org => org.name.toLowerCase() === data.name.toLowerCase()
    )
    if (duplicateName) {
      errors.push({
        field: 'name',
        message: 'An organization with this name already exists'
      })
    }

    // Check for duplicate website
    if (data.website) {
      const duplicateWebsite = existingOrganizations.find(
        org => org.website && org.website.toLowerCase() === data.website?.toLowerCase()
      )
      if (duplicateWebsite) {
        errors.push({
          field: 'website',
          message: 'An organization with this website already exists'
        })
      }
    }

    // Check for duplicate email
    if (data.email) {
      const duplicateEmail = existingOrganizations.find(
        org => org.email && org.email.toLowerCase() === data.email?.toLowerCase()
      )
      if (duplicateEmail) {
        errors.push({
          field: 'email',
          message: 'An organization with this email already exists'
        })
      }
    }

    return errors
  }
}

/**
 * Field validation helpers for real-time validation
 */
export const organizationFieldValidators = {
  /**
   * Validate organization name
   */
  name: (value: string): string | null => {
    if (!value || !value.trim()) return 'Organization name is required'
    if (value.length > 255) return 'Organization name must be less than 255 characters'
    return null
  },

  /**
   * Validate email field (optional)
   */
  email: (value: string): string | null => {
    if (!value) return null
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    if (!emailRegex.test(value)) return 'Please enter a valid email address'
    if (value.length > 255) return 'Email must be less than 255 characters'
    return null
  },

  /**
   * Validate website URL
   */
  website: (value: string): string | null => {
    if (!value) return null
    const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/
    if (!urlRegex.test(value)) return 'Please enter a valid website URL'
    if (value.length > 255) return 'Website URL must be less than 255 characters'
    return null
  },

  /**
   * Validate phone number
   */
  phone: (value: string): string | null => {
    if (!value) return null
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$|^[+]?[()]?[\d\s\-()]{10,20}$/
    if (!phoneRegex.test(value)) return 'Please enter a valid phone number'
    if (value.length > 50) return 'Phone number must be less than 50 characters'
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
   * Validate required text field
   */
  requiredText: (value: string, fieldName: string, maxLength = 255): string | null => {
    if (!value || !value.trim()) return `${fieldName} is required`
    if (value.length > maxLength) return `${fieldName} must be less than ${maxLength} characters`
    return null
  },

  /**
   * Validate numeric field
   */
  number: (value: number | null, fieldName: string, min = 0, max = Number.MAX_SAFE_INTEGER): string | null => {
    if (value === null || value === undefined) return null
    if (isNaN(value)) return `${fieldName} must be a valid number`
    if (value < min) return `${fieldName} cannot be less than ${min}`
    if (value > max) return `${fieldName} cannot be greater than ${max}`
    return null
  },

  /**
   * Validate lead score
   */
  leadScore: (value: number | null): string | null => {
    if (value === null || value === undefined) return null
    if (isNaN(value)) return 'Lead score must be a valid number'
    if (value < 0) return 'Lead score cannot be negative'
    if (value > 100) return 'Lead score cannot exceed 100'
    return null
  },

  /**
   * Validate founded year
   */
  foundedYear: (value: number | null): string | null => {
    if (value === null || value === undefined) return null
    if (isNaN(value)) return 'Founded year must be a valid number'
    if (value < 1800) return 'Founded year must be after 1800'
    if (value > new Date().getFullYear()) return 'Founded year cannot be in the future'
    return null
  },

  /**
   * Validate currency code
   */
  currencyCode: (value: string): string | null => {
    if (!value) return null
    if (value.length !== 3) return 'Currency code must be exactly 3 characters'
    if (!/^[A-Z]{3}$/.test(value)) return 'Currency code must be 3 uppercase letters'
    return null
  }
}

/**
 * Organization utility functions
 */
export const organizationUtils = {
  /**
   * Get organization display name
   */
  getDisplayName: (organization: Organization): string => {
    return organization.legal_name || organization.name
  },

  /**
   * Get organization location string
   */
  getLocation: (organization: Organization): string => {
    const parts = [organization.city, organization.state_province, organization.country]
      .filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : 'Location not specified'
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
   * Format revenue for display
   */
  formatRevenue: (revenue: number | null, currencyCode?: string | null): string => {
    if (revenue === null || revenue === undefined) return 'Not specified'
    
    const currency = currencyCode || 'USD'
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })
    
    return formatter.format(revenue)
  },

  /**
   * Format employee count for display
   */
  formatEmployeeCount: (count: number | null): string => {
    if (count === null || count === undefined) return 'Not specified'
    
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    
    return count.toString()
  },

  /**
   * Get lead score color class
   */
  getLeadScoreColor: (score: number | null): string => {
    if (score === null || score === undefined) return 'text-gray-400'
    
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  },

  /**
   * Get status color class
   */
  getStatusColor: (status: OrganizationStatus | null): string => {
    switch (status) {
      case 'Active': return 'text-green-600 bg-green-100'
      case 'Customer': return 'text-blue-600 bg-blue-100'
      case 'Partner': return 'text-purple-600 bg-purple-100'
      case 'Prospect': return 'text-yellow-600 bg-yellow-100'
      case 'Vendor': return 'text-indigo-600 bg-indigo-100'
      case 'Inactive': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  },

  /**
   * Get organization initials for avatar
   */
  getInitials: (organization: Organization): string => {
    const name = organization.name.trim()
    const words = name.split(' ')
    
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase()
    }
    
    return words
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('')
  },

  /**
   * Parse tags from JSON
   */
  parseTags: (tags: any): string[] => {
    if (!tags) return []
    if (typeof tags === 'string') {
      try {
        return JSON.parse(tags)
      } catch {
        return []
      }
    }
    if (Array.isArray(tags)) return tags
    return []
  },

  /**
   * Format creation date
   */
  formatCreatedDate: (organization: Organization): string => {
    if (!organization.created_at) return 'Unknown'
    
    const date = new Date(organization.created_at)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  },

  /**
   * Calculate organization age in years
   */
  getOrganizationAge: (organization: Organization): number | null => {
    if (!organization.founded_year) return null
    
    const currentYear = new Date().getFullYear()
    return currentYear - organization.founded_year
  }
}