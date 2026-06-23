import React, { useState, useEffect, useRef } from 'react';
import { Grid, IconButton, Stepper, Step, StepLabel, Typography, StepConnector } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import dayjs from 'dayjs';
import { serviceAgreementFormSchema } from './serviceAgreement.schema';
import CustomDrawer from '../../../../../components/custom-drawer/custom-drawer';
import CustomButton from '../../../../../components/custom-buttons/custom-buttons';
import CommonSnackbar from '../../../../../components/common-snackbar/common-snackbar';
import { 
  createConsentFormMutation,
  getConsentFormDetailOptions,
  updateConsentFormMutation,
} from '../../../../../sdk/@tanstack/react-query.gen';
import Step1GeneralInformation from './steps/Step1GeneralInformation';
import Step2Diagnoses from './steps/Step2Diagnoses';
import Step3Guardianship from './steps/Step3Guardianship';
import Step4RepPayee from './steps/Step4RepPayee';

export interface ServiceAgreementDrawerProps {
  open: boolean;
  onClose: () => void;
  formName: string;
  leadName?: string;
  leadUuid?: string;
  consentUuid?: string | null;
  mode?: "new" | "draft" | "view";
  signerType?: "GUARDIAN" | "AGENT";
  onAfterSave?: () => void;
  onAfterSubmit?: () => void;
}

// Helper function to convert form name to form_code (all caps with underscores)
const getFormCode = (formName: string): string => {
  return formName.toUpperCase().replace(/\s+/g, '_');
};

interface FormStep {
  id: string;
  label: string;
  number: number;
}

const steps: FormStep[] = [
  { id: 'general-info', label: 'General Information', number: 1 },
  { id: 'diagnoses', label: 'Diagnoses', number: 2 },
  { id: 'guardianship', label: 'Guardianship', number: 3 },
  { id: 'rep-payee', label: 'Rep Payee', number: 4 },
];

// Field names that belong to each step, used by react-hook-form's `trigger()`
// to validate ONLY the current step when the user clicks "Next". Without this
// the form used to skip validation on intermediate steps and then fail with
// cryptic errors at final submit (because errors were on a previous step).
const STEP_FIELDS: Record<number, string[]> = {
  0: [
    'meetingDate', 'startDate', 'endDate', 'certificationBeginDate', 'certificationEndDate',
    'firstName', 'middleName', 'lastName', 'dob', 'email', 'phone', 'midNumber',
    'mailingAddress', 'mailingCityStZip', 'residentialAddress', 'residentialCityStZip',
    'region', 'duckNumber', 'waiver', 'servicesDeliveredByPDMS',
    'guardianName', 'guardianPhone', 'guardianEmail', 'guardianAddress', 'guardianCityStZip', 'guardianType',
    'coGuardianName', 'coGuardianPhone', 'coGuardianEmail', 'coGuardianAddress', 'coGuardianCityStZip', 'coGuardianType',
    'thirdGuardianName', 'thirdGuardianPhone', 'thirdGuardianEmail', 'thirdGuardianAddress', 'thirdGuardianCityStZip', 'thirdGuardianType',
    'emergencyContactName', 'emergencyContactRelationship', 'emergencyContactPhone', 'emergencyContactEmail', 'emergencyContactAddress', 'emergencyContactCityStZip',
    'familyRepresentativeName', 'familyRepresentativePhone', 'familyRepresentativeEmail', 'familyRepresentativeAddress', 'familyRepresentativeCityStZip',
    'backupProviderName', 'backupProviderPhone', 'backupProviderEmail', 'backupProviderAddress', 'backupProviderCityStZip',
  ],
  1: [
    'allergies', 'healthCareLevel', 'medicallyFragile',
    'diagnosis1', 'diagnosis2', 'diagnosis3', 'diagnosis4', 'diagnosis5',
    'diagnosis6', 'diagnosis7', 'diagnosis8', 'diagnosis9', 'diagnosis10',
  ],
  2: [
    'isMinor', 'noGuardian', 'isGuardianNeeded', 'guardianInProcess', 'inProcessOfApplyingFor',
    'hasGuardian', 'coGuardian', 'thirdGuardian',
    'typeOfGuardianship', 'coGuardianTypeOfGuardianship', 'thirdGuardianTypeOfGuardianship',
    'comments',
  ],
  3: [
    'hasRepPayee', 'repPayeeName', 'repPayeePhone',
    'repPayeeResidentialAddress', 'repPayeeMailingAddress', 'amountOfMonthlySpendingMoney',
  ],
};

