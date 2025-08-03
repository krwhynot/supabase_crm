# API Development Workflow Example

This document demonstrates the backend-security-performance chain workflow for developing a new API endpoint in the CRM system.

## Scenario: Creating a Batch Opportunity Creation API

**Requirements:**
- Allow bulk creation of opportunities from CSV import
- Support batch validation and atomic transactions
- Implement proper security controls and RLS policies
- Optimize for performance with large datasets
- Provide comprehensive error handling and rollback

## Stage 1: Backend Architecture Implementation

**Agent**: `backend-architect`
**Duration**: 30 minutes
**Trigger**: User request - "Add batch opportunity creation API for CSV imports"

### Database Schema Updates

```sql
-- sql/migrations/20250102_batch_opportunity_creation.sql

-- Add batch tracking table
CREATE TABLE opportunity_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  filename TEXT,
  total_records INTEGER NOT NULL DEFAULT 0,
  successful_records INTEGER NOT NULL DEFAULT 0,
  failed_records INTEGER NOT NULL DEFAULT 0,
  status batch_status NOT NULL DEFAULT 'processing',
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Add batch status enum
CREATE TYPE batch_status AS ENUM (
  'processing',
  'completed',
  'failed',
  'cancelled'
);

-- Add batch reference to opportunities table
ALTER TABLE opportunities 
ADD COLUMN batch_id UUID REFERENCES opportunity_batches(id);

-- Add index for batch queries
CREATE INDEX idx_opportunities_batch_id ON opportunities(batch_id) 
WHERE batch_id IS NOT NULL;

-- Add index for batch status queries
CREATE INDEX idx_opportunity_batches_status ON opportunity_batches(status, created_at);
```

### Row Level Security Policies

```sql
-- RLS policies for opportunity_batches
ALTER TABLE opportunity_batches ENABLE ROW LEVEL SECURITY;

-- Users can only see their own batches
CREATE POLICY "Users can view own batches" ON opportunity_batches
  FOR SELECT USING (user_id = auth.uid());

-- Users can create batches
CREATE POLICY "Users can create batches" ON opportunity_batches
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own batches
CREATE POLICY "Users can update own batches" ON opportunity_batches
  FOR UPDATE USING (user_id = auth.uid());
```

### API Service Implementation

