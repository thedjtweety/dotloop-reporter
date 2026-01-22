/**
 * CSV Validation Utility
 * 
 * Provides client-side validation for CSV file uploads including:
 * - File size validation (max 10MB)
 * - File type validation (CSV only)
 * - CSV structure validation (headers check)
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

export interface CSVValidationOptions {
  maxSizeMB?: number;
  requiredHeaders?: string[];
  allowedMimeTypes?: string[];
}

const DEFAULT_OPTIONS: CSVValidationOptions = {
  maxSizeMB: 10,
  requiredHeaders: [],
  allowedMimeTypes: ['text/csv', 'application/csv', 'text/plain'],
};

/**
 * Validate file size
 * @param file - The file to validate
 * @param maxSizeMB - Maximum allowed file size in MB
 * @returns ValidationResult
 */
export function validateFileSize(file: File, maxSizeMB: number = 10): ValidationResult {
  const fileSizeMB = file.size / (1024 * 1024);
  
  if (fileSizeMB > maxSizeMB) {
    return {
      isValid: false,
      error: `File size (${fileSizeMB.toFixed(2)}MB) exceeds maximum allowed size of ${maxSizeMB}MB. Please upload a smaller file.`,
    };
  }
  
  return { isValid: true };
}

/**
 * Validate file type
 * @param file - The file to validate
 * @param allowedMimeTypes - List of allowed MIME types
 * @returns ValidationResult
 */
export function validateFileType(
  file: File,
  allowedMimeTypes: string[] = DEFAULT_OPTIONS.allowedMimeTypes || []
): ValidationResult {
  const fileName = file.name.toLowerCase();
  const isCsvExtension = fileName.endsWith('.csv');
  const isMimeTypeValid = allowedMimeTypes.includes(file.type);
  
  if (!isCsvExtension) {
    return {
      isValid: false,
      error: 'Invalid file type. Please upload a CSV file (.csv).',
    };
  }
  
  if (!isMimeTypeValid && file.type !== '') {
    return {
      isValid: false,
      error: `File MIME type "${file.type}" is not supported. Please upload a valid CSV file.`,
    };
  }
  
  return { isValid: true };
}

/**
 * Validate CSV structure by checking headers
 * @param csvContent - The CSV file content as string
 * @param requiredHeaders - List of required headers (optional)
 * @returns ValidationResult
 */
export function validateCSVStructure(
  csvContent: string,
  requiredHeaders: string[] = []
): ValidationResult {
  if (!csvContent || csvContent.trim().length === 0) {
    return {
      isValid: false,
      error: 'CSV file is empty. Please upload a file with data.',
    };
  }
  
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    return {
      isValid: false,
      error: 'CSV file must contain at least a header row and one data row.',
    };
  }
  
  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  
  if (headers.length === 0) {
    return {
      isValid: false,
      error: 'CSV file has no headers. Please ensure the first row contains column headers.',
    };
  }
  
  // Check for required headers if specified
  if (requiredHeaders.length > 0) {
    const missingHeaders = requiredHeaders.filter(
      required => !headers.some(h => h.toLowerCase() === required.toLowerCase())
    );
    
    if (missingHeaders.length > 0) {
      return {
        isValid: false,
        error: `CSV file is missing required columns: ${missingHeaders.join(', ')}. Please ensure your CSV includes these columns.`,
      };
    }
  }
  
  return { isValid: true };
}

/**
 * Comprehensive CSV file validation
 * @param file - The file to validate
 * @param options - Validation options
 * @returns ValidationResult
 */
export async function validateCSVFile(
  file: File,
  options: CSVValidationOptions = {}
): Promise<ValidationResult> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // Validate file size
  const sizeValidation = validateFileSize(file, mergedOptions.maxSizeMB);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }
  
  // Validate file type
  const typeValidation = validateFileType(file, mergedOptions.allowedMimeTypes);
  if (!typeValidation.isValid) {
    return typeValidation;
  }
  
  // Validate CSV structure
  try {
    const csvContent = await file.text();
    const structureValidation = validateCSVStructure(csvContent, mergedOptions.requiredHeaders);
    if (!structureValidation.isValid) {
      return structureValidation;
    }
  } catch (error) {
    return {
      isValid: false,
      error: 'Failed to read CSV file. Please ensure the file is not corrupted.',
    };
  }
  
  return { isValid: true };
}

/**
 * Get user-friendly error message
 * @param error - The validation error
 * @returns Formatted error message
 */
export function getErrorMessage(error: string): string {
  // Already user-friendly, just return as-is
  return error;
}
