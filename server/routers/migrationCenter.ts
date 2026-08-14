import { TRPCError } from '@trpc/server';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import {
  migrationAuditEvents,
  migrationExceptions,
  migrationManifestItems,
  migrationRuns,
} from '../../drizzle/schema';
import { getDb } from '../db';
import { PUBLIC_TENANT_ID } from '../lib/public-tenant';
import {
  calculateMigrationCloseout,
  determineFileCountReconciliation,
  validateMigrationManifest,
  type MigrationManifestInputRow,
} from '../lib/migration-manifest';
import { publicProcedure, router } from '../_core/trpc';

const manifestRowSchema = z.object({
  sourceTransactionId: z.string().trim().max(255).optional().nullable(),
  transactionName: z.string().trim().max(500),
  propertyAddress: z.string().trim().max(2_000).optional().nullable(),
  primaryAgent: z.string().trim().max(255).optional().nullable(),
  closingDate: z.string().trim().max(10).optional().nullable(),
  sourceFolderReference: z.string().trim().max(10_000).optional().nullable(),
  expectedFileCount: z.number().int().min(0).max(100_000).optional().nullable(),
  notes: z.string().trim().max(10_000).optional().nullable(),
});

const runIdSchema = z.object({ runId: z.string().uuid() });

function issueCategory(issue: { category: string }) {
  return issue.category as 'missing_source_reference' | 'missing_required_metadata' | 'duplicate_transaction' | 'invalid_manifest_row';
}

async function refreshRunCounts(db: any, runId: string) {
  const [items, exceptions] = await Promise.all([
    db.select().from(migrationManifestItems).where(eq(migrationManifestItems.runId, runId)),
    db.select().from(migrationExceptions).where(and(eq(migrationExceptions.runId, runId), eq(migrationExceptions.status, 'open'))),
  ]);
  const openBlockingExceptions = exceptions.filter((exception: any) => exception.severity === 'blocking').length;
  const reconciled = items.filter((item: any) => item.status === 'reconciled').length;
  await db.update(migrationRuns).set({
    recordsImported: items.length,
    recordsReconciled: reconciled,
    openExceptionCount: exceptions.length,
  }).where(eq(migrationRuns.id, runId));
  return { items, exceptions, openBlockingExceptions };
}