// Custom Step Connector with blue vertical line
const CustomStepConnector = () => (
  <StepConnector
    sx={{
      '& .MuiStepConnector-line': {
        borderLeftWidth: 3,
        borderColor: '#E3ECEF',
        minHeight: 40,
      },
      '&.Mui-active .MuiStepConnector-line': {
        borderColor: '#0A2E45',
      },
      '&.Mui-completed .MuiStepConnector-line': {
        borderColor: '#4CAF50',
      },
    }}
  />
);

// Helper function to extract backend message
const getBackendMessage = (data: unknown): string | undefined => {
  const responseData = data as Record<string, unknown>;
  const nestedData = responseData?.data as Record<string, unknown> | undefined;
  return (
    (responseData?.message as string) ??
    (nestedData?.message as string) ??
    (responseData?.detail as string) ??
    undefined
  );
};

// Helper function to extract error message
const getErrorMessage = (error: unknown): string | undefined => {
  const err = error as AxiosError<Record<string, unknown>>;
  const respData = err?.response?.data as Record<string, unknown> | undefined;
  const errData = err?.data as Record<string, unknown> | undefined;
  return (
    (respData?.message as string) ??
    (respData?.error as string) ??
    (respData?.detail as string) ??
    (errData?.message as string) ??
    (errData?.error as string) ??
    (errData?.detail as string) ??
    undefined
  );
};

