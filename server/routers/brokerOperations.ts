import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import {
  commissionCalculationSnapshots,
  commissionPlanVersions,
  importMappingTemplates,
  importRuns,
} from '../../drizzle/schema';
import { getDb } from '../db';
import { PUBLIC_TENANT_ID } from '../lib/public-tenant';
import { publicProcedure, router } from '../_core/trpc';

const jsonRecord = z.record(z.string(), z.unknown());

function parseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function nextPlanVersionNumber(existing: Array<{ versionNumber: number }>) {
  return existing.reduce((highest, version) => Math.max(highest, version.versionNumber), 0) + 1;
}

export async function createCommissionPlanVersion(
  db: any,
  input: {
    planId: string;
    planSnapshot: Record<string, unknown>;
    lifecycle?: 'draft' | 'active' | 'archived';
    effectiveStartDate?: string | null;
    effectiveEndDate?: string | null;
    changeNote?: string | null;
  },
) {
  const existing = await db
    .select({ versionNumber: commissionPlanVersions.versionNumber })
    .from(commissionPlanVersions)
    .where(and(
      eq(commissionPlanVersions.tenantId, PUBLIC_TENANT_ID),
      eq(commissionPlanVersions.planId, input.planId),
    ));

  const versionNumber = nextPlanVersionNumber(existing);

  const version = {
    id: randomUUID(),
    tenantId: PUBLIC_TENANT_ID,
    planId: input.planId,
    versionNumber,
    lifecycle: input.lifecycle ?? 'active',
    effectiveStartDate: input.effectiveStartDate || null,
    effectiveEndDate: input.effectiveEndDate || null,
    changeNote: input.changeNote || null,
    planSnapshot: JSON.stringify(input.planSnapshot),
  } as const;
  await db.insert(commissionPlanVersions).values(version);
  return version;
}

