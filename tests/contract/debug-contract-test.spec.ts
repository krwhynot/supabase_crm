/**
 * Debug test for MockQueryBuilder error handling
 */

import { describe, it, expect, beforeEach } from 'vitest'

describe('Debug MockQueryBuilder Error Handling', () => {
  beforeEach(async () => {
    // Clear any previous state
    const { MockQueryBuilder } = await import('@/config/supabaseClient')
    MockQueryBuilder.clearMockResponse()
  })
  
  it('should return error when MockQueryBuilder has error set', async () => {
    const { MockQueryBuilder, supabase } = await import('@/config/supabaseClient')
    
    // Set error response
    MockQueryBuilder.setMockResponse(null, { 
      message: 'Test error', 
      code: 'TEST_ERROR', 
      details: 'Test details',
      hint: ''
    })
    
    // Test direct query
    const result = await supabase.from('principal_activity_summary').select('*')
    
    console.log('Full result:', JSON.stringify(result, null, 2))
    console.log('Error exists?', !!result.error)
    console.log('Error truthy?', result.error ? 'yes' : 'no')
    console.log('Error type:', typeof result.error)
    console.log('Error value:', result.error)
    
    expect(result.error).toBeTruthy()
    expect(result.data).toBeNull()
    
    MockQueryBuilder.clearMockResponse()
  })
  
  it('should simulate API error check', async () => {
    const { MockQueryBuilder, supabase } = await import('@/config/supabaseClient')
    
    // Set error response like in the failing test
    MockQueryBuilder.setMockResponse(null, { 
      message: 'Test error', 
      code: 'TEST_ERROR', 
      details: 'Test details',
      hint: ''
    })
    
    // Simulate the exact API pattern
    let query = supabase
      .from('principal_activity_summary')
      .select('*')
      .range(0, 19)
    
    const { data, error, count } = await query
    
    console.log('Query result data:', data)
    console.log('Query result error:', error)
    console.log('Query result count:', count)
    console.log('Error check result:', error ? 'ERROR DETECTED' : 'NO ERROR')
    
    if (error) {
      console.log('API would return error response')
      expect(true).toBe(true)
    } else {
      console.log('API would continue processing')
      expect(true).toBe(false) // Should not reach here if error is set
    }
    
    MockQueryBuilder.clearMockResponse()
  })
  
  it('should test actual API call with error mock', async () => {
    const { MockQueryBuilder } = await import('@/config/supabaseClient')
    const { principalActivityApi } = await import('@/services/principalActivityApi')
    
    // Set error response
    MockQueryBuilder.setMockResponse(null, { 
      message: 'API Test error', 
      code: 'API_TEST_ERROR', 
      details: 'API Test details',
      hint: ''
    })
    
    // Call the actual API method
    const apiResult = await principalActivityApi.getPrincipalSummaries({})
    
    console.log('Actual API result:', JSON.stringify(apiResult, null, 2))
    console.log('API success:', apiResult.success)
    console.log('API error:', apiResult.error)
    
    // This should be false if error handling works
    if (apiResult.success) {
      console.log('🚨 BUG: API returned success despite error mock')
      expect(false).toBe(true) // Force failure to see the issue
    } else {
      console.log('✅ API correctly returned error')
      expect(true).toBe(true)
    }
    
    MockQueryBuilder.clearMockResponse()
  })
})