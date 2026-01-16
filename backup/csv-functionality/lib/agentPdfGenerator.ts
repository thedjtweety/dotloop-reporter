/**
 * Agent Report PDF Generator
 * Creates professional PDF reports with agent summaries and transaction details
 */

import { DotloopRecord } from './csvParser';

export interface AgentReportOptions {
  agentName: string;
  startDate?: string;
  endDate?: string;
  includeTransactions?: boolean;
  includeCharts?: boolean;
  brokerageName?: string;
  generatedDate?: string;
}

export interface AgentSummary {
  agentName: string;
  totalTransactions: number;
  totalGCI: number;
  totalVolume: number;
  avgTransactionValue: number;
  avgCommission: number;
  closedDeals: number;
  activeListings: number;
  underContract: number;
  topPropertyType: string;
  topCity: string;
  topState: string;
  closingRate: number;
  daysToClose: number;
}

export function calculateAgentSummary(
  records: DotloopRecord[],
  agentName: string,
  startDate?: string,
  endDate?: string
): AgentSummary {
  const agentRecords = records.filter(r => r.agents === agentName);
  
  let filtered = agentRecords;
  if (startDate) {
    filtered = filtered.filter(r => r.closingDate >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter(r => r.closingDate <= endDate);
  }

  const totalGCI = filtered.reduce((sum, r) => sum + (r.commissionTotal || 0), 0);
  const totalVolume = filtered.reduce((sum, r) => sum + (r.salePrice || 0), 0);
  const closedDeals = filtered.filter(r => r.loopStatus === 'Closed' || r.loopStatus === 'Sold').length;
  const activeListings = filtered.filter(r => r.loopStatus === 'Active Listings' || r.loopStatus === 'Active').length;
  const underContract = filtered.filter(r => r.loopStatus === 'Under Contract' || r.loopStatus === 'Pending').length;

  // Property type distribution
  const propertyTypes: Record<string, number> = {};
  filtered.forEach(r => {
    const type = r.propertyType || 'Unknown';
    propertyTypes[type] = (propertyTypes[type] || 0) + 1;
  });
  const topPropertyType = Object.entries(propertyTypes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // City distribution
  const cities: Record<string, number> = {};
  filtered.forEach(r => {
    const city = r.city || 'Unknown';
    cities[city] = (cities[city] || 0) + 1;
  });
  const topCity = Object.entries(cities).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // State distribution
  const states: Record<string, number> = {};
  filtered.forEach(r => {
    const state = r.state || 'Unknown';
    states[state] = (states[state] || 0) + 1;
  });
  const topState = Object.entries(states).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Calculate days to close
  const daysToCloseArray = filtered
    .filter(r => r.listingDate && r.closingDate)
    .map(r => {
      const listing = new Date(r.listingDate);
      const closing = new Date(r.closingDate);
      return Math.floor((closing.getTime() - listing.getTime()) / (1000 * 60 * 60 * 24));
    });
  const daysToClose = daysToCloseArray.length > 0 
    ? Math.round(daysToCloseArray.reduce((a, b) => a + b, 0) / daysToCloseArray.length)
    : 0;

  return {
    agentName,
    totalTransactions: filtered.length,
    totalGCI,
    totalVolume,
    avgTransactionValue: filtered.length > 0 ? Math.round(totalVolume / filtered.length) : 0,
    avgCommission: filtered.length > 0 ? Math.round(totalGCI / filtered.length) : 0,
    closedDeals,
    activeListings,
    underContract,
    topPropertyType,
    topCity,
    topState,
    closingRate: filtered.length > 0 ? Math.round((closedDeals / filtered.length) * 100) : 0,
    daysToClose
  };
}

export function generateAgentPdfHtml(
  summary: AgentSummary,
  records: DotloopRecord[],
  options: AgentReportOptions
): string {
  const brokerageName = options.brokerageName || 'Real Estate Brokerage';
  const generatedDate = options.generatedDate || new Date().toLocaleDateString();
  const dateRange = options.startDate && options.endDate 
    ? `${options.startDate} to ${options.endDate}`
    : 'All Time';

  const agentRecords = records.filter(r => r.agents === summary.agentName);
  let filtered = agentRecords;
  if (options.startDate) {
    filtered = filtered.filter(r => r.closingDate >= options.startDate!);
  }
  if (options.endDate) {
    filtered = filtered.filter(r => r.closingDate <= options.endDate!);
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  let transactionRows = '';
  if (options.includeTransactions && filtered.length > 0) {
    transactionRows = filtered.map((record, index) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-size: 12px;">${index + 1}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-size: 12px;">${record.loopName || record.address}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-size: 12px;">${record.propertyType}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-size: 12px; text-align: right;">${formatCurrency(record.salePrice)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-size: 12px; text-align: right;">${formatCurrency(record.commissionTotal)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-size: 12px; text-align: center;">${record.closingDate}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-size: 12px; text-align: center;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; ${
            record.loopStatus === 'Closed' || record.loopStatus === 'Sold' 
              ? 'background-color: #d4edda; color: #155724;'
              : 'background-color: #fff3cd; color: #856404;'
          }">
            ${record.loopStatus}
          </span>
        </td>
      </tr>
    `).join('');
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f5f5f5;
          color: #333;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
          background-color: white;
          padding: 40px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #1e40af;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0 0 10px 0;
          color: #1e40af;
          font-size: 28px;
        }
        .header p {
          margin: 5px 0;
          color: #666;
          font-size: 14px;
        }
        .agent-info {
          background-color: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          border-left: 4px solid #1e40af;
        }
        .agent-info h2 {
          margin: 0 0 15px 0;
          color: #1e40af;
          font-size: 18px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          font-size: 14px;
        }
        .info-item {
          display: flex;
          justify-content: space-between;
        }
        .info-label {
          font-weight: 600;
          color: #555;
        }
        .info-value {
          color: #1e40af;
          font-weight: 500;
        }
        .summary-section {
          margin-bottom: 30px;
        }
        .summary-section h3 {
          color: #1e40af;
          font-size: 16px;
          margin: 0 0 15px 0;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 10px;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
        }
        .metric-card {
          background-color: #f9fafb;
          padding: 15px;
          border-radius: 6px;
          text-align: center;
          border-top: 3px solid #1e40af;
        }
        .metric-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 5px;
          font-weight: 500;
        }
        .metric-value {
          font-size: 20px;
          font-weight: 700;
          color: #1e40af;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        th {
          background-color: #1e40af;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          font-size: 13px;
        }
        td {
          padding: 10px;
          border-bottom: 1px solid #e0e0e0;
          font-size: 12px;
        }
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          text-align: center;
          font-size: 12px;
          color: #999;
        }
        .page-break {
          page-break-after: always;
        }
        @media print {
          body {
            background-color: white;
          }
          .container {
            box-shadow: none;
            max-width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>Agent Performance Report</h1>
          <p>${brokerageName}</p>
          <p>Generated on ${generatedDate}</p>
        </div>

        <!-- Agent Information -->
        <div class="agent-info">
          <h2>${summary.agentName}</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Report Period:</span>
              <span class="info-value">${dateRange}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Total Transactions:</span>
              <span class="info-value">${formatNumber(summary.totalTransactions)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Total Sales Volume:</span>
              <span class="info-value">${formatCurrency(summary.totalVolume)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Total GCI:</span>
              <span class="info-value">${formatCurrency(summary.totalGCI)}</span>
            </div>
          </div>
        </div>

        <!-- Performance Summary -->
        <div class="summary-section">
          <h3>Performance Summary</h3>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">Closed Deals</div>
              <div class="metric-value">${summary.closedDeals}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Active Listings</div>
              <div class="metric-value">${summary.activeListings}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Under Contract</div>
              <div class="metric-value">${summary.underContract}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Closing Rate</div>
              <div class="metric-value">${summary.closingRate}%</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Avg Days to Close</div>
              <div class="metric-value">${summary.daysToClose}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Avg Transaction Value</div>
              <div class="metric-value">${formatCurrency(summary.avgTransactionValue)}</div>
            </div>
          </div>
        </div>

        <!-- Market Analysis -->
        <div class="summary-section">
          <h3>Market Analysis</h3>
          <table>
            <tr>
              <td style="font-weight: 600; width: 25%;">Top Property Type</td>
              <td>${summary.topPropertyType}</td>
            </tr>
            <tr>
              <td style="font-weight: 600;">Top City</td>
              <td>${summary.topCity}</td>
            </tr>
            <tr>
              <td style="font-weight: 600;">Top State</td>
              <td>${summary.topState}</td>
            </tr>
            <tr>
              <td style="font-weight: 600;">Avg Commission per Transaction</td>
              <td>${formatCurrency(summary.avgCommission)}</td>
            </tr>
          </table>
        </div>

        ${options.includeTransactions && filtered.length > 0 ? `
        <!-- Transaction Details -->
        <div class="summary-section page-break">
          <h3>Transaction Details</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Property</th>
                <th>Type</th>
                <th>Sale Price</th>
                <th>Commission</th>
                <th>Closing Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${transactionRows}
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- Footer -->
        <div class="footer">
          <p>This report was automatically generated by Dotloop Reporting Tool</p>
          <p>For questions or support, contact your brokerage administrator</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}

export function downloadPdf(html: string, filename: string) {
  const element = document.createElement('div');
  element.innerHTML = html;
  document.body.appendChild(element);

  const printWindow = window.open('', '', 'width=900,height=600');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
    setTimeout(() => printWindow.close(), 250);
  }

  document.body.removeChild(element);
}
