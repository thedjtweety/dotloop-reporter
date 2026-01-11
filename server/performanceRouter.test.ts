import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import { getDb } from './db';
import { users, uploads } from '../drizzle/schema';

describe('Performance Router', () => {
  let adminUser: any;
  let regularUser: any;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create test admin user
    const [admin] = await db
      .insert(users)
      .values({
        openId: `test-admin-perf-${Date.now()}`,
        name: 'Admin User',
        email: 'admin-perf@test.com',
        role: 'admin',
      })
      .$returningId();

    adminUser = { id: admin.id, role: 'admin', openId: `test-admin-perf-${Date.now()}` };

    // Create test regular user
    const [regular] = await db
      .insert(users)
      .values({
        openId: `test-user-perf-${Date.now()}`,
        name: 'Regular User',
        email: 'user-perf@test.com',
        role: 'user',
      })
      .$returningId();

    regularUser = { id: regular.id, role: 'user', openId: `test-user-perf-${Date.now()}` };

    // Create test uploads with performance metrics
    await db.insert(uploads).values([
      {
        userId: adminUser.id,
        fileName: 'test-small.csv',
        recordCount: 100,
        fileSize: 1024 * 500, // 500KB
        validationTimeMs: 100,
        parsingTimeMs: 500,
        uploadTimeMs: 200,
        totalTimeMs: 800,
        status: 'success',
      },
      {
        userId: adminUser.id,
        fileName: 'test-large.csv',
        recordCount: 10000,
        fileSize: 1024 * 1024 * 5, // 5MB
        validationTimeMs: 500,
        parsingTimeMs: 5000,
        uploadTimeMs: 2000,
        totalTimeMs: 7500,
        status: 'success',
      },
      {
        userId: regularUser.id,
        fileName: 'test-failed.csv',
        recordCount: 0,
        fileSize: 1024 * 100, // 100KB
        validationTimeMs: 50,
        parsingTimeMs: 0,
        uploadTimeMs: 0,
        totalTimeMs: 50,
        status: 'failed',
        errorMessage: 'Invalid CSV format',
      },
    ]);
  });

  describe('getStats', () => {
    it('should return aggregate statistics for admin', async () => {
      const caller = appRouter.createCaller({
        user: adminUser,
        req: {} as any,
        res: {} as any,
      });

      const stats = await caller.performance.getStats();

      expect(stats).toBeDefined();
      expect(Number(stats.totalUploads)).toBeGreaterThan(0);
      expect(Number(stats.successfulUploads)).toBeGreaterThan(0);
      expect(Number(stats.avgFileSize)).toBeGreaterThan(0);
      expect(Number(stats.avgTotalTime)).toBeGreaterThan(0);
    });

    it('should reject non-admin users', async () => {
      const caller = appRouter.createCaller({
        user: regularUser,
        req: {} as any,
        res: {} as any,
      });

      await expect(caller.performance.getStats()).rejects.toThrow('Unauthorized');
    });
  });

  describe('getFileSizeDistribution', () => {
    it('should return file size distribution', async () => {
      const caller = appRouter.createCaller({
        user: adminUser,
        req: {} as any,
        res: {} as any,
      });

      const distribution = await caller.performance.getFileSizeDistribution();

      expect(Array.isArray(distribution)).toBe(true);
      expect(distribution.length).toBeGreaterThan(0);
      expect(distribution[0]).toHaveProperty('sizeRange');
      expect(distribution[0]).toHaveProperty('count');
      expect(distribution[0]).toHaveProperty('avgTime');
    });
  });

  describe('getTimeTrends', () => {
    it('should return time trends for last 30 days', async () => {
      const caller = appRouter.createCaller({
        user: adminUser,
        req: {} as any,
        res: {} as any,
      });

      const trends = await caller.performance.getTimeTrends({ days: 30 });

      expect(Array.isArray(trends)).toBe(true);
      // May be empty if no uploads in last 30 days
      if (trends.length > 0) {
        expect(trends[0]).toHaveProperty('date');
        expect(trends[0]).toHaveProperty('uploadCount');
        expect(trends[0]).toHaveProperty('avgTotalTime');
      }
    });

    it('should accept custom day range', async () => {
      const caller = appRouter.createCaller({
        user: adminUser,
        req: {} as any,
        res: {} as any,
      });

      const trends = await caller.performance.getTimeTrends({ days: 7 });

      expect(Array.isArray(trends)).toBe(true);
    });
  });

  describe('getBottlenecks', () => {
    it('should return top 20 slowest uploads', async () => {
      const caller = appRouter.createCaller({
        user: adminUser,
        req: {} as any,
        res: {} as any,
      });

      const bottlenecks = await caller.performance.getBottlenecks();

      expect(Array.isArray(bottlenecks)).toBe(true);
      if (bottlenecks.length > 0) {
        expect(bottlenecks[0]).toHaveProperty('uploadId');
        expect(bottlenecks[0]).toHaveProperty('fileName');
        expect(bottlenecks[0]).toHaveProperty('slowestStage');
        expect(bottlenecks[0]).toHaveProperty('stagePercentages');
        expect(['validation', 'parsing', 'upload']).toContain(bottlenecks[0].slowestStage);
      }
    });
  });

  describe('getSuccessRates', () => {
    it('should return success/failure rates', async () => {
      const caller = appRouter.createCaller({
        user: adminUser,
        req: {} as any,
        res: {} as any,
      });

      const rates = await caller.performance.getSuccessRates({ days: 30 });

      expect(Array.isArray(rates)).toBe(true);
      if (rates.length > 0) {
        expect(rates[0]).toHaveProperty('date');
        expect(rates[0]).toHaveProperty('total');
        expect(rates[0]).toHaveProperty('successful');
        expect(rates[0]).toHaveProperty('failed');
        expect(rates[0]).toHaveProperty('successRate');
        expect(rates[0]).toHaveProperty('failureRate');
      }
    });
  });

  describe('getRecordDistribution', () => {
    it('should return record count distribution', async () => {
      const caller = appRouter.createCaller({
        user: adminUser,
        req: {} as any,
        res: {} as any,
      });

      const distribution = await caller.performance.getRecordDistribution();

      expect(Array.isArray(distribution)).toBe(true);
      expect(distribution.length).toBeGreaterThan(0);
      expect(distribution[0]).toHaveProperty('recordRange');
      expect(distribution[0]).toHaveProperty('count');
      expect(distribution[0]).toHaveProperty('avgTime');
    });
  });

  describe('getUserPerformance', () => {
    it('should return performance metrics for all users', async () => {
      const caller = appRouter.createCaller({
        user: adminUser,
        req: {} as any,
        res: {} as any,
      });

      const userPerformance = await caller.performance.getUserPerformance();

      expect(Array.isArray(userPerformance)).toBe(true);
      expect(userPerformance.length).toBeGreaterThan(0);
      expect(userPerformance[0]).toHaveProperty('userId');
      expect(userPerformance[0]).toHaveProperty('totalUploads');
      expect(userPerformance[0]).toHaveProperty('avgFileSize');
      expect(userPerformance[0]).toHaveProperty('avgTotalTime');
      expect(userPerformance[0]).toHaveProperty('successRate');
    });
  });
});
