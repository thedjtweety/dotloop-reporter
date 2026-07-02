/**
 * Tests for global data flow: CSV upload → commission plan assignment → global state propagation
 *
 * These tests verify that:
 * 1. AgentAssignment uses tRPC saveAssignment (not deprecated no-op)
 * 2. CommissionPlansManager does NOT call deprecated saveCommissionPlans
 * 3. CommissionCalculator does NOT import getRecentFiles (uses context instead)
 * 4. BulkPlanAssignment dispatches commission-assignment-updated event
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..');

function readClient(relPath: string) {
  return readFileSync(join(ROOT, 'client/src', relPath), 'utf-8');
}

describe('Global Data Flow - AgentAssignment', () => {
  const source = readClient('components/AgentAssignment.tsx');

  it('imports useTransactionData context', () => {
    expect(source).toContain("import { useTransactionData }");
  });

  it('uses tRPC saveAssignment mutation (not deprecated saveAgentAssignments)', () => {
    expect(source).toContain("trpc.commission.saveAssignment.useMutation");
    // Deprecated no-op must NOT be called
    expect(source).not.toContain("saveAgentAssignments(");
  });

  it('fetches DB assignments via tRPC getAssignments', () => {
    expect(source).toContain("trpc.commission.getAssignments.useQuery");
  });

  it('calls setCommissionData to sync global context after assignment change', () => {
    expect(source).toContain("setCommissionData(");
  });

  it('dispatches commission-assignment-updated event', () => {
    expect(source).toContain("commission-assignment-updated");
  });
});

describe('Global Data Flow - CommissionPlansManager', () => {
  const source = readClient('components/CommissionPlansManager.tsx');

  it('imports useTransactionData context', () => {
    expect(source).toContain("import { useTransactionData }");
  });

  it('calls setCommissionData after saving a plan', () => {
    expect(source).toContain("setCommissionData(");
  });

  it('does NOT call deprecated saveCommissionPlans', () => {
    expect(source).not.toContain("saveCommissionPlans(");
  });
});

describe('Global Data Flow - CommissionCalculator', () => {
  const source = readClient('components/CommissionCalculator.tsx');

  it('imports useTransactionData context', () => {
    expect(source).toContain("import { useTransactionData }");
  });

  it('does NOT import getRecentFiles (uses context instead)', () => {
    expect(source).not.toContain("getRecentFiles");
  });

  it('does NOT read from localStorage for transaction data', () => {
    // The old localStorage-based loading block must be removed
    expect(source).not.toContain("dotloop_demo_data");
  });

  it('uses allRecords from context as transaction source', () => {
    expect(source).toContain("allRecords");
  });
});

describe('Global Data Flow - BulkPlanAssignment', () => {
  const source = readClient('components/BulkPlanAssignment.tsx');

  it('dispatches commission-assignment-updated event after bulk save', () => {
    expect(source).toContain("commission-assignment-updated");
  });

  it('uses tRPC saveAssignments mutation for persistence', () => {
    expect(source).toContain("saveAssignmentsMutation");
  });
});

describe('Global Data Flow - TransactionDataContext', () => {
  const source = readClient('contexts/TransactionDataContext.tsx');

  it('exposes setCommissionData function', () => {
    expect(source).toContain("setCommissionData");
  });

  it('exposes commissionPlans in context value', () => {
    expect(source).toContain("commissionPlans");
  });

  it('exposes agentAssignments in context value', () => {
    expect(source).toContain("agentAssignments");
  });
});
