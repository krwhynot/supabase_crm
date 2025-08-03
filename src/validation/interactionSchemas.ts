import * as yup from 'yup'
import { InteractionType } from '@/types/interactions'

/**
 * Base date validation helpers
 */
const validateInteractionDate = (value: string | null | undefined): boolean => {
  if (!value) return false
  const date = new Date(value)
  return !isNaN(date.getTime())
}

const validateNotFutureDate = (value: string | null | undefined): boolean => {
  if (!value) return true
  const interactionDate = new Date(value)
  const today = new Date()
  today.setHours(23, 59, 59, 999) // End of today
  return interactionDate <= today
}

const validateFutureDate = (value: string | null | undefined): boolean => {
  if (!value) return true
  const followUpDate = new Date(value)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return followUpDate >= today
}

const validateFollowUpDateAfterInteractionDate = function(this: yup.TestContext, value: string | null | undefined): boolean {
  if (!value) return true
  const followUpDate = new Date(value)
  const interactionDate = new Date(this.parent.date)
  return followUpDate >= interactionDate
}

/**
 * Business logic validation: Either opportunity or contact must be selected
 */
const validateOpportunityOrContact = function(this: yup.TestContext, value: string | null | undefined): boolean | yup.ValidationError {
  const opportunityId = this.parent.opportunity_id
  const contactId = this.parent.contact_id
  
  // At least one must be provided
  if (!opportunityId && !contactId) {
    return this.createError({
      message: 'Either an opportunity or contact must be selected'
    })
  }
  
  return true
}

/**
 * Comprehensive validation schema for interaction creation
 * Used in full interaction creation forms
 */
export const interactionCreateSchema = yup.object({
  interaction_type: yup
    .string()
    .required('Interaction type is required')
    .oneOf(Object.values(InteractionType) as string[], 'Please select a valid interaction type'),
    
  date: yup
    .string()
    .required('Interaction date is required')
    .test('valid-date', 'Please enter a valid date', validateInteractionDate)
    .test('not-future', 'Interaction date cannot be in the future', validateNotFutureDate),
    
  subject: yup
    .string()
    .required('Subject is required')
    .min(3, 'Subject must be at least 3 characters')
    .max(255, 'Subject must be less than 255 characters')
    .trim(),
    
  notes: yup
    .string()
    .max(2000, 'Notes must be less than 2000 characters')
    .nullable()
    .transform((value) => value === '' ? null : value),
    
  opportunity_id: yup
    .string()
    .uuid('Invalid opportunity selected')
    .nullable()
    .test('opportunity-or-contact', 'Either an opportunity or contact must be selected', validateOpportunityOrContact),
    
  contact_id: yup
    .string()
    .uuid('Invalid contact selected')
    .nullable(),
    
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
        .test('valid-date', 'Please enter a valid follow-up date', validateInteractionDate)
        .test('future-date', 'Follow-up date must be today or in the future', validateFutureDate)
        .test('after-interaction', 'Follow-up date must be on or after the interaction date', function(value) {
          return validateFollowUpDateAfterInteractionDate.call(this, value)
        }),
      otherwise: (schema) => schema
        .test('future-date-optional', 'Follow-up date must be in the future if provided', validateFutureDate)
    })
})

/**
 * Validation schema for interaction updates
 * More relaxed validation for editing existing interactions
 */
export const interactionUpdateSchema = yup.object({
  interaction_type: yup
    .string()
    .oneOf(Object.values(InteractionType) as string[], 'Please select a valid interaction type')
    .optional(),
    
  date: yup
    .string()
    .test('valid-date', 'Please enter a valid date', validateInteractionDate)
    .test('not-future', 'Interaction date cannot be in the future', validateNotFutureDate)
    .optional(),
    
  subject: yup
    .string()
    .min(3, 'Subject must be at least 3 characters')
    .max(255, 'Subject must be less than 255 characters')
    .trim()
    .optional(),
    
  notes: yup
    .string()
    .max(2000, 'Notes must be less than 2000 characters')
    .nullable()
    .transform((value) => value === '' ? null : value)
    .optional(),
    
  opportunity_id: yup
    .string()
    .uuid('Invalid opportunity selected')
    .nullable()
    .optional(),
    
  contact_id: yup
    .string()
    .uuid('Invalid contact selected')
    .nullable()
    .optional(),
    
  follow_up_needed: yup
    .boolean()
    .optional(),
    
  follow_up_date: yup
    .string()
    .nullable()
    .when('follow_up_needed', {
      is: true,
      then: (schema) => schema
        .required('Follow-up date is required when follow-up is needed')
        .test('valid-date', 'Please enter a valid follow-up date', validateInteractionDate)
        .test('future-date', 'Follow-up date must be today or in the future', validateFutureDate)
        .test('after-interaction', 'Follow-up date must be on or after the interaction date', function(value) {
          return validateFollowUpDateAfterInteractionDate.call(this, value)
        }),
      otherwise: (schema) => schema
        .test('future-date-optional', 'Follow-up date must be in the future if provided', validateFutureDate)
    })
    .optional()
})

