/**
 * CSV Parser and Data Analysis Utilities for Dotloop Reports
 * Handles parsing, validation, and transformation of Dotloop CSV exports
 */

export interface DotloopRecord {
  loopId: string;
  loopName: string;
  loopStatus: string;
  createdDate: string;
  closingDate: string;
  listingDate: string;
  offerDate: string;
  address: string;
  price: number;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  yearBuilt: number;
  city: string;
  state: string;
  county: string;
  leadSource: string;
  earnestMoney: number;
  salePrice: number;
  commissionRate: number;
  commissionTotal: number;
  agents: string;
  createdBy: string;
  [key: string]: any;
}

export interface DashboardMetrics {
  totalTransactions: number;
  activeListings: number;
  underContract: number;
  closed: number;
  archived: number;
  totalSalesVolume: number;
  averagePrice: number;
  totalCommission: number;
  averageDaysToClose: number;
  closingRate: number;
}

export interface ChartData {
  label: string;
  value: number;
  percentage?: number;
}

export interface AgentMetrics {
  agentName: string;
  totalTransactions: number;
  closedDeals: number;
  closingRate: number;
  totalCommission: number;
  averageCommission: number;
  totalSalesVolume: number;
  averageSalesPrice: number;
  averageDaysToClose: number;
  activeListings: number;
  underContract: number;
}

/**
 * Parse CSV string into records
 */
export function parseCSV(csvContent: string): DotloopRecord[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  // Parse header line properly
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h => h.trim());
  const records: DotloopRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    try {
      // Handle quoted fields with commas
      const fields = parseCSVLine(line);
      const record: any = {};

      headers.forEach((header, index) => {
        record[header] = fields[index] || '';
      });

      // Map to normalized fields
      const normalized = normalizeRecord(record);
      if (normalized) {
        records.push(normalized);
      }
    } catch (error) {
      console.error('Error parsing line', i, ':', error);
    }
  }

  return records;
}

/**
 * Calculate agent performance metrics
 */
