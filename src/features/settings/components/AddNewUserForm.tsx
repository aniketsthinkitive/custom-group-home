import { useEffect, useImperativeHandle, forwardRef, useState, useRef, useCallback } from "react";
import { Typography, Grid, Avatar, Box, IconButton } from "@mui/material";
import { DeleteOutline } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import CustomInput from "../../../components/custom-input/custom-input";
import CustomButton from "../../../components/custom-buttons/custom-buttons";
import CustomLabel from "../../../components/custom-label/custom-label";
import CustomSelect from "../../../components/custom-select/custom-select";
import CommonSnackbar from "../../../components/common-snackbar/common-snackbar";
import { usePermission } from "../../../hooks/usePermission";
import { useAuth } from "../../../hooks/useAuth";

// Form validation schema
const userFormSchema = yup.object({
  firstName: yup
    .string()
    .trim()
    .required("First name is required")
    // .test("no-leading-trailing-spaces", "First name cannot start or end with whitespace", function (value) {
    //   if (!value) return true;
    //   return value === value.trim();
    // })
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must not exceed 50 characters"),

  lastName: yup
    .string()
    .required("Last name is required")
    .trim()
    // .test("no-leading-trailing-spaces", "Last name cannot start or end with whitespace", function (value) {
    //   if (!value) return true;
    //   return value === value.trim();
    // })
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
    // .test("no-leading-trailing-spaces", "Email cannot start or end with whitespace", function (value) {
    //   if (!value) return true;
    //   return value === value.trim();
    // }),
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
  groupHome: yup.mixed().nullable(),
  resident: yup.string().nullable(),
  countryCode: yup.string().nullable(),
});

export interface UserFormData {
  uuid?: string;
  username?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  ssn?: string;
  npi?: string;
  role: string;
  groupHome?: string | string[];
  resident?: string;
  countryCode?: string;
  profilePicture?: File | string | null;
  avatar_url?: string | File;
  /** Signature image URL from API (for edit drawer prefill) */
  signature?: string | null;
  active?: boolean;
  /** Whether the user has already set their password (used to disable email in edit mode) */
  isPasswordSet?: boolean;
}

interface AddNewUserFormProps {
  isEdit?: boolean;
  initialData?: Partial<UserFormData>;
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  roles?: Array<{ value: string; label: string }>;
  groupHomes?: Array<{ value: string; label: string }>;
  residents?: Array<{ value: string; label: string }>;
  onResidentsDropdownOpen?: () => void;
  disableGroupHome?: boolean;
  isAgentTab?: boolean;
  /** Whether the user has set their password — disables email field in edit mode */
  isPasswordSet?: boolean;
}

export interface AddNewUserFormRef {
  resetForm: () => void;
  setFieldError: (name: keyof UserFormData, message: string) => void;
}

