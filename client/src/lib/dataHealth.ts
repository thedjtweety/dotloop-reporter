import { DotloopRecord } from './csvParser';

export interface DataIssue {
  recordId: string;
  loopName: string;
  missingFields: string[];
  severity: 'critical' | 'warning';
}

export interface HealthReport {
  score: number;
  totalRecords: number;
  healthyRecords: number;
  issues: DataIssue[];
  missingFieldCounts: Record<string, number>;
}

export function analyzeDataHealth(records: DotloopRecord[]): HealthReport {
  const issues: DataIssue[] = [];
  const missingFieldCounts: Record<string, number> = {
    price: 0,
    date: 0,
    leadSource: 0,
    propertyType: 0,
    status: 0,
    agents: 0,
  };

  if (records.length === 0) {
    return {
      score: 100,
      totalRecords: 0,
      healthyRecords: 0,
      issues: [],
      missingFieldCounts,
    };
  }

  records.forEach(record => {
    const missing: string[] = [];
    let isCritical = false;

    // Check Critical Fields
    if (!record.salePrice && !record.price) {
      missing.push('Price');
      missingFieldCounts.price++;
      isCritical = true;
    }

    if (!record.closingDate && !record.listingDate && !record.createdDate) {
      missing.push('Date');
      missingFieldCounts.date++;
      isCritical = true;
    }

    if (!record.loopStatus) {
      missing.push('Status');
      missingFieldCounts.status++;
      isCritical = true;
    }

    // Check Warning Fields
    if (!record.leadSource || record.leadSource === 'Unknown') {
      missing.push('Lead Source');
      missingFieldCounts.leadSource++;
    }

    if (!record.propertyType || record.propertyType === 'Unknown') {
      missing.push('Property Type');
      missingFieldCounts.propertyType++;
    }

    if (!record.agents) {
      missing.push('Agents');
      missingFieldCounts.agents++;
    }

    if (missing.length > 0) {
      issues.push({
        recordId: record.loopId || Math.random().toString(36).substr(2, 9),
        loopName: record.loopName || record.address || 'Unnamed Transaction',
        missingFields: missing,
        severity: isCritical ? 'critical' : 'warning',
      });
    }
  });

  // Calculate Score
  // Base score 100. Deduct points for issues.
  // Critical issue: -5 points (capped at record count impact)
  // Warning issue: -1 point
  // Or simpler: Percentage of "perfect" records?
  // Let's go with a weighted percentage score.
  
  const totalWeight = records.length * 10; // Max potential points (10 per record)
  let currentPoints = totalWeight;

  issues.forEach(issue => {
    if (issue.severity === 'critical') {
      currentPoints -= 10; // Lost all points for this record
    } else {
      currentPoints -= 2 * issue.missingFields.length; // Lose 2 points per warning
    }
  });

  const score = Math.max(0, Math.round((currentPoints / totalWeight) * 100));
  const healthyRecords = records.length - issues.length;

  return {
    score,
    totalRecords: records.length,
    healthyRecords,
    issues: issues.sort((a, b) => (a.severity === 'critical' ? -1 : 1)), // Critical first
    missingFieldCounts,
  };
}
