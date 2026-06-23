import React, { useState, useEffect, useRef } from 'react';
import { Grid, IconButton, Stepper, Step, StepLabel, Typography } from '@mui/material';

import { Close, Print } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQuery, useMutation, useQueryClient, type DefaultError } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import dayjs from 'dayjs';
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
import Step1_BasicInformation from './health-history/steps/Step1_BasicInformation';
import Step2_ConsentLegalStatus from './health-history/steps/Step2_ConsentLegalStatus';
import Step3_EmergencyContacts from './health-history/steps/Step3_EmergencyContacts';
import Step4_MedicationsAllergies from './health-history/steps/Step4_MedicationsAllergies';
import Step5_FunctionalAbilities from './health-history/steps/Step5_FunctionalAbilities';
import Step6_SpecialNeeds from './health-history/steps/Step6_SpecialNeeds';
import Step7_MedicalProviders from './health-history/steps/Step7_MedicalProviders';
import Step8_LivingSocialInformation from './health-history/steps/Step8_LivingSocialInformation';
import Step9_Immunizations from './health-history/steps/Step9_Immunizations';
import Step10_PastMedicalHistory from './health-history/steps/Step10_PastMedicalHistory';
import Step11_PriorEvaluations from './health-history/steps/Step11_PriorEvaluations';
import Step12_FamilyHistory from './health-history/steps/Step12_FamilyHistory';

