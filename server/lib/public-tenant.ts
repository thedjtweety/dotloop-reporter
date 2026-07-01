/**
 * Public tenant helper - this app is fully public (no auth required).
 * All data is stored under a single shared tenant ID of 1.
 */
export const PUBLIC_TENANT_ID = 1;

export async function getTenantIdFromUser(_userId?: number | null): Promise<number> {
  return PUBLIC_TENANT_ID;
}

export async function getAllTenantIdsForUser(_userId?: number | null): Promise<number[]> {
  return [PUBLIC_TENANT_ID];
}
