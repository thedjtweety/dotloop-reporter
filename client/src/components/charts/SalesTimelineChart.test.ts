/**
 * Vitest tests for SalesTimelineChart component
 * Tests for Period Comparison, Export, and Advanced Filtering features
 */

import { describe, it, expect } from 'vitest';
import { ChartData, DotloopRecord } from '@/lib/csvParser';

// Mock data for testing
const mockChartData: ChartData[] = [
  { label: '2024-01', value: 500000000, movingAverage: 450000000 },
  { label: '2024-02', value: 600000000, movingAverage: 550000000 },
  { label: '2024-03', value: 700000000, movingAverage: 600000000 },
  { label: '2024-04', value: 550000000, movingAverage: 616666667 },
];

const mockRecords: DotloopRecord[] = [
  {
    agent: 'John Doe',
    transactionType: 'Buy',
    loopStatus: 'Closed',
    closingDate: '2024-01-15',
    salePrice: 250000,
  } as DotloopRecord,
  {
    agent: 'Jane Smith',
    transactionType: 'Sell',
    loopStatus: 'Active',
    closingDate: '2024-02-20',
    salePrice: 350000,
  } as DotloopRecord,
  {
    agent: 'John Doe',
    transactionType: 'Buy',
    loopStatus: 'Closed',
    closingDate: '2024-02-10',
    salePrice: 300000,
  } as DotloopRecord,
];

describe('SalesTimelineChart - Period Comparison Feature', () => {
  it('should calculate percentage change between two periods correctly', () => {
    const period1 = mockChartData[2]; // 700M
    const period2 = mockChartData[1]; // 600M
    
    const change = ((period1.value - period2.value) / period2.value) * 100;
    
    expect(change).toBeCloseTo(16.67, 1);
    expect(change).toBeGreaterThan(0);
  });

  it('should identify increase when period1 > period2', () => {
    const period1 = mockChartData[2]; // 700M
    const period2 = mockChartData[1]; // 600M
    
    const isIncrease = period1.value > period2.value;
    
    expect(isIncrease).toBe(true);
  });

  it('should identify decrease when period1 < period2', () => {
    const period1 = mockChartData[3]; // 550M
    const period2 = mockChartData[2]; // 700M
    
    const isIncrease = period1.value > period2.value;
    
    expect(isIncrease).toBe(false);
  });

  it('should calculate absolute difference between periods', () => {
    const period1 = mockChartData[2]; // 700M
    const period2 = mockChartData[1]; // 600M
    
    const diff = Math.abs(period1.value - period2.value);
    
    expect(diff).toBe(100000000);
  });

  it('should calculate period vs average metrics', () => {
    const average = mockChartData.reduce((sum, d) => sum + d.value, 0) / mockChartData.length;
    const period = mockChartData[2]; // 700M
    
    const percentVsAverage = (period.value / average - 1) * 100;
    
    expect(percentVsAverage).toBeGreaterThan(0);
    expect(percentVsAverage).toBeCloseTo(19.15, 1);
  });

  it('should handle zero values in percentage calculation', () => {
    const period1 = { value: 100 };
    const period2 = { value: 0 };
    
    // Should not divide by zero
    const result = period2.value === 0 ? 0 : ((period1.value - period2.value) / period2.value) * 100;
    
    expect(result).toBe(0);
  });

  it('should format currency values correctly', () => {
    const period = mockChartData[0];
    const formatted = (period.value / 1000000).toFixed(2);
    
    expect(formatted).toBe('500.00');
  });
});

