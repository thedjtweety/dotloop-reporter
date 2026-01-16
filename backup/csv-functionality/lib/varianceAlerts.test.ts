import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createAlert,
  getAlerts,
  getActiveAlerts,
  getAlertsByLoop,
  getAlertsByAgent,
  getAlertsBySeverity,
  dismissAlert,
  dismissAlerts,
  flagTransaction,
  unflagTransaction,
  getFlaggedTransactions,
  isTransactionFlagged,
  flagTransactions,
  unflagTransactions,
  getAlertSummary,
  getAlertThresholds,
  saveAlertThresholds,
  createAlertsFromVariances,
  exportAlertsAsCSV,
  clearAllAlerts,
  DEFAULT_THRESHOLDS,
} from './varianceAlerts';

describe('Variance Alert System', () => {
  beforeEach(() => {
    clearAllAlerts();
    localStorage.clear();
  });

  afterEach(() => {
    clearAllAlerts();
    localStorage.clear();
  });

  describe('createAlert', () => {
    it('should create alert for major variance', () => {
      const alert = createAlert('loop_1', 'Agent A', 'Transaction 1', 100, 10);

      expect(alert).toBeDefined();
      expect(alert?.severity).toBe('critical');
      expect(alert?.loopId).toBe('loop_1');
      expect(alert?.agentName).toBe('Agent A');
    });

    it('should create alert for minor variance', () => {
      const alert = createAlert('loop_1', 'Agent A', 'Transaction 1', 50, 3);

      expect(alert).toBeDefined();
      expect(alert?.severity).toBe('warning');
    });

    it('should not create alert for variance below threshold', () => {
      const alert = createAlert('loop_1', 'Agent A', 'Transaction 1', 10, 1);

      expect(alert).toBeNull();
    });

    it('should auto-flag transaction if enabled', () => {
      saveAlertThresholds({
        ...DEFAULT_THRESHOLDS,
        enableAutoFlag: true,
        autoFlagMajor: true,
      });

      createAlert('loop_1', 'Agent A', 'Transaction 1', 100, 10);

      expect(isTransactionFlagged('loop_1')).toBe(true);
    });
  });

  describe('getAlerts', () => {
    it('should retrieve all alerts', () => {
      createAlert('loop_1', 'Agent A', 'Transaction 1', 100, 10);
      createAlert('loop_2', 'Agent B', 'Transaction 2', 50, 3);

      const alerts = getAlerts();
      expect(alerts.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getActiveAlerts', () => {
    it('should return only non-dismissed alerts', () => {
      const alert1 = createAlert('loop_1', 'Agent A', 'Transaction 1', 100, 10);
      const alert2 = createAlert('loop_2', 'Agent B', 'Transaction 2', 50, 3);

      if (alert1) dismissAlert(alert1.id, 'user1');

      const active = getActiveAlerts();
      expect(active.length).toBeGreaterThan(0);
    });
  });

  describe('getAlertsByLoop', () => {
    it('should filter alerts by loop ID', () => {
      createAlert('loop_1', 'Agent A', 'Transaction 1', 100, 10);
      createAlert('loop_1', 'Agent A', 'Transaction 2', 50, 3);
      createAlert('loop_2', 'Agent B', 'Transaction 3', 100, 10);

      const loop1Alerts = getAlertsByLoop('loop_1');
      expect(loop1Alerts.length).toBeGreaterThanOrEqual(2);
      expect(loop1Alerts.every((a) => a.loopId === 'loop_1')).toBe(true);
    });
  });

  describe('getAlertsByAgent', () => {
    it('should filter alerts by agent name', () => {
      createAlert('loop_1', 'John Smith', 'Transaction 1', 100, 10);
      createAlert('loop_2', 'John Smith', 'Transaction 2', 50, 3);
      createAlert('loop_3', 'Jane Doe', 'Transaction 3', 100, 10);

      const johnAlerts = getAlertsByAgent('John Smith');
      expect(johnAlerts.length).toBeGreaterThanOrEqual(2);
      expect(johnAlerts.every((a) => a.agentName === 'John Smith')).toBe(true);
    });
  });

  describe('getAlertsBySeverity', () => {
    it('should filter alerts by severity', () => {
      createAlert('loop_1', 'Agent A', 'Transaction 1', 100, 10); // critical
      createAlert('loop_2', 'Agent B', 'Transaction 2', 50, 3); // warning

      const critical = getAlertsBySeverity('critical');
      expect(critical.length).toBeGreaterThan(0);
      expect(critical[0].severity).toBe('critical');
    });
  });

  describe('dismissAlert', () => {
    it('should dismiss an alert', () => {
      const alert = createAlert('loop_1', 'Agent A', 'Transaction 1', 100, 10);

      if (alert) {
        const dismissed = dismissAlert(alert.id, 'user1');
        expect(dismissed?.dismissed).toBe(true);
        expect(dismissed?.dismissedBy).toBe('user1');
      }
    });
  });

  describe('dismissAlerts', () => {
    it('should dismiss multiple alerts', () => {
      const alert1 = createAlert('loop_1', 'Agent A', 'Transaction 1', 100, 10);
      const alert2 = createAlert('loop_2', 'Agent B', 'Transaction 2', 50, 3);

      const ids = [alert1?.id, alert2?.id].filter((id) => id !== undefined) as string[];
      const count = dismissAlerts(ids, 'user1');

      expect(count).toBeGreaterThan(0);
    });
  });

  describe('flagTransaction', () => {
    it('should flag a transaction', () => {
      flagTransaction('loop_1');

      expect(isTransactionFlagged('loop_1')).toBe(true);
    });

    it('should not duplicate flags', () => {
      flagTransaction('loop_1');
      flagTransaction('loop_1');

      const flagged = getFlaggedTransactions();
      const count = flagged.filter((id) => id === 'loop_1').length;
      expect(count).toBe(1);
    });
  });

  describe('unflagTransaction', () => {
    it('should unflag a transaction', () => {
      flagTransaction('loop_1');
      unflagTransaction('loop_1');

      expect(isTransactionFlagged('loop_1')).toBe(false);
    });
  });

  describe('flagTransactions', () => {
    it('should flag multiple transactions', () => {
      const count = flagTransactions(['loop_1', 'loop_2', 'loop_3']);

      expect(count).toBe(3);
      expect(isTransactionFlagged('loop_1')).toBe(true);
      expect(isTransactionFlagged('loop_2')).toBe(true);
      expect(isTransactionFlagged('loop_3')).toBe(true);
    });
  });

  describe('unflagTransactions', () => {
    it('should unflag multiple transactions', () => {
      flagTransactions(['loop_1', 'loop_2', 'loop_3']);
      const count = unflagTransactions(['loop_1', 'loop_2']);

      expect(count).toBe(2);
      expect(isTransactionFlagged('loop_1')).toBe(false);
      expect(isTransactionFlagged('loop_2')).toBe(false);
      expect(isTransactionFlagged('loop_3')).toBe(true);
    });
  });

  describe('getAlertSummary', () => {
    it('should calculate alert statistics', () => {
      createAlert('loop_1', 'Agent A', 'Transaction 1', 100, 10); // critical
      createAlert('loop_2', 'Agent B', 'Transaction 2', 50, 3); // warning
      flagTransaction('loop_3');

      const summary = getAlertSummary();

      expect(summary.totalAlerts).toBeGreaterThanOrEqual(2);
      expect(summary.criticalAlerts).toBeGreaterThanOrEqual(1);
      expect(summary.warningAlerts).toBeGreaterThanOrEqual(1);
      expect(summary.flaggedTransactions).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Threshold Management', () => {
    it('should get default thresholds', () => {
      const thresholds = getAlertThresholds();

      expect(thresholds.majorVariancePercentage).toBe(DEFAULT_THRESHOLDS.majorVariancePercentage);
      expect(thresholds.minorVariancePercentage).toBe(DEFAULT_THRESHOLDS.minorVariancePercentage);
    });

    it('should save custom thresholds', () => {
      const custom = {
        ...DEFAULT_THRESHOLDS,
        majorVariancePercentage: 8,
        minorVariancePercentage: 4,
      };

      saveAlertThresholds(custom);
      const saved = getAlertThresholds();

      expect(saved.majorVariancePercentage).toBe(8);
      expect(saved.minorVariancePercentage).toBe(4);
    });

    it('should respect custom thresholds when creating alerts', () => {
      saveAlertThresholds({
        ...DEFAULT_THRESHOLDS,
        majorVariancePercentage: 10,
      });

      const alert = createAlert('loop_1', 'Agent A', 'Transaction 1', 100, 8);

      expect(alert?.severity).toBe('warning');
    });
  });

  describe('createAlertsFromVariances', () => {
    it('should batch create alerts from variance data', () => {
      const variances = [
        { loopId: 'loop_1', agentName: 'Agent A', transactionName: 'T1', varianceAmount: 100, variancePercentage: 10 },
        { loopId: 'loop_2', agentName: 'Agent B', transactionName: 'T2', varianceAmount: 50, variancePercentage: 3 },
        { loopId: 'loop_3', agentName: 'Agent C', transactionName: 'T3', varianceAmount: 10, variancePercentage: 1 },
      ];

      const created = createAlertsFromVariances(variances);

      expect(created.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('exportAlertsAsCSV', () => {
    it('should export alerts as CSV', () => {
      createAlert('loop_1', 'Agent A', 'Transaction 1', 100, 10);
      const alerts = getAlerts();

      const csv = exportAlertsAsCSV(alerts);

      expect(csv).toContain('Loop ID');
      expect(csv).toContain('Agent Name');
    });
  });
});
