// =============================================================================
// Organization Types and Validation Schemas
// =============================================================================
// TypeScript types and Yup validation schemas for organizations functionality
// Generated from Supabase database schema - Stage 3 Enhanced Implementation
// Updated for Organization Form Redesign with A/B/C/D Priority System
// =============================================================================

import * as yup from 'yup';
import type { 
  Organization, 
  OrganizationType,
  OrganizationSize,
  OrganizationStatus,
  InteractionType,
  InteractionDirection
} from './database.types';

// =============================================================================
// Enhanced Organization Types for Form Redesign - Stage 3.1
// =============================================================================

// Priority mapping types (A/B/C/D system)
export type OrganizationPriority = 'A' | 'B' | 'C' | 'D';

export interface PriorityOption {
  value: number; // 90, 70, 50, 30
  label: OrganizationPriority; // A, B, C, D
  description: string;
}

// Enhanced status options for new business requirements
export type EnhancedOrganizationStatus = 
  | 'Prospect' 
  | 'Active Customer' 
  | 'Inactive Customer' 
  | 'Other'
  | 'Principal'
  | 'Distributor';

// Principal/Distributor custom fields interface
export interface OrganizationCustomFields {
  is_principal?: boolean;
  is_distributor?: boolean;
  distributor_id?: string; // Reference to distributor organization
  account_manager_id?: string;
  food_beverage_segment?: string;
  [key: string]: any;
}

// =============================================================================
// Organization Validation Schemas
// =============================================================================

// Base organization schema for creation/updates
export const organizationSchema = yup.object({
  name: yup
    .string()
    .required('Organization name is required')
    .trim()
    .min(1, 'Organization name cannot be empty')
    .max(255, 'Organization name must be less than 255 characters'),
  
  legal_name: yup
    .string()
    .nullable()
    .max(255, 'Legal name must be less than 255 characters'),
  
  description: yup
    .string()
    .nullable(),
  
  industry: yup
    .string()
    .nullable()
    .max(255, 'Industry must be less than 255 characters'),
  
  type: yup
    .mixed<OrganizationType>()
    .oneOf(['B2B', 'B2C', 'B2B2C', 'Non-Profit', 'Government', 'Other'])
    .nullable(),
  
  size: yup
    .mixed<OrganizationSize>()
    .oneOf(['Startup', 'Small', 'Medium', 'Large', 'Enterprise'])
    .nullable(),
  
  status: yup
    .mixed<OrganizationStatus>()
    .oneOf(['Active', 'Inactive', 'Prospect', 'Customer', 'Partner', 'Vendor'])
    .nullable(),
  
  website: yup
    .string()
    .nullable()
    .matches(/^https?:\/\/[^\s]+$/, 'Website must be a valid URL starting with http:// or https://'),
  
  email: yup
    .string()
    .nullable()
    .email('Email must be a valid email address'),
  
  primary_phone: yup
    .string()
    .nullable()
    .max(50, 'Primary phone must be less than 50 characters'),
  
  secondary_phone: yup
    .string()
    .nullable()
    .max(50, 'Secondary phone must be less than 50 characters'),
  
  address_line_1: yup
    .string()
    .nullable()
    .max(255, 'Address line 1 must be less than 255 characters'),
  
  address_line_2: yup
    .string()
    .nullable()
    .max(255, 'Address line 2 must be less than 255 characters'),
  
  city: yup
    .string()
    .nullable()
    .max(100, 'City must be less than 100 characters'),
  
  state_province: yup
    .string()
    .nullable()
    .max(100, 'State/Province must be less than 100 characters'),
  
  postal_code: yup
    .string()
    .nullable()
    .max(20, 'Postal code must be less than 20 characters'),
  
  country: yup
    .string()
    .nullable()
    .max(100, 'Country must be less than 100 characters'),
  
  founded_year: yup
    .number()
    .nullable()
    .integer('Founded year must be a whole number')
    .min(1800, 'Founded year must be 1800 or later')
    .max(new Date().getFullYear() + 1, 'Founded year cannot be in the future'),
  
  employees_count: yup
    .number()
    .nullable()
    .integer('Employee count must be a whole number')
    .min(0, 'Employee count cannot be negative'),
  
  annual_revenue: yup
    .number()
    .nullable()
    .min(0, 'Annual revenue cannot be negative'),
  
  currency_code: yup
    .string()
    .nullable()
    .matches(/^[A-Z]{3}$/, 'Currency code must be 3 uppercase letters (e.g., USD)'),
  
  lead_source: yup
    .string()
    .nullable()
    .max(255, 'Lead source must be less than 255 characters'),
  
  lead_score: yup
    .number()
    .nullable()
    .integer('Lead score must be a whole number')
    .min(0, 'Lead score cannot be negative')
    .max(100, 'Lead score cannot exceed 100'),
  
  tags: yup
    .array()
    .of(yup.string())
    .nullable(),
  
  custom_fields: yup
    .object()
    .nullable(),
  
  parent_org_id: yup
    .string()
    .nullable()
    .uuid('Parent organization ID must be a valid UUID'),
  
  assigned_user_id: yup
    .string()
    .nullable()
    .uuid('Assigned user ID must be a valid UUID'),
  
  last_contact_date: yup
    .date()
    .nullable(),
  
  next_follow_up_date: yup
    .date()
    .nullable(),

  // Principal/Distributor fields for new business logic
  is_principal: yup
    .boolean()
    .nullable(),

  is_distributor: yup
    .boolean()
    .nullable(),

  distributor_id: yup
    .string()
    .nullable()
    .uuid('Distributor ID must be a valid UUID'),

  account_manager_id: yup
    .string()
    .nullable()
    .uuid('Account Manager ID must be a valid UUID')
});

