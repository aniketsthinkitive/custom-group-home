import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Grid,
  IconButton,
  Avatar,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Radio,
  FormControlLabel,
  Typography,
  Box,
} from "@mui/material";
import { Close, DeleteOutline } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type DefaultError,
} from "@tanstack/react-query";
import type { AxiosError } from "axios";
import CustomDrawer from "../../../components/custom-drawer/custom-drawer";
import CustomInput from "../../../components/custom-input/custom-input";
import CustomButton from "../../../components/custom-buttons/custom-buttons";
import CustomSelect from "../../../components/custom-select/custom-select";
import CustomLabel from "../../../components/custom-label/custom-label";
import { type SignatureCanvasRef } from "../../../components/signature-canvas";
import { SignatureCanvas } from "../../../components/signature-canvas";
import type { UserFormData } from "../../settings/components/AddNewUserForm";
import {
  listRolesOptions,
  updateUserMutation,
  getUserDetailQueryKey,
  listUsersQueryKey,
  listGroupHomesOptions,
} from "../../../sdk/@tanstack/react-query.gen";
import { useMediaUpload, dataUrlToFile } from "../../../hooks/useMediaUpload";
import CommonSnackbar from "../../../components/common-snackbar/common-snackbar";
import { useAppDispatch } from "../../../store/hooks";
import { useAuth } from "../../../hooks/useAuth";
import { refreshAuthUser } from "../../../store/slices/authSlice";
import { usePermission } from "../../../hooks/usePermission";

/**
 * Extract backend message only (for custom snackbar)
 * Returns ONLY backend-provided message, no frontend-invented text
 */
function getBackendMessage(error: unknown): string | undefined {
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
}

// Form validation schema
const editUserFormSchema = yup.object({
  firstName: yup
    .string()
    .trim()

    .required("First name is required")
    // .test(
    //   "no-leading-trailing-spaces",
    //   "First name cannot start or end with whitespace",
    //   function (value) {
    //     if (!value) return true;
    //     return value === value.trim();
    //   }
    // )
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must not exceed 50 characters"),

  lastName: yup
    .string()
    .required("Last name is required")
    .trim()
    // .test(
    //   "no-leading-trailing-spaces",
    //   "Last name cannot start or end with whitespace",
    //   function (value) {
    //     if (!value) return true;
    //     return value === value.trim();
    //   }
    // )
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must not exceed 50 characters"),

  email: yup
    .string()
    .required("Email is required")
    .test(
      "email-format",
      "Please enter a valid email address",
      function (value) {
        if (!value || value.trim() === "") return false; // Required field
        // Check for both @ and . characters
        return value.includes("@") && value.includes(".");
      },
    )
    // .test(
    //   "no-leading-trailing-spaces",
    //   "Email cannot start or end with whitespace",
    //   function (value) {
    //     if (!value) return true;
    //     return value === value.trim();
    //   }
    // ),
      .trim(),

  phone: yup
    .string()
    .required("Phone number is required")
    .test("phone-validation", "Phone number must be 10 digits", function (value) {
      if (!value || value.trim() === "") return false; // Required field
      // Remove all non-digit characters and check length
      const cleaned = value.replace(/\D/g, "");
      return cleaned.length === 10;
    }),

  ssn: yup
    .string()
    .nullable()
    .test("ssn-validation", function (value) {
      if (!value || value.trim() === "") return true;
      const cleaned = value.replace(/\D/g, "");
      if (!/^\d+$/.test(cleaned)) {
        return this.createError({
          message: "SSN can only contain numbers",
        });
      }
      if (cleaned.length !== 9) {
        return this.createError({
          message: "Please enter a valid 9-digit SSN",
        });
      }
      return true;
    }),

  npi: yup
    .string()
    .nullable()
    .test("npi-validation", function (value) {
      if (!value || value.trim() === "") return true;
      const cleaned = value.replace(/\D/g, "");
      if (!/^\d+$/.test(cleaned)) {
        return this.createError({
          message: "NPI can only contain numbers",
        });
      }
      if (cleaned.length !== 10) {
        return this.createError({
          message: "Please enter a valid 10-digit NPI number",
        });
      }
      return true;
    }),

  role: yup.string().required("Role is required"),

  // ✅ support single string or array of strings
  groupHome: yup.mixed().nullable(),
});

interface User {
  uuid?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string | number;
  ssn?: string;
  npi?: string;
  role?: {
    type?: string;
    name?: string;
    uuid?: string;
    id?: string | number;
  };
  role_type?: string;

  // backend may return group_home object/string AND group_home_id on write response
  group_home_id?: string | number | null;
  group_home?: string | {
    uuid?: string;
    id?: string | number;
    name?: string;
  };
  group_homes?: Array<{
    uuid?: string;
    id?: string | number;
    name?: string;
  }>;

  profile_picture?: string;
  active?: boolean;
  /** Signature image URL from API when user has a stored signature (S3) */
  signature_url?: string | null;
  /** Alt text from the signature Media record — used to detect upload vs draw method */
  signature_alt_text?: string | null;
  /** Whether the user has set their password */
  isPasswordSet?: boolean;
}

interface EditUserDrawerProps {
  open: boolean;
  onClose: () => void;
  initialData?: Partial<UserFormData>;
  user?: User | null;
  userUuid?: string;
  onSave: () => void;
  showSignature: boolean;
}

