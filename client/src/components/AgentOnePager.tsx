import { jsPDF } from 'jspdf';
import { AgentMetrics } from '@/lib/csvParser';
import { Button } from '@/components/ui/button';
import { FileDown, Printer } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/formatUtils';

interface AgentOnePagerProps {
  agent: AgentMetrics;
}

export default function AgentOnePager({ agent }: AgentOnePagerProps) {
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // --- Header Background ---
    doc.setFillColor(30, 144, 255); // Dodger Blue (#1E90FF)
    doc.rect(0, 0, pageWidth, 60, 'F');
    
    // --- Title & Agent Name ---
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(agent.agentName, 20, 30);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Performance Profile & 2025 Outlook', 20, 40);
    
    // --- Logo Placeholder ---
    // In a real app, we'd load the actual logo image here
    doc.setFillColor(255, 255, 255);
    doc.circle(pageWidth - 30, 30, 15, 'F');
    doc.setTextColor(30, 58, 95); // Navy
    doc.setFontSize(8);
    doc.text('dotloop', pageWidth - 38, 32);

    // --- Key Metrics Section ---
    let yPos = 80;
    
    // Helper to draw metric card
    const drawMetricCard = (x: number, y: number, title: string, value: string, subtitle: string) => {
      doc.setFillColor(248, 250, 252); // Slate 50
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.roundedRect(x, y, 50, 40, 3, 3, 'FD');
      
      doc.setTextColor(100, 116, 139); // Slate 500
      doc.setFontSize(9);
      doc.text(title, x + 5, y + 10);
      
      doc.setTextColor(30, 58, 95); // Navy
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(value, x + 5, y + 22);
      
      doc.setTextColor(30, 144, 255); // Dodger Blue
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(subtitle, x + 5, y + 32);
    };

    drawMetricCard(20, yPos, 'Total Volume', formatCurrency(agent.totalSalesVolume), 'YTD Production');
    drawMetricCard(80, yPos, 'Closed Units', formatNumber(agent.closedDeals), `${agent.activeListings} Active Listings`);
    drawMetricCard(140, yPos, 'GCI', formatCurrency(agent.totalCommission), 'Gross Commission');

    // --- Performance Breakdown ---
    yPos += 60;
    doc.setTextColor(30, 58, 95); // Navy
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Performance Breakdown', 20, yPos);
    
    yPos += 15;
    doc.setDrawColor(30, 144, 255); // Dodger Blue
    doc.setLineWidth(0.5);
    doc.line(20, yPos, pageWidth - 20, yPos);
    
    yPos += 15;
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85); // Slate 700
    
    const rowHeight = 12;
    const col1 = 20;
    const col2 = 120;
    
    doc.text(`Average Sale Price: ${formatCurrency(agent.averageSalesPrice)}`, col1, yPos);
    doc.text(`Closing Rate: ${agent.closingRate.toFixed(1)}%`, col2, yPos);
    
    yPos += rowHeight;
    doc.text(`Avg Days to Close: ${agent.averageDaysToClose} days`, col1, yPos);
    doc.text(`Buy Side: ${agent.buySidePercentage.toFixed(1)}%`, col2, yPos);
    
    yPos += rowHeight;
    doc.text(`Active Listings: ${agent.activeListings}`, col1, yPos);
    doc.text(`Sell Side: ${agent.sellSidePercentage.toFixed(1)}%`, col2, yPos);

    // --- Footer ---
    const footerY = pageHeight - 20;
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.line(20, footerY, pageWidth - 20, footerY);
    
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(`Generated on ${new Date().toLocaleDateString()} via Dotloop Reporter`, 20, footerY + 10);
    doc.text('Confidential & Proprietary', pageWidth - 60, footerY + 10);

    // Save
    doc.save(`${agent.agentName.replace(/\s+/g, '_')}_Profile.pdf`);
  };

  return (
    <Button onClick={generatePDF} variant="outline" size="sm" className="gap-2">
      <Printer className="h-4 w-4" />
      Print One-Pager
    </Button>
  );
}
