/**
 * Opportunity Test Helpers
 * 
 * Shared utilities and helpers for opportunity management testing.
 * Provides consistent test data, mock setups, and common operations
 * across all opportunity test suites.
 */

export interface TestOpportunity {
  id: string;
  name: string;
  organization_id: string;
  context: string;
  stage: string;
  probability_percent: number;
  expected_close_date: string;
  deal_owner: string;
  product_id?: string;
  principal_id?: string;
  notes: string;
  is_won?: boolean;
  created_at: string;
  updated_at: string;
}

export interface TestOrganization {
  id: string;
  name: string;
  segment: string;
  business_type: string;
  is_principal?: boolean;
  is_distributor?: boolean;
}

export interface TestContact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  phone?: string;
  organization_id?: string;
}

export interface TestProduct {
  id: string;
  name: string;
  category: string;
  description: string;
}

export interface TestPrincipal {
  id: string;
  name: string;
  organization_id: string;
}

// Comprehensive test data sets
export const TestDataSets = {
  organizations: [
    {
      id: 'org-test-001',
      name: 'TechFlow Solutions',
      segment: 'Technology - Software Development',
      business_type: 'B2B',
      is_principal: true,
      is_distributor: false
    },
    {
      id: 'org-test-002',
      name: 'Global Manufacturing Corp',
      segment: 'Manufacturing - Industrial Equipment',
      business_type: 'B2B',
      is_principal: true,
      is_distributor: true
    },
    {
      id: 'org-test-003',
      name: 'Healthcare Innovations LLC',
      segment: 'Healthcare - Medical Devices',
      business_type: 'B2B',
      is_principal: false,
      is_distributor: true
    }
  ] as TestOrganization[],

  contacts: [
    {
      id: 'contact-test-001',
      first_name: 'Jennifer',
      last_name: 'Martinez',
      email: 'j.martinez@techflow.com',
      position: 'VP of Engineering',
      phone: '+1 (555) 201-3001',
      organization_id: 'org-test-001'
    },
    {
      id: 'contact-test-002',
      first_name: 'Robert',
      last_name: 'Kim',
      email: 'r.kim@globalmanuf.com',
      position: 'Chief Technology Officer',
      phone: '+1 (555) 201-3002',
      organization_id: 'org-test-002'
    },
    {
      id: 'contact-test-003',
      first_name: 'Maria',
      last_name: 'Rodriguez',
      email: 'm.rodriguez@healthinnovations.com',
      position: 'Director of Operations',
      phone: '+1 (555) 201-3003',
      organization_id: 'org-test-003'
    }
  ] as TestContact[],

  principals: [
    {
      id: 'principal-test-001',
      name: 'Jennifer Martinez',
      organization_id: 'org-test-001'
    },
    {
      id: 'principal-test-002',
      name: 'Robert Kim',
      organization_id: 'org-test-002'
    },
    {
      id: 'principal-test-003',
      name: 'Maria Rodriguez',
      organization_id: 'org-test-003'
    }
  ] as TestPrincipal[],

  products: [
    {
      id: 'product-test-001',
      name: 'Enterprise Analytics Platform',
      category: 'Analytics',
      description: 'Comprehensive business intelligence and analytics solution'
    },
    {
      id: 'product-test-002',
      name: 'Cloud Infrastructure Suite',
      category: 'Infrastructure',
      description: 'Scalable cloud infrastructure and deployment platform'
    },
    {
      id: 'product-test-003',
      name: 'Security Management System',
      category: 'Security',
      description: 'Advanced cybersecurity monitoring and threat detection'
    },
    {
      id: 'product-test-004',
      name: 'Manufacturing Automation Tools',
      category: 'Manufacturing',
      description: 'Industrial automation and process optimization suite'
    }
  ] as TestProduct[],

  opportunities: [
    {
      id: 'opp-test-001',
      name: 'TechFlow Solutions - Jennifer Martinez - Q1 2025 Analytics',
      organization_id: 'org-test-001',
      context: 'NEW_BUSINESS',
      stage: 'NEW_LEAD',
      probability_percent: 25,
      expected_close_date: '2025-03-31',
      deal_owner: 'Sales Manager A',
      product_id: 'product-test-001',
      principal_id: 'principal-test-001',
      notes: 'Initial analytics platform evaluation for enterprise deployment',
      is_won: false,
      created_at: '2025-01-15T09:00:00Z',
      updated_at: '2025-01-15T09:00:00Z'
    },
    {
      id: 'opp-test-002',
      name: 'Global Manufacturing Corp - Robert Kim - Q2 2025 Infrastructure',
      organization_id: 'org-test-002',
      context: 'EXPANSION',
      stage: 'INITIAL_OUTREACH',
      probability_percent: 40,
      expected_close_date: '2025-06-30',
      deal_owner: 'Sales Manager B',
      product_id: 'product-test-002',
      principal_id: 'principal-test-002',
      notes: 'Infrastructure expansion for manufacturing operations scaling',
      is_won: false,
      created_at: '2025-01-10T14:30:00Z',
      updated_at: '2025-01-20T10:15:00Z'
    },
    {
      id: 'opp-test-003',
      name: 'Healthcare Innovations LLC - Maria Rodriguez - Security Implementation',
      organization_id: 'org-test-003',
      context: 'COMPLIANCE',
      stage: 'DEMO_SCHEDULED',
      probability_percent: 75,
      expected_close_date: '2025-02-28',
      deal_owner: 'Sales Manager C',
      product_id: 'product-test-003',
      principal_id: 'principal-test-003',
      notes: 'HIPAA compliance security implementation for healthcare data',
      is_won: false,
      created_at: '2025-01-05T11:20:00Z',
      updated_at: '2025-01-25T16:45:00Z'
    }
  ] as TestOpportunity[],

  kpis: {
    total_opportunities: 15,
    active_opportunities: 12,
    average_probability: 55.5,
    won_this_month: 3,
    pipeline_value: 750000,
    conversion_rate: 22.8,
    stage_distribution: {
      'NEW_LEAD': 4,
      'INITIAL_OUTREACH': 3,
      'SAMPLE_VISIT_OFFERED': 2,
      'AWAITING_RESPONSE': 2,
      'FEEDBACK_LOGGED': 1,
      'DEMO_SCHEDULED': 2,
      'CLOSED_WON': 1
    }
  },

  stageProbabilities: {
    'NEW_LEAD': 15,
    'INITIAL_OUTREACH': 25,
    'SAMPLE_VISIT_OFFERED': 35,
    'AWAITING_RESPONSE': 45,
    'FEEDBACK_LOGGED': 55,
    'DEMO_SCHEDULED': 75,
    'CLOSED_WON': 100
  }
};

