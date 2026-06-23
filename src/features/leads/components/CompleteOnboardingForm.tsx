import { useEffect, useImperativeHandle, forwardRef, useCallback } from "react";
import { Typography, Grid, Box, Tooltip } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import dayjs, { type Dayjs } from "dayjs";
import CustomInput from "../../../components/custom-input/custom-input";
import CustomButton from "../../../components/custom-buttons/custom-buttons";
import CustomLabel from "../../../components/custom-label/custom-label";
import CustomSelect from "../../../components/custom-select/custom-select";
import DatePickerField from "../../../components/date-picker-field/date-picker-field";
import { usePermission } from "../../../hooks/usePermission";

// Form validation schema
const onboardingFormSchema = yup.object({
  groupHome: yup.string().required("Group home is required"),
  room: yup.string().required("Room is required"),
  checkInDate: yup
    .mixed<Dayjs | null>()
    .required("Check-in date is required")
    .test("min-48-hours", "Check-in date must be at least 48 hours from today", function (value) {
      if (!value) return false;
      const today = dayjs().startOf("day");
      const selectedDate = dayjs(value).startOf("day");
      const hoursDifference = selectedDate.diff(today, "hour");
      return hoursDifference >= 48;
    }),
});

export interface OnboardingFormData {
  groupHome: string;
  room: string;
  checkInDate: Dayjs | null;
}

interface CompleteOnboardingFormProps {
  onSubmit: (data: OnboardingFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  groupHomes?: Array<{ value: string; label: string }>;
  rooms?: Array<{ value: string; label: string }>;
  onGroupHomeChange?: (groupHomeId: string) => void;
}

export interface CompleteOnboardingFormRef {
  resetForm: () => void;
}

const CompleteOnboardingForm = forwardRef<CompleteOnboardingFormRef, CompleteOnboardingFormProps>(
  (
    { onSubmit, onCancel, isLoading = false, groupHomes = [], rooms = [], onGroupHomeChange },
    ref
  ) => {
    const { hasPermission } = usePermission();
    const canCompleteOnboarding = hasPermission("onboarding.complete");

    const initialValues = {
      groupHome: "",
      room: "",
      checkInDate: null as Dayjs | null,
    };

    const {
      control,
      handleSubmit,
      setValue,
      reset,
      watch,
      formState: { errors },
    } = useForm<OnboardingFormData>({
      resolver: yupResolver(onboardingFormSchema) as any,
      defaultValues: initialValues,
      mode: "onChange",
    });

    const selectedGroupHome = watch("groupHome");

    // Reset room when group home changes
    useEffect(() => {
      if (selectedGroupHome) {
        setValue("room", "");
        if (onGroupHomeChange) {
          onGroupHomeChange(selectedGroupHome);
        }
      }
    }, [selectedGroupHome, setValue, onGroupHomeChange]);

    useImperativeHandle(ref, () => ({
      resetForm: () => {
        reset(initialValues);
      },
    }));

    const scrollToFirstError = useCallback((errors: Record<string, unknown>) => {
      const firstField = Object.keys(errors)[0];
      if (!firstField) return;
      setTimeout(() => {
        const el = document.querySelector<HTMLElement>(`[name="${firstField}"]`);
        if (!el) return;

        // For hidden inputs (e.g. MUI Select), scroll the parent wrapper instead
        const scrollTarget = el.offsetHeight === 0 ? el.closest('.MuiInputBase-root') || el.parentElement : el;
        scrollTarget?.scrollIntoView({ behavior: "smooth", block: "center" });

        // Focus the visible interactive element
        if (el instanceof HTMLInputElement && el.type === 'hidden') {
          const focusable = el.closest('.MuiInputBase-root')?.querySelector<HTMLElement>('[role="combobox"], [tabindex]');
          focusable?.focus();
        } else {
          el.focus();
        }
      }, 100);
    }, []);

    const handleFormSubmit = (data: OnboardingFormData) => {
      onSubmit(data);
    };

    const handleCancel = () => {
      reset(initialValues);
      onCancel();
    };

    // Calculate minimum date (48 hours from now)
    const minDate = dayjs().add(48, "hour");

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          backgroundColor: "#FFFFFF",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box
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
            Complete Onboarding
          </Typography>
          <Box
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
          </Box>
        </Box>

        {/* Form Content */}
        <Box
          component="form"
          sx={{
            flex: 1,
            overflow: "auto",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            {/* Select Group Home */}
            <Controller
              name="groupHome"
              control={control}
              render={({ field }) => (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <CustomLabel label="Select Group Home" isRequired />
                  <CustomSelect
                    placeholder="Select Group Home"
                    name="groupHome"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    items={groupHomes}
                    hasError={!!errors.groupHome}
                    errorMessage={errors.groupHome?.message}
                    enableDeselect={true}
                  />
                </Box>
              )}
            />

            {/* Select Room and Select Date Row */}
            <Grid
              container
              spacing={1.25}
            >
              {/* Select Room */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="room"
                  control={control}
                  render={({ field }) => (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <CustomLabel label="Select Room" isRequired />
                      <CustomSelect
                        placeholder="Select Room"
                        name="room"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        items={rooms}
                        hasError={!!errors.room}
                        errorMessage={errors.room?.message}
                        isDisabled={!selectedGroupHome || rooms.length === 0}
                        enableDeselect={true}
                      />
                    </Box>
                  )}
                />
              </Grid>

              {/* Select Date */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="checkInDate"
                  control={control}
                  render={({ field }) => (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <CustomLabel label="Select Date" isRequired />
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        label="Select Date"
                        minDate={minDate}
                        hasError={!!errors.checkInDate}
                        errorMessage={errors.checkInDate?.message}
                        format="MM/DD/YYYY"
                      />
                      <Typography
                        sx={{
                          fontSize: "12px",
                          color: "#A9ACA9",
                          marginTop: "-4px",
                        }}
                      >
                        Check-in date must be at least 48 hours from today.
                      </Typography>
                    </Box>
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        </Box>

        {/* Fixed Footer with Buttons */}
        <Box
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
            disabled={isLoading}
          >
            Cancel
          </CustomButton>
          <Tooltip
            title={!canCompleteOnboarding ? "You don't have permission" : ""}
            arrow
            disableHoverListener={canCompleteOnboarding}
          >
            <span>
              <CustomButton
                variant="primary"
                size="md"
                onClick={handleSubmit(handleFormSubmit)}
                disabled={isLoading || !canCompleteOnboarding}
              >
                {isLoading ? "Saving..." : "Mark as Completed"}
              </CustomButton>
            </span>
          </Tooltip>
        </Box>
      </Box>
    );
  }
);

CompleteOnboardingForm.displayName = "CompleteOnboardingForm";

export default CompleteOnboardingForm;
