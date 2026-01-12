import type { InferInsertModel } from 'drizzle-orm';
import { transactions } from '../drizzle/schema';

type InsertTransaction = InferInsertModel<typeof transactions>;

/**
 * Validates and sanitizes transaction data before database insertion
 * Ensures all numeric fields are valid numbers and within reasonable ranges
 */
export function validateTransaction(transaction: any, rowIndex: number): { valid: boolean; data?: InsertTransaction; error?: string } {
  try {
    // Validate required fields
    if (!transaction.tenantId || !Number.isInteger(transaction.tenantId)) {
      return { valid: false, error: `Row ${rowIndex}: Missing or invalid tenantId` };
    }
    if (!transaction.uploadId || !Number.isInteger(transaction.uploadId)) {
      return { valid: false, error: `Row ${rowIndex}: Missing or invalid uploadId` };
    }
    if (!transaction.userId || !Number.isInteger(transaction.userId)) {
      return { valid: false, error: `Row ${rowIndex}: Missing or invalid userId` };
    }

    // Sanitize numeric fields - ensure they are valid numbers
    const numericFields = [
      'price', 'bedrooms', 'bathrooms', 'squareFootage', 'earnestMoney',
      'salePrice', 'commissionRate', 'commissionTotal', 'buySideCommission',
      'sellSideCommission', 'companyDollar', 'referralPercentage', 'originalPrice',
      'yearBuilt', 'lotSize'
    ];

    const sanitized: any = { ...transaction };

    for (const field of numericFields) {
      if (field in sanitized) {
        const value = sanitized[field];
        
        // Skip null/undefined
        if (value === null || value === undefined) {
          sanitized[field] = 0;
          continue;
        }

        // Convert to number if string
        let numValue = typeof value === 'string' ? parseFloat(value) : value;

        // Check if conversion resulted in NaN
        if (isNaN(numValue)) {
          return { valid: false, error: `Row ${rowIndex}: Field '${field}' has invalid numeric value: '${value}'` };
        }

        // Check for unreasonable values (likely data corruption)
        // Most real estate prices shouldn't exceed $100M, commissions shouldn't exceed 100%
        if (field === 'price' || field === 'salePrice' || field === 'originalPrice' || field === 'earnestMoney') {
          if (numValue > 1000000000) { // $1 billion
            return { valid: false, error: `Row ${rowIndex}: Field '${field}' value ${numValue} exceeds maximum allowed value` };
          }
        }

        if (field === 'commissionRate' || field === 'referralPercentage') {
          if (numValue > 10000) { // 10000% would be 100x
            return { valid: false, error: `Row ${rowIndex}: Field '${field}' percentage value ${numValue} is unreasonably high` };
          }
        }

        if (field === 'bedrooms' || field === 'bathrooms') {
          if (numValue < 0 || numValue > 100) {
            return { valid: false, error: `Row ${rowIndex}: Field '${field}' value ${numValue} is outside reasonable range (0-100)` };
          }
        }

        if (field === 'yearBuilt') {
          if (numValue > 0 && (numValue < 1800 || numValue > new Date().getFullYear() + 1)) {
            return { valid: false, error: `Row ${rowIndex}: Field 'yearBuilt' value ${numValue} is outside reasonable range` };
          }
        }

        sanitized[field] = Math.round(numValue * 100) / 100; // Round to 2 decimal places
      }
    }

    // Truncate long text fields to database limits
    const textFields: { [key: string]: number } = {
      loopId: 255,
      loopName: 500,
      loopStatus: 100,
      propertyType: 100,
      city: 100,
      state: 50,
      county: 100,
      leadSource: 100,
      createdBy: 255,
      referralSource: 255,
      complianceStatus: 100,
      subdivision: 255,
    };

    for (const [field, maxLength] of Object.entries(textFields)) {
      if (field in sanitized && sanitized[field]) {
        if (typeof sanitized[field] !== 'string') {
          sanitized[field] = String(sanitized[field]);
        }
        if (sanitized[field].length > maxLength) {
          console.warn(`Row ${rowIndex}: Field '${field}' truncated from ${sanitized[field].length} to ${maxLength} characters`);
          sanitized[field] = sanitized[field].substring(0, maxLength);
        }
      }
    }

    // Validate text fields that should have specific formats
    if (sanitized.loopViewUrl && !sanitized.loopViewUrl.startsWith('http')) {
      return { valid: false, error: `Row ${rowIndex}: Invalid loopViewUrl format` };
    }

    return { valid: true, data: sanitized as InsertTransaction };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { valid: false, error: `Row ${rowIndex}: Validation error: ${errorMsg}` };
  }
}

/**
 * Validates a batch of transactions and detects duplicates
 */
export function validateTransactionBatch(transactions: any[]): { valid: boolean; validData?: InsertTransaction[]; errors?: string[] } {
  const validData: InsertTransaction[] = [];
  const errors: string[] = [];
  const loopIdsSeen = new Map<string, number>(); // Track loopIds and their row numbers

  for (let i = 0; i < transactions.length; i++) {
    const result = validateTransaction(transactions[i], i + 1);
    if (result.valid && result.data) {
      // Check for duplicate loopIds within the batch
      const loopId = result.data.loopId;
      if (loopId && loopIdsSeen.has(loopId)) {
        const firstRow = loopIdsSeen.get(loopId);
        errors.push(
          `Row ${i + 1}: Duplicate loopId '${loopId}' (also appears in row ${firstRow}). ` +
          `Each transaction must have a unique loopId within the same tenant.`
        );
      } else if (loopId) {
        loopIdsSeen.set(loopId, i + 1);
        validData.push(result.data);
      } else {
        // loopId is missing or empty - this is an error since it's part of the unique constraint
        errors.push(`Row ${i + 1}: Missing loopId. This field is required and must be unique.`);
      }
    } else if (result.error) {
      errors.push(result.error);
    }
  }

  return {
    valid: errors.length === 0,
    validData: errors.length === 0 ? validData : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}
