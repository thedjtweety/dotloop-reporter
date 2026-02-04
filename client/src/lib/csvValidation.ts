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


// ============================================================================
// CSV Data Quality Report Generation
// ============================================================================

export interface ValidationIssue {
  field: string;
  severity: 'error' | 'warning' | 'info';
  count: number;
  percentage: number;
  examples: string[];
  suggestion: string;
}

export interface ValidationReport {
  fileName: string;
  totalRecords: number;
  validRecords: number;
  recordsWithIssues: number;
  overallQuality: number;
  fieldCompleteness: {
    field: string;
    complete: number;
    percentage: number;
  }[];
  issues: ValidationIssue[];
  criticalIssues: number;
  warnings: number;
}

export interface CSVData {
  [key: string]: any;
}

/**
 * Validates CSV data and generates a comprehensive validation report
 */
export function validateCSVData(
  fileName: string,
  records: CSVData[]
): ValidationReport {
  if (!records || records.length === 0) {
    return {
      fileName,
      totalRecords: 0,
      validRecords: 0,
      recordsWithIssues: 0,
      overallQuality: 0,
      fieldCompleteness: [],
      issues: [],
      criticalIssues: 0,
      warnings: 0,
    };
  }

  const issues: ValidationIssue[] = [];
  let criticalIssues = 0;
  let warnings = 0;

  // Check agent names consistency
  const agentNameIssues = validateAgentNamesQuality(records);
  if (agentNameIssues) {
    issues.push(agentNameIssues);
    if (agentNameIssues.severity === 'error') criticalIssues++;
    else warnings++;
  }

  // Check date formatting
  const dateIssues = validateDateFormattingQuality(records);
  if (dateIssues) {
    issues.push(dateIssues);
    if (dateIssues.severity === 'error') criticalIssues++;
    else warnings++;
  }

  // Check numeric data
  const numericIssues = validateNumericDataQuality(records);
  if (numericIssues) {
    issues.push(numericIssues);
    if (numericIssues.severity === 'error') criticalIssues++;
    else warnings++;
  }

  // Check status values
  const statusIssues = validateStatusValuesQuality(records);
  if (statusIssues) {
    issues.push(statusIssues);
    if (statusIssues.severity === 'warning') warnings++;
  }

  // Check agent lists
  const agentListIssues = validateAgentListsQuality(records);
  if (agentListIssues) {
    issues.push(agentListIssues);
    if (agentListIssues.severity === 'warning') warnings++;
  }

  // Calculate field completeness
  const fieldCompleteness = calculateFieldCompletenessQuality(records);

  // Calculate overall quality
  const validRecords = records.length - (criticalIssues > 0 ? Math.ceil(records.length * 0.1) : 0);
  const overallQuality = Math.round((validRecords / records.length) * 100);

  return {
    fileName,
    totalRecords: records.length,
    validRecords,
    recordsWithIssues: records.length - validRecords,
    overallQuality,
    fieldCompleteness,
    issues,
    criticalIssues,
    warnings,
  };
}

function validateAgentNamesQuality(records: CSVData[]): ValidationIssue | null {
  const issues: string[] = [];
  let problemCount = 0;

  for (const record of records) {
    const agent = record.agent || record.Agent || record.agentName || record['Agent Name'];
    if (!agent) continue;

    const agentStr = String(agent).trim();
    
    // Check for all uppercase (likely abbreviation)
    if (agentStr === agentStr.toUpperCase() && agentStr.length > 2 && /[A-Z]/.test(agentStr)) {
      problemCount++;
      if (issues.length < 3) issues.push(agentStr);
    }
  }

  if (problemCount > 0) {
    return {
      field: 'Agent Names',
      severity: 'warning',
      count: problemCount,
      percentage: Math.round((problemCount / records.length) * 100),
      examples: issues,
      suggestion: 'Use consistent name formatting (e.g., "John Smith" not "JOHN SMITH"). Inconsistent formatting can cause agent metrics to be fragmented.',
    };
  }

  return null;
}

function validateDateFormattingQuality(records: CSVData[]): ValidationIssue | null {
  const dateFields = ['closingDate', 'Closing Date', 'closing_date', 'date', 'Date', 'contractDate', 'Contract Date'];
  const issues: string[] = [];
  let problemCount = 0;

  const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;

  for (const record of records) {
    let dateValue = null;
    for (const field of dateFields) {
      if (record[field]) {
        dateValue = record[field];
        break;
      }
    }

    if (!dateValue) continue;

    const dateStr = String(dateValue).trim();
    if (!dateRegex.test(dateStr)) {
      problemCount++;
      if (issues.length < 3) issues.push(dateStr);
    }
  }

  if (problemCount > 0) {
    return {
      field: 'Date Formatting',
      severity: 'error',
      count: problemCount,
      percentage: Math.round((problemCount / records.length) * 100),
      examples: issues,
      suggestion: 'All dates must be in MM/DD/YYYY format (e.g., 01/15/2024). This is critical for accurate date calculations and filtering.',
    };
  }

  return null;
}

