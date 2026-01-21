/**
 * CSV Validator - Comprehensive validation and error handling for CSV uploads
 * Ensures robustness against malformed, edge-case, and malicious files
 */

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata: FileMetadata;
}

export interface ValidationError {
  code: string;
  message: string;
  severity: 'critical' | 'error' | 'warning';
  line?: number;
  column?: string;
  suggestion?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  line?: number;
  suggestion?: string;
}

export interface FileMetadata {
  fileName: string;
  fileSize: number;
  fileSizeFormatted: string;
  encoding: string;
  lineCount: number;
  columnCount: number;
  hasHeader: boolean;
  detectedDelimiter: string;
  estimatedRecords: number;
}

// Configuration constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_LINE_LENGTH = 100000; // 100k characters per line
const MIN_COLUMNS = 2; // Minimum columns for valid CSV
const MAX_COLUMNS = 200; // Maximum columns to prevent memory issues
const SAMPLE_SIZE = 100; // Lines to sample for validation

/**
 * Progress callback for validation operations
 */
export type ValidationProgressCallback = (progress: number, message?: string) => void;

/**
 * Main validation function - validates CSV file before parsing
 */
export async function validateCSVFile(
  file: File,
  onProgress?: ValidationProgressCallback
): Promise<ValidationResult> {
  onProgress?.(0, 'Starting validation...');
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // 1. File size validation
  onProgress?.(10, 'Checking file size...');
  if (file.size === 0) {
    errors.push({
      code: 'EMPTY_FILE',
      message: 'The uploaded file is empty (0 bytes)',
      severity: 'critical',
      suggestion: 'Please upload a valid CSV file with data'
    });
    
    return {
      isValid: false,
      errors,
      warnings,
      metadata: createEmptyMetadata(file.name)
    };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    errors.push({
      code: 'FILE_TOO_LARGE',
      message: `File size (${formatBytes(file.size)}) exceeds maximum allowed size (${formatBytes(MAX_FILE_SIZE)})`,
      severity: 'critical',
      suggestion: 'Please split the file into smaller chunks or filter the data in Dotloop before exporting'
    });
    
    return {
      isValid: false,
      errors,
      warnings,
      metadata: createEmptyMetadata(file.name, file.size)
    };
  }
  
  // 2. File type validation
  onProgress?.(20, 'Validating file type...');
  if (!isValidCSVFile(file)) {
    warnings.push({
      code: 'INVALID_FILE_TYPE',
      message: `File type "${file.type}" is not recognized as CSV. Attempting to parse anyway.`,
      suggestion: 'Ensure the file has a .csv extension'
    });
  }
  
  // 3. Read file content
  onProgress?.(30, 'Reading file content...');
  let content: string;
  try {
    content = await readFileContent(file);
  } catch (error) {
    errors.push({
      code: 'FILE_READ_ERROR',
      message: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      severity: 'critical',
      suggestion: 'The file may be corrupted. Try re-exporting from Dotloop.'
    });
    
    return {
      isValid: false,
      errors,
      warnings,
      metadata: createEmptyMetadata(file.name, file.size)
    };
  }
  
  // 4. Encoding validation
  onProgress?.(50, 'Detecting encoding...');
  const encoding = detectEncoding(content);
  if (encoding !== 'UTF-8' && encoding !== 'ASCII') {
    warnings.push({
      code: 'UNUSUAL_ENCODING',
      message: `File appears to use ${encoding} encoding. UTF-8 is recommended.`,
      suggestion: 'If you see strange characters, try re-exporting with UTF-8 encoding'
    });
  }
  
  // 5. Content validation
  onProgress?.(60, 'Validating content...');
  const contentValidation = validateContent(content);
  errors.push(...contentValidation.errors);
  warnings.push(...contentValidation.warnings);
  
  // 6. Structure validation
  onProgress?.(80, 'Validating structure...');
  const structureValidation = validateStructure(content);
  errors.push(...structureValidation.errors);
  warnings.push(...structureValidation.warnings);
  
  // 7. Build metadata
  onProgress?.(95, 'Building metadata...');
  const metadata: FileMetadata = {
    fileName: file.name,
    fileSize: file.size,
    fileSizeFormatted: formatBytes(file.size),
    encoding,
    lineCount: structureValidation.lineCount,
    columnCount: structureValidation.columnCount,
    hasHeader: structureValidation.hasHeader,
    detectedDelimiter: structureValidation.delimiter,
    estimatedRecords: structureValidation.estimatedRecords
  };
  
  // Critical errors prevent parsing
  const criticalErrors = errors.filter(e => e.severity === 'critical');
  
  onProgress?.(100, 'Validation complete');
  
  return {
    isValid: criticalErrors.length === 0,
    errors,
    warnings,
    metadata
  };
}

/**
 * Validate CSV content string (for direct string uploads)
 */