// Schema for creating new organizations
export const createOrganizationSchema = organizationSchema;

// Schema for updating organizations (all fields optional except constraints)
export const updateOrganizationSchema = organizationSchema.partial();

// =============================================================================
// Organization Interaction Validation Schemas
// =============================================================================

export const organizationInteractionSchema = yup.object({
  organization_id: yup
    .string()
    .required('Organization ID is required')
    .uuid('Organization ID must be a valid UUID'),
  
  contact_id: yup
    .string()
    .nullable()
    .uuid('Contact ID must be a valid UUID'),
  
  type: yup
    .mixed<InteractionType>()
    .oneOf(['Email', 'Phone', 'Meeting', 'Demo', 'Proposal', 'Contract', 'Note', 'Task', 'Event', 'Social', 'Website', 'Other'])
    .required('Interaction type is required'),
  
  direction: yup
    .mixed<InteractionDirection>()
    .oneOf(['Inbound', 'Outbound'])
    .nullable(),
  
  subject: yup
    .string()
    .nullable()
    .max(500, 'Subject must be less than 500 characters')
    .test('not-empty', 'Subject cannot be empty if provided', function(value) {
      return value === null || value === undefined || value.trim().length > 0;
    }),
  
  description: yup
    .string()
    .nullable(),
  
  interaction_date: yup
    .date()
    .required('Interaction date is required'),
  
  duration_minutes: yup
    .number()
    .nullable()
    .integer('Duration must be a whole number of minutes')
    .min(0, 'Duration cannot be negative'),
  
  tags: yup
    .array()
    .of(yup.string())
    .nullable(),
  
  metadata: yup
    .object()
    .nullable(),
  
  created_by_user_id: yup
    .string()
    .nullable()
    .uuid('Created by user ID must be a valid UUID')
});

export const createOrganizationInteractionSchema = organizationInteractionSchema;
export const updateOrganizationInteractionSchema = organizationInteractionSchema.partial().shape({
  organization_id: yup.string().uuid('Organization ID must be a valid UUID'), // Keep required for updates
});

// =============================================================================
// Organization Document Validation Schemas
// =============================================================================

