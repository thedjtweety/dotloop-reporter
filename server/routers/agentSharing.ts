/**
 * Agent sharing router
 *
 * A broker upload is persisted as a broker-owned dataset. The browser receives a
 * high-entropy owner secret once and stores it locally; the server stores only its
 * SHA-256 hash. Agent links contain a different high-entropy token and can return
 * only records whose comma-separated agent list contains that named agent.
 */

import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { z } from 'zod';
import {
  agentShareDatasets,
  agentShareAccessLogs,
  agentShareLinks,
  agentShareRecords,
  agentAssignments,
  commissionPlans,
  commissionPlanVersions,
} from '../../drizzle/schema';
import { getDb } from '../db';
import { publicProcedure, router } from '../_core/trpc';
import { PUBLIC_TENANT_ID } from '../lib/public-tenant';
import { calculateTransactionCommission, type CommissionPlan } from '../lib/commission-calculator';
import { isPlanVersionEligible, latestPlanVersions, parsePlanSnapshot } from '../lib/plan-lifecycle';

const MAX_RECORDS_PER_DATASET = 5_000;
const MAX_RECORD_BYTES = 32_000;
const DEFAULT_LINK_EXPIRY_DAYS = 30;

export function hashSecret(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function makeSecret() {
  return randomBytes(32).toString('base64url');
}

export function toSqlTimestamp(date: Date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

export function getRecordKey(record: Record<string, unknown>, index: number) {
  const loopId = typeof record.loopId === 'string' ? record.loopId.trim() : '';
  if (loopId) return `loop:${loopId}`.slice(0, 255);

  const loopName = typeof record.loopName === 'string' ? record.loopName : '';
  const closingDate = typeof record.closingDate === 'string' ? record.closingDate : '';
  const salePrice = record.salePrice ?? record.price ?? '';
  return `record:${loopName}|${closingDate}|${String(salePrice)}|${index}`.slice(0, 255);
}

export function agentNames(value: string | null | undefined) {
  return (value ?? '')
    .split(',')
    .map((name) => name.trim().toLocaleLowerCase())
    .filter(Boolean);
}

export function isRecordForAgent(record: Record<string, unknown>, agentName: string) {
  return agentNames(typeof record.agents === 'string' ? record.agents : '')
    .includes(agentName.trim().toLocaleLowerCase());
}

export function hasAssignedAgents(records: Array<{ agents?: string | null }>) {
  return records.some((record) => agentNames(record.agents).length > 0);
}

function readNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[$,%\s,]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function getSharedTransactionCalculationInput(record: Record<string, unknown>, index: number, agentName: string) {
  const salePrice = readNumber(record.salePrice ?? record.price);
  const csvCommissionTotal = readNumber(record.commissionTotal);
  const declaredRate = readNumber(record.commissionRate);
  const commissionRate = declaredRate || (salePrice > 0 ? (csvCommissionTotal / salePrice) * 100 : 0);
  return {
    id: typeof record.loopId === 'string' && record.loopId ? record.loopId : `shared-${index}`,
    loopName: typeof record.loopName === 'string' && record.loopName ? record.loopName : 'Shared transaction',
    closingDate: typeof record.closingDate === 'string' && record.closingDate ? record.closingDate : new Date(0).toISOString(),
    agents: typeof record.agents === 'string' && record.agents ? record.agents : agentName,
    salePrice,
    commissionRate,
  };
}

async function requireOwnerDataset(datasetId: string, ownerSecret: string) {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Data storage is temporarily unavailable.' });
  }

  const ownerSecretHash = hashSecret(ownerSecret);
  const [dataset] = await db
    .select()
    .from(agentShareDatasets)
    .where(and(
      eq(agentShareDatasets.id, datasetId),
      eq(agentShareDatasets.ownerSecretHash, ownerSecretHash),
      eq(agentShareDatasets.isActive, 1),
    ))
    .limit(1);

  if (!dataset) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'That broker dataset is unavailable.' });
  }

  return { db, dataset };
}