export function validateCSVContent(content: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  if (!content || content.trim().length === 0) {
    errors.push({
      code: 'EMPTY_CONTENT',
      message: 'CSV content is empty',
      severity: 'critical',
      suggestion: 'Ensure the CSV file contains data'
    });
    
    return {
      isValid: false,
      errors,
      warnings,
      metadata: createEmptyMetadata('content.csv')
    };
  }
  
  const contentValidation = validateContent(content);
  errors.push(...contentValidation.errors);
  warnings.push(...contentValidation.warnings);
  
  const structureValidation = validateStructure(content);
  errors.push(...structureValidation.errors);
  warnings.push(...structureValidation.warnings);
  
  const metadata: FileMetadata = {
    fileName: 'content.csv',
    fileSize: content.length,
    fileSizeFormatted: formatBytes(content.length),
    encoding: detectEncoding(content),
    lineCount: structureValidation.lineCount,
    columnCount: structureValidation.columnCount,
    hasHeader: structureValidation.hasHeader,
    detectedDelimiter: structureValidation.delimiter,
    estimatedRecords: structureValidation.estimatedRecords
  };
  
  const criticalErrors = errors.filter(e => e.severity === 'critical');
  
  return {
    isValid: criticalErrors.length === 0,
    errors,
    warnings,
    metadata
  };
}

/**
 * Validate content for common issues
 */
function validateContent(content: string): { errors: ValidationError[], warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Check for null bytes (indicates binary file)
  if (content.includes('\0')) {
    errors.push({
      code: 'BINARY_CONTENT',
      message: 'File contains binary data (null bytes)',
      severity: 'critical',
      suggestion: 'This appears to be a binary file, not a CSV. Please upload a text-based CSV file.'
    });
  }
  
  // Check for extremely long lines (potential memory issue)
  const lines = content.split('\n');
  const longLines = lines.filter((line, idx) => {
    if (line.length > MAX_LINE_LENGTH) {
      warnings.push({
        code: 'LONG_LINE',
        message: `Line ${idx + 1} exceeds ${MAX_LINE_LENGTH} characters`,
        line: idx + 1,
        suggestion: 'Extremely long lines may cause performance issues'
      });
      return true;
    }
    return false;
  });
  
  // Check for suspicious patterns
  if (content.includes('<script>') || content.includes('<?php')) {
    warnings.push({
      code: 'SUSPICIOUS_CONTENT',
      message: 'File contains script tags or code',
      suggestion: 'This may not be a valid CSV file. Ensure you exported from Dotloop correctly.'
    });
  }
  
  // Check for HTML content
  if (content.includes('<!DOCTYPE') || content.includes('<html>')) {
    errors.push({
      code: 'HTML_CONTENT',
      message: 'File appears to be HTML, not CSV',
      severity: 'critical',
      suggestion: 'You may have downloaded an error page instead of the CSV. Try exporting again from Dotloop.'
    });
  }
  
  // Check for JSON content
  if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
    errors.push({
      code: 'JSON_CONTENT',
      message: 'File appears to be JSON, not CSV',
      severity: 'critical',
      suggestion: 'Please export as CSV format from Dotloop, not JSON.'
    });
  }
  
  return { errors, warnings };
}

/**
 * Validate CSV structure
 */
function validateStructure(content: string): {
  errors: ValidationError[],
  warnings: ValidationWarning[],
  lineCount: number,
  columnCount: number,
  hasHeader: boolean,
  delimiter: string,
  estimatedRecords: number
} {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  const lines = content.split('\n').filter(line => line.trim());
  const lineCount = lines.length;
  
  if (lineCount === 0) {
    errors.push({
      code: 'NO_DATA_LINES',
      message: 'File contains no data lines',
      severity: 'critical',
      suggestion: 'Ensure the CSV file is not empty'
    });
    
    return {
      errors,
      warnings,
      lineCount: 0,
      columnCount: 0,
      hasHeader: false,
      delimiter: ',',
      estimatedRecords: 0
    };
  }
  
  // Detect delimiter
  const delimiter = detectDelimiter(lines[0]);
  
  // Sample first few lines to check structure
  const sampleLines = lines.slice(0, Math.min(SAMPLE_SIZE, lines.length));
  const columnCounts = sampleLines.map(line => countColumns(line, delimiter));
  
  // Check for consistent column count
  const mostCommonColumnCount = mode(columnCounts);
  const inconsistentLines = columnCounts
    .map((count, idx) => ({ count, line: idx + 1 }))
    .filter(({ count }) => count !== mostCommonColumnCount);
  
  if (inconsistentLines.length > 0) {
    // Only warn if more than 10% of sampled lines are inconsistent
    if (inconsistentLines.length / sampleLines.length > 0.1) {
      warnings.push({
        code: 'INCONSISTENT_COLUMNS',
        message: `${inconsistentLines.length} lines have different column counts than expected (${mostCommonColumnCount} columns)`,
        suggestion: 'Some rows may be missing data. The parser will attempt to handle this.'
      });
    }
  }
  
  // Check column count limits
  if (mostCommonColumnCount < MIN_COLUMNS) {
    errors.push({
      code: 'TOO_FEW_COLUMNS',
      message: `File has only ${mostCommonColumnCount} columns. Expected at least ${MIN_COLUMNS}.`,
      severity: 'critical',
      suggestion: 'This may not be a valid Dotloop export. Ensure you selected the correct report format.'
    });
  }
  
  if (mostCommonColumnCount > MAX_COLUMNS) {
    warnings.push({
      code: 'TOO_MANY_COLUMNS',
      message: `File has ${mostCommonColumnCount} columns, which exceeds recommended limit of ${MAX_COLUMNS}`,
      suggestion: 'Large column counts may impact performance. Consider exporting only necessary fields.'
    });
  }
  
  // Detect if first line is header
  const hasHeader = detectHeader(lines[0], lines[1]);
  
  // Estimate record count
  const estimatedRecords = hasHeader ? lineCount - 1 : lineCount;
  
  // Warn if very large dataset
  if (estimatedRecords > 10000) {
    warnings.push({
      code: 'LARGE_DATASET',
      message: `File contains approximately ${estimatedRecords.toLocaleString()} records`,
      suggestion: 'Large datasets may take longer to process. Consider filtering data in Dotloop before exporting.'
    });
  }
  
  // Check for completely empty lines in the original content (before filtering)
  const originalLines = content.split('\n');
  const emptyLineCount = originalLines.filter(line => 
    line.trim() === '' || line.replace(/,/g, '').trim() === ''
  ).length;
  
  if (emptyLineCount > 0 && emptyLineCount < originalLines.length * 0.5) {
    warnings.push({
      code: 'EMPTY_LINES',
      message: `Found ${emptyLineCount} empty lines in the file`,
      suggestion: 'Empty lines will be skipped during parsing'
    });
  }
  
  return {
    errors,
    warnings,
    lineCount,
    columnCount: mostCommonColumnCount,
    hasHeader,
    delimiter,
    estimatedRecords
  };
}

