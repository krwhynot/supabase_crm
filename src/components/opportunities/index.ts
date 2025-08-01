/**
 * Opportunity Components Index
 * 
 * Exports all opportunity-related Vue components for easy importing
 * throughout the application. This follows the established pattern
 * of component organization in the CRM system.
 */

// Form Components (Phase 5.1)
export { default as OpportunityNameField } from './OpportunityNameField.vue'
export { default as PrincipalMultiSelect } from './PrincipalMultiSelect.vue'
export { default as ProductSelect } from './ProductSelect.vue'
export { default as StageSelect } from './StageSelect.vue'

// Display Components (Phase 5.2)
export { default as OpportunityKPICards } from './OpportunityKPICards.vue'
export { default as StageTag } from './StageTag.vue'
export { default as ProbabilityBar } from './ProbabilityBar.vue'
export { default as OpportunityTable } from './OpportunityTable.vue'

/**
 * Component Type Exports
 * 
 * Re-export component types for TypeScript usage
 */
export type {
  // Types would be defined in individual component files
  // and could be re-exported here if needed for external use
} from '@/types/opportunities'

/**
 * Usage Examples:
 * 
 * // Individual imports
 * import { OpportunityKPICards, StageTag } from '@/components/opportunities'
 * 
 * // Bulk import for opportunity pages
 * import * as OpportunityComponents from '@/components/opportunities'
 * 
 * // Specific form component
 * import { OpportunityNameField } from '@/components/opportunities'
 */