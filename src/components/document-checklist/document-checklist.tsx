import React, { useRef } from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
  IconButton,
  Typography,
  Chip,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';
import DescriptionIcon from '@mui/icons-material/Description';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CloseIcon from '@mui/icons-material/Close';
import CircularProgress from '@mui/material/CircularProgress';
import CustomButton from '../custom-buttons/custom-buttons';

/**
 * A single uploaded file attached to a document row.
 */
export interface MediaFileItem {
  mediaId: string | number;
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  fileSize?: number;
}

/**
 * Document item interface
 */
export interface DocumentItem {
  id: string | number;
  name: string;
  file?: File | null;
  /** @deprecated use mediaFiles */
  fileName?: string;
  /** @deprecated use mediaFiles */
  fileUrl?: string;
  /** All uploaded files for this row */
  mediaFiles?: MediaFileItem[];
}

/**
 * Props for DocumentChecklist component
 */
interface DocumentChecklistProps {
  /** Array of document items to display */
  documents: DocumentItem[];
  uploadingDocId?: string | number | null;
  /** mediaId of the file currently being deleted */
  deletingMediaId?: string | number | null;
  /** Callback when a file is uploaded for a row */
  onUpload?: (documentId: string | number, file: File) => void;
  /** Callback when view icon is clicked */
  onView?: (documentId: string | number) => void;
  /** Callback when print icon is clicked */
  onPrint?: (documentId: string | number) => void;
  /** Callback when × is clicked on an individual uploaded file */
  onDeleteFile?: (documentId: string | number, mediaId: string | number) => void;
  /** Whether to show serial number column (default: true) */
  showSerialNumber?: boolean;
  /** Text for upload button (default: 'Upload') */
  uploadButtonText?: string;
}

