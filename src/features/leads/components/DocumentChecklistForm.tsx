import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Grid,
  Button,
  IconButton,
  Tooltip,
  Popover,
} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import CloseIcon from "@mui/icons-material/Close";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DescriptionIcon from "@mui/icons-material/Description";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PrintIcon from "@mui/icons-material/Print";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import dayjs from "dayjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useMediaUpload,
  UPLOAD_CANCELLED_MESSAGE,
} from "../../../hooks/useMediaUpload";
import UploadProgressPanel from "../../../components/upload-progress-panel/upload-progress-panel";

import type { MediaFileItem } from "../../../components/document-checklist/document-checklist";
import type { DocumentItem } from "../../../components/document-checklist";
import CommonSnackbar from "../../../components/common-snackbar/common-snackbar";
import ViewDocumentsDialog, {
  type ViewDocumentFile,
} from "../../appointments/components/ViewDocumentsDialog";
import CustomDialog from "../../../components/custom-dialog/custom-dialog";
import CustomButton from "../../../components/custom-buttons/custom-buttons";

import {
  mediaListOptions,
  mediaDeleteDestroyMutation,
  residentsResidentScheduledFormsRetrieveOptions,
  residentsResidentScheduledFormsRetrieveQueryKey,
  residentsResidentScheduledFormsCreateMutation,
  residentsResidentScheduledFormsDestroyMutation,
} from "../../../sdk/@tanstack/react-query.gen";

/* ================= TYPES ================= */

interface DocumentChecklistFormProps {
  objectId: string; // lead.uuid
  contentTypeApp: "leads";
  contentTypeModel: "lead";
  residentUserUuid?: string;
  onChecklistCompleteChange?: (complete: boolean) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ERROR_MESSAGE_FILE_TOO_LARGE =
  "The selected file is too large. Please choose a file smaller than 10 MB";
const INVALID_FORMAT_MESSAGE =
  "Unsupported file format. Please upload PDF, PNG, JPG, or JPEG files.";

/* ================= ISA CONSTANTS ================= */

const ISA_DOC_ID = 8;
const ISA_FORM_NAME = "Schedule 30-Day ISA";

/* ================= DEFAULT DOCUMENT LIST ================= */

type EnrichedDocumentItem = DocumentItem & {
  mediaId?: number;
  uploadedAt?: string;
  mimeType?: string;
  fileSize?: number;
};

const DEFAULT_DOCUMENTS: DocumentItem[] = [
  { id: 200, name: "Service Agreement" },
  { id: 1,   name: "Team Contact Information" },
  { id: 2,   name: "Rep Payee Contact Information" },
  { id: 3,   name: "HRST" },
  { id: 4,   name: "SIS" },
  { id: 5,   name: "Risk Assessment(s)" },
  { id: 6,   name: "HRC Process Packet" },
  { id: 7,   name: "FBA/Behavior Plan" },
  { id: ISA_DOC_ID, name: ISA_FORM_NAME },
  { id: 9,   name: "ISA" },
  { id: 10,  name: "Approved Contact List" },
  { id: 11,  name: "5-Day Visit scheduled" },
  { id: 12,  name: "Environmental Modifications Needed?" },
  { id: 13,  name: "Assessments" },
  { id: 14,  name: "Supervision Level Language in ISA" },
  { id: 15,  name: "Health History" },
  { id: 16,  name: "Annual Physical" },
  { id: 17,  name: "Immunization Records" },
  { id: 18,  name: "Insurance Cards" },
  { id: 19,  name: "Identification- Birth Certificate, Social Security Card" },
  { id: 20,  name: "Previous Providers" },
  { id: 21,  name: "Other" },
];

/* ================= UPLOAD CELL ================= */

interface UploadCellProps {
  doc: EnrichedDocumentItem;
  uploaded: MediaFileItem[];
  uploadingDocIds: Set<number>;
  deletingMediaId: string | number | null;
  onUpload: (docId: number, file: File) => void;
  onDeleteFile: (docId: number, mediaId: string | number) => void;
}

const UploadCell: React.FC<UploadCellProps> = ({
  doc,
  uploaded,

  uploadingDocIds,
  deletingMediaId,
  onUpload,
  onDeleteFile,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const docIdNum = Number(doc.id);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(docIdNum, file);
    e.target.value = "";
  };

  const truncate = (s: string, max = 14) =>
    s.length > max ? s.substring(0, max) + "..." : s;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        style={{ display: "none" }}
      />

      {uploaded.length === 0 ? (
        <>
          <CustomButton
            variant="secondary"
            size="sm"
            icon={<ArrowUpwardIcon />}
            iconPosition="left"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingDocIds.has(docIdNum)}
          >
            Upload
          </CustomButton>
          {uploadingDocIds.has(docIdNum) && <CircularProgress size={16} />}
        </>
      ) : (
        <>
          <DescriptionIcon sx={{ color: "#6a6b6a", fontSize: "18px", flexShrink: 0 }} />
          <Typography
            variant="body2"
            sx={{
              color: "#212121",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "100px",
              flexShrink: 1,
            }}
            title={uploaded[0].fileName}
          >
            {truncate(uploaded[0].fileName)}
          </Typography>

          {String(deletingMediaId) === String(uploaded[0].mediaId) ? (
            <CircularProgress size={12} sx={{ flexShrink: 0 }} />
          ) : (
            <IconButton
              size="small"
              onClick={() => onDeleteFile(docIdNum, uploaded[0].mediaId)}
              disabled={deletingMediaId != null}
              sx={{
                p: 0.25,
                flexShrink: 0,
                color: "#757775",
                "&:hover": { color: "#d32f2f" },
              }}
            >
              <CloseIcon sx={{ fontSize: "13px" }} />
            </IconButton>
          )}

          {uploadingDocIds.has(docIdNum) ? (
            <CircularProgress size={16} sx={{ flexShrink: 0 }} />
          ) : (
            <IconButton
              size="small"
              onClick={() => fileInputRef.current?.click()}
              sx={{
                p: 0.5,
                flexShrink: 0,
                color: "#757775",
                "&:hover": { color: "#0A2E45" },
              }}
            >
              <ArrowUpwardIcon sx={{ fontSize: "18px" }} />
            </IconButton>
          )}
        </>
      )}
    </Box>
  );
};

