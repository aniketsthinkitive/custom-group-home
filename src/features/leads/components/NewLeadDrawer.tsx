import React, { useState, useRef } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { useMutation, useQueryClient, type DefaultError } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CommonSnackbar from '../../../components/common-snackbar/common-snackbar';
import type { GenderEnum, Status7B0Enum, LeadCreateWritable } from '../../../sdk/types.gen';
import { Lead } from '../leads.types';
import NewLeadForm, { type FormData, type Step, type NewLeadFormHandle } from './NewLeadForm';
import { leadMutationSchema, type LeadMutationData } from '../schemas/leadMutationSchema';
import {
  createLeadMutation,
  updateLeadMutation,
} from '../../../sdk/@tanstack/react-query.gen';
import { invalidateLeadsList } from '../utils/queryInvalidation';


interface NewLeadDrawerProps {
  onClose: () => void;
  onAddLead: (lead: Omit<Lead, 'id' | 'lastUpdated'>) => void;
}
const NewLeadDrawer: React.FC<NewLeadDrawerProps> = ({ onClose, onAddLead }) => {
  const isFinalSubmitRef = useRef(false);
  const [activeStep, setActiveStep] = useState('demographics');
  const [leadId, setLeadId] = useState<string | null>(null);
  const [leadUuid, setLeadUuid] = useState<string | null>(null);
  const formRef = useRef<NewLeadFormHandle>(null);

  // Track last saved payload to avoid redundant PUT calls when data hasn't changed
  const lastSavedPayloadRef = useRef<string | null>(null);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; status: 'success' | 'error' }>({
    open: false,
    message: '',
    status: 'success',
  });
  const formDataRef = useRef<FormData | null>(null);

  const queryClient = useQueryClient();


  // Helper function to extract backend message
  const getBackendMessage = (response: unknown): string | undefined => {
    const data = response as { message?: string; data?: { message?: string } } | undefined;
    return data?.message ?? data?.data?.message ?? undefined;
  };

  const createLead = useMutation({
    ...(createLeadMutation() as any),
    onSuccess: (data: any) => {
      const backendMessage = getBackendMessage(data);
      const successMessage = backendMessage || 'Lead created successfully';

      setSnackbar({
        open: true,
        message: successMessage,
        status: 'success',
      });

      // 🔄 Refresh leads list
      invalidateLeadsList(queryClient);

      // Extract lead UUID for table update
      const leadUuid =
        data?.data?.lead?.uuid ||
        data?.uuid ||
        data?.data?.user?.uuid ||
        '';
      setLeadUuid(leadUuid);

      // Store guardian/agent UUIDs so subsequent updates use UUID instead of re-creating
      const guardianUuid = data?.data?.guardian?.uuid;
      const agentUuid = data?.data?.agent?.uuid;
      if (guardianUuid && formRef.current) {
        formRef.current.setFieldValue('guardianId', guardianUuid);
      }
      if (agentUuid && formRef.current) {
        formRef.current.setFieldValue('serviceManagerId', agentUuid);
      }

      const formData = formDataRef.current;
      if (formData) {
        onAddLead({
          referralId: leadUuid,
          fullName: `${formData.firstName} ${formData.lastName}`,
          referralSource: formData.referralSource,
          insurance:
            formData.insuranceStatus === 'Available'
              ? 'Available'
              : 'Not Available',
          status: 'Draft',
        });
        formDataRef.current = null;
      }
      setActiveStep('documents');

      // ❌ Close drawer ONLY if this was final submit
      if (isFinalSubmitRef.current) {
        isFinalSubmitRef.current = false;
        setActiveStep('demographics');
        onClose();
      }
    },
    onError: (error: AxiosError<DefaultError>) => {
      const errorData = error.response?.data as any;

      // Map backend field names to form field names
      const backendToFormFieldMap: Record<string, keyof FormData> = {
        first_name: 'firstName',
        last_name: 'lastName',
        email: 'email',
        phone: 'contactNumber',
        date_of_birth: 'dateOfBirth',
        gender: 'gender',
        referral_source: 'referralSource',
        'address.line1': 'streetAddress',
        'address.city': 'city',
        'address.state': 'state',
        'address.zipcode': 'zipCode',
        guardian_email: 'guardianEmail',
        guardian_first_name: 'guardianFirstName',
        guardian_last_name: 'guardianLastName',
        guardian_phone: 'guardianContactNumber',
        agent_email: 'serviceManagerEmail',
        agent_first_name: 'serviceManagerFirstName',
        agent_last_name: 'serviceManagerLastName',
        agent_phone: 'serviceManagerContactNumber',
        'insurance.provider': 'insuranceProvider',
        'insurance.policy_number': 'policyNumber',
        'insurance.status': 'insuranceStatus',
      };

      // Extract first field-level error from { errors: { field: ["msg"] } } format
      const fieldErrors = errorData?.errors;
      const firstFieldError =
        fieldErrors && typeof fieldErrors === 'object'
          ? Object.values(fieldErrors).flat()[0] as string | undefined
          : undefined;

      // Find the first backend field key that has an error
      const firstBackendFieldKey =
        fieldErrors && typeof fieldErrors === 'object'
          ? Object.keys(fieldErrors)[0]
          : undefined;

      const errorMessage =
        firstFieldError ||
        errorData?.message ||
        errorData?.detail ||
        errorData?.data?.message ||
        error.message ||
        'Failed to create lead';

      // Capture and map duplicate email error
      const lowerMsg = errorMessage.toLowerCase();
      const isDuplicateEmail = error.response?.status === 400 &&
        (lowerMsg.includes('email') && (lowerMsg.includes('already exists') || lowerMsg.includes('duplicate') || lowerMsg.includes('already in use') || lowerMsg.includes('taken')));

      if (isDuplicateEmail) {
        const errorField = errorData?.field;

        if (errorField === 'guardian_email') {
          setActiveStep('demographics');
          setTimeout(() => {
            formRef.current?.setFieldError('guardianEmail', errorMessage);
            formRef.current?.focusField('guardianEmail');
            formRef.current?.scrollToField('guardianEmail');
          }, 300);
          return;
        }

        if (errorField === 'agent_email') {
          setActiveStep('demographics');
          setTimeout(() => {
            formRef.current?.setFieldError('serviceManagerEmail', errorMessage);
            formRef.current?.focusField('serviceManagerEmail');
            formRef.current?.scrollToField('serviceManagerEmail');
          }, 300);
          return;
        }

        // Default: lead email duplicate
        setActiveStep('demographics');
        setTimeout(() => {
          formRef.current?.setFieldError('email', 'This email address is already in use');
          formRef.current?.focusField('email');
          formRef.current?.scrollToField('email');
        }, 300);
        return;
      }

      // Map backend field error to form field and scroll to it
      if (firstBackendFieldKey) {
        const formFieldName = backendToFormFieldMap[firstBackendFieldKey];
        if (formFieldName) {
          // Navigate to demographics step since create is called from step 1
          setActiveStep('demographics');
          setTimeout(() => {
            formRef.current?.setFieldError(formFieldName, firstFieldError || errorMessage);
            formRef.current?.focusField(formFieldName);
            formRef.current?.scrollToField(formFieldName);
          }, 300);
        }
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        status: 'error',
      });

      formDataRef.current = null;
    },
  });

  const updateLead = useMutation({
    ...(updateLeadMutation() as any),
    onSuccess: (data: any) => {
      const backendMessage = getBackendMessage(data);
      const successMessage = backendMessage || 'Lead updated successfully';

      setSnackbar({
        open: true,
        message: successMessage,
        status: 'success',
      });

      // 🔄 Refresh leads list
      invalidateLeadsList(queryClient);

      // Close drawer if this was final submit
      if (isFinalSubmitRef.current) {
        isFinalSubmitRef.current = false;
        setActiveStep('demographics');
        setLeadId(null);
        setLeadUuid(null);
        onClose();
      }
    },
    onError: (error: AxiosError<DefaultError>) => {
      const errorData = error.response?.data as any;

      // Map backend field names to form field names
      const backendToFormFieldMap: Record<string, keyof FormData> = {
        first_name: 'firstName',
        last_name: 'lastName',
        email: 'email',
        phone: 'contactNumber',
        date_of_birth: 'dateOfBirth',
        gender: 'gender',
        referral_source: 'referralSource',
        'address.line1': 'streetAddress',
        'address.city': 'city',
        'address.state': 'state',
        'address.zipcode': 'zipCode',
        guardian_email: 'guardianEmail',
        guardian_first_name: 'guardianFirstName',
        guardian_last_name: 'guardianLastName',
        guardian_phone: 'guardianContactNumber',
        agent_email: 'serviceManagerEmail',
        agent_first_name: 'serviceManagerFirstName',
        agent_last_name: 'serviceManagerLastName',
        agent_phone: 'serviceManagerContactNumber',
        'insurance.provider': 'insuranceProvider',
        'insurance.policy_number': 'policyNumber',
        'insurance.status': 'insuranceStatus',
      };

      // Extract first field-level error from { errors: { field: ["msg"] } } format
      const fieldErrors = errorData?.errors;
      const firstFieldError =
        fieldErrors && typeof fieldErrors === 'object'
          ? Object.values(fieldErrors).flat()[0] as string | undefined
          : undefined;

      // Find the first backend field key that has an error
      const firstBackendFieldKey =
        fieldErrors && typeof fieldErrors === 'object'
          ? Object.keys(fieldErrors)[0]
          : undefined;

      const errorMessage =
        firstFieldError ||
        errorData?.message ||
        errorData?.detail ||
        errorData?.data?.message ||
        error.message ||
        'Failed to update lead';

      // Capture and map duplicate email error
      const lowerMsg = errorMessage.toLowerCase();
      const isDuplicateEmail = error.response?.status === 400 &&
        (lowerMsg.includes('email') && (lowerMsg.includes('already exists') || lowerMsg.includes('duplicate') || lowerMsg.includes('already in use') || lowerMsg.includes('taken')));

      if (isDuplicateEmail) {
        const errorField = errorData?.field;

        if (errorField === 'guardian_email') {
          setActiveStep('demographics');
          setTimeout(() => {
            formRef.current?.setFieldError('guardianEmail', errorMessage);
            formRef.current?.focusField('guardianEmail');
            formRef.current?.scrollToField('guardianEmail');
          }, 300);
          return;
        }

        if (errorField === 'agent_email') {
          setActiveStep('demographics');
          setTimeout(() => {
            formRef.current?.setFieldError('serviceManagerEmail', errorMessage);
            formRef.current?.focusField('serviceManagerEmail');
            formRef.current?.scrollToField('serviceManagerEmail');
          }, 300);
          return;
        }

        // Default: lead email duplicate
        setActiveStep('demographics');
        setTimeout(() => {
          formRef.current?.setFieldError('email', 'This email address is already in use');
          formRef.current?.focusField('email');
          formRef.current?.scrollToField('email');
        }, 300);
        return;
      }

      // Map backend field error to form field and scroll to it
      if (firstBackendFieldKey) {
        const formFieldName = backendToFormFieldMap[firstBackendFieldKey];
        if (formFieldName) {
          // Determine which step the field belongs to
          const demographicsFields = [
            'firstName', 'lastName', 'dateOfBirth', 'gender', 'contactNumber',
            'email', 'referralSource', 'streetAddress', 'city', 'state', 'zipCode',
            'guardianEmail', 'guardianFirstName', 'guardianLastName', 'guardianContactNumber',
            'serviceManagerEmail', 'serviceManagerFirstName', 'serviceManagerLastName', 'serviceManagerContactNumber',
          ];
          const insuranceFields = ['insuranceProvider', 'policyNumber', 'insuranceStatus'];

          if (demographicsFields.includes(formFieldName)) {
            setActiveStep('demographics');
          } else if (insuranceFields.includes(formFieldName)) {
            setActiveStep('insurance');
          }

          setTimeout(() => {
            formRef.current?.setFieldError(formFieldName, firstFieldError || errorMessage);
            formRef.current?.focusField(formFieldName);
            formRef.current?.scrollToField(formFieldName);
          }, 300);
        }
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        status: 'error',
      });
    },
  });

  const steps: Step[] = [
    { id: 'demographics', label: 'Demographics' },
    { id: 'insurance', label: 'Insurance Details' },
    { id: 'documents', label: 'Document Checklist' },
  ];

  const handleStepChange = (stepId: string) => {
    setActiveStep(stepId);
  };

  const buildLeadPayload = (
    data: FormData,
    status: Status7B0Enum
  ) => {
    // Guardian first/last name from separate fields
    const guardianFirstName = data.guardianFirstName ? String(data.guardianFirstName).trim() : '';
    const guardianLastName = data.guardianLastName ? String(data.guardianLastName).trim() : '';

    // Service manager (agent) first/last name from separate fields
    const agentFirstName = data.serviceManagerFirstName ? String(data.serviceManagerFirstName).trim() : '';
    const agentLastName = data.serviceManagerLastName ? String(data.serviceManagerLastName).trim() : '';

    // Parse phone numbers - convert to number or null
    const phoneNumber = data.contactNumber
      ? Number(data.contactNumber.replace(/\D/g, ''))
      : null;
    const guardianPhone = data.guardianContactNumber
      ? Number(data.guardianContactNumber.replace(/\D/g, ''))
      : null;
    const agentPhone = data.serviceManagerContactNumber
      ? Number(data.serviceManagerContactNumber.replace(/\D/g, ''))
      : null;

    // Format date of birth as YYYY-MM-DD string
    const dateOfBirth = data.dateOfBirth
      ? data.dateOfBirth.format('YYYY-MM-DD')
      : null;

    // Map gender to API enum (handles "Male" / "male" / "MALE")
const gender: GenderEnum | null = data.gender
  ? (String(data.gender).trim().toUpperCase() as GenderEnum)
  : null;


    // Parse guardian_uuid and agent_uuid
    const guardianUuid = data.guardianId?.trim() || null;
    const agentUuid = data.serviceManagerId?.trim() || null;

    // Build payload matching API structure (LeadCreateSerializer)
    const payload: any = {
      // Top-level user fields (these map to user object in response)
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: phoneNumber,
      date_of_birth: dateOfBirth,
      gender: gender,
      referral_source: data.referralSource || null,
      status: status,
      guardian_relation: data.guardianRelation || null,

      // Address object
      address: {
        line1: data.streetAddress || null,
        line2: null,
        city: data.city || null,
        state: data.state || null,
        zipcode: data.zipCode || null,
        country: null,
      },

      // Guardian - either use guardian_uuid OR create new guardian object (not both)
      ...(guardianUuid ? { guardian_uuid: guardianUuid } : {}),
      ...(guardianUuid ? {} : ((guardianFirstName || guardianLastName || data.guardianEmail) ? {
        guardian: {
          first_name: guardianFirstName || null,
          last_name: guardianLastName || null,
          phone: guardianPhone,
          email: data.guardianEmail || null,
        }
      } : {})),

      // Agent (Service Manager) - either use agent_uuid OR create new agent object (not both)
      ...(agentUuid ? { agent_uuid: agentUuid } : {}),
      ...(agentUuid ? {} : ((agentFirstName || agentLastName || data.serviceManagerEmail) ? {
        agent: {
          first_name: agentFirstName || null,
          last_name: agentLastName || null,
          phone: agentPhone,
          email: data.serviceManagerEmail || null,
        }
      } : {})),

      // Insurance object
      insurance: {
        provider: data.insuranceProvider || null,
        policy_number: data.policyNumber || null,
        status: data.insuranceStatus === 'Available', // boolean
      },

      // Backend uses this to set status UNDER_REVIEW when all docs uploaded (otherwise DOCS_PENDING)
      documents_checklist_complete: Boolean((data as FormData & { documentsChecklistComplete?: boolean }).documentsChecklistComplete),
    };

    return payload;
  };

  // Shared function to handle lead submission with status
  const submitLead = async (data: FormData, leadStatus: Status7B0Enum = 'COMPLETED') => {
    try {
      // console.log('Form submitted with data:', data, 'Status:', leadStatus);

      // Map gender from form to API enum
      const genderMap: Record<string, GenderEnum> = {
        'Male': 'MALE',
        'Female': 'FEMALE',
        'Other': 'OTHER',
      };
      const gender: GenderEnum | undefined = data.gender ? genderMap[data.gender] || 'UNKNOWN' : undefined;

      // Map insurance status - API expects boolean, form has 'Available' | 'Missing'
      const insuranceStatus = data.insuranceStatus === 'Available';

      // Parse phone number safely
      let phoneNumber: number | null = null;
      if (data.contactNumber) {
        const cleanedPhone = data.contactNumber.replace(/\D/g, '');
        if (cleanedPhone) {
          const parsed = parseInt(cleanedPhone, 10);
          phoneNumber = isNaN(parsed) ? null : parsed;
        }
      }

      // Guardian first/last name from separate fields
      const guardianFirstName = data.guardianFirstName ? String(data.guardianFirstName).trim() : '';
      const guardianLastName = data.guardianLastName ? String(data.guardianLastName).trim() : '';

      // Service manager (agent) first/last name from separate fields
      const agentFirstName = data.serviceManagerFirstName ? String(data.serviceManagerFirstName).trim() : '';
      const agentLastName = data.serviceManagerLastName ? String(data.serviceManagerLastName).trim() : '';

      // Parse phone numbers
      const guardianPhone = data.guardianContactNumber
        ? Number(data.guardianContactNumber.replace(/\D/g, ''))
        : null;
      const agentPhone = data.serviceManagerContactNumber
        ? Number(data.serviceManagerContactNumber.replace(/\D/g, ''))
        : null;

      // Format date of birth as YYYY-MM-DD string
      const dateOfBirth = data.dateOfBirth
        ? data.dateOfBirth.format('YYYY-MM-DD')
        : null;

      // Transform data to match API structure (matching API response format)
      const mutationData: LeadMutationData = {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: phoneNumber,
        date_of_birth: dateOfBirth || '',
        gender: gender || null,
        referral_source: data.referralSource || null,
        status: leadStatus,
        guardian_relation: data.guardianRelation || null,
        address: {
          line1: data.streetAddress || null,
          line2: null,
          city: data.city || null,
          state: data.state || null,
          zipcode: data.zipCode || null,
          country: null,
        },
        // Guardian object - only include if name or email provided (not if guardian_id is used)
        ...(data.guardianId ? {} : ((guardianFirstName || guardianLastName || data.guardianEmail) ? {
          guardian: {
            first_name: guardianFirstName || null,
            last_name: guardianLastName || null,
            phone: guardianPhone,
            email: data.guardianEmail || null,
          }
        } : {})),
        guardian_uuid: data.guardianId?.trim() || null,
        // Agent (Service Manager) object - only include if name or email provided (not if agent_uuid is used)
        ...(data.serviceManagerId ? {} : ((agentFirstName || agentLastName || data.serviceManagerEmail) ? {
          agent: {
            first_name: agentFirstName || null,
            last_name: agentLastName || null,
            phone: agentPhone,
            email: data.serviceManagerEmail || null,
          }
        } : {})),
        agent_uuid: data.serviceManagerId?.trim() || null,
        insurance: {
          provider: data.insuranceProvider || null,
          policy_number: data.policyNumber || null,
          status: insuranceStatus, // boolean
        },
      };


      // Validate mutation data against schema
      // Remove guardian/agent from validation if IDs are provided (they'll be undefined anyway)
      let validatedData: LeadMutationData;
      try {
        // If guardian_id is provided, don't validate guardian object
        const dataToValidate = { ...mutationData };
        if (data.guardianId && dataToValidate.guardian === undefined) {
          // guardian is already undefined, which is fine
        }
        // If agent_id is provided, don't validate agent object  
        if (data.serviceManagerId && dataToValidate.agent === undefined) {
          // agent is already undefined, which is fine
        }

        validatedData = await leadMutationSchema.validate(dataToValidate, {
          abortEarly: false,
          stripUnknown: true,
          context: dataToValidate,
        });
        // console.log('Validation passed:', validatedData);
        // console.log('Validated Guardian UUID:', validatedData.guardian_uuid);
        // console.log('Validated Agent UUID:', validatedData.agent_uuid);
      } catch (validationError: any) {
        console.error('Validation error:', validationError);
        const validationMessage = validationError?.errors?.join(', ') || validationError?.message || 'Validation failed. Please check your input.';
        setSnackbar({
          open: true,
          message: validationMessage,
          status: 'error',
        });
        return;
      }

      // Transform to LeadCreateWritable for API
      const leadData: LeadCreateWritable & { guardian_uuid?: string | null; agent_uuid?: string | null } = {
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        email: validatedData.email,
        phone: validatedData.phone,
        date_of_birth: validatedData.date_of_birth || undefined,
        gender: validatedData.gender as GenderEnum | undefined,
        referral_source: validatedData.referral_source || undefined,
        address: validatedData.address || undefined,
        ...(validatedData.guardian ? { guardian: validatedData.guardian as any } : {}),
        guardian_relation: validatedData.guardian_relation || null,
        ...(validatedData.agent ? { agent: validatedData.agent as any } : {}),
        insurance: validatedData.insurance || undefined,
        status: (validatedData.status || leadStatus) as Status7B0Enum,
      };

      // Include guardian_uuid and agent_uuid if they exist
      if (validatedData.guardian_uuid) {
        (leadData as any).guardian_uuid = validatedData.guardian_uuid;
      }
      if (validatedData.agent_uuid) {
        (leadData as any).agent_uuid = validatedData.agent_uuid;
      }

      // Store form data in ref for use in onSuccess callback
      formDataRef.current = data;

      // If avatar file is present, send multipart (data + avatar); otherwise JSON
      const avatarFile = data.profilePicture instanceof File ? data.profilePicture : null;
      if (avatarFile) {
        const formData = new FormData();
        formData.append('data', JSON.stringify(leadData));
        formData.append('avatar', avatarFile);
        createLead.mutate({ body: formData } as any);
      } else {
        createLead.mutate({
          body: leadData,
        } as any);
      }
    } catch (error: unknown) {
      console.error('Error in handleSubmit:', error);

      // Handle yup validation errors (these are caught before API call)
      if (error && typeof error === 'object' && 'name' in error && error.name === 'ValidationError') {
        const validationError = error as { errors?: string[]; message?: string };
        const errorMessage = validationError.errors?.join(', ') || validationError.message || 'Validation failed';
        setSnackbar({
          open: true,
          message: errorMessage,
          status: 'error',
        });
      }
      // API errors are handled by mutation's onError callback
      // This catch block is mainly for validation errors
    }
  };

  // Handle form submission (Submit button) - status: COMPLETED
  const handleSubmit = async (data: FormData) => {
    if (!leadUuid) return; // ✅ UUID required

    isFinalSubmitRef.current = true;
    const payload = buildLeadPayload(data, 'COMPLETED');

    const avatarFile = data.profilePicture instanceof File ? data.profilePicture : null;
    if (avatarFile) {
      const formData = new FormData();
      formData.append('data', JSON.stringify(payload));
      formData.append('avatar', avatarFile);
      updateLead.mutate({
        path: { uuid: leadUuid },
        body: formData,
      } as any);
    } else {
      // Signal avatar deletion if profile picture was removed
      if (!data.profilePicture) {
        (payload as any).avatar_url = null;
        (payload as any).profile_picture_media_id = null;
      }
      updateLead.mutate({
        path: { uuid: leadUuid },
        body: payload,
      } as any);
    }
  };



  // Handle save as draft - status: DRAFT
  const handleSaveDraft = async (data: FormData) => {
    const payload = buildLeadPayload(data, 'DRAFT');
    const avatarFile = data.profilePicture instanceof File ? data.profilePicture : null;

    // 🟢 FIRST TIME → CREATE
    if (!leadId) {
      const body = avatarFile
        ? (() => {
          const formData = new FormData();
          formData.append('data', JSON.stringify(payload));
          formData.append('avatar', avatarFile);
          return formData;
        })()
        : payload;

      // Store the payload snapshot so we can skip redundant updates later
      lastSavedPayloadRef.current = JSON.stringify(payload);

      return createLead.mutateAsync(
        { body } as any,
        {
          onSuccess: (res: any) => {
            const uuid =
              res?.data?.lead?.uuid ||
              res?.data?.uuid ||
              res?.uuid ||
              null;

            setLeadId(uuid);
            setLeadUuid(uuid);

          },
        }
      );
    }
    // 🟡 ALREADY CREATED → UPDATE
    else {
      if (!leadUuid) return;

      // Signal avatar deletion if profile picture was removed
      if (!avatarFile && !data.profilePicture) {
        (payload as any).avatar_url = null;
        (payload as any).profile_picture_media_id = null;
      }

      // Skip PUT call if payload hasn't changed and no new avatar file
      const currentPayloadJson = JSON.stringify(payload);
      if (!avatarFile && lastSavedPayloadRef.current === currentPayloadJson) {
        return; // No changes — skip redundant API call
      }

      const body = avatarFile
        ? (() => {
          const formData = new FormData();
          formData.append('data', JSON.stringify(payload));
          formData.append('avatar', avatarFile);
          return formData;
        })()
        : payload;

      // Update the snapshot after successful call
      lastSavedPayloadRef.current = currentPayloadJson;

      return updateLead.mutateAsync({
        path: { uuid: leadUuid },
        body,
      } as any);

    }
  };


  return (
    <>
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
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
            padding: '12px 16px',
            borderBottom: '1px solid #E3ECEF',
            flexShrink: 0,
            marginTop: '-10px',
          }}
        >
          <Typography
            sx={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#424342',
              fontFamily: 'Geist',
            }}
          >
            Add New Lead
          </Typography>
          <Grid
            size={{ xs: 12 }}
            sx={{
              width: '38px',
              height: '38px',
              borderRadius: '18px',
              backgroundColor: '#F6F6F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            onClick={onClose}
          >
            <Typography sx={{ fontSize: '25px', color: '#2C2D2C' }}>
              ×
            </Typography>
          </Grid>
        </Grid>

        {/* Step Indicator */}
        <Box
          sx={{
            px: 3,
            pt: 2,
            pb: 2,
            backgroundColor: '#FFFFFF',
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              flexWrap: 'nowrap',
            }}
          >
            {steps.map((step, index) => {
              const stepIndex = index + 1;
              const isActive = activeStep === step.id;
              const currentStepIndex = steps.findIndex(s => s.id === activeStep);
              const isCompleted = currentStepIndex > index;

              return (
                <React.Fragment key={step.id}>
                  <Box
                    onClick={() => {
                      // Allow navigation to completed steps or current step
                      if (index <= currentStepIndex) {
                        setActiveStep(step.id);
                      }
                    }}
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 1,
                      cursor: index <= currentStepIndex ? 'pointer' : 'default',
                    }}
                  >
                    {isCompleted ? (
                      <CheckCircleIcon
                        sx={{
                          width: 32,
                          height: 32,
                          color: '#4CAF50',
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isActive ? '#0A2E45' : '#E3ECEF',
                          color: isActive ? '#FFFFFF' : '#757775',
                          fontWeight: 600,
                          fontSize: '14px',
                          border: isActive ? '2px solid #0A2E45' : '2px solid transparent',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {stepIndex}
                      </Box>
                    )}
                    <Typography
                      sx={{
                        fontSize: '14px',
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? '#0A2E45' : '#757775',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {step.label}
                    </Typography>
                  </Box>
                  {index < steps.length - 1 && (
                    <Box
                      sx={{
                        width: 60,
                        height: 2,
                        backgroundColor: isCompleted ? '#4CAF50' : '#E3ECEF',
                        mx: 1,
                        transition: 'all 0.3s ease',
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </Box>
        </Box>

        {/* Form Content */}
        <Box
          sx={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          <NewLeadForm
            ref={formRef}
            activeStep={activeStep}
            steps={steps}
            leadId={leadId}
            onStepChange={handleStepChange}
            onSubmit={handleSubmit}
            onCancel={onClose}
            onSaveDraft={handleSaveDraft}
          />

        </Box>
      </Box>

      <CommonSnackbar
        message={snackbar.message}
        status={snackbar.status}
        isOpen={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </>
  );
};

export default NewLeadDrawer;
