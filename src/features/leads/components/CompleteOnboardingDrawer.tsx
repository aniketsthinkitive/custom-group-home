import React, { useRef, useMemo, useState, useEffect } from 'react';
import CustomDrawer from '../../../components/custom-drawer/custom-drawer';
import CompleteOnboardingForm, { type OnboardingFormData, type CompleteOnboardingFormRef } from './CompleteOnboardingForm';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listGroupHomesOptions, retrieveGroupHomeOptions, completeOnboardingMutation, getLeadDetailQueryKey } from '../../../sdk/@tanstack/react-query.gen';
import { invalidateLeadsListWithPredicate } from '../utils/queryInvalidation';

interface CompleteOnboardingDrawerProps {
  open: boolean;
  leadUuid: string;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

const CompleteOnboardingDrawer: React.FC<CompleteOnboardingDrawerProps> = ({
  open,
  leadUuid,
  onClose,
  onSuccess,
  onError,
}) => {
  const formRef = useRef<CompleteOnboardingFormRef>(null);
  const queryClient = useQueryClient();
  const [selectedGroupHomeUuid, setSelectedGroupHomeUuid] = useState<string | null>(null);

  // Fetch group homes - only when drawer is open
  const { data: groupHomesResponse } = useQuery({
    ...listGroupHomesOptions({
      query: {
        page: 1,
        size: 1000, // Get all group homes
      },
    }),
    enabled: open, // Only fetch when drawer is open
  });

  // Fetch group home details when a group home is selected (using uuid)
  const { data: groupHomeDetailResponse } = useQuery({
    ...retrieveGroupHomeOptions({
      path: {
        uuid: selectedGroupHomeUuid || '',
      },
    }),
    enabled: !!selectedGroupHomeUuid && open,
  });

  // Create a map of id to uuid for group homes
  const groupHomeIdToUuidMap = useMemo(() => {
    if (!groupHomesResponse) return new Map<string, string>();
    const responseData = groupHomesResponse as any;
    let homesList: any[] = [];

    if (responseData?.data) {
      if (Array.isArray(responseData.data)) {
        homesList = responseData.data;
      } else if (responseData.data.results && Array.isArray(responseData.data.results)) {
        homesList = responseData.data.results;
      } else if (responseData.data.content && Array.isArray(responseData.data.content)) {
        homesList = responseData.data.content;
      }
    }

    const map = new Map<string, string>();
    homesList.forEach((home: any) => {
      if (home.id && home.uuid) {
        map.set(String(home.id), home.uuid);
      }
    });
    return map;
  }, [groupHomesResponse]);

  // Transform group homes data for dropdown (using id as value)
  const groupHomes = useMemo(() => {
    if (!groupHomesResponse) return [];
    const responseData = groupHomesResponse as any;
    let homesList: any[] = [];

    if (responseData?.data) {
      if (Array.isArray(responseData.data)) {
        homesList = responseData.data;
      } else if (responseData.data.results && Array.isArray(responseData.data.results)) {
        homesList = responseData.data.results;
      } else if (responseData.data.content && Array.isArray(responseData.data.content)) {
        homesList = responseData.data.content;
      }
    }

    return homesList
      .filter((home: any) => home.active === true) // Only show active group homes
      .map((home: any) => {
        // Calculate available rooms (not occupied and active)
        const availableRoomsCount = home.rooms?.filter(
          (room: any) => room.is_active !== false && room.is_occupied === false
        ).length || 0;

        const label = home.name || "Unknown Group Home";
        const availabilitySuffix = availableRoomsCount === 0 ? " (No Rooms Available)" : "";

        return {
          value: home.uuid, // Use uuid as value for form submission
          label: `${label}${availabilitySuffix}`,
          disabled: availableRoomsCount === 0,
        };
      });
  }, [groupHomesResponse]);

  // Transform rooms data for dropdown
  const rooms = useMemo(() => {
    if (!groupHomeDetailResponse || !selectedGroupHomeUuid) return [];
    const responseData = groupHomeDetailResponse as any;
    const groupHome = responseData?.data;

    if (!groupHome?.rooms || !Array.isArray(groupHome.rooms)) return [];

    return groupHome.rooms
      .filter((room: any) => room.is_active !== false && room.is_occupied === false) // Only active and unoccupied rooms
      .map((room: any) => ({
        value: room.uuid,
        label: room.room_number ? `Room ${room.room_number}` : `Room ${room.uuid}`,
      }))
      .sort((a: any, b: any) => {
        // Sort by room number if numeric, otherwise alphabetically
        const aNum = parseInt(a.label.replace(/\D/g, ''), 10);
        const bNum = parseInt(b.label.replace(/\D/g, ''), 10);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        return a.label.localeCompare(b.label);
      });
  }, [groupHomeDetailResponse, selectedGroupHomeUuid]);

  // Helper function to extract backend message from response
  const getBackendMessage = (response: unknown): string | undefined => {
    const data = response as { message?: string; data?: { message?: string } } | undefined;
    return data?.message ?? data?.data?.message ?? undefined;
  };

  // Complete onboarding mutation
  const completeOnboardingMutationHook = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(completeOnboardingMutation() as any),
    onSuccess: async (data: unknown) => {
      // Extract backend message from response
      const backendMessage = getBackendMessage(data);

      // Reset form after successful completion
      if (formRef.current) {
        formRef.current.resetForm();
      }

      // Invalidate lead detail using SDK-generated query key
      await queryClient.invalidateQueries({
        queryKey: getLeadDetailQueryKey({ path: { uuid: leadUuid } }),
      });

      // Also invalidate list queries using centralized utility
      await invalidateLeadsListWithPredicate(queryClient);

      if (onSuccess) {
        onSuccess(backendMessage || "Onboarding completed successfully.");
      }

      onClose();
      setSelectedGroupHomeUuid(null);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      // Extract error message from backend response
      const errorData = error?.response?.data as {
        message?: string;
        detail?: string;
        missing_forms?: string[];
      } | undefined;
      const errorMessage =
        errorData?.message ||
        errorData?.detail ||
        error?.message ||
        "Failed to complete onboarding. Please try again.";

      if (onError) {
        onError(errorMessage);
      }
    },
  });

  const handleSubmit = (data: OnboardingFormData) => {
    if (!data.checkInDate) {
      if (onError) {
        onError('Check-in date is required');
      }
      return;
    }

    // Format check-in date as YYYY-MM-DD
    const checkInDateStr = data.checkInDate.format('YYYY-MM-DD');

    // Complete onboarding using mutation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    completeOnboardingMutationHook.mutate({
      path: {
        lead_uuid: leadUuid,
      },
      body: {
        group_home: data.groupHome,
        room: data.room,
        check_in_date: checkInDateStr,
      },
    } as any);
  };

  const handleCancel = () => {
    if (formRef.current) {
      formRef.current.resetForm();
    }
    setSelectedGroupHomeUuid(null);
    onClose();
  };

  const handleGroupHomeChange = (groupHomeUuid: string) => {
    setSelectedGroupHomeUuid(groupHomeUuid || null);
  };

  // Reset form when drawer opens
  useEffect(() => {
    if (open) {
      if (formRef.current) {
        formRef.current.resetForm();
      }
      setSelectedGroupHomeUuid(null);
    }
  }, [open]);

  return (
    <CustomDrawer
      anchor="right"
      open={open}
      onClose={handleCancel}
      drawerWidth="825px"
      drawermargin="0"
      drawerPadding="0"
    >
      <CompleteOnboardingForm
        ref={formRef}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={completeOnboardingMutationHook.isPending}
        groupHomes={groupHomes}
        rooms={rooms}
        onGroupHomeChange={handleGroupHomeChange}
      />
    </CustomDrawer>
  );
};

export default CompleteOnboardingDrawer;
