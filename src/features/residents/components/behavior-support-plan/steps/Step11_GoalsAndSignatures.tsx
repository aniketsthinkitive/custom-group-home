import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Grid, FormControlLabel, Radio, Box, Typography } from '@mui/material';
import { Delete } from '@mui/icons-material';
import { Control, Controller, useWatch, type UseFormSetValue, type FieldValues } from 'react-hook-form';
import CustomInput from '../../../../../components/custom-input/custom-input';
import CustomLabel from '../../../../../components/custom-label/custom-label';
import CustomTextArea from '../../../../../components/custom-text-area/custom-textarea';
import CustomButton from '../../../../../components/custom-buttons/custom-buttons';
import { type SignatureCanvasRef } from '../../../../../components/signature-canvas';
import { SignatureCanvas } from '../../../../../components/signature-canvas';

interface Step11Props {
  control: Control<any>;
  setValue: UseFormSetValue<FieldValues>;
  mode?: "new" | "draft" | "view";
}

interface Goal {
  id: string;
  value: string;
}

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

  const isApiValue = watchValue && (watchValue.startsWith("data:image") || watchValue.startsWith("http"));
  if (!hadExistingFromApi && !userInteracted && isApiValue) {
    setPreviewUrl(watchValue);
    setHadExistingFromApi(true);
    if (watchMethodValue === "UPLOAD") {
      setMethod("UPLOAD");
    }
  }

  const clearFormValue = useCallback(() => setValue(fieldName, ""), [fieldName, setValue]);

  const handleMethodChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (isViewMode) return;
    setUserInteracted(true);
    setFileError(null);
    const value = e.target.value as "DRAW" | "UPLOAD";
    setMethod(value);
    if (value === "DRAW") {
      setUploadedFile(null); setPreviewUrl(null); setHadExistingFromApi(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      canvasRef.current?.clearCanvas(); setHasDrawn(false); setPreviewUrl(null); setHadExistingFromApi(false);
    }
    clearFormValue();
  }, [isViewMode, clearFormValue]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
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
    setUploadedFile(file); setHadExistingFromApi(false);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    if (blobUrlRef.current?.startsWith("blob:")) URL.revokeObjectURL(blobUrlRef.current);
    blobUrlRef.current = objectUrl;
    const reader = new FileReader();
    reader.onloadend = () => {
        setValue(fieldName, reader.result as string);
        setValue(`${fieldName}Method`, "UPLOAD");
      };
    reader.readAsDataURL(file);
    if (event.target) event.target.value = "";
  }, [isViewMode, method, fieldName, setValue]);

  const handleClear = useCallback(() => {
    if (isViewMode) return;
    setUserInteracted(true);
    setFileError(null);
    if (method === "DRAW") {
      canvasRef.current?.clearCanvas(); setHasDrawn(false); setHadExistingFromApi(false); setCanvasKey((k) => k + 1);
    } else {
      setUploadedFile(null);
      setHadExistingFromApi(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    setPreviewUrl(null);
    if (blobUrlRef.current?.startsWith("blob:")) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
    clearFormValue();
  }, [isViewMode, method, clearFormValue]);

  const handleSignatureChange = useCallback((hasSig: boolean) => { if (hasSig) setUserInteracted(true); setHasDrawn(hasSig); }, []);

  const handleDrawEnd = useCallback(() => {
    if (method !== "DRAW" || !canvasRef.current || hadExistingFromApi || isViewMode) return;
    const data = canvasRef.current.getSignatureData();
    if (data) {
      setValue(fieldName, data);
      setValue(`${fieldName}Method`, "DRAW");
    }
  }, [method, hadExistingFromApi, isViewMode, fieldName, setValue]);

  useEffect(() => {
    if (hadExistingFromApi || userInteracted) return;
    if (watchValue && (watchValue.startsWith("data:image") || watchValue.startsWith("http"))) {
      setPreviewUrl(watchValue); setHadExistingFromApi(true);
      if (watchMethodValue === "UPLOAD") {
        setMethod("UPLOAD");
      }
    }
  }, [watchValue, hadExistingFromApi, userInteracted, watchMethodValue]);

  useEffect(() => {
    if (method !== "DRAW" || hadExistingFromApi) return;
    const hasValidSignature = watchValue && (watchValue.startsWith("data:image") || watchValue.startsWith("http"));
    if (!hasDrawn && !hasValidSignature) { setValue(fieldName, ""); }
  }, [hasDrawn, method, fieldName, setValue, hadExistingFromApi, watchValue]);

  useEffect(() => { return () => { if (blobUrlRef.current?.startsWith("blob:")) URL.revokeObjectURL(blobUrlRef.current); }; }, []);

  return { method, uploadedFile, hasDrawn, previewUrl, hadExistingFromApi, canvasKey, canvasRef, fileInputRef, fileError, handleMethodChange, handleFileUpload, handleClear, handleSignatureChange, handleDrawEnd };
}

const Step11_GoalsAndSignatures: React.FC<Step11Props> = ({ control, setValue, mode = "new" }) => {
  const [goals, setGoals] = useState<Goal[]>([{ id: '1', value: '' }]);

  const signatureValue = useWatch({ control, name: 'signature' });
  const signatureMethodValue = useWatch({ control, name: 'signatureMethod' });
  const sig = useSignature('signature', setValue, signatureValue, mode === 'view', signatureMethodValue);

  const addGoal = () => {
    setGoals([...goals, { id: Date.now().toString(), value: '' }]);
  };

  const removeGoal = (id: string) => {
    if (goals.length > 1) {
      setGoals(goals.filter(goal => goal.id !== id));
    }
  };

  const updateGoal = (id: string, value: string) => {
    setGoals(goals.map(goal => goal.id === id ? { ...goal, value } : goal));
  };

  const renderSignatureSection = () => {
    // In view mode, show signature image if available
    if (mode === "view" && sig.previewUrl) {
      return (
        <Grid
          container
          sx={{
            marginTop: '8px',
            padding: '16px',
            border: '1px solid #E7E9EB',
            borderRadius: '4px',
            backgroundColor: '#FFFFFF',
          }}
        >
          <img
            src={sig.previewUrl}
            alt="Signature"
            style={{ maxWidth: '100%', maxHeight: '120px' }}
          />
        </Grid>
      );
    }

    return (
      <Grid
        container
        spacing={1}
        direction="column"
        sx={{
          marginTop: '4px',
        }}
      >
        <Grid size={{ xs: 12 }}>
          <Grid container spacing={1} direction="column">
            <Grid size={{ xs: 12 }}>
              <CustomLabel label="Select Signature Method" />
              <Grid container spacing={2} sx={{ marginTop: '8px' }}>
                <Grid>
                  <FormControlLabel
                    control={
                      <Radio
                        checked={sig.method === 'DRAW'}
                        onChange={sig.handleMethodChange}
                        value="DRAW"
                        disabled={mode === "view"}
                        sx={{
                          color: '#A9ACA9',
                          '&.Mui-checked': {
                            color: '#0A2E45',
                          },
                        }}
                      />
                    }
                    label={
                      <CustomLabel label="Draw" style={{ fontSize: '14px', fontWeight: 400, color: '#2C2D2C', margin: 0 }} />
                    }
                  />
                </Grid>
                <Grid>
                  <FormControlLabel
                    control={
                      <Radio
                        checked={sig.method === 'UPLOAD'}
                        onChange={sig.handleMethodChange}
                        value="UPLOAD"
                        disabled={mode === "view"}
                        sx={{
                          color: '#A9ACA9',
                          '&.Mui-checked': {
                            color: '#0A2E45',
                          },
                        }}
                      />
                    }
                    label={
                      <CustomLabel label="Upload" style={{ fontSize: '14px', fontWeight: 400, color: '#2C2D2C', margin: 0 }} />
                    }
                  />
                </Grid>
              </Grid>
            </Grid>

            {sig.method === 'DRAW' ? (
              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    backgroundColor: '#FBFFF7',
                    border: '1px solid #EFFFE3',
                    borderRadius: '4px',
                    padding: '12px 16px',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <CustomLabel
                      label={sig.previewUrl && sig.hadExistingFromApi
                        ? "Current signature (click Clear to draw a new one)"
                        : "Use your mouse, touchpad, or touchscreen to draw your signature"}
                      style={{ fontSize: '12px', fontWeight: 500, color: '#757775' }}
                    />
                    <CustomButton
                      variant="secondary"
                      size="sm"
                      onClick={sig.handleClear}
                      disabled={mode === "view" || (!sig.hasDrawn && !sig.hadExistingFromApi)}
                    >
                      Clear
                    </CustomButton>
                  </Box>
                  <Box sx={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E9EB', borderRadius: '4px', padding: '16px', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {sig.previewUrl && sig.hadExistingFromApi ? (
                      <Box component="img" src={sig.previewUrl} alt="Current signature"
                        sx={{ maxWidth: '100%', width: '100%', height: 120, objectFit: 'contain', display: 'block' }} />
                    ) : (
                      <SignatureCanvas
                        key={`canvas-${sig.canvasKey}`}
                        ref={sig.canvasRef}
                        width={800}
                        height={130}
                        backgroundColor="#FFFFFF"
                        strokeColor="#000000"
                        strokeWidth={2}
                        onSignatureChange={sig.handleSignatureChange}
                        onDrawEnd={sig.handleDrawEnd}
                      />
                    )}
                  </Box>
                </Box>
              </Grid>
            ) : (
              <Grid size={{ xs: 12 }}>
                <Grid
                  container
                  spacing={2}
                  direction="column"
                  sx={{
                    padding: '12px 16px',
                    backgroundColor: '#FBFFF7',
                    border: '1px solid #EFFFE3',
                    borderRadius: '4px',
                  }}
                >
                  <input
                    ref={sig.fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={sig.handleFileUpload}
                    style={{ display: 'none' }}
                    disabled={mode === "view"}
                  />
                  <Grid size={{ xs: 12 }}>
                    <Grid container spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <Grid>
                        <CustomLabel label="Upload your signature file" style={{ fontSize: '12px', fontWeight: 500, color: '#757775' }} />
                      </Grid>
                      <Grid>
                        <CustomButton
                          variant="secondary"
                          size="sm"
                          onClick={sig.handleClear}
                          disabled={mode === "view" || (!sig.uploadedFile && !sig.previewUrl)}
                        >
                          Clear
                        </CustomButton>
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Box
                      sx={{
                        padding: '16px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E7E9EB',
                        borderRadius: '4px',
                        cursor: mode === "view" ? 'not-allowed' : 'pointer',
                        minHeight: '80px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        ...(mode === "view" ? {
                          opacity: 0.6,
                          pointerEvents: 'none',
                        } : {
                          '&:hover': {
                            backgroundColor: '#FAFAFA',
                          },
                        }),
                      }}
                      onClick={() => mode !== "view" && sig.fileInputRef.current?.click()}
                    >
                      {sig.previewUrl ? (
                        <>
                          <Box
                            component="img"
                            src={sig.previewUrl}
                            alt="Uploaded signature"
                            sx={{ maxWidth: '100%', height: 120, objectFit: 'contain', display: 'block' }}
                          />
                          {mode !== "view" && (
                            <CustomLabel
                              label={sig.uploadedFile ? `${sig.uploadedFile.name} — click to replace` : 'Click to replace signature file'}
                              style={{ fontSize: '12px', color: '#757775', textAlign: 'center' }}
                            />
                          )}
                        </>
                      ) : (
                        <CustomLabel
                          label="Click to upload signature file"
                          style={{ fontSize: '14px', color: '#757775', textAlign: 'center' }}
                        />
                      )}
                    </Box>
                    {sig.fileError && (
                      <Typography sx={{ color: "#DC2626", fontSize: "12px", mt: 0.5 }}>
                        {sig.fileError}
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
    );
  };

  return (
    <Grid container spacing={2}>
      {/* Behavior Goals */}
      <Grid size={{ xs: 12 }}>
        <Grid
          container
          direction="column"
          spacing={1}
          sx={{
            border: '1px solid #E3ECEF',
            borderRadius: '8px',
            p: 2,
          }}
        >
          <Grid>
            <Grid container spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Grid>
                <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>
                  Behavior Goals
                </Typography>
              </Grid>
              <Grid>
                <CustomButton
                  variant="secondary"
                  size="sm"
                  onClick={addGoal}
                  disabled={mode === "view"}
                  sx={{
                    border: 'none',
                    '&:hover': {
                      border: 'none',
                    },
                    backgroundColor: '#FFFFFF',

                  }}
                >
                  + Add More
                </CustomButton>
              </Grid>
            </Grid>
          </Grid>

          <Grid container spacing={2} direction="column">
            {goals.map((goal, index) => (
              <Grid key={goal.id} size={{ xs: 12 }}>
                <Grid
                  container
                  direction="column"
                  spacing={1}
                  sx={{
                    mb: 2,
                  }}
                >
                  <Grid>
                    <Grid container spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between'}}>
                      <Grid>
                        <CustomLabel
                          label={`Goal ${index + 1}`}
                          style={{ fontSize: '14px', fontWeight: 600 }}
                        />
                      </Grid>
                      <Grid>
                        <CustomButton
                          variant="secondary"
                          size="sm"
                          onClick={() => removeGoal(goal.id)}
                          sx={{
                            minWidth: 'auto',
                            padding: '4px 8px',
                            border: 'none',
                            '&:hover': {
                              border: 'none',
                            },
                            backgroundColor: '#FFFFFF'
                          }}
                          disabled={mode === "view"}
                        >
                          <Delete sx={{ fontSize: '18px', color: mode === "view" ? '#9CA3AF' : '#DC2626'}} />
                        </CustomButton>
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid>
                    <Controller
                      name={`goal_${goal.id}`}
                      control={control}
                      render={({ field }) => (
                        <CustomTextArea
                          name={`goal_${goal.id}`}
                          placeholder="Enter"
                          value={goal.value}
                          onChange={(e) => {
                            updateGoal(goal.id, e.target.value);
                            field.onChange(e.target.value);
                          }}
                          minRow={4}
                          maxRow={4}
                          isDisabled={mode === "view"}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      {/* Behavior Analyst Information */}
      <Grid size={{ xs: 12 }}>
        <Grid
          container
          direction="column"
          // spacing={1}
          sx={{
            border: '1px solid #E3ECEF',
            borderRadius: '8px',
            p: 2,
            mt: 2,
            mb: 2,
          }}
        >
          <Grid>
            <Typography sx={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px' }}>
              Behavior Analyst Information
            </Typography>
          </Grid>
          <Grid>
            <Grid container direction="column" spacing={0.5}>
              <Grid>
                <CustomLabel
                  label="Behavior Analyst Name"
                  style={{ fontSize: '14px', marginBottom: '6px' }}
                />
              </Grid>
              <Grid>
                <Controller
                  name="behaviorAnalystName"
                  control={control}
                  render={({ field }) => (
                    <CustomInput
                      placeholder="Enter"
                      name="behaviorAnalystName"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      bgWhite
                      disableField={mode === "view"}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid>
            <Grid container direction="column" spacing={0.5}>
              <Grid>
                <Typography sx={{ fontSize: '14px', fontWeight: 500, marginBottom: '0px', marginTop: '18px' }}>
  Signature
</Typography>

              </Grid>
              <Grid>
                {renderSignatureSection()}
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Step11_GoalsAndSignatures;
