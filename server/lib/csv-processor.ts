/**
 * CSV Processor with Auto-Correction and Graceful Degradation
 */

import { CSVValidator, IssueType, IssueSeverity } from './csv-validator';

/**
 * Processed CSV result
 */
export interface ProcessedCSVResult {
  rows: Record<string, any>[];
  validRows: number;
  skippedRows: number;
  totalRows: number;
  dataQualityScore: number;
  issues: Array<{
    rowNumber: number;
    type: string;
    field: string;
    message: string;
    suggestion?: string;
  }>;
  suggestions: string[];
  warnings: string[];
}

/**
 * CSV Processor class
 */
export class CSVProcessor {
  private validator: CSVValidator;

  constructor() {
    this.validator = new CSVValidator();
  }

  /**
   * Process CSV file content
   */
  processCSV(csvContent: string): ProcessedCSVResult {
    const issues: Array<any> = [];
    const suggestions: string[] = [];
    const warnings: string[] = [];
    const processedRows: Record<string, any>[] = [];

    try {
      // Parse CSV manually
      const lines = csvContent.split('\n').filter(line => line.trim());

      if (lines.length === 0) {
        return {
          rows: [],
          validRows: 0,
          skippedRows: 0,
          totalRows: 0,
          dataQualityScore: 0,
          issues: [],
          suggestions: ['CSV file is empty'],
          warnings: [],
        };
      }

      // Parse headers
      const headers = this.parseCSVLine(lines[0]);

      // Validate headers
      const { mappedHeaders, issues: headerIssues } = this.validator.validateHeaders(headers);

      issues.push(...headerIssues.map(i => ({
        rowNumber: 0,
        type: i.type,
        field: i.field,
        message: i.message,
        suggestion: i.suggestion,
      })));

      // Process each row
      let validRowCount = 0;
      let skippedRowCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = this.parseCSVLine(line);

        // Create row object with header keys
        const row: Record<string, string> = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx] || '';
        });

        const { isValid, correctedRow, issues: rowIssues } = this.validator.validateRow(row, i);

        issues.push(...rowIssues.map(issue => ({
          rowNumber: i,
          type: issue.type,
          field: issue.field,
          message: issue.message,
          suggestion: issue.suggestion,
        })));

        if (isValid) {
          processedRows.push(correctedRow);
          validRowCount++;
        } else {
          skippedRowCount++;
        }
      }

      // Calculate quality score
      const totalFields = validRowCount * headers.length;
      const filledFields = processedRows.reduce((sum, row) => {
        return sum + Object.values(row).filter(v => v !== null && v !== undefined && v !== '').length;
      }, 0);

      const qualityScore = this.validator.calculateQualityScore(
        lines.length - 1,
        validRowCount,
        totalFields,
        filledFields
      );

      // Generate suggestions
      if (skippedRowCount > 0) {
        suggestions.push(`${skippedRowCount} rows were skipped due to missing required fields. Please review the error log.`);
      }

      const warningCount = issues.filter(i => i.type === IssueType.INVALID_DATE || i.type === IssueType.INVALID_CURRENCY).length;
      if (warningCount > 0) {
        suggestions.push(`${warningCount} fields had formatting issues and were set to empty. Please review the data quality report.`);
      }

      if (qualityScore.completeness < 80) {
        suggestions.push('Your data is missing many optional fields. Consider filling in more details for better analysis.');
      }

      if (qualityScore.validity < 90) {
        suggestions.push('Some data values could not be parsed correctly. Please review the error log for details.');
      }

      // Generate warnings
      if (validRowCount === 0) {
        warnings.push('No valid rows found. Please check your CSV format and required fields.');
      }

      if (skippedRowCount > validRowCount && validRowCount > 0) {
        warnings.push(`More rows were skipped (${skippedRowCount}) than processed (${validRowCount}). Please review your data.`);
      }

      return {
        rows: processedRows,
        validRows: validRowCount,
        skippedRows: skippedRowCount,
        totalRows: lines.length - 1,
        dataQualityScore: qualityScore.overallScore,
        issues,
        suggestions,
        warnings,
      };
    } catch (error) {
      return {
        rows: [],
        validRows: 0,
        skippedRows: 0,
        totalRows: 0,
        dataQualityScore: 0,
        issues: [],
        suggestions: [],
        warnings: [
          `Error processing CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      };
    }
  }

  /**
   * Parse a CSV line handling quoted fields
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Generate diagnostic report
   */
  generateDiagnosticReport(result: ProcessedCSVResult): string {
    const lines: string[] = [];

    lines.push('=== CSV DIAGNOSTIC REPORT ===\n');
    lines.push(`Generated: ${new Date().toLocaleString()}\n`);

    // Summary
    lines.push('--- SUMMARY ---');
    lines.push(`Total Rows: ${result.totalRows}`);
    lines.push(`Valid Rows: ${result.validRows}`);
    lines.push(`Skipped Rows: ${result.skippedRows}`);
    lines.push(`Data Quality Score: ${result.dataQualityScore}%\n`);

    // Issues
    if (result.issues.length > 0) {
      lines.push('--- ISSUES ---');
      const errorIssues = result.issues.filter(i => i.type === IssueType.MISSING_REQUIRED_FIELD);
      const warningIssues = result.issues.filter(i => i.type !== IssueType.MISSING_REQUIRED_FIELD);

      if (errorIssues.length > 0) {
        lines.push('\nERRORS (rows will be skipped):');
        errorIssues.slice(0, 10).forEach(issue => {
          lines.push(`  Row ${issue.rowNumber}: ${issue.field} - ${issue.message}`);
          if (issue.suggestion) lines.push(`    Suggestion: ${issue.suggestion}`);
        });
        if (errorIssues.length > 10) {
          lines.push(`  ... and ${errorIssues.length - 10} more errors`);
        }
      }

      if (warningIssues.length > 0) {
        lines.push('\nWARNINGS (rows will be processed with corrections):');
        warningIssues.slice(0, 10).forEach(issue => {
          lines.push(`  Row ${issue.rowNumber}: ${issue.field} - ${issue.message}`);
          if (issue.suggestion) lines.push(`    Suggestion: ${issue.suggestion}`);
        });
        if (warningIssues.length > 10) {
          lines.push(`  ... and ${warningIssues.length - 10} more warnings`);
        }
      }
    }

    // Suggestions
    if (result.suggestions.length > 0) {
      lines.push('\n--- SUGGESTIONS ---');
      result.suggestions.forEach((suggestion, i) => {
        lines.push(`${i + 1}. ${suggestion}`);
      });
    }

    // Warnings
    if (result.warnings.length > 0) {
      lines.push('\n--- WARNINGS ---');
      result.warnings.forEach((warning, i) => {
        lines.push(`${i + 1}. ${warning}`);
      });
    }

    return lines.join('\n');
  }
}

/**
 * Utility function to create a processor instance
 */
export function createCSVProcessor(): CSVProcessor {
  return new CSVProcessor();
}
