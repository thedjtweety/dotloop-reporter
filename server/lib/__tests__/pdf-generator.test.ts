/**
 * Tests for PDF Generator Service
 * 
 * Tests the PDF report generation, data aggregation, and formatting
 */

import { describe, it, expect } from 'vitest';
import {
  generateReportHTML,
  groupBreakdownsByAgent,
  calculateAgentTotals,
  calculateReportTotals,
  formatCurrency,
  formatPercentage,
  formatDate,
  type PDFReportData,
} from '../pdf-generator';
import type { CommissionBreakdown, AgentYTDSummary } from '../commission-calculator';

// Mock data
const mockBreakdowns: CommissionBreakdown[] = [
  {
    id: '1',
    agentName: 'John Doe',
    loopName: '123 Main St',
    closingDate: '2024-01-15',
    grossCommissionIncome: 10000,
    brokerageSplitAmount: 5000,
    agentNetCommission: 5000,
    totalDeductions: 0,
    royaltyAmount: 500,
    ytdAfterTransaction: 5000,
    splitType: 'pre-cap',
    isCapped: false,
  },
  {
    id: '2',
    agentName: 'John Doe',
    loopName: '456 Oak Ave',
    closingDate: '2024-01-20',
    grossCommissionIncome: 15000,
    brokerageSplitAmount: 7500,
    agentNetCommission: 7500,
    totalDeductions: 0,
    royaltyAmount: 750,
    ytdAfterTransaction: 12500,
    splitType: 'pre-cap',
    isCapped: false,
  },
  {
    id: '3',
    agentName: 'Jane Smith',
    loopName: '789 Pine Rd',
    closingDate: '2024-01-25',
    grossCommissionIncome: 12000,
    brokerageSplitAmount: 6000,
    agentNetCommission: 6000,
    totalDeductions: 0,
    royaltyAmount: 600,
    ytdAfterTransaction: 6000,
    splitType: 'pre-cap',
    isCapped: false,
  },
];

const mockYTDSummaries: AgentYTDSummary[] = [
  {
    agentName: 'John Doe',
    ytdCompanyDollar: 12500,
    ytdNetCommission: 12500,
    capAmount: 20000,
    isCapped: false,
  },
  {
    agentName: 'Jane Smith',
    ytdCompanyDollar: 6000,
    ytdNetCommission: 6000,
    capAmount: 20000,
    isCapped: false,
  },
];

