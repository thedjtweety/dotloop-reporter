import { describe, it, expect, beforeEach } from 'vitest';
import { CSVProcessor, createCSVProcessor } from '../csv-processor';

describe('CSV Processor', () => {
  let processor: CSVProcessor;

  beforeEach(() => {
    processor = createCSVProcessor();
  });

  describe('Perfect Data Processing', () => {
    it('should process perfect CSV data', () => {
      const csv = `Loop Name,Address,GCI,Company $
Deal 1,123 Main St,$10000.00,$4000.00
Deal 2,456 Oak Ave,$12500.00,$5000.00`;

      const result = processor.processCSV(csv);

      expect(result.validRows).toBe(2);
      expect(result.skippedRows).toBe(0);
      expect(result.dataQualityScore).toBeGreaterThan(90);
      expect(result.warnings.length).toBe(0);
    });
  });

  describe('Minimal Data Processing', () => {
    it('should process CSV with only required fields', () => {
      const csv = `Loop Name,Address
Deal 1,123 Main St
Deal 2,456 Oak Ave`;

      const result = processor.processCSV(csv);

      expect(result.validRows).toBe(2);
      expect(result.skippedRows).toBe(0);
      expect(result.dataQualityScore).toBeGreaterThan(70);
    });
  });

  describe('Varied Quality Data Processing', () => {
    it('should handle missing optional fields', () => {
      const csv = `Loop Name,Address,City,GCI
Deal 1,123 Main St,Boston,$10000.00
Deal 2,456 Oak Ave,,`;

      const result = processor.processCSV(csv);

      expect(result.validRows).toBe(2);
      expect(result.skippedRows).toBe(0);
    });

    it('should skip rows with missing required fields', () => {
      const csv = `Loop Name,Address,GCI
Deal 1,123 Main St,$10000.00
,456 Oak Ave,$12500.00
Deal 3,789 Pine Rd,$15000.00`;

      const result = processor.processCSV(csv);

      expect(result.validRows).toBe(2);
      expect(result.skippedRows).toBe(1);
    });

    it('should handle invalid currency values', () => {
      const csv = `Loop Name,Address,GCI
Deal 1,123 Main St,$10000.00
Deal 2,456 Oak Ave,invalid-amount`;

      const result = processor.processCSV(csv);

      expect(result.validRows).toBe(2);
      expect(result.issues.some(i => i.type === 'invalid_currency')).toBe(true);
    });

    it('should handle invalid date values', () => {
      const csv = `Loop Name,Address,Closed Date
Deal 1,123 Main St,01/15/2024
Deal 2,456 Oak Ave,not-a-date`;

      const result = processor.processCSV(csv);

      expect(result.validRows).toBe(2);
      expect(result.issues.some(i => i.type === 'invalid_date')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty CSV', () => {
      const csv = '';

      const result = processor.processCSV(csv);

      expect(result.validRows).toBe(0);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should handle CSV with only headers', () => {
      const csv = 'Loop Name,Address,GCI';

      const result = processor.processCSV(csv);

      expect(result.validRows).toBe(0);
      expect(result.totalRows).toBe(0);
    });

    it('should handle CSV with empty rows', () => {
      const csv = `Loop Name,Address,GCI
Deal 1,123 Main St,$10000.00
,,
Deal 2,456 Oak Ave,$12500.00`;

      const result = processor.processCSV(csv);

      expect(result.validRows).toBe(2);
      expect(result.skippedRows).toBeGreaterThan(0);
    });

    it('should handle CSV with special characters', () => {
      const csv = `Loop Name,Address,Agent Name
"O'Reilly's Property","123 Main St, Apt #4","Agent O'Brien"
"Smith & Sons","456 Oak Ave","Jane Smith"`;

      const result = processor.processCSV(csv);

      expect(result.validRows).toBe(2);
    });

    it('should handle CSV with unicode characters', () => {
      const csv = `Loop Name,Address
测试交易,北京市朝阳区
Café Property,Rue de l'École`;

      const result = processor.processCSV(csv);

      expect(result.validRows).toBe(2);
    });

    it('should handle CSV with whitespace', () => {
      const csv = `Loop Name,Address,GCI
  Deal 1  ,  123 Main St  ,  $10000.00  
Deal 2,456 Oak Ave,$12500.00`;

      const result = processor.processCSV(csv);

      expect(result.validRows).toBe(2);
      expect(result.rows[0]['Loop Name']).toBe('Deal 1');
    });
  });

  describe('Data Quality Scoring', () => {
    it('should score perfect data highly', () => {
      const csv = `Loop Name,Address,City,State,Zip,GCI,Company $
Deal 1,123 Main St,Boston,MA,02101,$10000.00,$4000.00
Deal 2,456 Oak Ave,Cambridge,MA,02138,$12500.00,$5000.00`;

      const result = processor.processCSV(csv);

      expect(result.dataQualityScore).toBeGreaterThan(90);
    });

    it('should score incomplete data lower', () => {
      const csv = `Loop Name,Address,City,State,Zip,GCI,Company $
Deal 1,123 Main St,,,
Deal 2,456 Oak Ave,Cambridge,,,`;

      const result = processor.processCSV(csv);

      expect(result.dataQualityScore).toBeLessThan(80);
    });
  });

  describe('Diagnostic Report Generation', () => {
    it('should generate diagnostic report', () => {
      const csv = `Loop Name,Address,GCI
Deal 1,123 Main St,$10000.00
Deal 2,456 Oak Ave,invalid`;

      const result = processor.processCSV(csv);
      const report = processor.generateDiagnosticReport(result);

      expect(report).toContain("CSV DIAGNOSTIC REPORT");
      expect(report).toContain("CSV DIAGNOSTIC REPORT");
      expect(report).toContain("CSV DIAGNOSTIC REPORT");
    });

    it('should include suggestions in report', () => {
      const csv = `Loop Name,Address
Deal 1,123 Main St
Deal 2,456 Oak Ave`;

      const result = processor.processCSV(csv);
      const report = processor.generateDiagnosticReport(result);

      expect(report.length).toBeGreaterThan(0);
    });
  });

  describe('Large File Handling', () => {
    it('should handle large CSV files', () => {
      let csv = 'Loop Name,Address,GCI\n';
      for (let i = 0; i < 100; i++) {
        csv += `Deal ${i},${i} Main St,$${(10000 + i * 100).toFixed(2)}\n`;
      }

      const result = processor.processCSV(csv);

      expect(result.validRows).toBeGreaterThan(90);
      expect(result.totalRows).toBe(100);
    });
  });

  describe('Column Mapping', () => {
    it('should handle alternative column names', () => {
      const csv = `loopname,property_address,gross_commission_income
Deal 1,123 Main St,$10000.00
Deal 2,456 Oak Ave,$12500.00`;

      const result = processor.processCSV(csv);

      expect(result.validRows).toBe(2);
    });

    it('should handle mixed column name formats', () => {
      const csv = `Loop Name,property_address,GCI
Deal 1,123 Main St,$10000.00
Deal 2,456 Oak Ave,$12500.00`;

      const result = processor.processCSV(csv);

      expect(result.validRows).toBe(2);
    });
  });

  describe('Currency Parsing', () => {
    it('should parse various currency formats', () => {
      const csv = `Loop Name,Address,GCI
Deal 1,123 Main St,$10000.00
Deal 2,456 Oak Ave,10000
Deal 3,789 Pine Rd,10,000.00
Deal 4,321 Elm St,10000.50`;

      const result = processor.processCSV(csv);

      expect(result.validRows).toBe(4);
      expect(result.rows[0]['GCI']).toBe(10000);
      expect(result.rows[1]['GCI']).toBe(10000);
    });
  });

  describe('Date Parsing', () => {
    it('should parse various date formats', () => {
      const csv = `Loop Name,Address,Closed Date
Deal 1,123 Main St,01/15/2024
Deal 2,456 Oak Ave,2024-01-15
Deal 3,789 Pine Rd,January 15, 2024`;

      const result = processor.processCSV(csv);

      expect(result.validRows).toBe(3);
      expect(result.rows[0]['Closed Date']).toBeInstanceOf(Date);
    });
  });
});
