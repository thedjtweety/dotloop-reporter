/**
 * Export Utilities for Drill-Down Data
 * Provides CSV, Excel, and print functionality for transaction data
 */

import { DotloopRecord } from './csvParser';
import * as XLSX from 'xlsx';

interface ExportOptions {
  title: string;
  records: DotloopRecord[];
  filters?: {
    type: string;
    value: string;
  };
  dateGenerated?: Date;
}

/**
 * Generate CSV content from transaction records
 */
export function generateCSVContent(options: ExportOptions): string {
  const { title, records, filters, dateGenerated } = options;
  const now = dateGenerated || new Date();
  
  // Header section
  let csv = `"${title}"\n`;
  csv += `"Generated: ${now.toLocaleString()}"\n`;
  
  if (filters) {
    csv += `"Filter: ${filters.type} = ${filters.value}"\n`;
  }
  
  csv += `"Total Records: ${records.length}"\n\n`;
  
  // Column headers
  const headers = [
    'Status',
    'Property Address',
    'City',
    'State',
    'Agent Name',
    'List Price',
    'Sold Price',
    'Commission',
    'Commission Rate',
    'Days to Close',
    'Lead Source',
    'Property Type',
    'Transaction Type',
    'Close Date',
    'Notes'
  ];
  
  csv += headers.map(h => `"${h}"`).join(',') + '\n';
  
  // Data rows
  records.forEach(record => {
    const row = [
      record.status || '',
      record.address || '',
      record.city || '',
      record.state || '',
      record.agentName || '',
      record.listPrice || '',
      record.soldPrice || '',
      record.commission || '',
      record.commissionRate || '',
      record.daysToClose || '',
      record.leadSource || '',
      record.propertyType || '',
      record.transactionType || '',
      record.closeDate || '',
      record.notes || ''
    ];
    
    csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
  });
  
  return csv;
}

/**
 * Export data as CSV file
 */
export function exportAsCSV(options: ExportOptions): void {
  const csv = generateCSVContent(options);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const filename = generateFilename(options.title, 'csv');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export data as Excel file
 */
export function exportAsExcel(options: ExportOptions): void {
  const { title, records, filters, dateGenerated } = options;
  const now = dateGenerated || new Date();
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Prepare data with header info
  const headerData = [
    [title],
    [`Generated: ${now.toLocaleString()}`],
    filters ? [`Filter: ${filters.type} = ${filters.value}`] : [],
    [`Total Records: ${records.length}`],
    []
  ];
  
  const headers = [
    'Status',
    'Property Address',
    'City',
    'State',
    'Agent Name',
    'List Price',
    'Sold Price',
    'Commission',
    'Commission Rate',
    'Days to Close',
    'Lead Source',
    'Property Type',
    'Transaction Type',
    'Close Date',
    'Notes'
  ];
  
  const data = records.map(record => [
    record.status || '',
    record.address || '',
    record.city || '',
    record.state || '',
    record.agentName || '',
    record.listPrice || '',
    record.soldPrice || '',
    record.commission || '',
    record.commissionRate || '',
    record.daysToClose || '',
    record.leadSource || '',
    record.propertyType || '',
    record.transactionType || '',
    record.closeDate || '',
    record.notes || ''
  ]);
  
  // Combine header and data
  const wsData = [...headerData, headers, ...data];
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 12 },  // Status
    { wch: 25 },  // Property Address
    { wch: 15 },  // City
    { wch: 8 },   // State
    { wch: 15 },  // Agent Name
    { wch: 12 },  // List Price
    { wch: 12 },  // Sold Price
    { wch: 12 },  // Commission
    { wch: 15 },  // Commission Rate
    { wch: 12 },  // Days to Close
    { wch: 15 },  // Lead Source
    { wch: 15 },  // Property Type
    { wch: 15 },  // Transaction Type
    { wch: 12 },  // Close Date
    { wch: 20 }   // Notes
  ];
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
  
  // Generate filename and download
  const filename = generateFilename(options.title, 'xlsx');
  XLSX.writeFile(wb, filename);
}

