import * as yup from 'yup'
import { ProductCategory } from './products'

/**
 * ProductFormWrapper data interface - Multi-step form state management
 */
export interface ProductFormWrapperData {
  // Step 1: Basic Information
  name: string
  category: ProductCategory | null
  description: string
  sku: string
  autoGenerateSku: boolean
  isActive: boolean
  
  // Step 2: Product Details & Pricing
  unitPrice: number | null
  costPrice: number | null
  currency: string
  unitOfMeasure: string
  minimumOrderQuantity: number | null
  leadTimeDays: number | null
  specifications: ProductSpecification[]
  
  // Step 3: Principal Assignment
  selectedPrincipals: string[]
  principalRequired: boolean
  bulkAssignMode: boolean
  
  // Step 4: Review & Confirmation
  termsAccepted: boolean
  notificationEmails: string[]
  saveAsDraft: boolean
}

/**
 * Product specification key-value pair interface
 */
export interface ProductSpecification {
  id: string
  key: string
  value: string
  isRequired: boolean
}

/**
 * Product form validation states
 */
export interface ProductFormValidationErrors {
  // Step 1 errors
  name?: string
  category?: string
  description?: string
  sku?: string
  
  // Step 2 errors
  unitPrice?: string
  costPrice?: string
  currency?: string
  unitOfMeasure?: string
  minimumOrderQuantity?: string
  leadTimeDays?: string
  specifications?: string
  
  // Step 3 errors
  selectedPrincipals?: string
  
  // Step 4 errors
  termsAccepted?: string
  notificationEmails?: string
}

/**
 * Product form step information
 */
export interface ProductFormStep {
  id: number
  key: string
  label: string
  description: string
  isRequired: boolean
  isCompleted: boolean
  hasErrors: boolean
}

/**
 * Available currency options
 */
export enum Currency {
  USD = 'USD',
  CAD = 'CAD',
  EUR = 'EUR',
  GBP = 'GBP'
}

/**
 * Unit of measure options
 */
export enum UnitOfMeasure {
  EACH = 'Each',
  CASE = 'Case',
  BOX = 'Box',
  POUND = 'Pound',
  KILOGRAM = 'Kilogram',
  LITER = 'Liter',
  GALLON = 'Gallon',
  OUNCE = 'Ounce',
  GRAM = 'Gram',
  DOZEN = 'Dozen',
  PALLET = 'Pallet'
}

/**
 * Product creation result interface
 */
export interface ProductCreationResult {
  productId: string
  productName: string
  assignedPrincipals: number
  success: boolean
  message: string
}

/**
 * Principal assignment preview for bulk operations
 */
export interface PrincipalAssignmentPreview {
  principalId: string
  principalName: string
  principalType: string
  isAssigned: boolean
  canAccess: boolean
  restrictionReason?: string
}

/**
 * Auto-SKU generation options
 */
export interface SkuGenerationOptions {
  prefix?: string
  categoryCode?: string
  sequenceNumber?: number
  includeDateCode?: boolean
  customFormat?: string
}

/**
 * Form submission states
 */
export enum ProductFormSubmissionState {
  IDLE = 'idle',
  VALIDATING = 'validating',
  SUBMITTING = 'submitting',
  SUCCESS = 'success',
  ERROR = 'error',
  DRAFT_SAVING = 'draft_saving',
  DRAFT_SAVED = 'draft_saved'
}

/**
 * Validation schema for Step 1: Basic Information
 */
export const productFormStep1ValidationSchema = yup.object({
  name: yup
    .string()
    .required('Product name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name must be less than 200 characters')
    .matches(/^[a-zA-Z0-9\s\-_&.()]+$/, 'Name contains invalid characters'),
    
  category: yup
    .string()
    .required('Category is required')
    .oneOf(Object.values(ProductCategory), 'Invalid category selected'),
    
  description: yup
    .string()
    .max(1000, 'Description must be less than 1000 characters'),
    
  sku: yup
    .string()
    .when('autoGenerateSku', {
      is: false,
      then: (schema) => schema.required('SKU is required when not auto-generating'),
      otherwise: (schema) => schema
    })
    .max(50, 'SKU must be less than 50 characters')
    .matches(/^[A-Z0-9\-_]+$/i, 'SKU can only contain letters, numbers, hyphens, and underscores'),
    
  autoGenerateSku: yup.boolean().default(true),
  
  isActive: yup.boolean().default(true)
})

