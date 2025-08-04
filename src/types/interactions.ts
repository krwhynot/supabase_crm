// =============================================================================
// Interaction Types for CRM Interaction Management
// =============================================================================
// TypeScript type definitions for the interactions system following
// opportunity system patterns for consistency and integration.
//
// Architecture Reference: src/types/opportunities.ts patterns
// Database Reference: sql/32_interactions_schema.sql
// Updated: Stage 3.3 - Form validation schemas and comprehensive types
// =============================================================================

import type { 
  Database,
  InteractionType,
  InteractionStatus,
  InteractionOutcome,
  Interaction as DatabaseInteraction,
  InteractionInsert,
  InteractionUpdate
} from './database.types'

// Re-export database types for convenience
export type { InteractionType, InteractionStatus, InteractionOutcome }
export type { InteractionInsert, InteractionUpdate }

// ===============================
// BASE INTERACTION TYPES
// ===============================

/**
 * Core interaction data structure (extends database record)
 */
export interface Interaction extends DatabaseInteraction {
  // Computed fields for UI
  days_since_interaction?: number
  days_until_followup?: number | null
}

/**
 * Interaction list view interface for table display
 */
export interface InteractionListView {
  id: string
  type: InteractionType
  subject: string
  interaction_date: string
  opportunity_id: string
  status: InteractionStatus
  outcome: InteractionOutcome | null
  duration_minutes: number | null
  rating: number | null
  follow_up_required: boolean
  follow_up_date: string | null
  created_at: string
  updated_at: string | null
  
  // Related entity data
  opportunity_name: string
  organization_name: string
  
  // Computed fields
  days_since_interaction: number
  days_until_followup: number | null
}

/**
 * Detailed interaction view for individual interaction pages
 */
export interface InteractionDetailView extends Interaction {
  opportunity?: {
    id: string
    name: string
    stage: string
    organization: {
      id: string
      name: string
      type: string | null
    } | null
  } | null
}

// ===============================
// FORM AND INPUT INTERFACES
// ===============================

/**
 * Form data structure for creating/editing interactions
 */
export interface InteractionFormData {
  type: InteractionType
  subject: string
  interaction_date: string
  opportunity_id: string
  status?: InteractionStatus
  outcome?: InteractionOutcome | null
  notes?: string | null
  duration_minutes?: number | null
  location?: string | null
  follow_up_required?: boolean
  follow_up_date?: string | null
  follow_up_notes?: string | null
  rating?: number | null
  next_action?: string | null
  contact_method?: string | null
  participants?: string[] | null
  attachments?: string[] | null
  tags?: string[] | null
  custom_fields?: Record<string, any> | null
  created_by?: string | null
}

/**
 * Validation schema for interaction forms
 */
export interface InteractionValidationSchema {
  subject: {
    required: boolean
    minLength: number
    maxLength: number
  }
  interaction_date: {
    required: boolean
    validation: 'date'
  }
  opportunity_id: {
    required: boolean
    validation: 'uuid'
  }
  type: {
    required: boolean
    enum: InteractionType[]
  }
  status: {
    required: boolean
    enum: InteractionStatus[]
  }
  outcome: {
    required: false
    enum: (InteractionOutcome | null)[]
  }
  rating: {
    required: false
    min: number
    max: number
    validation: 'integer'
  }
  duration_minutes: {
    required: false
    min: number
    max: number
    validation: 'integer'
  }
  follow_up_date: {
    required: false
    validation: 'date'
    conditional: {
      dependsOn: 'follow_up_required'
      value: true
    }
  }
}

// ===============================
// FILTERING AND PAGINATION
// ===============================

/**
 * Filtering options for interaction queries
 */
export interface InteractionFilters {
  opportunity_id?: string
  type?: InteractionType
  status?: InteractionStatus
  outcome?: InteractionOutcome
  date_from?: string
  date_to?: string
  search?: string
  follow_up_required?: boolean
  rating_min?: number
  rating_max?: number
  created_by?: string
  organization_id?: string
  has_notes?: boolean
  has_attachments?: boolean
  tags?: string[]
}

/**
 * Pagination and sorting options
 */
export interface InteractionPagination {
  page: number
  limit: number
  sort_by: 'interaction_date' | 'created_at' | 'updated_at' | 'subject' | 'rating' | 'duration_minutes'
  sort_order: 'asc' | 'desc'
}

/**
 * API response for interaction lists with pagination
 */
export interface InteractionListResponse {
  interactions: InteractionListView[]
  total_count: number
  page: number
  limit: number
  has_next: boolean
  has_previous: boolean
}

// ===============================
// ANALYTICS AND REPORTING
// ===============================

/**
 * Key Performance Indicators for interactions
 */
export interface InteractionKPIs {
  total_interactions: number
  completed_interactions: number
  scheduled_interactions: number
  positive_outcomes: number
  success_rate: number // percentage of positive outcomes
  average_rating: number
  pending_follow_ups: number
  overdue_follow_ups: number
  interactions_this_month: number
  interactions_last_month: number
  average_duration_minutes: number
  most_common_type: InteractionType
}

