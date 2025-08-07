// =============================================================================  
// Interaction Form Validation & Schema Definitions
// =============================================================================
// This file provides comprehensive form validation schemas for the interactions
// system using Yup validation following opportunity system patterns.
//
// Stage 2.2: Form Validation Schema Implementation
// Architecture Reference: src/types/opportunities.ts validation patterns
// Mobile Optimization: Optimized validation messages for mobile UX
// =============================================================================

import * as yup from 'yup'
import { 
  InteractionType, 
  InteractionStatus, 
  InteractionOutcome,
  InteractionFormData,
  INTERACTION_TYPES,
  INTERACTION_STATUSES,
  INTERACTION_OUTCOMES
} from './interactions'

// =============================================================================
// Core Form Validation Schemas
// =============================================================================

/**
 * Base interaction validation schema following opportunity patterns
 * Includes all required fields with comprehensive validation rules
 */
export const interactionValidationSchema = yup.object({
  // Required core fields (matching database constraints)
  interaction_type: yup
    .string()
    .required('Interaction type is required')
    .oneOf(
      INTERACTION_TYPES.map(t => t.value), 
      'Please select a valid interaction type'
    ) as yup.StringSchema<InteractionType>,

  subject: yup
    .string()
    .required('Subject is required')
    .min(3, 'Subject must be at least 3 characters')
    .max(500, 'Subject must be less than 500 characters')
    .trim(),

  date: yup
    .string()
    .required('Interaction date is required')
    .test('valid-date', 'Please enter a valid date', function(value) {
      if (!value) return false
      const date = new Date(value)
      return !isNaN(date.getTime())
    })
    .test('reasonable-date', 'Date should be within reasonable range', function(value) {
      if (!value) return false
      const date = new Date(value)
      const twoYearsAgo = new Date()
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
      const oneYearFromNow = new Date()
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
      return date >= twoYearsAgo && date <= oneYearFromNow
    }),

  // Optional relationship fields
  opportunity_id: yup
    .string()
    .uuid('Invalid opportunity reference')
    .nullable(),

  contact_id: yup
    .string()
    .uuid('Invalid contact reference')
    .nullable(),

  // Status and outcome validation
  status: yup
    .string()
    .oneOf(
      INTERACTION_STATUSES.map(s => s.value), 
      'Please select a valid status'
    )
    .default('SCHEDULED') as yup.StringSchema<InteractionStatus>,

  outcome: yup
    .string()
    .oneOf([
      ...INTERACTION_OUTCOMES.map(o => o.value),
      '' // Allow empty string for null handling
    ], 'Please select a valid outcome')
    .nullable() as yup.StringSchema<InteractionOutcome | null>,

  // Enhanced detail fields
  notes: yup
    .string()
    .max(2000, 'Notes must be less than 2000 characters')
    .nullable(),

  duration_minutes: yup
    .number()
    .min(1, 'Duration must be at least 1 minute')
    .max(480, 'Duration cannot exceed 8 hours (480 minutes)')
    .integer('Duration must be a whole number')
    .nullable(),

  location: yup
    .string()
    .max(255, 'Location must be less than 255 characters')
    .nullable(),

  rating: yup
    .number()
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5')
    .integer('Rating must be a whole number')
    .nullable(),

  next_action: yup
    .string()
    .max(500, 'Next action must be less than 500 characters')
    .nullable(),

  contact_method: yup
    .string()
    .max(100, 'Contact method must be less than 100 characters')
    .nullable(),

  // Follow-up validation with conditional logic
  follow_up_needed: yup
    .boolean()
    .default(false),

  follow_up_date: yup
    .string()
    .nullable()
    .when('follow_up_needed', {
      is: true,
      then: (schema) => schema
        .required('Follow-up date is required when follow-up is needed')
        .test('future-date', 'Follow-up date must be in the future', function(value) {
          if (!value) return false
          const followUpDate = new Date(value)
          const now = new Date()
          return followUpDate > now
        }),
      otherwise: (schema) => schema.nullable()
    }),

  follow_up_notes: yup
    .string()
    .max(1000, 'Follow-up notes must be less than 1000 characters')
    .when('follow_up_needed', {
      is: true,
      then: (schema) => schema.nullable(),
      otherwise: (schema) => schema.nullable()
    }),

  // Array fields for participants and tags
  participants: yup
    .array(yup.string().max(100, 'Participant name too long'))
    .max(10, 'Cannot have more than 10 participants')
    .default([]),

  tags: yup
    .array(yup.string().max(50, 'Tag too long'))
    .max(20, 'Cannot have more than 20 tags')
    .default([])
})

/**
 * Quick interaction schema for mobile-optimized forms
 * Reduced required fields for rapid entry scenarios
 */
