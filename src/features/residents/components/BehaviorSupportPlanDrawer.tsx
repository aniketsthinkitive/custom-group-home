import React, { useState, useEffect, useRef } from 'react';
import { Grid, IconButton, Stepper, Step, StepLabel, Typography } from '@mui/material';

import { Close, Print } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import CustomDrawer from '../../../components/custom-drawer/custom-drawer';
import CustomButton from '../../../components/custom-buttons/custom-buttons';
import CustomLabel from '../../../components/custom-label/custom-label';
import CommonSnackbar from '../../../components/common-snackbar/common-snackbar';
import { 
  listConsentFormsOptions, 
  listConsentFormsQueryKey, 
  createConsentFormMutation,
  getConsentFormDetailOptions,
  updateConsentFormMutation,
} from '../../../sdk/@tanstack/react-query.gen';
import Step1_DemographicInfo from './behavior-support-plan/steps/Step1_DemographicInfo';
import Step2_RecordsAndAssessments from './behavior-support-plan/steps/Step2_RecordsAndAssessments';
import Step3_PlanAuthorship from './behavior-support-plan/steps/Step3_PlanAuthorship';
import Step4_RationalForPlan from './behavior-support-plan/steps/Step4_RationalForPlan';
import Step5_PreferenceAssessment from './behavior-support-plan/steps/Step5_PreferenceAssessment';
import Step6_BehaviorDataAnalysis from './behavior-support-plan/steps/Step6_BehaviorDataAnalysis';
import Step7_TargetBehaviors from './behavior-support-plan/steps/Step7_TargetBehaviors';
import Step8_AntecedentStrategies from './behavior-support-plan/steps/Step8_AntecedentStrategies';
import Step9_SupervisionRestrictions from './behavior-support-plan/steps/Step9_SupervisionRestrictions';
import Step10_CrisisIntervention, { step10ValidationSchema } from './behavior-support-plan/steps/Step10_CrisisIntervention';
import Step11_GoalsAndSignatures from './behavior-support-plan/steps/Step11_GoalsAndSignatures';
import { generateBehaviorSupportPlanPDF } from './behavior-support-plan/utils/generateBehaviorSupportPlanPDF';
import dayjs from 'dayjs';

export interface BehaviorSupportPlanDrawerProps {
  open: boolean;
  onClose: () => void;
  formName?: string;
  individualName?: string;
  residentData?: any;
  onAfterSubmit?: () => void;
  consentUuid?: string | null;
  mode?: "new" | "draft" | "view";
  onAfterSave?: () => void;
}

// Form code constant - MUST match backend enum: CAFC_BSP_TEMPLATE
const FORM_CODE = 'CAFC_BSP_TEMPLATE';

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

interface FormStep {
  id: string;
  label: string;
  number: number;
}

const steps: FormStep[] = [
  { id: 'demographic-info', label: 'Demographic Information', number: 1 },
  { id: 'records-assessments', label: 'Records & Assessments', number: 2 },
  { id: 'plan-authorship', label: 'Plan Authorship', number: 3 },
  { id: 'rational-for-plan', label: 'Rationale for Plan', number: 4 },
  { id: 'preference-assessment', label: 'Preference Assessment', number: 5 },
  { id: 'behavior-data-analysis', label: 'Behavior Data Analysis', number: 6 },
  { id: 'target-behaviors', label: 'Target Behaviors', number: 7 },
  { id: 'antecedent-strategies', label: 'Antecedent, Reinforcement & Reactive Strategies', number: 8 },
  { id: 'supervision-restrictions', label: 'Supervision & Environmental Restrictions', number: 9 },
  { id: 'crisis-intervention', label: 'Crisis Intervention, Monitoring & Fading', number: 10 },
  { id: 'goals-signatures', label: 'Goals & Signatures', number: 11 },
];

