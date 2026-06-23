// MonthlyDataTrackerHRSTForm.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Tooltip,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,

} from "@mui/material";
import { Info } from "@mui/icons-material";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import CustomInput from "../../../components/custom-input/custom-input";
import CustomLabel from "../../../components/custom-label/custom-label";
import CustomButton from "../../../components/custom-buttons/custom-buttons";
import CommonSnackbar from "../../../components/common-snackbar/common-snackbar";
import {
  listConsentFormsOptions,
  listConsentFormsQueryKey,
  createConsentFormMutation,
  getConsentFormDetailOptions,
  updateConsentFormMutation,
} from "../../../sdk/@tanstack/react-query.gen";

export interface MonthlyDataTrackerHRSTFormProps {
  open?: boolean;
  residentName?: string;
  residentId?: string | number;
  formName?: string;
  residentData?: any;
  consentUuid?: string | null;
  mode?: "new" | "draft" | "view" | "edit";
  historyEntry?: any;
  onAfterSave?: () => void;
  onAfterSubmit?: () => void;
  onClose?: () => void;
  onPrintRequest?: () => void; // Callback to get form data for printing
}

// Form code constant - matches the table mapping
const FORM_CODE = 'HRST_MONTHLY_TRACKER';

const getBackendMessage = (data: unknown): string | undefined => {
  const d: any = data as any;
  return d?.message ?? d?.data?.message ?? d?.detail ?? d?.data?.detail ?? undefined;
};

const getErrorMessage = (error: unknown): string | undefined => {
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
};

