import React, { useState, useRef, useEffect, useCallback } from "react";
import { Grid, Typography, Box, FormControlLabel, Radio } from "@mui/material";
import {
  type Control,
  Controller,
  type UseFormSetValue,
  type UseFormWatch,
  type FieldValues,
} from "react-hook-form";
import CustomLabel from "../../../../../../components/custom-label/custom-label";
import CustomInput from "../../../../../../components/custom-input/custom-input";
import CustomTextArea from "../../../../../../components/custom-text-area/custom-textarea";
import CustomButton from "../../../../../../components/custom-buttons/custom-buttons";
import DatePickerField from "../../../../../../components/date-picker-field/date-picker-field";
import {
  SignatureCanvas,
  type SignatureCanvasRef,
} from "../../../../../../components/signature-canvas";
import dayjs from "dayjs";

interface Section6Props {
  control: Control<FieldValues>;
  watch: UseFormWatch<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
  mode?: "new" | "draft" | "view";
  isStaffPortal?: boolean;
}

const fontFamily = '"Helvetica Neue", Arial, sans-serif';

/* ── Reusable hook for a single signature field ── */
function useSignature(
  fieldName: string,
  setValue: UseFormSetValue<FieldValues>,
  watchValue: string | undefined,
  isViewMode: boolean,
  watchMethodValue?: string,
) {
  const [method, setMethod] = useState<"DRAW" | "UPLOAD">("DRAW");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hadExistingFromApi, setHadExistingFromApi] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);
  const canvasRef = useRef<SignatureCanvasRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [userInteracted, setUserInteracted] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Detect pre-existing signature from API
  const isApiValue =
    watchValue &&
    (watchValue.startsWith("data:image") || watchValue.startsWith("http"));

  if (!hadExistingFromApi && !userInteracted && isApiValue) {
    setPreviewUrl(watchValue);
    setHadExistingFromApi(true);
    if (watchMethodValue === "UPLOAD") {
      setMethod("UPLOAD");
    }
  }

  const clearFormValue = useCallback(
    () => setValue(fieldName, ""),
    [fieldName, setValue]
  );

  const handleMethodChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isViewMode) return;
      setUserInteracted(true);
      setFileError(null);
      const value = e.target.value as "DRAW" | "UPLOAD";
      setMethod(value);
      if (value === "DRAW") {
        setUploadedFile(null);
        setPreviewUrl(null);
        setHadExistingFromApi(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        canvasRef.current?.clearCanvas();
        setHasDrawn(false);
        setPreviewUrl(null);
        setHadExistingFromApi(false);
      }
      clearFormValue();
    },
    [isViewMode, clearFormValue]
  );

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (isViewMode) return;
      setUserInteracted(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        setFileError("Unsupported file format. Please upload a JPG, JPEG, or PNG image.");
        if (event.target) event.target.value = "";
        return;
      }
      setFileError(null);

      if (method !== "UPLOAD") setMethod("UPLOAD");

      setUploadedFile(file);
      setHadExistingFromApi(false);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      if (blobUrlRef.current?.startsWith("blob:"))
        URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = objectUrl;

      const reader = new FileReader();
      reader.onloadend = () => {
        setValue(fieldName, reader.result as string);
        setValue(`${fieldName}Method`, "UPLOAD");
      };
      reader.readAsDataURL(file);

      if (event.target) event.target.value = "";
    },
    [isViewMode, method, fieldName, setValue]
  );

  const handleClear = useCallback(() => {
    if (isViewMode) return;
    setUserInteracted(true);
    setFileError(null);
    if (method === "DRAW") {
      canvasRef.current?.clearCanvas();
      setHasDrawn(false);
      setHadExistingFromApi(false);
      setCanvasKey((k) => k + 1);
    } else {
      setUploadedFile(null);
      setHadExistingFromApi(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    setPreviewUrl(null);
    if (blobUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    clearFormValue();
  }, [isViewMode, method, clearFormValue]);

  const handleSignatureChange = useCallback((hasSig: boolean) => {
    if (hasSig) setUserInteracted(true);
    setHasDrawn(hasSig);
  }, []);

  // Sync drawn signature to form value on each stroke end (mouseUp/touchEnd)
  const handleDrawEnd = useCallback(() => {
    if (method !== "DRAW" || !canvasRef.current || hadExistingFromApi || isViewMode) return;
    const data = canvasRef.current.getSignatureData();
    if (data) {
      setValue(fieldName, data);
      setValue(`${fieldName}Method`, "DRAW");
    }
  }, [method, hadExistingFromApi, isViewMode, fieldName, setValue]);

  // Backup effect: detect prefilled signature from API/draft
  // (covers async setValue from parent that the render-time check may miss)
  useEffect(() => {
    if (hadExistingFromApi || userInteracted) return;
    if (
      watchValue &&
      (watchValue.startsWith("data:image") || watchValue.startsWith("http"))
    ) {
      setPreviewUrl(watchValue);
      setHadExistingFromApi(true);
      if (watchMethodValue === "UPLOAD") {
        setMethod("UPLOAD");
      }
    }
  }, [watchValue, hadExistingFromApi, userInteracted, watchMethodValue]);

  // Clear form value when signature is cleared
  useEffect(() => {
    if (method !== "DRAW" || hadExistingFromApi) return;
    // Don't clear if the form already holds a valid signature (e.g. from prefill)
    const hasValidSignature =
      watchValue &&
      (watchValue.startsWith("data:image") || watchValue.startsWith("http"));
    if (!hasDrawn && !hasValidSignature) {
      setValue(fieldName, "");
    }
  }, [hasDrawn, method, fieldName, setValue, hadExistingFromApi, watchValue]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  return {
    method,
    uploadedFile,
    hasDrawn,
    previewUrl,
    hadExistingFromApi,
    canvasKey,
    canvasRef,
    fileInputRef,
    fileError,
    handleMethodChange,
    handleFileUpload,
    handleClear,
    handleSignatureChange,
    handleDrawEnd,
  };
}

/* ── Shared styles ── */
const radioSx = { color: "#A9ACA9", "&.Mui-checked": { color: "#0A2E45" } };
const labelSx = {
  fontSize: "12px",
  fontWeight: 500,
  color: "#757775",
  fontFamily,
  lineHeight: 1.6,
};
const radioLabelSx = {
  fontSize: "14px",
  fontWeight: 400,
  color: "#2C2D2C",
  fontFamily,
};

const sigContainerSx = {
  backgroundColor: "#FBFFF7",
  border: "1px solid #EFFFE3",
  borderRadius: "4px",
  padding: "12px 16px",
};

const headerRowSx = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "12px",
};

const canvasWrapSx = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #E7E9EB",
  borderRadius: "4px",
  padding: "16px",
  minHeight: 120,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const uploadAreaSx = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  padding: "16px",
  backgroundColor: "#FFFFFF",
  border: "1px solid #E7E9EB",
  borderRadius: "4px",
  cursor: "pointer",
  "&:hover": { backgroundColor: "#FAFAFA" },
};

const dashedInputSx = {
  "& .MuiOutlinedInput-root": {
    border: "none",
    borderBottom: "1px dashed #1F2A37",
    borderRadius: 0,
    backgroundColor: "transparent",
    boxShadow: "none",
    fontSize: "14px",
    color: "#1F2A37",
    padding: 0,
    "& fieldset": { border: "none" },
    "&:hover fieldset": { border: "none" },
    "&.Mui-focused fieldset": {
      border: "none",
      borderBottom: "2px dashed #0A2E45",
    },
  },
  "& .MuiOutlinedInput-input": {
    padding: "0 4px",
    fontSize: "14px",
  },
};

/* ── Signature block sub-component ── */
interface SignatureBlockProps {
  label: string;
  signatureFieldName: string;
  setValue: UseFormSetValue<FieldValues>;
  watchValue: string | undefined;
  watchMethodValue?: string;
  isViewMode: boolean;
  lockedMessage?: string;
  isRequired?: boolean;
}

const SignatureBlock: React.FC<SignatureBlockProps> = ({
  label,
  signatureFieldName,
  setValue,
  watchValue,
  watchMethodValue,
  isViewMode,
  lockedMessage,
  isRequired,
}) => {
  const {
    method,
    uploadedFile,
    hasDrawn,
    previewUrl,
    hadExistingFromApi,
    canvasKey,
    canvasRef,
    fileInputRef,
    fileError,
    handleMethodChange,
    handleFileUpload,
    handleClear,
    handleSignatureChange,
    handleDrawEnd,
  } = useSignature(signatureFieldName, setValue, watchValue, isViewMode, watchMethodValue);

  if (lockedMessage) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <CustomLabel label={label} isRequired={isRequired} />
        {previewUrl && hadExistingFromApi ? (
          <Box sx={{ ...canvasWrapSx, mb: 2 }}>
            <Box
              component="img"
              src={previewUrl}
              alt="Existing signature"
              sx={{
                maxWidth: "100%",
                width: "100%",
                height: 120,
                objectFit: "contain",
                display: "block",
              }}
            />
          </Box>
        ) : (
          <Box
            sx={{
              backgroundColor: "#F5F7FA",
              border: "1px dashed #B0BEC5",
              borderRadius: "8px",
              padding: "24px 16px",
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                fontSize: "14px",
                color: "#757775",
                fontFamily,
              }}
            >
              {lockedMessage}
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <CustomLabel label={label} isRequired={isRequired} />

      {/* Select Signature Method */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography sx={{ ...labelSx, mb: 0 }}>
          Select Signature Method
        </Typography>
        <Box sx={{ display: "flex", gap: "16px" }}>
          <FormControlLabel
            control={
              <Radio
                name={`${signatureFieldName}-method`}
                checked={method === "DRAW"}
                onChange={handleMethodChange}
                value="DRAW"
                disabled={isViewMode}
                sx={radioSx}
              />
            }
            label={<Typography sx={radioLabelSx}>Draw</Typography>}
          />
          <FormControlLabel
            control={
              <Radio
                name={`${signatureFieldName}-method`}
                checked={method === "UPLOAD"}
                onChange={handleMethodChange}
                value="UPLOAD"
                disabled={isViewMode}
                sx={radioSx}
              />
            }
            label={<Typography sx={radioLabelSx}>Upload</Typography>}
          />
        </Box>
      </Box>

      {/* Draw Mode */}
      {method === "DRAW" && (
        <Box sx={sigContainerSx}>
          <Box sx={headerRowSx}>
            <Typography sx={labelSx}>
              {previewUrl && hadExistingFromApi
                ? "Current signature (click Clear to draw a new one)"
                : "Use your mouse, touchpad, or touchscreen to draw your signature"}
            </Typography>
            <CustomButton
              variant="secondary"
              size="sm"
              onClick={handleClear}
              disabled={isViewMode || (!hasDrawn && !hadExistingFromApi)}
            >
              Clear
            </CustomButton>
          </Box>
          <Box sx={canvasWrapSx}>
            {previewUrl && hadExistingFromApi ? (
              <Box
                component="img"
                src={previewUrl}
                alt="Current signature"
                sx={{
                  maxWidth: "100%",
                  width: "100%",
                  height: 120,
                  objectFit: "contain",
                  display: "block",
                }}
              />
            ) : (
              <SignatureCanvas
                key={`canvas-${canvasKey}`}
                ref={canvasRef}
                width={1000}
                height={120}
                backgroundColor="#FFFFFF"
                strokeColor="#000000"
                strokeWidth={2}
                disabled={isViewMode}
                onSignatureChange={handleSignatureChange}
                  onDrawEnd={handleDrawEnd}
              />
            )}
          </Box>
        </Box>
      )}

      {/* Upload Mode */}
      {method === "UPLOAD" && (
        <Box
          sx={{
            ...sigContainerSx,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleFileUpload}
            style={{ display: "none" }}
            disabled={isViewMode}
          />
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography sx={labelSx}>Upload your signature file</Typography>
            <CustomButton
              variant="secondary"
              size="sm"
              onClick={handleClear}
              disabled={isViewMode || (!uploadedFile && !(hadExistingFromApi && previewUrl))}
            >
              Clear
            </CustomButton>
          </Box>
          <Box
            sx={uploadAreaSx}
            onClick={() => !isViewMode && fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <>
                <Box
                  component="img"
                  src={previewUrl}
                  alt="Uploaded signature"
                  sx={{
                    maxWidth: "100%",
                    height: 120,
                    objectFit: "contain",
                    display: "block",
                    mx: "auto",
                  }}
                />
                {!isViewMode && (
                  <Typography
                    sx={{
                      fontSize: "12px",
                      color: "#757775",
                      fontFamily,
                      textAlign: "center",
                    }}
                  >
                    {uploadedFile
                      ? `${uploadedFile.name} — click to replace`
                      : "Click to replace signature file"}
                  </Typography>
                )}
              </>
            ) : (
              <Typography
                sx={{
                  fontSize: "14px",
                  color: "#757775",
                  fontFamily,
                  textAlign: "center",
                }}
              >
                Click to upload signature file
              </Typography>
            )}
          </Box>
          {fileError && (
            <Typography sx={{ color: "#DC2626", fontSize: "12px", mt: 0.5 }}>
              {fileError}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

/* ── Main component ── */
const Section6Signature: React.FC<Section6Props> = ({
  control,
  watch,
  setValue,
  mode,
  isStaffPortal = true,
}) => {
  const isViewMode = mode === "view";

  const signatureValue = watch("signature");
  const thirdPartySignatureValue = watch("thirdPartySignature");
  const signatureMethodValue = watch("signatureMethod");
  const thirdPartySignatureMethodValue = watch("thirdPartySignatureMethod");

  return (
    <Grid container spacing={2}>
      {/* Section Title */}
      <Grid size={{ xs: 12 }}>
        <Typography
          sx={{ fontSize: "16px", fontWeight: 700, color: "#1F2A37", mb: 1 }}
        >
          Section VI – Signature
        </Typography>
      </Grid>

      {/* Main Signature Card */}
      <Grid size={{ xs: 12 }}>
        <Grid
          container
          sx={{
            border: "1px solid #E3ECEF",
            borderRadius: "8px",
            p: 3,
            boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.08)",
          }}
        >
          {/* Date and Print Name Row */}
          <Grid size={{ xs: 12 }} sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="signatureDate"
                  control={control}
                  render={({ field }) => (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                      }}
                    >
                      <CustomLabel label="Date:" />
                      <DatePickerField
                        value={field.value ? dayjs(field.value) : dayjs()}
                        onChange={(date) =>
                          field.onChange(date ? date.toDate() : null)
                        }
                        disabled={isViewMode}
                      />
                    </Box>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="printName"
                  control={control}
                  render={({ field }) => (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                      }}
                    >
                      <CustomLabel label="Print your name:" />
                      <Box sx={dashedInputSx}>
                        <CustomInput
                          placeholder=""
                          name="printName"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          bgWhite
                          disableField={isViewMode}
                        />
                      </Box>
                    </Box>
                  )}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Signature */}
          <Grid size={{ xs: 12 }}>
            <SignatureBlock
              label="Signature:"
              signatureFieldName="signature"
              setValue={setValue}
              watchValue={signatureValue}
              watchMethodValue={signatureMethodValue}
              isViewMode={isViewMode}
              isRequired
            />
          </Grid>
        </Grid>
      </Grid>

      {/* Third-Party Information Card */}
      <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
        <Grid
          container
          sx={{
            border: "1px solid #E3ECEF",
            borderRadius: "8px",
            p: 3,
            boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.08)",
          }}
        >
          {/* Instructions */}
          <Grid size={{ xs: 12 }} sx={{ mb: 2 }}>
            <Typography
              sx={{ fontSize: "14px", color: "#1F2A37", lineHeight: "1.6" }}
            >
              If this form is being completed by a person with legal authority
              to act an individual's behalf, such as a parent or legal guardian
              of a minor or health care agent, please complete the following
              information:
            </Typography>
          </Grid>

          {/* Name of person completing this form */}
          <Grid size={{ xs: 12 }} sx={{ mb: 3 }}>
            <Controller
              name="thirdPartyName"
              control={control}
              render={({ field }) => (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                  }}
                >
                  <CustomLabel label="Name of person completing this form:" />
                  <Box sx={dashedInputSx}>
                    <CustomInput
                      placeholder=""
                      name="thirdPartyName"
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      bgWhite
                      disableField={isViewMode}
                    />
                  </Box>
                </Box>
              )}
            />
          </Grid>

          {/* Third-Party Signature */}
          <Grid size={{ xs: 12 }} sx={{ mb: 3 }}>
            <SignatureBlock
              label="Signature of person completing this form:"
              signatureFieldName="thirdPartySignature"
              setValue={setValue}
              watchValue={thirdPartySignatureValue}
              watchMethodValue={thirdPartySignatureMethodValue}
              isViewMode={isViewMode}
              lockedMessage={isStaffPortal && !isViewMode ? "This signature will be completed by the guardian/Area Agency after the form is shared." : undefined}
            />
          </Grid>

          {/* Legal authority description */}
          <Grid size={{ xs: 12 }}>
            <Grid container spacing={2} alignItems="flex-start">
              <Grid size={{ xs: 12, sm: 4 }}>
                <CustomLabel label="Describe below how this person has legal authority to sign this form:" />
                <Typography sx={{ fontSize: "14px", color: "#1F2A37", mt: 1 }}>
                  Legal guardian of
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <Controller
                  name="legalAuthorityDescription"
                  control={control}
                  render={({ field }) => (
                    <CustomTextArea
                      placeholder=""
                      name="legalAuthorityDescription"
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      minRow={3}
                      isDisabled={isViewMode}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Section6Signature;