export function calculateAgentMetrics(records: DotloopRecord[]): AgentMetrics[] {
  const agentMap = new Map<string, any>();

  records.forEach(record => {
    // Handle multiple agents (comma-separated)
    const agents = record.agents
      ? record.agents.split(',').map(a => a.trim()).filter(a => a)
      : [];

    agents.forEach(agentName => {
      if (!agentMap.has(agentName)) {
        agentMap.set(agentName, {
          agentName,
          totalTransactions: 0,
          closedDeals: 0,
          totalCommission: 0,
          totalSalesVolume: 0,
          daysToCloseList: [],
          activeListings: 0,
          underContract: 0,
        });
      }

      const agent = agentMap.get(agentName)!;
      agent.totalTransactions++;

      if (record.loopStatus === 'Closed') {
        agent.closedDeals++;
      } else if (record.loopStatus === 'Active Listings') {
        agent.activeListings++;
      } else if (record.loopStatus === 'Under Contract') {
        agent.underContract++;
      }

      agent.totalCommission += record.commissionTotal || 0;
      agent.totalSalesVolume += record.salePrice || record.price || 0;

      // Calculate days to close
      if (record.closingDate && record.createdDate) {
        const created = new Date(record.createdDate);
        const closing = new Date(record.closingDate);
        if (!isNaN(created.getTime()) && !isNaN(closing.getTime())) {
          const daysToClose = Math.ceil(
            (closing.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysToClose > 0) {
            agent.daysToCloseList.push(daysToClose);
          }
        }
      }
    });
  });

  // Convert to array and calculate final metrics
  return Array.from(agentMap.values())
    .map(agent => ({
      agentName: agent.agentName,
      totalTransactions: agent.totalTransactions,
      closedDeals: agent.closedDeals,
      closingRate:
        agent.totalTransactions > 0
          ? (agent.closedDeals / agent.totalTransactions) * 100
          : 0,
      totalCommission: agent.totalCommission,
      averageCommission:
        agent.totalTransactions > 0
          ? agent.totalCommission / agent.totalTransactions
          : 0,
      totalSalesVolume: agent.totalSalesVolume,
      averageSalesPrice:
        agent.totalTransactions > 0
          ? agent.totalSalesVolume / agent.totalTransactions
          : 0,
      averageDaysToClose:
        agent.daysToCloseList.length > 0
          ? Math.round(
              agent.daysToCloseList.reduce((a: number, b: number) => a + b, 0) /
                agent.daysToCloseList.length
            )
          : 0,
      activeListings: agent.activeListings,
      underContract: agent.underContract,
    }))
    .sort((a: AgentMetrics, b: AgentMetrics) => b.totalCommission - a.totalCommission);
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  fields.push(current);
  return fields;
}

/**
 * Normalize raw CSV record to standard format
 */
function normalizeRecord(raw: any): DotloopRecord | null {
  try {
    return {
      loopId: raw['Loop ID'] || '',
      loopName: raw['Loop Name'] || '',
      loopStatus: raw['Loop Status'] || '',
      createdDate: raw['Created Date'] || '',
      closingDate: raw['Closing Date'] || raw['Contract Dates / Closing Date'] || '',
      listingDate: raw['Listing Date'] || raw['Listing Information / Listing Date'] || '',
      offerDate: raw['Offer Date'] || '',
      address: raw['Address'] || raw['Property Address / Full Address'] || '',
      price: parseFloat(raw['Price'] || raw['Financials / Purchase/Sale Price'] || '0') || 0,
      propertyType: raw['Property / Type'] || '',
      bedrooms: parseInt(raw['Property / Bedrooms'] || '0') || 0,
      bathrooms: parseInt(raw['Property / Bathrooms'] || '0') || 0,
      squareFootage: parseInt(raw['Property / Square Footage'] || '0') || 0,
      yearBuilt: parseInt(raw['Property / Year Built'] || '0') || 0,
      city: raw['Property Address / City'] || '',
      state: raw['Property Address / State/Prov'] || '',
      county: raw['Property Address / County'] || '',
      leadSource: raw['Lead Source / Lead Source'] || raw['Referral / LEAD SOURCE'] || '',
      earnestMoney: parseFloat(raw['Financials / Earnest Money Amount'] || '0') || 0,
      salePrice: parseFloat(raw['Financials / Purchase/Sale Price'] || '0') || 0,
      commissionRate: parseFloat(raw['Financials / Sale Commission Rate'] || '0') || 0,
      commissionTotal: parseFloat(raw['Financials / Sale Commission Total'] || '0') || 0,
      agents: raw['Agents'] || raw['Created By'] || '',
      createdBy: raw['Created By'] || '',
    };
  } catch (error) {
    console.error('Error normalizing record:', error);
    return null;
  }
}

/**
 * Calculate dashboard metrics from records
 */
export function calculateMetrics(records: DotloopRecord[]): DashboardMetrics {
  if (records.length === 0) {
    return {
      totalTransactions: 0,
      activeListings: 0,
      underContract: 0,
      closed: 0,
      archived: 0,
      totalSalesVolume: 0,
      averagePrice: 0,
      totalCommission: 0,
      averageDaysToClose: 0,
      closingRate: 0,
    };
  }

  const statusCounts = {
    activeListings: 0,
    underContract: 0,
    closed: 0,
    archived: 0,
  };

  let totalSalesVolume = 0;
  let totalCommission = 0;
  let daysToCloseValues: number[] = [];

  records.forEach(record => {
    const status = record.loopStatus?.toLowerCase() || '';

    if (status.includes('active')) statusCounts.activeListings++;
    else if (status.includes('contract')) statusCounts.underContract++;
    else if (status.includes('closed') || status.includes('sold')) statusCounts.closed++;
    else if (status.includes('archived')) statusCounts.archived++;

    totalSalesVolume += record.salePrice || record.price || 0;
    totalCommission += record.commissionTotal || 0;

    // Calculate days to close
    if (record.createdDate && record.closingDate) {
      const created = new Date(record.createdDate);
      const closing = new Date(record.closingDate);
      if (!isNaN(created.getTime()) && !isNaN(closing.getTime())) {
        const days = Math.floor((closing.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        if (days >= 0) daysToCloseValues.push(days);
      }
    }
  });

  const closedCount = statusCounts.closed;
  const averageDaysToClose = daysToCloseValues.length > 0
    ? Math.round(daysToCloseValues.reduce((a, b) => a + b, 0) / daysToCloseValues.length)
    : 0;

  return {
    totalTransactions: records.length,
    activeListings: statusCounts.activeListings,
    underContract: statusCounts.underContract,
    closed: closedCount,
    archived: statusCounts.archived,
    totalSalesVolume,
    averagePrice: Math.round(totalSalesVolume / records.length),
    totalCommission,
    averageDaysToClose,
    closingRate: records.length > 0 ? Math.round((closedCount / records.length) * 100) : 0,
  };
}

/**
 * Get pipeline breakdown by status
 */
export function getPipelineData(records: DotloopRecord[]): ChartData[] {
  const statusCounts: { [key: string]: number } = {};

  records.forEach(record => {
    const status = record.loopStatus || 'Unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  return Object.entries(statusCounts).map(([label, value]) => ({
    label,
    value,
    percentage: Math.round((value / records.length) * 100),
  }));
}

/**
 * Get lead source breakdown
 */
export function getLeadSourceData(records: DotloopRecord[]): ChartData[] {
  const leadCounts: { [key: string]: number } = {};

  records.forEach(record => {
    const source = record.leadSource || 'Unknown';
    leadCounts[source] = (leadCounts[source] || 0) + 1;
  });

  return Object.entries(leadCounts)
    .map(([label, value]) => ({
      label,
      value,
      percentage: Math.round((value / records.length) * 100),
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Get property type breakdown
 */
export function getPropertyTypeData(records: DotloopRecord[]): ChartData[] {
  const typeCounts: { [key: string]: number } = {};

  records.forEach(record => {
    const type = record.propertyType || 'Unknown';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });

  return Object.entries(typeCounts)
    .map(([label, value]) => ({
      label,
      value,
      percentage: Math.round((value / records.length) * 100),
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Get geographic breakdown by state
 */
export function getGeographicData(records: DotloopRecord[]): ChartData[] {
  const stateCounts: { [key: string]: number } = {};

  records.forEach(record => {
    const state = record.state || 'Unknown';
    stateCounts[state] = (stateCounts[state] || 0) + 1;
  });

  return Object.entries(stateCounts)
    .map(([label, value]) => ({
      label,
      value,
      percentage: Math.round((value / records.length) * 100),
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Get sales performance over time (by month)
 */
export function getSalesOverTime(records: DotloopRecord[]): ChartData[] {
  const monthData: { [key: string]: number } = {};

  records.forEach(record => {
    const dateStr = record.closingDate || record.createdDate;
    if (dateStr) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const monthKey = date.toLocaleString('default', { year: 'numeric', month: 'short' });
        monthData[monthKey] = (monthData[monthKey] || 0) + 1;
      }
    }
  });

  return Object.entries(monthData)
    .map(([label, value]) => ({
      label,
      value,
    }))
    .sort((a, b) => new Date(a.label).getTime() - new Date(b.label).getTime());
}
