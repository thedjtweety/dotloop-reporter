/**
 * Soft Delete Utilities for Audit Trail
 * 
 * Implements soft delete functionality to:
 * - Maintain data integrity and audit trails
 * - Allow data recovery
 * - Track deletion history
 * - Support compliance requirements
 */

export interface SoftDeleteRecord {
  id: string;
  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: string | null;
  deletionReason: string | null;
}

export interface AuditLog {
  id: string;
  recordId: string;
  action: 'create' | 'update' | 'delete' | 'restore';
  userId: string;
  timestamp: Date;
  changes: Record<string, any>;
  reason?: string;
}

/**
 * Soft Delete Manager
 * Handles soft delete operations and audit logging
 */
export class SoftDeleteManager {
  private auditLogs: AuditLog[] = [];
  private deletedRecords: Map<string, SoftDeleteRecord> = new Map();

  /**
   * Soft delete a record
   */
  softDelete(
    recordId: string,
    userId: string,
    reason?: string
  ): SoftDeleteRecord {
    const deletedRecord: SoftDeleteRecord = {
      id: recordId,
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId,
      deletionReason: reason || null,
    };

    this.deletedRecords.set(recordId, deletedRecord);

    // Log the deletion
    this.logAudit({
      id: `audit-${Date.now()}`,
      recordId,
      action: 'delete',
      userId,
      timestamp: new Date(),
      changes: { isDeleted: true, deletedAt: deletedRecord.deletedAt },
      reason,
    });

    return deletedRecord;
  }

  /**
   * Restore a soft-deleted record
   */
  restore(recordId: string, userId: string, reason?: string): SoftDeleteRecord {
    const record = this.deletedRecords.get(recordId);

    if (!record) {
      throw new Error(`Record ${recordId} not found or already restored`);
    }

    const restoredRecord: SoftDeleteRecord = {
      ...record,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      deletionReason: null,
    };

    this.deletedRecords.set(recordId, restoredRecord);

    // Log the restoration
    this.logAudit({
      id: `audit-${Date.now()}`,
      recordId,
      action: 'restore',
      userId,
      timestamp: new Date(),
      changes: { isDeleted: false, deletedAt: null },
      reason,
    });

    return restoredRecord;
  }

  /**
   * Check if record is deleted
   */
  isDeleted(recordId: string): boolean {
    const record = this.deletedRecords.get(recordId);
    return record?.isDeleted ?? false;
  }

  /**
   * Get soft delete record
   */
  getDeletedRecord(recordId: string): SoftDeleteRecord | undefined {
    return this.deletedRecords.get(recordId);
  }

  /**
   * Get all deleted records
   */
  getAllDeletedRecords(): SoftDeleteRecord[] {
    return Array.from(this.deletedRecords.values()).filter(r => r.isDeleted);
  }

  /**
   * Get all records (including deleted)
   */
  getAllRecords(): SoftDeleteRecord[] {
    return Array.from(this.deletedRecords.values());
  }

  /**
   * Permanently delete a record (hard delete)
   */
  permanentlyDelete(recordId: string, userId: string): void {
    const record = this.deletedRecords.get(recordId);

    if (!record) {
      throw new Error(`Record ${recordId} not found`);
    }

    // Log permanent deletion
    this.logAudit({
      id: `audit-${Date.now()}`,
      recordId,
      action: 'delete',
      userId,
      timestamp: new Date(),
      changes: { permanentlyDeleted: true },
      reason: 'Permanent deletion',
    });

    this.deletedRecords.delete(recordId);
  }

  /**
   * Log an audit entry
   */
  private logAudit(log: AuditLog): void {
    this.auditLogs.push(log);
  }

  /**
   * Get audit log for a record
   */
  getAuditLog(recordId: string): AuditLog[] {
    return this.auditLogs.filter(log => log.recordId === recordId);
  }

  /**
   * Get all audit logs
   */
  getAllAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  /**
   * Get audit logs by action
   */
  getAuditLogsByAction(action: AuditLog['action']): AuditLog[] {
    return this.auditLogs.filter(log => log.action === action);
  }

  /**
   * Get audit logs by user
   */
  getAuditLogsByUser(userId: string): AuditLog[] {
    return this.auditLogs.filter(log => log.userId === userId);
  }

  /**
   * Get deletion history for a record
   */
  getDeletionHistory(recordId: string): AuditLog[] {
    return this.auditLogs.filter(
      log => log.recordId === recordId && (log.action === 'delete' || log.action === 'restore')
    );
  }

  /**
   * Get records deleted by a specific user
   */
  getRecordsDeletedBy(userId: string): SoftDeleteRecord[] {
    return Array.from(this.deletedRecords.values()).filter(r => r.deletedBy === userId);
  }

  /**
   * Get records deleted in a date range
   */
  getRecordsDeletedInRange(startDate: Date, endDate: Date): SoftDeleteRecord[] {
    return Array.from(this.deletedRecords.values()).filter(r => {
      if (!r.deletedAt) return false;
      return r.deletedAt >= startDate && r.deletedAt <= endDate;
    });
  }

  /**
   * Purge old deleted records (for compliance/storage)
   */
  purgeOldDeletedRecords(daysOld: number): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let purgedCount = 0;
    const recordsToDelete: string[] = [];

    this.deletedRecords.forEach((record, recordId) => {
      if (record.isDeleted && record.deletedAt && record.deletedAt < cutoffDate) {
        recordsToDelete.push(recordId);
        purgedCount++;
      }
    });

    recordsToDelete.forEach(id => this.deletedRecords.delete(id));
    return purgedCount;
  }

  /**
   * Get deletion statistics
   */
  getDeletionStats(): {
    totalDeleted: number;
    totalRestored: number;
    totalAuditLogs: number;
    deletionsByUser: Record<string, number>;
  } {
    const deletions = this.auditLogs.filter(log => log.action === 'delete');
    const restorations = this.auditLogs.filter(log => log.action === 'restore');

    const deletionsByUser: Record<string, number> = {};
    deletions.forEach((log) => {
      deletionsByUser[log.userId] = (deletionsByUser[log.userId] || 0) + 1;
    });

    return {
      totalDeleted: deletions.length,
      totalRestored: restorations.length,
      totalAuditLogs: this.auditLogs.length,
      deletionsByUser,
    };
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.auditLogs = [];
    this.deletedRecords.clear();
  }
}

/**
 * Soft delete filter for queries
 * Excludes deleted records by default
 */
export function filterDeletedRecords<T extends SoftDeleteRecord>(
  records: T[],
  includeDeleted: boolean = false
): T[] {
  if (includeDeleted) return records;
  return records.filter(r => !r.isDeleted);
}

/**
 * Soft delete query builder
 * Helps construct queries that respect soft deletes
 */
export class SoftDeleteQueryBuilder {
  private includeDeleted: boolean = false;

  /**
   * Include deleted records in query
   */
  withDeleted(): this {
    this.includeDeleted = true;
    return this;
  }

  /**
   * Only return deleted records
   */
  onlyDeleted(): this {
    this.includeDeleted = true;
    return this;
  }

  /**
   * Get the filter condition
   */
  getFilter(): Record<string, any> {
    if (this.includeDeleted) {
      return {}; // No filter, include all
    }
    return { isDeleted: false }; // Exclude deleted records
  }

  /**
   * Apply filter to records
   */
  apply<T extends SoftDeleteRecord>(records: T[]): T[] {
    if (this.includeDeleted) {
      return records;
    }
    return records.filter(r => !r.isDeleted);
  }
}