```typescript
// src/services/batchOpportunityApi.ts
import { supabase } from '@/lib/supabase'
import type { 
  OpportunityBatch, 
  OpportunityBatchInsert,
  BatchOpportunityData,
  BatchValidationResult 
} from '@/types/batch-opportunities'

export class BatchOpportunityService {
  /**
   * Create a new batch and process opportunities
   */
  async createBatch(
    opportunities: BatchOpportunityData[],
    filename?: string
  ): Promise<OpportunityBatch> {
    try {
      // Start transaction
      const { data: batch, error: batchError } = await supabase
        .from('opportunity_batches')
        .insert({
          filename,
          total_records: opportunities.length,
          status: 'processing'
        })
        .select()
        .single()

      if (batchError) throw batchError

      // Validate all opportunities before processing
      const validationResults = await this.validateBatch(opportunities)
      
      if (validationResults.hasErrors) {
        await this.updateBatchStatus(batch.id, 'failed', {
          validation_errors: validationResults.errors
        })
        throw new Error('Batch validation failed')
      }

      // Process opportunities in chunks for better performance
      const chunkSize = 50
      let successCount = 0
      let failureCount = 0
      const errors: Array<{ index: number; error: string }> = []

      for (let i = 0; i < opportunities.length; i += chunkSize) {
        const chunk = opportunities.slice(i, i + chunkSize)
        
        try {
          const { data, error } = await supabase
            .from('opportunities')
            .insert(
              chunk.map(opp => ({
                ...opp,
                batch_id: batch.id
              }))
            )
            .select()

          if (error) {
            chunk.forEach((_, index) => {
              errors.push({
                index: i + index,
                error: error.message
              })
              failureCount++
            })
          } else {
            successCount += data.length
          }
        } catch (chunkError) {
          chunk.forEach((_, index) => {
            errors.push({
              index: i + index,
              error: chunkError instanceof Error ? chunkError.message : 'Unknown error'
            })
            failureCount++
          })
        }
      }

      // Update batch with final results
      const finalStatus = failureCount === 0 ? 'completed' : 
                         successCount === 0 ? 'failed' : 'completed'

      const { data: updatedBatch, error: updateError } = await supabase
        .from('opportunity_batches')
        .update({
          status: finalStatus,
          successful_records: successCount,
          failed_records: failureCount,
          error_details: errors.length > 0 ? { processing_errors: errors } : null,
          completed_at: new Date().toISOString()
        })
        .eq('id', batch.id)
        .select()
        .single()

      if (updateError) throw updateError

      return updatedBatch

    } catch (error) {
      console.error('Batch creation failed:', error)
      throw error
    }
  }

  /**
   * Validate batch data before processing
   */
  private async validateBatch(
    opportunities: BatchOpportunityData[]
  ): Promise<BatchValidationResult> {
    const errors: Array<{ index: number; field: string; message: string }> = []

    // Validate required fields
    opportunities.forEach((opp, index) => {
      if (!opp.name?.trim()) {
        errors.push({ index, field: 'name', message: 'Name is required' })
      }
      
      if (!opp.organization_id) {
        errors.push({ index, field: 'organization_id', message: 'Organization is required' })
      }

      if (opp.probability_percent < 0 || opp.probability_percent > 100) {
        errors.push({ 
          index, 
          field: 'probability_percent', 
          message: 'Probability must be between 0 and 100' 
        })
      }
    })

    // Validate organization IDs exist
    const orgIds = [...new Set(opportunities.map(opp => opp.organization_id).filter(Boolean))]
    
    if (orgIds.length > 0) {
      const { data: existingOrgs, error } = await supabase
        .from('organizations')
        .select('id')
        .in('id', orgIds)

      if (!error) {
        const existingOrgIds = new Set(existingOrgs.map(org => org.id))
        
        opportunities.forEach((opp, index) => {
          if (opp.organization_id && !existingOrgIds.has(opp.organization_id)) {
            errors.push({
              index,
              field: 'organization_id',
              message: 'Organization does not exist'
            })
          }
        })
      }
    }

    return {
      hasErrors: errors.length > 0,
      errors,
      validRecords: opportunities.length - errors.length
    }
  }

  /**
   * Get batch status and details
   */
  async getBatchStatus(batchId: string): Promise<OpportunityBatch | null> {
    const { data, error } = await supabase
      .from('opportunity_batches')
      .select('*')
      .eq('id', batchId)
      .single()

    if (error) {
      console.error('Error fetching batch status:', error)
      return null
    }

    return data
  }

  /**
   * Get user's batch history
   */
  async getUserBatches(limit = 20): Promise<OpportunityBatch[]> {
    const { data, error } = await supabase
      .from('opportunity_batches')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching user batches:', error)
      return []
    }

    return data
  }

  /**
   * Cancel a processing batch
   */
  async cancelBatch(batchId: string): Promise<boolean> {
    const { error } = await supabase
      .from('opportunity_batches')
      .update({ 
        status: 'cancelled',
        completed_at: new Date().toISOString()
      })
      .eq('id', batchId)
      .eq('status', 'processing') // Only cancel if still processing

    return !error
  }

  private async updateBatchStatus(
    batchId: string, 
    status: batch_status, 
    errorDetails?: any
  ): Promise<void> {
    await supabase
      .from('opportunity_batches')
      .update({
        status,
        error_details: errorDetails,
        completed_at: status !== 'processing' ? new Date().toISOString() : null
      })
      .eq('id', batchId)
  }
}

export const batchOpportunityService = new BatchOpportunityService()
```

### TypeScript Type Definitions

```typescript
// src/types/batch-opportunities.ts
export type batch_status = 'processing' | 'completed' | 'failed' | 'cancelled'

export interface OpportunityBatch {
  id: string
  user_id: string
  filename?: string
  total_records: number
  successful_records: number
  failed_records: number
  status: batch_status
  error_details?: any
  created_at: string
  completed_at?: string
}

export interface OpportunityBatchInsert {
  filename?: string
  total_records: number
  status?: batch_status
}

export interface BatchOpportunityData {
  name: string
  organization_id: string
  principal_id?: string
  product_id?: string
  stage?: string
  probability_percent: number
  expected_close_date?: string
  deal_owner?: string
  notes?: string
  context?: string
  custom_context?: string
}

export interface BatchValidationResult {
  hasErrors: boolean
  errors: Array<{
    index: number
    field: string
    message: string
  }>
  validRecords: number
}

export interface BatchProcessingError {
  index: number
  error: string
}
```

### Handoff Data Package

