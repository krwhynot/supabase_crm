/**
 * Test Data Fixtures for Opportunity Forms
 * 
 * Provides comprehensive test data scenarios for opportunity creation including
 * batch operations, auto-naming validation, and complex business logic testing.
 */

import { OpportunityFormData } from '../helpers/OpportunityTestHelpers';

export interface OpportunityTestScenario {
  name: string;
  description: string;
  data: OpportunityFormData;
  expectedOutcome: 'success' | 'validation_error' | 'database_error';
  validationErrors?: string[];
}

/**
 * Valid opportunity data for successful form submissions
 */
export const validOpportunityData: OpportunityFormData = {
  name: 'Enterprise Software Implementation',
  stage: 'NEW_LEAD',
  probability_percent: 25,
  expected_close_date: '2024-12-31',
  organization_name: 'Acme Corporation',
  deal_owner: 'John Sales Rep',
  context: 'COLD_OUTREACH',
  notes: 'Large enterprise opportunity with high potential value. Initial contact made through LinkedIn outreach.',
  auto_name: false
};

/**
 * Auto-naming test scenarios
 */
export const autoNamingTestData = {
  withContext: {
    organization_name: 'Tech Innovations Inc',
    context: 'WARM_INTRODUCTION',
    auto_name: true,
    expected_pattern: 'Tech Innovations Inc - [Principal] - Warm Introduction'
  },
  
  withCustomContext: {
    organization_name: 'Global Manufacturing Co',
    context: 'OTHER',
    custom_context: 'Trade Show Meeting',
    auto_name: true,
    expected_pattern: 'Global Manufacturing Co - [Principal] - Trade Show Meeting'
  },
  
  multiPrincipal: {
    organization_name: 'Enterprise Solutions Ltd',
    context: 'REFERRAL',
    principal_ids: ['principal-1', 'principal-2', 'principal-3'],
    auto_name: true,
    expected_count: 3,
    expected_pattern_base: 'Enterprise Solutions Ltd - [Principal] - Referral'
  }
};

/**
 * Batch creation test scenarios
 */
export const batchCreationTestData: OpportunityTestScenario[] = [
  {
    name: 'Small Batch Creation',
    description: 'Create 3 opportunities for different principals in same organization',
    data: {
      organization_name: 'Small Business Corp',
      context: 'INBOUND_INQUIRY',
      principal_ids: ['principal-1', 'principal-2', 'principal-3'],
      stage: 'NEW_LEAD',
      probability_percent: 20,
      product_id: 'product-basic',
      deal_owner: 'Sales Rep Alpha',
      auto_name: true
    },
    expectedOutcome: 'success'
  },
  
  {
    name: 'Large Batch Creation',
    description: 'Create 10 opportunities for multiple principals',
    data: {
      organization_name: 'Enterprise Mega Corp',
      context: 'EVENT_MEETING',
      principal_ids: Array.from({ length: 10 }, (_, i) => `principal-${i + 1}`),
      stage: 'INITIAL_OUTREACH',
      probability_percent: 15,
      product_id: 'product-enterprise',
      deal_owner: 'Senior Sales Manager',
      notes: 'Met at annual industry conference. High interest in enterprise solution.',
      auto_name: true
    },
    expectedOutcome: 'success'
  },
  
  {
    name: 'Mixed Context Batch',
    description: 'Batch creation with custom context',
    data: {
      organization_name: 'Custom Solutions Provider',
      context: 'OTHER',
      custom_context: 'Partner Channel Introduction',
      principal_ids: ['principal-a', 'principal-b', 'principal-c', 'principal-d'],
      stage: 'NEW_LEAD',
      probability_percent: 30,
      auto_name: true
    },
    expectedOutcome: 'success'
  }
];

/**
 * Invalid data scenarios for validation testing
 */
