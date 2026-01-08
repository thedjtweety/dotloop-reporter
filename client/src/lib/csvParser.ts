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
  buySideCommission: number;
  sellSideCommission: number;
  companyDollar: number;
  referralSource: string;
  referralPercentage: number;
  complianceStatus: string;
  tags: string[];
  originalPrice: number;
  yearBuilt: number;
  lotSize: number;
  subdivision: string;
  [key: string]: any;
}

export interface MetricTrend {
  value: number;
  direction: 'up' | 'down' | 'neutral';
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
  trends?: {
    totalTransactions: MetricTrend;
    totalVolume: MetricTrend;
    avgCommission: MetricTrend;
    avgSalePrice: MetricTrend;
    avgDaysToClose: MetricTrend;
    closingRate: MetricTrend;
  };
}

export interface ChartData {
  label: string;
  value: number;
  percentage?: number;
  movingAverage?: number;
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
  buySideCommission: number;
  sellSideCommission: number;
  buySidePercentage: number;
  sellSidePercentage: number;
  companyDollar: number;
}

/**
 * Parse CSV string into records
 */
export function parseCSV(csvContent: string): DotloopRecord[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 1) return [];

  // Check if first line is a header or data
  const firstLine = lines[0];
  const firstLineFields = parseCSVLine(firstLine);
  
  // Heuristic: If first line contains "Price", "Date", "Address", etc., it's a header.
  // If it contains specific names, dates (e.g. "6/21/2017"), or numbers, it's data.
  const isHeader = firstLineFields.some(f => 
    ['Agent Name', 'Loop Name', 'Price', 'Closing Date', 'Address', 'Lead Source'].some(h => 
      f.toLowerCase().includes(h.toLowerCase())
    )
  );

  let headers: string[] = [];
  let startIndex = 0;

  if (isHeader) {
    headers = firstLineFields.map(h => h.trim());
    startIndex = 1;
  } else {
    // Default mapping for headless CSV (ReportBuilding.csv format)
    // Based on analysis: 
    // 0: Agent Name, 1: Address, 2: Lead Source, 3: Listing Date, 4: Price, 5: Status, 
    // 6: Contract Date, 7: Closing Date, 8: Review Status, 9: Comm Split?, 10: Side, 
    // 11: Total Comm, 12: Rate, 13: Buy Comm, 14: Sell Comm, 15: Buy %, 16: Sell %
    headers = [
      'Agents',           // 0
      'Address',          // 1
      'Lead Source',      // 2
      'Listing Date',     // 3
      'Price',            // 4
      'Loop Status',      // 5
      'Offer Date',       // 6
      'Closing Date',     // 7
      'Review Status',    // 8
      'Commission Split', // 9
      'Transaction Side', // 10
      'Total Commission', // 11
      'Commission Rate',  // 12
      'Buy Side Commission', // 13
      'Sell Side Commission', // 14
      'Buy Side %',       // 15
      'Sell Side %'       // 16
    ];
    startIndex = 0; // Start parsing from the first line
  }

  const records: DotloopRecord[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Skip lines that look like empty commas (e.g. ",,,,,,,,,")
    if (line.replace(/,/g, '').trim().length === 0) continue;

    try {
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
          buySideCommission: 0,
          sellSideCommission: 0,
          companyDollar: 0,
        });
      }

      const agent = agentMap.get(agentName)!;
      agent.totalTransactions++;

      if (record.loopStatus === 'Closed' || record.loopStatus === 'Sold') {
        agent.closedDeals++;
      } else if (record.loopStatus === 'Active Listings') {
        agent.activeListings++;
      } else if (record.loopStatus === 'Under Contract') {
        agent.underContract++;
      }

      agent.totalCommission += record.commissionTotal || 0;
      agent.totalSalesVolume += record.salePrice || record.price || 0;
      agent.buySideCommission += record.buySideCommission || 0;
      agent.sellSideCommission += record.sellSideCommission || 0;
      agent.companyDollar += record.companyDollar || 0;

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
      buySideCommission: agent.buySideCommission,
      sellSideCommission: agent.sellSideCommission,
      buySidePercentage:
        agent.totalCommission > 0
          ? (agent.buySideCommission / agent.totalCommission) * 100
          : 0,
      sellSidePercentage:
        agent.totalCommission > 0
          ? (agent.sellSideCommission / agent.totalCommission) * 100
          : 0,
      companyDollar: agent.companyDollar,
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
export function normalizeRecord(raw: any, mapping?: Record<string, string>): DotloopRecord | null {
  try {
    // Helper to get value from mapping or fallback to raw keys
    const getValue = (key: string, fallbacks: string[] = []) => {
      if (mapping && mapping[key]) {
        return raw[mapping[key]];
      }
      // If no mapping, try fallbacks
      for (const fallback of fallbacks) {
        if (raw[fallback] !== undefined && raw[fallback] !== '') return raw[fallback];
      }
      return undefined;
    };

    // Helper to clean currency strings
    const parseCurrency = (val: string) => {
      if (!val) return 0;
      return parseFloat(val.replace(/[$,\s]/g, '')) || 0;
    };

    // Helper to clean percentage strings
    const parsePercent = (val: string) => {
      if (!val) return 0;
      return parseFloat(val.replace(/[%,\s]/g, '')) || 0;
    };

    return {
      loopId: getValue('loopId', ['Loop ID']) || '',
      loopName: getValue('loopName', ['Loop Name', 'Address']) || '',
      loopStatus: getValue('loopStatus', ['Loop Status']) || '',
      createdDate: getValue('createdDate', ['Created Date', 'Listing Date']) || '',
      closingDate: getValue('closingDate', ['Closing Date', 'Contract Dates / Closing Date']) || '',
      listingDate: getValue('listingDate', ['Listing Date', 'Listing Information / Listing Date']) || '',
      offerDate: getValue('offerDate', ['Offer Date']) || '',
      address: getValue('address', ['Address', 'Property Address / Full Address']) || '',
      price: parseCurrency(getValue('price', ['Price', 'Financials / Purchase/Sale Price', 'Listing Information / Current Price']) || '0'),
      propertyType: getValue('propertyType', ['Property / Type']) || 'Residential',
      bedrooms: parseInt(getValue('bedrooms', ['Property / Bedrooms']) || '0') || 0,
      bathrooms: parseInt(getValue('bathrooms', ['Property / Bathrooms']) || '0') || 0,
      squareFootage: parseInt(getValue('squareFootage', ['Property / Square Footage']) || '0') || 0,
      city: getValue('city', ['Property Address / City']) || '',
      state: getValue('state', ['Property Address / State/Prov']) || '',
      county: getValue('county', ['Property Address / County']) || '',
      leadSource: getValue('leadSource', ['Lead Source', 'Lead Source / Lead Source', 'Referral / LEAD SOURCE', 'Referral / Referral Source']) || '',
      earnestMoney: parseCurrency(getValue('earnestMoney', ['Financials / Earnest Money Amount']) || '0'),
      salePrice: parseCurrency(getValue('price', ['Financials / Purchase/Sale Price', 'Price']) || '0'),
      commissionRate: parsePercent(getValue('commissionRate', ['Commission Rate', 'Financials / Sale Commission Rate']) || '0'),
      commissionTotal: parseCurrency(getValue('commissionTotal', ['Total Commission', 'Financials / Sale Commission Total']) || '0'),
      agents: getValue('agents', ['Agents', 'Created By']) || '',
      createdBy: getValue('createdBy', ['Created By', 'Agents']) || '',
      buySideCommission: parseCurrency(getValue('buySideCommission', ['Buy Side Commission']) || '0'),
      sellSideCommission: parseCurrency(getValue('sellSideCommission', ['Sell Side Commission']) || '0'),
      companyDollar: parseCurrency(getValue('companyDollar', ['Company Dollar', 'Net to Office']) || '0'),
      referralSource: getValue('referralSource', ['Referral / Referral Source', 'Referral Source']) || '',
      referralPercentage: parsePercent(getValue('referralPercentage', ['Referral / Referral %', 'Referral %']) || '0'),
      complianceStatus: getValue('complianceStatus', ['Compliance Status', 'Review Status']) || 'No Status',
      tags: (getValue('tags', ['Tags']) || '').split('|').filter((t: string) => t.trim()),
      originalPrice: parseCurrency(getValue('originalPrice', ['Listing Information / Original Price', 'Original Price']) || '0'),
      yearBuilt: parseInt(getValue('yearBuilt', ['Property / Year Built']) || '0') || 0,
      lotSize: parseInt(getValue('lotSize', ['Property / Lot Size']) || '0') || 0,
      subdivision: getValue('subdivision', ['Geographic Description / Subdivision']) || '',
    };
  } catch (error) {
    console.error('Error normalizing record:', error);
    return null;
  }
}

