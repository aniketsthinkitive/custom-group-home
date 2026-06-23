import { Controller, useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Typography,
  Grid,
  type SelectChangeEvent,
  Stack,
  GlobalStyles,
  IconButton,
  Box,
  CircularProgress,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import Delete from "@mui/icons-material/Delete";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

// Custom components
import CustomDrawer from "../../../components/custom-drawer/custom-drawer";
import CustomLabel from "../../../components/custom-label/custom-label";
import CustomInput from "../../../components/custom-input/custom-input";
import CustomFileUpload, {
  type FileItem,
} from "../../../components/custom-fileupload/custom-fileupload";
import CustomButton from "../../../components/custom-buttons/custom-buttons";
import DatePickerField from "../../../components/date-picker-field/date-picker-field";
import CommonSnackbar from "../../../components/common-snackbar/common-snackbar";
import CustomSelect from "../../../components/custom-select/custom-select";
import CustomCheckbox from "../../../components/custom-checkbox/custom-checkbox";

// Select styles
// import { selectInputStyle } from "../../../components/custom-select/widgets/custom-select-widgets";

// Constants
import { stateOptions } from "../../../constant/stateOptions";
import { countryCodes } from "../../../constant/countryCodes";
import { timezoneLabels } from "../../../constant/timezoneOptions";
import { defaultValues } from "../../../constant/mockdata/addGroupHomeDrawer";

import { useLayoutEffect, useRef, useState, useCallback, useMemo, useEffect } from "react";
import { useMediaUpload } from "../../../hooks/useMediaUpload";

export type FormState = {
  groupHomeName: string;
  timeZone: string;
  contactNumber: string;
  faxNumber: string;
  emailId: string;
  licenseNumber: string;
  emergencyContactNumber: string;
  licenseStartDate: Dayjs | null;
  licenseExpiryDate: Dayjs | null;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  numberOfRooms: string;
  certificateFiles: FileItem[];
  certificateMediaIds: string[];
  shifts: {
    morning: {
      enabled: boolean;
      from: string;
      fromAmPm: "AM" | "PM";
      to: string;
      toAmPm: "AM" | "PM";
    };
    evening: {
      enabled: boolean;
      from: string;
      fromAmPm: "AM" | "PM";
      to: string;
      toAmPm: "AM" | "PM";
    };
    night: {
      enabled: boolean;
      from: string;
      fromAmPm: "AM" | "PM";
      to: string;
      toAmPm: "AM" | "PM";
    };
  };
  groupHomeImageFiles: FileItem[];
  /** Media UUID returned after uploading the group home image to S3 via presigned URL.
   *  null = image was actively removed, undefined = no change */
  imageMediaId?: string | null;
};

export type InitialMediaItem = {
  id: string;
  name?: string;
  original_filename?: string;
};

// Memoize select options to prevent recreation on every render
const STATE_OPTIONS = stateOptions.map((s) => ({
  value: s.key,
  label: s.value,
}));

const COUNTRY_OPTIONS = countryCodes.map((c) => ({
  value: c.name,
  label: c.name,
}));

const TIMEZONE_OPTIONS = timezoneLabels.map((tz) => ({
  value: tz.value,
  label: tz.label,
}));

const validationSchema = yup.object({
  groupHomeName: yup
    .string()
    .required("Group Home Name is required")
    .min(3, "Group Home Name must be at least 3 characters")
    .max(40, "Group Home Name must be at most 40 characters"),
  timeZone: yup.string().required("Time zone is required"),
  contactNumber: yup
    .string()
    .required("Phone Number is required")
    .matches(/^\d{10}$/, "Enter a valid 10-digit number"),
  faxNumber: yup
    .string()
    .required("Fax Number is required")
    .matches(/^\d{10}$/, "Enter a valid 10-digit number"),
  emailId: yup
    .string()
    .nullable()
    .test(
      "email-format",
      "Please enter a valid email address",
      function (value) {
        if (!value || value.trim() === "") return true; // Allow null/empty
        // Check for both @ and . characters
        return value.includes("@") && value.includes(".");
      },
    ),
  licenseNumber: yup
    .string()
    .test(
      "license-length",
      "License number must be between 6 and 14 characters",
      function (value) {
        if (!value || value.trim() === "") return true; // Allow empty
        const trimmed = value.trim();
        return trimmed.length >= 6 && trimmed.length <= 14;
      },
    ),
  emergencyContactNumber: yup
    .string()
    .test(
      "phone-length",
      "Emergency phone number must be 10 digits",
      function (value) {
        if (!value || value.trim() === "") return true; // Allow null/empty
        // Remove all non-digit characters and check length
        const digitsOnly = value.replace(/\D/g, "");
        return digitsOnly.length === 10;
      },
    ),
  addressLine1: yup.string().required("Address Line 1 is required"),
  city: yup.string().required("City is required"),
  state: yup.string().required("State is required"),
  zipCode: yup
      .string()
      .required("ZIP code is required")
      .test("zip-length", "ZIP code must be in 5 to 9 digits", function (value) {
        if (!value || value.trim() === "") return true;
        const digitsOnly = value.replace(/\D/g, "");
        return digitsOnly.length >= 5 && digitsOnly.length <= 9;
      }),
  country: yup.string().required("Country is required"),
  // emergencyContactNumber: yup
  //   .string()
  //   .required("Emergency Phone Number is required")
  //   .matches(/^\d{10}$/, "Enter a valid 10-digit number"),
  numberOfRooms: yup
    .string()
    .required("Number of rooms is required")
    .matches(/^\d+$/, "Enter a valid number")
    .test(
      "greater-than-zero",
      "Number of rooms must be greater than 0",
      (value) => {
        if (value == null || value === "") return true;
        const n = parseInt(value, 10);
        return !Number.isNaN(n) && n > 0;
      },
    ),

  licenseExpiryDate: yup
    .mixed()
    .nullable()
    .test(
      "expiry-after-start",
      "Expiry date cannot be before start date",
      function (value) {
        const { licenseStartDate } = this.parent;
        if (!value || !licenseStartDate) return true;
        try {
          const expiry = dayjs(value as Dayjs | string);
          const start = dayjs(licenseStartDate as Dayjs | string);
          return expiry.isAfter(start) || expiry.isSame(start, "day");
        } catch {
          return true;
        }
      },
    ),

  // Conditional validation for shifts - if enabled, from and to are required
  shifts: yup.object({
    morning: yup.object({
      enabled: yup.boolean(),
      from: yup
        .string()
        .test(
          "morning-from-required",
          "From time is required for Morning shift",
          function (value) {
            const { enabled } = this.parent;
            if (enabled && !value) return false;
            return true;
          },
        ),
      fromAmPm: yup.string(),
      to: yup
        .string()
        .test(
          "morning-to-required",
          "To time is required for Morning shift",
          function (value) {
            const { enabled } = this.parent;
            if (enabled && !value) return false;
            return true;
          },
        ),
      toAmPm: yup.string(),
    }),
    evening: yup.object({
      enabled: yup.boolean(),
      from: yup
        .string()
        .test(
          "evening-from-required",
          "From time is required for Evening shift",
          function (value) {
            const { enabled } = this.parent;
            if (enabled && !value) return false;
            return true;
          },
        ),
      fromAmPm: yup.string(),
      to: yup
        .string()
        .test(
          "evening-to-required",
          "To time is required for Evening shift",
          function (value) {
            const { enabled } = this.parent;
            if (enabled && !value) return false;
            return true;
          },
        ),
      toAmPm: yup.string(),
    }),
    night: yup.object({
      enabled: yup.boolean(),
      from: yup
        .string()
        .test(
          "night-from-required",
          "From time is required for Night shift",
          function (value) {
            const { enabled } = this.parent;
            if (enabled && !value) return false;
            return true;
          },
        ),
      fromAmPm: yup.string(),
      to: yup
        .string()
        .test(
          "night-to-required",
          "To time is required for Night shift",
          function (value) {
            const { enabled } = this.parent;
            if (enabled && !value) return false;
            return true;
          },
        ),
      toAmPm: yup.string(),
    }),
  }),
});

type FormData = FormState;

const convertTo12Hour = (
  time24: string,
): { time: string; amPm: "AM" | "PM" } => {
  if (!time24) return { time: "", amPm: "AM" };
  const [hours, minutes] = time24.split(":").map(Number);
  const amPm = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return {
    time: `${hours12.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`,
    amPm,
  };
};

const convertTo24Hour = (time12: string, amPm: "AM" | "PM"): string => {
  if (!time12) return "";
  const [hours, minutes] = time12.split(":").map(Number);
  let hours24 = hours;
  if (amPm === "PM" && hours !== 12) hours24 = hours + 12;
  if (amPm === "AM" && hours === 12) hours24 = 0;
  return `${hours24.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
};

const sectionTitleSx = {
  fontSize: "14px", // was 16px
  fontWeight: 500, // was 600
  color: "#2C2D2C",
  lineHeight: "20px",
};

const cardSx = {
  border: "1px solid #E6E9E6",
  borderRadius: "8px",
  padding: "16px",
  backgroundColor: "#FFFFFF",
};

const fileListRowSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 12px",
  backgroundColor: "#F8F9F8",
  border: "1px solid #E8EBE8",
  borderRadius: "4px",
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export interface AddGroupHomeDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  isLoading?: boolean;
  formname: string;
  initialImageUrl?: string | null;
  initialMedia?: InitialMediaItem[];
  initialData?: Partial<FormState>;
  onError?: (message: string) => void;
}

export default function AddGroupHomeDrawer(props: AddGroupHomeDrawerProps) {
  const {
    open,
    onClose,
    onSave,
    isLoading = false,
    formname,
    initialImageUrl,
    initialMedia = [],
  } = props;

  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
    status: "success" | "error";
  }>({
    isOpen: false,
    message: "",
    status: "success",
  });

  // S3 presigned URL upload hook for group home profile image & certificates
  const { upload: uploadMedia, uploadMultiple, isUploading: isMediaUploading } = useMediaUpload({
    contentTypeApp: "group_home",
    contentTypeModel: "grouphome",
  });

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    trigger,
    formState,
    watch,
  } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- yup schema type doesn't exactly match FormState
    resolver: yupResolver(validationSchema) as any,
    defaultValues,
    mode: "all",           // validate on change + blur + submit so errors show immediately
    reValidateMode: "onChange", // re-validate instantly after first error is shown
  });

  const groupHomeImageUrlRef = useRef<string | null>(null);
  const prevFileRef = useRef<File | null>(null);
  const prevOpenRef = useRef(false);
  const hasResetFormRef = useRef(false);
  const prevInitialDataRef = useRef<Partial<FormState> | undefined>(undefined);

  // Memoize initial form values based on initialData
  const initialFormValues = useMemo(() => {
    if (!props.initialData) {
      // Add mode → empty form
      return {
        ...defaultValues,
        country: "United States",
        shifts: {
          morning: { enabled: false, from: "", fromAmPm: "AM" as const, to: "", toAmPm: "AM" as const },
          evening: { enabled: false, from: "", fromAmPm: "AM" as const, to: "", toAmPm: "AM" as const },
          night: { enabled: false, from: "", fromAmPm: "AM" as const, to: "", toAmPm: "AM" as const },
        },
      };
    }
    // Edit mode → prefill
    const initialFormData = { ...defaultValues, ...props.initialData };
    if (!initialFormData.country) {
      initialFormData.country = "United States";
    }
    return initialFormData;
  }, [props.initialData]);

  // Reset form when drawer opens or when initialData changes (for async loading)
  // Using useLayoutEffect for synchronous execution to ensure form is ready before render
  useLayoutEffect(() => {
    const didOpen = open && !prevOpenRef.current;
    const didClose = !open && prevOpenRef.current;
    const initialDataChanged = props.initialData !== prevInitialDataRef.current;

    // When drawer closes, reset all refs
    if (didClose) {
      hasResetFormRef.current = false;
      prevInitialDataRef.current = undefined;
      prevOpenRef.current = false;
      return;
    }

    prevOpenRef.current = open;

    if (!open) {
      return;
    }

    // Reset form when drawer opens OR when initialData changes (handles switching from add to edit mode)
    // Also reset if initialData changes from undefined to defined (async loading)
    const shouldReset = didOpen ||
      initialDataChanged ||
      (props.initialData !== undefined && prevInitialDataRef.current === undefined);

    if (shouldReset) {
      reset(initialFormValues, {
        keepDefaultValues: false,
        keepValues: false,
      });
      hasResetFormRef.current = true;
      imageRemovedRef.current = false;
      prevInitialDataRef.current = props.initialData;
      // Ensure certificateMediaIds are set if they exist in initialData
      if (props.initialData?.certificateMediaIds) {
        setTimeout(() => {
          setValue("certificateMediaIds", props.initialData!.certificateMediaIds!);
        }, 0);
      }
      // Trigger validation for country field after reset
      setTimeout(() => trigger("country"), 0);
    }
  }, [open, props.initialData, initialFormValues, reset, trigger, setValue]);

  // Optimize watch calls - use useWatch for better reactivity
  const groupHomeImageFiles = useWatch({ control, name: "groupHomeImageFiles" });
  const groupHomeImageFile = useMemo(() => groupHomeImageFiles?.[0]?.file, [groupHomeImageFiles]);

  // Use useWatch for certificate files to ensure proper reactivity
  // Use defaultValue to ensure initial values are picked up correctly
  const certificateMediaIds = useWatch({
    control,
    name: "certificateMediaIds",
    defaultValue: props.initialData?.certificateMediaIds || []
  }) || [];
  const certificateFiles = useWatch({
    control,
    name: "certificateFiles",
    defaultValue: []
  }) || [];

  // Memoize shift enabled states to avoid multiple watches
  const morningEnabled = useWatch({ control, name: "shifts.morning.enabled" });
  const eveningEnabled = useWatch({ control, name: "shifts.evening.enabled" });
  const nightEnabled = useWatch({ control, name: "shifts.night.enabled" });

  const licenseStartDateValue = useWatch({ control, name: "licenseStartDate" });
  const licenseStartDateMin = licenseStartDateValue ? dayjs(licenseStartDateValue) : undefined;

  // State for image preview URL to ensure UI updates immediately
  const [groupHomeImagePreviewUrl, setGroupHomeImagePreviewUrl] = useState<string | null>(null);
  // Track explicit image removal so the useLayoutEffect doesn't restore the preview
  const imageRemovedRef = useRef(false);
  // Local submitting state — stable across the full upload+save flow (avoids flickering)
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When parent's isLoading prop transitions from true to false, reset local isSubmitting.
  // This handles the case where an API mutation fails in the parent and the drawer stays open.
  const prevIsLoadingRef = useRef(isLoading);
  useEffect(() => {
    if (prevIsLoadingRef.current && !isLoading && isSubmitting) {
      setIsSubmitting(false);
    }
    prevIsLoadingRef.current = isLoading;
  }, [isLoading, isSubmitting]);

  // Inline validation message shown next to the certificate document list
  // (persistent, unlike a toast/dialog — clears on the next valid change)
  const [certificateError, setCertificateError] = useState<string | null>(null);

  // Handle initial image URL when drawer opens (file uploads are handled in onChange handler)
  // eslint-disable-next-line react-compiler/react-compiler -- setState needed to sync initial image URL
  useLayoutEffect(() => {
    // Skip restoring preview if the user explicitly removed the image
    if (imageRemovedRef.current) return;
    // Only set initial image URL if no file is selected and drawer is open
    if (!groupHomeImageFile && initialImageUrl && open) {
      setGroupHomeImagePreviewUrl(initialImageUrl);
    } else if (!groupHomeImageFile && !initialImageUrl) {
      setGroupHomeImagePreviewUrl(null);
    }
  }, [initialImageUrl, open, groupHomeImageFile]);

  // Cleanup blob URLs on unmount
  useLayoutEffect(() => {
    return () => {
      const blobUrl = groupHomeImageUrlRef.current;
      if (blobUrl && blobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(blobUrl);
        groupHomeImageUrlRef.current = null;
      }
      prevFileRef.current = null;
    };
  }, []);

  // Allowed MIME types for certificates
  const ALLOWED_CERT_TYPES = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
  ];
  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
  const MAX_CERT_FILES = 10;

  // Handle file changes (additions/removals). Certificates are uploaded only on Submit (in parent), not on add.
  const handleCertificateFilesChange = useCallback((
    newFiles: FileItem[],
    onChange: (files: FileItem[]) => void,
  ) => {
    const currentFiles = getValues("certificateFiles") || [];
    const currentMediaIds = getValues("certificateMediaIds") || [];

    // Look for file format errors from CustomFileUpload
    const unsupported = newFiles.find((f) => f.error === "File type not allowed");
    if (unsupported) {
      setCertificateError(
        "Unsupported file format. Please upload PDF, PNG, JPG, or JPEG files.",
      );
      return;
    }

    const oversize = newFiles.find((f) => f.file && f.file.size > MAX_FILE_SIZE_BYTES);
    if (oversize) {
      setCertificateError(
        `"${oversize.name}" is too large. Maximum file size is 10 MB.`,
      );
      return;
    }

    // Valid change — clear any previous validation message
    setCertificateError(null);

    // Handle removals: sync certificateMediaIds when user removes a file that was already linked
    const removedFiles = currentFiles.filter(
      (cf) => !newFiles.find((nf) => nf.id === cf.id),
    );
    if (removedFiles.length > 0) {
      const removedIds = removedFiles.map((f) => f.id);
      const updatedMediaIds = currentMediaIds.filter(
        (id) => !removedIds.includes(id),
      );
      setValue("certificateMediaIds", updatedMediaIds);
    }

    onChange(newFiles);
  }, [getValues, setValue]);

  const resetAndClose = useCallback(() => {
    if (groupHomeImageUrlRef.current && groupHomeImageUrlRef.current.startsWith("blob:")) {
      URL.revokeObjectURL(groupHomeImageUrlRef.current);
      groupHomeImageUrlRef.current = null;
    }
    hasResetFormRef.current = false;
    prevInitialDataRef.current = undefined;
    setCertificateError(null);
    setIsSubmitting(false);
    reset(defaultValues);
    onClose();
  }, [reset, onClose]);

  const handleRemoveGroupHomeImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Clear the preview URL
    if (groupHomeImageUrlRef.current && groupHomeImageUrlRef.current.startsWith("blob:")) {
      URL.revokeObjectURL(groupHomeImageUrlRef.current);
    }
    groupHomeImageUrlRef.current = null;
    prevFileRef.current = null;
    imageRemovedRef.current = true;
    setGroupHomeImagePreviewUrl(null);
    // Reset the form field
    setValue("groupHomeImageFiles", []);
  }, [setValue]);

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

  const onSubmit = useCallback(async (data: FormData) => {
    setIsSubmitting(true);
    try {
      let imageMediaId: string | null | undefined;

      // 1. Upload group home image to S3 via presigned URL if a new file is selected
      const imageFile = data.groupHomeImageFiles?.[0]?.file;
      if (imageFile) {
        const result = await uploadMedia(imageFile, {
          altText: "group_home_profile",
        });
        imageMediaId = result.id;
      } else if (imageRemovedRef.current) {
        // Image was actively removed by the user (ref is always current, no stale closure)
        imageMediaId = null;
      }

      // 2. Upload new certificate files to S3 via presigned URL
      const newCertFiles = (data.certificateFiles || []).filter((f) => f?.file);
      let updatedCertificateMediaIds = [...(data.certificateMediaIds || [])];

      if (newCertFiles.length > 0) {
        const files = newCertFiles.map((f) => f.file!);
        const results = await uploadMultiple(files);
        const newMediaIds = results.map((r) => r.id).filter(Boolean);
        updatedCertificateMediaIds = [...updatedCertificateMediaIds, ...newMediaIds];
      }

      // Pass form data with imageMediaId and updated certificateMediaIds to parent
      onSave({
        ...data,
        imageMediaId,
        certificateMediaIds: updatedCertificateMediaIds,
        certificateFiles: [], // Files already uploaded — clear so parent doesn't re-upload
      });
    } catch (err) {
      console.error("Media upload failed:", err);
      setIsSubmitting(false);
      if (props.onError) {
        const ax = err as { response?: { data?: { error?: string; message?: string } }; message?: string };
        const msg = ax?.response?.data?.error ?? ax?.response?.data?.message ?? ax?.message ?? "Failed to upload files. Please try again.";
        props.onError(typeof msg === "string" ? msg : "Failed to upload files. Please try again.");
      }
    }
  }, [onSave, uploadMedia, uploadMultiple, props.onError]);
  const shiftRowSx = {
    width: "100%",
    minWidth: 0,
    alignItems: { xs: "flex-start", sm: "center" },
    display: "flex",
    flexWrap: { xs: "wrap", sm: "nowrap" },
    gap: { xs: "12px", sm: "18px" },
    padding: "8px 0",
  };

  const shiftLabelSx = {
    width: "70px",
    fontSize: "14px",
    fontWeight: 400,
    color: "#2C2D2C",
    lineHeight: "20px",
  };

  const smallTextSx = {
    width: "35px",
    fontSize: "12px",
    color: "#5C5F5C",
    fontWeight: 400,
    lineHeight: "20px",
  };

  const timeBoxSx = {
    width: { xs: "100%", sm: "180px" },
    minWidth: { xs: "100%", sm: "180px" },
    flexShrink: 0,
  };

  // MUI TimePicker styles to match custom input
  const timePickerStyles = (hasError: boolean) => ({
    "& .MuiInputBase-input": {
      fontSize: "16px",
      padding: "8px 12px",
      borderRadius: "6px",
      color: "#2C2D2C",
      backgroundColor: "transparent",
      border: "none",
      outline: "none !important",
      "&:focus": {
        outline: "none !important",
      },
    },
    "& .MuiOutlinedInput-root": {
      borderRadius: "6px",
      minHeight: "36px",
      height: "45px",
      backgroundColor: "#FFFFFF",
      border: hasError ? "1px solid #D32F2F" : "1px solid #DDE0DD",
      borderWidth: "1px !important",
      boxShadow: "none",
      outline: "none !important",
      "&:hover": {
        borderColor: hasError ? "#D32F2F" : "#CDD0CD",
        borderWidth: "1px !important",
      },
      "&.Mui-focused": {
        borderColor: hasError ? "#D32F2F" : "#DDE0DD",
        borderWidth: "1px !important",
        boxShadow: "none",
        outline: "none !important",
      },
      "& fieldset": {
        border: "none !important",
        borderWidth: "0 !important",
      },
    },
    "& .MuiPickersInputBase-root": {
      height: "45px",
      borderRadius: "6px",
      backgroundColor: "#FFFFFF",
      border: hasError ? "1px solid #D32F2F" : "1px solid #DDE0DD",
      borderWidth: "1px !important",
      boxShadow: "none",
      outline: "none !important",
      "&:hover": {
        borderColor: hasError ? "#D32F2F" : "#CDD0CD",
        borderWidth: "1px !important",
      },
      "&.Mui-focused": {
        borderColor: hasError ? "#D32F2F" : "#DDE0DD",
        borderWidth: "1px !important",
        boxShadow: "none",
        outline: "none !important",
      },
      "& fieldset": {
        border: "none !important",
        borderWidth: "0 !important",
      },
    },
    // Ensure TimePicker popup appears above drawer
    "& + .MuiPickersPopper-root": {
      zIndex: "99999 !important",
    },
  });

  return (
    <>
      <GlobalStyles
        styles={{
          ".MuiPickersPopper-root": {
            zIndex: "99999 !important",
          },
          ".MuiPickersPopper-root .MuiPaper-root": {
            zIndex: "99999 !important",
          },
          '[role="dialog"].MuiPickersPopper-root': {
            zIndex: "99999 !important",
          },
          ".MuiPickersPopper-root .MuiDialog-root": {
            zIndex: "99999 !important",
          },
          ".MuiPickersPopper-root .MuiPickersLayout-root": {
            zIndex: "99999 !important",
          },
          ".MuiPickersPopper-root .MuiPickersCalendarHeader-root": {
            zIndex: "99999 !important",
          },
          'div[role="dialog"][class*="MuiPickers"]': {
            zIndex: "99999 !important",
          },
          "[data-popper-placement]": {
            zIndex: "99999 !important",
          },
          '.MuiPopper-root[class*="MuiPickers"]': {
            zIndex: "99999 !important",
          },
        }}
      />
      <CustomDrawer
        anchor="right"
        open={open}
        onClose={resetAndClose}
        title={formname}
        drawerWidth="700px"
        drawerPadding="16px" // 🔥 reduces left & right
      >
        <Box component="form" onSubmit={handleSubmit(onSubmit, scrollToFirstError)} sx={{ height: "100%" }}>
          {/* IMPORTANT: CustomDrawer already provides the main scroll container.
            So we keep content normal and make footer sticky inside that scroll area. */}
          <Grid container sx={{ padding: 0, width: "100%", minWidth: 0 }}>
            <Grid
              container
              sx={{
                padding: 0,
                width: "100%",
                minWidth: 0,
                paddingBottom: "20px",
              }}
            >
              {/* ===================== Basic Details ===================== */}
              <Grid
                container
                sx={{ marginBottom: "24px", width: "100%", minWidth: 0 }}
              >
                <Grid size={{ xs: 12 }} sx={{ minWidth: 0 }}>
                  <Typography sx={{ ...sectionTitleSx, marginBottom: "8px" }}>
                    Basic Details
                  </Typography>

                  <Grid
                    container
                    sx={{
                      ...cardSx,
                      width: "100%",
                      minWidth: 0,
                      padding: "16px",
                    }}
                  >
                    <Grid
                      container
                      sx={{
                        width: "100%",
                        minWidth: 0,
                        alignItems: "flex-start",
                      }}
                      flexDirection={{
                        xs: "column",
                        sm: "row",
                        md: "row",
                        lg: "row",
                      }}
                      spacing={2}
                    >
                      <Grid
                        size={{ xs: 12, sm: 3, md: 3, lg: 3 }}
                        sx={{
                          minWidth: 0,
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                          flexShrink: 0,
                        }}
                      >
                        <CustomLabel label="Group Home Image" />
                        <Controller
                          name="groupHomeImageFiles"
                          control={control}
                          render={({ field }) => (
                            <Box
                              onClick={() => {
                                const input = document.createElement("input");
                                input.type = "file";
                                input.accept = ".jpg,.jpeg,.png";
                                input.onchange = (e: Event) => {
                                  const target = e.target as HTMLInputElement;
                                  if (target.files && target.files[0]) {
                                    const file = target.files[0];
                                    const allowedTypes = ["image/jpeg", "image/png"];
                                    if (!allowedTypes.includes(file.type)) {
                                      setSnackbar({
                                        isOpen: true,
                                        message: "Unsupported file format. Please upload JPG, JPEG, or PNG images.",
                                        status: "error",
                                      });
                                      return;
                                    }
                                    const fileItem: FileItem = {
                                      id: Date.now().toString(),
                                      file,
                                      name: file.name,
                                      size: file.size,
                                      type: file.type,
                                    };
                                    // Update form field
                                    field.onChange([fileItem]);
                                    // Immediately create blob URL and update preview
                                    const prevBlobUrl = groupHomeImageUrlRef.current;
                                    if (prevBlobUrl && prevBlobUrl.startsWith("blob:")) {
                                      URL.revokeObjectURL(prevBlobUrl);
                                    }
                                    const blobUrl = URL.createObjectURL(file);
                                    groupHomeImageUrlRef.current = blobUrl;
                                    prevFileRef.current = file;
                                    setGroupHomeImagePreviewUrl(blobUrl);
                                  }
                                };
                                input.click();
                              }}
                              sx={{
                                width: 100,
                                height: 100,
                                borderRadius: "50%",
                                overflow: "visible",
                                border: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "#f6f8fb",
                                position: "relative",
                                cursor: "pointer",
                              }}
                            >
                              {groupHomeImagePreviewUrl ? (
                                <>
                                  <Box
                                    component="img"
                                    src={groupHomeImagePreviewUrl}
                                    alt="Group Home"
                                    sx={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                      position: "relative",
                                      borderRadius: "50%",
                                      zIndex: 1,
                                    }}
                                  />
                                  <Box
                                    sx={{
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      bottom: 0,
                                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      opacity: 0,
                                      transition: "opacity 0.2s ease",
                                      cursor: "pointer",
                                      "&:hover": { opacity: 1 },
                                    }}
                                  >
                                    <EditOutlinedIcon
                                      sx={{ color: "white", fontSize: "24px" }}
                                    />
                                  </Box>
                                  <IconButton
                                    size="small"
                                    aria-label="Remove image"
                                    onClick={handleRemoveGroupHomeImage}
                                    sx={{
                                      position: "absolute",
                                      bottom: 0,
                                      right: 0,
                                      backgroundColor: "#fff",
                                      boxShadow: 1,
                                      zIndex: 3,
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
                                    backgroundColor: "#f6f8fb",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Box
                                    component="img"
                                    src="data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 15V3M12 3L8 7M12 3L16 7M4 13H20C20.5523 13 21 13.4477 21 14V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V14C3 13.4477 3.44772 13 4 13Z' stroke='%238A8F98' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"
                                    alt="Upload"
                                    sx={{ width: "24px", height: "24px", opacity: 0.6 }}
                                  />
                                </Box>
                              )}
                            </Box>
                          )}
                        />
                      </Grid>

                      <Grid
                        size={{ xs: 12, sm: 9, md: 9, lg: 9 }}
                        sx={{
                          minWidth: 0,
                          display: "flex",
                          flexDirection: "column",
                          gap: "14px",
                        }}
                      >
                        <Grid sx={{ display: "flex", flexDirection: "column" }}>
                          <CustomLabel label="Group Home Name" isRequired />
                          <Controller
                            name="groupHomeName"
                            control={control}
                            render={({ field, fieldState }) => (
                              <CustomInput
                                placeholder="Enter Group Home Name"
                                name="groupHomeName"
                                value={field.value}
                                onChange={field.onChange}
                                hasError={!!fieldState.error}
                                errorMessage={fieldState.error?.message}
                              />
                            )}
                          />
                        </Grid>

                        <Grid sx={{ display: "flex", flexDirection: "column" }}>
                          <CustomLabel label="Time zone" isRequired />
                          <Controller
                            name="timeZone"
                            control={control}
                            render={({ field, fieldState }) => (
                              <CustomSelect
                                placeholder="Select Timezone"
                                name="timeZone"
                                value={field.value}
                                items={TIMEZONE_OPTIONS}
                                onChange={(e: SelectChangeEvent<string>) =>
                                  field.onChange(e.target.value)
                                }
                                hasError={!!fieldState.error}
                                errorMessage={fieldState.error?.message}
                              />
                            )}
                          />
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>

              {/* ===================== Group Home Profile ===================== */}
              <Grid
                container
                sx={{ marginBottom: "24px", width: "100%", minWidth: 0 }}
              >
                <Grid size={{ xs: 12 }} sx={{ minWidth: 0 }}>
                  <Typography sx={{ ...sectionTitleSx, marginBottom: "12px" }}>
                    Group Home Profile
                  </Typography>

                  <Grid
                    container
                    sx={{
                      ...cardSx,
                      width: "100%",
                      minWidth: 0,
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                    }}
                  >
                    <Grid
                      container
                      sx={{ width: "100%", minWidth: 0 }}
                      flexDirection={{
                        xs: "column",
                        sm: "row",
                        md: "row",
                        lg: "row",
                      }}
                      spacing={2}
                    >
                      <Grid
                        size={{ xs: 12, sm: 6, md: 6, lg: 6 }}
                        sx={{
                          minWidth: 0,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <CustomLabel label="Phone Number" isRequired />
                        <Controller
                          name="contactNumber"
                          control={control}
                          render={({ field, fieldState }) => (
                            <CustomInput
                              placeholder="Enter Phone Number"
                              name="contactNumber"
                              value={field.value}
                              onChange={field.onChange}
                              phone
                              hasError={!!fieldState.error}
                              errorMessage={fieldState.error?.message}
                            />
                          )}
                        />
                      </Grid>

                      <Grid
                        size={{ xs: 12, sm: 6, md: 6, lg: 6 }}
                        sx={{
                          minWidth: 0,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <CustomLabel label="Fax Number" isRequired />
                        <Controller
                          name="faxNumber"
                          control={control}
                          render={({ field, fieldState }) => (
                            <CustomInput
                              placeholder="Enter Fax Number"
                              name="faxNumber"
                              value={field.value}
                              onChange={field.onChange}
                              isNumeric
                              maxLength={10}
                              hasError={!!fieldState.error}
                              errorMessage={fieldState.error?.message}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>

                    <Grid
                      size={{ xs: 12 }}
                      sx={{
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <CustomLabel label="Email" />
                      <Controller
                        name="emailId"
                        control={control}
                        render={({ field, fieldState }) => (
                          <CustomInput
                            placeholder="Enter Email"
                            name="emailId"
                            value={field.value || ""}
                            onChange={field.onChange}
                            isEmail
                            hasError={!!fieldState.error}
                            errorMessage={fieldState.error?.message}
                          />
                        )}
                      />
                    </Grid>

                    <Grid
                      container
                      sx={{ width: "100%", minWidth: 0 }}
                      flexDirection={{
                        xs: "column",
                        sm: "row",
                        md: "row",
                        lg: "row",
                      }}
                      spacing={2}
                    >
                      <Grid
                        size={{ xs: 12, sm: 6, md: 6, lg: 6 }}
                        sx={{
                          minWidth: 0,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <CustomLabel label="License Number" />
                        <Controller
                          name="licenseNumber"
                          control={control}
                          render={({ field, fieldState }) => (
                            <CustomInput
                              placeholder="Enter License Number"
                              name="licenseNumber"
                              value={field.value}
                              onChange={field.onChange}
                              hasError={!!fieldState.error}
                              errorMessage={fieldState.error?.message}
                            />
                          )}
                        />
                      </Grid>

                      <Grid
                        size={{ xs: 12, sm: 6, md: 6, lg: 6 }}
                        sx={{
                          minWidth: 0,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <CustomLabel label="Emergency Phone Number" />
                        <Controller
                          name="emergencyContactNumber"
                          control={control}
                          render={({ field, fieldState }) => (
                            <CustomInput
                              placeholder="Enter Emergency Number"
                              name="emergencyContactNumber"
                              value={field.value}
                              onChange={field.onChange}
                              phone
                              hasError={!!fieldState.error}
                              errorMessage={fieldState.error?.message}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>

                    <Grid
                      container
                      sx={{ width: "100%", minWidth: 0 }}
                      flexDirection={{
                        xs: "column",
                        sm: "row",
                        md: "row",
                        lg: "row",
                      }}
                      spacing={2}
                    >
                      <Grid
                        size={{ xs: 12, sm: 6, md: 6, lg: 6 }}
                        sx={{
                          minWidth: 0,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <CustomLabel label="License Start Date" />
                        <Controller
                          name="licenseStartDate"
                          control={control}
                          render={({ field }) => (
                            <DatePickerField
                              value={field.value || null}
                              onChange={(date) => field.onChange(date)}
                              label="Select Date"
                            />
                          )}
                        />
                      </Grid>

                      <Grid
                        size={{ xs: 12, sm: 6, md: 6, lg: 6 }}
                        sx={{
                          minWidth: 0,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <CustomLabel label="License Expiry Date" />
                        <Controller
                          name="licenseExpiryDate"
                          control={control}
                          render={({ field, fieldState }) => (
                            <DatePickerField
                              value={field.value || null}
                              onChange={(date) => field.onChange(date)}
                              label="Select Date"
                              hasError={!!fieldState.error}
                              errorMessage={fieldState.error?.message}
                              minDate={licenseStartDateMin}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>

              {/* ===================== Address ===================== */}
              <Grid
                container
                sx={{ marginBottom: "24px", width: "100%", minWidth: 0 }}
              >
                <Grid size={{ xs: 12 }} sx={{ minWidth: 0 }}>
                  <Typography sx={{ ...sectionTitleSx, marginBottom: "12px" }}>
                    Address
                  </Typography>

                  <Grid
                    container
                    sx={{
                      ...cardSx,
                      width: "100%",
                      minWidth: 0,
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                    }}
                  >
                    <Grid
                      size={{ xs: 12 }}
                      sx={{
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <CustomLabel label="Address Line 1" isRequired />
                      <Controller
                        name="addressLine1"
                        control={control}
                        render={({ field, fieldState }) => (
                          <CustomInput
                            placeholder="Enter Address Line 1"
                            name="addressLine1"
                            value={field.value}
                            onChange={field.onChange}
                            hasError={!!fieldState.error}
                            errorMessage={fieldState.error?.message}
                          />
                        )}
                      />
                    </Grid>

                    <Grid
                      size={{ xs: 12 }}
                      sx={{
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <CustomLabel label="Address Line 2" />
                      <Controller
                        name="addressLine2"
                        control={control}
                        render={({ field }) => (
                          <CustomInput
                            placeholder="Enter Address Line 2"
                            name="addressLine2"
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </Grid>

                    <Grid
                      container
                      sx={{ width: "100%", minWidth: 0 }}
                      flexDirection={{
                        xs: "column",
                        sm: "row",
                        md: "row",
                        lg: "row",
                      }}
                      spacing={2}
                    >
                      <Grid
                        size={{ xs: 12, sm: 6, md: 6, lg: 6 }}
                        sx={{
                          minWidth: 0,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <CustomLabel label="City" isRequired />
                        <Controller
                          name="city"
                          control={control}
                          render={({ field, fieldState }) => (
                            <CustomInput
                              placeholder="Enter City"
                              name="city"
                              value={field.value}
                              onChange={field.onChange}
                              hasError={!!fieldState.error}
                              errorMessage={fieldState.error?.message}
                            />
                          )}
                        />
                      </Grid>

                      <Grid
                        size={{ xs: 12, sm: 6, md: 6, lg: 6 }}
                        sx={{
                          minWidth: 0,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <CustomLabel label="State" isRequired />
                        <Controller
                          name="state"
                          control={control}
                          render={({ field, fieldState }) => (
                            <CustomSelect
                              placeholder="Select State"
                              name="state"
                              value={field.value}
                              items={STATE_OPTIONS}
                              onChange={(e: SelectChangeEvent<string>) =>
                                field.onChange(e.target.value)
                              }
                              hasError={!!fieldState.error}
                              errorMessage={fieldState.error?.message}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>

                    <Grid
                      container
                      sx={{ width: "100%", minWidth: 0 }}
                      flexDirection={{
                        xs: "column",
                        sm: "row",
                        md: "row",
                        lg: "row",
                      }}
                      spacing={2}
                    >
                      <Grid
                        size={{ xs: 12, sm: 6, md: 6, lg: 6 }}
                        sx={{
                          minWidth: 0,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <CustomLabel label="ZIP Code" isRequired />
                        <Controller
                          name="zipCode"
                          control={control}
                          render={({ field, fieldState }) => (
                            <CustomInput
                              placeholder="Enter Zip Code"
                              name="zipCode"
                              value={field.value}
                              onChange={field.onChange}
                              zipCode
                              hasError={!!fieldState.error}
                              errorMessage={fieldState.error?.message}
                            />
                          )}
                        />
                      </Grid>

                      <Grid
                        size={{ xs: 12, sm: 6, md: 6, lg: 6 }}
                        sx={{
                          minWidth: 0,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <CustomLabel label="Country" isRequired />
                        <Controller
                          name="country"
                          control={control}
                          render={({ field, fieldState }) => (
                            <CustomSelect
                              placeholder="Select Country"
                              name="country"
                              value={field.value}
                              items={COUNTRY_OPTIONS}
                              onChange={(e: SelectChangeEvent<string>) =>
                                field.onChange(e.target.value)
                              }
                              hasError={!!fieldState.error}
                              errorMessage={fieldState.error?.message}
                              isDisabled={true}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>

              {/* ===================== Capacity & Structure ===================== */}
              <Grid
                container
                sx={{ marginBottom: "24px", width: "100%", minWidth: 0 }}
              >
                <Grid size={{ xs: 12 }} sx={{ minWidth: 0 }}>
                  <Typography sx={{ ...sectionTitleSx, marginBottom: "12px" }}>
                    Capacity & Structure
                  </Typography>

                  <Grid
                    container
                    sx={{
                      ...cardSx,
                      width: "100%",
                      minWidth: 0,
                      padding: "14px",
                    }}
                  >
                    <Grid
                      size={{ xs: 12 }}
                      sx={{
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <CustomLabel label="Number of rooms" isRequired />
                      <Controller
                        name="numberOfRooms"
                        control={control}
                        render={({ field, fieldState }) => (
                          <CustomInput
                            placeholder="Enter Number of rooms"
                            name="numberOfRooms"
                            value={field.value}
                            onChange={field.onChange}
                            isNumeric
                            hasError={!!fieldState.error}
                            errorMessage={fieldState.error?.message}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>

              {/* ===================== Upload Certificate ===================== */}
              <Grid size={{ xs: 12 }} sx={{ minWidth: 0 }}>
                <Typography
                  variant="inputTitle"
                  sx={{ marginBottom: "8px", display: "block" }}
                >
                  Upload Certificate
                </Typography>
                <Controller
                  name="certificateFiles"
                  control={control}
                  render={({ field }) => (
                    <CustomFileUpload
                      files={field.value}
                      onFilesChange={(files) =>
                        handleCertificateFilesChange(files, field.onChange)
                      }
                      onMaxFilesExceeded={(max) =>
                        setCertificateError(`Maximum ${max} documents allowed.`)
                      }
                      type="drag-drop"
                      multiple
                      maxFiles={MAX_CERT_FILES}
                      accept="application/pdf,image/png,image/jpeg,image/jpg"
                      helperText={`PDF, PNG, JPG, JPEG (max 10MB). Up to ${MAX_CERT_FILES} documents.`}
                      showFileList={false}
                      allowDragDrop
                    />
                  )}
                />
                {certificateError && (
                  <Typography
                    sx={{
                      fontSize: "12px",
                      color: "#D32F2F",
                      marginTop: "6px",
                    }}
                  >
                    {certificateError}
                  </Typography>
                )}
                {/* Single list: existing uploaded certificates + new files (same row style) */}
                {(() => {
                  const mediaIds = certificateMediaIds as string[];
                  const files = certificateFiles as FileItem[];
                  const hasExisting = mediaIds.length > 0;
                  const hasNew = files.length > 0;
                  if (!hasExisting && !hasNew) return null;

                  const mediaById = new Map(
                    initialMedia.map((m) => [
                      m.id,
                      m.name || m.original_filename || "Document",
                    ]),
                  );

                  return (
                    <Box sx={{ marginTop: "12px" }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "12px",
                          color: "#A9ACA9",
                          marginBottom: "8px",
                          fontWeight: 500,
                        }}
                      >
                        Uploaded certificates
                      </Typography>
                      {/* Scrollable file list — capped height, only list scrolls */}
                      <Box
                        sx={{
                          maxHeight: "180px",
                          overflowY: "auto",
                          overflowX: "hidden",
                          width: "100%",
                          boxSizing: "border-box",
                        }}
                      >
                        <Stack spacing={1}>
                          {mediaIds.map((id: string) => (
                            <Box key={`existing-${id}`} sx={fileListRowSx}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  flex: 1,
                                  minWidth: 0,
                                }}
                              >
                                <InsertDriveFileOutlinedIcon
                                  sx={{ color: "#757775", fontSize: 20, mr: 1 }}
                                />
                                <Typography
                                  sx={{
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    color: "#2C2D2C",
                                    flex: 1,
                                    marginRight: "8px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {mediaById.get(id) ?? "Certificate"}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontSize: "12px",
                                    color: "#A9ACA9",
                                    flexShrink: 0,
                                  }}
                                >
                                  Uploaded
                                </Typography>
                              </Box>
                              <IconButton
                                size="small"
                                aria-label="Remove certificate"
                                onClick={() => {
                                  const current =
                                    getValues("certificateMediaIds") || [];
                                  setValue(
                                    "certificateMediaIds",
                                    current.filter((x: string) => x !== id),
                                  );
                                }}
                                sx={{
                                  color: "#CA1C1C",
                                  padding: "4px",
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Box>
                          ))}
                          {files.map((fileItem: FileItem) => (
                            <Box key={fileItem.id} sx={fileListRowSx}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  flex: 1,
                                  minWidth: 0,
                                }}
                              >
                                <InsertDriveFileOutlinedIcon
                                  sx={{ color: "#757775", fontSize: 20, mr: 1 }}
                                />
                                <Typography
                                  sx={{
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    color: "#2C2D2C",
                                    flex: 1,
                                    marginRight: "8px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {fileItem.name}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontSize: "12px",
                                    color: "#A9ACA9",
                                    flexShrink: 0,
                                  }}
                                >
                                  {formatFileSize(fileItem.size)}
                                </Typography>
                              </Box>
                              <IconButton
                                size="small"
                                aria-label="Remove file"
                                onClick={() => {
                                  const current =
                                    getValues("certificateFiles") || [];
                                  const next = current.filter(
                                    (f: FileItem) => f.id !== fileItem.id,
                                  );
                                  handleCertificateFilesChange(
                                    next,
                                    (files) => setValue("certificateFiles", files),
                                  );
                                }}
                                sx={{
                                  color: "#CA1C1C",
                                  padding: "4px",
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    </Box>
                  );
                })()}
              </Grid>
            </Grid>

            <Grid
              container
              sx={{ marginBottom: "24px", width: "100%", minWidth: 0 }}
            >
              <Grid size={{ xs: 12 }} sx={{ minWidth: 0 }}>
                <Typography sx={{ ...sectionTitleSx, marginBottom: "12px" }}>
                  Shifts :
                </Typography>

                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Grid
                    container
                    sx={{
                      width: "100%",
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                      padding: 0,
                    }}
                  >
                    <Grid container sx={shiftRowSx}>
                      <Controller
                        name="shifts.morning.enabled"
                        control={control}
                        render={({ field }) => (
                          <CustomCheckbox
                            checked={field.value}
                            onChange={(checked) => {
                              const currentShift = getValues("shifts.morning");
                              if (checked) {
                                // Ensure shift object is properly structured when checked
                                setValue("shifts.morning", {
                                  enabled: true,
                                  from: currentShift?.from || "",
                                  fromAmPm: currentShift?.fromAmPm || "AM",
                                  to: currentShift?.to || "",
                                  toAmPm: currentShift?.toAmPm || "AM",
                                }, { shouldValidate: true });
                                field.onChange(true);
                              } else {
                                // Reset times when unchecked
                                setValue("shifts.morning", {
                                  enabled: false,
                                  from: "",
                                  fromAmPm: "AM",
                                  to: "",
                                  toAmPm: "AM",
                                }, { shouldValidate: true });
                                field.onChange(false);
                              }
                            }}
                            showText={false}
                          />
                        )}
                      />

                      <Typography sx={shiftLabelSx}>Morning</Typography>

                      <Typography sx={smallTextSx}>From</Typography>
                      <Grid sx={timeBoxSx}>
                        <Controller
                          name="shifts.morning"
                          control={control}
                          render={({ field }) => {
                            const enabled = watch("shifts.morning.enabled");
                            const isSubmitted = formState.isSubmitted;
                            const error =
                              enabled && !field.value.from && isSubmitted
                                ? "From time is required"
                                : undefined;
                            const time24 = convertTo24Hour(
                              field.value.from,
                              field.value.fromAmPm,
                            );
                            const dayjsValue = time24
                              ? dayjs(`2023-01-01T${time24}`)
                              : null;

                            return (
                              <Stack
                                width={{ xs: "100%", sm: "180px" }}
                                sx={{ minWidth: 0 }}
                              >
                                <TimePicker
                                  value={dayjsValue}
                                  onChange={(newValue: Dayjs | null) => {
                                    if (newValue) {
                                      const time24Str = `${String(newValue.hour()).padStart(2, "0")}:${String(newValue.minute()).padStart(2, "0")}`;
                                      const { time, amPm } =
                                        convertTo12Hour(time24Str);
                                      field.onChange({
                                        ...field.value,
                                        from: time,
                                        fromAmPm: amPm,
                                      });
                                    } else {
                                      field.onChange({
                                        ...field.value,
                                        from: "",
                                        fromAmPm: "AM",
                                      });
                                    }
                                  }}
                                  sx={timePickerStyles(!!error)}
                                  slotProps={{
                                    field: { clearable: true, readOnly: false },
                                    openPickerIcon: {
                                      children: <AccessTimeIcon />,
                                    },
                                    inputAdornment: { position: "start" },
                                    textField: {
                                      readOnly: false,
                                      inputProps: {
                                        readOnly: false,
                                      },
                                    },
                                    popper: {
                                      sx: {
                                        zIndex: "99999 !important",
                                        "& .MuiPaper-root": {
                                          zIndex: "99999 !important",
                                        },
                                        "& .MuiPickersLayout-root": {
                                          zIndex: "99999 !important",
                                        },
                                      },
                                      disablePortal: true,
                                      placement: "bottom-start",
                                      modifiers: [
                                        {
                                          name: "zIndex",
                                          enabled: true,
                                          options: {
                                            zIndex: 99999,
                                          },
                                        },
                                      ],
                                    },
                                  }}
                                />
                                {error && (
                                  <Typography
                                    sx={{
                                      color: "#D32F2F",
                                      fontSize: "0.75rem",
                                      lineHeight: 1.66,
                                      letterSpacing: "0.03333em",
                                      marginTop: "4px",
                                    }}
                                  >
                                    {error}
                                  </Typography>
                                )}
                              </Stack>
                            );
                          }}
                        />
                      </Grid>

                      <Typography sx={smallTextSx}>To</Typography>
                      <Grid sx={timeBoxSx}>
                        <Controller
                          name="shifts.morning"
                          control={control}
                          render={({ field }) => {
                            const enabled = watch("shifts.morning.enabled");
                            const isSubmitted = formState.isSubmitted;
                            const error =
                              enabled && !field.value.to && isSubmitted
                                ? "To time is required"
                                : undefined;
                            const time24 = convertTo24Hour(
                              field.value.to,
                              field.value.toAmPm,
                            );
                            const dayjsValue = time24
                              ? dayjs(`2023-01-01T${time24}`)
                              : null;

                            return (
                              <Stack
                                width={{ xs: "100%", sm: "180px" }}
                                sx={{ minWidth: 0 }}
                              >
                                <TimePicker
                                  value={dayjsValue}
                                  onChange={(newValue: Dayjs | null) => {
                                    if (newValue) {
                                      const time24Str = `${String(newValue.hour()).padStart(2, "0")}:${String(newValue.minute()).padStart(2, "0")}`;
                                      const { time, amPm } =
                                        convertTo12Hour(time24Str);
                                      field.onChange({
                                        ...field.value,
                                        to: time,
                                        toAmPm: amPm,
                                      });
                                    } else {
                                      field.onChange({
                                        ...field.value,
                                        to: "",
                                        toAmPm: "AM",
                                      });
                                    }
                                  }}
                                  sx={timePickerStyles(!!error)}
                                  slotProps={{
                                    field: { clearable: true, readOnly: false },
                                    openPickerIcon: {
                                      children: <AccessTimeIcon />,
                                    },
                                    inputAdornment: { position: "start" },
                                    textField: {
                                      readOnly: false,
                                      inputProps: {
                                        readOnly: false,
                                      },
                                    },
                                    popper: {
                                      sx: {
                                        zIndex: "99999 !important",
                                        "& .MuiPaper-root": {
                                          zIndex: "99999 !important",
                                        },
                                        "& .MuiPickersLayout-root": {
                                          zIndex: "99999 !important",
                                        },
                                      },
                                      disablePortal: true,
                                      placement: "bottom-start",
                                      modifiers: [
                                        {
                                          name: "zIndex",
                                          enabled: true,
                                          options: {
                                            zIndex: 99999,
                                          },
                                        },
                                      ],
                                    },
                                  }}
                                />
                                {error && (
                                  <Typography
                                    sx={{
                                      color: "#D32F2F",
                                      fontSize: "0.75rem",
                                      lineHeight: 1.66,
                                      letterSpacing: "0.03333em",
                                      marginTop: "4px",
                                    }}
                                  >
                                    {error}
                                  </Typography>
                                )}
                              </Stack>
                            );
                          }}
                        />
                      </Grid>
                    </Grid>

                    <Grid container sx={shiftRowSx}>
                      <Controller
                        name="shifts.evening.enabled"
                        control={control}
                        render={({ field }) => (
                          <CustomCheckbox
                            checked={field.value}
                            onChange={(checked) => {
                              const currentShift = getValues("shifts.evening");
                              if (checked) {
                                // Ensure shift object is properly structured when checked
                                setValue("shifts.evening", {
                                  enabled: true,
                                  from: currentShift?.from || "",
                                  fromAmPm: currentShift?.fromAmPm || "AM",
                                  to: currentShift?.to || "",
                                  toAmPm: currentShift?.toAmPm || "AM",
                                }, { shouldValidate: true });
                                field.onChange(true);
                              } else {
                                // Reset times when unchecked
                                setValue("shifts.evening", {
                                  enabled: false,
                                  from: "",
                                  fromAmPm: "AM",
                                  to: "",
                                  toAmPm: "AM",
                                }, { shouldValidate: true });
                                field.onChange(false);
                              }
                            }}
                            showText={false}
                          />
                        )}
                      />

                      <Typography sx={shiftLabelSx}>Evening</Typography>

                      <Typography sx={smallTextSx}>From</Typography>
                      <Grid sx={timeBoxSx}>
                        <Controller
                          name="shifts.evening"
                          control={control}
                          render={({ field }) => {
                            const enabled = watch("shifts.evening.enabled");
                            const isSubmitted = formState.isSubmitted;
                            const error =
                              enabled && !field.value.from && isSubmitted
                                ? "From time is required"
                                : undefined;
                            const time24 = convertTo24Hour(
                              field.value.from,
                              field.value.fromAmPm,
                            );
                            const dayjsValue = time24
                              ? dayjs(`2023-01-01T${time24}`)
                              : null;

                            return (
                              <Stack
                                width={{ xs: "100%", sm: "180px" }}
                                sx={{ minWidth: 0 }}
                              >
                                <TimePicker
                                  value={dayjsValue}
                                  onChange={(newValue: Dayjs | null) => {
                                    if (newValue) {
                                      const time24Str = `${String(newValue.hour()).padStart(2, "0")}:${String(newValue.minute()).padStart(2, "0")}`;
                                      const { time, amPm } =
                                        convertTo12Hour(time24Str);
                                      field.onChange({
                                        ...field.value,
                                        from: time,
                                        fromAmPm: amPm,
                                      });
                                    } else {
                                      field.onChange({
                                        ...field.value,
                                        from: "",
                                        fromAmPm: "AM",
                                      });
                                    }
                                  }}
                                  sx={timePickerStyles(!!error)}
                                  slotProps={{
                                    field: { clearable: true, readOnly: false },
                                    openPickerIcon: {
                                      children: <AccessTimeIcon />,
                                    },
                                    inputAdornment: { position: "start" },
                                    textField: {
                                      readOnly: false,
                                      inputProps: {
                                        readOnly: false,
                                      },
                                    },
                                    popper: {
                                      sx: {
                                        zIndex: "99999 !important",
                                        "& .MuiPaper-root": {
                                          zIndex: "99999 !important",
                                        },
                                        "& .MuiPickersLayout-root": {
                                          zIndex: "99999 !important",
                                        },
                                      },
                                      disablePortal: true,
                                      placement: "bottom-start",
                                      modifiers: [
                                        {
                                          name: "zIndex",
                                          enabled: true,
                                          options: {
                                            zIndex: 99999,
                                          },
                                        },
                                      ],
                                    },
                                  }}
                                />
                                {error && (
                                  <Typography
                                    sx={{
                                      color: "#D32F2F",
                                      fontSize: "0.75rem",
                                      lineHeight: 1.66,
                                      letterSpacing: "0.03333em",
                                      marginTop: "4px",
                                    }}
                                  >
                                    {error}
                                  </Typography>
                                )}
                              </Stack>
                            );
                          }}
                        />
                      </Grid>

                      <Typography sx={smallTextSx}>To</Typography>
                      <Grid sx={timeBoxSx}>
                        <Controller
                          name="shifts.evening"
                          control={control}
                          render={({ field }) => {
                            const enabled = watch("shifts.evening.enabled");
                            const isSubmitted = formState.isSubmitted;
                            const error =
                              enabled && !field.value.to && isSubmitted
                                ? "To time is required"
                                : undefined;
                            const time24 = convertTo24Hour(
                              field.value.to,
                              field.value.toAmPm,
                            );
                            const dayjsValue = time24
                              ? dayjs(`2023-01-01T${time24}`)
                              : null;

                            return (
                              <Stack
                                width={{ xs: "100%", sm: "180px" }}
                                sx={{ minWidth: 0 }}
                              >
                                <TimePicker
                                  value={dayjsValue}
                                  onChange={(newValue: Dayjs | null) => {
                                    if (newValue) {
                                      const time24Str = `${String(newValue.hour()).padStart(2, "0")}:${String(newValue.minute()).padStart(2, "0")}`;
                                      const { time, amPm } =
                                        convertTo12Hour(time24Str);
                                      field.onChange({
                                        ...field.value,
                                        to: time,
                                        toAmPm: amPm,
                                      });
                                    } else {
                                      field.onChange({
                                        ...field.value,
                                        to: "",
                                        toAmPm: "AM",
                                      });
                                    }
                                  }}
                                  sx={timePickerStyles(!!error)}
                                  slotProps={{
                                    field: { clearable: true, readOnly: false },
                                    openPickerIcon: {
                                      children: <AccessTimeIcon />,
                                    },
                                    inputAdornment: { position: "start" },
                                    textField: {
                                      readOnly: false,
                                      inputProps: {
                                        readOnly: false,
                                      },
                                    },
                                    popper: {
                                      sx: {
                                        zIndex: "99999 !important",
                                        "& .MuiPaper-root": {
                                          zIndex: "99999 !important",
                                        },
                                        "& .MuiPickersLayout-root": {
                                          zIndex: "99999 !important",
                                        },
                                      },
                                      disablePortal: true,
                                      placement: "bottom-start",
                                      modifiers: [
                                        {
                                          name: "zIndex",
                                          enabled: true,
                                          options: {
                                            zIndex: 99999,
                                          },
                                        },
                                      ],
                                    },
                                  }}
                                />
                                {error && (
                                  <Typography
                                    sx={{
                                      color: "#D32F2F",
                                      fontSize: "0.75rem",
                                      lineHeight: 1.66,
                                      letterSpacing: "0.03333em",
                                      marginTop: "4px",
                                    }}
                                  >
                                    {error}
                                  </Typography>
                                )}
                              </Stack>
                            );
                          }}
                        />
                      </Grid>
                    </Grid>

                    <Grid container sx={shiftRowSx}>
                      <Controller
                        name="shifts.night.enabled"
                        control={control}
                        render={({ field }) => (
                          <CustomCheckbox
                            checked={field.value}
                            onChange={(checked) => {
                              const currentShift = getValues("shifts.night");
                              if (checked) {
                                // Ensure shift object is properly structured when checked
                                setValue("shifts.night", {
                                  enabled: true,
                                  from: currentShift?.from || "",
                                  fromAmPm: currentShift?.fromAmPm || "AM",
                                  to: currentShift?.to || "",
                                  toAmPm: currentShift?.toAmPm || "AM",
                                }, { shouldValidate: true });
                                field.onChange(true);
                              } else {
                                // Reset times when unchecked
                                setValue("shifts.night", {
                                  enabled: false,
                                  from: "",
                                  fromAmPm: "AM",
                                  to: "",
                                  toAmPm: "AM",
                                }, { shouldValidate: true });
                                field.onChange(false);
                              }
                            }}
                            showText={false}
                          />
                        )}
                      />

                      <Typography sx={shiftLabelSx}>Night</Typography>

                      <Typography sx={smallTextSx}>From</Typography>
                      <Grid sx={timeBoxSx}>
                        <Controller
                          name="shifts.night"
                          control={control}
                          render={({ field }) => {
                            const enabled = watch("shifts.night.enabled");
                            const isSubmitted = formState.isSubmitted;
                            const error =
                              enabled && !field.value.from && isSubmitted
                                ? "From time is required"
                                : undefined;
                            const time24 = convertTo24Hour(
                              field.value.from,
                              field.value.fromAmPm,
                            );
                            const dayjsValue = time24
                              ? dayjs(`2023-01-01T${time24}`)
                              : null;

                            return (
                              <Stack
                                width={{ xs: "100%", sm: "180px" }}
                                sx={{ minWidth: 0 }}
                              >
                                <TimePicker
                                  value={dayjsValue}
                                  onChange={(newValue: Dayjs | null) => {
                                    if (newValue) {
                                      const time24Str = `${String(newValue.hour()).padStart(2, "0")}:${String(newValue.minute()).padStart(2, "0")}`;
                                      const { time, amPm } =
                                        convertTo12Hour(time24Str);
                                      field.onChange({
                                        ...field.value,
                                        from: time,
                                        fromAmPm: amPm,
                                      });
                                    } else {
                                      field.onChange({
                                        ...field.value,
                                        from: "",
                                        fromAmPm: "AM",
                                      });
                                    }
                                  }}
                                  sx={timePickerStyles(!!error)}
                                  slotProps={{
                                    field: { clearable: true, readOnly: false },
                                    openPickerIcon: {
                                      children: <AccessTimeIcon />,
                                    },
                                    inputAdornment: { position: "start" },
                                    textField: {
                                      readOnly: false,
                                      inputProps: {
                                        readOnly: false,
                                      },
                                    },
                                    popper: {
                                      sx: {
                                        zIndex: "99999 !important",
                                        "& .MuiPaper-root": {
                                          zIndex: "99999 !important",
                                        },
                                        "& .MuiPickersLayout-root": {
                                          zIndex: "99999 !important",
                                        },
                                      },
                                      disablePortal: true,
                                      placement: "bottom-start",
                                      modifiers: [
                                        {
                                          name: "zIndex",
                                          enabled: true,
                                          options: {
                                            zIndex: 99999,
                                          },
                                        },
                                      ],
                                    },
                                  }}
                                />
                                {error && (
                                  <Typography
                                    sx={{
                                      color: "#D32F2F",
                                      fontSize: "0.75rem",
                                      lineHeight: 1.66,
                                      letterSpacing: "0.03333em",
                                      marginTop: "4px",
                                    }}
                                  >
                                    {error}
                                  </Typography>
                                )}
                              </Stack>
                            );
                          }}
                        />
                      </Grid>

                      <Typography sx={smallTextSx}>To</Typography>
                      <Grid sx={timeBoxSx}>
                        <Controller
                          name="shifts.night"
                          control={control}
                          render={({ field }) => {
                            const enabled = watch("shifts.night.enabled");
                            const isSubmitted = formState.isSubmitted;
                            const error =
                              enabled && !field.value.to && isSubmitted
                                ? "To time is required"
                                : undefined;
                            const time24 = convertTo24Hour(
                              field.value.to,
                              field.value.toAmPm,
                            );
                            const dayjsValue = time24
                              ? dayjs(`2023-01-01T${time24}`)
                              : null;

                            return (
                              <Stack
                                width={{ xs: "100%", sm: "180px" }}
                                sx={{ minWidth: 0 }}
                              >
                                <TimePicker
                                  value={dayjsValue}
                                  onChange={(newValue: Dayjs | null) => {
                                    if (newValue) {
                                      const time24Str = `${String(newValue.hour()).padStart(2, "0")}:${String(newValue.minute()).padStart(2, "0")}`;
                                      const { time, amPm } =
                                        convertTo12Hour(time24Str);
                                      field.onChange({
                                        ...field.value,
                                        to: time,
                                        toAmPm: amPm,
                                      });
                                    } else {
                                      field.onChange({
                                        ...field.value,
                                        to: "",
                                        toAmPm: "AM",
                                      });
                                    }
                                  }}
                                  sx={timePickerStyles(!!error)}
                                  slotProps={{
                                    field: { clearable: true, readOnly: false },
                                    openPickerIcon: {
                                      children: <AccessTimeIcon />,
                                    },
                                    inputAdornment: { position: "start" },
                                    textField: {
                                      readOnly: false,
                                      inputProps: {
                                        readOnly: false,
                                      },
                                    },
                                    popper: {
                                      sx: {
                                        zIndex: "99999 !important",
                                        "& .MuiPaper-root": {
                                          zIndex: "99999 !important",
                                        },
                                        "& .MuiPickersLayout-root": {
                                          zIndex: "99999 !important",
                                        },
                                      },
                                      disablePortal: true,
                                      placement: "bottom-start",
                                      modifiers: [
                                        {
                                          name: "zIndex",
                                          enabled: true,
                                          options: {
                                            zIndex: 99999,
                                          },
                                        },
                                      ],
                                    },
                                  }}
                                />
                                {error && (
                                  <Typography
                                    sx={{
                                      color: "#D32F2F",
                                      fontSize: "0.75rem",
                                      lineHeight: 1.66,
                                      letterSpacing: "0.03333em",
                                      marginTop: "4px",
                                    }}
                                  >
                                    {error}
                                  </Typography>
                                )}
                              </Stack>
                            );
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </LocalizationProvider>
              </Grid>
            </Grid>

            {/* ===== FOOTER (sticky inside CustomDrawer scroll container) ===== */}
            <Grid
              container
              sx={{
                padding: "18px 24px",
                borderTop: "1px solid #E7E9EB",
                position: "sticky",
                bottom: 0,
                backgroundColor: "#FFFFFF",
                zIndex: 2,
                width: "100%",
                minWidth: 0,
              }}
            >
              <Grid
                container
                sx={{ justifyContent: "flex-end", width: "100%", minWidth: 0 }}
              >
                <Grid
                  size={{ xs: 12, sm: 8, md: 8, lg: 12 }}
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "12px",
                    minWidth: 0,
                  }}
                >
                  <CustomButton
                    variant="secondary"
                    onClick={resetAndClose}
                    type="button"
                    disabled={isLoading || isSubmitting}
                  >
                    Cancel
                  </CustomButton>
                  <CustomButton
                    variant="primary"
                    type="submit"
                    disabled={isLoading || isSubmitting}
                    loading={isLoading || isSubmitting}
                    icon={
                      isLoading || isSubmitting ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : undefined
                    }
                    iconPosition="left"
                  >
                    Save
                  </CustomButton>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </CustomDrawer>

      <CommonSnackbar
        isOpen={snackbar.isOpen}
        message={snackbar.message}
        status={snackbar.status}
        onClose={() => setSnackbar((prev) => ({ ...prev, isOpen: false }))}
        autoClose={true}
        autoCloseDelay={5000}
      />

    </>
  );
}
