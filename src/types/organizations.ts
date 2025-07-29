/**
 * Organization validation schemas and form types
 * Uses Yup for schema validation with TypeScript inference
 * Follows established patterns from contacts.ts
 */

import * as yup from 'yup'
import type {
  Organization,
  OrganizationInsert,
  OrganizationUpdate,
  OrganizationInteraction,
  OrganizationInteractionInsert,
  OrganizationDocument,
  OrganizationDocumentInsert,
  OrganizationAnalytics,
  OrganizationSummaryAnalytics,
  MonthlyOrganizationPerformance,
  OrganizationLeadScoring,
  OrganizationType,
  OrganizationSize,
  OrganizationStatus,
  InteractionType,
  InteractionDirection
} from './database.types'

// Re-export types for external use
export type {
  Organization,
  OrganizationInsert,
  OrganizationUpdate,
  OrganizationInteraction,
  OrganizationInteractionInsert,
  OrganizationDocument,
  OrganizationDocumentInsert,
  OrganizationAnalytics,
  OrganizationSummaryAnalytics,
  MonthlyOrganizationPerformance,
  OrganizationLeadScoring,
  OrganizationType,
  OrganizationSize,
  OrganizationStatus,
  InteractionType,
  InteractionDirection
}

/**
 * Validation regex patterns
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
const PHONE_REGEX = /^[+]?[1-9][\d]{0,15}$|^[+]?[()]?[\d\s\-()]{10,20}$/
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/

/**
 * Organization type enums for validation
 */
const ORGANIZATION_TYPES: OrganizationType[] = ['B2B', 'B2C', 'B2B2C', 'Non-Profit', 'Government', 'Other']
const ORGANIZATION_SIZES: OrganizationSize[] = ['Startup', 'Small', 'Medium', 'Large', 'Enterprise']
const ORGANIZATION_STATUSES: OrganizationStatus[] = ['Active', 'Inactive', 'Prospect', 'Customer', 'Partner', 'Vendor']

/**
 * Organization creation validation schema
 */
