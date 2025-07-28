/**
 * Enhanced form validation composable with TypeScript support
 * Provides comprehensive form validation with real-time feedback
 */

import { ref, reactive, computed, nextTick } from 'vue'
import type { Ref } from 'vue'
import * as yup from 'yup'

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
  firstError?: string
}

/**
 * Field validation state
 */
export interface FieldState {
  error: string
  touched: boolean
  dirty: boolean
  validating: boolean
}

/**
 * Form validation options
 */
export interface FormValidationOptions {
  validateOnBlur?: boolean
  validateOnChange?: boolean
  validateOnMount?: boolean
  debounceMs?: number
}

/**
 * Enhanced form validation composable
 */
export function useFormValidation<T extends Record<string, any>>(
  schema: yup.ObjectSchema<T>,
  initialData: T,
  options: FormValidationOptions = {}
) {
  const {
    validateOnBlur = true,
    validateOnChange = false,
    validateOnMount = false,
    debounceMs = 300
  } = options

  // Form data and state
  const formData = reactive<T>({ ...initialData })
  const fieldStates = reactive<Record<keyof T, FieldState>>({} as Record<keyof T, FieldState>)
  const isSubmitting = ref(false)
  const hasBeenSubmitted = ref(false)

  // Initialize field states
  Object.keys(initialData).forEach(key => {
    fieldStates[key as keyof T] = {
      error: '',
      touched: false,
      dirty: false,
      validating: false
    }
  })

  // Debounce validation
  const validationTimeouts = new Map<keyof T, NodeJS.Timeout>()

  /**
   * Computed properties for form state
   */
  const errors = computed(() => {
    const errorObj: Record<string, string> = {}
    Object.entries(fieldStates).forEach(([key, state]) => {
      if (state.error) {
        errorObj[key] = state.error
      }
    })
    return errorObj
  })

  const isValid = computed(() => {
    return Object.values(fieldStates).every(state => !state.error)
  })

  const isDirty = computed(() => {
    return Object.values(fieldStates).some(state => state.dirty)
  })

  const touchedFields = computed(() => {
    return Object.entries(fieldStates)
      .filter(([, state]) => state.touched)
      .map(([key]) => key)
  })

  const hasErrors = computed(() => {
    return Object.values(fieldStates).some(state => state.error)
  })

  const firstError = computed(() => {
    const firstErrorField = Object.entries(fieldStates).find(([, state]) => state.error)
    return firstErrorField?.[1].error
  })

  /**
   * Validate a single field
   */
  const validateField = async (fieldName: keyof T, showError = true): Promise<string> => {
    const state = fieldStates[fieldName]
    if (!state) return ''

    // Clear existing timeout
    const existingTimeout = validationTimeouts.get(fieldName)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    state.validating = true

    try {
      const value = formData[fieldName]
      await schema.validateAt(String(fieldName), { [fieldName]: value })
      
      if (showError) {
        state.error = ''
      }
      return ''
    } catch (error) {
      const errorMessage = error instanceof yup.ValidationError ? error.message : 'Validation failed'
      
      if (showError) {
        state.error = errorMessage
      }
      return errorMessage
    } finally {
      state.validating = false
    }
  }

  /**
   * Validate a field with debouncing
   */
  const validateFieldDebounced = (fieldName: keyof T, showError = true): Promise<string> => {
    return new Promise((resolve) => {
      const existingTimeout = validationTimeouts.get(fieldName)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
      }

      const timeout = setTimeout(async () => {
        const error = await validateField(fieldName, showError)
        resolve(error)
      }, debounceMs)

      validationTimeouts.set(fieldName, timeout)
    })
  }

  /**
   * Validate all fields
   */
  const validateForm = async (): Promise<ValidationResult> => {
    try {
      await schema.validate(formData, { abortEarly: false })
      
      // Clear all errors
      Object.keys(fieldStates).forEach(key => {
        fieldStates[key as keyof T].error = ''
      })

      return {
        isValid: true,
        errors: {}
      }
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        // Clear previous errors
        Object.keys(fieldStates).forEach(key => {
          fieldStates[key as keyof T].error = ''
        })

        // Set new errors
        const newErrors: Record<string, string> = {}
        error.inner.forEach(err => {
          if (err.path) {
            const fieldName = err.path as keyof T
            fieldStates[fieldName].error = err.message
            newErrors[String(fieldName)] = err.message
          }
        })

        return {
          isValid: false,
          errors: newErrors,
          firstError: error.inner[0]?.message
        }
      }

      return {
        isValid: false,                                                         
        errors: { general: 'Validation failed' },
        firstError: 'Validation failed'
      }
    }
  }

  /**
   * Touch a field (mark as interacted with)
   */
  const touchField = (fieldName: keyof T) => {
    const state = fieldStates[fieldName]
    if (state) {
      state.touched = true
    }
  }

  /**
   * Mark field as dirty (value changed)
   */
  const markFieldDirty = (fieldName: keyof T) => {
    const state = fieldStates[fieldName]
    if (state) {
      state.dirty = true
    }
  }

  /**
   * Handle field blur event
   */
  const handleFieldBlur = async (fieldName: keyof T) => {
    touchField(fieldName)
    
    if (validateOnBlur || hasBeenSubmitted.value) {
      await validateField(fieldName)
    }
  }

  /**
   * Handle field change event
   */
  const handleFieldChange = async (fieldName: keyof T, value: any) => {
    formData[fieldName] = value
    markFieldDirty(fieldName)
    
    if (validateOnChange || hasBeenSubmitted.value) {
      await validateFieldDebounced(fieldName)
    }
  }

  /**
   * Reset form to initial state
   */
  const resetForm = (newData?: Partial<T>) => {
    // Reset data
    Object.keys(formData).forEach(key => {
      const typedKey = key as keyof T
      formData[typedKey] = newData?.[typedKey] ?? initialData[typedKey]
    })

    // Reset field states
    Object.keys(fieldStates).forEach(key => {
      const typedKey = key as keyof T
      fieldStates[typedKey] = {
        error: '',
        touched: false,
        dirty: false,
        validating: false
      }
    })

    // Reset form state
    isSubmitting.value = false
    hasBeenSubmitted.value = false

    // Clear timeouts
    validationTimeouts.forEach(timeout => clearTimeout(timeout))
    validationTimeouts.clear()
  }

  /**
   * Clear all errors
   */
  const clearErrors = () => {
    Object.keys(fieldStates).forEach(key => {
      fieldStates[key as keyof T].error = ''
    })
  }

  /**
   * Set field error manually
   */
  const setFieldError = (fieldName: keyof T, error: string) => {
    const state = fieldStates[fieldName]
    if (state) {
      state.error = error
    }
  }

  /**
   * Set multiple errors at once
   */
  const setErrors = (errorObj: Record<keyof T, string>) => {
    Object.entries(errorObj).forEach(([key, error]) => {
      setFieldError(key as keyof T, error as string)
    })
  }

  /**
   * Focus first field with error
   */
  const focusFirstError = async () => {
    await nextTick()
    
    const firstErrorField = Object.entries(fieldStates).find(([, state]) => state.error)?.[0]
    if (firstErrorField) {
      const element = document.getElementById(`field-${firstErrorField}`) as HTMLElement
      element?.focus()
    }
  }

  /**
   * Submit handler
   */
  const handleSubmit = async (submitFn: (data: T) => Promise<void> | void) => {
    if (isSubmitting.value) return

    isSubmitting.value = true
    hasBeenSubmitted.value = true

    try {
      const validation = await validateForm()
      
      if (!validation.isValid) {
        await focusFirstError()
        return
      }

      await submitFn(formData)
    } catch (error) {
      console.error('Form submission error:', error)
      throw error
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * Get field helper functions
   */
  const getFieldProps = (fieldName: keyof T) => {
    const state = fieldStates[fieldName]
    
    return {
      modelValue: formData[fieldName],
      error: state?.error || '',
      name: String(fieldName),
      'onUpdate:modelValue': (value: any) => handleFieldChange(fieldName, value),
      onBlur: () => handleFieldBlur(fieldName),
      onValidate: () => validateField(fieldName)
    }
  }

  /**
   * Get field state
   */
  const getFieldState = (fieldName: keyof T) => {
    return fieldStates[fieldName] || {
      error: '',
      touched: false,
      dirty: false,
      validating: false
    }
  }

  // Validate on mount if requested
  if (validateOnMount) {
    nextTick(() => {
      validateForm()
    })
  }

  return {
    // Form data
    formData: formData as T,
    
    // Validation state
    errors,
    isValid,
    isDirty,
    touchedFields,
    hasErrors,
    firstError,
    isSubmitting,
    hasBeenSubmitted,
    
    // Field states
    fieldStates,
    getFieldState,
    
    // Validation methods
    validateField,
    validateFieldDebounced,
    validateForm,
    
    // Field interaction methods
    touchField,
    markFieldDirty,
    handleFieldBlur,
    handleFieldChange,
    
    // Form management methods
    resetForm,
    clearErrors,
    setFieldError,
    setErrors,
    focusFirstError,
    
    // Submit handling
    handleSubmit,
    
    // Helper methods
    getFieldProps
  }
}

/**
 * Helper function to create field validation rules
 */
export const createValidationRules = {
  required: (message = 'This field is required') => 
    yup.string().required(message),
    
  email: (message = 'Please enter a valid email address') => 
    yup.string().required('Email is required').email(message),
    
  minLength: (min: number, message?: string) => 
    yup.string().min(min, message || `Must be at least ${min} characters`),
    
  maxLength: (max: number, message?: string) => 
    yup.string().max(max, message || `Must be less than ${max} characters`),
    
  phone: (message = 'Please enter a valid phone number') => 
    yup.string().matches(/^[+]?[1-9][\d]{0,15}$|^[+]?[(]?[\d\s\-()]{10,20}$/, message),
    
  url: (message = 'Please enter a valid URL') => 
    yup.string().url(message),
    
  number: (message = 'Must be a valid number') => 
    yup.number().typeError(message),
    
  positiveNumber: (message = 'Must be a positive number') => 
    yup.number().positive(message),
    
  integer: (message = 'Must be a whole number') => 
    yup.number().integer(message),
    
  date: (message = 'Please enter a valid date') => 
    yup.date().typeError(message),
    
  boolean: () => 
    yup.boolean(),
    
  array: (message = 'Please select at least one option') => 
    yup.array().min(1, message)
}