const RATING_ITEMS = [
  { id: "A", label: "Eating" },
  { id: "B", label: "Ambulation" },
  { id: "C", label: "Transfer" },
  { id: "D", label: "Toileting" },
  { id: "E", label: "Behavioral Patterns" },
  { id: "F", label: "Physical Aggressive Behaviors" },
  { id: "G", label: "Verbal Aggressive Behaviors" },
  { id: "H", label: "Socially Inappropriate/Disruptive" },
  { id: "I", label: "Resists Care" },
  { id: "J", label: "Wanders/Exit Seeking" },
  { id: "K", label: "Verbally Abusive" },
  { id: "L", label: "Physically Abusive" },
  { id: "M", label: "Self-Injurious Behaviors" },
  { id: "N", label: "Skin Integrity" },
  { id: "O", label: "Bowel Function" },
  { id: "P", label: "Nutrition" },
  { id: "Q", label: "Requirements for Licensed Interventions" },
  { id: "R", label: "Cognitive Skills for Daily Decision Making" },
  { id: "S", label: "Memory/Recall Ability" },
  { id: "T", label: "Hallucinations/Delusions" },
  { id: "U", label: "Sad, Apathetic, Anxious" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

type Month = (typeof MONTHS)[number];

const VITAL_ROWS = [
  { key: "heightFt", label: "Height (ft)" },
  { key: "heightIn", label: "Height (in)" },
  { key: "weight",   label: "Weight (lbs)" },
] as const;

const ratingScaleTooltip =
  "Rating Scale:\n0 - Independent\n1 - Supervision\n2 - Limited Assistance\n3 - Extensive Assistance\n4 - Dependence";

const buildDefaultValues = () => {
  const gridDefaults = RATING_ITEMS.reduce((acc, item) => {
    MONTHS.forEach((m) => {
      acc[`${item.id}_${m}`] = "";
    });
    return acc;
  }, {} as Record<string, string | number>);

  // Per-month vitals: heightFt_Jan, heightIn_Jan, weight_Jan, bmi_Jan ...
  const vitalsDefaults = MONTHS.reduce((acc, m) => {
    acc[`heightFt_${m}`] = "";
    acc[`heightIn_${m}`] = "";
    acc[`weight_${m}`]   = "";
    acc[`bmi_${m}`]      = "";
    return acc;
  }, {} as Record<string, string | number>);

  return {
    source: "",
    year: "",
    // Legacy single-value vitals kept for backward compatibility
    heightFt: "",
    heightIn: "",
    weight: "",
    bmi: "",
    ...gridDefaults,
    ...vitalsDefaults,
  };
};

const MonthlyDataTrackerHRSTForm: React.FC<MonthlyDataTrackerHRSTFormProps> = ({
  open = true,
  residentName = "",
  residentId = "",
  formName = "Monthly Data Tracker (HRST)",
  residentData,
  consentUuid,
  mode = "new",
  historyEntry,
  onAfterSave,
  onAfterSubmit,
  onClose,
  onPrintRequest,
}) => {
  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
    status: "success" | "error";
  }>({ isOpen: false, message: "", status: "success" });

  // Year-wise tracking: track which calendar year is currently being viewed/edited
  const currentYear = useMemo(() => String(new Date().getFullYear()), []);
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);

  const queryClient = useQueryClient();
  const hasResetFormRef = useRef(false);
  const lastPrefillTimestampRef = useRef<number>(0);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  
  // Refs for each month column to support auto-scroll
  const monthRefs = useRef<Record<string, HTMLTableCellElement | null>>({});

  // Extract resident UUID
  const residentUuid = residentData?.uuid || residentData?.resident_uuid;

  const currentMonthIndex = useMemo(() => new Date().getMonth(), []);
  const currentMonthLabel: Month | null = useMemo(() => {
    const idx = Math.min(Math.max(currentMonthIndex, 0), 11);
    return MONTHS[idx] ?? null;
  }, [currentMonthIndex]);

  // Scroll to current month when modal opens
  useEffect(() => {
    if (open && currentMonthLabel) {
      // Slight delay to ensure table is fully rendered
      setTimeout(() => {
        const monthElement = monthRefs.current[currentMonthLabel];
        if (monthElement && tableScrollRef.current) {
          const container = tableScrollRef.current;
          // Calculate position to scroll to
          const scrollTarget = monthElement.offsetLeft - container.offsetLeft - 320; // 320 is the first col width
          // ensure we don't scroll into negative
          container.scrollTo({
            left: Math.max(0, scrollTarget),
            behavior: "smooth"
          });
        }
      }, 300);
    }
  }, [open, currentMonthLabel]);

  const { control, handleSubmit, setValue, reset, getValues, watch } = useForm({
    defaultValues: buildDefaultValues(),
  });

  // Watch health vitals fields – individual watches for Vitals section BMI
  const watchedHeightFt = watch("heightFt");
  const watchedHeightIn = watch("heightIn");
  const watchedWeight   = watch("weight");

  // Full reactive snapshot used for per-month BMI calculation in the grid
  const allMonthValues = watch() as Record<string, any>;

  // Auto-calculates BMI for a given month from the month’s height + weight fields.
  // Formula: BMI = (weight_lbs / totalInches²) × 703
  const calcMonthBMI = (m: string): string => {
    const ft      = parseFloat(String(allMonthValues[`heightFt_${m}`])) || 0;
    const inches  = parseFloat(String(allMonthValues[`heightIn_${m}`])) || 0;
    const weight  = parseFloat(String(allMonthValues[`weight_${m}`]))   || 0;
    const totalIn = ft * 12 + inches;
    if (totalIn > 0 && weight > 0) {
      return ((weight / (totalIn * totalIn)) * 703).toFixed(1);
    }
    return "";
  };

  // Stable string that changes only when per-month height/weight values change.
  // Used as a useEffect dependency to auto-calculate per-month BMI.
  const monthPhysicalData = MONTHS.map((m) =>
    `${allMonthValues[`heightFt_${m}`]}_${allMonthValues[`heightIn_${m}`]}_${allMonthValues[`weight_${m}`]}`
  ).join(",");

  // Expose getValues to parent for printing
  useEffect(() => {
    if (onPrintRequest && typeof onPrintRequest === 'function') {
      // Pass getValues function to parent
      (onPrintRequest as any)(getValues);
    }
  }, [onPrintRequest, getValues]);


  // Fetch ALL historical entries so the user can switch between years
  const { data: historyEntries } = useQuery({
    ...getConsentFormDetailOptions({
      path: { uuid: consentUuid! },
      query: { history: true },
    }),
    enabled: open && !!consentUuid && (mode === "draft" || mode === "view" || mode === "edit"),
    staleTime: 0,
    select: (data: any) => {
      const responseData = data?.data ?? data;
      return (responseData?.entries || []) as any[];
    },
  });

  // Derive the sorted list of years that have saved data
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    years.add(currentYear);
    if (historyEntries && Array.isArray(historyEntries)) {
      historyEntries.forEach((entry: any) => {
        const yr = entry?.form_json?.year;
        if (yr) years.add(String(yr));
      });
    }
    // Also include past two years so users can always reach them
    const cy = Number(currentYear);
    years.add(String(cy - 1));
    years.add(String(cy - 2));
    return Array.from(years).sort((a, b) => Number(b) - Number(a)); // newest first
  }, [historyEntries, currentYear]);

  // Fetch draft form details when mode="draft" or mode="view" or mode="edit" and consentUuid exists
  const { data: draftFormDetails, dataUpdatedAt } = useQuery({
    ...getConsentFormDetailOptions({
      path: {
        uuid: consentUuid!,
      },
      query: {
        history: false,
      },
    }),
    enabled: open && (mode === "draft" || mode === "view" || mode === "edit") && !!consentUuid && !historyEntry,
    staleTime: 0,
    select: (data: any) => {
      // Backend response structure:
      // { status: "success", code: 200, message: "...", data: { form: {...}, entries: [{ form_json: {...}, ... }] } }
      const responseData = data?.data ?? data;
      if (responseData) {
        // Extract form_json from entries array (first entry is the latest)
        const entries = responseData.entries || [];
        const latestEntry = entries[0] || null;
        const formJson = latestEntry?.form_json || responseData.form_json || {};
        return {
          ...responseData,
          form_json: formJson,
        };
      }
      return null;
    },
  });

  // If historyEntry is provided, use it directly
  const formDataToUse = historyEntry 
    ? { form_json: historyEntry.form_json || {} }
    : draftFormDetails;

  // ------------- Year-wise tracking (after queries are declared) ---------------

  // When the form opens, sync selectedYear from the loaded entry's year field
  useEffect(() => {
    if (!open) {
      setSelectedYear(currentYear);
      return;
    }
    const yr = formDataToUse?.form_json?.year;
    if (yr) setSelectedYear(String(yr));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, formDataToUse?.form_json?.year]);

  // When the user picks a different year, load that year's data from historyEntries
  const handleYearChange = useCallback(
    (newYear: string) => {
      setSelectedYear(newYear);
      setValue("year", newYear, { shouldDirty: true });

      // Find the matching historical entry for this year
      const match = historyEntries?.find(
        (entry: any) => String(entry?.form_json?.year) === newYear,
      );

      if (match?.form_json && typeof match.form_json === "object") {
        const defaults = buildDefaultValues();
        reset({ ...defaults, ...match.form_json, year: newYear });
      } else {
        // No saved data for this year — start with a blank form pre-set to that year
        const defaults = buildDefaultValues();
        reset({ ...defaults, year: newYear });
      }
    },
    [historyEntries, setValue, reset],
  );


  // Fetch existing consent form when drawer opens (for non-draft mode)
  const { data: existingFormData } = useQuery({
    ...listConsentFormsOptions({
      query: {
        resident_uuid: residentUuid,
      },
    }),
    // Disabled in edit mode – we prefill from the specific consentUuid instead
    enabled: open && !!residentUuid && mode !== "draft" && mode !== "edit",
    select: (data: any) => {
      // Handle different response structures
      const forms = Array.isArray(data) 
        ? data 
        : (data?.results || data?.data || (data && typeof data === 'object' ? [data] : []));
      
      // Find the form with matching form_code
      const form = forms.find((form: any) => form.form_code === FORM_CODE);
      
      // Extract form_json from latest_entry if it exists, otherwise from form directly
      if (form) {
        return {
          ...form,
          form_json: form.latest_entry?.form_json || form.form_json || {},
        };
      }
      return null;
    },
  });

  // Prefill form when draft details are loaded (using setValue as per requirement)
  useEffect(() => {
    if (!open) {
      lastPrefillTimestampRef.current = 0;
      return;
    }

    if ((mode === "draft" || mode === "view" || mode === "edit") && formDataToUse?.form_json && dataUpdatedAt !== lastPrefillTimestampRef.current) {
      const formJson = formDataToUse.form_json;
      if (formJson && typeof formJson === "object" && Object.keys(formJson).length > 0) {
        // Use setValue for each field (as per requirement)
        Object.entries(formJson).forEach(([key, value]) => {
          try {
            if (value !== null && value !== undefined) {
              // Handle all fields (strings, numbers, booleans, including empty strings)
              setValue(key as any, value, { shouldValidate: false, shouldDirty: false });
            }
          } catch (error) {
            console.error(`Error setting field ${key}:`, error, value);
          }
        });
        lastPrefillTimestampRef.current = dataUpdatedAt;
      }
    }
  }, [open, mode, formDataToUse, dataUpdatedAt, setValue]);

  // Reset form when existing form data is loaded (for non-draft mode)
  useEffect(() => {
    if (!open) {
      hasResetFormRef.current = false;
      return;
    }

    if (mode !== "draft" && mode !== "edit" && existingFormData?.form_json && !hasResetFormRef.current) {
      const formJson = existingFormData.form_json;
      if (formJson && typeof formJson === "object" && Object.keys(formJson).length > 0) {
        // Reset form with existing data
        const defaultValues = buildDefaultValues();
        reset({ ...defaultValues, ...formJson });
        hasResetFormRef.current = true;
      }
    }
    // Reset the ref when drawer closes
    if (!open) {
      hasResetFormRef.current = false;
    }
  }, [open, mode, existingFormData, reset]);

  // ─── Per-month BMI auto-calculation ───────────────────────────────────────
  // Fires when any month’s height or weight changes.
  // Only overwrites bmi_m if height+weight are present; manual edits persist
  // until height/weight are changed again.
  useEffect(() => {
    MONTHS.forEach((m) => {
      const ft      = parseFloat(String(allMonthValues[`heightFt_${m}`])) || 0;
      const inches  = parseFloat(String(allMonthValues[`heightIn_${m}`])) || 0;
      const weight  = parseFloat(String(allMonthValues[`weight_${m}`]))   || 0;
      const totalIn = ft * 12 + inches;
      if (totalIn > 0 && weight > 0) {
        const bmi = ((weight / (totalIn * totalIn)) * 703).toFixed(1);
        setValue(`bmi_${m}` as any, bmi, { shouldDirty: false, shouldValidate: false });
      }
    });
  // monthPhysicalData changes only when height/weight fields change, keeping BMI in sync.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthPhysicalData, setValue]);

  // ─── Vitals section (summary) BMI auto-calculation ─────────────────────────────
  // Formula: BMI = (weight_lbs / totalInches²) × 703
  // Recalculates whenever height (ft/in) or weight changes.
  // The BMI field stays editable so the user can manually override.
  useEffect(() => {
    const ft     = parseFloat(String(watchedHeightFt)) || 0;
    const inches = parseFloat(String(watchedHeightIn)) || 0;
    const weight = parseFloat(String(watchedWeight))   || 0;
    const totalInches = ft * 12 + inches;
    if (totalInches > 0 && weight > 0) {
      const bmi = (weight / (totalInches * totalInches)) * 703;
      setValue("bmi", bmi.toFixed(1), { shouldDirty: false, shouldValidate: false });
    }
  }, [watchedHeightFt, watchedHeightIn, watchedWeight, setValue]);

  // Create consent form mutation (for new forms)
  const createConsentFormMutationHook = useMutation({
    ...(createConsentFormMutation() as any),
    onSuccess: (data: unknown) => {
      const backendMessage = getBackendMessage(data);
      if (backendMessage) {
        setSnackbar({
          isOpen: true,
          message: backendMessage,
          status: "success",
        });
      }

      // Invalidate consent forms list to refresh data
      if (residentUuid) {
        queryClient.invalidateQueries({
          queryKey: listConsentFormsQueryKey({
            query: {
              resident_uuid: residentUuid,
            },
          }),
        });
      }

      // Call parent callbacks
      onAfterSubmit?.();
      onAfterSave?.();

      // Close drawer after success
      setTimeout(() => {
        onClose?.();
      }, 1000);
    },
    onError: (error: AxiosError<any>) => {
      const errorMessage = getErrorMessage(error);
      if (errorMessage) {
        setSnackbar({
          isOpen: true,
          message: errorMessage,
          status: "error",
        });
      }
    },
  });

  // Update consent form mutation (for draft forms)
  const updateConsentFormMutationHook = useMutation({
    ...(updateConsentFormMutation() as any),
    onSuccess: (data: unknown) => {
      const backendMessage = getBackendMessage(data);
      if (backendMessage) {
        setSnackbar({
          isOpen: true,
          message: backendMessage,
          status: "success",
        });
      }

      // Invalidate consent forms list to refresh data
      if (residentUuid) {
        queryClient.invalidateQueries({
          queryKey: listConsentFormsQueryKey({
            query: {
              resident_uuid: residentUuid,
            },
          }),
        });
      }

      // Invalidate consent form detail cache so next open fetches latest draft data
      if (consentUuid) {
        queryClient.invalidateQueries({
          queryKey: getConsentFormDetailOptions({
            path: { uuid: consentUuid },
            query: { history: false },
          }).queryKey,
        });
      }

      // Call parent callbacks
      onAfterSubmit?.();
      onAfterSave?.();

      // Close drawer after success
      setTimeout(() => {
        onClose?.();
      }, 1000);
    },
    onError: (error: AxiosError<any>) => {
      const errorMessage = getErrorMessage(error);
      if (errorMessage) {
        setSnackbar({
          isOpen: true,
          message: errorMessage,
          status: "error",
        });
      }
    },
  });

  const onSubmit = async (data: any, status: "COMPLETED" | "DRAFT" = "COMPLETED") => {
    if (mode === "view") return; // Prevent submission in view mode
    if (!residentUuid) {
      setSnackbar({
        isOpen: true,
        message: "Resident UUID is required",
        status: "error",
      });
      return;
    }

    try {
      // Build form_json payload - all form fields go here
      const form_json: Record<string, any> = { ...data };

      // Remove empty string values (but keep null, booleans, arrays)
      Object.keys(form_json).forEach((key) => {
        if (form_json[key] === "" || form_json[key] === undefined) {
          delete form_json[key];
        }
      });

      // If mode is "draft" and consentUuid exists, use UPDATE mutation (PUT)
      // edit mode: PUT creates a new version on top of the existing completed entry
      if ((mode === "draft" || mode === "edit") && consentUuid) {
        // Update existing draft form
        const updatePayload = {
          path: {
            uuid: consentUuid,
          },
          body: {
            status: status, // COMPLETED when saving, DRAFT when saving as draft
            form_json: form_json,
            ...(status === "COMPLETED" ? { filled_at: new Date().toISOString() } : {}),
          },
        };

        updateConsentFormMutationHook.mutate(updatePayload as any);
      } else {
        // Create new form (existing behavior) - POST
        const createPayload = {
          body: {
            resident_uuid: residentUuid,
            form_name: formName,
            form_code: FORM_CODE,
            frequency_type: "ONCE",
            status: status,
            filled_at: new Date().toISOString(),
            form_json: form_json,
          },
        };

        createConsentFormMutationHook.mutate(createPayload as any);
      }
    } catch (error) {
      console.error("Error preparing form data:", error);
      const errorMessage = getErrorMessage(error);
      if (errorMessage) {
        setSnackbar({
          isOpen: true,
          message: errorMessage,
          status: "error",
        });
      }
    }
  };

  const handleSaveDraft = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    onSubmit(getValues(), "DRAFT");
  };

  // Reset mutations when form closes to prevent stuck disabled buttons upon reopening
  useEffect(() => {
    if (!open) {
      createConsentFormMutationHook.reset();
      updateConsentFormMutationHook.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const cellSelectSx = {
    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
    "&:hover .MuiOutlinedInput-notchedOutline": { border: "none" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { border: "none" },
    "& .MuiSelect-select": {
      padding: "4px 8px",
      fontSize: "14px",
      textAlign: "center" as const,
    },
    minWidth: "64px",
    height: "32px",
    backgroundColor: "#FFFFFF",
  };

  const menuProps = useMemo(
    () => ({
      disablePortal: false,
      keepMounted: false,
      container: document.body,
      disableScrollLock: true,
      // Apply z-index to the Menu (Popover) root so it renders above the Drawer (z-index 1200)
      sx: { zIndex: 9999 },
      anchorOrigin: {
        vertical: 'bottom' as const,
        horizontal: 'left' as const,
      },
      transformOrigin: {
        vertical: 'top' as const,
        horizontal: 'left' as const,
      },
      PaperProps: {
        sx: {
          maxHeight: 200,
          zIndex: 9999,
          backgroundColor: "#ffffff",
          color: "#212121",
          border: "1px solid #E5E7EB",
          boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
          borderRadius: "4px",
          "& .MuiMenuItem-root": {
            minHeight: "32px",
            padding: "6px 14px",
            color: "#212121",
            fontSize: "13px",
            "&:hover": { backgroundColor: "#F3F4F6" },
            "&.Mui-selected": { backgroundColor: "#E3F2FD" },
          },
        },
      },
      MenuListProps: {
        sx: {
          padding: "4px 0",
          backgroundColor: "#ffffff",
        },
      },
    }),
    []
  );






  const tableHeaderBg = "#F2F7FA";
  const borderColor = "#E5E7EB";

  // Sticky first column for horizontal scroll only (no vertical scroll)
  const stickyFirstColHeaderSx = {
    position: "sticky",
    left: 0,
    zIndex: 8,
    backgroundColor: tableHeaderBg,
    minWidth: 280,
    width: 280,
    borderRight: `1px solid ${borderColor}`,
  };

  const stickyFirstColBodySx = {
    position: "sticky",
    left: 0,
    zIndex: 5,
    backgroundColor: "#FFFFFF",
    minWidth: 280,
    width: 280,
    borderRight: `1px solid ${borderColor}`,
  };

  const monthHeaderSx = {
    backgroundColor: tableHeaderBg,
    minWidth: 120,
    width: 120,
    textAlign: "center" as const,
    borderRight: `1px solid ${borderColor}`,
  };

  const monthBodySx = {
    minWidth: 120,
    width: 120,
    textAlign: "center" as const,
    borderRight: `1px solid ${borderColor}`,
    padding: "6px 8px",
  };

  // Drag to scroll handlers for months table
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tableScrollRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - tableScrollRef.current.offsetLeft;
    scrollLeftRef.current = tableScrollRef.current.scrollLeft;
    tableScrollRef.current.style.cursor = "grabbing";
  };

  const handleMouseLeave = () => {
    if (!tableScrollRef.current) return;
    isDraggingRef.current = false;
    tableScrollRef.current.style.cursor = "grab";
  };

  const handleMouseUp = () => {
    if (!tableScrollRef.current) return;
    isDraggingRef.current = false;
    tableScrollRef.current.style.cursor = "grab";
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !tableScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - tableScrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 2; // Scroll speed multiplier
    tableScrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#FFFFFF",
      }}
    >


      {/* Individual Info Bar */}
      <Box
        sx={{
          px: 3,
          py: 1.5,
          backgroundColor: "#F5F7FA",
          borderBottom: "1px solid #E3ECEF",
          flexShrink: 0,
        }}
      >
        <CustomLabel
          label={`Individual's Name : ${residentName || "N/A"}`}
          style={{ fontSize: "14px", color: "#424342", marginBottom: "4px" }}
        />
      </Box>

      {/* Scrollable Form Content (vertical) */}
      <Box
        sx={{
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          backgroundColor: "#FFFFFF",
        }}
      >
        {/* Basic Information */}
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            padding: "12px 16px",
            border: "1px solid #E3ECEF",
            borderRadius: "8px",
          }}
        >
          <Typography sx={{ fontSize: "16px", fontWeight: 600, color: "#212121", mb: "12px" }}>
            Basic Information
          </Typography>

          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <CustomLabel label="Resident Name" />
              <CustomInput
                placeholder="Enter"
                name="residentName"
                value={residentName || ""}
                onChange={() => {}}
                disableField
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 3 }}>
              <CustomLabel label="ID" />
              <CustomInput
                placeholder="Enter"
                name="id"
                value={residentData?.referral_number?.toString() || residentData?.id?.toString() || residentId?.toString() || ""}
                onChange={() => {}}
                disableField
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 3 }}>
              <CustomLabel label="Source" />
              <Controller
                name="source"
                control={control}
                render={({ field }) => (
                  <CustomInput
                    placeholder="Enter"
                    name="source"
                    value={field.value || ""}
                    onChange={field.onChange}
                    disableField={mode === "view"}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 3 }}>
              <CustomLabel label="Year" />
              <Controller
                name="year"
                control={control}
                render={({ field }) => (
                  <CustomInput
                    placeholder="Enter year "
                    name="year"
                    value={field.value || ""}
                    onChange={field.onChange}
                    isNumeric
                    disableField={mode === "view"}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Monthly Tracking Grid */}
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            border: "1px solid #E3ECEF",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <Typography
            sx={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#212121",
              padding: "16px",
              borderBottom: "1px solid #E3ECEF",
            }}
          >
            Monthly Tracking Grid
          </Typography>

          {/* Horizontal scroll only for months - visible scrollbar with drag-to-scroll */}
          <Box
            ref={tableScrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            sx={{
              width: "100%",
              overflowX: "auto",
              overflowY: "visible",
              scrollbarWidth: "thin",
              "&::-webkit-scrollbar": {
                height: "8px",
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "#f1f1f1",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#888",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb:hover": {
                backgroundColor: "#555",
              },
              cursor: "grab",
              userSelect: "none",
              "&:active": {
                cursor: "grabbing",
              },
            }}
          >
            <TableContainer
              sx={{
                width: "100%",
                overflow: "visible",
              }}
            >
              <Table
                stickyHeader
                sx={{
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  minWidth: 280 + 12 * 120, // 1720 width
                  overflow: "visible",
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        ...stickyFirstColHeaderSx,
                        fontWeight: 600,
                        fontSize: "13px",
                        color: "#212121",
                        borderBottom: `1px solid ${borderColor}`,
                      }}
                    >
                      Rating Item
                    </TableCell>

                    {MONTHS.map((m) => {
                      const isCurrent = currentMonthLabel === m;
                      return (
                        <TableCell
                          key={m}
                          ref={(el) => { monthRefs.current[m] = el as HTMLTableCellElement | null; }}
                          sx={{
                            ...monthHeaderSx,
                            fontWeight: 600,
                            fontSize: "13px",
                            color: "#212121",
                             borderBottom: `1px solid ${borderColor}`,
                          }}
                        >
                          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.25 }}>
                            <span>{m}</span>
                            {isCurrent && (
                              <Typography sx={{ fontSize: "10px", color: "#6B7280", lineHeight: "12px" }}>
                                Current Month
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {RATING_ITEMS.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell
                        sx={{
                          ...stickyFirstColBodySx,
                          borderBottom: `1px solid ${borderColor}`,
                          padding: "10px 12px",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography
                            sx={{
                              fontSize: "13px",
                              color: "#212121",
                              fontWeight: 500,
                              textAlign: "left",
                            }}
                          >
                            {item.id}. {item.label}
                          </Typography>

                          <Tooltip title={<span style={{ whiteSpace: "pre-line" }}>{ratingScaleTooltip}</span>} arrow>
                            <Info sx={{ fontSize: "16px", color: "#6B7280", cursor: "help" }} />
                          </Tooltip>
                        </Box>
                      </TableCell>

                      {MONTHS.map((m) => {
                        const fieldName = `${item.id}_${m}`;
                        return (
                          <TableCell
                            key={fieldName}
                            sx={{
                              ...monthBodySx,
                              borderBottom: `1px solid ${borderColor}`,
                              backgroundColor: "#FFFFFF",
                              overflow: "visible",
                              position: "relative",
                            }}
                          >
                            <Box onClick={(e) => e.stopPropagation()}>
                              <Controller
                                name={fieldName as any}
                                control={control}
                                render={({ field }) => (
                                  <Select
                                    {...field}
                                    value={field.value !== undefined && field.value !== "" ? String(field.value) : ""}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    displayEmpty
                                    disabled={mode === "view"}
                                    sx={cellSelectSx}
                                    MenuProps={menuProps as any}
                                  >
                                    <MenuItem value=""><em>-</em></MenuItem>
                                    <MenuItem value="0">0</MenuItem>
                                    <MenuItem value="1">1</MenuItem>
                                    <MenuItem value="2">2</MenuItem>
                                    <MenuItem value="3">3</MenuItem>
                                    <MenuItem value="4">4</MenuItem>
                                  </Select>
                                )}
                              />
                            </Box>

                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}

                  {/* ── Monthly Vitals Section ───────────────────────── */}
                  <TableRow>
                    <TableCell
                      sx={{
                        ...stickyFirstColBodySx,
                        backgroundColor: "#EEF4F8",
                        padding: "6px 16px",
                        borderBottom: `1px solid ${borderColor}`,
                        borderTop: `2px solid #C8DFF0`,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#5B7FA6",
                          textTransform: "uppercase",
                          letterSpacing: "0.8px",
                        }}
                      >
                        Monthly Vitals
                      </Typography>
                    </TableCell>
                    <TableCell
                      colSpan={MONTHS.length}
                      sx={{
                        backgroundColor: "#EEF4F8",
                        borderBottom: `1px solid ${borderColor}`,
                        borderTop: `2px solid #C8DFF0`,
                        padding: 0,
                      }}
                    />
                  </TableRow>

                  {/* ── Height row: ft and in in the same row per month column ── */}
                  <TableRow hover>
                    <TableCell
                      sx={{
                        ...stickyFirstColBodySx,
                        borderBottom: `1px solid ${borderColor}`,
                        padding: "10px 12px",
                      }}
                    >
                      <Typography
                        sx={{ fontSize: "13px", color: "#212121", fontWeight: 500 }}
                      >
                        Height
                      </Typography>
                    </TableCell>

                    {MONTHS.map((m) => (
                      <TableCell
                        key={`height_${m}`}
                        sx={{
                          ...monthBodySx,
                          borderBottom: `1px solid ${borderColor}`,
                          backgroundColor: "#FFFFFF",
                          overflow: "visible",
                          position: "relative",
                          padding: "4px 6px",
                        }}
                      >
                        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                          {/* ft input */}
                          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", flex: 1 }}>
                            <Controller
                              name={`heightFt_${m}` as any}
                              control={control}
                              render={({ field }) => (
                                <input
                                  type="number"
                                  min="0"
                                  value={field.value !== undefined && field.value !== "" ? String(field.value) : ""}
                                  onChange={(e) => field.onChange(e.target.value)}
                                  disabled={mode === "view"}
                                  placeholder="-"
                                  style={{
                                    width: "100%",
                                    height: "26px",
                                    border: "none",
                                    background: "transparent",
                                    textAlign: "center",
                                    fontSize: "12px",
                                    color: mode === "view" ? "#636262" : "#212121",
                                    outline: "none",
                                    padding: "1px 2px",
                                    boxSizing: "border-box",
                                    cursor: mode === "view" ? "default" : "text",
                                  }}
                                />
                              )}
                            />
                            <Typography sx={{ fontSize: "10px", color: "#9CA3AF", lineHeight: 1, ml: "1px" }}>ft</Typography>
                          </Box>

                          {/* in input */}
                          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", flex: 1 }}>
                            <Controller
                              name={`heightIn_${m}` as any}
                              control={control}
                              render={({ field }) => (
                                <input
                                  type="number"
                                  min="0"
                                  value={field.value !== undefined && field.value !== "" ? String(field.value) : ""}
                                  onChange={(e) => field.onChange(e.target.value)}
                                  disabled={mode === "view"}
                                  placeholder="-"
                                  style={{
                                    width: "100%",
                                    height: "26px",
                                    border: "none",
                                    background: "transparent",
                                    textAlign: "center",
                                    fontSize: "12px",
                                    color: mode === "view" ? "#636262" : "#212121",
                                    outline: "none",
                                    padding: "1px 2px",
                                    boxSizing: "border-box",
                                    cursor: mode === "view" ? "default" : "text",
                                  }}
                                />
                              )}
                            />
                            <Typography sx={{ fontSize: "10px", color: "#9CA3AF", lineHeight: 1, ml: "1px" }}>in</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* ── Weight row ── */}
                  <TableRow hover>
                    <TableCell
                      sx={{
                        ...stickyFirstColBodySx,
                        borderBottom: `1px solid ${borderColor}`,
                        padding: "10px 12px",
                      }}
                    >
                      <Typography
                        sx={{ fontSize: "13px", color: "#212121", fontWeight: 500 }}
                      >
                        Weight (lbs)
                      </Typography>
                    </TableCell>

                    {MONTHS.map((m) => (
                      <TableCell
                        key={`weight_${m}`}
                        sx={{
                          ...monthBodySx,
                          borderBottom: `1px solid ${borderColor}`,
                          backgroundColor: "#FFFFFF",
                          overflow: "visible",
                          position: "relative",
                          padding: "4px 6px",
                        }}
                      >
                        <Controller
                          name={`weight_${m}` as any}
                          control={control}
                          render={({ field }) => (
                            <input
                              type="number"
                              min="0"
                              value={field.value !== undefined && field.value !== "" ? String(field.value) : ""}
                              onChange={(e) => field.onChange(e.target.value)}
                              disabled={mode === "view"}
                              placeholder="-"
                              style={{
                                width: "100%",
                                height: "30px",
                                border: "none",
                                background: "transparent",
                                textAlign: "center",
                                fontSize: "13px",
                                color: mode === "view" ? "#636262" : "#212121",
                                outline: "none",
                                padding: "2px 4px",
                                boxSizing: "border-box",
                                cursor: mode === "view" ? "default" : "text",
                              }}
                            />
                          )}
                        />
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* ── BMI row – auto-calculated, still editable ── */}
                  <TableRow hover>
                    <TableCell
                      sx={{
                        ...stickyFirstColBodySx,
                        borderBottom: `1px solid ${borderColor}`,
                        padding: "10px 12px",
                      }}
                    >
                      <Typography sx={{ fontSize: "13px", color: "#212121", fontWeight: 500 }}>
                        BMI
                      </Typography>
                    </TableCell>

                    {MONTHS.map((m) => (
                      <TableCell
                        key={`bmi_${m}`}
                        sx={{
                          ...monthBodySx,
                          borderBottom: `1px solid ${borderColor}`,
                          backgroundColor: "#FFFFFF",
                          overflow: "visible",
                          position: "relative",
                          padding: "4px 6px",
                        }}
                      >
                        <Controller
                          name={`bmi_${m}` as any}
                          control={control}
                          render={({ field }) => (
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={
                                field.value !== undefined && field.value !== ""
                                  ? String(field.value)
                                  : ""
                              }
                              onChange={(e) => field.onChange(e.target.value)}
                              disabled={mode === "view"}
                              placeholder="-"
                              style={{
                                width: "100%",
                                height: "30px",
                                border: "none",
                                background: "transparent",
                                textAlign: "center",
                                fontSize: "13px",
                                color: mode === "view" ? "#636262" : "#1E6DB7",
                                fontWeight: field.value ? 600 : 400,
                                outline: "none",
                                padding: "2px 4px",
                                boxSizing: "border-box",
                                cursor: mode === "view" ? "default" : "text",
                              }}
                            />
                          )}
                        />
                      </TableCell>
                    ))}
                  </TableRow>

                </TableBody>

              </Table>
            </TableContainer>
          </Box>
        </Paper>



        {/* Note */}
        <Box>
          <Typography sx={{ fontSize: "14px", fontWeight: 500, color: "#212121", mb: "8px" }}>
            PLEASE NOTE – The person(s) completing the MDT generally does not have extensive HRST training.
          </Typography>
          <Typography sx={{ fontSize: "14px", fontWeight: 400, color: "#DC2626", lineHeight: "1.6" }}>
            It is the responsibility of the trained HRST Rater to verify accuracy of scoring prior to updating the HRST
            web-based application.
          </Typography>
        </Box>
      </Box>

      {/* Sticky Footer inside Form */}
      <Box
        sx={{
          position: "sticky",
          bottom: 0,
          zIndex: 15,
          backgroundColor: "#FFFFFF",
          borderTop: "1px solid #E3ECEF",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 2,
          padding: "16px 24px",
          flexShrink: 0,
          boxShadow: "0px -2px 8px rgba(0,0,0,0.05)",
        }}
      >
      {(() => {
          const isSaving =
            createConsentFormMutationHook.isPending ||
            updateConsentFormMutationHook.isPending ||
            createConsentFormMutationHook.isSuccess ||
            updateConsentFormMutationHook.isSuccess;
          return (
            <>
              <CustomButton variant="secondary" onClick={onClose} disabled={mode === "view" || isSaving}>
                Cancel
              </CustomButton>

              {mode !== "view" && (
                <CustomButton variant="secondary" size="md" onClick={handleSaveDraft} disabled={isSaving}>
                  Save as Draft
                </CustomButton>
              )}

              <CustomButton
                variant="primary"
                onClick={handleSubmit(
                  (data) => onSubmit(data, "COMPLETED"),
                  () =>
                    setSnackbar({
                      isOpen: true,
                      message: "Please fill all required fields.",
                      status: "error",
                    })
                )}
                disabled={mode === "view" || isSaving}
              >
                {isSaving ? 'Saving…' : 'Save'}
              </CustomButton>
            </>
          );
        })()}
      </Box>

      <CommonSnackbar
        isOpen={snackbar.isOpen}
        message={snackbar.message}
        status={snackbar.status}
        onClose={() => setSnackbar({ ...snackbar, isOpen: false })}
      />
    </Box>
  );
};

export default MonthlyDataTrackerHRSTForm;