const ServiceAgreementDrawer: React.FC<ServiceAgreementDrawerProps> = ({
  open,
  onClose,
  formName,
  leadName,
  leadUuid,
  consentUuid,
  mode = "new",
  signerType,
  onAfterSave,
  onAfterSubmit,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
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
  const didPrefillRef = useRef(false);
  const contentRef = useRef<HTMLElement>(null);

  const { control, handleSubmit, watch, setValue, reset, getValues, trigger, formState: { errors } } = useForm({
    mode: "onChange",
    resolver: yupResolver(serviceAgreementFormSchema) as any,
    defaultValues: {
      // Step 1: General Information
      meetingDate: null,
      startDate: null,
      endDate: null,
      certificationBeginDate: null,
      certificationEndDate: null,
      firstName: '',
      middleName: '',
      lastName: '',
      dob: null,
      email: '',
      phone: '',
      midNumber: '',
      mailingAddress: '',
      mailingCityStZip: '',
      residentialAddress: '',
      residentialCityStZip: '',
      region: '',
      duckNumber: '',
      waiver: '',
      servicesDeliveredByPDMS: false,
      guardianName: '',
      guardianPhone: '',
      guardianEmail: '',
      guardianAddress: '',
      guardianCityStZip: '',
      guardianType: '',
      coGuardianName: '',
      coGuardianPhone: '',
      coGuardianEmail: '',
      coGuardianAddress: '',
      coGuardianCityStZip: '',
      coGuardianType: '',
      thirdGuardianName: '',
      thirdGuardianPhone: '',
      thirdGuardianEmail: '',
      thirdGuardianAddress: '',
      thirdGuardianCityStZip: '',
      thirdGuardianType: '',
      emergencyContactName: '',
      emergencyContactRelationship: '',
      emergencyContactPhone: '',
      emergencyContactEmail: '',
      emergencyContactAddress: '',
      emergencyContactCityStZip: '',
      familyRepresentativeName: '',
      familyRepresentativePhone: '',
      familyRepresentativeEmail: '',
      familyRepresentativeAddress: '',
      familyRepresentativeCityStZip: '',
      backupProviderName: '',
      backupProviderPhone: '',
      backupProviderEmail: '',
      backupProviderAddress: '',
      backupProviderCityStZip: '',
      
      // Step 2: Diagnoses
      allergies: '',
      healthCareLevel: '',
      medicallyFragile: false,
      diagnosis1: '',
      diagnosis2: '',
      diagnosis3: '',
      diagnosis4: '',
      diagnosis5: '',
      diagnosis6: '',
      diagnosis7: '',
      diagnosis8: '',
      diagnosis9: '',
      diagnosis10: '',
      
      // Step 3: Guardianship
      isMinor: false,
      noGuardian: false,
      isGuardianNeeded: false,
      guardianInProcess: false,
      inProcessOfApplyingFor: false,
      hasGuardian: false,
      coGuardian: false,
      thirdGuardian: false,
      typeOfGuardianship: '',
      coGuardianTypeOfGuardianship: '',
      thirdGuardianTypeOfGuardianship: '',
      comments: '',
      
      // Step 4: Rep Payee
      hasRepPayee: false,
      repPayeeName: '',
      repPayeePhone: '',
      repPayeeResidentialAddress: '',
      repPayeeMailingAddress: '',
      amountOfMonthlySpendingMoney: '',
    },
  });

  const isLastStep = activeStep === steps.length - 1;

  // Flag that's flipped true when the user clicks Next on an invalid step.
  // Passed into Step1 so DOB (which has special "don't show error until
  // interacted with" UX) will force-show its error and render aria-invalid,
  // letting the scroll-to-error fallback find it. Reset whenever the user
  // navigates to a different step so each step starts clean.
  const [showAllErrors, setShowAllErrors] = useState(false);

  useEffect(() => {
    setShowAllErrors(false);
  }, [activeStep]);

  // Handle step click
  const handleStepClick = (stepIndex: number) => {
    // Allow navigation in view mode
    if (mode === "view") {
      setActiveStep(stepIndex);
      return;
    }
    
    // In edit mode, allow navigation without validation
    setActiveStep(stepIndex);
  };

  // Handle next step
  const handleNext = async () => {
    if (mode === "view") {
      if (!isLastStep) setActiveStep(prev => prev + 1);
      return;
    }

    // Validate only the fields that belong to the current step. This prevents
    // the user from advancing with invalid data on this step, and also avoids
    // being blocked at final submit by stale errors from earlier steps.
    // `shouldFocus: true` tells RHF to focus the first invalid field, which
    // also scrolls it into view via the native focus handler.
    const currentStepFields = STEP_FIELDS[activeStep] ?? [];
    const isStepValid = await trigger(currentStepFields as any, {
      shouldFocus: true,
    });

    // Also enforce the "DOB is required" rule that isn't expressible via
    // yup alone when the form still starts with a null default — RHF's
    // required check fires via `.required()` on the schema, so this branch
    // usually overlaps with `!isStepValid`, but we keep the explicit guard
    // for clarity.
    const dobMissing = activeStep === 0 && !getValues('dob');

    if (!isStepValid || dobMissing) {
      // Force DOB (and any other gated fields) to render their errors
      // immediately, even if the user never touched them.
      setShowAllErrors(true);

      // Get a fresh, authoritative list of errored field paths by running
      // the yup schema synchronously. `validateSync` + `abortEarly: false`
      // collects every failing field into `err.inner`. This bypasses any
      // react-hook-form closure / proxy timing issues entirely.
      const erroredFields = new Set<string>();
      try {
        serviceAgreementFormSchema.validateSync(getValues(), {
          abortEarly: false,
        });
      } catch (err) {
        const validationErr = err as { inner?: Array<{ path?: string }> };
        (validationErr.inner || []).forEach((e) => {
          if (e.path) erroredFields.add(e.path);
        });
      }

      // Walk STEP_FIELDS in declared order (mirrors the on-screen field
      // order) and pick the first errored field. Simple "first invalid
      // wins" — no matter which field it is.
      const firstErrorField = currentStepFields.find((field) =>
        erroredFields.has(field),
      );

      // Deferred by two animation frames so the setShowAllErrors state update
      // has flushed and the DOM has re-painted with error styling before we
      // measure / scroll. Scoped to the content panel so stray same-named
      // elements outside the drawer are never matched.
      if (firstErrorField) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const container = contentRef.current ?? document.documentElement;
            const el =
              container.querySelector<HTMLElement>(`[name="${firstErrorField}"]`) ??
              container.querySelector<HTMLElement>(`[data-field="${firstErrorField}"]`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          });
        });
      }
      return;
    }

    // Step passed validation — clear the force-show flag so we're back in
    // the "only show errors for touched fields" mode on the next step.
    setShowAllErrors(false);

    // Mark current step as completed
    setCompletedSteps(prev => new Set([...prev, activeStep]));

    if (isLastStep) {
      // Submit form
      handleSubmit(onSubmit)();
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // Create consent form mutation
  const createConsentFormMutationHook = useMutation({
    ...createConsentFormMutation(),
    onSuccess: (_data) => {
      setSnackbar({
        isOpen: true,
        message: 'Form saved successfully',
        status: 'success',
      });
      if (onAfterSave) {
        onAfterSave();
      }
      if (onAfterSubmit) {
        onAfterSubmit();
      }
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error) || 'Failed to save form';
      setSnackbar({
        isOpen: true,
        message: errorMessage,
        status: 'error',
      });
    },
  });

  // Update consent form mutation (for draft updates)
  const updateConsentFormMutationHook = useMutation({
    ...updateConsentFormMutation(),
    onSuccess: (data) => {
      const backendMessage = getBackendMessage(data);
      setSnackbar({
        isOpen: true,
        message: backendMessage || 'Form updated successfully',
        status: 'success',
      });
      if (onAfterSave) {
        onAfterSave();
      }
      if (onAfterSubmit) {
        onAfterSubmit();
      }
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error) || 'Failed to update form';
      setSnackbar({
        isOpen: true,
        message: errorMessage,
        status: 'error',
      });
    },
  });

  // Handle save draft
  const handleSaveDraft = async () => {
    if (mode === "view") return;
    
    const formData = getValues();
    const formJson: Record<string, unknown> = { ...formData };

    // Convert dates to strings
    Object.keys(formData).forEach((key) => {
      const value = (formData as Record<string, unknown>)[key];
      if (value instanceof Date) {
        formJson[key] = dayjs(value).format('YYYY-MM-DD');
      } else if (dayjs.isDayjs(value)) {
        formJson[key] = value.format('YYYY-MM-DD');
      }
    });

    // Remove empty string values (but keep null, booleans, arrays)
    Object.keys(formJson).forEach((key) => {
      if (formJson[key] === "" || formJson[key] === undefined) {
        delete formJson[key];
      }
    });

    if (leadUuid) {
      // If mode is "draft" and consentUuid exists, use UPDATE mutation (PUT)
      if (mode === "draft" && consentUuid) {
        // Update existing draft form
        const updatePayload = {
          path: {
            uuid: consentUuid,
          },
          body: {
            status: 'DRAFT',
            form_json: formJson,
          },
        };

        updateConsentFormMutationHook.mutate(updatePayload as any);
      } else {
        // Create new draft (POST)
        createConsentFormMutationHook.mutate({
          body: {
            resident_uuid: leadUuid,
            form_name: formName,
            form_code: getFormCode(formName),
            form_json: formJson,
            status: 'DRAFT',
            frequency_type: 'ONCE',
            filled_at: dayjs().toISOString(),
            ...(signerType ? { signer_type: signerType } : {}),
          },
        } as any);
      }
    }
  };

  // Submit form
  const onSubmit = async (data: Record<string, unknown>) => {
    const formJson: Record<string, unknown> = { ...data };

    // Convert dates to strings
    Object.keys(data).forEach((key) => {
      const value = (data as Record<string, unknown>)[key];
      if (value instanceof Date) {
        formJson[key] = dayjs(value).format('YYYY-MM-DD');
      } else if (dayjs.isDayjs(value)) {
        formJson[key] = value.format('YYYY-MM-DD');
      }
    });

    // Remove empty string values (but keep null, booleans, arrays)
    Object.keys(formJson).forEach((key) => {
      if (formJson[key] === "" || formJson[key] === undefined) {
        delete formJson[key];
      }
    });

    if (leadUuid) {
      // If mode is "draft" and consentUuid exists, use UPDATE mutation (PUT)
      if (mode === "draft" && consentUuid) {
        // Update existing draft form to COMPLETED
        const updatePayload = {
          path: {
            uuid: consentUuid,
          },
          body: {
            status: 'COMPLETED',
            form_json: formJson,
            filled_at: dayjs().toISOString(),
          },
        };

        updateConsentFormMutationHook.mutate(updatePayload as any);
      } else {
        // Create new form (POST)
        createConsentFormMutationHook.mutate({
          body: {
            resident_uuid: leadUuid,
            form_name: formName,
            form_code: getFormCode(formName),
            form_json: formJson,
            status: 'COMPLETED',
            frequency_type: 'ONCE',
            ...(signerType ? { signer_type: signerType } : {}),
            filled_at: dayjs().toISOString(),
          },
        } as any);
      }
    }
  };

  // Prefill form data in draft/view mode
  useEffect(() => {
    if (open && consentUuid && (mode === "draft" || mode === "view") && !didPrefillRef.current) {
      const fetchFormData = async () => {
        try {
          const formData = await queryClient.fetchQuery({
            ...getConsentFormDetailOptions({
              path: { uuid: consentUuid },
              query: { history: false },
            }),
          });

          const responseData = (formData as Record<string, unknown>)?.data ?? formData;
          const rd = responseData as Record<string, unknown>;
          const entries = (rd?.entries as Record<string, unknown>[]) || [];
          const latestEntry = entries[0] || null;
          const formJson = (latestEntry as Record<string, unknown>)?.form_json || rd?.form_json || {};

          if (formJson && Object.keys(formJson).length > 0) {
            // Prefill form with existing data
            Object.keys(formJson).forEach((key) => {
              const value = (formJson as Record<string, unknown>)[key];
              if (value !== null && value !== undefined) {
                if (key.includes('Date') || key.includes('date') || key === 'dob') {
                  setValue(key as any, value ? dayjs(value) : null);
                } else {
                  setValue(key as any, value);
                }
              }
            });
            didPrefillRef.current = true;
          }
        } catch (error) {
          console.error('Error fetching form data:', error);
        }
      };

      fetchFormData();
    }
  }, [open, consentUuid, mode, queryClient, setValue]);

  // Reset form when drawer closes
  useEffect(() => {
    if (!open && !hasResetFormRef.current) {
      reset();
      setActiveStep(0);
      setCompletedSteps(new Set());
      hasResetFormRef.current = true;
      didPrefillRef.current = false;
    } else if (open) {
      hasResetFormRef.current = false;
    }
  }, [open, reset]);

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return <Step1GeneralInformation control={control} watch={watch} mode={mode} errors={errors} showAllErrors={showAllErrors} />;
      case 1:
        return <Step2Diagnoses control={control} mode={mode} />;
      case 2:
        return <Step3Guardianship control={control} mode={mode} />;
      case 3:
        return <Step4RepPayee control={control} watch={watch} mode={mode} />;
      default:
        return null;
    }
  };

  return (
    <CustomDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      drawerWidth="1200px"
      drawermargin="0"
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
            padding: { xs: '10px 16px', sm: '10px 20px' },
            borderBottom: '1px solid #E3ECEF',
            flexShrink: 0,
            gap: { xs: 1, sm: 0 },
            marginTop: "-8px"
          }}
        >
          <Typography
            sx={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#424342',
              fontFamily: 'Geist',
              lineHeight: '24px',
            }}
          >
            {formName}
          </Typography>

          <Grid container alignItems="center" spacing={2}>
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

        {/* Main Content */}
        <Grid
          container
          sx={{
            flex: 1,
            overflow: 'hidden',
            minHeight: 0,
            display: 'flex',
          }}
        >
          {/* Left Sidebar Navigation - MUI Vertical Stepper with Blue Highlight */}
          <Grid
            sx={{
              width: { xs: '100%', sm: '280px' },
              borderRight: { xs: 'none', sm: '1px solid #E3ECEF' },
              borderBottom: { xs: '1px solid #E3ECEF', sm: 'none' },
              backgroundColor: '#FAFBFC',
              overflowY: 'auto',
              overflowX: 'hidden',
              flexShrink: 0,
              p: { xs: 1.5, sm: 2 },
              maxHeight: { xs: '200px', sm: '100%' },
              minHeight: 0,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              '&::-webkit-scrollbar': {
                display: 'none',
              },
            }}
          >
            <Stepper activeStep={activeStep} orientation="vertical" connector={<CustomStepConnector />}>
              {steps.map((step, index) => {
                const isCompleted = completedSteps.has(index);
                const isActive = activeStep === index;

                return (
                  <Step
                    key={step.id}
                    completed={isCompleted}
                    sx={{
                      cursor: 'pointer',
                      '& .MuiStepLabel-root': {
                        cursor: 'pointer',
                      },
                    }}
                    onClick={() => handleStepClick(index)}
                  >
                    <StepLabel
                      sx={{
                        '& .MuiStepLabel-label': {
                          fontSize: '14px',
                          fontWeight: isActive ? 600 : 400,
                          color: isActive ? '#0A2E45' : '#424342',
                        },
                        '& .MuiStepIcon-root': {
                          fontSize: '24px',
                          '&.Mui-active': {
                            color: '#0A2E45',
                          },
                          '&.Mui-completed': {
                            color: '#4CAF50',
                          },
                        },
                      }}
                    >
                      {step.label}
                    </StepLabel>
                  </Step>
                );
              })}
            </Stepper>
          </Grid>

          {/* Right Content Area - Scrollable */}
          <Grid
            ref={contentRef as any}
            sx={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              p: { xs: 1.5, sm: 2, md: 3 },
              minHeight: 0,
              maxHeight: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {renderStepContent()}
          </Grid>
        </Grid>

        {/* Footer - Sticky */}
        <Grid
          size={{ xs: 12 }}
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            padding: { xs: '12px 16px', sm: '16px 24px' },
            borderTop: '1px solid #E3ECEF',
            flexShrink: 0,
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Grid container spacing={2} sx={{ justifyContent: 'flex-end' }}>
            <Grid>
              <CustomButton
                variant="secondary"
                onClick={handleBack}
                disabled={activeStep === 0}
              >
                Back
              </CustomButton>
            </Grid>
            <Grid>
              <CustomButton
                variant="secondary"
                onClick={handleSaveDraft}
                disabled={mode === "view"}
              >
                Save Draft
              </CustomButton>
            </Grid>
            <Grid>
              <CustomButton
                variant="primary"
                onClick={handleNext}
                disabled={mode === "view" && isLastStep}
              >
                {isLastStep ? 'Submit' : 'Next'}
              </CustomButton>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Snackbar */}
      <CommonSnackbar
        isOpen={snackbar.isOpen}
        message={snackbar.message}
        status={snackbar.status}
        onClose={() => setSnackbar({ ...snackbar, isOpen: false })}
      />
    </CustomDrawer>
  );
};

export default ServiceAgreementDrawer;

