import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createAdjustment,
  getAdjustments,
  getAdjustmentsByLoop,
  getAdjustmentsByAgent,
  approveAdjustment,
  rejectAdjustment,
  revertAdjustment,
  updateAdjustment,
  getAdjustmentSummary,
  getAuditLog,
  getAuditLogForAdjustment,
  exportAdjustmentsAsCSV,
  exportAuditLogAsCSV,
  clearAllAdjustments,
} from './varianceAdjustment';

describe('Variance Adjustment System', () => {
  beforeEach(() => {
    clearAllAdjustments();
    localStorage.clear();
  });

  afterEach(() => {
    clearAllAdjustments();
    localStorage.clear();
  });

  describe('createAdjustment', () => {
    it('should create a new adjustment with correct properties', () => {
      const adjustment = createAdjustment(
        'loop_123',
        'John Smith',
        1000,
        1100,
        'data_error',
        'Fixed data entry error',
        'admin'
      );

      expect(adjustment).toBeDefined();
      expect(adjustment.loopId).toBe('loop_123');
      expect(adjustment.agentName).toBe('John Smith');
      expect(adjustment.originalValue).toBe(1000);
      expect(adjustment.adjustedValue).toBe(1100);
      expect(adjustment.adjustmentAmount).toBe(100);
      expect(adjustment.reason).toBe('data_error');
      expect(adjustment.status).toBe('pending');
    });

    it('should generate unique IDs for adjustments', () => {
      const adj1 = createAdjustment('loop_1', 'Agent A', 1000, 1100, 'data_error', '', 'user1');
      const adj2 = createAdjustment('loop_2', 'Agent B', 2000, 2100, 'data_error', '', 'user1');

      expect(adj1.id).not.toBe(adj2.id);
    });
  });

  describe('getAdjustments', () => {
    it('should retrieve all adjustments', () => {
      createAdjustment('loop_1', 'Agent A', 1000, 1100, 'data_error', '', 'user1');
      createAdjustment('loop_2', 'Agent B', 2000, 2100, 'data_error', '', 'user1');

      const adjustments = getAdjustments();
      expect(adjustments.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty array when no adjustments exist', () => {
      const adjustments = getAdjustments();
      expect(Array.isArray(adjustments)).toBe(true);
    });
  });

  describe('getAdjustmentsByLoop', () => {
    it('should filter adjustments by loop ID', () => {
      createAdjustment('loop_1', 'Agent A', 1000, 1100, 'data_error', '', 'user1');
      createAdjustment('loop_1', 'Agent A', 1000, 1200, 'data_error', '', 'user1');
      createAdjustment('loop_2', 'Agent B', 2000, 2100, 'data_error', '', 'user1');

      const loop1Adjustments = getAdjustmentsByLoop('loop_1');
      expect(loop1Adjustments.length).toBeGreaterThanOrEqual(2);
      expect(loop1Adjustments.every((a) => a.loopId === 'loop_1')).toBe(true);
    });
  });

  describe('getAdjustmentsByAgent', () => {
    it('should filter adjustments by agent name', () => {
      createAdjustment('loop_1', 'John Smith', 1000, 1100, 'data_error', '', 'user1');
      createAdjustment('loop_2', 'John Smith', 2000, 2100, 'data_error', '', 'user1');
      createAdjustment('loop_3', 'Jane Doe', 3000, 3100, 'data_error', '', 'user1');

      const johnAdjustments = getAdjustmentsByAgent('John Smith');
      expect(johnAdjustments.length).toBeGreaterThanOrEqual(2);
      expect(johnAdjustments.every((a) => a.agentName === 'John Smith')).toBe(true);
    });
  });

  describe('approveAdjustment', () => {
    it('should approve a pending adjustment', () => {
      const created = createAdjustment('loop_1', 'Agent A', 1000, 1100, 'data_error', '', 'user1');
      const approved = approveAdjustment(created.id, 'admin');

      expect(approved).toBeDefined();
      expect(approved?.status).toBe('approved');
      expect(approved?.approvedBy).toBe('admin');
      expect(approved?.approvedAt).toBeDefined();
    });

    it('should return null for non-existent adjustment', () => {
      const result = approveAdjustment('non_existent', 'admin');
      expect(result).toBeNull();
    });
  });

  describe('rejectAdjustment', () => {
    it('should reject a pending adjustment', () => {
      const created = createAdjustment('loop_1', 'Agent A', 1000, 1100, 'data_error', '', 'user1');
      const rejected = rejectAdjustment(created.id, 'admin', 'Invalid reason');

      expect(rejected).toBeDefined();
      expect(rejected?.status).toBe('rejected');
    });
  });

  describe('revertAdjustment', () => {
    it('should remove an adjustment', () => {
      const created = createAdjustment('loop_1', 'Agent A', 1000, 1100, 'data_error', '', 'user1');
      const result = revertAdjustment(created.id, 'admin');

      expect(result).toBe(true);
      const adjustments = getAdjustments();
      expect(adjustments.find((a) => a.id === created.id)).toBeUndefined();
    });

    it('should return false for non-existent adjustment', () => {
      const result = revertAdjustment('non_existent', 'admin');
      expect(result).toBe(false);
    });
  });

  describe('updateAdjustment', () => {
    it('should update adjustment properties', () => {
      const created = createAdjustment('loop_1', 'Agent A', 1000, 1100, 'data_error', 'Old notes', 'user1');
      const updated = updateAdjustment(created.id, { notes: 'Updated notes' }, 'user1');

      expect(updated).toBeDefined();
      expect(updated?.notes).toBe('Updated notes');
    });

    it('should recalculate adjustment amount when value changes', () => {
      const created = createAdjustment('loop_1', 'Agent A', 1000, 1100, 'data_error', '', 'user1');
      const updated = updateAdjustment(created.id, { adjustedValue: 1200 }, 'user1');

      expect(updated?.adjustmentAmount).toBe(200);
    });
  });

  describe('getAdjustmentSummary', () => {
    it('should calculate summary statistics', () => {
      createAdjustment('loop_1', 'Agent A', 1000, 1100, 'data_error', '', 'user1');
      createAdjustment('loop_2', 'Agent B', 2000, 2050, 'calculation_error', '', 'user1');
      const adj3 = createAdjustment('loop_3', 'Agent C', 3000, 2900, 'special_circumstance', '', 'user1');
      approveAdjustment(adj3.id, 'admin');

      const summary = getAdjustmentSummary();

      expect(summary.totalAdjustments).toBeGreaterThanOrEqual(3);
      expect(summary.pendingApprovals).toBeGreaterThanOrEqual(2);
      expect(summary.approvedAdjustments).toBeGreaterThanOrEqual(1);
    });

    it('should calculate average adjustment amount', () => {
      createAdjustment('loop_1', 'Agent A', 1000, 1100, 'data_error', '', 'user1');
      createAdjustment('loop_2', 'Agent B', 2000, 2200, 'data_error', '', 'user1');

      const summary = getAdjustmentSummary();
      expect(summary.averageAdjustmentAmount).toBeGreaterThan(0);
    });
  });

  describe('Audit Log', () => {
    it('should create audit log entries when adjustments are created', () => {
      createAdjustment('loop_1', 'Agent A', 1000, 1100, 'data_error', '', 'user1');

      const logs = getAuditLog();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].action).toBe('created');
    });

    it('should retrieve audit log for specific adjustment', () => {
      const adj = createAdjustment('loop_1', 'Agent A', 1000, 1100, 'data_error', '', 'user1');
      approveAdjustment(adj.id, 'admin');

      const logs = getAuditLogForAdjustment(adj.id);
      expect(logs.length).toBeGreaterThan(0);
      expect(logs.some((l) => l.action === 'approved')).toBe(true);
    });
  });

  describe('exportAdjustmentsAsCSV', () => {
    it('should export adjustments as CSV', () => {
      createAdjustment('loop_1', 'Agent A', 1000, 1100, 'data_error', 'Test notes', 'user1');
      const adjustments = getAdjustments();

      const csv = exportAdjustmentsAsCSV(adjustments);

      expect(csv).toContain('Loop ID');
      expect(csv).toContain('Agent Name');
    });
  });

  describe('exportAuditLogAsCSV', () => {
    it('should export audit log as CSV', () => {
      const adj = createAdjustment('loop_1', 'Agent A', 1000, 1100, 'data_error', '', 'user1');
      const logs = getAuditLogForAdjustment(adj.id);

      const csv = exportAuditLogAsCSV(logs);

      expect(csv).toContain('Timestamp');
      expect(csv).toContain('Action');
    });
  });
});
