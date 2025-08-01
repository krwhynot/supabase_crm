import * as yup from 'yup'

/**
 * Opportunity Stage Enum - 7-stage sales pipeline
 */
export enum OpportunityStage {
  NEW_LEAD = 'New Lead',
  INITIAL_OUTREACH = 'Initial Outreach', 
  SAMPLE_VISIT_OFFERED = 'Sample/Visit Offered',
  AWAITING_RESPONSE = 'Awaiting Response',
  FEEDBACK_LOGGED = 'Feedback Logged',
  DEMO_SCHEDULED = 'Demo Scheduled',
  CLOSED_WON = 'Closed - Won'
}

/**
 * Opportunity Context Enum - Types of opportunities
 */
export enum OpportunityContext {
  SITE_VISIT = 'Site Visit',
  FOOD_SHOW = 'Food Show',
  NEW_PRODUCT_INTEREST = 'New Product Interest',
  FOLLOW_UP = 'Follow-up',
  DEMO_REQUEST = 'Demo Request',
  SAMPLING = 'Sampling',
  CUSTOM = 'Custom'
}

/**
 * Base Opportunity interface matching database schema
 */
export interface Opportunity {
  id: string
  name: string
  organization_id: string
  stage: OpportunityStage
  product_id: string | null
  context: OpportunityContext | null
  probability_percent: number | null
  expected_close_date: string | null
  deal_owner: string | null
  notes: string | null
  is_won: boolean
  auto_generated_name: boolean
  name_template: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}

/**
 * Opportunity insert interface for creating new opportunities
 */
export interface OpportunityInsert {
  name: string
  organization_id: string
  stage: OpportunityStage
  product_id?: string | null
  context?: OpportunityContext | null
  probability_percent?: number | null
  expected_close_date?: string | null
  deal_owner?: string | null
  notes?: string | null
  auto_generated_name?: boolean
  name_template?: string | null
  created_by?: string | null
}

/**
 * Opportunity update interface for editing opportunities
 */
export interface OpportunityUpdate {
  name?: string
  stage?: OpportunityStage
  product_id?: string | null
  context?: OpportunityContext | null
  probability_percent?: number | null
  expected_close_date?: string | null
  deal_owner?: string | null
  notes?: string | null
  auto_generated_name?: boolean
  name_template?: string | null
}

/**
 * Enhanced opportunity with related data for list views
 */
export interface OpportunityListView {
  id: string
  name: string
  stage: OpportunityStage
  probability_percent: number | null
  expected_close_date: string | null
  deal_owner: string | null
  is_won: boolean
  created_at: string
  updated_at: string
  
  // Related organization data
  organization_name: string
  organization_type: string
  
  // Related principal data
  principal_name: string | null
  principal_id: string | null
  
  // Related product data
  product_name: string | null
  product_category: string | null
  
  // Calculated fields
  days_since_created: number
  days_to_close: number | null
  stage_duration_days: number
}

/**
 * Comprehensive opportunity with all related data for detail views
 */
export interface OpportunityDetailView extends OpportunityListView {
  organization_id: string
  product_id: string | null
  context: OpportunityContext | null
  notes: string | null
  auto_generated_name: boolean
  name_template: string | null
  created_by: string | null
  deleted_at: string | null
  
  // Full organization details
  organization_address: string | null
  organization_phone: string | null
  organization_email: string | null
  
  // Principal organization details
  principal_address: string | null
  principal_phone: string | null
  principal_email: string | null
  
  // Product details
  product_description: string | null
  product_category: string | null
  product_unit_price: number | null
  
  // Activity indicators
  has_recent_interactions: boolean
  last_interaction_date: string | null
  total_interactions: number
}

/**
 * Form data interface for opportunity creation/editing
 */
export interface OpportunityFormData {
  name: string
  organization_id: string
  stage: OpportunityStage
  principal_ids: string[]  // Multiple principals for batch creation
  product_id: string
  context: OpportunityContext | null
  probability_percent: number | null
  expected_close_date: string | null
  deal_owner: string | null
  notes: string | null
  auto_generate_name: boolean
  name_template: string | null
}

/**
 * Auto-naming preview interface
 */
export interface OpportunityNamePreview {
  principal_id: string
  principal_name: string
  generated_name: string
  name_template: string
}

/**
 * Batch creation result interface
 */
export interface BatchCreationResult {
  success: boolean
  created_opportunities: Opportunity[]
  failed_creations: {
    principal_id: string
    principal_name: string
    error: string
  }[]
  total_created: number
  total_failed: number
}

/**
 * Opportunity KPI interface for dashboard metrics
 */
export interface OpportunityKPIs {
  total_opportunities: number
  active_opportunities: number
  won_opportunities: number
  average_probability: number
  total_pipeline_value: number
  won_this_month: number
  conversion_rate: number
  average_days_to_close: number
  
  // Stage distribution
  stage_distribution: {
    [K in OpportunityStage]: number
  }
  
  // Recent activity
  created_this_week: number
  updated_this_week: number
  closed_this_week: number
}

/**
 * Search and filter parameters
 */
