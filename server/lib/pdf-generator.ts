/**
 * PDF Generator Service
 * 
 * Generates professional commission reports as PDF files
 * Includes agent summaries, transaction details, and financial totals
 */

import { CommissionBreakdown, AgentYTDSummary } from './commission-calculator';

export interface PDFReportData {
  breakdowns: CommissionBreakdown[];
  ytdSummaries: AgentYTDSummary[];
  generatedDate: string;
  brokerageName?: string;
  reportTitle?: string;
}

export interface PDFReportOptions {
  includeTransactionDetails?: boolean;
  includeAgentSummaries?: boolean;
  groupByAgent?: boolean;
  pageSize?: 'letter' | 'a4';
}

/**
 * Format currency values for display
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Format date for display
 */
export function formatDate(dateStr: string): string {
  try {
    // Handle date string that might be in ISO format
    // If it's just a date (YYYY-MM-DD), parse it as local date
    let date: Date;
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/) && !dateStr.includes('T')) {
      // Parse as local date to avoid timezone issues
      const [year, month, day] = dateStr.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(dateStr);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateStr;
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Group commission breakdowns by agent
 */
export function groupBreakdownsByAgent(
  breakdowns: CommissionBreakdown[]
): Map<string, CommissionBreakdown[]> {
  const grouped = new Map<string, CommissionBreakdown[]>();
  
  breakdowns.forEach(breakdown => {
    if (!grouped.has(breakdown.agentName)) {
      grouped.set(breakdown.agentName, []);
    }
    grouped.get(breakdown.agentName)!.push(breakdown);
  });
  
  return grouped;
}

/**
 * Calculate agent totals from breakdowns
 */
export function calculateAgentTotals(breakdowns: CommissionBreakdown[]) {
  return {
    transactionCount: breakdowns.length,
    totalGCI: breakdowns.reduce((sum, b) => sum + b.grossCommissionIncome, 0),
    totalCompanyDollar: breakdowns.reduce((sum, b) => sum + b.brokerageSplitAmount, 0),
    totalAgentCommission: breakdowns.reduce((sum, b) => sum + b.agentNetCommission, 0),
    totalDeductions: breakdowns.reduce((sum, b) => sum + b.totalDeductions, 0),
    totalRoyalties: breakdowns.reduce((sum, b) => sum + b.royaltyAmount, 0),
  };
}

/**
 * Calculate report totals
 */
export function calculateReportTotals(breakdowns: CommissionBreakdown[]) {
  return {
    totalTransactions: breakdowns.length,
    totalGCI: breakdowns.reduce((sum, b) => sum + b.grossCommissionIncome, 0),
    totalCompanyDollar: breakdowns.reduce((sum, b) => sum + b.brokerageSplitAmount, 0),
    totalAgentCommission: breakdowns.reduce((sum, b) => sum + b.agentNetCommission, 0),
    totalDeductions: breakdowns.reduce((sum, b) => sum + b.totalDeductions, 0),
    totalRoyalties: breakdowns.reduce((sum, b) => sum + b.royaltyAmount, 0),
    uniqueAgents: new Set(breakdowns.map(b => b.agentName)).size,
  };
}

/**
 * Generate HTML for PDF report (to be converted to PDF via manus-md-to-pdf or similar)
 */
export function generateReportHTML(
  data: PDFReportData,
  options: PDFReportOptions = {}
): string {
  const {
    includeTransactionDetails = true,
    includeAgentSummaries = true,
    groupByAgent = true,
    pageSize = 'letter',
  } = options;

  const reportTitle = data.reportTitle || 'Commission Report';
  const brokerageName = data.brokerageName || 'Brokerage';
  const generatedDate = formatDate(data.generatedDate);

  const totals = calculateReportTotals(data.breakdowns);
  const groupedBreakdowns = groupByAgent
    ? groupBreakdownsByAgent(data.breakdowns)
    : new Map([[null, data.breakdowns]]);

  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reportTitle}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #333;
      line-height: 1.6;
      background: white;
    }
    
    .page {
      page-break-after: always;
      padding: 40px;
      max-width: 8.5in;
      margin: 0 auto;
    }
    
    .page:last-child {
      page-break-after: avoid;
    }
    
    /* Cover Page */
    .cover-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      text-align: center;
      border-bottom: 3px solid #0066cc;
    }
    
    .cover-page h1 {
      font-size: 48px;
      color: #0066cc;
      margin-bottom: 20px;
      font-weight: 700;
    }
    
    .cover-page .subtitle {
      font-size: 24px;
      color: #666;
      margin-bottom: 40px;
    }
    
    .cover-page .meta {
      margin-top: 60px;
      font-size: 14px;
      color: #999;
    }
    
    .cover-page .meta-item {
      margin: 10px 0;
    }
    
    /* Headers and Footers */
    h1 {
      font-size: 32px;
      color: #0066cc;
      margin-bottom: 20px;
      border-bottom: 2px solid #0066cc;
      padding-bottom: 10px;
    }
    
    h2 {
      font-size: 24px;
      color: #333;
      margin-top: 30px;
      margin-bottom: 15px;
      border-left: 4px solid #0066cc;
      padding-left: 10px;
    }
    
    h3 {
      font-size: 18px;
      color: #555;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    
    /* Summary Boxes */
    .summary-box {
      background: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 20px;
      margin: 20px 0;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin: 20px 0;
    }
    
    .summary-item {
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 15px;
      text-align: center;
    }
    
    .summary-item .label {
      font-size: 12px;
      color: #999;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    
    .summary-item .value {
      font-size: 20px;
      font-weight: 700;
      color: #0066cc;
    }
    
    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 12px;
    }
    
    thead {
      background: #0066cc;
      color: white;
    }
    
    th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border: 1px solid #0066cc;
    }
    
    td {
      padding: 10px 12px;
      border: 1px solid #ddd;
    }
    
    tbody tr:nth-child(even) {
      background: #f9f9f9;
    }
    
    tbody tr:hover {
      background: #f0f0f0;
    }
    
    .text-right {
      text-align: right;
    }
    
    .text-center {
      text-align: center;
    }
    
    .currency {
      font-family: 'Courier New', monospace;
      font-weight: 600;
    }
    
    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .status-precap {
      background: #e3f2fd;
      color: #1976d2;
    }
    
    .status-postcap {
      background: #ffebee;
      color: #c62828;
    }
    
    .status-mixed {
      background: #fff3e0;
      color: #e65100;
    }
    
    /* Agent Section */
    .agent-section {
      page-break-inside: avoid;
      margin: 30px 0;
      border-left: 4px solid #0066cc;
      padding-left: 15px;
    }
    
    .agent-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 15px;
    }
    
    .agent-header h3 {
      margin: 0;
      color: #0066cc;
    }
    
    .agent-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 15px;
      font-size: 11px;
    }
    
    .agent-stat {
      background: #f5f5f5;
      padding: 8px;
      border-radius: 3px;
    }
    
    .agent-stat .label {
      color: #999;
      font-size: 10px;
      text-transform: uppercase;
    }
    
    .agent-stat .value {
      font-weight: 700;
      color: #0066cc;
      font-size: 13px;
    }
    
    /* Footer */
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 11px;
      color: #999;
      text-align: center;
    }
    
    .footer-item {
      margin: 5px 0;
    }
    
    /* Page Break */
    .page-break {
      page-break-after: always;
    }
  </style>
