/**
 * Dotloop API Integration Router
 * Handles syncing data from Dotloop API
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { DotloopAPIClient } from '../lib/dotloop-client';
import { TRPCError } from '@trpc/server';

/**
 * Transform Dotloop loop data to DotloopRecord format
 */
function transformDotloopToRecord(loop: any, participants: any[] = []) {
  const agentNames = participants
    .filter((p: any) => p.role === 'LISTING_AGENT' || p.role === 'BUYING_AGENT')
    .map((p: any) => p.name)
    .join(', ');

  return {
    loopId: loop.loopId || '',
    loopName: loop.name || '',
    loopStatus: loop.status || '',
    loopViewUrl: loop.viewUrl || '',
    address: loop.address?.displayName || '',
    city: loop.address?.city || '',
    state: loop.address?.state || '',
    price: parseFloat(loop.listingPrice || 0),
    salePrice: parseFloat(loop.salePrice || 0),
    closingDate: loop.closingDate || null,
    listingDate: loop.listingDate || null,
    createdDate: loop.created || new Date().toISOString(),
    agents: agentNames,
    propertyType: loop.propertyType || '',
    bedrooms: parseInt(loop.bedrooms || 0),
    bathrooms: parseInt(loop.bathrooms || 0),
    squareFootage: parseInt(loop.squareFootage || 0),
    commissionRate: parseFloat(loop.commissionRate || 0),
    commissionTotal: parseFloat(loop.totalCommission || 0),
    leadSource: 'Dotloop API',
    transactionType: loop.transactionType || 'Unknown',
  };
}

export const dotloopApiRouter = router({
  /**
   * Get available Dotloop profiles
   */
  getProfiles: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Get user's Dotloop token from database
      // This would be retrieved from oauth_tokens table
      // For now, returning empty array as placeholder
      return [];
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch Dotloop profiles',
      });
    }
  }),

  /**
   * Sync loops from Dotloop
   */
  syncLoops: protectedProcedure
    .input(
      z.object({
        profileId: z.string().min(1),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // In a real implementation, retrieve the user's Dotloop token
        // const token = await getTokenForUser(ctx.user.id);
        // if (!token) {
        //   throw new TRPCError({
        //     code: 'UNAUTHORIZED',
        //     message: 'Dotloop not connected',
        //   });
        // }

        // For now, return a placeholder response
        return {
          uploadId: `sync-${Date.now()}`,
          recordCount: 0,
          message: 'Dotloop API integration requires OAuth token setup',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to sync loops from Dotloop',
        });
      }
    }),

  /**
   * Get sync status
   */
  getSyncStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      return {
        isConnected: false,
        lastSync: null,
        nextSync: null,
        autoSyncEnabled: false,
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get sync status',
      });
    }
  }),

  /**
   * Enable/disable auto sync
   */
  setAutoSync: protectedProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return {
          autoSyncEnabled: input.enabled,
          message: input.enabled ? 'Auto sync enabled' : 'Auto sync disabled',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update auto sync setting',
        });
      }
    }),

  /**
   * Test Dotloop connection
   */
  testConnection: protectedProcedure.query(async ({ ctx }) => {
    try {
      return {
        connected: false,
        message: 'Dotloop API integration requires OAuth token setup',
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to test Dotloop connection',
      });
    }
  }),
});
