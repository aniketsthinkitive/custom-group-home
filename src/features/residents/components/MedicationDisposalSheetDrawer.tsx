import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Typography, Grid, IconButton, Paper, FormControlLabel, Radio, Box } from '@mui/material';
import { Print, Close, UploadFile } from '@mui/icons-material';
import { useForm, Controller, type UseFormSetValue, type FieldValues } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import CustomDrawer from '../../../components/custom-drawer/custom-drawer';
import CustomInput from '../../../components/custom-input/custom-input';
import CustomSelect from '../../../components/custom-select/custom-select';
import CustomButton from '../../../components/custom-buttons/custom-buttons';
import CustomLabel from '../../../components/custom-label/custom-label';
import CommonSnackbar from '../../../components/common-snackbar/common-snackbar';
import { type SignatureCanvasRef } from '../../../components/signature-canvas';
import { SignatureCanvas } from '../../../components/signature-canvas';
import { 
  listConsentFormsOptions, 
  listConsentFormsQueryKey, 
  createConsentFormMutation,
  getConsentFormDetailOptions,
  updateConsentFormMutation,
} from '../../../sdk/@tanstack/react-query.gen';
import { generateMedicationDisposalSheetPDF } from './medication-disposal-sheet/utils/generateMedicationDisposalSheetPDF';

// Verify import on module load

export interface MedicationDisposalSheetDrawerProps {
  open: boolean;
  onClose: () => void;
  formName: string;
  individualName?: string;
  residentData?: any;
  consentUuid?: string | null;
  mode?: "new" | "draft" | "view";
  historyEntry?: any; // Specific entry from history to view
  onAfterSave?: () => void;
  onAfterSubmit?: () => void;
}

// Form code constant
// Note: Backend has "MED_DISPOSAL_SHEET", but user specified "MEDICATION_DISPOSAL_SHEET_FORM"
// Using backend constant to match existing backend enum
const FORM_CODE = 'MED_DISPOSAL_SHEET';

// Helper function to extract backend message
const getBackendMessage = (data: unknown): string | undefined => {
  const responseData = data as any;
  return (
    responseData?.message ??
    responseData?.data?.message ??
    responseData?.detail ??
    undefined
  );
};

// Helper function to extract error message
const getErrorMessage = (error: unknown): string | undefined => {
  const err = error as AxiosError<any> | any;
  return (
    err?.response?.data?.message ??
    err?.response?.data?.error ??
    err?.response?.data?.detail ??
    err?.data?.message ??
    err?.data?.error ??
    err?.data?.detail ??
    undefined
  );
};

// Yup validation schema (no required validations)
const medicationDisposalSchema = yup.object({
  medicationName: yup.string().optional(),
  dose: yup.string().optional(),
  numberOfPills: yup.string().optional(),
  staff1Initials: yup.string().optional(),
  staff2Initials: yup.string().optional(),
  methodOfDisposal: yup.string().optional(),
  staff1Signature: yup.string().nullable().optional(),
  staff2Signature: yup.string().nullable().optional(),
});

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

