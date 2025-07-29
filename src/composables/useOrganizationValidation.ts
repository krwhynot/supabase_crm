/**
 * Organization validation composable
 * Provides comprehensive form validation for organization forms
 * Follows established patterns from useFormValidation.ts
 */

import { computed } from 'vue'
import { useFormValidation } from '@/composables/useFormValidation'
import type { FormValidationOptions } from '@/composables/useFormValidation'
import type {
  OrganizationCreateForm,
  OrganizationUpdateForm,
  OrganizationInteractionCreateForm,
  OrganizationSearchForm
} from '@/types/organizations'
import {
  organizationCreateSchema,
  organizationUpdateSchema,
  organizationInteractionCreateSchema,
  organizationSearchSchema
} from '@/types/organizations'
import { OrganizationValidator, organizationFieldValidators } from '@/types/organization-validation'

/**
 * Organization creation form validation composable
 */
export function useOrganizationCreateValidation(
  initialData: OrganizationCreateForm,
  options: FormValidationOptions = {}
) {
  const baseDefaults = {
    name: '',
    legal_name: null,
    description: null,
    industry: null,
    type: null,
    size: null,
    status: 'Prospect' as const,
    website: null,
    email: null,
    primary_phone: null,
    secondary_phone: null,
    address_line_1: null,
    address_line_2: null,
    city: null,
    state_province: null,
    postal_code: null,
    country: null,
    founded_year: null,
    employees_count: null,
    annual_revenue: null,
    currency_code: null,
    lead_source: null,
    lead_score: null,
    parent_org_id: null,
    tags: null,
    next_follow_up_date: null
  }
  
  const defaultData: OrganizationCreateForm = {
    ...baseDefaults,
    ...initialData
  }

  const validation = useFormValidation(
    organizationCreateSchema,
    defaultData,
    {
      validateOnBlur: true,
      validateOnChange: false,
      debounceMs: 300,
      ...options
    }
  )

  // Additional computed properties specific to organization creation
  const isReadyToSubmit = computed(() => {
    return validation.isValid.value && 
           validation.formData.name.trim().length > 0 &&
           !validation.isSubmitting.value
  })

  const requiredFieldsCompleted = computed(() => {
    return validation.formData.name.trim().length > 0
  })

  const businessFieldsCompleted = computed(() => {
    return !!(
      validation.formData.industry ||
      validation.formData.type ||
      validation.formData.size ||
      validation.formData.website
    )
  })

  const contactFieldsCompleted = computed(() => {
    return !!(
      validation.formData.email ||
      validation.formData.primary_phone
    )
  })

  const addressFieldsCompleted = computed(() => {
    return !!(
      validation.formData.address_line_1 ||
      validation.formData.city ||
      validation.formData.country
    )
  })

  // Custom validation for business rules
  const validateBusinessRules = async () => {
    const businessRuleErrors = OrganizationValidator.validateBusinessRules(validation.formData)
    
    // Clear previous business rule errors
    const businessRuleFields = ['employees_count', 'annual_revenue', 'secondary_phone', 'lead_score']
    businessRuleFields.forEach(field => {
      const currentError = validation.getFieldState(field as keyof OrganizationCreateForm).error
      if (currentError && businessRuleErrors.some(err => err.field === field)) {
        validation.setFieldError(field as keyof OrganizationCreateForm, '')
      }
    })
    
    // Set new business rule errors
    businessRuleErrors.forEach(error => {
      validation.setFieldError(error.field as keyof OrganizationCreateForm, error.message)
    })
    
    return businessRuleErrors.length === 0
  }

  // Enhanced submit handler with business rule validation
  const handleSubmitWithBusinessRules = async (submitFn: (data: OrganizationCreateForm) => Promise<void> | void) => {
    // First run standard validation
    const standardValidation = await validation.validateForm()
    if (!standardValidation.isValid) {
      await validation.focusFirstError()
      return false
    }

    // Then run business rule validation
    const businessRulesValid = await validateBusinessRules()
    if (!businessRulesValid) {
      await validation.focusFirstError()
      return false
    }

    // Finally submit
    try {
      await validation.handleSubmit(submitFn)
      return true
    } catch (error) {
      console.error('Submission error:', error)
      return false
    }
  }

  return {
    ...validation,
    
    // Additional computed properties
    isReadyToSubmit,
    requiredFieldsCompleted,
    businessFieldsCompleted,
    contactFieldsCompleted,
    addressFieldsCompleted,
    
    // Enhanced methods
    validateBusinessRules,
    handleSubmitWithBusinessRules,
    
    // Field validators for real-time validation
    fieldValidators: organizationFieldValidators
  }
}

/**
 * Organization update form validation composable
 */
