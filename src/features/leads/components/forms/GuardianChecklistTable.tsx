import React, { useState, useRef, useMemo } from "react";
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
  Tooltip,
  Chip,
  Button,
  useMediaQuery,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DescriptionIcon from "@mui/icons-material/Description";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import HistoryIcon from "@mui/icons-material/History";
import { Close, Visibility, Print, Delete } from "@mui/icons-material";
import Paginator from "../../../../components/pagination/pagination";
import CustomButton from "../../../../components/custom-buttons/custom-buttons";
import {
  mediaListOptions,
  mediaDeleteDestroyMutation,
  refreshLeadStatusMutation,
  getLeadDetailQueryKey,
} from "../../../../sdk/@tanstack/react-query.gen";
import {
  useMediaUpload,
  UPLOAD_CANCELLED_MESSAGE,
} from "../../../../hooks/useMediaUpload";
import UploadProgressPanel from "../../../../components/upload-progress-panel/upload-progress-panel";
import TableSkeleton from "../../../../components/common-table/TableSkeleton";
import CommonSnackbar from "../../../../components/common-snackbar/common-snackbar";
import ConfirmationPopUp from "../../../../components/confirmation-pop-up/confirmation-pop-up";
import CustomDrawer from "../../../../components/custom-drawer/custom-drawer";
import CustomDialog from "../../../../components/custom-dialog/custom-dialog";
import dayjs from "dayjs";
import {
  primaryTextCss,
  tableContainerCss,
} from "../../../../components/common-table/widgets/common-table-widgets";
import ViewDocumentsDialog, {
  type ViewDocumentFile,
} from "../../../appointments/components/ViewDocumentsDialog";

/* ================= TYPES ================= */

export interface GuardianChecklistTableProps {
  objectId?: string;
  leadUuid?: string;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  searchQuery?: string;
  /** When set, upload buttons and destructive actions are disabled and this text shows as a tooltip */
  disabledReason?: string;
  /** When false, the delete button in the history drawer is disabled (e.g. BCBA has no documents.delete) */
  canDelete?: boolean;
  /** When false, all upload buttons are disabled (e.g. DSP has no documents.create) */
  canUpload?: boolean;
}

type UploadType = "once" | "repeating";

interface FormMetadata {
  id: number;
  formName: string;
  uploadType: UploadType;
  frequency?: string;
}

interface GuardianChecklistRow {
  id: number;
  formName: string;
  uploadType: UploadType;
  frequency?: string;
  hasFile?: boolean;
  uploadDocument?: string | null;
  lastUpdated?: string | null;
  fileUrl?: string | null;
  mediaId?: string | null;
  mimeType?: string | null;
  fileCount: number;
  allMatchingMedia: Array<{ id: string; file_url: string; original_filename: string; mime_type?: string }>;
}

interface HistoryEntry {
  mediaId: string;
  fileName: string;
  uploadDate: string;
  rawDate: string;
  fileUrl: string;
  mimeType?: string;
}

/* ================= STATIC DATA ================= */

const guardianChecklistData: FormMetadata[] = [
  { id: 1, formName: "Guardianship Paperwork", uploadType: "repeating", frequency: "Once a year" },
  { id: 2, formName: "Pending / Open Legal Cases", uploadType: "once" },
  { id: 3, formName: "Consent for Medical Treatment", uploadType: "repeating", frequency: "Once a year" },
  { id: 4, formName: "Security Protocol", uploadType: "once" },
  { id: 5, formName: "Safety Plan", uploadType: "repeating", frequency: "Once a year" },
  { id: 6, formName: "Phone / Visit List", uploadType: "repeating", frequency: "Other" },
  { id: 7, formName: "Releases of Information", uploadType: "repeating", frequency: "Other" },
  { id: 8, formName: "Respite List, if applicable", uploadType: "repeating", frequency: "Other" },
  { id: 9, formName: "Consent for Individual Therapy", uploadType: "repeating", frequency: "Once a year" },
  { id: 10, formName: "Client Rights", uploadType: "repeating", frequency: "Once a year" },
  { id: 11, formName: "Media / Phone / internet Use", uploadType: "once" },
];

