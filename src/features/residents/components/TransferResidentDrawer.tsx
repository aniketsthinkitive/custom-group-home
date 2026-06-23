import React, { useRef, useMemo, useState, useEffect } from 'react';
import CustomDrawer from '../../../components/custom-drawer/custom-drawer';
import TransferResidentForm, { type TransferResidentFormData, type TransferResidentFormRef } from './TransferResidentForm';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listGroupHomesOptions, retrieveGroupHomeOptions, transferResidentMutation } from '../../../sdk/@tanstack/react-query.gen';
import dayjs from 'dayjs';

interface TransferResidentDrawerProps {
  open: boolean;
  assignmentUuid: string;
  leadUuid: string;
  currentGroupHomeId?: number;
  currentGroupHomeName?: string;
  currentGroupHomeUuid?: string;
  currentRoomUuid?: string;
  currentRoomId?: number;
  currentCheckInDate?: string;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

const TransferResidentDrawer: React.FC<TransferResidentDrawerProps> = ({
  open,
  assignmentUuid,
  leadUuid,
  currentGroupHomeId,
  currentGroupHomeName,
  currentGroupHomeUuid,
  currentRoomUuid,
  currentRoomId,
  currentCheckInDate,
  onClose,
  onSuccess,
  onError,
}) => {
  const formRef = useRef<TransferResidentFormRef>(null);
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

  // Parse the flat list of group homes from the API response
  const homesList = useMemo(() => {
    if (!groupHomesResponse) return [];
    const responseData = groupHomesResponse as any;

    if (responseData?.data) {
      if (Array.isArray(responseData.data)) return responseData.data;
      if (Array.isArray(responseData.data.results)) return responseData.data.results;
      if (Array.isArray(responseData.data.content)) return responseData.data.content;
    }
    return [];
  }, [groupHomesResponse]);

  // Transform group homes data for dropdown (uuid as value).
  // Only show group homes that have at least one available room (is_active and not occupied).
  // Always include the current group home so it prepopulates correctly.
  const groupHomes = useMemo(() => {
    const listIncludesRooms = homesList.some((home: any) => Array.isArray(home.rooms));
    return homesList
      .filter((home: any) => {
        if (home.active !== true) return false;
        // Always keep the current group home in the list
        if (currentGroupHomeUuid && home.uuid === currentGroupHomeUuid) return true;
        if (currentGroupHomeName && home.name === currentGroupHomeName) return true;
        const rooms = home.rooms || [];
        // If list API doesn't include rooms at all, show all active homes so dropdown isn't empty
        if (!listIncludesRooms) return true;
        if (rooms.length === 0) return false; // has rooms key but none → hide
        const availableRooms = rooms.filter(
          (r: any) => r.is_active !== false && r.is_occupied === false,
        );
        return availableRooms.length > 0;
      })
      .map((home: any) => ({
        value: home.uuid as string,
        label: (home.name || 'Unknown Group Home') as string,
      }));
  }, [homesList, currentGroupHomeUuid, currentGroupHomeName]);

  // Use UUID directly from API, fallback to name-based lookup
  const resolvedGroupHomeUuid = useMemo(() => {
    if (currentGroupHomeUuid) return currentGroupHomeUuid;
    if (!currentGroupHomeName || homesList.length === 0) return "";
    const match = homesList.find((h: any) => h.name === currentGroupHomeName);
    return match?.uuid || "";
  }, [currentGroupHomeUuid, currentGroupHomeName, homesList]);

  // Transform rooms data for dropdown
  const rooms = useMemo(() => {
    if (!groupHomeDetailResponse || !selectedGroupHomeUuid) return [];
    const responseData = groupHomeDetailResponse as any;
    const groupHome = responseData?.data;

    if (!groupHome?.rooms || !Array.isArray(groupHome.rooms)) return [];

    return groupHome.rooms
      .filter((room: any) => room.is_active !== false && (room.is_occupied === false || room.uuid === currentRoomUuid))
      .map((room: any) => ({
        value: room.uuid,
        label: room.room_number ? `Room ${room.room_number}` : `Room ${room.uuid}`,
      }))
      .sort((a: any, b: any) => {
        const aNum = parseInt(a.label.replace(/\D/g, ''), 10);
        const bNum = parseInt(b.label.replace(/\D/g, ''), 10);
        if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
        return a.label.localeCompare(b.label);
      });
  }, [groupHomeDetailResponse, selectedGroupHomeUuid]);

  // Initial form values derived from the current assignment
  const initialValues = useMemo(() => ({
    groupHome: resolvedGroupHomeUuid,
    room: currentRoomUuid || "",
    checkInDate: dayjs(),
  }), [resolvedGroupHomeUuid, currentRoomUuid]);

  // When drawer opens, set selected group home UUID so rooms get fetched
  useEffect(() => {
    if (open && resolvedGroupHomeUuid) {
      setSelectedGroupHomeUuid(resolvedGroupHomeUuid);
    }
    if (!open) {
      setSelectedGroupHomeUuid(null);
    }
  }, [open, resolvedGroupHomeUuid]);

  // Once rooms list loads, auto-select the current room if it exists in the list
  useEffect(() => {
    if (open && currentRoomUuid && rooms.length > 0) {
      const match = rooms.find((r: any) => r.value === currentRoomUuid);
      if (match && formRef.current) {
        formRef.current.setValues({ room: currentRoomUuid });
      }
    }
  }, [open, currentRoomUuid, rooms]);

  // Helper function to extract backend message from response
  const getBackendMessage = (response: unknown): string | undefined => {
    const data = response as { message?: string; data?: { message?: string } } | undefined;
    return data?.message ?? data?.data?.message ?? undefined;
  };

  // State to hold error message for form
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Clear error when drawer opens
  useEffect(() => {
    if (open) {
      setErrorMessage(null);
    }
  }, [open]);

  // Transfer resident mutation
  const transferResidentMutationHook = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(transferResidentMutation() as any),
    onSuccess: async (data: unknown) => {
      const backendMessage = getBackendMessage(data);
      setErrorMessage(null);

      if (formRef.current) {
        formRef.current.resetForm();
      }

      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          if (Array.isArray(key) && key[0] && typeof key[0] === 'object') {
            const id = (key[0] as any)?._id;
            return id === 'listResidents' || id === 'getLeadDetail';
          }
          return false;
        },
      });

      if (backendMessage && onSuccess) {
        onSuccess(backendMessage);
      }

      onClose();
      setSelectedGroupHomeUuid(null);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      let errMsg = "Failed to transfer resident";

      if (error?.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === "string") {
          errMsg = errorData;
        } else if (errorData?.message) {
          errMsg = errorData.message;
        } else if (errorData?.detail) {
          errMsg = errorData.detail;
        } else if (errorData?.error) {
          errMsg = errorData.error;
        } else if (Array.isArray(errorData) && errorData.length > 0) {
          errMsg = errorData[0];
        } else if (typeof errorData === "object") {
          const firstKey = Object.keys(errorData)[0];
          if (firstKey) {
            const firstValue = errorData[firstKey];
            if (Array.isArray(firstValue) && firstValue.length > 0) {
              errMsg = firstValue[0];
            } else if (typeof firstValue === "string") {
              errMsg = firstValue;
            }
          }
        }
      } else if (error?.message) {
        errMsg = error.message;
      }

      setErrorMessage(errMsg);
      if (onError) {
        onError(errMsg);
      }
    },
  });

  const handleSubmit = (data: TransferResidentFormData) => {
    if (!data.checkInDate) {
      if (onError) {
        onError('Check-in date is required');
      }
      return;
    }

    // Check if resident is already in the same group home and room
    if (
      data.groupHome === resolvedGroupHomeUuid &&
      data.room && data.room === currentRoomUuid
    ) {
      setErrorMessage("Resident is already in this room");
      return;
    }

    const checkInDateStr = data.checkInDate.format('YYYY-MM-DD');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transferResidentMutationHook.mutate({
      path: {
        assignment_uuid: assignmentUuid,
      },
      body: {
        group_home: data.groupHome,
        room: data.room || null,
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
    // Dropdown value is already a UUID, set it directly to trigger room fetch
    if (groupHomeUuid) {
      setSelectedGroupHomeUuid(groupHomeUuid);
    }
  };

  return (
    <CustomDrawer
      anchor="right"
      open={open}
      onClose={handleCancel}
      drawerWidth="825px"
      drawermargin="0"
      drawerPadding="0"
    >
      <TransferResidentForm
        ref={formRef}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={transferResidentMutationHook.isPending}
        groupHomes={groupHomes}
        rooms={rooms}
        onGroupHomeChange={handleGroupHomeChange}
        initialValues={initialValues}
        error={errorMessage}
      />
    </CustomDrawer>
  );
};

export default TransferResidentDrawer;
