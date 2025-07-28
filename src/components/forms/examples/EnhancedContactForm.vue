<template>
  <FormWrapper
    title="Enhanced Contact Form"
    description="Create a new contact with improved validation and accessibility"
    :errors="validation.errors.value"
    :isValid="validation.isValid.value"
    :isDirty="validation.isDirty.value"
    :isSubmitting="validation.isSubmitting.value"
    :hasBeenSubmitted="validation.hasBeenSubmitted.value"
    :firstError="validation.firstError.value"
    :showErrorList="true"
    :showResetButton="true"
    :showDebugPanel="true"
    :fieldLabels="fieldLabels"
    layout="card"
    @submit="onSubmit"
    @reset="onReset"
  >
    <!-- Personal Information Section -->
    <fieldset class="border border-gray-200 rounded-lg p-4 space-y-4">
      <legend class="text-lg font-semibold text-gray-900 px-2">Personal Information</legend>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- First Name -->
        <BaseInputField
          v-bind="validation.getFieldProps('firstName')"
          label="First Name"
          type="text"
          required
          autocomplete="given-name"
          description="Enter your first name"
          :showValidIcon="true"
        />

        <!-- Last Name -->
        <BaseInputField
          v-bind="validation.getFieldProps('lastName')"
          label="Last Name"
          type="text"
          required
          autocomplete="family-name"
          description="Enter your last name"
          :showValidIcon="true"
        />
      </div>

      <!-- Email -->
      <BaseInputField
        v-bind="validation.getFieldProps('email')"
        label="Email Address"
        type="email"
        required
        autocomplete="email"
        description="We'll use this to send you updates"
        helpText="Your email will be kept private and secure"
        :showValidIcon="true"
      />

      <!-- Phone -->
      <BaseInputField
        v-bind="validation.getFieldProps('phone')"
        label="Phone Number"
        type="tel"
        autocomplete="tel"
        description="Optional - for urgent communications only"
        placeholder="+1 (555) 123-4567"
        :showValidIcon="true"
      />
    </fieldset>

    <!-- Professional Information Section -->
    <fieldset class="border border-gray-200 rounded-lg p-4 space-y-4">
      <legend class="text-lg font-semibold text-gray-900 px-2">Professional Information</legend>
      
      <!-- Organization -->
      <BaseInputField
        v-bind="validation.getFieldProps('organization')"
        label="Organization"
        type="text"
        required
        autocomplete="organization"
        description="Company or organization name"
        :showValidIcon="true"
      />

      <!-- Job Title -->
      <BaseInputField
        v-bind="validation.getFieldProps('title')"
        label="Job Title"
        type="text"
        autocomplete="organization-title"
        description="Your current position or role"
        :showValidIcon="true"
      />

      <!-- Department -->
      <SelectField
        v-bind="validation.getFieldProps('department')"
        label="Department"
        :options="departmentOptions"
        description="Select your department"
        placeholder="Choose a department"
      />
    </fieldset>

    <!-- Preferences Section -->
    <fieldset class="border border-gray-200 rounded-lg p-4 space-y-4">
      <legend class="text-lg font-semibold text-gray-900 px-2">Contact Preferences</legend>
      
      <!-- Communication Method -->
      <RadioField
        v-bind="validation.getFieldProps('communicationMethod')"
        label="Preferred Communication Method"
        :options="communicationOptions"
        layout="vertical"
        description="How would you like us to contact you?"
        required
      />

      <!-- Newsletter Subscription -->
      <CheckboxField
        v-bind="validation.getFieldProps('newsletter')"
        label="Subscribe to our newsletter"
        description="Get updates about new features and company news"
        helpText="You can unsubscribe at any time"
      />

      <!-- Marketing Emails -->
      <CheckboxField
        v-bind="validation.getFieldProps('marketing')"
        label="Receive marketing emails"
        description="Get information about products and special offers"
        helpText="We promise not to spam you"
      />
    </fieldset>

    <!-- Additional Information Section -->
    <fieldset class="border border-gray-200 rounded-lg p-4 space-y-4">
      <legend class="text-lg font-semibold text-gray-900 px-2">Additional Information</legend>
      
      <!-- Notes -->
      <TextareaField
        v-bind="validation.getFieldProps('notes')"
        label="Additional Notes"
        :rows="4"
        :maxlength="500"
        :showCharacterCount="true"
        description="Any additional information you'd like to share"
        helpText="This information helps us serve you better"
        placeholder="Tell us anything else we should know..."
      />

      <!-- Tags -->
      <SelectField
        v-bind="validation.getFieldProps('tags')"
        label="Tags"
        :options="tagOptions"
        multiple
        :size="4"
        description="Select relevant tags (hold Ctrl/Cmd for multiple)"
        helpText="Tags help us categorize and organize contacts"
      />
    </fieldset>

    <!-- Custom Actions Slot -->
    <template #actions="{ isValid, isDirty, isSubmitting, resetForm }">
      <div class="flex justify-between items-center">
        <!-- Left side - Form info -->
        <div class="text-sm text-gray-500">
          <span v-if="isDirty" class="text-amber-600">● Unsaved changes</span>
          <span v-else-if="validation.hasBeenSubmitted.value" class="text-green-600">✓ Form submitted</span>
          <span v-else>Ready to submit</span>
        </div>

        <!-- Right side - Action buttons -->
        <div class="flex space-x-3">
          <button
            type="button"
            :disabled="!isDirty || isSubmitting"
            class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-semibold rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="resetForm"
          >
            Reset Form
          </button>
          
          <button
            type="button"
            :disabled="isSubmitting"
            class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-semibold rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="saveAsDraft"
          >
            Save as Draft
          </button>
          
          <button
            type="submit"
            :disabled="!isValid || isSubmitting"
            class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <!-- Loading Spinner -->
            <svg
              v-if="isSubmitting"
              class="animate-spin -ml-1 mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {{ isSubmitting ? 'Creating Contact...' : 'Create Contact' }}
          </button>
        </div>
      </div>
    </template>
  </FormWrapper>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import * as yup from 'yup'
