/**
 * PDF Export Utility Module
 * Handles PDF generation with charts, formatted layouts, and data visualization
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ChartData } from './csvParser';

interface PDFExportOptions {
  title: string;
  fileName: string;
  includeChart?: boolean;
  chartElement?: HTMLElement | null;
  data?: Record<string, any>;
}

/**
 * Capture a chart element as an image
 */
export async function captureChartAsImage(element: HTMLElement): Promise<string> {
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
    });
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error capturing chart:', error);
    throw new Error('Failed to capture chart image');
  }
}

/**
 * Generate a PDF report with period data and optional chart
 */
export async function generatePeriodPDF(options: PDFExportOptions): Promise<void> {
  const { title, fileName, includeChart, chartElement, data } = options;

  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Add header
    pdf.setFontSize(24);
    pdf.setTextColor(30, 58, 95);
    (pdf as any).text(title, margin, yPosition);
    yPosition += 15;

    // Add generation date
    pdf.setFontSize(10);
    pdf.setTextColor(107, 114, 128);
    (pdf as any).text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
    yPosition += 10;

    // Add horizontal line
    pdf.setDrawColor(229, 231, 235);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // Add period information
    if (data) {
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);

      if (data.period) {
        (pdf as any).text(`Period: ${data.period}`, margin, yPosition);
        yPosition += 8;
      }

      if (data.value) {
        (pdf as any).text(`Sales Volume: $${(data.value / 1000000).toFixed(2)}M`, margin, yPosition);
        yPosition += 8;
      }

      if (data.movingAverage) {
        (pdf as any).text(
          `3-Month Moving Average: $${(data.movingAverage / 1000000).toFixed(2)}M`,
          margin,
          yPosition
        );
        yPosition += 8;
      }

      if (data.summary) {
        yPosition += 5;
        pdf.setFontSize(11);
        (pdf as any).setFont(undefined, 'bold');
        (pdf as any).text('Summary:', margin, yPosition);
        yPosition += 7;

        pdf.setFontSize(10);
        (pdf as any).setFont(undefined, 'normal');
        const summaryLines = pdf.splitTextToSize(data.summary, contentWidth);
        (pdf as any).text(summaryLines, margin, yPosition);
        yPosition += summaryLines.length * 5 + 5;
      }
    }

    // Add chart if available
    if (includeChart && chartElement) {
      try {
        if (yPosition > pageHeight - 100) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.setFontSize(12);
        (pdf as any).setFont(undefined, 'bold');
        pdf.setTextColor(0, 0, 0);
        (pdf as any).text('Sales Timeline Chart', margin, yPosition);
        yPosition += 10;

        const chartImage = await captureChartAsImage(chartElement);
        const chartWidth = contentWidth;
        const chartHeight = (chartWidth * 9) / 16;

        if (yPosition + chartHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.addImage(chartImage, 'PNG', margin, yPosition, chartWidth, chartHeight);
        yPosition += chartHeight + 10;
      } catch (error) {
        console.error('Error adding chart to PDF:', error);
      }
    }

    // Add breakdown section if data provided
    if (data && data.breakdowns) {
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFontSize(12);
      (pdf as any).setFont(undefined, 'bold');
      pdf.setTextColor(0, 0, 0);
      (pdf as any).text('Transaction Breakdown', margin, yPosition);
      yPosition += 10;

      const breakdowns = data.breakdowns;

      // By Agent
      if (breakdowns.byAgent && Object.keys(breakdowns.byAgent).length > 0) {
        pdf.setFontSize(10);
        (pdf as any).setFont(undefined, 'bold');
        pdf.text('By Agent:', margin, yPosition);
        yPosition += 6;

        pdf.setFontSize(9);
        (pdf as any).setFont(undefined, 'normal');
        Object.entries(breakdowns.byAgent)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, 5)
          .forEach(([agent, count]) => {
            pdf.text(`  • ${agent}: ${count} deals`, margin + 5, yPosition);
            yPosition += 5;
            if (yPosition > pageHeight - margin) {
              pdf.addPage();
              yPosition = margin;
            }
          });

        yPosition += 3;
      }

      // By Property Type
      if (breakdowns.byPropertyType && Object.keys(breakdowns.byPropertyType).length > 0) {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.setFontSize(10);
        (pdf as any).setFont(undefined, 'bold');
        pdf.text('By Property Type:', margin, yPosition);
        yPosition += 6;

        pdf.setFontSize(9);
        (pdf as any).setFont(undefined, 'normal');
        Object.entries(breakdowns.byPropertyType)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, 5)
          .forEach(([type, count]) => {
            pdf.text(`  • ${type}: ${count} deals`, margin + 5, yPosition);
            yPosition += 5;
            if (yPosition > pageHeight - margin) {
              pdf.addPage();
              yPosition = margin;
            }
          });

        yPosition += 3;
      }

      // By Status
      if (breakdowns.byStatus && Object.keys(breakdowns.byStatus).length > 0) {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.setFontSize(10);
        (pdf as any).setFont(undefined, 'bold');
        pdf.text('By Status:', margin, yPosition);
        yPosition += 6;

        pdf.setFontSize(9);
        (pdf as any).setFont(undefined, 'normal');
        Object.entries(breakdowns.byStatus)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, 5)
          .forEach(([status, count]) => {
            pdf.text(`  • ${status}: ${count} deals`, margin + 5, yPosition);
            yPosition += 5;
            if (yPosition > pageHeight - margin) {
              pdf.addPage();
              yPosition = margin;
            }
          });
      }
    }

    // Add footer on each page
    const totalPages = (pdf as any).internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8);
    }

    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
}

