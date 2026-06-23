import React, { useState, useEffect } from "react";
import {
  Grid,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import dayjs, { type Dayjs } from "dayjs";
import { useMutation, useQueryClient, type DefaultError } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { moveOutLeadMutation, listResidentsOptions, getLeadDetailQueryKey } from "../../../sdk/@tanstack/react-query.gen";
import { useQuery } from "@tanstack/react-query";
import CustomDrawer from "../../../components/custom-drawer/custom-drawer";
import CustomInput from "../../../components/custom-input/custom-input";
import CustomButton from "../../../components/custom-buttons/custom-buttons";
import CustomLabel from "../../../components/custom-label/custom-label";
import DatePickerField from "../../../components/date-picker-field/date-picker-field";
import CommonSnackbar from "../../../components/common-snackbar/common-snackbar";

/**
 * Extract backend message only (for custom snackbar)
 * Returns ONLY backend-provided message, no frontend-invented text
 */
function getBackendMessage(error: unknown): string | undefined {
  const err = error as AxiosError<any> | any;
  const data = err?.response?.data ?? err?.data;
  if (!data) return undefined;

  // Standard / custom structured message keys
  const direct = data.message ?? data.error ?? data.detail;
  if (typeof direct === "string" && direct.trim()) return direct;

  // DRF field / non-field validation errors:
  //   { check_out_date: ["Check-out date cannot be in the future."] }
  //   { non_field_errors: ["..."] }
  if (typeof data === "object") {
    const collected: string[] = [];
    for (const value of Object.values(data)) {
      if (typeof value === "string") {
        collected.push(value);
      } else if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === "string") collected.push(item);
        }
      }
    }
    if (collected.length) return collected.join(" ");
  }

  return undefined;
}

// Form validation schema
const moveOutFormSchema = yup.object({
  checkOutDate: yup
    .mixed()
    .required("Check-out date is required")
    .nullable()
    .test(
      "is-valid-date",
      "Invalid date",
      (value) => !value || (dayjs.isDayjs(value) && value.isValid())
    )
    .test(
      "not-future",
      "Check-out date cannot be in the future",
      (value) => {
        if (!value || !dayjs.isDayjs(value)) return true;
        return !value.startOf("day").isAfter(dayjs().startOf("day"));
      }
    ),
  reason: yup
    .string()
    .required("Reason is required")
    .trim()
    .min(3, "Reason must be at least 3 characters"),
});

type MoveOutFormData = yup.InferType<typeof moveOutFormSchema>;

interface MoveOutDrawerProps {
  open: boolean;
  onClose: () => void;
  assignmentUuid?: string;
  leadUuid?: string; // Fallback to fetch assignment_uuid if not provided
}

