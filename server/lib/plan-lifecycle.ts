export type PlanLifecycle = 'draft' | 'active' | 'archived';

export type PlanVersionEligibility = {
  planId: string;
  versionNumber: number;
  lifecycle: PlanLifecycle;
  effectiveStartDate?: string | null;
  effectiveEndDate?: string | null;
  planSnapshot: string | Record<string, unknown>;
};

function dateOnly(value: Date | string) {
  return typeof value === 'string' ? value.slice(0, 10) : value.toISOString().slice(0, 10);
}

export function latestPlanVersions(versions: PlanVersionEligibility[]) {
  return versions.reduce<Map<string, PlanVersionEligibility>>((latest, version) => {
    const prior = latest.get(version.planId);
    if (!prior || version.versionNumber > prior.versionNumber) latest.set(version.planId, version);
    return latest;
  }, new Map());
}

export function isPlanVersionEligible(version: PlanVersionEligibility | undefined, asOf: Date | string = new Date()) {
  if (!version || version.lifecycle !== 'active') return false;
  const date = dateOnly(asOf);
  return (!version.effectiveStartDate || version.effectiveStartDate <= date)
    && (!version.effectiveEndDate || version.effectiveEndDate >= date);
}

export function parsePlanSnapshot(snapshot: PlanVersionEligibility['planSnapshot']) {
  if (typeof snapshot !== 'string') return snapshot;
  try {
    return JSON.parse(snapshot) as Record<string, unknown>;
  } catch {
    return {};
  }
}
