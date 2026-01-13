# Sample Data & Tier Validation Guide

## Overview

This guide explains how to set up sample commission plans with sliding scale tiers, create agent assignments, and use the tier validation system to ensure proper tier configuration.

## Quick Start

### 1. Seed Sample Data

Run the seed script to create three sample commission plans with different tier structures:

```bash
pnpm seed
```

This creates:
- **Standard Sliding Scale**: Progressive 60% → 75% split across 4 tiers
- **Aggressive Growth Plan**: Steep progression 55% → 85% split across 4 tiers  
- **Conservative Plan**: Modest progression 70% → 74% split across 3 tiers

Each plan includes 3 sample agents assigned to it.

### 2. Verify Sample Data

Log in to the application and navigate to the Commission Calculator page. You should see the sample plans in the dropdown menu.

### 3. Test Tier Validation

When creating or editing commission plans, the tier configuration form validates your tiers in real-time.

## Sample Plans Details

### Standard Sliding Scale Plan

**Purpose**: Balanced tier progression for typical brokerages

| Tier | YTD Range | Split | Description |
|------|-----------|-------|-------------|
| 0 | $0 - $50K | 60/40 | Entry level agents |
| 1 | $50K - $100K | 65/35 | Growing performers |
| 2 | $100K - $200K | 70/30 | High performers |
| 3 | $200K+ | 75/25 | Top producers |

**Cap**: $500,000 annual cap on company dollar

### Aggressive Growth Plan

**Purpose**: Steep tier progression to incentivize high volume

| Tier | YTD Range | Split | Description |
|------|-----------|-------|-------------|
| 0 | $0 - $75K | 55/45 | Competitive entry split |
| 1 | $75K - $150K | 65/35 | Significant jump at $75K |
| 2 | $150K - $300K | 75/25 | Major incentive at $150K |
| 3 | $300K+ | 85/15 | Top tier reward |

**Cap**: $750,000 annual cap on company dollar

### Conservative Plan

**Purpose**: Modest tier progression with lower splits

| Tier | YTD Range | Split | Description |
|------|-----------|-------|-------------|
| 0 | $0 - $30K | 70/30 | Higher broker share |
| 1 | $30K - $75K | 72/28 | Modest improvement |
| 2 | $75K+ | 74/26 | Gradual progression |

**Cap**: $300,000 annual cap on company dollar

## Tier Validation System

### Validation Rules

The tier validation system enforces the following rules:

#### 1. Threshold Order
- Thresholds must be in ascending order
- No duplicate thresholds allowed
- First tier must start at $0

```typescript
// ✅ Valid
[
  { threshold: 0, split: 60 },
  { threshold: 50000, split: 65 },
  { threshold: 100000, split: 70 }
]

// ❌ Invalid - not ascending
[
  { threshold: 100000, split: 60 },
  { threshold: 50000, split: 65 }
]

// ❌ Invalid - doesn't start at 0
[
  { threshold: 10000, split: 60 },
  { threshold: 50000, split: 65 }
]
```

#### 2. Split Percentages
- Must be between 0 and 100
- Represents agent's share of company dollar
- Broker receives (100 - split)%

```typescript
// ✅ Valid
{ splitPercentage: 60 }  // Agent gets 60%, broker gets 40%

// ❌ Invalid
{ splitPercentage: 150 }  // Cannot exceed 100%
{ splitPercentage: -10 }  // Cannot be negative
```

#### 3. Descriptions
- Each tier must have a description
- Descriptions must be unique
- Used for user-friendly display

```typescript
// ✅ Valid
{ description: "$0 - $50K: 60/40" }
{ description: "$50K - $100K: 65/35" }

// ❌ Invalid
{ description: "" }  // Empty description
{ description: "Standard" }  // Duplicate across tiers
```

#### 4. Continuity
- No gaps or overlaps in tier ranges
- Each tier represents a continuous range
- Ranges are automatically calculated from thresholds

### Real-Time Validation Feedback

The tier configuration form provides immediate feedback:

- **Green checkmark**: Configuration is valid
- **Red alert**: Configuration has errors
- **Detailed error messages**: Specific issues with each tier

### Validation API

#### Server-Side Validation

```typescript
import { validateTiers } from '@/server/lib/tier-validation';

const result = validateTiers(tiers);

if (result.valid) {
  // Save plan to database
} else {
  // Display errors to user
  result.errors.forEach(error => {
    console.log(`Tier ${error.tierIndex}: ${error.message}`);
  });
}
```

#### Client-Side Validation

```typescript
import { validateTiers } from '@/lib/tier-validation';

const result = validateTiers(tiers);

// Use result.valid to enable/disable save button
// Use result.errors to display validation messages
```

### Validation Functions

The validation system provides several utility functions:

| Function | Purpose |
|----------|---------|
| `validateTiers()` | Comprehensive validation of entire tier configuration |
| `validateThresholdOrder()` | Check thresholds are ascending |
| `validateThresholdContinuity()` | Ensure first tier starts at $0 |
| `validateSplitPercentages()` | Validate percentages are 0-100 |
| `validateDescriptions()` | Check descriptions are unique and non-empty |
| `detectOverlappingRanges()` | Detect overlapping tier ranges |
| `getEffectiveTier()` | Get applicable tier for YTD amount |
| `getApplicableTiers()` | Get all applicable tiers for YTD amount |

## Using Sample Data

### 1. Upload Transaction Data

With sample plans created, you can now test commission calculations:

