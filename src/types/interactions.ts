import * as yup from 'yup'

/**
 * Interaction Type Enum - 5 main interaction types
 */
export enum InteractionType {
  EMAIL = 'EMAIL',
  CALL = 'CALL', 
  IN_PERSON = 'IN_PERSON',
  DEMO = 'DEMO',
  FOLLOW_UP = 'FOLLOW_UP'
}

/**
 * Base Interaction interface matching database schema
 */
export interface Interaction {
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
 */
export interface InteractionInsert {
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
 */
export interface InteractionUpdate {
  interaction_type?: InteractionType
  date?: string
  subject?: string
  notes?: string | null
  opportunity_id?: string | null
  contact_id?: string | null
  follow_up_needed?: boolean
  follow_up_date?: string | null
}

/**
 * Enhanced interaction with related data for list views
 */
export interface InteractionListView {
  id: string
  interaction_type: InteractionType
  date: string
  subject: string
  notes: string | null
  follow_up_needed: boolean
  follow_up_date: string | null
  created_at: string | null
  updated_at: string | null
  created_by: string | null
  
  // Related opportunity data
  opportunity_id: string | null
  opportunity_name: string | null
  opportunity_stage: string | null
  opportunity_organization: string | null
  
  // Related contact data
  contact_id: string | null
  contact_name: string | null
  contact_position: string | null
  contact_organization: string | null
  
  // Calculated fields
  days_since_interaction: number
  days_to_follow_up: number | null
  is_overdue_follow_up: boolean
  interaction_priority: 'High' | 'Medium' | 'Low'
}

/**
 * Comprehensive interaction with all related data for detail views
 */
export interface InteractionDetailView extends InteractionListView {
  // Full opportunity details
  opportunity_probability: number | null
  opportunity_expected_close: string | null
  opportunity_deal_owner: string | null
  opportunity_context: string | null
  
  // Full contact details
  contact_email: string | null
  contact_phone: string | null
  contact_is_primary: boolean | null
  
  // Full organization details
  organization_id: string | null
  organization_name: string | null
  organization_type: string | null
  organization_industry: string | null
  organization_website: string | null
  organization_email: string | null
  organization_phone: string | null
  
  // Activity indicators
  related_interactions_count: number
  next_scheduled_interaction: string | null
  last_interaction_before_this: string | null
  interaction_sequence_number: number
}

/**
 * Form data interface for interaction creation/editing
 */
export interface InteractionFormData {
  interaction_type: InteractionType | ''
  date: string
  subject: string
  notes: string
  opportunity_id: string | null
  contact_id: string | null
  follow_up_needed: boolean
  follow_up_date: string | null
}

/**
 * Context data interface for pre-populating the form from other pages
 */
export interface InteractionContextData {
  interaction_type?: InteractionType
  opportunity_id?: string | null
  contact_id?: string | null
  subject?: string
  notes?: string
  date?: string
}

/**
 * Interaction KPI interface for dashboard metrics
 */
export interface InteractionKPIs {
  total_interactions: number
  interactions_this_week: number
  interactions_this_month: number
  overdue_follow_ups: number
  scheduled_follow_ups: number
  avg_interactions_per_week: number
  
  // Type distribution
  type_distribution: {
    [K in InteractionType]: number
  }
  
  // Follow-up metrics
  follow_up_completion_rate: number
  avg_days_to_follow_up: number
  
  // Relationship metrics
  interactions_with_opportunities: number
  interactions_with_contacts: number
  unique_contacts_contacted: number
  unique_opportunities_touched: number
  