/* ================= DATE FORMATTING ================= */

const formatLastUpdated = (dateString: string | null | undefined): string => {
  if (!dateString) return "—";

  try {
    // Strip timezone info so the date shown matches the backend value exactly
    const date = dayjs(dateString.replace("Z", "").replace("z", ""));
    if (!date.isValid()) return "—";

    return `${date.format("MM/DD/YYYY")}, ${date.format("h:mm A")}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "—";
  }
};

/* ================= TABLE HEADERS ================= */

const tableHeaders = [
  { id: "srNo", label: "Sr. no", width: "70px", align: "center" as const },
  { id: "documentName", label: "Document Name", width: "240px", align: "left" as const },
  { id: "uploadDocument", label: "Upload Document", width: "240px", align: "left" as const },
  { id: "lastUpdated", label: "Last Updated", width: "180px", align: "left" as const },
  { id: "action", label: "Action", width: "80px", align: "center" as const },
];

const getColAlign = (id: string) => tableHeaders.find((h) => h.id === id)?.align ?? "left";

const baseCellSx = {
  paddingLeft: "16px !important",
  paddingRight: "16px !important",
  paddingTop: "12px !important",
  paddingBottom: "12px !important",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ERROR_MESSAGE_FILE_TOO_LARGE = "The selected file is too large. Please choose a file smaller than 10 MB";
const INVALID_FORMAT_MESSAGE = "Unsupported file format. Please upload PDF, PNG, JPG, or JPEG files.";

/* ================= COMPONENT ================= */

const GuardianChecklistTable: React.FC<GuardianChecklistTableProps> = ({
  objectId,
  leadUuid,
  page = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  searchQuery = "",
  disabledReason,
  canDelete = true,
  canUpload = true,
}) => {
  const isDisabled = !!disabledReason;

  // Responsive drawer width — always clamp to viewport on small screens
  const below480 = useMediaQuery("(max-width:480px)");
  const below768 = useMediaQuery("(max-width:768px)");
  const below1024 = useMediaQuery("(max-width:1024px)");
  const historyDrawerWidth = below480
    ? "100vw"
    : below768
    ? "92vw"
    : below1024
    ? "520px"
    : "600px";
  const [currentPage, setCurrentPage] = useState(page);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [uploadingFormIds, setUploadingFormIds] = useState<Set<number>>(
    new Set(),
  );
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [selectedDocumentFiles, setSelectedDocumentFiles] = useState<ViewDocumentFile[]>([]);
  const [deleteDocumentDialogOpen, setDeleteDocumentDialogOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [deleteHistoryMediaId, setDeleteHistoryMediaId] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<{ [key: string]: HTMLElement | null }>({});

  // History drawer state
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historyFormName, setHistoryFormName] = useState("");
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);

  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
    status: "success" | "error";
  }>({
    isOpen: false,
    message: "",
    status: "success",
  });

  const [alertDialog, setAlertDialog] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

  const queryClient = useQueryClient();

  const mediaQueryKey = mediaListOptions({
    query: {
      content_type: "leads.lead",
      object_uuid: objectId,
    },
  }).queryKey;

  const invalidateMedia = () => {
    if (objectId) {
      queryClient.invalidateQueries({ queryKey: mediaQueryKey });
    }
  };

  // Refresh lead status after document changes
  const refreshStatus = useMutation({
    ...refreshLeadStatusMutation(),
    onSuccess: () => {
      // Invalidate lead detail so UI picks up the new status
      const uuid = leadUuid || objectId;
      if (uuid) {
        queryClient.invalidateQueries({
          queryKey: getLeadDetailQueryKey({ path: { uuid } }),
        });
      }
    },
  });

  const triggerStatusRefresh = () => {
    const uuid = leadUuid || objectId;
    if (uuid) {
      refreshStatus.mutate({ path: { uuid } });
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, rowKey: string) => {
    setAnchorEl((prev) => ({ ...prev, [rowKey]: event.currentTarget }));
  };

  const handleMenuClose = (rowKey: string) => {
    setAnchorEl((prev) => ({ ...prev, [rowKey]: null }));
  };

  // Fetch media list for uploaded documents
  const { data: mediaResponse, isLoading: isMediaLoading } = useQuery({
    ...mediaListOptions({
      query: {
        content_type: "leads.lead",
        object_uuid: objectId,
        page_size: 100,
      },
    }),
    enabled: !!objectId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
  });

  // Upload via shared hook
  const { uploadMultiple, uploadProgress, cancelUpload } = useMediaUpload({
    contentTypeApp: "leads",
    contentTypeModel: "lead",
    objectUuid: objectId,
  });

  // Delete media mutation
  const deleteMedia = useMutation({
    ...mediaDeleteDestroyMutation(),
    onSuccess: () => {
      invalidateMedia();
      triggerStatusRefresh();
      setSnackbar({
        isOpen: true,
        message: "Document deleted successfully",
        status: "success",
      });
      setDeleteDocumentDialogOpen(false);
      setSelectedDocumentId(null);
      setDeleteHistoryMediaId(null);
    },
    onError: () => {
      setSnackbar({
        isOpen: true,
        message: "Failed to delete document",
        status: "error",
      });
    },
  });

  // Handle upload — always append new files, never delete existing ones
  const handleUploadFiles = async (formId: number, files: File[]) => {
    const form = guardianChecklistData.find((f) => f.id === formId);
    if (!form) return;

    if (!objectId) {
      setSnackbar({
        isOpen: true,
        message: "Lead ID is required for upload",
        status: "error",
      });
      return;
    }

    // Check file size FIRST — same alert dialog as Appointment mark-as-completed
    const oversized = files.find((f) => f.size > MAX_FILE_SIZE);
    if (oversized) {
      setAlertDialog({ open: true, message: ERROR_MESSAGE_FILE_TOO_LARGE });
      return;
    }

    // Then validate file formats — snackbar only for format issues
    const allowedExt = /\.(pdf|png|jpg|jpeg)$/i;
    const allowedMime = /^(application\/pdf|image\/png|image\/jpe?g)$/i;
    const invalid = files.find((f) => {
      const name = f.name?.toLowerCase() || "";
      return !allowedExt.test(name) && !allowedMime.test(f.type || "");
    });
    if (invalid) {
      setSnackbar({ isOpen: true, message: INVALID_FORMAT_MESSAGE, status: "error" });
      return;
    }

    try {
      setUploadingFormIds((prev) => new Set(prev).add(formId));

      await uploadMultiple(files, { description: form.formName });
      if (objectId) {
        await queryClient.invalidateQueries({ queryKey: mediaQueryKey });
      }
      triggerStatusRefresh();

      const count = files.length;
      setSnackbar({
        isOpen: true,
        message: count === 1 ? "Document uploaded successfully" : `${count} documents uploaded successfully`,
        status: "success",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      setSnackbar({
        isOpen: true,
        message:
          error?.message === UPLOAD_CANCELLED_MESSAGE
            ? "Upload cancelled"
            : "Failed to upload document. Please try again.",
        status: "error",
      });
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
    await handleUploadFiles(formId, files);

    if (event.target) {
      event.target.value = "";
    }
  };

  // Handle view document — pass all matching files for multi-file preview
  const handleViewDocument = (formId: number) => {
    const form = enrichedData.find((f) => f.id === formId);
    if (!form?.fileUrl) return;
    const allFiles: ViewDocumentFile[] = form.allMatchingMedia.map((m) => ({
      id: m.id,
      file_url: m.file_url,
      original_filename: m.original_filename,
      mime_type: m.mime_type,
      file_type: m.mime_type,
    }));
    setSelectedDocumentFiles(allFiles.length > 0 ? allFiles : [{
      id: form.mediaId ?? form.id.toString(),
      file_url: form.fileUrl,
      original_filename: form.uploadDocument ?? form.formName,
      mime_type: form.mimeType ?? undefined,
      file_type: form.mimeType ?? undefined,
    }]);
    setDocumentDialogOpen(true);
  };

  // Handle view document from history drawer
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

  // Handle print from history drawer
  const handlePrintHistoryEntry = (entry: HistoryEntry) => {
    const win = window.open(entry.fileUrl, "_blank", "noopener,noreferrer");
    win?.print();
  };

  // Handle delete from history drawer
  const handleDeleteHistoryEntry = (mediaId: string) => {
    setDeleteHistoryMediaId(mediaId);
    setSelectedDocumentId(null);
    setDeleteDocumentDialogOpen(true);
  };

  // Handle print document
  const handlePrintDocument = (formId: number) => {
    const form = enrichedData.find((f) => f.id === formId);
    if (!form?.fileUrl) return;
    const win = window.open(form.fileUrl, "_blank", "noopener,noreferrer");
    win?.print();
  };

  // Handle delete document
  const handleDeleteDocument = (formId: number) => {
    setSelectedDocumentId(formId);
    setDeleteHistoryMediaId(null);
    setDeleteDocumentDialogOpen(true);
  };

  // Open history drawer for a specific repeating form
  const handleOpenHistory = (formId: number) => {
    const form = guardianChecklistData.find((f) => f.id === formId);
    if (!form) return;

    const mediaList = mediaResponse?.results ?? [];
    const entries: HistoryEntry[] = mediaList
      .filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (m: any) =>
          m.description?.trim().toLowerCase() ===
          form.formName.trim().toLowerCase(),
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    setHistoryFormName(form.formName);
    setHistoryEntries(entries);
    setHistoryDrawerOpen(true);
  };

  // Enrich static data with latest media per form
  const enrichedData = useMemo(() => {
    const mediaList = mediaResponse?.results ?? [];

    return guardianChecklistData.map((staticForm) => {
      // Get ALL matching media, sorted newest first
      const matchingMedia = mediaList
        .filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (m: any) =>
            m.description?.trim().toLowerCase() ===
            staticForm.formName.trim().toLowerCase(),
        )
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .sort((a: any, b: any) => {
          const dateA = a.updated_at ?? a.uploaded_at ?? "";
          const dateB = b.updated_at ?? b.uploaded_at ?? "";
          return dateB.localeCompare(dateA);
        });

      const enriched: GuardianChecklistRow = {
        ...staticForm,
        fileCount: matchingMedia.length,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        allMatchingMedia: matchingMedia.map((m: any) => ({
          id: String(m.id),
          file_url: m.file_url,
          original_filename: m.original_filename ?? "Unknown",
          mime_type: m.mime_type,
        })),
      };

      // Take the latest upload for the main table
      if (matchingMedia.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const m = matchingMedia[0] as any;
        enriched.hasFile = true;
        enriched.uploadDocument = m.original_filename;
        enriched.fileUrl = m.file_url;
        enriched.mediaId = m.id;
        enriched.mimeType = m.mime_type;
        const mediaDate = m.updated_at ?? m.uploaded_at;
        enriched.lastUpdated = mediaDate ? formatLastUpdated(mediaDate) : "\u2014";
      } else {
        enriched.hasFile = false;
        enriched.lastUpdated = "\u2014";
      }

      return enriched;
    });
  }, [mediaResponse]);

  // Re-compute history entries when media changes (for open drawer)
  React.useEffect(() => {
    if (historyDrawerOpen && historyFormName) {
      const mediaList = mediaResponse?.results ?? [];
      const entries: HistoryEntry[] = mediaList
        .filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (m: any) =>
            m.description?.trim().toLowerCase() ===
            historyFormName.trim().toLowerCase(),
        )
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  }, [mediaResponse, historyDrawerOpen, historyFormName]);

  const filteredData = enrichedData.filter((form) => {
    if (!searchQuery) return true;
    const searchTerm = searchQuery.toLowerCase();
    return form.formName.toLowerCase().includes(searchTerm);
  });

  const totalRecords = filteredData.length;
  const totalPages = Math.ceil(totalRecords / currentPageSize);
  const startIndex = currentPage * currentPageSize;
  const currentData = filteredData.slice(startIndex, startIndex + currentPageSize);

  React.useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery]);

  const handlePageChange = (_: React.ChangeEvent<unknown> | null, newPage: number) => {
    setCurrentPage(newPage);
    onPageChange?.(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setCurrentPageSize(newSize);
    setCurrentPage(0);
    onPageChange?.(0);
    onPageSizeChange?.(newSize);
  };

  const truncateFileName = (name: string, max = 22) =>
    name.length > max ? name.substring(0, max) + "..." : name;

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
      const form = enrichedData.find((f) => f.id === selectedDocumentId);
      if (form?.mediaId) {
        deleteMedia.mutate({ path: { id: form.mediaId } });
      }
    }
  };

  // While the media list is still loading, show the shared table skeleton
  // instead of the static upload rows that would otherwise flash before
  // flipping to their uploaded-document state.
  if (isMediaLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 0,
          width: "100%",
          border: "1px solid #E3ECEF",
          borderRadius: "8px",
          backgroundColor: "#FFFFFF",
          overflow: "hidden",
        }}
      >
        <TableSkeleton
          headers={tableHeaders}
          rowCount={6}
          hasCheckbox={false}
          hasAvatar={false}
          hasActions={false}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        width: "100%",
        border: "1px solid #E3ECEF",
        borderRadius: "8px",
        backgroundColor: "#FFFFFF",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <TableContainer
          sx={{
            ...tableContainerCss,
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            border: "none",
            borderRadius: 0,
            backgroundColor: "#FFFFFF",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          <Table
            stickyHeader
            aria-label="guardian checklist table"
            sx={{
              tableLayout: "fixed",
              width: "100%",
              backgroundColor: "#FFFFFF",
              "& .MuiTableHead-root .MuiTableCell-root": {
                backgroundColor: "#F2F7FA",
                borderBottom: "1px solid #E3ECEF",
                color: "#30353A",
                px: { xs: 1.5, sm: 2 },
                py: { xs: 1, sm: 1.5 },
              },
              "& .MuiTableBody-root .MuiTableRow-root": {
                "&:hover": {
                  backgroundColor: "rgba(0,0,0,0.01)",
                },
              },
            }}
          >
            <colgroup>
              {tableHeaders.map((h) => (
                <col key={h.id} style={{ width: h.width }} />
              ))}
            </colgroup>

            <TableHead>
              <TableRow>
                {tableHeaders.map((header) => (
                  <TableCell
                    key={header.id}
                    sx={{
                      ...baseCellSx,
                      textAlign: header.align,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "13.5px",
                        fontWeight: 600,
                        lineHeight: "1.2",
                        color: "#30353A",
                        fontFamily: '"Helvetica Neue", Arial, sans-serif',
                        whiteSpace: "nowrap",
                      }}
                    >
                      {header.label}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {currentData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={tableHeaders.length} sx={{ p: 0 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: 220,
                        width: "100%",
                      }}
                    >
                      <Typography sx={{ fontSize: 14, color: "#757775" }}>
                        No documents found.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                currentData.map((row, index) => {
                  const hasFile = row.hasFile && row.uploadDocument;
                  const menuKey = `form-${row.id}`;

                  return (
                    <TableRow key={row.id} hover sx={{ backgroundColor: "#FFFFFF" }}>
                      {/* Sr. no */}
                      <TableCell
                        sx={{
                          ...baseCellSx,
                          textAlign: getColAlign("srNo"),
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#474748",
                        }}
                      >
                        {startIndex + index + 1}
                      </TableCell>

                      {/* Document Name */}
                      <TableCell
                        sx={{
                          ...baseCellSx,
                          textAlign: getColAlign("documentName"),
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#25272c",
                        }}
                      >
                        {row.formName}
                      </TableCell>

                      {/* Upload Document */}
                      <TableCell sx={{ ...baseCellSx, textAlign: getColAlign("uploadDocument") }}>
                        {hasFile ? (
                          <Grid container alignItems="center" spacing={1} wrap="nowrap">
                            <Grid>
                              <DescriptionIcon
                                sx={{ fontSize: 22, color: "#6B7280", flexShrink: 0 }}
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
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleViewDocument(row.id);
                                }}
                              >
                                {truncateFileName(row.uploadDocument!)}
                              </Typography>
                            </Grid>
                            {/* Count badge when multiple files */}
                            {row.fileCount > 1 && (
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
                            {/* Re-upload button */}
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
                              <Tooltip
                                title={!canUpload ? "You don't have permission" : (disabledReason || "")}
                                disableHoverListener={canUpload && !isDisabled}
                              >
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleUploadClick(row.id)}
                                    disabled={!canUpload || isDisabled || uploadingFormIds.has(row.id)}
                                    sx={{
                                      color: canUpload && !isDisabled ? "#1976D2" : "#9E9E9E",
                                      p: 0.5,
                                      cursor: (!canUpload || isDisabled) ? "not-allowed" : "pointer",
                                      "&:hover": { backgroundColor: canUpload && !isDisabled ? "#E3F2FD" : "transparent" },
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
                          </Grid>
                        ) : (
                          <Box>
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
                            <Tooltip
                              title={!canUpload ? "You don't have permission" : (disabledReason || "")}
                              disableHoverListener={canUpload && !isDisabled}
                            >
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Box sx={uploadButtonStyles}>
                                <CustomButton
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleUploadClick(row.id)}
                                  icon={<ArrowUpwardIcon />}
                                  iconPosition="left"
                                  disabled={!canUpload || isDisabled || uploadingFormIds.has(row.id)}
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
                        )}
                      </TableCell>

                      {/* Last Updated */}
                      <TableCell sx={{ ...baseCellSx, textAlign: getColAlign("lastUpdated") }}>
                        <Typography sx={{ ...primaryTextCss, margin: 0, padding: 0 }}>
                          {row.lastUpdated || "\u2014"}
                        </Typography>
                      </TableCell>

                      {/* Action — 3-dot menu */}
                      <TableCell sx={{ ...baseCellSx, textAlign: getColAlign("action") }}>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, menuKey)}
                        >
                          <MoreVertIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                        <Menu
                          anchorEl={anchorEl[menuKey]}
                          open={Boolean(anchorEl[menuKey])}
                          onClose={() => handleMenuClose(menuKey)}
                          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                          transformOrigin={{ vertical: "top", horizontal: "right" }}
                          slotProps={{
                            paper: {
                              sx: {
                                minWidth: 150,
                                boxShadow: "0px 2px 8px rgba(0,0,0,0.12)",
                                borderRadius: "8px",
                              },
                            },
                          }}
                        >
                          <MenuItem
                            disabled={!hasFile}
                            onClick={() => {
                              handleMenuClose(menuKey);
                              handleViewDocument(row.id);
                            }}
                            sx={{ gap: 1, fontSize: 14 }}
                          >
                            <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                            Preview
                          </MenuItem>
                          <MenuItem
                            disabled={!hasFile}
                            onClick={() => {
                              handleMenuClose(menuKey);
                              handlePrintDocument(row.id);
                            }}
                            sx={{ gap: 1, fontSize: 14 }}
                          >
                            <PrintOutlinedIcon sx={{ fontSize: 18 }} />
                            Print
                          </MenuItem>
                          {row.uploadType === "repeating" && (
                            <MenuItem
                              disabled={!hasFile}
                              onClick={() => {
                                handleMenuClose(menuKey);
                                handleOpenHistory(row.id);
                              }}
                              sx={{ gap: 1, fontSize: 14 }}
                            >
                              <HistoryIcon sx={{ fontSize: 18 }} />
                              History
                            </MenuItem>
                          )}
                        </Menu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Pagination row - clearly separated, aligned with table */}
      <Box
        sx={{
          flexShrink: 0,
          borderTop: "1px solid #E3ECEF",
          backgroundColor: "#FFFFFF",
          minHeight: "52px",
          boxSizing: "border-box",
          width: "100%",
        }}
      >
        <Paginator
          page={currentPage}
          totalPages={totalPages}
          totalRecord={totalRecords}
          onPageChange={handlePageChange}
          onRecordsPerPageChange={handlePageSizeChange}
          defaultSize={currentPageSize}
        />
      </Box>

      <UploadProgressPanel progress={uploadProgress} onCancel={cancelUpload} />

      {/* Snackbar for success/error messages */}
      <CommonSnackbar
        isOpen={snackbar.isOpen}
        message={snackbar.message}
        status={snackbar.status}
        onClose={() => setSnackbar({ ...snackbar, isOpen: false })}
      />

      {/* File size alert dialog (> 10 MB) — same as Appointments mark-as-completed */}
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

      {/* Delete Confirmation Popup — handles main table + history drawer */}
      <ConfirmationPopUp
        open={deleteDocumentDialogOpen}
        onClose={() => {
          setDeleteDocumentDialogOpen(false);
          setSelectedDocumentId(null);
          setDeleteHistoryMediaId(null);
        }}
        onConfirm={handleDeleteConfirm}
        message="Are you sure you want to delete this document?"
        confirmDisabled={deleteMedia.isPending}
      />

      {/* Document Preview Dialog */}
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
          setDeleteHistoryMediaId(file.id);
          setSelectedDocumentId(null);
          setDeleteDocumentDialogOpen(true);
        }}
      />

      {/* History Drawer — responsive width */}
      <CustomDrawer
        open={historyDrawerOpen}
        onClose={() => {
          setHistoryDrawerOpen(false);
          setHistoryFormName("");
          setHistoryEntries([]);
        }}
        anchor="right"
        drawerWidth={historyDrawerWidth}
        drawerPadding="0"
      >
        {/* Outer column container */}
        <Grid
          container
          direction="column"
          wrap="nowrap"
          sx={{
            height: "100%",
            backgroundColor: "#FFFFFF",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <Grid
            container
            justifyContent="space-between"
            alignItems="center"
            wrap="nowrap"
            sx={{
              px: { xs: 2, sm: 3 },
              py: 1.5,
              borderBottom: "1px solid #E3ECEF",
              flexShrink: 0,
            }}
          >
            <Grid sx={{ flex: 1, minWidth: 0, pr: 1 }}>
              <Typography
                sx={{
                  fontSize: { xs: "16px", sm: "18px" },
                  fontWeight: 600,
                  color: "#0F172A",
                  fontFamily: "Geist",
                  lineHeight: "24px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                Log of {historyFormName}
              </Typography>
            </Grid>
            <Grid sx={{ flexShrink: 0 }}>
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
          </Grid>

          {/* Scrollable Table Area */}
          <Grid
            sx={{
              flex: 1,
              overflowX: "auto",
              overflowY: "auto",
              minHeight: 0,
            }}
          >
            {historyEntries.length === 0 ? (
              <Grid container justifyContent="center" sx={{ py: 4 }}>
                <Typography sx={{ color: "#757775" }}>No history available</Typography>
              </Grid>
            ) : (
              <Table
                stickyHeader
                sx={{
                  tableLayout: "fixed",
                  width: "100%",
                  minWidth: 340,
                }}
              >
                {/* Fixed column widths — guarantees Action column is always visible */}
                <colgroup>
                  <col /> {/* File Name — takes remaining space */}
                  <col style={{ width: "148px" }} />   {/* Last Updated Date */}
                  <col style={{ width: "112px" }} />   {/* Action */}
                </colgroup>

                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        backgroundColor: "#F2F7FA",
                        color: "#212121",
                        borderBottom: "1px solid #E3ECEF",
                        fontSize: "13px",
                        py: 1.2,
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                    >
                      File Name
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        backgroundColor: "#F2F7FA",
                        color: "#212121",
                        borderBottom: "1px solid #E3ECEF",
                        fontSize: "13px",
                        py: 1.2,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Last Updated Date
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
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
                    <TableRow key={entry.mediaId} hover>
                      {/* File Name: truncates within its column */}
                      <TableCell
                        sx={{
                          py: 1.5,
                          borderBottom: "1px solid #EEF1F4",
                          overflow: "hidden",
                          maxWidth: 0, // critical for fixed-layout truncation
                        }}
                      >
                        <Grid container alignItems="center" wrap="nowrap" spacing={0.75} sx={{ overflow: "hidden" }}>
                          <Grid sx={{ flexShrink: 0, display: "flex" }}>
                            <DescriptionIcon sx={{ fontSize: 18, color: "#6B7280" }} />
                          </Grid>
                          <Grid sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              component="span"
                              sx={{
                                fontSize: "13px",
                                color: "#11466D",
                                cursor: "pointer",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                display: "block",
                                "&:hover": { textDecoration: "underline" },
                              }}
                              onClick={() => handleViewHistoryEntry(entry)}
                              title={entry.fileName}
                            >
                              {entry.fileName}
                            </Typography>
                          </Grid>
                        </Grid>
                      </TableCell>

                      {/* Last Updated Date */}
                      <TableCell
                        sx={{
                          fontSize: "13px",
                          py: 1.5,
                          borderBottom: "1px solid #EEF1F4",
                          color: "#212121",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {entry.uploadDate}
                      </TableCell>

                      {/* Action — 3 icon buttons, always visible */}
                      <TableCell
                        sx={{
                          py: 1.5,
                          borderBottom: "1px solid #EEF1F4",
                        }}
                      >
                        <Grid container alignItems="center" justifyContent="center" wrap="nowrap">
                          <Tooltip title="View">
                            <IconButton
                              size="small"
                              onClick={() => handleViewHistoryEntry(entry)}
                              sx={{ color: "#0A2E45", p: "4px" }}
                            >
                              <Visibility sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Print">
                            <IconButton
                              size="small"
                              onClick={() => handlePrintHistoryEntry(entry)}
                              sx={{ color: "#0A2E45", p: "4px" }}
                            >
                              <Print sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip
                            title={
                              !canDelete
                                ? "You don't have permission"
                                : isDisabled
                                ? disabledReason
                                : "Delete"
                            }
                          >
                            <span>
                              <IconButton
                                size="small"
                                onClick={() =>
                                  (canDelete && !isDisabled)
                                    ? handleDeleteHistoryEntry(entry.mediaId)
                                    : undefined
                                }
                                disabled={deleteMedia.isPending || !canDelete || isDisabled}
                                sx={{
                                  color: canDelete && !isDisabled ? "#DC2626" : "#9E9E9E",
                                  p: "4px",
                                  cursor: (!canDelete || isDisabled) ? "not-allowed" : "pointer",
                                  "&.Mui-disabled": {
                                    color: "#BDBDBD",
                                  },
                                }}
                              >
                                <Delete sx={{ fontSize: 17 }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Grid>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Grid>
        </Grid>
      </CustomDrawer>
    </Box>
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

const fileText = {
  fontSize: "13px",
  color: "#233558",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: 180,
};

export default GuardianChecklistTable;