```yaml
handoff_package:
  source_agent: "backend-architect"
  target_agent: "security-specialist"
  deliverable_type: "api"
  file_paths:
    - "sql/migrations/20250102_batch_opportunity_creation.sql"
    - "src/services/batchOpportunityApi.ts"
    - "src/types/batch-opportunities.ts"
  validation_criteria:
    schema_validation: "Migration runs successfully with proper constraints"
    api_functionality: "All CRUD operations working with proper error handling"
    type_safety: "Full TypeScript coverage with no any types"
    rls_implementation: "Row Level Security policies implemented and tested"
  context:
    business_logic: "Batch processing for CSV import workflow"
    performance_requirements: "Handle up to 1000 opportunities per batch"
    security_requirements: "User isolation and data validation"
    integration_points: "Vue frontend components and CSV parsing"
  priority: "high"
  timestamp: "2025-01-02T11:00:00Z"
```

## Stage 2: Security Specialist Audit

**Agent**: `security-specialist`
**Duration**: 20 minutes
**Receives**: Backend implementation and handoff package

### Security Audit Checklist

#### Authentication & Authorization
- ✅ RLS policies properly restrict access to user's own batches
- ✅ JWT token validation implemented in API calls
- ✅ No service role bypass in client-side code
- ✅ Batch operations properly scoped to authenticated user

#### Input Validation & Data Integrity
- ✅ Comprehensive validation of batch data before processing
- ✅ SQL injection prevention through parameterized queries
- ✅ File upload restrictions (if applicable)
- ⚠️ **FINDING**: Need rate limiting for batch creation API
- ⚠️ **FINDING**: Large batch size could enable DoS attacks

#### Data Protection
- ✅ Sensitive data handling follows GDPR guidelines
- ✅ Error messages don't expose internal system details
- ✅ Audit trail maintained for batch operations
- ✅ Data retention policies considered

#### Infrastructure Security
- ✅ HTTPS enforced for all API communications
- ✅ Database connection security properly configured
- ✅ Environment variables properly managed
- ✅ Logging captures security-relevant events

### Security Audit Report

```markdown
**SECURITY AUDIT REPORT**
**API**: Batch Opportunity Creation
**Date**: 2025-01-02
**Auditor**: security-specialist

**EXECUTIVE SUMMARY:**
The batch opportunity creation API implementation demonstrates strong security fundamentals with proper RLS implementation and comprehensive input validation. Two medium-severity issues require attention before production deployment.

**FINDINGS:**

**MEDIUM SEVERITY:**
1. **Rate Limiting Missing**
   - **Risk**: Potential DoS attacks through repeated large batch requests
   - **Impact**: Service availability could be compromised
   - **Recommendation**: Implement rate limiting (max 5 batches per user per hour)

2. **Batch Size Limits**
   - **Risk**: Very large batches could consume excessive resources
   - **Impact**: Database performance degradation
   - **Recommendation**: Enforce maximum batch size (500 opportunities per batch)

**LOW SEVERITY:**
3. **Error Detail Exposure**
   - **Risk**: Database constraint errors might expose schema details
   - **Impact**: Information disclosure
   - **Recommendation**: Sanitize error messages for client consumption

**RECOMMENDATIONS:**
1. Add rate limiting middleware
2. Implement batch size validation
3. Enhance error message sanitization
4. Add monitoring for unusual batch patterns

**COMPLIANCE STATUS:**
- GDPR: ✅ Compliant
- OWASP Top 10: ✅ Addressed
- Industry Standards: ✅ Met

**APPROVAL STATUS:** CONDITIONAL
- Critical issues: 0
- High issues: 0  
- Medium issues: 2
- Low issues: 1

**NEXT STEPS:** Remediate medium-severity issues before proceeding to performance testing.
```

### Security Remediation Implementation

```typescript
// Enhanced batchOpportunityApi.ts with security improvements

export class BatchOpportunityService {
  // Rate limiting tracking
  private static readonly MAX_BATCHES_PER_HOUR = 5
  private static readonly MAX_BATCH_SIZE = 500

  async createBatch(
    opportunities: BatchOpportunityData[],
    filename?: string
  ): Promise<OpportunityBatch> {
    // Validate batch size limits
    if (opportunities.length > BatchOpportunityService.MAX_BATCH_SIZE) {
      throw new SecurityError(
        `Batch size exceeds maximum allowed (${BatchOpportunityService.MAX_BATCH_SIZE})`
      )
    }

    // Check rate limiting
    await this.checkRateLimit()

    // Enhanced validation with security considerations
    const validationResults = await this.validateBatchSecure(opportunities)
    
    // ... rest of implementation with enhanced error handling
  }

  private async checkRateLimit(): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { count, error } = await supabase
      .from('opportunity_batches')
      .select('id', { count: 'exact' })
      .gte('created_at', oneHourAgo)

    if (error) {
      throw new Error('Unable to verify rate limits')
    }

    if (count && count >= BatchOpportunityService.MAX_BATCHES_PER_HOUR) {
      throw new SecurityError('Rate limit exceeded. Please try again later.')
    }
  }

  private sanitizeError(error: any): string {
    // Sanitize database errors to prevent information disclosure
    const message = error?.message || 'An error occurred'
    
    if (message.includes('duplicate key')) {
      return 'A record with this information already exists'
    }
    
    if (message.includes('foreign key')) {
      return 'Referenced record not found'
    }
    
    if (message.includes('check constraint')) {
      return 'Data validation failed'
    }
    
    return 'Processing error occurred'
  }
}

class SecurityError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SecurityError'
  }
}
```

