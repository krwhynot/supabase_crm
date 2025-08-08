import * as yup from 'yup'
import type { 
  Database, 
  Tables, 
  Enums
} from './database.types'

/**
 * =============================================================================
 * PRINCIPAL ACTIVITY TRACKING - COMPREHENSIVE TYPE SYSTEM
 * =============================================================================
 * 
 * Provides complete TypeScript interfaces for Principal Activity Management
 * with database view integration, analytics support, and relationship tracking
 */

// ===============================
// DATABASE TYPE ALIASES
// ===============================

export type Organization = Tables<'organizations'>
export type OrganizationInsert = Database['public']['Tables']['organizations']['Insert']
export type OrganizationUpdate = Database['public']['Tables']['organizations']['Update']

export type Product = Tables<'products'>
export type ProductPrincipal = Tables<'product_principals'>
export type ContactPrincipal = Tables<'contact_principals'>

export type Opportunity = Tables<'opportunities'>
export type Interaction = Tables<'interactions'>

// ===============================
// PRINCIPAL ACTIVITY SUMMARY
// ===============================

/**
 * Principal Activity Summary - Comprehensive activity tracking interface
 * Based on the secure principal_activity_summary database view
 */
export interface PrincipalActivitySummary {
  // Core identification
  principal_id: string
  principal_name: string
  principal_status: Enums<'organization_status'> | null
  organization_type: Enums<'organization_type'> | null
  industry: string | null
  organization_size: Enums<'organization_size'> | null
  is_active: boolean
  lead_score: number | null
  
  // Contact metrics
  contact_count: number
  active_contacts: number
  primary_contact_name: string | null
  primary_contact_email: string | null
  last_contact_update: string | null
  
  // Interaction metrics
  total_interactions: number
  interactions_last_30_days: number
  interactions_last_90_days: number
  last_interaction_date: string | null
  last_interaction_type: string | null
  next_follow_up_date: string | null
  avg_interaction_rating: number
  positive_interactions: number
  follow_ups_required: number
  
  // Opportunity metrics
  total_opportunities: number
  active_opportunities: number
  won_opportunities: number
  opportunities_last_30_days: number
  latest_opportunity_stage: string | null
  latest_opportunity_date: string | null
  avg_probability_percent: number
  highest_value_opportunity: string | null
  
  // Product metrics
  product_count: number
  active_product_count: number
  product_categories: Enums<'product_category'>[] | null
  primary_product_category: Enums<'product_category'> | null
  
  // Business context
  is_principal: boolean
  is_distributor: boolean
  
  // Activity status
  last_activity_date: string | null
  activity_status: PrincipalActivityStatus
  engagement_score: number
  
  // Metadata
  principal_created_at: string | null
  principal_updated_at: string | null
  summary_generated_at: string
}

/**
 * Principal Distributor Relationships - Mapping principals to distributors
 * Based on secure database view for relationship tracking
 */
export interface PrincipalDistributorRelationship {
  principal_id: string
  principal_name: string
  principal_status: Enums<'organization_status'> | null
  distributor_id: string | null
  distributor_name: string | null
  distributor_status: Enums<'organization_status'> | null
  relationship_type: RelationshipType
  
  // Geographic context
  principal_city: string | null
  principal_state: string | null
  principal_country: string | null
  distributor_city: string | null
  distributor_state: string | null
  distributor_country: string | null
  
  // Performance context
  principal_lead_score: number | null
  distributor_lead_score: number | null
  
  // Temporal context
  principal_created_at: string | null
  principal_last_contact: string | null
  distributor_last_contact: string | null
}

/**
 * Principal Product Performance - Product relationship analytics
 * Tracks performance metrics for each principal-product combination
 */
export interface PrincipalProductPerformance {
  principal_id: string
  principal_name: string
  product_id: string
  product_name: string
  product_category: Enums<'product_category'> | null
  product_sku: string | null
  
  // Relationship details
  is_primary_principal: boolean | null
  exclusive_rights: boolean | null
  wholesale_price: number | null
  minimum_order_quantity: number | null
  lead_time_days: number | null
  