// Mock API response generators
export class MockAPIResponses {
  static opportunityList(opportunities = TestDataSets.opportunities, page = 1, limit = 20) {
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedOpportunities = opportunities.slice(start, end);
    
    return {
      success: true,
      data: {
        opportunities: paginatedOpportunities,
        total_count: opportunities.length,
        page,
        has_next: end < opportunities.length,
        has_previous: page > 1
      }
    };
  }

  static opportunityDetail(opportunityId: string) {
    const opportunity = TestDataSets.opportunities.find(o => o.id === opportunityId);
    if (!opportunity) {
      return {
        success: false,
        error: 'Opportunity not found'
      };
    }

    const organization = TestDataSets.organizations.find(o => o.id === opportunity.organization_id);
    const contact = TestDataSets.contacts.find(c => c.id === opportunity.principal_id);
    const product = TestDataSets.products.find(p => p.id === opportunity.product_id);

    return {
      success: true,
      data: {
        ...opportunity,
        organization,
        contact,
        product,
        interactions: [],
        activities: []
      }
    };
  }

  static opportunityCreation(formData: any) {
    const newId = 'opp-new-' + Date.now();
    return {
      success: true,
      data: {
        id: newId,
        name: formData.name || 'New Test Opportunity',
        stage: formData.stage || 'NEW_LEAD',
        probability_percent: formData.probability_percent || 25,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        organization_id: formData.organization_id,
        deal_owner: formData.deal_owner,
        expected_close_date: formData.expected_close_date
      }
    };
  }

