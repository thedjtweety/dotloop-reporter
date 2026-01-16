/**
 * Variance Alert System
 * Automated detection and flagging of problematic variances
 */

export interface AlertThresholds {
  majorVariancePercentage: number; // e.g., 5 for 5%
  minorVariancePercentage: number; // e.g., 2 for 2%
  enableAutoFlag: boolean;
  autoFlagMajor: boolean;
  autoFlagMinor: boolean;
}

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface VarianceAlert {
  id: string;
  loopId: string;
  agentName: string;
  transactionName: string;
  varianceAmount: number;
  variancePercentage: number;
  severity: AlertSeverity;
  reason: string;
  flagged: boolean;
  dismissed: boolean;
  createdAt: string;
  dismissedAt?: string;
  dismissedBy?: string;
}

export interface AlertSummary {
  totalAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  infoAlerts: number;
  flaggedTransactions: number;
  dismissedAlerts: number;
  activeAlerts: number;
}

// Storage Keys
const ALERTS_KEY = 'dotloop_variance_alerts';
const THRESHOLDS_KEY = 'dotloop_alert_thresholds';
const FLAGGED_TRANSACTIONS_KEY = 'dotloop_flagged_transactions';

// Default thresholds
export const DEFAULT_THRESHOLDS: AlertThresholds = {
  majorVariancePercentage: 5,
  minorVariancePercentage: 2,
  enableAutoFlag: true,
  autoFlagMajor: true,
  autoFlagMinor: false,
};

/**
 * Get alert thresholds
 */
export function getAlertThresholds(): AlertThresholds {
  const stored = localStorage.getItem(THRESHOLDS_KEY);
  return stored ? JSON.parse(stored) : DEFAULT_THRESHOLDS;
}

/**
 * Save alert thresholds
 */
export function saveAlertThresholds(thresholds: AlertThresholds): void {
  localStorage.setItem(THRESHOLDS_KEY, JSON.stringify(thresholds));
}

/**
 * Determine alert severity based on variance percentage
 */
function determineSeverity(variancePercentage: number, thresholds: AlertThresholds): AlertSeverity {
  const absVariance = Math.abs(variancePercentage);

  if (absVariance >= thresholds.majorVariancePercentage) {
    return 'critical';
  } else if (absVariance >= thresholds.minorVariancePercentage) {
    return 'warning';
  }
  return 'info';
}

/**
 * Create a variance alert
 */
export function createAlert(
  loopId: string,
  agentName: string,
  transactionName: string,
  varianceAmount: number,
  variancePercentage: number
): VarianceAlert | null {
  const thresholds = getAlertThresholds();
  const severity = determineSeverity(variancePercentage, thresholds);

  // Only create alert if variance exceeds minor threshold
  if (Math.abs(variancePercentage) < thresholds.minorVariancePercentage) {
    return null;
  }

  const alert: VarianceAlert = {
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    loopId,
    agentName,
    transactionName,
    varianceAmount,
    variancePercentage,
    severity,
    reason: `Variance of ${Math.abs(variancePercentage).toFixed(2)}% detected`,
    flagged: thresholds.enableAutoFlag && (severity === 'critical' ? thresholds.autoFlagMajor : thresholds.autoFlagMinor),
    dismissed: false,
    createdAt: new Date().toISOString(),
  };

  // Save alert
  const alerts = getAlerts();
  alerts.push(alert);
  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));

  // Auto-flag if enabled
  if (alert.flagged) {
    flagTransaction(loopId);
  }

  return alert;
}

/**
 * Get all alerts
 */
export function getAlerts(): VarianceAlert[] {
  const stored = localStorage.getItem(ALERTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Get active (non-dismissed) alerts
 */
export function getActiveAlerts(): VarianceAlert[] {
  const alerts = getAlerts();
  return alerts.filter((a) => !a.dismissed);
}

/**
 * Get alerts for a specific loop
 */
export function getAlertsByLoop(loopId: string): VarianceAlert[] {
  const alerts = getAlerts();
  return alerts.filter((a) => a.loopId === loopId);
}

/**
 * Get alerts for a specific agent
 */
export function getAlertsByAgent(agentName: string): VarianceAlert[] {
  const alerts = getAlerts();
  return alerts.filter((a) => a.agentName === agentName);
}

/**
 * Get alerts by severity
 */
export function getAlertsBySeverity(severity: AlertSeverity): VarianceAlert[] {
  const alerts = getAlerts();
  return alerts.filter((a) => a.severity === severity && !a.dismissed);
}

/**
 * Dismiss an alert
 */
export function dismissAlert(alertId: string, dismissedBy: string): VarianceAlert | null {
  const alerts = getAlerts();
  const alert = alerts.find((a) => a.id === alertId);

  if (!alert) return null;

  alert.dismissed = true;
  alert.dismissedAt = new Date().toISOString();
  alert.dismissedBy = dismissedBy;

  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));

  return alert;
}

