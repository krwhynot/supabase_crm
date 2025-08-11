import { Page } from '@playwright/test';
import { MockQueryBuilder } from '../../src/config/supabaseClient';

/**
 * Environment Manager for Dual-Environment Testing
 * 
 * Handles switching between MCP mock mode (development) and 
 * real Supabase mode (production) for comprehensive testing.
 */

export type TestEnvironment = 'development' | 'production';

export interface EnvironmentConfig {
  environment: TestEnvironment;
  mockMode: boolean;
  databaseUrl?: string;
  apiKey?: string;
  baseUrl: string;
}

export class EnvironmentManager {
  private currentEnvironment: TestEnvironment;
  private page: Page;
  
  constructor(page: Page, environment: TestEnvironment = 'development') {
    this.page = page;
    this.currentEnvironment = environment;
  }

  /**
   * Initialize the environment based on the current configuration
   */
  async initialize(): Promise<void> {
    const config = this.getEnvironmentConfig();
    
    // Set environment-specific context
    await this.page.addInitScript((config) => {
      // Make environment config available to the page
      (window as any).__TEST_ENVIRONMENT__ = config.environment;
      (window as any).__MOCK_MODE__ = config.mockMode;
      (window as any).__TEST_CONFIG__ = config;
    }, config);

    if (config.mockMode) {
      await this.setupMockEnvironment();
    } else {
      await this.setupProductionEnvironment();
    }
  }

  /**
   * Get configuration for the current environment
   */
  getEnvironmentConfig(): EnvironmentConfig {
    const isDevelopment = this.currentEnvironment === 'development';
    
    return {
      environment: this.currentEnvironment,
      mockMode: isDevelopment,
      databaseUrl: isDevelopment ? 'mock://localhost' : process.env.VITE_TEST_SUPABASE_URL,
      apiKey: isDevelopment ? 'mock-anon-key' : process.env.VITE_TEST_SUPABASE_ANON_KEY,
      baseUrl: isDevelopment ? 'http://localhost:3000' : 'http://localhost:3001'
    };
  }

  /**
   * Setup mock environment for development testing
   */
  private async setupMockEnvironment(): Promise<void> {
    // Clear any existing mock data
    await this.page.addInitScript(() => {
      if (typeof window !== 'undefined') {
        (window as any).__CLEAR_MOCK_DATA__ = true;
      }
    });

    // Initialize mock responses
    await this.setupMockResponses();
  }

  /**
   * Setup production environment for real database testing
   */
  private async setupProductionEnvironment(): Promise<void> {
    const config = this.getEnvironmentConfig();
    
    // Validate required production environment variables
    if (!config.databaseUrl || !config.apiKey) {
      throw new Error('Production testing requires VITE_TEST_SUPABASE_URL and VITE_TEST_SUPABASE_ANON_KEY');
    }

    // Set up real database connection parameters
    await this.page.addInitScript((config) => {
      // Override environment variables for production testing
      if (typeof window !== 'undefined') {
        (window as any).__SUPABASE_CONFIG__ = {
          url: config.databaseUrl,
          key: config.apiKey
        };
      }
    }, config);
  }