function validateNumericDataQuality(records: CSVData[]): ValidationIssue | null {
  const numericFields = ['price', 'Price', 'salePrice', 'Sale Price', 'commission', 'Commission', 'rate', 'Rate'];
  const issues: string[] = [];
  let problemCount = 0;

  for (const record of records) {
    for (const field of numericFields) {
      const value = record[field];
      if (!value) continue;

      const valueStr = String(value).trim();
      // Check for currency symbols, commas, or other formatting
      if (/[$,()%]/.test(valueStr)) {
        problemCount++;
        if (issues.length < 3) issues.push(`${field}: ${valueStr}`);
        break;
      }

      // Check if it's a valid number
      if (isNaN(Number(valueStr))) {
        problemCount++;
        if (issues.length < 3) issues.push(`${field}: ${valueStr}`);
        break;
      }
    }
  }

  if (problemCount > 0) {
    return {
      field: 'Numeric Data',
      severity: 'error',
      count: problemCount,
      percentage: Math.round((problemCount / records.length) * 100),
      examples: issues,
      suggestion: 'Remove currency symbols, commas, and percent signs. Enter prices as "500000" not "$500,000", and rates as "3" not "3%".',
    };
  }

  return null;
}

function validateStatusValuesQuality(records: CSVData[]): ValidationIssue | null {
  const validStatuses = ['Active', 'Pending', 'Closed', 'Sold', 'Archived', 'Withdrawn'];
  const statusFields = ['status', 'Status', 'loopStatus', 'Loop Status', 'transactionStatus', 'Transaction Status'];
  const issues: string[] = [];
  let problemCount = 0;

  for (const record of records) {
    let statusValue = null;
    for (const field of statusFields) {
      if (record[field]) {
        statusValue = record[field];
        break;
      }
    }

    if (!statusValue) continue;

    const statusStr = String(statusValue).trim();
    if (!validStatuses.includes(statusStr)) {
      problemCount++;
      if (issues.length < 3) issues.push(statusStr);
    }
  }

  if (problemCount > 0) {
    return {
      field: 'Status Values',
      severity: 'warning',
      count: problemCount,
      percentage: Math.round((problemCount / records.length) * 100),
      examples: issues,
      suggestion: 'Use standardized status values: Active, Pending, Closed, Sold, Archived, or Withdrawn. Invalid statuses may cause filtering issues.',
    };
  }

  return null;
}

function validateAgentListsQuality(records: CSVData[]): ValidationIssue | null {
  const agentFields = ['agents', 'Agents', 'agentList', 'Agent List', 'agent', 'Agent'];
  const issues: string[] = [];
  let problemCount = 0;

  for (const record of records) {
    let agentValue = null;
    for (const field of agentFields) {
      if (record[field]) {
        agentValue = record[field];
        break;
      }
    }

    if (!agentValue) continue;

    const agentStr = String(agentValue).trim();
    
    // Check for semicolons or other separators
    if (agentStr.includes(';') || agentStr.includes('|')) {
      problemCount++;
      if (issues.length < 3) issues.push(agentStr);
    }

    // Check for trailing commas
    if (agentStr.endsWith(',')) {
      problemCount++;
      if (issues.length < 3) issues.push(agentStr);
    }
  }

  if (problemCount > 0) {
    return {
      field: 'Agent Lists',
      severity: 'warning',
      count: problemCount,
      percentage: Math.round((problemCount / records.length) * 100),
      examples: issues,
      suggestion: 'Use comma-separated format for multiple agents. Avoid semicolons, pipes, or trailing commas.',
    };
  }

  return null;
}

function calculateFieldCompletenessQuality(records: CSVData[]): Array<{ field: string; complete: number; percentage: number }> {
  const fields = [
    { key: 'loopName', name: 'Loop Name' },
    { key: 'closingDate', name: 'Closing Date' },
    { key: 'agent', name: 'Agents' },
    { key: 'price', name: 'Price' },
    { key: 'status', name: 'Status' },
  ];

  return fields.map(field => {
    let complete = 0;
    for (const record of records) {
      const value = record[field.key] || record[field.name];
      if (value && String(value).trim() !== '') {
        complete++;
      }
    }

    return {
      field: field.name,
      complete,
      percentage: Math.round((complete / records.length) * 100),
    };
  });
}
