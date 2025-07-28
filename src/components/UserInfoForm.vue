<template>
  <form
    @submit.prevent="onSubmit"
    class="max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg space-y-4"
    novalidate
  >
    <h2 class="text-2xl font-bold text-gray-800 mb-6">User Information</h2>
    
    <!-- Demo Mode Notice -->
    <div
      v-if="isDemoMode"
      class="p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded-md text-sm"
      role="alert"
    >
      <InformationCircleIcon class="w-4 h-4 inline mr-2" />
      <strong>Demo Mode:</strong> Form submissions will be simulated (no database connection)
    </div>
    
    <!-- Success Message -->
    <div
      v-if="submitStatus === 'success'"
      class="p-4 bg-green-100 border border-green-400 text-green-700 rounded-md"
      role="alert"
    >
      <CheckCircleIcon class="w-5 h-5 inline mr-2" />
      Form submitted successfully!
    </div>

    <!-- Error Message -->
    <div
      v-if="submitStatus === 'error'"
      class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md"
      role="alert"
    >
      <XCircleIcon class="w-5 h-5 inline mr-2" />
      Error: {{ errorMessage }}
    </div>
    
    <FormGroup
      name="firstName"
      label="First Name"
      :error="errors.firstName"
      required
    >
      <template #default="{ fieldId, hasError, errorId }">
        <input
          :id="fieldId"
          type="text"
          v-model="formData.firstName"
          placeholder="Enter your first name"
          :aria-describedby="hasError ? errorId : undefined"
          :aria-invalid="hasError ? 'true' : 'false'"
          class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition duration-200 border-gray-300 focus:ring-primary"
          :class="{ 'border-danger focus:ring-danger': hasError }"
          @blur="validateField('firstName')"
        />
      </template>
    </FormGroup>

    <FormGroup
      name="lastName"
      label="Last Name"
      :error="errors.lastName"
      required
    >
      <template #default="{ fieldId, hasError, errorId }">
        <input
          :id="fieldId"
          type="text"
          v-model="formData.lastName"
          placeholder="Enter your last name"
          :aria-describedby="hasError ? errorId : undefined"
          :aria-invalid="hasError ? 'true' : 'false'"
          class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition duration-200 border-gray-300 focus:ring-primary"
          :class="{ 'border-danger focus:ring-danger': hasError }"
          @blur="validateField('lastName')"
        />
      </template>
    </FormGroup>

    <FormGroup
      name="age"
      label="Age"
      :error="errors.age"
      required
    >
      <template #default="{ fieldId, hasError, errorId }">
        <input
          :id="fieldId"
          type="text"
          v-model="formData.age"
          placeholder="Enter your age"
          :aria-describedby="hasError ? errorId : undefined"
          :aria-invalid="hasError ? 'true' : 'false'"
          class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition duration-200 border-gray-300 focus:ring-primary"
          :class="{ 'border-danger focus:ring-danger': hasError }"
          @blur="validateField('age')"
        />
      </template>
    </FormGroup>

    <FormGroup
      name="favoriteColor"
      label="Favorite Color"
      :error="errors.favoriteColor"
      required
    >
      <template #default="{ fieldId, hasError, errorId }">
        <select
          :id="fieldId"
          v-model="formData.favoriteColor"
          :aria-describedby="hasError ? errorId : undefined"
          :aria-invalid="hasError ? 'true' : 'false'"
          class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition duration-200 border-gray-300 focus:ring-primary"
          :class="{ 'border-danger focus:ring-danger': hasError }"
          @blur="validateField('favoriteColor')"
        >
          <option value="">Select your favorite color</option>
          <option 
            v-for="option in colorOptions" 
            :key="option" 
            :value="option"
          >
            {{ option }}
          </option>
        </select>
      </template>
    </FormGroup>

    <Button
      type="submit"
      variant="primary"
      :disabled="isSubmitting"
      class="w-full"
    >
      {{ isSubmitting ? 'Submitting...' : 'Submit' }}
    </Button>
  </form>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import * as yup from 'yup'
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/vue/24/solid'
import { useFormStore } from '@/stores/formStore'
import type { UserSubmissionInsert } from '@/types/database.types'
import Button from './atomic/Button.vue'
import FormGroup from './molecular/FormGroup.vue'

const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  age: yup
    .number()
    .typeError('Age must be a number')
    .positive('Age must be a positive number')
    .integer('Age must be a whole number')
    .required('Age is required'),
  favoriteColor: yup.string().required('Please select a favorite color'),
})

type FormData = yup.InferType<typeof schema>

const colorOptions = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Other']

const formStore = useFormStore()
const { isSubmitting, submitStatus, errorMessage } = storeToRefs(formStore)

const isDemoMode = computed(() => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  return !supabaseUrl || !supabaseKey || 
         supabaseUrl === 'your-supabase-project-url' || 
         supabaseKey === 'your-supabase-anon-key'
})

const formData = reactive<FormData>({
  firstName: '',
  lastName: '',
  age: 0,
  favoriteColor: '',
})

const errors = reactive<Partial<Record<keyof FormData, string>>>({})

const validateField = async (fieldName: keyof FormData) => {
  try {
    const value = formData[fieldName]
    await schema.validateAt(fieldName, { [fieldName]: value })
    errors[fieldName] = ''
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      errors[fieldName] = error.message
    }
  }
}

const validateForm = async (): Promise<boolean> => {
  try {
    await schema.validate(formData, { abortEarly: false })
    // Clear all errors
    Object.keys(errors).forEach(key => {
      errors[key as keyof FormData] = ''
    })
    return true
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      // Clear previous errors
      Object.keys(errors).forEach(key => {
        errors[key as keyof FormData] = ''
      })
      // Set new errors
      error.inner.forEach(err => {
        if (err.path) {
          errors[err.path as keyof FormData] = err.message
        }
      })
    }
    return false
  }
}

const resetForm = () => {
  formData.firstName = ''
  formData.lastName = ''
  formData.age = 0
  formData.favoriteColor = ''
  Object.keys(errors).forEach(key => {
    errors[key as keyof FormData] = ''
  })
}

const onSubmit = async () => {
  try {
    formStore.resetStatus()

    // Validate form
    const isValid = await validateForm()
    if (!isValid) {
      return
    }

    // Prepare data for Supabase
    const submissionData: UserSubmissionInsert = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      age: formData.age,
      favorite_color: formData.favoriteColor,
    }

    // Submit via store
    await formStore.submitForm(submissionData)
    resetForm() // Clear form on success

  } catch (error) {
    // Error handling is done in the store
    console.error('Form submission failed:', error)
  }
}
</script>