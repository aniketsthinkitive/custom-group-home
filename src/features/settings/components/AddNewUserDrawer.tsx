import React, { useRef, useMemo } from "react";
import CustomDrawer from "../../../components/custom-drawer/custom-drawer";
import AddNewUserForm, {
  type UserFormData,
  type AddNewUserFormRef,
} from "./AddNewUserForm";
import { useQuery, useMutation, type DefaultError } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import {
  listRolesOptions,
  listUsersQueryKey,
  registerUserMutation,
  updateUserMutation,
  getUserDetailOptions,
} from "../../../sdk/@tanstack/react-query.gen";
import { listGroupHomesOptions } from "../../../sdk/@tanstack/react-query.gen";
import { useQueryClient } from "@tanstack/react-query";
import { useResidentsQuery } from "../../../features/incidents/hooks/useIncidents";
import { usePermission } from "../../../hooks/usePermission";

interface AddNewUserDrawerProps {
  open: boolean;
  isEdit?: boolean;
  initialData?: Partial<UserFormData>;
  onClose: () => void;
  onSubmit: (data: UserFormData) => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  isLoadingUser?: boolean;
  disableGroupHome?: boolean;
  isAgentTab?: boolean;
  /** Whether this drawer is being used on users/agent tabs (not group-homes tab) */
  isUsersTab?: boolean;
  /** Whether the user has set their password — disables email field in edit mode */
  isPasswordSet?: boolean;
}

