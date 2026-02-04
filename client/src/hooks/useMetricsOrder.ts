import { useState, useEffect } from 'react';

export type MetricId = 'transactions' | 'volume' | 'closingRate' | 'daysToClose';

export interface Metric {
  id: MetricId;
  title: string;
  order: number;
}

const DEFAULT_METRICS_ORDER: MetricId[] = [
  'transactions',
  'volume',
  'closingRate',
  'daysToClose',
];

const STORAGE_KEY = 'dotloop_metrics_order';
const EDIT_MODE_KEY = 'dotloop_metrics_edit_mode';

/**
 * Hook for managing metrics card order with localStorage persistence
 * Allows users to rearrange metrics and saves their preference
 */
export function useMetricsOrder() {
  const [metricsOrder, setMetricsOrder] = useState<MetricId[]>(DEFAULT_METRICS_ORDER);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved order from localStorage on mount
  useEffect(() => {
    const savedOrder = localStorage.getItem(STORAGE_KEY);
    const savedEditMode = localStorage.getItem(EDIT_MODE_KEY);

    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder) as MetricId[];
        // Validate that all metrics are present
        if (parsed.length === DEFAULT_METRICS_ORDER.length) {
          setMetricsOrder(parsed);
        }
      } catch (error) {
        console.error('Failed to parse saved metrics order:', error);
      }
    }

    if (savedEditMode === 'true') {
      setIsEditMode(true);
    }

    setIsLoaded(true);
  }, []);

  // Save order to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(metricsOrder));
    }
  }, [metricsOrder, isLoaded]);

  // Save edit mode to localStorage
  useEffect(() => {
    localStorage.setItem(EDIT_MODE_KEY, isEditMode.toString());
  }, [isEditMode]);

  const reorderMetrics = (newOrder: MetricId[]) => {
    setMetricsOrder(newOrder);
  };

  const resetToDefault = () => {
    setMetricsOrder(DEFAULT_METRICS_ORDER);
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  return {
    metricsOrder,
    isEditMode,
    isLoaded,
    reorderMetrics,
    resetToDefault,
    toggleEditMode,
  };
}