</head>
<body>
`;

  // Cover Page
  html += `
  <div class="page cover-page">
    <h1>${reportTitle}</h1>
    <div class="subtitle">${brokerageName}</div>
    <div class="meta">
      <div class="meta-item">Generated on ${generatedDate}</div>
      <div class="meta-item">Total Transactions: ${totals.totalTransactions}</div>
      <div class="meta-item">Agents: ${totals.uniqueAgents}</div>
    </div>
  </div>
`;

  // Executive Summary Page
  html += `
  <div class="page">
    <h1>Executive Summary</h1>
    
    <div class="summary-grid">
      <div class="summary-item">
        <div class="label">Total Transactions</div>
        <div class="value">${totals.totalTransactions}</div>
      </div>
      <div class="summary-item">
        <div class="label">Total GCI</div>
        <div class="value">${formatCurrency(totals.totalGCI)}</div>
      </div>
      <div class="summary-item">
        <div class="label">Unique Agents</div>
        <div class="value">${totals.uniqueAgents}</div>
      </div>
      <div class="summary-item">
        <div class="label">Company Dollar</div>
        <div class="value">${formatCurrency(totals.totalCompanyDollar)}</div>
      </div>
      <div class="summary-item">
        <div class="label">Agent Commission</div>
        <div class="value">${formatCurrency(totals.totalAgentCommission)}</div>
      </div>
      <div class="summary-item">
        <div class="label">Total Deductions</div>
        <div class="value">${formatCurrency(totals.totalDeductions)}</div>
      </div>
    </div>
    
    <div class="summary-box">
      <h3>Report Details</h3>
      <table>
        <tr>
          <td><strong>Report Title:</strong></td>
          <td>${reportTitle}</td>
        </tr>
        <tr>
          <td><strong>Brokerage:</strong></td>
          <td>${brokerageName}</td>
        </tr>
        <tr>
          <td><strong>Generated:</strong></td>
          <td>${generatedDate}</td>
        </tr>
        <tr>
          <td><strong>Total Royalties:</strong></td>
          <td>${formatCurrency(totals.totalRoyalties)}</td>
        </tr>
      </table>
    </div>
  </div>