1. Go to the Commission Calculator page
2. Select a sample plan from the dropdown
3. Upload a CSV file with transaction data
4. The calculator will apply the tier structure to compute commissions

### 2. View Tier Progression

As agents' YTD amounts increase through transactions:
- The system automatically detects tier transitions
- Tier history is logged to the database
- Analytics dashboard shows tier progression patterns

### 3. Test Different Plans

Each sample plan has different tier structures:
- **Standard**: Good for balanced growth
- **Aggressive**: Good for high-volume incentives
- **Conservative**: Good for risk-averse brokerages

Try uploading the same transaction data to different plans to see how tier structure affects commissions.

## Validation Test Cases

The validation system includes 45+ test cases covering:

### Threshold Validation
- Ascending thresholds ✓
- Duplicate thresholds ✗
- Descending thresholds ✗
- Single tier ✓
- First tier at $0 ✓
- First tier not at $0 ✗

### Percentage Validation
- Valid percentages (0-100) ✓
- Percentage > 100 ✗
- Negative percentage ✗
- Edge cases (0%, 100%) ✓

### Description Validation
- Unique descriptions ✓
- Empty descriptions ✗
- Duplicate descriptions ✗

### Comprehensive Validation
- Valid configuration ✓
- Multiple errors ✗
- Overlapping ranges ✗

Run tests with:
```bash
pnpm test server/lib/tier-validation.test.ts
```

## Common Validation Errors

### Error: "Tier 1 threshold must be greater than Tier 0 threshold"

**Cause**: Thresholds are not in ascending order

**Solution**: Ensure each tier's threshold is higher than the previous tier

```typescript
// ❌ Wrong
[
  { threshold: 50000 },
  { threshold: 25000 }  // Lower than previous!
]

// ✅ Correct
[
  { threshold: 25000 },
  { threshold: 50000 }
]
```

### Error: "First tier must start at $0"

**Cause**: First tier's threshold is not 0

**Solution**: Set the first tier's threshold to 0

```typescript
// ❌ Wrong
[
  { threshold: 10000 }  // Should be 0
]

// ✅ Correct
[
  { threshold: 0 }
]
```

### Error: "Tier 1 split percentage must be between 0 and 100"

**Cause**: Split percentage is outside valid range

**Solution**: Use a percentage between 0 and 100

```typescript
// ❌ Wrong
{ splitPercentage: 150 }  // Too high
{ splitPercentage: -10 }  // Negative

// ✅ Correct
{ splitPercentage: 65 }
```

### Error: "Tier 0 must have a description"

**Cause**: Description field is empty

**Solution**: Provide a descriptive label for the tier

```typescript
// ❌ Wrong
{ description: "" }

// ✅ Correct
{ description: "$0 - $50K: 60/40 split" }
```

## Advanced Usage

### Creating Custom Tier Templates

To create your own tier templates:

```typescript
import { suggestDefaultTiers } from '@/lib/tier-validation';

// Get default 4-tier template
const tiers = suggestDefaultTiers(4);

// Customize as needed
tiers[0].splitPercentage = 55;
tiers[1].splitPercentage = 70;
// ... etc
```

### Programmatic Tier Validation

```typescript
import { validateTiers, getEffectiveTier } from '@/lib/tier-validation';

const tiers = [
  { id: '1', threshold: 0, splitPercentage: 60, description: 'Tier 0' },
  { id: '2', threshold: 50000, splitPercentage: 70, description: 'Tier 1' },
];

// Validate configuration
const validation = validateTiers(tiers);
if (!validation.valid) {
  throw new Error(validation.errors[0].message);
}

// Get effective tier for an agent
const agentYTD = 75000;
const effectiveTier = getEffectiveTier(tiers, agentYTD);
console.log(`Agent is in ${effectiveTier.description}`);
```

### Tier Range Calculations

```typescript
import { getTierRangeString } from '@/lib/tier-validation';

const tier = { threshold: 50000, splitPercentage: 65, description: 'Tier 1' };
const nextThreshold = 100000;

// Get human-readable range
const range = getTierRangeString(tier, nextThreshold);
console.log(range);  // "$50,000 - $99,999"

// Get open-ended range
const openRange = getTierRangeString(tier);
console.log(openRange);  // "$50,000+"
```

## Troubleshooting

### Sample Plans Not Appearing

1. Verify the seed script ran successfully: `pnpm seed`
2. Check database connection is working
3. Verify you're logged in with the correct tenant
4. Refresh the page and try again

### Validation Not Working

1. Ensure tier validation library is imported correctly
2. Check browser console for JavaScript errors
3. Verify all tier objects have required fields (id, threshold, splitPercentage, description)

### Tier Transitions Not Logging

1. Verify tier history table exists in database
2. Check that commission plan has `useSliding: true`
3. Ensure tiers are properly configured
4. Check server logs for errors

## Next Steps

1. **Upload Sample Data**: Create a CSV file with transaction data and upload it
2. **Test Calculations**: Run commission calculations with sample plans
3. **View Analytics**: Check the tier analytics dashboard to see progression patterns
4. **Create Custom Plans**: Use the validation system to create your own tier structures
5. **Monitor Performance**: Track agent tier advancement over time

## Support

For issues with sample data or validation:

1. Check the error messages in the UI
2. Review this guide for common errors
3. Run the validation test suite to verify system integrity
4. Check server logs for detailed error information

## References

- [Tier Analytics Guide](./TIER_ANALYTICS_GUIDE.md)
- [Commission Calculator Documentation](./commission_feasibility.md)
- [Validation Test Suite](./server/lib/tier-validation.test.ts)
