import { describe, expect, it } from 'vitest';
import {
  agentNames,
  getSharedTransactionCalculationInput,
  getRecordKey,
  hasAssignedAgents,
  hashSecret,
  isRecordForAgent,
  makeSecret,
  toSqlTimestamp,
} from './routers/agentSharing';

describe('agent sharing privacy helpers', () => {
  it('matches only exact comma-separated agent names and never substring matches', () => {
    const record = { agents: 'Sarah Miller, Marcus Stone' };
    expect(isRecordForAgent(record, 'Sarah Miller')).toBe(true);
    expect(isRecordForAgent(record, 'Marcus Stone')).toBe(true);
    expect(isRecordForAgent(record, 'Sarah')).toBe(false);
    expect(isRecordForAgent(record, 'Sarah Miller Jr')).toBe(false);
    expect(isRecordForAgent(record, 'Alex Garcia')).toBe(false);
  });

  it('matches agent names regardless of whitespace and letter case', () => {
    const record = { agents: '  SARAH MILLER ,  marcus stone ' };
    expect(isRecordForAgent(record, 'sarah miller')).toBe(true);
    expect(isRecordForAgent(record, 'Marcus Stone')).toBe(true);
  });

  it('returns no agent match for missing or empty agent fields', () => {
    expect(isRecordForAgent({}, 'Sarah Miller')).toBe(false);
    expect(isRecordForAgent({ agents: '' }, 'Sarah Miller')).toBe(false);
  });

  it('rejects a share dataset with no populated agent assignments', () => {
    expect(hasAssignedAgents([{ agents: '' }, {}, { agents: null }])).toBe(false);
    expect(hasAssignedAgents([{ agents: '' }, { agents: 'Sarah Miller' }])).toBe(true);
  });

  it('normalizes agent name lists and removes blank values', () => {
    expect(agentNames(' Sarah Miller, , Marcus Stone ,,')).toEqual(['sarah miller', 'marcus stone']);
    expect(agentNames(null)).toEqual([]);
  });

  it('uses loopId as the most stable unique source key', () => {
    expect(getRecordKey({ loopId: 'loop-123', loopName: '123 Main' }, 7)).toBe('loop:loop-123');
  });

  it('falls back to a composite key that remains unique inside an upload', () => {
    const one = getRecordKey({ loopName: '123 Main', closingDate: '2026-01-01', salePrice: 500000 }, 0);
    const two = getRecordKey({ loopName: '123 Main', closingDate: '2026-01-01', salePrice: 500000 }, 1);
    expect(one).toContain('123 Main|2026-01-01|500000|0');
    expect(two).toContain('123 Main|2026-01-01|500000|1');
    expect(one).not.toBe(two);
  });

  it('hashes the same secret deterministically without returning the raw secret', () => {
    const secret = 'private-owner-secret-value';
    expect(hashSecret(secret)).toHaveLength(64);
    expect(hashSecret(secret)).toBe(hashSecret(secret));
    expect(hashSecret(secret)).not.toContain(secret);
  });

  it('generates distinct high-entropy browser-safe secrets', () => {
    const first = makeSecret();
    const second = makeSecret();
    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThanOrEqual(40);
    expect(first).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('formats server timestamps in the MySQL timestamp format', () => {
    expect(toSqlTimestamp(new Date('2026-01-02T03:04:05.999Z'))).toBe('2026-01-02 03:04:05');
  });

  it('normalizes a shared record for the broker-approved commission calculator', () => {
    expect(getSharedTransactionCalculationInput({
      loopId: 'loop-22',
      loopName: '22 Lake Street',
      closingDate: '2026-02-03',
      agents: 'Sarah Miller',
      salePrice: '$400,000',
      commissionTotal: '$12,000',
    }, 0, 'Sarah Miller')).toMatchObject({
      id: 'loop-22',
      loopName: '22 Lake Street',
      salePrice: 400000,
      commissionRate: 3,
    });
  });

  it('uses a declared commission rate when a shared transaction includes one', () => {
    expect(getSharedTransactionCalculationInput({ salePrice: 500000, commissionRate: 2.5 }, 4, 'Sarah Miller')).toMatchObject({
      id: 'shared-4',
      salePrice: 500000,
      commissionRate: 2.5,
    });
  });
});