`;

  // Agent Summaries
  if (includeAgentSummaries && data.ytdSummaries.length > 0) {
    html += `
  <div class="page">
    <h1>Agent Summaries</h1>
    
    <table>
      <thead>
        <tr>
          <th>Agent Name</th>
          <th class="text-right">YTD Company $</th>
          <th class="text-right">YTD Commission</th>
          <th class="text-right">Cap Amount</th>
          <th class="text-right">% to Cap</th>
          <th class="text-center">Status</th>
        </tr>
      </thead>
      <tbody>
`;

    data.ytdSummaries.forEach(summary => {
      const percentToCap = summary.capAmount > 0 
        ? Math.min(100, (summary.ytdCompanyDollar / summary.capAmount) * 100)
        : 100;
      
      html += `
        <tr>
          <td><strong>${summary.agentName}</strong></td>
          <td class="text-right currency">${formatCurrency(summary.ytdCompanyDollar)}</td>
          <td class="text-right currency">${formatCurrency(summary.ytdNetCommission)}</td>
          <td class="text-right currency">${formatCurrency(summary.capAmount)}</td>
          <td class="text-right">${formatPercentage(percentToCap)}</td>
          <td class="text-center">
            <span class="status-badge ${summary.isCapped ? 'status-postcap' : 'status-precap'}">
              ${summary.isCapped ? 'Capped' : 'Active'}
            </span>
          </td>
        </tr>
`;
    });

    html += `
      </tbody>
    </table>
  </div>
`;
  }

  // Transaction Details by Agent
  if (includeTransactionDetails && groupByAgent) {
    let pageCount = 0;
    groupedBreakdowns.forEach((breakdowns, agentName) => {
      if (!agentName) return; // Skip null agent name
      
      const agentTotals = calculateAgentTotals(breakdowns);
      const agentSummary = data.ytdSummaries.find(s => s.agentName === agentName);
      
      if (pageCount > 0) {
        html += '<div class="page-break"></div>';
      }
      
      html += `
  <div class="page">
    <div class="agent-section">
      <div class="agent-header">
        <h2>${agentName}</h2>
        <span style="color: #999; font-size: 12px;">${agentTotals.transactionCount} transactions</span>
      </div>
      
      <div class="agent-stats">
        <div class="agent-stat">
          <div class="label">Total GCI</div>
          <div class="value">${formatCurrency(agentTotals.totalGCI)}</div>
        </div>
        <div class="agent-stat">
          <div class="label">Company $</div>
          <div class="value">${formatCurrency(agentTotals.totalCompanyDollar)}</div>
        </div>
        <div class="agent-stat">
          <div class="label">Commission</div>
          <div class="value">${formatCurrency(agentTotals.totalAgentCommission)}</div>
        </div>
        <div class="agent-stat">
          <div class="label">Deductions</div>
          <div class="value">${formatCurrency(agentTotals.totalDeductions)}</div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Loop</th>
            <th>Closing Date</th>
            <th class="text-right">GCI</th>
            <th class="text-right">Company $</th>
            <th class="text-right">Commission</th>
            <th class="text-center">Status</th>
          </tr>
        </thead>
        <tbody>
`;
      
      breakdowns.forEach(breakdown => {
        html += `
          <tr>
            <td>${breakdown.loopName}</td>
            <td>${formatDate(breakdown.closingDate)}</td>
            <td class="text-right currency">${formatCurrency(breakdown.grossCommissionIncome)}</td>
            <td class="text-right currency">${formatCurrency(breakdown.brokerageSplitAmount)}</td>
            <td class="text-right currency">${formatCurrency(breakdown.agentNetCommission)}</td>
            <td class="text-center">
              <span class="status-badge status-${breakdown.splitType}">
                ${breakdown.splitType}
              </span>
            </td>
          </tr>
`;
      });
      
      html += `
        </tbody>
      </table>
    </div>
    
    <div class="footer">
      <div class="footer-item">Page generated on ${generatedDate}</div>
      <div class="footer-item">This is an automated report generated by Dotloop Reporting Tool</div>
    </div>
  </div>
`;
      
      pageCount++;
    });
  }

  // Close HTML
  html += `
</body>
</html>
`;

  return html;
}
