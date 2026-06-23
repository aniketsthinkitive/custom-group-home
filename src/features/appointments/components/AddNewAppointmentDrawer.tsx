import React, { useRef, useMemo, useCallback, useState } from "react";
import CustomDrawer from "../../../components/custom-drawer/custom-drawer";
import AddNewAppointmentForm, {
  type AppointmentFormData,
  type AddNewAppointmentFormRef,
} from "./AddNewAppointmentForm";
import {
  useMutation,
  useQueryClient,
  type DefaultError,
} from "@tanstack/react-query";
import type { AxiosError } from "axios";
import {
  createAppointmentMutation,
  listAppointmentsQueryKey,
  getLeadDetailOptions,
} from "../../../sdk/@tanstack/react-query.gen";
import { useResidentsQuery } from "../../../features/incidents/hooks/useIncidents";
import { usePermission } from "../../../hooks/usePermission";
import { useAppSelector } from "../../../store/hooks";

interface AddNewAppointmentDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  defaultResidentId?: string;
  defaultResidentName?: string;
  lockResident?: boolean;
}

const AddNewAppointmentDrawer: React.FC<AddNewAppointmentDrawerProps> = ({
  open,
  onClose,
  onSuccess,
  onError,
  defaultResidentId,
  defaultResidentName,
  lockResident,
}) => {
  const formRef = useRef<AddNewAppointmentFormRef>(null);
  const queryClient = useQueryClient();
  const [isResidentsDropdownOpen, setIsResidentsDropdownOpen] =
    React.useState(false);

  // Determine if this user has ASSIGNED_HOME scope (e.g. nurse)
  const { getScope } = usePermission();
  const userFromStore = useAppSelector((state) => state.auth.user);
  const appointmentScope = getScope("appointments.view") || getScope("appointments.create");
  const isAssignedHome = appointmentScope === "ASSIGNED_HOME";
  const userGroupHomeUuid = isAssignedHome
    ? ((userFromStore as any)?.group_home?.uuid || "")
    : "";

  // Fetch residents - always fetch when drawer is open, even if locked (needed for dropdown)
  // For ASSIGNED_HOME scope (e.g. nurses): only fetch residents from their group home
  const { data: residentsData, isLoading: isResidentsLoading } =
    useResidentsQuery(undefined, "ACTIVE", open, userGroupHomeUuid || undefined);

  // Create appointment mutation
  const createAppointmentMutationHook = useMutation({
    ...(createAppointmentMutation() as any),
    onSuccess: (data: unknown) => {
      // Extract message from backend response
      const responseData = data as {
        message?: string;
        status?: string;
        code?: number;
      };
      const successMessage =
        responseData?.message || "Appointment created successfully!";

      // Reset form after successful creation
      if (formRef.current) {
        formRef.current.resetForm();
      }

      // Invalidate and refetch appointments list
      queryClient.invalidateQueries({
        queryKey: listAppointmentsQueryKey(),
      });

      if (onSuccess) {
        onSuccess(successMessage);
      }
      onClose();
    },
    onError: (error: AxiosError<DefaultError>) => {
      const errorData = error.response?.data as
        | { message?: string; errors?: Record<string, unknown> }
        | undefined;
    
      let errorMessage = "Failed to create appointment. Please try again.";
    
      // ✅ PRIORITIZE FIELD ERRORS
      if (errorData?.errors) {
        const errorMessages = Object.values(errorData.errors).flat();
    
        errorMessage = Array.isArray(errorMessages)
          ? errorMessages.join(", ")
          : String(errorMessages);
    
      } else if (errorData?.message) {
        errorMessage = errorData.message;
    
      } else if (error.message) {
        errorMessage = error.message;
      }
    
      if (onError) {
        onError(errorMessage);
      }
    },
    
  });

  // Transform residents data for dropdown (keyed by lead UUID)
  const residents = useMemo(() => {
    // ✅ handle all possible shapes
    const raw =
      (Array.isArray(residentsData) && residentsData) ||
      residentsData?.data?.results ||
      residentsData?.results ||
      [];

    const mapped = raw.map((r: any) => ({
      key: String(r.lead_uuid), // dropdown key = lead UUID
      value: r.resident_name, // display name
      leadUuid: r.lead_uuid, // keep uuid
    }));

    // If locked and we have defaultResidentId/defaultResidentName but resident not in list, add it
    if (lockResident && defaultResidentId && defaultResidentName) {
      const exists = mapped.some((r: { key: string }) => r.key === defaultResidentId);
      if (!exists) {
        mapped.unshift({
          key: defaultResidentId,
          value: defaultResidentName,
          leadUuid: defaultResidentId,
        });
      }
    }

    return mapped;
  }, [residentsData, lockResident, defaultResidentId, defaultResidentName]);

  // Guardian cache keyed by leadUuid
  const [guardianCache] = useState<Map<string, { name?: string; email?: string }>>(new Map());

  const fetchGuardianForLead = useCallback(
    async (leadUuid: string): Promise<{ name?: string; email?: string } | undefined> => {
      if (!leadUuid) return undefined;
      if (guardianCache.has(leadUuid)) {
        return guardianCache.get(leadUuid);
      }
      try {
        const result = await queryClient.fetchQuery({
          ...getLeadDetailOptions({ path: { uuid: leadUuid } }),
        } as any);
        const payload = (result as any)?.data ?? (result as any);
        const guardian = payload?.guardian;
        const name =
          guardian?.first_name || guardian?.last_name
            ? `${guardian?.first_name ?? ""} ${guardian?.last_name ?? ""}`.trim()
            : undefined;
        const email = guardian?.email ?? undefined;
        const info = { name, email };
        guardianCache.set(leadUuid, info);
        return info;
      } catch {
        return undefined;
      }
    },
    [guardianCache, queryClient]
  );

  const initialFormData = useMemo(
    () => (defaultResidentId ? { resident_id: defaultResidentId } : undefined),
    [defaultResidentId],
  );

  const handleSubmit = (data: AppointmentFormData) => {
    const formattedDate = data.appointment_date
      ? data.appointment_date.format("YYYY-MM-DD")
      : null;

    const formattedTime = data.appointment_time || null;

    // ✅ Find selected resident from dropdown (key is lead UUID)
    const selectedResident = residents.find(
      (r: { key: string }) => r.key === data.resident_id,
    );

    if (!selectedResident?.leadUuid) {
      onError?.(
        "Resident not found. Please reselect resident.",
      );
      return;
    }

    // ✅ Send lead_uuid instead of numeric lead id
    const apiPayload = {
      appointment_title: data.appointment_title,
      description: data.description || null,
      appointment_date: formattedDate,
      appointment_time: formattedTime,
      contact_type: data.contact_type,
      contact_name: data.contact_name || null,
      contact_email: data.contact_email || null,
      status: "REQUESTED",
      lead_uuid: selectedResident.leadUuid,
    };

    createAppointmentMutationHook.mutate({
      body: apiPayload,
    } as any);
  };

  const handleCancel = () => {
    // Reset form when canceling
    if (formRef.current) {
      formRef.current.resetForm();
    }
    onClose();
  };

  const handleClose = () => {
    // Reset form when closing drawer
    if (formRef.current) {
      formRef.current.resetForm();
    }
    onClose();
  };

  return (
    <CustomDrawer
      anchor="right"
      open={open}
      onClose={handleClose}
      drawerWidth="600px"
      drawermargin="0"
      drawerPadding="0"
    >
      <AddNewAppointmentForm
        key={open ? `appointment-form-${defaultResidentId || 'new'}` : 'appointment-form-closed'}
        ref={formRef}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={createAppointmentMutationHook.isPending}
        isResidentsLoading={isResidentsLoading}
        residents={residents}
        onResidentsDropdownOpen={() => setIsResidentsDropdownOpen(true)}
        disableResidentField={!!lockResident}
        initialData={initialFormData}
        defaultLeadId={defaultResidentId || undefined}
        drawerOpen={open}
        onGuardianPrefillRequest={fetchGuardianForLead}
      />
    </CustomDrawer>
  );
};

export default AddNewAppointmentDrawer;
