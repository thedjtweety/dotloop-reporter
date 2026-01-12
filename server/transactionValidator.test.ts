import { describe, it, expect } from 'vitest';
import { validateTransaction, validateTransactionBatch } from './transactionValidator';

describe('Transaction Validator', () => {
  const validTransaction = {
    tenantId: 1,
    uploadId: 1,
    userId: 1,
    loopId: '123456',
    loopViewUrl: 'https://www.dotloop.com/loop/123456/view',
    loopName: 'Test Property',
    loopStatus: 'Sold',
    createdDate: '2025-01-01',
    closingDate: '2025-06-01',
    listingDate: '2025-01-01',
    offerDate: '2025-05-01',
    address: '123 Main St',
    price: 500000,
    propertyType: 'Single Family',
    bedrooms: 3,
    bathrooms: 2,
    squareFootage: 2500,
    city: 'Springfield',
    state: 'IL',
    county: 'Sangamon',
    leadSource: 'Direct',
    agents: 'John Doe',
    createdBy: 'John Doe',
    earnestMoney: 5000,
    salePrice: 500000,
    commissionRate: 3,
    commissionTotal: 15000,
    buySideCommission: 7500,
    sellSideCommission: 7500,
    companyDollar: 5000,
    referralSource: 'None',
    referralPercentage: 0,
    complianceStatus: 'Approved',
    tags: ['tag1', 'tag2'],
    originalPrice: 525000,
    yearBuilt: 2000,
    lotSize: 5000,
    subdivision: 'Test Subdivision',
  };

  describe('validateTransaction', () => {
    it('should accept valid transaction', () => {
      const result = validateTransaction(validTransaction, 1);
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should reject transaction with missing tenantId', () => {
      const invalid = { ...validTransaction, tenantId: undefined };
      const result = validateTransaction(invalid, 1);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('tenantId');
    });

    it('should reject transaction with missing uploadId', () => {
      const invalid = { ...validTransaction, uploadId: undefined };
      const result = validateTransaction(invalid, 1);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('uploadId');
    });

    it('should reject transaction with missing userId', () => {
      const invalid = { ...validTransaction, userId: undefined };
      const result = validateTransaction(invalid, 1);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('userId');
    });

    it('should reject transaction with invalid numeric field', () => {
      const invalid = { ...validTransaction, price: 'not a number' };
      const result = validateTransaction(invalid, 1);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('price');
    });

    it('should reject transaction with unreasonably high price', () => {
      const invalid = { ...validTransaction, price: 2000000000 }; // $2 billion
      const result = validateTransaction(invalid, 1);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum');
    });

    it('should reject transaction with unreasonably high commission rate', () => {
      const invalid = { ...validTransaction, commissionRate: 50000 }; // 50000%
      const result = validateTransaction(invalid, 1);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('percentage');
    });

    it('should reject transaction with invalid bedrooms', () => {
      const invalid = { ...validTransaction, bedrooms: -1 };
      const result = validateTransaction(invalid, 1);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('bedrooms');
    });

    it('should reject transaction with invalid year built', () => {
      const invalid = { ...validTransaction, yearBuilt: 1700 }; // Too old
      const result = validateTransaction(invalid, 1);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('yearBuilt');
    });

    it('should reject transaction with invalid year built (future)', () => {
      const invalid = { ...validTransaction, yearBuilt: new Date().getFullYear() + 10 };
      const result = validateTransaction(invalid, 1);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('yearBuilt');
    });

    it('should truncate long text fields', () => {
      const invalid = { ...validTransaction, loopId: 'x'.repeat(300) };
      const result = validateTransaction(invalid, 1);
      expect(result.valid).toBe(true);
      expect(result.data?.loopId?.length).toBeLessThanOrEqual(255);
    });

    it('should convert string numbers to numbers', () => {
      const transaction = { ...validTransaction, price: '500000', bedrooms: '3' };
      const result = validateTransaction(transaction, 1);
      expect(result.valid).toBe(true);
      expect(typeof result.data?.price).toBe('number');
      expect(typeof result.data?.bedrooms).toBe('number');
    });

    it('should handle null numeric fields', () => {
      const transaction = { ...validTransaction, price: null, bedrooms: null };
      const result = validateTransaction(transaction, 1);
      expect(result.valid).toBe(true);
      expect(result.data?.price).toBe(0);
      expect(result.data?.bedrooms).toBe(0);
    });

    it('should reject invalid loopViewUrl format', () => {
      const invalid = { ...validTransaction, loopViewUrl: 'not-a-url' };
      const result = validateTransaction(invalid, 1);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('loopViewUrl');
    });

    it('should round decimal values to 2 places', () => {
      const transaction = { ...validTransaction, price: 500000.999 };
      const result = validateTransaction(transaction, 1);
      expect(result.valid).toBe(true);
      expect(result.data?.price).toBe(500001);
    });
  });

  describe('validateTransactionBatch', () => {
    it('should validate a batch of valid transactions with unique loopIds', () => {
      const batch = [
        { ...validTransaction, loopId: 'loop-1' },
        { ...validTransaction, loopId: 'loop-2' },
        { ...validTransaction, loopId: 'loop-3' },
      ];
      const result = validateTransactionBatch(batch);
      expect(result.valid).toBe(true);
      expect(result.validData?.length).toBe(3);
      expect(result.errors).toBeUndefined();
    });

    it('should report errors for invalid transactions in batch', () => {
      const batch = [
        { ...validTransaction, loopId: 'loop-1' },
        { ...validTransaction, price: 'invalid', loopId: 'loop-2' },
        { ...validTransaction, loopId: 'loop-3' },
      ];
      const result = validateTransactionBatch(batch);
      expect(result.valid).toBe(false);
      expect(result.errors?.length).toBe(1);
      expect(result.validData).toBeUndefined();
    });

    it('should report multiple errors', () => {
      const batch = [
        { ...validTransaction, price: 'invalid', loopId: 'loop-1' },
        { ...validTransaction, bedrooms: -5, loopId: 'loop-2' },
        { ...validTransaction, tenantId: undefined, loopId: 'loop-3' },
      ];
      const result = validateTransactionBatch(batch);
      expect(result.valid).toBe(false);
      expect(result.errors?.length).toBe(3);
    });

    it('should handle empty batch', () => {
      const result = validateTransactionBatch([]);
      expect(result.valid).toBe(true);
      expect(result.validData?.length).toBe(0);
    });

    it('should handle large batch with unique loopIds', () => {
      // Create 1000 unique transactions with different loopIds
      const batch = Array(1000).fill(null).map((_, i) => ({
        ...validTransaction,
        loopId: `loop-${i}`, // Make each loopId unique
      }));
      const result = validateTransactionBatch(batch);
      expect(result.valid).toBe(true);
      expect(result.validData?.length).toBe(1000);
    });

    it('should handle mixed valid and invalid records', () => {
      const batch = [
        { ...validTransaction, loopId: 'loop-1' },
        { ...validTransaction, price: 'invalid', loopId: 'loop-2' },
        { ...validTransaction, loopId: 'loop-3' },
        { ...validTransaction, bedrooms: -1, loopId: 'loop-4' },
        { ...validTransaction, loopId: 'loop-5' },
      ];
      const result = validateTransactionBatch(batch);
      expect(result.valid).toBe(false);
      expect(result.errors?.length).toBe(2);
    });

    it('should detect duplicate loopIds in batch', () => {
      const batch = [
        { ...validTransaction, loopId: 'duplicate-id' },
        { ...validTransaction, loopId: 'unique-id' },
        { ...validTransaction, loopId: 'duplicate-id' }, // Duplicate
      ];
      const result = validateTransactionBatch(batch);
      expect(result.valid).toBe(false);
      expect(result.errors?.length).toBeGreaterThan(0);
      expect(result.errors?.[0]).toContain('Duplicate loopId');
    });

    it('should reject transactions with missing loopId', () => {
      const batch = [
        { ...validTransaction, loopId: 'loop-1' },
        { ...validTransaction, loopId: null },
        { ...validTransaction, loopId: 'loop-3' },
      ];
      const result = validateTransactionBatch(batch);
      expect(result.valid).toBe(false);
      expect(result.errors?.length).toBeGreaterThan(0);
      expect(result.errors?.[0]).toContain('Missing loopId');
    });
  });

  describe('Edge cases', () => {
    it('should handle transaction with all null numeric fields', () => {
      const transaction = {
        ...validTransaction,
        price: null,
        bedrooms: null,
        bathrooms: null,
        squareFootage: null,
        earnestMoney: null,
        salePrice: null,
        commissionRate: null,
        commissionTotal: null,
        buySideCommission: null,
        sellSideCommission: null,
        companyDollar: null,
        referralPercentage: null,
        originalPrice: null,
        yearBuilt: null,
        lotSize: null,
      };
      const result = validateTransaction(transaction, 1);
      expect(result.valid).toBe(true);
    });

    it('should handle transaction with zero values', () => {
      const transaction = {
        ...validTransaction,
        price: 0,
        bedrooms: 0,
        bathrooms: 0,
        squareFootage: 0,
      };
      const result = validateTransaction(transaction, 1);
      expect(result.valid).toBe(true);
    });

    it('should handle transaction with very large valid price', () => {
      const transaction = { ...validTransaction, price: 999999999 }; // Just under $1B
      const result = validateTransaction(transaction, 1);
      expect(result.valid).toBe(true);
    });

    it('should handle transaction with special characters in text fields', () => {
      const transaction = {
        ...validTransaction,
        address: '123 Main St, Apt #5 & Suite B',
        loopName: "O'Brien's Property - 2025",
      };
      const result = validateTransaction(transaction, 1);
      expect(result.valid).toBe(true);
    });

    it('should handle transaction with unicode characters', () => {
      const transaction = {
        ...validTransaction,
        address: '123 Café Street, São Paulo',
        createdBy: 'José García',
      };
      const result = validateTransaction(transaction, 1);
      expect(result.valid).toBe(true);
    });
  });
});