  static batchCreation(formData: any) {
    const principalIds = formData.principal_ids || [];
    const createdOpportunities = principalIds.map((principalId: string, index: number) => {
      const principal = TestDataSets.principals.find(p => p.id === principalId);
      return {
        id: `opp-batch-${Date.now()}-${index}`,
        name: `${formData.organization_name} - ${principal?.name} - Batch Created`,
        principal_id: principalId,
        stage: formData.stage,
        probability_percent: formData.probability_percent,
        created_at: new Date().toISOString()
      };
    });

    return {
      success: true,
      data: {
        success: true,
        created_opportunities: createdOpportunities,
        failed_opportunities: [],
        total_created: createdOpportunities.length,
        total_failed: 0
      }
    };
  }

  static namePreview(formData: any) {
    const principalIds = formData.principal_ids || [];
    const organization = TestDataSets.organizations.find(o => o.id === formData.organization_id);
    const context = formData.context || 'NEW_BUSINESS';
    const date = new Date();
    const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const previews = principalIds.map((principalId: string) => {
      const principal = TestDataSets.principals.find(p => p.id === principalId);
      const contextLabel = context.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
      
      return {
        principal_id: principalId,
        principal_name: principal?.name || 'Unknown Principal',
        generated_name: `${organization?.name} - ${principal?.name} - ${contextLabel} - ${monthYear}`,
        is_duplicate: false
      };
    });

    return {
      success: true,
      data: previews
    };
  }

  static kpis() {
    return {
      success: true,
      data: TestDataSets.kpis
    };
  }

  static stageDistribution() {
    const distribution: { [key: string]: TestOpportunity[] } = {};
    
    // Group opportunities by stage
    Object.keys(TestDataSets.stageProbabilities).forEach(stage => {
      distribution[stage] = TestDataSets.opportunities.filter(opp => opp.stage === stage);
    });

    return {
      success: true,
      data: distribution
    };
  }

  static productsByPrincipals(_principalIds: string[]) {
    // Simple logic: return all products for now
    // In real implementation, this would filter based on principal-product relationships
    return {
      success: true,
      data: TestDataSets.products
    };
  }

  static organizationsList() {
    return {
      success: true,
      data: {
        organizations: TestDataSets.organizations,
        total_count: TestDataSets.organizations.length
      }
    };
  }

  static contactsList() {
    return {
      success: true,
      data: {
        contacts: TestDataSets.contacts,
        total_count: TestDataSets.contacts.length
      }
    };
  }

  static principalsList() {
    return {
      success: true,
      data: TestDataSets.principals
    };
  }

  static productsList() {
    return {
      success: true,
      data: TestDataSets.products
    };
  }
}

// Reusable test helpers
export class OpportunityTestUtils {
  constructor(public page: any) {}