export const organizationDocumentSchema = yup.object({
  organization_id: yup
    .string()
    .required('Organization ID is required')
    .uuid('Organization ID must be a valid UUID'),
  
  name: yup
    .string()
    .required('Document name is required')
    .trim()
    .min(1, 'Document name cannot be empty')
    .max(500, 'Document name must be less than 500 characters'),
  
  description: yup
    .string()
    .nullable(),
  
  file_type: yup
    .string()
    .nullable()
    .max(50, 'File type must be less than 50 characters'),
  
  file_size_bytes: yup
    .number()
    .nullable()
    .integer('File size must be a whole number')
    .min(0, 'File size cannot be negative'),
  
  storage_path: yup
    .string()
    .nullable()
    .max(1000, 'Storage path must be less than 1000 characters'),
  
  external_url: yup
    .string()
    .nullable()
    .matches(/^https?:\/\/[^\s]+$/, 'External URL must be a valid URL starting with http:// or https://')
    .max(1000, 'External URL must be less than 1000 characters'),
  
  category: yup
    .string()
    .nullable()
    .max(255, 'Category must be less than 255 characters'),
  
  tags: yup
    .array()
    .of(yup.string())
    .nullable(),
  
  is_public: yup
    .boolean()
    .nullable(),
  
  access_level: yup
    .string()
    .nullable()
    .max(50, 'Access level must be less than 50 characters'),
  
  version: yup
    .string()
    .nullable()
    .max(50, 'Version must be less than 50 characters'),
  
  parent_document_id: yup
    .string()
    .nullable()
    .uuid('Parent document ID must be a valid UUID'),
  
  uploaded_by_user_id: yup
    .string()
    .nullable()
    .uuid('Uploaded by user ID must be a valid UUID')
}).test('has-location', 'Document must have either a storage path or external URL', function(value) {
  return !!(value.storage_path || value.external_url);
});

export const createOrganizationDocumentSchema = organizationDocumentSchema;
export const updateOrganizationDocumentSchema = organizationDocumentSchema.partial().shape({
  organization_id: yup.string().uuid('Organization ID must be a valid UUID'), // Keep required for updates
});

// =============================================================================
// Organization Analytics Validation Schemas
// =============================================================================

