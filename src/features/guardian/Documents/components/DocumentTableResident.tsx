import React, { useState, useRef, useEffect } from "react";
import dayjs, { type Dayjs } from "dayjs";
import {
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
  Skeleton,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CircularProgress from "@mui/material/CircularProgress";
import Paginator from "../../../../components/pagination/pagination";
import CustomButton from "../../../../components/custom-buttons/custom-buttons";
import ReviewSignDialog from "./ReviewSignDialog";

/* ================= TYPES ================= */

export interface DocumentTableRow {
  id: number;
  mediaUuid?: string;
  documentName: string;
  hasFile: boolean;
  uploadDocument?: string;
  fileUrl?: string;
  lastUpdated?: string;
  isSigned?: boolean;
  signedBy?: string | null;
  signedDate?: string | null;
  documentType?: "Consent Form" | "Document";
}

export interface DocumentsTableProps {
  data: DocumentTableRow[];
  page?: number;
  pageSize?: number;
  totalRecords?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onView?: (documentId: number) => void;
  onDownload?: (documentId: number) => void;
  onPrint?: (documentId: number) => void;
  onDelete?: (documentId: number) => void;
  onUpload?: (documentId: number, file: File) => void;
  onSign?: (documentId: number, signatureData: string) => void;
  searchQuery?: string;
  filterDate?: Dayjs | null;
  signed?: boolean;
  loading?: boolean;
}

/* ================= COLUMN CONFIG ================= */

/* Fixed widths so table scrolls right-to-left like main document table when narrow */
const columns = [
  { id: "sr", label: "Sr. no", width: "60px", align: "left" as const },
  { id: "name", label: "Document Name", width: "200px", align: "left" as const },
  { id: "type", label: "Type", width: "120px", align: "center" as const },
  { id: "upload", label: "Upload Document", width: "200px", align: "left" as const },
  { id: "status", label: "Status", width: "100px", align: "center" as const },
  { id: "date", label: "Last Updated", width: "180px", align: "left" as const },
  { id: "action", label: "Action", width: "80px", align: "center" as const },
];

/* ================= COMPONENT ================= */

const DocumentsTable: React.FC<DocumentsTableProps> = ({
  data,
  page = 0,
  pageSize = 10,
  totalRecords: controlledTotalRecords,
  totalPages: controlledTotalPages,
  onPageChange,
  onPageSizeChange,
  onView,
  onDownload,
  onPrint,
  onUpload,
  onSign,
  searchQuery = "",
  filterDate,
  loading = false,
}) => {
  const [currentPage, setCurrentPage] = useState(page);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const [uploadingDocIds, setUploadingDocIds] = useState<Set<number>>(
    new Set(),
  );
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Review & Sign dialog
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewDocument, setReviewDocument] = useState<DocumentTableRow | null>(null);

  // Context menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const menuOpen = Boolean(anchorEl);

  // Filter + paginate (date filtering is done by the API when filterDate is set)
  const filteredData = data.filter((doc) => {
    const matchesSearch = doc.documentName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });
  const derivedTotalRecords = filteredData.length;
  const derivedTotalPages = Math.max(1, Math.ceil(derivedTotalRecords / currentPageSize));
  const totalRecords = controlledTotalRecords ?? derivedTotalRecords;
  const totalPages = controlledTotalPages ?? derivedTotalPages;
  const startIndex = currentPage * currentPageSize;
  const currentData = filteredData.slice(startIndex, startIndex + currentPageSize);

  // Reset page on search/filter change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, filterDate]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, docId: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedDocId(docId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDocId(null);
  };

  const handleUploadClick = (documentId: number) => {
    fileInputRefs.current[documentId]?.click();
  };

  const handleFileChange = async (
    documentId: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploadingDocIds((prev) => new Set(prev).add(documentId));
      await onUpload?.(documentId, file);
    } finally {
      setUploadingDocIds((prev) => {
        const next = new Set(prev);
        next.delete(documentId);
        return next;
      });
    }
    if (event.target) event.target.value = "";
  };

  const truncateFileName = (name: string, max = 28) =>
    name.length > max ? name.substring(0, max) + "..." : name;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        minWidth: 0,
        border: "1px solid #E3ECEF",
        borderRadius: "8px",
        backgroundColor: "#FFFFFF",
        overflow: "hidden",
      }}
    >
      {/* Table scrolls right-to-left and up-down; scrollbar color matches All Appointments table */}
      <TableContainer
        sx={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          overflowY: "auto",
          overflowX: "auto",
          scrollbarWidth: "none",
          scrollbarColor: "#D1D5DB #F3F4F6",
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
          "& .MuiTableHead-root": {
            position: "sticky",
            top: 0,
            zIndex: 2,
            backgroundColor: "#F2F7FA",
          },
        }}
      >
        <Table
          stickyHeader
          sx={{
            minWidth: 940,
            tableLayout: "fixed",
            borderCollapse: "collapse",
            "& th, & td": { padding: "12px 16px" },
          }}
        >
          <colgroup>
            {columns.map((col) => (
              <col key={col.id} style={{ width: col.width }} />
            ))}
          </colgroup>

          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.id} align={col.align} sx={headerSx}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              Array.from({ length: currentPageSize }).map((_, rowIndex) => (
                <TableRow key={`skeleton-row-${rowIndex}`}>
                  {columns.map((col) => (
                    <TableCell key={col.id} align={col.align} sx={cellSx}>
                      {col.id === "type" || col.id === "status" ? (
                        <Box
                          display="flex"
                          justifyContent="center"
                        >
                          <Skeleton
                            variant="rounded"
                            width={col.id === "status" ? 64 : 88}
                            height={24}
                          />
                        </Box>
                      ) : col.id === "upload" ? (
                        <Skeleton
                          variant="rounded"
                          width={90}
                          height={32}
                        />
                      ) : col.id === "action" ? (
                        <Box display="flex" justifyContent="center">
                          <Skeleton
                            variant="circular"
                            width={24}
                            height={24}
                          />
                        </Box>
                      ) : (
                        <Skeleton
                          variant="text"
                          width={col.id === "sr" ? "40%" : "80%"}
                          height={16}
                        />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : currentData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  align="center"
                  sx={{ ...cellSx, borderBottom: "none" }}
                >
                  <Typography sx={{ py: 4, color: "#757575", fontSize: 14 }}>
                    No documents found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((doc, index) => {
                const hasFile = doc.hasFile && doc.uploadDocument;

                return (
                  <TableRow
                    key={doc.id}
                    sx={{
                      "&:hover": { backgroundColor: "rgba(67,147,34,0.02)" },
                    }}
                  >
                    {/* Sr. No */}
                    <TableCell align="left" sx={cellSx}>
                      <Typography sx={{ fontSize: 14, color: "#2C2D2C" }}>
                        {startIndex + index + 1}
                      </Typography>
                    </TableCell>

                    {/* Document Name */}
                    <TableCell align="left" sx={cellSx}>
                      <Typography
                        sx={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: "#25272C",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {doc.documentName.replace(/\.pdf$/i, "")}
                      </Typography>
                    </TableCell>

                    {/* Type */}
                    <TableCell align="center" sx={cellSx}>
                      <Chip
                        label={doc.documentType === "Consent Form" ? "Consent Form" : "Document"}
                        size="small"
                        sx={{
                          fontSize: 12,
                          fontWeight: 500,
                          height: 24,
                          backgroundColor: doc.documentType === "Consent Form" ? "#EDE7F6" : "#E3F2FD",
                          color: doc.documentType === "Consent Form" ? "#4527A0" : "#1565C0",
                          border: `1px solid ${doc.documentType === "Consent Form" ? "#D1C4E9" : "#90CAF9"}`,
                        }}
                      />
                    </TableCell>

                    {/* Upload Document */}
                    <TableCell align="left" sx={cellSx}>
                      {hasFile ? (
                        <Box display="flex" alignItems="center" gap={1}>
                          <DescriptionIcon
                            sx={{ fontSize: 20, color: "#6B7280", flexShrink: 0 }}
                          />
                          <Typography
                            sx={{
                              fontSize: 13,
                              color: "#1976D2",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
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
                        </Box>
                      ) : (
                        <Box>
                          <input
                            type="file"
                            ref={(el) => { fileInputRefs.current[doc.id] = el; }}
                            onChange={(e) => handleFileChange(doc.id, e)}
                            style={{ display: "none" }}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          />
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box sx={uploadBtnSx}>
                              <CustomButton
                                variant="secondary"
                                size="sm"
                                onClick={() => handleUploadClick(doc.id)}
                                icon={<ArrowUpwardIcon />}
                                iconPosition="left"
                                disabled={uploadingDocIds.has(doc.id)}
                              >
                                Upload
                              </CustomButton>
                            </Box>
                            {uploadingDocIds.has(doc.id) && (
                              <CircularProgress size={18} thickness={5} sx={{ color: "#1976D2" }} />
                            )}
                          </Box>
                        </Box>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell align="center" sx={cellSx}>
                      <Chip
                        label={doc.isSigned ? "Signed" : "Unsigned"}
                        size="small"
                        sx={{
                          fontSize: 12,
                          fontWeight: 500,
                          height: 24,
                          backgroundColor: doc.isSigned ? "#DCFCE7" : "#FEF3C7",
                          color: doc.isSigned ? "#166534" : "#92400E",
                          border: `1px solid ${doc.isSigned ? "#BBF7D0" : "#FDE68A"}`,
                        }}
                      />
                    </TableCell>

                    {/* Last Updated */}
                    <TableCell align="left" sx={cellSx}>
                      <Typography sx={{ fontSize: 14, color: "#2C2D2C" }}>
                        {doc.lastUpdated || "-"}
                      </Typography>
                    </TableCell>

                    {/* Action */}
                    <TableCell align="center" sx={cellSx}>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, doc.id)}
                        sx={{
                          padding: "4px",
                          borderRadius: "6px",
                          "&:hover": { backgroundColor: "rgba(67,147,34,0.04)" },
                        }}
                      >
                        <MoreVertIcon sx={{ fontSize: 20, color: "#6B7280" }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* CONTEXT MENU */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: { minWidth: 160, borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (selectedDocId) onView?.(selectedDocId);
            handleMenuClose();
          }}
        >
          Preview
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedDocId) onDownload?.(selectedDocId);
            handleMenuClose();
          }}
        >
          Download
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedDocId) onPrint?.(selectedDocId);
            handleMenuClose();
          }}
        >
          Print
        </MenuItem>
        {(() => {
          const selectedRow = data.find((d) => d.id === selectedDocId);
          return selectedRow && !selectedRow.isSigned;
        })() && (
          <MenuItem
            onClick={() => {
              const doc = data.find((d) => d.id === selectedDocId) || null;
              setReviewDocument(doc);
              setReviewDialogOpen(true);
              handleMenuClose();
            }}
          >
            Review & Sign
          </MenuItem>
        )}
      </Menu>

      {/* PAGINATION */}
<Box
  sx={{
    borderTop: "1px solid #E3ECEF",
    flexShrink: 0,
    position: "sticky",
    bottom: 0,
    backgroundColor: "#FFFFFF",
    zIndex: 2,
  }}
>        <Paginator
          page={currentPage}
          totalPages={totalPages}
          totalRecord={totalRecords}
          defaultSize={currentPageSize}
          onPageChange={(_, p) => {
            setCurrentPage(p);
            onPageChange?.(p);
          }}
          onRecordsPerPageChange={(s) => {
            setCurrentPageSize(s);
            setCurrentPage(0);
            onPageSizeChange?.(s);
          }}
        />
      </Box>

      {/* REVIEW & SIGN DIALOG */}
      <ReviewSignDialog
        open={reviewDialogOpen}
        onClose={() => {
          setReviewDialogOpen(false);
          setReviewDocument(null);
        }}
        document={reviewDocument}
        onSign={onSign}
      />
    </Box>
  );
};

/* ================= STYLES ================= */

const headerSx = {
  fontWeight: 500,
  backgroundColor: "#F2F7FA",
  color: "#30353A",
  borderBottom: "1px solid #E3ECEF",
  fontSize: "13.5px",
  whiteSpace: "nowrap" as const,
  fontFamily: '"Helvetica Neue", Arial, sans-serif',
  height: "44px",
  padding: "8px 16px",
};

const cellSx = {
  fontSize: "14px",
  borderBottom: "1px solid #E3ECEF",
  padding: "10px 16px",
  verticalAlign: "middle" as const,
};

const uploadBtnSx = {
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
    "& svg": {
      color: "#1976D2 !important",
      fontSize: "16px !important",
    },
  },
};

export default DocumentsTable;