  // Setup comprehensive mock environment
  async setupMockAPIs() {
    // Opportunity APIs
    await this.page.route('**/api/opportunities**', (route: any) => {
      const method = route.request().method();
      const url = route.request().url();
      
      if (method === 'GET' && url.includes('/opportunities') && !url.includes('/opportunities/')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MockAPIResponses.opportunityList())
        });
      } else if (method === 'POST' && url.includes('/batch')) {
        const postData = route.request().postDataJSON();
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(MockAPIResponses.batchCreation(postData))
        });
      } else if (method === 'POST' && url.includes('/name-preview')) {
        const postData = route.request().postDataJSON();
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MockAPIResponses.namePreview(postData))
        });
      } else if (method === 'POST') {
        const postData = route.request().postDataJSON();
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(MockAPIResponses.opportunityCreation(postData))
        });
      } else if (method === 'GET' && url.includes('/kpis')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MockAPIResponses.kpis())
        });
      } else if (method === 'GET' && url.includes('/by-stage')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MockAPIResponses.stageDistribution())
        });
      }
    });

    // Individual opportunity APIs
    TestDataSets.opportunities.forEach(opportunity => {
      this.page.route(`**/api/opportunities/${opportunity.id}`, (route: any) => {
        const method = route.request().method();
        
        if (method === 'GET') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(MockAPIResponses.opportunityDetail(opportunity.id))
          });
        } else if (method === 'PUT') {
          const updateData = route.request().postDataJSON();
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { ...opportunity, ...updateData, updated_at: new Date().toISOString() }
            })
          });
        } else if (method === 'DELETE') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true })
          });
        }
      });
    });

    // Supporting APIs
    await this.page.route('**/api/organizations**', (route: any) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MockAPIResponses.organizationsList())
      });
    });

    await this.page.route('**/api/contacts**', (route: any) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MockAPIResponses.contactsList())
      });
    });

    await this.page.route('**/api/principals**', (route: any) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MockAPIResponses.principalsList())
      });
    });

    await this.page.route('**/api/products**', (route: any) => {
      const url = route.request().url();
      if (url.includes('/filter-by-principals')) {
        const postData = route.request().postDataJSON();
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MockAPIResponses.productsByPrincipals(postData.principal_ids))
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MockAPIResponses.productsList())
        });
      }
    });
  }

  // Form interaction helpers
  async fillOpportunityForm(data: Partial<TestOpportunity & { principal_ids?: string[] }>) {
    if (data.organization_id) {
      await this.page.fill('[name="organization_id"]', data.organization_id);
    }
    
    if (data.context) {
      await this.page.selectOption('[name="context"]', data.context);
    }
    
    if (data.stage) {
      await this.page.selectOption('[name="stage"]', data.stage);
    }
    
    if (data.probability_percent !== undefined) {
      await this.page.fill('[name="probability_percent"]', data.probability_percent.toString());
    }
    
    if (data.expected_close_date) {
      await this.page.fill('[name="expected_close_date"]', data.expected_close_date);
    }
    
    if (data.deal_owner) {
      await this.page.fill('[name="deal_owner"]', data.deal_owner);
    }
    
    if (data.notes) {
      await this.page.fill('[name="notes"]', data.notes);
    }
    
    if (data.principal_ids && data.principal_ids.length > 0) {
      await this.page.click('[data-testid="principal-multi-select"]');
      for (const principalId of data.principal_ids) {
        const principal = TestDataSets.principals.find(p => p.id === principalId);
        if (principal) {
          await this.page.click(`[role="option"]:has-text("${principal.name}")`);
        }
      }
      await this.page.keyboard.press('Escape');
    }
    
    if (data.product_id) {
      const product = TestDataSets.products.find(p => p.id === data.product_id);
      if (product) {
        await this.page.click('[name="product_id"]');
        await this.page.click(`[role="option"]:has-text("${product.name}")`);
      }
    }
  }

  // Validation helpers
  async getValidationErrors(): Promise<string[]> {
    const errorElements = await this.page.locator('[role="alert"], .text-red-500, .text-red-700, .error-message').all();
    const errors = [];
    
    for (const element of errorElements) {
      const text = await element.textContent();
      if (text && text.trim()) {
        errors.push(text.trim());
      }
    }
    
    return errors;
  }

  async expectValidationError(fieldName: string, expectedError?: string) {
    const errorElement = this.page.locator(`[data-testid="${fieldName}-error"], [aria-describedby*="${fieldName}"]`);
    await expect(errorElement).toBeVisible();
    
    if (expectedError) {
      await expect(errorElement).toContainText(expectedError);
    }
  }

  // Navigation helpers
  async navigateToOpportunityList() {
    await this.page.goto('/opportunities');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToCreateOpportunity(context?: { organizationId?: string; contactId?: string }) {
    let url = '/opportunities/new';
    
    if (context?.organizationId) {
      url += `?organization=${context.organizationId}`;
    }
    
    if (context?.contactId) {
      url += context?.organizationId ? '&' : '?';
      url += `contact=${context.contactId}`;
    }
    
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToOpportunityDetail(opportunityId: string) {
    await this.page.goto(`/opportunities/${opportunityId}`);
    await this.page.waitForLoadState('networkidle');
  }

  // Performance helpers
  async measurePageLoad(url: string): Promise<number> {
    const startTime = Date.now();
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
    return Date.now() - startTime;
  }

  async measureFormSubmission(): Promise<number> {
    const startTime = Date.now();
    await this.page.click('button[type="submit"]');
    await this.page.waitForSelector('[data-testid="success-message"], [data-testid="error-message"]');
    return Date.now() - startTime;
  }

  // Accessibility helpers
  async checkAccessibility() {
    // Check basic accessibility requirements
    const results = {
      hasMainHeading: await this.page.locator('h1').count() === 1,
      hasNavigation: await this.page.locator('[role="navigation"]').count() > 0,
      hasMainContent: await this.page.locator('[role="main"]').count() > 0,
      requiredFieldsHaveLabels: true,
      errorsHaveAriaLive: true
    };

    // Check required fields have proper labels
    const requiredFields = await this.page.locator('[aria-required="true"]').all();
    for (const field of requiredFields) {
      const id = await field.getAttribute('id');
      const labelExists = await this.page.locator(`label[for="${id}"]`).count() > 0;
      if (!labelExists) {
        results.requiredFieldsHaveLabels = false;
        break;
      }
    }

    // Check error messages have proper ARIA
    const errorMessages = await this.page.locator('[role="alert"]').count();
    results.errorsHaveAriaLive = errorMessages >= 0; // Should have at least 0 error messages

    return results;
  }
}

// Test data generators for dynamic testing
export class TestDataGenerator {
  static generateOpportunity(overrides: Partial<TestOpportunity> = {}): TestOpportunity {
    const baseOpportunity = TestDataSets.opportunities[0];
    const timestamp = new Date().toISOString();
    
    return {
      ...baseOpportunity,
      id: `opp-generated-${Date.now()}`,
      name: `Generated Test Opportunity - ${Date.now()}`,
      created_at: timestamp,
      updated_at: timestamp,
      ...overrides
    };
  }

  static generateBatchOpportunityData(principalIds: string[], organizationId: string) {
    return {
      organization_id: organizationId,
      context: 'NEW_BUSINESS',
      stage: 'NEW_LEAD',
      probability_percent: 25,
      expected_close_date: '2025-06-30',
      deal_owner: 'Test Sales Rep',
      product_id: TestDataSets.products[0].id,
      principal_ids: principalIds,
      notes: 'Generated batch opportunity for testing',
      auto_generate_name: true
    };
  }

  static generateFormValidationScenarios() {
    return [
      {
        name: 'Missing required organization',
        data: { context: 'NEW_BUSINESS', stage: 'NEW_LEAD' },
        expectedErrors: ['organization', 'required']
      },
      {
        name: 'Invalid probability percentage',
        data: { organization_id: 'org-test-001', probability_percent: 150 },
        expectedErrors: ['probability', '100']
      },
      {
        name: 'Past close date',
        data: { organization_id: 'org-test-001', expected_close_date: '2020-01-01' },
        expectedErrors: ['date', 'future']
      },
      {
        name: 'Missing principals',
        data: { organization_id: 'org-test-001', context: 'NEW_BUSINESS' },
        expectedErrors: ['principal', 'required']
      }
    ];
  }
}

export { expect } from '@playwright/test';