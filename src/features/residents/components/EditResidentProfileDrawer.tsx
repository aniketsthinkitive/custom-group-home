import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Grid,
  Box,
  IconButton,
  Avatar,
  useMediaQuery,
  useTheme,
  Typography,
} from "@mui/material";
import { Close, DeleteOutline } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import dayjs, { type Dayjs } from "dayjs";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type DefaultError,
} from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type { GenderEnum, Status7B0Enum } from "../../../sdk/types.gen";
import { client } from "../../../sdk/client.gen";
import {
  updateLeadMutation,
  getLeadDetailQueryKey,
  getLeadDetailOptions,
  listUsersOptions,
} from "../../../sdk/@tanstack/react-query.gen";
import { updateUser } from "../../../sdk/sdk.gen";
import CustomDrawer from "../../../components/custom-drawer/custom-drawer";
import CustomInput from "../../../components/custom-input/custom-input";
import CustomButton from "../../../components/custom-buttons/custom-buttons";
import CustomSelect from "../../../components/custom-select/custom-select";
import CustomLabel from "../../../components/custom-label/custom-label";
import { type FileItem } from "../../../components/custom-fileupload";
import DatePickerField from "../../../components/date-picker-field/date-picker-field";
import CommonSnackbar from "../../../components/common-snackbar/common-snackbar";
import { useAuth } from "../../../hooks/useAuth";
import { stateOptions } from "../../../constant/stateOptions";

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
const editProfileFormSchema = yup.object({
   firstName: yup
     .string()
     .trim()
     .required("First name is required")
     .min(2, "First name must be at least 2 characters")
     .max(50, "First Name must not exceed 50 characters."),
   lastName: yup
     .string()
     .trim()
     .required("Last name is required")
     .min(2, "Last name must be at least 2 characters")
     .max(50, "Last Name must not exceed 50 characters."),
   contactNumber: yup
     .string()
     .nullable()
     .test("phone-length", "Phone number must be 10 digits", function (value) {
       if (!value || value.trim() === "") return true;
       const digitsOnly = value.replace(/\D/g, "");
       return digitsOnly.length === 10;
     }),
   email: yup
     .string()
     .nullable()
     .test("email-format", "Invalid email format", function (value) {
       if (!value || value.trim() === "") return true;
       return value.includes("@") && value.includes(".");
     })
     .email("Invalid email"),
  dateOfBirth: yup
    .mixed()
    .required("Date of birth is required")
    .typeError("Invalid date format"),
  gender: yup.string(),
  referralId: yup.string().required("Referral ID is required").trim(),
  status: yup.string().required("Status is required"),
  referralSource: yup.string().default("").nullable(),
  streetAddress: yup.string().required("Street address is required"),
  state: yup.string().required("State is required"),
  city: yup.string().required("City is required"),
  zipCode: yup
    .string()
    .required("ZIP code is required")
   .test("zip-length", "ZIP code must be in 5 to 9 digits", function (value) {
      if (!value || value.trim() === "") return true;
      const digitsOnly = value.replace(/\D/g, "");
      return digitsOnly.length >= 5 && digitsOnly.length <= 9;
    }),
  guardianId: yup
    .string()
    .nullable()
    .test(
      "guardian-or-Area Agency-required",
      "Please select or create at least one guardian or Area Agency",
      function (value) {
        const { guardianFirstName, serviceManagerId, serviceManagerFirstName } =
          this.parent;
        const hasGuardian = !!(
          value ||
          (guardianFirstName && guardianFirstName.trim())
        );
        const hasAgent = !!(
          serviceManagerId ||
          (serviceManagerFirstName && serviceManagerFirstName.trim())
        );
        return hasGuardian || hasAgent;
      },
    ),
  guardianFirstName: yup
    .string()
    .trim()
    .nullable()
    .test(
      "min-length",
      "First name must be at least 2 characters",
      function (value) {
        if (!value) return true;
        return value.length >= 2;
      }
    )
    .test(
      "max-length",
      "First name must not exceed 50 characters",
      function (value) {
        if (!value) return true;
        return value.length <= 50;
      }
    ),
guardianLastName: yup
  .string()
    .trim()
    .nullable()
    .when("guardianFirstName", {
      is: (val: string | null) => val && val.trim() !== "",
      then: (schema) =>
        schema
          .required("Guardian last name is required")
    .min(2, "Last name must be at least 2 characters")
        .max(50, "Last name must not exceed 50 characters"),
      otherwise: (schema) => schema.nullable(),
    }),
  relation: yup
    .string()
    .nullable()
    .when("guardianId", {
      is: (val: string | null) => !val || val === "",
      then: (schema) => schema.nullable(),
      otherwise: (schema) => schema,
    }),
  guardianContactNumber: yup
    .string()
    .nullable()
    .when("guardianFirstName", {
      is: (val: string | null) => val && val.trim() !== "",
      then: (schema) =>
        schema
          .required("Guardian phone number is required")
          .test(
            "phone-length",
            "Phone number must be 10 digits",
            function (value) {
              if (!value || value.trim() === "") return false;
              const digitsOnly = value.replace(/\D/g, "");
              return digitsOnly.length === 10;
            },
          ),
      otherwise: (schema) =>
        schema
          .nullable()
          .test(
            "phone-length",
            "Phone number must be 10 digits",
            function (value) {
              if (!value || value.trim() === "") return true;
              const digitsOnly = value.replace(/\D/g, "");
              return digitsOnly.length === 10;
            },
          ),
    }),
  guardianEmail: yup
    .string()
    .nullable()
    .when("guardianFirstName", {
      is: (val: string | null) => val && val.trim() !== "",
      then: (schema) =>
        schema
          .required("Guardian email is required")
          .test("email-format", "Invalid email format", function (value) {
            if (!value || value.trim() === "") return false;
            return value.includes("@") && value.includes(".");
          })
          .email("Invalid email"),
      otherwise: (schema) =>
        schema
          .nullable()
          .test("email-format", "Invalid email format", function (value) {
            if (!value || value.trim() === "") return true;
            return value.includes("@") && value.includes(".");
          })
          .email("Invalid email"),
    }),
  serviceManagerId: yup
    .string()
    .nullable()
    .test(
      "guardian-or-Area Agency-required",
      "Please select or create at least one guardian or Area Agency",
      function (value) {
        const { serviceManagerFirstName, guardianId, guardianFirstName } =
          this.parent;
        const hasGuardian = !!(
          guardianId ||
          (guardianFirstName && guardianFirstName.trim())
        );
        const hasAgent = !!(
          value ||
          (serviceManagerFirstName && serviceManagerFirstName.trim())
        );
        return hasGuardian || hasAgent;
      },
    ),
   serviceManagerFirstName: yup
      .string()
      .trim()
      .nullable()
      .test(
        "min-length",
        "First name must be at least 2 characters",
        function (value) {
          if (!value) return true;
          return value.length >= 2;
        }
      )
      .test(
        "max-length",
        "First name must not exceed 50 characters",
        function (value) {
          if (!value) return true;
          return value.length <= 50;
        }
      ),
    serviceManagerLastName: yup
      .string()
      .nullable()
      .when("serviceManagerFirstName", {
        is: (val: string | null) => val && val.trim() !== "",
        then: (schema) =>
          schema
            .required("Area Agency last name is required")
      .min(2, "Last name must be at least 2 characters")
          .max(50, "Last name must not exceed 50 characters"),
        otherwise: (schema) => schema.nullable(),
      }),
  serviceManagerContactNumber: yup
    .string()
    .nullable()
    .when("serviceManagerFirstName", {
      is: (val: string | null) => val && val.trim() !== "",
      then: (schema) =>
        schema
          .required("Area Agency phone number is required")
          .test(
            "phone-length",
            "Phone number must be 10 digits",
            function (value) {
              if (!value || value.trim() === "") return false;
              const digitsOnly = value.replace(/\D/g, "");
              return digitsOnly.length === 10;
            },
          ),
      otherwise: (schema) =>
        schema
          .nullable()
          .test(
            "phone-length",
            "Phone number must be 10 digits",
            function (value) {
              if (!value || value.trim() === "") return true;
              const digitsOnly = value.replace(/\D/g, "");
              return digitsOnly.length === 10;
            },
          ),
    }),
  serviceManagerEmail: yup
    .string()
    .nullable()
    .when("serviceManagerFirstName", {
      is: (val: string | null) => val && val.trim() !== "",
      then: (schema) =>
        schema
          .required("Area Agency email is required")
          .test("email-format", "Invalid email format", function (value) {
            if (!value || value.trim() === "") return false;
            return value.includes("@") && value.includes(".");
          })
          .email("Invalid email"),
      otherwise: (schema) =>
        schema
          .nullable()
          .test("email-format", "Invalid email format", function (value) {
            if (!value || value.trim() === "") return true;
            return value.includes("@") && value.includes(".");
          })
          .email("Invalid email"),
    }),
  insuranceProvider: yup.string().required("Insurance provider is required").nullable(),

  
  policyNumber: yup.string().required("Policy number is required"),
  insuranceStatus: yup.string().required("Insurance status is required"),
});