// ===============================
// FORM STEP INTERFACES
// ===============================

/**
 * Multi-step form interfaces for interaction creation
 */
export interface InteractionFormStep1 {
  type: InteractionType
  subject: string
  opportunity_id: string
  interaction_date: string
}

export interface InteractionFormStep2 {
  status: InteractionStatus
  duration_minutes?: number | null
  location?: string | null
  contact_method?: string | null
  participants?: string[] | null
}

export interface InteractionFormStep3 {
  outcome?: InteractionOutcome | null
  rating?: number | null
  notes?: string | null
  follow_up_required?: boolean
  follow_up_date?: string | null
  follow_up_notes?: string | null
  next_action?: string | null
  tags?: string[] | null
  attachments?: string[] | null
  custom_fields?: Record<string, any> | null
}

// ===============================
// UI STATE INTERFACES
// ===============================

/**
 * Store state interface (following opportunity store patterns)
 */
export interface InteractionStoreState {
  interactions: Interaction[]
  selectedInteraction: Interaction | null
  loading: boolean
  creating: boolean
  updating: boolean
  deleting: boolean
  error: string | null
  kpis: InteractionKPIs | null
  filters: InteractionFilters
  sorting: InteractionSorting
  pagination: {
    page: number
    limit: number
    total: number
  }
}

/**
 * Sorting configuration interface
 */
export interface InteractionSorting {
  field: 'interaction_date' | 'created_at' | 'updated_at' | 'subject' | 'rating' | 'duration_minutes'
  direction: 'asc' | 'desc'
}

// Quick template interface for mobile optimization
export interface InteractionQuickTemplate {
  id: string
  label: string
  type: InteractionType
  subject_template: string
  notes_template?: string
  default_duration?: number
  default_location?: string
  icon?: string
}

// Constants for interaction management
export const INTERACTION_TYPES: { value: InteractionType; label: string }[] = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'CALL', label: 'Phone Call' },
  { value: 'IN_PERSON', label: 'In-Person Meeting' },
  { value: 'DEMO', label: 'Product Demo' },
  { value: 'FOLLOW_UP', label: 'Follow-up' },
  { value: 'SAMPLE_DELIVERY', label: 'Sample Delivery' }
]

export const INTERACTION_STATUSES: { value: InteractionStatus; label: string }[] = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'NO_SHOW', label: 'No Show' }
]

export const INTERACTION_OUTCOMES: { value: InteractionOutcome; label: string }[] = [
  { value: 'POSITIVE', label: 'Positive' },
  { value: 'NEUTRAL', label: 'Neutral' }, 
  { value: 'NEGATIVE', label: 'Negative' },
  { value: 'NEEDS_FOLLOW_UP', label: 'Needs Follow-up' }
]

// Quick templates for mobile optimization
export const QUICK_TEMPLATES: InteractionQuickTemplate[] = [
  {
    id: 'sample-drop',
    label: 'Dropped Samples',
    type: 'SAMPLE_DELIVERY',
    subject_template: 'Product samples delivered',
    notes_template: 'Product samples delivered for evaluation',
    default_duration: 15,
    icon: '📦'
  },
  {
    id: 'quick-call',
    label: 'Quick Call',
    type: 'CALL',  
    subject_template: 'Brief phone conversation',
    notes_template: 'Brief phone conversation',
    default_duration: 10,
    icon: '📞'
  },
  {
    id: 'product-demo',
    label: 'Product Demo',
    type: 'DEMO',
    subject_template: 'Product demonstration',
    notes_template: 'Product demonstration session',
    default_duration: 60,
    icon: '🎯'
  },
  {
    id: 'follow-up',
    label: 'Follow-up',
    type: 'FOLLOW_UP',
    subject_template: 'Follow-up contact',
    notes_template: 'Follow-up on previous interaction',
    default_duration: 20,
    icon: '📋'
  }
]

// Utility functions for interaction data processing
export const getInteractionTypeLabel = (type: InteractionType): string => {
  return INTERACTION_TYPES.find(t => t.value === type)?.label || type
}

export const getInteractionStatusLabel = (status: InteractionStatus): string => {
  return INTERACTION_STATUSES.find(s => s.value === status)?.label || status
}

export const getInteractionOutcomeLabel = (outcome: InteractionOutcome): string => {
  return INTERACTION_OUTCOMES.find(o => o.value === outcome)?.label || outcome
}

// Type guards for interaction data validation
export const isInteractionType = (value: string): value is InteractionType => {
  return INTERACTION_TYPES.some(type => type.value === value)
}

export const isInteractionStatus = (value: string): value is InteractionStatus => {
  return INTERACTION_STATUSES.some(status => status.value === value)
}

export const isInteractionOutcome = (value: string): value is InteractionOutcome => {
  return INTERACTION_OUTCOMES.some(outcome => outcome.value === value)
}

// Default values for new interactions
export const getDefaultInteractionFormData = (opportunityId?: string): Partial<InteractionFormData> => ({
  opportunity_id: opportunityId || '',
  type: 'CALL',
  subject: '',
  interaction_date: new Date().toISOString(),
  status: 'SCHEDULED',
  follow_up_required: false,
  notes: '',
  participants: [],
  tags: []
})

