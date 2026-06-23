import React, { useRef, useMemo } from "react";
import CustomDrawer from "../../../components/custom-drawer/custom-drawer";
import AddNewAppointmentForm, {
  type AppointmentFormData,
  type AddNewAppointmentFormRef,
} from "./AddNewAppointmentForm";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type DefaultError,
} from "@tanstack/react-query";
import type { AxiosError } from "axios";
import {
  updateAppointmentMutation,
  getAppointmentOptions,
  listAppointmentsQueryKey,
} from "../../../sdk/@tanstack/react-query.gen";
import { useResidentsQuery } from "../../../features/incidents/hooks/useIncidents";
import type { AppointmentData } from "./AppointmentsTable";

interface EditAppointmentDrawerProps {
  open: boolean;
  appointment: AppointmentData | null;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  disableResidentField?: boolean;
}

const EditAppointmentDrawer: React.FC<EditAppointmentDrawerProps> = ({
  open,
  appointment,
  onClose,
  onSuccess,
  onError,
  disableResidentField = true,
}) => {
  const formRef = useRef<AddNewAppointmentFormRef>(null);
  const queryClient = useQueryClient();
  const [isResidentsDropdownOpen, setIsResidentsDropdownOpen] =
    React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const pendingUpdateRef = useRef<any>(null);

  // Fetch appointment details if UUID is available
  const { data: appointmentDetails } = useQuery({
    ...getAppointmentOptions({
      path: {
        uuid: appointment?.uuid || "",
      },
    }),
    enabled: open && !!appointment?.uuid && !isSaving,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: 5_000,
    gcTime: 30_000,
  });

  // Fetch residents when edit drawer opens so Resident Name label maps immediately
  const { data: residentsData } = useResidentsQuery(
    undefined,
    "ACTIVE",
    open,
  );

  // Update appointment mutation
  const updateAppointmentMutationHook = useMutation<
    any,
    AxiosError<DefaultError>,
    { path: { uuid: string }; body: any }
  >({
    ...(updateAppointmentMutation() as any),
    onMutate: (variables) => {
      setIsSaving(true);
      pendingUpdateRef.current = variables?.body || null;
    },
    onSuccess: (data: unknown, variables) => {
      // Extract message from backend response
      const responseData = data as {
        message?: string;
        status?: string;
        code?: number;
      };
      const successMessage =
        responseData?.message || "Appointment updated successfully!";

      // Optimistically update appointment details cache so reopen shows latest immediately
      if (variables?.path?.uuid) {
        const detailsOptions = getAppointmentOptions({
          path: { uuid: variables.path.uuid },
        });
        // @ts-expect-error generated options carry queryKey
        const detailsKey = (detailsOptions as any).queryKey;
        queryClient.setQueryData(detailsKey, (prev: any) => {
          // Handle common shapes: {data: {...}} or {...}
          if (prev && typeof prev === "object") {
            if ("data" in prev && prev.data) {
              return {
                ...prev,
                data: {
                  ...prev.data,
                  ...variables?.body,
                },
              };
            }
            return {
              ...prev,
              ...variables?.body,
            };
          }
          return { data: { ...(variables?.body || {}) } };
        });
      }

      // Invalidate and refetch appointments list
      queryClient.invalidateQueries({
        queryKey: listAppointmentsQueryKey(),
      });

      // Reset form after successful update to clear any dirty states
      if (formRef.current) {
        formRef.current.resetForm();
      }

      if (onSuccess) {
        onSuccess(successMessage);
      }
      onClose();
    },
    onSettled: () => {
      setIsSaving(false);
      pendingUpdateRef.current = null;
    },
    onError: (error: AxiosError<DefaultError>) => {
      // Extract error message from backend response
      const errorData = error.response?.data as
        | { message?: string; errors?: Record<string, unknown> }
        | undefined;
      let errorMessage = "Failed to update appointment. Please try again.";

      if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData?.errors) {
        // Handle validation errors
        const errorMessages = Object.values(errorData.errors).flat();
        errorMessage = Array.isArray(errorMessages)
          ? errorMessages.join(", ")
          : String(errorMessages);
      } else if (error.message) {
        errorMessage = error.message;
      }

      if (onError) {
        onError(errorMessage);
      }
    },
  });

  // Transform residents data for dropdown
  const residents = useMemo(() => {
    const list: any[] =
      (residentsData as any)?.data?.results ??
      (Array.isArray(residentsData) ? residentsData : []);

    return list
      .map((r: any) => {
        const leadUuid = String(r?.lead_uuid ?? "").trim();
        const name = String(r?.resident_name ?? r?.full_name ?? "").trim();

        if (!leadUuid || !name) return null;

        return {
          key: leadUuid,
          value: name,
          leadUuid,
        };
      })
      .filter(
        (x): x is { key: string; value: string; leadUuid: string } => x !== null,
      )
      .sort((a, b) => a.value.localeCompare(b.value));
  }, [residentsData]);

  // Get appointment data (use fetched details if available, otherwise use passed appointment)
  const appointmentData = useMemo(() => {
    if (
      appointmentDetails &&
      typeof appointmentDetails === "object" &&
      "data" in appointmentDetails
    ) {
      const details = appointmentDetails.data as any;
      return {
        ...appointment,
        ...details,
      } as AppointmentData;
    }
    return appointment;
  }, [appointmentDetails, appointment]);

  // Merge pending changes while saving to avoid visual revert
  const displayedAppointmentData = useMemo(() => {
    if (isSaving && pendingUpdateRef.current) {
      return {
        ...(appointmentData as any),
        ...(pendingUpdateRef.current || {}),
      } as AppointmentData;
    }
    return appointmentData;
  }, [appointmentData, isSaving]);

  const resolvedResidentKey = useMemo(() => {
    const apt: any = displayedAppointmentData;
    if (!apt) return "";

    // Use lead_uuid from appointment
    const leadUuid = String(apt?.lead_uuid ?? "").trim();
    if (leadUuid) {
      const hit = residents.find((r) => r.key === leadUuid);
      if (hit) return hit.key;
      return leadUuid;
    }

    // Fallback: resident_name match
    const name = String(apt?.resident_name ?? "")
      .trim()
      .toLowerCase();
    if (!name) return "";

    const match = residents.find(
      (r) => String(r.value).trim().toLowerCase() === name,
    );
    return match ? match.key : "";
  }, [displayedAppointmentData, residents]);

  const residentKey = useMemo(() => {
    const apt: any = displayedAppointmentData;
    return String(apt?.lead_uuid ?? "").trim();
  }, [displayedAppointmentData]);

  const handleSubmit = (data: AppointmentFormData) => {
    if (!appointmentData?.uuid) {
      if (onError) {
        onError("Appointment UUID not found");
      }
      return;
    }

    // Format date to YYYY-MM-DD
    const formattedDate = data.appointment_date
      ? data.appointment_date.format("YYYY-MM-DD")
      : null;

    // Format time to HH:MM:SS (backend expects time format)
    const formattedTime = data.appointment_time || null;

    // Prepare API payload
    const apiPayload: {
      appointment_title: string;
      description: string | null;
      appointment_date: string | null;
      appointment_time: string | null;
      contact_type: string;
      contact_name: string | null;
      contact_email: string | null;
    } = {
      appointment_title: data.appointment_title,
      description: data.description || null,
      appointment_date: formattedDate,
      appointment_time: formattedTime,
      contact_type: data.contact_type,
      contact_name: data.contact_name || null,
      contact_email: data.contact_email || null,
    };

    updateAppointmentMutationHook.mutate({
      path: { uuid: appointmentData.uuid },
      body: apiPayload as any,
    });
  };

  const handleCancel = () => {
    onClose();
  };

  if (!appointmentData) {
    return null;
  }

  return (
    <CustomDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      drawerWidth="600px"
      drawermargin="0"
      drawerPadding="0"
    >
      <AddNewAppointmentForm
        key={`${displayedAppointmentData?.uuid}`} // keep stable to avoid flicker
        ref={formRef}
        isEdit={true}
        initialData={{
          ...(displayedAppointmentData as any),
          resident_id: resolvedResidentKey, // ✅ must match residents.key
        }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={updateAppointmentMutationHook.isPending}
        residents={residents}
        onResidentsDropdownOpen={() => setIsResidentsDropdownOpen(true)}
        disableResidentField={true}
      />
    </CustomDrawer>
  );
};

export default EditAppointmentDrawer;
