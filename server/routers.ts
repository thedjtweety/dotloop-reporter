import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  createUpload,
  getUploadById,
  getTransactionsByUploadId,
  createTransactions,
  deleteUpload,
  getUserUploads,
} from "./uploadDb";
import { commissionRouter } from "./commissionRouter";
import type { DotloopRecord } from "../shared/types";

export const uploadsRouter = router({
  // Create a new upload
  create: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        transactions: z.array(z.record(z.unknown())),
        fileSize: z.number().optional(),
        validationTimeMs: z.number().optional(),
        parsingTimeMs: z.number().optional(),
        totalTimeMs: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create the upload record
      const uploadId = await createUpload({
        fileName: input.fileName,
        recordCount: input.transactions.length,
        userId: ctx.user.id,
        tenantId: ctx.user.tenantId,
        fileSize: input.fileSize,
        validationTimeMs: input.validationTimeMs,
        parsingTimeMs: input.parsingTimeMs,
        totalTimeMs: input.totalTimeMs,
      });

      // Transform transactions to database format
      const transactionsToInsert = input.transactions.map((t: any) => ({
          loopId: t.loopId || "",
          loopViewUrl: t.loopViewUrl || "",
          loopName: t.loopName || "",
          loopStatus: t.loopStatus || "",
          createdDate: t.createdDate || "",
          closingDate: t.closingDate || "",
          listingDate: t.listingDate || "",
          offerDate: t.offerDate || "",
          address: t.address || "",
          price: t.price || 0,
          propertyType: t.propertyType || null,
          bedrooms: t.bedrooms || 0,
          bathrooms: t.bathrooms || 0,
          squareFootage: t.squareFootage || 0,
          city: t.city || null,
          state: t.state || null,
          county: t.county || null,
          leadSource: t.leadSource || null,
          agents: t.agents || null,
          createdBy: t.createdBy || null,
          earnestMoney: t.earnestMoney || 0,
          salePrice: t.salePrice || 0,
          commissionRate: t.commissionRate || 0,
          commissionTotal: t.commissionTotal || 0,
          buySideCommission: t.buySideCommission || 0,
          sellSideCommission: t.sellSideCommission || 0,
          companyDollar: t.companyDollar || 0,
          referralSource: t.referralSource || null,
          referralPercentage: t.referralPercentage || 0,
          complianceStatus: t.complianceStatus || null,
          tags: t.tags ? JSON.stringify(t.tags) : null,
          originalPrice: t.originalPrice || 0,
          yearBuilt: t.yearBuilt || 0,
          lotSize: t.lotSize || 0,
          subdivision: t.subdivision || null,
          uploadId,
          userId: ctx.user.id,
        }));

        // Bulk insert transactions
        await createTransactions(transactionsToInsert);

        return { uploadId, recordCount: input.transactions.length };
      }),

    // Get transactions for a specific upload
    getTransactions: protectedProcedure
      .input(z.object({ uploadId: z.number() }))
      .query(async ({ ctx, input }) => {
        const dbTransactions = await getTransactionsByUploadId(
          input.uploadId,
          ctx.user.id
        );

        // Convert back to DotloopRecord format
        return dbTransactions.map((t) => ({
          loopId: t.loopId || "",
          loopViewUrl: t.loopViewUrl || "",
          loopName: t.loopName || "",
          loopStatus: t.loopStatus || "",
          createdDate: t.createdDate || "",
          closingDate: t.closingDate || "",
          listingDate: t.listingDate || "",
          offerDate: t.offerDate || "",
          address: t.address || "",
          price: t.price || 0,
          propertyType: t.propertyType || "",
          bedrooms: t.bedrooms || 0,
          bathrooms: t.bathrooms || 0,
          squareFootage: t.squareFootage || 0,
          city: t.city || "",
          state: t.state || "",
          county: t.county || "",
          leadSource: t.leadSource || "",
          agents: t.agents || "",
          createdBy: t.createdBy || "",
          earnestMoney: t.earnestMoney || 0,
          salePrice: t.salePrice || 0,
          commissionRate: t.commissionRate || 0,
          commissionTotal: t.commissionTotal || 0,
          buySideCommission: t.buySideCommission || 0,
          sellSideCommission: t.sellSideCommission || 0,
          companyDollar: t.companyDollar || 0,
          referralSource: t.referralSource || "",
          referralPercentage: t.referralPercentage || 0,
          complianceStatus: t.complianceStatus || "",
          tags: t.tags ? JSON.parse(t.tags) : [],
          originalPrice: t.originalPrice || 0,
          yearBuilt: t.yearBuilt || 0,
          lotSize: t.lotSize || 0,
          subdivision: t.subdivision || "",
        }));
      }),

    // Delete an upload
    delete: protectedProcedure
      .input(z.object({ uploadId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteUpload(input.uploadId, ctx.user.id);
        return { success: true };
      }),

    // Get upload history for the current user
    getHistory: protectedProcedure.query(async ({ ctx }) => {
      const uploads = await getUserUploads(ctx.user.id);
      return uploads.map((u) => ({
        id: u.id,
        fileName: u.fileName,
        recordCount: u.recordCount,
        createdAt: u.createdAt,
      }));
    }),

    // List all uploads for the current user (alias for getHistory)
    list: protectedProcedure.query(async ({ ctx }) => {
      const uploads = await getUserUploads(ctx.user.id);
      return uploads.map((u) => ({
        id: u.id,
        fileName: u.fileName,
        recordCount: u.recordCount,
        createdAt: u.createdAt,
      }));
    }),
});

const authRouter = router({
  me: protectedProcedure.query(({ ctx }) => ctx.user),
});

export const appRouter = router({
  auth: authRouter,
  uploads: uploadsRouter,
  commission: commissionRouter,
});

export type AppRouter = typeof appRouter;
