import { describe, expect, it } from 'vitest';
import {
  calculateMigrationCloseout,
  determineFileCountReconciliation,
  manifestRowIdentity,
  validateMigrationManifest,
} from './lib/migration-manifest';

describe('SkySlope migration manifest validation', () => {
  it('accepts a complete row and flags missing source IDs only as warnings', () => {
    const [row] = validateMigrationManifest([{
      transactionName: '123 Main Street Purchase',
      propertyAddress: '123 Main St, Austin, TX',
      closingDate: '2026-08-14',
      sourceFolderReference: 'https://drive.google.com/folders/abc',
      expectedFileCount: 18,
    }]);

    expect(row.isReady).toBe(true);
    expect(row.issues).toEqual([expect.objectContaining({ severity: 'warning' })]);
    expect(row.expectedFileCount).toBe(18);
  });

  it('blocks a row with no source folder or valid expected file count', () => {
    const [row] = validateMigrationManifest([{
      transactionName: 'Incomplete record',
      expectedFileCount: 0,
    }]);

    expect(row.isReady).toBe(false);
    expect(row.issues.map((issue) => issue.category)).toEqual(expect.arrayContaining([
      'missing_source_reference',
      'invalid_manifest_row',
    ]));
  });

  it('detects duplicate SkySlope transaction identifiers deterministically', () => {
    const rows = validateMigrationManifest([
      { sourceTransactionId: 'SS-100', transactionName: 'First', sourceFolderReference: 'drive/a', expectedFileCount: 3 },
      { sourceTransactionId: 'ss-100', transactionName: 'Second', sourceFolderReference: 'drive/b', expectedFileCount: 4 },
    ]);

    expect(manifestRowIdentity(rows[0])).toBe(manifestRowIdentity(rows[1]));
    expect(rows[1].issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ category: 'duplicate_transaction', severity: 'blocking' }),
    ]));
  });

  it('requires every included item to reconcile with no open blocking exceptions before closeout', () => {
    const ready = calculateMigrationCloseout([
      { status: 'reconciled', expectedFileCount: 4, reconciledFileCount: 4 },
      { status: 'reconciled', expectedFileCount: 7, reconciledFileCount: 7 },
      { status: 'excluded', expectedFileCount: 2, reconciledFileCount: 0 },
    ], 0);
    const blocked = calculateMigrationCloseout([
      { status: 'reconciled', expectedFileCount: 4, reconciledFileCount: 3 },
    ], 1);

    expect(ready.isReadyToComplete).toBe(true);
    expect(ready.includedCount).toBe(2);
    expect(blocked.isReadyToComplete).toBe(false);
    expect(blocked.fileMismatchCount).toBe(1);
  });

  it('updates one mismatch exception and resolves it when the corrected file count matches', () => {
    expect(determineFileCountReconciliation(6, 4, false)).toEqual({ matches: false, mismatchAction: 'create' });
    expect(determineFileCountReconciliation(6, 5, true)).toEqual({ matches: false, mismatchAction: 'update' });
    expect(determineFileCountReconciliation(6, 6, true)).toEqual({ matches: true, mismatchAction: 'resolve' });
    expect(determineFileCountReconciliation(6, 6, false)).toEqual({ matches: true, mismatchAction: 'none' });
  });
});