// Validation helpers
export const isValidRating = (rating?: number | null): boolean => {
  return rating === null || rating === undefined || (rating >= 1 && rating <= 5)
}

export const isFollowUpDateValid = (followUpRequired: boolean, followUpDate?: string | null): boolean => {
  if (!followUpRequired) return true
  if (!followUpDate) return false
  return new Date(followUpDate) > new Date()
}

// ===============================
// VALIDATION SCHEMAS AND RULES
// ===============================

/**
 * Comprehensive validation rules for interaction forms
 */
export const INTERACTION_VALIDATION_RULES = {
  subject: {
    required: true,
    minLength: 3,
    maxLength: 255,
    pattern: /^[a-zA-Z0-9\s\-_.,!?]+$/,
    message: 'Subject must be 3-255 characters and contain only letters, numbers, and basic punctuation'
  },
  interaction_date: {
    required: true,
    validation: 'datetime-local',
    maxDate: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    message: 'Interaction date is required and cannot be more than 30 days in the future'
  },
  opportunity_id: {
    required: true,
    validation: 'uuid',
    pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    message: 'Valid opportunity must be selected'
  },
  type: {
    required: true,
    enum: ['EMAIL', 'CALL', 'IN_PERSON', 'DEMO', 'FOLLOW_UP', 'SAMPLE_DELIVERY'],
    message: 'Valid interaction type must be selected'
  },
  status: {
    required: true,
    enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
    message: 'Valid status must be selected'
  },
  outcome: {
    required: false,
    enum: ['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'NEEDS_FOLLOW_UP', null],
    conditional: {
      dependsOn: 'status',
      value: 'COMPLETED',
      message: 'Outcome is required when interaction is completed'
    }
  },
  rating: {
    required: false,
    min: 1,
    max: 5,
    validation: 'integer',
    conditional: {
      dependsOn: 'status',
      value: 'COMPLETED',
      message: 'Rating should be provided for completed interactions'
    }
  },
  duration_minutes: {
    required: false,
    min: 1,
    max: 480, // 8 hours max
    validation: 'integer',
    message: 'Duration must be between 1 and 480 minutes'
  },
  follow_up_date: {
    required: false,
    validation: 'datetime-local',
    minDate: () => new Date(),
    conditional: {
      dependsOn: 'follow_up_required',
      value: true,
      required: true,
      message: 'Follow-up date is required when follow-up is needed'
    }
  },
  notes: {
    required: false,
    maxLength: 2000,
    message: 'Notes cannot exceed 2000 characters'
  },
  location: {
    required: false,
    maxLength: 255,
    conditional: {
      dependsOn: 'type',
      value: 'IN_PERSON',
      message: 'Location should be provided for in-person meetings'
    }
  },
  contact_method: {
    required: false,
    maxLength: 100,
    enum: ['Phone', 'Email', 'Video Call', 'In Person', 'Text', 'Social Media', 'Other'],
    message: 'Contact method should be specified when applicable'
  }
} as const

/**
 * Default form values for different interaction types
 */
export const INTERACTION_FORM_DEFAULTS = {
  EMAIL: {
    duration_minutes: null,
    location: null,
    contact_method: 'Email',
    follow_up_required: false
  },
  CALL: {
    duration_minutes: 15,
    location: null,
    contact_method: 'Phone',
    follow_up_required: false
  },
  IN_PERSON: {
    duration_minutes: 60,
    location: '',
    contact_method: 'In Person',
    follow_up_required: true
  },
  DEMO: {
    duration_minutes: 45,
    location: '',
    contact_method: 'In Person',
    follow_up_required: true
  },
  FOLLOW_UP: {
    duration_minutes: 20,
    location: null,
    contact_method: 'Phone',
    follow_up_required: false
  },
  SAMPLE_DELIVERY: {
    duration_minutes: 15,
    location: '',
    contact_method: 'In Person',
    follow_up_required: true
  }
} as const

/**
 * Stage-based probability mappings for analytics
 */
export const INTERACTION_SUCCESS_PROBABILITIES = {
  POSITIVE: 0.9,
  NEUTRAL: 0.5,
  NEGATIVE: 0.1,
  NEEDS_FOLLOW_UP: 0.7
} as const

/**
 * Form validation state interface
 */
export interface InteractionFormValidation {
  isValid: boolean
  errors: Record<string, string[]>
  warnings: Record<string, string[]>
  touched: Record<string, boolean>
  step1Valid: boolean
  step2Valid: boolean
  step3Valid: boolean
}

/**
 * Form submission result interface
 */
export interface InteractionFormSubmissionResult {
  success: boolean
  data?: Interaction
  errors?: Record<string, string[]>
  warnings?: string[]
  created_id?: string
}

// Export types for external use
export type {
  Database,
  DatabaseInteraction,
  InteractionInsert as DatabaseInteractionInsert,
  InteractionUpdate as DatabaseInteractionUpdate
}