describe('PDF Generator Service', () => {
  describe('formatCurrency', () => {
    it('should format numbers as USD currency', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00');
      expect(formatCurrency(10000.5)).toBe('$10,000.50');
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should handle negative values', () => {
      expect(formatCurrency(-1000)).toBe('-$1,000.00');
    });

    it('should handle decimal values', () => {
      expect(formatCurrency(1234.567)).toBe('$1,234.57');
    });
  });

  describe('formatPercentage', () => {
    it('should format numbers as percentages', () => {
      expect(formatPercentage(50)).toBe('50.0%');
      expect(formatPercentage(33.333)).toBe('33.3%');
      expect(formatPercentage(100)).toBe('100.0%');
    });

    it('should handle zero', () => {
      expect(formatPercentage(0)).toBe('0.0%');
    });
  });

  describe('formatDate', () => {
    it('should format ISO dates correctly', () => {
      const result = formatDate('2024-01-15');
      expect(result).toMatch(/Jan 15, 2024/);
    });

    it('should handle invalid dates gracefully', () => {
      const result = formatDate('invalid-date');
      expect(result).toBe('invalid-date');
    });
  });

  describe('groupBreakdownsByAgent', () => {
    it('should group breakdowns by agent name', () => {
      const grouped = groupBreakdownsByAgent(mockBreakdowns);
      
      expect(grouped.size).toBe(2);
      expect(grouped.get('John Doe')).toHaveLength(2);
      expect(grouped.get('Jane Smith')).toHaveLength(1);
    });

    it('should handle empty array', () => {
      const grouped = groupBreakdownsByAgent([]);
      expect(grouped.size).toBe(0);
    });

    it('should preserve breakdown data when grouping', () => {
      const grouped = groupBreakdownsByAgent(mockBreakdowns);
      const johnBreakdowns = grouped.get('John Doe');
      
      expect(johnBreakdowns?.[0].loopName).toBe('123 Main St');
      expect(johnBreakdowns?.[1].loopName).toBe('456 Oak Ave');
    });
  });

  describe('calculateAgentTotals', () => {
    it('should calculate correct totals for agent', () => {
      const johnBreakdowns = mockBreakdowns.filter(b => b.agentName === 'John Doe');
      const totals = calculateAgentTotals(johnBreakdowns);
      
      expect(totals.transactionCount).toBe(2);
      expect(totals.totalGCI).toBe(25000);
      expect(totals.totalCompanyDollar).toBe(12500);
      expect(totals.totalAgentCommission).toBe(12500);
      expect(totals.totalRoyalties).toBe(1250);
    });

    it('should handle single transaction', () => {
      const totals = calculateAgentTotals([mockBreakdowns[0]]);
      
      expect(totals.transactionCount).toBe(1);
      expect(totals.totalGCI).toBe(10000);
      expect(totals.totalCompanyDollar).toBe(5000);
    });

    it('should handle empty array', () => {
      const totals = calculateAgentTotals([]);
      
      expect(totals.transactionCount).toBe(0);
      expect(totals.totalGCI).toBe(0);
      expect(totals.totalCompanyDollar).toBe(0);
    });
  });

  describe('calculateReportTotals', () => {
    it('should calculate correct report-wide totals', () => {
      const totals = calculateReportTotals(mockBreakdowns);
      
      expect(totals.totalTransactions).toBe(3);
      expect(totals.totalGCI).toBe(37000);
      expect(totals.totalCompanyDollar).toBe(18500);
      expect(totals.totalAgentCommission).toBe(18500);
      expect(totals.uniqueAgents).toBe(2);
      expect(totals.totalRoyalties).toBe(1850);
    });

    it('should handle single agent', () => {
      const singleAgentBreakdowns = mockBreakdowns.filter(b => b.agentName === 'John Doe');
      const totals = calculateReportTotals(singleAgentBreakdowns);
      
      expect(totals.uniqueAgents).toBe(1);
      expect(totals.totalTransactions).toBe(2);
    });
  });

  describe('generateReportHTML', () => {
    it('should generate valid HTML', () => {
      const reportData: PDFReportData = {
        breakdowns: mockBreakdowns,
        ytdSummaries: mockYTDSummaries,
        generatedDate: '2024-01-15T00:00:00Z',
        brokerageName: 'Test Brokerage',
        reportTitle: 'Test Report',
      };

      const html = generateReportHTML(reportData);
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('</html>');
      expect(html).toContain('Test Report');
      expect(html).toContain('Test Brokerage');
    });

    it('should include agent names in report', () => {
      const reportData: PDFReportData = {
        breakdowns: mockBreakdowns,
        ytdSummaries: mockYTDSummaries,
        generatedDate: '2024-01-15T00:00:00Z',
      };

      const html = generateReportHTML(reportData);
      
      expect(html).toContain('John Doe');
      expect(html).toContain('Jane Smith');
    });

    it('should include transaction details when enabled', () => {
      const reportData: PDFReportData = {
        breakdowns: mockBreakdowns,
        ytdSummaries: mockYTDSummaries,
        generatedDate: '2024-01-15T00:00:00Z',
      };

      const html = generateReportHTML(reportData, {
        includeTransactionDetails: true,
      });
      
      expect(html).toContain('123 Main St');
      expect(html).toContain('456 Oak Ave');
      expect(html).toContain('789 Pine Rd');
    });

    it('should exclude transaction details when disabled', () => {
      const reportData: PDFReportData = {
        breakdowns: mockBreakdowns,
        ytdSummaries: mockYTDSummaries,
        generatedDate: '2024-01-15T00:00:00Z',
      };

      const html = generateReportHTML(reportData, {
        includeTransactionDetails: false,
      });
      
      // Should not have transaction table rows
      expect(html).not.toContain('123 Main St');
    });

    it('should include agent summaries when enabled', () => {
      const reportData: PDFReportData = {
        breakdowns: mockBreakdowns,
        ytdSummaries: mockYTDSummaries,
        generatedDate: '2024-01-15T00:00:00Z',
      };

      const html = generateReportHTML(reportData, {
        includeAgentSummaries: true,
      });
      
      expect(html).toContain('Agent Summaries');
    });

    it('should exclude agent summaries when disabled', () => {
      const reportData: PDFReportData = {
        breakdowns: mockBreakdowns,
        ytdSummaries: mockYTDSummaries,
        generatedDate: '2024-01-15T00:00:00Z',
      };

      const html = generateReportHTML(reportData, {
        includeAgentSummaries: false,
      });
      
      expect(html).not.toContain('Agent Summaries');
    });

    it('should include formatted currency values', () => {
      const reportData: PDFReportData = {
        breakdowns: mockBreakdowns,
        ytdSummaries: mockYTDSummaries,
        generatedDate: '2024-01-15T00:00:00Z',
      };

      const html = generateReportHTML(reportData);
      
      // Check for formatted currency
      expect(html).toContain('$37,000.00'); // Total GCI
      expect(html).toContain('$18,500.00'); // Total Company Dollar
    });

    it('should include executive summary section', () => {
      const reportData: PDFReportData = {
        breakdowns: mockBreakdowns,
        ytdSummaries: mockYTDSummaries,
        generatedDate: '2024-01-15T00:00:00Z',
      };

      const html = generateReportHTML(reportData);
      
      expect(html).toContain('Executive Summary');
      expect(html).toContain('Total Transactions');
      expect(html).toContain('Unique Agents');
    });

    it('should handle empty data gracefully', () => {
      const reportData: PDFReportData = {
        breakdowns: [],
        ytdSummaries: [],
        generatedDate: '2024-01-15T00:00:00Z',
      };

      const html = generateReportHTML(reportData);
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Commission Report');
    });

    it('should group transactions by agent when enabled', () => {
      const reportData: PDFReportData = {
        breakdowns: mockBreakdowns,
        ytdSummaries: mockYTDSummaries,
        generatedDate: '2024-01-15T00:00:00Z',
      };

      const html = generateReportHTML(reportData, {
        groupByAgent: true,
        includeTransactionDetails: true,
      });
      
      // Should have separate sections for each agent
      const johnCount = (html.match(/John Doe/g) || []).length;
      const janeCount = (html.match(/Jane Smith/g) || []).length;
      
      expect(johnCount).toBeGreaterThan(0);
      expect(janeCount).toBeGreaterThan(0);
    });

    it('should include page styling', () => {
      const reportData: PDFReportData = {
        breakdowns: mockBreakdowns,
        ytdSummaries: mockYTDSummaries,
        generatedDate: '2024-01-15T00:00:00Z',
      };

      const html = generateReportHTML(reportData);
      
      expect(html).toContain('<style>');
      expect(html).toContain('page-break-after');
      expect(html).toContain('font-family');
    });
  });
});