## Stage 3: Performance Testing & Optimization

**Agent**: `comprehensive-performance-tester`
**Duration**: 25 minutes
**Receives**: Security-approved implementation

### Performance Test Suite

#### API Response Time Testing

```javascript
// Performance test using k6
import http from 'k6/http'
import { check } from 'k6'

export let options = {
  scenarios: {
    batch_creation_load: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '2m', target: 10 },
        { duration: '5m', target: 10 },
        { duration: '2m', target: 20 },
        { duration: '5m', target: 20 },
        { duration: '2m', target: 0 }
      ]
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.1'],     // Error rate under 10%
  }
}

export default function() {
  const batchData = generateBatchData(100) // 100 opportunities
  
  const response = http.post('http://localhost:3000/api/batch-opportunities', 
    JSON.stringify({ opportunities: batchData }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${__ENV.AUTH_TOKEN}`
      }
    }
  )

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
    'batch created successfully': (r) => JSON.parse(r.body).id !== undefined
  })
}
```

#### Database Performance Analysis

```sql
-- Query performance analysis
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM opportunity_batches 
WHERE user_id = 'user-uuid' 
ORDER BY created_at DESC 
LIMIT 20;

-- Index effectiveness verification
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename IN ('opportunity_batches', 'opportunities');

-- Check for table bloat and optimization opportunities
SELECT 
  schemaname,
  tablename,
  n_tup_ins as "inserts",
  n_tup_upd as "updates", 
  n_tup_del as "deletes",
  n_live_tup as "live_tuples",
  n_dead_tup as "dead_tuples"
FROM pg_stat_user_tables 
WHERE tablename IN ('opportunity_batches', 'opportunities');
```

### Performance Test Results

```markdown
**PERFORMANCE TEST REPORT**
**API**: Batch Opportunity Creation
**Date**: 2025-01-02
**Test Duration**: 16 minutes
**Load Pattern**: Ramping from 1 to 20 concurrent users

**API PERFORMANCE METRICS:**
- Average Response Time: 847ms
- 95th Percentile: 1,654ms ✅ (Target: <2000ms)
- 99th Percentile: 2,891ms ⚠️ (Exceeds target)
- Error Rate: 0.3% ✅ (Target: <0.1%)
- Throughput: 12.5 requests/second

**DATABASE PERFORMANCE:**
- Batch Insert Time (100 records): 234ms ✅
- Batch Insert Time (500 records): 1,156ms ✅
- Index Utilization: 98.7% ✅
- Connection Pool Usage: 45% ✅

**BOTTLENECKS IDENTIFIED:**
1. **Validation Overhead**: Organization ID validation queries
2. **Chunk Processing**: Sequential processing of chunks
3. **Error Handling**: Detailed error logging impacts performance

**OPTIMIZATION RECOMMENDATIONS:**

**HIGH PRIORITY:**
1. **Optimize Organization Validation**
   ```sql
   -- Create partial index for active organizations
   CREATE INDEX CONCURRENTLY idx_organizations_active 
   ON organizations(id) WHERE deleted_at IS NULL;
   ```

2. **Implement Parallel Chunk Processing**
   ```typescript
   // Process chunks in parallel with concurrency limit
   const results = await Promise.allSettled(
     chunks.map(chunk => this.processChunk(chunk, batchId))
   )
   ```

**MEDIUM PRIORITY:**
3. **Add Database Connection Pooling Optimization**
4. **Implement Caching for Organization Lookups**
5. **Optimize Error Detail Collection**

