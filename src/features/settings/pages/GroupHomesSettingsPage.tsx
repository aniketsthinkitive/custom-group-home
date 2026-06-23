import React, { useState, useMemo, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Typography,
  Tooltip,
} from "@mui/material";
import { useAppSelector } from "../../../store/hooks";
import { usePermission } from "../../../hooks/usePermission";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AddIcon from "@mui/icons-material/Add";
import CustomButton from "../../../components/custom-buttons/custom-buttons";
import CustomSelect from "../../../components/custom-select/custom-select";
import GroupHomesTable, { GroupHome as TableGroupHome } from "../components/GroupHomesTable";
const AddGroupHomeDrawer = React.lazy(() => import("../components/AddGroupHomeDrawer").then(module => ({ default: module.default })));
const RolesPermissionsTab = React.lazy(() => import("../components/RolesPermissionsTab"));
import type { FormState as AddGroupHomeFormState } from "../components/AddGroupHomeDrawer";
import { createGroupHomeMutation, deleteGroupHomeMutation, groupHomesUpdateMutation, listGroupHomesOptions, listGroupHomesQueryKey, retrieveGroupHomeOptions, retrieveGroupHomeQueryKey } from "../../../sdk/@tanstack/react-query.gen";
import { useMediaUpload } from "../../../hooks/useMediaUpload";
import type { GroupHome as ApiGroupHome, GroupHome } from "../../../sdk/types.gen";
import { Grid } from "@mui/material";
import UsersTableWithPagination from "../components/UsersTableWithPagination";
import AgentsTableWithPagination from "../components/AgentsTableWithPagination";
import AddNewUserDrawer from "../components/AddNewUserDrawer";
import type { UserFormData } from "../components/AddNewUserForm";
import type { UserData } from "../components/UsersTable";
import type { FileItem } from "../../../components/custom-fileupload/custom-fileupload";
import CommonSnackbar from "../../../components/common-snackbar/common-snackbar";
import { formatPhone } from "../../../utils";
import Paginator from '../../../components/pagination/pagination';
import {
  transformApiGroupHomeToFormState,
  transformFormDataToPayload,
  withImageMediaId,
} from "../utils/groupHomeFormUtils";

