# ADR-014: Form Validation Architecture with Yup

## Status
- **Status**: Implemented
- **Date**: 2025-01-08
- **Deciders**: Frontend Team, UX Team
- **Consulted**: Accessibility Team, Security Team
- **Informed**: All Developers

## Context

We needed to establish a comprehensive form validation strategy for our Vue 3 CRM application that would provide consistent user experience, accessibility compliance, and type safety. The requirements included:

- **Schema-Based Validation**: Declarative validation rules with type inference
- **Real-time Feedback**: Immediate validation feedback during user interaction
- **Accessibility**: WCAG 2.1 AA compliant error messaging and announcements
- **Type Safety**: TypeScript integration with automatic type inference
- **Reusable Patterns**: Consistent validation across all forms
- **Internationalization**: Support for multiple languages and locales
- **Complex Validation**: Cross-field validation and custom business rules
- **Performance**: Efficient validation with minimal re-renders

The alternatives considered were:
1. **Yup + Custom Composables**: Schema-based validation with Vue 3 integration
2. **VeeValidate**: Vue-specific form validation library
3. **Joi**: Alternative schema validation library
4. **Zod**: TypeScript-first schema validation
5. **Custom Validators**: Hand-written validation functions
6. **Browser Validation**: Native HTML5 form validation only

## Decision

We will use **Yup schema validation with custom Vue 3 composables** to provide type-safe, accessible form validation across the application.

**Validation Architecture:**
- **Yup Schemas**: Declarative validation rules with TypeScript inference
- **Vue 3 Composables**: Reusable validation logic and state management
- **Real-time Validation**: Validation on blur and input events
- **Accessibility Integration**: ARIA attributes and screen reader support
- **Error Message System**: Centralized, translatable error messages

## Rationale

### Yup Schema Advantages
- **Declarative Syntax**: Clear, readable validation rule definitions
- **Type Inference**: Automatic TypeScript type generation from schemas
- **Composable Rules**: Reusable validation logic across forms
- **Rich Validation**: Built-in validators for common patterns
- **Custom Validators**: Easy extension with business-specific rules
- **Async Validation**: Support for server-side validation

### Vue 3 Integration Benefits
- **Composition API**: Natural integration with reactive state
- **Performance**: Efficient reactivity with selective updates
- **Reusability**: Composable validation logic across components
- **Type Safety**: Strong TypeScript integration
- **Testing**: Easy unit testing of validation logic

### Accessibility Benefits
- **WCAG Compliance**: Built-in accessibility patterns
- **Screen Reader Support**: Proper ARIA attributes and announcements
- **Keyboard Navigation**: Full keyboard accessibility
- **Error Association**: Proper linking of errors to form fields
- **Focus Management**: Automatic focus on validation errors

### User Experience Benefits
- **Immediate Feedback**: Real-time validation prevents form submission errors
- **Clear Messaging**: User-friendly error messages with guidance
- **Progressive Enhancement**: Works without JavaScript as fallback
- **Consistent Patterns**: Uniform validation behavior across the application

## Consequences

### Positive
- **Type Safety**: Compile-time protection against validation errors
- **Consistent UX**: Uniform validation behavior across all forms
- **Accessibility**: WCAG 2.1 AA compliant form validation
- **Developer Experience**: Clear patterns and reusable validation logic
- **Performance**: Efficient validation with optimized reactivity
- **Maintainability**: Centralized validation rules and error messages

### Negative
- **Learning Curve**: Developers need to learn Yup schema syntax
- **Bundle Size**: Additional dependency for validation library
- **Complexity**: Complex validation rules can become hard to debug
- **Runtime Overhead**: Validation execution during user interaction

### Risks
- **Medium Risk**: Over-complex validation schemas
  - **Mitigation**: Keep schemas focused and break down complex validation
- **Low Risk**: Performance impact with large forms
  - **Mitigation**: Optimize validation triggers and use debouncing
- **Medium Risk**: Accessibility regression in custom validators
  - **Mitigation**: Regular accessibility testing and automated checks

## Implementation

