import * as yup from 'yup'
import type { InteractionTypeDB, Interaction, InteractionInsert, InteractionUpdate } from './database.types'

/**
 * Interaction Type Enum - Simplified types matching database schema
 * Aligns with Task 1.1 requirements for MVP Safety Checkpoint #1
 */
export enum InteractionType {
  EMAIL = 'EMAIL',
  CALL = 'CALL',
  IN_PERSON = 'IN_PERSON',
  DEMO = 'DEMO',
  FOLLOW_UP = 'FOLLOW_UP'
}

/**
 * Base Interaction interface matching simplified database schema
 * Following opportunity architecture patterns exactly
 */
export interface InteractionMvp {
  id: string
  interaction_type: InteractionType
  date: string
  subject: string
  notes: string | null
  opportunity_id: string | null
  contact_id: string | null
  created_by: string | null
  follow_up_needed: boolean
  follow_up_date: string | null
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
}

/**
 * Interaction insert interface for creating new interactions
 * Following opportunity insert patterns
 */
export interface InteractionInsertMvp {
  interaction_type: InteractionType
  date: string
  subject: string
  notes?: string | null
  opportunity_id?: string | null
  contact_id?: string | null
  created_by?: string | null
  follow_up_needed?: boolean
  follow_up_date?: string | null
}

/**
 * Interaction update interface for editing interactions
 * Following opportunity update patterns
 */
export interface InteractionUpdateMvp {
  interaction_type?: InteractionType
  date?: string
  subject?: string
  notes?: string | null
  opportunity_id?: string | null
  contact_id?: string | null
  created_by?: string | null
  follow_up_needed?: boolean
  follow_up_date?: string | null
}

/**
 * Form data interface for interaction creation/editing
 * Simplified for MVP requirements
 */
export interface InteractionFormDataMvp {
  interaction_type: InteractionType
  date: string
  subject: string
  notes: string | null
  opportunity_id: string | null
  contact_id: string | null
  follow_up_needed: boolean
  follow_up_date: string | null
}

/**
 * Enhanced interaction with related data for list views
 * Following opportunity list view patterns
 */
export interface InteractionListViewMvp {
  id: string
  interaction_type: InteractionType
  date: string
  subject: string
  notes: string | null
  follow_up_needed: boolean
  follow_up_date: string | null
  created_at: string | null
  updated_at: string | null
  
  // Related organization data
  organization_name: string | null
  
  // Related opportunity data
  opportunity_name: string | null
  opportunity_stage: string | null
  
  // Related contact data
  contact_name: string | null
  contact_position: string | null
  
  // Calculated fields
  days_since_interaction: number
  days_until_follow_up: number | null
  is_overdue_follow_up: boolean
}

/**
 * Comprehensive interaction with all related data for detail views
 * Following opportunity detail view patterns
 */
export interface InteractionDetailViewMvp extends InteractionListViewMvp {
  created_by: string | null
  deleted_at: string | null
  
  // Full opportunity details
  opportunity_id: string | null
  opportunity_probability: number | null
  opportunity_expected_close: string | null
  
  // Full contact details
  contact_id: string | null
  contact_email: string | null
  contact_phone: string | null
  
  // Activity context
  related_interactions_count: number
}

/**
 * Yup validation schema for interaction forms
 * Following opportunity validation patterns
 */