/**
 * Validation schema for Step 2: Product Details & Pricing
 */
export const productFormStep2ValidationSchema = yup.object({
  unitPrice: yup
    .number()
    .nullable()
    .min(0, 'Price cannot be negative')
    .max(999999.99, 'Price cannot exceed $999,999.99'),
    
  costPrice: yup
    .number()
    .nullable()
    .min(0, 'Cost price cannot be negative')
    .max(999999.99, 'Cost price cannot exceed $999,999.99'),
    
  currency: yup
    .string()
    .oneOf(Object.values(Currency), 'Invalid currency selected')
    .default(Currency.USD),
    
  unitOfMeasure: yup
    .string()
    .required('Unit of measure is required')
    .oneOf(Object.values(UnitOfMeasure), 'Invalid unit of measure'),
    
  minimumOrderQuantity: yup
    .number()
    .nullable()
    .min(1, 'Minimum order quantity must be at least 1')
    .max(99999, 'Minimum order quantity cannot exceed 99,999'),
    
  leadTimeDays: yup
    .number()
    .nullable()
    .min(0, 'Lead time cannot be negative')
    .max(365, 'Lead time cannot exceed 365 days'),
    
  specifications: yup
    .array()
    .of(
      yup.object({
        key: yup.string().required('Specification key is required').max(100, 'Key too long'),
        value: yup.string().required('Specification value is required').max(500, 'Value too long'),
        isRequired: yup.boolean().default(false)
      })
    )
    .max(20, 'Cannot have more than 20 specifications')
})

/**
 * Validation schema for Step 3: Principal Assignment
 */
export const productFormStep3ValidationSchema = yup.object({
  selectedPrincipals: yup
    .array(yup.string().uuid('Invalid principal ID'))
    .min(1, 'At least one principal must be assigned')
    .required('Principal assignment is required'),
    
  principalRequired: yup.boolean().default(true),
  
  bulkAssignMode: yup.boolean().default(false)
})

/**
 * Validation schema for Step 4: Review & Confirmation
 */
export const productFormStep4ValidationSchema = yup.object({
  termsAccepted: yup
    .boolean()
    .required('Terms and conditions must be accepted')
    .oneOf([true], 'You must accept the terms and conditions'),
    
  notificationEmails: yup
    .array()
    .of(yup.string().email('Invalid email address'))
    .max(5, 'Cannot add more than 5 notification emails'),
    
  saveAsDraft: yup.boolean().default(false)
})

/**
 * Complete product form validation schema
 */
export const productFormCompleteValidationSchema = yup.object({
  ...productFormStep1ValidationSchema.fields,
  ...productFormStep2ValidationSchema.fields,
  ...productFormStep3ValidationSchema.fields,
  ...productFormStep4ValidationSchema.fields
})

/**
 * Type inference from validation schemas
 */
export type ProductFormStep1Validation = yup.InferType<typeof productFormStep1ValidationSchema>
export type ProductFormStep2Validation = yup.InferType<typeof productFormStep2ValidationSchema>
export type ProductFormStep3Validation = yup.InferType<typeof productFormStep3ValidationSchema>
export type ProductFormStep4Validation = yup.InferType<typeof productFormStep4ValidationSchema>
export type ProductFormCompleteValidation = yup.InferType<typeof productFormCompleteValidationSchema>

/**
 * Form context data for pre-populating forms
 */
export interface ProductFormContext {
  contextType?: 'principal' | 'category' | 'duplicate'
  principalId?: string
  principalName?: string
  category?: ProductCategory
  duplicateFromId?: string
  organizationId?: string
}

/**
 * Auto-complete suggestions for form fields
 */