  // Contract info
  contract_start_date: string | null
  contract_end_date: string | null
  territory_restrictions: any | null
  
  // Performance metrics
  opportunities_for_product: number
  won_opportunities_for_product: number
  active_opportunities_for_product: number
  latest_opportunity_date: string | null
  avg_opportunity_probability: number
  
  // Component-expected properties (aliases/computed values)
  total_opportunities: number  // Maps to opportunities_for_product
  win_rate: number            // Win percentage (0-100), calculated from won/total opportunities
  total_value: number         // Total monetary value of opportunities for this product
  
  // Interaction metrics
  interactions_for_product: number
  recent_interactions_for_product: number
  last_interaction_date: string | null
  
  // Product status
  product_is_active: boolean | null
  launch_date: string | null
  discontinue_date: string | null
  unit_cost: number | null
  suggested_retail_price: number | null
  
  // Calculated metrics
  contract_status: ContractStatus
  product_performance_score: number
  
  // Metadata
  relationship_created_at: string | null
  relationship_updated_at: string | null
}

/**
 * Principal Timeline Summary - Chronological activity tracking
 * Provides a complete timeline of activities for principal relationship management
 */
export interface PrincipalTimelineEntry {
  principal_id: string
  principal_name: string
  activity_date: string
  activity_type: TimelineActivityType
  activity_subject: string
  activity_details: string
  source_id: string
  source_table: string
  
  // Context information
  opportunity_name: string | null
  contact_name: string | null
  product_name: string | null
  
  // Metadata
  created_by: string | null
  activity_status: string
  follow_up_required: boolean | null
  follow_up_date: string | null
  timeline_rank: number
}

/**
 * Principal Analytics Interface - KPI calculations and metrics
 * Provides comprehensive analytics for dashboard and reporting
 */
export interface PrincipalAnalytics {
  // Overall statistics
  total_principals: number
  active_principals: number
  principals_with_products: number
  principals_with_opportunities: number
  average_products_per_principal: number
  average_engagement_score: number
  
  // Performance metrics
  top_performers: Array<{
    principal_id: string
    principal_name: string
    engagement_score: number
    total_opportunities: number
    won_opportunities: number
    total_revenue: number
  }> | null
  
  // Activity distribution
  activity_status_distribution: {
    NO_ACTIVITY: number
    STALE: number
    MODERATE: number
    ACTIVE: number
  }
  
  // Product relationship metrics
  product_category_distribution: {
    [K in Enums<'product_category'>]: number
  }
  
  // Time-based metrics
  monthly_activity_trend: Array<{
    month: string
    new_principals: number
    active_principals: number
    opportunities_created: number
    interactions_count: number
  }>
  
  // Regional distribution
  geographic_distribution: Array<{
    country: string
    principal_count: number
    total_opportunities: number
    avg_engagement_score: number
  }>
}

/**
 * Principal Dashboard Data - Composite interface for dashboard display
 * Combines all relevant data types for efficient dashboard rendering
 */
export interface PrincipalDashboardData {
  summary: PrincipalActivitySummary
  relationships: PrincipalDistributorRelationship[]
  product_performance: PrincipalProductPerformance[]
  recent_timeline: PrincipalTimelineEntry[]
  analytics: PrincipalAnalytics
  
  // Quick access metrics
  kpi_metrics: {
    total_revenue_potential: number
    active_opportunity_count: number
    pending_follow_ups: number
    overdue_activities: number
    engagement_trend: 'increasing' | 'stable' | 'decreasing'
  }
}

// ===============================
// ENUM TYPE DEFINITIONS
// ===============================

/**
 * Principal Activity Status Levels
 * Categorizes principals based on recent activity and engagement
 */
export type PrincipalActivityStatus = 'NO_ACTIVITY' | 'STALE' | 'MODERATE' | 'ACTIVE'

/**
 * Contract Status for Product Relationships
 * Tracks the current status of principal-product contracts
 */
