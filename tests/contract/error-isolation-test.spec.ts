/**
 * Isolated Error Test - Contract Testing
 * 
 * Tests specific to isolate error handling issues in MockQueryBuilder
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { principalActivityApi } from '@/services/principalActivityApi'

describe('Error Handling Isolation Tests', () => {
  beforeEach(async () => {
    // Clear any previous state
    const { MockQueryBuilder } = await import('@/config/supabaseClient')
    MockQueryBuilder.clearMockResponse()
  })
  
  it('should trace query chain execution with error', async () => {
    const { MockQueryBuilder, supabase } = await import('@/config/supabaseClient')
    
    // Set error response
    MockQueryBuilder.setMockResponse(null, { 
      message: 'Chain Test error', 
      code: 'CHAIN_TEST_ERROR', 
      details: 'Chain Test details',
      hint: ''
    })
    
    // Simulate the exact query chain from getPrincipalSummaries
    const query = supabase
      .from('principal_activity_summary')
      .select('*')
      .order('engagement_score', { ascending: false })
      .range(0, 19) // Same as in the API method
    
    console.log('🔍 About to execute query chain...')
    const { data, error, count } = await query
    
    console.log('📊 Query chain result:')
    console.log('  Data:', data)
    console.log('  Error:', error)
    console.log('  Count:', count)
    console.log('  Error truthy?', !!error)
    
    expect(error).toBeTruthy()
    expect(data).toBeNull()
    
    MockQueryBuilder.clearMockResponse()
  })

  it('should trace full API call with error mock', async () => {
    const { MockQueryBuilder } = await import('@/config/supabaseClient')
    
    // Set error response 
    MockQueryBuilder.setMockResponse(null, { 
      message: 'API Chain Test error', 
      code: 'API_CHAIN_TEST_ERROR', 
      details: 'API Chain Test details',
      hint: ''
    })
    
    console.log('🚀 Calling getPrincipalSummaries with error mock...')
    const apiResult = await principalActivityApi.getPrincipalSummaries({})
    
    console.log('📋 API call result:')
    console.log('  Success:', apiResult.success)
    console.log('  Error:', apiResult.error)
    console.log('  Data:', apiResult.data)
    
    // Should be false if error handling works
    expect(apiResult.success).toBe(false)
    expect(apiResult.error).toBeTruthy()
    expect(apiResult.data).toBeNull()
    
    MockQueryBuilder.clearMockResponse()
  })

  it('should trace state isolation between tests', async () => {
    const { MockQueryBuilder } = await import('@/config/supabaseClient')
    
    console.log('🧪 Test 1: Set success state')
    MockQueryBuilder.setMockResponse([{ test: 'data' }], null, 1)
    
    // Use different parameters to avoid cache hits
    const result1 = await principalActivityApi.getPrincipalSummaries({ search: 'test1' })
    console.log('  Result 1 success:', result1.success)
    
    MockQueryBuilder.clearMockResponse()
    
    console.log('🧪 Test 2: Set error state')  
    MockQueryBuilder.setMockResponse(null, { message: 'Test isolation error' })
    
    // Use different parameters to avoid cache hits
    const result2 = await principalActivityApi.getPrincipalSummaries({ search: 'test2' })
    console.log('  Result 2 success:', result2.success)
    console.log('  Result 2 error:', result2.error)
    
    expect(result1.success).toBe(true)
    expect(result2.success).toBe(false)
    
    MockQueryBuilder.clearMockResponse()
  })
})