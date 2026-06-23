import React, { useMemo, useState, Suspense } from "react";
import dayjs from "dayjs";
import {
  Grid,
  Typography,
  IconButton,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import Close from "@mui/icons-material/Close";
import DescriptionIcon from "@mui/icons-material/Description";
import Visibility from "@mui/icons-material/Visibility";
import Print from "@mui/icons-material/Print";
import Delete from "@mui/icons-material/Delete";
import { useAppSelector } from "../../../store/hooks";

import {
  mediaListOptions,
  mediaDeleteDestroyMutation,
  refreshLeadStatusMutation,
  getLeadDetailQueryKey,
  listConsentFormsOptions,
  listConsentFormsQueryKey,
  deleteConsentFormMutation,
  getConsentFormDetailOptions,
  residentsResidentScheduledFormsRetrieveOptions,
  residentsResidentScheduledFormsRetrieveQueryKey,
  residentsResidentScheduledFormsCreateMutation,
  residentsResidentScheduledFormsDestroyMutation,
} from "../../../sdk/@tanstack/react-query.gen";

const NursingTransitionEvaluationDrawer = React.lazy(() =>
  import("./NursingTransitionEvaluationDrawer").then((m) => ({ default: m.default })),
);
import {
  useMediaUpload,
  UPLOAD_CANCELLED_MESSAGE,
} from "../../../hooks/useMediaUpload";
import UploadProgressPanel from "../../../components/upload-progress-panel/upload-progress-panel";

import DocumentsTable from "./DocumentsTable";
import ConfirmationPopUp from "../../../components/confirmation-pop-up/confirmation-pop-up";
import CommonSnackbar from "../../../components/common-snackbar/common-snackbar";
import ViewDocumentsDialog, {
  type ViewDocumentFile,
} from "../../appointments/components/ViewDocumentsDialog";
import CustomDialog from "../../../components/custom-dialog/custom-dialog";
import CustomDrawer from "../../../components/custom-drawer/custom-drawer";
import type { DocumentTableRow } from "../../../constant/documentsTableData";
import { documentsTableData } from "../../../constant/documentsTableData";
import type { FillFormRowData } from "./DocumentsTable";

/* ========================= TYPES ========================= */

interface DocumentsSectionProps {
  objectId: string;
  contentTypeApp: string;
  contentTypeModel: string;
  searchQuery?: string;
  formList?: DocumentTableRow[];
  leadUuid?: string;
  /** Resident's full name — passed to fillForm drawers */
  residentName?: string;
  /** When set, upload buttons and destructive actions are disabled and this text shows as a tooltip */
  disabledReason?: string;
  /**
   * The resident's user UUID — used as the `user` field in the scheduled-forms POST payload.
   * Distinct from objectId which is the lead UUID used for media queries.
   */
  residentUserUuid?: string;
}

interface MediaItem {
  id: string;
  file_url: string;
  original_filename?: string;
  file_size?: number;
  mime_type?: string;
}

interface HistoryEntry {
  mediaId: string;
  fileName: string;
  uploadDate: string;
  rawDate: string;
  fileUrl: string;
  mimeType?: string;
}

/* ========================= HELPERS ========================= */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ERROR_MESSAGE_FILE_TOO_LARGE = "The selected file is too large. Please choose a file smaller than 10 MB";

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

const truncateFileName = (name: string, max = 28) =>
  name.length > max ? name.substring(0, max) + "..." : name;

const fileText = {
  fontSize: "13px",
  color: "#233558",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

/* ========================= COMPONENT ========================= */

const NURSING_FORM_CODE = "5_AND_30_DAY_NURSING_TRANSITION_EVALUATION_FORM";

const DocumentsSection: React.FC<DocumentsSectionProps> = ({
  objectId,
  contentTypeApp,
  contentTypeModel,
  searchQuery = "",
  formList,
  leadUuid,
  residentName,
  disabledReason,
  residentUserUuid,
}) => {
  const queryClient = useQueryClient();
  const forms = formList ?? documentsTableData;

  // Determine if any row needs the consent forms API
  const hasFillFormRows = forms.some((f) => f.documentType === "fillForm");

  // Nursing form drawer state
  const [nursingFormOpen, setNursingFormOpen] = useState(false);
  const [nursingFormMode, setNursingFormMode] = useState<"new" | "draft" | "view">("new");
  const [nursingFormConsentUuid, setNursingFormConsentUuid] = useState<string | null>(null);

  // Delete consent form confirm dialog
  const [deleteFormDialogOpen, setDeleteFormDialogOpen] = useState(false);
  const [formDocIdToDelete, setFormDocIdToDelete] = useState<number | null>(null);

  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [selectedDocumentFiles, setSelectedDocumentFiles] = useState<ViewDocumentFile[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [deleteHistoryMediaId, setDeleteHistoryMediaId] = useState<string | null>(null);

  //delete option for nurse
  const user = useAppSelector((state) => state.auth.user);
  const roleName = user?.role?.name?.toLowerCase();
  const isNurse = roleName === "nurse";
  const isBCBA = user?.role?.name === "BCBA";
  const isDSP = user?.role?.name === "DSP";

  // History drawer state
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historyFormName, setHistoryFormName] = useState("");
  const [historyOtherRootId, setHistoryOtherRootId] = useState<number | null>(null);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);

  // ── Schedule 30-Day ISA state ──
  // id=8 is the ISA datePicker row in documentsTableData
  const ISA_DOC_ID = 8;
  const ISA_FORM_NAME = "Schedule 30-Day ISA";
  /** Numeric PK of the currently saved scheduled-form record (needed for DELETE) */
  const [isaScheduledRecordId, setIsaScheduledRecordId] = useState<number | null>(null);
  /** ISO date string (YYYY-MM-DD) of the saved ISA date */
  const [isaSavedDate, setIsaSavedDate] = useState<string | null>(null);
  /** Formatted "Last Updated" string derived from the API response */
  const [isaLastUpdated, setIsaLastUpdated] = useState<string | null>(null);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    status: "success" | "error";
  }>({ open: false, message: "", status: "success" });

  const [alertDialog, setAlertDialog] = useState<{
    open: boolean;
    message: string;
  }>({ open: false, message: "" });

  const showSnackbar = (message: string, status: "success" | "error") =>
    setSnackbar({ open: true, message, status });

  /* =========================
     SCHEDULED FORMS — GET
  ========================= */
  const { data: scheduledFormsResponse, refetch: refetchScheduledForms } = useQuery({
    // Cast to any because the generated type omits query params, but the endpoint
    // accepts ?resident_uuid=<uuid> to filter by resident
    ...residentsResidentScheduledFormsRetrieveOptions({
      query: { resident_uuid: residentUserUuid || objectId } as any,
    } as any),
    enabled: !!objectId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Sync GET response → local ISA state whenever the query data changes
  React.useEffect(() => {
    const raw = scheduledFormsResponse as any;
    // Response may be wrapped: { data: [...] } or { results: [...] } or raw array
    const list: any[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.results)
      ? raw.results
      : [];

    const record = list.find(
      (r: any) => r.form_name === ISA_FORM_NAME
    );

    if (record) {
      setIsaScheduledRecordId(record.id ?? null);
      // Use the actual scheduled_date from the backend
      const rawDate = record.scheduled_date ?? null;
      setIsaSavedDate(rawDate);
      setIsaLastUpdated(record.updated_at ? formatLastUpdated(record.updated_at) : null);
    } else {
      setIsaScheduledRecordId(null);
      setIsaSavedDate(null);
      setIsaLastUpdated(null);
    }
  }, [scheduledFormsResponse]); // eslint-disable-line react-hooks/exhaustive-deps

  /* =========================
     MEDIA LIST
  ========================= */
  const { data: mediaResponse, isLoading: isMediaLoading } = useQuery({
    ...mediaListOptions({
      query: {
        content_type: `${contentTypeApp}.${contentTypeModel}`,
        object_uuid: objectId,
        page_size: 100,
      },
    }),
    // Nurses only need the consent-forms API — skip the media call entirely
    enabled: !!objectId && !isNurse,
  });

  /* =========================
     CONSENT FORMS (for fillForm rows)
  ========================= */
  const { data: consentFormsResponse, refetch: refetchConsentForms } = useQuery({
    ...listConsentFormsOptions({
      query: { resident_uuid: objectId },
    }),
    enabled: !!objectId && hasFillFormRows,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    select: (data: any) => {
      if (Array.isArray(data?.data)) return data.data;
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.results)) return data.results;
      return [];
    },
  });

  // Build fillFormData map for DocumentsTable
  const fillFormData = useMemo<Record<number, FillFormRowData>>(() => {
    const result: Record<number, FillFormRowData> = {};
    const consentList: any[] = consentFormsResponse ?? [];
    forms.forEach((row) => {
      if (row.documentType !== "fillForm" || !row.formCode) return;
      const existing = consentList.find((f: any) => f.form_code === row.formCode);
      let mode: "new" | "draft" | "view" = "new";
      let lastUpdated: string | undefined;
      if (existing) {
        if (existing.status === "COMPLETED" || existing.status === "SIGNED") mode = "view";
        else if (existing.status === "DRAFT") mode = "draft";
        const raw = existing.updated_at ?? existing.created_at;
        if (raw) {
          lastUpdated = formatLastUpdated(raw);
        }
      }
      result[row.id] = { status: existing?.status, consentUuid: existing?.uuid, lastUpdated, mode };
    });
    return result;
  }, [consentFormsResponse, forms]);

  // Handle Fill Form / View Form clicks
  const handleFillForm = (documentId: number, mode: "new" | "draft" | "view") => {
    const row = forms.find((f) => f.id === documentId);
    if (!row || row.documentType !== "fillForm") return;
    if (row.formCode === NURSING_FORM_CODE) {
      const info = fillFormData[documentId];
      setNursingFormConsentUuid(info?.consentUuid ?? null);
      setNursingFormMode(mode);
      setNursingFormOpen(true);
    }
  };

  // Handle Print for fillForm rows — fetch form JSON then generate PDF
  const handlePrintForm = async (documentId: number) => {
    const info = fillFormData[documentId];
    if (!info?.consentUuid) return;
    try {
      const formData = await queryClient.fetchQuery({
        ...getConsentFormDetailOptions({
          path: { uuid: info.consentUuid },
          query: { history: false },
        }),
      });
      const responseData = (formData as any)?.data ?? formData;
      const entries = responseData?.entries || [];
      const latestEntry = entries[0] || null;
      const formJson = latestEntry?.form_json || responseData?.form_json || {};

      const row = forms.find((f) => f.id === documentId);
      if (row?.formCode === NURSING_FORM_CODE) {
        const { generateNursingTransitionEvaluationPDF } = await import(
          "./nursing-transition-evaluation/utils/generateNursingTransitionEvaluationPDF"
        );
        generateNursingTransitionEvaluationPDF(formJson, residentName);
      }
    } catch {
      showSnackbar("Failed to generate print. Please try again.", "error");
    }
  };

  // Handle Delete for fillForm rows
  const handleDeleteForm = (documentId: number) => {
    setFormDocIdToDelete(documentId);
    setDeleteFormDialogOpen(true);
  };

  const handleDeleteFormConfirm = () => {
    if (formDocIdToDelete === null) return;
    const info = fillFormData[formDocIdToDelete];
    if (!info?.consentUuid) return;
    deleteConsentForm.mutate({ path: { uuid: info.consentUuid } } as any);
    setDeleteFormDialogOpen(false);
    setFormDocIdToDelete(null);
  };

  /* =========================
     MAP TABLE DATA
  ========================= */
  const tableData = useMemo(() => {
    const mediaList = mediaResponse?.results ?? [];

    // 1. Enrich static forms from formList
    const staticRows = forms.map((doc) => {
      const matchingMedia = mediaList
        .filter(
          (m: any) =>
            m.description?.trim().toLowerCase() ===
            doc.documentName.trim().toLowerCase()
        )
        .sort((a: any, b: any) => {
          const dateA = a.updated_at ?? a.uploaded_at ?? "";
          const dateB = b.updated_at ?? b.uploaded_at ?? "";
          return dateB.localeCompare(dateA);
        });

      const allMatchingMedia = matchingMedia.map((m: any) => ({
        id: String(m.id),
        file_url: m.file_url,
        original_filename: m.original_filename ?? "Unknown",
        mime_type: m.mime_type,
      }));

      if (matchingMedia.length === 0) {
        return {
          ...doc,
          hasFile: false,
          uploadDocument: undefined,
          lastUpdated: undefined,
          mediaId: null,
          fileCount: 0,
          allMatchingMedia: [],
        };
      }

      const latest = matchingMedia[0] as any;
      return {
        ...doc,
        hasFile: true,
        uploadDocument: latest.original_filename,
        fileUrl: latest.file_url,
        lastUpdated: formatLastUpdated(latest.updated_at ?? latest.uploaded_at),
        mediaId: latest.id,
        mimeType: latest.mime_type,
        fileSize: latest.file_size,
        fileCount: matchingMedia.length,
        allMatchingMedia,
      };
    });

    // 2. Handle "Other" media — each Upload-button upload is a root, re-uploads are children
    const allOtherMedia = mediaList.filter((m: any) => {
      const desc = m.description?.trim();
      return desc === "Other" || desc?.startsWith("Other:");
    });

    // Root media: desc exactly "Other" (created via Upload button)
    const rootOtherMedia = allOtherMedia
      .filter((m: any) => m.description?.trim() === "Other")
      .sort((a: any, b: any) => {
        const dateA = a.updated_at ?? a.uploaded_at ?? "";
        const dateB = b.updated_at ?? b.uploaded_at ?? "";
        return dateA.localeCompare(dateB); // oldest first for row ordering
      });

    // 3. Create one row per root, grouped with its children (re-uploads via arrow)
    const otherRows: DocumentTableRow[] = rootOtherMedia.map((root: any, index: number) => {
      const children = allOtherMedia.filter(
        (m: any) => m.description?.trim() === `Other:${root.id}`
      );

      const allGroupMedia = [root, ...children].sort((a: any, b: any) => {
        const dateA = a.updated_at ?? a.uploaded_at ?? "";
        const dateB = b.updated_at ?? b.uploaded_at ?? "";
        return dateB.localeCompare(dateA); // newest first
      });

      const latest = allGroupMedia[0] as any;
      const allMatchingMedia = allGroupMedia.map((m: any) => ({
        id: String(m.id),
        file_url: m.file_url,
        original_filename: m.original_filename ?? "Unknown",
        mime_type: m.mime_type,
      }));

      return {
        id: -(index + 1),
        documentName: "Other",
        uploadType: "repeating" as const,
        isOtherRow: true,
        hasFile: true,
        uploadDocument: latest.original_filename ?? "Unknown",
        fileUrl: latest.file_url,
        lastUpdated: formatLastUpdated(latest.updated_at ?? latest.uploaded_at),
        mediaId: latest.id,
        otherRootMediaId: root.id,
        mimeType: latest.mime_type,
        fileSize: latest.file_size,
        fileCount: allGroupMedia.length,
        allMatchingMedia,
      };
    });

    // 4. For nurses: hide "Other" rows — they only see the nursing form.
    //    For all other roles: always keep one empty "Other" row for new uploads.
    if (isNurse) {
      return staticRows;
    }

    const emptyOtherRow: DocumentTableRow = {
      id: -(otherRows.length + 1),
      documentName: "Other",
      uploadType: "once",
      isOtherRow: true,
      hasFile: false,
      fileCount: 0,
      allMatchingMedia: [],
    };

    return [...staticRows, ...otherRows, emptyOtherRow];
  }, [mediaResponse, forms, isNurse]);

  /* =========================
     SCHEDULED FORMS — POST (create/upsert)
  ========================= */
  const createScheduledForm = useMutation({
    ...(residentsResidentScheduledFormsCreateMutation() as any),
    onSuccess: (data: unknown) => {
      const res = data as any;
      // Response may be the record directly or wrapped
      const record = res?.data ?? res;
      if (record?.id) setIsaScheduledRecordId(record.id);
      // Use the actual scheduled_date returned from the backend
      const rawDate = record?.scheduled_date ?? null;
      setIsaSavedDate(rawDate);
      setIsaLastUpdated(record?.updated_at ? formatLastUpdated(record?.updated_at) : null);
      // Invalidate & refetch the GET so the cache stays in sync
      queryClient.invalidateQueries({
        queryKey: residentsResidentScheduledFormsRetrieveQueryKey({
          query: { resident_uuid: objectId } as any,
        } as any),
      });
      refetchScheduledForms();
      showSnackbar("Scheduled date saved successfully", "success");
    },
    onError: () => showSnackbar("Failed to save scheduled date. Please try again.", "error"),
  });

  /* =========================
     SCHEDULED FORMS — DELETE
  ========================= */
  const deleteScheduledForm = useMutation({
    ...(residentsResidentScheduledFormsDestroyMutation() as any),
    onSuccess: () => {
      setIsaScheduledRecordId(null);
      setIsaSavedDate(null);
      setIsaLastUpdated(null);
      // Invalidate & refetch the GET so the cache stays in sync
      queryClient.invalidateQueries({
        queryKey: residentsResidentScheduledFormsRetrieveQueryKey({
          query: { resident_uuid: objectId } as any,
        } as any),
      });
      refetchScheduledForms();
      showSnackbar("Scheduled date cleared successfully", "success");
    },
    onError: () => showSnackbar("Failed to clear scheduled date. Please try again.", "error"),
  });

  /**
   * Called by DocumentsTable when the user picks a date (date = ISO string)
   * or clears it (date = null) on a datePicker row.
   * Only acts on ISA_DOC_ID; all other rows use the upload flow.
   */
  const handleIsaDateChange = (documentId: number, date: string | null) => {
    if (documentId !== ISA_DOC_ID) return;

    if (date === null) {
      // DELETE
      if (isaScheduledRecordId !== null) {
        deleteScheduledForm.mutate({ path: { id: isaScheduledRecordId } } as any);
      } else {
        // Nothing saved yet — just clear local state
        setIsaSavedDate(null);
        setIsaLastUpdated(null);
      }
    } else {
      // POST — send user, form_name, and the selected scheduled_date
      setIsaSavedDate(date); // Optimistic UI update uses the selected date
      createScheduledForm.mutate({
        body: {
          user: residentUserUuid || objectId,
          form_name: ISA_FORM_NAME,
          scheduled_date: date,
        },
        headers: { "Content-Type": "application/json" },
      } as any);
    }
  };

  /* =========================
     MUTATIONS
  ========================= */
  const { uploadMultiple, uploadProgress, cancelUpload } = useMediaUpload({
    contentTypeApp,
    contentTypeModel,
    objectUuid: objectId,
  });

  // Refresh lead status after document changes (only for leads)
  const refreshStatus = useMutation({
    ...refreshLeadStatusMutation(),
    onSuccess: () => {
      if (leadUuid) {
        queryClient.invalidateQueries({
          queryKey: getLeadDetailQueryKey({ path: { uuid: leadUuid } }),
        });
      }
    },
  });

  const triggerStatusRefresh = () => {
    if (leadUuid) {
      refreshStatus.mutate({ path: { uuid: leadUuid } });
    }
  };

  const deleteMedia = useMutation({
    ...mediaDeleteDestroyMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: mediaListOptions({
          query: {
            content_type: `${contentTypeApp}.${contentTypeModel}`,
            object_uuid: objectId,
          },
        }).queryKey,
      });
      triggerStatusRefresh();
      showSnackbar("Document deleted successfully", "success");
    },
    onError: () =>
      showSnackbar("Failed to delete document", "error"),
  });

  // Delete consent form (for fillForm rows)
  const deleteConsentForm = useMutation({
    ...(deleteConsentFormMutation() as any),
    onSuccess: () => {
      if (objectId && hasFillFormRows) {
        queryClient.invalidateQueries({
          queryKey: listConsentFormsQueryKey({ query: { resident_uuid: objectId } }),
        });
        refetchConsentForms();
      }
      showSnackbar("Form deleted successfully", "success");
    },
    onError: () => showSnackbar("Failed to delete form", "error"),
  });

  /* =========================
     HELPERS
  ========================= */
  const handleUpload = async (documentId: number, files: File[]) => {
    let description: string;

    if (documentId < 0) {
      // Negative IDs are dynamic Other rows
      const existingRow = tableData.find((d) => d.id === documentId);
      if (existingRow?.hasFile && existingRow?.otherRootMediaId) {
        // Re-upload arrow on filled Other row: link to the root
        description = `Other:${existingRow.otherRootMediaId}`;
      } else {
        // Upload button on empty Other row: create new root entry
        description = "Other";
      }
    } else {
      const doc = forms.find((d) => d.id === documentId);
      if (!doc) return;
      description = doc.documentName;
    }

    const oversized = files.find((f) => f.size > MAX_FILE_SIZE);
    if (oversized) {
      setAlertDialog({ open: true, message: ERROR_MESSAGE_FILE_TOO_LARGE });
      return;
    }

    try {
      await uploadMultiple(files, { description });
      await queryClient.invalidateQueries({
        queryKey: mediaListOptions({
          query: {
            content_type: `${contentTypeApp}.${contentTypeModel}`,
            object_uuid: objectId,
          },
        }).queryKey,
      });
      triggerStatusRefresh();
      const count = files.length;
      showSnackbar(
        count === 1 ? "Document uploaded successfully" : `${count} documents uploaded successfully`,
        "success",
      );
    } catch (error: any) {
      if (error?.message === UPLOAD_CANCELLED_MESSAGE) {
        showSnackbar("Upload cancelled", "error");
        return;
      }
      const backendError = error?.response?.data?.detail || error?.response?.data?.message || error?.message || "";
      const isSizeError = typeof backendError === 'string' && backendError.toLowerCase().includes("size");

      if (isSizeError) {
        setAlertDialog({ open: true, message: ERROR_MESSAGE_FILE_TOO_LARGE });
      } else {
        showSnackbar("Failed to upload document. Please try again.", "error");
      }
    }
  };

  const handlePrint = (url: string) => {
    const win = window.open(url, "_blank", "noopener,noreferrer");
    win?.print();
  };

  /* =========================
     HISTORY DRAWER
  ========================= */
  const handleOpenHistory = (documentId: number) => {
    const doc = tableData.find((d) => d.id === documentId);
    if (!doc) return;

    const mediaList = mediaResponse?.results ?? [];
    const rootId = doc.otherRootMediaId;

    const filtered = (doc.isOtherRow && rootId)
      ? mediaList.filter((m: any) => {
          const desc = m.description?.trim();
          return (desc === "Other" && String(m.id) === String(rootId))
            || desc === `Other:${rootId}`;
        })
      : mediaList.filter(
          (m: any) =>
            m.description?.trim().toLowerCase() ===
            doc.documentName.trim().toLowerCase(),
        );

    const entries: HistoryEntry[] = filtered
      .map((m: any) => {
        const rawDate = m.updated_at ?? m.uploaded_at ?? "";
        return {
          mediaId: m.id,
          fileName: m.original_filename ?? "Unknown",
          uploadDate: formatLastUpdated(rawDate),
          rawDate,
          fileUrl: m.file_url,
          mimeType: m.mime_type,
        };
      })
      .sort((a: HistoryEntry, b: HistoryEntry) => b.rawDate.localeCompare(a.rawDate));

    setHistoryFormName(doc.documentName);
    setHistoryOtherRootId(rootId ?? null);
    setHistoryEntries(entries);
    setHistoryDrawerOpen(true);
  };

  const handleViewHistoryEntry = (entry: HistoryEntry) => {
    setSelectedDocumentFiles([{
      id: entry.mediaId,
      file_url: entry.fileUrl,
      original_filename: entry.fileName,
      mime_type: entry.mimeType ?? undefined,
      file_type: entry.mimeType ?? undefined,
    }]);
    setDocumentDialogOpen(true);
  };

  const handlePrintHistoryEntry = (entry: HistoryEntry) => {
    const win = window.open(entry.fileUrl, "_blank", "noopener,noreferrer");
    win?.print();
  };

  const handleDeleteHistoryEntry = (mediaId: string) => {
    setDeleteHistoryMediaId(mediaId);
    setSelectedDocumentId(null);
    setDeleteDialogOpen(true);
  };

  // Re-compute history entries when media changes while drawer is open
  React.useEffect(() => {
    if (historyDrawerOpen && historyFormName) {
      const mediaList = mediaResponse?.results ?? [];

      const filtered = historyOtherRootId
        ? mediaList.filter((m: any) => {
            const desc = m.description?.trim();
            return (desc === "Other" && String(m.id) === String(historyOtherRootId))
              || desc === `Other:${historyOtherRootId}`;
          })
        : mediaList.filter(
            (m: any) =>
              m.description?.trim().toLowerCase() ===
              historyFormName.trim().toLowerCase(),
          );

      const entries: HistoryEntry[] = filtered
        .map((m: any) => {
          const rawDate = m.updated_at ?? m.uploaded_at ?? "";
          return {
            mediaId: m.id,
            fileName: m.original_filename ?? "Unknown",
            uploadDate: formatLastUpdated(rawDate),
            rawDate,
            fileUrl: m.file_url,
            mimeType: m.mime_type,
          };
        })
        .sort((a: HistoryEntry, b: HistoryEntry) => b.rawDate.localeCompare(a.rawDate));
      setHistoryEntries(entries);
    }
  }, [mediaResponse, historyDrawerOpen, historyFormName, historyOtherRootId]);

  /* =========================
     DELETE CONFIRM HANDLER
  ========================= */
  const handleDeleteConfirm = () => {
    const mediaIdToDelete = deleteHistoryMediaId;
    const fromPreview =
      !!mediaIdToDelete &&
      selectedDocumentFiles.some((f) => f.id === mediaIdToDelete);

    if (mediaIdToDelete) {
      deleteMedia.mutate(
        { path: { id: mediaIdToDelete } },
        {
          onSuccess: () => {
            if (fromPreview) {
              const remaining = selectedDocumentFiles.filter(
                (f) => f.id !== mediaIdToDelete
              );
              setSelectedDocumentFiles(remaining);
              if (remaining.length === 0) {
                setDocumentDialogOpen(false);
              }
            }
          },
        }
      );
    } else if (selectedDocumentId !== null) {
      const row = tableData.find((d) => d.id === selectedDocumentId);
      row?.mediaId && deleteMedia.mutate({ path: { id: row.mediaId } });
    }

    setDeleteDialogOpen(false);
    setDeleteHistoryMediaId(null);
    setSelectedDocumentId(null);
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <>
      <Box sx={{ 
        flex: 1, 
        minHeight: 0, 
        overflow: "visible", // Allow overflow to pass through for table scrolling
        display: "flex", 
        flexDirection: "column",
        width: "100%",
        maxWidth: "100%",
      }}>
        <DocumentsTable
        data={tableData}
        isLoading={isMediaLoading}
        searchQuery={searchQuery}
        disabledReason={disabledReason}
        onUpload={handleUpload}
        onHistory={handleOpenHistory}
        onFillForm={handleFillForm}
        onPrintForm={handlePrintForm}
        onDeleteForm={handleDeleteForm}
        fillFormData={fillFormData}
        isNurse={isNurse}
        canUpload={!isDSP}
        isaDateMap={{ [ISA_DOC_ID]: isaSavedDate }}
        onIsaDateChange={handleIsaDateChange}
        isaLastUpdated={isaLastUpdated}
        onView={(id) => {
          const row = tableData.find((d) => d.id === id);
          if (!row?.fileUrl) return;
          const allFiles: ViewDocumentFile[] = (row.allMatchingMedia ?? []).map((m) => ({
            id: m.id,
            file_url: m.file_url,
            original_filename: m.original_filename,
            mime_type: m.mime_type,
            file_type: m.mime_type,
          }));
          if (allFiles.length > 0) {
            setSelectedDocumentFiles(allFiles);
            setDocumentDialogOpen(true);
          }
        }}
      />
      </Box>

      <UploadProgressPanel progress={uploadProgress} onCancel={cancelUpload} />

      <ViewDocumentsDialog
        open={documentDialogOpen}
        onClose={() => {
          setDocumentDialogOpen(false);
          setSelectedDocumentFiles([]);
        }}
        files={selectedDocumentFiles}
        title="View Document"
        initialIndex={0}
        allowDownload
        onDelete={(file) => {
          if (isNurse || isDSP) return;
          setDeleteHistoryMediaId(file.id);
          setSelectedDocumentId(null);
          setDeleteDialogOpen(true);
        }}
        onPrint={(file) => {
          file.file_url && handlePrint(file.file_url);
        }}
      />

      <ConfirmationPopUp
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteHistoryMediaId(null);
          setSelectedDocumentId(null);
        }}
        onConfirm={handleDeleteConfirm}
        message="Are you sure you want to delete this document?"
      />

      <ConfirmationPopUp
        open={deleteFormDialogOpen}
        onClose={() => {
          setDeleteFormDialogOpen(false);
          setFormDocIdToDelete(null);
        }}
        onConfirm={handleDeleteFormConfirm}
        message="Are you sure you want to delete this form?"
      />

      <CommonSnackbar
        isOpen={snackbar.open}
        message={snackbar.message}
        status={snackbar.status}
        autoClose
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
      />

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

      {/* History Drawer */}
      <CustomDrawer
        open={historyDrawerOpen}
        onClose={() => {
          setHistoryDrawerOpen(false);
          setHistoryFormName("");
          setHistoryOtherRootId(null);
          setHistoryEntries([]);
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
              Log of {historyFormName}
            </Typography>

            <IconButton
              onClick={() => {
                setHistoryDrawerOpen(false);
                setHistoryFormName("");
                setHistoryEntries([]);
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
            {historyEntries.length === 0 ? (
              <Grid container justifyContent="center" sx={{ py: 4 }}>
                <Typography sx={{ color: "#757775" }}>No history available</Typography>
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
                    {historyEntries.map((entry) => (
                      <TableRow key={entry.mediaId}>
                        <TableCell
                          sx={{
                            fontSize: "13px",
                            py: 1.5,
                            borderBottom: "1px solid #EEF1F4",
                            color: "#212121",
                          }}
                        >
                          <Grid container alignItems="center" spacing={1} wrap="nowrap">
                            <Grid>
                              <DescriptionIcon
                                sx={{ fontSize: 20, color: "#6B7280", flexShrink: 0 }}
                              />
                            </Grid>
                            <Grid>
                              <Typography
                                sx={{
                                  ...fileText,
                                  cursor: "pointer",
                                  color: "#11466D",
                                  "&:hover": { textDecoration: "underline" },
                                }}
                                onClick={() => handleViewHistoryEntry(entry)}
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
                                onClick={() => handleViewHistoryEntry(entry)}
                                sx={{ color: "#0A2E45", p: "4px" }}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Print">
                              <IconButton
                                size="small"
                                onClick={() => handlePrintHistoryEntry(entry)}
                                sx={{ color: "#0A2E45", p: "4px" }}
                              >
                                <Print fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={isBCBA || isDSP ? "You don't have permission" : isNurse ? "You don't have permission" : "Delete"}>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteHistoryEntry(entry.mediaId)}
                                  disabled={deleteMedia.isPending || isNurse || isBCBA || isDSP}
                                  sx={{ color: isBCBA || isNurse || isDSP ? "#BDBDBD" : "#DC2626", p: "4px" }}
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

      {/* Nursing Transition Evaluation Form drawer */}
      {nursingFormOpen && (
        <Suspense fallback={null}>
          <NursingTransitionEvaluationDrawer
            open={nursingFormOpen}
            onClose={() => setNursingFormOpen(false)}
            individualName={residentName}
            formName="5 and 30 Day Nursing Transition Evaluation Form"
            residentUuid={objectId}
            consentUuid={nursingFormConsentUuid}
            mode={nursingFormMode}
            onAfterSubmit={() => {
              setNursingFormOpen(false);
              if (objectId && hasFillFormRows) refetchConsentForms();
            }}
            onAfterSave={() => {
              if (objectId && hasFillFormRows) refetchConsentForms();
            }}
          />
        </Suspense>
      )}
    </>
  );
};

export default DocumentsSection;