/**
 * Generate a comparison PDF for two periods
 */
export async function generateComparisonPDF(
  period1: any,
  period2: any,
  fileName: string
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // Title
  pdf.setFontSize(24);
  pdf.setTextColor(30, 58, 95);
  (pdf as any).text('Period Comparison Report', margin, yPosition);
  yPosition += 15;

  // Date
  pdf.setFontSize(10);
  pdf.setTextColor(107, 114, 128);
  (pdf as any).text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
  yPosition += 10;

  // Horizontal line
  pdf.setDrawColor(229, 231, 235);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  // Comparison data
  pdf.setFontSize(12);
  (pdf as any).setFont(undefined, 'bold');
  pdf.setTextColor(0, 0, 0);

  // Period 1
  (pdf as any).text(`Period 1: ${period1.label}`, margin, yPosition);
  yPosition += 7;
  pdf.setFontSize(10);
  (pdf as any).setFont(undefined, 'normal');
  (pdf as any).text(`Sales Volume: $${(period1.value / 1000000).toFixed(2)}M`, margin + 5, yPosition);
  yPosition += 7;

  // Period 2
  pdf.setFontSize(12);
  (pdf as any).setFont(undefined, 'bold');
  (pdf as any).text(`Period 2: ${period2.label}`, margin, yPosition);
  yPosition += 7;
  pdf.setFontSize(10);
  (pdf as any).setFont(undefined, 'normal');
  (pdf as any).text(`Sales Volume: $${(period2.value / 1000000).toFixed(2)}M`, margin + 5, yPosition);
  yPosition += 10;

  // Change calculation
  const change = ((period1.value - period2.value) / period2.value) * 100;
  const changePercent = Math.abs(change).toFixed(1);
  const isIncrease = change >= 0;

  pdf.setFontSize(12);
  (pdf as any).setFont(undefined, 'bold');
  const colorValues = isIncrease ? [16, 185, 129] : [249, 115, 22];
  pdf.setTextColor(colorValues[0], colorValues[1], colorValues[2]);
  (pdf as any).text(`Change: ${isIncrease ? '+' : '-'}${changePercent}%`, margin, yPosition);
  yPosition += 10;

  // Absolute difference
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  (pdf as any).setFont(undefined, 'normal');
  const diff = Math.abs((period1.value - period2.value) / 1000000).toFixed(2);
  (pdf as any).text(`Absolute Difference: $${diff}M`, margin, yPosition);
  yPosition += 10;

  // Key insights
  pdf.setFontSize(11);
  (pdf as any).setFont(undefined, 'bold');
  (pdf as any).text('Key Insights:', margin, yPosition);
  yPosition += 7;

  pdf.setFontSize(10);
  (pdf as any).setFont(undefined, 'normal');
  const insights = [
    `${period1.label} had $${(period1.value / 1000000).toFixed(1)}M in transactions`,
    `${period2.label} had $${(period2.value / 1000000).toFixed(1)}M in transactions`,
    `This represents a ${isIncrease ? 'growth' : 'decline'} of ${changePercent}%`,
  ];

  insights.forEach((insight) => {
    const lines = pdf.splitTextToSize(insight, pageWidth - 30);
    (pdf as any).text(lines, margin + 5, yPosition);
    yPosition += lines.length * 5 + 2;
  });

  pdf.save(fileName);
}

/**
 * Export timeline data as formatted PDF
 */
export async function exportTimelineDataPDF(
  timelineData: ChartData[],
  fileName: string
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // Title
  pdf.setFontSize(20);
  pdf.setTextColor(30, 58, 95);
  (pdf as any).text('Sales Timeline Data Export', margin, yPosition);
  yPosition += 12;

  // Date
  pdf.setFontSize(10);
  pdf.setTextColor(107, 114, 128);
  (pdf as any).text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
  yPosition += 8;

  // Horizontal line
  pdf.setDrawColor(229, 231, 235);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  // Table headers
  pdf.setFontSize(10);
  (pdf as any).setFont(undefined, 'bold');
  pdf.setTextColor(0, 0, 0);

  const colWidths = [50, 40, 50];
  const headers = ['Period', 'Sales Volume', 'Moving Average'];
  let xPos = margin;

  headers.forEach((header, i) => {
    (pdf as any).text(header, xPos, yPosition);
    xPos += colWidths[i];
  });

  yPosition += 8;

  // Table data
  (pdf as any).setFont(undefined, 'normal');
  pdf.setFontSize(9);

  timelineData.forEach((row) => {
    if (yPosition > pageHeight - margin - 10) {
      pdf.addPage();
      yPosition = margin;

      // Repeat headers on new page
      (pdf as any).setFont(undefined, 'bold');
      pdf.setFontSize(10);
      xPos = margin;
      headers.forEach((header, i) => {
        (pdf as any).text(header, xPos, yPosition);
        xPos += colWidths[i];
      });
      yPosition += 8;
      (pdf as any).setFont(undefined, 'normal');
      pdf.setFontSize(9);
    }

    xPos = margin;
    (pdf as any).text(row.label, xPos, yPosition);
    xPos += colWidths[0];

    const volText = `$${(row.value / 1000000).toFixed(2)}M`;
    (pdf as any).text(volText, xPos, yPosition);
    xPos += colWidths[1];

    const avgText = `$${(row.movingAverage ? row.movingAverage / 1000000 : 0).toFixed(2)}M`;
    (pdf as any).text(avgText, xPos, yPosition);

    yPosition += 7;
  });

  pdf.save(fileName);
}
