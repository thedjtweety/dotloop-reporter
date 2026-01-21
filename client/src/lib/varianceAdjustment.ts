/**
 * Variance Adjustment and Audit Trail Management
 * Handles manual commission adjustments with complete audit trail tracking
 */

export type AdjustmentReason =
  | 'data_error'
  | 'calculation_error'
  | 'special_circumstance'
  | 'dispute_resolution'
  | 'manual_override'
  | 'other';

export interface VarianceAdjustment {
  id: string;
  loopId: string;
  agentName: string;
  originalValue: number;
  adjustedValue: number;
  adjustmentAmount: number;
  reason: AdjustmentReason;
  notes: string;
  createdAt: string;
  createdBy: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  adjustmentId: string;
  action: 'created' | 'approved' | 'rejected' | 'reverted';
  actor: string;
  timestamp: string;
  details: string;
  previousValue?: number;
  newValue?: number;
}

export interface AdjustmentSummary {
  totalAdjustments: number;
  totalAdjustmentAmount: number;
  pendingApprovals: number;
  approvedAdjustments: number;
  rejectedAdjustments: number;
  averageAdjustmentAmount: number;
  byReason: Record<AdjustmentReason, number>;
}

// Storage Keys
const ADJUSTMENTS_KEY = 'dotloop_variance_adjustments';
const AUDIT_LOG_KEY = 'dotloop_audit_log';

/**
 * Create a new variance adjustment
 */
