import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/config/supabaseClient'
import type { UserSubmissionInsert } from '@/types/database.types'

export const useFormStore = defineStore('form', () => {
  const isSubmitting = ref(false)
  const submitStatus = ref<'idle' | 'success' | 'error'>('idle')
  const errorMessage = ref('')

  const submitForm = async (data: UserSubmissionInsert) => {
    try {
      isSubmitting.value = true
      submitStatus.value = 'idle'
      errorMessage.value = ''

      // Submit to Supabase database

      const { data: result, error } = await supabase
        .from('user_submissions')
        .insert(data)
        .select()
        .single()

      if (error) {
        throw error
      }

      console.log('Form submitted successfully:', result)
      submitStatus.value = 'success'
      return result

    } catch (error) {
      console.error('Form submission error:', error)
      submitStatus.value = 'error'
      errorMessage.value = error instanceof Error ? error.message : 'An unexpected error occurred'
      throw error
    } finally {
      isSubmitting.value = false
    }
  }

  const resetStatus = () => {
    submitStatus.value = 'idle'
    errorMessage.value = ''
  }

  return {
    isSubmitting,
    submitStatus,
    errorMessage,
    submitForm,
    resetStatus
  }
})