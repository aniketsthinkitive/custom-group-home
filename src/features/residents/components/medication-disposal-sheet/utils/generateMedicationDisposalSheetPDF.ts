import jsPDF from 'jspdf';
import dayjs from 'dayjs';

// Module-level log to verify this file is loaded

/**
 * Type definitions for Medication Disposal Sheet Form data
 */
export interface MedicationDisposalSheetFormData {
  medicationName?: string;
  dose?: string;
  numberOfPills?: string;
  staff1Initials?: string;
  staff2Initials?: string;
  methodOfDisposal?: string;
  staff1Signature?: string | null;
  staff2Signature?: string | null;

  [key: string]: any; // Allow additional fields
}

/**
 * Field label mapping for readable PDF output
 */
const fieldLabels: Record<string, string> = {
  medicationName: 'Name of Medication',
  dose: 'Dose',
  numberOfPills: 'No. of Pills',
  staff1Initials: 'Staff Initials (Staff 1)',
  staff2Initials: 'Staff Initials (Staff 2)',
  methodOfDisposal: 'Method of Disposal',
  staff1Signature: 'Staff 1 Signature',
  staff2Signature: 'Staff 2 Signature',
};

/**
 * Step configuration with field mappings and section organization
 */
interface StepConfig {
  title: string;
  sections: Array<{
    sectionTitle: string;
    fields: string[];
  }>;
}

const stepConfigs: StepConfig[] = [
  {
    title: 'Medication Disposal Sheet',
    sections: [
      {
        sectionTitle: 'Medication Details',
        fields: ['medicationName', 'dose', 'numberOfPills', 'staff1Initials', 'staff2Initials', 'methodOfDisposal'],
      },
      {
        sectionTitle: 'Certification',
        fields: [],
      },
      {
        sectionTitle: 'Signatures',
        fields: ['staff1Signature', 'staff2Signature'],
      },
    ],
  },
];

/**
 * Format a value for display in PDF
 */
function formatValue(value: any): string {
  // Handle boolean values first (including false)
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (value === null || value === undefined || value === '') {
    return '—';
  }

  // Handle date strings
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    const date = dayjs(value);
    if (date.isValid()) {
      return date.format('MM/DD/YYYY');
    }
  }

  // Handle dayjs objects
  if (dayjs.isDayjs(value)) {
    return value.format('MM/DD/YYYY');
  }

  // Handle signature (base64 image) - show indicator instead of data
  if (typeof value === 'string' && (value.startsWith('data:image') || value.length > 1000)) {
    return '[Signature Image]';
  }

  return String(value);
}

/**
 * Render a signature data URL as an embedded image. Returns the new Y position,
 * or null if the value is not an embeddable image.
 */
function addSignatureImage(
  pdf: jsPDF,
  value: any,
  startY: number,
  x: number,
): number | null {
  if (typeof value !== 'string' || !value.startsWith('data:image')) {
    return null;
  }
  try {
    const props = pdf.getImageProperties(value);
    const maxWidth = 60; // mm
    const maxHeight = 25; // mm
    const scale = Math.min(maxWidth / props.width, maxHeight / props.height);
    const w = props.width * scale;
    const h = props.height * scale;
    const y = checkPageBreak(pdf, startY, h + 4);
    pdf.addImage(value, props.fileType, x, y, w, h);
    return y + h + 4;
  } catch {
    return null;
  }
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
 * Add a section heading to the PDF
 */
function addSectionHeading(
  pdf: jsPDF,
  title: string,
  startY: number,
  contentLeftMargin: number,
): number {
  let currentY = checkPageBreak(pdf, startY, 10);
  
  // Set font for section heading (bold, larger)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);
  pdf.text(title, contentLeftMargin, currentY);
  currentY += 6;
  
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

  // Signature values: render the actual image instead of placeholder text
  if (typeof value === 'string' && value.startsWith('data:image')) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text('•', contentLeftMargin, currentY);
    pdf.text(label + ':', contentLeftMargin + 4, currentY);
    currentY += 4;
    const afterImageY = addSignatureImage(pdf, value, currentY, contentLeftMargin + 4);
    if (afterImageY !== null) {
      return afterImageY;
    }
    // Image failed to embed — show placeholder text
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(50, 50, 50);
    pdf.text('[Signature Image]', contentLeftMargin + 4, currentY + 2);
    return currentY + 8;
  }

  const formattedValue = formatValue(value);

  // Always show all fields - don't skip any

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
 * Generate PDF for Medication Disposal Sheet Form
 */
export function generateMedicationDisposalSheetPDF(
  formData: MedicationDisposalSheetFormData,
  individualName?: string,
): void {
  // Log to verify new code is running
  
  const pdf = new jsPDF({
    orientation: 'portrait',
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
  const title = 'Medication Disposal Sheet';
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

  // Process each step - show ALL steps and fields
  stepConfigs.forEach((step) => {
    // Add step title
    currentY = checkPageBreak(pdf, currentY, 12);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text(step.title.toUpperCase(), contentLeftMargin, currentY);
    currentY += 10;

    // Process each section in the step
    step.sections.forEach((section) => {
      // Add section heading
      currentY = addSectionHeading(pdf, section.sectionTitle, currentY, contentLeftMargin);

      // Add certification statement if this is the Certification section
      if (section.sectionTitle === 'Certification') {
        currentY = checkPageBreak(pdf, currentY, 8);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(50, 50, 50);
        const certText = 'By signing below, I certify that the medication(s) referenced above have been counted, logged, and disposed of.';
        const certLines = pdf.splitTextToSize(certText, contentWidth);
        certLines.forEach((line: string) => {
          currentY = checkPageBreak(pdf, currentY, 6);
          pdf.text(line, contentLeftMargin, currentY);
          currentY += 5;
        });
        currentY += 3;
      } else {
        // Add ALL fields for this section (even if empty)
        section.fields.forEach((fieldName) => {
          const label = fieldLabels[fieldName] || fieldName;
          const value = formData[fieldName];
          
          // Always show the field, regardless of value
          currentY = addField(pdf, label, value, currentY, contentLeftMargin, contentWidth);
        });
      }

      // Add spacing after section
      currentY += 3;
    });

    // Add spacing between steps
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
  // Use unique window name with timestamp to prevent caching
  const windowName = `medication-disposal-pdf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const printWindow = window.open(pdfUrl, windowName);

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
