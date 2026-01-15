import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCSVContent, generatePrintContent, generateFilename } from './exportUtils';
import { DotloopRecord } from './csvParser';

// Mock data for testing
const mockRecords: DotloopRecord[] = [
  {
    status: 'Closed',
    address: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    agentName: 'John Doe',
    listPrice: 250000,
    soldPrice: 245000,
    commission: 7350,
    commissionRate: 3,
    daysToClose: 45,
    leadSource: 'Realtor.com',
    propertyType: 'Single Family',
    transactionType: 'Sell',
    closeDate: '2026-01-13',
    notes: 'Quick sale',
    loopStatus: 'Closed',
    agents: 'John Doe',
    salePrice: 245000,
    dotloopId: '123',
    transactionId: 'TXN123',
    buySideCommission: 0,
    sellSideCommission: 7350,
    commissionType: 'Sell Side',
    county: 'Sangamon',
  },
  {
    status: 'Active',
    address: '456 Oak Ave',
    city: 'Springfield',
    state: 'IL',
    agentName: 'Jane Smith',
    listPrice: 350000,
    soldPrice: undefined,
    commission: 0,
    commissionRate: 0,
    daysToClose: 0,
    leadSource: 'Direct Mail',
    propertyType: 'Condo',
    transactionType: 'List',
    closeDate: undefined,
    notes: 'New listing',
    loopStatus: 'Active',
    agents: 'Jane Smith',
    salePrice: undefined,
    dotloopId: '456',
    transactionId: 'TXN456',
    buySideCommission: 0,
    sellSideCommission: 0,
    commissionType: 'Sell Side',
    county: 'Sangamon',
  },
];

describe('Export Utilities', () => {
  describe('generateCSVContent', () => {
    it('should generate CSV with header information', () => {
      const csv = generateCSVContent({
        title: 'Test Report',
        records: mockRecords,
        filters: { type: 'Status', value: 'Closed' },
      });

      expect(csv).toContain('Test Report');
      expect(csv).toContain('Filter: Status = Closed');
      expect(csv).toContain('Total Records: 2');
    });

    it('should include column headers', () => {
      const csv = generateCSVContent({
        title: 'Test Report',
        records: mockRecords,
      });

      expect(csv).toContain('Status');
      expect(csv).toContain('Property Address');
      expect(csv).toContain('Agent Name');
      expect(csv).toContain('Commission');
    });

    it('should include transaction data', () => {
      const csv = generateCSVContent({
        title: 'Test Report',
        records: mockRecords,
      });

      expect(csv).toContain('123 Main St');
      expect(csv).toContain('John Doe');
      expect(csv).toContain('Springfield');
    });

    it('should escape quotes in CSV data', () => {
      const recordsWithQuotes: DotloopRecord[] = [
        {
          ...mockRecords[0],
          address: '123 "Main" St',
        },
      ];

      const csv = generateCSVContent({
        title: 'Test Report',
        records: recordsWithQuotes,
      });

      expect(csv).toContain('123 ""Main"" St');
    });

    it('should handle empty records', () => {
      const csv = generateCSVContent({
        title: 'Empty Report',
        records: [],
      });

      expect(csv).toContain('Empty Report');
      expect(csv).toContain('Total Records: 0');
    });
  });

  describe('generatePrintContent', () => {
    it('should generate HTML with header', () => {
      const html = generatePrintContent({
        title: 'Print Report',
        records: mockRecords,
      });

      expect(html).toContain('<h1>Print Report</h1>');
      expect(html).toContain('Generated:');
    });

    it('should include filter information in print content', () => {
      const html = generatePrintContent({
        title: 'Print Report',
        records: mockRecords,
        filters: { type: 'Lead Source', value: 'Realtor.com' },
      });

      expect(html).toContain('Filter: Lead Source = Realtor.com');
    });

    it('should include table with transaction data', () => {
      const html = generatePrintContent({
        title: 'Print Report',
        records: mockRecords,
      });

      expect(html).toContain('<table>');
      expect(html).toContain('123 Main St');
      expect(html).toContain('John Doe');
    });

    it('should include print styles', () => {
      const html = generatePrintContent({
        title: 'Print Report',
        records: mockRecords,
      });

      expect(html).toContain('@media print');
      expect(html).toContain('border-collapse: collapse');
    });

    it('should include record count', () => {
      const html = generatePrintContent({
        title: 'Print Report',
        records: mockRecords,
      });

      expect(html).toContain('Total Records: 2');
    });
  });

  describe('generateFilename', () => {
    it('should generate filename with title and date', () => {
      const filename = generateFilename('Pipeline Report', 'csv');
      
      expect(filename).toMatch(/pipeline-report-\d{4}-\d{2}-\d{2}\.csv/);
    });

    it('should handle titles with special characters', () => {
      const filename = generateFilename('Lead Source: Direct Mail', 'xlsx');
      
      expect(filename).toMatch(/lead-source-direct-mail-\d{4}-\d{2}-\d{2}\.xlsx/);
    });

    it('should support different file extensions', () => {
      const csvFilename = generateFilename('Report', 'csv');
      const xlsxFilename = generateFilename('Report', 'xlsx');

      expect(csvFilename).toMatch(/\.csv$/);
      expect(xlsxFilename).toMatch(/\.xlsx$/);
    });

    it('should convert title to lowercase', () => {
      const filename = generateFilename('UPPERCASE TITLE', 'csv');
      
      expect(filename).toContain('uppercase-title');
    });

    it('should replace spaces with hyphens', () => {
      const filename = generateFilename('Multi Word Title', 'csv');
      
      expect(filename).toContain('multi-word-title');
    });
  });

  describe('Export with custom date', () => {
    it('should use provided date in CSV header', () => {
      const customDate = new Date('2026-01-01T12:00:00');
      const csv = generateCSVContent({
        title: 'Test Report',
        records: mockRecords,
        dateGenerated: customDate,
      });

      expect(csv).toContain('1/1/2026');
    });

    it('should use provided date in print content', () => {
      const customDate = new Date('2026-01-01T12:00:00');
      const html = generatePrintContent({
        title: 'Test Report',
        records: mockRecords,
        dateGenerated: customDate,
      });

      expect(html).toContain('1/1/2026');
    });
  });

  describe('Data formatting in exports', () => {
    it('should handle undefined values in CSV', () => {
      const csv = generateCSVContent({
        title: 'Test Report',
        records: mockRecords,
      });

      // Should not throw and should include empty strings for undefined values
      expect(csv).toBeTruthy();
      expect(csv.split('\n').length).toBeGreaterThan(5);
    });

    it('should handle numeric values in CSV', () => {
      const csv = generateCSVContent({
        title: 'Test Report',
        records: mockRecords,
      });

      expect(csv).toContain('245000');
      expect(csv).toContain('7350');
    });

    it('should include all required columns', () => {
      const csv = generateCSVContent({
        title: 'Test Report',
        records: mockRecords,
      });

      const requiredColumns = [
        'Status',
        'Property Address',
        'City',
        'State',
        'Agent Name',
        'List Price',
        'Sold Price',
        'Commission',
      ];

      requiredColumns.forEach(col => {
        expect(csv).toContain(col);
      });
    });
  });
});