/**
 * Simplified validation schema for quick interaction entry
 * Used in mobile interfaces and quick-add modals
 */
export const quickInteractionSchema = yup.object({
  interaction_type: yup
    .string()
    .required('Interaction type is required')
    .oneOf(Object.values(InteractionType) as string[], 'Please select a valid interaction type'),
    
  date: yup
    .string()
    .required('Date is required')
    .test('valid-date', 'Please enter a valid date', validateInteractionDate)
    .test('not-future', 'Date cannot be in the future', validateNotFutureDate),
    
  subject: yup
    .string()
    .required('Subject is required')
    .min(3, 'Subject must be at least 3 characters')
    .max(255, 'Subject is too long')
    .trim(),
    
  notes: yup
    .string()
    .max(500, 'Notes must be less than 500 characters') // Shorter limit for quick entry
    .nullable()
    .transform((value) => value === '' ? null : value),
    
  // Simplified relationship - only one field required
  target_id: yup
    .string()
    .required('Please select an opportunity or contact')
    .uuid('Invalid selection'),
    
  target_type: yup
    .string()
    .required('Target type is required')
    .oneOf(['opportunity', 'contact'], 'Invalid target type'),
    
  follow_up_needed: yup
    .boolean()
    .default(false)
})

/**
 * Validation schema for batch interaction creation
 * Used when creating multiple interactions simultaneously
 */
export const batchInteractionSchema = yup.object({
  // Template data that applies to all interactions
  template: yup.object({
    interaction_type: yup
      .string()
      .required('Interaction type is required for all interactions')
      .oneOf(Object.values(InteractionType) as string[], 'Please select a valid interaction type'),
      
    date: yup
      .string()
      .required('Date is required for all interactions')
      .test('valid-date', 'Please enter a valid date', validateInteractionDate)
      .test('not-future', 'Date cannot be in the future', validateNotFutureDate),
      
    subject: yup
      .string()
      .required('Subject template is required')
      .min(3, 'Subject must be at least 3 characters')
      .max(255, 'Subject must be less than 255 characters')
      .trim(),
      
    notes: yup
      .string()
      .max(2000, 'Notes must be less than 2000 characters')
      .nullable()
      .transform((value) => value === '' ? null : value),
      
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
    .test('valid-date', 'Please enter a valid follow-up date', validateInteractionDate)
    .test('future-date', 'Follow-up date must be today or in the future', validateFutureDate)
    .test('after-interaction', 'Follow-up date must be on or after the interaction date', function(value) {
        return validateFollowUpDateAfterInteractionDate.call(this, value)
    }),
      otherwise: (schema) => schema
            .test('future-date-optional', 'Follow-up date must be in the future if provided', validateFutureDate)
        })
  }).required('Template data is required'),
  
  // Target interactions
  targets: yup
    .array(
      yup.object({
        contact_id: yup
          .string()
          .uuid('Invalid contact ID')
          .nullable(),
          
        opportunity_id: yup
          .string()
          .uuid('Invalid opportunity ID')
          .nullable(),
          
        subject_override: yup
          .string()
          .max(255, 'Subject override must be less than 255 characters')
          .nullable(),
          
        notes_override: yup
          .string()
          .max(2000, 'Notes override must be less than 2000 characters')
          .nullable()
      }).test('has-target', 'Each interaction must have either a contact or opportunity', function(value) {
      if (!value || (!value.contact_id && !value.opportunity_id)) {
      return this.createError({
      message: 'Each interaction must have either a contact or opportunity selected'
      })
      }
      return true
      })
    )
    .min(1, 'At least one target must be specified')
    .max(50, 'Cannot create more than 50 interactions at once')
    .required('Target list is required')
})

/**
 * Validation schema specifically for follow-up scheduling
 * Used in follow-up management interfaces
 */
export const followUpSchema = yup.object({
  interaction_id: yup
    .string()
    .required('Interaction ID is required')
    .uuid('Invalid interaction ID'),
    
  action: yup
    .string()
    .required('Follow-up action is required')
    .oneOf(['complete', 'reschedule', 'cancel'], 'Please select a valid follow-up action'),
    
  new_date: yup
    .string()
    .nullable()
    .when('action', {
      is: 'reschedule',
      then: (schema) => schema
        .required('New follow-up date is required when rescheduling')
        .test('valid-date', 'Please enter a valid date', validateInteractionDate)
        .test('future-date', 'New follow-up date must be today or in the future', validateFutureDate),
      otherwise: (schema) => schema.nullable()
    }),
    
  completion_notes: yup
    .string()
    .max(1000, 'Completion notes must be less than 1000 characters')
    .nullable()
    .when('action', {
      is: 'complete',
      then: (schema) => schema.required('Completion notes are required when marking follow-up as complete'),
      otherwise: (schema) => schema.nullable()
    }),
    
  new_interaction: yup
    .object({
      interaction_type: yup
      .string()
      .required('Interaction type is required')
      .oneOf(Object.values(InteractionType) as string[], 'Please select a valid interaction type'),
        
      subject: yup
        .string()
        .required('Subject is required')
        .min(3, 'Subject must be at least 3 characters')
        .max(255, 'Subject must be less than 255 characters')
        .trim(),
        
      notes: yup
        .string()
        .max(2000, 'Notes must be less than 2000 characters')
        .nullable()
        .transform((value) => value === '' ? null : value),
        
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
            .test('valid-date', 'Please enter a valid follow-up date', validateInteractionDate)
            .test('future-date', 'Follow-up date must be today or in the future', validateFutureDate),
          otherwise: (schema) => schema
            .test('future-date-optional', 'Follow-up date must be in the future if provided', validateFutureDate)
        })
    })
    .nullable()
    .when('action', {
      is: 'complete',
      then: (schema) => schema.nullable(), // Optional when completing
      otherwise: (schema) => schema.nullable()
    })
})