### Validation Schema Patterns
```typescript
// src/validation/schemas/contactSchema.ts
import * as yup from 'yup'
import type { InferType } from 'yup'

// Contact validation schema
export const contactSchema = yup.object({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
    
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email cannot exceed 255 characters'),
    
  phone: yup
    .string()
    .nullable()
    .matches(/^[\+]?[\s\d\-\(\)]+$/, 'Please enter a valid phone number')
    .min(10, 'Phone number must be at least 10 digits'),
    
  organization_id: yup
    .string()
    .nullable()
    .uuid('Invalid organization selected'),
    
  title: yup
    .string()
    .nullable()
    .max(100, 'Title cannot exceed 100 characters'),
    
  notes: yup
    .string()
    .nullable()
    .max(1000, 'Notes cannot exceed 1000 characters'),
    
  tags: yup
    .array()
    .of(yup.string().required())
    .max(10, 'Cannot have more than 10 tags'),
    
  is_active: yup
    .boolean()
    .default(true)
})

// Infer TypeScript type from schema
export type ContactFormData = InferType<typeof contactSchema>

// Organization-specific validation
export const organizationSchema = yup.object({
  name: yup
    .string()
    .required('Organization name is required')
    .min(2, 'Organization name must be at least 2 characters')
    .max(200, 'Organization name cannot exceed 200 characters'),
    
  type: yup
    .string()
    .required('Organization type is required')
    .oneOf(['customer', 'prospect', 'partner', 'vendor'], 'Please select a valid organization type'),
    
  industry: yup
    .string()
    .nullable()
    .max(100, 'Industry cannot exceed 100 characters'),
    
  website: yup
    .string()
    .nullable()
    .url('Please enter a valid website URL')
    .max(255, 'Website URL cannot exceed 255 characters'),
    
  address: yup.object({
    street: yup.string().nullable().max(255, 'Street address too long'),
    city: yup.string().nullable().max(100, 'City name too long'),
    state: yup.string().nullable().max(50, 'State name too long'),
    postal_code: yup.string().nullable().matches(/^\d{5}(-\d{4})?$/, 'Invalid postal code format'),
    country: yup.string().nullable().max(100, 'Country name too long')
  }).nullable()
})

export type OrganizationFormData = InferType<typeof organizationSchema>
```

### Form Validation Composable
```typescript
// src/composables/useFormValidation.ts
import { ref, reactive, computed, nextTick } from 'vue'
import type { ObjectSchema, ValidationError } from 'yup'

interface FieldError {
  message: string
  field: string
}

interface ValidationOptions {
  validateOnBlur?: boolean
  validateOnInput?: boolean
  showErrorsImmediately?: boolean
}

export function useFormValidation<T extends Record<string, any>>(
  schema: ObjectSchema<T>,
  initialData: Partial<T> = {},
  options: ValidationOptions = {}
) {
  const {
    validateOnBlur = true,
    validateOnInput = false,
    showErrorsImmediately = false
  } = options

  // Form data state
  const formData = reactive<T>({ ...schema.getDefault(), ...initialData } as T)
  
  // Validation state
  const errors = reactive<Record<string, string>>({})
  const touchedFields = reactive<Record<string, boolean>>({})
  const isValidating = ref(false)
  const hasBeenSubmitted = ref(false)

  // Computed properties
  const isValid = computed(() => {
    return Object.keys(errors).length === 0 && Object.keys(touchedFields).length > 0
  })

  const hasErrors = computed(() => Object.keys(errors).length > 0)

  const canSubmit = computed(() => {
    return isValid.value && !isValidating.value
  })

  // Validation functions
  const validateField = async (fieldName: keyof T): Promise<boolean> => {
    try {
      await schema.validateAt(fieldName as string, formData)
      delete errors[fieldName as string]
      return true
    } catch (error) {
      if (error instanceof ValidationError) {
        errors[fieldName as string] = error.message
      }
      return false
    }
  }

  const validateForm = async (): Promise<boolean> => {
    isValidating.value = true
    
    try {
      await schema.validate(formData, { abortEarly: false })
      
      // Clear all errors
      Object.keys(errors).forEach(key => {
        delete errors[key]
      })
      
      return true
    } catch (error) {
      if (error instanceof ValidationError) {
        // Clear existing errors
        Object.keys(errors).forEach(key => {
          delete errors[key]
        })
        
        // Set new errors
        error.inner.forEach((err) => {
          if (err.path) {
            errors[err.path] = err.message
          }
        })
      }
      return false
    } finally {
      isValidating.value = false
    }
  }

  const validateFieldDebounced = debounce(validateField, 300)

  // Field interaction handlers
  const handleFieldBlur = async (fieldName: keyof T) => {
    touchedFields[fieldName as string] = true
    
    if (validateOnBlur || hasBeenSubmitted.value) {
      await validateField(fieldName)
      announceError(fieldName as string, errors[fieldName as string])
    }
  }

  const handleFieldInput = async (fieldName: keyof T, value: any) => {
    formData[fieldName] = value
    touchedFields[fieldName as string] = true
    
    if (validateOnInput || hasBeenSubmitted.value) {
      await validateFieldDebounced(fieldName)
    }
  }

  // Form submission
  const handleSubmit = async (submitFn: (data: T) => Promise<void> | void) => {
    hasBeenSubmitted.value = true
    
    const isFormValid = await validateForm()
    
    if (!isFormValid) {
      // Focus first error field
      await nextTick()
      focusFirstError()
      return false
    }
    
    try {
      await submitFn(formData)
      return true
    } catch (error) {
      console.error('Form submission error:', error)
      return false
    }
  }

  // Accessibility helpers
  const getFieldProps = (fieldName: keyof T) => {
    const hasError = errors[fieldName as string]
    const fieldId = `field-${fieldName as string}`
    const errorId = `error-${fieldName as string}`
    
    return {
      id: fieldId,
      'aria-invalid': !!hasError,
      'aria-describedby': hasError ? errorId : undefined,
      onBlur: () => handleFieldBlur(fieldName),
      onInput: (event: Event) => {
        const target = event.target as HTMLInputElement
        handleFieldInput(fieldName, target.value)
      }
    }
  }

  const getErrorProps = (fieldName: keyof T) => {
    const hasError = errors[fieldName as string]
    
    return {
      id: `error-${fieldName as string}`,
      role: 'alert',
      'aria-live': 'polite'
    }
  }

  // Utility functions
  const clearErrors = () => {
    Object.keys(errors).forEach(key => {
      delete errors[key]
    })
  }

  const resetForm = () => {
    Object.assign(formData, schema.getDefault())
    clearErrors()
    Object.keys(touchedFields).forEach(key => {
      touchedFields[key] = false
    })
    hasBeenSubmitted.value = false
  }

  const setFieldValue = (fieldName: keyof T, value: any) => {
    formData[fieldName] = value
    touchedFields[fieldName as string] = true
  }

  const setFieldError = (fieldName: keyof T, message: string) => {
    errors[fieldName as string] = message
  }

  // Accessibility functions
  function announceError(fieldName: string, errorMessage: string) {
    if (errorMessage) {
      const announcement = document.createElement('div')
      announcement.setAttribute('aria-live', 'assertive')
      announcement.setAttribute('aria-atomic', 'true')
      announcement.className = 'sr-only'
      announcement.textContent = `Error in ${fieldName}: ${errorMessage}`
      
      document.body.appendChild(announcement)
      
      setTimeout(() => {
        document.body.removeChild(announcement)
      }, 1000)
    }
  }

  function focusFirstError() {
    const firstErrorField = Object.keys(errors)[0]
    if (firstErrorField) {
      const fieldElement = document.getElementById(`field-${firstErrorField}`)
      if (fieldElement) {
        fieldElement.focus()
      }
    }
  }

  return {
    // Form data
    formData,
    
    // Validation state
    errors,
    touchedFields,
    isValidating,
    hasBeenSubmitted,
    
    // Computed
    isValid,
    hasErrors,
    canSubmit,
    
    // Methods
    validateField,
    validateForm,
    handleSubmit,
    handleFieldBlur,
    handleFieldInput,
    
    // Helpers
    getFieldProps,
    getErrorProps,
    clearErrors,
    resetForm,
    setFieldValue,
    setFieldError
  }
}

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}
```

