/**
 * Upload Snapshot Database Operations
 * Handles storing and retrieving upload history with metrics snapshots
 */

import { getDb } from './db';
import { uploadSnapshots } from '../drizzle/schema';
import { eq, and, gte, desc, lt } from 'drizzle-orm';
import { DashboardMetrics } from '../client/src/lib/csvParser';

export interface UploadSnapshot {
  id: number;
  tenantId: number;
  uploadId: number;
  fileName: string;
  uploadedAt: string;
  totalTransactions: number;
  totalSalesVolume: number;
  averagePrice: number;
  totalCommission: number;
  closingRate: number;
  avgDaysToClose: number;
  activeListings: number;
  underContract: number;
  closedDeals: number;
  archivedDeals: number;
  totalCompanyDollar: number;
  buySideCommission: number;
  sellSideCommission: number;
  metricsJson: string;
  createdAt: string;
}

/**
 * Save a snapshot of upload metrics for historical comparison
 */
export async function createUploadSnapshot(
  tenantId: number,
  uploadId: number,
  fileName: string,
  uploadedAt: string,
  metrics: DashboardMetrics
): Promise<UploadSnapshot> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database connection not available');
  }

  const snapshot: typeof uploadSnapshots.$inferInsert = {
    tenantId,
    uploadId,
    fileName,
    uploadedAt: uploadedAt as any,
    totalTransactions: metrics.totalTransactions,
    totalSalesVolume: Math.round(metrics.totalSalesVolume),
    averagePrice: Math.round(metrics.averagePrice),
    totalCommission: Math.round(metrics.totalCommission),
    closingRate: Math.round(metrics.closingRate),
    avgDaysToClose: Math.round(metrics.averageDaysToClose),
    activeListings: metrics.activeListings,
    underContract: metrics.underContract,
    closedDeals: metrics.closed,
    archivedDeals: metrics.archived,
    totalCompanyDollar: Math.round(metrics.totalCompanyDollar),
    buySideCommission: 0,
    sellSideCommission: 0,
    metricsJson: JSON.stringify(metrics),
  };

  await db.insert(uploadSnapshots).values(snapshot);
  
  // Return the created snapshot
  return {
    id: 0,
    tenantId,
    uploadId,
    fileName,
    uploadedAt,
    totalTransactions: snapshot.totalTransactions,
    totalSalesVolume: snapshot.totalSalesVolume,
    averagePrice: snapshot.averagePrice,
    totalCommission: snapshot.totalCommission,
    closingRate: snapshot.closingRate,
    avgDaysToClose: snapshot.avgDaysToClose,
    activeListings: snapshot.activeListings,
    underContract: snapshot.underContract,
    closedDeals: snapshot.closedDeals,
    archivedDeals: snapshot.archivedDeals,
    totalCompanyDollar: snapshot.totalCompanyDollar,
    buySideCommission: snapshot.buySideCommission,
    sellSideCommission: snapshot.sellSideCommission,
    metricsJson: snapshot.metricsJson,
    createdAt: new Date().toISOString(),
  } as UploadSnapshot;
}

/**
 * Get all upload snapshots for a tenant within the last 90 days
 */
export async function getTenantUploadSnapshots(
  tenantId: number,
  limitCount: number = 50
): Promise<UploadSnapshot[]> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database connection not available');
  }

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const snapshots = await db
    .select()
    .from(uploadSnapshots)
    .where(
      and(
        eq(uploadSnapshots.tenantId, tenantId),
        gte(uploadSnapshots.uploadedAt, ninetyDaysAgo as any)
      )
    )
    .orderBy(desc(uploadSnapshots.uploadedAt));

  return snapshots.slice(0, limitCount) as UploadSnapshot[];
}

/**
 * Get a specific upload snapshot by ID
 */
export async function getUploadSnapshot(
  snapshotId: number,
  tenantId: number
): Promise<UploadSnapshot | null> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database connection not available');
  }

  const snapshot = await db
    .select()
    .from(uploadSnapshots)
    .where(
      and(
        eq(uploadSnapshots.id, snapshotId),
        eq(uploadSnapshots.tenantId, tenantId)
      )
    );

  return snapshot.length > 0 ? (snapshot[0] as UploadSnapshot) : null;
}

/**
 * Get the most recent upload snapshot for a tenant
 */
export async function getLatestUploadSnapshot(
  tenantId: number
): Promise<UploadSnapshot | null> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database connection not available');
  }

  const snapshot = await db
    .select()
    .from(uploadSnapshots)
    .where(eq(uploadSnapshots.tenantId, tenantId))
    .orderBy(desc(uploadSnapshots.uploadedAt));

  return snapshot.length > 0 ? (snapshot[0] as UploadSnapshot) : null;
}

/**
 * Delete upload snapshots older than 90 days
 * This should be run periodically via a cron job
 */
export async function deleteOldUploadSnapshots(
  tenantId?: number
): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database connection not available');
  }

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const whereClause = tenantId
    ? and(
        eq(uploadSnapshots.tenantId, tenantId),
        lt(uploadSnapshots.uploadedAt, ninetyDaysAgo as any)
      )
    : lt(uploadSnapshots.uploadedAt, ninetyDaysAgo as any);

  await db.delete(uploadSnapshots).where(whereClause);
  
  return 0; // Drizzle doesn't return row count for delete operations
}

/**
 * Compare two upload snapshots
 */
export function compareSnapshots(
  snapshot1: UploadSnapshot,
  snapshot2: UploadSnapshot
): Record<string, { current: number; previous: number; change: number; changePercent: number }> {
  const metrics = [
    'totalSalesVolume',
    'averagePrice',
    'totalCommission',
    'closingRate',
    'avgDaysToClose',
    'activeListings',
    'underContract',
    'closedDeals',
    'totalCompanyDollar',
    'buySideCommission',
    'sellSideCommission',
  ];

  const comparison: Record<string, any> = {};

  metrics.forEach((metric) => {
    const current = snapshot1[metric as keyof UploadSnapshot] as number;
    const previous = snapshot2[metric as keyof UploadSnapshot] as number;
    const change = current - previous;
    const changePercent = previous !== 0 ? (change / previous) * 100 : 0;

    comparison[metric] = {
      current,
      previous,
      change,
      changePercent,
    };
  });

  return comparison;
}
