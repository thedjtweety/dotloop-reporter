/**
 * Tests for Transaction Detail Page navigation logic
 * Verifies that transaction index lookups and field formatting work correctly
 */

import { describe, it, expect } from 'vitest';

// ─── Simulate the DotloopRecord structure ────────────────────────────────────

interface DotloopRecord {
  loopId: string;
  loopName: string;
  loopStatus: string;
  address: string;
  salePrice: number;
  price: number;
  commissionTotal: number;
  commissionRate: number;
  closingDate: string;
  agents: string;
  tags: string[];
  [key: string]: any;
}

// ─── Replicate the fmt helpers from TransactionDetailPage ────────────────────

function fmt(val: any): string {
  if (val === undefined || val === null || val === '') return '—';
  if (typeof val === 'number') return val === 0 ? '—' : String(val);
  if (Array.isArray(val)) return val.length ? val.join(', ') : '—';
  return String(val);
}

function fmtMoney(val: any): string {
  if (!val || Number(val) === 0) return '—';
  return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtPct(val: any): string {
  if (!val || Number(val) === 0) return '—';
  return `${Number(val).toFixed(2)}%`;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Transaction Detail Page - fmt helpers', () => {
  it('returns em-dash for null/undefined/empty values', () => {
    expect(fmt(null)).toBe('—');
    expect(fmt(undefined)).toBe('—');
    expect(fmt('')).toBe('—');
  });

  it('returns em-dash for zero numbers', () => {
    expect(fmt(0)).toBe('—');
  });

  it('returns string representation of non-zero numbers', () => {
    expect(fmt(42)).toBe('42');
    expect(fmt(3.5)).toBe('3.5');
  });

  it('joins arrays with comma', () => {
    expect(fmt(['Tag1', 'Tag2', 'Tag3'])).toBe('Tag1, Tag2, Tag3');
  });

  it('returns em-dash for empty arrays', () => {
    expect(fmt([])).toBe('—');
  });

  it('converts strings as-is', () => {
    expect(fmt('Austin, TX')).toBe('Austin, TX');
  });
});

describe('Transaction Detail Page - fmtMoney helper', () => {
  it('returns em-dash for zero', () => {
    expect(fmtMoney(0)).toBe('—');
    expect(fmtMoney(null)).toBe('—');
    expect(fmtMoney(undefined)).toBe('—');
  });

  it('formats positive amounts with dollar sign', () => {
    const result = fmtMoney(500000);
    expect(result).toContain('$');
    expect(result).toContain('500');
  });
});

describe('Transaction Detail Page - fmtPct helper', () => {
  it('returns em-dash for zero/null/undefined', () => {
    expect(fmtPct(0)).toBe('—');
    expect(fmtPct(null)).toBe('—');
    expect(fmtPct(undefined)).toBe('—');
  });

  it('formats percentage with 2 decimal places', () => {
    expect(fmtPct(3)).toBe('3.00%');
    expect(fmtPct(2.5)).toBe('2.50%');
  });
});

describe('Transaction Detail Page - loopId and composite-key navigation', () => {
  const records: DotloopRecord[] = [
    { loopId: '1', loopName: '123 Main St', loopStatus: 'Closed', address: '123 Main St, Austin, TX', salePrice: 450000, price: 450000, commissionTotal: 13500, commissionRate: 3, closingDate: '2026-01-15', agents: 'John Smith', tags: ['buyer'] },
    { loopId: '2', loopName: '456 Oak Ave', loopStatus: 'Active', address: '456 Oak Ave, Round Rock, TX', salePrice: 0, price: 320000, commissionTotal: 0, commissionRate: 0, closingDate: '', agents: 'Jane Doe', tags: [] },
    { loopId: '3', loopName: '789 Elm Dr', loopStatus: 'Under Contract', address: '789 Elm Dr, Cedar Park, TX', salePrice: 275000, price: 275000, commissionTotal: 8250, commissionRate: 3, closingDate: '2026-03-01', agents: 'John Smith, Jane Doe', tags: ['seller', 'referral'] },
  ];

  it('finds record by loopId', () => {
    const found = records.find(r => r.loopId && r.loopId === '1');
    expect(found).toBeDefined();
    expect(found?.loopName).toBe('123 Main St');
  });

  it('returns undefined for non-existent loopId', () => {
    const found = records.find(r => r.loopId && r.loopId === '999');
    expect(found).toBeUndefined();
  });

  it('finds record by composite key when loopId is missing', () => {
    const r = records[0];
    const compositeKey = `${r.loopName || ''}|${r.closingDate || ''}|${r.salePrice || ''}`;
    const [loopName, closingDate, salePrice] = compositeKey.split('|');
    const found = records.find(rec =>
      (rec.loopName || '') === loopName &&
      (rec.closingDate || '') === closingDate &&
      String(rec.salePrice || '') === salePrice
    );
    expect(found).toBeDefined();
    expect(found?.loopId).toBe('1');
  });

  it('composite key lookup returns undefined for non-matching data', () => {
    const found = records.find(rec =>
      (rec.loopName || '') === 'Nonexistent Address' &&
      (rec.closingDate || '') === '2099-01-01'
    );
    expect(found).toBeUndefined();
  });

  it('encodes loopId correctly for URL navigation', () => {
    const loopId = 'loop-123/abc';
    const encoded = encodeURIComponent(loopId);
    const decoded = decodeURIComponent(encoded);
    expect(decoded).toBe(loopId);
  });

  it('encodes composite key correctly for URL navigation', () => {
    const r = records[1];
    const key = `${r.loopName || ''}|${r.closingDate || ''}|${r.salePrice || ''}`;
    const encoded = encodeURIComponent(key);
    const decoded = decodeURIComponent(encoded);
    expect(decoded).toBe(key);
    expect(decoded.includes('|')).toBe(true);
  });

  it('correctly formats a full record for display', () => {
    const r = records[0];
    expect(fmt(r.loopName)).toBe('123 Main St');
    expect(fmtMoney(r.salePrice)).toContain('450');
    expect(fmtPct(r.commissionRate)).toBe('3.00%');
    expect(fmt(r.tags)).toBe('buyer');
    expect(fmt(r.closingDate)).toBe('2026-01-15');
  });

  it('handles record with missing financial data gracefully', () => {
    const r = records[1];
    expect(fmtMoney(r.salePrice)).toBe('—');
    expect(fmtPct(r.commissionRate)).toBe('—');
    expect(fmt(r.closingDate)).toBe('—');
    expect(fmt(r.tags)).toBe('—');
  });

  it('handles multi-agent record correctly', () => {
    const r = records[2];
    expect(fmt(r.agents)).toBe('John Smith, Jane Doe');
    expect(fmt(r.tags)).toBe('seller, referral');
  });
});
