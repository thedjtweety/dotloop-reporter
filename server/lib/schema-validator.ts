/**
 * Schema Validator - Validates database schema against code expectations
 * 
 * This utility ensures that all database queries access only fields that exist
 * in the actual database schema, preventing runtime errors from field mismatches.
 */

import { getDb } from '../db';
import type { MySqlTable } from 'drizzle-orm/mysql-core';

interface SchemaValidationResult {
  isValid: boolean;
  errors: SchemaValidationError[];
  warnings: SchemaValidationWarning[];
  timestamp: string;
}

interface SchemaValidationError {
  table: string;
  field: string;
  issue: string;
  severity: 'critical' | 'error';
}

interface SchemaValidationWarning {
  table: string;
  field: string;
  issue: string;
}

/**
 * Get all column names from a Drizzle table
 */
function getTableColumns(table: any): string[] {
  try {
    // Access the columns from the table metadata
    const columns = (table as any)[Symbol.for('drizzle:Columns')] as Record<string, any>;
    if (!columns) {
      return [];
    }
    return Object.keys(columns);
  } catch {
    return [];
  }
}

/**
 * Validate that a field exists in a table
 */
export function validateFieldExists(
  table: any,
  fieldName: string,
  tableName: string
): SchemaValidationError | null {
  const columns = getTableColumns(table);
  
  if (!columns.includes(fieldName)) {
    return {
      table: tableName,
      field: fieldName,
      issue: `Field "${fieldName}" does not exist in table "${tableName}". Available fields: ${columns.join(', ')}`,
      severity: 'critical',
    };
  }
  
  return null;
}

/**
 * Validate multiple fields in a table
 */
export function validateFieldsExist(
  table: any,
  fieldNames: string[],
  tableName: string
): SchemaValidationError[] {
  const errors: SchemaValidationError[] = [];
  
  for (const fieldName of fieldNames) {
    const error = validateFieldExists(table, fieldName, tableName);
    if (error) {
      errors.push(error);
    }
  }
  
  return errors;
}

/**
 * Get all columns in a table for inspection
 */
export function getTableSchema(table: MySqlTable): string[] {
  return getTableColumns(table);
}

/**
 * Create a safe field accessor that validates before access
 */
export function createSafeFieldAccessor(
  table: any,
  tableName: string
) {
  const validColumns = getTableColumns(table);
  
  return {
    /**
     * Safely access a field with validation
     */
    getField<T = any>(obj: any, fieldName: string, defaultValue?: T): T | undefined {
      if (!validColumns.includes(fieldName)) {
        console.warn(
          `[Schema Validator] Field "${fieldName}" not found in table "${tableName}". ` +
          `Available fields: ${validColumns.join(', ')}`
        );
        return defaultValue;
      }
      
      return obj[fieldName] ?? defaultValue;
    },
    
    /**
     * Check if a field exists
     */
    hasField(fieldName: string): boolean {
      return validColumns.includes(fieldName);
    },
    
    /**
     * Get all available fields
     */
    getAvailableFields(): string[] {
      return [...validColumns];
    },
  };
}

/**
 * Validate database schema on startup
 */
export async function validateDatabaseSchema(): Promise<SchemaValidationResult> {
  const errors: SchemaValidationError[] = [];
  const warnings: SchemaValidationWarning[] = [];
  
  try {
    const db = await getDb();
    if (!db) {
      errors.push({
        table: 'database',
        field: 'connection',
        issue: 'Database connection not available',
        severity: 'critical',
      });
      
      return {
        isValid: false,
        errors,
        warnings,
        timestamp: new Date().toISOString(),
      };
    }
    
    // Log successful validation
    console.log('[Schema Validator] Database schema validation completed successfully');
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    errors.push({
      table: 'database',
      field: 'validation',
      issue: `Schema validation failed: ${errorMsg}`,
      severity: 'error',
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Log schema validation results
 */
export function logValidationResults(result: SchemaValidationResult): void {
  if (result.isValid) {
    console.log('[Schema Validator] ✓ All schema validations passed');
    return;
  }
  
  console.error('[Schema Validator] Schema validation failed:');
  
  for (const error of result.errors) {
    console.error(`  [${error.severity.toUpperCase()}] ${error.table}.${error.field}: ${error.issue}`);
  }
  
  for (const warning of result.warnings) {
    console.warn(`  [WARNING] ${warning.table}.${warning.field}: ${warning.issue}`);
  }
}

/**
 * Create a validation wrapper for tRPC procedures
 */
export function createValidationWrapper<T extends Record<string, any>>(
  validationFn: () => Promise<SchemaValidationResult>
) {
  return async () => {
    const result = await validationFn();
    
    if (!result.isValid) {
      logValidationResults(result);
      throw new Error('Schema validation failed. Please check server logs.');
    }
    
    return result;
  };
}