export function createAdjustment(
  loopId: string,
  agentName: string,
  originalValue: number,
  adjustedValue: number,
  reason: AdjustmentReason,
  notes: string,
  createdBy: string
): VarianceAdjustment {
  const adjustment: VarianceAdjustment = {
    id: `adj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    loopId,
    agentName,
    originalValue,
    adjustedValue,
    adjustmentAmount: adjustedValue - originalValue,
    reason,
    notes,
    createdAt: new Date().toISOString(),
    createdBy,
    status: 'pending',
  };

  // Log the creation
  logAuditEntry(adjustment.id, 'created', createdBy, `Created adjustment: ${reason}`, undefined, adjustedValue);

  return adjustment;
}

/**
 * Get all adjustments from storage
 */
export function getAdjustments(): VarianceAdjustment[] {
  const stored = localStorage.getItem(ADJUSTMENTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Save adjustments to storage
 */
export function saveAdjustments(adjustments: VarianceAdjustment[]): void {
  localStorage.setItem(ADJUSTMENTS_KEY, JSON.stringify(adjustments));
}

/**
 * Get adjustment by ID
 */
export function getAdjustmentById(id: string): VarianceAdjustment | null {
  const adjustments = getAdjustments();
  return adjustments.find((a) => a.id === id) || null;
}

/**
 * Get adjustments for a specific loop
 */
export function getAdjustmentsByLoop(loopId: string): VarianceAdjustment[] {
  const adjustments = getAdjustments();
  return adjustments.filter((a) => a.loopId === loopId);
}

/**
 * Get adjustments for a specific agent
 */
export function getAdjustmentsByAgent(agentName: string): VarianceAdjustment[] {
  const adjustments = getAdjustments();
  return adjustments.filter((a) => a.agentName === agentName);
}

/**
 * Approve an adjustment
 */
export function approveAdjustment(adjustmentId: string, approvedBy: string): VarianceAdjustment | null {
  const adjustments = getAdjustments();
  const adjustment = adjustments.find((a) => a.id === adjustmentId);

  if (!adjustment) return null;

  adjustment.status = 'approved';
  adjustment.approvedBy = approvedBy;
  adjustment.approvedAt = new Date().toISOString();

  saveAdjustments(adjustments);
  logAuditEntry(adjustmentId, 'approved', approvedBy, 'Adjustment approved', adjustment.adjustedValue, adjustment.adjustedValue);

  return adjustment;
}

/**
 * Reject an adjustment
 */
export function rejectAdjustment(adjustmentId: string, rejectedBy: string, reason: string): VarianceAdjustment | null {
  const adjustments = getAdjustments();
  const adjustment = adjustments.find((a) => a.id === adjustmentId);

  if (!adjustment) return null;

  adjustment.status = 'rejected';
  saveAdjustments(adjustments);
  logAuditEntry(adjustmentId, 'rejected', rejectedBy, `Adjustment rejected: ${reason}`, adjustment.adjustedValue, adjustment.originalValue);

  return adjustment;
}

/**
 * Revert an adjustment (delete it and restore original value)
 */
export function revertAdjustment(adjustmentId: string, revertedBy: string): boolean {
  const adjustments = getAdjustments();
  const index = adjustments.findIndex((a) => a.id === adjustmentId);

  if (index === -1) return false;

  const adjustment = adjustments[index];
  adjustments.splice(index, 1);
  saveAdjustments(adjustments);
  logAuditEntry(adjustmentId, 'reverted', revertedBy, 'Adjustment reverted', adjustment.adjustedValue, adjustment.originalValue);

  return true;
}

/**
 * Update an adjustment
 */
export function updateAdjustment(
  adjustmentId: string,
  updates: Partial<VarianceAdjustment>,
  updatedBy: string
): VarianceAdjustment | null {
  const adjustments = getAdjustments();
  const adjustment = adjustments.find((a) => a.id === adjustmentId);

  if (!adjustment) return null;

  const oldValue = adjustment.adjustedValue;
  Object.assign(adjustment, updates);

  if (updates.adjustedValue) {
    adjustment.adjustmentAmount = updates.adjustedValue - adjustment.originalValue;
  }

  saveAdjustments(adjustments);
  logAuditEntry(adjustmentId, 'created', updatedBy, 'Adjustment updated', oldValue, adjustment.adjustedValue);

  return adjustment;
}

/**
 * Get adjustment summary statistics
 */
export function getAdjustmentSummary(): AdjustmentSummary {
  const adjustments = getAdjustments();

  const summary: AdjustmentSummary = {
    totalAdjustments: adjustments.length,
    totalAdjustmentAmount: 0,
    pendingApprovals: 0,
    approvedAdjustments: 0,
    rejectedAdjustments: 0,
    averageAdjustmentAmount: 0,
    byReason: {
      data_error: 0,
      calculation_error: 0,
      special_circumstance: 0,
      dispute_resolution: 0,
      manual_override: 0,
      other: 0,
    },
  };

  adjustments.forEach((adj) => {
    summary.totalAdjustmentAmount += adj.adjustmentAmount;

    if (adj.status === 'pending') summary.pendingApprovals++;
    if (adj.status === 'approved') summary.approvedAdjustments++;
    if (adj.status === 'rejected') summary.rejectedAdjustments++;

    summary.byReason[adj.reason]++;
  });

  if (adjustments.length > 0) {
    summary.averageAdjustmentAmount = summary.totalAdjustmentAmount / adjustments.length;
  }

  return summary;
}

/**
 * Log an audit entry
 */
function logAuditEntry(
  adjustmentId: string,
  action: 'created' | 'approved' | 'rejected' | 'reverted',
  actor: string,
  details: string,
  previousValue?: number,
  newValue?: number
): void {
  const logs = getAuditLog();
  const entry: AuditLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    adjustmentId,
    action,
    actor,
    timestamp: new Date().toISOString(),
    details,
    previousValue,
    newValue,
  };

  logs.push(entry);
  localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(logs));
}

/**
 * Get audit log
 */
export function getAuditLog(): AuditLogEntry[] {
  const stored = localStorage.getItem(AUDIT_LOG_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Get audit log entries for a specific adjustment
 */
export function getAuditLogForAdjustment(adjustmentId: string): AuditLogEntry[] {
  const logs = getAuditLog();
  return logs.filter((log) => log.adjustmentId === adjustmentId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Export adjustments as CSV
 */
export function exportAdjustmentsAsCSV(adjustments: VarianceAdjustment[]): string {
  const headers = [
    'Loop ID',
    'Agent Name',
    'Original Value',
    'Adjusted Value',
    'Adjustment Amount',
    'Reason',
    'Notes',
    'Status',
    'Created By',
    'Created At',
    'Approved By',
    'Approved At',
  ];

  const rows = adjustments.map((adj) => [
    adj.loopId,
    adj.agentName,
    adj.originalValue.toFixed(2),
    adj.adjustedValue.toFixed(2),
    adj.adjustmentAmount.toFixed(2),
    adj.reason,
    `"${adj.notes.replace(/"/g, '""')}"`,
    adj.status,
    adj.createdBy,
    adj.createdAt,
    adj.approvedBy || '',
    adj.approvedAt || '',
  ]);

  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

  return csvContent;
}

/**
 * Export audit log as CSV
 */
export function exportAuditLogAsCSV(logs: AuditLogEntry[]): string {
  const headers = ['Timestamp', 'Adjustment ID', 'Action', 'Actor', 'Details', 'Previous Value', 'New Value'];

  const rows = logs.map((log) => [
    log.timestamp,
    log.adjustmentId,
    log.action,
    log.actor,
    `"${log.details.replace(/"/g, '""')}"`,
    log.previousValue?.toFixed(2) || '',
    log.newValue?.toFixed(2) || '',
  ]);

  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

  return csvContent;
}

/**
 * Clear all adjustments and audit logs (for testing)
 */
export function clearAllAdjustments(): void {
  localStorage.removeItem(ADJUSTMENTS_KEY);
  localStorage.removeItem(AUDIT_LOG_KEY);
}
