import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Grid, IconButton, FormControlLabel, Radio, Typography, Box } from '@mui/material';
import { Print, Close } from '@mui/icons-material';
import { useForm, Controller, type UseFormSetValue, type FieldValues } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import CustomDrawer from '../../../components/custom-drawer/custom-drawer';
import CustomInput from '../../../components/custom-input/custom-input';
import CustomButton from '../../../components/custom-buttons/custom-buttons';
import CustomLabel from '../../../components/custom-label/custom-label';
import CustomRadio from '../../../components/custom-radio/custom-radio';
import CustomTextArea from '../../../components/custom-text-area/custom-textarea';
import DatePickerField from '../../../components/date-picker-field/date-picker-field';
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
import { generateFireSafetyAssessmentPDF } from './fire-safety-assessment/utils/generateFireSafetyAssessmentPDF';
import dayjs from 'dayjs';

export interface FireSafetyAssessmentDrawerProps {
  open: boolean;
  onClose: () => void;
  formName: string;
  individualName?: string;
  residentData?: any;
  onAfterSubmit?: () => void;
  consentUuid?: string | null;
  mode?: "new" | "draft" | "view";
  onAfterSave?: () => void;
}

// Form code constant - matches backend enum
const FORM_CODE = 'FIRE_SAFETY_ASSESSMENT';

