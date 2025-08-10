/**
 * Opportunity Naming Service Unit Tests
 * 
 * Comprehensive testing for the auto-naming service functionality:
 * - Name generation with various parameters  
 * - Template generation and validation
 * - Batch name preview generation
 * - Name parsing and component extraction
 * - Uniqueness validation and counter handling
 * - Edge cases and error handling
 */

import type {
  BatchNamePreviewRequest
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // NameTemplateVariables 
  ,
  NameGenerationOptions
} from '@/services/opportunityNaming'
import {
  OpportunityNamingService,
  generateBatchNamePreviews,
  generateOpportunityName
} from '@/services/opportunityNaming'
import { beforeEach, describe, expect, test } from 'vitest'

describe('OpportunityNamingService', () => {
  let namingService: OpportunityNamingService

  beforeEach(() => {
    namingService = new OpportunityNamingService()
  })

  describe('generateOpportunityName', () => {
    test('should generate name with all components', () => {
      const options: NameGenerationOptions = {
        organization_name: 'TechFlow Solutions',
        principal_name: 'Jennifer Martinez',
        context: 'NEW_BUSINESS',
        date: new Date('2025-01-15')
      }

      const result = namingService.generateOpportunityName(options)

      expect(result).toBe('TechFlow Solutions - Jennifer Martinez - NEW_BUSINESS - January 2025')
    })

    test('should handle custom context', () => {
      const options: NameGenerationOptions = {
        organization_name: 'TechFlow Solutions',
        principal_name: 'Jennifer Martinez',
        custom_context: 'Strategic Partnership',
        date: new Date('2025-03-10')
      }

      const result = namingService.generateOpportunityName(options)

      expect(result).toBe('TechFlow Solutions - Jennifer Martinez - Strategic Partnership - March 2025')
    })

    test('should clean organization and principal names', () => {
      const options: NameGenerationOptions = {
        organization_name: '  TechFlow   Solutions   Inc.  ',
        principal_name: '  Jennifer   Martinez   ',
        context: 'NEW_BUSINESS',
        date: new Date('2025-01-15')
      }

      const result = namingService.generateOpportunityName(options)

      expect(result).toBe('TechFlow Solutions Inc. - Jennifer Martinez - NEW_BUSINESS - January 2025')
    })

    test('should handle names with special characters', () => {
      const options: NameGenerationOptions = {
        organization_name: 'TechFlow & Associates Co.',
        principal_name: 'Mary-Jane O\'Connor',
        context: 'NEW_BUSINESS',
        date: new Date('2025-01-15')
      }

      const result = namingService.generateOpportunityName(options)

      expect(result).toBe('TechFlow & Associates Co. - Mary-Jane OConnor - NEW_BUSINESS - January 2025')
    })

    test('should handle missing context', () => {
      const options: NameGenerationOptions = {
        organization_name: 'TechFlow Solutions',
        principal_name: 'Jennifer Martinez',
        date: new Date('2025-01-15')
      }

      const result = namingService.generateOpportunityName(options)

      expect(result).toBe('TechFlow Solutions - Jennifer Martinez - January 2025')
    })

    test('should default to current date when not provided', () => {
      const options: NameGenerationOptions = {
        organization_name: 'TechFlow Solutions',
        principal_name: 'Jennifer Martinez',
        context: 'NEW_BUSINESS'
      }

      const result = namingService.generateOpportunityName(options)
      const currentDate = new Date()
      const expectedMonth = currentDate.toLocaleDateString('en-US', { month: 'long' })
      const expectedYear = currentDate.getFullYear()

      expect(result).toContain(`${expectedMonth} ${expectedYear}`)
    })

    test('should handle different months correctly', () => {
      const testCases = [
        { date: new Date('2025-01-15'), expected: 'January 2025' },
        { date: new Date('2025-06-15'), expected: 'June 2025' },
        { date: new Date('2025-12-15'), expected: 'December 2025' }
      ]

      testCases.forEach(({ date, expected }) => {
        const options: NameGenerationOptions = {
          organization_name: 'Test Org',
          principal_name: 'Test Principal',
          date
        }

        const result = namingService.generateOpportunityName(options)
        expect(result).toContain(expected)
      })
    })
  })

  describe('generateBatchNamePreviews', () => {
    test('should generate previews for multiple principals', () => {
      const request: BatchNamePreviewRequest = {
        organization_name: 'TechFlow Solutions',
        principal_data: [
          { id: 'p1', name: 'Jennifer Martinez' },
          { id: 'p2', name: 'Robert Kim' },
          { id: 'p3', name: 'Maria Rodriguez' }
        ],
        context: 'NEW_BUSINESS',
        date: new Date('2025-01-15')
      }

      const results = namingService.generateBatchNamePreviews(request)

      expect(results).toHaveLength(3)

      expect(results[0]).toEqual({
        principal_id: 'p1',
        principal_name: 'Jennifer Martinez',
        generated_name: 'TechFlow Solutions - Jennifer Martinez - NEW_BUSINESS - January 2025',
        name_template: expect.any(String)
      })

      expect(results[1]).toEqual({
        principal_id: 'p2',
        principal_name: 'Robert Kim',
        generated_name: 'TechFlow Solutions - Robert Kim - NEW_BUSINESS - January 2025',
        name_template: expect.any(String)
      })

      expect(results[2]).toEqual({
        principal_id: 'p3',
        principal_name: 'Maria Rodriguez',
        generated_name: 'TechFlow Solutions - Maria Rodriguez - NEW_BUSINESS - January 2025',
        name_template: expect.any(String)
      })
    })

    test('should handle empty principal list', () => {
      const request: BatchNamePreviewRequest = {
        organization_name: 'TechFlow Solutions',
        principal_data: [],
        context: 'NEW_BUSINESS',
        date: new Date('2025-01-15')
      }

      const results = namingService.generateBatchNamePreviews(request)

      expect(results).toHaveLength(0)
    })

    test('should handle custom context in batch previews', () => {
      const request: BatchNamePreviewRequest = {
        organization_name: 'TechFlow Solutions',
        principal_data: [
          { id: 'p1', name: 'Jennifer Martinez' }
        ],
        custom_context: 'Strategic Partnership',
        date: new Date('2025-01-15')
      }

      const results = namingService.generateBatchNamePreviews(request)

      expect(results[0].generated_name).toBe('TechFlow Solutions - Jennifer Martinez - Strategic Partnership - January 2025')
    })
  })

  describe('generateNameTemplate', () => {
    test('should generate template with placeholders', () => {
      const options: NameGenerationOptions = {
        organization_name: 'TechFlow Solutions',
        principal_name: 'Jennifer Martinez',
        context: 'NEW_BUSINESS'
      }

      const template = namingService.generateNameTemplate(options)

      expect(template).toBe('{{organization}} - {{principal}} - NEW_BUSINESS - {{month}} {{year}}')
    })

    test('should omit context placeholder when no context provided', () => {
      const options: NameGenerationOptions = {
        organization_name: 'TechFlow Solutions',
        principal_name: 'Jennifer Martinez'
      }

      const template = namingService.generateNameTemplate(options)

      expect(template).toBe('{{organization}} - {{principal}} - {{month}} {{year}}')
    })

    test('should use custom context in template', () => {
      const options: NameGenerationOptions = {
        organization_name: 'TechFlow Solutions',
        principal_name: 'Jennifer Martinez',
        custom_context: 'Strategic Partnership'
      }

      const template = namingService.generateNameTemplate(options)

      expect(template).toBe('{{organization}} - {{principal}} - Strategic Partnership - {{month}} {{year}}')
    })
  })

  describe('isAutoGeneratedName', () => {
    test('should validate auto-generated names correctly', () => {
      const template = '{{organization}} - {{principal}} - NEW_BUSINESS - {{month}} {{year}}'
      const validName = 'TechFlow Solutions - Jennifer Martinez - NEW_BUSINESS - January 2025'
      const invalidName = 'Custom Opportunity Name'

      expect(namingService.isAutoGeneratedName(validName, template)).toBe(true)
      expect(namingService.isAutoGeneratedName(invalidName, template)).toBe(false)
    })

    test('should handle null template', () => {
      const name = 'TechFlow Solutions - Jennifer Martinez - NEW_BUSINESS - January 2025'

      expect(namingService.isAutoGeneratedName(name, null)).toBe(false)
    })

    test('should handle names with extra spaces', () => {
      const template = '{{organization}} - {{principal}} - NEW_BUSINESS - {{month}} {{year}}'
      const nameWithSpaces = '  TechFlow Solutions  -  Jennifer Martinez  -  NEW_BUSINESS  -  January 2025  '

      expect(namingService.isAutoGeneratedName(nameWithSpaces, template)).toBe(true)
    })

    test('should validate names without context', () => {
      const template = '{{organization}} - {{principal}} - {{month}} {{year}}'
      const validName = 'TechFlow Solutions - Jennifer Martinez - January 2025'

      expect(namingService.isAutoGeneratedName(validName, template)).toBe(true)
    })
  })

  describe('parseAutoGeneratedName', () => {
    test('should parse auto-generated name components', () => {
      const template = '{{organization}} - {{principal}} - NEW_BUSINESS - {{month}} {{year}}'
      const name = 'TechFlow Solutions - Jennifer Martinez - NEW_BUSINESS - January 2025'

      const parsed = namingService.parseAutoGeneratedName(name, template)

      expect(parsed).toEqual({
        organization: 'TechFlow Solutions',
        principal: 'Jennifer Martinez',
        context: 'NEW_BUSINESS',
        month: 'January',
        year: '2025',
        date: 'January 2025'
      })
    })

    test('should return null for non-auto-generated names', () => {
      const template = '{{organization}} - {{principal}} - NEW_BUSINESS - {{month}} {{year}}'
      const name = 'Custom Opportunity Name'

      const parsed = namingService.parseAutoGeneratedName(name, template)

      expect(parsed).toBeNull()
    })

    test('should handle names without context', () => {
      const template = '{{organization}} - {{principal}} - {{month}} {{year}}'
      const name = 'TechFlow Solutions - Jennifer Martinez - January 2025'

      const parsed = namingService.parseAutoGeneratedName(name, template)

      expect(parsed).toEqual({
        organization: 'TechFlow Solutions',
        principal: 'Jennifer Martinez',
        context: '',
        month: 'January',
        year: '2025',
        date: 'January 2025'
      })
    })

    test('should handle malformed names gracefully', () => {
      const template = '{{organization}} - {{principal}} - NEW_BUSINESS - {{month}} {{year}}'
      const malformedName = 'TechFlow - Too - Few - Components'

      const parsed = namingService.parseAutoGeneratedName(malformedName, template)

      expect(parsed).toBeNull()
    })
  })

  describe('updateAutoGeneratedName', () => {
    test('should update existing auto-generated name', () => {
      const currentName = 'TechFlow Solutions - Jennifer Martinez - NEW_BUSINESS - January 2025'
      const template = '{{organization}} - {{principal}} - NEW_BUSINESS - {{month}} {{year}}'
      const updates = {
        context: 'EXPANSION' as const,
        date: new Date('2025-03-15')
      }

      const updatedName = namingService.updateAutoGeneratedName(currentName, template, updates)

      expect(updatedName).toBe('TechFlow Solutions - Jennifer Martinez - EXPANSION - March 2025')
    })

    test('should generate new name if parsing fails', () => {
      const currentName = 'Custom Opportunity Name'
      const template = '{{organization}} - {{principal}} - NEW_BUSINESS - {{month}} {{year}}'
      const updates: NameGenerationOptions = {
        organization_name: 'New Org',
        principal_name: 'New Principal',
        context: 'NEW_BUSINESS',
        date: new Date('2025-01-15')
      }

      const updatedName = namingService.updateAutoGeneratedName(currentName, template, updates)

      expect(updatedName).toBe('New Org - New Principal - NEW_BUSINESS - January 2025')
    })

    test('should handle partial updates', () => {
      const currentName = 'TechFlow Solutions - Jennifer Martinez - NEW_BUSINESS - January 2025'
      const template = '{{organization}} - {{principal}} - NEW_BUSINESS - {{month}} {{year}}'
      const updates = {
        date: new Date('2025-06-15')
      }

      const updatedName = namingService.updateAutoGeneratedName(currentName, template, updates)

      expect(updatedName).toBe('TechFlow Solutions - Jennifer Martinez - NEW_BUSINESS - June 2025')
    })
  })

  describe('generateUniqueName', () => {
    test('should return base name when unique', async () => {
      // Mock isNameUnique to return true (name is unique)
      const mockIsUnique = vi.spyOn(namingService, 'isNameUnique')
        .mockResolvedValue({ data: true, error: null, success: true })

      const options: NameGenerationOptions = {
        organization_name: 'TechFlow Solutions',
        principal_name: 'Jennifer Martinez',
        context: 'NEW_BUSINESS',
        date: new Date('2025-01-15')
      }

      const result = await namingService.generateUniqueName(options)

      expect(result.success).toBe(true)
      expect(result.data).toBe('TechFlow Solutions - Jennifer Martinez - NEW_BUSINESS - January 2025')

      mockIsUnique.mockRestore()
    })

    test('should append counter when name is not unique', async () => {
      // Mock isNameUnique to return false first two times, then true
      const mockIsUnique = vi.spyOn(namingService, 'isNameUnique')
        .mockResolvedValueOnce({ data: false, error: null, success: true })
        .mockResolvedValueOnce({ data: false, error: null, success: true })
        .mockResolvedValueOnce({ data: true, error: null, success: true })

      const options: NameGenerationOptions = {
        organization_name: 'TechFlow Solutions',
        principal_name: 'Jennifer Martinez',
        context: 'NEW_BUSINESS',
        date: new Date('2025-01-15')
      }

      const result = await namingService.generateUniqueName(options)

      expect(result.success).toBe(true)
      expect(result.data).toBe('TechFlow Solutions - Jennifer Martinez - NEW_BUSINESS - January 2025 (2)')

      mockIsUnique.mockRestore()
    })

    test('should handle maximum attempts exceeded', async () => {
      // Mock isNameUnique to always return false (never unique)
      const mockIsUnique = vi.spyOn(namingService, 'isNameUnique')
        .mockResolvedValue({ data: false, error: null, success: true })

      const options: NameGenerationOptions = {
        organization_name: 'TechFlow Solutions',
        principal_name: 'Jennifer Martinez',
        context: 'NEW_BUSINESS',
        date: new Date('2025-01-15')
      }

      const result = await namingService.generateUniqueName(options)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Could not generate unique name')

      mockIsUnique.mockRestore()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty organization name', () => {
      const options: NameGenerationOptions = {
        organization_name: '',
        principal_name: 'Jennifer Martinez',
        context: 'NEW_BUSINESS',
        date: new Date('2025-01-15')
      }

      const result = namingService.generateOpportunityName(options)

      expect(result).toBe('Jennifer Martinez - NEW_BUSINESS - January 2025')
    })

    test('should handle empty principal name', () => {
      const options: NameGenerationOptions = {
        organization_name: 'TechFlow Solutions',
        principal_name: '',
        context: 'NEW_BUSINESS',
        date: new Date('2025-01-15')
      }

      const result = namingService.generateOpportunityName(options)

      expect(result).toBe('TechFlow Solutions - NEW_BUSINESS - January 2025')
    })

    test('should handle invalid date gracefully', () => {
      const options: NameGenerationOptions = {
        organization_name: 'TechFlow Solutions',
        principal_name: 'Jennifer Martinez',
        context: 'NEW_BUSINESS',
        date: new Date('invalid-date')
      }

      const result = namingService.generateOpportunityName(options)

      // Should use current date as fallback
      expect(result).toContain('TechFlow Solutions - Jennifer Martinez - NEW_BUSINESS')
    })

    test('should handle very long names appropriately', () => {
      const longOrgName = 'A'.repeat(100)
      const longPrincipalName = 'B'.repeat(100)

      const options: NameGenerationOptions = {
        organization_name: longOrgName,
        principal_name: longPrincipalName,
        context: 'NEW_BUSINESS',
        date: new Date('2025-01-15')
      }

      const result = namingService.generateOpportunityName(options)

      expect(result).toContain(longOrgName)
      expect(result).toContain(longPrincipalName)
      expect(result).toContain('NEW_BUSINESS - January 2025')
    })

    test('should handle Unicode characters in names', () => {
      const options: NameGenerationOptions = {
        organization_name: 'Tëch Flôw Sölütiöns',
        principal_name: 'Jënnïfër Märtínëz',
        context: 'NEW_BUSINESS',
        date: new Date('2025-01-15')
      }

      const result = namingService.generateOpportunityName(options)

      expect(result).toBe('Tëch Flôw Sölütiöns - Jënnïfër Märtínëz - NEW_BUSINESS - January 2025')
    })
  })

  describe('Utility Functions', () => {
    test('generateOpportunityName utility function should work', () => {
      const options: NameGenerationOptions = {
        organization_name: 'TechFlow Solutions',
        principal_name: 'Jennifer Martinez',
        context: 'NEW_BUSINESS',
        date: new Date('2025-01-15')
      }

      const result = generateOpportunityName(options)

      expect(result).toBe('TechFlow Solutions - Jennifer Martinez - NEW_BUSINESS - January 2025')
    })

    test('generateBatchNamePreviews utility function should work', () => {
      const request: BatchNamePreviewRequest = {
        organization_name: 'TechFlow Solutions',
        principal_data: [
          { id: 'p1', name: 'Jennifer Martinez' }
        ],
        context: 'NEW_BUSINESS',
        date: new Date('2025-01-15')
      }

      const results = generateBatchNamePreviews(request)

      expect(results).toHaveLength(1)
      expect(results[0].generated_name).toBe('TechFlow Solutions - Jennifer Martinez - NEW_BUSINESS - January 2025')
    })
  })
})