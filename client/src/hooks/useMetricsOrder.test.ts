import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMetricsOrder, MetricId } from './useMetricsOrder';

describe('useMetricsOrder Hook', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with default metrics order', () => {
    const { result } = renderHook(() => useMetricsOrder());

    expect(result.current.metricsOrder).toEqual([
      'transactions',
      'volume',
      'closingRate',
      'daysToClose',
    ]);
  });

  it('should initialize with edit mode disabled', () => {
    const { result } = renderHook(() => useMetricsOrder());

    expect(result.current.isEditMode).toBe(false);
  });

  it('should toggle edit mode', () => {
    const { result } = renderHook(() => useMetricsOrder());

    expect(result.current.isEditMode).toBe(false);

    act(() => {
      result.current.toggleEditMode();
    });

    expect(result.current.isEditMode).toBe(true);

    act(() => {
      result.current.toggleEditMode();
    });

    expect(result.current.isEditMode).toBe(false);
  });

  it('should reorder metrics', () => {
    const { result } = renderHook(() => useMetricsOrder());

    const newOrder: MetricId[] = ['volume', 'transactions', 'daysToClose', 'closingRate'];

    act(() => {
      result.current.reorderMetrics(newOrder);
    });

    expect(result.current.metricsOrder).toEqual(newOrder);
  });

  it('should reset to default order', () => {
    const { result } = renderHook(() => useMetricsOrder());

    const newOrder: MetricId[] = ['volume', 'transactions', 'daysToClose', 'closingRate'];

    act(() => {
      result.current.reorderMetrics(newOrder);
    });

    expect(result.current.metricsOrder).toEqual(newOrder);

    act(() => {
      result.current.resetToDefault();
    });

    expect(result.current.metricsOrder).toEqual([
      'transactions',
      'volume',
      'closingRate',
      'daysToClose',
    ]);
  });

  it('should persist metrics order to localStorage', () => {
    const { result } = renderHook(() => useMetricsOrder());

    const newOrder: MetricId[] = ['closingRate', 'daysToClose', 'volume', 'transactions'];

    act(() => {
      result.current.reorderMetrics(newOrder);
    });

    const saved = localStorage.getItem('dotloop_metrics_order');
    expect(saved).toBe(JSON.stringify(newOrder));
  });

  it('should persist edit mode to localStorage', () => {
    const { result } = renderHook(() => useMetricsOrder());

    act(() => {
      result.current.toggleEditMode();
    });

    const saved = localStorage.getItem('dotloop_metrics_edit_mode');
    expect(saved).toBe('true');
  });

  it('should load metrics order from localStorage on mount', () => {
    const customOrder: MetricId[] = ['volume', 'transactions', 'closingRate', 'daysToClose'];
    localStorage.setItem('dotloop_metrics_order', JSON.stringify(customOrder));

    const { result } = renderHook(() => useMetricsOrder());

    expect(result.current.metricsOrder).toEqual(customOrder);
  });

  it('should load edit mode from localStorage on mount', () => {
    localStorage.setItem('dotloop_metrics_edit_mode', 'true');

    const { result } = renderHook(() => useMetricsOrder());

    expect(result.current.isEditMode).toBe(true);
  });

  it('should handle invalid localStorage data gracefully', () => {
    localStorage.setItem('dotloop_metrics_order', 'invalid json');

    const { result } = renderHook(() => useMetricsOrder());

    // Should fall back to default
    expect(result.current.metricsOrder).toEqual([
      'transactions',
      'volume',
      'closingRate',
      'daysToClose',
    ]);
  });

  it('should handle incomplete metrics order in localStorage', () => {
    const incompleteOrder: MetricId[] = ['transactions', 'volume'];
    localStorage.setItem('dotloop_metrics_order', JSON.stringify(incompleteOrder));

    const { result } = renderHook(() => useMetricsOrder());

    // Should fall back to default if order is incomplete
    expect(result.current.metricsOrder).toEqual([
      'transactions',
      'volume',
      'closingRate',
      'daysToClose',
    ]);
  });

  it('should maintain all four metrics in order', () => {
    const { result } = renderHook(() => useMetricsOrder());

    const newOrder: MetricId[] = ['daysToClose', 'closingRate', 'volume', 'transactions'];

    act(() => {
      result.current.reorderMetrics(newOrder);
    });

    expect(result.current.metricsOrder).toHaveLength(4);
    expect(result.current.metricsOrder).toContain('transactions');
    expect(result.current.metricsOrder).toContain('volume');
    expect(result.current.metricsOrder).toContain('closingRate');
    expect(result.current.metricsOrder).toContain('daysToClose');
  });

  it('should support multiple reorder operations', () => {
    const { result } = renderHook(() => useMetricsOrder());

    const order1: MetricId[] = ['volume', 'transactions', 'closingRate', 'daysToClose'];
    const order2: MetricId[] = ['closingRate', 'volume', 'daysToClose', 'transactions'];

    act(() => {
      result.current.reorderMetrics(order1);
    });

    expect(result.current.metricsOrder).toEqual(order1);

    act(() => {
      result.current.reorderMetrics(order2);
    });

    expect(result.current.metricsOrder).toEqual(order2);
  });

  it('should set isLoaded to true after mount', () => {
    const { result } = renderHook(() => useMetricsOrder());

    expect(result.current.isLoaded).toBe(true);
  });
});
