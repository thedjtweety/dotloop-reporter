export const BROKER_QUICK_START_STORAGE_KEY = 'dotloop_broker_quick_start_v1';

export type BrokerWorkflowId = 'share-metrics' | 'brokerage-health' | 'create-cda';

export type BrokerWorkflowProgress = {
  completed: boolean;
  skipped: boolean;
  lastStep: number;
};

export type BrokerQuickStartState = Record<BrokerWorkflowId, BrokerWorkflowProgress>;

export const DEFAULT_BROKER_QUICK_START_STATE: BrokerQuickStartState = {
  'share-metrics': { completed: false, skipped: false, lastStep: 0 },
  'brokerage-health': { completed: false, skipped: false, lastStep: 0 },
  'create-cda': { completed: false, skipped: false, lastStep: 0 },
};

function isProgress(value: unknown): value is Partial<BrokerWorkflowProgress> {
  return Boolean(value) && typeof value === 'object';
}

export function normalizeBrokerQuickStartState(value: unknown): BrokerQuickStartState {
  const candidate = value && typeof value === 'object' ? value as Partial<Record<BrokerWorkflowId, unknown>> : {};

  return (Object.keys(DEFAULT_BROKER_QUICK_START_STATE) as BrokerWorkflowId[]).reduce((state, workflowId) => {
    const saved = candidate[workflowId];
    const fallback = DEFAULT_BROKER_QUICK_START_STATE[workflowId];
    state[workflowId] = isProgress(saved)
      ? {
        completed: saved.completed === true,
        skipped: saved.skipped === true,
        lastStep: typeof saved.lastStep === 'number' && saved.lastStep >= 0 ? Math.floor(saved.lastStep) : 0,
      }
      : { ...fallback };
    return state;
  }, {} as BrokerQuickStartState);
}

export function hasQuickAccess(progress: BrokerWorkflowProgress) {
  return progress.completed || progress.skipped;
}

export function readBrokerQuickStartState(storage: Pick<Storage, 'getItem'> | null | undefined): BrokerQuickStartState {
  if (!storage) return normalizeBrokerQuickStartState(null);
  try {
    const saved = storage.getItem(BROKER_QUICK_START_STORAGE_KEY);
    return normalizeBrokerQuickStartState(saved ? JSON.parse(saved) : null);
  } catch {
    return normalizeBrokerQuickStartState(null);
  }
}

export function writeBrokerQuickStartState(storage: Pick<Storage, 'setItem'> | null | undefined, state: BrokerQuickStartState) {
  storage?.setItem(BROKER_QUICK_START_STORAGE_KEY, JSON.stringify(state));
}
