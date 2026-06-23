import React, { useState, useMemo, useEffect, useRef, Suspense, useCallback } from "react";
import {
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  FormControlLabel,
  FormGroup,
  Checkbox,
  Chip,
  Button,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import CustomInput from "../../../components/custom-input/custom-input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import HistoryIcon from "@mui/icons-material/History";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PrintIcon from "@mui/icons-material/Print";
import DeleteIcon from "@mui/icons-material/Delete";
import DescriptionIcon from "@mui/icons-material/Description";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ShareIcon from "@mui/icons-material/Share";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Close from "@mui/icons-material/Close";
import Tooltip from "@mui/material/Tooltip";
import { usePermission } from "../../../hooks/usePermission";
import { useAppSelector } from "../../../store/hooks";
import { Visibility, Print, Delete, Edit as EditIcon } from "@mui/icons-material";
import dayjs from "dayjs";
import {
  heading,
  primaryTextCss,
  tableCellCss,
  tableContainerCss,
} from "../../../components/common-table/widgets/common-table-widgets";
import Paginator from "../../../components/pagination/pagination";
import CustomButton from "../../../components/custom-buttons/custom-buttons";
import {
  formsTableData,
  type FormTableRow,
} from "../../../constant/formsTableData";
// Import thunks kept separate so the chunks can be PRELOADED after the
// table mounts — without this, the first click on a form waited for the
// chunk download with no visual feedback.
const drawerImports = {
  healthHistory: () => import("./HealthHistoryFormDrawer"),
  medicationDisposal: () => import("./MedicationDisposalSheetDrawer"),
  fireSafety: () => import("./FireSafetyAssessmentDrawer"),
  behaviorSupportPlan: () => import("./BehaviorSupportPlanDrawer"),
  formHistory: () => import("./FormHistoryDrawer"),
  hrst: () => import("./MonthlyDataTrackerHRSTDrawer"),
  inventoryList: () => import("./ResidentInventoryListDrawer"),
  nursingTransition: () => import("./NursingTransitionEvaluationDrawer"),
  nhResidency: () =>
    import("../../leads/components/forms/nh-residency-agreement/NHResidencyAgreementDrawer"),
  houseRules: () => import("../../leads/components/forms/house-rules/HouseRulesDrawer"),
  hipaaRelease: () =>
    import("../../leads/components/forms/hipaa-release/HIPAAReleaseFillFormDrawer"),
  serviceAgreement: () =>
    import("../../leads/components/forms/service-agreement/ServiceAgreementDrawer"),
};

let drawersPreloaded = false;
const preloadDrawerChunks = () => {
  if (drawersPreloaded) return;
  drawersPreloaded = true;
  Object.values(drawerImports).forEach((load) => {
    load().catch(() => {
      // Preload failures are non-fatal — React.lazy retries on demand
      drawersPreloaded = false;
    });
  });
};

// Feedback while a lazily-loaded drawer chunk is still downloading: an
// already-open drawer shell with a centered loader inside, so the user sees
// the drawer opening immediately instead of a white full-screen overlay.
const drawerLoadingFallback = (
  <CustomDrawer
    anchor="right"
    open
    drawerWidth="840px"
    drawermargin="0"
    drawerPadding="0"
  >
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        height: "100%",
      }}
    >
      <CircularProgress size={32} />
      <Typography sx={{ fontSize: "13px", color: "#757775" }}>
        Loading form…
      </Typography>
    </Box>
  </CustomDrawer>
);

const HealthHistoryFormDrawer = React.lazy(drawerImports.healthHistory);
const MedicationDisposalSheetDrawer = React.lazy(drawerImports.medicationDisposal);
const FireSafetyAssessmentDrawer = React.lazy(drawerImports.fireSafety);
const BehaviorSupportPlanDrawer = React.lazy(drawerImports.behaviorSupportPlan);
const FormHistoryDrawer = React.lazy(drawerImports.formHistory);
const MonthlyDataTrackerHRSTDrawer = React.lazy(drawerImports.hrst);
const ResidentInventoryListDrawer = React.lazy(drawerImports.inventoryList);
const NursingTransitionEvaluationDrawer = React.lazy(drawerImports.nursingTransition);
// Lead-creation form drawers (view mode only in Guardian/Agent tab)
const LeadNHResidencyAgreementDrawer = React.lazy(drawerImports.nhResidency);
const LeadHouseRulesDrawer = React.lazy(drawerImports.houseRules);
const LeadHIPAAReleaseFillFormDrawer = React.lazy(drawerImports.hipaaRelease);
const LeadServiceAgreementDrawer = React.lazy(drawerImports.serviceAgreement);
import {
  listConsentFormsOptions,
  listConsentFormsQueryKey,
  mediaListQueryKey,
  deleteConsentFormMutation,
  shareConsentFormMutation,
  getConsentFormDetailOptions,
  mediaListOptions,
  mediaDeleteDestroyMutation,
} from "../../../sdk/@tanstack/react-query.gen";
import {
  useMediaUpload,
  UPLOAD_CANCELLED_MESSAGE,
} from "../../../hooks/useMediaUpload";
import UploadProgressPanel from "../../../components/upload-progress-panel/upload-progress-panel";
import TableSkeleton from "../../../components/common-table/TableSkeleton";
import { client } from "../../../sdk/client.gen";
import type { AxiosError } from "axios";
import CommonSnackbar from "../../../components/common-snackbar/common-snackbar";
import ConfirmationPopUp from "../../../components/confirmation-pop-up/confirmation-pop-up";
import CustomDrawer from "../../../components/custom-drawer/custom-drawer";
import CustomDialog from "../../../components/custom-dialog/custom-dialog";
import ViewDocumentsDialog from "../../appointments/components/ViewDocumentsDialog";
import type { ViewDocumentFile } from "../../appointments/components/ViewDocumentsDialog";

/* ================= TYPES ================= */

export interface ContactDetails {
  name: string;
  email: string;
  phone: string;
}

export interface ConsentFormsTableProps {
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onFillForm?: (formId: number) => void;
  onView?: (formId: number) => void;
  onPrint?: (formId: number) => void;
  onDelete?: (formId: number) => void;
  onHistory?: (formId: number) => void;
  onViewDocument?: (formId: number, documentName: string) => void;
  residentName?: string;
  residentData?: any;
  searchQuery?: string;
  guardianDetails?: ContactDetails;
  agentDetails?: ContactDetails;
  /** When set, upload/fill/delete/share actions are disabled and this text shows as a tooltip */
  disabledReason?: string;
}

/* ================= MEDIA HISTORY ================= */

interface MediaHistoryEntry {
  mediaId: string;
  fileName: string;
  uploadDate: string;
  rawDate: string;
  fileUrl: string;
  mimeType?: string;
}

interface SignedFormRow {
  id: string;
  displayName: string;
  rawFormName: string;
  signerType: "GUARDIAN" | "AGENT";
  signerName: string;
  status: string;
  lastUpdated: string;
  consentFormUuid: string;
  canView: boolean;
  canPrint: boolean;
}

const truncateFileName = (name: string, max = 28) =>
  name.length > max ? name.slice(0, max - 1) + "…" : name;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ERROR_MESSAGE_FILE_TOO_LARGE = "The selected file is too large. Please choose a file smaller than 10 MB";
const INVALID_FORMAT_MESSAGE = "Unsupported file format. Please upload PDF, PNG, JPG, or JPEG files.";

/* ================= HEADERS ================= */

// Memoize table headers with responsive widths for different screen sizes
// Breakpoints:
// - Mobile (xs): < 600px - Compact widths, horizontal scroll enabled
// - Tablet (sm): 600px - 959px - Medium widths, horizontal scroll enabled
// - Laptop (md): 960px - 1279px - Standard widths, horizontal scroll enabled
// - Desktop (lg): >= 1280px - Full widths, fits within container
const tableHeaders = [
  { 
    id: "srNo", 
    label: "Sr. no", 
    align: "center" as const, 
    width: { xs: "60px", sm: "65px", md: "70px", lg: "70px" },
    minWidth: { xs: "50px", sm: "60px", md: "65px", lg: "70px" },
  },
  { 
    id: "formName", 
    label: "Form Name", 
    align: "left" as const, 
    width: { xs: "200px", sm: "230px", md: "260px", lg: "260px" },
    minWidth: { xs: "180px", sm: "210px", md: "240px", lg: "260px" },
  },
  { 
    id: "documents", 
    label: "Documents", 
    align: "left" as const, 
    width: { xs: "180px", sm: "210px", md: "240px", lg: "240px" },
    minWidth: { xs: "160px", sm: "190px", md: "220px", lg: "240px" },
  },
  { 
    id: "lastUpdated", 
    label: "Last Updated", 
    align: "left" as const, 
    width: { xs: "140px", sm: "160px", md: "180px", lg: "180px" },
    minWidth: { xs: "120px", sm: "140px", md: "160px", lg: "180px" },
  },
  { 
    id: "action", 
    label: "Action", 
    align: "center" as const, 
    width: { xs: "70px", sm: "75px", md: "80px", lg: "80px" },
    minWidth: { xs: "60px", sm: "70px", md: "75px", lg: "80px" },
  },
];

/* ================= LEAD CREATION FORMS (Guardian/Agent tab) ================= */

// The forms filled at lead creation time, shown in the Guardian/Agent tab
const LEAD_FORMS_STATIC = [
  { formName: "NH Residency Agreement", formCode: "NH_RESIDENCY_AGREEMENT" },
  { formName: "CAFC House rules",       formCode: "CAFC_HOUSE_RULES" },
  { formName: "Blank ROI",              formCode: "BLANK_ROI" },
] as const;

/* ================= FORM CODE MAPPING ================= */

// Map form names to their backend form_code values
const formNameToCodeMap: Record<string, string> = {
  "Health History Form": "HEALTH_HISTORY_FORM",
  "5 and 30 Day Nursing Transition Evaluation Form": "5_AND_30_DAY_NURSING_TRANSITION_EVALUATION_FORM",
  "Fire safety assessment": "FIRE_SAFETY_ASSESSMENT",
  "BSP (Behavior Support Plan)": "CAFC_BSP_TEMPLATE",
  // "Medication Disposal Sheet": "MED_DISPOSAL_SHEET",
  "HRST monthly tracker": "HRST_MONTHLY_TRACKER",
  "Resident Inventory List": "RESIDENT_INVENTORY_LIST",
};

const capturePdfBlobFromPrintGenerator = (runGenerator: () => void): Blob | null => {
  let capturedBlob: Blob | null = null;
  const originalCreateObjectUrl = URL.createObjectURL;
  const originalWindowOpen = window.open;

  URL.createObjectURL = ((object: Blob | MediaSource) => {
    if (object instanceof Blob) {
      capturedBlob = object;
    }
    return originalCreateObjectUrl.call(URL, object);
  }) as typeof URL.createObjectURL;

  window.open = (() =>
    ({
      closed: false,
      document: { readyState: "complete" },
      focus: () => undefined,
      print: () => undefined,
    }) as unknown as Window) as typeof window.open;

  try {
    runGenerator();
  } finally {
    URL.createObjectURL = originalCreateObjectUrl;
    window.open = originalWindowOpen;
  }

  return capturedBlob;
};

const getConsentFormPdfBlob = async (
  formName: string,
  formJson: Record<string, unknown>,
  individualName?: string,
  autoPrint = false,
): Promise<Blob | true | null> => {
  if (formName === "Health History Form") {
    const { generateHealthHistoryPDF } =
      await import("./health-history/utils/generateHealthHistoryPDF");
    if (autoPrint) {
      generateHealthHistoryPDF(formJson as any, individualName);
      return true;
    }
    return capturePdfBlobFromPrintGenerator(() =>
      generateHealthHistoryPDF(formJson as any, individualName),
    );
  }

  if (formName === "BSP (Behavior Support Plan)") {
    const { generateBehaviorSupportPlanPDF } =
      await import("./behavior-support-plan/utils/generateBehaviorSupportPlanPDF");
    if (autoPrint) {
      generateBehaviorSupportPlanPDF(formJson as any, individualName);
      return true;
    }
    return capturePdfBlobFromPrintGenerator(() =>
      generateBehaviorSupportPlanPDF(formJson as any, individualName),
    );
  }

  if (formName === "Fire safety assessment") {
    const { generateFireSafetyAssessmentPDF } =
      await import("./fire-safety-assessment/utils/generateFireSafetyAssessmentPDF");
    if (autoPrint) {
      generateFireSafetyAssessmentPDF(formJson as any, individualName);
      return true;
    }
    return capturePdfBlobFromPrintGenerator(() =>
      generateFireSafetyAssessmentPDF(formJson as any, individualName),
    );
  }

  if (
    formName === "HRST monthly tracker" ||
    formName === "Monthly Data Tracker (HRST)"
  ) {
    const { generateMonthlyDataTrackerHRSTPDF } =
      await import("./monthly-data-tracker-hrst/utils/generateMonthlyDataTrackerHRSTPDF");
    if (autoPrint) {
      generateMonthlyDataTrackerHRSTPDF(formJson as any, individualName);
      return true;
    }
    return capturePdfBlobFromPrintGenerator(() =>
      generateMonthlyDataTrackerHRSTPDF(formJson as any, individualName),
    );
  }

  if (formName === "Resident Inventory List") {
    const { generateResidentInventoryListPDF } =
      await import("./resident-inventory-list/utils/generateResidentInventoryListPDF");
    if (autoPrint) {
      generateResidentInventoryListPDF(formJson as any, individualName);
      return true;
    }
    return capturePdfBlobFromPrintGenerator(() =>
      generateResidentInventoryListPDF(formJson as any, individualName),
    );
  }

  if (formName === "5 and 30 Day Nursing Transition Evaluation Form") {
    const { generateNursingTransitionEvaluationPDF } =
      await import("./nursing-transition-evaluation/utils/generateNursingTransitionEvaluationPDF");
    if (autoPrint) {
      generateNursingTransitionEvaluationPDF(formJson as any, individualName);
      return true;
    }
    return capturePdfBlobFromPrintGenerator(() =>
      generateNursingTransitionEvaluationPDF(formJson as any, individualName),
    );
  }

  return null;
};

const getConsentFormPdfFileName = (formName?: string) =>
  `${(formName || "Consent Form").replace(/[\\/:*?"<>|]+/g, "").trim() || "Consent Form"}.pdf`;

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

/* ================= DATE FORMATTING ================= */

/**
 * Format date string to MM/DD/YYYY, h:mm AM/PM format
 * Matches the format used in static data: "02/25/2025, 11:00 AM"
 */
