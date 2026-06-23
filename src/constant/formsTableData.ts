export interface FormTableRow {
  id: number;
  formName: string;
  documentType: "file" | "fillForm" | "filled" | "upload" | "empty";
  documentName?: string;
  lastUpdated?: string;
  share?: string;
  hasHistory?: boolean;
  canDelete?: boolean;
  canView?: boolean;
  canPrint?: boolean;
  refillInfo?: string;
  refillUrgent?: boolean;
  isButtonDisabled?: boolean;
  uploadType?: "once" | "repeating";
  frequency?: string;
  isShared?: boolean;
}

export const formsTableData: FormTableRow[] = [
  {
    id: 1,
    formName: "Medical Deferment Form",
    documentType: "upload",
    lastUpdated: "-",
    hasHistory: false,
    canDelete: true,
    canView: true,
    canPrint: true,
    uploadType: "repeating",
  },
  {
    id: 2,
    formName: "Health History Form",
    documentType: "fillForm",
    lastUpdated: "-",
    hasHistory: true,
    canDelete: true,
    canView: true,
    canPrint: true,
    uploadType: "once",
    frequency: "Once a year",
  },
  {
    id: 25,
    formName: "5 and 30 Day Nursing Transition Evaluation Form",
    documentType: "fillForm",
    lastUpdated: "-",
    hasHistory: true,
    canDelete: true,
    canView: true,
    canPrint: true,
    uploadType: "once",
  },
  {
    id: 15,
    formName: "Resident Inventory List",
    documentType: "fillForm",
    lastUpdated: "-",
    hasHistory: true,
    canDelete: true,
    canView: true,
    canPrint: true,
    uploadType: "repeating",
    frequency: "Once a quarter",
  },
  {
    id: 8,
    formName: "Fire safety assessment",
    documentType: "fillForm",
    lastUpdated: "-",
    canDelete: true,
    canView: true,
    canPrint: true,
    uploadType: "repeating",
    frequency: "Once a year",
  },
  {
    id: 9,
    formName: "HRST monthly tracker",
    documentType: "fillForm",
    lastUpdated: "-",
    canDelete: true,
    canView: true,
    canPrint: true,
    uploadType: "repeating",
    frequency: "Once a month",
  },
  {
    id: 10,
    formName: "BSP (Behavior Support Plan)",
    documentType: "fillForm",
    lastUpdated: "-",
    hasHistory: true,
    canDelete: true,
    canView: true,
    canPrint: true,
    uploadType: "repeating",
    frequency: "Once a year",
  },
  {
    id: 13,
    formName: "HRC BSP approval request",
    documentType: "upload",
    lastUpdated: "-",
    hasHistory: false,
    canDelete: true,
    canView: true,
    canPrint: true,
    uploadType: "repeating",
  },
  // {
  //   id: 12,
  //   formName: "Medication Disposal Sheet",
  //   documentType: "fillForm",
  //   lastUpdated: "-",
  //   hasHistory: true,
  //   canDelete: true,
  //   canView: true,
  //   canPrint: true,
  //   uploadType: "repeating",
  // },
  // {
  //   id: 14,
  //   formName: "NARC count sheet",
  //   documentType: "empty",
  //   lastUpdated: "-",
  //   hasHistory: false,
  //   canDelete: false,
  //   canView: false,
  //   canPrint: false,
  //   uploadType: "once",
  // },
];