// Helper function to extract backend message
const getBackendMessage = (data: unknown): string | undefined => {
  const responseData = data as any;
  return responseData?.message ?? responseData?.data?.message ?? responseData?.detail ?? undefined;
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

// Yup validation schema - only dateCompleted is required
const fireSafetyAssessmentSchema = yup.object({
  responseToAlarm: yup.string().nullable().optional(),
  responseToInstruction: yup.string().nullable().optional(),
  visionAndHearing: yup.string().nullable().optional(),
  impairedConsciousness: yup.string().nullable().optional(),
  mobility: yup.string().nullable().optional(),
  resistance: yup.string().nullable().optional(),
  sleepHours: yup.string().nullable().optional(),
  nonSleepHours: yup.string().nullable().optional(),
  emergencyBackupName: yup.string().nullable().optional(),
  emergencyBackupNumber: yup.string().nullable().optional(),
  personSpecificInfo: yup.string().nullable().optional(),
  dateCompleted: yup
    .mixed()
    .required('Date completed is required')
    .test('is-valid-date', 'Date completed is required', (value) => {
      return value !== null && value !== undefined;
    }),
  signature: yup.string().nullable().optional(),
});

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

  useEffect(() => {
    if (method !== "DRAW" || hadExistingFromApi) return;
    const hasValidSignature =
      watchValue &&
      (watchValue.startsWith("data:image") || watchValue.startsWith("http"));
    if (!hasDrawn && !hasValidSignature) {
      setValue(fieldName, "");
    }
  }, [hasDrawn, method, fieldName, setValue, hadExistingFromApi, watchValue]);

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

const FireSafetyAssessmentDrawer: React.FC<FireSafetyAssessmentDrawerProps> = ({
  open,
  onClose,
  formName,
  individualName,
  residentData,
  onAfterSubmit,
  consentUuid,
  mode = "new",
  onAfterSave,
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

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(fireSafetyAssessmentSchema),
    defaultValues: {
      responseToAlarm: '',
      responseToInstruction: '',
      visionAndHearing: '',
      impairedConsciousness: '',
      mobility: '',
      resistance: '',
      sleepHours: '',
      nonSleepHours: '',
      emergencyBackupName: '',
      emergencyBackupNumber: '',
      personSpecificInfo: '',
      dateCompleted: undefined,
      signature: null,
    },
  });

  // Signature hook (same pattern as leads forms)
  const signatureWatchValue = watch('signature');
  const signatureMethodValue = watch("signatureMethod");
  const sig = useSignature('signature', setValue as UseFormSetValue<FieldValues>, signatureWatchValue, mode === 'view', signatureMethodValue);

  // Fetch form details when mode="draft" or mode="view" and consentUuid exists
  const { data: draftFormDetails, dataUpdatedAt } = useQuery({
    ...getConsentFormDetailOptions({
      path: {
        uuid: consentUuid!,
      },
      query: {
        history: false,
      },
    }),
    enabled: open && (mode === "draft" || mode === "view") && !!consentUuid,
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
        : data?.results || data?.data || (data && typeof data === 'object' ? [data] : []);

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

    if ((mode === "draft" || mode === "view") && draftFormDetails?.form_json && dataUpdatedAt !== lastPrefillTimestampRef.current) {
      const formJson = draftFormDetails.form_json;
      
      if (formJson && typeof formJson === 'object' && Object.keys(formJson).length > 0) {
        // List of date field names
        const dateFields = ['dateCompleted'];

        let fieldsSet = 0;
        let fieldsSkipped = 0;

        // Use setValue for each field (as per requirement)
        Object.entries(formJson).forEach(([key, value]) => {

          try {
            // Transform date strings to dayjs objects for DatePickerField
            if (dateFields.includes(key) && typeof value === 'string' && value) {
              const dayjsValue = dayjs(value);
              if (dayjsValue.isValid()) {
                setValue(key as any, dayjsValue, { shouldValidate: false, shouldDirty: false });
                fieldsSet++;
              } else {
                setValue(key as any, value, { shouldValidate: false, shouldDirty: false });
                fieldsSet++;
              }
            } else if (value !== null && value !== undefined) {
              // Handle all other fields (strings, numbers, booleans, including empty strings)
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
        console.warn('Fire Safety - No form_json data to prefill:', formJson);
      }
    }
  }, [open, mode, draftFormDetails, dataUpdatedAt, setValue]);

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
          responseToAlarm: '',
          responseToInstruction: '',
          visionAndHearing: '',
          impairedConsciousness: '',
          mobility: '',
          resistance: '',
          sleepHours: '',
          nonSleepHours: '',
          emergencyBackupName: '',
          emergencyBackupNumber: '',
          personSpecificInfo: '',
          dateCompleted: undefined,
          signature: null,
        };

        // Convert date string to dayjs object if it exists
        const formDataToReset: any = { ...defaultValues, ...formJson };
        if (formDataToReset.dateCompleted && typeof formDataToReset.dateCompleted === 'string') {
          formDataToReset.dateCompleted = dayjs(formDataToReset.dateCompleted);
        }

        // Reset form with merged data
        reset(formDataToReset);
        hasResetFormRef.current = true;
      }
    }
  }, [open, mode, existingFormData, reset]);

  // Reset form when drawer opens (if no existing data and not in draft mode)
  useEffect(() => {
    if (!open) {
      // Reset flags when drawer closes
      lastPrefillTimestampRef.current = 0;
      hasResetFormRef.current = false;
      return;
    }

    // Only reset to defaults if we don't have existing data and not in draft mode
    if (mode !== "draft" && !existingFormData?.form_json) {
      reset({
        responseToAlarm: '',
        responseToInstruction: '',
        visionAndHearing: '',
        impairedConsciousness: '',
        mobility: '',
        resistance: '',
        sleepHours: '',
        nonSleepHours: '',
        emergencyBackupName: '',
        emergencyBackupNumber: '',
        personSpecificInfo: '',
        dateCompleted: undefined,
        signature: null,
      });
    }
  }, [open, mode, reset, existingFormData]);

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

      // Invalidate consent forms list to refresh data (works for both COMPLETED and DRAFT)
      if (residentUuid) {
        queryClient.invalidateQueries({
          queryKey: listConsentFormsQueryKey({
            query: {
              resident_uuid: residentUuid,
            },
          }),
        });
      }

      // Call parent callback to trigger refetch
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

      // Call parent callback to trigger refetch
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
      console.error('Resident UUID is missing');
      setSnackbar({
        isOpen: true,
        message: 'Resident UUID is required',
        status: 'error',
      });
      return;
    }

    try {
      // Build form_json payload - signature is already in form data via useSignature hook
      const form_json: Record<string, any> = {
        ...data,
      };

      // Convert dayjs date to ISO string if it exists
      if (form_json.dateCompleted && dayjs.isDayjs(form_json.dateCompleted)) {
        form_json.dateCompleted = form_json.dateCompleted.toISOString();
      }

      // Remove empty string values (but keep null, booleans, arrays)
      Object.keys(form_json).forEach((key) => {
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

  const handleSaveDraft = () => {
    // For draft, bypass validation and submit with current form values
    const currentValues = getValues();
    onSubmit(currentValues, 'DRAFT');
  };

  const handleCancel = () => {
    onClose();
  };

  const handlePrint = () => {
    const formData = getValues();
    generateFireSafetyAssessmentPDF(formData, individualName);
  };

  // Reset mutations when drawer closes to prevent stuck disabled buttons upon reopening
  useEffect(() => {
    if (!open) {
      createConsentFormMutationHook.reset();
      updateConsentFormMutationHook.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const renderSignatureSection = () => {
    const isViewMode = mode === "view";

    // In view mode, show signature image if available
    if (isViewMode && sig.previewUrl) {
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
          <Box
            component="img"
            src={sig.previewUrl}
            alt="Signature"
            sx={{ maxWidth: '100%', maxHeight: '120px', objectFit: 'contain' }}
          />
        </Grid>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
        {/* Select Signature Method */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CustomLabel label="Select Signature Method" style={{ fontSize: '12px', fontWeight: 500, color: '#757775', margin: 0 }} />
          <Box sx={{ display: 'flex', gap: '16px' }}>
            <FormControlLabel
              control={
                <Radio
                  checked={sig.method === 'DRAW'}
                  onChange={sig.handleMethodChange}
                  value="DRAW"
                  disabled={isViewMode}
                  sx={{ color: '#A9ACA9', '&.Mui-checked': { color: '#0A2E45' } }}
                />
              }
              label={<CustomLabel label="Draw" style={{ fontSize: '14px', fontWeight: 400, color: '#2C2D2C', margin: 0 }} />}
            />
            <FormControlLabel
              control={
                <Radio
                  checked={sig.method === 'UPLOAD'}
                  onChange={sig.handleMethodChange}
                  value="UPLOAD"
                  disabled={isViewMode}
                  sx={{ color: '#A9ACA9', '&.Mui-checked': { color: '#0A2E45' } }}
                />
              }
              label={<CustomLabel label="Upload" style={{ fontSize: '14px', fontWeight: 400, color: '#2C2D2C', margin: 0 }} />}
            />
          </Box>
        </Box>

        {/* Draw Mode */}
        {sig.method === 'DRAW' && (
          <Box sx={{ backgroundColor: '#FBFFF7', border: '1px solid #EFFFE3', borderRadius: '4px', padding: '12px 16px' }}>
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
                disabled={isViewMode || (!sig.hasDrawn && !sig.hadExistingFromApi)}
              >
                Clear
              </CustomButton>
            </Box>
            <Box sx={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E9EB', borderRadius: '4px', padding: '16px', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {sig.previewUrl && sig.hadExistingFromApi ? (
                <Box
                  component="img"
                  src={sig.previewUrl}
                  alt="Current signature"
                  sx={{ maxWidth: '100%', width: '100%', height: 120, objectFit: 'contain', display: 'block' }}
                />
              ) : (
                <SignatureCanvas
                  key={`canvas-${sig.canvasKey}`}
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
            </Box>
          </Box>
        )}

        {/* Upload Mode */}
        {sig.method === 'UPLOAD' && (
          <Box sx={{ backgroundColor: '#FBFFF7', border: '1px solid #EFFFE3', borderRadius: '4px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              ref={sig.fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={sig.handleFileUpload}
              style={{ display: 'none' }}
              disabled={isViewMode}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <CustomLabel label="Upload your signature file" style={{ fontSize: '12px', fontWeight: 500, color: '#757775' }} />
              <CustomButton
                variant="secondary"
                size="sm"
                onClick={sig.handleClear}
                disabled={isViewMode || (!sig.uploadedFile && !(sig.hadExistingFromApi && sig.previewUrl))}
              >
                Clear
              </CustomButton>
            </Box>
            <Box
              sx={{
                display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px',
                backgroundColor: '#FFFFFF', border: '1px solid #E7E9EB', borderRadius: '4px',
                cursor: isViewMode ? 'not-allowed' : 'pointer', minHeight: '80px',
                alignItems: 'center', justifyContent: 'center',
                ...(isViewMode ? { opacity: 0.6, pointerEvents: 'none' } : { '&:hover': { backgroundColor: '#FAFAFA' } }),
              }}
              onClick={() => !isViewMode && sig.fileInputRef.current?.click()}
            >
              {sig.previewUrl ? (
                <>
                  <Box
                    component="img"
                    src={sig.previewUrl}
                    alt="Uploaded signature"
                    sx={{ maxWidth: '100%', height: 120, objectFit: 'contain', display: 'block', mx: 'auto' }}
                  />
                  {!isViewMode && (
                    <Typography sx={{ fontSize: '12px', color: '#757775', fontFamily: '"Helvetica Neue", Arial, sans-serif', textAlign: 'center' }}>
                      {sig.uploadedFile ? `${sig.uploadedFile.name} — click to replace` : 'Click to replace signature file'}
                    </Typography>
                  )}
                </>
              ) : (
                <Typography sx={{ fontSize: '14px', color: '#757775', fontFamily: '"Helvetica Neue", Arial, sans-serif', textAlign: 'center' }}>
                  Click to upload signature file
                </Typography>
              )}
            </Box>
            {sig.fileError && (
              <Typography sx={{ color: "#DC2626", fontSize: "12px", mt: 0.5 }}>
                {sig.fileError}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    );
  };

  const renderRadioGroup = (name: string, label: string) => {
    return (
      <Controller
        name={name as any}
        control={control}
        render={({ field, fieldState }) => (
          <Grid container spacing={2} direction="column">
            <Grid size={{ xs: 12 }}>
              <CustomLabel label={label} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Grid container spacing={2}>
                <Grid>
                  <CustomRadio
                    checked={field.value === 'minimal'}
                    onChange={(checked, value) => {
                      if (checked && value) {
                        field.onChange(value);
                      }
                    }}
                    label="Minimal"
                    value="minimal"
                    disabled={mode === "view"}
                  />
                </Grid>
                <Grid>
                  <CustomRadio
                    checked={field.value === 'mild'}
                    onChange={(checked, value) => {
                      if (checked && value) {
                        field.onChange(value);
                      }
                    }}
                    label="Mild"
                    value="mild"
                    disabled={mode === "view"}
                  />
                </Grid>
                <Grid>
                  <CustomRadio
                    checked={field.value === 'strong'}
                    onChange={(checked, value) => {
                      if (checked && value) {
                        field.onChange(value);
                      }
                    }}
                    label="Strong"
                    value="strong"
                    disabled={mode === "view"}
                  />
                </Grid>
              </Grid>
              {fieldState.error && mode !== "view" && (
                <Grid size={{ xs: 12 }} sx={{ marginTop: '4px' }}>
                  <CustomLabel
                    label={fieldState.error.message || ''}
                    style={{ fontSize: '12px', color: '#DC2626' }}
                  />
                </Grid>
              )}
            </Grid>
          </Grid>
        )}
      />
    );
  };

  return (
    <CustomDrawer open={open} onClose={onClose} anchor="right" drawerWidth="840px" drawerPadding="0">
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
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            padding: { xs: '12px 16px', sm: '16px 24px' },
            borderBottom: '1px solid #E3ECEF',
            flexShrink: 0,
            gap: { xs: 1, sm: 0 },
          }}
        >
          <Typography
            sx={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#424342',
              fontFamily: 'Geist',
              lineHeight: '24px',
              m: 0,
            }}
          >
            {formName}
          </Typography>

          <Grid container alignItems="center" spacing={2}>
            <Grid>
              {/* <CustomButton variant="text" size="sm" icon={<Print />} onClick={handlePrint}>
                Print
              </CustomButton> */}
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
          {/* ✅ Form is disabled in view mode - prevent all submissions and interactions */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (mode !== "view") {
                handleSubmit((data) => onSubmit(data, 'COMPLETED'))(e);
              }
            }}
            onKeyDown={(e) => {
              // Prevent form submission via Enter key in view mode
              if (mode === "view" && e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
            {/* Introductory Text */}
            <Grid size={{ xs: 12 }} sx={{ marginBottom: '24px' }}>
              <CustomLabel
                label="This form is intended to review factors that may create difficulties during evacuation of a particular individual. Please complete it for each individual in the residence and use it as a resource for planning the evacuation and for informing the people who will be assisting the individual. Individual risk factors sheet is based on the fire drill that was held within 5 days of the person moving in – and done thereafter if any changes occur."
                style={{ fontSize: '14px', fontWeight: 400, color: '#2C2D2C', lineHeight: '1.6' }}
              />
            </Grid>

            {/* Risk of problems in: Section */}
            <Grid size={{ xs: 12 }} sx={{ marginBottom: '24px' }}>
              <Grid container spacing={3} direction="column">
                <Grid size={{ xs: 12 }}>
                  <CustomLabel
                    label="Risk of problems in:"
                    style={{ fontSize: '16px', fontWeight: 600, color: '#2C2D2C', marginBottom: '16px' }}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>{renderRadioGroup('responseToAlarm', '1. Response to alarm')}</Grid>
                <Grid size={{ xs: 12 }}>
                  {renderRadioGroup('responseToInstruction', '2. Response to instruction')}
                </Grid>
                <Grid size={{ xs: 12 }}>{renderRadioGroup('visionAndHearing', '3. Vision and Hearing')}</Grid>
                <Grid size={{ xs: 12 }}>
                  {renderRadioGroup('impairedConsciousness', '4. Impaired Consciousness')}
                </Grid>
                <Grid size={{ xs: 12 }}>{renderRadioGroup('mobility', '5. Mobility')}</Grid>
                <Grid size={{ xs: 12 }}>{renderRadioGroup('resistance', '6. Resistance')}</Grid>
              </Grid>
            </Grid>

            {/* Staff / provider to Resident ratio */}
            <Grid size={{ xs: 12 }} sx={{ marginBottom: '24px' }}>
              <CustomLabel
                label="7. Staff / provider to Resident ratio:"
                style={{ fontSize: '16px', fontWeight: 600, color: '#2C2D2C', marginBottom: '16px' }}
              />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomLabel label="Sleep Hours" />
                  <Controller
                    name="sleepHours"
                    control={control}
                    render={({ field, fieldState }) => (
                      <CustomInput
                        name="sleepHours"
                        placeholder="Enter Sleep Hours"
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
                  <CustomLabel label="Non-sleep Hours" />
                  <Controller
                    name="nonSleepHours"
                    control={control}
                    render={({ field, fieldState }) => (
                      <CustomInput
                        name="nonSleepHours"
                        placeholder="Enter Non-sleep Hours"
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
              </Grid>
            </Grid>

            {/* 24-hour emergency backup provided by */}
            <Grid size={{ xs: 12 }} sx={{ marginBottom: '24px' }}>
              <CustomLabel
                label="8. 24-hour emergency backup provided by:"
                style={{ fontSize: '16px', fontWeight: 600, color: '#2C2D2C', marginBottom: '16px' }}
              />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomLabel label="Name" />
                  <Controller
                    name="emergencyBackupName"
                    control={control}
                    render={({ field, fieldState }) => (
                      <CustomInput
                        name="emergencyBackupName"
                        placeholder="Enter Name"
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
                  <CustomLabel label="Number" />
                  <Controller
                    name="emergencyBackupNumber"
                    control={control}
                    render={({ field, fieldState }) => (
                      <CustomInput
                        name="emergencyBackupNumber"
                        placeholder="Enter Number"
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
              </Grid>
            </Grid>

            {/* Person specific information */}
            <Grid size={{ xs: 12 }} sx={{ marginBottom: '24px' }}>
              <Typography
                sx={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#2C2D2C',
                  marginBottom: '16px',
                  wordWrap: 'break-word',
                  whiteSpace: 'normal',
                  lineHeight: '1.5',
                  width: '100%',
                }}
              >
                9. Person specific information and instruction to Staff & Provider, regarding the Individual and his/her Evacuation needs:
              </Typography>
              <Controller
                name="personSpecificInfo"
                control={control}
                render={({ field, fieldState }) => (
                  <CustomTextArea
                    name="personSpecificInfo"
                    placeholder="Enter here..."
                    value={field.value}
                    onChange={field.onChange}
                    minRow={6}
                    hasError={!!fieldState.error}
                    errorMessage={fieldState.error?.message}
                    isDisabled={mode === "view"}
                  />
                )}
              />
            </Grid>

            {/* Date Completed */}
            <Grid size={{ xs: 12 }} sx={{ marginBottom: '24px' }}>
              <CustomLabel
                label="Date completed"
                isRequired={true}
                style={{ fontSize: '14px', fontWeight: 500, color: '#2C2D2C' }}
              />
              <Controller
                name="dateCompleted"
                control={control}
                render={({ field, fieldState }) => {
                  const dateValue = field.value 
                    ? (dayjs.isDayjs(field.value) ? field.value : dayjs(field.value as any))
                    : null;
                  return (
                    <DatePickerField 
                      name="dateCompleted" 
                      value={dateValue} 
                      onChange={field.onChange}
                      useCustomStyle={false}
                      disabled={mode === "view"}
                      hasError={!!(fieldState.error || errors.dateCompleted)}
                      errorMessage={fieldState.error?.message || errors.dateCompleted?.message}
                    />
                  );
                }}
              />
              {errors.dateCompleted && mode !== "view" && (
                <Grid size={{ xs: 12 }} sx={{ marginTop: '4px' }}>
                  <CustomLabel
                    label={(errors.dateCompleted as any)?.message || ''}
                    style={{ fontSize: '12px', color: '#DC2626' }}
                  />
                </Grid>
              )}
            </Grid>

            {/* Signature Field */}
            <Grid size={{ xs: 12 }} sx={{ marginBottom: '24px' }}>
              <CustomLabel
                label="Signature of person documenting the individual's risk factors."
                style={{ fontSize: '14px', fontWeight: 500, color: '#2C2D2C' }}
              />
              {renderSignatureSection()}
            </Grid>
          </form>
        </Grid>

        {/* Fixed Footer - Show buttons but disabled in view mode */}
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
          {(() => {
            const isSaving =
              createConsentFormMutationHook.isPending ||
              updateConsentFormMutationHook.isPending ||
              createConsentFormMutationHook.isSuccess ||
              updateConsentFormMutationHook.isSuccess;
            return (
              <>
                <Grid>
                  <CustomButton variant="secondary" size="md" onClick={handleCancel} disabled={mode === "view" || isSaving}>
                    Cancel
                  </CustomButton>
                </Grid>
                <Grid>
                  <CustomButton variant="secondary" size="md" onClick={handleSaveDraft} disabled={mode === "view" || isSaving}>
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
                    disabled={mode === "view" || isSaving}
                  >
                    {isSaving ? 'Saving…' : 'Save'}
                  </CustomButton>
                </Grid>
              </>
            );
          })()}
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

export default FireSafetyAssessmentDrawer;