const AddNewUserDrawer: React.FC<AddNewUserDrawerProps> = ({
  open,
  isEdit = false,
  initialData,
  onClose,
  onSubmit,
  onSuccess,
  onError,
  isLoadingUser = false,
  disableGroupHome = false,
  isAgentTab = false,
  isUsersTab = false,
  isPasswordSet = false,
}) => {
  const formRef = useRef<AddNewUserFormRef>(null);
  const queryClient = useQueryClient();
  const submittedFormDataRef = useRef<UserFormData | null>(null);

  // Register user mutation
  const registerUserMutationHook = useMutation({
    ...registerUserMutation(),
    onSuccess: (data: unknown) => {
      const responseData = data as { message?: string } | undefined;
      const successMessage =
        responseData?.message || "User created successfully!";

      if (formRef.current) {
        formRef.current.resetForm();
      }

      queryClient.invalidateQueries({
        queryKey: [{ _id: "listUsers" }],
      });

      if (submittedFormDataRef.current) {
        onSubmit(submittedFormDataRef.current);
      }

      if (onSuccess) {
        onSuccess(successMessage);
      }
      onClose();

      submittedFormDataRef.current = null;
    },
    onError: (error: AxiosError<DefaultError>) => {
      const errorData = error.response?.data as any;
      const emailError =
        Array.isArray(errorData?.errors?.email) && errorData.errors.email.length > 0
          ? errorData.errors.email[0]
          : typeof errorData?.errors?.email === "string"
          ? errorData.errors.email
          : undefined;
      const errorMessage =
        emailError ||
        errorData?.message ||
        error.message ||
        "Failed to create user. Please try again.";

      if (emailError && formRef.current) {
        formRef.current.setFieldError("email", emailError);
      }

      if (onError) {
        onError(errorMessage);
      }

      submittedFormDataRef.current = null;
    },
  });

  // Update user mutation
  const updateUserMutationHook = useMutation({
    ...updateUserMutation(),
    onSuccess: (data: unknown) => {
      const responseData = data as { message?: string } | undefined;
      const successMessage =
        responseData?.message || "User updated successfully!";

      if (formRef.current) {
        formRef.current.resetForm();
      }

      queryClient.invalidateQueries({
        queryKey: [{ _id: "listUsers" }],
      });
      queryClient.invalidateQueries({
        queryKey: [{ _id: "getUserDetail" }],
      });

      if (submittedFormDataRef.current) {
        onSubmit(submittedFormDataRef.current);
      }

      if (onSuccess) {
        onSuccess(successMessage);
      }
      onClose();

      submittedFormDataRef.current = null;
    },
    onError: (error: AxiosError<DefaultError>) => {
      const errorData = error.response?.data as any;
      const emailError =
        Array.isArray(errorData?.errors?.email) && errorData.errors.email.length > 0
          ? errorData.errors.email[0]
          : typeof errorData?.errors?.email === "string"
          ? errorData.errors.email
          : undefined;
      const errorMessage =
        emailError ||
        errorData?.message ||
        error.message ||
        "Failed to update user. Please try again.";

      if (emailError && formRef.current) {
        formRef.current.setFieldError("email", emailError);
      }

      if (onError) {
        onError(errorMessage);
      }

      submittedFormDataRef.current = null;
    },
  });

  const [isResidentsDropdownOpen, setIsResidentsDropdownOpen] =
    React.useState(false);

  // Fetch full user details (for SSN, NPI, etc.) when editing
  const userUuid = isEdit ? initialData?.uuid : undefined;
  const { data: userDetailResponse } = useQuery({
    ...getUserDetailOptions({ path: { uuid: userUuid! } }),
    enabled: open && isEdit && !!userUuid,
  });

  // Merge SSN/NPI from user detail API into initialData
  const mergedInitialData = useMemo(() => {
    if (!initialData) return initialData;
    if (!userDetailResponse) return initialData;
    const userData = (userDetailResponse as any)?.data;
    if (!userData) return initialData;
    return {
      ...initialData,
      ssn: initialData.ssn || userData.ssn || '',
      npi: initialData.npi || userData.npi || '',
      groupHome: Array.isArray(userData.group_homes)
        ? userData.group_homes.map((gh: any) => gh.uuid)
        : initialData.groupHome,
    };
  }, [initialData, userDetailResponse]);

  // Fetch roles - filtered by ADMIN and STAFF types
  // Only fetch when drawer is open AND we're on users/agent tabs (not group-homes tab)
  // The drawer is only used for users/agent tabs, so this prevents unnecessary calls on group-homes tab
  const shouldFetchUserData = open && isUsersTab; // Only fetch when drawer is open and on users/agent tabs
  
  const { data: rolesResponse } = useQuery({
    ...listRolesOptions({
      query: {
        type: "ADMIN,STAFF",
      },
    }),
    enabled: shouldFetchUserData, // Only fetch when drawer is open and on users/agent tabs
  });

  // Fetch group homes
  // Only fetch when drawer is open AND we're on users/agent tabs (not group-homes tab)
  // The drawer is only used for users/agent tabs, so this prevents unnecessary calls on group-homes tab
  const { data: groupHomesResponse } = useQuery({
    ...listGroupHomesOptions({
      query: {
        page: 1,
        size: 1000,
      },
    }),
    enabled: shouldFetchUserData, // Only fetch when drawer is open and on users/agent tabs
  });

  // Fetch residents - only when dropdown is opened
  const { data: residentsData } = useResidentsQuery(
    undefined,
    "ACTIVE",
    isResidentsDropdownOpen
  );

  // Transform roles data
  const roles = useMemo(() => {
    if (!rolesResponse) return [];
    const responseData = rolesResponse as any;
    let rolesList: any[] = [];

    if (responseData?.data) {
      if (Array.isArray(responseData.data)) {
        rolesList = responseData.data;
      } else if (
        responseData.data.results &&
        Array.isArray(responseData.data.results)
      ) {
        rolesList = responseData.data.results;
      }
    }

    return rolesList.map((role: any) => ({
      value: role.name || role.role_name || "Unknown Role",
      label: role.name || role.role_name || "Unknown Role",
    }));
  }, [rolesResponse]);

  // Get raw group homes list for lookup
  const groupHomesList = useMemo(() => {
    if (!groupHomesResponse) return [];
    const responseData = groupHomesResponse as any;
    let homesList: any[] = [];

    if (responseData?.data) {
      if (Array.isArray(responseData.data)) {
        homesList = responseData.data;
      } else if (
        responseData.data.results &&
        Array.isArray(responseData.data.results)
      ) {
        homesList = responseData.data.results;
      } else if (
        responseData.data.content &&
        Array.isArray(responseData.data.content)
      ) {
        homesList = responseData.data.content;
      }
    }

    return homesList.filter((home: any) => home?.active === true);
  }, [groupHomesResponse]);

  // Transform group homes data for dropdown
  const groupHomes = useMemo(() => {
    return groupHomesList
      .filter((home: any) => home.active === true) // Only show active group homes
      .map((home: any) => ({
        value: home.uuid,
        label: home.name || "Unknown Group Home",
      }));
  }, [groupHomesList]);

  // Transform residents data
  const residents = useMemo(() => {
    if (!residentsData || !Array.isArray(residentsData)) return [];

    return residentsData
      .map((resident: any) => {
        const residentId = resident?.resident_id ?? resident?.id ?? null;
        const residentName = resident?.resident_name ?? "Unknown Resident";

        if (!residentId) return null;

        return {
          value: String(residentId),
          label: residentName,
        };
      })
      .filter((item): item is { value: string; label: string } => item !== null)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [residentsData]);

  // Allow role assignment for users with the users.role_assignment permission
  // (Admin, Program Director, BCBA, Program Manager — NOT Program Coordinator)
  const { hasPermission } = usePermission();
  const canChangeRole = hasPermission("users.role_assignment");

  const handleSubmit = async (data: UserFormData) => {
    const username = data.email.split("@")[0] || data.email;

    // -------------------------
    // CREATE USER
    // -------------------------
    if (!isEdit) {
      submittedFormDataRef.current = data;

      // group home id lookup
      const groupHomeValue = data.groupHome;
      const groupHomeUuid: any = Array.isArray(groupHomeValue)
        ? (groupHomeValue.length > 0 ? groupHomeValue.join(',') : null)
        : (groupHomeValue || null);

      const apiPayload: any = {
        username,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone ? parseInt(data.phone.replace(/\D/g, "")) : null,
        ssn: data.ssn || null,
        npi: data.npi || null,
        role_name: data.role,
        group_home_uuid: groupHomeUuid,
      };

      const avatarFile =
        (data as any).avatar_url instanceof File
          ? (data as any).avatar_url
          : data.profilePicture instanceof File
          ? data.profilePicture
          : null;

      const avatarUrl =
        typeof (data as any).avatar_url === "string"
          ? (data as any).avatar_url
          : null;

      if (avatarFile) {
        const formData = new FormData();
        formData.append("username", apiPayload.username);
        formData.append("first_name", apiPayload.first_name);
        formData.append("last_name", apiPayload.last_name);
        formData.append("email", apiPayload.email);

        if (apiPayload.phone !== null) formData.append("phone", String(apiPayload.phone));
        if (apiPayload.ssn !== undefined) formData.append("ssn", apiPayload.ssn || "");
        if (apiPayload.npi !== undefined) formData.append("npi", apiPayload.npi || "");
        formData.append("role_name", apiPayload.role_name);
        if (apiPayload.group_home_uuid !== undefined) {
          formData.append("group_home_uuid", apiPayload.group_home_uuid || "");
        }

        formData.append("avatar", avatarFile);

        registerUserMutationHook.mutate({
          body: formData as any,
        });
      } else {
        if (avatarUrl !== undefined) apiPayload.avatar_url = avatarUrl;
        registerUserMutationHook.mutate({
          body: apiPayload,
        });
      }

      return;
    }

    // -------------------------
    // UPDATE USER
    // -------------------------
    const uuid = initialData?.uuid;
    if (!uuid) {
      onError?.("Error: User ID not found for update.");
      return;
    }

    submittedFormDataRef.current = data;

    // When the group home field is disabled (editing from Group Home → Users tab),
    // always preserve the original group home from initialData.
    // Using data.groupHome would send null/empty (form was disabled) and unlink the user.
    const groupHomeValue = disableGroupHome
      ? (initialData?.groupHome || null)
      : (data.groupHome || null);
      
    const groupHomeUuid: any = Array.isArray(groupHomeValue)
      ? (groupHomeValue.length > 0 ? groupHomeValue.join(',') : null)
      : (groupHomeValue || null);

    const updatePayload: any = {
      username: initialData?.username || username,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone ? parseInt(data.phone.replace(/\D/g, "")) : null,
      ssn: data.ssn || null,
      npi: data.npi || null,
      active: initialData?.active !== undefined ? initialData.active : true,
      group_home_uuid: groupHomeUuid,
    };
    if (canChangeRole) {
      updatePayload.role_name = data.role;
    }

    const avatarFile =
      (data as any).avatar_url instanceof File
        ? (data as any).avatar_url
        : data.profilePicture instanceof File
        ? data.profilePicture
        : null;

    const avatarUrl = (data as any).avatar_url;

    if (avatarFile) {
      const formData = new FormData();
      formData.append("username", updatePayload.username);
      formData.append("first_name", updatePayload.first_name);
      formData.append("last_name", updatePayload.last_name);
      formData.append("email", updatePayload.email);

      if (updatePayload.phone !== null && updatePayload.phone !== undefined) {
        formData.append("phone", String(updatePayload.phone));
      }
      if (updatePayload.ssn !== undefined) {
        formData.append("ssn", updatePayload.ssn || "");
      }
      if (updatePayload.npi !== undefined) {
        formData.append("npi", updatePayload.npi || "");
      }
      if (updatePayload.active !== undefined) {
        formData.append("active", String(updatePayload.active));
      }

      if (canChangeRole && updatePayload.role_name !== undefined) {
        formData.append("role_name", updatePayload.role_name);
      }

      if (updatePayload.group_home_uuid !== undefined) {
        formData.append("group_home_uuid", updatePayload.group_home_uuid || "");
      }

      formData.append("avatar", avatarFile);

      updateUserMutationHook.mutate({
        path: { uuid },
        body: formData as any,
      });
    } else {
      if (avatarUrl !== undefined) updatePayload.avatar_url = avatarUrl;
      // Signal avatar deletion when avatar_url is explicitly null
      if (avatarUrl === null) {
        updatePayload.profile_picture_media_id = null;
      }

      updateUserMutationHook.mutate({
        path: { uuid },
        body: updatePayload,
      });
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <CustomDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      drawerWidth="700px"
      drawermargin="0"
      drawerPadding="0"
    >
      <AddNewUserForm
        ref={formRef}
        isEdit={isEdit}
        initialData={mergedInitialData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={
          isLoadingUser ||
          registerUserMutationHook.isPending ||
          updateUserMutationHook.isPending
        }
        roles={roles}
        groupHomes={groupHomes}
        residents={residents}
        disableGroupHome={disableGroupHome}
        isAgentTab={isAgentTab}
        isPasswordSet={isPasswordSet}
        onResidentsDropdownOpen={() => setIsResidentsDropdownOpen(true)}
      />
    </CustomDrawer>
  );
};

export default AddNewUserDrawer;