const formatLastUpdated = (dateString: string | null | undefined): string => {
  if (!dateString) return "—";

  try {
    const date = dayjs(dateString);
    if (!date.isValid()) return "—";

    const formattedDate = date.format("MM/DD/YYYY");
    const formattedTime = date.format("h:mm A");

    return `${formattedDate}, ${formattedTime}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "—";
  }
};

/* ================= COMPONENT ================= */

const ConsentFormsTable: React.FC<ConsentFormsTableProps> = ({
  page = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  onFillForm,
  onView,
  onPrint,
  onDelete,
  onHistory,
  onViewDocument,
  residentName,
  residentData,
  searchQuery = "",
  guardianDetails,
  agentDetails,
  disabledReason,
}) => {
  const { hasPermission } = usePermission();
  const currentUser = useAppSelector((state) => state.auth.user);
  const isNurse = currentUser?.role?.name === "Nurse";
  const isBCBA = currentUser?.role?.name === "BCBA";
  const isDSP = currentUser?.role?.name === "DSP";
  const canDeleteConsentForm = hasPermission("consent_forms.delete");
  const canCreateConsentForm = hasPermission("consent_forms.create") || isNurse;
  const canEditConsentForm = hasPermission("consent_forms.edit") || isNurse;
  const canPrintConsentForm = hasPermission("consent_forms.print") || isNurse;
  const canShareConsentForm = hasPermission("consent_forms.share");
  const isReadOnly = !!disabledReason;
  const [currentPage, setCurrentPage] = useState(page);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const [openFormDrawer, setOpenFormDrawer] = useState(false);
  const [selectedForm, setSelectedForm] = useState<FormTableRow | null>(null);
  const [viewMode, setViewMode] = useState(false);
  const [openHistoryDrawer, setOpenHistoryDrawer] = useState(false);
  const [selectedHistoryForm, setSelectedHistoryForm] =
    useState<FormTableRow | null>(null);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<any>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [formToDelete, setFormToDelete] = useState<
    | (FormTableRow & { consentFormUuid?: string; consentFormStatus?: string })
    | null
  >(null);
  // HRST edit mode: when true, the HRST drawer opens pre-filled for year-based editing
  const [isHrstEditMode, setIsHrstEditMode] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
    status: "success" | "error";
  }>({
    isOpen: false,
    message: "",
    status: "success",
  });

  const [uploadingFormIds, setUploadingFormIds] = useState<Set<number>>(
    new Set(),
  );
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<ViewDocumentFile[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(
    null,
  );
  const [deleteDocumentDialogOpen, setDeleteDocumentDialogOpen] =
    useState(false);
  const isViewModeRef = useRef(false); // Track view mode to prevent race conditions

  // 3-dot menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuRow, setMenuRow] = useState<FormTableRow | null>(null);

  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareFormRow, setShareFormRow] = useState<FormTableRow | null>(null);
  const [shareRecipients, setShareRecipients] = useState<("guardian" | "agent")[]>(
    [],
  );
  const [customRecipients, setCustomRecipients] = useState<
    { id: string; email: string; checked: boolean }[]
  >([]);
  const [isShareProcessing, setIsShareProcessing] = useState(false);
  // Checkbox multi-select: row ids checked for bulk sharing
  const [selectedShareRowIds, setSelectedShareRowIds] = useState<Set<number>>(
    new Set(),
  );
  // When true, the share dialog shares all checked rows instead of one
  const [shareSelectedMode, setShareSelectedMode] = useState(false);

  // Preload the form drawer chunks while the user reads the table so the
  // first click opens the drawer instantly instead of waiting on a download
  useEffect(() => {
    const w = window as any;
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(preloadDrawerChunks);
      return () => w.cancelIdleCallback?.(id);
    }
    const t = setTimeout(preloadDrawerChunks, 1200);
    return () => clearTimeout(t);
  }, []);
  // Tab selection: "common" always; "guardian" / "agent" shown only when that person is assigned
  const [consentTab, setConsentTab] = useState<"common" | "guardian" | "agent">("common");
  // Lead form drawer state (for Guardian / Agent tab view action)
  const [leadFormDrawerOpen, setLeadFormDrawerOpen] = useState(false);
  const [selectedLeadForm, setSelectedLeadForm] = useState<SignedFormRow | null>(null);

  // Media-based history drawer state (for upload-only repeating forms)
  const [mediaHistoryDrawerOpen, setMediaHistoryDrawerOpen] = useState(false);
  const [mediaHistoryFormName, setMediaHistoryFormName] = useState("");
  const [mediaHistoryEntries, setMediaHistoryEntries] = useState<MediaHistoryEntry[]>([]);
  const [deleteMediaHistoryId, setDeleteMediaHistoryId] = useState<string | null>(null);
  const [alertDialog, setAlertDialog] = useState<{
    open: boolean;
    message: string;
  }>({ open: false, message: "" });

  const queryClient = useQueryClient();

  // Extract resident UUID
  const residentUuid = residentData?.uuid || residentData?.resident_uuid;

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch consent forms from API
  // Only refetch explicitly after actions (save, delete, etc.), not on view or auto-refetch
  // STRICTLY DISABLED when in view mode - only get form by UUID API should be called
  const consentListQuery = useQuery({
    ...listConsentFormsOptions({
      query: {
        resident_uuid: residentUuid,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      },
    }),
    enabled: !!residentUuid && !viewMode, // STRICTLY disable when in view mode only
    refetchOnWindowFocus: false, // Prevent auto-refetch on window focus
    refetchOnReconnect: false, // Prevent auto-refetch on network reconnect
    refetchOnMount: false, // Prevent auto-refetch on component mount if data exists
    refetchInterval: false, // Prevent any interval refetches
    refetchIntervalInBackground: false, // Prevent background refetches
    select: (data: any) => {
      // Handle different response structures
      if (data?.data && Array.isArray(data.data)) {
        return data.data;
      }
      if (Array.isArray(data)) {
        return data;
      }
      if (data?.results && Array.isArray(data.results)) {
        return data.results;
      }
      return [];
    },
  });

  const { data: consentFormsResponse, refetch: refetchConsentForms } =
    consentListQuery;

  // Fetch media list for uploaded documents (same as DocumentsSection)
  // STRICTLY DISABLED when in view mode - only get form by UUID API should be called
  const objectId = residentData?.uuid;
  const { data: mediaResponse } = useQuery({
    ...mediaListOptions({
      query: {
        content_type: "leads.lead",
        object_uuid: objectId,
        page_size: 100,
      },
    }),
    // Nurses do NOT call the media API — their 5 & 30 Day form is surfaced
    // through the consent forms API with an inline nurse filter on the backend.
    enabled: !!objectId && !viewMode && !isNurse,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
  });


  // Fetch consent forms signed by guardian (Guardian tab)
  const { data: guardianFormsData, isLoading: isGuardianFormsLoading } = useQuery({
    ...listConsentFormsOptions({
      query: {
        resident_uuid: residentUuid,
        signer_type: "GUARDIAN" as any,
      },
    }),
    enabled: !!residentUuid && consentTab === "guardian",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    select: (data: any) => {
      if (data?.data && Array.isArray(data.data)) return data.data;
      if (Array.isArray(data)) return data;
      if (data?.results && Array.isArray(data.results)) return data.results;
      return [];
    },
  });

  // Fetch consent forms signed by agent (Agent tab)
  const { data: agentFormsData, isLoading: isAgentFormsLoading } = useQuery({
    ...listConsentFormsOptions({
      query: {
        resident_uuid: residentUuid,
        signer_type: "AGENT" as any,
      },
    }),
    enabled: !!residentUuid && consentTab === "agent",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    select: (data: any) => {
      if (data?.data && Array.isArray(data.data)) return data.data;
      if (Array.isArray(data)) return data;
      if (data?.results && Array.isArray(data.results)) return data.results;
      return [];
    },
  });

  // Helper function to extract backend message
  const getBackendMessage = (data: unknown): string | undefined => {
    const responseData = data as any;
    return (
      responseData?.message ??
      responseData?.data?.message ??
      responseData?.detail ??
      undefined
    );
  };

  // Helper function to extract error message
  const getErrorMessage = (error: unknown): string | undefined => {
    const err = error as AxiosError<any> | any;
    return (
      err?.response?.data?.message ??
      err?.response?.data?.error ??
      err?.response?.data?.detail ??
      err?.data?.message ??
      err?.data?.error ??
      err?.data?.detail ??
      undefined
    );
  };

  // Delete consent form mutation
  const deleteConsentFormMutationHook = useMutation({
    ...(deleteConsentFormMutation() as any),
    onSuccess: (data: unknown) => {
      const backendMessage = getBackendMessage(data);
      if (backendMessage) {
        setSnackbar({
          isOpen: true,
          message: backendMessage,
          status: "success",
        });
      }

      // Invalidate consent forms list to refresh data (only if not in view mode)
      if (residentUuid && !viewMode && !isViewModeRef.current) {
        queryClient.invalidateQueries({
          queryKey: listConsentFormsQueryKey({
            query: {
              resident_uuid: residentUuid,
            },
          }),
        });
        // Refetch the list (only if not in view mode)
        refetchConsentForms();
      }
    },
    onError: (error: AxiosError<any>) => {
      const errorMessage = getErrorMessage(error);
      if (errorMessage) {
        setSnackbar({
          isOpen: true,
          message: errorMessage,
          status: "error",
        });
      }
    },
  });

  // Upload via shared hook — use leads.lead to match the media list query
  const {
    upload: uploadMedia,
    uploadMultiple: uploadMediaMultiple,
    uploadProgress,
    cancelUpload,
  } = useMediaUpload({
    contentTypeApp: "leads",
    contentTypeModel: "lead",
    objectUuid: objectId,
  });

  // Delete media mutation (for uploaded documents)
  const deleteMedia = useMutation({
    ...mediaDeleteDestroyMutation(),
    onSuccess: () => {
      // Invalidate media list query to refresh uploaded documents
      if (objectId) {
        queryClient.invalidateQueries({
          queryKey: mediaListOptions({
            query: {
              content_type: "leads.lead",
              object_uuid: objectId,
            },
          }).queryKey,
        });
      }
      // Also invalidate consent forms to refresh file counts
      if (residentUuid && !viewMode && !isViewModeRef.current) {
        queryClient.invalidateQueries({
          queryKey: listConsentFormsQueryKey({
            query: {
              resident_uuid: residentUuid,
            },
          }),
        });
        refetchConsentForms();
      }
      setSnackbar({
        isOpen: true,
        message: "Document deleted successfully",
        status: "success",
      });
      setDeleteDocumentDialogOpen(false);
      setSelectedDocumentId(null);
      setDeleteMediaHistoryId(null);
      // Close preview dialog if open
      setPreviewDialogOpen(false);
      setPreviewFiles([]);
    },
    onError: () => {
      setSnackbar({
        isOpen: true,
        message: "Failed to delete document",
        status: "error",
      });
    },
  });

  // Share consent form mutation
  const shareConsentFormMutationHook = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(shareConsentFormMutation() as any),
    onSuccess: (data: unknown) => {
      const backendMessage = getBackendMessage(data);
      setSnackbar({
        isOpen: true,
        message: backendMessage || "Form shared successfully",
        status: "success",
      });
      setShareDialogOpen(false);
      setShareFormRow(null);

      // Refetch consent form list so isShared updates immediately
      if (residentUuid && !viewMode && !isViewModeRef.current) {
        queryClient.invalidateQueries({
          queryKey: listConsentFormsQueryKey({
            query: {
              resident_uuid: residentUuid,
            },
          }),
        });
        refetchConsentForms();
      }
    },
    onError: (error: AxiosError<any>) => {
      const errorMessage = getErrorMessage(error);
      setSnackbar({
        isOpen: true,
        message: errorMessage || "Failed to share form",
        status: "error",
      });
    },
  });

  // ---- Menu handlers ----
  const handleMenuClick = useCallback(
    (event: React.MouseEvent<HTMLElement>, row: FormTableRow) => {
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
      setMenuRow(row);
    },
    [],
  );

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setMenuRow(null);
  }, []);

  // Handle share
  const handleShareClick = useCallback(
    (row: FormTableRow) => {
      // Prevent duplicate sharing unless the content changed since last share
      if (row.isShared && !(row as any).contentChangedSinceShare) return;
      handleMenuClose();
      setShareSelectedMode(false);
      setShareFormRow(row);
      // Pre-check both guardian and agent when they exist
      setShareRecipients([
        ...(guardianDetails?.email ? ["guardian" as const] : []),
        ...(agentDetails?.email ? ["agent" as const] : []),
      ]);
      setCustomRecipients([]);
      setShareDialogOpen(true);
    },
    [handleMenuClose, guardianDetails, agentDetails],
  );

  // A row can be (re-)shared: has shareable content AND is either not yet
  // shared or its content changed since the last share.
  const isRowShareable = useCallback(
    (form: any): boolean =>
      canShareConsentForm &&
      !isReadOnly &&
      !(form.isShared && !form.contentChangedSinceShare) &&
      (Boolean(form.hasUploadedFile) ||
        (Boolean(form.consentFormUuid) &&
          (form.consentFormStatus === "COMPLETED" ||
            form.consentFormStatus === "SIGNED") &&
          Boolean(form.canView))),
    [canShareConsentForm, isReadOnly],
  );

  const handleToggleShareRow = useCallback((rowId: number) => {
    setSelectedShareRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  }, []);

  // Open the share dialog in bulk mode for all checked rows
  const handleShareSelectedClick = useCallback(() => {
    if (selectedShareRowIds.size === 0) return;
    setShareSelectedMode(true);
    setShareFormRow(null);
    setShareRecipients([
      ...(guardianDetails?.email ? ["guardian" as const] : []),
      ...(agentDetails?.email ? ["agent" as const] : []),
    ]);
    setCustomRecipients([]);
    setShareDialogOpen(true);
  }, [selectedShareRowIds, guardianDetails, agentDetails]);

  // Validate recipients selected in the share dialog. Returns the cleaned
  // custom email list, or null (with a snackbar shown) when invalid.
  const validateShareRecipients = useCallback((): string[] | null => {
    const validCustom = customRecipients.filter(
      (r) => r.email.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email.trim()),
    );
    const hasInvalidCustom = customRecipients.some(
      (r) => r.email.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email.trim()),
    );
    if (hasInvalidCustom) {
      setSnackbar({ isOpen: true, message: "Please enter valid email addresses.", status: "error" });
      return null;
    }
    if (shareRecipients.length === 0 && validCustom.length === 0) {
      setSnackbar({
        isOpen: true,
        message: "Please select at least one recipient",
        status: "error",
      });
      return null;
    }
    return validCustom.map((r) => r.email.trim());
  }, [customRecipients, shareRecipients]);

  // Core share for ONE row to the selected portal roles + custom emails.
  // Throws on failure so callers (single & bulk share) can aggregate results.
  const shareRowToRecipients = useCallback(
    async (
      form: any,
      roles: ("guardian" | "agent")[],
      customEmails: string[],
    ) => {
      const uploadedMediaIds = (
        Array.isArray(form.allMatchingMedia)
          ? form.allMatchingMedia.map((media: any) => media.id).filter(Boolean)
          : []
      ) as string[];
      const mediaIdsForShare = uploadedMediaIds.length
        ? uploadedMediaIds
        : form.mediaId
        ? [form.mediaId]
        : [];
      let mediaUuidForShare = form.mediaId || undefined;
      let pdfBase64ForShare: string | undefined;
      let pdfFilenameForShare: string | undefined;

      // Pre-fetch form data once for PDF generation (used by both portal and custom shares)
      if (form.consentFormUuid && (roles.length > 0 || customEmails.length > 0)) {
        try {
          const formData = await queryClient.fetchQuery({
            ...getConsentFormDetailOptions({
              path: { uuid: form.consentFormUuid },
              query: { history: false },
            }),
          });
          const responseData = (formData as Record<string, unknown>)?.data ?? formData;
          const rd = responseData as Record<string, unknown>;
          const entries = (rd?.entries as Record<string, unknown>[]) || [];
          const latestEntry = entries[0] || null;
          const sharedFormJson = (
            (latestEntry as Record<string, unknown>)?.form_json ??
            rd?.form_json ??
            {}
          ) as Record<string, unknown>;
          const sharedFormName = form.formName || form.documentName || "Form";

          const pdfBlob = await getConsentFormPdfBlob(sharedFormName, sharedFormJson, residentName, false);
          if (pdfBlob instanceof Blob) {
            pdfBase64ForShare = await blobToBase64(pdfBlob);
            pdfFilenameForShare = getConsentFormPdfFileName(sharedFormName);
          }
        } catch {
          // PDF generation failed — continue without PDF
        }

        // If custom recipients need PDF but it failed, abort early
        if (customEmails.length > 0 && !pdfBase64ForShare) {
          throw new Error("PDF generator not available for this form.");
        }
      }

      // ── STEP 1: Portal flow — always run for every checked guardian / agent ──
      for (const role of roles) {
        const recipient = role === "guardian" ? guardianDetails : agentDetails;
        if (!recipient?.email) continue;

        // Uploaded files are shared whenever present — including rows that
        // ALSO have a fillable consent form (previously the uploads were
        // silently skipped in that case and never reached the portal).
        if (form.hasUploadedFile && mediaIdsForShare.length > 0) {
          await client.post({
            url: "/api/document/media/{media_uuid}/share/",
            path: { media_uuid: mediaIdsForShare[0] },
            body: {
              recipient_email: recipient.email,
              recipient_name: recipient.name || role,
              recipient_type: role.toUpperCase(),
              resident_name: residentName || "",
              media_uuids: mediaIdsForShare,
            },
            headers: { "Content-Type": "application/json" },
          });
        }
        if (form.consentFormUuid) {
          // Fillable form share — include PDF so backend creates a Media record
          // that becomes visible in the guardian/agent portal Documents section
          const shareResponse = await shareConsentFormMutationHook.mutateAsync({
            path: { uuid: form.consentFormUuid },
            body: {
              recipient_email: recipient.email,
              recipient_name: recipient.name || role,
              recipient_type: role.toUpperCase() as "GUARDIAN" | "AGENT",
              ...(!pdfBase64ForShare && mediaUuidForShare ? {
                media_uuid: mediaUuidForShare,
              } : {}),
              ...(pdfBase64ForShare ? {
                pdf_base64: pdfBase64ForShare,
                pdf_filename: pdfFilenameForShare,
              } : {}),
            },
          } as any);
          mediaUuidForShare =
            (shareResponse as any)?.data?.media_uuid || mediaUuidForShare;
        }
      }

      // ── STEP 2: Custom email flow — always run when custom addresses are present ──
      if (customEmails.length > 0) {
        // Send uploaded files as attachments whenever present (also for rows
        // that additionally have a fillable consent form)
        if (form.hasUploadedFile && mediaIdsForShare.length > 0) {
          await client.post({
            url: "/api/document/media/{media_uuid}/share/",
            path: { media_uuid: mediaIdsForShare[0] },
            body: {
              recipient_emails: customEmails,
              recipient_type: "CUSTOM",
              resident_name: residentName || "",
              media_uuids: mediaIdsForShare,
            },
            headers: { "Content-Type": "application/json" },
          });
        }
        if (form.consentFormUuid) {
          await shareConsentFormMutationHook.mutateAsync({
            path: { uuid: form.consentFormUuid },
            body: {
              recipient_emails: customEmails,
              recipient_type: "CUSTOM",
              media_uuid: mediaUuidForShare,
              ...(!mediaUuidForShare ? {
                pdf_base64: pdfBase64ForShare,
                pdf_filename: pdfFilenameForShare,
              } : {}),
            },
          } as any);
        }
      }
    },
    [
      guardianDetails,
      agentDetails,
      shareConsentFormMutationHook,
      queryClient,
      residentName,
    ],
  );

  // Human-readable recipient names for success messages
  const buildRecipientNames = useCallback(
    (customEmails: string[]): string[] => [
      ...shareRecipients.map((r) =>
        r === "guardian"
          ? (guardianDetails?.name || guardianDetails?.email || "Guardian")
          : (agentDetails?.name || agentDetails?.email || "Area Agency"),
      ),
      ...customEmails,
    ],
    [shareRecipients, guardianDetails, agentDetails],
  );

  const handleShareConfirm = useCallback(async () => {
    const form = shareFormRow as any;

    // Allow sharing if there's a consentFormUuid OR if there are uploaded files
    if (!form?.consentFormUuid && !form?.hasUploadedFile) {
      setSnackbar({
        isOpen: true,
        message: "No form or document available to share",
        status: "error",
      });
      return;
    }

    const customEmails = validateShareRecipients();
    if (customEmails === null) return;

    setIsShareProcessing(true);
    try {
      await shareRowToRecipients(form, shareRecipients, customEmails);

      setSnackbar({
        isOpen: true,
        message: `Document shared successfully with ${buildRecipientNames(customEmails).join(", ")}.`,
        status: "success",
      });
      queryClient.invalidateQueries({ queryKey: mediaListQueryKey() });
      queryClient.invalidateQueries({ queryKey: listConsentFormsQueryKey() });
      setShareDialogOpen(false);
      setShareFormRow(null);
    } catch (error) {
      console.error("Share failed:", error);
      setSnackbar({
        isOpen: true,
        message:
          (error instanceof Error && error.message) ||
          "Failed to share form. Please try again.",
        status: "error",
      });
    } finally {
      setIsShareProcessing(false);
    }
  }, [
    shareFormRow,
    shareRecipients,
    validateShareRecipients,
    shareRowToRecipients,
    buildRecipientNames,
    queryClient,
  ]);

  // Handle view document - opens ViewDocumentsDialog with all files
  const handleViewDocument = (formId: number) => {
    const form = enrichedData.find((f) => f.id === formId);
    if (!form) return;
    
    // Get all matching media files for this form
    const allMatchingMedia = (form as any).allMatchingMedia || [];
    
    if (allMatchingMedia.length > 0) {
      // Convert all media files to ViewDocumentFile format
      const files: ViewDocumentFile[] = allMatchingMedia.map((m: any) => ({
        id: String(m.id),
        file_url: m.file_url,
        original_filename: m.original_filename || form.formName,
        file_size: m.file_size,
        mime_type: m.mime_type || (m.file_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
          ? "image/" + (m.file_url.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || "jpeg")
          : "application/pdf"),
        file_type: m.file_type,
      }));
      setPreviewFiles(files);
      setPreviewDialogOpen(true);
    } else if (form.fileUrl) {
      // Fallback to single file if no allMatchingMedia
      const file: ViewDocumentFile = {
        id: form.mediaId || String(form.id),
        file_url: form.fileUrl,
        original_filename: form.uploadDocument ?? form.documentName ?? form.formName,
        mime_type: form.fileUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
          ? "image/" + (form.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || "jpeg")
          : "application/pdf",
      };
      setPreviewFiles([file]);
      setPreviewDialogOpen(true);
    }
  };

  // Handle print document (same as DocumentsSection)
  const handlePrintDocument = (formId: number) => {
    const form = enrichedData.find((f) => f.id === formId);
    if (!form?.fileUrl) return;
    const win = window.open(form.fileUrl, "_blank", "noopener,noreferrer");
    win?.print();
  };

  // Handle delete document
  const handleDeleteDocument = (formId: number) => {
    setSelectedDocumentId(formId);
    setDeleteDocumentDialogOpen(true);
  };

  // Handle delete document from preview dialog
  const handleDeleteDocumentFromPreview = (file: ViewDocumentFile) => {
    // Set the media ID directly for deletion
    if (file.id) {
      setDeleteMediaHistoryId(String(file.id));
      setSelectedDocumentId(null);
      setDeleteDocumentDialogOpen(true);
    }
  };

  // Handle upload — supports single file or multiple files
  const handleUpload = async (formId: number, files: File | File[]) => {
    const form = enrichedData.find((f) => f.id === formId);
    if (!form) return;

    if (!objectId) {
      setSnackbar({
        isOpen: true,
        message: "Resident ID is required for upload",
        status: "error",
      });
      return;
    }

    const fileArray = Array.isArray(files) ? files : [files];
    if (fileArray.length === 0) return;

    // Check file size FIRST — alert dialog (same as Appointment mark-as-completed)
    const oversized = fileArray.find((f) => f.size > MAX_FILE_SIZE);
    if (oversized) {
      setAlertDialog({ open: true, message: ERROR_MESSAGE_FILE_TOO_LARGE });
      return;
    }

    // Then validate file formats — snackbar only for format issues
    const allowedExt = /\.(pdf|png|jpg|jpeg)$/i;
    const allowedMime = /^(application\/pdf|image\/png|image\/jpe?g)$/i;
    const invalid = fileArray.find((f) => {
      const name = f.name?.toLowerCase() || "";
      return !allowedExt.test(name) && !allowedMime.test(f.type || "");
    });
    if (invalid) {
      setSnackbar({
        isOpen: true,
        message: INVALID_FORMAT_MESSAGE,
        status: "error",
      });
      return;
    }

    try {
      setUploadingFormIds((prev) => new Set(prev).add(formId));

      if (fileArray.length === 1) {
        await uploadMedia(fileArray[0], {
          description: form.formName,
        });
      } else {
        await uploadMediaMultiple(fileArray, {
          description: form.formName,
        });
      }

      // Invalidate media list query to refresh uploaded documents
      if (objectId) {
        await queryClient.invalidateQueries({
          queryKey: mediaListOptions({
            query: {
              content_type: "leads.lead",
              object_uuid: objectId,
            },
          }).queryKey,
        });
      }
      // Only invalidate and refetch if not in view mode
      if (residentUuid && !viewMode && !isViewModeRef.current) {
        await queryClient.invalidateQueries({
          queryKey: listConsentFormsQueryKey({
            query: {
              resident_uuid: residentUuid,
            },
          }),
        });
        await refetchConsentForms();
      }
      const count = fileArray.length;
      setSnackbar({
        isOpen: true,
        message: count === 1
          ? "Document uploaded successfully"
          : `${count} documents uploaded successfully`,
        status: "success",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      if (error?.message === UPLOAD_CANCELLED_MESSAGE) {
        setSnackbar({
          isOpen: true,
          message: "Upload cancelled",
          status: "error",
        });
        return;
      }
      const backendError = error?.response?.data?.detail || error?.response?.data?.message || error?.message || "";
      const isSizeError = typeof backendError === 'string' && backendError.toLowerCase().includes("size");

      if (isSizeError) {
        setAlertDialog({ open: true, message: ERROR_MESSAGE_FILE_TOO_LARGE });
      } else {
        setSnackbar({
          isOpen: true,
          message: "Failed to upload document. Please try again.",
          status: "error",
        });
      }
    } finally {
      setUploadingFormIds((prev) => {
        const next = new Set(prev);
        next.delete(formId);
        return next;
      });
    }
  };

  const handleUploadClick = (formId: number) => {
    const input = fileInputRefs.current[formId];
    if (input) {
      input.click();
    }
  };

  const handleFileChange = async (
    formId: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    await handleUpload(formId, files);

    if (event.target) {
      event.target.value = "";
    }
  };

  // Sync ref with viewMode state
  useEffect(() => {
    isViewModeRef.current = viewMode;
  }, [viewMode]);

  // Cancel any pending list API queries when entering view mode
  useEffect(() => {
    if (viewMode && residentUuid) {
      // Cancel any pending queries for the list API when in view mode
      queryClient.cancelQueries({
        queryKey: listConsentFormsQueryKey({
          query: {
            resident_uuid: residentUuid,
          },
        }),
      });
    }
  }, [viewMode, residentUuid, queryClient]);

  // NOTE: Removed useEffect that refetches when drawer opens
  // List API should ONLY be called after actions (save, delete, etc.), not when opening drawers

  // Close drawer - don't refetch here, only refetch after actions (save, delete, etc.)
  const handleDrawerClose = (formName: string) => {
    setOpenFormDrawer(false);
    setSelectedForm(null);
    isViewModeRef.current = false;
    setViewMode(false);
    setIsHrstEditMode(false);
    // NOTE: Removed refetch here - list API should only be called after actions (save, delete, etc.)
  };

  // Helper function to calculate days until due date
  const calculateDaysUntilDue = (
    nextDueAt: string | null | undefined,
  ): number | null => {
    if (!nextDueAt) return null;
    try {
      const dueDate = dayjs(nextDueAt);
      const today = dayjs();
      const daysDiff = dueDate.diff(today, "day");
      return daysDiff;
    } catch (error) {
      console.error("Error calculating days until due:", error);
      return null;
    }
  };

  // Helper function to format refill info
  const formatRefillInfo = (
    daysUntilDue: number | null,
  ): { text: string; isUrgent: boolean } | null => {
    if (daysUntilDue === null) return null;

    if (daysUntilDue < 0) {
      // Due date has passed
      return null;
    } else if (daysUntilDue === 0) {
      return { text: "Refill Today", isUrgent: true };
    } else if (daysUntilDue === 1) {
      return { text: "Refill Tomorrow", isUrgent: true };
    } else {
      return {
        text: `Refill in ${daysUntilDue} Days`,
        isUrgent: daysUntilDue <= 7,
      };
    }
  };

  // Create a map of form_code to API data for fast lookup (deduplicate by form_code)
  const apiFormMap = useMemo(() => {
    if (!consentFormsResponse || !Array.isArray(consentFormsResponse)) {
      return new Map();
    }
    // Deduplicate: if multiple forms have same form_code, keep the latest one (by created_at or updated_at)
    const formMap = new Map();
    consentFormsResponse.forEach((item: any) => {
      const existing = formMap.get(item.form_code);
      if (!existing) {
        formMap.set(item.form_code, item);
      } else {
        // Keep the one with the latest date
        const existingDate = existing.updated_at || existing.created_at;
        const currentDate = item.updated_at || item.created_at;
        if (
          currentDate &&
          (!existingDate || dayjs(currentDate).isAfter(dayjs(existingDate)))
        ) {
          formMap.set(item.form_code, item);
        }
      }
    });
    return formMap;
  }, [consentFormsResponse]);

  // Enrich static data with API data (deduplicate by form_code) and media data
  const enrichedData = useMemo(() => {
    // Get media list for uploaded documents
    const mediaList = mediaResponse?.results ?? [];

    // Track which form_codes we've already processed to avoid duplicates
    const processedFormCodes = new Set<string>();

    return formsTableData
      .filter((staticForm) => {
        // Nurses can only see the 5 and 30 Day Nursing Transition Evaluation Form
        if (isNurse && staticForm.id !== 25) return false;

        const formCode = formNameToCodeMap[staticForm.formName];
        // Only include if we haven't processed this form_code yet
        if (formCode && processedFormCodes.has(formCode)) {
          return false;
        }
        if (formCode) {
          processedFormCodes.add(formCode);
        }
        return true;
      })
      .map((staticForm) => {
        const formCode = formNameToCodeMap[staticForm.formName];
        const apiForm = formCode ? apiFormMap.get(formCode) : null;

        // Find ALL matching media by description (form name) — use filter, not find
        const allMatchingMedia = mediaList.filter(
          (m: any) =>
            m.description?.trim().toLowerCase() ===
            staticForm.formName.trim().toLowerCase() &&
            !m.metadata?.consent_form_uuid,
        );
        // Most recent media entry (for display in the main row)
        const media = allMatchingMedia.length > 0 ? allMatchingMedia[0] : null;

        // Check if this is an upload-only repeating form
        const isUploadRepeating =
          staticForm.documentType === "upload" && staticForm.uploadType === "repeating";

        if (!apiForm) {
          // No API match, but check if there's uploaded media
          const staticFormCopy: FormTableRow & {
            consentFormUuid?: string;
            consentFormStatus?: string;
            apiStatus?: string;
            nextDueAt?: string | null;
            daysUntilDue?: number | null;
            hasUploadedFile?: boolean;
            uploadDocument?: string | null;
            fileUrl?: string | null;
            mediaId?: string | null;
            allMatchingMedia?: any[];
            fileCount?: number;
          } = { ...staticForm };

          staticFormCopy.canView = false;
          staticFormCopy.canDelete = false;
          staticFormCopy.hasHistory = false;
          staticFormCopy.canPrint = false;
          staticFormCopy.allMatchingMedia = allMatchingMedia;
          staticFormCopy.fileCount = allMatchingMedia.length;

          // If there's uploaded media, show it and use media's updated date
          if (media) {
            staticFormCopy.hasUploadedFile = true;
            staticFormCopy.hasHistory = true;
            staticFormCopy.uploadDocument = media.original_filename;
            staticFormCopy.fileUrl = media.file_url;
            staticFormCopy.mediaId = media.id;
            staticFormCopy.canView = true;
            staticFormCopy.canDelete = true;
            // Use media's updated_at (or uploaded_at as fallback) for lastUpdated
            const mediaDate =
              (media as any).updated_at ?? (media as any).uploaded_at;
            staticFormCopy.isShared = !!(media as any).metadata?.shared_at;
            // Re-share eligibility: file replaced/updated after the last share
            // (a brand-new upload has no shared_at, so isShared is false anyway)
            const mediaSharedAtRaw = (media as any).metadata?.shared_at ?? null;
            (staticFormCopy as any).contentChangedSinceShare =
              !!mediaSharedAtRaw &&
              !!mediaDate &&
              dayjs(mediaDate).isAfter(dayjs(mediaSharedAtRaw));
            if (mediaDate) {
              staticFormCopy.lastUpdated = formatLastUpdated(mediaDate);
            } else {
              staticFormCopy.lastUpdated = "—";
            }
            // If documentType is "upload", change it to show uploaded file
            if (staticFormCopy.documentType === "upload") {
              staticFormCopy.documentType = "file";
              staticFormCopy.documentName = media.original_filename;
            }
          } else {
            staticFormCopy.lastUpdated = "—";
          }

          return staticFormCopy;
        }

        // API match found - enrich with API data
        const enriched: FormTableRow & {
          consentFormUuid?: string;
          consentFormStatus?: string;
          apiStatus?: string;
          nextDueAt?: string | null;
          daysUntilDue?: number | null;
          hasUploadedFile?: boolean;
          uploadDocument?: string | null;
          fileUrl?: string | null;
          mediaId?: string | null;
          allMatchingMedia?: any[];
          fileCount?: number;
          hrstFormYear?: number | null;  // year saved inside form_json for HRST
        } = { ...staticForm };

        enriched.allMatchingMedia = allMatchingMedia;
        enriched.fileCount = allMatchingMedia.length;

        // Attach uuid and status from API for draft navigation
        enriched.consentFormUuid = apiForm.uuid;
        enriched.consentFormStatus = apiForm.status;
        enriched.nextDueAt = apiForm.next_due_at || null;
        enriched.isShared = !!apiForm.shared_at || !!media?.metadata?.shared_at;
        // Re-share eligibility: the form (or its uploaded file) changed after
        // the last share. Backend stamps shared_at on every share, so
        // updated_at > shared_at means content was edited since then.
        {
          const changedAfterShare = (
            contentRaw?: string | null,
            sharedRaw?: string | null,
          ) =>
            !!sharedRaw &&
            !!contentRaw &&
            dayjs(contentRaw).isAfter(dayjs(sharedRaw));
          const formContentRaw = apiForm.updated_at ?? apiForm.created_at ?? null;
          const mediaContentRaw = media
            ? ((media as any).updated_at ?? (media as any).uploaded_at ?? null)
            : null;
          (enriched as any).contentChangedSinceShare =
            changedAfterShare(formContentRaw, apiForm.shared_at ?? null) ||
            changedAfterShare(
              mediaContentRaw,
              (media as any)?.metadata?.shared_at ?? null,
            );
        }

        // For HRST: capture the year stored inside form_json so we can decide
        // whether to show "Edit" (current year) or "Fill Form" (past year → new year needed)
        if (staticForm.formName === "HRST monthly tracker") {
          const yr = Number((apiForm as any)?.form_json?.year);
          enriched.hrstFormYear = !isNaN(yr) && yr > 0 ? yr : null;
        }

        // Calculate days until due date
        enriched.daysUntilDue = calculateDaysUntilDue(enriched.nextDueAt);

        // Enable view/delete/history only if status is COMPLETED, DRAFT, or SIGNED
        const isFormActive =
          apiForm.status === "COMPLETED" || apiForm.status === "DRAFT" || apiForm.status === "SIGNED";
        enriched.canView = isFormActive;
        enriched.canDelete = isFormActive;
        enriched.hasHistory = isFormActive;
        // Only allow printing when form is completed or signed
        const isFormFilled = apiForm.status === "COMPLETED" || apiForm.status === "SIGNED";
        enriched.canPrint = isFormFilled;

        // Update lastUpdated - prioritize media date if uploaded document exists
        // - If media exists → use media.updated_at (or uploaded_at as fallback)
        // - Otherwise → use consent form API date (updated_at ?? created_at)
        let dateToUse: string | null = null;
        if (media) {
          // If there's uploaded media, use media's updated date
          dateToUse =
            (media as any).updated_at ?? (media as any).uploaded_at ?? null;
        } else {
          // Use consent form API date
          dateToUse = apiForm.updated_at ?? apiForm.created_at ?? null;
        }

        if (dateToUse) {
          enriched.lastUpdated = formatLastUpdated(dateToUse);
        } else {
          // If no date available, show "—"
          enriched.lastUpdated = "—";
        }

        // If there's uploaded media, attach it
        if (media) {
          enriched.hasUploadedFile = true;
          enriched.uploadDocument = media.original_filename;
          enriched.fileUrl = media.file_url;
          enriched.mediaId = media.id;
          // If documentType is "upload", change it to show uploaded file
          if (enriched.documentType === "upload") {
            enriched.documentType = "file";
            enriched.documentName = media.original_filename;
          }
        }

        // Update documentType and button text based on status and due date
        if (apiForm.status === "SIGNED") {
          // Signed by guardian/agent — show as filled
          enriched.documentType = "filled";
        } else if (apiForm.status === "COMPLETED") {
          // Check if due date has passed
          if (enriched.daysUntilDue !== null && enriched.daysUntilDue < 0) {
            // Due date passed, change to fillForm
            enriched.documentType = "fillForm";
            enriched.apiStatus = "DUE";
          } else {
            // Still within due date, show as filled
            enriched.documentType = "filled";
          }
        } else if (apiForm.status === "DRAFT") {
          // Keep fillForm type but we'll change button text in renderDocumentsCell
          enriched.documentType = "fillForm";
          // Store status for button text rendering
          enriched.apiStatus = "DRAFT";
        } else if (!apiForm.status || apiForm.status === null) {
          // If status is null/undefined, show fillForm button
          enriched.documentType = "fillForm";
          enriched.apiStatus = "DUE";
        } else if (
          enriched.daysUntilDue !== null &&
          enriched.daysUntilDue < 0
        ) {
          // If next due date has passed (less than 0), show fillForm button regardless of status
          enriched.documentType = "fillForm";
          enriched.apiStatus = "DUE";
        }
        // For other statuses, keep static default

        return enriched;
      });
  }, [apiFormMap, mediaResponse, isNurse]);

  // ---- Media-based history handlers (for upload-only repeating forms) ----
  const handleOpenMediaHistory = useCallback(
    (formId: number) => {
      const form = enrichedData.find((f) => f.id === formId);
      if (!form) return;

      const mediaList = mediaResponse?.results ?? [];
      const entries: MediaHistoryEntry[] = mediaList
        .filter(
          (m: any) =>
            m.description?.trim().toLowerCase() ===
            form.formName.trim().toLowerCase(),
        )
        .map((m: any) => {
          const rawDate = m.updated_at ?? m.uploaded_at ?? "";
          return {
            mediaId: String(m.id),
            fileName: m.original_filename ?? "Unknown",
            uploadDate: formatLastUpdated(rawDate),
            rawDate,
            fileUrl: m.file_url,
            mimeType: m.mime_type,
          };
        })
        .sort((a: MediaHistoryEntry, b: MediaHistoryEntry) =>
          b.rawDate.localeCompare(a.rawDate),
        );

      setMediaHistoryFormName(form.formName);
      setMediaHistoryEntries(entries);
      setMediaHistoryDrawerOpen(true);
    },
    [enrichedData, mediaResponse],
  );

  const handleViewMediaHistoryEntry = useCallback(
    (entry: MediaHistoryEntry) => {
      setPreviewFiles([
        {
          id: entry.mediaId,
          file_url: entry.fileUrl,
          original_filename: entry.fileName,
          mime_type: entry.mimeType ?? undefined,
          file_type: entry.mimeType ?? undefined,
        },
      ]);
      setPreviewDialogOpen(true);
    },
    [],
  );

  const handlePrintMediaHistoryEntry = useCallback(
    (entry: MediaHistoryEntry) => {
      const win = window.open(entry.fileUrl, "_blank", "noopener,noreferrer");
      win?.print();
    },
    [],
  );

  const handleDeleteMediaHistoryEntry = useCallback((mediaId: string) => {
    setDeleteMediaHistoryId(mediaId);
    setDeleteDocumentDialogOpen(true);
  }, []);

  // Refresh media history entries when mediaResponse changes while drawer is open
  useEffect(() => {
    if (!mediaHistoryDrawerOpen || !mediaHistoryFormName) return;

    const mediaList = mediaResponse?.results ?? [];
    const entries: MediaHistoryEntry[] = mediaList
      .filter(
        (m: any) =>
          m.description?.trim().toLowerCase() ===
          mediaHistoryFormName.trim().toLowerCase(),
      )
      .map((m: any) => {
        const rawDate = m.updated_at ?? m.uploaded_at ?? "";
        return {
          mediaId: String(m.id),
          fileName: m.original_filename ?? "Unknown",
          uploadDate: formatLastUpdated(rawDate),
          rawDate,
          fileUrl: m.file_url,
          mimeType: m.mime_type,
        };
      })
      .sort((a: MediaHistoryEntry, b: MediaHistoryEntry) =>
        b.rawDate.localeCompare(a.rawDate),
      );
    setMediaHistoryEntries(entries);
  }, [mediaResponse, mediaHistoryDrawerOpen, mediaHistoryFormName]);

  const filteredData = enrichedData.filter((form) => {
    if (!searchQuery) return true;
    // Preserve spaces in search - don't trim
    const searchTerm = searchQuery.toLowerCase();
    return form.formName.toLowerCase().includes(searchTerm);
  });

  // Rows currently eligible for bulk sharing
  const shareableRows = useMemo(
    () => enrichedData.filter((form) => isRowShareable(form)),
    [enrichedData, isRowShareable],
  );

  // Drop any checked ids that became ineligible (e.g. just shared, deleted)
  useEffect(() => {
    setSelectedShareRowIds((prev) => {
      const eligibleIds = new Set(shareableRows.map((f) => f.id));
      const next = new Set([...prev].filter((id) => eligibleIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [shareableRows]);

  const allShareableSelected =
    shareableRows.length > 0 &&
    shareableRows.every((f) => selectedShareRowIds.has(f.id));

  const handleToggleSelectAllShareable = useCallback(() => {
    setSelectedShareRowIds((prev) => {
      if (shareableRows.length === 0) return prev;
      const allSelected = shareableRows.every((f) => prev.has(f.id));
      return allSelected
        ? new Set<number>()
        : new Set(shareableRows.map((f) => f.id));
    });
  }, [shareableRows]);

  // Bulk share: share every checked row to the selected recipients, then
  // show one summary snackbar (with failed form names on partial failure).
  const handleShareSelectedConfirm = useCallback(async () => {
    const selectedForms = enrichedData.filter(
      (f) => selectedShareRowIds.has(f.id) && isRowShareable(f),
    );
    if (selectedForms.length === 0) {
      setSnackbar({
        isOpen: true,
        message: "No forms selected to share",
        status: "error",
      });
      return;
    }

    const customEmails = validateShareRecipients();
    if (customEmails === null) return;

    setIsShareProcessing(true);
    const failedForms: string[] = [];
    for (const form of selectedForms) {
      try {
        await shareRowToRecipients(form, shareRecipients, customEmails);
      } catch (error) {
        console.error(`Share failed for ${form.formName}:`, error);
        failedForms.push(form.formName);
      }
    }
    setIsShareProcessing(false);

    queryClient.invalidateQueries({ queryKey: mediaListQueryKey() });
    queryClient.invalidateQueries({ queryKey: listConsentFormsQueryKey() });
    setShareDialogOpen(false);
    setShareSelectedMode(false);
    setSelectedShareRowIds(new Set());

    const sharedCount = selectedForms.length - failedForms.length;
    if (failedForms.length === 0) {
      setSnackbar({
        isOpen: true,
        message: `${sharedCount} document${sharedCount === 1 ? "" : "s"} shared successfully with ${buildRecipientNames(customEmails).join(", ")}.`,
        status: "success",
      });
    } else if (sharedCount > 0) {
      setSnackbar({
        isOpen: true,
        message: `Shared ${sharedCount} of ${selectedForms.length} documents. Failed: ${failedForms.join(", ")}`,
        status: "error",
      });
    } else {
      setSnackbar({
        isOpen: true,
        message: "Failed to share documents. Please try again.",
        status: "error",
      });
    }
  }, [
    enrichedData,
    selectedShareRowIds,
    isRowShareable,
    validateShareRecipients,
    shareRowToRecipients,
    shareRecipients,
    buildRecipientNames,
    queryClient,
  ]);

  // Build rows for the active signed-forms tab (Guardian or Agent).
  // Always shows the 4 lead-creation forms; names have NO signer suffix since the tab label is enough.
  const guardianAgentRows = useMemo<SignedFormRow[]>(() => {
    if (consentTab !== "guardian" && consentTab !== "agent") return [];

    const isGuardian = consentTab === "guardian";
    const signerType: "GUARDIAN" | "AGENT" = isGuardian ? "GUARDIAN" : "AGENT";
    const apiData = isGuardian ? guardianFormsData : agentFormsData;
    const signerName = isGuardian
      ? (guardianDetails?.name || "Guardian")
      : (agentDetails?.name || "Agent");

    const apiMap = new Map<string, any>();
    (apiData || []).forEach((form: any) => {
      if (form.form_code) apiMap.set(form.form_code, form);
    });

    return LEAD_FORMS_STATIC.map(({ formName, formCode }) => {
      const apiForm = apiMap.get(formCode);
      const isActive =
        apiForm &&
        (apiForm.status === "COMPLETED" ||
          apiForm.status === "SIGNED" ||
          apiForm.status === "DRAFT");
      const isFilled =
        apiForm && (apiForm.status === "COMPLETED" || apiForm.status === "SIGNED");
      return {
        id: `${consentTab}-${formCode}`,
        displayName: formName,   // plain name — no "(Guardian)" / "(Agent)" suffix
        rawFormName: formName,
        signerType,
        signerName,
        status: apiForm?.status || "NOT FILLED",
        lastUpdated: formatLastUpdated(apiForm?.updated_at || apiForm?.created_at),
        consentFormUuid: apiForm?.uuid || "",
        canView: !!isActive,
        canPrint: !!isFilled,
      };
    });
  }, [consentTab, guardianFormsData, agentFormsData, guardianDetails, agentDetails]);

  const totalRecords = filteredData.length;
  const totalPages = Math.ceil(totalRecords / currentPageSize);
  const startIndex = currentPage * currentPageSize;
  const endIndex = startIndex + currentPageSize;
  const currentData: FormTableRow[] = filteredData.slice(startIndex, endIndex);

  React.useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery]);

  const handlePageChange = (_: any, newPage: number) => {
    setCurrentPage(newPage);
    onPageChange?.(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setCurrentPageSize(newSize);
    setCurrentPage(0);
    onPageChange?.(0);
    onPageSizeChange?.(newSize);
  };

  const handleFillForm = (
    formId: number,
    row?: FormTableRow & {
      consentFormUuid?: string;
      consentFormStatus?: string;
    },
  ) => {
    const form =
      row ||
      enrichedData.find((f) => f.id === formId) ||
      formsTableData.find((f) => f.id === formId);
    if (form) {
      setSelectedForm(form);
      setViewMode(false);
      // Transition: React waits for the lazy drawer chunk instead of
      // flashing the fallback, so the drawer animates in exactly once
      React.startTransition(() => setOpenFormDrawer(true));
      // NOTE: Removed refetch here - list API should only be called after actions (save, delete, etc.)
    }
    onFillForm?.(formId);
  };

  const handlePrint = async (
    row: FormTableRow & {
      consentFormUuid?: string;
      consentFormStatus?: string;
    },
  ) => {
    if (!row.consentFormUuid) {
      setSnackbar({
        isOpen: true,
        message: "Form data not available for printing",
        status: "error",
      });
      return;
    }

    try {
      // Fetch form data
      const formData = await queryClient.fetchQuery({
        ...getConsentFormDetailOptions({
          path: {
            uuid: row.consentFormUuid,
          },
          query: {
            history: false,
          },
        }),
      });

      // Extract form_json from response
      const responseData = (formData as any)?.data ?? formData;
      const entries = responseData?.entries || [];
      const latestEntry = entries[0] || null;
      const formJson = latestEntry?.form_json || responseData?.form_json || {};

      const printedPdf = await getConsentFormPdfBlob(
        row.formName,
        formJson,
        residentName,
        true,
      );
      if (printedPdf) {
        onPrint?.(row.id);
        return;
      }

      // // Handle Medication Disposal Sheet with PDF generation
      // if (row.formName === "Medication Disposal Sheet") {
      //   const { generateMedicationDisposalSheetPDF } =
      //     await import("./medication-disposal-sheet/utils/generateMedicationDisposalSheetPDF");
      //   generateMedicationDisposalSheetPDF(formJson, residentName);
      //   onPrint?.(row.id);
      //   return;
      // }

      const currentDateTime = dayjs().format("M/D/YY, h:mm A");

      // Field name mapping with proper spelling
      const getFieldLabel = (fieldName: string, formName: string): string => {
        // Health History Form field mappings
        if (formName === "Health History Form") {
          const healthHistoryMap: Record<string, string> = {
            completedBy: "Completed By",
            relationshipToIndividual: "Relationship to Individual",
            date: "Date",
            name: "Name",
            likesToBeCalled: "Likes to be Called",
            dateOfBirth: "Date of Birth",
            socSec: "Social Security No.",
            religion: "Religion",
            contactNumber: "Phone Number",
            address: "Address",
            healthInsuranceType: "Health Insurance Type",
            healthInsuranceNumber: "Health Insurance Number",
            agencyResponsible: "Agency Responsible",
            agencyContactNumber: "Agency Phone Number",
            agencyPrimaryContact: "Agency Primary Contact",
            agencyPrimaryContactNumber: "Agency Primary Phone Number",
            consentStatus: "Consent Status",
            guardianName: "Guardian Name",
            guardianContactNumber: "Guardian Phone Number",
            resuscitationStatus: "Resuscitation Status",
            comfortCareFormAvailable: "Comfort Care Form Available",
            dnrContactName: "DNR Contact Name",
            dnrContactNumber: "DNR Phone Number",
            advancedDirectives: "Advanced Directives",
            advancedDirectivesName: "Advanced Directives Name",
            advancedDirectivesContact: "Advanced Directives Contact",
            emergencyContact1Name: "Emergency Contact 1 Name",
            emergencyContact1Number: "Emergency Contact 1 Phone Number",
            emergencyContact2Name: "Emergency Contact 2 Name",
            emergencyContact2Number: "Emergency Contact 2 Phone Number",
            medicationsAttachedType: "Medications Attached Type",
            pharmacyName: "Pharmacy Name",
            pharmacyContactNumber: "Pharmacy Phone Number",
            pharmacyAddress: "Pharmacy Address",
            medicationAllergies: "Medication Allergies",
            foodEnvironmentalAllergies: "Food/Environmental Allergies",
            typeOfReaction: "Type of Reaction",
            currentMedicalProblems: "Current Medical Problems",
            communication: "Communication",
            medicationAdministration: "Medication Administration",
            diningEating: "Dining/Eating",
            ambulation: "Ambulation",
            vision: "Vision",
            hearing: "Hearing",
            oralHygiene: "Oral Hygiene",
            oralHygieneSpecial: "Oral Hygiene Special",
            dietTexture: "Diet Texture",
            dietType: "Diet Type",
            toiletingAbility: "Toileting Ability",
            supportiveDevices: "Supportive Devices",
            supportiveDevicesOther: "Supportive Devices Other",
            headOfBedElevated: "Head of Bed Elevated",
            adaptiveEquipment: "Adaptive Equipment",
            adaptiveEquipmentDescription: "Adaptive Equipment Description",
            medicalExamResponse: "Medical Exam Response",
            sedationRequired: "Sedation Required",
            specialPositioning: "Special Positioning",
            doubleStaffingRequired: "Double Staffing Required",
            limitedWaitingPeriods: "Limited Waiting Periods",
            earlyDayAppointments: "Early Day Appointments",
            endOfDayAppointments: "End of Day Appointments",
            specialCommunicationDevice: "Special Communication Device",
            specialCommunicationDeviceType: "Special Communication Device Type",
            painResponse: "Pain Response",
            painResponseUnique: "Pain Response Unique",
            primaryCareName: "Primary Care Name",
            primaryCareContactNumber: "Primary Care Phone Number",
            primaryCareAddress: "Primary Care Address",
            dentalCareName: "Dental Care Name",
            dentalCareContactNumber: "Dental Care Phone Number",
            dentalCareAddress: "Dental Care Address",
            eyeCareName: "Eye Care Name",
            eyeCareContactNumber: "Eye Care Phone Number",
            eyeCareAddress: "Eye Care Address",
            subspecialists: "Subspecialists",
            livingStatus: "Living Status",
            livingStatusOther: "Living Status Other",
            homeCareContactName: "Home Care Contact Name",
            homeCareContactNumber: "Home Care Phone Number",
            maritalStatus: "Marital Status",
            workDayProgramStatus: "Work/Day Program Status",
            nursingSupports: "Nursing Supports",
            tetanusDate: "Tetanus Date",
            tetanusStatus: "Tetanus Status",
            fluShotDate: "Flu Shot Date",
            fluShotStatus: "Flu Shot Status",
            pneumovaxDate: "Pneumovax Date",
            pneumovaxStatus: "Pneumovax Status",
            hepatitisBDate: "Hepatitis B Date",
            hepatitisBStatus: "Hepatitis B Status",
            otherVaccinationsDate: "Other Vaccinations Date",
            otherVaccinationsSpecify: "Other Vaccinations Specify",
            otherVaccinationsStatus: "Other Vaccinations Status",
            ppdPositiveTest: "PPD Positive Test",
            ppdTreatmentGiven: "PPD Treatment Given",
            ppdTreatmentExplain: "PPD Treatment Explain",
            ppdLastDate: "PPD Last Date",
            healthUpdatesWeight: "Health Updates Weight",
            healthUpdatesMajorChanges: "Health Updates Major Changes",
            smoking: "Smoking",
            alcoholDrugUse: "Alcohol/Drug Use",
            eatingDisorderHistory: "Eating Disorder History",
            eatingDisorderDescription: "Eating Disorder Description",
            medicalHistoryNotReleased: "Medical History Not Released",
            medicalHistoryContactName: "Medical History Contact Name",
            medicalHistoryContactRelation: "Medical History Contact Relation",
            medicalHistoryContactNumber: "Medical History Phone Number",
            medicalHistoryContactAddress: "Medical History Contact Address",
            surgicalHistory: "Surgical History",
            surgicalHistoryDate: "Surgical History Date",
            traumaBrokenBones: "Trauma/Broken Bones",
            traumaBrokenBonesDate: "Trauma/Broken Bones Date",
            anesthesiaProblems: "Anesthesia Problems",
            anesthesiaProblemsDescription: "Anesthesia Problems Description",
            ageMenstruationStarted: "Age Menstruation Started",
            ageMenstruationStopped: "Age Menstruation Stopped",
            givenBirth: "Given Birth",
            lastPapSmearDate: "Last Pap Smear Date",
            lastPapSmearStatus: "Last Pap Smear Status",
            abnormalPapSmear: "Abnormal Pap Smear",
            abnormalPapSmearDescription: "Abnormal Pap Smear Description",
            lastMammogramDate: "Last Mammogram Date",
            lastMammogramStatus: "Last Mammogram Status",
            seriousIllnessesConditions: "Serious Illnesses/Conditions",
            behavioralPsychiatricDiagnoses: "Behavioral/Psychiatric Diagnoses",
            audiologicalExamDate: "Audiological Exam Date",
            audiologicalExamStatus: "Audiological Exam Status",
            eyeExamDate: "Eye Exam Date",
            eyeExamStatus: "Eye Exam Status",
            dentalExamDate: "Dental Exam Date",
            dentalExamStatus: "Dental Exam Status",
            boneDensityDate: "Bone Density Date",
            boneDensityStatus: "Bone Density Status",
            colonoscopySigmoidoscopyDate: "Colonoscopy/Sigmoidoscopy Date",
            colonoscopySigmoidoscopyStatus: "Colonoscopy/Sigmoidoscopy Status",
            psaDate: "PSA Date",
            psaStatus: "PSA Status",
            brothersSisters: "Brothers/Sisters",
            familyDiseasesRunInFamily: "Family Diseases Run in Family",
            familyDiseasesDescription: "Family Diseases Description",
            geneticCounseling: "Genetic Counseling",
            geneticCounselingDescription: "Genetic Counseling Description",
            fatherDeceased: "Father Deceased",
            fatherAgeAtDeath: "Father Age at Death",
            fatherCauseOfDeath: "Father Cause of Death",
            fatherCurrentAge: "Father Current Age",
            motherDeceased: "Mother Deceased",
            motherAgeAtDeath: "Mother Age at Death",
            motherCauseOfDeath: "Mother Cause of Death",
            motherCurrentAge: "Mother Current Age",
            familyHistoryDiabetes: "Family History Diabetes",
            familyHistoryHighBloodPressure:
              "Family History High Blood Pressure",
            familyHistoryHighCholesterol: "Family History High Cholesterol",
            familyHistoryHeartDisease: "Family History Heart Disease",
            familyHistoryOsteoporosis: "Family History Osteoporosis",
            familyHistoryColonPolyps: "Family History Colon Polyps",
            familyHistoryCancer: "Family History Cancer",
            familyHistoryCancerType: "Family History Cancer Type",
          };
          return healthHistoryMap[fieldName] || formatFieldName(fieldName);
        }

        // Behavior Support Plan field mappings
        if (formName === "BSP (Behavior Support Plan)") {
          const bspMap: Record<string, string> = {
            admissionDate: "Admission Date",
            serviceType: "Service Type",
            individualName: "Individual Name",
            dateOfBirth: "Date of Birth",
            gender: "Gender",
            address: "Address",
            phoneNumber: "Phone Number",
            emergencyContact: "Emergency Contact",
            emergencyContactPhone: "Emergency Contact Phone",
            medicalRecords: "Medical Records",
            psychologicalAssessments: "Psychological Assessments",
            behavioralAssessments: "Behavioral Assessments",
            educationalRecords: "Educational Records",
            otherRecords: "Other Records",
            planAuthor: "Plan Author",
            authorTitle: "Author Title",
            authorCredentials: "Author Credentials",
            authorContact: "Author Contact",
            planDate: "Plan Date",
            reviewDate: "Review Date",
            rationale: "Rationale",
            problemStatement: "Problem Statement",
            currentBehavior: "Current Behavior",
            impactOnIndividual: "Impact on Individual",
            impactOnOthers: "Impact on Others",
            preferredActivities: "Preferred Activities",
            preferredPeople: "Preferred People",
            preferredEnvironments: "Preferred Environments",
            preferredItems: "Preferred Items",
            nonPreferredItems: "Non-Preferred Items",
            baselineData: "Baseline Data",
            frequencyData: "Frequency Data",
            durationData: "Duration Data",
            intensityData: "Intensity Data",
            patterns: "Patterns",
            increaseBehaviors: "Increase Behaviors",
            decreaseBehaviors: "Decrease Behaviors",
            antecedentStrategies: "Antecedent Strategies",
            environmentalModifications: "Environmental Modifications",
            scheduleModifications: "Schedule Modifications",
            communicationStrategies: "Communication Strategies",
            supervisionLevel: "Supervision Level",
            restrictions: "Restrictions",
            monitoringRequirements: "Monitoring Requirements",
            safetyMeasures: "Safety Measures",
            crisisDefinition: "Crisis Definition",
            crisisProcedures: "Crisis Procedures",
            deEscalationTechniques: "De-escalation Techniques",
            emergencyContacts: "Emergency Contacts",
            goals: "Goals",
            signatureMethod: "Signature Method",
            signature: "Signature",
            signedBy: "Signed By",
            signatureDate: "Signature Date",
          };
          return bspMap[fieldName] || formatFieldName(fieldName);
        }

        // Default formatting
        return formatFieldName(fieldName);
      };

      const formatFieldName = (fieldName: string) => {
        return fieldName
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase())
          .trim();
      };

      const formatValue = (value: any): string => {
        if (value === null || value === undefined || value === "") return "—";

        // Handle date strings
        if (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}/)) {
          const date = dayjs(value);
          if (date.isValid()) return date.format("MM/DD/YYYY");
        }

        // Handle JSON objects (like address)
        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value) &&
          !dayjs.isDayjs(value)
        ) {
          // Check if it's an address-like object
          if (value.line1 || value.city || value.state || value.zipcode) {
            const parts = [];
            if (value.line1) parts.push(value.line1);
            if (value.line2) parts.push(value.line2);
            if (value.city) parts.push(value.city);
            if (value.state) parts.push(value.state);
            if (value.zipcode) parts.push(value.zipcode);
            if (value.country) parts.push(value.country);
            return parts.filter(Boolean).join(", ");
          }
          // For other objects, try to format nicely
          const entries = Object.entries(value).filter(
            ([_, v]) => v !== null && v !== undefined && v !== "",
          );
          if (entries.length === 0) return "—";
          return entries
            .map(([k, v]) => `${formatFieldName(k)}: ${v}`)
            .join(", ");
        }

        // Handle arrays
        if (Array.isArray(value)) {
          if (value.length === 0) return "—";
          return value
            .map((item) => {
              if (typeof item === "object" && item !== null) {
                // For array of objects (like goals, behaviors)
                const objEntries = Object.entries(item).filter(
                  ([_, v]) => v !== null && v !== undefined && v !== "",
                );
                if (objEntries.length > 0) {
                  return objEntries
                    .map(([k, v]) => `${formatFieldName(k)}: ${v}`)
                    .join(", ");
                }
              }
              return String(item);
            })
            .filter(Boolean)
            .join("; ");
        }

        // Handle booleans
        if (typeof value === "boolean") return value ? "Yes" : "No";

        return String(value);
      };

      const renderField = (
        label: string,
        fieldName: string,
        formData: any,
        formName: string,
      ) => {
        const value = formData[fieldName];
        const displayValue = formatValue(value);
        if (displayValue === "—" || !displayValue) return "";

        // Use fixed width for label so all values align from the same position
        return `
          <div style="margin-bottom: 12px; padding: 8px 0; border-bottom: 1px solid #F0F0F0; display: flex;">
            <strong style="color: #0A2E45; min-width: 250px; width: 250px; flex-shrink: 0;">${label}:</strong>
            <span style="color: #424342; flex: 1;">${displayValue}</span>
          </div>
        `;
      };

      // Generate content based on form type
      let formContent = "";

      if (row.formName === "Health History Form") {
        // Health History Form - show all fields with proper labels
        const fields = Object.keys(formJson);
        formContent = fields
          .map((field) => {
            const label = getFieldLabel(field, row.formName);
            return renderField(label, field, formJson, row.formName);
          })
          .filter(Boolean)
          .join("");
      } else if (
        row.formName === "5 and 30 Day Nursing Transition Evaluation Form"
      ) {
        // Nursing Transition Evaluation Form
        const basicInfo = `
          <div class="print-section" style="margin-bottom: 30px;">
            <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 24px; color: #0A2E45; border-bottom: 2px solid #0A2E45; padding-bottom: 12px;">
              Basic Information
            </h2>
            <div style="margin-top: 20px;">
              ${renderField("Region", "region", formJson, row.formName)}
              ${renderField("Address", "address", formJson, row.formName)}
              ${renderField("Date of Transition / Move", "dateOfTransition", formJson, row.formName)}
              ${renderField("Vendor Agency Name", "vendorAgencyName", formJson, row.formName)}
            </div>
          </div>
        `;

        const fiveDay = `
          <div class="print-section" style="margin-bottom: 30px; page-break-after: always;">
            <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 24px; color: #0A2E45; border-bottom: 2px solid #0A2E45; padding-bottom: 12px;">
              5-Day Evaluation
            </h2>
            <div style="margin-top: 20px;">
              ${renderField("Licensed Nurse Name", "fiveDayNurseName", formJson, row.formName)}
              ${renderField("Date of 5-Day Evaluation", "fiveDayEvaluationDate", formJson, row.formName)}
              ${renderField("Email", "fiveDayEmail", formJson, row.formName)}
              ${renderField("Phone Number", "fiveDayContactNumber", formJson, row.formName)}
              ${renderField("Adverse Changes After Transition", "fiveDayAdverseChanges", formJson, row.formName)}
              ${renderField("Follow-up Needed", "fiveDayFollowUp", formJson, row.formName)}
              ${
                formJson.fiveDaySignature
                  ? `
                <div style="margin-top: 20px; padding: 16px; border: 1px solid #E7E9EB; border-radius: 4px;">
                  <div style="display: flex; margin-bottom: 8px;">
                    <strong style="color: #0A2E45; min-width: 250px; width: 250px; flex-shrink: 0;">Nurse Signature:</strong>
                    <img src="${formJson.fiveDaySignature}" alt="5-Day Signature" style="max-width: 100%; max-height: 120px;" />
                  </div>
                </div>
              `
                  : ""
              }
            </div>
          </div>
        `;

        const thirtyDay = `
          <div class="print-section" style="margin-bottom: 30px;">
            <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 24px; color: #0A2E45; border-bottom: 2px solid #0A2E45; padding-bottom: 12px;">
              30-Day Evaluation
            </h2>
            <div style="margin-top: 20px;">
              ${renderField("Licensed Nurse Name", "thirtyDayNurseName", formJson, row.formName)}
              ${renderField("Date of 30-Day Evaluation", "thirtyDayEvaluationDate", formJson, row.formName)}
              ${renderField("Email", "thirtyDayEmail", formJson, row.formName)}
              ${renderField("Phone Number", "thirtyDayContactNumber", formJson, row.formName)}
              ${renderField("Health History Information", "thirtyDayHealthHistoryInfo", formJson, row.formName)}
              ${renderField("HRST Monthly Data Tracker", "thirtyDayHRSTMonthlyData", formJson, row.formName)}
              ${renderField("Service Agreement Present", "thirtyDayServiceAgreement", formJson, row.formName)}
              ${renderField("Frail Health (He-M 1201.02 (m))", "thirtyDayFrailHealth", formJson, row.formName)}
              ${formJson.thirtyDayFrailHealth === "yes" ? renderField("If Yes, Please Describe", "thirtyDayFrailHealthDescription", formJson, row.formName) : ""}
              ${renderField("Follow-up Needed", "thirtyDayFollowUp", formJson, row.formName)}
              ${renderField("Notes", "thirtyDayNotes", formJson, row.formName)}
              ${
                formJson.thirtyDaySignature
                  ? `
                <div style="margin-top: 20px; padding: 16px; border: 1px solid #E7E9EB; border-radius: 4px;">
                  <div style="display: flex; margin-bottom: 8px;">
                    <strong style="color: #0A2E45; min-width: 250px; width: 250px; flex-shrink: 0;">Nurse Signature:</strong>
                    <img src="${formJson.thirtyDaySignature}" alt="30-Day Signature" style="max-width: 100%; max-height: 120px;" />
                  </div>
                </div>
              `
                  : ""
              }
            </div>
          </div>
        `;

        formContent = basicInfo + fiveDay + thirtyDay;
      } else if (row.formName === "BSP (Behavior Support Plan)") {
        // Behavior Support Plan - show all fields with proper labels
        const fields = Object.keys(formJson);
        formContent = fields
          .map((field) => {
            const label = getFieldLabel(field, row.formName);
            return renderField(label, field, formJson, row.formName);
          })
          .filter(Boolean)
          .join("");
      } else {
        // Default: show all fields with proper labels
        const fields = Object.keys(formJson);
        formContent = fields
          .map((field) => {
            const label = getFieldLabel(field, row.formName);
            return renderField(label, field, formJson, row.formName);
          })
          .filter(Boolean)
          .join("");
      }

      // Remove any existing print containers and styles first
      const existingContainer = document.getElementById("print-container-temp");
      if (existingContainer) {
        existingContainer.remove();
      }
      const existingStyle = document.getElementById("print-style-temp");
      if (existingStyle) {
        existingStyle.remove();
      }

      // Create a hidden print container
      const printContainer = document.createElement("div");
      printContainer.id = "print-container-temp";
      printContainer.innerHTML = `
        <div style="position: fixed; top: 20px; left: 20px; font-size: 12px; color: #424342; z-index: 10000;">${currentDateTime}</div>
        <div style="width: 100%; max-width: 800px; margin: 0 auto; padding: 20px;">
          <div style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #E3ECEF; text-align: center;">
            <div style="font-size: 24px; font-weight: 600; color: #0A2E45; margin-bottom: 15px;">${row.formName}</div>
            <div style="font-size: 14px; color: #424342; margin-bottom: 5px;"><strong>Individual's Name:</strong> ${residentName || ""}</div>
          </div>
          ${formContent || '<div style="color: #9CA3AF; font-style: italic; padding: 20px;">No data available for this form.</div>'}
        </div>
      `;
      printContainer.style.cssText =
        "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: white; z-index: 9999; overflow: auto; display: none;";

      // Add print styles
      const style = document.createElement("style");
      style.id = "print-style-temp";
      style.textContent = `
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            margin: 0;
            padding: 0;
          }
          body > *:not(#print-container-temp) {
            display: none !important;
          }
          #print-container-temp {
            position: relative !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            top: 0 !important;
            left: 0 !important;
            background: white !important;
            overflow: visible !important;
            z-index: 1 !important;
          }
          #print-container-temp > div:first-child {
            position: fixed !important;
            top: 20px !important;
            left: 20px !important;
          }
          @page {
            margin: 1cm;
            size: A4;
          }
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(printContainer);

      // Show print container and print
      printContainer.style.display = "block";

      // Wait a bit for the container to render before printing
      setTimeout(() => {
        window.print();

        // Clean up after printing
        setTimeout(() => {
          if (document.getElementById("print-container-temp")) {
            document.body.removeChild(printContainer);
          }
          if (document.getElementById("print-style-temp")) {
            document.head.removeChild(style);
          }
        }, 500);
      }, 100);

      onPrint?.(row.id);
    } catch (error) {
      console.error("Error printing form:", error);
      setSnackbar({
        isOpen: true,
        message: "Failed to load form data for printing",
        status: "error",
      });
    }
  };

  // Handlers for Guardian/Agent tab (view and print only — no fill/edit/delete/share)
  const handleGuardianAgentView = (row: SignedFormRow) => {
    setSelectedLeadForm(row);
    React.startTransition(() => setLeadFormDrawerOpen(true));
  };

  const handleGuardianAgentPrint = async (row: SignedFormRow) => {
    if (!row.consentFormUuid) {
      setSnackbar({ isOpen: true, message: "Form not available for printing", status: "error" });
      return;
    }
    try {
      const formData = await queryClient.fetchQuery({
        ...getConsentFormDetailOptions({
          path: { uuid: row.consentFormUuid },
          query: { history: false },
        }),
      });
      const responseData = (formData as any)?.data ?? formData;
      const entries = responseData?.entries || [];
      const latestEntry = entries[0] || null;
      const formJson = latestEntry?.form_json || responseData?.form_json || {};

      let html: string | null = null;
      switch (row.rawFormName) {
        case "Blank ROI": {
          const { generateBlankROIPrintHTML } = await import(
            "../../leads/components/forms/hipaa-release/generateBlankROIPrintHTML"
          );
          html = generateBlankROIPrintHTML(formJson, residentName);
          break;
        }
        case "NH Residency Agreement": {
          const { generateNHResidencyPrintHTML } = await import(
            "../../leads/components/forms/nh-residency-agreement/generateNHResidencyPrintHTML"
          );
          html = generateNHResidencyPrintHTML(formJson, residentName);
          break;
        }
        case "CAFC House rules": {
          const { generateHouseRulesPrintHTML } = await import(
            "../../leads/components/forms/house-rules/generateHouseRulesPrintHTML"
          );
          html = generateHouseRulesPrintHTML(formJson, residentName);
          break;
        }
        case "Service agreement": {
          const { generateServiceAgreementPrintHTML } = await import(
            "../../leads/components/forms/service-agreement/generateServiceAgreementPrintHTML"
          );
          html = generateServiceAgreementPrintHTML(formJson, residentName);
          break;
        }
      }
      if (html) {
        const { printFormInPage } = await import(
          "../../leads/components/forms/printFormInPage"
        );
        printFormInPage(html);
      }
    } catch {
      setSnackbar({ isOpen: true, message: "Failed to print form", status: "error" });
    }
  };

  const renderDocumentsCell = (
    row: FormTableRow & {
      apiStatus?: string;
      consentFormUuid?: string;
      consentFormStatus?: string;
      nextDueAt?: string | null;
      daysUntilDue?: number | null;
      hasUploadedFile?: boolean;
      uploadDocument?: string | null;
      fileUrl?: string | null;
      mediaId?: string | null;
      fileCount?: number;
      allMatchingMedia?: any[];
    },
  ) => {
    // Show uploaded file if it exists (same as DocumentsTable)
    if (row.hasUploadedFile && row.uploadDocument) {
      const truncateFn = (name: string, max = 22) =>
        name.length > max ? name.substring(0, max) + "..." : name;
      const isRepeatingUpload = row.uploadType === "repeating";
      const allMatchingMedia = (row as any).allMatchingMedia || [];
      const hasMultipleFiles = (row.fileCount ?? 0) > 1;

      // If multiple files, show simple display (no preview thumbnails in table)
      if (hasMultipleFiles && allMatchingMedia.length > 0) {
        return (
          <Grid container alignItems="center" spacing={1} wrap="nowrap">
            <Grid>
              <DescriptionIcon
                sx={{ fontSize: 22, color: "#6B7280", flexShrink: 0 }}
              />
            </Grid>
            <Grid>
              <Typography
                sx={{
                  ...primaryTextCss,
                  fontSize: "13px",
                  color: "#1976D2",
                  cursor: "pointer",
                  "&:hover": { textDecoration: "underline" },
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleViewDocument(row.id);
                }}
              >
                {truncateFn(row.uploadDocument)}
              </Typography>
            </Grid>
            <Grid>
              <Chip
                label={`${row.fileCount} files`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: "11px",
                  fontWeight: 500,
                  backgroundColor: "#E3F2FD",
                  color: "#1565C0",
                  "& .MuiChip-label": { px: 1 },
                }}
              />
            </Grid>
            {/* Re-upload button for repeating upload forms - on same line */}
            {isRepeatingUpload && (
              <Grid>
                <input
                  type="file"
                  multiple
                  ref={(el) => {
                    fileInputRefs.current[row.id] = el;
                  }}
                  onChange={(e) => handleFileChange(row.id, e)}
                  style={{ display: "none" }}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <Tooltip title={isDSP ? "You don't have permission" : disabledReason || ""} disableHoverListener={!isDSP && !isReadOnly}>
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => handleUploadClick(row.id)}
                      disabled={isDSP || isReadOnly || uploadingFormIds.has(row.id)}
                      sx={{
                        color: isDSP ? "#BDBDBD" : "#1976D2",
                        p: 0.5,
                        "&:hover": { backgroundColor: "#E3F2FD" },
                      }}
                    >
                      {uploadingFormIds.has(row.id) ? (
                        <CircularProgress size={16} thickness={5} sx={{ color: "#1976D2" }} />
                      ) : (
                        <ArrowUpwardIcon sx={{ fontSize: 16 }} />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
              </Grid>
            )}
          </Grid>
        );
      }

      // Single file display (existing code)
      return (
        <Grid container alignItems="center" spacing={1} wrap="nowrap">
          <Grid>
            <DescriptionIcon
              sx={{ fontSize: 22, color: "#6B7280", flexShrink: 0 }}
            />
          </Grid>
          <Grid>
            <Typography
              sx={{
                ...primaryTextCss,
                fontSize: "13px",
                color: "#1976D2",
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleViewDocument(row.id);
              }}
            >
              {truncateFn(row.uploadDocument)}
            </Typography>
          </Grid>
          {/* Re-upload button for repeating upload forms */}
          {isRepeatingUpload && (
            <Grid>
              <input
                type="file"
                multiple
                ref={(el) => {
                  fileInputRefs.current[row.id] = el;
                }}
                onChange={(e) => handleFileChange(row.id, e)}
                style={{ display: "none" }}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <Tooltip
              title={isDSP ? "You don't have permission" : disabledReason || ""}
              disableHoverListener={!isDSP && !isReadOnly}
            >
              <span>
              <IconButton
                size="small"
                onClick={() => handleUploadClick(row.id)}
                disabled={isDSP || isReadOnly || uploadingFormIds.has(row.id)}
                sx={{
                  color: isDSP ? "#BDBDBD" : "#1976D2",
                  p: 0.5,
                  "&:hover": { backgroundColor: "#E3F2FD" },
                }}
              >
                {uploadingFormIds.has(row.id) ? (
                  <CircularProgress size={16} thickness={5} sx={{ color: "#1976D2" }} />
                ) : (
                  <ArrowUpwardIcon sx={{ fontSize: 16 }} />
                )}
              </IconButton>
              </span>
              </Tooltip>
            </Grid>
          )}
        </Grid>
      );
    }

    if (row.documentType === "file" && row.documentName) {
      return (
        <Grid container alignItems="center" spacing={1}>
          <Grid>
            <DescriptionIcon sx={{ fontSize: 18, color: "#6B7280" }} />
          </Grid>
          <Grid>
            <Typography
              sx={{
                ...primaryTextCss,
                fontSize: "13px",
                color: "#233558",
                cursor: "pointer",
              }}
              onClick={() => handleViewDocument(row.id)}
            >
              {row.documentName}
            </Typography>
          </Grid>
        </Grid>
      );
    }

    if (row.documentType === "filled") {
      // Check if we should show refill info for filled forms
      const refillInfo = formatRefillInfo(row.daysUntilDue ?? null);

      // For HRST monthly tracker: smart year check
      //   - saved year < currentYear  → "Fill Form" (opens fresh form for the new current year)
      //   - saved year = currentYear (or unknown) → "Edit" (continue editing this year's data)
      if (row.formName === "HRST monthly tracker" && !!(row as any).consentFormUuid) {
        const currentYear = new Date().getFullYear();
        const hrstYear = (row as any).hrstFormYear as number | null | undefined;
        const isOldYear = hrstYear != null && hrstYear < currentYear;

        if (isOldYear) {
          // Past year is complete — show Fill Form so the user can start a fresh current-year entry
          const noPermission = !canCreateConsentForm;
          return (
            <Tooltip
              title={noPermission ? "You don't have permission" : ""}
              disableHoverListener={!noPermission}
            >
              <span style={{ display: "inline-block", cursor: noPermission ? "not-allowed" : "default" }}>
                <CustomButton
                  variant="secondary"
                  size="sm"
                  disabled={noPermission}
                  onClick={() => !noPermission && handleFillForm(row.id, row)}
                  sx={{
                    minWidth: "100px",
                    height: "32px",
                    fontSize: "12px",
                    ...(noPermission
                      ? { borderColor: "#E3ECEF", color: "#E3ECEF" }
                      : { borderColor: "#0A2E45", color: "#0A2E45" }),
                  }}
                >
                  Fill Form
                </CustomButton>
              </span>
            </Tooltip>
          );
        }

        // Current year — show Edit button
        return (
          <Tooltip
            title={!canEditConsentForm ? "You don't have permission" : "Edit this record"}
            disableHoverListener={canEditConsentForm}
          >
            <span style={{ display: "inline-block", cursor: !canEditConsentForm ? "not-allowed" : "default" }}>
              <CustomButton
                variant="secondary"
                size="sm"
                disabled={!canEditConsentForm}
                onClick={() => {
                  if (!canEditConsentForm) return;
                  setIsHrstEditMode(true);
                  setSelectedForm(row as any);
                  setViewMode(false);
                  isViewModeRef.current = false;
                  // Transition: React waits for the lazy drawer chunk instead of
      // flashing the fallback, so the drawer animates in exactly once
      React.startTransition(() => setOpenFormDrawer(true));
                }}
                sx={{
                  minWidth: "80px",
                  height: "32px",
                  fontSize: "12px",
                  ...(!canEditConsentForm
                    ? { borderColor: "#E3ECEF", color: "#E3ECEF" }
                    : { borderColor: "#0A2E45", color: "#0A2E45" }),
                }}
              >
                Edit
              </CustomButton>
            </span>
          </Tooltip>
        );
      }

      return (
        <Grid container alignItems="center" spacing={1} flexWrap="wrap">
          <Grid container alignItems="center" spacing={1}>
            <CheckCircleIcon sx={{ fontSize: 18, color: "#2E7D32" }} />
            <Typography
              sx={{ ...primaryTextCss, fontSize: "13px", color: "#2E7D32" }}
            >
              Filled
            </Typography>
          </Grid>
          {refillInfo && (
            <Typography
              sx={{
                fontSize: "12px",
                color: refillInfo.isUrgent ? "#FF6B35" : "#6B7280",
              }}
            >
              {refillInfo.text}
            </Typography>
          )}
        </Grid>
      );
    }

    if (row.documentType === "fillForm" || row.documentType === "upload") {
      const isDisabled = isReadOnly || row.isButtonDisabled || false;

      // For upload type, check if file is already uploaded first
      if (row.documentType === "upload") {
        const isRepeating = row.uploadType === "repeating";

        // If file is uploaded, show document icon and name
        if (row.hasUploadedFile && row.uploadDocument) {
          const truncateFn = (name: string, max = 22) =>
            name.length > max ? name.substring(0, max) + "..." : name;

          return (
            <Grid container alignItems="center" spacing={1} wrap="nowrap">
              <Grid>
                <DescriptionIcon
                  sx={{ fontSize: 22, color: "#6B7280", flexShrink: 0 }}
                />
              </Grid>
              <Grid>
                <Typography
                  sx={{
                    ...primaryTextCss,
                    fontSize: "13px",
                    color: "#1976D2",
                    cursor: "pointer",
                    "&:hover": { textDecoration: "underline" },
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleViewDocument(row.id);
                  }}
                >
                  {truncateFn(row.uploadDocument)}
                </Typography>
              </Grid>
              {/* Count badge when multiple files */}
              {isRepeating && (row.fileCount ?? 0) > 1 && (
                <Grid>
                  <Chip
                    label={`${row.fileCount} files`}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: "11px",
                      fontWeight: 500,
                      backgroundColor: "#E3F2FD",
                      color: "#1565C0",
                      "& .MuiChip-label": { px: 1 },
                    }}
                  />
                </Grid>
              )}
              {/* Re-upload button for repeating upload forms */}
              {isRepeating && (
                <Grid>
                  <input
                    type="file"
                    multiple
                    ref={(el) => {
                      fileInputRefs.current[row.id] = el;
                    }}
                    onChange={(e) => handleFileChange(row.id, e)}
                    style={{ display: "none" }}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <Tooltip
                    title={!canCreateConsentForm ? "You don't have permission" : disabledReason || ""}
                    disableHoverListener={canCreateConsentForm && !isReadOnly}
                  >
                  <span style={{ display: "inline-block", cursor: !canCreateConsentForm ? "not-allowed" : "default" }}>
                  <IconButton
                    size="small"
                    onClick={() => handleUploadClick(row.id)}
                    disabled={!canCreateConsentForm || isReadOnly || uploadingFormIds.has(row.id)}
                    sx={{
                      color: "#1976D2",
                      p: 0.5,
                      "&:hover": { backgroundColor: "#E3F2FD" },
                    }}
                  >
                    {uploadingFormIds.has(row.id) ? (
                      <CircularProgress size={16} thickness={5} sx={{ color: "#1976D2" }} />
                    ) : (
                      <ArrowUpwardIcon sx={{ fontSize: 16 }} />
                    )}
                  </IconButton>
                  </span>
                  </Tooltip>
                </Grid>
              )}
            </Grid>
          );
        }

        // If no file uploaded, show upload button
        return (
          <Box>
            <input
              type="file"
              multiple={isRepeating}
              ref={(el) => {
                fileInputRefs.current[row.id] = el;
              }}
              onChange={(e) => handleFileChange(row.id, e)}
              style={{ display: "none" }}
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <Tooltip
              title={!canCreateConsentForm ? "You don't have permission" : disabledReason || ""}
              disableHoverListener={canCreateConsentForm && !isReadOnly}
            >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, cursor: !canCreateConsentForm ? "not-allowed" : "default" }}>
              <Box sx={uploadButtonStyles}>
                <CustomButton
                  variant="secondary"
                  size="sm"
                  onClick={() => handleUploadClick(row.id)}
                  icon={<ArrowUpwardIcon />}
                  iconPosition="left"
                  disabled={!canCreateConsentForm || uploadingFormIds.has(row.id) || isDisabled}
                  sx={{
                    minWidth: "100px",
                    height: "32px",
                    fontSize: "12px",
                    ...(!canCreateConsentForm || isDisabled
                      ? { borderColor: "#E3ECEF", color: "#E3ECEF" }
                      : {}),
                  }}
                >
                  Upload
                </CustomButton>
              </Box>

              {uploadingFormIds.has(row.id) && (
                <CircularProgress
                  size={18}
                  thickness={5}
                  sx={{ color: "#1976D2" }}
                />
              )}
            </Box>
            </Tooltip>
          </Box>
        );
      }

      // For fillForm type, show fill form button
      // Determine button text based on API status
      let buttonText = "Fill Form";
      const isDraft = row.apiStatus === "DRAFT" || row.consentFormStatus === "DRAFT";
      if (isDraft) {
        buttonText = "Draft";
      } else if (row.apiStatus === "DUE") {
        buttonText = "Fill Form";
      }

      const noFormPermission = isDraft ? !canEditConsentForm : !canCreateConsentForm;
      const formPermissionDisabled = isDisabled || noFormPermission;

      // Get dynamic refill info from API (not static)
      const refillInfo = formatRefillInfo(row.daysUntilDue ?? null);



      return (
        <Grid container alignItems="center" spacing={1.5} flexWrap="wrap">
          <Tooltip
            title={noFormPermission ? "You don't have permission" : disabledReason || ""}
            disableHoverListener={!noFormPermission && !isReadOnly}
          >
            <span style={{ display: "inline-block", cursor: noFormPermission ? "not-allowed" : "default" }}>
              <CustomButton
                variant="secondary"
                size="sm"
                onClick={() => !formPermissionDisabled && handleFillForm(row.id, row)}
                disabled={formPermissionDisabled}
                sx={{
                  minWidth: "100px",
                  height: "32px",
                  fontSize: "12px",
                  ...(formPermissionDisabled
                    ? { borderColor: "#E3ECEF", color: "#E3ECEF" }
                    : { borderColor: "#0A2E45", color: "#0A2E45" }),
                }}
              >
                {buttonText}
              </CustomButton>
            </span>
          </Tooltip>

          {/* Show dynamic refill info from API if available, otherwise fallback to static */}
          {refillInfo ? (
            <Typography
              sx={{
                fontSize: "12px",
                color: refillInfo.isUrgent ? "#FF6B35" : "#6B7280",
              }}
            >
              {refillInfo.text}
            </Typography>
          ) : row.refillInfo ? (
            <Typography
              sx={{
                fontSize: "12px",
                color: row.refillUrgent ? "#FF6B35" : "#6B7280",
              }}
            >
              {row.refillInfo}
            </Typography>
          ) : null}
        </Grid>
      );
    }

    return null;
  };

  return (
    <Grid
      container
      direction="column"
      sx={{ height: "100%", backgroundColor: "#FFFFFF", overflow: "hidden" }}
    >
      {/* Common / Guardian / Agent tabs (Guardian and Agent only shown when assigned) */}
      <Box sx={{ display: "flex", pb: 1.5, flexShrink: 0 }}>
        <ToggleButtonGroup
          value={consentTab}
          exclusive
          onChange={(_: any, value: string) => {
            if (value) setConsentTab(value as "common" | "guardian" | "agent");
          }}
          size="small"
          sx={{
            "& .MuiToggleButton-root": {
              textTransform: "none",
              fontSize: "13px",
              fontWeight: 500,
              px: 2.5,
              py: 0.5,
              borderColor: "#E3ECEF",
              color: "#636262",
              "&.Mui-selected": {
                backgroundColor: "#0A2E45",
                color: "#FFFFFF",
                "&:hover": { backgroundColor: "#0A2E45" },
              },
              "&:hover": { backgroundColor: "#F2F7FA" },
            },
          }}
        >
          <ToggleButton value="common">Common</ToggleButton>
          {!isNurse && guardianDetails && <ToggleButton value="guardian">Guardian</ToggleButton>}
          {!isNurse && agentDetails && <ToggleButton value="agent">Area Agency</ToggleButton>}
        </ToggleButtonGroup>
      </Box>

      {consentTab === "common" &&
        (consentListQuery.isLoading ? (
          // While the consent-forms API is still loading, show the shared
          // table skeleton instead of a blank area / static rows that would
          // flash before flipping to their real fill/upload state.
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              border: "1px solid #E3ECEF",
              borderRadius: "6px",
              overflow: "hidden",
            }}
          >
            <TableSkeleton
              headers={tableHeaders.map((h) => ({
                id: h.id,
                label: h.label,
                width: h.width.lg,
              }))}
              rowCount={6}
              hasCheckbox={false}
              hasAvatar={false}
              hasActions={false}
            />
          </Box>
        ) : (
        <>
          {/* Bulk share toolbar — share all checked rows at once */}
          {canShareConsentForm && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 1.5,
                mb: 1.5,
                flexShrink: 0,
              }}
            >
              {selectedShareRowIds.size > 0 && (
                <Typography sx={{ fontSize: "13px", color: "#636262" }}>
                  {selectedShareRowIds.size} selected
                </Typography>
              )}
              <Tooltip
                title={
                  isReadOnly
                    ? disabledReason || ""
                    : shareableRows.length === 0
                      ? "No documents available to share"
                      : selectedShareRowIds.size === 0
                        ? "Select documents to share"
                        : ""
                }
                disableHoverListener={
                  !isReadOnly &&
                  shareableRows.length > 0 &&
                  selectedShareRowIds.size > 0
                }
              >
                <span>
                  <CustomButton
                    variant="primary"
                    size="sm"
                    onClick={handleShareSelectedClick}
                    disabled={isReadOnly || selectedShareRowIds.size === 0}
                    sx={{ height: "32px", fontSize: "12px" }}
                  >
                    <ShareIcon sx={{ fontSize: 16, mr: 0.75 }} />
                    Share Selected
                    {selectedShareRowIds.size > 0
                      ? ` (${selectedShareRowIds.size})`
                      : ""}
                  </CustomButton>
                </span>
              </Tooltip>
            </Box>
          )}
          <TableContainer
            sx={{
              flex: 1,
              border: "1px solid #E3ECEF",
              borderRadius: "6px",
              overflowY: "auto",
              overflowX: "auto", // Enable horizontal scrolling when needed
              backgroundColor: "#FFFFFF",
              minHeight: 0,
          width: "100%",
          maxWidth: "100%",
          position: "relative",
          // Enable touch scrolling on mobile devices
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-x pan-y",

          // ✅ Scrollbar styling - show scrollbars when needed
          scrollbarWidth: "thin",
          scrollbarColor: "#D1D5DB #F3F4F6",
          scrollBehavior: "smooth",
          "&::-webkit-scrollbar": {
            width: "6px",
            height: "6px",
            display: "block",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "#F3F4F6",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#D1D5DB",
            borderRadius: "3px",
            "&:hover": {
              backgroundColor: "#9CA3AF",
            },
          },

          "& .MuiTable-root": {
            borderCollapse: "separate",
            borderSpacing: 0,
            width: "100%", // Table takes full width of container
            display: "table",
            tableLayout: "auto",
          },
          "& .MuiTableHead-root .MuiTableCell-root": {
            height: { xs: "40px", sm: "42px", md: "44px" },
            padding: { 
              xs: "8px 8px",      // Mobile: compact padding
              sm: "8px 12px",     // Tablet: medium padding
              md: "8px 14px",     // Laptop: standard padding
              lg: "8px 16px"      // Desktop: full padding
            },
            backgroundColor: "#F2F7FA !important",
            borderBottom: "1px solid #E3ECEF",
            color: "#212121",
            position: "sticky",
            top: 0,
            zIndex: 10,
            whiteSpace: "nowrap", // Prevent text wrapping in headers
            boxSizing: "border-box",
            flexShrink: 0,
          },
          "& .MuiTableHead-root .MuiTableCell-root:last-of-type": {
            overflow: "visible",
            borderBottomRightRadius: 0,
            borderBottomLeftRadius: 0,
          },
          "& .MuiTableHead-root .MuiTableCell-root:first-of-type": {
            borderBottomLeftRadius: 0,
          },
          "& .MuiTableBody-root": {
            "& .MuiTableRow-root": {
              "&:hover": {
                backgroundColor: "rgba(0,0,0,0.01)",
              },
            },
            "& .MuiTableCell-root": {
              borderBottom: "1px solid #ECEFF4",
              verticalAlign: "middle",
              padding: { 
                xs: "8px 8px",      // Mobile: compact padding
                sm: "8px 12px",     // Tablet: medium padding
                md: "8px 14px",     // Laptop: standard padding
                lg: "8px 16px"      // Desktop: full padding
              },
              whiteSpace: "nowrap", // Prevent text wrapping in cells
              boxSizing: "border-box",
              minWidth: "fit-content",
            },
          },
        }}
      >
        <Table stickyHeader sx={{ tableLayout: "auto", backgroundColor: "#FFFFFF" }}>
          <TableHead>
            <TableRow>
              {/* Select-all checkbox (selects every shareable row) */}
              {canShareConsentForm && (
                <TableCell sx={{ width: 48, minWidth: 48, textAlign: "center", px: "4px !important" }}>
                  <Checkbox
                    size="small"
                    checked={allShareableSelected}
                    indeterminate={
                      selectedShareRowIds.size > 0 && !allShareableSelected
                    }
                    onChange={handleToggleSelectAllShareable}
                    disabled={isReadOnly || shareableRows.length === 0}
                    sx={{
                      p: 0.5,
                      color: "#A9ACA9",
                      "&.Mui-checked, &.MuiCheckbox-indeterminate": {
                        color: "#0A2E45",
                      },
                    }}
                  />
                </TableCell>
              )}
              {tableHeaders.map((header) => {
                // Handle responsive width and minWidth
                const width = typeof header.width === 'object' 
                  ? header.width 
                  : header.width;
                const minWidth = typeof header.minWidth === 'object' 
                  ? header.minWidth 
                  : header.minWidth || header.width;

                return (
                  <TableCell
                    key={header.id}
                    sx={{
                      width: width,
                      minWidth: minWidth,
                      textAlign: header.align,
                    }}
                    align={
                      header.align as
                        | "left"
                        | "center"
                        | "right"
                        | "inherit"
                        | "justify"
                        | undefined
                    }
                  >
                    <Typography
                      sx={{ 
                        fontSize: { xs: "12px", sm: "12.5px", md: "13px", lg: "13px" }, 
                        fontWeight: 500, 
                        color: "#212121",
                        whiteSpace: "nowrap",
                        ...(header.align && { textAlign: header.align }),
                      }}
                    >
                      {header.label}
                    </Typography>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>

          <TableBody>
            {currentData.map((row, index) => (
              <TableRow key={row.id || `row-${index}`}>
                {/* Share selection checkbox */}
                {canShareConsentForm && (
                  <TableCell
                    sx={{
                      width: 48,
                      minWidth: 48,
                      textAlign: "center",
                      px: "4px !important",
                      borderBottom: "1px solid #EEF1F4",
                    }}
                  >
                    <Tooltip
                      title={
                        isRowShareable(row)
                          ? ""
                          : row.isShared && !(row as any).contentChangedSinceShare
                            ? "Document already shared"
                            : (row as any).consentFormStatus === "DRAFT"
                              ? "Complete the form before sharing"
                              : "No document available to share"
                      }
                      disableHoverListener={isRowShareable(row)}
                      placement="right"
                    >
                      <span>
                        <Checkbox
                          size="small"
                          checked={selectedShareRowIds.has(row.id)}
                          onChange={() => handleToggleShareRow(row.id)}
                          disabled={!isRowShareable(row)}
                          sx={{
                            p: 0.5,
                            color: "#A9ACA9",
                            "&.Mui-checked": { color: "#0A2E45" },
                          }}
                        />
                      </span>
                    </Tooltip>
                  </TableCell>
                )}
                {/* Sr no */}
                <TableCell
                  sx={{
                    width: tableHeaders[0].width,
                    minWidth: tableHeaders[0].minWidth,
                    textAlign: "center",
                    fontSize: { xs: "12px", sm: "12.5px", md: "13px", lg: "13px" },
                    py: 1.5,
                    borderBottom: "1px solid #EEF1F4",
                  }}
                >
                  <Typography sx={primaryTextCss}>
                    {startIndex + index + 1}
                  </Typography>
                </TableCell>

                {/* Form Name */}
                <TableCell
                  sx={{
                    width: tableHeaders[1].width,
                    minWidth: tableHeaders[1].minWidth,
                    textAlign: "left",
                    fontSize: { xs: "12px", sm: "12.5px", md: "13px", lg: "13px" },
                    py: 1.5,
                    borderBottom: "1px solid #EEF1F4",
                  }}
                >
                  <Typography sx={primaryTextCss}>{row.formName}</Typography>
                </TableCell>

                {/* Documents */}
                <TableCell
                  sx={{
                    width: tableHeaders[2].width,
                    minWidth: tableHeaders[2].minWidth,
                    textAlign: "left",
                    fontSize: { xs: "12px", sm: "12.5px", md: "13px", lg: "13px" },
                    py: 1.5,
                    borderBottom: "1px solid #EEF1F4",
                  }}
                >
                  {renderDocumentsCell(row)}
                </TableCell>

                {/* Last Updated */}
                <TableCell
                  sx={{
                    width: tableHeaders[3].width,
                    minWidth: tableHeaders[3].minWidth,
                    textAlign: "left",
                    fontSize: { xs: "12px", sm: "12.5px", md: "13px", lg: "13px" },
                    py: 1.5,
                    borderBottom: "1px solid #EEF1F4",
                  }}
                >
                  <Typography sx={primaryTextCss}>
                    {row.lastUpdated || "—"}
                  </Typography>
                </TableCell>

                {/* Action - 3-dot menu */}
                <TableCell
                  sx={{
                    width: tableHeaders[4].width,
                    minWidth: tableHeaders[4].minWidth,
                    textAlign: "center",
                    fontSize: { xs: "12px", sm: "12.5px", md: "13px", lg: "13px" },
                    py: 1.5,
                    borderBottom: "1px solid #EEF1F4",
                  }}
                >
                  <IconButton
                    onClick={(event) => handleMenuClick(event, row)}
                    sx={{
                      padding: "4px",
                      borderRadius: "6px",
                      "&:hover": {
                        backgroundColor: "rgba(67, 147, 34, 0.04)",
                      },
                    }}
                  >
                    <MoreVertIcon
                      sx={{
                        width: 18,
                        height: 18,
                        color: "#2C2D2C",
                      }}
                    />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

          <Grid sx={{ p: 2, borderTop: "1px solid #E7E9EB" }}>
            <Paginator
              page={currentPage}
              totalPages={totalPages}
              totalRecord={totalRecords}
              onPageChange={handlePageChange}
              onRecordsPerPageChange={handlePageSizeChange}
              defaultSize={currentPageSize}
            />
          </Grid>
        </>
        ))}

      {/* Guardian / Agent signed forms — view and print only */}
      {(consentTab === "guardian" || consentTab === "agent") &&
        ((consentTab === "guardian"
          ? isGuardianFormsLoading
          : isAgentFormsLoading) ? (
          // While the signed-forms API is loading, show the shared table
          // skeleton instead of the "No signed forms found" empty state that
          // would otherwise flash before the rows arrive.
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              border: "1px solid #E3ECEF",
              borderRadius: "6px",
              overflow: "hidden",
            }}
          >
            <TableSkeleton
              headers={[
                { id: "srNo", label: "Sr. No", width: "70px" },
                { id: "formName", label: "Form Name", width: "280px" },
                { id: "status", label: "Status", width: "110px" },
                { id: "lastUpdated", label: "Last Updated", width: "170px" },
                { id: "action", label: "Action", width: "100px" },
              ]}
              rowCount={6}
              hasCheckbox={false}
              hasAvatar={false}
              hasActions={false}
            />
          </Box>
        ) : (
        <TableContainer
          sx={{
            flex: 1,
            border: "1px solid #E3ECEF",
            borderRadius: "6px",
            overflowY: "auto",
            backgroundColor: "#FFFFFF",
            minHeight: 0,
            width: "100%",
            scrollbarWidth: "thin",
            scrollbarColor: "#D1D5DB #F3F4F6",
            "&::-webkit-scrollbar": { width: "6px", height: "6px", display: "block" },
            "&::-webkit-scrollbar-track": { backgroundColor: "#F3F4F6" },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#D1D5DB",
              borderRadius: "3px",
              "&:hover": { backgroundColor: "#9CA3AF" },
            },
            "& .MuiTable-root": { borderCollapse: "separate", borderSpacing: 0 },
            "& .MuiTableHead-root .MuiTableCell-root": {
              backgroundColor: "#F2F7FA !important",
              borderBottom: "1px solid #E3ECEF",
              color: "#212121",
              position: "sticky",
              top: 0,
              zIndex: 10,
              whiteSpace: "nowrap",
              padding: "8px 16px",
              height: "44px",
            },
            "& .MuiTableBody-root .MuiTableCell-root": {
              borderBottom: "1px solid #ECEFF4",
              verticalAlign: "middle",
              padding: "8px 16px",
              whiteSpace: "nowrap",
            },
          }}
        >
          <Table stickyHeader sx={{ tableLayout: "auto", backgroundColor: "#FFFFFF" }}>
            <TableHead>
              <TableRow>
                {[
                  { id: "srNo", label: "Sr. No", align: "center" as const, minWidth: "70px" },
                  { id: "formName", label: "Form Name", align: "left" as const, minWidth: "280px" },
                  { id: "status", label: "Status", align: "center" as const, minWidth: "110px" },
                  { id: "lastUpdated", label: "Last Updated", align: "left" as const, minWidth: "170px" },
                  { id: "action", label: "Action", align: "center" as const, minWidth: "100px" },
                ].map((h) => (
                  <TableCell
                    key={h.id}
                    align={h.align}
                    sx={{ minWidth: h.minWidth, fontWeight: 500, fontSize: "13px" }}
                  >
                    {h.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {guardianAgentRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    align="center"
                    sx={{ py: 6, color: "#636262", fontSize: "14px", borderBottom: "none" }}
                  >
                    No signed forms found for guardian or agent.
                  </TableCell>
                </TableRow>
              ) : (
                guardianAgentRows.map((row, index) => (
                  <TableRow
                    key={row.id}
                    sx={{ "&:hover": { backgroundColor: "rgba(0,0,0,0.01)" } }}
                  >
                    <TableCell align="center">
                      <Typography sx={primaryTextCss}>{index + 1}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ ...primaryTextCss, fontWeight: 500 }}>
                        {row.displayName}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={row.status}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: "11px",
                          fontWeight: 500,
                          "& .MuiChip-label": { px: 1 },
                          backgroundColor:
                            row.status === "SIGNED"
                              ? "#E3F2FD"
                              : row.status === "COMPLETED"
                              ? "#E8F5E9"
                              : row.status === "DRAFT"
                              ? "#FFF3E0"
                              : "#F5F5F5",
                          color:
                            row.status === "SIGNED"
                              ? "#1565C0"
                              : row.status === "COMPLETED"
                              ? "#2E7D32"
                              : row.status === "DRAFT"
                              ? "#E65100"
                              : "#616161",
                        }}
                      />
                    </TableCell>
                    <TableCell align="left">
                      <Typography sx={{ ...primaryTextCss, color: "#636262" }}>
                        {row.lastUpdated}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                        <Tooltip title={row.canView ? "View" : "Not available"}>
                          <span>
                            <IconButton
                              size="small"
                              disabled={!row.canView}
                              onClick={() => handleGuardianAgentView(row)}
                              sx={{
                                color: row.canView ? "#0A2E45" : "#B0B0B0",
                                "&:hover": { backgroundColor: "rgba(10,46,69,0.08)" },
                              }}
                            >
                              <Visibility sx={{ width: 18, height: 18 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip
                          title={
                            !canPrintConsentForm
                              ? "You don't have permission"
                              : row.canPrint
                              ? "Print"
                              : "Not available"
                          }
                        >
                          <span>
                            <IconButton
                              size="small"
                              disabled={!canPrintConsentForm || !row.canPrint}
                              onClick={() => handleGuardianAgentPrint(row)}
                              sx={{
                                color:
                                  canPrintConsentForm && row.canPrint ? "#0A2E45" : "#B0B0B0",
                                "&:hover": { backgroundColor: "rgba(10,46,69,0.08)" },
                              }}
                            >
                              <Print sx={{ width: 18, height: 18 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        ))}

      {/* 3-dot Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: "#FFFFFF",
              border: "1px solid #DFE5E2",
              borderRadius: "6px",
              boxShadow:
                "0px 4px 6px -2px rgba(16, 24, 40, 0.03), 0px 12px 16px -4px rgba(16, 24, 40, 0.08)",
              padding: "4px 0",
              minWidth: "160px",
            },
          },
        }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <MenuItem
          onClick={() => {
            if (!menuRow) return;
            handleMenuClose();
            const form = menuRow as FormTableRow & {
              consentFormUuid?: string;
              hasUploadedFile?: boolean;
              fileUrl?: string;
            };
            if (form.hasUploadedFile && form.fileUrl) {
              handleViewDocument(menuRow.id);
            } else if (form.consentFormUuid) {
              isViewModeRef.current = true;
              setSelectedForm(form);
              setViewMode(true);
              // Transition: React waits for the lazy drawer chunk instead of
      // flashing the fallback, so the drawer animates in exactly once
      React.startTransition(() => setOpenFormDrawer(true));
            }
          }}
          disabled={!menuRow?.canView && !(menuRow as any)?.hasUploadedFile}
          sx={{ padding: "10px 14px", gap: "8px" }}
        >
          <ListItemIcon sx={{ minWidth: "18px !important" }}>
            <VisibilityIcon
              sx={{
                width: 18,
                height: 18,
                color:
                  menuRow?.canView || (menuRow as any)?.hasUploadedFile
                    ? "#2C2D2C"
                    : "#B0B0B0",
              }}
            />
          </ListItemIcon>
          <ListItemText
            primary="View"
            slotProps={{
              primary: {
                sx: {
                  fontSize: "13px",
                  fontWeight: 500,
                  color:
                    menuRow?.canView || (menuRow as any)?.hasUploadedFile
                      ? "#2C2D2C"
                      : "#B0B0B0",
                },
              },
            }}
          />
        </MenuItem>


        <MenuItem
          onClick={() => {
            if (!menuRow) return;
            handleMenuClose();
            const form = menuRow as FormTableRow & {
              consentFormUuid?: string;
            };
            // Route to media-based history for upload-only repeating forms
            if (
              form.documentType !== "fillForm" &&
              form.documentType !== "filled" &&
              form.uploadType === "repeating" &&
              !form.consentFormUuid
            ) {
              handleOpenMediaHistory(menuRow.id);
            } else if (form.consentFormUuid) {
              setSelectedHistoryForm(form);
              React.startTransition(() => setOpenHistoryDrawer(true));
            }
            onHistory?.(menuRow.id);
          }}
          disabled={!menuRow?.hasHistory}
          sx={{ padding: "10px 14px", gap: "8px" }}
        >
          <ListItemIcon sx={{ minWidth: "18px !important" }}>
            <HistoryIcon
              sx={{
                width: 18,
                height: 18,
                color: menuRow?.hasHistory ? "#2C2D2C" : "#B0B0B0",
              }}
            />
          </ListItemIcon>
          <ListItemText
            primary="History"
            slotProps={{
              primary: {
                sx: {
                  fontSize: "13px",
                  fontWeight: 500,
                  color: menuRow?.hasHistory ? "#2C2D2C" : "#B0B0B0",
                },
              },
            }}
          />
        </MenuItem>
        <Tooltip
          title={!canPrintConsentForm ? "You don't have permission" : ""}
          arrow
          placement="left"
          disableHoverListener={canPrintConsentForm}
        >
          <span>
            <MenuItem
              onClick={() => {
                if (!menuRow) return;
                handleMenuClose();
                const form = menuRow as FormTableRow & {
                  consentFormUuid?: string;
                  consentFormStatus?: string;
                  hasUploadedFile?: boolean;
                  fileUrl?: string;
                };
                if (form.hasUploadedFile && form.fileUrl) {
                  handlePrintDocument(menuRow.id);
                } else {
                  handlePrint(form);
                }
              }}
              disabled={
                !canPrintConsentForm || (!menuRow?.canPrint && !(menuRow as any)?.hasUploadedFile)
              }
              sx={{ padding: "10px 14px", gap: "8px" }}
            >
              <ListItemIcon sx={{ minWidth: "18px !important" }}>
                <PrintIcon
                  sx={{
                    width: 18,
                    height: 18,
                    color:
                      canPrintConsentForm && (menuRow?.canPrint || (menuRow as any)?.hasUploadedFile)
                        ? "#2C2D2C"
                        : "#B0B0B0",
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary="Print"
                slotProps={{
                  primary: {
                    sx: {
                      fontSize: "13px",
                      fontWeight: 500,
                      color:
                        canPrintConsentForm && (menuRow?.canPrint || (menuRow as any)?.hasUploadedFile)
                          ? "#2C2D2C"
                          : "#B0B0B0",
                    },
                  },
                }}
              />
            </MenuItem>
          </span>
        </Tooltip>
        {(() => {
          // Shared AND unchanged since the last share → block re-sharing.
          // If the form was edited or a new file uploaded after sharing,
          // the row becomes shareable again (new version for the portal).
          const shareBlockedAlreadyShared =
            Boolean(menuRow?.isShared) &&
            !(menuRow as any)?.contentChangedSinceShare;
          return (
        <Tooltip
          title={
            !canShareConsentForm
              ? "You don't have permission"
              : shareBlockedAlreadyShared
              ? "Document already shared"
              : (menuRow as any)?.consentFormStatus === "DRAFT"
              ? "Complete the form before sharing"
              : isReadOnly
              ? (disabledReason || "")
              : ""
          }
          disableHoverListener={
            canShareConsentForm &&
            !shareBlockedAlreadyShared &&
            !isReadOnly &&
            ((menuRow as any)?.consentFormStatus === "COMPLETED" ||
              (menuRow as any)?.consentFormStatus === "SIGNED" ||
              Boolean((menuRow as any)?.hasUploadedFile))
          }
          placement="left"
        >
          <span>
            <MenuItem
              onClick={() => menuRow && !shareBlockedAlreadyShared && handleShareClick(menuRow)}
              disabled={
                !canShareConsentForm ||
                isReadOnly ||
                shareBlockedAlreadyShared ||
                (
                  // For uploaded files: enable share as long as there is a file
                  !(menuRow as any)?.hasUploadedFile &&
                  (
                    (!menuRow?.canView && !(menuRow as any)?.consentFormUuid) ||
                    (menuRow as any)?.consentFormStatus === "DRAFT" ||
                    !(menuRow as any)?.consentFormStatus
                  )
                )
              }
              sx={{ padding: "10px 14px", gap: "8px" }}
            >
              <ListItemIcon sx={{ minWidth: "18px !important" }}>
                <ShareIcon
                  sx={{
                    width: 18,
                    height: 18,
                    color:
                      canShareConsentForm &&
                      !isReadOnly &&
                      !shareBlockedAlreadyShared &&
                      (
                        (menuRow as any)?.hasUploadedFile ||
                        (((menuRow as any)?.consentFormStatus === "COMPLETED" || (menuRow as any)?.consentFormStatus === "SIGNED") && menuRow?.canView)
                      )
                        ? "#2C2D2C"
                        : "#B0B0B0",
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary="Share"
                slotProps={{
                  primary: {
                    sx: {
                      fontSize: "13px",
                      fontWeight: 500,
                      color:
                        canShareConsentForm &&
                        !isReadOnly &&
                        !shareBlockedAlreadyShared &&
                        (
                          (menuRow as any)?.hasUploadedFile ||
                          ((menuRow as any)?.consentFormStatus === "COMPLETED" && menuRow?.canView)
                        )
                          ? "#2C2D2C"
                          : "#B0B0B0",
                    },
                  },
                }}
              />
            </MenuItem>
          </span>
        </Tooltip>
          );
        })()}
        {/* Only show Delete menu item if it's not disabled */}
        {!(
          isReadOnly ||
          isDSP ||
          (!menuRow?.canDelete && !(menuRow as any)?.hasUploadedFile) ||
          deleteConsentFormMutationHook.isPending ||
          deleteMedia.isPending ||
          ((menuRow as any)?.fileCount ?? 0) > 1 // Hide delete for multiple files
        ) && (
          <Tooltip
            title={!canDeleteConsentForm ? "You don't have permission" : ""}
            arrow
            placement="left"
            disableHoverListener={canDeleteConsentForm}
          >
            <span>
              <MenuItem
                onClick={() => {
                  if (!menuRow) return;
                  handleMenuClose();
                  const form = menuRow as FormTableRow & {
                    consentFormUuid?: string;
                    consentFormStatus?: string;
                    hasUploadedFile?: boolean;
                    mediaId?: string | null;
                    fileCount?: number;
                  };
                  // For multiple documents, don't show delete in menu - only in preview
                  // Only show delete for single documents or consent forms
                  if (form.hasUploadedFile && form.mediaId && (form.fileCount ?? 0) <= 1) {
                    handleDeleteDocument(menuRow.id);
                  } else if (
                    form.consentFormUuid &&
                    (form.consentFormStatus === "COMPLETED" ||
                      form.consentFormStatus === "DRAFT")
                  ) {
                    setFormToDelete(form);
                    setOpenDeleteConfirm(true);
                  }
                }}
                disabled={!canDeleteConsentForm}
                sx={{ padding: "10px 14px", gap: "8px" }}
              >
                <ListItemIcon sx={{ minWidth: "18px !important" }}>
                  <DeleteIcon
                    sx={{
                      width: 18,
                      height: 18,
                      color: canDeleteConsentForm ? "#B51C1C" : "#B0B0B0",
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary="Delete"
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: "13px",
                        fontWeight: 500,
                        color: canDeleteConsentForm ? "#B51C1C" : "#B0B0B0",
                      },
                    },
                  }}
                />
              </MenuItem>
            </span>
          </Tooltip>
        )}
      </Menu>

      {/* Share Dialog */}
      <CustomDialog
        open={shareDialogOpen}
        onClose={() => {
          setShareDialogOpen(false);
          setShareFormRow(null);
          setShareSelectedMode(false);
        }}
        title={
          <Typography variant="h6" sx={{ fontSize: "18px", fontWeight: 600 }}>
            {shareSelectedMode ? "Share Documents" : "Share Form"}
          </Typography>
        }
        buttonName={[]}
        width="480px"
        padding="24px"
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, py: 1 }}>
          {shareSelectedMode ? (
            <>
              <Typography sx={{ fontSize: "14px", color: "#636262" }}>
                Share{" "}
                <strong>
                  {selectedShareRowIds.size} document
                  {selectedShareRowIds.size === 1 ? "" : "s"}
                </strong>{" "}
                via email. Select one or more recipients:
              </Typography>
              <Box
                component="ul"
                sx={{ m: 0, pl: 2.5, display: "flex", flexDirection: "column", gap: 0.5 }}
              >
                {shareableRows
                  .filter((f) => selectedShareRowIds.has(f.id))
                  .map((f) => (
                    <Typography
                      key={f.id}
                      component="li"
                      sx={{ fontSize: "13px", color: "#25272c", fontWeight: 500 }}
                    >
                      {f.formName}
                      {(f as any).isShared &&
                      (f as any).contentChangedSinceShare
                        ? " (updated — will be shared as a new version)"
                        : ""}
                    </Typography>
                  ))}
              </Box>
            </>
          ) : (
          <Typography sx={{ fontSize: "14px", color: "#636262" }}>
            Share <strong>{shareFormRow?.formName}</strong> via email. Select
            one or more recipients:
          </Typography>
          )}

          <FormGroup>
            {/* Guardian option */}
            {guardianDetails?.email && (
              <Box
                sx={{
                  border: shareRecipients.includes("guardian")
                    ? "1.5px solid #0A2E45"
                    : "1px solid #E3ECEF",
                  borderRadius: "8px",
                  p: 2,
                  mb: 1.5,
                  cursor: "pointer",
                  backgroundColor: shareRecipients.includes("guardian")
                    ? "#F8FBFF"
                    : "#FFFFFF",
                }}
                onClick={() => {
                  setShareRecipients((prev) =>
                    prev.includes("guardian")
                      ? prev.filter((r) => r !== "guardian")
                      : [...prev, "guardian"],
                  );
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={shareRecipients.includes("guardian")}
                      sx={{
                        color: "#0A2E45",
                        "&.Mui-checked": { color: "#0A2E45" },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ ml: 0.5 }}>
                      <Typography
                        sx={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#212121",
                        }}
                      >
                        Guardian
                      </Typography>
                      <Typography sx={{ fontSize: "13px", color: "#636262" }}>
                        {guardianDetails.name || "—"}
                      </Typography>
                      <Typography sx={{ fontSize: "12px", color: "#757775" }}>
                        {guardianDetails.email}{" "}
                        {guardianDetails.phone
                          ? `| ${guardianDetails.phone}`
                          : ""}
                      </Typography>
                    </Box>
                  }
                  sx={{ m: 0, alignItems: "flex-start" }}
                />
              </Box>
            )}

            {/* Agent option */}
            {agentDetails?.email && (
              <Box
                sx={{
                  border: shareRecipients.includes("agent")
                    ? "1.5px solid #0A2E45"
                    : "1px solid #E3ECEF",
                  borderRadius: "8px",
                  p: 2,
                  cursor: "pointer",
                  backgroundColor: shareRecipients.includes("agent")
                    ? "#F8FBFF"
                    : "#FFFFFF",
                }}
                onClick={() => {
                  setShareRecipients((prev) =>
                    prev.includes("agent")
                      ? prev.filter((r) => r !== "agent")
                      : [...prev, "agent"],
                  );
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={shareRecipients.includes("agent")}
                      sx={{
                        color: "#0A2E45",
                        "&.Mui-checked": { color: "#0A2E45" },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ ml: 0.5 }}>
                      <Typography
                        sx={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#212121",
                        }}
                      >
                        Area Agency
                      </Typography>
                      <Typography sx={{ fontSize: "13px", color: "#636262" }}>
                        {agentDetails.name || "—"}
                      </Typography>
                      <Typography sx={{ fontSize: "12px", color: "#757775" }}>
                        {agentDetails.email}{" "}
                        {agentDetails.phone ? `| ${agentDetails.phone}` : ""}
                      </Typography>
                    </Box>
                  }
                  sx={{ m: 0, alignItems: "flex-start" }}
                />
              </Box>
            )}

            {!guardianDetails?.email && !agentDetails?.email && (
              <Typography
                sx={{
                  fontSize: "13px",
                  color: "#757775",
                  textAlign: "center",
                  py: 2,
                }}
              >
                No guardian or agent email available to share with.
              </Typography>
            )}

            {/* Custom email recipients */}
            {customRecipients.map((cr) => (
              <Box key={cr.id} sx={{ mt: 1.5 }}>
                <CustomInput
                  name={cr.id}
                  placeholder="Enter email address"
                  value={cr.email}
                  onChange={(e) =>
                    setCustomRecipients((prev) =>
                      prev.map((r) =>
                        r.id === cr.id ? { ...r, email: e.target.value } : r,
                      ),
                    )
                  }
                  hasError={
                    cr.email.trim().length > 0 &&
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cr.email.trim())
                  }
                  errorMessage={
                    cr.email.trim().length > 0 &&
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cr.email.trim())
                      ? "Invalid email"
                      : ""
                  }
                  bgWhite={true}
                />
              </Box>
            ))}

            {/* + Add New */}
            <Box
              onClick={() =>
                setCustomRecipients((prev) => [
                  ...prev,
                  { id: `custom-${Date.now()}`, email: "", checked: true },
                ])
              }
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                mt: 1.5,
                cursor: "pointer",
                color: "#0A2E45",
                fontSize: "13px",
                fontWeight: 500,
                "&:hover": { textDecoration: "underline" },
                userSelect: "none",
              }}
            >
              <span style={{ fontSize: "16px", lineHeight: 1 }}>+</span> Add New
            </Box>
          </FormGroup>

          {/* Action buttons */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1.5,
              pt: 1,
            }}
          >
            <CustomButton
              variant="secondary"
              size="sm"
              onClick={() => {
                setShareDialogOpen(false);
                setShareFormRow(null);
                setShareSelectedMode(false);
              }}
              sx={{ minWidth: "80px" }}
            >
              Cancel
            </CustomButton>
            <CustomButton
              variant="primary"
              size="sm"
              onClick={shareSelectedMode ? handleShareSelectedConfirm : handleShareConfirm}
              loading={shareConsentFormMutationHook.isPending || isShareProcessing}
              disabled={
                isShareProcessing ||
                shareConsentFormMutationHook.isPending ||
                (
                  shareRecipients.length === 0 &&
                  customRecipients.filter(
                    (r) => r.email.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email.trim()),
                  ).length === 0
                ) ||
                customRecipients.some(
                  (r) => r.email.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email.trim()),
                ) ||
                (shareSelectedMode
                  ? selectedShareRowIds.size === 0
                  : (!(shareFormRow as any)?.consentFormUuid && !(shareFormRow as any)?.hasUploadedFile))
              }
              sx={{ minWidth: "80px" }}
            >
              Share
            </CustomButton>
          </Box>
        </Box>
      </CustomDialog>

      {/* Boundary stays mounted: opening inside a transition lets React wait
          for the lazy chunk, so the drawer animates in exactly once */}
      <Suspense fallback={drawerLoadingFallback}>
      {selectedForm && openFormDrawer && (
        <>
          {selectedForm.formName === "Health History Form" && (
            <HealthHistoryFormDrawer
              open={openFormDrawer}
              onClose={() => handleDrawerClose(selectedForm.formName)}
              individualName={residentName}
              formName={selectedForm.formName}
              residentUuid={residentData?.uuid || residentData?.resident_uuid}
              consentUuid={(selectedForm as any).consentFormUuid}
              mode={
                viewMode
                  ? "view"
                  : (selectedForm as any).consentFormStatus === "DRAFT"
                    ? "draft"
                    : "new"
              }
              onAfterSubmit={() => {
                // Only refetch if not in view mode
                if (residentUuid && !viewMode && !isViewModeRef.current) {
                  setTimeout(() => {
                    refetchConsentForms();
                  }, 200);
                }
              }}
              onAfterSave={() => {
                // Only refetch if not in view mode
                if (residentUuid && !viewMode && !isViewModeRef.current) {
                  setTimeout(() => {
                    refetchConsentForms();
                  }, 200);
                }
              }}
            />
          )}
          {selectedForm.formName === "5 and 30 Day Nursing Transition Evaluation Form" && (
            <NursingTransitionEvaluationDrawer
              open={openFormDrawer}
              onClose={() => handleDrawerClose(selectedForm.formName)}
              individualName={residentName}
              formName={selectedForm.formName}
              residentUuid={residentUuid}
              consentUuid={(selectedForm as any).consentFormUuid}
              mode={
                viewMode
                  ? "view"
                  : (selectedForm as any).consentFormStatus === "DRAFT"
                    ? "draft"
                    : "new"
              }
              onAfterSubmit={() => {
                if (residentUuid && !viewMode && !isViewModeRef.current) {
                  setTimeout(() => {
                    refetchConsentForms();
                  }, 200);
                }
              }}
              onAfterSave={() => {
                if (residentUuid && !viewMode && !isViewModeRef.current) {
                  setTimeout(() => {
                    refetchConsentForms();
                  }, 200);
                }
              }}
            />
          )}
          {/* {selectedForm.formName === "Medication Disposal Sheet" && (
            <MedicationDisposalSheetDrawer
              open={openFormDrawer}
              onClose={() => {
                handleDrawerClose(selectedForm.formName);
                setSelectedHistoryEntry(null);
              }}
              individualName={residentName}
              formName={selectedForm.formName}
              residentData={residentData}
              consentUuid={(selectedForm as any).consentFormUuid}
              mode={
                viewMode
                  ? "view"
                  : (selectedForm as any).consentFormStatus === "DRAFT"
                    ? "draft"
                    : "new"
              }
              historyEntry={selectedHistoryEntry}
              onAfterSubmit={() => {
                // Only refetch if not in view mode
                if (residentUuid && !viewMode && !isViewModeRef.current) {
                  setTimeout(() => {
                    refetchConsentForms();
                  }, 200);
                }
              }}
              onAfterSave={() => {
                // Only refetch if not in view mode
                if (residentUuid && !viewMode && !isViewModeRef.current) {
                  setTimeout(() => {
                    refetchConsentForms();
                  }, 200);
                }
              }}
            />
          )} */}
          {selectedForm.formName === "Fire safety assessment" && (
            <FireSafetyAssessmentDrawer
              open={openFormDrawer}
              onClose={() => handleDrawerClose(selectedForm.formName)}
              individualName={residentName}
              formName={selectedForm.formName}
              residentData={residentData}
              consentUuid={(selectedForm as any).consentFormUuid}
              mode={
                viewMode
                  ? "view"
                  : (selectedForm as any).consentFormStatus === "DRAFT"
                    ? "draft"
                    : "new"
              }
              onAfterSave={() => {
                if (residentUuid) {
                  // Refetch immediately to get updated created_at/updated_at
                  setTimeout(() => {
                    refetchConsentForms();
                  }, 200);
                }
              }}
            />
          )}
          {selectedForm.formName === "BSP (Behavior Support Plan)" && (
            <BehaviorSupportPlanDrawer
              open={openFormDrawer}
              onClose={() => handleDrawerClose(selectedForm.formName)}
              formName={selectedForm.formName}
              individualName={residentName}
              residentData={residentData}
              consentUuid={(selectedForm as any).consentFormUuid}
              mode={
                viewMode
                  ? "view"
                  : (selectedForm as any).consentFormStatus === "DRAFT"
                    ? "draft"
                    : "new"
              }
              onAfterSubmit={() => {
                // Only refetch if not in view mode
                if (residentUuid && !viewMode && !isViewModeRef.current) {
                  setTimeout(() => {
                    refetchConsentForms();
                  }, 200);
                }
              }}
              onAfterSave={() => {
                // Only refetch if not in view mode
                if (residentUuid && !viewMode && !isViewModeRef.current) {
                  setTimeout(() => {
                    refetchConsentForms();
                  }, 200);
                }
              }}
            />
          )}
          {selectedForm.formName === "HRST monthly tracker" && (
            <MonthlyDataTrackerHRSTDrawer
              open={openFormDrawer}
              onClose={() => handleDrawerClose(selectedForm.formName)}
              residentName={
                residentName ||
                (residentData?.user?.first_name && residentData?.user?.last_name
                  ? `${residentData.user.first_name} ${residentData.user.last_name}`
                  : "")
              }
              residentId={residentData?.id || residentData?.uuid || ""}
              residentData={residentData}
              consentUuid={(selectedForm as any).consentFormUuid}
              mode={
                viewMode
                  ? "view"
                  : isHrstEditMode
                    ? "edit"
                    : (selectedForm as any).consentFormStatus === "DRAFT"
                      ? "draft"
                      : "new"
              }
              historyEntry={selectedHistoryEntry}
              onAfterSubmit={() => {
                if (residentUuid) {
                  // Refetch immediately to get updated created_at/updated_at
                  setTimeout(() => {
                    refetchConsentForms();
                  }, 200);
                }
              }}
            />
          )}
          {selectedForm.formName === "Resident Inventory List" && (
            <ResidentInventoryListDrawer
              open={openFormDrawer}
              onClose={() => handleDrawerClose(selectedForm.formName)}
              formName={selectedForm.formName}
              individualName={residentName}
              residentData={residentData}
              consentUuid={(selectedForm as any).consentFormUuid}
              mode={
                viewMode
                  ? "view"
                  : (selectedForm as any).consentFormStatus === "DRAFT"
                    ? "draft"
                    : "new"
              }
              onAfterSave={() => {
                if (residentUuid && !viewMode && !isViewModeRef.current) {
                  setTimeout(() => {
                    refetchConsentForms();
                  }, 200);
                }
              }}
              onAfterSubmit={() => {
                if (residentUuid && !viewMode && !isViewModeRef.current) {
                  setTimeout(() => {
                    refetchConsentForms();
                  }, 200);
                }
              }}
            />
          )}
        </>
      )}
      </Suspense>

      {/* History Drawer */}
      <Suspense fallback={drawerLoadingFallback}>
      {selectedHistoryForm && openHistoryDrawer && (
          <FormHistoryDrawer
            open={openHistoryDrawer}
            onClose={() => {
              setOpenHistoryDrawer(false);
              setSelectedHistoryForm(null);
              setSelectedHistoryEntry(null);
            }}
            formName={selectedHistoryForm.formName}
            consentUuid={(selectedHistoryForm as any).consentFormUuid}
            onViewEntry={(entry) => {
              // Set the selected entry and open the form drawer in view mode
              // Set viewMode ref FIRST (synchronously) to prevent race condition
              isViewModeRef.current = true;
              setSelectedHistoryEntry(entry);
              setSelectedForm(selectedHistoryForm);
              setViewMode(true);
              // Transition: React waits for the lazy drawer chunk instead of
      // flashing the fallback, so the drawer animates in exactly once
      React.startTransition(() => setOpenFormDrawer(true));
              setOpenHistoryDrawer(false);
            }}
            onPrintEntry={async (entry) => {
              // Use form_json directly from the history entry (already loaded)
              const formJson = entry?.form_json || {};
              const formName = selectedHistoryForm?.formName || "";

              await getConsentFormPdfBlob(formName, formJson, residentName, true);
            }}
            onDeleteEntry={() => {
              // Refetch consent forms list after a history entry is deleted
              setTimeout(() => {
                refetchConsentForms();
              }, 200);
            }}
          />
      )}
      </Suspense>

      {/* Lead form drawers — Guardian/Agent tab, view mode only */}
      <Suspense fallback={drawerLoadingFallback}>
      {selectedLeadForm && leadFormDrawerOpen && (
        <>
          {selectedLeadForm.rawFormName === "NH Residency Agreement" && (
            <LeadNHResidencyAgreementDrawer
              open={leadFormDrawerOpen}
              onClose={() => { setLeadFormDrawerOpen(false); setSelectedLeadForm(null); }}
              formName={selectedLeadForm.rawFormName}
              leadName={residentName}
              leadUuid={residentData?.uuid}
              consentUuid={selectedLeadForm.consentFormUuid || null}
              mode="view"
              signerType={selectedLeadForm.signerType}
            />
          )}
          {selectedLeadForm.rawFormName === "CAFC House rules" && (
            <LeadHouseRulesDrawer
              open={leadFormDrawerOpen}
              onClose={() => { setLeadFormDrawerOpen(false); setSelectedLeadForm(null); }}
              formName={selectedLeadForm.rawFormName}
              leadName={residentName}
              leadUuid={residentData?.uuid}
              consentUuid={selectedLeadForm.consentFormUuid || null}
              mode="view"
              signerType={selectedLeadForm.signerType}
            />
          )}
          {selectedLeadForm.rawFormName === "Blank ROI" && (
            <LeadHIPAAReleaseFillFormDrawer
              open={leadFormDrawerOpen}
              onClose={() => { setLeadFormDrawerOpen(false); setSelectedLeadForm(null); }}
              formName={selectedLeadForm.rawFormName}
              leadName={residentName}
              leadUuid={residentData?.uuid}
              consentUuid={selectedLeadForm.consentFormUuid || null}
              mode="view"
              signerType={selectedLeadForm.signerType}
            />
          )}
          {selectedLeadForm.rawFormName === "Service agreement" && (
            <LeadServiceAgreementDrawer
              open={leadFormDrawerOpen}
              onClose={() => { setLeadFormDrawerOpen(false); setSelectedLeadForm(null); }}
              formName={selectedLeadForm.rawFormName}
              leadName={residentName}
              leadUuid={residentData?.uuid}
              consentUuid={selectedLeadForm.consentFormUuid || null}
              mode="view"
              signerType={selectedLeadForm.signerType}
            />
          )}
        </>
      )}
      </Suspense>

      {/* Media-based History Drawer (for upload-only repeating forms) */}
      <CustomDrawer
        open={mediaHistoryDrawerOpen}
        onClose={() => {
          setMediaHistoryDrawerOpen(false);
          setMediaHistoryFormName("");
          setMediaHistoryEntries([]);
        }}
        anchor="right"
        drawerWidth="600px"
        drawerPadding="0"
      >
        <Grid
          container
          direction="column"
          sx={{
            height: "100%",
            overflow: "hidden",
            backgroundColor: "#FFFFFF",
          }}
        >
          {/* Header */}
          <Grid
            size={{ xs: 12 }}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 24px",
              borderBottom: "1px solid #E3ECEF",
              flexShrink: 0,
              marginTop: "-10px",
            }}
          >
            <Typography
              sx={{
                fontSize: "18px",
                fontWeight: 600,
                color: "#0F172A",
                fontFamily: "Geist",
                lineHeight: "24px",
              }}
            >
              Log of {mediaHistoryFormName}
            </Typography>

            <IconButton
              onClick={() => {
                setMediaHistoryDrawerOpen(false);
                setMediaHistoryFormName("");
                setMediaHistoryEntries([]);
              }}
              sx={{
                padding: "4px",
                color: "#757775",
                "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
              }}
            >
              <Close />
            </IconButton>
          </Grid>

          {/* Table Content */}
          <Grid
            sx={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              minHeight: 0,
              maxHeight: "100%",
            }}
          >
            {mediaHistoryEntries.length === 0 ? (
              <Grid container justifyContent="center" sx={{ py: 4 }}>
                <Typography sx={{ color: "#757775" }}>
                  No history available
                </Typography>
              </Grid>
            ) : (
              <TableContainer>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: 500,
                          backgroundColor: "#F2F7FA",
                          color: "#212121",
                          borderBottom: "1px solid #E3ECEF",
                          fontSize: "13px",
                          py: 1.2,
                        }}
                      >
                        File Name
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 500,
                          backgroundColor: "#F2F7FA",
                          color: "#212121",
                          borderBottom: "1px solid #E3ECEF",
                          fontSize: "13px",
                          py: 1.2,
                        }}
                      >
                        Last Updated Date
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 500,
                          backgroundColor: "#F2F7FA",
                          color: "#212121",
                          borderBottom: "1px solid #E3ECEF",
                          fontSize: "13px",
                          py: 1.2,
                          textAlign: "center",
                        }}
                      >
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mediaHistoryEntries.map((entry) => (
                      <TableRow key={entry.mediaId}>
                        <TableCell
                          sx={{
                            fontSize: "13px",
                            py: 1.5,
                            borderBottom: "1px solid #EEF1F4",
                            color: "#212121",
                          }}
                        >
                          <Grid
                            container
                            alignItems="center"
                            spacing={1}
                            wrap="nowrap"
                          >
                            <Grid>
                              <DescriptionIcon
                                sx={{
                                  fontSize: 20,
                                  color: "#6B7280",
                                  flexShrink: 0,
                                }}
                              />
                            </Grid>
                            <Grid>
                              <Typography
                                sx={{
                                  fontSize: "13px",
                                  fontWeight: 400,
                                  color: "#11466D",
                                  cursor: "pointer",
                                  "&:hover": { textDecoration: "underline" },
                                }}
                                onClick={() =>
                                  handleViewMediaHistoryEntry(entry)
                                }
                              >
                                {truncateFileName(entry.fileName)}
                              </Typography>
                            </Grid>
                          </Grid>
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: "13px",
                            py: 1.5,
                            borderBottom: "1px solid #EEF1F4",
                            color: "#212121",
                          }}
                        >
                          {entry.uploadDate}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: "13px",
                            py: 1.5,
                            borderBottom: "1px solid #EEF1F4",
                          }}
                        >
                          <Grid
                            container
                            alignItems="center"
                            wrap="nowrap"
                            justifyContent="center"
                            sx={{ gap: 2 }}
                          >
                            <Tooltip title="View">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleViewMediaHistoryEntry(entry)
                                }
                                sx={{ color: "#0A2E45" }}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Print">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handlePrintMediaHistoryEntry(entry)
                                }
                                sx={{ color: "#0A2E45" }}
                              >
                                <Print fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={isBCBA || isDSP ? "You don't have permission" : "Delete"}>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleDeleteMediaHistoryEntry(entry.mediaId)
                                  }
                                  disabled={isBCBA || isDSP || deleteMedia.isPending}
                                  sx={{ color: isBCBA || isDSP ? "#BDBDBD" : "#DC2626" }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Grid>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Grid>
        </Grid>
      </CustomDrawer>

      <UploadProgressPanel progress={uploadProgress} onCancel={cancelUpload} />

      {/* Snackbar for success/error messages */}
      <CommonSnackbar
        isOpen={snackbar.isOpen}
        message={snackbar.message}
        status={snackbar.status}
        onClose={() => setSnackbar({ ...snackbar, isOpen: false })}
        autoClose={true}
        autoCloseDelay={1000}
      />

      {/* Delete Confirmation Popup for Forms */}
      <ConfirmationPopUp
        open={openDeleteConfirm}
        onClose={() => {
          setOpenDeleteConfirm(false);
          setFormToDelete(null);
        }}
        onConfirm={() => {
          if (formToDelete?.consentFormUuid) {
            deleteConsentFormMutationHook.mutate({
              path: {
                uuid: formToDelete.consentFormUuid,
              },
            } as any);
            onDelete?.(formToDelete.id);
            setOpenDeleteConfirm(false);
            setFormToDelete(null);
          }
        }}
        message={`Are you sure you want to delete "${formToDelete?.formName}"? This action cannot be undone.`}
        confirmDisabled={deleteConsentFormMutationHook.isPending}
      />

      {/* Delete Confirmation Popup for Uploaded Documents (and media history entries) */}
      <ConfirmationPopUp
        open={deleteDocumentDialogOpen}
        onClose={() => {
          setDeleteDocumentDialogOpen(false);
          setSelectedDocumentId(null);
          setDeleteMediaHistoryId(null);
        }}
        onConfirm={() => {
          if (deleteMediaHistoryId) {
            // Delete media directly using the media ID
            deleteMedia.mutate({ path: { id: deleteMediaHistoryId } });
            // Don't close dialog here - let onSuccess handler do it
          } else if (selectedDocumentId !== null) {
            // selectedDocumentId can be either formId or mediaId
            // If it's a mediaId (string/number), use it directly
            // Otherwise, find the form and use its mediaId
            const form = enrichedData.find((f) => f.id === selectedDocumentId);
            if (form?.mediaId) {
              deleteMedia.mutate({ path: { id: form.mediaId } });
            } else if (selectedDocumentId) {
              // Direct media ID from preview dialog or thumbnail
              deleteMedia.mutate({ path: { id: String(selectedDocumentId) } });
            }
          }
        }}
        message="Are you sure you want to delete this document?"
        confirmDisabled={deleteMedia.isPending}
      />

      {/* Document Preview Dialog */}
      <ViewDocumentsDialog
        open={previewDialogOpen}
        onClose={() => {
          setPreviewDialogOpen(false);
          setPreviewFiles([]);
        }}
        files={previewFiles}
        title="Document Viewer"
        onDelete={handleDeleteDocumentFromPreview}
        allowDownload={true}
      />

      {/* File Size Alert Dialog */}
      <CustomDialog
        open={alertDialog.open}
        onClose={() => setAlertDialog({ open: false, message: "" })}
        title="Alert"
        width="400px"
        buttonName={[]}
      >
        <Grid container direction="column" gap={2} alignItems="center" sx={{ textAlign: "center", py: 1 }}>
          <Typography variant="body1">{alertDialog.message}</Typography>
          <Button
            variant="contained"
            onClick={() => setAlertDialog({ open: false, message: "" })}
            sx={{
              backgroundColor: "#173B5B",
              color: "#FFFFFF",
              borderRadius: "6px",
              px: 4,
              "&:hover": { backgroundColor: "#0F2A42" },
            }}
          >
            OK
          </Button>
        </Grid>
      </CustomDialog>
    </Grid>
  );
};

/* ================= Styles ================= */

const uploadButtonStyles = {
  "& button": {
    backgroundColor: "#E3F2FD !important",
    border: "1px solid #90CAF9 !important",
    color: "#1976D2 !important",
    borderRadius: "6px !important",
    padding: "6px 12px !important",
    fontSize: "13px !important",
    fontWeight: 400,
    minHeight: "32px !important",

    "&:hover": {
      backgroundColor: "#BBDEFB !important",
      borderColor: "#64B5F6 !important",
    },

    "&:focus": {
      backgroundColor: "#BBDEFB !important",
      borderColor: "#64B5F6 !important",
      boxShadow: "0 0 0 2px rgba(25, 118, 210, 0.1) !important",
    },

    "& svg": {
      color: "#1976D2 !important",
      fontSize: "16px !important",
    },
  },
};

export default ConsentFormsTable;
