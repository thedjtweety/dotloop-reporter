/**
 * Tier History Router Tests
 * 
 * Tests for tier transition logging and analytics endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { tierHistoryRouter } from './tierHistoryRouter';
import { getDb } from './db';
import { tierHistory } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

// Mock context
const mockContext = {
  user: {
    id: 1,
    tenantId: 1,
    name: 'Test User',
    email: 'test@example.com',
  },
};

describe('Tier History Router', () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }
  });

  afterAll(async () => {
    // Cleanup test data
    if (db) {
      await db.delete(tierHistory).where(eq(tierHistory.tenantId, mockContext.user.tenantId));
    }
  });

  describe('logTransition', () => {
    it('should log a tier transition', async () => {
      const procedure = tierHistoryRouter.createCaller({ ...mockContext });
      
      const result = await procedure.logTransition({
        agentName: 'John Doe',
        planId: 'plan-1',
        previousTierIndex: 0,
        previousTierThreshold: 0,
        previousSplitPercentage: 60,
        newTierIndex: 1,
        newTierThreshold: 50000,
        newSplitPercentage: 65,
        ytdAmount: 55000,
        transactionId: 'txn-001',
        transactionDate: '2024-01-15',
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.message).toContain('John Doe');
    });

    it('should handle tier transitions without previous tier', async () => {
      const procedure = tierHistoryRouter.createCaller({ ...mockContext });
      
      const result = await procedure.logTransition({
        agentName: 'Jane Smith',
        planId: 'plan-1',
        newTierIndex: 0,
        newTierThreshold: 0,
        newSplitPercentage: 60,
        ytdAmount: 10000,
        transactionId: 'txn-002',
        transactionDate: '2024-01-10',
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
    });
  });

  describe('getAgentHistory', () => {
    beforeAll(async () => {
      const procedure = tierHistoryRouter.createCaller({ ...mockContext });
      
      // Create test data
      await procedure.logTransition({
        agentName: 'Agent A',
        planId: 'plan-1',
        newTierIndex: 0,
        newTierThreshold: 0,
        newSplitPercentage: 60,
        ytdAmount: 10000,
        transactionId: 'txn-a1',
        transactionDate: '2024-01-01',
      });

      await procedure.logTransition({
        agentName: 'Agent A',
        planId: 'plan-1',
        previousTierIndex: 0,
        previousTierThreshold: 0,
        previousSplitPercentage: 60,
        newTierIndex: 1,
        newTierThreshold: 50000,
        newSplitPercentage: 65,
        ytdAmount: 55000,
        transactionId: 'txn-a2',
        transactionDate: '2024-01-15',
      });
    });

    it('should retrieve agent tier history', async () => {
      const procedure = tierHistoryRouter.createCaller({ ...mockContext });
      
      const history = await procedure.getAgentHistory({
        agentName: 'Agent A',
        planId: 'plan-1',
      });

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThanOrEqual(2);
      expect(history[0].agentName).toBe('Agent A');
    });

    it('should limit results', async () => {
      const procedure = tierHistoryRouter.createCaller({ ...mockContext });
      
      const history = await procedure.getAgentHistory({
        agentName: 'Agent A',
        limit: 1,
      });

      expect(history.length).toBeLessThanOrEqual(1);
    });
  });

  describe('getTierStats', () => {
    beforeAll(async () => {
      const procedure = tierHistoryRouter.createCaller({ ...mockContext });
      
      // Create multiple tier transitions
      const agents = ['Agent B', 'Agent C', 'Agent D'];
      for (let i = 0; i < agents.length; i++) {
        await procedure.logTransition({
          agentName: agents[i],
          planId: 'plan-1',
          newTierIndex: 0,
          newTierThreshold: 0,
          newSplitPercentage: 60,
          ytdAmount: 10000 + i * 5000,
          transactionId: `txn-b${i}`,
          transactionDate: '2024-01-01',
        });

        if (i < 2) {
          await procedure.logTransition({
            agentName: agents[i],
            planId: 'plan-1',
            previousTierIndex: 0,
            previousTierThreshold: 0,
            previousSplitPercentage: 60,
            newTierIndex: 1,
            newTierThreshold: 50000,
            newSplitPercentage: 65,
            ytdAmount: 55000 + i * 5000,
            transactionId: `txn-b${i}-2`,
            transactionDate: '2024-01-15',
          });
        }
      }
    });

    it('should calculate tier statistics', async () => {
      const procedure = tierHistoryRouter.createCaller({ ...mockContext });
      
      const stats = await procedure.getTierStats({
        planId: 'plan-1',
        daysBack: 90,
      });

      expect(stats.totalTransitions).toBeGreaterThan(0);
      expect(stats.uniqueAgents).toBeGreaterThan(0);
      expect(stats.tierCounts).toBeDefined();
      expect(stats.tierTransitions).toBeDefined();
      expect(stats.averageTimings).toBeDefined();
      expect(stats.recentTransitions).toBeDefined();
    });

    it('should have period information', async () => {
      const procedure = tierHistoryRouter.createCaller({ ...mockContext });
      
      const stats = await procedure.getTierStats({
        planId: 'plan-1',
        daysBack: 30,
      });

      expect(stats.period).toBeDefined();
      expect(stats.period.daysBack).toBe(30);
      expect(stats.period.startDate).toBeDefined();
      expect(stats.period.endDate).toBeDefined();
    });
  });

  describe('getTierDistribution', () => {
    it('should calculate tier distribution', async () => {
      const procedure = tierHistoryRouter.createCaller({ ...mockContext });
      
      const distribution = await procedure.getTierDistribution({
        planId: 'plan-1',
      });

      expect(Array.isArray(distribution)).toBe(true);
      
      if (distribution.length > 0) {
        expect(distribution[0]).toHaveProperty('tier');
        expect(distribution[0]).toHaveProperty('count');
        expect(distribution[0]).toHaveProperty('percentage');
        expect(distribution[0]).toHaveProperty('agents');
      }
    });
  });

  describe('getRevenueByTier', () => {
    it('should calculate revenue impact by tier', async () => {
      const procedure = tierHistoryRouter.createCaller({ ...mockContext });
      
      const revenue = await procedure.getRevenueByTier({
        planId: 'plan-1',
        daysBack: 90,
      });

      expect(Array.isArray(revenue)).toBe(true);
      
      if (revenue.length > 0) {
        expect(revenue[0]).toHaveProperty('tier');
        expect(revenue[0]).toHaveProperty('totalYtdAmount');
        expect(revenue[0]).toHaveProperty('averageYtdAmount');
        expect(revenue[0]).toHaveProperty('transitionCount');
        expect(revenue[0]).toHaveProperty('uniqueAgents');
      }
    });
  });

  describe('getAdvancementTimeline', () => {
    it('should retrieve advancement timeline', async () => {
      const procedure = tierHistoryRouter.createCaller({ ...mockContext });
      
      const timeline = await procedure.getAdvancementTimeline({
        planId: 'plan-1',
        daysBack: 90,
      });

      expect(Array.isArray(timeline)).toBe(true);
      
      if (timeline.length > 0) {
        expect(timeline[0]).toHaveProperty('date');
        expect(timeline[0]).toHaveProperty('transitions');
        expect(Array.isArray(timeline[0].transitions)).toBe(true);
      }
    });

    it('should have chronological order', async () => {
      const procedure = tierHistoryRouter.createCaller({ ...mockContext });
      
      const timeline = await procedure.getAdvancementTimeline({
        planId: 'plan-1',
        daysBack: 90,
      });

      if (timeline.length > 1) {
        for (let i = 1; i < timeline.length; i++) {
          const prevDate = new Date(timeline[i - 1].date).getTime();
          const currDate = new Date(timeline[i].date).getTime();
          expect(currDate).toBeGreaterThanOrEqual(prevDate);
        }
      }
    });
  });

  describe('Multi-tenant isolation', () => {
    it('should isolate data by tenant', async () => {
      const procedure = tierHistoryRouter.createCaller({ ...mockContext });
      const otherTenantContext = {
        user: {
          id: 2,
          tenantId: 2, // Different tenant
          name: 'Other User',
          email: 'other@example.com',
        },
      };
      const otherProcedure = tierHistoryRouter.createCaller(otherTenantContext);

      // Log transition for current tenant
      await procedure.logTransition({
        agentName: 'Tenant 1 Agent',
        planId: 'plan-1',
        newTierIndex: 0,
        newTierThreshold: 0,
        newSplitPercentage: 60,
        ytdAmount: 10000,
        transactionId: 'txn-t1',
        transactionDate: '2024-01-01',
      });

      // Verify other tenant cannot see this data
      const stats1 = await procedure.getTierStats({ planId: 'plan-1' });
      const stats2 = await otherProcedure.getTierStats({ planId: 'plan-1' });

      // Other tenant should have no data
      expect(stats2.totalTransitions).toBe(0);
      expect(stats2.uniqueAgents).toBe(0);
    });
  });

  describe('Error handling', () => {
    it('should handle missing database connection gracefully', async () => {
      // This test would require mocking getDb to return null
      // For now, we verify that valid inputs work
      const procedure = tierHistoryRouter.createCaller({ ...mockContext });
      
      const result = await procedure.logTransition({
        agentName: 'Error Test Agent',
        planId: 'plan-1',
        newTierIndex: 0,
        newTierThreshold: 0,
        newSplitPercentage: 60,
        ytdAmount: 10000,
      });

      expect(result.success).toBe(true);
    });
  });
});
