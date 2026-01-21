/**
 * Export Utilities for Agent Performance Reports
 * Handles PDF and Excel export functionality for individual agent reports
 */

import { AgentMetrics } from './csvParser';

/**
 * Export agent report as CSV (Excel compatible)
 */
export function exportAgentAsCSV(agent: AgentMetrics): void {
  const csvContent = [
    ['Agent Performance Report'],
    ['Generated:', new Date().toLocaleDateString()],
    [],
    ['Agent Name', agent.agentName],
    [],
    ['Performance Metrics'],
    ['Total Transactions', agent.totalTransactions.toString()],
    ['Closed Deals', agent.closedDeals.toString()],
    ['Closing Rate (%)', agent.closingRate.toFixed(2)],
    ['Active Listings', agent.activeListings.toString()],
    ['Under Contract', agent.underContract.toString()],
    [],
    ['Financial Metrics'],
    ['Total Commission', `$${agent.totalCommission.toLocaleString('en-US', { maximumFractionDigits: 2 })}`],
    ['Average Commission per Deal', `$${agent.averageCommission.toLocaleString('en-US', { maximumFractionDigits: 2 })}`],
    ['Total Sales Volume', `$${agent.totalSalesVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })}`],
    ['Average Sale Price', `$${agent.averageSalesPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}`],
    [],
    ['Efficiency Metrics'],
    ['Average Days to Close', `${agent.averageDaysToClose} days`],
  ]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, `${agent.agentName}_report.csv`);
}

/**
 * Export agent report as PDF using HTML rendering
 */
export function exportAgentAsPDF(agent: AgentMetrics): void {
  // Create HTML content for the report
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Agent Performance Report - ${agent.agentName}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 40px;
          color: #333;
          line-height: 1.6;
        }
        .header {
          border-bottom: 3px solid #1E90FF; /* Dodger Blue */
          margin-bottom: 30px;
          padding-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .header-content h1 {
          color: #1e3a5f; /* Navy */
          margin: 0 0 5px 0;
          font-size: 28px;
        }
        .header-content p {
          color: #666;
          margin: 0;
          font-size: 14px;
        }
        .logo-placeholder {
          color: #1E90FF;
          font-weight: bold;
          font-size: 24px;
        }
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .section h2 {
          color: #1e3a5f; /* Navy */
          font-size: 18px;
          border-bottom: 2px solid #1E90FF; /* Dodger Blue */
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .metric-card {
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #1E90FF; /* Dodger Blue */
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .metric-label {
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
          margin-bottom: 5px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .metric-value {
          font-size: 24px;
          color: #1e3a5f; /* Navy */
          font-weight: bold;
        }
        .metric-subtext {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 5px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          font-size: 12px;
          color: #94a3b8;
          text-align: center;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          background: white;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }
        th {
          background: #f1f5f9;
          font-weight: 600;
          color: #1e3a5f; /* Navy */
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.5px;
        }
        .highlight {
          background: #e0f2fe; /* Light Blue */
          color: #0369a1; /* Dark Blue */
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-content">
          <h1>Agent Performance Report</h1>
          <p><strong>Agent:</strong> ${agent.agentName}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
        <div class="logo-placeholder">dotloop</div>
      </div>

      <div class="section">
        <h2>Performance Overview</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Total Transactions</div>
            <div class="metric-value">${agent.totalTransactions}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Closed Deals</div>
            <div class="metric-value">${agent.closedDeals}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Closing Rate</div>
            <div class="metric-value"><span class="highlight">${agent.closingRate.toFixed(1)}%</span></div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Avg Days to Close</div>
            <div class="metric-value">${agent.averageDaysToClose}</div>
            <div class="metric-subtext">days</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Financial Performance</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Total Commission</div>
            <div class="metric-value">$${(agent.totalCommission / 1000).toFixed(1)}K</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Avg Commission per Deal</div>
            <div class="metric-value">$${(agent.averageCommission / 1000).toFixed(1)}K</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Total Sales Volume</div>
            <div class="metric-value">$${(agent.totalSalesVolume / 1000000).toFixed(2)}M</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Avg Sale Price</div>
            <div class="metric-value">$${(agent.averageSalesPrice / 1000).toFixed(0)}K</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Pipeline Status</h2>
        <table>
          <tr>
            <th>Status</th>
            <th>Count</th>
          </tr>
          <tr>
            <td>Active Listings</td>
            <td><strong>${agent.activeListings}</strong></td>
          </tr>
          <tr>
            <td>Under Contract</td>
            <td><strong>${agent.underContract}</strong></td>
          </tr>
          <tr>
            <td>Closed</td>
            <td><strong>${agent.closedDeals}</strong></td>
          </tr>
        </table>
      </div>

      <div class="footer">
        <p>This report was automatically generated from Dotloop transaction data. For questions or clarifications, please contact your broker.</p>
      </div>
    </body>
    </html>
  `;

  // Use html2pdf library approach - create a blob and download
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  
  // Create an iframe to print the HTML
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();
    
    // Wait for content to load, then print to PDF
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
        // Clean up
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 250);
    };
  }
}

/**
 * Helper function to download a file
 */
function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export all agents as a single Excel file with multiple sheets
 * (Simplified version - creates CSV with all agents)
 */
export function exportAllAgentsAsCSV(agents: AgentMetrics[]): void {
  const csvContent = [
    ['Agent Performance Report - All Agents'],
    ['Generated:', new Date().toLocaleDateString()],
    [],
    [
      'Agent Name',
      'Total Transactions',
      'Closed Deals',
      'Closing Rate (%)',
      'Total Commission',
      'Avg Commission',
      'Total Sales Volume',
      'Avg Sale Price',
      'Avg Days to Close',
      'Active Listings',
      'Under Contract',
    ],
    ...agents.map(agent => [
      agent.agentName,
      agent.totalTransactions.toString(),
      agent.closedDeals.toString(),
      agent.closingRate.toFixed(2),
      agent.totalCommission.toLocaleString('en-US', { maximumFractionDigits: 2 }),
      agent.averageCommission.toLocaleString('en-US', { maximumFractionDigits: 2 }),
      agent.totalSalesVolume.toLocaleString('en-US', { maximumFractionDigits: 0 }),
      agent.averageSalesPrice.toLocaleString('en-US', { maximumFractionDigits: 0 }),
      agent.averageDaysToClose.toString(),
      agent.activeListings.toString(),
      agent.underContract.toString(),
    ]),
  ]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, `all_agents_report_${new Date().toISOString().split('T')[0]}.csv`);
}