export interface ProductFormSuggestions {
  names: string[]
  descriptions: string[]
  skus: string[]
  specifications: { key: string; values: string[] }[]
}

/**
 * Form draft data for auto-save functionality
 */
export interface ProductFormDraft {
  id: string
  formData: Partial<ProductFormWrapperData>
  step: number
  createdAt: string
  updatedAt: string
  expiresAt: string
}

/**
 * Bulk principal assignment interface
 */
export interface BulkPrincipalAssignment {
  principalIds: string[]
  assignmentType: 'add' | 'remove' | 'replace'
  reason?: string
  notifyPrincipals: boolean
}

/**
 * Product form analytics data
 */
export interface ProductFormAnalytics {
  stepCompletionTimes: Record<number, number>
  totalFormTime: number
  errorsByStep: Record<number, string[]>
  dropoffStep?: number
  completionRate: number
}

/**
 * Category-specific validation rules
 */
export const CATEGORY_VALIDATION_RULES: Record<ProductCategory, Partial<any>> = {
  [ProductCategory.PROTEIN]: {
    requiredSpecs: ['Weight', 'Storage Temperature'],
    unitOfMeasure: [UnitOfMeasure.POUND, UnitOfMeasure.KILOGRAM]
  },
  [ProductCategory.SAUCE]: {
    requiredSpecs: ['Volume', 'Shelf Life'],
    unitOfMeasure: [UnitOfMeasure.LITER, UnitOfMeasure.GALLON, UnitOfMeasure.OUNCE]
  },
  [ProductCategory.SEASONING]: {
    requiredSpecs: ['Net Weight', 'Ingredients'],
    unitOfMeasure: [UnitOfMeasure.OUNCE, UnitOfMeasure.GRAM, UnitOfMeasure.POUND]
  },
  [ProductCategory.BEVERAGE]: {
    requiredSpecs: ['Volume', 'Alcohol Content'],
    unitOfMeasure: [UnitOfMeasure.LITER, UnitOfMeasure.GALLON, UnitOfMeasure.OUNCE]
  },
  [ProductCategory.SNACK]: {
    requiredSpecs: ['Net Weight', 'Serving Size'],
    unitOfMeasure: [UnitOfMeasure.OUNCE, UnitOfMeasure.GRAM, UnitOfMeasure.POUND]
  },
  [ProductCategory.FROZEN]: {
    requiredSpecs: ['Weight', 'Storage Temperature', 'Shelf Life'],
    unitOfMeasure: [UnitOfMeasure.POUND, UnitOfMeasure.KILOGRAM, UnitOfMeasure.OUNCE]
  },
  [ProductCategory.DAIRY]: {
    requiredSpecs: ['Volume/Weight', 'Expiration', 'Fat Content'],
    unitOfMeasure: [UnitOfMeasure.LITER, UnitOfMeasure.GALLON, UnitOfMeasure.POUND]
  },
  [ProductCategory.BAKERY]: {
    requiredSpecs: ['Weight', 'Ingredients', 'Shelf Life'],
    unitOfMeasure: [UnitOfMeasure.EACH, UnitOfMeasure.DOZEN, UnitOfMeasure.POUND]
  },
  [ProductCategory.OTHER]: {
    requiredSpecs: [],
    unitOfMeasure: Object.values(UnitOfMeasure)
  }
}

/**
 * Default form values
 */
export const DEFAULT_PRODUCT_FORM_DATA: ProductFormWrapperData = {
  // Step 1: Basic Information
  name: '',
  category: null,
  description: '',
  sku: '',
  autoGenerateSku: true,
  isActive: true,
  
  // Step 2: Product Details & Pricing
  unitPrice: null,
  costPrice: null,
  currency: Currency.USD,
  unitOfMeasure: UnitOfMeasure.EACH,
  minimumOrderQuantity: null,
  leadTimeDays: null,
  specifications: [],
  
  // Step 3: Principal Assignment
  selectedPrincipals: [],
  principalRequired: true,
  bulkAssignMode: false,
  
  // Step 4: Review & Confirmation
  termsAccepted: false,
  notificationEmails: [],
  saveAsDraft: false
}