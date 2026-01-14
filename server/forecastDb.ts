import { getDb } from './db';
import { forecastSnapshots, forecastResults } from '../drizzle/schema';
import { eq, and, desc, gte, sql } from 'drizzle-orm';
import { ForecastedDeal } from '@/lib/projectionUtils';

/**
 * Store a forecast snapshot in the database
 */
export async function saveForecastSnapshot(
  tenantId: number,
  uploadId: number | undefined,
  timeframe: number,
  projectedDeals: ForecastedDeal[],
  summary: {
    totalDeals: number;
    avgProbability: number;
    projectedCommission: number;
    pipelineCount: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const snapshotId = `forecast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const totalRevenue = projectedDeals.reduce((sum, deal) => sum + deal.price, 0);
  
  await db.insert(forecastSnapshots).values({
    id: snapshotId,
    tenantId,
    uploadId,
    timeframe,
    projectedDeals: projectedDeals.length,
    projectedRevenue: totalRevenue,
    projectedCommission: Math.round(summary.projectedCommission),
    avgProbability: Math.round(summary.avgProbability),
    confidenceLevel: 100, // Default to 100% for now
    pipelineCount: summary.pipelineCount,
    forecastedDealsJson: JSON.stringify(projectedDeals),
  });
  
  return snapshotId;
}

/**
 * Get all forecast snapshots for a tenant
 */
export async function getForecastSnapshots(
  tenantId: number,
  timeframe?: number,
  limit: number = 50
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  let whereCondition: any = eq(forecastSnapshots.tenantId, tenantId);
  
  if (timeframe) {
    whereCondition = and(
      eq(forecastSnapshots.tenantId, tenantId),
      eq(forecastSnapshots.timeframe, timeframe)
    );
  }
  
  return db
    .select()
    .from(forecastSnapshots)
    .where(whereCondition)
    .orderBy(desc(forecastSnapshots.snapshotDate))
    .limit(limit);
}

/**
 * Calculate forecast accuracy by comparing snapshot to actual results
 */
export async function calculateForecastAccuracy(
  snapshotId: string,
  actualDeals: number,
  actualRevenue: number,
  actualCommission: number
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  // Get the snapshot
  const snapshot = await db
    .select()
    .from(forecastSnapshots)
    .where(eq(forecastSnapshots.id, snapshotId))
    .limit(1);
  
  if (!snapshot || snapshot.length === 0) {
    throw new Error(`Forecast snapshot ${snapshotId} not found`);
  }
  
  const snap = snapshot[0];
  
  // Calculate variances
  const dealsVariance = snap.projectedDeals - actualDeals;
  const revenueVariance = snap.projectedRevenue - actualRevenue;
  const commissionVariance = snap.projectedCommission - actualCommission;
  
  // Calculate accuracy percentages (0-100, where 100 is perfect)
  const dealsAccuracy = Math.max(0, 100 - Math.abs((dealsVariance / Math.max(snap.projectedDeals, 1)) * 100));
  const revenueAccuracy = Math.max(0, 100 - Math.abs((revenueVariance / Math.max(snap.projectedRevenue, 1)) * 100));
  const commissionAccuracy = Math.max(0, 100 - Math.abs((commissionVariance / Math.max(snap.projectedCommission, 1)) * 100));
  
  // Calculate hit rate (percentage of projected deals that actually closed)
  const hitRate = Math.round((actualDeals / Math.max(snap.projectedDeals || 1, 1)) * 100);
  
  // Calculate MAPE (Mean Absolute Percentage Error)
  const mape = Math.round(
    ((Math.abs(dealsVariance) / Math.max(snap.projectedDeals, 1)) * 100 +
     (Math.abs(revenueVariance) / Math.max(snap.projectedRevenue, 1)) * 100 +
     (Math.abs(commissionVariance) / Math.max(snap.projectedCommission, 1)) * 100) / 3
  );
  
  // Store the result
  const resultId = `forecast-result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  await db.insert(forecastResults).values({
    id: resultId,
    snapshotId,
    tenantId: snap.tenantId,
    timeframe: snap.timeframe,
    resultDate: new Date().toISOString(),
    actualDeals,
    actualRevenue,
    actualCommission,
    dealsVariance,
    revenueVariance,
    commissionVariance,
    dealsAccuracy: Math.round(dealsAccuracy),
    revenueAccuracy: Math.round(revenueAccuracy),
    commissionAccuracy: Math.round(commissionAccuracy),
    hitRate,
    mape,
  });
  
  return {
    resultId,
    dealsAccuracy: Math.round(dealsAccuracy),
    revenueAccuracy: Math.round(revenueAccuracy),
    commissionAccuracy: Math.round(commissionAccuracy),
    hitRate,
    mape,
  };
}

/**
 * Get forecast accuracy metrics for a tenant
 */
export async function getForecastAccuracyMetrics(tenantId: number, timeframe?: number, daysBack: number = 90) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  const cutoffDateStr = cutoffDate.toISOString();
  
  let whereCondition: any = and(
    eq(forecastResults.tenantId, tenantId),
    gte(forecastResults.resultDate, cutoffDateStr)
  );
  
  if (timeframe) {
    whereCondition = and(
      eq(forecastResults.tenantId, tenantId),
      gte(forecastResults.resultDate, cutoffDateStr),
      eq(forecastResults.timeframe, timeframe)
    );
  }
  
  const results = await db
    .select()
    .from(forecastResults)
    .where(whereCondition)
    .orderBy(desc(forecastResults.resultDate));
  
  if (results.length === 0) {
    return null;
  }
  
  // Calculate averages
  const avgDealsAccuracy = Math.round(
    results.reduce((sum: number, r: any) => sum + (r.dealsAccuracy || 0), 0) / results.length
  );
  const avgRevenueAccuracy = Math.round(
    results.reduce((sum: number, r: any) => sum + (r.revenueAccuracy || 0), 0) / results.length
  );
  const avgCommissionAccuracy = Math.round(
    results.reduce((sum: number, r: any) => sum + (r.commissionAccuracy || 0), 0) / results.length
  );
  const avgHitRate = Math.round(
    results.reduce((sum: number, r: any) => sum + (r.hitRate || 0), 0) / results.length
  );
  const avgMape = Math.round(
    results.reduce((sum: number, r: any) => sum + (r.mape || 0), 0) / results.length
  );
  
  return {
    totalForecasts: results.length,
    avgDealsAccuracy,
    avgRevenueAccuracy,
    avgCommissionAccuracy,
    avgHitRate,
    avgMape,
    byTimeframe: {
      '30': results.filter((r: any) => r.timeframe === 30),
      '60': results.filter((r: any) => r.timeframe === 60),
      '90': results.filter((r: any) => r.timeframe === 90),
    },
  };
}

/**
 * Get forecast accuracy trend over time
 */
export async function getForecastAccuracyTrend(tenantId: number, timeframe?: number, limit: number = 12) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  let whereCondition: any = eq(forecastResults.tenantId, tenantId);
  
  if (timeframe) {
    whereCondition = and(
      eq(forecastResults.tenantId, tenantId),
      eq(forecastResults.timeframe, timeframe)
    );
  }
  
  return db
    .select()
    .from(forecastResults)
    .where(whereCondition)
    .orderBy(desc(forecastResults.resultDate))
    .limit(limit);
}