export const invalidOpportunityScenarios: OpportunityTestScenario[] = [
  {
    name: 'Missing Required Organization',
    description: 'Organization not specified',
    data: {
      context: 'COLD_OUTREACH',
      principal_id: 'principal-1',
      stage: 'NEW_LEAD'
    },
    expectedOutcome: 'validation_error',
    validationErrors: ['Organization is required']
  },
  
  {
    name: 'Missing Required Principal',
    description: 'No principal selected',
    data: {
      organization_name: 'Test Company',
      context: 'COLD_OUTREACH',
      stage: 'NEW_LEAD'
    },
    expectedOutcome: 'validation_error',
    validationErrors: ['At least one principal must be selected']
  },
  
  {
    name: 'Invalid Probability Range',
    description: 'Probability percentage outside valid range',
    data: {
      organization_name: 'Test Company',
      principal_id: 'principal-1',
      context: 'COLD_OUTREACH',
      probability_percent: 150, // Invalid: over 100%
      stage: 'NEW_LEAD'
    },
    expectedOutcome: 'validation_error',
    validationErrors: ['Probability must be between 0 and 100']
  },
  
  {
    name: 'Invalid Expected Close Date',
    description: 'Close date in the past',
    data: {
      organization_name: 'Test Company',
      principal_id: 'principal-1',
      context: 'COLD_OUTREACH',
      expected_close_date: '2020-01-01', // Past date
      stage: 'NEW_LEAD'
    },
    expectedOutcome: 'validation_error',
    validationErrors: ['Expected close date cannot be in the past']
  },
  
  {
    name: 'Empty Custom Context',
    description: 'Custom context required when OTHER selected',
    data: {
      organization_name: 'Test Company',
      principal_id: 'principal-1',
      context: 'OTHER',
      custom_context: '', // Empty when required
      stage: 'NEW_LEAD'
    },
    expectedOutcome: 'validation_error',
    validationErrors: ['Custom context is required when "Other" is selected']
  },
  
  {
    name: 'Name Too Long',
    description: 'Opportunity name exceeds maximum length',
    data: {
      name: 'A'.repeat(500), // Very long name
      organization_name: 'Test Company',
      principal_id: 'principal-1',
      context: 'COLD_OUTREACH',
      stage: 'NEW_LEAD',
      auto_name: false
    },
    expectedOutcome: 'validation_error',
    validationErrors: ['Opportunity name must be less than 255 characters']
  }
];

/**
 * Business logic test scenarios
 */
export const businessLogicScenarios: OpportunityTestScenario[] = [
  {
    name: 'Stage Probability Alignment',
    description: 'Test automatic probability adjustment based on stage',
    data: {
      organization_name: 'Logic Test Corp',
      principal_id: 'principal-1',
      context: 'WARM_INTRODUCTION',
      stage: 'DEMO_SCHEDULED',
      probability_percent: 10, // Should be adjusted up for advanced stage
      auto_name: true
    },
    expectedOutcome: 'success'
  },
  
  {
    name: 'Won Opportunity Validation',
    description: 'Test CLOSED_WON stage requires 100% probability',
    data: {
      organization_name: 'Winner Corp',
      principal_id: 'principal-1',
      context: 'EXISTING_RELATIONSHIP',
      stage: 'CLOSED_WON',
      probability_percent: 85, // Should be corrected to 100%
      auto_name: true
    },
    expectedOutcome: 'success'
  }
];

/**
 * Edge case scenarios
 */
export const edgeCaseOpportunities: OpportunityTestScenario[] = [
  {
    name: 'Special Characters in Organization',
    description: 'Organization name with special characters and Unicode',
    data: {
      organization_name: 'Société Générale & Co. (München) 株式会社',
      principal_id: 'principal-1',
      context: 'COLD_OUTREACH',
      stage: 'NEW_LEAD',
      auto_name: true
    },
    expectedOutcome: 'success'
  },
  
  {
    name: 'Very Long Notes Field',
    description: 'Notes field with maximum allowed content',
    data: {
      organization_name: 'Notes Test Company',
      principal_id: 'principal-1',
      context: 'COLD_OUTREACH',
      stage: 'NEW_LEAD',
      notes: 'This is a very long notes field that tests the maximum character limit. '.repeat(20) + 'End of notes.',
      auto_name: true
    },
    expectedOutcome: 'success'
  },
  
  {
    name: 'Minimum Probability Edge Case',
    description: 'Zero probability opportunity',
    data: {
      organization_name: 'Edge Case Corp',
      principal_id: 'principal-1',
      context: 'COLD_OUTREACH',
      stage: 'NEW_LEAD',
      probability_percent: 0,
      auto_name: true
    },
    expectedOutcome: 'success'
  },
  
  {
    name: 'Maximum Probability Edge Case', 
    description: 'One hundred percent probability opportunity',
    data: {
      organization_name: 'Certain Winner LLC',
      principal_id: 'principal-1',
      context: 'EXISTING_RELATIONSHIP',
      stage: 'CLOSED_WON',
      probability_percent: 100,
      auto_name: true
    },
    expectedOutcome: 'success'
  }
];