/**
 * TypeScript type inference from validation schemas
 */
export type InteractionCreateValidation = yup.InferType<typeof interactionCreateSchema>
export type InteractionUpdateValidation = yup.InferType<typeof interactionUpdateSchema>
export type QuickInteractionValidation = yup.InferType<typeof quickInteractionSchema>
export type BatchInteractionValidation = yup.InferType<typeof batchInteractionSchema>
export type FollowUpValidation = yup.InferType<typeof followUpSchema>

/**
 * Error message constants for consistency across forms
 */
export const INTERACTION_ERROR_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_DATE: 'Please enter a valid date',
  FUTURE_INTERACTION_DATE: 'Interaction date cannot be in the future',
  PAST_FOLLOW_UP_DATE: 'Follow-up date must be today or in the future',
  SUBJECT_TOO_SHORT: 'Subject must be at least 3 characters',
  SUBJECT_TOO_LONG: 'Subject must be less than 255 characters',
  NOTES_TOO_LONG: 'Notes must be less than 2000 characters',
  INVALID_INTERACTION_TYPE: 'Please select a valid interaction type',
  INVALID_UUID: 'Invalid selection',
  OPPORTUNITY_OR_CONTACT_REQUIRED: 'Either an opportunity or contact must be selected',
  FOLLOW_UP_DATE_REQUIRED: 'Follow-up date is required when follow-up is needed',
  FOLLOW_UP_DATE_AFTER_INTERACTION: 'Follow-up date must be on or after the interaction date',
  BATCH_SIZE_LIMIT: 'Cannot create more than 50 interactions at once',
  BATCH_MIN_TARGETS: 'At least one target must be specified'
} as const

/**
 * Form field configuration for accessibility
 */
export const INTERACTION_FORM_CONFIG = {
  INTERACTION_TYPE: {
    name: 'interaction_type',
    label: 'Interaction Type',
    required: true,
    helpText: 'Select the type of interaction that took place'
  },
  DATE: {
    name: 'date',
    label: 'Interaction Date',
    required: true,
    helpText: 'When did this interaction occur? Cannot be in the future'
  },
  SUBJECT: {
    name: 'subject',
    label: 'Subject',
    required: true,
    helpText: 'Brief description of the interaction (3-255 characters)'
  },
  NOTES: {
    name: 'notes',
    label: 'Notes',
    required: false,
    helpText: 'Additional details about the interaction (optional, max 2000 characters)'
  },
  OPPORTUNITY: {
    name: 'opportunity_id',
    label: 'Related Opportunity',
    required: false,
    helpText: 'Link this interaction to an opportunity (either opportunity or contact required)'
  },
  CONTACT: {
    name: 'contact_id',
    label: 'Related Contact',
    required: false,
    helpText: 'Link this interaction to a contact (either opportunity or contact required)'
  },
  FOLLOW_UP_NEEDED: {
    name: 'follow_up_needed',
    label: 'Follow-up Needed',
    required: false,
    helpText: 'Check if this interaction requires a follow-up'
  },
  FOLLOW_UP_DATE: {
    name: 'follow_up_date',
    label: 'Follow-up Date',
    required: false,
    helpText: 'When should the follow-up occur? (required if follow-up is needed)'
  }
} as const

/**
 * Validation schema selector helper function
 * Helps choose the appropriate schema based on context
 */
export const getInteractionValidationSchema = (context: 'create' | 'update' | 'quick' | 'batch' | 'followup') => {
  switch (context) {
    case 'create':
      return interactionCreateSchema
    case 'update':
      return interactionUpdateSchema
    case 'quick':
      return quickInteractionSchema
    case 'batch':
      return batchInteractionSchema
    case 'followup':
      return followUpSchema
    default:
      return interactionCreateSchema
  }
}

/**
 * Form validation helper for accessibility
 * Generates proper error IDs and ARIA attributes
 */
export const getInteractionFormValidationProps = (fieldName: string, error?: string) => ({
  id: `interaction-${fieldName}`,
  'aria-describedby': error ? `error-${fieldName}` : undefined,
  'aria-invalid': error ? 'true' : 'false',
  'aria-required': INTERACTION_FORM_CONFIG[fieldName.toUpperCase() as keyof typeof INTERACTION_FORM_CONFIG]?.required || 'false'
})