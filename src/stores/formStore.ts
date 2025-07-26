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

      // Check if we have valid Supabase configuration
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      const isDemoMode = !supabaseUrl || !supabaseKey || 
                        supabaseUrl === 'your-supabase-project-url' || 
                        supabaseKey === 'your-supabase-anon-key'

      if (isDemoMode) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        console.log('Demo mode: Form data would be submitted:', data)
        submitStatus.value = 'success'
        return { id: Math.floor(Math.random() * 1000), ...data }
      }

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