export type ContractStatus = 'EXPIRED' | 'EXPIRING_SOON' | 'PENDING' | 'ACTIVE'

/**
 * Principal-Distributor Relationship Types
 * Defines the type of relationship between principals and distributors
 */
export type RelationshipType = 'HAS_DISTRIBUTOR' | 'DIRECT'

/**
 * Timeline Activity Types
 * Categorizes different types of activities in the principal timeline
 */
export type TimelineActivityType = 'CONTACT_UPDATE' | 'INTERACTION' | 'OPPORTUNITY_CREATED' | 'PRODUCT_ASSOCIATION'

// ===============================
// SEARCH AND FILTERING INTERFACES
// ===============================

/**
 * Principal Filters - Search and filtering parameters
 * Supports complex filtering for principal lists and analytics
 */
export interface PrincipalFilters {
  // Text search
  search?: string
  
  // Status filters
  activity_status?: PrincipalActivityStatus[]
  organization_status?: Enums<'organization_status'>[]
  organization_type?: Enums<'organization_type'>[]
  
  // Engagement filters
  engagement_score_range?: { min: number; max: number }
  lead_score_range?: { min: number; max: number }
  
  // Product filters
  product_categories?: Enums<'product_category'>[]
  has_products?: boolean
  has_active_products?: boolean
  
  // Opportunity filters
  has_opportunities?: boolean
  has_active_opportunities?: boolean
  opportunity_count_range?: { min: number; max: number }
  
  // Interaction filters
  last_interaction_days?: number
  interaction_count_range?: { min: number; max: number }
  
  // Geographic filters
  country?: string[]
  state_province?: string[]
  
  // Date range filters
  created_after?: Date
  created_before?: Date
  last_activity_after?: Date
  last_activity_before?: Date
  
  // Business relationship filters
  is_principal?: boolean
  is_distributor?: boolean
  relationship_type?: RelationshipType[]
}

/**
 * Principal Sort Configuration
 * Defines sorting options for principal lists
 */
export interface PrincipalSortConfig {
  field: PrincipalSortField
  order: 'asc' | 'desc'
}

export type PrincipalSortField = 
  | 'name' 
  | 'engagement_score' 
  | 'lead_score' 
  | 'last_activity_date'
  | 'total_opportunities'
  | 'total_interactions'
  | 'product_count'
  | 'created_at'

/**
 * Principal Pagination Configuration
 * Standard pagination interface for principal lists
 */
export interface PrincipalPagination {
  page: number
  limit: number
  total: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}

/**
 * Principal List Response
 * API response format for principal list queries
 */
export interface PrincipalListResponse {
  data: PrincipalActivitySummary[]
  pagination: PrincipalPagination
  filters: PrincipalFilters
  sort: PrincipalSortConfig
  analytics_summary: {
    total_count: number
    active_count: number
    avg_engagement_score: number
    top_activity_status: PrincipalActivityStatus
  }
}

// ===============================
// FORM AND VALIDATION INTERFACES
// ===============================

/**
 * Principal Selection Interface
 * Used for multi-select components and batch operations
 */
export interface PrincipalSelectionItem {
  id: string
  name: string
  organization_type: Enums<'organization_type'> | null
  engagement_score: number
  activity_status: PrincipalActivityStatus
  contact_count: number
  opportunity_count: number
  last_activity_date: string | null
  is_recommended: boolean
}

/**
 * Principal Filter Form Data
 * Form interface for advanced filtering
 */
export interface PrincipalFilterFormData {
  search_query: string
  activity_statuses: PrincipalActivityStatus[]
  organization_statuses: Enums<'organization_status'>[]
  engagement_min: number | null
  engagement_max: number | null
  product_categories: Enums<'product_category'>[]
  has_active_opportunities: boolean | null
  geographic_regions: string[]
  date_range: {
    start: Date | null
    end: Date | null
  }
}

// ===============================
// YUPTIMIZED VALIDATION SCHEMAS
// ===============================

/**
 * Principal Filter Validation Schema
 * Yup schema for validating filter form data
 */