/**
 * Detect delimiter (comma, semicolon, tab, pipe)
 */
function detectDelimiter(line: string): string {
  const delimiters = [',', ';', '\t', '|'];
  const counts = delimiters.map(d => ({
    delimiter: d,
    count: (line.match(new RegExp(`\\${d}`, 'g')) || []).length
  }));
  
  counts.sort((a, b) => b.count - a.count);
  return counts[0].count > 0 ? counts[0].delimiter : ',';
}

/**
 * Count columns in a line (respecting quotes)
 */
function countColumns(line: string, delimiter: string): number {
  let count = 1;
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        i++; // Skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      count++;
    }
  }
  
  return count;
}

/**
 * Detect if first line is a header
 */
function detectHeader(firstLine: string, secondLine?: string): boolean {
  // Heuristic: Headers typically contain text like "Name", "Date", "Price"
  const headerKeywords = [
    'name', 'date', 'price', 'address', 'status', 'agent', 'commission',
    'loop', 'property', 'closing', 'listing', 'created', 'id', 'type', 'age', 'city'
  ];
  
  const firstLineLower = firstLine.toLowerCase();
  const hasHeaderKeyword = headerKeywords.some(keyword => 
    firstLineLower.includes(keyword)
  );
  
  // Simple heuristic: if first line has header keywords, assume it's a header
  // This is permissive but works well for most real-world cases
  return hasHeaderKeyword;
}

/**
 * Detect encoding (simplified)
 */
function detectEncoding(content: string): string {
  // Check for UTF-8 BOM
  if (content.charCodeAt(0) === 0xFEFF) {
    return 'UTF-8 (with BOM)';
  }
  
  // Check for non-ASCII characters
  const hasNonASCII = /[^\x00-\x7F]/.test(content);
  
  if (!hasNonASCII) {
    return 'ASCII';
  }
  
  return 'UTF-8';
}

/**
 * Check if file is valid CSV type
 */
function isValidCSVFile(file: File): boolean {
  const validTypes = [
    'text/csv',
    'text/plain',
    'application/csv',
    'application/vnd.ms-excel'
  ];
  
  const validExtensions = ['.csv', '.txt'];
  
  return validTypes.includes(file.type) || 
         validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
}

/**
 * Read file content as text
 */
function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to read file content'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('FileReader error: ' + reader.error?.message));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Find mode (most common value) in array
 */
function mode(arr: number[]): number {
  const counts = new Map<number, number>();
  
  arr.forEach(val => {
    counts.set(val, (counts.get(val) || 0) + 1);
  });
  
  let maxCount = 0;
  let modeValue = arr[0];
  
  counts.forEach((count, value) => {
    if (count > maxCount) {
      maxCount = count;
      modeValue = value;
    }
  });
  
  return modeValue;
}

/**
 * Create empty metadata object
 */
function createEmptyMetadata(fileName: string, fileSize: number = 0): FileMetadata {
  return {
    fileName,
    fileSize,
    fileSizeFormatted: formatBytes(fileSize),
    encoding: 'Unknown',
    lineCount: 0,
    columnCount: 0,
    hasHeader: false,
    detectedDelimiter: ',',
    estimatedRecords: 0
  };
}