const GroupHomesSettingsPage: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role?.type === "ADMIN" || user?.role?.name === "Admin";
  const canViewRolesPermissions =
    isAdmin || user?.role?.name === "Program Director" || user?.role?.name === "Program Manager";
  const isBCBA = user?.role?.name === "BCBA";
  const isNurse = user?.role?.name === "Nurse";
  const isDSP = user?.role?.name === "DSP";
  const { hasPermission } = usePermission();

  const canCreateGroupHome = hasPermission("group_homes.create");
  const canCreateUser = hasPermission("users.create");
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "group-homes";
  const setActiveTab = useCallback((tab: string) => {
    setSearchParams({ tab }, { replace: true });
  }, [setSearchParams]);
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editUserData, setEditUserData] = useState<UserData | null>(null);
  const [isEditGroupHome, setIsEditGroupHome] = useState(false);
  const [, setSelectedGroupHome] = useState<TableGroupHome | null>(null);
  const [editingGroupHomeUuid, setEditingGroupHomeUuid] = useState<string | null>(null);
  const [agentRoleFilter, setAgentRoleFilter] = useState<string>("");
  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
    status: 'success' | 'error';
  }>({
    isOpen: false,
    message: '',
    status: 'success',
  });
  /** True while image/certificate files are being uploaded to S3 (before create/update API completes). Disables Save button. */
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const queryClient = useQueryClient();
  const formDataRef = useRef<AddGroupHomeFormState | null>(null);

  const { upload: uploadMedia, isUploading: isMediaUploading } = useMediaUpload({
    contentTypeApp: "group_home",
    contentTypeModel: "grouphome",
  });

  // Fetch full group home data when editing
  const { data: editingGroupHomeData, isLoading: isLoadingGroupHome } = useQuery({
    ...retrieveGroupHomeOptions({
      path: {
        uuid: editingGroupHomeUuid || "",
      },
    }),
    enabled: !!editingGroupHomeUuid && isEditGroupHome,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  /** Upload group home profile image; returns media uuid so backend can mark it as avatar (alt_text) in media. */
  const uploadGroupHomeImageWithObjectId = async (file: File, objectId: number): Promise<string | null> => {
    const result = await uploadMedia(file, {
      objectUuid: objectId,
      altText: "group_home_profile",
    });
    return result.id || null;
  };

  /**
   * Upload certificate files with object_id (group home id).
   * Uses Promise.all for parallel uploads.
   */
  const uploadCertificateFilesWithObjectId = async (
    fileItems: FileItem[],
    objectId: string | number,
  ): Promise<string[]> => {
    const filesToUpload = fileItems.filter((item) => item?.file);
    if (filesToUpload.length === 0) return [];

    const results = await Promise.all(
      filesToUpload.map((item) =>
        uploadMedia(item.file!, { objectUuid: objectId })
      )
    );

    return results.map((r) => r.id).filter(Boolean);
  };

  // Format address string helper - memoized
  const formatAddress = useCallback((address: ApiGroupHome['address']): string => {
    if (!address) return "";
    const addressParts = [];
    if (address.line1) addressParts.push(address.line1);
    if (address.line2) addressParts.push(address.line2);
    if (address.city) addressParts.push(address.city);
    if (address.state) addressParts.push(address.state);
    if (address.zipcode) addressParts.push(address.zipcode);
    if (address.country) addressParts.push(address.country);
    return addressParts.join(", ");
  }, []);

  // Fetch group homes from API with optimized select
  const { data: groupHomesResponse, isLoading, isError } = useQuery({
    ...listGroupHomesOptions({
      query: {
        page: page + 1, // API uses 1-based pagination
        size: pageSize,
      },
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    select: (data: any) => {
      // Extract data from API response and preserve pagination info
      let apiHomes: ApiGroupHome[] = [];
      let pagination: any = null;
      
      if (data?.data?.results && Array.isArray(data.data.results)) {
        apiHomes = data.data.results;
        pagination = data.data.pagination;
      } else if (Array.isArray(data)) {
        apiHomes = data;
      } else if (data?.data && Array.isArray(data.data)) {
        apiHomes = data.data;
      }
      
      // Pre-compute address strings for performance
      const formattedHomes = apiHomes.map((home: ApiGroupHome) => {
        const addressParts = [];
        if (home.address?.line1) addressParts.push(home.address.line1);
        if (home.address?.line2) addressParts.push(home.address.line2);
        if (home.address?.city) addressParts.push(home.address.city);
        if (home.address?.state) addressParts.push(home.address.state);
        if (home.address?.zipcode) addressParts.push(home.address.zipcode);
        if (home.address?.country) addressParts.push(home.address.country);
        
        return {
          ...home,
          _formattedAddress: addressParts.join(", ") || "",
        };
      });
      
      // Return both formatted homes and pagination info
      return {
        homes: formattedHomes,
        pagination,
      };
    },
  });


  // Extract data from API response - now uses pre-formatted data from select
  const extractedGroupHomesData = useMemo((): ApiGroupHome[] => {
    if (!groupHomesResponse) return [];
    return groupHomesResponse.homes || [];
  }, [groupHomesResponse]);

  // Get pagination info from response
  const paginationInfo = useMemo(() => {
    if (!groupHomesResponse) {
      return { totalPages: 1, totalRecords: 0 };
    }
    
    // Use pagination info from select if available
    if (groupHomesResponse.pagination) {
      return {
        totalPages: groupHomesResponse.pagination.total_pages || 1,
        totalRecords: groupHomesResponse.pagination.total_records || 0,
      };
    }
    
    // Fallback: calculate from data length
    const homes = extractedGroupHomesData;
    return {
      totalPages: Math.ceil(homes.length / pageSize) || 1,
      totalRecords: homes.length,
    };
  }, [groupHomesResponse, extractedGroupHomesData, pageSize]);

  // Transform API GroupHome to table GroupHome format - optimized with pre-formatted address
  const groupHomes: TableGroupHome[] = useMemo(() => {
    return extractedGroupHomesData.map((home: any) => {
      // Use pre-formatted address if available, otherwise format on the fly
      const addressString = home._formattedAddress || formatAddress(home.address);

      // Backend returns avatar_url from GroupHomeSerializer (profile image from media)
      const avatarUrl = home.avatar_url ?? undefined;

      return {
        id: home.uuid!,
        uuid: home.uuid!,
        name: home.name || "",
        email: home.email || "",
        contactNumber: home.phone || "",
        address: addressString,
        avatarUrl,
        active: home.active ?? true, // Map active field from API response
      };
    });
  }, [extractedGroupHomesData, formatAddress]);

  // Helper function to extract backend message from response
  const getBackendMessage = (response: unknown): string | undefined => {
    const data = response as { message?: string; data?: { message?: string } } | undefined;
    return data?.message ?? data?.data?.message ?? undefined;
  };

  /** Extract user-facing error from upload/API errors (e.g. axios response.data.error). */
  const getUploadErrorMessage = (err: unknown): string => {
    const ax = err as { response?: { data?: { error?: string; message?: string }; status?: number }; message?: string };
    const msg = ax?.response?.data?.error ?? ax?.response?.data?.message ?? ax?.message;
    if (typeof msg === "string" && msg.length > 0) return msg;
    return "Upload failed. Please try again.";
  };

  // Setup mutation
  const createGroupHome = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(createGroupHomeMutation() as any),
    onSuccess: async (data: unknown) => {
      // Handle both wrapped { data: {...} } and unwrapped GroupHome responses
      const created = (data as any)?.data ?? data as { id?: number; uuid?: string } | undefined;
      const formData = formDataRef.current;
      formDataRef.current = null;

      // Use pre-uploaded imageMediaId from drawer (S3 presigned URL flow) if available
      const preUploadedImageMediaId = formData?.imageMediaId || null;
      const hasImageToUpload = !preUploadedImageMediaId && created?.id != null && formData?.groupHomeImageFiles?.length;
      // Certificates: drawer now uploads via presigned URL and passes media IDs in certificateMediaIds
      const certFilesToUpload = formData?.certificateFiles?.filter((f: FileItem) => f?.file) ?? [];
      const hasCertsToUpload = certFilesToUpload.length > 0 && created?.id != null;
      const hasPreUploadedCerts = (formData?.certificateMediaIds?.length ?? 0) > 0;

      if (hasImageToUpload || hasCertsToUpload) {
        setIsUploadingMedia(true);
      }

      try {
        let imageMediaId: string | null = preUploadedImageMediaId;
        if (hasImageToUpload) {
          const fileItem = formData!.groupHomeImageFiles![0] as FileItem;
          if (fileItem?.file) {
            try {
              imageMediaId = await uploadGroupHomeImageWithObjectId(fileItem.file, created!.id!);
            } catch (err) {
              console.error("Group home image upload failed:", err);
              setIsUploadingMedia(false);
              setSnackbar({
                isOpen: true,
                message: `Group home created but image upload failed: ${getUploadErrorMessage(err)}`,
                status: "error",
              });
            }
          }
        }

        // Upload certificates in parallel (fallback — only if drawer didn't already upload them)
        const newMediaIds = hasCertsToUpload
          ? await uploadCertificateFilesWithObjectId(
              certFilesToUpload,
              created!.id!,
            ).catch((err) => {
              console.error("Certificate upload failed:", err);
              setSnackbar({
                isOpen: true,
                message: "Group home created but certificate upload failed.",
                status: "error",
              });
              return [] as string[];
            })
          : [];

        // Combine pre-uploaded certificate media IDs with any newly uploaded ones
        const allCertMediaIds = [
          ...(formData!.certificateMediaIds ?? []),
          ...newMediaIds,
        ];

        // If we have image and/or certs, PATCH so backend sets avatar (alt_text) and cert_media_ids
        if (
          (created as any)?.uuid &&
          (imageMediaId != null || allCertMediaIds.length > 0)
        ) {
          const payload = withImageMediaId(
            transformFormDataToPayload({
              ...formData!,
              certificateMediaIds: allCertMediaIds,
            }),
            imageMediaId,
          );
          updateGroupHome.mutate({
            path: { uuid: (created as any).uuid },
            body: payload,
          } as any);
          // isUploadingMedia cleared in updateGroupHome.onSettled
          // Query invalidation happens in updateGroupHome.onSuccess
          return;
        }

        const backendMessage = getBackendMessage(data);
        // Invalidate queries - React Query will automatically refetch active queries
        queryClient.invalidateQueries({ queryKey: listGroupHomesQueryKey() });

        setIsUploadingMedia(false);
        setIsDrawerOpen(false);
        setPage(0);

        if (backendMessage) {
          setSnackbar({
            isOpen: true,
            message: backendMessage,
            status: "success",
          });
        }
      } catch (_e) {
        setIsUploadingMedia(false);
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      // Reset uploading state on error
      setIsUploadingMedia(false);
      
      // Extract error message from backend response - check all possible error fields
      const errorData = error?.response?.data as { 
        message?: string; 
        detail?: string; 
        error?: string;
        details?: string;
        non_field_errors?: string[];
        [key: string]: any; // For field-specific errors
      } | undefined;
      
      let errorMessage = '';
      
      // Check for DRF validation errors (field-specific or non-field)
      if (errorData) {
        // Check for non-field errors first
        if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors) && errorData.non_field_errors.length > 0) {
          errorMessage = errorData.non_field_errors[0];
        }
        // Check for standard error fields
        else if (errorData.message) {
          errorMessage = errorData.message;
        }
        else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
        else if (errorData.details) {
          errorMessage = errorData.details;
        }
        else if (errorData.error) {
          errorMessage = errorData.error;
        }
        // Check for field-specific errors (DRF format: { "field": ["error1", "error2"] })
        else {
          const fieldErrorEntries = Object.entries(errorData)
            .filter(([_, value]) => Array.isArray(value) && value.length > 0)
            .map(([_, errors]) => Array.isArray(errors) ? errors[0] : String(errors));
          
          if (fieldErrorEntries.length > 0) {
            // If there's only one field error, show just the message without field name
            // If multiple field errors, join them with commas
            errorMessage = fieldErrorEntries.join(', ');
          }
        }
      }
      
      // Fallback to error message or default
      if (!errorMessage) {
        errorMessage = error?.message || 'Failed to create group home. Please try again.';
      }
      
      // Show error in snackbar
      setSnackbar({
        isOpen: true,
        message: errorMessage,
        status: 'error',
      });
      
      // Log error for debugging
      console.error('Error creating group home:', error);
      console.error('Error data:', errorData);
    },
  });

  const updateGroupHome = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(groupHomesUpdateMutation() as any),
    onSuccess: async (data: unknown, variables: any) => {
      const backendMessage = getBackendMessage(data);
      formDataRef.current = null;
      const updatedUuid = variables?.path?.uuid || editingGroupHomeUuid;
      
      // Invalidate queries - React Query will automatically refetch active queries
      // Only invalidate the specific paginated query we're using, not all queries with that base key
      queryClient.invalidateQueries({ 
        queryKey: listGroupHomesQueryKey({
          query: {
            page: page + 1,
            size: pageSize,
          },
        })
      });
      
      // Also invalidate the specific group home detail query if we have the UUID
      if (updatedUuid) {
        queryClient.invalidateQueries({ 
          queryKey: retrieveGroupHomeQueryKey({ path: { uuid: updatedUuid } }) 
        });
      }
      
      setIsDrawerOpen(false);
      setIsEditGroupHome(false);
      setSelectedGroupHome(null);
      setEditingGroupHomeUuid(null);
      setPage(0);

      // Show success message if available
      if (backendMessage) {
        setSnackbar({
          isOpen: true,
          message: backendMessage,
          status: 'success',
        });
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      // Extract error message from backend response - check all possible error fields
      const errorData = error?.response?.data as { 
        message?: string; 
        detail?: string; 
        error?: string;
        details?: string;
        non_field_errors?: string[];
        [key: string]: any; // For field-specific errors
      } | undefined;
      
      let errorMessage = '';
      
      // Check for DRF validation errors (field-specific or non-field)
      if (errorData) {
        // Check for non-field errors first
        if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors) && errorData.non_field_errors.length > 0) {
          errorMessage = errorData.non_field_errors[0];
        }
        // Check for standard error fields
        else if (errorData.message) {
          errorMessage = errorData.message;
        }
        else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
        else if (errorData.details) {
          errorMessage = errorData.details;
        }
        else if (errorData.error) {
          errorMessage = errorData.error;
        }
        // Check for field-specific errors (DRF format: { "field": ["error1", "error2"] })
        else {
          const fieldErrorEntries = Object.entries(errorData)
            .filter(([_, value]) => Array.isArray(value) && value.length > 0)
            .map(([_, errors]) => Array.isArray(errors) ? errors[0] : String(errors));
          
          if (fieldErrorEntries.length > 0) {
            // If there's only one field error, show just the message without field name
            // If multiple field errors, join them with commas
            errorMessage = fieldErrorEntries.join(', ');
          }
        }
      }
      
      // Fallback to error message or default
      if (!errorMessage) {
        errorMessage = error?.message || 'Failed to update group home. Please try again.';
      }
      
      // Show error in snackbar
      setSnackbar({
        isOpen: true,
        message: errorMessage,
        status: 'error',
      });
      
      // Log error for debugging
      console.error('Error updating group home:', error);
      console.error('Error data:', errorData);
    },
    onSettled: () => {
      // Keep Save button disabled until update (and any media upload) is fully complete
      setIsUploadingMedia(false);
    },
  });


  const deleteGroupHome = useMutation({
    ...deleteGroupHomeMutation(),
    onSuccess: () => {
      // Invalidate queries - React Query will automatically refetch active queries
      // Only invalidate the specific paginated query we're using
      queryClient.invalidateQueries({ 
        queryKey: listGroupHomesQueryKey({
          query: {
            page: page + 1,
            size: pageSize,
          },
        })
      });
    },
    onError: (error) => {
      console.error("Error deleting group home:", error);
      
    },
  });

  const handleToggleChange = useCallback((
    _event: React.MouseEvent<HTMLElement>,
    newValue: string | null
  ) => {
    if (newValue !== null) {
      setActiveTab(newValue);
    }
  }, []);

  const handleAddGroupHome = useCallback(() => {
    setIsEditGroupHome(false);
    setSelectedGroupHome(null);
    setIsDrawerOpen(true);
  }, []);

  const handleEditGroupHome = useCallback((row: TableGroupHome) => {
    setIsEditGroupHome(true);
    setSelectedGroupHome(row);
    setEditingGroupHomeUuid(row.uuid);
    setIsDrawerOpen(true);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature required by GroupHomesTable onDeactivate prop
  const handleDeactivateGroupHome = useCallback((_row: TableGroupHome) => {
    queryClient.invalidateQueries({
      predicate: (q) =>
        (q.queryKey[0] as { _id?: string })?._id === "listGroupHomes",
    });
  }, [queryClient]);

  const handleDeleteGroupHome = useCallback((row: TableGroupHome) => {
    if (!row?.uuid) return;
    deleteGroupHome.mutate({ path: { uuid: row.uuid } });
  }, [deleteGroupHome]);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setIsEditGroupHome(false);
    setSelectedGroupHome(null);
    setEditingGroupHomeUuid(null);
  }, []);

  // Users page handlers
  const handleAddNewUser = useCallback(() => {
    setIsEditMode(false);
    setEditUserData(null);
    setIsUserDrawerOpen(true);
  }, []);

  const handleEditUser = useCallback((user: UserData) => {
    setIsEditMode(true);
    setEditUserData(user);
    setIsUserDrawerOpen(true);
  }, []);

  const handleCloseUserDrawer = useCallback(() => {
    setIsUserDrawerOpen(false);
    setIsEditMode(false);
    setEditUserData(null);
  }, []);

  const handleSubmitUser = useCallback((data: UserFormData) => {
    // Handle user submission if needed
    // console.log("User submitted:", data);
  }, []);

  const handleUserSuccess = useCallback((message: string) => {
    setSnackbar({
      isOpen: true,
      message,
      status: 'success',
    });
  }, []);

  const handleUserError = useCallback((message: string) => {
    setSnackbar({
      isOpen: true,
      message,
      status: 'error',
    });
  }, []);

  const handleSnackbarClose = useCallback(() => {
    setSnackbar(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPage(0);
  }, []);

  const handlePageChange = useCallback((_e: unknown, p: number) => {
    setPage(p);
  }, []);

  const handleRecordsPerPageChange = useCallback((size: number) => {
    setPageSize(size);
    setPage(0);
  }, []);

  // Transform UserData to UserFormData format
  const transformUserDataToFormData = (user: UserData): Partial<UserFormData> => {
    // Extract group home UUID from object or use existing string value
    // Note: Must match the dropdown format which uses home.uuid
    let groupHomeValue = '';
    if ((user as any).group_home) {
      const groupHome = (user as any).group_home;
      if (typeof groupHome === 'object' && groupHome !== null) {
        groupHomeValue = groupHome.uuid || '';
      } else if (typeof groupHome === 'string') {
        groupHomeValue = groupHome;
      }
    } else if (user.groupHome && typeof user.groupHome === 'string' && user.groupHome !== '-') {
      groupHomeValue = user.groupHome;
    }

    return {
      uuid: user.uuid,
      username: user.username,
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      email: user.email || '',
      phone: user.phone ? formatPhone(user.phone) : '',
      role: user.role?.name || '',
      groupHome: groupHomeValue,
      active: user.active,
      avatar_url: user?.avatar_url || '',
      isPasswordSet: !!user.isPasswordSet,
    };
  };

  const handleSaveGroupHome = async (formData: AddGroupHomeFormState) => {
    // Validate required fields (already validated in drawer, but double-check)
    if (
      !formData.groupHomeName.trim() ||
      !formData.timeZone ||
      !formData.contactNumber.trim() ||
      !formData.faxNumber.trim() ||
      !formData.addressLine1.trim()
    ) {
      return;
    }

    formDataRef.current = formData;

    // Edit mode: upload new profile image and/or certificates first, then update (avatar via image_media_id in media)
    if (isEditGroupHome && editingGroupHomeUuid && editingGroupHomeData) {
      const apiData = (editingGroupHomeData as any)?.data || editingGroupHomeData;
      const groupHomeId = (apiData as GroupHome).id;
      // Use pre-uploaded imageMediaId from drawer (S3 presigned URL flow) if available
      // null = image was removed, undefined = no change, string = new image uploaded
      const preUploadedImageMediaId: string | null | undefined = formData.imageMediaId;
      const newImageFile = !preUploadedImageMediaId ? formData.groupHomeImageFiles?.[0]?.file : undefined;
      const newCertFiles = formData.certificateFiles?.filter((f) => f?.file) ?? [];
      const hasUploads = (newImageFile && groupHomeId != null) || (newCertFiles.length > 0 && groupHomeId != null);

      if (hasUploads) {
        setIsUploadingMedia(true);
      }

      try {
        let imageMediaId: string | null | undefined = preUploadedImageMediaId;
        if (newImageFile && groupHomeId != null) {
          try {
            imageMediaId = await uploadGroupHomeImageWithObjectId(newImageFile, groupHomeId);
          } catch (err) {
            console.error("Group home image upload failed:", err);
            setIsUploadingMedia(false);
            setSnackbar({
              isOpen: true,
              message: `Profile image upload failed: ${getUploadErrorMessage(err)}`,
              status: "error",
            });
            return;
          }
        }
        let allMediaIds = formData.certificateMediaIds || [];
        if (newCertFiles.length > 0 && groupHomeId != null) {
          try {
            const newMediaIds = await uploadCertificateFilesWithObjectId(newCertFiles, groupHomeId);
            allMediaIds = [...allMediaIds, ...newMediaIds];
          } catch (err) {
            console.error("Certificate upload failed:", err);
            setIsUploadingMedia(false);
            setSnackbar({
              isOpen: true,
              message: "Certificate upload failed. Please try again.",
              status: "error",
            });
            return;
          }
        }
        const payload = withImageMediaId(
          transformFormDataToPayload({ ...formData, certificateMediaIds: allMediaIds }),
          imageMediaId
        );
        updateGroupHome.mutate(
          {
            path: { uuid: editingGroupHomeUuid },
            body: payload,
          } as any
          // onSettled on mutation clears isUploadingMedia
        );
      } catch (_e) {
        setIsUploadingMedia(false);
      }
      return;
    }

    // Check if this is a second Save after files were uploaded (for add mode)
    // const previousFormData = formDataRef.current as any;
    // const createdUuid = previousFormData?.createdUuid;
    // const uploadedImageMediaId = previousFormData?.uploadedImageMediaId;
    
    // if (createdUuid && !isEditGroupHome) {
    //   // This is a second Save after group home was created and files were uploaded
    //   // Update the group home with the uploaded files
    //   const payload = withImageMediaId(
    //     transformFormDataToPayload({
    //       ...formData,
    //       certificateMediaIds: previousFormData.certificateMediaIds || formData.certificateMediaIds || [],
    //     }),
    //     uploadedImageMediaId
    //   );
    //   updateGroupHome.mutate({
    //     path: { uuid: createdUuid },
    //     body: payload,
    //   } as any);
    //   // Clear the stored data
    //   formDataRef.current = null;
    //   return;
    // }

    const payload = transformFormDataToPayload(formData);

    if (isEditGroupHome && editingGroupHomeUuid) {
      updateGroupHome.mutate({
        path: { uuid: editingGroupHomeUuid },
        body: payload,
      } as any);
    } else {
      createGroupHome.mutate({
        body: payload,
      } as any);
    }
  };

  return (
    <Grid
      container
      sx={{
        height: "calc(100vh - 64px)",
        backgroundColor: "#F6F6F6",
        padding: { xs: "12px", sm: "20px", md: "18px" },
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        width: "100%",
      }}
    >
      <Grid
        size={{ xs: 12 }}
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 0,
        }}
      >
        {/* White card - same as Leads table page */}
        <Paper
          component="div"
          elevation={0}
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            borderRadius: "10px",
            boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.12)",
            backgroundColor: "#FFFFFF",
            padding: { xs: "12px", sm: "16px" },
            paddingBottom: 0,
            overflow: "hidden",
            flex: 1,
            minHeight: 0,
          }}
        >
        {/* Toggle + Button row */}
        <Grid
          container
          size={12}
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            gap: { xs: 0.5, sm: 1 },
            flexWrap: "nowrap",
          }}
        >
          {/* Tabs — scrollable when they overflow on small screens */}
          <Grid
            size="grow"
            sx={{
              minWidth: 0,
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            <ToggleButtonGroup
              value={activeTab}
              exclusive
              onChange={handleToggleChange}
              sx={{
                height: "32px",
                backgroundColor: "#FAFAFA",
                border: "1px solid #E9EBEE",
                borderRadius: "6px",
                padding: "2px",
                flexShrink: 0,
                "& .MuiToggleButton-root": {
                  border: "none",
                  borderRadius: "4px",
                  textTransform: "none",
                  fontSize: { xs: "12px", sm: "13.5px" },
                  fontWeight: 600,
                  color: "#30353A",
                  fontFamily: '"Helvetica Neue", Arial, sans-serif',
                  lineHeight: "1.2",
                  padding: { xs: "4px 10px", sm: "4px 14px" },
                  minHeight: "28px",
                  whiteSpace: "nowrap",
                },
                "& .Mui-selected": {
                  backgroundColor: "#FFFFFF !important",
                  color: "#256ACC !important",
                },
              }}
            >
              <ToggleButton value="group-homes">All Group Homes</ToggleButton>
              {!isBCBA && !isNurse && !isDSP && (
                <ToggleButton value="users">All Users</ToggleButton>
              )}
              {!isBCBA && !isNurse && !isDSP && (
                <ToggleButton value="agent">Area Agency &amp; Guardian</ToggleButton>
              )}
              {canViewRolesPermissions && (
                <ToggleButton value="roles-permissions">
                  Roles &amp; Permissions
                </ToggleButton>
              )}
            </ToggleButtonGroup>
          </Grid>

          {/* Action area — always pinned to the right, never pushed off screen */}
          <Grid size="auto" sx={{ flexShrink: 0 }}>
            {activeTab === "group-homes" ? (
              <Tooltip
                title={canCreateGroupHome ? "" : "You don't have permission to add group homes"}
                arrow
              >
                <span>
                  <CustomButton
                    variant="primary"
                    size="lg"
                    icon={<AddIcon />}
                    iconPosition="left"
                    onClick={handleAddGroupHome}
                    disabled={!canCreateGroupHome}
                    >
                      Add New Group Home
                  </CustomButton>
                </span>
              </Tooltip>
            ) : activeTab === "users" ? (
              <Tooltip
                title={canCreateUser ? "" : "You don't have permission to add users"}
                arrow
              >
                <span>
                  <CustomButton
                    variant="primary"
                    size="lg"
                    icon={<AddIcon />}
                    iconPosition="left"
                    onClick={handleAddNewUser}
                    disabled={!canCreateUser}
                    >
                      Add New User
                  </CustomButton>
                </span>
              </Tooltip>
            ) : activeTab === "agent" ? (
              <Grid
                container
                role="group"
                aria-labelledby="agent-role-filter-label"
                sx={{
                  alignItems: "center",
                  gap: { xs: 0.5, sm: 1.5 },
                  flexWrap: "nowrap",
                }}
              >
                <Grid size="auto">
                  <Typography
                    id="agent-role-filter-label"
                    component="span"
                    sx={{
                      fontSize: { xs: "12px", sm: "14px" },
                      fontWeight: 500,
                      color: "#374151",
                      whiteSpace: "nowrap",
                      display: { xs: "none", sm: "inline" },
                    }}
                  >
                    Filter By Role :
                  </Typography>
                </Grid>
                <Grid
                  size="auto"
                  sx={{
                    width: { xs: 90, sm: 140 },
                    "& .MuiSelect-select": { py: 0.75, fontSize: { xs: "12px", sm: "14px" } },
                    "& .MuiOutlinedInput-root": { borderRadius: "6px" },
                  }}
                >
                  <CustomSelect
                    name="agent-role-filter"
                    placeholder="All"
                    value={agentRoleFilter}
                    onChange={(e) => setAgentRoleFilter(e.target.value)}
                    items={[
                      { value: "", label: "All Roles" },
                      { value: "AGENT", label: "Area Agency" },
                      { value: "GUARDIAN", label: "Guardian" },
                    ]}
                    bgWhite
                    height={36}
                  />
                </Grid>
              </Grid>
            ) : activeTab === "roles-permissions" ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }} />
            ) : null}
          </Grid>
        </Grid>

        {/* Content - changes based on active tab */}
        <Grid size={12} sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          {activeTab === "group-homes" ? (
            <Grid
              container
              size={12}
              sx={{ flexDirection: "column", flex: 1, minHeight: 0 }}
            >
              {isError ? (
                <Grid
                  size={12}
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <Typography color="error">Error loading group homes</Typography>
                </Grid>
              ) : (
                <>
                  {/* Table area */}
                  <Grid
                    size={12}
                    sx={{
                      flex: 1,
                      minHeight: 0,
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <GroupHomesTable
                      data={groupHomes}
                      loading={isLoading}
                      page={page}
                      pageSize={pageSize}
                      onPageChange={handlePageChange}
                      onPageSizeChange={handlePageSizeChange}
                      onEdit={handleEditGroupHome}
                      onDeactivate={handleDeactivateGroupHome}
                      onDelete={handleDeleteGroupHome}
                    />
                  </Grid>
                  {/* Pagination row */}
                  {paginationInfo.totalRecords > 0 && (
                    <Grid
                      size={12}
                      sx={{ flexShrink: 0, backgroundColor: "#FFFFFF" }}
                    >
                      <Paginator
                        page={page}
                        totalPages={paginationInfo.totalPages}
                        totalRecord={paginationInfo.totalRecords}
                        onPageChange={handlePageChange}
                        onRecordsPerPageChange={handleRecordsPerPageChange}
                        defaultSize={pageSize}
                      />
                    </Grid>
                  )}
                </>
              )}
            </Grid>
          ) : activeTab === "users" ? (
            <UsersTableWithPagination onEdit={handleEditUser} />
          ) : activeTab === "agent" ? (
            <AgentsTableWithPagination onEdit={handleEditUser} roleFilter={agentRoleFilter} />
          ) : activeTab === "roles-permissions" && canViewRolesPermissions ? (
            <Suspense
              fallback={
                <Grid size={12} sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <Typography>Loading...</Typography>
                </Grid>
              }
            >
              <RolesPermissionsTab />
            </Suspense>
          ) : null}
        </Grid>
        </Paper>
      </Grid>

      {/* Add Group Home Drawer */}
      {isDrawerOpen && (
        <Suspense fallback={null}>
          <AddGroupHomeDrawer
            open={isDrawerOpen}
            formname={
              isEditGroupHome ? "Edit Group Home" : "Add New Group Home"
            }
            onClose={handleCloseDrawer}
            onSave={handleSaveGroupHome}
            isLoading={
              createGroupHome.isPending ||
              updateGroupHome.isPending ||
              isLoadingGroupHome ||
              isUploadingMedia
            }
            initialData={
              isEditGroupHome && editingGroupHomeData
                ? transformApiGroupHomeToFormState(
                    (editingGroupHomeData as any)?.data || editingGroupHomeData,
                  )
                : undefined
            }
            initialImageUrl={
              isEditGroupHome && editingGroupHomeData
                ? (() => {
                    const apiData =
                      (editingGroupHomeData as any)?.data ||
                      editingGroupHomeData;
                    const withAvatar = apiData as GroupHome & {
                      avatar_url?: string | null;
                    };
                    return withAvatar.avatar_url ?? null;
                  })()
                : null
            }
            initialMedia={
              isEditGroupHome && editingGroupHomeData
                ? (() => {
                    const apiData =
                      (editingGroupHomeData as any)?.data ||
                      editingGroupHomeData;
                    const mediaList =
                      (
                        apiData as {
                          media?: Array<{
                            id?: string;
                            original_filename?: string;
                          }>;
                        }
                      ).media ?? [];
                    return mediaList
                      .map((m) => ({
                        id: m.id ?? "",
                        name: m.original_filename,
                        original_filename: m.original_filename,
                      }))
                      .filter((m) => m.id);
                  })()
                : undefined
            }
            onSuccess={() => {
              // Drawer will be closed by mutation onSuccess
              // Success message is already shown in mutation onSuccess
            }}
            onError={(message) => {
              setSnackbar({
                isOpen: true,
                message,
                status: "error",
              });
            }}
          />
        </Suspense>
      )}

      {/* Add/Edit User Drawer */}
      <AddNewUserDrawer
        open={isUserDrawerOpen}
        isEdit={isEditMode}
        initialData={
          editUserData ? transformUserDataToFormData(editUserData) : undefined
        }
        onClose={handleCloseUserDrawer}
        onSubmit={handleSubmitUser}
        onSuccess={handleUserSuccess}
        onError={handleUserError}
        isAgentTab={activeTab === "agent"}
        isUsersTab={activeTab === "users" || activeTab === "agent"}
        isPasswordSet={!!editUserData?.isPasswordSet}
      />

      {/* Snackbar for user operations */}
      <CommonSnackbar
        isOpen={snackbar.isOpen}
        message={snackbar.message}
        status={snackbar.status}
        onClose={handleSnackbarClose}
        autoClose={true}
        autoCloseDelay={5000}
      />
    </Grid>
  );
};

export default GroupHomesSettingsPage;