  // Recent activity
  created_this_week: number
  follow_ups_completed_this_week: number
  follow_ups_scheduled_this_week: number
}

/**
 * Search and filter parameters
 */
export interface InteractionFilters {
  search?: string
  interaction_type?: InteractionType[]
  opportunity_id?: string
  contact_id?: string
  organization_id?: string
  created_by?: string
  date_from?: string
  date_to?: string
  follow_up_needed?: boolean
  follow_up_overdue?: boolean
  follow_up_date_from?: string
  follow_up_date_to?: string
  has_opportunity?: boolean
  has_contact?: boolean
  created_after?: string
  created_before?: string
}

/**
 * Pagination parameters
 */
export interface InteractionPagination {
  page: number
  limit: number
  sort_by: string
  sort_order: 'asc' | 'desc'
}

/**
 * API response interface
 */
export interface InteractionListResponse {
  interactions: InteractionListView[]
  total_count: number
  page: number
  limit: number
  has_next: boolean
  has_previous: boolean
}

/**
 * Batch creation interface for multiple interactions
 */
export interface BatchInteractionCreate {
  template: Omit<InteractionFormData, 'contact_id' | 'opportunity_id'>
  targets: {
    contact_id?: string | null
    opportunity_id?: string | null
    subject_override?: string
    notes_override?: string
  }[]
}

/**
 * Batch creation result interface
 */
export interface BatchInteractionResult {
  success: boolean
  created_interactions: Interaction[]
  failed_creations: {
    target_index: number
    contact_id?: string | null
    opportunity_id?: string | null
    error: string
  }[]
  total_created: number
  total_failed: number
}

/**
 * Follow-up management interface
 */
export interface FollowUpAction {
  interaction_id: string
  action: 'complete' | 'reschedule' | 'cancel'
  new_date?: string | null
  completion_notes?: string
  new_interaction?: Omit<InteractionFormData, 'opportunity_id' | 'contact_id'>
}

/**
 * Yup validation schema for interaction forms
 */
export const interactionValidationSchema = yup.object({
  interaction_type: yup
    .string()
    .required('Interaction type is required')
    .oneOf(Object.values(InteractionType), 'Invalid interaction type selected'),
    
  date: yup
    .string()
    .required('Date is required')
    .test('valid-date', 'Please enter a valid date', function(value) {
      if (!value) return false
      const date = new Date(value)
      return !isNaN(date.getTime())
    })
    .test('not-future', 'Interaction date cannot be in the future', function(value) {
      if (!value) return true
      const interactionDate = new Date(value)
      const today = new Date()
      today.setHours(23, 59, 59, 999) // End of today
      return interactionDate <= today
    }),
    
  subject: yup
    .string()
    .required('Subject is required')
    .min(3, 'Subject must be at least 3 characters')
    .max(255, 'Subject must be less than 255 characters'),
    
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
    .test('future-date', 'Follow-up date should be in the future', function(value) {
      if (!value) return true
      const followUpDate = new Date(value)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return followUpDate >= today
    })
    .test('required-when-needed', 'Follow-up date is required when follow-up is needed', function(value) {
      const followUpNeeded = this.parent.follow_up_needed
      if (followUpNeeded && !value) {
        return false
      }
      return true
    })
})

/**
 * Type inference from validation schema
 */
export type InteractionFormValidation = yup.InferType<typeof interactionValidationSchema>

/**
 * Interaction type configuration for UI components
 */
export const INTERACTION_TYPE_CONFIG: { 
  [K in InteractionType]: {
    label: string
    description: string
    icon: string
    color: string
    defaultSubject: string
    requiresFollowUp: boolean
  } 
} = {
  [InteractionType.EMAIL]: {
    label: 'Email',
    description: 'Email communication',
    icon: 'envelope',
    color: 'blue',
    defaultSubject: 'Email follow-up',
    requiresFollowUp: true
  },
  [InteractionType.CALL]: {
    label: 'Phone Call',
    description: 'Phone conversation',
    icon: 'phone',
    color: 'green',
    defaultSubject: 'Phone call',
    requiresFollowUp: true
  },
  [InteractionType.IN_PERSON]: {
    label: 'In-Person Meeting',
    description: 'Face-to-face meeting',
    icon: 'users',
    color: 'purple',
    defaultSubject: 'In-person meeting',
    requiresFollowUp: true
  },
  [InteractionType.DEMO]: {
    label: 'Product Demo',
    description: 'Product demonstration',
    icon: 'presentation-chart-line',
    color: 'orange',
    defaultSubject: 'Product demonstration',
    requiresFollowUp: true
  },
  [InteractionType.FOLLOW_UP]: {
    label: 'Follow-up',
    description: 'Follow-up interaction',
    icon: 'arrow-path',
    color: 'indigo',
    defaultSubject: 'Follow-up',
    requiresFollowUp: false
  }
}

/**
 * Priority calculation based on interaction type and context
 */
export const calculateInteractionPriority = (
  interaction: Partial<InteractionListView>
): 'High' | 'Medium' | 'Low' => {
  const { interaction_type, follow_up_needed, is_overdue_follow_up, opportunity_id } = interaction
  
  // High priority: overdue follow-ups or demos with opportunities
  if (is_overdue_follow_up || 
      (interaction_type === InteractionType.DEMO && opportunity_id)) {
    return 'High'
  }
  
  // Medium priority: follow-ups needed or calls with opportunities
  if (follow_up_needed || 
      (interaction_type === InteractionType.CALL && opportunity_id) ||
      interaction_type === InteractionType.IN_PERSON) {
    return 'Medium'
  }
  
  // Low priority: emails and follow-ups without opportunities
  return 'Low'
}

/**
 * Default follow-up periods by interaction type (in days)
 */
export const DEFAULT_FOLLOW_UP_DAYS: { [K in InteractionType]: number } = {
  [InteractionType.EMAIL]: 3,
  [InteractionType.CALL]: 7,
  [InteractionType.IN_PERSON]: 5,
  [InteractionType.DEMO]: 2,
  [InteractionType.FOLLOW_UP]: 7
}

/**
 * Interaction type color coding for UI components
 */
export const INTERACTION_TYPE_COLORS: { [K in InteractionType]: string } = {
  [InteractionType.EMAIL]: 'blue',
  [InteractionType.CALL]: 'green',
  [InteractionType.IN_PERSON]: 'purple',
  [InteractionType.DEMO]: 'orange',
  [InteractionType.FOLLOW_UP]: 'indigo'
}

/**
 * Subject templates for different interaction types
 */
export const INTERACTION_SUBJECT_TEMPLATES: { [K in InteractionType]: string[] } = {
  [InteractionType.EMAIL]: [
    'Follow-up: {opportunity_name}',
    'Product inquiry: {product_name}',
    'Meeting request: {organization_name}',
    'Proposal discussion',
    'General follow-up'
  ],
  [InteractionType.CALL]: [
    'Initial outreach call',
    'Follow-up call: {opportunity_name}',
    'Product discussion call',
    'Check-in call',
    'Closing call: {opportunity_name}'
  ],
  [InteractionType.IN_PERSON]: [
    'Site visit: {organization_name}',
    'Business meeting: {opportunity_name}',
    'Product presentation',
    'Contract discussion',
    'Relationship building meeting'
  ],
  [InteractionType.DEMO]: [
    'Product demo: {product_name}',
    'Live demonstration: {opportunity_name}',
    'Technical demo session',
    'Custom demo presentation',
    'Product walkthrough'
  ],
  [InteractionType.FOLLOW_UP]: [
    'Follow-up: Previous meeting',
    'Action items follow-up',
    'Status check: {opportunity_name}',
    'Next steps discussion',
    'General follow-up'
  ]
}