export const quickInteractionSchema = yup.object({
  interaction_type: yup
    .string()
    .required('Type required')
    .oneOf(INTERACTION_TYPES.map(t => t.value), 'Invalid type') as yup.StringSchema<InteractionType>,

  subject: yup
    .string()
    .required('Subject required')
    .min(3, 'Subject too short')
    .max(500, 'Subject too long')
    .trim(),

  date: yup
    .string()
    .required('Date required')
    .test('valid-date', 'Invalid date', function(value) {
      if (!value) return false
      const date = new Date(value)
      return !isNaN(date.getTime())
    }),

  opportunity_id: yup
    .string()
    .uuid('Invalid opportunity')
    .nullable(),

  status: yup
    .string()
    .oneOf(INTERACTION_STATUSES.map(s => s.value), 'Invalid status')
    .default('COMPLETED') as yup.StringSchema<InteractionStatus>,

  notes: yup
    .string()
    .max(500, 'Notes too long')
    .nullable(),

  follow_up_needed: yup
    .boolean()
    .default(false)
})

/**
 * Follow-up scheduling schema for dedicated follow-up forms
 */
export const followUpSchedulingSchema = yup.object({
  follow_up_date: yup
    .string()
    .required('Follow-up date is required')
    .test('future-date', 'Must be a future date', function(value) {
      if (!value) return false
      const followUpDate = new Date(value)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      return followUpDate >= tomorrow
    }),

  follow_up_notes: yup
    .string()
    .required('Follow-up notes are required')
    .min(10, 'Please provide more details (at least 10 characters)')
    .max(1000, 'Follow-up notes must be less than 1000 characters'),

  next_action: yup
    .string()
    .required('Next action is required')
    .min(5, 'Please describe the next action (at least 5 characters)')
    .max(500, 'Next action must be less than 500 characters'),

  reminder_days_before: yup
    .number()
    .min(0, 'Reminder days cannot be negative')
    .max(30, 'Reminder cannot be more than 30 days before')
    .integer('Must be a whole number')
    .default(1)
})

/**
 * Interaction completion schema for updating completed interactions
 */
export const interactionCompletionSchema = yup.object({
  outcome: yup
    .string()
    .required('Outcome is required for completed interactions')
    .oneOf(INTERACTION_OUTCOMES.map(o => o.value), 'Invalid outcome') as yup.StringSchema<InteractionOutcome>,

  rating: yup
    .number()
    .required('Rating is required for completed interactions')
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5')
    .integer('Rating must be a whole number'),

  duration_minutes: yup
    .number()
    .min(1, 'Duration must be at least 1 minute')
    .max(480, 'Duration cannot exceed 8 hours')
    .integer('Duration must be a whole number')
    .nullable(),

  notes: yup
    .string()
    .required('Notes are required for completed interactions')
    .min(20, 'Please provide detailed notes (at least 20 characters)')
    .max(2000, 'Notes must be less than 2000 characters'),

  follow_up_needed: yup
    .boolean()
    .default(false),

  follow_up_date: yup
    .string()
    .nullable()
    .when('follow_up_needed', {
      is: true,
      then: (schema) => schema
        .required('Follow-up date is required')
        .test('future-date', 'Follow-up date must be in the future', function(value) {
          if (!value) return false
          const followUpDate = new Date(value)
          const now = new Date()
          return followUpDate > now
        }),
      otherwise: (schema) => schema.nullable()
    }),

  next_action: yup
    .string()
    .when('follow_up_needed', {
      is: true,
      then: (schema) => schema
        .required('Next action is required when follow-up is needed')
        .min(5, 'Please describe the next action')
        .max(500, 'Next action too long'),
      otherwise: (schema) => schema.nullable()
    })
})

/**
 * Bulk interaction creation schema for batch operations
 */
export const bulkInteractionSchema = yup.object({
  interaction_type: yup
    .string()
    .required('Interaction type is required')
    .oneOf(INTERACTION_TYPES.map(t => t.value), 'Invalid interaction type') as yup.StringSchema<InteractionType>,

  subject_template: yup
    .string()
    .required('Subject template is required')
    .min(3, 'Subject template too short')
    .max(500, 'Subject template too long'),

  opportunity_ids: yup
    .array(yup.string().uuid('Invalid opportunity ID'))
    .min(1, 'Select at least one opportunity')
    .max(50, 'Cannot create more than 50 interactions at once')
    .required('Opportunity selection is required'),

  date: yup
    .string()
    .required('Date is required'),

  status: yup
    .string()
    .oneOf(INTERACTION_STATUSES.map(s => s.value), 'Invalid status')
    .default('SCHEDULED') as yup.StringSchema<InteractionStatus>,

  notes_template: yup
    .string()
    .max(1000, 'Notes template too long')
    .nullable(),

  default_duration: yup
    .number()
    .min(1, 'Duration must be at least 1 minute')
    .max(480, 'Duration cannot exceed 8 hours')
    .integer('Duration must be a whole number')
    .nullable()
})