export interface HealthHistoryFormDrawerProps {
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
const FORM_CODE = 'HEALTH_HISTORY_FORM';

// Validation schema for phone numbers
// Phone Number validation: format "(XXX) XXX-XXXX" and must be 10 digits
const contactNumberValidation = yup
  .string()
  .nullable()
  .test(
    "phone-format",
    "Please enter a valid phone number in format (XXX) XXX-XXXX",
    function (value) {
      if (!value || value.trim() === "") return true; // Allow null/empty
      // Remove all non-digit characters
      const digitsOnly = value.replace(/\D/g, "");
      // Check if it's exactly 10 digits
      if (digitsOnly.length !== 10) return false;
      // Check if format matches (XXX) XXX-XXXX (optional formatting)
      // We accept both formatted and unformatted, but must have 10 digits
      return true;
    },
  );

// Health History Form validation schema
const healthHistoryFormSchema = yup.object({
  // Basic Information - Phone Numbers
  contactNumber: contactNumberValidation,
  agencyContactNumber: contactNumberValidation,
  agencyPrimaryContactNumber: contactNumberValidation,
  
  // Consent & Legal Status - Phone Numbers
  guardianContactNumber: contactNumberValidation,
  dnrContactNumber: contactNumberValidation,
  advancedDirectivesContact: contactNumberValidation,
  
  // Emergency Contacts - Phone Numbers
  emergencyContact1Number: contactNumberValidation,
  emergencyContact2Number: contactNumberValidation,
  
  // Medications & Allergies - Phone Numbers
  pharmacyContactNumber: contactNumberValidation,
  
  // Medical Providers - Phone Numbers
  primaryCareContactNumber: contactNumberValidation,
  dentalCareContactNumber: contactNumberValidation,
  eyeCareContactNumber: contactNumberValidation,
  subspecialists: yup.array().of(
    yup.object({
      name: yup.string().nullable(),
      contactNumber: contactNumberValidation,
      address: yup.string().nullable(),
    })
  ).nullable(),
  
  // Living & Social Information - Phone Numbers
  homeCareContactNumber: contactNumberValidation,
  
  // Past Medical History - Phone Numbers
  medicalHistoryContactNumber: contactNumberValidation,
  
  // All other fields are nullable/optional (no validation needed)
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

interface FormStep {
  id: string;
  label: string;
  number: number;
}

const steps: FormStep[] = [
  { id: 'basic-info', label: 'Basic Information', number: 1 },
  { id: 'consent-legal', label: 'Consent & Legal Status', number: 2 },
  { id: 'emergency-contacts', label: 'Emergency Contacts', number: 3 },
  { id: 'medications-allergies', label: 'Medications & Allergies', number: 4 },
  { id: 'functional-abilities', label: 'Functional Abilities', number: 5 },
  { id: 'special-needs', label: 'Special Needs & Exam Preferences', number: 6 },
  { id: 'medical-providers', label: 'Medical Providers', number: 7 },
  { id: 'living-social', label: 'Living & Social Information', number: 8 },
  { id: 'immunizations', label: 'Immunizations', number: 9 },
  { id: 'past-medical-history', label: 'Past Medical History', number: 10 },
  { id: 'prior-evaluations', label: 'Prior Evaluations', number: 11 },
  { id: 'family-history', label: 'Family History', number: 12 },
];

const HealthHistoryFormDrawer: React.FC<HealthHistoryFormDrawerProps> = ({
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

  const { control, handleSubmit, watch, setValue, reset, getValues, trigger, formState: { errors } } = useForm({
    resolver: yupResolver(healthHistoryFormSchema) as any,
    mode: "onChange", // Validate on change as requested
    defaultValues: {
      // Basic Information
      completedBy: '',
      relationshipToIndividual: '',
      date: null,
      name: individualName || '',
      likesToBeCalled: '',
      dateOfBirth: null,
      socSec: '',
      religion: '',
      contactNumber: '',
      address: '',
      healthInsuranceType: '',
      healthInsuranceNumber: '',
      agencyResponsible: '',
      agencyContactNumber: '',
      agencyPrimaryContact: '',
      agencyPrimaryContactNumber: '',
      
      // Consent & Legal Status
      consentStatus: '',
      guardianName: '',
      guardianContactNumber: '',
      resuscitationStatus: '',
      comfortCareFormAvailable: '',
      dnrContactName: '',
      dnrContactNumber: '',
      advancedDirectives: '',
      advancedDirectivesName: '',
      advancedDirectivesContact: '',
      
      // Emergency Contacts
      emergencyContact1Name: '',
      emergencyContact1Number: '',
      emergencyContact2Name: '',
      emergencyContact2Number: '',
      
      // Medications & Allergies
      medicationSheet: '',
      medicationList: '',
      pharmacyName: '',
      pharmacyContactNumber: '',
      pharmacyAddress: '',
      medicationAllergies: '',
      foodEnvironmentalAllergies: '',
      typeOfReaction: '',
      currentMedicalProblems: '',
      
      // Functional Abilities
      communication: '',
      medicationAdministration: '',
      diningEating: '',
      ambulation: '',
      vision: '',
      hearing: '',
      personalHygiene: '',
      personalHygieneSpecial: '',
      oralHygiene: '',
      oralHygieneSpecial: '',
      dietTexture: '',
      dietType: '',
      toiletingAbility: '',
      supportiveDevices: '',
      supportiveDevicesOther: '',
      headOfBedElevated: '',
      adaptiveEquipment: '',
      adaptiveEquipmentDescription: '',
      
      // Special Needs & Exam Preferences
      medicalExamResponse: '',
      sedationRequired: false,
      specialPositioning: false,
      doubleStaffingRequired: false,
      limitedWaitingPeriods: false,
      earlyDayAppointments: false,
      endOfDayAppointments: false,
      specialCommunicationDevice: false,
      specialCommunicationDeviceType: '',
      painResponse: '',
      painResponseUnique: '',
      
      // Medical Providers
      primaryCareName: '',
      primaryCareContactNumber: '',
      primaryCareAddress: '',
      dentalCareName: '',
      dentalCareContactNumber: '',
      dentalCareAddress: '',
      eyeCareName: '',
      eyeCareContactNumber: '',
      eyeCareAddress: '',
      subspecialists: [{ name: '', contactNumber: '', address: '' }],
      
      // Living & Social Information
      livingStatus: '',
      livingStatusOther: '',
      homeCareContactName: '',
      homeCareContactNumber: '',
      maritalStatus: '',
      workDayProgramStatus: '',
      nursingSupports: '',
      
      // Immunizations
      tetanusDate: null,
      tetanusStatus: '',
      fluShotDate: null,
      fluShotStatus: '',
      pneumovaxDate: null,
      pneumovaxStatus: '',
      hepatitisBDate: null,
      hepatitisBStatus: '',
      otherVaccinationsDate: null,
      otherVaccinationsSpecify: '',
      otherVaccinationsStatus: '',
      ppdPositiveTest: '',
      ppdTreatmentGiven: '',
      ppdTreatmentExplain: '',
      ppdLastDate: null,
      
      // Past Medical History
      medicalHistoryNotReleased: false,
      medicalHistoryContactName: '',
      medicalHistoryContactRelation: '',
      medicalHistoryContactNumber: '',
      medicalHistoryContactAddress: '',
      surgicalHistory: '',
      surgicalHistoryDate: null,
      traumaBrokenBones: '',
      traumaBrokenBonesDate: null,
      anesthesiaProblems: '',
      anesthesiaProblemsDescription: '',
      ageMenstruationStarted: '',
      ageMenstruationStopped: '',
      stillMenstruating: false,
      givenBirth: '',
      lastPapSmearDate: null,
      lastPapSmearStatus: '',
      abnormalPapSmear: '',
      abnormalPapSmearDescription: '',
      lastMammogramDate: null,
      lastMammogramStatus: '',
      seriousIllnessesConditions: '',
      behavioralPsychiatricDiagnoses: '',
      
      // Prior Evaluations
      audiologicalExamDate: null,
      audiologicalExamStatus: '',
      eyeExamDate: null,
      eyeExamStatus: '',
      dentalExamDate: null,
      dentalExamStatus: '',
      boneDensityDate: null,
      boneDensityStatus: '',
      colonoscopySigmoidoscopyDate: null,
      colonoscopySigmoidoscopyStatus: '',
      psaDate: null,
      psaStatus: '',
      
      // Family History
      brothersSisters: [{ age: '', health: '' }],
      familyDiseases: '',
      familyDiseasesDescription: '',
      geneticCounseling: '',
      geneticCounselingDescription: '',
      fatherDeceased: '',
      fatherAgeAtDeath: '',
      fatherCauseOfDeath: '',
      fatherCurrentAge: '',
      motherDeceased: '',
      motherAgeAtDeath: '',
      motherCauseOfDeath: '',
      motherCurrentAge: '',
      familyHistoryDiabetes: false,
      familyHistoryHighBloodPressure: false,
      familyHistoryHighCholesterol: false,
      familyHistoryHeartDisease: false,
      familyHistoryOsteoporosis: false,
      familyHistoryColonPolyps: false,
      familyHistoryCancer: false,
      familyHistoryCancerType: '',
    },
  });

  const isLastStep = activeStep === steps.length - 1;

  // Get fields for each step that need validation
  const getStepFields = (stepIndex: number): string[] => {
    switch (stepIndex) {
      case 0: // Step 1: Basic Information
        return ['contactNumber', 'agencyContactNumber', 'agencyPrimaryContactNumber'];
      case 1: // Step 2: Consent & Legal Status
        return ['guardianContactNumber', 'dnrContactNumber', 'advancedDirectivesContact'];
      case 2: // Step 3: Emergency Contacts
        return ['emergencyContact1Number', 'emergencyContact2Number'];
      case 3: // Step 4: Medications & Allergies
        return ['pharmacyContactNumber'];
      case 4: // Step 5: Functional Abilities
        return [];
      case 5: // Step 6: Special Needs
        return [];
      case 6: // Step 7: Medical Providers
        // Get all subspecialist phone numbers
        const subspecialists = watch('subspecialists') || [];
        const subspecialistFields = subspecialists.map((_: any, index: number) => 
          `subspecialists.${index}.contactNumber`
        );
        return ['primaryCareContactNumber', 'dentalCareContactNumber', 'eyeCareContactNumber', ...subspecialistFields];
      case 7: // Step 8: Living & Social Information
        return ['homeCareContactNumber'];
      case 8: // Step 9: Immunizations
        return [];
      case 9: // Step 10: Past Medical History
        return ['medicalHistoryContactNumber'];
      case 10: // Step 11: Prior Evaluations
        return [];
      case 11: // Step 12: Family History
        return [];
      default:
        return [];
    }
  };

  const handleStepClick = async (stepIndex: number) => {
    if (mode === "view") {
      setActiveStep(stepIndex);
      return;
    }

    // If clicking on a step that's after the current step, validate all steps between current and target
    if (stepIndex > activeStep) {
      // Validate all steps from current to target (exclusive of target)
      for (let i = activeStep; i < stepIndex; i++) {
        const stepFields = getStepFields(i);
        if (stepFields.length > 0) {
          const isValid = await trigger(stepFields as any);
          if (!isValid) {
            // Validation failed for step i, don't allow navigation forward
            // Stay on the first step that failed validation
            return;
          }
        }
        // Mark step as completed if validation passes
        setCompletedSteps(prev => new Set([...prev, i]));
      }
    }
    
    setActiveStep(stepIndex);
  };

  const handleNext = async () => {
    if (mode === "view") {
      return; // Prevent navigation in view mode
    }

    // Validate current step's fields before proceeding
    const stepFields = getStepFields(activeStep);
    if (stepFields.length > 0) {
      const isValid = await trigger(stepFields as any);
      if (!isValid) {
        // Validation failed, don't proceed to next step
        return;
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
      // Include all values (including empty strings, arrays, booleans, null)
      if (value !== undefined) {
        if (dayjs.isDayjs(value)) {
          // Convert dayjs dates to ISO string
          form_json[key] = value.toISOString();
        } else {
          form_json[key] = value;
        }
      }
    });

    // Calculate next_due_at: 365 days after filled_at for health history form
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

  const handleSaveDraft = () => {
    // For draft, bypass validation and submit with current form values
    const currentValues = getValues();
    onSubmit(currentValues, 'DRAFT');
  };

  const handlePrint = () => {
    window.print();
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
          'date',
          'dateOfBirth',
          'tetanusDate',
          'fluShotDate',
          'pneumovaxDate',
          'hepatitisBDate',
          'otherVaccinationsDate',
          'ppdLastDate',
          'surgicalHistoryDate',
          'traumaBrokenBonesDate',
          'lastPapSmearDate',
          'lastMammogramDate',
          'audiologicalExamDate',
          'eyeExamDate',
          'dentalExamDate',
          'boneDensityDate',
          'colonoscopySigmoidoscopyDate',
          'psaDate',
        ];

        let fieldsSet = 0;
        let fieldsSkipped = 0;

        // Use setValue for each field (as per requirement)
        Object.entries(formJson).forEach(([key, value]) => {
          try {
            // Handle arrays (subspecialists, brothersSisters)
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
        console.warn('Health History - No form_json data to prefill:', formJson);
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

  // Set name when individualName changes
  useEffect(() => {
    if (individualName) {
      setValue('name', individualName);
    }
  }, [individualName, setValue]);

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
    onError: (error: AxiosError<DefaultError>) => {
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
    onError: (error: AxiosError<DefaultError>) => {
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

  // Reset mutations when drawer closes to prevent stuck disabled buttons upon reopening
  useEffect(() => {
    if (!open) {
      createConsentFormMutationHook.reset();
      updateConsentFormMutationHook.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return <Step1_BasicInformation control={control} errors={errors} individualName={individualName} mode={mode} />;
      case 1:
        return <Step2_ConsentLegalStatus control={control} errors={errors} mode={mode} />;
      case 2:
        return <Step3_EmergencyContacts control={control} errors={errors} mode={mode} />;
      case 3:
        return <Step4_MedicationsAllergies control={control} errors={errors} mode={mode} />;
      case 4:
        return <Step5_FunctionalAbilities control={control} mode={mode} />;
      case 5:
        return <Step6_SpecialNeeds control={control} mode={mode} />;
      case 6:
        return <Step7_MedicalProviders control={control} errors={errors} mode={mode} />;
      case 7:
        return <Step8_LivingSocialInformation control={control} errors={errors} mode={mode} />;
      case 8:
        return <Step9_Immunizations control={control} mode={mode} />;
      case 9:
        return <Step10_PastMedicalHistory control={control} errors={errors} mode={mode} />;
      case 10:
        return <Step11_PriorEvaluations control={control} mode={mode} />;
      case 11:
        return <Step12_FamilyHistory control={control} mode={mode} />;
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
          mb: 2,
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
            px: { xs: 1.5, sm: 2, md: 3 },
            py: 1.5,
            backgroundColor: '#F5F7FA',
            borderBottom: '1px solid #E3ECEF',
            flexShrink: 0,
          }}
        >
          <CustomLabel label={`Individual's Name : ${individualName || ''}`} style={{ fontSize: '14px', color: '#424342', marginBottom: '4px' }} />
          <CustomLabel 
            label="To be completed at the Service Agreement and updated annually, as well as after any major illnesses, surgeries, or changes." 
            style={{ fontSize: '12px', color: '#6B7280', fontWeight: 400, margin: 0 }} 
          />
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
                      cursor: mode === "view" ? 'default' : 'pointer',
                      '& .MuiStepLabel-root': {
                        cursor: mode === "view" ? 'default' : 'pointer',
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
          justifyContent={{ xs: "center", sm: "flex-end" }}
          alignItems="center"
          spacing={{ xs: 1.5, sm: 2 }}
          sx={{
            padding: { xs: '12px 16px', sm: '16px 24px' },
            borderTop: '1px solid #E3ECEF',
            flexShrink: 0,
          }}
        >
          {/* Derive a single isSaving flag so all buttons disable together */}
          {(() => {
            const isSaving =
              createConsentFormMutationHook.isPending ||
              updateConsentFormMutationHook.isPending ||
              createConsentFormMutationHook.isSuccess ||
              updateConsentFormMutationHook.isSuccess;
            return (
              <>
                <Grid>
                  <CustomButton
                    variant="secondary"
                    size="md"
                    onClick={onClose}
                    disabled={mode === "view" || isSaving}
                  >
                    Cancel
                  </CustomButton>
                </Grid>
                <Grid>
                  <CustomButton
                    variant="secondary"
                    size="md"
                    onClick={handleSaveDraft}
                    disabled={mode === "view" || isSaving}
                  >
                    Save as Draft
                  </CustomButton>
                </Grid>
                <Grid>
                  <CustomButton
                    variant="primary"
                    size="md"
                    onClick={handleNext}
                    disabled={mode === "view" || isSaving}
                  >
                    {isLastStep
                      ? isSaving
                        ? "Saving…"
                        : "Save"
                      : "Next"}
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

export default HealthHistoryFormDrawer;
