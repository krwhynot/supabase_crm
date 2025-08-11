/**
 * Test Data Fixtures for Contact Forms
 * 
 * Provides comprehensive test data scenarios for both development (mock)
 * and production (real database) testing environments.
 */

import { ContactFormData } from '../helpers/ContactTestHelpers';

export interface ContactTestScenario {
  name: string;
  description: string;
  data: ContactFormData;
  expectedOutcome: 'success' | 'validation_error' | 'database_error';
  validationErrors?: string[];
}

/**
 * Valid contact data for successful form submissions
 */
export const validContactData: ContactFormData = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@testcompany.com',
  organization: 'Test Company Inc.',
  title: 'Chief Technology Officer',
  phone: '(555) 123-4567', // Use proper phone format
  position: 'Manager', // Use actual position from form options
  authority_level: 'HIGH',
  influence_level: 'HIGH',
  contact_preference: 'EMAIL',
  notes: 'Strategic contact for technology solutions. Previously worked at major tech companies.'
};

/**
 * Alternative valid contact data for batch testing
 */
export const alternativeValidContacts: ContactFormData[] = [
  {
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@retailcorp.com',
    organization: 'Retail Corp',
    title: 'VP of Operations',
    phone: '555-0124',
    position: 'INFLUENCER',
    authority_level: 'HIGH',
    influence_level: 'MEDIUM',
    contact_preference: 'PHONE'
  },
  {
    first_name: 'Mike',
    last_name: 'Johnson',
    email: 'mike.johnson@startupxyz.com',
    organization: 'Startup XYZ',
    title: 'Founder & CEO',
    phone: '555-0125',
    position: 'DECISION_MAKER',
    authority_level: 'HIGH',
    influence_level: 'HIGH',
    contact_preference: 'IN_PERSON'
  },
  {
    first_name: 'Sarah',
    last_name: 'Williams',
    email: 'sarah.williams@enterprise.com',
    organization: 'Enterprise Solutions Ltd.',
    title: 'Director of Purchasing',
    phone: '555-0126',
    position: 'BUYER',
    authority_level: 'MEDIUM',
    influence_level: 'HIGH',
    contact_preference: 'EMAIL'
  }
];

/**
 * Invalid data scenarios for validation testing
 */
export const invalidContactScenarios: ContactTestScenario[] = [
  {
    name: 'Empty Required Fields',
    description: 'All required fields left empty',
    data: {
      first_name: '',
      last_name: '',
      email: '',
      organization: ''
    },
    expectedOutcome: 'validation_error',
    validationErrors: [
      'First name is required',
      'Last name is required', 
      'Email is required',
      'Organization is required'
    ]
  },
  {
    name: 'Invalid Email Format',
    description: 'Email field contains invalid email address',
    data: {
      first_name: 'Test',
      last_name: 'User',
      email: 'invalid-email-format',
      organization: 'Test Company'
    },
    expectedOutcome: 'validation_error',
    validationErrors: ['Email must be a valid email address']
  },
  {
    name: 'Email Too Long',
    description: 'Email exceeds maximum length',
    data: {
      first_name: 'Test',
      last_name: 'User',
      email: 'a'.repeat(250) + '@example.com', // Very long email
      organization: 'Test Company'
    },
    expectedOutcome: 'validation_error',
    validationErrors: ['Email is too long']
  },
  {
    name: 'Invalid Phone Format',
    description: 'Phone number contains invalid characters',
    data: {
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      organization: 'Test Company',
      phone: 'abc-def-ghij'
    },
    expectedOutcome: 'validation_error',
    validationErrors: ['Phone number must contain only numbers, spaces, hyphens, and parentheses']
  },
  {
    name: 'Name Too Long',
    description: 'First and last names exceed maximum length',
    data: {
      first_name: 'A'.repeat(300), // Very long name
      last_name: 'B'.repeat(300),
      email: 'test@example.com',
      organization: 'Test Company'
    },
    expectedOutcome: 'validation_error',
    validationErrors: [
      'First name must be less than 255 characters',
      'Last name must be less than 255 characters'
    ]
  }
];

/**
 * Edge case scenarios
 */
export const edgeCaseContacts: ContactTestScenario[] = [
  {
    name: 'Special Characters in Names',
    description: 'Names with special characters, accents, and symbols',
    data: {
      first_name: "François-José",
      last_name: "O'Connor-Smith",
      email: 'francois.jose@company.com',
      organization: 'Société Générale & Co.'
    },
    expectedOutcome: 'success'
  },
  {
    name: 'Unicode Characters',
    description: 'Names with Unicode characters from various languages',
    data: {
      first_name: '김',
      last_name: '민수',
      email: 'kim.minsu@korean-company.com',
      organization: '한국 기업'
    },
    expectedOutcome: 'success'
  },
  {
    name: 'Very Long Organization Name',
    description: 'Organization name at maximum allowed length',
    data: {
      first_name: 'Test',
      last_name: 'User',
      email: 'test@longcompanyname.com',
      organization: 'Very Long Company Name That Tests The Maximum Length Allowed In The Database Field And Form Validation System To Ensure Proper Handling Of Edge Cases In The Contact Management System'
    },
    expectedOutcome: 'success'
  },
  {
    name: 'International Phone Number',
    description: 'Phone number with international formatting',
    data: {
      first_name: 'International',
      last_name: 'Contact',
      email: 'international@global.com',
      organization: 'Global Corp',
      phone: '+1 (555) 123-4567 ext. 890'
    },
    expectedOutcome: 'success'
  }
];

