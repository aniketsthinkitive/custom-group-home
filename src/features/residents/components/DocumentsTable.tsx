import React, { useState, useRef, useEffect } from "react";
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
  Menu,
  MenuItem,
  Chip,
  Tooltip,
  Popover,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import DatePickerField from "../../../components/date-picker-field/date-picker-field";
import dayjs from "dayjs";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import HistoryIcon from "@mui/icons-material/History";
import DescriptionIcon from "@mui/icons-material/Description";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PrintIcon from "@mui/icons-material/Print";
import DeleteIcon from "@mui/icons-material/Delete";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CloseIcon from "@mui/icons-material/Close";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Paginator from "../../../components/pagination/pagination";
import CustomButton from "../../../components/custom-buttons/custom-buttons";
import TableSkeleton from "../../../components/common-table/TableSkeleton";
import CircularProgress from "@mui/material/CircularProgress";
import {
  primaryTextCss,
  tableContainerCss,
} from "../../../components/common-table/widgets/common-table-widgets";
import type { DocumentTableRow } from "../../../constant/documentsTableData";
import { usePermission } from "../../../hooks/usePermission";

/* ================= CONSTANTS ================= */

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
    width: { xs: "70px", sm: "80px", md: "90px", lg: "90px" },
    minWidth: { xs: "60px", sm: "70px", md: "80px", lg: "90px" },
    align: "center" as const 
  },
  { 
    id: "documentName", 
    label: "Document Name", 
    width: { xs: "200px", sm: "230px", md: "260px", lg: "260px" },
    minWidth: { xs: "180px", sm: "210px", md: "240px", lg: "260px" },
    align: "left" as const 
  },
  { 
    id: "uploadDocument", 
    label: "Upload Document", 
    width: { xs: "180px", sm: "210px", md: "240px", lg: "240px" },
    minWidth: { xs: "160px", sm: "190px", md: "220px", lg: "240px" },
    align: "center" as const 
  },
  { 
    id: "lastUpdated", 
    label: "Last Updated", 
    width: { xs: "140px", sm: "160px", md: "180px", lg: "180px" },
    minWidth: { xs: "120px", sm: "140px", md: "160px", lg: "180px" },
    align: "left" as const 
  },
  { 
    id: "action", 
    label: "Action", 
    width: { xs: "70px", sm: "75px", md: "80px", lg: "80px" },
    minWidth: { xs: "60px", sm: "70px", md: "75px", lg: "80px" },
    align: "center" as const 
  },
];

const getColAlign = (id: string) => tableHeaders.find((h) => h.id === id)?.align ?? "left";

// Removed baseCellSx - using responsive padding directly in table styles

/* ================= TYPES ================= */

/** Per-row data for fillForm document type rows */
export interface FillFormRowData {
  status?: string;
  consentUuid?: string;
  lastUpdated?: string;
  mode?: "new" | "draft" | "view";
}

export interface DocumentsTableProps {
  data: DocumentTableRow[];
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onView?: (documentId: number) => void;
  onUpload?: (documentId: number, files: File[]) => void;
  onHistory?: (documentId: number) => void;
  /** Called when the user clicks Fill Form / Draft on a fillForm row */
  onFillForm?: (documentId: number, mode: "new" | "draft" | "view") => void;
  /** Called when the user clicks Print on a fillForm row */
  onPrintForm?: (documentId: number) => void;
  /** Called when the user clicks Delete on a fillForm row */
  onDeleteForm?: (documentId: number) => void;
  /** Map of documentId → form status info for fillForm rows */
  fillFormData?: Record<number, FillFormRowData>;
  searchQuery?: string;
  /** When set, upload buttons and destructive actions are disabled and this text shows as a tooltip */
  disabledReason?: string;
  isNurse?: boolean;
  /** When false, upload buttons are disabled regardless of permission (e.g. DSP role) */
  canUpload?: boolean;
  /**
   * Map of documentId → ISO date string (YYYY-MM-DD) for rows where dateType==="datePicker".
   * The table reads this to display the current saved date.
   */
  isaDateMap?: Record<number, string | null>;
  /**
   * Called when the user picks a date on a datePicker row.
   * Receives the documentId and the new date in YYYY-MM-DD format (or null to clear).
   */
  onIsaDateChange?: (documentId: number, date: string | null) => void;
  /**
   * Formatted Last Updated for the ISA date row — set by parent after a successful PATCH.
   * Format: "MM/DD/YYYY, h:mm A" to match the existing uploaded-file display.
   */
  isaLastUpdated?: string | null;
  /** When true, render the table skeleton instead of rows (initial data load) */
  isLoading?: boolean;
}