export function useOrganizationUpdateValidation(
  initialData: OrganizationUpdateForm,
  options: FormValidationOptions = {}
) {
  const baseDefaults: Partial<OrganizationUpdateForm> = {
    name: undefined,
    legal_name: undefined,
    description: undefined,
    industry: undefined,
    type: undefined,
    size: undefined,
    status: undefined,
    website: undefined,
    email: undefined,
    primary_phone: undefined,
    secondary_phone: undefined,
    address_line_1: undefined,
    address_line_2: undefined,
    city: undefined,
    state_province: undefined,
    postal_code: undefined,
    country: undefined,
    founded_year: undefined,
    employees_count: undefined,
    annual_revenue: undefined,
    currency_code: undefined,
    lead_source: undefined,
    lead_score: undefined,
    parent_org_id: undefined,
    tags: undefined,
    next_follow_up_date: undefined
  }
  
  const defaultData: OrganizationUpdateForm = {
    ...baseDefaults,
    ...initialData
  }

  const validation = useFormValidation(
    organizationUpdateSchema,
    defaultData,
    {
      validateOnBlur: true,
      validateOnChange: false,
      debounceMs: 300,
      ...options
    }
  )

  // Check if any fields have been modified
  const hasChanges = computed(() => {
    return Object.values(validation.formData).some(value => value !== undefined)
  })

  const isReadyToSubmit = computed(() => {
    return validation.isValid.value && 
           hasChanges.value &&
           !validation.isSubmitting.value
  })

  // Custom validation for business rules (same as create)
  const validateBusinessRules = async () => {
    const businessRuleErrors = OrganizationValidator.validateBusinessRules(validation.formData)
    
    businessRuleErrors.forEach(error => {
      validation.setFieldError(error.field as keyof OrganizationUpdateForm, error.message)
    })
    
    return businessRuleErrors.length === 0
  }

  const handleSubmitWithBusinessRules = async (submitFn: (data: OrganizationUpdateForm) => Promise<void> | void) => {
    const standardValidation = await validation.validateForm()
    if (!standardValidation.isValid) {
      await validation.focusFirstError()
      return false
    }

    const businessRulesValid = await validateBusinessRules()
    if (!businessRulesValid) {
      await validation.focusFirstError()
      return false
    }

    try {
      await validation.handleSubmit(submitFn)
      return true
    } catch (error) {
      console.error('Submission error:', error)
      return false
    }
  }

  return {
    ...validation,
    
    // Additional computed properties
    hasChanges,
    isReadyToSubmit,
    
    // Enhanced methods
    validateBusinessRules,
    handleSubmitWithBusinessRules,
    
    // Field validators
    fieldValidators: organizationFieldValidators
  }
}

/**
 * Organization interaction form validation composable
 */
export function useOrganizationInteractionValidation(
  initialData: OrganizationInteractionCreateForm,
  options: FormValidationOptions = {}
) {
  const baseDefaults = {
    organization_id: '',
    contact_id: null,
    type: 'Note' as const,
    direction: null,
    subject: null,
    description: null,
    interaction_date: new Date(),
    duration_minutes: null,
    tags: null
  }
  
  const defaultData: OrganizationInteractionCreateForm = {
    ...baseDefaults,
    ...initialData
  }

  const validation = useFormValidation(
    organizationInteractionCreateSchema,
    defaultData,
    {
      validateOnBlur: true,
      validateOnChange: false,
      debounceMs: 300,
      ...options
    }
  )

  const isReadyToSubmit = computed(() => {
    return validation.isValid.value && 
           validation.formData.organization_id.length > 0 &&
           !validation.isSubmitting.value
  })

  const hasContent = computed(() => {
    return !!(
      validation.formData.subject?.trim() ||
      validation.formData.description?.trim()
    )
  })

  return {
    ...validation,
    
    // Additional computed properties
    isReadyToSubmit,
    hasContent
  }
}

/**
 * Organization search form validation composable
 */
