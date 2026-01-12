import { router, adminProcedure } from './_core/trpc';
import { z } from 'zod';
import { getDb } from './db';
import { auditLogs } from '../drizzle/schema';
import { desc, eq, and, gte, lte, sql } from 'drizzle-orm';

/**
 * Audit Log Router
 * Provides endpoints for logging and retrieving admin actions
 */

export const auditLogRouter = router({
  /**
   * Create a new audit log entry
   * Called automatically by admin actions
   */
  create: adminProcedure
    .input(z.object({
      action: z.enum([
        'user_created',
        'user_deleted',
        'user_role_changed',
        'upload_deleted',
        'upload_viewed',
        'settings_changed',
        'data_exported'
      ]),
      targetType: z.enum(['user', 'upload', 'system']).optional(),
      targetId: z.number().optional(),
      targetName: z.string().optional(),
      details: z.string().optional(), // JSON string
      ipAddress: z.string().optional(),
      userAgent: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }: { ctx: any; input: any }) => {
      const { user } = ctx;
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      await db.insert(auditLogs).values({
        adminId: user.id,
        adminName: user.name || 'Unknown Admin',
        adminEmail: user.email || undefined,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        targetName: input.targetName,
        details: input.details,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });
      
      return { success: true };
    }),

  /**
   * List audit logs with filtering and pagination
   */
  list: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      action: z.enum([
        'user_created',
        'user_deleted',
        'user_role_changed',
        'upload_deleted',
        'upload_viewed',
        'settings_changed',
        'data_exported'
      ]).optional(),
      adminId: z.number().optional(),
      targetType: z.enum(['user', 'upload', 'system']).optional(),
      startDate: z.string().optional(), // ISO date string
      endDate: z.string().optional(), // ISO date string
    }))
    .query(async ({ input }: { input: any }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const conditions = [];
      
      if (input.action) {
        conditions.push(eq(auditLogs.action, input.action));
      }
      
      if (input.adminId) {
        conditions.push(eq(auditLogs.adminId, input.adminId));
      }
      
      if (input.targetType) {
        conditions.push(eq(auditLogs.targetType, input.targetType));
      }
      
      if (input.startDate) {
        conditions.push(gte(auditLogs.createdAt, new Date(input.startDate)));
      }
      
      if (input.endDate) {
        conditions.push(lte(auditLogs.createdAt, new Date(input.endDate)));
      }
      
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      const logs = await db
        .select()
        .from(auditLogs)
        .where(whereClause)
        .orderBy(desc(auditLogs.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      
      // Get total count for pagination
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(auditLogs)
        .where(whereClause);
      
      const total = Number(countResult[0]?.count || 0);
      
      return {
        logs,
        total,
        hasMore: input.offset + logs.length < total,
      };
    }),

  /**
   * Get audit log statistics
   */
  getStats: adminProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Total logs
      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(auditLogs);
      const total = Number(totalResult[0]?.count || 0);
      
      // Logs by action type
      const byActionResult = await db
        .select({
          action: auditLogs.action,
          count: sql<number>`count(*)`,
        })
        .from(auditLogs)
        .groupBy(auditLogs.action);
      
      const byAction = byActionResult.map((row: any) => ({
        action: row.action,
        count: Number(row.count),
      }));
      
      // Recent activity (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const recentResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(auditLogs)
        .where(gte(auditLogs.createdAt, yesterday));
      const recentActivity = Number(recentResult[0]?.count || 0);
      
      // Most active admins
      const activeAdminsResult = await db
        .select({
          adminId: auditLogs.adminId,
          adminName: auditLogs.adminName,
          count: sql<number>`count(*)`,
        })
        .from(auditLogs)
        .groupBy(auditLogs.adminId, auditLogs.adminName)
        .orderBy(desc(sql`count(*)`))
        .limit(5);
      
      const activeAdmins = activeAdminsResult.map((row: any) => ({
        adminId: row.adminId,
        adminName: row.adminName,
        count: Number(row.count),
      }));
      
      return {
        total,
        byAction,
        recentActivity,
        activeAdmins,
      };
    }),

  /**
   * Get audit logs for a specific target (user or upload)
   */
  getByTarget: adminProcedure
    .input(z.object({
      targetType: z.enum(['user', 'upload', 'system']),
      targetId: z.number(),
    }))
    .query(async ({ input }: { input: any }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const logs = await db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.targetType, input.targetType),
            eq(auditLogs.targetId, input.targetId)
          )
        )
        .orderBy(desc(auditLogs.createdAt));
      
      return logs;
    }),
});
