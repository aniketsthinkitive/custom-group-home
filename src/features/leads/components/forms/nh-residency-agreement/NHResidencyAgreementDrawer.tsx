import React, { useState, useEffect, useRef } from 'react';
import { Grid, IconButton, Stepper, Step, StepLabel, Typography, Box, StepConnector } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useForm, useWatch } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import dayjs from 'dayjs';
import CustomDrawer from '../../../../../components/custom-drawer/custom-drawer';
import CustomButton from '../../../../../components/custom-buttons/custom-buttons';
import CommonSnackbar from '../../../../../components/common-snackbar/common-snackbar';
import { 
  createConsentFormMutation,
  getConsentFormDetailOptions,
  updateConsentFormMutation,
} from '../../../../../sdk/@tanstack/react-query.gen';
import Step1BasicInformation from './steps/Step1BasicInformation';
import Step3RightsAcknowledgement from './steps/Step3RightsAcknowledgement';
import Step4Responsibilities from './steps/Step4Responsibilities';
import Step4TerminationConditions from './steps/Step4TerminationConditions';
import Step5Signatures from './steps/Step5Signatures';

export interface NHResidencyAgreementDrawerProps {
  open: boolean;
  onClose: () => void;
  formName: string;
  leadName?: string;
  residentialAddress?: string;
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
  { id: 'basic-info', label: 'Basic Information', number: 1 },
  { id: 'rights-ack', label: 'Rights Acknowledgement', number: 2 },
  { id: 'responsibilities', label: 'Responsibilities', number: 3 },
  { id: 'termination-conditions', label: 'Termination Conditions', number: 4 },
  { id: 'signatures', label: 'Signatures', number: 5 },
];

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

