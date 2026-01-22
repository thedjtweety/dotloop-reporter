import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateFileSize,
  validateFileType,
  validateCSVStructure,
  validateCSVFile,
} from './csvValidation';

describe('CSV Validation Utility', () => {
  describe('validateFileSize', () => {
    it('should pass for files under the size limit', () => {
      const file = new File(['test data'], 'test.csv', { type: 'text/csv' });
      const result = validateFileSize(file, 10);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should fail for files exceeding the size limit', () => {
      // Create a file larger than 10MB
      const largeData = new Array(11 * 1024 * 1024).fill('a').join('');
      const file = new File([largeData], 'large.csv', { type: 'text/csv' });
      const result = validateFileSize(file, 10);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed size');
    });

    it('should use custom size limit', () => {
      // Create a file that's 2KB (larger than 1KB limit)
      const largeData = new Array(2 * 1024).fill('a').join('');
      const file = new File([largeData], 'test.csv', { type: 'text/csv' });
      const result = validateFileSize(file, 0.001); // 1KB limit
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed size');
    });
  });

  describe('validateFileType', () => {
    it('should pass for CSV files', () => {
      const file = new File(['test data'], 'test.csv', { type: 'text/csv' });
      const result = validateFileType(file);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should fail for non-CSV files', () => {
      const file = new File(['test data'], 'test.txt', { type: 'text/plain' });
      const result = validateFileType(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should fail for files without CSV extension', () => {
      const file = new File(['test data'], 'test.json', { type: 'text/csv' });
      const result = validateFileType(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should accept various CSV MIME types', () => {
      const mimeTypes = ['text/csv', 'application/csv', 'text/plain'];
      mimeTypes.forEach(mimeType => {
        const file = new File(['test data'], 'test.csv', { type: mimeType });
        const result = validateFileType(file, mimeTypes);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('validateCSVStructure', () => {
    it('should pass for valid CSV with headers and data', () => {
      const csvContent = 'Name,Email,Phone\nJohn,john@example.com,123-456-7890\n';
      const result = validateCSVStructure(csvContent);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should fail for empty CSV', () => {
      const result = validateCSVStructure('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should fail for CSV with only headers', () => {
      const csvContent = 'Name,Email,Phone\n';
      const result = validateCSVStructure(csvContent);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least a header row and one data row');
    });

    it('should check for required headers', () => {
      const csvContent = 'Name,Email\nJohn,john@example.com\n';
      const result = validateCSVStructure(csvContent, ['Name', 'Email', 'Phone']);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('missing required columns');
      expect(result.error).toContain('Phone');
    });

    it('should handle quoted headers', () => {
      const csvContent = '"Name","Email","Phone"\nJohn,john@example.com,123-456-7890\n';
      const result = validateCSVStructure(csvContent);
      expect(result.isValid).toBe(true);
    });

    it('should be case-insensitive for required headers', () => {
      const csvContent = 'name,email,phone\nJohn,john@example.com,123-456-7890\n';
      const result = validateCSVStructure(csvContent, ['Name', 'Email', 'Phone']);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateCSVFile', () => {
    it('should validate a complete valid CSV file', async () => {
      const csvContent = 'Name,Email\nJohn,john@example.com\n';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
      const result = await validateCSVFile(file);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should fail if file size exceeds limit', async () => {
      const largeData = new Array(11 * 1024 * 1024).fill('a').join('');
      const file = new File([largeData], 'large.csv', { type: 'text/csv' });
      const result = await validateCSVFile(file, { maxSizeMB: 10 });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed size');
    });

    it('should fail if file type is invalid', async () => {
      const file = new File(['test data'], 'test.txt', { type: 'text/plain' });
      const result = await validateCSVFile(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should fail if CSV structure is invalid', async () => {
      const csvContent = 'Name,Email\n'; // Only headers
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
      const result = await validateCSVFile(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least a header row and one data row');
    });

    it('should validate required headers', async () => {
      const csvContent = 'Name,Email\nJohn,john@example.com\n';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
      const result = await validateCSVFile(file, {
        requiredHeaders: ['Name', 'Email', 'Phone'],
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('missing required columns');
    });

    it('should use custom max size option', async () => {
      // Create a file that's 2KB (larger than 1KB limit)
      const largeData = new Array(2 * 1024).fill('a').join('');
      const file = new File([largeData], 'test.csv', { type: 'text/csv' });
      const result = await validateCSVFile(file, { maxSizeMB: 0.001 });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed size');
    });
  });
});
