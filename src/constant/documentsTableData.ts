export interface DocumentTableRow {
  id: number;
  documentName: string;
  /** "fillForm" rows show a Fill Form button instead of file upload */
  documentType?: "fillForm";
  /**
   * "datePicker" rows show a date picker instead of a file upload.
   * Currently used only for "Schedule 30-Day ISA".
   */
  dateType?: "datePicker";
  /** Backend form_code for fillForm rows (used to look up consent form status) */
  formCode?: string;
  uploadDocument?: string; // File name if uploaded
  fileUrl?: string | null;
  lastUpdated?: string;
  hasFile?: boolean;
  share?: string; // Share information
  mediaId?: number | null;
  fileCount?: number;
  allMatchingMedia?: Array<{ id: string; file_url: string; original_filename: string; mime_type?: string }>;
  uploadType: "once" | "repeating";
  frequency?: string;
  isOtherRow?: boolean;
  /** For filled "Other" rows: the media ID of the root upload (used to group re-uploads) */
  otherRootMediaId?: number;
}

export const leadDocumentsData: DocumentTableRow[] = [
  { id: 200, documentName: "Service Agreement", uploadType: "once" },
  { id: 1, documentName: "Team Contact Information", uploadType: "repeating" },
  { id: 2, documentName: "Rep Payee Contact Information", uploadType: "repeating" },
  { id: 3, documentName: "HRST", uploadType: "repeating" },
  { id: 4, documentName: "SIS", uploadType: "once" },
  { id: 5, documentName: "Risk Assessment(s)", uploadType: "repeating" },
  { id: 6, documentName: "HRC Process Packet", uploadType: "once" },
  { id: 7, documentName: "FBA/Behavior Plan", uploadType: "repeating" },
  { id: 8, documentName: "Schedule 30-Day ISA", uploadType: "once", dateType: "datePicker" },
  { id: 9, documentName: "ISA", uploadType: "repeating" },
  { id: 10, documentName: "Approved Contact List", uploadType: "once" },
  { id: 11, documentName: "5-Day Visit scheduled", uploadType: "once" },
  { id: 12, documentName: "Environmental Modifications Needed?", uploadType: "once" },
  { id: 13, documentName: "Assessments", uploadType: "repeating" },
  { id: 14, documentName: "Supervision Level Language in ISA", uploadType: "once" },
  { id: 15, documentName: "Health History", uploadType: "repeating" },
  { id: 16, documentName: "Annual Physical", uploadType: "repeating" },
  { id: 17, documentName: "Immunization Records", uploadType: "repeating" },
  { id: 18, documentName: "Insurance Cards", uploadType: "repeating" },
  { id: 19, documentName: "Identification- Birth Certificate, Social Security Card", uploadType: "once" },
  { id: 20, documentName: "Previous Providers", uploadType: "once" },
];


const guardianDocumentsData: DocumentTableRow[] = [
  { id: 101, documentName: "Guardianship Paperwork", uploadType: "repeating", frequency: "Once a year" },
  { id: 102, documentName: "Pending / Open Legal Cases", uploadType: "once" },
  { id: 103, documentName: "Consent for Medical Treatment", uploadType: "repeating", frequency: "Once a year" },
  { id: 104, documentName: "Security Protocol", uploadType: "once" },
  { id: 105, documentName: "Safety Plan", uploadType: "repeating", frequency: "Once a year" },
  { id: 106, documentName: "Phone / Visit List", uploadType: "repeating", frequency: "Other" },
  { id: 107, documentName: "Releases of Information", uploadType: "repeating", frequency: "Other" },
  { id: 108, documentName: "Respite List, if applicable", uploadType: "repeating", frequency: "Other" },
  { id: 109, documentName: "Consent for Individual Therapy", uploadType: "repeating", frequency: "Once a year" },
  { id: 110, documentName: "Client Rights", uploadType: "repeating", frequency: "Once a year" },
  { id: 111, documentName: "Media / Phone / internet Use", uploadType: "once" },
];

export const residentDocumentsData: DocumentTableRow[] = [
  ...leadDocumentsData,
  ...guardianDocumentsData,
];

// Backward-compatible alias
export const documentsTableData = leadDocumentsData;
