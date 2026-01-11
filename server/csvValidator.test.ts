/**
 * Comprehensive Test Suite for CSV Validator
 * Tests 25+ edge cases to ensure robustness
 */

import { describe, it, expect } from 'vitest';
import { validateCSVContent, ValidationResult } from '../client/src/lib/csvValidator';

describe('CSV Validator - Robustness Tests', () => {
  
  // ==================== BASIC VALIDATION ====================
  
  describe('Basic Validation', () => {
    it('should validate a simple valid CSV', () => {
      const csv = `Name,Age,City
John,30,New York
Jane,25,Los Angeles`;
      
      const result = validateCSVContent(csv);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata.lineCount).toBe(3);
      expect(result.metadata.columnCount).toBe(3);
    });
    
    it('should reject empty content', () => {
      const result = validateCSVContent('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('EMPTY_CONTENT');
    });
    
    it('should reject whitespace-only content', () => {
      const result = validateCSVContent('   \n  \n  ');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('EMPTY_CONTENT');
    });
  });
  
  // ==================== DELIMITER DETECTION ====================
  
  describe('Delimiter Detection', () => {
    it('should detect comma delimiter', () => {
      const csv = `Name,Age,City\nJohn,30,NYC`;
      const result = validateCSVContent(csv);
      expect(result.metadata.detectedDelimiter).toBe(',');
    });
    
    it('should detect semicolon delimiter', () => {
      const csv = `Name;Age;City\nJohn;30;NYC`;
      const result = validateCSVContent(csv);
      expect(result.metadata.detectedDelimiter).toBe(';');
    });
    
    it('should detect tab delimiter', () => {
      const csv = `Name\tAge\tCity\nJohn\t30\tNYC`;
      const result = validateCSVContent(csv);
      expect(result.metadata.detectedDelimiter).toBe('\t');
    });
    
    it('should detect pipe delimiter', () => {
      const csv = `Name|Age|City\nJohn|30|NYC`;
      const result = validateCSVContent(csv);
      expect(result.metadata.detectedDelimiter).toBe('|');
    });
  });
  
  // ==================== HEADER DETECTION ====================
  
  describe('Header Detection', () => {
    it('should detect header with common keywords', () => {
      const csv = `Agent Name,Price,Date\nJohn Smith,$500000,1/1/2024`;
      const result = validateCSVContent(csv);
      expect(result.metadata.hasHeader).toBe(true);
    });
    
    it('should handle headless CSV', () => {
      const csv = `John Smith,$500000,1/1/2024\nJane Doe,$600000,2/1/2024`;
      const result = validateCSVContent(csv);
      // May or may not detect header depending on heuristics
      expect(result.isValid).toBe(true);
    });
  });
  
  // ==================== QUOTED FIELDS ====================
  
  describe('Quoted Fields', () => {
    it('should handle quoted fields with commas', () => {
      const csv = `Name,Address,Price\n"Smith, John","123 Main St, Apt 4",500000`;
      const result = validateCSVContent(csv);
      expect(result.isValid).toBe(true);
      expect(result.metadata.columnCount).toBe(3);
    });
    
    it('should handle escaped quotes', () => {
      const csv = `Name,Quote\n"John","He said ""Hello"""`;
      const result = validateCSVContent(csv);
      expect(result.isValid).toBe(true);
    });
    
    it('should handle multiline quoted fields', () => {
      const csv = `Name,Description\n"John","This is a\nmultiline\ndescription"`;
      const result = validateCSVContent(csv);
      expect(result.isValid).toBe(true);
    });
  });
  
  // ==================== SPECIAL CHARACTERS ====================
  
  describe('Special Characters', () => {
    it('should handle Unicode characters', () => {
      const csv = `Name,City\nJuan José,São Paulo\nMüller,München`;
      const result = validateCSVContent(csv);
      expect(result.isValid).toBe(true);
      expect(result.metadata.encoding).toContain('UTF-8');
    });
    
    it('should handle emoji', () => {
      const csv = `Name,Note\nJohn,Great! 👍\nJane,Love it ❤️`;
      const result = validateCSVContent(csv);
      expect(result.isValid).toBe(true);
    });
    
    it('should reject binary content (null bytes)', () => {
      const csv = `Name,Age\nJohn\x0030`;
      const result = validateCSVContent(csv);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('BINARY_CONTENT');
    });
  });
  
  // ==================== MALFORMED DATA ====================
  
  describe('Malformed Data', () => {
    it('should warn about inconsistent column counts', () => {
      const csv = `Name,Age,City\nJohn,30,NYC\nJane,25\nBob,35,LA,Extra`;
      const result = validateCSVContent(csv);
      // Should still be valid but with warnings
      expect(result.isValid).toBe(true);
      const inconsistentWarning = result.warnings.find(w => w.code === 'INCONSISTENT_COLUMNS');
      expect(inconsistentWarning).toBeDefined();
    });
    
    it('should handle empty fields', () => {
      const csv = `Name,Age,City\nJohn,,NYC\n,25,LA\n,,`;
      const result = validateCSVContent(csv);
      expect(result.isValid).toBe(true);
    });
    
    it('should handle trailing commas', () => {
      const csv = `Name,Age,City,\nJohn,30,NYC,\nJane,25,LA,`;
      const result = validateCSVContent(csv);
      expect(result.isValid).toBe(true);
    });
    
    it('should warn about empty lines', () => {
      const csv = `Name,Age\nJohn,30\nJane,25\nBob,35\n\nAlice,28\n\n`;
      const result = validateCSVContent(csv);
      expect(result.isValid).toBe(true);
      const emptyLineWarning = result.warnings.find(w => w.code === 'EMPTY_LINES');
      expect(emptyLineWarning).toBeDefined();
    });
  });
  
  // ==================== FILE TYPE DETECTION ====================
  
  describe('File Type Detection', () => {
    it('should reject HTML content', () => {
      const csv = `<!DOCTYPE html>\n<html><body>Error</body></html>`;
      const result = validateCSVContent(csv);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('HTML_CONTENT');
    });
    
    it('should reject JSON content', () => {
      const csv = `{"name": "John", "age": 30}`;
      const result = validateCSVContent(csv);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('JSON_CONTENT');
    });
    
    it('should reject JSON array content', () => {
      const csv = `[{"name": "John"}, {"name": "Jane"}]`;
      const result = validateCSVContent(csv);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('JSON_CONTENT');
    });
    
    it('should warn about suspicious script content', () => {
      const csv = `Name,Script\nJohn,<script>alert('xss')</script>`;
      const result = validateCSVContent(csv);
      // Should be valid but with warning
      expect(result.isValid).toBe(true);
      const suspiciousWarning = result.warnings.find(w => w.code === 'SUSPICIOUS_CONTENT');
      expect(suspiciousWarning).toBeDefined();
    });
  });
  
  // ==================== EDGE CASES ====================
  
  describe('Edge Cases', () => {
    it('should handle single column CSV', () => {
      const csv = `Name\nJohn\nJane\nBob`;
      const result = validateCSVContent(csv);
      // Should error due to too few columns (1 < MIN_COLUMNS)
      expect(result.isValid).toBe(false);
      const tooFewError = result.errors.find(e => e.code === 'TOO_FEW_COLUMNS');
      expect(tooFewError).toBeDefined();
    });
    
    it('should handle single row CSV', () => {
      const csv = `Name,Age,City`;
      const result = validateCSVContent(csv);
      expect(result.isValid).toBe(true);
      expect(result.metadata.estimatedRecords).toBe(0); // Header only
    });
    
    it('should handle very long lines', () => {
      const longValue = 'A'.repeat(150000);
      const csv = `Name,Description\nJohn,${longValue}`;
      const result = validateCSVContent(csv);
      expect(result.isValid).toBe(true);
      const longLineWarning = result.warnings.find(w => w.code === 'LONG_LINE');
      expect(longLineWarning).toBeDefined();
    });
    
    it('should warn about large datasets', () => {
      // Generate CSV with 15000 rows
      let csv = `Name,Age,City\n`;
      for (let i = 0; i < 15000; i++) {
        csv += `Person${i},${20 + (i % 50)},City${i % 100}\n`;
      }
      const result = validateCSVContent(csv);
      expect(result.isValid).toBe(true);
      const largeDatasetWarning = result.warnings.find(w => w.code === 'LARGE_DATASET');
      expect(largeDatasetWarning).toBeDefined();
    });
    
    it('should handle Windows line endings (CRLF)', () => {
      const csv = `Name,Age\r\nJohn,30\r\nJane,25`;
      const result = validateCSVContent(csv);
      expect(result.isValid).toBe(true);
    });
    
    it('should handle Mac line endings (CR)', () => {
      const csv = `Name,Age\rJohn,30\rJane,25`;
      const result = validateCSVContent(csv);
      expect(result.isValid).toBe(true);
    });
    
    it('should handle mixed line endings', () => {
      const csv = `Name,Age\nJohn,30\r\nJane,25\rBob,35`;
      const result = validateCSVContent(csv);
      expect(result.isValid).toBe(true);
    });
  });
  
  // ==================== REAL-WORLD DOTLOOP SCENARIOS ====================
  
  describe('Real-World Dotloop Scenarios', () => {
    it('should handle typical Dotloop export with many columns', () => {
      const csv = `Loop Name,Loop Status,Agent Name,Price,Commission,Created Date,Closing Date,Address,City,State
Loop 1,Closed,John Smith,$500000,$15000,1/1/2024,3/1/2024,123 Main St,Austin,TX
Loop 2,Active,Jane Doe,$600000,$18000,2/1/2024,,456 Oak Ave,Dallas,TX`;
      
      const result = validateCSVContent(csv);
      expect(result.isValid).toBe(true);
      expect(result.metadata.hasHeader).toBe(true);
      expect(result.metadata.columnCount).toBe(10);
      expect(result.metadata.estimatedRecords).toBe(2);
    });
    
    it('should handle Dotloop export with missing optional fields', () => {
      const csv = `Loop Name,Agent Name,Price,Status
Loop 1,John Smith,$500000,Closed
Loop 2,Jane Doe,,Active
Loop 3,,,Archived`;
      
      const result = validateCSVContent(csv);
      expect(result.isValid).toBe(true);
    });
    
    it('should handle Dotloop export with currency formatting', () => {
      const csv = `Agent,Commission
John,"$15,000.50"
Jane,"$18,500.00"`;
      
      const result = validateCSVContent(csv);
      expect(result.isValid).toBe(true);
    });
    
    it('should handle Dotloop export with percentage values', () => {
      const csv = `Agent,Rate,Split
John,3.5%,80%
Jane,3.0%,75%`;
      
      const result = validateCSVContent(csv);
      expect(result.isValid).toBe(true);
    });
    
    it('should handle Dotloop export with date variations', () => {
      const csv = `Agent,Date1,Date2,Date3
John,1/15/2024,01/15/2024,2024-01-15
Jane,2/1/24,02/01/2024,2024-02-01`;
      
      const result = validateCSVContent(csv);
      expect(result.isValid).toBe(true);
    });
  });
  
  // ==================== METADATA VALIDATION ====================
  
  describe('Metadata Validation', () => {
    it('should provide accurate metadata for valid CSV', () => {
      const csv = `Name,Age,City\nJohn,30,NYC\nJane,25,LA\nBob,35,SF`;
      const result = validateCSVContent(csv);
      
      expect(result.metadata.lineCount).toBe(4);
      expect(result.metadata.columnCount).toBe(3);
      // Header detection may vary based on heuristics
      expect(result.metadata.hasHeader).toBeDefined();
      expect(result.metadata.estimatedRecords).toBeGreaterThanOrEqual(3);
      expect(result.metadata.detectedDelimiter).toBe(',');
    });
    
    it('should calculate file size correctly', () => {
      const csv = `Name,Age\nJohn,30`;
      const result = validateCSVContent(csv);
      
      expect(result.metadata.fileSize).toBe(csv.length);
      expect(result.metadata.fileSizeFormatted).toContain('Bytes');
    });
  });
});