/**
 * Calculate dashboard metrics from records
 */
import { calculateTrend } from './dateUtils';

export function calculateMetrics(records: DotloopRecord[], previousRecords?: DotloopRecord[]): DashboardMetrics {
  const calculateBaseMetrics = (recs: DotloopRecord[]) => {
    if (recs.length === 0) {
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

    recs.forEach(record => {
      const status = record.loopStatus?.toLowerCase() || '';

      if (status.includes('active')) statusCounts.activeListings++;
      else if (status.includes('contract')) statusCounts.underContract++;
      else if (status.includes('closed') || status.includes('sold')) statusCounts.closed++;
      else if (status.includes('archived')) statusCounts.archived++;

      // Only count volume/commission for closed/sold deals
      if (status.includes('closed') || status.includes('sold')) {
        totalSalesVolume += record.salePrice || record.price || 0;
        totalCommission += record.commissionTotal || 0;

        if (record.closingDate && record.createdDate) {
          const created = new Date(record.createdDate);
          const closing = new Date(record.closingDate);
          if (!isNaN(created.getTime()) && !isNaN(closing.getTime())) {
            const days = Math.ceil((closing.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            if (days > 0) daysToCloseValues.push(days);
          }
        }
      }
    });

    const totalTransactions = recs.length;
    const averagePrice = statusCounts.closed > 0 ? totalSalesVolume / statusCounts.closed : 0;
    const averageDaysToClose = daysToCloseValues.length > 0 
      ? Math.round(daysToCloseValues.reduce((a, b) => a + b, 0) / daysToCloseValues.length) 
      : 0;
    const closingRate = totalTransactions > 0 ? (statusCounts.closed / totalTransactions) * 100 : 0;

    return {
      totalTransactions,
      activeListings: statusCounts.activeListings,
      underContract: statusCounts.underContract,
      closed: statusCounts.closed,
      archived: statusCounts.archived,
      totalSalesVolume,
      averagePrice,
      totalCommission,
      averageDaysToClose,
      closingRate,
    };
  };

  const currentMetrics = calculateBaseMetrics(records);
  
  // Calculate trends if previous records exist
  let trends;
  if (previousRecords && previousRecords.length > 0) {
    const prevMetrics = calculateBaseMetrics(previousRecords);
    
    trends = {
      totalTransactions: calculateTrend(currentMetrics.totalTransactions, prevMetrics.totalTransactions),
      totalVolume: calculateTrend(currentMetrics.totalSalesVolume, prevMetrics.totalSalesVolume),
      avgCommission: calculateTrend(
        currentMetrics.totalTransactions > 0 ? currentMetrics.totalCommission / currentMetrics.totalTransactions : 0,
        prevMetrics.totalTransactions > 0 ? prevMetrics.totalCommission / prevMetrics.totalTransactions : 0
      ),
      avgSalePrice: calculateTrend(currentMetrics.averagePrice, prevMetrics.averagePrice),
      avgDaysToClose: calculateTrend(currentMetrics.averageDaysToClose, prevMetrics.averageDaysToClose),
      closingRate: calculateTrend(currentMetrics.closingRate, prevMetrics.closingRate),
    };
  }

  return {
    ...currentMetrics,
    trends
  };
}

/**
 * Get data for Lead Source chart
 */
export function getLeadSourceData(records: DotloopRecord[]): ChartData[] {
  const sourceMap = new Map<string, number>();
  
  records.forEach(record => {
    const source = record.leadSource || 'Unknown';
    sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
  });

  const total = records.length;
  
  return Array.from(sourceMap.entries())
    .map(([label, value]) => ({
      label,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10 sources
}

/**
 * Get data for Property Type chart
 */
export function getPropertyTypeData(records: DotloopRecord[]): ChartData[] {
  const typeMap = new Map<string, number>();
  
  records.forEach(record => {
    const type = record.propertyType || 'Unknown';
    typeMap.set(type, (typeMap.get(type) || 0) + 1);
  });

  const total = records.length;

  return Array.from(typeMap.entries())
    .map(([label, value]) => ({
      label,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Get data for Geographic chart (by City)
 */
export function getGeographicData(records: DotloopRecord[]): ChartData[] {
  const cityMap = new Map<string, number>();
  
  records.forEach(record => {
    const city = record.city || 'Unknown';
    cityMap.set(city, (cityMap.get(city) || 0) + 1);
  });

  const total = records.length;

  return Array.from(cityMap.entries())
    .map(([label, value]) => ({
      label,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10 cities
}

/**
 * Get Sales Over Time data (Monthly)
 */
export function getSalesOverTime(records: DotloopRecord[]): ChartData[] {
  const monthMap = new Map<string, { count: number; volume: number }>();
  
  // Sort records by closing date
  const sortedRecords = [...records]
    .filter(r => r.closingDate)
    .sort((a, b) => new Date(a.closingDate).getTime() - new Date(b.closingDate).getTime());

  if (sortedRecords.length === 0) return [];

  // Generate all months in range
  const start = new Date(sortedRecords[0].closingDate);
  const end = new Date(sortedRecords[sortedRecords.length - 1].closingDate);
  
  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  const endDate = new Date(end.getFullYear(), end.getMonth(), 1);

  while (current <= endDate) {
    const key = current.toLocaleString('default', { month: 'short', year: '2-digit' });
    monthMap.set(key, { count: 0, volume: 0 });
    current.setMonth(current.getMonth() + 1);
  }

  // Fill data
  sortedRecords.forEach(record => {
    const date = new Date(record.closingDate);
    if (!isNaN(date.getTime())) {
      const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (monthMap.has(key)) {
        const data = monthMap.get(key)!;
        data.count++;
        data.volume += record.salePrice || record.price || 0;
      }
    }
  });

  // Calculate moving average (3-month)
  const data = Array.from(monthMap.entries()).map(([label, { count, volume }]) => ({
    label,
    value: count, // Or volume, depending on what we want to show. Usually transaction count bars.
    volume // Keep volume for tooltips if needed
  }));

  return data.map((item, index, array) => {
    // Calculate 3-month moving average
    let sum = 0;
    let count = 0;
    for (let i = Math.max(0, index - 2); i <= index; i++) {
      sum += array[i].value;
      count++;
    }
    return {
      ...item,
      movingAverage: count > 0 ? sum / count : 0
    };
  });
}

/**
 * Get Pipeline data (by Loop Status)
 */
export function getPipelineData(records: DotloopRecord[]): ChartData[] {
  const statusMap = new Map<string, number>();
  
  records.forEach(record => {
    // Normalize status
    let status = record.loopStatus || 'Unknown';
    
    // Group similar statuses if needed, or keep raw
    if (status.toLowerCase().includes('sold') || status.toLowerCase().includes('closed')) {
      status = 'Closed';
    } else if (status.toLowerCase().includes('active')) {
      status = 'Active';
    } else if (status.toLowerCase().includes('contract') || status.toLowerCase().includes('pending')) {
      status = 'Under Contract';
    } else if (status.toLowerCase().includes('archived')) {
      status = 'Archived';
    }
    
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  });

  const total = records.length;

  return Array.from(statusMap.entries())
    .map(([label, value]) => ({
      label,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0
    }))
    .sort((a, b) => b.value - a.value);
}