### Form Component Implementation
```vue
<!-- ContactForm.vue -->
<template>
  <form @submit.prevent="submitForm" class="space-y-6">
    <div class="space-y-4">
      <!-- Name Field -->
      <FormField
        label="Full Name"
        required
        :error="errors.name"
        :touched="touchedFields.name"
      >
        <input
          v-model="formData.name"
          type="text"
          v-bind="getFieldProps('name')"
          class="form-input"
          placeholder="Enter full name"
        />
      </FormField>

      <!-- Email Field -->
      <FormField
        label="Email Address"
        required
        :error="errors.email"
        :touched="touchedFields.email"
      >
        <input
          v-model="formData.email"
          type="email"
          v-bind="getFieldProps('email')"
          class="form-input"
          placeholder="Enter email address"
        />
      </FormField>

      <!-- Phone Field -->
      <FormField
        label="Phone Number"
        :error="errors.phone"
        :touched="touchedFields.phone"
      >
        <input
          v-model="formData.phone"
          type="tel"
          v-bind="getFieldProps('phone')"
          class="form-input"
          placeholder="Enter phone number"
        />
      </FormField>

      <!-- Organization Select -->
      <FormField
        label="Organization"
        :error="errors.organization_id"
        :touched="touchedFields.organization_id"
      >
        <select
          v-model="formData.organization_id"
          v-bind="getFieldProps('organization_id')"
          class="form-select"
        >
          <option value="">Select an organization</option>
          <option
            v-for="org in organizations"
            :key="org.id"
            :value="org.id"
          >
            {{ org.name }}
          </option>
        </select>
      </FormField>
    </div>

    <!-- Form Actions -->
    <div class="flex justify-end space-x-3">
      <button
        type="button"
        @click="resetForm"
        class="btn-secondary"
      >
        Reset
      </button>
      <button
        type="submit"
        :disabled="!canSubmit"
        class="btn-primary"
      >
        <span v-if="isValidating">Saving...</span>
        <span v-else>Save Contact</span>
      </button>
    </div>

    <!-- Form Summary -->
    <div v-if="hasErrors && hasBeenSubmitted" class="form-errors">
      <p class="text-error-600 font-medium">
        Please correct the following errors:
      </p>
      <ul class="mt-2 space-y-1">
        <li
          v-for="(error, field) in errors"
          :key="field"
          class="text-sm text-error-600"
        >
          {{ error }}
        </li>
      </ul>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useFormValidation } from '@/composables/useFormValidation'
import { contactSchema, type ContactFormData } from '@/validation/schemas/contactSchema'
import { useContactStore } from '@/stores/contactStore'
import { useOrganizationStore } from '@/stores/organizationStore'

// Props and emits
interface Props {
  initialData?: Partial<ContactFormData>
  mode?: 'create' | 'edit'
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create'
})

interface Emits {
  (e: 'saved', contact: ContactFormData): void
  (e: 'cancelled'): void
}

const emit = defineEmits<Emits>()

// Stores
const contactStore = useContactStore()
const organizationStore = useOrganizationStore()

// Form validation
const {
  formData,
  errors,
  touchedFields,
  isValidating,
  hasBeenSubmitted,
  isValid,
  hasErrors,
  canSubmit,
  handleSubmit,
  getFieldProps,
  resetForm
} = useFormValidation(contactSchema, props.initialData)

// Organizations for select
const { organizations } = organizationStore

// Form submission
const submitForm = () => {
  handleSubmit(async (data) => {
    try {
      let savedContact
      if (props.mode === 'edit' && props.initialData?.id) {
        savedContact = await contactStore.updateContact(props.initialData.id, data)
      } else {
        savedContact = await contactStore.createContact(data)
      }
      
      emit('saved', savedContact)
    } catch (error) {
      console.error('Failed to save contact:', error)
      // Error handling could set form-level errors here
    }
  })
}
</script>
```

