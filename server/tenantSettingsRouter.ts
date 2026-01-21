/**
 * Tenant Settings Router
 * 
 * Handles tenant-level settings and configuration:
 * - Tenant profile information
 * - Subscription tier management
 * - Custom domain settings
 * - Tenant preferences
 */

import { z } from 'zod';
import { protectedProcedure, adminProcedure, router } from './_core/trpc';
import { getDb } from './db';
import { tenants } from '../drizzle/schema';
import { getTenantIdFromUser, getCurrentTenant } from './lib/tenant-context';
import { eq } from 'drizzle-orm';

export const tenantSettingsRouter = router({
  /**
   * Get current tenant information
   */
  getTenant: protectedProcedure
    .query(async ({ ctx }) => {
      const tenantId = await getTenantIdFromUser(ctx.user.id);
      const tenant = await getCurrentTenant(tenantId);
      
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      return {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        customDomain: tenant.customDomain,
        status: tenant.status,
        subscriptionTier: tenant.subscriptionTier,
        settings: tenant.settings ? JSON.parse(tenant.settings) : {},
        createdAt: typeof tenant.createdAt === 'string' ? tenant.createdAt : (tenant.createdAt as any).toISOString(),
        updatedAt: typeof tenant.updatedAt === 'string' ? tenant.updatedAt : (tenant.updatedAt as any).toISOString(),
      };
    }),

  /**
   * Update tenant profile
   * Only admins can update tenant settings
   */
  updateProfile: adminProcedure
    .input(z.object({
      name: z.string().min(1).max(255).optional(),
      subdomain: z.string().min(1).max(63).regex(/^[a-z0-9-]+$/).optional(),
      customDomain: z.string().max(255).optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const tenantId = await getTenantIdFromUser(ctx.user.id);

      // Check if subdomain is already taken (if changing)
      if (input.subdomain) {
        const [existing] = await db
          .select()
          .from(tenants)
          .where(eq(tenants.subdomain, input.subdomain))
          .limit(1);

        if (existing && existing.id !== tenantId) {
          throw new Error('Subdomain is already taken');
        }
      }

      // Check if custom domain is already taken (if changing)
      if (input.customDomain) {
        const [existing] = await db
          .select()
          .from(tenants)
          .where(eq(tenants.customDomain, input.customDomain))
          .limit(1);

        if (existing && existing.id !== tenantId) {
          throw new Error('Custom domain is already in use');
        }
      }

      // Update tenant
      await db
        .update(tenants)
        .set({
          ...(input.name && { name: input.name }),
          ...(input.subdomain && { subdomain: input.subdomain }),
          ...(input.customDomain !== undefined && { customDomain: input.customDomain }),
        })
        .where(eq(tenants.id, tenantId));

      return { success: true };
    }),

  /**
   * Update tenant settings (JSON preferences)
   * Only admins can update settings
   */
  updateSettings: adminProcedure
    .input(z.object({
      settings: z.record(z.string(), z.any()),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const tenantId = await getTenantIdFromUser(ctx.user.id);

      await db
        .update(tenants)
        .set({
          settings: JSON.stringify(input.settings),
        })
        .where(eq(tenants.id, tenantId));

      return { success: true };
    }),

  /**
   * Get subscription information
   */
  getSubscription: protectedProcedure
    .query(async ({ ctx }) => {
      const tenantId = await getTenantIdFromUser(ctx.user.id);
      const tenant = await getCurrentTenant(tenantId);
      
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Define subscription tier features
      const tierFeatures = {
        free: {
          name: 'Free',
          maxUsers: 1,
          maxUploadsPerMonth: 10,
          maxStorageGB: 1,
          features: [
            'Basic reporting',
            'CSV upload',
            'Standard charts',
          ],
        },
        basic: {
          name: 'Basic',
          maxUsers: 5,
          maxUploadsPerMonth: 50,
          maxStorageGB: 10,
          features: [
            'All Free features',
            'Advanced analytics',
            'Agent leaderboards',
            'Email support',
          ],
        },
        professional: {
          name: 'Professional',
          maxUsers: 20,
          maxUploadsPerMonth: 200,
          maxStorageGB: 50,
          features: [
            'All Basic features',
            'Dotloop API integration',
            'Custom domains',
            'Priority support',
            'Data export',
          ],
        },
        enterprise: {
          name: 'Enterprise',
          maxUsers: -1, // Unlimited
          maxUploadsPerMonth: -1, // Unlimited
          maxStorageGB: -1, // Unlimited
          features: [
            'All Professional features',
            'Unlimited users',
            'Unlimited uploads',
            'Unlimited storage',
            'Dedicated support',
            'Custom integrations',
            'SLA guarantee',
          ],
        },
      };

      const currentTier = tenant.subscriptionTier;
      const tierInfo = tierFeatures[currentTier];

      return {
        currentTier,
        tierInfo,
        status: tenant.status,
        allTiers: tierFeatures,
      };
    }),

  /**
   * Get tenant statistics
   */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const tenantId = await getTenantIdFromUser(ctx.user.id);

      // Get user count
      const userCountResult = await db.execute(
        `SELECT COUNT(*) as count FROM users WHERE tenantId = ${tenantId}`
      );

      // Get upload count
      const uploadCountResult = await db.execute(
        `SELECT COUNT(*) as count FROM uploads WHERE tenantId = ${tenantId}`
      );

      // Get transaction count
      const transactionCountResult = await db.execute(
        `SELECT COUNT(*) as count FROM transactions WHERE tenantId = ${tenantId}`
      );

      // Get storage usage (sum of file sizes)
      const storageUsageResult = await db.execute(
        `SELECT COALESCE(SUM(fileSize), 0) as totalBytes FROM uploads WHERE tenantId = ${tenantId}`
      );

      return {
        users: (userCountResult as any)[0][0].count,
        uploads: (uploadCountResult as any)[0][0].count,
        transactions: (transactionCountResult as any)[0][0].count,
        storageBytes: (storageUsageResult as any)[0][0].totalBytes,
        storageGB: ((storageUsageResult as any)[0][0].totalBytes / (1024 * 1024 * 1024)).toFixed(2),
      };
    }),
});