export const migrationCenterRouter = router({
  template: publicProcedure.query(() => ({
    columns: ['sourceTransactionId', 'transactionName', 'propertyAddress', 'primaryAgent', 'closingDate', 'sourceFolderReference', 'expectedFileCount', 'notes'],
    requiredColumns: ['transactionName', 'sourceFolderReference', 'expectedFileCount'],
    exampleFileName: 'skyslope-migration-manifest.csv',
  })),

  createRun: publicProcedure
    .input(z.object({
      name: z.string().trim().min(1).max(255),
      storageProvider: z.enum(['google_drive', 'dropbox', 'local', 'other']),
      storageReference: z.string().trim().max(10_000).optional().nullable(),
      manifestChecksum: z.string().trim().min(16).max(64),
      rows: z.array(manifestRowSchema).min(1).max(10_000),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Migration storage is temporarily unavailable.' });

      const existing = await db.select().from(migrationRuns).where(and(
        eq(migrationRuns.tenantId, PUBLIC_TENANT_ID),
        eq(migrationRuns.manifestChecksum, input.manifestChecksum),
      ));
      const duplicate = existing.find((run) => run.status !== 'archived');
      if (duplicate) return { run: duplicate, duplicate: true };

      const validated = validateMigrationManifest(input.rows as MigrationManifestInputRow[]);
      const runId = randomUUID();
      const blockingCount = validated.flatMap((row) => row.issues).filter((issue) => issue.severity === 'blocking').length;
      const run = {
        id: runId,
        tenantId: PUBLIC_TENANT_ID,
        name: input.name,
        storageProvider: input.storageProvider,
        storageReference: input.storageReference || null,
        status: blockingCount ? 'staging' as const : 'manifest_ready' as const,
        recordsExpected: validated.length,
        recordsImported: validated.length,
        recordsReconciled: 0,
        openExceptionCount: validated.flatMap((row) => row.issues).length,
        manifestChecksum: input.manifestChecksum,
      };

      await db.transaction(async (tx: any) => {
        await tx.insert(migrationRuns).values(run);
        const itemRecords = validated.map((row) => ({
          id: randomUUID(), runId, sourceTransactionId: row.sourceTransactionId?.trim() || null,
          transactionName: row.transactionName, propertyAddress: row.propertyAddress?.trim() || null,
          primaryAgent: row.primaryAgent?.trim() || null, closingDate: row.closingDate?.trim() || null,
          sourceFolderReference: row.sourceFolderReference || null, expectedFileCount: row.expectedFileCount,
          status: row.isReady ? 'ready' as const : 'exception' as const,
          validationJson: JSON.stringify(row.issues), notes: row.notes?.trim() || null,
        }));
        await tx.insert(migrationManifestItems).values(itemRecords);
        const exceptionRecords = validated.flatMap((row, index) => row.issues.map((issue) => ({
          id: randomUUID(), runId, manifestItemId: itemRecords[index].id,
          category: issueCategory(issue), severity: issue.severity, status: 'open' as const, details: issue.message,
        })));
        if (exceptionRecords.length) await tx.insert(migrationExceptions).values(exceptionRecords);
        await tx.insert(migrationAuditEvents).values([
          { id: randomUUID(), runId, action: 'run_created' as const, details: JSON.stringify({ source: 'skyslope', storageProvider: input.storageProvider }) },
          { id: randomUUID(), runId, action: 'manifest_imported' as const, details: JSON.stringify({ rows: validated.length, blockingCount }) },
        ]);
      });
      return { run, duplicate: false, validation: validated.map((row) => ({ transactionName: row.transactionName, issues: row.issues, isReady: row.isReady })) };
    }),

  listRuns: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Migration storage is temporarily unavailable.' });
    return db.select().from(migrationRuns).where(eq(migrationRuns.tenantId, PUBLIC_TENANT_ID)).orderBy(desc(migrationRuns.createdAt));
  }),

  getRun: publicProcedure.input(runIdSchema).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Migration storage is temporarily unavailable.' });
    const [run] = await db.select().from(migrationRuns).where(and(eq(migrationRuns.id, input.runId), eq(migrationRuns.tenantId, PUBLIC_TENANT_ID))).limit(1);
    if (!run) throw new TRPCError({ code: 'NOT_FOUND', message: 'Migration run not found.' });
    const [items, exceptions, audit] = await Promise.all([
      db.select().from(migrationManifestItems).where(eq(migrationManifestItems.runId, input.runId)),
      db.select().from(migrationExceptions).where(eq(migrationExceptions.runId, input.runId)),
      db.select().from(migrationAuditEvents).where(eq(migrationAuditEvents.runId, input.runId)).orderBy(desc(migrationAuditEvents.createdAt)),
    ]);
    const openBlockingExceptions = exceptions.filter((exception) => exception.status === 'open' && exception.severity === 'blocking').length;
    return { run, items, exceptions, audit, closeout: calculateMigrationCloseout(items, openBlockingExceptions) };
  }),

  reconcileItem: publicProcedure
    .input(z.object({
      itemId: z.string().uuid(),
      destinationLoopId: z.string().trim().max(255),
      destinationLoopName: z.string().trim().min(1).max(500),
      reconciledFileCount: z.number().int().min(0).max(100_000),
      notes: z.string().trim().max(10_000).optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Migration storage is temporarily unavailable.' });
      const [item] = await db.select().from(migrationManifestItems).where(eq(migrationManifestItems.id, input.itemId)).limit(1);
      if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'Migration manifest item not found.' });
      const [run] = await db.select().from(migrationRuns).where(and(eq(migrationRuns.id, item.runId), eq(migrationRuns.tenantId, PUBLIC_TENANT_ID))).limit(1);
      if (!run) throw new TRPCError({ code: 'NOT_FOUND', message: 'Migration run not found.' });
      const isMatched = input.reconciledFileCount === item.expectedFileCount;
      await db.transaction(async (tx: any) => {
        await tx.update(migrationManifestItems).set({
          destinationLoopId: input.destinationLoopId, destinationLoopName: input.destinationLoopName,
          reconciledFileCount: input.reconciledFileCount, notes: input.notes || item.notes,
          status: isMatched ? 'reconciled' : 'exception',
        }).where(eq(migrationManifestItems.id, item.id));
        await tx.update(migrationExceptions).set({ status: 'resolved', resolvedAt: new Date().toISOString() })
          .where(and(eq(migrationExceptions.manifestItemId, item.id), eq(migrationExceptions.category, 'missing_destination_loop'), eq(migrationExceptions.status, 'open')));
        const openMismatches = await tx.select().from(migrationExceptions).where(and(
          eq(migrationExceptions.manifestItemId, item.id),
          eq(migrationExceptions.category, 'file_count_mismatch'),
          eq(migrationExceptions.status, 'open'),
        ));
        const mismatchDecision = determineFileCountReconciliation(item.expectedFileCount, input.reconciledFileCount, openMismatches.length > 0);
        if (mismatchDecision.mismatchAction === 'resolve') {
          if (openMismatches.length) {
            await tx.update(migrationExceptions).set({
              status: 'resolved',
              resolutionNote: 'Resolved automatically after the reconciled file count matched the manifest.',
              resolvedAt: new Date().toISOString(),
            }).where(and(eq(migrationExceptions.manifestItemId, item.id), eq(migrationExceptions.category, 'file_count_mismatch'), eq(migrationExceptions.status, 'open')));
          }
        } else if (mismatchDecision.mismatchAction === 'update') {
          await tx.update(migrationExceptions).set({
            details: `Expected ${item.expectedFileCount} files, but reconciled ${input.reconciledFileCount}.`,
          }).where(eq(migrationExceptions.id, openMismatches[0].id));
        } else if (mismatchDecision.mismatchAction === 'create') {
          await tx.insert(migrationExceptions).values({
            id: randomUUID(), runId: item.runId, manifestItemId: item.id, category: 'file_count_mismatch', severity: 'blocking', status: 'open',
            details: `Expected ${item.expectedFileCount} files, but reconciled ${input.reconciledFileCount}.`,
          });
        }
        await tx.insert(migrationAuditEvents).values({
          id: randomUUID(), runId: item.runId, manifestItemId: item.id,
          action: isMatched ? 'row_reconciled' : 'row_updated', details: JSON.stringify({ destinationLoopId: input.destinationLoopId, reconciledFileCount: input.reconciledFileCount }),
        });
      });
      await refreshRunCounts(db, item.runId);
      return { success: true, matched: isMatched };
    }),

  resolveException: publicProcedure
    .input(z.object({ exceptionId: z.string().uuid(), action: z.enum(['resolved', 'waived']), resolutionNote: z.string().trim().min(1).max(10_000) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Migration storage is temporarily unavailable.' });
      const [exception] = await db.select().from(migrationExceptions).where(eq(migrationExceptions.id, input.exceptionId)).limit(1);
      if (!exception) throw new TRPCError({ code: 'NOT_FOUND', message: 'Migration exception not found.' });
      const [run] = await db.select().from(migrationRuns).where(and(eq(migrationRuns.id, exception.runId), eq(migrationRuns.tenantId, PUBLIC_TENANT_ID))).limit(1);
      if (!run) throw new TRPCError({ code: 'NOT_FOUND', message: 'Migration run not found.' });
      await db.transaction(async (tx: any) => {
        await tx.update(migrationExceptions).set({ status: input.action, resolutionNote: input.resolutionNote, resolvedAt: new Date().toISOString() }).where(eq(migrationExceptions.id, exception.id));
        await tx.insert(migrationAuditEvents).values({
          id: randomUUID(), runId: exception.runId, manifestItemId: exception.manifestItemId,
          action: 'exception_resolved', details: JSON.stringify({ exceptionId: exception.id, action: input.action, resolutionNote: input.resolutionNote }),
        });
      });
      await refreshRunCounts(db, exception.runId);
      return { success: true };
    }),

  completeRun: publicProcedure.input(runIdSchema).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Migration storage is temporarily unavailable.' });
    const [run] = await db.select().from(migrationRuns).where(and(eq(migrationRuns.id, input.runId), eq(migrationRuns.tenantId, PUBLIC_TENANT_ID))).limit(1);
    if (!run) throw new TRPCError({ code: 'NOT_FOUND', message: 'Migration run not found.' });
    const { items, openBlockingExceptions } = await refreshRunCounts(db, input.runId);
    const closeout = calculateMigrationCloseout(items, openBlockingExceptions);
    if (!closeout.isReadyToComplete) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Resolve all blocking exceptions and reconcile every included row before completing this migration.' });
    await db.transaction(async (tx: any) => {
      await tx.update(migrationRuns).set({ status: 'completed', completedAt: new Date().toISOString() }).where(eq(migrationRuns.id, input.runId));
      await tx.insert(migrationAuditEvents).values({ id: randomUUID(), runId: input.runId, action: 'run_completed', details: JSON.stringify(closeout) });
    });
    return { success: true, closeout };
  }),

  archiveRun: publicProcedure.input(runIdSchema).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Migration storage is temporarily unavailable.' });
    const [run] = await db.select().from(migrationRuns).where(and(eq(migrationRuns.id, input.runId), eq(migrationRuns.tenantId, PUBLIC_TENANT_ID))).limit(1);
    if (!run) throw new TRPCError({ code: 'NOT_FOUND', message: 'Migration run not found.' });
    await db.transaction(async (tx: any) => {
      await tx.update(migrationRuns).set({ status: 'archived', archivedAt: new Date().toISOString() }).where(eq(migrationRuns.id, input.runId));
      await tx.insert(migrationAuditEvents).values({ id: randomUUID(), runId: input.runId, action: 'run_archived', details: '{}' });
    });
    return { success: true };
  }),
});
