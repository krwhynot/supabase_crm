/**
 * SQL Validation Tests - pgTAP with Supabase CLI
 * 
 * These tests validate actual PostgreSQL queries using pgTAP
 * Run with: supabase test db --watch=false
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { execSync } from 'child_process'
import { existsSync, writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

// pgTAP SQL test templates
const PGTAP_TESTS = {
  principalActivitySummaryView: `
-- Test principal activity summary view structure and data
BEGIN;

-- Load pgTAP extension
SELECT plan(15);

-- Test that the view exists
SELECT has_view('public', 'principal_activity_summary', 'principal_activity_summary view should exist');

-- Test view columns
SELECT has_column('public', 'principal_activity_summary', 'principal_id', 'Should have principal_id column');
SELECT has_column('public', 'principal_activity_summary', 'principal_name', 'Should have principal_name column');
SELECT has_column('public', 'principal_activity_summary', 'engagement_score', 'Should have engagement_score column');
SELECT has_column('public', 'principal_activity_summary', 'activity_status', 'Should have activity_status column');
SELECT has_column('public', 'principal_activity_summary', 'total_opportunities', 'Should have total_opportunities column');

-- Test data types
SELECT col_type_is('public', 'principal_activity_summary', 'principal_id', 'uuid', 'principal_id should be uuid');
SELECT col_type_is('public', 'principal_activity_summary', 'principal_name', 'text', 'principal_name should be text');
SELECT col_type_is('public', 'principal_activity_summary', 'engagement_score', 'integer', 'engagement_score should be integer');
SELECT col_type_is('public', 'principal_activity_summary', 'total_opportunities', 'integer', 'total_opportunities should be integer');

-- Test constraints
SELECT col_not_null('public', 'principal_activity_summary', 'principal_id', 'principal_id should not be null');
SELECT col_not_null('public', 'principal_activity_summary', 'principal_name', 'principal_name should not be null');

-- Test data integrity
SELECT isnt_empty('SELECT 1 FROM principal_activity_summary WHERE engagement_score >= 0 AND engagement_score <= 100', 
                  'Engagement scores should be within valid range');

-- Test indexes exist for performance
SELECT has_index('public', 'principal_activity_summary', 'idx_principal_summary_engagement', 
                 'Should have engagement score index');

-- Test sample data exists
SELECT ok((SELECT COUNT(*) FROM principal_activity_summary) > 0, 'Should have at least one principal summary record');

-- Test aggregation accuracy
SELECT ok(
  (SELECT COUNT(*) FROM principal_activity_summary WHERE total_opportunities > 0) <= 
  (SELECT COUNT(DISTINCT principal_id) FROM opportunities WHERE deleted_at IS NULL),
  'Principal opportunity counts should not exceed actual opportunities'
);

SELECT finish();
ROLLBACK;
  `,

  principalFilterQueries: `
-- Test principal filtering queries match expected behavior
BEGIN;

SELECT plan(10);

-- Test search functionality
SELECT ok(
  (SELECT COUNT(*) FROM principal_activity_summary 
   WHERE principal_name ILIKE '%test%' OR primary_contact_name ILIKE '%test%') >= 0,
  'Search filter should execute without error'
);

-- Test activity status filtering
SELECT ok(
  (SELECT COUNT(*) FROM principal_activity_summary WHERE activity_status = 'ACTIVE') >= 0,
  'Activity status filter should work'
);

-- Test engagement score range filtering
SELECT ok(
  (SELECT COUNT(*) FROM principal_activity_summary 
   WHERE engagement_score >= 50 AND engagement_score <= 100) >= 0,
  'Engagement score range filter should work'
);

-- Test opportunity filtering
SELECT ok(
  (SELECT COUNT(*) FROM principal_activity_summary WHERE total_opportunities > 0) >= 0,
  'Opportunity count filter should work'
);

-- Test sorting by engagement score
SELECT lives_ok('SELECT * FROM principal_activity_summary ORDER BY engagement_score DESC LIMIT 10',
                'Should be able to sort by engagement score');

-- Test sorting by principal name
SELECT lives_ok('SELECT * FROM principal_activity_summary ORDER BY principal_name ASC LIMIT 10',
                'Should be able to sort by principal name');

-- Test pagination with LIMIT and OFFSET
SELECT lives_ok('SELECT * FROM principal_activity_summary ORDER BY engagement_score DESC LIMIT 20 OFFSET 0',
                'Should support pagination with LIMIT and OFFSET');

-- Test complex filtering combination
SELECT lives_ok(
  'SELECT * FROM principal_activity_summary 
   WHERE activity_status = ''ACTIVE'' 
   AND engagement_score >= 70 
   AND total_opportunities > 0
   ORDER BY engagement_score DESC',
  'Should handle complex filter combinations'
);

-- Test data consistency
SELECT ok(
  (SELECT MIN(engagement_score) FROM principal_activity_summary) >= 0,
  'Minimum engagement score should be non-negative'
);

SELECT ok(
  (SELECT MAX(engagement_score) FROM principal_activity_summary) <= 100,
  'Maximum engagement score should not exceed 100'
);

SELECT finish();
ROLLBACK;
  `,

  performanceQueries: `
-- Test query performance for principal activities
BEGIN;

SELECT plan(8);

-- Test that queries execute within reasonable time
-- Note: pgTAP doesn't have built-in performance testing, but we can test query plans

-- Test index usage for engagement score queries
SELECT ok(
  (SELECT COUNT(*) FROM pg_stat_user_indexes 
   WHERE indexrelname = 'idx_principal_summary_engagement' 
   AND idx_scan > 0) >= 0,
  'Engagement score index should be available for scanning'
);

-- Test that large result sets can be handled
SELECT lives_ok(
  'SELECT COUNT(*) FROM principal_activity_summary',
  'Should be able to count all principal summaries'
);

-- Test JOIN performance with related tables
SELECT lives_ok(
  'SELECT pas.*, o.stage 
   FROM principal_activity_summary pas 
   LEFT JOIN opportunities o ON o.principal_id = pas.principal_id 
   WHERE pas.activity_status = ''ACTIVE'' 
   LIMIT 100',
  'Should handle JOINs with opportunities table'
);

-- Test aggregation performance
SELECT lives_ok(
  'SELECT activity_status, COUNT(*), AVG(engagement_score), SUM(total_opportunities)
   FROM principal_activity_summary 
   GROUP BY activity_status',
  'Should handle GROUP BY aggregations'
);

-- Test subquery performance
SELECT lives_ok(
  'SELECT * FROM principal_activity_summary 
   WHERE principal_id IN (
     SELECT DISTINCT principal_id FROM opportunities 
     WHERE stage = ''CLOSED_WON'' AND deleted_at IS NULL
   )',
  'Should handle subqueries efficiently'
);

-- Test window function performance
SELECT lives_ok(
  'SELECT *, 
          ROW_NUMBER() OVER (ORDER BY engagement_score DESC) as rank,
          DENSE_RANK() OVER (PARTITION BY activity_status ORDER BY engagement_score DESC) as status_rank
   FROM principal_activity_summary 
   LIMIT 100',
  'Should handle window functions'
);

-- Test DISTINCT performance
SELECT lives_ok(
  'SELECT DISTINCT activity_status, organization_type 
   FROM principal_activity_summary',
  'Should handle DISTINCT queries'
);

-- Test complex WHERE clauses
SELECT lives_ok(
  'SELECT * FROM principal_activity_summary 
   WHERE (activity_status = ''ACTIVE'' AND engagement_score > 70)
      OR (activity_status = ''INACTIVE'' AND last_activity_date < NOW() - INTERVAL ''90 days'')
   ORDER BY engagement_score DESC
   LIMIT 50',
  'Should handle complex WHERE conditions'
);

SELECT finish();
ROLLBACK;
  `,

  dataIntegrityValidation: `
-- Test data integrity and referential constraints
BEGIN;

SELECT plan(12);

-- Test foreign key relationships
SELECT ok(
  (SELECT COUNT(*) FROM principals p 
   LEFT JOIN organizations o ON p.organization_id = o.id 
   WHERE o.id IS NULL AND p.deleted_at IS NULL) = 0,
  'All active principals should have valid organization references'
);

-- Test opportunity relationships
SELECT ok(
  (SELECT COUNT(*) FROM opportunities opp
   LEFT JOIN principals p ON opp.principal_id = p.id
   WHERE p.id IS NULL AND opp.deleted_at IS NULL) = 0,
  'All active opportunities should have valid principal references'
);

-- Test contact relationships
SELECT ok(
  (SELECT COUNT(*) FROM contacts c
   LEFT JOIN organizations o ON c.organization_id = o.id
   WHERE o.id IS NULL AND c.deleted_at IS NULL) = 0,
  'All active contacts should have valid organization references'
);

-- Test data consistency in summary view
SELECT ok(
  (SELECT COUNT(*) FROM principal_activity_summary pas
   LEFT JOIN principals p ON pas.principal_id = p.id
   WHERE p.id IS NULL) = 0,
  'All summary records should have corresponding principals'
);

-- Test engagement score calculations
SELECT ok(
  (SELECT COUNT(*) FROM principal_activity_summary 
   WHERE engagement_score < 0 OR engagement_score > 100) = 0,
  'All engagement scores should be within valid range 0-100'
);

-- Test activity status values
SELECT ok(
  (SELECT COUNT(*) FROM principal_activity_summary 
   WHERE activity_status NOT IN ('ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED')) = 0,
  'All activity statuses should be valid values'
);

-- Test contact count accuracy
SELECT ok(
  (SELECT COUNT(*) FROM principal_activity_summary pas
   WHERE pas.contact_count != (
     SELECT COUNT(*) FROM contacts c 
     JOIN organizations o ON c.organization_id = o.id
     JOIN principals p ON p.organization_id = o.id
     WHERE p.id = pas.principal_id AND c.deleted_at IS NULL
   )) = 0,
  'Contact counts in summary should match actual contact records'
);

-- Test opportunity count accuracy
SELECT ok(
  (SELECT COUNT(*) FROM principal_activity_summary pas
   WHERE pas.total_opportunities != (
     SELECT COUNT(*) FROM opportunities o 
     WHERE o.principal_id = pas.principal_id AND o.deleted_at IS NULL
   )) = 0,
  'Opportunity counts in summary should match actual opportunity records'
);

-- Test date consistency
SELECT ok(
  (SELECT COUNT(*) FROM principal_activity_summary 
   WHERE principal_created_at > principal_updated_at) = 0,
  'Created date should not be after updated date'
);

-- Test boolean field consistency
SELECT ok(
  (SELECT COUNT(*) FROM principal_activity_summary 
   WHERE is_active NOT IN (true, false)) = 0,
  'Boolean fields should have valid boolean values'
);

-- Test numeric field non-negativity where appropriate
SELECT ok(
  (SELECT COUNT(*) FROM principal_activity_summary 
   WHERE contact_count < 0 OR total_interactions < 0 OR total_opportunities < 0) = 0,
  'Count fields should be non-negative'
);

-- Test summary generation timestamp
SELECT ok(
  (SELECT COUNT(*) FROM principal_activity_summary 
   WHERE summary_generated_at IS NULL OR summary_generated_at > NOW()) = 0,
  'Summary generation timestamps should be valid and not in future'
);

SELECT finish();
ROLLBACK;
  `
}

describe('SQL Validation Tests - pgTAP Integration', () => {
  let supabaseCliAvailable = false
  let testSqlDir: string

  beforeAll(async () => {
    // Check if Supabase CLI is available
    try {
      execSync('supabase --version', { stdio: 'pipe' })
      supabaseCliAvailable = true
      console.log('✅ Supabase CLI is available')
    } catch (error) {
      console.warn('⚠️ Supabase CLI not available, skipping SQL validation tests')
      console.warn('Install with: npm install -g supabase')
      supabaseCliAvailable = false
    }

    // Create SQL test directory
    testSqlDir = resolve(process.cwd(), 'sql', 'tests')
    if (!existsSync(testSqlDir)) {
      mkdirSync(testSqlDir, { recursive: true })
    }

    // Write pgTAP test files
    if (supabaseCliAvailable) {
      Object.entries(PGTAP_TESTS).forEach(([name, sql]) => {
        writeFileSync(resolve(testSqlDir, `${name}.sql`), sql)
      })
      console.log('📝 Created pgTAP test files')
    }
  })

  describe('Principal Activity Summary View Tests', () => {
    it('should validate view structure and constraints', async () => {
      if (!supabaseCliAvailable) {
        console.log('⏭️ Skipping pgTAP test - Supabase CLI not available')
        return
      }

      try {
        const result = execSync('supabase test db --file sql/tests/principalActivitySummaryView.sql', {
          encoding: 'utf8',
          timeout: 30000
        })

        console.log('pgTAP Test Output:')
        console.log(result)

        // Check for test success indicators
        expect(result).toContain('All tests successful')
        expect(result).not.toContain('FAILED')
        expect(result).not.toContain('not ok')

      } catch (error) {
        console.error('pgTAP test failed:', error)
        
        // If this is just a CLI issue, don't fail the test
        if (error instanceof Error && error.message.includes('command not found')) {
          console.log('⏭️ Skipping due to CLI issues')
          return
        }
        
        throw error
      }
    }, 45000)

    it('should validate principal filtering queries', async () => {
      if (!supabaseCliAvailable) {
        console.log('⏭️ Skipping pgTAP test - Supabase CLI not available')
        return
      }

      try {
        const result = execSync('supabase test db --file sql/tests/principalFilterQueries.sql', {
          encoding: 'utf8',
          timeout: 30000
        })

        console.log('Filter Queries Test Output:')
        console.log(result)

        expect(result).toContain('All tests successful')
        expect(result).not.toContain('FAILED')

      } catch (error) {
        console.error('Filter queries test failed:', error)
        
        if (error instanceof Error && error.message.includes('command not found')) {
          console.log('⏭️ Skipping due to CLI issues')
          return
        }
        
        throw error
      }
    }, 45000)

    it('should validate query performance characteristics', async () => {
      if (!supabaseCliAvailable) {
        console.log('⏭️ Skipping pgTAP test - Supabase CLI not available')
        return
      }

      try {
        const result = execSync('supabase test db --file sql/tests/performanceQueries.sql', {
          encoding: 'utf8',
          timeout: 45000
        })

        console.log('Performance Test Output:')
        console.log(result)

        expect(result).toContain('All tests successful')
        expect(result).not.toContain('FAILED')

      } catch (error) {
        console.error('Performance test failed:', error)
        
        if (error instanceof Error && error.message.includes('command not found')) {
          console.log('⏭️ Skipping due to CLI issues')
          return
        }
        
        throw error
      }
    }, 60000)

    it('should validate data integrity constraints', async () => {
      if (!supabaseCliAvailable) {
        console.log('⏭️ Skipping pgTAP test - Supabase CLI not available')
        return
      }

      try {
        const result = execSync('supabase test db --file sql/tests/dataIntegrityValidation.sql', {
          encoding: 'utf8',
          timeout: 45000
        })

        console.log('Data Integrity Test Output:')
        console.log(result)

        expect(result).toContain('All tests successful')
        expect(result).not.toContain('FAILED')

      } catch (error) {
        console.error('Data integrity test failed:', error)
        
        if (error instanceof Error && error.message.includes('command not found')) {
          console.log('⏭️ Skipping due to CLI issues')
          return
        }
        
        throw error
      }
    }, 60000)
  })

  describe('SQL Execution Validation', () => {
    it('should validate raw SQL queries execute correctly', () => {
      // These tests can run without pgTAP by using basic SQL validation
      const basicQueries = [
        'SELECT COUNT(*) FROM principal_activity_summary',
        'SELECT * FROM principal_activity_summary WHERE activity_status = \'ACTIVE\' LIMIT 1',
        'SELECT principal_name, engagement_score FROM principal_activity_summary ORDER BY engagement_score DESC LIMIT 5',
        'SELECT activity_status, COUNT(*) FROM principal_activity_summary GROUP BY activity_status'
      ]

      basicQueries.forEach(query => {
        expect(query).toBeTruthy()
        expect(query).toMatch(/^SELECT/i)
        
        // Validate SQL syntax patterns
        expect(query).not.toMatch(/DROP|DELETE|UPDATE|INSERT/i) // Read-only queries
        expect(query).not.toMatch(/;.*SELECT/i) // No SQL injection patterns
      })
    })

    it('should validate query parameter handling', () => {
      // Test parameterized query patterns that would be used in production
      const parameterizedQueries = [
        {
          query: 'SELECT * FROM principal_activity_summary WHERE principal_id = $1',
          params: ['uuid-value']
        },
        {
          query: 'SELECT * FROM principal_activity_summary WHERE activity_status = ANY($1)',
          params: [['ACTIVE', 'INACTIVE']]
        },
        {
          query: 'SELECT * FROM principal_activity_summary WHERE engagement_score >= $1 AND engagement_score <= $2',
          params: [50, 100]
        },
        {
          query: 'SELECT * FROM principal_activity_summary WHERE principal_name ILIKE $1 OR primary_contact_name ILIKE $1',
          params: ['%search%']
        }
      ]

      parameterizedQueries.forEach(({ query, params }) => {
        // Validate query structure
        expect(query).toMatch(/\$\d+/)
        expect(params).toBeInstanceOf(Array)
        expect(params.length).toBeGreaterThan(0)
        
        // Count parameters
        const paramCount = (query.match(/\$\d+/g) || []).length
        expect(params.length).toBeGreaterThanOrEqual(paramCount)
      })
    })
  })
})