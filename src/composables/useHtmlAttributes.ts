/**
 * HTML Attributes Utility Composable
 * Provides safe HTML attribute binding for Vue 3 components
 * Handles undefined values for strict TypeScript compliance
 */

export const useHtmlAttributes = () => {
  /**
   * Safely handle optional HTML attributes that may be undefined
   */
  const safeAttribute = <T>(value: T | undefined): T | undefined => {
    return value === undefined ? undefined : value
  }
  
  /**
   * Create conditional attributes object, omitting undefined values
   */
  const conditionalAttributes = <T extends Record<string, any>>(
    attributes: T
  ): Partial<T> => {
    return Object.entries(attributes).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key as keyof T] = value
      }
      return acc
    }, {} as Partial<T>)
  }
  
  /**
   * Helper for boolean attributes that should be omitted when false/undefined
   */
  const booleanAttribute = (value: boolean | undefined): boolean | undefined => {
    return value ? true : undefined
  }
  
  /**
   * Helper for ARIA attributes that should only be present when defined
   */
  const ariaAttributes = (attrs: Record<string, string | undefined>) => {
    return conditionalAttributes(attrs)
  }
  
  return { 
    safeAttribute, 
    conditionalAttributes, 
    booleanAttribute,
    ariaAttributes
  }
}