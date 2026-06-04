import { z } from 'zod';
import { handleFirestoreError, OperationType } from '@/src/lib/errorUtils';

/**
 * Validates data against a Zod schema. If validation fails, it safely logs 
 * the error and optionally throws a structured error, avoiding silent data corruption.
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: any, fallback?: T): T {
  try {
    return schema.parse(data);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues
        .map((iss: any) => `${iss.path.join('.')}: ${iss.message}`)
        .join(', ');
      console.error('Data validation failed:', error.issues);
      if (fallback !== undefined) {
        return fallback;
      }
      throw new Error(`Data validation failed: ${errorMessage}`);
    }
    throw error;
  }
}

/**
 * High order function to wrap API / repository calls and validate their output
 */
export async function withValidation<T>(
  schema: z.ZodSchema<T>,
  fetcher: () => Promise<any>,
  fallback?: T
): Promise<T> {
  const data = await fetcher();
  return validateData(schema, data, fallback);
}

/**
 * Validates a list of entities and drops invalid ones to prevent 
 * a single corrupted document from breaking the whole list view.
 */
export function validateList<T>(schema: z.ZodSchema<T>, items: any[]): T[] {
  if (!Array.isArray(items)) return [];
  return items.reduce((validItems: T[], item) => {
    const result = schema.safeParse(item);
    if (result.success) {
      validItems.push(result.data);
    } else {
      console.warn('Dropping invalid item from list:', item, result.error);
    }
    return validItems;
  }, []);
}