// =============================================================================
// Type Inference from Validation Schemas
// =============================================================================

export type InteractionFormValidation = yup.InferType<typeof interactionValidationSchema>
export type QuickInteractionFormValidation = yup.InferType<typeof quickInteractionSchema>
export type FollowUpSchedulingValidation = yup.InferType<typeof followUpSchedulingSchema>
export type InteractionCompletionValidation = yup.InferType<typeof interactionCompletionSchema>
export type BulkInteractionValidation = yup.InferType<typeof bulkInteractionSchema>

// =============================================================================
// Form Data Interfaces with Validation
// =============================================================================

/**
 * Complete interaction form data interface
 */
export interface InteractionFormComplete extends InteractionFormData {
  // Form-specific UI state
  is_quick_entry?: boolean
  template_id?: string
  auto_schedule_follow_up?: boolean
  send_calendar_invite?: boolean
  notify_participants?: boolean
}

/**
 * Quick interaction form for mobile optimization
 */
export interface QuickInteractionForm {
  interaction_type: InteractionType
  subject: string
  date: string
  opportunity_id?: string
  contact_id?: string
  status: InteractionStatus
  notes?: string
  follow_up_needed: boolean
}

/**
 * Follow-up specific form data
 */
export interface FollowUpForm {
  follow_up_date: string
  follow_up_notes: string
  next_action: string
  reminder_days_before: number
}

/**
 * Interaction completion form data
 */
export interface InteractionCompletionForm {
  outcome: InteractionOutcome
  rating: number
  duration_minutes?: number
  notes: string
  follow_up_needed: boolean
  follow_up_date?: string
  next_action?: string
}

/**
 * Bulk interaction creation form
 */
export interface BulkInteractionForm {
  interaction_type: InteractionType
  subject_template: string
  opportunity_ids: string[]
  date: string
  status: InteractionStatus
  notes_template?: string
  default_duration?: number
}

// =============================================================================
// Mobile-Optimized Validation Messages
// =============================================================================

/**
 * Mobile-optimized error messages for better UX on small screens
 */
export const MOBILE_VALIDATION_MESSAGES = {
  REQUIRED: {
    type: 'Type required',
    subject: 'Subject required',
    date: 'Date required',
    opportunity: 'Select opportunity',
    outcome: 'Outcome required',
    rating: 'Rating required',
    notes: 'Notes required',
    follow_up_date: 'Follow-up date needed',
    next_action: 'Next action needed'
  },
  
  TOO_SHORT: {
    subject: 'Subject too short',
    notes: 'Add more details',
    follow_up_notes: 'More details needed',
    next_action: 'Describe action'
  },
  
  TOO_LONG: {
    subject: 'Subject too long',
    notes: 'Notes too long',
    location: 'Location too long',
    next_action: 'Action too long'
  },
  
  INVALID: {
    date: 'Invalid date',
    future_date: 'Must be future date',
    rating: 'Rating 1-5 only',
    duration: 'Check duration',
    opportunity: 'Invalid opportunity',
    contact: 'Invalid contact'
  },
  
  LIMITS: {
    participants: 'Max 10 participants',
    tags: 'Max 20 tags',
    bulk_opportunities: 'Max 50 at once',
    duration_max: 'Max 8 hours',
    reminder_days: 'Max 30 day reminder'
  }
} as const

/**
 * Context-aware validation message provider
 */
export const getValidationMessage = (
  field: string, 
  type: 'required' | 'too_short' | 'too_long' | 'invalid' | 'limits',
  isMobile: boolean = false
): string => {
  if (isMobile && field in MOBILE_VALIDATION_MESSAGES[type.toUpperCase() as keyof typeof MOBILE_VALIDATION_MESSAGES]) {
    return MOBILE_VALIDATION_MESSAGES[type.toUpperCase() as keyof typeof MOBILE_VALIDATION_MESSAGES][field as keyof typeof MOBILE_VALIDATION_MESSAGES.REQUIRED] || `${field} ${type}`
  }
  
  // Fallback to standard messages for desktop
  const standardMessages = {
    required: `${field} is required`,
    too_short: `${field} is too short`,
    too_long: `${field} is too long`,
    invalid: `Invalid ${field}`,
    limits: `${field} exceeds limits`
  }
  
  return standardMessages[type] || `${field} ${type}`
}

// =============================================================================
// Conditional Validation Helpers
// =============================================================================

/**
 * Validates follow-up date based on interaction status and follow-up requirement
 */