/**
 * Duplicate detection scenarios
 */
export const duplicateTestScenarios: ContactTestScenario[] = [
  {
    name: 'Duplicate Email',
    description: 'Attempt to create contact with existing email address',
    data: {
      first_name: 'Different',
      last_name: 'Person',
      email: 'john.doe@testcompany.com', // Same as validContactData
      organization: 'Different Company'
    },
    expectedOutcome: 'validation_error',
    validationErrors: ['A contact with this email address already exists']
  },
  {
    name: 'Similar Name Different Email',
    description: 'Similar name but different email should succeed',
    data: {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe.different@company.com', // Different email
      organization: 'Test Company Inc.'
    },
    expectedOutcome: 'success'
  }
];

/**
 * Performance test data
 */
export const performanceTestData = {
  batchCreateCount: 50,
  concurrentUserCount: 5,
  stressTestCount: 100
};

/**
 * Generate test contact data with unique identifiers
 */
export function generateUniqueContactData(
  prefix: string = 'test',
  index?: number
): ContactFormData {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 5);
  const suffix = index !== undefined ? `_${index}` : '';
  
  return {
    first_name: `${prefix}_first_${random}${suffix}`,
    last_name: `${prefix}_last_${random}${suffix}`,
    email: `${prefix}_${random}_${timestamp}${suffix}@example.com`,
    organization: `${prefix} Organization ${random}${suffix}`,
    title: `Test Title ${random}`,
    phone: `555-${(timestamp % 10000).toString().padStart(4, '0')}`,
    position: 'DECISION_MAKER',
    authority_level: 'HIGH',
    influence_level: 'HIGH',
    contact_preference: 'EMAIL',
    notes: `Automated test contact created at ${new Date().toISOString()}`
  };
}

/**
 * Generate batch test data
 */
export function generateBatchTestData(count: number, prefix: string = 'batch_test'): ContactFormData[] {
  return Array.from({ length: count }, (_, index) => 
    generateUniqueContactData(prefix, index)
  );
}

/**
 * Multi-step form test data
 */
export const multiStepFormTestData = {
  step1: {
    first_name: 'Multi',
    last_name: 'Step',
    email: 'multistep@test.com',
    organization: 'Multi Step Test Corp',
    title: 'Test Manager',
    phone: '555-9999'
  },
  step2: {
    authority_level: 'HIGH' as const,
    influence_level: 'MEDIUM' as const,
    position: 'DECISION_MAKER' as const
  },
  step3: {
    contact_preference: 'EMAIL' as const,
    notes: 'This contact was created through a multi-step form test to validate the step-by-step user experience and data persistence across form pages.'
  }
};

/**
 * Database constraint test data
 */
export const constraintTestData = {
  maxLengthEmail: 'a'.repeat(240) + '@test.com', // Just under typical email length limits
  maxLengthName: 'A'.repeat(254), // Just under typical varchar(255) limit
  minValidEmail: 'a@b.co', // Minimum valid email
  specialCharEmail: 'test+tag@sub-domain.example-site.com',
  caseInsensitiveEmail: 'Test.User@EXAMPLE.COM'
};

/**
 * Accessibility test scenarios
 */
export const accessibilityTestData = {
  keyboardNavigation: validContactData,
  screenReader: {
    ...validContactData,
    notes: 'This contact is being created to test screen reader compatibility and ARIA label functionality.'
  },
  highContrast: validContactData
};

/**
 * Error recovery test scenarios
 */
export const errorRecoveryScenarios: ContactTestScenario[] = [
  {
    name: 'Network Timeout Recovery',
    description: 'Test form behavior when network request times out',
    data: validContactData,
    expectedOutcome: 'database_error'
  },
  {
    name: 'Server Error Recovery', 
    description: 'Test form behavior when server returns 500 error',
    data: validContactData,
    expectedOutcome: 'database_error'
  },
  {
    name: 'Database Connection Error',
    description: 'Test form behavior when database is unavailable',
    data: validContactData,
    expectedOutcome: 'database_error'
  }
];

/**
 * Export all test data as a comprehensive test suite
 */
export const contactTestSuite = {
  valid: {
    single: validContactData,
    multiple: alternativeValidContacts,
    multiStep: multiStepFormTestData
  },
  invalid: invalidContactScenarios,
  edgeCases: edgeCaseContacts,
  duplicates: duplicateTestScenarios,
  performance: performanceTestData,
  constraints: constraintTestData,
  accessibility: accessibilityTestData,
  errorRecovery: errorRecoveryScenarios,
  generators: {
    unique: generateUniqueContactData,
    batch: generateBatchTestData
  }
};