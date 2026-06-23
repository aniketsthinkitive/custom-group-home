import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Grid, IconButton, Tabs, Tab, FormControlLabel, Radio, Typography, Box } from '@mui/material';
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
import DatePickerField from '../../../components/date-picker-field/date-picker-field';
import CustomTextArea from '../../../components/custom-text-area/custom-textarea';
import CustomCheckbox from '../../../components/custom-checkbox/custom-checkbox';
import CustomRadio from '../../../components/custom-radio/custom-radio';
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
import dayjs from 'dayjs';

export interface NursingTransitionEvaluationDrawerProps {
  open: boolean;
  onClose: () => void;
  formName: string;
  individualName?: string;
  residentUuid?: string;
  consentUuid?: string | null;
  mode?: "new" | "draft" | "view";
  onAfterSave?: () => void;
  onAfterSubmit?: () => void;
}

// Form code constant
const FORM_CODE = '5_AND_30_DAY_NURSING_TRANSITION_EVALUATION_FORM';

// Validation schema
const nursingTransitionEvaluationSchema = yup.object({
  individualName: yup.string().nullable(),
  region: yup.string().nullable(),
  address: yup.string().nullable(),
  dateOfTransition: yup.mixed().nullable(),
  vendorAgencyName: yup.string().nullable(),
  // 5-Day Evaluation
  fiveDayNurseName: yup.string().nullable(),
  fiveDayEvaluationDate: yup.mixed().nullable(),
  fiveDayEmail: yup
    .string()
    .nullable()
    .test(
      "email-format",
      "Please enter a valid email address",
      function (value) {
        if (!value || value.trim() === "") return true; // Allow null/empty
        return value.includes("@") && value.includes(".");
      },
    ),
  fiveDayContactNumber: yup.string().nullable(),
  fiveDayAdverseChanges: yup.string().nullable(),
  fiveDayFollowUp: yup.string().nullable(),
  fiveDaySignature: yup.mixed().nullable(),
  // 30-Day Evaluation
  thirtyDayNurseName: yup.string().nullable(),
  thirtyDayEvaluationDate: yup.mixed().nullable(),
  thirtyDayEmail: yup
    .string()
    .nullable()
    .test(
      "email-format",
      "Please enter a valid email address",
      function (value) {
        if (!value || value.trim() === "") return true; // Allow null/empty
        return value.includes("@") && value.includes(".");
      },
    ),
  thirtyDayContactNumber: yup.string().nullable(),
  thirtyDayHealthHistoryInfo: yup.boolean().nullable(),
  thirtyDayHRSTMonthlyData: yup.boolean().nullable(),
  thirtyDayServiceAgreement: yup.boolean().nullable(),
  thirtyDayFrailHealth: yup.string().nullable(),
  thirtyDayFrailHealthDescription: yup.string().nullable(),
  thirtyDayFollowUp: yup.string().nullable(),
  thirtyDayNotes: yup.string().nullable(),
  thirtyDaySignature: yup.mixed().nullable(),
});

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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`evaluation-tabpanel-${index}`}
      aria-labelledby={`evaluation-tab-${index}`}
      {...other}
    >
      {value === index && <Grid sx={{ pt: 3 }}>{children}</Grid>}
    </div>
  );
}

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