export interface EditProfileFormData {
  profilePicture?: File | string | null;
  firstName: string;
  lastName: string;
  contactNumber?: string;
  email?: string;
  referralId: string;
  gender: string;
  dateOfBirth: Dayjs | null;
  status: string;
  referralSource: string;
  guardianId: string | null;
  guardianFirstName: string;
  guardianLastName: string;
  relation: string;
  guardianContactNumber: string;
  guardianEmail: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  serviceManagerId: string | null;
  serviceManagerFirstName: string;
  serviceManagerLastName: string;
  serviceManagerContactNumber: string;
  serviceManagerEmail: string;
  insuranceProvider: string;
  policyNumber: string;
  insuranceStatus: string;
}

/** When 'resident', success message is "Resident updated successfully"; when 'lead', "Lead updated successfully". */
export type EditProfileContextMode = "lead" | "resident";

/** Field names in visual order (top to bottom) for scroll-to-first-error */
const EDIT_PROFILE_FIELD_ORDER = [
  "firstName",
  "lastName",
  "contactNumber",
  "email",
  "referralId",
  "gender",
  "dateOfBirth",
  "referralSource",
  "streetAddress",
  "city",
  "state",
  "zipCode",
  "guardianId",
  "guardianFirstName",
  "guardianLastName",
  "relation",
  "guardianContactNumber",
  "guardianEmail",
  "serviceManagerId",
  "serviceManagerFirstName",
  "serviceManagerLastName",
  "serviceManagerEmail",
  "serviceManagerContactNumber",
  "insuranceProvider",
  "policyNumber",
  "insuranceStatus",
];

