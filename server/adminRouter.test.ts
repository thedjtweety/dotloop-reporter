import { describe, it, expect, beforeEach } from 'vitest';
import { appRouter } from './routers';
import { getDb } from './db';
import { users, uploads, transactions } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Admin Router Test Suite
 * 
 * Tests the admin dashboard functionality including:
 * - System statistics aggregation
 * - User listing with upload counts
 * - Upload activity monitoring
 * - Role management (promote/demote)
 * - User deletion with cascade
 * - Access control enforcement
 */

describe('Admin Router', () => {
  let adminUserId: number;
  let regularUserId: number;
  let uploadId1: number;
  let uploadId2: number;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Clean up existing test data
    await db.delete(transactions);
    await db.delete(uploads);
    await db.delete(users);

    // Create test users
    const adminResult = await db
      .insert(users)
      .values({
        openId: 'admin-test-123',
        name: 'Admin User',
        email: 'admin@test.com',
        role: 'admin',
        lastSignedIn: new Date(),
      });
    // @ts-ignore - insertId exists on mysql2 result
    adminUserId = Number(adminResult[0].insertId);

    const regularResult = await db
      .insert(users)
      .values({
        openId: 'user-test-456',
        name: 'Regular User',
        email: 'user@test.com',
        role: 'user',
        lastSignedIn: new Date(),
      });
    // @ts-ignore - insertId exists on mysql2 result
    regularUserId = Number(regularResult[0].insertId);

    // Create test uploads
    const upload1Result = await db
      .insert(uploads)
      .values({
        userId: adminUserId,
        fileName: 'admin-upload.csv',
        recordCount: 50,
        uploadedAt: new Date(),
      });
    // @ts-ignore - insertId exists on mysql2 result
    uploadId1 = Number(upload1Result[0].insertId);

    const upload2Result = await db
      .insert(uploads)
      .values({
        userId: regularUserId,
        fileName: 'user-upload.csv',
        recordCount: 100,
        uploadedAt: new Date(),
      });
    // @ts-ignore - insertId exists on mysql2 result
    uploadId2 = Number(upload2Result[0].insertId);

    // Create test transactions
    await db.insert(transactions).values([
      {
        uploadId: uploadId1,
        userId: adminUserId,
        loopName: 'Test Loop 1',
        loopStatus: 'Active',
        price: 500000,
      },
      {
        uploadId: uploadId2,
        userId: regularUserId,
        loopName: 'Test Loop 2',
        loopStatus: 'Closed',
        price: 750000,
      },
    ]);
  });

  describe('admin.getStats', () => {
    it('should return correct system statistics', async () => {
      const caller = appRouter.createCaller({
        user: { id: adminUserId, role: 'admin', openId: 'admin-test-123', name: 'Admin User' },
        req: {} as any,
        res: {} as any,
      });

      const stats = await caller.admin.getStats();

      expect(stats.users.total).toBe(2);
      expect(stats.users.admins).toBe(1);
      expect(stats.users.regular).toBe(1);
      expect(stats.uploads.total).toBe(2);
      expect(stats.uploads.totalRecords).toBe(150); // 50 + 100
    });

    it('should deny access to non-admin users', async () => {
      const caller = appRouter.createCaller({
        user: { id: regularUserId, role: 'user', openId: 'user-test-456', name: 'Regular User' },
        req: {} as any,
        res: {} as any,
      });

      await expect(caller.admin.getStats()).rejects.toThrow('Admin access required');
    });
  });

  describe('admin.listUsers', () => {
    it('should list all users with upload counts', async () => {
      const caller = appRouter.createCaller({
        user: { id: adminUserId, role: 'admin', openId: 'admin-test-123', name: 'Admin User' },
        req: {} as any,
        res: {} as any,
      });

      const userList = await caller.admin.listUsers({ limit: 10, offset: 0 });

      expect(userList).toHaveLength(2);
      
      const adminUser = userList.find(u => u.role === 'admin');
      const regularUser = userList.find(u => u.role === 'user');

      expect(adminUser?.name).toBe('Admin User');
      expect(adminUser?.uploadCount).toBe(1);
      
      expect(regularUser?.name).toBe('Regular User');
      expect(regularUser?.uploadCount).toBe(1);
    });

    it('should respect pagination limits', async () => {
      const caller = appRouter.createCaller({
        user: { id: adminUserId, role: 'admin', openId: 'admin-test-123', name: 'Admin User' },
        req: {} as any,
        res: {} as any,
      });

      const userList = await caller.admin.listUsers({ limit: 1, offset: 0 });

      expect(userList).toHaveLength(1);
    });

    it('should deny access to non-admin users', async () => {
      const caller = appRouter.createCaller({
        user: { id: regularUserId, role: 'user', openId: 'user-test-456', name: 'Regular User' },
        req: {} as any,
        res: {} as any,
      });

      await expect(caller.admin.listUsers({ limit: 10, offset: 0 })).rejects.toThrow('Admin access required');
    });
  });

  describe('admin.listAllUploads', () => {
    it('should list all uploads across all users', async () => {
      const caller = appRouter.createCaller({
        user: { id: adminUserId, role: 'admin', openId: 'admin-test-123', name: 'Admin User' },
        req: {} as any,
        res: {} as any,
      });

      const uploadList = await caller.admin.listAllUploads({ limit: 10, offset: 0 });

      expect(uploadList).toHaveLength(2);
      
      const adminUpload = uploadList.find(u => u.fileName === 'admin-upload.csv');
      const userUpload = uploadList.find(u => u.fileName === 'user-upload.csv');

      expect(adminUpload?.userName).toBe('Admin User');
      expect(adminUpload?.recordCount).toBe(50);
      
      expect(userUpload?.userName).toBe('Regular User');
      expect(userUpload?.recordCount).toBe(100);
    });

    it('should deny access to non-admin users', async () => {
      const caller = appRouter.createCaller({
        user: { id: regularUserId, role: 'user', openId: 'user-test-456', name: 'Regular User' },
        req: {} as any,
        res: {} as any,
      });

      await expect(caller.admin.listAllUploads({ limit: 10, offset: 0 })).rejects.toThrow('Admin access required');
    });
  });

  describe('admin.updateUserRole', () => {
    it('should promote a user to admin', async () => {
      const caller = appRouter.createCaller({
        user: { id: adminUserId, role: 'admin', openId: 'admin-test-123', name: 'Admin User' },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.admin.updateUserRole({
        userId: regularUserId,
        role: 'admin',
      });

      expect(result.success).toBe(true);

      // Verify the role was updated
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const [updatedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, regularUserId));

      expect(updatedUser.role).toBe('admin');
    });

    it('should demote an admin to user', async () => {
      const caller = appRouter.createCaller({
        user: { id: adminUserId, role: 'admin', openId: 'admin-test-123', name: 'Admin User' },
        req: {} as any,
        res: {} as any,
      });

      // First promote the regular user
      await caller.admin.updateUserRole({
        userId: regularUserId,
        role: 'admin',
      });

      // Then demote them back
      const result = await caller.admin.updateUserRole({
        userId: regularUserId,
        role: 'user',
      });

      expect(result.success).toBe(true);

      // Verify the role was updated
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const [updatedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, regularUserId));

      expect(updatedUser.role).toBe('user');
    });

    it('should deny access to non-admin users', async () => {
      const caller = appRouter.createCaller({
        user: { id: regularUserId, role: 'user', openId: 'user-test-456', name: 'Regular User' },
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.admin.updateUserRole({ userId: adminUserId, role: 'user' })
      ).rejects.toThrow('Admin access required');
    });
  });

  describe('admin.deleteUser', () => {
    it('should delete a user and their uploads', async () => {
      const caller = appRouter.createCaller({
        user: { id: adminUserId, role: 'admin', openId: 'admin-test-123', name: 'Admin User' },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.admin.deleteUser({ userId: regularUserId });

      expect(result.success).toBe(true);

      // Verify the user was deleted
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const deletedUser = await db
        .select()
        .from(users)
        .where(eq(users.id, regularUserId));

      expect(deletedUser).toHaveLength(0);

      // Verify their uploads were also deleted
      const deletedUploads = await db
        .select()
        .from(uploads)
        .where(eq(uploads.userId, regularUserId));

      expect(deletedUploads).toHaveLength(0);
    });

    it('should prevent self-deletion', async () => {
      const caller = appRouter.createCaller({
        user: { id: adminUserId, role: 'admin', openId: 'admin-test-123', name: 'Admin User' },
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.admin.deleteUser({ userId: adminUserId })
      ).rejects.toThrow('Cannot delete your own account');
    });

    it('should deny access to non-admin users', async () => {
      const caller = appRouter.createCaller({
        user: { id: regularUserId, role: 'user', openId: 'user-test-456', name: 'Regular User' },
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.admin.deleteUser({ userId: adminUserId })
      ).rejects.toThrow('Admin access required');
    });
  });

  describe('Tenant Isolation', () => {
    it('should ensure admins can see all users data', async () => {
      const caller = appRouter.createCaller({
        user: { id: adminUserId, role: 'admin', openId: 'admin-test-123', name: 'Admin User' },
        req: {} as any,
        res: {} as any,
      });

      const uploadList = await caller.admin.listAllUploads({ limit: 10, offset: 0 });

      // Admin should see uploads from both users
      expect(uploadList).toHaveLength(2);
      const userIds = uploadList.map(u => u.userId);
      expect(userIds).toContain(adminUserId);
      expect(userIds).toContain(regularUserId);
    });

    it('should prevent regular users from accessing admin endpoints', async () => {
      const caller = appRouter.createCaller({
        user: { id: regularUserId, role: 'user', openId: 'user-test-456', name: 'Regular User' },
        req: {} as any,
        res: {} as any,
      });

      // All admin endpoints should be blocked
      await expect(caller.admin.getStats()).rejects.toThrow('Admin access required');
      await expect(caller.admin.listUsers({ limit: 10, offset: 0 })).rejects.toThrow('Admin access required');
      await expect(caller.admin.listAllUploads({ limit: 10, offset: 0 })).rejects.toThrow('Admin access required');
      await expect(caller.admin.updateUserRole({ userId: adminUserId, role: 'user' })).rejects.toThrow('Admin access required');
      await expect(caller.admin.deleteUser({ userId: adminUserId })).rejects.toThrow('Admin access required');
    });
  });
});
