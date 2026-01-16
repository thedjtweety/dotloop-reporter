/**
 * PDF Utilities
 * 
 * Helper functions for PDF generation and download
 */

/**
 * Convert HTML string to PDF and trigger download
 * Uses browser's print-to-PDF functionality
 */
export async function downloadHTMLAsPDF(
  html: string,
  fileName: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Create a new window for printing
      const printWindow = window.open('', '', 'height=600,width=800');
      
      if (!printWindow) {
        reject(new Error('Failed to open print window'));
        return;
      }

      // Write HTML to the window
      printWindow.document.write(html);
      printWindow.document.close();

      // Wait for content to load, then print
      printWindow.onload = () => {
        // Set up print settings
        const printSettings = {
          margin: '10mm',
          paperFormat: 'A4',
          orientation: 'portrait',
        };

        // Trigger print dialog
        printWindow.print();

        // Close window after print
        setTimeout(() => {
          printWindow.close();
          resolve();
        }, 1000);
      };

      // Fallback: close window if print dialog is cancelled
      setTimeout(() => {
        try {
          if (printWindow && !printWindow.closed) {
            printWindow.close();
          }
        } catch (e) {
          // Window already closed
        }
      }, 5000);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Download HTML as a file (for debugging/alternative)
 */
export function downloadHTMLAsFile(html: string, fileName: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName.replace('.pdf', '.html'));
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Convert HTML to canvas and then to PDF image
 * Requires html2canvas library (optional)
 */
export async function htmlToCanvasPDF(
  html: string,
  fileName: string
): Promise<void> {
  try {
    // This would require importing html2canvas
    // For now, we'll use the print-to-PDF method
    await downloadHTMLAsPDF(html, fileName);
  } catch (error) {
    console.error('Failed to convert HTML to PDF:', error);
    throw error;
  }
}

/**
 * Generate a data URL from HTML for preview
 */
export function generateHTMLDataURL(html: string): string {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  return URL.createObjectURL(blob);
}

/**
 * Open HTML in a new tab for preview
 */
export function previewHTMLInNewTab(html: string, title: string = 'Preview'): Window | null {
  const printWindow = window.open('', title, 'height=600,width=800');
  
  if (!printWindow) {
    console.error('Failed to open preview window');
    return null;
  }

  printWindow.document.write(html);
  printWindow.document.close();
  
  return printWindow;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Generate a unique file name with timestamp
 */
export function generateFileName(baseName: string, extension: string = 'pdf'): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const randomId = Math.random().toString(36).substring(2, 8);
  return `${baseName}-${timestamp}-${randomId}.${extension}`;
}