const MedicationDisposalSheetDrawer: React.FC<MedicationDisposalSheetDrawerProps> = ({
  open,
  onClose,
  formName,
  individualName,
  residentData,
  consentUuid,
  mode = "new",
  historyEntry,
  onAfterSave,
  onAfterSubmit,
}) => {
  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
    status: 'success' | 'error';
  }>({
    isOpen: false,
    message: '',
    status: 'success',
  });
  const queryClient = useQueryClient();
  const hasResetFormRef = useRef(false);
  const lastPrefillTimestampRef = useRef<number>(0);

  // Extract resident UUID
  const residentUuid = residentData?.uuid || residentData?.resident_uuid;

  const { control, handleSubmit, reset, getValues, setValue, watch, formState: { errors } } = useForm({
    resolver: yupResolver(medicationDisposalSchema),
    defaultValues: {
      medicationName: '',
      dose: '',
      numberOfPills: '',
      staff1Initials: '',
      staff2Initials: '',
      methodOfDisposal: '',
      staff1Signature: null,
      staff2Signature: null,
    },
  });

  const staff1SignatureValue = watch('staff1Signature');
  const staff2SignatureValue = watch('staff2Signature');
  const staff1SignatureMethodValue = watch("staff1SignatureMethod");
  const staff2SignatureMethodValue = watch("staff2SignatureMethod");
  const sig1 = useSignature('staff1Signature', setValue as UseFormSetValue<FieldValues>, staff1SignatureValue, mode === 'view', staff1SignatureMethodValue);
  const sig2 = useSignature('staff2Signature', setValue as UseFormSetValue<FieldValues>, staff2SignatureValue, mode === 'view', staff2SignatureMethodValue);

  // Fetch draft form details when mode="draft" or mode="view" and consentUuid exists
  // If historyEntry is provided, use that entry's form_json directly
  const { data: draftFormDetails, dataUpdatedAt } = useQuery({
    ...getConsentFormDetailOptions({
      path: {
        uuid: consentUuid!,
      },
      query: {
        history: false,
      },
    }),
    enabled: open && (mode === "draft" || mode === "view") && !!consentUuid && !historyEntry,
    staleTime: 0,
    select: (data: any) => {
      // Backend response structure:
      // { status: "success", code: 200, message: "...", data: { form: {...}, entries: [{ form_json: {...}, ... }] } }
      const responseData = data?.data ?? data;
      if (responseData) {
        // Extract form_json from entries array (first entry is the latest)
        const entries = responseData.entries || [];
        const latestEntry = entries[0] || null;
        const formJson = latestEntry?.form_json || responseData.form_json || {};
        
        return {
          ...responseData,
          form_json: formJson,
        };
      }
      return null;
    },
  });

  // If historyEntry is provided, use it directly
  const formDataToUse = historyEntry 
    ? { form_json: historyEntry.form_json || {} }
    : draftFormDetails;

  // Fetch existing consent form when drawer opens (for non-draft mode)
  const { data: existingFormData } = useQuery({
    ...listConsentFormsOptions({
      query: {
        resident_uuid: residentUuid,
      },
    }),
    enabled: open && !!residentUuid && mode !== "draft",
    select: (data: any) => {
      // Handle different response structures
      const forms = Array.isArray(data) 
        ? data 
        : (data?.results || data?.data || (data && typeof data === 'object' ? [data] : []));
      
      // Find the form with matching form_code
      const form = forms.find((form: any) => form.form_code === FORM_CODE);
      
      // Extract form_json from latest_entry if it exists, otherwise from form directly
      if (form) {
        return {
          ...form,
          form_json: form.latest_entry?.form_json || form.form_json || {},
        };
      }
      return null;
    },
  });

  // Prefill form when draft details are loaded (using setValue as per requirement)
  useEffect(() => {
    if (!open) {
      lastPrefillTimestampRef.current = 0;
      return;
    }

    // Reset prefilled flag when historyEntry changes
    if (historyEntry) {
      lastPrefillTimestampRef.current = 0;
    }

    if ((mode === "draft" || mode === "view") && formDataToUse?.form_json && dataUpdatedAt !== lastPrefillTimestampRef.current) {
      const formJson = formDataToUse.form_json;
      
      if (formJson && typeof formJson === 'object' && Object.keys(formJson).length > 0) {
        let fieldsSet = 0;
        let fieldsSkipped = 0;

        // Use setValue for each field (as per requirement)
        Object.entries(formJson).forEach(([key, value]) => {
          try {
            if (value !== null && value !== undefined) {
              // Handle all fields (strings, numbers, booleans, including empty strings)
              setValue(key as any, value, { shouldValidate: false, shouldDirty: false });
              fieldsSet++;
            } else {
              fieldsSkipped++;
            }
          } catch (error) {
            console.error(`✗ Error setting field ${key}:`, error, value);
          }
        });

        lastPrefillTimestampRef.current = dataUpdatedAt;

      } else {
        console.warn('Medication Disposal - No form_json data to prefill:', formJson);
      }
    }
  }, [open, mode, formDataToUse, historyEntry, dataUpdatedAt, setValue]);

  // Reset form when existing form data is loaded (for non-draft mode)
  useEffect(() => {
    if (!open) {
      hasResetFormRef.current = false;
      return;
    }

    if (mode !== "draft" && existingFormData?.form_json && !hasResetFormRef.current) {
      const formJson = existingFormData.form_json;
      if (formJson && typeof formJson === 'object' && Object.keys(formJson).length > 0) {
        // Merge with default values to ensure all fields are present
        const defaultValues = {
          medicationName: '',
          dose: '',
          numberOfPills: '',
          staff1Initials: '',
          staff2Initials: '',
          methodOfDisposal: '',
          staff1Signature: null,
          staff2Signature: null,
        };
        
        // Reset form with merged data
        reset({ ...defaultValues, ...formJson });
        hasResetFormRef.current = true;
      }
    }
  }, [open, mode, existingFormData, reset]);

  // Reset form when drawer opens (if no existing data)
  useEffect(() => {
    if (!open) return;

    // Only reset to defaults if we don't have existing data
    if (!existingFormData?.form_json) {
      reset({
        medicationName: '',
        dose: '',
        numberOfPills: '',
        staff1Initials: '',
        staff2Initials: '',
        methodOfDisposal: '',
        staff1Signature: null,
        staff2Signature: null,
      });
    }
  }, [open, reset, existingFormData]);

  // Create consent form mutation (for new forms)
  const createConsentFormMutationHook = useMutation({
    ...(createConsentFormMutation() as any),
    onSuccess: (data: unknown) => {
      const backendMessage = getBackendMessage(data);
      if (backendMessage) {
        setSnackbar({
          isOpen: true,
          message: backendMessage,
          status: 'success',
        });
      }

      // Invalidate consent forms list to refresh data
      if (residentUuid) {
        queryClient.invalidateQueries({
          queryKey: listConsentFormsQueryKey({
            query: {
              resident_uuid: residentUuid,
            },
          }),
        });
      }

      // Call parent callbacks
      onAfterSubmit?.();
      onAfterSave?.();

      // Close drawer after success
      setTimeout(() => {
        onClose();
      }, 1000);
    },
    onError: (error: AxiosError<any>) => {
      const errorMessage = getErrorMessage(error);
      if (errorMessage) {
        setSnackbar({
          isOpen: true,
          message: errorMessage,
          status: 'error',
        });
      }
    },
  });

  // Update consent form mutation (for draft forms)
  const updateConsentFormMutationHook = useMutation({
    ...(updateConsentFormMutation() as any),
    onSuccess: (data: unknown) => {
      const backendMessage = getBackendMessage(data);
      if (backendMessage) {
        setSnackbar({
          isOpen: true,
          message: backendMessage,
          status: 'success',
        });
      }

      // Invalidate consent forms list to refresh data
      if (residentUuid) {
        queryClient.invalidateQueries({
          queryKey: listConsentFormsQueryKey({
            query: {
              resident_uuid: residentUuid,
            },
          }),
        });
      }

      // Invalidate consent form detail cache so next open fetches latest draft data
      if (consentUuid) {
        queryClient.invalidateQueries({
          queryKey: getConsentFormDetailOptions({
            path: { uuid: consentUuid },
            query: { history: false },
          }).queryKey,
        });
      }

      // Call parent callbacks
      onAfterSubmit?.();
      onAfterSave?.();

      // Close drawer after success
      setTimeout(() => {
        onClose();
      }, 1000);
    },
    onError: (error: AxiosError<any>) => {
      const errorMessage = getErrorMessage(error);
      if (errorMessage) {
        setSnackbar({
          isOpen: true,
          message: errorMessage,
          status: 'error',
        });
      }
    },
  });

  const onSubmit = async (data: any, status: 'COMPLETED' | 'DRAFT' = 'COMPLETED') => {
    if (mode === "view") return; // Prevent submission in view mode
    if (!residentUuid) {
      setSnackbar({
        isOpen: true,
        message: 'Resident UUID is required',
        status: 'error',
      });
      return;
    }

    try {
      // Build form_json payload - all form fields go here
      const form_json: Record<string, any> = { ...data };

      // Remove empty string values (but keep null, booleans, arrays)
      Object.keys(form_json).forEach(key => {
        if (form_json[key] === '' || form_json[key] === undefined) {
          delete form_json[key];
        }
      });

      // If mode is "draft" and consentUuid exists, use UPDATE mutation
      if (mode === "draft" && consentUuid) {
        // Update existing draft form
        const updatePayload = {
          path: {
            uuid: consentUuid,
          },
          body: {
            status: status, // COMPLETED when saving, DRAFT when saving as draft
            form_json: form_json,
            ...(status === 'COMPLETED' ? { filled_at: new Date().toISOString() } : {}),
          },
        };

        updateConsentFormMutationHook.mutate(updatePayload as any);
      } else {
        // Create new form (existing behavior)
        const createPayload = {
          body: {
            resident_uuid: residentUuid,
            form_name: formName,
            form_code: FORM_CODE,
            frequency_type: 'ONCE',
            status: status,
            filled_at: new Date().toISOString(),
            form_json: form_json,
          },
        };

        createConsentFormMutationHook.mutate(createPayload as any);
      }
    } catch (error) {
      console.error('Error preparing form data:', error);
      const errorMessage = getErrorMessage(error);
      if (errorMessage) {
        setSnackbar({
          isOpen: true,
          message: errorMessage,
          status: 'error',
        });
      }
    }
  };

  const handleSaveDraft = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // For draft, bypass validation and submit with current form values
    const currentValues = getValues();
    onSubmit(currentValues, 'DRAFT');
  };

  const handleCancel = () => {
    onClose();
  };

  const handlePrint = () => {
    const formData = getValues();
    try {
      generateMedicationDisposalSheetPDF(formData, individualName);
    } catch (error) {
      console.error('❌ ERROR calling PDF generator:', error);
    }
  };

  const renderSignatureSection = (staffKey: 'staff1' | 'staff2') => {
    const sig = staffKey === 'staff1' ? sig1 : sig2;

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
            alt={`${staffKey} Signature`}
            style={{ maxWidth: '100%', maxHeight: '120px' }}
          />
        </Grid>
      );
    }

    return (
      <Grid
        container
        spacing={2}
        direction="column"
        sx={{
          padding: '16px',
          border: '1px dashed #E7E9EB',
          borderRadius: '4px',
          marginTop: '16px',
        }}
      >
        <Grid size={{ xs: 12 }}>
          <Grid container spacing={2} direction="column">
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
                      <CustomLabel
                        label="Draw"
                        style={{ fontSize: '14px', fontWeight: 400, color: '#2C2D2C', margin: 0 }}
                      />
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
                      <CustomLabel
                        label="Upload"
                        style={{ fontSize: '14px', fontWeight: 400, color: '#2C2D2C', margin: 0 }}
                      />
                    }
                  />
                </Grid>
              </Grid>
            </Grid>

            {sig.method === 'DRAW' ? (
              <Grid size={{ xs: 12 }}>
                <Grid
                  container
                  spacing={2}
                  direction="column"
                  sx={{
                    backgroundColor: '#FBFFF7',
                    border: '1px solid #EFFFE3',
                    borderRadius: '4px',
                    padding: '12px 16px',
                  }}
                >
                  <Grid size={{ xs: 12 }}>
                    <Grid container spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <Grid>
                        <CustomLabel
                          label="Use your mouse, touchpad, or touchscreen to draw your signature"
                          style={{ fontSize: '12px', fontWeight: 500, color: '#757775' }}
                        />
                      </Grid>
                      <Grid>
                        <CustomButton
                          variant="secondary"
                          size="sm"
                          onClick={sig.handleClear}
                          disabled={mode === "view" || !sig.hasDrawn}
                        >
                          Clear
                        </CustomButton>
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Grid
                      container
                      sx={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E7E9EB',
                        borderRadius: '4px',
                        padding: '16px',
                      }}
                    >
                      {sig.hadExistingFromApi && sig.previewUrl ? (
                        <img
                          src={sig.previewUrl}
                          alt={`${staffKey} Signature`}
                          style={{ maxWidth: '100%', maxHeight: '120px' }}
                        />
                      ) : (
                        <SignatureCanvas
                          key={sig.canvasKey}
                          ref={sig.canvasRef}
                          width={568}
                          height={120}
                          backgroundColor="#FFFFFF"
                          strokeColor="#000000"
                          strokeWidth={2}
                          onSignatureChange={sig.handleSignatureChange}
                          onDrawEnd={sig.handleDrawEnd}
                        />
                      )}
                    </Grid>
                  </Grid>
                </Grid>
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
                        <CustomLabel
                          label="Upload your signature file"
                          style={{ fontSize: '12px', fontWeight: 500, color: '#757775' }}
                        />
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
                    <Grid
                      container
                      sx={{
                        padding: '16px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E7E9EB',
                        borderRadius: '4px',
                        minHeight: '80px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        ...(mode === "view" ? {
                          cursor: 'not-allowed',
                          opacity: 0.6,
                          pointerEvents: 'none',
                        } : {
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: '#FAFAFA',
                          },
                        }),
                      }}
                      onClick={() => mode !== "view" && sig.fileInputRef.current?.click()}
                    >
                      {sig.previewUrl ? (
                        <Grid container direction="column" alignItems="center" gap={1}>
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
                        </Grid>
                      ) : (
                        <CustomLabel
                          label="Click to upload signature file"
                          style={{ fontSize: '14px', color: '#757775', textAlign: 'center' }}
                        />
                      )}
                    </Grid>
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

  // Method of Disposal options
  const disposalMethodOptions = [
    { value: 'destroyed_per_policy', label: 'Destroyed per policy' },
    { value: 'pharmacy_return', label: 'Pharmacy return' },
    { value: 'waste_disposal_kit', label: 'Waste disposal kit' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      anchor="right"
      drawerWidth="840px"
      drawerPadding="0"
    >
      <Grid
        container
        direction="column"
        sx={{
          height: '100%',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
        }}
      >
        {/* Header */}
        <Grid
  size={{ xs: 12 }}
  sx={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: { xs: "wrap", sm: "nowrap" },
    padding: { xs: "12px 16px", sm: "16px 24px" },
    borderBottom: "1px solid #E3ECEF",
    flexShrink: 0,
    gap: { xs: 1, sm: 0 },
  }}
>
  <Typography
    sx={{
      fontSize: "18px",
      fontWeight: 600,
      color: "#424342",
      fontFamily: "Geist",
      lineHeight: "24px",
      m: 0,
    }}
  >
    {formName}
  </Typography>

          <Grid container alignItems="center" spacing={2}>
            <Grid>
              <CustomButton
                variant="text"
                size="sm"
                icon={<Print />}
                onClick={handlePrint}
              >
                Print
              </CustomButton>
            </Grid>
            <Grid>
              <IconButton
                onClick={onClose}
                sx={{
                  padding: '4px',
                  color: '#757775',
                  '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                }}
              >
                <Close />
              </IconButton>
            </Grid>
          </Grid>
        </Grid>

        {/* Individual Info Bar */}
        <Grid
          size={{ xs: 12 }}
          sx={{
            px: 3,
            py: 1.5,
            backgroundColor: '#F5F7FA',
            borderBottom: '1px solid #E3ECEF',
            flexShrink: 0,
          }}
        >
          <CustomLabel 
            label={`Individual's Name : ${individualName || 'N/A'}`}
            style={{ fontSize: '14px', color: '#424342', marginBottom: '4px' }} 
          />
        </Grid>

        {/* Main Content */}
        <Grid
          sx={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            p: 3,
            minHeight: 0,
            maxHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            paddingBottom: '100px',
          }}
        >
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (mode !== "view") {
                handleSubmit((data) => onSubmit(data, 'COMPLETED'))(e);
              }
            }}
          >

          {/* Medication Details */}
          <Grid size={{ xs: 12 }} sx={{ marginBottom: '24px' }}>
            <Paper
              elevation={0}
              sx={{
                padding: '16px',
                border: '1px solid #E7E9EB',
                borderRadius: '8px',
              }}
            >
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <CustomLabel label="Name of Medication" />
                  <Controller
                    name="medicationName"
                    control={control}
                    render={({ field, fieldState }) => (
                      <CustomInput
                        name="medicationName"
                        placeholder="Enter"
                        value={field.value}
                        onChange={field.onChange}
                        bgWhite
                        hasError={!!fieldState.error}
                        errorMessage={fieldState.error?.message}
                        disableField={mode === "view"}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomLabel label="Dose" />
                  <Controller
                    name="dose"
                    control={control}
                    render={({ field, fieldState }) => (
                      <CustomInput
                        name="dose"
                        placeholder="Enter"
                        value={field.value}
                        onChange={field.onChange}
                        bgWhite
                        hasError={!!fieldState.error}
                        errorMessage={fieldState.error?.message}
                        disableField={mode === "view"}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomLabel label="No. of Pills" />
                  <Controller
                    name="numberOfPills"
                    control={control}
                    render={({ field, fieldState }) => (
                      <CustomInput
                        name="numberOfPills"
                        placeholder="Enter"
                        value={field.value}
                        onChange={field.onChange}
                        bgWhite
                        hasError={!!fieldState.error}
                        errorMessage={fieldState.error?.message}
                        disableField={mode === "view"}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomLabel label="Staff Initials (Staff 1)" />
                  <Controller
                    name="staff1Initials"
                    control={control}
                    render={({ field, fieldState }) => (
                      <CustomInput
                        name="staff1Initials"
                        placeholder="Enter"
                        value={field.value}
                        onChange={field.onChange}
                        bgWhite
                        hasError={!!fieldState.error}
                        errorMessage={fieldState.error?.message}
                        disableField={mode === "view"}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomLabel label="Staff Initials (Staff 2)" />
                  <Controller
                    name="staff2Initials"
                    control={control}
                    render={({ field, fieldState }) => (
                      <CustomInput
                        name="staff2Initials"
                        placeholder="Enter"
                        value={field.value}
                        onChange={field.onChange}
                        bgWhite
                        hasError={!!fieldState.error}
                        errorMessage={fieldState.error?.message}
                        disableField={mode === "view"}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <CustomLabel label="Method of Disposal" />
                  <Controller
                    name="methodOfDisposal"
                    control={control}
                    render={({ field, fieldState }) => (
                      <CustomSelect
                        placeholder="Select"
                        name="methodOfDisposal"
                        value={field.value}
                        items={disposalMethodOptions}
                        onChange={field.onChange}
                        bgWhite
                        hasError={!!fieldState.error}
                        errorMessage={fieldState.error?.message}
                        isDisabled={mode === "view"}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Certification Statement */}
          <Grid size={{ xs: 12 }} sx={{ marginBottom: '24px' }}>
            <CustomLabel 
              label="By signing below, I certify that the medication(s) referenced above have been counted, logged, and disposed of."
              style={{ fontSize: '14px', fontWeight: 400, color: '#2C2D2C' }}
            />
          </Grid>

          {/* Staff 1 Signature */}
          <Grid size={{ xs: 12 }} sx={{ marginBottom: '24px' }}>
            <CustomLabel label="Staff 1 Signature" />
            {renderSignatureSection('staff1')}
          </Grid>

          {/* Staff 2 Signature */}
          <Grid size={{ xs: 12 }} sx={{ marginBottom: '24px' }}>
            <CustomLabel label="Staff 2 Signature" />
            {renderSignatureSection('staff2')}
          </Grid>
          </form>
        </Grid>

        {/* Fixed Footer */}
        <Grid
          container
          justifyContent="flex-end"
          alignItems="center"
          spacing={2}
          sx={{
            padding: '16px 24px',
            borderTop: '1px solid #E3ECEF',
            flexShrink: 0,
          }}
        >
          <Grid>
            <CustomButton variant="secondary" size="md" onClick={handleCancel} disabled={mode === "view"}>
              Cancel
            </CustomButton>
          </Grid>
          <Grid>
            <CustomButton 
              variant="secondary" 
              size="md" 
              onClick={handleSaveDraft} 
              disabled={mode === "view"}
            >
              Save as Draft
            </CustomButton>
          </Grid>
          <Grid>
            <CustomButton 
              variant="primary" 
              size="md" 
              onClick={handleSubmit(
                (data) => onSubmit(data, 'COMPLETED'),
                () => {
                  setSnackbar({
                    isOpen: true,
                    message: 'Please fill all required fields.',
                    status: 'error',
                  });
                }
              )} 
              disabled={mode === "view"}
            >
              Save
            </CustomButton>
          </Grid>
        </Grid>
      </Grid>

      {/* Snackbar for success/error messages */}
      <CommonSnackbar
        isOpen={snackbar.isOpen}
        message={snackbar.message}
        status={snackbar.status}
        onClose={() => setSnackbar({ ...snackbar, isOpen: false })}
      />
    </CustomDrawer>
  );
};

export default MedicationDisposalSheetDrawer;

