import { describe, it, expect } from 'vitest';
import { analyzeFieldCompleteness } from './fieldCompletenessAnalysis';
import { DotloopRecord } from './csvParser';

describe('fieldCompletenessAnalysis', () => {
  it('should handle empty records array', () => {
    const result = analyzeFieldCompleteness([]);
    expect(result.fields).toHaveLength(0);
    expect(result.overallCompleteness).toBe(0);
    expect(result.totalRecords).toBe(0);
  });

  it('should calculate completeness for fully populated records', () => {
    const records: DotloopRecord[] = [
      {
        loopId: '1',
        loopName: 'Deal 1',
        loopStatus: 'Closed',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        county: 'New York',
        agents: 'John Doe',
        price: 500000,
        closingDate: '2025-01-15',
        createdDate: '2024-01-15',
        commissionTotal: 15000,
        commissionRate: 3,
        leadSource: 'Referral',
        transactionType: 'Sale',
        salePrice: 500000,
        listPrice: 525000,
        daysOnMarket: 30,
        squareFootage: 2500,
        earnestMoney: 25000,
        tags: [],
      },
    ];

    const result = analyzeFieldCompleteness(records);
    expect(result.totalRecords).toBe(1);
    expect(result.fields).toHaveLength(10);
    
    // All fields should be 100% complete
    result.fields.forEach(field => {
      expect(field.completenessPercentage).toBe(100);
      expect(field.completedRecords).toBe(1);
      expect(field.status).toBe('excellent');
    });
  });

  it('should calculate completeness for partially populated records', () => {
    const records: DotloopRecord[] = [
      {
        loopId: '1',
        loopName: 'Deal 1',
        loopStatus: 'Closed',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        county: 'New York',
        agents: 'John Doe',
        price: 500000,
        closingDate: '2025-01-15',
        createdDate: '2024-01-15',
        commissionTotal: 15000,
        commissionRate: 3,
        leadSource: 'Referral',
        transactionType: 'Sale',
        salePrice: 500000,
        listPrice: 525000,
        daysOnMarket: 30,
        squareFootage: 2500,
        earnestMoney: 25000,
        tags: [],
      },
      {
        loopId: '2',
        loopName: 'Deal 2',
        loopStatus: 'Active',
        address: '456 Oak Ave',
        city: '',
        state: '',
        county: '',
        agents: '',
        price: 0,
        closingDate: '',
        createdDate: '2024-02-01',
        commissionTotal: 0,
        commissionRate: 0,
        leadSource: '',
        transactionType: 'Sale',
        salePrice: 0,
        listPrice: 0,
        daysOnMarket: 0,
        squareFootage: 0,
        earnestMoney: 0,
        tags: [],
      },
    ];

    const result = analyzeFieldCompleteness(records);
    expect(result.totalRecords).toBe(2);
    
    // Price field should be 50% complete (only first record has price)
    const priceField = result.fields.find(f => f.fieldName === 'price');
    expect(priceField?.completenessPercentage).toBe(50);
    expect(priceField?.completedRecords).toBe(1);
    expect(priceField?.status).toBe('warning');
  });

  it('should assign correct status based on completeness percentage', () => {
    const records: DotloopRecord[] = Array(10).fill(null).map((_, i) => ({
      loopId: `${i}`,
      loopName: `Deal ${i}`,
      loopStatus: 'Closed',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      county: 'New York',
      agents: i < 9 ? 'John Doe' : '', // 90% complete
      price: i < 7 ? 500000 : 0, // 70% complete
      closingDate: i < 5 ? '2025-01-15' : '', // 50% complete
      createdDate: '2024-01-15',
      commissionTotal: 15000,
      commissionRate: 3,
      leadSource: 'Referral',
      transactionType: 'Sale',
      salePrice: 500000,
      listPrice: 525000,
      daysOnMarket: 30,
      squareFootage: 2500,
      earnestMoney: 25000,
      tags: [],
    }));

    const result = analyzeFieldCompleteness(records);
    
    const agentsField = result.fields.find(f => f.fieldName === 'agents');
    expect(agentsField?.completenessPercentage).toBe(90);
    expect(agentsField?.status).toBe('excellent');
    
    const priceField = result.fields.find(f => f.fieldName === 'price');
    expect(priceField?.completenessPercentage).toBe(70);
    expect(priceField?.status).toBe('good');
    
    const closingDateField = result.fields.find(f => f.fieldName === 'closingDate');
    expect(closingDateField?.completenessPercentage).toBe(50);
    expect(closingDateField?.status).toBe('warning');
  });

  it('should calculate overall completeness as average of all fields', () => {
    const records: DotloopRecord[] = [
      {
        loopId: '1',
        loopName: 'Deal 1',
        loopStatus: 'Closed',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        county: 'New York',
        agents: 'John Doe',
        price: 500000,
        closingDate: '2025-01-15',
        createdDate: '2024-01-15',
        commissionTotal: 15000,
        commissionRate: 3,
        leadSource: 'Referral',
        transactionType: 'Sale',
        salePrice: 500000,
        listPrice: 525000,
        daysOnMarket: 30,
        squareFootage: 2500,
        earnestMoney: 25000,
        tags: [],
      },
      {
        loopId: '2',
        loopName: 'Deal 2',
        loopStatus: 'Active',
        address: '456 Oak Ave',
        city: '',
        state: '',
        county: '',
        agents: '',
        price: 0,
        closingDate: '',
        createdDate: '2024-02-01',
        commissionTotal: 0,
        commissionRate: 0,
        leadSource: '',
        transactionType: 'Sale',
        salePrice: 0,
        listPrice: 0,
        daysOnMarket: 0,
        squareFootage: 0,
        earnestMoney: 0,
        tags: [],
      },
    ];

    const result = analyzeFieldCompleteness(records);
    
    // Overall completeness should be average of all field percentages
    const avgCompleteness = result.fields.reduce((sum, f) => sum + f.completenessPercentage, 0) / result.fields.length;
    expect(result.overallCompleteness).toBe(Math.round(avgCompleteness));
  });

  it('should handle records with null and undefined values', () => {
    const records: DotloopRecord[] = [
      {
        loopId: '1',
        loopName: 'Deal 1',
        loopStatus: 'Closed',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        county: 'New York',
        agents: null as any,
        price: 500000,
        closingDate: '2025-01-15',
        createdDate: '2024-01-15',
        commissionTotal: 15000,
        commissionRate: 3,
        leadSource: undefined as any,
        transactionType: 'Sale',
        salePrice: 500000,
        listPrice: 525000,
        daysOnMarket: 30,
        squareFootage: 2500,
        earnestMoney: 25000,
        tags: [],
      },
    ];

    const result = analyzeFieldCompleteness(records);
    
    const agentsField = result.fields.find(f => f.fieldName === 'agents');
    expect(agentsField?.completenessPercentage).toBe(0);
    
    const leadSourceField = result.fields.find(f => f.fieldName === 'leadSource');
    expect(leadSourceField?.completenessPercentage).toBe(0);
  });
});