export const principalFilterValidationSchema = yup.object({
  search_query: yup
    .string()
    .max(255, 'Search query must be less than 255 characters'),
    
  activity_statuses: yup
    .array(yup.string().oneOf(['NO_ACTIVITY', 'STALE', 'MODERATE', 'ACTIVE']))
    .default([]),
    
  organization_statuses: yup
    .array(yup.string().oneOf(['Active', 'Inactive', 'Prospect', 'Customer', 'Partner', 'Vendor']))
    .default([]),
    
  engagement_min: yup
    .number()
    .min(0, 'Minimum engagement score cannot be negative')
    .max(100, 'Minimum engagement score cannot exceed 100')
    .nullable(),
    
  engagement_max: yup
    .number()
    .min(0, 'Maximum engagement score cannot be negative')
    .max(100, 'Maximum engagement score cannot exceed 100')
    .nullable()
    .test('min-max', 'Maximum must be greater than minimum', function(value) {
      const { engagement_min } = this.parent
      if (engagement_min && value && value <= engagement_min) {
        return this.createError({ message: 'Maximum engagement score must be greater than minimum' })
      }
      return true
    }),
    
  product_categories: yup
    .array(yup.string().oneOf(['Protein', 'Sauce', 'Seasoning', 'Beverage', 'Snack', 'Frozen', 'Dairy', 'Bakery', 'Other']))
    .default([]),
    
  has_active_opportunities: yup
    .boolean()
    .nullable(),
    
  geographic_regions: yup
    .array(yup.string())
    .default([]),
    
  date_range: yup.object({
    start: yup.date().nullable(),
    end: yup.date().nullable()
      .test('end-after-start', 'End date must be after start date', function(value) {
        const { start } = this.parent
        if (start && value && value <= start) {
          return this.createError({ message: 'End date must be after start date' })
        }
        return true
      })
  }).default({ start: null, end: null })
})

/**
 * Type inference from validation schema
 */
export type PrincipalFilterValidation = yup.InferType<typeof principalFilterValidationSchema>

// ===============================
// UTILITY AND HELPER TYPES
// ===============================

/**
 * Principal Metrics Summary
 * Condensed metrics for quick display in cards or widgets
 */
export interface PrincipalMetricsSummary {
  total_principals: number
  active_this_month: number
  top_engagement_score: number
  opportunities_created_this_month: number
  interactions_this_week: number
  pending_follow_ups: number
}

/**
 * Principal Search Result
 * Optimized interface for search results with highlighting
 */
export interface PrincipalSearchResult {
  principal: PrincipalActivitySummary
  match_score: number
  highlighted_fields: {
    name?: string
    industry?: string
    primary_contact?: string
  }
  context: {
    recent_activity: string | null
    key_products: string[]
    opportunity_stage: string | null
  }
}

/**
 * Principal Relationship Graph Node
 * For network visualization of principal relationships
 */
export interface PrincipalRelationshipNode {
  id: string
  name: string
  type: 'principal' | 'distributor' | 'contact' | 'product'
  engagement_score: number
  activity_level: PrincipalActivityStatus
  connections: Array<{
    target_id: string
    relationship_type: string
    strength: number
  }>
}

// ===============================
// CONSTANT DEFINITIONS
// ===============================

/**
 * Activity Status Configuration
 * Defines thresholds and colors for activity status levels
 */
export const ACTIVITY_STATUS_CONFIG = {
  NO_ACTIVITY: {
    label: 'No Activity',
    color: 'gray',
    threshold_days: null,
    description: 'No recorded activity'
  },
  STALE: {
    label: 'Stale',
    color: 'red',
    threshold_days: 90,
    description: 'No activity in 90+ days'
  },
  MODERATE: {
    label: 'Moderate',
    color: 'yellow',
    threshold_days: 30,
    description: 'Some activity in last 30-90 days'
  },
  ACTIVE: {
    label: 'Active',
    color: 'green',
    threshold_days: 7,
    description: 'Recent activity within 30 days'
  }
} as const

