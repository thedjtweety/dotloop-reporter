import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { brokerageBranding } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { storagePut } from '../storage';
import { TRPCError } from '@trpc/server';
import { getTenantIdFromUser, PUBLIC_TENANT_ID } from '../lib/public-tenant';

export const brandingRouter = router({
  // Get branding for current tenant
  getBranding: publicProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // public procedure - no auth check
      const tenantId = PUBLIC_TENANT_ID;
      
      const brandingResults = await db.select().from(brokerageBranding).where(eq(brokerageBranding.tenantId, tenantId)).limit(1);
      const branding = brandingResults[0] || null;

      return branding || null;
    } catch (error) {
      console.error('Error fetching branding:', error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch branding' });
    }
  }),

  // Update branding settings
  updateBranding: publicProcedure
    .input(
      z.object({
        brokerageName: z.string().min(1, 'Brokerage name is required'),
        tagline: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        licenseNumber: z.string().optional(),
        primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
        secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
        accentColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        // public procedure - no auth check
        const tenantId = PUBLIC_TENANT_ID;
        
        // Check if branding exists for this tenant
        const existingResults = await db.select().from(brokerageBranding).where(eq(brokerageBranding.tenantId, tenantId)).limit(1);
        const existing = existingResults[0] || null;

        if (existing) {
          // Update existing
          await db
            .update(brokerageBranding)
            .set({
              ...input,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(brokerageBranding.tenantId, tenantId));
        } else {
          // Create new
          await db.insert(brokerageBranding).values({
            tenantId: tenantId,
            ...input,
          });
        }

        return { success: true };
      } catch (error) {
        console.error('Error updating branding:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update branding' });
      }
    }),

  // Upload logo
  uploadLogo: publicProcedure
    .input(
      z.object({
        file: z.instanceof(File),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // public procedure - no auth check
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const tenantId = PUBLIC_TENANT_ID;

        const buffer = await input.file.arrayBuffer();
        const fileName = `branding-logo-${tenantId}-${Date.now()}.${input.file.name.split('.').pop()}`;

        // Upload to S3
        const { url } = await storagePut(
          `branding/${fileName}`,
          Buffer.from(buffer),
          input.file.type
        );

        // Update branding with logo URL
        const existingResults = await db.select().from(brokerageBranding).where(eq(brokerageBranding.tenantId, tenantId)).limit(1);
        const existing = existingResults[0] || null;

        if (existing) {
          await db
            .update(brokerageBranding)
            .set({
              logoUrl: url,
              logoFileName: fileName,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(brokerageBranding.tenantId, tenantId));
        } else {
          await db.insert(brokerageBranding).values({
            tenantId: tenantId,
            brokerageName: 'My Brokerage',
            logoUrl: url,
            logoFileName: fileName,
          });
        }

        return { url, fileName };
      } catch (error) {
        console.error('Error uploading logo:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to upload logo' });
      }
    }),
});