export const organizationAnalyticsSchema = yup.object({
  organization_id: yup
    .string()
    .required('Organization ID is required')
    .uuid('Organization ID must be a valid UUID'),
  
  period_start: yup
    .date()
    .required('Period start date is required'),
  
  period_end: yup
    .date()
    .required('Period end date is required')
    .test('after-start', 'Period end must be after period start', function(value) {
      const { period_start } = this.parent;
      if (!period_start || !value) return true;
      return value > period_start;
    }),
  
  period_type: yup
    .string()
    .required('Period type is required')
    .oneOf(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'], 'Period type must be one of: daily, weekly, monthly, quarterly, yearly'),
  
  total_interactions: yup
    .number()
    .nullable()
    .integer('Total interactions must be a whole number')
    .min(0, 'Total interactions cannot be negative'),
  
  email_interactions: yup
    .number()
    .nullable()
    .integer('Email interactions must be a whole number')
    .min(0, 'Email interactions cannot be negative'),
  
  phone_interactions: yup
    .number()
    .nullable()
    .integer('Phone interactions must be a whole number')
    .min(0, 'Phone interactions cannot be negative'),
  
  meeting_interactions: yup
    .number()
    .nullable()
    .integer('Meeting interactions must be a whole number')
    .min(0, 'Meeting interactions cannot be negative'),
  
  revenue_generated: yup
    .number()
    .nullable()
    .min(0, 'Revenue generated cannot be negative'),
  
  deals_closed: yup
    .number()
    .nullable()
    .integer('Deals closed must be a whole number')
    .min(0, 'Deals closed cannot be negative'),
  
  deals_in_progress: yup
    .number()
    .nullable()
    .integer('Deals in progress must be a whole number')
    .min(0, 'Deals in progress cannot be negative'),
  
  lead_score_change: yup
    .number()
    .nullable()
    .integer('Lead score change must be a whole number'),
  
  conversion_events: yup
    .number()
    .nullable()
    .integer('Conversion events must be a whole number')
    .min(0, 'Conversion events cannot be negative'),
  
  documents_added: yup
    .number()
    .nullable()
    .integer('Documents added must be a whole number')
    .min(0, 'Documents added cannot be negative'),
  
  documents_accessed: yup
    .number()
    .nullable()
    .integer('Documents accessed must be a whole number')
    .min(0, 'Documents accessed cannot be negative'),
  
  new_contacts_added: yup
    .number()
    .nullable()
    .integer('New contacts added must be a whole number')
    .min(0, 'New contacts added cannot be negative'),
  
  active_contacts: yup
    .number()
    .nullable()
    .integer('Active contacts must be a whole number')
    .min(0, 'Active contacts cannot be negative'),
  
  custom_metrics: yup
    .object()
    .nullable()
});

export const createOrganizationAnalyticsSchema = organizationAnalyticsSchema;
export const updateOrganizationAnalyticsSchema = organizationAnalyticsSchema.partial().shape({
  organization_id: yup.string().uuid('Organization ID must be a valid UUID'), // Keep required for updates
});

// =============================================================================
// Type Inference from Schemas
// =============================================================================

// Infer TypeScript types from Yup schemas for form handling
export type OrganizationFormData = yup.InferType<typeof organizationSchema>;
export type CreateOrganizationFormData = yup.InferType<typeof createOrganizationSchema>;
export type UpdateOrganizationFormData = yup.InferType<typeof updateOrganizationSchema>;

export type OrganizationInteractionFormData = yup.InferType<typeof organizationInteractionSchema>;
export type CreateOrganizationInteractionFormData = yup.InferType<typeof createOrganizationInteractionSchema>;
export type UpdateOrganizationInteractionFormData = yup.InferType<typeof updateOrganizationInteractionSchema>;

export type OrganizationDocumentFormData = yup.InferType<typeof organizationDocumentSchema>;
export type CreateOrganizationDocumentFormData = yup.InferType<typeof createOrganizationDocumentSchema>;
export type UpdateOrganizationDocumentFormData = yup.InferType<typeof updateOrganizationDocumentSchema>;

export type OrganizationAnalyticsFormData = yup.InferType<typeof organizationAnalyticsSchema>;
export type CreateOrganizationAnalyticsFormData = yup.InferType<typeof createOrganizationAnalyticsSchema>;
export type UpdateOrganizationAnalyticsFormData = yup.InferType<typeof updateOrganizationAnalyticsSchema>;

// =============================================================================
// Form Type Aliases for Composables
// =============================================================================

// Form types used by composables and components
export type OrganizationCreateForm = CreateOrganizationFormData;
export type OrganizationUpdateForm = UpdateOrganizationFormData;
export type OrganizationInteractionCreateForm = CreateOrganizationInteractionFormData;

// Enhanced form data interface for redesigned form
export interface EnhancedOrganizationCreateForm extends Omit<OrganizationCreateForm, 'status' | 'custom_fields'> {
  status: EnhancedOrganizationStatus;
  custom_fields: OrganizationCustomFields;
  priority_letter: OrganizationPriority; // UI-friendly priority representation
  assigned_contacts?: string[]; // Array of contact IDs to associate
}

// Schema exports for composables
export const organizationCreateSchema = createOrganizationSchema;
export const organizationUpdateSchema = updateOrganizationSchema;
export const organizationInteractionCreateSchema = createOrganizationInteractionSchema;

// Enhanced validation schema for redesigned form
export const enhancedOrganizationCreateSchema = organizationCreateSchema.shape({
  status: yup.mixed<EnhancedOrganizationStatus>()
    .oneOf(['Prospect', 'Active Customer', 'Inactive Customer', 'Other', 'Principal', 'Distributor'])
    .required('Organization status is required'),
  
  custom_fields: yup.object({
    is_principal: yup.boolean().nullable(),
    is_distributor: yup.boolean().nullable(),
    distributor_id: yup.string().nullable().uuid('Distributor ID must be valid UUID'),
    account_manager_id: yup.string().nullable().uuid('Account Manager ID must be valid UUID'),
    food_beverage_segment: yup.string().nullable().max(255)
  }).test('principal-distributor-exclusive', 'Cannot be both Principal and Distributor', function(value) {
    return !(value?.is_principal && value?.is_distributor);
  }),
  
  priority_letter: yup.mixed<OrganizationPriority>()
    .oneOf(['A', 'B', 'C', 'D'])
    .required('Priority is required'),
    
  assigned_contacts: yup.array().of(yup.string().uuid()).nullable()
});

// =============================================================================
// Organization List and Detail Types
// =============================================================================

// Organization list item for tables and cards
export interface OrganizationListItem {
  id: string;
  name: string;
  legal_name: string | null;
  industry: string | null;
  type: OrganizationType | null;
  size: OrganizationSize | null;
  status: OrganizationStatus | null;
  website: string | null;
  email: string | null;
  primary_phone: string | null;
  city: string | null;
  country: string | null;
  employees_count: number | null;
  annual_revenue: number | null;
  lead_score: number | null;
  contact_count?: number;
  last_interaction_date: string | null;
  next_follow_up_date: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Organization detail data with relationships
export interface OrganizationDetailData extends Organization {
  contact_count: number;
  interaction_count: number;
  document_count: number;
  recent_interactions: Array<{
    id: string;
    type: InteractionType | null;
    subject: string | null;
    interaction_date: string | null;
    contact_name?: string;
  }>;
}

// Organization creation data
export interface OrganizationCreateData {
  name: string;
  legal_name?: string | null;
  description?: string | null;
  industry?: string | null;
  type?: OrganizationType | null;
  size?: OrganizationSize | null;
  status?: OrganizationStatus | null;
  website?: string | null;
  email?: string | null;
  primary_phone?: string | null;
  secondary_phone?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state_province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  founded_year?: number | null;
  employees_count?: number | null;
  annual_revenue?: number | null;
  currency_code?: string | null;
  lead_source?: string | null;
  lead_score?: number | null;
  parent_org_id?: string | null;
  tags?: string[] | null;
  next_follow_up_date?: Date | null;
}

// =============================================================================
// Filter and Sort Types
// =============================================================================

// Organization filters interface
export interface OrganizationFilters {
  search?: string;
  industry?: string[];
  type?: OrganizationType[];
  size?: OrganizationSize[];
  status?: OrganizationStatus[];
  country?: string[];
  tags?: string[];
  leadScoreRange?: {
    min?: number;
    max?: number;
  };
  employeeRange?: {
    min?: number;
    max?: number;
  };
  revenueRange?: {
    min?: number;
    max?: number;
  };
  foundedYearRange?: {
    min?: number;
    max?: number;
  };
  lastContactDateRange?: {
    start?: Date;
    end?: Date;
  };
}

// Sort configuration
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
  | 'next_follow_up_date';

export type SortOrder = 'asc' | 'desc';

export interface OrganizationSortConfig {
  field: OrganizationSortField;
  order: SortOrder;
}

// =============================================================================
// Pagination and Response Types
// =============================================================================

// Pagination configuration
export interface PaginationConfig {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Organization list response
export interface OrganizationListResponse {
  data: OrganizationListItem[];
  pagination: PaginationConfig;
  filters: OrganizationFilters;
  sort: OrganizationSortConfig;
}

// =============================================================================
// Search and Validation Types
// =============================================================================

// Organization search form
export interface OrganizationSearchForm {
  search?: string | null;
  industry?: string | null;
  type?: OrganizationType | null;
  size?: OrganizationSize | null;
  status?: OrganizationStatus | null;
  country?: string | null;
  min_employees?: number | null;
  max_employees?: number | null;
  min_revenue?: number | null;
  max_revenue?: number | null;
  min_lead_score?: number | null;
  max_lead_score?: number | null;
  tags?: string[] | null;
  limit?: number;
  offset?: number;
  sortBy?: OrganizationSortField;
  sortOrder?: SortOrder;
}

// Search schema
export const organizationSearchSchema = yup.object({
  search: yup.string().nullable().optional(),
  industry: yup.string().nullable().optional(),
  type: yup.mixed<OrganizationType>().oneOf(['B2B', 'B2C', 'B2B2C', 'Non-Profit', 'Government', 'Other']).nullable().optional(),
  size: yup.mixed<OrganizationSize>().oneOf(['Startup', 'Small', 'Medium', 'Large', 'Enterprise']).nullable().optional(),
  status: yup.mixed<OrganizationStatus>().oneOf(['Active', 'Inactive', 'Prospect', 'Customer', 'Partner', 'Vendor']).nullable().optional(),
  country: yup.string().nullable().optional(),
  min_employees: yup.number().min(0).nullable().optional(),
  max_employees: yup.number().min(0).nullable().optional(),
  min_revenue: yup.number().min(0).nullable().optional(),
  max_revenue: yup.number().min(0).nullable().optional(),
  min_lead_score: yup.number().min(0).max(100).nullable().optional(),
  max_lead_score: yup.number().min(0).max(100).nullable().optional(),
  tags: yup.array().of(yup.string()).nullable().optional(),
  limit: yup.number().min(1).max(100).optional().default(20),
  offset: yup.number().min(0).optional().default(0),
  sortBy: yup.mixed<OrganizationSortField>().oneOf(['name', 'legal_name', 'industry', 'type', 'size', 'status', 'lead_score', 'employees_count', 'annual_revenue', 'founded_year', 'created_at', 'updated_at', 'last_contact_date', 'next_follow_up_date']).optional().default('name'),
  sortOrder: yup.mixed<SortOrder>().oneOf(['asc', 'desc']).optional().default('asc')
});

// Validation error type
export interface OrganizationValidationError {
  field: string;
  message: string;
}

// Form validation result
export interface OrganizationFormValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: OrganizationValidationError[];
}

// =============================================================================
// Metrics and Analytics Types
// =============================================================================

// Organization metrics for dashboard and analytics
export interface OrganizationMetrics {
  totalOrganizations: number;
  activeOrganizations: number;
  prospects: number;
  customers: number;
  partners: number;
  averageLeadScore: number;
  totalRevenue: number;
  monthlyGrowth: number;
  industryDistribution: Array<{
    industry: string;
    count: number;
    percentage: number;
  }>;
  statusDistribution: Array<{
    status: OrganizationStatus;
    count: number;
    percentage: number;
  }>;
  recentActivity: Array<{
    date: string;
    organizationsAdded: number;
    interactionsLogged: number;
  }>;
}

// =============================================================================
// Bulk Operations Types
// =============================================================================

// Bulk operation types
export interface BulkOrganizationOperationData {
  type: 'delete' | 'update_status' | 'update_assigned_user' | 'add_tags' | 'remove_tags' | 'export';
  organizationIds: string[];
  data?: {
    status?: OrganizationStatus;
    assigned_user_id?: string;
    tags?: string[];
  };
}

export type BulkOrganizationOperation = BulkOrganizationOperationData;

export interface BulkOperationResult {
  operation: BulkOrganizationOperation;
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
}

// =============================================================================
// Enum Arrays for Form Options
// =============================================================================

export const ORGANIZATION_TYPES: OrganizationType[] = [
  'B2B', 'B2C', 'B2B2C', 'Non-Profit', 'Government', 'Other'
];

export const ORGANIZATION_SIZES: OrganizationSize[] = [
  'Startup', 'Small', 'Medium', 'Large', 'Enterprise'
];

export const ORGANIZATION_STATUSES: OrganizationStatus[] = [
  'Active', 'Inactive', 'Prospect', 'Customer', 'Partner', 'Vendor'
];

// Enhanced status options for redesigned form
export const ENHANCED_ORGANIZATION_STATUSES: EnhancedOrganizationStatus[] = [
  'Prospect', 'Active Customer', 'Inactive Customer', 'Other', 'Principal', 'Distributor'
];

// Priority options with mapping values
export const PRIORITY_OPTIONS: PriorityOption[] = [
  { value: 90, label: 'A', description: 'Highest priority - Strategic accounts' },
  { value: 70, label: 'B', description: 'High priority - Major opportunities' },
  { value: 50, label: 'C', description: 'Medium priority - Qualified prospects' },
  { value: 30, label: 'D', description: 'Lower priority - New prospects' }
];

export const INTERACTION_TYPES: InteractionType[] = [
  'Email', 'Phone', 'Meeting', 'Demo', 'Proposal', 'Contract', 
  'Note', 'Task', 'Event', 'Social', 'Website', 'Other'
];

export const INTERACTION_DIRECTIONS: InteractionDirection[] = [
  'Inbound', 'Outbound'
];

export const PERIOD_TYPES = [
  'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
] as const;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Validates organization data against the schema
 */
export const validateOrganization = async (data: unknown): Promise<OrganizationFormData> => {
  return await organizationSchema.validate(data, { abortEarly: false });
};

/**
 * Validates organization interaction data against the schema
 */
export const validateOrganizationInteraction = async (data: unknown): Promise<OrganizationInteractionFormData> => {
  return await organizationInteractionSchema.validate(data, { abortEarly: false });
};

/**
 * Validates organization document data against the schema
 */
export const validateOrganizationDocument = async (data: unknown): Promise<OrganizationDocumentFormData> => {
  return await organizationDocumentSchema.validate(data, { abortEarly: false });
};

/**
 * Validates organization analytics data against the schema
 */
export const validateOrganizationAnalytics = async (data: unknown): Promise<OrganizationAnalyticsFormData> => {
  return await organizationAnalyticsSchema.validate(data, { abortEarly: false });
};

/**
 * Gets display label for organization type
 */
export const getOrganizationTypeLabel = (type: OrganizationType | null): string => {
  if (!type) return 'Not specified';
  return type;
};

/**
 * Gets display label for organization status
 */
export const getOrganizationStatusLabel = (status: OrganizationStatus | null): string => {
  if (!status) return 'Not specified';
  return status;
};

/**
 * Gets CSS class for organization status badge
 */
export const getOrganizationStatusClass = (status: OrganizationStatus | null): string => {
  switch (status) {
    case 'Active': return 'bg-green-100 text-green-800';
    case 'Customer': return 'bg-blue-100 text-blue-800';
    case 'Prospect': return 'bg-yellow-100 text-yellow-800';
    case 'Partner': return 'bg-purple-100 text-purple-800';
    case 'Vendor': return 'bg-indigo-100 text-indigo-800';
    case 'Inactive': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Gets CSS class for enhanced organization status badge
 */
export const getEnhancedOrganizationStatusClass = (status: EnhancedOrganizationStatus | null): string => {
  switch (status) {
    case 'Active Customer': return 'bg-green-100 text-green-800';
    case 'Inactive Customer': return 'bg-gray-100 text-gray-800';
    case 'Prospect': return 'bg-yellow-100 text-yellow-800';
    case 'Principal': return 'bg-purple-100 text-purple-800';
    case 'Distributor': return 'bg-indigo-100 text-indigo-800';
    case 'Other': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Maps priority letter to lead score value
 */
export const priorityLetterToScore = (letter: OrganizationPriority): number => {
  const mapping = { 'A': 90, 'B': 70, 'C': 50, 'D': 30 };
  return mapping[letter];
};

/**
 * Maps lead score to priority letter
 */
export const scoreToPriorityLetter = (score: number | null): OrganizationPriority => {
  if (!score) return 'D';
  if (score >= 90) return 'A';
  if (score >= 70) return 'B';
  if (score >= 50) return 'C';
  return 'D';
};

/**
 * Gets CSS class for priority badge
 */
export const getPriorityClass = (priority: OrganizationPriority): string => {
  switch (priority) {
    case 'A': return 'bg-red-100 text-red-800';
    case 'B': return 'bg-orange-100 text-orange-800';
    case 'C': return 'bg-yellow-100 text-yellow-800';
    case 'D': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Gets CSS class for lead score indicator
 */
export const getLeadScoreClass = (score: number | null): string => {
  if (!score) return 'bg-gray-100 text-gray-800';
  if (score >= 80) return 'bg-red-100 text-red-800'; // Hot
  if (score >= 60) return 'bg-orange-100 text-orange-800'; // Warm
  if (score >= 40) return 'bg-yellow-100 text-yellow-800'; // Cool
  return 'bg-blue-100 text-blue-800'; // Cold
};

/**
 * Gets lead temperature label
 */
export const getLeadTemperatureLabel = (score: number | null): string => {
  if (!score) return 'Cold';
  if (score >= 80) return 'Hot';
  if (score >= 60) return 'Warm';
  if (score >= 40) return 'Cool';
  return 'Cold';
};

// Re-export database types for convenience
export type {
  Organization,
  OrganizationType,
  OrganizationSize,
  OrganizationStatus,
  InteractionType,
  InteractionDirection
} from './database.types';