### Reusable Form Field Component
```vue
<!-- FormField.vue -->
<template>
  <div class="form-field">
    <label
      :for="fieldId"
      class="form-label"
      :class="{ 'required': required }"
    >
      {{ label }}
      <span v-if="required" class="text-error-500 ml-1" aria-label="required">*</span>
    </label>
    
    <div class="form-input-wrapper">
      <slot />
    </div>
    
    <!-- Error Message -->
    <div
      v-if="error && touched"
      class="form-error"
      role="alert"
      aria-live="polite"
    >
      {{ error }}
    </div>
    
    <!-- Help Text -->
    <div
      v-else-if="helpText"
      class="form-help"
    >
      {{ helpText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'

interface Props {
  label: string
  required?: boolean
  error?: string
  touched?: boolean
  helpText?: string
}

const props = defineProps<Props>()

const fieldId = useId()
</script>

<style scoped>
.form-field {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

.form-label.required {
  @apply font-semibold;
}

.form-error {
  @apply text-sm text-error-600 dark:text-error-400;
}

.form-help {
  @apply text-sm text-gray-500 dark:text-gray-400;
}
</style>
```

### Custom Validation Rules
```typescript
// src/validation/customValidators.ts
import * as yup from 'yup'

// Add custom validation methods to Yup
declare module 'yup' {
  interface StringSchema {
    phoneNumber(): this
    businessEmail(): this
    strongPassword(): this
  }
}

// Phone number validation
yup.addMethod(yup.string, 'phoneNumber', function (message = 'Invalid phone number') {
  return this.matches(
    /^[\+]?[\s\d\-\(\)]+$/,
    message
  ).min(10, 'Phone number must be at least 10 digits')
})

// Business email validation (exclude common personal email domains)
yup.addMethod(yup.string, 'businessEmail', function (message = 'Please use a business email address') {
  const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
  
  return this.email('Invalid email format').test('business-email', message, function (value) {
    if (!value) return true
    
    const domain = value.split('@')[1]?.toLowerCase()
    return !personalDomains.includes(domain)
  })
})

// Strong password validation
yup.addMethod(yup.string, 'strongPassword', function (message = 'Password must be strong') {
  return this.min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/\d/, 'Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character')
})
```

## Related Decisions
- [ADR-011: Design System Architecture with Tailwind CSS](./011-design-system-tailwind.md)
- [ADR-012: Vue 3 Composition API Component Architecture](./012-composition-api-architecture.md)
- [ADR-013: API Service Layer Design Pattern](./013-api-service-layer.md)

## Notes
- Form validation provides immediate feedback with accessibility compliance
- Schema-based validation ensures type safety and consistency
- Composable patterns allow for reusable validation logic across forms
- Error messaging designed for screen reader compatibility
- Custom validators extend Yup for business-specific validation rules
- Performance optimized through debounced validation and selective reactivity