const BehaviorSupportPlanDrawer: React.FC<BehaviorSupportPlanDrawerProps> = ({
  open,
  onClose,
  formName = 'Behavior Support Plan (Initial / Renewal)',
  individualName,
  residentData = {},
  onAfterSubmit,
  consentUuid,
  mode,
  onAfterSave,
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
  const lastPrefillTimestampRef = useRef<number>(0);

  // Extract resident UUID
  const residentUuid = residentData?.uuid || residentData?.resident_uuid;

  const { control, handleSubmit, watch, setValue, reset, getValues, trigger, setError, clearErrors, formState: { errors } } = useForm({
    defaultValues: {
      // Step 1: Demographic Information
      admissionDate: null,
      serviceType: '',
      individualName: individualName || '',
      dateOfBirth: null,
      
      
      gender: residentData .gender || '',
      address: residentData .address || '',
      phoneNumber: residentData .phoneNumber || '',
      emergencyContact: residentData .emergencyContact || '',
      emergencyContactPhone: residentData .emergencyContactPhone || '',
        // Step 2: Records & Assessments
        medicalRecords: '',
        psychologicalAssessments: '',
        behavioralAssessments: '',
        educationalRecords: '',
        otherRecords: '',
        
        // Step 3: Plan Authorship
        planAuthor: '',
        authorTitle: '',
        authorCredentials: '',
        authorContact: '',
        planDate: null,
        reviewDate: null,
        
        // Step 4: Rationale for Plan
        rationale: '',
        problemStatement: '',
        currentBehavior: '',
        impactOnIndividual: '',
        impactOnOthers: '',
        
        // Step 5: Preference Assessment
        preferredActivities: '',
        preferredPeople: '',
        preferredEnvironments: '',
        preferredItems: '',
        nonPreferredItems: '',
        onSiteActivities: [],
        communityActivities: [],
        itemsFood: [],
      
      // Step 6: Behavior Data Analysis
      baselineData: '',
      frequencyData: '',
      durationData: '',
      intensityData: '',
      patterns: '',
      
      // Step 7: Target Behaviors
      increaseBehaviors: [],
      decreaseBehaviors: [],
      
      // Step 8: Antecedent Strategies
      antecedentStrategies: '',
      environmentalModifications: '',
      scheduleModifications: '',
      communicationStrategies: '',
      clientSpecificProactiveStrategies: '',
      reinforcementRationale: '',
      reinforcementProtocol: '',
      
      // Step 9: Supervision & Restrictions
      supervisionLevel: '',
      restrictions: '',
      monitoringRequirements: '',
      safetyMeasures: '',
      
      // Step 10: Crisis Intervention
      crisisDefinition: '',
      crisisProcedures: '',
      deEscalationTechniques: '',
      emergencyContacts: '',
      medicalConsiderationsDuringCrisis: '',
      fadingCriteria: '',
      planTerminationCriteria: '',
      monitoringProtocol: '',
      
      // Step 11: Goals & Signatures
      goals: [],
      signatureMethod: 'DRAW',
      signature: null,
      signedBy: '',
      signatureDate: null,
    },
  });

  const isLastStep = activeStep === steps.length - 1;

  const handleStepClick = (stepIndex: number) => {
    setActiveStep(stepIndex);
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

  const handleNext = async () => {
    // Validate Step 8 required fields when clicking Next
    if (activeStep === 7) {
      const step8Fields = getStepFields(7);
      const isValid = await trigger(step8Fields as any);
      if (!isValid) {
        return; // Don't proceed if validation fails
      }
    }

    // Validate Step 10 using Yup schema when clicking Next
    if (activeStep === 9) {
      const currentValues = getValues() as any;
      const step10Data = {
        medicalConsiderationsDuringCrisis: currentValues.medicalConsiderationsDuringCrisis || '',
        fadingCriteria: currentValues.fadingCriteria || '',
        planTerminationCriteria: currentValues.planTerminationCriteria || '',
        monitoringProtocol: currentValues.monitoringProtocol || '',
      };

      try {
        // Validate using Yup schema
        await step10ValidationSchema.validate(step10Data, { abortEarly: false });
        // Clear any previous errors if validation passes
        clearErrors('medicalConsiderationsDuringCrisis' as any);
        clearErrors('fadingCriteria' as any);
        clearErrors('planTerminationCriteria' as any);
        clearErrors('monitoringProtocol' as any);
      } catch (validationError: any) {
        // Validation failed, set errors using setError
        if (validationError.inner && Array.isArray(validationError.inner)) {
          validationError.inner.forEach((err: any) => {
            setError(err.path as any, {
              type: 'validation',
              message: err.message,
            });
          });
        } else if (validationError.path) {
          // Single error case
          setError(validationError.path as any, {
            type: 'validation',
            message: validationError.message,
          });
        }
        return; // Don't proceed if validation fails
      }
    }

    if (isLastStep) {
      handleSubmit((data) => onSubmit(data, 'COMPLETED'))();
    } else {
      setCompletedSteps(prev => new Set([...prev, activeStep]));
      setActiveStep(prev => prev + 1);
    }
  };

  const onSubmit = (data: any, status: 'COMPLETED' | 'DRAFT' = 'COMPLETED') => {
    if (!residentUuid) {
      setSnackbar({
        isOpen: true,
        message: 'Resident UUID is required',
        status: 'error',
      });
      return;
    }

    // Build form_json payload - all form fields go here
    const form_json: Record<string, any> = {};
    Object.keys(data).forEach(key => {
      const value = (data as Record<string, any>)[key];
      // Only include non-empty values (but keep arrays and booleans)
      if (value !== undefined && value !== null) {
        if (typeof value === 'string' && value !== '') {
          form_json[key] = value;
        } else if (typeof value === 'boolean') {
          form_json[key] = value;
        } else if (Array.isArray(value)) {
          form_json[key] = value;
        } else if (dayjs.isDayjs(value)) {
          // Convert dayjs dates to ISO string
          form_json[key] = value.toISOString();
        } else if (value !== '') {
          form_json[key] = value;
        }
      }
    });

    // Calculate next_due_at: 365 days after filled_at for behavior support plan form
    const filledAt = new Date().toISOString();
    const nextDueAt = status === 'COMPLETED' 
      ? dayjs(filledAt).add(365, 'day').toISOString() 
      : null;

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
          ...(status === 'COMPLETED' ? { 
            filled_at: filledAt,
            next_due_at: nextDueAt,
          } : {}),
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
          filled_at: filledAt,
          next_due_at: nextDueAt,
          form_json: form_json,
        },
      };

      createConsentFormMutationHook.mutate(createPayload as any);
    }
  };

  // Helper function to get fields for each step
  const getStepFields = (stepIndex: number): string[] => {
    switch (stepIndex) {
      case 0: // Demographic Information
        return ['admissionDate', 'serviceType', 'individualName', 'dateOfBirth', 'gender', 'address', 'phoneNumber', 'emergencyContact', 'emergencyContactPhone'];
      case 1: // Records & Assessments
        return ['medicalRecords', 'psychologicalAssessments', 'behavioralAssessments', 'educationalRecords', 'otherRecords'];
      case 2: // Plan Authorship
        return ['planAuthor', 'authorTitle', 'authorCredentials', 'authorContact', 'planDate', 'reviewDate'];
      case 3: // Rationale for Plan
        return ['rationale', 'problemStatement', 'currentBehavior', 'impactOnIndividual', 'impactOnOthers'];
      case 4: // Preference Assessment
        return ['preferredActivities', 'preferredPeople', 'preferredEnvironments', 'preferredItems', 'nonPreferredItems', 'onSiteActivities', 'communityActivities', 'itemsFood'];
      case 5: // Behavior Data Analysis
        return ['baselineData', 'frequencyData', 'durationData', 'intensityData', 'patterns'];
      case 6: // Target Behaviors
        return ['increaseBehaviors', 'decreaseBehaviors'];
      case 7: // Antecedent Strategies
        return ['antecedentStrategies', 'environmentalModifications', 'scheduleModifications', 'communicationStrategies', 'clientSpecificProactiveStrategies', 'reinforcementRationale', 'reinforcementProtocol'];
      case 8: // Supervision & Restrictions
        return ['supervisionLevel', 'restrictions', 'monitoringRequirements', 'safetyMeasures'];
      case 9: // Crisis Intervention
        return ['crisisDefinition', 'crisisProcedures', 'deEscalationTechniques', 'emergencyContacts'];
      case 10: // Goals & Signatures
        return ['goals', 'signatureMethod', 'signature', 'signedBy', 'signatureDate'];
      default:
        return [];
    }
  };

  const handleSaveDraft = () => {
    // For draft, bypass validation and submit with current form values
    const currentValues = getValues();
    onSubmit(currentValues, 'DRAFT');
  };

  // Reset mutations when drawer closes to prevent stuck disabled buttons upon reopening
  useEffect(() => {
    if (!open) {
      createConsentFormMutationHook.reset();
      updateConsentFormMutationHook.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handlePrint = () => {
    const formData = getValues();
    generateBehaviorSupportPlanPDF(formData, individualName);
  };
  const calculateAge = (dob: string | number | Date) => {
    if (!dob) return null;
  
    const birthDate = dayjs(dob);
    const today = dayjs();
  
    let age = today.year() - birthDate.year();
  
    if (
      today.month() < birthDate.month() ||
      (today.month() === birthDate.month() && today.date() < birthDate.date())
    ) {
      age--;
    }
  
    return age;
  };
  

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
        // List of all date field names from all steps
        const dateFields = [
          'admissionDate',
          'aflsDate',
          'ssisSelDate',
          'individualServiceAgreementDate',
          'previousBSPDate',
          'riskManagementPlanDate',
          'preferenceAssessmentDate',
          'functionalBehaviorAssessmentDate',
          'dateOfInitialPlan',
          'dateOfLastRenewal',
          'dateOfCurrentPlan',
          'dateOfBirth',
          'planDate',
          'reviewDate',
          'signatureDate',
        ];

        let fieldsSet = 0;
        let fieldsSkipped = 0;

        // Use setValue for each field (as per requirement)
        Object.entries(formJson).forEach(([key, value]) => {
          try {
            // Skip address object - it's handled separately if needed
            if (key === 'address' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
              // Address is an object, we might need to handle it differently
              // For now, set it as-is if the form expects an object
              setValue(key as any, value, { shouldValidate: false, shouldDirty: false });
              fieldsSet++;
              return;
            }

            // Handle arrays (goals, increaseBehaviors, decreaseBehaviors)
            if (Array.isArray(value)) {
              setValue(key as any, value, { shouldValidate: false, shouldDirty: false });
              fieldsSet++;
              return;
            }

            // Transform date strings to dayjs objects for DatePickerField
            if (dateFields.includes(key) && typeof value === 'string' && value) {
              const dayjsValue = dayjs(value);
              if (dayjsValue.isValid()) {
                setValue(key as any, dayjsValue, { shouldValidate: false, shouldDirty: false });
                // console.log(`✓ Set date field ${key}:`, dayjsValue.format('YYYY-MM-DD'));
                fieldsSet++;
              } else {
                setValue(key as any, value, { shouldValidate: false, shouldDirty: false });
                // console.log(`⚠ Set field ${key} (invalid date):`, value);
                fieldsSet++;
              }
            } else if (value !== null && value !== undefined) {
              // Handle all other fields (strings, numbers, booleans, including empty strings)
              setValue(key as any, value, { shouldValidate: false, shouldDirty: false });
              // console.log(`✓ Set field ${key}:`, typeof value === 'string' && value.length > 50 ? `${value.substring(0, 50)}...` : value);
              fieldsSet++;
            } else {
              fieldsSkipped++;
              // console.log(`⊘ Skipped field ${key}: null/undefined`);
            }
          } catch (error) {
            console.error(`✗ Error setting field ${key}:`, error, value);
          }
        });

        lastPrefillTimestampRef.current = dataUpdatedAt;
      } else {
        console.warn('No form_json data to prefill:', formJson);
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
          admissionDate: null,
          serviceType: '',
          individualName: individualName || '',
          dateOfBirth: null,
          gender: residentData?.gender || '',
          address: residentData?.address || '',
          phoneNumber: residentData?.phoneNumber || '',
          emergencyContact: residentData?.emergencyContact || '',
          emergencyContactPhone: residentData?.emergencyContactPhone || '',
          medicalRecords: '',
          psychologicalAssessments: '',
          behavioralAssessments: '',
          educationalRecords: '',
          otherRecords: '',
          planAuthor: '',
          authorTitle: '',
          authorCredentials: '',
          authorContact: '',
          planDate: null,
          reviewDate: null,
          rationale: '',
          problemStatement: '',
          currentBehavior: '',
          impactOnIndividual: '',
          impactOnOthers: '',
          preferredActivities: '',
          preferredPeople: '',
          preferredEnvironments: '',
          preferredItems: '',
          nonPreferredItems: '',
          onSiteActivities: [],
          communityActivities: [],
          itemsFood: [],
          baselineData: '',
          frequencyData: '',
          durationData: '',
          intensityData: '',
          patterns: '',
          increaseBehaviors: [],
          decreaseBehaviors: [],
          antecedentStrategies: '',
          environmentalModifications: '',
          scheduleModifications: '',
          communicationStrategies: '',
          clientSpecificProactiveStrategies: '',
          reinforcementRationale: '',
          reinforcementProtocol: '',
          supervisionLevel: '',
          restrictions: '',
          monitoringRequirements: '',
          safetyMeasures: '',
          crisisDefinition: '',
          crisisProcedures: '',
          deEscalationTechniques: '',
          emergencyContacts: '',
          goals: [],
          signatureMethod: 'DRAW',
          signature: null,
          signedBy: '',
          signatureDate: null,
        };
        
        // Reset form with merged data
        reset({ ...defaultValues, ...formJson });
        hasResetFormRef.current = true;
      }
    }
  }, [open, mode, existingFormData, reset, individualName, residentData]);

  // Set name when individualName changes
  useEffect(() => {
    if (individualName) {
      setValue('individualName', individualName);
    }
  }, [individualName, setValue]);

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return <Step1_DemographicInfo control={control} mode={mode} />;
      case 1:
        return <Step2_RecordsAndAssessments control={control} mode={mode} />;
      case 2:
        return <Step3_PlanAuthorship control={control} mode={mode} />;
      case 3:
        return <Step4_RationalForPlan control={control} mode={mode} />;
      case 4:
        return <Step5_PreferenceAssessment control={control} mode={mode} setValue={setValue} />;
      case 5:
        return <Step6_BehaviorDataAnalysis control={control} mode={mode} />;
      case 6:
        return <Step7_TargetBehaviors control={control} mode={mode} setValue={setValue} />;
      case 7:
        return <Step8_AntecedentStrategies control={control} mode={mode} />;
      case 8:
        return <Step9_SupervisionRestrictions control={control} mode={mode} />;
      case 9:
        return <Step10_CrisisIntervention control={control} mode={mode} errors={errors} />;
      case 10:
        return <Step11_GoalsAndSignatures control={control} setValue={setValue} mode={mode} />;
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
    {formName || 'Behavior Support Plan (Initial / Renewal)'}
  </Typography>

  <Grid container alignItems="center" spacing={1}>
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
          container
          alignItems="center"
          spacing={4}
          sx={{
            px: 3,
            py: 1.5,
            backgroundColor: '#F5F7FA',
            borderBottom: '1px solid #E3ECEF',
            flexShrink: 0,
          }}
        >
          <Grid>
            <CustomLabel
              label={`Individual's Name : ${individualName || 'N/A'}`}
              style={{ fontSize: '14px', color: '#424342', margin: 0 }}
            />
          </Grid>

          <Grid>
            <CustomLabel
              label={`Date of Birth : ${residentData?.date_of_birth ? dayjs(residentData.date_of_birth).format('MM/DD/YYYY') : 'N/A'}`}
              style={{ fontSize: '14px', color: '#424342', margin: 0 }}
            />
          </Grid>

          <Grid>
            <CustomLabel
              label={`Age : ${
                residentData?.date_of_birth
                  ? calculateAge(residentData.date_of_birth)
                  : 'N/A'
              }`}
              style={{ fontSize: '14px', color: '#424342', margin: 0 }}
            />
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
              // Hide scrollbar for Chrome, Edge, Safari
              scrollbarWidth: 'none',      // Firefox
              msOverflowStyle: 'none',     // IE/Edge
              '&::-webkit-scrollbar': {
                display: 'none',           // Chrome/Safari
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
              // Hide scrollbar for Chrome, Edge, Safari
              scrollbarWidth: 'none',      // Firefox
              msOverflowStyle: 'none',     // IE/Edge
              '&::-webkit-scrollbar': {
                display: 'none',           // Chrome/Safari
              },
            }}
          >
            {renderStepContent()}
          </Grid>
        </Grid>

        {/* Footer */}
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
            <CustomButton
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={mode === "view"}
            >
              Cancel
            </CustomButton>
          </Grid>
          <Grid>
            <CustomButton
              variant="secondary"
              size="md"
              onClick={handleSaveDraft}
              disabled={mode === "view" || createConsentFormMutationHook.isPending || updateConsentFormMutationHook.isPending}
              loading={createConsentFormMutationHook.isPending || updateConsentFormMutationHook.isPending}
            >
              Save as Draft
            </CustomButton>
          </Grid>
          <Grid>
            <CustomButton
              variant="primary"
              size="md"
              onClick={handleNext}
              disabled={mode === "view" || createConsentFormMutationHook.isPending || updateConsentFormMutationHook.isPending}
              loading={isLastStep && (createConsentFormMutationHook.isPending || updateConsentFormMutationHook.isPending)}
            >
              {isLastStep ? 'Save' : 'Next'}
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

export default BehaviorSupportPlanDrawer;

