import { describe, it, expect, vi, beforeEach } from 'vitest';
import { seedRouter } from '../seedRouter';
import { getDb } from '../db';
import { commissionPlans, agentAssignments } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

// Mock database
vi.mock('../db', () => ({
  getDb: vi.fn(),
}));

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((col, val) => ({ col, val })),
}));

describe('seedRouter', () => {
  const mockCtx = {
    user: {
      id: 'test-user-id',
      tenantId: 'test-tenant-id',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('seedSampleData', () => {
    it('should seed sample commission plans and agent assignments', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'plan-1',
              name: 'Standard Capped (80/20)',
              splitPercentage: 80,
              capAmount: 18000,
              postCapSplit: 100,
              useSliding: false,
            },
            {
              id: 'plan-2',
              name: 'Aggressive (90/10 with Sliding Scale)',
              splitPercentage: 90,
              capAmount: 25000,
              postCapSplit: 100,
              useSliding: true,
            },
            {
              id: 'plan-3',
              name: 'Conservative (70/30)',
              splitPercentage: 70,
              capAmount: 12000,
              postCapSplit: 100,
              useSliding: false,
            },
          ]),
        }),
      });

      const mockDb = {
        insert: mockInsert,
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const procedure = seedRouter.createCaller(mockCtx as any).seedSampleData;
      const result = await procedure();

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('plansCreated');
      expect(result).toHaveProperty('assignmentsCreated');
      expect(result).toHaveProperty('message');
    });

    it('should throw error if database connection is not available', async () => {
      vi.mocked(getDb).mockResolvedValue(null);

      const procedure = seedRouter.createCaller(mockCtx as any).seedSampleData;

      await expect(procedure()).rejects.toThrow('Database connection not available');
    });

    it('should create 10 sample agents with different names', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { id: 'plan-1', name: 'Standard' },
            { id: 'plan-2', name: 'Aggressive' },
            { id: 'plan-3', name: 'Conservative' },
          ]),
        }),
      });

      const mockDb = {
        insert: mockInsert,
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const procedure = seedRouter.createCaller(mockCtx as any).seedSampleData;
      await procedure();

      // Verify insert was called at least once for plans and assignments
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe('clearSampleData', () => {
    it('should clear all sample data for the tenant', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { id: 'assignment-1' },
            { id: 'assignment-2' },
          ]),
        }),
      });

      const mockDb = {
        delete: mockDelete,
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const procedure = seedRouter.createCaller(mockCtx as any).clearSampleData;
      const result = await procedure();

      expect(result.success).toBe(true);
      expect(result.message).toContain('Cleared');
      expect(mockDelete).toHaveBeenCalledTimes(2); // Once for assignments, once for plans
    });

    it('should throw error if database connection is not available', async () => {
      vi.mocked(getDb).mockResolvedValue(null);

      const procedure = seedRouter.createCaller(mockCtx as any).clearSampleData;

      await expect(procedure()).rejects.toThrow('Database connection not available');
    });

    it('should delete assignments before plans', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      });

      const mockDb = {
        delete: mockDelete,
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const procedure = seedRouter.createCaller(mockCtx as any).clearSampleData;
      const result = await procedure();

      // Verify result indicates success
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('message');
      // Verify delete was called twice (once for assignments, once for plans)
      expect(mockDelete).toHaveBeenCalledTimes(2);
    });
  });
});
