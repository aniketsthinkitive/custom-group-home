import jsPDF from 'jspdf';
import dayjs from 'dayjs';

/**
 * Type definitions for Monthly Data Tracker HRST Form data
 */
export interface MonthlyDataTrackerHRSTFormData {
  source?: string;
  year?: string;
  heightFt?: string;
  heightIn?: string;
  weight?: string;
  bmi?: string;
  // Monthly tracking grid fields: {itemId}_{month}
  // e.g., A_Jan, A_Feb, B_Jan, etc.
  [key: string]: any; // Allow additional fields for grid cells
}

const RATING_ITEMS = [
  { id: "A", label: "Eating" },
  { id: "B", label: "Ambulation" },
  { id: "C", label: "Transfer" },
  { id: "D", label: "Toileting" },
  { id: "E", label: "Behavioral Patterns" },
  { id: "F", label: "Physical Aggressive Behaviors" },
  { id: "G", label: "Verbal Aggressive Behaviors" },
  { id: "H", label: "Socially Inappropriate/Disruptive" },
  { id: "I", label: "Resists Care" },
  { id: "J", label: "Wanders/Exit Seeking" },
  { id: "K", label: "Verbally Abusive" },
  { id: "L", label: "Physically Abusive" },
  { id: "M", label: "Self-Injurious Behaviors" },
  { id: "N", label: "Skin Integrity" },
  { id: "O", label: "Bowel Function" },
  { id: "P", label: "Nutrition" },
  { id: "Q", label: "Requirements for Licensed Interventions" },
  { id: "R", label: "Cognitive Skills for Daily Decision Making" },
  { id: "S", label: "Memory/Recall Ability" },
  { id: "T", label: "Hallucinations/Delusions" },
  { id: "U", label: "Sad, Apathetic, Anxious" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/**
 * Format a value for display in PDF
 */
function formatValue(value: any): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  return String(value);
}

/**
 * Get the first non-empty monthly value for a given base key.
 * Tries legacy single field first (e.g. "weight"),
 * then falls back to per-month fields (e.g. "weight_Jan", "weight_Feb", …).
 */
function getFirstMonthlyValue(formData: MonthlyDataTrackerHRSTFormData, baseKey: string): string {
  const legacy = formData[baseKey];
  if (legacy !== null && legacy !== undefined && legacy !== '') {
    return String(legacy);
  }
  for (const m of MONTHS) {
    const val = formData[`${baseKey}_${m}`];
    if (val !== null && val !== undefined && val !== '') {
      return String(val);
    }
  }
  return '';
}

/**
 * Check if we need a new page and add it if necessary
 */
function checkPageBreak(pdf: jsPDF, currentY: number, lineHeight: number = 6): number {
  const pageHeight = pdf.internal.pageSize.height;
  const marginBottom = 20;
  
  if (currentY + lineHeight > pageHeight - marginBottom) {
    pdf.addPage();
    // Redraw sidebar on new page
    const sidebarWidth = 25; // mm
    pdf.setFillColor(60, 60, 60);
    pdf.rect(0, 0, sidebarWidth, pdf.internal.pageSize.height, 'F');
    return 20; // Reset to top margin
  }
  
  return currentY;
}

/**
 * Add a field (question/answer pair) to the PDF - label and value on same line
 */
function addField(
  pdf: jsPDF,
  label: string,
  value: any,
  startY: number,
  contentLeftMargin: number,
  maxWidth: number = 150,
): number {
  let currentY = checkPageBreak(pdf, startY, 8);
  
  const formattedValue = formatValue(value);
  
  // Set font for label (bold)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  
  // Calculate positions for aligned layout
  const bulletX = contentLeftMargin;
  const labelX = contentLeftMargin + 4;
  const labelText = label + ':';
  
  // Set font to calculate label width accurately
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  const labelWidth = pdf.getTextWidth(labelText);
  
  // Small gap between label and value
  const labelValueGap = 5;
  const valueStartX = labelX + labelWidth + labelValueGap;
  const valueMaxWidth = maxWidth - (valueStartX - contentLeftMargin);
  
  // Check if value fits on same line
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  const valueWidth = pdf.getTextWidth(formattedValue);
  
  // If value fits on same line, put it there
  if (valueWidth <= valueMaxWidth && !formattedValue.includes('\n')) {
    currentY = checkPageBreak(pdf, currentY, 6);
    
    // Add bullet point
    pdf.setFont('helvetica', 'bold');
    pdf.text('•', bulletX, currentY);
    
    // Add label
    pdf.text(labelText, labelX, currentY);
    
    // Add value on same line
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(50, 50, 50);
    pdf.text(formattedValue, valueStartX, currentY);
    
    currentY += 6;
  } else {
    // Multi-line value - label on first line, value wraps below
    currentY = checkPageBreak(pdf, currentY, 6);
    
    // Add bullet point
    pdf.setFont('helvetica', 'bold');
    pdf.text('•', bulletX, currentY);
    
    // Add label on first line
    pdf.text(labelText, labelX, currentY);
    currentY += 6;
    
    // Split value by newlines and wrap long lines
    const lines = formattedValue.split('\n');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(50, 50, 50);
    
    lines.forEach((line) => {
      if (line.trim()) {
        const wrappedLines = pdf.splitTextToSize(line, valueMaxWidth);
        wrappedLines.forEach((wrappedLine: string) => {
          currentY = checkPageBreak(pdf, currentY, 6);
          pdf.text(wrappedLine, valueStartX, currentY);
          currentY += 6;
        });
      } else {
        currentY += 3; // Small gap for empty lines
      }
    });
  }
  
  return currentY;
}

/**
 * Generate PDF for Monthly Data Tracker HRST Form
 */
export function generateMonthlyDataTrackerHRSTPDF(
  formData: MonthlyDataTrackerHRSTFormData,
  individualName?: string,
): void {
  const pdf = new jsPDF({
    orientation: 'landscape', // Use landscape for the wide table
    unit: 'mm',
    format: 'a4',
  });

  // Layout constants
  const sidebarWidth = 25; // mm
  const contentLeftMargin = 35; // mm
  const rightMargin = 15; // mm
  const topMargin = 20;
  const pageWidth = pdf.internal.pageSize.width;
  const contentWidth = pageWidth - contentLeftMargin - rightMargin;
  let currentY = topMargin;

  // Draw dark grey sidebar on first page
  pdf.setFillColor(60, 60, 60);
  pdf.rect(0, 0, sidebarWidth, pdf.internal.pageSize.height, 'F');

  // Add Title (centered in content area)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  const title = 'Monthly Data Tracker (HRST)';
  const titleWidth = pdf.getTextWidth(title);
  const contentCenterX = contentLeftMargin + (contentWidth / 2);
  pdf.text(title, contentCenterX - (titleWidth / 2), currentY);
  currentY += 10;

  // Add Individual Name if provided (centered)
  if (individualName) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    const nameLabel = `Individual's Name: ${individualName}`;
    const nameWidth = pdf.getTextWidth(nameLabel);
    pdf.text(nameLabel, contentCenterX - (nameWidth / 2), currentY);
    currentY += 8;
  }

  // Add date generated (right aligned)
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  const generatedDate = `Generated: ${dayjs().format('MM/DD/YYYY h:mm A')}`;
  pdf.text(generatedDate, pageWidth - rightMargin - pdf.getTextWidth(generatedDate), currentY);
  currentY += 10;

  // Draw separator line
  pdf.setDrawColor(200, 200, 200);
  pdf.line(contentLeftMargin, currentY, pageWidth - rightMargin, currentY);
  currentY += 8;

  // Basic Information Section
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text('BASIC INFORMATION', contentLeftMargin, currentY);
  currentY += 10;

  // Basic info fields
  currentY = addField(pdf, 'Source', formData.source, currentY, contentLeftMargin, contentWidth);
  currentY = addField(pdf, 'Year', formData.year, currentY, contentLeftMargin, contentWidth);

  // Height — try legacy fields first, then fall back to first available monthly value
  const heightFtVal  = getFirstMonthlyValue(formData, 'heightFt');
  const heightInVal  = getFirstMonthlyValue(formData, 'heightIn');
  const heightValue  = heightFtVal || heightInVal
    ? `${heightFtVal || '—'} ft ${heightInVal || '—'} in`
    : '—';
  currentY = addField(pdf, 'Height', heightValue, currentY, contentLeftMargin, contentWidth);

  // Weight & BMI — try legacy fields first, then first available monthly value
  const weightVal = getFirstMonthlyValue(formData, 'weight');
  const bmiVal    = getFirstMonthlyValue(formData, 'bmi');
  currentY = addField(pdf, 'Weight (lbs)', weightVal, currentY, contentLeftMargin, contentWidth);
  currentY = addField(pdf, 'BMI', bmiVal, currentY, contentLeftMargin, contentWidth);
  
  currentY += 8;

  // Monthly Tracking Grid Section
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text('MONTHLY TRACKING GRID', contentLeftMargin, currentY);
  currentY += 10;

  // Table setup
  const tableStartX = contentLeftMargin;
  const firstColWidth = 60; // Width for rating item column
  const monthColWidth = (contentWidth - firstColWidth) / MONTHS.length; // Equal width for each month column
  const rowHeight = 8;
  const headerHeight = 10;

  // Check if we need a new page for the table
  // Estimated height: header + rating rows + vitals header + 3 vitals rows
  const estimatedTableHeight = headerHeight + ((RATING_ITEMS.length + 4) * rowHeight);
  if (currentY + estimatedTableHeight > pdf.internal.pageSize.height - 20) {
    currentY = checkPageBreak(pdf, currentY, estimatedTableHeight);
  }

  // Draw table header — store the top-of-table Y for border drawing later
  const tableTopY = currentY - headerHeight + 2;
  pdf.setFillColor(242, 247, 250); // Light grey background
  pdf.rect(tableStartX, tableTopY, contentWidth, headerHeight, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);

  // Rating Item header
  pdf.text('Rating Item', tableStartX + 2, currentY);

  // Month headers
  MONTHS.forEach((month, index) => {
    const monthX = tableStartX + firstColWidth + (index * monthColWidth);
    pdf.text(month, monthX + (monthColWidth / 2) - (pdf.getTextWidth(month) / 2), currentY);
  });

  currentY += headerHeight;

  // Draw table rows
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  
  RATING_ITEMS.forEach((item, itemIndex) => {
    // Check page break before each row
    currentY = checkPageBreak(pdf, currentY, rowHeight);
    
    // Alternate row background color
    if (itemIndex % 2 === 0) {
      pdf.setFillColor(255, 255, 255);
    } else {
      pdf.setFillColor(250, 250, 250);
    }
    pdf.rect(tableStartX, currentY - rowHeight + 2, contentWidth, rowHeight, 'F');
    
    // Rating item label
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    const itemLabel = `${item.id}. ${item.label}`;
    // Truncate if too long
    const maxLabelWidth = firstColWidth - 4;
    const truncatedLabel = pdf.splitTextToSize(itemLabel, maxLabelWidth)[0];
    pdf.text(truncatedLabel, tableStartX + 2, currentY);
    
    // Month values
    MONTHS.forEach((month, monthIndex) => {
      const fieldName = `${item.id}_${month}`;
      const value = formData[fieldName];
      const displayValue = formatValue(value);
      
      const monthX = tableStartX + firstColWidth + (monthIndex * monthColWidth);
      pdf.text(displayValue, monthX + (monthColWidth / 2) - (pdf.getTextWidth(displayValue) / 2), currentY);
    });
    
    currentY += rowHeight;
  });

  // ── Monthly Vitals rows (Height, Weight, BMI) ──────────────────────────────
  const VITALS_ROWS = [
    { label: 'Height', keys: ['heightFt', 'heightIn'], format: (fd: MonthlyDataTrackerHRSTFormData, m: string) => {
      const ft  = fd[`heightFt_${m}`];
      const ins = fd[`heightIn_${m}`];
      if (!ft && !ins) return '\u2014';
      return `${ft || '\u2014'}ft ${ins || '\u2014'}in`;
    }},
    { label: 'Weight (lbs)', keys: ['weight'], format: (fd: MonthlyDataTrackerHRSTFormData, m: string) => formatValue(fd[`weight_${m}`]) },
    { label: 'BMI',          keys: ['bmi'],    format: (fd: MonthlyDataTrackerHRSTFormData, m: string) => formatValue(fd[`bmi_${m}`])    },
  ];

  // Section header row
  currentY = checkPageBreak(pdf, currentY, rowHeight);
  pdf.setFillColor(238, 244, 248);
  pdf.rect(tableStartX, currentY - rowHeight + 2, contentWidth, rowHeight, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(91, 127, 166);
  pdf.text('MONTHLY VITALS', tableStartX + 2, currentY);
  currentY += rowHeight;

  VITALS_ROWS.forEach((vital, vIdx) => {
    currentY = checkPageBreak(pdf, currentY, rowHeight);
    if (vIdx % 2 === 0) {
      pdf.setFillColor(255, 255, 255);
    } else {
      pdf.setFillColor(250, 250, 250);
    }
    pdf.rect(tableStartX, currentY - rowHeight + 2, contentWidth, rowHeight, 'F');

    // Row label
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.text(vital.label, tableStartX + 2, currentY);

    // Per-month values
    MONTHS.forEach((month, monthIndex) => {
      const displayValue = vital.format(formData, month);
      const monthX = tableStartX + firstColWidth + (monthIndex * monthColWidth);
      pdf.text(displayValue, monthX + (monthColWidth / 2) - (pdf.getTextWidth(displayValue) / 2), currentY);
    });

    currentY += rowHeight;
  });

  // Draw table borders using stored tableTopY → currentY span
  const tableBottomY = currentY + 2;
  const tableTotalHeight = tableBottomY - tableTopY;
  pdf.setDrawColor(229, 231, 235);

  // Outer border
  pdf.rect(tableStartX, tableTopY, contentWidth, tableTotalHeight, 'S');

  // Vertical divider after first column
  pdf.line(tableStartX + firstColWidth, tableTopY, tableStartX + firstColWidth, tableBottomY);

  // Vertical dividers between month columns
  MONTHS.forEach((_, index) => {
    const x = tableStartX + firstColWidth + ((index + 1) * monthColWidth);
    pdf.line(x, tableTopY, x, tableBottomY);
  });

  // Horizontal line under header
  const headerLineY = tableTopY + headerHeight;
  pdf.line(tableStartX, headerLineY, tableStartX + contentWidth, headerLineY);

  currentY += 10;

  // Add note at the bottom
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(50, 50, 50);
  const noteText = 'PLEASE NOTE – The person(s) completing the MDT generally does not have extensive HRST training. It is the responsibility of the trained HRST Rater to verify accuracy of scoring prior to updating the HRST web-based application.';
  const noteLines = pdf.splitTextToSize(noteText, contentWidth);
  noteLines.forEach((line: string) => {
    currentY = checkPageBreak(pdf, currentY, 6);
    pdf.text(line, contentLeftMargin, currentY);
    currentY += 5;
  });

  // Draw sidebar on all pages (if multiple pages)
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFillColor(60, 60, 60);
    pdf.rect(0, 0, sidebarWidth, pdf.internal.pageSize.height, 'F');
  }

  // Generate PDF blob and open in print preview
  const pdfBlob = pdf.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const printWindow = window.open(pdfUrl, '_blank');

  if (printWindow) {
    // Wait for PDF to load, then trigger print
    let retryCount = 0;
    const maxRetries = 10;
    const checkInterval = setInterval(() => {
      try {
        if (printWindow.document.readyState === 'complete' || retryCount >= maxRetries) {
          clearInterval(checkInterval);
          setTimeout(() => {
            printWindow.print();
            // Cleanup after a delay
            setTimeout(() => {
              URL.revokeObjectURL(pdfUrl);
            }, 1000);
          }, 500);
        }
        retryCount++;
      } catch (error) {
        // Cross-origin or other error, try direct print
        clearInterval(checkInterval);
        setTimeout(() => {
          printWindow.print();
          setTimeout(() => {
            URL.revokeObjectURL(pdfUrl);
          }, 1000);
        }, 1000);
      }
    }, 200);
  }
}








