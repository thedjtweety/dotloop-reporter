# Global Data Flow Audit Findings

## What Works Correctly
1. **TransactionDataContext** — wraps the entire app in App.tsx. All pages share the same context.
2. **CSV upload / Demo mode** — correctly calls `setTransactionData()` in context, populating `allRecords`, `filteredRecords`, `metrics`, `agentMetrics`.
3. **NetCommissionReportPage** — reads `allRecords`, `commissionPlans`, `agentAssignments` directly from context. ✅ Will work once context is populated.
4. **CommissionManagement KPI strip** — reads `filteredRecords` from context. ✅ Already works.
5. **CommissionAuditReport** — receives `filteredRecords` as a prop from CommissionManagement. ✅ Already works.
6. **AgentLeaderboard** — listens to `commission-assignment-updated` browser event and refetches from DB. ✅ Partially works.

## Gaps / Bugs Found

### Gap 1: AgentAssignment calls deprecated no-op `saveAgentAssignments()`
- **File**: `client/src/components/AgentAssignment.tsx` lines 130, 201
- **Problem**: `saveAgentAssignments()` in `lib/commission.ts` is a stub that does nothing (just logs a warning). Assignments are NEVER saved to the DB when using the single-agent dropdown.
- **Fix**: Replace with `trpc.commission.saveAssignment.useMutation()` (single agent upsert) or `trpc.commission.saveAssignments.useMutation()` (bulk).

### Gap 2: AgentAssignment never updates global context
- **File**: `client/src/components/AgentAssignment.tsx`
- **Problem**: After assigning a plan, the context's `agentAssignments` array is never updated. So `NetCommissionReportPage` (which reads `agentAssignments` from context) won't see the new assignment.
- **Fix**: After saving, call `setCommissionData({ plans: currentPlans, assignments: newAssignments })` on context.

### Gap 3: CommissionCalculator reads from localStorage instead of context
- **File**: `client/src/components/CommissionCalculator.tsx` lines 66-111
- **Problem**: Loads transactions from `localStorage.getItem('dotloop_demo_data')` and `getRecentFiles()` instead of `useTransactionData()`. If user uploads a CSV and goes to Calculate tab, it may not see the current data.
- **Fix**: Import `useTransactionData()` and use `allRecords` directly.

### Gap 4: CommissionPlansManager calls deprecated `saveCommissionPlans()`
- **File**: `client/src/components/CommissionPlansManager.tsx` line 85
- **Problem**: `saveCommissionPlans()` is a no-op stub. The actual save to DB happens via `deletePlanMutation.mutateAsync(id)` which is correct, but the deprecated call is still there.
- **Fix**: Remove the deprecated call (already uses tRPC correctly, just has stale no-op call).

### Gap 5: CommissionPlansManager never updates global context
- **File**: `client/src/components/CommissionPlansManager.tsx`
- **Problem**: After saving/deleting a plan, context's `commissionPlans` array is never updated.
- **Fix**: After save/delete, call `setCommissionData({ plans: updatedPlans, assignments: currentAssignments })` on context.

### Gap 6: AgentAssignment initial load doesn't populate context
- **File**: `client/src/components/AgentAssignment.tsx`
- **Problem**: When the component mounts and fetches DB assignments, it stores them in local state but never calls `setCommissionData()` to populate the context.
- **Fix**: When `dbPlans` and `dbAssignments` are loaded, call `setCommissionData()` once.

## Fix Plan
1. Fix AgentAssignment to use `trpc.commission.saveAssignment.useMutation()` for single-agent saves
2. Fix AgentAssignment to call `setCommissionData()` after every assignment change
3. Fix AgentAssignment to call `setCommissionData()` on initial load (when DB data arrives)
4. Fix CommissionPlansManager to call `setCommissionData()` after plan save/delete
5. Fix CommissionCalculator to use `allRecords` from context instead of localStorage
6. Remove deprecated `saveCommissionPlans()` call from CommissionPlansManager
