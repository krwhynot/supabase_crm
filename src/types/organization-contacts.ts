// =============================================================================
// Organization-Contacts Relationship Types
// =============================================================================
// TypeScript types for organization-contact relationships and contact integration
// Created for Organization Form Redesign - Stage 3.2 Contact Integration
// =============================================================================

import * as yup from 'yup';
import type { Database } from './database.types';

// =============================================================================
// Database Relationship Types - Stage 3.2
// =============================================================================

// Organization-Contact junction table types (when implemented)
export type OrganizationContactRecord = {
  id: string;
  organization_id: string;
  contact_id: string;
  is_primary_contact: boolean;
  role?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type OrganizationContactInsert = Omit<OrganizationContactRecord, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type OrganizationContactUpdate = Partial<OrganizationContactInsert>;

// Contact record types from existing database
export type ContactRecord = Database['public']['Tables']['contacts']['Row'];
export type ContactInsert = Database['public']['Tables']['contacts']['Insert'];
export type ContactUpdate = Database['public']['Tables']['contacts']['Update'];

// =============================================================================
// Contact Selector Types - Stage 3.2
// =============================================================================

// Contact option for selection components
export interface ContactOption {
  id: string;
  label: string; // "First Last"
  email?: string;
  organization?: string;
  avatar?: string;
  position?: string;
}

// Contact selector component props
export interface ContactSelectorProps {
  modelValue: string[];
  availableContacts: ContactOption[];
  placeholder?: string;
  error?: string;
  allowMultiple?: boolean;
  allowCreate?: boolean;
  loading?: boolean;
}

// Contact multi-selector component props
export interface ContactMultiSelectorProps {
  modelValue: string[];
  error?: string;
  placeholder?: string;
  maxSelections?: number;
}

// =============================================================================
// Quick Contact Creation Types - Stage 3.2
// =============================================================================

// Quick contact form for rapid creation during organization setup
export interface QuickContactForm {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  position?: string;
}

// Quick contact validation schema
export const quickContactSchema = yup.object({
  first_name: yup
    .string()
    .required('First name is required')
    .trim()
    .min(1, 'First name cannot be empty')
    .max(100, 'First name must be less than 100 characters'),
  
  last_name: yup
    .string()
    .required('Last name is required')
    .trim()
    .min(1, 'Last name cannot be empty')
    .max(100, 'Last name must be less than 100 characters'),
  
  email: yup
    .string()
    .nullable()
    .email('Must be a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  
  phone: yup
    .string()
    .nullable()
    .max(50, 'Phone number must be less than 50 characters'),
  
  position: yup
    .string()
    .nullable()
    .max(100, 'Position must be less than 100 characters')
});

// Type inference for quick contact form
export type QuickContactFormData = yup.InferType<typeof quickContactSchema>;

// =============================================================================
// Contact Search and Filter Types - Stage 3.2
// =============================================================================

// Contact search parameters
export interface ContactSearchParams {
  query?: string;
  organization_id?: string;
  excludeIds?: string[];
  limit?: number;
  offset?: number;
}

// Contact search results
export interface ContactSearchResult {
  contacts: ContactOption[];
  totalCount: number;
  hasMore: boolean;
}

// =============================================================================
// Organization-Contact Relationship Management - Stage 3.2
// =============================================================================

// Relationship creation data
export interface CreateContactRelationshipData {
  organization_id: string;
  contact_id: string;
  is_primary_contact?: boolean;
  role?: string;
  notes?: string;
}

// Bulk relationship creation for multiple contacts
export interface BulkCreateContactRelationshipsData {
  organization_id: string;
  contact_relationships: Array<{
    contact_id: string;
    is_primary_contact?: boolean;
    role?: string;
    notes?: string;
  }>;
}

// Relationship update data
export interface UpdateContactRelationshipData {
  is_primary_contact?: boolean;
  role?: string;
  notes?: string;
}

// =============================================================================
// Contact Integration Form Types - Stage 3.2
// =============================================================================

// Extended contact form data for organization integration
export interface ContactWithOrganizationData extends QuickContactForm {
  organization_relationship?: {
    is_primary_contact: boolean;
    role?: string;
    notes?: string;
  };
}

// Contact assignment for organization creation
export interface ContactAssignmentData {
  existing_contact_ids: string[];
  new_contacts: QuickContactForm[];
}

// =============================================================================
// Validation and Helper Functions - Stage 3.2
// =============================================================================

/**
 * Validates quick contact form data
 */
export const validateQuickContact = async (data: unknown): Promise<QuickContactFormData> => {
  return await quickContactSchema.validate(data, { abortEarly: false });
};

/**
 * Converts contact record to contact option
 */
export const contactRecordToOption = (contact: ContactRecord): ContactOption => {
  return {
    id: contact.id,
    label: `${contact.first_name} ${contact.last_name}`,
    email: contact.email || undefined,
    position: contact.position || undefined,
    // Note: organization name would come from joined data in real implementation
  };
};

/**
 * Creates display label for contact
 */
export const getContactDisplayLabel = (contact: ContactOption): string => {
  const parts = [contact.label];
  if (contact.position) parts.push(`(${contact.position})`);
  if (contact.email) parts.push(`<${contact.email}>`);
  return parts.join(' ');
};

/**
 * Validates contact relationship data
 */
export const validateContactRelationship = (data: CreateContactRelationshipData): boolean => {
  return !!(data.organization_id && data.contact_id);
};

/**
 * Gets primary contact from relationship list
 */
export const getPrimaryContact = (relationships: OrganizationContactRecord[]): OrganizationContactRecord | null => {
  return relationships.find(rel => rel.is_primary_contact) || null;
};

/**
 * Sorts contacts by primary status and name
 */
export const sortContactsByPriority = (
  contacts: ContactOption[], 
  relationships: OrganizationContactRecord[]
): ContactOption[] => {
  const relationshipMap = new Map(relationships.map(rel => [rel.contact_id, rel]));
  
  return contacts.sort((a, b) => {
    const aRel = relationshipMap.get(a.id);
    const bRel = relationshipMap.get(b.id);
    
    // Primary contacts first
    if (aRel?.is_primary_contact && !bRel?.is_primary_contact) return -1;
    if (!aRel?.is_primary_contact && bRel?.is_primary_contact) return 1;
    
    // Then alphabetical by name
    return a.label.localeCompare(b.label);
  });
};

// =============================================================================
// Constants and Enums - Stage 3.2
// =============================================================================

// Common contact roles for organization relationships
export const CONTACT_ROLES = [
  'Primary Contact',
  'Secondary Contact', 
  'Decision Maker',
  'Technical Contact',
  'Billing Contact',
  'Account Manager',
  'Project Manager',
  'Other'
] as const;

export type ContactRole = typeof CONTACT_ROLES[number];

// Maximum number of contacts that can be assigned to an organization
export const MAX_CONTACTS_PER_ORGANIZATION = 20;

// Default role for new contact relationships
export const DEFAULT_CONTACT_ROLE = 'Primary Contact';

// =============================================================================
// Error Types - Stage 3.2
// =============================================================================

// Contact-related error types
export interface ContactValidationError {
  field: string;
  message: string;
  code?: string;
}

// Contact operation result
export interface ContactOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: ContactValidationError[];
}

// Bulk operation result for contact relationships
export interface BulkContactRelationshipResult {
  success: boolean;
  created: number;
  failed: number;
  errors: Array<{
    contact_id: string;
    error: string;
  }>;
}