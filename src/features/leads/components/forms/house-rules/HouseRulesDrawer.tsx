import React, { useState, useEffect, useRef } from 'react';
import { Grid, IconButton, Stepper, Step, StepLabel, Typography, StepConnector } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
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
import Step1Rules from './steps/Step1Rules';
import Step2PropertyDamage from './steps/Step2PropertyDamage';
import Step3Signatures from './steps/Step3Signatures';
import { houseRulesFormSchema } from './houseRules.schema';

export interface HouseRulesDrawerProps {
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

// Form code constant
const FORM_CODE = 'CAFC_HOUSE_RULES';

interface FormStep {
  id: string;
  label: string;
  number: number;
}

const steps: FormStep[] = [
  { id: 'rules', label: 'Rules', number: 1 },
  { id: 'property-damage', label: 'Property Damage Consequences', number: 2 },
  { id: 'signatures', label: 'Signatures', number: 3 },
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

// Helper function to extract error message
const getErrorMessage = (error: unknown): string | undefined => {
  const err = error as AxiosError<Record<string, unknown>>;
  const respData = err?.response?.data as Record<string, unknown> | undefined;
  return (
    (respData?.message as string) ??
    (respData?.error as string) ??
    (respData?.detail as string) ??
    undefined
  );
};

const HouseRulesDrawer: React.FC<HouseRulesDrawerProps> = ({
  open,
  onClose,
  formName,
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

  const { control, handleSubmit, setValue, reset, getValues, trigger, watch, formState: { errors } } = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(houseRulesFormSchema) as any,
    mode: "onChange",
    defaultValues: {
      // Step 3: Signatures
      program_manager_name: '',
      program_manager_date: dayjs(),
      guardian_signature: '',
      guardian_date: dayjs(),
      case_manager_signature: '',
      case_manager_date: dayjs(),
      client_signature: '',
      client_date: dayjs(),
      signatureMethod: 'DRAW',
    },
  });

  const isLastStep = activeStep === steps.length - 1;
  const clientSignatureValue = watch("client_signature");
  const isClientSignatureMissing = !clientSignatureValue;

  // Get fields for each step that need validation
  const getStepFields = (stepIndex: number): string[] => {
    switch (stepIndex) {
      case 0: // Step 1: Rules (no validation needed, just display)
        return [];
      case 1: // Step 2: Property Damage (no validation needed, just display)
        return [];
      case 2: // Step 3: Signatures (no validation needed)
        return [];
      default:
        return [];
    }
  };

  // Handle step click
  const handleStepClick = async (stepIndex: number) => {
    // Allow navigation in view mode
    if (mode === "view") {
      setActiveStep(stepIndex);
      return;
    }
    
    // Validate current step before allowing navigation
    if (activeStep < stepIndex) {
      const fieldsToValidate = getStepFields(activeStep);
      if (fieldsToValidate.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isValid = await trigger(fieldsToValidate as any);
        if (!isValid) {
          return;
        }
      }
      // Mark current step as completed
      setCompletedSteps(prev => new Set([...prev, activeStep]));
    }
    setActiveStep(stepIndex);
  };

  // Handle next step
  const handleNext = async () => {
    if (mode === "view") {
      if (!isLastStep) setActiveStep(prev => prev + 1);
      return;
    }

    const fieldsToValidate = getStepFields(activeStep);
    if (fieldsToValidate.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isValid = await trigger(fieldsToValidate as any);

      if (!isValid) {
        setSnackbar({
          isOpen: true,
          message: 'Please fill in all required fields before proceeding',
          status: 'error',
        });
        return;
      }
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

  // Create consent form mutation
  const createConsentFormMutationHook = useMutation({
    ...createConsentFormMutation(),
    onSuccess: () => {
      const isDraft = !getValues().program_manager_name || !getValues().guardian_signature;
      setSnackbar({
        isOpen: true,
        message: isDraft ? 'Form saved successfully' : 'Form submitted successfully',
        status: 'success',
      });
      if (isDraft && onAfterSave) {
        onAfterSave();
      } else if (!isDraft && onAfterSubmit) {
        onAfterSubmit();
      }
      // Close drawer after successful API call
      setTimeout(() => {
        onClose();
      }, 1000);
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

  // Update consent form mutation
  const updateConsentFormMutationHook = useMutation({
    ...updateConsentFormMutation(),
    onSuccess: () => {
      const isDraft = !getValues().program_manager_name || !getValues().guardian_signature;
      setSnackbar({
        isOpen: true,
        message: isDraft ? 'Form updated successfully' : 'Form submitted successfully',
        status: 'success',
      });
      if (isDraft && onAfterSave) {
        onAfterSave();
      } else if (!isDraft && onAfterSubmit) {
        onAfterSubmit();
      }
      // Close drawer after successful API call
      setTimeout(() => {
        onClose();
      }, 1000);
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
    const isDateValue = (value: unknown): value is string | Date => {
      return typeof value === 'string' || (value !== null && typeof value === 'object' && value instanceof Date) || dayjs.isDayjs(value);
    };
    const formJson = {
      ...formData,
      program_manager_date: formData.program_manager_date && isDateValue(formData.program_manager_date) ? dayjs(formData.program_manager_date).format('YYYY-MM-DD') : null,
      guardian_date: formData.guardian_date && isDateValue(formData.guardian_date) ? dayjs(formData.guardian_date).format('YYYY-MM-DD') : null,
      case_manager_date: formData.case_manager_date && isDateValue(formData.case_manager_date) ? dayjs(formData.case_manager_date).format('YYYY-MM-DD') : null,
      client_date: formData.client_date && isDateValue(formData.client_date) ? dayjs(formData.client_date).format('YYYY-MM-DD') : null,
    };

    if (consentUuid) {
      // Update existing draft
      updateConsentFormMutationHook.mutate({
        path: { uuid: consentUuid },
        body: {
          form_json: formJson,
          status: 'DRAFT',
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    } else if (leadUuid) {
      // Create new draft
      createConsentFormMutationHook.mutate({
        body: {
          resident_uuid: leadUuid,
          form_name: formName,
          form_code: FORM_CODE,
          form_json: formJson,
          status: 'DRAFT',
          frequency_type: 'ONCE',
          filled_at: dayjs().toISOString(),
          ...(signerType ? { signer_type: signerType } : {}),
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    }
  };

  // Submit form
  const onSubmit = async (data: Record<string, unknown>) => {
    const isDateValue = (value: unknown): value is string | Date => {
      return typeof value === 'string' || (value !== null && typeof value === 'object' && value instanceof Date) || dayjs.isDayjs(value);
    };
    const formJson = {
      ...data,
      program_manager_date: data.program_manager_date && isDateValue(data.program_manager_date) ? dayjs(data.program_manager_date).format('YYYY-MM-DD') : null,
      guardian_date: data.guardian_date && isDateValue(data.guardian_date) ? dayjs(data.guardian_date).format('YYYY-MM-DD') : null,
      case_manager_date: data.case_manager_date && isDateValue(data.case_manager_date) ? dayjs(data.case_manager_date).format('YYYY-MM-DD') : null,
      client_date: data.client_date && isDateValue(data.client_date) ? dayjs(data.client_date).format('YYYY-MM-DD') : null,
    };

    if (consentUuid) {
      // Update existing form
      updateConsentFormMutationHook.mutate({
        path: { uuid: consentUuid },
        body: {
          form_json: formJson,
          status: 'COMPLETED',
          filled_at: dayjs().toISOString(),
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    } else if (leadUuid) {
      // Create new form
      createConsentFormMutationHook.mutate({
        body: {
          resident_uuid: leadUuid,
          form_name: formName,
          form_code: FORM_CODE,
          form_json: formJson,
          status: 'COMPLETED',
          frequency_type: 'ONCE',
          filled_at: dayjs().toISOString(),
          ...(signerType ? { signer_type: signerType } : {}),
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    }
  };

  // Prefill form data in draft/view mode
  useEffect(() => {
    if (open && consentUuid && (mode === "draft" || mode === "view") && !didPrefillRef.current) {
      const fetchFormData = async () => {
        try {
          const formData = await queryClient.fetchQuery(
            getConsentFormDetailOptions({
              path: { uuid: consentUuid },
            })
          );

          const responseData = (formData as Record<string, unknown>)?.data ?? formData;
          const rd = responseData as Record<string, unknown>;
          const entries = (rd?.entries as Record<string, unknown>[]) || [];
          const latestEntry = entries[0] || null;
          const formJson = (latestEntry as Record<string, unknown>)?.form_json || rd?.form_json || {};

          if (formJson && Object.keys(formJson).length > 0) {
            // Prefill form with existing data
            const isDateValue = (value: unknown): value is string | Date => {
              return typeof value === 'string' || (value !== null && typeof value === 'object' && value instanceof Date) || dayjs.isDayjs(value);
            };
            Object.keys(formJson).forEach((key) => {
              const value = formJson[key];
              if (value !== null && value !== undefined) {
                if (key.includes('_date') || key === 'program_manager_date' || key === 'guardian_date' || key === 'case_manager_date' || key === 'client_date') {
                  setValue(key as any, value && isDateValue(value) ? dayjs(value) : null);
                } else {
                  setValue(key as any, value);
                }
              }
            });

            // Backward-compatibility: if guardian_signature is empty but
            // legalGuardianSignature has data (from older signed documents),
            // copy the signature data to the correct field names.
            const fj = formJson as Record<string, unknown>;
            if (!fj.guardian_signature && fj.legalGuardianSignature) {
              setValue('guardian_signature' as any, fj.legalGuardianSignature);
              if (fj.legalGuardianSignatureDate) {
                const dateStr = fj.legalGuardianSignatureDate as string;
                setValue('guardian_date' as any, dayjs(dateStr).isValid() ? dayjs(dateStr) : null);
              }
            }

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
      setActiveStep(0); // eslint-disable-line react-hooks/set-state-in-effect
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
        return <Step1Rules control={control} errors={errors} mode={mode} />;
      case 1:
        return <Step2PropertyDamage control={control} errors={errors} mode={mode} />;
      case 2:
        return <Step3Signatures control={control} errors={errors} setValue={setValue} watch={watch} mode={mode} />;
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
          height: "100%",
          overflow: "hidden",
          backgroundColor: "#FFFFFF",
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
            padding: { xs: "12px 16px", sm: "12px 20px" },
            borderBottom: "1px solid #E3ECEF",
            flexShrink: 0,
            gap: { xs: 1, sm: 0 },
            marginTop: "-10px",
          }}
        >
          <Typography
            sx={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#424342",
              fontFamily: "Geist",
              lineHeight: "24px",
            }}
          >
            {formName}
          </Typography>

          <Grid container alignItems="center" spacing={2}>
            <Grid>
              <IconButton
                onClick={onClose}
                sx={{
                  padding: "4px",
                  color: "#757775",
                  "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
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
            overflow: "hidden",
            minHeight: 0,
            display: "flex",
          }}
        >
          {/* Left Sidebar Navigation - MUI Vertical Stepper with Blue Highlight */}
          <Grid
            sx={{
              width: { xs: "100%", sm: "280px" },
              borderRight: { xs: "none", sm: "1px solid #E3ECEF" },
              borderBottom: { xs: "1px solid #E3ECEF", sm: "none" },
              backgroundColor: "#FAFBFC",
              overflowY: "auto",
              overflowX: "hidden",
              flexShrink: 0,
              p: { xs: 1.5, sm: 2 },
              maxHeight: { xs: "200px", sm: "100%" },
              minHeight: 0,
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              "&::-webkit-scrollbar": {
                display: "none",
              },
            }}
          >
            <Stepper
              activeStep={activeStep}
              orientation="vertical"
              connector={<CustomStepConnector />}
            >
              {steps.map((step, index) => {
                const isCompleted = completedSteps.has(index);
                const isActive = activeStep === index;

                return (
                  <Step
                    key={step.id}
                    completed={isCompleted}
                    sx={{
                      cursor: "pointer",
                      "& .MuiStepLabel-root": {
                        cursor: "pointer",
                      },
                    }}
                    onClick={() => handleStepClick(index)}
                  >
                    <StepLabel
                      sx={{
                        "& .MuiStepLabel-label": {
                          fontSize: "14px",
                          fontWeight: isActive ? 600 : 400,
                          color: isActive ? "#0A2E45" : "#424342",
                        },
                        "& .MuiStepIcon-root": {
                          fontSize: "24px",
                          "&.Mui-active": {
                            color: "#0A2E45",
                          },
                          "&.Mui-completed": {
                            color: "#4CAF50",
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
              overflowY: "auto",
              overflowX: "hidden",
              p: { xs: 1.5, sm: 2, md: 3 },
              minHeight: 0,
              maxHeight: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {renderStepContent()}
          </Grid>
        </Grid>

        {/* Footer - Sticky */}
        <Grid
          size={{ xs: 12 }}
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            padding: { xs: "12px 16px", sm: "16px 24px" },
            borderTop: "1px solid #E3ECEF",
            flexShrink: 0,
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Grid container spacing={2} sx={{ justifyContent: "flex-end" }}>
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
                disabled={
                  mode === "view" ||
                  createConsentFormMutationHook.isPending ||
                  updateConsentFormMutationHook.isPending
                }
              >
                Save Draft
              </CustomButton>
            </Grid>
            <Grid>
              <CustomButton
                variant="primary"
                onClick={handleNext}
                disabled={
                  (mode === "view" && isLastStep) ||
                  createConsentFormMutationHook.isPending ||
                  updateConsentFormMutationHook.isPending ||
                  (isLastStep && mode !== "view" && isClientSignatureMissing)
                }
              >
                {isLastStep ? "Submit" : "Next"}
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

export default HouseRulesDrawer;

