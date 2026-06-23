import React, { useState, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  FormControlLabel,
  Radio,
} from "@mui/material";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import CustomDrawer from "../../../../components/custom-drawer/custom-drawer";
import CustomButton from "../../../../components/custom-buttons/custom-buttons";
import {
  SignatureCanvas,
  type SignatureCanvasRef,
} from "../../../../components/signature-canvas";
import { useAppSelector } from "../../../../store/hooks";
import type { User } from "../../../../sdk/types.gen";
import type { DocumentTableRow } from "./DocumentTableResident";

interface ReviewSignDialogProps {
  open: boolean;
  onClose: () => void;
  document: DocumentTableRow | null;
  onSign?: (documentId: number, signatureData: string) => void;
}

const ReviewSignDialog: React.FC<ReviewSignDialogProps> = ({
  open,
  onClose,
  document,
  onSign,
}) => {
  const authUser = useAppSelector((state) => state.auth.user);
  const userSignatureUrl = (authUser as User | null)?.signature_url || null;

  const [signatureMethod, setSignatureMethod] = useState<"DRAW" | "UPLOAD">("DRAW");
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState<string | null>(null);
  const [signatureFileError, setSignatureFileError] = useState<string | null>(null);
  // Track if user has cleared their existing signature to draw a new one
  const [existingSignatureCleared, setExistingSignatureCleared] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);

  const signatureCanvasRef = useRef<SignatureCanvasRef>(null);
  const signatureFileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Derived: show existing signature if user has one, is on DRAW method, and hasn't cleared it
  const showExisting = signatureMethod === "DRAW" && !!userSignatureUrl && !existingSignatureCleared;

  const resetState = useCallback(() => {
    setSignatureMethod("DRAW");
    setHasDrawnSignature(false);
    setSignatureFile(null);
    setSignaturePreviewUrl(null);
    setSignatureFileError(null);
    setExistingSignatureCleared(false);
    setCanvasKey((k) => k + 1);
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const handleMethodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value as "DRAW" | "UPLOAD";
    setSignatureMethod(value);
    if (value === "DRAW") {
      setSignatureFile(null);
      setSignaturePreviewUrl(null);
      setSignatureFileError(null);
      if (signatureFileInputRef.current) signatureFileInputRef.current.value = "";
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    } else {
      signatureCanvasRef.current?.clearCanvas();
      setHasDrawnSignature(false);
      setExistingSignatureCleared(true);
      setSignaturePreviewUrl(null);
    }
  };

  const handleClearSignature = () => {
    if (signatureMethod === "DRAW") {
      signatureCanvasRef.current?.clearCanvas();
      setHasDrawnSignature(false);
      setExistingSignatureCleared(true);
    } else {
      setSignatureFile(null);
      setSignaturePreviewUrl(null);
      setSignatureFileError(null);
      if (signatureFileInputRef.current) signatureFileInputRef.current.value = "";
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file format — only allow JPG, JPEG, PNG
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        setSignatureFileError("Unsupported file format. Please upload a JPG, JPEG, or PNG image.");
        setSignatureFile(null);
        setSignaturePreviewUrl(null);
        if (event.target) event.target.value = "";
        return;
      }

      setSignatureFileError(null);
      setSignatureFile(file);
      const objectUrl = URL.createObjectURL(file);
      setSignaturePreviewUrl(objectUrl);
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
      blobUrlRef.current = objectUrl;
    }
    if (event.target) event.target.value = "";
  };

  const handleSignatureChange = (hasSig: boolean) => {
    setHasDrawnSignature(hasSig);
  };

  const handleSave = () => {
    if (!document) return;

    // If showing the existing signature from the user profile, use that URL as the data
    if (showExisting && userSignatureUrl) {
      onSign?.(document.id, userSignatureUrl);
      handleClose();
      return;
    }

    if (signatureMethod === "DRAW") {
      const signatureData = signatureCanvasRef.current?.getSignatureData() ?? null;
      if (signatureData) {
        onSign?.(document.id, signatureData);
        handleClose();
      }
    } else if (signatureFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        onSign?.(document.id, base64);
        handleClose();
      };
      reader.readAsDataURL(signatureFile);
    }
  };

  const hasSignature =
    showExisting ||
    (signatureMethod === "DRAW" ? hasDrawnSignature : !!signatureFile);

  const fileUrl = document?.fileUrl;
  const isPdf =
    fileUrl?.toLowerCase().endsWith(".pdf") ||
    document?.uploadDocument?.toLowerCase().endsWith(".pdf");

  return (
    <CustomDrawer
      anchor="right"
      open={open}
      onClose={handleClose}
      title="Review & Sign Document"
      drawerWidth="50vw"
      drawerPadding="10px"
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* Scrollable content area */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            px: 3,
            pb: 2,
            "&::-webkit-scrollbar": { width: 6 },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#C4C4C4",
              borderRadius: 3,
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "transparent",
            },
          }}
        >
          {/* Document Name */}
          {document?.documentName && (
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 600,
                color: "#25272C",
                mb: 1.5,
              }}
            >
              {document.documentName}
            </Typography>
          )}

          {/* Document Preview */}
          <Box sx={{ mb: 3 }}>
            <Typography sx={sectionLabelSx}>
              Document Preview
            </Typography>
            <Box
              sx={{
                width: "100%",
                height: 800,
                borderRadius: "8px",
                border: "1px solid #E3ECEF",
                backgroundColor: "#F9FAFB",
                overflow: "hidden",
              }}
            >
              {fileUrl ? (
                isPdf ? (
                  <iframe
                    src={fileUrl}
                    title="Document Preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "auto",
                      p: 2,
                    }}
                  >
                    <Box
                      component="img"
                      src={fileUrl}
                      alt={document?.documentName || "Document"}
                      sx={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                      }}
                    />
                  </Box>
                )
              ) : (
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#9CA3AF",
                  }}
                >
                  <Typography sx={{ fontSize: 14 }}>
                    No document available for preview
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Signature Section */}
          <Box>
            <Typography sx={sectionLabelSx}>
              Select Signature Method
            </Typography>

            {/* Method Toggle */}
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <FormControlLabel
                control={
                  <Radio
                    name="signatureMethod"
                    checked={signatureMethod === "DRAW"}
                    onChange={handleMethodChange}
                    value="DRAW"
                    size="small"
                    sx={{
                      color: "#A9ACA9",
                      "&.Mui-checked": { color: "#0A2E45" },
                    }}
                  />
                }
                label={
                  <Typography sx={radioLabelSx}>
                    Draw
                  </Typography>
                }
              />
              <FormControlLabel
                control={
                  <Radio
                    name="signatureMethod"
                    checked={signatureMethod === "UPLOAD"}
                    onChange={handleMethodChange}
                    value="UPLOAD"
                    size="small"
                    sx={{
                      color: "#A9ACA9",
                      "&.Mui-checked": { color: "#0A2E45" },
                    }}
                  />
                }
                label={
                  <Typography sx={radioLabelSx}>
                    Upload
                  </Typography>
                }
              />
            </Box>

            {/* Draw Signature */}
            {signatureMethod === "DRAW" && (
              <Box
                sx={{
                  backgroundColor: "#FBFFF7",
                  border: "1px solid #EFFFE3",
                  borderRadius: "8px",
                  p: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1.5,
                  }}
                >
                  <Typography sx={sectionLabelSx}>
                    {showExisting
                      ? "Current signature (click Clear to draw a new one)"
                      : "Use your mouse, touchpad, or touchscreen to draw your signature"}
                  </Typography>
                  <CustomButton
                    variant="secondary"
                    size="sm"
                    onClick={handleClearSignature}
                    disabled={!hasDrawnSignature && !showExisting}
                  >
                    Clear
                  </CustomButton>
                </Box>
                <Box
                  sx={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E7E9EB",
                    borderRadius: "6px",
                    overflow: "hidden",
                    minHeight: 150,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {showExisting ? (
                    <Box
                      component="img"
                      src={userSignatureUrl}
                      alt="Current signature"
                      sx={{
                        maxWidth: "100%",
                        width: "100%",
                        height: 150,
                        objectFit: "contain",
                        display: "block",
                      }}
                    />
                  ) : (
                    <SignatureCanvas
                      key={canvasKey}
                      ref={signatureCanvasRef}
                      width={800}
                      height={150}
                      backgroundColor="#FFFFFF"
                      strokeColor="#000000"
                      strokeWidth={2}
                      onSignatureChange={handleSignatureChange}
                    />
                  )}
                </Box>
              </Box>
            )}

            {/* Upload Signature */}
            {signatureMethod === "UPLOAD" && (
              <Box
                sx={{
                  backgroundColor: "#FBFFF7",
                  border: "1px solid #EFFFE3",
                  borderRadius: "8px",
                  p: 2,
                }}
              >
                <input
                  ref={signatureFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1.5,
                  }}
                >
                  <Typography sx={sectionLabelSx}>
                    Upload your signature image
                  </Typography>
                  <CustomButton
                    variant="secondary"
                    size="sm"
                    onClick={handleClearSignature}
                    disabled={!signatureFile}
                  >
                    Clear
                  </CustomButton>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 120,
                    p: 3,
                    backgroundColor: "#FFFFFF",
                    border: "1px dashed #D1D5DB",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "border-color 0.2s, background-color 0.2s",
                    "&:hover": {
                      backgroundColor: "#FAFAFA",
                      borderColor: "#9CA3AF",
                    },
                  }}
                  onClick={() => signatureFileInputRef.current?.click()}
                >
                  {signatureFile && signaturePreviewUrl ? (
                    <>
                      <Box
                        component="img"
                        src={signaturePreviewUrl}
                        alt="Uploaded signature"
                        sx={{
                          maxWidth: "100%",
                          height: 120,
                          objectFit: "contain",
                          display: "block",
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: "12px",
                          color: "#757775",
                          fontFamily: '"Helvetica Neue", Arial, sans-serif',
                          mt: 1,
                        }}
                      >
                        {signatureFile.name} — click to replace
                      </Typography>
                    </>
                  ) : (
                    <>
                      <CloudUploadOutlinedIcon
                        sx={{ fontSize: 32, color: "#9CA3AF", mb: 1 }}
                      />
                      <Typography
                        sx={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: "#374151",
                        }}
                      >
                        Click to upload signature
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 12,
                          color: "#9CA3AF",
                          mt: 0.5,
                        }}
                      >
                        PNG, JPG up to 5MB
                      </Typography>
                    </>
                  )}
                </Box>
                {signatureFileError && (
                  <Typography
                    sx={{
                      fontSize: 13,
                      color: "#D32F2F",
                      mt: 1,
                    }}
                  >
                    {signatureFileError}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Box>

        {/* Footer Actions - pinned at bottom */}
        <Box
          sx={{
            flexShrink: 0,
            px: 3,
            py: 2,
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            borderTop: "1px solid #E5E7EB",
            backgroundColor: "#fff",
          }}
        >
          <CustomButton variant="secondary" onClick={handleClose}>
            Cancel
          </CustomButton>
          <CustomButton
            variant="primary"
            onClick={handleSave}
            disabled={!hasSignature}
          >
            Sign Document
          </CustomButton>
        </Box>
      </Box>
    </CustomDrawer>
  );
};

/* ================= STYLES ================= */

const sectionLabelSx = {
  fontSize: "12px",
  fontWeight: 500,
  color: "#757775",
  fontFamily: '"Helvetica Neue", Arial, sans-serif',
  lineHeight: 1.6,
  mb: 1,
};

const radioLabelSx = {
  fontSize: "14px",
  fontWeight: 400,
  color: "#2C2D2C",
  fontFamily: '"Helvetica Neue", Arial, sans-serif',
};

export default ReviewSignDialog;