/* ================= COMPONENT ================= */

const DocumentsTable: React.FC<DocumentsTableProps> = ({
  data,
  page = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  onView,
  onUpload,
  onHistory,
  onFillForm,
  onPrintForm,
  onDeleteForm,
  fillFormData,
  searchQuery = "",
  disabledReason,
  isNurse,
  canUpload = true,
  isaDateMap = {},
  onIsaDateChange,
  isaLastUpdated,
  isLoading = false,
}) => {
  const { hasPermission } = usePermission();
  const canUploadDocument = hasPermission("documents.upload") && canUpload;
  const canViewHistory = hasPermission("documents.versioning");
  const isDisabled = !!disabledReason;
  const [currentPage, setCurrentPage] = useState(page);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [uploadingDocIds, setUploadingDocIds] = useState<Set<number>>(
    new Set(),
  );
  const [anchorEl, setAnchorEl] = useState<{ [key: number]: HTMLElement | null }>({});
  const [pickerAnchor, setPickerAnchor] = useState<{ id: number; el: HTMLElement } | null>(null);

  // Local display state — instant UI update on selection
  const [localIsaDates, setLocalIsaDates] = useState<Record<number, string | null>>(
    isaDateMap ?? {}
  );
  // Re-sync when parent prop changes (tab switch remount, page refetch, etc.)
  useEffect(() => {
    setLocalIsaDates(isaDateMap ?? {});
  }, [JSON.stringify(isaDateMap)]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredData = data.filter((doc) =>
    doc.documentName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalRecords = filteredData.length;
  const totalPages = Math.ceil(totalRecords / currentPageSize);
  const startIndex = currentPage * currentPageSize;
  const currentData = filteredData.slice(
    startIndex,
    startIndex + currentPageSize,
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, docId: number) => {
    setAnchorEl((prev) => ({ ...prev, [docId]: event.currentTarget }));
  };

  const handleMenuClose = (docId: number) => {
    setAnchorEl((prev) => ({ ...prev, [docId]: null }));
  };

  const handleUploadClick = (documentId: number) => {
    const input = fileInputRefs.current[documentId];
    if (input) {
      input.click();
    }
  };
  const canAccessNursingForm =
  hasPermission("documents.upload") &&
  !isDisabled;

  const handleFileChange = async (
    documentId: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    try {
      setUploadingDocIds((prev) => new Set(prev).add(documentId));
      await onUpload?.(documentId, files);
    } finally {
      setUploadingDocIds((prev) => {
        const next = new Set(prev);
        next.delete(documentId);
        return next;
      });
    }

    if (event.target) {
      event.target.value = "";
    }
  };

  const truncateFileName = (name: string, max = 22) =>
    name.length > max ? name.substring(0, max) + "..." : name;

  React.useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery]);

  return (
    isLoading ? (
      // While the initial document data is loading, show the shared table
      // skeleton instead of the static rows that would otherwise flash before
      // flipping to their uploaded/filled state.
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
          headers={tableHeaders.map((header) => ({
            id: header.id,
            label: header.label,
            width: header.width.lg,
          }))}
          rowCount={6}
          hasCheckbox={false}
          hasAvatar={false}
          hasActions={false}
        />
      </Box>
    ) : (
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
          overflow: "visible", // Allow overflow for horizontal scrolling
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "100%",
        }}
      >
        <TableContainer
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "auto", // Enable horizontal scrolling when needed
            width: "100%",
            maxWidth: "100%",
            border: "none",
            borderRadius: 0,
            backgroundColor: "#FFFFFF",
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
              color: "#30353A",
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
          <Table
            stickyHeader
            aria-label="documents table"
            sx={{
              tableLayout: "auto",
              backgroundColor: "#FFFFFF",
            }}
          >

            <TableHead>
              <TableRow>
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
                          fontSize: { xs: "12px", sm: "12.5px", md: "13px", lg: "13.5px" },
                          fontWeight: 600,
                          lineHeight: "1.2",
                          color: "#30353A",
                          fontFamily: '"Helvetica Neue", Arial, sans-serif',
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
                currentData.map((doc, index) => {
                  const hasFile = doc.hasFile && doc.uploadDocument;

                  return (
                    <TableRow key={doc.id} hover sx={{ backgroundColor: "#FFFFFF" }}>
                      {/* Sr. no */}
                      <TableCell
                        sx={{
                          width: tableHeaders[0].width,
                          minWidth: tableHeaders[0].minWidth,
                          textAlign: getColAlign("srNo"),
                          fontSize: { xs: "12px", sm: "13px", md: "14px", lg: "14px" },
                          fontWeight: 600,
                          color: "#474748",
                        }}
                      >
                        {startIndex + index + 1}
                      </TableCell>

                      {/* Document Name */}
                      <TableCell
                        sx={{
                          width: tableHeaders[1].width,
                          minWidth: tableHeaders[1].minWidth,
                          textAlign: getColAlign("documentName"),
                          fontSize: { xs: "12px", sm: "13px", md: "14px", lg: "14px" },
                          fontWeight: 500,
                          color: "#25272c",
                        }}
                      >
                        <Typography
                          component="span"
                          sx={{
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {doc.documentName}
                        </Typography>
                      </TableCell>

                      {/* Upload Document */}
                      <TableCell
                        sx={{
                          width: tableHeaders[2].width,
                          minWidth: tableHeaders[2].minWidth,
                          textAlign: getColAlign("uploadDocument")
                        }}
                      >
                        {/* ── DATE PICKER row (e.g. "Schedule 30-Day ISA") ── */}
                        {doc.dateType === "datePicker" ? (() => {
                          const localDate = localIsaDates[doc.id] ?? null;
                          const dayjsValue = localDate ? dayjs(localDate) : null;
                          const displayDate = dayjsValue?.isValid()
                            ? dayjsValue.format("MM/DD/YYYY")
                            : null;
                          const isPickerDisabled = isDisabled || !canUploadDocument;

                          return (
                            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                              {displayDate ? (
                                /* ── Date selected: chip with ❌ ── */
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "20px", px: 1.5, py: 0.5 }}>
                                  <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#166534", whiteSpace: "nowrap", lineHeight: 1 }}>
                                    {displayDate}
                                  </Typography>
                                  <Tooltip title="Clear date" arrow>
                                    <IconButton
                                      size="small"
                                      disabled={isPickerDisabled}
                                      onClick={() => {
                                        setLocalIsaDates((p) => ({ ...p, [doc.id]: null }));
                                        onIsaDateChange?.(doc.id, null);
                                      }}
                                      sx={{ p: 0.25, color: "#16A34A", "&:hover": { color: "#B91C1C", backgroundColor: "#FEF2F2" }, opacity: isPickerDisabled ? 0.4 : 1 }}
                                    >
                                      <CloseIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              ) : (
                                /* ── No date: calendar icon button opens Popover ── */
                                <>
                                  <Tooltip title={isPickerDisabled ? (disabledReason || "You don't have permission") : "Schedule 30-Day ISA date"} arrow>
                                    <span>
                                      <IconButton
                                        size="small"
                                        disabled={isPickerDisabled}
                                        onClick={(e) => setPickerAnchor({ id: doc.id, el: e.currentTarget })}
                                        sx={{
                                          border: "1px solid #CBD5E1", borderRadius: "6px", p: 0.75,
                                          color: "#475569", backgroundColor: "#F8FAFC",
                                          "&:hover": { backgroundColor: "#E0F2FE", borderColor: "#38BDF8", color: "#0369A1" },
                                          opacity: isPickerDisabled ? 0.5 : 1,
                                        }}
                                      >
                                        <CalendarMonthIcon sx={{ fontSize: 18 }} />
                                      </IconButton>
                                    </span>
                                  </Tooltip>

                                  <Popover
                                    open={pickerAnchor?.id === doc.id}
                                    anchorEl={pickerAnchor?.el ?? null}
                                    onClose={() => setPickerAnchor(null)}
                                    anchorOrigin={{ vertical: "top", horizontal: "center" }}
                                    transformOrigin={{ vertical: "bottom", horizontal: "center" }}
                                    slotProps={{ paper: { sx: { borderRadius: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", overflow: "hidden" } } }}
                                    sx={{ zIndex: 9999 }}
                                  >
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                      <DateCalendar
                                        value={null}
                                        onChange={(newVal) => {
                                          if (!newVal || !dayjs(newVal).isValid()) return;
                                          const iso = dayjs(newVal).format("YYYY-MM-DD");
                                          // Update local state immediately for instant chip display
                                          setLocalIsaDates((p) => ({ ...p, [doc.id]: iso }));
                                          setPickerAnchor(null);
                                          // Propagate to LeadDetailPage for tab-switch persistence
                                          onIsaDateChange?.(doc.id, iso);
                                        }}
                                      />
                                    </LocalizationProvider>
                                  </Popover>
                                </>
                              )}
                            </Box>
                          );
                        })() : doc.documentType === "fillForm" ? (() => {
                          const formInfo = fillFormData?.[doc.id];
                          const status = formInfo?.status;
                          const isFilled = status === "COMPLETED" || status === "SIGNED";
                          const isDraft = status === "DRAFT";

                          if (isFilled) {
                            // Green tick + "Filled" — clicking opens view mode
                            return (
                              <Box
                                sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 0.5, cursor: "pointer" }}
                                onClick={() => onFillForm?.(doc.id, "view")}
                              >
                                <CheckCircleIcon sx={{ fontSize: 18, color: "#2E7D32" }} />
                                <Typography sx={{ fontSize: "13px", color: "#2E7D32", fontWeight: 500 }}>
                                  Filled
                                </Typography>
                              </Box>
                            );
                          }

                          const mode = isDraft ? "draft" : "new";
                          const btnLabel = isDraft ? "Draft" : "Fill Form";
                          return (
                            <Box sx={{ display: "flex", justifyContent: "center" }}>
                             <Tooltip
  title={
    !canAccessNursingForm
      ? (disabledReason || "You don't have permission")
      : ""
  }
  disableHoverListener={canAccessNursingForm}
>
                                <Box sx={fillFormButtonStyles(isDraft)}>
                                  <CustomButton
                                    variant="secondary"
                                    size="sm"
                                   onClick={() => canAccessNursingForm && onFillForm?.(doc.id, mode)}
                                   disabled={!canAccessNursingForm}
                                  >
                                    {btnLabel}
                                  </CustomButton>
                                </Box>
                              </Tooltip>
                            </Box>
                          );
                        })() : hasFile ? (
                          <Grid
                            container
                            alignItems="center"
                            justifyContent="center"
                            spacing={1}
                            wrap="nowrap"
                          >
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
                                  onView?.(doc.id);
                                }}
                              >
                                {truncateFileName(doc.uploadDocument!)}
                              </Typography>
                            </Grid>
                            {/* Count badge when multiple files */}
                            {(doc.fileCount ?? 0) > 1 && (
                              <Grid>
                                <Chip
                                  label={`${doc.fileCount} files`}
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
                                  fileInputRefs.current[doc.id] = el;
                                }}
                                onChange={(e) => handleFileChange(doc.id, e)}
                                style={{ display: "none" }}
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              />
                              <Tooltip
                                title={!canUploadDocument ? "You don't have permission" : disabledReason || ""}
                                disableHoverListener={canUploadDocument && !isDisabled}
                              >
                                <span style={{ display: "inline-block", cursor: !canUploadDocument ? "not-allowed" : "default" }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleUploadClick(doc.id)}
                                    disabled={!canUploadDocument || isDisabled || uploadingDocIds.has(doc.id)}
                                    sx={{
                                      color: "#1976D2",
                                      p: 0.5,
                                      "&:hover": { backgroundColor: "#E3F2FD" },
                                    }}
                                  >
                                    {uploadingDocIds.has(doc.id) ? (
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
                          <Box sx={{ display: "flex", justifyContent: "center" }}>
                            <input
                              type="file"
                              multiple
                              ref={(el) => {
                                fileInputRefs.current[doc.id] = el;
                              }}
                              onChange={(e) => handleFileChange(doc.id, e)}
                              style={{ display: "none" }}
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                            <Tooltip
                              title={!canUploadDocument ? "You don't have permission" : disabledReason || ""}
                              disableHoverListener={canUploadDocument && !isDisabled}
                            >
                            <Box
                              sx={{ display: "flex", alignItems: "center", gap: 1, cursor: !canUploadDocument ? "not-allowed" : "default" }}
                            >
                              <Box sx={uploadButtonStyles}>
                                <CustomButton
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleUploadClick(doc.id)}
                                  icon={<ArrowUpwardIcon />}
                                  iconPosition="left"
                                  disabled={!canUploadDocument || isDisabled || uploadingDocIds.has(doc.id)}
                                >
                                  Upload
                                </CustomButton>
                              </Box>

                              {uploadingDocIds.has(doc.id) && (
                                <CircularProgress
                                  size={18}
                                  thickness={5}
                                  sx={{ color: "#0A2E45" }}
                                />
                              )}
                            </Box>
                            </Tooltip>
                          </Box>
                        )}
                      </TableCell>

                      {/* Last Updated */}
                      <TableCell 
                        sx={{ 
                          width: tableHeaders[3].width,
                          minWidth: tableHeaders[3].minWidth,
                          textAlign: getColAlign("lastUpdated") 
                        }}
                      >
                        <Typography sx={{ ...primaryTextCss, margin: 0, padding: 0 }}>
                          {doc.dateType === "datePicker"
                              ? (isaLastUpdated ?? "—")
                              : doc.documentType === "fillForm"
                              ? (fillFormData?.[doc.id]?.lastUpdated ?? "—")
                              : (doc.lastUpdated || "—")}
                        </Typography>
                      </TableCell>

                      {/* Action — 3-dot menu */}
                      <TableCell 
                        sx={{ 
                          width: tableHeaders[4].width,
                          minWidth: tableHeaders[4].minWidth,
                          textAlign: getColAlign("action") 
                        }}
                      >
                        <IconButton
                          size="small"
                          disabled={doc.dateType === "datePicker"}
                          onClick={(e) => handleMenuOpen(e, doc.id)}
                          sx={{
                            opacity: doc.dateType === "datePicker" ? 0.3 : 1,
                            cursor: doc.dateType === "datePicker" ? "not-allowed" : "pointer",
                          }}
                        >
                          <MoreVertIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                        <Menu
                          anchorEl={anchorEl[doc.id]}
                          open={Boolean(anchorEl[doc.id])}
                          onClose={() => handleMenuClose(doc.id)}
                          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                          transformOrigin={{ vertical: "top", horizontal: "right" }}
                          slotProps={{
                            paper: {
                              sx: {
                                backgroundColor: "#FFFFFF",
                                border: "1px solid #DFE5E2",
                                borderRadius: "6px",
                                boxShadow: "0px 4px 6px -2px rgba(16,24,40,0.03), 0px 12px 16px -4px rgba(16,24,40,0.08)",
                                padding: "4px 0",
                                minWidth: "160px",
                              },
                            },
                          }}
                        >
                          {doc.documentType === "fillForm" ? (() => {
                            const fi = fillFormData?.[doc.id];
                            const isFilled = fi?.status === "COMPLETED" || fi?.status === "SIGNED";
                            const isDraft = fi?.status === "DRAFT";
                            const canView = isFilled || isDraft;
                            const canPrint = isFilled;
                            const canDelete = isFilled || isDraft;
                            return (
                              <>
                                {/* View */}
                                <MenuItem
                                  disabled={!canView}
                                  onClick={() => {
                                    handleMenuClose(doc.id);
                                    onFillForm?.(doc.id, isFilled ? "view" : "draft");
                                  }}
                                  sx={{ padding: "10px 14px", gap: "8px" }}
                                >
                                  <ListItemIcon sx={{ minWidth: "18px !important" }}>
                                    <VisibilityOutlinedIcon sx={{ fontSize: 18, color: canView ? "#2C2D2C" : "#B0B0B0" }} />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary="View"
                                    slotProps={{ primary: { sx: { fontSize: "13px", fontWeight: 500, color: canView ? "#2C2D2C" : "#B0B0B0" } } }}
                                  />
                                </MenuItem>

                                {/* Print */}
                                <MenuItem
                                  disabled={!canPrint}
                                  onClick={() => {
                                    handleMenuClose(doc.id);
                                    onPrintForm?.(doc.id);
                                  }}
                                  sx={{ padding: "10px 14px", gap: "8px" }}
                                >
                                  <ListItemIcon sx={{ minWidth: "18px !important" }}>
                                    <PrintIcon sx={{ fontSize: 18, color: canPrint ? "#2C2D2C" : "#B0B0B0" }} />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary="Print"
                                    slotProps={{ primary: { sx: { fontSize: "13px", fontWeight: 500, color: canPrint ? "#2C2D2C" : "#B0B0B0" } } }}
                                  />
                                </MenuItem>

                                {/* Delete */}
                                {canDelete && !isDisabled && (
                               <Tooltip
  title={
    (!canDelete || isDisabled || isNurse)
      ? "You don't have permission"
      : ""
  }
  arrow
  placement="left"
  disableHoverListener={!(!canDelete || isDisabled || isNurse)}
>
  {/* ✅ span wrapper is REQUIRED for disabled MenuItem */}
  <span>
    <MenuItem
      disabled={!canDelete || isDisabled || isNurse}
      onClick={() => {
        if (isNurse) return; // extra safety
        handleMenuClose(doc.id);
        onDeleteForm?.(doc.id);
      }}
      sx={{ padding: "10px 14px", gap: "8px" }}
    >
      <ListItemIcon sx={{ minWidth: "18px !important" }}>
        <DeleteIcon
          sx={{
            fontSize: 18,
            color:
              (!canDelete || isDisabled || isNurse)
                ? "#B0B0B0"
                : "#B51C1C",
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
              color:
                (!canDelete || isDisabled || isNurse)
                  ? "#B0B0B0"
                  : "#B51C1C",
            },
          },
        }}
      />
    </MenuItem>
  </span>
</Tooltip>
                                )}
                              </>
                            );
                          })() : (
                          <>
                            <MenuItem
                              disabled={!hasFile}
                              onClick={() => {
                                handleMenuClose(doc.id);
                                onView?.(doc.id);
                              }}
                              sx={{ padding: "10px 14px", gap: "8px" }}
                            >
                              <ListItemIcon sx={{ minWidth: "18px !important" }}>
                                <VisibilityOutlinedIcon sx={{ fontSize: 18, color: hasFile ? "#2C2D2C" : "#B0B0B0" }} />
                              </ListItemIcon>
                              <ListItemText
                                primary="Preview"
                                slotProps={{ primary: { sx: { fontSize: "13px", fontWeight: 500, color: hasFile ? "#2C2D2C" : "#B0B0B0" } } }}
                              />
                            </MenuItem>
                            {doc.uploadType === "repeating" && (
                              <Tooltip
                                title={!canViewHistory ? "You don't have permission" : ""}
                                arrow
                                placement="left"
                                disableHoverListener={canViewHistory}
                              >
                                <span>
                                  <MenuItem
                                    disabled={!hasFile || !canViewHistory}
                                    onClick={() => {
                                      handleMenuClose(doc.id);
                                      onHistory?.(doc.id);
                                    }}
                                    sx={{ padding: "10px 14px", gap: "8px" }}
                                  >
                                    <ListItemIcon sx={{ minWidth: "18px !important" }}>
                                      <HistoryIcon sx={{ fontSize: 18, color: hasFile && canViewHistory ? "#2C2D2C" : "#B0B0B0" }} />
                                    </ListItemIcon>
                                    <ListItemText
                                      primary="History"
                                      slotProps={{ primary: { sx: { fontSize: "13px", fontWeight: 500, color: hasFile && canViewHistory ? "#2C2D2C" : "#B0B0B0" } } }}
                                    />
                                  </MenuItem>
                                </span>
                              </Tooltip>
                            )}
                          </>
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
          onPageChange={(_, p) => {
            setCurrentPage(p);
            onPageChange?.(p);
          }}
          onRecordsPerPageChange={(s) => {
            setCurrentPageSize(s);
            setCurrentPage(0);
            onPageSizeChange?.(s);
          }}
          defaultSize={currentPageSize}
        />
      </Box>
    </Box>
    )
  );
};

/* ================= Styles ================= */

const fillFormButtonStyles = (_isDraft?: boolean) => ({
  "& button": {
    backgroundColor: "#FFFFFF !important",
    border: "1px solid #0A2E45 !important",
    color: "#0A2E45 !important",
    borderRadius: "6px !important",
    padding: "6px 12px !important",
    fontSize: "12px !important",
    fontWeight: 400,
    minHeight: "32px !important",
    minWidth: "100px !important",

    "&:hover": {
      backgroundColor: "#F0F4F8 !important",
    },

    "&:disabled": {
      borderColor: "#E3ECEF !important",
      color: "#E3ECEF !important",
    },
  },
});

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
};

export default DocumentsTable;
