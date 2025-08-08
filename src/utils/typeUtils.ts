/**
 * Type Utility Functions
 * Provides consistent type handling for database operations and form data
 */

/**
 * Convert undefined values to null for database compatibility
 * Useful for preparing form data before database insertion/updates
 */
export const convertUndefinedToNull = <T extends Record<string, any>>(
  obj: T
): { [K in keyof T]: T[K] extends undefined ? null : T[K] } => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    acc[key as keyof T] = value === undefined ? null : value
    return acc
  }, {} as any)
}

/**
 * Convert null values to undefined for form handling
 * Useful when loading data from database into forms
 */
export const convertNullToUndefined = <T extends Record<string, any>>(
  obj: T
): { [K in keyof T]: T[K] extends null ? undefined : T[K] } => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    acc[key as keyof T] = value === null ? undefined : value
    return acc
  }, {} as any)
}

/**
 * Safe value extraction with fallback
 * Provides type-safe access to potentially undefined values
 */
export const safeValue = <T>(
  value: T | undefined | null, 
  fallback: T
): T => {
  return value ?? fallback
}

/**
 * Create empty filter object with proper optional property handling
 */
export const createEmptyFilters = <T extends Record<string, any>>(): Partial<T> => {
  return {} as Partial<T>
}

/**
 * Merge filters while preserving type safety
 */
export const mergeFilters = <T extends Record<string, any>>(
  base: Partial<T>,
  updates: Partial<T>
): Partial<T> => {
  return { ...base, ...updates }
}

/**
 * Remove undefined values from object
 * Useful for cleaning up form data before API calls
 */
export const removeUndefined = <T extends Record<string, any>>(
  obj: T
): Partial<T> => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key as keyof T] = value
    }
    return acc
  }, {} as Partial<T>)
}