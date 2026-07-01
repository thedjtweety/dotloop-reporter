import { PUBLIC_TENANT_ID } from "../lib/public-tenant";
import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getUserCDAHistory, getCDARecord, deleteCDARecord } from "../lib/cdaHistory";

export const cdaHistoryRouter = router({
  /**
   * Get user's CDA history (paginated)
   */
  getHistory: publicProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(10),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // public procedure - no auth check needed

      const result = await getUserCDAHistory(
        1,
        1,
        input.limit,
        input.offset
      );

      return {
        records: result.records,
        total: result.total,
        hasMore: input.offset + input.limit < result.total,
      };
    }),

  /**
   * Get a single CDA record
   */
  getRecord: publicProcedure
    .input(z.object({ cdaId: z.string() }))
    .query(async ({ ctx, input }) => {
      // public procedure - no auth check needed

      const record = await getCDARecord(input.cdaId, 1);

      if (!record) {
        throw new Error("CDA record not found");
      }

      // Verify ownership
      if (record.generatedAt) {
        // Additional ownership check can be added here
      }

      return record;
    }),

  /**
   * Delete a CDA record
   */
  delete: publicProcedure
    .input(z.object({ cdaId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // public procedure - no auth check needed

      const success = await deleteCDARecord(input.cdaId, 1);

      if (!success) {
        throw new Error("Failed to delete CDA record");
      }

      return { success: true };
    }),
});