import { useFormValidation, createValidationRules } from '@/composables/useFormValidation'

// Import enhanced form components
import FormWrapper from '../FormWrapper.vue'
import BaseInputField from '../BaseInputField.vue'
import TextareaField from '../TextareaField.vue'
import SelectField from '../SelectField.vue'
import CheckboxField from '../CheckboxField.vue'
import RadioField from '../RadioField.vue'

/**
 * Form data interface
 */
interface ContactFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  organization: string
  title: string
  department: string
  communicationMethod: string
  newsletter: boolean
  marketing: boolean
  notes: string
  tags: string[]
}

/**
 * Validation schema with comprehensive rules
 */
const schema = yup.object({
  firstName: createValidationRules.required('First name is required')
    .max(50, 'First name must be less than 50 characters'),
  
  lastName: createValidationRules.required('Last name is required')
    .max(50, 'Last name must be less than 50 characters'),
  
  email: createValidationRules.email(),
  
  phone: yup.string()
    .nullable()
    .matches(/^[+]?[1-9][\d]{0,15}$|^[+]?[(]?[\d\s\-()]{10,20}$/, 'Please enter a valid phone number')
    .transform(value => value === '' ? null : value),
  
  organization: createValidationRules.required('Organization is required')
    .max(100, 'Organization name must be less than 100 characters'),
  
  title: yup.string()
    .max(100, 'Job title must be less than 100 characters'),
  
  department: yup.string()
    .required('Please select a department'),
  
  communicationMethod: yup.string()
    .required('Please select a communication method'),
  
  newsletter: createValidationRules.boolean(),
  
  marketing: createValidationRules.boolean(),
  
  notes: yup.string()
    .max(500, 'Notes must be less than 500 characters'),
  
  tags: createValidationRules.array()
    .max(5, 'Please select no more than 5 tags')
})

/**
 * Initial form data
 */
const initialData: ContactFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  organization: '',
  title: '',
  department: '',
  communicationMethod: '',
  newsletter: false,
  marketing: false,
  notes: '',
  tags: []
}

/**
 * Form validation with enhanced options
 */
const validation = useFormValidation(schema, initialData, {
  validateOnBlur: true,
  validateOnChange: false,
  debounceMs: 300
})

/**
 * Field labels for error display
 */
const fieldLabels = {
  firstName: 'First Name',
  lastName: 'Last Name',
  email: 'Email Address',
  phone: 'Phone Number',
  organization: 'Organization',
  title: 'Job Title',
  department: 'Department',
  communicationMethod: 'Communication Method',
  newsletter: 'Newsletter Subscription',
  marketing: 'Marketing Emails',
  notes: 'Additional Notes',
  tags: 'Tags'
}

/**
 * Select options
 */
const departmentOptions = [
  { value: 'engineering', label: 'Engineering', group: 'Technical' },
  { value: 'design', label: 'Design', group: 'Technical' },
  { value: 'product', label: 'Product Management', group: 'Technical' },
  { value: 'sales', label: 'Sales', group: 'Business' },
  { value: 'marketing', label: 'Marketing', group: 'Business' },
  { value: 'support', label: 'Customer Support', group: 'Business' },
  { value: 'hr', label: 'Human Resources', group: 'Operations' },
  { value: 'finance', label: 'Finance', group: 'Operations' },
  { value: 'operations', label: 'Operations', group: 'Operations' }
]

const communicationOptions = [
  {
    value: 'email',
    label: 'Email',
    description: 'Receive updates via email'
  },
  {
    value: 'phone',
    label: 'Phone',
    description: 'Prefer phone calls for important matters'
  },
  {
    value: 'slack',
    label: 'Slack',
    description: 'Connect via Slack for quick communication'
  },
  {
    value: 'none',
    label: 'No Contact',
    description: 'Prefer not to be contacted directly'
  }
]

const tagOptions = [
  { value: 'vip', label: 'VIP Customer' },
  { value: 'beta-tester', label: 'Beta Tester' },
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'startup', label: 'Startup' },
  { value: 'partner', label: 'Partner' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'investor', label: 'Investor' },
  { value: 'media', label: 'Media Contact' }
]

/**
 * Form submission handler
 */
const onSubmit = async () => {
  await validation.handleSubmit(async (data) => {
    console.log('Submitting enhanced contact form:', data)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Show success message
    alert('Contact created successfully!')
    
    // Reset form after successful submission
    validation.resetForm()
  })
}

/**
 * Form reset handler
 */
const onReset = () => {
  validation.resetForm()
}

/**
 * Save as draft functionality
 */
const saveAsDraft = async () => {
  console.log('Saving as draft:', validation.formData)
  // Implement draft saving logic
  alert('Form saved as draft!')
}
</script>