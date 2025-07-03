import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn {
  key: string;
  header: string;
  width?: number;
}

export interface ExportData {
  [key: string]: any;
}

// CSV Export Functions
export const exportToCSV = (data: ExportData[], filename: string, columns: ExportColumn[]) => {
  // Create CSV header
  const headers = columns.map(col => col.header);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      columns.map(col => {
        const value = row[col.key];
        // Handle commas and quotes in CSV
        const stringValue = String(value || '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// PDF Export Functions
export const exportToPDF = (
  data: ExportData[], 
  filename: string, 
  columns: ExportColumn[],
  title: string,
  subtitle?: string
) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text(title, 14, 20);
  
  // Add subtitle if provided
  if (subtitle) {
    doc.setFontSize(12);
    doc.text(subtitle, 14, 30);
  }
  
  // Add timestamp
  doc.setFontSize(10);
  const timestamp = new Date().toLocaleString();
  doc.text(`Generated: ${timestamp}`, 14, subtitle ? 40 : 30);
  
  // Prepare table data
  const headers = columns.map(col => col.header);
  const rows = data.map(row => 
    columns.map(col => String(row[col.key] || ''))
  );
  
  // Add table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: subtitle ? 50 : 40,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [46, 155, 95], // Tea green color
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    columnStyles: columns.reduce((acc, col, index) => {
      if (col.width) {
        acc[index] = { cellWidth: col.width };
      }
      return acc;
    }, {} as any),
  });
  
  // Save the PDF
  doc.save(`${filename}.pdf`);
};

// Utility functions for formatting data before export
export const formatCurrencyForExport = (value: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'JPY' ? 'USD' : currency,
  }).format(value);
};

export const formatDateForExport = (date: Date | string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatWeightForExport = (weight: number) => {
  return `${weight.toLocaleString()} kg`;
};

export const formatPercentageForExport = (value: number) => {
  return `${value.toFixed(1)}%`;
};

// Export statistics summary as PDF
export const exportStatsToPDF = (
  stats: Record<string, any>,
  filename: string,
  title: string
) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text(title, 14, 20);
  
  // Add timestamp
  doc.setFontSize(10);
  const timestamp = new Date().toLocaleString();
  doc.text(`Generated: ${timestamp}`, 14, 30);
  
  // Add statistics
  doc.setFontSize(12);
  let yPosition = 50;
  
  Object.entries(stats).forEach(([key, value]) => {
    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const formattedValue = typeof value === 'number' && key.includes('value') 
      ? formatCurrencyForExport(value)
      : String(value);
    
    doc.text(`${formattedKey}: ${formattedValue}`, 14, yPosition);
    yPosition += 10;
    
    // Start new page if needed
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }
  });
  
  doc.save(`${filename}.pdf`);
};

// Export chart data for analysis
export const exportChartDataToCSV = (
  chartData: any[],
  filename: string
) => {
  if (!chartData || chartData.length === 0) {
    alert('No chart data available for export');
    return;
  }
  
  // Get all unique keys from chart data
  const allKeys = Array.from(
    new Set(chartData.flatMap(item => Object.keys(item)))
  );
  
  const columns: ExportColumn[] = allKeys.map(key => ({
    key,
    header: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }));
  
  exportToCSV(chartData, `${filename}_chart_data`, columns);
};