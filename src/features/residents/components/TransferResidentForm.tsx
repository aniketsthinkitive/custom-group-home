import { useEffect, useImperativeHandle, forwardRef, useRef, useMemo, useState } from "react";
import { Typography, Grid } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import dayjs, { type Dayjs } from "dayjs";
import CustomInput from "../../../components/custom-input/custom-input";
import CustomButton from "../../../components/custom-buttons/custom-buttons";
import CustomLabel from "../../../components/custom-label/custom-label";
import CustomSelect from "../../../components/custom-select/custom-select";
import CustomAutoComplete from "../../../components/custom-auto-complete/custom-auto-complete";
import DatePickerField from "../../../components/date-picker-field/date-picker-field";
import CommonSnackbar from "../../../components/common-snackbar/common-snackbar";

// Form validation schema (without 48-hour validation)
const transferResidentFormSchema = yup.object({
  groupHome: yup.string().required("Group home is required"),
  room: yup.string().required("Room is required"),
  checkInDate: yup
    .mixed()
    .nullable()
    .required("Check-in date is required"),
});

export interface TransferResidentFormData {
  groupHome: string;
  room: string;
  checkInDate: Dayjs | null;
}

interface TransferResidentFormProps {
  onSubmit: (data: TransferResidentFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  groupHomes?: Array<{ value: string; label: string }>;
  rooms?: Array<{ value: string; label: string }>;
  onGroupHomeChange?: (groupHomeId: string) => void;
  initialValues?: Partial<TransferResidentFormData>;
  error?: string | null;
}

export interface TransferResidentFormRef {
  resetForm: () => void;
  setValues: (values: Partial<TransferResidentFormData>) => void;
}

const TransferResidentForm = forwardRef<TransferResidentFormRef, TransferResidentFormProps>(
  (
    { 
      onSubmit, 
      onCancel, 
      isLoading = false, 
      groupHomes = [], 
      rooms = [], 
      onGroupHomeChange,
      initialValues: propInitialValues,
      error: propError
    },
    ref
  ) => {
    const initialValues = {
      groupHome: propInitialValues?.groupHome || "",
      room: propInitialValues?.room || "",
      checkInDate: propInitialValues?.checkInDate || null as Dayjs | null,
    };

    const {
      control,
      handleSubmit,
      setValue,
      reset,
      watch,
      formState: { errors },
    } = useForm<TransferResidentFormData>({
      resolver: yupResolver(transferResidentFormSchema) as any,
      defaultValues: initialValues,
      mode: "onChange",
    });

    const selectedGroupHome = watch("groupHome");

    // Searchable group home options: CustomAutoComplete expects { key, value, child? }; filter by label for type-ahead
    const groupHomeAutocompleteOptions = useMemo(
      () =>
        groupHomes.map((h) => ({
          key: h.value,
          value: h.label,
          child: <Typography fontSize={14}>{h.label}</Typography>,
        })),
      [groupHomes],
    );

    // Snackbar state for error messages
    const [snackbar, setSnackbar] = useState<{
      isOpen: boolean;
      message: string;
      status: "success" | "error";
    }>({
      isOpen: false,
      message: "",
      status: "error",
    });

    // Show snackbar when error prop changes
    useEffect(() => {
      if (propError) {
        setSnackbar({
          isOpen: true,
          message: propError,
          status: "error",
        });
      }
    }, [propError]);

    // Initialize form with initial values when they change
    useEffect(() => {
      if (propInitialValues) {
        reset({
          groupHome: propInitialValues.groupHome || "",
          room: propInitialValues.room || "",
          checkInDate: propInitialValues.checkInDate || null,
        }, { keepDefaultValues: false });
        isInitialLoadRef.current = true; // Reset flag when initial values change
      }
    }, [propInitialValues?.groupHome, propInitialValues?.room, propInitialValues?.checkInDate, reset]);

    // Track if this is the initial load
    const isInitialLoadRef = useRef(true);
    
    // Reset room when group home changes (but preserve if it's the initial value)
    useEffect(() => {
      if (selectedGroupHome) {
        // On initial load, don't clear the room if it matches the initial value
        if (isInitialLoadRef.current && propInitialValues?.room && selectedGroupHome === propInitialValues?.groupHome) {
          // Keep the initial room value
          isInitialLoadRef.current = false;
        } else if (!isInitialLoadRef.current) {
          // Only clear room if group home changed after initial load
          setValue("room", "");
        }
        
        if (onGroupHomeChange) {
          onGroupHomeChange(selectedGroupHome);
        }
      }
    }, [selectedGroupHome, setValue, onGroupHomeChange, propInitialValues]);

    useImperativeHandle(ref, () => ({
      resetForm: () => {
        reset(initialValues);
        isInitialLoadRef.current = true;
      },
      setValues: (values: Partial<TransferResidentFormData>) => {
        reset({
          groupHome: values.groupHome !== undefined ? values.groupHome : initialValues.groupHome,
          room: values.room !== undefined ? values.room : initialValues.room,
          checkInDate: values.checkInDate !== undefined ? values.checkInDate : initialValues.checkInDate,
        });
        isInitialLoadRef.current = true;
      },
    }), [initialValues, reset]);

    const handleFormSubmit = (data: TransferResidentFormData) => {
      onSubmit(data);
    };

    const handleCancel = () => {
      reset(initialValues);
      onCancel();
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
            Transfer Resident
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
            sx={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            {/* Select Group Home - searchable type-ahead */}
            <Controller
              name="groupHome"
              control={control}
              render={({ field }) => (
                <Grid
                  size={{ xs: 12 }}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <CustomLabel label="Select Group Home" isRequired />
                  <CustomAutoComplete
                    placeholder="Select Group Home (type to search)"
                    value={field.value || ""}
                    onChange={(val) => field.onChange(val || "")}
                    options={groupHomeAutocompleteOptions}
                    hasError={!!errors.groupHome}
                    errorMessage={errors.groupHome?.message}
                    hasStartSearchIcon
                    bgWhite
                    disablePortal={false}
                    maxHeightForOptionsList={320}
                  />
                </Grid>
              )}
            />

            {/* Select Room and Select Date Row */}
            <Grid
              size={{ xs: 12 }}
              sx={{ display: "flex", gap: "10px" }}
              flexDirection={{
                xs: "column",
                sm: "column",
                md: "row",
                lg: "row",
              }}
            >
              {/* Select Room */}
              <Controller
                name="room"
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
                    <CustomLabel label="Select Room" isRequired/>
                    <CustomSelect
                      placeholder="Select Room"
                      name="room"
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      items={rooms}
                      hasError={!!errors.room}
                      errorMessage={errors.room?.message}
                      isDisabled={!selectedGroupHome || rooms.length === 0}
                    />
                  </Grid>
                )}
              />

              {/* Select Date */}
              <Controller
                name="checkInDate"
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
                    <CustomLabel label="Select Date" isRequired />
                    <DatePickerField
                      value={field.value}
                      onChange={field.onChange}
                      label="Select Date"
                      hasError={!!errors.checkInDate}
                      errorMessage={errors.checkInDate?.message}
                      format="MM/DD/YYYY"
                      disablePast={true}
                    />
                  </Grid>
                )}
              />
            </Grid>
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
          <CustomButton
            variant="secondary"
            size="md"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </CustomButton>
          <CustomButton
            variant="primary"
            size="md"
            onClick={handleSubmit(handleFormSubmit)}
            disabled={isLoading}
          >
            {isLoading ? "Transferring..." : "Transfer Resident"}
          </CustomButton>
        </Grid>

        {/* Snackbar for error messages */}
        <CommonSnackbar
          isOpen={snackbar.isOpen}
          message={snackbar.message}
          status={snackbar.status}
          onClose={() => setSnackbar({ ...snackbar, isOpen: false })}
          autoClose={true}
          autoCloseDelay={5000}
        />
      </Grid>
    );
  }
);

TransferResidentForm.displayName = "TransferResidentForm";

export default TransferResidentForm;

