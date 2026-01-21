/**
 * Tier Transition Tracker
 * 
 * Tracks when agents transition between commission tiers during calculations
 * and provides data for tier history logging
 */

import type { CommissionPlan, CommissionTier } from "./commission-calculator";

export interface TierTransition {
  agentName: string;
  planId: string;
  previousTierIndex: number | null;
  previousTierThreshold: number | null;
  previousSplitPercentage: number | null;
  newTierIndex: number;
  newTierThreshold: number;
  newSplitPercentage: number;
  ytdAmount: number;
  transactionId: string;
  transactionDate: string;
  occurred: boolean; // Whether a tier change actually happened
}

/**
 * Get the current tier index for an agent based on YTD amount
 */
export function getCurrentTierIndex(
  plan: CommissionPlan,
  ytdCompanyDollar: number
): { tierIndex: number; tier: CommissionTier } | null {
  if (!plan.useSliding || !plan.tiers || plan.tiers.length === 0) {
    return null; // Not using sliding scale
  }

  const sortedTiers = [...plan.tiers].sort((a, b) => a.threshold - b.threshold);
  let applicableTier = sortedTiers[0];
  let tierIndex = 0;

  for (let i = 0; i < sortedTiers.length; i++) {
    if (ytdCompanyDollar >= sortedTiers[i].threshold) {
      applicableTier = sortedTiers[i];
      tierIndex = i;
    } else {
      break;
    }
  }

  return { tierIndex, tier: applicableTier };
}

/**
 * Detect if a tier transition occurred
 * 
 * Compares the agent's tier before and after a transaction
 */
export function detectTierTransition(
  plan: CommissionPlan,
  agentName: string,
  planId: string,
  ytdBefore: number,
  ytdAfter: number,
  transactionId: string,
  transactionDate: string
): TierTransition | null {
  if (!plan.useSliding || !plan.tiers || plan.tiers.length === 0) {
    return null; // Not using sliding scale
  }

  const tierBefore = getCurrentTierIndex(plan, ytdBefore);
  const tierAfter = getCurrentTierIndex(plan, ytdAfter);

  // Check if tier changed
  if (
    !tierBefore ||
    !tierAfter ||
    tierBefore.tierIndex === tierAfter.tierIndex
  ) {
    return null; // No tier change
  }

  return {
    agentName,
    planId,
    previousTierIndex: tierBefore.tierIndex,
    previousTierThreshold: tierBefore.tier.threshold,
    previousSplitPercentage: tierBefore.tier.splitPercentage,
    newTierIndex: tierAfter.tierIndex,
    newTierThreshold: tierAfter.tier.threshold,
    newSplitPercentage: tierAfter.tier.splitPercentage,
    ytdAmount: ytdAfter,
    transactionId,
    transactionDate,
    occurred: true,
  };
}

/**
 * Track tier transitions across multiple transactions
 * 
 * Returns all tier transitions that occurred during the calculation
 */
export function trackTierTransitions(
  plans: CommissionPlan[],
  agentYTDMap: Map<
    string,
    {
      ytdBefore: number;
      ytdAfter: number;
      planId: string;
      lastTransactionId?: string;
      lastTransactionDate?: string;
    }
  >
): TierTransition[] {
  const transitions: TierTransition[] = [];

  agentYTDMap.forEach((data, agentName) => {
    const plan = plans.find((p) => p.id === data.planId);
    if (!plan) return;

    const transition = detectTierTransition(
      plan,
      agentName,
      data.planId,
      data.ytdBefore,
      data.ytdAfter,
      data.lastTransactionId || "",
      data.lastTransactionDate || new Date().toISOString().split("T")[0]
    );

    if (transition) {
      transitions.push(transition);
    }
  });

  return transitions;
}

/**
 * Format tier transition for display
 */
export function formatTierTransition(transition: TierTransition): string {
  const from = transition.previousTierIndex !== null ? `Tier ${transition.previousTierIndex}` : "No Tier";
  const to = `Tier ${transition.newTierIndex}`;
  const splitChange = `${transition.previousSplitPercentage || 0}% → ${transition.newSplitPercentage}%`;

  return `${transition.agentName}: ${from} → ${to} (${splitChange}) at $${transition.ytdAmount.toLocaleString()}`;
}

/**
 * Get tier progression for an agent
 * 
 * Shows the path an agent has taken through tiers
 */
export function getTierProgression(
  transitions: TierTransition[],
  agentName: string
): { tier: number; ytdAmount: number; date: string }[] {
  return transitions
    .filter((t) => t.agentName === agentName)
    .map((t) => ({
      tier: t.newTierIndex,
      ytdAmount: t.ytdAmount,
      date: t.transactionDate,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
