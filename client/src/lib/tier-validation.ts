/**
 * Client-side Tier Validation Utilities
 * 
 * Mirrors server-side validation for real-time feedback
 */

import type { CommissionTier } from './commission';

export interface ValidationError {
  field: string;
  message: string;
  tierIndex?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate that tier thresholds are in ascending order
 */
export function validateThresholdOrder(tiers: CommissionTier[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (tiers.length < 2) {
    return errors;
  }

  const sortedTiers = [...tiers].sort((a, b) => a.threshold - b.threshold);

  for (let i = 1; i < sortedTiers.length; i++) {
    if (sortedTiers[i].threshold <= sortedTiers[i - 1].threshold) {
      errors.push({
        field: 'thresholds',
        message: `Tier ${i} threshold ($${sortedTiers[i].threshold}) must be greater than Tier ${i - 1} threshold ($${sortedTiers[i - 1].threshold})`,
        tierIndex: i,
      });
    }
  }

  return errors;
}

/**
 * Validate that tier thresholds don't have gaps or overlaps
 */
export function validateThresholdContinuity(tiers: CommissionTier[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (tiers.length < 2) {
    return errors;
  }

  const sortedTiers = [...tiers].sort((a, b) => a.threshold - b.threshold);

  // First tier must start at 0
  if (sortedTiers[0].threshold !== 0) {
    errors.push({
      field: 'thresholds',
      message: `First tier must start at $0, not $${sortedTiers[0].threshold}`,
      tierIndex: 0,
    });
  }

  return errors;
}

/**
 * Validate split percentages are within valid range (0-100)
 */
export function validateSplitPercentages(tiers: CommissionTier[]): ValidationError[] {
  const errors: ValidationError[] = [];

  tiers.forEach((tier, index) => {
    if (tier.splitPercentage < 0 || tier.splitPercentage > 100) {
      errors.push({
        field: 'splitPercentage',
        message: `Tier ${index} split percentage must be between 0 and 100, got ${tier.splitPercentage}`,
        tierIndex: index,
      });
    }
  });

  return errors;
}

/**
 * Validate that tier descriptions are unique and descriptive
 */
export function validateDescriptions(tiers: CommissionTier[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const descriptions = new Set<string>();

  tiers.forEach((tier, index) => {
    if (!tier.description || tier.description.trim().length === 0) {
      errors.push({
        field: 'description',
        message: `Tier ${index} must have a description`,
        tierIndex: index,
      });
    }

    if (tier.description && descriptions.has(tier.description)) {
      errors.push({
        field: 'description',
        message: `Tier ${index} has duplicate description: "${tier.description}"`,
        tierIndex: index,
      });
    }

    if (tier.description) {
      descriptions.add(tier.description);
    }
  });

  return errors;
}

/**
 * Validate minimum number of tiers
 */
export function validateMinimumTiers(tiers: CommissionTier[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (tiers.length < 1) {
    errors.push({
      field: 'tiers',
      message: 'At least one tier must be defined',
    });
  }

  return errors;
}

/**
 * Comprehensive tier validation
 */
export function validateTiers(tiers: CommissionTier[]): ValidationResult {
  const errors: ValidationError[] = [];

  errors.push(...validateMinimumTiers(tiers));
  errors.push(...validateThresholdOrder(tiers));
  errors.push(...validateThresholdContinuity(tiers));
  errors.push(...validateSplitPercentages(tiers));
  errors.push(...validateDescriptions(tiers));

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Detect overlapping tier ranges
 */
export function detectOverlappingRanges(tiers: CommissionTier[]): boolean {
  if (tiers.length < 2) {
    return false;
  }

  const sortedTiers = [...tiers].sort((a, b) => a.threshold - b.threshold);

  for (let i = 0; i < sortedTiers.length - 1; i++) {
    if (sortedTiers[i + 1].threshold <= sortedTiers[i].threshold) {
      return true;
    }
  }

  return false;
}

/**
 * Get tier range as a human-readable string
 */
export function getTierRangeString(
  tier: CommissionTier,
  nextTierThreshold?: number
): string {
  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;

  if (nextTierThreshold !== undefined) {
    return `${formatCurrency(tier.threshold)} - ${formatCurrency(nextTierThreshold - 1)}`;
  }

  return `${formatCurrency(tier.threshold)}+`;
}

/**
 * Suggest default tier configuration based on count
 */
export function suggestDefaultTiers(count: number): CommissionTier[] {
  const baseThresholds = [
    { threshold: 0, split: 60, desc: '$0 - $50K: 60/40' },
    { threshold: 50000, split: 65, desc: '$50K - $100K: 65/35' },
    { threshold: 100000, split: 70, desc: '$100K - $200K: 70/30' },
    { threshold: 200000, split: 75, desc: '$200K+: 75/25' },
  ];

  return baseThresholds.slice(0, Math.min(count, baseThresholds.length)).map((t, idx) => ({
    id: `tier-${idx}`,
    threshold: t.threshold,
    splitPercentage: t.split,
    description: t.desc,
  }));
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) {
    return '';
  }

  return errors.map((error) => {
    if (error.tierIndex !== undefined) {
      return `Tier ${error.tierIndex}: ${error.message}`;
    }
    return error.message;
  }).join('\n');
}