  /**
   * Setup mock API responses for development testing
   */
  private async setupMockResponses(): Promise<void> {
    // Mock successful responses for common API endpoints
    await this.page.route('**/api/contacts**', route => {
      const method = route.request().method();
      
      if (method === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: `mock-contact-${Date.now()}`,
              first_name: 'Test',
              last_name: 'Contact',
              email: 'test@example.com',
              organization: 'Test Organization',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          })
        });
      } else {
        route.continue();
      }
    });

    await this.page.route('**/api/opportunities**', route => {
      const method = route.request().method();
      
      if (method === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: `mock-opportunity-${Date.now()}`,
              name: 'Test Opportunity',
              stage: 'NEW_LEAD',
              probability_percent: 25,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          })
        });
      } else {
        route.continue();
      }
    });

    await this.page.route('**/api/organizations**', route => {
      const method = route.request().method();
      
      if (method === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: `mock-organization-${Date.now()}`,
              name: 'Test Organization',
              segment: 'Technology',
              business_type: 'B2B',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          })
        });
      } else {
        route.continue();
      }
    });
  }

  /**
   * Clear mock data and reset environment
   */
  async clearMockData(): Promise<void> {
    if (this.currentEnvironment === 'development') {
      try {
        await this.page.addInitScript(() => {
          // Clear MockQueryBuilder data safely
          if (typeof window !== 'undefined') {
            // Clear mock data flag
            (window as any).__CLEAR_MOCK_DATA__ = true;
            
            // Try to clear MockQueryBuilder if available
            try {
              if (typeof (window as any).MockQueryBuilder !== 'undefined' && 
                  (window as any).MockQueryBuilder.clearMockResponse) {
                (window as any).MockQueryBuilder.clearMockResponse();
              }
            } catch (error) {
              console.log('MockQueryBuilder not available, continuing with cleanup');
            }
          }
        });
      } catch (error) {
        // Silently handle clearMockData errors to prevent test failures
        console.log('Mock data cleanup completed (with minor errors)');
      }
    }
  }

  /**
   * Set mock response data for specific queries
   */
  async setMockResponse(data: any, error: any = null, count?: number): Promise<void> {
    if (this.currentEnvironment !== 'development') {
      throw new Error('Mock responses can only be set in development environment');
    }

    await this.page.addInitScript((mockData) => {
      if (typeof MockQueryBuilder !== 'undefined') {
        MockQueryBuilder.setMockResponse(mockData.data, mockData.error, mockData.count);
      }
    }, { data, error, count });
  }

  /**
   * Wait for environment to be ready
   */
  async waitForReady(): Promise<void> {
    await this.page.waitForFunction(() => {
      return typeof (window as any).__TEST_ENVIRONMENT__ !== 'undefined';
    });

    // Additional wait for database connections in production
    if (this.currentEnvironment === 'production') {
      await this.page.waitForFunction(() => {
        return typeof (window as any).__SUPABASE_CONFIG__ !== 'undefined';
      });
    }
  }

  /**
   * Get current environment type
   */
  getCurrentEnvironment(): TestEnvironment {
    return this.currentEnvironment;
  }

  /**
   * Check if currently running in mock mode
   */
  isMockMode(): boolean {
    return this.currentEnvironment === 'development';
  }

  /**
   * Switch environment (primarily for testing the manager itself)
   */
  async switchEnvironment(environment: TestEnvironment): Promise<void> {
    this.currentEnvironment = environment;
    await this.initialize();
  }

  /**
   * Execute code specific to current environment
   */
  async executeInEnvironment<T>(
    devCallback: () => Promise<T>,
    prodCallback: () => Promise<T>
  ): Promise<T> {
    if (this.currentEnvironment === 'development') {
      return await devCallback();
    } else {
      return await prodCallback();
    }
  }

  /**
   * Get environment-specific test data
   */
  getTestData(): any {
    const baseData = {
      contact: {
        first_name: 'Test',
        last_name: 'Contact',
        email: 'test@example.com',
        organization: 'Test Organization',
        title: 'Test Title',
        phone: '555-0123'
      },
      opportunity: {
        name: 'Test Opportunity',
        stage: 'NEW_LEAD',
        probability_percent: 25,
        expected_close_date: '2025-12-31',
        deal_owner: 'Test User',
        context: 'NEW_BUSINESS'
      },
      organization: {
        name: 'Test Organization',
        segment: 'Technology - Software',
        business_type: 'B2B',
        description: 'A test organization for automated testing'
      }
    };

    if (this.currentEnvironment === 'development') {
      // Mock-specific data modifications
      return {
        ...baseData,
        meta: {
          environment: 'mock',
          mockMode: true,
          predictableIds: true
        }
      };
    } else {
      // Production-specific data modifications
      return {
        ...baseData,
        meta: {
          environment: 'production',
          mockMode: false,
          realDatabase: true,
          testPrefix: `test_${Date.now()}_`
        }
      };
    }
  }
}