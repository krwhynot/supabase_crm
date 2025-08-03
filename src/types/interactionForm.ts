import type { InteractionType } from './interactions'

/**
 * Form data interface specifically for the InteractionFormWrapper component
 * This matches the actual field names used in the form wrapper
 */
export interface InteractionFormWrapperData {
  // Basic Info
  interactionType: InteractionType | ''
  date: string
  subject: string
  notes: string
  
  // Relationship Selection
  selectedOpportunity: string | null
  selectedContact: string | null
  
  // Follow-up Configuration
  followUpNeeded: boolean
  followUpDate: string | null
}

/**
 * Context data interface for pre-populating the form from other pages
 * This is a subset of InteractionFormWrapperData with the most commonly pre-populated fields
 */
export interface InteractionContextData {
  interactionType?: InteractionType
  selectedOpportunity?: string | null
  selectedContact?: string | null
  subject?: string
  notes?: string
  date?: string
  followUpNeeded?: boolean
  followUpDate?: string | null
}

/**
 * Form props interface for interaction components
 */
export interface InteractionFormProps {
  initialData?: Partial<InteractionFormWrapperData>
  contextData?: InteractionContextData
  onSubmit: (data: InteractionFormWrapperData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  submitLabel?: string
  showOpportunitySelection?: boolean
  showContactSelection?: boolean
  autoSelectFollowUp?: boolean
}

/**
 * Quick create interaction interface for simplified forms
 */
export interface QuickInteractionData {
  interactionType: InteractionType
  subject: string
  notes?: string
  opportunityId?: string | null
  contactId?: string | null
  autoScheduleFollowUp?: boolean
}

/**
 * Follow-up form data interface
 */
export interface FollowUpFormData {
  originalInteractionId: string
  newInteractionType: InteractionType | ''
  scheduledDate: string
  subject: string
  notes: string
  markOriginalComplete: boolean
}

/**
 * Batch interaction form data interface
 */
export interface BatchInteractionFormData {
  // Template for all interactions
  interactionType: InteractionType | ''
  date: string
  subject: string
  notes: string
  followUpNeeded: boolean
  followUpDate: string | null
  
  // Targets for batch creation
  selectedOpportunities: string[]
  selectedContacts: string[]
  createPerOpportunity: boolean
  createPerContact: boolean
}

/**
 * Form step data for multi-step interaction forms
 */
export interface InteractionFormStepData {
  currentStep: number
  totalSteps: number
  stepData: {
    basicInfo: Partial<InteractionFormWrapperData>
    relationships: {
      selectedOpportunity: string | null
      selectedContact: string | null
    }
    followUp: {
      followUpNeeded: boolean
      followUpDate: string | null
    }
  }
  isStepValid: (step: number) => boolean
  canProceed: boolean
}