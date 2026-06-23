import jsPDF from 'jspdf';
import dayjs from 'dayjs';

/**
 * Type definitions for Behavior Support Plan Form data
 */
export interface BehaviorSupportPlanFormData {
  // Step 1: Demographic Information
  admissionDate?: string | null;
  serviceType?: string;
  individualName?: string;
  dateOfBirth?: string | null;
  gender?: string;
  address?: string | { line1?: string; line2?: string; city?: string; state?: string; zipcode?: string; country?: string };
  phoneNumber?: string;
  emergencyContact?: string;
  emergencyContactPhone?: string;

  // Step 2: Records & Assessments
  medicalRecords?: string;
  psychologicalAssessments?: string;
  behavioralAssessments?: string;
  educationalRecords?: string;
  otherRecords?: string;

  // Step 3: Plan Authorship
  planAuthor?: string;
  authorTitle?: string;
  authorCredentials?: string;
  authorContact?: string;
  planDate?: string | null;
  reviewDate?: string | null;

  // Step 4: Rationale for Plan
  rationale?: string;
  problemStatement?: string;
  currentBehavior?: string;
  impactOnIndividual?: string;
  impactOnOthers?: string;

  // Step 5: Preference Assessment
  preferredActivities?: string;
  preferredPeople?: string;
  preferredEnvironments?: string;
  preferredItems?: string;
  nonPreferredItems?: string;

  // Step 6: Behavior Data Analysis
  baselineData?: string;
  frequencyData?: string;
  durationData?: string;
  intensityData?: string;
  patterns?: string;

  // Step 7: Target Behaviors
  increaseBehaviors?: Array<{
    behaviorName?: string;
    replacedTargetBehaviors?: string;
    definition?: string;
    teachingProtocol?: string;
  }>;
  decreaseBehaviors?: Array<{
    behaviorName?: string;
    precursorBehaviors?: string;
    definition?: string;
    antecedents?: string;
    hypothesizedFunctions?: string;
  }>;

  // Step 8: Antecedent Strategies
  antecedentStrategies?: string;
  environmentalModifications?: string;
  scheduleModifications?: string;
  communicationStrategies?: string;
  clientSpecificProactiveStrategies?: string;
  reinforcementRationale?: string;
  reinforcementProtocol?: string;
  reactiveBehavior?: string;
  reactiveProcedure?: string;

  // Step 9: Supervision & Restrictions
  supervisionLevel?: string;
  restrictions?: string;
  monitoringRequirements?: string;
  safetyMeasures?: string;

  // Step 10: Crisis Intervention
  crisisDefinition?: string;
  crisisProcedures?: string;
  deEscalationTechniques?: string;
  emergencyContacts?: string;
  medicalConsiderationsDuringCrisis?: string;
  fadingCriteria?: string;
  planTerminationCriteria?: string;
  monitoringProtocol?: string;

  // Step 11: Goals & Signatures
  goals?: Array<{ value?: string }>;
  signatureMethod?: string;
  signature?: string | null;
  signedBy?: string;
  signatureDate?: string | null;

  [key: string]: any; // Allow additional fields
}

/**
 * Field label mapping for readable PDF output
 */
