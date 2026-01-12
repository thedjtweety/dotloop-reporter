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
import type { DotloopRecord } from "../shared/types";

export const uploadsRouter = router({
  // Create a new upload
  create: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        transactions: z.array(z.record(z.unknown())),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create the upload record
      const uploadId = await createUpload(
        input.fileName,
        input.transactions.length,
        ctx.user.id
      );

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
});

export const appRouter = router({
  uploads: uploadsRouter,
});

export type AppRouter = typeof appRouter;