export const interactionValidationSchemaMvp = yup.object({
  interaction_type: yup
    .string()
    .required('Interaction type is required')
    .oneOf(Object.values(InteractionType), 'Invalid interaction type'),
    
  date: yup
    .string()
    .required('Date is required')
    .test('valid-date', 'Invalid date format', function(value) {
      return value ? !isNaN(Date.parse(value)) : false
    })
    .test('not-future', 'Date cannot be more than 1 day in the future', function(value) {
      if (!value) return false
      const inputDate = new Date(value)
      const maxDate = new Date()
      maxDate.setDate(maxDate.getDate() + 1) // Allow 1 day in future for timezone adjustments
      return inputDate <= maxDate
    }),
    
  subject: yup
    .string()
    .required('Subject is required')
    .min(1, 'Subject must not be empty')
    .max(255, 'Subject must be less than 255 characters')
    .test('not-empty-trim', 'Subject cannot be empty', function(value) {
      return value ? value.trim().length > 0 : false
    }),
    
  notes: yup
    .string()
    .max(2000, 'Notes must be less than 2000 characters')
    .nullable(),
    
  opportunity_id: yup
    .string()
    .uuid('Invalid opportunity ID')
    .nullable(),
    
  contact_id: yup
    .string()
    .uuid('Invalid contact ID')
    .nullable(),
    
  follow_up_needed: yup
    .boolean()
    .default(false),
    
  follow_up_date: yup
    .string()
    .nullable()
    .when('follow_up_needed', {
      is: true,
      then: (schema) => schema.nullable(), // Can be null even when needed (to be scheduled later)
      otherwise: (schema) => schema.nullable()
    })
    .test('valid-follow-up-date', 'Follow-up date must be valid', function(value) {
      if (!value) return true // Can be null
      return !isNaN(Date.parse(value))
    })
    .test('future-follow-up', 'Follow-up date should be on or after interaction date', function(value) {
      if (!value || !this.parent.follow_up_needed) return true
      const followUpDate = new Date(value)
      const interactionDate = new Date(this.parent.date)
      
      // Reset times for date comparison
      followUpDate.setHours(0, 0, 0, 0)
      interactionDate.setHours(0, 0, 0, 0)
      
      return followUpDate >= interactionDate
    })
})

/**
 * Type inference from validation schema
 */
export type InteractionFormValidationMvp = yup.InferType<typeof interactionValidationSchemaMvp>

/**
 * Search and filter parameters for MVP
 * Following opportunity filter patterns
 */
export interface InteractionFiltersMvp {
  search?: string
  interaction_type?: InteractionType[]
  opportunity_id?: string
  contact_id?: string
  date_after?: string
  date_before?: string
  follow_up_needed?: boolean
  follow_up_overdue?: boolean
}

/**
 * Pagination parameters following opportunity patterns
 */
export interface InteractionPaginationMvp {
  page: number
  limit: number
  sort_by: string
  sort_order: 'asc' | 'desc'
}

/**
 * API response interface following opportunity patterns
 */
export interface InteractionListResponseMvp {
  interactions: InteractionListViewMvp[]
  total_count: number
  page: number
  limit: number
  has_next: boolean
  has_previous: boolean
}

/**
 * Color coding for interaction types (MVP simplified)
 */
export const INTERACTION_TYPE_COLORS_MVP: { [K in InteractionType]: string } = {
  [InteractionType.EMAIL]: 'purple',
  [InteractionType.CALL]: 'blue',
  [InteractionType.IN_PERSON]: 'green',
  [InteractionType.DEMO]: 'orange',
  [InteractionType.FOLLOW_UP]: 'gray'
}

/**
 * Type mapping between database enum and TypeScript enum
 */
export const mapDatabaseToTypeScript = (dbType: InteractionTypeDB): InteractionType => {
  return dbType as InteractionType
}

export const mapTypeScriptToDatabase = (tsType: InteractionType): InteractionTypeDB => {
  return tsType as InteractionTypeDB
}

/**
 * Utility function to check if follow-up is overdue
 */
export const isFollowUpOverdue = (interaction: InteractionMvp): boolean => {
  if (!interaction.follow_up_needed || !interaction.follow_up_date) {
    return false
  }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const followUpDate = new Date(interaction.follow_up_date)
  followUpDate.setHours(0, 0, 0, 0)
  
  return followUpDate < today
}

/**
 * Utility function to calculate days since interaction
 */
export const daysSinceInteraction = (interactionDate: string): number => {
  const today = new Date()
  const interaction = new Date(interactionDate)
  const diffTime = Math.abs(today.getTime() - interaction.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Utility function to calculate days until follow-up
 */
export const daysUntilFollowUp = (followUpDate: string | null): number | null => {
  if (!followUpDate) return null
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const followUp = new Date(followUpDate)
  followUp.setHours(0, 0, 0, 0)
  
  const diffTime = followUp.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}