function scrollToFirstInvalidField(errors: Record<string, { message?: string } | undefined>): void {
  const firstField = EDIT_PROFILE_FIELD_ORDER.find((name) => errors[name]);
  if (!firstField) return;
  // Defer so React has applied error state and the invalid field is visible/highlighted
  requestAnimationFrame(() => {
    const el = document.querySelector(`[data-field="${firstField}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const focusable = el.querySelector<HTMLElement>(
        "input:not([type=hidden]), select, textarea, [role=combobox]"
      );
      if (focusable && typeof focusable.focus === "function") {
        focusable.focus();
      }
    }
  });
}

interface EditProfileDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  initialData?: Partial<EditProfileFormData>;
  onSave: (values: EditProfileFormData) => void;
  isSaving?: boolean;
  leadUuid?: string;
  /** Entity context for success/error messages. Defaults to 'lead' when omitted. */
  contextMode?: EditProfileContextMode;
  /** Optional action to scroll directly to a specific section */
  action?: "edit_guardian" | "edit_agent" | null;
}

const EditProfileDetailsDrawer: React.FC<EditProfileDetailsDrawerProps> = ({
  open,
  onClose,
  initialData,
  onSave,
  isSaving = false,
  leadUuid,
  contextMode = "lead",
  action,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (open) {
      if (action === "edit_guardian") {
        setTimeout(() => {
          const el = document.getElementById("guardian-section");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      } else if (action === "edit_agent") {
        setTimeout(() => {
          const el = document.getElementById("agent-section");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      } else if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
  }, [open, action]);

  const queryClient = useQueryClient();
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
    status: "success" | "error";
  }>({
    isOpen: false,
    message: "",
    status: "success",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGuardianAddNew, setShowGuardianAddNew] = useState(false);
  const [showServiceManagerAddNew, setShowServiceManagerAddNew] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    trigger,
    clearErrors,
    setError,
    formState: { errors },
  } = useForm<EditProfileFormData>({
    resolver: yupResolver(editProfileFormSchema) as any,
    defaultValues: {
      profilePicture: null,
      firstName: "",
      lastName: "",
      contactNumber: "",
      email: "",
      referralId: "",
      gender: "",
      dateOfBirth: null,
      status: "",
      referralSource: "",
      guardianId: null,
      guardianFirstName: "",
      guardianLastName: "",
      relation: "",
      guardianContactNumber: "",
      guardianEmail: "",
      streetAddress: "",
      city: "",
      state: "",
      zipCode: "",
      serviceManagerId: null,
      serviceManagerFirstName: "",
      serviceManagerLastName: "",
      serviceManagerContactNumber: "",
      serviceManagerEmail: "",
      insuranceProvider: "",
      policyNumber: "",
      insuranceStatus: "",
    },
    mode: "onChange",
  });

  const { user } = useAuth();

  const dateOfBirth = watch("dateOfBirth");

  const selectedGuardianId = watch("guardianId");
  const selectedServiceManagerId = watch("serviceManagerId");
  const guardianFirstName = watch("guardianFirstName");
  const serviceManagerFirstName = watch("serviceManagerFirstName");

  // Re-validate guardian/service manager when either selection or "add new" names change
  // (same as New Lead form) so that selecting a guardian clears the error on Service Manager.
  useEffect(() => {
    trigger(["guardianId", "serviceManagerId"]);
  }, [
    selectedGuardianId,
    selectedServiceManagerId,
    guardianFirstName,
    serviceManagerFirstName,
    trigger,
  ]);

  // Fetch lead details when drawer opens
  const { data: leadDetailData } = useQuery({
    ...getLeadDetailOptions({
      path: { uuid: leadUuid || "" },
    }),
    enabled: open && !!leadUuid,
  });

  // Fetch guardians list
  const { data: guardiansResponse } = useQuery({
    ...(listUsersOptions({
      query: {
        role: "GUARDIAN",
        status: "active",
        size: 1000,
      },
    }) as any),
    enabled: open,
  });

  // Fetch service managers (AGENT role)
  const { data: serviceManagersResponse } = useQuery({
    ...(listUsersOptions({
      query: {
        role: "AGENT",
        status: "active",
        size: 1000,
      },
    }) as any),
    enabled: open,
  });

  // Transform guardians data to dropdown options
  // Value = email (unique) so the correct entry is highlighted even with duplicate names.
  // Label = name only (no email shown in dropdown text).
  const guardianOptions: Array<{ value: string; label: string; hidden?: boolean }> = useMemo(() => {
    let users: any[] = [];
    if (guardiansResponse) {
      const responseData = guardiansResponse as any;
      if (responseData?.data) {
        if (responseData.data.results && Array.isArray(responseData.data.results)) {
          users = responseData.data.results;
        } else if (Array.isArray(responseData.data)) {
          users = responseData.data;
        } else if (responseData.data.data && Array.isArray(responseData.data.data)) {
          users = responseData.data.data;
        }
      }
    }
    const options = users
      .filter((user: any) => user.active !== false && user.active !== undefined)
      .map((user: any) => ({
        value: user.uuid || "",
        label: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || "",
      }));

    const currentGuardian = (leadDetailData as any)?.data?.guardian || (leadDetailData as any)?.guardian;
    if (currentGuardian?.uuid && !options.some(opt => opt.value === currentGuardian.uuid)) {
      options.push({
        value: currentGuardian.uuid,
        label: `${currentGuardian.first_name || ""} ${currentGuardian.last_name || ""}`.trim() || currentGuardian.email || "",
        hidden: true,
      });
    }

    return options;
  }, [guardiansResponse, leadDetailData]);

  // Transform service managers data to dropdown options
  // Value = uuid (unique) so the correct entry is highlighted even with duplicate names.
  // Label = name only (no email shown in dropdown text).
  const serviceManagerOptions: Array<{ value: string; label: string; hidden?: boolean }> = useMemo(() => {
    let users: any[] = [];
    if (serviceManagersResponse) {
      const responseData = serviceManagersResponse as any;
      if (responseData?.data) {
        if (responseData.data.results && Array.isArray(responseData.data.results)) {
          users = responseData.data.results;
        } else if (Array.isArray(responseData.data)) {
          users = responseData.data;
        } else if (responseData.data.data && Array.isArray(responseData.data.data)) {
          users = responseData.data.data;
        }
      }
    }
    const options = users
      .filter((user: any) => user.active !== false && user.active !== undefined)
      .map((user: any) => ({
        value: user.uuid || "",
        label: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || "",
      }));

    const currentAgent = (leadDetailData as any)?.data?.agent || (leadDetailData as any)?.agent;
    if (currentAgent?.uuid && !options.some(opt => opt.value === currentAgent.uuid)) {
      options.push({
        value: currentAgent.uuid,
        label: `${currentAgent.first_name || ""} ${currentAgent.last_name || ""}`.trim() || currentAgent.email || "",
        hidden: true,
      });
    }

    return options;
  }, [serviceManagersResponse, leadDetailData]);

  // Map gender from API enum to form
  const mapGenderFromEnum = (gender: GenderEnum | null | undefined): string => {
    if (!gender) return "";
    const genderMap: Record<GenderEnum, string> = {
      MALE: "Male",
      FEMALE: "Female",
      OTHER: "Other",
      UNKNOWN: "Other",
    };
    return genderMap[gender] || "";
  };

  // Map gender from form to API enum
  const mapGenderToEnum = (gender: string): GenderEnum | null => {
    const genderMap: Record<string, GenderEnum> = {
      Male: "MALE",
      Female: "FEMALE",
      Other: "OTHER",
    };
    return genderMap[gender] || null;
  };

  // Map status from API enum to form
  const mapStatusFromEnum = (
    status: Status7B0Enum | null | undefined,
  ): string => {
    if (!status) return "";
    const statusMap: Record<Status7B0Enum, string> = {
      COMPLETED: "Active",
      REJECTED: "Inactive",
      UNDER_REVIEW: "Under Review",
      DRAFT: "Pending",
      DOCS_PENDING: "Pending",
      ONBOARDING_IN_PROGRESS: "Active",
    };
    return statusMap[status] || "";
  };

  // Map status from form to API enum
  const mapStatusToEnum = (status: string): Status7B0Enum | null => {
    const statusMap: Record<string, Status7B0Enum> = {
      Active: "COMPLETED",
      Inactive: "REJECTED",
      "Under Review": "UNDER_REVIEW",
      Pending: "DRAFT",
    };
    return statusMap[status] || null;
  };

  // Entity-specific success message so Residents module shows "Resident updated successfully", Leads shows "Lead updated successfully"
  const successMessage =
    contextMode === "resident"
      ? "Resident updated successfully"
      : "Lead updated successfully";

  // Update lead mutation
  const updateLeadMutationHook = useMutation({
    ...updateLeadMutation(),
    onSuccess: (data: unknown) => {
      const responseData = data as any;

      const backendMessage =
        responseData?.message ??
        responseData?.data?.message ??
        responseData?.detail ??
        undefined;

      // Show snackbar: Residents module always gets "Resident updated successfully"; Leads use backend message or "Lead updated successfully"
      setSnackbar({
        isOpen: true,
        message:
          contextMode === "resident"
            ? successMessage
            : (backendMessage || successMessage),
        status: "success",
      });

      // Invalidate queries (lead detail + residents list so table refreshes)
      if (leadUuid) {
        queryClient.invalidateQueries({
          queryKey: getLeadDetailQueryKey({ path: { uuid: leadUuid } }),
        });
      }
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] &&
          typeof query.queryKey[0] === "object" &&
          (query.queryKey[0] as { _id?: string })?._id === "listResidents",
      });

      // Close drawer after success
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
        onSave({} as EditProfileFormData);
      }, 1000);
    },
    onError: (error: AxiosError<DefaultError>) => {
      setIsSubmitting(false);
      const errorData = error.response?.data as any;
      const backendMessage = getBackendMessage(error);
      const errorField = errorData?.field;

      if (errorField === 'guardian_email') {
        setError('guardianEmail', { type: 'manual', message: backendMessage || 'Guardian email already exists. Please select the existing guardian from the dropdown.' });
        return;
      }
      if (errorField === 'agent_email') {
        setError('serviceManagerEmail', { type: 'manual', message: backendMessage || 'Area Agency email already exists. Please select the existing Area Agency from the dropdown.' });
        return;
      }

      if (backendMessage) {
        setSnackbar({
          isOpen: true,
          message: backendMessage,
          status: "error",
        });
      }
    },
  });

  useEffect(() => {
    if (dateOfBirth && dayjs.isDayjs(dateOfBirth)) {
      const age = dayjs().diff(dateOfBirth, "year");
      setCalculatedAge(age);
    } else {
      setCalculatedAge(null);
    }
  }, [dateOfBirth]);

  useEffect(() => {
    if (open && leadDetailData) {
      // Extract lead data from API response - handle both { data: LeadDetail } and direct LeadDetail
      const responseData = leadDetailData as any;
      const leadData = responseData?.data || responseData;

      // Handle guardian - might be an object or a number (ID)
      // Check both leadData.guardian and responseData.data.guardian paths
      let guardianObj = null;
      const guardianData = leadData?.guardian || responseData?.data?.guardian;
      if (guardianData) {
        if (typeof guardianData === "object" && guardianData.first_name) {
          guardianObj = guardianData;
        } else if (
          typeof guardianData === "number" ||
          typeof guardianData === "string"
        ) {
          // If it's just an ID, we can't get the details without another API call
          guardianObj = null;
        }
      }

      // Handle agent - might be an object or a number (ID)
      // Check both leadData.agent and responseData.data.agent paths
      let agentObj = null;
      const agentData = leadData?.agent || responseData?.data?.agent;
      if (agentData) {
        if (typeof agentData === "object" && agentData.first_name) {
          agentObj = agentData;
        } else if (
          typeof agentData === "number" ||
          typeof agentData === "string"
        ) {
          agentObj = null;
        }
      }

      // Handle insurance - might be an object (with status boolean and/or provider) or a string (ID)
      let insuranceObj: { status?: boolean; provider?: string; policy_number?: string } | null = null;
      if (leadData?.insurance && typeof leadData.insurance === "object") {
        insuranceObj = leadData.insurance;
      }

      // Map insurance status: API returns boolean; form dropdown expects "Available" | "Not Available"
      // Only map to "Not Available" when insurance has meaningful data (provider or policy_number),
      // otherwise treat default false/null as unset.
      const rawInsuranceStatus = insuranceObj?.status;
      const hasInsuranceData = !!(insuranceObj?.provider || insuranceObj?.policy_number);
      const insuranceStatusFormValue =
        rawInsuranceStatus === true
          ? "Available"
          : rawInsuranceStatus === false && hasInsuranceData
            ? "Not Available"
            : (typeof rawInsuranceStatus === "string" && String(rawInsuranceStatus).trim() !== ""
                ? String(rawInsuranceStatus).trim()
                : "");

      // Address: support both camelCase and snake_case from API (line1/line_1, zipcode/zip_code)
      const address = leadData?.address;
      const streetAddress = address?.line1 ?? address?.line_1 ?? "";
      const city = address?.city ?? "";
      const state = address?.state ?? "";
      const zipCode = address?.zipcode ?? address?.zip_code ?? "";

      // Map lead data to form values
      const formValues: Partial<EditProfileFormData> = {
        firstName: leadData?.user?.first_name || "",
        lastName: leadData?.user?.last_name || "",
        contactNumber: leadData?.user?.phone
          ? typeof leadData.user.phone === "number"
            ? leadData.user.phone.toString()
            : leadData.user.phone.toString().replace(/\D/g, "")
          : "",
        email: leadData?.user?.email || "",
        referralId: leadData?.referral_number || "",
        gender: mapGenderFromEnum(leadData?.gender),
        dateOfBirth: leadData?.date_of_birth
          ? dayjs(leadData.date_of_birth)
          : null,
        status: mapStatusFromEnum(leadData?.status),
        referralSource: leadData?.referral_source || "",
        guardianId: guardianObj?.uuid || null,
        // Only pre-fill inline "Add New" fields when the guardian has NO uuid
        // (was created inline and has no system account yet).
        // When a uuid exists the guardian is in the dropdown — populating these
        // fields triggers strict phone/email validation against stored data that
        // may not pass (e.g. a 9-digit stored phone number).
        guardianFirstName: guardianObj?.uuid ? "" : (guardianObj?.first_name || ""),
        guardianLastName: guardianObj?.uuid ? "" : (guardianObj?.last_name || ""),
        relation: leadData?.guardian_relation || "",
        guardianContactNumber: guardianObj?.uuid
          ? ""
          : guardianObj?.phone
            ? typeof guardianObj.phone === "number"
              ? guardianObj.phone.toString()
              : guardianObj.phone.toString().replace(/\D/g, "")
            : "",
        guardianEmail: guardianObj?.uuid ? "" : (guardianObj?.email || ""),
        streetAddress,
        city,
        state,
        zipCode,
        serviceManagerId: agentObj?.uuid || null,
        // Same logic: only fill inline fields when agent has no system uuid yet.
        serviceManagerFirstName: agentObj?.uuid ? "" : (agentObj?.first_name || ""),
        serviceManagerLastName: agentObj?.uuid ? "" : (agentObj?.last_name || ""),
        serviceManagerContactNumber: agentObj?.uuid ? "" : (agentObj?.phone?.toString() || ""),
        serviceManagerEmail: agentObj?.uuid ? "" : (agentObj?.email || ""),
        insuranceProvider: insuranceObj?.provider ?? "",
        policyNumber: insuranceObj?.policy_number ?? "",
        insuranceStatus: insuranceStatusFormValue,
      };

      reset(formValues);

      // If guardian exists but has no uuid (was created inline), show "Add New" form
      if (guardianObj && !guardianObj.uuid) {
        setShowGuardianAddNew(true);
      } else {
        setShowGuardianAddNew(false);
      }
      // If agent exists but has no uuid (was created inline), show "Add New" form
      if (agentObj && !agentObj.uuid) {
        setShowServiceManagerAddNew(true);
      } else {
        setShowServiceManagerAddNew(false);
      }

      // Set profile picture if available (prefer avatar_url, fallback to profile_picture)
      const avatarUrl =
        leadData?.user?.avatar_url ?? leadData?.user?.profile_picture;
      if (avatarUrl) {
        setProfilePreview(avatarUrl);
      }
    } else if (open && initialData) {
      // Fallback to initialData if leadDetailData is not available
      const formValues: Partial<EditProfileFormData> = {
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        contactNumber: initialData.contactNumber || "",
        email: initialData.email || "",
        referralId: initialData.referralId || "",
        gender: initialData.gender || "",
        dateOfBirth: initialData.dateOfBirth || null,
        status: initialData.status || "",
        referralSource: initialData.referralSource || "",
        guardianId: initialData.guardianId || null,
        guardianFirstName: initialData.guardianFirstName || "",
        guardianLastName: initialData.guardianLastName || "",
        relation: initialData.relation || "",
        guardianContactNumber: initialData.guardianContactNumber || "",
        guardianEmail: initialData.guardianEmail || "",
        streetAddress: initialData.streetAddress || "",
        city: initialData.city || "",
        state: initialData.state || "",
        zipCode: initialData.zipCode || "",
        serviceManagerId: initialData.serviceManagerId || null,
        serviceManagerFirstName: initialData.serviceManagerFirstName || "",
        serviceManagerLastName: initialData.serviceManagerLastName || "",
        serviceManagerContactNumber:
          initialData.serviceManagerContactNumber || "",
        serviceManagerEmail: initialData.serviceManagerEmail || "",
        insuranceProvider: initialData.insuranceProvider || "",
        policyNumber: initialData.policyNumber || "",
        insuranceStatus: initialData.insuranceStatus || "",
      };

      reset(formValues);

      if (initialData.profilePicture) {
        if (typeof initialData.profilePicture === "string") {
          setProfilePreview(initialData.profilePicture);
        } else if (initialData.profilePicture instanceof File) {
          setProfilePicture(initialData.profilePicture);
          const reader = new FileReader();
          reader.onloadend = () => setProfilePreview(reader.result as string);
          reader.readAsDataURL(initialData.profilePicture);
        }
      }
    } else if (!open) {
      reset();
      setProfilePicture(null);
      setProfilePreview(null);
      setCalculatedAge(null);
      setShowGuardianAddNew(false);
      setShowServiceManagerAddNew(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open, leadDetailData, initialData, reset]);

  const handleFormSubmit = async (data: EditProfileFormData) => {
    if (isSubmitting) return; // prevent double click
    setIsSubmitting(true); // lock submit
    if (!leadUuid) {
      setSnackbar({
        isOpen: true,
        message: "Lead UUID is required",
        status: "error",
      });
      setIsSubmitting(false);
      return;
    }

    // Extract lead data
    const responseData = leadDetailData as any;
    const leadData = responseData?.data || responseData;

    if (!leadData?.user) {
      setSnackbar({
        isOpen: true,
        message: "User data is required",
        status: "error",
      });
      setIsSubmitting(false);
      return;
    }

    // Map form data to API structure
    const genderEnum = mapGenderToEnum(data.gender);
    const statusEnum = mapStatusToEnum(data.status);
    const dateOfBirthFormatted =
      data.dateOfBirth && dayjs.isDayjs(data.dateOfBirth)
        ? data.dateOfBirth.format("YYYY-MM-DD")
        : null;

    // Use guardian fields directly
    const guardianFirstName = (data.guardianFirstName || "").trim();
    const guardianLastName = (data.guardianLastName || "").trim();

    // Use service manager fields directly
    const agentFirstName = (data.serviceManagerFirstName || "").trim();
    const agentLastName = (data.serviceManagerLastName || "").trim();

    // Step 1: Update user fields (email, name, phone) via the dedicated user endpoint
    // The updateLead API expects `user: number` (numeric ID), NOT a user object.
    // Email/name/phone MUST be updated separately via PUT /api/accounts/users/{uuid}/
    const userUuid = leadData?.user?.uuid || leadData?.user?.uid;
    if (userUuid) {
      try {
        await updateUser({
          path: { uuid: userUuid },
          body: {
            username: leadData?.user?.username || undefined,
            first_name: data.firstName,
            last_name: data.lastName || "",
            email: data.email !== undefined ? (data.email || null) : (leadData?.user?.email ?? null),
            phone: data.contactNumber
              ? parseInt(data.contactNumber.replace(/\D/g, ""))
              : null,
          },
          throwOnError: true,
        });
      } catch (userUpdateError: any) {
        const backendMsg = getBackendMessage(userUpdateError);
        setSnackbar({
          isOpen: true,
          message: backendMsg ?? "Failed to update user email/name",
          status: "error",
        });
        setIsSubmitting(false);
        return;
      }
    }

    // Step 2: Build the lead payload - backend expects user as numeric ID (not object)
    const apiPayload: any = {
      user: leadData?.user?.id || leadData?.user?.pk || undefined,
      guardian_relation: data.relation || null,
      date_of_birth: dateOfBirthFormatted,
      gender: genderEnum,
      referral_source: data.referralSource || null,
      status: statusEnum,
      reason: null,
    };

    apiPayload.insurance = {
      provider: data.insuranceProvider || null,
      policy_number: data.policyNumber || null,

      // map UI status → boolean
      status: data.insuranceStatus === "Available",
    };

    // Guardian: send guardian_uuid if selected from dropdown, guardian object if adding new, or null to clear
    if (data.guardianId) {
      apiPayload.guardian_uuid = data.guardianId;
    } else if (guardianFirstName || guardianLastName || data.guardianEmail) {
      apiPayload.guardian = {
        first_name: guardianFirstName || null,
        last_name: guardianLastName || null,
        phone: data.guardianContactNumber
          ? parseInt(data.guardianContactNumber.replace(/\D/g, ""))
          : null,
        email: data.guardianEmail || null,
      };
    } else {
      // User selected "None" — explicitly send null to clear the guardian assignment
      apiPayload.guardian_uuid = null;
    }

    // Agent: send agent_uuid if selected from dropdown, agent object if adding new, or null to clear
    if (data.serviceManagerId) {
      apiPayload.agent_uuid = data.serviceManagerId;
    } else if (agentFirstName || agentLastName || data.serviceManagerEmail) {
      apiPayload.agent = {
        first_name: agentFirstName || null,
        last_name: agentLastName || null,
        phone: data.serviceManagerContactNumber
          ? parseInt(data.serviceManagerContactNumber.replace(/\D/g, ""))
          : null,
        email: data.serviceManagerEmail || null,
      };
    } else {
      // User selected "None" — explicitly send null to clear the agent assignment
      apiPayload.agent_uuid = null;
    }

    // Add address object
    if (data.streetAddress || data.city || data.state || data.zipCode) {
      apiPayload.address = {
        line1: data.streetAddress || null,
        line2: leadData?.address?.line2 || null,
        city: data.city || null,
        state: data.state || null,
        zipcode: data.zipCode || null,
        country: leadData?.address?.country || null,
      };
    }

    // If user selected a new avatar file, send multipart (avatar + data); otherwise JSON
    const avatarFile = profilePicture instanceof File ? profilePicture : null;

    // Detect avatar removal: preview cleared and no new file selected
    const avatarWasRemoved = !profilePreview && !avatarFile;
    if (avatarWasRemoved) {
      apiPayload.avatar_url = null;
      (apiPayload as any).profile_picture_media_id = null;
    }

    if (avatarFile) {
      const formData = new FormData();
      formData.append("avatar", avatarFile);
      formData.append("data", JSON.stringify(apiPayload));
      try {
        const response = await client.put({
          url: "/api/leads/{uuid}/",
          path: { uuid: leadUuid },
          body: formData,
          security: [
            { scheme: "bearer", type: "http" },
            { name: "Authorization", type: "apiKey" },
          ],
          throwOnError: true,
        });
        const resData = (response as any)?.data;
        const backendMessage =
          resData?.message ??
          resData?.data?.message ??
          resData?.detail ??
          successMessage;
        setSnackbar({
          isOpen: true,
          message:
            contextMode === "resident"
              ? successMessage
              : (typeof backendMessage === "string"
                  ? backendMessage
                  : successMessage),
          status: "success",
        });
        if (leadUuid) {
          queryClient.invalidateQueries({
            queryKey: getLeadDetailQueryKey({ path: { uuid: leadUuid } }),
          });
        }
        queryClient.invalidateQueries({
          predicate: (query) =>
            Array.isArray(query.queryKey) &&
            query.queryKey[0] &&
            typeof query.queryKey[0] === "object" &&
            (query.queryKey[0] as { _id?: string })?._id === "listResidents",
        });
        setTimeout(() => {
          setIsSubmitting(false);
          onClose();
          onSave({} as EditProfileFormData);
        }, 1000);
      } catch (error: any) {
        const errorData = error?.response?.data ?? error?.data;
        const backendMessage = getBackendMessage(error);
        const errorField = errorData?.field;

        if (errorField === 'guardian_email') {
          setError('guardianEmail', { type: 'manual', message: backendMessage || 'Guardian email already exists. Please select the existing guardian from the dropdown.' });
          setIsSubmitting(false);
          return;
        }
        if (errorField === 'agent_email') {
          setError('serviceManagerEmail', { type: 'manual', message: backendMessage || 'Area Agency email already exists. Please select the existing Area Agency from the dropdown.' });
          setIsSubmitting(false);
          return;
        }

        setSnackbar({
          isOpen: true,
          message: backendMessage ?? "Failed to update profile",
          status: "error",
        });
        setIsSubmitting(false);
      }
      return;
    }

    // Call the mutation (no avatar file)
    updateLeadMutationHook.mutate({
      path: { uuid: leadUuid },
      body: apiPayload,
    });
  };

  const AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
  const AVATAR_ACCEPTED_TYPES = [
    "image/jpeg",
    "image/png",
  ];

  const handleFileChange = (fileItem: FileItem) => {
    const file = fileItem.file;
    if (!file) return;

    if (!AVATAR_ACCEPTED_TYPES.includes(file.type)) {
      setSnackbar({
        isOpen: true,
        message: "Unsupported file format. Please upload JPG, JPEG, or PNG images.",
        status: "error",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > AVATAR_MAX_SIZE_BYTES) {
      setSnackbar({
        isOpen: true,
        message: "Image must be 5MB or smaller.",
        status: "error",
      });
      return;
    }

    setProfilePicture(file);

    const reader = new FileReader();
    reader.onloadend = () => setProfilePreview(reader.result as string);
    reader.readAsDataURL(file);

    setValue("profilePicture", file, { shouldValidate: true });
  };

  const handleRemoveAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setProfilePicture(null);
    setProfilePreview(null);
    setValue("profilePicture", null, { shouldValidate: true });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAvatarClick = () => fileInputRef.current?.click();
  const handleCancel = () => onClose();

  const genderOptions = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Other", label: "Other" },
  ];

  const statusOptions = [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
    { value: "Under Review", label: "Under Review" },
    { value: "Pending", label: "Pending" },
  ];

  const relationOptions = [
    { value: "Daughter/Son", label: "Daughter/Son" },
    { value: "Spouse", label: "Spouse" },
    { value: "Parent", label: "Parent" },
    { value: "Sibling", label: "Sibling" },
    { value: "Guardian", label: "Guardian" },
    { value: "Other", label: "Other" },
  ];

  // const insuranceProviderOptions = [
  //   { value: "Medicaid NH", label: "Medicaid NH" },
  //   { value: "Medicare", label: "Medicare" },
  //   { value: "Private Insurance", label: "Private Insurance" },
  //   { value: "Other", label: "Other" },
  // ];

  const insuranceStatusOptions = [
    { value: "Available", label: "Available" },
    { value: "Not Available", label: "Not Available" },
  ];

  const sectionTitleStyle = {
    fontSize: "16px",
    fontWeight: 600,
    marginBottom: 0,
  };
  const cardSx = {
    border: "1px solid #E6E8EC",
    borderRadius: "12px",
    padding: "16px",
    backgroundColor: "#FFFFFF",
  };

  return (
    <CustomDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      drawerWidth={isMobile ? "100%" : "720px"}
      drawermargin="0"
      drawerPadding="0"
    >
      <Grid
        container
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          backgroundColor: "#FFFFFF",
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
          {/* <CustomLabel
            label="Edit Profile Details"
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#424342",
              fontFamily: "Geist",
              marginBottom: 0,
            }}
          /> */}
          <Typography
            sx={{
              fontSize: "20px",
              lineHeight: 1.2,
              letterSpacing: "0.0075em",
              fontWeight: 600,
              fontFamily: '"Helvetica Neue", Arial, sans-serif',
              color: "#2C2D2C",
            }}
          >
            Edit Profile Details
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

        {/* Body */}
        <Grid
          sx={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          {/* Scrollable Content */}
          <Grid
            component="form"
            size={{ xs: 12 }}
            ref={scrollContainerRef}
            sx={{
              flex: 1,
              overflow: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              paddingBottom: "24px",
              minHeight: 0,
            }}
            onSubmit={handleSubmit(handleFormSubmit, scrollToFirstInvalidField)}
          >
            {/* ===================== Demographics ===================== */}
            <Grid
              size={{ xs: 12 }}
              sx={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <CustomLabel label="Demographics" style={sectionTitleStyle} />

              <Grid sx={cardSx}>
                <Grid container spacing={2}>
                  {/* 1) Profile + First/Last + Referral/Gender */}
                  <Grid size={{ xs: 12 }}>
                    <Grid container spacing={2} alignItems="flex-start">
                      {/* Profile Pic column (UPDATED UI) */}
                      <Grid size={{ xs: 12, md: 3 }}>
                        <Grid
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            alignItems: "flex-start",
                          }}
                        >
                          <CustomLabel label="Profile Pic" />

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
                                  src={profilePreview || undefined}
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
                                  onClick={handleRemoveAvatar}
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
                                  sx={{
                                    width: "24px",
                                    height: "24px",
                                    opacity: 0.6,
                                  }}
                                />
                              </Grid>
                            )}

                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".jpg,.jpeg,.png"
                              style={{ display: "none" }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                handleFileChange({ file } as any);
                              }}
                            />
                          </Grid>
                        </Grid>
                      </Grid>

                      {/* Fields column */}
                      <Grid size={{ xs: 12, md: 9 }}>
                        <Grid container spacing={2}>
                          {/* First/Last */}
                          <Grid size={{ xs: 12, md: 6 }} data-field="firstName">
                            <Controller
                              name="firstName"
                              control={control}
                              render={({ field }) => (
                                <Grid
                                  sx={{
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
                          </Grid>

                          <Grid size={{ xs: 12, md: 6 }} data-field="lastName">
                            <Controller
                              name="lastName"
                              control={control}
                              render={({ field }) => (
                                <Grid
                                  sx={{
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
                          
                          {/* Date of Birth/Gender */}
                          <Grid size={{ xs: 12, md: 6 }} data-field="dateOfBirth">
                            <Controller
                              name="dateOfBirth"
                              control={control}
                              render={({ field, fieldState }) => (
                                <Grid
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "6px",
                                  }}
                                >
                                  <CustomLabel label="Date of Birth" isRequired />
                                  <DatePickerField
                                    name="dateOfBirth"
                                    value={field.value}
                                    onChange={field.onChange}
                                    useCustomStyle={false}
                                    hasError={!!fieldState.error}
                                    errorMessage={fieldState.error?.message}
                                    disableFuture
                                  />
                                </Grid>
                              )}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }} data-field="gender">
                            <Controller
                              name="gender"
                              control={control}
                              render={({ field }) => (
                                <Grid
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "6px",
                                  }}
                                >
                                  <CustomLabel label="Gender" />
                                  <CustomSelect
                                    placeholder="Select Gender"
                                    name="gender"
                                    value={field.value}
                                    onChange={(e) =>
                                      field.onChange(e.target.value)
                                    }
                                    items={genderOptions}
                                    hasError={!!errors.gender}
                                    errorMessage={errors.gender?.message}
                                    enableDeselect
                                  />
                                </Grid>
                              )}
                            />
                          </Grid>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* 2) DOB/Age/Status/Referral Source (separate grid block, 6-6 each) */}
                  <Grid size={{ xs: 12 }}>
                    <Grid container spacing={2}>
                      {/* Contact & Email */}
                      <Grid size={{ xs: 12, md: 6 }} data-field="contactNumber">
                        <Controller
                          name="contactNumber"
                          control={control}
                          render={({ field }) => (
                            <Grid
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                              }}
                            >
                              <CustomLabel label="Phone Number" />
                              <CustomInput
                                placeholder="Enter Phone Number"
                                name="contactNumber"
                                value={field.value || ""}
                                onChange={field.onChange}
                                phone
                                hasError={!!errors.contactNumber}
                                errorMessage={errors.contactNumber?.message}
                              />
                            </Grid>
                          )}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }} data-field="email">
                        <Controller
                          name="email"
                          control={control}
                          render={({ field }) => (
                            <Grid
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                              }}
                            >
                              <CustomLabel label="Email" />
                              <CustomInput
                                placeholder="Enter Email"
                                name="email"
                                value={field.value || ""}
                                onChange={field.onChange}
                                isEmail
                                hasError={!!errors.email}
                                errorMessage={errors.email?.message}
                              />
                            </Grid>
                          )}
                        />
                      </Grid>

                      {/* Referral Source & Referral ID */}
                      <Grid size={{ xs: 12, md: 6 }} data-field="referralSource">
                        <Controller
                          name="referralSource"
                          control={control}
                          render={({ field }) => (
                            <Grid
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                              }}
                            >
                              <CustomLabel label="Referral Source" />
                              <CustomInput
                                placeholder="Enter Referral Source"
                                name="referralSource"
                                value={field.value}
                                onChange={field.onChange}
                                hasError={!!errors.referralSource}
                                errorMessage={errors.referralSource?.message}
                              />
                            </Grid>
                          )}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }} data-field="referralId">
                        <Controller
                          name="referralId"
                          control={control}
                          render={({ field }) => (
                            <Grid
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                              }}
                            >
                              <CustomLabel label="Referral ID" />
                              <CustomInput
                                placeholder="Enter Referral ID"
                                name="referralId"
                                value={field.value}
                                onChange={field.onChange}
                                hasError={!!errors.referralId}
                                errorMessage={errors.referralId?.message}
                                disableField={true}
                              />
                            </Grid>
                          )}
                        />
                      </Grid>

                      {/* Age & Empty Space */}
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Grid
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                          }}
                        >
                          <CustomLabel label="Age" />
                          <CustomInput
                            placeholder="Age"
                            name="age"
                            value={
                              calculatedAge !== null
                                ? calculatedAge.toString()
                                : ""
                            }
                            disableField
                            onChange={(e) => {}}
                          />
                        </Grid>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}></Grid>

                      {/* Street Address */}
                      <Grid size={{ xs: 12, md: 6 }} data-field="streetAddress">
                        <Controller
                          name="streetAddress"
                          control={control}
                          render={({ field }) => (
                            <Grid
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                              }}
                            >
                              <CustomLabel label="Street Address" isRequired />
                              <CustomInput
                                placeholder="Enter Street Address"
                                name="streetAddress"
                                value={field.value || ""}
                                onChange={field.onChange}
                                hasError={!!errors.streetAddress}
                                errorMessage={errors.streetAddress?.message}
                              />
                            </Grid>
                          )}
                        />
                      </Grid>

                      {/* City */}
                      <Grid size={{ xs: 12, md: 6 }} data-field="city">
                        <Controller
                          name="city"
                          control={control}
                          render={({ field }) => (
                            <Grid
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                              }}
                            >
                              <CustomLabel label="City" isRequired />
                              <CustomInput
                                placeholder="Enter City"
                                name="city"
                                value={field.value || ""}
                                onChange={field.onChange}
                                hasError={!!errors.city}
                                errorMessage={errors.city?.message}
                              />
                            </Grid>
                          )}
                        />
                      </Grid>

                      {/* State */}
                      <Grid size={{ xs: 12, md: 6 }} data-field="state">
                        <Controller
                          name="state"
                          control={control}
                          render={({ field, fieldState }) => (
                            <Grid
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                              }}
                            >
                              <CustomLabel label="State" isRequired />
                              <CustomSelect
                                placeholder="Select State"
                                name="state"
                                value={field.value || ""}
                                items={stateOptions.map((s) => ({
                                  value: s.key,
                                  label: s.value,
                                }))}
                                onChange={(e: any) =>
                                  field.onChange(e.target.value)
                                }
                                hasError={!!fieldState.error}
                                errorMessage={fieldState.error?.message}
                                enableDeselect={true}
                              />
                            </Grid>
                          )}
                        />
                      </Grid>

                      {/* ZIP Code */}
                      <Grid size={{ xs: 12, md: 6 }} data-field="zipCode">
                        <Controller
                          name="zipCode"
                          control={control}
                          render={({ field }) => (
                            <Grid
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                              }}
                            >
                              <CustomLabel label="ZIP Code" isRequired />
                              <CustomInput
                                placeholder="Enter ZIP Code"
                                name="zipCode"
                                value={field.value || ""}
                                onChange={field.onChange}
                                zipCode
                                hasError={!!errors.zipCode}
                                errorMessage={errors.zipCode?.message}
                              />
                            </Grid>
                          )}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            {/* ===================== Guardian info ===================== */}
            <Grid
              size={{ xs: 12 }}
              id="guardian-section"
              sx={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <CustomLabel label="Guardian Information" style={sectionTitleStyle} />

              <Grid container spacing={2} sx={cardSx}>
                {/* Guardian Dropdown */}
                <Grid size={{ xs: 12, md: 6 }} data-field="guardianId">
                  <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <CustomLabel label="Guardian" />
                    <Controller
                      name="guardianId"
                      control={control}
                      render={({ field }) => (
                        <CustomSelect
                          placeholder="Select"
                          name="guardianId"
                          value={field.value ?? undefined}
                          onChange={(e) => {
                            field.onChange(e.target.value || null);
                            setShowGuardianAddNew(false);
                            setValue("guardianFirstName", "");
                            setValue("guardianLastName", "");
                            setValue("relation", "");
                            setValue("guardianContactNumber", "");
                            setValue("guardianEmail", "");
                          }}
                          items={guardianOptions}
                          hasError={!!errors.guardianId}
                          errorMessage={errors.guardianId?.message}
                          isDisabled={showGuardianAddNew}
                          enableDeselect={true}
                        />
                      )}
                    />
                  </Box>
                </Grid>

                {/* Not able to find Guardian? Section */}
                <Grid size={{ xs: 12 }}>
                  <Box
                    sx={{
                      border: "2px solid #bed0d6",
                      borderRadius: "8px",
                      backgroundColor: "#F6F8FB",
                      p: 1.2,
                      mt: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: showGuardianAddNew ? 2 : 0,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: "#5e605e", fontSize: "16px" }}
                      >
                        Not able to find Guardian?
                      </Typography>
                      <CustomButton
                        variant="secondary"
                        size="sm"
                        icon={<AddIcon />}
                        iconPosition="left"
                        disabled={showGuardianAddNew || !!selectedGuardianId}
                        onClick={() => {
                          setShowGuardianAddNew(true);
                          setValue("guardianId", null);
                        }}
                      >
                        Add New
                      </CustomButton>
                    </Box>

                    {showGuardianAddNew && (
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }} data-field="guardianFirstName">
                          <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <CustomLabel label="First Name" isRequired />
                            <Controller
                              name="guardianFirstName"
                              control={control}
                              render={({ field }) => (
                                <CustomInput
                                  placeholder="Enter First Name"
                                  name="guardianFirstName"
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  hasError={!!errors.guardianFirstName}
                                  errorMessage={errors.guardianFirstName?.message}
                                  required
                                />
                              )}
                            />
                          </Box>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }} data-field="guardianLastName">
                          <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <CustomLabel label="Last Name" isRequired />
                            <Controller
                              name="guardianLastName"
                              control={control}
                              render={({ field }) => (
                                <CustomInput
                                  placeholder="Enter Last Name"
                                  name="guardianLastName"
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  hasError={!!errors.guardianLastName}
                                  errorMessage={errors.guardianLastName?.message}
                                />
                              )}
                            />
                          </Box>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }} data-field="relation">
                          <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <CustomLabel label="Relation" />
                            <Controller
                              name="relation"
                              control={control}
                              render={({ field }) => (
                                <CustomSelect
                                  placeholder="Select"
                                  name="relation"
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(e.target.value)}
                                  items={relationOptions}
                                  hasError={!!errors.relation}
                                  errorMessage={errors.relation?.message}
                                  isDisabled={false}
                                  bgWhite={true}
                                  enableDeselect={true}
                                />
                              )}
                            />
                          </Box>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }} data-field="guardianContactNumber">
                          <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <CustomLabel label="Phone Number" isRequired />
                            <Controller
                              name="guardianContactNumber"
                              control={control}
                              render={({ field }) => (
                                <CustomInput
                                  placeholder="Enter Phone Number"
                                  name="guardianContactNumber"
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  phone
                                  hasError={!!errors.guardianContactNumber}
                                  errorMessage={errors.guardianContactNumber?.message}
                                  required
                                />
                              )}
                            />
                          </Box>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }} data-field="guardianEmail">
                          <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <CustomLabel label="Email" isRequired />
                            <Controller
                              name="guardianEmail"
                              control={control}
                              render={({ field }) => (
                                <CustomInput
                                  placeholder="Enter Email"
                                  name="guardianEmail"
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  isEmail
                                  hasError={!!errors.guardianEmail}
                                  errorMessage={errors.guardianEmail?.message}
                                  required
                                />
                              )}
                            />
                          </Box>
                        </Grid>

                        <Grid
                          size={{ xs: 12 }}
                          sx={{
                            display: "flex",
                            gap: 2,
                            justifyContent: "flex-end",
                            mt: 1,
                          }}
                        >
                          <CustomButton
                            variant="secondary"
                            size="md"
                            onClick={() => {
                              setShowGuardianAddNew(false);
                              setValue("guardianFirstName", "");
                              setValue("guardianLastName", "");
                              setValue("relation", "");
                              setValue("guardianContactNumber", "");
                              setValue("guardianEmail", "");
                              clearErrors([
                                "guardianFirstName",
                                "guardianLastName",
                                "relation",
                                "guardianContactNumber",
                                "guardianEmail",
                              ]);
                            }}
                          >
                            Cancel
                          </CustomButton>
                        </Grid>
                      </Grid>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Grid>

            {/* ===================== Service Manager Information ===================== */}
            <Grid
              size={{ xs: 12 }}
              id="agent-section"
              sx={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <CustomLabel
                label="Area Agency Information"
                style={sectionTitleStyle}
              />

              <Grid container spacing={2} sx={cardSx}>
                {/* Service Manager Dropdown */}
                <Grid size={{ xs: 12, md: 6 }} data-field="serviceManagerId">
                  <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <CustomLabel label="Area Agency" />
                    <Controller
                      name="serviceManagerId"
                      control={control}
                      render={({ field }) => (
                        <CustomSelect
                          placeholder="Select"
                          name="serviceManagerId"
                          value={field.value ?? undefined}
                          onChange={(e) => {
                            field.onChange(e.target.value || null);
                            setShowServiceManagerAddNew(false);
                            setValue("serviceManagerFirstName", "");
                            setValue("serviceManagerLastName", "");
                            setValue("serviceManagerContactNumber", "");
                            setValue("serviceManagerEmail", "");
                          }}
                          items={serviceManagerOptions}
                          hasError={!!errors.serviceManagerId}
                          errorMessage={errors.serviceManagerId?.message}
                          isDisabled={showServiceManagerAddNew}
                          enableDeselect={true}
                        />
                      )}
                    />
                  </Box>
                </Grid>

                {/* Not able to find Service Manager? Section */}
                <Grid size={{ xs: 12 }}>
                  <Box
                    sx={{
                      border: "2px solid #bed0d6",
                      borderRadius: "8px",
                      backgroundColor: "#F6F8FB",
                      p: 1.2,
                      mt: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: showServiceManagerAddNew ? 2 : 0,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: "#5a5a5a", fontSize: "16px" }}
                      >
                        Not able to find Area Agency?
                      </Typography>
                      <CustomButton
                        variant="secondary"
                        size="sm"
                        icon={<AddIcon />}
                        iconPosition="left"
                        disabled={showServiceManagerAddNew || !!selectedServiceManagerId}
                        onClick={() => {
                          setShowServiceManagerAddNew(true);
                          setValue("serviceManagerId", null);
                        }}
                      >
                        Add New
                      </CustomButton>
                    </Box>

                    {showServiceManagerAddNew && (
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }} data-field="serviceManagerFirstName">
                          <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <CustomLabel label="First Name" isRequired />
                            <Controller
                              name="serviceManagerFirstName"
                              control={control}
                              render={({ field }) => (
                                <CustomInput
                                  placeholder="Enter First Name"
                                  name="serviceManagerFirstName"
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  hasError={!!errors.serviceManagerFirstName}
                                  errorMessage={errors.serviceManagerFirstName?.message}
                                  required
                                />
                              )}
                            />
                          </Box>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }} data-field="serviceManagerLastName">
                          <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <CustomLabel label="Last Name" isRequired />
                            <Controller
                              name="serviceManagerLastName"
                              control={control}
                              render={({ field }) => (
                                <CustomInput
                                  placeholder="Enter Last Name"
                                  name="serviceManagerLastName"
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  hasError={!!errors.serviceManagerLastName}
                                  errorMessage={errors.serviceManagerLastName?.message}
                                  required
                                />
                              )}
                            />
                          </Box>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }} data-field="serviceManagerEmail">
                          <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <CustomLabel label="Email" isRequired />
                            <Controller
                              name="serviceManagerEmail"
                              control={control}
                              render={({ field }) => (
                                <CustomInput
                                  placeholder="Enter Email"
                                  name="serviceManagerEmail"
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  isEmail
                                  hasError={!!errors.serviceManagerEmail}
                                  errorMessage={errors.serviceManagerEmail?.message}
                                  required
                                />
                              )}
                            />
                          </Box>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }} data-field="serviceManagerContactNumber">
                          <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <CustomLabel label="Phone Number" isRequired />
                            <Controller
                              name="serviceManagerContactNumber"
                              control={control}
                              render={({ field }) => (
                                <CustomInput
                                  placeholder="Enter Phone Number"
                                  name="serviceManagerContactNumber"
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  phone
                                  hasError={!!errors.serviceManagerContactNumber}
                                  errorMessage={errors.serviceManagerContactNumber?.message}
                                  required
                                />
                              )}
                            />
                          </Box>
                        </Grid>

                        <Grid
                          size={{ xs: 12 }}
                          sx={{
                            display: "flex",
                            gap: 2,
                            justifyContent: "flex-end",
                            mt: 1,
                          }}
                        >
                          <CustomButton
                            variant="secondary"
                            size="md"
                            onClick={() => {
                              setShowServiceManagerAddNew(false);
                              setValue("serviceManagerFirstName", "");
                              setValue("serviceManagerLastName", "");
                              setValue("serviceManagerContactNumber", "");
                              setValue("serviceManagerEmail", "");
                              clearErrors([
                                "serviceManagerFirstName",
                                "serviceManagerLastName",
                                "serviceManagerContactNumber",
                                "serviceManagerEmail",
                              ]);
                            }}
                          >
                            Cancel
                          </CustomButton>
                        </Grid>
                      </Grid>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Grid>

            {/* ===================== Insurance Details ===================== */}
            <Grid
              size={{ xs: 12 }}
              sx={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <CustomLabel
                label="Insurance Details"
                style={sectionTitleStyle}
              />

              <Grid container spacing={2} sx={cardSx}>
                <Grid size={{ xs: 12, md: 6 }} data-field="insuranceProvider">
                  <Controller
                    name="insuranceProvider"
                    control={control}
                    render={({ field }) => (
                      <Grid
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        <CustomLabel label="Insurance Provider" isRequired/>
                        <CustomInput
                          placeholder="Enter Insurance Provider"
                          name="insuranceProvider"
                          value={field.value}
                          onChange={field.onChange}
                          hasError={!!errors.insuranceProvider}
                          errorMessage={errors.insuranceProvider?.message}
                        />
                      </Grid>
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }} data-field="policyNumber">
                  <Controller
                    name="policyNumber"
                    control={control}
                    render={({ field }) => (
                      <Grid
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        <CustomLabel label="Policy Number" isRequired/>
                        <CustomInput
                          placeholder="Enter Policy Number"
                          name="policyNumber"
                          value={field.value}
                          onChange={field.onChange}
                          hasError={!!errors.policyNumber}
                          errorMessage={errors.policyNumber?.message}
                        />
                      </Grid>
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12 }} data-field="insuranceStatus">
                  <Controller
                    name="insuranceStatus"
                    control={control}
                    render={({ field }) => (
                      <Grid
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        <CustomLabel label="Insurance Status" isRequired/>
                        <CustomSelect
                          placeholder="Select Insurance Status"
                          name="insuranceStatus"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          items={insuranceStatusOptions}
                          hasError={!!errors.insuranceStatus}
                          errorMessage={errors.insuranceStatus?.message}
                          enableDeselect
                        />
                      </Grid>
                    )}
                  />
                </Grid>
                
              </Grid>
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
            <CustomButton
              variant="secondary"
              size="md"
              onClick={handleCancel}
              disabled={isSaving || updateLeadMutationHook.isPending}
            >
              Cancel
            </CustomButton>

            <CustomButton
              variant="primary"
              size="md"
              onClick={handleSubmit(handleFormSubmit, scrollToFirstInvalidField)}
              disabled={
                isSaving || updateLeadMutationHook.isPending || isSubmitting
              }
            >
              {isSaving || updateLeadMutationHook.isPending || isSubmitting
                ? "Saving..."
                : "Save"}
            </CustomButton>
          </Grid>
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
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
    </CustomDrawer>
  );
};

export default EditProfileDetailsDrawer;
