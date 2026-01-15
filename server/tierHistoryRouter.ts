/**
 * Tier History Router - tRPC procedures for tier transition logging and analytics
 * 
 * Provides backend API for:
 * - Logging tier transitions when agents reach new thresholds
 * - Querying tier history for individual agents
 * - Calculating tier advancement statistics
 * - Building analytics dashboards
 */

import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { tierHistory } from "../drizzle/schema";
import { getDb } from "./db";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { nanoid } from "nanoid";

// Zod schemas for input validation
const TierTransitionSchema = z.object({
  agentName: z.string(),
  planId: z.string(),
  previousTierIndex: z.number().optional(),
  previousTierThreshold: z.number().optional(),
  previousSplitPercentage: z.number().optional(),
  newTierIndex: z.number(),
  newTierThreshold: z.number(),
  newSplitPercentage: z.number(),
  ytdAmount: z.number(),
  transactionId: z.string().optional(),
  transactionDate: z.string().optional(),
});

export const tierHistoryRouter = router({
  /**
   * Log a tier transition when an agent reaches a new threshold
   * 
   * This is called automatically during commission calculations
   * when an agent's YTD amount crosses a tier threshold
   */
  logTransition: protectedProcedure
    .input(TierTransitionSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database connection not available");
        }

        const id = nanoid();
        
        await db.insert(tierHistory).values({
          id,
          tenantId: ctx.user.tenantId,
          agentName: input.agentName,
          planId: input.planId,
          previousTierIndex: input.previousTierIndex ?? null,
          previousTierThreshold: input.previousTierThreshold ?? null,
          previousSplitPercentage: input.previousSplitPercentage ?? null,
          newTierIndex: input.newTierIndex,
          newTierThreshold: input.newTierThreshold,
          newSplitPercentage: input.newSplitPercentage,
          ytdAmount: input.ytdAmount,
          transactionId: input.transactionId ?? null,
          transactionDate: input.transactionDate ?? null,
        });

        return {
          success: true,
          id,
          message: `Logged tier transition for ${input.agentName}`,
        };
      } catch (error) {
        console.error("Error logging tier transition:", error);
        throw new Error(
          `Failed to log tier transition: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get tier history for a specific agent
   */
  getAgentHistory: protectedProcedure
    .input(
      z.object({
        agentName: z.string(),
        planId: z.string().optional(),
        limit: z.number().optional().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database connection not available");
        }

        const conditions = [
          eq(tierHistory.tenantId, ctx.user.tenantId),
          eq(tierHistory.agentName, input.agentName),
        ];

        if (input.planId) {
          conditions.push(eq(tierHistory.planId, input.planId));
        }

        const query = db
          .select()
          .from(tierHistory)
          .where(and(...conditions));

        const history = await query
          .orderBy(desc(tierHistory.createdAt))
          .limit(input.limit);

        return history;
      } catch (error) {
        console.error("Error fetching agent tier history:", error);
        throw new Error("Failed to fetch tier history");
      }
    }),

  /**
   * Get tier advancement statistics for analytics dashboard
   * 
   * Returns:
   * - Total agents by tier level
   * - Average time to reach each tier
   * - Recent tier transitions
   * - Tier retention rates
   */
  getTierStats: protectedProcedure
    .input(
      z.object({
        planId: z.string().optional(),
        daysBack: z.number().optional().default(90),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database connection not available");
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - input.daysBack);

        const conditions = [
          eq(tierHistory.tenantId, ctx.user.tenantId),
          gte(tierHistory.createdAt, cutoffDate),
        ];

        if (input.planId) {
          conditions.push(eq(tierHistory.planId, input.planId));
        }

        const history = await db
          .select()
          .from(tierHistory)
          .where(and(...conditions))
          .orderBy(desc(tierHistory.createdAt));

        // Calculate statistics
        const tierCounts: Record<number, number> = {};
        const tierTransitions: Record<number, number> = {};
        const agentFirstTransition: Record<string, Date> = {};
        const agentLatestTier: Record<string, number> = {};

        history.forEach((record) => {
          const tierKey = record.newTierIndex;
          
          // Count transitions to each tier
          tierTransitions[tierKey] = (tierTransitions[tierKey] || 0) + 1;
          
          // Track agent's latest tier
          const agentKey = `${record.agentName}-${record.planId}`;
          if (!agentLatestTier[agentKey]) {
            agentLatestTier[agentKey] = tierKey;
          }
          
          // Track first transition date
          if (!agentFirstTransition[agentKey]) {
            agentFirstTransition[agentKey] = new Date(record.createdAt);
          }
        });

        // Count unique agents at each tier
        Object.values(agentLatestTier).forEach((tier) => {
          tierCounts[tier] = (tierCounts[tier] || 0) + 1;
        });

        // Calculate average time to reach each tier
        const tierTimings: Record<number, { count: number; totalDays: number }> = {};
        
        Object.entries(agentFirstTransition).forEach(([agentKey, firstDate]) => {
          const agentHistory = history.filter(
            (h: any) => `${h.agentName}-${h.planId}` === agentKey
          );
          
          if (agentHistory.length > 0) {
            const latestTier = agentLatestTier[agentKey];
            const daysToLatestTier = Math.floor(
              (new Date().getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            
            if (!tierTimings[latestTier]) {
              tierTimings[latestTier] = { count: 0, totalDays: 0 };
            }
            tierTimings[latestTier].count += 1;
            tierTimings[latestTier].totalDays += daysToLatestTier;
          }
        });

        const averageTimings: Record<number, number> = {};
        Object.entries(tierTimings).forEach(([tier, data]) => {
          averageTimings[parseInt(tier)] = Math.round(
            data.totalDays / data.count
          );
        });

        return {
          period: {
            daysBack: input.daysBack,
            startDate: cutoffDate.toISOString(),
            endDate: new Date().toISOString(),
          },
          tierCounts,
          tierTransitions,
          averageTimings,
          totalTransitions: history.length,
          uniqueAgents: Object.keys(agentLatestTier).length,
          recentTransitions: history.slice(0, 10),
        };
      } catch (error) {
        console.error("Error calculating tier statistics:", error);
        throw new Error("Failed to calculate tier statistics");
      }
    }),

  /**
   * Get tier distribution data for pie/donut chart
   * Shows how many agents are at each tier level
   */
  getTierDistribution: protectedProcedure
    .input(
      z.object({
        planId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database connection not available");
        }

        const conditions = [eq(tierHistory.tenantId, ctx.user.tenantId)];

        if (input.planId) {
          conditions.push(eq(tierHistory.planId, input.planId));
        }

        const allHistory = await db
          .select()
          .from(tierHistory)
          .where(and(...conditions));

        // Get the latest tier for each agent
        const agentLatestTier: Record<string, { tier: number; ytdAmount: number }> = {};

        allHistory.forEach((record) => {
          const agentKey = `${record.agentName}-${record.planId}`;
          const current = agentLatestTier[agentKey];
          
          // Keep the most recent transition
          if (!current || new Date(record.createdAt) > new Date(allHistory.find(h => `${h.agentName}-${h.planId}` === agentKey && h.newTierIndex === current.tier)?.createdAt || 0)) {
            agentLatestTier[agentKey] = {
              tier: record.newTierIndex,
              ytdAmount: record.ytdAmount,
            };
          }
        });

        // Count agents per tier
        const distribution: Record<number, { count: number; agents: string[] }> = {};

        Object.entries(agentLatestTier).forEach(([agentKey, data]) => {
          const tier = data.tier;
          if (!distribution[tier]) {
            distribution[tier] = { count: 0, agents: [] };
          }
          distribution[tier].count += 1;
          distribution[tier].agents.push(agentKey.split('-')[0]);
        });

        return Object.entries(distribution).map(([tier, data]) => ({
          tier: parseInt(tier),
          count: data.count,
          percentage: Math.round((data.count / Object.keys(agentLatestTier).length) * 100),
          agents: data.agents,
        }));
      } catch (error) {
        console.error("Error calculating tier distribution:", error);
        throw new Error("Failed to calculate tier distribution");
      }
    }),

  /**
   * Get revenue impact by tier
   * Shows total commission earned at each tier level
   */
  getRevenueByTier: protectedProcedure
    .input(
      z.object({
        planId: z.string().optional(),
        daysBack: z.number().optional().default(90),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database connection not available");
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - input.daysBack);

        const conditions = [
          eq(tierHistory.tenantId, ctx.user.tenantId),
          gte(tierHistory.createdAt, cutoffDate),
        ];

        if (input.planId) {
          conditions.push(eq(tierHistory.planId, input.planId));
        }

        const history = await db
          .select()
          .from(tierHistory)
          .where(and(...conditions));

        // Group by tier and calculate revenue metrics
        const tierRevenue: Record<number, { ytdTotal: number; count: number; agents: Set<string> }> = {};

        history.forEach((record) => {
          const tier = record.newTierIndex;
          if (!tierRevenue[tier]) {
            tierRevenue[tier] = { ytdTotal: 0, count: 0, agents: new Set() };
          }
          tierRevenue[tier].ytdTotal += record.ytdAmount;
          tierRevenue[tier].count += 1;
          tierRevenue[tier].agents.add(record.agentName);
        });

        return Object.entries(tierRevenue).map(([tier, data]) => ({
          tier: parseInt(tier),
          totalYtdAmount: data.ytdTotal,
          averageYtdAmount: Math.round(data.ytdTotal / data.count),
          transitionCount: data.count,
          uniqueAgents: data.agents.size,
        }));
      } catch (error) {
        console.error("Error calculating revenue by tier:", error);
        throw new Error("Failed to calculate revenue by tier");
      }
    }),

  /**
   * Get tier advancement timeline
   * Shows when agents advanced to each tier
   */
  getAdvancementTimeline: protectedProcedure
    .input(
      z.object({
        planId: z.string().optional(),
        daysBack: z.number().optional().default(90),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database connection not available");
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - input.daysBack);

        const conditions = [
          eq(tierHistory.tenantId, ctx.user.tenantId),
          gte(tierHistory.createdAt, cutoffDate),
        ];

        if (input.planId) {
          conditions.push(eq(tierHistory.planId, input.planId));
        }

        const history = await db
          .select()
          .from(tierHistory)
          .where(and(...conditions))
          .orderBy(tierHistory.createdAt)

        // Group by date and tier
        const timeline: Record<string, Record<number, number>> = {};

        history.forEach((record) => {
          const date = new Date(record.createdAt).toISOString().split('T')[0];
          if (!timeline[date]) {
            timeline[date] = {};
          }
          const tier = record.newTierIndex;
          timeline[date][tier] = (timeline[date][tier] || 0) + 1;
        });

        return Object.entries(timeline)
          .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
          .map(([date, tiers]) => ({
            date,
            transitions: Object.entries(tiers).map(([tier, count]) => ({
              tier: parseInt(tier),
              count,
            })),
          }));
      } catch (error) {
        console.error("Error calculating advancement timeline:", error);
        throw new Error("Failed to calculate advancement timeline");
      }
    }),
});