const MoveOutDrawer: React.FC<MoveOutDrawerProps> = ({
  open,
  onClose,
  assignmentUuid,
  leadUuid,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const queryClient = useQueryClient();

  // Fetch assignment_uuid from listResidents if not provided and leadUuid is available
  const { data: residentsData } = useQuery({
    ...listResidentsOptions({
      query: {
        page: 1,
        size: 1,
        status: "ACTIVE",
      },
    }),
    enabled: open && !assignmentUuid && !!leadUuid,
    select: (data: any) => {
      const residents = data?.data?.results || data?.results || [];
      // Find the resident with matching lead_uuid
      const resident = residents.find((r: any) => r.lead_uuid === leadUuid);
      return resident?.assignment_uuid;
    },
  });

  // Use provided assignmentUuid or fetched one
  const finalAssignmentUuid = assignmentUuid || residentsData;

  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
    status: "success" | "error";
  }>({
    isOpen: false,
    message: "",
    status: "success",
  });

  // Mirrors the date picker's internal validation (e.g. a future date that MUI
  // rejects without emitting via onChange). Used to gate submission so the form
  // can't be submitted with a stale value while an error is visible.
  const [checkOutDateError, setCheckOutDateError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<MoveOutFormData>({
    resolver: yupResolver(moveOutFormSchema) as any,
    defaultValues: {
      checkOutDate: null,
      reason: "",
    },
    mode: "onChange",
    shouldUnregister: true, // ⭐ IMPORTANT
  });


  // Reset form when drawer opens
  useEffect(() => {
    if (open) {
      reset({
        checkOutDate: null,
        reason: "",
      });
      setCheckOutDateError(null);
    }
  }, [open]);


  // Watch required fields to determine if save button should be enabled.
  // Also require the date picker's own validation to pass — MUI may flag a
  // future date without updating the form value, so isValid alone isn't enough.
  const isFormValid = isValid && !checkOutDateError;

  // Move out mutation
  const moveOutMutation = useMutation({
    ...moveOutLeadMutation(),
    onSuccess: async (data: { [key: string]: unknown }) => {
      const responseData = data as any;

      const backendMessage =
        responseData?.message ??
        responseData?.data?.message ??
        responseData?.detail ??
        undefined;

      // Show snackbar with backend message only
      if (backendMessage) {
        setSnackbar({
          isOpen: true,
          message: backendMessage,
          status: "success",
        });
      }

      // Invalidate all listResidents queries to refresh all resident lists (including moved out residents)
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          if (Array.isArray(key) && key[0] && typeof key[0] === 'object') {
            return (key[0] as any)?._id === 'listResidents';
          }
          return false;
        },
      });

      // Explicitly refetch all enabled listResidents queries, especially the moved out residents drawer
      // This ensures the moved out residents list updates immediately even if the drawer is already open
      // refetchQueries will automatically only refetch enabled queries
      await queryClient.refetchQueries({
        predicate: (query) => {
          const key = query.queryKey;
          if (Array.isArray(key) && key[0] && typeof key[0] === 'object') {
            const queryId = (key[0] as any)?._id;
            // Refetch all listResidents queries
            return queryId === 'listResidents';
          }
          return false;
        },
      });

      // Invalidate getLeadDetail query to refresh resident profile page
      // This ensures the API is called and status updates immediately
      if (leadUuid) {
        queryClient.invalidateQueries({
          queryKey: getLeadDetailQueryKey({
            path: { uuid: leadUuid },
          }),
        });
      }

      // Reset form and close drawer after success
      setTimeout(() => {
        reset({
          checkOutDate: null,
          reason: "",
        });
        onClose();
      }, 1000);
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
  });

  const handleFormSubmit = async (data: MoveOutFormData) => {
    if (!finalAssignmentUuid) {
      setSnackbar({
        isOpen: true,
        message: "Assignment UUID is required. Please ensure the resident has an active assignment.",
        status: "error",
      });
      return;
    }

    // Format date to YYYY-MM-DD
    const checkOutDateFormatted = data.checkOutDate && dayjs.isDayjs(data.checkOutDate)
      ? data.checkOutDate.format('YYYY-MM-DD')
      : null;

    if (!checkOutDateFormatted) {
      setSnackbar({
        isOpen: true,
        message: "Check-out date is required",
        status: "error",
      });
      return;
    }

    // Block submission while the date picker is reporting a validation error
    // (e.g. a manually-typed future date MUI rejected without updating the form).
    if (checkOutDateError) {
      setSnackbar({
        isOpen: true,
        message: checkOutDateError,
        status: "error",
      });
      return;
    }

    // Defense-in-depth: never submit a future check-out date, even if the
    // form value drifted from what the date picker displays. Mirrors the
    // backend rule (MoveOutSerializer.validate_check_out_date).
    if (dayjs(checkOutDateFormatted).startOf("day").isAfter(dayjs().startOf("day"))) {
      setSnackbar({
        isOpen: true,
        message: "Check-out date cannot be in the future",
        status: "error",
      });
      return;
    }

    // Call the mutation
    moveOutMutation.mutate({
      path: { assignment_uuid: finalAssignmentUuid },
      body: {
        check_out_date: checkOutDateFormatted,
        reason: data.reason || null,
      },
    });
  };

  const handleCancel = () => {
    reset({
      checkOutDate: null,
      reason: "",
    });
    onClose();
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <CustomDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      drawerWidth={isMobile ? "100%" : isTablet ? "500px" : "640px"}
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
            Moved-out Resident
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{
              padding: "4px",
              color: "#757775",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              },
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
            sx={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            {/* Check-out Date */}
            <Grid
              size={{ xs: 12 }}
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <CustomLabel label="Check-out Date" isRequired />
              <Controller
                name="checkOutDate"
                control={control}
                render={({ field, fieldState }) => (
                  <DatePickerField
                    name="checkOutDate"
                    value={field.value as Dayjs | null}
                    onChange={field.onChange}
                    useCustomStyle={false}
                    hasError={!!fieldState.error}
                    errorMessage={fieldState.error?.message}
                    onValidationChange={setCheckOutDateError}
                    disableFuture
                    slotProps={{
                      popper: {
                        disablePortal: true,
                      },
                    }}
                  />
                )}
              />
            </Grid>

            {/* Reason */}
            <Grid
              size={{ xs: 12 }}
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <CustomLabel label="Reason" isRequired />
              <Controller
                name="reason"
                control={control}
                render={({ field }) => (
                  <CustomInput
                    placeholder="Enter reason"
                    name={field.name}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    hasError={!!errors.reason}
                    errorMessage={errors.reason?.message}
                    bgWhite
                    multiline
                    rows={4}
                  />
                )}
              />
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
            disabled={moveOutMutation.isPending}
          >
            Cancel
          </CustomButton>
          <CustomButton
            variant="primary"
            size="md"
            onClick={handleSubmit(handleFormSubmit)}
            disabled={!isFormValid || moveOutMutation.isPending}
          >
            {moveOutMutation.isPending ? "Moving Out..." : "Move Out"}
          </CustomButton>
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
      {snackbar.isOpen && (
        <CommonSnackbar
          isOpen={snackbar.isOpen}
          message={snackbar.message}
          status={snackbar.status}
          onClose={handleSnackbarClose}
          autoClose={true}
          autoCloseDelay={5000}
        />
      )}
    </CustomDrawer>
  );
};

export default MoveOutDrawer;