export const agentSharingRouter = router({
  /** Persists the broker's currently loaded normalized CSV data and returns its owner secret once. */
  publishDataset: publicProcedure
    .input(z.object({
      fileName: z.string().trim().min(1).max(255),
      records: z.array(z.record(z.string(), z.unknown())).min(1).max(MAX_RECORDS_PER_DATASET),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Data storage is temporarily unavailable.' });
      }

      const serialized = input.records.map((record, index) => {
        const recordJson = JSON.stringify(record);
        if (Buffer.byteLength(recordJson, 'utf8') > MAX_RECORD_BYTES) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Transaction ${index + 1} is too large to share safely. Remove unneeded long text fields and try again.`,
          });
        }
        return {
          datasetId: '',
          sourceKey: getRecordKey(record, index),
          agents: typeof record.agents === 'string' ? record.agents : null,
          recordJson,
        };
      });

      if (!hasAssignedAgents(serialized)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Agent sharing requires at least one populated Agent field in the uploaded CSV.',
        });
      }

      const datasetId = randomUUID();
      const ownerSecret = makeSecret();
      await db.transaction(async (tx) => {
        await tx.insert(agentShareDatasets).values({
          id: datasetId,
          ownerSecretHash: hashSecret(ownerSecret),
          fileName: input.fileName,
          recordCount: serialized.length,
          isActive: 1,
        });

        const batchSize = 100;
        for (let start = 0; start < serialized.length; start += batchSize) {
          await tx.insert(agentShareRecords).values(
            serialized.slice(start, start + batchSize).map((record) => ({ ...record, datasetId })),
          );
        }
      });

      return { datasetId, ownerSecret, recordCount: serialized.length };
    }),

  /** Returns safe link metadata for the broker who still holds the local owner secret. */
  listOwnerLinks: publicProcedure
    .input(z.object({ datasetId: z.string().uuid(), ownerSecret: z.string().min(32) }))
    .query(async ({ input }) => {
      const { db, dataset } = await requireOwnerDataset(input.datasetId, input.ownerSecret);
      const links = await db
        .select({
          id: agentShareLinks.id,
          agentName: agentShareLinks.agentName,
          expiresAt: agentShareLinks.expiresAt,
          isRevoked: agentShareLinks.isRevoked,
          createdAt: agentShareLinks.createdAt,
          lastAccessedAt: agentShareLinks.lastAccessedAt,
          recipientEmail: agentShareLinks.recipientEmail,
          reportingPeriodLabel: agentShareLinks.reportingPeriodLabel,
        })
        .from(agentShareLinks)
        .where(eq(agentShareLinks.datasetId, dataset.id));

      return {
        dataset: { id: dataset.id, fileName: dataset.fileName, recordCount: dataset.recordCount },
        links,
      };
    }),

  /** Generates a brand-new, agent-scoped, revocable link. Raw tokens are returned once only. */
  createAgentLink: publicProcedure
    .input(z.object({
      datasetId: z.string().uuid(),
      ownerSecret: z.string().min(32),
      agentName: z.string().trim().min(1).max(255),
      expiresInDays: z.number().int().min(1).max(365).optional(),
      recipientEmail: z.string().trim().email().max(320).optional().nullable(),
      reportingPeriodLabel: z.string().trim().min(1).max(255).optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const { db } = await requireOwnerDataset(input.datasetId, input.ownerSecret);
      const assignedRows = await db
        .select({ agents: agentShareRecords.agents })
        .from(agentShareRecords)
        .where(eq(agentShareRecords.datasetId, input.datasetId));
      const agentIsPresent = assignedRows.some((row) =>
        agentNames(row.agents).includes(input.agentName.toLocaleLowerCase()),
      );
      if (!agentIsPresent) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This agent does not appear in the prepared dataset. Refresh the broker preview and select a listed agent.',
        });
      }

      const token = makeSecret();
      const expiryDays = input.expiresInDays ?? DEFAULT_LINK_EXPIRY_DAYS;
      const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

      const linkId = randomUUID();
      await db.insert(agentShareLinks).values({
        id: linkId,
        tokenHash: hashSecret(token),
        datasetId: input.datasetId,
        agentName: input.agentName,
        expiresAt: toSqlTimestamp(expiresAt),
        isRevoked: 0,
        recipientEmail: input.recipientEmail || null,
        reportingPeriodLabel: input.reportingPeriodLabel || null,
      });
      await db.insert(agentShareAccessLogs).values({
        linkId,
        action: 'created',
        recipientEmail: input.recipientEmail || null,
        reportingPeriodLabel: input.reportingPeriodLabel || null,
        metadata: JSON.stringify({ expiresAt: expiresAt.toISOString() }),
      });

      return {
        linkId,
        token,
        agentName: input.agentName,
        expiresAt: expiresAt.toISOString(),
        recipientEmail: input.recipientEmail || null,
        reportingPeriodLabel: input.reportingPeriodLabel || null,
      };
    }),

  recordLinkCopied: publicProcedure
    .input(z.object({ datasetId: z.string().uuid(), ownerSecret: z.string().min(32), linkId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const { db } = await requireOwnerDataset(input.datasetId, input.ownerSecret);
      const [link] = await db.select().from(agentShareLinks).where(and(eq(agentShareLinks.id, input.linkId), eq(agentShareLinks.datasetId, input.datasetId))).limit(1);
      if (!link) throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent link not found.' });
      await db.insert(agentShareAccessLogs).values({ linkId: link.id, action: 'copied', recipientEmail: link.recipientEmail, reportingPeriodLabel: link.reportingPeriodLabel });
      return { success: true };
    }),

  listLinkAccessLogs: publicProcedure
    .input(z.object({ datasetId: z.string().uuid(), ownerSecret: z.string().min(32), linkId: z.string().uuid() }))
    .query(async ({ input }) => {
      const { db } = await requireOwnerDataset(input.datasetId, input.ownerSecret);
      const [link] = await db.select().from(agentShareLinks).where(and(eq(agentShareLinks.id, input.linkId), eq(agentShareLinks.datasetId, input.datasetId))).limit(1);
      if (!link) throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent link not found.' });
      const logs = await db.select().from(agentShareAccessLogs).where(eq(agentShareAccessLogs.linkId, input.linkId)).orderBy(agentShareAccessLogs.createdAt);
      return logs.reverse();
    }),

  /** Immediately revokes one agent's shared link without affecting other agents. */
  revokeAgentLink: publicProcedure
    .input(z.object({
      datasetId: z.string().uuid(),
      ownerSecret: z.string().min(32),
      linkId: z.string().uuid(),
    }))
    .mutation(async ({ input }) => {
      const { db } = await requireOwnerDataset(input.datasetId, input.ownerSecret);
      await db
        .update(agentShareLinks)
        .set({ isRevoked: 1 })
        .where(and(
          eq(agentShareLinks.id, input.linkId),
          eq(agentShareLinks.datasetId, input.datasetId),
        ));
      await db.insert(agentShareAccessLogs).values({ linkId: input.linkId, action: 'revoked' });
      return { success: true };
    }),

  /** Emergency kill switch: disables every agent link for this broker dataset. */
  revokeDataset: publicProcedure
    .input(z.object({ datasetId: z.string().uuid(), ownerSecret: z.string().min(32) }))
    .mutation(async ({ input }) => {
      const { db } = await requireOwnerDataset(input.datasetId, input.ownerSecret);
      const links = await db.select({ id: agentShareLinks.id }).from(agentShareLinks).where(eq(agentShareLinks.datasetId, input.datasetId));
      await db
        .update(agentShareDatasets)
        .set({ isActive: 0 })
        .where(eq(agentShareDatasets.id, input.datasetId));
      if (links.length) await db.insert(agentShareAccessLogs).values(links.map((link) => ({ linkId: link.id, action: 'dataset_revoked' as const })));
      return { success: true };
    }),

  /**
   * Public agent portal data endpoint. The only accepted credential is a high-
   * entropy link token. It returns records only for the agent encoded in that link.
   */
  getSharedAgentData: publicProcedure
    .input(z.object({ token: z.string().min(32).max(128) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Data storage is temporarily unavailable.' });
      }

      const [link] = await db
        .select()
        .from(agentShareLinks)
        .where(eq(agentShareLinks.tokenHash, hashSecret(input.token)))
        .limit(1);

      const isExpired = link?.expiresAt && new Date(link.expiresAt).getTime() < Date.now();
      if (!link || link.isRevoked === 1 || isExpired) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'This agent analytics link is invalid, expired, or has been revoked.' });
      }

      const [dataset] = await db
        .select()
        .from(agentShareDatasets)
        .where(and(eq(agentShareDatasets.id, link.datasetId), eq(agentShareDatasets.isActive, 1)))
        .limit(1);
      if (!dataset) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'This shared dataset is no longer available.' });
      }

      const storedRecords = await db
        .select({ recordJson: agentShareRecords.recordJson })
        .from(agentShareRecords)
        .where(eq(agentShareRecords.datasetId, dataset.id));

      const records = storedRecords
        .map((row) => {
          try {
            return JSON.parse(row.recordJson) as Record<string, unknown>;
          } catch {
            return null;
          }
        })
        .filter((record): record is Record<string, unknown> => Boolean(record))
        .filter((record) => isRecordForAgent(record, link.agentName));

      const [assignment] = await db
        .select({ planId: agentAssignments.planId })
        .from(agentAssignments)
        .where(and(
          eq(agentAssignments.tenantId, PUBLIC_TENANT_ID),
          eq(agentAssignments.agentName, link.agentName),
        ))
        .limit(1);

      let commissionSummary: {
        planName: string;
        planId: string;
        netCommission: number;
        companyDollar: number;
        grossCommission: number;
      } | null = null;
      let commissionPlanStatus = 'No active broker-approved commission plan is assigned.';

      if (assignment) {
        const [dbPlan] = await db
          .select()
          .from(commissionPlans)
          .where(and(
            eq(commissionPlans.id, assignment.planId),
            eq(commissionPlans.tenantId, PUBLIC_TENANT_ID),
          ))
          .limit(1);

        if (dbPlan) {
          const versionRows = await db
            .select()
            .from(commissionPlanVersions)
            .where(and(
              eq(commissionPlanVersions.tenantId, PUBLIC_TENANT_ID),
              eq(commissionPlanVersions.planId, dbPlan.id),
            ));
          const latestVersion = latestPlanVersions(versionRows).get(dbPlan.id);
          if (!latestVersion || isPlanVersionEligible(latestVersion)) {
            const source = latestVersion ? { ...dbPlan, ...parsePlanSnapshot(latestVersion.planSnapshot) } : dbPlan;
          const plan: CommissionPlan = {
            id: String(source.id),
            name: String(source.name),
            splitPercentage: Number(source.splitPercentage),
            capAmount: Number(source.capAmount) || 0,
            postCapSplit: Number(source.postCapSplit) || 100,
            royaltyPercentage: Number(source.royaltyPercentage) || undefined,
            royaltyCap: Number(source.royaltyCap) || undefined,
            useSliding: Boolean(source.useSliding),
            tiers: typeof source.tiers === 'string' ? JSON.parse(source.tiers) : source.tiers as any,
            deductions: typeof source.deductions === 'string' ? JSON.parse(source.deductions) : source.deductions as any,
          };
          let ytdCompanyDollar = 0;
          let netCommission = 0;
          let companyDollar = 0;
          let grossCommission = 0;
          const sortedRecords = [...records].sort((left, right) => {
            const leftDate = String(left.closingDate || left.createdDate || '');
            const rightDate = String(right.closingDate || right.createdDate || '');
            return leftDate.localeCompare(rightDate);
          });
          sortedRecords.forEach((record, index) => {
            const input = getSharedTransactionCalculationInput(record, index, link.agentName);
            if (!input.salePrice || !input.commissionRate) return;
            const breakdown = calculateTransactionCommission(input, link.agentName, plan, undefined, ytdCompanyDollar);
            ytdCompanyDollar = breakdown.ytdAfterTransaction;
            netCommission += breakdown.agentNetCommission;
            companyDollar += breakdown.brokerageSplitAmount;
            grossCommission += breakdown.grossCommissionIncome;
          });
          commissionSummary = { planName: plan.name, planId: plan.id, netCommission, companyDollar, grossCommission };
          commissionPlanStatus = latestVersion ? `Calculated using broker-approved plan version ${latestVersion.versionNumber}.` : 'Calculated using the broker’s current legacy plan.';
          } else {
            commissionPlanStatus = 'The broker has not activated the assigned commission plan for this effective period. Commission values are intentionally withheld.';
          }
        }
      }

      await db
        .update(agentShareLinks)
        .set({ lastAccessedAt: toSqlTimestamp(new Date()) })
        .where(eq(agentShareLinks.id, link.id));
      await db.insert(agentShareAccessLogs).values({
        linkId: link.id,
        action: 'accessed',
        recipientEmail: link.recipientEmail,
        reportingPeriodLabel: link.reportingPeriodLabel,
      });

      return {
        agentName: link.agentName,
        datasetName: dataset.fileName,
        expiresAt: link.expiresAt,
        reportingPeriodLabel: link.reportingPeriodLabel,
        records,
        commissionSummary,
        commissionPlanStatus,
      };
    }),
});
