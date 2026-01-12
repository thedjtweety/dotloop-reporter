/**
 * Tier Validation Tests
 * 
 * Tests for tier threshold validation and configuration
 */

import { describe, it, expect } from 'vitest';
import {
  validateThresholdOrder,
  validateThresholdContinuity,
  validateSplitPercentages,
  validateDescriptions,
  validateMinimumTiers,
  validateTiers,
  detectOverlappingRanges,
  getTierRangeString,
  suggestDefaultTiers,
  getEffectiveTier,
  getApplicableTiers,
} from './tier-validation';
import type { CommissionTier } from './commission-calculator';

describe('Tier Validation', () => {
  describe('validateThresholdOrder', () => {
    it('should pass with ascending thresholds', () => {
      const tiers: CommissionTier[] = [
        { id: '1', threshold: 0, splitPercentage: 60, description: 'Tier 0' },
        { id: '2', threshold: 50000, splitPercentage: 65, description: 'Tier 1' },
        { id: '3', threshold: 100000, splitPercentage: 70, description: 'Tier 2' },
      ];

      const errors = validateThresholdOrder(tiers);
      expect(errors).toHaveLength(0);
    });

    it('should fail with duplicate thresholds', () => {
      const tiers: CommissionTier[] = [
        { id: '1', threshold: 0, splitPercentage: 60, description: 'Tier 0' },
        { id: '2', threshold: 50000, splitPercentage: 65, description: 'Tier 1' },
        { id: '3', threshold: 50000, splitPercentage: 70, description: 'Tier 2' },
      ];

      const errors = validateThresholdOrder(tiers);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('must be greater than');
    });

    it('should fail with descending thresholds', () => {
      const tiers: CommissionTier[] = [
        { id: '1', threshold: 100000, splitPercentage: 60, description: 'Tier 0' },
        { id: '2', threshold: 50000, splitPercentage: 65, description: 'Tier 1' },
      ];

      const errors = validateThresholdOrder(tiers);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should pass with single tier', () => {
      const tiers: CommissionTier[] = [
        { id: '1', threshold: 0, splitPercentage: 60, description: 'Tier 0' },
      ];

      const errors = validateThresholdOrder(tiers);
      expect(errors).toHaveLength(0);
    });
  });

  describe('validateThresholdContinuity', () => {
    it('should pass when first tier starts at 0', () => {
      const tiers: CommissionTier[] = [
        { id: '1', threshold: 0, splitPercentage: 60, description: 'Tier 0' },
        { id: '2', threshold: 50000, splitPercentage: 65, description: 'Tier 1' },
      ];

      const errors = validateThresholdContinuity(tiers);
      expect(errors).toHaveLength(0);
    });

    it('should fail when first tier does not start at 0', () => {
      const tiers: CommissionTier[] = [
        { id: '1', threshold: 10000, splitPercentage: 60, description: 'Tier 0' },
        { id: '2', threshold: 50000, splitPercentage: 65, description: 'Tier 1' },
      ];

      const errors = validateThresholdContinuity(tiers);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('First tier must start at $0');
    });
  });

  describe('validateSplitPercentages', () => {
    it('should pass with valid percentages', () => {
      const tiers: CommissionTier[] = [
        { id: '1', threshold: 0, splitPercentage: 60, description: 'Tier 0' },
        { id: '2', threshold: 50000, splitPercentage: 75, description: 'Tier 1' },
      ];

      const errors = validateSplitPercentages(tiers);
      expect(errors).toHaveLength(0);
    });

    it('should fail with percentage > 100', () => {
      const tiers: CommissionTier[] = [
        { id: '1', threshold: 0, splitPercentage: 150, description: 'Tier 0' },
      ];

      const errors = validateSplitPercentages(tiers);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('between 0 and 100');
    });

    it('should fail with negative percentage', () => {
      const tiers: CommissionTier[] = [
        { id: '1', threshold: 0, splitPercentage: -10, description: 'Tier 0' },
      ];

      const errors = validateSplitPercentages(tiers);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should pass with 0 and 100 percentages', () => {
      const tiers: CommissionTier[] = [
        { id: '1', threshold: 0, splitPercentage: 0, description: 'Tier 0' },
        { id: '2', threshold: 50000, splitPercentage: 100, description: 'Tier 1' },
      ];

      const errors = validateSplitPercentages(tiers);
      expect(errors).toHaveLength(0);
    });
  });

  describe('validateDescriptions', () => {
    it('should pass with unique descriptions', () => {
      const tiers: CommissionTier[] = [
        { id: '1', threshold: 0, splitPercentage: 60, description: 'Entry Level' },
        { id: '2', threshold: 50000, splitPercentage: 65, description: 'Intermediate' },
      ];

      const errors = validateDescriptions(tiers);
      expect(errors).toHaveLength(0);
    });

    it('should fail with empty description', () => {
      const tiers: CommissionTier[] = [
        { id: '1', threshold: 0, splitPercentage: 60, description: '' },
      ];

      const errors = validateDescriptions(tiers);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('must have a description');
    });

    it('should fail with duplicate descriptions', () => {
      const tiers: CommissionTier[] = [
        { id: '1', threshold: 0, splitPercentage: 60, description: 'Standard' },
        { id: '2', threshold: 50000, splitPercentage: 65, description: 'Standard' },
      ];

      const errors = validateDescriptions(tiers);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('duplicate description');
    });
  });

  describe('validateMinimumTiers', () => {
    it('should pass with at least one tier', () => {
      const tiers: CommissionTier[] = [
        { id: '1', threshold: 0, splitPercentage: 60, description: 'Tier 0' },
      ];

      const errors = validateMinimumTiers(tiers);
      expect(errors).toHaveLength(0);
    });

    it('should fail with no tiers', () => {
      const tiers: CommissionTier[] = [];

      const errors = validateMinimumTiers(tiers);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('At least one tier');
    });
  });

  describe('validateTiers (comprehensive)', () => {
    it('should validate a valid tier configuration', () => {
      const tiers: CommissionTier[] = [
        { id: '1', threshold: 0, splitPercentage: 60, description: '$0-$50K: 60/40' },
        { id: '2', threshold: 50000, splitPercentage: 65, description: '$50K-$100K: 65/35' },
        { id: '3', threshold: 100000, splitPercentage: 70, description: '$100K+: 70/30' },
      ];

      const result = validateTiers(tiers);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should catch multiple validation errors', () => {
      const tiers: CommissionTier[] = [
        { id: '1', threshold: 10000, splitPercentage: 150, description: '' },
        { id: '2', threshold: 5000, splitPercentage: 65, description: 'Tier 1' },
      ];

      const result = validateTiers(tiers);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('detectOverlappingRanges', () => {
    it('should detect no overlaps with valid ranges', () => {
      const tiers: CommissionTier[] = [
        { id: '1', threshold: 0, splitPercentage: 60, description: 'Tier 0' },
        { id: '2', threshold: 50000, splitPercentage: 65, description: 'Tier 1' },
        { id: '3', threshold: 100000, splitPercentage: 70, description: 'Tier 2' },
      ];

      expect(detectOverlappingRanges(tiers)).toBe(false);
    });

    it('should detect overlaps with duplicate thresholds', () => {
      const tiers: CommissionTier[] = [
        { id: '1', threshold: 0, splitPercentage: 60, description: 'Tier 0' },
        { id: '2', threshold: 50000, splitPercentage: 65, description: 'Tier 1' },
        { id: '3', threshold: 50000, splitPercentage: 70, description: 'Tier 2' },
      ];

      expect(detectOverlappingRanges(tiers)).toBe(true);
    });

    it('should detect overlaps with inverted thresholds', () => {
      const tiers: CommissionTier[] = [
        { id: '1', threshold: 100000, splitPercentage: 60, description: 'Tier 0' },
        { id: '2', threshold: 50000, splitPercentage: 65, description: 'Tier 1' },
      ];

      expect(detectOverlappingRanges(tiers)).toBe(true);
    });
  });

  describe('getTierRangeString', () => {
    it('should format range with next tier', () => {
      const tier: CommissionTier = {
        id: '1',
        threshold: 0,
        splitPercentage: 60,
        description: 'Tier 0',
      };

      const range = getTierRangeString(tier, 50000);
      expect(range).toBe('$0 - $49,999');
    });

    it('should format open-ended range', () => {
      const tier: CommissionTier = {
        id: '2',
        threshold: 100000,
        splitPercentage: 70,
        description: 'Tier 2',
      };

      const range = getTierRangeString(tier);
      expect(range).toBe('$100,000+');
    });
  });

  describe('suggestDefaultTiers', () => {
    it('should suggest 2 tiers', () => {
      const tiers = suggestDefaultTiers(2);
      expect(tiers).toHaveLength(2);
      expect(tiers[0].threshold).toBe(0);
      expect(tiers[1].threshold).toBe(50000);
    });

    it('should suggest 4 tiers', () => {
      const tiers = suggestDefaultTiers(4);
      expect(tiers).toHaveLength(4);
      expect(tiers[0].threshold).toBe(0);
      expect(tiers[1].threshold).toBe(50000);
      expect(tiers[2].threshold).toBe(100000);
      expect(tiers[3].threshold).toBe(200000);
    });

    it('should limit to maximum available tiers', () => {
      const tiers = suggestDefaultTiers(10);
      expect(tiers.length).toBeLessThanOrEqual(4);
    });
  });

  describe('getApplicableTiers', () => {
    const tiers: CommissionTier[] = [
      { id: '1', threshold: 0, splitPercentage: 60, description: 'Tier 0' },
      { id: '2', threshold: 50000, splitPercentage: 65, description: 'Tier 1' },
      { id: '3', threshold: 100000, splitPercentage: 70, description: 'Tier 2' },
    ];

    it('should return all applicable tiers for YTD amount', () => {
      const applicable = getApplicableTiers(tiers, 75000);
      expect(applicable).toHaveLength(2);
      expect(applicable[0].threshold).toBe(0);
      expect(applicable[1].threshold).toBe(50000);
    });

    it('should return single tier for low YTD', () => {
      const applicable = getApplicableTiers(tiers, 10000);
      expect(applicable).toHaveLength(1);
      expect(applicable[0].threshold).toBe(0);
    });

    it('should return all tiers for high YTD', () => {
      const applicable = getApplicableTiers(tiers, 150000);
      expect(applicable).toHaveLength(3);
    });
  });

  describe('getEffectiveTier', () => {
    const tiers: CommissionTier[] = [
      { id: '1', threshold: 0, splitPercentage: 60, description: 'Tier 0' },
      { id: '2', threshold: 50000, splitPercentage: 65, description: 'Tier 1' },
      { id: '3', threshold: 100000, splitPercentage: 70, description: 'Tier 2' },
    ];

    it('should return the highest applicable tier', () => {
      const tier = getEffectiveTier(tiers, 75000);
      expect(tier?.threshold).toBe(50000);
      expect(tier?.splitPercentage).toBe(65);
    });

    it('should return first tier for low YTD', () => {
      const tier = getEffectiveTier(tiers, 10000);
      expect(tier?.threshold).toBe(0);
    });

    it('should return highest tier for high YTD', () => {
      const tier = getEffectiveTier(tiers, 150000);
      expect(tier?.threshold).toBe(100000);
      expect(tier?.splitPercentage).toBe(70);
    });

    it('should return null for empty tiers', () => {
      const tier = getEffectiveTier([], 50000);
      expect(tier).toBeNull();
    });
  });
});