export const brokerOperationsRouter = router({
  createImportRun: publicProcedure
    .input(z.object({
      fileName: z.string().trim().min(1).max(255),
      reportingPeriodLabel: z.string().trim().min(1).max(255),
      periodStart: z.string().max(10).optional().nullable(),
      periodEnd: z.string().max(10).optional().nullable(),
      recordCount: z.number().int().min(1).max(50_000),
      dataQuality: z.number().int().min(0).max(100),
      fieldCompleteness: z.record(z.string(), z.number().min(0).max(100)).optional(),
      warnings: z.array(z.string().max(500)).max(100).optional(),
      mappingTemplateId: z.string().max(64).optional().nullable(),
      sourceChecksum: z.string().max(64).optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Data storage is temporarily unavailable.' });
      const run = {
        id: randomUUID(),
        tenantId: PUBLIC_TENANT_ID,
        fileName: input.fileName,
        reportingPeriodLabel: input.reportingPeriodLabel,
        periodStart: input.periodStart || null,
        periodEnd: input.periodEnd || null,
        status: 'ready' as const,
        recordCount: input.recordCount,
        dataQuality: input.dataQuality,
        fieldCompleteness: input.fieldCompleteness ? JSON.stringify(input.fieldCompleteness) : null,
        warnings: input.warnings?.length ? JSON.stringify(input.warnings) : null,
        mappingTemplateId: input.mappingTemplateId || null,
        sourceChecksum: input.sourceChecksum || null,
      };
      await db.insert(importRuns).values(run);
      if (input.mappingTemplateId) {
        const templates = await db.select().from(importMappingTemplates).where(and(
          eq(importMappingTemplates.id, input.mappingTemplateId),
          eq(importMappingTemplates.tenantId, PUBLIC_TENANT_ID),
        )).limit(1);
        if (templates[0]) {
          await db.update(importMappingTemplates).set({ useCount: templates[0].useCount + 1 }).where(eq(importMappingTemplates.id, input.mappingTemplateId));
        }
      }
      return run;
    }),

  listImportRuns: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Data storage is temporarily unavailable.' });
    const runs = await db.select().from(importRuns).where(eq(importRuns.tenantId, PUBLIC_TENANT_ID)).orderBy(importRuns.createdAt);
    return runs.reverse().map((run) => ({
      ...run,
      fieldCompleteness: parseJson<Record<string, number>>(run.fieldCompleteness),
      warnings: parseJson<string[]>(run.warnings) ?? [],
    }));
  }),

  activateImportRun: publicProcedure
    .input(z.object({ importRunId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Data storage is temporarily unavailable.' });
      const [run] = await db.select().from(importRuns).where(and(eq(importRuns.id, input.importRunId), eq(importRuns.tenantId, PUBLIC_TENANT_ID))).limit(1);
      if (!run) throw new TRPCError({ code: 'NOT_FOUND', message: 'Import run not found.' });
      await db.transaction(async (tx) => {
        await tx.update(importRuns).set({ status: 'archived' }).where(and(eq(importRuns.tenantId, PUBLIC_TENANT_ID), eq(importRuns.status, 'active')));
        await tx.update(importRuns).set({ status: 'active' }).where(eq(importRuns.id, input.importRunId));
      });
      return { success: true };
    }),

  saveMappingTemplate: publicProcedure
    .input(z.object({
      id: z.string().max(64).optional(),
      name: z.string().trim().min(1).max(255),
      headers: z.array(z.string().max(255)).min(1).max(500),
      mapping: z.record(z.string(), z.string().max(255)),
      isDefault: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Data storage is temporarily unavailable.' });
      const id = input.id || randomUUID();
      if (input.isDefault) {
        await db.update(importMappingTemplates).set({ isDefault: 0 }).where(eq(importMappingTemplates.tenantId, PUBLIC_TENANT_ID));
      }
      const record = {
        id,
        tenantId: PUBLIC_TENANT_ID,
        name: input.name,
        headers: JSON.stringify(input.headers),
        mappingJson: JSON.stringify(input.mapping),
        isDefault: input.isDefault ? 1 : 0,
      };
      const [existing] = await db.select().from(importMappingTemplates).where(and(eq(importMappingTemplates.id, id), eq(importMappingTemplates.tenantId, PUBLIC_TENANT_ID))).limit(1);
      if (existing) {
        await db.update(importMappingTemplates).set(record).where(eq(importMappingTemplates.id, id));
      } else {
        await db.insert(importMappingTemplates).values(record);
      }
      return record;
    }),

  listMappingTemplates: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Data storage is temporarily unavailable.' });
    const templates = await db.select().from(importMappingTemplates).where(eq(importMappingTemplates.tenantId, PUBLIC_TENANT_ID));
    return templates.map((template) => ({
      ...template,
      headers: parseJson<string[]>(template.headers) ?? [],
      mapping: parseJson<Record<string, string>>(template.mappingJson) ?? {},
    }));
  }),

  deleteMappingTemplate: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Data storage is temporarily unavailable.' });
      await db.delete(importMappingTemplates).where(and(eq(importMappingTemplates.id, input.id), eq(importMappingTemplates.tenantId, PUBLIC_TENANT_ID)));
      return { success: true };
    }),

  listPlanVersions: publicProcedure
    .input(z.object({ planId: z.string().max(64).optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Data storage is temporarily unavailable.' });
      const whereClause = input?.planId
        ? and(eq(commissionPlanVersions.tenantId, PUBLIC_TENANT_ID), eq(commissionPlanVersions.planId, input.planId))
        : eq(commissionPlanVersions.tenantId, PUBLIC_TENANT_ID);
      const versions = await db.select().from(commissionPlanVersions).where(whereClause).orderBy(commissionPlanVersions.createdAt);
      return versions.reverse().map((version) => ({ ...version, planSnapshot: parseJson<Record<string, unknown>>(version.planSnapshot) ?? {} }));
    }),

  createCalculationSnapshot: publicProcedure
    .input(z.object({
      importRunId: z.string().uuid().optional().nullable(),
      planVersionId: z.string().uuid().optional().nullable(),
      agentName: z.string().trim().min(1).max(255),
      reportingPeriodLabel: z.string().trim().min(1).max(255),
      transactionCount: z.number().int().min(0),
      grossCommission: z.number().min(0),
      netCommission: z.number().min(0),
      companyDollar: z.number().min(0),
      calculationData: jsonRecord,
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Data storage is temporarily unavailable.' });
      const snapshot = {
        id: randomUUID(), tenantId: PUBLIC_TENANT_ID, importRunId: input.importRunId || null,
        planVersionId: input.planVersionId || null, agentName: input.agentName,
        reportingPeriodLabel: input.reportingPeriodLabel, transactionCount: input.transactionCount,
        grossCommission: String(input.grossCommission), netCommission: String(input.netCommission),
        companyDollar: String(input.companyDollar), calculationData: JSON.stringify(input.calculationData),
      };
      await db.insert(commissionCalculationSnapshots).values(snapshot);
      return snapshot;
    }),

  listCalculationSnapshots: publicProcedure
    .input(z.object({ agentName: z.string().trim().min(1).max(255).optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Data storage is temporarily unavailable.' });
      const snapshots = await db.select().from(commissionCalculationSnapshots).where(input?.agentName
        ? and(eq(commissionCalculationSnapshots.tenantId, PUBLIC_TENANT_ID), eq(commissionCalculationSnapshots.agentName, input.agentName))
        : eq(commissionCalculationSnapshots.tenantId, PUBLIC_TENANT_ID));
      return snapshots.reverse().map((snapshot) => ({ ...snapshot, calculationData: parseJson<Record<string, unknown>>(snapshot.calculationData) ?? {} }));
    }),
});