const NursingTransitionEvaluationDrawer: React.FC<NursingTransitionEvaluationDrawerProps> = ({
  open,
  onClose,
  formName,
  individualName,
  residentUuid,
  consentUuid,
  mode,
  onAfterSave,
  onAfterSubmit,
}) => {
  const [activeTab, setActiveTab] = useState(0);
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
  const { control, handleSubmit, watch, reset, getValues, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(nursingTransitionEvaluationSchema) as any,
    mode: "onChange", // Validate on change as requested
    defaultValues: {
      individualName: individualName || '',
      region: '',
      address: '',
      dateOfTransition: null,
      vendorAgencyName: '',
      // 5-Day Evaluation
      fiveDayNurseName: '',
      fiveDayEvaluationDate: null,
      fiveDayEmail: '',
      fiveDayContactNumber: '',
      fiveDayAdverseChanges: '',
      fiveDayFollowUp: '',
      fiveDaySignature: null,
      // 30-Day Evaluation
      thirtyDayNurseName: '',
      thirtyDayEvaluationDate: null,
      thirtyDayEmail: '',
      thirtyDayContactNumber: '',
      thirtyDayHealthHistoryInfo: false,
      thirtyDayHRSTMonthlyData: false,
      thirtyDayServiceAgreement: false,
      thirtyDayFrailHealth: '',
      thirtyDayFrailHealthDescription: '',
      thirtyDayFollowUp: '',
      thirtyDayNotes: '',
      thirtyDaySignature: null,
    },
  });

  const fiveDaySignatureValue = watch('fiveDaySignature');
  const thirtyDaySignatureValue = watch('thirtyDaySignature');
  const fiveDaySignatureMethodValue = watch("fiveDaySignatureMethod");
  const thirtyDaySignatureMethodValue = watch("thirtyDaySignatureMethod");
  const fiveDaySig = useSignature('fiveDaySignature', setValue as UseFormSetValue<FieldValues>, fiveDaySignatureValue, mode === 'view', fiveDaySignatureMethodValue);
  const thirtyDaySig = useSignature('thirtyDaySignature', setValue as UseFormSetValue<FieldValues>, thirtyDaySignatureValue, mode === 'view', thirtyDaySignatureMethodValue);

  // Fetch draft form details when mode="draft" and consentUuid exists
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

    if ((mode === "draft" || mode === "view") && draftFormDetails?.form_json && dataUpdatedAt !== lastPrefillTimestampRef.current) {
      const formJson = draftFormDetails.form_json;
      
      if (formJson && typeof formJson === 'object' && Object.keys(formJson).length > 0) {
        // List of date field names
        const dateFields = ['dateOfTransition', 'fiveDayEvaluationDate', 'thirtyDayEvaluationDate'];

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
        console.warn('Nursing Transition - No form_json data to prefill:', formJson);
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
        // Reset form with existing data
        reset(formJson);
        hasResetFormRef.current = true;
      }
    }
    // Reset the ref when drawer closes
    if (!open) {
      hasResetFormRef.current = false;
    }
  }, [open, mode, existingFormData, reset]);

  // Reset form when drawer opens (if no existing data)
  useEffect(() => {
    if (!open) return;

    // Only reset to defaults if we don't have existing data
    if (!existingFormData?.form_json) {
      reset({
        individualName: individualName || '',
        region: '',
        address: '',
        dateOfTransition: null,
        vendorAgencyName: '',
        fiveDayNurseName: '',
        fiveDayEvaluationDate: null,
        fiveDayEmail: '',
        fiveDayContactNumber: '',
        fiveDayAdverseChanges: '',
        fiveDayFollowUp: '',
        fiveDaySignature: null,
        thirtyDayNurseName: '',
        thirtyDayEvaluationDate: null,
        thirtyDayEmail: '',
        thirtyDayContactNumber: '',
        thirtyDayHealthHistoryInfo: false,
        thirtyDayHRSTMonthlyData: false,
        thirtyDayServiceAgreement: false,
        thirtyDayFrailHealth: '',
        thirtyDayFrailHealthDescription: '',
        thirtyDayFollowUp: '',
        thirtyDayNotes: '',
        thirtyDaySignature: null,
      });
    }

    setActiveTab(0);
  }, [open, reset, individualName, existingFormData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

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
      // Build form_json payload - all form fields go here (signatures are already in form data via useSignature hook)
      const form_json: Record<string, any> = { ...data };

      // Convert dayjs dates to ISO strings if they exist
      if (form_json.dateOfTransition && dayjs.isDayjs(form_json.dateOfTransition)) {
        form_json.dateOfTransition = form_json.dateOfTransition.toISOString();
      }
      if (form_json.fiveDayEvaluationDate && dayjs.isDayjs(form_json.fiveDayEvaluationDate)) {
        form_json.fiveDayEvaluationDate = form_json.fiveDayEvaluationDate.toISOString();
      }
      if (form_json.thirtyDayEvaluationDate && dayjs.isDayjs(form_json.thirtyDayEvaluationDate)) {
        form_json.thirtyDayEvaluationDate = form_json.thirtyDayEvaluationDate.toISOString();
      }

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

  const handleSaveDraft = () => {
    // For draft, bypass validation and submit with current form values
    const currentValues = getValues();
    onSubmit(currentValues, 'DRAFT');
  };

  const handleCancel = () => {
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  // Reset mutations when drawer closes to prevent stuck disabled buttons upon reopening
  useEffect(() => {
    if (!open) {
      createConsentFormMutationHook.reset();
      updateConsentFormMutationHook.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const renderSignatureSection = (sig: ReturnType<typeof useSignature>) => {
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
  {/* ✅ Form name updated */}
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
      {/* <CustomButton
        variant="text"
        size="sm"
        icon={<Print />}
        onClick={handlePrint}
      >
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
        {/* Print Button */}
        
         
        

        <form onSubmit={(e) => {
          e.preventDefault();
          if (mode !== "view") {
            handleSubmit((data) => onSubmit(data, 'COMPLETED'))(e);
          }
        }}>
          {/* Individual's Name - Display Only */}
            {/* Basic Information Card */}
            <Grid
              container
              spacing={2}
              sx={{
                padding: '16px',
                border: '1px solid #E7E9EB',
                borderRadius: '8px',
                marginBottom: '24px',
              }}
            >
            <CustomLabel label="Basic Information" />
              <Grid container spacing={2} sx={{ marginTop: '8px' }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                <CustomLabel label="Region" />
                <Controller
                  name="region"
                  control={control}
                  render={({ field }) => (
                    <CustomInput
                      name="region"
                      placeholder="Enter"
                      value={field.value}
                      onChange={field.onChange}
                      bgWhite
                      disableField={mode === "view"}
                    />
                  )}
                />
              </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomLabel label="Address" />
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <CustomInput
                      name="address"
                      placeholder="Enter"
                      value={field.value}
                      onChange={field.onChange}
                      bgWhite
                      disableField={mode === "view"}
                    />
                  )}
                />
              </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomLabel label="Date of Transition / Move" />
                <Controller
                  name="dateOfTransition"
                  control={control}
                  render={({ field }) => (
                    <DatePickerField
                      name="dateOfTransition"
                      value={field.value}
                      onChange={field.onChange}
                      useCustomStyle={false}
                      disabled={mode === "view"}
                    />
                  )}
                />
              </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomLabel label="Vendor Agency Name" />
                <Controller
                  name="vendorAgencyName"
                  control={control}
                  render={({ field }) => (
                    <CustomInput
                      name="vendorAgencyName"
                      placeholder="Enter"
                      value={field.value}
                      onChange={field.onChange}
                      bgWhite
                      disableField={mode === "view"}
                    />
                  )}
                />
              </Grid>
            </Grid>
            </Grid>

            {/* Evaluation Tabs */}
            <Grid sx={{ borderBottom: 1, borderColor: 'divider', marginBottom: '24px' }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#757775',
                    fontFamily: '"Helvetica Neue", Arial, sans-serif',
                    '&.Mui-selected': {
                      color: '#0A2E45',
                    },
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#0A2E45',
                  },
                }}
              >
                <Tab label="5-Day Evaluation" />
                <Tab label="30-Day Evaluation" />
              </Tabs>
            </Grid>

            {/* 5-Day Evaluation Tab Panel */}
            <TabPanel value={activeTab} index={0}>
              <Grid
                container
                spacing={2}
                sx={{
                  padding: '16px',
                  border: '1px solid #E7E9EB',
                  borderRadius: '8px',
                }}
              >
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomLabel label="Licensed Nurse Name" />
                  <Controller
                    name="fiveDayNurseName"
                    control={control}
                    render={({ field }) => (
                      <CustomInput
                        name="fiveDayNurseName"
                        placeholder="Enter"
                        value={field.value}
                        onChange={field.onChange}
                      bgWhite
                      disableField={mode === "view"}
                    />
                    )}
                  />
                </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomLabel label="Date of 5-Day Evaluation" />
                  <Controller
                    name="fiveDayEvaluationDate"
                    control={control}
                    render={({ field }) => (
                      <DatePickerField
                        name="fiveDayEvaluationDate"
                        value={field.value}
                        onChange={field.onChange}
                      useCustomStyle={false}
                      disabled={mode === "view"}
                    />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomLabel label="Email" />
                  <Controller
                    name="fiveDayEmail"
                    control={control}
                    render={({ field }) => (
                      <CustomInput
                        name="fiveDayEmail"
                        placeholder="Enter"
                        value={field.value}
                        onChange={field.onChange}
                        bgWhite
                        disableField={mode === "view"}
                        hasError={!!errors.fiveDayEmail}
                        errorMessage={errors.fiveDayEmail?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomLabel label="Phone Number" />
                  <Controller
                    name="fiveDayContactNumber"
                    control={control}
                    render={({ field }) => (
                      <CustomInput
                        name="fiveDayContactNumber"
                        placeholder="Enter"
                        value={field.value}
                        onChange={field.onChange}
                      bgWhite
                      disableField={mode === "view"}
                    />
                    )}
                  />
                </Grid>
                  <Grid size={{ xs: 12 }}>
                    <CustomLabel label="Adverse Changes After Transition" />
                    <Controller
                      name="fiveDayAdverseChanges"
                      control={control}
                      render={({ field }) => (
                        <CustomTextArea
                          name="fiveDayAdverseChanges"
                          placeholder="Enter"
                          value={field.value}
                          onChange={field.onChange}
                          minRow={4}
                          isDisabled={mode === "view"}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <CustomLabel label="Follow-up Needed" />
                    <Controller
                      name="fiveDayFollowUp"
                      control={control}
                      render={({ field }) => (
                        <CustomTextArea
                          name="fiveDayFollowUp"
                          placeholder="Enter"
                          value={field.value}
                          onChange={field.onChange}
                          minRow={4}
                          isDisabled={mode === "view"}
                        />
                      )}
                    />
                  </Grid>
              </Grid>

                {/* Nurse Signature Section */}
                <Grid size={{ xs: 12 }} sx={{ marginTop: '24px' }}>
                  <CustomLabel label="Nurse Signature" />
                  {renderSignatureSection(fiveDaySig)}
                </Grid>
              </Grid>
            </TabPanel>

            {/* 30-Day Evaluation Tab Panel */}
            <TabPanel value={activeTab} index={1}>
              <Grid
                container
                spacing={2}
                sx={{
                  padding: '16px',
                  border: '1px solid #E7E9EB',
                  borderRadius: '8px',
                }}
              >
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomLabel label="Licensed Nurse Name" />
                    <Controller
                      name="thirtyDayNurseName"
                      control={control}
                      render={({ field }) => (
                        <CustomInput
                          name="thirtyDayNurseName"
                          placeholder="Enter"
                          value={field.value}
                          onChange={field.onChange}
                      bgWhite
                      disableField={mode === "view"}
                    />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomLabel label="Date of 30-Day Evaluation" />
                    <Controller
                      name="thirtyDayEvaluationDate"
                      control={control}
                      render={({ field }) => (
                        <DatePickerField
                          name="thirtyDayEvaluationDate"
                          value={field.value}
                          onChange={field.onChange}
                      useCustomStyle={false}
                      disabled={mode === "view"}
                    />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomLabel label="Email" />
                    <Controller
                      name="thirtyDayEmail"
                      control={control}
                      render={({ field }) => (
                        <CustomInput
                          name="thirtyDayEmail"
                          placeholder="Enter"
                          value={field.value}
                          onChange={field.onChange}
                          bgWhite
                          disableField={mode === "view"}
                          hasError={!!errors.thirtyDayEmail}
                          errorMessage={errors.thirtyDayEmail?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomLabel label="Phone Number" />
                    <Controller
                      name="thirtyDayContactNumber"
                      control={control}
                      render={({ field }) => (
                        <CustomInput
                          name="thirtyDayContactNumber"
                          placeholder="Enter"
                          value={field.value}
                          onChange={field.onChange}
                      bgWhite
                      disableField={mode === "view"}
                    />
                      )}
                    />
                  </Grid>

                  {/* Checkboxes */}
                  <Grid size={{ xs: 12 }}>
                    <Grid container spacing={2} direction="column" sx={{ marginTop: '8px' }}>
                      <Grid>
                        <Controller
                          name="thirtyDayHealthHistoryInfo"
                          control={control}
                          render={({ field }) => (
                            <CustomCheckbox
                              checked={field.value}
                              onChange={(checked) => field.onChange(checked)}
                              label="Health History Information"
                              disabled={mode === "view"}
                            />
                          )}
                        />
                      </Grid>
                      <Grid>
                        <Controller
                          name="thirtyDayHRSTMonthlyData"
                          control={control}
                          render={({ field }) => (
                            <CustomCheckbox
                              checked={field.value}
                              onChange={(checked) => field.onChange(checked)}
                              label="HRST Monthly Data Tracker"
                              disabled={mode === "view"}
                            />
                          )}
                        />
                      </Grid>
                      <Grid>
                        <Controller
                          name="thirtyDayServiceAgreement"
                          control={control}
                          render={({ field }) => (
                            <CustomCheckbox
                              checked={field.value}
                              onChange={(checked) => field.onChange(checked)}
                              label="Service Agreement Present"
                              disabled={mode === "view"}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* Frail Health Radio Buttons */}
                  <Grid size={{ xs: 12 }}>
                    <CustomLabel label="Frail Health (He-M 1201.02 (m))" />
                    <Controller
                      name="thirtyDayFrailHealth"
                      control={control}
                      render={({ field }) => (
                        <Grid container spacing={3} sx={{ marginTop: '8px' }}>
                          <Grid>
                            <CustomRadio
                              checked={field.value === 'yes'}
                              onChange={(checked, value) => {
                                if (checked && value) {
                                  field.onChange(value);
                                }
                              }}
                              label="Yes"
                              value="yes"
                              disabled={mode === "view"}
                            />
                          </Grid>
                          <Grid>
                            <CustomRadio
                              checked={field.value === 'no'}
                              onChange={(checked, value) => {
                                if (checked && value) {
                                  field.onChange(value);
                                }
                              }}
                              label="No"
                              value="no"
                              disabled={mode === "view"}
                            />
                          </Grid>
                        </Grid>
                      )}
                    />
                  </Grid>

                  {/* If Yes, Please Describe - Conditional */}
                  {watch('thirtyDayFrailHealth') === 'yes' && (
                    <Grid size={{ xs: 12 }}>
                      <CustomLabel label="If Yes, Please Describe" />
                      <Controller
                        name="thirtyDayFrailHealthDescription"
                        control={control}
                        render={({ field }) => (
                          <CustomTextArea
                            name="thirtyDayFrailHealthDescription"
                            placeholder="Enter"
                            value={field.value}
                            onChange={field.onChange}
                            minRow={4}
                          />
                        )}
                      />
                    </Grid>
                  )}

                  <Grid size={{ xs: 12 }}>
                    <CustomLabel label="Follow-up Needed" />
                    <Controller
                      name="thirtyDayFollowUp"
                      control={control}
                      render={({ field }) => (
                        <CustomTextArea
                          name="thirtyDayFollowUp"
                          placeholder="Enter"
                          value={field.value}
                          onChange={field.onChange}
                          minRow={4}
                          isDisabled={mode === "view"}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <CustomLabel label="Notes" />
                    <Controller
                      name="thirtyDayNotes"
                      control={control}
                      render={({ field }) => (
                        <CustomTextArea
                          name="thirtyDayNotes"
                          placeholder="Enter"
                          value={field.value}
                          onChange={field.onChange}
                          minRow={4}
                          isDisabled={mode === "view"}
                        />
                      )}
                    />
                  </Grid>
              </Grid>

                {/* Nurse Signature Section */}
                <Grid size={{ xs: 12 }} sx={{ marginTop: '24px' }}>
                  <CustomLabel label="Nurse Signature" />
                  {renderSignatureSection(thirtyDaySig)}
                </Grid>
              </Grid>
            </TabPanel>
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
                    onClick={handleSubmit((data) => onSubmit(data, 'COMPLETED'))}
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

export default NursingTransitionEvaluationDrawer;

