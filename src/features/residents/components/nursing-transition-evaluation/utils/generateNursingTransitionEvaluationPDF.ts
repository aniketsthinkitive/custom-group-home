import jsPDF from 'jspdf';
import dayjs from 'dayjs';

/**
 * Type definitions for Nursing Transition Evaluation Form data
 */
export interface NursingTransitionEvaluationFormData {
  // Basic Information
  region?: string;
  address?: string;
  dateOfTransition?: string | null;
  vendorAgencyName?: string;

  // 5-Day Evaluation
  fiveDayNurseName?: string;
  fiveDayEvaluationDate?: string | null;
  fiveDayEmail?: string;
  fiveDayContactNumber?: string;
  fiveDayAdverseChanges?: string;
  fiveDayFollowUp?: string;
  fiveDaySignature?: string | null;

  // 30-Day Evaluation
  thirtyDayNurseName?: string;
  thirtyDayEvaluationDate?: string | null;
  thirtyDayEmail?: string;
  thirtyDayContactNumber?: string;
  thirtyDayHealthHistoryInfo?: boolean;
  thirtyDayHRSTMonthlyData?: boolean;
  thirtyDayServiceAgreement?: boolean;
  thirtyDayFrailHealth?: string;
  thirtyDayFrailHealthDescription?: string;
  thirtyDayFollowUp?: string;
  thirtyDayNotes?: string;
  thirtyDaySignature?: string | null;

  [key: string]: any; // Allow additional fields
}

/**
 * Field label mapping for readable PDF output
 */
const fieldLabels: Record<string, string> = {
  // Basic Information
  region: 'Region',
  address: 'Address',
  dateOfTransition: 'Date of Transition / Move',
  vendorAgencyName: 'Vendor Agency Name',

  // 5-Day Evaluation
  fiveDayNurseName: 'Licensed Nurse Name',
  fiveDayEvaluationDate: 'Date of 5-Day Evaluation',
  fiveDayEmail: 'Email',
  fiveDayContactNumber: 'Phone Number',
  fiveDayAdverseChanges: 'Adverse Changes After Transition',
  fiveDayFollowUp: 'Follow-up Needed',
  fiveDaySignature: 'Nurse Signature',

  // 30-Day Evaluation
  thirtyDayNurseName: 'Licensed Nurse Name',
  thirtyDayEvaluationDate: 'Date of 30-Day Evaluation',
  thirtyDayEmail: 'Email',
  thirtyDayContactNumber: 'Phone Number',
  thirtyDayHealthHistoryInfo: 'Health History Information',
  thirtyDayHRSTMonthlyData: 'HRST Monthly Data Tracker',
  thirtyDayServiceAgreement: 'Service Agreement Present',
  thirtyDayFrailHealth: 'Frail Health (He-M 1201.02 (m))',
  thirtyDayFrailHealthDescription: 'If Yes, Please Describe',
  thirtyDayFollowUp: 'Follow-up Needed',
  thirtyDayNotes: 'Notes',
  thirtyDaySignature: 'Nurse Signature',
};

/**
 * Section configuration with field mappings and organization
 */
interface SectionConfig {
  sectionTitle: string;
  fields: string[];
}

const sections: SectionConfig[] = [
  {
    sectionTitle: 'Basic Information',
    fields: ['region', 'address', 'dateOfTransition', 'vendorAgencyName'],
  },
  {
    sectionTitle: '5-Day Evaluation',
    fields: [
      'fiveDayNurseName',
      'fiveDayEvaluationDate',
      'fiveDayEmail',
      'fiveDayContactNumber',
      'fiveDayAdverseChanges',
      'fiveDayFollowUp',
      'fiveDaySignature',
    ],
  },
  {
    sectionTitle: '30-Day Evaluation',
    fields: [
      'thirtyDayNurseName',
      'thirtyDayEvaluationDate',
      'thirtyDayEmail',
      'thirtyDayContactNumber',
      'thirtyDayHealthHistoryInfo',
      'thirtyDayHRSTMonthlyData',
      'thirtyDayServiceAgreement',
      'thirtyDayFrailHealth',
      'thirtyDayFrailHealthDescription',
      'thirtyDayFollowUp',
      'thirtyDayNotes',
      'thirtyDaySignature',
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
  
  const formattedValue = formatValue(value);
  
  // Skip signature fields - they're handled separately
  if (label === 'Nurse Signature' && (formattedValue === '[Signature Image]' || formattedValue === '—')) {
    return currentY;
  }

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
 * Add signature image to PDF
 */
function addSignature(
  pdf: jsPDF,
  signatureData: string | null | undefined,
  label: string,
  startY: number,
  contentLeftMargin: number,
  contentWidth: number,
): number {
  if (!signatureData || signatureData === '—' || signatureData === '') {
    return startY;
  }

  let currentY = checkPageBreak(pdf, startY, 50);

  // Add label
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`${label}:`, contentLeftMargin, currentY);
  currentY += 8;

  try {
    // Add signature image — detect format (uploads can be JPEG, drawn is PNG)
    // and preserve aspect ratio within a max box
    const props = pdf.getImageProperties(signatureData);
    const maxWidth = Math.min(80, contentWidth);
    const maxHeight = 30;
    const scale = Math.min(maxWidth / props.width, maxHeight / props.height);
    const imgWidth = props.width * scale;
    const imgHeight = props.height * scale;

    pdf.addImage(signatureData, props.fileType, contentLeftMargin, currentY, imgWidth, imgHeight);
    currentY += imgHeight + 8;
  } catch (error) {
    // If image fails to load, just show text indicator
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text('[Signature Image]', contentLeftMargin, currentY);
    currentY += 6;
  }

  return currentY;
}

/**
 * Generate PDF for Nursing Transition Evaluation Form
 */
export function generateNursingTransitionEvaluationPDF(
  formData: NursingTransitionEvaluationFormData,
  individualName?: string,
): void {
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
  const title = '5 and 30 Day Nursing Transition Evaluation Form';
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

  // Process each section
  sections.forEach((section) => {
    // Add section heading
    currentY = addSectionHeading(pdf, section.sectionTitle, currentY, contentLeftMargin);

    // Process fields in this section
    section.fields.forEach((fieldName) => {
      const label = fieldLabels[fieldName] || fieldName;
      const value = formData[fieldName];

      // Handle signature fields separately
      if (fieldName === 'fiveDaySignature' || fieldName === 'thirtyDaySignature') {
        currentY = addSignature(
          pdf,
          value as string | null | undefined,
          label,
          currentY,
          contentLeftMargin,
          contentWidth,
        );
      } else {
        // Handle conditional fields
        if (fieldName === 'thirtyDayFrailHealthDescription') {
          // Only show if thirtyDayFrailHealth is 'yes'
          if (formData.thirtyDayFrailHealth === 'yes') {
            currentY = addField(pdf, label, value, currentY, contentLeftMargin, contentWidth);
          }
        } else {
          // Show all other fields
          currentY = addField(pdf, label, value, currentY, contentLeftMargin, contentWidth);
        }
      }
    });

    // Add spacing after section
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