/**
 * Generate filename with context and date
 */
export function generateFilename(title: string, extension: string): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Clean title for filename (remove special characters)
  const cleanTitle = title
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
  
  return `${cleanTitle}-${dateStr}.${extension}`;
}

/**
 * Prepare data for printing
 */
export function generatePrintContent(options: ExportOptions): string {
  const { title, records, filters, dateGenerated } = options;
  const now = dateGenerated || new Date();
  
  let html = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          .header {
            margin-bottom: 30px;
            border-bottom: 2px solid #1e3a5f;
            padding-bottom: 15px;
          }
          .header h1 {
            margin: 0 0 10px 0;
            color: #1e3a5f;
            font-size: 24px;
          }
          .header-info {
            font-size: 12px;
            color: #666;
            margin: 5px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th {
            background-color: #1e3a5f;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #ddd;
          }
          td {
            padding: 10px 12px;
            border: 1px solid #ddd;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          tr:hover {
            background-color: #f0f0f0;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #ddd;
            padding-top: 15px;
          }
          @media print {
            body {
              margin: 0;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <div class="header-info">Generated: ${now.toLocaleString()}</div>
          ${filters ? `<div class="header-info">Filter: ${filters.type} = ${filters.value}</div>` : ''}
          <div class="header-info">Total Records: ${records.length}</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Property Address</th>
              <th>City</th>
              <th>State</th>
              <th>Agent Name</th>
              <th>List Price</th>
              <th>Sold Price</th>
              <th>Commission</th>
              <th>Commission Rate</th>
              <th>Days to Close</th>
              <th>Lead Source</th>
              <th>Property Type</th>
              <th>Transaction Type</th>
              <th>Close Date</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${records.map(record => `
              <tr>
                <td>${record.status || ''}</td>
                <td>${record.address || ''}</td>
                <td>${record.city || ''}</td>
                <td>${record.state || ''}</td>
                <td>${record.agentName || ''}</td>
                <td>${record.listPrice || ''}</td>
                <td>${record.soldPrice || ''}</td>
                <td>${record.commission || ''}</td>
                <td>${record.commissionRate || ''}</td>
                <td>${record.daysToClose || ''}</td>
                <td>${record.leadSource || ''}</td>
                <td>${record.propertyType || ''}</td>
                <td>${record.transactionType || ''}</td>
                <td>${record.closeDate || ''}</td>
                <td>${record.notes || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>This report was generated by Dotloop Reporting Tool</p>
        </div>
      </body>
    </html>
  `;
  
  return html;
}

/**
 * Open print dialog
 */
export function openPrintDialog(options: ExportOptions): void {
  const html = generatePrintContent(options);
  const printWindow = window.open('', '', 'height=600,width=800');
  
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}


/**
 * Forecast Export Functions
 * Provides PDF and CSV export for forecasted deals
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ForecastedDeal } from './projectionUtils';

/**
 * Generate a PDF export of forecasted deals
 */
export function generateForecastPDF(
  timeframe: number,
  forecastedDeals: ForecastedDeal[],
  summary: {
    totalDeals: number;
    avgProbability: number;
    projectedCommission: number;
    pipelineCount: number;
  }
) {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text(`Forecasted Deals - ${timeframe} Days`, 14, 15);
  
  // Date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 25);
  doc.setTextColor(0);
  
  // Summary section
  doc.setFontSize(12);
  doc.text('Summary', 14, 35);
  
  const summaryData = [
    ['Metric', 'Value'],
    ['Projected Deals', summary.totalDeals.toString()],
    ['Pipeline Count', summary.pipelineCount.toString()],
    ['Avg Probability', `${(summary.avgProbability * 100).toFixed(1)}%`],
    ['Projected Commission', `$${summary.projectedCommission.toLocaleString('en-US', { maximumFractionDigits: 2 })}`],
  ];
  
  autoTable(doc, {
    head: [summaryData[0]],
    body: summaryData.slice(1),
    startY: 40,
    margin: 14,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 95], textColor: 255, fontStyle: 'bold' },
    bodyStyles: { textColor: 0 },
    alternateRowStyles: { fillColor: [240, 240, 240] },
  });
  
  // Get current Y position
  let yPosition = (doc as any).lastAutoTable.finalY + 10;
  
  // Deals section
  doc.setFontSize(12);
  doc.text('Forecasted Deals', 14, yPosition);
  yPosition += 8;
  
  const dealsData = forecastedDeals.map(deal => [
    deal.address,
    deal.agent || 'Unknown',
    `$${(deal.listPrice || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
    `${(deal.probability * 100).toFixed(0)}%`,
    `$${(deal.commission || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
    deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : 'N/A',
  ]);
  
  autoTable(doc, {
    head: [['Address', 'Agent', 'List Price', 'Probability', 'Commission', 'Expected Close']],
    body: dealsData,
    startY: yPosition,
    margin: 14,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 95], textColor: 255, fontStyle: 'bold' },
    bodyStyles: { textColor: 0, fontSize: 9 },
    alternateRowStyles: { fillColor: [240, 240, 240] },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 25 },
      2: { cellWidth: 25 },
      3: { cellWidth: 20 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 },
    },
  });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('This is a forecast based on historical patterns and current pipeline data.', 14, doc.internal.pageSize.getHeight() - 10);
  
  return doc;
}

/**
 * Generate a CSV export of forecasted deals
 */
export function generateForecastCSV(
  timeframe: number,
  forecastedDeals: ForecastedDeal[],
  summary: {
    totalDeals: number;
    avgProbability: number;
    projectedCommission: number;
    pipelineCount: number;
  }
): string {
  const rows: string[] = [];
  
  // Header
  rows.push('Forecasted Deals Export');
  rows.push(`Timeframe: ${timeframe} Days`);
  rows.push(`Generated: ${new Date().toLocaleString()}`);
  rows.push('');
  
  // Summary
  rows.push('SUMMARY');
  rows.push(`Projected Deals,${summary.totalDeals}`);
  rows.push(`Pipeline Count,${summary.pipelineCount}`);
  rows.push(`Average Probability,${(summary.avgProbability * 100).toFixed(1)}%`);
  rows.push(`Projected Commission,$${summary.projectedCommission.toLocaleString('en-US', { maximumFractionDigits: 2 })}`);
  rows.push('');
  
  // Deals header
  rows.push('FORECASTED DEALS');
  rows.push('Address,Agent,List Price,Probability,Commission,Expected Close Date,Days in Contract');
  
  // Deals data
  forecastedDeals.forEach(deal => {
    const row = [
      `"${deal.address}"`,
      deal.agent || 'Unknown',
      deal.listPrice || 0,
      `${(deal.probability * 100).toFixed(0)}%`,
      deal.commission || 0,
      deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : 'N/A',
      deal.daysInContract || 0,
    ];
    rows.push(row.join(','));
  });
  
  return rows.join('\n');
}

/**
 * Export forecast as PDF file
 */
export function exportForecastAsPDF(
  timeframe: number,
  forecastedDeals: ForecastedDeal[],
  summary: {
    totalDeals: number;
    avgProbability: number;
    projectedCommission: number;
    pipelineCount: number;
  }
) {
  const doc = generateForecastPDF(timeframe, forecastedDeals, summary);
  const filename = `forecast-${timeframe}days-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

/**
 * Export forecast as CSV file
 */
export function exportForecastAsCSV(
  timeframe: number,
  forecastedDeals: ForecastedDeal[],
  summary: {
    totalDeals: number;
    avgProbability: number;
    projectedCommission: number;
    pipelineCount: number;
  }
) {
  const csv = generateForecastCSV(timeframe, forecastedDeals, summary);
  const filename = `forecast-${timeframe}days-${new Date().toISOString().split('T')[0]}.csv`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
