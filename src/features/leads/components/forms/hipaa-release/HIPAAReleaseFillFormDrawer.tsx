import React, { useState, useEffect, useRef } from 'react';
import { Grid, IconButton, Stepper, Step, StepLabel, Typography, Box } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
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
  listConsentFormsQueryKey,
} from '../../../../../sdk/@tanstack/react-query.gen';
import Section1BasicInfo from './sections/Section1BasicInfo';
import Section2HealthInfo from './sections/Section2HealthInfo';
import Section3Reason from './sections/Section3Reason';
import Section4Recipient from './sections/Section4Recipient';
import Section5Duration from './sections/Section5Duration';
import Section6Signature from './sections/Section6Signature';

export interface HIPAAReleaseFillFormDrawerProps {
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
  { id: 'basic-info', label: 'Basic Information', number: 1 },
  { id: 'health-info', label: 'Health Information', number: 2 },
  { id: 'reason', label: 'Reason for Disclosure', number: 3 },
  { id: 'recipient', label: 'Recipient Information', number: 4 },
  { id: 'duration', label: 'Authorization Duration', number: 5 },
  { id: 'signature', label: 'Signature', number: 6 },
];

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

const HIPAAReleaseFillFormDrawer: React.FC<HIPAAReleaseFillFormDrawerProps> = ({
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

  const { control, handleSubmit, watch, setValue, reset, getValues } = useForm({
    mode: "onChange",
    defaultValues: {
      // Section 1: Basic Information
      patientName: leadName || '',
      organizationName: '',
      
      // Section 2: Health Information
      discloseCompleteRecord: false,
      discloseCompleteRecordExcept: false,
      exceptMentalHealth: false,
      exceptCommunicableDiseases: false,
      exceptAlcoholDrugAbuse: false,
      exceptGeneticInfo: false,
      exceptOther: false,
      exceptOtherDescription: '',
      formOfDisclosureElectronic: false,
      formOfDisclosureHardCopy: false,
      
      // Section 3: Reason for Disclosure
      reasonForDisclosure1: '',
      reasonForDisclosureDescription: '',
      
      // Section 4: Recipient Information
      recipient_name: '',
      recipient_organization: '',
      recipient_address: '',
      
      // Section 5: Authorization Duration
      durationOptionA: false,
      durationFromDate: dayjs(),
      durationToDate: dayjs(),
      durationOptionB: false,
      durationOptionC: false,
      durationEventDescription: '',
      revocation_name: '',
      revocation_organization: '',
      revocation_address: '',
      
      // Section 6: Signature
      signature: '',
      signatureDate: dayjs(),
      signatureMethod: 'UPLOAD',
      printName: '',
      thirdPartyName: '',
      thirdPartySignature: '',
      legalAuthorityDescription: '',
    },
  });

  const isLastStep = activeStep === steps.length - 1;
  const clientSignatureValue = watch("signature");
  const isClientSignatureMissing = !clientSignatureValue;

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

  // Create consent form mutation
  const createConsentFormMutationHook = useMutation({
    ...createConsentFormMutation(),
    onSuccess: (data) => {
      const backendMessage = getBackendMessage(data);
      setSnackbar({
        isOpen: true,
        message: backendMessage || 'Form saved successfully',
        status: 'success',
      });

      // Invalidate consent forms list to refresh data
      // Invalidate all queries that match the base query key for this resident_uuid
      if (leadUuid) {
        queryClient.invalidateQueries({
          queryKey: listConsentFormsQueryKey({
            query: {
              resident_uuid: leadUuid,
            },
          }),
          exact: false, // This will match queries with additional params like searchQuery
        });
      }

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

      // Invalidate consent forms list to refresh data
      // Invalidate all queries that match the base query key for this resident_uuid
      if (leadUuid) {
        queryClient.invalidateQueries({
          queryKey: listConsentFormsQueryKey({
            query: {
              resident_uuid: leadUuid,
            },
          }),
          exact: false, // This will match queries with additional params like searchQuery
        });
      }

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
            filled_at: dayjs().toISOString(),
            ...(signerType ? { signer_type: signerType } : {}),
          },
        } as any);
      }
    }
  };

  // Fetch existing form data for draft/view mode
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
                if (key.includes('Date') || key.includes('date') || key === 'durationFromDate' || key === 'durationToDate') {
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
        return <Section1BasicInfo control={control} leadName={leadName} mode={mode} />;
      case 1:
        return <Section2HealthInfo control={control} setValue={setValue} mode={mode} />;
      case 2:
        return <Section3Reason control={control} mode={mode} />;
      case 3:
        return <Section4Recipient control={control} mode={mode} />;
      case 4:
        return <Section5Duration control={control} watch={watch} setValue={setValue} mode={mode} />;
      case 5:
        return <Section6Signature control={control} watch={watch} setValue={setValue} mode={mode} />;
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
              // marginBottom: '12px',
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

        {/* Instructions Card */}
        <Grid
          size={{ xs: 12 }}
          sx={{
            px: { xs: 1.5, sm: 2, md: 3 },
            py: 1.5,
            backgroundColor: '#F5F7FA',
            borderBottom: '1px solid #E3ECEF',
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E3ECEF',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#424342',
                mb: 1,
              }}
            >
              Instructions
            </Typography>
            <Typography
              sx={{
                fontSize: '12px',
                color: '#6B7280',
                lineHeight: '1.5',
              }}
            >
              This authorization allows the disclosure of protected health information as specified below. 
              You have the right to revoke this authorization at any time, except to the extent that action 
              has already been taken in reliance on this authorization. Please complete all required fields 
              and sign the form to authorize the release of information.
            </Typography>
          </Box>
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
          {/* Left Sidebar Navigation - MUI Vertical Stepper */}
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
            <Stepper activeStep={activeStep} orientation="vertical">
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
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              '&::-webkit-scrollbar': {
                display: 'none',
              },
            }}
          >
            {renderStepContent()}
          </Grid>
        </Grid>

        {/* Footer */}
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
          {activeStep > 0 && (
            <CustomButton
              variant="secondary"
              onClick={handleBack}
            >
              Back
            </CustomButton>
          )}
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

export default HIPAAReleaseFillFormDrawer;

