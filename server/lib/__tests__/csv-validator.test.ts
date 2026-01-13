import { describe, it, expect, beforeEach } from 'vitest';
import {
  CSVValidator,
  IssueType,
  IssueSeverity,
  createCSVValidator,
} from '../csv-validator';

describe('CSV Validator', () => {
  let validator: CSVValidator;

  beforeEach(() => {
    validator = createCSVValidator();
  });

  describe('Header Validation', () => {
    it('should map exact header matches', () => {
      const headers = ['Loop Name', 'Address', 'GCI', 'Agent Name'];
      const { mappedHeaders } = validator.validateHeaders(headers);

      expect(mappedHeaders['Loop Name']).toBe('Loop Name');
      expect(mappedHeaders['Address']).toBe('Address');
      expect(mappedHeaders['GCI']).toBe('GCI');
      expect(mappedHeaders['Agent Name']).toBe('Agent Name');
    });

    it('should map alias headers', () => {
      const headers = ['loopname', 'street_address', 'agent'];
      const { mappedHeaders } = validator.validateHeaders(headers);

      expect(mappedHeaders['loopname']).toBe('Loop Name');
      expect(mappedHeaders['street_address']).toBe('Address');
      expect(mappedHeaders['agent']).toBe('Agent Name');
    });

    it('should detect duplicate headers', () => {
      const headers = ['Loop Name', 'Address', 'Loop Name'];
      const { issues } = validator.validateHeaders(headers);

      const duplicateIssue = issues.find(i => i.type === IssueType.DUPLICATE_HEADER);
      expect(duplicateIssue).toBeDefined();
      expect(duplicateIssue?.severity).toBe(IssueSeverity.WARNING);
    });

    it('should handle unknown columns', () => {
      const headers = ['Loop Name', 'Unknown Column', 'Address'];
      const { issues } = validator.validateHeaders(headers);

      const unknownIssue = issues.find(i => i.field === 'Unknown Column');
      expect(unknownIssue).toBeDefined();
      expect(unknownIssue?.severity).toBe(IssueSeverity.INFO);
    });

    it('should be case-insensitive', () => {
      const headers = ['LOOP NAME', 'address', 'GCI'];
      const { mappedHeaders } = validator.validateHeaders(headers);

      expect(mappedHeaders['LOOP NAME']).toBe('Loop Name');
      expect(mappedHeaders['address']).toBe('Address');
    });
  });

  describe('Row Validation - Required Fields', () => {
    it('should accept rows with all required fields', () => {
      const row = {
        'Loop Name': 'Test Deal',
        'Address': '123 Main St',
      };
      const { isValid } = validator.validateRow(row, 1);

      expect(isValid).toBe(true);
    });

    it('should reject rows missing required fields', () => {
      const row = {
        'Address': '123 Main St',
        // Missing Loop Name
      };
      const { isValid, issues } = validator.validateRow(row, 1);

      expect(isValid).toBe(false);
      expect(issues.some(i => i.type === IssueType.MISSING_REQUIRED_FIELD)).toBe(true);
    });

    it('should reject rows with empty required fields', () => {
      const row = {
        'Loop Name': '   ',  // Just whitespace
        'Address': '123 Main St',
      };
      const { isValid, issues } = validator.validateRow(row, 1);

      expect(isValid).toBe(false);
      expect(issues.some(i => i.type === IssueType.MISSING_REQUIRED_FIELD)).toBe(true);
    });

    it('should detect completely empty rows', () => {
      const row = {
        'Loop Name': '',
        'Address': '',
      };
      const { isValid, issues } = validator.validateRow(row, 1);

      expect(isValid).toBe(false);
      expect(issues.some(i => i.type === IssueType.EMPTY_ROW)).toBe(true);
    });
  });

  describe('Row Validation - Date Parsing', () => {
    it('should parse MM/DD/YYYY dates', () => {
      const row = {
        'Loop Name': 'Test',
        'Address': '123 Main St',
        'Closed Date': '01/15/2024',
      };
      const { correctedRow } = validator.validateRow(row, 1);

      expect(correctedRow['Closed Date']).toBeInstanceOf(Date);
    });

    it('should parse YYYY-MM-DD dates', () => {
      const row = {
        'Loop Name': 'Test',
        'Address': '123 Main St',
        'Closed Date': '2024-01-15',
      };
      const { correctedRow } = validator.validateRow(row, 1);

      expect(correctedRow['Closed Date']).toBeInstanceOf(Date);
    });

    it('should handle invalid dates gracefully', () => {
      const row = {
        'Loop Name': 'Test',
        'Address': '123 Main St',
        'Closed Date': 'not-a-date',
      };
      const { correctedRow, issues } = validator.validateRow(row, 1);

      expect(correctedRow['Closed Date']).toBeNull();
      expect(issues.some(i => i.type === IssueType.INVALID_DATE)).toBe(true);
    });

    it('should handle empty date fields', () => {
      const row = {
        'Loop Name': 'Test',
        'Address': '123 Main St',
        'Closed Date': '',
      };
      const { correctedRow } = validator.validateRow(row, 1);

      expect(correctedRow['Closed Date']).toBeNull();
    });
  });

  describe('Row Validation - Currency Parsing', () => {
    it('should parse currency with dollar sign', () => {
      const row = {
        'Loop Name': 'Test',
        'Address': '123 Main St',
        'GCI': '$1,234.56',
      };
      const { correctedRow } = validator.validateRow(row, 1);

      expect(correctedRow['GCI']).toBe(1234.56);
    });

    it('should parse currency without dollar sign', () => {
      const row = {
        'Loop Name': 'Test',
        'Address': '123 Main St',
        'GCI': '1234.56',
      };
      const { correctedRow } = validator.validateRow(row, 1);

      expect(correctedRow['GCI']).toBe(1234.56);
    });

    it('should parse currency with commas', () => {
      const row = {
        'Loop Name': 'Test',
        'Address': '123 Main St',
        'GCI': '10,000.00',
      };
      const { correctedRow } = validator.validateRow(row, 1);

      expect(correctedRow['GCI']).toBe(10000);
    });

    it('should handle invalid currency gracefully', () => {
      const row = {
        'Loop Name': 'Test',
        'Address': '123 Main St',
        'GCI': 'not-a-number',
      };
      const { correctedRow, issues } = validator.validateRow(row, 1);

      expect(correctedRow['GCI']).toBeNull();
      expect(issues.some(i => i.type === IssueType.INVALID_CURRENCY)).toBe(true);
    });

    it('should handle empty currency fields', () => {
      const row = {
        'Loop Name': 'Test',
        'Address': '123 Main St',
        'GCI': '',
      };
      const { correctedRow } = validator.validateRow(row, 1);

      expect(correctedRow['GCI']).toBeNull();
    });
  });

  describe('Row Validation - String Fields', () => {
    it('should trim whitespace from strings', () => {
      const row = {
        'Loop Name': '  Test Deal  ',
        'Address': '  123 Main St  ',
      };
      const { correctedRow } = validator.validateRow(row, 1);

      expect(correctedRow['Loop Name']).toBe('Test Deal');
      expect(correctedRow['Address']).toBe('123 Main St');
    });

    it('should handle special characters in strings', () => {
      const row = {
        'Loop Name': "O'Reilly's Property",
        'Address': '123 Main St, Apt #4',
      };
      const { correctedRow } = validator.validateRow(row, 1);

      expect(correctedRow['Loop Name']).toBe("O'Reilly's Property");
      expect(correctedRow['Address']).toBe('123 Main St, Apt #4');
    });
  });

  describe('Data Quality Scoring', () => {
    it('should calculate completeness score', () => {
      const score = validator.calculateQualityScore(
        10,  // totalRows
        10,  // validRows
        20,  // totalFields
        18   // filledFields
      );

      expect(score.completeness).toBe(90);
    });

    it('should calculate validity score', () => {
      const score = validator.calculateQualityScore(
        10,  // totalRows
        8,   // validRows
        20,  // totalFields
        20   // filledFields
      );

      expect(score.validity).toBe(80);
    });

    it('should calculate overall score', () => {
      const score = validator.calculateQualityScore(
        10,  // totalRows
        10,  // validRows
        20,  // totalFields
        20   // filledFields
      );

      expect(score.overallScore).toBeGreaterThan(90);
    });

    it('should count issues by severity', () => {
      validator.validateRow({
        'Address': '123 Main St',
        // Missing Loop Name (error)
      }, 1);

      validator.validateRow({
        'Loop Name': 'Test',
        'Address': '123 Main St',
        'GCI': 'invalid',  // Warning
      }, 2);

      const score = validator.calculateQualityScore(2, 1, 4, 3);

      expect(score.issueCount.errors).toBeGreaterThan(0);
      expect(score.issueCount.warnings).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rows with extra unknown columns', () => {
      const row = {
        'Loop Name': 'Test',
        'Address': '123 Main St',
        'Unknown Column 1': 'value1',
        'Unknown Column 2': 'value2',
      };
      const { isValid } = validator.validateRow(row, 1);

      expect(isValid).toBe(true);
    });

    it('should handle rows with all optional fields empty', () => {
      const row = {
        'Loop Name': 'Test',
        'Address': '123 Main St',
        'GCI': '',
        'Agent Name': '',
        'Closed Date': '',
      };
      const { isValid } = validator.validateRow(row, 1);

      expect(isValid).toBe(true);
    });

    it('should handle very long strings', () => {
      const longString = 'A'.repeat(1000);
      const row = {
        'Loop Name': longString,
        'Address': '123 Main St',
      };
      const { correctedRow } = validator.validateRow(row, 1);

      expect(correctedRow['Loop Name']).toBe(longString);
    });

    it('should handle unicode characters', () => {
      const row = {
        'Loop Name': '测试交易',
        'Address': 'Rue de l\'École',
      };
      const { correctedRow } = validator.validateRow(row, 1);

      expect(correctedRow['Loop Name']).toBe('测试交易');
      expect(correctedRow['Address']).toBe("Rue de l'École");
    });

    it('should reset state correctly', () => {
      validator.validateRow({
        'Loop Name': 'Test',
        'Address': '123 Main St',
      }, 1);

      validator.reset();
      const summary = validator.getSummary();

      expect(summary.totalRows).toBe(0);
      expect(summary.validRows).toBe(0);
      expect(summary.totalIssues).toBe(0);
    });
  });

  describe('Fuzzy Matching', () => {
    it('should match similar column names', () => {
      const headers = ['loop_name', 'street_address', 'gross_commission_income'];
      const { mappedHeaders } = validator.validateHeaders(headers);

      expect(mappedHeaders['loop_name']).toBe('Loop Name');
      expect(mappedHeaders['street_address']).toBe('Address');
      expect(mappedHeaders['gross_commission_income']).toBe('GCI');
    });

    it('should handle case-insensitive fuzzy matching', () => {
      const headers = ['LOOP NAME', 'ADDRESS', 'GCI'];
      const { mappedHeaders } = validator.validateHeaders(headers);

      expect(Object.keys(mappedHeaders).length).toBeGreaterThan(0);
    });
  });

  describe('Batch Processing', () => {
    it('should track multiple rows correctly', () => {
      const rows = [
        { 'Loop Name': 'Deal 1', 'Address': '123 Main St' },
        { 'Loop Name': 'Deal 2', 'Address': '456 Oak Ave' },
        { 'Address': '789 Pine Rd' },
      ];

      let validCount = 0;
      let invalidCount = 0;
      for (let i = 0; i < rows.length; i++) {
        const { isValid } = validator.validateRow(rows[i], i + 1);
        if (isValid) validCount++;
        else invalidCount++;
      }

      expect(validCount).toBe(2);
      expect(invalidCount).toBe(1);
    });
  });
});