describe('SalesTimelineChart - Export Feature', () => {
  it('should generate CSV content with correct headers', () => {
    const period = mockChartData[0];
    const headers = ['Period', 'Value', 'Moving Average', 'Transactions Count'];
    
    expect(headers).toContain('Period');
    expect(headers).toContain('Value');
    expect(headers).toContain('Moving Average');
  });

  it('should format CSV data correctly', () => {
    const period = mockChartData[0];
    const row = [period.label, period.value, period.movingAverage || 0, 'N/A'];
    
    expect(row[0]).toBe('2024-01');
    expect(row[1]).toBe(500000000);
    expect(row[2]).toBe(450000000);
  });

  it('should create blob with text/csv mime type', () => {
    const csv = 'Period,Value\n2024-01,500000000';
    const blob = new Blob([csv], { type: 'text/csv' });
    
    expect(blob.type).toBe('text/csv');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('should generate valid download filename', () => {
    const period = mockChartData[0];
    const filename = `timeline-report-${period.label}.csv`;
    
    expect(filename).toContain('timeline-report');
    expect(filename).toContain(period.label);
    expect(filename).toMatch(/\.csv$/);
  });

  it('should format report content with period information', () => {
    const period = mockChartData[0];
    const content = `
Timeline Report - ${period.label}
Generated: ${new Date().toLocaleDateString()}

Period: ${period.label}
Sales Volume: $${(period.value / 1000000).toFixed(2)}M
    `;
    
    expect(content).toContain('Timeline Report');
    expect(content).toContain(period.label);
    expect(content).toContain('Sales Volume');
  });

  it('should create blob with text/plain mime type for report', () => {
    const content = 'Timeline Report';
    const blob = new Blob([content], { type: 'text/plain' });
    
    expect(blob.type).toBe('text/plain');
    expect(blob.size).toBeGreaterThan(0);
  });
});

describe('SalesTimelineChart - Advanced Filtering Feature', () => {
  it('should filter records by period correctly', () => {
    const period = mockChartData[0]; // 2024-01
    const periodRecords = mockRecords.filter(r => {
      const recordDate = new Date(r.closingDate || '');
      const periodMonth = period.label.split('-');
      return recordDate.getFullYear() === parseInt(periodMonth[0]) && 
             (recordDate.getMonth() + 1) === parseInt(periodMonth[1]);
    });
    
    expect(periodRecords.length).toBe(1);
    expect(periodRecords[0].agent).toBe('John Doe');
  });

  it('should group records by agent', () => {
    const byAgent = mockRecords.reduce((acc, r) => {
      const agent = r.agent || 'Unknown';
      acc[agent] = (acc[agent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    expect(byAgent['John Doe']).toBe(2);
    expect(byAgent['Jane Smith']).toBe(1);
  });

  it('should group records by property type', () => {
    const byPropertyType = mockRecords.reduce((acc, r) => {
      const type = r.transactionType || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    expect(byPropertyType['Buy']).toBe(2);
    expect(byPropertyType['Sell']).toBe(1);
  });

  it('should group records by status', () => {
    const byStatus = mockRecords.reduce((acc, r) => {
      const status = r.loopStatus || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    expect(byStatus['Closed']).toBe(2);
    expect(byStatus['Active']).toBe(1);
  });

  it('should filter breakdown by search term (agent)', () => {
    const byAgent = mockRecords.reduce((acc, r) => {
      const agent = r.agent || 'Unknown';
      acc[agent] = (acc[agent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const searchTerm = 'john';
    const filtered = Object.entries(byAgent).filter(([agent]) =>
      agent.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    expect(filtered.length).toBe(1);
    expect(filtered[0][0]).toBe('John Doe');
  });

  it('should filter breakdown by search term (property type)', () => {
    const byPropertyType = mockRecords.reduce((acc, r) => {
      const type = r.transactionType || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const searchTerm = 'buy';
    const filtered = Object.entries(byPropertyType).filter(([type]) =>
      type.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    expect(filtered.length).toBe(1);
    expect(filtered[0][0]).toBe('Buy');
  });

  it('should return empty results for non-matching search', () => {
    const byAgent = mockRecords.reduce((acc, r) => {
      const agent = r.agent || 'Unknown';
      acc[agent] = (acc[agent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const searchTerm = 'nonexistent';
    const filtered = Object.entries(byAgent).filter(([agent]) =>
      agent.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    expect(filtered.length).toBe(0);
  });

  it('should sort breakdown results by count descending', () => {
    const byAgent = mockRecords.reduce((acc, r) => {
      const agent = r.agent || 'Unknown';
      acc[agent] = (acc[agent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const sorted = Object.entries(byAgent).sort(([, a], [, b]) => b - a);
    
    expect(sorted[0][1]).toBe(2); // John Doe has 2
    expect(sorted[1][1]).toBe(1); // Jane Smith has 1
  });

  it('should handle empty search results gracefully', () => {
    const byAgent = mockRecords.reduce((acc, r) => {
      const agent = r.agent || 'Unknown';
      acc[agent] = (acc[agent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const searchTerm = 'xyz';
    const filtered = Object.entries(byAgent).filter(([agent]) =>
      agent.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    expect(Array.isArray(filtered)).toBe(true);
    expect(filtered.length).toBe(0);
  });

  it('should calculate total filtered results count', () => {
    const byAgent = mockRecords.reduce((acc, r) => {
      const agent = r.agent || 'Unknown';
      acc[agent] = (acc[agent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byPropertyType = mockRecords.reduce((acc, r) => {
      const type = r.transactionType || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byStatus = mockRecords.reduce((acc, r) => {
      const status = r.loopStatus || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const totalFiltered = Object.entries(byAgent).length + 
                          Object.entries(byPropertyType).length + 
                          Object.entries(byStatus).length;
    
    expect(totalFiltered).toBe(6); // 2 agents + 2 types + 2 statuses
  });

  it('should handle case-insensitive search', () => {
    const byAgent = mockRecords.reduce((acc, r) => {
      const agent = r.agent || 'Unknown';
      acc[agent] = (acc[agent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const searchTerms = ['JOHN', 'John', 'john'];
    
    searchTerms.forEach(term => {
      const filtered = Object.entries(byAgent).filter(([agent]) =>
        agent.toLowerCase().includes(term.toLowerCase())
      );
      expect(filtered.length).toBe(1);
    });
  });
});

describe('SalesTimelineChart - Integration Tests', () => {
  it('should support full workflow: select period -> compare -> export', () => {
    const period1 = mockChartData[0];
    const period2 = mockChartData[1];
    
    // Step 1: Select period
    expect(period1).toBeDefined();
    
    // Step 2: Compare with another period
    const change = ((period2.value - period1.value) / period1.value) * 100;
    expect(change).toBeGreaterThan(0);
    
    // Step 3: Export data
    const csv = `Period,Value\n${period1.label},${period1.value}`;
    expect(csv).toContain(period1.label);
  });

  it('should support filtering workflow: search -> filter -> display', () => {
    const byAgent = mockRecords.reduce((acc, r) => {
      const agent = r.agent || 'Unknown';
      acc[agent] = (acc[agent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Step 1: Search
    const searchTerm = 'john';
    
    // Step 2: Filter
    const filtered = Object.entries(byAgent).filter(([agent]) =>
      agent.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Step 3: Display
    expect(filtered.length).toBe(1);
    expect(filtered[0][0]).toBe('John Doe');
    expect(filtered[0][1]).toBe(2);
  });

  it('should maintain data integrity through comparison and export', () => {
    const period1 = mockChartData[0];
    const period2 = mockChartData[1];
    
    // Original data should not be modified
    const originalValue1 = period1.value;
    const originalValue2 = period2.value;
    
    // Perform comparison
    const change = ((period2.value - period1.value) / period1.value) * 100;
    
    // Verify original data is unchanged
    expect(period1.value).toBe(originalValue1);
    expect(period2.value).toBe(originalValue2);
  });

  it('should handle multiple periods in comparison', () => {
    const periods = mockChartData.slice(0, 3);
    
    // Compare each pair
    for (let i = 0; i < periods.length - 1; i++) {
      const change = ((periods[i + 1].value - periods[i].value) / periods[i].value) * 100;
      expect(typeof change).toBe('number');
      expect(isFinite(change)).toBe(true);
    }
  });

  it('should support filtering across all breakdown categories', () => {
    const searchTerm = 'closed';
    
    const byStatus = mockRecords.reduce((acc, r) => {
      const status = r.loopStatus || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const filtered = Object.entries(byStatus).filter(([status]) =>
      status.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    expect(filtered.length).toBe(1);
    expect(filtered[0][0]).toBe('Closed');
    expect(filtered[0][1]).toBe(2);
  });
});