export const organizationCreateSchema = yup.object({
  name: yup
    .string()
    .required('Organization name is required')
    .min(1, 'Organization name cannot be empty')
    .max(255, 'Organization name must be less than 255 characters')
    .trim(),

  legal_name: yup
    .string()
    .nullable()
    .max(255, 'Legal name must be less than 255 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  description: yup
    .string()
    .nullable()
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  industry: yup
    .string()
    .nullable()
    .max(100, 'Industry must be less than 100 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  type: yup
    .string()
    .nullable()
    .oneOf([...ORGANIZATION_TYPES, null], 'Please select a valid organization type'),

  size: yup
    .string()
    .nullable()
    .oneOf([...ORGANIZATION_SIZES, null], 'Please select a valid organization size'),

  status: yup
    .string()
    .nullable()
    .oneOf([...ORGANIZATION_STATUSES, null], 'Please select a valid organization status')
    .default('Prospect'),

  website: yup
    .string()
    .nullable()
    .matches(URL_REGEX, 'Please enter a valid website URL')
    .max(255, 'Website URL must be less than 255 characters')
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

  primary_phone: yup
    .string()
    .nullable()
    .matches(PHONE_REGEX, 'Please enter a valid phone number')
    .max(50, 'Phone number must be less than 50 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  secondary_phone: yup
    .string()
    .nullable()
    .matches(PHONE_REGEX, 'Please enter a valid phone number')
    .max(50, 'Phone number must be less than 50 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  address_line_1: yup
    .string()
    .nullable()
    .max(255, 'Address line 1 must be less than 255 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  address_line_2: yup
    .string()
    .nullable()
    .max(255, 'Address line 2 must be less than 255 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  city: yup
    .string()
    .nullable()
    .max(100, 'City must be less than 100 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  state_province: yup
    .string()
    .nullable()
    .max(100, 'State/Province must be less than 100 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  postal_code: yup
    .string()
    .nullable()
    .max(20, 'Postal code must be less than 20 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  country: yup
    .string()
    .nullable()
    .max(100, 'Country must be less than 100 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  founded_year: yup
    .number()
    .nullable()
    .min(1800, 'Founded year must be after 1800')
    .max(new Date().getFullYear(), 'Founded year cannot be in the future')
    .integer('Founded year must be a whole number')
    .transform((value) => isNaN(value) ? null : value),

  employees_count: yup
    .number()
    .nullable()
    .min(0, 'Employee count cannot be negative')
    .max(10000000, 'Employee count seems too large')
    .integer('Employee count must be a whole number')
    .transform((value) => isNaN(value) ? null : value),

  annual_revenue: yup
    .number()
    .nullable()
    .min(0, 'Annual revenue cannot be negative')
    .max(1000000000000, 'Annual revenue seems too large')
    .transform((value) => isNaN(value) ? null : value),

  currency_code: yup
    .string()
    .nullable()
    .length(3, 'Currency code must be exactly 3 characters')
    .uppercase()
    .trim()
    .transform((value) => value === '' ? null : value),

  lead_source: yup
    .string()
    .nullable()
    .max(100, 'Lead source must be less than 100 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  lead_score: yup
    .number()
    .nullable()
    .min(0, 'Lead score cannot be negative')
    .max(100, 'Lead score cannot exceed 100')
    .transform((value) => isNaN(value) ? null : value),

  parent_org_id: yup
    .string()
    .nullable()
    .uuid('Parent organization ID must be a valid UUID')
    .transform((value) => value === '' ? null : value),

  tags: yup
    .array()
    .nullable()
    .of(yup.string().trim()),

  next_follow_up_date: yup
    .date()
    .nullable()
    .min(new Date(), 'Follow-up date cannot be in the past')
    .transform((value) => {
      if (!value || value === '') return null
      const date = new Date(value as string)
      return isNaN(date.getTime()) ? null : date
    })
})

/**
 * Organization update validation schema (all fields optional)
 */
export const organizationUpdateSchema = yup.object({
  name: yup
    .string()
    .min(1, 'Organization name cannot be empty')
    .max(255, 'Organization name must be less than 255 characters')
    .trim(),

  legal_name: yup
    .string()
    .nullable()
    .max(255, 'Legal name must be less than 255 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  description: yup
    .string()
    .nullable()
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  industry: yup
    .string()
    .nullable()
    .max(100, 'Industry must be less than 100 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  type: yup
    .string()
    .nullable()
    .oneOf([...ORGANIZATION_TYPES, null], 'Please select a valid organization type'),

  size: yup
    .string()
    .nullable()
    .oneOf([...ORGANIZATION_SIZES, null], 'Please select a valid organization size'),

  status: yup
    .string()
    .nullable()
    .oneOf([...ORGANIZATION_STATUSES, null], 'Please select a valid organization status'),

  website: yup
    .string()
    .nullable()
    .matches(URL_REGEX, 'Please enter a valid website URL')
    .max(255, 'Website URL must be less than 255 characters')
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

  primary_phone: yup
    .string()
    .nullable()
    .matches(PHONE_REGEX, 'Please enter a valid phone number')
    .max(50, 'Phone number must be less than 50 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  secondary_phone: yup
    .string()
    .nullable()
    .matches(PHONE_REGEX, 'Please enter a valid phone number')
    .max(50, 'Phone number must be less than 50 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  address_line_1: yup
    .string()
    .nullable()
    .max(255, 'Address line 1 must be less than 255 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  address_line_2: yup
    .string()
    .nullable()
    .max(255, 'Address line 2 must be less than 255 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  city: yup
    .string()
    .nullable()
    .max(100, 'City must be less than 100 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  state_province: yup
    .string()
    .nullable()
    .max(100, 'State/Province must be less than 100 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  postal_code: yup
    .string()
    .nullable()
    .max(20, 'Postal code must be less than 20 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  country: yup
    .string()
    .nullable()
    .max(100, 'Country must be less than 100 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  founded_year: yup
    .number()
    .nullable()
    .min(1800, 'Founded year must be after 1800')
    .max(new Date().getFullYear(), 'Founded year cannot be in the future')
    .integer('Founded year must be a whole number')
    .transform((value) => isNaN(value) ? null : value),

  employees_count: yup
    .number()
    .nullable()
    .min(0, 'Employee count cannot be negative')
    .max(10000000, 'Employee count seems too large')
    .integer('Employee count must be a whole number')
    .transform((value) => isNaN(value) ? null : value),

  annual_revenue: yup
    .number()
    .nullable()
    .min(0, 'Annual revenue cannot be negative')
    .max(1000000000000, 'Annual revenue seems too large')
    .transform((value) => isNaN(value) ? null : value),

  currency_code: yup
    .string()
    .nullable()
    .length(3, 'Currency code must be exactly 3 characters')
    .uppercase()
    .trim()
    .transform((value) => value === '' ? null : value),

  lead_source: yup
    .string()
    .nullable()
    .max(100, 'Lead source must be less than 100 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  lead_score: yup
    .number()
    .nullable()
    .min(0, 'Lead score cannot be negative')
    .max(100, 'Lead score cannot exceed 100')
    .transform((value) => isNaN(value) ? null : value),

  parent_org_id: yup
    .string()
    .nullable()
    .uuid('Parent organization ID must be a valid UUID')
    .transform((value) => value === '' ? null : value),

  tags: yup
    .array()
    .nullable()
    .of(yup.string().trim()),

  next_follow_up_date: yup
    .date()
    .nullable()
    .min(new Date(), 'Follow-up date cannot be in the past')
    .transform((value) => {
      if (!value || value === '') return null
      const date = new Date(value as string)
      return isNaN(date.getTime()) ? null : date
    })
})

/**
 * Organization search validation schema
 */
export const organizationSearchSchema = yup.object({
  search: yup
    .string()
    .max(255, 'Search term must be less than 255 characters')
    .trim(),

  industry: yup
    .string()
    .nullable()
    .max(100, 'Industry filter must be less than 100 characters')
    .trim(),

  type: yup
    .string()
    .nullable()
    .oneOf([...ORGANIZATION_TYPES, null], 'Please select a valid organization type'),

  size: yup
    .string()
    .nullable()
    .oneOf([...ORGANIZATION_SIZES, null], 'Please select a valid organization size'),

  status: yup
    .string()
    .nullable()
    .oneOf([...ORGANIZATION_STATUSES, null], 'Please select a valid organization status'),

  country: yup
    .string()
    .nullable()
    .max(100, 'Country filter must be less than 100 characters')
    .trim(),

  min_employees: yup
    .number()
    .nullable()
    .min(0, 'Minimum employees cannot be negative')
    .integer('Minimum employees must be a whole number')
    .transform((value) => isNaN(value) ? null : value),

  max_employees: yup
    .number()
    .nullable()
    .min(0, 'Maximum employees cannot be negative')
    .integer('Maximum employees must be a whole number')
    .transform((value) => isNaN(value) ? null : value),

  min_revenue: yup
    .number()
    .nullable()
    .min(0, 'Minimum revenue cannot be negative')
    .transform((value) => isNaN(value) ? null : value),

  max_revenue: yup
    .number()
    .nullable()
    .min(0, 'Maximum revenue cannot be negative')
    .transform((value) => isNaN(value) ? null : value),

  min_lead_score: yup
    .number()
    .nullable()
    .min(0, 'Minimum lead score cannot be negative')
    .max(100, 'Minimum lead score cannot exceed 100')
    .transform((value) => isNaN(value) ? null : value),

  max_lead_score: yup
    .number()
    .nullable()
    .min(0, 'Maximum lead score cannot be negative')
    .max(100, 'Maximum lead score cannot exceed 100')
    .transform((value) => isNaN(value) ? null : value),

  tags: yup
    .array()
    .nullable()
    .of(yup.string().trim()),

  limit: yup
    .number()
    .positive('Limit must be positive')
    .max(100, 'Limit cannot exceed 100')
    .integer('Limit must be an integer')
    .default(20),

  offset: yup
    .number()
    .min(0, 'Offset cannot be negative')
    .integer('Offset must be an integer')
    .default(0),

  sortBy: yup
    .string()
    .oneOf([
      'name', 'legal_name', 'industry', 'type', 'size', 'status',
      'lead_score', 'employees_count', 'annual_revenue', 'founded_year',
      'created_at', 'updated_at', 'last_contact_date', 'next_follow_up_date'
    ], 'Invalid sort field')
    .default('name'),

  sortOrder: yup
    .string()
    .oneOf(['asc', 'desc'], 'Sort order must be asc or desc')
    .default('asc')
})

/**
 * Organization interaction validation schemas
 */
const INTERACTION_TYPES: InteractionType[] = [
  'Email', 'Phone', 'Meeting', 'Demo', 'Proposal', 'Contract', 
  'Note', 'Task', 'Event', 'Social', 'Website', 'Other'
]
const INTERACTION_DIRECTIONS: InteractionDirection[] = ['Inbound', 'Outbound']

export const organizationInteractionCreateSchema = yup.object({
  organization_id: yup
    .string()
    .required('Organization ID is required')
    .uuid('Organization ID must be a valid UUID'),

  contact_id: yup
    .string()
    .nullable()
    .uuid('Contact ID must be a valid UUID')
    .transform((value) => value === '' ? null : value),

  type: yup
    .string()
    .nullable()
    .oneOf([...INTERACTION_TYPES, null], 'Please select a valid interaction type')
    .default('Note'),

  direction: yup
    .string()
    .nullable()
    .oneOf([...INTERACTION_DIRECTIONS, null], 'Please select a valid direction'),

  subject: yup
    .string()
    .nullable()
    .max(255, 'Subject must be less than 255 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  description: yup
    .string()
    .nullable()
    .max(5000, 'Description must be less than 5000 characters')
    .trim()
    .transform((value) => value === '' ? null : value),

  interaction_date: yup
    .date()
    .nullable()
    .max(new Date(), 'Interaction date cannot be in the future')
    .default(() => new Date())
    .transform((value) => {
      if (!value || value === '') return new Date()
      const date = new Date(value as string)
      return isNaN(date.getTime()) ? new Date() : date
    }),

  duration_minutes: yup
    .number()
    .nullable()
    .min(0, 'Duration cannot be negative')
    .max(1440, 'Duration cannot exceed 24 hours')
    .integer('Duration must be a whole number')
    .transform((value) => isNaN(value) ? null : value),

  tags: yup
    .array()
    .nullable()
    .of(yup.string().trim())
})

/**
 * TypeScript types inferred from Yup schemas
 */
export type OrganizationCreateForm = yup.InferType<typeof organizationCreateSchema>
export type OrganizationUpdateForm = yup.InferType<typeof organizationUpdateSchema>
export type OrganizationSearchForm = yup.InferType<typeof organizationSearchSchema>
export type OrganizationInteractionCreateForm = yup.InferType<typeof organizationInteractionCreateSchema>

/**
 * UI-specific types for organization display
 */
export interface OrganizationListItem {
  id: string
  name: string
  legal_name: string | null
  industry: string | null
  type: OrganizationType | null
  size: OrganizationSize | null
  status: OrganizationStatus | null
  website: string | null
  email: string | null
  primary_phone: string | null
  city: string | null
  country: string | null
  employees_count: number | null
  annual_revenue: number | null
  lead_score: number | null
  contact_count?: number
  last_interaction_date: string | null
  next_follow_up_date: string | null
  created_at: string | null
  updated_at: string | null
}

export interface OrganizationCardData {
  id: string
  name: string
  industry: string | null
  status: OrganizationStatus | null
  lead_score: number | null
  contact_count: number
  last_interaction: string | null
  website: string | null
  location: string | null
  avatar_url?: string
}

export interface OrganizationDetailData extends Organization {
  contact_count: number
  interaction_count: number
  document_count: number
  recent_interactions: Array<{
    id: string
    type: InteractionType | null
    subject: string | null
    interaction_date: string | null
    contact_name?: string
  }>
  analytics_summary?: {
    total_interactions: number
    revenue_generated: number | null
    deals_closed: number | null
    engagement_status: string
  }
}

/**
 * Analytics and dashboard types
 */
export interface OrganizationMetrics {
  total_organizations: number
  active_organizations: number
  prospect_organizations: number
  customer_organizations: number
  partner_organizations: number
  total_revenue: number | null
  average_lead_score: number | null
  organizations_this_month: number
  organizations_this_week: number
}

export interface OrganizationPerformanceData {
  organization_id: string
  organization_name: string
  interaction_count: number
  meeting_count: number
  email_count: number
  phone_count: number
  revenue_generated: number | null
  lead_score_change: number | null
  engagement_trend: 'up' | 'down' | 'stable'
}

export interface LeadScoringData {
  id: string
  name: string
  lead_score: number | null
  lead_temperature: 'hot' | 'warm' | 'cold'
  status: OrganizationStatus | null
  industry: string | null
  size: OrganizationSize | null
  total_interactions: number
  recent_interactions: number
  last_interaction: string | null
  document_count: number
  score_factors: {
    interaction_frequency: number
    engagement_quality: number
    company_size: number
    industry_fit: number
    website_activity: number
  }
}

/**
 * Filter and sorting types
 */
export interface OrganizationFilters {
  search?: string
  industry?: string[]
  type?: OrganizationType[]
  size?: OrganizationSize[]
  status?: OrganizationStatus[]
  country?: string[]
  leadScoreRange?: {
    min: number
    max: number
  }
  employeeRange?: {
    min: number
    max: number
  }
  revenueRange?: {
    min: number
    max: number
  }
  tags?: string[]
  foundedYearRange?: {
    min: number
    max: number
  }
  lastContactDateRange?: {
    start: Date
    end: Date
  }
}

export type OrganizationSortField = 
  | 'name' 
  | 'legal_name' 
  | 'industry' 
  | 'type' 
  | 'size' 
  | 'status'
  | 'lead_score' 
  | 'employees_count' 
  | 'annual_revenue' 
  | 'founded_year'
  | 'created_at' 
  | 'updated_at' 
  | 'last_contact_date' 
  | 'next_follow_up_date'

export type SortOrder = 'asc' | 'desc'

export interface OrganizationSortConfig {
  field: OrganizationSortField
  order: SortOrder
}

/**
 * Pagination types
 */
export interface PaginationConfig {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export interface OrganizationListResponse {
  data: OrganizationListItem[]
  pagination: PaginationConfig
  filters: OrganizationFilters
  sort: OrganizationSortConfig
}

/**
 * Relationship types
 */
export interface OrganizationContactRelation {
  organization_id: string
  contact_id: string
  contact_name: string
  contact_email: string
  contact_title: string | null
  is_primary_contact: boolean
  relationship_type: 'employee' | 'contractor' | 'partner' | 'vendor' | 'client' | 'other'
  created_at: string
}

export interface OrganizationHierarchy {
  id: string
  name: string
  parent_org_id: string | null
  children: OrganizationHierarchy[]
  level: number
  path: string[]
}

/**
 * Form validation helper types (extending from existing patterns)
 */
export interface OrganizationValidationError {
  field: string
  message: string
}

export interface OrganizationFormValidationResult<T> {
  isValid: boolean
  data?: T
  errors: OrganizationValidationError[]
}

/**
 * Multi-step form types for organization creation
 */
export interface OrganizationWizardStep {
  id: string
  title: string
  description: string
  isComplete: boolean
  isActive: boolean
  fields: string[]
}

export interface OrganizationWizardData {
  currentStep: number
  steps: OrganizationWizardStep[]
  formData: Partial<OrganizationCreateForm>
  isValid: boolean
  canProceed: boolean
  canGoBack: boolean
}

/**
 * Bulk operations types
 */
export interface BulkOrganizationOperation {
  type: 'update' | 'delete' | 'export' | 'tag' | 'assign'
  organizationIds: string[]
  data?: Record<string, any>
}

export interface BulkOperationResult {
  success: boolean
  processedCount: number
  errorCount: number
  errors: Array<{
    organizationId: string
    error: string
  }>
}

/**
 * Export types
 */
export type OrganizationExportFormat = 'csv' | 'xlsx' | 'json'

export interface OrganizationExportConfig {
  format: OrganizationExportFormat
  fields: string[]
  filters?: OrganizationFilters
  includeInteractions: boolean
  includeAnalytics: boolean
  dateRange?: {
    start: Date
    end: Date
  }
}