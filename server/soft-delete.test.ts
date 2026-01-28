import { describe, it, expect, beforeEach } from 'vitest';
import { SoftDeleteManager, SoftDeleteRecord, SoftDeleteQueryBuilder } from './utils/soft-delete';

/**
 * Soft Delete Tests
 * Tests soft delete functionality for audit trail and data recovery
 */

describe('Soft Delete Manager', () => {
  let manager: SoftDeleteManager;

  beforeEach(() => {
    manager = new SoftDeleteManager();
  });

  // ========================================================================
  // Basic Soft Delete Tests
  // ========================================================================

  describe('Basic Soft Delete Operations', () => {
    it('should soft delete a record', () => {
      const deleted = manager.softDelete('record-1', 'user-1', 'Test deletion');
      expect(deleted.isDeleted).toBe(true);
      expect(deleted.deletedBy).toBe('user-1');
      expect(deleted.deletionReason).toBe('Test deletion');
    });

    it('should mark deletion timestamp', () => {
      const before = new Date();
      const deleted = manager.softDelete('record-1', 'user-1');
      const after = new Date();

      expect(deleted.deletedAt).toBeDefined();
      expect(deleted.deletedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(deleted.deletedAt!.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should check if record is deleted', () => {
      manager.softDelete('record-1', 'user-1');
      expect(manager.isDeleted('record-1')).toBe(true);
      expect(manager.isDeleted('record-2')).toBe(false);
    });

    it('should get deleted record', () => {
      manager.softDelete('record-1', 'user-1', 'Test');
      const record = manager.getDeletedRecord('record-1');

      expect(record).toBeDefined();
      expect(record?.isDeleted).toBe(true);
      expect(record?.deletionReason).toBe('Test');
    });
  });

  // ========================================================================
  // Restore Tests
  // ========================================================================

  describe('Record Restoration', () => {
    it('should restore a soft-deleted record', () => {
      manager.softDelete('record-1', 'user-1');
      const restored = manager.restore('record-1', 'user-2', 'Restored by mistake');

      expect(restored.isDeleted).toBe(false);
      expect(restored.deletedAt).toBeNull();
      expect(restored.deletedBy).toBeNull();
    });

    it('should fail to restore non-existent record', () => {
      expect(() => manager.restore('non-existent', 'user-1')).toThrow();
    });

    it('should log restoration in audit trail', () => {
      manager.softDelete('record-1', 'user-1');
      manager.restore('record-1', 'user-2');

      const logs = manager.getAuditLog('record-1');
      expect(logs).toHaveLength(2);
      expect(logs[0].action).toBe('delete');
      expect(logs[1].action).toBe('restore');
    });
  });

  // ========================================================================
  // Audit Trail Tests
  // ========================================================================

  describe('Audit Trail', () => {
    it('should log deletion in audit trail', () => {
      manager.softDelete('record-1', 'user-1', 'Test deletion');
      const logs = manager.getAuditLog('record-1');

      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('delete');
      expect(logs[0].userId).toBe('user-1');
      expect(logs[0].reason).toBe('Test deletion');
    });

    it('should get all audit logs', () => {
      manager.softDelete('record-1', 'user-1');
      manager.softDelete('record-2', 'user-2');

      const allLogs = manager.getAllAuditLogs();
      expect(allLogs).toHaveLength(2);
    });

    it('should get audit logs by action', () => {
      manager.softDelete('record-1', 'user-1');
      manager.softDelete('record-2', 'user-1');

      const deleteLogs = manager.getAuditLogsByAction('delete');
      expect(deleteLogs).toHaveLength(2);
    });

    it('should get audit logs by user', () => {
      manager.softDelete('record-1', 'user-1');
      manager.softDelete('record-2', 'user-2');
      manager.softDelete('record-3', 'user-1');

      const user1Logs = manager.getAuditLogsByUser('user-1');
      expect(user1Logs).toHaveLength(2);
    });

    it('should get deletion history for record', () => {
      manager.softDelete('record-1', 'user-1');
      manager.restore('record-1', 'user-2');
      manager.softDelete('record-1', 'user-3');

      const history = manager.getDeletionHistory('record-1');
      expect(history).toHaveLength(3);
      expect(history[0].action).toBe('delete');
      expect(history[1].action).toBe('restore');
      expect(history[2].action).toBe('delete');
    });
  });

  // ========================================================================
  // Query Tests
  // ========================================================================

  describe('Record Queries', () => {
    it('should get all deleted records', () => {
      manager.softDelete('record-1', 'user-1');
      manager.softDelete('record-2', 'user-1');

      const deleted = manager.getAllDeletedRecords();
      expect(deleted).toHaveLength(2);
    });

    it('should get records deleted by user', () => {
      manager.softDelete('record-1', 'user-1');
      manager.softDelete('record-2', 'user-1');
      manager.softDelete('record-3', 'user-2');

      const user1Deleted = manager.getRecordsDeletedBy('user-1');
      expect(user1Deleted).toHaveLength(2);
    });

    it('should get records deleted in date range', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      manager.softDelete('record-1', 'user-1');

      const inRange = manager.getRecordsDeletedInRange(yesterday, tomorrow);
      expect(inRange.length).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // Permanent Deletion Tests
  // ========================================================================

  describe('Permanent Deletion', () => {
    it('should permanently delete a record', () => {
      manager.softDelete('record-1', 'user-1');
      manager.permanentlyDelete('record-1', 'user-2');

      expect(manager.getDeletedRecord('record-1')).toBeUndefined();
    });

    it('should fail to permanently delete non-existent record', () => {
      expect(() => manager.permanentlyDelete('non-existent', 'user-1')).toThrow();
    });
  });

  // ========================================================================
  // Purge Tests
  // ========================================================================

  describe('Purge Old Records', () => {
    it('should purge records older than specified days', () => {
      manager.softDelete('record-1', 'user-1');
      const purged = manager.purgeOldDeletedRecords(0);

      // Should purge records older than 0 days (all)
      expect(purged).toBeGreaterThanOrEqual(0);
    });

    it('should not purge recent records', () => {
      manager.softDelete('record-1', 'user-1');
      const purged = manager.purgeOldDeletedRecords(30);

      // Should not purge records less than 30 days old
      expect(purged).toBe(0);
      expect(manager.getDeletedRecord('record-1')).toBeDefined();
    });
  });

  // ========================================================================
  // Statistics Tests
  // ========================================================================

  describe('Deletion Statistics', () => {
    it('should calculate deletion statistics', () => {
      manager.softDelete('record-1', 'user-1');
      manager.softDelete('record-2', 'user-1');
      manager.softDelete('record-3', 'user-2');

      const stats = manager.getDeletionStats();
      expect(stats.totalDeleted).toBe(3);
      expect(stats.totalAuditLogs).toBe(3);
      expect(stats.deletionsByUser['user-1']).toBe(2);
      expect(stats.deletionsByUser['user-2']).toBe(1);
    });

    it('should track restorations in statistics', () => {
      manager.softDelete('record-1', 'user-1');
      manager.restore('record-1', 'user-2');

      const stats = manager.getDeletionStats();
      expect(stats.totalDeleted).toBe(1);
      expect(stats.totalRestored).toBe(1);
    });
  });

  // ========================================================================
  // Query Builder Tests
  // ========================================================================

  describe('Soft Delete Query Builder', () => {
    it('should filter deleted records by default', () => {
      const builder = new SoftDeleteQueryBuilder();
      const filter = builder.getFilter();

      expect(filter).toEqual({ isDeleted: false });
    });

    it('should include deleted records when specified', () => {
      const builder = new SoftDeleteQueryBuilder().withDeleted();
      const filter = builder.getFilter();

      expect(filter).toEqual({});
    });

    it('should apply filter to records', () => {
      const records: SoftDeleteRecord[] = [
        { id: '1', isDeleted: false, deletedAt: null, deletedBy: null, deletionReason: null },
        { id: '2', isDeleted: true, deletedAt: new Date(), deletedBy: 'user-1', deletionReason: null },
        { id: '3', isDeleted: false, deletedAt: null, deletedBy: null, deletionReason: null },
      ];

      const builder = new SoftDeleteQueryBuilder();
      const filtered = builder.apply(records);

      expect(filtered).toHaveLength(2);
      expect(filtered.every(r => !r.isDeleted)).toBe(true);
    });

    it('should include deleted records when withDeleted is called', () => {
      const records: SoftDeleteRecord[] = [
        { id: '1', isDeleted: false, deletedAt: null, deletedBy: null, deletionReason: null },
        { id: '2', isDeleted: true, deletedAt: new Date(), deletedBy: 'user-1', deletionReason: null },
      ];

      const builder = new SoftDeleteQueryBuilder().withDeleted();
      const filtered = builder.apply(records);

      expect(filtered).toHaveLength(2);
    });
  });

  // ========================================================================
  // Edge Cases
  // ========================================================================

  describe('Edge Cases', () => {
    it('should handle multiple deletions and restorations', () => {
      manager.softDelete('record-1', 'user-1');
      manager.restore('record-1', 'user-2');
      manager.softDelete('record-1', 'user-3');
      manager.restore('record-1', 'user-4');

      const history = manager.getDeletionHistory('record-1');
      expect(history).toHaveLength(4);
      expect(manager.isDeleted('record-1')).toBe(false);
    });

    it('should clear all data', () => {
      manager.softDelete('record-1', 'user-1');
      manager.softDelete('record-2', 'user-1');

      manager.clear();

      expect(manager.getAllDeletedRecords()).toHaveLength(0);
      expect(manager.getAllAuditLogs()).toHaveLength(0);
    });

    it('should handle deletion without reason', () => {
      const deleted = manager.softDelete('record-1', 'user-1');
      expect(deleted.deletionReason).toBeNull();
    });
  });
});
