import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { appRouter } from './routers';
import { getDb } from './db';
import { users, auditLogs } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Audit Log Router', () => {
  let adminUser: any;
  let regularUser: any;
  let testAuditLogId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create test admin user
    const adminResult = await db.insert(users).values({
      openId: 'test-admin-audit-' + Date.now(),
      name: 'Test Admin Audit',
      email: 'admin-audit@test.com',
      role: 'admin',
    });
    // @ts-ignore
    const adminId = Number(adminResult[0].insertId);
    const adminUsers = await db.select().from(users).where(eq(users.id, adminId));
    adminUser = adminUsers[0];

    // Create test regular user
    const userResult = await db.insert(users).values({
      openId: 'test-user-audit-' + Date.now(),
      name: 'Test User Audit',
      email: 'user-audit@test.com',
      role: 'user',
    });
    // @ts-ignore
    const userId = Number(userResult[0].insertId);
    const regularUsers = await db.select().from(users).where(eq(users.id, userId));
    regularUser = regularUsers[0];
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    if (testAuditLogId) {
      await db.delete(auditLogs).where(eq(auditLogs.id, testAuditLogId));
    }
    if (adminUser) {
      await db.delete(users).where(eq(users.id, adminUser.id));
    }
    if (regularUser) {
      await db.delete(users).where(eq(users.id, regularUser.id));
    }
  });

  describe('create', () => {
    it('should create an audit log entry', async () => {
      const caller = appRouter.createCaller({
        user: adminUser,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.auditLogs.create({
        action: 'user_deleted',
        targetType: 'user',
        targetId: regularUser.id,
        targetName: regularUser.name,
        details: JSON.stringify({ test: true }),
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
      });

      expect(result.success).toBe(true);

      // Verify the log was created
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const logs = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.adminId, adminUser.id))
        .limit(1);

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].action).toBe('user_deleted');
      expect(logs[0].targetId).toBe(regularUser.id);
      testAuditLogId = logs[0].id;
    });

    it('should reject non-admin users', async () => {
      const caller = appRouter.createCaller({
        user: regularUser,
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.auditLogs.create({
          action: 'user_deleted',
          targetType: 'user',
          targetId: 1,
        })
      ).rejects.toThrow();
    });
  });

  describe('list', () => {
    it('should list audit logs with default pagination', async () => {
      const caller = appRouter.createCaller({
        user: adminUser,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.auditLogs.list({});

      expect(result).toHaveProperty('logs');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('hasMore');
      expect(Array.isArray(result.logs)).toBe(true);
    });

    it('should filter by action type', async () => {
      const caller = appRouter.createCaller({
        user: adminUser,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.auditLogs.list({
        action: 'user_deleted',
      });

      expect(result.logs.every(log => log.action === 'user_deleted')).toBe(true);
    });

    it('should filter by admin ID', async () => {
      const caller = appRouter.createCaller({
        user: adminUser,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.auditLogs.list({
        adminId: adminUser.id,
      });

      expect(result.logs.every(log => log.adminId === adminUser.id)).toBe(true);
    });

    it('should paginate results', async () => {
      const caller = appRouter.createCaller({
        user: adminUser,
        req: {} as any,
        res: {} as any,
      });

      const page1 = await caller.auditLogs.list({ limit: 1, offset: 0 });
      const page2 = await caller.auditLogs.list({ limit: 1, offset: 1 });

      if (page1.logs.length > 0 && page2.logs.length > 0) {
        expect(page1.logs[0].id).not.toBe(page2.logs[0].id);
      }
    });
  });

  describe('getStats', () => {
    it('should return audit log statistics', async () => {
      const caller = appRouter.createCaller({
        user: adminUser,
        req: {} as any,
        res: {} as any,
      });

      const stats = await caller.auditLogs.getStats();

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('byAction');
      expect(stats).toHaveProperty('recentActivity');
      expect(stats).toHaveProperty('activeAdmins');
      expect(typeof stats.total).toBe('number');
      expect(Array.isArray(stats.byAction)).toBe(true);
      expect(Array.isArray(stats.activeAdmins)).toBe(true);
    });
  });

  describe('getByTarget', () => {
    it('should get audit logs for a specific target', async () => {
      const caller = appRouter.createCaller({
        user: adminUser,
        req: {} as any,
        res: {} as any,
      });

      const logs = await caller.auditLogs.getByTarget({
        targetType: 'user',
        targetId: regularUser.id,
      });

      expect(Array.isArray(logs)).toBe(true);
      if (logs.length > 0) {
        expect(logs.every(log => log.targetId === regularUser.id)).toBe(true);
        expect(logs.every(log => log.targetType === 'user')).toBe(true);
      }
    });
  });
});
