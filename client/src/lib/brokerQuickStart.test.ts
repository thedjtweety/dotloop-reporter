import { describe, expect, it } from 'vitest';
import {
  BROKER_QUICK_START_STORAGE_KEY,
  DEFAULT_BROKER_QUICK_START_STATE,
  hasQuickAccess,
  normalizeBrokerQuickStartState,
  readBrokerQuickStartState,
  writeBrokerQuickStartState,
} from './brokerQuickStart';

describe('broker quick-start state', () => {
  it('fills in safe defaults when stored progress is incomplete or invalid', () => {
    const state = normalizeBrokerQuickStartState({
      'share-metrics': { completed: true, lastStep: 2 },
      'create-cda': 'invalid',
    });

    expect(state['share-metrics']).toEqual({ completed: true, skipped: false, lastStep: 2 });
    expect(state['brokerage-health']).toEqual(DEFAULT_BROKER_QUICK_START_STATE['brokerage-health']);
    expect(state['create-cda']).toEqual(DEFAULT_BROKER_QUICK_START_STATE['create-cda']);
  });

  it('switches workflows to quick access after completion or an intentional tutorial skip', () => {
    expect(hasQuickAccess({ completed: true, skipped: false, lastStep: 2 })).toBe(true);
    expect(hasQuickAccess({ completed: false, skipped: true, lastStep: 0 })).toBe(true);
    expect(hasQuickAccess({ completed: false, skipped: false, lastStep: 1 })).toBe(false);
  });

  it('persists and reloads first-use progress safely', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    const state = normalizeBrokerQuickStartState({
      'brokerage-health': { completed: false, skipped: false, lastStep: 1 },
    });

    writeBrokerQuickStartState(storage, state);

    expect(values.has(BROKER_QUICK_START_STORAGE_KEY)).toBe(true);
    expect(readBrokerQuickStartState(storage)['brokerage-health'].lastStep).toBe(1);
  });
});
