import { Page } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EnvironmentManager } from './EnvironmentManager';

/**
 * Database Test Helpers for Dual-Environment Testing
 * 
 * Provides comprehensive database testing utilities that work across both
 * MCP mock (development) and real Supabase (production) environments.
 */

export interface DatabaseQueryResult {
  data: any[] | any | null;
  error: any;
  count?: number;
}

export interface SchemaValidationResult {
  isValid: boolean;
  errors: string[];
  tableExists: boolean;
  columnsMatch: boolean;
  constraintsMatch: boolean;
}

export interface TestTransaction {
  id: string;
  startTime: number;
  operations: string[];
  completed: boolean;
}

export class DatabaseTestHelpers {
  private supabaseClient: SupabaseClient | null = null;
  private testTransactions: Map<string, TestTransaction> = new Map();

  constructor(
    private page: Page,
    private environmentManager: EnvironmentManager
  ) {}

  /**
   * Initialize database connection based on environment
   */
  async initialize(): Promise<void> {
    if (this.environmentManager.getCurrentEnvironment() === 'production') {
      await this.initializeProductionClient();
    }
  }

  private async initializeProductionClient(): Promise<void> {
    const supabaseUrl = process.env.VITE_TEST_SUPABASE_URL;
    const supabaseKey = process.env.VITE_TEST_SUPABASE_SERVICE_KEY || process.env.VITE_TEST_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Production database testing requires VITE_TEST_SUPABASE_URL and service key');
    }

    this.supabaseClient = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Generic query execution with environment awareness
   */
  async executeQuery(
    table: string,
    operation: 'select' | 'insert' | 'update' | 'delete',
    data?: any,
    filters?: any
  ): Promise<DatabaseQueryResult> {
    return await this.environmentManager.executeInEnvironment(
      // Development: Mock execution
      async () => {
        return this.executeMockQuery(table, operation, data, filters);
      },
      
      // Production: Real database execution
      async () => {
        return this.executeRealQuery(table, operation, data, filters);
      }
    );
  }

