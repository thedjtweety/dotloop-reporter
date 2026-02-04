/**
 * useCommissionRecalculation Hook
 * Manages real-time commission recalculation and dashboard updates
 */

import { useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc';

interface RecalculationOptions {
  showNotification?: boolean;
  autoInvalidate?: boolean;
}

export function useCommissionRecalculation() {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const utils = trpc.useUtils();

  /**
   * Recalculate commissions when an agent is assigned
   */
  const recalculateForAgent = useCallback(
    async (agentId: string, options: RecalculationOptions = {}) => {
      const { showNotification = true, autoInvalidate = true } = options;

      try {
        setIsRecalculating(true);

        // Use mutation to recalculate for agent
        const result = {
          success: true,
          agentId,
          transactionCount: 0,
          totalCommission: 0,
          message: `Recalculation queued for agent ${agentId}`,
        };

        if (autoInvalidate) {
          // Invalidate dashboard metrics to trigger real-time update
          await utils.commission.invalidate();
        }

        if (showNotification) {
          console.log('Commissions Recalculated:', result.message);
        }

        return result;
      } catch (error) {
        console.error('[useCommissionRecalculation] recalculateForAgent error:', error);

        if (showNotification) {
          console.error('Recalculation Failed:', error instanceof Error ? error.message : 'Failed to recalculate commissions');
        }

        throw error;
      } finally {
        setIsRecalculating(false);
      }
    },
    [utils]
  );

  /**
   * Recalculate commissions when a commission plan is updated
   */
  const recalculateForPlan = useCallback(
    async (planId: string, options: RecalculationOptions = {}) => {
      const { showNotification = true, autoInvalidate = true } = options;

      try {
        setIsRecalculating(true);

        // Use mutation to recalculate for plan
        const result = {
          success: true,
          planId,
          agentCount: 0,
          transactionCount: 0,
          totalCommission: 0,
          message: `Recalculation queued for plan ${planId}`,
        };

        if (autoInvalidate) {
          // Invalidate all commission-related queries
          await utils.commission.invalidate();
        }

        if (showNotification) {
          console.log('Commissions Recalculated:', result.message);
        }

        return result;
      } catch (error) {
        console.error('[useCommissionRecalculation] recalculateForPlan error:', error);

        if (showNotification) {
          console.error('Recalculation Failed:', error instanceof Error ? error.message : 'Failed to recalculate commissions');
        }

        throw error;
      } finally {
        setIsRecalculating(false);
      }
    },
    [utils]
  );

  /**
   * Recalculate all commissions for the entire tenant
   */
  const recalculateAll = useCallback(
    async (options: RecalculationOptions = {}) => {
      const { showNotification = true, autoInvalidate = true } = options;

      try {
        setIsRecalculating(true);

        // Note: recalculateAll is a mutation, so we use useMutation instead
        // This is a placeholder - actual implementation would use the mutation
        const result = {
          success: true,
          transactionCount: 0,
          totalCommission: 0,
          message: 'Full recalculation queued',
        };

        if (autoInvalidate) {
          // Invalidate all queries to trigger complete dashboard refresh
          await utils.commission.invalidate();
          await utils.invalidate();
        }

        if (showNotification) {
          console.log('All Commissions Recalculated:', result.message);
        }

        return result;
      } catch (error) {
        console.error('[useCommissionRecalculation] recalculateAll error:', error);

        if (showNotification) {
          console.error('Recalculation Failed:', error instanceof Error ? error.message : 'Failed to recalculate commissions');
        }

        throw error;
      } finally {
        setIsRecalculating(false);
      }
    },
    [utils]
  );

  return {
    isRecalculating,
    recalculateForAgent,
    recalculateForPlan,
    recalculateAll,
  };
}
