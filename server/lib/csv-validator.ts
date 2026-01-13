/**
 * CSV Validator and Data Quality Scoring System
 * 
 * Handles validation of Dotloop CSV exports with lenient processing,
 * auto-correction, and detailed diagnostics for varied data quality.
 */

import { z } from 'zod';

/**
 * Data quality issue types
 */
export enum IssueType {
  MISSING_REQUIRED_FIELD = 'missing_required_field',
  INVALID_FORMAT = 'invalid_format',
  INVALID_DATE = 'invalid_date',
  INVALID_CURRENCY = 'invalid_currency',
  INVALID_NUMBER = 'invalid_number',
  ENCODING_ERROR = 'encoding_error',
  MALFORMED_ROW = 'malformed_row',
  EMPTY_ROW = 'empty_row',
  DUPLICATE_HEADER = 'duplicate_header',
  MISSING_OPTIONAL_FIELD = 'missing_optional_field',
  DATA_TYPE_MISMATCH = 'data_type_mismatch',
}

/**
 * Issue severity levels
 */
export enum IssueSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * Represents a validation issue
 */
export interface ValidationIssue {
  type: IssueType;
  severity: IssueSeverity;
  field: string;
  rowNumber: number;
  message: string;
  value?: string;
  suggestion?: string;
}

/**
 * Dotloop CSV field definition
 */
export interface FieldDefinition {
  name: string;
  required: boolean;
  type: 'string' | 'number' | 'date' | 'currency' | 'boolean';
  aliases?: string[];
  validator?: (value: string) => boolean;
  parser?: (value: string) => any;
}

/**
 * Data quality score breakdown
 */
export interface DataQualityScore {
  overallScore: number;
  completeness: number;
  validity: number;
  consistency: number;
  issues: ValidationIssue[];
  issueCount: {
    errors: number;
    warnings: number;
    info: number;
  };
}

/**
 * Dotloop CSV schema definition
 */
const DOTLOOP_SCHEMA: FieldDefinition[] = [
  {
    name: 'Loop Name',
    required: true,
    type: 'string',
    aliases: ['loopname', 'loop_name', 'deal_name'],
  },
  {
    name: 'Address',
    required: true,
    type: 'string',
    aliases: ['property_address', 'street_address'],
  },
  {
    name: 'City',
    required: false,
    type: 'string',
    aliases: ['city_name'],
  },
  {
    name: 'State',
    required: false,
    type: 'string',
    aliases: ['state_code', 'province'],
  },
  {
    name: 'Zip',
    required: false,
    type: 'string',
    aliases: ['zip_code', 'postal_code'],
  },
  {
    name: 'GCI',
    required: false,
    type: 'currency',
    aliases: ['gross_commission_income', 'commission'],
  },
  {
    name: 'Company $',
    required: false,
    type: 'currency',
    aliases: ['company_dollar', 'company_commission'],
  },
  {
    name: 'Agent Name',
    required: false,
    type: 'string',
    aliases: ['agent', 'agent_name'],
  },
  {
    name: 'Status',
    required: false,
    type: 'string',
    aliases: ['deal_status', 'transaction_status'],
  },
  {
    name: 'Closed Date',
    required: false,
    type: 'date',
    aliases: ['close_date', 'closing_date', 'date_closed'],
  },
  {
    name: 'Created By',
    required: false,
    type: 'string',
    aliases: ['created_by', 'creator'],
  },
];

/**
 * CSV Validator class
 */
export class CSVValidator {
  private schema: FieldDefinition[];
  private issues: ValidationIssue[] = [];
  private rowCount = 0;
  private validRowCount = 0;
  private skippedRowCount = 0;

  constructor(schema: FieldDefinition[] = DOTLOOP_SCHEMA) {
    this.schema = schema;
  }

  /**
   * Find field definition by column name (with fuzzy matching)
   */
  private findFieldDefinition(columnName: string): FieldDefinition | undefined {
    const normalized = columnName.toLowerCase().trim();

    const exactMatch = this.schema.find(
      f => f.name.toLowerCase() === normalized
    );
    if (exactMatch) return exactMatch;

    for (const field of this.schema) {
      if (field.aliases?.some(alias => alias.toLowerCase() === normalized)) {
        return field;
      }
    }

    return this.schema.find(
      f => normalized.includes(f.name.toLowerCase()) ||
           f.name.toLowerCase().includes(normalized)
    );
  }