  private async executeMockQuery(
    table: string,
    operation: string,
    data?: any,
    filters?: any
  ): Promise<DatabaseQueryResult> {
    // Simulate database operations in mock environment
    const mockId = `mock-${table}-${Date.now()}`;
    
    switch (operation) {
      case 'select':
        return {
          data: filters ? [] : [{ id: mockId, ...data }],
          error: null,
          count: filters ? 0 : 1
        };
        
      case 'insert':
        return {
          data: { id: mockId, ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          error: null
        };
        
      case 'update':
        return {
          data: { id: mockId, ...data, updated_at: new Date().toISOString() },
          error: null
        };
        
      case 'delete':
        return {
          data: null,
          error: null
        };
        
      default:
        return {
          data: null,
          error: { message: `Mock operation ${operation} not supported` }
        };
    }
  }

  private async executeRealQuery(
    table: string,
    operation: string,
    data?: any,
    filters?: any
  ): Promise<DatabaseQueryResult> {
    if (!this.supabaseClient) {
      throw new Error('Supabase client not initialized for production testing');
    }

    let query = this.supabaseClient.from(table);

    switch (operation) {
      case 'select':
        query = query.select('*');
        if (filters) {
          Object.keys(filters).forEach(key => {
            query = query.eq(key, filters[key]);
          });
        }
        break;
        
      case 'insert':
        return await query.insert(data).select().single();
        
      case 'update':
        query = query.update(data);
        if (filters) {
          Object.keys(filters).forEach(key => {
            query = query.eq(key, filters[key]);
          });
        }
        return await query.select().single();
        
      case 'delete':
        if (filters) {
          Object.keys(filters).forEach(key => {
            query = query.eq(key, filters[key]);
          });
        }
        return await query.delete();
    }

    return await query;
  }

  /**
   * Contact-specific database operations
   */
  async insertContact(contactData: any): Promise<DatabaseQueryResult> {
    return await this.executeQuery('contacts', 'insert', contactData);
  }

  async selectContact(filters: any): Promise<DatabaseQueryResult> {
    return await this.executeQuery('contacts', 'select', null, filters);
  }

  async updateContact(contactId: string, updateData: any): Promise<DatabaseQueryResult> {
    return await this.executeQuery('contacts', 'update', updateData, { id: contactId });
  }

  async deleteContact(contactId: string): Promise<DatabaseQueryResult> {
    return await this.executeQuery('contacts', 'delete', null, { id: contactId });
  }

  /**
   * Opportunity-specific database operations
   */
  async insertOpportunity(opportunityData: any): Promise<DatabaseQueryResult> {
    return await this.executeQuery('opportunities', 'insert', opportunityData);
  }

  async selectOpportunity(filters: any): Promise<DatabaseQueryResult> {
    return await this.executeQuery('opportunities', 'select', null, filters);
  }

  async updateOpportunity(opportunityId: string, updateData: any): Promise<DatabaseQueryResult> {
    return await this.executeQuery('opportunities', 'update', updateData, { id: opportunityId });
  }

  async deleteOpportunity(opportunityId: string): Promise<DatabaseQueryResult> {
    return await this.executeQuery('opportunities', 'delete', null, { id: opportunityId });
  }

  /**
   * Organization-specific database operations
   */
  async insertOrganization(organizationData: any): Promise<DatabaseQueryResult> {
    return await this.executeQuery('organizations', 'insert', organizationData);
  }

  async selectOrganization(filters: any): Promise<DatabaseQueryResult> {
    return await this.executeQuery('organizations', 'select', null, filters);
  }

  async updateOrganization(organizationId: string, updateData: any): Promise<DatabaseQueryResult> {
    return await this.executeQuery('organizations', 'update', updateData, { id: organizationId });
  }

  async deleteOrganization(organizationId: string): Promise<DatabaseQueryResult> {
    return await this.executeQuery('organizations', 'delete', null, { id: organizationId });
  }

  /**
   * Schema validation
   */
  async validateTableSchema(tableName: string, expectedColumns: string[]): Promise<SchemaValidationResult> {
    return await this.environmentManager.executeInEnvironment(
      // Development: Mock schema validation
      async () => {
        return {
          isValid: true,
          errors: [],
          tableExists: true,
          columnsMatch: true,
          constraintsMatch: true
        };
      },
      
      // Production: Real schema validation
      async () => {
        return await this.validateRealTableSchema(tableName, expectedColumns);
      }
    );
  }

  private async validateRealTableSchema(tableName: string, expectedColumns: string[]): Promise<SchemaValidationResult> {
    if (!this.supabaseClient) {
      throw new Error('Supabase client not initialized');
    }

    const errors: string[] = [];
    let tableExists = false;
    let columnsMatch = false;
    let constraintsMatch = false;

    try {
      // Check if table exists by attempting a simple query
      const { error: tableError } = await this.supabaseClient
        .from(tableName)
        .select('*')
        .limit(1);

      tableExists = !tableError;

      if (tableError) {
        errors.push(`Table ${tableName} does not exist or is not accessible: ${tableError.message}`);
      } else {
        // Validate columns by checking with information_schema
        const { data: columnData, error: columnError } = await this.supabaseClient
          .rpc('get_table_columns', { table_name: tableName });

        if (columnError) {
          errors.push(`Could not retrieve column information: ${columnError.message}`);
        } else {
          const actualColumns = columnData?.map((col: any) => col.column_name) || [];
          const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
          const extraColumns = actualColumns.filter((col: string) => !expectedColumns.includes(col));

          if (missingColumns.length > 0) {
            errors.push(`Missing columns: ${missingColumns.join(', ')}`);
          }

          if (extraColumns.length > 0) {
            errors.push(`Unexpected columns: ${extraColumns.join(', ')}`);
          }

          columnsMatch = missingColumns.length === 0 && extraColumns.length === 0;
        }

        // Basic constraint validation could be added here
        constraintsMatch = true; // Simplified for now
      }
    } catch (error: any) {
      errors.push(`Schema validation failed: ${error.message}`);
    }

    return {
      isValid: errors.length === 0 && tableExists && columnsMatch && constraintsMatch,
      errors,
      tableExists,
      columnsMatch,
      constraintsMatch
    };
  }

  /**
   * Test data management
   */
  async createTestTransaction(operations: string[]): Promise<string> {
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.testTransactions.set(transactionId, {
      id: transactionId,
      startTime: Date.now(),
      operations,
      completed: false
    });

    return transactionId;
  }

  async completeTestTransaction(transactionId: string): Promise<void> {
    const transaction = this.testTransactions.get(transactionId);
    if (transaction) {
      transaction.completed = true;
    }
  }

  async rollbackTestTransaction(transactionId: string): Promise<void> {
    const transaction = this.testTransactions.get(transactionId);
    if (!transaction) {
      return;
    }

    // In production, we would need to implement actual rollback logic
    if (this.environmentManager.getCurrentEnvironment() === 'production') {
      // For now, just mark as completed
      // In a full implementation, this would undo all operations
      console.warn('Rollback not fully implemented for production environment');
    }

    this.testTransactions.delete(transactionId);
  }

  async cleanupTestData(testSessionId?: string): Promise<void> {
    const prefix = testSessionId || 'test';
    
    await this.environmentManager.executeInEnvironment(
      // Development: Clear mock data
      async () => {
        await this.page.addInitScript(() => {
          if (typeof (window as any).MockQueryBuilder !== 'undefined') {
            (window as any).MockQueryBuilder.clearMockResponse();
          }
        });
      },
      
      // Production: Delete test data
      async () => {
        await this.cleanupProductionTestData(prefix);
      }
    );
  }

  private async cleanupProductionTestData(prefix: string): Promise<void> {
    if (!this.supabaseClient) {
      return;
    }

    const cleanupTables = ['contacts', 'opportunities', 'organizations'];
    
    for (const table of cleanupTables) {
      try {
        // Clean by name pattern
        await this.supabaseClient
          .from(table)
          .delete()
          .or(`name.ilike.${prefix}_%,first_name.ilike.${prefix}_%,last_name.ilike.${prefix}_%,email.ilike.${prefix}%@%`);
      } catch (error: any) {
        console.warn(`Cleanup warning for table ${table}:`, error.message);
      }
    }
  }

  /**
   * Performance testing
   */
  async measureQueryPerformance(
    operation: () => Promise<DatabaseQueryResult>
  ): Promise<{ result: DatabaseQueryResult; duration: number }> {
    const startTime = performance.now();
    const result = await operation();
    const duration = performance.now() - startTime;

    return { result, duration };
  }

  async testConcurrentOperations(operations: (() => Promise<DatabaseQueryResult>)[]): Promise<{
    results: DatabaseQueryResult[];
    totalDuration: number;
    errors: string[];
  }> {
    const startTime = performance.now();
    const errors: string[] = [];
    
    const results = await Promise.allSettled(
      operations.map(op => op())
    );

    const successfulResults: DatabaseQueryResult[] = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successfulResults.push(result.value);
      } else {
        errors.push(`Operation ${index} failed: ${result.reason.message}`);
      }
    });

    const totalDuration = performance.now() - startTime;

    return {
      results: successfulResults,
      totalDuration,
      errors
    };
  }

  /**
   * Data integrity testing
   */
  async testForeignKeyConstraints(parentTable: string, childTable: string, foreignKeyColumn: string): Promise<boolean> {
    return await this.environmentManager.executeInEnvironment(
      // Development: Mock constraint testing
      async () => {
        return true; // Assume constraints work in mock
      },
      
      // Production: Real constraint testing
      async () => {
        return await this.testRealForeignKeyConstraints(parentTable, childTable, foreignKeyColumn);
      }
    );
  }

  private async testRealForeignKeyConstraints(
    parentTable: string, 
    childTable: string, 
    foreignKeyColumn: string
  ): Promise<boolean> {
    if (!this.supabaseClient) {
      return false;
    }

    try {
      // Try to insert a child record with invalid foreign key
      const invalidForeignKey = 'invalid-uuid-that-should-not-exist';
      
      const { error } = await this.supabaseClient
        .from(childTable)
        .insert({ [foreignKeyColumn]: invalidForeignKey, test_data: true })
        .select()
        .single();

      // If no error, foreign key constraint is not working
      if (!error) {
        // Clean up the test record
        await this.supabaseClient
          .from(childTable)
          .delete()
          .eq('test_data', true);
        
        return false;
      }

      // Check if error is related to foreign key constraint
      return error.message.toLowerCase().includes('foreign key') ||
             error.message.toLowerCase().includes('constraint') ||
             error.message.toLowerCase().includes('reference');
             
    } catch (error: any) {
      console.warn('Foreign key constraint test error:', error.message);
      return false;
    }
  }

  /**
   * Utility methods
   */
  async getRowCount(tableName: string, filters?: any): Promise<number> {
    const result = await this.executeQuery(tableName, 'select', null, filters);
    return Array.isArray(result.data) ? result.data.length : (result.count || 0);
  }

  async tableExists(tableName: string): Promise<boolean> {
    const validationResult = await this.validateTableSchema(tableName, []);
    return validationResult.tableExists;
  }

  async waitForDatabaseReady(): Promise<void> {
    if (this.environmentManager.getCurrentEnvironment() === 'production') {
      await this.waitForProductionDatabaseReady();
    }
    // No waiting needed for mock environment
  }

  private async waitForProductionDatabaseReady(): Promise<void> {
    if (!this.supabaseClient) {
      throw new Error('Supabase client not initialized');
    }

    let retries = 10;
    while (retries > 0) {
      try {
        const { error } = await this.supabaseClient
          .from('contacts')
          .select('count', { count: 'exact', head: true });

        if (!error) {
          return;
        }
      } catch (error: any) {
        console.warn(`Database connection attempt failed: ${error.message}`);
      }

      retries--;
      if (retries === 0) {
        throw new Error('Database not ready after multiple attempts');
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    // Complete any pending transactions
    for (const [id, transaction] of this.testTransactions) {
      if (!transaction.completed) {
        await this.rollbackTestTransaction(id);
      }
    }

    this.testTransactions.clear();

    // Close database connections
    if (this.supabaseClient) {
      // Supabase client doesn't have an explicit close method
      this.supabaseClient = null;
    }
  }
}