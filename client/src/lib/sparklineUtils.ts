/**
 * Sparkline utilities for generating trend data
 * Used to show metric trends over time with small inline charts
 */

export interface SparklineData {
  value: number;
  date: Date;
}

export interface SparklineTrend {
  data: number[];
  direction: 'up' | 'down' | 'flat';
  percentChange: number;
  minValue: number;
  maxValue: number;
}

/**
 * Calculate trend direction and percentage change
 */
export function calculateTrend(data: SparklineData[]): SparklineTrend {
  if (data.length < 2) {
    return {
      data: data.map(d => d.value),
      direction: 'flat',
      percentChange: 0,
      minValue: data[0]?.value || 0,
      maxValue: data[0]?.value || 0
    };
  }

  const values = data.map(d => d.value);
  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  const percentChange = firstValue !== 0 
    ? ((lastValue - firstValue) / firstValue) * 100 
    : 0;

  const direction = lastValue > firstValue ? 'up' : lastValue < firstValue ? 'down' : 'flat';

  return {
    data: values,
    direction,
    percentChange: Math.round(percentChange * 10) / 10,
    minValue,
    maxValue
  };
}

/**
 * Generate sparkline data from a list of values
 * Useful for creating trend data from historical metrics
 */
export function generateSparklineData(values: number[]): SparklineTrend {
  if (values.length === 0) {
    return {
      data: [],
      direction: 'flat',
      percentChange: 0,
      minValue: 0,
      maxValue: 0
    };
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const firstValue = values[0];
  const lastValue = values[values.length - 1];

  const percentChange = firstValue !== 0 
    ? ((lastValue - firstValue) / firstValue) * 100 
    : 0;

  const direction = lastValue > firstValue ? 'up' : lastValue < firstValue ? 'down' : 'flat';

  return {
    data: values,
    direction,
    percentChange: Math.round(percentChange * 10) / 10,
    minValue,
    maxValue
  };
}

/**
 * Normalize values for SVG sparkline rendering (0-100 scale)
 */
export function normalizeForSparkline(values: number[]): number[] {
  if (values.length === 0) return [];
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values.map(v => ((v - min) / range) * 100);
}

/**
 * Generate SVG path for sparkline
 */
export function generateSparklinePath(values: number[], width: number = 100, height: number = 24): string {
  if (values.length === 0) return '';
  if (values.length === 1) {
    const y = height / 2;
    return `M 0 ${y} L ${width} ${y}`;
  }

  const normalized = normalizeForSparkline(values);
  const xStep = width / (values.length - 1);
  const yScale = (height * 0.8) / 100;
  const yOffset = height * 0.1;

  let path = `M 0 ${height - (normalized[0] * yScale) - yOffset}`;

  for (let i = 1; i < normalized.length; i++) {
    const x = i * xStep;
    const y = height - (normalized[i] * yScale) - yOffset;
    path += ` L ${x} ${y}`;
  }

  return path;
}

/**
 * Get color for trend direction
 */
export function getTrendColor(direction: 'up' | 'down' | 'flat'): string {
  switch (direction) {
    case 'up':
      return '#10b981'; // emerald-500
    case 'down':
      return '#ef4444'; // red-500
    case 'flat':
      return '#6b7280'; // gray-500
  }
}

/**
 * Get arrow emoji for trend direction
 */
export function getTrendArrow(direction: 'up' | 'down' | 'flat'): string {
  switch (direction) {
    case 'up':
      return '↑';
    case 'down':
      return '↓';
    case 'flat':
      return '→';
  }
}