const AddNewUserForm = forwardRef<AddNewUserFormRef, AddNewUserFormProps>(
  (
    {
      isEdit = false,
      initialData,
      onSubmit,
      onCancel,
      isLoading = false,
      roles = [],
      groupHomes = [],
      residents = [],
      onResidentsDropdownOpen,
      disableGroupHome = false,
      isAgentTab = false,
      isPasswordSet = false,
    },
    ref
  ) => {
    // In edit mode, hide SSN and NPI fields if the user's role is Agent or Guardian
    const isAgentOrGuardianEdit = isEdit && initialData?.role
      ? ["agent", "guardian"].includes(initialData.role.toLowerCase())
      : false;

    // Allow role changes for users with role_assignment permission
    // (Admin, Program Director, BCBA, Program Manager) but NOT Program Coordinator
    const { hasPermission } = usePermission();

    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [profilePreview, setProfilePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const groupHomeSetRef = useRef<boolean | string>(false);
    const [snackbar, setSnackbar] = useState<{
      isOpen: boolean;
      message: string;
      status: "success" | "error";
    }>({
      isOpen: false,
      message: "",
      status: "success",
    });

    const initialValues = {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      ssn: "",
      npi: "",
      role: "",
      groupHome: "",
      resident: "",
      countryCode: "+1",
    };

    const {
      control,
      handleSubmit,
      setError,
      setValue,
      reset,
      watch,
      formState: { errors },
    } = useForm<UserFormData>({
      resolver: yupResolver(userFormSchema) as any,
      defaultValues: initialValues,
      mode: "onChange",
    });

    const selectedRoleValue = watch("role");
    const selectedRoleLabel = roles.find((r) => r.value === selectedRoleValue)?.label?.toLowerCase() || '';
    const selectedRoleValueLower = (selectedRoleValue || "").toLowerCase();
    const isMultiGroupHomeRole = 
      selectedRoleValueLower === 'program coordinator' || 
      selectedRoleValueLower === 'program manager' || 
      selectedRoleLabel === 'program coordinator' || 
      selectedRoleLabel === 'program manager';

    useImperativeHandle(ref, () => ({
      resetForm: () => {
        reset(initialValues);
        setProfilePicture(null);
        setProfilePreview(null);
        groupHomeSetRef.current = false;
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      },
      setFieldError: (name: keyof UserFormData, message: string) => {
        setError(name, { type: "server", message });
      },
    }));

    useEffect(() => {
      if (isEdit && initialData) {
        const formData: Partial<UserFormData> = { ...initialData };

        Object.keys(formData).forEach((key) => {
          const value = formData[key as keyof UserFormData];
          if (value !== undefined && key !== "profilePicture" && key !== "groupHome") {
            setValue(key as keyof UserFormData, value);
          }
        });

        const avatarUrl = (initialData as any).avatar_url || initialData.profilePicture;
        if (avatarUrl && typeof avatarUrl === "string") {
          setProfilePreview(avatarUrl);
          setProfilePicture(null);
        } else if (!avatarUrl) {
          setProfilePreview(null);
          setProfilePicture(null);
        }
      } else if (!isEdit) {
        reset(initialValues);
        setProfilePicture(null);
        setProfilePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        // If opening from Agent tab, set default role to AGENT
        if (isAgentTab && roles.length > 0) {
          const agentRole = roles.find(
            (r) =>
              r.value === "AGENT" ||
              r.value?.toUpperCase() === "AGENT" ||
              r.label?.toUpperCase().includes("AGENT")
          );
          if (agentRole) {
            setValue("role", agentRole.value);
          }
        }
      }
    }, [isEdit, initialData, setValue, reset, isAgentTab, roles]);

    // Reset the ref when initialData changes or when switching to non-edit mode
    useEffect(() => {
      if (!isEdit || !initialData?.groupHome) {
        groupHomeSetRef.current = false;
      }
    }, [isEdit, initialData?.groupHome]);

    // Set groupHome value when both initialData and groupHomes are available
    useEffect(() => {
      // Allow re-setting if the async API response comes back with an array instead of the string
      if (isEdit && initialData?.groupHome && groupHomes.length > 0) {
        // Did the value actually change to something new that we haven't processed?
        if (groupHomeSetRef.current === JSON.stringify(initialData.groupHome)) {
          return;
        }

        if (Array.isArray(initialData.groupHome)) {
            // directly map from uuid since UsersSettingsPage already provides an array of UUIDs
            setValue("groupHome", initialData.groupHome, { shouldValidate: true, shouldDirty: false });
            groupHomeSetRef.current = JSON.stringify(initialData.groupHome);
        } else {
            const targetValue = String(initialData.groupHome || "").trim();
            if (!targetValue) return;
            
            // if single string is UUID, just pass it
            setValue("groupHome", targetValue, { shouldValidate: true, shouldDirty: false });
            groupHomeSetRef.current = JSON.stringify(initialData.groupHome);
        }
      }
    }, [isEdit, initialData?.groupHome, groupHomes, setValue]);

    useEffect(() => {
      if (!isEdit) {
        reset(initialValues);
        setProfilePicture(null);
        setProfilePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }, [isEdit, reset]);

    const scrollToFirstError = useCallback((errors: Record<string, unknown>) => {
      const firstField = Object.keys(errors)[0];
      if (!firstField) return;
      setTimeout(() => {
        const el = document.querySelector(`[name="${firstField}"]`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          if (el instanceof HTMLElement) el.focus();
        }
      }, 100);
    }, []);

    const handleFormSubmit = (data: UserFormData) => {
      const formData: UserFormData = {
        ...data,
        profilePicture: profilePicture || undefined,
      };

      // If avatar_url is passed in initialData and no new file is selected, include it
      if (
        !profilePicture &&
        profilePreview &&
        (initialData as any)?.avatar_url &&
        typeof (initialData as any).avatar_url === "string"
      ) {
        (formData as any).avatar_url = (initialData as any).avatar_url;
      } else if (!profilePreview && !profilePicture) {
        (formData as any).avatar_url = null;
      }

      onSubmit(formData);
    };

    const handleCancel = () => {
      reset(initialValues);
      setProfilePicture(null);
      setProfilePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onCancel();
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
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    const { user: currentAuthUser } = useAuth();
   const currentUserRole = currentAuthUser?.role?.name?.toLowerCase();

const allowedRoles = [
  "admin",
  "program director",
  "program manager"
];

const hasAccess = allowedRoles.includes(currentUserRole || "");

const canEditFieldsInEditMode = hasAccess;
const canChangeRole = hasAccess;

    const handleAvatarClick = () => {
      fileInputRef.current?.click();
    };

    const handleRemoveProfilePic = (e: React.MouseEvent) => {
      e.stopPropagation();
      setProfilePicture(null);
      setProfilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
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
            {isEdit ? "Edit User" : "Add New User"}
          </Typography>
          <Grid
            size={{ xs: 12 }}
            sx={{
              width: "38px",
              height: "38px",
              borderRadius: "18px",
              backgroundColor: "#F6F6F6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            onClick={handleCancel}
          >
            <Typography sx={{ fontSize: "25px", color: "#2C2D2C" }}>×</Typography>
          </Grid>
        </Grid>

        {/* Form Content */}
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
        >
          <Grid
            size={{ xs: 12 }}
            sx={{
              border: "1px solid #E7E9EB",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              padding: { xs: "16px", md: "16px" },
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.06)",
            }}
          >
            {/* Profile Picture Upload */}
            <Grid
              size={{ xs: 12 }}
              sx={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}
            >
              <CustomLabel label="Upload Profile Pic" />
              <Box
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
                        width: 100,
                        height: 100,
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
                  <Box
                    sx={{
                      width: 100,
                      height: 100,
                      borderRadius: "50%",
                      backgroundColor: "#F6F8FB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px dashed #E2E5E8",
                    }}
                  >
                    <Box
                      component="img"
                      src="data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 15V3M12 3L8 7M12 3L16 7M4 13H20C20.5523 13 21 13.4477 21 14V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V14C3 13.4477 3.44772 13 4 13Z' stroke='%238A8F98' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"
                      alt="Upload"
                      sx={{ width: "24px", height: "24px", opacity: 1 }}
                    />
                  </Box>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </Box>
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
                  <Grid size={{ xs: 12 }} sx={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
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
                  <Grid size={{ xs: 12 }} sx={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
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
                  <Grid size={{ xs: 12 }} sx={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                    <CustomLabel label="Email" isRequired />
                    <CustomInput
                      placeholder="Enter"
                      name="email"
                      value={field.value}
                      onChange={field.onChange}
                      hasError={!!errors.email}
                      errorMessage={errors.email?.message}
                      disableField={isEdit && isPasswordSet}
                    />
                  </Grid>
                )}
              />

              <Grid size={{ xs: 12 }} sx={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                <CustomLabel label="Phone Number" isRequired />
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

            {/* SSN and NPI Row - hidden in edit mode for Agent/Guardian roles */}
            {!isAgentOrGuardianEdit && (
              <Grid
                size={{ xs: 12 }}
                sx={{ display: "flex", gap: "10px" }}
                flexDirection={{ xs: "column", sm: "column", md: "row", lg: "row" }}
              >
                <Controller
                  name="ssn"
                  control={control}
                  render={({ field }) => (
                    <Grid size={{ xs: 12 }} sx={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
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
                    <Grid size={{ xs: 12 }} sx={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
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
                render={({ field }) => {
                  const roleLabel = roles.find((r) => r.value === field.value)?.label || field.value || "";

                  return (
                    <Grid size={{ xs: isAgentTab ? 6 : 12 }} sx={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                      <CustomLabel label="Role" isRequired />
                      {isAgentTab ? (
                        <CustomInput
                          placeholder="Role"
                          name="role"
                          value={roleLabel}
                          onChange={() => {}}
                          disableField={true}
                        />
                      ) : (
                        <CustomSelect
                          placeholder="Select Role"
                          name="role"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          items={roles}
                          hasError={!!errors.role}
                          errorMessage={errors.role?.message}
                         isDisabled={isEdit && !canEditFieldsInEditMode}                               />
                      )}
                    </Grid>
                  );
                }}
              />

              {!isAgentTab && (
                <Controller
                  name="groupHome"
                  control={control}
                  render={({ field }) => {
                    const filteredGroupHomes = disableGroupHome
                      ? groupHomes.filter((gh: any) => String(gh.value) === String(field.value))
                      : groupHomes;

                    return (
                      <Grid size={{ xs: 12 }} sx={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                        <CustomLabel label="Group Home" />
                        <CustomSelect
                          placeholder={isMultiGroupHomeRole ? "Select Group Homes" : "Select Group Home"}
                          name="groupHome"
                          multiple={isMultiGroupHomeRole}
                          onChange={(e) => field.onChange(e.target.value)}
                          items={filteredGroupHomes}
                          isDisabled={(isEdit && !canEditFieldsInEditMode) || disableGroupHome}                          hasError={!!errors.groupHome}
                          errorMessage={errors.groupHome?.message}
                          value={isMultiGroupHomeRole 
                            ? (Array.isArray(field.value) ? field.value : (field.value ? [String(field.value)] : [])) 
                            : (Array.isArray(field.value) ? (field.value[0] || "") : (field.value || ""))
                          }
                        />
                      </Grid>
                    );
                  }}
                />
              )}
            </Grid>

            {/* Resident Dropdown Row (kept commented as in your code) */}
            {/* ... */}
          </Grid>
        </Grid>

        {/* Fixed Footer with Buttons */}
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
          <CustomButton variant="secondary" size="md" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </CustomButton>
          <CustomButton variant="primary" size="md" onClick={handleSubmit(handleFormSubmit, scrollToFirstError)} disabled={isLoading}>
            {isLoading ? "Saving..." : isEdit ? "Update User" : "Add"}
          </CustomButton>
        </Grid>

        {snackbar.isOpen && (
          <CommonSnackbar
            isOpen={snackbar.isOpen}
            message={snackbar.message}
            status={snackbar.status}
            onClose={() => setSnackbar((prev) => ({ ...prev, isOpen: false }))}
            autoClose={true}
            autoCloseDelay={5000}
          />
        )}
      </Grid>
    );
  }
);

AddNewUserForm.displayName = "AddNewUserForm";

export default AddNewUserForm;
