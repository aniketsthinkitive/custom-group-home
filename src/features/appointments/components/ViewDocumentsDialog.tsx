import React, { useState, useEffect } from "react";
import {
  Grid,
  Typography,
  Box,
  Paper,
  Button,
  Tabs,
  Tab,
  IconButton,
  CircularProgress,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CustomDialog from "../../../components/custom-dialog/custom-dialog";
import Tooltip from "@mui/material/Tooltip";
import { usePermission } from "../../../hooks/usePermission";
import { isGuardianOrAgent } from "../../../utils/auth";

export interface ViewDocumentFile {
  id: string;
  file_url: string;
  original_filename?: string;
  file_size?: number;
  mime_type?: string;
  file_type?: string;
}

export interface ViewDocumentsDialogProps {
  open: boolean;
  onClose: () => void;
  files: ViewDocumentFile[];
  title?: string;
  initialIndex?: number;
  allowDownload?: boolean;
  /** When provided, a Delete button is shown to delete the currently viewed document */
  onDelete?: (file: ViewDocumentFile) => void;
  /** When provided, a Print button is shown to print the currently viewed document */
  onPrint?: (file: ViewDocumentFile) => void;
}

const formatFileSize = (bytes: number | undefined): string => {
  if (bytes == null || bytes === 0) return "0 B";
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  const unit = ["B", "KB", "MB", "GB"][i];
  return `${value % 1 === 0 ? value : value.toFixed(1)} ${unit}`;
};

const getFileIcon = (mimeType: string | undefined) => {
  const iconSize = { xs: "1.5rem", sm: "2rem" };
  const mt = mimeType?.toLowerCase() ?? "";
  if (mt.includes("pdf")) {
    return <PictureAsPdfIcon sx={{ fontSize: iconSize }} color="error" />;
  }
  if (mt.includes("image")) {
    return <ImageIcon sx={{ fontSize: iconSize }} color="primary" />;
  }
  if (mt.includes("audio")) {
    return <InsertDriveFileIcon sx={{ fontSize: iconSize }} color="success" />;
  }
  return <InsertDriveFileIcon sx={{ fontSize: iconSize }} color="action" />;
};

const ViewDocumentsDialog: React.FC<ViewDocumentsDialogProps> = ({
  open,
  onClose,
  files,
  title = "Document Viewer",
  initialIndex = 0,
  allowDownload = true,
  onDelete,
  onPrint,
}) => {
  const { hasPermission } = usePermission();
  // Guardian/Agent are portal roles that bypass the staff PermissionRoles
  // system, so their permission map has no documents.* keys. They are
  // allowed to download/print (the list shows these unconditionally), so
  // grant those here too. Delete stays staff-only (and the portal section
  // never passes onDelete anyway).
  const isPortalUser = isGuardianOrAgent();
  const canDeleteDocument = hasPermission("documents.delete");
  const canDownloadDocument = isPortalUser || hasPermission("documents.download");
  const canPrintDocument = isPortalUser || hasPermission("documents.print");
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [currentFileIndex, setCurrentFileIndex] = useState(initialIndex);
  // Blob URL for PDF preview — avoids black screen caused by server X-Frame-Options headers
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const allFiles = Array.isArray(files) ? files : [];
  const currentFile = allFiles.length > 0 ? allFiles[currentFileIndex] : null;

  useEffect(() => {
    setCurrentFileIndex((prev) => (prev >= allFiles.length ? Math.max(0, allFiles.length - 1) : prev));
  }, [allFiles.length, files]);

  useEffect(() => {
    if (open && allFiles.length) {
      setCurrentFileIndex(Math.min(initialIndex, allFiles.length - 1));
    }
  }, [open, initialIndex, allFiles.length]);

  useEffect(() => {
    if (currentFile?.mime_type?.toLowerCase().includes("image")) {
      setImageLoading(true);
    } else {
      setImageLoading(false);
    }
  }, [currentFile]);

  // Fetch PDF as blob to create a same-origin URL for the iframe.
  // Direct remote URLs (e.g. S3) get blocked by X-Frame-Options headers causing a black screen.
  // blob: URLs are same-origin and bypass that restriction.
  useEffect(() => {
    const isPdf = currentFile?.mime_type?.toLowerCase().includes("pdf");
    if (!open || !currentFile?.file_url || !isPdf) {
      setPdfBlobUrl((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }

    let cancelled = false;
    setPdfLoading(true);

    fetch(currentFile.file_url)
      .then((res) => res.blob())
      .then((blob) => {
        if (cancelled) return;
        const pdfBlob = blob.type === "application/pdf"
          ? blob
          : new Blob([blob], { type: "application/pdf" });
        setPdfBlobUrl(URL.createObjectURL(pdfBlob));
      })
      .catch((err) => {
        console.error("Failed to fetch PDF for preview:", err);
        if (!cancelled) setPdfBlobUrl(currentFile.file_url);
      })
      .finally(() => {
        if (!cancelled) setPdfLoading(false);
      });

    return () => {
      cancelled = true;
      setPdfBlobUrl((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [open, currentFile?.file_url, currentFile?.mime_type]);

  const handleNextFile = () => {
    if (currentFileIndex < allFiles.length - 1) {
      setCurrentFileIndex(currentFileIndex + 1);
      setImageLoading(true);
    }
  };

  const handlePrevFile = () => {
    if (currentFileIndex > 0) {
      setCurrentFileIndex(currentFileIndex - 1);
      setImageLoading(true);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentFileIndex(newValue);
    setImageLoading(true);
  };

  const getDownloadFilename = (): string => {
    const base = currentFile?.original_filename || currentFile?.id || "download";
    if (currentFile?.original_filename?.includes(".")) return base;
    const mt = (currentFile?.mime_type ?? "").toLowerCase();
    if (mt.includes("pdf")) return `${base}.pdf`;
    if (mt.includes("image/jpeg") || mt.includes("image/jpg")) return `${base}.jpg`;
    if (mt.includes("image/png")) return `${base}.png`;
    if (mt.includes("image/gif")) return `${base}.gif`;
    if (mt.includes("image/webp")) return `${base}.webp`;
    return base;
  };

  const handleDownload = async () => {
    if (!currentFile?.file_url) return;
    setLoading(true);
    try {
      const response = await fetch(currentFile.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = getDownloadFilename();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading document:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomDialog
      title={title}
      open={open}
      onClose={onClose}
      buttonName={[]}
      width="90%"
      height="auto"
      sx={{ "& .MuiDialog-paper": { maxWidth: 800, borderRadius: "10px" } }}
      padding="16px 24px"
    >
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ width: "100%", px: 0 }}>
        {/* File slider (tabs + chevrons) first */}
        {allFiles.length > 1 && (
          <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12 }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider", pb: 1.5, overflowX: "auto" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 } }}>
                <IconButton
                  onClick={handlePrevFile}
                  disabled={currentFileIndex === 0}
                  size="small"
                  sx={{ "& .MuiSvgIcon-root": { fontSize: { xs: "1.2rem", sm: "1.5rem" } } }}
                >
                  <ChevronLeftIcon />
                </IconButton>
                <Tabs
                  value={currentFileIndex}
                  onChange={handleTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    flexGrow: 1,
                    "& .MuiTab-root": {
                      minWidth: { xs: "60px", sm: "auto" },
                      fontSize: { xs: "0.7rem", sm: "0.875rem" },
                      padding: { xs: "8px 4px", sm: "12px 16px" },
                    },
                  }}
                >
                  {allFiles.map((file, index) => (
                    <Tab
                      key={file.id}
                      label={`File ${index + 1}`}
                      icon={getFileIcon(file.mime_type)}
                      iconPosition="start"
                      sx={{ "& .MuiSvgIcon-root": { fontSize: { xs: "1rem", sm: "1.5rem" } } }}
                    />
                  ))}
                </Tabs>
                <IconButton
                  onClick={handleNextFile}
                  disabled={currentFileIndex === allFiles.length - 1}
                  size="small"
                  sx={{ "& .MuiSvgIcon-root": { fontSize: { xs: "1.2rem", sm: "1.5rem" } } }}
                >
                  <ChevronRightIcon />
                </IconButton>
              </Box>
            </Box>
          </Grid>
        )}

        {/* File name after the slider */}
        {currentFile && (
          <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
              sx={{
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                wordWrap: "break-word",
                overflowWrap: "break-word",
              }}
            >
              {currentFile.original_filename && `File: ${currentFile.original_filename}`}
              {currentFile.mime_type && ` (${currentFile.mime_type})`}
              {currentFile.file_size != null && ` - ${formatFileSize(currentFile.file_size)}`}
            </Typography>
          </Grid>
        )}

        {loading ? (
          <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12 }}>
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress size={24} />
            </Box>
          </Grid>
        ) : currentFile ? (
          <>
            <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12 }}>
              <Paper
                elevation={2}
                sx={{
                  p: { xs: 1, sm: 2 },
                  minHeight: { xs: "250px", sm: "400px" },
                  maxHeight: { xs: "70vh", sm: "600px" },
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  justifyContent: "center",
                  overflow: "hidden",
                  position: "relative",
                  width: "100%",
                }}
              >
                {currentFile.mime_type?.toLowerCase().includes("image") ? (
                  <>
                    {imageLoading && (
                      <Box
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        position="absolute"
                        top={0}
                        left={0}
                        right={0}
                        bottom={0}
                        zIndex={1}
                      >
                        <CircularProgress />
                      </Box>
                    )}
                    <img
                      src={currentFile.file_url}
                      alt={currentFile.original_filename || "Document"}
                      onLoad={() => setImageLoading(false)}
                      onError={() => setImageLoading(false)}
                      style={{
                        maxWidth: "100%",
                        maxHeight: typeof window !== "undefined" && window.innerWidth < 600 ? "50vh" : "600px",
                        width: "100%",
                        height: "auto",
                        objectFit: "contain",
                        opacity: imageLoading ? 0 : 1,
                        transition: "opacity 0.3s ease-in-out",
                      }}
                    />
                  </>
                ) : currentFile.mime_type?.toLowerCase().includes("pdf") ? (
                  <Box sx={{ width: "100%", minWidth: 0, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <iframe
                      src={`${currentFile.file_url}#toolbar=0&navpanes=0`}
                      title={currentFile.original_filename || "PDF Document"}
                      style={{
                        border: "none",
                        width: "100%",
                        minHeight: "500px",
                        height: "100%",
                        flex: 1,
                      }}
                    />
                  </Box>
                ) : currentFile.mime_type === "video/mp4" ? (
                  <video
                    controls
                    width="100%"
                    style={{ maxHeight: "600px", borderRadius: "8px", backgroundColor: "#000" }}
                  >
                    <source src={currentFile.file_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : currentFile.mime_type === "audio/mpeg" || currentFile.mime_type === "audio/mp3" ? (
                  <audio controls style={{ borderRadius: "8px", width: "100%" }}>
                    <source src={currentFile.file_url} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                ) : (
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    p={{ xs: 2, sm: 3 }}
                    sx={{ width: "100%" }}
                  >
                    <Box sx={{ "& .MuiSvgIcon-root": { fontSize: { xs: "2rem", sm: "3rem" } } }}>
                      {getFileIcon(currentFile.mime_type)}
                    </Box>
                    <Typography variant="body1" mt={2} sx={{ fontSize: { xs: "0.875rem", sm: "1rem" }, textAlign: "center" }}>
                      This file type cannot be previewed directly.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, textAlign: "center" }}>
                      Please download to view the contents.
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12 }}>
              <Box
                display="flex"
                flexDirection={{ xs: "column", sm: "row" }}
                alignItems={{ xs: "stretch", sm: "center" }}
                gap={2}
                mt={2}
                sx={{ width: "100%" }}
              >
                <Box display="flex" gap={1} flexWrap="wrap" sx={{ flex: { xs: "none", sm: "0 0 auto" } }}>
                  {allowDownload &&
                    canDownloadDocument &&
                    currentFile.mime_type !== "video/mp4" &&
                    currentFile.mime_type !== "audio/mpeg" &&
                    currentFile.mime_type !== "audio/mp3" && (
                      <Button
                        variant="outlined"
                        startIcon={<FileDownloadIcon sx={{ fontSize: { xs: "18px", sm: "20px" } }} />}
                        onClick={handleDownload}
                        disabled={loading}
                        sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, padding: { xs: "4px 10px", sm: "6px 14px" } }}
                      >
                        Download
                      </Button>
                    )}
                  {onPrint && (
                    <Tooltip
                      title={!canPrintDocument ? "You don't have permission" : ""}
                      arrow
                      placement="top"
                      disableHoverListener={canPrintDocument}
                    >
                      <span style={{ display: "inline-block", cursor: !canPrintDocument ? "not-allowed" : "default" }}>
                        <Button
                          variant="outlined"
                          startIcon={<PrintOutlinedIcon sx={{ fontSize: { xs: "18px", sm: "20px" } }} />}
                          onClick={() => currentFile && onPrint(currentFile)}
                          disabled={!canPrintDocument}
                          sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, padding: { xs: "4px 10px", sm: "6px 14px" } }}
                        >
                          Print
                        </Button>
                      </span>
                    </Tooltip>
                  )}
                </Box>
                <Box
                  display="flex"
                  gap={1}
                  justifyContent="center"
                  sx={{ flex: { xs: "none", sm: 1 } }}
                >
                  {allFiles.length > 1 && (
                    <>
                      <Button
                        variant="outlined"
                        onClick={handlePrevFile}
                        disabled={currentFileIndex === 0}
                        sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, padding: { xs: "4px 10px", sm: "6px 14px" } }}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={handleNextFile}
                        disabled={currentFileIndex === allFiles.length - 1}
                        sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, padding: { xs: "4px 10px", sm: "6px 14px" } }}
                      >
                        Next
                      </Button>
                    </>
                  )}
                </Box>
                <Box sx={{ flex: { xs: "none", sm: "0 0 auto" }, display: "flex", gap: 1, justifyContent: { xs: "stretch", sm: "flex-end" }, flexWrap: "wrap" }}>
                  {onDelete && (
                    <Tooltip
                      title={!canDeleteDocument ? "You don't have permission" : ""}
                      arrow
                      placement="top"
                      disableHoverListener={canDeleteDocument}
                    >
                      <span style={{ display: "inline-block", cursor: !canDeleteDocument ? "not-allowed" : "default" }}>
                        <Button
                          variant="outlined"
                          startIcon={<DeleteOutlineIcon sx={{ fontSize: { xs: "18px", sm: "20px" } }} />}
                          onClick={() => currentFile && onDelete(currentFile)}
                          disabled={!canDeleteDocument}
                          sx={{
                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
                            padding: { xs: "8px 16px", sm: "10px 22px" },
                            minWidth: { sm: "auto" },
                            color: "#B51C1C",
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #f30a0a",
                            "&:hover": {
                              color: "#FFFFFF",
                              backgroundColor: "#be1616",
                              borderColor: "#9c1111",
                            },
                          }}
                        >
                          Delete
                        </Button>
                      </span>
                    </Tooltip>
                  )}
                  <Button
                    variant="outlined"
                    onClick={onClose}
                    sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, padding: { xs: "4px 10px", sm: "6px 14px" }, minWidth: { sm: "auto" } }}
                  >
                    Close
                  </Button>
                </Box>
              </Box>
            </Grid>
          </>
        ) : (
          <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12 }}>
            <Box display="flex" justifyContent="center" p={3}>
              <Typography color="text.secondary">No document available to display</Typography>
            </Box>
          </Grid>
        )}
      </Grid>
    </CustomDialog>
  );
};

export default ViewDocumentsDialog;
