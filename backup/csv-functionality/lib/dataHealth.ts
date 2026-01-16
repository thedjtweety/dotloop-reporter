import { DotloopRecord } from './csvParser';

export interface HealthIssue {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  affectedCount: number;
  impact: string; // e.g., "Affects Commission Projector"
  filter: (record: DotloopRecord) => boolean;
}

export interface HealthReport {
  score: number;
  issues: HealthIssue[];
  totalRecords: number;
}

export const analyzeDataHealth = (records: DotloopRecord[]): HealthReport => {
  const issues: HealthIssue[] = [];
  const totalRecords = records.length;

  if (totalRecords === 0) {
    return { score: 0, issues: [], totalRecords: 0 };
  }

  // Check 1: Missing Closing Dates on Active/Under Contract deals
  // Impact: Commission Projector
  const missingClosingDates = records.filter(r => {
    const status = (r.loopStatus || '').toLowerCase();
    const isActive = status.includes('active') || status.includes('contract') || status.includes('pending');
    return isActive && !r.closingDate;
  });

  if (missingClosingDates.length > 0) {
    issues.push({
      id: 'missing-closing-dates',
      type: 'critical',
      title: 'Missing Closing Dates',
      description: `${missingClosingDates.length} active deals have no closing date set.`,
      affectedCount: missingClosingDates.length,
      impact: 'Commission Projector will be inaccurate',
      filter: (r) => {
        const status = (r.loopStatus || '').toLowerCase();
        const isActive = status.includes('active') || status.includes('contract') || status.includes('pending');
        return isActive && !r.closingDate;
      }
    });
  }

  // Check 2: Missing Lead Sources
  // Impact: Lead Source Analytics
  const missingLeadSource = records.filter(r => !r.leadSource);
  
  if (missingLeadSource.length > 0) {
    issues.push({
      id: 'missing-lead-source',
      type: 'warning',
      title: 'Missing Lead Sources',
      description: `${missingLeadSource.length} records are missing lead source information.`,
      affectedCount: missingLeadSource.length,
      impact: 'Marketing ROI charts will be incomplete',
      filter: (r) => !r.leadSource
    });
  }

  // Check 3: Missing Price on Sold/Active deals
  // Impact: Sales Volume & GCI
  const missingPrice = records.filter(r => {
    const status = (r.loopStatus || '').toLowerCase();
    const isRelevant = status.includes('sold') || status.includes('closed') || status.includes('active') || status.includes('contract');
    return isRelevant && (!r.price || r.price === 0);
  });

  if (missingPrice.length > 0) {
    issues.push({
      id: 'missing-price',
      type: 'critical',
      title: 'Missing Price Data',
      description: `${missingPrice.length} transactions have a price of $0.`,
      affectedCount: missingPrice.length,
      impact: 'Sales Volume and GCI totals will be wrong',
      filter: (r) => {
        const status = (r.loopStatus || '').toLowerCase();
        const isRelevant = status.includes('sold') || status.includes('closed') || status.includes('active') || status.includes('contract');
        return isRelevant && (!r.price || r.price === 0);
      }
    });
  }

  // Check 4: Missing Commission on Closed deals
  // Impact: Revenue Reports
  const missingCommission = records.filter(r => {
    const status = (r.loopStatus || '').toLowerCase();
    const isClosed = status.includes('sold') || status.includes('closed');
    return isClosed && (!r.commissionTotal || r.commissionTotal === 0);
  });

  if (missingCommission.length > 0) {
    issues.push({
      id: 'missing-commission',
      type: 'critical',
      title: 'Missing Commission Data',
      description: `${missingCommission.length} closed deals have $0 commission recorded.`,
      affectedCount: missingCommission.length,
      impact: 'Revenue and Agent Commission reports will be under-reported',
      filter: (r) => {
        const status = (r.loopStatus || '').toLowerCase();
        const isClosed = status.includes('sold') || status.includes('closed');
        return isClosed && (!r.commissionTotal || r.commissionTotal === 0);
      }
    });
  }

  // Calculate Score
  // Start at 100, deduct points based on severity and percentage of affected records
  let score = 100;
  
  issues.forEach(issue => {
    const percentage = issue.affectedCount / totalRecords;
    const weight = issue.type === 'critical' ? 50 : 20; // Critical hits harder
    const deduction = Math.min(weight, weight * (percentage * 5)); // Cap deduction per issue
    score -= deduction;
  });

  return {
    score: Math.max(0, Math.round(score)),
    issues: issues.sort((a, b) => (a.type === 'critical' ? -1 : 1)), // Critical first
    totalRecords
  };
};
