import type { OpportunityStage, OpportunityContext } from './opportunities'

/**
 * Form data interface specifically for the OpportunityFormWrapper component
 * This matches the actual field names used in the form wrapper
 */
export interface OpportunityFormWrapperData {
  // Basic Info
  organizationName: string
  opportunityName: string
  autoGenerateName: boolean
  context: OpportunityContext | null
  customContext: string
  
  // Principal Selection
  selectedPrincipals: string[]
  
  // Product & Details
  selectedProduct: string
  stage: OpportunityStage | ''
  probabilityPercent: number | null
  expectedCloseDate: string | null
  dealOwner: string
  notes: string
}

/**
 * Context data interface for pre-populating the form from other pages
 * This is a subset of OpportunityFormWrapperData with the most commonly pre-populated fields
 */
export interface OpportunityContextData {
  organizationName?: string
  opportunityName?: string
  autoGenerateName?: boolean
  context?: OpportunityContext | null
  customContext?: string
  notes?: string
  dealOwner?: string
}