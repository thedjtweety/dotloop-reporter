/**
 * Commission Variance Analysis
 * Compares CSV-provided commission values against calculated commissions
 * to identify discrepancies and validate calculation accuracy
 */

import { DotloopRecord } from './csvParser';
import { CommissionPlan, getCommissionPlans, getAgentAssignments, getPlanForAgent } from './commission';
import { calculateTransactionCommissionNew } from './commissionCalculator';

export interface CommissionVarianceItem {
  recordId: string;
  loopName: string;
  closingDate: string;
  agentName: string;
  csvCompanyDollar: number; // From CSV
  calculatedCompanyDollar: number; // From plan calculation
  varianceAmount: number; // Difference (calculated - csv)
  variancePercentage: number; // Percentage difference
  varianceCategory: 'exact' | 'minor' | 'major'; // Categorization
  csvGCI: number;
  calculatedGCI: number;
  planName: string;
  notes: string;
}

export interface CommissionVarianceSummary {
  totalItems: number;
  exactMatches: number;
  minorVariances: number; // < 5%
  majorVariances: number; // >= 5%
  totalVarianceAmount: number;
  averageVariancePercentage: number;
  totalCSVCommission: number;
  totalCalculatedCommission: number;
  overallVariancePercentage: number;
}

/**
 * Calculate commission variance for all transactions
 * @param records - All transaction records
 * @returns Array of variance items and summary statistics
 */
export function calculateCommissionVariance(
  records: DotloopRecord[]
): { items: CommissionVarianceItem[]; summary: CommissionVarianceSummary } {
  const plans = getCommissionPlans();
  const assignments = getAgentAssignments();
  const varianceItems: CommissionVarianceItem[] = [];

  records.forEach((record) => {
    if (!record.agents) return;

    const agents = record.agents.split(',').map((a) => a.trim());
    const gciPerAgent = (record.commissionTotal || 0) / agents.length;
    const csvCompanyDollarPerAgent = (record.companyDollar || 0) / agents.length;
    const closingDate = new Date(record.closingDate);

    agents.forEach((agentName) => {
      const assignment = assignments.find((a) => a.agentName === agentName);
      const plan = plans.find((p) => p.id === assignment?.planId);

      if (!plan) return;

      // Calculate what the company dollar should be based on the plan
      const breakdown = calculateTransactionCommissionNew(record, plan);
      const calculatedCompanyDollarPerAgent = breakdown.cappedCompanyShare / agents.length;

      // Calculate variance
      const varianceAmount = calculatedCompanyDollarPerAgent - csvCompanyDollarPerAgent;
      const variancePercentage =
        csvCompanyDollarPerAgent !== 0
          ? Math.abs((varianceAmount / csvCompanyDollarPerAgent) * 100)
          : 0;

      // Categorize variance
      let varianceCategory: 'exact' | 'minor' | 'major' = 'exact';
      if (Math.abs(varianceAmount) > 0.01) {
        // Allow for rounding errors
        if (variancePercentage >= 5) {
          varianceCategory = 'major';
        } else {
          varianceCategory = 'minor';
        }
      }

      varianceItems.push({
        recordId: record.loopId,
        loopName: record.loopName,
        closingDate: record.closingDate,
        agentName,
        csvCompanyDollar: csvCompanyDollarPerAgent,
        calculatedCompanyDollar: calculatedCompanyDollarPerAgent,
        varianceAmount,
        variancePercentage,
        varianceCategory,
        csvGCI: gciPerAgent,
        calculatedGCI: breakdown.totalGCI / agents.length,
        planName: plan.name,
        notes: `CSV: $${csvCompanyDollarPerAgent.toFixed(2)} | Calculated: $${calculatedCompanyDollarPerAgent.toFixed(2)}`,
      });
    });
  });

  // Calculate summary statistics
  const summary: CommissionVarianceSummary = {
    totalItems: varianceItems.length,
    exactMatches: varianceItems.filter((v) => v.varianceCategory === 'exact').length,
    minorVariances: varianceItems.filter((v) => v.varianceCategory === 'minor').length,
    majorVariances: varianceItems.filter((v) => v.varianceCategory === 'major').length,
    totalVarianceAmount: varianceItems.reduce((sum, v) => sum + Math.abs(v.varianceAmount), 0),
    averageVariancePercentage:
      varianceItems.length > 0
        ? varianceItems.reduce((sum, v) => sum + v.variancePercentage, 0) / varianceItems.length
        : 0,
    totalCSVCommission: varianceItems.reduce((sum, v) => sum + v.csvCompanyDollar, 0),
    totalCalculatedCommission: varianceItems.reduce((sum, v) => sum + v.calculatedCompanyDollar, 0),
    overallVariancePercentage: 0,
  };

  // Calculate overall variance percentage
  if (summary.totalCSVCommission > 0) {
    summary.overallVariancePercentage =
      Math.abs((summary.totalVarianceAmount / summary.totalCSVCommission) * 100);
  }

  return { items: varianceItems, summary };
}