/**
 * Dismiss multiple alerts
 */
export function dismissAlerts(alertIds: string[], dismissedBy: string): number {
  const alerts = getAlerts();
  let count = 0;

  alertIds.forEach((id) => {
    const alert = alerts.find((a) => a.id === id);
    if (alert) {
      alert.dismissed = true;
      alert.dismissedAt = new Date().toISOString();
      alert.dismissedBy = dismissedBy;
      count++;
    }
  });

  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));

  return count;
}

/**
 * Flag a transaction for review
 */
export function flagTransaction(loopId: string): void {
  const flagged = getFlaggedTransactions();
  if (!flagged.includes(loopId)) {
    flagged.push(loopId);
    localStorage.setItem(FLAGGED_TRANSACTIONS_KEY, JSON.stringify(flagged));
  }
}

/**
 * Unflag a transaction
 */
export function unflagTransaction(loopId: string): void {
  const flagged = getFlaggedTransactions();
  const index = flagged.indexOf(loopId);
  if (index > -1) {
    flagged.splice(index, 1);
    localStorage.setItem(FLAGGED_TRANSACTIONS_KEY, JSON.stringify(flagged));
  }
}

/**
 * Get flagged transactions
 */
export function getFlaggedTransactions(): string[] {
  const stored = localStorage.getItem(FLAGGED_TRANSACTIONS_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Check if transaction is flagged
 */
export function isTransactionFlagged(loopId: string): boolean {
  const flagged = getFlaggedTransactions();
  return flagged.includes(loopId);
}

/**
 * Flag multiple transactions
 */
export function flagTransactions(loopIds: string[]): number {
  const flagged = getFlaggedTransactions();
  let count = 0;

  loopIds.forEach((id) => {
    if (!flagged.includes(id)) {
      flagged.push(id);
      count++;
    }
  });

  localStorage.setItem(FLAGGED_TRANSACTIONS_KEY, JSON.stringify(flagged));

  return count;
}

/**
 * Unflag multiple transactions
 */
export function unflagTransactions(loopIds: string[]): number {
  const flagged = getFlaggedTransactions();
  let count = 0;

  loopIds.forEach((id) => {
    const index = flagged.indexOf(id);
    if (index > -1) {
      flagged.splice(index, 1);
      count++;
    }
  });

  localStorage.setItem(FLAGGED_TRANSACTIONS_KEY, JSON.stringify(flagged));

  return count;
}

/**
 * Get alert summary statistics
 */
export function getAlertSummary(): AlertSummary {
  const alerts = getAlerts();
  const flagged = getFlaggedTransactions();

  const summary: AlertSummary = {
    totalAlerts: alerts.length,
    criticalAlerts: alerts.filter((a) => a.severity === 'critical').length,
    warningAlerts: alerts.filter((a) => a.severity === 'warning').length,
    infoAlerts: alerts.filter((a) => a.severity === 'info').length,
    flaggedTransactions: flagged.length,
    dismissedAlerts: alerts.filter((a) => a.dismissed).length,
    activeAlerts: alerts.filter((a) => !a.dismissed).length,
  };

  return summary;
}

/**
 * Batch create alerts from variance data
 */
export function createAlertsFromVariances(
  variances: Array<{
    loopId: string;
    agentName: string;
    transactionName: string;
    varianceAmount: number;
    variancePercentage: number;
  }>
): VarianceAlert[] {
  const createdAlerts: VarianceAlert[] = [];

  variances.forEach((variance) => {
    const alert = createAlert(
      variance.loopId,
      variance.agentName,
      variance.transactionName,
      variance.varianceAmount,
      variance.variancePercentage
    );

    if (alert) {
      createdAlerts.push(alert);
    }
  });

  return createdAlerts;
}

/**
 * Export alerts as CSV
 */
export function exportAlertsAsCSV(alerts: VarianceAlert[]): string {
  const headers = [
    'Loop ID',
    'Agent Name',
    'Transaction Name',
    'Variance Amount',
    'Variance Percentage',
    'Severity',
    'Reason',
    'Flagged',
    'Dismissed',
    'Created At',
  ];

  const rows = alerts.map((alert) => [
    alert.loopId,
    alert.agentName,
    alert.transactionName,
    alert.varianceAmount.toFixed(2),
    alert.variancePercentage.toFixed(2),
    alert.severity,
    `"${alert.reason.replace(/"/g, '""')}"`,
    alert.flagged ? 'Yes' : 'No',
    alert.dismissed ? 'Yes' : 'No',
    alert.createdAt,
  ]);

  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

  return csvContent;
}

/**
 * Clear all alerts and flags (for testing)
 */
export function clearAllAlerts(): void {
  localStorage.removeItem(ALERTS_KEY);
  localStorage.removeItem(FLAGGED_TRANSACTIONS_KEY);
}