export function useOrganizationSearchValidation(
  initialData: OrganizationSearchForm,
  options: FormValidationOptions = {}
) {
  const baseDefaults = {
    search: '',
    industry: null,
    type: null,
    size: null,
    status: null,
    country: null,
    min_employees: null,
    max_employees: null,
    min_revenue: null,
    max_revenue: null,
    min_lead_score: null,
    max_lead_score: null,
    tags: null,
    limit: 20,
    offset: 0,
    sortBy: 'name' as const,
    sortOrder: 'asc' as const
  }
  
  const defaultData: OrganizationSearchForm = {
    ...baseDefaults,
    ...initialData
  }

  const validation = useFormValidation(
    organizationSearchSchema,
    defaultData,
    {
      validateOnBlur: false,
      validateOnChange: true,
      debounceMs: 500,
      ...options
    }
  )

  const hasSearchCriteria = computed(() => {
    return !!(
      validation.formData.search?.trim() ||
      validation.formData.industry ||
      validation.formData.type ||
      validation.formData.size ||
      validation.formData.status ||
      validation.formData.country ||
      validation.formData.min_employees !== null ||
      validation.formData.max_employees !== null ||
      validation.formData.min_revenue !== null ||
      validation.formData.max_revenue !== null ||
      validation.formData.min_lead_score !== null ||
      validation.formData.max_lead_score !== null ||
      validation.formData.tags?.length
    )
  })

  // Custom validation for range fields
  const validateRanges = () => {
    const errors: string[] = []
    
    if (validation.formData.min_employees !== null && validation.formData.min_employees !== undefined &&
        validation.formData.max_employees !== null && validation.formData.max_employees !== undefined &&
        validation.formData.min_employees > validation.formData.max_employees) {
      validation.setFieldError('max_employees', 'Maximum employees must be greater than minimum')
      errors.push('Employee range is invalid')
    }
    
    if (validation.formData.min_revenue !== null && validation.formData.min_revenue !== undefined &&
        validation.formData.max_revenue !== null && validation.formData.max_revenue !== undefined &&
        validation.formData.min_revenue > validation.formData.max_revenue) {
      validation.setFieldError('max_revenue', 'Maximum revenue must be greater than minimum')
      errors.push('Revenue range is invalid')
    }
    
    if (validation.formData.min_lead_score !== null && validation.formData.min_lead_score !== undefined &&
        validation.formData.max_lead_score !== null && validation.formData.max_lead_score !== undefined &&
        validation.formData.min_lead_score > validation.formData.max_lead_score) {
      validation.setFieldError('max_lead_score', 'Maximum lead score must be greater than minimum')
      errors.push('Lead score range is invalid')
    }
    
    return errors.length === 0
  }

  return {
    ...validation,
    
    // Additional computed properties
    hasSearchCriteria,
    
    // Custom validation methods
    validateRanges
  }
}

/**
 * Multi-step organization wizard validation composable
 */
export function useOrganizationWizardValidation(initialData: OrganizationCreateForm) {
  // Step definitions
  const steps = [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Enter organization name and basic details',
      fields: ['name', 'legal_name', 'description', 'status'] as Array<keyof OrganizationCreateForm>
    },
    {
      id: 'business',
      title: 'Business Details',
      description: 'Industry, type, size, and financial information',
      fields: ['industry', 'type', 'size', 'founded_year', 'employees_count', 'annual_revenue', 'currency_code'] as Array<keyof OrganizationCreateForm>
    },
    {
      id: 'contact',
      title: 'Contact Information',
      description: 'Website, email, and phone numbers',
      fields: ['website', 'email', 'primary_phone', 'secondary_phone'] as Array<keyof OrganizationCreateForm>
    },
    {
      id: 'address',
      title: 'Address',
      description: 'Location and address information',
      fields: ['address_line_1', 'address_line_2', 'city', 'state_province', 'postal_code', 'country'] as Array<keyof OrganizationCreateForm>
    },
    {
      id: 'additional',
      title: 'Additional Details',
      description: 'Lead information, tags, and follow-up',
      fields: ['lead_source', 'lead_score', 'parent_org_id', 'tags', 'next_follow_up_date'] as Array<keyof OrganizationCreateForm>
    }
  ]

  const validation = useOrganizationCreateValidation(initialData, {
    validateOnBlur: true,
    validateOnChange: false
  })

  // Current step tracking
  const currentStepIndex = computed(() => 0) // This would be managed by parent component
  const currentStep = computed(() => steps[currentStepIndex.value])

  // Step validation
  const validateStep = (stepIndex: number): Promise<boolean> => {
    const step = steps[stepIndex]
    if (!step) return Promise.resolve(false)

    return Promise.all(
      step.fields.map(field => validation.validateField(field))
    ).then(results => {
      return results.every(error => !error)
    })
  }

  const isStepValid = (stepIndex: number): boolean => {
    const step = steps[stepIndex]
    if (!step) return false

    return step.fields.every(field => {
      const fieldState = validation.getFieldState(field)
      return !fieldState.error
    })
  }

  const getStepProgress = (stepIndex: number): number => {
    const step = steps[stepIndex]
    if (!step) return 0

    const completedFields = step.fields.filter(field => {
      const value = validation.formData[field]
      return value !== null && value !== undefined && value !== ''
    }).length

    return Math.round((completedFields / step.fields.length) * 100)
  }

  return {
    ...validation,
    
    // Step management
    steps,
    currentStep,
    currentStepIndex,
    
    // Step validation methods
    validateStep,
    isStepValid,
    getStepProgress
  }
}