/**
 * Filter variance items by agent name
 */
export function filterVarianceByAgent(
  items: CommissionVarianceItem[],
  agentName: string
): CommissionVarianceItem[] {
  return items.filter((v) => v.agentName === agentName);
}

/**
 * Filter variance items by category
 */
export function filterVarianceByCategory(
  items: CommissionVarianceItem[],
  category: 'exact' | 'minor' | 'major'
): CommissionVarianceItem[] {
  return items.filter((v) => v.varianceCategory === category);
}

/**
 * Sort variance items by variance amount (descending)
 */
export function sortVarianceByAmount(items: CommissionVarianceItem[]): CommissionVarianceItem[] {
  return [...items].sort((a, b) => Math.abs(b.varianceAmount) - Math.abs(a.varianceAmount));
}

/**
 * Sort variance items by variance percentage (descending)
 */
export function sortVarianceByPercentage(items: CommissionVarianceItem[]): CommissionVarianceItem[] {
  return [...items].sort((a, b) => b.variancePercentage - a.variancePercentage);
}

/**
 * Get variance statistics by agent
 */
export function getVarianceByAgent(items: CommissionVarianceItem[]) {
  const agentMap = new Map<
    string,
    {
      agentName: string;
      totalVariance: number;
      averageVariancePercentage: number;
      itemCount: number;
      majorVarianceCount: number;
    }
  >();

  items.forEach((item) => {
    const existing = agentMap.get(item.agentName) || {
      agentName: item.agentName,
      totalVariance: 0,
      averageVariancePercentage: 0,
      itemCount: 0,
      majorVarianceCount: 0,
    };

    existing.totalVariance += Math.abs(item.varianceAmount);
    existing.itemCount += 1;
    existing.majorVarianceCount += item.varianceCategory === 'major' ? 1 : 0;

    agentMap.set(item.agentName, existing);
  });

  // Calculate averages
  return Array.from(agentMap.values()).map((agent) => ({
    ...agent,
    averageVariancePercentage:
      agent.itemCount > 0
        ? items
            .filter((v) => v.agentName === agent.agentName)
            .reduce((sum, v) => sum + v.variancePercentage, 0) / agent.itemCount
        : 0,
  }));
}

/**
 * Export variance report as CSV string
 */
export function exportVarianceAsCSV(items: CommissionVarianceItem[], summary: CommissionVarianceSummary): string {
  const headers = [
    'Loop Name',
    'Closing Date',
    'Agent Name',
    'Plan Name',
    'CSV Company Dollar',
    'Calculated Company Dollar',
    'Variance Amount',
    'Variance Percentage',
    'Variance Category',
  ];

  const rows = items.map((item) => [
    item.loopName,
    item.closingDate,
    item.agentName,
    item.planName,
    item.csvCompanyDollar.toFixed(2),
    item.calculatedCompanyDollar.toFixed(2),
    item.varianceAmount.toFixed(2),
    item.variancePercentage.toFixed(2),
    item.varianceCategory,
  ]);

  const summaryRows = [
    [],
    ['SUMMARY STATISTICS'],
    ['Total Items', summary.totalItems],
    ['Exact Matches', summary.exactMatches],
    ['Minor Variances (<5%)', summary.minorVariances],
    ['Major Variances (>=5%)', summary.majorVariances],
    ['Total Variance Amount', summary.totalVarianceAmount.toFixed(2)],
    ['Average Variance Percentage', summary.averageVariancePercentage.toFixed(2)],
    ['Total CSV Commission', summary.totalCSVCommission.toFixed(2)],
    ['Total Calculated Commission', summary.totalCalculatedCommission.toFixed(2)],
    ['Overall Variance Percentage', summary.overallVariancePercentage.toFixed(2)],
  ];

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ...summaryRows.map((row) => row.join(',')),
  ].join('\n');

  return csvContent;
}