export interface OpportunityFilters {
  search?: string
  stage?: OpportunityStage[]
  organization_id?: string
  principal_id?: string
  product_id?: string
  deal_owner?: string
  probability_min?: number
  probability_max?: number
  created_after?: string
  created_before?: string
  expected_close_after?: string
  expected_close_before?: string
  is_won?: boolean
  context?: OpportunityContext[]
}

/**
 * Pagination parameters
 */
export interface OpportunityPagination {
  page: number
  limit: number
  sort_by: string
  sort_order: 'asc' | 'desc'
}

/**
 * API response interface
 */
export interface OpportunityListResponse {
  opportunities: OpportunityListView[]
  total_count: number
  page: number
  limit: number
  has_next: boolean
  has_previous: boolean
}

/**
 * Yup validation schema for opportunity forms
 */
export const opportunityValidationSchema = yup.object({
  name: yup
    .string()
    .required('Opportunity name is required')
    .min(3, 'Name must be at least 3 characters')
    .max(255, 'Name must be less than 255 characters'),
    
  organization_id: yup
    .string()
    .required('Organization is required')
    .uuid('Invalid organization ID'),
    
  stage: yup
    .string()
    .required('Stage is required')
    .oneOf(Object.values(OpportunityStage), 'Invalid stage selected'),
    
  principal_ids: yup
    .array(yup.string().uuid('Invalid principal ID'))
    .min(1, 'At least one principal must be selected')
    .required('Principal selection is required'),
    
  product_id: yup
    .string()
    .uuid('Invalid product ID')
    .required('Product selection is required'),
    
  context: yup
    .string()
    .oneOf([...Object.values(OpportunityContext), ''], 'Invalid context selected')
    .nullable(),
    
  probability_percent: yup
    .number()
    .min(0, 'Probability cannot be negative')
    .max(100, 'Probability cannot exceed 100%')
    .nullable(),
    
  expected_close_date: yup
    .string()
    .nullable()
    .test('future-date', 'Close date should be in the future', function(value) {
      if (!value) return true
      const closeDate = new Date(value)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return closeDate >= today
    }),
    
  deal_owner: yup
    .string()
    .max(100, 'Deal owner name must be less than 100 characters')
    .nullable(),
    
  notes: yup
    .string()
    .max(2000, 'Notes must be less than 2000 characters')
    .nullable(),
    
  auto_generate_name: yup
    .boolean()
    .default(true),
    
  name_template: yup
    .string()
    .max(500, 'Name template must be less than 500 characters')
    .nullable()
})

/**
 * Type inference from validation schema
 */
export type OpportunityFormValidation = yup.InferType<typeof opportunityValidationSchema>

/**
 * Stage progression mapping for business logic
 */
export const STAGE_PROGRESSION: { [K in OpportunityStage]: OpportunityStage[] } = {
  [OpportunityStage.NEW_LEAD]: [OpportunityStage.INITIAL_OUTREACH],
  [OpportunityStage.INITIAL_OUTREACH]: [OpportunityStage.SAMPLE_VISIT_OFFERED, OpportunityStage.AWAITING_RESPONSE],
  [OpportunityStage.SAMPLE_VISIT_OFFERED]: [OpportunityStage.AWAITING_RESPONSE],
  [OpportunityStage.AWAITING_RESPONSE]: [OpportunityStage.FEEDBACK_LOGGED, OpportunityStage.INITIAL_OUTREACH],
  [OpportunityStage.FEEDBACK_LOGGED]: [OpportunityStage.DEMO_SCHEDULED, OpportunityStage.CLOSED_WON],
  [OpportunityStage.DEMO_SCHEDULED]: [OpportunityStage.CLOSED_WON, OpportunityStage.FEEDBACK_LOGGED],
  [OpportunityStage.CLOSED_WON]: []
}

/**
 * Default probability percentages by stage
 */
export const STAGE_DEFAULT_PROBABILITY: { [K in OpportunityStage]: number } = {
  [OpportunityStage.NEW_LEAD]: 10,
  [OpportunityStage.INITIAL_OUTREACH]: 20,
  [OpportunityStage.SAMPLE_VISIT_OFFERED]: 35,
  [OpportunityStage.AWAITING_RESPONSE]: 40,
  [OpportunityStage.FEEDBACK_LOGGED]: 60,
  [OpportunityStage.DEMO_SCHEDULED]: 80,
  [OpportunityStage.CLOSED_WON]: 100
}

/**
 * Stage color coding for UI components
 */
export const STAGE_COLORS: { [K in OpportunityStage]: string } = {
  [OpportunityStage.NEW_LEAD]: 'gray',
  [OpportunityStage.INITIAL_OUTREACH]: 'blue',
  [OpportunityStage.SAMPLE_VISIT_OFFERED]: 'yellow',
  [OpportunityStage.AWAITING_RESPONSE]: 'orange',
  [OpportunityStage.FEEDBACK_LOGGED]: 'purple',
  [OpportunityStage.DEMO_SCHEDULED]: 'green',
  [OpportunityStage.CLOSED_WON]: 'emerald'
}