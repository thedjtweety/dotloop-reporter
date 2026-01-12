import { CommissionTier } from './commission';

export interface TierTemplate {
  id: string;
  name: string;
  description: string;
  category: 'aggressive' | 'conservative' | 'balanced' | 'high-volume';
  tiers: CommissionTier[];
}

/**
 * Pre-built tier templates for common commission structures
 */
export const TIER_TEMPLATES: TierTemplate[] = [
  {
    id: 'aggressive-growth',
    name: 'Aggressive Growth',
    description: 'Steep increases to motivate high performance. Best for competitive markets.',
    category: 'aggressive',
    tiers: [
      {
        id: 'tier-1',
        threshold: 0,
        splitPercentage: 60,
        description: '$0-$50K: 60/40',
      },
      {
        id: 'tier-2',
        threshold: 50000,
        splitPercentage: 70,
        description: '$50K-$100K: 70/30',
      },
      {
        id: 'tier-3',
        threshold: 100000,
        splitPercentage: 80,
        description: '$100K-$150K: 80/20',
      },
      {
        id: 'tier-4',
        threshold: 150000,
        splitPercentage: 85,
        description: '$150K+: 85/15',
      },
    ],
  },
  {
    id: 'conservative',
    name: 'Conservative',
    description: 'Modest increases with stable base. Good for established teams.',
    category: 'conservative',
    tiers: [
      {
        id: 'tier-1',
        threshold: 0,
        splitPercentage: 70,
        description: '$0-$100K: 70/30',
      },
      {
        id: 'tier-2',
        threshold: 100000,
        splitPercentage: 75,
        description: '$100K+: 75/25',
      },
    ],
  },
  {
    id: 'balanced',
    name: 'Balanced Growth',
    description: 'Moderate increases with good retention. Balanced for most brokerages.',
    category: 'balanced',
    tiers: [
      {
        id: 'tier-1',
        threshold: 0,
        splitPercentage: 65,
        description: '$0-$50K: 65/35',
      },
      {
        id: 'tier-2',
        threshold: 50000,
        splitPercentage: 72,
        description: '$50K-$100K: 72/28',
      },
      {
        id: 'tier-3',
        threshold: 100000,
        splitPercentage: 80,
        description: '$100K+: 80/20',
      },
    ],
  },
  {
    id: 'high-volume',
    name: 'High Volume',
    description: 'Incentivizes transaction count. Perfect for high-transaction brokerages.',
    category: 'high-volume',
    tiers: [
      {
        id: 'tier-1',
        threshold: 0,
        splitPercentage: 60,
        description: '$0-$75K: 60/40',
      },
      {
        id: 'tier-2',
        threshold: 75000,
        splitPercentage: 68,
        description: '$75K-$150K: 68/32',
      },
      {
        id: 'tier-3',
        threshold: 150000,
        splitPercentage: 75,
        description: '$150K-$250K: 75/25',
      },
      {
        id: 'tier-4',
        threshold: 250000,
        splitPercentage: 82,
        description: '$250K+: 82/18',
      },
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'Simple two-tier structure for new agents. Easy to understand.',
    category: 'conservative',
    tiers: [
      {
        id: 'tier-1',
        threshold: 0,
        splitPercentage: 60,
        description: '$0-$50K: 60/40',
      },
      {
        id: 'tier-2',
        threshold: 50000,
        splitPercentage: 75,
        description: '$50K+: 75/25',
      },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Five-tier structure for top performers. Maximum motivation.',
    category: 'aggressive',
    tiers: [
      {
        id: 'tier-1',
        threshold: 0,
        splitPercentage: 55,
        description: '$0-$40K: 55/45',
      },
      {
        id: 'tier-2',
        threshold: 40000,
        splitPercentage: 65,
        description: '$40K-$80K: 65/35',
      },
      {
        id: 'tier-3',
        threshold: 80000,
        splitPercentage: 75,
        description: '$80K-$120K: 75/25',
      },
      {
        id: 'tier-4',
        threshold: 120000,
        splitPercentage: 82,
        description: '$120K-$180K: 82/18',
      },
      {
        id: 'tier-5',
        threshold: 180000,
        splitPercentage: 88,
        description: '$180K+: 88/12',
      },
    ],
  },
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): TierTemplate | undefined {
  return TIER_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: TierTemplate['category']): TierTemplate[] {
  return TIER_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get all unique categories
 */
export function getAllCategories(): TierTemplate['category'][] {
  const categories = new Set<TierTemplate['category']>();
  TIER_TEMPLATES.forEach((t) => categories.add(t.category));
  return Array.from(categories);
}

/**
 * Apply template to a commission plan
 */
export function applyTemplateToTiers(templateId: string): CommissionTier[] | null {
  const template = getTemplateById(templateId);
  if (!template) return null;

  // Generate new IDs for the tiers
  return template.tiers.map((tier) => ({
    ...tier,
    id: `tier-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  }));
}