export const validateFollowUpDate = (
  followUpNeeded: boolean, 
  followUpDate?: string | null,
  currentDate: Date = new Date()
): { isValid: boolean; message?: string } => {
  if (!followUpNeeded) {
    return { isValid: true }
  }

  if (!followUpDate) {
    return { 
      isValid: false, 
      message: 'Follow-up date is required when follow-up is needed' 
    }
  }

  const followUp = new Date(followUpDate)
  if (isNaN(followUp.getTime())) {
    return { 
      isValid: false, 
      message: 'Invalid follow-up date' 
    }
  }

  if (followUp <= currentDate) {
    return { 
      isValid: false, 
      message: 'Follow-up date must be in the future' 
    }
  }

  return { isValid: true }
}

/**
 * Validates interaction completion requirements
 */
export const validateInteractionCompletion = (
  status: InteractionStatus,
  outcome?: InteractionOutcome | null,
  rating?: number | null,
  notes?: string | null
): { isValid: boolean; messages: string[] } => {
  const messages: string[] = []

  if (status === 'COMPLETED') {
    if (!outcome) {
      messages.push('Outcome is required for completed interactions')
    }
    
    if (!rating || rating < 1 || rating > 5) {
      messages.push('Rating (1-5) is required for completed interactions')
    }
    
    if (!notes || notes.trim().length < 20) {
      messages.push('Detailed notes are required for completed interactions')
    }
  }

  return {
    isValid: messages.length === 0,
    messages
  }
}

/**
 * Validates interaction type compatibility with opportunity context
 */
export const validateInteractionTypeCompatibility = (
  interactionType: InteractionType,
  opportunityContext?: string | null
): { isValid: boolean; warning?: string } => {
  // Define type-context compatibility rules
  const compatibilityRules: Record<string, InteractionType[]> = {
    'Food Show': ['Email', 'Phone', 'Meeting', 'Event'],
    'Site Visit': ['Meeting', 'Demo', 'Other'],
    'Demo Request': ['Demo', 'Phone', 'Email', 'Other'],
    'Sampling': ['Event', 'Phone', 'Email', 'Other']
  }

  if (!opportunityContext || !compatibilityRules[opportunityContext]) {
    return { isValid: true }
  }

  const compatibleTypes = compatibilityRules[opportunityContext]
  if (!compatibleTypes.includes(interactionType)) {
    return {
      isValid: true, // Not blocking, just a warning
      warning: `${interactionType} interactions are uncommon for ${opportunityContext} opportunities`
    }
  }

  return { isValid: true }
}

// =============================================================================
// Form State Management Helpers
// =============================================================================

/**
 * Default form values for new interactions
 */
export const getDefaultInteractionFormValues = (
  opportunityId?: string,
  contactId?: string,
  interactionType: InteractionType = 'Phone'
): Partial<InteractionFormData> => ({
  interaction_type: interactionType,
  subject: '',
  date: new Date().toISOString().slice(0, 16), // Format for datetime-local input
  opportunity_id: opportunityId || '',
  contact_id: contactId || '',
  status: 'SCHEDULED',
  outcome: null,
  notes: '',
  duration_minutes: null,
  location: '',
  rating: null,
  follow_up_needed: false,
  follow_up_date: '',
  follow_up_notes: '',
  next_action: '',
  contact_method: '',
  participants: [],
  tags: []
})

/**
 * Get quick interaction defaults based on template
 */
export const getQuickInteractionDefaults = (
  templateId?: string,
  opportunityId?: string
): Partial<QuickInteractionForm> => {
  const baseDefaults = {
    interaction_type: 'Phone' as InteractionType,
    subject: '',
    date: new Date().toISOString().slice(0, 16),
    opportunity_id: opportunityId || '',
    status: 'COMPLETED' as InteractionStatus,
    notes: '',
    follow_up_needed: false
  }

  // Apply template-specific defaults if available
  const templateDefaults: Record<string, Partial<QuickInteractionForm>> = {
    'sample-drop': {
      interaction_type: 'Event',
      subject: 'Product samples delivered',
      notes: 'Product samples delivered for evaluation'
    },
    'quick-call': {
      interaction_type: 'Phone',
      subject: 'Brief phone conversation',
      notes: 'Brief phone conversation'
    },
    'product-demo': {
      interaction_type: 'Demo',
      subject: 'Product demonstration',
      notes: 'Product demonstration session'
    },
    'follow-up': {
      interaction_type: 'Other',
      subject: 'Follow-up contact',
      notes: 'Follow-up on previous interaction'
    }
  }

  if (templateId && templateDefaults[templateId]) {
    return { ...baseDefaults, ...templateDefaults[templateId] }
  }

  return baseDefaults
}

// =============================================================================
// Export All Validation Schemas and Types
// =============================================================================

export {
  interactionValidationSchema,
  quickInteractionSchema,
  followUpSchedulingSchema,
  interactionCompletionSchema,
  bulkInteractionSchema
}