/**
 * Performance test scenarios
 */
export const performanceTestData = {
  batchSizes: [1, 5, 10, 25],
  concurrentUserCount: 3,
  stressTestBatchSize: 50,
  loadTestDuration: 30000, // 30 seconds
  
  // Large dataset for performance testing
  massCreationScenario: {
    organization_name: 'Performance Test Enterprise',
    context: 'COLD_OUTREACH',
    stage: 'NEW_LEAD',
    probability_percent: 20,
    deal_owner: 'Performance Test User',
    auto_name: true,
    principal_count: 100 // Will be generated dynamically
  }
};

/**
 * Integration test scenarios
 */
export const integrationTestScenarios = {
  contactToOpportunity: {
    description: 'Create opportunity from contact detail page',
    preCondition: 'existing_contact',
    data: {
      context: 'EXISTING_RELATIONSHIP',
      stage: 'INITIAL_OUTREACH',
      probability_percent: 40,
      auto_name: true
    }
  },
  
  organizationToOpportunity: {
    description: 'Create multiple opportunities from organization page',
    preCondition: 'existing_organization_with_principals',
    data: {
      context: 'WARM_INTRODUCTION',
      stage: 'NEW_LEAD',
      probability_percent: 30,
      principal_count: 5,
      auto_name: true
    }
  }
};

/**
 * Generate test opportunity data with unique identifiers
 */
export function generateUniqueOpportunityData(
  prefix: string = 'test',
  index?: number
): OpportunityFormData {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 5);
  const suffix = index !== undefined ? `_${index}` : '';
  
  return {
    name: `${prefix}_opportunity_${random}${suffix}`,
    organization_name: `${prefix} Organization ${random}${suffix}`,
    context: 'COLD_OUTREACH',
    stage: 'NEW_LEAD',
    probability_percent: 25,
    deal_owner: `${prefix}_owner_${random}${suffix}`,
    notes: `Automated test opportunity created at ${new Date().toISOString()}`,
    auto_name: false
  };
}

/**
 * Generate batch test data for multiple principals
 */
export function generateBatchOpportunityData(
  principalCount: number,
  prefix: string = 'batch_test'
): OpportunityFormData {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 5);
  
  return {
    organization_name: `${prefix} Batch Organization ${random}`,
    context: 'COLD_OUTREACH',
    stage: 'NEW_LEAD',
    probability_percent: 25,
    deal_owner: `${prefix}_batch_owner_${random}`,
    notes: `Batch test opportunity for ${principalCount} principals created at ${new Date().toISOString()}`,
    principal_ids: Array.from({ length: principalCount }, (_, i) => `${prefix}_principal_${i}_${random}`),
    auto_name: true
  };
}

/**
 * Auto-naming test data generators
 */
export function generateAutoNamingTestData(
  organization: string,
  context: string,
  principalCount: number = 1
): OpportunityFormData {
  return {
    organization_name: organization,
    context: context as any,
    stage: 'NEW_LEAD',
    probability_percent: 20,
    principal_ids: Array.from({ length: principalCount }, (_, i) => `auto_principal_${i}_${Date.now()}`),
    auto_name: true,
    notes: `Auto-naming test for ${organization} with context ${context}`
  };
}

/**
 * Export comprehensive opportunity test suite
 */
export const opportunityTestSuite = {
  valid: {
    single: validOpportunityData,
    autoNaming: autoNamingTestData,
    batchCreation: batchCreationTestData
  },
  invalid: invalidOpportunityScenarios,
  businessLogic: businessLogicScenarios,
  edgeCases: edgeCaseOpportunities,
  performance: performanceTestData,
  integration: integrationTestScenarios,
  generators: {
    unique: generateUniqueOpportunityData,
    batch: generateBatchOpportunityData,
    autoNaming: generateAutoNamingTestData
  }
};