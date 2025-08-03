/**
 * Interaction Components Export Index
 * 
 * Centralized export for all interaction-related components
 * including mobile-optimized components for field use
 */

// Core interaction components
export { default as InteractionFormWrapper } from './InteractionFormWrapper.vue'
export { default as InteractionDashboard } from './InteractionDashboard.vue'
export { default as InteractionKPICards } from './InteractionKPICards.vue'
export { default as InteractionTable } from './InteractionTable.vue'
export { default as InteractionTableActions } from './InteractionTableActions.vue'
export { default as InteractionTableFilters } from './InteractionTableFilters.vue'

// Form components
export { default as InteractionTemplateSelect } from './InteractionTemplateSelect.vue'
export { default as InteractionTypeSelect } from './InteractionTypeSelect.vue'
export { default as InteractionTypeBadge } from './InteractionTypeBadge.vue'
export { default as InteractionPriorityBadge } from './InteractionPriorityBadge.vue'
export { default as FollowUpScheduler } from './FollowUpScheduler.vue'

// Lookup components
export { default as OrganizationLookup } from './OrganizationLookup.vue'
export { default as OpportunitySelect } from './OpportunitySelect.vue'
export { default as PrincipalSelect } from './PrincipalSelect.vue'

// Badge and status components
export { default as PriorityBadge } from './PriorityBadge.vue'
export { default as SampleRating } from './SampleRating.vue'

// Mobile-optimized components for field use
export { default as QuickInteractionTemplates } from './QuickInteractionTemplates.vue'
export { default as MobileInteractionForm } from './MobileInteractionForm.vue'
export { default as VoiceNotesInput } from './VoiceNotesInput.vue'
export { default as LocationTracker } from './LocationTracker.vue'
export { default as OfflineInteractionQueue } from './OfflineInteractionQueue.vue'

/**
 * Component Groups for Easy Import
 */

// Core interaction management
export const CoreInteractionComponents = {
  InteractionFormWrapper,
  InteractionDashboard,
  InteractionKPICards,
  InteractionTable,
  InteractionTableActions,
  InteractionTableFilters
}

// Mobile field components
export const MobileFieldComponents = {
  QuickInteractionTemplates,
  MobileInteractionForm, 
  VoiceNotesInput,
  LocationTracker,
  OfflineInteractionQueue
}

// Form and input components
export const FormComponents = {
  InteractionTemplateSelect,
  InteractionTypeSelect,
  FollowUpScheduler,
  OrganizationLookup,
  OpportunitySelect,
  PrincipalSelect,
  VoiceNotesInput,
  LocationTracker
}

// UI and display components
export const UIComponents = {
  InteractionTypeBadge,
  InteractionPriorityBadge,
  PriorityBadge,
  SampleRating
}

/**
 * Type Definitions
 */
export type {
  // Add any shared type exports here if needed
} from '@/types/interactions'

/**
 * Constants and Utilities
 */
export {
  InteractionType,
  INTERACTION_TYPE_CONFIG,
  INTERACTION_TYPE_COLORS,
  calculateInteractionPriority,
  DEFAULT_FOLLOW_UP_DAYS
} from '@/types/interactions'