const NHResidencyAgreementDrawer: React.FC<NHResidencyAgreementDrawerProps> = ({
  open,
  onClose,
  formName,
  leadName,
  residentialAddress,
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

  const { control, handleSubmit, watch, setValue, reset, getValues } = useForm({
    mode: "onChange",
    defaultValues: {
      // Step 1: Basic Information
      residentName: leadName || '',
      providerName: '',
      residentialAddress: residentialAddress || '',
      
      // Step 2: Agreement Details
      residencyTermFrom: dayjs() as any,
      residencyTermTo: dayjs() as any,
      residencyTerm: '',
      
      // Step 5: Signatures
      residentSignature: '',
      residentSignatureDate: dayjs().toDate(),
      residentPrintName: '',
      legalGuardianSignature: '',
      legalGuardianSignatureDate: dayjs().toDate(),
      legalGuardianPrintName: '',
      providerSignature: '',
      providerSignatureDate: dayjs().toDate(),
      providerPrintName: '',
      signatureMethod: 'DRAW',
    },
  });

  // Manually validate From/To date fields for display only (does NOT block submit)
  const watchedFrom = useWatch({ control, name: 'residencyTermFrom' });
  const watchedTo = useWatch({ control, name: 'residencyTermTo' });

  const dateErrors = (() => {
    const errs: Record<string, { message: string }> = {};
    if (watchedFrom) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const fromDate = watchedFrom instanceof Date ? watchedFrom : new Date(watchedFrom as any);
      if (!isNaN(fromDate.getTime()) && fromDate > today) {
        errs.residencyTermFrom = { message: 'From Date cannot be in the future.' };
      }
    }
    if (watchedTo && watchedFrom) {
      const toDate = watchedTo instanceof Date ? watchedTo : new Date(watchedTo as any);
      const fromDate = watchedFrom instanceof Date ? watchedFrom : new Date(watchedFrom as any);
      if (!isNaN(toDate.getTime()) && !isNaN(fromDate.getTime()) && toDate < fromDate) {
        errs.residencyTermTo = { message: 'To Date cannot be earlier than From Date.' };
      }
    }
    return errs;
  })();

  const isLastStep = activeStep === steps.length - 1;
  const residentSignatureValue = watch("residentSignature");
  const isClientSignatureMissing = !residentSignatureValue;

  // Handle step click
  const handleStepClick = (stepIndex: number) => {
    // Allow navigation in view mode
    if (mode === "view") {
      setActiveStep(stepIndex);
      return;
    }
    setActiveStep(stepIndex);
  };

  // Handle next step
  const handleNext = () => {
    if (mode === "view") {
      // In view mode, allow navigation but not submit
      if (!isLastStep) setActiveStep(prev => prev + 1);
      return;
    }

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

  // Handle save draft
  const handleSaveDraft = async () => {
    if (mode === "view") return;
    
    const formData = getValues();
    const formJson = {
      ...formData,
      residencyTermFrom: formData.residencyTermFrom ? dayjs(formData.residencyTermFrom).format('YYYY-MM-DD') : null,
      residencyTermTo: formData.residencyTermTo ? dayjs(formData.residencyTermTo).format('YYYY-MM-DD') : null,
      residentSignatureDate: formData.residentSignatureDate ? dayjs(formData.residentSignatureDate).format('YYYY-MM-DD') : null,
      legalGuardianSignatureDate: formData.legalGuardianSignatureDate ? dayjs(formData.legalGuardianSignatureDate).format('YYYY-MM-DD') : null,
      providerSignatureDate: formData.providerSignatureDate ? dayjs(formData.providerSignatureDate).format('YYYY-MM-DD') : null,
    };

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

  // Submit form
  const onSubmit = async (data: Record<string, unknown>) => {
    const formJson = {
      ...data,
      residencyTermFrom: data.residencyTermFrom ? dayjs(data.residencyTermFrom).format('YYYY-MM-DD') : null,
      residencyTermTo: data.residencyTermTo ? dayjs(data.residencyTermTo).format('YYYY-MM-DD') : null,
      residentSignatureDate: data.residentSignatureDate ? dayjs(data.residentSignatureDate).format('YYYY-MM-DD') : null,
      legalGuardianSignatureDate: data.legalGuardianSignatureDate ? dayjs(data.legalGuardianSignatureDate).format('YYYY-MM-DD') : null,
      providerSignatureDate: data.providerSignatureDate ? dayjs(data.providerSignatureDate).format('YYYY-MM-DD') : null,
    };

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
            filled_at: dayjs().toISOString(),
            ...(signerType ? { signer_type: signerType } : {}),
          },
        } as any);
      }
    }
  };

  // Prefill form data in draft/view mode or from lead props
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
                if (key.includes('Date') || key === 'residencyTermFrom' || key === 'residencyTermTo') {
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
    } else if (open && mode === "new" && !didPrefillRef.current) {
      if (residentialAddress) {
        setValue('residentialAddress', residentialAddress);
      }
      didPrefillRef.current = true;
    }
  }, [open, consentUuid, mode, queryClient, setValue, residentialAddress]);

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
        return <Step1BasicInformation control={control} leadName={leadName} mode={mode} errors={dateErrors} />;
      case 1:
        return <Step3RightsAcknowledgement control={control} mode={mode} />;
      case 2:
        return <Step4Responsibilities control={control} mode={mode} />;
      case 3:
        return <Step4TerminationConditions control={control} mode={mode} />;
      case 4:
        return <Step5Signatures control={control} setValue={setValue} watch={watch} mode={mode} />;
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
            padding: { xs: '12px 16px', sm: '14px 22px' },
            borderBottom: '1px solid #E3ECEF',
            flexShrink: 0,
            gap: { xs: 1, sm: 0 },
            marginTop: "-10px",
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
              width: { xs: '100%', sm: '250px' },
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
          <CustomButton
            variant="secondary"
            onClick={handleBack}
            disabled={activeStep === 0}
          >
            Back
          </CustomButton>
          <CustomButton
            variant="secondary"
            onClick={handleSaveDraft}
            disabled={mode === "view"}
          >
            Save Draft
          </CustomButton>
          <CustomButton
            variant="primary"
            onClick={handleNext}
            disabled={(mode === "view" && isLastStep) || (isLastStep && mode !== "view" && isClientSignatureMissing)}
          >
            {isLastStep ? 'Submit' : 'Next'}
          </CustomButton>
        </Grid>
      </Grid>

      {/* Snackbar */}
      <CommonSnackbar
        open={snackbar.isOpen}
        message={snackbar.message}
        status={snackbar.status}
        onClose={() => setSnackbar({ ...snackbar, isOpen: false })}
      />
    </CustomDrawer>
  );
};

export default NHResidencyAgreementDrawer;