/**
 * Engagement Score Ranges
 * Defines score ranges for different engagement levels
 */
export const ENGAGEMENT_SCORE_RANGES = {
  LOW: { min: 0, max: 30, label: 'Low Engagement', color: 'red' },
  MEDIUM: { min: 31, max: 70, label: 'Medium Engagement', color: 'yellow' },
  HIGH: { min: 71, max: 100, label: 'High Engagement', color: 'green' }
} as const

/**
 * Timeline Activity Icons
 * Icon mappings for different timeline activity types
 */
export const TIMELINE_ACTIVITY_ICONS = {
  CONTACT_UPDATE: 'user-edit',
  INTERACTION: 'chat',
  OPPORTUNITY_CREATED: 'trending-up',
  PRODUCT_ASSOCIATION: 'package'
} as const

/**
 * Default Principal Filters
 * Starting filter state for principal lists
 */
export const DEFAULT_PRINCIPAL_FILTERS: PrincipalFilters = {
  search: '',
  activity_status: [],
  organization_status: [],
  has_opportunities: undefined,
  has_products: undefined,
  is_principal: undefined,
  is_distributor: undefined
}

/**
 * Default Principal Sort Configuration
 * Default sorting for principal lists
 */
export const DEFAULT_PRINCIPAL_SORT: PrincipalSortConfig = {
  field: 'engagement_score',
  order: 'desc'
}

// ===============================
// TYPE GUARDS AND VALIDATORS
// ===============================

/**
 * Type guard for Principal Activity Summary
 */
export function isPrincipalActivitySummary(obj: any): obj is PrincipalActivitySummary {
  return (
    obj &&
    typeof obj.principal_id === 'string' &&
    typeof obj.principal_name === 'string' &&
    typeof obj.engagement_score === 'number' &&
    ['NO_ACTIVITY', 'STALE', 'MODERATE', 'ACTIVE'].includes(obj.activity_status)
  )
}

/**
 * Type guard for Principal Timeline Entry
 */
export function isPrincipalTimelineEntry(obj: any): obj is PrincipalTimelineEntry {
  return (
    obj &&
    typeof obj.principal_id === 'string' &&
    typeof obj.activity_date === 'string' &&
    ['CONTACT_UPDATE', 'INTERACTION', 'OPPORTUNITY_CREATED', 'PRODUCT_ASSOCIATION'].includes(obj.activity_type)
  )
}

/**
 * Utility function to calculate engagement score
 */
export function calculateEngagementScore(summary: PrincipalActivitySummary): number {
  const weights = {
    interactions: 0.3,
    opportunities: 0.4,
    products: 0.2,
    recency: 0.1
  }
  
  // Normalize interaction count (0-100 scale)
  const interactionScore = Math.min(summary.total_interactions * 2, 100)
  
  // Normalize opportunity count (0-100 scale)
  const opportunityScore = Math.min(summary.total_opportunities * 10, 100)
  
  // Normalize product count (0-100 scale)  
  const productScore = Math.min(summary.product_count * 20, 100)
  
  // Calculate recency score based on last activity
  let recencyScore = 0
  if (summary.last_activity_date) {
    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(summary.last_activity_date).getTime()) / (1000 * 60 * 60 * 24)
    )
    recencyScore = Math.max(0, 100 - daysSinceActivity)
  }
  
  return Math.round(
    interactionScore * weights.interactions +
    opportunityScore * weights.opportunities +
    productScore * weights.products +
    recencyScore * weights.recency
  )
}

/**
 * Utility function to determine activity status
 */
export function determineActivityStatus(summary: PrincipalActivitySummary): PrincipalActivityStatus {
  if (!summary.last_activity_date) return 'NO_ACTIVITY'
  
  const daysSinceActivity = Math.floor(
    (Date.now() - new Date(summary.last_activity_date).getTime()) / (1000 * 60 * 60 * 24)
  )
  
  if (daysSinceActivity <= 30) return 'ACTIVE'
  if (daysSinceActivity <= 90) return 'MODERATE'
  return 'STALE'
}