const DocumentChecklist: React.FC<DocumentChecklistProps> = ({
  documents,
  uploadingDocId,
  deletingMediaId,
  onUpload,
  onView,
  onPrint,
  onDeleteFile,
  showSerialNumber = true,
  uploadButtonText = 'Upload',
}) => {
  const fileInputsRef = useRef<Record<string | number, HTMLInputElement | null>>({});

  const handleFileChange = (documentId: string | number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onUpload) {
      onUpload(documentId, file);
    }
    // Reset so same file can be re-selected
    event.target.value = '';
  };

  const handleUploadClick = (documentId: string | number) => {
    const input = fileInputsRef.current[documentId];
    if (input) {
      input.click();
    }
  };

  const hasFile = (document: DocumentItem) => {
    return !!(document.file || document.fileName || document.fileUrl || document.mediaFiles?.length);
  };

  const truncateFileName = (fileName: string, maxLength: number = 20): string => {
    if (fileName.length <= maxLength) {
      return fileName;
    }
    return fileName.substring(0, maxLength) + '...';
  };

  return (
    <Table
      sx={{
        border: '1px solid #E3ECEF',
        borderCollapse: 'separate',
        borderRadius: '8px',
        overflow: 'hidden',
        tableLayout: 'fixed',
        width: '100%',
        height: "20px"
      }}
    >
      <TableHead>
        <TableRow>
          {showSerialNumber && (
            <TableCell
              sx={{
                fontWeight: 500,
                backgroundColor: '#f2f7fa',
                color: '#212121',
                borderBottom: '1px solid #E3ECEF',
                width: '80px',
                textAlign: "left",
                padding: '10px 8px',
                lineHeight: 1.2,
                fontSize: '14px',
              }}
            >
              Sr. no
            </TableCell>
          )}
          <TableCell
            sx={{
              fontWeight: 500,
              backgroundColor: '#f2f7fa',
              color: '#212121',
              borderBottom: '1px solid #E3ECEF',
              padding: '10px 8px',
              lineHeight: 1.2,
              fontSize: '14px',
            }}
          >
            Document Name
          </TableCell>
          <TableCell
            sx={{
              fontWeight: 500,
              backgroundColor: '#f2f7fa',
              color: '#212121',
              borderBottom: '1px solid #E3ECEF',
              width: '220px',
              minWidth: '220px',
              maxWidth: '220px',
              padding: '10px 8px',
              lineHeight: 1.2,
              fontSize: '14px',
            }}
          >
            Upload Document
          </TableCell>
          <TableCell
            sx={{
              fontWeight: 500,
              backgroundColor: '#f2f7fa',
              color: '#212121',
              borderBottom: '1px solid #E3ECEF',
              width: '90px',
              minWidth: '90px',
              maxWidth: '90px',
              textAlign: "center",
              padding: '10px 8px',
              lineHeight: 1.2,
              fontSize: '14px',
            }}
          >
            Action
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {documents.map((document, index) => {
          const isLastRow = index === documents.length - 1;
          const uploaded = document.mediaFiles ?? [];
          const hasUploadedFile = hasFile(document);

          return (
            <TableRow key={document.id}>
              {showSerialNumber && (
                <TableCell
                  sx={{
                    borderBottom: isLastRow ? 'none' : '1px solid #E3ECEF',
                    textAlign: "left",
                    width: '60px',
                    minWidth: '60px',
                    maxWidth: '60px',
                    padding: '8px 12px',
                    color: '#1f201f',
                    fontSize: '20px',
                  }}
                >
                  <Typography variant="body2" sx={{ color: "#212121", fontWeight: 500 }}>
                    {index + 1}
                  </Typography>
                </TableCell>
              )}

              {/* Document name */}
              <TableCell
                sx={{
                  borderBottom: isLastRow ? 'none' : '1px solid #E3ECEF',
                  padding: '8px 12px',
                }}
              >
                <Typography variant="body2" sx={{ color: "#212121", fontWeight: 500 }}>
                  {document.name}
                </Typography>
              </TableCell>

              {/* Upload column */}
              <TableCell
                sx={{
                  borderBottom: isLastRow ? 'none' : '1px solid #E3ECEF',
                  width: '220px',
                  minWidth: '220px',
                  maxWidth: '220px',
                  padding: '8px 12px',
                  verticalAlign: 'middle',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <input
                    type="file"
                    ref={(el) => { fileInputsRef.current[document.id] = el; }}
                    onChange={(e) => handleFileChange(document.id, e)}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                  />

                  {uploaded.length === 0 ? (
                    /* No files yet — show Upload text button */
                    <>
                      <CustomButton
                        variant="secondary"
                        size="sm"
                        icon={<ArrowUpwardIcon />}
                        iconPosition="left"
                        onClick={() => handleUploadClick(document.id)}
                        disabled={uploadingDocId === document.id}
                      >
                        {uploadButtonText}
                      </CustomButton>
                      {uploadingDocId === document.id && <CircularProgress size={16} />}
                    </>
                  ) : (
                    /* Files exist — show filename + chip + arrow icon */
                    <>
                      <DescriptionIcon sx={{ color: '#6a6b6a', fontSize: '18px', flexShrink: 0 }} />
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#212121',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '100px',
                          flexShrink: 1,
                        }}
                        title={uploaded[0].fileName}
                      >
                        {truncateFileName(uploaded[0].fileName, 14)}
                      </Typography>
                      {/* × delete for first file */}
                      {deletingMediaId === uploaded[0].mediaId ? (
                        <CircularProgress size={12} sx={{ flexShrink: 0 }} />
                      ) : (
                        <IconButton
                          size="small"
                          onClick={() => onDeleteFile?.(document.id, uploaded[0].mediaId)}
                          disabled={deletingMediaId != null}
                          sx={{ p: 0.25, flexShrink: 0, color: '#757775', '&:hover': { color: '#d32f2f' } }}
                        >
                          <CloseIcon sx={{ fontSize: '13px' }} />
                        </IconButton>
                      )}
                      {/* Count chip when more than 1 file */}
                      {uploaded.length > 1 && (
                        <Chip
                          label={`${uploaded.length} files`}
                          size="small"
                          sx={{
                            height: '20px',
                            fontSize: '11px',
                            backgroundColor: '#E3F0FB',
                            color: '#1565c0',
                            flexShrink: 0,
                            '& .MuiChip-label': { px: 0.75 },
                          }}
                        />
                      )}
                      {/* Arrow icon for adding more */}
                      {uploadingDocId === document.id ? (
                        <CircularProgress size={16} sx={{ flexShrink: 0 }} />
                      ) : (
                        <IconButton
                          size="small"
                          onClick={() => handleUploadClick(document.id)}
                          sx={{ p: 0.5, flexShrink: 0, color: '#757775', '&:hover': { color: '#0A2E45' } }}
                        >
                          <ArrowUpwardIcon sx={{ fontSize: '18px' }} />
                        </IconButton>
                      )}
                    </>
                  )}
                </Box>
              </TableCell>

              {/* Action column — View and Print only */}
              <TableCell
                sx={{
                  borderBottom: isLastRow ? 'none' : '1px solid #E3ECEF',
                  width: '90px',
                  minWidth: '90px',
                  maxWidth: '90px',
                  padding: '8px 12px',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => onView?.(document.id)}
                    disabled={!hasUploadedFile}
                    sx={{
                      color: hasUploadedFile ? '#757775' : '#E3ECEF',
                      '&:hover': hasUploadedFile ? { color: '#0A2E45', backgroundColor: '#f5f5f5' } : {},
                    }}
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => onPrint?.(document.id)}
                    disabled={!hasUploadedFile}
                    sx={{
                      color: hasUploadedFile ? '#757775' : '#E3ECEF',
                      '&:hover': hasUploadedFile ? { color: '#0A2E45', backgroundColor: '#f5f5f5' } : {},
                    }}
                  >
                    <PrintIcon fontSize="small" />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default DocumentChecklist;