const EditUserDrawer: React.FC<EditUserDrawerProps> = ({
  open,
  onClose,
  initialData,
  user,
  userUuid,
  onSave,
  showSignature,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const queryClient = useQueryClient();

  // Hide SSN and NPI fields if the user's role is Agent or Guardian
  const userRoleName = (user?.role?.name ?? "").toLowerCase();
  const isAgentOrGuardian = ["agent", "guardian"].includes(userRoleName);

  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const signatureRef = useRef<SignatureCanvasRef>(null);
  const signatureFileInputRef = useRef<HTMLInputElement>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(true);
  const [signatureCanvasKey, setSignatureCanvasKey] = useState(0);
  const [signatureMethod, setSignatureMethod] = useState<"DRAW" | "UPLOAD">(
    "DRAW"
  );
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState<string | null>(
    null
  );
  const [signatureMediaId, setSignatureMediaId] = useState<string | null>(null);
  const [signatureMediaUrl, setSignatureMediaUrl] = useState<string | null>(null);
  /** True when drawer was opened with an existing signature from API (so we can show/clear it). */
  const [hadExistingSignatureFromApi, setHadExistingSignatureFromApi] = useState(false);
  /** True when user clicked Clear on signature — submit should send signature_media_id: null. */
  const [clearSignatureOnSave, setClearSignatureOnSave] = useState(false);
  /** True from first click on Save until uploads + PUT finish (keeps button disabled). */
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatureFileError, setSignatureFileError] = useState<string | null>(null);

  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
    status: "success" | "error";
  }>({
    isOpen: false,
    message: "",
    status: "success",
  });

  // Auth / permission helpers — declared here so queries below can reference canChangeRole
  const dispatch = useAppDispatch();
  const { user: currentAuthUser } = useAuth();
  const currentUserRole = currentAuthUser?.role?.name?.toLowerCase();
  const allowedRoles = ["admin", "program director", "program manager"];
  const canManageUserFields = allowedRoles.includes(currentUserRole || "");
  const { hasPermission } = usePermission();
  const isOwnProfile = currentAuthUser?.uuid === userUuid;
  const canChangeRole = canManageUserFields && !isOwnProfile;

  // Fetch roles only when the user can actually change it.
  // DSP / own-profile users get canChangeRole=false and lack permission for this API (403).
  // The roles useMemo already seeds user.role.name so the disabled dropdown still shows correctly.
  const rolesTypeFilter = isAgentOrGuardian ? "ADMIN,STAFF,AGENT,GUARDIAN" : "ADMIN,STAFF";
  const { data: rolesResponse } = useQuery({
    ...listRolesOptions({
      query: {
        type: rolesTypeFilter,
      },
    }),
    enabled: open && canChangeRole,
    staleTime: 10 * 60 * 1000,
  });

  // Fetch group homes only when the user can actually change it.
  // DSP lacks permission for this API; the disabled dropdown is seeded from user data instead.
  const { data: groupHomesResponse } = useQuery({
    ...listGroupHomesOptions({
      query: { page: 1, size: 1000 },
    }),
    enabled: open && canChangeRole,
    staleTime: 10 * 60 * 1000,
  });

  // ✅ Transform roles: value is ALWAYS role.name (unique)
  const roles = useMemo(() => {
    const responseData = rolesResponse as any;
    let rolesList: any[] = [];

    if (responseData?.data) {
      if (Array.isArray(responseData.data)) rolesList = responseData.data;
      else if (Array.isArray(responseData.data.results))
        rolesList = responseData.data.results;
    }

    const rolesMap = new Map<string, { value: string; label: string }>();

    rolesList.forEach((role: any) => {
      const value = role.name || role.role_name || "";
      const rawLabel = role.name || role.role_name || "Unknown Role";
      const label = rawLabel === "Agent" ? "Area Agency" : rawLabel;
      if (value) rolesMap.set(value, { value, label });
    });

    if (user?.role?.name) {
      const userRoleName = user.role.name;
      if (!rolesMap.has(userRoleName)) {
        const rawLabel = userRoleName;
        const label = rawLabel === "Agent" ? "Area Agency" : rawLabel;
        rolesMap.set(userRoleName, { value: userRoleName, label });
      }
    }

    return Array.from(rolesMap.values());
  }, [rolesResponse, user]);

  /**
  * ✅ Transform GroupHomes mapping:
  * - The Select `value` is the UUID string.
  * - We keep lookup maps to prefill when backend gives uuid/name.
  */
  const groupHomesMeta = useMemo(() => {
    const responseData = groupHomesResponse as any;
    let homesList: any[] = [];

    if (responseData?.data) {
      if (Array.isArray(responseData.data)) homesList = responseData.data;
      else if (Array.isArray(responseData.data.results))
        homesList = responseData.data.results;
      else if (Array.isArray(responseData.data.content))
        homesList = responseData.data.content;
    }

    const itemsMap = new Map<string, { value: string; label: string }>();
    const idByUuid = new Map<string, string>();
    const idByName = new Map<string, string>();

    homesList.forEach((home: any) => {
      const uuidStr = home?.uuid != null ? String(home.uuid) : "";
      const nameStr = home?.name != null ? String(home.name) : "";

      if (uuidStr) {
        itemsMap.set(uuidStr, {
          value: uuidStr,
          label: nameStr || "Unknown Group Home",
        });

        if (uuidStr) idByUuid.set(uuidStr, uuidStr);
        if (nameStr) idByName.set(nameStr, uuidStr);
      }
    });

    // Seed user's current group_home object so disabled select still shows the label
    if (user?.group_home && typeof user.group_home === "object") {
      const uuidStr =
        user.group_home.uuid != null ? String(user.group_home.uuid) : "";
      const label = user.group_home.name || "Unknown Group Home";
      if (uuidStr && !itemsMap.has(uuidStr)) {
        itemsMap.set(uuidStr, { value: uuidStr, label });
        idByUuid.set(uuidStr, uuidStr);
        if (label) idByName.set(label, uuidStr);
      }
    }

    // Seed user's group_homes array so disabled select shows labels even without API fetch
    if (user?.group_homes && Array.isArray(user.group_homes)) {
      user.group_homes.forEach((gh: any) => {
        const uuidStr = gh?.uuid != null ? String(gh.uuid) : "";
        const nameStr = gh?.name != null ? String(gh.name) : "";
        if (uuidStr && !itemsMap.has(uuidStr)) {
          itemsMap.set(uuidStr, { value: uuidStr, label: nameStr || "Unknown Group Home" });
          idByUuid.set(uuidStr, uuidStr);
          if (nameStr) idByName.set(nameStr, uuidStr);
        }
      });
    }

    return {
      items: Array.from(itemsMap.values()),
      idByUuid,
      idByName,
    };
  }, [groupHomesResponse, user]);

  const groupHomes = groupHomesMeta.items;

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<UserFormData>({
    resolver: yupResolver(editUserFormSchema) as any,
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      ssn: "",
      npi: "",
      role: "",
      groupHome: [],
    },
    mode: "onChange",
  });

  const selectedRoleValue = watch("role");
  const selectedRoleLabel = groupHomesMeta && roles.find((r) => r.value === selectedRoleValue)?.label?.toLowerCase() || '';
  const isMultiGroupHomeRole = selectedRoleLabel === 'program coordinator' || selectedRoleLabel === 'program manager';

  // Watch required fields to determine if save button should be enabled
  const watchedFields = watch(["firstName", "lastName", "email", "phone", "role"]);
  const isFormValid =
    isValid &&
    watchedFields[0]?.trim() &&
    watchedFields[1]?.trim() &&
    watchedFields[2]?.trim() &&
    watchedFields[3]?.trim() &&
    watchedFields[4]?.trim();


  // Update user mutation
  const updateUserMutationHook = useMutation({
    ...updateUserMutation(),
    onSuccess: (data: unknown) => {
      const responseData = data as {
        message?: string;
        data?: { message?: string; signature_url?: string | null } & Record<string, unknown>;
        detail?: string;
      };

      const backendMessage =
        responseData?.message ??
        responseData?.data?.message ??
        responseData?.detail ??
        undefined;

      const updatedUser = responseData?.data && typeof responseData.data === "object" ? responseData.data : null;
      if (updatedUser && "signature_url" in updatedUser) {
        const url = (updatedUser.signature_url as string | null) ?? null;
        setSignaturePreviewUrl(url);
        setHadExistingSignatureFromApi(!!url);
      }

      if (userUuid) {
        queryClient.invalidateQueries({
          queryKey: getUserDetailQueryKey({ path: { uuid: userUuid } }),
        });
        queryClient.refetchQueries({
          queryKey: getUserDetailQueryKey({ path: { uuid: userUuid } }),
        });
        if (currentAuthUser?.uuid && userUuid === currentAuthUser.uuid) {
          dispatch(refreshAuthUser());
        }
      }
      queryClient.invalidateQueries({ queryKey: listUsersQueryKey() });

      if (backendMessage) {
        setSnackbar({
          isOpen: true,
          message: backendMessage,
          status: "success",
        });
      }

      onClose();
      onSave();
    },
    onError: (error: AxiosError<DefaultError>) => {
      const backendMessage = getBackendMessage(error);
      if (backendMessage) {
        setSnackbar({
          isOpen: true,
          message: backendMessage,
          status: "error",
        });
      }
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Prefill form when drawer opens
  useEffect(() => {
    if (open && user) {
      const existingSignatureUrl =
        (user as User & { signature_url?: string | null }).signature_url ??
        (initialData as Record<string, unknown>)?.signature;

      if (existingSignatureUrl && typeof existingSignatureUrl === "string") {
        const sigAltText =
          (user as User & { signature_alt_text?: string | null }).signature_alt_text ?? null;
        const savedMethod: "DRAW" | "UPLOAD" =
          sigAltText === "signature_upload" ? "UPLOAD" : "DRAW";
        setSignatureMethod(savedMethod);
        setSignaturePreviewUrl(existingSignatureUrl);
        setHadExistingSignatureFromApi(true);
        setClearSignatureOnSave(false);
        setSignatureFile(null);
        setHasDrawnSignature(false);
      } else {
        setHadExistingSignatureFromApi(false);
        setClearSignatureOnSave(false);
        setSignatureFile(null);
        setHasDrawnSignature(false);
        setSignatureMethod("DRAW");
        if (signaturePreviewUrl && signaturePreviewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(signaturePreviewUrl);
        }
        setSignaturePreviewUrl(null);
        setSignatureCanvasKey((prev) => prev + 1);
        setTimeout(() => {
          signatureRef.current?.clearCanvas?.();
        }, 100);
        if (signatureFileInputRef.current) {
          signatureFileInputRef.current.value = "";
        }
      }

      // Prefill all fields from initialData (unchanged)
      if (initialData) {
        Object.keys(initialData).forEach((key) => {
          const value = initialData[key as keyof UserFormData];
          if (value !== undefined && key !== "profilePicture") {
            setValue(key as keyof UserFormData, value, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }
        });
      }

      // role: name string (unique identifier)
      const roleName = user?.role?.name ?? "";
      if (roleName) {
        setValue("role", roleName, { shouldDirty: false, shouldValidate: true });
      }

      /**
       * ✅ Prefill group home:
       * - Multi-home roles (Program Coordinator / Program Manager): store as string[]
       * - All other roles (DSP, Admin, etc.): store as a single string UUID
       */
      const prefillRoleName = (user?.role?.name ?? "").toLowerCase();
      const isMultiAtPrefill =
        prefillRoleName === "program coordinator" ||
        prefillRoleName === "program manager";

      let groupHomeValue: string | string[] = isMultiAtPrefill ? [] : "";

      if (user.group_homes && Array.isArray(user.group_homes) && user.group_homes.length > 0) {
        const uuids = user.group_homes
          .map((gh: any) => gh.uuid || String(gh.id || gh.value || ""))
          .filter(Boolean);
        // For single-select roles, use only the first UUID as a plain string
        groupHomeValue = isMultiAtPrefill ? uuids : (uuids[0] ?? "");
      } else if (user.group_home) {
        if (typeof user.group_home === "object") {
          if (user.group_home.uuid != null) {
            const uuid = String(user.group_home.uuid);
            groupHomeValue = isMultiAtPrefill ? [uuid] : uuid;
          }
        } else if (typeof user.group_home === "string") {
          // could be uuid OR name — look up via groupHomesMeta maps
          const maybeUuid = user.group_home;
          const resolved =
            groupHomesMeta.idByUuid.get(maybeUuid) ||
            groupHomesMeta.idByName.get(maybeUuid) ||
            "";
          groupHomeValue = isMultiAtPrefill ? (resolved ? [resolved] : []) : resolved;
        }
      }

      const hasValue = Array.isArray(groupHomeValue)
        ? groupHomeValue.length > 0
        : groupHomeValue !== "";

      if (hasValue) {
        setValue("groupHome", groupHomeValue, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      // Profile pic: prefer initialData.profilePicture, fallback to user.avatar_url / user.profile_picture
      const avatarUrl =
        (initialData?.profilePicture && typeof initialData.profilePicture === "string")
          ? initialData.profilePicture
          : (user as User & { avatar_url?: string; profile_picture?: string })?.avatar_url
          || (user as User & { avatar_url?: string; profile_picture?: string })?.profile_picture;
      if (avatarUrl && typeof avatarUrl === "string") {
        setProfilePreview(avatarUrl);
      } else {
        setProfilePreview(null);
      }
      // Reset the explicit removal flag each time the drawer opens fresh
      setProfilePictureExplicitlyRemoved(false);
    } else if (!open) {
      reset({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        ssn: "",
        npi: "",
        role: "",
        groupHome: "",
      });
      setProfilePicture(null);
      setProfilePreview(null);
      setProfilePictureExplicitlyRemoved(false);
      setSignatureFile(null);
      setHasDrawnSignature(false);
      setSignatureMethod("DRAW");
      setHadExistingSignatureFromApi(false);
      setClearSignatureOnSave(false);
      if (signaturePreviewUrl && signaturePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(signaturePreviewUrl);
      }
      setSignaturePreviewUrl(null);

      if (fileInputRef.current) fileInputRef.current.value = "";
      if (signatureFileInputRef.current) signatureFileInputRef.current.value = "";
      signatureRef.current?.clearCanvas?.();
    }
    // Intentionally omit signaturePreviewUrl: prefill only when drawer opens or user/initialData changes.
    // If we included signaturePreviewUrl, clicking Clear would set it to null, then this effect would re-run and restore the API signature.
  }, [
    open,
    user,
    initialData,
    setValue,
    reset,
    groupHomesMeta,
  ]);
  const { upload: uploadMedia } = useMediaUpload({
    contentTypeApp: "accounts",
    contentTypeModel: "user",
  });

  const uploadSignature = async (): Promise<{ id: string; url?: string } | null> => {
    let file: File | null = null;
    if (signatureMethod === "UPLOAD" && signatureFile) {
      file = signatureFile;
    } else if (signatureMethod === "DRAW") {
      const dataUrl = signatureRef.current?.getSignatureData?.();
      if (dataUrl) {
        file = dataUrlToFile(dataUrl, "signature.png");
      }
    }
    if (!file) return null;

    const altText = signatureMethod === "UPLOAD" ? "signature_upload" : "signature_draw";
    const result = await uploadMedia(file, { altText });
    setSignatureMediaId(result.id);
    if (result.fileUrl) setSignatureMediaUrl(result.fileUrl);
    return { id: result.id, url: result.fileUrl };
  };

  /** Upload profile picture via presigned URL. Returns media id or null. */
  const uploadProfilePicture = async (): Promise<{ id: string } | null> => {
    if (!profilePicture) return null;
    const result = await uploadMedia(profilePicture);
    return { id: result.id };
  };

  // Track whether the profile picture was explicitly removed by the user (not just absent on open)
  const [profilePictureExplicitlyRemoved, setProfilePictureExplicitlyRemoved] = useState(false);

  const handleFormSubmit = async (data: UserFormData) => {
    if (!userUuid) return;

    setIsSubmitting(true);

    const username =
      initialData?.username || data.email.split("@")[0] || data.email;

    const currentRole = watch("role") || data.role || initialData?.role || "";

    // ✅ groupHome is stored as UUID string or array in the form
    const groupHomeUuid = Array.isArray(data.groupHome) 
      ? (data.groupHome.length > 0 ? data.groupHome.join(",") : null) 
      : (data.groupHome && String(data.groupHome).trim() ? String(data.groupHome).trim() : null);

    const updatePayload: any = {
      username: username,
      first_name: data.firstName.trim(),
      last_name: data.lastName.trim(),
      email: data.email.trim(),
      phone: data.phone ? parseInt(data.phone.replace(/\D/g, "")) : null,
      active: initialData?.active !== undefined ? initialData.active : true,
    };

    // Only include group_home_uuid in payload if the field is visible (not hidden for agent/guardian).
    // Sending group_home_uuid for agent/guardian would wipe their group home assignment.
    if (!isAgentOrGuardian) {
      updatePayload.group_home_uuid = groupHomeUuid;
    }

    // Only Admin/Program Director/Program Manager can change role; others must not send role_name
    if (canChangeRole) {
      if (currentRole && currentRole.trim()) {
        updatePayload.role_name = currentRole.trim();
      } else {
        const userRoleName = user?.role?.name || "";
        if (userRoleName && userRoleName.trim()) {
          updatePayload.role_name = userRoleName.trim();
        }
      }
    }

    if (data.ssn && data.ssn.trim()) {
      updatePayload.ssn = data.ssn.replace(/\D/g, "");
    }
    if (data.npi && data.npi.trim()) {
      updatePayload.npi = data.npi.replace(/\D/g, "");
    }

    const needsSignature =
      (signatureMethod === "UPLOAD" && !!signatureFile) ||
      (signatureMethod === "DRAW" && !!signatureRef.current?.getSignatureData?.());
    const needsProfile = !!profilePicture;

    if (needsSignature && needsProfile) {
      try {
        const [sigRes, profileRes] = await Promise.all([
          uploadSignature(),
          uploadProfilePicture(),
        ]);
        if (sigRes?.id) {
          updatePayload.signature_media_id = sigRes.id;
        } else if (signatureMediaId) {
          updatePayload.signature_media_id = signatureMediaId;
        }
        if (profileRes?.id) {
          updatePayload.profile_picture_media_id = profileRes.id;
        }
      } catch (e) {
        const msg =
          getBackendMessage(e) || (e as any)?.message || "Upload failed";
        setSnackbar({ isOpen: true, message: msg, status: "error" });
        setIsSubmitting(false);
        return;
      }
    } else if (needsSignature) {
      try {
        const res = await uploadSignature();
        if (res?.id) {
          updatePayload.signature_media_id = res.id;
        } else if (signatureMediaId) {
          updatePayload.signature_media_id = signatureMediaId;
        }
      } catch (e) {
        const msg =
          getBackendMessage(e) || (e as any)?.message || "Signature upload failed";
        setSnackbar({ isOpen: true, message: msg, status: "error" });
        setIsSubmitting(false);
        return;
      }
    } else if (needsProfile) {
      try {
        const profileRes = await uploadProfilePicture();
        if (profileRes?.id) {
          updatePayload.profile_picture_media_id = profileRes.id;
        }
      } catch (e) {
        const msg =
          getBackendMessage(e) || (e as any)?.message || "Profile picture upload failed";
        setSnackbar({ isOpen: true, message: msg, status: "error" });
        setIsSubmitting(false);
        return;
      }
    } else if (clearSignatureOnSave && !needsSignature) {
      // User clicked Clear on signature — tell backend to remove it
      updatePayload.signature_media_id = null;
    }

    // Only clear avatar when user explicitly removed it (clicked the delete icon).
    // Do NOT send null just because no new picture was uploaded — that would delete
    // an existing profile picture on every save even if the user didn't touch it.
    if (profilePictureExplicitlyRemoved && !needsProfile) {
      updatePayload.avatar_url = null;
      updatePayload.profile_picture_media_id = null;
    }

    updateUserMutationHook.mutate({
      path: { uuid: userUuid },
      body: updatePayload,
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, isOpen: false }));
  };

  const handleCancel = () => {
    reset({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      ssn: "",
      npi: "",
      role: "",
      groupHome: "",
    });
    setProfilePicture(null);
    setProfilePreview(null);
    setProfilePictureExplicitlyRemoved(false);
    setSignatureFile(null);
    setHasDrawnSignature(false);
    setSignatureMethod("DRAW");
    setHadExistingSignatureFromApi(false);
    setClearSignatureOnSave(false);
    if (signaturePreviewUrl && signaturePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(signaturePreviewUrl);
    }
    setSignaturePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (signatureFileInputRef.current) signatureFileInputRef.current.value = "";
    signatureRef.current?.clearCanvas?.();
    onClose();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setSnackbar({
        isOpen: true,
        message: "Unsupported file format. Please upload JPG, JPEG, or PNG images.",
        status: "error",
      });
      if (event.target) {
        event.target.value = "";
      }
      return;
    }

    if (file) {
      setProfilePicture(file);
      setProfilePictureExplicitlyRemoved(false); // user is uploading a new photo, not removing
      const reader = new FileReader();
      reader.onloadend = () => setProfilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveProfilePic = (e: React.MouseEvent) => {
    e.stopPropagation();
    setProfilePicture(null);
    setProfilePreview(null);
    setProfilePictureExplicitlyRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Signature handlers
  const handleMethodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value as "DRAW" | "UPLOAD";
    setSignatureFileError(null);
    setSignatureMethod(value);
    setHadExistingSignatureFromApi(false);
    if (value === "DRAW") {
      setSignatureFile(null);
      if (signaturePreviewUrl && signaturePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(signaturePreviewUrl);
      }
      setSignaturePreviewUrl(null);
      setSignatureCanvasKey((prev) => prev + 1);
      if (signatureFileInputRef.current) {
        signatureFileInputRef.current.value = "";
      }
    } else if (value === "UPLOAD") {
      signatureRef.current?.clearCanvas?.();
      setHasDrawnSignature(false);
      if (signaturePreviewUrl && signaturePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(signaturePreviewUrl);
      }
      setSignaturePreviewUrl(null);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        setSignatureFileError("Unsupported file format. Please upload a JPG, JPEG, or PNG image.");
        if (event.target) event.target.value = "";
        return;
      }
      setSignatureFileError(null);
      setClearSignatureOnSave(false);
      if (signaturePreviewUrl && signaturePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(signaturePreviewUrl);
      }
      setSignatureFile(file);
      const objectUrl = URL.createObjectURL(file);
      setSignaturePreviewUrl(objectUrl);
    }
  };

  const handleClearSignature = () => {
    setSignatureFileError(null);
    if (signatureMethod === "DRAW") {
      signatureRef.current?.clearCanvas?.();
      setHasDrawnSignature(false);
      setHadExistingSignatureFromApi(false);
      setClearSignatureOnSave(true);
      if (signaturePreviewUrl && signaturePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(signaturePreviewUrl);
      }
      setSignaturePreviewUrl(null);
      setSignatureCanvasKey((prev) => prev + 1);
    } else if (signatureMethod === "UPLOAD") {
      setHadExistingSignatureFromApi(false);
      setClearSignatureOnSave(true);
      if (signaturePreviewUrl && signaturePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(signaturePreviewUrl);
      }
      setSignatureFile(null);
      setSignaturePreviewUrl(null);
      if (signatureFileInputRef.current) {
        signatureFileInputRef.current.value = "";
      }
    }
  };

  // NOTE: SignatureCanvas calls onSignatureChange(true) when drawing (has content)
  // and onSignatureChange(false) when cleared. The parameter represents "hasContent",
  // NOT "isEmpty". We interpret it accordingly.
  const handleSignatureChange = useCallback((hasContent: boolean) => {
    setHasDrawnSignature(hasContent);
    if (hasContent) setClearSignatureOnSave(false);
  }, []);

  // Update preview when signature changes
  useEffect(() => {
    if (hasDrawnSignature && signatureMethod === "DRAW" && signatureRef.current) {
      const signatureDataValue = signatureRef.current.getSignatureData();
      if (signatureDataValue) setSignaturePreviewUrl(signatureDataValue);
    } else if (!hasDrawnSignature && signatureMethod === "DRAW") {
      setSignaturePreviewUrl(null);
    }
  }, [hasDrawnSignature, signatureMethod]);

  return (
    <CustomDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      drawerWidth="700px"
      drawermargin="0"
      drawerPadding="0"
    >
      <Grid
        container
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          backgroundColor: "#FFFFFF",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Grid
          size={{ xs: 12 }}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            borderBottom: "1px solid #E3ECEF",
            flexShrink: 0,
            marginTop: "-10px",
          }}
        >
          <Typography
            sx={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#424342",
              fontFamily: "Geist",
            }}
          >
            Edit User
          </Typography>
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

        {/* Scrollable Content */}
        <Grid
          component="form"
          size={{ xs: 12 }}
          sx={{
            flex: 1,
            overflow: "auto",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
          }}
          onSubmit={handleSubmit(handleFormSubmit)}
        >
          <Grid
            size={{ xs: 12 }}
            sx={{
              border: "1px solid #E7E9EB",      // ✅ container border like figma
              borderRadius: "12px",             // ✅ rounded corners
              backgroundColor: "#FFFFFF",
              padding: { xs: "16px", md: "20px" }, // ✅ inner padding
              boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.06)", // ✅ subtle shadow
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            {/* Profile Picture Upload */}
            <Grid
              size={{ xs: 12 }}
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                alignItems: "flex-start",
              }}
            >
              <CustomLabel label=" Profile Pic" />
              <Grid
                sx={{
                  position: "relative",
                  display: "inline-block",
                  cursor: "pointer",
                }}
                onClick={handleAvatarClick}
              >
                {profilePreview ? (
                  <>
                    <Avatar
                      src={profilePreview}
                      sx={{
                        width: 120,
                        height: 120,
                        borderRadius: "50%",
                        border: "none",
                      }}
                    />
                    <IconButton
                      size="small"
                      aria-label="Remove photo"
                      onClick={handleRemoveProfilePic}
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        backgroundColor: "#fff",
                        boxShadow: 1,
                        "&:hover": { backgroundColor: "#f5f5f5" },
                      }}
                    >
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </>
                ) : (
                  <Grid
                    sx={{
                      width: 100,
                      height: 100,
                      borderRadius: "50%",
                      backgroundColor: "#f6f8fb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "none",
                    }}
                  >
                    <Grid
                      component="img"
                      src="data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 15V3M12 3L8 7M12 3L16 7M4 13H20C20.5523 13 21 13.4477 21 14V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V14C3 13.4477 3.44772 13 4 13Z' stroke='%238A8F98' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"
                      alt="Upload"
                      sx={{ width: "24px", height: "24px", opacity: 0.6 }}
                    />
                  </Grid>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </Grid>
            </Grid>

            {/* First Name and Last Name Row */}
            <Grid
              size={{ xs: 12 }}
              sx={{ display: "flex", gap: "10px" }}
              flexDirection={{ xs: "column", sm: "column", md: "row", lg: "row" }}
            >
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <Grid
                    size={{ xs: 12 }}
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <CustomLabel label="First Name" isRequired />
                    <CustomInput
                      placeholder="Enter First Name"
                      name="firstName"
                      value={field.value}
                      onChange={field.onChange}
                      hasError={!!errors.firstName}
                      errorMessage={errors.firstName?.message}
                    />
                  </Grid>
                )}
              />
              <Controller
                name="lastName"
                control={control}
                render={({ field }) => (
                  <Grid
                    size={{ xs: 12 }}
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <CustomLabel label="Last Name" isRequired />
                    <CustomInput
                      placeholder="Enter Last Name"
                      name="lastName"
                      value={field.value}
                      onChange={field.onChange}
                      hasError={!!errors.lastName}
                      errorMessage={errors.lastName?.message}
                    />
                  </Grid>
                )}
              />
            </Grid>

            {/* Email and Phone Row */}
            <Grid
              size={{ xs: 12 }}
              sx={{ display: "flex", gap: "10px" }}
              flexDirection={{ xs: "column", sm: "column", md: "row", lg: "row" }}
            >
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Grid
                    size={{ xs: 12 }}
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <CustomLabel label="Email" isRequired />
                    <CustomInput
                      placeholder="Enter"
                      name="email"
                      value={field.value}
                      onChange={field.onChange}
                      hasError={!!errors.email}
                      errorMessage={errors.email?.message}
                      disableField={!!user?.isPasswordSet}
                    />
                  </Grid>
                )}
              />
              <Grid
                size={{ xs: 12 }}
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <CustomLabel label="Phone" isRequired />
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <CustomInput
                      placeholder="Enter"
                      name="phone"
                      value={field.value}
                      onChange={field.onChange}
                      hasError={!!errors.phone}
                      errorMessage={errors.phone?.message}
                      phone={true}
                    />
                  )}
                />
              </Grid>
            </Grid>

            {/* SSN and NPI Row - hidden for Agent/Guardian roles */}
            {!isAgentOrGuardian && (
              <Grid
                size={{ xs: 12 }}
                sx={{ display: "flex", gap: "10px" }}
                flexDirection={{ xs: "column", sm: "column", md: "row", lg: "row" }}
              >
                <Controller
                  name="ssn"
                  control={control}
                  render={({ field }) => (
                    <Grid
                      size={{ xs: 12 }}
                      sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <CustomLabel label="Social Security No." />
                      <CustomInput
                        placeholder="Enter"
                        name="ssn"
                        value={field.value}
                        onChange={field.onChange}
                        hasError={!!errors.ssn}
                        errorMessage={errors.ssn?.message}
                        ssn={true}
                        maxLength={11}
                      />
                    </Grid>
                  )}
                />
                <Controller
                  name="npi"
                  control={control}
                  render={({ field }) => (
                    <Grid
                      size={{ xs: 12 }}
                      sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <CustomLabel label="NPI" />
                      <CustomInput
                        placeholder="Enter"
                        name="npi"
                        value={field.value}
                        onChange={field.onChange}
                        hasError={!!errors.npi}
                        errorMessage={errors.npi?.message}
                        isNumeric
                        maxLength={10}
                      />
                    </Grid>
                  )}
                />
              </Grid>
            )}

            {/* Role and Group Home Row */}
            <Grid
              size={{ xs: 12 }}
              sx={{ display: "flex", gap: "10px" }}
              flexDirection={{ xs: "column", sm: "column", md: "row", lg: "row" }}
            >
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Grid
                    size={{ xs: 12 }}
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <CustomLabel label="Role" isRequired />
                    <CustomSelect
                      placeholder="Select Role"
                      name="role"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      items={roles}
                      hasError={!!errors.role}
                      errorMessage={errors.role?.message}
                      isDisabled={!canChangeRole || isAgentOrGuardian}
                    />
                  </Grid>
                )}
              />

              {!isAgentOrGuardian && (
                <Controller
                  name="groupHome"
                  control={control}
                  render={({ field }) => (
                    <Grid
                      size={{ xs: 12 }}
                      sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <CustomLabel label="Group Home" />
                      <CustomSelect
                        placeholder={isMultiGroupHomeRole ? "Select Group Homes" : "Select Group Home"}
                        name="groupHome"
                        multiple={isMultiGroupHomeRole}
                        value={field.value || (isMultiGroupHomeRole ? [] : "")}
                        onChange={(e) => field.onChange(e.target.value)}
                        items={groupHomes}
                        hasError={!!errors.groupHome}
                        errorMessage={errors.groupHome?.message as string}
                        isDisabled={!canChangeRole}
                      />
                    </Grid>
                  )}
                />
              )}
            </Grid>

            {/* Signature Section */}
            {showSignature && (
              <Grid size={{ xs: 12 }} sx={{ marginTop: "24px" }}>
                <CustomLabel label="Signature of Person Preparing Report (Sign below)" />
                <Box sx={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <Typography
                      sx={{
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "#757775",
                        fontFamily: '"Helvetica Neue", Arial, sans-serif',
                        lineHeight: 1.6,
                      }}
                    >
                      Select Signature Method
                    </Typography>
                    <Box sx={{ display: "flex", gap: "16px" }}>
                      <FormControlLabel
                        control={
                          <Radio
                            name="signatureMethod"
                            checked={signatureMethod === "DRAW"}
                            onChange={handleMethodChange}
                            value="DRAW"
                            sx={{
                              color: "#A9ACA9",
                              "&.Mui-checked": { color: "#0A2E45" },
                            }}
                          />
                        }
                        label={
                          <Typography
                            sx={{
                              fontSize: "14px",
                              fontWeight: 400,
                              color: "#2C2D2C",
                              fontFamily: '"Helvetica Neue", Arial, sans-serif',
                            }}
                          >
                            Draw
                          </Typography>
                        }
                      />
                      <FormControlLabel
                        control={
                          <Radio
                            name="signatureMethod"
                            checked={signatureMethod === "UPLOAD"}
                            onChange={handleMethodChange}
                            value="UPLOAD"
                            sx={{
                              color: "#A9ACA9",
                              "&.Mui-checked": { color: "#0A2E45" },
                            }}
                          />
                        }
                        label={
                          <Typography
                            sx={{
                              fontSize: "14px",
                              fontWeight: 400,
                              color: "#2C2D2C",
                              fontFamily: '"Helvetica Neue", Arial, sans-serif',
                            }}
                          >
                            Upload
                          </Typography>
                        }
                      />
                    </Box>
                  </Box>

                  {signatureMethod === "DRAW" ? (
                    <Box
                      sx={{
                        backgroundColor: "#FBFFF7",
                        border: "1px solid #EFFFE3",
                        borderRadius: "4px",
                        padding: "12px 16px",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "16px",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "12px",
                            fontWeight: 500,
                            color: "#757775",
                            fontFamily: '"Helvetica Neue", Arial, sans-serif',
                            lineHeight: 1.6,
                          }}
                        >
                          {signaturePreviewUrl && hadExistingSignatureFromApi
                            ? "Current signature (click Clear to draw a new one)"
                            : "Use your mouse, touchpad, or touchscreen to draw your signature"}
                        </Typography>
                        <CustomButton
                          variant="secondary"
                          size="sm"
                          onClick={handleClearSignature}
                          disabled={!hasDrawnSignature && !hadExistingSignatureFromApi}
                        >
                          Clear
                        </CustomButton>
                      </Box>
                      <Box
                        sx={{
                          backgroundColor: "#FFFFFF",
                          border: "1px solid #E7E9EB",
                          borderRadius: "4px",
                          padding: "16px",
                          minHeight: 120,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {signaturePreviewUrl && hadExistingSignatureFromApi ? (
                          <Box
                            component="img"
                            src={signaturePreviewUrl}
                            alt="Current signature"
                            sx={{
                              maxWidth: "100%",
                              width: "100%",
                              height: 120,
                              objectFit: "contain",
                              display: "block",
                            }}
                          />
                        ) : (
                          <SignatureCanvas
                            key={`signature-canvas-${signatureCanvasKey}`}
                            ref={signatureRef}
                            width={568}
                            height={120}
                            backgroundColor="#FFFFFF"
                            strokeColor="#000000"
                            strokeWidth={2}
                            onSignatureChange={handleSignatureChange}
                          />
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        padding: "12px 16px",
                        backgroundColor: "#FBFFF7",
                        border: "1px solid #EFFFE3",
                        borderRadius: "4px",
                      }}
                    >
                      <input
                        ref={signatureFileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleFileUpload}
                        style={{ display: "none" }}
                      />
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "12px",
                            fontWeight: 500,
                            color: "#757775",
                            fontFamily: '"Helvetica Neue", Arial, sans-serif',
                            lineHeight: 1.6,
                          }}
                        >
                          Upload your signature file
                        </Typography>
                        <CustomButton
                          variant="secondary"
                          size="sm"
                          onClick={handleClearSignature}
                          disabled={!signatureFile && !signaturePreviewUrl}
                        >
                          Clear
                        </CustomButton>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          padding: "16px",
                          backgroundColor: "#FFFFFF",
                          border: "1px solid #E7E9EB",
                          borderRadius: "4px",
                          cursor: "pointer",
                          "&:hover": { backgroundColor: "#FAFAFA" },
                        }}
                        onClick={() => signatureFileInputRef.current?.click()}
                      >
                        {signaturePreviewUrl ? (
                          <>
                            <Box
                              component="img"
                              src={signaturePreviewUrl}
                              alt="Uploaded signature"
                              sx={{
                                maxWidth: "100%",
                                height: 120,
                                objectFit: "contain",
                                display: "block",
                                mx: "auto",
                              }}
                            />
                            <Typography
                              sx={{
                                fontSize: "12px",
                                color: "#757775",
                                fontFamily: '"Helvetica Neue", Arial, sans-serif',
                                textAlign: "center",
                              }}
                            >
                              {signatureFile
                                ? `${signatureFile.name} — click to replace`
                                : "Click to replace signature file"}
                            </Typography>
                          </>
                        ) : (
                          <Typography
                            sx={{
                              fontSize: "14px",
                              color: "#757775",
                              fontFamily: '"Helvetica Neue", Arial, sans-serif',
                              textAlign: "center",
                            }}
                          >
                            Click to upload signature file
                          </Typography>
                        )}
                      </Box>
                      {signatureFileError && (
                        <Typography sx={{ color: "#DC2626", fontSize: "12px", mt: 0.5 }}>
                          {signatureFileError}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              </Grid>
            )}
          </Grid>
        </Grid>

        {/* Fixed Footer */}
        <Grid
          size={{ xs: 12 }}
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderTop: "1px solid #E3ECEF",
            backgroundColor: "#FFFFFF",
            flexShrink: 0,
          }}
        >
          <CustomButton variant="secondary" size="md" onClick={handleCancel}>
            Cancel
          </CustomButton>

          <CustomButton
            type="button"
            variant="primary"
            size="md"
            onClick={handleSubmit(handleFormSubmit)}
            disabled={isSubmitting || updateUserMutationHook.isPending || !isFormValid}
            sx={{
              minWidth: "120px",
              opacity: isSubmitting || updateUserMutationHook.isPending ? 0.7 : 1,
            }}
          >
            {isSubmitting || updateUserMutationHook.isPending ? (
              <Grid sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CircularProgress size={16} sx={{ color: "#FFFFFF" }} />
                <span>Saving...</span>
              </Grid>
            ) : (
              "Save"
            )}
          </CustomButton>
        </Grid>

        <CommonSnackbar
          isOpen={snackbar.isOpen}
          message={snackbar.message}
          status={snackbar.status}
          onClose={handleSnackbarClose}
        />
      </Grid>
    </CustomDrawer>
  );
};

export default EditUserDrawer;