  /**
   * Validate and parse a date value
   */
  private parseDate(value: string): Date | null {
    if (!value || !value.trim()) return null;

    const trimmed = value.trim();

    const formats = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
      /^(\w+)\s+(\d{1,2}),?\s+(\d{4})$/,
    ];

    for (const format of formats) {
      const match = trimmed.match(format);
      if (match) {
        try {
          const date = new Date(trimmed);
          if (!isNaN(date.getTime())) {
            return date;
          }
        } catch (e) {
          // Continue
        }
      }
    }

    return null;
  }

  /**
   * Validate and parse a currency value
   */
  private parseCurrency(value: string): number | null {
    if (!value || !value.trim()) return null;

    const cleaned = value
      .trim()
      .replace(/[$€£¥]/g, '')
      .replace(/\s/g, '')
      .replace(/,/g, '');

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Validate and parse a number value
   */
  private parseNumber(value: string): number | null {
    if (!value || !value.trim()) return null;

    const cleaned = value.trim().replace(/,/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Validate a single row
   */
  validateRow(
    row: Record<string, string>,
    rowNumber: number
  ): {
    isValid: boolean;
    correctedRow: Record<string, any>;
    issues: ValidationIssue[];
  } {
    const correctedRow: Record<string, any> = {};
    const rowIssues: ValidationIssue[] = [];
    let hasRequiredFields = true;

    const nonEmptyFields = Object.values(row).filter(v => v && v.trim());
    if (nonEmptyFields.length === 0) {
      rowIssues.push({
        type: IssueType.EMPTY_ROW,
        severity: IssueSeverity.ERROR,
        field: 'row',
        rowNumber,
        message: 'Row is completely empty',
      });
      return { isValid: false, correctedRow: {}, issues: rowIssues };
    }

    // Check all required fields exist and have values
    for (const fieldDef of this.schema) {
      if (fieldDef.required) {
        let found = false;

        for (const [colName, colValue] of Object.entries(row)) {
          const fieldMatch = this.findFieldDefinition(colName);
          if (fieldMatch?.name === fieldDef.name && colValue?.trim()) {
            found = true;
            break;
          }
        }

        if (!found) {
          rowIssues.push({
            type: IssueType.MISSING_REQUIRED_FIELD,
            severity: IssueSeverity.ERROR,
            field: fieldDef.name,
            rowNumber,
            message: `Required field "${fieldDef.name}" is missing`,
            suggestion: `Please provide a value for ${fieldDef.name}`,
          });
          hasRequiredFields = false;
        }
      }
    }

    // Validate each field in the row
    for (const [columnName, value] of Object.entries(row)) {
      const fieldDef = this.findFieldDefinition(columnName);

      if (!fieldDef) {
        continue;
      }

      const normalizedValue = value?.trim() || '';

      if (!normalizedValue) {
        correctedRow[fieldDef.name] = null;
        continue;
      }

      try {
        switch (fieldDef.type) {
          case 'date': {
            const parsed = this.parseDate(normalizedValue);
            if (parsed) {
              correctedRow[fieldDef.name] = parsed;
            } else {
              rowIssues.push({
                type: IssueType.INVALID_DATE,
                severity: IssueSeverity.WARNING,
                field: fieldDef.name,
                rowNumber,
                message: `Invalid date format: "${normalizedValue}"`,
                value: normalizedValue,
                suggestion: 'Use format: MM/DD/YYYY or YYYY-MM-DD',
              });
              correctedRow[fieldDef.name] = null;
            }
            break;
          }

          case 'currency': {
            const parsed = this.parseCurrency(normalizedValue);
            if (parsed !== null) {
              correctedRow[fieldDef.name] = parsed;
            } else {
              rowIssues.push({
                type: IssueType.INVALID_CURRENCY,
                severity: IssueSeverity.WARNING,
                field: fieldDef.name,
                rowNumber,
                message: `Invalid currency value: "${normalizedValue}"`,
                value: normalizedValue,
                suggestion: 'Use format: $1,234.56 or 1234.56',
              });
              correctedRow[fieldDef.name] = null;
            }
            break;
          }

          case 'number': {
            const parsed = this.parseNumber(normalizedValue);
            if (parsed !== null) {
              correctedRow[fieldDef.name] = parsed;
            } else {
              rowIssues.push({
                type: IssueType.INVALID_NUMBER,
                severity: IssueSeverity.WARNING,
                field: fieldDef.name,
                rowNumber,
                message: `Invalid number: "${normalizedValue}"`,
                value: normalizedValue,
              });
              correctedRow[fieldDef.name] = null;
            }
            break;
          }

          case 'string':
          default: {
            correctedRow[fieldDef.name] = normalizedValue;
            break;
          }
        }
      } catch (error) {
        rowIssues.push({
          type: IssueType.DATA_TYPE_MISMATCH,
          severity: IssueSeverity.WARNING,
          field: fieldDef.name,
          rowNumber,
          message: `Error parsing field "${fieldDef.name}": ${error instanceof Error ? error.message : 'Unknown error'}`,
          value: normalizedValue,
        });
        correctedRow[fieldDef.name] = null;
      }
    }

    this.issues.push(...rowIssues);

    const isValid = hasRequiredFields && rowIssues.every(i => i.severity !== IssueSeverity.ERROR);

    if (isValid) {
      this.validRowCount++;
    } else {
      this.skippedRowCount++;
    }

    return { isValid, correctedRow, issues: rowIssues };
  }

  /**
   * Validate headers
   */
  validateHeaders(headers: string[]): {
    mappedHeaders: Record<string, string>;
    issues: ValidationIssue[];
  } {
    const mappedHeaders: Record<string, string> = {};
    const headerIssues: ValidationIssue[] = [];
    const seenHeaders = new Set<string>();

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].trim();

      if (seenHeaders.has(header.toLowerCase())) {
        headerIssues.push({
          type: IssueType.DUPLICATE_HEADER,
          severity: IssueSeverity.WARNING,
          field: header,
          rowNumber: 0,
          message: `Duplicate column header: "${header}"`,
          suggestion: 'Remove or rename duplicate columns',
        });
        continue;
      }
      seenHeaders.add(header.toLowerCase());

      const fieldDef = this.findFieldDefinition(header);
      if (fieldDef) {
        mappedHeaders[header] = fieldDef.name;
      } else {
        headerIssues.push({
          type: IssueType.INVALID_FORMAT,
          severity: IssueSeverity.INFO,
          field: header,
          rowNumber: 0,
          message: `Unknown column: "${header}" - will be ignored`,
        });
      }
    }

    this.issues.push(...headerIssues);
    return { mappedHeaders, issues: headerIssues };
  }

  /**
   * Calculate data quality score
   */
  calculateQualityScore(
    totalRows: number,
    validRows: number,
    totalFields: number,
    filledFields: number
  ): DataQualityScore {
    const completeness = totalFields > 0 ? (filledFields / totalFields) * 100 : 0;
    const validity = totalRows > 0 ? (validRows / totalRows) * 100 : 0;
    const consistency = 100 - Math.min(50, (this.issues.filter(i => i.severity === IssueSeverity.WARNING).length / Math.max(1, totalRows)) * 100);

    const overallScore = (completeness * 0.4 + validity * 0.4 + consistency * 0.2);

    const issueCount = {
      errors: this.issues.filter(i => i.severity === IssueSeverity.ERROR).length,
      warnings: this.issues.filter(i => i.severity === IssueSeverity.WARNING).length,
      info: this.issues.filter(i => i.severity === IssueSeverity.INFO).length,
    };

    return {
      overallScore: Math.round(overallScore),
      completeness: Math.round(completeness),
      validity: Math.round(validity),
      consistency: Math.round(consistency),
      issues: this.issues,
      issueCount,
    };
  }

  /**
   * Reset validator state
   */
  reset(): void {
    this.issues = [];
    this.rowCount = 0;
    this.validRowCount = 0;
    this.skippedRowCount = 0;
  }

  /**
   * Get validation summary
   */
  getSummary() {
    return {
      totalRows: this.rowCount,
      validRows: this.validRowCount,
      skippedRows: this.skippedRowCount,
      totalIssues: this.issues.length,
      issues: this.issues,
    };
  }
}

/**
 * Utility function to create a validator instance
 */
export function createCSVValidator(schema?: FieldDefinition[]): CSVValidator {
  return new CSVValidator(schema);
}