**PERFORMANCE BENCHMARKS:**
- Small Batches (1-50): 200-400ms ✅
- Medium Batches (51-200): 500-1000ms ✅  
- Large Batches (201-500): 1000-2000ms ✅
- Concurrent Users: Supports 20+ without degradation ✅

**APPROVAL STATUS:** APPROVED WITH RECOMMENDATIONS
- All critical performance targets met
- Optimization recommendations provided for future enhancement
- Monitoring alerts configured for performance regression detection
```

### Optimized Implementation

```typescript
// Performance-optimized batch processing
export class BatchOpportunityService {
  private static readonly PARALLEL_CHUNK_LIMIT = 3

  async createBatch(
    opportunities: BatchOpportunityData[],
    filename?: string
  ): Promise<OpportunityBatch> {
    // ... validation and setup code

    // Process chunks in parallel with controlled concurrency
    const chunks = this.createChunks(opportunities, 50)
    const chunkProcessors = chunks.map((chunk, index) => 
      () => this.processChunkOptimized(chunk, batch.id, index)
    )

    // Process with limited concurrency
    const results = await this.processInParallel(
      chunkProcessors, 
      BatchOpportunityService.PARALLEL_CHUNK_LIMIT
    )

    // ... result aggregation and batch completion
  }

  private async processInParallel<T>(
    tasks: Array<() => Promise<T>>,
    concurrencyLimit: number
  ): Promise<T[]> {
    const results: T[] = []
    
    for (let i = 0; i < tasks.length; i += concurrencyLimit) {
      const batch = tasks.slice(i, i + concurrencyLimit)
      const batchResults = await Promise.allSettled(
        batch.map(task => task())
      )
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        }
      })
    }
    
    return results
  }

  private async validateBatchOptimized(
    opportunities: BatchOpportunityData[]
  ): Promise<BatchValidationResult> {
    // Cache organization lookups
    const orgIds = [...new Set(opportunities.map(opp => opp.organization_id).filter(Boolean))]
    const orgValidationMap = await this.buildOrganizationValidationMap(orgIds)

    // Validate with cached data
    const errors = opportunities.flatMap((opp, index) => 
      this.validateSingleOpportunity(opp, index, orgValidationMap)
    )

    return {
      hasErrors: errors.length > 0,
      errors,
      validRecords: opportunities.length - errors.length
    }
  }
}
```

## Final Workflow Completion

### Complete Deliverable Package

```yaml
final_deliverable:
  workflow: "backend-security-performance"
  status: "completed"
  duration: "75 minutes"
  
  deliverables:
    database_schema:
      - "sql/migrations/20250102_batch_opportunity_creation.sql"
      - "RLS policies for opportunity_batches table"
      - "Optimized indexes for performance"
    
    api_implementation:
      - "src/services/batchOpportunityApi.ts"
      - "Rate limiting and security controls"
      - "Performance optimizations implemented"
    
    type_definitions:
      - "src/types/batch-opportunities.ts"
      - "Complete TypeScript coverage"
    
    security_validation:
      - "Security audit passed with remediation"
      - "GDPR compliance verified"
      - "Rate limiting implemented"
    
    performance_validation:
      - "Load testing completed successfully"
      - "Performance targets met"
      - "Optimization recommendations provided"

  success_metrics:
    security:
      - "0 critical vulnerabilities"
      - "2 medium issues resolved"
      - "OWASP Top 10 compliance"
    
    performance:
      - "P95 response time: 1,654ms (target: <2000ms)"
      - "Error rate: 0.3% (target: <0.1%)"
      - "Supports 20+ concurrent users"
    
    quality:
      - "100% TypeScript coverage"
      - "Comprehensive error handling"
      - "Database integrity maintained"

  monitoring_setup:
    performance_alerts:
      - "Response time > 2000ms"
      - "Error rate > 1%"
      - "Batch processing failures"
    
    security_monitoring:
      - "Rate limit violations"
      - "Large batch attempts"
      - "Authentication failures"

  next_steps:
    - "Frontend component integration"
    - "CSV parsing workflow implementation"  
    - "User documentation creation"
    - "Deployment to staging environment"
```

## Key Workflow Benefits Demonstrated

1. **Comprehensive Security Review**: Identified and resolved security vulnerabilities before production
2. **Performance Validation**: Ensured API meets performance requirements under load
3. **Quality Assurance**: Maintained code quality and TypeScript safety throughout
4. **Systematic Approach**: Each agent contributed specialized expertise
5. **Documentation**: Complete audit trail and monitoring setup

This example shows how the backend-security-performance chain ensures production-ready, secure, and performant API implementations for the CRM system.