/* ================= SHARED CELL STYLES ================= */

const thStyle: React.CSSProperties = {
  fontWeight: 500,
  backgroundColor: "#f2f7fa",
  color: "#212121",
  borderBottom: "1px solid #E3ECEF",
  padding: "10px 8px",
  fontSize: "14px",
  textAlign: "left",
};

/* ================= MAIN COMPONENT ================= */

const DocumentChecklistForm: React.FC<DocumentChecklistFormProps> = ({
  objectId,
  contentTypeApp,
  contentTypeModel,
  residentUserUuid,
  onChecklistCompleteChange,
}) => {
  const userUuid = residentUserUuid || objectId;
  const queryClient = useQueryClient();

  /* -------- UI state -------- */
  const [uploadingDocIds, setUploadingDocIds] = useState<Set<number>>(
    new Set(),
  );
  const [deletingMediaId, setDeletingMediaId] = useState<string | number | null>(null);

  // Extended document item type with extra fields from media API
  type EnrichedDocumentItem = DocumentItem & {
    mediaId?: number;
    uploadedAt?: string;
    mimeType?: string;
    fileSize?: number;
  };

  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<ViewDocumentFile[]>([]);
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

  /* -------- ISA date picker state -------- */
  const [isaScheduledRecordId, setIsaScheduledRecordId] = useState<number | null>(null);
  const [isaSavedDate, setIsaSavedDate] = useState<string | null>(null);
  const [pickerAnchor, setPickerAnchor] = useState<HTMLElement | null>(null);

  /* ======= SCHEDULED FORMS — GET ======= */
  const { refetch: refetchScheduledForms } = useQuery({
    ...residentsResidentScheduledFormsRetrieveOptions({
      query: { resident_uuid: userUuid } as any,
    } as any),
    enabled: !!objectId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Seed ISA state from GET response on mount / objectId change
  useEffect(() => {
    if (!objectId) return;
    queryClient
      .fetchQuery(
        residentsResidentScheduledFormsRetrieveOptions({
          query: { resident_uuid: userUuid } as any,
        } as any),
      )
      .then((raw: unknown) => {
        const r = raw as any;
        const list: any[] = Array.isArray(r)
          ? r
          : Array.isArray(r?.data)
          ? r.data
          : Array.isArray(r?.results)
          ? r.results
          : [];
        const record = list.find((x: any) => x.form_name === ISA_FORM_NAME);
        if (record) {
          setIsaScheduledRecordId(record.id ?? null);
          setIsaSavedDate(record.scheduled_date ?? null);
        } else {
          setIsaScheduledRecordId(null);
          setIsaSavedDate(null);
        }
      })
      .catch(() => {/* ignore */});
  }, [objectId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ======= SCHEDULED FORMS — POST ======= */
  const createScheduledForm = useMutation({
    ...(residentsResidentScheduledFormsCreateMutation() as any),
    onSuccess: (data: unknown) => {
      const record = (data as any)?.data ?? data;
      if (record?.id) setIsaScheduledRecordId(record.id);
      setIsaSavedDate(record?.scheduled_date ?? null);
      queryClient.invalidateQueries({
        queryKey: residentsResidentScheduledFormsRetrieveQueryKey({
          query: { resident_uuid: userUuid } as any,
        } as any),
      });
      refetchScheduledForms();
      showSnackbar("Scheduled date saved successfully", "success");
    },
    onError: () =>
      showSnackbar("Failed to save scheduled date. Please try again.", "error"),
  });

  /* ======= SCHEDULED FORMS — DELETE ======= */
  const deleteScheduledForm = useMutation({
    ...(residentsResidentScheduledFormsDestroyMutation() as any),
    onSuccess: () => {
      setIsaScheduledRecordId(null);
      setIsaSavedDate(null);
      queryClient.invalidateQueries({
        queryKey: residentsResidentScheduledFormsRetrieveQueryKey({
          query: { resident_uuid: userUuid } as any,
        } as any),
      });
      refetchScheduledForms();
      showSnackbar("Scheduled date cleared successfully", "success");
    },
    onError: () =>
      showSnackbar("Failed to clear scheduled date. Please try again.", "error"),
  });

  const handleIsaDateChange = (date: string | null) => {
    if (date === null) {
      if (isaScheduledRecordId !== null) {
        deleteScheduledForm.mutate({ path: { id: isaScheduledRecordId } } as any);
      } else {
        setIsaSavedDate(null);
      }
    } else {
      setIsaSavedDate(date); // optimistic
      createScheduledForm.mutate({
        body: {
          user: userUuid,
          form_name: ISA_FORM_NAME,
          scheduled_date: date,
        },
        headers: { "Content-Type": "application/json" },
      } as any);
    }
  };

  /* ======= MEDIA LIST ======= */
  const { data: mediaResponse } = useQuery({
    ...mediaListOptions({
      query: {
        content_type: `${contentTypeApp}.${contentTypeModel}`,
        object_uuid: objectId,
        page_size: 100,
      } as any,
    }),
    enabled: !!objectId,
  });

  /* ======= MAP DOCUMENTS ======= */
  const documents = useMemo<EnrichedDocumentItem[]>(() => {
    const mediaList =
      (mediaResponse as any)?.data?.results ??
      (mediaResponse as any)?.results ??
      [];

    const otherMedia = mediaList.filter(
      (m: any) => m.description?.trim().toLowerCase() === "other",
    );

    const result: EnrichedDocumentItem[] = [];

    for (const doc of DEFAULT_DOCUMENTS) {
      if (doc.id === ISA_DOC_ID) {
        // ISA row has no media — rendered as date picker
        result.push({ ...doc, mediaFiles: [] });
        continue;
      }

      if (doc.name === "Other") {
        otherMedia.forEach((media: any, idx: number) => {
          const mf: MediaFileItem = {
            mediaId: media.id,
            fileName: media.original_filename ?? "",
            fileUrl: media.file_url ?? "",
            mimeType: media.mime_type,
            fileSize: media.file_size,
          };
          result.push({
            id: Number(doc.id) + idx * 1000,
            name: "Other",
            mediaFiles: [mf],
            fileName: media.original_filename,
            fileUrl: media.file_url,
            mediaId: media.id,
            uploadedAt: dayjs(media.uploaded_at).format("MM/DD/YYYY, hh:mm A"),
            mimeType: media.mime_type,
            fileSize: media.file_size,
          });
        });
        result.push({
          id: Number(doc.id) + otherMedia.length * 1000,
          name: "Other",
          mediaFiles: [],
        });
      } else {
        const mediaItems = mediaList.filter(
          (m: any) =>
            m.description?.trim().toLowerCase() ===
            doc.name.trim().toLowerCase(),
        );
        const mediaFiles: MediaFileItem[] = mediaItems.map((m: any) => ({
          mediaId: m.id,
          fileName: m.original_filename ?? "",
          fileUrl: m.file_url ?? "",
          mimeType: m.mime_type,
          fileSize: m.file_size,
        }));
        result.push({
          ...doc,
          mediaFiles,
          fileName: mediaItems[0]?.original_filename,
          fileUrl: mediaItems[0]?.file_url,
          mediaId: mediaItems[0]?.id,
          uploadedAt: mediaItems[0]
            ? dayjs(mediaItems[0].uploaded_at).format("MM/DD/YYYY, hh:mm A")
            : undefined,
          mimeType: mediaItems[0]?.mime_type,
          fileSize: mediaItems[0]?.file_size,
        });
      }
    }

    return result;
  }, [mediaResponse]);

  /* ======= CHECKLIST COMPLETE NOTIFICATION ======= */
  useEffect(() => {
    if (!onChecklistCompleteChange) return;
    const required = documents.filter(
      (d) => !(d.name === "Other" && !d.fileUrl),
    );
    const complete =
      required.length > 0 && required.every((d) => Boolean(d.fileUrl));
    onChecklistCompleteChange(complete);
  }, [documents, onChecklistCompleteChange]);

  /* ======= UPLOAD MUTATION ======= */
  const { upload: uploadMedia, uploadProgress, cancelUpload } = useMediaUpload({
    contentTypeApp,
    contentTypeModel,
    objectUuid: objectId,
  });

  const isDeletingRef = useRef(false);
  const deleteMedia = useMutation({
    ...mediaDeleteDestroyMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: mediaListOptions({
          query: {
            content_type: `${contentTypeApp}.${contentTypeModel}`,
            object_uuid: objectId,
          } as any,
        }).queryKey,
      });
      showSnackbar("Document deleted successfully", "success");
    },
    onError: () => showSnackbar("Failed to delete document", "error"),
    onSettled: () => {
      setTimeout(() => {
        isDeletingRef.current = false;
        setDeletingMediaId(null);
      }, 500);
    },
  });

  /* ======= HANDLERS ======= */
  const handleUpload = async (documentId: number, file: File) => {
    const doc = documents.find((d) => Number(d.id) === documentId);
    if (!doc) return;

    if (file.size > MAX_FILE_SIZE) {
      setAlertDialog({ open: true, message: ERROR_MESSAGE_FILE_TOO_LARGE });
      return;
    }

    const name = file.name?.toLowerCase() || "";
    const extOk = /\.(pdf|png|jpg|jpeg)$/i.test(name);
    const typeOk = /^(application\/pdf|image\/png|image\/jpe?g)$/i.test(
      file.type || "",
    );
    if (!extOk && !typeOk) {
      showSnackbar(INVALID_FORMAT_MESSAGE, "error");
      return;
    }

    try {
      setUploadingDocIds((prev) => new Set(prev).add(documentId));
      await uploadMedia(file, { description: doc.name });
      await queryClient.invalidateQueries({
        queryKey: mediaListOptions({
          query: {
            content_type: `${contentTypeApp}.${contentTypeModel}`,
            object_uuid: objectId,
          } as any,
        }).queryKey,
      });
      showSnackbar("Document uploaded successfully", "success");
    } catch (error: any) {
      if (error?.message === UPLOAD_CANCELLED_MESSAGE) {
        showSnackbar("Upload cancelled", "error");
        return;
      }
      const backendError =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "";
      const isSizeError =
        typeof backendError === "string" &&
        backendError.toLowerCase().includes("size");
      if (isSizeError) {
        setAlertDialog({ open: true, message: ERROR_MESSAGE_FILE_TOO_LARGE });
      } else {
        showSnackbar("Failed to upload document. Please try again.", "error");
      }
    } finally {
      setUploadingDocIds((prev) => {
        const next = new Set(prev);
        next.delete(documentId);
        return next;
      });
    }
  };

  const handleView = (documentId: number) => {
    const doc = documents.find((d) => Number(d.id) === documentId);
    const files = doc?.mediaFiles ?? [];
    if (!files.length) return;

    const viewFiles: ViewDocumentFile[] = files.map((f) => {
      const inferredMime =
        f.mimeType ||
        (f.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)
          ? "image/" +
            (f.fileUrl
              .match(/\.(jpg|jpeg|png|gif|webp)$/i)?.[1]
              ?.toLowerCase() || "jpeg")
          : "application/pdf");
      return {
        id: f.mediaId.toString(),
        file_url: f.fileUrl,
        original_filename: f.fileName,
        mime_type: inferredMime,
        file_type: inferredMime,
        file_size: f.fileSize,
      };
    });

    setPreviewFiles(viewFiles);
    setDocumentDialogOpen(true);
  };

  const handlePrint = (documentId: number) => {
    const doc = documents.find((d) => Number(d.id) === documentId);
    const firstFile = doc?.mediaFiles?.[0];
    const url = firstFile?.fileUrl ?? doc?.fileUrl;
    if (!url) return;
    const win = window.open(url, "_blank", "noopener,noreferrer");
    win?.print();
  };

  const handleDeleteFile = (documentId: number, mediaId: string | number) => {
    if (isDeletingRef.current) return;
    isDeletingRef.current = true;
    setDeletingMediaId(mediaId);
    deleteMedia.mutate({ path: { id: String(mediaId) } });
  };

  /* ======= ISA DATE DISPLAY ======= */
  const isaDisplayDate =
    isaSavedDate && dayjs(isaSavedDate).isValid()
      ? dayjs(isaSavedDate).format("MM/DD/YYYY")
      : null;

  /* ======= RENDER ======= */
  return (
    <>
      <Box>
        <Typography sx={{ fontSize: "18px", fontWeight: 600, mb: 2 }}>
          Required Document
        </Typography>

        <Grid container>
          <Grid size={{ xs: 12 }}>
            <Box
              sx={{
                border: "1px solid #E3ECEF",
                borderRadius: "8px",
                overflow: "hidden",
                width: "100%",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  tableLayout: "fixed",
                }}
              >
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: "80px" }}>Sr. no</th>
                    <th style={thStyle}>Document Name</th>
                    <th
                      style={{
                        ...thStyle,
                        width: "220px",
                        minWidth: "220px",
                      }}
                    >
                      Upload Document
                    </th>
                    <th
                      style={{
                        ...thStyle,
                        width: "90px",
                        minWidth: "90px",
                        textAlign: "center",
                      }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {documents.map((doc, index) => {
                    const isLast = index === documents.length - 1;
                    const border = isLast
                      ? "none"
                      : "1px solid #E3ECEF";
                    const uploaded = doc.mediaFiles ?? [];
                    const hasFile = !!(doc.fileUrl || uploaded.length);
                    const isISA = Number(doc.id) === ISA_DOC_ID;

                    return (
                      <tr key={doc.id}>
                        {/* Sr. no */}
                        <td
                          style={{
                            borderBottom: border,
                            padding: "8px 12px",
                            width: "60px",
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ color: "#212121", fontWeight: 500 }}
                          >
                            {index + 1}
                          </Typography>
                        </td>

                        {/* Document Name */}
                        <td
                          style={{
                            borderBottom: border,
                            padding: "8px 12px",
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ color: "#212121", fontWeight: 500 }}
                          >
                            {doc.name}
                          </Typography>
                        </td>

                        {/* Upload / Date Picker */}
                        <td
                          style={{
                            borderBottom: border,
                            padding: "8px 12px",
                            width: "220px",
                            minWidth: "220px",
                            maxWidth: "220px",
                            verticalAlign: "middle",
                          }}
                        >
                          {isISA ? (
                            /* ── ISA date picker ── */
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              {isaDisplayDate ? (
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    backgroundColor: "#F0FDF4",
                                    border: "1px solid #BBF7D0",
                                    borderRadius: "20px",
                                    px: 1.5,
                                    py: 0.5,
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      fontSize: "13px",
                                      fontWeight: 500,
                                      color: "#166534",
                                      whiteSpace: "nowrap",
                                      lineHeight: 1,
                                    }}
                                  >
                                    {isaDisplayDate}
                                  </Typography>
                                  <Tooltip title="Clear date" arrow>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleIsaDateChange(null)}
                                      sx={{
                                        p: 0.25,
                                        color: "#16A34A",
                                        "&:hover": {
                                          color: "#B91C1C",
                                          backgroundColor: "#FEF2F2",
                                        },
                                      }}
                                    >
                                      <CloseIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              ) : (
                                <>
                                  <Tooltip
                                    title="Schedule 30-Day ISA date"
                                    arrow
                                  >
                                    <span>
                                      <IconButton
                                        size="small"
                                        onClick={(e) =>
                                          setPickerAnchor(e.currentTarget)
                                        }
                                        sx={{
                                          border: "1px solid #CBD5E1",
                                          borderRadius: "6px",
                                          p: 0.75,
                                          color: "#475569",
                                          backgroundColor: "#F8FAFC",
                                          "&:hover": {
                                            backgroundColor: "#E0F2FE",
                                            borderColor: "#38BDF8",
                                            color: "#0369A1",
                                          },
                                        }}
                                      >
                                        <CalendarMonthIcon
                                          sx={{ fontSize: 18 }}
                                        />
                                      </IconButton>
                                    </span>
                                  </Tooltip>

                                  <Popover
                                    open={Boolean(pickerAnchor)}
                                    anchorEl={pickerAnchor}
                                    onClose={() => setPickerAnchor(null)}
                                    anchorOrigin={{
                                      vertical: "top",
                                      horizontal: "center",
                                    }}
                                    transformOrigin={{
                                      vertical: "bottom",
                                      horizontal: "center",
                                    }}
                                    slotProps={{
                                      paper: {
                                        sx: {
                                          borderRadius: "12px",
                                          boxShadow:
                                            "0 8px 32px rgba(0,0,0,0.15)",
                                          overflow: "hidden",
                                        },
                                      },
                                    }}
                                    sx={{ zIndex: 9999 }}
                                  >
                                    <LocalizationProvider
                                      dateAdapter={AdapterDayjs}
                                    >
                                      <DateCalendar
                                        value={null}
                                        onChange={(newVal) => {
                                          if (
                                            !newVal ||
                                            !dayjs(newVal).isValid()
                                          )
                                            return;
                                          const iso =
                                            dayjs(newVal).format("YYYY-MM-DD");
                                          setPickerAnchor(null);
                                          handleIsaDateChange(iso);
                                        }}
                                      />
                                    </LocalizationProvider>
                                  </Popover>
                                </>
                              )}
                            </Box>
                          ) : (
                            /* ── Regular upload row ── */
                            <UploadCell
                              doc={doc}
                              uploaded={uploaded}
                              uploadingDocIds={uploadingDocIds}
                              deletingMediaId={deletingMediaId}
                              onUpload={handleUpload}
                              onDeleteFile={handleDeleteFile}
                            />
                          )}
                        </td>

                        {/* Action */}
                        <td
                          style={{
                            borderBottom: border,
                            padding: "8px 12px",
                            width: "90px",
                            minWidth: "90px",
                            maxWidth: "90px",
                            textAlign: "center",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 1,
                            }}
                          >
                            {/* View icon */}
                            <IconButton
                              size="small"
                              onClick={() => handleView(Number(doc.id))}
                              disabled={!hasFile}
                              sx={{
                                color: hasFile ? "#757775" : "#E3ECEF",
                                "&:hover": hasFile
                                  ? { color: "#0A2E45", backgroundColor: "#f5f5f5" }
                                  : {},
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>

                            {/* Print icon */}
                            <IconButton
                              size="small"
                              onClick={() => handlePrint(Number(doc.id))}
                              disabled={!hasFile}
                              sx={{
                                color: hasFile ? "#757775" : "#E3ECEF",
                                "&:hover": hasFile
                                  ? { color: "#0A2E45", backgroundColor: "#f5f5f5" }
                                  : {},
                              }}
                            >
                              <PrintIcon fontSize="small" />
                            </IconButton>
                          </Box>

                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <UploadProgressPanel progress={uploadProgress} onCancel={cancelUpload} />

      {/* PREVIEW DIALOG */}
      <ViewDocumentsDialog
        open={documentDialogOpen}
        onClose={() => setDocumentDialogOpen(false)}
        files={previewFiles}
        title="View Document"
        initialIndex={0}
        allowDownload
      />

      {/* SNACKBAR */}
      <CommonSnackbar
        isOpen={snackbar.open}
        message={snackbar.message}
        status={snackbar.status}
        autoClose
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
      />

      {/* ALERT DIALOG */}
      <CustomDialog
        open={alertDialog.open}
        onClose={() => setAlertDialog({ open: false, message: "" })}
        title="Alert"
        width="400px"
        buttonName={[]}
      >
        <Grid
          container
          direction="column"
          gap={2}
          alignItems="center"
          sx={{ textAlign: "center", py: 1 }}
        >
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
    </>
  );
};

export default DocumentChecklistForm;