const fieldLabels: Record<string, string> = {
  // Step 1: Demographic Information
  admissionDate: 'Admission Date',
  serviceType: 'Service Type',
  individualName: 'Individual Name',
  dateOfBirth: 'Date of Birth',
  gender: 'Gender',
  address: 'Address',
  phoneNumber: 'Phone Number',
  emergencyContact: 'Emergency Contact',
  emergencyContactPhone: 'Emergency Contact Phone',

  // Step 2: Records & Assessments
  medicalRecords: 'Medical Records',
  psychologicalAssessments: 'Psychological Assessments',
  behavioralAssessments: 'Behavioral Assessments',
  educationalRecords: 'Educational Records',
  otherRecords: 'Other Records',

  // Step 3: Plan Authorship
  planAuthor: 'Plan Author',
  authorTitle: 'Author Title',
  authorCredentials: 'Author Credentials',
  authorContact: 'Author Contact',
  planDate: 'Plan Date',
  reviewDate: 'Review Date',

  // Step 4: Rationale for Plan
  rationale: 'Rationale',
  problemStatement: 'Problem Statement',
  currentBehavior: 'Current Behavior',
  impactOnIndividual: 'Impact on Individual',
  impactOnOthers: 'Impact on Others',

  // Step 5: Preference Assessment
  preferredActivities: 'Preferred Activities',
  preferredPeople: 'Preferred People',
  preferredEnvironments: 'Preferred Environments',
  preferredItems: 'Preferred Items',
  nonPreferredItems: 'Non-Preferred Items',

  // Step 6: Behavior Data Analysis
  baselineData: 'Baseline Data',
  frequencyData: 'Frequency Data',
  durationData: 'Duration Data',
  intensityData: 'Intensity Data',
  patterns: 'Patterns',

  // Step 7: Target Behaviors
  increaseBehaviors: 'Target Behaviors for Increase',
  decreaseBehaviors: 'Target Behaviors for Decrease',

  // Step 8: Antecedent Strategies
  antecedentStrategies: 'Antecedent Strategies',
  environmentalModifications: 'Environmental Modifications',
  scheduleModifications: 'Schedule Modifications',
  communicationStrategies: 'Communication Strategies',
  clientSpecificProactiveStrategies: 'Client-Specific Proactive Strategies',
  reinforcementRationale: 'Reinforcement Rationale & Description',
  reinforcementProtocol: 'Protocol (Numbered Steps)',
  reactiveBehavior: 'Reactive Behavior',
  reactiveProcedure: 'Reactive Step-by-step Procedure',

  // Step 9: Supervision & Restrictions
  supervisionLevel: 'Supervision Level',
  restrictions: 'Restrictions',
  monitoringRequirements: 'Monitoring Requirements',
  safetyMeasures: 'Safety Measures',

  // Step 10: Crisis Intervention
  crisisDefinition: 'Crisis Definition',
  crisisProcedures: 'Crisis Procedures',
  deEscalationTechniques: 'De-escalation Techniques',
  emergencyContacts: 'Emergency Contacts',
  medicalConsiderationsDuringCrisis: 'Medical Considerations During Crisis',
  fadingCriteria: 'Fading Criteria',
  planTerminationCriteria: 'Plan Termination Criteria',
  monitoringProtocol: 'Monitoring Protocol',

  // Step 11: Goals & Signatures
  goals: 'Goals',
  signatureMethod: 'Signature Method',
  signature: 'Signature',
  signedBy: 'Signed By',
  signatureDate: 'Signature Date',
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
    title: 'Step 1: Demographic Information',
    sections: [
      {
        sectionTitle: 'Demographic Information',
        fields: ['admissionDate', 'serviceType', 'individualName', 'dateOfBirth', 'gender', 'address', 'phoneNumber', 'emergencyContact', 'emergencyContactPhone'],
      },
    ],
  },
  {
    title: 'Step 2: Records & Assessments',
    sections: [
      {
        sectionTitle: 'Records & Assessments',
        fields: ['medicalRecords', 'psychologicalAssessments', 'behavioralAssessments', 'educationalRecords', 'otherRecords'],
      },
    ],
  },
  {
    title: 'Step 3: Plan Authorship',
    sections: [
      {
        sectionTitle: 'Plan Authorship',
        fields: ['planAuthor', 'authorTitle', 'authorCredentials', 'authorContact', 'planDate', 'reviewDate'],
      },
    ],
  },
  {
    title: 'Step 4: Rationale for Plan',
    sections: [
      {
        sectionTitle: 'Rationale for Plan',
        fields: ['rationale', 'problemStatement', 'currentBehavior', 'impactOnIndividual', 'impactOnOthers'],
      },
    ],
  },
  {
    title: 'Step 5: Preference Assessment',
    sections: [
      {
        sectionTitle: 'Preference Assessment',
        fields: ['preferredActivities', 'preferredPeople', 'preferredEnvironments', 'preferredItems', 'nonPreferredItems'],
      },
    ],
  },
  {
    title: 'Step 6: Behavior Data Analysis',
    sections: [
      {
        sectionTitle: 'Behavior Data Analysis',
        fields: ['baselineData', 'frequencyData', 'durationData', 'intensityData', 'patterns'],
      },
    ],
  },
  {
    title: 'Step 7: Target Behaviors',
    sections: [
      {
        sectionTitle: 'Target Behaviors for Increase',
        fields: ['increaseBehaviors'],
      },
      {
        sectionTitle: 'Target Behaviors for Decrease',
        fields: ['decreaseBehaviors'],
      },
    ],
  },
  {
    title: 'Step 8: Antecedent, Reinforcement & Reactive Strategies',
    sections: [
      {
        sectionTitle: 'Antecedent Strategies',
        fields: ['antecedentStrategies', 'environmentalModifications', 'scheduleModifications', 'communicationStrategies', 'clientSpecificProactiveStrategies'],
      },
      {
        sectionTitle: 'Reinforcement Strategies',
        fields: ['reinforcementRationale', 'reinforcementProtocol'],
      },
      {
        sectionTitle: 'Reactive / Consequence Strategies',
        fields: ['reactiveBehavior', 'reactiveProcedure'],
      },
    ],
  },
  {
    title: 'Step 9: Supervision & Environmental Restrictions',
    sections: [
      {
        sectionTitle: 'Supervision & Restrictions',
        fields: ['supervisionLevel', 'restrictions', 'monitoringRequirements', 'safetyMeasures'],
      },
    ],
  },
  {
    title: 'Step 10: Crisis Intervention, Monitoring & Fading',
    sections: [
      {
        sectionTitle: 'Crisis Intervention',
        fields: ['crisisDefinition', 'crisisProcedures', 'deEscalationTechniques', 'emergencyContacts', 'medicalConsiderationsDuringCrisis'],
      },
      {
        sectionTitle: 'Monitoring & Fading',
        fields: ['fadingCriteria', 'planTerminationCriteria', 'monitoringProtocol'],
      },
    ],
  },
  {
    title: 'Step 11: Goals & Signatures',
    sections: [
      {
        sectionTitle: 'Goals',
        fields: ['goals'],
      },
      {
        sectionTitle: 'Signatures',
        fields: ['signatureMethod', 'signedBy', 'signatureDate'],
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

  // Handle address objects
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    if (value.line1 || value.city || value.state || value.zipcode) {
      const parts: string[] = [];
      if (value.line1) parts.push(value.line1);
      if (value.line2) parts.push(value.line2);
      if (value.city) parts.push(value.city);
      if (value.state) parts.push(value.state);
      if (value.zipcode) parts.push(value.zipcode);
      if (value.country) parts.push(value.country);
      return parts.filter(Boolean).join(', ');
    }
  }

  // Handle arrays (behaviors, goals, etc.)
  if (Array.isArray(value)) {
    if (value.length === 0) return '—';
    
    // Handle increaseBehaviors array
    if (value[0] && typeof value[0] === 'object' && (value[0].behaviorName || value[0].replacedTargetBehaviors || value[0].definition)) {
      return value
        .map((item: any, index: number) => {
          const parts: string[] = [];
          if (item.behaviorName) parts.push(`Behavior Name: ${item.behaviorName}`);
          if (item.replacedTargetBehaviors) parts.push(`Replaced Target Behaviors: ${item.replacedTargetBehaviors}`);
          if (item.definition) parts.push(`Definition: ${item.definition}`);
          if (item.teachingProtocol) parts.push(`Teaching Protocol: ${item.teachingProtocol}`);
          return `Behavior ${index + 1}: ${parts.join('; ')}`;
        })
        .join('\n');
    }
    
    // Handle decreaseBehaviors array
    if (value[0] && typeof value[0] === 'object' && (value[0].behaviorName || value[0].precursorBehaviors || value[0].definition)) {
      return value
        .map((item: any, index: number) => {
          const parts: string[] = [];
          if (item.behaviorName) parts.push(`Behavior Name: ${item.behaviorName}`);
          if (item.precursorBehaviors) parts.push(`Precursor Behaviors: ${item.precursorBehaviors}`);
          if (item.definition) parts.push(`Definition: ${item.definition}`);
          if (item.antecedents) parts.push(`Antecedents: ${item.antecedents}`);
          if (item.hypothesizedFunctions) parts.push(`Hypothesized Functions: ${item.hypothesizedFunctions}`);
          return `Behavior ${index + 1}: ${parts.join('; ')}`;
        })
        .join('\n');
    }
    
    // Handle goals array
    if (value[0] && typeof value[0] === 'object' && value[0].value !== undefined) {
      return value
        .map((item: any, index: number) => {
          return `Goal ${index + 1}: ${item.value || '—'}`;
        })
        .join('\n');
    }
    
    // Handle simple arrays
    return value.map(String).join(', ');
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
 * Generate PDF for Behavior Support Plan Form
 */
export function generateBehaviorSupportPlanPDF(
  formData: BehaviorSupportPlanFormData,
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
  const title = 'Behavior Support Plan';
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

      // Add ALL fields for this section (even if empty)
      section.fields.forEach((fieldName) => {
        const label = fieldLabels[fieldName] || fieldName;
        const value = formData[fieldName];
        
        // Always show the field, regardless of value
        currentY = addField(pdf, label, value, currentY, contentLeftMargin, contentWidth);
      });

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

